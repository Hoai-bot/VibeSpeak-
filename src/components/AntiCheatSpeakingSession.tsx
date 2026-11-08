// src/components/AntiCheatSpeakingSession.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface Props {
  promptText: string;
  situationPrompt?: string;
  prepTimeSeconds?: number;
  autoHidePrompt?: boolean;
  onRecordingComplete: (audioBlob: Blob, pitchHistory: number[]) => void;
  onCancel: () => void;
}

export default function AntiCheatSpeakingSession({
  promptText,
  situationPrompt,
  prepTimeSeconds = 5,
  autoHidePrompt = true,
  onRecordingComplete,
  onCancel,
}: Props) {
  const [phase, setPhase] = useState<'PREP' | 'RECORDING' | 'SUBMITTING'>('PREP');
  const [prepCount, setPrepCount] = useState<number>(prepTimeSeconds);
  const [recordTimer, setRecordTimer] = useState<number>(0);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const pitchHistoryRef = useRef<number[]>([]);
  const audioCtxRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);

  // 1. Đếm ngược thời gian chuẩn bị (Tầng 3)
  useEffect(() => {
    let timer: any = null;
    if (phase === 'PREP') {
      timer = setInterval(() => {
        setPrepCount(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            startRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase]);

  // Bộ đếm thời gian đang ghi âm
  useEffect(() => {
    let timer: any = null;
    if (phase === 'RECORDING') {
      timer = setInterval(() => {
        setRecordTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase]);

  // 2. Tự động bật Mic và thu thập cao độ F0 thời gian thực (Tầng 2)
  const startRecording = async () => {
    try {
      setPhase('RECORDING');
      pitchHistoryRef.current = [];
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new (window as any).MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);

      // Phân tích Pitch F0 từ Web Audio API
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const buffer = new Float32Array(analyser.fftSize);
      const sampleRate = audioCtx.sampleRate;

      const trackPitch = () => {
        if (phase === 'SUBMITTING') return;
        analyser.getFloatTimeDomainData(buffer);
        const pitch = autoCorrelate(buffer, sampleRate);
        if (pitch > 0) {
          pitchHistoryRef.current.push(pitch);
        }
        animFrameRef.current = requestAnimationFrame(trackPitch);
      };
      trackPitch();
    } catch (err) {
      console.error("Lỗi khởi tạo micro:", err);
    }
  };

  // Autocorrelation tính tần số cơ bản F0
  const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.015) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    const trimmedBuf = buf.slice(r1, r2);
    const c = new Array(trimmedBuf.length).fill(0);
    for (let i = 0; i < trimmedBuf.length; i++) {
      for (let j = 0; j < trimmedBuf.length - i; j++) {
        c[i] += trimmedBuf[j] * trimmedBuf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < trimmedBuf.length; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    return maxpos > 0 ? sampleRate / maxpos : -1;
  };

  const handleFinish = () => {
    setPhase('SUBMITTING');
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob, pitchHistoryRef.current);
      };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topStatus}>
        <Text style={styles.statusBadge}>
          {phase === 'PREP' ? `⏳ CHUẨN BỊ NÓI: ${prepCount}S` : `🔴 ĐANG THU ÂM TRỰC TIẾP: ${recordTimer}S`}
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
          <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ HUỶ</Text>
        </TouchableOpacity>
      </View>

      {/* TẦNG 1: BIẾN MẤT VĂN BẢN KHI VÀO GIAI ĐOẠN GHI ÂM NÓI TỰ NHIÊN */}
      <View style={styles.promptCard}>
        <Text style={styles.promptHeader}>
          {phase === 'PREP' ? '📌 ĐỀ BÀI PHẢN XẠ NHANH:' : '🔒 CHẾ ĐỘ PHẢN XẠ (ĐÃ ẨN ĐỀ ĐỂ CHỐNG ĐỌC)'}
        </Text>

        {phase === 'PREP' ? (
          <View>
            <Text style={styles.promptContent}>{promptText}</Text>
            {situationPrompt && (
              <Text style={styles.situationContent}>💡 Gợi ý ngữ cảnh: {situationPrompt}</Text>
            )}
            <View style={styles.prepNoticeBox}>
              <Text style={styles.prepNoticeText}>
                ⚠️ Hết {prepCount}s dòng chữ sẽ biến mất và micro tự bật. Hãy tư duy ý tưởng ngay!
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.hiddenPromptBox}>
            <Text style={styles.hiddenPromptIcon}>🎙️</Text>
            <Text style={styles.hiddenPromptText}>
              Đề bài đã ẩn. Hãy tự do trình bày theo trí nhớ và phản xạ tự nhiên của bạn!
            </Text>
          </View>
        )}
      </View>

      {phase === 'RECORDING' && (
        <TouchableOpacity style={styles.submitBtn} onPress={handleFinish}>
          <Text style={styles.submitBtnText}>✅ HOÀN THÀNH & NỘP BÀI</Text>
        </TouchableOpacity>
      )}

      {phase === 'SUBMITTING' && (
        <View style={{ alignItems: 'center', marginTop: 15 }}>
          <ActivityIndicator size="small" color="#00FFFF" />
          <Text style={{ color: '#00FFFF', fontSize: 11, marginTop: 6 }}>
            Đang phân tích độ tự nhiên và phổ âm học F0...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0A0318', padding: 18, borderRadius: 16, borderWidth: 1.5, borderColor: '#FF007F', width: '100%', marginVertical: 10 },
  topStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { color: '#FFD700', fontSize: 11, fontWeight: '900' },
  closeBtn: { padding: 4 },
  promptCard: { backgroundColor: '#130628', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#332255', marginBottom: 14 },
  promptHeader: { color: '#00FFFF', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  promptContent: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', lineHeight: 22 },
  situationContent: { color: '#AAAABB', fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  prepNoticeBox: { marginTop: 10, backgroundColor: 'rgba(255, 0, 127, 0.15)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  prepNoticeText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  hiddenPromptBox: { alignItems: 'center', paddingVertical: 14 },
  hiddenPromptIcon: { fontSize: 24, marginBottom: 6 },
  hiddenPromptText: { color: '#39FF14', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  submitBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#000', fontSize: 12, fontWeight: '900' }
});