// api/evaluate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Groq } from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cho phép CORS
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!GROQ_API_KEY) {
      console.error("❌ Thiếu GROQ_API_KEY trên Vercel Environment Variables");
      return res.status(500).json({ error: 'Server Missing Groq API Key configuration' });
    }

    // 1. GỬI AUDIO TỚI WHISPER STT
    const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': req.headers['content-type'] || '',
      },
      body: req as any,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      console.error("❌ Whisper Error:", errText);
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
        detailedFeedback: "❌ AI không nghe thấy từ tiếng Anh nào rõ ràng. Vui lòng kiểm tra Micro và thử lại!",
      });
    }

    const words = transcript.split(/\s+/).filter((w: string) => w.length > 0);
    const cefrLevel = (req.query.cefrLevel as string) || 'B2';
    const targetPrompt = (req.query.promptEn as string) || 'General speaking challenge';

    // 2. CHẤM ĐIỂM VÀ TÔ MÀU TỪ BẰNG GROQ LLAMA
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const strictSystemPrompt = `You are a STRICT CEFR Speaking Examiner evaluating level [${cefrLevel}].

PROMPT: "${targetPrompt}"
TRANSCRIPT: "${transcript}"

STRICT EVALUATION RULES:
1. TASK FULFILLMENT: Address all parts. If advantages & disadvantages asked but only advantages given, max Content score is 45.
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
      console.warn("⚠️ Groq LLM Parse Warning, using fallback word analysis:", aiErr);
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

    // Fallback tô màu từng từ nếu AI không trả về danh sách wordAnalysis
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
    console.error("❌ Fatal Error in /api/evaluate:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}