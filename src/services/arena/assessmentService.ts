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

    const queryParams = new URLSearchParams({
      cefrLevel,
      promptEn: promptEn || targetText || 'General speaking challenge',
    });

    // 🎯 TỰ ĐỘNG XÁC ĐỊNH DOMAIN CHÍNH XÁC
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const apiUrl = `${baseUrl}/api/evaluate?${queryParams.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Response Error:", response.status, errorText);
      throw new Error(`Serverless Evaluation Failed status: ${response.status}`);
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
      detailedFeedback: "⚠️ Không thể kết nối tới máy chủ chấm điểm. Vui lòng thử lại!",
      audioUrl
    };
  }
}