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
// 🛡️ BỘ ĐỆM RATE-LIMIT PHÒNG THI TẬP TRUNG (60 YÊU CẦU / 60 GIÂY / IP NAT)
// =========================================================================
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

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
// 🔄 BỘ QUẢN LÝ XOAY VÒNG MULTI-KEY GROQ + FALLBACK GEMINI API
// =========================================================================
function getGroqKeyPool(): string[] {
  const multiKeys = (process.env.GROQ_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const singleKeys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_NEW]
    .map((k) => (k || '').trim())
    .filter(Boolean);

  const uniqueKeys = Array.from(new Set([...multiKeys, ...singleKeys]));
  for (let i = uniqueKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniqueKeys[i], uniqueKeys[j]] = [uniqueKeys[j], uniqueKeys[i]];
  }
  return uniqueKeys;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

interface TranscriptionMetadata {
  transcript: string;
  avgLogprob: number;
  durationSec: number;
  maxPauseSec: number;
  noSpeechProb: number;
  compressionRatio: number;
  providerUsed: string;
}

// =========================================================================
// 🔬 TẦNG ÂM VỊ HỌC (CAMBRIDGE PHONEME-LEVEL ACOUSTIC AUDIT VIA GEMINI AUDIO)
// =========================================================================
export interface PhonemeErrorItem {
  word: string;
  expectedIpa: string;
  actualSound: string;
  issueType: 'FINAL_CONSONANT' | 'VOWEL_QUALITY' | 'CONSONANT_CLUSTER' | 'WORD_STRESS';
  reasonVi: string;
}

export interface PhonemeAssessmentResult {
  phonemeAccuracyScore: number;
  ipaFeedbackSummary: string;
  phonemeErrors: PhonemeErrorItem[];
}

async function analyzePhonemeLevelFromAudio(
  audioBase64: string,
  mimeType: string,
  transcript: string,
  targetPrompt: string,
  cefrLevel: string,
  geminiApiKey: string
): Promise<PhonemeAssessmentResult | null> {
  if (!geminiApiKey || !audioBase64 || !transcript) return null;

  try {
    const cleanTarget = targetPrompt
      .replace(/Mode\s*:\s*FREE_SPEECH/gi, '')
      .replace(/Level\s*:\s*[A-C][1-2]/gi, '')
      .trim();

    const promptText = `You are a Cambridge English Phonetics & Pronunciation Examiner assessing a CEFR ${cefrLevel} candidate.
Listen carefully to the actual audio recording and compare the acoustic phonemes against standard English IPA for the spoken words: "${transcript}"${cleanTarget ? ` (Target reference: "${cleanTarget}")` : ''}.

Inspect specifically for:
1. FINAL_CONSONANT: Dropped or devoiced final consonants (/t/, /d/, /k/, /g/, /s/, /z/, /v/, /l/, /n/, /-ed/, /-s/).
2. VOWEL_QUALITY: Short vs. long vowel confusion (/ɪ/ vs /iː/, /ʊ/ vs /uː/, /æ/ vs /e/, /ʌ/ vs /ɑː/) or missing diphthongs (/aɪ/, /eɪ/, /əʊ/).
3. CONSONANT_CLUSTER: Simplified consonant clusters (/tr/, /st/, /pr/, /pl/, /ks/, /θ/, /ð/, /ʃ/, /tʃ/, /dʒ/).
4. WORD_STRESS: Misplaced primary stress on multi-syllable words (e.g. "techNOlogy", "opporTUnity", "inTEResting").

Return ONLY valid JSON:
{
  "phoneme_accuracy_score": number_0_to_100,
  "ipa_feedback_summary_vi": "Nhận xét ngắn gọn 1 câu bằng tiếng Việt về độ chuẩn âm vị, âm cuối và trọng âm từ",
  "phoneme_errors": [
    {
      "word": "exact_word_from_transcript",
      "expected_ipa": "/ipa/",
      "actual_sound": "how_student_pronounced_it",
      "issue_type": "FINAL_CONSONANT | VOWEL_QUALITY | CONSONANT_CLUSTER | WORD_STRESS",
      "reason_vi": "Giải thích lỗi âm vị bằng tiếng Việt kèm phiên âm IPA chuẩn"
    }
  ]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                { inline_data: { mime_type: mimeType, data: audioBase64 } }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 450,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(raw);

    const mappedErrors: PhonemeErrorItem[] = Array.isArray(parsed.phoneme_errors)
      ? parsed.phoneme_errors.slice(0, 5).map((item: any) => ({
          word: String(item.word || '').trim(),
          expectedIpa: String(item.expected_ipa || '').trim(),
          actualSound: String(item.actual_sound || '').trim(),
          issueType: item.issue_type || 'VOWEL_QUALITY',
          reasonVi: String(item.reason_vi || '').trim(),
        })).filter((e: PhonemeErrorItem) => e.word.length > 0)
      : [];

    return {
      phonemeAccuracyScore: typeof parsed.phoneme_accuracy_score === 'number'
        ? Math.max(25, Math.min(100, Math.round(parsed.phoneme_accuracy_score)))
        : 82,
      ipaFeedbackSummary: String(parsed.ipa_feedback_summary_vi || '').trim(),
      phonemeErrors: mappedErrors,
    };
  } catch {
    return null;
  }
}

// 🎙️ TẦNG 1: GỠ BĂNG ÂM THANH ĐA NHÀ CUNG CẤP + TRÍCH XUẤT CHỈ SỐ ÂM HỌC & THỜI GIAN
async function transcribeAudioWithFallback(
  audioFile: any,
  audioBase64: string,
  mimeType: string,
  groqKeys: string[],
  geminiApiKey: string
): Promise<TranscriptionMetadata> {
  const verbatimPrompt =
    'Transcribe strictly verbatim as spoken including filler words (uh, um, er, ah) and stutters. Do NOT auto-correct grammar, wrong tenses (like "I buy yesterday", "I leave", "while I am reading", "when I will go"), uncountable plurals ("are works", "personal uses", "informations"), missing third-person singular -s/-es, missing past tense -ed, wrong past participles, missing prepositions/articles ("go the website", "open account", "want buy"), or mispronounced words.';

  let lastGroqError = '';

  for (let idx = 0; idx < groqKeys.length; idx++) {
    const apiKey = groqKeys[idx];
    try {
      const whisperFormData: any = new FormData();
      whisperFormData.append('file', audioFile);
      whisperFormData.append('model', 'whisper-large-v3');
      whisperFormData.append('language', 'en');
      whisperFormData.append('response_format', 'verbose_json');
      whisperFormData.append('prompt', verbatimPrompt);

      const whisperResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: whisperFormData,
      });

      if (whisperResponse.ok) {
        const whisperData = await whisperResponse.json();
        const transcript = (whisperData.text || '').trim();
        const segments = Array.isArray(whisperData.segments) ? whisperData.segments : [];

        let avgLogprob = -0.35;
        let maxNoSpeechProb = 0;
        let maxCompressionRatio = 1.2;
        let maxPauseSec = 0;

        if (segments.length > 0) {
          const sumLogprob = segments.reduce((acc: number, s: any) => acc + (s.avg_logprob || 0), 0);
          avgLogprob = sumLogprob / segments.length;

          for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            if (typeof seg.no_speech_prob === 'number' && seg.no_speech_prob > maxNoSpeechProb) {
              maxNoSpeechProb = seg.no_speech_prob;
            }
            if (typeof seg.compression_ratio === 'number' && seg.compression_ratio > maxCompressionRatio) {
              maxCompressionRatio = seg.compression_ratio;
            }
            if (i > 0 && typeof seg.start === 'number' && typeof segments[i - 1].end === 'number') {
              const gap = seg.start - segments[i - 1].end;
              if (gap > maxPauseSec) maxPauseSec = gap;
            }
          }
        }

        const lastSegEnd = segments.length > 0 && typeof segments[segments.length - 1].end === 'number'
          ? segments[segments.length - 1].end
          : 0;
        const durationSec = typeof whisperData.duration === 'number' && whisperData.duration > 0
          ? whisperData.duration
          : lastSegEnd;

        return {
          transcript,
          avgLogprob,
          durationSec,
          maxPauseSec,
          noSpeechProb: maxNoSpeechProb,
          compressionRatio: maxCompressionRatio,
          providerUsed: `groq-whisper-key-${idx + 1}`,
        };
      }

      const status = whisperResponse.status;
      lastGroqError = await whisperResponse.text();
      if (status === 429 || status >= 500) {
        console.warn(`Groq Whisper key #${idx + 1} hit HTTP ${status}, rotating to next key...`);
        continue;
      }
    } catch (err: any) {
      lastGroqError = err?.message || 'Network error on Groq Whisper';
      console.warn(`Groq Whisper key #${idx + 1} network exception, rotating...`, err);
    }
  }

  // Fallback sang Google Gemini API (Multimodal Audio)
  if (geminiApiKey && audioBase64) {
    try {
      const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
      for (const gModel of geminiModels) {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Listen to this student's English speech recording and transcribe it STRICTLY VERBATIM word-for-word (including filler words like uh, um, er, and stutters). Do NOT fix grammar errors, missing verb endings (-s, -ed), wrong tenses, missing prepositions/articles, or mispronounced words. Estimate total spoken duration in seconds and longest mid-speech pause in seconds. Return JSON ONLY: {"transcript": "exact verbatim text", "clarity_confidence": 0.0_to_1.0, "duration_sec": number, "max_pause_sec": number}`
                    },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: audioBase64
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.0,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const parsedG = JSON.parse(rawText);
          const transcript = String(parsedG.transcript || '').trim();
          const conf = typeof parsedG.clarity_confidence === 'number' ? parsedG.clarity_confidence : 0.85;
          const mappedLogprob = -1.0 + Math.max(0, Math.min(1, conf)) * 0.9;
          return {
            transcript,
            avgLogprob: mappedLogprob,
            durationSec: typeof parsedG.duration_sec === 'number' ? parsedG.duration_sec : 0,
            maxPauseSec: typeof parsedG.max_pause_sec === 'number' ? parsedG.max_pause_sec : 0,
            noSpeechProb: conf < 0.35 ? 0.7 : 0.05,
            compressionRatio: 1.2,
            providerUsed: `gemini-fallback-${gModel}`,
          };
        }
      }
    } catch (geminiErr: any) {
      console.error('Gemini Audio Fallback failed:', geminiErr);
    }
  }

  throw new Error(`Tất cả máy chủ nhận diện giọng nói đang quá tải (${lastGroqError || '429/503'}). Vui lòng thử lại sau vài giây.`);
}

// =========================================================================
// 📊 BỘ PHÂN TÍCH 5 CHỈ SỐ NÂNG CAO: WPM THEO CEFR, TỪ ĐỆM, PARROTING, TTR
// =========================================================================
interface CefrWpmBenchmark {
  minAcceptable: number;
  idealLow: number;
  idealHigh: number;
}

