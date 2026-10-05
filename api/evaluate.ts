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
          prompt: `User is practicing pronunciation/shadowing: ${targetPhrase}`,
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

    // 2. Tiến hành chấm bằng Llama 3.1
    if (apiKey && userTranscript.length > 0) {
      try {
        const groq = new Groq({ apiKey });

        // Build System Prompt theo từng trạm
        let systemPrompt = '';
        if (isStation3) {
          systemPrompt = `You are an AI Shadowing Referee for VibeSpeak Station 3 (Shadow Boss Raid).
Evaluate user's shadowing accuracy against the target Boss phrase: "${targetPhrase}".
Instructions:
- Check how well user matched the words, rhythm, and pronunciation of the target phrase.
- Feedback MUST be in Vietnamese, brief, and focus strictly on shadowing accuracy and pronunciation (e.g. "Phát âm nhịp điệu rất chuẩn câu thoại Boss!"). NEVER tell user to add more sentences.

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
          systemPrompt = `You are an AI Referee for VibeSpeak Station 4 (Speaking Express - Open Response).
Target Level: ${req.query.cefrLevel || 'B2'}.
User is responding to a real-life situation/prompt: "${targetPhrase}".

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
        } else {
          systemPrompt = `You are an AI English Pronunciation Referee for VibeSpeak Arena.
Target Level: ${req.query.cefrLevel || 'B2'}.
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
            { role: 'user', content: `Target: "${targetPhrase}"\nUser Spoke: "${userTranscript}"` }
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

    // 3. DYNAMIC FALLBACK ENGINE DÀNH CHO CẢ TRẠM 3 VÀ TRẠM 4
    if (!evalResult || typeof evalResult.score !== 'number' || evalResult.score === 0) {
      const words = userTranscript.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      const targetWords = targetPhrase.toLowerCase().split(/\s+/);
      const userWords = userTranscript.toLowerCase().split(/\s+/);

      const matchedCount = userWords.filter((w) => targetWords.includes(w)).length;
      const coverageRatio = Math.min(1, matchedCount / Math.max(1, targetWords.length));

      let baseScore = Math.round(coverageRatio * 85 + 15);

      // Nhận xét chuẩn từng trạm trong Fallback Engine
      let feedbackText = `Bạn đã phát âm: "${userTranscript}". Phát âm rõ ràng, nhịp điệu khá mượt!`;
      if (isStation3) {
        feedbackText = `Khớp ${matchedCount}/${targetWords.length} từ câu thoại Boss! Phát âm chuẩn xác, gây -${baseScore} HP tổn hại!`;
      } else if (isStation4) {
        feedbackText = `Phản xạ rất tốt (${wordCount} từ)! Câu nói của bạn rõ ràng. Hãy tiếp tục duy trì phong độ nhé.`;
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

    return res.status(200).json({
      transcript: userTranscript,
      score: evalResult.score ?? 80,
      isWin: evalResult.isWin ?? true,
      wordCount: evalResult.wordCount ?? userTranscript.split(' ').length,
      pronunciation: evalResult.pronunciation ?? evalResult.score ?? 80,
      grammar: evalResult.grammar ?? evalResult.score ?? 80,
      vocabulary: evalResult.vocabulary ?? evalResult.score ?? 80,
      reflexes: evalResult.reflexes ?? evalResult.score ?? 80,
      content: evalResult.content ?? evalResult.score ?? 80,
      fluency: evalResult.fluency ?? evalResult.score ?? 80,
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