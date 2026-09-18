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
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B2');
  const [topicContext, setTopicContext] = useState<string>('Business & Startup');

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

      {/* Selector 3 Tầng Arena */}
      <View style={styles.tierSelector}>
        <TouchableOpacity style={[styles.tab, arenaTier === 1 && styles.activeTab1]} onPress={() => setArenaTier(1)}>
          <Text style={styles.tabText}>TẦNG 1: SOLO (PvE)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, arenaTier === 2 && styles.activeTab2]} onPress={() => setArenaTier(2)}>
          <Text style={styles.tabText}>TẦNG 2: RELAY (PvP)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, arenaTier === 3 && styles.activeTab3]} onPress={() => setArenaTier(3)}>
          <Text style={styles.tabText}>TẦNG 3: ROLEPLAY</Text>
        </TouchableOpacity>
      </View>

      {/* Bộ Chọn Cấp Độ CEFR & Chủ Đề */}
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

      {/* Nội dung Thách đấu */}
      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF007F" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.card}>
            {arenaTier === 1 && soloData && (
              <>
                <Text style={styles.cardTitle}>🎙️ {soloData.title}</Text>
                <Text style={styles.cardDesc}>"{soloData.promptText}"</Text>
                <Text style={styles.keyText}>🔑 Từ khóa gợi ý: {soloData.keywords?.join(', ')}</Text>
              </>
            )}

            {arenaTier === 2 && relayData && (
              <>
                <Text style={styles.cardTitle}>👥 {relayData.topic}</Text>
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
                <Text style={styles.cardTitle}>🎭 {roleplayData.scenarioTitle}</Text>
                <Text style={styles.roleText}>🤖 AI Bot: {roleplayData.aiRole}  |  👨‍🎓 Bạn: {roleplayData.userRole}</Text>
                <Text style={styles.cardDesc}>💬 AI Bot nói: "{roleplayData.initialAiMessage}"</Text>
                <Text style={styles.keyText}>🎯 Mục tiêu: {roleplayData.goal}</Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={() => loadArenaChallenge(arenaTier, cefrLevel, topicContext)}>
          <Text style={styles.nextText}>🔄 ĐỔI THÁCH ĐẤU MỚI</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 16, paddingTop: 45 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 13, fontWeight: '900' },

  tierSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tab: { width: '32%', paddingVertical: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  activeTab1: { borderColor: '#00FFFF', backgroundColor: '#003344' },
  activeTab2: { borderColor: '#FF007F', backgroundColor: '#440022' },
  activeTab3: { borderColor: '#FFD700', backgroundColor: '#443300' },
  tabText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },

  card: { width: '100%', backgroundColor: '#0D0620', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', marginBottom: 12 },
  cardTitle: { color: '#00FFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  cardDesc: { color: '#FFF', fontSize: 13, fontStyle: 'italic', marginBottom: 8, textAlign: 'center' },
  keyText: { color: '#FFD700', fontSize: 10, textAlign: 'center', marginTop: 4 },
  
  relayBox: { backgroundColor: '#05020D', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 8 },
  playerTag: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  roleText: { color: '#AAAABB', fontSize: 11, textAlign: 'center', marginBottom: 8 },

  nextBtn: { backgroundColor: '#110022', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center' },
  nextText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' }
});