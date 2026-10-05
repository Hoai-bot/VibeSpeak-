// src/screens/LeaderboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getLeaderboardData, LeaderboardUser } from '../services/leaderboardService';

interface Props {
  onBack: () => void;
  userXp?: number;
}

export default function LeaderboardScreen({ onBack, userXp = 3500 }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    const data = getLeaderboardData(userXp);
    setLeaderboard(data);
  }, [userXp]);

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Vàng
    if (rank === 2) return '#C0C0C0'; // Bạc
    if (rank === 3) return '#CD7F32'; // Đồng
    return '#8888AA';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 BẢNG XẾP HẠNG RAID BOSS</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>⚡ TỔNG SÁT THƯƠNG DIỆT BOSS CỦA BẠN</Text>
          <Text style={styles.summaryScore}>{userXp} HP DAMAGE</Text>
          <Text style={styles.summarySub}>Đăng nhập và luyện tập Trạm 3 & 4 để thăng hạng Top Cyber Knight!</Text>
        </View>

        <View style={styles.boardContainer}>
          <Text style={styles.boardHeader}>🔥 TOP CAO THỦ PHÁT ÂM CHIẾN TRƯỜNG</Text>

          {leaderboard.map((item) => {
            const badgeColor = getRankBadgeColor(item.rank);

            return (
              <View 
                key={item.rank} 
                style={[
                  styles.rankRow, 
                  item.isCurrentUser && styles.currentUserRow
                ]}
              >
                <View style={styles.rankBadgeContainer}>
                  <Text style={[styles.rankNumber, { color: badgeColor }]}>
                    {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                  </Text>
                </View>

                <Text style={styles.avatar}>{item.avatar}</Text>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.userName, item.isCurrentUser && styles.currentUserName]}>
                    {item.name}
                  </Text>
                  <Text style={styles.damageText}>Sát thương: {item.totalDamage.toLocaleString()} HP</Text>
                </View>

                <View style={styles.cefrBadge}>
                  <Text style={styles.cefrText}>{item.levelBadge}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  summaryCard: { backgroundColor: '#1A0B2E', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 20 },
  summaryTitle: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 6 },
  summaryScore: { color: '#39FF14', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  summarySub: { color: '#AAAABB', fontSize: 10, textAlign: 'center' },
  boardContainer: { backgroundColor: '#0D0620', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%' },
  boardHeader: { color: '#00FFFF', fontSize: 11, fontWeight: '900', marginBottom: 14, textAlign: 'center' },
  rankRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#120826', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#221133' },
  currentUserRow: { backgroundColor: '#2E0B3A', borderColor: '#39FF14', borderWidth: 2 },
  rankBadgeContainer: { width: 32, alignItems: 'center' },
  rankNumber: { fontSize: 13, fontWeight: '900' },
  avatar: { fontSize: 20, marginLeft: 6 },
  userName: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  currentUserName: { color: '#39FF14' },
  damageText: { color: '#8888AA', fontSize: 9, marginTop: 2 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  cefrText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
});