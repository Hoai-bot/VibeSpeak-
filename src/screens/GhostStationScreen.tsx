// src/screens/GhostStationScreen.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { transcribeAndGradeAudio } from '../services/groqClient';

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (ghostSentence: string) => void;
}

export function GhostStationScreen({ onBack, onNavigateToOasis }: Props) {
  const [ghostSentence, setGhostSentence] = useState<string>("Whispers in the dark connected speech");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);

  // STATE CỨU HỘ OASIS TRẠM BÓNG MA
  const [ghostMissCount, setGhostMissCount] = useState<number>(0);
  const [showOasisModal, setShowOasisModal] = useState<boolean>(false);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 🎯 TÌM MIME TYPE TƯƠNG THÍCH CAO NHẤT TRÊN MOBILE (ANDROID & IOS)
  const getOptimalMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg'
    ];
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate;
    }
    return '';
  };

  // 🎯 HÀM BẮT ĐẦU THU ÂM AN TOÀN CHO ANDROID CHROME / IOS SAFARI
  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert("🔒 Trình duyệt chưa cấp quyền Micro!");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const chosenMime = getOptimalMimeType();
      const options = chosenMime ? { mimeType: chosenMime } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      // 🎯 QUAN TRỌNG: Dùng buffer 200ms giúp Android không bị nghẽn RAM/sập stream
      mediaRecorder.start(200);
      setIsRecording(true);
      setScore(null);
    } catch (err) {
      alert('🔒 Lỗi: Vui lòng bật cấp quyền Micro trên thanh địa chỉ trình duyệt!');
    }
  };

  // 🎯 HÀM DỪNG THU ÂM VÀ CHẤM ĐIỂM
  const stopRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    setIsRecording(false);
    setIsAnalyzing(true);

    const processAudio = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const mimeUsed = mediaRecorder.mimeType || getOptimalMimeType() || 'audio/webm';
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

      const res = await transcribeAndGradeAudio(audioBlob, ghostSentence);
      setScore(res.score);

      // KÍCH HOẠT POPUP CỨU HỘ KHI ĐIỂM < 50 TRONG 2 LẦN LIÊN TIẾP
      if (res.score < 50) {
        setGhostMissCount((prev) => {
          const next = prev + 1;
          if (next >= 2) {
            setShowOasisModal(true);
          }
          return next;
        });
      } else {
        setGhostMissCount(0);
      }
    } catch (e) {
      alert('⚠️ Lỗi phân tích âm thanh! Vui lòng bấm thu âm lại.');
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
        <Text style={styles.headerTitle}>👻 TRẠM BÓNG MA</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.tag}>[ SHADOWING ECHO MODE ]</Text>
        <Text style={styles.sentenceText}>"{ghostSentence}"</Text>

        <TouchableOpacity 
          style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
        >
          <Text style={styles.recordText}>
            {isAnalyzing 
              ? '🤖 AI ĐANG PHÂN TÍCH GIỌNG NÓI...' 
              : isRecording 
              ? '⏹️ DỪNG THU ÂM & CHẤM ĐIỂM' 
              : '🎙️ ĐỌC ĐUỔI THEO BÓNG MA'}
          </Text>
        </TouchableOpacity>

        {score !== null && <Text style={styles.scoreText}>SCORE: {score} / 100</Text>}
      </View>

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
  headerTitle: { color: '#00FFFF', fontSize: 16, fontWeight: '900' },
  card: { backgroundColor: '#0D0620', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', alignItems: 'center' },
  tag: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
  sentenceText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  recordBtn: { backgroundColor: '#00FFFF', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  recordBtnActive: { backgroundColor: '#FF0055' },
  recordText: { color: '#000', fontWeight: '900' },
  scoreText: { color: '#39FF14', fontSize: 16, fontWeight: 'bold', marginTop: 15 },
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