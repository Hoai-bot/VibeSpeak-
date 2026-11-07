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

        // 🌟 TỔNG QUÁT HÓA PHÁT HIỆN ĐỌC LẶP TỪ CHO MỌI CẶP TỪ
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
            fluency: Math.min(100, Math.round(accuracyRatio * 95)),
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

      let grammarScore = 65;
      let vocabScore = 70;
      let contentScore = 70;
      let fluencyScore = Math.min(95, Math.max(50, wordCount * 5));
      let pronunciationScore = Math.min(100, Math.max(50, 70 + acousticQualityBonus * 2));
      let errorWordsList: { word: string; correction: string; reason: string }[] = [];
      let dynamicFeedback = '';

      // 1. 🛡️ QUÉT BẪY LỖI NGỮ PHÁP TẠI CHỖ (LOCAL SCANNER)
      const lowerTranscript = transcript.toLowerCase();
      const lowerPrompt = targetPrompt.toLowerCase();

      // Bắt lỗi nuốt âm số nhiều sau số đếm ("two friend" -> friends)
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

      // Bắt lỗi câu hỏi phản xạ tương lai/lời khuyên mà dùng thì quá khứ
      if (lowerPrompt.includes('what would you') || lowerPrompt.includes('what should') || lowerPrompt.includes('how do you plan')) {
        if (spokenWords.includes('went')) {
          errorWordsList.push({
            word: 'went',
            correction: 'would go / will go',
            reason: 'Tình huống giả định/tương lai, không dùng quá khứ "went".'
          });
        }
        if (spokenWords.includes('bought')) {
          errorWordsList.push({
            word: 'bought',
            correction: 'would buy / buy',
            reason: 'Tình huống giả định/kế hoạch, không dùng quá khứ "bought".'
          });
        }
      }

      // 2. 🤖 GỌI GROQ LLM ĐÁNH GIÁ CHẤT LƯỢNG PHẢN XẠ & BỐI CẢNH
      try {
        const groqLlmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
            max_tokens: 300,
            messages: [
              {
                role: 'system',
                content: `You are an expert examiner for rapid English speaking responses (15s express prompt, CEFR ${cefrLevel}).
Evaluate whether the student answered directly and correctly.
Return JSON ONLY:
{
  "vocab_score": number,
  "grammar_score": number,
  "content_score": number,
  "detected_errors": [
    { "word": "incorrect_word", "correction": "better_word", "reason": "reason in Vietnamese" }
  ],
  "feedback_vi": "Nhận xét tiếng Việt ngắn gọn 1-2 câu, chân thực và chỉ rõ điểm cần sửa"
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
          96,
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
    // 🎭 NHÁNH 4: TRẠM 2 - VOCABULARY ARENA (ĐÁNH GIÁ THỰC TẾ & BẮT LỖI LẠC ĐỀ)
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

      // 1. 🎯 KIỂM TRA ĐỘ BÁM SÁT CHỦ ĐỀ (OFF-TOPIC / RELEVANCE DETECTOR)
      const lowerTranscript = transcript.toLowerCase();
      const lowerPrompt = targetPrompt.toLowerCase();

      // Trích xuất các danh từ/động từ trọng tâm từ đề bài (bỏ stop words)
      const stopWords = ['describe', 'talk', 'about', 'your', 'you', 'the', 'and', 'with', 'that', 'this', 'have', 'what', 'where', 'when', 'which', 'tell', 'enrolled', 'special'];
      const corePromptKeywords = lowerPrompt
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !stopWords.includes(w));

      // Đếm số từ khóa liên quan xuất hiện trong bài nói
      let matchedTopicKeywords = 0;
      corePromptKeywords.forEach(kw => {
        if (lowerTranscript.includes(kw) || 
           (kw.endsWith('s') && lowerTranscript.includes(kw.slice(0, -1))) ||
           (kw.endsWith('ed') && lowerTranscript.includes(kw.slice(0, -2)))) {
          matchedTopicKeywords++;
        }
      });

      // Kiểm tra các trường hợp lạc đề phổ biến (Ví dụ: Đề hỏi khóa học trực tuyến nhưng nói về quê/gia đình)
      const isOnlineCoursePrompt = lowerPrompt.includes('course') || lowerPrompt.includes('online') || lowerPrompt.includes('tutorial');
      const isFamilyHometownSpeech = lowerTranscript.includes('hometown') || lowerTranscript.includes('went home') || (lowerTranscript.includes('parents') && !lowerTranscript.includes('course'));
      
      const isCompletelyOffTopic = (isOnlineCoursePrompt && isFamilyHometownSpeech) || (corePromptKeywords.length >= 2 && matchedTopicKeywords === 0);

      let contentScore = isCompletelyOffTopic ? 30 : 70;
      let grammarScore = 65;
      let vocabScore = 70;
      let fluencyScore = Math.min(95, Math.max(45, wordCount * 2));
      let pronunciationScore = Math.min(100, Math.max(50, 70 + acousticQualityBonus * 2));
      let errorWordsList: { word: string; correction: string; reason: string }[] = [];
      let dynamicFeedback = '';

      if (isCompletelyOffTopic) {
        errorWordsList.push({
          word: 'hometown',
          correction: 'online course / tutorial',
          reason: 'Lạc đề nghiêm trọng: Đề bài yêu cầu miêu tả "khóa học trực tuyến (online course)", bài nói đang kể về "quê hương (hometown)".'
        });
      }

      // A. Bắt lỗi nuốt âm đuôi số nhiều sau số đếm (Ví dụ: "five member" -> members)
      const countNumbers = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
      for (let i = 0; i < spokenWords.length - 1; i++) {
        const curr = spokenWords[i];
        const next = spokenWords[i + 1];
        if (countNumbers.includes(curr)) {
          if (next === 'member' || next === 'members') {
            const hasSuspiciousLogprob = avgLogprob < -0.28 || lowerTranscript.includes(`${curr} member `);
            if (hasSuspiciousLogprob || next === 'member') {
              errorWordsList.push({
                word: next,
                correction: 'members',
                reason: `Thiếu âm đuôi: Sau số đếm "${curr}", danh từ phải có đuôi số nhiều và phát âm rõ âm /z/ ("${curr} members").`
              });
            }
          }
        }
      }

      // B. Bắt lỗi sai thì ngữ cảnh bài nói
      const isRoutinePrompt = 
        lowerPrompt.includes('family') || 
        lowerPrompt.includes('job') || 
        lowerPrompt.includes('hometown') || 
        lowerPrompt.includes('commute') || 
        lowerPrompt.includes('describe') || 
        lowerPrompt.includes('daily') || 
        lowerPrompt.includes('routine');

      if (isRoutinePrompt) {
        if (spokenWords.includes('were')) {
          errorWordsList.push({
            word: 'were',
            correction: 'are',
            reason: 'Sai thì: Gia đình hiện tại vẫn tồn tại, hãy dùng "There are" thay vì quá khứ "There were".'
          });
        }
        if (spokenWords.includes('was')) {
          errorWordsList.push({
            word: 'was',
            correction: 'is',
            reason: 'Sai thì: Dùng thì hiện tại đơn "is" khi giới thiệu gia đình hoặc bản thân.'
          });
        }
        if (spokenWords.includes('went') && !isOnlineCoursePrompt) {
          errorWordsList.push({
            word: 'went',
            correction: 'go / usually go',
            reason: 'Lệch chủ đề & sai thì: Đề bài yêu cầu miêu tả thực tế, không kể chuyện quá khứ "went".'
          });
        }
        if (spokenWords.includes('visited')) {
          errorWordsList.push({
            word: 'visited',
            correction: 'visit / usually go to',
            reason: 'Sai thì: Giới thiệu quê hương nên dùng thì hiện tại đơn, không dùng "visited".'
          });
        }
        if (spokenWords.includes('yesterday') && !isOnlineCoursePrompt) {
          errorWordsList.push({
            word: 'yesterday',
            correction: 'every day / usually',
            reason: 'Không dùng mốc thời gian quá khứ "yesterday" cho bài nói thói quen/miêu tả.'
          });
        }
      }

      // C. Bắt lỗi kế hoạch tương lai (tomorrow / plan)
      if (lowerPrompt.includes('tomorrow') || lowerPrompt.includes('future') || lowerPrompt.includes('plan')) {
        if (spokenWords.includes('wanted')) {
          errorWordsList.push({
            word: 'wanted',
            correction: 'want to / plan to',
            reason: 'Sai thì: Đang nói kế hoạch ngày mai, hãy dùng "want" thay vì quá khứ "wanted".'
          });
        }
      }

      // D. Bẫy cụm từ dùng sai ngữ cảnh
      if (lowerTranscript.includes('often to buy')) {
        errorWordsList.push({
          word: 'often',
          correction: 'offer',
          reason: 'Dùng sai từ: "offer to buy" (đề nghị mua/đền bù) chứ không phải "often to buy".'
        });
      }

      // 2. 🤖 GỌI GROQ LLM PHÂN TÍCH CHUYÊN SÂU NỘI DUNG & NGỮ PHÁP
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
                content: `You are a strict CEFR speaking examiner evaluating a ${cefrLevel} student.
Examine whether the student answered the PROMPT topic.
CRITICAL RULE: If the student speaks off-topic (e.g. prompt asks about "online course" but student talks about "hometown / visiting parents"), you MUST assign content_score between 20-35.
Return JSON ONLY:
{
  "vocab_score": number,
  "grammar_score": number,
  "content_score": number,
  "is_off_topic": boolean,
  "feedback_vi": "Nhận xét tiếng Việt cụ thể chỉ thẳng việc nói lạc đề và cách khắc phục"
}`
              },
              {
                role: 'user',
                content: `Prompt: "${targetPrompt}"\nStudent spoken: "${transcript}"`
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
              contentScore = parsed.is_off_topic ? Math.min(35, parsed.content_score) : parsed.content_score;
            }
            if (typeof parsed.vocab_score === 'number') vocabScore = parsed.vocab_score;
            if (typeof parsed.grammar_score === 'number') grammarScore = parsed.grammar_score;
            if (parsed.feedback_vi && parsed.feedback_vi.length > 10) {
              dynamicFeedback = parsed.feedback_vi;
            }
          }
        }
      } catch (llmErr) {
        console.warn("LLM API call bypassed:", llmErr);
      }

      // 3. TÍNH ĐIỂM TỔNG & PHẢN HỒI THỰC TẾ
      const penalty = errorWordsList.length * 9;
      calculatedScore = Math.max(
        25,
        Math.min(
          95,
          Math.round(
            (pronunciationScore * 0.2 +
             acousticQualityBonus * 0.1 +
             vocabScore * 0.2 +
             grammarScore * 0.2 +
             contentScore * 0.2 +
             fluencyScore * 0.1) - penalty
          )
        )
      );

      // Nếu lạc đề hoàn toàn, điểm tổng tối đa chỉ 55 điểm (trượt)
      if (isCompletelyOffTopic) {
        calculatedScore = Math.min(55, calculatedScore);
      }

      if (!dynamicFeedback) {
        if (isCompletelyOffTopic) {
          dynamicFeedback = `⚠️ Bài nói bị lạc đề! Đề bài yêu cầu miêu tả "khóa học trực tuyến (online course)" nhưng bạn lại nói về "quê hương (hometown)". Bạn cần nói về tên khóa học, môn học hoặc kỹ năng bạn đã học trên mạng.`;
        } else if (errorWordsList.length > 0) {
          const firstErr = errorWordsList[0];
          dynamicFeedback = `Bạn cần chú ý sửa từ "${firstErr.word}" ➔ "${firstErr.correction}". ${firstErr.reason}`;
        } else {
          dynamicFeedback = `Bài nói tự nhiên, tuy nhiên cần phát triển thêm chi tiết bám sát chủ đề để đạt điểm cao hơn.`;
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
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Lỗi xử lý Whisper Serverless' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}