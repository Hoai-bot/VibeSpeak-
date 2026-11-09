// src/screens/Station2Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import * as AntiCheatModule from '../components/AntiCheatSpeakingSession';
import * as DetailedModalModule from '../components/DetailedSpeechFeedbackModal';
import { evaluateSpeechSubmission } from '../utils/speechEvaluator';
import { evaluateSpeaking } from '../services/arena/assessmentService';
import { supabase } from '../utils/supabase';

// 🛡️ TỰ ĐỘNG BÓC TÁCH COMPONENT CHUẨN XÁC DÙ LÀ DEFAULT HAY NAMED EXPORT (CHỐNG LỖI REACT #130)
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

// 🎯 KHO DỮ LIỆU ĐỀ PHẢN XẠ ĐA DẠNG CHO TRẠM 2
const SCENARIO_LIBRARY: Record<string, { title: string; context: string; prompt: string }[]> = {
  'SOLO_A1': [
    { title: "Hỏi thăm đường đến ga tàu điện", context: "Một người nước ngoài hỏi bạn đường đi bộ đến ga tàu điện ngầm gần nhất.", prompt: "Go straight ahead for two blocks, then turn left; the station is next to the bank." },
    { title: "Gọi món ăn trưa mang đi", context: "Bạn vào quán ăn nhanh và gọi 1 phần cơm gà cùng một chai nước suối.", prompt: "Hello, can I please have one chicken rice set to take away and a bottle of mineral water?" },
    { title: "Nhờ người lạ xem giờ", context: "Điện thoại của bạn bị hết pin, bạn nhờ một người bên cạnh xem giúp mấy giờ.", prompt: "Excuse me, my phone battery is completely dead. Do you happen to have the time?" },
    { title: "Xin lỗi vì đến lớp trễ", context: "Bạn bước vào lớp trễ 10 phút vì xe hỏng xăm, giải thích ngắn gọn với thầy cô.", prompt: "I sincerely apologize for being late today, teacher; my motorbike had a flat tire on the way." },
    { title: "Hỏi giá chiếc áo khoác", context: "Bạn đang trong cửa hàng quần áo và muốn hỏi giá chiếc áo gió màu xanh.", prompt: "Excuse me, could you tell me how much this blue jacket costs?" },
    { title: "Giới thiệu món Phở Việt Nam", context: "Người bạn nước ngoài hỏi nên thử món ăn truyền thống nào đầu tiên tại Hà Nội.", prompt: "You definitely should try traditional Beef Pho with fresh herbs; it is absolutely delicious." },
    { title: "Hỏi mượn bút chì trong giờ học", context: "Bút bi của bạn bị hết mực giữa giờ kiểm tra, hãy hỏi bạn cùng bàn.", prompt: "Excuse me, my pen ran out of ink. Could I borrow an extra pencil from you?" }
  ],
  'SOLO_A2': [
    { title: "Từ chối lời mời tiệc cuối tuần", context: "Đồng nghiệp rủ bạn đi uống bia tối thứ Bảy nhưng bạn phải về quê thăm ông bà.", prompt: "I would really love to join, but I have already promised to visit my grandparents this weekend." },
    { title: "Phản ánh món ăn bị nguội", context: "Đĩa mì xào vừa mang ra bị nguội ngắt, bạn gọi nhân viên phục vụ hỗ trợ lịch sự.", prompt: "Excuse me, my noodles are quite cold. Could you please ask the kitchen to heat them up for me?" },
    { title: "Hỏi đổi kích cỡ giày", context: "Đôi giày bạn thử bị chật mũi ngón chân, bạn hỏi nhân viên xem có cỡ lớn hơn không.", prompt: "These shoes feel a bit tight around my toes. Do you have this model in a half size larger?" },
    { title: "Hỏi lịch xe buýt tuyến cuối", context: "Bạn hỏi nhân viên phòng vé xem chuyến xe buýt số 150 cuối cùng trong ngày chạy lúc mấy giờ.", prompt: "Good evening, could you tell me when the last bus number one hundred and fifty departs tonight?" },
    { title: "Hỏi về phụ phí dịch vụ", context: "Hóa đơn thanh toán tại quán ăn xuất hiện khoản phụ thu lạ, bạn hỏi nhân viên phục vụ.", prompt: "Excuse me, could you please clarify what this additional service charge on my receipt is for?" }
  ],
  'SOLO_B1': [
    { title: "Chất vấn chi phí triển khai dự án", context: "Trong buổi thuyết trình, khán giả hỏi giải pháp của nhóm có quá tốn kém kinh phí ban đầu không.", prompt: "While initial setup requires significant investment, operational savings over six months will completely offset the costs." },
    { title: "Thương lượng chia lại đầu việc nhóm", context: "Bạn nhận thấy khối lượng công việc phân bổ chưa đều, đề xuất trưởng nhóm chia lại công bằng.", prompt: "I propose we redistribute the technical research workload so that every team member contributes equally." },
    { title: "Giải trình nộp bài tập muộn", context: "Máy tính xách tay bị lỗi ổ cứng đột ngột lúc đang nộp luận văn, bạn gửi email giải trình.", prompt: "My computer suffered an unexpected drive failure an hour before the deadline; please find my verified draft attached." },
    { title: "Phỏng vấn: Điểm yếu cần khắc phục", context: "Nhà tuyển dụng hỏi về điểm yếu lớn nhất của bạn trong công việc và cách cải thiện.", prompt: "I sometimes focus excessively on minor details, so I now use time-blocking tools to maintain perspective on core milestones." },
    { title: "Từ chối yêu cầu làm việc ngoài giờ", context: "Quản lý nhờ bạn làm thêm vào tối Chủ Nhật nhưng bạn đã đăng ký lịch thi chứng chỉ ngoại ngữ.", prompt: "I am unable to cover the Sunday shift because I have a mandatory international certification examination scheduled." },
    { title: "Phản ánh tiến độ giao hàng chậm", context: "Gói quà sinh nhật đặt hỏa tốc bị trễ 2 ngày mà không có thông báo từ đơn vị vận chuyển.", prompt: "I specifically paid for priority delivery; could you investigate why my parcel has been delayed for two days without update?" },
    { title: "Thương lượng giá phòng trọ", context: "Chủ nhà thông báo tăng tiền điện 20%, bạn đại diện các bạn cùng phòng xin xem xét lại.", prompt: "A twenty percent increase is substantial for our student budget; could we negotiate a more moderate adjustment?" }
  ],
  'SOLO_B2': [
    { title: "Thương thuyết dời hạn giao sản phẩm", context: "Khách hàng muốn bàn giao trước 1 tuần, bạn phải giải thích nguy cơ rủi ro bảo mật hệ thống.", prompt: "Accelerating deployment by a full week severely constrains our security audit cycle, risking critical vulnerabilities." },
    { title: "Tranh biện về làm việc từ xa (Remote Work)", context: "Phản hồi câu hỏi liệu chế độ làm việc từ xa có làm giảm tính gắn kết văn hóa doanh nghiệp.", prompt: "Remote arrangements enhance personal autonomy, yet preserving institutional cohesion requires structured hybrid sync points." },
    { title: "Giải quyết bất đồng chiến lược marketing", context: "Bạn thuyết phục ban giám đốc chuyển 40% ngân sách quảng cáo truyền thống sang các kênh TikTok.", prompt: "Legacy print advertising no longer yields measurable conversion; reallocating forty percent toward short-form video delivers targeted ROI." },
    { title: "Từ chối tính năng phát sinh (Scope Creep)", context: "Khách hàng yêu cầu bổ sung 3 tính năng mới ngay trước thềm phát hành bản thử nghiệm.", prompt: "Incorporating additional scope at this stage threatens timeline integrity; we recommend scheduling these enhancements for phase two." }
  ],
  'SOLO_C1': [
    { title: "Xử lý khủng hoảng rò rỉ dữ liệu", context: "Là phát ngôn viên doanh nghiệp, phản hồi báo chí về tin đồn cơ sở dữ liệu khách hàng bị tấn công.", prompt: "Our incident response teams have isolated the perimeter, engaged third-party forensic auditors, and will provide transparent hourly updates." },
    { title: "Phản biện chính sách thuế carbon", context: "Tranh luận về việc áp thuế môi trường lên các nhà máy sản xuất linh kiện trong ngắn hạn.", prompt: "Unilateral fiscal penalties risk precipitating industrial offshoring unless coupled with domestic green technology tax credits." }
  ],
  'SOLO_C2': [
    { title: "Tranh biện đạo đức AI trong tư pháp", context: "Bình luận trước hội đồng khoa học về việc thuật toán thay thế thẩm phán đưa ra phán quyết.", prompt: "Algorithmic adjudication merely optimizes for historical empirical precedents, thereby formalizing systemic biases under the guise of neutrality." }
  ],
  'RELAY_A1': [
    { title: "Tiếp sức: Kế hoạch tiệc chia tay", context: "Bạn A: 'We should buy pizza and drinks.' -> Bạn B tiếp sức nối ý trang trí và âm nhạc.", prompt: "Great idea! I can bring some speakers and paper lanterns to decorate the patio." },
    { title: "Tiếp sức: Hoạt động cuối tuần", context: "Bạn A: 'I plan to ride my bicycle in the morning.' -> Bạn B tiếp sức nối ý hoạt động buổi chiều.", prompt: "Sounds refreshing! Afterward, we can visit the public library to study for next week's quiz." }
  ],
  'RELAY_B1': [
    { title: "Tiếp sức: Chiến dịch truyền thông sự kiện", context: "Bạn A: 'Short video clips will grab student attention on Facebook.' -> Bạn B tiếp sức nối ý minigame quà tặng.", prompt: "Building directly upon that, we could host a weekly live giveaway session to drive organic viral engagement." },
    { title: "Tiếp sức: Giảm rác thải nhựa tại căng-tin", context: "Bạn A: 'The cafeteria must stop using disposable plastic cups.' -> Bạn B tiếp sức đề xuất giảm giá cho bình cá nhân.", prompt: "To make that policy effective, the administration should offer a ten percent discount for anyone bringing reusable tumblers." },
    { title: "Tiếp sức: Quản lý thời gian học tập", context: "Bạn A: 'Using digital calendar alerts prevents missing deadlines.' -> Bạn B tiếp sức phương pháp chia nhỏ nhiệm vụ.", prompt: "Additionally, breaking massive assignments into thirty-minute task intervals minimizes procrastination and mental exhaustion." }
  ],
  'RELAY_B2': [
    { title: "Tiếp sức: Triển khai mô hình xe điện đô thị", context: "Bạn A: 'Subsidizing electric motorbikes directly curbs urban emissions.' -> Bạn B tiếp sức hạ tầng trạm sạc & pin.", prompt: "Crucially, municipal planners must simultaneously expand standardized battery-swapping stations across major transit corridors." },
    { title: "Tiếp sức: Tối ưu hóa chuỗi cung ứng linh kiện", context: "Bạn A: 'Relying exclusively on overseas suppliers creates fragile bottlenecks.' -> Bạn B tiếp sức mô hình đối tác vệ tinh nội địa.", prompt: "Consequently, onboarding localized secondary vendors provides an essential operational buffer against geopolitical logistics halts." }
  ],
  'ROLEPLAY_A1': [
    { title: "Nhập vai: Gọi món tại quán ăn nhanh", context: "Bạn là khách muốn gọi combo gà rán, nước suối và hỏi thanh toán qua mã QR.", prompt: "Hello, can I please order a fried chicken combo and pay using a mobile QR transfer?" },
    { title: "Nhập vai: Mua vé xem phim rạp", context: "Bạn là khách muốn mua 2 vé xem phim ca tối và hỏi chính sách vé ưu đãi cho sinh viên.", prompt: "Good afternoon, could I get two student tickets for the seven PM show with my university card?" }
  ],
  'ROLEPLAY_A2': [
    { title: "Nhập vai: Đổi kích cỡ áo quần", context: "Áo sơ mi mua hôm qua bị chật vai, mang hóa đơn đến xin đổi sang Size L.", prompt: "Good morning, I bought this shirt yesterday but it feels tight around my shoulders. Can I exchange it for a large?" },
    { title: "Nhập vai: Gửi hành lý tại lễ tân", context: "Bạn trả phòng lúc 12h trưa nhưng muốn gửi lại 2 vali đến 17h chiều để đi dạo.", prompt: "I am checking out now. Is it possible to leave our two suitcases at the reception until five PM?" }
  ],
  'ROLEPLAY_B1': [
    { title: "Nhập vai: Đổi đồ uống gấp tại sân bay", context: "Gọi trà đào đá nhưng nhận nhầm cà phê nóng, chuyến bay sắp cất cánh trong 10 phút.", prompt: "Excuse me, I ordered an iced peach tea, but I received hot cappuccino. Could you replace it quickly as my flight boards soon?" },
    { title: "Nhập vai: Xin gia hạn nộp bài tập lớn", context: "Máy chủ nhóm bị hỏng ổ cứng, bạn đại diện gặp giảng viên xin dời hạn nộp 24 giờ.", prompt: "Dear Professor, our team experienced an unexpected hardware crash last night. May we respectfully request a twenty-four hour extension?" },
    { title: "Nhập vai: Phàn nàn tiếng ồn khách sạn", context: "Phòng bên cạnh tiệc tùng gây ồn suốt đêm, bạn yêu cầu quản lý bồi hoàn thỏa đáng.", prompt: "The neighboring room held a loud party until four AM without intervention; I believe a concession on our final bill is warranted." }
  ],
  'ROLEPLAY_B2': [
    { title: "Nhập vai: Trưởng dự án & Khách hàng phản ánh tiến độ", context: "Khách hàng bức xúc vì tính năng báo cáo bị chậm 3 ngày, bạn đàm phán bàn giao từng phần.", prompt: "We acknowledge the module delay; to keep your team operating, we can deploy the core data export feature this afternoon." },
    { title: "Nhập vai: Ứng viên & Nhà tuyển dụng thương lượng lương", context: "Công ty đề xuất mức lương thấp hơn kỳ vọng 15%, bạn lập luận kinh nghiệm để thuyết phục.", prompt: "Given my direct experience managing similar cross-platform deployments, a ten percent upward adjustment accurately reflects the immediate value I deliver." }
  ],
  'ROLEPLAY_C1': [
    { title: "Nhập vai: Quản lý khách sạn 5 sao & Khách VIP khiếu nại", context: "Điều hòa phòng Tổng thống gặp sự cố lúc nửa đêm trước hội nghị, bạn xử lý khủng hoảng.", prompt: "I sincerely apologize for this disruption. I will personally arrange an immediate transfer to our Presidential Penthouse with all services comped." }
  ]
};

