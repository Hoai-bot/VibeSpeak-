// src/screens/Station2Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AntiCheatSpeakingSession from '../components/AntiCheatSpeakingSession';
import DetailedSpeechFeedbackModal, { DetailedFeedbackData } from '../components/DetailedSpeechFeedbackModal';
import { evaluateSpeechSubmission } from '../utils/speechEvaluator';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type Station2Tier = 'SOLO' | 'RELAY' | 'ROLEPLAY';

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
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(null);

  // Trạng thái thu âm cho chế độ Luyện Tập Tự Do (Bản cũ)
  const [isNormalPracticing, setIsNormalPracticing] = useState<boolean>(false);
  const [isRecordingNormal, setIsRecordingNormal] = useState<boolean>(false);
  const [normalTimer, setNormalTimer] = useState<number>(0);
  const normalMediaRecorderRef = useRef<any>(null);
  const normalAudioChunksRef = useRef<any[]>([]);
  const normalPitchHistoryRef = useRef<number[]>([]);
  const normalAnimFrameRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trạng thái cho chế độ Giáo viên (Anti-Cheat Reflex)
  const [isTeacherExamining, setIsTeacherExamining] = useState<boolean>(false);

  // Modal bảng điểm 6 tiêu chí & sóng âm
  const [detailedModalVisible, setDetailedModalVisible] = useState<boolean>(false);
  const [feedbackResult, setFeedbackResult] = useState<DetailedFeedbackData | null>(null);

  // 1. Tải bài tập của Giảng viên từ database
  const fetchTeacherAssignments = async () => {
    setLoadingAssignments(true);
    try {
      if (supabase) {
        const { data: assignments, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('station_type', 'STATION_2')
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
              contextDesc: `🏫 Nhiệm vụ học phần bắt buộc (${detectedTier}):`,
              prompt: item.target_prompt || '',
              isTeacherAssigned: true // Đánh dấu bài tập do GV giao
            };
          });

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

  // Lọc bài theo Tầng & Bậc
  const filteredChallenges = allChallenges.filter(
    item => item.tier === selectedTier && item.level === selectedLevel
  );

  // 2. Phân luồng khi người dùng bấm vào một bài:
  const handleSelectChallenge = (item: ChallengeItem) => {
    setSelectedChallenge(item);
    if (item.isTeacherAssigned) {
      // 🔒 BÀI TẬP CỦA GIÁO VIÊN: BẬT CHẾ ĐỘ CHỐNG GIAN LẬN ANTI-CHEAT
      setIsTeacherExamining(true);
      setIsNormalPracticing(false);
    } else {
      // 📖 BÀI TỰ LUYỆN TẬP HỆ THỐNG: MỞ PHÒNG THU TỰ DO CỦA BẢN CŨ
      setIsNormalPracticing(true);
      setIsTeacherExamining(false);
      setNormalTimer(0);
      setIsRecordingNormal(false);
    }
  };

  // 3. Xử lý thu âm cho chế độ Luyện tập tự do (Bản cũ)
  const startNormalRecording = async () => {
    try {
      normalAudioChunksRef.current = [];
      normalPitchHistoryRef.current = [];
      setNormalTimer(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new (window as any).MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      normalMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) normalAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecordingNormal(true);

      // Web Audio API để bắt Pitch F0 vẽ trực tiếp lên Canvas
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
        // Autocorrelation tính F0
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
      Alert.alert("Lỗi Micro", "Không thể truy cập micro trên thiết bị của bạn.");
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
        finishSubmissionAndEvaluate(audioBlob, normalPitchHistoryRef.current);
      };
    }
    setIsRecordingNormal(false);
  };

  // Bộ đếm giây cho bản luyện tập thường
  useEffect(() => {
    let timer: any = null;
    if (isRecordingNormal) {
      timer = setInterval(() => setNormalTimer(prev => prev + 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isRecordingNormal]);

  // 4. Hàm chung hoàn tất đánh giá và lưu bài
  const finishSubmissionAndEvaluate = async (audioBlob: Blob, pitchHistory: number[]) => {
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
          class_name: `Trạm 2: ${selectedTier} (${selectedLevel})`,
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
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA (3 TẦNG ĐẤU LIÊN HOÀN)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {!isTeacherExamining && !isNormalPracticing && (
          <>
            {/* THANH 1: BỘ CHỌN 3 TẦNG ĐẤU SƯ PHẠM */}
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

            {/* Banner tóm tắt mục tiêu sư phạm của tầng */}
            <View style={styles.tierInfoBox}>
              <Text style={styles.tierInfoText}>🎯 {currentTierInfo?.desc}</Text>
            </View>

            {/* THANH 2: BỘ CHỌN 6 CẤP ĐỘ CEFR (A1 -> C2) */}
            <View style={styles.levelSelectorContainer}>
              <Text style={styles.levelSelectorLabel}>📊 CHỌN CẤP ĐỘ THỬ THÁCH (CEFR):</Text>
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
            </View>

            {/* Nút xem lại bảng điểm chi tiết 6 tiêu chí & sóng âm */}
            {feedbackResult && (
              <TouchableOpacity 
                style={styles.reopenModalBtn} 
                onPress={() => setDetailedModalVisible(true)}
              >
                <Text style={styles.reopenModalBtnText}>
                  📊 XEM LẠI BẢNG ĐIỂM CHI TIẾT 6 TIÊU CHÍ & SÓNG ÂM ({feedbackResult.totalScore}đ)
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.sectionHeader}>
                🔥 DANH SÁCH THỬ THÁCH [{selectedTier} - BẬC {selectedLevel}]:
              </Text>
              {loadingAssignments && (
                <ActivityIndicator size="small" color="#00FFFF" />
              )}
            </View>

            {filteredChallenges.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có bài tập nào thuộc tầng và bậc này.</Text>
            ) : (
              filteredChallenges.map((item) => (
                <View key={item.id} style={[styles.card, item.isTeacherAssigned && styles.teacherCard]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.roleText, item.isTeacherAssigned && { color: '#00FFFF' }]}>
                      {item.isTeacherAssigned ? '🏫 [BÀI GIẢNG VIÊN GIAO] ' : `${currentTierInfo?.icon} `}{item.title}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                      {item.isTeacherAssigned && (
                        <View style={styles.antiCheatBadge}>
                          <Text style={styles.antiCheatBadgeText}>🔒 CHỐNG ĐỌC</Text>
                        </View>
                      )}
                      <Text style={[styles.levelBadge, item.isTeacherAssigned && { backgroundColor: '#FF007F', color: '#FFF' }]}>
                        {item.level}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.contextText}>{item.contextDesc}</Text>
                  
                  {/* Nếu là bài luyện tập thường: hiện luôn câu mẫu để đọc */}
                  {!item.isTeacherAssigned && (
                    <Text style={styles.previewPromptText}>"{item.prompt}"</Text>
                  )}

                  <TouchableOpacity 
                    style={[styles.startBtn, item.isTeacherAssigned && { backgroundColor: '#00FFFF' }]} 
                    onPress={() => handleSelectChallenge(item)}
                  >
                    <Text style={[styles.startBtnText, item.isTeacherAssigned && { color: '#000' }]}>
                      {item.isTeacherAssigned ? '⚡ BƯỚC VÀO PHÒNG THI (ANTI-CHEAT 5S)' : '🎙️ BẬT PHÒNG THU TỰ DO'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* CHẾ ĐỘ 1: BÀI TỰ LUYỆN TẬP THƯỜNG (BẢN CŨ VỚI SÓNG ÂM TRỰC QUAN) */}
        {/* ========================================================================= */}
        {isNormalPracticing && selectedChallenge && (
          <View style={styles.normalPracticeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.normalPracticeHeader}>🎙️ PHÒNG THU TỰ DO (XEM TRƯỚC VĂN BẢN & SÓNG ÂM)</Text>
              <TouchableOpacity onPress={() => setIsNormalPracticing(false)}>
                <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ THOÁT</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.normalPromptTitle}>{selectedChallenge.title} ({selectedChallenge.level})</Text>
            <Text style={styles.normalPromptDesc}>{selectedChallenge.contextDesc}</Text>

            {/* Văn bản mẫu hiển thị công khai để học viên nhìn và luyện đọc thoải mái */}
            <View style={styles.promptDisplayBox}>
              <Text style={styles.promptDisplayText}>{selectedChallenge.prompt}</Text>
            </View>

            {/* Canvas sóng âm trực tiếp thời gian thực */}
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

            {/* Nút bấm điều khiển thu âm chủ động */}
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

        {/* ========================================================================= */}
        {/* CHẾ ĐỘ 2: BÀI GIẢNG VIÊN GIAO (BẬT CHẾ ĐỘ CHỐNG GIAN LẬN ANTI-CHEAT 5S) */}
        {/* ========================================================================= */}
        {isTeacherExamining && selectedChallenge && (
          <AntiCheatSpeakingSession
            promptText={selectedChallenge.prompt}
            situationPrompt={selectedChallenge.contextDesc}
            prepTimeSeconds={5}
            autoHidePrompt={true}
            onRecordingComplete={(blob, pitches) => finishSubmissionAndEvaluate(blob, pitches)}
            onCancel={() => setIsTeacherExamining(false)}
          />
        )}
      </ScrollView>

      {/* MODAL PHÂN TÍCH SÓNG ÂM & 6 HẠNG MỤC CHẤM ĐIỂM CHI TIẾT */}
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

  tierSelector: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tierTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#0D0620',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#332255',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tierTabActive: {
    backgroundColor: '#1E0B36',
    borderColor: '#39FF14'
  },
  tierTabIcon: { fontSize: 14, marginBottom: 2 },
  tierTabText: { color: '#8888AA', fontSize: 9, fontWeight: 'bold' },
  tierTabTextActive: { color: '#39FF14', fontWeight: '900' },

  tierInfoBox: { backgroundColor: '#0F0624', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#221144', marginBottom: 14 },
  tierInfoText: { color: '#FFD700', fontSize: 9.5, lineHeight: 15, fontStyle: 'italic' },

  levelSelectorContainer: { marginBottom: 14 },
  levelSelectorLabel: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  levelTabs: { flexDirection: 'row', gap: 6 },
  levelTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0D0620',
    borderWidth: 1.5,
    borderColor: '#332255',
    alignItems: 'center'
  },
  levelTabActive: {
    backgroundColor: '#FF007F',
    borderColor: '#FF007F'
  },
  levelTabText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  levelTabTextActive: { color: '#FFF', fontWeight: '900' },

  reopenModalBtn: {
    backgroundColor: '#0B192C',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#00FFFF',
    marginBottom: 14,
    alignItems: 'center'
  },
  reopenModalBtnText: {
    color: '#00FFFF',
    fontSize: 10.5,
    fontWeight: '900'
  },

  sectionHeader: { color: '#00FFFF', fontSize: 10.5, fontWeight: '900' },
  card: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roleText: { color: '#FFD700', fontSize: 11.5, fontWeight: 'bold', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8.5, fontWeight: '900' },
  antiCheatBadge: { backgroundColor: '#350A18', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FF0055' },
  antiCheatBadgeText: { color: '#FF0055', fontSize: 8, fontWeight: '900' },
  contextText: { color: '#FFF', fontSize: 10.5, lineHeight: 16, marginBottom: 8 },
  previewPromptText: { color: '#AAAABB', fontSize: 10, fontStyle: 'italic', marginBottom: 12, backgroundColor: '#070212', padding: 8, borderRadius: 6 },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  emptyText: { color: '#666', fontStyle: 'italic', textAlign: 'center', marginVertical: 20, fontSize: 11 },

  // Giao diện phòng thu tự do
  normalPracticeCard: { backgroundColor: '#0A0318', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#00FFFF', marginVertical: 10 },
  normalPracticeHeader: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  normalPromptTitle: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginTop: 8 },
  normalPromptDesc: { color: '#8888AA', fontSize: 10.5, marginBottom: 10 },
  promptDisplayBox: { backgroundColor: '#130628', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptDisplayText: { color: '#FFFFFF', fontSize: 13.5, lineHeight: 22, fontWeight: 'bold' },
  liveWaveformBox: { marginBottom: 14 },
  liveWaveformLabel: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', marginBottom: 6 },
  startRecordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  startRecordBtnText: { color: '#FFF', fontSize: 11.5, fontWeight: '900' },
  stopRecordBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  stopRecordBtnText: { color: '#000', fontSize: 11.5, fontWeight: '900' }
});