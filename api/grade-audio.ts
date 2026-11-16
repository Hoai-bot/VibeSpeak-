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
  {
    id: 'leave_live_laiv',
    pair: ['leave', 'live'],
    trapKeywords: ['alive', 'life', 'line', 'live stream', 'live music'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Từ "live" trong bài tập này là động từ, phát âm âm ngắn là /lɪv/ (như "lip"), không phát âm là /laɪv/ (như trong "livestream"). Hãy thử lại!',
  },
  {
    id: 'vine_fine_short_vowel',
    pair: ['vine', 'fine'],
    trapKeywords: ['vin', 'fin', 'thin', 'pin', 'been', 'win'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Cặp từ "vine - fine" có nguyên âm đôi /aɪ/ (đọc là /vaɪn/ và /faɪn/). Bạn vừa phát âm thành âm ngắn /vɪn/ - /fɪn/ ("vin fin"). Hãy mở rộng khẩu hình và kéo dài âm /aɪ/ nhé!',
  },
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
  {
    id: 'sheep_ship_confusion',
    pair: ['sheep', 'ship'],
    trapKeywords: ['shit', 'cheap', 'chip'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Phân biệt rõ âm /iː/ kéo dài môi dẹt trong "sheep" và âm /ɪ/ ngắn dứt khoát trong "ship".',
  },
  {
    id: 'bed_bad_confusion',
    pair: ['bed', 'bad'],
    trapKeywords: ['bat', 'bet', 'back'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: "bed" có nguyên âm /e/ mở vừa phải, còn "bad" có nguyên âm bẹt /æ/ hạ cằm sâu.',
  },
  {
    id: 'think_sink_dental',
    pair: ['think', 'sink'],
    trapKeywords: ['thing', 'sing', 'tin', 'sin'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Âm /θ/ trong "think" cần đặt đầu lưỡi giữa hai hàm răng và thổi hơi, tránh phát âm thành /s/ ("sink") hoặc /t/ ("tin").',
  },
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
  {
    id: 'men_man_confusion',
    pair: ['men', 'man'],
    trapKeywords: [
      'man man', 'men men', 'two man', 'a men'
    ],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Phân biệt rõ âm /e/ (trong "men" - mở hé miệng, kéo khóe môi) và âm /æ/ (trong "man" - hạ quai hàm sâu). AI hiện đang nghe cả hai từ thành cùng một âm!',
  },
  {
    id: 'cat_cut_confusion',
    pair: ['cat', 'cut'],
    trapKeywords: [
      'cat cat', 'cut cut', 'cot', 'caught'
    ],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Phân biệt rõ âm /æ/ (trong "cat" - bẹt khóe môi sang hai bên) và âm /ʌ/ (trong "cut" - miệng mở tự nhiên, thả lỏng hạ hàm dưới theo chiều dọc). AI hiện đang nghe cả hai từ thành cùng một âm!',
  },
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

  return dtw[n][m] / (n + m);
}

export function evaluateProsodyScore(studentPitch: number[], referencePitch: number[]): { score: number; feedback: string } {
  if (studentPitch.length < 5 || referencePitch.length < 5) {
    return { score: 75, feedback: 'Ngữ điệu ở mức chấp nhận được.' };
  }

  const distance = computeDTWDistance(studentPitch, referencePitch);
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

// =========================================================================
// 🔍 HÀM BỔ TRỢ: CHIA ĐỘNG TỪ & XÂY DỰNG MẢNG TÔ MÀU CHÍNH XÁC TỪNG VỊ TRÍ TỪ
// =========================================================================
export interface DetectedGrammarError {
  word: string;
  correction: string;
  reason: string;
  wordIndex?: number; // Vị trí từ chính xác trong câu để không tô nhầm từ lặp lại (ví dụ "I" hay "am")
}

function getThirdPersonForm(verb: string): string {
  if (verb === 'have') return 'has';
  if (verb === 'do') return 'does';
  if (verb === 'go') return 'goes';
  if (/(s|sh|ch|x|z|o)$/.test(verb)) return `${verb}es`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ies`;
  return `${verb}s`;
}

function buildWordAnalysisArray(
  rawTranscript: string,
  errorWordsList: DetectedGrammarError[]
) {
  const tokens = rawTranscript
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Ưu tiên khớp theo vị trí chính xác (wordIndex) trước, sau đó mới khớp theo từ
  const indexErrMap = new Map<number, DetectedGrammarError>();
  const tokenErrMap = new Map<string, DetectedGrammarError>();

  errorWordsList.forEach((err) => {
    if (typeof err.wordIndex === 'number' && err.wordIndex >= 0 && err.wordIndex < tokens.length) {
      indexErrMap.set(err.wordIndex, err);
    } else if (err?.word) {
      const errTokens = err.word.toLowerCase().replace(/[^a-z0-9'\s]/g, '').split(/\s+/).filter(Boolean);
      errTokens.forEach((tok) => {
        if (!tokenErrMap.has(tok)) {
          tokenErrMap.set(tok, err);
        }
      });
    }
  });

  return tokens.map((token, idx) => {
    const clean = token.toLowerCase().replace(/[^a-z0-9']/g, '');
    const matchedErr = indexErrMap.get(idx) || tokenErrMap.get(clean);
    if (matchedErr) {
      return {
        word: token,
        isConfident: false,
        hasGrammarError: true,
        hasPronunciationError: true,
        correction: matchedErr.correction || '',
        reason: matchedErr.reason || ''
      };
    }
    return {
      word: token,
      isConfident: true,
      hasGrammarError: false,
      hasPronunciationError: false
    };
  });
}

// =========================================================================
// 🧠 BỘ QUÉT NGỮ PHÁP TOÀN DIỆN TỪ CƠ BẢN (A1) ĐẾN NÂNG CAO (C2)
// =========================================================================
function scanComprehensiveGrammarErrors(
  spokenWords: string[],
  lowerTranscript: string,
  lowerPrompt: string,
  isFreeSpeechMode: boolean,
  targetCleanWords: string[]
): DetectedGrammarError[] {
  const errors: DetectedGrammarError[] = [];

  const addError = (wordIndex: number, word: string, correction: string, reason: string) => {
    if (!errors.some((e) => e.wordIndex === wordIndex)) {
      errors.push({ wordIndex, word, correction, reason });
    }
  };

  const singularThirdPersons = ['he', 'she', 'it', 'everyone', 'everybody', 'someone', 'somebody', 'nobody', 'mother', 'father', 'friend', 'teacher', 'student', 'boss', 'manager', 'customer'];
  const adverbs = ['usually', 'always', 'often', 'never', 'sometimes', 'rarely', 'seldom', 'really', 'just', 'still'];
  const commonBaseVerbs = [
    'get', 'go', 'do', 'have', 'play', 'like', 'want', 'come', 'eat', 'sleep', 'make', 'take',
    'drink', 'listen', 'see', 'watch', 'work', 'live', 'need', 'know', 'think', 'feel', 'try',
    'use', 'find', 'give', 'tell', 'call', 'ask', 'seem', 'leave', 'put', 'mean', 'keep', 'let',
    'begin', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'run', 'move', 'believe', 'bring',
    'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
    'set', 'learn', 'change', 'lead', 'understand', 'speak', 'read', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull'
  ];

  // Nhận diện bối cảnh quá khứ / sự cố đã xảy ra
  const hasPastTimeMarker =
    /\b(yesterday|ago|last\s+night|last\s+week|last\s+month|last\s+year|earlier|this\s+morning|left|forgot|lost|went|came|was|were|did)\b/.test(lowerTranscript);

  const isPastIncidentContext =
    hasPastTimeMarker ||
    lowerPrompt.includes('để quên') ||
    lowerPrompt.includes('mất đồ') ||
    lowerPrompt.includes('bị mất') ||
    lowerPrompt.includes('làm rơi') ||
    lowerPrompt.includes('trễ') ||
    lowerPrompt.includes('tai nạn') ||
    lowerPrompt.includes('lost') ||
    lowerPrompt.includes('forgot') ||
    lowerPrompt.includes('left my');

  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const countNumbers = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many', 'several'];
  const singularNouns: Record<string, string> = {
    'friend': 'friends', 'member': 'members', 'person': 'people', 'year': 'years',
    'day': 'days', 'book': 'books', 'child': 'children', 'student': 'students', 'hour': 'hours'
  };

  for (let i = 0; i < spokenWords.length; i++) {
    const curr = spokenWords[i];
    const prev = i > 0 ? spokenWords[i - 1] : '';
    const prevTwo = i > 1 ? spokenWords[i - 2] : '';
    const next = i < spokenWords.length - 1 ? spokenWords[i + 1] : '';
    const nextTwo = i < spokenWords.length - 2 ? spokenWords[i + 2] : '';

    // -----------------------------------------------------------------------
    // NHÓM 1: NGỮ PHÁP CƠ BẢN (A1 – A2)
    // -----------------------------------------------------------------------
    // 1a. Lỗi "he/she/it don't" -> "doesn't"
    if ((curr === "don't" || curr === 'dont') && singularThirdPersons.includes(prev)) {
      addError(i, curr, "doesn't", `Ngôi thứ 3 số ít ("${prev}") phải dùng trợ động từ "doesn't".`);
    }

    // 1b. Lỗi động từ ngôi thứ 3 số ít không thêm -s/-es ("he go", "she usually work")
    if (commonBaseVerbs.includes(curr)) {
      if (singularThirdPersons.includes(prev)) {
        const correctForm = getThirdPersonForm(curr);
        addError(i, curr, correctForm, `Lỗi chia động từ ngôi thứ 3 số ít: Sau "${prev}", động từ "${curr}" phải thêm -s/-es thành "${correctForm}".`);
      } else if (singularThirdPersons.includes(prevTwo) && adverbs.includes(prev)) {
        const correctForm = getThirdPersonForm(curr);
        addError(i, curr, correctForm, `Lỗi chia động từ ngôi thứ 3 số ít: Sau "${prevTwo} ${prev}", động từ "${curr}" phải chia thành "${correctForm}".`);
      }
    }

    // 1c. Lỗi sau "doesn't" / "didn't" động từ vẫn chia ("doesn't goes", "didn't went")
    if ((prev === "doesn't" || prev === 'doesnt') && (curr.endsWith('s') || curr.endsWith('es')) && curr.length > 3) {
      addError(i, curr, curr.replace(/(es|s)$/, ''), `Sau trợ động từ "doesn't", động từ phải để nguyên mẫu.`);
    }
    const pastIrregulars = ['went', 'came', 'bought', 'saw', 'got', 'took', 'had', 'ate', 'made', 'left', 'lost', 'forgot'];
    if ((prev === "didn't" || prev === 'didnt') && (curr.endsWith('ed') || pastIrregulars.includes(curr))) {
      addError(i, curr, 'V-infinitive', `Sau trợ động từ "didn't", động từ phải để nguyên mẫu.`);
    }

    // 1d. Lỗi mạo từ a / an
    if (curr === 'a' && next && vowels.includes(next[0]) && !['university', 'uniform', 'useful', 'user', 'european'].includes(next)) {
      addError(i, curr, 'an', `Trước từ bắt đầu bằng nguyên âm "${next}" phải dùng mạo từ "an".`);
    }
    if (curr === 'an' && next && !vowels.includes(next[0]) && !['hour', 'honest', 'honor'].includes(next)) {
      addError(i, curr, 'a', `Trước từ bắt đầu bằng phụ âm "${next}" phải dùng mạo từ "a".`);
    }

    // 1e. Lỗi danh từ số nhiều sau số đếm ("two friend" -> "friends")
    if (countNumbers.includes(curr) && singularNouns[next]) {
      addError(i + 1, next, singularNouns[next], `Sau "${curr}", danh từ phải chia số nhiều là "${singularNouns[next]}".`);
    }

    // 1f. Đối chiếu câu mẫu ở chế độ READ_SAMPLE
    if (!isFreeSpeechMode && targetCleanWords.length > 0) {
      const expected3rd = getThirdPersonForm(curr);
      const expectedPast = curr.endsWith('e') ? `${curr}d` : `${curr}ed`;
      if (targetCleanWords.includes(expected3rd) && !targetCleanWords.includes(curr)) {
        addError(i, curr, expected3rd, `Phát âm thiếu âm cuối -s/-es: Câu mẫu là "${expected3rd}".`);
      } else if (targetCleanWords.includes(expectedPast) && !targetCleanWords.includes(curr)) {
        addError(i, curr, expectedPast, `Phát âm thiếu đuôi quá khứ -ed: Câu mẫu là "${expectedPast}".`);
      }
    }

    // -----------------------------------------------------------------------
    // NHÓM 2: PHỐI HỢP THÌ & MỆNH ĐỀ PHỤ (B1 – B2)
    // -----------------------------------------------------------------------
    // 2a. Mệnh đề thời gian bắt đầu bằng when/while/before/after KHÔNG dùng "will" ("when I will go" -> "when I went" / "when I go")
    if (curr === 'will' && ['when', 'while', 'before', 'after', 'until'].includes(prevTwo)) {
      const suggestedFix = isPastIncidentContext ? 'went / V2' : 'bỏ "will" (chia hiện tại đơn)';
      addError(i, curr, suggestedFix, `Mệnh đề thời gian sau "${prevTwo}" không dùng "will".`);
    }

    // 2b. Hành động nền đang diễn ra trong quá khứ sau "while" ("while I am reading" -> "was reading")
    if (isPastIncidentContext && ['am', 'is', 'are'].includes(curr) && ['while', 'when'].includes(prevTwo) && next.endsWith('ing')) {
      const pastBe = curr === 'are' ? 'were' : 'was';
      addError(i, curr, pastBe, `Hành động đang diễn ra trong quá khứ sau "${prevTwo}" phải dùng Quá khứ tiếp diễn ("${pastBe} ${next}").`);
    }

    // 2c. Suy đoán về sự việc đã xảy ra trong quá khứ ("someone may take it" -> "might have taken")
    if (isPastIncidentContext && ['may', 'can'].includes(curr) && commonBaseVerbs.includes(next)) {
      addError(i, curr, `might have + V3`, `Suy đoán sự việc đã xảy ra trong quá khứ không dùng "${curr} ${next}", hãy dùng "might have + V3/ed" hoặc Quá khứ đơn.`);
    }

    // 2d. Sự cố quá khứ nhưng chia hiện tại đơn ("I leave my bag" -> "left")
    if (isPastIncidentContext && ['i', 'we', 'he', 'she', 'they'].includes(prev)) {
      const incidentPresentToPast: Record<string, string> = {
        'leave': 'left', 'forget': 'forgot', 'lose': 'lost',
        'drop': 'dropped', 'miss': 'missed', 'break': 'broke'
      };
      if (incidentPresentToPast[curr]) {
        addError(i, curr, incidentPresentToPast[curr], `Sự việc đã xảy ra trước đó, phải dùng thì Quá khứ đơn "${incidentPresentToPast[curr]}" thay vì "${curr}".`);
      }
    }

    // -----------------------------------------------------------------------
    // NHÓM 3: NGỮ PHÁP NÂNG CAO (B2 – C2: ĐIỀU KIỆN LOẠI 2/3, QUÁ KHỨ HOÀN THÀNH, ĐẢO NGỮ)
    // -----------------------------------------------------------------------
    // 3a. Lỗi dùng "would" ngay trong mệnh đề "If" ("If I would..." -> "If I had / V2")
    if (curr === 'would' && ['if', 'wish'].includes(prevTwo)) {
      addError(i, curr, 'had / V2', `Không dùng "would" ngay trong mệnh đề điều kiện "${prevTwo}"; dùng Quá khứ đơn (loại 2) hoặc Quá khứ hoàn thành "had + V3" (loại 3).`);
    }

    // 3b. Lỗi Quá khứ hoàn thành / Điều kiện loại 3 chia sai phân từ ("had went", "have went", "had saw", "had took", "had did", "had broke")
    const wrongPastParticiples: Record<string, string> = {
      'went': 'gone', 'saw': 'seen', 'took': 'taken', 'did': 'done',
      'broke': 'broken', 'wrote': 'written', 'spoke': 'spoken', 'ate': 'eaten',
      'gave': 'given', 'forgot': 'forgotten', 'chose': 'chosen', 'fell': 'fallen',
      'knew': 'known', 'grew': 'grown', 'threw': 'thrown', 'flew': 'flown'
    };
    if (['had', 'have', 'has'].includes(prev) && wrongPastParticiples[curr]) {
      addError(i, curr, wrongPastParticiples[curr], `Sau "${prev}" (thì Hoàn thành / Câu điều kiện loại 3), động từ phải dùng quá khứ phân từ V3 là "${wrongPastParticiples[curr]}".`);
    }
    if (['had', 'have', 'has'].includes(prevTwo) && adverbs.includes(prev) && wrongPastParticiples[curr]) {
      addError(i, curr, wrongPastParticiples[curr], `Sau "${prevTwo} ${prev}", động từ phải dùng quá khứ phân từ V3 là "${wrongPastParticiples[curr]}".`);
    }

    // 3c. Lỗi cấu trúc "would have + V2/V1" ("would have went" -> "would have gone")
    if (prevTwo === 'would' && prev === 'have' && wrongPastParticiples[curr]) {
      addError(i, curr, wrongPastParticiples[curr], `Cấu trúc điều kiện loại 3 chuẩn là "would have + V3/ed" ("would have ${wrongPastParticiples[curr]}").`);
    }

    // 3d. Lỗi Đảo ngữ điều kiện loại 3 ("Had I knew" -> "Had I known")
    if (prevTwo === 'had' && ['i', 'he', 'she', 'it', 'we', 'they', 'you'].includes(prev) && wrongPastParticiples[curr]) {
      addError(i, curr, wrongPastParticiples[curr], `Đảo ngữ câu điều kiện loại 3 ("Had + S + V3") phải dùng phân từ "${wrongPastParticiples[curr]}".`);
    }
  }

  return errors;
}

// =========================================================================
// 🎓 MA TRẬN TIÊU CHÍ NGỮ PHÁP THEO CẤP ĐỘ CEFR (A1 -> C2)
// =========================================================================
function getCefrGrammarRubricInstruction(cefrLevel: string): string {
  switch (cefrLevel) {
    case 'A1':
    case 'A2':
      return `CEFR ${cefrLevel} (Elementary):
- Focus on core accuracy: Present Simple (including 3rd-person singular -s/-es), Past Simple for completed past actions/incidents (e.g. "I left my bag", "I forgot", "I lost"), "going to", basic prepositions, and articles (a/an/the).
- Also catch sequence-of-tense errors when telling a past story (e.g. "while I am reading" -> "was reading", "when I will go" -> "when I went").`;
    case 'B1':
    case 'B2':
      return `CEFR ${cefrLevel} (Intermediate / Upper-Intermediate):
- Evaluate both basic accuracy and intermediate structures: Past Continuous vs. Past Simple, Present Perfect, Conditional Type 1 & Type 2 ("If I were..., I would..."), Passive Voice, Relative Clauses (who/which/that), and Modal Verbs of deduction ("might have taken").
- Recognize Conditional Type 2 and Present Perfect as VALID, advanced grammar—NEVER flag them as wrong tense.
- Penalize errors in conditional verb forms ("If I would go" -> "If I went"), time clauses ("when I will go"), and past deduction ("may take" for past event -> "might have taken").`;
    case 'C1':
    case 'C2':
    default:
      return `CEFR ${cefrLevel} (Advanced / Proficiency):
- Evaluate sophisticated syntactic range: Past Perfect ("had + V3/ed"), Conditional Type 3 & Mixed Conditionals ("If he had studied..., he would have passed..."), Inversion ("Had I known...", "Not only does..."), Participle Clauses ("Having completed..."), Subjunctive Mood ("It is vital that he be..."), and Cleft Sentences ("What matters most is...").
- Explicitly reward accurate use of these advanced structures in "advanced_structures_used" and NEVER misclassify Conditional Type 2/3 or Past Perfect as tense errors.
- If a ${cefrLevel} speaker ONLY uses elementary simple sentences without any complex clauses, cap grammar_score at 68 and advise upgrading sentence complexity in feedback_vi.`;
  }
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

    // 🛡️ Ép Whisper ghi âm nguyên văn (verbatim), không tự sửa ngữ pháp cơ bản lẫn nâng cao
    const whisperFormData: any = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-large-v3');
    whisperFormData.append('language', 'en');
    whisperFormData.append('response_format', 'verbose_json');
    whisperFormData.append(
      'prompt',
      'Transcribe strictly verbatim as spoken. Do NOT auto-correct grammar, wrong tenses (like "I leave", "while I am reading", "when I will go"), missing third-person singular -s/-es (e.g. "he go", "she work"), missing past tense -ed, wrong past participles in conditionals/perfect tenses (e.g. "had went", "would have went"), plural -s, or mispronounced words.'
    );

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
          wordAnalysis: [],
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

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s/']/g, '').trim();
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
      'bare': ['bear'], 'bear': ['bare'],
      'sum': ['some'], 'some': ['sum'],
      'sea': ['see'], 'see': ['sea'],
      'meat': ['meet'], 'meet': ['meat'],
      'sun': ['son'], 'son': ['sun'],
      'wear': ['where'], 'where': ['wear'],
      'pair': ['pear'], 'pear': ['pair'],
      'right': ['write'], 'write': ['right'],
      'air': ['heir'], 'heir': ['air'],
      'buy': ['by', 'bye'], 'bye': ['buy', 'by'], 'by': ['buy', 'bye'],
      'for': ['four'], 'four': ['for'],
      'to': ['too', 'two'], 'too': ['to', 'two'], 'two': ['to', 'too'],
      'one': ['won'], 'won': ['one'],
      'flour': ['flower'], 'flower': ['flour'],
      'peace': ['piece'], 'piece': ['peace'],
      'wait': ['weight'], 'weight': ['wait'],
      'break': ['brake'], 'brake': ['break']
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

      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: feedback,
          isWin: calculatedScore >= 70,
          errorWords: [],
          wordAnalysis: buildWordAnalysisArray(transcript, []),
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
          wordAnalysis: buildWordAnalysisArray(transcript, []),
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
            wordAnalysis: [],
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
      let errorWordsList: DetectedGrammarError[] = scanComprehensiveGrammarErrors(
        spokenWords,
        transcript.toLowerCase(),
        targetPrompt.toLowerCase(),
        true,
        []
      );
      let dynamicFeedback = '';

      try {
        const groqLlmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 450,
            messages: [
              {
                role: 'system',
                content: `You are an expert Cambridge/IELTS speaking examiner evaluating a CEFR ${cefrLevel} student on a rapid response prompt.
${getCefrGrammarRubricInstruction(cefrLevel)}
Strictly detect any spoken grammar or ending errors (basic and advanced).
IMPORTANT: For every mistake in "detected_errors", set "word" to the EXACT single offending verb/auxiliary from the transcript so the UI highlights it in RED.
Return JSON ONLY:
{
  "vocab_score": number,
  "grammar_score": number,
  "content_score": number,
  "advanced_structures_used": ["e.g. Conditional Type 2"],
  "detected_errors": [
    { "word": "exact_single_wrong_word", "correction": "better_word", "reason": "Lý do bằng tiếng Việt chỉ rõ lỗi ngữ pháp/phát âm" }
  ],
  "feedback_vi": "Nhận xét sư phạm tiếng Việt sắc bén 1-2 câu"
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
                if (err.word && !errorWordsList.some(e => e.word.toLowerCase() === err.word.toLowerCase())) {
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
          wordAnalysis: buildWordAnalysisArray(transcript, errorWordsList),
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
    // 🎭 NHÁNH 4: TRẠM 2 - VOCABULARY & REFLEX ARENA (PHÂN TẦNG NGỮ PHÁP A1–C2)
    // =========================================================================
    } else {
      const wordCount = spokenWords.length;
      const hallucinationPhrases = ['thank you', 'thanks for watching', 'subtitles by', 'bye', 'goodbye'];
      const isHallucination = wordCount <= 3 && hallucinationPhrases.some(h => transcript.toLowerCase().includes(h));

      if (isHallucination || wordCount < 4) {
        calculatedScore = Math.max(15, wordCount * 6);
        feedback = `⚠️ Bài nói quá ngắn (${wordCount} từ). Hãy đối thoại hoàn chỉnh câu để AI có thể đánh giá!`;
        return new Response(
          JSON.stringify({
            score: calculatedScore,
            transcript: transcript,
            feedback: feedback,
            isWin: false,
            errorWords: [],
            wordAnalysis: [],
            criteria: { pronunciation: 30, vocabulary: 30, grammar: 30, fluency: 30, content: 20 }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const lowerTranscript = transcript.toLowerCase();
      const lowerPrompt = targetPrompt.toLowerCase();
      const isFreeSpeechMode = lowerPrompt.includes('mode: free_speech');

      const targetCleanWords = !isFreeSpeechMode
        ? lowerPrompt.replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean)
        : [];

      const hasHypotheticalClause =
        /\bif\b/.test(lowerTranscript) ||
        /\bwish\b/.test(lowerTranscript) ||
        /\bwould\s+have\b/.test(lowerTranscript) ||
        /\bcould\s+have\b/.test(lowerTranscript) ||
        /\bmight\s+have\b/.test(lowerTranscript);

      // 1. 🎯 KIỂM TRA ĐỘ BÁM SÁT CHỦ ĐỀ (OFF-TOPIC DETECTOR)
      const stopWords = ['describe', 'talk', 'about', 'your', 'you', 'the', 'and', 'with', 'that', 'this', 'have', 'what', 'where', 'when', 'which', 'tell', 'enrolled', 'special', 'favorite', 'help', 'evaluate', 'analyze', 'extent', 'discuss', 'propose', 'deliver', 'whether', 'merely', 'particularly', 'regarding', 'reflex', 'challenge', 'mode', 'free_speech', 'scenario', 'context', 'reference', 'english', 'sample'];
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
      const isCompletelyOffTopic = (isOnlineCoursePrompt && isFamilyHometownSpeech) || (!isFreeSpeechMode && corePromptKeywords.length >= 3 && matchedTopicKeywords === 0);

      // 2. 🧠 CHẠY BỘ QUÉT NGỮ PHÁP TOÀN DIỆN TẠI CHỖ (A1 -> C2)
      let errorWordsList: DetectedGrammarError[] = scanComprehensiveGrammarErrors(
        spokenWords,
        lowerTranscript,
        lowerPrompt,
        isFreeSpeechMode,
        targetCleanWords
      );
      let dynamicFeedback = '';
      let advancedStructuresUsed: string[] = [];

      if (isCompletelyOffTopic) {
        errorWordsList.push({
          word: 'hometown',
          correction: 'online course / tutorial',
          reason: 'Lạc đề nghiêm trọng: Đề bài yêu cầu miêu tả "khóa học trực tuyến (online course)", bài nói đang kể về "quê hương (hometown)".'
        });
      }

      // Bắt lỗi sai thì ngữ cảnh thói quen (khi không phải câu điều kiện giả định)
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

      if (isHabitualPrompt && !hasHypotheticalClause) {
        const pastVerbsMap: Record<string, string> = {
          'cooked': 'cook / usually cook', 'made': 'make / prepare', 'cleaned': 'clean / usually clean',
          'washed': 'wash / help wash', 'helped': 'help / usually help', 'went': 'go',
          'did': 'do', 'bought': 'buy', 'yesterday': 'usually / every day / on weekends'
        };

        spokenWords.forEach((w, idx) => {
          if (pastVerbsMap[w] && !errorWordsList.some(e => e.wordIndex === idx)) {
            errorWordsList.push({
              wordIndex: idx,
              word: w,
              correction: pastVerbsMap[w],
              reason: `Sai thì ngữ cảnh: Đề bài hỏi về thói quen thường xuyên, cần dùng Hiện tại đơn ("${pastVerbsMap[w]}"), không dùng quá khứ ("${w}").`
            });
          }
        });
      }

      // Bắt lỗi câu ngắt cụt
      const lastWord = spokenWords[spokenWords.length - 1]?.toLowerCase() || '';
      const incompleteEndings = [
        'my', 'your', 'his', 'her', 'their', 'our', 'the', 'a', 'an',
        'parents', 'mother', 'father', 'brother', 'sister', 'friend',
        'and', 'or', 'but', 'because', 'so', 'although', 'with', 'to', 'at', 'in', 'of', 'for'
      ];
      
      const isIncompleteSentence = wordCount < 15 && incompleteEndings.includes(lastWord);
      if (isIncompleteSentence && !errorWordsList.some(e => e.wordIndex === spokenWords.length - 1)) {
        errorWordsList.push({
          wordIndex: spokenWords.length - 1,
          word: lastWord,
          correction: `${lastWord} ... [cần hoàn thành vị ngữ]`,
          reason: `Câu nói bị ngắt cụt ở từ "${lastWord}". Hãy hoàn thành trọn vẹn câu!`
        });
      }

      // 3. 🎯 TÍNH ĐIỂM CƠ BẢN
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
        baseContent = Math.min(72, Math.max(45, wordCount * 6));
        baseGrammar = hasNoErrors ? 80 : Math.max(35, 65 - errorWordsList.length * 12);
        baseVocab = Math.min(75, Math.max(50, wordCount * 6));
        baseFluency = Math.min(72, Math.max(45, wordCount * 6));
      } else if (wordCount < 20) {
        baseContent = hasNoErrors ? 82 : 70;
        baseGrammar = hasNoErrors ? 86 : Math.max(35, 72 - errorWordsList.length * 12);
        baseVocab = hasNoErrors ? 82 : 72;
        baseFluency = hasNoErrors ? 80 : 70;
      } else {
        const hasConnectors = ['and', 'so', 'because', 'but', 'also', 'although', 'however', 'when', 'while', 'if', 'had'].some(c => lowerTranscript.includes(c));
        baseContent = hasNoErrors ? Math.min(95, 88 + (wordCount >= 28 ? 6 : 2)) : 76;
        baseGrammar = hasNoErrors ? Math.min(96, 90 + (wordCount >= 28 ? 5 : 2)) : Math.max(35, 72 - errorWordsList.length * 12);
        baseVocab = hasNoErrors ? Math.min(94, 85 + (wordCount >= 28 ? 6 : 2)) : 72;
        baseFluency = Math.min(95, Math.max(72, 76 + (wordCount >= 28 ? 14 : 8) + (hasConnectors ? 5 : 0)));
      }

      let grammarScore = baseGrammar;
      let vocabScore = baseVocab;
      let contentScore = baseContent;
      let fluencyScore = baseFluency;
      let pronunciationScore = hasNoErrors
        ? Math.min(100, Math.max(68, 76 + acousticQualityBonus * 1.6))
        : Math.max(45, 74 + acousticQualityBonus - errorWordsList.length * 8);

      // 4. 🤖 GỌI GROQ LLAMA-3.3-70B PHÂN TÍCH NGỮ PHÁP TỪ CƠ BẢN ĐẾN NÂNG CAO (A1–C2)
      try {
        const groqLlmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 650,
            messages: [
              {
                role: 'system',
                content: `You are a strict, authoritative Cambridge & IELTS Speaking Examiner evaluating a CEFR ${cefrLevel} student.
Target Prompt/Context: "${targetPrompt}".

${getCefrGrammarRubricInstruction(cefrLevel)}

CRITICAL EVALUATION RULES (BASIC TO ADVANCED A1–C2):
1. NEVER auto-correct or overlook spoken grammar/tense/ending/word-choice mistakes in the student's verbatim transcript.
2. Check EVERY clause systematically and report ALL errors in "detected_errors":
   - Basic (A1–A2): 3rd-person singular "-s/-es" ("he go" -> "goes"), wrong verb tense in narrative stories ("I leave my bag yesterday" -> "left"), articles ("a/an"), plural nouns.
   - Intermediate Sequence of Tenses (B1–B2):
     * NEVER allow "will" inside time clauses ("when / while / before / after"): e.g., "when I will go" -> "when I went" (or "when I go").
     * Background past actions with "while" in a past story MUST use Past Continuous: e.g., "while I am reading" -> "was".
     * Past speculation/deduction MUST use "might have + V3/ed" or Past Simple: e.g., "someone may take it" referring to yesterday -> "might have taken".
   - Advanced (B2–C2):
     * Conditionals Type 2, Type 3 & Mixed Conditionals ("If I would have known" -> "had known"; "would have went" -> "gone").
     * Past Perfect ("had + V3/ed"), Passive Voice, Relative Clauses, Inversion ("Had I known..."), and Subjunctive Mood.
3. WHITELIST VALID ADVANCED GRAMMAR:
   - If the student accurately uses Past Perfect, Conditionals Type 2/3/Mixed, Passive Voice, or Inversion, list them in "advanced_structures_used", reward grammar_score (88–98), and NEVER flag them as tense errors!
4. IMPORTANT UI MAPPING RULE FOR "detected_errors":
   - Set "word" to the EXACT SINGLE offending verb/auxiliary/word from the transcript (e.g., "leave", "am", "may", "will", "would", "went") so the UI highlights that exact word chip in RED!
5. Deduct 10–15 points from grammar_score for each genuine grammatical/tense error.

Return JSON ONLY:
{
  "vocab_score": number,
  "grammar_score": number,
  "content_score": number,
  "is_off_topic": boolean,
  "advanced_structures_used": ["string"],
  "detected_errors": [
    { "word": "exact_single_wrong_word_from_transcript", "correction": "correct_form", "reason": "Giải thích quy tắc ngữ pháp/thì bằng tiếng Việt ngắn gọn, rõ ràng" }
  ],
  "feedback_vi": "Nhận xét tiếng Việt 1-2 câu chỉ rõ cấu trúc nâng cao đã dùng tốt (nếu có) và liệt kê các lỗi ngữ pháp bị tô đỏ cần sửa"
}`
              },
              {
                role: 'user',
                content: `CEFR Level: ${cefrLevel}\nScenario & Reference: "${targetPrompt || 'General speaking context'}"\nStudent verbatim transcript: "${transcript}"`
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
                : parsed.content_score;
            }
            if (typeof parsed.grammar_score === 'number') {
              grammarScore = errorWordsList.length === 0
                ? parsed.grammar_score
                : Math.min(parsed.grammar_score, baseGrammar);
            }
            if (typeof parsed.vocab_score === 'number') {
              vocabScore = parsed.vocab_score;
            }
            if (Array.isArray(parsed.advanced_structures_used)) {
              advancedStructuresUsed = parsed.advanced_structures_used.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
            }
            
            if (Array.isArray(parsed.detected_errors) && parsed.detected_errors.length > 0) {
              parsed.detected_errors.forEach((err: any) => {
                if (err.word) {
                  const singleTok = String(err.word).trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9']/g, '');
                  // Tìm vị trí từ chưa bị đánh dấu lỗi trong spokenWords
                  const foundIdx = spokenWords.findIndex(
                    (w, idx) => w === singleTok && !errorWordsList.some((e) => e.wordIndex === idx)
                  );
                  if (foundIdx !== -1) {
                    errorWordsList.push({
                      wordIndex: foundIdx,
                      word: spokenWords[foundIdx],
                      correction: err.correction || '',
                      reason: err.reason || 'Lỗi ngữ pháp / phối hợp thì.'
                    });
                  } else if (!errorWordsList.some((e) => e.word.toLowerCase() === singleTok)) {
                    errorWordsList.push({
                      word: err.word,
                      correction: err.correction || '',
                      reason: err.reason || 'Lỗi ngữ pháp / phối hợp thì.'
                    });
                  }
                }
              });
            }

            if (parsed.feedback_vi && parsed.feedback_vi.length > 15) {
              dynamicFeedback = parsed.feedback_vi;
            }
          }
        }
      } catch (llmErr) {
        console.warn("LLM API call bypassed, using comprehensive local grammar scanner:", llmErr);
      }

      // 5. TÍNH ĐIỂM TỔNG HỢP CÔNG BẰNG & TRỪ ĐIỂM RÕ RÀNG KHI SAI NGỮ PHÁP
      const penalty = errorWordsList.length * 10;
      const cappedGrammar = errorWordsList.length > 0
        ? Math.min(grammarScore, Math.max(25, 82 - errorWordsList.length * 12))
        : grammarScore;
      const cappedPronunciation = errorWordsList.length > 0
        ? Math.min(pronunciationScore, Math.max(35, 84 - errorWordsList.length * 8))
        : pronunciationScore;

      calculatedScore = Math.max(
        25,
        Math.min(
          98,
          Math.round(
            (cappedPronunciation * 0.25 +
             vocabScore * 0.2 +
             cappedGrammar * 0.25 +
             contentScore * 0.2 +
             fluencyScore * 0.1) - Math.round(penalty * 0.4)
          )
        )
      );

      if (isCompletelyOffTopic) {
        calculatedScore = Math.min(50, calculatedScore);
      } else if (isIncompleteSentence || wordCount < 8) {
        calculatedScore = Math.min(60, calculatedScore);
      }

      // 6. NHẬN XÉT SƯ PHẠM CỤ THỂ
      if (!dynamicFeedback) {
        const advNote = advancedStructuresUsed.length > 0
          ? ` Điểm cộng cho việc vận dụng cấu trúc nâng cao (${advancedStructuresUsed.join(', ')}).`
          : '';

        if (isCompletelyOffTopic) {
          dynamicFeedback = `⚠️ Bài nói bị lạc đề! Bạn cần chú ý đọc kỹ yêu cầu của chủ đề để trả lời đúng trọng tâm.`;
        } else if (errorWordsList.length > 0) {
          const summaryErrors = errorWordsList
            .slice(0, 3)
            .map((e) => `"${e.word}" ➔ "${e.correction}"`)
            .join(', ');
          dynamicFeedback = `⚠️ Phát hiện ${errorWordsList.length} lỗi ngữ pháp/phối hợp thì (đã tô đỏ): ${summaryErrors}. ${errorWordsList[0].reason}${advNote}`;
        } else if (isIncompleteSentence) {
          dynamicFeedback = `⚠️ Câu nói bị ngắt cụt ở cuối ("${lastWord}"). Hãy hoàn thành trọn vẹn ý của câu để AI chấm điểm chính xác hơn nhé!`;
        } else if (wordCount < 10) {
          dynamicFeedback = `💡 Bài nói hơi ngắn (${wordCount} từ). Hãy mở rộng thêm các hành động cụ thể để câu trả lời thuyết phục hơn.`;
        } else if (calculatedScore >= 85) {
          dynamicFeedback = `🌟 Xuất sắc! Bạn diễn đạt rất tự nhiên, phát âm chuẩn xác và phối hợp thì/ngữ pháp rất chuẩn.${advNote}`;
        } else {
          dynamicFeedback = `👍 Bài nói mạch lạc và đúng trọng tâm.${advNote} Hãy tiếp tục phát huy nhé!`;
        }
      }

      const wordAnalysis = buildWordAnalysisArray(transcript, errorWordsList);

      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: dynamicFeedback,
          isWin: calculatedScore >= 70,
          errorWords: errorWordsList,
          wordAnalysis: wordAnalysis,
          advancedStructures: advancedStructuresUsed,
          criteria: {
            pronunciation: cappedPronunciation,
            vocabulary: vocabScore,
            grammar: cappedGrammar,
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