const CONTEXT_VARIANTS = [
  "Thời gian gấp gáp trong vòng 3 phút",
  "Đối phương đang tỏ thái độ không hài lòng",
  "Tình huống diễn ra trong buổi họp trực tuyến",
  "Bối cảnh diễn ra tại văn phòng đối tác quốc tế",
  "Yêu cầu phản xạ dứt khoát không ngập ngừng",
  "Đối tác yêu cầu cam kết cụ thể bằng văn bản ngay",
  "Thời điểm diễn ra vào cuối giờ làm việc mệt mỏi",
  "Có sự hiện diện của giám đốc cấp cao theo dõi"
];

const createProceduralScenario = (tier: Station2Tier, level: CefrLevel, index: number): ChallengeItem => {
  const key = `${tier}_${level}`;
  const list = SCENARIO_LIBRARY[key] || SCENARIO_LIBRARY['SOLO_B1'];
  const base = list[index % list.length];
  const variant = CONTEXT_VARIANTS[index % CONTEXT_VARIANTS.length];
  const caseNum = Math.floor(index / list.length) + 1;

  return {
    id: `dynamic_${tier}_${level}_${index}_${Date.now()}`,
    tier,
    level,
    title: caseNum > 1 ? `${base.title} (Trường hợp #${caseNum})` : base.title,
    contextDesc: `${base.context} [Lưu ý: ${variant}].`,
    prompt: base.prompt,
    isTeacherAssigned: false
  };
};

