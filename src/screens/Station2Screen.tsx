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
  { key: 'SOLO', label: 'TẦNG 1: SOLO', icon: '🥊', desc: 'Đơn đấu kỹ thuật: Xử lý câu ngữ âm khó và nhịp điệu trọng âm' },
  { key: 'RELAY', label: 'TẦNG 2: RELAY', icon: '🏃', desc: 'Tiếp sức phản xạ: Nghe câu đối thoại trước và nối ý ngay lập tức' },
  { key: 'ROLEPLAY', label: 'TẦNG 3: ROLEPLAY', icon: '🎭', desc: 'Nhập vai tình huống: Giải quyết xung đột thực tế theo vai vế xã hội' }
];

const DEFAULT_CHALLENGES: ChallengeItem[] = [
  // ==================== TẦNG 1: SOLO ====================
  { id: 's_a1', tier: 'SOLO', level: 'A1', title: 'Phát âm nối âm cơ bản', contextDesc: 'Thử thách phát âm rõ phụ âm cuối và nối âm mượt mà:', prompt: 'There is an apple on the table next to an orange.' },
  { id: 's_a2', tier: 'SOLO', level: 'A2', title: 'Trọng âm từ và nhịp điệu quá khứ', contextDesc: 'Nhấn chính xác đuôi -ed và trọng âm từ đa âm tiết:', prompt: 'Yesterday we decided to visit the historical museum and enjoyed every minute.' },
  { id: 's_b1', tier: 'SOLO', level: 'B1', title: 'Ngắt nhịp cụm tư duy (Thought Groups)', contextDesc: 'Ngắt hơi tự nhiên giữa mệnh đề chính và mệnh đề phụ:', prompt: 'Although the weather was terrible, we managed to arrive at the conference right on schedule.' },
  { id: 's_b2', tier: 'SOLO', level: 'B2', title: 'Ngữ điệu câu phức học thuật', contextDesc: 'Điều chỉnh cao độ nâng lên ở mệnh đề điều kiện và hạ giọng ở kết luận:', prompt: 'If financial markets continue to exhibit volatility, institutional investors will inevitably reallocate their capital into low-risk government bonds.' },
  { id: 's_c1', tier: 'SOLO', level: 'C1', title: 'Phát âm học thuật cao cấp & Cụm danh từ ghép', contextDesc: 'Thử thách độ nuột của các âm xát, phụ âm ghép và trọng âm từ trừu tượng:', prompt: 'The institutionalization of renewable methodologies requires comprehensive interdisciplinary collaboration across disparate economic sectors.' },
  { id: 's_c2', tier: 'SOLO', level: 'C2', title: 'Biến thiên ngữ điệu tinh vi (Sophisticated Nuance)', contextDesc: 'Thể hiện ngữ điệu mỉa mai nhẹ nhàng hoặc châm biếm học thuật qua cao độ F0:', prompt: 'To assume that technological ubiquity inherently equates to pedagogical efficacy is, at best, a profound philosophical oversight.' },

  // ==================== TẦNG 2: RELAY ====================
  { id: 'r_a1', tier: 'RELAY', level: 'A1', title: 'Phản hồi sở thích bạn học', contextDesc: 'Bạn học nói: "I really love drinking iced milk tea in the summer. How about you?"', prompt: 'I prefer cold fruit juice because it is much healthier and refreshing.' },
  { id: 'r_a2', tier: 'RELAY', level: 'A2', title: 'Phản hồi rủ rê cuối tuần', contextDesc: 'Đồng nghiệp nói: "We are planning a barbecue party this Saturday evening. Can you join us?"', prompt: 'I would love to, but I have already promised to visit my grandparents this weekend.' },
  { id: 'r_b1', tier: 'RELAY', level: 'B1', title: 'Nối tiếp ý kiến thảo luận nhóm', contextDesc: 'Trưởng nhóm nói: "Our current marketing campaign is not reaching university students effectively."', prompt: 'I completely agree. Perhaps we should collaborate with student influencers on TikTok to boost our organic reach.' },
  { id: 'r_b2', tier: 'RELAY', level: 'B2', title: 'Phản biện lịch trình dự án', contextDesc: 'Khách hàng nói: "We need the beta version deployed two weeks earlier than the agreed roadmap."', prompt: 'Accelerating the deployment timeline will severely constrain our quality assurance cycle, risking critical security vulnerabilities.' },
  { id: 'r_c1', tier: 'RELAY', level: 'C1', title: 'Đối thoại chất vấn chiến lược', contextDesc: 'Thành viên hội đồng nói: "Expanding into emerging markets right now carries unacceptable currency fluctuation risks."', prompt: 'While macroeconomic volatility is palpable, our diversified hedging mechanisms and localized supply chains substantially buffer potential foreign exchange losses.' },
  { id: 'r_c2', tier: 'RELAY', level: 'C2', title: 'Tranh biện học thuật phản xạ', contextDesc: 'Đối thủ tranh biện nói: "Algorithmic decision-making will inevitably surpass human judicial impartiality in the coming decade."', prompt: 'That premise conflates statistical optimization with normative jurisprudence; an algorithm optimizes for historical precedents, thereby codifying systemic biases rather than dispensing justice.' },

  // ==================== TẦNG 3: ROLEPLAY ====================
  { id: 'rp_a1', tier: 'ROLEPLAY', level: 'A1', title: 'Khách gọi món tại quán ăn nhanh', contextDesc: 'Bối cảnh: Bạn muốn gọi 1 burger gà và 1 chai nước suối nhỏ.', prompt: 'Hello, can I please have one chicken burger and a small bottle of water?' },
  { id: 'rp_a2', tier: 'ROLEPLAY', level: 'A2', title: 'Hỏi đổi kích cỡ quần áo tại shop', contextDesc: 'Bối cảnh: Áo sơ mi bạn vừa thử bị chật vai, cần hỏi cỡ lớn hơn (L).', prompt: 'This shirt feels a bit tight around my shoulders. Do you happen to have this in a size large?' },
  { id: 'rp_b1', tier: 'ROLEPLAY', level: 'B1', title: 'Đổi trả cà phê tại sân bay', contextDesc: 'Bối cảnh: Bạn gọi cà phê đá không đường nhưng nhân viên đưa nhầm cà phê nóng, chuyến bay sắp cất cánh trong 15 phút.', prompt: 'Excuse me, I ordered an iced latte without sugar, but this seems to be hot cappuccino. Could you please replace it quickly as my boarding starts soon?' },
  { id: 'rp_b2', tier: 'ROLEPLAY', level: 'B2', title: 'Đàm phán dời lịch họp với đối tác', contextDesc: 'Bối cảnh: Đối tác muốn dời lịch họp sang thứ 6 nhưng bạn bị trùng lịch công tác tại Đà Nẵng.', prompt: 'I am afraid Friday afternoon will not work for me due to an urgent business trip. Could we possibly reschedule our strategic discussion to next Monday morning instead?' },
  { id: 'rp_c1', tier: 'ROLEPLAY', level: 'C1', title: 'Quản lý xử lý khiếu nại khách VIP', contextDesc: 'Bối cảnh: Điều hòa phòng Suite gặp trục trặc lúc nửa đêm, khách VIP đe dọa hủy hợp đồng hội nghị.', prompt: 'I sincerely apologize for the disruption caused by the malfunctioning HVAC system. Let me immediately arrange a room upgrade on the executive penthouse floor, along with complimentary dining services.' },
  { id: 'rp_c2', tier: 'ROLEPLAY', level: 'C2', title: 'Phát ngôn viên xử lý khủng hoảng truyền thông', contextDesc: 'Bối cảnh: Hệ thống thanh toán bị tê liệt 2 giờ trước thềm phiên giao dịch chứng khoán.', prompt: 'We unequivocally acknowledge the unprecedented infrastructure downtime today. Our engineering contingency protocols have stabilized the core clusters, and comprehensive security audits are underway to ensure zero financial discrepancies.' }
];

