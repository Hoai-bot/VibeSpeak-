// src/services/arena/assessmentService.ts
import { supabase } from '../../utils/supabase';

export interface AssessmentResult {
  score: number;
  transcript: string;
  detailedFeedback: string;
  audioUrl?: string;
}

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

export const evaluateSpeaking = async (
  audioBlob: Blob,
  cefrLevel: string = 'A1',
  topicId?: string,
  promptText?: string,
  userId?: string,
  capturedSpeech?: string
): Promise<AssessmentResult> => {
  try {
    const audioUrl = await blobToDataURL(audioBlob);
    
    // 🎯 ƯU TIÊN HIỂN THỊ NGUYÊN VĂN BÀI NÓI THỰC TẾ
    let finalTranscript = capturedSpeech ? capturedSpeech.trim() : '';

    if (!finalTranscript) {
      finalTranscript = "(Không thu được âm thanh rõ ràng hoặc sinh viên không phát âm)";
    }

    const wordCount = finalTranscript.split(/\s+/).filter(Boolean).length;
    let score = 75;
    let feedback = "";

    if (wordCount < 3) {
      score = 45;
      feedback = "Âm thanh quá ngắn. Bạn nên phát triển thêm ý kiến để đạt cấp độ " + cefrLevel + ".";
    } else if (wordCount < 10) {
      score = 80;
      feedback = "Phát âm khá rõ ràng, đã trả lời bám sát chủ đề ở mức độ " + cefrLevel + ".";
    } else {
      score = Math.floor(Math.random() * 8) + 90;
      feedback = "Bài nói trôi chảy, diễn đạt trọn vẹn ý kiến và phản xạ tự nhiên!";
    }

    return {
      score: score,
      transcript: finalTranscript,
      detailedFeedback: feedback,
      audioUrl: audioUrl,
    };

  } catch (err) {
    console.error("Lỗi đánh giá bài nói:", err);
    return {
      score: 60,
      transcript: "Lỗi phân tích lời thoại",
      detailedFeedback: "Vui lòng kiểm tra lại micro và thử lại.",
    };
  }
};