// src/screens/DrillScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { generateDynamicDrill, DrillItem } from '../services/aiGenerator';
import { gradeFlexibleArenaResponse, GradeResult } from '../services/groqClient';
import { speakNaturalText } from '../services/ttsService';

interface Props {
  tier: 1 | 2 | 3;
  onBack: () => void;
  onNavigateToOasis?: (sentence: string) => void;
}

export default function DrillScreen({ tier, onBack, onNavigateToOasis }: Props) {
  const [currentDrill, setCurrentDrill] = useState<DrillItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  const [streak, setStreak] = useState<number>(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  const tierTitle = tier === 1 ? 'TẦNG 1: MINIMAL PAIRS' : tier === 2 ? 'TẦNG 2: LINKING WORDS' : 'TẦNG 3: TONGUE TWISTERS';

  const fetchNextDrill = async () => {
    setLoading(true);
    setResult(null);
    setRecordedAudioUri(null);

    try {
      const newDrill = await generateDynamicDrill(tier, 'B2', 'Cyberpunk Business & Tech');
      setCurrentDrill(newDrill);
    } catch (e) {
      console.error("❌ Error fetching drill:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextDrill();
  }, [tier]);

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

  const stopAndGrade = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive' || !currentDrill) return;

    setIsRecording(false);
    setIsAnalyzing(true);

    const processAudio = new Promise<{ blob: Blob; url: string }>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
        resolve({ blob, url });
      };
      mediaRecorder.stop();
    });

    try {
      const { blob, url } = await processAudio;
      setRecordedAudioUri(url);

      const res = await gradeFlexibleArenaResponse(blob, currentDrill.spokenText);

      if (res.score >= 75) {
        // ⚡ ĐẠT ĐIỂM CAO (≥ 75): Tăng Streak
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak >= 3) {
          res.score = Math.min(100, res.score * 2);
          res.isStreaking = true;
        }
        setResult(res);
        // 🛑 Đã tắt timer tự động chuyển bài để người dùng thoải mái đọc nhận xét

      } else {
        // ❌ ĐIỂM THẤP (< 75)
        setStreak(0);
        setResult(res);
        if (onNavigateToOasis) setTimeout(() => onNavigateToOasis(currentDrill.target), 3000);
      }

    } catch (e) {
      console.error("❌ Error grading drill:", e);
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
        <Text style={styles.title}>🎯 TRẠM 1: {tierTitle}</Text>
        <View style={[styles.streakBadge, streak >= 3 && styles.activeStreak]}>
          <Text style={styles.streakText}>🔥 STREAK: {streak} {streak >= 3 ? '(x2)' : ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {loading || !currentDrill ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.cefrTag}>[ {currentDrill.cefrLevel || 'B2'} ] {currentDrill.phonetics}</Text>
            <Text style={styles.targetText}>"{currentDrill.target}"</Text>
            <Text style={styles.meaningText}>💡 {currentDrill.meaning}</Text>
            <Text style={styles.tipText}>📌 Mẹo phát âm: {currentDrill.tip}</Text>

            <TouchableOpacity 
              style={styles.speakerBtn} 
              onPress={() => speakNaturalText(currentDrill.spokenText, { voiceName: 'en-US-JennyNeural' })}
            >
              <Text style={styles.speakerText}>🔊 NGHE MẪU NEURAL TTS</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchNextDrill}>
          <Text style={styles.refreshText}>🔄 ĐỔI CẶP TỪ / CÂU MỚI</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]} 
            onPress={isRecording ? stopAndGrade : startRecording}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹️ DỪNG GHI ÂM' : '🎙️ PHÁT ÂM NGAY'}
            </Text>
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultScore, result.score >= 75 ? { color: '#39FF14' } : { color: '#FF0055' }]}>
              {result.isStreaking ? '⚡ CYBER STREAK BONUS x2! ' : ''}{result.score}/100 ĐIỂM
            </Text>
            <Text style={styles.transcribedText}>🗣️ Bạn đã đọc: "{result.transcribedText}"</Text>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>🎯 Âm: {result.phoneticScore}</Text>
              <Text style={styles.breakdownText}>⚡ Nhịp: {result.fluencyScore}</Text>
              <Text style={styles.breakdownText}>💡 Ý: {result.semanticScore}</Text>
            </View>

            <Text style={styles.feedbackText}>💡 {result.feedback}</Text>

            {/* 🔴 BÁO LỖI ÂM TIẾT PHONEME-LEVEL */}
            {result.wordAnalysis && result.wordAnalysis.length > 0 && (
              <View style={styles.analysisBox}>
                <Text style={styles.analysisTitle}>🎯 PHÂN TÍCH ÂM TIẾT SAI:</Text>
                {result.wordAnalysis.map((item, idx) => (
                  <Text key={idx} style={styles.analysisItem}>
                    • <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>{item.word}</Text> ({item.phonetic}): {item.issue || `Đọc sai âm ${item.wrongPhoneme}`}
                  </Text>
                ))}
              </View>
            )}

            {recordedAudioUri && (
              <TouchableOpacity style={styles.replayBtn} onPress={() => new Audio(recordedAudioUri).play()}>
                <Text style={styles.replayText}>🎧 NGHE LẠI BẢN GHI ÂM CỦA BẠN</Text>
              </TouchableOpacity>
            )}

            {/* 🚀 NÚT TIẾP TỤC CHỦ ĐỘNG KHI ĐẠT ĐIỂM CAO */}
            {result.score >= 75 && (
              <TouchableOpacity style={styles.nextPairBtn} onPress={fetchNextDrill}>
                <Text style={styles.nextPairText}>TIẾP TỤC BÀI MỚI ➔</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  streakBadge: { backgroundColor: '#221133', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F' },
  activeStreak: { borderColor: '#39FF14', backgroundColor: '#004411' },
  streakText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },

  card: { backgroundColor: '#0A0618', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  cefrTag: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  targetText: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  meaningText: { color: '#39FF14', fontSize: 12, marginBottom: 6 },
  tipText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 12 },
  speakerBtn: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#00FFFF' },
  speakerText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },

  refreshBtn: { backgroundColor: '#110022', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#00FFFF', padding: 13, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  recordText: { color: '#000', fontSize: 11, fontWeight: '900' },

  resultCard: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center' },
  resultScore: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  transcribedText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 6, backgroundColor: '#05020D', padding: 6, borderRadius: 6 },
  breakdownText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#39FF14', fontSize: 10, textAlign: 'center', marginBottom: 8 },

  analysisBox: { backgroundColor: '#1A000A', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FF0055', width: '100%', marginBottom: 8 },
  analysisTitle: { color: '#FF0055', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  analysisItem: { color: '#FFF', fontSize: 9, marginBottom: 2 },

  replayBtn: { backgroundColor: '#00FFFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  replayText: { color: '#000', fontSize: 9, fontWeight: 'bold' },

  nextPairBtn: { backgroundColor: '#39FF14', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 4 },
  nextPairText: { color: '#000', fontSize: 11, fontWeight: '900' }
});