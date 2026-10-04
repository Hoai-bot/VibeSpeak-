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
    .trim() || 'General speaking challenge';

  const targetPhrase = cleanScript;

  try {
    const audioBuffer = await getRawBody(req);
    const apiKey =
      process.env.GROQ_API_KEY_NEW ||
      process.env.GROQ_API_KEY ||
      process.env.GROQ_API ||
      process.env.EXPO_PUBLIC_GROQ_API_KEY;

    // 🚨 1. KIỂM TRA AUDIO RỖNG / QUÁ NGẮN -> TRẢ VỀ 0 ĐIỂM NGAY LẬP TỨC
    if (!audioBuffer || audioBuffer.length < 1000) {
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
        detailedFeedback: '❌ Chưa nhận được âm thanh thu âm. Vui lòng bấm nút micro và đọc to rõ ràng!',
        wordAnalysis: [],
      });
    }

    let userTranscript = '';
    let evalResult: any = null;

    if (apiKey) {
      try {
        const groq = new Groq({ apiKey });

        // Chuyển Buffer sang Uint8Array để fix triệt để lỗi TypeScript BlobPart trên Vercel
        const uint8Array = new Uint8Array(
          audioBuffer.buffer,
          audioBuffer.byteOffset,
          audioBuffer.byteLength
        );

        const rawContentType = (req.headers['content-type'] as string) || '';
        const mimeType = rawContentType.includes('audio') ? rawContentType.split(';')[0] : 'audio/webm';

        const audioFile = new File([uint8Array], 'recording.webm', { type: mimeType });

        // Gửi âm thanh thực tế sang Whisper STT
        const transcription = await groq.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-large-v3',
          language: 'en',
          response_format: 'json',
        });

        userTranscript = (transcription.text || '')
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
          .trim();

        // 🚨 2. NẾU WHISPER KHÔNG BẮT ĐƯỢC TỪ NÀO (IM LẶNG) -> TRẢ VỀ 0 ĐIỂM
        if (!userTranscript || userTranscript.length === 0) {
          return res.status(200).json({
            transcript: '(Không nhận diện được từ nào)',
            score: 0,
            isWin: false,
            wordCount: 0,
            pronunciation: 0,
            grammar: 0,
            vocabulary: 0,
            reflexes: 0,
            content: 0,
            fluency: 0,
            detailedFeedback: '⚠️ AI không nghe rõ bài phát âm của bạn. Hãy nói to và gần micro hơn nhé!',
            wordAnalysis: [],
          });
        }

        // 3. Tiến hành chấm điểm LLAMA dựa trên giọng nói thực tế thu được
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an AI English Pronunciation Referee for VibeSpeak Cyber Arena.
Target Level: ${req.query.cefrLevel || 'B2'}.
Evaluate user spoken text specifically against the Target Phrase.

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
              content: `Target Phrase: "${targetPhrase}"\nUser Spoke: "${userTranscript}"`
            }
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });
        evalResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
      } catch (aiError) {
        console.warn('⚠️ Groq AI bận, dùng Fallback Engine...');
      }
    }

    // 🚨 4. FALLBACK ENGINE (Chỉ tính điểm khi userTranscript THỰC SỰ CÓ TỪ)
    if (!userTranscript || userTranscript.length === 0) {
      return res.status(200).json({
        transcript: '(Không nhận diện được giọng nói)',
        score: 0,
        isWin: false,
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: '❌ Không ghi nhận được phát âm của bạn. Vui lòng bấm micro và đọc lại!',
        wordAnalysis: [],
      });
    }

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
        detailedFeedback: `Bạn đã phát âm: "${userTranscript}". Hãy tiếp tục luyện tập để phát âm chuẩn xác hơn!`,
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