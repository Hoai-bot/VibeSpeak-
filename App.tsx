// App.tsx
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import MainMapScreen from './src/screens/MainMapScreen';
import CyberArenaScreen from './src/screens/CyberArenaScreen';
import TeacherDashboardScreen from './src/screens/TeacherDashboardScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'map' | 'arena' | 'teacher'>('map');

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'map' && (
        <MainMapScreen 
          onSelectStation={(id) => id === 2 && setCurrentScreen('arena')}
          onOpenTeacherDashboard={() => setCurrentScreen('teacher')}
        />
      )}

      {currentScreen === 'arena' && (
        <CyberArenaScreen onBack={() => setCurrentScreen('map')} />
      )}

      {currentScreen === 'teacher' && (
        <TeacherDashboardScreen onBack={() => setCurrentScreen('map')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0518' },
});