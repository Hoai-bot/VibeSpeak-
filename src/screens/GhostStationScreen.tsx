// src/screens/GhostStationScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { transcribeAndGradeAudio } from '../services/groqClient';
import { generateWordDiff } from '../services/arena/assessmentService';
import { saveSubmissionToCloud } from '../services/userService';
import { harvestWeakWords } from '../services/weakPointsService';
import { getOptimizedRecorderConfig, executeWithRetry } from '../utils/networkAudioHelper';

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (ghostSentence: string) => void;
}

const GHOST_SENTENCES = [
  "Whispers in the dark connected speech.",
  "What do you want to do tonight?",
  "She sells sea shells by the sea shore.",
  "I have got an apple and an orange.",
  "Could you tell me how to get to the station?",
  "It is not about how hard you hit, it is about how hard you can get hit."
];

function GhostStationScreen({ onBack, onNavigateToOasis }: Props) {
  const [ghostSentence, setGhostSentence] = useState<string>(GHOST_SENTENCES[0]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzingStatus, setAnalyzingStatus] = useState<string>('🤖 AI ĐANG PHÂN TÍCH GIỌNG NÓI...');
  const [score, setScore] = useState<number | null>(null);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);

  // STATE CỨU HỘ OASIS TRẠM BÓNG MA
  const [ghostMissCount, setGhostMissCount] = useState<number>(0);
  const [showOasisModal, setShowOasisModal] = useState<boolean>(false);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 🔊 PHÁT ÂM MẪU BÓNG MA (SHADOWING PROMPT)
  const playGhostAudio = (textToSpeak: string) => {
    if (!textToSpeak) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Tốc độ tự nhiên vừa phải
      utterance.pitch = 0.9;

      utterance.onstart = () => setIsPlayingTTS(true);
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNextSentence = () => {
    const nextIdx = (GHOST_SENTENCES.indexOf(ghostSentence) + 1) % GHOST_SENTENCES.length;
    setGhostSentence(GHOST_SENTENCES[nextIdx]);
    setScore(null);
    setSpokenTranscript('');
  };

  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert("🔒 Trình duyệt chưa cấp quyền Micro!");
        return;
      }

      // Khử tiếng vọng và tạp âm môi trường
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      mediaStreamRef.current = stream;

      // Cấu hình MediaRecorder tối ưu 32 kbps và codec Opus
      const { options } = getOptimizedRecorderConfig();
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setScore(null);
      setSpokenTranscript('');
    } catch (err) {
      alert('🔒 Lỗi: Vui lòng bật cấp quyền Micro trên thanh địa chỉ trình duyệt!');
    }
  };

  const stopRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    setIsRecording(false);
    setIsAnalyzing(true);
    setAnalyzingStatus('🤖 AI ĐANG PHÂN TÍCH GIỌNG NÓI...');

    const processAudio = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const mimeUsed = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeUsed });
        resolve(audioBlob);
      };
      mediaRecorder.stop();
    });

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t: any) => t.stop());
        mediaStreamRef.current = null;
      }

      const audioBlob = await processAudio;

      // 🎯 TỰ ĐỘNG RETRY NẾU API GROQ BỊ DROP PACKET HOẶC RATE-LIMIT
      const res = await executeWithRetry(
        async () => {
          return await transcribeAndGradeAudio(audioBlob, ghostSentence);
        },
        {
          maxRetries: 3,
          timeoutMs: 14000,
          onRetry: (attempt) => {
            setAnalyzingStatus(`⚠️ MẠNG YẾU, ĐANG THỬ KẾT NỐI LẠI (${attempt}/3)...`);
          }
        }
      );
      
      const calculatedScore = Number(res.score) || 0;
      const recognizedText = res.transcript || '';
      
      setScore(calculatedScore);
      setSpokenTranscript(recognizedText);

      // 🎯 TỰ ĐỘNG THU THẬP TỪ BỊ LỆCH ÂM / RỚT NHỊP VÀO WEAK-POINT VAULT
      const diffResults = generateWordDiff(ghostSentence, recognizedText);
      const weakItemsForVault = diffResults.map((item) => ({
        word: item.word,
        isConfident: item.status === 'correct'
      }));
      harvestWeakWords(weakItemsForVault, ghostSentence);

      // 🎯 ĐỒNG BỘ LƯU LÊN SUPABASE VỚI CƠ CHẾ RETRY
      await executeWithRetry(
        async () => {
          await saveSubmissionToCloud({
            studentName: 'Chiến Binh Shadow',
            pairName: 'Ghost Shadowing',
            className: 'TRẠM 3: GHOST',
            score: calculatedScore,
            mode: 'SHADOWING',
            cefrLevel: 'B1',
            transcript: recognizedText,
            feedback: `[SHADOWING]: Bài đọc đuổi câu "${ghostSentence}" đạt ${calculatedScore}/100đ`,
            timestamp: new Date().toLocaleTimeString('vi-VN')
          }, audioBlob);
        },
        { maxRetries: 2, timeoutMs: 10000 }
      );

      // KÍCH HOẠT POPUP CỨU HỘ KHI ĐIỂM < 50 TRONG 2 LẦN LIÊN TIẾP
      if (calculatedScore < 50) {
        setGhostMissCount((prev) => {
          const next = prev + 1;
          if (next >= 2) setShowOasisModal(true);
          return next;
        });
      } else {
        setGhostMissCount(0);
      }
    } catch (e: any) {
      alert(`⚠️ Lỗi phân tích: ${e.message || 'Mạng yếu, vui lòng bấm thu âm lại!'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 EXIT</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👻 TRẠM 3: GHOST STATION</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <View style={styles.card}>
          <Text style={styles.tag}>[ SHADOWING ECHO MODE ]</Text>
          <Text style={styles.sentenceText}>"{ghostSentence}"</Text>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity 
              style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
              onPress={() => playGhostAudio(ghostSentence)}
            >
              <Text style={styles.ttsBtnText}>{isPlayingTTS ? '🔊 ĐANG PHÁT MẪU...' : '📢 NGHE BÓNG MA ĐỌC MẪU'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshBtn} onPress={handleNextSentence}>
              <Text style={styles.refreshBtnText}>🔄 ĐỔI CÂU KHÁC</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
          >
            <Text style={styles.recordText}>
              {isAnalyzing 
                ? analyzingStatus 
                : isRecording 
                ? '⏹️ DỪNG THU ÂM & CHẤM ĐIỂM' 
                : '🎙️ BẮT ĐẦU ĐỌC ĐUỔI (SHADOWING)'}
            </Text>
          </TouchableOpacity>

          {isAnalyzing && <ActivityIndicator size="small" color="#00FFFF" style={{ marginTop: 15 }} />}

          {score !== null && (
            <View style={styles.resultBox}>
              <Text style={[styles.scoreText, score < 60 && { color: '#FF0055' }]}>
                SCORE: {score} / 100 ĐIỂM
              </Text>

              {/* 🎯 HIGHLIGHT TỪ THEO KỊP VÀ TỪ BỊ RỚT LẠI */}
              <View style={styles.wordHighlightBox}>
                <Text style={styles.wordHighlightTitle}>🎯 KẾT QUẢ ĐỌC ĐUỔI TỪNG TỪ:</Text>
                <View style={styles.wordRow}>
                  {generateWordDiff(ghostSentence, spokenTranscript).map((item, idx) => (
                    <View 
                      key={idx} 
                      style={[
                        styles.wordBadge, 
                        item.status === 'correct' ? styles.correctBadge : styles.incorrectBadge
                      ]}
                    >
                      <Text style={[styles.wordBadgeText, item.status === 'correct' ? styles.correctText : styles.incorrectText]}>
                        {item.word} {item.status === 'correct' ? '✓' : '✗'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={styles.transcriptNotice}>
                💬 AI nghe được: "{spokenTranscript || '(Chưa rõ âm)'}"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 🌴 MODAL CỨU HỘ OASIS TRẠM BÓNG MA */}
      <Modal visible={showOasisModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTag}>🚨 CỨU HỘ NGỮ ĐIỆU BÓNG MA</Text>
            <Text style={styles.modalTitle}>🌴 OASIS: TẬP NỐI ÂM CHẬM</Text>
            <Text style={styles.modalDesc}>
              Tốc độ của Bóng Ma quá nhanh? Hãy sang Trạm Oasis để AI hướng dẫn phân tích ngữ điệu và nối âm chậm nhé!
            </Text>

            <TouchableOpacity
              style={styles.modalOasisBtn}
              onPress={() => {
                setShowOasisModal(false);
                setGhostMissCount(0);
                if (onNavigateToOasis) onNavigateToOasis(`Ghost Shadowing: ${ghostSentence}`);
              }}
            >
              <Text style={styles.modalOasisBtnText}>🌴 CHUYỂN SANG OASIS CỨU HỘ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowOasisModal(false);
                setGhostMissCount(0);
              }}
            >
              <Text style={styles.modalCancelText}>Ở lại tiếp tục đấu Bóng Ma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold' },
  headerTitle: { color: '#00FFFF', fontSize: 14, fontWeight: '900' },
  card: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', alignItems: 'center', width: '100%' },
  tag: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
  sentenceText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, lineHeight: 22 },
  actionBtnRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 15 },
  ttsBtn: { flex: 1.2, backgroundColor: '#1A0B2E', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', alignItems: 'center' },
  ttsBtnActive: { backgroundColor: '#00FFFF' },
  ttsBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  refreshBtn: { flex: 0.8, backgroundColor: '#1A0B2E', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  refreshBtnText: { color: '#AAAABB', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#00FFFF', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  recordBtnActive: { backgroundColor: '#FF0055' },
  recordText: { color: '#000', fontWeight: '900', fontSize: 11 },
  resultBox: { width: '100%', alignItems: 'center', marginTop: 15 },
  scoreText: { color: '#39FF14', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  wordHighlightBox: { backgroundColor: '#120826', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', marginBottom: 10 },
  wordHighlightTitle: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  correctBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', borderColor: '#39FF14' },
  incorrectBadge: { backgroundColor: 'rgba(255, 0, 85, 0.15)', borderColor: '#FF0055' },
  wordBadgeText: { fontSize: 10, fontWeight: 'bold' },
  correctText: { color: '#39FF14' },
  incorrectText: { color: '#FF0055' },
  transcriptNotice: { color: '#AAAABB', fontSize: 10, fontStyle: 'italic', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#052C30', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#00FFCC', width: '100%', alignItems: 'center' },
  modalTag: { color: '#FF0055', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  modalTitle: { color: '#00FFCC', fontSize: 18, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  modalDesc: { color: '#A0E0E0', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  modalOasisBtn: { backgroundColor: '#00FFCC', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalOasisBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  modalCancelBtn: { paddingVertical: 10 },
  modalCancelText: { color: '#8888AA', fontSize: 11, textDecorationLine: 'underline' }
});

export default GhostStationScreen;