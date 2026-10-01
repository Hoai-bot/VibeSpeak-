// src/screens/DrillArenaScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { 
  getNextTier1, 
  getNextTier2, 
  getNextTier3, 
  Tier1Pair, 
  Tier2Linking, 
  Tier3Twister 
} from '../services/arena/drillService';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { updateUserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function DrillArenaScreen({ onBack }: Props) {
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  
  // DỮ LIỆU BÀI TẬP TỪ DRILLSERVICE
  const [tier1Data, setTier1Data] = useState<Tier1Pair>(() => getNextTier1());
  const [tier2Data, setTier2Data] = useState<Tier2Linking>(() => getNextTier2());
  const [tier3Data, setTier3Data] = useState<Tier3Twister>(() => getNextTier3());
  
  // TRẠNG THÁI RECORDING & KẾT QUẢ
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 🔄 ĐỔI BÀI TẬP TỰ ĐỘNG KHÔNG LẶP
  const handleNextExercise = () => {
    resetState();
    if (tier === 1) {
      setTier1Data(getNextTier1(tier1Data?.id));
    } else if (tier === 2) {
      setTier2Data(getNextTier2(tier2Data?.id));
    } else {
      setTier3Data(getNextTier3(tier3Data?.id));
    }
  };

  const handleSelectTier = (selectedTier: 1 | 2 | 3) => {
    resetState();
    setTier(selectedTier);
  };

  const resetState = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);
    setIsPlayingTTS(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setResult(null);
    setIsAnalyzing(false);
    audioChunksRef.current = [];
  };

  // 🔊 PHÁT ÂM MẪU CHUẨN IPA QUA GOOGLE TTS Engine
  const handlePlaySampleAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    let textToSpeak = "";
    if (tier === 1) textToSpeak = tier1Data.ttsAudioText;
    else if (tier === 2) textToSpeak = tier2Data.ttsAudioText;
    else textToSpeak = tier3Data.ttsAudioText;

    try {
      setIsPlayingTTS(true);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

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
      utterance.rate = 0.88;

      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => 
        v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural'))
      );

      if (premiumVoice) utterance.voice = premiumVoice;

      utterance.onstart = () => setIsPlayingTTS(true);
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // 🎙 THU ÂM CÓ KIỂM TRA DUNG LƯỢNG NGHIÊM NGẶT (> 8000 BYTES)
  const handleToggleRecord = async () => {
    if (currentAudioRef.current) currentAudioRef.current.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    }

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
              alert("⚠️ Chưa ghi nhận giọng nói rõ ràng! Vui lòng bấm giữ nút và đọc rõ bài tập.");
            }
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start(200);
          setIsRecording(true);
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

  // 📊 NỘP BÀI VÀ CHẤM ĐIỂM CHÍNH XÁC VỚI TARGET TEXT
  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || recordedAudio.size <= 8000) {
      alert("🔒 Vui lòng thu âm trước khi nộp bài!");
      return;
    }

    if (isRecording) setIsRecording(false);
    setIsAnalyzing(true);

    // Xác định từ/câu mẫu để AI so sánh chính xác 100%
    let targetText = "";
    if (tier === 1) targetText = `${tier1Data.word1} ${tier1Data.word2}`;
    else if (tier === 2) targetText = tier2Data.phrase;
    else targetText = tier3Data.sentence;

    const evalData = await evaluateSpeaking(recordedAudio, cefrLevel, targetText);

    setResult(evalData);
    setIsAnalyzing(false);
    updateUserProgress(1, evalData.isWin ? 30 : 10, evalData.isWin);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 1: DRILL ARENA (LUYỆN PHẢN XẠ ÂM)</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {/* TẦNG TỰ CHỌN TIER */}
        <Text style={styles.sectionLabel}>CHỌN DẠNG BÀI DRILL:</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tierTab, tier === 1 && styles.tierTabActive]} onPress={() => handleSelectTier(1)}>
            <Text style={[styles.tierTabText, tier === 1 && styles.tierTextActive]}>TIER 1: MINIMAL PAIRS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tierTab, tier === 2 && styles.tierTabActive]} onPress={() => handleSelectTier(2)}>
            <Text style={[styles.tierTabText, tier === 2 && styles.tierTextActive]}>TIER 2: LINKING</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tierTab, tier === 3 && styles.tierTabActive]} onPress={() => handleSelectTier(3)}>
            <Text style={[styles.tierTabText, tier === 3 && styles.tierTextActive]}>TIER 3: TWISTER</Text>
          </TouchableOpacity>
        </View>

        {/* BÀI TẬP TẦNG 1 */}
        {tier === 1 && tier1Data && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>[ DRILL TIER 1 ]</Text>
            <Text style={styles.pairTitle}>{tier1Data.displayTitle}</Text>
            <Text style={styles.ipaText}>🔊 IPA: {tier1Data.ipa}</Text>
            <Text style={styles.meaningText}>💡 Nghĩa: {tier1Data.meaning}</Text>
            <Text style={styles.tipText}>📌 Mẹo âm: {tier1Data.tip}</Text>
          </View>
        )}

        {/* BÀI TẬP TẦNG 2 */}
        {tier === 2 && tier2Data && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>[ DRILL TIER 2: NỐI ÂM ]</Text>
            <Text style={styles.pairTitle}>"{tier2Data.phrase}"</Text>
            <Text style={styles.ipaText}>🔊 IPA Nối: {tier2Data.ipa}</Text>
            <Text style={styles.meaningText}>💡 Nghĩa: {tier2Data.meaning}</Text>
            <Text style={styles.tipText}>📌 Quy tắc: {tier2Data.linkingTip}</Text>
          </View>
        )}

        {/* BÀI TẬP TẦNG 3 */}
        {tier === 3 && tier3Data && (
          <View style={styles.box}>
            <Text style={styles.boxTitle}>[ DRILL TIER 3: TONGUE TWISTER ]</Text>
            <Text style={styles.pairTitle}>"{tier3Data.sentence}"</Text>
            <Text style={styles.ipaText}>🎯 Âm mục tiêu: {tier3Data.targetSound}</Text>
            <Text style={styles.tipText}>📌 Mẹo luyện: {tier3Data.tip}</Text>
          </View>
        )}

        {/* KHU VỰC THAO TÁC NÚT BẤM */}
        <View style={{ width: '100%', marginBottom: 15 }}>
          {/* NÚT NGHE MẪU AUDIO */}
          <TouchableOpacity 
            style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
            onPress={handlePlaySampleAudio}
          >
            <Text style={styles.ttsBtnText}>
              {isPlayingTTS ? '🔊 ĐANG PHÁT GIỌNG ĐỌC MẪU...' : '🔊 NGHE GIỌNG ĐỌC MẪU CHUẨN AI'}
            </Text>
          </TouchableOpacity>

          {/* NÚT ĐỔI BÀI TẬP KHÔNG LẶP */}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextExercise}>
            <Text style={styles.nextBtnText}>🔄 ĐỔI BÀI TẬP MỚI</Text>
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
                ? '✅ ĐÃ CÓ BẢN THU (BẤM THU LẠI)' 
                : `🎙 BẤM ĐỂ THU ÂM TIER ${tier}`}
            </Text>
          </TouchableOpacity>

          {/* NÚT NỘP BÀI */}
          <TouchableOpacity 
            style={[styles.submitBtn, (!hasRecorded || !recordedAudio) && styles.submitBtnDisabled]} 
            onPress={handleSubmitAnswer}
            disabled={!hasRecorded || !recordedAudio}
          >
            <Text style={styles.submitBtnText}>
              {hasRecorded ? '⚡ NỘP BÀI & CHẤM ĐIỂM DRILL' : '🔒 HÃY THU ÂM TRƯỚC KHINỘP'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI DỊCH & PHÂN TÍCH */}
        {isAnalyzing && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#39FF14" style={{ marginBottom: 15 }} />
            <Text style={styles.searchingText}>⚡ GROQ WHISPER AI ĐANG CHUYỂN GIỌNG NÓI THÀNH CHỮ & CHẤM MẠNH...</Text>
          </View>
        )}

        {/* KẾT QUẢ MÀN HÌNH CHẤM ĐIỂM */}
        {result && !isAnalyzing && (
          <View style={styles.box}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🎉 BẠN ĐÃ PHÁT ÂM CHUẨN!' : '💀 CHƯA ĐẠT YÊU CẦU PHÁT ÂM'}
            </Text>
            <Text style={styles.scoreText}>⚡ ĐIỂM ĐỘ CHÍNH XÁC: {result.score} / 100 ĐIỂM</Text>

            {result.audioUrl && (
              <View style={styles.nativeAudioContainer}>
                <Text style={styles.nativeAudioLabel}>🎧 NGHE LẠI GIỌNG BẠN PHÁT ÂM:</Text>
                <audio controls src={result.audioUrl} style={{ width: '100%', marginTop: 6 }} />
              </View>
            )}

            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 SCRIPT BÓC TÁCH THỰC TẾ TỪ GIỌNG NÓI:</Text>
              <Text style={styles.scriptContent}>"{result.transcript}"</Text>
            </View>

            <Text style={styles.feedbackText}>{result.detailedFeedback}</Text>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNextExercise}>
              <Text style={styles.nextBtnText}>🔄 THỬ BÀI TẬP TIẾP THEO</Text>
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
  title: { color: '#FF007F', fontSize: 11, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  tierTab: { backgroundColor: '#0D0620', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '32%', alignItems: 'center' },
  tierTabActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  tierTabText: { color: '#8888AA', fontSize: 8, fontWeight: '900' },
  tierTextActive: { color: '#000' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 15 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  pairTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  ipaText: { color: '#00FFFF', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  meaningText: { color: '#AAAABB', fontSize: 11, marginBottom: 4 },
  tipText: { color: '#FF007F', fontSize: 10, fontStyle: 'italic', textAlign: 'center' },
  ttsBtn: { backgroundColor: '#1A0B2E', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 10 },
  ttsBtnActive: { backgroundColor: '#00FFFF' },
  ttsBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  nextBtn: { backgroundColor: '#1A0B2E', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  nextBtnText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  recordBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.2 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  searchingText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  resultTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  scoreText: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 10 },
  nativeAudioContainer: { width: '100%', backgroundColor: '#1A0B2E', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 12, alignItems: 'center' },
  nativeAudioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scriptBox: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', width: '100%', marginBottom: 12 },
  scriptLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic' },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 15 }
});