export default function Station2Screen({ onBack }: Props) {
  const [selectedTier, setSelectedTier] = useState<Station2Tier>('ROLEPLAY');
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1');
  const [allChallenges, setAllChallenges] = useState<ChallengeItem[]>(DEFAULT_CHALLENGES);
  const [teacherAssignments, setTeacherAssignments] = useState<ChallengeItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(null);

  // 🎯 NGUỒN CHỦ ĐỀ: HỆ THỐNG / TỪ DASHBOARD GIÁO VIÊN / SINH VIÊN TỰ DÁN
  const [topicOrigin, setTopicOrigin] = useState<TopicOrigin>('TEACHER_DASHBOARD');

  // 🎯 2 CHẾ ĐỘ: ĐỌC CÂU MẪU vs TỰ NÓI PHẢN XẠ
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('READ_SAMPLE');

  // 🎯 DỮ LIỆU FORM DÁN TẠI CHỖ TỪ SINH VIÊN
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customContext, setCustomContext] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Thu âm & Sóng âm trực quan
  const [isNormalPracticing, setIsNormalPracticing] = useState<boolean>(false);
  const [isRecordingNormal, setIsRecordingNormal] = useState<boolean>(false);
  const [normalTimer, setNormalTimer] = useState<number>(0);
  const normalMediaRecorderRef = useRef<any>(null);
  const normalAudioChunksRef = useRef<any[]>([]);
  const normalPitchHistoryRef = useRef<number[]>([]);
  const normalAnimFrameRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🎧 Thanh phát lại ghi âm cho sinh viên nghe lại
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Anti-Cheat khi làm bài chính thức của giáo viên
  const [isTeacherExamining, setIsTeacherExamining] = useState<boolean>(false);

  // Modal chi tiết
  const [detailedModalVisible, setDetailedModalVisible] = useState<boolean>(false);
  const [feedbackResult, setFeedbackResult] = useState<DetailedFeedbackData | null>(null);

  // 1. Tải đề từ Bảng điều khiển của Giảng viên (Supabase)
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
              contextDesc: item.description || `🏫 Nhiệm vụ học phần bắt buộc (${detectedTier}):`,
              prompt: item.target_prompt || '',
              isTeacherAssigned: true
            };
          });

          setTeacherAssignments(teacherItems);
          setAllChallenges([...teacherItems, ...DEFAULT_CHALLENGES]);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải bài tập giảng viên giao Trạm 2:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchTeacherAssignments();
  }, []);

  // Lọc danh sách bài hiển thị theo nguồn được chọn
  const getDisplayChallenges = () => {
    if (topicOrigin === 'TEACHER_DASHBOARD') {
      return teacherAssignments.filter(
        item => item.tier === selectedTier && item.level === selectedLevel
      );
    }
    return DEFAULT_CHALLENGES.filter(
      item => item.tier === selectedTier && item.level === selectedLevel
    );
  };

  const currentDisplayList = getDisplayChallenges();

  // 🔄 HÀM CHUYỂN CHỦ ĐỀ TIẾP THEO (ĐỔI CHỦ ĐỀ MỚI)
  const handleSwitchToNextTopic = () => {
    const list = getDisplayChallenges();
    if (list.length === 0) {
      Alert.alert("Thông báo", "Không có chủ đề nào khác trong mục này.");
      return;
    }

    // Nếu chỉ có 1 bài
    if (list.length === 1) {
      Alert.alert("Thông báo", "Chỉ có 1 chủ đề trong danh mục này.");
      return;
    }

    const currentIndex = list.findIndex(item => item.id === selectedChallenge?.id);
    const nextIndex = (currentIndex + 1) % list.length;
    const nextChallenge = list[nextIndex];

    setSelectedChallenge(nextChallenge);
    setRecordedAudioUrl(null);
    setNormalTimer(0);
    setIsRecordingNormal(false);

    if (normalAnimFrameRef.current) cancelAnimationFrame(normalAnimFrameRef.current);
    if (normalMediaRecorderRef.current && normalMediaRecorderRef.current.state === 'recording') {
      try { normalMediaRecorderRef.current.stop(); } catch (e) {}
    }
  };

  // 🎲 HÀM CHỌN NGẪU NHIÊN 1 CHỦ ĐỀ TỪ DANH SÁCH
  const handlePickRandomTopic = () => {
    const list = getDisplayChallenges();
    if (list.length === 0) {
      Alert.alert("Thông báo", "Không có chủ đề để chọn.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * list.length);
    handleSelectChallenge(list[randomIndex]);
  };

  // Bắt đầu luyện tập bằng đề tự dán
  const handleStartCustomTopic = () => {
    if (!customTitle.trim() || !customPrompt.trim()) {
      Alert.alert("Chưa đủ thông tin", "Vui lòng nhập ít nhất Tiêu đề và Câu hỏi/Nhiệm vụ bằng tiếng Anh!");
      return;
    }

    const customItem: ChallengeItem = {
      id: `custom_${Date.now()}`,
      tier: selectedTier,
      level: selectedLevel,
      title: customTitle.trim(),
      contextDesc: customContext.trim() || `📋 Đề bài tự dán (${selectedTier} - ${selectedLevel}):`,
      prompt: customPrompt.trim(),
      isTeacherAssigned: false
    };

    setSelectedChallenge(customItem);
    setRecordedAudioUrl(null);
    setIsNormalPracticing(true);
    setIsTeacherExamining(false);
    setNormalTimer(0);
    setIsRecordingNormal(false);
  };

  const handleSelectChallenge = (item: ChallengeItem) => {
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

  // Thu âm thường với sóng âm Canvas
  const startNormalRecording = async () => {
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
      Alert.alert("Lỗi Micro", "Không thể truy cập microphone. Vui lòng cấp quyền trên trình duyệt.");
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
          feedback: `[Phát âm: ${evaluated.rubrics.pronunciation.score} | Ngữ điệu: ${evaluated.rubrics.intonation.score} | Trôi chảy: ${evaluated.rubrics.fluency.score} | Từ vựng: ${evaluated.rubrics.vocabulary.score} | Ngữ pháp: ${evaluated.rubrics.grammar.score} | Nội dung: ${evaluated.rubrics.content.score}]`
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
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA (3 TẦNG ĐẤU)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 35 }}>
        {!isTeacherExamining && !isNormalPracticing && (
          <>
            {/* 1. CHỌN NGUỒN CHỦ ĐỀ */}
            <Text style={styles.sectionHeaderLabel}>1. CHỌN HÌNH THỨC NHẬN ĐỀ BÀI:</Text>
            <View style={styles.originTabsRow}>
              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'TEACHER_DASHBOARD' && styles.originTabActiveTeacher]}
                onPress={() => setTopicOrigin('TEACHER_DASHBOARD')}
              >
                <Text style={styles.originTabIcon}>🏫</Text>
                <Text style={[styles.originTabText, topicOrigin === 'TEACHER_DASHBOARD' && styles.originTabTextActive]}>
                  TỪ BẢNG GIẢNG VIÊN
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

              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'SYSTEM' && styles.originTabActiveSystem]}
                onPress={() => setTopicOrigin('SYSTEM')}
              >
                <Text style={styles.originTabIcon}>🤖</Text>
                <Text style={[styles.originTabText, topicOrigin === 'SYSTEM' && styles.originTabTextActive]}>
                  ĐỀ MẪU HỆ THỐNG
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. CHỌN 2 NÚT CHẾ ĐỘ: ĐỌC CÂU MẪU VS TỰ NÓI */}
            <Text style={styles.sectionHeaderLabel}>2. CHẾ ĐỘ NÓI:</Text>
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
            <Text style={styles.modeDescText}>
              {practiceMode === 'READ_SAMPLE'
                ? '👉 Nhìn toàn văn câu mẫu để luyện phát âm, nối âm và cao độ ngữ điệu.'
                : '👉 Tự do phát biểu theo tình huống và bối cảnh được giao; không hiển thị văn bản mẫu để hỗ trợ.'}
            </Text>

            {/* 3. BỘ CHỌN 3 TẦNG ĐẤU */}
            <Text style={styles.sectionHeaderLabel}>3. CHỌN TẦNG THI ĐẤU:</Text>
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

            {/* 🎧 THANH NGHE LẠI BẢN THU ÂM */}
            {recordedAudioUrl && (
              <View style={styles.audioReviewBox}>
                <View style={styles.audioReviewHeader}>
                  <Text style={styles.audioReviewTitle}>🎧 BẢN THU ÂM CỦA BẠN (NGHE LẠI):</Text>
                  <Text style={styles.audioReviewSub}>Bấm phát để kiểm tra độ to, rõ ràng của bài nói vừa rồi</Text>
                </View>
                {React.createElement('audio', {
                  controls: true,
                  src: recordedAudioUrl,
                  style: { width: '100%', height: '38px', marginTop: '6px' }
                })}
              </View>
            )}

            {/* 5. GIAO DIỆN NỘI DUNG THEO NGUỒN CHỌN */}
            {topicOrigin === 'STUDENT_CUSTOM' ? (
              <View style={styles.customBoxWrapper}>
                <Text style={styles.customBoxTitle}>📋 DÁN ĐỀ BÀI CỦA GIẢNG VIÊN VÀO ĐÂY:</Text>
                
                <Text style={styles.fieldLabel}>Tên chủ đề / Tình huống (*):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Phỏng vấn xin việc vị trí Marketing..."
                  placeholderTextColor="#666688"
                  value={customTitle}
                  onChangeText={setCustomTitle}
                />

                <Text style={styles.fieldLabel}>Bối cảnh / Ghi chú nhiệm vụ:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Giám khảo hỏi về kinh nghiệm làm việc thực tế..."
                  placeholderTextColor="#666688"
                  value={customContext}
                  onChangeText={setCustomContext}
                />

                <Text style={styles.fieldLabel}>
                  {practiceMode === 'READ_SAMPLE' ? 'Câu văn mẫu tiếng Anh cần luyện đọc (*):' : 'Câu hỏi / Chủ đề gợi mở tiếng Anh (*):'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder={
                    practiceMode === 'READ_SAMPLE'
                      ? 'Dán câu tiếng Anh mẫu chuẩn để luyện phát âm từng từ...'
                      : 'Dán câu hỏi hoặc chủ đề để bạn tự do phát biểu suy nghĩ...'
                  }
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
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }}>
                  <Text style={styles.sectionHeader}>
                    {topicOrigin === 'TEACHER_DASHBOARD'
                      ? `🏫 BÀI TẬP GIẢNG VIÊN GIAO [${selectedTier} - ${selectedLevel}]:`
                      : `🔥 ĐỀ MẪU HỆ THỐNG [${selectedTier} - ${selectedLevel}]:`}
                  </Text>
                  
                  {/* 🔄 NÚT CHỌN NGẪU NHIÊN 1 ĐỀ */}
                  {currentDisplayList.length > 1 && (
                    <TouchableOpacity style={styles.randomTopicBtn} onPress={handlePickRandomTopic}>
                      <Text style={styles.randomTopicBtnText}>🎲 ĐỔI 1 ĐỀ BẤT KỲ</Text>
                    </TouchableOpacity>
                  )}
                  {loadingAssignments && <ActivityIndicator size="small" color="#00FFFF" />}
                </View>

                {currentDisplayList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      {topicOrigin === 'TEACHER_DASHBOARD'
                        ? 'Chưa có bài tập nào được giao từ Dashboard Giảng viên cho Tầng và Cấp độ này.\n👉 Bạn có thể chuyển sang tab "TỰ DÁN ĐỀ TẠI CHỖ" ở trên để nhập bài ngay!'
                        : 'Không có bài mẫu cho bộ lọc này.'}
                    </Text>
                  </View>
                ) : (
                  currentDisplayList.map((item) => (
                    <View key={item.id} style={[styles.card, item.isTeacherAssigned && styles.teacherCard]}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.roleText, item.isTeacherAssigned && { color: '#00FFFF' }]}>
                          {item.isTeacherAssigned ? '🏫 [BÀI GIẢNG VIÊN GIAO] ' : `${currentTierInfo?.icon} `}{item.title}
                        </Text>
                        <Text style={[styles.levelBadge, item.isTeacherAssigned && { backgroundColor: '#FF007F', color: '#FFF' }]}>
                          {item.level}
                        </Text>
                      </View>
                      <Text style={styles.contextText}>{item.contextDesc}</Text>

                      {practiceMode === 'READ_SAMPLE' ? (
                        <View style={styles.previewPromptBox}>
                          <Text style={styles.previewPromptLabel}>📖 Câu văn mẫu cần luyện:</Text>
                          <Text style={styles.previewPromptText}>"{item.prompt}"</Text>
                        </View>
                      ) : (
                        <View style={styles.freeSpeechHintBox}>
                          <Text style={styles.freeSpeechHintLabel}>⚡ THỬ THÁCH TỰ NÓI PHẢN XẠ 100%:</Text>
                          <Text style={styles.freeSpeechHintText}>
                            Không có câu mẫu trợ giúp! Hãy đọc kỹ bối cảnh trên và tự do suy nghĩ để trình bày câu trả lời của bạn.
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[styles.startBtn, item.isTeacherAssigned && { backgroundColor: '#00FFFF' }]}
                        onPress={() => handleSelectChallenge(item)}
                      >
                        <Text style={[styles.startBtnText, item.isTeacherAssigned && { color: '#000' }]}>
                          {item.isTeacherAssigned ? '⚡ BƯỚC VÀO PHÒNG THI (ANTI-CHEAT)' : '🎙️ BẬT PHÒNG THU TỰ DO'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}
          </>
        )}

        {/* PHÒNG THU LUYỆN TẬP */}
        {isNormalPracticing && selectedChallenge && (
          <View style={styles.normalPracticeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.normalPracticeHeader}>
                {practiceMode === 'READ_SAMPLE' ? '🎙️ PHÒNG THU: ĐỌC THEO CÂU MẪU' : '⚡ PHÒNG THU: TỰ NÓI PHẢN XẠ TỰ DO'}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {/* 🔄 NÚT CHUYỂN CHỦ ĐỀ MỚI TRỰC TIẾP TRONG PHÒNG THU */}
                {topicOrigin !== 'STUDENT_CUSTOM' && (
                  <TouchableOpacity style={styles.switchTopicInRoomBtn} onPress={handleSwitchToNextTopic}>
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
                <Text style={styles.promptModeNotice}>📖 CÂU VĂN MẪU CẦN ĐỌC CHUẨN:</Text>
                <Text style={styles.promptDisplayText}>{selectedChallenge.prompt}</Text>
              </View>
            ) : (
              <View style={[styles.promptDisplayBox, { borderColor: '#39FF14', backgroundColor: '#07180D' }]}>
                <Text style={[styles.promptModeNotice, { color: '#39FF14' }]}>
                  ⚡ BẠN ĐANG THI PHẢN XẠ ĐỘC LẬP (KHÔNG CÓ GỢI Ý CÂU CHỮ):
                </Text>
                <Text style={[styles.promptDisplayText, { fontSize: 13, color: '#88FFBB', fontWeight: 'bold' }]}>
                  Hãy tập trung toàn bộ vào bối cảnh nhiệm vụ phía trên. Bấm nút bắt đầu và tự nói câu trả lời bằng tiếng Anh theo suy nghĩ của bạn!
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

            {/* Thanh nghe lại ngay sau khi nói xong */}
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
              <TouchableOpacity style={styles.startRecordBtn} onPress={startNormalRecording}>
                <Text style={styles.startRecordBtnText}>🔴 BẮT ĐẦU THU ÂM</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopRecordBtn} onPress={stopNormalRecording}>
                <Text style={styles.stopRecordBtnText}>⏹ DỪNG & CHẤM ĐIỂM CHI TIẾT</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PHÒNG THI CHỐNG ĐỌC CỦA GIÁO VIÊN */}
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
  title: { color: '#FF007F', fontSize: 12, fontWeight: '900', flexShrink: 1 },

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
  modeDescText: { color: '#AAAABB', fontSize: 9, fontStyle: 'italic', marginTop: 4, marginBottom: 8 },

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

  customBoxWrapper: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#FF007F', marginVertical: 8 },
  customBoxTitle: { color: '#FF007F', fontSize: 11, fontWeight: '900', marginBottom: 8 },
  fieldLabel: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold', marginTop: 6, marginBottom: 3 },
  textInput: { backgroundColor: '#070212', borderWidth: 1, borderColor: '#332255', borderRadius: 6, padding: 8, color: '#FFF', fontSize: 11 },
  textArea: { minHeight: 65, textAlignVertical: 'top' },
  startCustomBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  startCustomBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },

  audioReviewBox: { backgroundColor: '#130628', padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#39FF14', marginBottom: 12 },
  audioReviewHeader: { marginBottom: 2 },
  audioReviewTitle: { color: '#39FF14', fontSize: 9.5, fontWeight: '900' },
  audioReviewSub: { color: '#8888AA', fontSize: 8.5 },

  sectionHeader: { color: '#00FFFF', fontSize: 10.5, fontWeight: '900' },
  randomTopicBtn: { backgroundColor: '#1A0B2E', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  randomTopicBtnText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },

  card: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roleText: { color: '#FFD700', fontSize: 11.5, fontWeight: 'bold', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8.5, fontWeight: '900' },
  contextText: { color: '#FFF', fontSize: 10.5, lineHeight: 16, marginBottom: 8 },
  previewPromptBox: { backgroundColor: '#070212', padding: 8, borderRadius: 6, marginBottom: 10 },
  previewPromptLabel: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold', marginBottom: 2 },
  previewPromptText: { color: '#FFFFFF', fontSize: 10.5, fontStyle: 'italic' },
  freeSpeechHintBox: { backgroundColor: '#07180D', padding: 8, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#39FF14' },
  freeSpeechHintLabel: { color: '#39FF14', fontSize: 8.5, fontWeight: 'bold', marginBottom: 2 },
  freeSpeechHintText: { color: '#88FFBB', fontSize: 9.5, fontStyle: 'italic' },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  emptyCard: { backgroundColor: '#120826', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginVertical: 8 },
  emptyText: { color: '#AAAABB', fontStyle: 'italic', textAlign: 'center', fontSize: 10.5, lineHeight: 16 },

  normalPracticeCard: { backgroundColor: '#0A0318', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#00FFFF', marginVertical: 10 },
  normalPracticeHeader: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  switchTopicInRoomBtn: { backgroundColor: '#1E0B36', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  switchTopicInRoomText: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold' },

  normalPromptTitle: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginTop: 8 },
  normalPromptDesc: { color: '#8888AA', fontSize: 10.5, marginBottom: 10 },
  promptDisplayBox: { backgroundColor: '#130628', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptModeNotice: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold', marginBottom: 6 },
  promptDisplayText: { color: '#FFFFFF', fontSize: 13.5, lineHeight: 22, fontWeight: 'bold' },
  liveWaveformBox: { marginBottom: 14 },
  liveWaveformLabel: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', marginBottom: 6 },
  startRecordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  startRecordBtnText: { color: '#FFF', fontSize: 11.5, fontWeight: '900' },
  stopRecordBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  stopRecordBtnText: { color: '#000', fontSize: 11.5, fontWeight: '900' }
});