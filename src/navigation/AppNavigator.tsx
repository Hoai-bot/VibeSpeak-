// src/navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MainMapScreen from '../screens/MainMapScreen';
import Station1Screen from '../screens/Station1Screen';
import Station2Screen from '../screens/Station2Screen';
import GhostStationScreen from '../screens/GhostStationScreen'; // Trạm 3
import Station4Screen from '../screens/Station4Screen';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen'; // 🏫 Import Cổng Giảng viên
import ProfileScreen from '../screens/ProfileScreen';

export default function AppNavigator() {
  const [currentStation, setCurrentStation] = useState<string | number>('map');
  const [showProfile, setShowProfile] = useState<boolean>(false);

  // Xử lý quay lại bản đồ chính
  const handleBackToMap = () => {
    setCurrentStation('map');
    setShowProfile(false);
  };

  // Mở màn hình hồ sơ sinh viên
  if (showProfile) {
    return <ProfileScreen onBackToMap={handleBackToMap} />;
  }

  // Điều hướng theo trạm hoặc cổng giảng viên
  if (currentStation === 'teacher') {
    return <TeacherDashboardScreen onBack={handleBackToMap} />;
  }

  if (currentStation === 1) {
    return <Station1Screen onBack={handleBackToMap} />;
  }

  if (currentStation === 2) {
    return <Station2Screen onBack={handleBackToMap} />;
  }

  if (currentStation === 3) {
    return <GhostStationScreen onBack={handleBackToMap} />;
  }

  if (currentStation === 4) {
    return <Station4Screen onBack={handleBackToMap} />;
  }

  return (
    <MainMapScreen 
      onSelectStation={(stationId) => setCurrentStation(stationId)}
      onOpenProfile={() => setShowProfile(true)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05020D',
  },
});