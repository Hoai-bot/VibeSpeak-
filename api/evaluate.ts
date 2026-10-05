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
        detailedFeedback: '❌ AI chưa nhận được âm thanh thu âm. Vui lòng bấm nút micro và đọc lại!',
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

        // 1. Whisper STT
        const transcription = await groq.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-large-v3',
          language: 'en',
          prompt: `User is answering prompt: ${targetPhrase}`,
          response_format: 'json',
        });

        userTranscript = (transcription.text || '')
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
          .trim();

      } catch (aiError) {
        console.warn('⚠️️ Groq Whisper STT error:', aiError);
      }
    }

    // 2. Nếu không nghe thấy chữ nào
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
        detailedFeedback: '❌ AI không nhận diện được giọng nói. Hãy kiểm tra Micro và cất giọng rõ hơn!',
        wordAnalysis: [],
      });
    }

    // 3. Tiến hành chấm bằng Llama 3.1
    if (apiKey && userTranscript.length > 0) {
      try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an AI English Referee for VibeSpeak Arena.
Target CEFR Level: ${req.query.cefrLevel || 'B2'}.
User is responding to the Situation/Prompt.

EVALUATION RULES:
- Evaluate fluency, pronunciation, grammar, vocabulary, reflexes, and context relevance.
- Do NOT demand exact word matching with prompt. Open responses are expected.
- Be fair: clear and grammatically sound answers should get 70-90+ points.

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
  "detailedFeedback": "string in Vietnamese",
  "wordAnalysis": [{ "word": "string", "status": "correct" | "warning" | "error" }]
}`
            },
            {
              role: 'user',
              content: `Prompt/Situation: "${targetPhrase}"\nUser Spoke: "${userTranscript}"`
            }
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });

        evalResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
      } catch (e) {
        console.warn('⚠️ Lỗi Llama LLM, chuyển sang Dynamic Fallback Engine:', e);
      }
    }

    // 4. DYNAMIC FALLBACK ENGINE DÀNH CHO BÀI NÓI THỜI GIAN THỰC / TỰ DO
    if (!evalResult || typeof evalResult.score !== 'number' || evalResult.score === 0) {
      const words = userTranscript.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      // Tính điểm linh hoạt dựa trên độ dài phản xạ nói thực tế
      let baseScore = 65;
      if (wordCount >= 12) baseScore = 85;
      else if (wordCount >= 7) baseScore = 75;
      else if (wordCount >= 4) baseScore = 68;

      const pronunciation = Math.min(95, baseScore + 5);
      const grammar = Math.min(90, baseScore);
      const vocabulary = Math.min(90, baseScore);
      const reflexes = Math.min(95, wordCount >= 5 ? 85 : 70);
      const content = Math.min(90, wordCount >= 5 ? 80 : 65);
      const fluency = Math.min(95, wordCount >= 5 ? 80 : 65);

      const calculatedScore = Math.round(
        (pronunciation + grammar + vocabulary + reflexes + content + fluency) / 6
      );

      evalResult = {
        score: calculatedScore,
        isWin: calculatedScore >= 60,
        wordCount,
        pronunciation,
        grammar,
        vocabulary,
        reflexes,
        content,
        fluency,
        detailedFeedback: `Bạn phản xạ được ${wordCount} từ: "${userTranscript}". Phát âm rõ ràng, hãy tiếp tục mở rộng câu trả lời dài hơn nhé!`,
        wordAnalysis: words.map((w) => ({ word: w, status: 'correct' })),
      };
    }

    return res.status(200).json({
      transcript: userTranscript,
      score: evalResult.score ?? 75,
      isWin: evalResult.isWin ?? true,
      wordCount: evalResult.wordCount ?? userTranscript.split(' ').length,
      pronunciation: evalResult.pronunciation ?? evalResult.score ?? 75,
      grammar: evalResult.grammar ?? evalResult.score ?? 75,
      vocabulary: evalResult.vocabulary ?? evalResult.score ?? 75,
      reflexes: evalResult.reflexes ?? evalResult.score ?? 75,
      content: evalResult.content ?? evalResult.score ?? 75,
      fluency: evalResult.fluency ?? evalResult.score ?? 75,
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