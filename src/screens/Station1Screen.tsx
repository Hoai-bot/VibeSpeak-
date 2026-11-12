// src/screens/Station1Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LINKING_SOUNDS_DATA, LinkingSoundItem } from '../data/station1/linkingSounds';
import { MINIMAL_PAIRS_DATA, MinimalPairItem } from '../data/station1/minimalPairs';
import { TONGUE_TWISTERS_DATA, TongueTwisterItem } from '../data/station1/tongueTwisters';
import { evaluateSpeaking, AssessmentResult, generateWordDiff } from '../services/arena/assessmentService';
import { updateUserProgress } from '../services/userService';
import { supabase } from '../utils/supabase';
import AudioWaveVisualizer from '../components/AudioWaveVisualizer';
import IntonationCanvas from '../components/IntonationCanvas';
import { getPhoneticComparison } from '../constants/phoneticMap';

interface Props {
  onBack: () => void;
}

export type DrillType = 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters';

export interface Station1DrillItem {
  id: string;
  title: string;
  contentEn: string;
  contentVi?: string;
  targetFocus: string;
  phoneticSpelling?: string;
  sessionKey?: string;
  hint?: { vi: string };
}

// 📚 TỪ ĐIỂN DỊCH NGHĨA CHUẨN TIẾNG VIỆT CHO KHO BÀI MẪU
const PRESET_VIETNAMESE_MAP: Record<string, string> = {
  'leave / live': 'Rời đi / Sống, sinh sống',
  'sheep / ship': 'Con cừu / Tàu thuyền',
  'seat / sit': 'Chỗ ngồi / Ngồi xuống',
  'heat / hit': 'Hơi nóng / Đánh, va chạm',
  'reach / rich': 'Chạm tới / Giàu có',
  'read / red': 'Đọc sách / Màu đỏ',
  'bad / bed': 'Tồi tệ, xấu / Chiếc giường',
  'pan / pen': 'Cái chảo / Cây bút',
  'man / men': 'Một người đàn ông / Những người đàn ông',
  'fan / van': 'Cái quạt / Xe tải nhỏ'
};

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

// 🌊 MEDIAN & MOVING AVERAGE FILTER
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

// 🎯 INTONATION MATCHING ALGORITHM
function calculateIntonationMatch(student: number[], target: number[]): { score: number; feedback: string } {
  if (!student.length || !target.length) {
    return { score: 80, feedback: '' };
  }

  const n = target.length;
  const resampledStudent: number[] = [];
  for (let i = 0; i < n; i++) {
    const srcIdx = (i / (n - 1 || 1)) * (student.length - 1);
    const low = Math.floor(srcIdx);
    const high = Math.min(student.length - 1, Math.ceil(srcIdx));
    const weight = srcIdx - low;
    const interp = student[low] * (1 - weight) + student[high] * weight;
    resampledStudent.push(interp);
  }

  let totalDiff = 0;
  for (let i = 0; i < n; i++) {
    totalDiff += Math.abs(resampledStudent[i] - target[i]);
  }
  const avgDiff = totalDiff / n;
  const matchScore = Math.max(35, Math.min(100, Math.round(100 - avgDiff * 12)));

  let feedback = '';
  if (matchScore >= 85) {
    feedback = '🌟 Đường cong ngữ điệu và nhịp điệu câu rất sát với người bản xứ!';
  } else if (matchScore >= 70) {
    feedback = '👍 Đường cong ngữ điệu tương đối ổn; hãy chú ý lướt âm mượt mà hơn.';
  } else {
    feedback = '⚠️ Ngữ điệu giọng bạn (xanh ngọc) còn biến thiên nhiều so với mẫu (vàng). Hãy nghe kỹ và lướt âm nhẹ nhàng hơn nhé!';
  }

  return { score: matchScore, feedback };
}

