import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

// ĐÃ MỞ KHÓA TOÀN BỘ 4 TRẠM
const STATIONS = [
  { id: 1, name: 'TRẠM TÂN BINH (Khu 01)', desc: 'Luyện tập Shadowing 1:1 với AI', color: '#00FFFF', locked: false },
  { id: 2, name: 'ĐẤU TRƯỜNG TẤT TAY', desc: 'Cược điểm EXP, thi đấu Real-time', color: '#FF007F', locked: false },
  { id: 3, name: 'BÓNG MA (SHADOW BOSS)', desc: 'Thách đấu Top Player tuần trước', color: '#FFD700', locked: false }, // Đã mở khóa
  { id: 4, name: 'TRẠM CỨU TRỢ OASIS', desc: 'Hồi phục tâm lý, thư giãn', color: '#39FF14', locked: false }, // Đã mở khóa
];

export default function SubwayMapScreen({ onSelectStation }: { onSelectStation: (id: number) => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>[ VIBESPEAK SUBWAY MAP ]</Text>
      <Text style={styles.subHeader}>Chọn lộ trình của bạn, Runner.</Text>

      <ScrollView contentContainerStyle={styles.mapContainer} showsVerticalScrollIndicator={false}>
        {STATIONS.map((station, index) => {
          // Kiểm tra xem trạm tiếp theo có bị khóa không để đổi màu đường ray
          const isNextLocked = STATIONS[index + 1]?.locked ?? true;

          return (
            <View key={station.id} style={styles.stationWrapper}>
              {/* Đường ray nối các trạm - Đã nâng cấp hiệu ứng phát sáng */}
              {index !== STATIONS.length - 1 && (
                <View style={[
                  styles.railLine, 
                  { backgroundColor: isNextLocked ? '#333' : '#00FFFF' } // Sáng lên nếu đường đi đã mở
                ]} />
              )}
              
              {/* Nút Trạm */}
              <TouchableOpacity
                style={[
                  styles.stationNode,
                  { 
                    borderColor: station.locked ? '#444' : station.color,
                    backgroundColor: station.locked ? '#0D0814' : '#120B2C',
                    // Hiệu ứng Glow cho trạm mở khóa
                    shadowColor: station.locked ? 'transparent' : station.color,
                  }
                ]}
                disabled={station.locked}
                onPress={() => onSelectStation(station.id)}
              >
                <View style={[styles.nodeIcon, { borderColor: station.locked ? '#555' : station.color }]}>
                  <Text style={{ fontSize: 20 }}>{station.locked ? '🔒' : '🚉'}</Text>
                </View>
                <View style={styles.nodeInfo}>
                  <Text style={[styles.stationName, { color: station.locked ? '#666' : station.color }]}>
                    {station.name}
                  </Text>
                  <Text style={[styles.stationDesc, { color: station.locked ? '#555' : '#AAA' }]}>
                    {station.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A051B', padding: 20, paddingTop: 60 },
  headerTitle: { color: '#00FFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, fontFamily: 'Courier New', textShadowColor: '#00FFFF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  subHeader: { color: '#FF007F', fontSize: 14, textAlign: 'center', marginBottom: 30, fontStyle: 'italic' },
  mapContainer: { alignItems: 'center', paddingBottom: 50 },
  stationWrapper: { alignItems: 'center', width: '100%', position: 'relative', marginBottom: 25 },
  
  railLine: { position: 'absolute', width: 4, height: 110, top: 40, zIndex: -1, borderRadius: 2 },
  
  stationNode: { flexDirection: 'row', alignItems: 'center', width: '95%', padding: 15, borderRadius: 12, borderWidth: 2, zIndex: 1, elevation: 10, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 },
  nodeIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0A051B', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 2 },
  nodeInfo: { flex: 1 },
  stationName: { fontSize: 16, fontWeight: '900', marginBottom: 5, textTransform: 'uppercase' },
  stationDesc: { fontSize: 12, lineHeight: 18 },
});