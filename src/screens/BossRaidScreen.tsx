// src/screens/BossRaidScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { speakNaturalText } from '../services/ttsService';
import { gradeFlexibleArenaResponse, GradeResult } from '../services/groqClient';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (sentence: string) => void;
}

const bossSentenceHistory = new Set<string>();

export default function BossRaidScreen({ onBack, onNavigateToOasis }: Props) {
  const [bossSentence, setBossSentence] = useState<string>('');
  const [loadingBoss, setLoadingBoss] = useState<boolean>(true);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  const [streak, setStreak] = useState<number>(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  const fetchNewBossChallenge = async () => {
    setLoadingBoss(true);
    setResult(null);
    setRecordedAudioUri(null);

    const excludeList = Array.from(bossSentenceHistory).join(', ');

    const prompt = `
Generate ONE challenging English sentence for Boss Raid (8-12 words). Topic: Business/Cyberpunk.
DO NOT use: [${excludeList}].
Return ONLY JSON: { "sentence": "Text" }
`;

    try {
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-20b',
        temperature: 0.95,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
      const newSentence = parsed.sentence || "Technology is reshaping the way we communicate every day.";
      bossSentenceHistory.add(newSentence.toLowerCase());
      setBossSentence(newSentence);
    } catch (e) {
      setBossSentence(`AI innovation drives natural language fluency`);
    } finally {
      setLoadingBoss(false);
    }
  };

  useEffect(() => {
    fetchNewBossChallenge();
  }, []);

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
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

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

      const cleanTargetSentence = bossSentence.replace(/#\d+/g, '').trim();
      const res = await gradeFlexibleArenaResponse(blob, cleanTargetSentence);

      if (res.score >= 75) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak >= 3) {
          res.score = Math.min(100, res.score * 2);
          res.isStreaking = true;
        }
        setResult(res);

        setTimeout(() => {
          fetchNewBossChallenge();
        }, 1500);

      } else {
        setStreak(0);
        setResult(res);
        if (onNavigateToOasis) setTimeout(() => onNavigateToOasis(cleanTargetSentence), 2000);
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
        <Text style={styles.title}>🔥 TRẠM 3: BOSS RAID</Text>
        <View style={[styles.streakBadge, streak >= 3 && styles.activeStreak]}>
          <Text style={styles.streakText}>🔥 STREAK: {streak} {streak >= 3 ? '(x2)' : ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {loadingBoss ? (
          <ActivityIndicator size="large" color="#FF0055" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.bossCard}>
            <Text style={styles.bossTag}>👹 SHADOW BOSS CHALLENGE</Text>
            <Text style={styles.targetSentence}>"{bossSentence}"</Text>

            <TouchableOpacity 
              style={styles.speakerBtn} 
              onPress={() => {
                const cleanText = bossSentence.replace(/#\d+/g, '').trim();
                speakNaturalText(cleanText, { voiceName: 'en-US-GuyNeural', style: 'shouting', rate: '+5%' });
              }}
            >
              <Text style={styles.speakerText}>🔊 NGHE BOSS MẪU</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchNewBossChallenge}>
          <Text style={styles.refreshText}>🔄 ĐỔI THÁCH THỨC BOSS</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]} 
            onPress={isRecording ? stopAndGrade : startRecording}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹️ DỪNG GHI ÂM' : '🎙️ TẤN CÔNG BOSS'}
            </Text>
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultScore, result.score >= 70 ? { color: '#39FF14' } : { color: '#FF0055' }]}>
              {result.isStreaking ? '⚡ CYBER STREAK BONUS x2! ' : ''}{result.score}/100 ĐIỂM
            </Text>
            <Text style={styles.transcribedText}>🗣️ Bạn đã đọc: "{result.transcribedText}"</Text>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>🎯 Âm: {result.phoneticScore}</Text>
              <Text style={styles.breakdownText}>⚡ Nhịp: {result.fluencyScore}</Text>
              <Text style={styles.breakdownText}>💡 Ý: {result.semanticScore}</Text>
            </View>

            <Text style={styles.feedbackText}>💡 {result.feedback}</Text>

            {recordedAudioUri && (
              <TouchableOpacity style={styles.replayBtn} onPress={() => new Audio(recordedAudioUri).play()}>
                <Text style={styles.replayText}>🎧 NGHE LẠI BẢN GHI ÂM CỦA BẠN</Text>
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
  backBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FF0055' },
  backText: { color: '#FF0055', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF0055', fontSize: 12, fontWeight: '900' },
  streakBadge: { backgroundColor: '#221133', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F' },
  activeStreak: { borderColor: '#39FF14', backgroundColor: '#004411' },
  streakText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },

  bossCard: { backgroundColor: '#1A000A', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FF0055', width: '100%', alignItems: 'center', marginBottom: 12 },
  bossTag: { color: '#FF0055', fontSize: 9, fontWeight: 'bold', marginBottom: 8 },
  targetSentence: { color: '#FFF', fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  speakerBtn: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#00FFFF' },
  speakerText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },

  refreshBtn: { backgroundColor: '#110022', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#FF0055', padding: 13, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  recordText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  resultCard: { backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center' },
  resultScore: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  transcribedText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 6, backgroundColor: '#05020D', padding: 6, borderRadius: 6 },
  breakdownText: { color: '#FF0055', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#39FF14', fontSize: 10, textAlign: 'center', marginBottom: 8 },
  replayBtn: { backgroundColor: '#00FFFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  replayText: { color: '#000', fontSize: 9, fontWeight: 'bold' }
});