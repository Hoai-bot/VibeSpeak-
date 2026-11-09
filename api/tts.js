// api/tts.js
// Bộ phát âm thanh AI Serverless: Hỗ trợ cả GET (nghe mẫu Trạm 2) và POST (Shadow Boss),
// tự động chọn OpenAI TTS (nếu có key) hoặc Fallback TTS miễn phí chất lượng cao.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Nhận dữ liệu linh hoạt từ cả GET (query param) lẫn POST (request body)
  let text = '';
  let voice = 'nova'; // Mặc định giọng tự nhiên cho luyện nói

  if (req.method === 'GET') {
    text = req.query.text || '';
    if (req.query.voice) voice = req.query.voice;
  } else if (req.method === 'POST') {
    const body = req.body || {};
    text = body.text || '';
    if (body.voice) voice = body.voice; // ví dụ: 'onyx' cho Shadow Boss
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text content is required' });
  }

  const cleanText = text.replace(/["']/g, '').trim().slice(0, 500);

  try {
    // 2. Ưu tiên 1: OpenAI TTS chính thống (nếu có cấu hình OPENAI_API_KEY)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: cleanText,
            voice: voice, // 'nova' cho luyện nói thông thường, 'onyx' cho Shadow Boss
            speed: 0.95,
          }),
        });

        if (openAiRes.ok) {
          const audioBuffer = await openAiRes.arrayBuffer();
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
          return res.send(Buffer.from(audioBuffer));
        }
      } catch (err) {
        console.warn('OpenAI TTS error, falling back:', err.message);
      }
    }

    // 3. Ưu tiên 2: Streaming TTS chất lượng cao miễn phí (chạy được ngay 100% không cần key)
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=en-US&client=tw-ob`;
    const fallbackRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (fallbackRes.ok) {
      const audioBuffer = await fallbackRes.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.send(Buffer.from(audioBuffer));
    }

    return res.status(502).json({ error: 'TTS Synthesis failed on all providers' });
  } catch (error) {
    console.error('TTS Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}