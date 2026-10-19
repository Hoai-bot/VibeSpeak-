// src/services/arena/assessmentService.ts
import { supabase } from '../../utils/supabase';

export interface AssessmentResult {
  score: number;
  transcript: string;
  detailedFeedback: string;
  audioUrl?: string;
}

export const evaluateSpeaking = async (
  audioBlob: Blob,
  cefrLevel: string = 'A1',
  topicId?: string,
  promptText?: string,
  userId?: string
): Promise<AssessmentResult> => {
  try {
    // 1. Giả lập / Gọi API chấm điểm AI
    const mockScore = Math.floor(Math.random() * 20) + 80;
    const mockTranscript = "Hello teacher, today I would like to introduce about my daily routine.";
    const mockFeedback = "Phát âm rõ ràng, từ vựng sử dụng chính xác phù hợp cấp độ " + cefrLevel;

    // 2. Chuyển Blob âm thanh thành Data URL
    let audioUrl = '';
    try {
      audioUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });
    } catch (e) {}

    return {
      score: mockScore,
      transcript: mockTranscript,
      detailedFeedback: mockFeedback,
      audioUrl: audioUrl,
    };
  } catch (err) {
    console.error("Lỗi đánh giá bài nói:", err);
    return {
      score: 75,
      transcript: "Không thể nhận diện lời thoại",
      detailedFeedback: "Có lỗi xảy ra trong quá trình kết nối AI.",
    };
  }
};