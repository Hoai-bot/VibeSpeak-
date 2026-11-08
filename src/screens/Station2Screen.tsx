// src/screens/Station2Screen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AntiCheatSpeakingSession from '../components/AntiCheatSpeakingSession';
import { analyzeSpeechSpontaneity } from '../utils/spontaneityDetector';
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
  contextDesc: string; // Tình huống (Roleplay), Lời thoại trước (Relay), hoặc Thử thách âm vị (Solo)
  prompt: string;
  isTeacherAssigned?: boolean;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const TIERS: { key: Station2Tier; label: string; icon: string; desc: string }[] = [
  { key: 'SOLO', label: 'TẦNG 1: SOLO', icon: '🥊', desc: 'Đơn đấu kỹ thuật: Xử lý câu ngữ âm khó và nhịp điệu trọng âm' },
  { key: 'RELAY', label: 'TẦNG 2: RELAY', icon: '🏃', desc: 'Tiếp sức phản xạ: Nghe câu đối thoại trước và nối ý ngay lập tức' },
  { key: 'ROLEPLAY', label: 'TẦNG 3: ROLEPLAY', icon: '🎭', desc: 'Nhập vai tình huống: Giải quyết xung đột thực tế theo vai vế xã hội' }
];

// Ngân hàng thử thách mẫu chuẩn cho 3 tầng x 6 bậc CEFR
const DEFAULT_CHALLENGES: ChallengeItem[] = [
  // ==================== TẦNG 1: SOLO ====================
  {
    id: 's_a1',
    tier: 'SOLO',
    level: 'A1',
    title: 'Phát âm nối âm cơ bản',
    contextDesc: 'Thử thách phát âm rõ phụ âm cuối và nối âm mượt mà:',
    prompt: 'There is an apple on the table next to an orange.'
  },
  {
    id: 's_a2',
    tier: 'SOLO',
    level: 'A2',
    title: 'Trọng âm từ và nhịp điệu quá khứ',
    contextDesc: 'Nhấn chính xác đuôi -ed và trọng âm từ đa âm tiết:',
    prompt: 'Yesterday we decided to visit the historical museum and enjoyed every minute.'
  },
  {
    id: 's_b1',
    tier: 'SOLO',
    level: 'B1',
    title: 'Ngắt nhịp cụm tư duy (Thought Groups)',
    contextDesc: 'Ngắt hơi tự nhiên giữa mệnh đề chính và mệnh đề phụ:',
    prompt: 'Although the weather was terrible, we managed to arrive at the conference right on schedule.'
  },
  {
    id: 's_b2',
    tier: 'SOLO',
    level: 'B2',
    title: 'Ngữ điệu câu phức học thuật',
    contextDesc: 'Điều chỉnh cao độ nâng lên ở mệnh đề điều kiện và hạ giọng ở kết luận:',
    prompt: 'If financial markets continue to exhibit volatility, institutional investors will inevitably reallocate their capital into low-risk government bonds.'
  },
  {
    id: 's_c1',
    tier: 'SOLO',
    level: 'C1',
    title: 'Phát âm học thuật cao cấp & Cụm danh từ ghép',
    contextDesc: 'Thử thách độ nuột của các âm xát, phụ âm ghép và trọng âm từ trừu tượng:',
    prompt: 'The institutionalization of renewable methodologies requires comprehensive interdisciplinary collaboration across disparate economic sectors.'
  },
  {
    id: 's_c2',
    tier: 'SOLO',
    level: 'C2',
    title: 'Biến thiên ngữ điệu tinh vi (Sophisticated Nuance)',
    contextDesc: 'Thể hiện ngữ điệu mỉa mai nhẹ nhàng hoặc châm biếm học thuật qua cao độ F0:',
    prompt: 'To assume that technological ubiquity inherently equates to pedagogical efficacy is, at best, a profound philosophical oversight.'
  },

  // ==================== TẦNG 2: RELAY ====================
  {
    id: 'r_a1',
    tier: 'RELAY',
    level: 'A1',
    title: 'Phản hồi sở thích bạn học',
    contextDesc: 'Bạn học nói: "I really love drinking iced milk tea in the summer. How about you?"',
    prompt: 'I prefer cold fruit juice because it is much healthier and refreshing.'
  },
  {
    id: 'r_a2',
    tier: 'RELAY',
    level: 'A2',
    title: 'Phản hồi rủ rê cuối tuần',
    contextDesc: 'Đồng nghiệp nói: "We are planning a barbecue party this Saturday evening. Can you join us?"',
    prompt: 'I would love to, but I have already promised to visit my grandparents this weekend.'
  },
  {
    id: 'r_b1',
    tier: 'RELAY',
    level: 'B1',
    title: 'Nối tiếp ý kiến thảo luận nhóm',
    contextDesc: 'Trưởng nhóm nói: "Our current marketing campaign is not reaching university students effectively."',
    prompt: 'I completely agree. Perhaps we should collaborate with student influencers on TikTok to boost our organic reach.'
  },
  {
    id: 'r_b2',
    tier: 'RELAY',
    level: 'B2',
    title: 'Phản biện lịch trình dự án',
    contextDesc: 'Khách hàng nói: "We need the beta version deployed two weeks earlier than the agreed roadmap."',
    prompt: 'Accelerating the deployment timeline will severely constrain our quality assurance cycle, risking critical security vulnerabilities.'
  },
  {
    id: 'r_c1',
    tier: 'RELAY',
    level: 'C1',
    title: 'Đối thoại chất vấn chiến lược',
    contextDesc: 'Thành viên hội đồng nói: "Expanding into emerging markets right now carries unacceptable currency fluctuation risks."',
    prompt: 'While macroeconomic volatility is palpable, our diversified hedging mechanisms and localized supply chains substantially buffer potential foreign exchange losses.'
  },
  {
    id: 'r_c2',
    tier: 'RELAY',
    level: 'C2',
    title: 'Tranh biện học thuật phản xạ',
    contextDesc: 'Đối thủ tranh biện nói: "Algorithmic decision-making will inevitably surpass human judicial impartiality in the coming decade."',
    prompt: 'That premise conflates statistical optimization with normative jurisprudence; an algorithm optimizes for historical precedents, thereby codifying systemic biases rather than dispensing justice.'
  },

  // ==================== TẦNG 3: ROLEPLAY ====================
  {
    id: 'rp_a1',
    tier: 'ROLEPLAY',
    level: 'A1',
    title: 'Khách gọi món tại quán ăn nhanh',
    contextDesc: 'Bối cảnh: Bạn muốn gọi 1 burger gà và 1 chai nước suối nhỏ.',
    prompt: 'Hello, can I please have one chicken burger and a small bottle of water?'
  },
  {
    id: 'rp_a2',
    tier: 'ROLEPLAY',
    level: 'A2',
    title: 'Hỏi đổi kích cỡ quần áo tại shop',
    contextDesc: 'Bối cảnh: Áo sơ mi bạn vừa thử bị chật vai, cần hỏi cỡ lớn hơn (L).',
    prompt: 'This shirt feels a bit tight around my shoulders. Do you happen to have this in a size large?'
  },
  {
    id: 'rp_b1',
    tier: 'ROLEPLAY',
    level: 'B1',
    title: 'Đổi trả cà phê tại sân bay',
    contextDesc: 'Bối cảnh: Bạn gọi cà phê đá không đường nhưng nhân viên đưa nhầm cà phê nóng, chuyến bay sắp cất cánh trong 15 phút.',
    prompt: 'Excuse me, I ordered an iced latte without sugar, but this seems to be hot cappuccino. Could you please replace it quickly as my boarding starts soon?'
  },
  {
    id: 'rp_b2',
    tier: 'ROLEPLAY',
    level: 'B2',
    title: 'Đàm phán dời lịch họp với đối tác',
    contextDesc: 'Bối cảnh: Đối tác muốn dời lịch họp sang thứ 6 nhưng bạn bị trùng lịch công tác tại Đà Nẵng.',
    prompt: 'I am afraid Friday afternoon will not work for me due to an urgent business trip. Could we possibly reschedule our strategic discussion to next Monday morning instead?'
  },
  {
    id: 'rp_c1',
    tier: 'ROLEPLAY',
    level: 'C1',
    title: 'Quản lý xử lý khiếu nại khách VIP',
    contextDesc: 'Bối cảnh: Điều hòa phòng Suite gặp trục trặc lúc nửa đêm, khách VIP đe dọa hủy hợp đồng hội nghị.',
    prompt: 'I sincerely apologize for the disruption caused by the malfunctioning HVAC system. Let me immediately arrange a room upgrade on the executive penthouse floor, along with complimentary dining services.'
  },
  {
    id: 'rp_c2',
    tier: 'ROLEPLAY',
    level: 'C2',
    title: 'Phát ngôn viên xử lý khủng hoảng truyền thông',
    contextDesc: 'Bối cảnh: Hệ thống thanh toán bị tê liệt 2 giờ trước thềm phiên giao dịch chứng khoán.',
    prompt: 'We unequivocally acknowledge the unprecedented infrastructure downtime today. Our engineering contingency protocols have stabilized the core clusters, and comprehensive security audits are underway to ensure zero financial discrepancies.'
  }
];

