// src/screens/AllInArenaScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { generateSoloTopic, clearSoloTopicHistory, SoloTopic } from '../services/arena/soloService';
import { generateRelayChallenge, clearRelayHistory, RelayChallenge } from '../services/arena/relayService';
import { generateRoleplayScenario, clearRoleplayHistory, RoleplayScenario } from '../services/arena/roleplayService';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { updateUserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function AllInArenaScreen({ onBack }: Props) {
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [opponentType, setOpponentType] = useState<'bot' | 'pvp'>('bot');
  const [loading, setLoading] = useState<boolean>(true);

  const [soloTopic, setSoloTopic] = useState<SoloTopic | null>(null);
  const [relayChallenge, setRelayChallenge] = useState<RelayChallenge | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<RoleplayScenario | null>(null);

  // ⚡ STATE PHỤ ÉP RE-RENDER GIAO DIỆN
  const [topicKey, setTopicKey] = useState<number>(0);

  const [battleState, setBattleState] = useState<'idle' | 'searching' | 'battling' | 'analyzing' | 'ended'>('idle');
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [matchedOpponent, setMatchedOpponent] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedTurn1, setRecordedTurn1] = useState<Blob | null>(null);
  const [recordedTurn2, setRecordedTurn2] = useState<Blob | null>(null);
  const [hasRecordedTurn1, setHasRecordedTurn1] = useState<boolean>(false);
  const [hasRecordedTurn2, setHasRecordedTurn2] = useState<boolean>(false);

  // 🎙 STATE HỖ TRỢ QUYỀN MICROPHONE
  const [micPermissionModal, setMicPermissionModal] = useState<boolean>(false);

  const [result, setResult] = useState<AssessmentResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef<number>(0);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const getFullTimeForLevel = (level: string) => {
    if (level === 'A1' || level === 'A2') return 20;
    if (level === 'B1' || level === 'B2') return 40;
    return 60;
  };

  const getTimeForCurrentTurn = (level: string, currentMode: string) => {
    const total = getFullTimeForLevel(level);
    if (currentMode === 'solo') return total;
    return Math.floor(total / 2);
  };

  const handleLevelChange = (newLevel: string) => {
    if (newLevel === cefrLevel) return;
    clearSoloTopicHistory();
    clearRelayHistory();
    clearRoleplayHistory();
    setCefrLevel(newLevel);
  };

  const handleModeChange = (newMode: 'solo' | 'relay' | 'roleplay') => {
    if (newMode === mode) return;
    clearSoloTopicHistory();
    clearRelayHistory();
    clearRoleplayHistory();
    setMode(newMode);
  };

  const resetBattleState = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setBattleState('idle');
    setCurrentTurn(1);
    setIsRecording(false);
    setIsTimerRunning(false);
    setRecordedTurn1(null);
    setRecordedTurn2(null);
    setHasRecordedTurn1(false);
    setHasRecordedTurn2(false);
    setResult(null);
    audioChunksRef.current = [];
  };

  const startTurnTimer = (allocatedTime: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTimeLeft(allocatedTime);
    setIsTimerRunning(true);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsTimerRunning(false);

          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try { mediaRecorderRef.current.stop(); } catch (e) {}
          }
          setIsRecording(false);

          if (mode !== 'solo' && currentTurn === 1) {
            setCurrentTurn(2);
            const turn2Time = getTimeForCurrentTurn(cefrLevel, mode);
            setTimeout(() => startTurnTimer(turn2Time), 300);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ⚡ HÀM TẢI ĐỀ ÉP XÓA VÀ RENDER LẠI 100%
  const loadModeData = async (selectedMode: string, level: string) => {
    const currentRequestId = ++requestIdRef.current;
    
    setLoading(true);
    resetBattleState();

    setSoloTopic(null);
    setRelayChallenge(null);
    setRoleplayScenario(null);

    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      if (selectedMode === 'solo') {
        const data = await generateSoloTopic(level);
        if (currentRequestId === requestIdRef.current) {
          setSoloTopic(data);
          setTopicKey(Date.now());
        }
      } else if (selectedMode === 'relay') {
        const data = await generateRelayChallenge(level);
        if (currentRequestId === requestIdRef.current) {
          setRelayChallenge(data);
          setTopicKey(Date.now());
        }
      } else {
        const data = await generateRoleplayScenario(level);
        if (currentRequestId === requestIdRef.current) {
          setRoleplayScenario(data);
          setTopicKey(Date.now());
        }
      }
    } catch (err) {
      console.error("Lỗi tải đề Trạm 2:", err);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRefreshTopic = () => {
    if (loading) return;

    if (mode === 'solo') clearSoloTopicHistory();
    else if (mode === 'relay') clearRelayHistory();
    else clearRoleplayHistory();

    loadModeData(mode, cefrLevel);
  };

  useEffect(() => {
    loadModeData(mode, cefrLevel);
    return () => resetBattleState();
  }, [mode, cefrLevel]);

  const startMatch = () => {
    resetBattleState();
    setBattleState('searching');
    
    setTimeout(() => {
      if (opponentType === 'bot') {
        setMatchedOpponent('🤖 CYBER BOT [' + cefrLevel + ']');
      } else {
        const fakeUsernames = ['CyberKnight99', 'NeonSpeaker', 'VibeMaster', 'EchoRider'];
        setMatchedOpponent('👤 ' + fakeUsernames[Math.floor(Math.random() * fakeUsernames.length)] + ' [' + cefrLevel + ']');
      }
      
      setCurrentTurn(1);
      setBattleState('battling');
      const allocatedTime = getTimeForCurrentTurn(cefrLevel, mode);
      startTurnTimer(allocatedTime);
    }, 1500);
  };

  // 🎙 XỬ LÝ THU ÂM CÓ BẮT LỖI QUYỀN MICROPHONE
  const handleToggleRecord = async () => {
    if (!isRecording) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          let options = {};
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            if (recordedBlob.size > 8000) {
              if (mode === 'solo' || currentTurn === 1) {
                setRecordedTurn1(recordedBlob);
                setHasRecordedTurn1(true);
              } else {
                setRecordedTurn2(recordedBlob);
                setHasRecordedTurn2(true);
              }
            } else {
              if (mode === 'solo' || currentTurn === 1) {
                setRecordedTurn1(null); setHasRecordedTurn1(false);
              } else {
                setRecordedTurn2(null); setHasRecordedTurn2(false);
              }
              alert("⚠️ Chưa ghi nhận giọng nói rõ ràng! Vui lòng bấm giữ nút và nói rõ.");
            }
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start(200);
          setIsRecording(true);
        }
      } catch (err) {
        // Mở Modal hướng dẫn khi người dùng bị trình duyệt chặn Micro
        setMicPermissionModal(true);
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsTimerRunning(false);
    }
  };

  // 💥 TẠO CHUỖI ÉP AI CHẤM NGHIÊM NGẶT THEO CHẾ ĐỘ THI ĐẤU
  const getCurrentPromptText = () => {
    if (mode === 'solo' && soloTopic) {
      return `SOLO TOPIC: "${soloTopic.promptEn}". Candidate must thoroughly address this prompt.`;
    }
    if (mode === 'relay' && relayChallenge) {
      return `RELAY DEBATE CHALLENGE:
Topic: "${relayChallenge.topic}"
Context: "${relayChallenge.contextEn}"
Player 1 Requirement: "${relayChallenge.player1En}"
Player 2 Requirement: "${relayChallenge.player2En}"
STRICT GRADING RULE FOR RELAY: The candidate MUST cover BOTH Player 1 AND Player 2 requirements. If candidate only presents Player 1 side and omits Player 2 side, Task Fulfillment (Content Score) MUST NOT exceed 45/100.`;
    }
    if (mode === 'roleplay' && roleplayScenario) {
      return `ROLEPLAY SCENARIO:
Title: "${roleplayScenario.scenarioTitle}"
AI Role: "${roleplayScenario.aiRoleEn}"
User Role: "${roleplayScenario.userRoleEn}"
Goal: "${roleplayScenario.goalEn}"
STRICT GRADING RULE FOR ROLEPLAY: Candidate must fulfill the user role goal completely. Missing key details will penalize Task Fulfillment score severe.`;
    }
    return 'General speaking challenge';
  };

  const handleSubmitBattleAnswer = async () => {
    if (!hasRecordedTurn1 || !recordedTurn1) {
      alert("🔒 Vui lòng thực hiện ghi âm trước!");
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (isRecording) setIsRecording(false);
    setBattleState('analyzing');

    const targetPrompt = getCurrentPromptText();
    const evalData = await evaluateSpeaking(recordedTurn1, cefrLevel, undefined, targetPrompt);
    
    setResult(evalData);
    setBattleState('ended');
    updateUserProgress(2, evalData.isWin ? 50 : 10, evalData.isWin);
  };

  const isSubmitDisabled = mode === 'solo' 
    ? (!hasRecordedTurn1 || !recordedTurn1)
    : (!hasRecordedTurn1 || !recordedTurn1 || !hasRecordedTurn2 || !recordedTurn2);

  // 🎯 COMPONENT DÙNG CHUNG HIỂN THỊ ĐỀ BÀI (RENDER CẢ LÚC CHỜ VÀ LÚC ĐANG THI ĐẤU)
  const renderTopicContent = () => (
    <View style={{ width: '100%', alignItems: 'center' }}>
      {mode === 'solo' && soloTopic && (
        <>
          <Text style={styles.topicTitle}>{soloTopic.title}</Text>
          <Text style={styles.promptText}>"{soloTopic.promptEn}"</Text>
          {soloTopic.promptVi && (
            <Text style={styles.translationText}>💡 Dịch: "{soloTopic.promptVi}"</Text>
          )}
        </>
      )}

      {mode === 'relay' && relayChallenge && (
        <>
          <Text style={styles.topicTitle}>📌 {relayChallenge.topic}</Text>
          <Text style={styles.promptText}>💡 Bối cảnh: "{relayChallenge.contextEn}"</Text>
          {relayChallenge.contextVi && (
            <Text style={styles.translationText}>👉 Dịch: "{relayChallenge.contextVi}"</Text>
          )}
          <View style={{ marginTop: 8, width: '100%', backgroundColor: '#130A2A', padding: 8, borderRadius: 8 }}>
            <Text style={styles.guidelineText}>👤 P1: {relayChallenge.player1En}</Text>
            {relayChallenge.player1Vi && (
              <Text style={styles.translationText}>👉 {relayChallenge.player1Vi}</Text>
            )}
            <Text style={[styles.guidelineText, { marginTop: 4 }]}>👤 P2: {relayChallenge.player2En}</Text>
            {relayChallenge.player2Vi && (
              <Text style={styles.translationText}>👉 {relayChallenge.player2Vi}</Text>
            )}
          </View>
        </>
      )}

      {mode === 'roleplay' && roleplayScenario && (
        <>
          <Text style={styles.topicTitle}>🎭 {roleplayScenario.scenarioTitle}</Text>
          <Text style={styles.roleText}>
            🤖 AI: {roleplayScenario.aiRoleEn} {roleplayScenario.aiRoleVi ? `(${roleplayScenario.aiRoleVi})` : ''} 
            {'  |  '}
            👤 Bạn: {roleplayScenario.userRoleEn} {roleplayScenario.userRoleVi ? `(${roleplayScenario.userRoleVi})` : ''}
          </Text>
          <Text style={styles.promptText}>💬 Mở đầu: "{roleplayScenario.initialAiMessage}"</Text>
          <Text style={styles.promptText}>🎯 Mục tiêu: {roleplayScenario.goalEn}</Text>
          {roleplayScenario.goalVi && (
            <Text style={styles.translationText}>👉 Dịch: {roleplayScenario.goalVi}</Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* CHỌN CHẾ ĐỘ THI ĐẤU */}
        <Text style={styles.sectionLabel}>1. CHỌN DẠNG BÀI ĐẤU TRƯỜNG:</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.modeTab, mode === 'solo' && styles.modeTabActive]} onPress={() => handleModeChange('solo')}>
            <Text style={[styles.modeTabText, mode === 'solo' && styles.modeTextActive]}>🔥 SOLO PULSE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeTab, mode === 'relay' && styles.modeTabActive]} onPress={() => handleModeChange('relay')}>
            <Text style={[styles.modeTabText, mode === 'relay' && styles.modeTextActive]}>🤝 RELAY 2P</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeTab, mode === 'roleplay' && styles.modeTabActive]} onPress={() => handleModeChange('roleplay')}>
            <Text style={[styles.modeTabText, mode === 'roleplay' && styles.modeTextActive]}>🎭 ROLEPLAY</Text>
          </TouchableOpacity>
        </View>

        {/* CHỌN ĐỐI THỦ */}
        <Text style={styles.sectionLabel}>2. CHỌN ĐỐI THỦ THÁCH ĐẤU:</Text>
        <View style={styles.opponentRow}>
          <TouchableOpacity style={[styles.opponentBtn, opponentType === 'bot' && styles.opponentBtnActive]} onPress={() => setOpponentType('bot')}>
            <Text style={[styles.opponentText, opponentType === 'bot' && styles.opponentTextActive]}>🤖 ĐẤU BOT AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.opponentBtn, opponentType === 'pvp' && styles.opponentBtnActivePvP]} onPress={() => setOpponentType('pvp')}>
            <Text style={[styles.opponentText, opponentType === 'pvp' && styles.opponentTextActive]}>👥 ĐẤU NGƯỜI THẬT</Text>
          </TouchableOpacity>
        </View>

        {/* CHỌN LEVEL */}
        <Text style={styles.sectionLabel}>3. CHỌN LEVEL:</Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity key={lvl} style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} onPress={() => handleLevelChange(lvl)}>
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CHỜ TRẬN & HIỂN THỊ ĐỀ THI */}
        {battleState === 'idle' && (
          <View style={styles.box} key={topicKey}>
            <Text style={styles.boxTitle}>⚡ {mode.toUpperCase()} [{cefrLevel}]</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#FF007F" style={{ marginVertical: 15 }} />
            ) : (
              renderTopicContent()
            )}

            <TouchableOpacity 
              style={[styles.refreshBtn, loading && styles.refreshBtnDisabled]} 
              onPress={handleRefreshTopic} 
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#00FFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.refreshBtnText}>⏳ AI ĐANG SINH ĐỀ MỚI ({cefrLevel})...</Text>
                </View>
              ) : (
                <Text style={styles.refreshBtnText}>🔄 ĐỔI ĐỀ MỚI KHÔNG LẶP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.startBtn} onPress={startMatch} disabled={loading}>
              <Text style={styles.startBtnText}>⚔️ BẮT ĐẦU ĐẤU</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GHÉP CẶP */}
        {battleState === 'searching' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>🔍 ĐANG KẾT NỐI ĐỐI THỦ [{cefrLevel}]...</Text>
          </View>
        )}

        {/* THI ĐẤU - KHUNG HIỂN THỊ ĐỀ BÀI CỐ ĐỊNH TRONG LÚC NÓI */}
        {battleState === 'battling' && (
          <View style={styles.box}>
            <View style={styles.battleHeader}>
              <Text style={styles.opponentName}>⚔️ VS {matchedOpponent}</Text>
              <Text style={styles.timerText}>
                {mode === 'solo' ? `⏱ TỔNG THỜI GIAN: ${timeLeft}s` : `⏱ LƯỢT ${currentTurn} (P${currentTurn}): ${timeLeft}s`}
              </Text>
            </View>

            {/* 📌 KHUNG CỐ ĐỊNH ĐỀ BÀI LÚC ĐANG THI ĐẤU */}
            <View style={styles.promptDisplayContainer}>
              <Text style={styles.promptDisplayTitle}>📌 ĐỀ BÀI THI ĐẤU (ĐỌC KHI NÓI):</Text>
              {renderTopicContent()}
            </View>

            {mode !== 'solo' && (
              <View style={styles.turnBadge}>
                <Text style={styles.turnBadgeText}>
                  {currentTurn === 1 ? '👉 LƯỢT PLAYER 1 (NÓI PHẦN P1)' : '👉 LƯỢT PLAYER 2 / BOT (NÓI PHẦN P2)'}
                </Text>
              </View>
            )}

            <TouchableOpacity style={[styles.recordToggleBtn, isRecording && styles.recordToggleBtnActive]} onPress={handleToggleRecord}>
              <Text style={styles.recordToggleText}>
                {isRecording 
                  ? `🔴 ĐANG THU ÂM (LƯỢT ${currentTurn})... (VỪA NÓI VỪA NHÌN ĐỀ BÀI Ở TRÊN)` 
                  : (currentTurn === 1 ? hasRecordedTurn1 : hasRecordedTurn2) 
                    ? `✅ ĐÃ CÓ BẢN THU LƯỢT ${currentTurn} (BẤM THU LẠI)` 
                    : `🎙 BẤM THU ÂM LƯỢT ${currentTurn}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.submitBtn, isSubmitDisabled && styles.submitBtnDisabled]} onPress={handleSubmitBattleAnswer} disabled={isSubmitDisabled}>
              <Text style={styles.submitBtnText}>⚡ NỘP BÀI & CHẤM ĐIỂM AI</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI PHÂN TÍCH */}
        {battleState === 'analyzing' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#39FF14" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>⚡ GROQ AI ĐANG ĐỐI CHIẾU Ý NÓI VỚI ĐỀ BÀI (TASK FULFILLMENT)...</Text>
          </View>
        )}

        {/* KẾT QUẢ THI ĐẤU */}
        {battleState === 'ended' && result && (
          <View style={styles.box}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🎉 BẠN ĐÃ CHIẾN THẮNG!' : '💀 THẤT BẠI TRONG TRẬN ĐẤU'}
            </Text>
            <Text style={styles.scoreText}>⚡ TỔNG ĐIỂM TRẬN ĐẤU: {result.score} / 100 ĐIỂM</Text>

            {result.audioUrl && (
              <View style={styles.nativeAudioContainer}>
                <Text style={styles.nativeAudioLabel}>🎧 NGHE LẠI BẢN THU CỦA BẠN:</Text>
                <audio controls src={result.audioUrl} style={{ width: '100%', marginTop: 6 }} />
              </View>
            )}

            {/* 📝 BẢN PHÂN TÍCH TỪNG TỪ PHÁT ÂM (COLOR CODED SCRIPT) */}
            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 PHÂN TÍCH PHÁT ÂM CHI TIẾT TỪNG TỪ:</Text>
              <View style={styles.wordBadgeContainer}>
                {result.wordAnalysis && result.wordAnalysis.length > 0 ? (
                  result.wordAnalysis.map((item, idx) => (
                    <Text 
                      key={idx} 
                      style={[
                        styles.wordChip,
                        item.status === 'correct' && styles.wordCorrect,
                        item.status === 'warning' && styles.wordWarning,
                        item.status === 'error' && styles.wordError,
                      ]}
                    >
                      {item.word}{' '}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.scriptContent}>"{result.transcript}"</Text>
                )}
              </View>
              <Text style={styles.wordLegendText}>
                Chú thích: <Text style={{ color: '#39FF14' }}>● Chuẩn</Text> | <Text style={{ color: '#FFD700' }}>● Cần cải thiện</Text> | <Text style={{ color: '#FF0055' }}>● Bị sai/ngắc ứ</Text>
              </Text>
              <Text style={styles.wordCountText}>📊 Số từ phản xạ thực tế: {result.wordCount} từ</Text>
            </View>

            <Text style={styles.breakdownHeaderLabel}>📊 PHÂN TÍCH CHI TIẾT 6 TIÊU CHÍ:</Text>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>🎯 1. Đáp ứng ý đề bài (Task):</Text><Text style={[styles.breakdownValue, result.content < 60 && { color: '#FF0055' }]}>{result.content}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>🗣 2. Phát âm:</Text><Text style={styles.breakdownValue}>{result.pronunciation}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>📚 3. Ngữ pháp:</Text><Text style={styles.breakdownValue}>{result.grammar}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>🔤 4. Từ vựng:</Text><Text style={styles.breakdownValue}>{result.vocabulary}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>⚡ 5. Phản xạ:</Text><Text style={styles.breakdownValue}>{result.reflexes}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>🌊 6. Trôi chảy:</Text><Text style={styles.breakdownValue}>{result.fluency}/100</Text></View>
            </View>

            {/* Hiển thị các ý bị thiếu */}
            {result.missingRequirements && result.missingRequirements.length > 0 && (
              <View style={styles.missingBox}>
                <Text style={styles.missingTitle}>⚠️ Ý CÒN THIẾU TRONG BÀI NÓI:</Text>
                {result.missingRequirements.map((req, idx) => (
                  <Text key={idx} style={styles.missingItem}>• {req}</Text>
                ))}
              </View>
            )}

            <Text style={styles.feedbackText}>💡 Nhận xét AI: {result.detailedFeedback}</Text>

            <TouchableOpacity style={styles.startBtn} onPress={() => loadModeData(mode, cefrLevel)}>
              <Text style={styles.startBtnText}>🔄 TÌM TRẬN ĐẤU MỚI</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 🛑 MODAL HƯỚNG DẪN MỞ MICRO KHI BỊ CHẶN */}
      <Modal visible={micPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🎙 QUYỀN MICRO BỊ CHẶN!</Text>
            <Text style={styles.modalText}>
              Trình duyệt đang chặn quyền Micro. Để tham gia thi đấu:
              {'\n\n'}1. Bấm vào biểu tượng 🔒 **Ổ khóa** hoặc 🎙 **Micro** trên thanh địa chỉ trình duyệt.
              {'\n'}2. Chọn **Cho phép (Allow)** Microphone.
              {'\n'}3. Tải lại trang và bấm thu âm lại.
            </Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setMicPermissionModal(false)}>
              <Text style={styles.modalCloseText}>ĐÃ HỂU & ĐÓNG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 12, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  modeTab: { backgroundColor: '#0D0620', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '32%', alignItems: 'center' },
  modeTabActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  modeTabText: { color: '#8888AA', fontSize: 9, fontWeight: '900' },
  modeTextActive: { color: '#FFF' },
  opponentRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  opponentBtn: { backgroundColor: '#0D0620', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '48%', alignItems: 'center' },
  opponentBtnActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  opponentBtnActivePvP: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  opponentText: { color: '#AAAABB', fontSize: 10, fontWeight: '900' },
  opponentTextActive: { color: '#000' },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 12 },
  topicTitle: { color: '#00FFFF', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  promptText: { color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 18, marginBottom: 4 },
  guidelineText: { color: '#FFF', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  roleText: { color: '#FFD700', fontSize: 11, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  translationText: { color: '#00FFFF', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginBottom: 8 },
  promptDisplayContainer: { width: '100%', backgroundColor: '#130A2A', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 12 },
  promptDisplayTitle: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  turnBadge: { backgroundColor: '#1A0B2E', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14', marginBottom: 10 },
  turnBadgeText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  searchingText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  refreshBtnDisabled: { opacity: 0.5, borderColor: '#555577' },
  refreshBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#FF007F', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  battleHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10, alignItems: 'center' },
  opponentName: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  timerText: { color: '#39FF14', fontSize: 10, fontWeight: '900' },
  recordToggleBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordToggleBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  recordToggleText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.2 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  scoreText: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 10 },
  nativeAudioContainer: { width: '100%', backgroundColor: '#1A0B2E', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 12, alignItems: 'center' },
  nativeAudioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scriptBox: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', width: '100%', marginBottom: 12 },
  scriptLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginBottom: 6 },
  wordBadgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  wordChip: { fontSize: 12, fontWeight: '800', lineHeight: 18 },
  wordCorrect: { color: '#39FF14' },
  wordWarning: { color: '#FFD700' },
  wordError: { color: '#FF0055' },
  wordLegendText: { color: '#AAAABB', fontSize: 9, marginBottom: 4 },
  wordCountText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  breakdownHeaderLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  breakdownCard: { backgroundColor: '#120826', padding: 12, borderRadius: 10, width: '100%', marginBottom: 12, borderWidth: 1, borderColor: '#FF007F' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#221133' },
  breakdownLabel: { color: '#AAAABB', fontSize: 10 },
  breakdownValue: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },
  missingBox: { backgroundColor: '#2A081A', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FF0055', width: '100%', marginBottom: 12 },
  missingTitle: { color: '#FF0055', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  missingItem: { color: '#FFD700', fontSize: 10, marginVertical: 2 },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center' },
  modalTitle: { color: '#FF007F', fontSize: 13, fontWeight: '900', marginBottom: 10 },
  modalText: { color: '#FFF', fontSize: 11, lineHeight: 18, marginBottom: 15, textAlign: 'left' },
  modalCloseBtn: { backgroundColor: '#00FFFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalCloseText: { color: '#000', fontSize: 10, fontWeight: '900' }
});