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

// 🎯 TỰ ĐỘNG XÁC ĐỊNH BASE URL
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  if (process.env.EXPO_PUBLIC_VERCEL_URL) {
    return `https://${process.env.EXPO_PUBLIC_VERCEL_URL}`;
  }
  return 'https://vibe-speak-jmz06cpaj-ic-dalat.vercel.app';
};

/**
 * Hàm làm sạch kịch bản mẫu (Chỉ giữ lại nội dung chính của câu)
 */
const sanitizePrompt = (rawText?: string): string => {
  if (!rawText) return 'Describe your favorite animal and why you like it.';
  
  return rawText
    .replace(/SOLO\s+TOPIC:/gi, '')
    .replace(/Candidate must thoroughly address this prompt\./gi, '')
    .replace(/["']/g, '')
    .trim() || 'Describe your favorite animal and why you like it.';
};

export async function evaluateSpeaking(
  audioBlob: Blob,
  cefrLevel: string = 'B2',
  targetText?: string,
  promptEn?: string
): Promise<AssessmentResult> {
  const audioUrl = URL.createObjectURL(audioBlob);

  if (!audioBlob || audioBlob.size <= 2000) {
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
      detailedFeedback: "❌ Bản thu âm quá ngắn hoặc không có tiếng. Vui lòng bật micro và nói rõ hơn!",
      audioUrl
    };
  }

  try {
    const baseUrl = getBaseUrl();
    
    // Làm sạch câu kịch bản mẫu trước khi gửi lên Backend API
    const rawTarget = promptEn || targetText || '';
    const cleanPrompt = sanitizePrompt(rawTarget);

    const queryParams = new URLSearchParams({
      cefrLevel,
      promptEn: cleanPrompt,
    });

    // Gửi trực tiếp Blob Audio qua Vercel Serverless Function Proxy
    const response = await fetch(`${baseUrl}/api/evaluate?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Evaluate API Http Error (${response.status}):`, errText);
      throw new Error(`Serverless Evaluation Failed status: ${response.status}`);
    }

    const data = await response.json();

    return {
      ...data,
      audioUrl,
    };
  } catch (error) {
    console.error("❌ Lỗi kết nối Serverless Endpoint (evaluateSpeaking):", error);
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
      detailedFeedback: "⚠️ Lỗi kết nối máy chủ chấm điểm. Vui lòng kiểm tra kết nối mạng và thử nộp lại!",
      audioUrl
    };
  }
}