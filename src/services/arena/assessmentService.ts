// src/services/arena/assessmentService.ts
import { Groq } from 'groq-sdk';

export interface AssessmentResult {
  score: number;
  isWin: boolean;
  transcript: string;
  wordCount: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  reflexes: number;
  content: number; // Điểm Task Fulfillment (Ý đề bài)
  fluency: number;
  detailedFeedback: string;
  missingRequirements?: string[]; // Danh sách các ý bị thiếu
  improvedAnswerEn?: string; // Bài mẫu tham khảo
  audioUrl?: string;
}

const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

/**
 * Dịch vụ chấm điểm tập trung bằng Groq Whisper AI + Groq Llama AI
 */
export async function evaluateSpeaking(
  audioBlob: Blob,
  cefrLevel: string = 'B2',
  targetText?: string, // Dùng cho Trạm 1 (Drill)
  promptEn?: string    // Dùng cho Trạm 2, 3, 4 (Đề bài kiểm tra Task Fulfillment)
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
    // 2. BÓC TÁCH ÂM THANH BẰNG GROQ WHISPER STT API
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

    // Nếu không bóc tách được văn bản
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

    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // 🎯 CHẾ ĐỘ CHẤM TRẠM 1 (So sánh từ phát âm trực tiếp với Mẫu)
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

    // 🎯 CHẾ ĐỘ CHẤM NGHIÊM NGẶT BẰNG AI DÀNH CHO TRẠM 2, 3, 4 (Đánh giá Task Fulfillment)
    if (apiKey && promptEn) {
      const strictSystemPrompt = `You are a STRICT CEFR/IELTS Speaking Examiner evaluating a response for level [${cefrLevel}].

PROMPT: "${promptEn}"
CANDIDATE TRANSCRIPT: "${transcript}"

STRICT EVALUATION RULES:
1. TASK FULFILLMENT (Content Score): Check if ALL parts of the prompt were addressed.
   - If prompt asks for BOTH advantages AND disadvantages, but candidate only mentioned advantages, Content Score CANNOT exceed 50.
   - If response is under 20 words, Content Score CANNOT exceed 40.
2. GRAMMAR & VOCABULARY: Evaluate structural accuracy and vocabulary relevance.
3. FLUENCY & REFLEXES: Evaluate based on word count and logical coherence.

Return ONLY valid JSON matching:
{
  "content": number (0-100),
  "grammar": number (0-100),
  "vocabulary": number (0-100),
  "pronunciation": number (0-100),
  "fluency": number (0-100),
  "reflexes": number (0-100),
  "missingRequirements": ["List missing required points"],
  "detailedFeedback": "Short constructive feedback in Vietnamese explaining score penalty if any.",
  "improvedAnswerEn": "Improved answer covering 100% of prompt"
}`;

      try {
        const aiResponse = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: strictSystemPrompt },
            { role: 'user', content: `Grade transcript: "${transcript}"` }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });

        const parsed = JSON.parse(aiResponse.choices[0]?.message?.content || '{}');

        const content = parsed.content ?? 50;
        const grammar = parsed.grammar ?? 60;
        const vocabulary = parsed.vocabulary ?? 60;
        const pronunciation = parsed.pronunciation ?? 70;
        const fluency = parsed.fluency ?? 60;
        const reflexes = parsed.reflexes ?? 60;

        // Trọng số: Content (Task Fulfillment) chiếm 40% điểm tổng
        const finalScore = Math.round(
          (content * 0.4) + (grammar * 0.2) + (vocabulary * 0.2) + (fluency * 0.1) + (pronunciation * 0.1)
        );

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
          missingRequirements: parsed.missingRequirements || [],
          detailedFeedback: parsed.detailedFeedback || (isWin ? "Bài nói tốt!" : "Cần bổ sung thêm ý."),
          improvedAnswerEn: parsed.improvedAnswerEn || "",
          audioUrl
        };
      } catch (aiErr) {
        console.warn("⚠️ AI Evaluation fallback to heuristics:", aiErr);
      }
    }

    // FALLBACK HEURISTICS (Nếu không có Groq API Key)
    const baseScore = Math.min(100, Math.round((wordCount / 20) * 100));
    const finalScore = Math.min(70, baseScore); // Giới hạn max 70 điểm nếu không có AI chấm chi tiết

    return {
      score: finalScore,
      isWin: finalScore >= 65,
      transcript,
      wordCount,
      pronunciation: finalScore,
      grammar: finalScore,
      vocabulary: finalScore,
      reflexes: finalScore,
      content: finalScore,
      fluency: finalScore,
      detailedFeedback: `Bạn đã nói được ${wordCount} từ. Hãy đảm bảo trả lời đầy đủ tất cả các ý của đề bài!`,
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