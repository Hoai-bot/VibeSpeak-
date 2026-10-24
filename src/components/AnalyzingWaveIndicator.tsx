// src/components/AnalyzingWaveIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  statusText?: string;
}

export default function AnalyzingWaveIndicator({ 
  statusText = "AI ĐANG BÓC TÁCH GIỌNG NÓI & PHÂN TÍCH NGỮ ĐIỆU..." 
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.waveRow}>
        <View style={[styles.waveBar, styles.bar1]} />
        <View style={[styles.waveBar, styles.bar2]} />
        <View style={[styles.waveBar, styles.bar3]} />
        <View style={[styles.waveBar, styles.bar4]} />
        <View style={[styles.waveBar, styles.bar5]} />
        <View style={[styles.waveBar, styles.bar4]} />
        <View style={[styles.waveBar, styles.bar2]} />
      </View>
      
      <Text style={styles.title}>🤖 VIBESPEAK NEURAL AI</Text>
      <Text style={styles.status}>{statusText}</Text>
      <Text style={styles.tip}>💡 Giữ kết nối mạng, bài của bạn đang được xử lý an toàn...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#130728',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00FFFF',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    marginBottom: 12,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#39FF14',
    borderRadius: 3,
  },
  bar1: { height: 14, backgroundColor: '#00FFFF' },
  bar2: { height: 26, backgroundColor: '#39FF14' },
  bar3: { height: 38, backgroundColor: '#FF007F' },
  bar4: { height: 24, backgroundColor: '#FFD700' },
  bar5: { height: 34, backgroundColor: '#00FFFF' },
  title: {
    color: '#00FFFF',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 1,
  },
  status: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  tip: {
    color: '#8888AA',
    fontSize: 8,
    fontStyle: 'italic',
  }
});