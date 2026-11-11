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
export type SupportedLang = 'vi' | 'th' | 'ja' | 'ko' | 'id' | 'zh';

export interface MultilingualHint {
  vi: string;
  th: string;
  ja: string;
  ko: string;
  id: string;
  zh: string;
}

export interface Station1DrillItem {
  id: string;
  title: string;
  contentEn: string;
  contentVi?: string;
  targetFocus: string;
  phoneticSpelling?: string;
  sessionKey?: string;
  hint?: MultilingualHint;
}

const LANG_CONFIG: Record<SupportedLang, { flag: string; label: string; code: string }> = {
  vi: { flag: '🇻🇳', label: 'Tiếng Việt', code: 'VN' },
  th: { flag: '🇹🇭', label: 'ภาษาไทย', code: 'TH' },
  ja: { flag: '🇯🇵', label: '日本語', code: 'JP' },
  ko: { flag: '🇰🇷', label: '한국어', code: 'KR' },
  id: { flag: '🇮🇩', label: 'Bahasa Indonesia', code: 'ID' },
  zh: { flag: '🇨🇳', label: '中文', code: 'CN' }
};

// 📚 TỪ ĐIỂN ĐA NGÔN NGỮ CHUẨN XÁC CHO KHO MẪU (CHỐNG NHIỄM TIẾNG VIỆT)
const PRESET_MULTILINGUAL_MAP: Record<string, MultilingualHint> = {
  'leave / live': {
    vi: 'Rời đi / Sống, sinh sống',
    th: 'ออกเดินทาง / อาศัยอยู่',
    ja: '去る、出発する / 住む、生きる',
    ko: '떠나다 / 살다, 거주하다',
    id: 'Pergi, meninggalkan / Tinggal, hidup',
    zh: '离开 / 居住、生活'
  },
  'sheep / ship': {
    vi: 'Con cừu / Tàu thuyền',
    th: 'แกะ / เรือเดินสมุทร',
    ja: '羊 / 船',
    ko: '양 / 배 (선박)',
    id: 'Domba / Kapal laut',
    zh: '绵羊 / 轮船'
  },
  'seat / sit': {
    vi: 'Chỗ ngồi / Ngồi xuống',
    th: 'ที่นั่ง / นั่งลง',
    ja: '座席 / 座る',
    ko: '좌석 / 앉다',
    id: 'Tempat duduk / Duduk',
    zh: '座位 / 坐下'
  },
  'heat / hit': {
    vi: 'Hơi nóng / Đánh, va chạm',
    th: 'ความร้อน / ตี, กระทบ',
    ja: '熱 / 打つ、当たる',
    ko: '열기 / 치다, 때리다',
    id: 'Panas / Memukul',
    zh: '热度 / 击打'
  },
  'reach / rich': {
    vi: 'Chạm tới / Giàu có',
    th: 'เอื้อมถึง / ร่ำรวย',
    ja: '届く、達する / 裕福な',
    ko: '도달하다 / 부유한',
    id: 'Mencapai / Kaya raya',
    zh: '达到、触及 / 富有'
  },
  'read / red': {
    vi: 'Đọc sách / Màu đỏ',
    th: 'อ่าน / สีแดง',
    ja: '読む / 赤色',
    ko: '읽다 / 빨간색',
    id: 'Membaca / Warna merah',
    zh: '阅读 / 红色'
  },
  'bad / bed': {
    vi: 'Tồi tệ, xấu / Chiếc giường',
    th: 'แย่, ไม่ดี / เตียงนอน',
    ja: '悪い / ベッド',
    ko: '나쁜 / 침대',
    id: 'Buruk / Tempat tidur',
    zh: '不好的 / 床铺'
  },
  'pan / pen': {
    vi: 'Cái chảo / Cây bút',
    th: 'กระทะ / ปากกา',
    ja: 'フライパン / ペン',
    ko: '냄비 (팬) / 펜',
    id: 'Wajan / Pena',
    zh: '平底锅 / 钢笔'
  },
  'man / men': {
    vi: 'Một người đàn ông / Những người đàn ông',
    th: 'ผู้ชาย 1 คน / ผู้ชายหลายคน',
    ja: '男性（単数） / 男性たち（複数）',
    ko: '남자 (단수) / 남자들 (복수)',
    id: 'Seorang pria / Pria-pria',
    zh: '男人（单数） / 男人们（复数）'
  },
  'fan / van': {
    vi: 'Cái quạt / Xe tải nhỏ',
    th: 'พัดลม / รถตู้',
    ja: '扇風機、うちわ / バン（車）',
    ko: '선풍기 / 밴 (승합차)',
    id: 'Kipas angin / Mobil van',
    zh: '风扇 / 厢式货车'
  }
};

