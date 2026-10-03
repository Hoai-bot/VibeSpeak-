// api/evaluate.js
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const config = {
  api: {
    bodyParser: false, // Bắt buộc cho nhận Stream Audio
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Missing GROQ_API_KEY on Vercel' });
    }

    const audioBuffer = await getRawBody(req);

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty Audio Payload' });
    }

    // Gửi Audio Buffer sang Whisper STT API
    const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': req.headers['content-type'] || 'multipart/form-data',
      },
      body: audioBuffer,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      console.error('Groq Whisper Error:', errText);
      return res.status(500).json({ error: 'Whisper STT failed', details: errText });
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text ? whisperData.text.trim() : '';

    if (!transcript) {
      return res.status(200).json({
        score: 0,
        isWin: false,
        transcript: "(Im lặng hoặc không rõ âm thanh)",
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        wordAnalysis: [],
        detailedFeedback: "❌ AI không nghe thấy giọng nói tiếng Anh. Vui lòng thử lại!",
      });
    }

    const cefrLevel = req.query.cefrLevel || 'B2';
    const targetPrompt = req.query.promptEn || 'General speaking challenge';
    const words = transcript.split(/\s+/).filter((w) => w.length > 0);

    const systemPrompt = `You are a STRICT CEFR Speaking Examiner evaluating level [${cefrLevel}].

PROMPT: "${targetPrompt}"
TRANSCRIPT: "${transcript}"

STRICT EVALUATION RULES:
1. TASK FULFILLMENT: Check if prompt requirements were addressed.
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

    let parsed = {};
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Grade transcript: "${transcript}"` },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });
      parsed = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    } catch (aiErr) {
      console.warn('Groq LLM Warning:', aiErr);
    }

    const content = parsed.content ?? 50;
    const grammar = parsed.grammar ?? 60;
    const vocabulary = parsed.vocabulary ?? 60;
    const pronunciation = parsed.pronunciation ?? 70;
    const fluency = parsed.fluency ?? 60;
    const reflexes = parsed.reflexes ?? 60;

    const finalScore = Math.round(
      content * 0.4 + grammar * 0.2 + vocabulary * 0.2 + fluency * 0.1 + pronunciation * 0.1
    );

    const wordAnalysis =
      parsed.wordAnalysis && Array.isArray(parsed.wordAnalysis) && parsed.wordAnalysis.length > 0
        ? parsed.wordAnalysis
        : words.map((w) => ({ word: w, status: 'correct' }));

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
      detailedFeedback: parsed.detailedFeedback || (finalScore >= 65 ? "Bài nói tốt!" : "Cần cải thiện thêm."),
    });
  } catch (error) {
    console.error('Evaluate API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}