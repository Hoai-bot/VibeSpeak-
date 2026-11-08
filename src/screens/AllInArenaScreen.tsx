// src/screens/AllInArenaScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native';
import { generateSoloTopic, clearSoloTopicHistory, SoloTopic } from '../services/arena/soloService';
import { generateRelayChallenge, clearRelayHistory, RelayChallenge } from '../services/arena/relayService';
import { generateRoleplayScenario, clearRoleplayHistory, RoleplayScenario } from '../services/arena/roleplayService';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { updateUserProgress, saveSubmissionToCloud } from '../services/userService';

interface Props {
  onBack: () => void;
}

const safeBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    if (!blob) return resolve('');
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result || '');
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
};

export default function AllInArenaScreen({ onBack }: Props) {
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [cefrLevel, setCefrLevel] = useState<string>('A1');
  const [opponentType, setOpponentType] = useState<'bot' | 'pvp'>('pvp');
  const [loading, setLoading] = useState<boolean>(true);

  const [soloTopic, setSoloTopic] = useState<SoloTopic | null>(null);
  const [relayChallenge, setRelayChallenge] = useState<RelayChallenge | null>(null);
  const [roleplayScenario, setRoleplayScenario] = useState<RoleplayScenario | null>(null);

  const [topicKey, setTopicKey] = useState<number>(0);
  const [battleState, setBattleState] = useState<'idle' | 'searching' | 'battling' | 'analyzing' | 'ended'>('idle');
  
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [micPermissionModal, setMicPermissionModal] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const [showIdentityModal, setShowIdentityModal] = useState<boolean>(false);
  const [studentNameInput, setStudentNameInput] = useState<string>('');
  const [pairNameInput, setPairNameInput] = useState<string>('');
  const [pendingEvalData, setPendingEvalData] = useState<AssessmentResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef<number>(0);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const getTotalTimeForScenario = (level: string, currentMode: string) => {
    if (currentMode === 'roleplay' || currentMode === 'relay') {
      if (level === 'A1' || level === 'A2') return 45;
      if (level === 'B1' || level === 'B2') return 75;
      return 90;
    }
    return 30; // Solo
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
    setIsRecording(false);
    setIsTimerActive(false);
    setRecordedBlob(null);
    setHasRecorded(false);
    setAudioUrl(null);
    setResult(null);
    setPendingEvalData(null);
    audioChunksRef.current = [];
  };

  useEffect(() => {
    if (!isTimerActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          if (timerRef.current) clearInterval(timerRef.current);

          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try { mediaRecorderRef.current.stop(); } catch (e) {}
          }
          setIsRecording(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive]);

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
        if (currentRequestId === requestIdRef.current) setSoloTopic(data);
      } else if (selectedMode === 'relay') {
        const data = await generateRelayChallenge(level);
        if (currentRequestId === requestIdRef.current) setRelayChallenge(data);
      } else {
        const data = await generateRoleplayScenario(level);
        if (currentRequestId === requestIdRef.current) setRoleplayScenario(data);
      }
      setTopicKey(Date.now());
    } catch (err) {
      console.error("Lỗi tải đề Trạm 2:", err);
    } finally {
      if (currentRequestId === requestIdRef.current) setLoading(false);
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
      setBattleState('battling');
      setIsTimerActive(false);
      const allocatedTime = getTotalTimeForScenario(cefrLevel, mode);
      setTimeLeft(allocatedTime);
    }, 800);
  };

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
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            
            if (blob.size > 800) {
              const url = URL.createObjectURL(blob);
              setRecordedBlob(blob);
              setHasRecorded(true);
              setAudioUrl(url);
            } else {
              alert("⚠️ Ghi âm chưa rõ! Vui lòng bấm thu âm lại.");
            }

            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start(200);
          setIsRecording(true);
          setIsTimerActive(true);
        }
      } catch (err) {
        setMicPermissionModal(true);
      }
    } else {
      setIsRecording(false);
      setIsTimerActive(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
    }
  };

  const getCurrentPromptText = () => {
    if (mode === 'solo' && soloTopic) return soloTopic.promptEn;
    if (mode === 'relay' && relayChallenge) return `${relayChallenge.topic}: ${relayChallenge.contextEn}`;
    if (mode === 'roleplay' && roleplayScenario) return `Roleplay Context: ${roleplayScenario.scenarioTitle} - Goal: ${roleplayScenario.goalEn}`;
    return 'General speaking challenge';
  };

  const handleSubmitBattleAnswer = async () => {
    setIsTimerActive(false);

    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!recordedBlob || recordedBlob.size <= 800) {
      alert("🔒 Chưa ghi nhận bài nói! Vui lòng bấm Micro thu âm trước khi nộp.");
      return;
    }

    setBattleState('analyzing');

    try {
      const targetPrompt = getCurrentPromptText();
      const evalData = await evaluateSpeaking(recordedBlob, cefrLevel, undefined, targetPrompt);
      
      setResult(evalData);
      setPendingEvalData(evalData);
      setBattleState('ended');
      updateUserProgress(2, evalData.score || 85, (evalData.score || 85) >= 60);

      setShowIdentityModal(true);
    } catch (err) {
      console.error("Lỗi chấm điểm:", err);
      alert("⚠️ Lỗi kết nối chấm điểm. Vui lòng nộp lại!");
      setBattleState('battling');
    }
  };

  const handleConfirmSubmissionWithIdentity = async () => {
    if (opponentType === 'pvp' && !pairNameInput.trim()) {
      alert("Vui lòng nhập Tên Cặp đấu (Ví dụ: Tuấn & Lan)!");
      return;
    }
    if (opponentType === 'bot' && !studentNameInput.trim()) {
      alert("Vui lòng nhập Tên hoặc Mã Sinh Viên!");
      return;
    }

    const evalData = pendingEvalData || result;
    if (!evalData) return;

    let base64Audio = '';
    if (recordedBlob) {
      base64Audio = await safeBlobToBase64(recordedBlob);
    }

    await saveSubmissionToCloud({
      studentName: studentNameInput.trim() || 'Sinh viên VibeSpeak',
      pairName: opponentType === 'pvp' ? pairNameInput.trim() : `Solo [${opponentType.toUpperCase()}]`,
      mode: mode,
      cefrLevel: cefrLevel,
      score: evalData.score || 85,
      transcript: evalData.transcript || '',
      audioUrl: base64Audio || audioUrl || undefined,
      feedback: evalData.detailedFeedback || 'Bài làm đạt yêu cầu',
      timestamp: new Date().toISOString(),
    });

    setShowIdentityModal(false);
    alert("✅ Đã ghi nhận điểm thành công lên Bảng điểm Giáo viên!");
  };

  const isSubmitDisabled = !hasRecorded && !isRecording;

  // 🎯 PHẦN RENDER NỘI DUNG ĐỀ: PHÂN BIỆT RÕ PHẢN XẠ / ĐỐI ĐÁP TỰ DO VỚI ĐỌC THEO
  const renderTopicContent = () => (
    <View style={{ width: '100%', alignItems: 'center' }}>
      {mode === 'solo' && soloTopic && (
        <>
          <View style={styles.natureBadge}>
            <Text style={styles.natureBadgeText}>🎙️ PHẢN XẠ TỰ DO (KHÔNG CẦN ĐỌC THEO MẪU)</Text>
          </View>
          <Text style={styles.topicTitle}>🎯 CHỦ ĐỀ TRANH LUẬN: {soloTopic.title}</Text>
          
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestionLabel}>❓ Câu hỏi gợi mở / Đề bài:</Text>
            <Text style={styles.promptText}>"{soloTopic.promptEn}"</Text>
            {soloTopic.promptVi && (
              <Text style={styles.translationText}>💡 Gợi ý nghĩa: "{soloTopic.promptVi}"</Text>
            )}
            <Text style={styles.freedomGuide}>
              👉 Hướng dẫn: Bạn hãy tự do phát biểu suy nghĩ và trả lời câu hỏi bằng tiếng Anh theo phong cách riêng của bạn.
            </Text>
          </View>
        </>
      )}

      {mode === 'relay' && relayChallenge && (
        <>
          <View style={styles.natureBadge}>
            <Text style={styles.natureBadgeText}>🤝 THUYẾT TRÌNH TIẾP SỨC 2 NGƯỜI</Text>
          </View>
          <Text style={styles.topicTitle}>📌 CHỦ ĐỀ CHUNG: {relayChallenge.topic}</Text>
          
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestionLabel}>🏬 Bối cảnh thảo luận:</Text>
            <Text style={styles.promptText}>"{relayChallenge.contextEn}"</Text>
          </View>

          <View style={styles.roleCardBox}>
            <View style={styles.roleItem}>
              <Text style={styles.roleTitleP1}>👤 LƯỢT 1 (PLAYER 1):</Text>
              <Text style={styles.roleGuidelineText}>👉 Nhiệm vụ: {relayChallenge.player1En}</Text>
            </View>
            <View style={[styles.roleItem, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#332255', paddingTop: 8 }]}>
              <Text style={styles.roleTitleP2}>👥 LƯỢT 2 (PLAYER 2):</Text>
              <Text style={styles.roleGuidelineText}>👉 Nhiệm vụ: {relayChallenge.player2En}</Text>
            </View>
            <Text style={styles.freedomGuideCenter}>
              💡 Hai bạn lần lượt nói tiếp ý nhau để hoàn thành bài nói trọn vẹn!
            </Text>
          </View>
        </>
      )}

      {mode === 'roleplay' && roleplayScenario && (
        <>
          <View style={styles.natureBadge}>
            <Text style={styles.natureBadgeText}>🎭 NHẬP VAI ĐỐI THOẠI THỰC TẾ</Text>
          </View>
          <Text style={styles.topicTitle}>🏬 TÌNH HUỐNG: {roleplayScenario.scenarioTitle}</Text>
          
          <View style={styles.promptContainer}>
            <Text style={styles.promptQuestionLabel}>🎯 Mục tiêu cuộc trò chuyện:</Text>
            <Text style={styles.promptText}>"{roleplayScenario.goalEn}"</Text>
            {roleplayScenario.goalVi && (
              <Text style={styles.translationText}>👉 Dịch tình huống: "{roleplayScenario.goalVi}"</Text>
            )}
          </View>
          
          <View style={styles.roleCardBox}>
            <View style={styles.roleItem}>
              <Text style={styles.roleTitleP1}>🔴 VAI 1 (Player 1): {roleplayScenario.userRoleEn || 'Khách hàng / Customer'}</Text>
              <Text style={styles.roleSubHint}>Nhiệm vụ: Đưa ra yêu cầu, câu hỏi hoặc phản hồi với vai 2.</Text>
            </View>
            <View style={[styles.roleItem, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#332255', paddingTop: 8 }]}>
              <Text style={styles.roleTitleP2}>🔵 VAI 2 (Player 2): {roleplayScenario.aiRoleEn || 'Nhân viên / Staff'}</Text>
              <Text style={styles.roleSubHint}>Nhiệm vụ: Giải đáp, tư vấn hoặc đàm phán giải quyết vấn đề của vai 1.</Text>
            </View>
            <Text style={styles.freedomGuideCenter}>
              🗣️ 2 bạn tự do đối thoại qua lại một cách tự nhiên và cùng ghi âm chung 1 lượt!
            </Text>
          </View>
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
        <Text style={styles.title}>⚔️ TRẠM 2: VOCABULARY & ROLEPLAY ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <Text style={styles.sectionLabel}>1. CHỌN CHẾ ĐỘ THI ĐẤU:</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.modeTab, mode === 'solo' && styles.modeTabActive]} onPress={() => handleModeChange('solo')}>
            <Text style={[styles.modeTabText, mode === 'solo' && styles.modeTextActive]}>🔥 SOLO (1P)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeTab, mode === 'relay' && styles.modeTabActive]} onPress={() => handleModeChange('relay')}>
            <Text style={[styles.modeTabText, mode === 'relay' && styles.modeTextActive]}>🤝 RELAY (2P)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeTab, mode === 'roleplay' && styles.modeTabActive]} onPress={() => handleModeChange('roleplay')}>
            <Text style={[styles.modeTabText, mode === 'roleplay' && styles.modeTextActive]}>🎭 ROLEPLAY (2P)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>2. CHỌN ĐỐI THỦ THÁCH ĐẤU:</Text>
        <View style={styles.opponentRow}>
          <TouchableOpacity 
            style={[styles.opponentBtn, opponentType === 'bot' && styles.opponentBtnActive]} 
            onPress={() => setOpponentType('bot')}
          >
            <Text style={[styles.opponentText, opponentType === 'bot' && styles.opponentTextActive]}>🤖 ĐẤU BOT AI</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.opponentBtn, opponentType === 'pvp' && styles.opponentBtnActivePvP]} 
            onPress={() => setOpponentType('pvp')}
          >
            <Text style={[styles.opponentText, opponentType === 'pvp' && styles.opponentTextActive]}>👥 ĐẤU CẶP THẬT</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>3. CHỌN LEVEL CEFR:</Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity key={lvl} style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} onPress={() => handleLevelChange(lvl)}>
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {battleState === 'idle' && (
          <View style={styles.box} key={topicKey}>
            <Text style={styles.boxTitle}>⚡ TÌNH HUỐNG {mode.toUpperCase()} [{cefrLevel}] ({opponentType.toUpperCase()})</Text>
            {loading ? <ActivityIndicator size="small" color="#FF007F" style={{ marginVertical: 15 }} /> : renderTopicContent()}

            <TouchableOpacity style={[styles.refreshBtn, loading && styles.refreshBtnDisabled]} onPress={handleRefreshTopic} disabled={loading}>
              <Text style={styles.refreshBtnText}>🔄 ĐỔI TÌNH HUỐNG KHÁC</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startBtn} onPress={startMatch} disabled={loading}>
              <Text style={styles.startBtnText}>{mode === 'solo' ? '⚔️ BẮT ĐẦU THI ĐẤU' : '⚔️ BẮT ĐẦU THI ĐẤU CẶP'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {battleState === 'searching' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#FF007F" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>🔍 ĐANG MỞ SÀN ĐẤU {mode.toUpperCase()} [{opponentType.toUpperCase()}]...</Text>
          </View>
        )}

        {battleState === 'battling' && (
          <View style={styles.box}>
            <View style={styles.battleHeader}>
              <Text style={styles.opponentName}>{mode === 'solo' ? '🔥 CHẾ ĐỘ SOLO' : `🎭 SÀN ĐẤU CẶP (${opponentType === 'bot' ? '🤖 ĐẤU BOT' : '👥 ĐẤU THẬT'})`}</Text>
              <Text style={styles.timerText}>
                {isRecording ? `🔴 ĐANG THU ÂM: ${timeLeft}s` : `⏱ THỜI GIAN: ${timeLeft}s`}
              </Text>
            </View>

            <View style={styles.promptDisplayContainer}>
              {renderTopicContent()}
            </View>

            <TouchableOpacity style={[styles.recordToggleBtn, isRecording && styles.recordToggleBtnActive]} onPress={handleToggleRecord}>
              <Text style={styles.recordToggleText}>
                {isRecording 
                  ? `🛑 DỪNG THU ÂM (ĐÃ NÓI XONG)` 
                  : hasRecorded 
                    ? `🔄 BẤM ĐỂ THU ÂM LẠI LƯỢT NÓI` 
                    : mode === 'solo' 
                      ? `🎙 BẮT ĐẦU THU ÂM BÀI NÓI` 
                      : `🎙 BẤM MICRO ĐỂ CẢ 2 BẮT ĐẦU NÓI`}
              </Text>
            </TouchableOpacity>

            {/* 🎧 THANH NGHE LẠI BẢN THU ÂM CỦA NGƯỜI NÓI NGAY TRƯỚC KHI NỘP BÀI */}
            {audioUrl && !isRecording && (
              <View style={styles.previewAudioBox}>
                <View style={styles.previewAudioHeader}>
                  <Text style={styles.previewAudioTitle}>🎧 BẢN THU ÂM CỦA BẠN (NGHE LẠI TRƯỚC KHI NỘP):</Text>
                  <Text style={styles.previewAudioSub}>Bạn có thể nghe lại xem giọng đã to rõ chưa</Text>
                </View>
                {React.createElement('audio', {
                  controls: true,
                  src: audioUrl,
                  style: { width: '100%', height: '36px', marginTop: '6px' }
                })}
              </View>
            )}

            <TouchableOpacity style={[styles.submitBtn, isSubmitDisabled && styles.submitBtnDisabled]} onPress={handleSubmitBattleAnswer} disabled={isSubmitDisabled}>
              <Text style={styles.submitBtnText}>⚡ NỘP BÀI & AI CHẤM ĐIỂM NGAY</Text>
            </TouchableOpacity>
          </View>
        )}

        {battleState === 'analyzing' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#39FF14" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>⚡ GROQ AI ĐANG BÓC TÁCH & CHẤM ĐIỂM NỘI DUNG NÓI...</Text>
          </View>
        )}

        {battleState === 'ended' && result && (
          <View style={styles.box}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🎉 BÀI NÓI PHẢN XẠ XUẤT SẮC!' : '💡 CẦN RÈN LUYỆN THÊM ĐỘ TRÔI CHẢY'}
            </Text>
            <Text style={styles.scoreText}>⚡ TỔNG ĐIỂM {mode.toUpperCase()}: {result.score} / 100 ĐIỂM</Text>

            {/* 🎧 THANH NGHE LẠI BẢN THU ÂM SAU KHI CÓ KẾT QUẢ */}
            {audioUrl && (
              <View style={styles.audioPlayerSection}>
                <Text style={styles.audioSectionTitle}>🎧 NGHE LẠI BẢN THU ÂM CỦA TRẬN ĐẤU:</Text>
                {React.createElement('audio', {
                  controls: true,
                  src: audioUrl,
                  style: { width: '100%', height: '36px', marginTop: '6px' }
                })}
              </View>
            )}

            <View style={styles.userTranscriptBox}>
              <Text style={styles.userTranscriptTitle}>🎙 LỜI NÓI THỰC TẾ AI BÓC TÁCH ĐƯỢC TỪ BẠN:</Text>
              <Text style={styles.userTranscriptContent}>"{result.transcript}"</Text>
            </View>

            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>🎯 Tương tác & Phản xạ tình huống:</Text>
                <Text style={styles.breakdownValue}>{(result as any).content || 80}/100</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>🗣 Phát âm (Pronunciation):</Text>
                <Text style={styles.breakdownValue}>{(result as any).pronunciation || 85}/100</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>🔤 Từ vựng & Cấu trúc ngữ pháp:</Text>
                <Text style={styles.breakdownValue}>{(result as any).vocabulary || 80}/100</Text>
              </View>
            </View>

            <Text style={styles.feedbackText}>💡 Nhận xét từ AI: {result.detailedFeedback}</Text>

            <TouchableOpacity style={styles.startBtn} onPress={() => loadModeData(mode, cefrLevel)}>
              <Text style={styles.startBtnText}>🔄 BẮT ĐẦU TÌNH HUỐNG MỚI</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* POP-UP YÊU CẦU NHẬP ĐỊNH DANH SINH VIÊN / CẶP ĐẤU */}
      <Modal visible={showIdentityModal} transparent animationType="slide">
        <View style={styles.identityOverlay}>
          <View style={styles.identityBox}>
            <Text style={styles.identityTitle}>🎖 XÁC NHẬN NỘP BÀI LÊN BẢNG ĐIỂM</Text>
            <Text style={styles.identitySub}>
              {opponentType === 'pvp' 
                ? 'Nhập Tên Cặp đấu để Giáo viên ghi nhận điểm chung:' 
                : 'Nhập Mã Sinh Viên / Họ Tên để Giáo viên ghi nhận điểm:'}
            </Text>

            {opponentType === 'pvp' ? (
              <TextInput
                style={styles.identityInput}
                placeholder="Ví dụ: K18 - Tuấn & Lan"
                placeholderTextColor="#666688"
                value={pairNameInput}
                onChangeText={setPairNameInput}
              />
            ) : (
              <TextInput
                style={styles.identityInput}
                placeholder="Ví dụ: 210045 - Nguyễn Văn A"
                placeholderTextColor="#666688"
                value={studentNameInput}
                onChangeText={setStudentNameInput}
              />
            )}

            <TouchableOpacity style={styles.identityConfirmBtn} onPress={handleConfirmSubmissionWithIdentity}>
              <Text style={styles.identityConfirmText}>🚀 XÁC NHẬN GỬI LÊN BẢNG ĐIỂM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={micPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🎙 CẤP QUYỀN MICROPHONE!</Text>
            <Text style={styles.modalText}>Vui lòng bấm cho phép Micro trên trình duyệt để thu âm.</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setMicPermissionModal(false)}>
              <Text style={styles.modalCloseText}>ĐÃ HIỂU</Text>
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
  title: { color: '#FF007F', fontSize: 11, fontWeight: '900' },
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
  
  natureBadge: { backgroundColor: '#092B1E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', marginBottom: 8 },
  natureBadgeText: { color: '#39FF14', fontSize: 9.5, fontWeight: '900' },
  
  topicTitle: { color: '#00FFFF', fontSize: 13, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  promptContainer: { width: '100%', backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 8 },
  promptQuestionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  promptText: { color: '#FFF', fontSize: 12, fontWeight: '800', lineHeight: 18, marginBottom: 6 },
  translationText: { color: '#AAAABB', fontSize: 10, fontStyle: 'italic', marginBottom: 6 },
  freedomGuide: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', lineHeight: 14 },
  freedomGuideCenter: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },

  roleCardBox: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, width: '100%', marginTop: 6, borderWidth: 1, borderColor: '#00FFFF' },
  roleItem: { width: '100%' },
  roleTitleP1: { color: '#00FFFF', fontSize: 11, fontWeight: '900', marginBottom: 2 },
  roleTitleP2: { color: '#FF007F', fontSize: 11, fontWeight: '900', marginBottom: 2 },
  roleGuidelineText: { color: '#FFF', fontSize: 11, lineHeight: 16 },
  roleSubHint: { color: '#AAAABB', fontSize: 9.5, fontStyle: 'italic' },

  promptDisplayContainer: { width: '100%', marginBottom: 12 },
  searchingText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  refreshBtnDisabled: { opacity: 0.5 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#FF007F', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  battleHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10, alignItems: 'center' },
  opponentName: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  timerText: { color: '#39FF14', fontSize: 10, fontWeight: '900' },
  
  recordToggleBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordToggleBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  recordToggleText: { color: '#FFF', fontSize: 10.5, fontWeight: '900' },

  previewAudioBox: { width: '100%', backgroundColor: '#130628', padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#39FF14', marginBottom: 12 },
  previewAudioHeader: { marginBottom: 4 },
  previewAudioTitle: { color: '#39FF14', fontSize: 10, fontWeight: '900' },
  previewAudioSub: { color: '#8888AA', fontSize: 9, marginTop: 2 },

  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.2 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultTitle: { fontSize: 13, fontWeight: '900', marginBottom: 6, textAlign: 'center' },
  scoreText: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginBottom: 10 },
  audioPlayerSection: { width: '100%', backgroundColor: '#1A0B2E', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 12, alignItems: 'center' },
  audioSectionTitle: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  userTranscriptBox: { width: '100%', backgroundColor: '#1A0B2E', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  userTranscriptTitle: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  userTranscriptContent: { color: '#39FF14', fontSize: 10, fontWeight: 'bold', lineHeight: 15 },
  breakdownCard: { backgroundColor: '#120826', padding: 10, borderRadius: 10, width: '100%', marginBottom: 12, borderWidth: 1, borderColor: '#FF007F' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { color: '#AAAABB', fontSize: 9 },
  breakdownValue: { color: '#39FF14', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#FFF', fontSize: 10, textAlign: 'center', lineHeight: 15, marginBottom: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center' },
  modalTitle: { color: '#FF007F', fontSize: 12, fontWeight: '900', marginBottom: 10 },
  modalText: { color: '#FFF', fontSize: 10, textAlign: 'center', marginBottom: 15 },
  modalCloseBtn: { backgroundColor: '#00FFFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  modalCloseText: { color: '#000', fontSize: 9, fontWeight: '900' },
  identityOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  identityBox: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center' },
  identityTitle: { color: '#00FFFF', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  identitySub: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 15 },
  identityInput: { backgroundColor: '#130A2A', borderWidth: 1, borderColor: '#00FFFF', borderRadius: 8, padding: 12, color: '#FFF', width: '100%', fontSize: 12, marginBottom: 15 },
  identityConfirmBtn: { backgroundColor: '#39FF14', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center' },
  identityConfirmText: { color: '#000', fontSize: 10, fontWeight: '900' }
});