function getCefrWpmBenchmark(cefrLevel: string): CefrWpmBenchmark {
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    return { minAcceptable: 60, idealLow: 80, idealHigh: 120 };
  }
  if (cefrLevel === 'C1' || cefrLevel === 'C2') {
    return { minAcceptable: 95, idealLow: 125, idealHigh: 165 };
  }
  return { minAcceptable: 78, idealLow: 105, idealHigh: 145 };
}

interface AdvancedSpeechDiagnostics {
  effectiveWords: string[];
  effectiveWordCount: number;
  fillerCount: number;
  stutterCount: number;
  disfluencyRatio: number;
  wpm: number | null;
  wpmBenchmark: CefrWpmBenchmark;
  isTooSlow: boolean;
  hasLongPause: boolean;
  isParroting: boolean;
  parrotingRatio: number;
  ttrScore: number;
  academicConnectorCount: number;
  isMumbledOrNoisy: boolean;
  diagnosticNotes: string[];
}

function analyzeSpeechDiagnostics(
  spokenWords: string[],
  targetPrompt: string,
  meta: TranscriptionMetadata,
  cefrLevel: string
): AdvancedSpeechDiagnostics {
  const fillerSet = new Set(['uh', 'um', 'er', 'ah', 'erm', 'hmm', 'uhm']);
  let fillerCount = 0;
  let stutterCount = 0;
  const effectiveWords: string[] = [];

  for (let i = 0; i < spokenWords.length; i++) {
    const w = spokenWords[i];
    if (fillerSet.has(w)) {
      fillerCount++;
      continue;
    }
    if (i > 0 && w === spokenWords[i - 1] && w.length >= 2) {
      stutterCount++;
      continue;
    }
    effectiveWords.push(w);
  }

  const effectiveWordCount = effectiveWords.length;
  const totalRaw = Math.max(1, spokenWords.length);
  const disfluencyRatio = (fillerCount + stutterCount) / totalRaw;

  const wpmBenchmark = getCefrWpmBenchmark(cefrLevel);
  let wpm: number | null = null;
  if (meta.durationSec >= 2.0 && effectiveWordCount > 0) {
    wpm = Math.round((effectiveWordCount / meta.durationSec) * 60);
  }
  const isTooSlow = wpm !== null && wpm < wpmBenchmark.minAcceptable && effectiveWordCount >= 6;
  const hasLongPause = meta.maxPauseSec > 2.6;

  const cleanScenarioPrompt = targetPrompt
    .replace(/Reference\s+English\s+Sample\s*:[\s\S]*/gi, ' ')
    .replace(/Context\s*\(VI\)\s*:[^|]*/gi, ' ')
    .replace(/Mode\s*:\s*FREE_SPEECH/gi, ' ')
    .replace(/Level\s*:\s*[A-C][1-2]/gi, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let parrotingRatio = 0;
  if (cleanScenarioPrompt.length >= 4 && effectiveWords.length >= 5) {
    const promptTrigrams = new Set<string>();
    for (let i = 0; i <= cleanScenarioPrompt.length - 3; i++) {
      promptTrigrams.add(`${cleanScenarioPrompt[i]} ${cleanScenarioPrompt[i + 1]} ${cleanScenarioPrompt[i + 2]}`);
    }
    let matchedTrigrams = 0;
    const totalStudentTrigrams = Math.max(1, effectiveWords.length - 2);
    for (let i = 0; i <= effectiveWords.length - 3; i++) {
      const tri = `${effectiveWords[i]} ${effectiveWords[i + 1]} ${effectiveWords[i + 2]}`;
      if (promptTrigrams.has(tri)) {
        matchedTrigrams++;
      }
    }
    parrotingRatio = matchedTrigrams / totalStudentTrigrams;
  }
  const isParroting = parrotingRatio >= 0.55;

  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'it', 'i', 'we', 'my', 'our']);
  const contentTokens = effectiveWords.filter((w) => !stopWords.has(w) && w.length >= 3);
  const uniqueContentTokens = new Set(contentTokens);
  const ttrRatio = contentTokens.length > 0 ? uniqueContentTokens.size / contentTokens.length : 1;
  const ttrScore = Math.min(100, Math.max(40, Math.round(ttrRatio * 100)));

  const academicConnectors = new Set([
    'furthermore', 'moreover', 'consequently', 'therefore', 'however', 'nevertheless',
    'although', 'whereas', 'despite', 'additionally', 'specifically', 'significantly',
    'efficient', 'efficiency', 'accurate', 'accuracy', 'convenient', 'implement',
    'streamline', 'mitigate', 'enhance', 'substantial', 'recommend', 'solution'
  ]);
  let academicConnectorCount = 0;
  uniqueContentTokens.forEach((tok) => {
    if (academicConnectors.has(tok)) academicConnectorCount++;
  });

  const isMumbledOrNoisy = meta.noSpeechProb > 0.6 || meta.compressionRatio > 2.45 || meta.avgLogprob < -0.88;

  const diagnosticNotes: string[] = [];
  if (isParroting) {
    diagnosticNotes.push('⚠️ Bạn đang đọc lặp lại nguyên văn câu hỏi đề bài; hãy diễn đạt bằng ý tưởng và câu văn của riêng mình.');
  }
  if (disfluencyRatio > 0.12 && (fillerCount + stutterCount) >= 2) {
    diagnosticNotes.push(`Có ${fillerCount + stutterCount} lần dùng từ đệm ("uh/um") hoặc lặp từ vấp, làm giảm độ trôi chảy.`);
  }
  if (isTooSlow && wpm !== null) {
    diagnosticNotes.push(`Tốc độ nói còn chậm (${wpm} từ/phút, chuẩn ${cefrLevel} là ${wpmBenchmark.idealLow}–${wpmBenchmark.idealHigh} từ/phút).`);
  }
  if (hasLongPause) {
    diagnosticNotes.push(`Có khoảng ngập ngừng dài (${meta.maxPauseSec.toFixed(1)}s) giữa câu.`);
  }
  if (contentTokens.length >= 8 && ttrRatio < 0.45) {
    diagnosticNotes.push('Từ vựng còn lặp lại nhiều từ đơn giản, nên dùng thêm từ đồng nghĩa.');
  }
  if (isMumbledOrNoisy) {
    diagnosticNotes.push('Âm thanh thu được hơi nhỏ/lầm bầm hoặc có tạp âm, cần phát âm tròn vành rõ chữ hơn.');
  }

  return {
    effectiveWords,
    effectiveWordCount,
    fillerCount,
    stutterCount,
    disfluencyRatio,
    wpm,
    wpmBenchmark,
    isTooSlow,
    hasLongPause,
    isParroting,
    parrotingRatio,
    ttrScore,
    academicConnectorCount,
    isMumbledOrNoisy,
    diagnosticNotes,
  };
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
    return { score: 82, feedback: 'Ngữ điệu tự nhiên, lên xuống giọng êm.' };
  }

  const distance = computeDTWDistance(studentPitch, referencePitch);
  const prosodyScore = Math.max(35, Math.min(100, Math.round(100 - distance * 14)));

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
// 🎯 BỘ KIỂM ĐỊNH ĐỘ KHỚP CHỦ ĐỀ LINH HOẠT (MỞ RỘNG ĐỒNG NGHĨA NGHỀ NGHIỆP & E-COMMERCE)
// =========================================================================
export interface TopicRelevanceResult {
  isOffTopic: boolean;
  relevanceScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  feedbackNote: string;
}

function evaluateTopicRelevance(transcript: string, targetPrompt: string): TopicRelevanceResult {
  const metadataStopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our',
    'out', 'what', 'about', 'with', 'that', 'this', 'from', 'they', 'have', 'which', 'their',
    'talk', 'discuss', 'describe', 'explain', 'your', 'opinion', 'solo', 'mode', 'free', 'speech',
    'level', 'scenario', 'context', 'reference', 'english', 'sample', 'express', 'prompt', 'question',
    'challenge', 'reflex', 'custom', 'deliver', 'whether', 'merely', 'particularly', 'regarding',
    'please', 'answer', 'following', 'topic', 'based', 'classroom', 'point', 'view', 'give', 'tell',
    'how', 'why', 'when', 'where', 'who', 'does', 'did', 'will', 'would', 'should', 'could',
    'present', 'presentation', 'recommend', 'recommendations', 'suggest', 'suggestions',
    'solution', 'solutions', 'another', 'group', 'groups', 'partner', 'classmates', 'team',
    'share', 'propose', 'ideas', 'ways', 'improve', 'improvement', 'problem', 'problems', 'habits', 'habit'
  ]);

  const englishPromptOnly = targetPrompt
    .replace(/Reference\s+English\s+Sample\s*:[\s\S]*/gi, ' ')
    .replace(/Context\s*\(VI\)\s*:[^|]*/gi, ' ')
    .replace(/Mode\s*:\s*FREE_SPEECH/gi, ' ')
    .replace(/Level\s*:\s*[A-C][1-2]/gi, ' ');

  const extractContentKeywords = (text: string): string[] => {
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !metadataStopWords.has(w));
    return Array.from(new Set(tokens));
  };

  const promptKeywords = extractContentKeywords(englishPromptOnly);
  const studentKeywords = extractContentKeywords(transcript);

  if (promptKeywords.length === 0) {
    return {
      isOffTopic: false,
      relevanceScore: 86,
      matchedKeywords: [],
      missingKeywords: [],
      feedbackNote: '',
    };
  }

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  promptKeywords.forEach((pKw) => {
    const pStem = pKw.slice(0, Math.min(6, pKw.length));
    const isMatched = studentKeywords.some((sKw) => {
      const sStem = sKw.slice(0, Math.min(6, sKw.length));
      return sKw === pKw || sKw.startsWith(pStem) || pKw.startsWith(sStem);
    });
    if (isMatched) {
      matchedKeywords.push(pKw);
    } else {
      missingKeywords.push(pKw);
    }
  });

  const matchRatio = matchedKeywords.length / promptKeywords.length;
  const lowerPromptOnly = englishPromptOnly.toLowerCase();
  const lowerTranscript = transcript.toLowerCase();

  const isPersonalMajorStory =
    /\b(chose my major|decided to study|favorite classes|college program|my hometown|went home)\b/.test(lowerTranscript) &&
    !lowerPromptOnly.includes('college') &&
    !lowerPromptOnly.includes('study') &&
    !lowerPromptOnly.includes('hometown');

  // Chấp nhận quy trình mua sản phẩm / đặt vé / dịch vụ trực tuyến
  const isEcommerceOrBookingFlow =
    (lowerPromptOnly.includes('buy') || lowerPromptOnly.includes('shop') || lowerPromptOnly.includes('product') || lowerPromptOnly.includes('step')) &&
    /\b(pay|card|wallet|ticket|book|booking|order|cart|checkout|price|compare|website|app|online|download|confirmation)\b/.test(lowerTranscript);

  // Chấp nhận chủ đề nghề nghiệp / công việc mơ ước / lý do chọn nghề (Job & Career domain)
  const isCareerOrJobTopic =
    (lowerPromptOnly.includes('job') || lowerPromptOnly.includes('career') || lowerPromptOnly.includes('work') || lowerPromptOnly.includes('dream') || lowerPromptOnly.includes('profession')) &&
    /\b(job|work|working|career|salary|dream|colleague|colleagues|commuting|hours|cleaner|photographer|attendant|pilot|doctor|teacher|engineer|manager|office|company)\b/.test(lowerTranscript);

  const isSemanticDomainMatch = isEcommerceOrBookingFlow || isCareerOrJobTopic;

  const isOffTopic =
    !isSemanticDomainMatch &&
    ((studentKeywords.length >= 10 && matchRatio < 0.2) ||
      (isPersonalMajorStory && matchRatio < 0.35));

  if (isOffTopic) {
    const expectedList = promptKeywords.slice(0, 4).join(', ');
    return {
      isOffTopic: true,
      relevanceScore: 15,
      matchedKeywords,
      missingKeywords,
      feedbackNote: `⚠️ SAI LỆCH CHỦ ĐỀ: Nội dung bài nói chưa bám sát yêu cầu đề bài (thiếu trọng tâm: ${expectedList}). Điểm Phát âm và Ngữ điệu vẫn được ghi nhận, nhưng điểm Nội dung & Từ vựng bị trừ nặng.`,
    };
  }

  const effectiveRatio = isSemanticDomainMatch ? Math.max(matchRatio, 0.78) : matchRatio;
  const computedScore = Math.min(100, Math.max(66, Math.round(62 + effectiveRatio * 38)));
  return {
    isOffTopic: false,
    relevanceScore: computedScore,
    matchedKeywords,
    missingKeywords,
    feedbackNote: '',
  };
}

