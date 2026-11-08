// src/screens/Station4Screen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AntiCheatSpeakingSession from '../components/AntiCheatSpeakingSession';
import { analyzeSpeechSpontaneity } from '../utils/spontaneityDetector';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

interface ExpressTopic {
  id: string;
  level: CefrLevel;
  topic: string;
  prompt: string;
  keywords: string[];
  isTeacherAssigned?: boolean;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const DEFAULT_EXPRESS_TOPICS: ExpressTopic[] = [
  // A1
  {
    id: 'a1_1',
    level: 'A1',
    topic: 'Sống ở Nông thôn hay Thành phố',
    prompt: 'Do you prefer living in the city or in the countryside? Give one simple reason.',
    keywords: ['Quiet', 'Fresh air', 'Convenient', 'Crowded']
  },
  {
    id: 'a1_2',
    level: 'A1',
    topic: 'Nấu ăn ở nhà hay Ăn ngoài',
    prompt: 'Do you like cooking at home or eating at a restaurant? Explain why in one sentence.',
    keywords: ['Healthy', 'Cheap', 'Delicious', 'Fast']
  },

  // A2
  {
    id: 'a2_1',
    level: 'A2',
    topic: 'Tự học hay Học nhóm',
    prompt: 'Is it better to study alone or study in a group with friends? Share your personal view.',
    keywords: ['Focus', 'Discuss ideas', 'Distraction', 'Help each other']
  },
  {
    id: 'a2_2',
    level: 'A2',
    topic: 'Mua sắm Online hay Trực tiếp',
    prompt: 'Why do many young people prefer online shopping instead of going to physical stores?',
    keywords: ['Convenience', 'Price comparison', 'Discounts', 'Try on clothes']
  },

  // B1
  {
    id: 'b1_1',
    level: 'B1',
    topic: 'Mạng xã hội và Giới trẻ',
    prompt: 'Does social media bring people closer together, or does it cause social isolation? Defend your opinion.',
    keywords: ['Connectivity', 'Virtual interaction', 'Screen time', 'Depression']
  },
  {
    id: 'b1_2',
    level: 'B1',
    topic: 'Học Đại học hay Học nghề',
    prompt: 'Should high school graduates go directly to vocational training instead of attending university?',
    keywords: ['Hands-on skills', 'Tuition fees', 'Career prospect', 'Academic degree']
  },

  // B2
  {
    id: 'b2_1',
    level: 'B2',
    topic: 'Trí tuệ nhân tạo & Thị trường lao động',
    prompt: 'Do you believe artificial intelligence will displace more jobs than it creates in the next decade? Provide one concrete argument.',
    keywords: ['Automation', 'Displacement', 'Adaptability', 'Productivity']
  },
  {
    id: 'b2_2',
    level: 'B2',
    topic: 'Chính sách cấm đồ nhựa một lần',
    prompt: 'Can government bans on single-use plastics genuinely resolve ocean pollution without harming small businesses?',
    keywords: ['Biodegradable', 'Enforcement', 'Eco-friendly alternative', 'Consumer habit']
  },

  // C1
  {
    id: 'c1_1',
    level: 'C1',
    topic: 'Năng lượng tái tạo & Chính sách kinh tế',
    prompt: 'Should developing countries prioritize rapid industrial growth over stringent carbon reduction targets? Justify your stance.',
    keywords: ['Sustainable growth', 'Emissions', 'Trade-off', 'Regulatory incentives']
  },
  {
    id: 'c1_2',
    level: 'C1',
    topic: 'Làm việc từ xa & Bản sắc doanh nghiệp',
    prompt: 'How does long-term remote employment erode spontaneous innovation and corporate cohesion in global enterprises?',
    keywords: ['Virtual bonding', 'Autonomy', 'Cross-functional synergy', 'Asynchronous workflow']
  },

  // C2
  {
    id: 'c2_1',
    level: 'C2',
    topic: 'Đạo đức sinh học & Chỉnh sửa gen người',
    prompt: 'Does genetic editing for non-therapeutic enhancement pose an existential threat to democratic egalitarianism?',
    keywords: ['Bioethics', 'Genetic stratification', 'Eugenics', 'Regulatory moratorium']
  },
  {
    id: 'c2_2',
    level: 'C2',
    topic: 'Quyền riêng tư dữ liệu & Nhà nước giám sát',
    prompt: 'To what extent does the ubiquitous deployment of biometric surveillance compromise fundamental civil liberties in modern technocracies?',
    keywords: ['Panopticon', 'Algorithmic governance', 'Civil liberties', 'Surveillance capitalism']
  }
];

export default function Station4Screen({ onBack }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B2');
  const [allTopics, setAllTopics] = useState<ExpressTopic[]>(DEFAULT_EXPRESS_TOPICS);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);
  const [selectedTopic, setSelectedTopic] = useState<ExpressTopic | null>(null);
  const [isExamining, setIsExamining] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // 🔄 Tự động tải bài tập do Giảng viên giao từ bảng assignments
  const fetchTeacherAssignments = async () => {
    setLoadingAssignments(true);
    try {
      if (supabase) {
        const { data: assignments, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('station_type', 'STATION_4')
          .order('created_at', { ascending: false });

        if (!error && assignments && assignments.length > 0) {
          const teacherItems: ExpressTopic[] = assignments.map((item: any) => ({
            id: `teacher_${item.id}`,
            level: (item.cefr_level || 'B2').toUpperCase() as CefrLevel,
            topic: item.title || 'Đề phản biện Giảng viên giao',
            prompt: item.target_prompt || '',
            keywords: ['Học phần', 'Phản biện', 'Nhiệm vụ', item.cefr_level || 'B2'],
            isTeacherAssigned: true
          }));

          // Gộp bài tập của giáo viên lên đầu danh sách
          setAllTopics([...teacherItems, ...DEFAULT_EXPRESS_TOPICS]);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải bài tập phản biện của giảng viên:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchTeacherAssignments();
  }, []);

  // Lọc chủ đề theo bậc CEFR
  const filteredTopics = allTopics.filter(t => t.level === selectedLevel);

  const handleStartExam = (topic: ExpressTopic) => {
    setSelectedTopic(topic);
    setIsExamining(true);
    setLastResult(null);
  };

  const handleRecordingComplete = async (audioBlob: Blob, pitchHistory: number[]) => {
    const spontaneity = analyzeSpeechSpontaneity(pitchHistory);

    let audioUrl = '';
    try {
      if (supabase) {
        const fileName = `station4_${selectedLevel.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('submissions')
          .upload(fileName, audioBlob, { contentType: 'audio/webm' });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
          audioUrl = urlData?.publicUrl || '';
        }

        const { data: authUser } = await supabase.auth.getUser();
        await supabase.from('submissions').insert([{
          student_name: authUser?.user?.user_metadata?.full_name || 'Chiến binh Trạm 4',
          student_code: authUser?.user?.email?.split('@')[0] || 'STU_S4',
          class_name: `Trạm 4: Speaking Express (${selectedLevel})`,
          mode: 'STATION_4_EXPRESS',
          cefr_level: selectedTopic?.level || selectedLevel,
          score: Math.min(100, spontaneity.score + 5),
          manual_score: null,
          spontaneity_score: spontaneity.score,
          pitch_variance: spontaneity.pitchVariance,
          is_script_suspected: spontaneity.isScriptSuspected,
          audio_url: audioUrl,
          transcript: selectedTopic?.prompt || '',
          feedback: spontaneity.isScriptSuspected 
            ? '⚠️ Nghi vấn đọc kịch bản: Nhịp điệu đơn điệu, thiếu biến thiên ngữ điệu F0 khi lập luận.' 
            : '✅ Tư duy phản xạ học thuật xuất sắc: Ngữ điệu tự nhiên, ngắt nhịp tư duy logic.'
        }]);
      }
    } catch (err) {
      console.warn("Lỗi nộp bài Trạm 4:", err);
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
        <Text style={styles.title}>⚡ TRẠM 4: SPEAKING EXPRESS (KHUNG CEFR 6 BẬC)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {!isExamining && (
          <>
            <Text style={styles.subtitle}>
              Đấu trường phản biện nhanh: Chọn cấp độ phù hợp từ A1 đến C2. Đề bài chỉ hiển thị trong 5 giây để bạn nắm ý và từ khóa, sau đó sẽ lập tức ẩn đi để chống chụp màn hình. Micro tự bật và engine F0 sẽ đo lường độ tự nhiên của giọng nói.
            </Text>

            {/* THANH CHỌN 6 BẬC CEFR (A1 -> C2) */}
            <View style={styles.levelSelectorContainer}>
              <Text style={styles.levelSelectorLabel}>🎯 CHỌN CẤP ĐỘ PHẢN BIỆN (CEFR):</Text>
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
                  {lastResult.isScriptSuspected ? '⚠️ PHÁT HIỆN DẤU HIỆU ĐỌC BÀI' : '🎉 BẢN THU PHẢN BIỆN TỰ NHIÊN'}
                </Text>
                <Text style={styles.resultText}>Cấp độ vừa thi: {selectedLevel}</Text>
                <Text style={styles.resultText}>Điểm tự nhiên (Spontaneity): {lastResult.score}/100đ</Text>
                <Text style={styles.resultText}>Độ biến thiên cao độ F0: {lastResult.pitchVariance} Hz</Text>
                <Text style={styles.resultSubtext}>
                  {lastResult.isScriptSuspected 
                    ? 'Tần số F0 quá phẳng (<20 Hz). Dữ liệu này sẽ được gắn cờ cảnh báo đọc bài trên Cổng Giảng viên.' 
                    : 'Ngữ điệu biến thiên linh hoạt, thể hiện rõ tư duy lập luận tự nhiên.'}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.sectionHeader}>
                🔥 CHỦ ĐỀ PHẢN BIỆN BẬC [{selectedLevel}]:
              </Text>
              {loadingAssignments && (
                <ActivityIndicator size="small" color="#00FFFF" />
              )}
            </View>

            {filteredTopics.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có chủ đề cho bậc này.</Text>
            ) : (
              filteredTopics.map((top) => (
                <View key={top.id} style={[styles.card, top.isTeacherAssigned && styles.teacherCard]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.topicText, top.isTeacherAssigned && { color: '#00FFFF' }]}>
                      {top.isTeacherAssigned ? '🏫 [BÀI GIẢNG VIÊN GIAO] ' : '💡 '}{top.topic}
                    </Text>
                    <Text style={[styles.levelBadge, top.isTeacherAssigned && { backgroundColor: '#FF007F', color: '#FFF' }]}>
                      {top.level}
                    </Text>
                  </View>
                  <Text style={styles.promptPreview}>Câu hỏi phản biện: {top.prompt}</Text>
                  <View style={styles.keywordRow}>
                    {top.keywords.map((kw, idx) => (
                      <Text key={idx} style={styles.keywordBadge}>#{kw}</Text>
                    ))}
                  </View>
                  <TouchableOpacity 
                    style={[styles.startBtn, top.isTeacherAssigned && { backgroundColor: '#00FFFF' }]} 
                    onPress={() => handleStartExam(top)}
                  >
                    <Text style={[styles.startBtnText, top.isTeacherAssigned && { color: '#000' }]}>
                      ⚡ VÀO THI PHẢN BIỆN (5S PHẢN XẠ)
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {isExamining && selectedTopic && (
          <AntiCheatSpeakingSession
            promptText={selectedTopic.prompt}
            situationPrompt={`Từ khóa định hướng: ${selectedTopic.keywords.join(', ')}`}
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
  title: { color: '#FFD700', fontSize: 13, fontWeight: '900', flexShrink: 1 },
  subtitle: { color: '#AAAABB', fontSize: 10, lineHeight: 16, marginBottom: 16 },

  // Thanh chọn 6 bậc CEFR
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
    backgroundColor: '#FFD700',
    borderColor: '#00FFFF'
  },
  levelTabText: { color: '#8888AA', fontSize: 11, fontWeight: 'bold' },
  levelTabTextActive: { color: '#000', fontWeight: '900' },

  sectionHeader: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  card: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#FF007F', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  topicText: { color: '#00FFFF', fontSize: 12, fontWeight: '900', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '900' },
  promptPreview: { color: '#FFF', fontSize: 11, lineHeight: 17, marginBottom: 10 },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  keywordBadge: { color: '#39FF14', backgroundColor: '#1A0B2E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, borderWidth: 1, borderColor: '#332255' },
  startBtn: { backgroundColor: '#39FF14', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultBox: { padding: 14, borderRadius: 10, borderWidth: 1.5, marginBottom: 16 },
  resultBoxSuccess: { backgroundColor: '#062013', borderColor: '#39FF14' },
  resultBoxWarning: { backgroundColor: '#280812', borderColor: '#FF0055' },
  resultTitle: { fontSize: 12, fontWeight: '900', marginBottom: 6, color: '#FFF' },
  resultText: { color: '#FFF', fontSize: 11, marginBottom: 3 },
  resultSubtext: { color: '#AAAABB', fontSize: 9, fontStyle: 'italic', marginTop: 4 },
  emptyText: { color: '#666', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 }
});