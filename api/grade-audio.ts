// api/grade-audio.ts
export const config = {
  runtime: 'edge', // Vercel Edge Runtime phản hồi tức thì
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    // 1. Nhận khóa API Groq từ biến môi trường
    const groqApiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_NEW;
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY chưa được cấu hình trên Vercel' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Trích xuất file âm thanh và câu mẫu từ FormData (hỗ trợ cả trạm 1 và trạm 2)
    const formData: any = await req.formData();
    const audioFile = formData.get('audio') || formData.get('file');
    const targetPrompt = formData.get('prompt') || formData.get('targetSentence') || '';
    const cefrLevel = formData.get('level') || 'A1';

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy file âm thanh được gửi lên' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Gửi file âm thanh sang mô hình Whisper-large-v3 của Groq
    const whisperFormData: any = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-large-v3');
    whisperFormData.append('language', 'en');

    const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      return new Response(
        JSON.stringify({ error: 'Groq Whisper thất bại', details: errText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const whisperData = await whisperResponse.json();
    const transcript = (whisperData.text || '').trim();

    // 4. Tính điểm bài nói dựa trên độ nhận diện thực tế
    let calculatedScore = 75;
    let feedback = `Hoàn thành bài nói cấp độ ${cefrLevel}!`;

    if (targetPrompt) {
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const targetWords = normalize(targetPrompt).split(/\s+/).filter(Boolean);
      const spokenWords = normalize(transcript).split(/\s+/).filter(Boolean);

      let matchedCount = 0;
      targetWords.forEach((w: string) => {
        if (spokenWords.includes(w)) matchedCount++;
      });

      const accuracyRatio = targetWords.length > 0 ? matchedCount / targetWords.length : 0.8;
      calculatedScore = Math.min(100, Math.max(30, Math.round(accuracyRatio * 50 + 50)));
      feedback = `Phát âm chuẩn xác ${matchedCount}/${targetWords.length} từ khóa mục tiêu.`;
    } else {
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 25) calculatedScore = 92;
      else if (wordCount >= 15) calculatedScore = 85;
      else if (wordCount >= 8) calculatedScore = 75;
      else calculatedScore = Math.max(40, wordCount * 5 + 30);
    }

    return new Response(
      JSON.stringify({
        score: calculatedScore,
        transcript: transcript,
        feedback: feedback,
        isWin: calculatedScore >= 70,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Lỗi xử lý Whisper Serverless' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}