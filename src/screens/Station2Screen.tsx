// 1. Thêm import evaluateSpeaking ở đầu file src/screens/Station2Screen.tsx:
import { evaluateSpeaking } from '../services/arena/assessmentService';

// 2. Cập nhật hàm finishSubmissionAndEvaluate:
const finishSubmissionAndEvaluate = async (audioBlob: Blob, pitchHistory: number[], localAudioUrl?: string) => {
  setIsEvaluating(true);
  if (localAudioUrl) {
    setRecordedAudioUrl(localAudioUrl);
  } else {
    setRecordedAudioUrl(URL.createObjectURL(audioBlob));
  }

  let actualTranscript = liveTranscriptRef.current.trim();

  // 🎯 BƯỚC 1: NẾU TRÊN ĐIỆN THOẠI KHÔNG CÓ LIVE TRANSCRIPT -> GỌI EVALUATESPEAKING LẤY TAPESCRIPT THẬT
  let serverEvalData: any = null;
  try {
    const targetPrompt = practiceMode === 'READ_SAMPLE' 
      ? (currentChallenge?.prompt || '') 
      : `Reflex challenge: ${currentChallenge?.contextDesc || ''}`;

    // evaluateSpeaking hoạt động ổn định trên cả iOS Safari & Android
    serverEvalData = await evaluateSpeaking(audioBlob, selectedLevel, '2', targetPrompt);
    
    if (serverEvalData?.transcript && serverEvalData.transcript.trim()) {
      actualTranscript = serverEvalData.transcript.trim();
      setLiveTranscript(actualTranscript);
      liveTranscriptRef.current = actualTranscript;
    }
  } catch (err) {
    console.warn("Lỗi trích xuất tapescript từ server:", err);
  }

  // 🎯 BƯỚC 2: CHẤM ĐIỂM CHÍNH XÁC THEO TAPESCRIPT ĐÃ NHẬN DIỆN ĐƯỢC
  const duration = Math.max(normalTimer, 2);
  let evaluated: any;

  if (practiceMode === 'READ_SAMPLE') {
    // Chế độ 1: Đọc theo mẫu -> Chấm độ chuẩn xác từng âm và từ
    evaluated = evaluateSpeechSubmission({
      transcript: actualTranscript,
      targetPrompt: currentChallenge?.prompt || '',
      pitchHistory,
      durationSeconds: duration,
      cefrLevel: currentChallenge?.level || selectedLevel
    });
  } else {
    // Chế độ 2: Tự do phản xạ -> Đánh giá độ trôi chảy và ngữ điệu câu học viên tự nói
    evaluated = evaluateSpeechSubmission({
      transcript: actualTranscript,
      targetPrompt: actualTranscript || currentChallenge?.prompt || '',
      pitchHistory,
      durationSeconds: duration,
      cefrLevel: currentChallenge?.level || selectedLevel
    });

    if (actualTranscript && actualTranscript.split(/\s+/).filter(Boolean).length >= 4) {
      evaluated.spontaneityScore = Math.min(100, Math.max(evaluated.spontaneityScore, 85));
      evaluated.rubrics.content.score = Math.min(100, Math.max(evaluated.rubrics.content.score, 88));
      evaluated.totalScore = Math.round((evaluated.totalScore + evaluated.spontaneityScore) / 2);
    }
  }

  // Nếu serverEvalData có điểm trực tiếp từ AI server, cân bằng trọng số để điểm số chân thực nhất
  if (serverEvalData?.score && actualTranscript) {
    evaluated.totalScore = Math.round((evaluated.totalScore + serverEvalData.score) / 2);
    if (serverEvalData.criteria?.pronunciation) {
      evaluated.rubrics.pronunciation.score = serverEvalData.criteria.pronunciation;
    }
  }

  // 🎯 BƯỚC 3: LƯU TRỮ LÊN SUPABASE KÈM TAPESCRIPT ĐẦY ĐỦ
  let audioUrl = '';
  try {
    if (supabase) {
      const ext = activeMimeTypeRef.current.extension || 'webm';
      const contentType = activeMimeTypeRef.current.mimeType || (ext === 'mp4' ? 'audio/mp4' : 'audio/webm');
      const fileName = `station2_${selectedTier.toLowerCase()}_${selectedLevel.toLowerCase()}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('submissions')
        .upload(fileName, audioBlob, { contentType });

      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
        audioUrl = urlData?.publicUrl || '';
      }

      const { data: authUser } = await supabase.auth.getUser();
      await supabase.from('submissions').insert([{
        student_name: authUser?.user?.user_metadata?.full_name || 'Học viên Trạm 2',
        student_code: authUser?.user?.email?.split('@')[0] || 'STU_S2',
        class_name: `Trạm 2: ${selectedTier} (${selectedLevel}) [${practiceMode === 'READ_SAMPLE' ? 'Đọc mẫu' : 'Tự do'}]`,
        mode: `STATION_2_${selectedTier}`,
        cefr_level: currentChallenge?.level || selectedLevel,
        score: evaluated.totalScore,
        manual_score: null,
        spontaneity_score: evaluated.spontaneityScore,
        pitch_variance: evaluated.rubrics.intonation.score,
        is_script_suspected: evaluated.isScriptSuspected,
        audio_url: audioUrl,
        transcript: actualTranscript || '(Không nhận diện được giọng nói)',
        feedback: `[Phát âm: ${evaluated.rubrics.pronunciation.score} | Ngữ điệu: ${evaluated.rubrics.intonation.score} | Trôi chảy: ${evaluated.rubrics.fluency.score}]`
      }]);
    }
  } catch (err) {
    console.warn("Lỗi lưu kết quả bài nộp:", err);
  }

  setIsEvaluating(false);
  setFeedbackResult(evaluated);
  setIsTeacherExamining(false);
  setDetailedModalVisible(true);
};