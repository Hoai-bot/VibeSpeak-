// src/screens/AllInArenaScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import LiveArenaMatchScreen from './LiveArenaMatchScreen';
import { Groq } from 'groq-sdk';

interface Props {
  onBack: () => void;
}

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const usedTopicsHistory = new Set<string>();

export default function AllInArenaScreen({ onBack }: Props) {
  const [inMatch, setInMatch] = useState<boolean>(false);
  const [loadingTopic, setLoadingTopic] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<'SOLO_30S' | 'DUEL_60S' | 'ROLEPLAY_60S'>('SOLO_30S');
  
  // 🎯 TÍNH NĂNG MỚI: ĐỐI THỦ & MÃ PHÒNG
  const [opponentType, setOpponentType] = useState<'BOT' | 'PVP_ROOM'>('BOT');
  const [customRoomId, setCustomRoomId] = useState<string>('');
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<any>(null);

  const generateNewAiTopic = async (mode: 'SOLO_30S' | 'DUEL_60S' | 'ROLEPLAY_60S') => {
    // Nếu chọn PvP Room mà chưa nhập mã phòng -> Tự sinh mã phòng ngẫu nhiên
    let roomIdToUse = customRoomId.trim().toUpperCase();
    if (opponentType === 'PVP_ROOM' && !roomIdToUse) {
      roomIdToUse = `ROOM_${Math.floor(1000 + Math.random() * 9000)}`;
      setCustomRoomId(roomIdToUse);
    } else if (opponentType === 'BOT') {
      roomIdToUse = `BOT_${Math.floor(100 + Math.random() * 900)}`;
    }
    setActiveRoomId(roomIdToUse);

    setLoadingTopic(true);
    const historyExcludes = Array.from(usedTopicsHistory).slice(-10).join('; ');

    const systemPrompt = `You are an AI Cyber Arena Challenge Generator.
Generate ONE unique, creative English speaking prompt for mode: ${mode}.
Topic types: Business Pitch, Tech Debate, Airport/Hotel Crisis, Job Interview, Cyberpunk Situations.
DO NOT use any of these previously generated situations: [${historyExcludes}].

Return ONLY a valid JSON object:
{
  "focus": "ALL-IN ARENA • ${mode}",
  "topicTitle": "Short Catchy Title (3-5 words)",
  "situation": "Detailed challenge scenario in 15-25 words",
  "hint": "Useful speaking strategy hint in Vietnamese"
}`;

    try {
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: systemPrompt }],
        model: 'openai/gpt-oss-20b',
        temperature: 0.95,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
      
      const newTopic = {
        focus: parsed.focus || `ALL-IN ARENA • ${mode}`,
        topicTitle: parsed.topicTitle || 'Cyber Challenge',
        situation: parsed.situation || 'You are stuck in an elevator with a top investor for 30 seconds. Introduce your startup idea concisely!',
        hint: parsed.hint || 'Trình bày ngắn gọn vấn đề, giải pháp và giá trị cốt lõi.'
      };

      usedTopicsHistory.add(newTopic.situation.toLowerCase());
      setCurrentTopic(newTopic);
      setSelectedMode(mode);
      setInMatch(true);

    } catch (e) {
      console.error("❌ Lỗi sinh đề Groq AI:", e);
      setCurrentTopic({
        focus: `ALL-IN ARENA • ${mode}`,
        topicTitle: 'Emergency Elevator Pitch',
        situation: 'You are stuck in an elevator with a top investor for 30 seconds. Introduce your startup idea concisely!',
        hint: 'Nêu bật bài toán và giá trị cốt lõi ngay lập tức.'
      });
      setSelectedMode(mode);
      setInMatch(true);
    } finally {
      setLoadingTopic(false);
    }
  };

  const getOpponentData = () => {
    if (opponentType === 'PVP_ROOM') {
      return {
        name: 'Đồng Đội Realtime',
        exp: 1200,
        avatar: '👤',
        tier: 'PLATINUM'
      };
    }
    return {
      name: `Cyber_Bot_${Math.floor(Math.random() * 89 + 10)}`,
      exp: Math.floor(Math.random() * 300 + 600),
      avatar: '🤖',
      tier: 'GOLD'
    };
  };

  if (inMatch && currentTopic) {
    return (
      <LiveArenaMatchScreen
        mode={selectedMode}
        opponent={getOpponentData()}
        topic={currentTopic}
        roomId={activeRoomId}
        isPvP={opponentType === 'PVP_ROOM'}
        onExitArena={() => setInMatch(false)}
        onNextMatch={() => generateNewAiTopic(selectedMode)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 SUBWAY MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏟️ TRẠM 2: ĐẤU TRƯỜNG TẤT TAY</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTag}>[ REAL-TIME ARENA ]</Text>
          <Text style={styles.bannerTitle}>THI ĐẤU PHẢN XẠ & CƯỢC EXP</Text>
          <Text style={styles.bannerDesc}>
            Luyện tập phản xạ cùng AI Bot hoặc tạo phòng thách đấu 1v1 trực tiếp với đồng đội thực tế.
          </Text>
        </View>

        {/* 🎯 TÍNH NĂNG CHỌN ĐỐI THỦ: BOT VS NGƯỜI THẬT */}
        <Text style={styles.sectionHeader}>👥 CHỌN ĐỐI THỦ THI ĐẤU</Text>
        <View style={styles.opponentTypeRow}>
          <TouchableOpacity 
            style={[styles.opponentTypeBtn, opponentType === 'BOT' && styles.activeOpponentBtn]}
            onPress={() => setOpponentType('BOT')}
          >
            <Text style={styles.opponentTypeTitle}>🤖 ĐẤU VỚI AI BOT</Text>
            <Text style={styles.opponentTypeSub}>Ghép trận tức thì 24/7</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.opponentTypeBtn, opponentType === 'PVP_ROOM' && styles.activeOpponentBtn]}
            onPress={() => setOpponentType('PVP_ROOM')}
          >
            <Text style={styles.opponentTypeTitle}>⚔️ PHÒNG 2 NGƯỜI THẬT</Text>
            <Text style={styles.opponentTypeSub}>Tạo/Nhập mã phòng bạn bè</Text>
          </TouchableOpacity>
        </View>

        {/* Ô Nhập Mã Phòng khi chọn PvP */}
        {opponentType === 'PVP_ROOM' && (
          <View style={styles.roomBox}>
            <Text style={styles.roomBoxLabel}>🔑 NHẬP MÃ PHÒNG (Để trống để tự tạo mã mới):</Text>
            <TextInput
              style={styles.roomInput}
              placeholder="VD: ROOM_9999"
              placeholderTextColor="#666"
              value={customRoomId}
              onChangeText={setCustomRoomId}
              autoCapitalize="characters"
            />
          </View>
        )}

        <Text style={styles.sectionHeader}>🎯 CHỌN CHẾ ĐỘ THI ĐẤU</Text>

        <TouchableOpacity 
          style={[styles.modeCard, selectedMode === 'SOLO_30S' && styles.activeMode]}
          onPress={() => setSelectedMode('SOLO_30S')}
        >
          <Text style={styles.modeTitle}>⚡ TẦNG 1: SOLO 30S PULSE</Text>
          <Text style={styles.modeDesc}>Phản xạ nhanh 30 giây với đề bài AI ngẫu nhiên. Tối đa 50 EXP.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeCard, selectedMode === 'DUEL_60S' && styles.activeMode]}
          onPress={() => setSelectedMode('DUEL_60S')}
        >
          <Text style={styles.modeTitle}>⚔️ TẦNG 2: DUEL 60S ARENA</Text>
          <Text style={styles.modeDesc}>Đấu tranh luận 1v1 trong 60 giây. Thắng ăn trọn pool cược!</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeCard, selectedMode === 'ROLEPLAY_60S' && styles.activeMode]}
          onPress={() => setSelectedMode('ROLEPLAY_60S')}
        >
          <Text style={styles.modeTitle}>🎭 TẦNG 3: ROLEPLAY 60S (NHẬP VAI)</Text>
          <Text style={styles.modeDesc}>Nhập vai xử lý tình huống thực tế (2 vai A-B). Thử thách ứng biến!</Text>
        </TouchableOpacity>

        {loadingTopic ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity 
            style={styles.startMatchBtn} 
            onPress={() => generateNewAiTopic(selectedMode)}
          >
            <Text style={styles.startMatchText}>
              {opponentType === 'PVP_ROOM' ? '🔑 MỞ PHÒNG & TẠO ĐỀ THI ĐẤU' : '🚀 VÀO TRẬN ĐẤU NGAY'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FF007F', marginRight: 15 },
  backText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  title: { color: '#FF007F', fontSize: 14, fontWeight: '900', fontFamily: 'Courier New' },
  content: { alignItems: 'center', width: '100%' },
  bannerCard: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 20 },
  bannerTag: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 6 },
  bannerTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 8, textAlign: 'center' },
  bannerDesc: { color: '#AAAABB', fontSize: 11, fontFamily: 'Courier New', textAlign: 'center', lineHeight: 16 },
  sectionHeader: { color: '#00FFFF', fontSize: 12, fontWeight: 'bold', fontFamily: 'Courier New', alignSelf: 'flex-start', marginBottom: 12 },
  
  opponentTypeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  opponentTypeBtn: { backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#332255', width: '48%', alignItems: 'center' },
  activeOpponentBtn: { borderColor: '#00FFFF', backgroundColor: '#0A1828' },
  opponentTypeTitle: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 4 },
  opponentTypeSub: { color: '#8888AA', fontSize: 9, fontFamily: 'Courier New', textAlign: 'center' },

  roomBox: { backgroundColor: '#110620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', width: '100%', marginBottom: 15 },
  roomBoxLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 8 },
  roomInput: { backgroundColor: '#05020D', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', color: '#FFF', fontSize: 12, fontFamily: 'Courier New', fontWeight: 'bold' },

  modeCard: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#332255', width: '100%', marginBottom: 12 },
  activeMode: { borderColor: '#39FF14', backgroundColor: '#0A2210' },
  modeTitle: { color: '#39FF14', fontSize: 13, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 4 },
  modeDesc: { color: '#8888AA', fontSize: 11, fontFamily: 'Courier New' },
  startMatchBtn: { backgroundColor: '#FF007F', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 15 },
  startMatchText: { color: '#FFF', fontSize: 13, fontWeight: '900', fontFamily: 'Courier New' }
});