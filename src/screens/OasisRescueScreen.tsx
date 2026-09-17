// src/screens/OasisRescueScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { speakNaturalText } from '../services/ttsService';

interface Props {
  rescueData: {
    stationName: string;
    tierLevel: number;
    targetText: string;
    phonetics?: string;
    meaning?: string;
    tip?: string;
  };
  onClose: () => void;
}

export default function OasisRescueScreen({ rescueData, onClose }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.rescueHeader}>🏝️ TRẠM CỨU HỘ VIBE OASIS</Text>
        <Text style={styles.subHeader}>
          [ HỖ TRỢ DÀNH CHO {rescueData.stationName.toUpperCase()} • TẦNG {rescueData.tierLevel} ]
        </Text>

        <View style={styles.wordBox}>
          <Text style={styles.targetWord}>"{rescueData.targetText}"</Text>
          {rescueData.phonetics && <Text style={styles.phonetics}>{rescueData.phonetics}</Text>}
          {rescueData.meaning && <Text style={styles.meaning}>Dịch nghĩa: {rescueData.meaning}</Text>}
        </View>

        <TouchableOpacity 
          style={styles.listenBtn} 
          onPress={() => speakNaturalText(rescueData.targetText, 0.7)}
        >
          <Text style={styles.listenText}>🔊 NGHE AI ĐỌC CHẬM & CHUẨN</Text>
        </TouchableOpacity>

        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>💡 MẸO SỬA LỖI CHI TIẾT:</Text>
          <Text style={styles.guideText}>{rescueData.tip || "Hãy chú ý bật rõ âm đuôi và giữ luồng hơi ổn định."}</Text>
        </View>

        <TouchableOpacity style={styles.retryBtn} onPress={onClose}>
          <Text style={styles.retryText}>🚀 ĐÃ HIỂU - QUAY LẠI THI ĐẤU</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#0D0620', padding: 22, borderRadius: 20, borderWidth: 2, borderColor: '#39FF14', width: '100%', alignItems: 'center' },
  rescueHeader: { color: '#39FF14', fontSize: 16, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 4 },
  subHeader: { color: '#00FFFF', fontSize: 10, fontFamily: 'Courier New', marginBottom: 15 },
  wordBox: { backgroundColor: '#1A0B2E', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15 },
  targetWord: { color: '#FFF', fontSize: 20, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 4 },
  phonetics: { color: '#FFD700', fontSize: 13, fontFamily: 'Courier New', marginBottom: 4 },
  meaning: { color: '#AAAABB', fontSize: 11, fontFamily: 'Courier New' },
  listenBtn: { backgroundColor: '#FF007F', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginBottom: 15 },
  listenText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  guideBox: { backgroundColor: '#05020D', padding: 12, borderRadius: 10, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#332255' },
  guideTitle: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 6 },
  guideText: { color: '#FFF', fontSize: 11, fontFamily: 'Courier New', lineHeight: 16 },
  retryBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  retryText: { color: '#000', fontSize: 12, fontWeight: '900', fontFamily: 'Courier New' }
});