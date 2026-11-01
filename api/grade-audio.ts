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
    const cefrLevel = (formData.get('level') || 'B2').toUpperCase();

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy file âm thanh được gửi lên' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Gửi file âm thanh sang Groq Whisper với verbose_json để đo độ chuẩn âm học
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

    // 🛡️ CHẶN FILE RỖNG / KHÔNG NÓI GÌ
    if (!transcript) {
      return new Response(
        JSON.stringify({
          score: 0,
          transcript: "(Không phát hiện giọng nói)",
          feedback: "❌ Không nhận diện được âm thanh phát âm! Vui lòng bấm làm lại và nói to, rõ ràng hơn.",
          isWin: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🎯 Trích xuất chỉ số âm học avg_logprob
    const segments = whisperData.segments || [];
    let avgLogprob = -0.4;
    if (segments.length > 0 && typeof segments[0].avg_logprob === 'number') {
      const sumLogprob = segments.reduce((acc: number, s: any) => acc + (s.avg_logprob || 0), 0);
      avgLogprob = sumLogprob / segments.length;
    }

    // 🎯 Chuẩn hóa điểm thưởng âm học (2 - 15 điểm)
    const normalizedLogprob = Math.max(-1.0, Math.min(0, avgLogprob));
    const acousticQualityBonus = Math.max(2, Math.min(15, Math.round((normalizedLogprob + 1.0) * 15)));

    let calculatedScore = 75;
    let feedback = '';

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s/]/g, '').trim();
    const cleanPrompt = normalize(targetPrompt);
    let rawTranscript = normalize(transcript);

    // 🎯 Giải mã từ ghép và từ viết tắt
    const compoundFixes: Record<string, string> = {
      'samsung': 'sum sung',
      'some sung': 'sum sung',
      'sunsung': 'sun sung',
      'barefoot': 'bare foot',
      'bedroom': 'bed room',
      'sunflower': 'sun flower',
      'seashore': 'sea shore',
      'seashells': 'sea shells',
      'railway': 'rail way',
      "i've": 'i have',
      "it's": 'it is',
      "what'd": 'what did',
      "don't": 'do not',
      "can't": 'can not',
      "you're": 'you are'
    };

    Object.keys(compoundFixes).forEach((key) => {
      if (rawTranscript.includes(key)) {
        rawTranscript = rawTranscript.replace(new RegExp(`\\b${key}\\b`, 'g'), compoundFixes[key]);
      }
    });

    const spokenWords = rawTranscript.split(/\s+/).filter(Boolean);

    // 🎯 Bảng từ đồng âm phổ biến (Homophones Map)
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

    // =========================================================================
    // 🎯 NHÁNH 1: TRẠM 1 - PRONUNCIATION LAB
    // =========================================================================
    if (stationType === 'STATION_1' && targetPrompt) {
      const isMinimalPairDrill = cleanPrompt.includes('/');

      if (isMinimalPairDrill) {
        const pairWords = cleanPrompt.split('/').map((w: string) => w.trim()).filter(Boolean);
        const [wordA, wordB] = pairWords;

        // 🎯 BẪY NGỮ ÂM ĐẶC BIỆT: leave / live (/iː/ vs /ɪ/)
        const isLeaveLiveDrill = (wordA === 'leave' && wordB === 'live') || (wordA === 'live' && wordB === 'leave');
        const spokenTextLower = rawTranscript.toLowerCase();

        // Nếu người học phát âm nhầm thành /laɪv/ (Whisper thường bóc ra "alive", "life", "line" hoặc ngữ cảnh âm /aɪ/)
        const mispronouncedAsLaiv = isLeaveLiveDrill && (
          spokenWords.includes('alive') ||
          spokenWords.includes('life') ||
          spokenWords.includes('line') ||
          spokenTextLower.includes('live stream') ||
          spokenTextLower.includes('live music')
        );

        if (mispronouncedAsLaiv) {
          calculatedScore = Math.min(65, Math.max(45, 50 + acousticQualityBonus));
          feedback = `⚠️ Chú ý: Từ "live" trong bài tập này là động từ, phát âm âm ngắn là /lɪv/ (như "lip"), không phát âm là /laɪv/ (như trong "livestream"). Hãy thử lại!`;
        } else {
          const spokeWordA = isWordSpoken(wordA, spokenWords);
          const spokeWordB = isWordSpoken(wordB, spokenWords);

          if (spokeWordA && spokeWordB) {
            calculatedScore = Math.min(100, 88 + Math.round(acousticQualityBonus * 0.8));
            feedback = `🌟 Xuất sắc! Bạn đã phát âm phân biệt rất rõ cả cặp từ "${wordA}" và "${wordB}".`;
          } else if (spokeWordA || spokeWordB) {
            const matchedWord = spokeWordA ? wordA : wordB;
            calculatedScore = Math.min(88, Math.max(72, 75 + Math.round(acousticQualityBonus * 0.8)));
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
              calculatedScore = Math.min(68, Math.round(bestSim * 50 + acousticQualityBonus));
              feedback = `⚠️ Phát âm gần đúng (${transcript}) nhưng chưa chuẩn âm đích. Hãy nghe lại mẫu và thử lại!`;
            } else {
              calculatedScore = Math.max(20, Math.round(acousticQualityBonus * 2));
              feedback = `❌ Chưa nhận diện đúng cặp từ mục tiêu. AI nghe thành: "${transcript}".`;
            }
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
          calculatedScore = Math.max(20, acousticQualityBonus * 2);
          feedback = `❌ Phát âm chưa đúng câu mẫu. AI nghe được: "${transcript}".`;
        } else {
          calculatedScore = Math.min(100, Math.round(ratio * 85 + acousticQualityBonus));
          feedback = `Phát âm chuẩn xác ${matchedCount}/${targetWords.length} từ mục tiêu.`;
        }
      }

    // =========================================================================
    // 👻 NHÁNH 2: TRẠM 3 - GHOST STATION (SHADOWING ECHO CHUYÊN SÂU)
    // =========================================================================
    } else if (stationType === 'STATION_3') {
      const targetWords = cleanPrompt.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      let matchedCount = 0;
      targetWords.forEach((w: string) => {
        if (isWordSpoken(w, spokenWords)) matchedCount++;
      });

      const accuracyRatio = targetWords.length > 0 ? (matchedCount / targetWords.length) : 0;

      if (accuracyRatio === 0) {
        calculatedScore = Math.max(15, acousticQualityBonus);
        feedback = `❌ Chưa đuổi kịp ngữ điệu của Bóng Ma. AI nghe được: "${transcript}".`;
      } else if (accuracyRatio >= 0.85) {
        calculatedScore = Math.min(100, 88 + Math.round(acousticQualityBonus * 0.8));
        feedback = `🌟 Xuất sắc! Bạn đã bắt kịp nhịp điệu của Bóng Ma (${matchedCount}/${targetWords.length} từ).`;
      } else if (accuracyRatio >= 0.6) {
        calculatedScore = Math.min(87, Math.round(accuracyRatio * 75 + acousticQualityBonus));
        feedback = `👍 Khá tốt! Đã theo kịp đa số từ (${matchedCount}/${targetWords.length}). Cần mượt mà hơn ở các cụm nối âm.`;
      } else {
        calculatedScore = Math.max(30, Math.round(accuracyRatio * 60 + acousticQualityBonus));
        feedback = `⚠️ Rớt nhịp khá nhiều (${matchedCount}/${targetWords.length} từ). Hãy dùng tính năng Cứu hộ Oasis để tập nối âm chậm nhé!`;
      }

    // =========================================================================
    // ⚡ NHÁNH 3: TRẠM 4 - SPEAKING EXPRESS (PHẢN XẠ NHANH 10 - 15 GIÂY)
    // =========================================================================
    } else if (stationType === 'STATION_4') {
      const wordCount = spokenWords.length;

      const hallucinationPhrases = ['thank you', 'thanks for watching', 'subtitles by', 'bye', 'goodbye'];
      const isHallucination = wordCount <= 2 && hallucinationPhrases.some(h => transcript.toLowerCase().includes(h));

      if (isHallucination || wordCount < 3) {
        calculatedScore = Math.max(20, Math.min(40, wordCount * 10));
        feedback = `⚠️ Phản hồi quá ngắn hoặc chỉ là từ đệm (${wordCount} từ). Hãy đưa ra câu trả lời trực diện cho tình huống!`;
      } else {
        let targetExcellent = 12;
        let targetGood = 8;
        let targetPass = 5;

        if (cefrLevel === 'A1' || cefrLevel === 'A2') {
          targetExcellent = 9;
          targetGood = 6;
          targetPass = 4;
        } else if (cefrLevel === 'C1' || cefrLevel === 'C2') {
          targetExcellent = 16;
          targetGood = 11;
          targetPass = 7;
        }

        let keywordBonus = 0;
        if (targetPrompt) {
          const promptKeywords = cleanPrompt
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((w: string) => w.length >= 4);

          const matchedKeywords = promptKeywords.filter((kw: string) => spokenWords.includes(kw));
          if (matchedKeywords.length > 0) {
            keywordBonus = Math.min(12, matchedKeywords.length * 4);
          }
        }

        if (wordCount >= targetExcellent) {
          calculatedScore = Math.min(100, 86 + Math.round(acousticQualityBonus * 0.4) + keywordBonus);
          feedback = `🚀 Phản xạ siêu nhanh & trôi chảy (${wordCount} từ)! Câu trả lời đủ ý, bật ra tức thì rất tự nhiên [${cefrLevel}].`;
        } else if (wordCount >= targetGood) {
          calculatedScore = Math.min(94, 76 + Math.round(acousticQualityBonus * 0.4) + keywordBonus);
          feedback = `👍 Tốc độ phản xạ rất tốt (${wordCount} từ)! Hoàn thành trọn vẹn yêu cầu phản hồi nhanh.`;
        } else if (wordCount >= targetPass) {
          calculatedScore = Math.min(84, 66 + Math.round(acousticQualityBonus * 0.4) + keywordBonus);
          feedback = `👌 Đạt yêu cầu phản xạ cơ bản (${wordCount} từ). Hãy mở rộng thêm 1 chi tiết nữa để đạt điểm tối đa!`;
        } else {
          calculatedScore = Math.max(40, wordCount * 8 + 15 + keywordBonus);
          feedback = `💡 Câu trả lời hơi cụt (${wordCount} từ). Hãy cố gắng trả lời thành câu hoàn chỉnh trong 15s.`;
        }
      }

    // =========================================================================
    // 🎭 NHÁNH 4: TRẠM 2 - VOCABULARY ARENA (SOLO / RELAY / ROLEPLAY)
    // =========================================================================
    } else {
      const wordCount = spokenWords.length;

      const hallucinationPhrases = ['thank you', 'thanks for watching', 'subtitles by', 'bye', 'goodbye'];
      const isHallucination = wordCount <= 3 && hallucinationPhrases.some(h => transcript.toLowerCase().includes(h));

      if (isHallucination || wordCount < 4) {
        calculatedScore = Math.max(20, Math.min(35, wordCount * 6 + 10));
        feedback = `⚠️ Phản hồi quá ngắn hoặc chỉ ghi nhận tiếng ồn/từ chào (${wordCount} từ). Hãy đối thoại hoặc nói câu hoàn chỉnh theo chủ đề!`;
      } else {
        let minExcellentWords = 22;
        let minGoodWords = 14;
        let minPassWords = 8;

        if (cefrLevel === 'A1') {
          minExcellentWords = 16;
          minGoodWords = 10;
          minPassWords = 5;
        } else if (cefrLevel === 'A2') {
          minExcellentWords = 20;
          minGoodWords = 12;
          minPassWords = 7;
        } else if (cefrLevel === 'B2') {
          minExcellentWords = 28;
          minGoodWords = 18;
          minPassWords = 10;
        } else if (cefrLevel === 'C1' || cefrLevel === 'C2') {
          minExcellentWords = 35;
          minGoodWords = 22;
          minPassWords = 12;
        }

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

        if (wordCount >= minExcellentWords) {
          calculatedScore = Math.min(100, 85 + Math.round(acousticQualityBonus * 0.4) + topicRelevanceBonus);
          feedback = `🌟 Bài nói rất phong phú (${wordCount} từ)! Phản xạ tự nhiên, lưu loát và bám sát chủ đề [${cefrLevel}].`;
        } else if (wordCount >= minGoodWords) {
          calculatedScore = Math.min(94, 75 + Math.round(acousticQualityBonus * 0.4) + topicRelevanceBonus);
          feedback = `👍 Rất tốt (${wordCount} từ)! Diễn đạt mạch lạc và hoàn thành yêu cầu [${cefrLevel}].`;
        } else if (wordCount >= minPassWords) {
          calculatedScore = Math.min(84, 65 + Math.round(acousticQualityBonus * 0.4) + topicRelevanceBonus);
          feedback = `👌 Đạt yêu cầu cơ bản (${wordCount} từ). Nên triển khai thêm chi tiết để đạt điểm xuất sắc.`;
        } else {
          calculatedScore = Math.max(35, wordCount * 6 + 15 + topicRelevanceBonus);
          feedback = `⚠️ Bài nói hơi ngắn so với chuẩn [${cefrLevel}] (${wordCount} từ). Cần nói dài và mở rộng ý hơn.`;
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