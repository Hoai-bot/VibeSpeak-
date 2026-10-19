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
    const data = await fetchSubmissionsFromCloud();
    setSubmissions(data);
    setLoading(false);
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
        <Text style={styles.refreshBtnText}>{loading ? '⏳ ĐANG TẢI DỮ LIỆU MỚI...' : '🔄 CẬP NHẬT DỮ LIỆU MỚI NHẤT'}</Text>
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
                <Text style={styles.studentName}>👤 {item.pairName || item.studentName}</Text>
                <Text style={styles.scoreText}>{item.score} ĐIỂM</Text>
              </View>

              <Text style={styles.metaText}>⏱ {item.timestamp} | [{item.mode.toUpperCase()} - {item.cefrLevel}]</Text>
              <Text style={styles.transcriptText}>💬 "{item.transcript}"</Text>

              {/* PHÁT AUDIO BÀI THU ÂM */}
              {item.audioUrl && item.audioUrl.length > 0 ? (
                <View style={styles.audioBox}>
                  <Text style={styles.audioLabel}>🎧 Nghe lại bài thu âm:</Text>
                  <audio controls src={item.audioUrl} style={{ width: '100%', marginTop: 5 }} />
                </View>
              ) : (
                <Text style={styles.noAudioText}>⚠️ Không có file ghi âm đính kèm</Text>
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
  audioBox: { backgroundColor: '#130A2A', padding: 8, borderRadius: 8, marginVertical: 6 },
  audioLabel: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  noAudioText: { color: '#666688', fontSize: 8, fontStyle: 'italic', marginVertical: 4 },
  feedbackText: { color: '#FFD700', fontSize: 9, marginTop: 4 }
});