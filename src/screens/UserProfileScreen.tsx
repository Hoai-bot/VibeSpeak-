// src/screens/UserProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { fetchSubmissionsFromCloud, RoleplaySubmission } from '../services/userService';

const LOCAL_HISTORY_KEY = 'vibespeak_user_submissions_history';

export default function UserProfileScreen({ onBack }: { onBack: () => void }) {
  const [userSubmissions, setUserSubmissions] = useState<RoleplaySubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUserProfileData();
  }, []);

  // 🎯 HÀM LOAD DỮ LIỆU AN TOÀN TRỰC TIẾP - KHÔNG LO LỖI IMPORT
  const loadUserProfileData = async () => {
    setLoading(true);
    let localSubmissions: RoleplaySubmission[] = [];

    // 1. Đọc lịch sử lưu tạm ở máy học viên (Local Storage)
    try {
      const localData = localStorage.getItem(LOCAL_HISTORY_KEY);
      if (localData) {
        localSubmissions = JSON.parse(localData) || [];
      }
    } catch (e) {
      console.warn("Lỗi đọc local history:", e);
    }

    // 2. Tải bài nộp từ Supabase Cloud
    try {
      const cloudSubmissions = await fetchSubmissionsFromCloud('ALL');
      
      // Ghép hợp nhất cả Local và Cloud
      const combinedMap = new Map<string, RoleplaySubmission>();

      [...localSubmissions, ...cloudSubmissions].forEach((item) => {
        const key = `${item.studentName}_${item.score}_${item.timestamp}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });

      setUserSubmissions(Array.from(combinedMap.values()));
    } catch (err) {
      console.warn("⚠️ Lỗi loadData UserProfileScreen:", err);
      setUserSubmissions(localSubmissions);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🎖 HỒ SƠ CHIẾN BINH & LỊCH SỬ THI ĐẤU</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
      ) : userSubmissions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>⚠️ Chưa ghi nhận lịch sử thi đấu nào.</Text>
          <Text style={styles.emptySubText}>
            Hãy tham gia thực hành tại Trạm 2 để tích lũy điểm thưởng và lưu lịch sử!
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={styles.summaryText}>🏆 Tổng số bài thực hành đã nộp: {userSubmissions.length}</Text>
          
          {userSubmissions.map((sub, index) => (
            <View key={sub.id || index} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.modeText}>🔥 {sub.mode} [{sub.cefrLevel}]</Text>
                <Text style={styles.scoreText}>{sub.score} ĐIỂM</Text>
              </View>
              <Text style={styles.timeText}>⏱ {sub.timestamp}</Text>
              {sub.transcript ? (
                <Text style={styles.transcriptText}>💬 "{sub.transcript}"</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 40 },
  backBtn: { alignSelf: 'flex-start', padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 15 },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginBottom: 15 },
  emptyCard: { backgroundColor: '#130A2A', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold' },
  emptySubText: { color: '#8888AA', fontSize: 9, marginTop: 4, textAlign: 'center' },
  summaryText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  historyCard: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scoreText: { color: '#39FF14', fontSize: 11, fontWeight: '900' },
  timeText: { color: '#8888AA', fontSize: 8, marginTop: 2 },
  transcriptText: { color: '#DDD', fontSize: 9, fontStyle: 'italic', marginTop: 6 }
});