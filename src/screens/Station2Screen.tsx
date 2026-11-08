// src/screens/Station2Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import AntiCheatSpeakingSession from '../components/AntiCheatSpeakingSession';
import DetailedSpeechFeedbackModal, { DetailedFeedbackData } from '../components/DetailedSpeechFeedbackModal';
import { evaluateSpeechSubmission } from '../utils/speechEvaluator';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type Station2Tier = 'SOLO' | 'RELAY' | 'ROLEPLAY';
type PracticeMode = 'READ_SAMPLE' | 'FREE_SPEECH';
type TopicOrigin = 'SYSTEM' | 'TEACHER_DASHBOARD' | 'STUDENT_CUSTOM';

interface ChallengeItem {
  id: string;
  tier: Station2Tier;
  level: CefrLevel;
  title: string;
  contextDesc: string;
  prompt: string;
  isTeacherAssigned?: boolean;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const TIERS: { key: Station2Tier; label: string; icon: string; desc: string }[] = [
  { key: 'SOLO', label: 'TẦNG 1: SOLO (CÁ NHÂN PHẢN XẠ)', icon: '🥊', desc: 'Độc lập phản xạ: Tự xử lý tình huống bất ngờ hoặc câu hỏi thách thức' },
  { key: 'RELAY', label: 'TẦNG 2: RELAY (TIẾP SỨC ĐỒNG ĐỘI)', icon: '🏃', desc: 'Tiếp sức 2 người: Nối tiếp ý tưởng, bổ sung luận điểm cùng chủ đề' },
  { key: 'ROLEPLAY', label: 'TẦNG 3: ROLEPLAY (NHẬP VAI 2 BẠN)', icon: '🎭', desc: 'Nhập vai 2 người: Phân vai giải quyết xung đột, đàm phán tình huống xã hội' }
];

// Ngân hàng đề phản xạ phong phú
const DEFAULT_CHALLENGES: ChallengeItem[] = [
  // ==================== TẦNG 1: SOLO ====================
  { id: 's_a1_1', tier: 'SOLO', level: 'A1', title: 'Hỏi thăm địa điểm du lịch', contextDesc: 'Một du khách hỏi quán cà phê ngon nhất gần đây.', prompt: 'There is a great cafe around the corner. You should try the iced milk coffee.' },
  { id: 's_a1_2', tier: 'SOLO', level: 'A1', title: 'Giải thích khi đi học muộn', contextDesc: 'Bạn trễ học 10 phút vì kẹt xe, hãy xin phép thầy cô vào lớp.', prompt: 'Good morning teacher, I apologize for being late because of heavy traffic.' },
  { id: 's_a1_3', tier: 'SOLO', level: 'A1', title: 'Giới thiệu món ăn Việt Nam', contextDesc: 'Người bạn nước ngoài hỏi nên ăn món gì đầu tiên ở Việt Nam.', prompt: 'You must try traditional Beef Pho with fresh herbs; it is absolutely delicious.' },

  { id: 's_a2_1', tier: 'SOLO', level: 'A2', title: 'Từ chối làm thêm giờ lịch sự', contextDesc: 'Quản lý nhờ ở lại 2 tiếng nhưng bạn bận lịch học buổi tối.', prompt: 'I would love to help, but I have an important evening class tonight that I cannot miss.' },
  { id: 's_a2_2', tier: 'SOLO', level: 'A2', title: 'Yêu cầu đổi món ăn bị nguội', contextDesc: 'Đĩa súp mang ra bị nguội ngắt, hãy nhờ phục vụ hỗ trợ.', prompt: 'Excuse me, my soup is quite cold. Could you please heat it up for me?' },
  { id: 's_a2_3', tier: 'SOLO', level: 'A2', title: 'Hỏi thông tin khóa học', contextDesc: 'Hỏi tư vấn viên học phí và thời lượng lớp tiếng Anh giao tiếp.', prompt: 'Could you please give me more details about the schedule and tuition fee for this course?' },

  { id: 's_b1_1', tier: 'SOLO', level: 'B1', title: 'Phản hồi câu hỏi chất vấn dự án', contextDesc: 'Khán giả lo ngại giải pháp của nhóm quá tốn kém chi phí.', prompt: 'While the initial setup requires capital investment, the operational savings over six months will completely offset the costs.' },
  { id: 's_b1_2', tier: 'SOLO', level: 'B1', title: 'Thương lượng chia lại đầu việc nhóm', contextDesc: 'Bạn nhận thấy việc phân chia chưa công bằng giữa các thành viên.', prompt: 'I propose we redistribute the research workload so everyone contributes equally to the final report.' },
  { id: 's_b1_3', tier: 'SOLO', level: 'B1', title: 'Phỏng vấn: Điểm mạnh lớn nhất', contextDesc: 'Nhà tuyển dụng hỏi lý do họ nên chọn bạn cho vị trí này.', prompt: 'My strongest attribute is analytical problem-solving, which allows me to resolve complex operational bottlenecks swiftly.' },

  { id: 's_b2_1', tier: 'SOLO', level: 'B2', title: 'Thương thuyết dời hạn giao sản phẩm', contextDesc: 'Khách hàng muốn nhận trước 1 tuần, giải thích rủi ro kỹ thuật.', prompt: 'Accelerating our delivery by a full week will severely compromise our testing protocols, increasing the likelihood of critical bugs.' },
  { id: 's_b2_2', tier: 'SOLO', level: 'B2', title: 'Tranh biện về làm việc từ xa', contextDesc: 'Nêu quan điểm về việc làm việc tại nhà có giảm năng suất không.', prompt: 'Remote work enhances individual autonomy, yet sustainable productivity requires robust asynchronous communication tools.' },

  // ==================== TẦNG 2: RELAY ====================
  { id: 'r_a1_1', tier: 'RELAY', level: 'A1', title: 'Tiếp sức: Chuẩn bị tiệc liên hoan', contextDesc: 'Bạn A: "We should buy pizza and soft drinks." -> Bạn B tiếp sức nối ý đồ uống/trang trí.', prompt: 'Great idea! I can bring some fresh fruit and balloons to decorate the classroom.' },
  { id: 'r_a1_2', tier: 'RELAY', level: 'A1', title: 'Tiếp sức: Lên kế hoạch thể thao', contextDesc: 'Bạn A: "I usually go swimming on Sunday." -> Bạn B tiếp sức chia sẻ hoạt động.', prompt: 'I prefer playing badminton with my friends because it keeps us energetic all day.' },
  
  { id: 'r_a2_1', tier: 'RELAY', level: 'A2', title: 'Tiếp sức: Lịch trình tham quan thành phố', contextDesc: 'Bạn A: "In the morning, we can visit the central museum." -> Bạn B tiếp sức buổi tối.', prompt: 'And in the evening, we should explore the walking street and try local street food.' },
  { id: 'r_a2_2', tier: 'RELAY', level: 'A2', title: 'Tiếp sức: Phương pháp ghi nhớ từ vựng', contextDesc: 'Bạn A: "Flashcards help me learn ten words daily." -> Bạn B tiếp sức cách áp dụng.', prompt: 'In addition, writing short sentences with those new words helps me retain them much longer.' },

  { id: 'r_b1_1', tier: 'RELAY', level: 'B1', title: 'Tiếp sức: Chiến dịch truyền thông sự kiện', contextDesc: 'Bạn A: "Short TikTok videos will attract student attention." -> Bạn B tiếp sức bổ sung ý minigame.', prompt: 'Building on that concept, we could host a weekly live Q&A session with interactive mini-games to boost engagement.' },
  { id: 'r_b1_2', tier: 'RELAY', level: 'B1', title: 'Tiếp sức: Giảm thiểu rác thải nhựa học đường', contextDesc: 'Bạn A: "Canteens should eliminate disposable cups." -> Bạn B tiếp sức chính sách khuyến khích.', prompt: 'To encourage that transition, the campus should offer a ten percent discount for students bringing reusable bottles.' },

  // ==================== TẦNG 3: ROLEPLAY ====================
  { id: 'rp_a1_1', tier: 'ROLEPLAY', level: 'A1', title: 'Nhập vai: Gọi món tại quán ăn nhanh', contextDesc: 'Bạn là khách muốn gọi gà rán, nước suối và xin mật khẩu Wifi.', prompt: 'Hello, can I please have one fried chicken combo and the password for the Wi-Fi?' },
  { id: 'rp_a1_2', tier: 'ROLEPLAY', level: 'A1', title: 'Nhập vai: Mua vé rạp chiếu phim', contextDesc: 'Bạn là khách muốn mua 2 vé xem phim xuất chiếu tối và hỏi giảm giá sinh viên.', prompt: 'Hi, I would like two tickets for the eight PM screening. Do you offer student discounts?' },

  { id: 'rp_a2_1', tier: 'ROLEPLAY', level: 'A2', title: 'Nhập vai: Đổi kích cỡ áo quần', contextDesc: 'Áo mua hôm qua bị chật vai, mang hóa đơn đến xin đổi sang Size L.', prompt: 'Good morning, I bought this shirt yesterday but it feels tight. Can I exchange it for a large?' },
  { id: 'rp_a2_2', tier: 'ROLEPLAY', level: 'A2', title: 'Nhập vai: Gửi hành lý tại lễ tân', contextDesc: 'Bạn trả phòng lúc 12h nhưng muốn gửi lại 2 vali đến 17h chiều.', prompt: 'I am checking out now. Is it possible to store our two suitcases here until five PM today?' },

  { id: 'rp_b1_1', tier: 'ROLEPLAY', level: 'B1', title: 'Nhập vai: Đổi đồ uống gấp tại sân bay', contextDesc: 'Gọi trà đào đá nhưng nhận nhầm cà phê nóng, chuyến bay sắp cất cánh trong 10 phút.', prompt: 'Excuse me, I ordered an iced peach tea, but I received hot coffee. Could you replace it quickly as my flight boards soon?' },
  { id: 'rp_b1_2', tier: 'ROLEPLAY', level: 'B1', title: 'Nhập vai: Xin gia hạn nộp bài tập lớn', contextDesc: 'Máy chủ nhóm bị hỏng ổ cứng, bạn đại diện gặp giảng viên xin dời hạn 1 ngày.', prompt: 'Dear Professor, our team suffered an unexpected server crash last night. May we respectfully request a twenty-four hour extension?' }
];

export default function Station2Screen({ onBack }: Props) {
  const [selectedTier, setSelectedTier] = useState<Station2Tier>('ROLEPLAY');
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1');
  const [allChallenges, setAllChallenges] = useState<ChallengeItem[]>(DEFAULT_CHALLENGES);
  const [teacherAssignments, setTeacherAssignments] = useState<ChallengeItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);

