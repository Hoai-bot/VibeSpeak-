// api/evaluate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Groq } from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: GROQ_API_KEY });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'Server Missing Groq API Key configuration' });
    }

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
        detailedFeedback: "❌ AI không nghe thấy từ tiếng Anh nào rõ ràng. Vui lòng thử lại!",
      });
    }

    const cefrLevel = (req.query.cefrLevel as string) || 'B2';
    const targetPrompt = (req.query.promptEn as string) || 'General speaking challenge';

    const strictSystemPrompt = `You are a STRICT CEFR/IELTS Speaking Examiner evaluating a response for level [${cefrLevel}].

PROMPT: "${targetPrompt}"
CANDIDATE TRANSCRIPT: "${transcript}"

STRICT EVALUATION RULES:
1. TASK FULFILLMENT (Content Score): Check if ALL parts of the prompt were addressed.
   - If prompt asks for BOTH advantages AND disadvantages, but candidate only mentioned advantages, Content Score CANNOT exceed 50.
   - If response is under 20 words, Content Score CANNOT exceed 40.
2. GRAMMAR & VOCABULARY: Evaluate structural accuracy and vocabulary relevance.
3. FLUENCY & REFLEXES: Evaluate based on word count and logical coherence.

Return ONLY valid JSON matching:
{
  "content": number (0-100),
  "grammar": number (0-100),
  "vocabulary": number (0-100),
  "pronunciation": number (0-100),
  "fluency": number (0-100),
  "reflexes": number (0-100),
  "missingRequirements": ["List missing required points"],
  "detailedFeedback": "Short constructive feedback in Vietnamese explaining score penalty if any.",
  "improvedAnswerEn": "Improved answer covering 100% of prompt"
}`;

    const aiResponse = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: strictSystemPrompt },
        { role: 'user', content: `Grade transcript: "${transcript}"` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(aiResponse.choices[0]?.message?.content || '{}');
    const words = transcript.split(/\s+/).filter(w => w.length > 0);

    const content = parsed.content ?? 50;
    const grammar = parsed.grammar ?? 60;
    const vocabulary = parsed.vocabulary ?? 60;
    const pronunciation = parsed.pronunciation ?? 70;
    const fluency = parsed.fluency ?? 60;
    const reflexes = parsed.reflexes ?? 60;

    const finalScore = Math.round(
      (content * 0.4) + (grammar * 0.2) + (vocabulary * 0.2) + (fluency * 0.1) + (pronunciation * 0.1)
    );

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
      detailedFeedback: parsed.detailedFeedback || (finalScore >= 65 ? "Bài nói tốt!" : "Cần bổ sung thêm ý."),
      improvedAnswerEn: parsed.improvedAnswerEn || "",
    });

  } catch (error: any) {
    console.error("Lỗi Serverless Function Evaluate:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}