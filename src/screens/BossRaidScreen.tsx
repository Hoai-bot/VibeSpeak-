// src/screens/BossRaidScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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

interface BossChallenge {
  sentence: string;
  translation: string;
  hint: string;
}

// 🎯 KHO ĐỀ BÀI DỰ PHÒNG ĐA DẠNG CHO TRẠM 3 (ĐẢM BẢO LUÔN ĐỔI CHỦ ĐỀ)
const FALLBACK_BOSS_POOL: Record<CEFRLevel, BossChallenge[]> = {
  A1: [
    { sentence: "Practice speaking English every single day.", translation: "Hãy luyện nói Tiếng Anh mỗi ngày.", hint: "Chú ý đọc rõ âm /s/ trong 'Practice'." },
    { sentence: "Welcome to the Cyberpunk language arena.", translation: "Chào mừng bạn đến với đấu trường ngôn ngữ Cyberpunk.", hint: "Nhấn giọng ở từ 'Cyberpunk'." },
    { sentence: "Listen carefully and repeat after the sound cue.", translation: "Nghe kỹ và nhắc lại theo tín hiệu âm thanh.", hint: "Đọc nối âm nhẹ giữa 'Listen' và 'carefully'." }
  ],
  A2: [
    { sentence: "Future technology is changing how we learn languages.", translation: "Công nghệ tương lai đang thay đổi cách chúng ta học ngôn ngữ.", hint: "Chú ý trọng âm từ 'technology'." },
    { sentence: "Stay focused and try to pronounce each word clearly.", translation: "Hãy tập trung và cố gắng phát âm rõ từng từ.", hint: "Nhấn mạnh từ 'focused' và 'clearly'." },
    { sentence: "Teamwork and practice lead to incredible progress.", translation: "Làm việc nhóm và luyện tập sẽ đem lại tiến bộ kinh ngạc.", hint: "Phát âm chuẩn âm đuôi /s/ trong 'progress'." }
  ],
  B1: [
    { sentence: "Artificial intelligence is rapidly transforming global business strategies.", translation: "Trí tuệ nhân tạo đang nhanh chóng thay đổi chiến lược kinh doanh toàn cầu.", hint: "Chú ý nối âm giữa 'business' và 'strategies'." },
    { sentence: "Effective communication requires both active listening and speaking accuracy.", translation: "Giao tiếp hiệu quả đòi hỏi cả kỹ năng nghe chủ động và độ chính xác khi nói.", hint: "Ngắt nhịp tự nhiên sau cụm 'Effective communication'." },
    { sentence: "Adapting to new digital tools helps students achieve higher performance.", translation: "Thích ứng với các công cụ kỹ thuật số mới giúp học sinh đạt hiệu suất cao hơn.", hint: "Nhấn trọng âm ở 'digital' và 'performance'." }
  ],
  B2: [
    { sentence: "Cybersecurity measures are essential for protecting modern digital infrastructure.", translation: "", hint: "Maintain steady rhythm and intonation." },
    { sentence: "Data analytics empowers companies to make smarter operational decisions.", translation: "", hint: "Focus on clear stress placement in 'operational'." }
  ],
  C1: [
    { sentence: "Continuous learning and adaptive feedback mechanisms are key to mastering natural language fluency.", translation: "", hint: "Pay attention to connected speech and elision." },
    { sentence: "Navigating complex professional environments demands nuanced communication skills.", translation: "", hint: "Focus on natural sentence rhythm and speed." }
  ]
};

