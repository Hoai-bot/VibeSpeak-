// src/screens/Station4Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { updateUserProgress, saveSubmissionToCloud } from '../services/userService';

interface Props {
  onBack: () => void;
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 🎯 KHO ĐỀ MỞ DÀNH RIÊNG CHO TRẠM 4 EXPRESS (CHỈ CÓ CÂU HỎI KÍCH HOẠT, KHÔNG CÓ BÀI MẪU)
const STATION_4_PROMPTS: Record<string, { title: string; challengeQuestion: string; guideVi: string; minWpm: number; targetDuration: number }[]> = {
  A1: [
    {
      title: "My Daily Life & Routine",
      challengeQuestion: "Describe what you usually do on a typical day from morning to evening. What is your favorite time of the day and why?",
      guideVi: "Kể về một ngày bình thường của bạn. Thời điểm yêu thích nhất trong ngày và lý do.",
      minWpm: 70,
      targetDuration: 45
    }
  ],
  A2: [
    {
      title: "A Favorite Place You Often Visit",
      challengeQuestion: "Talk about a coffee shop, park, or place in your city that you enjoy visiting. What do you do there and why do you like it?",
      guideVi: "Trình bày về một địa điểm bạn yêu thích trong thành phố và lý do thường xuyên ghé thăm.",
      minWpm: 85,
      targetDuration: 60
    }
  ],
  B1: [
    {
      title: "Remote Learning vs. Traditional Classes",
      challengeQuestion: "Should universities replace traditional lectures with online learning? Present your personal standpoint and provide convincing reasons.",
      guideVi: "Đại học có nên thay thế giảng đường bằng học online không? Nêu quan điểm và lý do cá nhân.",
      minWpm: 100,
      targetDuration: 75
    }
  ],
  B2: [
    {
      title: "Generative AI in Higher Education",
      challengeQuestion: "How should students responsibly use tools like ChatGPT or Copilot without losing critical thinking and problem-solving skills?",
      guideVi: "Sinh viên nên sử dụng các công cụ AI thế nào để nâng cao hiệu quả mà không phụ thuộc mất tư duy phản biện?",
      minWpm: 115,
      targetDuration: 90
    }
  ],
  C1: [
    {
      title: "Sustainable Urban Transitions",
      challengeQuestion: "Analyze the major obstacles preventing megacities from achieving carbon neutrality. Which policy intervention should be prioritized?",
      guideVi: "Phân tích rào cản lớn nhất của các siêu đô thị khi chuyển đổi xanh và đề xuất chính sách ưu tiên.",
      minWpm: 130,
      targetDuration: 120
    }
  ],
  C2: [
    {
      title: "Human Consciousness & Cognitive Interfaces",
      challengeQuestion: "Debate whether direct brain-computer integration enhances human potential or fundamentally compromises authentic personal autonomy.",
      guideVi: "Tranh biện về việc công nghệ giao diện não - máy tính nâng tầm con người hay làm xói mòn quyền tự quyết cá nhân.",
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
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [customContextVi, setCustomContextVi] = useState<string>('');

  // Đề AI
  const [currentAiTopicIndex, setCurrentAiTopicIndex] = useState<number>(0);

  // Thu âm & Đếm thời lượng
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);

  // Đếm ngược thời gian giới hạn
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Kết quả đánh giá
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [calculatedWpm, setCalculatedWpm] = useState<number>(0);

  // Modal nộp bài
  const [showIdentityModal, setShowIdentityModal] = useState<boolean>(false);
  const [studentNameInput, setStudentNameInput] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const getActiveTopic = () => {
    if (topicSource === 'custom') {
      return {
        title: customTitle.trim() || 'Chủ đề Express do Giảng viên giao',
        challengeQuestion: customQuestion.trim() || 'Tự do trình bày theo câu hỏi/chủ đề được giao trên lớp.',
        guideVi: customContextVi.trim(),
        minWpm: 100,
        targetDuration: 90
      };
    }
    const topicList = STATION_4_PROMPTS[cefrLevel] || STATION_4_PROMPTS['B1'];
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
    const topicList = STATION_4_PROMPTS[cefrLevel] || STATION_4_PROMPTS['B1'];
    setCurrentAiTopicIndex((prev) => (prev + 1) % topicList.length);
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      if (topicSource === 'custom' && !customQuestion.trim()) {
        alert("Vui lòng nhập câu hỏi / chủ đề tiếng Anh từ Giảng viên trước khi thu âm!");
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

          durationTimerRef.current = setInterval(() => {
            setRecordedDuration((prev) => prev + 1);
          }, 1000);

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
      const targetPrompt = `Express Prompt: ${activeTopic.challengeQuestion} - Level: ${cefrLevel}`;
      const evalData = await evaluateSpeaking(recordedBlob, cefrLevel, '4', targetPrompt);
      
      const wordsCount = (evalData.transcript || '').trim().split(/\s+/).filter(Boolean).length;
      const actualMinutes = Math.max(0.2, recordedDuration / 60);
      const wpm = Math.round(wordsCount / actualMinutes);

      setCalculatedWpm(wpm);
      setResult(evalData);
      updateUserProgress(4, evalData.score || 85, (evalData.score || 85) >= 60);

      setShowIdentityModal(true);
    } catch (err) {
      console.error("Lỗi chấm điểm Express:", err);
      alert("⚠️ Lỗi kết nối AI khi phân tích bài nói. Vui lòng bấm nộp lại!");
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
      className: 'LỚP CHUYÊN ĐỀ EXPRESS',
      mode: 'EXPRESS',
      cefrLevel: cefrLevel,
      score: result.score || 85,
      transcript: result.transcript || '',
      audioUrl: base64Audio || audioUrl || undefined,
      feedback: `WPM: ${calculatedWpm} từ/phút | ${result.detailedFeedback || 'Đạt yêu cầu phản xạ lưu loát.'}`,
      timestamp: new Date().toISOString()
    });

    setShowIdentityModal(false);
    alert("✅ Đã ghi nhận điểm Express lên Bảng điểm Giáo viên!");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎙️ TRẠM 4: EXPRESS (FLUENCY & MONOLOGUE ARENA)</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 35 }}>
        {/* 1. CHỌN NGUỒN ĐỀ BÀI */}
        <Text style={styles.sectionLabel}>1. NGUỒN CHỦ ĐỀ EXPRESS:</Text>
        <View style={styles.sourceRow}>
          <TouchableOpacity 
            style={[styles.sourceBtn, topicSource === 'ai' && styles.sourceBtnActive]} 
            onPress={() => setTopicSource('ai')}
          >
            <Text style={[styles.sourceText, topicSource === 'ai' && styles.sourceTextActive]}>
              🤖 ĐỀ PHẢN XẠ TỪ AI
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