export default function Station2Screen({ onBack }: Props) {
  const [selectedTier, setSelectedTier] = useState<Station2Tier>('ROLEPLAY');
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1');
  const [allChallenges, setAllChallenges] = useState<ChallengeItem[]>(DEFAULT_CHALLENGES);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(null);
  const [isExamining, setIsExamining] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // 🔄 Tự động tải bài tập linh hoạt từ Giảng viên (assignments)
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
            // Mặc định gán tầng nếu tiêu đề có chứa từ khóa hoặc rơi về ROLEPLAY
            let detectedTier: Station2Tier = 'ROLEPLAY';
            const titleUpper = (item.title || '').toUpperCase();
            if (titleUpper.includes('SOLO')) detectedTier = 'SOLO';
            else if (titleUpper.includes('RELAY')) detectedTier = 'RELAY';

            return {
              id: `teacher_${item.id}`,
              tier: detectedTier,
              level: (item.cefr_level || 'B2').toUpperCase() as CefrLevel,
              title: item.title || 'Bài tập Giảng viên giao',
              contextDesc: `🏫 Nhiệm vụ học phần do Giảng viên chỉ định cho lớp (${detectedTier}):`,
              prompt: item.target_prompt || '',
              isTeacherAssigned: true
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

  // Lọc theo cả TẦNG và BẬC CEFR
  const filteredChallenges = allChallenges.filter(
    item => item.tier === selectedTier && item.level === selectedLevel
  );

  const handleStartExam = (challenge: ChallengeItem) => {
    setSelectedChallenge(challenge);
    setIsExamining(true);
    setLastResult(null);
  };

  const handleRecordingComplete = async (audioBlob: Blob, pitchHistory: number[]) => {
    const spontaneity = analyzeSpeechSpontaneity(pitchHistory);

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
        const modeString = `STATION_2_${selectedTier}`;

        await supabase.from('submissions').insert([{
          student_name: authUser?.user?.user_metadata?.full_name || 'Học viên Trạm 2',
          student_code: authUser?.user?.email?.split('@')[0] || 'STU_S2',
          class_name: `Trạm 2: ${selectedTier} (${selectedLevel})`,
          mode: modeString,
          cefr_level: selectedChallenge?.level || selectedLevel,
          score: Math.min(100, spontaneity.score + 10),
          manual_score: null,
          spontaneity_score: spontaneity.score,
          pitch_variance: spontaneity.pitchVariance,
          is_script_suspected: spontaneity.isScriptSuspected,
          audio_url: audioUrl,
          transcript: selectedChallenge?.prompt || '',
          feedback: spontaneity.isScriptSuspected 
            ? `⚠️ [${selectedTier}] Cảnh báo: Biến thiên F0 phẳng (<20 Hz), có dấu hiệu đọc kịch bản.` 
            : `✅ [${selectedTier}] Hoàn thành xuất sắc: Ngữ điệu tự nhiên, phản xạ tốt!`
        }]);
      }
    } catch (err) {
      console.warn("Lỗi lưu kết quả Trạm 2:", err);
    }

    setLastResult(spontaneity);
    setIsExamining(false);
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
        {!isExamining && (
          <>
            {/* THANH 1: BỘ CHỌN 3 TẦNG ĐẤU SƯ PHẠM (SOLO - RELAY - ROLEPLAY) */}
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

            {/* Banner tóm tắt mục tiêu sư phạm của tầng hiện tại */}
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

            {lastResult && (
              <View style={[styles.resultBox, lastResult.isScriptSuspected ? styles.resultBoxWarning : styles.resultBoxSuccess]}>
                <Text style={styles.resultTitle}>
                  {lastResult.isScriptSuspected ? '⚠️ PHÁT HIỆN DẤU HIỆU ĐỌC KỊCH BẢN' : '🎉 BẢN THU PHẢN XẠ TỰ NHIÊN'}
                </Text>
                <Text style={styles.resultText}>Phần thi: {selectedTier} • Cấp độ: {selectedLevel}</Text>
                <Text style={styles.resultText}>Điểm tự nhiên (Spontaneity): {lastResult.score}/100đ</Text>
                <Text style={styles.resultText}>Độ lệch chuẩn F0 (Pitch Variance): {lastResult.pitchVariance} Hz</Text>
                <Text style={styles.resultSubtext}>
                  {lastResult.isScriptSuspected 
                    ? 'Ngữ điệu quá đơn điệu, không có đỉnh nhấn trọng âm cảm xúc của hội thoại tương tác.' 
                    : 'Ngữ điệu biến thiên sinh động, thể hiện rõ tư duy ngôn ngữ phản xạ tại chỗ!'}
                </Text>
              </View>
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
                    <Text style={[styles.levelBadge, item.isTeacherAssigned && { backgroundColor: '#FF007F', color: '#FFF' }]}>
                      {item.level}
                    </Text>
                  </View>
                  <Text style={styles.contextText}>{item.contextDesc}</Text>
                  <TouchableOpacity 
                    style={[styles.startBtn, item.isTeacherAssigned && { backgroundColor: '#00FFFF' }]} 
                    onPress={() => handleStartExam(item)}
                  >
                    <Text style={[styles.startBtnText, item.isTeacherAssigned && { color: '#000' }]}>
                      ⚡ VÀO THỬ THÁCH {selectedTier} (5S PHẢN XẠ)
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {isExamining && selectedChallenge && (
          <AntiCheatSpeakingSession
            promptText={selectedChallenge.prompt}
            situationPrompt={selectedChallenge.contextDesc}
            prepTimeSeconds={5}
            autoHidePrompt={true}
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setIsExamining(false)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 12, fontWeight: '900', flexShrink: 1 },

  // Selector 3 Tầng Sư Phạm
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

  // Selector 6 Bậc CEFR
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

  sectionHeader: { color: '#00FFFF', fontSize: 10.5, fontWeight: '900' },
  card: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roleText: { color: '#FFD700', fontSize: 11.5, fontWeight: 'bold', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8.5, fontWeight: '900' },
  contextText: { color: '#FFF', fontSize: 10.5, lineHeight: 16, marginBottom: 12 },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  resultBox: { padding: 12, borderRadius: 10, borderWidth: 1.5, marginBottom: 14 },
  resultBoxSuccess: { backgroundColor: '#062013', borderColor: '#39FF14' },
  resultBoxWarning: { backgroundColor: '#280812', borderColor: '#FF0055' },
  resultTitle: { fontSize: 11.5, fontWeight: '900', marginBottom: 5, color: '#FFF' },
  resultText: { color: '#FFF', fontSize: 10, marginBottom: 2 },
  resultSubtext: { color: '#AAAABB', fontSize: 8.5, fontStyle: 'italic', marginTop: 3 },
  emptyText: { color: '#666', fontStyle: 'italic', textAlign: 'center', marginVertical: 20, fontSize: 11 }
});