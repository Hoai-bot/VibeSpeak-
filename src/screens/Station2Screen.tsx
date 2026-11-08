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

// 🎯 KHO ĐỀ MẪU CHUẨN XÁC ĐÚNG MỤC TIÊU SƯ PHẠM TRẠM 2
const DEFAULT_CHALLENGES: ChallengeItem[] = [
  // ==================== TẦNG 1: SOLO (CÁ NHÂN PHẢN XẠ TÌNH HUỐNG) ====================
  { 
    id: 's_a1_1', tier: 'SOLO', level: 'A1', 
    title: 'Phản xạ khi gặp người nước ngoài hỏi thăm', 
    contextDesc: 'Tình huống: Một du khách hỏi bạn quán cà phê gần nhất ở đâu và thức uống nào ngon nhất tại đây.', 
    prompt: 'There is a great cafe around the corner. You should definitely try the iced milk coffee.' 
  },
  { 
    id: 's_a1_2', tier: 'SOLO', level: 'A1', 
    title: 'Phản xạ khi trễ giờ học', 
    contextDesc: 'Tình huống: Bạn bước vào lớp trễ 10 phút vì kẹt xe, hãy giải thích ngắn gọn với giáo viên.', 
    prompt: 'Good morning teacher, I apologize for being late because of heavy traffic.' 
  },
  { 
    id: 's_a2_1', tier: 'SOLO', level: 'A2', 
    title: 'Phản xạ khi được nhờ làm thêm giờ', 
    contextDesc: 'Tình huống: Quản lý hỏi bạn có thể ở lại làm thêm 2 tiếng tối nay không nhưng bạn bận lịch học.', 
    prompt: 'I would love to help, but I have an important evening class tonight that I cannot miss.' 
  },
  { 
    id: 's_a2_2', tier: 'SOLO', level: 'A2', 
    title: 'Phản xạ khi đồ ăn mang ra bị nguội', 
    contextDesc: 'Tình huống: Đĩa thức ăn phục vụ bị nguội, bạn gọi nhân viên để yêu cầu hâm nóng lại lịch sự.', 
    prompt: 'Excuse me, my soup is quite cold. Could you please heat it up for me?' 
  },
  { 
    id: 's_b1_1', tier: 'SOLO', level: 'B1', 
    title: 'Phản xạ chất vấn trong buổi thuyết trình', 
    contextDesc: 'Tình huống: Khán giả hỏi liệu giải pháp ứng dụng của bạn có tốn quá nhiều chi phí triển khai ban đầu không.', 
    prompt: 'While the initial setup requires capital investment, the operational savings over six months will completely offset the costs.' 
  },
  { 
    id: 's_b1_2', tier: 'SOLO', level: 'B1', 
    title: 'Phản xạ khi bị bạn cùng nhóm giao thiếu việc', 
    contextDesc: 'Tình huống: Trưởng nhóm phân công công việc không đều, bạn cần lên tiếng đề xuất chia lại công bằng.', 
    prompt: 'I noticed some tasks are overlapping. I propose we redistribute the research workload so everyone contributes equally.' 
  },
  { 
    id: 's_b2_1', tier: 'SOLO', level: 'B2', 
    title: 'Phản xạ đàm phán thời hạn dự án (Deadlines)', 
    contextDesc: 'Tình huống: Khách hàng yêu cầu giao sản phẩm trước 1 tuần, bạn phải giải thích rủi ro chất lượng.', 
    prompt: 'Accelerating our delivery by a full week will severely compromise our testing protocols, increasing the likelihood of critical software bugs.' 
  },
  { 
    id: 's_b2_2', tier: 'SOLO', level: 'B2', 
    title: 'Phản biện đề xuất bỏ kỳ thi đại học', 
    contextDesc: 'Tình huống: Trong buổi tranh biện, bạn nhận được câu hỏi bất ngờ phản đối việc đánh giá học sinh qua một kỳ thi duy nhất.', 
    prompt: 'A standardized exam measures momentary performance rather than holistic intellectual potential; continuous portfolio assessments reflect student competence far better.' 
  },
  { 
    id: 's_c1_1', tier: 'SOLO', level: 'C1', 
    title: 'Phát ngôn xử lý sự cố rò rỉ dữ liệu', 
    contextDesc: 'Tình huống: Phóng viên hỏi về lỗ hổng bảo mật người dùng vừa bị phát hiện, bạn cần phản xạ với tư cách người đại diện.', 
    prompt: 'We have initiated immediate containment protocols, engaged external forensic auditors, and committed to absolute transparency throughout this mitigation process.' 
  },
  { 
    id: 's_c2_1', tier: 'SOLO', level: 'C2', 
    title: 'Tranh biện học thuật về đạo đức AI trong tư pháp', 
    contextDesc: 'Tình huống: Hội đồng đặt câu hỏi: "Liệu AI có thể hoàn toàn thay thế thẩm phán con người để phán quyết công bằng?"', 
    prompt: 'Algorithmic models optimize based on historical datasets, which inherently codify societal inequities rather than administering genuine restorative justice.' 
  },

  // ==================== TẦNG 2: RELAY (2 BẠN TIẾP SỨC CÙNG CHỦ ĐỀ) ====================
  { 
    id: 'r_a1_1', tier: 'RELAY', level: 'A1', 
    title: 'Tiếp sức: Kế hoạch tổ chức tiệc lớp', 
    contextDesc: 'Bạn A nói: "We should buy pizza and some soft drinks for the party." -> Bạn B tiếp sức nối ý thức uống/trang trí.', 
    prompt: 'Great idea! I can bring some fresh fruit and balloons to decorate the classroom.' 
  },
  { 
    id: 'r_a1_2', tier: 'RELAY', level: 'A1', 
    title: 'Tiếp sức: Sở thích ngày cuối tuần', 
    contextDesc: 'Bạn A nói: "I really enjoy swimming on Sunday mornings." -> Bạn B tiếp sức chia sẻ hoạt động thể thao tương ứng.', 
    prompt: 'I prefer playing badminton with my brother because it keeps us energetic all day.' 
  },
  { 
    id: 'r_a2_1', tier: 'RELAY', level: 'A2', 
    title: 'Tiếp sức: Lên lịch trình du lịch Đà Lạt', 
    contextDesc: 'Bạn A nói: "On the first day, we can visit the flower gardens and Xuan Huong lake." -> Bạn B tiếp sức bổ sung buổi tối.', 
    prompt: 'And in the evening, we should explore the night market and enjoy hot soy milk together.' 
  },
  { 
    id: 'r_a2_2', tier: 'RELAY', level: 'A2', 
    title: 'Tiếp sức: Thảo luận phương pháp học từ vựng', 
    contextDesc: 'Bạn A nói: "I use flashcards on my phone to review ten words every day." -> Bạn B tiếp sức bổ sung cách luyện nói.', 
    prompt: 'That is effective! In addition, making short video clips using those words helps me remember them much longer.' 
  },
  { 
    id: 'r_b1_1', tier: 'RELAY', level: 'B1', 
    title: 'Tiếp sức: Chiến dịch truyền thông TikTok cho CLB', 
    contextDesc: 'Bạn A nói: "Short videos showing funny daily activities of our club members will attract students." -> Bạn B tiếp sức bổ sung kế hoạch livestream/minigame.', 
    prompt: 'Building on that concept, we could host a weekly live Q&A session with interactive mini-games to boost organic student engagement.' 
  },
  { 
    id: 'r_b1_2', tier: 'RELAY', level: 'B1', 
    title: 'Tiếp sức: Giải pháp giảm rác thải nhựa tại trường', 
    contextDesc: 'Bạn A nói: "The canteen should ban single-use plastic cups entirely." -> Bạn B tiếp sức đề xuất chính sách ưu đãi cho học sinh mang bình cá nhân.', 
    prompt: 'To encourage that transition, the school should offer a ten percent discount for anyone who brings their own reusable tumblers.' 
  },
  { 
    id: 'r_b2_1', tier: 'RELAY', level: 'B2', 
    title: 'Tiếp sức: Ứng dụng Hybrid Working cho doanh nghiệp', 
    contextDesc: 'Bạn A nói: "Allowing employees to work remotely two days a week noticeably reduces commuting fatigue." -> Bạn B tiếp sức phân tích ảnh hưởng đến văn hóa gắn kết.', 
    prompt: 'However, to prevent team fragmentation, leadership must establish structured core collaboration hours and bi-weekly face-to-face brainstorming workshops.' 
  },
  { 
    id: 'r_b2_2', tier: 'RELAY', level: 'B2', 
    title: 'Tiếp sức: Chuyển dịch xe điện tại các đô thị lớn', 
    contextDesc: 'Bạn A nói: "Subsidizing electric motorbike purchases is the quickest way to curb city emissions." -> Bạn B tiếp sức phân tích bài toán áp lực lưới điện & trạm sạc.', 
    prompt: 'Simultaneously, municipal authorities must upgrade power grid capacities and standardize battery-swapping stations across major residential hubs.' 
  },
  { 
    id: 'r_c1_1', tier: 'RELAY', level: 'C1', 
    title: 'Tiếp sức: Chiến lược đa dạng hóa chuỗi cung ứng toàn cầu', 
    contextDesc: 'Bạn A phân tích: "Concentrating manufacturing exclusively in a single territory creates acute vulnerability." -> Bạn B tiếp sức đề xuất mô hình phân tán khu vực (Near-shoring).', 
    prompt: 'Adopting a localized near-shoring paradigm buffers geopolitical supply volatility while substantially compressing maritime logistics lead times.' 
  },
  { 
    id: 'r_c2_1', tier: 'RELAY', level: 'C2', 
    title: 'Tiếp sức: Tác động của thuật toán đề xuất lên phân cực xã hội', 
    contextDesc: 'Bạn A lập luận: "Engagement-driven algorithms inevitably foster cognitive echo chambers." -> Bạn B tiếp sức phân tích khía cạnh pháp lý và quyền tự do thông tin.', 
    prompt: 'Consequently, regulatory interventions must mandate algorithmic explainability without infringing upon platform technological innovation.' 
  },

  // ==================== TẦNG 3: ROLEPLAY (2 BẠN NHẬP VAI ĐỐI THOẠI) ====================
  { 
    id: 'rp_a1_1', tier: 'ROLEPLAY', level: 'A1', 
    title: 'Nhập vai: Khách hàng & Nhân viên quán ăn nhanh', 
    contextDesc: 'Vai: Bạn đóng vai khách muốn gọi combo gà rán, nước suối và hỏi thanh toán chuyển khoản.', 
    prompt: 'Hello, can I please order a fried chicken combo and pay via QR bank transfer?' 
  },
  { 
    id: 'rp_a1_2', tier: 'ROLEPLAY', level: 'A1', 
    title: 'Nhập vai: Nhân viên bán vé & Khách xem phim', 
    contextDesc: 'Vai: Bạn đóng vai khách mua 2 vé xem phim ca tối và hỏi xin bắp nước miễn phí theo thẻ sinh viên.', 
    prompt: 'Hi, I would like two tickets for the eight PM screening. Does my student card include complimentary popcorn?' 
  },
  { 
    id: 'rp_a2_1', tier: 'ROLEPLAY', level: 'A2', 
    title: 'Nhập vai: Khách hàng đổi size & Thu ngân cửa hàng', 
    contextDesc: 'Vai: Áo sơ mi mua hôm qua bị chật vai, bạn mang hóa đơn đến xin đổi sang cỡ lớn hơn (Size L).', 
    prompt: 'Good morning, I bought this shirt yesterday but it feels tight around my shoulders. Can I exchange it for a large?' 
  },
  { 
    id: 'rp_a2_2', tier: 'ROLEPLAY', level: 'A2', 
    title: 'Nhập vai: Khách trọ & Lễ tân khách sạn', 
    contextDesc: 'Vai: Bạn cần trả phòng lúc 12 giờ trưa nhưng muốn gửi lại 2 vali tới 5 giờ chiều.', 
    prompt: 'I am checking out now. Would it be possible to store our two suitcases here until five PM today?' 
  },
  { 
    id: 'rp_b1_1', tier: 'ROLEPLAY', level: 'B1', 
    title: 'Nhập vai: Hành khách vội & Nhân viên quầy pha chế sân bay', 
    contextDesc: 'Vai: Bạn gọi trà đào đá nhưng nhận nhầm cà phê nóng, chuyến bay sắp lên máy bay sau 10 phút.', 
    prompt: 'Excuse me, I specifically ordered an iced peach tea, but I received hot coffee. Could you replace it urgently as my flight board soon?' 
  },
  { 
    id: 'rp_b1_2', tier: 'ROLEPLAY', level: 'B1', 
    title: 'Nhập vai: Đại diện nhóm sinh viên & Giảng viên bộ môn', 
    contextDesc: 'Vai: Máy chủ lưu trữ bài nộp gặp sự cố mất dữ liệu, bạn xin giảng viên gia hạn thêm 24 giờ.', 
    prompt: 'Dear Professor, our team encountered an unexpected cloud database failure last night. May we respectfully request a twenty-four hour extension?' 
  },
  { 
    id: 'rp_b2_1', tier: 'ROLEPLAY', level: 'B2', 
    title: 'Nhập vai: Trưởng dự án & Khách hàng phản ánh tiến độ', 
    contextDesc: 'Vai: Khách hàng bức xúc vì tính năng báo cáo bị chậm 3 ngày, bạn đàm phán giải pháp bàn giao từng phần.', 
    prompt: 'We acknowledge the delay in the analytics module; to keep your operations moving, we can deploy the core data export feature by this afternoon.' 
  },
  { 
    id: 'rp_b2_2', tier: 'ROLEPLAY', level: 'B2', 
    title: 'Nhập vai: Ứng viên & Nhà tuyển dụng thương lượng lương', 
    contextDesc: 'Vai: Công ty đề xuất mức lương thấp hơn kỳ vọng 15%, bạn lập luận dựa trên kinh nghiệm thực tế để thuyết phục.', 
    prompt: 'Given my hands-on experience leading similar cross-platform deployments, I believe an adjustment of ten percent would genuinely reflect the value I bring.' 
  },
  { 
    id: 'rp_c1_1', tier: 'ROLEPLAY', level: 'C1', 
    title: 'Nhập vai: Quản lý khách sạn 5 sao & Khách VIP khiếu nại', 
    contextDesc: 'Vai: Phòng Tổng thống bị rò rỉ nước lúc nửa đêm trước thềm hội nghị thượng đỉnh, bạn giải quyết khủng hoảng.', 
    prompt: 'I sincerely regret this unacceptable inconvenience. Allow me to immediately relocate your delegation to our executive penthouse with all ancillary services fully comped.' 
  },
  { 
    id: 'rp_c2_1', tier: 'ROLEPLAY', level: 'C2', 
    title: 'Nhập vai: Luật sư đại diện & Đại diện ủy ban điều trần thương mại', 
    contextDesc: 'Vai: Tranh biện về cáo buộc độc quyền nền tảng kỹ thuật số và bảo vệ quyền tích hợp sản phẩm.', 
    prompt: 'Our architectural integration constitutes consumer-centric functionality rather than exclusionary anti-competitive bundling under current antitrust jurisprudence.' 
  }
];

