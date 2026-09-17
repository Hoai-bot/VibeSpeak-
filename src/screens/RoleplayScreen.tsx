// src/screens/RoleplayScreen.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { gradeFlexibleArenaResponse, GradeResult } from '../services/groqClient';
import { speakNaturalText } from '../services/ttsService';

interface Props {
  onBack: () => void;
}

export default function RoleplayScreen({ onBack }: Props) {
  const [scenario, setScenario] = useState({
    role: "Customer Service Manager",
    situation: "An angry customer is complaining about a delayed shipment. Calm them down professionally."
  });
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

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
      alert("Chưa cấp quyền Micro!");
    }
  };

  const stopAndGrade = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    setIsRecording(false);
    setIsAnalyzing(true);

    const processAudio = new Promise<{ blob: Blob }>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
        resolve({ blob });
      };
      mediaRecorder.stop();
    });

    try {
      const { blob } = await processAudio;
      const res = await gradeFlexibleArenaResponse(blob, scenario.situation);
      setResult(res);
    } catch (e) {
      console.error("❌ Lỗi chấm điểm Roleplay:", e);
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
        <Text style={styles.title}>🎭 TRẠM 2: ROLEPLAY ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%' }}>
        <View style={styles.card}>
          <Text style={styles.tag}>[ VAI TRÒ: {scenario.role.toUpperCase()} ]</Text>
          <Text style={styles.scenarioText}>"{scenario.situation}"</Text>
          <TouchableOpacity style={styles.speakerBtn} onPress={() => speakNaturalText(scenario.situation)}>
            <Text style={styles.speakerText}>🔊 NGHE TÌNH HUỐNG</Text>
          </TouchableOpacity>
        </View>

        {isAnalyzing ? (
          <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && { backgroundColor: '#FF0055' }]} 
            onPress={isRecording ? stopAndGrade : startRecording}
          >
            <Text style={styles.recordText}>{isRecording ? '⏹️ DỪNG & XỬ LÝ TÌNH HUỐNG' : '🎙️ NÓI LỜI THẦN THÁI'}</Text>
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.scoreText, result.score >= 75 ? { color: '#39FF14' } : { color: '#FF0055' }]}>
              {result.score}/100 ĐIỂM
            </Text>
            <Text style={styles.transcribedText}>🗣️ Bạn đã nói: "{result.transcribedText}"</Text>
            <Text style={styles.feedbackText}>💡 {result.feedback}</Text>

            {result.wordAnalysis && result.wordAnalysis.length > 0 && (
              <View style={styles.analysisBox}>
                <Text style={styles.analysisTitle}>🎯 LỖI PHÔN ÂM BỊ TRỪ ĐIỂM:</Text>
                {result.wordAnalysis.map((item, idx) => (
                  <Text key={idx} style={styles.analysisItem}>• {item.word}: {item.issue || `Sai âm ${item.wrongPhoneme}`}</Text>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.nextBtn} onPress={() => setResult(null)}>
              <Text style={styles.nextText}>ĐỔI KỊCH BẢN NHẬP VAI MỚI ➔</Text>
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
  backBtn: { padding: 6, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  card: { backgroundColor: '#0A0618', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#39FF14', width: '100%', alignItems: 'center', marginBottom: 15 },
  tag: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  scenarioText: { color: '#FFF', fontSize: 14, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  speakerBtn: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#00FFFF' },
  speakerText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#00FFFF', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15 },
  recordText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultCard: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center' },
  scoreText: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  transcribedText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  feedbackText: { color: '#39FF14', fontSize: 10, textAlign: 'center', marginBottom: 8 },
  analysisBox: { backgroundColor: '#1A000A', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FF0055', width: '100%', marginBottom: 10 },
  analysisTitle: { color: '#FF0055', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  analysisItem: { color: '#FFF', fontSize: 9 },
  nextBtn: { backgroundColor: '#39FF14', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center' },
  nextText: { color: '#000', fontSize: 11, fontWeight: '900' }
});