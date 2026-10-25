// src/screens/TeacherDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';
import { exportSubmissionsToExcel } from '../utils/exportExcelHelper';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [teacherAssignedClasses, setTeacherAssignedClasses] = useState<string[]>([]);
  
  const [submissions, setSubmissions] = useState<RoleplaySubmission[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [customClassSearch, setCustomClassSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // 🎯 1. KIỂM TRA PHÂN QUYỀN GIÁO VIÊN KHI MỞ MÀN HÌNH
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
        
        // Kiểm tra xem là Admin hay Giáo viên
        const hasAdminRole = role === 'admin';
        const hasTeacherRole = role === 'teacher' || hasAdminRole;
        setIsAdmin(hasAdminRole);
        setIsTeacher(hasTeacherRole);

        if (hasTeacherRole) {
          // Lấy danh sách lớp giáo viên được giao phụ trách (mảng hoặc chuỗi phân tách bằng dấu phẩy)
          let assigned: string[] = [];
          if (Array.isArray(meta.assigned_classes)) {
            assigned = meta.assigned_classes.map((c: string) => c.trim().toUpperCase());
          } else if (typeof meta.assigned_classes === 'string') {
            assigned = meta.assigned_classes.split(',').map((c: string) => c.trim().toUpperCase()).filter(Boolean);
          } else if (meta.class_code) {
            assigned = [meta.class_code.trim().toUpperCase()];
          }

          setTeacherAssignedClasses(assigned);

          // Nếu là Admin thì mặc định chọn ALL, nếu là GV thì chọn lớp đầu tiên trong danh sách phụ trách
          if (hasAdminRole || assigned.length === 0) {
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

    // Lắng nghe realtime từ Supabase khi có bài nộp mới
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

  // 🎯 2. DANH SÁCH LỚP HỢP LỆ THEO QUYỀN HẠN CỦA GIÁO VIÊN
  const rawAvailableClasses = Array.from(
    new Set(submissions.map((s) => cleanClassName(s.className).toUpperCase()))
  ).filter(Boolean);

  // Nếu là Admin: hiển thị toàn bộ lớp. Nếu là GV: chỉ hiển thị các lớp mình phụ trách
  const availableClasses = isAdmin || teacherAssignedClasses.length === 0
    ? rawAvailableClasses
    : rawAvailableClasses.filter(cls => teacherAssignedClasses.includes(cls));

  // 🎯 3. LỌC BÀI NỘP CHẶT CHẼ THEO PHẠM VI LỚP PHỤ TRÁCH
  const filteredSubmissions = submissions.filter((item) => {
    const itemClass = cleanClassName(item.className).toUpperCase();
    const studentName = String(item.studentName || '').toUpperCase();

    // Rào chắn bảo mật: Nếu không phải Admin, bài nộp KHÔNG thuộc lớp phụ trách sẽ bị loại bỏ ngay
    if (!isAdmin && teacherAssignedClasses.length > 0 && !teacherAssignedClasses.includes(itemClass)) {
      return false;
    }

    if (customClassSearch.trim().length > 0) {
      const query = customClassSearch.trim().toUpperCase();
      return itemClass.includes(query) || studentName.includes(query);
    }

    if (selectedClass === 'ALL' && isAdmin) return true;
    return itemClass === selectedClass.toUpperCase();
  });

  // 🎯 THUẬT TOÁN TÍNH TOÁN CLASS ANALYTICS
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
      { key: "nối", label: "Chưa nối âm mượt mà giữa các từ (Linking sounds)" },
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

  // 🛑 GIAO DIỆN CHẶN NẾU KHÔNG PHẢI GIÁO VIÊN
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
          <Text style={styles.restrictedHint}>
            💡 Vui lòng đăng nhập bằng tài khoản Giáo viên được cấp hoặc liên hệ Quản trị viên để phân quyền lớp phụ trách.
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
        {/* BANNER THÔNG TIN PHÂN QUYỀN GIÁO VIÊN */}
        <View style={styles.teacherBadgeCard}>
          <Text style={styles.teacherBadgeName}>
            👨‍🏫 GIÁO VIÊN: <Text style={{ color: '#39FF14' }}>{currentUser?.user_metadata?.full_name || currentUser?.email || 'Thầy/Cô'}</Text>
          </Text>
          <Text style={styles.teacherBadgeRole}>
            {isAdmin 
              ? '👑 Quyền: QUẢN TRỊ VIÊN TOÀN TRƯỜNG' 
              : `🏫 Lớp phụ trách: ${teacherAssignedClasses.length > 0 ? teacherAssignedClasses.join(', ') : 'Chưa gán lớp (Mặc định)'}`}
          </Text>
        </View>

        {/* CARD CHỌN LỚP ĐƯỢC PHÂN CÔNG */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>🏫 CÁC LỚP BẠN PHỤ TRÁCH:</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.chip, selectedClass === 'ALL' && !customClassSearch && styles.chipActive]}
                onPress={() => {
                  setSelectedClass('ALL');
                  setCustomClassSearch('');
                }}
              >
                <Text style={[styles.chipText, selectedClass === 'ALL' && !customClassSearch && styles.chipTextActive]}>
                  🌐 TOÀN TRƯỜNG ({submissions.length})
                </Text>
              </TouchableOpacity>
            )}

            {availableClasses.map((cls) => {
              const countInClass = submissions.filter(s => cleanClassName(s.className).toUpperCase() === cls).length;
              return (
                <TouchableOpacity
                  key={cls}
                  style={[styles.chip, selectedClass === cls && !customClassSearch && styles.chipActive]}
                  onPress={() => {
                    setSelectedClass(cls);
                    setCustomClassSearch('');
                  }}
                >
                  <Text style={[styles.chipText, selectedClass === cls && !customClassSearch && styles.chipTextActive]}>
                    🏫 {cls} ({countInClass})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.searchBox}>
            <Text style={styles.searchLabel}>🔎 TÌM SINH VIÊN TRONG LỚP PHỤ TRÁCH:</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Gõ tên hoặc MSSV sinh viên cần tìm..."
              placeholderTextColor="#777"
              value={customClassSearch}
              onChangeText={(text) => {
                setCustomClassSearch(text);
              }}
            />
          </View>
        </View>

        {/* KHỐI THỐNG KÊ LỚP HỌC & XUẤT EXCEL CHUẨN */}
        {filteredSubmissions.length > 0 && (
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeaderRow}>
              <Text style={styles.analyticsTitle}>
                📈 PHÂN TÍCH LỚP: [{selectedClass === 'ALL' ? 'TOÀN TRƯỜNG' : selectedClass}]
              </Text>
              
              <TouchableOpacity 
                style={styles.exportBtn} 
                onPress={() => exportSubmissionsToExcel(filteredSubmissions, `Bang_Diem_${selectedClass || 'Lop'}`)}
              >
                <Text style={styles.exportBtnText}>📥 XUẤT BẢNG ĐIỂM EXCEL</Text>
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
              <Text style={styles.issuesHeader}>⚠️ ĐIỂM CẦN LƯU Ý PHỔ BIẾN CỦA LỚP:</Text>
              {analytics.issues.map((issue, idx) => (
                <Text key={idx} style={styles.issueItem}>• {issue}</Text>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={loadDashboardData}>
          <Text style={styles.refreshBtnText}>🔄 CẬP NHẬT DỮ LIỆU MỚI NHẤT</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
        ) : filteredSubmissions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>⚠️ Chưa ghi nhận bài nộp nào thuộc lớp này.</Text>
            <Text style={styles.emptySubText}>
              Hãy giao bài tập tại Trạm 2 hoặc 4 cho sinh viên làm để ghi nhận kết quả.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.summaryText}>
              📋 Danh sách {filteredSubmissions.length} bài nộp của lớp {selectedClass}:
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

                {sub.audioUrl ? (
                  <View style={styles.audioPlayerSection}>
                    <Text style={styles.audioSectionTitle}>🎧 NGHE LẠI BÀI NÓI CỦA SINH VIÊN:</Text>
                    {React.createElement('audio', { 
                      controls: true, 
                      src: sub.audioUrl, 
                      style: { width: '100%', marginTop: '4px', height: '36px' } 
                    })}
                  </View>
                ) : null}

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
  
  // Teacher Info Badge
  teacherBadgeCard: { backgroundColor: '#170B30', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#39FF14', marginBottom: 12 },
  teacherBadgeName: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  teacherBadgeRole: { color: '#00FFFF', fontSize: 9, marginTop: 3 },

  filterCard: { backgroundColor: '#170B30', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', marginBottom: 12 },
  filterTitle: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  chip: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#332255', marginRight: 6 },
  chipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  chipTextActive: { color: '#000' },
  searchBox: { marginTop: 8 },
  searchLabel: { color: '#AAAABB', fontSize: 8, marginBottom: 4 },
  searchInput: { backgroundColor: '#0D0620', color: '#FFF', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF', fontSize: 10 },
  
  // Restricted Access Screen
  restrictedCard: { backgroundColor: '#170B30', padding: 25, borderRadius: 16, borderWidth: 2, borderColor: '#FF0055', alignItems: 'center', marginTop: 40 },
  restrictedIcon: { fontSize: 40, marginBottom: 10 },
  restrictedTitle: { color: '#FF0055', fontSize: 14, fontWeight: '900', marginBottom: 10 },
  restrictedDesc: { color: '#DDD', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 12 },
  restrictedHint: { color: '#FFD700', fontSize: 9, textAlign: 'center', lineHeight: 14, marginBottom: 20 },
  backHomeBtn: { backgroundColor: '#FF0055', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  backHomeBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  // Analytics Styles
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