export default function Station2Screen({ onBack }: Props) {
  const [selectedTier, setSelectedTier] = useState<Station2Tier>('ROLEPLAY');
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1');
  const [allChallenges, setAllChallenges] = useState<ChallengeItem[]>(DEFAULT_CHALLENGES);
  const [teacherAssignments, setTeacherAssignments] = useState<ChallengeItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(null);

  // 🤖 Trạng thái tạo đề từ AI
  const [isGeneratingAiTopic, setIsGeneratingAiTopic] = useState<boolean>(false);

  // 🔊 Quản lý Text-To-Speech tự nhiên
  const [playingPromptText, setPlayingPromptText] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const getBestNaturalVoice = (): SpeechSynthesisVoice | null => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    if (!voices || voices.length === 0) return null;

    const priorityKeywords = ['Google US English', 'Natural', 'Jenny', 'Guy', 'Aria', 'Samantha', 'en-US'];
    for (const kw of priorityKeywords) {
      const match = voices.find(v => v.lang.startsWith('en') && v.name.includes(kw));
      if (match) return match;
    }

    const enUsVoice = voices.find(v => v.lang === 'en-US');
    if (enUsVoice) return enUsVoice;

    return voices.find(v => v.lang.startsWith('en')) || null;
  };

  const playSampleAudio = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      Alert.alert("Trình duyệt không hỗ trợ", "Thiết bị của bạn không hỗ trợ tính năng phát âm.");
      return;
    }

    const synth = window.speechSynthesis;

    if (playingPromptText === text) {
      synth.cancel();
      setPlayingPromptText(null);
      return;
    }

    synth.cancel();

    const cleanText = text.replace(/["']/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const bestVoice = getBestNaturalVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = 0.90;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setPlayingPromptText(text);
    };

    utterance.onend = () => {
      setPlayingPromptText(null);
    };

    utterance.onerror = () => {
      setPlayingPromptText(null);
    };

    synth.speak(utterance);
  };

  const stopSampleAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingPromptText(null);
  };

  // 🎯 NGUỒN CHỦ ĐỀ
  const [topicOrigin, setTopicOrigin] = useState<TopicOrigin>('TEACHER_DASHBOARD');

  // 🎯 2 CHẾ ĐỘ: ĐỌC CÂU MẪU vs TỰ NÓI PHẢN XẠ
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('READ_SAMPLE');

  // 🎯 DỮ LIỆU FORM DÁN TẠI CHỖ
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

  // 🎧 Thanh phát lại ghi âm
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Anti-Cheat khi làm bài giáo viên
  const [isTeacherExamining, setIsTeacherExamining] = useState<boolean>(false);

  // Modal chi tiết
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
              contextDesc: item.description || `🏫 Nhiệm vụ phản xạ (${detectedTier}):`,
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
    return () => stopSampleAudio();
  }, []);

  // Lọc bài tập trực tiếp từ state `allChallenges` để hiển thị đề mới sinh ra ngay lập tức
  const getDisplayChallenges = () => {
    if (topicOrigin === 'TEACHER_DASHBOARD') {
      return teacherAssignments.filter(
        item => item.tier === selectedTier && item.level === selectedLevel
      );
    }
    return allChallenges.filter(
      item => item.tier === selectedTier && item.level === selectedLevel
    );
  };

  const currentDisplayList = getDisplayChallenges();

  // 🤖 HÀM GỌI GROQ AI SINH CHỦ ĐỀ PHẢN XẠ MỚI ĐÚNG THEO 3 THỂ THỨC SƯ PHẠM
  const generateNewAiChallenge = async (): Promise<ChallengeItem | null> => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      if (!apiKey) return null;

      const promptInstruction = `You are an expert English speaking examiner designing realistic situational challenges for Station 2 at CEFR level ${selectedLevel} in tier ${selectedTier}.
Rules for tiers:
- Tier SOLO: Individual situational reflex. Provide an unexpected realistic situation/question where the student must respond promptly on their own.
- Tier RELAY: Two-person relay speaking on the same topic. Provide a statement from Partner A, and create the responsive continuation sentence/idea for Partner B.
- Tier ROLEPLAY: Two-person roleplay dialogue resolving a conflict or practical negotiation (e.g., customer - staff, interviewer - candidate, client - manager).
Respond ONLY with a JSON object in this exact format (no markdown code fences, no extra text):
{
  "title": "Short title in Vietnamese",
  "contextDesc": "Context description in Vietnamese explaining the situation or partner statement",
  "prompt": "The exact natural spoken English response or model answer for this challenge"
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
      console.warn("Lỗi sinh đề từ AI:", err);
      return null;
    }
  };

  // 🔄 ĐỔI SANG CHỦ ĐỀ KHÁC TRONG PHÒNG THU
  const handleSwitchToNextTopic = async () => {
    stopSampleAudio();
    setIsGeneratingAiTopic(true);

    const newAiTopic = await generateNewAiChallenge();
    if (newAiTopic) {
      setAllChallenges(prev => [newAiTopic, ...prev]);
      setSelectedChallenge(newAiTopic);
      setRecordedAudioUrl(null);
      setNormalTimer(0);
      setIsRecordingNormal(false);
      setIsGeneratingAiTopic(false);
      return;
    }

    const list = getDisplayChallenges();
    if (list.length > 0) {
      const otherList = list.filter(item => item.id !== selectedChallenge?.id);
      const pool = otherList.length > 0 ? otherList : list;
      const nextChallenge = pool[Math.floor(Math.random() * pool.length)];

      setSelectedChallenge(nextChallenge);
      setRecordedAudioUrl(null);
      setNormalTimer(0);
      setIsRecordingNormal(false);

      if (normalAnimFrameRef.current) cancelAnimationFrame(normalAnimFrameRef.current);
      if (normalMediaRecorderRef.current && normalMediaRecorderRef.current.state === 'recording') {
        try { normalMediaRecorderRef.current.stop(); } catch (e) {}
      }
    }
    setIsGeneratingAiTopic(false);
  };

  // 🎲 BỐC HOẶC TẠO CHỦ ĐỀ MỚI BẰNG AI VÀ HIỂN THỊ NGAY
  const handlePickRandomTopic = async () => {
    stopSampleAudio();
    setIsGeneratingAiTopic(true);

    const newAiTopic = await generateNewAiChallenge();
    if (newAiTopic) {
      setAllChallenges(prev => [newAiTopic, ...prev]);
      if (topicOrigin === 'TEACHER_DASHBOARD') {
        setTeacherAssignments(prev => [newAiTopic, ...prev]);
      }
      handleSelectChallenge(newAiTopic);
      setIsGeneratingAiTopic(false);
      return;
    }

    const list = getDisplayChallenges();
    if (list.length > 0) {
      const otherList = list.filter(item => item.id !== selectedChallenge?.id);
      const pool = otherList.length > 0 ? otherList : list;
      const randomIndex = Math.floor(Math.random() * pool.length);
      handleSelectChallenge(pool[randomIndex]);
    } else {
      Alert.alert("Thông báo", "Chưa có đề trong danh mục này.");
    }
    setIsGeneratingAiTopic(false);
  };

  const handleStartCustomTopic = () => {
    stopSampleAudio();
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
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA (3 TẦNG ĐẤU PHẢN XẠ)</Text>
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

            {/* 2. CHỌN 2 NÚT CHẾ ĐỘ */}
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
                ? '👉 Nhìn toàn văn câu phản xạ mẫu và bấm nghe giọng đọc mẫu để luyện phản xạ ngữ điệu chuẩn.'
                : '👉 Tự do phản xạ theo tình huống được giao; không hiển thị văn bản mẫu để hỗ trợ.'}
            </Text>

            {/* 3. BỘ CHỌN 3 TẦNG ĐẤU */}
            <Text style={styles.sectionHeaderLabel}>3. CHỌN TẦNG THI ĐẤU PHẢN XẠ:</Text>
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

            {/* 🔄 NÚT CHUYỂN CHỦ ĐỀ MỚI - TỰ ĐỘNG TẠO ĐỀ MỚI HOÀN TOÀN BẰNG AI */}
            {topicOrigin !== 'STUDENT_CUSTOM' && (
              <View style={{ width: '100%', marginVertical: 8 }}>
                <TouchableOpacity 
                  style={[styles.prominentSwitchBtn, isGeneratingAiTopic && { opacity: 0.6 }]} 
                  activeOpacity={0.7}
                  disabled={isGeneratingAiTopic}
                  onPress={handlePickRandomTopic}
                >
                  {isGeneratingAiTopic ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#00FFFF" />
                      <Text style={styles.prominentSwitchBtnText}>⚡ AI ĐANG SOẠN TÌNH HUỐNG MỚI...</Text>
                    </View>
                  ) : (
                    <Text style={styles.prominentSwitchBtnText}>
                      🎲 AI ĐỔI SANG TÌNH HUỐNG PHẢN XẠ MỚI NGAY
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

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
                  {practiceMode === 'READ_SAMPLE' ? 'Câu phản xạ mẫu tiếng Anh cần luyện đọc (*):' : 'Câu hỏi / Tình huống phản xạ tiếng Anh (*):'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder={
                    practiceMode === 'READ_SAMPLE'
                      ? 'Dán câu tiếng Anh mẫu chuẩn để luyện phản xạ...'
                      : 'Dán câu hỏi hoặc tình huống để bạn tự do phản xạ...'
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
                  {loadingAssignments && <ActivityIndicator size="small" color="#00FFFF" />}
                </View>

                {currentDisplayList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      {topicOrigin === 'TEACHER_DASHBOARD'
                        ? 'Chưa có bài tập nào được giao từ Dashboard Giảng viên cho Tầng và Cấp độ này.\n👉 Bạn có thể chuyển sang tab "TỰ DÁN ĐỀ TẠI CHỖ" hoặc "ĐỀ MẪU HỆ THỐNG" để luyện tập ngay!'
                        : 'Không có bài mẫu cho bộ lọc này.'}
                    </Text>
                  </View>
                ) : (
                  currentDisplayList.map((item) => {
                    const isItemPlaying = playingPromptText === item.prompt;
                    return (
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
                            <View style={styles.sampleHeaderRow}>
                              <Text style={styles.previewPromptLabel}>📖 Câu phản xạ mẫu cần luyện:</Text>
                              <TouchableOpacity 
                                style={[styles.ttsMiniBtn, isItemPlaying && styles.ttsMiniBtnActive]} 
                                activeOpacity={0.7}
                                onPress={() => playSampleAudio(item.prompt)}
                              >
                                <Text style={[styles.ttsMiniBtnText, isItemPlaying && { color: '#FFF' }]}>
                                  {isItemPlaying ? '⏹ ĐANG ĐỌC...' : '🔊 NGHE MẪU'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.previewPromptText}>"{item.prompt}"</Text>
                          </View>
                        ) : (
                          <View style={styles.freeSpeechHintBox}>
                            <Text style={styles.freeSpeechHintLabel}>⚡ THỬ THÁCH TỰ NÓI PHẢN XẠ 100%:</Text>
                            <Text style={styles.freeSpeechHintText}>
                              Không có câu mẫu trợ giúp! Hãy đọc kỹ bối cảnh trên và tự do suy nghĩ để trình bày phản xạ của bạn.
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
                    );
                  })
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
                {topicOrigin !== 'STUDENT_CUSTOM' && (
                  <TouchableOpacity 
                    style={[styles.switchTopicInRoomBtn, isGeneratingAiTopic && { opacity: 0.6 }]} 
                    activeOpacity={0.7} 
                    disabled={isGeneratingAiTopic}
                    onPress={handleSwitchToNextTopic}
                  >
                    {isGeneratingAiTopic ? (
                      <ActivityIndicator size="small" color="#00FFFF" />
                    ) : (
                      <Text style={styles.switchTopicInRoomText}>🔄 ĐỔI TÌNH HUỐNG KHÁC</Text>
                    )}
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
                  <Text style={styles.promptModeNotice}>📖 CÂU PHẢN XẠ MẪU CẦN ĐỌC CHUẨN:</Text>
                  <TouchableOpacity 
                    style={[styles.ttsPlayBtn, playingPromptText === selectedChallenge.prompt && styles.ttsPlayBtnActive]} 
                    activeOpacity={0.7}
                    onPress={() => playSampleAudio(selectedChallenge.prompt)}
                  >
                    <Text style={[styles.ttsPlayBtnText, playingPromptText === selectedChallenge.prompt && { color: '#FFF' }]}>
                      {playingPromptText === selectedChallenge.prompt ? '⏹ DỪNG GIỌNG ĐỌC' : '🔊 NGHE GIỌNG ĐỌC MẪU'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.promptDisplayText}>{selectedChallenge.prompt}</Text>
                <Text style={styles.ttsGuideHint}>
                  💡 Bấm nút nghe mẫu bên trên để bắt chước ngữ điệu phản xạ tự nhiên trước khi thu âm!
                </Text>
              </View>
            ) : (
              <View style={[styles.promptDisplayBox, { borderColor: '#39FF14', backgroundColor: '#07180D' }]}>
                <Text style={[styles.promptModeNotice, { color: '#39FF14' }]}>
                  ⚡ BẠN ĐANG THI PHẢN XẠ ĐỘC LẬP (KHÔNG CÓ GỢI Ý CÂU CHỮ):
                </Text>
                <Text style={[styles.promptDisplayText, { fontSize: 13, color: '#88FFBB', fontWeight: 'bold' }]}>
                  Hãy tập trung toàn bộ vào bối cảnh nhiệm vụ phía trên. Bấm nút bắt đầu và tự nói câu trả lời bằng tiếng Anh theo phản xạ của bạn!
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

  prominentSwitchBtn: {
    backgroundColor: '#1E0B36',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00FFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prominentSwitchBtnText: {
    color: '#00FFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  sampleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ttsPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E0B36',
    borderWidth: 1.5,
    borderColor: '#00FFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ttsPlayBtnActive: {
    backgroundColor: '#FF0055',
    borderColor: '#FF0055',
  },
  ttsPlayBtnText: {
    color: '#00FFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  ttsMiniBtn: {
    backgroundColor: '#1E0B36',
    borderWidth: 1.2,
    borderColor: '#00FFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  ttsMiniBtnActive: {
    backgroundColor: '#FF0055',
    borderColor: '#FF0055',
  },
  ttsMiniBtnText: {
    color: '#00FFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  ttsGuideHint: {
    color: '#FFD700',
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#221144',
    paddingTop: 6,
  },

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

  card: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roleText: { color: '#FFD700', fontSize: 11.5, fontWeight: 'bold', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8.5, fontWeight: '900' },
  contextText: { color: '#FFF', fontSize: 10.5, lineHeight: 16, marginBottom: 8 },
  previewPromptBox: { backgroundColor: '#070212', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#221144' },
  previewPromptLabel: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },
  previewPromptText: { color: '#FFFFFF', fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  freeSpeechHintBox: { backgroundColor: '#07180D', padding: 8, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#39FF14' },
  freeSpeechHintLabel: { color: '#39FF14', fontSize: 8.5, fontWeight: 'bold', marginBottom: 2 },
  freeSpeechHintText: { color: '#88FFBB', fontSize: 9.5, fontStyle: 'italic' },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
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
  promptDisplayText: { color: '#FFFFFF', fontSize: 13.5, lineHeight: 22, fontWeight: 'bold' },
  liveWaveformBox: { marginBottom: 14 },
  liveWaveformLabel: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', marginBottom: 6 },
  startRecordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  startRecordBtnText: { color: '#FFF', fontSize: 11.5, fontWeight: '900' },
  stopRecordBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  stopRecordBtnText: { color: '#000', fontSize: 11.5, fontWeight: '900' }
});