// 🌐 TỪ ĐIỂN MẸO KHẨU HÌNH ĐA NGÔN NGỮ THEO LÁ CỜ ĐÃ CHỌN
const ARTICULATION_TIPS_MULTILINGUAL: Record<string, Record<SupportedLang, string>> = {
  'correct': {
    vi: 'Khẩu hình chuẩn xác!',
    th: 'รูปปากและการออกเสียงถูกต้องอย่างสมบูรณ์!',
    ja: '正確な口の形と調音です！',
    ko: '완벽하고 정확한 조음과 입모양입니다!',
    id: 'Bentuk mulut dan artikulasi tepat!',
    zh: '口型与发音非常准确！'
  },
  'short_vowel_i': {
    vi: 'Đừng kéo dài âm quá mức; giữ âm /ɪ/ ngắn và dứt khoát.',
    th: 'อย่าลากเสียงยาวเกินไป รักษาเสียงสระ /ɪ/ ให้สั้นและกระชับ',
    ja: '音を伸ばしすぎないでください。/ɪ/ は短く歯切れよく発音します。',
    ko: '소리를 너무 길게 끌지 마세요. /ɪ/ 발음은 짧고 분명하게 유지하세요.',
    id: 'Jangan memanjangkan vokal berlebihan; jaga vokal /ɪ/ tetap pendek dan tegas.',
    zh: '切勿将元音拖得过长，保持短元音 /ɪ/ 短促有力。'
  },
  'long_vowel_i': {
    vi: 'Kéo khóe miệng sang hai bên như đang cười mỉm để phát âm /iː/ tròn và dài hơi.',
    th: 'ฉีกมุมปากไปด้านข้างคล้ายรอยยิ้มเพื่อลากเสียงสระยาว /iː/',
    ja: '口角を横に引いて微笑むように、長い母音 /iː/ をしっかり伸ばします。',
    ko: '미소를 짓듯 입꼬리를 양옆으로 당기며 장모음 /iː/를 충분히 길게 내세요.',
    id: 'Tarik sudut bibir ke samping seperti tersenyum untuk membunyikan vokal panjang /iː/.',
    zh: '嘴角向两侧稍展如微笑状，发足长元音 /iː/ 的时长。'
  }
};

function resolveArticulationTip(tipVi: string, lang: SupportedLang): string {
  if (!tipVi) return '';
  if (tipVi.includes('chuẩn xác') || tipVi.includes('chính xác')) {
    return ARTICULATION_TIPS_MULTILINGUAL['correct'][lang];
  }
  if (tipVi.includes('dứt khoát') || tipVi.includes('ngắn') || tipVi.includes('kéo dài âm quá mức')) {
    return ARTICULATION_TIPS_MULTILINGUAL['short_vowel_i'][lang];
  }
  if (tipVi.includes('kéo dài') || tipVi.includes('cười mỉm')) {
    return ARTICULATION_TIPS_MULTILINGUAL['long_vowel_i'][lang];
  }
  return tipVi;
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
    feedback = '🌟 Pitch contour and sentence rhythm closely match the native model!';
  } else if (matchScore >= 70) {
    feedback = '👍 Pitch contour is fairly steady; pay attention to smoother pitch transitions.';
  } else {
    feedback = '⚠️ Intonation contour (green) fluctuates noticeably compared to the model (gold). Listen to the model again and glide gently between pitches!';
  }

  return { score: matchScore, feedback };
}

