// src/screens/Station2Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import * as AntiCheatModule from '../components/AntiCheatSpeakingSession';
import * as DetailedModalModule from '../components/DetailedSpeechFeedbackModal';
import { evaluateSpeechSubmission } from '../utils/speechEvaluator';
import { evaluateSpeaking } from '../services/arena/assessmentService';
import { supabase } from '../utils/supabase';
import { getSavedStudentProfile, saveStudentProfile } from '../utils/studentSession';
import { getStation2ScenariosByTierAndLevel } from '../data/station2';

// 🛡️ TỰ ĐỘNG BÓC TÁCH COMPONENT CHUẨN XÁC CHỐNG LỖI REACT #130
const AntiCheatSpeakingSession: React.ComponentType<any> = 
  (AntiCheatModule as any).default || 
  (AntiCheatModule as any).AntiCheatSpeakingSession || 
  (() => null);

const DetailedSpeechFeedbackModal: React.ComponentType<any> = 
  (DetailedModalModule as any).default || 
  (DetailedModalModule as any).DetailedSpeechFeedbackModal || 
  (() => null);

export type DetailedFeedbackData = any;

interface Props {
  onBack: () => void;
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Station2Tier = 'SOLO' | 'RELAY' | 'ROLEPLAY';
export type PracticeMode = 'READ_SAMPLE' | 'FREE_SPEECH';
export type TopicOrigin = 'SYSTEM' | 'TEACHER_DASHBOARD' | 'STUDENT_CUSTOM';

export interface ChallengeItem {
  id: string;
  tier: Station2Tier;
  level: CefrLevel;
  title: string;
  place: string;
  task: string;
  contextDesc: string;
  prompt: string;
  hint: { vi: string };
  isTeacherAssigned?: boolean;
  // Dữ liệu mở rộng cho Tầng 2 (Relay 2 lượt)
  turn1RoleVi?: string;
  turn1TaskVi?: string;
  turn1SampleEn?: string;
  turn2RoleVi?: string;
  turn2TaskVi?: string;
  turn2SampleEn?: string;
  // Dữ liệu mở rộng cho Tầng 3 (Roleplay nhập vai)
  userRoleVi?: string;
  aiRoleVi?: string;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const TIERS: { key: Station2Tier; label: string; icon: string; desc: string }[] = [
  { key: 'SOLO', label: 'TẦNG 1: SOLO (PHẢN XẠ CÁ NHÂN)', icon: '🥊', desc: 'Phản xạ tức thì: Tự xử lý tình huống thực tế bất ngờ hoặc các thử thách độc lập.' },
  { key: 'RELAY', label: 'TẦNG 2: RELAY (TIẾP SỨC ĐỒNG ĐỘI)', icon: '🏃', desc: 'Tiếp sức 2 người: Bạn số 1 mở đầu chủ đề, Bạn số 2 bắt nhịp và phát triển tiếp mạch câu chuyện.' },
  { key: 'ROLEPLAY', label: 'TẦNG 3: ROLEPLAY (ĐỐI THOẠI NHẬP VAI)', icon: '🎭', desc: 'Nhập vai tương tác: Giải quyết bất đồng, đàm phán và thuyết phục thực tế.' }
];

// 🎯 LẤY TÌNH HUỐNG TỪ KHO DỮ LIỆU 180 CHỦ ĐỀ (SOLO / RELAY / ROLEPLAY)
const createScenarioFromBank = (tier: Station2Tier, level: CefrLevel, index: number): ChallengeItem => {
  const list = getStation2ScenariosByTierAndLevel(tier, level);
  const raw: any = list[index % list.length];
  const roundNum = Math.floor(index / list.length) + 1;

  // Đối với Relay, câu mẫu phát âm & đối chiếu là chuỗi nối tiếp Lượt 1 -> Lượt 2
  const effectivePrompt = tier === 'RELAY' && raw.turn1SampleEn && raw.turn2SampleEn
    ? `${raw.turn1SampleEn} ${raw.turn2SampleEn}`
    : (raw.sampleAnswerEn || raw.promptEn || '');

  const placeLabel = tier === 'ROLEPLAY' && raw.userRoleVi
    ? `Vai của bạn: ${raw.userRoleVi}`
    : tier === 'RELAY'
    ? 'Đối thoại tiếp sức 2 lượt'
    : `Trình độ ${level}`;

  const taskLabel = tier === 'ROLEPLAY' && raw.aiRoleVi
    ? `Đối thoại cùng: ${raw.aiRoleVi}`
    : tier === 'RELAY'
    ? 'Bạn 1 mở ý ➔ Bạn 2 nối tiếp'
    : 'Phản xạ giao tiếp tự nhiên';

  return {
    id: `${raw.id}_${index}_${Date.now()}`,
    tier,
    level,
    title: roundNum > 1 ? `${raw.title} (Lượt #${roundNum})` : raw.title,
    place: placeLabel,
    task: taskLabel,
    contextDesc: raw.contextVi,
    prompt: effectivePrompt,
    hint: {
      vi: raw.contextVi
    },
    isTeacherAssigned: false,
    turn1RoleVi: raw.turn1RoleVi,
    turn1TaskVi: raw.turn1TaskVi,
    turn1SampleEn: raw.turn1SampleEn,
    turn2RoleVi: raw.turn2RoleVi,
    turn2TaskVi: raw.turn2TaskVi,
    turn2SampleEn: raw.turn2SampleEn,
    userRoleVi: raw.userRoleVi,
    aiRoleVi: raw.aiRoleVi,
  };
};

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

export default function Station2Screen({ onBack }: Props) {
  const [selectedTier, setSelectedTier] = useState<Station2Tier>('ROLEPLAY');
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1');
  const [teacherAssignments, setTeacherAssignments] = useState<ChallengeItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);

  // 🎓 QUẢN LÝ MÃ LỚP & ĐỊNH DANH SINH VIÊN TỰ ĐỘNG (LOCALSTORAGE)
  const [classCodeInput, setClassCodeInput] = useState<string>(() => getSavedStudentProfile().classCode);
  const [studentNameInput, setStudentNameInput] = useState<string>(() => getSavedStudentProfile().studentName);
  const [studentCodeInput, setStudentCodeInput] = useState<string>(() => getSavedStudentProfile().studentCode);
  const [showProfileBar, setShowProfileBar] = useState<boolean>(() => {
    const p = getSavedStudentProfile();
    return !p.studentName || !p.studentCode;
  });

  // 🌐 GỢI Ý THUẦN TIẾNG VIỆT
  const [showHint, setShowHint] = useState<boolean>(true);

  // 🎯 QUẢN LÝ ĐỀ BÀI VÀ HÀNG ĐỢI NẠP BÙ AI NGẦM (KHỞI TẠO NGẪU NHIÊN CHỐNG TRÙNG LỚP)
  const [topicIndex, setTopicIndex] = useState<number>(() => Math.floor(Math.random() * 10));
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeItem>(() => {
    const startIdx = Math.floor(Math.random() * 10);
    return createScenarioFromBank('ROLEPLAY', 'B1', startIdx);
  });
  const [aiQueue, setAiQueue] = useState<ChallengeItem[]>([]);
  const isFetchingAiRef = useRef<boolean>(false);

