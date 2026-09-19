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
  const [roomId, setRoomId] = useState<string>('ROOM_1V1_8888');
  
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B2');

  const [loading, setLoading] = useState<boolean>(true);
  const [soloData, setSoloData] = useState<SoloTopic | null>(null);
  const [relayData, setRelayData] = useState<RelayChallenge | null>(null);
  const [roleplayData, setRoleplayData] = useState<RoleplayScenario | null>(null);

  // 🎙️ STATE GHI ÂM VÀ CHẤM ĐIỂM
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  // ⏱️ STATE ĐỒNG HỒ ĐẾM NGƯỢC
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const timerRef = useRef<any>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

  // 🎯 CẤU HÌNH THỜI GIAN CHUẨN
  const getArenaDuration = (tier: number, level: CEFRLevel): number => {
    if (tier === 1) {
      if (level === 'A1' || level === 'A2') return 20;
      if (level === 'B1') return 30;
      return 60; // B2, C1 -> 60S SOLO
    }
    if (tier === 2) return (level === 'A1' || level === 'A2') ? 20 : 30;
    if (level === 'A1' || level === 'A2') return 35;
    if (level === 'B1') return 45;
    return 60; // B2, C1 -> 60S ROLEPLAY
  };

  const loadArenaChallenge = async (tier = arenaTier, level = cefrLevel) => {
    stopTimer();
    stopAudioPlayback();

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

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = getArenaDuration(arenaTier, cefrLevel);

    if (arenaTier === 1) {
      setTimeLeft(duration);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopAndGrade();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (arenaTier === 2) {
      setTimeLeft(duration);
      setActivePlayer(1);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setActivePlayer((current) => {
              if (current === 1) return 2;
              else {
                stopAndGrade();
                return 2;
              }
            });
            return duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (arenaTier === 3) {
      setTimeLeft(duration);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopAndGrade();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(getArenaDuration(arenaTier, cefrLevel));
    setActivePlayer(1);
  };

  const stopAudioPlayback = () => {
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current.currentTime = 0;
      currentAudioElementRef.current = null;
    }
  };

  const startRecording = async () => {
    stopAudioPlayback();
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

      startTimer();
    } catch (err) {
      alert("Chưa cấp quyền truy cập Micro!");
    }
  };

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

      if (blob.size < 3000) {
        setResult({
          score: 0,
          phoneticScore: 0,
          fluencyScore: 0,
          semanticScore: 0,
          transcribedText: "(Không ghi nhận âm thanh)",
          feedback: "💀 DEFEAT: Không ghi nhận giọng nói! Vui lòng kiểm tra micro."
        });
        setIsAnalyzing(false);
        return;
      }

      let targetContext = "";
      if (arenaTier === 1) targetContext = `SOLO 1V1 MATCH [${cefrLevel}]: ${soloData?.promptText || ""}`;
      else if (arenaTier === 2) targetContext = `SIMULTANEOUS 2V2 RELAY MATCH: ${relayData?.topic}: ${relayData?.context}`;
      else targetContext = `REAL-LIFE ROLEPLAY MATCH [${cefrLevel}]: ${roleplayData?.scenarioTitle}. Roles: P1 (${roleplayData?.aiRole}) vs P2 (${roleplayData?.userRole}). Goal: ${roleplayData?.goal}`;

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
      stopAudioPlayback();
      const audio = new Audio(recordedAudioUri);
      currentAudioElementRef.current = audio;
      audio.play().catch(e => console.error("Playback failed:", e));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: ĐẤU TRƯỜNG TẤT TAY</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTag}>[ REAL-TIME ARENA ]</Text>
          <Text style={styles.bannerTitle}>THI ĐẤU PHẢN XẠ & CƯỢC EXP</Text>
          <Text style={styles.bannerSub}>Chọn đối thủ, chế độ và cấp độ thi đấu phù hợp để chinh phục trận đấu!</Text>
        </View>

        {/* 1. CHỌN ĐỐI THỦ THI ĐẤU (TỰ ĐỘNG THÍCH ỨNG 1V1 CHO TẦNG 1 VÀ 2V2 CHO TẦNG 2-3) */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>
            👥 1. CHỌN ĐỐI THỦ ({arenaTier === 1 ? 'ĐẤU ĐƠN 1V1' : 'ĐẤU NHÓM 2V2'}):
          </Text>
          <View style={styles.rowSelector}>
            <TouchableOpacity 
              style={[styles.selectBtn, opponentType === 'bot' && styles.activeBot]}
              onPress={() => setOpponentType('bot')}
            >
              <Text style={[styles.btnText, opponentType === 'bot' && styles.activeText]}>🤖 ĐẤU VỚI BOT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.selectBtn, opponentType === 'human' && styles.activeHuman]}
              onPress={() => setOpponentType('human')}
            >
              <Text style={[styles.btnText, opponentType === 'human' && styles.activeText]}>
                {arenaTier === 1 ? '👤 ĐẤU 1V1 NGƯỜI THẬT' : '👥 ĐẤU 2V2 NGƯỜI THẬT'}
              </Text>
            </TouchableOpacity>
          </View>

          {opponentType === 'human' && (
            <View style={styles.roomBox}>
              <Text style={styles.roomLabel}>🔑 Mã phòng ghép cặp thi đấu:</Text>
              <TextInput style={styles.roomInput} value={roomId} onChangeText={setRoomId} />

              {/* CHỈ HIỂN THỊ LOBBY 2V2 KHI Ở TẦNG 2 HOẶC TẦNG 3 */}
              {arenaTier !== 1 && (
                <View style={styles.lobbyGrid}>
                  <View style={[styles.lobbyCard, { borderColor: '#FF007F' }]}>
                    <Text style={[styles.lobbyTeamTitle, { color: '#FF007F' }]}>🔴 CẶP A (ĐỘI ĐỎ)</Text>
                    <Text style={styles.slotText}>👤 P1: Người chơi A1 (Lên sóng)</Text>
                    <Text style={styles.slotText}>👤 P2: Người chơi A2 (Lên sóng)</Text>
                  </View>
                  <View style={[styles.lobbyCard, { borderColor: '#00FFCC' }]}>
                    <Text style={[styles.lobbyTeamTitle, { color: '#00FFCC' }]}>🔵 CẶP B (ĐỘI XANH)</Text>
                    <Text style={styles.slotText}>👤 P3: Người chơi B1 (Lên sóng)</Text>
                    <Text style={styles.slotText}>👤 P4: Người chơi B2 (Lên sóng)</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 2. CHỌN CHẾ ĐỘ THI ĐẤU */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>🎯 2. CHỌN CHẾ ĐỘ THI ĐẤU:</Text>
          
          <TouchableOpacity style={[styles.tierCard, arenaTier === 1 && styles.activeTier1]} onPress={() => setArenaTier(1)}>
            <Text style={styles.tierTitle}>⚡ TẦNG 1: SOLO PULSE 1V1 ({getArenaDuration(1, cefrLevel)}S)</Text>
            <Text style={styles.tierSub}>Độc thoại phản xạ 1v1 ({getArenaDuration(1, cefrLevel)}s cho CEFR {cefrLevel}).</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tierCard, arenaTier === 2 && styles.activeTier2]} onPress={() => setArenaTier(2)}>
            <Text style={styles.tierTitle}>⚔️ TẦNG 2: DUEL RELAY 2V2 ({getArenaDuration(2, cefrLevel)}S/BẠN)</Text>
            <Text style={styles.tierSub}>Thuyết trình tiếp sức 2v2 cùng chủ đề trên 2 thiết bị.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tierCard, arenaTier === 3 && styles.activeTier3]} onPress={() => setArenaTier(3)}>
            <Text style={styles.tierTitle}>
              🎭 TẦNG 3: ROLEPLAY SIMULATION 2V2 ({getArenaDuration(3, cefrLevel)}S)
            </Text>
            <Text style={styles.tierSub}>
              Nhập vai đối thoại 2v2 thực tế ({getArenaDuration(3, cefrLevel)}s cho CEFR {cefrLevel}).
            </Text>
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
            {/* TẦNG 1: SOLO PULSE (1V1) */}
            {arenaTier === 1 && soloData && (
              <>
                <Text style={styles.cardTitle}>🎙️ CHỦ ĐỀ SOLO 1V1: {soloData.title || 'Solo Challenge'} [{cefrLevel}]</Text>
                <Text style={styles.cardDesc}>"{soloData.promptText}"</Text>
                <Text style={styles.keyText}>🔑 Gợi ý từ khóa: {soloData.keywords?.join(', ')}</Text>
              </>
            )}

            {/* TẦNG 2: RELAY CO-OP (2V2) */}
            {arenaTier === 2 && relayData && (
              <>
                <Text style={styles.cardTitle}>🎯 ĐỀ BÀI RELAY 2V2: {relayData.topic} [{cefrLevel}]</Text>
                <Text style={styles.cardDesc}>📌 Bối cảnh chung: "{relayData.context}"</Text>
                
                <View style={[styles.relayBox, activePlayer === 1 && isRecording && { borderColor: '#39FF14', borderWidth: 2 }]}>
                  <Text style={styles.playerTag}>⚡ LƯỢT 1 ({getArenaDuration(2, cefrLevel)}s đầu):</Text>
                  <Text style={[styles.cardDesc, { textAlign: 'left', fontStyle: 'normal' }]}>
                    💡 {relayData.player1Guideline}
                  </Text>
                </View>

                <View style={[styles.relayBox, { borderColor: '#FF007F' }, activePlayer === 2 && isRecording && { borderColor: '#39FF14', borderWidth: 2 }]}>
                  <Text style={[styles.playerTag, { color: '#FF007F' }]}>⚡ LƯỢT 2 ({getArenaDuration(2, cefrLevel)}s sau):</Text>
                  <Text style={[styles.cardDesc, { textAlign: 'left', fontStyle: 'normal' }]}>
                    💡 {relayData.player2Guideline}
                  </Text>
                </View>

                <Text style={styles.keyText}>🔑 Từ khóa gợi ý: {relayData.keyVocabulary?.join(', ')}</Text>
              </>
            )}

            {/* TẦNG 3: ROLEPLAY SIMULATION (2V2) */}
            {arenaTier === 3 && roleplayData && (
              <>
                <Text style={styles.cardTitle}>🎭 BỐI CẢNH NHẬP VAI 2V2: {roleplayData.scenarioTitle} [{cefrLevel}]</Text>
                
                <View style={styles.roleHeaderBox}>
                  <Text style={styles.p1RoleText}>🔴 VAI 1: {roleplayData.aiRole}</Text>
                  <Text style={styles.vsText}>⚡ VS ⚡</Text>
                  <Text style={styles.p2RoleText}>🔵 VAI 2: {roleplayData.userRole}</Text>
                </View>

                <View style={styles.speechCardBox}>
                  <Text style={[styles.cardDesc, { color: '#FFD700', fontWeight: 'bold' }]}>
                    🎯 MỤC TIÊU GIAO TIẾP:
                  </Text>
                  <Text style={[styles.cardDesc, { textAlign: 'center', fontStyle: 'normal' }]}>
                    "{roleplayData.goal}"
                  </Text>
                </View>

                <Text style={styles.roleInstruction}>
                  ⚡ BẬT MICRO NÓI TIẾNG ANH: Thực hiện đoạn đối thoại tự nhiên trong {getArenaDuration(3, cefrLevel)}s!
                </Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={() => loadArenaChallenge(arenaTier, cefrLevel)}>
          <Text style={styles.nextText}>🔄 ĐỔI ĐỀ THÁCH ĐẤU MỚI ({cefrLevel})</Text>
        </TouchableOpacity>

        {/* ⏱️ THANH ĐỒNG HỒ ĐẾM NGƯỢC */}
        {isRecording && (
          <View style={styles.timerContainer}>
            <Text style={styles.playerTurnText}>
              {arenaTier === 1 && `🎙️ GHI ÂM SOLO 1V1 (${getArenaDuration(1, cefrLevel)}S)`}
              {arenaTier === 2 && (activePlayer === 1 ? `⚡ ĐANG NÓI LƯỢT 1 (${getArenaDuration(2, cefrLevel)}S)` : `⚡ ĐANG NÓI LƯỢT 2 (${getArenaDuration(2, cefrLevel)}S)`)}
              {arenaTier === 3 && `🎭 THU ÂM HỘI THOẠI ROLEPLAY 2V2 (${getArenaDuration(3, cefrLevel)}S)`}
            </Text>
            <Text style={[styles.timerNumber, timeLeft <= 5 && { color: '#FF0055' }]}>
              ⏱️ {timeLeft < 10 ? `00:0${timeLeft}` : `00:${timeLeft}`}
            </Text>
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

        {/* 📊 BẢNG KẾT QUẢ CHẤM ĐIỂM 3D */}
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
            <Text style={styles.transcribedText}>🗣️ Đoạn đối thoại ghi nhận: "{result.transcribedText}"</Text>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>🎯 Phôn âm: {result.phoneticScore}</Text>
              <Text style={styles.breakdownText}>⚡ Trôi chảy: {result.fluencyScore}</Text>
              <Text style={styles.breakdownText}>💡 Ngữ nghĩa: {result.semanticScore}</Text>
            </View>

            <Text style={styles.feedbackText}>💡 AI Nhận xét: {result.feedback}</Text>

            {recordedAudioUri && (
              <TouchableOpacity style={styles.replayBtn} onPress={playRecordedAudio}>
                <Text style={styles.replayText}>🎧 NGHE LẠI TOÀN BỘ TRẬN ĐẤU</Text>
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

  lobbyGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  lobbyCard: { width: '48%', backgroundColor: '#0A0518', padding: 8, borderRadius: 8, borderWidth: 1 },
  lobbyTeamTitle: { fontSize: 10, fontWeight: '900', marginBottom: 4 },
  slotText: { color: '#AAAABB', fontSize: 9, marginVertical: 1 },

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
  cardTitle: { color: '#00FFCC', fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  cardDesc: { color: '#FFF', fontSize: 12, fontStyle: 'italic', marginBottom: 6, textAlign: 'center' },
  keyText: { color: '#FFD700', fontSize: 10, textAlign: 'center', marginTop: 4 },

  relayBox: { backgroundColor: '#0A0518', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFCC', marginBottom: 8 },
  playerTag: { color: '#00FFCC', fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  
  roleHeaderBox: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#0A0518', padding: 8, borderRadius: 8, marginBottom: 8 },
  p1RoleText: { color: '#FF007F', fontSize: 11, fontWeight: 'bold' },
  vsText: { color: '#FFD700', fontSize: 11, fontWeight: '900' },
  p2RoleText: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold' },

  roleInstruction: { color: '#39FF14', fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginVertical: 4 },

  speechCardBox: { backgroundColor: '#0A0518', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', alignItems: 'center', marginVertical: 6 },

  nextBtn: { backgroundColor: '#110022', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 12 },
  nextText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },

  timerContainer: { backgroundColor: '#120826', padding: 12, borderRadius: 12, borderWidth: 2, borderColor: '#39FF14', width: '100%', alignItems: 'center', marginBottom: 12 },
  playerTurnText: { color: '#39FF14', fontSize: 11, fontWeight: '900', marginBottom: 2 },
  timerNumber: { color: '#00FFCC', fontSize: 24, fontWeight: '900', marginVertical: 2 },

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