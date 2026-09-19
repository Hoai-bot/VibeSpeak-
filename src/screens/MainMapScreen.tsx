// src/screens/MainMapScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  onSelectStation: (stationId: number) => void;
  onOpenTeacherDashboard: () => void;
}

export default function MainMapScreen({ onSelectStation, onOpenTeacherDashboard }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* Banner tiêu đề Game */}
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTag}>[ CYBERPUNK LANGUAGE GAME ]</Text>
          <Text style={styles.bannerTitle}>⚡ VIBESPEAK ARENA ⚡</Text>
          <Text style={styles.bannerSub}>Chọn trạm thách đấu hoặc chế độ quản lý để bắt đầu!</Text>
        </View>

        {/* 🏫 NÚT TRUY CẬP DÀNH CHO GIÁO VIÊN / NHÀ TRƯỜNG */}
        <TouchableOpacity style={styles.teacherCard} onPress={onOpenTeacherDashboard}>
          <Text style={styles.teacherTitle}>🏫 DÀNH CHO GIÁO VIÊN / NHÀ TRƯỜNG</Text>
          <Text style={styles.teacherSub}>Quản lý danh sách lớp, thời lượng luyện tập & Huy hiệu AI học sinh</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>🗺️ BẢN ĐỒ CÁC TRẠM THÁCH ĐẤU</Text>

        {/* Trạm 1 */}
        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(1)}>
          <Text style={styles.stationTag}>TRẠM 1</Text>
          <Text style={styles.stationTitle}>🎵 NEON BEAT (LỢI ÂM & PHÔN ÂM)</Text>
          <Text style={styles.stationSub}>Luyện Minimal Pairs, Linking Words và Twisters</Text>
        </TouchableOpacity>

        {/* Trạm 2 - Cyber Arena */}
        <TouchableOpacity style={[styles.stationCard, styles.activeStation]} onPress={() => onSelectStation(2)}>
          <Text style={[styles.stationTag, { color: '#39FF14' }]}>TRẠM 2 [HOT]</Text>
          <Text style={styles.stationTitle}>⚔️ CYBER ARENA (ĐẤU TRƯỜNG 2V2)</Text>
          <Text style={styles.stationSub}>Solo Pulse, Relay Co-op & Roleplay Simulation thời gian thực</Text>
        </TouchableOpacity>

        {/* Trạm 3 */}
        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(3)}>
          <Text style={styles.stationTag}>TRẠM 3</Text>
          <Text style={styles.stationTitle}>🎭 SHADOW MATRIX (NHẬP VAI BẮT CHƯỚC)</Text>
          <Text style={styles.stationSub}>Luyện Intonation và Rhythm theo giọng bản xứ</Text>
        </TouchableOpacity>

        {/* Trạm 4 */}
        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(4)}>
          <Text style={styles.stationTag}>TRẠM 4</Text>
          <Text style={styles.stationTitle}>🎧 LISTEN & RESPOND (NGHE PHẢN XẠ)</Text>
          <Text style={styles.stationSub}>Nghe xử lý tình huống Tiếng Anh chuẩn quốc tế</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0518', padding: 16, paddingTop: 40 },
  headerBanner: { width: '100%', alignItems: 'center', marginBottom: 15, padding: 16, backgroundColor: '#120826', borderRadius: 12, borderWidth: 1, borderColor: '#3A1559' },
  bannerTag: { color: '#00FFCC', fontSize: 10, fontWeight: 'bold' },
  bannerTitle: { color: '#FFD700', fontSize: 20, fontWeight: '900', marginVertical: 4 },
  bannerSub: { color: '#AAAABB', fontSize: 11, textAlign: 'center' },

  teacherCard: { width: '100%', backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#00FFCC', marginBottom: 20, alignItems: 'center' },
  teacherTitle: { color: '#00FFCC', fontSize: 13, fontWeight: '900' },
  teacherSub: { color: '#AAAABB', fontSize: 10, marginTop: 4, textAlign: 'center' },

  sectionTitle: { color: '#FF007F', fontSize: 12, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10 },

  stationCard: { width: '100%', backgroundColor: '#1A0B36', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#3A1559', marginBottom: 12 },
  activeStation: { borderColor: '#39FF14', backgroundColor: '#0A1A10' },
  stationTag: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  stationTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginVertical: 2 },
  stationSub: { color: '#8888CC', fontSize: 10 }
});