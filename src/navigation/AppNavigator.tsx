// src/navigation/AppNavigator.tsx
import React, { Component, useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebaseClient';

import AuthScreen from '../screens/AuthScreen';
import SubwayMapScreen from '../screens/SubwayMapScreen';
import NeonBeatPulseScreen from '../screens/NeonBeatPulseScreen';
import CyberArenaScreen from '../screens/CyberArenaScreen';
import BossRaidScreen from '../screens/BossRaidScreen';
import ShadowBossScreen from '../screens/ShadowBossScreen';
import OasisScreen from '../screens/OasisScreen';

export type ScreenRoute = 
  | 'SUBWAY_MAP' 
  | 'STATION_1_BEAT' 
  | 'STATION_2_ALL_IN' 
  | 'STATION_3_BOSS_RAID' 
  | 'STATION_4_SHADOW_BOSS' 
  | 'STATION_OASIS';

// 🛡️ CLASS ERROR BOUNDARY BẮT MỌI LỖI RENDER CỦA CÁC MÀN HÌNH CON
interface ErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
}
interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string;
}

class ScreenErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.toString() };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Crash detected in Screen:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ LỖI KHỞI TẠO GIAO DIỆN MÀN HÌNH!</Text>
          <Text style={styles.errorText}>{this.state.errorInfo}</Text>
          <TouchableOpacity 
            style={styles.resetBtn} 
            onPress={() => {
              this.setState({ hasError: false, errorInfo: '' });
              this.props.onReset();
            }}
          >
            <Text style={styles.resetText}>🔄 QUAY LẠI BẢN ĐỒ</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function AppNavigator() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('SUBWAY_MAP');

  const [oasisData, setOasisData] = useState<{
    word: string;
    meaning?: string;
    phonetics?: string;
    tip?: string;
    tier: 1 | 2 | 3;
  }>({
    word: 'Seat Sheet',
    meaning: 'Seat vs Sheet',
    phonetics: '/siːt ʃiːt/',
    tier: 1,
  });

  // 🔐 KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP FIREBASE REALTIME
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  const handleNavigateToOasis = (
    word: string, 
    tier: 1 | 2 | 3 = 1, 
    meaning?: string, 
    phonetics?: string,
    tip?: string
  ) => {
    setOasisData({ word, tier, meaning, phonetics, tip });
    setCurrentRoute('STATION_OASIS');
  };

  const handleSelectStationFromMap = (stationId: number) => {
    if (stationId === 1) setCurrentRoute('STATION_1_BEAT');
    else if (stationId === 2) setCurrentRoute('STATION_2_ALL_IN');
    else if (stationId === 3) setCurrentRoute('STATION_3_BOSS_RAID');
    else if (stationId === 4) setCurrentRoute('STATION_4_SHADOW_BOSS');
  };

  // 🔀 ĐIỀU HƯỚNG BẰNG SWITCH CASE AN TOÀN
  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case 'SUBWAY_MAP':
        return <SubwayMapScreen onSelectStation={handleSelectStationFromMap} />;
      
      case 'STATION_1_BEAT':
        return (
          <NeonBeatPulseScreen 
            initialTier={1}
            onBack={() => setCurrentRoute('SUBWAY_MAP')} 
            onNavigateToOasis={handleNavigateToOasis}
          />
        );

      case 'STATION_2_ALL_IN':
        return (
          <CyberArenaScreen 
            onBack={() => setCurrentRoute('SUBWAY_MAP')} 
          />
        );

      case 'STATION_3_BOSS_RAID':
        return (
          <BossRaidScreen 
            onBack={() => setCurrentRoute('SUBWAY_MAP')}
            onNavigateToOasis={(sentence) => handleNavigateToOasis(sentence, 3)}
          />
        );

      case 'STATION_4_SHADOW_BOSS':
        return (
          <ShadowBossScreen 
            onBack={() => setCurrentRoute('SUBWAY_MAP')} 
          />
        );

      case 'STATION_OASIS':
        return (
          <OasisScreen 
            targetWord={oasisData.word}
            meaning={oasisData.meaning}
            phonetics={oasisData.phonetics}
            tip={oasisData.tip}
            tier={oasisData.tier}
            onBackToBeat={() => setCurrentRoute('STATION_1_BEAT')}
          />
        );

      default:
        return <SubwayMapScreen onSelectStation={handleSelectStationFromMap} />;
    }
  };

  // ⏳ HIỂN THỊ MÀN HÌNH CHỜ KHI ĐANG KIỂM TRA PHIÊN ĐĂNG NHẬP
  if (authChecking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={{ color: '#00FFFF', marginTop: 10, fontFamily: 'Courier New' }}>
          ⚡ VIBESPEAK INITIALIZING...
        </Text>
      </View>
    );
  }

  // 🔒 NẾU CHƯA ĐĂNG NHẬP -> HIỂN THỊ MÀN HÌNH AUTH
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  // 🔓 ĐÃ ĐĂNG NHẬP -> CHẠY APP BÌNH THƯỜNG
  return (
    <View style={styles.container}>
      <ScreenErrorBoundary onReset={() => setCurrentRoute('SUBWAY_MAP')}>
        {renderCurrentScreen()}
      </ScreenErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D' },
  errorContainer: { flex: 1, backgroundColor: '#05020D', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { color: '#FF0055', fontSize: 16, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 10 },
  errorText: { color: '#FFF', fontSize: 12, fontFamily: 'Courier New', textAlign: 'center', marginBottom: 20 },
  resetBtn: { backgroundColor: '#00FFFF', padding: 12, borderRadius: 8 },
  resetText: { color: '#000', fontWeight: 'bold', fontFamily: 'Courier New', fontSize: 12 }
});