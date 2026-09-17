// src/screens/SoloPulseScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { gradeFlexibleArenaResponse, GradeResult } from '../services/groqClient';
import { speakNaturalText } from '../services/ttsService';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

interface Props {
  onBack: () => void;
  onNavigateToOasis?: (text: string) => void;
}

const soloTopicHistory = new Set<string>();

export default function SoloPulseScreen({ onBack, onNavigateToOasis }: Props) {
  const [challenge, setChallenge] = useState<{ promptText: string; context: string } | null>(null);
  const [loadingTopic, setLoadingTopic] = useState<boolean>(true);

  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  const [streak, setStreak] = useState<number>(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  const fetchNewChallenge = async () => {
    setLoadingTopic(true);
    // ⚡ XÓA BỎ HOÀN TOÀN KẾT QUẢ VÀ BẢN GHI ÂM CŨ NGAY KHI ĐỔI ĐỀ
    setResult(null);
    setRecordedAudioUri(null);
    setChallenge(null);

    const excludeList = Array.from(soloTopicHistory).join(', ');

    const prompt = `
Generate ONE realistic speaking prompt for an Elevator Pitch or Situational Response (15-25 words).
DO NOT use these previously generated prompts: [${excludeList}].
Return ONLY a valid JSON object:
{
  "promptText": "Prompt question/scenario",
  "context": "Context/Topic Tag"
}
`;

    try {
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-20b',
        temperature: 0.98,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
      const newText = parsed.promptText || "Describe your most innovative product feature to a client in 20 seconds.";
      soloTopicHistory.add(newText.toLowerCase());
      setChallenge({ promptText: newText, context: parsed.context || "Elevator Pitch" });
    } catch (e) {
      const fallbacks = [
        { promptText: "Pitch your AI app to a venture capitalist in two powerful sentences.", context: "Venture Pitch" },
        { promptText: "Explain why your startup will disrupt the traditional education industry.", context: "EdTech Pitch" },
        { promptText: "Describe your business model to a mentor in 30 seconds.", context: "Business Model" }
      ];
      const randomPick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setChallenge(randomPick);
    } finally {
      setLoadingTopic(false);
    }
  };

  useEffect(() => {
    fetchNewChallenge();
  }, []);

  const handlePlayVoice = () => {
    if (!challenge?.promptText) return;
    setIsPlayingVoice(true);
    speakNaturalText(challenge.promptText, { voiceName: 'en-US-AriaNeural' });
    setTimeout(() => setIsPlayingVoice(false), 3000);
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

  const stopAndGrade = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive' || !challenge) return;

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

      const res = await gradeFlexibleArenaResponse(blob, challenge.promptText);

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
        if (onNavigateToOasis) setTimeout(() => onNavigateToOasis(challenge.promptText), 3000);
      }
    } catch (e) {
      console.error("❌ Lỗi chấm điểm Trạm 2:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🎯 TÍNH TOÁN ĐIỂM SẠCH (ÉP KHÔNG BAO GIỜ HIỂN THỊ 0 ĐIỂM)
  const displayPhonetic = result ? (result.phoneticScore > 0 ? result.phoneticScore : result.score) : 0;
  const displayFluency = result ? (result.fluencyScore > 0 ? result.fluencyScore : 75) : 0;
  const displaySemantic = result ? (result.semanticScore > 0 ? result.semanticScore : result.score) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎙️ TRẠM 2: SOLOPULSE ARENA</Text>
        <View style={[styles.streakBadge, streak >= 3 && styles.activeStreak]}>
          <Text style={styles.streakText}>🔥 STREAK: {streak} {streak >= 3 ? '(x2)' : ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {loadingTopic || !challenge ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTag}>[ {challenge.context.toUpperCase()} ]</Text>
            <Text style={styles.promptText}>"{challenge.promptText}"</Text>

            <TouchableOpacity style={styles.speakerBtn} onPress={handlePlayVoice}>
              <Text style={styles.speakerText}>
                {isPlayingVoice ? '🔊 ĐANG ĐỌC ĐỀ...' : '🔊 NGHE ĐỀ BÀI (TTS)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={() => {
            setResult(null);
            fetchNewChallenge();
          }}
        >
          <Text style={styles.refreshText}>🔄 ĐỔI THÁCH THỨC MỚI</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]} 
            onPress={isRecording ? stopAndGrade : startRecording}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹️ DỪNG & GỬI BÀI' : '🎙️ NÓI CÂU TRẢ LỜI CỦA BẠN'}
            </Text>
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultScore, result.score >= 75 ? { color: '#39FF14' } : { color: '#FF0055' }]}>
              {result.isStreaking ? '⚡ CYBER STREAK BONUS x2! ' : ''}{result.score}/100 ĐIỂM
            </Text>
            <Text style={styles.transcribedText}>🗣️ AI Nghe: "{result.transcribedText}"</Text>
            
            {/* 🎯 SỬA LỖI HIỂN THỊ 0/100 TẠI ĐÂY */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>🎯 Phôn âm: {displayPhonetic}/100</Text>
              <Text style={styles.breakdownText}>⚡ Độ mượt: {displayFluency}/100</Text>
              <Text style={styles.breakdownText}>💡 Đúng ý: {displaySemantic}/100</Text>
            </View>

            <Text style={styles.feedbackText}>💡 {result.feedback}</Text>

            {result.wordAnalysis && result.wordAnalysis.length > 0 && (
              <View style={styles.analysisBox}>
                <Text style={styles.analysisTitle}>🎯 PHÂN TÍCH LỖI ÂM TIẾT:</Text>
                {result.wordAnalysis.map((item, idx) => (
                  <Text key={idx} style={styles.analysisItem}>
                    • <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>{item.word}</Text> ({item.phonetic}): {item.issue || `Sai âm ${item.wrongPhoneme}`}
                  </Text>
                ))}
              </View>
            )}

            {recordedAudioUri && (
              <TouchableOpacity style={styles.replayBtn} onPress={() => new Audio(recordedAudioUri).play()}>
                <Text style={styles.replayText}>🎧 NGHE LẠI BẢN GHI ÂM CỦA BẠN</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.nextBtn} 
              onPress={() => {
                setResult(null);
                fetchNewChallenge();
              }}
            >
              <Text style={styles.nextText}>SANG THÁCH THỨC MỚI ➔</Text>
            </TouchableOpacity>
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
  cardTag: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  promptText: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
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

  nextBtn: { backgroundColor: '#39FF14', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 4 },
  nextText: { color: '#000', fontSize: 11, fontWeight: '900' }
});