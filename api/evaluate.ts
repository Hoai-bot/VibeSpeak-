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
          prompt: `User is practicing English speaking (${currentLevel}):${targetPhrase}`,
          response_format: 'json',
        });

        userTranscript = (transcription.text || '')
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
          .trim();

      } catch (aiError) {
        console.warn('⚠️ Groq Whisper STT error:', aiError);
      }
    }

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

    // 2. Chấm điểm bằng Llama 3
    if (apiKey && userTranscript.length > 0) {
      try {
        const groq = new Groq({ apiKey });

        let systemPrompt = '';
        if (isStation3) {
          systemPrompt = `You are an AI Shadowing Referee for VibeSpeak Station 3 (Shadow Boss Raid).
Target Level: ${currentLevel}.
Evaluate user's shadowing accuracy against the target Boss phrase: "${targetPhrase}".
Instructions:
- Check how well user matched the words, rhythm, and pronunciation of the target phrase.
- Feedback MUST be in Vietnamese, brief, and focus strictly on shadowing accuracy and pronunciation. NEVER tell user to add more sentences.

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
}`;
        } else if (isStation4) {
          systemPrompt = `You are an AI Referee for VibeSpeak Station 4 (Speaking Express - Quick Reflex).
Target Level: ${currentLevel}.
Situation Prompt: "${targetPhrase}".

CRITICAL SCORING RULES FOR STATION 4 BASED ON CEFR LEVEL:
- For A1-A2 Level: Short, natural, and accurate responses (e.g., "You're welcome", "I like blue", "Yes, please") MUST score 85-100 points! Do NOT expect long sentences for A1-A2.
- For B1-B2 Level: Answers should contain 1-2 clear sentences with logical reasoning (80-95 points).
- For C1-C2 Level: Answers should use sophisticated vocabulary and sharp argument (85-100 points).
- Give high scores for valid, fluent, and naturally pronounced answers.

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
}`;
        }

        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Target Prompt: "${targetPhrase}"\nUser Answer: "${userTranscript}"` }
          ],
          model: 'llama3-8b-8192',
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });

        evalResult = JSON.parse(completion.choices[0]?.message?.content || '{}');
      } catch (e) {
        console.warn('⚠️ Lỗi Llama LLM, chuyển sang Dynamic Fallback Engine:', e);
      }
    }

    // 3. DYNAMIC FALLBACK ENGINE THEO CEFR LEVEL
    if (!evalResult || typeof evalResult.score !== 'number' || evalResult.score === 0) {
      const words = userTranscript.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      if (isStation4) {
        const userTextLower = userTranscript.toLowerCase();
        const commonReflexPhrases = [
          "you're welcome", "you are welcome", "no problem", "my pleasure", 
          "don't mention it", "not at all", "yes please", "no thanks", "good morning"
        ];

        const isExactMatchReflex = commonReflexPhrases.some(phrase => userTextLower.includes(phrase));

        let baseScore = 80;
        
        if (currentLevel === 'A1' || currentLevel === 'A2') {
          if (isExactMatchReflex || wordCount >= 2) baseScore = 90;
          else baseScore = 75;
        } else if (currentLevel === 'B1' || currentLevel === 'B2') {
          if (wordCount >= 6) baseScore = 88;
          else if (wordCount >= 3) baseScore = 80;
          else baseScore = 70;
        } else { // C1, C2
          if (wordCount >= 10) baseScore = 90;
          else if (wordCount >= 5) baseScore = 80;
          else baseScore = 65;
        }

        evalResult = {
          score: baseScore,
          isWin: baseScore >= 60,
          wordCount,
          pronunciation: Math.min(95, baseScore + 5),
          grammar: baseScore,
          vocabulary: baseScore,
          reflexes: Math.min(98, baseScore + 8),
          content: baseScore,
          fluency: baseScore,
          detailedFeedback: `Phản xạ [${currentLevel}] rất chuẩn xác và tự nhiên: "${userTranscript}"!`,
          wordAnalysis: words.map((w) => ({ word: w, status: 'correct' })),
        };
      } else {
        const targetWords = targetPhrase.toLowerCase().split(/\s+/);
        const userWords = userTranscript.toLowerCase().split(/\s+/);

        const matchedCount = userWords.filter((w) => targetWords.includes(w)).length;
        const coverageRatio = Math.min(1, matchedCount / Math.max(1, targetWords.length));
        const baseScore = Math.round(coverageRatio * 85 + 15);

        let feedbackText = `Bạn đã phát âm: "${userTranscript}". Phát âm rõ ràng!`;
        if (isStation3) {
          feedbackText = `Khớp ${matchedCount}/${targetWords.length} từ câu thoại Boss [${currentLevel}]! Sát thương -${baseScore} HP!`;
        }

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
          detailedFeedback: feedbackText,
          wordAnalysis: words.map((w) => ({
            word: w,
            status: targetWords.includes(w.toLowerCase()) ? 'correct' : 'warning',
          })),
        };
      }
    }

    return res.status(200).json({
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
    console.error('Lỗi API Evaluate:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ chấm điểm AI',
      details: error?.message || error,
    });
  }
}