export default function Station1Screen({ onBack }: Props) {
  const [activeType, setActiveType] = useState<DrillType>('minimal_pairs');
  const [currentDrill, setCurrentDrill] = useState<Station1DrillItem | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);

  // 🌐 MULTILINGUAL HINT STATE (PERSISTENT & VISIBLE)
  const [selectedLang, setSelectedLang] = useState<SupportedLang>('vi');
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

    // 1. Tách các từ phân cách bởi dấu gạch chéo '/' thành danh sách từ rõ ràng
    const parts = text.split('/').map(w => w.trim()).filter(Boolean);

    // 2. Chuẩn hóa từng từ: Nếu gặp từ 'live' trong cặp đối lập ngữ âm -> hướng dẫn engine đọc đúng /lɪv/
    const normalizedParts = parts.map(word => {
      const lower = word.toLowerCase();
      if (lower === 'live') {
        return 'liv'; // Trợ âm phiên âm học giúp Microsoft TTS đọc chính xác /lɪv/ thay vì /laɪv/
      }
      if (lower === 'come in') return 'cum in';
      if (lower === 'read' && text.toLowerCase().includes('red')) return 'reed';
      return word;
    });

    // 3. Nối bằng dấu chấm lửng kèm khoảng nghỉ để AI ngắt nhịp tự nhiên, KHÔNG BAO GIỜ đọc từ 'slash'
    return normalizedParts.join(' ... ');
  };

  // 🔊 DUAL-LAYER AUDIO PLAYBACK: EDGE-TTS WITH CLIENT SYNTHESIS FALLBACK
  const playSampleAudio = async (textToSpeak: string) => {
    if (!textToSpeak) return;
    stopAllAudio();
    setIsPlayingTTS(true);

    const cleanSpeechText = normalizeSpeechTextForTTS(textToSpeak);

    // Layer 1: Call Microsoft Edge-TTS serverless endpoint
    try {
      const ttsUrl = `/api/tts?voice=nova&text=${encodeURIComponent(cleanSpeechText)}`;
      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsPlayingTTS(false);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        console.warn("Edge-TTS unavailable, falling back to local synthesis...");
        playLocalSampleFallback(cleanSpeechText);
      };

      await audio.play();
      return;
    } catch (e) {
      console.warn("TTS Error:", e);
      playLocalSampleFallback(cleanSpeechText);
    }
  };

  // Layer 2: Client Synthesis Fallback
  const playLocalSampleFallback = (cleanSpeechText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingTTS(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingTTS(true);
    utterance.onend = () => setIsPlayingTTS(false);
    utterance.onerror = () => setIsPlayingTTS(false);

    window.speechSynthesis.speak(utterance);
  };

  // 🤖 BACKGROUND AI REFILL VIA GROQ (ZERO-LATENCY BUFFER)
  const triggerBackgroundAiRefill = async (type: DrillType) => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey || isFetchingAiRef.current) return;

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
  "title": "Short title in English",
  "contentEn": "The English target phrase or pair",
  "targetFocus": "Phonetic target focus in English",
  "phoneticSpelling": "IPA phonetic notation",
  "hintVi": "Summary translation in Vietnamese",
  "hintTh": "Summary translation in Thai (MUST BE REAL THAI, e.g. ออกเดินทาง / อาศัยอยู่)",
  "hintJa": "Summary translation in Japanese (MUST BE REAL JAPANESE, e.g. 去る / 住む)",
  "hintKo": "Summary translation in Korean (MUST BE REAL KOREAN, e.g. 떠나다 / 살다)",
  "hintId": "Summary translation in Indonesian (MUST BE REAL INDONESIAN, e.g. pergi / tinggal)",
  "hintZh": "Summary translation in Chinese (MUST BE REAL CHINESE, e.g. 离开 / 居住)"
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
          title: `🤖 [AI] ${content.title}`,
          contentEn: content.contentEn,
          targetFocus: content.targetFocus || 'Acoustic Phoneme Focus',
          phoneticSpelling: content.phoneticSpelling || '',
          sessionKey: `ai_${Date.now()}`,
          hint: {
            vi: content.hintVi || content.contentEn,
            th: content.hintTh || content.contentEn,
            ja: content.hintJa || content.contentEn,
            ko: content.hintKo || content.contentEn,
            id: content.hintId || content.contentEn,
            zh: content.hintZh || content.contentEn
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

    // 1. Tiêu thụ bài từ hàng đợi AI ngầm nếu đã có
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

    // 2. Nạp từ kho bài mẫu 0ms có đối chiếu từ điển đa ngôn ngữ (KHÔNG BỊ NHIỄM TIẾNG VIỆT)
    let bank: (LinkingSoundItem | MinimalPairItem | TongueTwisterItem)[] = [];
    if (type === 'minimal_pairs') bank = MINIMAL_PAIRS_DATA;
    else if (type === 'linking_sounds') bank = LINKING_SOUNDS_DATA;
    else bank = TONGUE_TWISTERS_DATA;

    const currentIdx = categoryIndices[type];
    const nextIdx = currentIdx + 1;
    setCategoryIndices(prev => ({ ...prev, [type]: nextIdx }));

    const rawDrill = bank[nextIdx % bank.length];
    const loopNum = Math.floor(nextIdx / bank.length) + 1;

    // Đối chiếu từ điển đa ngôn ngữ chuẩn cho bài mẫu
    const lookupKey = (rawDrill.contentEn || '').toLowerCase().trim();
    const mappedHint = PRESET_MULTILINGUAL_MAP[lookupKey] || {
      vi: rawDrill.contentVi || rawDrill.contentEn,
      th: rawDrill.contentEn,
      ja: rawDrill.contentEn,
      ko: rawDrill.contentEn,
      id: rawDrill.contentEn,
      zh: rawDrill.contentEn
    };

    const newDrill: Station1DrillItem = {
      ...rawDrill,
      title: loopNum > 1 ? `${rawDrill.title} (#${loopNum})` : rawDrill.title,
      sessionKey: `preset_${type}_${nextIdx}_${Date.now()}`,
      hint: mappedHint
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
          safeAlert("🔒 Microphone access is not granted in your browser!");
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
        safeAlert("🔒 Please allow microphone access in your browser to record!");
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
        safeAlert("⚠️ Audio clip is too short! Pronounce the target sound fully before stopping.");
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || isProcessingAudio) {
      safeAlert("🔒 Please pronounce the target sound into the microphone before submitting!");
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
        finalFeedback = `👍 Accurate phoneme clarity (${rawPronunciationScore} pts), but intonation pitch (green) needs smoother modulation (${intonation.score} pts). ${intonation.feedback}`;
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
      safeAlert("⚠️ AI Evaluation latency. Please tap submit again!");
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
          <Text style={styles.backText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 STATION 1: PRONUNCIATION LAB</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 35 }}>
        {/* DRILL FORMAT SELECTOR */}
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
            
            {currentDrill.phoneticSpelling && (
              <Text style={styles.phonetics}>🔊 IPA: {currentDrill.phoneticSpelling}</Text>
            )}
            
            <Text style={styles.targetFocus}>🎯 Focus: {currentDrill.targetFocus}</Text>

            {/* 🌐 MULTILINGUAL HINT BAR - ĐÃ SẠCH BÓNG NHIỄM TIẾNG VIỆT */}
            <View style={styles.hintContainer}>
              <View style={styles.hintHeaderRow}>
                <TouchableOpacity 
                  style={[styles.hintToggleBtn, showHint && styles.hintToggleBtnActive]} 
                  onPress={() => setShowHint(prev => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.hintToggleText, showHint ? { color: '#000000' } : { color: '#FFD700' }]}>
                    {showHint ? '✕ HIDE HINT' : `💡 SHOW HINT (${LANG_CONFIG[selectedLang].code})`}
                  </Text>
                </TouchableOpacity>

                <View style={styles.flagPickerRow}>
                  {(['vi', 'th', 'ja', 'ko', 'id', 'zh'] as SupportedLang[]).map((lang) => {
                    const isSelected = selectedLang === lang;
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={[styles.flagBtn, isSelected && styles.flagBtnActive]}
                        onPress={() => {
                          setSelectedLang(lang);
                          setShowHint(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.flagIcon}>{LANG_CONFIG[lang].flag}</Text>
                        <Text style={[styles.flagCodeText, isSelected ? { color: '#00FFFF' } : { color: '#AAAACC' }]}>
                          {LANG_CONFIG[lang].code}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {showHint && (
                <View style={styles.hintContentBox}>
                  <Text style={styles.hintLanguageTag}>
                    👉 {LANG_CONFIG[selectedLang].flag} {LANG_CONFIG[selectedLang].label}:
                  </Text>
                  <Text style={styles.hintBodyText}>
                    "{currentDrill.hint?.[selectedLang] || currentDrill.contentVi || currentDrill.contentEn}"
                  </Text>
                </View>
              )}
            </View>

            {/* TTS MODEL PLAYBACK - ĐÃ KHỬ TỪ 'SLASH' VÀ SỬA ÂM /lɪv/ */}
            <TouchableOpacity 
              style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
              onPress={() => playSampleAudio(currentDrill.contentEn)}
              activeOpacity={0.7}
            >
              <Text style={styles.ttsBtnText}>
                {isPlayingTTS ? '⏹ PLAYING NEURAL MODEL...' : '🔊 LISTEN TO TARGET MODEL'}
              </Text>
            </TouchableOpacity>

            {/* 0MS ROTATION & PRE-FETCH BUTTON */}
            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => handleLoadNewDrill(activeType)}
              activeOpacity={0.7}
            >
              <Text style={styles.refreshBtnText}>🔄 NEXT DRILL (0MS + AI BUFFER)</Text>
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
                  ? '🔴 RECORDING... (TAP TO STOP)' 
                  : isProcessingAudio
                  ? '⏳ PRESERVING AUDIO TRACK...'
                  : hasRecorded 
                  ? '🔄 RETAKE RECORDING (ENHANCE SCORE)' 
                  : '🎙 TAP TO START RECORDING'}
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
                  {attemptCount > 0 ? '⚡ SUBMIT RETAKE TO UPGRADE SCORE' : '⚡ SUBMIT FOR AI PHONETIC SCORING'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* RESULTS & INTONATION CANVAS */}
        {result && (
          <View style={[styles.box, { borderColor: isPassed ? '#39FF14' : '#FF0055' }]}>
            <Text style={[styles.resultTitle, { color: isPassed ? '#39FF14' : '#FF0055' }]}>
              {isPassed ? '🏆 EXCELLENT PRONUNCIATION!' : '💀 MORE DRILL REQUIRED'}
            </Text>
            
            <Text style={styles.scoreText}>⚡ Session Score: {result.score} / 100 PTS</Text>

            {/* SCORE TRACKING BADGES */}
            <View style={styles.scoreComparisonRow}>
              {bestScore > 0 && (
                <View style={styles.bestScoreBadge}>
                  <Text style={styles.bestScoreText}>👑 Personal Best: {bestScore} pts</Text>
                </View>
              )}
              {scoreDiff !== null && (
                <View style={[styles.deltaBadge, { backgroundColor: scoreDiff >= 0 ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 0, 85, 0.2)' }]}>
                  <Text style={[styles.deltaText, { color: scoreDiff >= 0 ? '#39FF14' : '#FF0055' }]}>
                    {scoreDiff >= 0 ? `▲ +${scoreDiff} pts` : `▼ ${scoreDiff} pts`}
                  </Text>
                </View>
              )}
            </View>

            {/* 📈 DUAL-TRACE INTONATION CONTOUR (ENGLISH-FIRST + EXPLICIT LEGEND) */}
            <View style={styles.intonationWrapper}>
              <View style={styles.intonationHeaderRow}>
                <Text style={styles.intonationTitle}>
                  📈 PITCH INTONATION CONTOUR:
                </Text>
                <View style={styles.intonationLegendRow}>
                  <Text style={{ color: '#FFD700', fontSize: 9.5, fontWeight: 'bold' }}>— Target Model</Text>
                  <Text style={{ color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold', marginLeft: 8 }}>— Your Voice</Text>
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
                      <Text style={styles.ipaSectionTitle}>🔬 IPA PHONEMIC INSPECTOR:</Text>
                      
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
                                {comparison.isExactMatch ? 'MATCHED ✓' : 'PHONEME DEVIATION ✗'}
                              </Text>
                            </View>

                            <View style={styles.ipaCompareRow}>
                              <View style={styles.ipaBox}>
                                <Text style={styles.ipaBoxLabel}>TARGET PHONEME</Text>
                                <Text style={styles.targetIpaText}>{comparison.targetIpa || `/${word.toLowerCase()}/`}</Text>
                              </View>

                              <View style={styles.arrowContainer}>
                                <Text style={styles.ipaVsArrow}>➔</Text>
                              </View>

                              <View style={styles.ipaBox}>
                                <Text style={[styles.ipaBoxLabel, { textAlign: 'right' }]}>AI TRANSCRIBED</Text>
                                <Text style={[styles.heardIpaText, { color: comparison.isExactMatch ? '#39FF14' : '#FF0055' }]}>
                                  {comparison.heardIpa || '(Indistinct)'}
                                </Text>
                              </View>
                            </View>

                            {/* 💡 MẸO KHẨU HÌNH ĐÃ ĐƯỢC DỊCH THÍCH ỨNG THEO LÁ CỜ ĐÃ CHỌN */}
                            {comparison.tip && (
                              <View style={styles.ipaTipBox}>
                                <Text style={styles.ipaTipText}>
                                  💡 Articulation Tip ({LANG_CONFIG[selectedLang].code}): {resolveArticulationTip(comparison.tip, selectedLang)}
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
                    <Text style={styles.wordHighlightTitle}>🎯 TARGET WORD AUDIT:</Text>
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
                <Text style={styles.audioLabel}>🎧 Your Recorded Pronunciation:</Text>
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
              <Text style={styles.scriptLabel}>📝 AI Acoustic Transcription:</Text>
              <Text style={styles.scriptContent}>"{result.transcript || '(Indistinct acoustics)'}"</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  hintToggleBtn: {
    backgroundColor: '#16082F',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  hintToggleBtnActive: {
    backgroundColor: '#FFD700',
  },
  hintToggleText: {
    fontSize: 9,
    fontWeight: '900',
  },
  flagPickerRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#070314',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#332255',
    alignItems: 'center',
  },
  flagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#16082F',
    borderWidth: 1,
    borderColor: '#332255',
  },
  flagBtnActive: {
    backgroundColor: '#2A144E',
    borderColor: '#00FFFF',
  },
  flagIcon: {
    fontSize: 12.5,
  },
  flagCodeText: {
    fontSize: 9,
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