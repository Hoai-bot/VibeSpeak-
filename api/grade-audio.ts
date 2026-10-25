// api/grade-audio.ts
export const config = {
  runtime: 'edge', // Sử dụng Vercel Edge Runtime chạy cực nhanh
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    // Nhận cả GROQ_API_KEY_NEW hoặc GROQ_API_KEY đã thiết lập trên Vercel
    const groqApiKey = process.env.GROQ_API_KEY_NEW || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'Server GROQ_API_KEY is missing' }), { status: 500 });
    }

    // Nhận FormData chứa file âm thanh và câu mẫu từ client (ép kiểu any để tránh lỗi TS2339)
    const formData: any = await req.formData();
    const audioFile = formData.get('file');
    const targetSentence = formData.get('targetSentence') || '';

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), { status: 400 });
    }

    // 1. Gửi âm thanh lên Whisper của Groq để chuyển thành text (Transcription)
    const whisperFormData: any = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-large-v3');
    whisperFormData.append('language', 'en');

    const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      return new Response(JSON.stringify({ error: 'Whisper failed', details: errText }), { status: 500 });
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text || '';

    // 2. Chấm điểm độ khớp ngữ âm dựa trên transcript
    const cleanTarget = String(targetSentence).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const cleanSpoken = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    const targetWords = cleanTarget.split(/\s+/).filter(Boolean);
    const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

    let matchCount = 0;
    targetWords.forEach((word: string) => {
      if (spokenWords.includes(word)) matchCount++;
    });

    const accuracy = targetWords.length > 0 ? (matchCount / targetWords.length) : 0.8;
    const calculatedScore = Math.min(100, Math.max(30, Math.round(accuracy * 100)));

    return new Response(
      JSON.stringify({
        score: calculatedScore,
        transcript: transcript,
        isWin: calculatedScore >= 60,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
}