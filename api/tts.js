// api/tts.js
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICE_MAP = {
  nova: 'en-US-JennyNeural',        // Giọng nữ tự nhiên chuẩn phòng thu
  shimmer: 'en-US-AriaNeural',
  onyx: 'en-US-ChristopherNeural',  // Giọng nam trầm Shadow Boss
  echo: 'en-US-GuyNeural',
  alloy: 'en-US-EricNeural'
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
    const tts = new MsEdgeTTS();
    await tts.setMetadata(edgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // Thu thập toàn bộ Audio Chunks thành Buffer hoàn chỉnh
    const readable = tts.toStream(cleanText);
    const chunks = [];

    await new Promise((resolve, reject) => {
      readable.on('data', (chunk) => chunks.push(chunk));
      readable.on('end', resolve);
      readable.on('error', reject);
    });

    const audioBuffer = Buffer.concat(chunks);
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Empty audio buffer from Edge TTS");
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    console.error('Edge TTS Failure:', error);
    // Trả về lỗi 500 rõ ràng thay vì trả về giọng robot của Google dịch
    return res.status(500).json({ error: 'Edge TTS synthesis failed', details: error.message });
  }
}