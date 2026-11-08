// src/screens/Station4Screen.tsx
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

  // Trạng thái cho chế độ Luyện tập tự do truyền thống
  const [isNormalPracticing, setIsNormalPracticing] = useState<boolean>(false);
  const [isRecordingNormal, setIsRecordingNormal] = useState<boolean>(false);
  const [normalTimer, setNormalTimer] = useState<number>(0);
  const normalMediaRecorderRef = useRef<any>(null);
  const normalAudioChunksRef = useRef<any[]>([]);
  const normalPitchHistoryRef = useRef<number[]>([]);
  const normalAnimFrameRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trạng thái cho chế độ Giáo viên giao bài (Anti-Cheat 5s)
  const [isTeacherExamining, setIsTeacherExamining] = useState<boolean>(false);

  // Modal bảng điểm 6 tiêu chí & sóng âm
  const [detailedModalVisible, setDetailedModalVisible] = useState<boolean>(false);
  const [feedbackResult, setFeedbackResult] = useState<DetailedFeedbackData | null>(null);

  // 1. Tự động tải bài tập do Giảng viên giao từ bảng assignments
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
            isTeacherAssigned: true // Đánh dấu là bài tập do giáo viên giao
          }));

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

  // 2. Phân luồng khi học viên chọn bài
  const handleSelectTopic = (topic: ExpressTopic) => {
    setSelectedTopic(topic);
    if (topic.isTeacherAssigned) {
      // 🔒 BÀI TẬP CỦA GIÁO VIÊN: KÍCH HOẠT ANTI-CHEAT 5S
      setIsTeacherExamining(true);
      setIsNormalPracticing(false);
    } else {
      // 📖 BÀI TỰ LUYỆN TẬP HỆ THỐNG: MỞ PHÒNG THU TỰ DO TRUYỀN THỐNG
      setIsNormalPracticing(true);
      setIsTeacherExamining(false);
      setNormalTimer(0);
      setIsRecordingNormal(false);
    }
  };

  // 3. Xử lý thu âm cho chế độ Luyện tập truyền thống
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
    ctx.strokeStyle = '#FFD700';
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

  useEffect(() => {
    let timer: any = null;
    if (isRecordingNormal) {
      timer = setInterval(() => setNormalTimer(prev => prev + 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isRecordingNormal]);

  // 4. Hàm chung hoàn tất đánh giá và lưu bài nộp lên Supabase
  const finishSubmissionAndEvaluate = async (audioBlob: Blob, pitchHistory: number[]) => {
    const evaluated = evaluateSpeechSubmission({
      transcript: selectedTopic?.prompt || '',
      targetPrompt: selectedTopic?.prompt || '',
      pitchHistory,
      durationSeconds: Math.max(normalTimer, 10),
      cefrLevel: selectedTopic?.level || selectedLevel
    });

    let audioUrl = '';
    try {
      if (supabase) {
        const fileName = `station4_${selectedLevel.toLowerCase()}_${Date.now()}.webm`;
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
          score: evaluated.totalScore,
          manual_score: null,
          spontaneity_score: evaluated.spontaneityScore,
          pitch_variance: evaluated.rubrics.intonation.score,
          is_script_suspected: evaluated.isScriptSuspected,
          audio_url: audioUrl,
          transcript: selectedTopic?.prompt || '',
          feedback: `[Phát âm: ${evaluated.rubrics.pronunciation.score} | Ngữ điệu: ${evaluated.rubrics.intonation.score} | Trôi chảy: ${evaluated.rubrics.fluency.score} | Từ vựng: ${evaluated.rubrics.vocabulary.score} | Ngữ pháp: ${evaluated.rubrics.grammar.score} | Nội dung: ${evaluated.rubrics.content.score}]`
        }]);
      }
    } catch (err) {
      console.warn("Lỗi lưu kết quả bài nộp Trạm 4:", err);
    }

    setFeedbackResult(evaluated);
    setIsTeacherExamining(false);
    setIsNormalPracticing(false);
    setDetailedModalVisible(true);
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
        {!isTeacherExamining && !isNormalPracticing && (
          <>
            <Text style={styles.subtitle}>
              Đấu trường phản biện nhanh: Lựa chọn cấp độ phù hợp từ A1 đến C2. Các bài tập tự do hiển thị sẵn câu hỏi và sóng âm để bạn tự rèn luyện. Các bài tập do Giảng viên giao sẽ kích hoạt chế độ chống gian lận (Anti-Cheat 5s)[cite: 3].
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
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                      {top.isTeacherAssigned && (
                        <View style={styles.antiCheatBadge}>
                          <Text style={styles.antiCheatBadgeText}>🔒 CHỐNG ĐỌC</Text>
                        </View>
                      )}
                      <Text style={[styles.levelBadge, top.isTeacherAssigned && { backgroundColor: '#FF007F', color: '#FFF' }]}>
                        {top.level}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.promptPreview}>Câu hỏi: {top.prompt}</Text>
                  
                  <View style={styles.keywordRow}>
                    {top.keywords.map((kw, idx) => (
                      <Text key={idx} style={styles.keywordBadge}>#{kw}</Text>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[styles.startBtn, top.isTeacherAssigned && { backgroundColor: '#00FFFF' }]} 
                    onPress={() => handleSelectTopic(top)}
                  >
                    <Text style={[styles.startBtnText, top.isTeacherAssigned && { color: '#000' }]}>
                      {top.isTeacherAssigned ? '⚡ VÀO THI PHẢN BIỆN (ANTI-CHEAT 5S)' : '🎙️ BẬT PHÒNG THU TỰ DO'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* CHẾ ĐỘ 1: BÀI TỰ LUYỆN TẬP THƯỜNG (BẢN CŨ CÓ SÓNG ÂM TRỰC QUAN) */}
        {/* ========================================================================= */}
        {isNormalPracticing && selectedTopic && (
          <View style={styles.normalPracticeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.normalPracticeHeader}>🎙️ PHÒNG THUYẾT TRÌNH TỰ DO (XEM TRƯỚC ĐỀ & SÓNG ÂM)</Text>
              <TouchableOpacity onPress={() => setIsNormalPracticing(false)}>
                <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ THOÁT</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.normalPromptTitle}>{selectedTopic.topic} ({selectedTopic.level})</Text>

            <View style={styles.promptDisplayBox}>
              <Text style={styles.promptDisplayText}>{selectedTopic.prompt}</Text>
              <View style={[styles.keywordRow, { marginTop: 10 }]}>
                {selectedTopic.keywords.map((kw, idx) => (
                  <Text key={idx} style={styles.keywordBadge}>#{kw}</Text>
                ))}
              </View>
            </View>

            {/* Canvas sóng âm thời gian thực */}
            <View style={styles.liveWaveformBox}>
              <Text style={styles.liveWaveformLabel}>
                {isRecordingNormal ? `🔴 ĐANG THU ÂM VÀ BẮT SÓNG ÂM: ${normalTimer}S` : '⚪ NHẤN NÚT ĐỂ BẮT ĐẦU THUYẾT TRÌNH'}
              </Text>
              <canvas
                ref={canvasRef}
                width={520}
                height={80}
                style={{ width: '100%', height: 80, backgroundColor: '#070212', borderRadius: 8, display: 'block' }}
              />
            </View>

            {!isRecordingNormal ? (
              <TouchableOpacity style={styles.startRecordBtn} onPress={startNormalRecording}>
                <Text style={styles.startRecordBtnText}>🔴 BẮT ĐẦU THUYẾT TRÌNH</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopRecordBtn} onPress={stopNormalRecording}>
                <Text style={styles.stopRecordBtnText}>⏹ DỪNG & CHẤM ĐIỂM CHI TIẾT</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* CHẾ ĐỘ 2: BÀI GIẢNG VIÊN GIAO (BẬT ANTI-CHEAT 5S) */}
        {/* ========================================================================= */}
        {isTeacherExamining && selectedTopic && (
          <AntiCheatSpeakingSession
            promptText={selectedTopic.prompt}
            situationPrompt={`Từ khóa định hướng: ${selectedTopic.keywords.join(', ')}`}
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FFD700', fontSize: 13, fontWeight: '900', flexShrink: 1 },
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
    backgroundColor: '#FFD700',
    borderColor: '#00FFFF'
  },
  levelTabText: { color: '#8888AA', fontSize: 11, fontWeight: 'bold' },
  levelTabTextActive: { color: '#000', fontWeight: '900' },

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

  sectionHeader: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  card: { backgroundColor: '#0D0620', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#FF007F', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  topicText: { color: '#00FFFF', fontSize: 12, fontWeight: '900', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '900' },
  antiCheatBadge: { backgroundColor: '#350A18', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FF0055' },
  antiCheatBadgeText: { color: '#FF0055', fontSize: 8, fontWeight: '900' },
  promptPreview: { color: '#FFF', fontSize: 11, lineHeight: 17, marginBottom: 10 },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  keywordBadge: { color: '#39FF14', backgroundColor: '#1A0B2E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, borderWidth: 1, borderColor: '#332255' },
  startBtn: { backgroundColor: '#39FF14', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  emptyText: { color: '#666', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },

  // Giao diện phòng thu tự do
  normalPracticeCard: { backgroundColor: '#0A0318', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#FFD700', marginVertical: 10 },
  normalPracticeHeader: { color: '#FFD700', fontSize: 10, fontWeight: '900' },
  normalPromptTitle: { color: '#00FFFF', fontSize: 13, fontWeight: '900', marginTop: 8, marginBottom: 10 },
  promptDisplayBox: { backgroundColor: '#130628', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptDisplayText: { color: '#FFFFFF', fontSize: 13.5, lineHeight: 22, fontWeight: 'bold' },
  liveWaveformBox: { marginBottom: 14 },
  liveWaveformLabel: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', marginBottom: 6 },
  startRecordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  startRecordBtnText: { color: '#FFF', fontSize: 11.5, fontWeight: '900' },
  stopRecordBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  stopRecordBtnText: { color: '#000', fontSize: 11.5, fontWeight: '900' }
});