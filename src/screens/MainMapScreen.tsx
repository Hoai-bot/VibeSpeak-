// src/screens/MainMapScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Props {
  onSelectStation: (stationId: string | number) => void;
  onOpenProfile: () => void;
}

export default function MainMapScreen({ onSelectStation, onOpenProfile }: Props) {
  return (
    <View style={styles.container}>
      {/* HEADER GIAO DIỆN CHÍNH CÓ NÚT HỒ SƠ VÀ BẢNG ĐIỂM GIÁO VIÊN */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileBtn} onPress={onOpenProfile}>
          <Text style={styles.profileBtnText}>👤 HỒ SƠ CHIẾN BINH</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.teacherBtn} 
          onPress={() => onSelectStation('teacher')}
        >
          <Text style={styles.teacherBtnText}>📊 BẢNG ĐIỂM GIÁO VIÊN</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mapContainer}>
        <Text style={styles.mapTitle}>🗺 BẢN ĐỒ ĐẤU TRƯỜNG VIBESPEAK</Text>
        <Text style={styles.mapSubtitle}>Luyện Phản Xạ Phát Âm Tiếng Anh Chuẩn CEFR (A1 - C2)</Text>

        {/* DANH SÁCH CÁC TRẠM HỌC TẬP CHUẨN CEFR A1 - C2 */}
        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(1)}>
          <Text style={styles.stationTitle}>🔥 TRẠM 1: DRILL ARENA (A1 - A2)</Text>
          <Text style={styles.stationDesc}>Luyện từ vựng, âm tiết & mẫu câu giao tiếp căn bản chuẩn phát âm</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.stationCard, styles.station2Card]} onPress={() => onSelectStation(2)}>
          <Text style={styles.stationTitle}>⚔️ TRẠM 2: ALL-IN ARENA (SOLO / RELAY / ROLEPLAY)</Text>
          <Text style={styles.stationDesc}>Thi đấu hội thoại phản xạ cặp đôi & Tự do đóng vai tình huống mở (A1 - C2)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(3)}>
          <Text style={styles.stationTitle}>👑 TRẠM 3: SHADOW BOSS RAID (B1 - B2)</Text>
          <Text style={styles.stationDesc}>Luyện Shadowing khớp nhịp điệu, ngữ điệu và tốc độ nói tự nhiên</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stationCard} onPress={() => onSelectStation(4)}>
          <Text style={styles.stationTitle}>⚡ TRẠM 4: SPEAKING EXPRESS (B2 - C2)</Text>
          <Text style={styles.stationDesc}>Phản xạ nhanh tình huống giao tiếp phức tạp & lập luận chuyên sâu</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 45 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  profileBtn: { backgroundColor: '#1A0B2E', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  profileBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  teacherBtn: { backgroundColor: '#39FF14', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#39FF14' },
  teacherBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  mapContainer: { alignItems: 'center', paddingBottom: 30 },
  mapTitle: { color: '#FF007F', fontSize: 15, fontWeight: '900', marginBottom: 4 },
  mapSubtitle: { color: '#FFD700', fontSize: 10, marginBottom: 20 },
  stationCard: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#332255', width: '100%', marginBottom: 12 },
  station2Card: { borderColor: '#FF007F', borderWidth: 2, backgroundColor: '#130628' },
  stationTitle: { color: '#00FFFF', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  stationDesc: { color: '#AAAABB', fontSize: 10, lineHeight: 15 },
});