export default function Station1Screen({ onBack }: Props) {
  const [activeType, setActiveType] = useState<DrillType>('minimal_pairs');
  const [currentDrill, setCurrentDrill] = useState<Station1DrillItem | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);

  // 🌐 GỢI Ý THUẦN TIẾNG VIỆT (KHÔNG CẦN CHỌN CỜ)
  const [showHint, setShowHint] = useState<boolean>(true);

  // 🎯 QUEUE & HYBRID AI STATE
  const [categoryIndices, setCategoryIndices] = useState<Record<DrillType, number>>({
    minimal_pairs: 0,
    linking_sounds: 0,
    tongue_twisters: 0,
  });
  const [aiQueue, setAiQueue] = useState<Record<DrillType, Station1DrillItem[]>>({
    minimal_pairs: [],
    linking_sounds: [],
    tongue_twisters: [],
  });
  const isFetchingAiRef = useRef<boolean>(false);

  // Recording & Evaluation
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Score Tracking
  const [bestScore, setBestScore] = useState<number>(0);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  
  // Audio Streams
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [capturedText, setCapturedText] = useState<string>('');

  // Intonation Visuals
  const [studentContour, setStudentContour] = useState<number[]>([]);
  const [targetContour, setTargetContour] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const pitchIntervalRef = useRef<any>(null);
  const pitchSamplesRef = useRef<number[]>([]);

  const safeAlert = (msg: string) => {
    setTimeout(() => { alert(msg); }, 50);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (supabase && supabase.auth) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) setUserId(data.user.id);
        }
      } catch (e) {
        console.warn("Unable to fetch user ID:", e);
      }
    };
    fetchUser();
  }, []);

  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
  };

  // 🎯 BỘ CHUẨN HÓA NGỮ ÂM & KHỬ TỪ "SLASH" / SỬA ÂM "LIVE" THÀNH /lɪv/
  const normalizeSpeechTextForTTS = (rawText: string): string => {
    let text = rawText.replace(/["']/g, '').trim();
    const parts = text.split('/').map(w => w.trim()).filter(Boolean);

    const normalizedParts = parts.map(word => {
      const lower = word.toLowerCase();
      if (lower === 'live') {
        return 'liv';
      }
      if (lower === 'come in') return 'cum in';
      if (lower === 'read' && text.toLowerCase().includes('red')) return 'reed';
      return word;
    });

    return normalizedParts.join(' ... ');
  };

  // 🔊 BỘ PHÁT ÂM MẪU CHUẨN IOS & DESKTOP (TRẠM 1)
  const playSampleAudio = async (textToSpeak: string) => {
    if (!textToSpeak) return;
    stopAllAudio();
    setIsPlayingTTS(true);

    const cleanSpeechText = normalizeSpeechTextForTTS(textToSpeak);

    // 1. Tạo đối tượng audio đồng bộ ngay tại thời điểm chạm tay (bảo lưu User Gesture trên iOS)
    const audio = new Audio();
    currentAudioRef.current = audio;

    (audio as any).playsInline = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    const ttsUrl = `/api/tts?voice=nova&text=${encodeURIComponent(cleanSpeechText)}`;

    // 2. Lắng nghe trạng thái kết thúc & lỗi
    audio.onended = () => {
      setIsPlayingTTS(false);
      currentAudioRef.current = null;
    };

    audio.onerror = (e) => {
      console.warn("⚠️ Audio server gặp sự cố hoặc định dạng không tương thích, kích hoạt fallback:", e);
      setIsPlayingTTS(false);
      currentAudioRef.current = null;
      fallbackIOSSpeech(cleanSpeechText);
    };

    try {
      audio.src = ttsUrl;
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (err) {
      console.warn("⚠️ iOS WebKit chặn phát tự động, kích hoạt fallback:", err);
      setIsPlayingTTS(false);
      currentAudioRef.current = null;
      fallbackIOSSpeech(cleanSpeechText);
    }
  };

  // 🛡️ BỘ DỰ PHÒNG NỘI BỘ TỐI ƯU CHO IOS SAFARI
  const fallbackIOSSpeech = (cleanSpeechText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingTTS(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const iosVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Nicky') || v.name.includes('Aaron')));
    if (iosVoice) utterance.voice = iosVoice;

    utterance.onstart = () => setIsPlayingTTS(true);
    utterance.onend = () => setIsPlayingTTS(false);
    utterance.onerror = () => setIsPlayingTTS(false);

    window.speechSynthesis.speak(utterance);
  };

  // 🤖 BACKGROUND AI REFILL QUA SERVERLESS API BẢO MẬT (ZERO-LATENCY BUFFER)
  const triggerBackgroundAiRefill = async (type: DrillType) => {
    if (isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      let promptFocus = "";
      if (type === 'minimal_pairs') {
        promptFocus = "Create 1 UNIQUE Minimal Pair phoneme distinction drill (e.g., 'sheep / ship', 'seat / sit', 'rice / lice'). Format contentEn as 'word1 / word2'.";
      } else if (type === 'linking_sounds') {
        promptFocus = "Create 1 UNIQUE Linking Sound drill phrase (e.g., Consonant + Vowel linking like 'Check it out', 'Pick up the phone', or Flap T).";
      } else {
        promptFocus = "Create 1 UNIQUE Tongue Twister sentence challenging English pronunciation phonemes (consonant clusters, sibilants, etc.).";
      }

      const promptInstruction = `You are an expert English phonetics examiner for Station 1 Pronunciation Lab.
${promptFocus}
Output ONLY raw JSON (no markdown):
{
  "title": "Short title in Vietnamese",
  "contentEn": "The English target phrase or pair",
  "targetFocus": "Phonetic target focus in Vietnamese",
  "phoneticSpelling": "IPA phonetic notation",
  "hintVi": "Summary translation in Vietnamese"
}`;

      const res = await fetch('/api/generate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptInstruction }),
      });

      if (res.ok) {
        const content = await res.json();
        const newAiDrill: Station1DrillItem = {
          id: `ai_${type}_${Date.now()}_${Math.random()}`,
          title: `🤖 [AI] ${content.title}`,
          contentEn: content.contentEn,
          targetFocus: content.targetFocus || 'Trọng tâm ngữ âm',
          phoneticSpelling: content.phoneticSpelling || '',
          sessionKey: `ai_${Date.now()}`,
          hint: {
            vi: content.hintVi || content.contentEn
          }
        };
        setAiQueue(prev => ({
          ...prev,
          [type]: [...prev[type], newAiDrill]
        }));
      }
    } catch (e) {
      console.warn("Background AI refiller paused:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  // ⚡ 0MS IMMEDIATE ROTATION & AI BUFFER HOOK
  const handleLoadNewDrill = (type: DrillType) => {
    stopAllAudio();
    resetSession();
    setBestScore(0);
    setPreviousScore(null);
    setAttemptCount(0);

    if (aiQueue[type] && aiQueue[type].length > 0) {
      const [nextAiDrill, ...restQueue] = aiQueue[type];
      setAiQueue(prev => ({ ...prev, [type]: restQueue }));
      setCurrentDrill({
        ...nextAiDrill,
        sessionKey: `ai_${Date.now()}`
      });

      const isQuestion = (nextAiDrill.contentEn || '').includes('?');
      const mockRef = isQuestion 
        ? [-2, -1.5, -1, 0, 0.5, 1.2, 2.8, 4.5]
        : [0.5, 1.8, 2.2, 1.5, 0.2, -1.0, -2.5, -3.2];
      setTargetContour(mockRef);

      triggerBackgroundAiRefill(type);
      return;
    }

    let bank: (LinkingSoundItem | MinimalPairItem | TongueTwisterItem)[] = [];
    if (type === 'minimal_pairs') bank = MINIMAL_PAIRS_DATA;
    else if (type === 'linking_sounds') bank = LINKING_SOUNDS_DATA;
    else bank = TONGUE_TWISTERS_DATA;

    const currentIdx = categoryIndices[type];
    const nextIdx = currentIdx + 1;
    setCategoryIndices(prev => ({ ...prev, [type]: nextIdx }));

    const rawDrill = bank[nextIdx % bank.length];
    const loopNum = Math.floor(nextIdx / bank.length) + 1;

    const lookupKey = (rawDrill.contentEn || '').toLowerCase().trim();
    const mappedViHint = PRESET_VIETNAMESE_MAP[lookupKey] || rawDrill.contentVi || rawDrill.contentEn;

    const newDrill: Station1DrillItem = {
      ...rawDrill,
      title: loopNum > 1 ? `${rawDrill.title} (#${loopNum})` : rawDrill.title,
      sessionKey: `preset_${type}_${nextIdx}_${Date.now()}`,
      hint: { vi: mappedViHint }
    };

    setCurrentDrill(newDrill);

    const isQuestion = (newDrill.contentEn || '').includes('?');
    const mockRef = isQuestion 
      ? [-2, -1.5, -1, 0, 0.5, 1.2, 2.8, 4.5]
      : [0.5, 1.8, 2.2, 1.5, 0.2, -1.0, -2.5, -3.2];
    setTargetContour(mockRef);

    triggerBackgroundAiRefill(type);
  };

  useEffect(() => {
    handleLoadNewDrill(activeType);
    return () => stopAllAudio();
  }, [activeType]);

  const resetSession = () => {
    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); recognitionRef.current = null; } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setActiveStream(null);
    setIsRecording(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setIsProcessingAudio(false);
    setResult(null);
    setCapturedText('');
    setStudentContour([]);
    audioChunksRef.current = [];
  };

  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          safeAlert("🔒 Chưa cấp quyền truy cập Microphone trong trình duyệt!");
          return;
        }

        if (result && result.score > 0) {
          setPreviousScore(result.score);
        }

        setRecordedAudio(null);
        setHasRecorded(false);
        setIsProcessingAudio(false);
        setCapturedText('');
        setStudentContour([]);
        pitchSamplesRef.current = [];
        audioChunksRef.current = [];

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });
        mediaStreamRef.current = stream;
        setActiveStream(stream);

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
        } catch (audioCtxErr) {
          console.warn("Pitch analysis context bypassed:", audioCtxErr);
        }

        let options = {};
        if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }
        }

        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          setRecordedAudio(blob);
          setHasRecorded(true);
          setIsProcessingAudio(false);

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

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
          setActiveStream(null);
        };

        recordingStartTimeRef.current = Date.now();
        recorder.start(150);
        setIsRecording(true);
      } catch (err) {
        safeAlert("🔒 Vui lòng cho phép truy cập micro trên trình duyệt để ghi âm!");
      }
    } else {
      const durationSeconds = (Date.now() - recordingStartTimeRef.current) / 1000;
      setIsRecording(false);
      setIsProcessingAudio(true);
      setActiveStream(null);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      if (durationSeconds < 0.6) {
        setIsProcessingAudio(false);
        setHasRecorded(false);
        setRecordedAudio(null);
        safeAlert("⚠️ Đoạn thu quá ngắn! Hãy phát âm trọn vẹn từ mục tiêu trước khi dừng.");
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || isProcessingAudio) {
      safeAlert("🔒 Vui lòng phát âm vào micro trước khi gửi đánh giá!");
      return;
    }

    setIsAnalyzing(true);
    try {
      const promptTarget = (currentDrill?.contentEn || '').trim();
      const evalData = await evaluateSpeaking(
        recordedAudio, 
        undefined, 
        'STATION_1', 
        promptTarget, 
        userId, 
        capturedText
      );

      const intonation = calculateIntonationMatch(studentContour, targetContour);
      const rawPronunciationScore = evalData.score;
      const combinedScore = Math.max(
        30,
        Math.min(99, Math.round(rawPronunciationScore * 0.7 + intonation.score * 0.3))
      );

      let finalFeedback = evalData.detailedFeedback;
      if (intonation.score < 70 && rawPronunciationScore >= 80) {
        finalFeedback = `👍 Phát âm tròn vành rõ chữ (${rawPronunciationScore} điểm), nhưng cao độ ngữ điệu (xanh ngọc) cần lướt mềm mại hơn (${intonation.score} điểm). ${intonation.feedback}`;
      } else if (intonation.feedback) {
        finalFeedback = `${evalData.detailedFeedback} ${intonation.feedback}`;
      }

      const calibratedResult: AssessmentResult = {
        ...evalData,
        score: combinedScore,
        detailedFeedback: finalFeedback,
        isWin: combinedScore >= 70,
        criteria: evalData.criteria ? {
          ...evalData.criteria,
          pronunciation: rawPronunciationScore,
          fluency: intonation.score,
        } : null
      };

      setAttemptCount((prev) => prev + 1);
      setBestScore((prev) => Math.max(prev, combinedScore));
      setResult(calibratedResult);
      
      const isPass = (combinedScore >= 70) || calibratedResult.isWin;
      if (isPass) updateUserProgress(1, 30, true);
    } catch (err) {
      safeAlert("⚠️ Mạng trễ khi phân tích âm học. Vui lòng bấm chấm điểm lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isPassed = (result?.score ?? 0) >= 70 || result?.isWin;
  const scoreDiff = (previousScore !== null && result) ? result.score - previousScore : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 BẢN ĐỒ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 1: PHÒNG LAB LUYỆN NGỮ ÂM</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 35 }}>
        {/* DRILL FORMAT SELECTOR */}
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'minimal_pairs' && styles.tabBtnActive]}
            onPress={() => setActiveType('minimal_pairs')}
          >
            <Text style={[styles.tabText, activeType === 'minimal_pairs' && styles.tabTextActive]}>
              👯 Cặp Âm Đối Lập
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'linking_sounds' && styles.tabBtnActive]}
            onPress={() => setActiveType('linking_sounds')}
          >
            <Text style={[styles.tabText, activeType === 'linking_sounds' && styles.tabTextActive]}>
              🔗 Luyện Nối Âm
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'tongue_twisters' && styles.tabBtnActive]}
            onPress={() => setActiveType('tongue_twisters')}
          >
            <Text style={[styles.tabText, activeType === 'tongue_twisters' && styles.tabTextActive]}>
              🐍 Uốn Lưỡi Phản Xạ
            </Text>
          </TouchableOpacity>
        </View>

        {currentDrill && (
          <View style={styles.box} key={currentDrill.sessionKey}>
            {/* TIÊU ĐỀ THUẦN TIẾNG VIỆT */}
            <Text style={styles.boxTitle}>📌 {currentDrill.title.toUpperCase()}</Text>
            
            <Text style={styles.drillEn}>"{currentDrill.contentEn}"</Text>
            
            {currentDrill.phoneticSpelling && (
              <Text style={styles.phonetics}>🔊 Phiên âm IPA: {currentDrill.phoneticSpelling}</Text>
            )}
            
            <Text style={styles.targetFocus}>🎯 Trọng tâm: {currentDrill.targetFocus}</Text>

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
                    👉 🇻🇳 Dịch nghĩa:
                  </Text>
                  <Text style={styles.hintBodyText}>
                    "{currentDrill.hint?.vi || currentDrill.contentVi || currentDrill.contentEn}"
                  </Text>
                </View>
              )}
            </View>

            {/* TTS MODEL PLAYBACK - ĐÃ KHỬ TỪ 'SLASH' VÀ SỬA ÂM /lɪv/ KÈM USER GESTURE CHUẨN IOS */}
            <TouchableOpacity 
              style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
              onPress={() => playSampleAudio(currentDrill.contentEn)}
              activeOpacity={0.7}
            >
              <Text style={styles.ttsBtnText}>
                {isPlayingTTS ? '⏹ ĐANG PHÁT ÂM MẪU NEURAL...' : '🔊 NGHE PHÁT ÂM MẪU BẢN XỨ'}
              </Text>
            </TouchableOpacity>

            {/* 0MS ROTATION & PRE-FETCH BUTTON */}
            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => handleLoadNewDrill(activeType)}
              activeOpacity={0.7}
            >
              <Text style={styles.refreshBtnText}>🔄 ĐỔI BÀI TẬP TIẾP THEO (0MS)</Text>
            </TouchableOpacity>

            {/* REALTIME AUDIO WAVE VISUALIZER */}
            <AudioWaveVisualizer stream={activeStream} isRecording={isRecording} barColor="#FF007F" />

            {/* RECORDING TOGGLE BUTTON */}
            <TouchableOpacity 
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
              onPress={handleToggleRecord}
            >
              <Text style={styles.recordBtnText}>
                {isRecording 
                  ? '🔴 ĐANG GHI ÂM... (CHẠM ĐỂ DỪNG)' 
                  : isProcessingAudio
                  ? '⏳ ĐANG LƯU VẾT ÂM THANH...'
                  : hasRecorded 
                  ? '🔄 THU ÂM LẠI ĐỂ TĂNG ĐIỂM' 
                  : '🎙 CHẠM ĐỂ BẮT ĐẦU THU ÂM'}
              </Text>
            </TouchableOpacity>

            {/* SUBMIT BUTTON */}
            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity 
                style={[
                  styles.submitBtn, 
                  (!hasRecorded || isRecording || isProcessingAudio) && styles.submitBtnDisabled
                ]} 
                onPress={handleSubmitAnswer}
                disabled={!hasRecorded || isRecording || isProcessingAudio}
              >
                <Text style={styles.submitBtnText}>
                  {attemptCount > 0 ? '⚡ NỘP BÀI THU MỚI ĐỂ NÂNG ĐIỂM' : '⚡ NỘP BÀI ĐỂ AI CHẤM ĐIỂM NGỮ ÂM'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* RESULTS & INTONATION CANVAS */}
        {result && (
          <View style={[styles.box, { borderColor: isPassed ? '#39FF14' : '#FF0055' }]}>
            <Text style={[styles.resultTitle, { color: isPassed ? '#39FF14' : '#FF0055' }]}>
              {isPassed ? '🏆 PHÁT ÂM RẤT XUẤT SẮC!' : '💀 CẦN LUYỆN TẬP THÊM'}
            </Text>
            
            <Text style={styles.scoreText}>⚡ Điểm phiên: {result.score} / 100 ĐIỂM</Text>

            {/* SCORE TRACKING BADGES */}
            <View style={styles.scoreComparisonRow}>
              {bestScore > 0 && (
                <View style={styles.bestScoreBadge}>
                  <Text style={styles.bestScoreText}>👑 Kỷ lục cá nhân: {bestScore} điểm</Text>
                </View>
              )}
              {scoreDiff !== null && (
                <View style={[styles.deltaBadge, { backgroundColor: scoreDiff >= 0 ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 0, 85, 0.2)' }]}>
                  <Text style={[styles.deltaText, { color: scoreDiff >= 0 ? '#39FF14' : '#FF0055' }]}>
                    {scoreDiff >= 0 ? `▲ +${scoreDiff} điểm` : `▼ ${scoreDiff} điểm`}
                  </Text>
                </View>
              )}
            </View>

            {/* 📈 DUAL-TRACE INTONATION CONTOUR (VIETNAMESE LABELS) */}
            <View style={styles.intonationWrapper}>
              <View style={styles.intonationHeaderRow}>
                <Text style={styles.intonationTitle}>
                  📈 BIỂU ĐỒ ĐƯỜNG CONG NGỮ ĐIỆU (PITCH):
                </Text>
                <View style={styles.intonationLegendRow}>
                  <Text style={{ color: '#FFD700', fontSize: 9.5, fontWeight: 'bold' }}>— Giọng Mẫu</Text>
                  <Text style={{ color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold', marginLeft: 8 }}>— Giọng Bạn</Text>
                </View>
              </View>
              <IntonationCanvas targetContour={targetContour} studentContour={studentContour} />
            </View>

            {/* 🔬 IPA PHONEMIC INSPECTOR */}
            {(() => {
              let normalizedDisplayTranscript = (result.transcript || '').toLowerCase();
              const isMinimalPair = currentDrill?.contentEn?.includes('/');
              const inspectionItems: string[] = isMinimalPair
                ? currentDrill.contentEn.split('/').map((w: string) => w.trim()).filter(Boolean)
                : currentDrill.contentEn
                    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
                    .split(/\s+/)
                    .map((w: string) => w.trim())
                    .filter((w: string) => w.length >= 3);

              return (
                <>
                  {currentDrill?.contentEn && (
                    <View style={styles.ipaDiffContainer}>
                      <Text style={styles.ipaSectionTitle}>🔬 SOI CHI TIẾT NGỮ ÂM IPA:</Text>
                      
                      {inspectionItems.map((word: string, idx: number) => {
                        const comparison = getPhoneticComparison(word, normalizedDisplayTranscript);
                        return (
                          <View 
                            key={idx} 
                            style={[
                              styles.ipaCard, 
                              comparison.isExactMatch ? styles.ipaCardCorrect : styles.ipaCardMismatch
                            ]}
                          >
                            <View style={styles.ipaHeaderRow}>
                              <Text style={styles.ipaWord}>{word.toUpperCase()}</Text>
                              <Text style={[styles.ipaStatusBadge, { color: comparison.isExactMatch ? '#39FF14' : '#FF0055' }]}>
                                {comparison.isExactMatch ? 'CHUẨN XÁC ✓' : 'LỆCH ÂM ✗'}
                              </Text>
                            </View>

                            <View style={styles.ipaCompareRow}>
                              <View style={styles.ipaBox}>
                                <Text style={styles.ipaBoxLabel}>IPA MỤC TIÊU</Text>
                                <Text style={styles.targetIpaText}>{comparison.targetIpa || `/${word.toLowerCase()}/`}</Text>
                              </View>

                              <View style={styles.arrowContainer}>
                                <Text style={styles.ipaVsArrow}>➔</Text>
                              </View>

                              <View style={styles.ipaBox}>
                                <Text style={[styles.ipaBoxLabel, { textAlign: 'right' }]}>AI GHI NHẬN</Text>
                                <Text style={[styles.heardIpaText, { color: comparison.isExactMatch ? '#39FF14' : '#FF0055' }]}>
                                  {comparison.heardIpa || '(Không rõ âm)'}
                                </Text>
                              </View>
                            </View>

                            {/* 💡 MẸO KHẨU HÌNH THUẦN TIẾNG VIỆT */}
                            {comparison.tip && (
                              <View style={styles.ipaTipBox}>
                                <Text style={styles.ipaTipText}>
                                  💡 Mẹo khẩu hình: {comparison.tip}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* WORD-LEVEL HIGHLIGHT */}
                  <View style={styles.wordHighlightBox}>
                    <Text style={styles.wordHighlightTitle}>🎯 ĐỐI CHIẾU TỪNG TỪ:</Text>
                    <View style={styles.wordRow}>
                      {generateWordDiff(currentDrill?.contentEn || '', normalizedDisplayTranscript).map((item, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[
                            styles.wordBadge, 
                            item.status === 'correct' ? styles.correctBadge : styles.incorrectBadge
                          ]}
                          onPress={() => playSampleAudio(item.word)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.wordBadgeText, item.status === 'correct' ? styles.correctText : styles.incorrectText]}>
                            {item.word} {item.status === 'correct' ? '✓' : '✗'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              );
            })()}

            {/* AUDIO PLAYBACK REVIEW */}
            {result.audioUrl ? (
              <View style={styles.audioPlayerBox}>
                <Text style={styles.audioLabel}>🎧 Bản thu âm phát âm của bạn:</Text>
                {React.createElement(
                  'div',
                  {
                    style: { width: '100%', height: '36px', marginTop: '6px' },
                    onMouseDown: (e: any) => e.stopPropagation(),
                    onTouchStart: (e: any) => e.stopPropagation(),
                    onMouseUp: (e: any) => e.stopPropagation(),
                    onTouchEnd: (e: any) => e.stopPropagation()
                  },
                  React.createElement('audio', {
                    key: result.audioUrl,
                    controls: true,
                    playsInline: true,
                    src: result.audioUrl,
                    style: { width: '100%', height: '36px' }
                  })
                )}
              </View>
            ) : null}

            {/* TRANSCRIBED SCRIPT */}
            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 AI Tapescript ghi nhận:</Text>
              <Text style={styles.scriptContent}>"{result.transcript || '(Âm học không rõ ràng)'}"</Text>
            </View>

            {/* 💡 LỜI NHẬN XÉT ĐÁNH GIÁ THUẦN TIẾNG VIỆT */}
            <Text style={styles.feedbackText}>{result.detailedFeedback}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 12, fontWeight: '900' },
  
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  tabBtn: { flex: 1, backgroundColor: '#0D0620', paddingVertical: 10, marginHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  tabText: { color: '#AAAABB', fontSize: 9.5, fontWeight: 'bold' },
  tabTextActive: { color: '#FFF' },

  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 10 },
  drillEn: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  phonetics: { color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  targetFocus: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 10 },

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

  ttsBtn: { backgroundColor: '#1A0B2E', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginVertical: 8 },
  ttsBtnActive: { backgroundColor: '#00FFFF' },
  ttsBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },

  refreshBtn: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#FFD700', width: '100%', alignItems: 'center', marginBottom: 10 },
  refreshBtnText: { color: '#FFD700', fontSize: 10.5, fontWeight: 'bold' },

  recordBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordBtnActive: { backgroundColor: '#FF0055' },
  recordBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.2 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },

  resultTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  scoreText: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  scoreComparisonRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  bestScoreBadge: { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderWidth: 1, borderColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bestScoreText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  deltaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  deltaText: { fontSize: 10, fontWeight: '900' },

  intonationWrapper: { width: '100%', marginVertical: 8 },
  intonationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, width: '100%' },
  intonationTitle: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  intonationLegendRow: { flexDirection: 'row', alignItems: 'center' },

  ipaDiffContainer: { width: '100%', backgroundColor: '#070314', borderRadius: 12, borderWidth: 1.5, borderColor: '#00FFFF', padding: 12, marginVertical: 10 },
  ipaSectionTitle: { color: '#00FFFF', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  ipaCard: { backgroundColor: '#120826', borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 8, width: '100%' },
  ipaCardCorrect: { borderColor: '#39FF14' },
  ipaCardMismatch: { borderColor: '#FF0055' },
  ipaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 },
  ipaWord: { color: '#FFF', fontSize: 12, fontWeight: '900', flex: 1, flexShrink: 1 },
  ipaStatusBadge: { fontSize: 9, fontWeight: '900' },
  ipaCompareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#05020D', borderRadius: 8, padding: 8, width: '100%', gap: 4 },
  ipaBox: { flex: 1, flexShrink: 1, minWidth: 0 },
  arrowContainer: { paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  ipaBoxLabel: { color: '#8888AA', fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  targetIpaText: { color: '#39FF14', fontSize: 11, fontWeight: '800', lineHeight: 16, flexWrap: 'wrap' },
  heardIpaText: { fontSize: 11, fontWeight: '800', lineHeight: 16, textAlign: 'right', flexWrap: 'wrap' },
  ipaVsArrow: { color: '#FF007F', fontSize: 12, fontWeight: 'bold' },
  ipaTipBox: { marginTop: 6, backgroundColor: '#1A0B2E', borderRadius: 6, padding: 6 },
  ipaTipText: { color: '#FFD700', fontSize: 9, lineHeight: 13 },

  wordHighlightBox: { backgroundColor: '#120826', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', marginVertical: 8 },
  wordHighlightTitle: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  correctBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', borderColor: '#39FF14' },
  incorrectBadge: { backgroundColor: 'rgba(255, 0, 85, 0.15)', borderColor: '#FF0055' },
  wordBadgeText: { fontSize: 11, fontWeight: 'bold' },
  correctText: { color: '#39FF14' },
  incorrectText: { color: '#FF0055' },

  audioPlayerBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10, borderWidth: 1, borderColor: '#00FFFF' },
  audioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scriptBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10 },
  scriptLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginVertical: 4 },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16 }
});