// src/screens/Station4Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { updateUserProgress, saveSubmissionToCloud } from '../services/userService';
import { SPEAKING_EXPRESS_DATA, ExpressExerciseItem } from '../data/station4/speakingExpress';

interface Props {
  onBack: () => void;
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Station4TopicItem {
  id: string;
  title: string;
  challengeQuestion: string;
  guideVi?: string;
  minWpm: number;
  targetDuration: number;
  suggestedKeywords?: string[];
  expressType?: string;
  hint?: { vi: string };
}

// Chuẩn WPM và thời lượng theo khung CEFR
const CEFR_CONFIG: Record<CEFRLevel, { minWpm: number; targetDuration: number }> = {
  A1: { minWpm: 70, targetDuration: 45 },
  A2: { minWpm: 85, targetDuration: 60 },
  B1: { minWpm: 100, targetDuration: 75 },
  B2: { minWpm: 115, targetDuration: 90 },
  C1: { minWpm: 130, targetDuration: 120 },
  C2: { minWpm: 140, targetDuration: 120 },
};

const mapExpressToTopic = (item: ExpressExerciseItem, loopIndex?: number): Station4TopicItem => {
  const config = CEFR_CONFIG[item.level] || CEFR_CONFIG['B1'];
  const suffix = loopIndex && loopIndex > 15 ? ` (#${Math.floor(loopIndex / 15) + 1})` : '';
  return {
    id: item.id,
    title: `${item.title}${suffix}`,
    challengeQuestion: item.promptEn,
    guideVi: item.promptVi || '',
    minWpm: config.minWpm,
    targetDuration: item.timeLimitSeconds > 30 ? item.timeLimitSeconds : config.targetDuration,
    suggestedKeywords: item.suggestedKeywords || [],
    expressType: item.expressType,
    hint: {
      vi: item.promptVi || item.promptEn
    }
  };
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

  // 🌐 GỢI Ý THUẦN TIẾNG VIỆT
  const [showHint, setShowHint] = useState<boolean>(true);

  // Đề tự dán từ Giảng viên
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [customContextVi, setCustomContextVi] = useState<string>('');

  // 🎯 QUẢN LÝ ĐỀ BÀI VÀ HÀNG ĐỢI NẠP BÙ AI NGẦM (0MS LATENCY)
  const [topicIndex, setTopicIndex] = useState<number>(0);
  const [aiQueue, setAiQueue] = useState<Station4TopicItem[]>([]);
  const isFetchingAiRef = useRef<boolean>(false);

  const getInitialTopicForLevel = (lvl: CEFRLevel): Station4TopicItem => {
    const list = SPEAKING_EXPRESS_DATA.filter(item => item.level === lvl);
    if (list.length > 0) return mapExpressToTopic(list[0]);
    const cfg = CEFR_CONFIG[lvl];
    return {
      id: `fallback_${lvl}_0`,
      title: `Độc thoại biểu đạt [${lvl}]`,
      challengeQuestion: "Present your personal viewpoint on modern technology and daily productivity.",
      guideVi: "Trình bày quan điểm cá nhân về công nghệ và năng suất hàng ngày.",
      minWpm: cfg.minWpm,
      targetDuration: cfg.targetDuration,
      suggestedKeywords: ["technology", "productivity", "efficiency"],
      expressType: 'quick_response',
      hint: {
        vi: "Trình bày quan điểm cá nhân về công nghệ và năng suất hàng ngày."
      }
    };
  };

  const [runtimeTopic, setRuntimeTopic] = useState<Station4TopicItem>(() => getInitialTopicForLevel('B1'));

  // 🔊 BỘ PHÁT ÂM MẪU CHUẨN IOS & DESKTOP (TRẠM 4)
  const [isPlayingPromptAudio, setIsPlayingPromptAudio] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const stopPromptAudio = () => {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch (e) {}
      audioPlayerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingPromptAudio(false);
  };

  const playNaturalTTS = async (text: string) => {
    if (isPlayingPromptAudio) {
      stopPromptAudio();
      return;
    }

    const cleanText = text.replace(/["']/g, '').trim();
    if (!cleanText) return;

    stopPromptAudio();
    setIsPlayingPromptAudio(true);

    // 1. Tạo đối tượng audio đồng bộ ngay lập tức (bảo lưu User Gesture trên Safari iOS)
    const audio = new Audio();
    audioPlayerRef.current = audio;

    (audio as any).playsInline = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    const ttsUrl = `/api/tts?voice=nova&text=${encodeURIComponent(cleanText)}`;

    // 2. Lắng nghe trạng thái hoàn thành & lỗi
    audio.onended = () => {
      setIsPlayingPromptAudio(false);
      audioPlayerRef.current = null;
    };

    audio.onerror = (e) => {
      console.warn("⚠️ Không thể tải TTS từ server, kích hoạt fallback:", e);
      setIsPlayingPromptAudio(false);
      audioPlayerRef.current = null;
      fallbackIOSPromptSpeech(cleanText);
    };

    try {
      audio.src = ttsUrl;
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (e) {
      console.warn("⚠️ iOS WebKit chặn phát tự động, kích hoạt fallback:", e);
      setIsPlayingPromptAudio(false);
      audioPlayerRef.current = null;
      fallbackIOSPromptSpeech(cleanText);
    }
  };

  // 🛡️ BỘ DỰ PHÒNG NỘI BỘ TỐI ƯU CHO IOS SAFARI
  const fallbackIOSPromptSpeech = (cleanText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingPromptAudio(false);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synth.getVoices();
    
    const iosVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Natural') || v.name.includes('Aria') || v.name.includes('Google US English'))
    );
    if (iosVoice) utterance.voice = iosVoice;

    utterance.lang = 'en-US';
    utterance.rate = 0.90;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingPromptAudio(true);
    utterance.onend = () => setIsPlayingPromptAudio(false);
    utterance.onerror = () => setIsPlayingPromptAudio(false);

    synth.speak(utterance);
  };

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

  const getActiveTopic = (): Station4TopicItem => {
    if (topicSource === 'custom') {
      const cfg = CEFR_CONFIG[cefrLevel] || CEFR_CONFIG['B1'];
      return {
        id: 'custom_express',
        title: customTitle.trim() || 'Chủ đề giảng viên giao',
        challengeQuestion: customQuestion.trim() || 'Deliver spontaneous monologue based on the classroom topic.',
        guideVi: customContextVi.trim(),
        minWpm: cfg.minWpm,
        targetDuration: cfg.targetDuration,
        suggestedKeywords: [],
        expressType: 'custom',
        hint: {
          vi: customContextVi.trim() || customTitle.trim()
        }
      };
    }
    return runtimeTopic;
  };

  const activeTopic = getActiveTopic();

  useEffect(() => {
    stopPromptAudio();
    if (topicSource === 'ai') {
      const initial = getInitialTopicForLevel(cefrLevel);
      setRuntimeTopic(initial);
      setTopicIndex(0);
      setAiQueue([]);
      triggerBackgroundAiRefill(cefrLevel);
    }
  }, [cefrLevel, topicSource]);

  useEffect(() => {
    setTimeLeft(activeTopic.targetDuration || 90);
    resetRecordingSession();
  }, [activeTopic.id, cefrLevel, topicSource]);

  useEffect(() => {
    return () => {
      stopPromptAudio();
    };
  }, []);

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

  // 🤖 BACKGROUND AI REFILL QUA SERVERLESS API BẢO MẬT
  const triggerBackgroundAiRefill = async (level: CEFRLevel) => {
    if (isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      const cfg = CEFR_CONFIG[level] || CEFR_CONFIG['B1'];
      const promptInstruction = `Create 1 UNIQUE speaking express challenge question for Station 4 (Fluency & Monologue / Quick Response) at CEFR level ${level}.
Output ONLY raw JSON (no markdown):
{
  "title": "Tiêu đề ngắn gọn bằng tiếng Việt",
  "challengeQuestion": "The English prompt or question triggering spontaneous monologue",
  "hintVi": "Tóm tắt gợi ý dịch nghĩa hoặc hướng dẫn bằng tiếng Việt",
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"],
  "expressType": "quick_response"
}`;

      const res = await fetch('/api/generate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptInstruction }),
      });

      if (res.ok) {
        const content = await res.json();
        const newAiTopic: Station4TopicItem = {
          id: `ai_${Date.now()}_${Math.random()}`,
          title: `🤖 [AI] ${content.title}`,
          challengeQuestion: content.challengeQuestion,
          guideVi: content.hintVi || '',
          minWpm: cfg.minWpm,
          targetDuration: cfg.targetDuration,
          suggestedKeywords: content.suggestedKeywords || [],
          expressType: content.expressType || 'quick_response',
          hint: {
            vi: content.hintVi || content.challengeQuestion
          }
        };
        setAiQueue(prev => [...prev, newAiTopic]);
      }
    } catch (e) {
      console.warn("AI ngầm Trạm 4 tạm dừng:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  // ⚡ 0MS ROTATION & REFILL HOOK
  const handleNextAiTopic = () => {
    stopPromptAudio();
    resetRecordingSession();
    const nextIdx = topicIndex + 1;
    setTopicIndex(nextIdx);

    if (aiQueue.length > 0) {
      const [nextAiTopic, ...restQueue] = aiQueue;
      setAiQueue(restQueue);
      setRuntimeTopic(nextAiTopic);
      triggerBackgroundAiRefill(cefrLevel);
      return;
    }

    const presetList = SPEAKING_EXPRESS_DATA.filter(item => item.level === cefrLevel);
    if (presetList.length > 0) {
      const rawItem = presetList[nextIdx % presetList.length];
      const mapped = mapExpressToTopic(rawItem, nextIdx);
      setRuntimeTopic(mapped);
    }

    triggerBackgroundAiRefill(cefrLevel);
  };

  const handleToggleRecord = async () => {
    stopPromptAudio();
    if (!isRecording) {
      if (topicSource === 'custom' && !customQuestion.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập câu hỏi thử thách tiếng Anh trước khi ghi âm!");
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
              Alert.alert("Thông báo", "⚠️ Không ghi nhận được giọng nói rõ ràng. Vui lòng ghi âm lại!");
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
        Alert.alert("Lỗi Microphone", "🔒 Vui lòng cấp quyền micro trên trình duyệt của bạn!");
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
    stopPromptAudio();
    if (!recordedBlob || recordedBlob.size <= 1000) {
      Alert.alert("Thông báo", "Bản ghi âm trống hoặc quá ngắn!");
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

      // ⚡ TÍNH ĐIỂM TỐC ĐỘ WPM
      const targetMinWpm = activeTopic.minWpm || 100;
      const wpmRatio = wpm / targetMinWpm;
      
      let wpmScore = 0;
      if (wpmRatio >= 1.15) {
        wpmScore = 100;
      } else if (wpmRatio >= 1.0) {
        wpmScore = Math.round(90 + (wpmRatio - 1.0) * 66);
      } else if (wpmRatio >= 0.75) {
        wpmScore = Math.round(75 + (wpmRatio - 0.75) * 60);
      } else {
        wpmScore = Math.max(30, Math.round(wpmRatio * 100));
      }

      const baseAiScore = evalData.score || 85;
      const dynamicTotalScore = Math.round((baseAiScore * 0.5) + (wpmScore * 0.5));

      const calibratedEvalData: AssessmentResult = {
        ...evalData,
        score: dynamicTotalScore,
        isWin: dynamicTotalScore >= 65,
        criteria: {
          pronunciation: (evalData as any).pronunciation || 85,
          fluency: wpmScore,
          content: (evalData as any).content || baseAiScore
        } as any,
        detailedFeedback: `Tốc độ phản xạ: ${wpm} WPM (Chuẩn: ${targetMinWpm} WPM) | Chỉ số lưu loát: ${wpmScore} điểm. ${evalData.detailedFeedback || ''}`
      };

      setResult(calibratedEvalData);
      updateUserProgress(4, dynamicTotalScore, dynamicTotalScore >= 65);

      setShowIdentityModal(true);
    } catch (err) {
      console.error("Express scoring error:", err);
      Alert.alert("Lỗi chấm điểm", "⚠️ Kết nối mạng trễ khi phân tích âm học. Vui lòng bấm nộp lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmSubmission = async () => {
    if (!studentNameInput.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập Họ tên hoặc Mã học viên!");
      return;
    }

    if (!result) return;

    let base64Audio = '';
    if (recordedBlob) {
      base64Audio = await safeBlobToBase64(recordedBlob);
    }

    await saveSubmissionToCloud({
      studentName: studentNameInput.trim(),
      className: 'EXPRESS MONOLOGUE COHORT',
      mode: 'EXPRESS',
      cefrLevel: cefrLevel,
      score: result.score || 85,
      transcript: result.transcript || '',
      audioUrl: base64Audio || audioUrl || undefined,
      feedback: `Tốc độ phản xạ: ${calculatedWpm} WPM | ${result.detailedFeedback || 'Đạt ngưỡng lưu loát.'}`,
      timestamp: new Date().toISOString()
    });

    setShowIdentityModal(false);
    Alert.alert("Thành công", "✅ Phiếu điểm Express đã được đồng bộ lên Bảng điều khiển Giảng viên!");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 BẢN ĐỒ</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎙️ TRẠM 4: EXPRESS (ĐẤU TRƯỜNG LƯU LOÁT & ĐỘC THOẠI)</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 35 }}>
        {/* 1. CHỌN NGUỒN ĐỀ */}
        <Text style={styles.sectionLabel}>1. CHỌN NGUỒN CHỦ ĐỀ:</Text>
        <View style={styles.sourceRow}>
          <TouchableOpacity 
            style={[styles.sourceBtn, topicSource === 'ai' && styles.sourceBtnActive]} 
            onPress={() => setTopicSource('ai')}
          >
            <Text style={[styles.sourceText, topicSource === 'ai' && styles.sourceTextActive]}>
              🤖 HỆ THỐNG & AI TẠO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sourceBtn, topicSource === 'custom' && styles.sourceBtnActive]} 
            onPress={() => setTopicSource('custom')}
          >
            <Text style={[styles.sourceText, topicSource === 'custom' && styles.sourceTextActive]}>
              📝 GIẢNG VIÊN GIAO
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. CHỌN TRÌNH ĐỘ CEFR */}
        <Text style={styles.sectionLabel}>2. TRÌNH ĐỘ CEFR MỤC TIÊU:</Text>
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

        {/* THẺ BÀI TẬP CHÍNH */}
        <View style={styles.card}>
          <View style={styles.natureBadgeRow}>
            <View style={styles.natureBadge}>
              <Text style={styles.natureBadgeText}>
                ⚡ ĐỘC THOẠI TỰ NHIÊN (KHÔNG CÓ KỊCH BẢN MẪU)
              </Text>
            </View>
            {activeTopic.expressType && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>🏷️ {activeTopic.expressType.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {topicSource === 'custom' ? (
            <View style={styles.customInputContainer}>
              <Text style={styles.inputLabel}>📌 Tên chủ đề:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Tác động của mạng xã hội tới sức khỏe tinh thần"
                placeholderTextColor="#666688"
                value={customTitle}
                onChangeText={setCustomTitle}
              />

              <Text style={styles.inputLabel}>❓ Câu hỏi thử thách tiếng Anh (*):</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Ví dụ: How does excessive social media usage impact students' academic performance and wellbeing?"
                placeholderTextColor="#666688"
                multiline
                value={customQuestion}
                onChangeText={setCustomQuestion}
              />

              <Text style={styles.inputLabel}>💡 Bối cảnh / Gợi ý hướng dẫn (Không bắt buộc):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ví dụ: Nêu quan điểm cá nhân kèm dẫn chứng cụ thể..."
                placeholderTextColor="#666688"
                value={customContextVi}
                onChangeText={setCustomContextVi}
              />
            </View>
          ) : (
            <>
              <Text style={styles.topicTitle}>{activeTopic.title}</Text>
              
              <View style={styles.promptBox}>
                <View style={styles.promptHeaderRow}>
                  <Text style={styles.promptQuestionLabel}>❓ Câu hỏi phản xạ tư duy:</Text>
                  <TouchableOpacity 
                    style={[styles.ttsMiniBtn, isPlayingPromptAudio && styles.ttsMiniBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => playNaturalTTS(activeTopic.challengeQuestion)}
                  >
                    <Text style={styles.ttsMiniBtnText}>
                      {isPlayingPromptAudio ? '⏹ DỪNG' : '🔊 NGHE CÂU HỎI'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.promptEn}>"{activeTopic.challengeQuestion}"</Text>

                {/* 🇻🇳 HỘP GỢI Ý THUẦN TIẾNG VIỆT (ĐÃ LƯỢC BỎ THANH CHỌN CỜ) */}
                <View style={styles.hintContainer}>
                  <View style={styles.hintHeaderRow}>
                    <TouchableOpacity 
                      style={[styles.hintToggleBtn, showHint && styles.hintToggleBtnActive]} 
                      onPress={() => setShowHint(prev => !prev)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.hintToggleText, showHint ? { color: '#000000' } : { color: '#FFD700' }]}>
                        {showHint ? '✕ ẨN GỢI Ý NGHĨA' : '💡 XEM GỢI Ý NGHĨA TIẾNG VIỆT'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showHint && (
                    <View style={styles.hintContentBox}>
                      <Text style={styles.hintLanguageTag}>
                        👉 🇻🇳 Dịch nghĩa gợi ý:
                      </Text>
                      <Text style={styles.hintBodyText}>
                        "{activeTopic.hint?.vi || activeTopic.guideVi || activeTopic.challengeQuestion}"
                      </Text>
                    </View>
                  )}
                </View>

                {/* TỪ KHÓA GỢI Ý */}
                {activeTopic.suggestedKeywords && activeTopic.suggestedKeywords.length > 0 && (
                  <View style={styles.keywordContainer}>
                    <Text style={styles.keywordLabel}>🔑 Từ khóa mục tiêu gợi ý:</Text>
                    <View style={styles.keywordWrap}>
                      {activeTopic.suggestedKeywords.map((kw, i) => (
                        <View key={i} style={styles.keywordBadge}>
                          <Text style={styles.keywordText}>#{kw}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.targetRow}>
                <Text style={styles.targetBadge}>🎯 Chuẩn tốc độ: {activeTopic.minWpm} WPM</Text>
                <Text style={styles.targetBadge}>⏱️ Thời lượng: {activeTopic.targetDuration}s</Text>
              </View>

              {/* NÚT ĐỔI ĐỀ (0MS) */}
              <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.7} onPress={handleNextAiTopic}>
                <Text style={styles.refreshBtnText}>🔄 ĐỔI TÌNH HUỐNG TIẾP THEO (0MS)</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.monologueGuide}>
            👉 Không có kịch bản mẫu! Hãy tổng hợp luận điểm và trình bày độc thoại lưu loát bằng tiếng Anh. Giữ nhịp nói đều đặn để tối ưu hóa điểm số Lưu loát & WPM.
          </Text>
        </View>

        {/* THẺ THU ÂM & ĐẾM THỜI GIAN */}
        <View style={styles.actionCard}>
          <View style={styles.timerHeader}>
            <Text style={styles.timerTitle}>
              {isRecording ? `🔴 THỜI GIAN ĐÃ NÓI: ${recordedDuration}s` : `⏱️ THỜI GIAN CÒN LẠI: ${timeLeft}s`}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
            onPress={handleToggleRecord}
          >
            <Text style={styles.recordBtnText}>
              {isRecording 
                ? '🛑 DỪNG THU ÂM (HOÀN THÀNH BÀI NÓI)' 
                : hasRecorded 
                  ? '🔄 THU ÂM LẠI ĐỂ TĂNG TỐC ĐỘ WPM' 
                  : '🎙️ BẮT ĐẦU ĐỘC THOẠI PHẢN XẠ'}
            </Text>
          </TouchableOpacity>

          {/* XEM LẠI BẢN THU */}
          {audioUrl && !isRecording && (
            <View style={styles.audioPreviewContainer}>
              <View style={styles.audioPreviewHeader}>
                <Text style={styles.audioPreviewTitle}>🎧 NGHE LẠI BẢN THU ÂM ({recordedDuration}s):</Text>
                <Text style={styles.audioPreviewSub}>Kiểm tra độ rõ của âm thanh, tốc độ phát âm và khoảng dừng trước khi nộp bài</Text>
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
                ⚡ GROQ AI ĐANG TÍNH TOÁN TỐC ĐỘ WPM VÀ CHỈ SỐ LƯU LOÁT...
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.submitBtn, (!hasRecorded || isRecording) && styles.submitBtnDisabled]} 
              onPress={handleSubmitSpeech}
              disabled={!hasRecorded || isRecording}
            >
              <Text style={styles.submitBtnText}>⚡ NỘP BÀI EXPRESS ĐỂ AI CHẤM ĐIỂM</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* THẺ KẾT QUẢ ĐÁNH GIÁ */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: result.isWin ? '#39FF14' : '#FF0055' }]}>
              {result.isWin ? '🎉 PHẢN XẠ ĐỘC THOẠI XUẤT SẮC!' : '💡 CẦN NÂNG CAO TỐC ĐỘ NÓI VÀ TÍNH LIÊN TỤC'}
            </Text>

            <View style={styles.wpmBanner}>
              <Text style={styles.wpmTitle}>⚡ TỐC ĐỘ NÓI THỰC TẾ: {calculatedWpm} WPM</Text>
              <Text style={styles.wpmSub}>
                {calculatedWpm >= activeTopic.minWpm 
                  ? '✅ Tốc độ nói đạt chuẩn lưu loát theo khung CEFR!' 
                  : `⚠️ Tốc độ nói hiện đang dưới chuẩn đề xuất (${activeTopic.minWpm} WPM). Hãy giảm các khoảng dừng ngập ngừng để tăng điểm lưu loát.`}
              </Text>
            </View>

            {audioUrl && (
              <View style={styles.audioPreviewContainer}>
                <Text style={styles.audioPreviewTitle}>🎧 BẢN THU ÂM ĐÃ NỘP:</Text>
                {React.createElement('audio', {
                  controls: true,
                  src: audioUrl,
                  style: { width: '100%', height: '38px', marginTop: '6px' }
                })}
              </View>
            )}

            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptHeader}>🎙️ AI ACOUSTIC RECOGNITION TAPESCRIPT:</Text>
              <Text style={styles.transcriptBody}>"{result.transcript}"</Text>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Điểm tổng hợp:</Text>
                <Text style={styles.breakdownValue}>{result.score}/100</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Phát âm:</Text>
                <Text style={styles.breakdownValue}>{(result as any).pronunciation || 85}/100</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Lưu loát:</Text>
                <Text style={styles.breakdownValue}>{(result as any).criteria?.fluency || (result as any).content || 80}/100</Text>
              </View>
            </View>

            <Text style={styles.feedbackText}>💡 Nhận xét chi tiết: {result.detailedFeedback}</Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL LƯU PHIẾU ĐIỂM */}
      <Modal visible={showIdentityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎖️ LƯU BẢNG ĐIỂM EXPRESS</Text>
            <Text style={styles.modalSub}>Nhập Mã học viên hoặc Họ tên của bạn để đồng bộ lên Bảng điều khiển Giảng viên:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ví dụ: K18 - 210088 - Nguyễn Văn A"
              placeholderTextColor="#666688"
              value={studentNameInput}
              onChangeText={setStudentNameInput}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleConfirmSubmission}>
              <Text style={styles.modalBtnText}>🚀 XÁC NHẬN & ĐỒNG BỘ BÀI NỘP</Text>
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
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
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
  natureBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap', justifyContent: 'center' },
  natureBadge: { backgroundColor: '#092B1E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14' },
  natureBadgeText: { color: '#39FF14', fontSize: 9, fontWeight: '900' },
  typeBadge: { backgroundColor: '#1F0B2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#00FFFF' },
  typeBadgeText: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },

  topicTitle: { color: '#FFD700', fontSize: 13.5, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  
  promptBox: { width: '100%', backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 10 },
  promptHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  promptQuestionLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  ttsMiniBtn: { backgroundColor: '#1E0B36', borderWidth: 1.2, borderColor: '#00FFFF', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  ttsMiniBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  ttsMiniBtnText: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },

  promptEn: { color: '#FFF', fontSize: 12, fontWeight: '800', lineHeight: 18, marginBottom: 8 },

  hintContainer: {
    marginVertical: 6,
    width: '100%',
  },
  hintHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintToggleBtn: {
    backgroundColor: '#16082F',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  hintToggleBtnActive: {
    backgroundColor: '#FFD700',
  },
  hintToggleText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  hintContentBox: {
    backgroundColor: '#07180D',
    borderLeftWidth: 3,
    borderLeftColor: '#39FF14',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
  },
  hintLanguageTag: {
    color: '#39FF14',
    fontSize: 9.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  hintBodyText: {
    color: '#88FFBB',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  keywordContainer: { borderTopWidth: 1, borderTopColor: '#221144', paddingTop: 6, marginTop: 6 },
  keywordLabel: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  keywordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  keywordBadge: { backgroundColor: '#0A192F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#00FFFF' },
  keywordText: { color: '#00FFFF', fontSize: 8.5 },

  targetRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  targetBadge: { color: '#FFD700', fontSize: 9.5, fontWeight: 'bold' },

  refreshBtn: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 8 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10.5, fontWeight: 'bold' },

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