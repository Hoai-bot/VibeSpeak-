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
  },
  // 9. cat / cut (/æ/ vs /ʌ/) - Bẫy phát âm bẹt miệng nhầm với âm thả lỏng hạ hàm
  {
    id: 'cat_cut_confusion',
    pair: ['cat', 'cut'],
    trapKeywords: [
      'cat cat', 'cut cut', 'cot', 'caught'
    ],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Phân biệt rõ âm /æ/ (trong "cat" - bẹt khóe môi sang hai bên) và âm /ʌ/ (trong "cut" - miệng mở tự nhiên, thả lỏng hạ hàm dưới theo chiều dọc). AI hiện đang nghe cả hai từ thành cùng một âm!',
  },
  // 10. zoo / sue (/z/ vs /s/) - Bẫy phân biệt phụ âm rung hữu thanh và âm gió vô thanh
  {
    id: 'zoo_sue_voicing',
    pair: ['zoo', 'sue'],
    trapKeywords: [
      'sue sue', 'zoo zoo', 'so sue', 'sue zoo', 'zou', 'su'
    ],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Phân biệt rõ âm /z/ trong "zoo" (dây thanh quản RUNG mạnh ở cổ họng) và âm /s/ trong "sue" (âm gió không rung). Cả hai từ đều dùng nguyên âm dài /uː/ (đọc tròn môi kéo dài /zuː/ - /suː/, không đọc biến âm thành "zou" hay "sui").',
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

// =========================================================================
// 📈 THUẬT TOÁN ĐO NGỮ ĐIỆU (DTW & PITCH/INTONATION CONTOUR TRACKING)
// =========================================================================
export function computeDTWDistance(seq1: number[], seq2: number[]): number {
  const n = seq1.length;
  const m = seq2.length;
  if (n === 0 || m === 0) return 100;

  const dtw: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(seq1[i - 1] - seq2[j - 1]);
      dtw[i][j] = cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
    }
  }

  // Chuẩn hóa khoảng cách theo độ dài đường nối
  return dtw[n][m] / (n + m);
}

