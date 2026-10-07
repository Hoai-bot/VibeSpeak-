// src/screens/Station2Screen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

// Import các dịch vụ thi đấu Local + Groq AI
import { getInstantSoloTopic, generateSoloTopic } from '../services/arena/soloService';
import { getInstantRelayChallenge, generateRelayChallenge } from '../services/arena/relayService';
import { getInstantRoleplayScenario, generateRoleplayScenario } from '../services/arena/roleplayService';

// Import dịch vụ chấm điểm thu âm tập trung
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';

interface Props {
  onBack: () => void;
}

type PlayerTurn = 1 | 2;

export default function Station2Screen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('A1');
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [exercise, setExercise] = useState<any>(null);

  // ⏱ State quản lý Lượt đấu & Đồng hồ đếm ngược 15s cho 2 người chơi
  const [activePlayer, setActivePlayer] = useState<PlayerTurn>(1);
  const [turnTimer, setTurnTimer] = useState<number>(15);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);

  // 🎙 State cho Thu âm & Chấm điểm AI
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<AssessmentResult | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // 1. HÀM CHUYỂN LƯỢT CHUẨN: BẮT BỘC RESET TIMER VỀ 15S NGAY LẬP TỨC
  const handleSwitchTurn = () => {
    setActivePlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1));
    setTurnTimer(15); // Đảm bảo gán lại 15 giây cho Player mới
  };

  // 2. BỘ ĐỒNG HỒ ĐẾM NGƯỢC AN TOÀN (CHỐNG KẸT 0S KHÓA TỰ ĐỘNG)
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;

    if (isGameActive && isRecording) {
      // Chỉ đếm ngược khi người chơi ĐANG BẤM MICRO THU ÂM
      if (turnTimer > 0) {
        timerInterval = setInterval(() => {
          setTurnTimer((prev) => prev - 1);
        }, 1000);
      } else if (turnTimer === 0) {
        // Hết 15s tự động dừng thu âm và đổi lượt
        stopRecordingAndSwitch();
      }
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isGameActive, isRecording, turnTimer]);

  // ⚡ Tải bài thi đấu tức thì (0.01s) từ Local + Gọi Groq AI ngầm
  const loadNewExercise = async (selectedMode = mode, selectedLevel = cefrLevel) => {
    setEvalResult(null);
    setIsGameActive(false);
    setActivePlayer(1);
    setTurnTimer(15);

    let instantData: any = null;
    if (selectedMode === 'solo') {
      instantData = getInstantSoloTopic(selectedLevel);
    } else if (selectedMode === 'relay') {
      instantData = getInstantRelayChallenge(selectedLevel);
    } else if (selectedMode === 'roleplay') {
      instantData = getInstantRoleplayScenario(selectedLevel);
    }

    setExercise(instantData);

    try {
      let aiData: any = null;
      if (selectedMode === 'solo') aiData = await generateSoloTopic(selectedLevel);
      else if (selectedMode === 'relay') aiData = await generateRelayChallenge(selectedLevel);
      else if (selectedMode === 'roleplay') aiData = await generateRoleplayScenario(selectedLevel);

      if (aiData) setExercise(aiData);
    } catch (e) {
      // Giữ dữ liệu Local fallback
    }
  };

  useEffect(() => {
    loadNewExercise(mode, cefrLevel);
  }, [mode, cefrLevel]);

  // 🎙 HÀM BẮT ĐẦU THU ÂM
  const startRecording = async () => {
    try {
      setEvalResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setIsEvaluating(true);

        const targetPrompt = exercise?.promptEn || exercise?.contextEn || exercise?.scenarioTitle || '';
        const result = await evaluateSpeaking(audioBlob, cefrLevel, undefined, targetPrompt);
        
        setEvalResult(result);
        setIsEvaluating(false);

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Thiết bị chưa được cấp quyền micro!");
    }
  };

  // 🛑 DỪNG THU ÂM VÀ CHUYỂN LƯỢT NÓI
  const stopRecordingAndSwitch = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    handleSwitchTurn();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: VOCABULARY ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* Chọn Cấp độ CEFR */}
        <Text style={styles.sectionLabel}>CHỌN LEVEL CẤP ĐỘ:</Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} 
              onPress={() => setCefrLevel(lvl)}
            >
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chọn Chế độ Đấu */}
        <View style={styles.modeRow}>
          <TouchableOpacity 
            style={[styles.modeBtn, mode === 'solo' && styles.modeBtnActive]} 
            onPress={() => setMode('solo')}
          >
            <Text style={[styles.modeText, mode === 'solo' && styles.modeTextActive]}>🎯 SOLO</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modeBtn, mode === 'relay' && styles.modeBtnActive]} 
            onPress={() => setMode('relay')}
          >
            <Text style={[styles.modeText, mode === 'relay' && styles.modeTextActive]}>⚡ RELAY</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modeBtn, mode === 'roleplay' && styles.modeBtnActive]} 
            onPress={() => setMode('roleplay')}
          >
            <Text style={[styles.modeText, mode === 'roleplay' && styles.modeTextActive]}>🎭 ROLEPLAY</Text>
          </TouchableOpacity>
        </View>

        {/* CARD THI ĐẤU CHÍNH */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>📌 SÀN ĐẤU {mode.toUpperCase()} [{cefrLevel}]</Text>

          {exercise ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.scenarioTitle}>{exercise.title || exercise.topic || exercise.scenarioTitle}</Text>
              
              {/* THANH ĐỒNG HỒ ĐẾM NGƯỢC THỜI GIAN LƯỢT (DÀNH CHO RELAY VÀ ROLEPLAY) */}
              {(mode === 'relay' || mode === 'roleplay') && (
                <View style={styles.timerBox}>
                  <Text style={styles.timerLabel}>⏱ THỜI GIAN: {turnTimer}s {isRecording ? '(ĐANG THU ÂM)' : '(BẤM MICRO ĐỂ CHẠY)'}</Text>
                  <Text style={[styles.timerValue, turnTimer <= 5 && { color: '#FF0055' }]}>
                    00:{turnTimer < 10 ? `0${turnTimer}` : turnTimer}
                  </Text>
                </View>
              )}

              {/* KHU VỰC PHÂN VAI VÀ HIỂN THỊ CHI TIẾT 2 NGƯỜI CHƠI */}
              {(mode === 'relay' || mode === 'roleplay') && (
                <View style={styles.playersRow}>
                  {/* PLAYER 1 */}
                  <View style={[styles.playerCard, activePlayer === 1 && styles.activePlayerCard]}>
                    <Text style={styles.playerTag}>👤 PLAYER 1</Text>
                    <Text style={styles.roleText}>
                      🎭 Vai: {exercise.player1En || exercise.userRoleEn || 'Khách hàng'}
                    </Text>
                    {activePlayer === 1 && <Text style={styles.turnIndicator}>👉 ĐẾN LƯỢT NÓI!</Text>}
                  </View>

                  {/* PLAYER 2 / AI */}
                  <View style={[styles.playerCard, activePlayer === 2 && styles.activePlayerCard]}>
                    <Text style={styles.playerTag}>
                      {mode === 'roleplay' ? '🤖 AI PARTNER' : '👤 PLAYER 2'}
                    </Text>
                    <Text style={styles.roleText}>
                      🎭 Vai: {exercise.player2En || exercise.aiRoleEn || 'Đầu bếp / Thu ngân'}
                    </Text>
                    {activePlayer === 2 && <Text style={styles.turnIndicator}>👉 ĐẾN LƯỢT NÓI!</Text>}
                  </View>
                </View>
              )}

              {/* KỊCH BẢN / CÂU HỎI ĐỀ BÀI */}
              <View style={styles.scriptBox}>
                <Text style={styles.promptText}>
                  🎯 "{exercise.promptEn || exercise.contextEn || exercise.initialAiMessage || ''}"
                </Text>
                {(exercise.promptVi || exercise.contextVi || exercise.goalVi) && (
                  <Text style={styles.promptViText}>
                    👉 Dịch: "{exercise.promptVi || exercise.contextVi || exercise.goalVi}"
                  </Text>
                )}
              </View>

              {/* 🎙 KHU VỰC THAO TÁC THU ÂM & CHUYỂN LƯỢT */}
              {!isGameActive && (mode === 'relay' || mode === 'roleplay') ? (
                <TouchableOpacity 
                  style={styles.startBtn} 
                  onPress={() => {
                    setIsGameActive(true);
                    setTurnTimer(15);
                  }}
                >
                  <Text style={styles.startBtnText}>🚀 BẮT ĐẦU VÒNG ĐẤU 2 NGƯỜI</Text>
                </TouchableOpacity>
              ) : !isEvaluating ? (
                <TouchableOpacity 
                  style={[styles.recordBtn, isRecording && styles.recordingBtnActive]} 
                  onPress={isRecording ? stopRecordingAndSwitch : startRecording}
                >
                  <Text style={styles.recordBtnText}>
                    {isRecording 
                      ? '🛑 DỪNG & CHUYỂN LƯỢT CHO BẠN BÊN CẠNH' 
                      : `🎙 LƯỢT PLAYER ${activePlayer}: BẤM ĐỂ THU ÂM`}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginVertical: 15, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#00FFFF" />
                  <Text style={{ color: '#00FFFF', fontSize: 11, marginTop: 5 }}>🤖 AI đang phân tích bài nói...</Text>
                </View>
              )}

              {/* 🏆 HIỂN THỊ KẾT QUẢ AI CHẤM ĐIỂM */}
              {evalResult && (
                <View style={styles.evalBox}>
                  <Text style={styles.evalScore}>🏆 ĐIỂM BÀI NÓI: {evalResult.score}/100</Text>
                  <Text style={styles.transcriptText}>💬 AI nghe được: "{evalResult.transcript}"</Text>
                  
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreDetail}>Nội dung: {evalResult.content}/100</Text>
                    <Text style={styles.scoreDetail}>Ngữ pháp: {evalResult.grammar}/100</Text>
                    <Text style={styles.scoreDetail}>Từ vựng: {evalResult.vocabulary}/100</Text>
                  </View>

                  <Text style={styles.feedbackText}>💡 Nhận xét: {evalResult.detailedFeedback}</Text>
                </View>
              )}

              {/* Nút đổi trận đấu mới */}
              <TouchableOpacity style={styles.nextBtn} onPress={() => loadNewExercise()}>
                <Text style={styles.nextBtnText}>🔄 TẢI TRẬN ĐẤU MỚI</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator size="small" color="#00FFFF" style={{ marginVertical: 15 }} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  modeBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center', marginHorizontal: 3 },
  modeBtnActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  modeText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  modeTextActive: { color: '#000' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 12 },
  scenarioTitle: { color: '#39FF14', fontSize: 13, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  
  // TIMER & ROLE STYLES
  timerBox: { backgroundColor: '#120826', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', alignItems: 'center', width: '100%', marginBottom: 12 },
  timerLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  timerValue: { color: '#39FF14', fontSize: 20, fontWeight: '900', marginTop: 2 },
  playersRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  playerCard: { flex: 0.48, backgroundColor: '#0D0620', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#332255' },
  activePlayerCard: { borderColor: '#FF007F', borderWidth: 2, backgroundColor: '#1A0B2E' },
  playerTag: { color: '#00FFFF', fontSize: 9, fontWeight: '900' },
  roleText: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginTop: 3 },
  turnIndicator: { color: '#39FF14', fontSize: 8, fontWeight: '900', marginTop: 4 },
  scriptBox: { backgroundColor: '#130A2A', padding: 10, borderRadius: 8, width: '100%', borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptText: { color: '#FFF', fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 16 },
  promptViText: { color: '#FFD700', fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 4, fontStyle: 'italic' },
  
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, width: '100%', alignItems: 'center', marginVertical: 10 },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  recordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginTop: 10, width: '100%', alignItems: 'center' },
  recordingBtnActive: { backgroundColor: '#FF3300' },
  recordBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  evalBox: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#39FF14', width: '100%', marginTop: 12 },
  evalScore: { color: '#39FF14', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  transcriptText: { color: '#FFF', fontSize: 10, fontStyle: 'italic', marginBottom: 6 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, backgroundColor: '#05020D', padding: 6, borderRadius: 6 },
  scoreDetail: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#FFD700', fontSize: 10, marginTop: 4 },
  nextBtn: { backgroundColor: '#39FF14', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginTop: 12, width: '100%', alignItems: 'center' },
  nextBtnText: { color: '#000', fontSize: 11, fontWeight: '900' }
});