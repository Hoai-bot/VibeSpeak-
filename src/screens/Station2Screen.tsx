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

interface Scenario {
  id: string;
  level: CefrLevel;
  role: string;
  situation: string;
  prompt: string;
  isTeacherAssigned?: boolean;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Dữ liệu kịch bản chuẩn mẫu hệ thống
const DEFAULT_SCENARIOS: Scenario[] = [
  // A1
  {
    id: 'a1_1',
    level: 'A1',
    role: 'Khách gọi món tại quán ăn nhanh',
    situation: 'Bạn muốn gọi 1 burger gà và 1 ly nước suối nhỏ.',
    prompt: 'Hello, can I please have one chicken burger and a small bottle of water?'
  },
  {
    id: 'a1_2',
    level: 'A1',
    role: 'Hỏi thăm đường cơ bản',
    situation: 'Bạn đang tìm nhà vệ sinh tại trung tâm thương mại.',
    prompt: 'Excuse me, could you tell me where the nearest restroom is?'
  },

  // A2
  {
    id: 'a2_1',
    level: 'A2',
    role: 'Hỏi đổi kích cỡ quần áo',
    situation: 'Áo sơ mi bạn vừa thử hơi chật, bạn cần cỡ lớn hơn (L).',
    prompt: 'This shirt is a bit tight for me. Do you have this in a size large?'
  },
  {
    id: 'a2_2',
    level: 'A2',
    role: 'Báo phòng khách sạn thiếu đồ',
    situation: 'Phòng của bạn chưa có khăn tắm mới.',
    prompt: 'Hi, I just checked into room 402, but there are no fresh towels in the bathroom.'
  },

  // B1
  {
    id: 'b1_1',
    level: 'B1',
    role: 'Khách đổi trả cà phê tại sân bay',
    situation: 'Bạn gọi cà phê sữa đá không đường nhưng nhân viên đưa nhầm cà phê nóng.',
    prompt: 'Excuse me, I ordered an iced latte without sugar, but this seems to be hot cappuccino. Could you please replace it quickly as my boarding starts soon?'
  },
  {
    id: 'b1_2',
    level: 'B1',
    role: 'Hẹn lại lịch khám nha khoa',
    situation: 'Bạn có ca làm thêm đột xuất nên cần dời lịch hẹn vào ngày mai.',
    prompt: 'I am calling to reschedule my dental appointment tomorrow morning because of an urgent work shift. Do you have any openings on Friday afternoon?'
  },

  // B2
  {
    id: 'b2_1',
    level: 'B2',
    role: 'Đàm phán dời lịch họp với đối tác',
    situation: 'Đối tác muốn họp chiều thứ 6 nhưng bạn bị trùng lịch công tác tại Đà Nẵng.',
    prompt: 'I am afraid Friday afternoon will not work for me due to an urgent business trip. Could we possibly reschedule our strategic discussion to next Monday morning instead?'
  },
  {
    id: 'b2_2',
    level: 'B2',
    role: 'Phản ánh chất lượng dịch vụ giao hàng',
    situation: 'Bưu kiện đồ điện tử bị móp méo vỏ hộp khi nhận hàng.',
    prompt: 'I received the delivery today, but the outer packaging was heavily damaged, raising concerns about the fragile components inside. I would like to request an inspection and replacement.'
  },

  // C1
  {
    id: 'c1_1',
    level: 'C1',
    role: 'Quản lý xử lý khiếu nại khách VIP',
    situation: 'Điều hòa phòng Tổng thống gặp trục trặc lúc nửa đêm.',
    prompt: 'I sincerely apologize for the disruption caused by the malfunctioning HVAC system. Let me immediately arrange a room upgrade on the executive penthouse floor, along with complimentary dining services.'
  },
  {
    id: 'c1_2',
    level: 'C1',
    role: 'Thuyết phục khách hàng gia hạn hợp đồng phần mềm',
    situation: 'Khách hàng phân vân về việc tăng phí bản quyền 15% của năm mới.',
    prompt: 'While I understand your budget constraints regarding the adjusted renewal fees, this upgrade integrates automated AI compliance tools that will substantially mitigate operational risks and overhead costs.'
  },

  // C2
  {
    id: 'c2_1',
    level: 'C2',
    role: 'Phát ngôn viên xử lý khủng hoảng truyền thông',
    situation: 'Hệ thống thanh toán trực tuyến bị gián đoạn diện rộng trong 2 giờ.',
    prompt: 'We unequivocally acknowledge the unprecedented infrastructure downtime today. Our engineering contingency protocols have stabilized the core clusters, and comprehensive security audits are underway to ensure zero financial discrepancies.'
  },
  {
    id: 'c2_2',
    level: 'C2',
    role: 'Hòa giải tranh chấp bản quyền trong hội đồng thẩm định',
    situation: 'Hai nhóm nghiên cứu cùng tuyên bố độc quyền thuật toán phân tích phổ âm học.',
    prompt: 'Given the converging architectural methodologies presented by both consortiums, an equitable cross-licensing framework would preclude protracted litigation while accelerating cross-disciplinary deployment.'
  }
];

export default function Station2Screen({ onBack }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1');
  const [allScenarios, setAllScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isExamining, setIsExamining] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // 🔄 PHỤC HỒI NỘI DUNG LINH HOẠT: Tự động tải các bài tập do Giảng viên tạo
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
          const teacherItems: Scenario[] = assignments.map((item: any) => ({
            id: `teacher_${item.id}`,
            level: (item.cefr_level || 'B2').toUpperCase() as CefrLevel,
            role: item.title || 'Bài tập Giảng viên giao',
            situation: item.target_prompt ? `Nhiệm vụ học phần: ${item.title}` : 'Thực hiện tình huống phản xạ theo yêu cầu của Giảng viên.',
            prompt: item.target_prompt || '',
            isTeacherAssigned: true
          }));

          // Gộp bài tập của giáo viên lên đầu danh sách
          setAllScenarios([...teacherItems, ...DEFAULT_SCENARIOS]);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải bài tập giảng viên giao:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchTeacherAssignments();
  }, []);

  // Lọc kịch bản theo bậc được chọn
  const filteredScenarios = allScenarios.filter(s => s.level === selectedLevel);

  const handleStartExam = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsExamining(true);
    setLastResult(null);
  };

  const handleRecordingComplete = async (audioBlob: Blob, pitchHistory: number[]) => {
    const spontaneity = analyzeSpeechSpontaneity(pitchHistory);

    let audioUrl = '';
    try {
      if (supabase) {
        const fileName = `station2_${selectedLevel.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
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
          class_name: `Trạm 2: Roleplay (${selectedLevel})`,
          mode: 'STATION_2_ROLEPLAY',
          cefr_level: selectedScenario?.level || selectedLevel,
          score: Math.min(100, spontaneity.score + 10),
          manual_score: null,
          spontaneity_score: spontaneity.score,
          pitch_variance: spontaneity.pitchVariance,
          is_script_suspected: spontaneity.isScriptSuspected,
          audio_url: audioUrl,
          transcript: selectedScenario?.prompt || '',
          feedback: spontaneity.isScriptSuspected 
            ? '⚠️ Cảnh báo: Biến thiên âm vực F0 thấp, nghi vấn đọc tài liệu.' 
            : '✅ Biến thiên ngữ điệu tự nhiên, phản xạ tình huống xuất sắc.'
        }]);
      }
    } catch (err) {
      console.warn("Lỗi lưu kết quả bài nộp:", err);
    }

    setLastResult(spontaneity);
    setIsExamining(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: ALL-IN ARENA (ROLEPLAY PHẢN XẠ)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {!isExamining && (
          <>
            <Text style={styles.subtitle}>
              Chế độ chống gian lận 3 tầng: Đề bài chỉ hiển thị 5 giây chuẩn bị, sau đó sẽ biến mất và mic tự động bật. Thuật toán F0 sẽ phát hiện nếu bạn đọc theo kịch bản!
            </Text>

            {/* THANH CHỌN 6 BẬC KHUNG THAM CHIẾU CEFR (A1 -> C2) */}
            <View style={styles.levelSelectorContainer}>
              <Text style={styles.levelSelectorLabel}>🎯 CHỌN CẤP ĐỘ KHUNG CHÂU ÂU (CEFR):</Text>
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
                  {lastResult.isScriptSuspected ? '⚠️ KẾT QUẢ: NGHI VẤN ĐỌC KỊCH BẢN' : '🎉 KẾT QUẢ: NÓI PHẢN XẠ TỰ NHIÊN'}
                </Text>
                <Text style={styles.resultText}>Cấp độ vừa thử: {selectedLevel}</Text>
                <Text style={styles.resultText}>Điểm phản xạ tự nhiên (Spontaneity): {lastResult.score}/100đ</Text>
                <Text style={styles.resultText}>Độ lệch chuẩn F0 (Pitch Variance): {lastResult.pitchVariance} Hz</Text>
                <Text style={styles.resultSubtext}>
                  {lastResult.isScriptSuspected 
                    ? 'Ngữ điệu quá đều đặn, không có đỉnh nhấn trọng âm cảm xúc của hội thoại thực tế.' 
                    : 'Ngữ điệu biến thiên sinh động, thể hiện rõ tư duy ngôn ngữ tại chỗ!'}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.sectionHeader}>
                📌 TÌNH HUỐNG THỬ THÁCH BẬC [{selectedLevel}]:
              </Text>
              {loadingAssignments && (
                <ActivityIndicator size="small" color="#00FFFF" />
              )}
            </View>

            {filteredScenarios.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có kịch bản cho bậc này.</Text>
            ) : (
              filteredScenarios.map((sc) => (
                <View key={sc.id} style={[styles.card, sc.isTeacherAssigned && styles.teacherCard]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.roleText, sc.isTeacherAssigned && { color: '#00FFFF' }]}>
                      {sc.isTeacherAssigned ? '🏫 [BÀI GIẢNG VIÊN GIAO] ' : '🎭 '}{sc.role}
                    </Text>
                    <Text style={[styles.levelBadge, sc.isTeacherAssigned && { backgroundColor: '#FF007F', color: '#FFF' }]}>
                      {sc.level}
                    </Text>
                  </View>
                  <Text style={styles.situationText}>Tình huống: {sc.situation}</Text>
                  <TouchableOpacity 
                    style={[styles.startBtn, sc.isTeacherAssigned && { backgroundColor: '#00FFFF' }]} 
                    onPress={() => handleStartExam(sc)}
                  >
                    <Text style={[styles.startBtnText, sc.isTeacherAssigned && { color: '#000' }]}>
                      ⚡ BƯỚC VÀO PHÒNG ĐẤU (5S PHẢN XẠ)
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {isExamining && selectedScenario && (
          <AntiCheatSpeakingSession
            promptText={selectedScenario.prompt}
            situationPrompt={selectedScenario.situation}
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 13, fontWeight: '900', flexShrink: 1 },
  subtitle: { color: '#AAAABB', fontSize: 10, lineHeight: 16, marginBottom: 16 },

  levelSelectorContainer: { marginBottom: 16 },
  levelSelectorLabel: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  levelTabs: { flexDirection: 'row', gap: 6 },
  levelTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0D0620',
    borderWidth: 1.5,
    borderColor: '#332255',
    alignItems: 'center'
  },
  levelTabActive: {
    backgroundColor: '#FF007F',
    borderColor: '#00FFFF'
  },
  levelTabText: { color: '#8888AA', fontSize: 11, fontWeight: 'bold' },
  levelTabTextActive: { color: '#FFF', fontWeight: '900' },

  sectionHeader: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  card: { backgroundColor: '#130628', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roleText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '900' },
  situationText: { color: '#FFF', fontSize: 11, lineHeight: 17, marginBottom: 14 },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  resultBox: { padding: 14, borderRadius: 10, borderWidth: 1.5, marginBottom: 16 },
  resultBoxSuccess: { backgroundColor: '#062013', borderColor: '#39FF14' },
  resultBoxWarning: { backgroundColor: '#280812', borderColor: '#FF0055' },
  resultTitle: { fontSize: 12, fontWeight: '900', marginBottom: 6, color: '#FFF' },
  resultText: { color: '#FFF', fontSize: 11, marginBottom: 3 },
  resultSubtext: { color: '#AAAABB', fontSize: 9, fontStyle: 'italic', marginTop: 4 },
  emptyText: { color: '#666', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 }
});