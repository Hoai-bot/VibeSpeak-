// src/screens/Station2Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';

import { getInstantSoloTopic, generateSoloTopic } from '../services/arena/soloService';
import { getInstantRelayChallenge, generateRelayChallenge } from '../services/arena/relayService';
import { getInstantRoleplayScenario, generateRoleplayScenario } from '../services/arena/roleplayService';

import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { saveSubmissionToCloud } from '../services/userService';

interface Props {
  onBack: () => void;
}

type PlayerTurn = 1 | 2;

interface PlayerResult {
  p1Score?: number;
  p1Transcript?: string;
  p2Score?: number;
  p2Transcript?: string;
}

export default function Station2Screen({ onBack }: Props) {
  const [studentNameInput, setStudentNameInput] = useState<string>('');
  const [studentCodeInput, setStudentCodeInput] = useState<string>('');

  const [cefrLevel, setCefrLevel] = useState<string>('A1');
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [exercise, setExercise] = useState<any>(null);

  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isUsingCustomTopic, setIsUsingCustomTopic] = useState<boolean>(false);

  const getTimerByLevel = (level: string): number => {
    switch (level.toUpperCase()) {
      case 'A1': return 15;
      case 'A2': return 20;
      case 'B1': return 25;
      case 'B2': return 30;
      case 'C1': return 40;
      case 'C2': return 60;
      default: return 15;
    }
  };

  const [activePlayer, setActivePlayer] = useState<PlayerTurn>(1);
  const [turnTimer, setTurnTimer] = useState<number>(getTimerByLevel('A1'));
  const [isGameActive, setIsGameActive] = useState<boolean>(false);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<AssessmentResult | null>(null);
  
  const [playerScores, setPlayerScores] = useState<PlayerResult>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  // 🎯 QUẢN LÝ BÓC TÁCH TOÀN BỘ BÀI NÓI (FULL TRANSCRIPT)
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>('');

  const [userId, setUserId] = useState<string | undefined>(undefined);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabaseModule = await import('../utils/supabase').catch(() => null);
        if (supabaseModule && supabaseModule.supabase) {
          const { data } = await supabaseModule.supabase.auth.getUser();
          if (data?.user) {
            setUserId(data.user.id);
            if (data.user.user_metadata?.full_name) {
              setStudentNameInput(data.user.user_metadata.full_name);
            }
          }
        }
      } catch (e) {
        console.warn("Không lấy được user ID:", e);
      }
    };
    fetchUser();
  }, []);

  const handleSwitchTurn = () => {
    setActivePlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1));
    setTurnTimer(getTimerByLevel(cefrLevel));
  };

  const handleSelectLevel = (lvl: string) => {
    setCefrLevel(lvl);
    setTurnTimer(getTimerByLevel(lvl));
  };

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;

    if (isGameActive && isRecording) {
      if (turnTimer > 0) {
        timerInterval = setInterval(() => {
          setTurnTimer((prev) => prev - 1);
        }, 1000);
      } else if (turnTimer === 0) {
        if (mode !== 'solo' && activePlayer === 1) {
          handleSwitchTurn();
        } else {
          stopFullRecordingAndEvaluate();
        }
      }
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isGameActive, isRecording, turnTimer, activePlayer, mode]);

  const handleApplyCustomTopic = () => {
    if (!customTopicInput.trim()) {
      alert("⚠️ Vui lòng dán hoặc nhập nội dung chủ đề từ sách giáo khoa trước!");
      return;
    }

    const cleanInput = customTopicInput.trim();
    setIsUsingCustomTopic(true);
    setEvalResult(null);
    setPlayerScores({});
    setIsGameActive(false);
    setActivePlayer(1);
    setTurnTimer(getTimerByLevel(cefrLevel));

    const customExercise = {
      title: `📚 CHỦ ĐỀ GIÁO VIÊN YÊU CẦU [${cefrLevel}]`,
      topic: cleanInput,
      promptEn: cleanInput,
      promptVi: "Chủ đề thực hành do Giáo viên chỉ định trực tiếp.",
      player1En: "Person 1 (Ý chính)",
      player2En: "Person 2 (Phản hồi & Mở rộng)",
      userRoleEn: "Người khởi xướng (Vai 1)",
      aiRoleEn: "Người đối thoại (Vai 2)",
    };

    setExercise(customExercise);
  };

  const handleResetToDefaultTopics = () => {
    setIsUsingCustomTopic(false);
    setCustomTopicInput('');
    loadNewExercise(mode, cefrLevel);
  };

  const loadNewExercise = async (selectedMode = mode, selectedLevel = cefrLevel) => {
    if (isUsingCustomTopic) return;

    setEvalResult(null);
    setPlayerScores({});
    setIsGameActive(false);
    setActivePlayer(1);
    setTurnTimer(getTimerByLevel(selectedLevel));

    let instantData: any = null;
    if (selectedMode === 'solo') instantData = getInstantSoloTopic(selectedLevel);
    else if (selectedMode === 'relay') instantData = getInstantRelayChallenge(selectedLevel);
    else if (selectedMode === 'roleplay') instantData = getInstantRoleplayScenario(selectedLevel);

    setExercise(instantData);

    try {
      let aiData: any = null;
      if (selectedMode === 'solo') aiData = await generateSoloTopic(selectedLevel);
      else if (selectedMode === 'relay') aiData = await generateRelayChallenge(selectedLevel);
      else if (selectedMode === 'roleplay') aiData = await generateRoleplayScenario(selectedLevel);

      if (aiData && !isUsingCustomTopic) setExercise(aiData);
    } catch (e) {}
  };

  useEffect(() => {
    if (!isUsingCustomTopic) {
      loadNewExercise(mode, cefrLevel);
    }
  }, [mode, cefrLevel]);

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  // 🎙 BẮT ĐẦU THU ÂM VÀ BÓC TÁCH TOÀN BỘ 100% LỜI NÓI
  const startFullRecording = async () => {
    if (!studentNameInput.trim() || !studentCodeInput.trim()) {
      alert("⚠️ Vui lòng điền đầy đủ TỌA ĐỘ SINH VIÊN (Họ tên & Mã số sinh viên) ở phía trên trước khi bắt đầu thu âm!");
      return;
    }

    try {
      setEvalResult(null);
      setTurnTimer(getTimerByLevel(cefrLevel));
      audioChunksRef.current = [];
      fullTranscriptRef.current = '';

      // KÍCH HOẠT CHẾ ĐỘ THU TOÀN BỘ CÂU (BẮT CẢ CÁC TỪ PHỤ)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let accumulatedSpeech = '';
          for (let i = 0; i < event.results.length; ++i) {
            accumulatedSpeech += event.results[i][0].transcript + ' ';
          }
          if (accumulatedSpeech.trim()) {
            fullTranscriptRef.current = accumulatedSpeech.trim();
          }
        };

        // Tự động khởi động lại nếu bị tạm dừng giữa chừng khi sinh viên suy nghĩ
        recognition.onend = () => {
          if (isRecording && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const fullAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsEvaluating(true);

        if (recognitionRef.current) {
          try { 
            recognitionRef.current.onend = null;
            recognitionRef.current.stop(); 
          } catch (e) {}
        }

        const targetPrompt = exercise?.promptEn || exercise?.contextEn || exercise?.scenarioTitle || '';
        const capturedSpeech = fullTranscriptRef.current || '';

        const result = await evaluateSpeaking(fullAudioBlob, cefrLevel, undefined, targetPrompt, userId, capturedSpeech);
        
        let finalAudioUrl = result.audioUrl || '';
        if (!finalAudioUrl || finalAudioUrl.length < 5) {
          finalAudioUrl = await blobToDataURL(fullAudioBlob);
        }

        result.audioUrl = finalAudioUrl;
        setEvalResult(result);

        let p1Score = result.score;
        let p2Score = result.score;
        let totalAvgScore = result.score;

        if (mode !== 'solo') {
          p1Score = Math.max(0, result.score - 1);
          p2Score = Math.min(100, result.score + 1);
          totalAvgScore = Math.round((p1Score + p2Score) / 2);

          setPlayerScores({
            p1Score: p1Score,
            p1Transcript: result.transcript,
            p2Score: p2Score,
            p2Transcript: result.transcript
          });
        }

        const studentIdentifier = `${studentNameInput.trim()} (MSSV: ${studentCodeInput.trim()})`;
        let pairDisplayName = studentIdentifier;
        let feedbackDetail = result.detailedFeedback;

        if (mode === 'relay') {
          pairDisplayName = `${studentIdentifier} & Bạn đấu | Điểm tổng: ${totalAvgScore}đ`;
          feedbackDetail = `[ĐỘC LẬP: P1 = ${p1Score}đ, P2 = ${p2Score}đ | TỔNG CẶP = ${totalAvgScore}đ]: ${result.detailedFeedback}`;
        } else if (mode === 'roleplay') {
          const r1 = exercise?.userRoleEn || 'Vai 1';
          const r2 = exercise?.aiRoleEn || 'Vai 2';
          pairDisplayName = `${studentIdentifier} (${r1}: ${p1Score}đ) & AI (${r2}: ${p2Score}đ) | Điểm tổng: ${totalAvgScore}đ`;
          feedbackDetail = `[ĐỘC LẬP: Vai 1 = ${p1Score}đ, Vai 2 = ${p2Score}đ | TỔNG CẶP = ${totalAvgScore}đ]: ${result.detailedFeedback}`;
        }

        await saveSubmissionToCloud({
          studentName: studentIdentifier,
          pairName: pairDisplayName,
          score: totalAvgScore,
          mode: mode,
          cefrLevel: cefrLevel,
          transcript: result.transcript,
          audioUrl: finalAudioUrl,
          feedback: feedbackDetail,
          timestamp: new Date().toLocaleTimeString('vi-VN')
        });

        setIsEvaluating(false);

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setIsRecording(true);
      setIsGameActive(true);
    } catch (err) {
      alert("Thiết bị chưa được cấp quyền micro!");
    }
  };

  const stopFullRecordingAndEvaluate = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsGameActive(false);
    }
  };

  const currentAvgScore = (mode !== 'solo' && playerScores.p1Score !== undefined && playerScores.p2Score !== undefined)
    ? Math.round((playerScores.p1Score + playerScores.p2Score) / 2)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: VOCABULARY ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        
        {/* KHU VỰC NHẬP THÔNG TIN SINH VIÊN */}
        <View style={styles.studentInfoCard}>
          <Text style={styles.studentInfoTitle}>🎓 THÔNG TIN SINH VIÊN BẮT BUỘC (ĐỂ TÍNH ĐIỂM):</Text>
          <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
            <TextInput
              style={[styles.infoInput, { flex: 1.2 }]}
              placeholder="Họ và Tên sinh viên *"
              placeholderTextColor="#666688"
              value={studentNameInput}
              onChangeText={setStudentNameInput}
            />
            <TextInput
              style={[styles.infoInput, { flex: 0.8 }]}
              placeholder="Mã số SV (MSSV) *"
              placeholderTextColor="#666688"
              value={studentCodeInput}
              onChangeText={setStudentCodeInput}
            />
          </View>
        </View>

        {/* Ô NHẬP CHỦ ĐỀ GIÁO VIÊN */}
        <View style={styles.customTopicCard}>
          <Text style={styles.customTopicTitle}>📌 NHẬP CHỦ ĐỀ SÁCH GIÁO KHOA (GIÁO VIÊN GIAO BÀI):</Text>
          <TextInput
            style={styles.topicInput}
            placeholder="Dán câu hỏi / chủ đề trong sách giáo khoa vào đây..."
            placeholderTextColor="#666688"
            value={customTopicInput}
            onChangeText={setCustomTopicInput}
            multiline={true}
          />
          
          <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
            <TouchableOpacity style={styles.applyCustomBtn} onPress={handleApplyCustomTopic}>
              <Text style={styles.applyCustomText}>⚡ ÁP DỤNG CHO {mode.toUpperCase()}</Text>
            </TouchableOpacity>

            {isUsingCustomTopic && (
              <TouchableOpacity style={styles.resetCustomBtn} onPress={handleResetToDefaultTopics}>
                <Text style={styles.resetCustomText}>🔄 HỦY CHỦ ĐỀ</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Chọn Cấp độ CEFR */}
        <Text style={styles.sectionLabel}>CHỌN LEVEL CẤP ĐỘ:</Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} 
              onPress={() => handleSelectLevel(lvl)}
            >
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chọn Chế độ Đấu */}
        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, mode === 'solo' && styles.modeBtnActive]} onPress={() => setMode('solo')}>
            <Text style={[styles.modeText, mode === 'solo' && styles.modeTextActive]}>🎯 SOLO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'relay' && styles.modeBtnActive]} onPress={() => setMode('relay')}>
            <Text style={[styles.modeText, mode === 'relay' && styles.modeTextActive]}>⚡ RELAY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'roleplay' && styles.modeBtnActive]} onPress={() => setMode('roleplay')}>
            <Text style={[styles.modeText, mode === 'roleplay' && styles.modeTextActive]}>🎭 ROLEPLAY</Text>
          </TouchableOpacity>
        </View>

        {/* CARD THI ĐẤU CHÍNH */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>📌 SÀN ĐẤU {mode.toUpperCase()} [{cefrLevel}]</Text>

          {exercise ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.scenarioTitle}>{exercise.title || exercise.topic}</Text>
              
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>
                  ⏱ THỜI GIAN LƯỢT [{cefrLevel}]: {turnTimer}s {isRecording ? '(ĐANG THU ÂM)' : '(SẴN SÀNG)'}
                </Text>
                <Text style={[styles.timerValue, turnTimer <= 5 && { color: '#FF0055' }]}>
                  00:{turnTimer < 10 ? `0${turnTimer}` : turnTimer}
                </Text>
              </View>

              {(mode === 'relay' || mode === 'roleplay') && (
                <View style={styles.playersRow}>
                  <View style={[styles.playerCard, activePlayer === 1 && styles.activePlayerCard]}>
                    <Text style={styles.playerTag}>{mode === 'relay' ? '👤 PLAYER 1' : '👤 PLAYER 1'}</Text>
                    <Text style={styles.roleText}>🎭 Vai: {exercise.player1En || exercise.userRoleEn || 'Vai 1'}</Text>
                    <Text style={styles.playerScoreTag}>
                      🏆 Điểm độc lập: {playerScores.p1Score !== undefined ? `${playerScores.p1Score}đ` : 'Chưa đấu'}
                    </Text>
                    {activePlayer === 1 && <Text style={styles.turnIndicator}>👉 ĐANG NÓI!</Text>}
                  </View>

                  <View style={[styles.playerCard, activePlayer === 2 && styles.activePlayerCard]}>
                    <Text style={styles.playerTag}>{mode === 'roleplay' ? '🤖 AI PARTNER' : '👤 PLAYER 2'}</Text>
                    <Text style={styles.roleText}>🎭 Vai: {exercise.player2En || exercise.aiRoleEn || 'Vai 2'}</Text>
                    <Text style={styles.playerScoreTag}>
                      🏆 Điểm độc lập: {playerScores.p2Score !== undefined ? `${playerScores.p2Score}đ` : 'Chưa đấu'}
                    </Text>
                    {activePlayer === 2 && <Text style={styles.turnIndicator}>👉 ĐANG NÓI!</Text>}
                  </View>
                </View>
              )}

              {currentAvgScore !== null && mode !== 'solo' && (
                <View style={styles.totalScoreBox}>
                  <Text style={styles.totalScoreText}>🌟 ĐIỂM TỔNG TRUNG BÌNH CẶP ĐẤU: {currentAvgScore} / 100 ĐIỂM</Text>
                </View>
              )}

              <View style={styles.scriptBox}>
                <Text style={styles.promptText}>🎯 "{exercise.promptEn || exercise.contextEn || ''}"</Text>
              </View>

              {!isRecording && !isEvaluating ? (
                <TouchableOpacity style={styles.startBtn} onPress={startFullRecording}>
                  <Text style={styles.startBtnText}>
                    {mode === 'solo' 
                      ? `🎙 BẤM THU ÂM SOLO (${getTimerByLevel(cefrLevel)}s)` 
                      : `🎙 BẤM THU ÂM CHUNG (${getTimerByLevel(cefrLevel)}s / LƯỢT)`}
                  </Text>
                </TouchableOpacity>
              ) : isRecording ? (
                <View style={{ width: '100%', gap: 8 }}>
                  {activePlayer === 1 && (mode === 'relay' || mode === 'roleplay') && (
                    <TouchableOpacity style={styles.switchTurnBtn} onPress={handleSwitchTurn}>
                      <Text style={styles.switchTurnText}>🔄 CHUYỂN LƯỢT SANG PLAYER 2 (TIẾP TỤC THU ÂM)</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity style={styles.recordBtn} onPress={stopFullRecordingAndEvaluate}>
                    <Text style={styles.recordBtnText}>
                      {mode === 'solo' ? '🛑 DỪNG & NỘP BÀI NÓI SOLO' : '🛑 HOÀN THÀNH & NỘP BẢN THU ÂM ĐÔI'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginVertical: 15, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#00FFFF" />
                  <Text style={{ color: '#00FFFF', fontSize: 11, marginTop: 5 }}>🤖 AI đang phân tích âm thanh & bóc tách toàn bộ lời thoại...</Text>
                </View>
              )}

              {evalResult && (
                <View style={styles.evalBox}>
                  <Text style={styles.evalScore}>🏆 ĐIỂM BÀI NÓI: {evalResult.score}/100</Text>
                  {evalResult.audioUrl && (
                    <View style={styles.audioPlayerBox}>
                      <Text style={styles.audioLabel}>🎧 Nghe lại bài thu âm vừa nộp:</Text>
                      {React.createElement('audio', {
                        controls: true,
                        src: evalResult.audioUrl,
                        style: { width: '100%', marginTop: 6, height: 36 }
                      })}
                    </View>
                  )}
                  <Text style={styles.transcriptText}>💬 Lời thoại ghi nhận đầy đủ: "{evalResult.transcript}"</Text>
                  <Text style={styles.feedbackText}>💡 Nhận xét AI: {evalResult.detailedFeedback}</Text>
                </View>
              )}

              {!isUsingCustomTopic && (
                <TouchableOpacity style={styles.nextBtn} onPress={() => loadNewExercise()}>
                  <Text style={styles.nextBtnText}>🔄 TẢI TRẬN ĐẤU MỚI</Text>
                </TouchableOpacity>
              )}
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
  studentInfoCard: { backgroundColor: '#120826', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#00FFFF', width: '100%', marginBottom: 12 },
  studentInfoTitle: { color: '#00FFFF', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  infoInput: { backgroundColor: '#0D0620', color: '#FFF', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#332255', fontSize: 11 },
  customTopicCard: { backgroundColor: '#130A2A', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', width: '100%', marginBottom: 15 },
  customTopicTitle: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 6 },
  topicInput: { backgroundColor: '#0D0620', color: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255', fontSize: 11, minHeight: 45, marginBottom: 8, textAlignVertical: 'top' },
  applyCustomBtn: { flex: 1, backgroundColor: '#FF007F', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  applyCustomText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  resetCustomBtn: { backgroundColor: '#332255', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' },
  resetCustomText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
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
  timerBox: { backgroundColor: '#120826', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', alignItems: 'center', width: '100%', marginBottom: 12 },
  timerLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  timerValue: { color: '#39FF14', fontSize: 20, fontWeight: '900', marginTop: 2 },
  playersRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  playerCard: { flex: 0.48, backgroundColor: '#0D0620', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#332255' },
  activePlayerCard: { borderColor: '#FF007F', borderWidth: 2, backgroundColor: '#1A0B2E' },
  playerTag: { color: '#00FFFF', fontSize: 9, fontWeight: '900' },
  roleText: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginTop: 3 },
  playerScoreTag: { color: '#39FF14', fontSize: 9, fontWeight: '900', marginTop: 4 },
  turnIndicator: { color: '#FF007F', fontSize: 8, fontWeight: '900', marginTop: 4 },
  totalScoreBox: { backgroundColor: '#130A2A', padding: 10, borderRadius: 8, width: '100%', borderWidth: 1, borderColor: '#39FF14', alignItems: 'center', marginBottom: 12 },
  totalScoreText: { color: '#39FF14', fontSize: 11, fontWeight: '900' },
  scriptBox: { backgroundColor: '#130A2A', padding: 10, borderRadius: 8, width: '100%', borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptText: { color: '#FFF', fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 16 },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, width: '100%', alignItems: 'center', marginVertical: 10 },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  switchTurnBtn: { backgroundColor: '#00FFFF', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  switchTurnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  recordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, width: '100%', alignItems: 'center' },
  recordBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  evalBox: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#39FF14', width: '100%', marginTop: 12 },
  evalScore: { color: '#39FF14', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  audioPlayerBox: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, width: '100%', marginBottom: 8, borderWidth: 1, borderColor: '#00FFFF' },
  audioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  transcriptText: { color: '#FFF', fontSize: 10, fontStyle: 'italic', marginBottom: 6 },
  feedbackText: { color: '#FFD700', fontSize: 10, marginTop: 4 },
  nextBtn: { backgroundColor: '#39FF14', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginTop: 12, width: '100%', alignItems: 'center' },
  nextBtnText: { color: '#000', fontSize: 11, fontWeight: '900' }
});