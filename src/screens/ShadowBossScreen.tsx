// src/screens/ShadowBossScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { speakNaturalText } from '../services/ttsService';
import { gradeFlexibleArenaResponse, GradeResult } from '../services/groqClient';
import { callGroqAI } from '../services/aiService';

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (text: string) => void;
}

const SPECIALTIES = ['IT & Cloud', 'Medical Consultation', 'Business Pitch', 'Hotel Service', 'Financial Report'];
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function ShadowBossScreen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [shadowTopic, setShadowTopic] = useState<{ targetText: string; specialty: string } | null>(null);
  const [loadingTopic, setLoadingTopic] = useState<boolean>(true);

  const [isPlayingBoss, setIsPlayingBoss] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  const [streak, setStreak] = useState<number>(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // 🎯 GỌI AI SINH BÀI SHADOWING ĐỘNG
  const fetchNewShadowChallenge = async () => {
    setLoadingTopic(true);
    setResult(null);
    setRecordedAudioUri(null);

    const randomSpecialty = SPECIALTIES[Math.floor(Math.random() * SPECIALTIES.length)];
    const randomSeed = Math.floor(Math.random() * 1000000);

    const prompt = `
Generate ONE natural English passage (10-15 words) for Shadowing practice.
Target CEFR Level: [${cefrLevel}].
Specialty Focus: [${randomSpecialty}]. Seed: ${randomSeed}.
Return ONLY JSON:
{
  "targetText": "Passage text here",
  "specialty": "${randomSpecialty}"
}
`;

    try {
      const aiRes = await callGroqAI(prompt, '');
      const jsonStart = aiRes.indexOf('{');
      const jsonEnd = aiRes.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(aiRes.substring(jsonStart, jsonEnd + 1));
        setShadowTopic({
          targetText: parsed.targetText || 'Our cloud deployment strategy ensures zero downtime.',
          specialty: parsed.specialty || randomSpecialty
        });
      } else {
        throw new Error('Invalid JSON');
      }
    } catch (e) {
      setShadowTopic({
        targetText: 'Effective communication requires both active listening and correct pronunciation.',
        specialty: randomSpecialty
      });
    } finally {
      setLoadingTopic(false);
    }
  };

  useEffect(() => {
    fetchNewShadowChallenge();
  }, [cefrLevel]);

  const handlePlayBossVoice = () => {
    if (!shadowTopic?.targetText) return;
    setIsPlayingBoss(true);
    speakNaturalText(shadowTopic.targetText, { voiceName: 'en-US-AriaNeural' });
    setTimeout(() => setIsPlayingBoss(false), 3500);
  };

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
      setRecordedAudioUri(null);
    } catch (err) {
      alert("Chưa cấp quyền Micro!");
    }
  };

  // 🎯 TÍCH HỢP HÀM XỬ LÝ ÂM THANH & KIỂM TRA CHỐNG ĐIỂM ẢO
  const stopAndGrade = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    setIsRecording(false);
    setIsAnalyzing(true);

    const processAudio = new Promise<{ blob: Blob; url: string }>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
        resolve({ blob, url });
      };
      mediaRecorder.stop();
    });

    try {
      const { blob, url } = await processAudio;
      setRecordedAudioUri(url);

      // 🎯 CHẶN NGAY TẠI ĐÂY NẾU KHÔNG CÓ DỮ LIỆU ÂM THANH (< 1000 bytes)
      if (!blob || blob.size < 1000) {
        setStreak(0);
        setResult({
          score: 0,
          phoneticScore: 0,
          fluencyScore: 0,
          semanticScore: 0,
          transcribedText: "(Chưa có âm thanh)",
          feedback: "⚠️ Không phát hiện giọng nói! Hãy bấm mic và nói rõ ràng theo câu mẫu.",
          wordAnalysis: []
        });
        setIsAnalyzing(false);
        return;
      }

      // Chấm điểm bình thường nếu file ghi âm có đủ dữ liệu
      const res = await gradeFlexibleArenaResponse(blob, shadowTopic?.targetText || '');

      if (res.score >= 75) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak >= 3) {
          res.score = Math.min(100, res.score * 2);
          res.isStreaking = true;
        }
        setResult(res);
      } else {
        setStreak(0);
        setResult(res);
      }

    } catch (e) {
      console.error(e);
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
        <Text style={styles.title}>👹 TRẠM 3: BOSS RAID</Text>
        <View style={[styles.streakBadge, streak >= 3 && styles.activeStreak]}>
          <Text style={styles.streakText}>🔥 STREAK: {streak} {streak >= 3 ? '(x2)' : ''}</Text>
        </View>
      </View>

      {/* THANH CHỌN TRÌNH ĐỘ CEFR */}
      <View style={styles.cefrBar}>
        {CEFR_LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.cefrBtn, cefrLevel === lvl && styles.activeCefr]}
            onPress={() => setCefrLevel(lvl)}
          >
            <Text style={[styles.cefrText, cefrLevel === lvl && styles.activeCefrText]}>{lvl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {loadingTopic || !shadowTopic ? (
          <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.shadowCard}>
            <Text style={styles.cardTag}>[ CEFR {cefrLevel} • {shadowTopic.specialty.toUpperCase()} ]</Text>
            <Text style={styles.targetText}>"{shadowTopic.targetText}"</Text>

            <TouchableOpacity style={[styles.speakerBtn, isPlayingBoss && { backgroundColor: '#FFD700' }]} onPress={handlePlayBossVoice}>
              <Text style={[styles.speakerText, isPlayingBoss && { color: '#000' }]}>
                {isPlayingBoss ? '🔊 ĐANG PHÁT MẪU...' : '🔊 NGHE GIỌNG BOSS MẪU'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchNewShadowChallenge}>
          <Text style={styles.refreshText}>🔄 TẠO BÀI SHADOWING MỚI ({cefrLevel})</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]} 
            onPress={isRecording ? stopAndGrade : startRecording}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹️ DỪNG GHI ÂM' : '🎙️ SHADOWING THEO BOSS'}
            </Text>
          </TouchableOpacity>
        )}

        {/* BẢNG KẾT QUẢ VÀ NÚT THỬ LẠI TẠI TRẠM 3 */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultScore, result.score >= 75 ? { color: '#39FF14' } : { color: '#FF0055' }]}>
              {result.isStreaking ? '⚡ CYBER STREAK BONUS x2! ' : ''}{result.score}/100 ĐIỂM
            </Text>
            <Text style={styles.transcribedText}>🗣️ Giọng bạn: "{result.transcribedText}"</Text>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>🎯 Âm: {result.phoneticScore}</Text>
              <Text style={styles.breakdownText}>⚡ Độ mượt: {result.fluencyScore}</Text>
              <Text style={styles.breakdownText}>💡 Ngữ nghĩa: {result.semanticScore}</Text>
            </View>

            <Text style={styles.feedbackText}>💡 {result.feedback}</Text>

            {recordedAudioUri && (
              <TouchableOpacity style={styles.replayBtn} onPress={() => new Audio(recordedAudioUri).play()}>
                <Text style={styles.replayText}>🎧 NGHE LẠI BẢN GHI ÂM CỦA BẠN</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.retryBtn} 
              onPress={() => {
                setResult(null);
              }}
            >
              <Text style={styles.retryText}>🔄 THỬ LẠI PHÁT ÂM CÂU NÀY (TRẠM 3)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FFD700' },
  backText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 12, fontWeight: '900' },
  streakBadge: { backgroundColor: '#221133', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F' },
  activeStreak: { borderColor: '#39FF14', backgroundColor: '#004411' },
  streakText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },

  cefrBar: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBtn: { flex: 1, paddingVertical: 6, marginHorizontal: 2, backgroundColor: '#120826', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#3A1559' },
  activeCefr: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  cefrText: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  activeCefrText: { color: '#000' },

  shadowCard: { backgroundColor: '#1A1500', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 12 },
  cardTag: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginBottom: 8 },
  targetText: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  speakerBtn: { backgroundColor: '#0D0620', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#FFD700' },
  speakerText: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },

  refreshBtn: { backgroundColor: '#110022', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshText: { color: '#00FFFF', fontSize: 11, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#39FF14', padding: 13, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  recordText: { color: '#000', fontSize: 11, fontWeight: '900' },

  resultCard: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center', marginBottom: 20 },
  resultScore: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  transcribedText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 6, backgroundColor: '#05020D', padding: 6, borderRadius: 6 },
  breakdownText: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#39FF14', fontSize: 10, textAlign: 'center', marginBottom: 8 },
  replayBtn: { backgroundColor: '#FFD700', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  replayText: { color: '#000', fontSize: 9, fontWeight: 'bold' },

  retryBtn: { backgroundColor: '#FF007F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 6 },
  retryText: { color: '#FFF', fontSize: 11, fontWeight: '900' }
});