// src/screens/Station1Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getRandomStation1Drill, DrillType } from '../services/drills/station1Service';
import { evaluateSpeaking, AssessmentResult, generateWordDiff } from '../services/arena/assessmentService';
import { updateUserProgress } from '../services/userService';
import { supabase } from '../utils/supabase'; // 💡 IMPORT TRỰC TIẾP TỪ UTILS
import AudioWaveVisualizer from '../components/AudioWaveVisualizer'; // 🌊 IMPORT SÓNG ÂM THỜI GIAN THỰC

interface Props {
  onBack: () => void;
}

export default function Station1Screen({ onBack }: Props) {
  const [activeType, setActiveType] = useState<DrillType>('minimal_pairs');
  const [currentDrill, setCurrentDrill] = useState<any>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);

  // Quản lý ghi âm & trạng thái chấm điểm
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // 🎯 QUẢN LÝ TIẾN TRÌNH NÂNG ĐIỂM (SCORE COMPARISON & BEST SCORE)
  const [bestScore, setBestScore] = useState<number>(0);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  
  // Quản lý luồng âm thanh thời gian thực cho Visualizer
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  // Lưu văn bản bóc tách thực tế từ giọng nói
  const [capturedText, setCapturedText] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // 🛡️ HÀM BÁO LỖI AN TOÀN TRÁNH NGHỄN TOUCH RESPONDER TRÊN WEB
  const safeAlert = (msg: string) => {
    setTimeout(() => {
      alert(msg);
    }, 50);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (supabase && supabase.auth) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) setUserId(data.user.id);
        }
      } catch (e) {
        console.warn("Không lấy được user ID:", e);
      }
    };
    fetchUser();
  }, []);

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

  const playSampleAudio = (textToSpeak: string) => {
    if (!textToSpeak) return;
    stopAllAudio();
    setIsPlayingTTS(true);

    let cleanSpeechText = textToSpeak.replace(/\//g, ', ').trim();

    const ttsWordFixes: Record<string, string> = {
      'come in': 'cum, in',
      'come': 'cum',
      'some': 'sum'
    };

    const lowerText = cleanSpeechText.toLowerCase();
    if (ttsWordFixes[lowerText]) {
      cleanSpeechText = ttsWordFixes[lowerText];
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const speakText = () => {
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.lang = 'en-US';
        utterance.rate = 0.7;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
          v => v.lang === 'en-US' && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onstart = () => setIsPlayingTTS(true);
        utterance.onend = () => setIsPlayingTTS(false);
        utterance.onerror = () => tryAudioUrlFallback(cleanSpeechText);

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        speakText();
        return;
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          speakText();
          window.speechSynthesis.onvoiceschanged = null;
        };
        setTimeout(() => speakText(), 150);
        return;
      }
    }

    tryAudioUrlFallback(cleanSpeechText);
  };

  const tryAudioUrlFallback = (textToSpeak: string) => {
    try {
      const encodedText = encodeURIComponent(textToSpeak);
      const ttsUrl = `https://dict.youdao.com/dictvoice?audio=${encodedText}&type=2`;

      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => setIsPlayingTTS(true);
      audio.onended = () => setIsPlayingTTS(false);
      audio.onerror = () => setIsPlayingTTS(false);

      audio.play().catch(() => setIsPlayingTTS(false));
    } catch {
      setIsPlayingTTS(false);
    }
  };

  const handleLoadNewDrill = (type: DrillType) => {
    stopAllAudio();
    resetSession();
    setBestScore(0);
    setPreviousScore(null);
    setAttemptCount(0);
    const newDrill = getRandomStation1Drill(type);
    setCurrentDrill(newDrill);
  };

  useEffect(() => {
    handleLoadNewDrill(activeType);
    return () => stopAllAudio();
  }, [activeType]);

  const resetSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.abort(); 
        recognitionRef.current = null;
      } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setActiveStream(null);
    setIsRecording(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setIsProcessingAudio(false);
    setResult(null);
    setCapturedText('');
    audioChunksRef.current = [];
  };

  // 🎯 THU ÂM CHUẨN XÁC: RESET SẠCH FILE CŨ, GIỮ NGUYÊN KẾT QUẢ ĐỂ HỌC VIÊN ĐỐI CHIẾU
  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          safeAlert("🔒 Trình duyệt chưa cấp quyền Micro!");
          return;
        }

        // Lưu điểm hiện tại làm previousScore trước khi bắt đầu lượt thử mới
        if (result && result.score > 0) {
          setPreviousScore(result.score);
        }

        setRecordedAudio(null);
        setHasRecorded(false);
        setIsProcessingAudio(false);
        setCapturedText('');
        audioChunksRef.current = [];

        if (recognitionRef.current) {
          try { 
            recognitionRef.current.abort(); 
            recognitionRef.current = null;
          } catch (e) {}
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
                current += event.results[i][0].transcript + ' ';
              }
              if (current.trim()) setCapturedText(current.trim());
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {
            console.warn("SpeechRecognition Bypass:", e);
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        mediaStreamRef.current = stream;
        setActiveStream(stream);

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
          setIsProcessingAudio(false);

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
          setActiveStream(null);
        };

        recordingStartTimeRef.current = Date.now();
        recorder.start(150);
        setIsRecording(true);
      } catch (err) {
        console.error("Lỗi Micro:", err);
        safeAlert("🔒 Vui lòng cho phép quyền 'Microphone' trên trình duyệt để ghi âm!");
      }
    } else {
      // BẤM DỪNG THU ÂM
      const durationSeconds = (Date.now() - recordingStartTimeRef.current) / 1000;
      setIsRecording(false);
      setIsProcessingAudio(true);
      setActiveStream(null);

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      // 🛡️ HẠ NGƯỠNG AN TOÀN CHO TỪ ĐƠN XUỐNG 0.6 GIÂY (PHÙ HỢP MINIMAL PAIRS NGẮN)
      if (durationSeconds < 0.6) {
        setIsProcessingAudio(false);
        setHasRecorded(false);
        setRecordedAudio(null);
        safeAlert("⚠️ Bản thu quá ngắn (dưới 0.6 giây)! Hãy giữ micro và đọc rõ từ mục tiêu rồi mới bấm dừng.");
      }
    }
  };

  // NỘP BÀI CHẤM ĐIỂM
  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || isProcessingAudio) {
      safeAlert("🔒 Vui lòng phát âm từ mục tiêu vào micro trước khi nộp bài!");
      return;
    }

    // 🛡️ HẠ NGƯỠNG DUNG LƯỢNG AN TOÀN XUỐNG 1500 BYTES CHO SAFARI/OPUS
    if (recordedAudio.size < 1500 && !capturedText.trim()) {
      setResult({
        score: 0,
        isWin: false,
        transcript: "(Chưa phát hiện giọng nói)",
        detailedFeedback: "❌ Micro chưa thu được tiếng hoặc âm lượng quá nhỏ! Vui lòng bấm 'Phát âm lại' và nói to, rõ ràng hơn."
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const promptTarget = (currentDrill?.contentEn || '').trim();
      const evalData = await evaluateSpeaking(
        recordedAudio, 
        undefined, 
        'STATION_1', 
        promptTarget, 
        userId, 
        capturedText
      );

      // Cập nhật Best Score và Attempt Count
      setAttemptCount((prev) => prev + 1);
      setBestScore((prev) => Math.max(prev, evalData.score));
      setResult(evalData);
      
      const isPass = (evalData.score >= 70) || evalData.isWin;
      if (isPass) {
        updateUserProgress(1, 30, true);
      }
    } catch (err) {
      console.error("Lỗi chấm điểm Trạm 1:", err);
      safeAlert("⚠️ Lỗi kết nối chấm điểm. Vui lòng thử nộp lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isPassed = (result?.score ?? 0) >= 70 || result?.isWin;
  const scoreDiff = (previousScore !== null && result) ? result.score - previousScore : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 1: PRONUNCIATION LAB</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'minimal_pairs' && styles.tabBtnActive]}
            onPress={() => setActiveType('minimal_pairs')}
          >
            <Text style={[styles.tabText, activeType === 'minimal_pairs' && styles.tabTextActive]}>
              👯 Minimal Pairs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'linking_sounds' && styles.tabBtnActive]}
            onPress={() => setActiveType('linking_sounds')}
          >
            <Text style={[styles.tabText, activeType === 'linking_sounds' && styles.tabTextActive]}>
              🔗 Linking Sounds
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'tongue_twisters' && styles.tabBtnActive]}
            onPress={() => setActiveType('tongue_twisters')}
          >
            <Text style={[styles.tabText, activeType === 'tongue_twisters' && styles.tabTextActive]}>
              🐍 Tongue Twisters
            </Text>
          </TouchableOpacity>
        </View>

        {currentDrill && (
          <View style={styles.box} key={currentDrill.sessionKey}>
            <Text style={styles.boxTitle}>📌 {currentDrill.title.toUpperCase()}</Text>
            
            <Text style={styles.drillEn}>"{currentDrill.contentEn}"</Text>
            {currentDrill.contentVi && <Text style={styles.drillVi}>👉 {currentDrill.contentVi}</Text>}
            
            {currentDrill.phoneticSpelling && (
              <Text style={styles.phonetics}>🔊 IPA: {currentDrill.phoneticSpelling}</Text>
            )}
            
            <Text style={styles.targetFocus}>🎯 Trọng tâm: {currentDrill.targetFocus}</Text>

            <TouchableOpacity 
              style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
              onPress={() => playSampleAudio(currentDrill.contentEn)}
            >
              <Text style={styles.ttsBtnText}>
                {isPlayingTTS ? '🔊 ĐANG PHÁT ÂM MẪU...' : '📢 NGHE PHÁT ÂM MẪU'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => handleLoadNewDrill(activeType)}
            >
              <Text style={styles.refreshBtnText}>🔄 THỬ THÁCH BÀI KHÁC</Text>
            </TouchableOpacity>

            {/* 🌊 DẢI SÓNG ÂM THỜI GIAN THỰC */}
            <AudioWaveVisualizer stream={activeStream} isRecording={isRecording} barColor="#FF007F" />

            <TouchableOpacity 
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
              onPress={handleToggleRecord}
            >
              <Text style={styles.recordBtnText}>
                {isRecording 
                  ? '🔴 ĐANG THU ÂM... (BẤM ĐỂ DỪNG)' 
                  : isProcessingAudio
                  ? '⏳ ĐANG LƯU BẢN THU MỚI...'
                  : hasRecorded 
                  ? '🔄 BẤM ĐỂ PHÁT ÂM LẠI (NÂNG ĐIỂM)' 
                  : '🎙 BẤM ĐỂ BẮT ĐẦU PHÁT ÂM'}
              </Text>
            </TouchableOpacity>

            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity 
                style={[
                  styles.submitBtn, 
                  (!hasRecorded || isRecording || isProcessingAudio) && styles.submitBtnDisabled
                ]} 
                onPress={handleSubmitAnswer}
                disabled={!hasRecorded || isRecording || isProcessingAudio}
              >
                <Text style={styles.submitBtnText}>
                  {attemptCount > 0 ? '⚡ NỘP BÀI ĐỂ NÂNG ĐIỂM' : '⚡ NỘP BÀI & CHẤM PHÁT ÂM AI'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {result && (
          <View style={[styles.box, { borderColor: isPassed ? '#39FF14' : '#FF0055' }]}>
            <Text style={[styles.resultTitle, { color: isPassed ? '#39FF14' : '#FF0055' }]}>
              {isPassed ? '🏆 PHÁT ÂM RẤT CHUẨN!' : '💀 CẦN LUYỆN TẬP THÊM'}
            </Text>
            
            <Text style={styles.scoreText}>⚡ Điểm lần này: {result.score} / 100 ĐIỂM</Text>

            {/* 🎯 HUY HIỆU SO SÁNH TIẾN BỘ & ĐIỂM CAO NHẤT */}
            <View style={styles.scoreComparisonRow}>
              {bestScore > 0 && (
                <View style={styles.bestScoreBadge}>
                  <Text style={styles.bestScoreText}>👑 Kỷ lục bài này: {bestScore}đ</Text>
                </View>
              )}
              {scoreDiff !== null && (
                <View style={[styles.deltaBadge, { backgroundColor: scoreDiff >= 0 ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 0, 85, 0.2)' }]}>
                  <Text style={[styles.deltaText, { color: scoreDiff >= 0 ? '#39FF14' : '#FF0055' }]}>
                    {scoreDiff >= 0 ? `▲ Tăng +${scoreDiff}đ` : `▼ Giảm ${scoreDiff}đ`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.wordHighlightBox}>
              <Text style={styles.wordHighlightTitle}>🎯 CHI TIẾT TỪNG TỪ MỤC TIÊU:</Text>
              <View style={styles.wordRow}>
                {generateWordDiff(currentDrill?.contentEn || '', result.transcript || '').map((item, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.wordBadge, 
                      item.status === 'correct' ? styles.correctBadge : styles.incorrectBadge
                    ]}
                    onPress={() => playSampleAudio(item.word)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.wordBadgeText, item.status === 'correct' ? styles.correctText : styles.incorrectText]}>
                      {item.word} {item.status === 'correct' ? '✓' : '✗'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {result.audioUrl ? (
              <View style={styles.audioPlayerBox}>
                <Text style={styles.audioLabel}>🎧 Nghe lại bài phát âm của bạn:</Text>
                <View 
                  style={{ width: '100%', marginTop: 6 }} 
                  // @ts-ignore
                  onStartShouldSetResponder={() => false}
                  onMoveShouldSetResponder={() => false}
                >
                  {React.createElement('audio', {
                    controls: true,
                    playsInline: true,
                    src: result.audioUrl,
                    style: { width: '100%', height: 36, touchAction: 'manipulation' }
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 Âm AI nghe được thực tế:</Text>
              <Text style={styles.scriptContent}>"{result.transcript || '(Không nghe rõ từ)'}"</Text>
            </View>

            <Text style={styles.feedbackText}>{result.detailedFeedback}</Text>
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
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  tabBtn: { flex: 1, backgroundColor: '#0D0620', paddingVertical: 10, marginHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  tabText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  tabTextActive: { color: '#FFF' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 10 },
  drillEn: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  drillVi: { color: '#FFD700', fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  phonetics: { color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  targetFocus: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 12 },
  ttsBtn: { backgroundColor: '#1A0B2E', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 10 },
  ttsBtnActive: { backgroundColor: '#00FFFF' },
  ttsBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 10 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordBtnActive: { backgroundColor: '#FF0055' },
  recordBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.2 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  scoreText: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  scoreComparisonRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  bestScoreBadge: { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderWidth: 1, borderColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bestScoreText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  deltaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  deltaText: { fontSize: 10, fontWeight: '900' },
  wordHighlightBox: { backgroundColor: '#120826', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', marginVertical: 8 },
  wordHighlightTitle: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  correctBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', borderColor: '#39FF14' },
  incorrectBadge: { backgroundColor: 'rgba(255, 0, 85, 0.15)', borderColor: '#FF0055' },
  wordBadgeText: { fontSize: 11, fontWeight: 'bold' },
  correctText: { color: '#39FF14' },
  incorrectText: { color: '#FF0055' },
  audioPlayerBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10, borderWidth: 1, borderColor: '#00FFFF' },
  audioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scriptBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10 },
  scriptLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginVertical: 4 },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16 }
});