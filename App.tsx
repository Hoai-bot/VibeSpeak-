// App.tsx
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

// 1. Màn hình Bản đồ & Dashboard Giáo viên
import MainMapScreen from './src/screens/MainMapScreen';
import TeacherDashboardScreen from './src/screens/TeacherDashboardScreen';

// 2. Màn hình các Trạm bài tập thực tế
import NeonBeatPulseScreen from './src/screens/NeonBeatPulseScreen'; // Trạm 1
import CyberArenaScreen from './src/screens/CyberArenaScreen';     // Trạm 2 (2v2 Arena)
import BossRaidScreen from './src/screens/BossRaidScreen';         // Trạm 3 (Boss Raid)
import GhostStationScreen from './src/screens/GhostStationScreen'; // Trạm 3 (Ghost Shadowing)
import Station4Screen from './src/screens/Station4Screen';         // Trạm 4 (Listen & Respond)

export default function App() {
  // Quản lý màn hình active: 'map' | 'station1' | 'station2' | 'station3' | 'station3_ghost' | 'station4' | 'teacher'
  const [currentScreen, setCurrentScreen] = useState<string>('map');

  // Điều hướng khi chọn Trạm từ MainMapScreen
  const handleSelectStation = (stationId: number) => {
    if (stationId === 1) setCurrentScreen('station1');
    else if (stationId === 2) setCurrentScreen('station2');
    else if (stationId === 3) setCurrentScreen('station3');
    else if (stationId === 4) setCurrentScreen('station4'); // Đã trỏ đúng sang Trạm 4
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🗺️ 1. MÀN HÌNH BẢN ĐỒ CHÍNH */}
      {currentScreen === 'map' && (
        <MainMapScreen 
          onSelectStation={handleSelectStation}
          onOpenTeacherDashboard={() => setCurrentScreen('teacher')}
        />
      )}

      {/* 🎵 2. TRẠM 1: NEON BEAT PULSE */}
      {currentScreen === 'station1' && (
        <NeonBeatPulseScreen onBack={() => setCurrentScreen('map')} />
      )}

      {/* ⚔️ 3. TRẠM 2: CYBER ARENA (2V2 & 1V1) */}
      {currentScreen === 'station2' && (
        <CyberArenaScreen onBack={() => setCurrentScreen('map')} />
      )}

      {/* 👹 4. TRẠM 3: BOSS RAID */}
      {currentScreen === 'station3' && (
        <BossRaidScreen onBack={() => setCurrentScreen('map')} />
      )}

      {/* 👻 5. TRẠM 3 KHÁC: SHADOW MATRIX (GHOST SHADOWING) */}
      {currentScreen === 'station3_ghost' && (
        <GhostStationScreen onBack={() => setCurrentScreen('map')} />
      )}

      {/* 🎧 6. TRẠM 4: LISTEN & RESPOND */}
      {currentScreen === 'station4' && (
        <Station4Screen onBack={() => setCurrentScreen('map')} />
      )}

      {/* 🏫 7. DASHBOARD QUẢN LÝ DÀNH CHO GIÁO VIÊN */}
      {currentScreen === 'teacher' && (
        <TeacherDashboardScreen onBack={() => setCurrentScreen('map')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0518',
  },
});