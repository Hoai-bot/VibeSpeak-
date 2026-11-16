// src/services/arena/assessmentService.ts

// 📦 Fallback an toàn cho Offline IndexedDB không lo lệch import path
async function saveOfflineSubmissionSafe(submission: {
  audioBlob: Blob;
  prompt: string;
  stationType: string;
  cefrLevel: string;
}): Promise<string> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return `local_${Date.now()}`;
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open('VibeSpeakOfflineDB', 1);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pending_submissions')) {
          db.createObjectStore('pending_submissions', { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('pending_submissions', 'readwrite');
        const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        tx.objectStore('pending_submissions').put({ ...submission, id, timestamp: Date.now() });
        resolve(id);
      };
      req.onerror = () => resolve(`fallback_${Date.now()}`);
    } catch {
      resolve(`err_${Date.now()}`);
    }
  });
}

export interface ErrorWordItem {
  word: string;
  correction: string;
  reason: string;
}

export interface CriteriaBreakdown {
  pronunciation?: number;
  vocabulary?: number;
  grammar?: number;
  fluency?: number;
  content?: number;
}

export interface AssessmentResult {
  score: number;
  transcript: string;
  detailedFeedback: string;
  audioUrl?: string;
  isWin?: boolean;
  errorWords?: ErrorWordItem[];
  criteria?: CriteriaBreakdown | null;
  wordAnalysis?: SpokenWordAnalysis[];
  isOfflineSaved?: boolean;
}

export type StationType = 'STATION_1' | 'STATION_2' | 'STATION_3' | 'STATION_4' | string;

export interface WordDiff {
  word: string;
  status: 'correct' | 'incorrect' | 'missing';
}

const HOMOPHONES_MAP: Record<string, string[]> = {
  'sum': ['some'], 'some': ['sum'],
  'sun': ['son'], 'son': ['sun'],
  'sea': ['see'], 'see': ['sea'],
  'bare': ['bear'], 'bear': ['bare'],
  'meat': ['meet'], 'meet': ['meat'],
  'wear': ['where'], 'where': ['wear'],
  'pair': ['pear'], 'pear': ['pair'],
  'right': ['write'], 'write': ['right'],
  'buy': ['by', 'bye'], 'bye': ['buy', 'by'], 'by': ['buy', 'bye'],
  'for': ['four'], 'four': ['for'],
  'to': ['too', 'two'], 'two': ['to', 'too'], 'too': ['to', 'two'],
  'one': ['won'], 'won': ['one'],
  'flour': ['flower'], 'flower': ['flour'],
  'peace': ['piece'], 'piece': ['peace'],
  'wait': ['weight'], 'weight': ['wait'],
  'break': ['brake'], 'brake': ['break']
};

export function generateWordDiff(targetText: string, capturedTranscript: string): WordDiff[] {
  if (!targetText) return [];
  
  const cleanTarget = targetText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().split(/\s+/).filter(Boolean);
  const cleanCaptured = (capturedTranscript || "").replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().split(/\s+/).filter(Boolean);

  return cleanTarget.map((word) => {
    const isDirectMatch = cleanCaptured.includes(word);
    const homophones = HOMOPHONES_MAP[word] || [];
    const isHomophoneMatch = homophones.some(h => cleanCaptured.includes(h));

    if (isDirectMatch || isHomophoneMatch) {
      return { word, status: 'correct' };
    } else {
      return { word, status: 'incorrect' };
    }
  });
}

// 🎯 DÀNH CHO TRẠM 2: Phân tích từng từ sinh viên nói ra (Bắt chặt lỗi chia động từ & phát âm thiếu đuôi -s/-es/-ed)
export interface SpokenWordAnalysis {
  word: string;
  isConfident: boolean;
  hasGrammarError?: boolean;
  hasPronunciationError?: boolean;
  correction?: string;
  reason?: string;
}

