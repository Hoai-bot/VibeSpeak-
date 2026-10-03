// src/services/arena/assessmentService.ts

export interface WordAnalysis {
  word: string;
  status: 'correct' | 'warning' | 'error';
}

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
  missingRequirements?: string[];
  wordAnalysis?: WordAnalysis[];
  improvedAnswerEn?: string;
  audioUrl?: string;
}

export async function evaluateSpeaking(
  audioBlob: Blob,
  cefrLevel: string = 'B2',
  targetText?: string,
  promptEn?: string
): Promise<AssessmentResult> {
  const audioUrl = URL.createObjectURL(audioBlob);

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
    const formData = new FormData();
    formData.append('file', audioBlob, 'speech.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');

    const queryParams = new URLSearchParams({
      cefrLevel,
      promptEn: promptEn || targetText || 'General speaking challenge',
    });

    const response = await fetch(`/api/evaluate?${queryParams.toString()}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Serverless Evaluation Failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      ...data,
      audioUrl,
    };
  } catch (error) {
    console.error("Lỗi kết nối Serverless Endpoint:", error);
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
      detailedFeedback: "⚠️ Đã xảy ra lỗi mạng khi kết nối Middleware Server. Vui lòng thử lại!",
      audioUrl
    };
  }
}