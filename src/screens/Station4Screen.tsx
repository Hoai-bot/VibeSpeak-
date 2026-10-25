// src/screens/Station4Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { evaluateSpeaking, AssessmentResult, analyzeSpokenTranscript } from '../services/arena/assessmentService';
import { 
  getInstantStation4Exercise, 
  generateStation4Exercise, 
  clearStation4History,
  SpeakingExpressExercise 
} from '../services/arena/station4Service';
import { updateUserProgress, saveSubmissionToCloud } from '../services/userService';
import { harvestWeakWords, saveWeakPoint } from '../services/weakPointsService';
import WeakPointsScreen from './WeakPointsScreen';

interface Props {
  onBack: () => void;
}

export default function Station4Screen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [loading, setLoading] = useState<boolean>(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  const [showWeakPoints, setShowWeakPoints] = useState<boolean>(false);

  const [exercise, setExercise] = useState<SpeakingExpressExercise | null>(null);
  const [battleState, setBattleState] = useState<'idle' | 'battling' | 'analyzing' | 'ended'>('idle');
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Tính toán chỉ số WPM (Tốc độ trôi chảy)
  const [speakingDurationSeconds, setSpeakingDurationSeconds] = useState<number>(0);
  const recordingStartTimeRef = useRef<number>(0);

  // Lưu lời thoại nhận diện thực tế
  const [capturedText, setCapturedText] = useState<string>('');

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabaseModule = await import('../lib/supabaseClient').catch(() => null)
                             || await import('../lib/supabase').catch(() => null)
                             || await import('@/lib/supabaseClient').catch(() => null);
                             
        if (supabaseModule) {
          const supabase = supabaseModule.supabase || supabaseModule.default;
          if (supabase && supabase.auth) {
            const { data } = await supabase.auth.getUser();
            if (data?.user) setUserId(data.user.id);
          }
        }
      } catch (e) {
        console.warn("Không lấy được user ID:", e);
      }
    };
    fetchUser();
  }, []);

  const getResultHeader = (score: number) => {
    if (score >= 85) return { title: '🏆 PHẢN HỒI XUẤT SẮC!', color: '#39FF14' };
    if (score >= 70) return { title: '👍 PHẢN HỒI ĐẠT YÊU CẦU (KHÁ)', color: '#00FFFF' };
    if (score >= 50) return { title: '⚠️ PHẢN HỒI TRUNG BÌNH (CẦN CẢI THIỆN)', color: '#FFD700' };
    return { title: '💀 PHẢN HỒI CHƯA ĐẠT', color: '#FF0055' };
  };

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

  const playPromptTTS = (textToSpeak: string) => {
    if (!textToSpeak) return;
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

      utterance.onstart = () => setIsPlayingTTS(true);
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const resetState = () => {
    stopAllAudio();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setBattleState('idle');
    setIsRecording(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setRecordedAudioUrl(null);
    setCapturedText('');
    setResult(null);
    audioChunksRef.current = [];
  };

  const loadExerciseData = async (level: string) => {
    const currentRequestId = ++requestIdRef.current;
    stopAllAudio();
    resetState();

    try {
      const instantData = getInstantStation4Exercise(level);
      if (instantData) {
        setExercise(instantData);
      }
    } catch (err) {
      console.warn("Lỗi nạp Flash Data Trạm 4:", err);
    }

    setLoading(true);
    try {
      const aiData = await generateStation4Exercise(level);
      if (currentRequestId === requestIdRef.current && aiData && aiData.promptEn) {
        setExercise(aiData);
      }
    } catch (err) {
      console.warn("Dùng Flash Data cho Trạm 4:", err);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleLevelChange = (newLevel: string) => {
    if (newLevel === cefrLevel) return;
    clearStation4History();
    setCefrLevel(newLevel);
  };

  useEffect(() => {
    loadExerciseData(cefrLevel);
    return () => {
      stopAllAudio();
    };
  }, [cefrLevel]);

  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          alert("🔒 Trình duyệt chưa cấp quyền Micro!");
          return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
              let current = '';
              for (let i = 0; i < event.results.length; ++i) {
                current += event.results[i][0].transcript;
              }
              if (current.trim()) setCapturedText(current.trim());
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {
            console.warn("SpeechRecognition Android Bypass:", e);
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        let chosenMime = '';
        if (typeof MediaRecorder !== 'undefined') {
          const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/aac',
            'audio/ogg'
          ];
          for (const t of types) {
            if (MediaRecorder.isTypeSupported(t)) {
              chosenMime = t;
              break;
            }
          }
        }

        const options = chosenMime ? { mimeType: chosenMime } : undefined;
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const mimeUsed = recorder.mimeType || chosenMime || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeUsed });

          setRecordedAudio(blob);
          setHasRecorded(true);

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
        };

        recordingStartTimeRef.current = Date.now();
        recorder.start(200);
        setIsRecording(true);
        setHasRecorded(false);
        setBattleState('battling');
        setCapturedText('');
      } catch (err) {
        alert("🔒 Vui lòng kiểm tra biểu tượng 🔒 trên thanh địa chỉ trình duyệt Android/iOS và cho phép 'Microphone'!");
      }
    } else {
      setIsRecording(false);
      const durationSec = Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000));
      setSpeakingDurationSeconds(durationSec);

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio) {
      alert("🔒 Vui lòng ghi âm phản hồi của bạn trước khi nộp bài!");
      return;
    }

    if (isRecording) setIsRecording(false);

    let audioBlobForUpload = recordedAudio;
    if (typeof window !== 'undefined' && window.URL) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      setRecordedAudioUrl(audioUrl);
    }

    setBattleState('analyzing');

    try {
      const targetPrompt = (exercise?.promptEn || 'General speaking challenge').trim();
      
      const evalData = await evaluateSpeaking(
        recordedAudio, 
        cefrLevel, 
        'STATION_4', 
        targetPrompt, 
        userId, 
        capturedText
      );

      setResult(evalData);
      updateUserProgress(4, evalData.isWin ? 50 : 10, evalData.isWin);

      // 🎯 TỰ ĐỘNG THU THẬP TỪ YẾU VÀO WEAK-POINT VAULT (SPACED REPETITION)
      if (evalData.transcript) {
        const spokenAnalysis = analyzeSpokenTranscript(evalData.transcript);
        harvestWeakWords(spokenAnalysis, targetPrompt);
      }

      if (evalData.score < 60) {
        saveWeakPoint('station4', targetPrompt, evalData.score);
      }

      // 🎯 LƯU BÀI NỘP LÊN SUPABASE CLOUD & KÍCH HOẠT CHUỖI STREAK
      await saveSubmissionToCloud({
        studentName: 'Chiến Binh Express',
        pairName: 'Speaking Express',
        className: 'TRẠM 4: EXPRESS',
        score: evalData.score,
        mode: 'SOLO',
        cefrLevel: cefrLevel,
        transcript: evalData.transcript,
        feedback: `[EXPRESS ${cefrLevel}]: Tốc độ phản hồi đạt ${evalData.score}/100đ. Nhận xét: ${evalData.detailedFeedback}`,
        timestamp: new Date().toLocaleTimeString('vi-VN')
      }, audioBlobForUpload);

    } catch (err) {
      console.error("Lỗi chấm điểm Trạm 4:", err);
      alert("⚠️ Lỗi kết nối chấm điểm. Vui lòng thử nộp lại!");
    } finally {
      setBattleState('ended');
      setRecordedAudio(null);
      setHasRecorded(false);
    }
  };

  // Tính WPM dựa trên số từ nói được và thời lượng ghi âm
  const calculateWPM = (text: string, durationSec: number): number => {
    if (!text || durationSec <= 0) return 0;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.round((wordCount / durationSec) * 60);
  };

  const wpmValue = result?.transcript ? calculateWPM(result.transcript, speakingDurationSeconds) : 0;

  if (showWeakPoints) {
    return (
      <WeakPointsScreen 
        onBack={() => setShowWeakPoints(false)} 
        onSelectPractice={(promptText) => {
          setShowWeakPoints(false);
          if (exercise) {
            setExercise({
              ...exercise,
              promptEn: promptText,
              title: "Ôn Luyện Cụm Yếu",
            });
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>🎯 TRẠM 4: SPEAKING EXPRESS</Text>

        <TouchableOpacity onPress={() => setShowWeakPoints(true)} style={styles.weakBtn}>
          <Text style={styles.weakBtnText}>🎯 YẾU</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <Text style={styles.sectionLabel}>CHỌN LEVEL CẤP ĐỘ:</Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} 
              onPress={() => handleLevelChange(lvl)}
            >
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>📌 THỬ THÁCH PHẢN ỨNG NHANH [{cefrLevel}]</Text>
          
          {exercise ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.scenarioTitle}>{exercise.title || `Thử thách [${cefrLevel}]`}</Text>
              <Text style={styles.promptText}>🎯 Tình huống: "{exercise.promptEn || 'No prompt available'}"</Text>
              
              {exercise.promptVi && (
                <Text style={styles.promptViText}>👉 Dịch: "{exercise.promptVi}"</Text>
              )}

              <TouchableOpacity 
                style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
                onPress={() => exercise.promptEn && playPromptTTS(exercise.promptEn)}
              >
                <Text style={styles.ttsBtnText}>
                  {isPlayingTTS ? '🔊 ĐANG PHÁT GIỌNG NÓI...' : '🔊 NGHE TÌNH HUỐNG (NATURAL VOICE)'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.requirementText}>
                ⚡ THỜI GIAN PHẢN XẠ: {exercise.timeLimitSeconds || 15} GIÂY | TỪ KHÓA: {exercise.suggestedKeywords?.join(', ') || 'Chưa có từ khóa'}
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
                {hasRecorded ? '⚡ NỘP BÀI & CHẤM ĐIỂM AI' : '🔒 BẮT BUỘC THU ÂM TRƯỚC KHI NỘP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {battleState === 'analyzing' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#39FF14" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>⚡ AI ĐANG BÓC TÁCH GIỌNG NÓI & PHÂN TÍCH PHẢN ỨNG...</Text>
          </View>
        )}

        {battleState === 'ended' && result && (
          <View style={styles.box}>
            <Text style={[styles.resultTitle, { color: getResultHeader(result.score).color }]}>
              {getResultHeader(result.score).title}
            </Text>
            <Text style={styles.scoreText}>⚡ TỔNG ĐIỂM TRẠM 4: {result.score} / 100 ĐIỂM</Text>

            {/* CHỈ SỐ TỐC ĐỘ NÓI (WPM) & HIGHLIGHT LỜI THOẠI */}
            <View style={styles.wpmBox}>
              <Text style={styles.wpmTitle}>⚡ TỐC ĐỘ TRÔI CHẢY (FLUENCY): {wpmValue} WPM</Text>
              <Text style={styles.wpmDesc}>
                {wpmValue >= 110 
                  ? '🚀 Phản xạ rất trôi chảy & tự nhiên!' 
                  : wpmValue >= 75 
                  ? '👍 Tốc độ đạt yêu cầu đàm thoại.' 
                  : '💡 Tốc độ hơi chậm, hãy tăng độ phản xạ hơn nhé!'}
              </Text>
            </View>

            {result.transcript ? (
              <View style={styles.wordHighlightBox}>
                <Text style={styles.wordHighlightTitle}>🎙 CÁC TỪ AI GHI NHẬN TỪ PHẢN HỒI NÓI:</Text>
                <View style={styles.wordRow}>
                  {analyzeSpokenTranscript(result.transcript).map((item, idx) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.wordBadge, 
                        item.isConfident ? styles.correctBadge : styles.warningBadge
                      ]}
                    >
                      <Text style={[styles.wordBadgeText, item.isConfident ? styles.correctText : styles.warningText]}>
                        {item.word} {item.isConfident ? '✓' : '⚠️'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {(recordedAudioUrl || result.audioUrl) && (
              <View style={styles.nativeAudioContainer}>
                <Text style={styles.nativeAudioLabel}>🎧 NGHE LẠI BẢN THU PHẢN HỒI CỦA BẠN:</Text>
                {React.createElement('audio', {
                  controls: true,
                  src: result.audioUrl || recordedAudioUrl,
                  style: { width: '100%', marginTop: 6, height: 36 }
                })}
              </View>
            )}

            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 ÂM AI NGHE ĐƯỢC THỰC TẾ:</Text>
              <Text style={styles.scriptContent}>"{result.transcript || '(Không nghe rõ từ)'}"</Text>
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
  weakBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#1A0B2E', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  weakBtnText: { color: '#FF007F', fontSize: 10, fontWeight: '900' },
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
  wpmBox: { backgroundColor: '#130A2A', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', marginBottom: 10, alignItems: 'center' },
  wpmTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900' },
  wpmDesc: { color: '#AAAABB', fontSize: 9, marginTop: 3 },
  wordHighlightBox: { backgroundColor: '#120826', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', marginBottom: 10 },
  wordHighlightTitle: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  correctBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', borderColor: '#39FF14' },
  warningBadge: { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderColor: '#FFD700' },
  wordBadgeText: { fontSize: 10, fontWeight: 'bold' },
  correctText: { color: '#39FF14' },
  warningText: { color: '#FFD700' },
  nativeAudioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  nativeAudioContainer: { width: '100%', backgroundColor: '#1A0B2E', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 12, alignItems: 'center' },
  scriptBox: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', width: '100%', marginBottom: 12 },
  scriptLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginBottom: 6 },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 15 }
});