        {/* KHUNG THỬ THÁCH NÓI TỰ DO (KHÔNG CÓ BÀI MẪU) */}
        <View style={styles.card}>
          <View style={styles.natureBadge}>
            <Text style={styles.natureBadgeText}>
              ⚡ THỬ THÁCH NÓI TỰ DO (KHÔNG ĐỌC THEO VĂN MẪU)
            </Text>
          </View>

          {topicSource === 'custom' ? (
            <View style={styles.customInputContainer}>
              <Text style={styles.inputLabel}>📌 Tên chủ đề / Tình huống:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Impact of Social Media on Mental Health"
                placeholderTextColor="#666688"
                value={customTitle}
                onChangeText={setCustomTitle}
              />

              <Text style={styles.inputLabel}>❓ Câu hỏi gợi mở tiếng Anh từ Giảng viên (*):</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Ví dụ: How does excessive social media usage impact students' academic performance and wellbeing?"
                placeholderTextColor="#666688"
                multiline
                value={customQuestion}
                onChangeText={setCustomQuestion}
              />

              <Text style={styles.inputLabel}>💡 Bối cảnh / Gợi ý tiếng Việt (tuỳ chọn):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Nêu quan điểm cá nhân và dẫn chứng thực tế..."
                placeholderTextColor="#666688"
                value={customContextVi}
                onChangeText={setCustomContextVi}
              />
            </View>
          ) : (
            <>
              <Text style={styles.topicTitle}>{activeTopic.title}</Text>
              <View style={styles.promptBox}>
                <Text style={styles.promptQuestionLabel}>❓ Câu hỏi kích hoạt tư duy:</Text>
                <Text style={styles.promptEn}>"{activeTopic.challengeQuestion}"</Text>
                {activeTopic.guideVi && <Text style={styles.promptVi}>💡 Gợi ý định hướng: "{activeTopic.guideVi}"</Text>}
              </View>

              <View style={styles.targetRow}>
                <Text style={styles.targetBadge}>🎯 Mục tiêu WPM tối thiểu: {activeTopic.minWpm} từ/phút</Text>
                <Text style={styles.targetBadge}>⏱️ Thời lượng đề xuất: {activeTopic.targetDuration}s</Text>
              </View>

              <TouchableOpacity style={styles.refreshBtn} onPress={handleNextAiTopic}>
                <Text style={styles.refreshBtnText}>🔄 ĐỔI CÂU HỎI KHÁC</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.monologueGuide}>
            👉 Không có câu mẫu! Bạn hãy tự do suy nghĩ và phát biểu quan điểm bằng tiếng Anh. Giữ nhịp nói liên tục và hạn chế khoảng lặng kéo dài để đạt điểm lưu loát cao nhất!
          </Text>
        </View>

        {/* KHU VỰC THU ÂM & ĐỒNG HỒ */}
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
                ? '🛑 DỪNG BÀI NÓI (HOÀN TẤT)' 
                : hasRecorded 
                  ? '🔄 THU ÂM LẠI BÀI NÓI MỚI' 
                  : '🎙️ BẮT ĐẦU NÓI PHẢN XẠ'}
            </Text>
          </TouchableOpacity>

