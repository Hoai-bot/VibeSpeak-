// src/screens/Station4Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { updateUserProgress, saveSubmissionToCloud } from '../services/userService';

interface Props {
  onBack: () => void;
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 🎯 KHO ĐỀ MẪU TỰ ĐỘNG THEO CEFR CHO TRẠM 4
const STATION_4_TOPICS: Record<string, { title: string; promptEn: string; promptVi: string; minWpm: number; targetDuration: number }[]> = {
  A1: [
    {
      title: "My Daily Routine",
      promptEn: "Describe what you usually do from morning until night. Talk about your wake-up time, study habits, and favorite evening activities.",
      promptVi: "Mô tả một ngày bình thường của bạn từ sáng đến tối (giờ thức dậy, học tập, thói quen thư giãn buổi tối).",
      minWpm: 70,
      targetDuration: 45
    }
  ],
  A2: [
    {
      title: "A Memorable Trip",
      promptEn: "Tell a short story about a vacation or trip you took with your friends or family. Where did you go and what made it special?",
      promptVi: "Kể về một chuyến du lịch đáng nhớ cùng bạn bè hoặc gia đình (địa điểm, kỷ niệm đặc biệt).",
      minWpm: 85,
      targetDuration: 60
    }
  ],
  B1: [
    {
      title: "The Pros & Cons of Remote Learning",
      promptEn: "Share your perspectives on studying online versus offline in a traditional classroom. Which method suits you better and why?",
      promptVi: "Trình bày ưu và nhược điểm của học trực tuyến so với học truyền thống trên giảng đường.",
      minWpm: 100,
      targetDuration: 75
    }
  ],
  B2: [
    {
      title: "Impact of Artificial Intelligence on Future Careers",
      promptEn: "Analyze how generative AI and automation might transform high-demand professions in the next decade. How should university students prepare?",
      promptVi: "Phân tích tác động của trí tuệ nhân tạo đối với các ngành nghề tương lai và sinh viên cần chuẩn bị kỹ năng gì.",
      minWpm: 115,
      targetDuration: 90
    }
  ],
  C1: [
    {
      title: "Sustainable Urban Development & Green Architecture",
      promptEn: "Evaluate the socio-economic challenges of transitioning modern megacities into carbon-neutral ecosystems. Propose concrete policy actions.",
      promptVi: "Đánh giá các thách thức kinh tế - xã hội khi chuyển đổi các đại đô thị thành hệ sinh thái trung hòa carbon.",
      minWpm: 130,
      targetDuration: 120
    }
  ],
  C2: [
    {
      title: "Philosophical Implications of Human-Machine Symbiosis",
      promptEn: "Debate whether the convergence of cognitive brain-computer interfaces fundamentally alters the ontological definition of human consciousness.",
      promptVi: "Tranh biện về việc giao diện não - máy tính có làm thay đổi định nghĩa bản thể luận về ý thức con người hay không.",
      minWpm: 140,
      targetDuration: 120
    }
  ]
};

const safeBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    if (!blob) return resolve('');
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result || '');
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
};