  // 🎯 CHỦ ĐỀ ĐANG ĐƯỢC CHỌN HIỂN THỊ
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(null);

  // Trạng thái AI tạo đề
  const [isGeneratingAiTopic, setIsGeneratingAiTopic] = useState<boolean>(false);

  // Quản lý TTS
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const playSampleAudio = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      Alert.alert("Lỗi", "Trình duyệt không hỗ trợ Text-to-Speech");
      return;
    }
    const synth = window.speechSynthesis;
    if (isPlayingSample) {
      synth.cancel();
      setIsPlayingSample(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/["']/g, '').trim());
    
    const voices = synth.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;
    utterance.lang = 'en-US';
    utterance.rate = 0.90;
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsPlayingSample(true);
    utterance.onend = () => setIsPlayingSample(false);
    utterance.onerror = () => setIsPlayingSample(false);

    synth.speak(utterance);
  };

  const stopSampleAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingSample(false);
  };

  const [topicOrigin, setTopicOrigin] = useState<TopicOrigin>('SYSTEM');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('READ_SAMPLE');

  // Đề tự dán
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customContext, setCustomContext] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Thu âm & phòng thu
  const [isNormalPracticing, setIsNormalPracticing] = useState<boolean>(false);
  const [isRecordingNormal, setIsRecordingNormal] = useState<boolean>(false);
  const [normalTimer, setNormalTimer] = useState<number>(0);
  const normalMediaRecorderRef = useRef<any>(null);
  const normalAudioChunksRef = useRef<any[]>([]);
  const normalPitchHistoryRef = useRef<number[]>([]);
  const normalAnimFrameRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isTeacherExamining, setIsTeacherExamining] = useState<boolean>(false);
  const [detailedModalVisible, setDetailedModalVisible] = useState<boolean>(false);
  const [feedbackResult, setFeedbackResult] = useState<DetailedFeedbackData | null>(null);

  const fetchTeacherAssignments = async () => {
    setLoadingAssignments(true);
    try {
      if (supabase) {
        const { data: assignments, error } = await supabase
          .from('assignments')
          .select('*')
          .ilike('station_type', '%STATION_2%')
          .order('created_at', { ascending: false });

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
              title: item.title || 'Bài tập Giảng viên giao',
              contextDesc: item.description || `🏫 Tình huống phản xạ (${detectedTier}):`,
              prompt: item.target_prompt || '',
              isTeacherAssigned: true
            };
          });

          setTeacherAssignments(teacherItems);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải bài tập giảng viên:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchTeacherAssignments();
    return () => stopSampleAudio();
  }, []);

  // Lọc danh sách theo tầng và level
  const getFilteredPool = () => {
    if (topicOrigin === 'TEACHER_DASHBOARD') {
      return teacherAssignments.filter(item => item.tier === selectedTier && item.level === selectedLevel);
    }
    return allChallenges.filter(item => item.tier === selectedTier && item.level === selectedLevel);
  };

  const pool = getFilteredPool();

  // Reset index khi đổi Tầng hoặc Cấp độ
  useEffect(() => {
    setActiveTopicIndex(0);
  }, [selectedTier, selectedLevel, topicOrigin]);

  // Lấy ra đúng 1 chủ đề hiện tại để hiển thị
  const currentTopic: ChallengeItem | undefined = pool[activeTopicIndex % (pool.length || 1)];

  // 🤖 Hàm sinh đề mới bằng AI
  const generateNewAiChallenge = async (): Promise<ChallengeItem | null> => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      if (!apiKey) return null;

      const promptInstruction = `Create 1 realistic speaking situational reflex challenge for Station 2 at CEFR level ${selectedLevel} in tier ${selectedTier}.
- SOLO: Individual situational reflex.
- RELAY: Partner A speaks, Partner B extends.
- ROLEPLAY: Two people resolve a negotiation/conflict.
Respond ONLY with JSON format:
{
  "title": "Short title in Vietnamese",
  "contextDesc": "Context description in Vietnamese",
  "prompt": "Natural spoken English sentence or model response"
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
          temperature: 0.95,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await res.json();
      const content = JSON.parse(data.choices[0].message.content);

      return {
        id: `ai_${Date.now()}`,
        tier: selectedTier,
        level: selectedLevel,
        title: `🤖 [AI MỚI] ${content.title}`,
        contextDesc: content.contextDesc,
        prompt: content.prompt,
        isTeacherAssigned: false,
      };
    } catch (err) {
      return null;
    }
  };

  // 🎲 NÚT ĐỔI CHỦ ĐỀ MỚI: TĂNG INDEX HOẶC TẠO TỪ AI
  const handleNextTopic = async () => {
    stopSampleAudio();
    setIsGeneratingAiTopic(true);

    // Thử gọi AI tạo đề mới
    const newAiTopic = await generateNewAiChallenge();
    if (newAiTopic) {
      setAllChallenges(prev => [newAiTopic, ...prev]);
      setActiveTopicIndex(0); // Đưa về đề AI mới nhất
      if (isNormalPracticing) {
        setSelectedChallenge(newAiTopic);
      }
      setIsGeneratingAiTopic(false);
      return;
    }

    // Nếu không có API Key hoặc mất mạng -> Xoay vòng mượt mà sang đề tiếp theo trong danh sách
    if (pool.length > 1) {
      const nextIdx = (activeTopicIndex + 1) % pool.length;
      setActiveTopicIndex(nextIdx);
      if (isNormalPracticing) {
        setSelectedChallenge(pool[nextIdx]);
      }
    } else {
      Alert.alert("Thông báo", "Đang ở đề duy nhất của cấp độ này. Bạn có thể đổi sang Cấp độ khác hoặc dán đề mới!");
    }
    setIsGeneratingAiTopic(false);
  };

  const handleStartCustomTopic = () => {
    stopSampleAudio();
    if (!customTitle.trim() || !customPrompt.trim()) {
      Alert.alert("Chưa đủ thông tin", "Vui lòng nhập Tiêu đề và Câu hỏi/Nhiệm vụ tiếng Anh!");
      return;
    }

    const customItem: ChallengeItem = {
      id: `custom_${Date.now()}`,
      tier: selectedTier,
      level: selectedLevel,
      title: customTitle.trim(),
      contextDesc: customContext.trim() || `📋 Đề tự dán (${selectedTier} - ${selectedLevel}):`,
      prompt: customPrompt.trim(),
      isTeacherAssigned: false
    };

    setAllChallenges(prev => [customItem, ...prev]);
    setSelectedChallenge(customItem);
    setRecordedAudioUrl(null);
    setIsNormalPracticing(true);
    setIsTeacherExamining(false);
    setNormalTimer(0);
    setIsRecordingNormal(false);
  };

  const handleSelectChallenge = (item: ChallengeItem) => {
    stopSampleAudio();
    setSelectedChallenge(item);
    setRecordedAudioUrl(null);
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

  // Thu âm và Canvas trực quan
  const startNormalRecording = async () => {
    stopSampleAudio();
    try {
      normalAudioChunksRef.current = [];
      normalPitchHistoryRef.current = [];
      setNormalTimer(0);
      setRecordedAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new (window as any).MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      normalMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) normalAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecordingNormal(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
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
      Alert.alert("Lỗi Micro", "Không thể truy cập microphone. Vui lòng cấp quyền.");
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

  const stopNormalRecording = () => {
    if (normalAnimFrameRef.current) cancelAnimationFrame(normalAnimFrameRef.current);
    if (normalMediaRecorderRef.current && normalMediaRecorderRef.current.state !== 'inactive') {
      normalMediaRecorderRef.current.stop();
      normalMediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(normalAudioChunksRef.current, { type: 'audio/webm' });
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

  const finishSubmissionAndEvaluate = async (audioBlob: Blob, pitchHistory: number[], localAudioUrl?: string) => {
    if (localAudioUrl) {
      setRecordedAudioUrl(localAudioUrl);
    } else {
      setRecordedAudioUrl(URL.createObjectURL(audioBlob));
    }

    const evaluated = evaluateSpeechSubmission({
      transcript: selectedChallenge?.prompt || '',
      targetPrompt: selectedChallenge?.prompt || '',
      pitchHistory,
      durationSeconds: Math.max(normalTimer, 6),
      cefrLevel: selectedChallenge?.level || selectedLevel
    });

    let audioUrl = '';
    try {
      if (supabase) {
        const fileName = `station2_${selectedTier.toLowerCase()}_${selectedLevel.toLowerCase()}_${Date.now()}.webm`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('submissions')
          .upload(fileName, audioBlob, { contentType: 'audio/webm' });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
          audioUrl = urlData?.publicUrl || '';
        }

        const { data: authUser } = await supabase.auth.getUser();
        await supabase.from('submissions').insert([{
          student_name: authUser?.user?.user_metadata?.full_name || 'Học viên Trạm 2',
          student_code: authUser?.user?.email?.split('@')[0] || 'STU_S2',
          class_name: `Trạm 2: ${selectedTier} (${selectedLevel}) [${practiceMode === 'READ_SAMPLE' ? 'Đọc mẫu' : 'Tự nói'}]`,
          mode: `STATION_2_${selectedTier}`,
          cefr_level: selectedChallenge?.level || selectedLevel,
          score: evaluated.totalScore,
          manual_score: null,
          spontaneity_score: evaluated.spontaneityScore,
          pitch_variance: evaluated.rubrics.intonation.score,
          is_script_suspected: evaluated.isScriptSuspected,
          audio_url: audioUrl,
          transcript: selectedChallenge?.prompt || '',
          feedback: `[Phát âm: ${evaluated.rubrics.pronunciation.score} | Ngữ điệu: ${evaluated.rubrics.intonation.score} | Trôi chảy: ${evaluated.rubrics.fluency.score}]`
        }]);
      }
    } catch (err) {
      console.warn("Lỗi lưu kết quả bài nộp:", err);
    }

    setFeedbackResult(evaluated);
    setIsTeacherExamining(false);
    setIsNormalPracticing(false);
    setDetailedModalVisible(true);
  };

  const currentTierInfo = TIERS.find(t => t.key === selectedTier);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA (PHẢN XẠ TÌNH HUỐNG)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 35 }}>
        {!isTeacherExamining && !isNormalPracticing && (
          <>
            {/* 1. CHỌN HÌNH THỨC NHẬN ĐỀ */}
            <Text style={styles.sectionHeaderLabel}>1. CHỌN HÌNH THỨC NHẬN ĐỀ BÀI:</Text>
            <View style={styles.originTabsRow}>
              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'SYSTEM' && styles.originTabActiveSystem]}
                onPress={() => setTopicOrigin('SYSTEM')}
              >
                <Text style={styles.originTabIcon}>🤖</Text>
                <Text style={[styles.originTabText, topicOrigin === 'SYSTEM' && styles.originTabTextActive]}>
                  ĐỀ MẪU HỆ THỐNG
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'TEACHER_DASHBOARD' && styles.originTabActiveTeacher]}
                onPress={() => setTopicOrigin('TEACHER_DASHBOARD')}
              >
                <Text style={styles.originTabIcon}>🏫</Text>
                <Text style={[styles.originTabText, topicOrigin === 'TEACHER_DASHBOARD' && styles.originTabTextActive]}>
                  BÀI GIẢNG VIÊN GIAO
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'STUDENT_CUSTOM' && styles.originTabActiveCustom]}
                onPress={() => setTopicOrigin('STUDENT_CUSTOM')}
              >
                <Text style={styles.originTabIcon}>📋</Text>
                <Text style={[styles.originTabText, topicOrigin === 'STUDENT_CUSTOM' && styles.originTabTextActive]}>
                  TỰ DÁN ĐỀ TẠI CHỖ
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. CHỌN CHẾ ĐỘ NÓI */}
            <Text style={styles.sectionHeaderLabel}>2. CHẾ ĐỘ LUYỆN TẬP:</Text>
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                style={[styles.modeTabBtn, practiceMode === 'READ_SAMPLE' && styles.modeTabBtnActiveSample]}
                onPress={() => setPracticeMode('READ_SAMPLE')}
              >
                <Text style={[styles.modeTabBtnText, practiceMode === 'READ_SAMPLE' && styles.modeTabBtnTextActive]}>
                  📖 1. ĐỌC CÂU MẪU (CHUẨN ÂM)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, practiceMode === 'FREE_SPEECH' && styles.modeTabBtnActiveFree]}
                onPress={() => setPracticeMode('FREE_SPEECH')}
              >
                <Text style={[styles.modeTabBtnText, practiceMode === 'FREE_SPEECH' && styles.modeTabBtnTextActive]}>
                  ⚡ 2. TỰ NÓI PHẢN XẠ (TỰ DO)
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. CHỌN TẦNG THI ĐẤU */}
            <Text style={styles.sectionHeaderLabel}>3. THỂ THỨC THI ĐẤU PHẢN XẠ:</Text>
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

            {/* 4. CHỌN LEVEL CEFR */}
            <Text style={styles.sectionHeaderLabel}>4. CẤP ĐỘ CEFR:</Text>
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

            {/* 5. KHUNG HIỂN THỊ ĐỀ THI VÀ NÚT ĐỔI ĐỀ TRỰC QUAN */}
            {topicOrigin === 'STUDENT_CUSTOM' ? (
              <View style={styles.customBoxWrapper}>
                <Text style={styles.customBoxTitle}>📋 DÁN ĐỀ BÀI CỦA GIẢNG VIÊN VÀO ĐÂY:</Text>
                
                <Text style={styles.fieldLabel}>Tên tình huống (*):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Phỏng vấn xin việc..."
                  placeholderTextColor="#666688"
                  value={customTitle}
                  onChangeText={setCustomTitle}
                />

                <Text style={styles.fieldLabel}>Bối cảnh tình huống:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Khách hàng hỏi về chính sách bảo hành..."
                  placeholderTextColor="#666688"
                  value={customContext}
                  onChangeText={setCustomContext}
                />

                <Text style={styles.fieldLabel}>
                  {practiceMode === 'READ_SAMPLE' ? 'Câu phản xạ mẫu tiếng Anh (*):' : 'Câu hỏi phản xạ tiếng Anh (*):'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Dán câu tiếng Anh mẫu hoặc câu hỏi vào đây..."
                  placeholderTextColor="#666688"
                  multiline
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                />

                <TouchableOpacity style={styles.startCustomBtn} onPress={handleStartCustomTopic}>
                  <Text style={styles.startCustomBtnText}>🚀 BẮT ĐẦU LUYỆN TẬP VỚI ĐỀ NÀY</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.topicContainer}>
                {/* 🔄 NÚT ĐỔI CHỦ ĐỀ MỚI - HOẠT ĐỘNG NGAY LẬP TỨC */}
                <TouchableOpacity 
                  style={[styles.prominentSwitchBtn, isGeneratingAiTopic && { opacity: 0.6 }]} 
                  activeOpacity={0.7}
                  disabled={isGeneratingAiTopic}
                  onPress={handleNextTopic}
                >
                  {isGeneratingAiTopic ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#00FFFF" />
                      <Text style={styles.prominentSwitchBtnText}>⚡ ĐANG TẠO TÌNH HUỐNG MỚI...</Text>
                    </View>
                  ) : (
                    <Text style={styles.prominentSwitchBtnText}>
                      🎲 BẤM ĐỂ ĐỔI SANG TÌNH HUỐNG KHÁC (NGẪU NHIÊN / AI)
                    </Text>
                  )}
                </TouchableOpacity>

                {/* THẺ TÌNH HUỐNG HIỆN TẠI */}
                {!currentTopic ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      Chưa có chủ đề nào trong mục này. Bấm nút đổi tình huống ở trên để tạo mới!
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.card, currentTopic.isTeacherAssigned && styles.teacherCard]}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.roleText, currentTopic.isTeacherAssigned && { color: '#00FFFF' }]}>
                        {currentTopic.title}
                      </Text>
                      <Text style={styles.levelBadge}>
                        {currentTopic.level}
                      </Text>
                    </View>
                    
                    <Text style={styles.contextText}>📌 {currentTopic.contextDesc}</Text>

                    {practiceMode === 'READ_SAMPLE' ? (
                      <View style={styles.previewPromptBox}>
                        <View style={styles.sampleHeaderRow}>
                          <Text style={styles.previewPromptLabel}>📖 Câu phản xạ mẫu:</Text>
                          <TouchableOpacity 
                            style={[styles.ttsMiniBtn, isPlayingSample && styles.ttsMiniBtnActive]} 
                            activeOpacity={0.7}
                            onPress={() => playSampleAudio(currentTopic.prompt)}
                          >
                            <Text style={styles.ttsMiniBtnText}>
                              {isPlayingSample ? '⏹ DỪNG' : '🔊 NGHE MẪU'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.previewPromptText}>"{currentTopic.prompt}"</Text>
                      </View>
                    ) : (
                      <View style={styles.freeSpeechHintBox}>
                        <Text style={styles.freeSpeechHintLabel}>⚡ PHẢN XẠ ĐỘC LẬP (KHÔNG CÂU MẪU):</Text>
                        <Text style={styles.freeSpeechHintText}>
                          Hãy đọc kỹ bối cảnh phía trên và tự do nói ra câu phản xạ tiếng Anh của bạn!
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.startBtn, currentTopic.isTeacherAssigned && { backgroundColor: '#00FFFF' }]}
                      onPress={() => handleSelectChallenge(currentTopic)}
                    >
                      <Text style={[styles.startBtnText, currentTopic.isTeacherAssigned && { color: '#000' }]}>
                        🎙️ BƯỚC VÀO PHÒNG THU LUYỆN TẬP
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* PHÒNG THU LUYỆN TẬP */}
        {isNormalPracticing && selectedChallenge && (
          <View style={styles.normalPracticeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.normalPracticeHeader}>
                {practiceMode === 'READ_SAMPLE' ? '🎙️ PHÒNG THU: ĐỌC THEO CÂU MẪU' : '⚡ PHÒNG THU: TỰ NÓI PHẢN XẠ'}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {topicOrigin !== 'STUDENT_CUSTOM' && (
                  <TouchableOpacity 
                    style={[styles.switchTopicInRoomBtn, isGeneratingAiTopic && { opacity: 0.6 }]} 
                    activeOpacity={0.7} 
                    disabled={isGeneratingAiTopic}
                    onPress={handleNextTopic}
                  >
                    <Text style={styles.switchTopicInRoomText}>🔄 ĐỔI ĐỀ KHÁC</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsNormalPracticing(false)}>
                  <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ THOÁT</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.normalPromptTitle}>{selectedChallenge.title} ({selectedChallenge.level})</Text>
            <Text style={styles.normalPromptDesc}>{selectedChallenge.contextDesc}</Text>

            {practiceMode === 'READ_SAMPLE' ? (
              <View style={styles.promptDisplayBox}>
                <View style={styles.sampleHeaderRow}>
                  <Text style={styles.promptModeNotice}>📖 CÂU PHẢN XẠ MẪU:</Text>
                  <TouchableOpacity 
                    style={[styles.ttsPlayBtn, isPlayingSample && styles.ttsPlayBtnActive]} 
                    activeOpacity={0.7}
                    onPress={() => playSampleAudio(selectedChallenge.prompt)}
                  >
                    <Text style={styles.ttsPlayBtnText}>
                      {isPlayingSample ? '⏹ DỪNG ĐỌC' : '🔊 NGHE GIỌNG MẪU'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.promptDisplayText}>{selectedChallenge.prompt}</Text>
              </View>
            ) : (
              <View style={[styles.promptDisplayBox, { borderColor: '#39FF14', backgroundColor: '#07180D' }]}>
                <Text style={[styles.promptModeNotice, { color: '#39FF14' }]}>
                  ⚡ BẠN ĐANG PHẢN XẠ ĐỘC LẬP:
                </Text>
                <Text style={[styles.promptDisplayText, { fontSize: 13, color: '#88FFBB', fontWeight: 'bold' }]}>
                  Bấm nút thu âm và tự tin trả lời theo tình huống bối cảnh trên!
                </Text>
              </View>
            )}

            <View style={styles.liveWaveformBox}>
              <Text style={styles.liveWaveformLabel}>
                {isRecordingNormal ? `🔴 ĐANG THU ÂM VÀ BẮT SÓNG ÂM: ${normalTimer}S` : '⚪ NHẤN NÚT ĐỂ BẮT ĐẦU THU ÂM'}
              </Text>
              <canvas
                ref={canvasRef}
                width={520}
                height={80}
                style={{ width: '100%', height: 80, backgroundColor: '#070212', borderRadius: 8, display: 'block' }}
              />
            </View>

            {recordedAudioUrl && !isRecordingNormal && (
              <View style={styles.audioReviewBox}>
                <Text style={styles.audioReviewTitle}>🎧 NGHE LẠI BẢN THU ÂM CỦA BẠN:</Text>
                {React.createElement('audio', {
                  controls: true,
                  src: recordedAudioUrl,
                  style: { width: '100%', height: '36px', marginTop: '6px' }
                })}
              </View>
            )}

            {!isRecordingNormal ? (
              <TouchableOpacity style={styles.startRecordBtn} activeOpacity={0.8} onPress={startNormalRecording}>
                <Text style={styles.startRecordBtnText}>🔴 BẮT ĐẦU THU ÂM</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopRecordBtn} activeOpacity={0.8} onPress={stopNormalRecording}>
                <Text style={styles.stopRecordBtnText}>⏹ DỪNG & CHẤM ĐIỂM CHI TIẾT</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PHÒNG THI CHỐNG ĐỌC */}
        {isTeacherExamining && selectedChallenge && (
          <AntiCheatSpeakingSession
            promptText={practiceMode === 'READ_SAMPLE' ? selectedChallenge.prompt : ''}
            situationPrompt={selectedChallenge.contextDesc}
            prepTimeSeconds={5}
            autoHidePrompt={true}
            onRecordingComplete={(blob, pitches) => finishSubmissionAndEvaluate(blob, pitches)}
            onCancel={() => setIsTeacherExamining(false)}
          />
        )}
      </ScrollView>

      <DetailedSpeechFeedbackModal
        visible={detailedModalVisible}
        data={feedbackResult}
        onClose={() => setDetailedModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 11.5, fontWeight: '900', flexShrink: 1 },

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
  tierTab: { flex: 1, paddingVertical: 9, backgroundColor: '#0D0620', borderRadius: 10, borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  tierTabActive: { backgroundColor: '#1E0B36', borderColor: '#39FF14' },
  tierTabIcon: { fontSize: 13, marginBottom: 2 },
  tierTabText: { color: '#8888AA', fontSize: 9, fontWeight: 'bold' },
  tierTabTextActive: { color: '#39FF14', fontWeight: '900' },
  tierInfoBox: { backgroundColor: '#0F0624', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#221144', marginBottom: 8 },
  tierInfoText: { color: '#FFD700', fontSize: 9, lineHeight: 14, fontStyle: 'italic' },

  levelTabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  levelTab: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: '#0D0620', borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  levelTabActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  levelTabText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  levelTabTextActive: { color: '#FFF', fontWeight: '900' },

  topicContainer: { width: '100%', marginTop: 4 },
  prominentSwitchBtn: {
    backgroundColor: '#1E0B36',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00FFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  prominentSwitchBtnText: {
    color: '#00FFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  card: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roleText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8.5, fontWeight: '900' },
  contextText: { color: '#FFF', fontSize: 11, lineHeight: 16, marginBottom: 10 },
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
  customBoxTitle: { color: '#FF007F', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  fieldLabel: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold', marginTop: 6, marginBottom: 3 },
  textInput: { backgroundColor: '#070212', borderWidth: 1, borderColor: '#332255', borderRadius: 6, padding: 8, color: '#FFF', fontSize: 11 },
  textArea: { minHeight: 65, textAlignVertical: 'top' },
  startCustomBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  startCustomBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },

  audioReviewBox: { backgroundColor: '#130628', padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#39FF14', marginBottom: 12 },
  audioReviewTitle: { color: '#39FF14', fontSize: 9.5, fontWeight: '900' },

  emptyCard: { backgroundColor: '#120826', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginVertical: 8 },
  emptyText: { color: '#AAAABB', fontStyle: 'italic', textAlign: 'center', fontSize: 10.5, lineHeight: 16 },

  normalPracticeCard: { backgroundColor: '#0A0318', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#00FFFF', marginVertical: 10 },
  normalPracticeHeader: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  switchTopicInRoomBtn: { backgroundColor: '#1E0B36', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  switchTopicInRoomText: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },

  normalPromptTitle: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginTop: 8 },
  normalPromptDesc: { color: '#8888AA', fontSize: 10.5, marginBottom: 10 },
  promptDisplayBox: { backgroundColor: '#130628', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptModeNotice: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },
  promptDisplayText: { color: '#FFFFFF', fontSize: 13, lineHeight: 20, fontWeight: 'bold' },
  liveWaveformBox: { marginBottom: 14 },
  liveWaveformLabel: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', marginBottom: 6 },
  startRecordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  startRecordBtnText: { color: '#FFF', fontSize: 11.5, fontWeight: '900' },
  stopRecordBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  stopRecordBtnText: { color: '#000', fontSize: 11.5, fontWeight: '900' }
});