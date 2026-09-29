// src/screens/AllInArenaScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { generateDynamicQuestion, CEFRLevel, GeneratedSentence } from '../services/groqClient';
import { updateUserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AllInArenaScreen({ onBack }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('B2');
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedSentence>({
    targetText: "Sustainable urban development requires balancing environmental conservation with economic growth.",
    cefrLevel: 'B2',
    topic: 'Environment & Sustainability',
    phoneticFocus: 'Linking & Intonation'
  });

  const [battleState, setBattleState] = useState<'idle' | 'searching' | 'battling' | 'ended'>('idle');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);

  const handleSelectLevel = async (level: CEFRLevel) => {
    setSelectedLevel(level);
    setIsGenerating(true);
    const newQuestion = await generateDynamicQuestion(level);
    setCurrentQuestion(newQuestion);
    setIsGenerating(false);
  };

  const startMatch = () => {
    setBattleState('searching');
    setTimeout(() => {
      setBattleState('battling');
    }, 1500);
  };

  const endMatch = (isWin: boolean) => {
    setWinner(isWin ? 'YOU' : 'CYBER_BOT');
    setBattleState('ended');
    updateUserProgress(2, isWin ? 50 : 10, isWin);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* THANH CHỌN TẦNG TRÌNH ĐỘ CEFR TỪ A1 TỚI C2 */}
        <Text style={styles.sectionLabel}>CHỌN CẤP ĐỘ ĐẤU TRƯỜNG (CEFR):</Text>
        <View style={styles.levelRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.levelBadge,
                selectedLevel === lvl && styles.levelBadgeActive,
                lvl === 'C2' && { borderColor: '#FF007F' }
              ]}
              onPress={() => handleSelectLevel(lvl)}
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

        {battleState === 'idle' && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>🔥 ĐẤU TRƯỜNG THI ĐẤU [ {selectedLevel} ]</Text>
            
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FF007F" style={{ marginVertical: 15 }} />
            ) : (
              <View style={styles.topicBox}>
                <Text style={styles.topicText}>📌 CHỦ ĐỀ: {currentQuestion.topic.toUpperCase()}</Text>
                <Text style={styles.targetSentence}>"{currentQuestion.targetText}"</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => handleSelectLevel(selectedLevel)}
              disabled={isGenerating}
            >
              <Text style={styles.refreshBtnText}>🔄 ĐỔI CÂU THÁCH ĐẤU MỚI</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startBtn} onPress={startMatch}>
              <Text style={styles.startBtnText}>⚔️ TÌM TRẬN ĐẤU REALTIME</Text>
            </TouchableOpacity>
          </View>
        )}

        {battleState === 'searching' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>🔍 ĐANG GHÉP CẶP ĐỐI THỦ LEVEL {selectedLevel}...</Text>
          </View>
        )}

        {battleState === 'battling' && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>⚡ TRẬN ĐẤU ĐANG DIỄN RA ({selectedLevel})</Text>
            <Text style={styles.targetSentence}>"{currentQuestion.targetText}"</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.winBtn} onPress={() => endMatch(true)}>
                <Text style={styles.btnText}>🏆 CHIẾN THẮNG (+50 XP)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.loseBtn} onPress={() => endMatch(false)}>
                <Text style={styles.btnText}>💀 THẤT BẠI (+10 XP)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {battleState === 'ended' && (
          <View style={styles.box}>
            <Text style={styles.resultTitle}>
              {winner === 'YOU' ? '🎉 BẠN ĐÃ CHIẾN THẮNG!' : '💀 BẠN ĐÃ THẤT BẠI!'}
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => setBattleState('idle')}>
              <Text style={styles.startBtnText}>🔄 THI ĐẤU TRẬN MỚI</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 13, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 8 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  levelBadge: { backgroundColor: '#0D0620', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255' },
  levelBadgeActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  levelText: { color: '#8888AA', fontSize: 11, fontWeight: '900' },
  levelTextActive: { color: '#FFF' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 12 },
  topicBox: { alignItems: 'center', marginBottom: 10 },
  topicText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  searchingText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold' },
  targetSentence: { color: '#FFF', fontSize: 14, fontWeight: '800', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#FF007F', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  winBtn: { backgroundColor: '#39FF14', padding: 12, borderRadius: 8, width: '48%', alignItems: 'center' },
  loseBtn: { backgroundColor: '#FF0055', padding: 12, borderRadius: 8, width: '48%', alignItems: 'center' },
  btnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  resultTitle: { color: '#39FF14', fontSize: 15, fontWeight: '900', marginBottom: 15 }
});