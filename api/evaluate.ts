// api/evaluate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Groq } from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

export const config = {
  api: {
    bodyParser: false, // Tắt bodyParser mặc định để tự xử lý Stream Audio
  },
};

// Hàm đọc Stream request thành Buffer
function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Bổ sung CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!GROQ_API_KEY) {
      console.error("❌ Thiếu GROQ_API_KEY");
      return res.status(500).json({ error: 'Server Missing Groq API Key' });
    }

    // 1. Đọc Buffer dữ liệu Audio từ Request
    const rawAudioBuffer = await getRawBody(req);

    if (!rawAudioBuffer || rawAudioBuffer.length === 0) {
      return res.status(400).json({ error: 'Audio payload empty' });
    }

    // 2. Chuyển tiếp Audio Buffer tới Groq Whisper STT API
    const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': req.headers['content-type'] || 'multipart/form-data',
      },
      body: rawAudioBuffer,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      console.error("❌ Groq Whisper STT Error:", whisperResponse.status, errText);
      return res.status(500).json({ error: 'Whisper STT failed', details: errText });
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text ? whisperData.text.trim() : '';

    if (!transcript) {
      return res.status(200).json({
        score: 0,
        isWin: false,
        transcript: "(Âm thanh không rõ hoặc im lặng)",
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        wordAnalysis: [],
        detailedFeedback: "❌ AI không nghe thấy từ tiếng Anh nào rõ ràng. Vui lòng nói to và rõ hơn!",
      });
    }

    const words = transcript.split(/\s+/).filter((w: string) => w.length > 0);
    const cefrLevel = (req.query.cefrLevel as string) || 'B2';
    const targetPrompt = (req.query.promptEn as string) || 'General speaking challenge';

    // 3. Chấm điểm chi tiết qua Llama-3.3-70b
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const strictSystemPrompt = `You are a STRICT CEFR Speaking Examiner evaluating level [${cefrLevel}].

PROMPT: "${targetPrompt}"
TRANSCRIPT: "${transcript}"

STRICT EVALUATION RULES:
1. TASK FULFILLMENT: Address all parts.
2. WORD ANALYSIS: Categorize EVERY word in transcript as "correct", "warning", or "error".

Return ONLY JSON:
{
  "content": number,
  "grammar": number,
  "vocabulary": number,
  "pronunciation": number,
  "fluency": number,
  "reflexes": number,
  "missingRequirements": ["string"],
  "wordAnalysis": [{"word": "string", "status": "correct" | "warning" | "error"}],
  "detailedFeedback": "string"
}`;

    let parsed: any = {};
    try {
      const aiResponse = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: strictSystemPrompt },
          { role: 'user', content: `Grade transcript: "${transcript}"` }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      parsed = JSON.parse(aiResponse.choices[0]?.message?.content || '{}');
    } catch (aiErr) {
      console.warn("⚠️ Groq LLM Parse Warning:", aiErr);
    }

    const content = parsed.content ?? 50;
    const grammar = parsed.grammar ?? 60;
    const vocabulary = parsed.vocabulary ?? 60;
    const pronunciation = parsed.pronunciation ?? 70;
    const fluency = parsed.fluency ?? 60;
    const reflexes = parsed.reflexes ?? 60;

    const finalScore = Math.round(
      (content * 0.4) + (grammar * 0.2) + (vocabulary * 0.2) + (fluency * 0.1) + (pronunciation * 0.1)
    );

    const wordAnalysis = parsed.wordAnalysis && Array.isArray(parsed.wordAnalysis) && parsed.wordAnalysis.length > 0
      ? parsed.wordAnalysis
      : words.map((w: string) => ({ word: w, status: 'correct' }));

    return res.status(200).json({
      score: finalScore,
      isWin: finalScore >= 65,
      transcript,
      wordCount: words.length,
      pronunciation,
      grammar,
      vocabulary,
      reflexes,
      content,
      fluency,
      missingRequirements: parsed.missingRequirements || [],
      wordAnalysis,
      detailedFeedback: parsed.detailedFeedback || (finalScore >= 65 ? "Bài nói tốt!" : "Cần bổ sung thêm ý."),
    });

  } catch (error: any) {
    console.error("❌ Internal Server Error /api/evaluate:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}