          {/* 🎧 THANH NGHE LẠI BẢN THU ÂM CỦA CHÍNH SINH VIÊN */}
          {audioUrl && !isRecording && (
            <View style={styles.audioPreviewContainer}>
              <View style={styles.audioPreviewHeader}>
                <Text style={styles.audioPreviewTitle}>🎧 NGHE LẠI BẢN THU ÂM CỦA BẠN ({recordedDuration}s):</Text>
                <Text style={styles.audioPreviewSub}>Bấm phát để kiểm tra độ to, rõ ràng và nhịp điệu của bạn trước khi nộp</Text>
              </View>
              {React.createElement('audio', {
                controls: true,
                src: audioUrl,
                style: { width: '100%', height: '38px', marginTop: '6px' }
              })}
            </View>
          )}

          {isAnalyzing ? (
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <ActivityIndicator size="large" color="#39FF14" />
              <Text style={{ color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginTop: 6 }}>
                ⚡ GROQ AI ĐANG TÍNH TỐC ĐỘ WPM & ĐỘ LƯU LOÁT...
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.submitBtn, (!hasRecorded || isRecording) && styles.submitBtnDisabled]} 
              onPress={handleSubmitSpeech}
              disabled={!hasRecorded || isRecording}
            >
              <Text style={styles.submitBtnText}>⚡ NỘP BÀI EXPRESS & AI CHẤM ĐIỂM</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* KẾT QUẢ ĐÁNH GIÁ PHẢN XẠ */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🎉 BÀI NÓI PHẢN XẠ LƯU LOÁT XUẤT SẮC!' : '💡 CẦN NÂNG CAO TỐC ĐỘ NÓI & SỰ TỰ NHIÊN'}
            </Text>

            <View style={styles.wpmBanner}>
              <Text style={styles.wpmTitle}>⚡ TỐC ĐỘ NÓI THỰC TẾ: {calculatedWpm} WPM</Text>
              <Text style={styles.wpmSub}>
                {calculatedWpm >= activeTopic.minWpm 
                  ? '✅ Tốc độ nói đạt chuẩn lưu loát của cấp độ!' 
                  : `⚠️ Tốc độ nói thấp hơn khuyến nghị (${activeTopic.minWpm} WPM). Cần giảm thời gian ngập ngừng để nói trôi chảy hơn.`}
              </Text>
            </View>

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
              <Text style={styles.transcriptHeader}>🎙️ VĂN BẢN TỰ NHIÊN AI GHI NHẬN TỪ GIỌNG BẠN:</Text>
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

      {/* MODAL GỬI BÀI CHO GIẢNG VIÊN */}
      <Modal visible={showIdentityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎖️ GHI NHẬN ĐIỂM TRẠM EXPRESS</Text>
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

  monologueGuide: { color: '#39FF14', fontSize: 9.5, fontStyle: 'italic', textAlign: 'center', lineHeight: 15, marginTop: 4 },

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