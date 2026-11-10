// src/screens/Station3Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BOSS_SCENARIOS_DATA, BossScenarioItem } from '../data/station3/bossScenarios';
import { updateUserProgress } from '../services/userService';
import { playBossVoice } from '../services/bossTtsService';
import { evaluateSpeaking, AssessmentResult, generateWordDiff } from '../services/arena/assessmentService';
import AudioWaveVisualizer from '../components/AudioWaveVisualizer';
import IntonationCanvas from '../components/IntonationCanvas';

interface Props {
  onBack: () => void;
}

// Hàm trích xuất cao độ F0 cơ bản phía Client (Autocorrelation)
function detectPitchFrame(buffer: Float32Array, sampleRate: number): number | null {
  const size = buffer.length;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return null;

  for (let offset = Math.floor(sampleRate / 450); offset < Math.floor(sampleRate / 70); offset++) {
    let correlation = 0;
    for (let i = 0; i < size - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.4 && bestOffset > 0) {
    const pitch = sampleRate / bestOffset;
    if (pitch >= 75 && pitch <= 420) return pitch;
  }
  return null;
}

function smoothContour(arr: number[]): number[] {
  if (arr.length <= 2) return arr;
  const medianFiltered: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const prev = arr[i - 1] ?? arr[i];
    const curr = arr[i];
    const next = arr[i + 1] ?? arr[i];
    const sorted = [prev, curr, next].sort((a, b) => a - b);
    medianFiltered.push(sorted[1]);
  }
  const smoothed: number[] = [];
  for (let i = 0; i < medianFiltered.length; i++) {
    const prev = medianFiltered[i - 1] ?? medianFiltered[i];
    const curr = medianFiltered[i];
    const next = medianFiltered[i + 1] ?? medianFiltered[i];
    const val = (prev + curr * 2 + next) / 4;
    smoothed.push(+val.toFixed(2));
  }
  return smoothed;
}

const getSupportedAudioMimeType = (): { mimeType: string; extension: string } => {
  if (typeof window === 'undefined' || !(window as any).MediaRecorder) {
    return { mimeType: '', extension: 'webm' };
  }
  const MediaRecorderClass = (window as any).MediaRecorder;
  if (typeof MediaRecorderClass.isTypeSupported === 'function') {
    if (MediaRecorderClass.isTypeSupported('audio/webm;codecs=opus')) return { mimeType: 'audio/webm;codecs=opus', extension: 'webm' };
    if (MediaRecorderClass.isTypeSupported('audio/webm')) return { mimeType: 'audio/webm', extension: 'webm' };
    if (MediaRecorderClass.isTypeSupported('audio/mp4')) return { mimeType: 'audio/mp4', extension: 'mp4' };
    if (MediaRecorderClass.isTypeSupported('audio/aac')) return { mimeType: 'audio/aac', extension: 'aac' };
  }
  return { mimeType: '', extension: 'webm' };
};

