// src/navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import AuthScreen, { UserProfile } from '../screens/AuthScreen';
import MainMapScreen from '../screens/MainMapScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

import Station1Screen from '../screens/Station1Screen';
import AllInArenaScreen from '../screens/AllInArenaScreen';
import ShadowBossScreen from '../screens/ShadowBossScreen';
import Station4Screen from '../screens/Station4Screen';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';

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
    } else if (idStr.includes('teacher') || idStr.includes('admin')) {
      setCurrentScreen('teacher');
    }
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'auth' && (
        <AuthScreen onAuthSuccess={(profile) => {
          setUserProfile(profile);
          setCurrentScreen('map');
        }} />
      )}

      {currentScreen === 'map' && (
        <MainMapScreen
          onSelectStation={handleSelectStation}
          onOpenProfile={() => setCurrentScreen('profile')}
        />
      )}

      {currentScreen === 'profile' && (
        <UserProfileScreen onBack={() => setCurrentScreen('map')} />
      )}

      {currentScreen === 'station1' && (
        <Station1Screen onBack={() => setCurrentScreen('map')} />
      )}

      {currentScreen === 'station2' && (
        <AllInArenaScreen onBack={() => setCurrentScreen('map')} />
      )}

      {currentScreen === 'station3' && (
        <ShadowBossScreen onBack={() => setCurrentScreen('map')} />
      )}

      {currentScreen === 'station4' && (
        <Station4Screen onBack={() => setCurrentScreen('map')} />
      )}

      {currentScreen === 'teacher' && (
        <TeacherDashboardScreen onBack={() => setCurrentScreen('map')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A051B' },
});