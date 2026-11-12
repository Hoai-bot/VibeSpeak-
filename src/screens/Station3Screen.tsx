// src/screens/Station3Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BOSS_SCENARIOS_DATA, BossScenarioItem } from '../data/station3/bossScenarios';
import { updateUserProgress } from '../services/userService';
import { evaluateSpeaking, AssessmentResult, generateWordDiff } from '../services/arena/assessmentService';
import AudioWaveVisualizer from '../components/AudioWaveVisualizer';
import IntonationCanvas from '../components/IntonationCanvas';

interface Props {
  onBack: () => void;
}

export interface Station3DrillHint {
  vi: string;
}

// 🌊 CLIENT-SIDE F0 AUTOCORRELATION
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

  // 🌐 GỢI Ý THUẦN TIẾNG VIỆT
  const [showHint, setShowHint] = useState<boolean>(true);

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
      bossTitle: 'Thử Thách Tốc Độ',
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

  // ⚡ SPEED TIMING, COUNTDOWN & DAMAGE MULTIPLIER
  const [timeRemaining, setTimeRemaining] = useState<number>(12);
  const [speechDuration, setSpeechDuration] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [isCritical, setIsCritical] = useState<boolean>(false);
  const timerCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  // MICROPHONE & RECORDING
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

  // 📈 INTONATION CONTOUR DATA
  const [studentContour, setStudentContour] = useState<number[]>([]);
  const [targetContour, setTargetContour] = useState<number[]>([0.5, 1.8, 2.2, 1.5, 0.2, -1.0, -2.5, -3.2]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeMimeTypeRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' });

  const audioContextRef = useRef<AudioContext | null>(null);
  const pitchIntervalRef = useRef<any>(null);
  const pitchSamplesRef = useRef<number[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const stopAllAudio = () => {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch (e) {}
      audioPlayerRef.current = null;
    }
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

  // 🎙️ PHÁT GIỌNG MẪU TỐC ĐỘ CHUẨN IOS (TRẠM 3)
  const playNaturalTTS = async (text: string) => {
    if (isPlayingAudio) {
      stopAllAudio();
      return;
    }

    const cleanText = text.replace(/["']/g, '').trim();
    if (!cleanText) return;

    stopAllAudio();
    setIsPlayingAudio(true);

    // 1. Tạo audio đồng bộ ngay lập tức (bảo lưu User Gesture trên Safari iOS)
    const audio = new Audio();
    audioPlayerRef.current = audio;

    (audio as any).playsInline = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    const bossTtsUrl = `/api/tts?voice=onyx&text=${encodeURIComponent(cleanText)}`;

    audio.onended = () => {
      setIsPlayingAudio(false);
      audioPlayerRef.current = null;
    };

    audio.onerror = (e) => {
      console.warn("⚠️ Server TTS không tải được, kích hoạt fallback:", e);
      setIsPlayingAudio(false);
      audioPlayerRef.current = null;
      fallbackIOSBossSpeech(cleanText);
    };

    try {
      audio.src = bossTtsUrl;
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (e) {
      console.warn("⚠️ iOS WebKit chặn phát, kích hoạt fallback:", e);
      setIsPlayingAudio(false);
      audioPlayerRef.current = null;
      fallbackIOSBossSpeech(cleanText);
    }
  };

  const fallbackIOSBossSpeech = (cleanText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingAudio(false);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synth.getVoices();
    // Ưu tiên giọng nam trầm
    const maleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Guy') || v.name.includes('Aaron') || v.name.includes('Mark')));
    if (maleVoice) utterance.voice = maleVoice;

    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 0.8; // Hạ tone giọng trầm

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    synth.speak(utterance);
  };

  // 🤖 BACKGROUND AI REFILL QUA SERVERLESS API BẢO MẬT
  const triggerBackgroundAiRefill = async (level: string) => {
    if (isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      const promptInstruction = `Generate 1 unique shadow challenge sentence for Station 3 Speed Shadowing at CEFR level ${level}.
Output JSON ONLY:
{
  "bossName": "Name of Shadow Entity",
  "bossTitle": "Thử Thách Tốc Độ",
  "bossAvatar": "👻",
  "maxHp": 150,
  "timeLimitSeconds": 12,
  "bossChallengeEn": "A fluent, natural English spoken sentence to shadow fast",
  "hintVi": "Tóm tắt gợi ý dịch nghĩa bằng tiếng Việt",
  "keyTargetPhrases": ["phrase 1", "phrase 2"]
}`;

      const res = await fetch('/api/generate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptInstruction }),
      });

      if (res.ok) {
        const content = await res.json();
        const newBoss: BossScenarioItem = {
          id: `ai_${Date.now()}`,
          level: level as any,
          bossName: `🤖 ${content.bossName}`,
          bossTitle: content.bossTitle || 'Thử Thách Tốc Độ',
          bossAvatar: content.bossAvatar || '👻',
          maxHp: content.maxHp || 150,
          timeLimitSeconds: content.timeLimitSeconds || 12,
          bossChallengeEn: content.bossChallengeEn,
          bossChallengeVi: content.hintVi || '',
          expectedResponsePromptEn: 'Shadow fast to deal critical damage.',
          keyTargetPhrases: content.keyTargetPhrases || [],
          hint: {
            vi: content.hintVi || content.bossChallengeEn
          }
        } as any;
        setAiQueue(prev => [...prev, newBoss]);
      }
    } catch (e) {
      console.warn("Station 3 AI pre-fetch paused:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  // ⚡ 0MS ROTATION & REFILL HOOK
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
      setBossData({
        ...picked,
        bossName: loop > 1 ? `${picked.bossName} (#${loop})` : picked.bossName,
        hint: {
          vi: picked.bossChallengeVi || picked.bossChallengeEn
        }
      } as any);
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
    setBossData({
      ...initial,
      hint: {
        vi: initial.bossChallengeVi || initial.bossChallengeEn
      }
    } as any);
    setCurrentHp(initial.maxHp || 150);
    setTimeRemaining(initial.timeLimitSeconds || 12);
    triggerBackgroundAiRefill(lvl);
  };

  useEffect(() => {
    const initial = getInitialBossForLevel(cefrLevel);
    setBossData({
      ...initial,
      hint: {
        vi: initial.bossChallengeVi || initial.bossChallengeEn
      }
    } as any);
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
            Alert.alert("Thông báo", "⚠️ Không ghi nhận được giọng nói rõ ràng! Hãy đọc to và dứt khoát hơn.");
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
              Alert.alert("Hết giờ!", "⏳ Cửa sổ phản xạ tốc độ đã đóng!");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch {
        Alert.alert("Lỗi Microphone", "🔒 Vui lòng cấp quyền micro trên trình duyệt của bạn!");
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
      Alert.alert("Yêu cầu hành động", "🔒 Hãy hoàn thành phần thu âm trước khi gửi chấm điểm!");
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
        setLastFeedback("❌ Phát âm chưa đạt ngưỡng yêu cầu! Đòn tấn công bị bật ngược.");
      } else {
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
          ? `🔥 ĐÒN ĐÁNH TỐC ĐỘ CHÍ MẠNG (x${mult})! Thời gian phản xạ: ${speechDuration}s!` 
          : `⚡ Tốc độ phản xạ: ${speechDuration}s (Hệ số nhân x${mult}).`;
        setLastFeedback(`${notice} | ${evalResult.detailedFeedback || 'Nhịp điệu và tốc độ đọc đuổi rất chuẩn xác!'}`);

        if (newHp === 0) {
          updateUserProgress(3, 100, true);
        }
      }
    } catch {
      Alert.alert("Lỗi đánh giá", "Không thể phân tích âm học bài nói. Vui lòng thử lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const maxLimit = bossData.timeLimitSeconds || 12;
  const timePercent = Math.max(0, Math.min(100, (timeRemaining / maxLimit) * 100));

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 BẢN ĐỒ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👻 TRẠM 3: ĐẤU TRƯỜNG PHẢN XẠ TỐC ĐỘ CAO</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 35 }}>
        {/* STUDENT MODE BANNER */}
        <View style={styles.studentInfoBanner}>
          <Text style={styles.studentModeTag}>[ THỬ THÁCH ĐỌC ĐUỔI TỐC ĐỘ (SHADOWING) ]</Text>
          <Text style={styles.studentNameTag}>👤 Thí sinh Đấu Trường | ⚔️ Phản Xạ Nối Âm Nhanh</Text>
        </View>

        {/* CEFR LEVEL SELECTOR */}
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

        {/* BOSS CARD & HP BAR */}
        <View style={styles.bossCard}>
          <View style={styles.bossHeaderRow}>
            <Text style={styles.bossName}>{bossData.bossAvatar} {bossData.bossName} (Thử Thách Tốc Độ) [{cefrLevel}]</Text>
            <TouchableOpacity style={styles.switchBossBtn} onPress={handleNextChallenge} activeOpacity={0.7}>
              <Text style={styles.switchBossBtnText}>🔄 ĐỔI THỬ THÁCH KHÁC</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hpBarBg}>
            <View style={[styles.hpBarFill, { width: `${(currentHp / (bossData.maxHp || 150)) * 100}%` }]} />
          </View>
          <Text style={styles.hpText}>
            {currentHp > 0 ? `Năng lượng thử thách: ${currentHp} / ${bossData.maxHp || 150}` : '🏆 CHÚC MỪNG! BẠN ĐÃ VƯỢT QUA THỬ THÁCH TỐC ĐỘ!'}
          </Text>
        </View>

        {/* TARGET SHADOWING PHRASE & HINT BAR */}
        <View style={styles.phraseCard}>
          <Text style={styles.phraseText}>"{bossData.bossChallengeEn}"</Text>

          {/* 🇻🇳 HỘP GỢI Ý THUẦN TIẾNG VIỆT (ĐÃ LƯỢC BỎ THANH CHỌN CỜ) */}
          <View style={styles.hintContainer}>
            <View style={styles.hintHeaderRow}>
              <TouchableOpacity 
                style={[styles.hintToggleBtn, showHint && styles.hintToggleBtnActive]} 
                onPress={() => setShowHint(prev => !prev)}
                activeOpacity={0.8}
              >
                <Text style={[styles.hintToggleText, showHint ? { color: '#000000' } : { color: '#FFD700' }]}>
                  {showHint ? '✕ ẨN GỢI Ý NGHĨA' : '💡 XEM GỢI Ý NGHĨA TIẾNG VIỆT'}
                </Text>
              </TouchableOpacity>
            </View>

            {showHint && (
              <View style={styles.hintContentBox}>
                <Text style={styles.hintLanguageTag}>
                  👉 🇻🇳 Dịch nghĩa câu đọc đuổi:
                </Text>
                <Text style={styles.hintBodyText}>
                  "{(bossData as any).hint?.vi || bossData.bossChallengeVi || bossData.bossChallengeEn}"
                </Text>
              </View>
            )}
          </View>

          {/* ONYX NEURAL TTS BUTTON */}
          <TouchableOpacity 
            style={[styles.audioBtn, isPlayingAudio && styles.audioBtnPlaying]} 
            onPress={() => playNaturalTTS(bossData.bossChallengeEn)}
            activeOpacity={0.7}
          >
            <Text style={styles.audioBtnText}>
              {isPlayingAudio ? '⏹ ĐANG PHÁT GIỌNG MẪU...' : '📢 NGHE GIỌNG ĐỌC MẪU TỐC ĐỘ CHUẨN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SPEED REFLEX TIMER */}
        <View style={styles.speedTimerCard}>
          <View style={styles.speedTimerHeader}>
            <Text style={styles.speedTimerTitle}>
              {isRecording ? `⚡ THỜI GIAN NÓI: ${speechDuration}s / ${maxLimit}s` : `⏱️ CỬA SỔ PHẢN XẠ: ${timeRemaining}s`}
            </Text>
            <Text style={[styles.speedStatusText, isRecording && { color: '#39FF14' }]}>
              {isRecording ? '🔴 ĐANG TÍNH HỆ SỐ TỐC ĐỘ...' : '⚪ PHẢN XẠ NHANH GÂY SÁT THƯƠNG CHÍ MẠNG LÊN ĐẾN X2.0'}
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

        {/* REALTIME AUDIO WAVE VISUALIZER */}
        <AudioWaveVisualizer stream={activeStream} isRecording={isRecording} barColor="#00FFFF" />

        {/* CONTROLS & ATTACK TRIGGER */}
        <View style={{ width: '100%', marginBottom: 15 }}>
          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
            onPress={handleToggleRecord}
          >
            <Text style={styles.recordText}>
              {isRecording 
                ? '🛑 DỪNG THU ÂM NGAY ĐỂ NHẬN HỆ SỐ CHÍ MẠNG!' 
                : hasRecordedCurrentSession 
                ? `✅ ĐÃ THU TRONG ${speechDuration}s (CHẠM ĐỂ THU LẠI)` 
                : '🎙️ BẮT ĐẦU ĐỌC ĐUỔI TỐC ĐỘ CAO'}
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
                {hasRecordedCurrentSession ? `⚔️ TUNG ĐÒN TẤN CÔNG TỐC ĐỘ (${speechDuration}s)` : '🔒 HOÀN THÀNH BẢN THU ĐỂ MỞ KHÓA TẤN CÔNG'}
              </Text>
            </TouchableOpacity>
          )}

          {/* DAMAGE & SCORE SUMMARY */}
          {lastDamage !== null && (
            <View style={styles.damageCard}>
              <Text style={[styles.damageTitle, { color: lastDamage > 0 ? '#39FF14' : '#FF0055' }]}>
                {lastDamage > 0 ? (isCritical ? `🔥 ĐÒN ĐÁNH TỐC ĐỘ CHÍ MẠNG! -${lastDamage} HP` : `💥 ĐÒN ĐÁNH ĐÃ XÁC NHẬN: -${lastDamage} HP`) : '🛡️ ĐÒN TẤN CÔNG BỊ BẬT NGƯỢC!'}
              </Text>
              {lastBaseScore !== null && lastDamage > 0 && (
                <Text style={styles.formulaText}>
                  Điểm: <Text style={{ color: '#39FF14' }}>{lastBaseScore}</Text> ✖ Tốc độ: <Text style={{ color: '#FFD700' }}>x{speedMultiplier}</Text> = <Text style={{ color: '#FF0055' }}>-{lastDamage} HP</Text>
                </Text>
              )}
              <Text style={styles.scoreText}>ĐIỂM PHIÊN: {lastBaseScore || 0} / 100 ĐIỂM</Text>
              {lastFeedback ? <Text style={styles.feedbackText}>{lastFeedback}</Text> : null}
            </View>
          )}

          {/* 📈 INTONATION CONTOUR GRAPH */}
          <View style={styles.intonationContainer}>
            <Text style={styles.intonationTitle}>📈 BIỂU ĐỒ ĐƯỜNG CONG NGỮ ĐIỆU (PITCH):</Text>
            <IntonationCanvas targetContour={targetContour} studentContour={studentContour} />
          </View>

          {/* 🎯 WORD-LEVEL AUDIT */}
          {transcriptResult ? (
            <View style={styles.wordHighlightBox}>
              <Text style={styles.wordHighlightTitle}>🎯 ĐỐI CHIẾU TỪNG TỪ MỤC TIÊU:</Text>
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

          {/* 🎧 PLAYBACK PREVIEW */}
          {audioUrl && !isRecording && (
            <View style={styles.audioPreviewContainer}>
              <Text style={styles.audioPreviewTitle}>🎧 Nghe Lại Bản Thu Âm:</Text>
              {React.createElement('audio', {
                controls: true,
                src: audioUrl,
                style: { width: '100%', height: '38px', marginTop: '6px' }
              })}
              {transcriptResult ? (
                <Text style={styles.transcriptNotice}>💬 AI ghi nhận âm học: "{transcriptResult}"</Text>
              ) : null}
            </View>
          )}
        </View>

        {currentHp === 0 && (
          <TouchableOpacity style={styles.refreshBtn} onPress={handleNextChallenge}>
            <Text style={styles.refreshText}>🔄 CHUYỂN SANG THỬ THÁCH TIẾP THEO</Text>
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

  hintContainer: {
    marginVertical: 8,
    width: '100%',
  },
  hintHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintToggleBtn: {
    backgroundColor: '#16082F',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  hintToggleBtnActive: {
    backgroundColor: '#FFD700',
  },
  hintToggleText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  hintContentBox: {
    backgroundColor: '#07180D',
    borderLeftWidth: 3,
    borderLeftColor: '#39FF14',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
  },
  hintLanguageTag: {
    color: '#39FF14',
    fontSize: 9.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  hintBodyText: {
    color: '#88FFBB',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  audioBtn: { backgroundColor: '#1A0B2E', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5, borderColor: '#00FFFF', marginTop: 8 },
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
  recordText: { color: '#000', fontSize: 10.5, fontWeight: '900' },
  attackBtn: { backgroundColor: '#FF007F', paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  attackBtnDisabled: { backgroundColor: '#331122', opacity: 0.3 },
  attackBtnText: { color: '#FFF', fontSize: 10.5, fontWeight: '900' },

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