export default function BossRaidScreen({ onBack, onNavigateToOasis }: Props) {
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A1');
  const [bossChallenge, setBossChallenge] = useState<BossChallenge>({ sentence: '', translation: '', hint: '' });
  const [loadingBoss, setLoadingBoss] = useState<boolean>(true);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  const [streak, setStreak] = useState<number>(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

  // 🎯 HÀM LẤY ĐỀ BÀI MỚI (CHẮC CHẮN 100% THAY ĐỔI CÂU/CHỦ ĐỀ)
  const fetchNewBossChallenge = async (level = cefrLevel) => {
    setLoadingBoss(true);
    setResult(null);
    setRecordedAudioUri(null);

    const randomNonce = Date.now() + Math.floor(Math.random() * 100000);

    let promptRule = '';
    if (level === 'A1' || level === 'A2') {
      promptRule = 'Simple 5-7 word sentence. Return 100% VIETNAMESE translation and clear pronunciation hint.';
    } else if (level === 'B1') {
      promptRule = '8-10 word sentence. Return BILINGUAL (Vietnamese) translation and linking sound hint.';
    } else {
      promptRule = '11-15 word complex native sentence. Return 100% ENGLISH hint without translation.';
    }

    const prompt = `Generate ONE UNIQUE Boss Raid English sentence for CEFR Level ${level}.
- Rule: ${promptRule}
- Unique Identifier: ${randomNonce}

Return ONLY valid JSON format:
{
  "sentence": "English sentence here",
  "translation": "Vietnamese translation",
  "hint": "Phonetics/linking hint"
}`;

    try {
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-20b',
        temperature: 0.98,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
      
      if (parsed.sentence && parsed.sentence.trim() !== bossChallenge.sentence) {
        setBossChallenge({
          sentence: parsed.sentence.trim(),
          translation: parsed.translation || '',
          hint: parsed.hint || ''
        });
      } else {
        // Lọc lấy câu ngẫu nhiên khác câu hiện tại từ kho dự phòng
        const pool = FALLBACK_BOSS_POOL[level];
        const filtered = pool.filter(item => item.sentence !== bossChallenge.sentence);
        const randomItem = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : pool[0];
        setBossChallenge(randomItem);
      }
    } catch (e) {
      // Khi gặp lỗi API, tự động rút ngẫu nhiên từ kho dự phòng
      const pool = FALLBACK_BOSS_POOL[level];
      const filtered = pool.filter(item => item.sentence !== bossChallenge.sentence);
      const randomItem = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : pool[0];
      setBossChallenge(randomItem);
    } finally {
      setLoadingBoss(false);
    }
  };

  useEffect(() => {
    fetchNewBossChallenge(cefrLevel);
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

      const res = await gradeFlexibleArenaResponse(blob, bossChallenge.sentence);

      if (res.score >= 75) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak >= 3) {
          res.score = Math.min(100, res.score * 2);
          res.isStreaking = true;
        }
        setResult(res);

        setTimeout(() => {
          fetchNewBossChallenge(cefrLevel);
        }, 1500);

      } else {
        setStreak(0);
        setResult(res);
        if (onNavigateToOasis) setTimeout(() => onNavigateToOasis(bossChallenge.sentence), 2000);
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
        {/* 📊 CHỌN CẤP ĐỘ CEFR */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>📊 CHỌN CẤP ĐỘ BOSS (CEFR):</Text>
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

        {loadingBoss ? (
          <ActivityIndicator size="large" color="#FF0055" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.bossCard}>
            <Text style={styles.bossTag}>👹 SHADOW BOSS CHALLENGE [{cefrLevel}]</Text>
            <Text style={styles.targetSentence}>"{bossChallenge.sentence}"</Text>

            {/* SONG NGỮ CHO A1, A2, B1 */}
            {(cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1') && bossChallenge.translation ? (
              <Text style={styles.translationText}>🇻🇳 Nghĩa: "{bossChallenge.translation}"</Text>
            ) : null}

            {bossChallenge.hint ? (
              <Text style={styles.hintText}>💡 Gợi ý: {bossChallenge.hint}</Text>
            ) : null}

            <TouchableOpacity 
              style={styles.speakerBtn} 
              onPress={() => speakNaturalText(bossChallenge.sentence, { voiceName: 'en-US-GuyNeural', style: 'shouting', rate: '+5%' })}
            >
              <Text style={styles.speakerText}>🔊 NGHE BOSS MẪU</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchNewBossChallenge(cefrLevel)}>
          <Text style={styles.refreshText}>🔄 ĐỔI THÁCH THỨC BOSS MỚI ({cefrLevel})</Text>
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
  container: { flex: 1, backgroundColor: '#05020D', padding: 16, paddingTop: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#0D0620', borderRadius: 6, borderWidth: 1, borderColor: '#FF0055' },
  backText: { color: '#FF0055', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF0055', fontSize: 12, fontWeight: '900' },
  streakBadge: { backgroundColor: '#221133', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F' },
  activeStreak: { borderColor: '#39FF14', backgroundColor: '#004411' },
  streakText: { color: '#39FF14', fontSize: 10, fontWeight: 'bold' },

  sectionBox: { width: '100%', marginBottom: 12, backgroundColor: '#120826', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#2A1040' },
  sectionLabel: { color: '#FF0055', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelBtn: { flex: 1, paddingVertical: 8, marginHorizontal: 2, backgroundColor: '#1A0B36', borderRadius: 8, borderWidth: 1, borderColor: '#3A1559', alignItems: 'center' },
  activeLevelBtn: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  levelBtnText: { color: '#8888CC', fontSize: 11, fontWeight: 'bold' },
  activeLevelText: { color: '#FFFFFF', fontWeight: '900' },

  bossCard: { backgroundColor: '#1A000A', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FF0055', width: '100%', alignItems: 'center', marginBottom: 12 },
  bossTag: { color: '#FF0055', fontSize: 9, fontWeight: 'bold', marginBottom: 6 },
  targetSentence: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  translationText: { color: '#00FFCC', fontSize: 12, fontStyle: 'italic', marginBottom: 6, textAlign: 'center' },
  hintText: { color: '#FFD700', fontSize: 10, textAlign: 'center', marginBottom: 10 },

  speakerBtn: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#00FFFF' },
  speakerText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },

  refreshBtn: { backgroundColor: '#110022', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 12 },
  refreshText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#FF0055', padding: 13, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  recordText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  resultCard: { backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', width: '100%', alignItems: 'center', marginBottom: 20 },
  resultScore: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  transcribedText: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 6, backgroundColor: '#05020D', padding: 6, borderRadius: 6 },
  breakdownText: { color: '#FF0055', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#39FF14', fontSize: 10, textAlign: 'center', marginBottom: 8 },
  replayBtn: { backgroundColor: '#00FFFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  replayText: { color: '#000', fontSize: 9, fontWeight: 'bold' }
});