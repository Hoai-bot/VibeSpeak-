// src/services/groqClient.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface GradeResult {
  score: number;
  phoneticScore: number;
  fluencyScore: number;
  semanticScore: number;
  transcribedText: string;
  feedback: string;
}

export async function gradeFlexibleArenaResponse(
  audioBlob: Blob,
  contextPrompt: string
): Promise<GradeResult> {
  try {
    // 1. Chuyển Blob thành File để gửi Groq Whisper STT
    const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type || 'audio/webm' });
    
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'en', // Ép Whisper chỉ nhận diện Tiếng Anh
      response_format: 'json',
    });

    const transcribedText = (transcription.text || '').trim();

    // 🎯 2. BỘ LỌC KIỂM TRA NGÔN NGỮ & BÀI NÓI RỖNG (STRICT LANGUAGE FILTER)
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const cleanText = transcribedText.replace(/[\s\.\,\?\!]/g, '');

    // Nếu không có tiếng, quá ngắn, chỉ có dấu chấm, hoặc chứa tiếng Việt
    if (!cleanText || cleanText.length < 5 || transcribedText.includes('. . .') || vietnameseRegex.test(transcribedText)) {
      return {
        score: 0,
        phoneticScore: 0,
        fluencyScore: 0,
        semanticScore: 0,
        transcribedText: transcribedText || "(Không phát hiện giọng nói Tiếng Anh)",
        feedback: "💀 DEFEAT: Hệ thống phát hiện bài nói không phải Tiếng Anh hoặc bạn chưa cất lời. Vui lòng nói Tiếng Anh rõ ràng!"
      };
    }

    // 3. Gửi prompt chấm điểm 3D cho Groq Llama/GPT
    const prompt = `You are a strict English Speaking Evaluator for a Cyber Arena Game.
Evaluate the user's spoken response based on the scenario context.

Context/Topic: "${contextPrompt}"
User Spoken Transcript: "${transcribedText}"

Rate strictly from 0 to 100 on 3 dimensions:
1. Phonetic/Pronunciation Score (0-100)
2. Fluency Score (0-100)
3. Semantic/Relevance Score (0-100)

Overall Score = Average of the 3 scores.

Return ONLY a valid JSON object:
{
  "score": number,
  "phoneticScore": number,
  "fluencyScore": number,
  "semanticScore": number,
  "feedback": "Concise feedback in Vietnamese highlighting strengths and missing points"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return {
      score: parsed.score || 0,
      phoneticScore: parsed.phoneticScore || 0,
      fluencyScore: parsed.fluencyScore || 0,
      semanticScore: parsed.semanticScore || 0,
      transcribedText,
      feedback: parsed.feedback || "Hãy tiếp tục luyện tập phản xạ Tiếng Anh!"
    };

  } catch (error) {
    console.error("Grading Error:", error);
    return {
      score: 0,
      phoneticScore: 0,
      fluencyScore: 0,
      semanticScore: 0,
      transcribedText: "(Lỗi kết nối chấm điểm)",
      feedback: "💀 DEFEAT: Không thể chấm điểm. Vui lòng thử lại!"
    };
  }
}