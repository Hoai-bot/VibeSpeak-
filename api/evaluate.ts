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

  const rawPrompt = (req.query.promptEn as string) || '';
  const cleanScript = rawPrompt
    .replace(/SOLO TOPIC:/g, '')
    .replace(/Candidate must thoroughly address this prompt\./g, '')
    .replace(/Practice Phrase:/gi, '')
    .replace(/Focus area:.*/gi, '')
    .replace(/["']/g, '')
    .trim() || 'General speaking challenge';

  const targetPhrase = cleanScript;

  try {
    const audioBuffer = await getRawBody(req);
    const apiKey =
      process.env.GROQ_API_KEY_NEW ||
      process.env.GROQ_API_KEY ||
      process.env.GROQ_API ||
      process.env.EXPO_PUBLIC_GROQ_API_KEY;

    // 🚨 1. KIỂM TRA AUDIO RỖNG -> TRẢ VỀ 0 ĐIỂM LẬP TỨC
    if (!audioBuffer || audioBuffer.length < 1500) {
      return res.status(200).json({
        transcript: '(Chưa ghi nhận âm thanh)',
        score: 0,
        isWin: false,
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: '❌ AI chưa nhận được âm thanh. Vui lòng bấm micro và đọc to rõ ràng hơn!',
        wordAnalysis: [],
      });
    }

    let userTranscript = '';
    let evalResult: any = null;

    if (apiKey) {
      try {
        const groq = new Groq({ apiKey });

        // 🎯 FIX LỖI TS2322: Chuyển Buffer thành Uint8Array để vừa lòng TypeScript File API
        const uint8Array = new Uint8Array(
          audioBuffer.buffer,
          audioBuffer.byteOffset,
          audioBuffer.byteLength
        );
        const audioFile = new File([uint8Array], 'recording.webm', {
          type: (req.headers['content-type'] as string) || 'audio/webm',
        });

        // STT qua Whisper
        const transcription = await groq.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-large-v3',
          language: 'en',
          response_format: 'json',
        });

        // Làm sạch kết quả nhận diện từ âm thanh thực tế
        userTranscript = (transcription.text || '')
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
          .trim();

        // 🚨 2. NẾU KHÔNG CÓ GIỌNG NÓI HOẶC CHỈ CÓ TIẾNG ỒN -> TRẢ VỀ 0 ĐIỂM
        if (!userTranscript || userTranscript.length === 0) {
          return res.status(200).json({
            transcript: '(Im lặng / Không rõ từ)',
            score: 0,
            isWin: false,
            wordCount: 0,
            pronunciation: 0,
            grammar: 0,
            vocabulary: 0,
            reflexes: 0,
            content: 0,
            fluency: 0,
            detailedFeedback: '⚠️ AI không nghe rõ từ bạn vừa nói. Hãy kiểm tra lại micro và phát âm lại nhé!',
            wordAnalysis: [],
          });
        }

        // 3. Tiến hành chấm điểm LLAMA dựa trên GIỌNG NÓI THỰC TẾ
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an AI English Pronunciation Referee for VibeSpeak.
Target Level: ${req.query.cefrLevel || 'B2'}.
Evaluate user spoken text against the Target Word/Phrase.

CRITICAL INSTRUCTIONS:
- If user spoke only 1 word out of a multi-word target, score proportional to what was actually spoken.
- Evaluate pronunciation accuracy of user spoke text.

Return ONLY JSON matching schema:
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
  "wordAnalysis": [{ "word": "string", "status": "correct" | "warning" | "error" }]
}`
            },
            {
              role: 'user',
              content: `Target: "${targetPhrase}"\nUser Spoke: "${userTranscript}"`
            }
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });
        evalResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
      } catch (aiError) {
        console.warn('⚠️ Groq AI bận, chuyển sang Fallback Engine...');
      }
    }

    // 🚨 4. FALLBACK ENGINE CHUẨN
    if (!evalResult || typeof evalResult.score !== 'number') {
      const targetWords = targetPhrase.toLowerCase().split(/\s+/);
      const userWords = userTranscript.toLowerCase().split(/\s+/);

      const matchedCount = userWords.filter((w) => targetWords.includes(w)).length;
      const coverageRatio = Math.min(1, matchedCount / Math.max(1, targetWords.length));
      
      const calculatedScore = Math.round(coverageRatio * 85 + (userWords.length > 0 ? 15 : 0));

      evalResult = {
        score: calculatedScore,
        isWin: calculatedScore >= 60,
        wordCount: userWords.length,
        pronunciation: calculatedScore,
        grammar: calculatedScore,
        vocabulary: calculatedScore,
        reflexes: calculatedScore,
        content: calculatedScore,
        fluency: calculatedScore,
        detailedFeedback: `Bạn đã phát âm: "${userTranscript}". Cần đọc đầy đủ cả cụm "${targetPhrase}" để đạt điểm tối đa!`,
        wordAnalysis: userWords.map((w) => ({
          word: w,
          status: targetWords.includes(w) ? 'correct' : 'warning',
        })),
      };
    }

    return res.status(200).json({
      transcript: userTranscript,
      score: evalResult.score ?? 0,
      isWin: evalResult.isWin ?? false,
      wordCount: evalResult.wordCount ?? (userTranscript ? userTranscript.split(' ').length : 0),
      pronunciation: evalResult.pronunciation ?? evalResult.score ?? 0,
      grammar: evalResult.grammar ?? evalResult.score ?? 0,
      vocabulary: evalResult.vocabulary ?? evalResult.score ?? 0,
      reflexes: evalResult.reflexes ?? evalResult.score ?? 0,
      content: evalResult.content ?? evalResult.score ?? 0,
      fluency: evalResult.fluency ?? evalResult.score ?? 0,
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