// =========================================================================
// 🔍 HÀM BỔ TRỢ: KIỂM TRA ĐỘNG TỪ CHÍNH, CHIA ĐỘNG TỪ & TÔ MÀU TỪNG TỪ
// =========================================================================
export interface DetectedGrammarError {
  word: string;
  correction: string;
  reason: string;
  wordIndex?: number;
}

function hasSentenceMainVerb(spokenWords: string[]): boolean {
  const commonVerbs = new Set([
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'can', 'could', 'will', 'would', 'should', 'may', 'might', 'must', 'make', 'makes', 'made',
    'help', 'helps', 'helped', 'save', 'saves', 'saved', 'store', 'stores', 'stored',
    'allow', 'allows', 'allowed', 'cost', 'costs', 'need', 'needs', 'needed', 'want', 'wants',
    'think', 'thinks', 'thought', 'believe', 'believes', 'use', 'uses', 'used', 'work', 'works',
    'improve', 'improves', 'improved', 'reduce', 'reduces', 'reduced', 'provide', 'provides',
    'process', 'processes', 'manage', 'manages', 'find', 'finds', 'found', 'give', 'gives',
    'take', 'takes', 'took', 'get', 'gets', 'got', 'go', 'goes', 'went', 'come', 'comes', 'came',
    'say', 'says', 'said', 'know', 'knows', 'knew', 'see', 'sees', 'saw', 'like', 'likes', 'love', 'loves', 'loved',
    'buy', 'buys', 'bought', 'spend', 'spends', 'spent', 'order', 'orders', 'ordered', 'pay', 'pays', 'paid',
    'pick', 'picks', 'picked', 'compare', 'compares', 'compared', 'select', 'selects', 'selected',
    'enter', 'enters', 'entered', 'download', 'downloads', 'downloaded', 'book', 'books', 'booked',
    'choose', 'chooses', 'chose', 'visit', 'visits', 'visited', 'learn', 'learns', 'learned',
    'meet', 'meets', 'met', 'clean', 'cleans', 'cleaned', 'travel', 'travels', 'traveled'
  ]);

  return spokenWords.some((w, idx) => {
    if (commonVerbs.has(w)) return true;
    if (w.endsWith('ed') && w.length > 4 && idx < spokenWords.length - 1) {
      return false;
    }
    if (w.endsWith('ed') && w.length > 4) return true;
    return false;
  });
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
// 🧠 BỘ QUÉT LỖI NGỮ PHÁP CHÍNH XÁC (KHÔNG BẮT OAN ALWAYS / CAN / I HAVE / I GO)
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
  const adverbs = ['usually', 'always', 'often', 'never', 'sometimes', 'rarely', 'seldom', 'really', 'just', 'still', 'very', 'so', 'quite', 'extremely'];
  const commonBaseVerbs = [
    'get', 'go', 'do', 'have', 'play', 'like', 'want', 'come', 'eat', 'sleep', 'make', 'take',
    'drink', 'listen', 'see', 'watch', 'work', 'live', 'need', 'know', 'think', 'feel', 'try',
    'use', 'find', 'give', 'tell', 'call', 'ask', 'seem', 'leave', 'put', 'mean', 'keep', 'let',
    'begin', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'run', 'move', 'believe', 'bring',
    'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
    'set', 'learn', 'change', 'lead', 'understand', 'speak', 'read', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull'
  ];

  const hasExplicitPastTimeMarker =
    /\b(yesterday|ago|last\s+night|last\s+week|last\s+month|last\s+year|earlier|this\s+morning)\b/.test(lowerTranscript);

  const isHypotheticalOrFutureSpeech =
    /\b(if\s+i\s+had|would\s+be|dream\s+job|in\s+the\s+future|want\s+to\s+be)\b/.test(lowerTranscript);

  const isPastIncidentContext =
    !isHypotheticalOrFutureSpeech &&
    (hasExplicitPastTimeMarker ||
      lowerPrompt.includes('hôm qua') ||
      lowerPrompt.includes('để quên') ||
      lowerPrompt.includes('mất đồ') ||
      lowerPrompt.includes('bị mất') ||
      lowerPrompt.includes('làm rơi') ||
      lowerPrompt.includes('tai nạn'));

  const isClothingJacketContext =
    lowerPrompt.includes('áo khoác') ||
    lowerPrompt.includes('jacket') ||
    lowerPrompt.includes('coat') ||
    lowerPrompt.includes('kích cỡ');

  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const countNumbers = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many', 'several'];
  const irregularPluralMap: Record<string, string> = {
    'friend': 'friends', 'member': 'members', 'person': 'people', 'year': 'years',
    'day': 'days', 'book': 'books', 'child': 'children', 'student': 'students',
    'hour': 'hours', 'woman': 'women', 'man': 'men', 'computer': 'computers',
    'product': 'products', 'device': 'devices', 'solution': 'solutions', 'problem': 'problems'
  };

  const uncountablePluralsMap: Record<string, { fix: string; note: string }> = {
    'informations': { fix: 'information', note: '"Information" là danh từ không đếm được, không thêm -s.' },
    'equipments': { fix: 'equipment', note: '"Equipment" là danh từ không đếm được, không thêm -s.' },
    'advices': { fix: 'advice', note: '"Advice" là danh từ không đếm được, không thêm -s.' },
    'homeworks': { fix: 'homework', note: '"Homework" là danh từ không đếm được, không thêm -s.' },
    'softwares': { fix: 'software', note: '"Software" là danh từ không đếm được, không thêm -s.' },
    'hardwares': { fix: 'hardware', note: '"Hardware" là danh từ không đếm được, không thêm -s.' },
    'staffs': { fix: 'staff', note: '"Staff" (đội ngũ nhân viên) là danh từ tập hợp không thêm -s.' },
    'furnitures': { fix: 'furniture', note: '"Furniture" là danh từ không đếm được, không thêm -s.' },
    'knowledges': { fix: 'knowledge', note: '"Knowledge" là danh từ không đếm được, không thêm -s.' },
    'traffics': { fix: 'traffic', note: '"Traffic" là danh từ không đếm được, không thêm -s.' },
    'moneys': { fix: 'money', note: '"Money" là danh từ không đếm được, không thêm -s.' },
    'datas': { fix: 'data', note: '"Data" đã ở dạng số nhiều / không đếm được, không thêm -s.' },
  };

  const standaloneAdjectives = new Set([
    'expensive', 'cheap', 'good', 'bad', 'busy', 'happy', 'sad', 'tired', 'difficult',
    'easy', 'important', 'useful', 'helpful', 'convenient', 'fast', 'slow', 'accurate',
    'crowded', 'noisy', 'quiet', 'dangerous', 'safe', 'hungry', 'thirsty', 'angry', 'late', 'early'
  ]);

  const wrongPastParticiples: Record<string, string> = {
    'went': 'gone', 'saw': 'seen', 'took': 'taken', 'did': 'done',
    'broke': 'broken', 'wrote': 'written', 'spoke': 'spoken', 'ate': 'eaten',
    'gave': 'given', 'forgot': 'forgotten', 'chose': 'chosen', 'fell': 'fallen',
    'knew': 'known', 'grew': 'grown', 'threw': 'thrown', 'flew': 'flown',
    'store': 'stored', 'solve': 'solved', 'update': 'updated', 'check': 'checked'
  };

  const singularCountableNounsNeedingArticle = new Set([
    'account', 'website', 'app', 'application', 'order', 'card', 'ticket', 'hotel',
    'restaurant', 'store', 'shop', 'product', 'item', 'book', 'movie', 'car', 'bike'
  ]);

  const compoundHeadNouns = new Set([
    'games', 'game', 'settings', 'details', 'information', 'data', 'history', 'services',
    'reviews', 'prices', 'options', 'features', 'items', 'products', 'tickets', 'orders',
    'cards', 'websites', 'apps', 'stores', 'shops', 'books', 'movies', 'cars', 'bikes'
  ]);

  const sentences = lowerTranscript.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const doubleConjunctionIndices = new Set<number>();
  let runningIdx = 0;
  sentences.forEach((sent) => {
    const sWords = sent.replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
    const hasAltInSent = sWords.includes('although') || sWords.includes('though');
    const becausePos = sWords.indexOf('because');
    sWords.forEach((w, idxInSent) => {
      if (hasAltInSent && w === 'but') {
        doubleConjunctionIndices.add(runningIdx + idxInSent);
      }
      if (becausePos !== -1 && idxInSent > becausePos && w === 'so') {
        doubleConjunctionIndices.add(runningIdx + idxInSent);
      }
    });
    runningIdx += sWords.length;
  });

  for (let i = 0; i < spokenWords.length; i++) {
    const curr = spokenWords[i];
    const prev = i > 0 ? spokenWords[i - 1] : '';
    const prevTwo = i > 1 ? spokenWords[i - 2] : '';
    const next = i < spokenWords.length - 1 ? spokenWords[i + 1] : '';

    if (curr === 'sometime' && (i === 0 || ['the', 'i', 'we', 'you', 'he', 'she', 'it', 'they', 'my'].includes(next))) {
      addError(i, curr, 'Sometimes', 'Lỗi dùng từ: Khi mang nghĩa "thỉnh thoảng" đứng đầu mệnh đề, phải dùng "Sometimes" (có -s), không dùng "Sometime".');
    }

    if (curr === 'the' && ['go', 'goes', 'went'].includes(prev)) {
      addError(i, curr, 'to the', 'Thiếu giới từ chỉ hướng: Sau động từ "go" cần dùng "go TO the..." (không nói "go the...").');
    }

    if (commonBaseVerbs.includes(curr) && ['want', 'wants', 'wanted', 'need', 'needs', 'needed', 'decide', 'decided', 'try', 'tried', 'plan', 'planned', 'hope', 'hoped'].includes(prev)) {
      addError(i, curr, `to ${curr}`, `Thiếu "to" giữa hai động từ: Sau "${prev}" phải dùng động từ nguyên mẫu có "to" ("${prev} to ${curr}").`);
    }

    if (
      singularCountableNounsNeedingArticle.has(curr) &&
      ['open', 'create', 'make', 'buy', 'choose', 'use', 'visit', 'find', 'book', 'order', 'have'].includes(prev) &&
      !compoundHeadNouns.has(next)
    ) {
      const art = vowels.includes(curr[0]) ? 'an' : 'a';
      addError(i, curr, `${art} ${curr}`, `Thiếu mạo từ: Trước danh từ đếm được số ít "${curr}" cần có mạo từ "${art}" ("${prev} ${art} ${curr}").`);
    }

    if (curr === 'shopping' && next === 'cart' && ['in', 'into'].includes(prev)) {
      addError(i, curr, 'the shopping', 'Thiếu mạo từ: Trước cụm danh từ đếm được "shopping cart" cần dùng "in THE shopping cart" hoặc "in MY shopping cart".');
    }

    if (uncountablePluralsMap[curr]) {
      addError(i, curr, uncountablePluralsMap[curr].fix, `Lỗi danh từ không đếm được: ${uncountablePluralsMap[curr].note}`);
    }
    if (curr === 'works' && ['are', 'is', 'for'].includes(prev)) {
      addError(i, curr, 'for work', 'Lỗi danh từ không đếm được: Khi chỉ mục đích công việc, dùng "for work" (không chia "are works").');
    }
    if (curr === 'uses' && prev === 'personal') {
      addError(i, curr, 'use', 'Lỗi danh từ không đếm được: Cụm cố định là "for personal use" (không thêm -s).');
    }

    if (standaloneAdjectives.has(curr) && ['i', 'he', 'she', 'it', 'we', 'you', 'they', 'this', 'that'].includes(prev)) {
      const beFix = prev === 'i' ? 'am' : (['he', 'she', 'it', 'this', 'that'].includes(prev) ? 'is' : 'are');
      addError(i, curr, `${beFix} ${curr}`, `Thiếu động từ to-be: Sau "${prev}" cần thêm "${beFix}" trước tính từ "${curr}".`);
    }
    if (standaloneAdjectives.has(curr) && ['very', 'so', 'really', 'too', 'quite', 'extremely'].includes(prev) && ['i', 'he', 'she', 'it', 'we', 'you', 'they', 'this', 'that'].includes(prevTwo)) {
      const beFix = prevTwo === 'i' ? 'am' : (['he', 'she', 'it', 'this', 'that'].includes(prevTwo) ? 'is' : 'are');
      addError(i - 1, prev, `${beFix} ${prev}`, `Thiếu động từ to-be: Sau "${prevTwo}" cần thêm "${beFix}" ("${prevTwo} ${beFix} ${prev} ${curr}").`);
    }

    if (curr === 'to' && ['money', 'time'].includes(prev) && ['spend', 'spends', 'spent', 'spending'].includes(prevTwo)) {
      addError(i, curr, 'on', 'Cấu trúc chuẩn là "spend money/time ON something" (không dùng "to").');
    }
    if (['in', 'of'].includes(curr) && ['depend', 'depends', 'depended', 'depending'].includes(prev)) {
      addError(i, curr, 'on', 'Động từ "depend" đi với giới từ "on" ("depend on").');
    }
    if (curr === 'about' && prev === 'interested') {
      addError(i, curr, 'in', 'Cấu trúc chuẩn là "interested IN something" (không dùng "about").');
    }
    if (curr === 'in' && prev === 'good' && next && !['the', 'a', 'my', 'morning', 'afternoon', 'evening'].includes(next)) {
      addError(i, curr, 'at', 'Khi nói giỏi về kỹ năng/lĩnh vực nào đó, dùng "good AT" (không dùng "good in").');
    }
    if (curr === 'about' && ['discuss', 'discusses', 'discussed', 'discussing'].includes(prev)) {
      addError(i, curr, '(bỏ "about")', 'Ngoại động từ "discuss" đi trực tiếp với tân ngữ, không dùng giới từ "about".');
    }
    if (curr === 'to' && ['enjoy', 'enjoys', 'enjoyed', 'avoid', 'avoids', 'suggest', 'suggests', 'recommend', 'recommends', 'finish', 'finished', 'mind'].includes(prev)) {
      addError(i, curr, 'V-ing', `Sau động từ "${prev}" phải dùng danh động từ V-ing (không dùng "to V").`);
    }

    if (curr === 'boring' && ['am', 'is', 'are', 'was', 'were', 'feel', 'felt'].includes(prev) && ['i', 'he', 'she', 'we', 'they', 'you', 'students', 'customers'].includes(prevTwo)) {
      addError(i, curr, 'bored', 'Diễn tả cảm xúc của người phải dùng tính từ đuôi -ed ("bored"), "boring" dùng cho vật/sự việc.');
    }
    if (curr === 'interested' && ['is', 'was', 'seems', 'looks'].includes(prev) && ['it', 'this', 'that', 'movie', 'book', 'website', 'app', 'product', 'game', 'job'].includes(prevTwo)) {
      addError(i, curr, 'interesting', 'Miêu tả tính chất của sự vật/sự việc phải dùng tính từ đuôi -ing ("interesting").');
    }

    if (doubleConjunctionIndices.has(i)) {
      const fixLabel = curr === 'but' ? '(bỏ "but")' : '(bỏ "so")';
      addError(i, curr, fixLabel, 'Lỗi lặp liên từ trong cùng một câu: Không dùng cặp "Although...but" hoặc "Because...so".');
    }

    if (isClothingJacketContext && ['chicken', 'chickens', 'check', 'checking'].includes(curr)) {
      addError(
        i,
        curr,
        'jacket /ˈdʒæk.ɪt/',
        `Lỗi phát âm từ khóa: Bạn phát âm từ "jacket" (/dʒæk.ɪt/ - phụ âm hữu thanh /dʒ/ + nguyên âm bẹt /æ/) bị lệch thành "${curr}".`
      );
    }
    if (curr === 'stuff' && ['change', 'train', 'hire', 'manage'].includes(prev) && (lowerPrompt.includes('store') || lowerPrompt.includes('shop') || lowerPrompt.includes('bookstore') || lowerPrompt.includes('recommend'))) {
      addError(i, curr, 'staff /stɑːf/', 'Lỗi phát âm phân biệt: "staff" (/stɑːf/ - nhân viên) khác với "stuff" (/stʌf/ - đồ đạc).');
    }

    if ((curr === "don't" || curr === 'dont') && singularThirdPersons.includes(prev)) {
      addError(i, curr, "doesn't", `Ngôi thứ 3 số ít ("${prev}") phải dùng trợ động từ "doesn't".`);
    }

    if (commonBaseVerbs.includes(curr)) {
      if (singularThirdPersons.includes(prev)) {
        const correctForm = getThirdPersonForm(curr);
        addError(i, curr, correctForm, `Lỗi chia động từ ngôi thứ 3 số ít: Sau "${prev}", động từ "${curr}" phải thêm -s/-es thành "${correctForm}".`);
      } else if (singularThirdPersons.includes(prevTwo) && adverbs.includes(prev)) {
        const correctForm = getThirdPersonForm(curr);
        addError(i, curr, correctForm, `Lỗi chia động từ ngôi thứ 3 số ít: Sau "${prevTwo} ${prev}", động từ "${curr}" phải chia thành "${correctForm}".`);
      }
    }

    if ((prev === "doesn't" || prev === 'doesnt') && (curr.endsWith('s') || curr.endsWith('es')) && curr.length > 3) {
      addError(i, curr, curr.replace(/(es|s)$/, ''), `Sau trợ động từ "doesn't", động từ phải để nguyên mẫu.`);
    }
    const pastIrregulars = ['went', 'came', 'bought', 'saw', 'got', 'took', 'had', 'ate', 'made', 'left', 'lost', 'forgot'];
    if ((prev === "didn't" || prev === 'didnt') && (curr.endsWith('ed') || pastIrregulars.includes(curr))) {
      addError(i, curr, 'V-infinitive', `Sau trợ động từ "didn't", động từ phải để nguyên mẫu.`);
    }

    if (curr === 'a' && next && vowels.includes(next[0]) && !['university', 'uniform', 'useful', 'user', 'european'].includes(next)) {
      addError(i, curr, 'an', `Trước từ bắt đầu bằng nguyên âm "${next}" phải dùng mạo từ "an".`);
    }
    if (curr === 'an' && next && !vowels.includes(next[0]) && !['hour', 'honest', 'honor'].includes(next)) {
      addError(i, curr, 'a', `Trước từ bắt đầu bằng phụ âm "${next}" phải dùng mạo từ "a".`);
    }

    if (countNumbers.includes(curr) && irregularPluralMap[next]) {
      addError(i + 1, next, irregularPluralMap[next], `Sau "${curr}", danh từ phải chia số nhiều là "${irregularPluralMap[next]}".`);
    }

    if (!isFreeSpeechMode && targetCleanWords.length > 0 && !['i', 'you', 'we', 'they'].includes(prev)) {
      const expected3rd = getThirdPersonForm(curr);
      const expectedPast = curr.endsWith('e') ? `${curr}d` : `${curr}ed`;
      if (targetCleanWords.includes(expected3rd) && !targetCleanWords.includes(curr)) {
        addError(i, curr, expected3rd, `Phát âm thiếu âm cuối -s/-es: Câu mẫu là "${expected3rd}".`);
      } else if (targetCleanWords.includes(expectedPast) && !targetCleanWords.includes(curr)) {
        addError(i, curr, expectedPast, `Phát âm thiếu đuôi quá khứ -ed: Câu mẫu là "${expectedPast}".`);
      }
    }

    if (curr === 'will' && ['when', 'while', 'before', 'after', 'until'].includes(prevTwo)) {
      const suggestedFix = isPastIncidentContext ? 'went / V2' : 'bỏ "will" (chia hiện tại đơn)';
      addError(i, curr, suggestedFix, `Mệnh đề thời gian sau "${prevTwo}" không dùng "will".`);
    }

    if (isPastIncidentContext && ['am', 'is', 'are'].includes(curr) && ['while', 'when'].includes(prevTwo) && next.endsWith('ing')) {
      const pastBe = curr === 'are' ? 'were' : 'was';
      addError(i, curr, pastBe, `Hành động đang diễn ra trong quá khứ sau "${prevTwo}" phải dùng Quá khứ tiếp diễn ("${pastBe} ${next}").`);
    }

    if (isPastIncidentContext && ['i', 'we', 'you', 'he', 'she', 'they'].includes(prev)) {
      const presentToPastMap: Record<string, string> = {
        'buy': 'bought', 'leave': 'left', 'forget': 'forgot', 'lose': 'lost',
        'go': 'went', 'come': 'came', 'see': 'saw', 'take': 'took',
        'make': 'made', 'get': 'got', 'eat': 'ate', 'drink': 'drank',
        'give': 'gave', 'find': 'found', 'tell': 'told', 'meet': 'met',
        'send': 'sent', 'spend': 'spent', 'wear': 'wore', 'drop': 'dropped',
        'miss': 'missed', 'break': 'broke', 'do': 'did', 'have': 'had'
      };
      if (presentToPastMap[curr]) {
        const isCurrentNowClause = ['now', 'today', 'currently'].includes(prevTwo);
        if (!isCurrentNowClause) {
          addError(
            i,
            curr,
            presentToPastMap[curr],
            `Sự việc đã xảy ra trong quá khứ (có dấu hiệu thời gian quá khứ), động từ "${curr}" phải chia quá khứ đơn là "${presentToPastMap[curr]}".`
          );
        }
      }
    }

    if (curr === 'would' && ['if', 'wish'].includes(prevTwo)) {
      addError(i, curr, 'had / V2', `Không dùng "would" ngay trong mệnh đề điều kiện "${prevTwo}"; dùng Quá khứ đơn (loại 2) hoặc Quá khứ hoàn thành "had + V3" (loại 3).`);
    }
    // Chỉ kiểm tra phân từ V3 ngay sau trợ động từ have/has/had (bỏ qua nếu có trạng từ như "always" ở giữa)
    if (['had', 'have', 'has'].includes(prev) && !adverbs.includes(curr) && wrongPastParticiples[curr]) {
      addError(i, curr, wrongPastParticiples[curr], `Sau "${prev}" (thì Hoàn thành / Câu điều kiện loại 3), động từ phải dùng quá khứ phân từ V3 là "${wrongPastParticiples[curr]}".`);
    }
    if (prevTwo === 'would' && prev === 'have' && wrongPastParticiples[curr]) {
      addError(i, curr, wrongPastParticiples[curr], `Cấu trúc điều kiện loại 3 chuẩn là "would have + V3/ed" ("would have ${wrongPastParticiples[curr]}").`);
    }
    if (prevTwo === 'had' && ['i', 'he', 'she', 'it', 'we', 'they', 'you'].includes(prev) && wrongPastParticiples[curr]) {
      addError(i, curr, wrongPastParticiples[curr], `Đảo ngữ câu điều kiện loại 3 ("Had + S + V3") phải dùng phân từ "${wrongPastParticiples[curr]}".`);
    }
    if (prev === 'be' && ['can', 'could', 'should', 'must', 'will', 'would', 'may', 'might'].includes(prevTwo) && wrongPastParticiples[curr]) {
      addError(i, curr, wrongPastParticiples[curr], `Cấu trúc bị động với động từ khuyết thiếu phải dùng phân từ V3 ("${prevTwo} be ${wrongPastParticiples[curr]}").`);
    }
    if (['must', 'should', 'might', 'could'].includes(prev) && pastIrregulars.includes(curr)) {
      addError(i, curr, `have + V3`, `Suy đoán/phê bình quá khứ sau "${prev}" phải dùng "have + V3/ed" (không dùng trực tiếp quá khứ đơn "${curr}").`);
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
- Focus on core accuracy: Present Simple (including 3rd-person singular -s/-es), Past Simple for completed past actions/incidents (e.g. "I bought a jacket yesterday", "I left my bag"), verb "to be" before adjectives, basic prepositions ("go to the", "spend money on", "interested in"), infinitive "to" ("want to buy"), and articles (a/an/the).
- Catch mispronounced target nouns that turn into unrelated words in context (e.g., "chicken" instead of "jacket", "test debate" instead of "teddy bear", "taxi" instead of "taxes").`;
    case 'B1':
    case 'B2':
      return `CEFR ${cefrLevel} (Intermediate / Upper-Intermediate):
- Evaluate both foundational accuracy (uncountable nouns like "information", "equipment", "for work", "personal use"; missing prepositions/articles like "go the website", "open account", "want buy", "in shopping cart"; no double conjunctions within the SAME clause like "although...but" or "because...so"; "Sometime" vs "Sometimes"; -ed vs -ing adjectives) AND intermediate structures: Past Continuous vs. Past Simple, Present Perfect ("I have always loved..."), Conditional Type 1 & Type 2 ("If I had a chance..., it would be..."), Passive Voice, Relative Clauses (who/which/that), and Modal Verbs of ability/possibility ("I can have a chance to visit...").
- Recognize Conditional Type 2 ("If I had..., it would be..."), Present Perfect ("I've always loved..."), and modal "can" ("I can have a chance...") as 100% VALID grammar—NEVER flag them as wrong tense!`;
    case 'C1':
    case 'C2':
    default:
      return `CEFR ${cefrLevel} (Advanced / Proficiency):
- Evaluate sophisticated syntactic range across 8 advanced pillars:
  1. Conditional Type 3 & Mixed Conditionals ("If he had studied..., he would have passed...").
  2. Negative & Conditional Inversion ("Not only does it save...", "Had I known...", "Were we to implement...").
  3. Advanced Passive Voice ("It is widely believed that...", "could have been avoided").
  4. Non-defining & Prepositional Relative Clauses ("in which", ", which...").
  5. Participle Clauses & Parallelism ("Having upgraded...", consistent parallel verb forms).
  6. Subjunctive Mood ("It is vital/essential that S + bare infinitive").
  7. Cleft Sentences & Noun Clauses ("What matters most is...", "It is ... that...").
  8. Past Modals of Deduction ("must have + V3", "should have + V3").
- Explicitly reward accurate use of these advanced structures in "advanced_structures_used" and NEVER misclassify Conditional Type 2/3, Inversion, Subjunctive, or Past Perfect as errors.
- If a ${cefrLevel} speaker ONLY uses elementary simple sentences without any complex clauses, cap grammar_score at 68 and advise upgrading sentence complexity in feedback_vi.`;
  }
}

// =========================================================================
// 🤖 TẦNG 2: GỌI LLM ĐÁNH GIÁ ĐA NHÀ CUNG CẤP (XOAY VÒNG GROQ -> GEMINI FALLBACK)
// =========================================================================
async function callMultiProviderEvaluator(
  groqKeys: string[],
  geminiApiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 650
): Promise<any | null> {
  const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  for (const apiKey of groqKeys) {
    for (const modelName of groqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            temperature: 0.1,
            max_tokens: maxTokens,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawContent = data.choices?.[0]?.message?.content || '{}';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }

        if (res.status === 429 || res.status >= 500) {
          console.warn(`Groq LLM (${modelName}) hit HTTP ${res.status}, switching key/model...`);
          break;
        }
      } catch (err) {
        console.warn(`Groq LLM (${modelName}) exception, switching...`, err);
        break;
      }
    }
  }

  if (geminiApiKey) {
    const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    for (const gModel of geminiModels) {
      try {
        const gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              contents: [
                {
                  parts: [{ text: userPrompt }]
                }
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: maxTokens,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (gRes.ok) {
          const gData = await gRes.json();
          const rawContent = gData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      } catch (gErr) {
        console.warn(`Gemini LLM (${gModel}) fallback error:`, gErr);
      }
    }
  }

  return null;
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
        message: '⚠️ Hệ thống đang nhận quá nhiều bài nộp từ cùng một mạng. Vui lòng chờ vài giây rồi thử lại!'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '15',
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  try {
    const groqKeys = getGroqKeyPool();
    const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (groqKeys.length === 0 && !geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Chưa cấu hình GROQ_API_KEY / GROQ_API_KEYS hoặc GEMINI_API_KEY trên Vercel' }),
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

    const mimeType = audioFile.type && audioFile.type.startsWith('audio/') ? audioFile.type : 'audio/webm';
    let audioBase64 = '';
    if (geminiApiKey && typeof audioFile.arrayBuffer === 'function') {
      try {
        const buf = await audioFile.arrayBuffer();
        audioBase64 = arrayBufferToBase64(buf);
      } catch {
        audioBase64 = '';
      }
    }

    const sttMeta = await transcribeAudioWithFallback(audioFile, audioBase64, mimeType, groqKeys, geminiApiKey);
    const { transcript, avgLogprob, providerUsed } = sttMeta;

    if (!transcript) {
      return new Response(
        JSON.stringify({
          score: 0,
          transcript: "(Không phát hiện giọng nói)",
          feedback: "❌ Không nhận diện được âm thanh phát âm! Vui lòng bấm làm lại và nói to, rõ ràng hơn.",
          isWin: false,
          errorWords: [],
          wordAnalysis: [],
          phonemeAnalysis: null,
          criteria: null,
          provider: providerUsed
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const phonemeAudit = await analyzePhonemeLevelFromAudio(
      audioBase64,
      mimeType,
      transcript,
      targetPrompt,
      cefrLevel,
      geminiApiKey
    );

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

    const mergePhonemeErrorsIntoList = (baseList: DetectedGrammarError[]): DetectedGrammarError[] => {
      const merged = [...baseList];
      if (phonemeAudit && phonemeAudit.phonemeErrors.length > 0) {
        phonemeAudit.phonemeErrors.forEach((pErr) => {
          const cleanTok = pErr.word.toLowerCase().replace(/[^a-z0-9']/g, '');
          const foundIdx = spokenWords.findIndex(
            (w, idx) => w === cleanTok && !merged.some((e) => e.wordIndex === idx)
          );
          if (foundIdx !== -1) {
            merged.push({
              wordIndex: foundIdx,
              word: spokenWords[foundIdx],
              correction: `${pErr.word} ${pErr.expectedIpa}`,
              reason: `Lỗi âm vị (${pErr.issueType}): ${pErr.reasonVi}`
            });
          }
        });
      }
      return merged;
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
          const lexicalPron = Math.min(100, Math.round(ratio * 85 + acousticQualityBonus));
          calculatedScore = phonemeAudit
            ? Math.round(lexicalPron * 0.55 + phonemeAudit.phonemeAccuracyScore * 0.45)
            : lexicalPron;
          feedback = `Phát âm chuẩn xác ${matchedCount}/${targetWords.length} từ mục tiêu.` +
            (phonemeAudit?.ipaFeedbackSummary ? ` ${phonemeAudit.ipaFeedbackSummary}` : '');
        }
      }

      const s1Errors = mergePhonemeErrorsIntoList([]);
      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: feedback,
          isWin: calculatedScore >= 70,
          errorWords: s1Errors,
          wordAnalysis: buildWordAnalysisArray(transcript, s1Errors),
          phonemeAnalysis: phonemeAudit,
          provider: providerUsed,
          criteria: {
            pronunciation: calculatedScore,
            intonation: 85,
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
      const s3LexicalPron = Math.min(100, Math.round(accuracyRatio * 90 + acousticQualityBonus));
      const s3FinalPron = phonemeAudit
        ? Math.round(s3LexicalPron * 0.55 + phonemeAudit.phonemeAccuracyScore * 0.45)
        : s3LexicalPron;
      const s3Errors = mergePhonemeErrorsIntoList([]);

      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: feedback + (phonemeAudit?.ipaFeedbackSummary ? ` ${phonemeAudit.ipaFeedbackSummary}` : ''),
          isWin: calculatedScore >= 70,
          errorWords: s3Errors,
          wordAnalysis: buildWordAnalysisArray(transcript, s3Errors),
          phonemeAnalysis: phonemeAudit,
          provider: providerUsed,
          criteria: {
            pronunciation: s3FinalPron,
            intonation: prosodyBoost,
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
    // ⚡ NHÁNH 3: TRẠM 4 - SPEAKING EXPRESS (PHẢN XẠ ĐỘC THOẠI + ÂM VỊ HỌC)
    // =========================================================================
    } else if (stationType === 'STATION_4') {
      const diagnostics = analyzeSpeechDiagnostics(spokenWords, targetPrompt, sttMeta, cefrLevel);
      const wordCount = diagnostics.effectiveWordCount;
      const hallucinationPhrases = ['thank you', 'thanks for watching', 'subtitles by', 'bye', 'goodbye'];
      const isHallucination = wordCount <= 2 && hallucinationPhrases.some(h => transcript.toLowerCase().includes(h));

      if (isHallucination || wordCount < 3) {
        calculatedScore = Math.max(20, wordCount * 8);
        feedback = `⚠️ Phản hồi quá ngắn (${wordCount} từ thực nghĩa). Hãy đưa ra câu trả lời trực diện cho tình huống!`;
        return new Response(
          JSON.stringify({
            score: calculatedScore,
            transcript: transcript,
            feedback: feedback,
            isWin: false,
            errorWords: [],
            wordAnalysis: [],
            phonemeAnalysis: phonemeAudit,
            provider: providerUsed,
            criteria: { pronunciation: 30, intonation: 30, vocabulary: 30, grammar: 30, fluency: 30, content: 20 }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const topicCheck = evaluateTopicRelevance(transcript, targetPrompt);
      const prosodyEval = evaluateProsodyScore(studentPitchData, referencePitchData);
      const hasMainVerbS4 = hasSentenceMainVerb(diagnostics.effectiveWords);

      let baseFluency = Math.min(95, Math.max(30, wordCount * 4));
      if (diagnostics.wpm !== null) {
        if (diagnostics.wpm >= diagnostics.wpmBenchmark.idealLow && diagnostics.wpm <= diagnostics.wpmBenchmark.idealHigh) {
          baseFluency = Math.min(96, baseFluency + 6);
        } else if (diagnostics.isTooSlow) {
          baseFluency = Math.max(35, baseFluency - 14);
        }
      }
      if (diagnostics.hasLongPause) baseFluency = Math.max(35, baseFluency - 10);
      if (diagnostics.disfluencyRatio > 0.12) {
        baseFluency = Math.max(32, baseFluency - Math.round(diagnostics.disfluencyRatio * 60));
      }

      let basePronunciation = Math.min(100, Math.max(65, 76 + acousticQualityBonus * 1.5));
      if (phonemeAudit) {
        basePronunciation = Math.round(basePronunciation * 0.45 + phonemeAudit.phonemeAccuracyScore * 0.55);
      }
      if (diagnostics.isMumbledOrNoisy) {
        basePronunciation = Math.min(48, basePronunciation);
      }

      let grammarScore = hasMainVerbS4 ? 82 : 48;
      let vocabScore = wordCount < 8
        ? Math.min(40, wordCount * 5)
        : Math.min(95, Math.round(diagnostics.ttrScore * 0.88 + diagnostics.academicConnectorCount * 4));
      let contentScore = wordCount < 8 ? Math.min(35, wordCount * 4) : topicCheck.relevanceScore;
      let intonationScore = prosodyEval.score;

      let errorWordsList: DetectedGrammarError[] = scanComprehensiveGrammarErrors(
        spokenWords,
        transcript.toLowerCase(),
        targetPrompt.toLowerCase(),
        true,
        []
      );
      let dynamicFeedback = '';
      let isOffTopicFinal = topicCheck.isOffTopic;

      const parsed = await callMultiProviderEvaluator(
        groqKeys,
        geminiApiKey,
        `You are an expert Cambridge/IELTS speaking examiner evaluating a CEFR ${cefrLevel} student on a speaking prompt.
${getCefrGrammarRubricInstruction(cefrLevel)}
CRITICAL CHECKS:
1. Evaluate semantic relevance against the prompt topic/scenario ("${targetPrompt}"), accepting personal examples, specific professions/jobs (flight attendant, photographer, cleaner, etc.), online ticket/service booking as valid online product purchases, and synonyms. NEVER penalize the student for using different examples from any Reference English Sample. Only set "is_off_topic": true if the student speaks about a completely unrelated subject.
2. Catch ALL spoken errors (uncountable plurals like "are works"/"personal uses", missing "to be", wrong prepositions/articles like "go the website"/"open account"/"want buy", double conjunctions within the SAME clause, "Sometime" instead of "Sometimes", wrong tenses, and C1-C2 advanced structure errors).
3. Detect contextually nonsensical words caused by mispronunciation (e.g. saying "test debate" instead of "teddy bear" in a shopping story, or "taxi" instead of "taxes") and flag them in "detected_errors".
4. If the response is only a short fragment without a main verb or under 8 words, keep "content_score" <= 35 and "grammar_score" <= 50.
5. For every mistake in "detected_errors", set "word" to the EXACT single offending word from the transcript.
Return JSON ONLY:
{
  "vocab_score": number,
  "grammar_score": number,
  "content_score": number,
  "is_off_topic": boolean,
  "advanced_structures_used": ["e.g. Conditional Type 2"],
  "detected_errors": [
    { "word": "exact_single_wrong_word", "correction": "better_word", "reason": "Lý do bằng tiếng Việt chỉ rõ lỗi ngữ pháp/phát âm" }
  ],
  "feedback_vi": "Nhận xét sư phạm tiếng Việt sắc bén 1-2 câu"
}`,
        `Prompt: "${targetPrompt}"\nStudent (${wordCount} effective words, WPM: ${diagnostics.wpm ?? 'N/A'}, fillers: ${diagnostics.fillerCount}): "${transcript}"`,
        480
      );

      if (parsed) {
        if (typeof parsed.is_off_topic === 'boolean') {
          isOffTopicFinal = parsed.is_off_topic;
        }
        if (typeof parsed.vocab_score === 'number') {
          vocabScore = isOffTopicFinal ? Math.min(25, parsed.vocab_score) : Math.round((parsed.vocab_score + vocabScore) / 2);
        }
        if (typeof parsed.grammar_score === 'number') grammarScore = parsed.grammar_score;
        if (typeof parsed.content_score === 'number') {
          contentScore = isOffTopicFinal ? Math.min(20, parsed.content_score) : parsed.content_score;
        }
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

      if (isOffTopicFinal || diagnostics.isParroting) {
        vocabScore = Math.min(25, vocabScore);
        contentScore = Math.min(20, contentScore);
      }

      // Tính điểm phạt tỷ lệ theo độ dài bài nói (bài dài được thưởng độ triển khai ý, không bị cộng dồn phạt oan)
      const effectiveErrorPenalty = Math.min(28, Math.round((errorWordsList.length / Math.max(15, wordCount)) * 120));
      const finalGrammar = Math.max(35, grammarScore - effectiveErrorPenalty);
      const mergedDisplayErrors = mergePhonemeErrorsIntoList(errorWordsList);
      const finalPronunciation = mergedDisplayErrors.length > 0
        ? Math.max(45, basePronunciation - Math.min(16, Math.round((mergedDisplayErrors.length / Math.max(15, wordCount)) * 75)))
        : basePronunciation;

      calculatedScore = Math.max(
        20,
        Math.min(
          98,
          Math.round(
            finalPronunciation * 0.20 +
            intonationScore * 0.20 +
            baseFluency * 0.15 +
            vocabScore * 0.15 +
            finalGrammar * 0.15 +
            contentScore * 0.15
          )
        )
      );

      if (isOffTopicFinal) {
        calculatedScore = Math.min(42, calculatedScore);
      } else if (diagnostics.isParroting) {
        calculatedScore = Math.min(45, calculatedScore);
      } else if (wordCount < 8 || !hasMainVerbS4) {
        calculatedScore = Math.min(38, calculatedScore);
      } else if (wordCount < 14) {
        calculatedScore = Math.min(55, calculatedScore);
      }

      if (!dynamicFeedback) {
        if (diagnostics.isParroting) {
          dynamicFeedback = diagnostics.diagnosticNotes[0];
        } else if (isOffTopicFinal) {
          dynamicFeedback = topicCheck.feedbackNote || '⚠️ SAI LỆCH CHỦ ĐỀ: Nội dung nói không khớp với đề bài yêu cầu. Điểm Phát âm và Ngữ điệu vẫn được ghi nhận nhưng điểm Nội dung & Từ vựng bị trừ nặng.';
        } else if (wordCount < 8 || !hasMainVerbS4) {
          dynamicFeedback = `⚠️ Câu trả lời quá ngắn (${wordCount} từ thực nghĩa) hoặc chưa có động từ chính hoàn chỉnh. Hãy nói thành câu đầy đủ chủ - vị và triển khai thêm ý nhé!`;
        } else if (errorWordsList.length > 0) {
          const firstErr = errorWordsList[0];
          dynamicFeedback = `Phản xạ tốt, tuy nhiên cần chú ý sửa "${firstErr.word}" ➔ "${firstErr.correction}" để câu trả lời chuẩn ngữ pháp hơn!`;
        } else if (calculatedScore >= 80) {
          dynamicFeedback = `🚀 Phản xạ siêu nhanh và tự nhiên! Câu trả lời trúng trọng tâm tình huống [${cefrLevel}].`;
        } else {
          dynamicFeedback = `👌 Phản hồi đạt yêu cầu cơ bản, hãy cố gắng mở rộng thêm chi tiết đúng chủ đề để nâng cao điểm số.`;
        }
      }

      if (phonemeAudit?.ipaFeedbackSummary && !isOffTopicFinal) {
        dynamicFeedback = `${dynamicFeedback} 🔬 Âm vị IPA: ${phonemeAudit.ipaFeedbackSummary}`;
      }
      if (diagnostics.diagnosticNotes.length > 0 && !diagnostics.isParroting) {
        dynamicFeedback = `${dynamicFeedback} (${diagnostics.diagnosticNotes.slice(0, 2).join(' ')})`;
      }

      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: dynamicFeedback,
          isWin: calculatedScore >= 70 && !isOffTopicFinal && !diagnostics.isParroting,
          isOffTopic: isOffTopicFinal,
          isParroting: diagnostics.isParroting,
          speechMetrics: {
            wpm: diagnostics.wpm,
            effectiveWordCount: wordCount,
            fillerCount: diagnostics.fillerCount,
            ttrScore: diagnostics.ttrScore,
          },
          errorWords: mergedDisplayErrors,
          wordAnalysis: buildWordAnalysisArray(transcript, mergedDisplayErrors),
          phonemeAnalysis: phonemeAudit,
          provider: providerUsed,
          criteria: {
            pronunciation: finalPronunciation,
            intonation: intonationScore,
            vocabulary: vocabScore,
            grammar: finalGrammar,
            fluency: baseFluency,
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
    // 🎭 NHÁNH 4: TRẠM 2 - VOCABULARY & REFLEX ARENA (TÍCH HỢP ÂM VỊ HỌC + CEFR WPM)
    // =========================================================================
    } else {
      const diagnostics = analyzeSpeechDiagnostics(spokenWords, targetPrompt, sttMeta, cefrLevel);
      const wordCount = diagnostics.effectiveWordCount;
      const hallucinationPhrases = ['thank you', 'thanks for watching', 'subtitles by', 'bye', 'goodbye'];
      const isHallucination = wordCount <= 3 && hallucinationPhrases.some(h => transcript.toLowerCase().includes(h));

      if (isHallucination || wordCount < 4) {
        calculatedScore = Math.max(15, wordCount * 6);
        feedback = `⚠️ Bài nói quá ngắn (${wordCount} từ thực nghĩa${diagnostics.fillerCount > 0 ? `, loại trừ ${diagnostics.fillerCount} từ đệm uh/um` : ''}). Hãy đối thoại hoàn chỉnh câu để AI có thể đánh giá!`;
        return new Response(
          JSON.stringify({
            score: calculatedScore,
            transcript: transcript,
            feedback: feedback,
            isWin: false,
            errorWords: [],
            wordAnalysis: [],
            phonemeAnalysis: phonemeAudit,
            provider: providerUsed,
            criteria: { pronunciation: 30, intonation: 30, vocabulary: 30, grammar: 30, fluency: 30, content: 20 }
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

      const topicCheck = evaluateTopicRelevance(transcript, targetPrompt);
      const prosodyEval = evaluateProsodyScore(studentPitchData, referencePitchData);

      let errorWordsList: DetectedGrammarError[] = scanComprehensiveGrammarErrors(
        spokenWords,
        lowerTranscript,
        lowerPrompt,
        isFreeSpeechMode,
        targetCleanWords
      );
      let dynamicFeedback = '';
      let advancedStructuresUsed: string[] = [];
      let isCompletelyOffTopic = topicCheck.isOffTopic;

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

      if (isHabitualPrompt && !hasHypotheticalClause && !isCompletelyOffTopic) {
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

      const lastWord = diagnostics.effectiveWords[diagnostics.effectiveWords.length - 1]?.toLowerCase() || '';
      const incompleteEndings = [
        'my', 'your', 'his', 'her', 'their', 'our', 'the', 'a', 'an',
        'parents', 'mother', 'father', 'brother', 'sister', 'friend',
        'and', 'or', 'but', 'because', 'so', 'although', 'with', 'to', 'at', 'in', 'of', 'for'
      ];
      
      const isIncompleteSentence = wordCount < 15 && incompleteEndings.includes(lastWord);
      const hasMainVerb = hasSentenceMainVerb(diagnostics.effectiveWords);

      if (isIncompleteSentence && !errorWordsList.some(e => e.wordIndex === spokenWords.length - 1)) {
        errorWordsList.push({
          wordIndex: spokenWords.length - 1,
          word: lastWord,
          correction: `${lastWord} ... [cần hoàn thành vị ngữ]`,
          reason: `Câu nói bị ngắt cụt ở từ "${lastWord}". Hãy hoàn thành trọn vẹn câu!`
        });
      } else if (wordCount < 10 && !hasMainVerb && !errorWordsList.some(e => e.wordIndex === spokenWords.length - 1)) {
        errorWordsList.push({
          wordIndex: spokenWords.length - 1,
          word: lastWord,
          correction: `${lastWord} [thiếu chủ ngữ & động từ]`,
          reason: `Câu nói chỉ là cụm từ rời rạc (${wordCount} từ), chưa có động từ chính để tạo thành câu hoàn chỉnh.`
        });
      }

      const hasNoErrors = errorWordsList.length === 0;

      let pronunciationScore = hasNoErrors
        ? Math.min(100, Math.max(72, 76 + acousticQualityBonus * 1.5))
        : Math.max(55, 76 + acousticQualityBonus - Math.min(16, Math.round((errorWordsList.length / Math.max(15, wordCount)) * 75)));
      if (phonemeAudit) {
        pronunciationScore = Math.round(pronunciationScore * 0.45 + phonemeAudit.phonemeAccuracyScore * 0.55);
      }
      if (diagnostics.isMumbledOrNoisy) {
        pronunciationScore = Math.min(48, pronunciationScore);
      }

      let intonationScore = prosodyEval.score;

      let baseGrammar: number;
      let baseVocab: number;
      let baseContent: number;
      let baseFluency: number;

      // Mức phạt ngữ pháp tính theo tỷ lệ mật độ lỗi / tổng số từ (bài nói dài triển khai nhiều ý được cộng điểm)
      const proportionalGrammarDeduction = Math.min(35, Math.round((errorWordsList.length / Math.max(15, wordCount)) * 140));

      if (isCompletelyOffTopic || diagnostics.isParroting) {
        baseContent = 15;
        baseVocab = 20;
        baseGrammar = hasNoErrors ? 90 : Math.max(50, 82 - proportionalGrammarDeduction);
        baseFluency = Math.min(90, Math.max(70, 72 + Math.min(15, Math.floor(wordCount / 3))));
      } else if (wordCount < 8 || isIncompleteSentence || !hasMainVerb) {
        baseContent = Math.min(28, wordCount * 4);
        baseVocab = Math.min(35, wordCount * 5);
        baseFluency = Math.min(30, wordCount * 4);
        baseGrammar = !hasMainVerb ? 45 : (hasNoErrors ? 60 : Math.max(25, 52 - proportionalGrammarDeduction));
      } else if (wordCount < 14) {
        baseContent = Math.min(55, wordCount * 4);
        baseVocab = Math.min(62, Math.round(diagnostics.ttrScore * 0.65));
        baseFluency = Math.min(58, wordCount * 4 + 4);
        baseGrammar = hasNoErrors ? 78 : Math.max(35, 70 - proportionalGrammarDeduction);
      } else if (wordCount < 20) {
        baseContent = hasNoErrors ? topicCheck.relevanceScore : Math.min(76, topicCheck.relevanceScore);
        baseGrammar = hasNoErrors ? 86 : Math.max(45, 78 - proportionalGrammarDeduction);
        baseVocab = Math.min(90, Math.max(62, Math.round(diagnostics.ttrScore * 0.85 + diagnostics.academicConnectorCount * 3)));
        baseFluency = hasNoErrors ? 80 : 72;
      } else {
        const hasConnectors = ['and', 'so', 'because', 'but', 'also', 'although', 'however', 'when', 'while', 'if', 'had'].some(c => lowerTranscript.includes(c));
        const lengthExpansionBonus = wordCount >= 40 ? 8 : (wordCount >= 28 ? 5 : 2);
        baseContent = hasNoErrors
          ? Math.min(98, Math.max(topicCheck.relevanceScore, 86 + lengthExpansionBonus))
          : Math.max(76, topicCheck.relevanceScore);
        baseGrammar = hasNoErrors
          ? Math.min(96, 90 + Math.min(5, lengthExpansionBonus))
          : Math.max(52, 82 - proportionalGrammarDeduction);
        baseVocab = Math.min(96, Math.max(68, Math.round(diagnostics.ttrScore * 0.90 + diagnostics.academicConnectorCount * 4 + (wordCount >= 35 ? 4 : 0))));
        baseFluency = Math.min(96, Math.max(74, 76 + lengthExpansionBonus * 2 + (hasConnectors ? 5 : 0)));
      }

      if (diagnostics.wpm !== null) {
        if (diagnostics.wpm >= diagnostics.wpmBenchmark.idealLow && diagnostics.wpm <= diagnostics.wpmBenchmark.idealHigh && wordCount >= 12) {
          baseFluency = Math.min(98, baseFluency + 5);
        } else if (diagnostics.isTooSlow) {
          baseFluency = Math.max(32, baseFluency - 14);
        }
      }
      if (diagnostics.hasLongPause) {
        baseFluency = Math.max(32, baseFluency - 10);
      }
      if (diagnostics.disfluencyRatio > 0.12) {
        baseFluency = Math.max(30, baseFluency - Math.round(diagnostics.disfluencyRatio * 65));
      }

      let grammarScore = baseGrammar;
      let vocabScore = baseVocab;
      let contentScore = baseContent;
      let fluencyScore = baseFluency;

      const parsed = await callMultiProviderEvaluator(
        groqKeys,
        geminiApiKey,
        `You are a strict, authoritative Cambridge & IELTS Speaking Examiner evaluating a CEFR ${cefrLevel} student.
Target Prompt/Context: "${targetPrompt}".

${getCefrGrammarRubricInstruction(cefrLevel)}

CRITICAL EVALUATION RULES (10 FOUNDATIONAL PILLARS A1–B2 + 8 ADVANCED PILLARS C1–C2 + FLEXIBLE TOPIC RELEVANCE):
1. TOPIC RELEVANCE CHECK (FLEXIBLE & REALISTIC):
   - Evaluate semantic relevance against the main Scenario/Topic ONLY.
   - If Mode is FREE_SPEECH, NEVER penalize the student for using different personal examples than the "Reference English Sample" (e.g. if the sample mentions specific jobs/products and the student talks about being a flight attendant, photographer, cleaner, buying tech products, or booking e-tickets/flights online, that IS relevant -> set "is_off_topic": false!).
   - Accept synonyms and natural paraphrases (e.g., proposing "solutions" for a business case study when asked for "recommendations" -> "is_off_topic": false).
   - ONLY set "is_off_topic": true, "content_score": 15, and "vocab_score": 20 if the student recites a completely unrelated memorized speech OR merely parrots/repeats the prompt question word-for-word.
2. SHORT / FRAGMENT PENALTY & LENGTH REWARD:
   - If the student speaks fewer than 8 effective words or utters a sentence fragment without a subject/main verb, keep "content_score" <= 30, "vocab_score" <= 35, and "grammar_score" <= 50!
   - Conversely, reward well-developed answers (30+ words) that explain clear reasons and contrasts ("On the other hand...") with strong content and fluency scores.
3. NEVER auto-correct or overlook spoken grammar/tense/ending/mispronunciation mistakes in the student's verbatim transcript.
4. Check EVERY clause systematically across ALL 10 foundational & 8 advanced rules and report ALL real errors in "detected_errors":
   - Missing prepositions & articles ("go the shopping website" -> "go to the", "open account" -> "open an account", "want buy" -> "want to buy", "in shopping cart" -> "in the shopping cart"). Do NOT flag compound noun phrases like "buy card games" or "open account settings".
   - Uncountable nouns wrongly pluralized ("are works" -> "are for work", "personal uses" -> "personal use", "informations", "equipments", "advices", "softwares").
   - Missing "to be" before adjectives ("It very expensive" -> "It is very expensive").
   - Wrong prepositions & verb patterns ("spend money to" -> "on", "depend in/of" -> "on", "interested about" -> "in", "good in" -> "at", "discuss about" -> "discuss", "enjoy/suggest to V" -> "V-ing").
   - -ed vs -ing adjectives ("I am boring with" -> "bored", "website is interested" -> "interesting").
   - Double conjunctions ONLY within the SAME sentence ("Although ... but", "Because ... so"). NEVER flag "so" starting a NEW sentence after a period!
   - Frequency adverbs ("Sometime I had to..." -> "Sometimes").
   - Contextual mispronunciations that produce wrong words in context ("chicken" instead of "jacket", "change stuff" instead of "train staff", "fly attendant" instead of "flight attendant", "taxi" instead of "taxes").
   - Basic (A1–A2): 3rd-person singular "-s/-es", wrong verb tense with past markers, articles ("a/an"), plural nouns. NEVER flag "I have", "I go", "I do", "I can", "I've always loved", or "If I had..., it would be..." as errors!
   - Intermediate (B1–B2): No "will" inside time clauses, Past Continuous with "while" in past stories.
   - Advanced (C1–C2): Conditionals Type 3 & Mixed, Negative/Conditional Inversion ("Not only does...", "Had I known..."), Advanced Passive Voice, Prepositional/Reduced Relative Clauses, Participle Clauses & Parallelism, Subjunctive Mood ("vital that S + bare V"), Cleft Sentences, Past Modals ("must/should have + V3").
5. IMPORTANT UI MAPPING RULE FOR "detected_errors":
   - Set "word" to the EXACT SINGLE offending word from the transcript so the UI highlights that exact word chip in RED!

Return JSON ONLY:
{
  "vocab_score": number,
  "grammar_score": number,
  "content_score": number,
  "is_off_topic": boolean,
  "advanced_structures_used": ["string"],
  "detected_errors": [
    { "word": "exact_single_wrong_word_from_transcript", "correction": "correct_form", "reason": "Giải thích quy tắc ngữ pháp/phát âm bằng tiếng Việt ngắn gọn, rõ ràng" }
  ],
  "feedback_vi": "Nhận xét tiếng Việt 1-2 câu chỉ rõ độ khớp chủ đề, gợi ý mở rộng thực tế và các lỗi bị tô đỏ cần sửa"
}`,
        `CEFR Level: ${cefrLevel}\nScenario & Reference: "${targetPrompt || 'General speaking context'}"\nStudent verbatim transcript (${wordCount} effective words, WPM: ${diagnostics.wpm ?? 'N/A'}, fillers: ${diagnostics.fillerCount}, TTR: ${diagnostics.ttrScore}%): "${transcript}"`,
        650
      );

      if (parsed) {
        if (typeof parsed.is_off_topic === 'boolean') {
          isCompletelyOffTopic = parsed.is_off_topic;
        }
        if (typeof parsed.content_score === 'number') {
          contentScore = (isCompletelyOffTopic || diagnostics.isParroting)
            ? Math.min(18, parsed.content_score)
            : Math.min(parsed.content_score, wordCount < 8 ? 30 : 100);
        }
        if (typeof parsed.grammar_score === 'number') {
          grammarScore = (errorWordsList.length === 0 && hasMainVerb && wordCount >= 8)
            ? parsed.grammar_score
            : Math.min(parsed.grammar_score, baseGrammar);
        }
        if (typeof parsed.vocab_score === 'number') {
          vocabScore = (isCompletelyOffTopic || diagnostics.isParroting)
            ? Math.min(22, parsed.vocab_score)
            : Math.min(Math.round((parsed.vocab_score + baseVocab) / 2), wordCount < 8 ? 35 : 100);
        }
        if (Array.isArray(parsed.advanced_structures_used)) {
          advancedStructuresUsed = parsed.advanced_structures_used.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
        }
        
        if (Array.isArray(parsed.detected_errors) && parsed.detected_errors.length > 0) {
          parsed.detected_errors.forEach((err: any) => {
            if (err.word) {
              const singleTok = String(err.word).trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9']/g, '');
              const foundIdx = spokenWords.findIndex(
                (w, idx) => w === singleTok && !errorWordsList.some((e) => e.wordIndex === idx)
              );
              if (foundIdx !== -1) {
                errorWordsList.push({
                  wordIndex: foundIdx,
                  word: spokenWords[foundIdx],
                  correction: err.correction || '',
                  reason: err.reason || 'Lỗi ngữ pháp / phát âm từ khóa.'
                });
              } else if (!errorWordsList.some((e) => e.word.toLowerCase() === singleTok)) {
                errorWordsList.push({
                  word: err.word,
                  correction: err.correction || '',
                  reason: err.reason || 'Lỗi ngữ pháp / phát âm từ khóa.'
                });
              }
            }
          });
        }

        if (parsed.feedback_vi && parsed.feedback_vi.length > 15) {
          dynamicFeedback = parsed.feedback_vi;
        }
      }

      if (isCompletelyOffTopic || diagnostics.isParroting) {
        contentScore = Math.min(18, contentScore);
        vocabScore = Math.min(22, vocabScore);
      }

      const cappedGrammar = errorWordsList.length > 0
        ? Math.min(grammarScore, Math.max(40, 86 - proportionalGrammarDeduction))
        : grammarScore;

      const mergedDisplayErrors = mergePhonemeErrorsIntoList(errorWordsList);
      const cappedPronunciation = mergedDisplayErrors.length > 0
        ? Math.min(pronunciationScore, Math.max(48, 88 - Math.min(16, Math.round((mergedDisplayErrors.length / Math.max(15, wordCount)) * 75))))
        : pronunciationScore;

      calculatedScore = Math.max(
        20,
        Math.min(
          98,
          Math.round(
            cappedPronunciation * 0.20 +
            intonationScore * 0.20 +
            fluencyScore * 0.15 +
            vocabScore * 0.15 +
            cappedGrammar * 0.15 +
            contentScore * 0.15
          )
        )
      );

      if (isCompletelyOffTopic) {
        calculatedScore = Math.min(42, calculatedScore);
      } else if (diagnostics.isParroting) {
        calculatedScore = Math.min(45, calculatedScore);
      } else if (wordCount < 8 || isIncompleteSentence || !hasMainVerb) {
        calculatedScore = Math.min(38, calculatedScore);
      } else if (wordCount < 14) {
        calculatedScore = Math.min(55, calculatedScore);
      }

      if (!dynamicFeedback) {
        const advNote = advancedStructuresUsed.length > 0
          ? ` Điểm cộng cho việc vận dụng cấu trúc nâng cao (${advancedStructuresUsed.join(', ')}).`
          : '';

        if (diagnostics.isParroting) {
          dynamicFeedback = diagnostics.diagnosticNotes[0];
        } else if (isCompletelyOffTopic) {
          dynamicFeedback = topicCheck.feedbackNote || `⚠️ SAI LỆCH CHỦ ĐỀ: Nội dung bài nói không khớp với yêu cầu đề bài. Điểm Phát âm (${cappedPronunciation}/100) và Ngữ điệu (${intonationScore}/100) vẫn được ghi nhận, nhưng điểm Nội dung & Từ vựng bị trừ nặng.`;
        } else if (!hasMainVerb && wordCount < 10) {
          dynamicFeedback = `⚠️ Bài nói quá ngắn (${wordCount} từ thực nghĩa) và mới chỉ là cụm từ rời rạc chưa có chủ ngữ – động từ chính. Hãy nói thành câu hoàn chỉnh và nêu rõ ví dụ cụ thể!`;
        } else if (errorWordsList.length > 0) {
          const summaryErrors = errorWordsList
            .slice(0, 3)
            .map((e) => `"${e.word}" ➔ "${e.correction}"`)
            .join(', ');
          dynamicFeedback = `⚠️ Phát hiện ${errorWordsList.length} lỗi ngữ pháp/dùng từ (đã tô đỏ): ${summaryErrors}. ${errorWordsList[0].reason}${advNote}`;
        } else if (isIncompleteSentence) {
          dynamicFeedback = `⚠️ Câu nói bị ngắt cụt ở cuối ("${lastWord}"). Hãy hoàn thành trọn vẹn ý của câu để AI chấm điểm chính xác hơn nhé!`;
        } else if (wordCount < 14) {
          dynamicFeedback = `💡 Bài nói hơi ngắn (${wordCount} từ thực nghĩa). Hãy mở rộng thêm ý và dẫn chứng cụ thể để đạt chuẩn nhé!`;
        } else if (calculatedScore >= 85) {
          dynamicFeedback = `🌟 Xuất sắc! Bạn diễn đạt rất tự nhiên, phát âm chuẩn xác, ngữ điệu tự nhiên và bám sát chủ đề.${advNote}`;
        } else {
          dynamicFeedback = `👍 Bài nói mạch lạc và đúng trọng tâm.${advNote} Hãy tiếp tục phát huy nhé!`;
        }
      }

      if (phonemeAudit?.ipaFeedbackSummary && !isCompletelyOffTopic) {
        dynamicFeedback = `${dynamicFeedback} 🔬 Âm vị IPA: ${phonemeAudit.ipaFeedbackSummary}`;
      }
      if (diagnostics.diagnosticNotes.length > 0 && !diagnostics.isParroting) {
        dynamicFeedback = `${dynamicFeedback} (${diagnostics.diagnosticNotes.slice(0, 2).join(' ')})`;
      }

      const wordAnalysis = buildWordAnalysisArray(transcript, mergedDisplayErrors);

      return new Response(
        JSON.stringify({
          score: calculatedScore,
          transcript: transcript,
          feedback: dynamicFeedback,
          isWin: calculatedScore >= 70 && !isCompletelyOffTopic && !diagnostics.isParroting,
          isOffTopic: isCompletelyOffTopic,
          isParroting: diagnostics.isParroting,
          speechMetrics: {
            wpm: diagnostics.wpm,
            effectiveWordCount: wordCount,
            fillerCount: diagnostics.fillerCount,
            ttrScore: diagnostics.ttrScore,
          },
          errorWords: mergedDisplayErrors,
          wordAnalysis: wordAnalysis,
          phonemeAnalysis: phonemeAudit,
          advancedStructures: advancedStructuresUsed,
          provider: providerUsed,
          criteria: {
            pronunciation: cappedPronunciation,
            intonation: intonationScore,
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
      JSON.stringify({ error: err.message || 'Lỗi xử lý chấm điểm Serverless' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}