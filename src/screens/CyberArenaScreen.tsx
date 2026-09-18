// src/screens/CyberArenaScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LevelTopicSelector, CEFRLevel } from '../components/LevelTopicSelector';
import { generateSoloTopic, SoloTopic } from '../services/arena/soloService';
import { generateRelayChallenge, RelayChallenge } from '../services/arena/relayService';
import { generateRoleplayScenario, RoleplayScenario } from '../services/arena/roleplayService';

interface Props {
  onBack: () => void;
}

export default function CyberArenaScreen({ onBack }: Props) {
  const [arenaTier, setArenaTier] = useState<1 | 2 | 3>(1);
  const [opponentType, setOpponentType] = useState<'bot' | 'human'>('bot');
  
  // 🎯 QUẢN LÝ CẤP ĐỘ CEFR (A1 - C1) VÀ CHỦ ĐỀ
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B2');
  const [topicContext, setTopicContext] = useState<string>('Tech & AI Innovations');

  const [loading, setLoading] = useState<boolean>(true);
  const [soloData, setSoloData] = useState<SoloTopic | null>(null);
  const [relayData, setRelayData] = useState<RelayChallenge | null>(null);
  const [roleplayData, setRoleplayData] = useState<RoleplayScenario | null>(null);

  const loadArenaChallenge = async (tier = arenaTier, level = cefrLevel, topic = topicContext) => {
    setLoading(true);
    if (tier === 1) {
      const data = await generateSoloTopic(level);
      setSoloData(data);
    } else if (tier === 2) {
      const data = await generateRelayChallenge(level);
      setRelayData(data);
    } else {
      const data = await generateRoleplayScenario(level);
      setRoleplayData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadArenaChallenge(arenaTier, cefrLevel, topicContext);
  }, [arenaTier]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: CYBER ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {/* 👥 1. CHỌN ĐỐI THỦ THI ĐẤU */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>👥 CHỌN ĐỐI THỦ THI ĐẤU:</Text>
          <View style={styles.rowSelector}>
            <TouchableOpacity 
              style={[styles.selectBtn, opponentType === 'bot' && styles.activeBot]}
              onPress={() => setOpponentType('bot')}
            >
              <Text style={[styles.btnText, opponentType === 'bot' && styles.activeText]}>🤖 MÁY (PvE BOT)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.selectBtn, opponentType === 'human' && styles.activeHuman]}
              onPress={() => setOpponentType('human')}
            >
              <Text style={[styles.btnText, opponentType === 'human' && styles.activeText]}>👥 NGƯỜI THẬT (PvP)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🎯 2. CHỌN CHẾ ĐỘ THI ĐẤU (3 TẦNG) */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>🎯 CHỌN CHẾ ĐỘ THI ĐẤU:</Text>
          <View style={styles.tierSelector}>
            <TouchableOpacity style={[styles.tab, arenaTier === 1 && styles.activeTab1]} onPress={() => setArenaTier(1)}>
              <Text style={styles.tabText}>TẦNG 1: SOLO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, arenaTier === 2 && styles.activeTab2]} onPress={() => setArenaTier(2)}>
              <Text style={styles.tabText}>TẦNG 2: RELAY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, arenaTier === 3 && styles.activeTab3]} onPress={() => setArenaTier(3)}>
              <Text style={styles.tabText}>TẦNG 3: ROLEPLAY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 📊 3. CHỌN CẤP ĐỘ THI ĐẤU (CEFR A1-C1 & CHỦ ĐỀ) */}
        <View style={{ width: '100%' }}>
          <LevelTopicSelector
            currentLevel={cefrLevel}
            currentTopic={topicContext}
            onSelectLevel={(lvl) => {
              setCefrLevel(lvl);
              loadArenaChallenge(arenaTier, lvl, topicContext);
            }}
            onSelectTopic={(tpc) => {
              setTopicContext(tpc);
              loadArenaChallenge(arenaTier, cefrLevel, tpc);
            }}
          />
        </View>

        {/* 🥊 KHUNG HIỂN THỊ THÁCH ĐẤU */}
        {loading ? (
          <ActivityIndicator size="large" color="#FF007F" style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.card}>
            {arenaTier === 1 && soloData && (
              <>
                <Text style={styles.cardTitle}>🎙️ {soloData.title} [{cefrLevel}]</Text>
                <Text style={styles.cardDesc}>"{soloData.promptText}"</Text>
                <Text style={styles.keyText}>🔑 Gợi ý từ khóa: {soloData.keywords?.join(', ')}</Text>
              </>
            )}

            {arenaTier === 2 && relayData && (
              <>
                <Text style={styles.cardTitle}>👥 {relayData.topic} [{cefrLevel}]</Text>
                <View style={styles.relayBox}>
                  <Text style={styles.playerTag}>👤 ĐỒNG ĐỘI 1:</Text>
                  <Text style={styles.cardDesc}>"{relayData.player1Prompt}"</Text>
                </View>
                <View style={[styles.relayBox, { borderColor: '#FF007F' }]}>
                  <Text style={[styles.playerTag, { color: '#FF007F' }]}>👤 ĐỒNG ĐỘI 2:</Text>
                  <Text style={styles.cardDesc}>"{relayData.player2Prompt}"</Text>
                </View>
                <Text style={styles.keyText}>🎯 Tiêu chí: {relayData.scoringFocus}</Text>
              </>
            )}

            {arenaTier === 3 && roleplayData && (
              <>
                <Text style={styles.cardTitle}>🎭 {roleplayData.scenarioTitle} [{cefrLevel}]</Text>
                <Text style={styles.roleText}>🤖 AI Bot: {roleplayData.aiRole} | 👨‍🎓 Bạn: {roleplayData.userRole}</Text>
                <Text style={styles.cardDesc}>💬 AI Bot nói: "{roleplayData.initialAiMessage}"</Text>
                <Text style={styles.keyText}>🎯 Mục tiêu: {roleplayData.goal}</Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={() => loadArenaChallenge(arenaTier, cefrLevel, topicContext)}>
          <Text style={styles.nextText}>🔄 TẠO ĐỀ THÁCH ĐẤU MỚI ({cefrLevel})</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 14, paddingTop: 45 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 13, fontWeight: '900' },

  sectionBox: { width: '100%', marginBottom: 10, backgroundColor: '#0D0620', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#221144' },
  sectionLabel: { color: '#00ffcc', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  
  rowSelector: { flexDirection: 'row', justifyContent: 'space-between' },
  selectBtn: { width: '48%', paddingVertical: 8, backgroundColor: '#1a1a3a', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#332255' },
  activeBot: { backgroundColor: '#003344', borderColor: '#00FFFF' },
  activeHuman: { backgroundColor: '#440022', borderColor: '#FF007F' },
  btnText: { color: '#8888cc', fontSize: 10, fontWeight: 'bold' },
  activeText: { color: '#FFF' },

  tierSelector: { flexDirection: 'row', justifyContent: 'space-between' },
  tab: { width: '32%', paddingVertical: 8, backgroundColor: '#1a1a3a', borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  activeTab1: { borderColor: '#00FFFF', backgroundColor: '#003344' },
  activeTab2: { borderColor: '#FF007F', backgroundColor: '#440022' },
  activeTab3: { borderColor: '#FFD700', backgroundColor: '#443300' },
  tabText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  card: { width: '100%', backgroundColor: '#0D0620', padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#FF007F', marginVertical: 10 },
  cardTitle: { color: '#00FFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  cardDesc: { color: '#FFF', fontSize: 12, fontStyle: 'italic', marginBottom: 6, textAlign: 'center' },
  keyText: { color: '#FFD700', fontSize: 10, textAlign: 'center' },

  relayBox: { backgroundColor: '#05020D', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 6 },
  playerTag: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  roleText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },

  nextBtn: { backgroundColor: '#110022', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 20 },
  nextText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' }
});