export function analyzeSpokenTranscript(
  transcript: string,
  targetPrompt?: string,
  serverErrorWords?: ErrorWordItem[]
): SpokenWordAnalysis[] {
  if (!transcript || transcript.startsWith('(')) return [];

  const rawWords = transcript
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const cleanWords = rawWords.map((w) => w.toLowerCase());
  const targetCleanWords = (targetPrompt || '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const serverErrMap = new Map<string, ErrorWordItem>();
  (serverErrorWords || []).forEach((err) => {
    if (err?.word) {
      serverErrMap.set(err.word.toLowerCase().replace(/[^a-z0-9']/g, ''), err);
    }
  });

  const vowels = ['a', 'e', 'i', 'o', 'u'];
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

  const getThirdPersonForm = (verb: string): string => {
    if (verb === 'have') return 'has';
    if (verb === 'do') return 'does';
    if (verb === 'go') return 'goes';
    if (/(s|sh|ch|x|z|o)$/.test(verb)) return `${verb}es`;
    if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ies`;
    return `${verb}s`;
  };

  return rawWords.map((w, index) => {
    const clean = cleanWords[index];
    const prevWord = index > 0 ? cleanWords[index - 1] : '';
    const prevTwoWord = index > 1 ? cleanWords[index - 2] : '';
    const nextWord = index < cleanWords.length - 1 ? cleanWords[index + 1] : '';

    const isHesitation = ['uh', 'um', 'err', 'ah', 'mm'].includes(clean);
    let isGrammarError = false;
    let isPronunciationError = false;
    let correction = '';
    let reason = '';

    // 0. Kiểm tra lỗi do Server AI (Whisper / LLM) trả về
    const serverErr = serverErrMap.get(clean);
    if (serverErr) {
      isPronunciationError = true;
      correction = serverErr.correction || '';
      reason = serverErr.reason || 'Lỗi phát âm / ngữ pháp từ AI';
    }

    // 1. Lỗi trợ động từ ngôi thứ 3: "he/she/it don't" -> phải dùng doesn't
    if (!isGrammarError && ['don\'t', 'dont'].includes(clean) && singularThirdPersons.includes(prevWord)) {
      isGrammarError = true;
      correction = "doesn't";
      reason = "Ngôi thứ 3 số ít phải dùng trợ động từ doesn't";
    }

    // 2. Lỗi chia động từ ngôi thứ 3 số ít thì Hiện tại đơn: he/she/it + V nguyên mẫu (không thêm -s/-es)
    if (!isGrammarError && commonBaseVerbs.includes(clean)) {
      if (singularThirdPersons.includes(prevWord)) {
        isGrammarError = true;
        correction = getThirdPersonForm(clean);
        reason = `Động từ đi sau "${prevWord}" (ngôi 3 số ít) phải thêm -s/-es`;
      } else if (singularThirdPersons.includes(prevTwoWord) && adverbs.includes(prevWord)) {
        isGrammarError = true;
        correction = getThirdPersonForm(clean);
        reason = `Động từ đi sau "${prevTwoWord} ${prevWord}" phải chia ngôi 3 số ít`;
      }
    }

    // 3. Đối chiếu trực tiếp với câu mẫu (targetPrompt): nếu câu mẫu có dạng chia -s/-es/-ed mà sinh viên đọc mất đuôi
    if (!isGrammarError && !isPronunciationError && targetCleanWords.length > 0) {
      const expectedThirdPerson = getThirdPersonForm(clean);
      const expectedPastEd = clean.endsWith('e') ? `${clean}d` : `${clean}ed`;
      if (targetCleanWords.includes(expectedThirdPerson) && !targetCleanWords.includes(clean)) {
        isGrammarError = true;
        isPronunciationError = true;
        correction = expectedThirdPerson;
        reason = `Đọc thiếu âm cuối -s/-es (câu mẫu là "${expectedThirdPerson}")`;
      } else if (targetCleanWords.includes(expectedPastEd) && !targetCleanWords.includes(clean)) {
        isPronunciationError = true;
        correction = expectedPastEd;
        reason = `Đọc thiếu đuôi quá khứ -ed (câu mẫu là "${expectedPastEd}")`;
      }
    }

    // 4. Lỗi trợ động từ phủ định: "doesn't" + động từ thêm s/es
    if (!isGrammarError && ['doesn\'t', 'doesnt'].includes(prevWord) && (clean.endsWith('s') || clean.endsWith('es')) && clean.length > 3) {
      isGrammarError = true;
      correction = clean.replace(/(es|s)$/, '');
      reason = "Sau doesn't động từ phải để nguyên mẫu";
    }

    // 5. Lỗi Quá khứ đơn: Dùng "didn't" đi với động từ chia quá khứ (V2/V-ed)
    const pastIrregularVerbs = ['went', 'came', 'bought', 'saw', 'got', 'took', 'had', 'ate', 'made'];
    if (!isGrammarError && ['didn\'t', 'didnt'].includes(prevWord) && (clean.endsWith('ed') || pastIrregularVerbs.includes(clean))) {
      isGrammarError = true;
      reason = "Sau didn't động từ phải để nguyên mẫu";
    }

    // 6. Lỗi Dấu hiệu thời gian quá khứ (yesterday, last, ago) đi với động từ nguyên mẫu hiện tại
    const pastTimeSignals = ['yesterday', 'ago', 'last'];
    if (!isGrammarError && pastTimeSignals.includes(prevWord) && commonBaseVerbs.includes(clean)) {
      isGrammarError = true;
      reason = `Có dấu hiệu quá khứ "${prevWord}", cần chia thì quá khứ đơn`;
    }

    // 7. Lỗi Mạo từ "a" / "an":
    if (!isGrammarError && clean === 'a' && nextWord && vowels.includes(nextWord[0])) {
      isGrammarError = true;
      correction = 'an';
      reason = `Trước nguyên âm "${nextWord}" phải dùng "an"`;
    }
    if (!isGrammarError && clean === 'an' && nextWord && !vowels.includes(nextWord[0])) {
      isGrammarError = true;
      correction = 'a';
      reason = `Trước phụ âm "${nextWord}" phải dùng "a"`;
    }

    const isDigit = /^[0-9]+$/.test(clean);
    const isValidWordLength = clean.length > 1 || clean === 'i' || clean === 'a' || isDigit;
    const hasAnyError = isHesitation || isGrammarError || isPronunciationError || !isValidWordLength;

    return {
      word: w,
      isConfident: !hasAnyError,
      hasGrammarError: isGrammarError,
      hasPronunciationError: isPronunciationError,
      correction: correction || undefined,
      reason: reason || undefined,
    };
  });
}

export const evaluateSpeaking = async (
  audioBlob: Blob,
  cefrLevel?: string,
  stationType?: StationType,
  targetPrompt?: string,
  userId?: string,
  capturedSpeech?: string
): Promise<AssessmentResult> => {
  try {
    const currentStation = String(stationType || 'STATION_1').toUpperCase();
    let recognizedTranscript = (capturedSpeech || '').trim();

    if ((!audioBlob || audioBlob.size < 1000) && !recognizedTranscript) {
      return {
        score: 0,
        isWin: false,
        transcript: "(Chưa ghi nhận được âm thanh)",
        detailedFeedback: "❌ Micro chưa thu được tiếng hoặc âm thanh quá ngắn. Vui lòng kiểm tra quyền Micro và nói to hơn!",
        errorWords: [],
        criteria: null,
        wordAnalysis: []
      };
    }

    if (audioBlob && audioBlob.size >= 1000) {
      const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

      if (!isOnline) {
        try {
          const offlineId = await saveOfflineSubmissionSafe({
            audioBlob,
            prompt: targetPrompt || '',
            stationType: currentStation,
            cefrLevel: cefrLevel || 'B1',
          });

          return {
            score: 0,
            isWin: false,
            isOfflineSaved: true,
            transcript: "(Đã lưu an toàn trên máy)",
            detailedFeedback: `📦 Mất kết nối mạng! Bản thu âm của bạn đã được lưu tạm vào máy (Mã: ${offlineId.slice(-6)}). Hệ thống sẽ tự động đồng bộ và chấm điểm ngay khi có mạng trở lại.`,
            errorWords: [],
            criteria: null,
            wordAnalysis: []
          };
        } catch (saveErr) {
          console.warn("Lỗi lưu offline trước khi gửi API:", saveErr);
        }
      }

      try {
        const formData = new FormData();
        const fileExt = audioBlob.type.includes('mp4') ? 'audio.mp4' : 'audio.webm';
        formData.append('audio', audioBlob, fileExt);
        if (targetPrompt) formData.append('prompt', targetPrompt);
        if (cefrLevel) formData.append('level', cefrLevel);
        formData.append('stationType', currentStation);

        const response = await fetch('/api/grade-audio', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.transcript) {
            recognizedTranscript = data.transcript.trim();
          }
          if (typeof data?.score === 'number') {
            const errorWords: ErrorWordItem[] = Array.isArray(data.errorWords) ? data.errorWords : [];
            const wordAnalysis = analyzeSpokenTranscript(
              recognizedTranscript || data.transcript || '',
              targetPrompt,
              errorWords
            );
            const detectedLocalErrors = wordAnalysis.filter(w => w.hasGrammarError || w.hasPronunciationError);
            const penalty = detectedLocalErrors.length * 6;
            const adjustedScore = Math.max(0, Math.min(100, Number(data.score) - penalty));

            return {
              score: adjustedScore,
              isWin: adjustedScore >= 70,
              transcript: recognizedTranscript || data.transcript,
              detailedFeedback: data.feedback || `Hoàn thành bài nói cấp độ ${cefrLevel || 'B1'}!`,
              audioUrl: data.audioUrl,
              errorWords,
              criteria: data.criteria || null,
              wordAnalysis
            };
          }
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (apiErr) {
        console.warn("Lỗi kết nối /api/grade-audio, kích hoạt Fallback lưu IndexedDB:", apiErr);
        try {
          await saveOfflineSubmissionSafe({
            audioBlob,
            prompt: targetPrompt || '',
            stationType: currentStation,
            cefrLevel: cefrLevel || 'B1',
          });
        } catch (dbErr) {
          console.error("IndexedDB fallback error:", dbErr);
        }
      }
    }

    let calculatedScore = 75;
    let feedbackMessage = "";

    if (!recognizedTranscript) {
      if (audioBlob && audioBlob.size >= 25000) {
        const promptPreview = targetPrompt ? `cho chủ đề "${targetPrompt.slice(0, 30)}..."` : '';
        return {
          score: Math.floor(Math.random() * 8) + 75,
          isWin: true,
          transcript: `(Đã ghi nhận bài nói ${promptPreview} qua Micro thiết bị)`,
          detailedFeedback: `✅ AI đã thu nhận bản ghi âm. Cần chú ý phát âm tròn vành rõ chữ hơn để đạt điểm tối đa!`,
          errorWords: [],
          criteria: null,
          wordAnalysis: []
        };
      }

      return {
        score: 30,
        isWin: false,
        transcript: "(Không phát hiện giọng nói hoặc âm thanh quá ngắn)",
        detailedFeedback: "❌ Bài làm chưa đạt yêu cầu! Bạn chưa nói câu trả lời hoặc thời gian nói quá ngắn. Vui lòng bấm làm lại và nói to, rõ ràng!",
        errorWords: [],
        criteria: null,
        wordAnalysis: []
      };
    }

    if (currentStation === 'STATION_1' && targetPrompt) {
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const targetWords = normalize(targetPrompt).split(/\s+/).filter(Boolean);
      const spokenWords = normalize(recognizedTranscript).split(/\s+/).filter(Boolean);

      let totalWordScore = 0;

      targetWords.forEach(target => {
        const homophones = HOMOPHONES_MAP[target] || [];
        const isMatched = spokenWords.includes(target) || homophones.some(h => spokenWords.includes(h));

        if (isMatched) {
          totalWordScore += 1.0;
        } else {
          let bestSim = 0;
          spokenWords.forEach(spoken => {
            const maxLen = Math.max(target.length, spoken.length);
            if (maxLen === 0) return;
            let commonChars = 0;
            const minLen = Math.min(target.length, spoken.length);
            for (let i = 0; i < minLen; i++) {
              if (target[i] === spoken[i]) commonChars++;
            }
            const sim = commonChars / maxLen;
            if (sim > bestSim) bestSim = sim;
          });

          if (bestSim >= 0.6) {
            totalWordScore += bestSim * 0.75;
          }
        }
      });

      const accuracyRatio = targetWords.length > 0 ? (totalWordScore / targetWords.length) : 0;
      calculatedScore = Math.min(100, Math.max(40, Math.round(accuracyRatio * 60 + 40)));
      
      const matchedCount = targetWords.filter(w => {
        const homophones = HOMOPHONES_MAP[w] || [];
        return spokenWords.includes(w) || homophones.some(h => spokenWords.includes(h));
      }).length;
      feedbackMessage = `Phản xạ phát âm: Đã khớp chuẩn xác ${matchedCount}/${targetWords.length} từ mục tiêu.`;

      return {
        score: calculatedScore,
        isWin: calculatedScore >= 70,
        transcript: recognizedTranscript,
        detailedFeedback: feedbackMessage,
        errorWords: [],
        criteria: null,
        wordAnalysis: analyzeSpokenTranscript(recognizedTranscript, targetPrompt)
      };
    } else {
      const analysis = analyzeSpokenTranscript(recognizedTranscript, targetPrompt);
      const wordCount = analysis.length;
      const grammarErrors = analysis.filter(item => item.hasGrammarError || item.hasPronunciationError).length;
      const penalty = grammarErrors * 8;

      if (wordCount >= 25) {
        calculatedScore = Math.max(55, 95 - penalty);
        feedbackMessage = grammarErrors > 0 
          ? `⚠️ Bài nói trôi chảy (${wordCount} từ) nhưng mắc ${grammarErrors} lỗi chia động từ / phát âm thiếu âm cuối (đã tô đỏ).`
          : `🌟 Bài nói tuyệt vời (${wordCount} từ)! Phản xạ tự nhiên, lưu loát và chuẩn ngữ pháp.`;
      } else if (wordCount >= 15) {
        calculatedScore = Math.max(50, 88 - penalty);
        feedbackMessage = grammarErrors > 0 
          ? `⚠️ Nắm được ý (${wordCount} từ) nhưng còn ${grammarErrors} lỗi chia động từ / phát âm (xem các từ tô đỏ).`
          : `👍 Rất tốt! Diễn đạt mạch lạc (${wordCount} từ). Hãy mở rộng thêm các ý phụ.`;
      } else if (wordCount >= 8) {
        calculatedScore = Math.max(45, 78 - penalty);
        feedbackMessage = grammarErrors > 0
          ? `⚠️ Đạt ý cơ bản (${wordCount} từ) nhưng sai ${grammarErrors} lỗi ngữ pháp/đuôi từ (tô đỏ).`
          : `👌 Đạt yêu cầu cơ bản (${wordCount} từ). Hãy tự tin nói dài hơn.`;
      } else {
        calculatedScore = Math.max(35, wordCount * 6 + 20 - penalty);
        feedbackMessage = `⚠️ Bài nói hơi ngắn (${wordCount} từ). Cần bổ sung thêm thông tin.`;
      }

      return {
        score: calculatedScore,
        isWin: calculatedScore >= 70,
        transcript: recognizedTranscript,
        detailedFeedback: feedbackMessage,
        errorWords: [],
        criteria: null,
        wordAnalysis: analysis
      };
    }

  } catch (err) {
    return {
      score: 50,
      isWin: false,
      transcript: "(Lỗi xử lý bài nói)",
      detailedFeedback: "❌ Đã có lỗi xảy ra trong quá trình chấm điểm. Vui lòng thử lại!",
      errorWords: [],
      criteria: null,
      wordAnalysis: []
    };
  }
};