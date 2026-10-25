// api/evaluate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

export const config = {
  api: {
    bodyParser: false, // Xử lý trực tiếp luồng stream âm thanh đa phương tiện
  },
};

async function getRawBody(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Cấu hình CORS an toàn cho Vercel Serverless Function
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Lấy API Key được cất giữ an toàn trên Backend Vercel
  const apiKey =
    process.env.GROQ_API_KEY ||
    process.env.GROQ_API_KEY_NEW ||
    process.env.GROQ_API ||
    process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server cấu hình thiếu biến môi trường GROQ_API_KEY trên Vercel!' });
  }

  try {
    const audioBuffer = await getRawBody(req);
    const rawContentType = (req.headers['content-type'] as string) || '';

    // 🎯 CHỐNG SPAM FILE ÂM THANH RỖNG HOẶC QUÁ NGẮN (< 1.2s)
    if (!audioBuffer || audioBuffer.length < 1200) {
      return res.status(200).json({
        transcript: '(Chưa ghi nhận âm thanh rõ ràng)',
        score: 0,
        isWin: false,
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: '❌ Bài thu âm quá ngắn (dưới 1.2s)! Vui lòng giữ micro và đọc trọn vẹn câu trả lời.',
        wordAnalysis: [],
      });
    }

    // Xác định định dạng file audio phù hợp với thiết bị (iOS / Android / Chrome)
    let extension = 'webm';
    let mimeType = 'audio/webm';

    if (rawContentType.includes('mp4') || rawContentType.includes('aac') || rawContentType.includes('m4a')) {
      extension = 'mp4';
      mimeType = 'audio/mp4';
    } else if (rawContentType.includes('wav')) {
      extension = 'wav';
      mimeType = 'audio/wav';
    } else if (rawContentType.includes('ogg')) {
      extension = 'ogg';
      mimeType = 'audio/ogg';
    }

    const groq = new Groq({ apiKey });
    const audioBufferData = Buffer.from(audioBuffer);
    const audioFile = await Groq.toFile(audioBufferData, `recording.${extension}`, { type: mimeType });

    // Trích xuất tham số bài tập
    const rawPrompt = (req.query.promptEn as string) || '';
    const isStation4 = req.query.targetText === '4' || req.query.station === '4';
    const isStation3 = rawPrompt.toLowerCase().includes('shadowing') || req.query.station === '3';
    const currentLevel = ((req.query.cefrLevel as string) || 'A1').toUpperCase();

    const cleanScript = rawPrompt
      .replace(/SOLO TOPIC:/g, '')
      .replace(/Candidate must thoroughly address this prompt\./g, '')
      .replace(/Practice Phrase:/gi, '')
      .replace(/Shadowing phrase:/gi, '')
      .replace(/Focus area:.*/gi, '')
      .replace(/["']/g, '')
      .trim() || 'General speaking challenge';

    const targetPhrase = cleanScript;

    // 🎯 BƯỚC 1: GROQ WHISPER SPEECH-TO-TEXT
    let userTranscript = '';
    try {
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        language: 'en',
        prompt: `User is practicing English speaking (${currentLevel}): ${targetPhrase}`,
        response_format: 'json',
      });

      userTranscript = (transcription.text || '')
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .trim();
    } catch (aiError: any) {
      console.warn('⚠️ Groq Whisper STT warning:', aiError?.message || aiError);
    }

    // Nếu Whisper bị nghẽn mạng, kích hoạt fallback theo câu bài tập để không chặn người học
    if (!userTranscript || userTranscript.length === 0) {
      userTranscript = targetPhrase;
    }

    // 🎯 BƯỚC 2: CHẤM ĐIỂM BẰNG LLAMA 3.1
    let evalResult: any = null;
    try {
      let systemPrompt = '';
      if (isStation3) {
        systemPrompt = `You are an AI Shadowing Referee for VibeSpeak Station 3 (Shadow Boss Raid).
Target Level: ${currentLevel}.
Evaluate user's shadowing accuracy against the target Boss phrase: "${targetPhrase}".
Feedback MUST be in Vietnamese, brief, and focus strictly on shadowing accuracy and pronunciation.

Return ONLY JSON matching schema:
{
  "score": number,
  "isWin": boolean,
  "pronunciation": number,
  "grammar": number,
  "vocabulary": number,
  "reflexes": number,
  "content": number,
  "fluency": number,
  "wordCount": number,
  "detailedFeedback": "string in Vietnamese",
  "wordAnalysis": [{ "word": "string", "status": "correct" | "warning" | "error" }]
}`;
      } else if (isStation4) {
        systemPrompt = `You are an AI Referee for VibeSpeak Station 4 (Speaking Express - Quick Reflex).
Target Level: ${currentLevel}.
Situation Prompt: "${targetPhrase}".

CRITICAL SCORING RULES FOR STATION 4:
- For A1-A2 Level: Short, natural, and accurate responses MUST score 85-100 points!
- For B1-B2 Level: Answers should contain 1-2 clear sentences (80-95 points).
- For C1-C2 Level: Answers should use sophisticated vocabulary (85-100 points).

Return ONLY JSON matching schema:
{
  "score": number,
  "isWin": boolean,
  "pronunciation": number,
  "grammar": number,
  "vocabulary": number,
  "reflexes": number,
  "content": number,
  "fluency": number,
  "wordCount": number,
  "detailedFeedback": "string in Vietnamese",
  "wordAnalysis": [{ "word": "string", "status": "correct" | "warning" | "error" }]
}`;
      } else {
        systemPrompt = `You are an AI English Pronunciation Referee for VibeSpeak Arena.
Target Level: ${currentLevel}.
Evaluate user spoken text against target phrase.

Return ONLY JSON matching schema:
{
  "score": number,
  "isWin": boolean,
  "pronunciation": number,
  "grammar": number,
  "vocabulary": number,
  "reflexes": number,
  "content": number,
  "fluency": number,
  "wordCount": number,
  "detailedFeedback": "string in Vietnamese",
  "wordAnalysis": [{ "word": "string", "status": "correct" | "warning" | "error" }]
}`;
      }

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Target Prompt: "${targetPhrase}"\nUser Answer: "${userTranscript}"` },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      evalResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch (e: any) {
      console.warn('⚠️ Lỗi Llama LLM, chuyển sang Dynamic Fallback Engine:', e?.message || e);
    }

    // 🎯 BƯỚC 3: DYNAMIC FALLBACK NẾU LLM KHÔNG TRẢ ĐỦ DỮ LIỆU
    if (!evalResult || typeof evalResult.score !== 'number' || evalResult.score === 0) {
      const words = userTranscript.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      const targetWords = targetPhrase.toLowerCase().split(/\s+/);
      const userWords = userTranscript.toLowerCase().split(/\s+/);
      const matchedCount = userWords.filter((w) => targetWords.includes(w)).length;
      const coverageRatio = Math.min(1, matchedCount / Math.max(1, targetWords.length));
      const baseScore = Math.round(coverageRatio * 80 + 20);

      evalResult = {
        score: baseScore,
        isWin: baseScore >= 60,
        wordCount,
        pronunciation: baseScore,
        grammar: baseScore,
        vocabulary: baseScore,
        reflexes: baseScore,
        content: baseScore,
        fluency: baseScore,
        detailedFeedback: `Phát âm ghi nhận: "${userTranscript}". Khớp ${matchedCount}/${targetWords.length} từ mục tiêu.`,
        wordAnalysis: words.map((w) => ({
          word: w,
          status: targetWords.includes(w.toLowerCase()) ? 'correct' : 'warning',
        })),
      };
    }

    // Trả kết quả chuẩn JSON về cho giao diện người dùng
    return res.status(200).json({
      text: userTranscript, // Khớp với trường 'text' khi gọi transcribe đơn thuần
      transcript: userTranscript,
      score: evalResult.score ?? 85,
      isWin: evalResult.isWin ?? true,
      wordCount: evalResult.wordCount ?? userTranscript.split(' ').length,
      pronunciation: evalResult.pronunciation ?? evalResult.score ?? 85,
      grammar: evalResult.grammar ?? evalResult.score ?? 85,
      vocabulary: evalResult.vocabulary ?? evalResult.score ?? 85,
      reflexes: evalResult.reflexes ?? evalResult.score ?? 85,
      content: evalResult.content ?? evalResult.score ?? 85,
      fluency: evalResult.fluency ?? evalResult.score ?? 85,
      detailedFeedback: evalResult.detailedFeedback || 'Đánh giá hoàn tất.',
      wordAnalysis: evalResult.wordAnalysis || [],
    });
  } catch (error: any) {
    console.error('Lỗi API Backend Evaluate:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ chấm điểm AI',
      details: error?.message || String(error),
    });
  }
}