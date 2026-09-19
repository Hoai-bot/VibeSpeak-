// App.tsx
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import MainMapScreen from './src/screens/MainMapScreen';
import CyberArenaScreen from './src/screens/CyberArenaScreen';
import TeacherDashboardScreen from './src/screens/TeacherDashboardScreen';

export default function App() {
  // Quản lý màn hình active: 'map' | 'station1' | 'station2' | 'station3' | 'station4' | 'teacher'
  const [currentScreen, setCurrentScreen] = useState<string>('map');

  const handleSelectStation = (stationId: number) => {
    if (stationId === 1) setCurrentScreen('station1');
    else if (stationId === 2) setCurrentScreen('station2');
    else if (stationId === 3) setCurrentScreen('station3');
    else if (stationId === 4) setCurrentScreen('station4');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🗺️ MÀN HÌNH BẢN ĐỒ CHÍNH */}
      {currentScreen === 'map' && (
        <MainMapScreen 
          onSelectStation={handleSelectStation}
          onOpenTeacherDashboard={() => setCurrentScreen('teacher')}
        />
      )}

      {/* ⚔️ TRẠM 2: CYBER ARENA */}
      {currentScreen === 'station2' && (
        <CyberArenaScreen onBack={() => setCurrentScreen('map')} />
      )}

      {/* 🏫 MÀN HÌNH DASHBOARD GIÁO VIÊN */}
      {currentScreen === 'teacher' && (
        <TeacherDashboardScreen onBack={() => setCurrentScreen('map')} />
      )}

      {/* 🎵 TRẠM 1, 3, 4 DỰ PHÒNG THÔNG BÁO (TRÁNH LỖI ĐƠ GIAO DIỆN) */}
      {(currentScreen === 'station1' || currentScreen === 'station3' || currentScreen === 'station4') && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>
            {currentScreen === 'station1' && '🎵 TRẠM 1: NEON BEAT'}
            {currentScreen === 'station3' && '🎭 TRẠM 3: SHADOW MATRIX'}
            {currentScreen === 'station4' && '🎧 TRẠM 4: LISTEN & RESPOND'}
          </Text>
          <Text style={styles.placeholderSub}>
            Tính năng đang được tối ưu hóa theo chuẩn CEFR mới.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('map')}>
            <Text style={styles.backBtnText}>🔙 QUAY LẠI BẢN ĐỒ</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0518' },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0A0518',
  },
  placeholderTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  placeholderSub: {
    color: '#AAAABB',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#FF007F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});