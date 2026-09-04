import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import NeonBeatPulseScreen from './src/screens/NeonBeatPulseScreen';
import AllInArenaScreen from './src/screens/AllInArenaScreen';
import BossRaidScreen from './src/screens/BossRaidScreen';
import GhostStationScreen from './src/screens/GhostStationScreen';
import { OasisScreen } from './src/screens/OasisScreen';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<
    'home' | 'station1' | 'station2' | 'station3' | 'ghost_station' | 'oasis'
  >('home');
  const [recoveryWord, setRecoveryWord] = useState<string>('');

  // 🎯 HÀM CHUYỂN MÀN HÌNH SANG OASIS (BẢO ĐẢM KHÔNG BỊ CHUỖI RỖNG)
  const handleNavigateToOasis = (failedText?: string) => {
    // Nếu không có chuỗi truyền sang, gán mặc định để Oasis luôn hiện cấu trúc gợi ý
    const validWord = failedText && failedText.trim().length > 0 
      ? failedText 
      : 'Cyberpunk Speaking Practice';
      
    setRecoveryWord(validWord);
    setActiveScreen('oasis');
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* MÀN HÌNH CHÍNH (SẢNH CHỜ VIBESPEAK HUB) */}
        {activeScreen === 'home' && (
          <View style={styles.menuContainer}>
            <Text style={styles.title}>⚡ VIBESPEAK HUB ⚡</Text>
            <Text style={styles.subtitle}>Chọn Chiến Trạm Thi Đấu Giọng Nói</Text>

            <TouchableOpacity
              style={[styles.stationBtn, { borderColor: '#FFD700' }]}
              onPress={() => setActiveScreen('station1')}
            >
              <Text style={[styles.stationTitle, { color: '#FFD700' }]}>⚡ TRẠM 1: NEON BEAT PULSE</Text>
              <Text style={styles.stationDesc}>Luyện Phát Âm Nhịp Điệu & Speed Shadowing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stationBtn, { borderColor: '#FF007F' }]}
              onPress={() => setActiveScreen('station2')}
            >
              <Text style={[styles.stationTitle, { color: '#FF007F' }]}>⚔️ TRẠM 2: ALL-IN ARENA</Text>
              <Text style={styles.stationDesc}>Đấu Trường Tất Tay PvP (1v1, Relay, Roleplay)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stationBtn, { borderColor: '#39FF14' }]}
              onPress={() => setActiveScreen('station3')}
            >
              <Text style={[styles.stationTitle, { color: '#39FF14' }]}>👾 TRẠM 3: CYBER BOSS RAID</Text>
              <Text style={styles.stationDesc}>Đồng Đội Co-op Diệt Boss Realtime</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stationBtn, { borderColor: '#00FFFF' }]}
              onPress={() => setActiveScreen('ghost_station')}
            >
              <Text style={[styles.stationTitle, { color: '#00FFFF' }]}>👻 TRẠM BÓNG MA</Text>
              <Text style={styles.stationDesc}>Luyện Nghe Nói Ma Mị & Giọng Đọc Trầm U</Text>
            </TouchableOpacity>

            {/* 🌴 TRẠM CỨU HỘ OASIS */}
            <TouchableOpacity
              style={[styles.stationBtn, { borderColor: '#00FFCC', backgroundColor: '#052C30' }]}
              onPress={() => handleNavigateToOasis('General Freestyle Practice')}
            >
              <Text style={[styles.stationTitle, { color: '#00FFCC' }]}>🌴 TRẠM CỨU HỘ OASIS</Text>
              <Text style={styles.stationDesc}>Nói Tự Do Không Áp Lực & Sửa Lỗi Khẩu Hình Chuyên Sâu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CÁC TRẠM THI ĐẤU */}
        {activeScreen === 'station1' && (
          <NeonBeatPulseScreen
            onBack={() => setActiveScreen('home')}
            onNavigateToOasis={(word) => handleNavigateToOasis(word)}
          />
        )}

        {activeScreen === 'station2' && (
          <AllInArenaScreen
            onBack={() => setActiveScreen('home')}
            onNavigateToOasis={(topic) => handleNavigateToOasis(topic)}
          />
        )}

        {/* 👾 ĐÃ CẬP NHẬT CALLBACK CỨU HỘ CHO TRẠM 3: CYBER BOSS RAID */}
        {activeScreen === 'station3' && (
          <BossRaidScreen 
            onBack={() => setActiveScreen('home')} 
            onNavigateToOasis={(command) => handleNavigateToOasis(command)}
          />
        )}

        {/* 👻 ĐÃ CẬP NHẬT CALLBACK CỨU HỘ CHO TRẠM BÓNG MA */}
        {activeScreen === 'ghost_station' && (
          <GhostStationScreen 
            onBack={() => setActiveScreen('home')} 
            onNavigateToOasis={(sentence) => handleNavigateToOasis(sentence)}
          />
        )}

        {/* 🌴 MÀN HÌNH CỨU HỘ OASIS */}
        {activeScreen === 'oasis' && (
          <OasisScreen
            onBack={() => setActiveScreen('home')}
            recoveryWord={recoveryWord}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D' },
  menuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#00FFFF', fontFamily: 'Courier New', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#AAAABB', marginBottom: 25, fontFamily: 'Courier New' },
  stationBtn: { width: '100%', padding: 16, backgroundColor: '#0D0620', borderRadius: 12, borderWidth: 2, marginBottom: 14, alignItems: 'center' },
  stationTitle: { fontSize: 15, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 4 },
  stationDesc: { fontSize: 11, color: '#8888AA', fontFamily: 'Courier New' },
});