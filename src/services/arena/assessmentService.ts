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
  wordAnalysis?: Array<{ word: string; status: 'correct' | 'warning' | 'error' }>;
}

export const evaluateSpeaking = async (
  audioBlob: Blob,
  cefrLevel: string = 'B2',
  userText?: string,
  targetPrompt?: string
): Promise<AssessmentResult> => {
  try {
    // 📱 1. TỰ ĐỘNG XÁC ĐỊNH ĐUÔI FILE CHUẨN TƯƠNG THÍCH ĐIỆN THOẠI VÀ TRÌNH DUYỆT WEB
    const mimeType = audioBlob.type || 'audio/webm';
    let fileName = 'recording.webm';

    if (mimeType.includes('mp4') || mimeType.includes('aac') || mimeType.includes('m4a')) {
      fileName = 'recording.mp4';
    } else if (mimeType.includes('wav')) {
      fileName = 'recording.wav';
    } else if (mimeType.includes('ogg')) {
      fileName = 'recording.ogg';
    }

    // Tạo URL query parameters
    const queryParams = new URLSearchParams({
      cefrLevel,
      promptEn: targetPrompt || userText || '',
    });

    // 🎯 2. GỬI LÊN API VỚI BODY LÀ RAW BLOB VA HEADERS CONTENT-TYPE RÕ RÀNG
    const response = await fetch(`/api/evaluate?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
      },
      body: audioBlob,
    });

    if (!response.ok) {
      throw new Error(`API evaluate error: ${response.statusText}`);
    }

    const data = await response.json();

    // 🚨 3. BẢO VỆ CHẶT CHẼ: Nếu Backend xác định không có chữ (transcript rỗng hoặc score = 0)
    if (!data.transcript || data.transcript.trim() === '' || data.score === 0) {
      return {
        score: 0,
        isWin: false,
        transcript: data.transcript || "(Không nhận diện được giọng phát âm rõ ràng)",
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: data.detailedFeedback || "❌ AI không nhận diện được giọng nói. Hãy kiểm tra Micro và đọc to rõ ràng hơn!",
        wordAnalysis: [],
      };
    }

    // Nếu có bài nói hợp lệ thì trả về điểm thật từ Backend
    return {
      score: data.score ?? 0,
      isWin: data.isWin ?? (data.score >= 60),
      transcript: data.transcript,
      wordCount: data.wordCount ?? 0,
      pronunciation: data.pronunciation ?? 0,
      grammar: data.grammar ?? 0,
      vocabulary: data.vocabulary ?? 0,
      reflexes: data.reflexes ?? 0,
      content: data.content ?? 0,
      fluency: data.fluency ?? 0,
      detailedFeedback: data.detailedFeedback || "Đánh giá hoàn tất.",
      wordAnalysis: data.wordAnalysis || [],
    };
  } catch (error) {
    console.error("Lỗi đánh giá bài nói:", error);
    return {
      score: 0,
      isWin: false,
      transcript: "(Lỗi kết nối API)",
      wordCount: 0,
      pronunciation: 0,
      grammar: 0,
      vocabulary: 0,
      reflexes: 0,
      content: 0,
      fluency: 0,
      detailedFeedback: "⚠️ Không thể kết nối đến máy chủ chấm điểm. Vui lòng thử lại!",
      wordAnalysis: [],
    };
  }
};