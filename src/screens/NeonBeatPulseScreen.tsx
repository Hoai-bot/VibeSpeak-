import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { generateDynamicTopic, transcribeAndGradeAudio, GeneratedDrill } from '../services/groqClient';

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (word: string) => void; // Callback chuyển màn hình sang Oasis khi gãy combo
}

export function NeonBeatPulseScreen({ onBack, onNavigateToOasis }: Props) {
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  
  const [currentDrill, setCurrentDrill] = useState<GeneratedDrill>({
    text: "Fan van",
    meaning: "Cái quạt và xe tải nhỏ",
    phonetics: "/fæn væn/",
    tip: "Răng trên chạm môi dưới. /f/ thổi hơi không rung (Fan), /v/ rung thanh quản (Van)",
    bpm: 90,
    focus: "Minimal Pair: /f/ vs /v/"
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [combo, setCombo] = useState<number>(0);
  const [result, setResult] = useState<{ text: string; score: number; rating: string } | null>(null);

  // 🎯 BỔ SUNG STATE THEO DÕI CHUỖI VÀ MODAL CỨU HỘ OASIS
  const [missCount, setMissCount] = useState<number>(0);
  const [showOasisModal, setShowOasisModal] = useState<boolean>(false);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // 🔊 HÀM PHÁT ÂM MẪU CHUẨN
  const playSampleVoice = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const words = text.split(/\s+/);
      const voices = window.speechSynthesis.getVoices();
      
      const highQualityVoice = voices.find(
        (v) =>
          v.lang.includes('en') &&
          (v.name.includes('Google US English') ||
           v.name.includes('Microsoft Jenny Online') ||
           v.name.includes('Microsoft Guy Online') ||
           v.name.includes('Natural') ||
           v.name.includes('Neural'))
      ) || voices.find((v) => v.lang === 'en-US') || voices.find((v) => v.lang.startsWith('en'));

      words.forEach((word) => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.75;
        utterance.pitch = 1.0;

        if (highQualityVoice) {
          utterance.voice = highQualityVoice;
        }

        window.speechSynthesis.speak(utterance);
      });
    } else {
      alert('Trình duyệt không hỗ trợ phát âm thanh mẫu!');
    }
  };

  const loadNewDrill = async (selectedTier: 1 | 2 | 3) => {
    setIsLoading(true);
    setResult(null);
    try {
      const drill = await generateDynamicTopic(selectedTier);
      setCurrentDrill(drill);
    } catch (error) {
      console.error("Lỗi nạp bài tập:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTierChange = (newTier: 1 | 2 | 3) => {
    setTier(newTier);
    loadNewDrill(newTier);
  };

  // 🎙️ THU ÂM NÂNG CẤP
  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert('Trình duyệt không hỗ trợ micro!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,   // Khử tiếng vang
          noiseSuppression: true,   // Lọc tiếng ồn nền
          autoGainControl: true     // Tự động cân bằng độ to âm thanh
        } 
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      alert('Không thể truy cập Micro!');
    }
  };

  const stopRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    setIsRecording(false);
    setIsAnalyzing(true);

    const processAudio = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        resolve(audioBlob);
      };
      mediaRecorder.stop();
    });

    try {
      if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
      const audioBlob = await processAudio;

      const res = await transcribeAndGradeAudio(
        audioBlob, 
        currentDrill.text,
        currentDrill.phonetics,
        currentDrill.tip
      );
      
      let rating = "MISS";
      const isPassed = res.score >= 80;

      // 🎯 CẬP NHẬT LOGIC CHUỖI THUA & KÍCH HOẠT POPUP CỨU HỘ
      if (res.score >= 85) {
        rating = "PERFECT ⚡";
        setCombo((prev) => prev + 1);
        setMissCount(0); // Reset chuỗi thua khi phát âm chuẩn
      } else if (res.score >= 60) {
        rating = "GREAT 👍";
        setCombo((prev) => prev + 1);
        setMissCount(0); // Reset chuỗi thua
      } else {
        rating = "MISS ❌";
        setCombo(0);

        // 🎯 TỰ ĐỘNG BẬT POPUP CỨU HỘ KHI BỊ MISS 3 LẦN LIÊN TIẾP
        setMissCount((prev) => {
          const nextMiss = prev + 1;
          if (nextMiss >= 3) {
            setShowOasisModal(true);
          }
          return nextMiss;
        });
      }

      setResult({ text: res.text, score: res.score, rating });

      if (isPassed) {
        setTimeout(() => {
          loadNewDrill(tier);
        }, 3500);
      }

    } catch (error) {
      alert('Lỗi phân tích tiếng nói!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 EXIT</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚡ NEON BEAT PULSE</Text>
        <Text style={styles.comboText}>COMBO: {combo}🔥</Text>
      </View>

      {/* CHỌN TẦNG (TIER) */}
      <View style={styles.tierGroup}>
        <TouchableOpacity 
          style={[styles.tierBtn, tier === 1 && styles.activeTier]} 
          onPress={() => handleTierChange(1)}
        >
          <Text style={[styles.tierText, tier === 1 && styles.activeTierText]}>TẦNG 1 (PAIRS)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tierBtn, tier === 2 && styles.activeTier]} 
          onPress={() => handleTierChange(2)}
        >
          <Text style={[styles.tierText, tier === 2 && styles.activeTierText]}>TẦNG 2 (LINKING)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tierBtn, tier === 3 && styles.activeTier]} 
          onPress={() => handleTierChange(3)}
        >
          <Text style={[styles.tierText, tier === 3 && styles.activeTierText]}>TẦNG 3 (SPEED)</Text>
        </TouchableOpacity>
      </View>

      {/* KHUNG ĐỀ BÀI */}
      <View style={styles.drillCard}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : (
          <>
            <Text style={styles.focusTag}>[ {currentDrill.focus} ]</Text>
            <Text style={styles.targetText}>{currentDrill.text}</Text>
            <Text style={styles.phoneticText}>{currentDrill.phonetics}</Text>
            <Text style={styles.meaningText}>🇻🇳 {currentDrill.meaning}</Text>

            <TouchableOpacity 
              style={styles.sampleVoiceBtn} 
              onPress={() => playSampleVoice(currentDrill.text)}
            >
              <Text style={styles.sampleVoiceText}>🔊 NGHE CÂU MẪU CHUẨN</Text>
            </TouchableOpacity>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 Mẹo: {currentDrill.tip}</Text>
              <Text style={styles.micNoteText}>
                🎙️ Đặt micro cách miệng 10-15cm và luyện tập trong không gian ít tiếng ồn để AI thu âm chính xác nhất.
              </Text>
            </View>

            <TouchableOpacity style={styles.newDrillBtn} onPress={() => loadNewDrill(tier)}>
              <Text style={styles.newDrillText}>⚡ AI CÂU MỚI</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* NÚT THU ÂM & PHÂN TÍCH */}
      <View style={styles.actionBox}>
        {isAnalyzing ? (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#00FFFF" />
            <Text style={styles.analyzingText}>> ĐANG PHÂN TÍCH ÂM ĐIỆU AI...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordingActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹️ DỪNG & CHẤM ĐIỂM' : '🎙️ PHÁT ÂM NGAY'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* KẾT QUẢ HIỂN THỊ */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.ratingText}>{result.rating}</Text>
          <Text style={styles.scoreText}>SCORE: {result.score} / 100</Text>
          <Text style={styles.userSpeechText}>AI Nghe Được: "{result.text}"</Text>
        </View>
      )}

      {/* 🌴 MODAL POPUP CỨU HỘ OASIS KHI MISS 3 LẦN LIÊN TIẾP */}
      <Modal visible={showOasisModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTag}>🚨 CỨU HỘ KHẨN CẤP</Text>
            <Text style={styles.modalTitle}>🌴 TRẠM OASIS ĐÃ SẴN SÀNG</Text>
            <Text style={styles.modalDesc}>
              Bạn đã bị MISS 3 lần liên tiếp ở từ "{currentDrill.text}". Đừng căng thẳng! Hãy sang Trạm Oasis để thư giãn và luyện chậm khẩu hình nhé.
            </Text>

            <TouchableOpacity
              style={styles.modalOasisBtn}
              onPress={() => {
                setShowOasisModal(false);
                setMissCount(0); // Reset lại đếm
                if (onNavigateToOasis) {
                  onNavigateToOasis(currentDrill.text);
                }
              }}
            >
              <Text style={styles.modalOasisBtnText}>🌴 CHUYỂN SANG OASIS CỨU HỘ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowOasisModal(false);
                setMissCount(0); // Reset đếm để tiếp tục thử lại tại chỗ
              }}
            >
              <Text style={styles.modalCancelText}>Ở lại luyện tiếp tại trạm này</Text>
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
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FFD700' },
  backText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  headerTitle: { color: '#FFD700', fontSize: 16, fontWeight: '900', fontFamily: 'Courier New' },
  comboText: { color: '#FF0055', fontSize: 13, fontWeight: 'bold', fontFamily: 'Courier New' },
  tierGroup: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  tierBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center', marginHorizontal: 2 },
  activeTier: { backgroundColor: '#1A103C', borderColor: '#FFD700' },
  tierText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold', fontFamily: 'Courier New' },
  activeTierText: { color: '#FFD700' },
  drillCard: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FFD700', alignItems: 'center', marginBottom: 20 },
  focusTag: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 8 },
  targetText: { color: '#FFF', fontSize: 26, fontWeight: '900', fontFamily: 'Courier New', textAlign: 'center', marginBottom: 4 },
  phoneticText: { color: '#FF007F', fontSize: 16, fontFamily: 'Courier New', marginBottom: 8 },
  meaningText: { color: '#AAAABB', fontSize: 13, fontFamily: 'Courier New', marginBottom: 12 },
  sampleVoiceBtn: { backgroundColor: '#110022', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 15 },
  sampleVoiceText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  tipBox: { backgroundColor: '#05020D', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#221144', width: '100%', marginBottom: 15 },
  tipText: { color: '#39FF14', fontSize: 11, fontFamily: 'Courier New', marginBottom: 4 },
  micNoteText: { color: '#8888AA', fontSize: 10, fontFamily: 'Courier New', fontStyle: 'italic' },
  newDrillBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#221144', borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
  newDrillText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New' },
  actionBox: { width: '100%', alignItems: 'center', marginBottom: 20 },
  recordBtn: { backgroundColor: '#39FF14', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  recordingActive: { backgroundColor: '#FF0055' },
  recordText: { color: '#000', fontSize: 15, fontWeight: '900', fontFamily: 'Courier New' },
  analyzingText: { color: '#00FFFF', marginTop: 10, fontSize: 12, fontFamily: 'Courier New' },
  resultCard: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', alignItems: 'center' },
  ratingText: { color: '#FFD700', fontSize: 18, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 4 },
  scoreText: { color: '#39FF14', fontSize: 14, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 4 },
  userSpeechText: { color: '#AAAABB', fontSize: 12, fontFamily: 'Courier New' },

  // STYLES DÀNH RIÊNG CHO MODAL POPUP OASIS
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#052C30', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#00FFCC', width: '100%', alignItems: 'center' },
  modalTag: { color: '#FF0055', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginBottom: 6 },
  modalTitle: { color: '#00FFCC', fontSize: 18, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 12, textAlign: 'center' },
  modalDesc: { color: '#A0E0E0', fontSize: 12, fontFamily: 'Courier New', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  modalOasisBtn: { backgroundColor: '#00FFCC', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalOasisBtnText: { color: '#000', fontSize: 13, fontWeight: '900', fontFamily: 'Courier New' },
  modalCancelBtn: { paddingVertical: 10 },
  modalCancelText: { color: '#8888AA', fontSize: 11, fontFamily: 'Courier New', textDecorationLine: 'underline' }
});

export default NeonBeatPulseScreen;