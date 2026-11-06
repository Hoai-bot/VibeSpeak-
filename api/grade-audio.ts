// api/grade-audio.ts
export const config = {
  runtime: 'edge',
};

// =========================================================================
// 🎯 MODULE TỪ ĐIỂN BẪY NGỮ ÂM (SELF-CONTAINED FOR VERCEL EDGE RUNTIME)
// =========================================================================
export interface PhoneticTrapRule {
  id: string;
  pair: [string, string];
  trapKeywords: string[];
  scoreCap: number;
  feedbackVi: string;
}

export const PHONETIC_TRAPS: PhoneticTrapRule[] = [
  // 1. leave / live (/iː/ vs /ɪ/) - Bẫy đọc nhầm thành /laɪv/
  {
    id: 'leave_live_laiv',
    pair: ['leave', 'live'],
    trapKeywords: ['alive', 'life', 'line', 'live stream', 'live music'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Từ "live" trong bài tập này là động từ, phát âm âm ngắn là /lɪv/ (như "lip"), không phát âm là /laɪv/ (như trong "livestream"). Hãy thử lại!',
  },
  // 2. vine / fine - Bẫy rút ngắn /aɪ/ thành /ɪ/ ("vin fin")
  {
    id: 'vine_fine_short_vowel',
    pair: ['vine', 'fine'],
    trapKeywords: ['vin', 'fin', 'thin', 'pin', 'been', 'win'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Cặp từ "vine - fine" có nguyên âm đôi /aɪ/ (đọc là /vaɪn/ và /faɪn/). Bạn vừa phát âm thành âm ngắn /vɪn/ - /fɪn/ ("vin fin"). Hãy mở rộng khẩu hình và kéo dài âm /aɪ/ nhé!',
  },
  // 3. vine / fine - Bẫy đọc thừa âm đuôi kiểu Pháp/Latinh ("vi-nê / phi-nê")
  {
    id: 'vine_fine_french_suffix',
    pair: ['vine', 'fine'],
    trapKeywords: [
      'vina', 'fina', 'vinay', 'finay', 'vienna', 
      'venice', 'finer', 'vener', 'vi ne', 'phi ne'
    ],
    scoreCap: 60,
    feedbackVi: '⚠️ Chú ý: Đuôi "-e" trong "vine" và "fine" là âm câm! Từ này chỉ có 1 âm tiết, phát âm là /vaɪn/ và /faɪn/ (không đọc tách thành 2 âm tiết "vi-nê / phi-nê"). Hãy ngắt dứt khoát ở âm cuối /n/ nhé!',
  },
  // 4. sheep / ship (/iː/ vs /ɪ/)
  {
    id: 'sheep_ship_confusion',
    pair: ['sheep', 'ship'],
    trapKeywords: ['shit', 'cheap', 'chip'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Phân biệt rõ âm /iː/ kéo dài môi dẹt trong "sheep" và âm /ɪ/ ngắn dứt khoát trong "ship".',
  },
  // 5. bed / bad (/e/ vs /æ/)
  {
    id: 'bed_bad_confusion',
    pair: ['bed', 'bad'],
    trapKeywords: ['bat', 'bet', 'back'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: "bed" có nguyên âm /e/ mở vừa phải, còn "bad" có nguyên âm bẹt /æ/ hạ cằm sâu.',
  },
  // 6. think / sink (/θ/ vs /s/)
  {
    id: 'think_sink_dental',
    pair: ['think', 'sink'],
    trapKeywords: ['thing', 'sing', 'tin', 'sin'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Âm /θ/ trong "think" cần đặt đầu lưỡi giữa hai hàm răng và thổi hơi, tránh phát âm thành /s/ ("sink") hoặc /t/ ("tin").',
  },
  // 7. lead / read (/liːd/ vs /riːd/) - Bẫy đọc thành /led/ và /rɪd/ ("led rid")
  {
    id: 'lead_read_confusion',
    pair: ['lead', 'read'],
    trapKeywords: [
      'led', 'rid', 'red', 'lid', 'lit', 
      'led rid', 'red rid', 'let read', 'let rid'
    ],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Cả "lead" và "read" ở thì hiện tại đều có nguyên âm dài /iː/ (đọc là /liːd/ và /riːd/). Bạn vừa phát âm thành âm ngắn /led/ (như "led/chì") hoặc /rɪd/ ("rid"). Hãy căng môi cười và kéo dài âm /iː/ nhé!',
  },
  // 8. men / man (/e/ vs /æ/) - Bẫy phát âm men bị bẹt thành man cả 2 từ
  {
    id: 'men_man_confusion',
    pair: ['men', 'man'],
    trapKeywords: [
      'man man', 'men men', 'two man', 'a men'
    ],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Phân biệt rõ âm /e/ (trong "men" - mở hé miệng, kéo khóe môi) và âm /æ/ (trong "man" - hạ quai hàm sâu). AI hiện đang nghe cả hai từ thành cùng một âm!',
  }
];

export function detectPhoneticTrap(
  wordA: string,
  wordB: string,
  spokenWords: string[],
  rawTranscript: string
): PhoneticTrapRule | null {
  const wA = wordA.toLowerCase().trim();
  const wB = wordB.toLowerCase().trim();
  const lowerTranscript = rawTranscript.toLowerCase();

  for (const trap of PHONETIC_TRAPS) {
    const isTargetMatch =
      (trap.pair[0] === wA && trap.pair[1] === wB) ||
      (trap.pair[0] === wB && trap.pair[1] === wA);

    if (isTargetMatch) {
      const isTrapped = trap.trapKeywords.some((keyword) => {
        if (keyword.includes(' ')) {
          return lowerTranscript.includes(keyword);
        }
        return spokenWords.includes(keyword);
      });

      if (isTrapped) {
        return trap;
      }
    }
  }

  return null;
}

// =========================================================================
// 🛡️ BỘ ĐỆM RATE-LIMIT DỰA TRÊN CLIENT IP (TỐI ĐA 15 YÊU CẦU / 60 GIÂY)
// =========================================================================
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = rateLimitMap.get(clientIp);

  if (!bucket || now > bucket.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - bucket.count };
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // 1. Kiểm tra Rate-Limit trước khi gọi dịch vụ AI
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   req.headers.get('x-real-ip') || 
                   'anonymous-client';

  const { allowed, remaining } = checkRateLimit(clientIp);
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: '⚠️ Bạn đang gửi bài quá nhanh! Vui lòng chờ 1 phút trước khi thử lại để bảo vệ hệ thống.'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
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

    // 2. Gửi file âm thanh sang Groq Whisper với verbose_json để đo độ chuẩn âm học
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

        // 🛡️ TỰ ĐỘNG QUÉT BẪY NGỮ ÂM TỪ MODULE PHONETIC TRAPS
        const detectedTrap = detectPhoneticTrap(wordA, wordB, spokenWords, rawTranscript);

        // 🛡️ PHÁT HIỆN LỖI ĐỌC LẶP 1 TỪ CHO CẢ 2 MỤC TIÊU (VÍ DỤ MEN / MAN THÀNH "MAN MAN")
        const isDuplicateWordTrap = (wordA === 'men' && wordB === 'man') || (wordA === 'man' && wordB === 'men');
        const countWordA = spokenWords.filter(w => w === wordA).length;
        const countWordB = spokenWords.filter(w => w === wordB).length;

        if (detectedTrap) {
          calculatedScore = Math.min(detectedTrap.scoreCap, Math.max(45, 50 + acousticQualityBonus));
          feedback = detectedTrap.feedbackVi;
        } else if (isDuplicateWordTrap && (countWordA >= 2 || countWordB >= 2) && (countWordA === 0 || countWordB === 0)) {
          calculatedScore = 55;
          const repeatedWord = countWordA >= 2 ? wordA : wordB;
          const missingWord = countWordA >= 2 ? wordB : wordA;
          feedback = `⚠️ Bạn vừa phát âm từ "${repeatedWord}" 2 lần! Hãy chú ý khẩu hình: "${missingWord}" cần sự khác biệt rõ về độ mở của khuôn miệng.`;
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
    // 🎭 NHÁNH 4: TRẠM 2 - VOCABULARY ARENA (ĐÁNH GIÁ 6 TIÊU CHÍ CHUYÊN SÂU)
    // =========================================================================
    } else {
      const wordCount = spokenWords.length;
      const hallucinationPhrases = ['thank you', 'thanks for watching', 'subtitles by', 'bye', 'goodbye'];
      const isHallucination = wordCount <= 3 && hallucinationPhrases.some(h => transcript.toLowerCase().includes(h));

      if (isHallucination || wordCount < 5) {
        calculatedScore = Math.max(15, wordCount * 6);
        feedback = `⚠️ Bài nói quá ngắn (${wordCount} từ). Hãy đối thoại hoàn chỉnh câu để AI có thể đánh giá!`;
        return new Response(
          JSON.stringify({
            score: calculatedScore,
            transcript: transcript,
            feedback: feedback,
            isWin: false,
            detailedScores: { pronunciation: 20, intonation: 20, vocabulary: 20, grammar: 20, content: 20, fluency: 20 },
            errorWords: []
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🤖 GỌI GROQ LLAMA: PHÂN TÍCH THỰC TẾ, LINH HOẠT VÀ TỰ NHIÊN
      let grammarScore = 70;
      let vocabScore = 70;
      let contentScore = 70;
      let fluencyScore = Math.min(95, Math.max(45, wordCount * 2));
      let pronunciationScore = Math.min(100, Math.max(50, 70 + acousticQualityBonus * 2));
      let errorWordsList: { word: string; correction: string; reason: string }[] = [];
      let dynamicFeedback = '';

      try {
        const groqLlmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' },
            temperature: 0.3, // Tăng nhẹ độ linh hoạt tự nhiên của câu từ
            messages: [
              {
                role: 'system',
                content: `Bạn là một giáo viên tiếng Anh bản xứ giao tiếp thực chiến, chấm điểm nói cấp độ ${cefrLevel}.
Nhiệm vụ: Đánh giá bài nói của học viên dựa trên bối cảnh đề bài.
YÊU CẦU ĐẶC BIỆT VỀ LỜI NHẬN XÉT (pedagogical_feedback_vi):
- Tuyệt đối KHÔNG dùng các câu mẫu sáo rỗng, rập khuôn như: "Bài nói rất phong phú...", "Ngữ pháp và phản xạ rất tự nhiên...".
- Nhận xét phải cá nhân hóa theo đúng những gì học viên vừa nói:
  + Nếu có lỗi (sai thì ngữ pháp, dùng sai từ, câu cụt): Chỉ thẳng cụm từ cụ thể mà học viên nói sai và gợi ý cách nói tự nhiên của người bản xứ (Ví dụ: "Bạn đang nói về kế hoạch ngày mai nên dùng 'want to' thay vì 'wanted' nhé; câu cuối 'lazy I want' hơi cụt, nên nói 'I feel a bit lazy' sẽ tự nhiên hơn!").
  + Nếu bài nói trôi chảy và đúng ngữ pháp: Khen ngợi trực tiếp ý tưởng hoặc từ vựng hay mà học viên đã dùng.
- Giọng văn: Thân thiện, khích lệ, thực tế, ngắn gọn trong 1-2 câu.

Phản hồi dưới dạng JSON thuần túy:
{
  "vocabulary_score": number (0-100),
  "grammar_score": number (0-100),
  "content_score": number (0-100),
  "detected_errors": [
    { "word": "từ_viết_sai", "correction": "từ_chuẩn", "reason": "lý do ngắn gọn" }
  ],
  "pedagogical_feedback_vi": "Lời nhận xét tự nhiên, linh hoạt và chân thực"
}`
              },
              {
                role: 'user',
                content: `Chủ đề bài tập: "${targetPrompt || 'Giao tiếp hàng ngày'}"\nTrình độ mục tiêu: ${cefrLevel}\nBài nói của học viên: "${transcript}"`
              }
            ]
          })
        });

        if (groqLlmResponse.ok) {
          const llmData = await groqLlmResponse.json();
          let rawContent = llmData.choices[0]?.message?.content || '{}';
          rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
          const analysis = JSON.parse(rawContent);

          vocabScore = typeof analysis.vocabulary_score === 'number' ? analysis.vocabulary_score : 65;
          grammarScore = typeof analysis.grammar_score === 'number' ? analysis.grammar_score : 60;
          contentScore = typeof analysis.content_score === 'number' ? analysis.content_score : 65;
          errorWordsList = Array.isArray(analysis.detected_errors) ? analysis.detected_errors : [];
          dynamicFeedback = analysis.pedagogical_feedback_vi || '';
        }
      } catch (e) {
        console.warn("LLM Evaluation fallback:", e);
      }

      // Trừ điểm phạt thực tế theo số lượng lỗi
      const penalty = errorWordsList.length * 8;
      calculatedScore = Math.max(
        35,
        Math.min(
          95,
          Math.round(
            (pronunciationScore * 0.2 +
             acousticQualityBonus * 0.1 +
             vocabScore * 0.25 +
             grammarScore * 0.25 +
             contentScore * 0.1 +
             fluencyScore * 0.1) - penalty
          )
        )
      );

      // Nếu LLM gặp lỗi không sinh được phản hồi, sinh nhận xét bám sát thực tế chứ không dùng mẫu cứng
      if (!dynamicFeedback) {
        if (errorWordsList.length > 0) {
          dynamicFeedback = `Bạn cần chú ý sửa từ "${errorWordsList[0].word}" thành "${errorWordsList[0].correction}". Hãy cố gắng nói tròn câu và chú ý thì của câu nhé!`;
        } else if (calculatedScore >= 80) {
          dynamicFeedback = `Ý tưởng diễn đạt khá tốt và rõ ràng! Hãy tiếp tục duy trì tốc độ nói tự nhiên này.`;
        } else {
          dynamicFeedback = `Bạn đã nắm được ý chính của đề bài, tuy nhiên cần mở rộng thêm chi tiết để câu nói trọn vẹn hơn.`;
        }
      }

      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: dynamicFeedback,
          isWin: calculatedScore >= 70,
          errorWords: errorWordsList,
          criteria: {
            pronunciation: pronunciationScore,
            vocabulary: vocabScore,
            grammar: grammarScore,
            fluency: fluencyScore,
            content: contentScore
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Lỗi xử lý Whisper Serverless' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}