  // QUẢN LÝ TTS
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      stopSampleAudio();
    };
  }, []);

  const stopSampleAudio = () => {
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
    setIsPlayingSample(false);
  };

  // 🔊 BỘ PHÁT ÂM MẪU CHUẨN IOS & DESKTOP (TRẠM 2)
  const playNaturalTTS = async (text: string) => {
    if (isPlayingSample) {
      stopSampleAudio();
      return;
    }

    const cleanText = text.replace(/["']/g, '').trim();
    if (!cleanText) return;

    stopSampleAudio();
    setIsPlayingSample(true);

    const audio = new Audio();
    audioPlayerRef.current = audio;

    (audio as any).playsInline = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    const ttsUrl = `/api/tts?voice=nova&text=${encodeURIComponent(cleanText)}`;

    audio.onended = () => {
      setIsPlayingSample(false);
      audioPlayerRef.current = null;
    };

    audio.onerror = () => {
      setIsPlayingSample(false);
      audioPlayerRef.current = null;
      fallbackIOSSpeech(cleanText);
    };

    try {
      audio.src = ttsUrl;
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (e) {
      setIsPlayingSample(false);
      audioPlayerRef.current = null;
      fallbackIOSSpeech(cleanText);
    }
  };

  const fallbackIOSSpeech = (cleanText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingSample(false);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synth.getVoices();
    const iosVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Natural') || v.name.includes('Google US English')));
    if (iosVoice) utterance.voice = iosVoice;

    utterance.lang = 'en-US';
    utterance.rate = 0.90;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingSample(true);
    utterance.onend = () => setIsPlayingSample(false);
    utterance.onerror = () => setIsPlayingSample(false);

    synth.speak(utterance);
  };

  const [topicOrigin, setTopicOrigin] = useState<TopicOrigin>('SYSTEM');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('READ_SAMPLE');

  const [customTitle, setCustomTitle] = useState<string>('');
  const [customContext, setCustomContext] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [isNormalPracticing, setIsNormalPracticing] = useState<boolean>(false);
  const [isRecordingNormal, setIsRecordingNormal] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluatingStatus, setEvaluatingStatus] = useState<string>('⚡ ĐANG PHÂN TÍCH ÂM HỌC VÀ CHẤM ĐIỂM BÀI NỘP...');
  const [normalTimer, setNormalTimer] = useState<number>(0);
  const normalMediaRecorderRef = useRef<any>(null);
  const normalAudioChunksRef = useRef<any[]>([]);
  const normalPitchHistoryRef = useRef<number[]>([]);
  const normalAnimFrameRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeMimeTypeRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' });

  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const liveTranscriptRef = useRef<string>('');
  const speechRecognitionRef = useRef<any>(null);
  const isRecordingNormalRef = useRef<boolean>(false);
  const normalStreamRef = useRef<MediaStream | null>(null);
  const normalAudioContextRef = useRef<AudioContext | null>(null);

  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isTeacherExamining, setIsTeacherExamining] = useState<boolean>(false);
  const [detailedModalVisible, setDetailedModalVisible] = useState<boolean>(false);
  const [feedbackResult, setFeedbackResult] = useState<DetailedFeedbackData | null>(null);

  // 🔄 LỌC BÀI TẬP GIẢNG VIÊN GIAO THEO MÃ LỚP (CLASS CODE)
  const fetchTeacherAssignments = async (targetClassCode?: string) => {
    setLoadingAssignments(true);
    const activeCode = (targetClassCode ?? classCodeInput).toUpperCase().trim();
    try {
      if (supabase) {
        let query = supabase
          .from('assignments')
          .select('*')
          .ilike('station_type', '%STATION_2%')
          .order('created_at', { ascending: false });

        if (activeCode) {
          query = query.eq('class_code', activeCode);
        }

        const { data: assignments, error } = await query;

        if (!error && assignments && assignments.length > 0) {
          const teacherItems: ChallengeItem[] = assignments.map((item: any) => {
            let detectedTier: Station2Tier = 'ROLEPLAY';
            const titleUpper = (item.title || '').toUpperCase();
            if (titleUpper.includes('SOLO')) detectedTier = 'SOLO';
            else if (titleUpper.includes('RELAY')) detectedTier = 'RELAY';

            return {
              id: `teacher_${item.id}`,
              tier: detectedTier,
              level: (item.cefr_level || 'B2').toUpperCase() as CefrLevel,
              title: item.title || 'Nhiệm vụ giảng viên giao',
              place: `Lớp ${item.class_code || 'PUBLIC'}`,
              task: 'Hoàn thành thử thách phản xạ được chỉ định',
              contextDesc: item.description || `🏫 Bối cảnh phản xạ được giao (${detectedTier}):`,
              prompt: item.target_prompt || '',
              hint: {
                vi: item.description || "Bài tập do giảng viên giao trực tiếp."
              },
              isTeacherAssigned: true
            };
          });

          setTeacherAssignments(teacherItems);
        } else {
          setTeacherAssignments([]);
        }
      }
    } catch (err) {
      console.warn("Error fetching assignments:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleSaveStudentSession = () => {
    const updated = saveStudentProfile({
      studentName: studentNameInput,
      studentCode: studentCodeInput,
      classCode: classCodeInput,
    });
    setStudentNameInput(updated.studentName);
    setStudentCodeInput(updated.studentCode);
    setClassCodeInput(updated.classCode);
    setShowProfileBar(false);
    fetchTeacherAssignments(updated.classCode);
    Alert.alert("Đã lưu thông tin", `✅ Đã ghi nhớ: ${updated.studentName || 'Học viên'} (${updated.studentCode || 'Chưa có MSSV'}) - Mã lớp: ${updated.classCode || 'Tự do'}`);
  };

  useEffect(() => {
    fetchTeacherAssignments();
    return () => stopSampleAudio();
  }, []);

  useEffect(() => {
    if (topicOrigin === 'TEACHER_DASHBOARD') {
      const filtered = teacherAssignments.filter(t => t.tier === selectedTier && t.level === selectedLevel);
      if (filtered.length > 0) {
        setCurrentChallenge(filtered[0]);
        return;
      } else if (teacherAssignments.length > 0) {
        setCurrentChallenge(teacherAssignments[0]);
        return;
      }
    }
    // Khởi tạo ngẫu nhiên 1 trong 10 bài của cấp độ để tránh trùng đề trong lớp
    const randomStart = Math.floor(Math.random() * 10);
    const fresh = createScenarioFromBank(selectedTier, selectedLevel, randomStart);
    setCurrentChallenge(fresh);
    setTopicIndex(randomStart);
    setAiQueue([]);
  }, [selectedTier, selectedLevel, topicOrigin, teacherAssignments]);

  // 🤖 BACKGROUND AI REFILL QUA SERVERLESS API BẢO MẬT
  const triggerBackgroundAiRefill = async (tier: Station2Tier, level: CefrLevel) => {
    if (isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      const tierInstruction = tier === 'RELAY'
        ? `This is a 2-speaker RELAY speaking task where Speaker 1 starts the topic and Speaker 2 continues the same topic seamlessly. Include turn1RoleVi, turn1TaskVi, turn1SampleEn, turn2RoleVi, turn2TaskVi, turn2SampleEn.`
        : `This is a ${tier} speaking task at CEFR ${level}.`;

      const promptInstruction = `Create 1 UNIQUE situational reflex challenge for Station 2 at CEFR level ${level} in tier ${tier}. ${tierInstruction}
Avoid repeating title: "${currentChallenge?.title || ''}".
Output ONLY raw JSON:
{
  "title": "Tên chủ đề ngắn gọn bằng tiếng Việt",
  "place": "Vai trò hoặc bối cảnh ngắn gọn bằng tiếng Việt",
  "task": "Nhiệm vụ chính bằng tiếng Việt",
  "contextDesc": "Mô tả bối cảnh tình huống chi tiết bằng tiếng Việt",
  "prompt": "Natural spoken English sample answer",
  "hintVi": "Tóm tắt gợi ý cốt lõi bằng tiếng Việt",
  "turn1RoleVi": "🏃 Bạn số 1 (Khởi động)",
  "turn1TaskVi": "Nhiệm vụ bạn số 1 (nếu là RELAY)",
  "turn1SampleEn": "Sample turn 1 in English (if RELAY)",
  "turn2RoleVi": "🏃‍♂️ Bạn số 2 (Tiếp sức)",
  "turn2TaskVi": "Nhiệm vụ bạn số 2 nối tiếp (nếu là RELAY)",
  "turn2SampleEn": "Sample turn 2 continuing the topic (if RELAY)"
}`;

      const res = await fetch('/api/generate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, level, promptInstruction }),
      });

      if (res.ok) {
        const content = await res.json();
        const combinedRelayPrompt = tier === 'RELAY' && content.turn1SampleEn && content.turn2SampleEn
          ? `${content.turn1SampleEn} ${content.turn2SampleEn}`
          : content.prompt;

        const newAiItem: ChallengeItem = {
          id: `ai_${Date.now()}_${Math.random()}`,
          tier,
          level,
          title: `🤖 [AI] ${content.title}`,
          place: content.place || 'Bối cảnh AI tạo',
          task: content.task || 'Phản xạ giao tiếp',
          contextDesc: content.contextDesc,
          prompt: combinedRelayPrompt,
          hint: {
            vi: content.hintVi || content.contextDesc
          },
          isTeacherAssigned: false,
          turn1RoleVi: content.turn1RoleVi,
          turn1TaskVi: content.turn1TaskVi,
          turn1SampleEn: content.turn1SampleEn,
          turn2RoleVi: content.turn2RoleVi,
          turn2TaskVi: content.turn2TaskVi,
          turn2SampleEn: content.turn2SampleEn,
        };
        setAiQueue(prev => [...prev, newAiItem]);
      }
    } catch (e) {
      console.warn("Background AI refiller paused:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  const handleNextTopic = () => {
    stopSampleAudio();
    const nextIdx = topicIndex + 1;
    setTopicIndex(nextIdx);

    if (topicOrigin === 'TEACHER_DASHBOARD' && teacherAssignments.length > 0) {
      setCurrentChallenge(teacherAssignments[nextIdx % teacherAssignments.length]);
      return;
    }

    if (aiQueue.length > 0) {
      const [aiItem, ...remainingQueue] = aiQueue;
      setAiQueue(remainingQueue);
      setCurrentChallenge(aiItem);
      triggerBackgroundAiRefill(selectedTier, selectedLevel);
      return;
    }

    const freshPreset = createScenarioFromBank(selectedTier, selectedLevel, nextIdx);
    setCurrentChallenge(freshPreset);
    triggerBackgroundAiRefill(selectedTier, selectedLevel);
  };

  const handleStartCustomTopic = () => {
    stopSampleAudio();
    if (!customTitle.trim() || !customPrompt.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập cả Tiêu đề và Câu tiếng Anh phản xạ mục tiêu!");
      return;
    }

    const customItem: ChallengeItem = {
      id: `custom_${Date.now()}`,
      tier: selectedTier,
      level: selectedLevel,
      title: customTitle.trim(),
      place: 'Bối cảnh người dùng tự tạo',
      task: 'Thực hiện phản xạ nói tiếng Anh tự nhiên',
      contextDesc: customContext.trim() || `Thử thách phản xạ tùy chỉnh (${selectedTier} - ${selectedLevel}):`,
      prompt: customPrompt.trim(),
      hint: {
        vi: customContext.trim() || customTitle.trim()
      },
      isTeacherAssigned: false
    };

    setCurrentChallenge(customItem);
    setIsNormalPracticing(true);
    setIsTeacherExamining(false);
    setNormalTimer(0);
    setIsRecordingNormal(false);
  };

  const handleEnterRoom = (item: ChallengeItem) => {
    stopSampleAudio();
    setCurrentChallenge(item);
    if (item.isTeacherAssigned) {
      setIsTeacherExamining(true);
      setIsNormalPracticing(false);
    } else {
      setIsNormalPracticing(true);
      setIsTeacherExamining(false);
      setNormalTimer(0);
      setIsRecordingNormal(false);
    }
  };

  // 🎙️ KHỞI ĐỘNG GHI ÂM VÀ NHẬN DIỆN GIỌNG NÓI THỜI GIAN THỰC
  const startNormalRecording = async () => {
    stopSampleAudio();

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.abort(); } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (normalStreamRef.current) {
      normalStreamRef.current.getTracks().forEach(t => t.stop());
      normalStreamRef.current = null;
    }
    if (normalAudioContextRef.current && normalAudioContextRef.current.state !== 'closed') {
      try { normalAudioContextRef.current.close(); } catch (e) {}
      normalAudioContextRef.current = null;
    }

    try {
      normalAudioChunksRef.current = [];
      normalPitchHistoryRef.current = [];
      setNormalTimer(0);
      setLiveTranscript('');
      liveTranscriptRef.current = '';

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1, 
          sampleRate: 16000, 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } 
      });
      normalStreamRef.current = stream;
      
      const detectedFormat = getSupportedAudioMimeType();
      activeMimeTypeRef.current = detectedFormat;

      const options: any = {
        audioBitsPerSecond: 32000,
        ...(detectedFormat.mimeType ? { mimeType: detectedFormat.mimeType } : {})
      };
      const mediaRecorder = new (window as any).MediaRecorder(stream, options);
      normalMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) normalAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecordingNormal(true);
      isRecordingNormalRef.current = true;

      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.maxAlternatives = 1;

          let accumulatedFinalTranscript = '';

          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const part = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                accumulatedFinalTranscript += part + ' ';
              } else {
                interim += part;
              }
            }

            const cleanLive = (accumulatedFinalTranscript + interim).trim();
            if (cleanLive) {
              liveTranscriptRef.current = cleanLive;
              setLiveTranscript(cleanLive);
            }
          };

          recognition.onerror = (e: any) => {
            if (e.error !== 'no-speech' && e.error !== 'aborted') {
              console.warn("SpeechRecognition event error:", e.error);
            }
          };

          recognition.onend = () => {
            if (isRecordingNormalRef.current) {
              try {
                recognition.start();
              } catch (err) {}
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition initiation bypassed:", e);
        }
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      normalAudioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      const sampleRate = audioCtx.sampleRate;

      const track = () => {
        analyser.getFloatTimeDomainData(buffer);
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
        rms = Math.sqrt(rms / buffer.length);
        if (rms >= 0.015) {
          let r1 = 0, r2 = buffer.length - 1;
          for (let i = 0; i < buffer.length / 2; i++) if (Math.abs(buffer[i]) < 0.2) { r1 = i; break; }
          for (let i = 1; i < buffer.length / 2; i++) if (Math.abs(buffer[buffer.length - i]) < 0.2) { r2 = buffer.length - i; break; }
          const tb = buffer.slice(r1, r2);
          const c = new Array(tb.length).fill(0);
          for (let i = 0; i < tb.length; i++) for (let j = 0; j < tb.length - i; j++) c[i] += tb[j] * tb[j + i];
          let d = 0;
          while (c[d] > c[d + 1]) d++;
          let maxval = -1, maxpos = -1;
          for (let i = d; i < tb.length; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
          const pitch = maxpos > 0 ? sampleRate / maxpos : -1;
          if (pitch >= 60 && pitch <= 450) {
            normalPitchHistoryRef.current.push(pitch);
          }
        }
        drawLiveWaveform(buffer);
        normalAnimFrameRef.current = requestAnimationFrame(track);
      };
      track();
    } catch (err) {
      setIsRecordingNormal(false);
      isRecordingNormalRef.current = false;
      Alert.alert("Lỗi Microphone", "Không thể truy cập microphone. Vui lòng cấp quyền micro trong trình duyệt của bạn.");
    }
  };

  const drawLiveWaveform = (buffer: Float32Array) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00FFFF';
    ctx.beginPath();
    const sliceWidth = canvas.width / buffer.length;
    let x = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i] * 50;
      const y = (canvas.height / 2) + v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  // 🛑 DỪNG GHI ÂM VÀ GIẢI PHÓNG TOÀN BỘ PHẦN CỨNG ÂM THANH
  const stopNormalRecording = () => {
    isRecordingNormalRef.current = false;

    if (speechRecognitionRef.current) {
      try { 
        speechRecognitionRef.current.stop(); 
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (normalAnimFrameRef.current) {
      cancelAnimationFrame(normalAnimFrameRef.current);
      normalAnimFrameRef.current = null;
    }

    if (normalAudioContextRef.current && normalAudioContextRef.current.state !== 'closed') {
      try { normalAudioContextRef.current.close(); } catch (e) {}
      normalAudioContextRef.current = null;
    }

    if (normalStreamRef.current) {
      normalStreamRef.current.getTracks().forEach(t => t.stop());
      normalStreamRef.current = null;
    }

    if (normalMediaRecorderRef.current && normalMediaRecorderRef.current.state !== 'inactive') {
      normalMediaRecorderRef.current.stop();
      normalMediaRecorderRef.current.onstop = () => {
        const { mimeType } = activeMimeTypeRef.current;
        const audioBlob = new Blob(normalAudioChunksRef.current, mimeType ? { type: mimeType } : undefined);
        const localUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(localUrl);
        finishSubmissionAndEvaluate(audioBlob, normalPitchHistoryRef.current, localUrl);
      };
    }
    setIsRecordingNormal(false);
  };

  useEffect(() => {
    let timer: any = null;
    if (isRecordingNormal) {
      timer = setInterval(() => setNormalTimer(prev => prev + 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isRecordingNormal]);

  // 📊 XỬ LÝ CHẤM ĐIỂM VÀ ĐỒNG BỘ TAPESCRIPT WHISPER + MÃ LỚP
  const finishSubmissionAndEvaluate = async (audioBlob: Blob, pitchHistory: number[], localAudioUrl?: string) => {
    setIsEvaluating(true);
    setEvaluatingStatus('⚡ AI ĐANG PHÂN TÍCH ÂM HỌC & XUẤT BẢN GHI SCRIPT...');

    if (localAudioUrl) {
      setRecordedAudioUrl(localAudioUrl);
    } else {
      setRecordedAudioUrl(URL.createObjectURL(audioBlob));
    }

    let actualTranscript = liveTranscriptRef.current.trim();
    let serverEvalData: any = null;

    const targetPrompt = practiceMode === 'READ_SAMPLE' 
      ? (currentChallenge?.prompt || '') 
      : `Reflex challenge: ${currentChallenge?.contextDesc || ''}`;

    const MAX_RETRIES = 2;
    let attempt = 0;
    let success = false;

    while (attempt <= MAX_RETRIES && !success) {
      try {
        if (attempt > 0) {
          setEvaluatingStatus(`🔄 Đang kết nối lại máy chủ đánh giá (${attempt}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, 1200));
        }

        serverEvalData = await evaluateSpeaking(audioBlob, selectedLevel, '2', targetPrompt);
        if (serverEvalData) {
          success = true;
          if (serverEvalData.transcript && serverEvalData.transcript.trim()) {
            actualTranscript = serverEvalData.transcript.trim();
            setLiveTranscript(actualTranscript);
            liveTranscriptRef.current = actualTranscript;
          }
        }
      } catch (err) {
        attempt++;
        console.warn(`Evaluation attempt ${attempt} failed:`, err);
      }
    }

    if (!success && (!actualTranscript || actualTranscript.length < 3)) {
      setIsEvaluating(false);
      Alert.alert(
        "Kết nối gián đoạn",
        "Độ trễ mạng khiến AI chưa chấm được điểm. Bản thu đã được lưu an toàn; vui lòng kiểm tra kết nối và bấm 'Chấm điểm lại'.",
        [
          { text: "Đóng", style: "cancel" },
          { text: "🔄 Chấm điểm lại", onPress: () => finishSubmissionAndEvaluate(audioBlob, pitchHistory, localAudioUrl) }
        ]
      );
      return;
    }

    const WHISPER_HALLUCINATIONS = [
      'thank you', 'thank you.', 'thank you very much', 'thank you for watching',
      'thanks for watching', 'you', 'bye', 'bye.', 'subtitles', 'subscribe', 'the end'
    ];

    const cleanLowerTranscript = actualTranscript.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const isHallucination = WHISPER_HALLUCINATIONS.some(h => cleanLowerTranscript === h);
    const validWords = actualTranscript.replace(/[^a-zA-Z0-9]/g, '').trim();

    let hasMatchingSampleWord = true;
    if (practiceMode === 'READ_SAMPLE' && currentChallenge?.prompt) {
      const promptWords = currentChallenge.prompt.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2);
      const spokenWords = cleanLowerTranscript.split(/\s+/);
      hasMatchingSampleWord = spokenWords.some(w => promptWords.includes(w));
    }

    const isSilence = 
      !validWords || 
      validWords.length < 3 || 
      isHallucination || 
      (pitchHistory && pitchHistory.length < 3) ||
      (!hasMatchingSampleWord && practiceMode === 'READ_SAMPLE');

    if (isSilence) {
      setIsEvaluating(false);
      const zeroEvaluation = {
        totalScore: 0,
        spontaneityScore: 0,
        isScriptSuspected: false,
        rubrics: {
          pronunciation: { score: 0, feedback: "Không phát hiện tiếng nói tiếng Anh hợp lệ." },
          intonation: { score: 0, feedback: "Không nhận diện được đường cong ngữ điệu." },
          fluency: { score: 0, feedback: "Đoạn thu hoàn toàn im lặng." },
          vocabulary: { score: 0, feedback: "Không ghi nhận từ vựng mục tiêu." },
          grammar: { score: 0, feedback: "Chưa cấu thành câu ngữ pháp hoàn chỉnh." },
          content: { score: 0, feedback: "Chưa có nội dung phản xạ phù hợp." }
        }
      };

      setFeedbackResult(zeroEvaluation);
      setDetailedModalVisible(true);
      Alert.alert(
        "Không phát hiện giọng nói",
        "Hệ thống không ghi nhận giọng nói tiếng Anh rõ ràng trong thử thách này. Kết quả: 0 Điểm. Hãy phát âm rõ ràng vào micro!"
      );
      return;
    }

    setEvaluatingStatus('📊 Đang tổng hợp phiếu điểm đa chiều...');
    const duration = Math.max(normalTimer, 2);
    let evaluated: any;

    if (practiceMode === 'READ_SAMPLE') {
      evaluated = evaluateSpeechSubmission({
        transcript: actualTranscript,
        targetPrompt: currentChallenge?.prompt || '',
        pitchHistory,
        durationSeconds: duration,
        cefrLevel: currentChallenge?.level || selectedLevel
      });
    } else {
      evaluated = evaluateSpeechSubmission({
        transcript: actualTranscript,
        targetPrompt: actualTranscript || currentChallenge?.prompt || '',
        pitchHistory,
        durationSeconds: duration,
        cefrLevel: currentChallenge?.level || selectedLevel
      });

      if (actualTranscript && actualTranscript.split(/\s+/).filter(Boolean).length >= 4) {
        evaluated.spontaneityScore = Math.min(100, Math.max(evaluated.spontaneityScore, 85));
        evaluated.rubrics.content.score = Math.min(100, Math.max(evaluated.rubrics.content.score, 88));
      }
    }

    if (serverEvalData?.criteria?.pronunciation) {
      evaluated.rubrics.pronunciation.score = serverEvalData.criteria.pronunciation;
    }

    const r = evaluated.rubrics;
    const weightedTotal = Math.round(
      (r.pronunciation.score * 0.20) +
      (r.intonation.score * 0.20) +
      (r.fluency.score * 0.15) +
      (r.vocabulary.score * 0.15) +
      (r.grammar.score * 0.15) +
      (r.content.score * 0.15)
    );
    evaluated.totalScore = weightedTotal;

    let audioUrl = '';
    try {
      if (supabase) {
        const ext = activeMimeTypeRef.current.extension || 'webm';
        const contentType = activeMimeTypeRef.current.mimeType || (ext === 'mp4' ? 'audio/mp4' : 'audio/webm');
        const fileName = `station2_${selectedTier.toLowerCase()}_${selectedLevel.toLowerCase()}_${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('submissions')
          .upload(fileName, audioBlob, { contentType });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
          audioUrl = urlData?.publicUrl || '';
        }

        const profile = getSavedStudentProfile();
        const { data: authUser } = await supabase.auth.getUser();
        await supabase.from('submissions').insert([{
          student_name: profile.studentName || authUser?.user?.user_metadata?.full_name || 'Học viên Đấu Trường',
          student_code: profile.studentCode || authUser?.user?.email?.split('@')[0] || 'STU_S2',
          class_code: profile.classCode || 'PUBLIC',
          class_name: `[${profile.classCode || 'PUBLIC'}] Trạm 2: ${selectedTier} (${selectedLevel}) [${practiceMode === 'READ_SAMPLE' ? 'Đọc Mẫu' : 'Phản Xạ Tự Nhiên'}]`,
          mode: `STATION_2_${selectedTier}`,
          cefr_level: currentChallenge?.level || selectedLevel,
          score: evaluated.totalScore,
          manual_score: null,
          spontaneity_score: evaluated.spontaneityScore,
          pitch_variance: evaluated.rubrics.intonation.score,
          is_script_suspected: evaluated.isScriptSuspected,
          audio_url: audioUrl,
          transcript: actualTranscript || '(Không ghi nhận được âm thanh)',
          feedback: `[Phát âm: ${evaluated.rubrics.pronunciation.score} | Ngữ điệu: ${evaluated.rubrics.intonation.score} | Lưu loát: ${evaluated.rubrics.fluency.score}]`
        }]);
      }
    } catch (err) {
      console.warn("Submission sync error:", err);
    }

    setIsEvaluating(false);
    setFeedbackResult(evaluated);
    setIsTeacherExamining(false);
    setDetailedModalVisible(true);
  };

  const currentTierInfo = TIERS.find(t => t.key === selectedTier);

  // 🧩 COMPONENT HIỂN THỊ CHUỖI TIẾP SỨC 2 LƯỢT (CHO TẦNG RELAY)
  const renderRelayTurnsCard = (item: ChallengeItem) => {
    if (item.tier !== 'RELAY' || (!item.turn1TaskVi && !item.turn2TaskVi)) return null;

    return (
      <View style={styles.relayContainer}>
        {/* LƯỢT 1: BẠN SỐ 1 */}
        <View style={styles.relayTurnBox1}>
          <View style={styles.relayTurnHeader}>
            <Text style={styles.relayTurn1Title}>{item.turn1RoleVi || '🏃 Bạn số 1 (Khởi động)'}</Text>
            {practiceMode === 'READ_SAMPLE' && item.turn1SampleEn && (
              <TouchableOpacity
                style={styles.ttsMiniBtn}
                onPress={() => playNaturalTTS(item.turn1SampleEn!)}
              >
                <Text style={styles.ttsMiniBtnText}>🔊 Nghe Lượt 1</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.relayTaskText}>📌 {item.turn1TaskVi}</Text>
          {practiceMode === 'READ_SAMPLE' && item.turn1SampleEn && (
            <Text style={styles.relaySampleText}>"{item.turn1SampleEn}"</Text>
          )}
        </View>

        <Text style={styles.relayArrowText}>⬇️ CHUYỀN LƯỢT TIẾP SỨC ⬇️</Text>

        {/* LƯỢT 2: BẠN SỐ 2 */}
        <View style={styles.relayTurnBox2}>
          <View style={styles.relayTurnHeader}>
            <Text style={styles.relayTurn2Title}>{item.turn2RoleVi || '🏃‍♂️ Bạn số 2 (Tiếp sức)'}</Text>
            {practiceMode === 'READ_SAMPLE' && item.turn2SampleEn && (
              <TouchableOpacity
                style={styles.ttsMiniBtn}
                onPress={() => playNaturalTTS(item.turn2SampleEn!)}
              >
                <Text style={styles.ttsMiniBtnText}>🔊 Nghe Lượt 2</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.relayTaskText}>📌 {item.turn2TaskVi}</Text>
          {practiceMode === 'READ_SAMPLE' && item.turn2SampleEn && (
            <Text style={styles.relaySampleText}>"{item.turn2SampleEn}"</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>🔙 BẢN ĐỒ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: ĐẤU TRƯỜNG PHẢN XẠ TÌNH HUỐNG</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 35 }}>
        {/* 🎓 THANH ĐỊNH DANH SINH VIÊN & MÃ LỚP */}
        <View style={styles.profileBanner}>
          <View style={styles.profileSummaryRow}>
            <Text style={styles.profileSummaryText}>
              👤 {studentNameInput || 'Chưa nhập tên'} {studentCodeInput ? `(${studentCodeInput})` : ''} | 🏫 Lớp: <Text style={{ color: '#00FFFF' }}>{classCodeInput || 'TỰ DO'}</Text>
            </Text>
            <TouchableOpacity 
              style={styles.editProfileBtn} 
              onPress={() => setShowProfileBar(prev => !prev)}
            >
              <Text style={styles.editProfileBtnText}>{showProfileBar ? '▲ Đóng' : '✏️ Nhập Mã Lớp / Tên'}</Text>
            </TouchableOpacity>
          </View>

          {showProfileBar && (
            <View style={styles.profileFormBox}>
              <View style={styles.profileInputRow}>
                <TextInput
                  style={[styles.profileInput, { flex: 1.4 }]}
                  placeholder="Họ và tên sinh viên (*)"
                  placeholderTextColor="#666688"
                  value={studentNameInput}
                  onChangeText={setStudentNameInput}
                />
                <TextInput
                  style={[styles.profileInput, { flex: 1 }]}
                  placeholder="Mã SV (*)"
                  placeholderTextColor="#666688"
                  value={studentCodeInput}
                  onChangeText={setStudentCodeInput}
                />
              </View>
              <View style={styles.profileInputRow}>
                <TextInput
                  style={[styles.profileInput, { flex: 1.4 }]}
                  placeholder="Mã lớp (VD: ENG101_K18)"
                  placeholderTextColor="#666688"
                  autoCapitalize="characters"
                  value={classCodeInput}
                  onChangeText={(val) => setClassCodeInput(val.toUpperCase())}
                />
                <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveStudentSession}>
                  <Text style={styles.saveProfileBtnText}>💾 LƯU THÔNG TIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {!isTeacherExamining && !isNormalPracticing && (
          <>
            {/* 1. NGUỒN ĐỀ BÀI */}
            <Text style={styles.sectionHeaderLabel}>1. CHỌN NGUỒN TÌNH HUỐNG:</Text>
            <View style={styles.originTabsRow}>
              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'SYSTEM' && styles.originTabActiveSystem]}
                onPress={() => setTopicOrigin('SYSTEM')}
              >
                <Text style={styles.originTabIcon}>🤖</Text>
                <Text style={[styles.originTabText, topicOrigin === 'SYSTEM' && styles.originTabTextActive]}>
                  HỆ THỐNG MẪU (180)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'TEACHER_DASHBOARD' && styles.originTabActiveTeacher]}
                onPress={() => {
                  setTopicOrigin('TEACHER_DASHBOARD');
                  fetchTeacherAssignments(classCodeInput);
                }}
              >
                <Text style={styles.originTabIcon}>🏫</Text>
                <Text style={[styles.originTabText, topicOrigin === 'TEACHER_DASHBOARD' && styles.originTabTextActive]}>
                  GIẢNG VIÊN GIAO {teacherAssignments.length > 0 ? `(${teacherAssignments.length})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'STUDENT_CUSTOM' && styles.originTabActiveCustom]}
                onPress={() => setTopicOrigin('STUDENT_CUSTOM')}
              >
                <Text style={styles.originTabIcon}>📋</Text>
                <Text style={[styles.originTabText, topicOrigin === 'STUDENT_CUSTOM' && styles.originTabTextActive]}>
                  TỰ NHẬP ĐỀ
                </Text>
              </TouchableOpacity>
            </View>

            {topicOrigin === 'TEACHER_DASHBOARD' && (
              <View style={styles.teacherFilterNotice}>
                {loadingAssignments ? (
                  <Text style={styles.teacherFilterText}>⏳ Đang tải danh sách bài tập của lớp {classCodeInput || 'PUBLIC'}...</Text>
                ) : teacherAssignments.length === 0 ? (
                  <Text style={styles.teacherFilterText}>
                    ⚠️ Chưa tìm thấy bài tập Trạm 2 nào cho mã lớp "{classCodeInput || 'PUBLIC'}". Hãy nhập đúng Mã lớp ở thanh phía trên hoặc luyện tập với Hệ thống mẫu!
                  </Text>
                ) : (
                  <Text style={[styles.teacherFilterText, { color: '#39FF14' }]}>
                    ✅ Đã tải {teacherAssignments.length} bài tập được giao cho lớp {classCodeInput || 'PUBLIC'}.
                  </Text>
                )}
              </View>
            )}

            {/* 2. CHẾ ĐỘ PHẢN XẠ */}
            <Text style={styles.sectionHeaderLabel}>2. CHỌN CHẾ ĐỘ PHẢN XẠ:</Text>
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                style={[styles.modeTabBtn, practiceMode === 'READ_SAMPLE' && styles.modeTabBtnActiveSample]}
                onPress={() => setPracticeMode('READ_SAMPLE')}
              >
                <Text style={[styles.modeTabBtnText, practiceMode === 'READ_SAMPLE' && styles.modeTabBtnTextActive]}>
                  📖 1. ĐỌC THEO MẪU MỤC TIÊU
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, practiceMode === 'FREE_SPEECH' && styles.modeTabBtnActiveFree]}
                onPress={() => setPracticeMode('FREE_SPEECH')}
              >
                <Text style={[styles.modeTabBtnText, practiceMode === 'FREE_SPEECH' && styles.modeTabBtnTextActive]}>
                  ⚡ 2. PHẢN XẠ TỰ DO
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. ĐỊNH DẠNG ĐỐI ĐẦU */}
            <Text style={styles.sectionHeaderLabel}>3. ĐỊNH DẠNG ĐỐI ĐẦU:</Text>
            <View style={styles.tierSelector}>
              {TIERS.map(t => {
                const isActive = selectedTier === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tierTab, isActive && styles.tierTabActive]}
                    onPress={() => setSelectedTier(t.key)}
                  >
                    <Text style={styles.tierTabIcon}>{t.icon}</Text>
                    <Text style={[styles.tierTabText, isActive && styles.tierTabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.tierInfoBox}>
              <Text style={styles.tierInfoText}>🎯 {currentTierInfo?.desc}</Text>
            </View>

            {/* 4. KHUNG NĂNG LỰC CEFR */}
            <Text style={styles.sectionHeaderLabel}>4. TRÌNH ĐỘ CEFR:</Text>
            <View style={styles.levelTabs}>
              {CEFR_LEVELS.map((lvl) => {
                const isActive = selectedLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.levelTab, isActive && styles.levelTabActive]}
                    onPress={() => setSelectedLevel(lvl)}
                  >
                    <Text style={[styles.levelTabText, isActive && styles.levelTabTextActive]}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 🎧 XEM LẠI BẢN THU ÂM */}
            {recordedAudioUrl && !isRecordingNormal && (
              <View style={styles.audioReviewBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.audioReviewTitle}>🎧 BẢN THU ÂM TRƯỚC ĐÓ CỦA BẠN:</Text>
                  {feedbackResult && (
                    <TouchableOpacity 
                      style={styles.viewScoreBtn}
                      onPress={() => setDetailedModalVisible(true)}
                    >
                      <Text style={styles.viewScoreBtnText}>📊 XEM PHIẾU ĐIỂM CHI TIẾT</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {React.createElement('audio', {
                  controls: true,
                  src: recordedAudioUrl,
                  style: { width: '100%', height: '38px', marginTop: '8px' }
                })}
              </View>
            )}

            {/* 5. GIAO DIỆN TẠO ĐỀ / HIỂN THỊ ĐỀ BÀI */}
            {topicOrigin === 'STUDENT_CUSTOM' ? (
              <View style={styles.customBoxWrapper}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.customBoxTitle}>📋 TẠO / DÁN ĐỀ BÀI RIÊNG CỦA BẠN:</Text>
                  <TouchableOpacity onPress={() => setTopicOrigin('SYSTEM')}>
                    <Text style={{ color: '#00FFFF', fontSize: 10.5, fontWeight: 'bold' }}>✕ HỦY / QUAY LẠI ĐỀ MẪU</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.fieldLabel}>Tên chủ đề / Tình huống (*):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Phỏng vấn xin việc, Đàm phán giá cả..."
                  placeholderTextColor="#666688"
                  value={customTitle}
                  onChangeText={setCustomTitle}
                />

                <Text style={styles.fieldLabel}>Bối cảnh tình huống:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Bạn là ứng viên giải thích kinh nghiệm quản lý..."
                  placeholderTextColor="#666688"
                  value={customContext}
                  onChangeText={setCustomContext}
                />

                <Text style={styles.fieldLabel}>
                  {practiceMode === 'READ_SAMPLE' ? 'Câu phản xạ mẫu tiếng Anh (*):' : 'Câu hỏi / Thử thách phản xạ tiếng Anh (*):'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Dán câu tiếng Anh mục tiêu vào đây..."
                  placeholderTextColor="#666688"
                  multiline
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                />

                <TouchableOpacity style={styles.startCustomBtn} onPress={handleStartCustomTopic}>
                  <Text style={styles.startCustomBtnText}>🚀 BẮT ĐẦU PHẢN XẠ VỚI ĐỀ NÀY NGAY</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.topicContainer}>
                {/* 🎯 HÀNG NÚT THAO TÁC KÉP */}
                <View style={styles.actionButtonRow}>
                  <TouchableOpacity 
                    style={styles.prominentSwitchBtn} 
                    activeOpacity={0.7}
                    onPress={handleNextTopic}
                  >
                    <Text style={styles.prominentSwitchBtnText}>
                      🎲 TÌNH HUỐNG TIẾP THEO (0MS)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.prominentCreateBtn} 
                    activeOpacity={0.7}
                    onPress={() => setTopicOrigin('STUDENT_CUSTOM')}
                  >
                    <Text style={styles.prominentCreateBtnText}>
                      ➕ TỰ NHẬP / DÁN ĐỀ RIÊNG
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* THẺ BÀI TẬP CHÍNH */}
                <View style={[styles.card, currentChallenge.isTeacherAssigned && styles.teacherCard]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.roleText, currentChallenge.isTeacherAssigned && { color: '#00FFFF' }]}>
                      {currentChallenge.title}
                    </Text>
                    <Text style={styles.levelBadge}>
                      {currentChallenge.level}
                    </Text>
                  </View>
                  
                  <Text style={styles.contextText}>📌 {currentChallenge.contextDesc}</Text>

                  {/* HỘP GỢI Ý THUẦN TIẾNG VIỆT */}
                  <View style={styles.hintContainer}>
                    <View style={styles.hintHeaderRow}>
                      <TouchableOpacity 
                        style={[styles.hintToggleBtn, showHint && styles.hintToggleBtnActive]} 
                        onPress={() => setShowHint(prev => !prev)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.hintToggleText, showHint ? { color: '#000000' } : { color: '#FFD700' }]}>
                          {showHint ? '✕ ẨN THÔNG TIN VAI DIỄN' : '💡 XEM THÔNG TIN VAI DIỄN'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {showHint && currentChallenge && (
                      <View style={styles.hintContentBox}>
                        <View style={styles.scaffoldingMetaRow}>
                          <Text style={styles.scaffoldingMetaText}>🎭 <Text style={{ color: '#00FFFF' }}>{currentChallenge.place}</Text></Text>
                          <Text style={styles.scaffoldingMetaText}>🎯 <Text style={{ color: '#FFD700' }}>{currentChallenge.task}</Text></Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* HIỂN THỊ CHUỖI 2 LƯỢT NẾU LÀ TẦNG RELAY */}
                  {currentChallenge.tier === 'RELAY' && currentChallenge.turn1TaskVi ? (
                    <>
                      {renderRelayTurnsCard(currentChallenge)}
                      {practiceMode === 'READ_SAMPLE' && (
                        <TouchableOpacity 
                          style={[styles.ttsMiniBtn, { alignSelf: 'center', marginBottom: 12, paddingVertical: 6, paddingHorizontal: 14 }, isPlayingSample && styles.ttsMiniBtnActive]} 
                          onPress={() => playNaturalTTS(currentChallenge.prompt)}
                        >
                          <Text style={styles.ttsMiniBtnText}>
                            {isPlayingSample ? '⏹ DỪNG ÂM MẪU' : '🔊 NGHE TRỌN VẸN CẢ 2 LƯỢT TIẾP SỨC'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : practiceMode === 'READ_SAMPLE' ? (
                    <View style={styles.previewPromptBox}>
                      <View style={styles.sampleHeaderRow}>
                        <Text style={styles.previewPromptLabel}>📖 Câu mẫu bản xứ mục tiêu:</Text>
                        <TouchableOpacity 
                          style={[styles.ttsMiniBtn, isPlayingSample && styles.ttsMiniBtnActive]} 
                          activeOpacity={0.7}
                          onPress={() => playNaturalTTS(currentChallenge.prompt)}
                        >
                          <Text style={styles.ttsMiniBtnText}>
                            {isPlayingSample ? '⏹ DỪNG' : '🔊 NGHE ÂM MẪU'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.previewPromptText}>"{currentChallenge.prompt}"</Text>
                    </View>
                  ) : (
                    <View style={styles.freeSpeechHintBox}>
                      <Text style={styles.freeSpeechHintLabel}>⚡ YÊU CẦU PHẢN XẠ TỰ DO:</Text>
                      <Text style={styles.freeSpeechHintText}>
                        Đọc kỹ bối cảnh phía trên và tự phát biểu câu phản xạ tiếng Anh tự nhiên của bạn!
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.startBtn, currentChallenge.isTeacherAssigned && { backgroundColor: '#00FFFF' }]}
                    onPress={() => handleEnterRoom(currentChallenge)}
                  >
                    <Text style={[styles.startBtnText, currentChallenge.isTeacherAssigned && { color: '#000' }]}>
                      🎙️ VÀO PHÒNG GHI ÂM PHẢN XẠ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* PHÒNG THU LUYỆN TẬP */}
        {isNormalPracticing && currentChallenge && (
          <View style={styles.normalPracticeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.normalPracticeHeader}>
                {practiceMode === 'READ_SAMPLE' ? '🎙️ PHÒNG THU: ĐỌC THEO MẪU BẢN XỨ' : '⚡ PHÒNG THU: PHẢN XẠ TỰ NHIÊN'}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {topicOrigin !== 'STUDENT_CUSTOM' && (
                  <TouchableOpacity 
                    style={styles.switchTopicInRoomBtn} 
                    activeOpacity={0.7} 
                    onPress={handleNextTopic}
                  >
                    <Text style={styles.switchTopicInRoomText}>🔄 ĐỔI TÌNH HUỐNG</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsNormalPracticing(false)}>
                  <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ THOÁT</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.normalPromptTitle}>{currentChallenge.title} ({currentChallenge.level})</Text>
            <Text style={styles.normalPromptDesc}>{currentChallenge.contextDesc}</Text>

            {currentChallenge.tier === 'RELAY' && currentChallenge.turn1TaskVi ? (
              renderRelayTurnsCard(currentChallenge)
            ) : practiceMode === 'READ_SAMPLE' ? (
              <View style={styles.promptDisplayBox}>
                <View style={styles.sampleHeaderRow}>
                  <Text style={styles.promptModeNotice}>📖 CÂU TIẾNG ANH MỤC TIÊU CẦN ĐỌC:</Text>
                  <TouchableOpacity 
                    style={[styles.ttsPlayBtn, isPlayingSample && styles.ttsPlayBtnActive]} 
                    activeOpacity={0.7}
                    onPress={() => playNaturalTTS(currentChallenge.prompt)}
                  >
                    <Text style={styles.ttsPlayBtnText}>
                      {isPlayingSample ? '⏹ DỪNG ÂM THANH' : '🔊 PHÁT ÂM MẪU NEURAL'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.promptDisplayText}>{currentChallenge.prompt}</Text>
              </View>
            ) : (
              <View style={[styles.promptDisplayBox, { borderColor: '#39FF14', backgroundColor: '#07180D' }]}>
                <Text style={[styles.promptModeNotice, { color: '#39FF14' }]}>
                  ⚡ CHẾ ĐỘ PHẢN XẠ TỰ DO ĐANG BẬT:
                </Text>
                <Text style={[styles.promptDisplayText, { fontSize: 13, color: '#88FFBB', fontWeight: 'bold' }]}>
                  Nhấn nút ghi âm và tự phát biểu câu trả lời tự nhiên của bạn theo bối cảnh bên trên!
                </Text>
              </View>
            )}

            <View style={styles.liveWaveformBox}>
              <Text style={styles.liveWaveformLabel}>
                {isRecordingNormal ? `🔴 ĐANG THU ÂM SÓNG ÂM TRỰC TIẾP: ${normalTimer}S` : '⚪ SẴN SÀNG THU ÂM'}
              </Text>
              <canvas
                ref={canvasRef}
                width={520}
                height={80}
                style={{ width: '100%', height: 80, backgroundColor: '#070212', borderRadius: 8, display: 'block' }}
              />
            </View>

            {(isRecordingNormal || liveTranscript) && (
              <View style={styles.liveSubtitleBox}>
                <Text style={styles.liveSubtitleLabel}>
                  {isRecordingNormal ? '🎙️ Đang nhận diện giọng bạn theo thời gian thực:' : '📝 Bản ghi âm nhận diện được:'}
                </Text>
                <Text style={styles.liveSubtitleText}>
                  {liveTranscript || '... (hãy nói tiếng Anh to, rõ ràng)'}
                </Text>
              </View>
            )}

            {recordedAudioUrl && !isRecordingNormal && (
              <View style={styles.audioReviewBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.audioReviewTitle}>🎧 NGHE LẠI BẢN THU VỪA RỒI:</Text>
                  {feedbackResult && (
                    <TouchableOpacity 
                      style={styles.viewScoreBtn}
                      onPress={() => setDetailedModalVisible(true)}
                    >
                      <Text style={styles.viewScoreBtnText}>📊 XEM PHIẾU ĐIỂM CHI TIẾT</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {React.createElement('audio', {
                  controls: true,
                  src: recordedAudioUrl,
                  style: { width: '100%', height: '36px', marginTop: '6px' }
                })}
              </View>
            )}

            {isEvaluating ? (
              <View style={styles.evaluatingBox}>
                <ActivityIndicator size="small" color="#00FFFF" />
                <Text style={styles.evaluatingText}>{evaluatingStatus}</Text>
              </View>
            ) : !isRecordingNormal ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.startRecordBtn, recordedAudioUrl ? { flex: 1 } : { width: '100%' }]} 
                  activeOpacity={0.8} 
                  onPress={startNormalRecording}
                >
                  <Text style={styles.startRecordBtnText}>
                    {recordedAudioUrl ? '🔄 THU ÂM LẠI' : '🔴 BẮT ĐẦU THU ÂM'}
                  </Text>
                </TouchableOpacity>

                {recordedAudioUrl && feedbackResult && (
                  <TouchableOpacity 
                    style={styles.reopenModalBtn} 
                    activeOpacity={0.8} 
                    onPress={() => setDetailedModalVisible(true)}
                  >
                    <Text style={styles.reopenModalBtnText}>📊 XEM PHIẾU ĐIỂM</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.stopRecordBtn} activeOpacity={0.8} onPress={stopNormalRecording}>
                <Text style={styles.stopRecordBtnText}>⏹ DỪNG VÀ CHẤM ĐIỂM BÀI NÓI</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PHÒNG THI CHỐNG ĐỌC */}
        {isTeacherExamining && currentChallenge && typeof AntiCheatSpeakingSession === 'function' && (
          <AntiCheatSpeakingSession
            promptText={practiceMode === 'READ_SAMPLE' ? currentChallenge.prompt : ''}
            situationPrompt={currentChallenge.contextDesc}
            prepTimeSeconds={5}
            autoHidePrompt={true}
            onRecordingComplete={(blob: any, pitches: any) => finishSubmissionAndEvaluate(blob, pitches)}
            onCancel={() => setIsTeacherExamining(false)}
          />
        )}
      </ScrollView>

      {/* 📊 BẢNG PHÂN TÍCH ĐIỂM CHI TIẾT */}
      {typeof DetailedSpeechFeedbackModal === 'function' && (
        <DetailedSpeechFeedbackModal
          visible={detailedModalVisible}
          data={feedbackResult}
          lang="vi"
          onClose={() => setDetailedModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 11.5, fontWeight: '900', flexShrink: 1 },

  profileBanner: { backgroundColor: '#0D0620', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 10 },
  profileSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileSummaryText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', flex: 1 },
  editProfileBtn: { backgroundColor: '#1A0B2E', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#FFD700' },
  editProfileBtnText: { color: '#FFD700', fontSize: 9, fontWeight: 'bold' },
  profileFormBox: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#221144', paddingTop: 8, gap: 6 },
  profileInputRow: { flexDirection: 'row', gap: 6 },
  profileInput: { backgroundColor: '#070212', borderWidth: 1, borderColor: '#332255', borderRadius: 6, padding: 6, color: '#FFF', fontSize: 10.5 },
  saveProfileBtn: { flex: 1, backgroundColor: '#39FF14', borderRadius: 6, justifyContent: 'center', alignItems: 'center', paddingVertical: 6 },
  saveProfileBtnText: { color: '#000', fontSize: 9.5, fontWeight: '900' },

  teacherFilterNotice: { backgroundColor: '#0B192C', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', marginBottom: 8 },
  teacherFilterText: { color: '#FFD700', fontSize: 9.5, lineHeight: 14 },

  sectionHeaderLabel: { color: '#FFD700', fontSize: 9.5, fontWeight: '900', marginTop: 8, marginBottom: 6 },

  originTabsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  originTab: { flex: 1, paddingVertical: 10, backgroundColor: '#0D0620', borderRadius: 10, borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  originTabActiveTeacher: { backgroundColor: '#0B192C', borderColor: '#00FFFF' },
  originTabActiveCustom: { backgroundColor: '#1E0B36', borderColor: '#FF007F' },
  originTabActiveSystem: { backgroundColor: '#092B1E', borderColor: '#39FF14' },
  originTabIcon: { fontSize: 14, marginBottom: 2 },
  originTabText: { color: '#8888AA', fontSize: 8.5, fontWeight: 'bold', textAlign: 'center' },
  originTabTextActive: { color: '#FFF', fontWeight: '900' },

  modeTabsRow: { flexDirection: 'row', gap: 8 },
  modeTabBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#130628', borderRadius: 8, borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  modeTabBtnActiveSample: { backgroundColor: '#1E0B36', borderColor: '#00FFFF' },
  modeTabBtnActiveFree: { backgroundColor: '#092B1E', borderColor: '#39FF14' },
  modeTabBtnText: { color: '#8888AA', fontSize: 9.5, fontWeight: 'bold' },
  modeTabBtnTextActive: { color: '#FFF', fontWeight: '900' },

  tierSelector: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tierTab: { flex: 1, paddingVertical: 9, paddingHorizontal: 4, backgroundColor: '#0D0620', borderRadius: 10, borderWidth: 1.5, borderColor: '#332255', alignItems: 'center', justifyContent: 'center' },
  tierTabActive: { backgroundColor: '#1E0B36', borderColor: '#39FF14' },
  tierTabIcon: { fontSize: 13, marginBottom: 4 },
  tierTabText: { color: '#8888AA', fontSize: 8.5, fontWeight: 'bold', textAlign: 'center' },
  tierTabTextActive: { color: '#39FF14', fontWeight: '900' },
  tierInfoBox: { backgroundColor: '#0F0624', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#221144', marginBottom: 8 },
  tierInfoText: { color: '#FFD700', fontSize: 9, lineHeight: 14, fontStyle: 'italic' },

  levelTabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  levelTab: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: '#0D0620', borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  levelTabActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  levelTabText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  levelTabTextActive: { color: '#FFF', fontWeight: '900' },

  topicContainer: { width: '100%', marginTop: 4 },

  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    width: '100%'
  },
  prominentSwitchBtn: {
    flex: 1.2,
    backgroundColor: '#1E0B36',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00FFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  prominentSwitchBtnText: {
    color: '#00FFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  prominentCreateBtn: {
    flex: 1,
    backgroundColor: '#0D2619',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#39FF14',
    alignItems: 'center',
    justifyContent: 'center'
  },
  prominentCreateBtnText: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  card: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roleText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8.5, fontWeight: '900' },
  contextText: { color: '#FFF', fontSize: 11, lineHeight: 16, marginBottom: 8 },

  // STYLES CHO CHUỖI RELAY 2 LƯỢT
  relayContainer: {
    marginVertical: 8,
    gap: 6,
  },
  relayTurnBox1: {
    backgroundColor: '#081826',
    borderLeftWidth: 3,
    borderLeftColor: '#00FFFF',
    padding: 10,
    borderRadius: 8,
  },
  relayTurnBox2: {
    backgroundColor: '#092216',
    borderLeftWidth: 3,
    borderLeftColor: '#39FF14',
    padding: 10,
    borderRadius: 8,
  },
  relayTurnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  relayTurn1Title: {
    color: '#00FFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  relayTurn2Title: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '900',
  },
  relayTaskText: {
    color: '#E0E0F5',
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 4,
  },
  relaySampleText: {
    color: '#FFF',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  relayArrowText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },

  hintContainer: {
    marginVertical: 6,
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
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  hintToggleBtnActive: {
    backgroundColor: '#FFD700',
  },
  hintToggleText: {
    fontSize: 9,
    fontWeight: '900',
  },
  hintContentBox: {
    backgroundColor: '#07180D',
    borderLeftWidth: 3,
    borderLeftColor: '#39FF14',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  scaffoldingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  scaffoldingMetaText: {
    color: '#DDD',
    fontSize: 9.5,
    fontWeight: 'bold',
  },

  previewPromptBox: { backgroundColor: '#070212', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#221144' },
  sampleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  previewPromptLabel: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },
  previewPromptText: { color: '#FFFFFF', fontSize: 11.5, fontStyle: 'italic' },
  freeSpeechHintBox: { backgroundColor: '#07180D', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#39FF14' },
  freeSpeechHintLabel: { color: '#39FF14', fontSize: 8.5, fontWeight: 'bold', marginBottom: 2 },
  freeSpeechHintText: { color: '#88FFBB', fontSize: 10, fontStyle: 'italic' },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 10.5, fontWeight: '900' },

  ttsPlayBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E0B36', borderWidth: 1.5, borderColor: '#00FFFF', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  ttsPlayBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  ttsPlayBtnText: { color: '#00FFFF', fontSize: 9.5, fontWeight: '900' },
  ttsMiniBtn: { backgroundColor: '#1E0B36', borderWidth: 1, borderColor: '#00FFFF', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 5 },
  ttsMiniBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  ttsMiniBtnText: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },

  customBoxWrapper: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#FF007F', marginVertical: 8 },
  customBoxTitle: { color: '#FF007F', fontSize: 11, fontWeight: '900' },
  fieldLabel: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold', marginTop: 8, marginBottom: 3 },
  textInput: { backgroundColor: '#070212', borderWidth: 1, borderColor: '#332255', borderRadius: 6, padding: 8, color: '#FFF', fontSize: 11 },
  textArea: { minHeight: 65, textAlignVertical: 'top' },
  startCustomBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  startCustomBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },

  audioReviewBox: { backgroundColor: '#130628', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#39FF14', marginVertical: 10 },
  audioReviewTitle: { color: '#39FF14', fontSize: 10, fontWeight: '900' },
  viewScoreBtn: { backgroundColor: '#0A2518', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14' },
  viewScoreBtnText: { color: '#39FF14', fontSize: 9, fontWeight: 'bold' },

  normalPracticeCard: { backgroundColor: '#0A0318', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#00FFFF', marginVertical: 10 },
  normalPracticeHeader: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  switchTopicInRoomBtn: { backgroundColor: '#1E0B36', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  switchTopicInRoomText: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },

  normalPromptTitle: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginTop: 8 },
  normalPromptDesc: { color: '#8888AA', fontSize: 10.5, marginBottom: 8 },
  promptDisplayBox: { backgroundColor: '#130628', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptModeNotice: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },
  promptDisplayText: { color: '#FFFFFF', fontSize: 13, lineHeight: 20, fontWeight: 'bold' },
  liveWaveformBox: { marginBottom: 10 },
  liveWaveformLabel: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', marginBottom: 6 },

  liveSubtitleBox: { backgroundColor: '#0D0A24', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#5533AA', marginBottom: 12 },
  liveSubtitleLabel: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  liveSubtitleText: { color: '#00FFFF', fontSize: 12, fontStyle: 'italic', lineHeight: 18 },

  evaluatingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, backgroundColor: '#0D0620', borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginVertical: 6 },
  evaluatingText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },

  startRecordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  startRecordBtnText: { color: '#FFF', fontSize: 11.5, fontWeight: '900' },
  reopenModalBtn: { flex: 1, backgroundColor: '#0D0620', borderWidth: 1.5, borderColor: '#00FFFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  reopenModalBtnText: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  stopRecordBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  stopRecordBtnText: { color: '#000', fontSize: 11.5, fontWeight: '900' }
});