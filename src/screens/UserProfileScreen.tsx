// src/screens/UserProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { fetchSubmissionsFromCloud, fetchTopLeaderboard, RoleplaySubmission } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function UserProfileScreen({ onBack }: Props) {
  const [myHistory, setMyHistory] = useState<RoleplaySubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'leaderboard'>('history');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const historyData = await fetchSubmissionsFromCloud();
      const topData = await fetchTopLeaderboard();

      setMyHistory(historyData ? historyData.slice(0, 10) : []);
      setLeaderboard(topData || []);
    } catch (e) {
      console.warn("⚠️ Lỗi loadData UserProfileScreen:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👤 HỒ SƠ & BẢNG VÀNG</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* THÔNG TIN CHIẾN BINH */}
        <View style={styles.profileBox}>
          <Text style={styles.userName}>🎖 CHIẾN BINH VIBESPEAK</Text>
          <Text style={styles.userSub}>Cấp độ phản xạ: CEFR Practitioner (A1 - C2)</Text>
        </View>

        {/* CỤM NÚT CHUYỂN TAB */}
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>📜 LỊCH SỬ CỦA TÔI</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'leaderboard' && styles.tabBtnActiveLeaderboard]} 
            onPress={() => setActiveTab('leaderboard')}
          >
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>🏆 TOP BẢNG VÀNG</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>⏳ Đang đồng bộ dữ liệu từ Supabase Cloud...</Text>
        ) : activeTab === 'history' ? (
          /* PHẦN LỊCH SỬ CỦA TÔI */
          <View style={styles.sectionContainer}>
            {myHistory.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có bài thi nào. Hãy vào các Trạm để thi đấu ngay!</Text>
            ) : (
              myHistory.map((item, index) => {
                // 🛡️ CHUYỂN ĐỔI CHUỖI AN TOÀN TRÁNH TRẮNG MÀN HÌNH
                const safeMode = String(item?.mode || 'SOLO').toUpperCase();
                const safeLevel = String(item?.cefrLevel || 'A1').toUpperCase();

                return (
                  <View key={item?.id || index} style={styles.historyCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.modeText}>⚔️ [{safeMode} - {safeLevel}]</Text>
                      <Text style={styles.scoreBadge}>{item?.score || 0} ĐIỂM</Text>
                    </View>
                    <Text style={styles.timeText}>⏱ {item?.timestamp || 'Mới đây'}</Text>
                    <Text style={styles.transcriptText}>💬 "{item?.transcript || 'Không có lời thoại'}"</Text>
                    <Text style={styles.feedbackText}>💡 AI nhận xét: {item?.feedback || 'Chưa có nhận xét'}</Text>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* PHẦN TOP BẢNG VÀNG LỚP HỌC */
          <View style={styles.sectionContainer}>
            {leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có dữ liệu Bảng vàng.</Text>
            ) : (
              leaderboard.map((item, index) => {
                // 🛡️ BỌC ÉP KIỂU CHUỖI AN TOÀN
                const displayName = String(item?.name || item?.pairName || item?.studentName || 'Chiến binh');
                const displayRank = item?.rank || (index + 1);

                return (
                  <View key={item?.id || index} style={styles.leaderboardCard}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{displayRank}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.leaderName}>👤 {displayName}</Text>
                      <Text style={styles.leaderMeta}>
                        ⏱ Ngày ghi danh: {item?.date || item?.timestamp || 'Realtime'}
                      </Text>
                    </View>

                    <Text style={styles.leaderScore}>{item?.score || 0} ĐIỂM</Text>
                  </View>
                );
              })
            )}
          </View>
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
  title: { color: '#FF007F', fontSize: 13, fontWeight: '900' },
  profileBox: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', marginBottom: 15 },
  userName: { color: '#00FFFF', fontSize: 13, fontWeight: '900', marginBottom: 4 },
  userSub: { color: '#AAAABB', fontSize: 9 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  tabBtn: { backgroundColor: '#0D0620', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '48%', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  tabBtnActiveLeaderboard: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  tabText: { color: '#8888AA', fontSize: 10, fontWeight: '900' },
  tabTextActive: { color: '#000' },
  loadingText: { color: '#AAAABB', fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  emptyText: { color: '#666688', fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginTop: 15 },
  sectionContainer: { width: '100%' },
  historyCard: { backgroundColor: '#130A2A', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#221144' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scoreBadge: { color: '#39FF14', fontSize: 11, fontWeight: '900' },
  timeText: { color: '#666688', fontSize: 8, marginVertical: 3 },
  transcriptText: { color: '#FFF', fontSize: 10, fontStyle: 'italic', marginVertical: 3 },
  feedbackText: { color: '#FFD700', fontSize: 9, marginTop: 2 },
  leaderboardCard: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#FFD700', flexDirection: 'row', alignItems: 'center' },
  rankBadge: { backgroundColor: '#FFD700', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rankText: { color: '#000', fontWeight: '900', fontSize: 11 },
  leaderName: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  leaderMeta: { color: '#AAAABB', fontSize: 8, marginTop: 2 },
  leaderScore: { color: '#39FF14', fontSize: 13, fontWeight: '900' }
});