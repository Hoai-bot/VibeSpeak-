// src/screens/Station1Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getRandomStation1Drill, DrillType } from '../services/drills/station1Service';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { updateUserProgress } from '../services/userService';

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
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  // Lưu văn bản bóc tách thực tế từ giọng nói
  const [capturedText, setCapturedText] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Lấy user ID an toàn
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

  // Dừng toàn bộ âm thanh đang phát
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

  // Hàm phát âm mẫu chuẩn
  const playSampleAudio = (textToSpeak: string) => {
    if (!textToSpeak) return;
    stopAllAudio();
    setIsPlayingTTS(true);

    const cleanSpeechText = textToSpeak.replace(/\//g, '.').trim();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const speakText = () => {
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.lang = 'en-US';
        utterance.rate = 0.75;

        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
          v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('US'))
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
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setResult(null);
    setCapturedText('');
    audioChunksRef.current = [];
  };

  // Thu âm và nhận diện chữ phát âm thực tế
  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          alert("🔒 Trình duyệt của bạn không hỗ trợ Micro âm thanh!");
          return;
        }

        // Khởi tạo Web Speech Recognition nếu trình duyệt hỗ trợ
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              currentTranscript += event.results[i][0].transcript;
            }
            if (currentTranscript.trim()) {
              setCapturedText(currentTranscript.trim());
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        mediaStreamRef.current = stream;

        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }
        }

        const options = mimeType ? { mimeType } : undefined;
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const finalMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: finalMime });

          if (blob.size > 800) {
            setRecordedAudio(blob);
            setHasRecorded(true);
          } else {
            setRecordedAudio(null);
            setHasRecorded(false);
            alert("⚠️ Bản thu âm quá ngắn! Vui lòng bấm mic và phát âm rõ ràng lại.");
          }

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
        };

        mediaRecorder.start(100);
        setIsRecording(true);
        setRecordedAudio(null);
        setHasRecorded(false);
        setCapturedText('');
      } catch (err) {
        console.error("Lỗi Microphone:", err);
        alert("🔒 Lỗi Micro: Vui lòng kiểm tra và bật cấp quyền Microphone!");
      }
    } else {
      setIsRecording(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Nộp bài chấm điểm AI
  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || recordedAudio.size <= 800) {
      alert("🔒 Vui lòng bấm micro thu âm phát âm trước khi nộp bài!");
      return;
    }

    setIsAnalyzing(true);

    try {
      const promptTarget = (currentDrill?.contentEn || '').trim();
      // 🎯 Đã cập nhật truyền 'STATION_1' vào tham số stationType
      const evalData = await evaluateSpeaking(
        recordedAudio, 
        undefined, 
        'STATION_1', 
        promptTarget, 
        userId, 
        capturedText
      );

      setResult(evalData);
      
      const isPass = (evalData.score >= 70) || evalData.isWin;
      if (isPass) {
        updateUserProgress(1, 30, true);
      }
    } catch (err) {
      console.error("Lỗi chấm điểm Trạm 1:", err);
      alert("⚠️ Lỗi kết nối chấm điểm. Vui lòng thử nộp lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isPassed = (result?.score ?? 0) >= 70 || result?.isWin;

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

            <TouchableOpacity 
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
              onPress={handleToggleRecord}
            >
              <Text style={styles.recordBtnText}>
                {isRecording 
                  ? '🔴 ĐANG THU ÂM... (BẤM ĐỂ DỪNG)' 
                  : hasRecorded 
                  ? '✅ ĐÃ CÓ BẢN THU (BẤM ĐỂ THU LẠI)' 
                  : '🎙 BẤM ĐỂ BẮT ĐẦU PHÁT ÂM'}
              </Text>
            </TouchableOpacity>

            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity 
                style={[styles.submitBtn, (!hasRecorded || isRecording) && styles.submitBtnDisabled]} 
                onPress={handleSubmitAnswer}
                disabled={!hasRecorded || isRecording}
              >
                <Text style={styles.submitBtnText}>⚡ NỘP BÀI & CHẤM PHÁT ÂM AI</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {result && (
          <View style={[styles.box, { borderColor: isPassed ? '#39FF14' : '#FF0055' }]}>
            <Text style={[styles.resultTitle, { color: isPassed ? '#39FF14' : '#FF0055' }]}>
              {isPassed ? '🏆 PHÁT ÂM RẤT CHUẨN!' : '💀 CẦN LUYỆN TẬP THÊM'}
            </Text>
            <Text style={styles.scoreText}>⚡ Điểm phát âm: {result.score} / 100 ĐIỂM</Text>

            {result.audioUrl ? (
              <View style={styles.audioPlayerBox}>
                <Text style={styles.audioLabel}>🎧 Nghe lại bài phát âm của bạn:</Text>
                {React.createElement('audio', {
                  controls: true,
                  src: result.audioUrl,
                  style: { width: '100%', marginTop: 6, height: 36 }
                })}
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
  scoreText: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 10 },
  audioPlayerBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10, borderWidth: 1, borderColor: '#00FFFF' },
  audioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scriptBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10 },
  scriptLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginVertical: 4 },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16 }
});