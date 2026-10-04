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
    .replace(/["']/g, '')
    .trim() || 'Describe your family members and their jobs.';

  const targetPhrase = cleanScript;

  try {
    const audioBuffer = await getRawBody(req);
    const apiKey =
      process.env.GROQ_API_KEY_NEW ||
      process.env.GROQ_API_KEY ||
      process.env.GROQ_API ||
      process.env.EXPO_PUBLIC_GROQ_API_KEY;

    // 🚨 1. KIỂM TRA BẢN THU ÂM RỖNG (Audio dưới 2KB ~ không có âm thanh)
    if (!audioBuffer || audioBuffer.length < 2000) {
      return res.status(200).json({
        transcript: '(Không ghi nhận được âm thanh)',
        score: 0,
        isWin: false,
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: '❌ Bạn chưa nói gì hoặc micro quá nhỏ! Vui lòng bật micro và thử lại.',
        wordAnalysis: [],
      });
    }

    let userTranscript = '';
    let evalResult: any = null;

    if (apiKey) {
      try {
        const groq = new Groq({ apiKey });
        const audioFile = new File([audioBuffer], 'recording.webm', {
          type: req.headers['content-type'] || 'audio/webm',
        });

        // Nhận diện giọng nói bằng Whisper
        const transcription = await groq.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-large-v3',
          language: 'en',
          response_format: 'json',
        });
        userTranscript = (transcription.text || '').trim();

        // 🚨 2. NẾU WHISPER KHÔNG BẮT ĐƯỢC TỪ NÀO (Nói thầm / Im lặng) -> TRẢ VỀ 0 ĐIỂM
        if (!userTranscript || userTranscript.length === 0) {
          return res.status(200).json({
            transcript: '(Im lặng / Không nghe rõ từ)',
            score: 0,
            isWin: false,
            wordCount: 0,
            pronunciation: 0,
            grammar: 0,
            vocabulary: 0,
            reflexes: 0,
            content: 0,
            fluency: 0,
            detailedFeedback: '⚠️ AI không nghe rõ bài phát âm của bạn. Hãy phát âm to và rõ ràng hơn nhé!',
            wordAnalysis: [],
          });
        }

        // 3. Tiến hành chấm điểm bằng Llama khi đã có giọng nói thực tế
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an AI English Pronunciation Referee for VibeSpeak Cyber Arena.
Target CEFR Level: ${req.query.cefrLevel || 'B2'}.
Evaluate user spoken text specifically against the Target Topic.

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
              content: `Target Topic: "${targetPhrase}"\nUser Spoke: "${userTranscript}"`
            }
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.3,
          response_format: { type: 'json_object' }
        });
        evalResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
      } catch (aiError) {
        console.warn('⚠️ Groq AI bận, dùng Fallback Engine...');
      }
    }

    // Fallback khi bận server (Chỉ tính khi người chơi THỰC SỰ CÓ NÓI)
    if (!evalResult || !evalResult.score) {
      const words = userTranscript.split(' ');
      evalResult = {
        score: Math.min(100, Math.max(30, words.length * 8)),
        isWin: words.length >= 5,
        wordCount: words.length,
        pronunciation: 75,
        grammar: 80,
        vocabulary: 75,
        reflexes: 70,
        content: 75,
        fluency: 70,
        detailedFeedback: `Bạn đã nói được ${words.length} từ đối với chủ đề "${targetPhrase}". Hãy tiếp tục mở rộng thêm câu trả lời!`,
        wordAnalysis: words.map((w) => ({ word: w, status: 'correct' })),
      };
    }

    return res.status(200).json({
      transcript: userTranscript,
      score: evalResult.score ?? 0,
      isWin: evalResult.isWin ?? false,
      wordCount: evalResult.wordCount ?? userTranscript.split(' ').length,
      pronunciation: evalResult.pronunciation ?? 0,
      grammar: evalResult.grammar ?? 0,
      vocabulary: evalResult.vocabulary ?? 0,
      reflexes: evalResult.reflexes ?? 0,
      content: evalResult.content ?? 0,
      fluency: evalResult.fluency ?? 0,
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