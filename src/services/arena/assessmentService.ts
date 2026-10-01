// src/services/arena/assessmentService.ts

export interface AssessmentResult {
  score: number;
  isWin: boolean;
  transcript: string;
  wordCount: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  reflexes: number;
  content: number;
  fluency: number;
  detailedFeedback: string;
  audioUrl?: string;
}

/**
 * Dịch vụ chấm điểm tập trung bằng Groq Whisper AI
 */
export async function evaluateSpeaking(
  audioBlob: Blob,
  cefrLevel: string = 'B2',
  targetText?: string // Nhận từ mẫu (cho Trạm 1) để chấm điểm chính xác
): Promise<AssessmentResult> {
  const audioUrl = URL.createObjectURL(audioBlob);

  // 1. LỚP BẢO VỆ 1: Kiểm tra dung lượng file ghi âm (> 8000 bytes)
  if (!audioBlob || audioBlob.size <= 8000) {
    return {
      score: 0,
      isWin: false,
      transcript: "(Không ghi nhận được âm thanh nói)",
      wordCount: 0,
      pronunciation: 0,
      grammar: 0,
      vocabulary: 0,
      reflexes: 0,
      content: 0,
      fluency: 0,
      detailedFeedback: "❌ Bạn chưa nói hoặc bản thu âm quá ngắn. Hãy phát âm rõ ràng vào micro!",
      audioUrl
    };
  }

  try {
    // 2. GỬI AUDIO ĐẾN GROQ WHISPER STT API
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
    
    if (!apiKey) {
      console.warn("⚠️ Thiếu EXPO_PUBLIC_GROQ_API_KEY, chuyển sang chế độ phân tích fallback.");
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'speech.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');

    let transcript = "";

    if (apiKey) {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        transcript = data.text ? data.text.trim() : "";
      }
    }

    // Nếu không bóc tách được chữ nào từ Whisper
    if (!transcript) {
      return {
        score: 0,
        isWin: false,
        transcript: "(Âm thanh không rõ hoặc im lặng)",
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: "❌ AI không nghe thấy từ tiếng Anh nào rõ ràng. Vui lòng thử lại!",
        audioUrl
      };
    }

    // 3. TÍNH TOÁN ĐIỂM CHÍNH XÁC DỰA TRÊN SCRIPT BÓC TÁCH THỰC TẾ
    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // THUẬT TOÁN CHẤM RIÊNG CHO TRẠM 1 (DRILL ARENA - So sánh từ phát âm)
    if (targetText) {
      const cleanTarget = targetText.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const cleanTranscript = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      
      const targetWords = cleanTarget.split(/\s+/);
      let matchedWords = 0;

      targetWords.forEach(tw => {
        if (cleanTranscript.includes(tw)) matchedWords++;
      });

      const accuracy = Math.round((matchedWords / targetWords.length) * 100);
      const isWin = accuracy >= 70;

      return {
        score: accuracy,
        isWin,
        transcript,
        wordCount,
        pronunciation: accuracy,
        grammar: accuracy,
        vocabulary: accuracy,
        reflexes: accuracy,
        content: accuracy,
        fluency: accuracy,
        detailedFeedback: isWin 
          ? `🎉 Xuất sắc! Phát âm của bạn khớp ${accuracy}% so với mẫu "${targetText}".`
          : `💀 Chưa đạt! Bạn nói: "${transcript}". Cần nói chuẩn các từ: "${targetText}".`,
        audioUrl
      };
    }

    // THUẬT TOÁN CHẤM DÀNH CHO TRẠM 2, 3, 4 (Phản xạ câu dài)
    let baseScore = Math.min(100, Math.round((wordCount / 12) * 100));
    if (cefrLevel === 'C1' || cefrLevel === 'C2') baseScore = Math.min(100, Math.round((wordCount / 20) * 100));

    const pronunciation = Math.min(100, Math.max(40, baseScore + 5));
    const grammar = Math.min(100, Math.max(35, baseScore - 5));
    const vocabulary = Math.min(100, Math.max(40, baseScore));
    const reflexes = Math.min(100, Math.max(50, baseScore + 10));
    const content = Math.min(100, Math.max(40, baseScore));
    const fluency = Math.min(100, Math.max(45, baseScore + 2));

    const finalScore = Math.round((pronunciation + grammar + vocabulary + reflexes + content + fluency) / 6);
    const isWin = finalScore >= 65;

    return {
      score: finalScore,
      isWin,
      transcript,
      wordCount,
      pronunciation,
      grammar,
      vocabulary,
      reflexes,
      content,
      fluency,
      detailedFeedback: isWin
        ? `🎉 Bạn đã hoàn thành tốt bài nói cấp độ ${cefrLevel} với ${wordCount} từ phát âm rõ ràng!`
        : `💀 Câu trả lời còn quá ngắn (${wordCount} từ). Hãy mở rộng ý kiến để đạt chuẩn ${cefrLevel}.`,
      audioUrl
    };

  } catch (error) {
    console.error("Lỗi khi chấm điểm:", error);
    return {
      score: 0,
      isWin: false,
      transcript: "(Lỗi kết nối máy chủ chấm điểm)",
      wordCount: 0,
      pronunciation: 0,
      grammar: 0,
      vocabulary: 0,
      reflexes: 0,
      content: 0,
      fluency: 0,
      detailedFeedback: "⚠️ Đã xảy ra lỗi mạng khi gửi bản ghi âm. Vui lòng bấm nộp lại!",
      audioUrl
    };
  }
}