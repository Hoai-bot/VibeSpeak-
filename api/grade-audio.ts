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

    // 1. Gửi file âm thanh sang Whisper của Groq với verbose_json để lấy độ tự tin âm học (avg_logprob)
    const whisperFormData: any = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-large-v3');
    whisperFormData.append('language', 'en');
    whisperFormData.append('response_format', 'verbose_json');

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

    // 🎯 Trích xuất chỉ số âm học avg_logprob để tạo độ chênh lệch điểm số khi phát âm lại
    const segments = whisperData.segments || [];
    let avgLogprob = -0.4;
    if (segments.length > 0 && typeof segments[0].avg_logprob === 'number') {
      const sumLogprob = segments.reduce((acc: number, s: any) => acc + (s.avg_logprob || 0), 0);
      avgLogprob = sumLogprob / segments.length;
    }

    // Chuyển avg_logprob sang điểm thưởng âm học (0 - 25 điểm)
    const acousticQualityBonus = Math.max(0, Math.min(25, Math.round((avgLogprob + 0.9) * 30)));

    let calculatedScore = 75;
    let feedback = '';

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s/]/g, '').trim();
    const cleanPrompt = normalize(targetPrompt);
    const spokenWords = normalize(transcript).split(/\s+/).filter(Boolean);

    // 📚 TỪ ĐIỂN TỪ ĐỒNG ÂM (HOMOPHONES) PHỔ BIẾN TRÁNH BỊ CHẤM SAI CHÍNH TẢ
    const homophonesMap: Record<string, string[]> = {
      'bare': ['bear'],
      'bear': ['bare'],
      'sea': ['see'],
      'see': ['sea'],
      'meat': ['meet'],
      'meet': ['meat'],
      'sun': ['son'],
      'son': ['sun'],
      'wear': ['where'],
      'where': ['wear'],
      'pair': ['pear'],
      'pear': ['pair'],
      'right': ['write'],
      'write': ['right'],
      'air': ['heir'],
      'heir': ['air'],
      'buy': ['by', 'bye'],
      'bye': ['buy', 'by'],
      'by': ['buy', 'bye'],
      'for': ['four'],
      'four': ['for'],
      'to': ['too', 'two'],
      'too': ['to', 'two'],
      'two': ['to', 'too'],
      'one': ['won'],
      'won': ['one'],
      'flour': ['flower'],
      'flower': ['flour'],
      'peace': ['piece'],
      'piece': ['peace'],
      'wait': ['weight'],
      'weight': ['wait'],
      'break': ['brake'],
      'brake': ['break']
    };

    const isWordSpoken = (target: string, spokenList: string[]) => {
      if (spokenList.includes(target)) return true;
      const equivalents = homophonesMap[target] || [];
      return equivalents.some(eq => spokenList.includes(eq));
    };

    if (stationType === 'STATION_1' && targetPrompt) {
      // 🎯 XỬ LÝ CHUYÊN BIỆT CHO TRẠM 1: CẶP TỪ MINIMAL PAIRS HOẶC CÂU SHADOWING
      const isMinimalPairDrill = cleanPrompt.includes('/');

      if (isMinimalPairDrill) {
        const pairWords = cleanPrompt.split('/').map((w: string) => w.trim()).filter(Boolean);
        const [wordA, wordB] = pairWords;

        const spokeWordA = isWordSpoken(wordA, spokenWords);
        const spokeWordB = isWordSpoken(wordB, spokenWords);

        if (spokeWordA && spokeWordB) {
          // Sinh viên đọc phân biệt cả 2 từ (kể cả Whisper nhận chính tả đồng âm như bare -> bear)
          calculatedScore = Math.min(100, 85 + acousticQualityBonus);
          feedback = `🌟 Xuất sắc! Bạn đã phát âm phân biệt rất rõ cả cặp từ "${wordA}" và "${wordB}".`;
        } else if (spokeWordA || spokeWordB) {
          // Sinh viên tập trung luyện 1 từ trong cặp
          const matchedWord = spokeWordA ? wordA : wordB;
          calculatedScore = Math.min(95, Math.max(70, 70 + acousticQualityBonus));
          feedback = `👍 Bạn đã phát âm tốt từ "${matchedWord}". (Mẹo: Thử đọc cả cặp "${wordA} - ${wordB}" để đạt điểm tối đa 100 nhé!)`;
        } else {
          // Không khớp từ nào -> Đo độ tương đồng ngữ âm
          let bestSim = 0;
          pairWords.forEach((target: string) => {
            spokenWords.forEach((spoken: string) => {
              const maxLen = Math.max(target.length, spoken.length);
              if (maxLen === 0) return;
              let matchCount = 0;
              for (let i = 0; i < Math.min(target.length, spoken.length); i++) {
                if (target[i] === spoken[i]) matchCount++;
              }
              const sim = matchCount / maxLen;
              if (sim > bestSim) bestSim = sim;
            });
          });

          if (bestSim >= 0.6) {
            calculatedScore = Math.min(65, Math.round(bestSim * 50 + acousticQualityBonus * 0.5));
            feedback = `⚠️ Phát âm gần đúng (${transcript}) nhưng chưa chuẩn âm đích. Hãy nghe lại mẫu và thử lại!`;
          } else {
            calculatedScore = Math.max(20, Math.round(acousticQualityBonus));
            feedback = `❌ Chưa nhận diện đúng cặp từ mục tiêu. AI nghe thành: "${transcript}".`;
          }
        }
      } else {
        // Shadowing / Tongue Twisters thông thường
        const targetWords = cleanPrompt.replace(/\//g, ' ').split(/\s+/).filter(Boolean);
        let matchedCount = 0;
        targetWords.forEach((w: string) => {
          if (isWordSpoken(w, spokenWords)) matchedCount++;
        });

        const ratio = targetWords.length > 0 ? (matchedCount / targetWords.length) : 0;
        if (ratio === 0) {
          calculatedScore = Math.max(20, acousticQualityBonus);
          feedback = `❌ Phát âm chưa đúng câu mẫu. AI nghe được: "${transcript}".`;
        } else {
          calculatedScore = Math.min(100, Math.round(ratio * 70 + acousticQualityBonus));
          feedback = `Phát âm chuẩn xác ${matchedCount}/${targetWords.length} từ mục tiêu.`;
        }
      }
    } else {
      // 🎯 TRẠM 2: Nói tự do[cite: 11]
      const wordCount = spokenWords.length;
      if (wordCount >= 25) {
        calculatedScore = Math.min(100, 85 + Math.round(acousticQualityBonus * 0.6));
        feedback = `🌟 Bài nói rất phong phú (${wordCount} từ)! Phản xạ tự nhiên và trôi chảy.`;[cite: 11]
      } else if (wordCount >= 15) {
        calculatedScore = Math.min(95, 75 + Math.round(acousticQualityBonus * 0.6));
        feedback = `👍 Rất tốt (${wordCount} từ)! Diễn đạt mạch lạc và rõ ý.`;[cite: 11]
      } else if (wordCount >= 8) {
        calculatedScore = Math.min(85, 65 + Math.round(acousticQualityBonus * 0.6));
        feedback = `👌 Đạt yêu cầu cơ bản (${wordCount} từ).`;[cite: 11]
      } else {
        calculatedScore = Math.max(30, wordCount * 6 + 15);[cite: 11]
        feedback = `⚠️ Bài nói hơi ngắn (${wordCount} từ). Cần nói dài hơn.`;[cite: 11]
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