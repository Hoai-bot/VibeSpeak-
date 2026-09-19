// src/screens/GhostStationScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { speakNaturalText } from '../services/ttsService';
import { gradeFlexibleArenaResponse, GradeResult } from '../services/groqClient';
import { Groq } from 'groq-sdk';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (sentence: string) => void;
}

export function GhostStationScreen({ onBack, onNavigateToOasis }: Props) {
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A1');
  const [ghostSentence, setGhostSentence] = useState<string>('');
  const [loadingGhost, setLoadingGhost] = useState<boolean>(true);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  // 🎯 HỆ THỐNG CỨU HỘ OASIS
  const [ghostMissCount, setGhostMissCount] = useState<number>(0);
  const [showOasisModal, setShowOasisModal] = useState<boolean>(false);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

  const fetchGhostSentence = async (level = cefrLevel) => {
    setLoadingGhost(true);
    setResult(null);

    let languageInstruction = '';
    if (level === 'A1' || level === 'A2') {
      languageInstruction = '100% VIETNAMESE instruction with a very simple 4-6 word English sentence to shadow.';
    } else if (level === 'B1' || level === 'B2') {
      languageInstruction = 'BILINGUAL guidance with a moderate 7-10 word English sentence focusing on connected speech.';
    } else {
      languageInstruction = '100% ENGLISH guidelines with a complex 10-14 word native-speed sentence.';
    }

    const prompt = `Generate ONE Shadowing/Connected Speech practice sentence for CEFR Level ${level}.
RULES: ${languageInstruction}
Return ONLY JSON: { "sentence": "English text to shadow", "tip": "Vietnamese or English tip on linking sounds" }`;

    try {
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-20b',
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
      setGhostSentence(parsed.sentence || "Whispers in the dark connected speech.");
    } catch (e) {
      setGhostSentence(
        level.startsWith('A') 
          ? "How are you doing today?" 
          : "Natural speech incorporates subtle linking sounds and rhythm."
      );
    } finally {
      setLoadingGhost(false);
    }
  };

  useEffect(() => {
    fetchGhostSentence(cefrLevel);
  }, [cefrLevel]);

  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
        resolve(blob);
      };
      mediaRecorder.stop();
    });

    try {
      const audioBlob = await processAudio;
      const res = await gradeFlexibleArenaResponse(audioBlob, ghostSentence);
      setResult(res);

      if (res.score < 50) {
        setGhostMissCount((prev) => {
          const next = prev + 1;
          if (next >= 2) setShowOasisModal(true);
          return next;
        });
      } else {
        setGhostMissCount(0);
      }
    } catch (e) {
      alert('Lỗi phân tích âm thanh!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👻 TRẠM 3: SHADOW MATRIX (BÓNG MA)</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {/* 📊 CHỌN CẤP ĐỘ CEFR */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>📊 CHỌN CẤP ĐỘ NHẬP VAI (CEFR):</Text>
          <View style={styles.levelRow}>
            {levels.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.levelBtn, cefrLevel === lvl && styles.activeLevelBtn]}
                onPress={() => setCefrLevel(lvl)}
              >
                <Text style={[styles.levelBtnText, cefrLevel === lvl && styles.activeLevelText]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 👻 THẺ THÁCH THỨC BÓNG MA */}
        {loadingGhost ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.tag}>[ SHADOWING ECHO MODE - {cefrLevel} ]</Text>
            <Text style={styles.sentenceText}>"{ghostSentence}"</Text>

            <TouchableOpacity 
              style={styles.speakerBtn} 
              onPress={() => speakNaturalText(ghostSentence, { voiceName: 'en-US-JennyNeural', style: 'cheerful' })}
            >
              <Text style={styles.speakerText}>🔊 NGHE BÓNG MA ĐỌC MẪU</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchGhostSentence(cefrLevel)}>
          <Text style={styles.refreshText}>🔄 ĐỔI CÂU BÓNG MA MỚI ({cefrLevel})</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]} 
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹️ DỪNG THU ÂM' : '🎙️ ĐỌC ĐUỔI THEO BÓNG MA'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 📊 KẾT QUẢ CHẤM ĐIỂM */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultScore, result.score >= 70 ? { color: '#39FF14' } : { color: '#FF0055' }]}>
              {result.score}/100 ĐIỂM SHADOWING
            </Text>
            <Text style={styles.transcribedText}>🗣️ Bạn đã đọc: "{result.transcribedText}"</Text>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>🎯 Âm: {result.phoneticScore}</Text>
              <Text style={styles.breakdownText}>⚡ Nhịp: {result.fluencyScore}</Text>
              <Text style={styles.breakdownText}>💡 Ý: {result.semanticScore}</Text>
            </View>

            <Text style={styles.feedbackText}>💡 {result.feedback}</Text>
          </View>
        )}
      </ScrollView>

      {/* 🌴 MODAL CỨU HỘ OASIS */}
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
  container: { flex: 1, backgroundColor: '#05020D', padding: 16, paddingTop: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold' },
  headerTitle: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },

  sectionBox: { width: '100%', marginBottom: 15, backgroundColor: '#120826', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#2A1040' },
  sectionLabel: { color: '#00FFCC', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 2, backgroundColor: '#1A0B36', borderRadius: 8, borderWidth: 1, borderColor: '#3A1559', alignItems: 'center' },
  activeLevelBtn: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  levelBtnText: { color: '#8888CC', fontSize: 11, fontWeight: 'bold' },
  activeLevelText: { color: '#FFFFFF', fontWeight: '900' },

  card: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', alignItems: 'center', width: '100%', marginBottom: 12 },
  tag: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  sentenceText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  speakerBtn: { backgroundColor: '#1A0B2E', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#FF007F' },
  speakerText: { color: '#FF007F', fontSize: 9, fontWeight: 'bold' },

  refreshBtn: { backgroundColor: '#110022', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },

  recordBtn: { backgroundColor: '#00FFFF', padding: 13, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  recordText: { color: '#000', fontSize: 11, fontWeight: '900' },

  resultCard: { backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center', marginBottom: 20 },
  resultScore: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  transcribedText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 6, backgroundColor: '#05020D', padding: 6, borderRadius: 6 },
  breakdownText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#39FF14', fontSize: 10, textAlign: 'center' },

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