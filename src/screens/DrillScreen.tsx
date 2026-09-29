// src/screens/DrillScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { updateUserProgress } from '../services/userService';

interface Props {
  tier?: number;
  onBack: () => void;
}

const DRILL_SAMPLES = [
  { target: "Corporate drones broker encrypted contracts while the city burns neon.", topic: "Business" },
  { target: "Minimal pairs demand precise tongue positioning and vocal cord control.", topic: "Phonetics" },
  { target: "Artificial intelligence optimizes cloud infrastructure for scalable services.", topic: "Tech" }
];

export default function DrillScreen({ onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const currentSample = DRILL_SAMPLES[currentIndex];

  const handleSimulateGrade = () => {
    setIsAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      setResult({
        score: 85,
        feedback: "Phát âm rõ ràng, ngắt nghỉ câu hợp lý! Giữ vững phong độ.",
      });
      setIsAnalyzing(false);
      updateUserProgress(1, 20, true);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 1: DRILL ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        <View style={styles.card}>
          <Text style={styles.tag}>[ {currentSample.topic.toUpperCase()} ]</Text>
          <Text style={styles.targetText}>"{currentSample.target}"</Text>
        </View>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={styles.recordBtn} onPress={handleSimulateGrade}>
            <Text style={styles.recordBtnText}>🎙️ BẤM ĐỂ PHÁT ÂM & CHẤM ĐIỂM</Text>
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.scoreText}>⚡ KẾT QUẢ: {result.score}/100 ĐIỂM (+20 XP)</Text>
            <Text style={styles.feedback}>{result.feedback}</Text>
            <TouchableOpacity 
              style={styles.nextBtn} 
              onPress={() => {
                setResult(null);
                setCurrentIndex((prev) => (prev + 1) % DRILL_SAMPLES.length);
              }}
            >
              <Text style={styles.nextBtnText}>➡️ BÀI TIẾP THEO</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 13, fontWeight: '900' },
  card: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  tag: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  targetText: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center', lineHeight: 24 },
  recordBtn: { backgroundColor: '#39FF14', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 20 },
  recordBtnText: { color: '#000', fontSize: 12, fontWeight: '900' },
  resultBox: { backgroundColor: '#120826', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', width: '100%', alignItems: 'center' },
  scoreText: { color: '#39FF14', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  feedback: { color: '#AAAABB', fontSize: 11, textAlign: 'center', marginBottom: 12 },
  nextBtn: { backgroundColor: '#FF007F', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' }
});