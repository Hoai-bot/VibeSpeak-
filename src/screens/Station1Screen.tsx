// src/screens/Station1Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getRandomStation1Drill, DrillType } from '../services/drills/station1Service';
import { evaluateSpeaking, AssessmentResult, generateWordDiff } from '../services/arena/assessmentService';
import { updateUserProgress } from '../services/userService';
import { supabase } from '../utils/supabase';
import AudioWaveVisualizer from '../components/AudioWaveVisualizer';
import IntonationCanvas from '../components/IntonationCanvas'; // 📈 IMPORT INTONATION CANVAS
import { getPhoneticComparison } from '../constants/phoneticMap';

interface Props {
  onBack: () => void;
}

// Hàm trích xuất cao độ F0 cơ bản phía Client (Autocorrelation)
function detectPitchFrame(buffer: Float32Array, sampleRate: number): number | null {
  const size = buffer.length;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return null; // Yên lặng

  for (let offset = Math.floor(sampleRate / 450); offset < Math.floor(sampleRate / 70); offset++) {
    let correlation = 0;
    for (let i = 0; i < size - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.4 && bestOffset > 0) {
    return sampleRate / bestOffset;
  }
  return null;
}

export default function Station1Screen({ onBack }: Props) {
  const [activeType, setActiveType] = useState<DrillType>('minimal_pairs');
  const [currentDrill, setCurrentDrill] = useState<any>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);

  // Quản lý ghi âm & trạng thái chấm điểm
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Quản lý tiến trình & Điểm kỷ lục
  const [bestScore, setBestScore] = useState<number>(0);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  
  // Quản lý luồng âm thanh
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [capturedText, setCapturedText] = useState<string>('');

  // 📈 QUẢN LÝ DỮ LIỆU ĐƯỜNG CONG NGỮ ĐIỆU (INTONATION CONTOUR)
  const [studentContour, setStudentContour] = useState<number[]>([]);
  const [targetContour, setTargetContour] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Audio Context cho Pitch Extraction
  const audioContextRef = useRef<AudioContext | null>(null);
  const pitchIntervalRef = useRef<any>(null);
  const pitchSamplesRef = useRef<number[]>([]);

  const safeAlert = (msg: string) => {
    setTimeout(() => { alert(msg); }, 50);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (supabase && supabase.auth) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) setUserId(data.user.id);
        }
      } catch (e) {
        console.warn("Không lấy được user ID:", e);
      }
    };
    fetchUser();
  }, []);

  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
  };

  const playSampleAudio = (textToSpeak: string) => {
    if (!textToSpeak) return;
    stopAllAudio();
    setIsPlayingTTS(true);

    let cleanSpeechText = textToSpeak.replace(/\//g, ', ').trim();
    const ttsWordFixes: Record<string, string> = {
      'come in': 'cum, in',
      'come': 'cum',
      'some': 'sum'
    };

    const lowerText = cleanSpeechText.toLowerCase();
    if (ttsWordFixes[lowerText]) {
      cleanSpeechText = ttsWordFixes[lowerText];
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const speakText = () => {
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.lang = 'en-US';
        utterance.rate = 0.7;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(
          v => v.lang === 'en-US' && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (englishVoice) utterance.voice = englishVoice;

        utterance.onstart = () => setIsPlayingTTS(true);
        utterance.onend = () => setIsPlayingTTS(false);
        utterance.onerror = () => tryAudioUrlFallback(cleanSpeechText);

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        speakText();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          speakText();
          window.speechSynthesis.onvoiceschanged = null;
        };
        setTimeout(() => speakText(), 150);
      }
      return;
    }

    tryAudioUrlFallback(cleanSpeechText);
  };

  const tryAudioUrlFallback = (textToSpeak: string) => {
    try {
      const encodedText = encodeURIComponent(textToSpeak);
      const ttsUrl = `https://dict.youdao.com/dictvoice?audio=${encodedText}&type=2`;
      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => setIsPlayingTTS(true);
      audio.onended = () => setIsPlayingTTS(false);
      audio.onerror = () => setIsPlayingTTS(false);
      audio.play().catch(() => setIsPlayingTTS(false));
    } catch {
      setIsPlayingTTS(false);
    }
  };

  const handleLoadNewDrill = (type: DrillType) => {
    stopAllAudio();
    resetSession();
    setBestScore(0);
    setPreviousScore(null);
    setAttemptCount(0);
    const newDrill = getRandomStation1Drill(type);
    setCurrentDrill(newDrill);

    const isQuestion = (newDrill?.contentEn || '').includes('?');
    const mockRef = isQuestion 
      ? [-2, -1.5, -1, 0, 0.5, 1.2, 2.8, 4.5]
      : [0.5, 1.8, 2.2, 1.5, 0.2, -1.0, -2.5, -3.2];
    setTargetContour(mockRef);
  };

  useEffect(() => {
    handleLoadNewDrill(activeType);
    return () => stopAllAudio();
  }, [activeType]);

  const resetSession = () => {
    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); recognitionRef.current = null; } catch (e) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setActiveStream(null);
    setIsRecording(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setIsProcessingAudio(false);
    setResult(null);
    setCapturedText('');
    setStudentContour([]);
    audioChunksRef.current = [];
  };

  const handleToggleRecord = async () => {
    stopAllAudio();

    if (!isRecording) {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          safeAlert("🔒 Trình duyệt chưa cấp quyền Micro!");
          return;
        }

        if (result && result.score > 0) {
          setPreviousScore(result.score);
        }

        setRecordedAudio(null);
        setHasRecorded(false);
        setIsProcessingAudio(false);
        setCapturedText('');
        setStudentContour([]);
        pitchSamplesRef.current = [];
        audioChunksRef.current = [];

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });
        mediaStreamRef.current = stream;
        setActiveStream(stream);

        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const sourceNode = audioCtx.createMediaStreamSource(stream);
            const analyserNode = audioCtx.createAnalyser();
            analyserNode.fftSize = 2048;
            sourceNode.connect(analyserNode);

            const buffer = new Float32Array(analyserNode.fftSize);
            pitchIntervalRef.current = setInterval(() => {
              analyserNode.getFloatTimeDomainData(buffer);
              const pitch = detectPitchFrame(buffer, audioCtx.sampleRate);
              if (pitch) {
                pitchSamplesRef.current.push(pitch);
              }
            }, 60);
          }
        } catch (audioCtxErr) {
          console.warn("Pitch analysis context bypassed:", audioCtxErr);
        }

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          setRecordedAudio(blob);
          setHasRecorded(true);
          setIsProcessingAudio(false);

          if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try { audioContextRef.current.close(); } catch (e) {}
          }

          const rawSamples = pitchSamplesRef.current;
          if (rawSamples.length >= 4) {
            const meanPitch = rawSamples.reduce((a, b) => a + b, 0) / rawSamples.length;
            const normalized = rawSamples.map(f => +(12 * Math.log2(f / meanPitch)).toFixed(2));
            setStudentContour(normalized);
          } else {
            setStudentContour([0.2, 1.0, 1.5, 0.8, -0.5, -1.8]);
          }

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
          setActiveStream(null);
        };

        recordingStartTimeRef.current = Date.now();
        recorder.start(150);
        setIsRecording(true);
      } catch (err) {
        safeAlert("🔒 Vui lòng cho phép quyền 'Microphone' trên trình duyệt để ghi âm!");
      }
    } else {
      const durationSeconds = (Date.now() - recordingStartTimeRef.current) / 1000;
      setIsRecording(false);
      setIsProcessingAudio(true);
      setActiveStream(null);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      if (durationSeconds < 0.6) {
        setIsProcessingAudio(false);
        setHasRecorded(false);
        setRecordedAudio(null);
        safeAlert("⚠️ Bản thu quá ngắn! Hãy đọc trọn vẹn từ mục tiêu rồi mới bấm dừng.");
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!hasRecorded || !recordedAudio || isProcessingAudio) {
      safeAlert("🔒 Vui lòng phát âm từ mục tiêu vào micro trước khi nộp bài!");
      return;
    }

    setIsAnalyzing(true);
    try {
      const promptTarget = (currentDrill?.contentEn || '').trim();
      const evalData = await evaluateSpeaking(
        recordedAudio, 
        undefined, 
        'STATION_1', 
        promptTarget, 
        userId, 
        capturedText
      );

      setAttemptCount((prev) => prev + 1);
      setBestScore((prev) => Math.max(prev, evalData.score));
      setResult(evalData);
      
      const isPass = (evalData.score >= 70) || evalData.isWin;
      if (isPass) updateUserProgress(1, 30, true);
    } catch (err) {
      safeAlert("⚠️ Lỗi kết nối chấm điểm. Vui lòng thử nộp lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isPassed = (result?.score ?? 0) >= 70 || result?.isWin;
  const scoreDiff = (previousScore !== null && result) ? result.score - previousScore : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>🔙 QUAY LẠI MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 TRẠM 1: PRONUNCIATION LAB</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 30 }}>
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'minimal_pairs' && styles.tabBtnActive]}
            onPress={() => setActiveType('minimal_pairs')}
          >
            <Text style={[styles.tabText, activeType === 'minimal_pairs' && styles.tabTextActive]}>
              👯 Minimal Pairs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'linking_sounds' && styles.tabBtnActive]}
            onPress={() => setActiveType('linking_sounds')}
          >
            <Text style={[styles.tabText, activeType === 'linking_sounds' && styles.tabTextActive]}>
              🔗 Linking Sounds
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeType === 'tongue_twisters' && styles.tabBtnActive]}
            onPress={() => setActiveType('tongue_twisters')}
          >
            <Text style={[styles.tabText, activeType === 'tongue_twisters' && styles.tabTextActive]}>
              🐍 Tongue Twisters
            </Text>
          </TouchableOpacity>
        </View>

        {currentDrill && (
          <View style={styles.box} key={currentDrill.sessionKey}>
            <Text style={styles.boxTitle}>📌 {currentDrill.title.toUpperCase()}</Text>
            
            <Text style={styles.drillEn}>"{currentDrill.contentEn}"</Text>
            {currentDrill.contentVi && <Text style={styles.drillVi}>👉 {currentDrill.contentVi}</Text>}
            
            {currentDrill.phoneticSpelling && (
              <Text style={styles.phonetics}>🔊 IPA: {currentDrill.phoneticSpelling}</Text>
            )}
            
            <Text style={styles.targetFocus}>🎯 Trọng tâm: {currentDrill.targetFocus}</Text>

            <TouchableOpacity 
              style={[styles.ttsBtn, isPlayingTTS && styles.ttsBtnActive]} 
              onPress={() => playSampleAudio(currentDrill.contentEn)}
            >
              <Text style={styles.ttsBtnText}>
                {isPlayingTTS ? '🔊 ĐANG PHÁT ÂM MẪU...' : '📢 NGHE PHÁT ÂM MẪU'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={() => handleLoadNewDrill(activeType)}
            >
              <Text style={styles.refreshBtnText}>🔄 THỬ THÁCH BÀI KHÁC</Text>
            </TouchableOpacity>

            {/* DẢI SÓNG ÂM THỜI GIAN THỰC */}
            <AudioWaveVisualizer stream={activeStream} isRecording={isRecording} barColor="#FF007F" />

            <TouchableOpacity 
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]} 
              onPress={handleToggleRecord}
            >
              <Text style={styles.recordBtnText}>
                {isRecording 
                  ? '🔴 ĐANG THU ÂM... (BẤM ĐỂ DỪNG)' 
                  : isProcessingAudio
                  ? '⏳ ĐANG LƯU BẢN THU MỚI...'
                  : hasRecorded 
                  ? '🔄 BẤM ĐỂ PHÁT ÂM LẠI (NÂNG ĐIỂM)' 
                  : '🎙 BẤM ĐỂ BẮT ĐẦU PHÁT ÂM'}
              </Text>
            </TouchableOpacity>

            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#39FF14" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity 
                style={[
                  styles.submitBtn, 
                  (!hasRecorded || isRecording || isProcessingAudio) && styles.submitBtnDisabled
                ]} 
                onPress={handleSubmitAnswer}
                disabled={!hasRecorded || isRecording || isProcessingAudio}
              >
                <Text style={styles.submitBtnText}>
                  {attemptCount > 0 ? '⚡ NỘP BÀI ĐỂ NÂNG ĐIỂM' : '⚡ NỘP BÀI & CHẤM PHÁT ÂM AI'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {result && (
          <View style={[styles.box, { borderColor: isPassed ? '#39FF14' : '#FF0055' }]}>
            <Text style={[styles.resultTitle, { color: isPassed ? '#39FF14' : '#FF0055' }]}>
              {isPassed ? '🏆 PHÁT ÂM RẤT CHUẨN!' : '💀 CẦN LUYỆN TẬP THÊM'}
            </Text>
            
            <Text style={styles.scoreText}>⚡ Điểm lần này: {result.score} / 100 ĐIỂM</Text>

            {/* HUY HIỆU SO SÁNH TIẾN BỘ */}
            <View style={styles.scoreComparisonRow}>
              {bestScore > 0 && (
                <View style={styles.bestScoreBadge}>
                  <Text style={styles.bestScoreText}>👑 Kỷ lục bài này: {bestScore}đ</Text>
                </View>
              )}
              {scoreDiff !== null && (
                <View style={[styles.deltaBadge, { backgroundColor: scoreDiff >= 0 ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 0, 85, 0.2)' }]}>
                  <Text style={[styles.deltaText, { color: scoreDiff >= 0 ? '#39FF14' : '#FF0055' }]}>
                    {scoreDiff >= 0 ? `▲ Tăng +${scoreDiff}đ` : `▼ Giảm ${scoreDiff}đ`}
                  </Text>
                </View>
              )}
            </View>

            {/* 📈 BIỂU ĐỒ ĐƯỜNG CONG NGỮ ĐIỆU (INTONATION CONTOUR) */}
            <IntonationCanvas targetContour={targetContour} studentContour={studentContour} />

            {/* KHỐI ĐỐI CHIẾU IPA LỆCH TRỰC QUAN */}
            {(() => {
              let normalizedDisplayTranscript = (result.transcript || '').toLowerCase();
              const isMinimalPair = currentDrill?.contentEn?.includes('/');
              const inspectionItems: string[] = isMinimalPair
                ? currentDrill.contentEn.split('/').map((w: string) => w.trim()).filter(Boolean)
                : currentDrill.contentEn
                    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
                    .split(/\s+/)
                    .map((w: string) => w.trim())
                    .filter((w: string) => w.length >= 3);

              return (
                <>
                  {currentDrill?.contentEn && (
                    <View style={styles.ipaDiffContainer}>
                      <Text style={styles.ipaSectionTitle}>🔬 SOI ÂM VỊ CHI TIẾT (IPA PHONEMIC INSPECTOR):</Text>
                      
                      {inspectionItems.map((word: string, idx: number) => {
                        const comparison = getPhoneticComparison(word, normalizedDisplayTranscript);
                        return (
                          <View 
                            key={idx} 
                            style={[
                              styles.ipaCard, 
                              comparison.isExactMatch ? styles.ipaCardCorrect : styles.ipaCardMismatch
                            ]}
                          >
                            <View style={styles.ipaHeaderRow}>
                              <Text style={styles.ipaWord}>{word.toUpperCase()}</Text>
                              <Text style={[styles.ipaStatusBadge, { color: comparison.isExactMatch ? '#39FF14' : '#FF0055' }]}>
                                {comparison.isExactMatch ? 'CHÍNH XÁC ✓' : 'LỆCH ÂM ✗'}
                              </Text>
                            </View>

                            <View style={styles.ipaCompareRow}>
                              <View style={styles.ipaBox}>
                                <Text style={styles.ipaBoxLabel}>ÂM CHUẨN MỤC TIÊU</Text>
                                <Text style={styles.targetIpaText}>{comparison.targetIpa || `/${word.toLowerCase()}/`}</Text>
                              </View>

                              <View style={styles.arrowContainer}>
                                <Text style={styles.ipaVsArrow}>➔</Text>
                              </View>

                              <View style={styles.ipaBox}>
                                <Text style={[styles.ipaBoxLabel, { textAlign: 'right' }]}>AI THU NHẬN ĐƯỢC</Text>
                                <Text style={[styles.heardIpaText, { color: comparison.isExactMatch ? '#39FF14' : '#FF0055' }]}>
                                  {comparison.heardIpa || '(Không rõ)'}
                                </Text>
                              </View>
                            </View>

                            {comparison.tip && (
                              <View style={styles.ipaTipBox}>
                                <Text style={styles.ipaTipText}>💡 Mẹo khẩu hình: {comparison.tip}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.wordHighlightBox}>
                    <Text style={styles.wordHighlightTitle}>🎯 CHI TIẾT TỪNG TỪ MỤC TIÊU:</Text>
                    <View style={styles.wordRow}>
                      {generateWordDiff(currentDrill?.contentEn || '', normalizedDisplayTranscript).map((item, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[
                            styles.wordBadge, 
                            item.status === 'correct' ? styles.correctBadge : styles.incorrectBadge
                          ]}
                          onPress={() => playSampleAudio(item.word)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.wordBadgeText, item.status === 'correct' ? styles.correctText : styles.incorrectText]}>
                            {item.word} {item.status === 'correct' ? '✓' : '✗'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              );
            })()}

            {/* 🎧 KHỐI PHÁT AUDIO AN TOÀN TRÁNH XUNG ĐỘT TOUCH BANK CỦA REACT NATIVE WEB */}
            {result.audioUrl ? (
              <View style={styles.audioPlayerBox}>
                <Text style={styles.audioLabel}>🎧 Nghe lại bài phát âm của bạn:</Text>
                {React.createElement(
                  'div',
                  {
                    style: { width: '100%', marginTop: 6 },
                    onMouseDown: (e: any) => e.stopPropagation(),
                    onTouchStart: (e: any) => e.stopPropagation(),
                    onMouseUp: (e: any) => e.stopPropagation(),
                    onTouchEnd: (e: any) => e.stopPropagation()
                  },
                  React.createElement('audio', {
                    key: result.audioUrl,
                    controls: true,
                    playsInline: true,
                    src: result.audioUrl,
                    style: { width: '100%', height: 36 }
                  })
                )}
              </View>
            ) : null}

            <View style={styles.scriptBox}>
              <Text style={styles.scriptLabel}>📝 Âm AI nghe được thực tế:</Text>
              <Text style={styles.scriptContent}>"{result.transcript || '(Không nghe rõ từ)'}"</Text>
            </View>

            <Text style={styles.feedbackText}>{result.detailedFeedback}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  backText: { color: '#FF007F', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 12, fontWeight: '900' },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  tabBtn: { flex: 1, backgroundColor: '#0D0620', paddingVertical: 10, marginHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: '#332255', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  tabText: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  tabTextActive: { color: '#FFF' },
  box: { backgroundColor: '#0D0620', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 20 },
  boxTitle: { color: '#FFD700', fontSize: 11, fontWeight: '900', marginBottom: 10 },
  drillEn: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  drillVi: { color: '#FFD700', fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  phonetics: { color: '#39FF14', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  targetFocus: { color: '#AAAABB', fontSize: 10, textAlign: 'center', marginBottom: 12 },
  ttsBtn: { backgroundColor: '#1A0B2E', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 10 },
  ttsBtnActive: { backgroundColor: '#00FFFF' },
  ttsBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  refreshBtn: { backgroundColor: '#1A0B2E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', alignItems: 'center', marginBottom: 10 },
  refreshBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  recordBtn: { backgroundColor: '#1A0B2E', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#FF007F', width: '100%', alignItems: 'center', marginBottom: 10 },
  recordBtnActive: { backgroundColor: '#FF0055' },
  recordBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  submitBtn: { backgroundColor: '#39FF14', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#224422', opacity: 0.2 },
  submitBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },
  resultTitle: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  scoreText: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginBottom: 6 },
  scoreComparisonRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  bestScoreBadge: { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderWidth: 1, borderColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bestScoreText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
  deltaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  deltaText: { fontSize: 10, fontWeight: '900' },

  ipaDiffContainer: { width: '100%', backgroundColor: '#070314', borderRadius: 12, borderWidth: 1.5, borderColor: '#00FFFF', padding: 12, marginVertical: 10 },
  ipaSectionTitle: { color: '#00FFFF', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
  ipaCard: { backgroundColor: '#120826', borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 8, width: '100%' },
  ipaCardCorrect: { borderColor: '#39FF14' },
  ipaCardMismatch: { borderColor: '#FF0055' },
  ipaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 },
  ipaWord: { color: '#FFF', fontSize: 12, fontWeight: '900', flex: 1, flexShrink: 1 },
  ipaStatusBadge: { fontSize: 9, fontWeight: '900' },
  ipaCompareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#05020D', borderRadius: 8, padding: 8, width: '100%', gap: 4 },
  ipaBox: { flex: 1, flexShrink: 1, minWidth: 0 },
  arrowContainer: { paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  ipaBoxLabel: { color: '#8888AA', fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  targetIpaText: { color: '#39FF14', fontSize: 11, fontWeight: '800', lineHeight: 16, flexWrap: 'wrap' },
  heardIpaText: { fontSize: 11, fontWeight: '800', lineHeight: 16, textAlign: 'right', flexWrap: 'wrap' },
  ipaVsArrow: { color: '#FF007F', fontSize: 12, fontWeight: 'bold' },
  ipaTipBox: { marginTop: 6, backgroundColor: '#1A0B2E', borderRadius: 6, padding: 6 },
  ipaTipText: { color: '#FFD700', fontSize: 9, lineHeight: 13 },

  wordHighlightBox: { backgroundColor: '#120826', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF', width: '100%', marginVertical: 8 },
  wordHighlightTitle: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 6 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  correctBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', borderColor: '#39FF14' },
  incorrectBadge: { backgroundColor: 'rgba(255, 0, 85, 0.15)', borderColor: '#FF0055' },
  wordBadgeText: { fontSize: 11, fontWeight: 'bold' },
  correctText: { color: '#39FF14' },
  incorrectText: { color: '#FF0055' },
  audioPlayerBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10, borderWidth: 1, borderColor: '#00FFFF' },
  audioLabel: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  scriptBox: { backgroundColor: '#1A0B2E', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10 },
  scriptLabel: { color: '#AAAABB', fontSize: 9, fontWeight: 'bold' },
  scriptContent: { color: '#FFF', fontSize: 11, fontStyle: 'italic', marginVertical: 4 },
  feedbackText: { color: '#FFF', fontSize: 11, textAlign: 'center', lineHeight: 16 }
});