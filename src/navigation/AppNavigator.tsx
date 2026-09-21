// src/navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import AuthScreen, { UserProfile } from '../screens/AuthScreen';
import MainMapScreen from '../screens/MainMapScreen';
import ProfileScreen from '../screens/ProfileScreen';

import DrillScreen from '../screens/DrillScreen';
import AllInArenaScreen from '../screens/AllInArenaScreen';
import BossRaidScreen from '../screens/BossRaidScreen';
import ShadowBossScreen from '../screens/ShadowBossScreen';
import Station4Screen from '../screens/Station4Screen';

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<string>('map');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleSelectStation = (stationId: number | string) => {
    const idStr = String(stationId).toLowerCase();
    if (idStr === '1' || idStr.includes('station1')) {
      setCurrentScreen('station1');
    } else if (idStr === '2' || idStr.includes('station2') || idStr.includes('arena')) {
      setCurrentScreen('station2');
    } else if (idStr === '3' || idStr.includes('station3') || idStr.includes('boss')) {
      setCurrentScreen('station3');
    } else if (idStr === '4' || idStr.includes('station4')) {
      setCurrentScreen('station4');
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. MÀN HÌNH ĐĂNG NHẬP */}
      {currentScreen === 'auth' && (
        <AuthScreen onAuthSuccess={(profile) => {
          setUserProfile(profile);
          setCurrentScreen('map');
        }} />
      )}

      {/* 2. MÀN HÌNH BẢN ĐỒ MAP */}
      {currentScreen === 'map' && (
        <MainMapScreen
          onSelectStation={handleSelectStation}
          onOpenProfile={() => setCurrentScreen('profile')}
        />
      )}

      {/* 3. MÀN HÌNH HỒ SƠ CÁ NHÂN */}
      {currentScreen === 'profile' && (
        <ProfileScreen onBackToMap={() => setCurrentScreen('map')} />
      )}

      {/* 4. TRẠM 1: DRILL ARENA */}
      {currentScreen === 'station1' && (
        <DrillScreen tier={1} onBack={() => setCurrentScreen('map')} />
      )}

      {/* 5. TRẠM 2: ALL-IN ARENA */}
      {currentScreen === 'station2' && (
        <AllInArenaScreen onBack={() => setCurrentScreen('map')} />
      )}

      {/* 6. TRẠM 3: SHADOW BOSS / BOSS RAID (ĐÃ SỬA CỐ ĐỊNH Ở LẠI STATION 3) */}
      {currentScreen === 'station3' && (
        <ShadowBossScreen 
          onBack={() => setCurrentScreen('map')} 
          onNavigateToOasis={(text) => {
            // 🎯 SỬA TẠI ĐÂY: Đảm bảo giữ người dùng ở lại station3 khi phát âm chưa chuẩn
            setCurrentScreen('station3'); 
          }}
        />
      )}

      {/* 7. TRẠM 4: LISTEN & RESPOND */}
      {currentScreen === 'station4' && (
        <Station4Screen onBack={() => setCurrentScreen('map')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A051B',
  },
});