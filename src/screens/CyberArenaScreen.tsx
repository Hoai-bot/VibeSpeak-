// src/screens/CyberArenaScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
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
  const [roomId, setRoomId] = useState<string>('ROOM_5384');
  
  // 🎯 STATE QUẢN LÝ CẤP ĐỘ CEFR (A1 - C1) & CHỦ ĐỀ
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
        <Text style={styles.title}>⚔️ TRẠM 2: ĐẤU TRƯỜNG TẤT TAY</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {/* Banner tiêu đề */}
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTag}>[ REAL-TIME ARENA ]</Text>
          <Text style={styles.bannerTitle}>THI ĐẤU PHẢN XẠ & CƯỢC EXP</Text>
          <Text style={styles.bannerSub}>Luyện tập phản xạ cùng AI Bot hoặc tạo phòng thách đấu trực tiếp với đồng đội thực tế.</Text>
        </View>

        {/* 1. CHỌN ĐỐI THỦ THI ĐẤU */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>👥 CHỌN ĐỐI THỦ THI ĐẤU:</Text>
          <View style={styles.rowSelector}>
            <TouchableOpacity 
              style={[styles.selectBtn, opponentType === 'bot' && styles.activeBot]}
              onPress={() => setOpponentType('bot')}
            >
              <Text style={[styles.btnText, opponentType === 'bot' && styles.activeText]}>🤖 ĐẤU VỚI AI BOT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.selectBtn, opponentType === 'human' && styles.activeHuman]}
              onPress={() => setOpponentType('human')}
            >
              <Text style={[styles.btnText, opponentType === 'human' && styles.activeText]}>👥 ĐẤU VỚI NGƯỜI THẬT</Text>
            </TouchableOpacity>
          </View>

          {opponentType === 'human' && (
            <View style={styles.roomBox}>
              <Text style={styles.roomLabel}>🔑 Nhập mã phòng để ghép cặp (hoặc để tự tạo mã mới):</Text>
              <TextInput
                style={styles.roomInput}
                value={roomId}
                onChangeText={setRoomId}
                placeholder="Nhập Mã Phòng..."
                placeholderTextColor="#666"
              />
            </View>
          )}
        </View>

        {/* 2. CHỌN CHẾ ĐỘ THI ĐẤU (3 TẦNG) */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>🎯 CHỌN CHẾ ĐỘ THI ĐẤU:</Text>
          
          <TouchableOpacity 
            style={[styles.tierCard, arenaTier === 1 && styles.activeTier1]} 
            onPress={() => setArenaTier(1)}
          >
            <Text style={styles.tierTitle}>⚡ TẦNG 1: SOLO 30S PULSE</Text>
            <Text style={styles.tierSub}>Phản xạ nhanh 30 giây với đề bài AI ngắn hạn. Tối đa 50 EXP.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tierCard, arenaTier === 2 && styles.activeTier2]} 
            onPress={() => setArenaTier(2)}
          >
            <Text style={styles.tierTitle}>⚔️ TẦNG 2: DUEL 60S ARENA (RELAY)</Text>
            <Text style={styles.tierSub}>Đấu tranh luận 2/2 trong 60 giây. Thắng ăn trọn pool cược!</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tierCard, arenaTier === 3 && styles.activeTier3]} 
            onPress={() => setArenaTier(3)}
          >
            <Text style={styles.tierTitle}>🎭 TẦNG 3: ROLEPLAY 60S (NHẬP VAI)</Text>
            <Text style={styles.tierSub}>Nhập vai xử lý tình huống thực tế (2 vai A-B). Thử thách ứng biến!</Text>
          </TouchableOpacity>
        </View>

        {/* 🎯 3. BỘ CHỌN CẤP ĐỘ CEFR (A1-C1) VÀ CHỦ ĐỀ - NẰM NGAY ĐÂY */}
        <View style={{ width: '100%', marginBottom: 15 }}>
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

        {/* 🥊 KHUNG THÁCH ĐẤU VÀ NÚT BẮT ĐẦU */}
        {loading ? (
          <ActivityIndicator size="large" color="#FF007F" style={{ marginVertical: 20 }} />
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
                  <Text style={styles.playerTag}>👤 ĐỒNG ĐỘI 1 (Mở đề):</Text>
                  <Text style={styles.cardDesc}>"{relayData.player1Prompt}"</Text>
                </View>
                <View style={[styles.relayBox, { borderColor: '#FF007F' }]}>
                  <Text style={[styles.playerTag, { color: '#FF007F' }]}>👤 ĐỒNG ĐỘI 2 (Nối câu):</Text>
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

        <TouchableOpacity style={styles.startBtn} onPress={() => loadArenaChallenge(arenaTier, cefrLevel, topicContext)}>
          <Text style={styles.startBtnText}>⚡ TẠO ĐỀ THÁCH ĐẤU MỚI ({cefrLevel})</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0518', padding: 16, paddingTop: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#160933', borderRadius: 6, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 13, fontWeight: '900' },

  headerBanner: { width: '100%', alignItems: 'center', marginBottom: 15, padding: 12, backgroundColor: '#120826', borderRadius: 12, borderWidth: 1, borderColor: '#3A1559' },
  bannerTag: { color: '#00FFCC', fontSize: 10, fontWeight: 'bold' },
  bannerTitle: { color: '#FFD700', fontSize: 16, fontWeight: '900', marginVertical: 4 },
  bannerSub: { color: '#AAAABB', fontSize: 11, textAlign: 'center' },

  sectionBox: { width: '100%', marginBottom: 15, backgroundColor: '#120826', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2A1040' },
  sectionLabel: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold', marginBottom: 8 },

  rowSelector: { flexDirection: 'row', justifyContent: 'space-between' },
  selectBtn: { width: '48%', paddingVertical: 10, backgroundColor: '#1A0B36', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3A1559' },
  activeBot: { backgroundColor: '#003344', borderColor: '#00FFCC' },
  activeHuman: { backgroundColor: '#440022', borderColor: '#FF007F' },
  btnText: { color: '#8888CC', fontSize: 11, fontWeight: 'bold' },
  activeText: { color: '#FFF' },

  roomBox: { marginTop: 10 },
  roomLabel: { color: '#AAAABB', fontSize: 10, marginBottom: 4 },
  roomInput: { backgroundColor: '#0A0518', color: '#00FFCC', borderWidth: 1, borderColor: '#00FFCC', padding: 8, borderRadius: 8, fontWeight: 'bold' },

  tierCard: { padding: 10, backgroundColor: '#1A0B36', borderRadius: 8, borderWidth: 1, borderColor: '#3A1559', marginBottom: 8 },
  activeTier1: { borderColor: '#00FFCC', backgroundColor: '#002B36' },
  activeTier2: { borderColor: '#FF007F', backgroundColor: '#3A0022' },
  activeTier3: { borderColor: '#FFD700', backgroundColor: '#3A2B00' },
  tierTitle: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  tierSub: { color: '#8888CC', fontSize: 10, marginTop: 2 },

  card: { width: '100%', backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#FF007F', marginBottom: 15 },
  cardTitle: { color: '#00FFCC', fontSize: 15, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  cardDesc: { color: '#FFF', fontSize: 12, fontStyle: 'italic', marginBottom: 6, textAlign: 'center' },
  keyText: { color: '#FFD700', fontSize: 10, textAlign: 'center' },

  relayBox: { backgroundColor: '#0A0518', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFCC', marginBottom: 6 },
  playerTag: { color: '#00FFCC', fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  roleText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },

  startBtn: { backgroundColor: '#FF007F', padding: 14, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 25 },
  startBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' }
});