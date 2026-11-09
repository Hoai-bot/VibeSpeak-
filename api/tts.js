// api/tts.js
// 🎙️ MICROSOFT EDGE-TTS SERVERLESS API
// Hoàn toàn MIỄN PHÍ - KHÔNG CẦN API KEY - Giọng AI Neural đỉnh cao như người bản xứ
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Bảng ánh xạ giọng sang Microsoft Neural Voices:
const VOICE_MAP = {
  nova: 'en-US-JennyNeural',        // Giọng nữ tự nhiên, biểu cảm chuẩn bản xứ (Trạm 2)
  shimmer: 'en-US-AriaNeural',      // Giọng nữ trong trẻo, sinh động
  onyx: 'en-US-ChristopherNeural',  // Giọng nam trầm hùng, uy quyền (Shadow Boss)
  echo: 'en-US-GuyNeural',          // Giọng nam tự nhiên, phổ biến
  alloy: 'en-US-EricNeural'         // Giọng nam thanh lịch
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Nhận dữ liệu linh hoạt từ GET (Trạm 2) hoặc POST (Shadow Boss)
  let text = '';
  let requestedVoice = 'nova';

  if (req.method === 'GET') {
    text = req.query.text || '';
    if (req.query.voice) requestedVoice = req.query.voice;
  } else if (req.method === 'POST') {
    const body = req.body || {};
    text = body.text || '';
    if (body.voice) requestedVoice = body.voice;
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text content is required' });
  }

  const cleanText = text.replace(/["']/g, '').trim().slice(0, 500);
  const edgeVoice = VOICE_MAP[requestedVoice.toLowerCase()] || requestedVoice || 'en-US-JennyNeural';

  try {
    // 2. Khởi tạo Microsoft Edge TTS với giọng Neural chất lượng cao
    const tts = new MsEdgeTTS();
    await tts.setMetadata(edgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const readable = tts.toStream(cleanText);

    const chunks = [];
    readable.on('data', (chunk) => {
      chunks.push(chunk);
    });

    readable.on('end', () => {
      const audioBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'audio/mpeg');
      // Cache 24h trên Vercel CDN để các lần nghe tiếp theo phản hồi tức thì (0ms)
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.send(audioBuffer);
    });

    readable.on('error', async (err) => {
      console.warn('Edge TTS streaming error, falling back:', err);
      return fallbackGoogleTTS(cleanText, res);
    });
  } catch (error) {
    console.error('Edge TTS Init Error, using fallback:', error);
    return fallbackGoogleTTS(cleanText, res);
  }
}

// Hàm dự phòng (nếu kết nối tới máy chủ Microsoft gặp sự cố)
async function fallbackGoogleTTS(text, res) {
  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en-US&client=tw-ob`;
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
    return res.status(502).json({ error: 'All TTS engines failed' });
  } catch (e) {
    return res.status(500).json({ error: 'TTS fallback error' });
  }
}