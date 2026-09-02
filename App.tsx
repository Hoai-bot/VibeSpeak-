import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import AllInArenaScreen from './src/screens/AllInArenaScreen';
import BossRaidScreen from './src/screens/BossRaidScreen';

export default function App() {
  // Managing Active Screen Station: 'home' | 'station2' | 'station3'
  const [activeScreen, setActiveScreen] = useState<'home' | 'station2' | 'station3'>('home');

  return (
    <View style={styles.container}>
      {/* MÀN HÌNH CHÍNH (SẢNH CHỜ) */}
      {activeScreen === 'home' && (
        <View style={styles.menuContainer}>
          <Text style={styles.title}>⚡ VIBESPEAK HUB ⚡</Text>
          <Text style={styles.subtitle}>Chọn Chiến Trạm Thi Đấu Giọng Nói</Text>

          <TouchableOpacity
            style={[styles.stationBtn, { borderColor: '#FF007F' }]}
            onPress={() => setActiveScreen('station2')}
          >
            <Text style={[styles.stationTitle, { color: '#FF007F' }]}>⚔️ TRẠM 2: ALL-IN ARENA</Text>
            <Text style={styles.stationDesc}>Đấu Trường Tất Tay PvP 1v1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stationBtn, { borderColor: '#39FF14' }]}
            onPress={() => setActiveScreen('station3')}
          >
            <Text style={[styles.stationTitle, { color: '#39FF14' }]}>👾 TRẠM 3: CYBER BOSS RAID</Text>
            <Text style={styles.stationDesc}>Đồng Đội Co-op Diệt Boss Realtime</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TRẠM 2 */}
      {activeScreen === 'station2' && (
        <AllInArenaScreen onBack={() => setActiveScreen('home')} />
      )}

      {/* TRẠM 3 */}
      {activeScreen === 'station3' && (
        <BossRaidScreen onBack={() => setActiveScreen('home')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D' },
  menuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#00FFFF', fontFamily: 'Courier New', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#AAAABB', marginBottom: 40, fontFamily: 'Courier New' },
  stationBtn: { width: '100%', padding: 20, backgroundColor: '#0D0620', borderRadius: 12, borderWidth: 2, marginBottom: 20, alignItems: 'center' },
  stationTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 5 },
  stationDesc: { fontSize: 12, color: '#8888AA', fontFamily: 'Courier New' },
});