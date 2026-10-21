import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function TeacherDashboard({ onBack }: Props) {
  const [submissions, setSubmissions] = useState<RoleplaySubmission[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [customClassSearch, setCustomClassSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Tải tất cả bài nộp mới nhất từ Supabase Cloud
      const data = await fetchSubmissionsFromCloud('ALL');
      setSubmissions(data || []);
    } catch (e) {
      console.warn("Lỗi tải Bảng điểm Giáo viên:", e);
    } finally {
      setLoading(false);
    }
  };

  // Làm sạch tên lớp
  const cleanClassName = (rawClass?: string) => {
    if (!rawClass) return 'LỚP CHUNG';
    let cls = rawClass.trim();
    if (cls.toUpperCase().startsWith('CLASS:')) {
      cls = cls.substring(6).trim();
    }
    return cls || 'LỚP CHUNG';
  };

  // Trích xuất danh sách tất cả các Mã Lớp có trong dữ liệu
  const availableClasses = Array.from(
    new Set(submissions.map((s) => cleanClassName(s.className)))
  ).filter(Boolean);

  // Lọc danh sách bài nộp theo Mã Lớp được chọn hoặc nhập tìm kiếm
  const filteredSubmissions = submissions.filter((item) => {
    const itemClass = cleanClassName(item.className).toUpperCase();
    
    if (customClassSearch.trim().length > 0) {
      return itemClass.includes(customClassSearch.trim().toUpperCase());
    }

    if (selectedClass === 'ALL') return true;
    return itemClass === selectedClass.toUpperCase();
  });

  return (
    <View style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 BẢNG ĐIỂM DÀNH CHO GIÁO VIÊN</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* KHU VỰC CHỌN VÀ TÌM KIẾM MÃ LỚP */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>🏫 LỌC THEO MÃ LỚP HỌC VIÊN:</Text>
          
          {/* Nút danh sách các lớp tìm thấy */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
            <TouchableOpacity
              style={[styles.chip, selectedClass === 'ALL' && !customClassSearch && styles.chipActive]}
              onPress={() => {
                setSelectedClass('ALL');
                setCustomClassSearch('');
              }}
            >
              <Text style={[styles.chipText, selectedClass === 'ALL' && !customClassSearch && styles.chipTextActive]}>
                🌐 TẤT CẢ CÁC LỚP ({submissions.length})
              </Text>
            </TouchableOpacity>

            {availableClasses.map((cls) => (
              <TouchableOpacity
                key={cls}
                style={[styles.chip, selectedClass === cls && !customClassSearch && styles.chipActive]}
                onPress={() => {
                  setSelectedClass(cls);
                  setCustomClassSearch('');
                }}
              >
                <Text style={[styles.chipText, selectedClass === cls && !customClassSearch && styles.chipTextActive]}>
                  🏫 {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Ô Nhập Mã Lớp Tìm Kiếm Trực Tiếp */}
          <View style={styles.searchBox}>
            <Text style={styles.searchLabel}>🔎 Hoặc nhập Mã Lớp thủ công:</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Ví dụ: IC123, CDCBMN..."
              placeholderTextColor="#777"
              value={customClassSearch}
              onChangeText={(text) => {
                setCustomClassSearch(text);
                setSelectedClass('CUSTOM');
              }}
            />
          </View>
        </View>

        {/* NÚT TẢI LẠI DỮ LIỆU MỚI NHẤT */}
        <TouchableOpacity style={styles.refreshBtn} onPress={loadDashboardData}>
          <Text style={styles.refreshBtnText}>🔄 CẬP NHẬT DỮ LIỆU BÀI NỘP MỚI NHẤT</Text>
        </TouchableOpacity>

        {/* KẾT QUẢ BẢNG ĐIỂM */}
        {loading ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
        ) : filteredSubmissions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>⚠️ Chưa ghi nhận bài nộp nào cho Mã Lớp này.</Text>
            <Text style={styles.emptySubText}>
              Hãy dặn sinh viên điền đúng Mã Lớp khi bấm nộp bài thực hành!
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.summaryText}>
              📋 Hợp lệ: {filteredSubmissions.length} bài nộp
            </Text>

            {filteredSubmissions.map((sub, index) => (
              <View key={sub.id || index} style={styles.subCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.studentName}>👤 {sub.studentName || 'Học viên'}</Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{sub.score} ĐIỂM</Text>
                  </View>
                </View>

                <Text style={styles.metaText}>
                  🏫 Lớp: <Text style={{ color: '#FFD700' }}>{cleanClassName(sub.className)}</Text> | Chế độ: {sub.mode} | Cấp độ: {sub.cefrLevel}
                </Text>
                <Text style={styles.timeText}>⏱ {sub.timestamp}</Text>

                {sub.transcript ? (
                  <View style={styles.transcriptBox}>
                    <Text style={styles.transcriptLabel}>💬 Transcript bài nói:</Text>
                    <Text style={styles.transcriptContent}>{sub.transcript}</Text>
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
  filterCard: { backgroundColor: '#170B30', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', marginBottom: 12 },
  filterTitle: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  chip: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#332255', marginRight: 6 },
  chipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  chipTextActive: { color: '#000' },
  searchBox: { marginTop: 8 },
  searchLabel: { color: '#AAAABB', fontSize: 8, marginBottom: 4 },
  searchInput: { backgroundColor: '#0D0620', color: '#FFF', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF', fontSize: 10 },
  refreshBtn: { backgroundColor: '#00FFFF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  refreshBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  emptyBox: { alignItems: 'center', padding: 30, backgroundColor: '#170B30', borderRadius: 12 },
  emptyText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold' },
  emptySubText: { color: '#8888AA', fontSize: 9, marginTop: 4, textAlign: 'center' },
  summaryText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  subCard: { backgroundColor: '#170B30', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentName: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold' },
  scoreBadge: { backgroundColor: '#0D0620', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14' },
  scoreText: { color: '#39FF14', fontSize: 11, fontWeight: '900' },
  metaText: { color: '#DDD', fontSize: 8, marginTop: 4 },
  timeText: { color: '#8888AA', fontSize: 8, marginTop: 2 },
  transcriptBox: { backgroundColor: '#0D0620', padding: 8, borderRadius: 6, marginTop: 8 },
  transcriptLabel: { color: '#FFD700', fontSize: 8, fontWeight: 'bold' },
  transcriptContent: { color: '#CCC', fontSize: 8, marginTop: 2 }
});