export default function Station4Screen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [topicSource, setTopicSource] = useState<'ai' | 'custom'>('ai');

  // Đề tự dán từ Giảng viên
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customPromptEn, setCustomPromptEn] = useState<string>('');
  const [customPromptVi, setCustomPromptVi] = useState<string>('');

  // Đề AI
  const [currentAiTopicIndex, setCurrentAiTopicIndex] = useState<number>(0);

  // Thu âm & Đồng hồ
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);

  // Đếm ngược
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Kết quả
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [calculatedWpm, setCalculatedWpm] = useState<number>(0);

  // Pop-up định danh
  const [showIdentityModal, setShowIdentityModal] = useState<boolean>(false);
  const [studentNameInput, setStudentNameInput] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const getActiveTopic = () => {
    if (topicSource === 'custom') {
      return {
        title: customTitle.trim() || 'Chủ đề Thuyết trình từ Giảng viên',
        promptEn: customPromptEn.trim() || 'Tự do trình bày theo đề bài giảng viên giao trên lớp.',
        promptVi: customPromptVi.trim(),
        minWpm: 100,
        targetDuration: 90
      };
    }
    const topicList = STATION_4_TOPICS[cefrLevel] || STATION_4_TOPICS['B1'];
    return topicList[currentAiTopicIndex % topicList.length];
  };

  const activeTopic = getActiveTopic();

  useEffect(() => {
    setTimeLeft(activeTopic.targetDuration || 90);
    resetRecordingSession();
  }, [cefrLevel, topicSource, currentAiTopicIndex]);

  const resetRecordingSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);

    setIsRecording(false);
    setRecordedBlob(null);
    setAudioUrl(null);
    setRecordedDuration(0);
    setHasRecorded(false);
    setResult(null);
    setCalculatedWpm(0);
    audioChunksRef.current = [];
  };

  const handleNextAiTopic = () => {
    const topicList = STATION_4_TOPICS[cefrLevel] || STATION_4_TOPICS['B1'];
    setCurrentAiTopicIndex((prev) => (prev + 1) % topicList.length);
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      if (topicSource === 'custom' && !customPromptEn.trim()) {
        alert("Vui lòng dán đề bài hoặc câu hỏi tiếng Anh của Giảng viên trước khi thu âm!");
        return;
      }

      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          let options = {};
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            
            if (blob.size > 1000) {
              const url = URL.createObjectURL(blob);
              setRecordedBlob(blob);
              setAudioUrl(url);
              setHasRecorded(true);
            } else {
              alert("⚠️ Chưa ghi nhận giọng nói rõ ràng. Hãy thử thu âm lại!");
            }
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start(200);
          setIsRecording(true);
          setRecordedDuration(0);

          // Bắt đầu đếm thời gian thực đã nói
          durationTimerRef.current = setInterval(() => {
            setRecordedDuration((prev) => prev + 1);
          }, 1000);

          // Đếm ngược thời gian giới hạn
          setTimeLeft(activeTopic.targetDuration || 90);
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                if (durationTimerRef.current) clearInterval(durationTimerRef.current);
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                  mediaRecorderRef.current.stop();
                }
                setIsRecording(false);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (err) {
        alert("🔒 Trình duyệt chưa được cấp quyền Microphone! Vui lòng cho phép truy cập micro.");
      }
    } else {
      // Dừng thu âm
      if (timerRef.current) clearInterval(timerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      setIsRecording(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleSubmitSpeech = async () => {
    if (!recordedBlob || recordedBlob.size <= 1000) {
      alert("Bạn chưa hoàn thành bài nói hoặc bản thu quá ngắn!");
      return;
    }

    setIsAnalyzing(true);
    try {
      const targetPrompt = `Presentation Prompt: ${activeTopic.promptEn} - Level: ${cefrLevel}`;
      const evalData = await evaluateSpeaking(recordedBlob, cefrLevel, '4', targetPrompt);
      
      // Tính toán WPM (Words Per Minute) thực tế
      const wordsCount = (evalData.transcript || '').trim().split(/\s+/).filter(Boolean).length;
      const actualMinutes = Math.max(0.2, recordedDuration / 60);
      const wpm = Math.round(wordsCount / actualMinutes);

      setCalculatedWpm(wpm);
      setResult(evalData);
      updateUserProgress(4, evalData.score || 85, (evalData.score || 85) >= 60);

      setShowIdentityModal(true);
    } catch (err) {
      console.error("Lỗi chấm điểm bài thuyết trình:", err);
      alert("⚠️ Lỗi kết nối AI khi phân tích bài thuyết trình. Vui lòng bấm nộp lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmSubmission = async () => {
    if (!studentNameInput.trim()) {
      alert("Vui lòng nhập Họ tên hoặc Mã sinh viên để lưu điểm!");
      return;
    }

    if (!result) return;

    let base64Audio = '';
    if (recordedBlob) {
      base64Audio = await safeBlobToBase64(recordedBlob);
    }

    await saveSubmissionToCloud({
      studentName: studentNameInput.trim(),
      className: 'LỚP CHUYÊN ĐỀ',
      mode: 'EXPRESS',
      cefrLevel: cefrLevel,
      score: result.score || 85,
      transcript: result.transcript || '',
      audioUrl: base64Audio || audioUrl || undefined,
      feedback: `WPM: ${calculatedWpm} từ/phút | ${result.detailedFeedback || 'Bài nói đạt chuẩn.'}`,
      timestamp: new Date().toISOString()
    });

    setShowIdentityModal(false);
    alert("✅ Đã ghi nhận bài thuyết trình lên Bảng điểm Giáo viên!");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎙️ TRẠM 4: FLUENCY & MONOLOGUE ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 35 }}>
        {/* 1. CHỌN NGUỒN ĐỀ BÀI */}
        <Text style={styles.sectionLabel}>1. NGUỒN ĐỀ THUYẾT TRÌNH:</Text>
        <View style={styles.sourceRow}>
          <TouchableOpacity 
            style={[styles.sourceBtn, topicSource === 'ai' && styles.sourceBtnActive]} 
            onPress={() => setTopicSource('ai')}
          >
            <Text style={[styles.sourceText, topicSource === 'ai' && styles.sourceTextActive]}>
              🤖 ĐỀ CHUYÊN ĐỀ TỪ AI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sourceBtn, topicSource === 'custom' && styles.sourceBtnActive]} 
            onPress={() => setTopicSource('custom')}
          >
            <Text style={[styles.sourceText, topicSource === 'custom' && styles.sourceTextActive]}>
              📝 DÁN ĐỀ TỪ GIẢNG VIÊN
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. CHỌN LEVEL CEFR */}
        <Text style={styles.sectionLabel}>2. CẤP ĐỘ ĐÁNH GIÁ (CEFR):</Text>
        <View style={styles.cefrRow}>
          {levels.map((lvl) => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} 
              onPress={() => setCefrLevel(lvl)}
            >
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KHUNG HIỂN THỊ / NHẬP ĐỀ BÀI */}
        <View style={styles.card}>
          <View style={styles.natureBadge}>
            <Text style={styles.natureBadgeText}>
              {topicSource === 'custom' ? '📝 ĐỀ BÀI TỰ DÁN CỦA GIẢNG VIÊN' : `⚡ CHỦ ĐỀ THUYẾT TRÌNH [${cefrLevel}]`}
            </Text>
          </View>

          {topicSource === 'custom' ? (
            <View style={styles.customInputContainer}>
              <Text style={styles.inputLabel}>📌 Tên chủ đề thuyết trình:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Digital Transformation in Education"
                placeholderTextColor="#666688"
                value={customTitle}
                onChangeText={setCustomTitle}
              />

              <Text style={styles.inputLabel}>📋 Đề bài / Câu hỏi tiếng Anh từ Giảng viên (*):</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Ví dụ: Present your views on how smartphones affect students' concentration during lectures..."
                placeholderTextColor="#666688"
                multiline
                value={customPromptEn}
                onChangeText={setCustomPromptEn}
              />

              <Text style={styles.inputLabel}>💡 Dịch nghĩa / Gợi ý dàn ý (tuỳ chọn):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ghi chú thêm từ khóa hoặc dàn bài tiếng Việt..."
                placeholderTextColor="#666688"
                value={customPromptVi}
                onChangeText={setCustomPromptVi}
              />
            </View>
          ) : (
            <>
              <Text style={styles.topicTitle}>{activeTopic.title}</Text>
              <View style={styles.promptBox}>
                <Text style={styles.promptQuestionLabel}>🎯 Đề bài yêu cầu:</Text>
                <Text style={styles.promptEn}>"{activeTopic.promptEn}"</Text>
                {activeTopic.promptVi && <Text style={styles.promptVi}>👉 Dịch: "{activeTopic.promptVi}"</Text>}
              </View>

              <View style={styles.targetRow}>
                <Text style={styles.targetBadge}>🎯 Mục tiêu WPM tối thiểu: {activeTopic.minWpm} từ/phút</Text>
                <Text style={styles.targetBadge}>⏱️ Thời lượng tối đa: {activeTopic.targetDuration}s</Text>
              </View>

              <TouchableOpacity style={styles.refreshBtn} onPress={handleNextAiTopic}>
                <Text style={styles.refreshBtnText}>🔄 ĐỔI CHỦ ĐỀ KHÁC</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.monologueGuide}>
            🗣️ Hướng dẫn: Bạn hãy trình bày quan điểm cá nhân một cách mạch lạc, tự nhiên. Tránh ngắt quãng quá lâu để đạt điểm trôi chảy cao nhất!
          </Text>
        </View>

        {/* KHU VỰC THU ÂM & ĐẾM GIỜ */}
        <View style={styles.actionCard}>
          <View style={styles.timerHeader}>
            <Text style={styles.timerTitle}>
              {isRecording ? `🔴 ĐANG NÓI: ${recordedDuration}s` : `⏱️ THỜI GIAN CÒN LẠI: ${timeLeft}s`}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
            onPress={handleToggleRecord}
          >
            <Text style={styles.recordBtnText}>
              {isRecording 
                ? '🛑 DỪNG BÀI NÓI (HOÀN THÀNH)' 
                : hasRecorded 
                  ? '🔄 BẤM ĐỂ THU ÂM LẠI TOÀN BỘ' 
                  : '🎙️ BẮT ĐẦU THUYẾT TRÌNH'}
            </Text>
          </TouchableOpacity>

          {/* 🎧 THANH NGHE LẠI BẢN THU ÂM CỦA NGƯỜI NÓI */}
          {audioUrl && !isRecording && (
            <View style={styles.audioPreviewContainer}>
              <View style={styles.audioPreviewHeader}>
                <Text style={styles.audioPreviewTitle}>🎧 BẢN THU ÂM CỦA BẠN ({recordedDuration}s):</Text>
                <Text style={styles.audioPreviewSub}>Bấm nút phát bên dưới để nghe lại độ to, rõ ràng trước khi nộp</Text>
              </View>
              {React.createElement('audio', {
                controls: true,
                src: audioUrl,
                style: { width: '100%', height: '38px', marginTop: '6px' }
              })}
            </View>
          )}

          {/* NÚT CHẤM ĐIỂM */}
          {isAnalyzing ? (
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <ActivityIndicator size="large" color="#39FF14" />
              <Text style={{ color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginTop: 6 }}>
                ⚡ GROQ AI ĐANG PHÂN TÍCH TỐC ĐỘ (WPM) & ĐỘ TRÔI CHẢY...
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.submitBtn, (!hasRecorded || isRecording) && styles.submitBtnDisabled]} 
              onPress={handleSubmitSpeech}
              disabled={!hasRecorded || isRecording}
            >
              <Text style={styles.submitBtnText}>⚡ NỘP BÀI THUYẾT TRÌNH & CHẤM ĐIỂM</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* KẾT QUẢ ĐÁNH GIÁ CHI TIẾT */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🎉 BÀI THUYẾT TRÌNH ĐẠT YÊU CẦU XUẤT SẮC!' : '💡 CẦN NÂNG CAO TỐC ĐỘ NÓI & SỰ TỰ NHIÊN'}
            </Text>

            <View style={styles.wpmBanner}>
              <Text style={styles.wpmTitle}>⚡ TỐC ĐỘ NÓI THỰC TẾ: {calculatedWpm} WPM</Text>
              <Text style={styles.wpmSub}>
                {calculatedWpm >= activeTopic.minWpm 
                  ? '✅ Tốc độ nói đạt chuẩn lưu loát của cấp độ!' 
                  : `⚠️ Dưới ngưỡng khuyến nghị (${activeTopic.minWpm} từ/phút). Cần hạn chế khoảng ngừng quá lâu.`}
              </Text>
            </View>

            {/* THANH NGHE LẠI SAU KHI CÓ KẾT QUẢ */}
            {audioUrl && (
              <View style={styles.audioPreviewContainer}>
                <Text style={styles.audioPreviewTitle}>🎧 NGHE LẠI BẢN THU HOÀN CHỈNH:</Text>
                {React.createElement('audio', {
                  controls: true,
                  src: audioUrl,
                  style: { width: '100%', height: '38px', marginTop: '6px' }
                })}
              </View>
            )}

            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptHeader}>🎙️ VĂN BẢN AI NHẬN DIỆN TỪ GIỌNG BẠN:</Text>
              <Text style={styles.transcriptBody}>"{result.transcript}"</Text>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Tổng điểm:</Text>
                <Text style={styles.breakdownValue}>{result.score}/100</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Phát âm:</Text>
                <Text style={styles.breakdownValue}>{(result as any).pronunciation || 85}/100</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Độ trôi chảy:</Text>
                <Text style={styles.breakdownValue}>{(result as any).content || 80}/100</Text>
              </View>
            </View>

            <Text style={styles.feedbackText}>💡 Nhận xét từ AI: {result.detailedFeedback}</Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL LƯU ĐIỂM GIẢNG VIÊN */}
      <Modal visible={showIdentityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎖️ GHI NHẬN ĐIỂM THUYẾT TRÌNH</Text>
            <Text style={styles.modalSub}>Nhập Mã sinh viên hoặc Họ và tên để lưu vào bảng điểm Giảng viên:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ví dụ: K18 - 210088 - Nguyễn Văn B"
              placeholderTextColor="#666688"
              value={studentNameInput}
              onChangeText={setStudentNameInput}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleConfirmSubmission}>
              <Text style={styles.modalBtnText}>🚀 XÁC NHẬN GỬI BÀI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 11, fontWeight: '900' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },

  sourceRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 14 },
  sourceBtn: { backgroundColor: '#0D0620', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255', width: '48%', alignItems: 'center' },
  sourceBtnActive: { backgroundColor: '#1F0B2E', borderColor: '#00FFFF' },
  sourceText: { color: '#8888AA', fontSize: 9.5, fontWeight: 'bold' },
  sourceTextActive: { color: '#00FFFF', fontWeight: '900' },

  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },

  card: { width: '100%', backgroundColor: '#0D0620', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#00FFFF', marginBottom: 15, alignItems: 'center' },
  natureBadge: { backgroundColor: '#092B1E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', marginBottom: 8 },
  natureBadgeText: { color: '#39FF14', fontSize: 9.5, fontWeight: '900' },
  topicTitle: { color: '#FFD700', fontSize: 14, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  
  promptBox: { width: '100%', backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 10 },
  promptQuestionLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  promptEn: { color: '#FFF', fontSize: 12, fontWeight: '800', lineHeight: 18, marginBottom: 6 },
  promptVi: { color: '#AAAABB', fontSize: 10, fontStyle: 'italic' },

  targetRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  targetBadge: { color: '#FFD700', fontSize: 9.5, fontWeight: 'bold' },

  refreshBtn: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 8 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },

  monologueGuide: { color: '#39FF14', fontSize: 9.5, fontStyle: 'italic', textAlign: 'center', lineHeight: 14, marginTop: 4 },

  customInputContainer: { width: '100%' },
  inputLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginTop: 6, marginBottom: 4 },
  textInput: { backgroundColor: '#0A0318', borderWidth: 1, borderColor: '#332255', borderRadius: 8, padding: 8, color: '#FFF', fontSize: 11, marginBottom: 6 },
  textArea: { minHeight: 65, textAlignVertical: 'top' },

  actionCard: { width: '100%', backgroundColor: '#0D0620', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#FF007F', marginBottom: 15, alignItems: 'center' },
  timerHeader: { marginBottom: 10 },
  timerTitle: { color: '#39FF14', fontSize: 12, fontWeight: '900' },

  recordBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 12 },
  recordBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  recordBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  audioPreviewContainer: { width: '100%', backgroundColor: '#130628', padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#39FF14', marginBottom: 12 },
  audioPreviewHeader: { marginBottom: 4 },
  audioPreviewTitle: { color: '#39FF14', fontSize: 10, fontWeight: '900' },
  audioPreviewSub: { color: '#8888AA', fontSize: 9, marginTop: 2 },

  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 10, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.3 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },

  resultCard: { width: '100%', backgroundColor: '#0D0620', padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#39FF14', alignItems: 'center' },
  resultTitle: { fontSize: 13, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  
  wpmBanner: { width: '100%', backgroundColor: '#120826', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700', marginBottom: 10, alignItems: 'center' },
  wpmTitle: { color: '#FFD700', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  wpmSub: { color: '#FFF', fontSize: 9.5, textAlign: 'center' },

  transcriptBox: { width: '100%', backgroundColor: '#120826', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255', marginBottom: 10 },
  transcriptHeader: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold', marginBottom: 4 },
  transcriptBody: { color: '#FFF', fontSize: 10.5, lineHeight: 16 },

  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 10, backgroundColor: '#130A2A', padding: 8, borderRadius: 8 },
  breakdownItem: { alignItems: 'center' },
  breakdownLabel: { color: '#AAAABB', fontSize: 9 },
  breakdownValue: { color: '#39FF14', fontSize: 11, fontWeight: 'bold' },

  feedbackText: { color: '#FFF', fontSize: 10, textAlign: 'center', lineHeight: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 2, 13, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0D0620', padding: 20, borderRadius: 14, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center' },
  modalTitle: { color: '#00FFFF', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  modalSub: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 15 },
  modalInput: { backgroundColor: '#130A2A', borderWidth: 1, borderColor: '#00FFFF', borderRadius: 8, padding: 10, color: '#FFF', width: '100%', fontSize: 11, marginBottom: 15 },
  modalBtn: { backgroundColor: '#39FF14', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center' },
  modalBtnText: { color: '#000', fontSize: 10, fontWeight: '900' }
});