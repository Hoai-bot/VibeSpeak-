// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getUserStats, UserStats } from '../services/userService';
import { auth } from '../services/firebaseClient';

export default function ProfileScreen({ onBackToMap }: { onBackToMap: () => void }) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      const uid = auth.currentUser?.uid || 'GUEST_USER';
      const data = await getUserStats(uid);
      setStats(data);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToMap} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👤 HỒ SƠ CHIẾN BÍNH CYBER</Text>
      </View>

      {loading || !stats ? (
        <ActivityIndicator size="large" color="#00FFFF" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
          {/* USER CARD */}
          <View style={styles.userCard}>
            <Text style={styles.avatar}>🤖</Text>
            <Text style={styles.userName}>{stats.displayName}</Text>
            <Text style={styles.userTag}>[ LEVEL {stats.level} • CYBER LINGUIST ]</Text>
            
            <View style={styles.xpBarContainer}>
              <View style={[styles.xpBarFill, { width: `${Math.min(100, (stats.totalXp % 100))}%` }]} />
            </View>
            <Text style={styles.xpText}>⚡ {stats.totalXp} XP (Tới Level tiếp theo: {100 - (stats.totalXp % 100)} XP)</Text>
          </View>

          {/* GRID THÀNH TÍCH 2 TRẠM */}
          <Text style={styles.sectionTitle}>🏆 BẢNG THÀNH TÍCH ĐẤU TRƯỜNG</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statVal}>{stats.station1Completed}</Text>
              <Text style={styles.statLabel}>Bài Trạm 1 Đã Hoàn Thành</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statVal}>{stats.streak} Ngày</Text>
              <Text style={styles.statLabel}>Chuỗi Luyện Tập (Streak)</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⚔️</Text>
              <Text style={styles.statVal}>{stats.station2Wins}W - {stats.station2Losses}L</Text>
              <Text style={styles.statLabel}>Thắng/Thua Trạm 2 Arena</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🏅</Text>
              <Text style={styles.statVal}>
                {stats.station2Wins + stats.station2Losses > 0 
                  ? Math.round((stats.station2Wins / (stats.station2Wins + stats.station2Losses)) * 100) 
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>Tỷ Lệ Thắng Đối Kháng</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={onBackToMap}>
            <Text style={styles.actionBtnText}>🚀 TIẾP TỤC CHIẾN ĐẤU TẠI MAP</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  userCard: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  avatar: { fontSize: 44, marginBottom: 6 },
  userName: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  userTag: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 12 },
  xpBarContainer: { width: '100%', height: 10, backgroundColor: '#1A0B2E', borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: '#FF007F', marginBottom: 6 },
  xpBarFill: { height: '100%', backgroundColor: '#FF007F' },
  xpText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', alignSelf: 'flex-start', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  statBox: { backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', width: '48%', alignItems: 'center', marginBottom: 12 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statVal: { color: '#00FFFF', fontSize: 15, fontWeight: '900', marginBottom: 2 },
  statLabel: { color: '#8888AA', fontSize: 9, textAlign: 'center' },
  actionBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  actionBtnText: { color: '#000', fontSize: 12, fontWeight: '900' }
});