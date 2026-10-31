// src/screens/TeacherDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';
import { exportSubmissionsToExcel } from '../utils/exportExcelHelper';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

type ModeFilter = 'ALL' | 'solo' | 'relay' | 'roleplay';
type GradeFilter = 'ALL' | 'EXCELLENT' | 'PASS' | 'NEED_WORK';

export default function TeacherDashboardScreen({ onBack }: Props) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [teacherAssignedClasses, setTeacherAssignedClasses] = useState<string[]>([]);
  
  const [submissions, setSubmissions] = useState<RoleplaySubmission[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedMode, setSelectedMode] = useState<ModeFilter>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<GradeFilter>('ALL');
  const [customClassSearch, setCustomClassSearch] = useState<string>('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 🎯 1. KIỂM TRA PHÂN QUYỀN GIÁO VIÊN
  useEffect(() => {
    const checkTeacherAuth = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          setIsTeacher(true);
          setSelectedClass('ALL');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsTeacher(false);
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        const meta = user.user_metadata || {};
        const role = String(meta.role || '').toLowerCase();
        
        const hasAdminRole = role === 'admin';
        const hasTeacherRole = role === 'teacher' || hasAdminRole;
        setIsAdmin(hasAdminRole);
        setIsTeacher(hasTeacherRole);

        if (hasTeacherRole) {
          let assigned: string[] = [];
          if (Array.isArray(meta.assigned_classes)) {
            assigned = meta.assigned_classes.map((c: string) => c.trim().toUpperCase());
          } else if (typeof meta.assigned_classes === 'string') {
            assigned = meta.assigned_classes.split(',').map((c: string) => c.trim().toUpperCase()).filter(Boolean);
          } else if (meta.class_code) {
            assigned = [meta.class_code.trim().toUpperCase()];
          }

          setTeacherAssignedClasses(assigned);

          // Khôi phục lớp đã chọn trước đó từ localStorage
          const savedClass = typeof window !== 'undefined' ? localStorage.getItem('vibe_teacher_selected_class') : null;
          if (savedClass) {
            setSelectedClass(savedClass);
          } else if (hasAdminRole || assigned.length === 0) {
            setSelectedClass('ALL');
          } else {
            setSelectedClass(assigned[0]);
          }

          await loadDashboardData();
        }
      } catch (err) {
        console.warn("Lỗi kiểm tra quyền giáo viên:", err);
      } finally {
        setLoading(false);
      }
    };

    checkTeacherAuth();

    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('realtime_teacher_dashboard')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'submissions' },
          async () => {
            await loadDashboardData();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await fetchSubmissionsFromCloud('ALL');
      setSubmissions(data || []);
    } catch (e) {
      console.warn("Lỗi tải Bảng điểm:", e);
    }
  };

  const cleanClassName = (rawClass?: string) => {
    if (!rawClass) return 'LỚP CHUNG';
    let cls = String(rawClass).trim();
    if (cls.toUpperCase().startsWith('CLASS:')) {
      cls = cls.substring(6).trim();
    }
    return cls || 'LỚP CHUNG';
  };

  const handleSelectClass = (cls: string) => {
    setSelectedClass(cls);
    setIsClassDropdownOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_teacher_selected_class', cls);
    }
  };

  // 🎯 2. DANH SÁCH LỚP HỢP LỆ VÀ SẮP XẾP GỌN GÀNG
  const rawAvailableClasses = Array.from(
    new Set(submissions.map((s) => cleanClassName(s.className).toUpperCase()))
  ).filter(Boolean).sort();

  const availableClasses = isAdmin || teacherAssignedClasses.length === 0
    ? rawAvailableClasses
    : rawAvailableClasses.filter(cls => teacherAssignedClasses.includes(cls));

  // 🎯 3. LỌC BÀI NỘP CHUẨN XÁC: TÌM KIẾM KHÔNG BỊ TRÀN SANG LỚP KHÁC
  const filteredSubmissions = submissions.filter((item) => {
    const itemClass = cleanClassName(item.className).toUpperCase();
    const studentName = String(item.studentName || '').toUpperCase();
    const itemScore = Number(item.score) || 0;
    const itemMode = String(item.mode || '').toLowerCase();

    // 1. Phân quyền giáo viên
    if (!isAdmin && teacherAssignedClasses.length > 0 && !teacherAssignedClasses.includes(itemClass)) {
      return false;
    }

    // 2. Lọc theo lớp được chọn
    if (selectedClass !== 'ALL' && itemClass !== selectedClass.toUpperCase()) {
      return false;
    }

    // 3. Lọc theo chế độ làm bài (Mode)
    if (selectedMode !== 'ALL' && itemMode !== selectedMode.toLowerCase()) {
      return false;
    }

    // 4. Lọc theo phổ điểm
    if (selectedGrade === 'EXCELLENT' && itemScore < 85) return false;
    if (selectedGrade === 'PASS' && (itemScore < 70 || itemScore >= 85)) return false;
    if (selectedGrade === 'NEED_WORK' && itemScore >= 70) return false;

    // 5. Tìm kiếm sinh viên theo tên hoặc MSSV TRONG PHẠM VI LỚP ĐANG CHỌN
    if (customClassSearch.trim().length > 0) {
      const query = customClassSearch.trim().toUpperCase();
      return studentName.includes(query) || itemClass.includes(query);
    }

    return true;
  });

  // 🎯 4. THỐNG KÊ LỚP HỌC
  const computeClassAnalytics = (data: RoleplaySubmission[]) => {
    if (!data || data.length === 0) {
      return {
        avgScore: 0,
        passRate: 0,
        total: 0,
        excellentCount: 0,
        passCount: 0,
        needsWorkCount: 0,
        issues: [] as string[]
      };
    }

    const total = data.length;
    const totalScore = data.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
    const avgScore = Math.round(totalScore / total);

    const excellentCount = data.filter(s => s.score >= 85).length;
    const passCount = data.filter(s => s.score >= 70 && s.score < 85).length;
    const needsWorkCount = data.filter(s => s.score < 70).length;
    const passRate = Math.round(((excellentCount + passCount) / total) * 100);

    const issueKeywords = [
      { key: "ending sound", label: "Nuốt âm cuối (Ending sounds: /s/, /t/, /d/)" },
      { key: "âm", label: "Phát âm lệch cặp nguyên/phụ âm tương đồng" },
      { key: "ngữ pháp", label: "Còn mắc lỗi ngữ pháp / chia sai động từ" },
      { key: "wpm", label: "Tốc độ nói chậm, còn nhiều khoảng ngừng ngập" },
      { key: "luyện", label: "Cần tăng phản xạ từ vựng tự nhiên hơn" }
    ];

    const detected: string[] = [];
    const allFeedback = data.map(s => (s.feedback || '').toLowerCase()).join(" ");

    issueKeywords.forEach(item => {
      if (allFeedback.includes(item.key)) {
        detected.push(item.label);
      }
    });

    if (detected.length === 0) {
      detected.push("Phát âm rõ ràng, nhịp độ và từ vựng của lớp khá đồng đều!");
    }

    return {
      avgScore,
      passRate,
      total,
      excellentCount,
      passCount,
      needsWorkCount,
      issues: detected.slice(0, 3)
    };
  };

  const analytics = computeClassAnalytics(filteredSubmissions);

  if (!loading && !isTeacher) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔒 TRUY CẬP BỊ GIỚI HẠN</Text>
        </View>

        <View style={styles.restrictedCard}>
          <Text style={styles.restrictedIcon}>⛔</Text>
          <Text style={styles.restrictedTitle}>KHU VỰC DÀNH CHO GIÁO VIÊN</Text>
          <Text style={styles.restrictedDesc}>
            Tài khoản hiện tại của bạn không có quyền Giáo viên (Role: Teacher) để xem bảng điểm học viên.
          </Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={onBack}>
            <Text style={styles.backHomeBtnText}>QUAY LẠI ĐẤU TRƯỜNG</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 BẢNG ĐIỂM GIÁO VIÊN</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* BANNER THÔNG TIN GIÁO VIÊN */}
        <View style={styles.teacherBadgeCard}>
          <Text style={styles.teacherBadgeName}>
            👨‍🏫 GIÁO VIÊN: <Text style={{ color: '#39FF14' }}>{currentUser?.user_metadata?.full_name || currentUser?.email || 'Thầy/Cô'}</Text>
          </Text>
          <Text style={styles.teacherBadgeRole}>
            {isAdmin 
              ? '👑 Quyền: QUẢN TRỊ VIÊN TOÀN TRƯỜNG' 
              : `🏫 Đang quản lý: ${availableClasses.length} lớp được phân công`}
          </Text>
        </View>

        {/* BỘ LỌC CHỌN LỚP NÂNG CAO */}
        <View style={styles.filterCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.filterTitle}>🏫 LỚP ĐANG XEM: <Text style={{ color: '#39FF14' }}>{selectedClass === 'ALL' ? 'TẤT CẢ LỚP' : selectedClass}</Text></Text>
            
            {/* Nút bấm mở nhanh danh mục thả xuống */}
            <TouchableOpacity 
              style={styles.dropdownToggleBtn}
              onPress={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
            >
              <Text style={styles.dropdownToggleText}>
                {isClassDropdownOpen ? '▲ ĐÓNG DANH MỤC' : '▼ CHỌN NHANH LỚP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* MENU CHỌN LỚP NHANH DẠNG THẢ XUỐNG KHI CÓ NHIỀU LỚP */}
          {isClassDropdownOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={[styles.dropdownItem, selectedClass === 'ALL' && styles.dropdownItemActive]}
                onPress={() => handleSelectClass('ALL')}
              >
                <Text style={[styles.dropdownItemText, selectedClass === 'ALL' && styles.dropdownItemTextActive]}>
                  🌐 TẤT CẢ LỚP ({submissions.length} bài nộp)
                </Text>
              </TouchableOpacity>

              {availableClasses.map((cls) => {
                const count = submissions.filter(s => cleanClassName(s.className).toUpperCase() === cls).length;
                return (
                  <TouchableOpacity
                    key={cls}
                    style={[styles.dropdownItem, selectedClass === cls && styles.dropdownItemActive]}
                    onPress={() => handleSelectClass(cls)}
                  >
                    <Text style={[styles.dropdownItemText, selectedClass === cls && styles.dropdownItemTextActive]}>
                      🏫 Lớp {cls} ({count} bài nộp)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* DÃY CHIP CUỘN NGANG TIỆN DỤNG */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            <TouchableOpacity
              style={[styles.chip, selectedClass === 'ALL' && styles.chipActive]}
              onPress={() => handleSelectClass('ALL')}
            >
              <Text style={[styles.chipText, selectedClass === 'ALL' && styles.chipTextActive]}>
                🌐 TẤT CẢ ({submissions.length})
              </Text>
            </TouchableOpacity>

            {availableClasses.map((cls) => {
              const countInClass = submissions.filter(s => cleanClassName(s.className).toUpperCase() === cls).length;
              return (
                <TouchableOpacity
                  key={cls}
                  style={[styles.chip, selectedClass === cls && styles.chipActive]}
                  onPress={() => handleSelectClass(cls)}
                >
                  <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>
                    🏫 {cls} ({countInClass})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* BỘ LỌC CHẾ ĐỘ THI (MODE) & PHỔ ĐIỂM */}
          <View style={styles.subFilterRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subFilterLabel}>🎯 CHẾ ĐỘ THI:</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                {(['ALL', 'solo', 'relay', 'roleplay'] as ModeFilter[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.miniChip, selectedMode === m && styles.miniChipActive]}
                    onPress={() => setSelectedMode(m)}
                  >
                    <Text style={[styles.miniChipText, selectedMode === m && styles.miniChipTextActive]}>
                      {m === 'ALL' ? 'TẤT CẢ' : m.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.subFilterLabel}>🏆 XẾP LOẠI:</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                {(['ALL', 'EXCELLENT', 'PASS', 'NEED_WORK'] as GradeFilter[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.miniChip, selectedGrade === g && styles.miniChipActive]}
                    onPress={() => setSelectedGrade(g)}
                  >
                    <Text style={[styles.miniChipText, selectedGrade === g && styles.miniChipTextActive]}>
                      {g === 'ALL' ? 'TẤT CẢ' : g === 'EXCELLENT' ? 'GIỎI' : g === 'PASS' ? 'ĐẠT' : 'YẾU'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Ô TÌM KIẾM SINH VIÊN BÊN TRONG LỚP */}
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder={`🔎 Tìm sinh viên trong ${selectedClass === 'ALL' ? 'toàn trường' : selectedClass}...`}
              placeholderTextColor="#777"
              value={customClassSearch}
              onChangeText={setCustomClassSearch}
            />
          </View>
        </View>

        {/* BẢNG THỐNG KÊ VÀ XUẤT FILE EXCEL */}
        {filteredSubmissions.length > 0 && (
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeaderRow}>
              <Text style={styles.analyticsTitle}>
                📈 PHÂN TÍCH: [{selectedClass === 'ALL' ? 'TẤT CẢ LỚP' : selectedClass}] ({filteredSubmissions.length} BÀI)
              </Text>
              
              <TouchableOpacity 
                style={styles.exportBtn} 
                onPress={() => exportSubmissionsToExcel(filteredSubmissions, `Bang_Diem_${selectedClass || 'Lop'}`)}
              >
                <Text style={styles.exportBtnText}>📥 XUẤT EXCEL</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>SỐ BÀI NỘP</Text>
                <Text style={styles.kpiValue}>{analytics.total}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>ĐIỂM TRUNG BÌNH</Text>
                <Text style={[styles.kpiValue, { color: analytics.avgScore >= 70 ? '#39FF14' : '#FFD700' }]}>
                  {analytics.avgScore}/100
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>TỶ LỆ ĐẠT (PASS)</Text>
                <Text style={[styles.kpiValue, { color: analytics.passRate >= 70 ? '#39FF14' : '#FF0055' }]}>
                  {analytics.passRate}%
                </Text>
              </View>
            </View>

            <View style={styles.distributionBox}>
              <Text style={styles.distributionLabel}>
                🏆 Xuất sắc: {analytics.excellentCount} | 👍 Đạt: {analytics.passCount} | ⚠️ Cần rèn: {analytics.needsWorkCount}
              </Text>
              <View style={styles.distributionTrack}>
                <View style={{ flex: analytics.excellentCount || 0.05, backgroundColor: '#39FF14' }} />
                <View style={{ flex: analytics.passCount || 0.05, backgroundColor: '#00FFFF' }} />
                <View style={{ flex: analytics.needsWorkCount || 0.05, backgroundColor: '#FF0055' }} />
              </View>
            </View>

            <View style={styles.issuesContainer}>
              <Text style={styles.issuesHeader}>⚠️ ĐIỂM CẦN LƯU Ý CỦA LỚP:</Text>
              {analytics.issues.map((issue, idx) => (
                <Text key={idx} style={styles.issueItem}>• {issue}</Text>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={loadDashboardData}>
          <Text style={styles.refreshBtnText}>🔄 CẬP NHẬT BẢNG ĐIỂM MỚI NHẤT</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
        ) : filteredSubmissions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>⚠️ Chưa ghi nhận bài nộp nào thuộc bộ lọc này.</Text>
            <Text style={styles.emptySubText}>
              Hãy nhắc sinh viên điền chính xác Mã Lớp ở Trạm 2 để hệ thống tự động gom vào đây.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.summaryText}>
              📋 Danh sách {filteredSubmissions.length} bài nộp ({selectedClass === 'ALL' ? 'TẤT CẢ LỚP' : `LỚP ${selectedClass}`}):
            </Text>

            {filteredSubmissions.map((sub, index) => (
              <View key={sub.id || index} style={styles.subCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>
                        {sub.rank === 1 ? '🥇 TOP 1' : sub.rank === 2 ? '🥈 TOP 2' : sub.rank === 3 ? '🥉 TOP 3' : `#${sub.rank || index + 1}`}
                      </Text>
                    </View>
                    <Text style={styles.studentName}>👤 {sub.studentName || 'Học viên'}</Text>
                  </View>
                  
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{sub.score} ĐIỂM</Text>
                  </View>
                </View>

                <Text style={styles.metaText}>
                  🏫 Lớp: <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>{cleanClassName(sub.className)}</Text> | Chế độ: {sub.mode} | Cấp độ: {sub.cefrLevel}
                </Text>
                <Text style={styles.timeText}>⏱ {sub.timestamp}</Text>

                <View style={styles.audioPlayerSection}>
                  <Text style={styles.audioSectionTitle}>🎧 NGHE LẠI BÀI NÓI CỦA SINH VIÊN:</Text>
                  {sub.audioUrl ? (
                    React.createElement('audio', { 
                      controls: true, 
                      src: sub.audioUrl, 
                      style: { width: '100%', marginTop: '6px', height: '35px' } 
                    })
                  ) : (
                    <Text style={{ color: '#FF8800', fontSize: 10, fontStyle: 'italic', marginTop: 4 }}>
                      ⚠️ Bản thu không đồng bộ được lên máy chủ do mạng Wi-Fi yếu (Chỉ lưu điểm & Text).
                    </Text>
                  )}
                </View>

                {sub.transcript ? (
                  <View style={styles.transcriptBox}>
                    <Text style={styles.transcriptLabel}>💬 Transcript bài nói:</Text>
                    <Text style={styles.transcriptContent}>"{sub.transcript}"</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A051B', padding: 16, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { backgroundColor: '#1F103C', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  
  teacherBadgeCard: { backgroundColor: '#170B30', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#39FF14', marginBottom: 12 },
  teacherBadgeName: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  teacherBadgeRole: { color: '#00FFFF', fontSize: 9, marginTop: 3 },

  filterCard: { backgroundColor: '#170B30', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', marginBottom: 12 },
  filterTitle: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  dropdownToggleBtn: { backgroundColor: '#221144', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: '#00FFFF' },
  dropdownToggleText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  dropdownMenu: { backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', padding: 6, marginVertical: 8, maxHeight: 180 },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#221144' },
  dropdownItemActive: { backgroundColor: 'rgba(57, 255, 20, 0.15)' },
  dropdownItemText: { color: '#DDD', fontSize: 10 },
  dropdownItemTextActive: { color: '#39FF14', fontWeight: 'bold' },

  chip: { backgroundColor: '#0D0620', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#332255', marginRight: 6 },
  chipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  chipTextActive: { color: '#000', fontWeight: '900' },

  subFilterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginVertical: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#221144' },
  subFilterLabel: { color: '#AAAABB', fontSize: 8, fontWeight: 'bold' },
  miniChip: { backgroundColor: '#0D0620', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4, borderWidth: 1, borderColor: '#332255' },
  miniChipActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  miniChipText: { color: '#8888AA', fontSize: 8, fontWeight: 'bold' },
  miniChipTextActive: { color: '#000' },

  searchBox: { marginTop: 8 },
  searchInput: { backgroundColor: '#0D0620', color: '#FFF', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF', fontSize: 10 },
  
  restrictedCard: { backgroundColor: '#170B30', padding: 25, borderRadius: 16, borderWidth: 2, borderColor: '#FF0055', alignItems: 'center', marginTop: 40 },
  restrictedIcon: { fontSize: 40, marginBottom: 10 },
  restrictedTitle: { color: '#FF0055', fontSize: 14, fontWeight: '900', marginBottom: 10 },
  restrictedDesc: { color: '#DDD', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 20 },
  backHomeBtn: { backgroundColor: '#FF0055', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  backHomeBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  analyticsCard: { backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 14 },
  analyticsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  analyticsTitle: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  exportBtn: { backgroundColor: '#39FF14', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  exportBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 10 },
  kpiBox: { flex: 1, backgroundColor: '#0D0620', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  kpiLabel: { color: '#8888AA', fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  kpiValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  distributionBox: { width: '100%', marginBottom: 10 },
  distributionLabel: { color: '#AAAABB', fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  distributionTrack: { height: 6, width: '100%', borderRadius: 3, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#221144' },
  issuesContainer: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#FF0055' },
  issuesHeader: { color: '#FF0055', fontSize: 9, fontWeight: '900', marginBottom: 4 },
  issueItem: { color: '#FFD700', fontSize: 9, lineHeight: 14 },

  refreshBtn: { backgroundColor: '#00FFFF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  refreshBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  emptyBox: { alignItems: 'center', padding: 30, backgroundColor: '#170B30', borderRadius: 12 },
  emptyText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  emptySubText: { color: '#8888AA', fontSize: 9, marginTop: 6, textAlign: 'center' },
  summaryText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  subCard: { backgroundColor: '#170B30', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankBadge: { backgroundColor: '#0D0620', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#FFD700' },
  rankBadgeText: { color: '#FFD700', fontSize: 9, fontWeight: '900' },
  studentName: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold' },
  scoreBadge: { backgroundColor: '#0D0620', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14' },
  scoreText: { color: '#39FF14', fontSize: 11, fontWeight: '900' },
  metaText: { color: '#DDD', fontSize: 8, marginTop: 4 },
  timeText: { color: '#8888AA', fontSize: 8, marginTop: 2 },
  audioPlayerSection: { backgroundColor: '#0D0620', padding: 8, borderRadius: 6, marginTop: 8, borderWidth: 1, borderColor: '#00FFFF' },
  audioSectionTitle: { color: '#00FFFF', fontSize: 8, fontWeight: 'bold' },
  transcriptBox: { backgroundColor: '#0D0620', padding: 8, borderRadius: 6, marginTop: 8 },
  transcriptLabel: { color: '#FFD700', fontSize: 8, fontWeight: 'bold' },
  transcriptContent: { color: '#CCC', fontSize: 8, marginTop: 2, fontStyle: 'italic' }
});