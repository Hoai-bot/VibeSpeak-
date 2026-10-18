// src/screens/UserProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function UserProfileScreen({ onBack }: Props) {
  const [myHistory, setMyHistory] = useState<RoleplaySubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMyHistory();
  }, []);

  const loadMyHistory = async () => {
    setLoading(true);
    const allData = await fetchSubmissionsFromCloud();
    // Lấy 5 bài nộp mới nhất của người dùng
    setMyHistory(allData.slice(0, 5));
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👤 HỒ SƠ CHIẾN BINH</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* THÔNG TIN CHIẾN BINH */}
        <View style={styles.profileBox}>
          <Text style={styles.userName}>🎖 CHIẾN BINH VIBESPEAK</Text>
          <Text style={styles.userSub}>Cấp độ phản xạ: CEFR Practitioner (A1 - C2)</Text>
        </View>

        {/* BẢNG LỊCH SỬ CỦA TÔI */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>📜 LỊCH SỬ 5 BÀI THI GẦN NHẤT CỦA TÔI</Text>

          {loading ? (
            <Text style={styles.loadingText}>⏳ Đang tải lịch sử thi đấu từ Cloud...</Text>
          ) : myHistory.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có bài thi nào được ghi nhận. Hãy vào các Trạm để luyện tập nhé!</Text>
          ) : (
            myHistory.map((item, index) => (
              <View key={item.id || index} style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.modeText}>⚔️ [{item.mode.toUpperCase()} - {item.cefrLevel}]</Text>
                  <Text style={styles.scoreBadge}>{item.score} ĐIỂM</Text>
                </View>

                <Text style={styles.timeText}>⏱ {item.timestamp}</Text>
                <Text style={styles.transcriptText}>💬 "{item.transcript}"</Text>
                <Text style={styles.feedbackText}>💡 AI nhận xét: {item.feedback}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 14, fontWeight: '900' },
  profileBox: { backgroundColor: '#130628', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', marginBottom: 20 },
  userName: { color: '#00FFFF', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  userSub: { color: '#AAAABB', fontSize: 10 },
  historySection: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#332255' },
  sectionTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 12 },
  loadingText: { color: '#AAAABB', fontSize: 10, fontStyle: 'italic' },
  emptyText: { color: '#666688', fontSize: 10, fontStyle: 'italic' },
  historyCard: { backgroundColor: '#130A2A', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#221144' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scoreBadge: { color: '#39FF14', fontSize: 11, fontWeight: '900' },
  timeText: { color: '#666688', fontSize: 8, marginVertical: 3 },
  transcriptText: { color: '#FFF', fontSize: 10, fontStyle: 'italic', marginVertical: 3 },
  feedbackText: { color: '#FFD700', fontSize: 9, marginTop: 2 }
});