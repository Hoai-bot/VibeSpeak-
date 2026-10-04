// api/evaluate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(readable: any): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey =
    process.env.GROQ_API_KEY_NEW ||
    process.env.GROQ_API_KEY ||
    process.env.GROQ_API ||
    process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Máy chủ chưa được cấu hình GROQ_API_KEY. Vui lòng kiểm tra Vercel Settings.',
    });
  }

  try {
    const groq = new Groq({ apiKey });

    const { promptEn, cefrLevel } = req.query;
    const targetPhrase = (promptEn as string) || 'General speaking challenge';

    const audioBuffer = await getRawBody(req);

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Không nhận được dữ liệu âm thanh từ thiết bị.',
      });
    }

    const audioFile = new File([audioBuffer], 'recording.webm', {
      type: req.headers['content-type'] || 'audio/webm',
    });

    // 1. Chạy Whisper STT
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'json',
    });

    const userTranscript = transcription.text || '';

    // 2. Chấm điểm phát âm bằng llama-3.1-8b-instant (Dễ dùng, luôn mở cho mọi tài khoản Groq)
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI English Pronunciation Referee for VibeSpeak Cyber Arena.
Target CEFR Level: ${cefrLevel || 'B2'}.
Evaluate user spoken text against the target phrase.
Return ONLY a valid JSON matching this schema:
{
  "score": number (0-100),
  "isWin": boolean,
  "pronunciation": number (0-100),
  "grammar": number (0-100),
  "vocabulary": number (0-100),
  "reflexes": number (0-100),
  "content": number (0-100),
  "fluency": number (0-100),
  "wordCount": number,
  "detailedFeedback": "string",
  "wordAnalysis": [
    { "word": "string", "status": "correct" | "warning" | "error" }
  ]
}`,
        },
        {
          role: 'user',
          content: `Target Phrase: "${targetPhrase}"\nUser Spoke: "${userTranscript}"`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const evalResult = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return res.status(200).json({
      transcript: userTranscript,
      score: evalResult.score ?? 80,
      isWin: evalResult.isWin ?? true,
      wordCount: evalResult.wordCount ?? userTranscript.split(' ').length,
      pronunciation: evalResult.pronunciation ?? 80,
      grammar: evalResult.grammar ?? 80,
      vocabulary: evalResult.vocabulary ?? 80,
      reflexes: evalResult.reflexes ?? 80,
      content: evalResult.content ?? 80,
      fluency: evalResult.fluency ?? 80,
      detailedFeedback: evalResult.detailedFeedback || 'Đánh giá hoàn tất.',
      wordAnalysis: evalResult.wordAnalysis || [],
    });
  } catch (error: any) {
    console.error('Lỗi API Evaluate:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ chấm điểm AI',
      details: error?.message || error,
    });
  }
}