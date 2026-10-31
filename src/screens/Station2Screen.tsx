// src/screens/Station2Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';

import { getInstantSoloTopic, generateSoloTopic } from '../services/arena/soloService';
import { getInstantRelayChallenge, generateRelayChallenge } from '../services/arena/relayService';
import { getInstantRoleplayScenario, generateRoleplayScenario } from '../services/arena/roleplayService';

import { evaluateSpeaking, AssessmentResult, analyzeSpokenTranscript } from '../services/arena/assessmentService';
import { saveSubmissionToCloud } from '../services/userService';
import { harvestWeakWords } from '../services/weakPointsService';
import { getOptimizedRecorderConfig, executeWithRetry } from '../utils/networkAudioHelper';
import { supabase } from '../utils/supabase';

interface Props {
  onBack: () => void;
}

type PlayerTurn = 1 | 2;

interface PlayerResult {
  p1Score?: number;
  p1Transcript?: string;
  p2Score?: number;
  p2Transcript?: string;
}

export default function Station2Screen({ onBack }: Props) {
  const [studentNameInput, setStudentNameInput] = useState<string>('');
  const [studentCodeInput, setStudentCodeInput] = useState<string>('');
  const [classNameInput, setClassNameInput] = useState<string>('');

  const [cefrLevel, setCefrLevel] = useState<string>('A1');
  const [mode, setMode] = useState<'solo' | 'relay' | 'roleplay'>('solo');
  const [exercise, setExercise] = useState<any>(null);

  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isUsingCustomTopic, setIsUsingCustomTopic] = useState<boolean>(false);

  // 🛡️ HÀM BÁO LỖI AN TOÀN TRÁNH NGHẼN TOUCH RESPONDER TRÊN WEB
  const safeAlert = (msg: string) => {
    setTimeout(() => {
      alert(msg);
    }, 50);
  };

  // 🎯 TÍNH THỜI GIAN THEO CẤP ĐỘ CEFR VÀ ĐỘ PHỨC TẠP CỦA CHỦ ĐỀ
  const getTimerByLevel = (level: string, currentMode: string = mode, currentExercise: any = exercise): number => {
    const lvl = level.toUpperCase();
    let baseSeconds = 20;

    if (currentMode === 'roleplay') {
      switch (lvl) {
        case 'A1': baseSeconds = 40; break;
        case 'A2': baseSeconds = 50; break;
        case 'B1': baseSeconds = 65; break;
        case 'B2': baseSeconds = 80; break;
        case 'C1': baseSeconds = 100; break;
        case 'C2': baseSeconds = 120; break;
        default: baseSeconds = 45; break;
      }
    } else if (currentMode === 'relay') {
      switch (lvl) {
        case 'A1': baseSeconds = 20; break;
        case 'A2': baseSeconds = 25; break;
        case 'B1': baseSeconds = 30; break;
        case 'B2': baseSeconds = 35; break;
        case 'C1': baseSeconds = 45; break;
        case 'C2': baseSeconds = 60; break;
        default: baseSeconds = 20; break;
      }
    } else {
      switch (lvl) {
        case 'A1': baseSeconds = 20; break;
        case 'A2': baseSeconds = 25; break;
        case 'B1': baseSeconds = 30; break;
        case 'B2': baseSeconds = 40; break;
        case 'C1': baseSeconds = 50; break;
        case 'C2': baseSeconds = 60; break;
        default: baseSeconds = 20; break;
      }
    }

    const promptText = currentExercise?.promptEn || currentExercise?.topic || customTopicInput || '';
    const wordCountInPrompt = promptText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCountInPrompt > 20) {
      baseSeconds += 15;
    } else if (wordCountInPrompt > 10) {
      baseSeconds += 8;
    }

    return baseSeconds;
  };

  const [activePlayer, setActivePlayer] = useState<PlayerTurn>(1);
  const [totalRoundsCompleted, setTotalRoundsCompleted] = useState<number>(0);
  const [turnTimer, setTurnTimer] = useState<number>(getTimerByLevel('A1', 'solo'));
  const [isGameActive, setIsGameActive] = useState<boolean>(false);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalStatusText, setEvalStatusText] = useState<string>('🤖 AI đang phân tích âm thanh & bóc tách toàn bộ lời thoại...');
  const [evalResult, setEvalResult] = useState<AssessmentResult | null>(null);
  
  const [hardwareWarning, setHardwareWarning] = useState<string | null>(null);
  const [playerScores, setPlayerScores] = useState<PlayerResult>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>('');

  const [userId, setUserId] = useState<string | undefined>(undefined);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (supabase && supabase.auth) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            setUserId(data.user.id);
            if (data.user.user_metadata?.full_name && !studentNameInput) {
              setStudentNameInput(data.user.user_metadata.full_name);
            }
          }
        }
      } catch (e) {
        console.warn("Không lấy được user ID:", e);
      }
    };
    fetchUser();
  }, []);

  // 💾 TỰ ĐỘNG KHÔI PHỤC THÔNG TIN TỪ LOCALSTORAGE
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedName = localStorage.getItem('vibe_student_name');
      const savedCode = localStorage.getItem('vibe_student_code');
      const savedClass = localStorage.getItem('vibe_student_class');

      if (savedName) setStudentNameInput(savedName);
      if (savedCode) setStudentCodeInput(savedCode);
      if (savedClass) setClassNameInput(savedClass);
    }
  }, []);

  const handleNameChange = (text: string) => {
    setStudentNameInput(text);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('vibe_student_name', text);
    }
  };

  const handleCodeChange = (text: string) => {
    setStudentCodeInput(text);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('vibe_student_code', text);
    }
  };

  const handleClassChange = (text: string) => {
    setClassNameInput(text);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('vibe_student_class', text);
    }
  };

  // 💡 GIỮ MÀN HÌNH ĐIỆN THOẠI LUÔN SÁNG
  useEffect(() => {
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        } catch (err) {}
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (wakeLockSentinel !== null) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, []);

  const handleSwitchTurn = () => {
    setActivePlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1));
    setTotalRoundsCompleted((prev) => prev + 1);
  };

  const handleSelectLevel = (lvl: string) => {
    setCefrLevel(lvl);
    setTurnTimer(getTimerByLevel(lvl, mode, exercise));
  };

  const handleSelectMode = (newMode: 'solo' | 'relay' | 'roleplay') => {
    setMode(newMode);
    setTurnTimer(getTimerByLevel(cefrLevel, newMode, exercise));
  };

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;

    if (isGameActive && isRecording) {
      if (turnTimer > 0) {
        timerInterval = setInterval(() => {
          setTurnTimer((prev) => prev - 1);
        }, 1000);
      } else if (turnTimer === 0) {
        stopFullRecordingAndEvaluate();
      }
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isGameActive, isRecording, turnTimer]);

  const handleApplyCustomTopic = () => {
    if (!customTopicInput.trim()) {
      safeAlert("⚠️ Vui lòng dán hoặc nhập nội dung chủ đề từ sách giáo khoa trước!");
      return;
    }

    const cleanInput = customTopicInput.trim();
    setIsUsingCustomTopic(true);
    setEvalResult(null);
    setHardwareWarning(null);
    setPlayerScores({});
    setIsGameActive(false);
    setActivePlayer(1);
    setTotalRoundsCompleted(0);

    const customExercise = {
      title: `📚 CHỦ ĐỀ GIÁO VIÊN YÊU CẦU [${cefrLevel}]`,
      topic: cleanInput,
      promptEn: cleanInput,
      promptVi: "Chủ đề thực hành do Giáo viên chỉ định trực tiếp.",
      player1En: "Person 1 (Hỏi / Khởi xướng)",
      player2En: "Person 2 (Trả lời / Phản hồi)",
      userRoleEn: "Vai 1 (Khởi xướng)",
      aiRoleEn: "Vai 2 (Phản hồi)",
    };

    setExercise(customExercise);
    setTurnTimer(getTimerByLevel(cefrLevel, mode, customExercise));
  };

  const handleResetToDefaultTopics = () => {
    setIsUsingCustomTopic(false);
    setCustomTopicInput('');
    loadNewExercise(mode, cefrLevel);
  };

  const loadNewExercise = async (selectedMode = mode, selectedLevel = cefrLevel) => {
    if (isUsingCustomTopic) return;

    setEvalResult(null);
    setHardwareWarning(null);
    setPlayerScores({});
    setIsGameActive(false);
    setActivePlayer(1);
    setTotalRoundsCompleted(0);

    let instantData: any = null;
    if (selectedMode === 'solo') instantData = getInstantSoloTopic(selectedLevel);
    else if (selectedMode === 'relay') instantData = getInstantRelayChallenge(selectedLevel);
    else if (selectedMode === 'roleplay') instantData = getInstantRoleplayScenario(selectedLevel);

    setExercise(instantData);
    setTurnTimer(getTimerByLevel(selectedLevel, selectedMode, instantData));

    try {
      let aiData: any = null;
      if (selectedMode === 'solo') aiData = await generateSoloTopic(selectedLevel);
      else if (selectedMode === 'relay') aiData = await generateRelayChallenge(selectedLevel);
      else if (selectedMode === 'roleplay') aiData = await generateRoleplayScenario(selectedLevel);

      if (aiData && !isUsingCustomTopic) {
        setExercise(aiData);
        setTurnTimer(getTimerByLevel(selectedLevel, selectedMode, aiData));
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!isUsingCustomTopic) {
      loadNewExercise(mode, cefrLevel);
    }
  }, [mode, cefrLevel]);

  const startFullRecording = async () => {
    if (!studentNameInput.trim()) {
      safeAlert("⚠️ Vui lòng nhập Họ tên hoặc Biệt danh của bạn ở phía trên trước khi bắt đầu!");
      return;
    }

    const safeName = studentNameInput.trim();
    const safeCode = studentCodeInput.trim() ? `MSSV: ${studentCodeInput.trim()}` : 'GUEST';
    const safeClass = classNameInput.trim() || 'LỚP CHUNG';
    const studentIdentifier = `${safeName} (${safeCode})`;

    try {
      setEvalResult(null);
      setHardwareWarning(null);
      setTurnTimer(getTimerByLevel(cefrLevel, mode, exercise));
      setTotalRoundsCompleted(0);
      setActivePlayer(1);
      audioChunksRef.current = [];
      fullTranscriptRef.current = '';

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          recognition.lang = 'en-US';

          let transcriptBuffer = '';
          recognition.onresult = (event: any) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                transcriptBuffer += event.results[i][0].transcript + ' ';
              }
            }
            if (transcriptBuffer.trim()) {
              fullTranscriptRef.current = transcriptBuffer.trim();
            }
          };

          recognition.onend = () => {
            if (isRecording && recognitionRef.current) {
              try { recognitionRef.current.start(); } catch (e) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition Android Bypass:", e);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      audioStreamRef.current = stream;

      let recorderOptions: any = {};
      let resolvedMimeType = '';

      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          resolvedMimeType = 'audio/mp4';
          recorderOptions = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          resolvedMimeType = 'audio/webm;codecs=opus';
          recorderOptions = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          resolvedMimeType = 'audio/webm';
          recorderOptions = { mimeType: 'audio/webm' };
        }
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsEvaluating(true);
        setEvalStatusText('🤖 AI đang phân tích bài nói của bạn...');

        const durationSeconds = (Date.now() - recordingStartTimeRef.current) / 1000;

        if (recognitionRef.current) {
          try { 
            recognitionRef.current.onend = null;
            recognitionRef.current.stop(); 
          } catch (e) {}
        }

        // 🛡️ CHẶN BẤM TẮT DƯỚI 2 GIÂY
        if (durationSeconds < 2.0) {
          setIsEvaluating(false);
          setHardwareWarning('⚠️ Bạn vừa bấm tắt quá nhanh (dưới 2 giây)! Vui lòng giữ bình tĩnh, đọc to câu trả lời tiếng Anh rồi mới bấm Dừng & Nộp bài.');
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
          }
          return;
        }

        const actualType = recorder.mimeType || resolvedMimeType || 'audio/webm';
        const fullAudioBlob = new Blob(audioChunksRef.current, { type: actualType });

        if (fullAudioBlob.size < 4000 && !fullTranscriptRef.current.trim()) {
          setIsEvaluating(false);
          setHardwareWarning('⚠️ Micro không thu được tín hiệu âm thanh rõ ràng hoặc âm lượng quá nhỏ. Vui lòng kiểm tra micro và bấm THỬ LẠI!');
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
          }
          return;
        }

        const localAudioUrl = URL.createObjectURL(fullAudioBlob);
        const targetPrompt = exercise?.promptEn || exercise?.contextEn || exercise?.scenarioTitle || '';
        const capturedSpeech = fullTranscriptRef.current || '';

        try {
          // 🎯 ĐÁNH GIÁ VỚI STATION_2
          const result = await executeWithRetry(
            async () => {
              return await evaluateSpeaking(
                fullAudioBlob, 
                cefrLevel, 
                'STATION_2', 
                targetPrompt, 
                userId, 
                capturedSpeech
              );
            },
            {
              maxRetries: 3,
              timeoutMs: 16000,
              onRetry: (attempt) => {
                setEvalStatusText(`⚠️ Mạng yếu, đang thử kết nối lại lần ${attempt}/3...`);
              }
            }
          );

          result.audioUrl = localAudioUrl;
          setEvalResult(result);

          if (result.transcript) {
            const spokenAnalysis = analyzeSpokenTranscript(result.transcript);
            harvestWeakWords(spokenAnalysis, exercise?.promptEn || exercise?.topic);
          }

          const sharedScore = result.score;
          setPlayerScores({
            p1Score: sharedScore,
            p1Transcript: result.transcript,
            p2Score: sharedScore,
            p2Transcript: result.transcript
          });

          let pairDisplayName = studentIdentifier;
          let feedbackDetail = result.detailedFeedback;

          if (mode === 'solo') {
            pairDisplayName = studentIdentifier;
            feedbackDetail = `[SOLO - ${cefrLevel}]: ${result.detailedFeedback}`;
          } else if (mode === 'roleplay') {
            const r1 = exercise?.userRoleEn || exercise?.player1En || 'Vai 1';
            const r2 = exercise?.aiRoleEn || exercise?.player2En || 'Vai 2';
            pairDisplayName = `${studentIdentifier} (Cặp đôi: ${r1} & ${r2}) | Điểm: ${sharedScore}đ`;
            feedbackDetail = `[HỘI THOẠI NHÓM ĐÔI - ${totalRoundsCompleted} lượt | ĐỒNG ĐIỂM: ${sharedScore}đ]: ${result.detailedFeedback}`;
          } else if (mode === 'relay') {
            pairDisplayName = `${studentIdentifier} & Bạn đấu | Điểm tổng: ${sharedScore}đ`;
            feedbackDetail = `[TIẾP SỨC RELAY - ĐỒNG ĐIỂM: ${sharedScore}đ]: ${result.detailedFeedback}`;
          }

          setIsEvaluating(false);

          // 🚀 TẢI DỮ LIỆU VÀ ĐỒNG BỘ FILE AUDIO LÊN SUPABASE STORAGE
          (async () => {
            try {
              const savedSubmission = await saveSubmissionToCloud({
                studentName: studentIdentifier,
                pairName: pairDisplayName,
                className: safeClass,
                score: sharedScore,
                mode: mode,
                cefrLevel: cefrLevel,
                transcript: result.transcript,
                audioUrl: '',
                feedback: feedbackDetail,
                timestamp: new Date().toLocaleTimeString('vi-VN')
              });

              if (savedSubmission?.id && fullAudioBlob && fullAudioBlob.size >= 1000) {
                const fileExt = actualType.includes('mp4') ? 'mp4' : 'webm';
                const fileName = `audio_${savedSubmission.id}_${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadErr } = await supabase.storage
                  .from('submissions_audio')
                  .upload(fileName, fullAudioBlob, { 
                    contentType: actualType || 'audio/webm', 
                    upsert: true 
                  });

                if (uploadErr) {
                  console.error("❌ Lỗi upload Supabase Storage:", uploadErr.message);
                  return;
                }

                if (uploadData?.path) {
                  const { data: publicUrlData } = supabase.storage
                    .from('submissions_audio')
                    .getPublicUrl(uploadData.path);

                  if (publicUrlData?.publicUrl) {
                    await supabase
                      .from('submissions')
                      .update({ audioUrl: publicUrlData.publicUrl })
                      .eq('id', savedSubmission.id);
                  }
                }
              }
            } catch (bgErr) {
              console.warn("Lỗi upload nền:", bgErr);
            }
          })();

        } catch (netErr: any) {
          safeAlert(`⚠️ ${netErr.message || 'Lỗi gửi bài do mất kết nối!'}`);
        } finally {
          setIsEvaluating(false);
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
          }
        }
      };

      recordingStartTimeRef.current = Date.now();
      recorder.start(100);
      setIsRecording(true);
      setIsGameActive(true);
    } catch (err) {
      setHardwareWarning("🔒 Trình duyệt chưa được cấp quyền Microphone! Vui lòng cho phép quyền Microphone và tải lại trang.");
    }
  };

  const stopFullRecordingAndEvaluate = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsGameActive(false);
    }
  };

  return (
    <View style={styles.container} {...({ className: 'notranslate', translate: 'no' } as any)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ TRẠM 2: VOCABULARY ARENA</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        
        <View style={styles.studentInfoCard}>
          <Text style={styles.studentInfoTitle}>🎓 THÔNG TIN NGƯỜI CHƠI / SINH VIÊN:</Text>
          <View style={{ flexDirection: 'column', gap: 6, width: '100%' }}>
            <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
              <TextInput
                style={[styles.infoInput, { flex: 1.2 }]}
                placeholder="Họ tên / Biệt danh *"
                placeholderTextColor="#666688"
                value={studentNameInput}
                onChangeText={handleNameChange}
              />
              <TextInput
                style={[styles.infoInput, { flex: 0.8 }]}
                placeholder="MSSV (Nếu có)"
                placeholderTextColor="#666688"
                value={studentCodeInput}
                onChangeText={handleCodeChange}
              />
            </View>
            <TextInput
              style={[styles.infoInput, { width: '100%' }]}
              placeholder="Mã Lớp (Bỏ trống nếu là Người chơi tự do)"
              placeholderTextColor="#666688"
              value={classNameInput}
              onChangeText={handleClassChange}
            />
          </View>
        </View>

        <View style={styles.customTopicCard}>
          <Text style={styles.customTopicTitle}>📌 NHẬP CHỦ ĐỀ SÁCH GIÁO KHOA (GIÁO VIÊN GIAO BÀI):</Text>
          <TextInput
            style={styles.topicInput}
            placeholder="Dán câu hỏi / chủ đề trong sách giáo khoa vào đây..."
            placeholderTextColor="#666688"
            value={customTopicInput}
            onChangeText={setCustomTopicInput}
            multiline={true}
          />
          
          <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
            <TouchableOpacity style={styles.applyCustomBtn} onPress={handleApplyCustomTopic}>
              <Text style={styles.applyCustomText}>⚡ ÁP DỤNG CHO {mode.toUpperCase()}</Text>
            </TouchableOpacity>

            {isUsingCustomTopic && (
              <TouchableOpacity style={styles.resetCustomBtn} onPress={handleResetToDefaultTopics}>
                <Text style={styles.resetCustomText}>🔄 HỦY CHỦ ĐỀ</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>CHỌN LEVEL CẤP ĐỘ:</Text>
        <View style={styles.cefrRow}>
          {CEFR_LEVELS.map((lvl) => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.cefrBadge, cefrLevel === lvl && styles.cefrBadgeActive]} 
              onPress={() => handleSelectLevel(lvl)}
            >
              <Text style={[styles.cefrText, cefrLevel === lvl && styles.cefrTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, mode === 'solo' && styles.modeBtnActive]} onPress={() => handleSelectMode('solo')}>
            <Text style={[styles.modeText, mode === 'solo' && styles.modeTextActive]}>🎯 SOLO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'relay' && styles.modeBtnActive]} onPress={() => handleSelectMode('relay')}>
            <Text style={[styles.modeText, mode === 'relay' && styles.modeTextActive]}>⚡ RELAY (TIẾP SỨC)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === 'roleplay' && styles.modeBtnActive]} onPress={() => handleSelectMode('roleplay')}>
            <Text style={[styles.modeText, mode === 'roleplay' && styles.modeTextActive]}>🎭 ROLEPLAY (ĐỐI THOẠI)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>📌 SÀN ĐẤU {mode.toUpperCase()} [{cefrLevel}]</Text>

          {exercise ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.scenarioTitle}>{exercise.title || exercise.topic}</Text>
              
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>
                  ⏱ TỔNG THỜI GIAN PHIÊN [{cefrLevel} - {mode.toUpperCase()}]: {turnTimer}s {isRecording ? '(ĐANG THU LIÊN TỤC)' : '(SẴN SÀNG)'}
                </Text>
                <Text style={[styles.timerValue, turnTimer <= 10 && { color: '#FF0055' }]}>
                  00:{turnTimer < 10 ? `0${turnTimer}` : turnTimer}
                </Text>
              </View>

              {/* KHU VỰC THẺ VAI DIỄN */}
              {(mode === 'relay' || mode === 'roleplay') && (
                <View style={styles.playersRow}>
                  <View style={[styles.playerCard, activePlayer === 1 && styles.activePlayerCard]}>
                    <Text style={styles.playerTag}>👤 VAI 1 (BẠN 1)</Text>
                    <Text style={styles.roleText}>🎭 {exercise.player1En || exercise.userRoleEn || 'Người khởi xướng'}</Text>
                    {activePlayer === 1 && isRecording && (
                      <View style={styles.speakingBadge}>
                        <Text style={styles.speakingText}>🎙️ ĐANG NÓI CÂU NÀY!</Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.playerCard, activePlayer === 2 && styles.activePlayerCard]}>
                    <Text style={styles.playerTag}>👥 VAI 2 (BẠN 2 / AI)</Text>
                    <Text style={styles.roleText}>🎭 {exercise.player2En || exercise.aiRoleEn || 'Người phản hồi'}</Text>
                    {activePlayer === 2 && isRecording && (
                      <View style={styles.speakingBadge}>
                        <Text style={styles.speakingText}>🎙️ ĐANG NÓI CÂU NÀY!</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.scriptBox}>
                <Text style={styles.promptText}>🎯 "{exercise.promptEn || exercise.contextEn || ''}"</Text>
              </View>

              {hardwareWarning && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>⚠️ CẢNH BÁO CHẤT LƯỢNG THU ÂM</Text>
                  <Text style={styles.warningContent}>{hardwareWarning}</Text>
                  <TouchableOpacity 
                    style={styles.retryBtn} 
                    onPress={() => {
                      setHardwareWarning(null);
                      setTurnTimer(getTimerByLevel(cefrLevel, mode, exercise));
                    }}
                  >
                    <Text style={styles.retryBtnText}>🎙️ BẤM VÀO ĐÂY ĐỂ THỬ LẠI LƯỢT THU ÂM</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* NÚT BẮT ĐẦU */}
              {!isRecording && !isEvaluating ? (
                <TouchableOpacity style={styles.startBtn} onPress={startFullRecording}>
                  <Text style={styles.startBtnText}>
                    {mode === 'solo' 
                      ? `🎙 BẤM THU ÂM SOLO (${getTimerByLevel(cefrLevel, mode, exercise)}s)` 
                      : mode === 'relay'
                      ? `🎙 BẮT ĐẦU TIẾP SỨC CẶP ĐÔI (${getTimerByLevel(cefrLevel, mode, exercise)}s)`
                      : `🎙 BẮT ĐẦU ĐỐI THOẠI CẶP ĐÔI (${getTimerByLevel(cefrLevel, mode, exercise)}s)`}
                  </Text>
                </TouchableOpacity>
              ) : isRecording ? (
                <View style={{ width: '100%', gap: 10 }}>
                  {(mode === 'relay' || mode === 'roleplay') && (
                    <TouchableOpacity style={styles.quickSwitchBtn} onPress={handleSwitchTurn}>
                      <Text style={styles.quickSwitchText}>
                        💬 NÓI XONG CÂU NÀY 👉 CHUYỂN LƯỢT CHO {activePlayer === 1 ? 'VAI 2' : 'VAI 1'}
                      </Text>
                      <Text style={styles.quickSwitchSub}>
                        (Đã hoàn thành: {totalRoundsCompleted} lượt | Đang thu âm liền mạch 1 file duy nhất)
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity style={styles.recordBtn} onPress={stopFullRecordingAndEvaluate}>
                    <Text style={styles.recordBtnText}>
                      {mode === 'solo' 
                        ? '🛑 HOÀN THÀNH & NỘP BÀI NÓI SOLO' 
                        : mode === 'relay'
                        ? '🛑 HOÀN THÀNH & NỘP BÀI TIẾP SỨC CỦA CẢ 2'
                        : '🛑 HOÀN THÀNH & NỘP BÀI HỘI THOẠI CỦA CẢ 2'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginVertical: 15, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#00FFFF" />
                  <Text style={{ color: '#00FFFF', fontSize: 11, marginTop: 5, textAlign: 'center' }}>
                    {evalStatusText}
                  </Text>
                </View>
              )}

              {evalResult && (
                <View style={styles.evalBox}>
                  <Text style={styles.evalScore}>
                    {mode === 'solo' 
                      ? `🏆 ĐIỂM BÀI NÓI SOLO CỦA BẠN: ${evalResult.score}/100` 
                      : `🏆 ĐIỂM CHUNG TỔNG THỂ CHO CẢ 2 BẠN: ${evalResult.score}/100`}
                  </Text>
                  
                  {evalResult.transcript ? (
                    <View style={styles.wordHighlightBox}>
                      <Text style={styles.wordHighlightTitle}>
                        {mode === 'solo' 
                          ? '🎙 TOÀN BỘ TỪ NGỮ GHI NHẬN ĐƯỢC TỪ BÀI NÓI:' 
                          : '🎙 TOÀN BỘ LỜI THOẠI THU ĐƯỢC:'}
                      </Text>
                      <View style={styles.wordRow}>
                        {analyzeSpokenTranscript(evalResult.transcript).map((item, idx) => (
                          <View 
                            key={idx} 
                            style={[
                              styles.wordBadge, 
                              item.isConfident ? styles.correctBadge : styles.warningBadge
                            ]}
                          >
                            <Text style={[styles.wordBadgeText, item.isConfident ? styles.correctText : styles.warningText]}>
                              {item.word} {item.isConfident ? '✓' : '⚠️'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {evalResult.audioUrl ? (
                    <View style={styles.audioPlayerBox}>
                      <Text style={styles.audioLabel}>
                        {mode === 'solo' ? '🎧 Nghe lại bài thu âm của bạn:' : '🎧 Nghe lại toàn bộ file thu âm chung:'}
                      </Text>
                      {/* 🛡️ CÁCH LY PHẦN TỬ AUDIO KHỎI PANRESPONDER CỦA REACT NATIVE WEB */}
                      <View 
                        style={{ width: '100%', marginTop: 6 }} 
                        // @ts-ignore
                        onStartShouldSetResponder={() => false}
                        onMoveShouldSetResponder={() => false}
                      >
                        {React.createElement('audio', {
                          key: evalResult.audioUrl,
                          controls: true,
                          playsInline: true,
                          preload: 'auto',
                          src: evalResult.audioUrl,
                          style: { width: '100%', height: 36, touchAction: 'manipulation' }
                        })}
                      </View>
                    </View>
                  ) : null}

                  <Text style={styles.transcriptText}>💬 Lời thoại ghi nhận: "{evalResult.transcript}"</Text>
                  <Text style={styles.feedbackText}>💡 Nhận xét AI: {evalResult.detailedFeedback}</Text>
                </View>
              )}

              {!isUsingCustomTopic && (
                <TouchableOpacity style={styles.nextBtn} onPress={() => loadNewExercise()}>
                  <Text style={styles.nextBtnText}>🔄 TẢI BÀI TẬP MỚI</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ActivityIndicator size="small" color="#00FFFF" style={{ marginVertical: 15 }} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#00FFFF', fontSize: 12, fontWeight: '900' },
  studentInfoCard: { backgroundColor: '#120826', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#00FFFF', width: '100%', marginBottom: 12 },
  studentInfoTitle: { color: '#00FFFF', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  infoInput: { backgroundColor: '#0D0620', color: '#FFF', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#332255', fontSize: 11 },
  customTopicCard: { backgroundColor: '#130A2A', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', width: '100%', marginBottom: 15 },
  customTopicTitle: { color: '#FFD700', fontSize: 10, fontWeight: '900', marginBottom: 6 },
  topicInput: { backgroundColor: '#0D0620', color: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#332255', fontSize: 11, minHeight: 45, marginBottom: 8, textAlignVertical: 'top' },
  applyCustomBtn: { flex: 1, backgroundColor: '#FF007F', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  applyCustomText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  resetCustomBtn: { backgroundColor: '#332255', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' },
  resetCustomText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  sectionLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 6 },
  cefrRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  cefrBadge: { backgroundColor: '#0D0620', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#332255' },
  cefrBadgeActive: { backgroundColor: '#00FFFF', borderColor: '#00FFFF' },
  cefrText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  cefrTextActive: { color: '#000' },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  modeBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center', marginHorizontal: 3 },
  modeBtnActive: { backgroundColor: '#39FF14', borderColor: '#39FF14' },
  modeText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  modeTextActive: { color: '#000' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 12 },
  scenarioTitle: { color: '#39FF14', fontSize: 13, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  timerBox: { backgroundColor: '#120826', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', alignItems: 'center', width: '100%', marginBottom: 12 },
  timerLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  timerValue: { color: '#39FF14', fontSize: 20, fontWeight: '900', marginTop: 2 },
  
  playersRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  playerCard: { flex: 0.48, backgroundColor: '#0D0620', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  activePlayerCard: { borderColor: '#39FF14', borderWidth: 2, backgroundColor: '#0F1E1E' },
  playerTag: { color: '#00FFFF', fontSize: 9, fontWeight: '900' },
  roleText: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginTop: 3, textAlign: 'center' },
  speakingBadge: { backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  speakingText: { color: '#000', fontSize: 8, fontWeight: '900' },

  scriptBox: { backgroundColor: '#130A2A', padding: 10, borderRadius: 8, width: '100%', borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptText: { color: '#FFF', fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 16 },
  
  warningBox: { backgroundColor: 'rgba(255, 136, 0, 0.15)', borderWidth: 1.5, borderColor: '#FF8800', borderRadius: 10, padding: 12, marginVertical: 10, width: '100%', alignItems: 'center' },
  warningTitle: { color: '#FF8800', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  warningContent: { color: '#FFF', fontSize: 10, textAlign: 'center', lineHeight: 15, marginBottom: 8 },
  retryBtn: { backgroundColor: '#FF8800', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, width: '100%', alignItems: 'center' },
  retryBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },

  startBtn: { backgroundColor: '#FF007F', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, width: '100%', alignItems: 'center', marginVertical: 10 },
  startBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  
  quickSwitchBtn: { backgroundColor: '#00FFFF', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#39FF14' },
  quickSwitchText: { color: '#000', fontSize: 11, fontWeight: '900' },
  quickSwitchSub: { color: '#003333', fontSize: 8, fontWeight: 'bold', marginTop: 2 },

  recordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, width: '100%', alignItems: 'center' },
  recordBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  
  evalBox: { backgroundColor: '#130A2A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#332255', width: '100%', marginTop: 12 },
  evalScore: { color: '#39FF14', fontSize: 12, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  wordHighlightBox: { backgroundColor: '#120826', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', marginVertical: 8 },
  wordHighlightTitle: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  correctBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', borderColor: '#39FF14' },
  warningBadge: { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderColor: '#FFD700' },
  wordBadgeText: { fontSize: 10, fontWeight: 'bold' },
  correctText: { color: '#39FF14' },
  warningText: { color: '#FFD700' },
  audioPlayerBox: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, width: '100%', marginBottom: 8, borderWidth: 1, borderColor: '#00FFFF' },
  audioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  transcriptText: { color: '#FFF', fontSize: 10, fontStyle: 'italic', marginBottom: 6 },
  feedbackText: { color: '#FFD700', fontSize: 10, marginTop: 4 },
  nextBtn: { backgroundColor: '#39FF14', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginTop: 12, width: '100%', alignItems: 'center' },
  nextBtnText: { color: '#000', fontSize: 11, fontWeight: '900' }
});