export function evaluateProsodyScore(studentPitch: number[], referencePitch: number[]): { score: number; feedback: string } {
  if (studentPitch.length < 5 || referencePitch.length < 5) {
    return { score: 75, feedback: 'Ngữ điệu ở mức chấp nhận được.' };
  }

  const distance = computeDTWDistance(studentPitch, referencePitch);
  // Distance thông thường dao động từ 0.5 đến 5.0
  const prosodyScore = Math.max(30, Math.min(100, Math.round(100 - distance * 14)));

  let feedback = '';
  if (prosodyScore >= 85) {
    feedback = '🌟 Ngữ điệu và trọng âm rất tự nhiên, bám sát ngữ điệu người bản xứ!';
  } else if (prosodyScore >= 70) {
    feedback = '👍 Ngữ điệu khá tốt. Cần chú ý nhấn giọng ở các từ khóa (Content Words) và lên/xuống giọng ở cuối câu.';
  } else {
    feedback = '⚠️ Giọng nói còn hơi đều đều (monotone). Hãy quan sát đường cong màu vàng và bắt chước độ lên xuống giọng của câu mẫu nhé!';
  }

  return { score: prosodyScore, feedback };
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

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

    // 📈 Trích xuất mảng Pitch (F0 Contour) gửi lên từ client (nếu có)
    let studentPitchData: number[] = [];
    let referencePitchData: number[] = [];
    try {
      const spRaw = formData.get('studentPitch');
      const rpRaw = formData.get('referencePitch');
      if (spRaw && typeof spRaw === 'string') studentPitchData = JSON.parse(spRaw);
      if (rpRaw && typeof rpRaw === 'string') referencePitchData = JSON.parse(rpRaw);
    } catch (pitchErr) {
      console.warn("Pitch parsing bypassed:", pitchErr);
    }

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy file âm thanh được gửi lên' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    if (!transcript) {
      return new Response(
        JSON.stringify({
          score: 0,
          transcript: "(Không phát hiện giọng nói)",
          feedback: "❌ Không nhận diện được âm thanh phát âm! Vui lòng bấm làm lại và nói to, rõ ràng hơn.",
          isWin: false,
          errorWords: [],
          criteria: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const segments = whisperData.segments || [];
    let avgLogprob = -0.4;
    if (segments.length > 0 && typeof segments[0].avg_logprob === 'number') {
      const sumLogprob = segments.reduce((acc: number, s: any) => acc + (s.avg_logprob || 0), 0);
      avgLogprob = sumLogprob / segments.length;
    }

    const normalizedLogprob = Math.max(-1.0, Math.min(0, avgLogprob));
    const acousticQualityBonus = Math.max(2, Math.min(15, Math.round((normalizedLogprob + 1.0) * 15)));

    let calculatedScore = 75;
    let feedback = '';

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s/]/g, '').trim();
    const cleanPrompt = normalize(targetPrompt);
    let rawTranscript = normalize(transcript);

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

        const detectedTrap = detectPhoneticTrap(wordA, wordB, spokenWords, rawTranscript);

        const countWordA = spokenWords.filter(w => w === wordA).length;
        const countWordB = spokenWords.filter(w => w === wordB).length;
        const isDuplicateWordTrap = (countWordA >= 2 && countWordB === 0) || (countWordB >= 2 && countWordA === 0);

        if (detectedTrap) {
          calculatedScore = Math.min(detectedTrap.scoreCap, Math.max(45, 50 + acousticQualityBonus));
          feedback = detectedTrap.feedbackVi;
        } else if (isDuplicateWordTrap) {
          calculatedScore = 55;
          const repeatedWord = countWordA >= 2 ? wordA : wordB;
          const missingWord = countWordA >= 2 ? wordB : wordA;
          feedback = `⚠️ Bạn vừa phát âm từ "${repeatedWord}" 2 lần! Hãy chú ý khẩu hình: từ "${missingWord}" cần sự phân biệt rõ ràng về khẩu hình khuôn miệng. Hãy nghe lại âm mẫu và thử lại!`;
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

      // 🎯 TRẢ VỀ RESPONSE TRỰC TIẾP CHO TRẠM 1
      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: feedback,
          isWin: calculatedScore >= 70,
          errorWords: [],
          criteria: {
            pronunciation: calculatedScore,
            vocabulary: 85,
            grammar: 90,
            fluency: 85,
            content: 90
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

    // =========================================================================
    // 👻 NHÁNH 2: TRẠM 3 - GHOST STATION (SHADOWING ECHO CHUYÊN SÂU & ĐO NGỮ ĐIỆU)
    // =========================================================================
    } else if (stationType === 'STATION_3') {
      const targetWords = cleanPrompt.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      let matchedCount = 0;
      targetWords.forEach((w: string) => {
        if (isWordSpoken(w, spokenWords)) matchedCount++;
      });

      const accuracyRatio = targetWords.length > 0 ? (matchedCount / targetWords.length) : 0;

      let prosodyResult: { score: number; feedback: string } | null = null;
      if (studentPitchData.length >= 5 && referencePitchData.length >= 5) {
        prosodyResult = evaluateProsodyScore(studentPitchData, referencePitchData);
      }

      if (accuracyRatio === 0) {
        calculatedScore = Math.max(15, acousticQualityBonus);
        feedback = `❌ Chưa đuổi kịp ngữ điệu của Bóng Ma. AI nghe được: "${transcript}".`;
      } else if (accuracyRatio >= 0.85) {
        calculatedScore = Math.min(100, 88 + Math.round(acousticQualityBonus * 0.8));
        feedback = prosodyResult 
          ? `🌟 Xuất sắc! Bạn đã bắt kịp nhịp điệu (${matchedCount}/${targetWords.length} từ). ${prosodyResult.feedback}`
          : `🌟 Xuất sắc! Bạn đã bắt kịp nhịp điệu của Bóng Ma (${matchedCount}/${targetWords.length} từ).`;
      } else if (accuracyRatio >= 0.6) {
        calculatedScore = Math.min(87, Math.round(accuracyRatio * 75 + acousticQualityBonus));
        feedback = prosodyResult
          ? `👍 Khá tốt! Đã theo kịp đa số từ (${matchedCount}/${targetWords.length}). ${prosodyResult.feedback}`
          : `👍 Khá tốt! Đã theo kịp đa số từ (${matchedCount}/${targetWords.length}). Cần mượt mà hơn ở các cụm nối âm.`;
      } else {
        calculatedScore = Math.max(30, Math.round(accuracyRatio * 60 + acousticQualityBonus));
        feedback = `⚠️ Rớt nhịp khá nhiều (${matchedCount}/${targetWords.length} từ). Hãy dùng tính năng Cứu hộ Oasis để tập nối âm chậm nhé!`;
      }

      const prosodyBoost = prosodyResult ? prosodyResult.score : 80;

      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: feedback,
          isWin: calculatedScore >= 70,
          errorWords: [],
          criteria: {
            pronunciation: Math.min(100, Math.round(accuracyRatio * 90 + acousticQualityBonus)),
            vocabulary: 80,
            grammar: 85,
            fluency: Math.min(100, Math.round((accuracyRatio * 0.6 + (prosodyBoost / 100) * 0.4) * 100)),
            content: 90
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

    // =========================================================================
    // ⚡ NHÁNH 3: TRẠM 4 - SPEAKING EXPRESS (PHẢN XẠ NHANH 10 - 15 GIÂY)
    // =========================================================================
    } else if (stationType === 'STATION_4') {
      const wordCount = spokenWords.length;
      const hallucinationPhrases = ['thank you', 'thanks for watching', 'subtitles by', 'bye', 'goodbye'];
      const isHallucination = wordCount <= 2 && hallucinationPhrases.some(h => transcript.toLowerCase().includes(h));

      if (isHallucination || wordCount < 3) {
        calculatedScore = Math.max(20, wordCount * 8);
        feedback = `⚠️ Phản hồi quá ngắn (${wordCount} từ). Hãy đưa ra câu trả lời trực diện cho tình huống!`;
        return new Response(
          JSON.stringify({
            score: calculatedScore,
            transcript: transcript,
            feedback: feedback,
            isWin: false,
            errorWords: [],
            criteria: { pronunciation: 30, vocabulary: 30, grammar: 30, fluency: 30, content: 20 }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      let grammarScore = 80;
      let vocabScore = 80;
      let contentScore = 80;
      let fluencyScore = Math.min(95, Math.max(50, wordCount * 5));
      let pronunciationScore = Math.min(100, Math.max(50, 70 + acousticQualityBonus * 2));
      let errorWordsList: { word: string; correction: string; reason: string }[] = [];
      let dynamicFeedback = '';

      // 1. 🛡️ QUÉT BẪY LỖI NGỮ PHÁP TẠI CHỖ (LOCAL SCANNER)
      const countNums = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
      for (let i = 0; i < spokenWords.length - 1; i++) {
        const curr = spokenWords[i];
        const next = spokenWords[i + 1];
        if (countNums.includes(curr)) {
          if (['friend', 'day', 'hour', 'minute', 'dollar', 'person', 'member'].includes(next)) {
            errorWordsList.push({
              word: next,
              correction: next === 'person' ? 'people' : `${next}s`,
              reason: `Sau số đếm "${curr}", danh từ phải chia số nhiều.`
            });
          }
        }
      }

      // 2. 🤖 GỌI GROQ LLM ĐÁNH GIÁ CHẤT LƯỢNG PHẢN XẠ & BỐI CẢNH (C1-C2 EXECUTIVE EVALUATION)
      try {
        const groqLlmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 350,
            messages: [
              {
                role: 'system',
                content: `You are an executive communications coach and expert Cambridge/IELTS examiner evaluating a CEFR ${cefrLevel} student on a high-stakes 15-second rapid response prompt (Business/Crisis PR/Executive Alignment).

CRITICAL EVALUATION MATRIX FOR CEFR ${cefrLevel}:
1. C1-C2 ADVANCED CRITERIA:
   - Executive Presence & Diplomatic Tone: Look for assertive, constructive phrasing (e.g., "While I acknowledge...", "I propose gating rollout...", "Let us formally scope...").
   - Deflection & Problem-solving: Did the student address the conflict/crisis without combative phrasing or premature liability admission?
   - Lexical Resource: Reward high-register collocations (e.g., "compromise roadmap", "freeze non-essential OPEX", "mitigate fallout", "contingency plan").
   - If CEFR is C1/C2 and the student uses simplistic/childish phrasing (e.g., "I will fire people because money", "I am angry at you"), cap vocab_score at 60 and feedback must advise professional executive terminology.
2. GENERAL CEFR RULES:
   - If fluent, tactful, and answers the prompt within 10-15s, award 88-96.
   - If response is incomplete or misses the prompt challenge, assign content_score 45-60.

Return JSON ONLY:
{
  "vocab_score": number,
  "grammar_score": number,
  "content_score": number,
  "detected_errors": [
    { "word": "incorrect_word", "correction": "better_word", "reason": "Lý do bằng tiếng Việt chỉ rõ cách nâng cấp từ vựng/cách diễn đạt ngoại giao" }
  ],
  "feedback_vi": "Nhận xét sư phạm tiếng Việt sắc bén 1-2 câu, chỉ rõ nghệ thuật ứng biến ngoại giao, phong thái điều hành và từ vựng chuyên ngành"
}`
              },
              {
                role: 'user',
                content: `Prompt: "${targetPrompt}"\nStudent: "${transcript}"`
              }
            ]
          })
        });

        if (groqLlmResponse.ok) {
          const llmData = await groqLlmResponse.json();
          const rawContent = llmData.choices[0]?.message?.content || '{}';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed.vocab_score === 'number') vocabScore = parsed.vocab_score;
            if (typeof parsed.grammar_score === 'number') grammarScore = parsed.grammar_score;
            if (typeof parsed.content_score === 'number') contentScore = parsed.content_score;
            if (Array.isArray(parsed.detected_errors) && parsed.detected_errors.length > 0) {
              parsed.detected_errors.forEach((err: any) => {
                if (!errorWordsList.some(e => e.word.toLowerCase() === err.word?.toLowerCase())) {
                  errorWordsList.push(err);
                }
              });
            }
            if (parsed.feedback_vi && parsed.feedback_vi.length > 10) {
              dynamicFeedback = parsed.feedback_vi;
            }
          }
        }
      } catch (llmErr) {
        console.warn("LLM API Express bypassed:", llmErr);
      }

      // 3. TÍNH ĐIỂM TỔNG HỢP (KẾT HỢP TỐC ĐỘ, ĐỘ CHÍNH XÁC VÀ NỘI DUNG)
      const penalty = errorWordsList.length * 8;
      calculatedScore = Math.max(
        35,
        Math.min(
          98,
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

      if (!dynamicFeedback) {
        if (errorWordsList.length > 0) {
          const firstErr = errorWordsList[0];
          dynamicFeedback = `Phản xạ nhanh, tuy nhiên cần chú ý sửa "${firstErr.word}" ➔ "${firstErr.correction}" để câu trả lời chuẩn ngữ pháp hơn!`;
        } else if (calculatedScore >= 80) {
          dynamicFeedback = `🚀 Phản xạ siêu nhanh và tự nhiên! Câu trả lời trúng trọng tâm tình huống [${cefrLevel}].`;
        } else {
          dynamicFeedback = `👌 Phản hồi đạt yêu cầu cơ bản, hãy cố gắng mở rộng thêm 1 chi tiết nhỏ để câu nói thuyết phục hơn.`;
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
            vocabulary: Math.max(35, vocabScore - Math.round(penalty * 0.5)),
            grammar: Math.max(30, grammarScore - penalty),
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

    // =========================================================================
    // 🎭 NHÁNH 4: TRẠM 2 - VOCABULARY ARENA (ĐÁNH GIÁ ĐÚNG THÌ, NGỮ CẢNH & TOÀN DIỆN NGỮ PHÁP)
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
            errorWords: [],
            criteria: { pronunciation: 30, vocabulary: 30, grammar: 30, fluency: 30, content: 20 }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const lowerTranscript = transcript.toLowerCase();
      const lowerPrompt = targetPrompt.toLowerCase();

      // 1. 🎯 KIỂM TRA ĐỘ BÁM SÁT CHỦ ĐỀ (OFF-TOPIC DETECTOR VỚI ACADEMIC / BUSINESS KEYWORDS)
      const stopWords = ['describe', 'talk', 'about', 'your', 'you', 'the', 'and', 'with', 'that', 'this', 'have', 'what', 'where', 'when', 'which', 'tell', 'enrolled', 'special', 'favorite', 'help', 'evaluate', 'analyze', 'extent', 'discuss', 'propose', 'deliver', 'whether', 'merely', 'particularly', 'regarding'];
      const corePromptKeywords = lowerPrompt
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !stopWords.includes(w));

      let matchedTopicKeywords = 0;
      corePromptKeywords.forEach(kw => {
        if (lowerTranscript.includes(kw) || 
           (kw.endsWith('s') && lowerTranscript.includes(kw.slice(0, -1))) ||
           (kw.endsWith('ed') && lowerTranscript.includes(kw.slice(0, -2)))) {
          matchedTopicKeywords++;
        }
      });

      const isOnlineCoursePrompt = lowerPrompt.includes('course') || lowerPrompt.includes('online') || lowerPrompt.includes('tutorial');
      const isFamilyHometownSpeech = lowerTranscript.includes('hometown') || lowerTranscript.includes('went home') || (lowerTranscript.includes('parents') && !lowerTranscript.includes('course'));
      const isCompletelyOffTopic = (isOnlineCoursePrompt && isFamilyHometownSpeech) || (corePromptKeywords.length >= 2 && matchedTopicKeywords === 0);

      let errorWordsList: { word: string; correction: string; reason: string }[] = [];
      let dynamicFeedback = '';

      if (isCompletelyOffTopic) {
        errorWordsList.push({
          word: 'hometown',
          correction: 'online course / tutorial',
          reason: 'Lạc đề nghiêm trọng: Đề bài yêu cầu miêu tả "khóa học trực tuyến (online course)", bài nói đang kể về "quê hương (hometown)".'
        });
      }

      // 2. 🛡️ BỘ QUÉT TƯƠNG THÍCH THÌ VÀ NGỮ CẢNH ĐỀ BÀI (CONTEXT-TENSE ALIGNMENT ENGINE)
      const isHabitualPrompt = 
        lowerPrompt.includes('how you help') || 
        lowerPrompt.includes('housework') || 
        lowerPrompt.includes('daily') || 
        lowerPrompt.includes('routine') || 
        lowerPrompt.includes('free time') || 
        lowerPrompt.includes('in your spare time') || 
        lowerPrompt.includes('usually') || 
        lowerPrompt.includes('every day') ||
        (lowerPrompt.includes('what do you do') && !lowerPrompt.includes('did'));

      if (isHabitualPrompt) {
        const pastVerbsMap: Record<string, string> = {
          'cooked': 'cook / usually cook',
          'made': 'make / prepare',
          'cleaned': 'clean / usually clean',
          'washed': 'wash / help wash',
          'helped': 'help / usually help',
          'went': 'go',
          'did': 'do',
          'bought': 'buy',
          'yesterday': 'usually / every day / on weekends'
        };

        spokenWords.forEach(w => {
          if (pastVerbsMap[w]) {
            if (!errorWordsList.some(e => e.word.toLowerCase() === w)) {
              errorWordsList.push({
                word: w,
                correction: pastVerbsMap[w],
                reason: `Sai thì ngữ cảnh: Đề bài hỏi về thói quen/hành động thường xuyên làm ("how you help with housework"), bắt buộc phải dùng thì Hiện tại đơn (Present Simple: "${pastVerbsMap[w]}"), không dùng quá khứ đơn ("${w}").`
              });
            }
          }
        });
      }

      // Bắt lỗi câu bị ngắt cụt / bỏ dở giữa chừng (Incomplete Sentence Detector)
      const lastWord = spokenWords[spokenWords.length - 1]?.toLowerCase() || '';
      const incompleteEndings = [
        'my', 'your', 'his', 'her', 'their', 'our', 'the', 'a', 'an',
        'parents', 'mother', 'father', 'brother', 'sister', 'friend',
        'and', 'or', 'but', 'because', 'so', 'although', 'with', 'to', 'at', 'in', 'of', 'for'
      ];
      
      const isIncompleteSentence = wordCount < 15 && incompleteEndings.includes(lastWord);
      if (isIncompleteSentence) {
        errorWordsList.push({
          word: lastWord,
          correction: `${lastWord} ... [cần hoàn thành vị ngữ]`,
          reason: `Câu nói bị ngắt cụt: Bạn chưa hoàn thành trọn vẹn câu nói ở từ "${lastWord}". Hãy nói đủ cả chủ ngữ và vị ngữ!`
        });
      }

      // Bắt lỗi nuốt âm số nhiều sau số đếm
      const countNumbers = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many', 'several'];
      for (let i = 0; i < spokenWords.length - 1; i++) {
        const curr = spokenWords[i];
        const next = spokenWords[i + 1];
        if (countNumbers.includes(curr)) {
          const singulars: Record<string, string> = {
            'friend': 'friends',
            'member': 'members',
            'person': 'people',
            'year': 'years',
            'day': 'days',
            'book': 'books',
            'child': 'children'
          };
          if (singulars[next]) {
            errorWordsList.push({
              word: next,
              correction: singulars[next],
              reason: `Danh từ số nhiều: Sau "${curr}", danh từ phải dùng dạng số nhiều "${singulars[next]}".`
            });
          }
        }
      }

      // 3. 🎯 TÍNH ĐIỂM CƠ BẢN DỰA TRÊN ĐỘ HOÀN THIỆN, ĐÚNG THÌ & ĐỘ DÀI
      const hasNoErrors = errorWordsList.length === 0;

      let baseGrammar: number;
      let baseVocab: number;
      let baseContent: number;
      let baseFluency: number;

      if (isCompletelyOffTopic) {
        baseContent = 30;
        baseGrammar = 55;
        baseVocab = 60;
        baseFluency = 60;
      } else if (isIncompleteSentence || wordCount < 12) {
        baseContent = Math.min(60, Math.max(40, wordCount * 5));
        baseGrammar = Math.max(45, 60 - errorWordsList.length * 8);
        baseVocab = Math.min(65, Math.max(45, wordCount * 5));
        baseFluency = Math.min(62, Math.max(40, wordCount * 5));
      } else if (wordCount < 20) {
        baseContent = hasNoErrors ? 78 : 68;
        baseGrammar = hasNoErrors ? 82 : Math.max(55, 75 - errorWordsList.length * 8);
        baseVocab = hasNoErrors ? 80 : 70;
        baseFluency = hasNoErrors ? 78 : 68;
      } else {
        const hasConnectors = ['and', 'so', 'because', 'but', 'also', 'although', 'however', 'when', 'while'].some(c => lowerTranscript.includes(c));
        baseContent = hasNoErrors ? Math.min(95, 88 + (wordCount >= 28 ? 6 : 2)) : 76;
        baseGrammar = hasNoErrors ? Math.min(96, 90 + (wordCount >= 28 ? 5 : 2)) : Math.max(50, 75 - errorWordsList.length * 8);
        baseVocab = hasNoErrors ? Math.min(94, 85 + (wordCount >= 28 ? 6 : 2)) : 72;
        baseFluency = Math.min(95, Math.max(72, 76 + (wordCount >= 28 ? 14 : 8) + (hasConnectors ? 5 : 0)));
      }

      let grammarScore = baseGrammar;
      let vocabScore = baseVocab;
      let contentScore = baseContent;
      let fluencyScore = baseFluency;
      let pronunciationScore = Math.min(100, Math.max(65, 75 + acousticQualityBonus * 1.8));

      // 4. 🤖 GỌI GROQ LLM CHUYÊN SÂU (C1-C2 ACADEMIC & STRATEGIC DISCOURSE MATRIX)
      try {
        const groqLlmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            max_tokens: 450,
            messages: [
              {
                role: 'system',
                content: `You are a distinguished Cambridge CAE/CPE (CEFR ${cefrLevel}) and IELTS Academic speaking examiner.
You are evaluating a student on an Academic/Business discourse topic: "${targetPrompt}".

CRITICAL EVALUATION MATRIX:
1. CEFR C1-C2 ACADEMIC & STRATEGIC DISCOURSE:
   - Syntactic Sophistication: Look for advanced structures (Inversion: "Seldom does...", Cleft sentences: "It is the... that...", Participle clauses: "Having analyzed...", Subjunctive/Hedging: "arguably", "fundamentally", "were leaders to...").
   - Depth of Argumentation: Reward balanced, multi-dimensional argumentation over simple opinions.
   - Lexical Precision: Reward domain-specific academic/business collocations (e.g. "epistemic hegemony", "fiduciary duty", "unintended externalities", "synergy realization", "due diligence").
   - If level is C1/C2 but the speaker delivers elementary/vague reasoning (e.g., "AI is good and bad, I like it very much"), cap vocab_score at 65 and content_score at 60, with feedback instructing how to use academic hedging and analytical depth.
2. TENSE & CONTEXT CONSISTENCY:
   - Routine/Duty/Habit prompts MUST use Present Simple.
   - Past experience prompts require Past tenses.
   - Hypothetical policy/academic queries require Conditional/Subjunctive moods.
3. STRUCTURAL CHECKS:
   - Truncated/incomplete speech (ends abruptly) -> cap grammar and content at 60.
   - Off-topic speech -> content_score 20-35 and is_off_topic: true.
   - Flawless, highly articulate speech meeting CEFR ${cefrLevel} -> score 88-96.

Return JSON ONLY:
{
  "vocab_score": number,
  "grammar_score": number,
  "content_score": number,
  "is_off_topic": boolean,
  "detected_errors": [
    { "word": "error_word_or_phrase", "correction": "corrected_word_or_phrase", "reason": "Lý do bằng tiếng Việt giải thích rõ ngữ pháp, thì hoặc cách nâng cấp lên văn phong C1/C2" }
  ],
  "feedback_vi": "Nhận xét sư phạm tiếng Việt sắc bén 1-2 câu, đánh giá tính logic học thuật/chiến lược kinh doanh và gợi ý nâng cấp từ vựng học thuật cao cấp"
}`
              },
              {
                role: 'user',
                content: `Prompt Topic: "${targetPrompt || 'General speaking context'}"\nStudent spoken transcript: "${transcript}"`
              }
            ]
          })
        });

        if (groqLlmResponse.ok) {
          const llmData = await groqLlmResponse.json();
          const rawContent = llmData.choices[0]?.message?.content || '{}';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed.content_score === 'number') {
              contentScore = (parsed.is_off_topic || isCompletelyOffTopic) 
                ? Math.min(35, parsed.content_score) 
                : (isIncompleteSentence || wordCount < 12 ? Math.min(65, parsed.content_score) : parsed.content_score);
            }
            if (typeof parsed.grammar_score === 'number') {
              grammarScore = (isIncompleteSentence || wordCount < 12) 
                ? Math.min(65, parsed.grammar_score) 
                : parsed.grammar_score;
            }
            if (typeof parsed.vocab_score === 'number') {
              vocabScore = (isIncompleteSentence || wordCount < 12) 
                ? Math.min(68, parsed.vocab_score) 
                : parsed.vocab_score;
            }
            
            if (Array.isArray(parsed.detected_errors) && parsed.detected_errors.length > 0) {
              parsed.detected_errors.forEach((err: any) => {
                if (err.word && !errorWordsList.some(e => e.word.toLowerCase() === err.word.toLowerCase())) {
                  errorWordsList.push({
                    word: err.word,
                    correction: err.correction || '',
                    reason: err.reason || 'Lỗi cấu trúc hoặc thì ngữ cảnh.'
                  });
                }
              });
            }

            if (parsed.feedback_vi && parsed.feedback_vi.length > 15) {
              dynamicFeedback = parsed.feedback_vi;
            }
          }
        }
      } catch (llmErr) {
        console.warn("LLM API call bypassed, using dynamic fallback:", llmErr);
      }

      // 5. TÍNH ĐIỂM TỔNG HỢP CÔNG BẰNG & THỰC CHẤT
      const penalty = errorWordsList.length * 8;
      calculatedScore = Math.max(
        25,
        Math.min(
          98,
          Math.round(
            (pronunciationScore * 0.25 +
             vocabScore * 0.2 +
             grammarScore * 0.25 +
             contentScore * 0.2 +
             fluencyScore * 0.1) - penalty
          )
        )
      );

      if (isCompletelyOffTopic) {
        calculatedScore = Math.min(50, calculatedScore);
      } else if (isIncompleteSentence || wordCount < 10) {
        calculatedScore = Math.min(60, calculatedScore);
      }

      // 6. NHẬN XÉT SƯ PHẠM CỤ THỂ
      if (!dynamicFeedback) {
        if (isCompletelyOffTopic) {
          dynamicFeedback = `⚠️ Bài nói bị lạc đề! Bạn cần chú ý đọc kỹ yêu cầu của chủ đề để trả lời đúng trọng tâm.`;
        } else if (isIncompleteSentence) {
          dynamicFeedback = `⚠️ Câu nói bị ngắt cụt ở cuối ("${lastWord}"). Hãy hoàn thành trọn vẹn ý của câu để AI chấm điểm chính xác hơn nhé!`;
        } else if (isHabitualPrompt && spokenWords.some(w => ['cooked', 'made', 'yesterday'].includes(w))) {
          dynamicFeedback = `⚠️ Sai thì ngữ cảnh: Đề bài hỏi về việc bạn thường giúp bố mẹ thế nào ("how you help"), bạn nên dùng thì Hiện tại đơn (Present Simple: "I usually cook/help...") thay vì kể chuyện quá khứ ("yesterday, cooked").`;
        } else if (wordCount < 12) {
          dynamicFeedback = `💡 Bài nói hơi ngắn (${wordCount} từ). Hãy mở rộng thêm các hành động cụ thể để câu trả lời thuyết phục hơn.`;
        } else if (errorWordsList.length > 0) {
          const firstErr = errorWordsList[0];
          dynamicFeedback = `Phát âm rõ ràng, tuy nhiên cần lưu ý sửa từ "${firstErr.word}" ➔ "${firstErr.correction}". ${firstErr.reason}`;
        } else if (calculatedScore >= 85) {
          dynamicFeedback = `🌟 Xuất sắc! Bạn diễn đạt rất tự nhiên, phát âm chuẩn xác, các cấu trúc ngữ pháp và thì được dùng rất chuẩn ngữ cảnh đề bài.`;
        } else {
          dynamicFeedback = `👍 Bài nói mạch lạc và đúng trọng tâm. Hãy tiếp tục phát huy vốn từ vựng và ngữ pháp phong phú hơn nhé!`;
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