// src/screens/NeonBeatPulseScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { generateDynamicDrill, DrillItem } from '../services/aiGenerator';
import { speakNaturalText } from '../services/ttsService';
import { gradeFlexibleArenaResponse, GradeResult } from '../services/groqClient';
import OasisRescueScreen from './OasisRescueScreen';
import { LevelTopicSelector, CEFRLevel } from '../components/LevelTopicSelector';

interface Props {
  initialTier?: 1 | 2 | 3;
  onBack: () => void;
}

export default function NeonBeatPulseScreen({ initialTier = 1, onBack }: Props) {
  const [tier, setTier] = useState<1 | 2 | 3>(initialTier);
  
  // 🎯 CẤP ĐỘ CEFR & CHỦ ĐỀ LUYỆN TẬP
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B2');
  const [topicContext, setTopicContext] = useState<string>('Tech & AI Innovations');

  const [currentDrill, setCurrentDrill] = useState<DrillItem | null>(null);
  const [loadingDrill, setLoadingDrill] = useState<boolean>(true);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  
  // ⚡ CYBER STREAK & POST-MATCH REPLAY
  const [streak, setStreak] = useState<number>(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const [showRescue, setShowRescue] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  const loadNextDrill = async (
    selectedTier: 1 | 2 | 3 = tier, 
    level: CEFRLevel = cefrLevel, 
    topic: string = topicContext
  ) => {
    setLoadingDrill(true);
    setResult(null);
    setRecordedAudioUri(null);
    setShowRescue(false);
    setAttempts(0);

    const newDrill = await generateDynamicDrill(selectedTier, level, topic);
    setCurrentDrill(newDrill);
    setLoadingDrill(false);
  };

  useEffect(() => {
    loadNextDrill(tier, cefrLevel, topicContext);
  }, [tier]);

  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert("Trình duyệt không hỗ trợ micro!");
        return;
      }
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
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
        }
        resolve({ blob, url });
      };
      mediaRecorder.stop();
    });

    try {
      const { blob, url } = await processAudio;
      setRecordedAudioUri(url);

      if (blob.size < 1000) {
        setResult({ score: 0, phoneticScore: 0, fluencyScore: 0, semanticScore: 0, transcribedText: "(Âm thanh quá ngắn)", feedback: "Hãy thử đọc to rõ ràng hơn!" });
        setIsAnalyzing(false);
        return;
      }

      const res = await gradeFlexibleArenaResponse(blob, currentDrill?.spokenText || currentDrill?.target || '');
      
      // ⚡ KÍCH HOẠT CYBER STREAK (x2 MULTIPLIER)
      if (res.score >= 80) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setAttempts(0);
        
        if (nextStreak >= 3) {
          res.score = Math.min(100, res.score * 2); // Multiplier x2
          res.isStreaking = true;
        }

        setTimeout(() => {
          loadNextDrill(tier, cefrLevel, topicContext);
        }, 2200);
      } else {
        setStreak(0); // Reset streak khi đọc chưa đạt
        const newAttempt = attempts + 1;
        setAttempts(newAttempt);

        if (newAttempt >= 2) {
          setTimeout(() => setShowRescue(true), 1200);
        }
      }

      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playRecordedAudio = () => {
    if (recordedAudioUri) {
      const audio = new Audio(recordedAudioUri);
      audio.play();
    }
  };

  if (showRescue && currentDrill) {
    return (
      <OasisRescueScreen
        rescueData={{
          stationName: "TRẠM 1: NEON BEAT PULSE",
          tierLevel: tier,
          targetText: currentDrill.target,
          phonetics: currentDrill.phonetics,
          meaning: currentDrill.meaning,
          tip: currentDrill.tip
        }}
        onClose={() => { setShowRescue(false); setResult(null); setAttempts(0); }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚡ TRẠM 1: NEON BEAT</Text>
        
        {/* 🔥 CYBER STREAK BADGE */}
        <View style={[styles.streakBadge, streak >= 3 && styles.activeStreak]}>
          <Text style={styles.streakText}>🔥 STREAK: {streak} {streak >= 3 ? '(x2)' : ''}</Text>
        </View>
      </View>

      <View style={styles.tierSelector}>
        <TouchableOpacity style={[styles.tierTab, tier === 1 && styles.activeTier1]} onPress={() => setTier(1)}>
          <Text style={styles.tierText}>TẦNG 1: PAIRS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tierTab, tier === 2 && styles.activeTier2]} onPress={() => setTier(2)}>
          <Text style={styles.tierText}>TẦNG 2: LINKING</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tierTab, tier === 3 && styles.activeTier3]} onPress={() => setTier(3)}>
          <Text style={styles.tierText}>TẦNG 3: TWISTER</Text>
        </TouchableOpacity>
      </View>

      {/* 🎯 BỘ CHỌN CẤP ĐỘ CEFR VÀ CHỦ ĐỀ HỌC TAP */}
      <LevelTopicSelector
        currentLevel={cefrLevel}
        currentTopic={topicContext}
        onSelectLevel={(lvl) => {
          setCefrLevel(lvl);
          loadNextDrill(tier, lvl, topicContext);
        }}
        onSelectTopic={(tpc) => {
          setTopicContext(tpc);
          loadNextDrill(tier, cefrLevel, tpc);
        }}
      />

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        {loadingDrill || !currentDrill ? (
          <ActivityIndicator size="large" color="#00FFFF" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.drillCard}>
            {currentDrill.isReviewItem && <Text style={styles.srsTag}>🧠 SRS RE-REVIEW ITEM</Text>}
            <Text style={styles.targetText}>"{currentDrill.target}"</Text>
            <Text style={styles.phoneticText}>{currentDrill.phonetics}</Text>
            <Text style={styles.meaningText}>Nghĩa: {currentDrill.meaning}</Text>

            {/* 🎙️ NÚT PHÁT ÂM MẪU VỚI AZURE NEURAL VOICE */}
            <TouchableOpacity 
              style={styles.speakerBtn} 
              onPress={() => speakNaturalText(currentDrill.spokenText, { voiceName: 'en-US-JennyNeural', style: 'cheerful' })}
            >
              <Text style={styles.speakerText}>🔊 NGHE PHÁT ÂM MẪU</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={() => loadNextDrill(tier, cefrLevel, topicContext)}>
          <Text style={styles.nextText}>🔄 TẠO BÀI TẬP MỚI</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 15 }} />
        ) : (
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]} 
            onPress={isRecording ? stopAndGrade : startRecording}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹️ DỪNG & CHẤM ĐIỂM 3D' : '🎙️ GHI ÂM CHẤM ĐIỂM'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 📊 POST-MATCH REPLAY & 3D SCORE CARD */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultScore, result.score >= 80 ? { color: '#39FF14' } : { color: '#FF0055' }]}>
              {result.isStreaking ? '⚡ CYBER STREAK BONUS x2! ' : ''}{result.score}/100 ĐIỂM
            </Text>
            <Text style={styles.transcribedText}>🗣️ AI Nhận diện: "{result.transcribedText}"</Text>

            {/* 3D Breakdown */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>🎯 Phôn âm: {result.phoneticScore}</Text>
              <Text style={styles.breakdownText}>⚡ Trôi chảy: {result.fluencyScore}</Text>
              <Text style={styles.breakdownText}>💡 Ngữ nghĩa: {result.semanticScore}</Text>
            </View>

            <Text style={styles.feedbackText}>💡 {result.feedback}</Text>

            {/* 🎧 POST-MATCH REPLAY BUTTON */}
            {recordedAudioUri && (
              <TouchableOpacity style={styles.replayBtn} onPress={playRecordedAudio}>
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
  backBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  streakBadge: { backgroundColor: '#221133', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F' },
  activeStreak: { borderColor: '#39FF14', backgroundColor: '#004411' },
  streakText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },
  
  tierSelector: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  tierTab: { backgroundColor: '#0D0620', paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '32%', alignItems: 'center' },
  activeTier1: { borderColor: '#00FFFF', backgroundColor: '#003344' },
  activeTier2: { borderColor: '#FF007F', backgroundColor: '#440022' },
  activeTier3: { borderColor: '#FFD700', backgroundColor: '#443300' },
  tierText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },

  drillCard: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  srsTag: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  targetText: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  phoneticText: { color: '#FFD700', fontSize: 12, marginBottom: 4 },
  meaningText: { color: '#AAAABB', fontSize: 11, marginBottom: 8 },
  speakerBtn: { backgroundColor: '#1A0B2E', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FF007F' },
  speakerText: { color: '#FF007F', fontSize: 9, fontWeight: 'bold' },

  nextBtn: { backgroundColor: '#110022', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 10 },
  nextText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#39FF14', padding: 12, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
  recordText: { color: '#000', fontSize: 11, fontWeight: '900' },

  resultCard: { backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center' },
  resultScore: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  transcribedText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 6, backgroundColor: '#05020D', padding: 6, borderRadius: 6 },
  breakdownText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#39FF14', fontSize: 10, textAlign: 'center', marginBottom: 8 },
  replayBtn: { backgroundColor: '#FF007F', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  replayText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' }
});