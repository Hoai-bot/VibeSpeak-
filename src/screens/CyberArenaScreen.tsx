// src/screens/CyberArenaScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { generateSoloTopic, SoloTopic } from '../services/arena/soloService';
import { generateRelayChallenge, RelayChallenge } from '../services/arena/relayService';
import { generateRoleplayScenario, RoleplayScenario } from '../services/arena/roleplayService';
import { gradeFlexibleArenaResponse, GradeResult } from '../services/groqClient';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

interface Props {
  onBack: () => void;
}

export default function CyberArenaScreen({ onBack }: Props) {
  const [arenaTier, setArenaTier] = useState<1 | 2 | 3>(1);
  const [opponentType, setOpponentType] = useState<'bot' | 'human'>('bot');
  const [roomId, setRoomId] = useState<string>('ROOM_5384');
  
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B2');

  const [loading, setLoading] = useState<boolean>(true);
  const [soloData, setSoloData] = useState<SoloTopic | null>(null);
  const [relayData, setRelayData] = useState<RelayChallenge | null>(null);
  const [roleplayData, setRoleplayData] = useState<RoleplayScenario | null>(null);

  // 🎙️ STATE QUẢN LÝ GHI ÂM VÀ CHẤM ĐIỂM 3D
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  // ⏱️ STATE ĐỒNG HỒ ĐẾM NGƯỢC 30S CHO TẦNG RELAY
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const timerRef = useRef<any>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

  const loadArenaChallenge = async (tier = arenaTier, level = cefrLevel) => {
    stopTimer();
    setLoading(true);
    setResult(null);
    setRecordedAudioUri(null);
    try {
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
    } catch (e) {
      console.error("Error loading challenge:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArenaChallenge(arenaTier, cefrLevel);
  }, [arenaTier]);

  // ⏱️ HÀM BẮT ĐẦU ĐỒNG HỒ ĐẾM NGƯỢC 30S LẦN LƯỢT CHO 2 BẠN
  const startTimer = () => {
    setTimeLeft(30);
    setActivePlayer(1);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setActivePlayer((current) => (current === 1 ? 2 : 1));
          return 30; // Reset lại 30s cho lượt tiếp theo
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(30);
    setActivePlayer(1);
  };

  // 🎙️ BẮT ĐẦU GHI ÂM MICRO & ĐỒNG HỒ
  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert("Trình duyệt không hỗ trợ Micro!");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setResult(null);
      setRecordedAudioUri(null);

      // Kích hoạt đồng hồ nếu ở Tầng Relay
      if (arenaTier === 2) startTimer();
    } catch (err) {
      alert("Chưa cấp quyền truy cập Micro!");
    }
  };

  // ⏹️ DỪNG GHI ÂM VÀ GỬI AI CHẤM ĐIỂM
  const stopAndGrade = async () => {
    stopTimer();
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    setIsRecording(false);
    setIsAnalyzing(true);

    const processAudio = new Promise<{ blob: Blob; url: string }>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
        }
        resolve({ blob, url });
      };
      mediaRecorder.stop();
    });

    try {
      const { blob, url } = await processAudio;
      setRecordedAudioUri(url);

      if (blob.size < 1000) {
        setResult({ score: 0, phoneticScore: 0, fluencyScore: 0, semanticScore: 0, transcribedText: "(Âm thanh quá ngắn)", feedback: "Hãy nói rõ ràng hơn trong 30-60 giây!" });
        setIsAnalyzing(false);
        return;
      }

      let targetContext = "";
      if (arenaTier === 1) targetContext = soloData?.promptText || "";
      else if (arenaTier === 2) targetContext = `${relayData?.topic}: ${relayData?.context}`;
      else targetContext = `${roleplayData?.scenarioTitle}: ${roleplayData?.goal}`;

      const res = await gradeFlexibleArenaResponse(blob, targetContext);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playRecordedAudio = () => {
    if (recordedAudioUri) {
      const audio = new Audio(recordedAudioUri);
      audio.play();
    }
  };

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
        {/* Banner */}
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTag}>[ REAL-TIME ARENA ]</Text>
          <Text style={styles.bannerTitle}>THI ĐẤU PHẢN XẠ & CƯỢC EXP</Text>
          <Text style={styles.bannerSub}>Chọn đối thủ, chế độ và cấp độ thi đấu phù hợp để chinh phục trận đấu!</Text>
        </View>

        {/* 1. CHỌN ĐỐI THỦ THI ĐẤU */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>👥 1. CHỌN ĐỐI THỦ THI ĐẤU:</Text>
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
              <Text style={styles.roomLabel}>🔑 Mã phòng thi đấu ghép cặp:</Text>
              <TextInput style={styles.roomInput} value={roomId} onChangeText={setRoomId} />
            </View>
          )}
        </View>

        {/* 2. CHỌN CHẾ ĐỘ THI ĐẤU */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>🎯 2. CHỌN CHẾ ĐỘ THI ĐẤU:</Text>
          
          <TouchableOpacity style={[styles.tierCard, arenaTier === 1 && styles.activeTier1]} onPress={() => setArenaTier(1)}>
            <Text style={styles.tierTitle}>⚡ TẦNG 1: SOLO 30S PULSE</Text>
            <Text style={styles.tierSub}>Phản xạ nhanh 30 giây với đề bài AI ngắn hạn.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tierCard, arenaTier === 2 && styles.activeTier2]} onPress={() => setArenaTier(2)}>
            <Text style={styles.tierTitle}>⚔️ TẦNG 2: DUEL 60S ARENA (RELAY CO-OP)</Text>
            <Text style={styles.tierSub}>Thuyết trình tiếp sức 60 giây (~30s/bạn) theo gợi ý chủ đề mở.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tierCard, arenaTier === 3 && styles.activeTier3]} onPress={() => setArenaTier(3)}>
            <Text style={styles.tierTitle}>🎭 TẦNG 3: ROLEPLAY 60S (NHẬP VAI)</Text>
            <Text style={styles.tierSub}>Nhập vai xử lý tình huống thực tế với AI Bot.</Text>
          </TouchableOpacity>
        </View>

        {/* 📊 3. CHỌN CẤP ĐỘ THI ĐẤU */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>📊 3. CHỌN CẤP ĐỘ THI ĐẤU (CEFR):</Text>
          <View style={styles.levelRow}>
            {levels.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.levelBtn, cefrLevel === lvl && styles.activeLevelBtn]}
                onPress={() => {
                  setCefrLevel(lvl);
                  loadArenaChallenge(arenaTier, lvl);
                }}
              >
                <Text style={[styles.levelBtnText, cefrLevel === lvl && styles.activeLevelText]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🥊 NỘI DUNG ĐỀ THÁCH ĐẤU */}
        {loading ? (
          <ActivityIndicator size="large" color="#FF007F" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.card}>
            {/* TẦNG 1: SOLO PULSE */}
            {arenaTier === 1 && soloData && (
              <>
                <Text style={styles.cardTitle}>🎙️ CHỦ ĐỀ: {soloData.title || 'Solo Challenge'} [{cefrLevel}]</Text>
                <Text style={styles.cardDesc}>"{soloData.promptText}"</Text>
                <Text style={styles.keyText}>🔑 Gợi ý từ khóa: {soloData.keywords?.join(', ')}</Text>
              </>
            )}

            {/* TẦNG 2: RELAY CO-OP */}
            {arenaTier === 2 && relayData && (
              <>
                <Text style={styles.cardTitle}>🎯 CHỦ ĐỀ: {relayData.topic} [{cefrLevel}]</Text>
                <Text style={styles.cardDesc}>📌 Bối cảnh: "{relayData.context}"</Text>
                
                <View style={[styles.relayBox, activePlayer === 1 && isRecording && { borderColor: '#39FF14', borderWidth: 2 }]}>
                  <Text style={styles.playerTag}>⏱️ BẠN 1 (30 giây đầu - Ý kiến 1):</Text>
                  <Text style={[styles.cardDesc, { textAlign: 'left', fontStyle: 'normal' }]}>
                    💡 {relayData.player1Guideline}
                  </Text>
                </View>

                <View style={[styles.relayBox, { borderColor: '#FF007F' }, activePlayer === 2 && isRecording && { borderColor: '#39FF14', borderWidth: 2 }]}>
                  <Text style={[styles.playerTag, { color: '#FF007F' }]}>⏱️ BẠN 2 (30 giây sau - Ý kiến 2):</Text>
                  <Text style={[styles.cardDesc, { textAlign: 'left', fontStyle: 'normal' }]}>
                    💡 {relayData.player2Guideline}
                  </Text>
                </View>

                <Text style={styles.keyText}>🔑 Từ khóa gợi ý: {relayData.keyVocabulary?.join(', ')}</Text>
              </>
            )}

            {/* TẦNG 3: ROLEPLAY MASTER */}
            {arenaTier === 3 && roleplayData && (
              <>
                <Text style={styles.cardTitle}>🎭 KỊCH BẢN: {roleplayData.scenarioTitle} [{cefrLevel}]</Text>
                <Text style={styles.roleText}>🤖 AI Bot: {roleplayData.aiRole} | 👨‍🎓 Bạn: {roleplayData.userRole}</Text>
                <Text style={styles.cardDesc}>💬 AI Bot nói: "{roleplayData.initialAiMessage}"</Text>
                <Text style={styles.keyText}>🎯 Mục tiêu: {roleplayData.goal}</Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={() => loadArenaChallenge(arenaTier, cefrLevel)}>
          <Text style={styles.nextText}>🔄 ĐỔI ĐỀ THÁCH ĐẤU MỚI ({cefrLevel})</Text>
        </TouchableOpacity>

        {/* ⏱️ ĐỒNG HỒ ĐẾM NGƯỢC 30S HIỂN THỊ KHI ĐANG GHI ÂM RELAY */}
        {arenaTier === 2 && isRecording && (
          <View style={styles.timerContainer}>
            <Text style={styles.playerTurnText}>
              {activePlayer === 1 ? '👤 DÀNH CHO BẠN 1 (ĐẶT VẤN ĐỀ)' : '👤 ĐẾN LƯỢT BẠN 2 (GIẢI PHÁP)'}
            </Text>
            <Text style={[styles.timerNumber, timeLeft <= 5 && { color: '#FF0055' }]}>
              ⏱️ 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </Text>
            <Text style={styles.timerSub}>Đổi lượt ngay khi đồng hồ nhảy lượt!</Text>
          </View>
        )}

        {/* 🎙️ NÚT GHI ÂM VÀ CHẤM ĐIỂM */}
        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]} 
            onPress={isRecording ? stopAndGrade : startRecording}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹️ DỪNG & AI CHẤM ĐIỂM ARENA' : '🎙️ BẮT ĐẦU THI ĐẤU GHI ÂM'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 📊 BẢNG KẾT QUẢ CHẤM ĐIỂM 3D & THẮNG / THUA */}
        {result && (
          <View style={[
            styles.resultCard, 
            result.score >= 75 ? { borderColor: '#39FF14' } : { borderColor: '#FF0055' }
          ]}>
            <View style={[
              styles.outcomeBanner, 
              result.score >= 75 ? { backgroundColor: '#004411' } : { backgroundColor: '#440011' }
            ]}>
              <Text style={[
                styles.outcomeText, 
                result.score >= 75 ? { color: '#39FF14' } : { color: '#FF0055' }
              ]}>
                {result.score >= 75 ? '🏆 VICTORY - CHIẾN THẮNG!' : '💀 DEFEAT - THẤT BẠI!'}
              </Text>
              <Text style={styles.rewardText}>
                {result.score >= 75 ? '+100 EXP | +15 RANK PT' : '+10 EXP (Điểm an ủi)'}
              </Text>
            </View>

            <Text style={styles.resultScore}>
              📊 ĐIỂM THÁCH ĐẤU: {result.score}/100
            </Text>
            <Text style={styles.transcribedText}>🗣️ Bài nói nhận diện: "{result.transcribedText}"</Text>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>🎯 Phôn âm: {result.phoneticScore}</Text>
              <Text style={styles.breakdownText}>⚡ Trôi chảy: {result.fluencyScore}</Text>
              <Text style={styles.breakdownText}>💡 Ngữ nghĩa: {result.semanticScore}</Text>
            </View>

            <Text style={styles.feedbackText}>💡 AI Nhận xét: {result.feedback}</Text>

            {recordedAudioUri && (
              <TouchableOpacity style={styles.replayBtn} onPress={playRecordedAudio}>
                <Text style={styles.replayText}>🎧 NGHE LẠI BÀI THI CỦA BẠN</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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

  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  levelBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 2, backgroundColor: '#1A0B36', borderRadius: 8, borderWidth: 1, borderColor: '#3A1559', alignItems: 'center' },
  activeLevelBtn: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  levelBtnText: { color: '#8888CC', fontSize: 12, fontWeight: 'bold' },
  activeLevelText: { color: '#FFFFFF', fontWeight: '900' },

  card: { width: '100%', backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#FF007F', marginBottom: 12 },
  cardTitle: { color: '#00FFCC', fontSize: 15, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  cardDesc: { color: '#FFF', fontSize: 12, fontStyle: 'italic', marginBottom: 6, textAlign: 'center' },
  keyText: { color: '#FFD700', fontSize: 10, textAlign: 'center', marginTop: 4 },

  relayBox: { backgroundColor: '#0A0518', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFCC', marginBottom: 8 },
  playerTag: { color: '#00FFCC', fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  roleText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },

  nextBtn: { backgroundColor: '#110022', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 12 },
  nextText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },

  timerContainer: { backgroundColor: '#120826', padding: 12, borderRadius: 12, borderWidth: 2, borderColor: '#39FF14', width: '100%', alignItems: 'center', marginBottom: 12 },
  playerTurnText: { color: '#39FF14', fontSize: 11, fontWeight: '900', marginBottom: 2 },
  timerNumber: { color: '#00FFCC', fontSize: 24, fontWeight: '900', marginVertical: 2 },
  timerSub: { color: '#AAAABB', fontSize: 9, fontStyle: 'italic' },

  recordBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15 },
  recordText: { color: '#000', fontSize: 12, fontWeight: '900' },

  resultCard: { backgroundColor: '#120826', padding: 14, borderRadius: 12, borderWidth: 2, width: '100%', alignItems: 'center', marginBottom: 25 },
  outcomeBanner: { width: '100%', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  outcomeText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  rewardText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  resultScore: { fontSize: 15, fontWeight: '900', color: '#FFF', marginBottom: 6 },
  transcribedText: { color: '#AAAABB', fontSize: 11, textAlign: 'center', marginBottom: 8, fontStyle: 'italic' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 8, backgroundColor: '#0A0518', padding: 8, borderRadius: 8 },
  breakdownText: { color: '#00FFCC', fontSize: 10, fontWeight: 'bold' },
  feedbackText: { color: '#39FF14', fontSize: 11, textAlign: 'center', marginBottom: 10 },
  replayBtn: { backgroundColor: '#FF007F', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  replayText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' }
});