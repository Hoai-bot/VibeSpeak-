// src/screens/TeacherDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

interface SubmissionRecord {
  id: string;
  student_code: string;
  student_name: string;
  class_name: string;
  score: number;
  mode: string;
  cefr_level: string;
  transcript: string;
  audio_url: string;
  feedback: string;
  created_at: string;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [classList, setClassList] = useState<string[]>([]);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        Alert.alert("Thông báo", "Supabase client chưa được cấu hình.");
        setLoading(false);
        return;
      }

      // Lấy danh sách bài nộp
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn("Lỗi tải submissions:", error.message);
      } else if (data) {
        setSubmissions(data as SubmissionRecord[]);
        // Trích xuất danh sách lớp học duy nhất
        const classes = Array.from(new Set(data.map((item: any) => item.class_name || 'Lớp Chung'))).filter(Boolean);
        setClassList(classes as string[]);
      }
    } catch (err) {
      console.error("Lỗi khi kết nối lấy dữ liệu Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Lọc theo lớp
  const filteredSubmissions = selectedClass === 'ALL'
    ? submissions
    : submissions.filter(s => (s.class_name || 'Lớp Chung') === selectedClass);

  // Tính toán số liệu thống kê
  const totalSubmissions = filteredSubmissions.length;
  const avgScore = totalSubmissions > 0
    ? Math.round(filteredSubmissions.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / totalSubmissions)
    : 0;
  const passRate = totalSubmissions > 0
    ? Math.round((filteredSubmissions.filter(s => Number(s.score) >= 70).length / totalSubmissions) * 100)
    : 0;

  // Xuất file CSV báo cáo điểm
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      Alert.alert("Thông báo", "Không có dữ liệu bài nộp để xuất!");
      return;
    }

    const headers = ["MSSV", "Ho va Ten", "Lop Hoc", "Diem So", "Cap Do", "Ky Nang", "Thoi Gian"];
    const rows = filteredSubmissions.map(s => [
      `"${s.student_code || 'GUEST'}"`,
      `"${s.student_name || 'N/A'}"`,
      `"${s.class_name || 'Lop Chung'}"`,
      s.score,
      `"${s.cefr_level || 'B1'}"`,
      `"${s.mode || 'SPEAKING'}"`,
      `"${new Date(s.created_at).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    if (typeof window !== 'undefined') {
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Bang_Diem_${selectedClass}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert("Xuất dữ liệu", "Đã tạo bảng điểm CSV.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏫 CỔNG GIẢNG VIÊN & BÁO CÁO ĐÀO TẠO</Text>
        <TouchableOpacity onPress={handleExportCSV} style={styles.exportBtn}>
          <Text style={styles.exportBtnText}>📥 XUẤT CSV</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Khối Thống Kê Tổng Quan (Metrics Cards) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SỐ BÀI NỘP</Text>
            <Text style={styles.statValue}>{totalSubmissions}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ĐIỂM TRUNG BÌNH</Text>
            <Text style={[styles.statValue, { color: avgScore >= 70 ? '#39FF14' : '#FFD700' }]}>
              {avgScore}đ
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TỶ LỆ ĐẠT CHUẨN</Text>
            <Text style={[styles.statValue, { color: passRate >= 75 ? '#00FFFF' : '#FF0055' }]}>
              {passRate}%
            </Text>
          </View>
        </View>

        {/* Thanh chọn lớp học */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>📌 LỌC THEO LỚP HỌC:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedClass === 'ALL' && styles.filterChipActive]}
              onPress={() => setSelectedClass('ALL')}
            >
              <Text style={[styles.filterChipText, selectedClass === 'ALL' && styles.filterChipTextActive]}>
                Tất Cả Lớp
              </Text>
            </TouchableOpacity>
            {classList.map((cls, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.filterChip, selectedClass === cls && styles.filterChipActive]}
                onPress={() => setSelectedClass(cls)}
              >
                <Text style={[styles.filterChipText, selectedClass === cls && styles.filterChipTextActive]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Danh sách bảng điểm sinh viên */}
        <View style={styles.tableBox}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, { flex: 1.2 }]}>SINH VIÊN</Text>
            <Text style={[styles.thText, { flex: 1 }]}>LỚP / KỸ NĂNG</Text>
            <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>ĐIỂM</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>AUDIO / CHI TIẾT</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
          ) : filteredSubmissions.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có bài nộp nào thuộc lớp học này.</Text>
          ) : (
            filteredSubmissions.map((item) => {
              const isPass = Number(item.score) >= 70;
              return (
                <View key={item.id} style={styles.tableRow}>
                  {/* Cột 1: Thông tin sinh viên */}
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.studentNameText} numberOfLines={1}>
                      {item.student_name || 'Chiến Binh Shadow'}
                    </Text>
                    <Text style={styles.studentCodeText}>
                      MSSV: {item.student_code || 'GUEST'}
                    </Text>
                  </View>

                  {/* Cột 2: Lớp học & Kỹ năng */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classText} numberOfLines={1}>{item.class_name || 'Lớp Chung'}</Text>
                    <Text style={styles.modeText}>{item.mode || 'STATION_1'} • {item.cefr_level || 'B1'}</Text>
                  </View>

                  {/* Cột 3: Điểm số */}
                  <View style={{ flex: 0.8, alignItems: 'center' }}>
                    <Text style={[styles.scoreBadge, { color: isPass ? '#39FF14' : '#FF0055' }]}>
                      {item.score}đ
                    </Text>
                    <Text style={styles.statusText}>{isPass ? 'ĐẠT' : 'CHƯA ĐẠT'}</Text>
                  </View>

                  {/* Cột 4: Nghe lại Audio */}
                  <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                    {item.audio_url ? (
                      <TouchableOpacity 
                        style={styles.listenBtn}
                        onPress={() => setCurrentPlayingAudio(currentPlayingAudio === item.audio_url ? null : item.audio_url)}
                      >
                        <Text style={styles.listenBtnText}>
                          {currentPlayingAudio === item.audio_url ? '⏹ DỪNG' : '🎧 NGHE'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.noAudioText}>Không có audio</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Khung Audio Player nổi khi bấm nghe bài sinh viên */}
        {currentPlayingAudio && (
          <View style={styles.floatingAudioPlayer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={styles.floatingPlayerTitle}>🎧 ĐANG NGHE BẢN THU CỦA HỌC VIÊN:</Text>
              <TouchableOpacity onPress={() => setCurrentPlayingAudio(null)}>
                <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ ĐÓNG</Text>
              </TouchableOpacity>
            </View>
            {React.createElement(
              'div',
              {
                style: { width: '100%' },
                onMouseDown: (e: any) => e.stopPropagation(),
                onTouchStart: (e: any) => e.stopPropagation(),
                onMouseUp: (e: any) => e.stopPropagation(),
                onTouchEnd: (e: any) => e.stopPropagation(),
              },
              React.createElement('audio', {
                autoPlay: true,
                controls: true,
                src: currentPlayingAudio,
                style: { width: '100%', height: 35 }
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  headerTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', textAlign: 'center', flex: 1, marginHorizontal: 8 },
  exportBtn: { padding: 8, backgroundColor: '#39FF14', borderRadius: 8 },
  exportBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#221133', alignItems: 'center' },
  statLabel: { color: '#8888AA', fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  filterSection: { marginBottom: 14 },
  filterLabel: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  filterScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1A0B2E', marginRight: 8, borderWidth: 1, borderColor: '#332255' },
  filterChipActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  filterChipText: { color: '#AAAABB', fontSize: 10, fontWeight: 'bold' },
  filterChipTextActive: { color: '#FFF' },

  tableBox: { backgroundColor: '#0D0620', borderRadius: 14, borderWidth: 1.5, borderColor: '#00FFFF', padding: 10 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#332255', paddingBottom: 8, marginBottom: 6 },
  thText: { color: '#FFD700', fontSize: 9, fontWeight: '900' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A0B2E' },
  studentNameText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  studentCodeText: { color: '#8888AA', fontSize: 9 },
  classText: { color: '#00FFFF', fontSize: 10, fontWeight: '600' },
  modeText: { color: '#AAAABB', fontSize: 8 },
  scoreBadge: { fontSize: 13, fontWeight: '900' },
  statusText: { fontSize: 7, color: '#8888AA', fontWeight: 'bold' },
  listenBtn: { backgroundColor: '#1A0B2E', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  listenBtnText: { color: '#00FFFF', fontSize: 9, fontWeight: '900' },
  noAudioText: { color: '#444466', fontSize: 8, fontStyle: 'italic' },
  emptyText: { color: '#8888AA', fontSize: 11, textAlign: 'center', marginVertical: 20 },

  floatingAudioPlayer: { marginTop: 15, backgroundColor: '#070212', borderRadius: 12, borderWidth: 1.5, borderColor: '#39FF14', padding: 12 },
  floatingPlayerTitle: { color: '#39FF14', fontSize: 9, fontWeight: '900' }
});