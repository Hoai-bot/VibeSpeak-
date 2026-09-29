// src/screens/DrillScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { generateDynamicQuestion, CEFRLevel, GeneratedSentence } from '../services/groqClient';
import { updateUserProgress } from '../services/userService';

interface Props {
  tier?: number;
  onBack: () => void;
}

// 🎯 ĐÃ BỔ SUNG ĐẦY ĐỦ CÁC CẤP ĐỘ TỪ A1 ĐẾN C2
const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function DrillScreen({ onBack }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('B2');
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedSentence>({
    targetText: "Sustainable urban development requires balancing environmental conservation with economic growth.",
    cefrLevel: 'B2',
    topic: 'Environment & Sustainability',
    phoneticFocus: 'Linking & Intonation'
  });
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);

  // 🎯 HÀM ĐỔI LEVEL HOẶC TẠO CÂU HỎI MỚI CHUẨN CEFR & ĐA DẠNG CHỦ ĐỀ
  const handleSelectLevelAndGenerate = async (level: CEFRLevel) => {
    setSelectedLevel(level);
    setIsGenerating(true);
    setResult(null);

    const newQuestion = await generateDynamicQuestion(level);
    setCurrentQuestion(newQuestion);
    setIsGenerating(false);
  };

  const handleSimulateGrade = () => {
    setIsAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      setResult({
        score: 88,
        feedback: "Phát âm rõ ràng, nhịp điệu tự nhiên và ngắt nghỉ đúng cụm từ!",
      });
      setIsAnalyzing(false);
      updateUserProgress(1, 25, true);
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

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* thanh CHỌN CẤP ĐỘ CEFR TỪ A1 ĐẾN C2 */}
        <Text style={styles.sectionLabel}>CHỌN CẤP ĐỘ TRUYỀN TẢI (CEFR):</Text>
        <View style={styles.levelRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.levelBadge,
                selectedLevel === lvl && styles.levelBadgeActive,
                lvl === 'C2' && { borderColor: '#FF007F' } // Làm nổi bật C2
              ]}
              onPress={() => handleSelectLevelAndGenerate(lvl)}
            >
              <Text style={[
                styles.levelText,
                selectedLevel === lvl && styles.levelTextActive,
                lvl === 'C2' && { color: '#FF007F' }
              ]}>
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CARD HIỂN THỊ CÂU HỎI ĐỘNG */}
        <View style={styles.card}>
          {isGenerating ? (
            <ActivityIndicator size="small" color="#00FFFF" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.tag}>[ LEVEL {currentQuestion.cefrLevel} ]</Text>
                <Text style={styles.topicTag}>📌 {currentQuestion.topic.toUpperCase()}</Text>
              </View>

              <Text style={styles.targetText}>"{currentQuestion.targetText}"</Text>
              <Text style={styles.phoneticTag}>🎯 Trọng tâm âm: {currentQuestion.phoneticFocus}</Text>
            </>
          )}
        </View>

        {/* NÚT TẠO CÂU MỚI BẤM TỰ DO */}
        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={() => handleSelectLevelAndGenerate(selectedLevel)}
          disabled={isGenerating}
        >
          <Text style={styles.refreshBtnText}>🔄 ĐỔI CÂU HỎI MỚI ({selectedLevel})</Text>
        </TouchableOpacity>

        {/* NÚT THI ĐẤU PHÁT ÂM */}
        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity style={styles.recordBtn} onPress={handleSimulateGrade}>
            <Text style={styles.recordBtnText}>🎙️ PHÁT ÂM & CHẤM ĐIỂM AI</Text>
          </TouchableOpacity>
        )}

        {/* KẾT QUẢ CHẤM ĐIỂM */}
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.scoreText}>⚡ KẾT QUẢ: {result.score}/100 ĐIỂM (+25 XP)</Text>
            <Text style={styles.feedback}>{result.feedback}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 13, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 8 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  levelBadge: { backgroundColor: '#0D0620', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#332255' },
  levelBadgeActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  levelText: { color: '#8888AA', fontSize: 11, fontWeight: '900' },
  levelTextActive: { color: '#000' },
  card: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  tag: { color: '#FF007F', fontSize: 11, fontWeight: '900' },
  topicTag: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  targetText: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22, marginVertical: 8 },
  phoneticTag: { color: '#39FF14', fontSize: 10, fontWeight: 'bold', marginTop: 6 },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshBtnText: { color: '#FF007F', fontSize: 10, fontWeight: '900' },
  recordBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15 },
  recordBtnText: { color: '#000', fontSize: 12, fontWeight: '900' },
  resultBox: { backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center' },
  scoreText: { color: '#39FF14', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  feedback: { color: '#AAAABB', fontSize: 10, textAlign: 'center' }
});