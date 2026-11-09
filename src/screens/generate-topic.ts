// api/generate-topic.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tier, level } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY in server environment' });
  }

  const prompt = `You are an expert English language examiner for Station 2 (Reflex & Interaction Arena).
Generate 1 UNIQUE speaking challenge for CEFR level ${level} in tier ${tier}.
Timestamp seed: ${Date.now()}-${Math.random()}.
Rules:
- SOLO: 1 unexpected situational reflex question/scenario.
- RELAY: Partner A speaks a premise, Partner B extends or counters.
- ROLEPLAY: Realistic interpersonal conflict/negotiation between 2 roles.
Respond ONLY with raw JSON:
{"title": "Tiêu đề tiếng Việt", "contextDesc": "Bối cảnh tiếng Việt", "prompt": "English spoken sentence"}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.0,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}