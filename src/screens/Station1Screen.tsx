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
import IntonationCanvas from '../components/IntonationCanvas'; // 📈 IMPORT INTONATION CANVAS
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
  if (rms < 0.01) return null; // Yên lặng

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
    // Lọc dải tần số giọng nói con người tiêu chuẩn (75Hz - 420Hz)
    if (pitch >= 75 && pitch <= 420) return pitch;
  }
  return null;
}

// 🌊 BỘ LỌC LÀM MỊN ĐƯỜNG CONG CAO ĐỘ (MEDIAN & MOVING AVERAGE FILTER)
function smoothContour(arr: number[]): number[] {
  if (arr.length <= 2) return arr;
  
  // Bước 1: Lọc trung vị 3 điểm để khử đột biến do nhảy quãng tám (Octave Jump)
  const medianFiltered: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const prev = arr[i - 1] ?? arr[i];
    const curr = arr[i];
    const next = arr[i + 1] ?? arr[i];
    const sorted = [prev, curr, next].sort((a, b) => a - b);
    medianFiltered.push(sorted[1]);
  }

  // Bước 2: Làm mịn trung bình trượt có trọng số (Weighted Moving Average)
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

// 🎯 ĐO LƯỜNG ĐỘ KHỚP NGỮ ĐIỆU GIỮA HỌC VIÊN VÀ MẪU CHUẨN
function calculateIntonationMatch(student: number[], target: number[]): { score: number; feedback: string } {
  if (!student.length || !target.length) {
    return { score: 80, feedback: '' };
  }

  // Nội suy độ dài student về cùng số điểm với target để so sánh chuẩn xác
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

  // Tính sai số tuyệt đối trung bình (MAE) theo Semitone
  let totalDiff = 0;
  for (let i = 0; i < n; i++) {
    totalDiff += Math.abs(resampledStudent[i] - target[i]);
  }
  const avgDiff = totalDiff / n;

  // Điểm ngữ điệu: Lệch 0st = 100đ, mỗi 1 semitone lệch trừ ~12đ
  const matchScore = Math.max(35, Math.min(100, Math.round(100 - avgDiff * 12)));

  let feedback = '';
  if (matchScore >= 85) {
    feedback = '🌟 Ngữ điệu và độ lướt câu rất khớp với câu mẫu!';
  } else if (matchScore >= 70) {
    feedback = '👍 Ngữ điệu khá ổn định nhưng cần chú ý giữ hơi đều hơn.';
  } else {
    feedback = '⚠️ Đường ngữ điệu (xanh) còn dao động mạnh và chưa bám sát mẫu (vàng). Hãy nghe lại câu mẫu và lên/xuống giọng êm hơn!';
  }

  return { score: matchScore, feedback };
}

