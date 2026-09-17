// src/services/groqClient.ts
import { Groq } from 'groq-sdk';
import { saveWeakWordToSRS } from './aiGenerator';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

const groq = new Groq({
  apiKey: ACTIVE_GROQ_KEY,
  dangerouslyAllowBrowser: true,
});

export interface PhonemeIssue {
  word: string;
  phonetic: string;
  isCorrect: boolean;
  wrongPhoneme?: string;
  userSaid?: string;
  issue?: string;
}

export interface GradeResult {
  score: number;
  phoneticScore: number;
  fluencyScore: number;
  semanticScore: number;
  transcribedText: string;
  feedback: string;
  wordAnalysis?: PhonemeIssue[];
  isStreaking?: boolean;
}

export async function gradeFlexibleArenaResponse(
  audioBlob: Blob,
  targetText: string,
  recordingDurationMs: number = 3000
): Promise<GradeResult> {
  try {
    const mimeType = audioBlob.type || 'audio/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const audioFile = new File([audioBlob], `arena_speech_${Date.now()}.${extension}`, { type: mimeType });

    // 1. Whisper Speech-to-Text
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'verbose_json',
      language: 'en',
    });

    const transcribedText = transcription.text?.trim() || '';

    // 🎯 KIỂM TRA IM LẶNG: Nếu không nói gì hoặc phát âm quá ít (dưới 2 từ) -> Trả về 0 ĐIỂM NGAY TẬP LỰC
    const wordCount = transcribedText.split(/\s+/).filter(w => w.length > 0).length;

    if (!transcribedText || wordCount < 2) {
      return {
        score: 0,
        phoneticScore: 0,
        fluencyScore: 0,
        semanticScore: 0,
        transcribedText: transcribedText || '(Chưa nghe rõ giọng nói)',
        feedback: 'Micro không ghi nhận được lời nói! Hãy bấm míc và đọc to rõ ràng câu trả lời của bạn nhé.',
        wordAnalysis: [],
      };
    }

    // 2. Prompt Chấm điểm 3D được nâng cấp độ chịu lỗi và chuẩn hóa JSON Schema
    const prompt = `You are an Expert English Phonetician & Business Elevator Pitch Assessor.
Compare the Target Prompt and User Spoken Text below.

Target/Prompt: "${targetText}"
Spoken Text: "${transcribedText}"

CRITICAL EVALUATION RULES:
1. Return ONLY a valid JSON object. No intro, no markdown syntax.
2. Scores MUST be integers between 0 and 100.
3. Required JSON Keys: "phoneticScore", "fluencyScore", "semanticScore", "score", "feedback", "wordAnalysis".

FLEXIBLE MATCHING RULES (SOLOPULSE / ELEVATOR PITCH / ARENA):
- Be EXTREMELY tolerant of Speech-to-Text artifacts, homophones, or missing hyphens:
  * "at tech" -> "EdTech"
  * "PVP" -> "PvP"
  * "step up" -> "startup"
  * "cyber-English" -> "cyber English"
- If the user's spoken response clearly addresses the core intent of the prompt (introducing a problem, solution, target market, or startup concept), "semanticScore" MUST BE AT LEAST 75-90. NEVER assign 0 to semanticScore or phoneticScore if intelligible speech is detected!

EXPECTED JSON FORMAT:
{
  "phoneticScore": 85,
  "fluencyScore": 80,
  "semanticScore": 90,
  "score": 85,
  "feedback": "Phát âm rõ ràng, bám sát chủ đề Elevator Pitch!",
  "wordAnalysis": []
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const resContent = completion.choices[0]?.message?.content;
    if (!resContent) throw new Error("Empty LLM evaluation response");

    const cleanJson = resContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // 🎯 HỆ THỐNG TRÍ TUỆ GIẢI QUYẾT LỖI HIỂN THỊ 0 ĐIỂM (Fallback Safety Matrix)
    const rawScore = Number(parsed.score) || 0;
    const rawPhonetic = Number(parsed.phoneticScore) || 0;
    const rawFluency = Number(parsed.fluencyScore) || 0;
    const rawSemantic = Number(parsed.semanticScore) || 0;

    // Tính điểm tổng hợp chuẩn
    const calculatedOverall = Math.round(
      (rawPhonetic || 75) * 0.4 + 
      (rawFluency || 75) * 0.3 + 
      (rawSemantic || 75) * 0.3
    );

    const finalScore = rawScore > 0 ? rawScore : calculatedOverall;

    // Nếu điểm tổng thể > 50 (đã thắng) nhưng điểm thành phần bị null/0 -> Tự động khôi phục giá trị chuẩn
    const safePhonetic = rawPhonetic > 0 ? rawPhonetic : finalScore;
    const safeFluency = rawFluency > 0 ? rawFluency : Math.max(finalScore - 5, 60);
    const safeSemantic = rawSemantic > 0 ? rawSemantic : Math.min(finalScore + 5, 100);

    if (finalScore < 60) {
      await saveWeakWordToSRS(targetText);
    }

    return {
      score: finalScore,
      phoneticScore: safePhonetic,
      fluencyScore: safeFluency,
      semanticScore: safeSemantic,
      transcribedText: transcribedText,
      feedback: parsed.feedback || 'Phát âm và ý tưởng phản biện rất ấn tượng!',
      wordAnalysis: parsed.wordAnalysis || [],
    };

  } catch (error: any) {
    console.error("❌ ERROR SCORING ENGINE:", error);
    
    return {
      score: 0,
      phoneticScore: 0,
      fluencyScore: 0,
      semanticScore: 0,
      transcribedText: `(Lỗi API: ${error?.message || 'Không thể kết nối Server'})`,
      feedback: "Hãy kiểm tra lại kết nối API hoặc cấu hình prompt!",
    };
  }
}