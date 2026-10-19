// src/screens/TeacherDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function TeacherDashboardScreen({ onBack }: Props) {
  const [submissions, setSubmissions] = useState<RoleplaySubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSubmissionsFromCloud();
      setSubmissions(data || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu giáo viên:", err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm mở trực tiếp file audio ở tab mới để nghe mà không bị đứt stream
  const handleOpenAudioTab = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 BẢNG ĐIỂM GIÁO VIÊN (REALTIME)</Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={loadData} disabled={loading}>
        <Text style={styles.refreshBtnText}>
          {loading ? '⏳ ĐANG TẢI DỮ LIỆU MỚI...' : '🔄 CẬP NHẬT DỮ LIỆU MỚI NHẤT'}
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginTop: 30 }} />
        ) : submissions.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có bài nộp nào trên Supabase Cloud.</Text>
        ) : (
          submissions.map((item, index) => (
            <View key={item.id || index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.studentName}>👤 {item.pairName || item.studentName || 'Sinh viên'}</Text>
                <Text style={styles.scoreText}>{item.score} ĐIỂM</Text>
              </View>

              <Text style={styles.metaText}>
                ⏱ {item.timestamp} | [{(item.mode || 'SOLO').toUpperCase()} - {item.cefrLevel || 'A1'}]
              </Text>
              <Text style={styles.transcriptText}>💬 "{item.transcript}"</Text>

              {/* 🎧 TRÌNH PHÁT ÂM THANH NÂNG CẤP CHỐNG ĐỨT STREAM */}
              {item.audioUrl && item.audioUrl.length > 5 ? (
                <View style={styles.audioBox}>
                  <Text style={styles.audioLabel}>🎧 Nghe lại bài thu âm của sinh viên:</Text>
                  
                  {/* Trình phát Audio HTML5 cấu hình nạp sẵn dữ liệu full stream */}
                  {React.createElement('audio', {
                    controls: true,
                    preload: 'auto',
                    controlsList: 'nodownload',
                    src: item.audioUrl,
                    style: { width: '100%', marginTop: 6, height: 38 },
                    onError: (e: any) => {
                      console.warn("Lỗi load stream audio:", e);
                    }
                  })}

                  {/* CÁC NÚT MỞ VÀ TẢI FILE DỰ PHÒNG 100% */}
                  <View style={styles.btnRow}>
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => handleOpenAudioTab(item.audioUrl)}
                    >
                      <Text style={styles.actionBtnText}>🔗 MỞ TRONG TAB MỚI</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, { borderColor: '#39FF14' }]}
                      onPress={() => handleOpenAudioTab(item.audioUrl)}
                    >
                      <Text style={[styles.actionBtnText, { color: '#39FF14' }]}>📥 TẢI FILE ÂM THANH GỐC</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.noAudioText}>⚠️ Không có file ghi âm đính kèm (Lưu dạng Blob tạm hoặc không có URL)</Text>
              )}

              <Text style={styles.feedbackText}>💡 Nhận xét: {item.feedback}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  refreshBtn: { backgroundColor: '#39FF14', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  refreshBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  emptyText: { color: '#AAAABB', textAlign: 'center', marginTop: 20 },
  card: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#332255', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentName: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  scoreText: { color: '#39FF14', fontSize: 12, fontWeight: '900' },
  metaText: { color: '#8888AA', fontSize: 9, marginVertical: 4 },
  transcriptText: { color: '#FFF', fontSize: 10, fontStyle: 'italic', marginBottom: 6 },
  audioBox: { backgroundColor: '#130A2A', padding: 10, borderRadius: 8, marginVertical: 6, borderWidth: 1, borderColor: '#00FFFF' },
  audioLabel: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  btnRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#1A0B2E', borderRadius: 4, borderWidth: 1, borderColor: '#00FFFF' },
  actionBtnText: { color: '#00FFFF', fontSize: 8, fontWeight: 'bold' },
  noAudioText: { color: '#FF0055', fontSize: 8, fontStyle: 'italic', marginVertical: 4 },
  feedbackText: { color: '#FFD700', fontSize: 9, marginTop: 4 }
});