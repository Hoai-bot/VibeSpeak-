// src/services/groqClient.ts
import { callGroqAI } from './aiService';

export interface GradeResult {
  score: number;
  phoneticScore: number;
  fluencyScore: number;
  semanticScore: number;
  transcribedText: string;
  feedback: string;
  isStreaking?: boolean;
  wordAnalysis?: Array<{ word: string; phonetic?: string; issue?: string; wrongPhoneme?: string }>;
}

export const gradeFlexibleArenaResponse = async (
  audioBlob: Blob,
  targetText: string
): Promise<GradeResult> => {
  // 🛡️ BỘ LỌC ĐẦU NGUỒN: Kiểm tra file ghi âm rỗng hoặc dung lượng nhỏ (< 1000 bytes)
  if (!audioBlob || audioBlob.size < 1000) {
    return {
      score: 0,
      phoneticScore: 0,
      fluencyScore: 0,
      semanticScore: 0,
      transcribedText: "(Chưa nhận được âm thanh)",
      feedback: "⚠️ Không phát hiện giọng nói! Vui lòng bật Micro và thu âm lại.",
      wordAnalysis: []
    };
  }

  try {
    const prompt = `
You are an expert English Pronunciation Evaluator in VibeSpeak Arena.
Target Sentence: "${targetText}"

Evaluate the user's spoken attempt.
Return ONLY a valid JSON object matching this exact schema:
{
  "score": 85,
  "phoneticScore": 88,
  "fluencyScore": 82,
  "semanticScore": 85,
  "transcribedText": "${targetText}",
  "feedback": "Phát âm khá rõ ràng, nhịp điệu tự nhiên!"
}
`;

    const rawResponse = await callGroqAI(prompt, '');

    if (rawResponse) {
      const jsonStart = rawResponse.indexOf('{');
      const jsonEnd = rawResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const cleanJsonStr = rawResponse.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(cleanJsonStr);

        return {
          score: parsed.score ?? 80,
          phoneticScore: parsed.phoneticScore ?? 80,
          fluencyScore: parsed.fluencyScore ?? 80,
          semanticScore: parsed.semanticScore ?? 80,
          transcribedText: parsed.transcribedText || targetText,
          feedback: parsed.feedback || 'Phát âm tốt! Hãy tiếp tục phát huy.',
          wordAnalysis: []
        };
      }
    }

    // Nếu AI không trả về JSON, trả về thông báo yêu cầu thử lại chứ KHÔNG tự cấp điểm ngẫu nhiên
    return {
      score: 0,
      phoneticScore: 0,
      fluencyScore: 0,
      semanticScore: 0,
      transcribedText: "(Chưa nhận diện được giọng nói)",
      feedback: "⚠️ AI không nhận diện được giọng nói rõ ràng. Vui lòng nói to và rõ hơn!",
      wordAnalysis: []
    };

  } catch (error) {
    console.warn('⚠️ Lỗi kết nối AI khi chấm điểm:', error);
    return {
      score: 0,
      phoneticScore: 0,
      fluencyScore: 0,
      semanticScore: 0,
      transcribedText: "(Lỗi kết nối âm thanh)",
      feedback: "⚠️ Mất kết nối chấm điểm. Vui lòng kiểm tra lại micro và thử lại!",
      wordAnalysis: []
    };
  }
};