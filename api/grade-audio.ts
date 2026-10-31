// api/grade-audio.ts
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const groqApiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_NEW;
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY chưa được cấu hình trên Vercel' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData: any = await req.formData();
    const audioFile = formData.get('audio') || formData.get('file');
    const targetPrompt = formData.get('prompt') || formData.get('targetSentence') || '';
    const stationType = (formData.get('stationType') || 'STATION_1').toUpperCase();
    const cefrLevel = formData.get('level') || 'A1';

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy file âm thanh được gửi lên' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Gửi file âm thanh sang Whisper của Groq
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

    // 🛡️ CHẶN NẠP BÀI RỖNG / KHÔNG NÓI GÌ Ở CẢ 2 TRẠM
    if (!transcript) {
      return new Response(
        JSON.stringify({
          score: 0,
          transcript: "(Không phát hiện giọng nói)",
          feedback: "❌ Không nhận diện được âm thanh phát âm! Vui lòng bấm làm lại và đọc to, rõ ràng hơn.",
          isWin: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let calculatedScore = 0;
    let feedback = '';

    if (stationType === 'STATION_1' && targetPrompt) {
      // 🎯 TRẠM 1: Minimal Pairs / Shadowing
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const targetWords = normalize(targetPrompt).split(/\s+/).filter(Boolean);
      const spokenWords = normalize(transcript).split(/\s+/).filter(Boolean);

      let totalScoreWeight = 0;

      targetWords.forEach((target) => {
        if (spokenWords.includes(target)) {
          totalScoreWeight += 1.0;
        } else {
          // Đo lường độ tương đồng ngữ âm cho cặp từ tối thiểu
          let bestSim = 0;
          spokenWords.forEach((spoken) => {
            const maxLen = Math.max(target.length, spoken.length);
            if (maxLen === 0) return;
            let matchChars = 0;
            const minLen = Math.min(target.length, spoken.length);
            for (let i = 0; i < minLen; i++) {
              if (target[i] === spoken[i]) matchChars++;
            }
            const sim = matchChars / maxLen;
            if (sim > bestSim) bestSim = sim;
          });

          if (bestSim >= 0.6) {
            totalScoreWeight += bestSim * 0.7; // Thưởng điểm phát âm tương đồng
          }
        }
      });

      const matchedCount = targetWords.filter((w) => spokenWords.includes(w)).length;
      const ratio = targetWords.length > 0 ? totalScoreWeight / targetWords.length : 0;

      // Không khớp từ và không có âm tương đồng -> cho điểm liệt (20đ) thay vì mức 50đ cố định
      if (ratio === 0) {
        calculatedScore = 20;
        feedback = `❌ Phát âm chưa đúng từ mục tiêu (${transcript}). Hãy nghe lại mẫu và thử lại!`;
      } else {
        calculatedScore = Math.min(100, Math.round(ratio * 70 + 30));
        feedback = `Phát âm chuẩn xác ${matchedCount}/${targetWords.length} từ mục tiêu.`;
      }
    } else {
      // 🎯 TRẠM 2: Nói tự do
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 25) {
        calculatedScore = 95;
        feedback = `🌟 Bài nói rất phong phú (${wordCount} từ)! Phản xạ tự nhiên và trôi chảy.`;
      } else if (wordCount >= 15) {
        calculatedScore = 88;
        feedback = `👍 Rất tốt (${wordCount} từ)! Diễn đạt mạch lạc và rõ ý.`;
      } else if (wordCount >= 8) {
        calculatedScore = 78;
        feedback = `👌 Đạt yêu cầu cơ bản (${wordCount} từ).`;
      } else {
        calculatedScore = Math.max(30, wordCount * 6 + 15);
        feedback = `⚠️ Bài nói hơi ngắn (${wordCount} từ). Cần nói dài hơn.`;
      }
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