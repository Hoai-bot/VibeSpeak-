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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 🔊 DỪNG TOÀN BỘ ÂM THANH ĐANG PHÁT
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

  // 🔊 HÀM PHÁT ÂM MẪU CHUẨN ĐÃ ĐƯỢC BẢO VỆ 2 LỚP
  const playSampleAudio = (textToSpeak: string) => {
    if (!textToSpeak) return;
    stopAllAudio();
    setIsPlayingTTS(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const speakText = () => {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
          v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('US'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onstart = () => setIsPlayingTTS(true);
        utterance.onend = () => setIsPlayingTTS(false);
        utterance.onerror = () => tryAudioUrlFallback(textToSpeak);

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

    tryAudioUrlFallback(textToSpeak);
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

  // 🔄 HÀM ĐỔI BÀI TẬP NGẪU NHIÊN CHỐNG LẶP
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
    setIsRecording(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setResult(null);
    audioChunksRef.current = [];
  };

  // 🎙️ THU ÂM BÀI NÓI (ĐÃ CẤP QUYỀN ĐA TRÌNH DUYỆT TỰ ĐỘNG)
  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          alert("🔒 Trình duyệt của bạn không hỗ trợ Micro âm thanh!");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Tự động chọn MIME type phù hợp nhất với trình duyệt (Chrome/Safari/Firefox)
        let options = {};
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });

          if (blob.size > 2000) {
            setRecordedAudio(blob);
            setHasRecorded(true);
          } else {
            setRecordedAudio(null);
            setHasRecorded(false);
            alert("⚠️ Chưa ghi nhận âm thanh rõ ràng! Vui lòng bấm mic và đọc to lại.");
          }
          stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start(200);
        setIsRecording(true);
        setRecordedAudio(null);
        setHasRecorded(false);
      } catch (err) {
        console.error("Lỗi Microphone:", err);
        alert("🔒 Lỗi Micro: Vui lòng kiểm tra biểu tượng 🔒 hoặc 🎙️ trên thanh địa chỉ trình duyệt và cấp quyền 'Cho phép (Allow)' truy cập Microphone!");
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // ⚔️ NỘP BÀI CÓ KHÓA CHỐNG ĐIỂM ẢO
  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || recordedAudio.size <= 2000) {
      alert("🔒 Vui lòng bấm micro thu âm phát âm trước khi nộp bài!");
      return;
    }

    setIsAnalyzing(true);

    try {
      const promptTarget = `Practice Phrase: "${currentDrill?.contentEn || ''}". Focus area: ${currentDrill?.targetFocus || ''}`;
      const evalData = await evaluateSpeaking(recordedAudio, 'B2', undefined, promptTarget);

      if (!evalData.transcript || evalData.wordCount <= 2) {
        setResult({
          score: 0,
          isWin: false,
          transcript: "(Không nhận diện được giọng phát âm rõ ràng)",
          wordCount: evalData.wordCount || 0,
          pronunciation: 0,
          grammar: 0,
          vocabulary: 0,
          reflexes: 0,
          content: 0,
          fluency: 0,
          detailedFeedback: "❌ AI chỉ nhận diện được tiếng ồn. Vui lòng cất giọng đọc rõ ràng cặp từ/cụm từ mẫu!",
        });
        alert("🛡️ NỘP BÀI THẤT BẠI: Bạn chưa phát âm! Vui lòng bấm micro và đọc lại.");
      } else {
        setResult(evalData);
        if (evalData.isWin) {
          updateUserProgress(1, 30, true);
        }
      }
    } catch (err) {
      console.error("Lỗi chấm điểm Trạm 1:", err);
      alert("⚠️ Lỗi kết nối chấm điểm. Vui lòng thử nộp lại!");
    } finally {
      setIsAnalyzing(false);
      setRecordedAudio(null);
      setHasRecorded(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 1: PRONUNCIATION LAB</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* THANH CHỌN TẦNG / LOẠI BÀI TẬP */}
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

        {/* THẺ BÀI TẬP HIỆN TẠI */}
        {currentDrill && (
          <View style={styles.box} key={currentDrill.sessionKey}>
            <Text style={styles.boxTitle}>📌 {currentDrill.title.toUpperCase()}</Text>
            
            <Text style={styles.drillEn}>"{currentDrill.contentEn}"</Text>
            {currentDrill.contentVi && <Text style={styles.drillVi}>👉 {currentDrill.contentVi}</Text>}
            
            {currentDrill.phoneticSpelling && (
              <Text style={styles.phonetics}>🔊 IPA: {currentDrill.phoneticSpelling}</Text>
            )}
            
            <Text style={styles.targetFocus}>🎯 Trọng tâm: {currentDrill.targetFocus}</Text>

            {/* 🔊 NÚT PHÁT ÂM MẪU CHUẨN */}
            <TouchableOpacity 
              style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
              onPress={() => playSampleAudio(currentDrill.contentEn)}
            >
              <Text style={styles.ttsBtnText}>
                {isPlayingTTS ? '🔊 ĐANG PHÁT ÂM MẪU...' : '📢 NGHE PHÁT ÂM MẪU'}
              </Text>
            </TouchableOpacity>

            {/* NÚT LẤY BÀI KHÁC NGẪU NHIÊN */}
            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => handleLoadNewDrill(activeType)}
            >
              <Text style={styles.refreshBtnText}>🔄 THỬ THÁCH BÀI KHÁC</Text>
            </TouchableOpacity>

            {/* NÚT THU ÂM */}
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

            {/* NÚT NỘP BÀI */}
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

        {/* KẾT QUẢ CHẤM ĐIỂM */}
        {result && (
          <View style={[styles.box, { borderColor: result.isWin ? '#39FF14' : '#FF0055' }]}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🏆 PHÁT ÂM RẤT CHUẨN!' : '💀 CẦN LUYỆN TẬP THÊM'}
            </Text>
            <Text style={styles.scoreText}>⚡ Điểm phát âm: {result.score} / 100 ĐIỂM</Text>

            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 Âm AI nghe được thực tế:</Text>
              <Text style={styles.scriptContent}>"{result.transcript}"</Text>
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
  scriptBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10 },
  scriptLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginVertical: 4 },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16 }
});