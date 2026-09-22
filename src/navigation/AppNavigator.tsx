// src/navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import AuthScreen, { UserProfile } from '../screens/AuthScreen';
import MainMapScreen from '../screens/MainMapScreen';
import ProfileScreen from '../screens/ProfileScreen';

import DrillScreen from '../screens/DrillScreen';
import AllInArenaScreen from '../screens/AllInArenaScreen';

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<string>('map');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleSelectStation = (stationId: number | string) => {
    const idStr = String(stationId).toLowerCase();
    if (idStr === '1' || idStr.includes('station1')) {
      setCurrentScreen('station1');
    } else if (idStr === '2' || idStr.includes('station2') || idStr.includes('arena')) {
      setCurrentScreen('station2');
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A051B',
  },
});