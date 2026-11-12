// api/generate-topic.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY in server environment' });
  }

  const { tier, level, promptInstruction, temperature = 1.0 } = req.body || {};

  const finalPrompt = promptInstruction || `You are an expert English language examiner for Station 2 (Reflex & Interaction Arena).
Generate 1 UNIQUE speaking challenge for CEFR level ${level || 'B1'} in tier ${tier || 'ROLEPLAY'}.
Timestamp seed: ${Date.now()}-${Math.random()}.
Rules:
- SOLO: 1 unexpected situational reflex question/scenario.
- RELAY: Partner A speaks a premise, Partner B extends or counters.
- ROLEPLAY: Realistic interpersonal conflict/negotiation between 2 roles.
Respond ONLY with raw JSON:
{"title": "Tiêu đề tiếng Việt", "contextDesc": "Bối cảnh tiếng Việt", "prompt": "English spoken sentence", "hintVi": "Tóm tắt gợi ý tiếng Việt"}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: finalPrompt }],
        temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Groq API Error', details: errorText });
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}