export default function Station1Screen({ onBack }: Props) {
  const [activeType, setActiveType] = useState<DrillType>('minimal_pairs');
  const [currentDrill, setCurrentDrill] = useState<Station1DrillItem | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);

  // 🎯 QUẢN LÝ CHỈ SỐ KHO ĐỀ 50 BÀI & HÀNG ĐỢI NẠP BÙ AI NGẦM
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

  // Quản lý ghi âm & trạng thái chấm điểm
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Quản lý tiến trình & Điểm kỷ lục
  const [bestScore, setBestScore] = useState<number>(0);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  
  // Quản lý luồng âm thanh
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [capturedText, setCapturedText] = useState<string>('');

  // 📈 QUẢN LÝ DỮ LIỆU ĐƯỜNG CONG NGỮ ĐIỆU (INTONATION CONTOUR)
  const [studentContour, setStudentContour] = useState<number[]>([]);
  const [targetContour, setTargetContour] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Audio Context cho Pitch Extraction
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
        console.warn("Không lấy được user ID:", e);
      }
    };
    fetchUser();
  }, []);

  // 🔊 BỘ PHÁT ÂM TỰ NHIÊN ĐA NỀN TẢNG (IOS, ANDROID, WINDOWS, MACOS)
  const getBestNaturalVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Android: Ưu tiên gói giọng mạng cao cấp của Google
    const androidVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google US English') || v.name.includes('Network') || v.voiceURI.includes('en-us-x'))
    );
    if (androidVoice) return androidVoice;

    // 2. iOS (iPhone/iPad/Safari): Ưu tiên giọng Siri / Samantha Enhanced
    const iosVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Siri') || v.name.includes('Samantha') || v.name.includes('Nicky') || v.name.includes('Aaron'))
    );
    if (iosVoice) return iosVoice;

    // 3. Desktop (Windows/Edge/Chrome/macOS): Ưu tiên giọng Neural tự nhiên
    const desktopVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Jenny') || v.name.includes('Guy') || v.name.includes('Aria'))
    );
    if (desktopVoice) return desktopVoice;

    // 4. Mặc định: Chọn bất kỳ giọng en-US nào
    return voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || null;
  };

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

  const playSampleAudio = (textToSpeak: string) => {
    if (!textToSpeak) return;
    stopAllAudio();
    setIsPlayingTTS(true);

    let cleanSpeechText = textToSpeak.replace(/\//g, ', ').trim();
    const ttsWordFixes: Record<string, string> = {
      'come in': 'cum, in',
      'come': 'cum',
      'some': 'sum'
    };

    const lowerText = cleanSpeechText.toLowerCase();
    if (ttsWordFixes[lowerText]) {
      cleanSpeechText = ttsWordFixes[lowerText];
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const speakText = () => {
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.lang = 'en-US';
        utterance.rate = 0.85; // Tốc độ rõ ràng, chuẩn ngữ điệu sư phạm
        utterance.pitch = 1.0;

        const bestVoice = getBestNaturalVoice();
        if (bestVoice) utterance.voice = bestVoice;

        utterance.onstart = () => setIsPlayingTTS(true);
        utterance.onend = () => setIsPlayingTTS(false);
        utterance.onerror = () => setIsPlayingTTS(false);

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        speakText();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          speakText();
          window.speechSynthesis.onvoiceschanged = null;
        };
        setTimeout(() => speakText(), 150);
      }
      return;
    }

    setIsPlayingTTS(false);
  };

  // 🤖 TIẾN TRÌNH NẠP BÙ AI NGẦM CHO TRẠM 1 (CHẠY HẬU CẢNH - KHÔNG LÀM ĐƠ MÀN HÌNH)
  const triggerBackgroundAiRefill = async (type: DrillType) => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey || isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      let promptFocus = "";
      if (type === 'minimal_pairs') {
        promptFocus = "Create 1 UNIQUE Minimal Pair phoneme distinction drill (e.g. 'sheep / ship', 'seat / sit', 'rice / lice'). Format contentEn as 'word1 / word2'.";
      } else if (type === 'linking_sounds') {
        promptFocus = "Create 1 UNIQUE Linking Sound drill phrase (e.g. Consonant + Vowel linking like 'Check it out', 'Pick up the phone', or Flap T).";
      } else {
        promptFocus = "Create 1 UNIQUE Tongue Twister sentence challenging English pronunciation phonemes (consonant clusters, sibilants, etc.).";
      }

      const promptInstruction = `You are an expert English phonetics examiner for Station 1 Pronunciation Lab.
${promptFocus}
Output ONLY raw JSON (no markdown):
{
  "title": "Short title in Vietnamese",
  "contentEn": "The English target phrase or pair",
  "contentVi": "Short Vietnamese translation",
  "targetFocus": "Phonetic target focus in Vietnamese",
  "phoneticSpelling": "IPA phonetic notation"
}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: promptInstruction }],
          temperature: 1.0,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(data.choices[0].message.content);
        const newAiDrill: Station1DrillItem = {
          id: `ai_${type}_${Date.now()}_${Math.random()}`,
          title: `🤖 [AI MỚI] ${content.title}`,
          contentEn: content.contentEn,
          contentVi: content.contentVi || '',
          targetFocus: content.targetFocus || 'Luyện chuẩn âm vị',
          phoneticSpelling: content.phoneticSpelling || '',
          sessionKey: `ai_${Date.now()}`
        };
        setAiQueue(prev => ({
          ...prev,
          [type]: [...prev[type], newAiDrill]
        }));
      }
    } catch (e) {
      console.warn("AI ngầm Trạm 1 tạm dừng:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  // ⚡ CƠ CHẾ ĐỔI ĐỀ TỨC THÌ 0MS + NẠP BÙ AI HẬU CẢNH
  const handleLoadNewDrill = (type: DrillType) => {
    stopAllAudio();
    resetSession();
    setBestScore(0);
    setPreviousScore(null);
    setAttemptCount(0);

    // 1. Nếu có bài sẵn trong hàng đợi AI ngầm -> Dùng ngay trong 0ms!
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

      // Kích hoạt nạp bù tiếp 1 đề mới vào hàng đợi hậu cảnh
      triggerBackgroundAiRefill(type);
      return;
    }

    // 2. Lấy ngay từ kho 50 bài chuẩn có sẵn (0ms latency)
    let bank: (LinkingSoundItem | MinimalPairItem | TongueTwisterItem)[] = [];
    if (type === 'minimal_pairs') bank = MINIMAL_PAIRS_DATA;
    else if (type === 'linking_sounds') bank = LINKING_SOUNDS_DATA;
    else bank = TONGUE_TWISTERS_DATA;

    const currentIdx = categoryIndices[type];
    const nextIdx = currentIdx + 1;
    setCategoryIndices(prev => ({ ...prev, [type]: nextIdx }));

    const rawDrill = bank[nextIdx % bank.length];
    const loopNum = Math.floor(nextIdx / bank.length) + 1;

    const newDrill: Station1DrillItem = {
      ...rawDrill,
      title: loopNum > 1 ? `${rawDrill.title} (#${loopNum})` : rawDrill.title,
      sessionKey: `preset_${type}_${nextIdx}_${Date.now()}`
    };

    setCurrentDrill(newDrill);

    const isQuestion = (newDrill.contentEn || '').includes('?');
    const mockRef = isQuestion 
      ? [-2, -1.5, -1, 0, 0.5, 1.2, 2.8, 4.5]
      : [0.5, 1.8, 2.2, 1.5, 0.2, -1.0, -2.5, -3.2];
    setTargetContour(mockRef);

    // 3. Cơ chế bù đề: Ngay khi đề này được đưa ra, tự động kích hoạt nạp bù AI ở hậu cảnh
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
          safeAlert("🔒 Trình duyệt chưa cấp quyền Micro!");
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

        // Tự động nhận diện định dạng MediaRecorder phù hợp theo thiết bị
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

          // Lọc các mẫu cao độ hợp lệ và khử nhiễu
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
        safeAlert("🔒 Vui lòng cho phép quyền 'Microphone' trên trình duyệt để ghi âm!");
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
        safeAlert("⚠️ Bản thu quá ngắn! Hãy đọc trọn vẹn từ mục tiêu rồi mới bấm dừng.");
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || isProcessingAudio) {
      safeAlert("🔒 Vui lòng phát âm từ mục tiêu vào micro trước khi nộp bài!");
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

      // 🌟 TÍCH HỢP ĐIỂM NGỮ ĐIỆU (INTONATION MATCH) VÀO ĐIỂM TỔNG
      const intonation = calculateIntonationMatch(studentContour, targetContour);
      
      const rawPronunciationScore = evalData.score;
      const combinedScore = Math.max(
        30,
        Math.min(99, Math.round(rawPronunciationScore * 0.7 + intonation.score * 0.3))
      );

      let finalFeedback = evalData.detailedFeedback;
      if (intonation.score < 70 && rawPronunciationScore >= 80) {
        finalFeedback = `👍 Bạn phát âm đúng từ (${rawPronunciationScore}đ), nhưng đường ngữ điệu (xanh) còn dao động mạnh (${intonation.score}đ). ${intonation.feedback}`;
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
      safeAlert("⚠️ Lỗi kết nối chấm điểm. Vui lòng thử nộp lại!");
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
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 1: PRONUNCIATION LAB</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'minimal_pairs' && styles.tabBtnActive]}
            onPress={() => setActiveType('minimal_pairs')}
          >
            <Text style={[styles.tabText, activeType === 'minimal_pairs' && styles.tabTextActive]}>
              👯 Minimal Pairs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'linking_sounds' && styles.tabBtnActive]}
            onPress={() => setActiveType('linking_sounds')}
          >
            <Text style={[styles.tabText, activeType === 'linking_sounds' && styles.tabTextActive]}>
              🔗 Linking Sounds
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'tongue_twisters' && styles.tabBtnActive]}
            onPress={() => setActiveType('tongue_twisters')}
          >
            <Text style={[styles.tabText, activeType === 'tongue_twisters' && styles.tabTextActive]}>
              🐍 Tongue Twisters
            </Text>
          </TouchableOpacity>
        </View>

        {currentDrill && (
          <View style={styles.box} key={currentDrill.sessionKey}>
            <Text style={styles.boxTitle}>📌 {currentDrill.title.toUpperCase()}</Text>
            
            <Text style={styles.drillEn}>"{currentDrill.contentEn}"</Text>
            {currentDrill.contentVi && <Text style={styles.drillVi}>👉 {currentDrill.contentVi}</Text>}
            
            {currentDrill.phoneticSpelling && (
              <Text style={styles.phonetics}>🔊 IPA: {currentDrill.phoneticSpelling}</Text>
            )}
            
            <Text style={styles.targetFocus}>🎯 Trọng tâm: {currentDrill.targetFocus}</Text>

            <TouchableOpacity 
              style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
              onPress={() => playSampleAudio(currentDrill.contentEn)}
            >
              <Text style={styles.ttsBtnText}>
                {isPlayingTTS ? '🔊 ĐANG PHÁT ÂM MẪU...' : '📢 NGHE PHÁT ÂM MẪU'}
              </Text>
            </TouchableOpacity>

            {/* NÚT ĐỔI BÀI TẬP TỨC THÌ 0MS KÈM AI BÙ ĐỀ */}
            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => handleLoadNewDrill(activeType)}
              activeOpacity={0.7}
            >
              <Text style={styles.refreshBtnText}>🔄 THỬ THÁCH BÀI KHÁC (0MS + AI BÙ ĐỀ)</Text>
            </TouchableOpacity>

            {/* DẢI SÓNG ÂM THỜI GIAN THỰC */}
            <AudioWaveVisualizer stream={activeStream} isRecording={isRecording} barColor="#FF007F" />

            <TouchableOpacity 
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
              onPress={handleToggleRecord}
            >
              <Text style={styles.recordBtnText}>
                {isRecording 
                  ? '🔴 ĐANG THU ÂM... (BẤM ĐỂ DỪNG)' 
                  : isProcessingAudio
                  ? '⏳ ĐANG LƯU BẢN THU MỚI...'
                  : hasRecorded 
                  ? '🔄 BẤM ĐỂ PHÁT ÂM LẠI (NÂNG ĐIỂM)' 
                  : '🎙 BẤM ĐỂ BẮT ĐẦU PHÁT ÂM'}
              </Text>
            </TouchableOpacity>

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
                  {attemptCount > 0 ? '⚡ NỘP BÀI ĐỂ NÂNG ĐIỂM' : '⚡ NỘP BÀI & CHẤM PHÁT ÂM AI'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {result && (
          <View style={[styles.box, { borderColor: isPassed ? '#39FF14' : '#FF0055' }]}>
            <Text style={[styles.resultTitle, { color: isPassed ? '#39FF14' : '#FF0055' }]}>
              {isPassed ? '🏆 PHÁT ÂM RẤT CHUẨN!' : '💀 CẦN LUYỆN TẬP THÊM'}
            </Text>
            
            <Text style={styles.scoreText}>⚡ Điểm lần này: {result.score} / 100 ĐIỂM</Text>

            {/* HUY HIỆU SO SÁNH TIẾN BỘ */}
            <View style={styles.scoreComparisonRow}>
              {bestScore > 0 && (
                <View style={styles.bestScoreBadge}>
                  <Text style={styles.bestScoreText}>👑 Kỷ lục bài này: {bestScore}đ</Text>
                </View>
              )}
              {scoreDiff !== null && (
                <View style={[styles.deltaBadge, { backgroundColor: scoreDiff >= 0 ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 0, 85, 0.2)' }]}>
                  <Text style={[styles.deltaText, { color: scoreDiff >= 0 ? '#39FF14' : '#FF0055' }]}>
                    {scoreDiff >= 0 ? `▲ Tăng +${scoreDiff}đ` : `▼ Giảm ${scoreDiff}đ`}
                  </Text>
                </View>
              )}
            </View>

            {/* 📈 BIỂU ĐỒ ĐƯỜNG CONG NGỮ ĐIỆU (INTONATION CONTOUR) */}
            <IntonationCanvas targetContour={targetContour} studentContour={studentContour} />

            {/* KHỐI ĐỐI CHIẾU IPA LỆCH TRỰC QUAN */}
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
                      <Text style={styles.ipaSectionTitle}>🔬 SOI ÂM VỊ CHI TIẾT (IPA PHONEMIC INSPECTOR):</Text>
                      
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
                                {comparison.isExactMatch ? 'CHÍNH XÁC ✓' : 'LỆCH ÂM ✗'}
                              </Text>
                            </View>

                            <View style={styles.ipaCompareRow}>
                              <View style={styles.ipaBox}>
                                <Text style={styles.ipaBoxLabel}>ÂM CHUẨN MỤC TIÊU</Text>
                                <Text style={styles.targetIpaText}>{comparison.targetIpa || `/${word.toLowerCase()}/`}</Text>
                              </View>

                              <View style={styles.arrowContainer}>
                                <Text style={styles.ipaVsArrow}>➔</Text>
                              </View>

                              <View style={styles.ipaBox}>
                                <Text style={[styles.ipaBoxLabel, { textAlign: 'right' }]}>AI THU NHẬN ĐƯỢC</Text>
                                <Text style={[styles.heardIpaText, { color: comparison.isExactMatch ? '#39FF14' : '#FF0055' }]}>
                                  {comparison.heardIpa || '(Không rõ)'}
                                </Text>
                              </View>
                            </View>

                            {comparison.tip && (
                              <View style={styles.ipaTipBox}>
                                <Text style={styles.ipaTipText}>💡 Mẹo khẩu hình: {comparison.tip}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.wordHighlightBox}>
                    <Text style={styles.wordHighlightTitle}>🎯 CHI TIẾT TỪNG TỪ MỤC TIÊU:</Text>
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

            {/* 🎧 KHỐI PHÁT AUDIO AN TOÀN TRÁNH XUNG ĐỘT TOUCH BANK CỦA REACT NATIVE WEB */}
            {result.audioUrl ? (
              <View style={styles.audioPlayerBox}>
                <Text style={styles.audioLabel}>🎧 Nghe lại bài phát âm của bạn:</Text>
                {React.createElement(
                  'div',
                  {
                    style: { width: '100%', marginTop: 6 },
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
                    style: { width: '100%', height: 36 }
                  })
                )}
              </View>
            ) : null}

            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 Âm AI nghe được thực tế:</Text>
              <Text style={styles.scriptContent}>"{result.transcript || '(Không nghe rõ từ)'}"</Text>
            </View>

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
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 12, fontWeight: '900' },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  tabBtn: { flex: 1, backgroundColor: '#0D0620', paddingVertical: 10, marginHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  tabText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  tabTextActive: { color: '#FFF' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 10 },
  drillEn: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  drillVi: { color: '#FFD700', fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  phonetics: { color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  targetFocus: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 12 },
  ttsBtn: { backgroundColor: '#1A0B2E', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 10 },
  ttsBtnActive: { backgroundColor: '#00FFFF' },
  ttsBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 10 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10.5, fontWeight: 'bold' },
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