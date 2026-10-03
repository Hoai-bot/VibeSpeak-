// src/screens/Station2Screen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

// Import 3 dịch vụ thi đấu Local + Groq AI
import { getInstantSoloTopic, generateSoloTopic } from '../services/arena/soloService';
import { getInstantRelayChallenge, generateRelayChallenge } from '../services/arena/relayService';
import { getInstantRoleplayScenario, generateRoleplayScenario } from '../services/arena/roleplayService';

// Import dịch vụ chấm điểm thu âm tập trung
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';

interface Props {
  onBack: () => void;
}

export default function Station2Screen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('A1');
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [exercise, setExercise] = useState<any>(null);

  // 🎙 State cho Thu âm & Chấm điểm
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<AssessmentResult | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // ⚡ Tải bài thi đấu tức thì (0.01s) từ Local + Gọi Groq AI ngầm
  const loadNewExercise = async (selectedMode = mode, selectedLevel = cefrLevel) => {
    setEvalResult(null);
    let instantData: any = null;

    if (selectedMode === 'solo') {
      instantData = getInstantSoloTopic(selectedLevel);
    } else if (selectedMode === 'relay') {
      instantData = getInstantRelayChallenge(selectedLevel);
    } else if (selectedMode === 'roleplay') {
      instantData = getInstantRoleplayScenario(selectedLevel);
    }

    setExercise(instantData);

    // Gọi ngầm Groq AI để lấy bài mới độc bản
    try {
      let aiData: any = null;
      if (selectedMode === 'solo') aiData = await generateSoloTopic(selectedLevel);
      else if (selectedMode === 'relay') aiData = await generateRelayChallenge(selectedLevel);
      else if (selectedMode === 'roleplay') aiData = await generateRoleplayScenario(selectedLevel);

      if (aiData) setExercise(aiData);
    } catch (e) {
      // Giữ nguyên dữ liệu Local nếu Groq AI timeout
    }
  };

  useEffect(() => {
    loadNewExercise(mode, cefrLevel);
  }, [mode, cefrLevel]);

  // 🎙 HÀM BẮT ĐẦU THU ÂM BÀI NÓI
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

        // Lấy chuỗi câu hỏi đề bài làm promptEn gửi sang AI chấm điểm Task Fulfillment
        const targetPrompt = exercise?.promptEn || exercise?.contextEn || exercise?.scenarioTitle || '';
        
        // Gọi dịch vụ chấm điểm AI chính xác
        const result = await evaluateSpeaking(audioBlob, cefrLevel, undefined, targetPrompt);
        setEvalResult(result);
        setIsEvaluating(false);

        // Dọn dẹp micro stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Thiết bị không hỗ trợ Micro hoặc ứng dụng chưa được cấp quyền thu âm!");
    }
  };

  // 🛑 HÀM DỪNG THU ÂM VÀ GỬI AI CHẤM ĐIỂM
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
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

        {/* CARD ĐỀ THI ĐẤU CHÍNH */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>📌 SÀN ĐẤU {mode.toUpperCase()} [{cefrLevel}]</Text>

          {exercise ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.scenarioTitle}>{exercise.title || exercise.topic || exercise.scenarioTitle}</Text>
              
              <Text style={styles.promptText}>
                🎯 "{exercise.promptEn || exercise.contextEn || exercise.initialAiMessage || ''}"
              </Text>
              
              {(exercise.promptVi || exercise.contextVi || exercise.goalVi) && (
                <Text style={styles.promptViText}>
                  👉 Dịch: "{exercise.promptVi || exercise.contextVi || exercise.goalVi}"
                </Text>
              )}

              {/* Chi tiết cho chế độ Relay (Phân vai Player 1 & Player 2) */}
              {mode === 'relay' && (
                <View style={styles.relayDetails}>
                  <Text style={styles.pLabel}>👤 Player 1: {exercise.player1En}</Text>
                  <Text style={styles.pLabel}>👤 Player 2: {exercise.player2En}</Text>
                </View>
              )}

              {/* Chi tiết cho chế độ Roleplay (Phân vai AI & User) */}
              {mode === 'roleplay' && (
                <View style={styles.relayDetails}>
                  <Text style={styles.pLabel}>🤖 Vai AI: {exercise.aiRoleEn}</Text>
                  <Text style={styles.pLabel}>👤 Vai Người Chơi: {exercise.userRoleEn}</Text>
                  <Text style={styles.pLabel}>🎯 Mục Tiêu: {exercise.goalEn}</Text>
                </View>
              )}

              {/* 🎙 NÚT THU ÂM BÀI NÓI (THI ĐẤU) */}
              {!isEvaluating ? (
                <TouchableOpacity 
                  style={[styles.recordBtn, isRecording && styles.recordingBtnActive]} 
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <Text style={styles.recordBtnText}>
                    {isRecording ? '🛑 DỪNG & GỬI AI CHẤM ĐIỂM' : '🎙 BẤM MICRO ĐỂ NÓI'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginVertical: 15, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#00FFFF" />
                  <Text style={{ color: '#00FFFF', fontSize: 11, marginTop: 5 }}>🤖 AI đang phân tích bài nói...</Text>
                </View>
              )}

              {/* 🏆 HIỂN THỊ KẾT QUẢ CHẤM ĐIỂM CHI TIẾT */}
              {evalResult && (
                <View style={styles.evalBox}>
                  <Text style={styles.evalScore}>🏆 ĐIỂM BÀI NÓI: {evalResult.score}/100</Text>
                  <Text style={styles.transcriptText}>💬 Văn bản bóc tách: "{evalResult.transcript}"</Text>
                  
                  {/* Bảng điểm 3 tiêu chí */}
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreDetail}>Ý đề bài: {evalResult.content}/100</Text>
                    <Text style={styles.scoreDetail}>Ngữ pháp: {evalResult.grammar}/100</Text>
                    <Text style={styles.scoreDetail}>Từ vựng: {evalResult.vocabulary}/100</Text>
                  </View>

                  <Text style={styles.feedbackText}>💡 Nhận xét: {evalResult.detailedFeedback}</Text>

                  {evalResult.missingRequirements && evalResult.missingRequirements.length > 0 && (
                    <Text style={styles.missingText}>⚠️ Ý còn thiếu: {evalResult.missingRequirements.join(', ')}</Text>
                  )}
                </View>
              )}

              {/* Nút đổi trận đấu mới */}
              <TouchableOpacity style={styles.nextBtn} onPress={() => loadNewExercise()}>
                <Text style={styles.nextBtnText}>🔄 BẮT ĐẦU VÒNG ĐẤU MỚI</Text>
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
  scenarioTitle: { color: '#39FF14', fontSize: 13, fontWeight: '900', marginBottom: 6, textAlign: 'center' },
  promptText: { color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 18, marginBottom: 8 },
  promptViText: { color: '#FFD700', fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },
  relayDetails: { backgroundColor: '#130A2A', padding: 10, borderRadius: 8, width: '100%', marginVertical: 8, borderWidth: 1, borderColor: '#332255' },
  pLabel: { color: '#E0E0FF', fontSize: 11, fontWeight: '700', marginVertical: 2 },
  recordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginTop: 15, width: '100%', alignItems: 'center' },
  recordingBtnActive: { backgroundColor: '#FF3300' },
  recordBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  evalBox: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#39FF14', width: '100%', marginTop: 15 },
  evalScore: { color: '#39FF14', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  transcriptText: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginBottom: 6 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, backgroundColor: '#05020D', padding: 6, borderRadius: 6 },
  scoreDetail: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  feedbackText: { color: '#FFD700', fontSize: 11, marginTop: 4 },
  missingText: { color: '#FF3366', fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  nextBtn: { backgroundColor: '#39FF14', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginTop: 12, width: '100%', alignItems: 'center' },
  nextBtnText: { color: '#000', fontSize: 11, fontWeight: '900' }
});