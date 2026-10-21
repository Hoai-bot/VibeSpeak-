// src/screens/TeacherDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  const [submissions, setSubmissions] = useState<RoleplaySubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('ALL'); // Bộ lọc lớp

  useEffect(() => {
    loadTeacherData();
  }, [filterClass]);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      const data = await fetchSubmissionsFromCloud(filterClass);
      setSubmissions(data || []);
    } catch (e) {
      console.warn("Lỗi nạp dữ liệu Bảng Giáo viên:", e);
    } finally {
      setLoading(false);
    }
  };

  // Danh sách các Lớp duy nhất để làm bộ lọc
  const availableClasses = Array.from(
    new Set(submissions.map((s) => s.className || 'LỚP CHUNG'))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 BẢNG ĐIỂM GIÁO VIÊN</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* KHU VỰC BỘ LỌC THEO LỚP */}
        <View style={styles.filterBox}>
          <Text style={styles.filterLabel}>🏫 LỌC BÀI NỘP THEO MÃ LỚP:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 6 }}>
            <TouchableOpacity 
              style={[styles.classChip, filterClass === 'ALL' && styles.classChipActive]}
              onPress={() => setFilterClass('ALL')}
            >
              <Text style={[styles.chipText, filterClass === 'ALL' && styles.chipTextActive]}>TẤT CẢ LỚP</Text>
            </TouchableOpacity>

            {availableClasses.map((clsName) => (
              <TouchableOpacity 
                key={clsName}
                style={[styles.classChip, filterClass === clsName && styles.classChipActive]}
                onPress={() => setFilterClass(clsName)}
              >
                <Text style={[styles.chipText, filterClass === clsName && styles.chipTextActive]}>{clsName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* NÚT CẬP NHẬT DỮ LIỆU */}
        <TouchableOpacity style={styles.refreshBtn} onPress={loadTeacherData}>
          <Text style={styles.refreshBtnText}>🔄 CẬP NHẬT DỮ LIỆU MỚI NHẤT</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
        ) : submissions.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có bài nộp nào thuộc lớp được chọn.</Text>
        ) : (
          /* DANH SÁCH BÀI NỘP CHI TIẾT CỦA SINH VIÊN */
          submissions.map((item, index) => {
            const safeMode = String(item.mode || 'SOLO').toUpperCase();
            const safeLevel = String(item.cefrLevel || 'A1').toUpperCase();
            const safeClass = String(item.className || 'LỚP CHUNG').toUpperCase();

            return (
              <View key={item.id || index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>👥 {item.studentName || item.pairName}</Text>
                    {/* 🎯 HIỂN THỊ MÃ LỚP RÕ RÀNG */}
                    <View style={styles.classBadgeContainer}>
                      <Text style={styles.classBadgeText}>🏫 LỚP: {safeClass}</Text>
                    </View>
                  </View>
                  <Text style={styles.scoreText}>{item.score} ĐIỂM TỔNG</Text>
                </View>

                <Text style={styles.metaText}>
                  ⏱ {item.timestamp} | [CHẾ ĐỘ: {safeMode} - LEVEL: {safeLevel}]
                </Text>

                <Text style={styles.transcriptText}>💬 Lời thoại ghi nhận: "{item.transcript}"</Text>

                {/* TRÌNH PHÁT AUDIO DÀNH CHO GIÁO VIÊN */}
                {item.audioUrl && item.audioUrl.length > 10 ? (
                  <View style={styles.audioContainer}>
                    <Text style={styles.audioLabel}>🎧 Nghe lại bản thu âm của sinh viên:</Text>
                    {React.createElement('audio', {
                      controls: true,
                      playsInline: true,
                      src: item.audioUrl,
                      style: { width: '100%', marginTop: 6, height: 36 }
                    })}
                  </View>
                ) : (
                  <Text style={styles.noAudioText}>🔇 Không có file âm thanh hoặc file bị lỗi format</Text>
                )}

                <Text style={styles.feedbackText}>💡 Đánh giá & Chi tiết phân vai: {item.feedback}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#39FF14', fontSize: 13, fontWeight: '900' },
  filterBox: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FF007F', marginBottom: 12 },
  filterLabel: { color: '#FFD700', fontSize: 10, fontWeight: '900' },
  classChip: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255', marginRight: 6 },
  classChipActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  chipText: { color: '#8888AA', fontSize: 9, fontWeight: 'bold' },
  chipTextActive: { color: '#FFF' },
  refreshBtn: { backgroundColor: '#00FFFF', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  refreshBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  emptyText: { color: '#8888AA', fontSize: 10, textAlign: 'center', marginVertical: 20 },
  card: { backgroundColor: '#130A2A', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#332255' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  studentName: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  classBadgeContainer: { backgroundColor: '#2E0B3A', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FF007F' },
  classBadgeText: { color: '#FF007F', fontSize: 9, fontWeight: '900' },
  scoreText: { color: '#39FF14', fontSize: 14, fontWeight: '900' },
  metaText: { color: '#AAAABB', fontSize: 8, marginVertical: 6 },
  transcriptText: { color: '#FFF', fontSize: 10, fontStyle: 'italic', marginBottom: 8 },
  audioContainer: { backgroundColor: '#0D0620', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 8 },
  audioLabel: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  noAudioText: { color: '#666688', fontSize: 8, fontStyle: 'italic', marginBottom: 6 },
  feedbackText: { color: '#FFD700', fontSize: 9, marginTop: 4 }
});