// api/generate-battle.js
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
    const { topic = 'Technology', level = 'B2', mode = 'cyber_battle' } = req.body || {};

    const systemPrompt = `You are the AI Referee and Opponent in VibeSpeak Cyber Arena - a Gamified English Speaking App.
Your task is to generate dynamic battle content in JSON format for the user.
Level: ${level}.
Topic: ${topic}.

Return ONLY a valid JSON object matching this structure:
{
  "battle_id": "arena_${Date.now()}",
  "bot_phrase": "An engaging English sentence for the user to respond to",
  "keywords": ["key1", "key2", "key3"],
  "sample_response": "A high-scoring target response for fluency practice",
  "time_limit_seconds": 15
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a new Cyber Arena challenge for topic: ${topic}` },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');

    return res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    console.error('Groq Proxy Error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI Processing Failed',
      details: error.message,
    });
  }
}