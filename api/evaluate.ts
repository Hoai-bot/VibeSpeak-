// api/evaluate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

export const config = {
  api: {
    bodyParser: false,
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
    .trim() || 'heart / hut';

  const targetPhrase = cleanScript;

  try {
    const audioBuffer = await getRawBody(req);
    const apiKey =
      process.env.GROQ_API_KEY_NEW ||
      process.env.GROQ_API_KEY ||
      process.env.GROQ_API ||
      process.env.EXPO_PUBLIC_GROQ_API_KEY;

    // 1. Kiểm tra audio quá nhỏ (Hạ xuống 300 bytes cho các từ siêu ngắn)
    if (!audioBuffer || audioBuffer.length < 300) {
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
        detailedFeedback: '❌ AI chưa nhận được âm thanh thu âm. Vui lòng giữ micro thêm 0.5s sau khi đọc xong!',
        wordAnalysis: [],
      });
    }

    let userTranscript = '';
    let evalResult: any = null;

    if (apiKey) {
      try {
        const groq = new Groq({ apiKey });

        const uint8Array = new Uint8Array(
          audioBuffer.buffer,
          audioBuffer.byteOffset,
          audioBuffer.byteLength
        );

        const rawContentType = (req.headers['content-type'] as string) || '';
        const mimeType = rawContentType.includes('audio') ? rawContentType.split(';')[0] : 'audio/webm';

        const audioFile = new File([uint8Array], 'recording.webm', { type: mimeType });

        // Gửi sang Whisper STT với Contextual Prompt giúp bắt từ ngắn siêu nhạy
        const transcription = await groq.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-large-v3',
          language: 'en',
          prompt: `Pronunciation practice for words: ${targetPhrase}`,
          response_format: 'json',
        });

        userTranscript = (transcription.text || '')
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
          .trim();

      } catch (aiError) {
        console.warn('⚠️ Groq Whisper bận hoặc lỗi parse audio:', aiError);
      }
    }

    // 2. NẾU WHISPER KHÔNG BẮT ĐƯỢC TỪ NÀO (IM LẶNG THỰC TẾ)
    if (!userTranscript || userTranscript.length === 0) {
      return res.status(200).json({
        transcript: '(Chưa nhận diện được giọng phát âm rõ ràng)',
        score: 0,
        isWin: false,
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: '❌ AI không nhận diện được giọng nói. Hãy kiểm tra Micro và đọc to rõ ràng hơn!',
        wordAnalysis: [],
      });
    }

    // 3. Tiến hành chấm điểm bằng LLAMA khi đã có transcript thực tế
    if (apiKey) {
      try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an AI English Pronunciation Referee for VibeSpeak.
Target Level: ${req.query.cefrLevel || 'A2'}.
Evaluate user spoken text against the Target Words.

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
              content: `Target Words: "${targetPhrase}"\nUser Spoke: "${userTranscript}"`
            }
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });
        evalResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
      } catch (e) {
        console.warn('Lỗi Llama eval:', e);
      }
    }

    // 4. Fallback Engine nếu Llama bận
    if (!evalResult || typeof evalResult.score !== 'number') {
      const targetWords = targetPhrase.toLowerCase().split(/\s+/);
      const userWords = userTranscript.toLowerCase().split(/\s+/);

      const matchedCount = userWords.filter((w) => targetWords.includes(w)).length;
      const coverageRatio = Math.min(1, matchedCount / Math.max(1, targetWords.length));
      
      const calculatedScore = Math.round(coverageRatio * 85 + 15);

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
        detailedFeedback: `Phát âm nhận diện: "${userTranscript}". Hãy tiếp tục phát âm rõ hơn nữa nhé!`,
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
      wordCount: evalResult.wordCount ?? userTranscript.split(' ').length,
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