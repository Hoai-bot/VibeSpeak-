// src/screens/MainMapScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Props {
  onSelectStation: (stationId: string) => void;
  onOpenProfile: () => void;
}

const STATIONS = [
  {
    id: 'station1',
    title: '🎯 TRẠM 1: PHẢN XẠ ÂM (DRILL ARENA)',
    desc: 'Luyện Minimal Pairs, Linking Sounds & Tongue Twisters chuẩn CEFR A1-C1',
    color: '#00FFFF',
    badge: 'LUYỆN CÁ NHÂN'
  },
  {
    id: 'station2',
    title: '⚔️ TRẠM 2: THI ĐẤU ĐỐI KHÁNG (ALL-IN ARENA)',
    desc: 'Thi đấu phản xạ nói 1v1 Realtime hoặc Đấu trí cùng Cyber Bot AI',
    color: '#FF007F',
    badge: 'PVP REALTIME'
  }
];

export default function MainMapScreen({ onSelectStation, onOpenProfile }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>⚡ VIBESPEAK ARENA</Text>
        <TouchableOpacity style={styles.profileBtn} onPress={onOpenProfile}>
          <Text style={styles.profileText}>👤 HỒ SƠ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <Text style={styles.subtitle}>CHỌN ĐẤU TRƯỜNG PHẢN XẠ PHÁT ÂM</Text>

        {STATIONS.map((st) => (
          <TouchableOpacity
            key={st.id}
            style={[styles.stationCard, { borderColor: st.color }]}
            onPress={() => onSelectStation(st.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: st.color }]}>{st.title}</Text>
              <View style={[styles.badge, { backgroundColor: st.color }]}>
                <Text style={styles.badgeText}>{st.badge}</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>{st.desc}</Text>
            <Text style={[styles.actionText, { color: st.color }]}>BẤM ĐỂ VÀO THI ĐẤU ➔</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoText: { color: '#00FFFF', fontSize: 16, fontWeight: '900', fontFamily: 'Courier New' },
  profileBtn: { backgroundColor: '#1A0B2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  profileText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold' },
  subtitle: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginBottom: 15, alignSelf: 'flex-start' },
  stationCard: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, width: '100%', marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 13, fontWeight: '900' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#000', fontSize: 8, fontWeight: '900' },
  cardDesc: { color: '#AAAABB', fontSize: 11, lineHeight: 16, marginBottom: 12 },
  actionText: { fontSize: 11, fontWeight: '900', textAlign: 'right' }
});