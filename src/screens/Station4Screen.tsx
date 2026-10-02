// src/screens/Station4Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { 
  getInstantStation4Exercise, 
  generateStation4Exercise, 
  SpeakingExpressExercise 
} from '../services/arena/station4Service';
import { updateUserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function Station4Screen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [loading, setLoading] = useState<boolean>(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  
  const [exercise, setExercise] = useState<SpeakingExpressExercise | null>(null);
  const [battleState, setBattleState] = useState<'idle' | 'battling' | 'analyzing' | 'ended'>('idle');
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);

  const [result, setResult] = useState<AssessmentResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const requestIdRef = useRef<number>(0);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // 🧹 HÀM HỦY TOÀN BỘ ÂM THANH ĐANG PHÁT ĐỂ TRÁNH ĐỌC CHỒNG / ĐỌC CÂU CŨ
  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
  };

  // 🔊 GIỌNG ĐỌC TỰ NHIÊN CHUẨN 100% TIẾNG ANH (CHỈ ĐỌC PROMPT TIẾNG ANH)
  const playPromptTTS = (textToSpeak: string) => {
    if (!textToSpeak) return;

    // Dọn dẹp triệt để trước khi đọc câu mới
    stopAllAudio();

    try {
      setIsPlayingTTS(true);

      const encodedText = encodeURIComponent(textToSpeak);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;
      
      audio.onplay = () => setIsPlayingTTS(true);
      audio.onended = () => setIsPlayingTTS(false);
      audio.onerror = () => fallbackBrowserTTS(textToSpeak);

      audio.play().catch(() => fallbackBrowserTTS(textToSpeak));
    } catch (err) {
      fallbackBrowserTTS(textToSpeak);
    }
  };

  const fallbackBrowserTTS = (textToSpeak: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => 
        v.lang.includes('en') && (
          v.name.includes('Google') || 
          v.name.includes('Natural') || 
          v.name.includes('Samantha') || 
          v.name.includes('Daniel')
        )
      );

      if (premiumVoice) {
        utterance.voice = premiumVoice;
      }

      utterance.onstart = () => setIsPlayingTTS(true);
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // ✅ LUỒNG TẢI ĐỀ DỮ LIỆU CHUẨN ĐỒNG BỘ
  const loadExerciseData = async (level: string) => {
    const currentRequestId = ++requestIdRef.current;
    stopAllAudio();
    resetState();

    // 1. HIỂN THỊ ĐỀ LOCAL TỨC THÌ (0.01s)
    const instantData = getInstantStation4Exercise(level);
    setExercise(instantData);

    // 2. GỌI GROQ AI NGẦM VỚI KHỐI FINALLY TẮT LOADING TRIỆT ĐỂ
    setLoading(true);
    try {
      const aiData = await generateStation4Exercise(level);
      if (currentRequestId === requestIdRef.current && aiData) {
        setExercise(aiData);
      }
    } catch (err) {
      console.warn("Dùng đề Local dự phòng cho Trạm 4:", err);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  // 🎯 LỜI GIẢI CHO LỖI KHÔNG TRÙNG KHỚP: Chỉ phát âm tự động khi state `exercise` ĐÃ ĐƯỢC RENDER HOÀN TOÀN
  useEffect(() => {
    if (exercise && exercise.promptEn && battleState === 'idle') {
      const timer = setTimeout(() => {
        playPromptTTS(exercise.promptEn);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [exercise?.id]); // 👉 Mỗi khi bài tập đổi (thay đổi ID), tự động đọc đúng promptEn của bài đó

  useEffect(() => {
    loadExerciseData(cefrLevel);
    return () => {
      stopAllAudio();
    };
  }, [cefrLevel]);

  const resetState = () => {
    stopAllAudio();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setBattleState('idle');
    setIsRecording(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setResult(null);
    audioChunksRef.current = [];
  };

  const handleToggleRecord = async () => {
    stopAllAudio();

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
              setRecordedAudio(recordedBlob);
              setHasRecorded(true);
            } else {
              setRecordedAudio(null);
              setHasRecorded(false);
              alert("⚠️ Chưa ghi nhận giọng nói rõ ràng! Vui lòng bấm giữ nút và đưa ra phản hồi.");
            }
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start(200);
          setIsRecording(true);
          setBattleState('battling');
        } else {
          alert("Trình duyệt không hỗ trợ micro thu âm!");
        }
      } catch (err) {
        alert("🔒 Lỗi: Hãy cấp quyền Microphone trên trình duyệt!");
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || recordedAudio.size <= 8000) {
      alert("🔒 Vui lòng ghi âm phản hồi của bạn trước khi nộp bài!");
      return;
    }

    if (isRecording) setIsRecording(false);
    setBattleState('analyzing');

    const evalData = await evaluateSpeaking(recordedAudio, cefrLevel);
    setResult(evalData);

    setBattleState('ended');
    updateUserProgress(4, evalData.isWin ? 50 : 10, evalData.isWin);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 4: SPEAKING EXPRESS</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
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

        <View style={styles.box}>
          <Text style={styles.boxTitle}>📌 THỬ THÁCH PHẢN ỨNG NHANH [{cefrLevel}]</Text>
          
          {exercise ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.scenarioTitle}>{exercise.title}</Text>
              <Text style={styles.promptText}>🎯 Tình huống: "{exercise.promptEn}"</Text>
              
              {exercise.promptVi && (
                <Text style={styles.promptViText}>👉 Dịch: "{exercise.promptVi}"</Text>
              )}

              {/* 🎯 Nút bấm chủ động phát âm luôn lấy trực tiếp `exercise.promptEn` hiện tại trên UI */}
              <TouchableOpacity 
                style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
                onPress={() => playPromptTTS(exercise.promptEn)}
              >
                <Text style={styles.ttsBtnText}>
                  {isPlayingTTS ? '🔊 ĐANG PHÁT GIỌNG NÓI...' : '🔊 NGHE TÌNH HUỐNG (NATURAL VOICE)'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.requirementText}>
                ⚡ THỜI GIAN PHẢN XẠ: {exercise.timeLimitSeconds} GIÂY | TỪ KHÓA: {exercise.suggestedKeywords?.join(', ')}
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="small" color="#FF007F" style={{ marginVertical: 15 }} />
          )}

          <TouchableOpacity style={styles.refreshBtn} onPress={() => loadExerciseData(cefrLevel)} disabled={loading}>
            <Text style={styles.refreshBtnText}>
              {loading ? '🔄 ĐANG ĐỔI THỬ THÁCH...' : '🔄 ĐỔI THỬ THÁCH MỚI'}
            </Text>
          </TouchableOpacity>

          {battleState !== 'ended' && (
            <TouchableOpacity 
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
              onPress={handleToggleRecord}
            >
              <Text style={styles.recordBtnText}>
                {isRecording 
                  ? '🔴 ĐANG THU ÂM PHẢN HỒI... (BẤM ĐỂ DỪNG)' 
                  : hasRecorded 
                  ? '✅ ĐÃ CÓ BẢN THU (BẤM THU LẠI)' 
                  : '🎙 BẤM ĐỂ BẮT ĐẦU NÓI'}
              </Text>
            </TouchableOpacity>
          )}

          {battleState !== 'ended' && (
            <TouchableOpacity 
              style={[styles.submitBtn, (!hasRecorded || !recordedAudio) && styles.submitBtnDisabled]} 
              onPress={handleSubmitAnswer} 
              disabled={!hasRecorded || !recordedAudio}
            >
              <Text style={styles.submitBtnText}>
                {hasRecorded ? '⚡ NỘP BÀI & CHẤM ĐIỂM AI' : '🔒 BẮT BỘC THU ÂM TRƯỚC KHINỘP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {battleState === 'analyzing' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#39FF14" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>⚡ GROQ WHISPER AI ĐANG BÓC TÁCH GIỌNG NÓI & CHẤM 6 TIÊU CHÍ...</Text>
          </View>
        )}

        {battleState === 'ended' && result && (
          <View style={styles.box}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🎉 PHẢN HỒI XUẤT SẮC!' : '💀 PHẢN HỒI CHƯA ĐẠT YÊU CẦU'}
            </Text>
            <Text style={styles.scoreText}>⚡ TỔNG ĐIỂM TRẠM 4: {result.score} / 100 ĐIỂM</Text>

            {result.audioUrl && (
              <View style={styles.nativeAudioContainer}>
                <Text style={styles.nativeAudioLabel}>🎧 NGHE LẠI BẢN THU PHẢN HỒI CỦA BẠN:</Text>
                <audio controls src={result.audioUrl} style={{ width: '100%', marginTop: 6 }} />
              </View>
            )}

            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 BẢN DỊCH CHỮ PHẢN HỒI THỰC TẾ (SCRIPT):</Text>
              <Text style={styles.scriptContent}>"{result.transcript}"</Text>
              <Text style={styles.wordCountText}>📊 Số từ phát âm thực tế: {result.wordCount} từ</Text>
            </View>

            <Text style={styles.breakdownHeaderLabel}>📊 PHÂN TÍCH CHI TIẾT 6 TIÊU CHÍ:</Text>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>🗣️ 1. Phát âm:</Text><Text style={styles.breakdownValue}>{result.pronunciation}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>📚 2. Ngữ pháp:</Text><Text style={styles.breakdownValue}>{result.grammar}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>🔤 3. Từ vựng:</Text><Text style={styles.breakdownValue}>{result.vocabulary}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>⚡ 4. Phản xạ:</Text><Text style={styles.breakdownValue}>{result.reflexes}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>🎯 5. Nội dung:</Text><Text style={styles.breakdownValue}>{result.content}/100</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>🌊 6. Trôi chảy:</Text><Text style={styles.breakdownValue}>{result.fluency}/100</Text></View>
            </View>

            <Text style={styles.feedbackText}>{result.detailedFeedback}</Text>

            <TouchableOpacity style={styles.refreshBtn} onPress={() => loadExerciseData(cefrLevel)}>
              <Text style={styles.refreshBtnText}>🔄 THỬ BỐI CẢNH PHẢN HỒI MỚI</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 12 },
  scenarioTitle: { color: '#00FFFF', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  promptText: { color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 18, marginBottom: 8 },
  promptViText: { color: '#FFD700', fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },
  ttsBtn: { backgroundColor: '#1A0B2E', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 10, alignItems: 'center', width: '100%' },
  ttsBtnActive: { backgroundColor: '#00FFFF' },
  ttsBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  requirementText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  searchingText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  recordBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.2 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  scoreText: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 10 },
  nativeAudioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  nativeAudioContainer: { width: '100%', backgroundColor: '#1A0B2E', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 12, alignItems: 'center' },
  scriptBox: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', width: '100%', marginBottom: 12 },
  scriptLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginBottom: 6 },
  wordCountText: { color: '#39FF14', fontSize: 9, fontWeight: 'bold' },
  breakdownHeaderLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  breakdownCard: { backgroundColor: '#120826', padding: 12, borderRadius: 10, width: '100%', marginBottom: 12, borderWidth: 1, borderColor: '#FF007F' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#221133' },
  breakdownLabel: { color: '#AAAABB', fontSize: 10 },
  breakdownValue: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 15 }
});