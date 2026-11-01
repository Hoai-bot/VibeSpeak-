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
    let rawTranscript = normalize(transcript);

    // 🎯 1. GIẢI MÃ CÁC TỪ GHÉP BỊ WHISPER GỘP KHI ĐỌC LIÊN TỤC
    const compoundFixes: Record<string, string> = {
      'samsung': 'sum sung',
      'some sung': 'sum sung',
      'sunsung': 'sun sung',
      'barefoot': 'bare foot',
      'bedroom': 'bed room',
      'sunflower': 'sun flower',
      'seashore': 'sea shore',
      'seashells': 'sea shells',
      'railway': 'rail way'
    };

    Object.keys(compoundFixes).forEach((key) => {
      if (rawTranscript.includes(key)) {
        rawTranscript = rawTranscript.replace(new RegExp(`\\b${key}\\b`, 'g'), compoundFixes[key]);
      }
    });

    const spokenWords = rawTranscript.split(/\s+/).filter(Boolean);

    // 🎯 2. TỪ ĐIỂN TỪ ĐỒNG ÂM (HOMOPHONES) TRÁNH BỊ CHẤM SAI CHÍNH TẢ
    const homophonesMap: Record<string, string[]> = {
      'bare': ['bear'],
      'bear': ['bare'],
      'sum': ['some'],
      'some': ['sum'],
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
      const isMinimalPairDrill = cleanPrompt.includes('/');

      if (isMinimalPairDrill) {
        const pairWords = cleanPrompt.split('/').map((w: string) => w.trim()).filter(Boolean);
        const [wordA, wordB] = pairWords;

        const spokeWordA = isWordSpoken(wordA, spokenWords);
        const spokeWordB = isWordSpoken(wordB, spokenWords);

        if (spokeWordA && spokeWordB) {
          calculatedScore = Math.min(100, 85 + acousticQualityBonus);
          feedback = `🌟 Xuất sắc! Bạn đã phát âm phân biệt rất rõ cả cặp từ "${wordA}" và "${wordB}".`;
        } else if (spokeWordA || spokeWordB) {
          const matchedWord = spokeWordA ? wordA : wordB;
          calculatedScore = Math.min(95, Math.max(70, 70 + acousticQualityBonus));
          feedback = `👍 Bạn đã phát âm tốt từ "${matchedWord}". (Mẹo: Thử đọc cả cặp "${wordA} - ${wordB}" để đạt điểm tối đa 100 nhé!)`;
        } else {
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
      // 🎯 TRẠM 2: VOCABULARY ARENA (SOLO / RELAY / ROLEPLAY)
      const wordCount = spokenWords.length;

      // 🛡️ LỌC CÁC CÂU ẢO GIÁC DO WHISPER TỰ SINH KHI IM LẶNG
      const hallucinationPhrases = ['thank you', 'thanks for watching', 'subtitles by', 'bye', 'goodbye'];
      const isHallucination = wordCount <= 3 && hallucinationPhrases.some(h => transcript.toLowerCase().includes(h));

      if (isHallucination || wordCount < 4) {
        calculatedScore = Math.max(20, Math.min(35, wordCount * 6 + 10));
        feedback = `⚠️ Phản hồi quá ngắn hoặc chỉ ghi nhận tiếng ồn/từ chào (${wordCount} từ). Hãy đối thoại hoặc nói câu hoàn chỉnh theo chủ đề!`;
      } else {
        // 🎯 ĐIỀU CHỈNH NGƯỠNG ĐỘ DÀI THEO CẤP ĐỘ CEFR
        let minExcellentWords = 22;
        let minGoodWords = 14;
        let minPassWords = 8;

        const lvl = String(cefrLevel).toUpperCase();
        if (lvl === 'A1') {
          minExcellentWords = 16;
          minGoodWords = 10;
          minPassWords = 5;
        } else if (lvl === 'A2') {
          minExcellentWords = 20;
          minGoodWords = 12;
          minPassWords = 7;
        } else if (lvl === 'B2') {
          minExcellentWords = 28;
          minGoodWords = 18;
          minPassWords = 10;
        } else if (lvl === 'C1' || lvl === 'C2') {
          minExcellentWords = 35;
          minGoodWords = 22;
          minPassWords = 12;
        }

        // 🎯 KIỂM TRA ĐỘ BÁM SÁT CHỦ ĐỀ (TOPIC RELEVANCE BONUS)
        let topicRelevanceBonus = 0;
        if (targetPrompt) {
          const promptKeywords = cleanPrompt
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((w: string) => w.length >= 4);

          const matchedTopicWords = promptKeywords.filter((kw: string) => spokenWords.includes(kw));
          if (matchedTopicWords.length > 0) {
            topicRelevanceBonus = Math.min(10, matchedTopicWords.length * 3);
          }
        }

        // 🎯 TÍNH ĐIỂM TỔNG HỢP
        if (wordCount >= minExcellentWords) {
          calculatedScore = Math.min(100, 85 + Math.round(acousticQualityBonus * 0.4) + topicRelevanceBonus);
          feedback = `🌟 Bài nói rất phong phú (${wordCount} từ)! Phản xạ tự nhiên, lưu loát và bám sát chủ đề [${lvl}].`;
        } else if (wordCount >= minGoodWords) {
          calculatedScore = Math.min(94, 75 + Math.round(acousticQualityBonus * 0.4) + topicRelevanceBonus);
          feedback = `👍 Rất tốt (${wordCount} từ)! Diễn đạt mạch lạc và hoàn thành yêu cầu [${lvl}].`;
        } else if (wordCount >= minPassWords) {
          calculatedScore = Math.min(84, 65 + Math.round(acousticQualityBonus * 0.4) + topicRelevanceBonus);
          feedback = `👌 Đạt yêu cầu cơ bản (${wordCount} từ). Nên triển khai thêm chi tiết để đạt điểm xuất sắc.`;
        } else {
          calculatedScore = Math.max(35, wordCount * 6 + 15 + topicRelevanceBonus);
          feedback = `⚠️ Bài nói hơi ngắn so với chuẩn [${lvl}] (${wordCount} từ). Cần nói dài và mở rộng ý hơn.`;
        }
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