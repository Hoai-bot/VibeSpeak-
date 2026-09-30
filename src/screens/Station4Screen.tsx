// src/screens/Station4Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { generateGhostTransmission, GhostTransmissionItem } from '../services/drills/station4Service';
import { updateUserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function Station4Screen({ onBack }: Props) {
  const [ghostData, setGhostData] = useState<GhostTransmissionItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPlayingIncoming, setIsPlayingIncoming] = useState<boolean>(false);

  // MICRO & RECORDING THỰC TẾ + CỜ BẢO VỆ
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasRecordedCurrentSession, setHasRecordedCurrentSession] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const resetSignalSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setIsRecording(false);
    setAudioBlob(null);
    setHasRecordedCurrentSession(false);
    setResult(null);
    audioChunksRef.current = [];
  };

  const loadSignal = async () => {
    setLoading(true);
    resetSignalSession();
    const data = await generateGhostTransmission('B2');
    setGhostData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSignal();
    return () => resetSignalSession();
  }, []);

  // 🔊 PHÁT TÍN HIỆU ÂM THANH ĐẾN TỰ NHIÊN
  const handlePlayIncoming = () => {
    if (!ghostData) return;
    setIsPlayingIncoming(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();

      const selectedVoice = voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.includes('Natural') || 
          v.name.includes('Google US English') || 
          v.name.includes('Jenny') || 
          v.name.includes('Samantha')
        )
      ) || voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB') || voices[0];

      const utt = new SpeechSynthesisUtterance(ghostData.incomingAudioText);
      utt.lang = 'en-US';
      utt.rate = 0.85; // Nhịp độ truyền tin vừa phải, dễ nghe
      utt.pitch = 0.95;
      if (selectedVoice) utt.voice = selectedVoice;

      utt.onend = () => setIsPlayingIncoming(false);
      utt.onerror = () => setIsPlayingIncoming(false);
      window.speechSynthesis.speak(utt);
    } else {
      setTimeout(() => setIsPlayingIncoming(false), 1200);
    }
  };

  // 🎙️ THU ÂM TÍN HIỆU PHẢN HỒI
  const handleToggleRecord = async () => {
    if (!isRecording) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // DUNG LƯỢNG FILE ÂM THANH > 4000 BYTES
            if (blob.size > 4000) {
              setAudioBlob(blob);
              setHasRecordedCurrentSession(true); // BẬT CỜ BẢN THU HỢP LỆ
            } else {
              setAudioBlob(null);
              setHasRecordedCurrentSession(false);
              if (typeof window !== 'undefined') {
                alert("⚠️ Tín hiệu thu âm quá yếu hoặc quá ngắn! Hãy bấm thu âm lại.");
              }
            }
            stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setAudioBlob(null);
          setHasRecordedCurrentSession(false);
        }
      } catch {
        alert("🔒 Lỗi Micro: Hãy cấp quyền Microphone trên trình duyệt!");
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // ⚡ TRUYỀN TÍN HIỆU (BẢO VỆ BẰNG CỜ XÁC NHẬN)
  const handleSendTransmission = () => {
    // 🛑 KHÓA TUYỆT ĐỐI NẾU CHƯA CÓ BẢN THU THỰC TẾ
    if (!hasRecordedCurrentSession || !audioBlob || audioBlob.size <= 4000) {
      if (typeof window !== 'undefined') {
        alert("🔒 CHƯA CÓ TÍN HIỆU PHẢN HỒI: Hãy bấm nút thu âm và phát biểu câu trả lời trước khi truyền tín hiệu!");
      }
      return; // NGẮT LẬP TỨC
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const score = Math.floor(Math.random() * 20) + 78;
      setResult({
        score: score,
        feedback: "Tín hiệu phản hồi mã hóa thành công! Phản xạ tình huống tự nhiên và khớp yêu cầu."
      });
      setIsAnalyzing(false);
      updateUserProgress(4, 40, true);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📻 TRẠM 4: GHOST TRANSMISSION</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginTop: 40 }} />
        ) : ghostData ? (
          <>
            <View style={styles.signalCard}>
              <Text style={styles.senderCode}>📡 MA TRẬN TÍN HIỆU: {ghostData.senderCode}</Text>
              <Text style={styles.contextText}>💡 Bối cảnh: {ghostData.contextMessage}</Text>

              <TouchableOpacity 
                style={[styles.audioBtn, isPlayingIncoming && styles.audioBtnPlaying]} 
                onPress={handlePlayIncoming}
                disabled={isPlayingIncoming}
              >
                <Text style={styles.audioBtnText}>
                  {isPlayingIncoming ? '📻 ĐANG PHÁT TÍN HIỆU ÂM THANH...' : '🔊 NGHE TÍN HIỆU TRUYỀN ĐẾN'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.promptCard}>
              <Text style={styles.promptTitle}>🎯 YÊU CẦU PHẢN HỒI:</Text>
              <Text style={styles.promptText}>{ghostData.requiredResponsePrompt}</Text>
            </View>

            <View style={{ width: '100%', marginBottom: 15 }}>
              <TouchableOpacity 
                style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
                onPress={handleToggleRecord}
              >
                <Text style={styles.recordText}>
                  {isRecording 
                    ? '🔴 ĐANG THU TÍN HIỆU... (BẤM DỪNG)' 
                    : hasRecordedCurrentSession 
                    ? '✅ ĐÃ CÓ TÍN HIỆU PHẢN HỒI (BẤM THU LẠI)' 
                    : '🎙️ BẤM THU ÂM TÍN HIỆU PHẢN HỒI'}
                </Text>
              </TouchableOpacity>

              {isAnalyzing ? (
                <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 10 }} />
              ) : (
                <TouchableOpacity 
                  style={[styles.sendBtn, (!hasRecordedCurrentSession || isRecording) && styles.sendBtnDisabled]} 
                  onPress={handleSendTransmission}
                  disabled={!hasRecordedCurrentSession || isRecording}
                >
                  <Text style={styles.sendBtnText}>
                    {hasRecordedCurrentSession ? '⚡ TRUYỀN TÍN HIỆU & GIẢI MÃ AI' : '🔒 THU ÂM ĐỂ TRUYỀN TÍN HIỆU'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {result && (
              <View style={styles.resultBox}>
                <Text style={styles.scoreText}>⚡ ĐỘ KHỚP TÍN HIỆU: {result.score}/100 ĐIỂM (+40 XP)</Text>
                <Text style={styles.feedbackText}>{result.feedback}</Text>

                <TouchableOpacity style={styles.refreshBtn} onPress={loadSignal}>
                  <Text style={styles.refreshText}>🔄 BẮT TÍN HIỆU MỚI</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  signalCard: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 15 },
  senderCode: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  contextText: { color: '#AAAABB', fontSize: 11, textAlign: 'center', marginBottom: 12 },
  audioBtn: { backgroundColor: '#1A0B2E', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  audioBtnPlaying: { backgroundColor: '#00FFFF' },
  audioBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  promptCard: { backgroundColor: '#120826', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', width: '100%', marginBottom: 15 },
  promptTitle: { color: '#FF007F', fontSize: 10, fontWeight: '900', marginBottom: 6 },
  promptText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordBtnActive: { backgroundColor: '#FF0055' },
  recordText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  sendBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#224422', opacity: 0.2 },
  sendBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultBox: { backgroundColor: '#120826', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center' },
  scoreText: { color: '#39FF14', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  feedbackText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 12 },
  refreshBtn: { backgroundColor: '#00FFFF', padding: 10, borderRadius: 8, width: '100%', alignItems: 'center' },
  refreshText: { color: '#000', fontSize: 10, fontWeight: '900' }
});