const getSupportedAudioMimeType = (): { mimeType: string; extension: string } => {
  if (typeof window === 'undefined' || !(window as any).MediaRecorder) {
    return { mimeType: '', extension: 'webm' };
  }
  const MediaRecorderClass = (window as any).MediaRecorder;

  if (typeof MediaRecorderClass.isTypeSupported === 'function') {
    if (MediaRecorderClass.isTypeSupported('audio/webm;codecs=opus')) {
      return { mimeType: 'audio/webm;codecs=opus', extension: 'webm' };
    }
    if (MediaRecorderClass.isTypeSupported('audio/webm')) {
      return { mimeType: 'audio/webm', extension: 'webm' };
    }
    if (MediaRecorderClass.isTypeSupported('audio/mp4')) {
      return { mimeType: 'audio/mp4', extension: 'mp4' };
    }
    if (MediaRecorderClass.isTypeSupported('audio/aac')) {
      return { mimeType: 'audio/aac', extension: 'aac' };
    }
    if (MediaRecorderClass.isTypeSupported('audio/ogg')) {
      return { mimeType: 'audio/ogg', extension: 'ogg' };
    }
  }

  return { mimeType: '', extension: 'webm' };
};

export default function Station2Screen({ onBack }: Props) {
  const [selectedTier, setSelectedTier] = useState<Station2Tier>('ROLEPLAY');
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1');
  const [teacherAssignments, setTeacherAssignments] = useState<ChallengeItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);

  // 🎯 QUẢN LÝ ĐỀ BÀI VÀ HÀNG ĐỢI NẠP BÙ AI NGẦM
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeItem>(() => {
    return createProceduralScenario('ROLEPLAY', 'B1', 0);
  });
  const [topicIndex, setTopicIndex] = useState<number>(0);
  const [aiQueue, setAiQueue] = useState<ChallengeItem[]>([]);
  const isFetchingAiRef = useRef<boolean>(false);

  // Quản lý Text-To-Speech
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
      stopSampleAudio();
    };
  }, []);

  const getBestNaturalVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const androidVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google US English') || v.name.includes('Network') || v.voiceURI.includes('en-us-x'))
    );
    if (androidVoice) return androidVoice;

    const iosVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Siri') || v.name.includes('Samantha') || v.name.includes('Nicky') || v.name.includes('Aaron'))
    );
    if (iosVoice) return iosVoice;

    const desktopVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Jenny') || v.name.includes('Guy') || v.name.includes('Aria'))
    );
    if (desktopVoice) return desktopVoice;

    return voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || null;
  };

  const stopSampleAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingSample(false);
  };

  const playNaturalTTS = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      Alert.alert("Lỗi âm thanh", "Trình duyệt không hỗ trợ Text-to-Speech");
      return;
    }
    const synth = window.speechSynthesis;

    if (isPlayingSample) {
      synth.cancel();
      setIsPlayingSample(false);
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
  const [evaluatingStatus, setEvaluatingStatus] = useState<string>('⚡ AI ĐANG PHÂN TÍCH PHÁT ÂM & CHẤM ĐIỂM CHI TIẾT...');
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

  useEffect(() => {
    if (topicOrigin === 'TEACHER_DASHBOARD') {
      const filtered = teacherAssignments.filter(t => t.tier === selectedTier && t.level === selectedLevel);
      if (filtered.length > 0) {
        setCurrentChallenge(filtered[0]);
        return;
      }
    }
    const fresh = createProceduralScenario(selectedTier, selectedLevel, 0);
    setCurrentChallenge(fresh);
    setTopicIndex(0);
    setAiQueue([]);
  }, [selectedTier, selectedLevel, topicOrigin]);

  const triggerBackgroundAiRefill = async (tier: Station2Tier, level: CefrLevel) => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey || isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      const promptInstruction = `Create 1 UNIQUE situational reflex challenge for Station 2 at CEFR level ${level} in tier ${tier}.
- SOLO: Individual unexpected reflex situation.
- RELAY: Two-person relay continuation on the same topic.
- ROLEPLAY: Realistic interpersonal conflict resolution between 2 people.
Output ONLY raw JSON:
{"title": "Short title in Vietnamese", "contextDesc": "Context description in Vietnamese", "prompt": "Natural spoken English sentence"}`;

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
        const newAiItem: ChallengeItem = {
          id: `ai_${Date.now()}_${Math.random()}`,
          tier,
          level,
          title: `🤖 [AI MỚI] ${content.title}`,
          contextDesc: content.contextDesc,
          prompt: content.prompt,
          isTeacherAssigned: false,
        };
        setAiQueue(prev => [...prev, newAiItem]);
      }
    } catch (e) {
      console.warn("AI ngầm tạm dừng:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  const handleNextTopic = () => {
    stopSampleAudio();
    const nextIdx = topicIndex + 1;
    setTopicIndex(nextIdx);

    if (aiQueue.length > 0) {
      const [aiItem, ...remainingQueue] = aiQueue;
      setAiQueue(remainingQueue);
      setCurrentChallenge(aiItem);
      triggerBackgroundAiRefill(selectedTier, selectedLevel);
      return;
    }

    const freshPreset = createProceduralScenario(selectedTier, selectedLevel, nextIdx);
    setCurrentChallenge(freshPreset);
    triggerBackgroundAiRefill(selectedTier, selectedLevel);
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

  const startNormalRecording = async () => {
    stopSampleAudio();
    try {
      normalAudioChunksRef.current = [];
      normalPitchHistoryRef.current = [];
      setNormalTimer(0);
      setLiveTranscript('');
      liveTranscriptRef.current = '';

      // 🎯 TỐI ƯU HÓA PAYLOAD: Thu mono 1 channel, mẫu 16kHz chuẩn ASR giúp giảm 70% dung lượng
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1, 
          sampleRate: 16000, 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } 
      });
      
      const detectedFormat = getSupportedAudioMimeType();
      activeMimeTypeRef.current = detectedFormat;

      // 🎯 TỐI ƯU BITRATE: Ép bitrate ~32kbps vừa đủ nét cho Whisper mà payload siêu nhẹ (chỉ ~15-20KB cho câu 5s)
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

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event: any) => {
            let live = '';
            for (let i = 0; i < event.results.length; i++) {
              live += event.results[i][0].transcript + ' ';
            }
            const cleanLive = live.trim();
            liveTranscriptRef.current = cleanLive;
            setLiveTranscript(cleanLive);
          };
          recognition.onerror = () => {};
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition bypassed on mobile:", e);
        }
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

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
      Alert.alert("Lỗi Micro", "Không thể truy cập microphone. Vui lòng cấp quyền micro trong trình duyệt.");
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
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (normalAnimFrameRef.current) cancelAnimationFrame(normalAnimFrameRef.current);
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

  // 🎯 BỘ CHẤM ĐIỂM CHÍNH XÁC: ĐÃ TỐI ƯU HÓA BITRATE + CƠ CHẾ RETRY THÔNG BÁO MẠNG
  const finishSubmissionAndEvaluate = async (audioBlob: Blob, pitchHistory: number[], localAudioUrl?: string) => {
    setIsEvaluating(true);
    setEvaluatingStatus('⚡ AI ĐANG PHÂN TÍCH PHÁT ÂM & BÓC TÁCH TAPESCRIPT...');

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

    // 🌟 BƯỚC 1: CƠ CHẾ RETRY KHI MẠNG CHẬP CHỜN (THỬ LẠI TỐI ĐA 2 LẦN VỚI THÔNG BÁO RÕ RÀNG)
    const MAX_RETRIES = 2;
    let attempt = 0;
    let success = false;

    while (attempt <= MAX_RETRIES && !success) {
      try {
        if (attempt > 0) {
          setEvaluatingStatus(`🔄 Đang thử kết nối lại máy chủ chấm điểm (lần ${attempt}/${MAX_RETRIES})...`);
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
        console.warn(`Lỗi gọi evaluateSpeaking lần ${attempt}:`, err);
      }
    }

    // ⚠️ NẾU MẤT MẠNG HOÀN TOÀN: Báo lỗi để học viên bấm 'Thử lại' thay vì ghim điểm 58
    if (!success && (!actualTranscript || actualTranscript.length < 3)) {
      setIsEvaluating(false);
      Alert.alert(
        "Mất kết nối máy chủ chấm điểm",
        "Đường truyền mạng bị gián đoạn nên AI chưa nhận được bài thu âm. Bản thu của bạn vẫn được giữ nguyên, hãy kiểm tra wifi/4G và bấm 'Thử chấm lại'!",
        [
          { text: "Để sau", style: "cancel" },
          { 
            text: "🔄 Thử chấm lại", 
            onPress: () => finishSubmissionAndEvaluate(audioBlob, pitchHistory, localAudioUrl) 
          }
        ]
      );
      return;
    }

    // 🌟 BƯỚC 2: CHẤM ĐIỂM PHÂN HÓA THEO TAPESCRIPT ĐÃ NHẬN DIỆN THỰC TẾ
    setEvaluatingStatus('📊 Đang tổng hợp phổ điểm phát âm và ngữ điệu...');
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
        evaluated.totalScore = Math.round((evaluated.totalScore + evaluated.spontaneityScore) / 2);
      }
    }

    // Cân bằng với điểm AI server nếu có
    if (serverEvalData?.score && actualTranscript) {
      evaluated.totalScore = Math.round((evaluated.totalScore + serverEvalData.score) / 2);
      if (serverEvalData.criteria?.pronunciation) {
        evaluated.rubrics.pronunciation.score = serverEvalData.criteria.pronunciation;
      }
    }

    // 🌟 BƯỚC 3: LƯU BÀI NỘP LÊN SUPABASE
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

        const { data: authUser } = await supabase.auth.getUser();
        await supabase.from('submissions').insert([{
          student_name: authUser?.user?.user_metadata?.full_name || 'Học viên Trạm 2',
          student_code: authUser?.user?.email?.split('@')[0] || 'STU_S2',
          class_name: `Trạm 2: ${selectedTier} (${selectedLevel}) [${practiceMode === 'READ_SAMPLE' ? 'Đọc mẫu' : 'Tự do'}]`,
          mode: `STATION_2_${selectedTier}`,
          cefr_level: currentChallenge?.level || selectedLevel,
          score: evaluated.totalScore,
          manual_score: null,
          spontaneity_score: evaluated.spontaneityScore,
          pitch_variance: evaluated.rubrics.intonation.score,
          is_script_suspected: evaluated.isScriptSuspected,
          audio_url: audioUrl,
          transcript: actualTranscript || '(Không nhận diện được giọng nói)',
          feedback: `[Phát âm: ${evaluated.rubrics.pronunciation.score} | Ngữ điệu: ${evaluated.rubrics.intonation.score} | Trôi chảy: ${evaluated.rubrics.fluency.score}]`
        }]);
      }
    } catch (err) {
      console.warn("Lỗi lưu kết quả bài nộp:", err);
    }

    setIsEvaluating(false);
    setFeedbackResult(evaluated);
    setIsTeacherExamining(false);
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

            {/* 🎧 THANH NGHE LẠI BẢN THU */}
            {recordedAudioUrl && !isRecordingNormal && (
              <View style={styles.audioReviewBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.audioReviewTitle}>🎧 BẢN THU ÂM CỦA BẠN (NGHE LẠI):</Text>
                  {feedbackResult && (
                    <TouchableOpacity 
                      style={styles.viewScoreBtn}
                      onPress={() => setDetailedModalVisible(true)}
                    >
                      <Text style={styles.viewScoreBtnText}>📊 XEM LẠI BẢNG ĐIỂM</Text>
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

            {/* 5. GIAO DIỆN TÌNH HUỐNG & NÚT ĐỔI ĐỀ TRỰC QUAN */}
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
                {/* 🔄 NÚT ĐỔI CHỦ ĐỀ MỚI (0MS) */}
                <TouchableOpacity 
                  style={styles.prominentSwitchBtn} 
                  activeOpacity={0.7}
                  onPress={handleNextTopic}
                >
                  <Text style={styles.prominentSwitchBtnText}>
                    🎲 BẤM ĐỂ ĐỔI SANG TÌNH HUỐNG MỚI NGAY (0MS)
                  </Text>
                </TouchableOpacity>

                {/* THẺ TÌNH HUỐNG HIỆN TẠI DUY NHẤT */}
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

                  {practiceMode === 'READ_SAMPLE' ? (
                    <View style={styles.previewPromptBox}>
                      <View style={styles.sampleHeaderRow}>
                        <Text style={styles.previewPromptLabel}>📖 Câu phản xạ mẫu:</Text>
                        <TouchableOpacity 
                          style={[styles.ttsMiniBtn, isPlayingSample && styles.ttsMiniBtnActive]} 
                          activeOpacity={0.7}
                          onPress={() => playNaturalTTS(currentChallenge.prompt)}
                        >
                          <Text style={styles.ttsMiniBtnText}>
                            {isPlayingSample ? '⏹ DỪNG' : '🔊 NGHE MẪU'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.previewPromptText}>"{currentChallenge.prompt}"</Text>
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
                    style={[styles.startBtn, currentChallenge.isTeacherAssigned && { backgroundColor: '#00FFFF' }]}
                    onPress={() => handleEnterRoom(currentChallenge)}
                  >
                    <Text style={[styles.startBtnText, currentChallenge.isTeacherAssigned && { color: '#000' }]}>
                      🎙️ BƯỚC VÀO PHÒNG THU LUYỆN TẬP
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
                {practiceMode === 'READ_SAMPLE' ? '🎙️ PHÒNG THU: ĐỌC THEO CÂU MẪU' : '⚡ PHÒNG THU: TỰ NÓI PHẢN XẠ'}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {topicOrigin !== 'STUDENT_CUSTOM' && (
                  <TouchableOpacity 
                    style={styles.switchTopicInRoomBtn} 
                    activeOpacity={0.7} 
                    onPress={handleNextTopic}
                  >
                    <Text style={styles.switchTopicInRoomText}>🔄 ĐỔI TÌNH HUỐNG KHÁC</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsNormalPracticing(false)}>
                  <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ THOÁT</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.normalPromptTitle}>{currentChallenge.title} ({currentChallenge.level})</Text>
            <Text style={styles.normalPromptDesc}>{currentChallenge.contextDesc}</Text>

            {practiceMode === 'READ_SAMPLE' ? (
              <View style={styles.promptDisplayBox}>
                <View style={styles.sampleHeaderRow}>
                  <Text style={styles.promptModeNotice}>📖 CÂU PHẢN XẠ MẪU:</Text>
                  <TouchableOpacity 
                    style={[styles.ttsPlayBtn, isPlayingSample && styles.ttsPlayBtnActive]} 
                    activeOpacity={0.7}
                    onPress={() => playNaturalTTS(currentChallenge.prompt)}
                  >
                    <Text style={styles.ttsPlayBtnText}>
                      {isPlayingSample ? '⏹ DỪNG ĐỌC' : '🔊 NGHE GIỌNG MẪU'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.promptDisplayText}>{currentChallenge.prompt}</Text>
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

            {/* 🎙️ PHỤ ĐỀ NHẬN DIỆN GIỌNG NÓI TRỰC TIẾP (LIVE SUBTITLE) */}
            {(isRecordingNormal || liveTranscript) && (
              <View style={styles.liveSubtitleBox}>
                <Text style={styles.liveSubtitleLabel}>
                  {isRecordingNormal ? '🎙️ Đang nghe giọng nói của bạn:' : '📝 Văn bản bạn vừa nói:'}
                </Text>
                <Text style={styles.liveSubtitleText}>
                  {liveTranscript || '... (hãy nói vào micro tiếng Anh)'}
                </Text>
              </View>
            )}

            {/* 🎧 THANH NGHE LẠI BẢN THU TRONG PHÒNG THU */}
            {recordedAudioUrl && !isRecordingNormal && (
              <View style={styles.audioReviewBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.audioReviewTitle}>🎧 NGHE LẠI BẢN THU ÂM CỦA BẠN:</Text>
                  {feedbackResult && (
                    <TouchableOpacity 
                      style={styles.viewScoreBtn}
                      onPress={() => setDetailedModalVisible(true)}
                    >
                      <Text style={styles.viewScoreBtnText}>📊 BẢNG ĐIỂM CHI TIẾT</Text>
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
                    <Text style={styles.reopenModalBtnText}>📊 XEM BẢNG ĐIỂM</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.stopRecordBtn} activeOpacity={0.8} onPress={stopNormalRecording}>
                <Text style={styles.stopRecordBtnText}>⏹ DỪNG & CHẤM ĐIỂM CHI TIẾT</Text>
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

      {/* 🛡️ MODAL CHẤM ĐIỂM CHI TIẾT AN TOÀN TRÁNH REACT ERROR #130 */}
      {typeof DetailedSpeechFeedbackModal === 'function' && (
        <DetailedSpeechFeedbackModal
          visible={detailedModalVisible}
          data={feedbackResult}
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

  audioReviewBox: { backgroundColor: '#130628', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#39FF14', marginVertical: 10 },
  audioReviewTitle: { color: '#39FF14', fontSize: 10, fontWeight: '900' },
  viewScoreBtn: { backgroundColor: '#0A2518', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14' },
  viewScoreBtnText: { color: '#39FF14', fontSize: 9, fontWeight: 'bold' },

  normalPracticeCard: { backgroundColor: '#0A0318', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#00FFFF', marginVertical: 10 },
  normalPracticeHeader: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  switchTopicInRoomBtn: { backgroundColor: '#1E0B36', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  switchTopicInRoomText: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },

  normalPromptTitle: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginTop: 8 },
  normalPromptDesc: { color: '#8888AA', fontSize: 10.5, marginBottom: 10 },
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