export default function Station3Screen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [currentHp, setCurrentHp] = useState<number>(150);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // 🎯 QUẢN LÝ ĐỀ BÀI VÀ HÀNG ĐỢI NẠP BÙ AI NGẦM (0MS LATENCY)
  const [bossIndex, setBossIndex] = useState<number>(0);
  const [aiQueue, setAiQueue] = useState<BossScenarioItem[]>([]);
  const isFetchingAiRef = useRef<boolean>(false);

  const getInitialBossForLevel = (lvl: string): BossScenarioItem => {
    const list = BOSS_SCENARIOS_DATA.filter(item => item.level === lvl);
    if (list.length > 0) return list[0];
    return {
      id: `boss_${lvl}_default`,
      level: lvl as any,
      bossName: 'Ghost Speed Stalker',
      bossTitle: 'Bóng Ma Tốc Độ',
      bossAvatar: '👻',
      maxHp: 150,
      timeLimitSeconds: 12,
      bossChallengeEn: "Whispers in the dark connected speech. Break the silence immediately!",
      bossChallengeVi: "Lời thì thầm trong bóng đêm nối âm liên tục. Hãy phá vỡ sự im lặng ngay lập tức!",
      expectedResponsePromptEn: "Shadow the sentence as fast and accurately as possible.",
      keyTargetPhrases: ["whispers", "connected speech", "silence"]
    };
  };

  const [bossData, setBossData] = useState<BossScenarioItem>(() => getInitialBossForLevel('B1'));

  // ⚡ CƠ CHẾ ĐO TỐC ĐỘ, ĐẾM NGƯỢC & HỆ SỐ SÁT THƯƠNG
  const [timeRemaining, setTimeRemaining] = useState<number>(12);
  const [speechDuration, setSpeechDuration] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [isCritical, setIsCritical] = useState<boolean>(false);
  const timerCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  // QUẢN LÝ MICRO & THU ÂM
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasRecordedCurrentSession, setHasRecordedCurrentSession] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [lastBaseScore, setLastBaseScore] = useState<number | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string>('');
  const [transcriptResult, setTranscriptResult] = useState<string>('');
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  // 📈 DỮ LIỆU ĐƯỜNG CONG NGỮ ĐIỆU (INTONATION CONTOUR)
  const [studentContour, setStudentContour] = useState<number[]>([]);
  const [targetContour, setTargetContour] = useState<number[]>([0.5, 1.8, 2.2, 1.5, 0.2, -1.0, -2.5, -3.2]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeMimeTypeRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' });

  // Audio Context cho Pitch Extraction
  const audioContextRef = useRef<AudioContext | null>(null);
  const pitchIntervalRef = useRef<any>(null);
  const pitchSamplesRef = useRef<number[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const stopAllAudio = () => {
    // Dừng âm thanh máy chủ Edge-TTS (HTML5 Audio)
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    // Dừng âm thanh trình duyệt nếu có fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const resetSession = () => {
    stopAllAudio();
    if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
    if (speechTimerRef.current) clearInterval(speechTimerRef.current);
    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setActiveStream(null);
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setHasRecordedCurrentSession(false);
    setLastDamage(null);
    setLastBaseScore(null);
    setLastFeedback('');
    setTranscriptResult('');
    setSpeechDuration(0);
    setSpeedMultiplier(1.0);
    setIsCritical(false);
    setTimeRemaining(bossData?.timeLimitSeconds || 12);
    audioChunksRef.current = [];
  };

  // 🎙️ PHÁT GIỌNG SHADOW BOSS TỪ SERVER (CHRISTOPHER NEURAL - NAM TRẦM UY QUYỀN)
  const playNaturalTTS = async (text: string) => {
    if (isPlayingAudio) {
      stopAllAudio();
      return;
    }

    const cleanText = text.replace(/["']/g, '').trim();
    if (!cleanText) return;

    setIsPlayingAudio(true);

    // ⚡ LỚP 1: GỌI API SERVER VỚI GIỌNG ONYX (en-US-ChristopherNeural)
    try {
      const bossTtsUrl = `/api/tts?voice=onyx&text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(bossTtsUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
      };

      audio.onerror = () => {
        console.warn("Server TTS không tải được, kích hoạt fallback máy khách...");
        playLocalBossFallback(cleanText);
      };

      await audio.play();
      return;
    } catch (e) {
      console.warn("Lỗi phát audio server Shadow Boss:", e);
      playLocalBossFallback(cleanText);
    }
  };

  // 🛡️ LỚP 2: DỰ PHÒNG NỘI BỘ NẾU MẤT KẾT NỐI MẠNG
  const playLocalBossFallback = (cleanText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingAudio(false);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synth.getVoices();
    // Ưu tiên chọn giọng nam cho Boss nếu chạy fallback
    const maleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Guy') || v.name.includes('Mark') || v.name.includes('Aaron')));
    if (maleVoice) utterance.voice = maleVoice;

    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Tốc độ chậm hơn tạo vẻ bí ẩn
    utterance.pitch = 0.8; // Hạ tone giọng trầm xuống

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    synth.speak(utterance);
  };

  // 🤖 NẠP BÙ AI NGẦM CHO TRẠM 3 (KHÔNG LÀM ĐỨNG MÀN HÌNH)
  const triggerBackgroundAiRefill = async (level: string) => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey || isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      const prompt = `Generate 1 unique shadow challenge sentence for Station 3 Speed Shadowing at CEFR level ${level}.
Output JSON ONLY:
{
  "bossName": "Name of Shadow Entity",
  "bossTitle": "Title in Vietnamese",
  "bossAvatar": "👻",
  "maxHp": 150,
  "timeLimitSeconds": 12,
  "bossChallengeEn": "A fluent, natural English spoken sentence to shadow fast",
  "bossChallengeVi": "Vietnamese translation",
  "keyTargetPhrases": ["phrase 1", "phrase 2"]
}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 1.0,
          response_format: { type: 'json_object' }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(data.choices[0].message.content);
        const newBoss: BossScenarioItem = {
          id: `ai_${Date.now()}`,
          level: level as any,
          bossName: `🤖 ${content.bossName}`,
          bossTitle: content.bossTitle || 'Bóng Ma Tốc Độ',
          bossAvatar: content.bossAvatar || '👻',
          maxHp: content.maxHp || 150,
          timeLimitSeconds: content.timeLimitSeconds || 12,
          bossChallengeEn: content.bossChallengeEn,
          bossChallengeVi: content.bossChallengeVi || '',
          expectedResponsePromptEn: 'Shadow fast to deal critical damage.',
          keyTargetPhrases: content.keyTargetPhrases || []
        };
        setAiQueue(prev => [...prev, newBoss]);
      }
    } catch (e) {
      console.warn("AI ngầm Trạm 3 tạm dừng:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  // ⚡ ĐỔI ĐỀ TỨC THÌ 0MS + GỌI BÙ ĐỀ
  const handleNextChallenge = () => {
    resetSession();
    const nextIdx = bossIndex + 1;
    setBossIndex(nextIdx);

    if (aiQueue.length > 0) {
      const [nextAi, ...rest] = aiQueue;
      setAiQueue(rest);
      setBossData(nextAi);
      setCurrentHp(nextAi.maxHp || 150);
      setTimeRemaining(nextAi.timeLimitSeconds || 12);
      triggerBackgroundAiRefill(cefrLevel);
      return;
    }

    const list = BOSS_SCENARIOS_DATA.filter(b => b.level === cefrLevel);
    if (list.length > 0) {
      const picked = list[nextIdx % list.length];
      const loop = Math.floor(nextIdx / list.length) + 1;
      setBossData({ ...picked, bossName: loop > 1 ? `${picked.bossName} (#${loop})` : picked.bossName });
      setCurrentHp(picked.maxHp || 150);
      setTimeRemaining(picked.timeLimitSeconds || 12);
    }
    triggerBackgroundAiRefill(cefrLevel);
  };

  const handleLevelChange = (lvl: string) => {
    if (lvl === cefrLevel) return;
    resetSession();
    setCefrLevel(lvl);
    setBossIndex(0);
    setAiQueue([]);
    const initial = getInitialBossForLevel(lvl);
    setBossData(initial);
    setCurrentHp(initial.maxHp || 150);
    setTimeRemaining(initial.timeLimitSeconds || 12);
    triggerBackgroundAiRefill(lvl);
  };

  useEffect(() => {
    const initial = getInitialBossForLevel(cefrLevel);
    setBossData(initial);
    setCurrentHp(initial.maxHp || 150);
    setTimeRemaining(initial.timeLimitSeconds || 12);
    triggerBackgroundAiRefill(cefrLevel);
    return () => resetSession();
  }, []);

  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });
        setActiveStream(stream);

        const format = getSupportedAudioMimeType();
        activeMimeTypeRef.current = format;

        pitchSamplesRef.current = [];

        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const sourceNode = audioCtx.createMediaStreamSource(stream);
            const analyserNode = audioCtx.createAnalyser();
            analyserNode.fftSize = 2048;
            sourceNode.connect(analyserNode);

            const buffer = new Float32Array(analyserNode.fftSize);
            pitchIntervalRef.current = setInterval(() => {
              analyserNode.getFloatTimeDomainData(buffer);
              const pitch = detectPitchFrame(buffer, audioCtx.sampleRate);
              if (pitch) {
                pitchSamplesRef.current.push(pitch);
              }
            }, 60);
          }
        } catch (ctxErr) {
          console.warn("Pitch analysis context bypassed:", ctxErr);
        }

        const mediaRecorder = new MediaRecorder(stream, format.mimeType ? { mimeType: format.mimeType } : undefined);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, format.mimeType ? { type: format.mimeType } : undefined);
          if (blob.size > 800) {
            setAudioBlob(blob);
            setAudioUrl(URL.createObjectURL(blob));
            setHasRecordedCurrentSession(true);
          } else {
            Alert.alert("Thông báo", "⚠️ Chưa thu được giọng nói! Hãy Shadowing nhanh và to hơn.");
          }

          if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try { audioContextRef.current.close(); } catch (e) {}
          }

          const validSamples = pitchSamplesRef.current.filter(p => p >= 75 && p <= 420);
          if (validSamples.length >= 4) {
            const meanPitch = validSamples.reduce((a, b) => a + b, 0) / validSamples.length;
            const normalized = (rawSamples: number[]) => rawSamples.map(f => +(12 * Math.log2(f / meanPitch)).toFixed(2));
            const smoothed = smoothContour(normalized(validSamples));
            setStudentContour(smoothed);
          } else {
            setStudentContour([0.2, 0.8, 1.2, 0.6, -0.4, -1.2]);
          }

          stream.getTracks().forEach(t => t.stop());
          setActiveStream(null);
        };

        mediaRecorder.start(100);
        setIsRecording(true);
        setSpeechDuration(0);
        setTimeRemaining(bossData?.timeLimitSeconds || 12);

        speechTimerRef.current = setInterval(() => {
          setSpeechDuration(prev => prev + 1);
        }, 1000);

        timerCountdownRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
              if (speechTimerRef.current) clearInterval(speechTimerRef.current);
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
              setIsRecording(false);
              Alert.alert("Hết giờ!", "⏳ Hết thời gian phản xạ tốc độ!");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch {
        Alert.alert("Lỗi Micro", "🔒 Vui lòng cấp quyền Microphone trên trình duyệt!");
      }
    } else {
      if (timerCountdownRef.current) clearInterval(timerCountdownRef.current);
      if (speechTimerRef.current) clearInterval(speechTimerRef.current);
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleAttackBoss = async () => {
    if (!hasRecordedCurrentSession || !audioBlob) {
      Alert.alert("Thông báo", "🔒 Bạn cần đọc đuổi (Shadowing) xong rồi mới tấn công!");
      return;
    }

    setIsAnalyzing(true);
    setLastFeedback('');

    try {
      const targetPrompt = `Shadowing phrase: ${bossData.bossChallengeEn}`;
      const evalResult = await evaluateSpeaking(audioBlob, cefrLevel, '3', targetPrompt);
      setTranscriptResult(evalResult.transcript || '');

      const baseScore = evalResult.score;
      setLastBaseScore(baseScore);

      if (baseScore < 30) {
        setLastDamage(0);
        setLastFeedback("❌ Phát âm chưa đạt chuẩn! Đòn đánh bị hụt.");
      } else {
        // ⚡ TÍNH SÁT THƯƠNG THEO TỐC ĐỘ PHẢN XẠ (SPEED MULTIPLIER)
        const maxLimit = bossData.timeLimitSeconds || 12;
        const ratio = speechDuration / maxLimit;
        let mult = 1.0;
        let critical = false;

        if (ratio <= 0.35) {
          mult = 2.0;
          critical = true;
        } else if (ratio <= 0.60) {
          mult = 1.4;
          critical = true;
        } else if (ratio <= 0.85) {
          mult = 1.1;
        }

        setSpeedMultiplier(mult);
        setIsCritical(critical);

        const finalDamage = Math.round(baseScore * mult);
        const newHp = Math.max(0, currentHp - finalDamage);
        setCurrentHp(newHp);
        setLastDamage(finalDamage);

        const notice = critical 
          ? `🔥 BẠO KÍCH TỐC ĐỘ (x${mult})! Phản xạ trong ${speechDuration}s!` 
          : `⚡ Tốc độ phản xạ: ${speechDuration}s (Hệ số x${mult}).`;
        setLastFeedback(`${notice} | ${evalResult.detailedFeedback || 'Shadowing rất chuẩn nhịp!'}`);

        if (newHp === 0) {
          updateUserProgress(3, 100, true);
        }
      }
    } catch {
      Alert.alert("Lỗi", "Không thể phân tích giọng nói. Vui lòng thử lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const maxLimit = bossData.timeLimitSeconds || 12;
  const timePercent = Math.max(0, Math.min(100, (timeRemaining / maxLimit) * 100));

  return (
    <View style={styles.container}>
      {/* HEADER BẢO ĐẢM NÚT EXIT VÀ TITLE TRẠM 3 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>⬅ EXIT</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👻 TRẠM 3: GHOST SPEED RAID</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 35 }}>
        {/* BANNER THÔNG TIN PHÒNG HỌC & MSSV */}
        <View style={styles.studentInfoBanner}>
          <Text style={styles.studentModeTag}>[ SHADOWING ECHO MODE ]</Text>
          <Text style={styles.studentNameTag}>👤 Chiến Binh Shadow (MSSV: GUEST) | 🏫 LỚP CHUNG</Text>
        </View>

        {/* CHỌN CẤP ĐỘ CEFR */}
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map(lvl => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]}
              onPress={() => handleLevelChange(lvl)}
            >
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KHUNG BOSS VÀ THANH MÁU */}
        <View style={styles.bossCard}>
          <View style={styles.bossHeaderRow}>
            <Text style={styles.bossName}>{bossData.bossAvatar} {bossData.bossName} ({bossData.bossTitle}) [{cefrLevel}]</Text>
            <TouchableOpacity style={styles.switchBossBtn} onPress={handleNextChallenge} activeOpacity={0.7}>
              <Text style={styles.switchBossBtnText}>🔄 ĐỔI CÂU KHÁC (0MS)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hpBarBg}>
            <View style={[styles.hpBarFill, { width: `${(currentHp / (bossData.maxHp || 150)) * 100}%` }]} />
          </View>
          <Text style={styles.hpText}>
            {currentHp > 0 ? `HP: ${currentHp} / ${bossData.maxHp || 150}` : '☠ BOSS ĐÃ BỊ HẠ GỤC BỞI TỐC ĐỘ!'}
          </Text>
        </View>

        {/* CÂU THOẠI SHADOWING & NÚT NGHE MẪU */}
        <View style={styles.phraseCard}>
          <Text style={styles.phraseText}>"{bossData.bossChallengeEn}"</Text>
          {bossData.bossChallengeVi && (
            <Text style={styles.promptViText}>👉 Dịch: "{bossData.bossChallengeVi}"</Text>
          )}

          <TouchableOpacity 
            style={[styles.audioBtn, isPlayingAudio && styles.audioBtnPlaying]} 
            onPress={() => playNaturalTTS(bossData.bossChallengeEn)}
          >
            <Text style={styles.audioBtnText}>
              {isPlayingAudio ? '🔊 ĐANG ĐỌC MẪU...' : '📢 NGHE BÓNG MA ĐỌC MẪU'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* THANH ĐẾM NGƯỢC TỐC ĐỘ TẤN CÔNG */}
        <View style={styles.speedTimerCard}>
          <View style={styles.speedTimerHeader}>
            <Text style={styles.speedTimerTitle}>
              {isRecording ? `⚡ TỐC ĐỘ NÓI: ${speechDuration}s / ${maxLimit}s` : `⏱️ CỬA SỔ PHẢN XẠ: ${timeRemaining}s`}
            </Text>
            <Text style={[styles.speedStatusText, isRecording && { color: '#39FF14' }]}>
              {isRecording ? '🔴 ĐANG TÍNH TỐC ĐỘ...' : '⚪ NÓI CÀNG NHANH - SÁT THƯƠNG CÀNG LỚN (LÊN ĐẾN X2.0)'}
            </Text>
          </View>
          <View style={styles.speedBarBg}>
            <View style={[
              styles.speedBarFill, 
              { 
                width: `${timePercent}%`,
                backgroundColor: timePercent > 50 ? '#39FF14' : timePercent > 25 ? '#FFD700' : '#FF0055'
              }
            ]} />
          </View>
        </View>

        {/* DẢI SÓNG ÂM TRỰC TIẾP KHI GHI ÂM */}
        <AudioWaveVisualizer stream={activeStream} isRecording={isRecording} barColor="#00FFFF" />

        {/* NÚT THU ÂM VÀ TẤN CÔNG */}
        <View style={{ width: '100%', marginBottom: 15 }}>
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
            onPress={handleToggleRecord}
          >
            <Text style={styles.recordText}>
              {isRecording 
                ? '🛑 NÓI XONG BẤM DỪNG NGAY ĐỂ LẤY BẠO KÍCH!' 
                : hasRecordedCurrentSession 
                ? `✅ ĐÃ THU TRONG ${speechDuration}s (BẤM ĐỂ NÓI LẠI)` 
                : '🎙️ BẮT ĐẦU ĐỌC ĐUỔI (SHADOWING TỐC ĐỘ)'}
            </Text>
          </TouchableOpacity>

          {isAnalyzing ? (
            <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 10 }} />
          ) : (
            <TouchableOpacity 
              style={[styles.attackBtn, !hasRecordedCurrentSession && styles.attackBtnDisabled]} 
              onPress={handleAttackBoss}
              disabled={!hasRecordedCurrentSession || isRecording}
            >
              <Text style={styles.attackBtnText}>
                {hasRecordedCurrentSession ? `⚔️ TẤN CÔNG BOSS TỐC ĐỘ (${speechDuration}s)` : '🔒 BẮT BUỘC ĐỌC ĐUỔI ĐỂ TẤN CÔNG'}
              </Text>
            </TouchableOpacity>
          )}

          {/* HIỂN THỊ KẾT QUẢ ĐÒN ĐÁNH & SÁT THƯƠNG */}
          {lastDamage !== null && (
            <View style={styles.damageCard}>
              <Text style={[styles.damageTitle, { color: lastDamage > 0 ? '#39FF14' : '#FF0055' }]}>
                {lastDamage > 0 ? (isCritical ? `🔥 BẠO KÍCH TỐC ĐỘ! -${lastDamage} HP` : `💥 TẤN CÔNG THÀNH CÔNG: -${lastDamage} HP`) : '🛡️ ĐÒN ĐÁNH BỊ HỤT!'}
              </Text>
              {lastBaseScore !== null && lastDamage > 0 && (
                <Text style={styles.formulaText}>
                  Điểm: <Text style={{ color: '#39FF14' }}>{lastBaseScore}</Text> ✖ Tốc độ: <Text style={{ color: '#FFD700' }}>x{speedMultiplier}</Text> = <Text style={{ color: '#FF0055' }}>-{lastDamage} HP</Text>
                </Text>
              )}
              <Text style={styles.scoreText}>SCORE: {lastBaseScore || 0} / 100 ĐIỂM</Text>
              {lastFeedback ? <Text style={styles.feedbackText}>{lastFeedback}</Text> : null}
            </View>
          )}

          {/* 📈 BIỂU ĐỒ ĐƯỜNG CONG NGỮ ĐIỆU (INTONATION CANVAS) */}
          <View style={styles.intonationContainer}>
            <Text style={styles.intonationTitle}>📈 ĐƯỜNG CONG NGỮ ĐIỆU (PITCH INTONATION):</Text>
            <IntonationCanvas targetContour={targetContour} studentContour={studentContour} />
          </View>

          {/* 🎯 KẾT QUẢ ĐỌC ĐUỔI TỪNG TỪ (WORD HIGHLIGHT DIFF) */}
          {transcriptResult ? (
            <View style={styles.wordHighlightBox}>
              <Text style={styles.wordHighlightTitle}>🎯 KẾT QUẢ ĐỌC ĐUỔI TỪNG TỪ:</Text>
              <View style={styles.wordRow}>
                {generateWordDiff(bossData.bossChallengeEn, transcriptResult).map((item, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.wordBadge, 
                      item.status === 'correct' ? styles.correctBadge : styles.incorrectBadge
                    ]}
                  >
                    <Text style={[styles.wordBadgeText, item.status === 'correct' ? styles.correctText : styles.incorrectText]}>
                      {item.word} {item.status === 'correct' ? '✓' : '✗'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 🎧 NGHE LẠI BÀI ĐỌC ĐUỔI CỦA BẠN (HTML5 AUDIO PLAYER) */}
          {audioUrl && !isRecording && (
            <View style={styles.audioPreviewContainer}>
              <Text style={styles.audioPreviewTitle}>🎧 Nghe lại bài đọc đuổi của bạn:</Text>
              {React.createElement('audio', {
                controls: true,
                src: audioUrl,
                style: { width: '100%', height: '38px', marginTop: '6px' }
              })}
              {transcriptResult ? (
                <Text style={styles.transcriptNotice}>💬 AI nghe được: "{transcriptResult}"</Text>
              ) : null}
            </View>
          )}
        </View>

        {currentHp === 0 && (
          <TouchableOpacity style={styles.refreshBtn} onPress={handleNextChallenge}>
            <Text style={styles.refreshText}>🔄 THÁCH ĐẤU VÒNG TIẾP THEO</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },

  studentInfoBanner: { width: '100%', alignItems: 'center', marginBottom: 12 },
  studentModeTag: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 2 },
  studentNameTag: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold' },

  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 14 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },

  bossCard: { backgroundColor: '#1A0B2E', padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#FF007F', width: '100%', marginBottom: 12 },
  bossHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bossName: { color: '#FFD700', fontSize: 12, fontWeight: '900', flex: 1 },
  switchBossBtn: { backgroundColor: '#0D0620', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  switchBossBtnText: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },
  hpBarBg: { width: '100%', height: 10, backgroundColor: '#331122', borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
  hpBarFill: { height: '100%', backgroundColor: '#FF0055' },
  hpText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },

  phraseCard: { backgroundColor: '#0D0620', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 12 },
  phraseText: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  promptViText: { color: '#FFD700', fontSize: 11, fontStyle: 'italic', marginBottom: 10, textAlign: 'center' },
  audioBtn: { backgroundColor: '#1A0B2E', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  audioBtnPlaying: { backgroundColor: '#00FFFF' },
  audioBtnText: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },

  speedTimerCard: { width: '100%', backgroundColor: '#120826', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FFD700', marginBottom: 10 },
  speedTimerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  speedTimerTitle: { color: '#FFD700', fontSize: 10, fontWeight: '900' },
  speedStatusText: { color: '#8888AA', fontSize: 8.5, fontStyle: 'italic' },
  speedBarBg: { width: '100%', height: 8, backgroundColor: '#221133', borderRadius: 4, overflow: 'hidden' },
  speedBarFill: { height: '100%' },

  recordBtn: { backgroundColor: '#00FFFF', paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 },
  recordBtnActive: { backgroundColor: '#FF0055' },
  recordText: { color: '#000', fontSize: 11, fontWeight: '900' },
  attackBtn: { backgroundColor: '#FF007F', paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  attackBtnDisabled: { backgroundColor: '#331122', opacity: 0.3 },
  attackBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  damageCard: { width: '100%', backgroundColor: '#130628', padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#39FF14', marginTop: 10, alignItems: 'center' },
  damageTitle: { fontSize: 11.5, fontWeight: '900', marginBottom: 4 },
  formulaText: { color: '#FFF', fontSize: 9.5, marginBottom: 4 },
  scoreText: { color: '#FF0055', fontSize: 14, fontWeight: '900', marginVertical: 4 },
  feedbackText: { color: '#00FFFF', fontSize: 9.5, textAlign: 'center', fontStyle: 'italic' },

  intonationContainer: { width: '100%', backgroundColor: '#070314', borderRadius: 12, borderWidth: 1.5, borderColor: '#00FFFF', padding: 10, marginVertical: 10 },
  intonationTitle: { color: '#00FFFF', fontSize: 9.5, fontWeight: '900', marginBottom: 6 },

  wordHighlightBox: { width: '100%', backgroundColor: '#070314', borderRadius: 12, borderWidth: 1.5, borderColor: '#00FFFF', padding: 10, marginBottom: 10 },
  wordHighlightTitle: { color: '#00FFFF', fontSize: 9.5, fontWeight: '900', marginBottom: 6 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  correctBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', borderColor: '#39FF14' },
  incorrectBadge: { backgroundColor: 'rgba(255, 0, 85, 0.15)', borderColor: '#FF0055' },
  wordBadgeText: { fontSize: 11, fontWeight: 'bold' },
  correctText: { color: '#39FF14' },
  incorrectText: { color: '#FF0055' },

  audioPreviewContainer: { width: '100%', backgroundColor: '#130628', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginTop: 10 },
  audioPreviewTitle: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },
  transcriptNotice: { color: '#AAAABB', fontSize: 9.5, fontStyle: 'italic', marginTop: 4, textAlign: 'center' },

  refreshBtn: { backgroundColor: '#39FF14', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
  refreshText: { color: '#000', fontSize: 11, fontWeight: '900' }
});