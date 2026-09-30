// src/screens/AllInArenaScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { generateSoloTopic, SoloTopic } from '../services/arena/soloService';
import { generateRelayChallenge, RelayChallenge } from '../services/arena/relayService';
import { generateRoleplayScenario, RoleplayScenario } from '../services/arena/roleplayService';
import { updateUserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function AllInArenaScreen({ onBack }: Props) {
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [loading, setLoading] = useState<boolean>(false);

  const [soloTopic, setSoloTopic] = useState<SoloTopic | null>(null);
  const [relayChallenge, setRelayChallenge] = useState<RelayChallenge | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<RoleplayScenario | null>(null);

  const [battleState, setBattleState] = useState<'idle' | 'searching' | 'battling' | 'ended'>('idle');
  const [winner, setWinner] = useState<string | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const loadModeData = async (selectedMode: string, level: string) => {
    setLoading(true);
    if (selectedMode === 'solo') {
      const data = await generateSoloTopic(level);
      setSoloTopic(data);
    } else if (selectedMode === 'relay') {
      const data = await generateRelayChallenge(level);
      setRelayChallenge(data);
    } else {
      const data = await generateRoleplayScenario(level);
      setRoleplayScenario(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadModeData(mode, cefrLevel);
  }, [mode, cefrLevel]);

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
        {/* CHỌN CHẾ ĐỘ THI ĐẤU (SOLO, RELAY, ROLEPLAY) */}
        <Text style={styles.sectionLabel}>CHỌN CHẾ ĐỘ ĐẤU TRƯỜNG:</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.modeTab, mode === 'solo' && styles.modeTabActive]} 
            onPress={() => setMode('solo')}
          >
            <Text style={[styles.modeTabText, mode === 'solo' && styles.modeTextActive]}>🔥 SOLO PULSE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeTab, mode === 'relay' && styles.modeTabActive]} 
            onPress={() => setMode('relay')}
          >
            <Text style={[styles.modeTabText, mode === 'relay' && styles.modeTextActive]}>🤝 RELAY 2P</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeTab, mode === 'roleplay' && styles.modeTabActive]} 
            onPress={() => setMode('roleplay')}
          >
            <Text style={[styles.modeTabText, mode === 'roleplay' && styles.modeTextActive]}>🎭 ROLEPLAY</Text>
          </TouchableOpacity>
        </View>

        {/* CHỌN LEVEL TỪ A1 ĐẾN C2 */}
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.cefrBadge,
                cefrLevel === lvl && styles.cefrBadgeActive,
                lvl === 'C2' && { borderColor: '#FF007F' }
              ]}
              onPress={() => setCefrLevel(lvl)}
            >
              <Text style={[
                styles.cefrText, 
                cefrLevel === lvl && styles.cefrTextActive,
                lvl === 'C2' && { color: '#FF007F' }
              ]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {battleState === 'idle' && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>⚡ THÁCH ĐẤU [{mode.toUpperCase()}] • LEVEL {cefrLevel}</Text>
            
            {loading ? (
              <ActivityIndicator size="small" color="#FF007F" style={{ marginVertical: 15 }} />
            ) : (
              <View style={{ width: '100%', alignItems: 'center' }}>
                {mode === 'solo' && soloTopic && (
                  <>
                    <Text style={styles.topicTitle}>{soloTopic.title}</Text>
                    <Text style={styles.promptText}>"{soloTopic.promptText}"</Text>
                  </>
                )}

                {mode === 'relay' && relayChallenge && (
                  <>
                    <Text style={styles.topicTitle}>📌 {relayChallenge.topic}</Text>
                    <Text style={styles.promptText}>💡 Context: {relayChallenge.context}</Text>
                    <Text style={styles.subText}>👤 Player 1: {relayChallenge.player1Guideline}</Text>
                    <Text style={styles.subText}>👥 Player 2: {relayChallenge.player2Guideline}</Text>
                  </>
                )}

                {mode === 'roleplay' && roleplayScenario && (
                  <>
                    <Text style={styles.topicTitle}>🎭 {roleplayScenario.scenarioTitle}</Text>
                    <Text style={styles.promptText}>🤖 AI Bot: "{roleplayScenario.initialAiMessage}"</Text>
                    <Text style={styles.subText}>🎯 Goal: {roleplayScenario.goal}</Text>
                  </>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => loadModeData(mode, cefrLevel)}
              disabled={loading}
            >
              <Text style={styles.refreshBtnText}>🔄 TẠO ĐỀ THÁCH ĐẤU MỚI</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startBtn} onPress={startMatch}>
              <Text style={styles.startBtnText}>⚔️ BẮT ĐẦU VÀO TRẬN ĐẤU</Text>
            </TouchableOpacity>
          </View>
        )}

        {battleState === 'searching' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>🔍 ĐANG KẾT NỐI ĐỐI THỦ CHUẨN LEVEL {cefrLevel}...</Text>
          </View>
        )}

        {battleState === 'battling' && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>⚡ TRẬN ĐẤU ĐANG DIỄN RA ({cefrLevel})</Text>
            <Text style={styles.promptText}>Ghi âm câu trả lời phản xạ bằng giọng nói của bạn...</Text>
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
  title: { color: '#FF007F', fontSize: 12, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 8 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  modeTab: { backgroundColor: '#0D0620', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '32%', alignItems: 'center' },
  modeTabActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  modeTabText: { color: '#8888AA', fontSize: 9, fontWeight: '900' },
  modeTextActive: { color: '#FFF' },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginBottom: 12 },
  topicTitle: { color: '#00FFFF', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  promptText: { color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 18, marginBottom: 10 },
  subText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 4 },
  searchingText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold' },
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