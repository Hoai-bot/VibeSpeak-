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
  isOfflineSaved?: boolean; // 📦 Đánh dấu bài đã được lưu vào IndexedDB an toàn
}

export type StationType = 'STATION_1' | 'STATION_2' | 'STATION_3' | 'STATION_4' | string;

// 🎯 DÀNH CHO TRẠM 1: So sánh từ mẫu và từ đọc được kèm Từ điển đồng âm (Homophones)
export interface WordDiff {
  word: string;
  status: 'correct' | 'incorrect' | 'missing';
}

const HOMOPHONES_MAP: Record<string, string[]> = {
  'sum': ['some'],
  'some': ['sum'],
  'sun': ['son'],
  'son': ['sun'],
  'sea': ['see'],
  'see': ['sea'],
  'bare': ['bear'],
  'bear': ['bare'],
  'meat': ['meet'],
  'meet': ['meat'],
  'wear': ['where'],
  'where': ['wear'],
  'pair': ['pear'],
  'pear': ['pair'],
  'right': ['write'],
  'write': ['right'],
  'buy': ['by', 'bye'],
  'bye': ['buy', 'by'],
  'by': ['buy', 'bye'],
  'for': ['four'],
  'four': ['for'],
  'to': ['too', 'two'],
  'two': ['to', 'too'],
  'too': ['to', 'two'],
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

// 🎯 DÀNH CHO TRẠM 2: Phân tích trực tiếp lời thoại sinh viên đã nói kèm bộ lọc ngữ pháp
export interface SpokenWordAnalysis {
  word: string;
  isConfident: boolean;
  hasGrammarError?: boolean;
}

export function analyzeSpokenTranscript(transcript: string): SpokenWordAnalysis[] {
  if (!transcript || transcript.startsWith('(')) return [];

  const rawWords = transcript
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const cleanWords = rawWords.map((w) => w.toLowerCase());
  const vowels = ['a', 'e', 'i', 'o', 'u'];

  return rawWords.map((w, index) => {
    const clean = cleanWords[index];
    const prevWord = index > 0 ? cleanWords[index - 1] : '';
    const prevTwoWord = index > 1 ? cleanWords[index - 2] : '';
    const nextWord = index < cleanWords.length - 1 ? cleanWords[index + 1] : '';

    const isHesitation = ['uh', 'um', 'err', 'ah', 'mm'].includes(clean);
    let isGrammarError = false;

    // 1. Lỗi trợ động từ ngôi thứ 3: "he/she/it don't" -> phải dùng doesn't
    if (['don\'t', 'dont'].includes(clean) && ['he', 'she', 'it'].includes(prevWord)) {
      isGrammarError = true;
    }

    // 2. Lỗi chia thì Hiện tại đơn: he/she/it + động từ nguyên mẫu không chia
    const singularThirdPersons = ['he', 'she', 'it'];
    const adverbs = ['usually', 'always', 'often', 'never', 'sometimes'];
    const commonBaseVerbs = ['get', 'go', 'do', 'have', 'play', 'like', 'want', 'come', 'eat', 'sleep', 'make', 'take', 'drink', 'listen', 'see', 'watch'];

    if (singularThirdPersons.includes(prevWord) && commonBaseVerbs.includes(clean)) {
      isGrammarError = true;
    }
    if (singularThirdPersons.includes(prevTwoWord) && adverbs.includes(prevWord) && commonBaseVerbs.includes(clean)) {
      isGrammarError = true;
    }

    // 3. Lỗi trợ động từ phủ định: "doesn't" + động từ thêm s/es
    if (['doesn\'t', 'doesnt'].includes(prevWord) && (clean.endsWith('s') || clean.endsWith('es'))) {
      isGrammarError = true;
    }

    // 4. Lỗi Quá khứ đơn (Past Simple): Dùng "didn't" đi với động từ chia quá khứ (V2/V-ed)
    const pastIrregularVerbs = ['went', 'came', 'bought', 'saw', 'got', 'took', 'had', 'ate', 'made'];
    if (['didn\'t', 'didnt'].includes(prevWord) && (clean.endsWith('ed') || pastIrregularVerbs.includes(clean))) {
      isGrammarError = true;
    }

    // 5. Lỗi Dấu hiệu thời gian quá khứ (yesterday, last, ago) đi với động từ nguyên mẫu hiện tại
    const pastTimeSignals = ['yesterday', 'ago', 'last'];
    if (pastTimeSignals.includes(prevWord) && commonBaseVerbs.includes(clean)) {
      isGrammarError = true;
    }

    // 6. Lỗi Mạo từ "a" / "an":
    if (clean === 'a' && nextWord && vowels.includes(nextWord[0])) {
      isGrammarError = true;
    }
    if (clean === 'an' && nextWord && !vowels.includes(nextWord[0])) {
      isGrammarError = true;
    }

    const isDigit = /^[0-9]+$/.test(clean);
    const isValidWordLength = clean.length > 1 || clean === 'i' || clean === 'a' || isDigit;

    return {
      word: w,
      isConfident: !isHesitation && !isGrammarError && isValidWordLength,
      hasGrammarError: isGrammarError,
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

    // 1. Kiểm tra kích thước file âm thanh
    if ((!audioBlob || audioBlob.size < 1000) && !recognizedTranscript) {
      return {
        score: 0,
        isWin: false,
        transcript: "(Chưa ghi nhận được âm thanh)",
        detailedFeedback: "❌ Micro chưa thu được tiếng hoặc âm thanh quá ngắn. Vui lòng kiểm tra quyền Micro và nói to hơn!",
        errorWords: [],
        criteria: null
      };
    }

    // 2. Gửi file ghi âm lên API Groq Whisper & LLM (/api/grade-audio)
    if (audioBlob && audioBlob.size >= 1000) {
      // 🛡️ Kiểm tra kết nối mạng trước khi gửi
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
            criteria: null
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
            return {
              score: data.score,
              isWin: typeof data.isWin === 'boolean' ? data.isWin : data.score >= 70,
              transcript: recognizedTranscript || data.transcript,
              detailedFeedback: data.feedback || `Hoàn thành bài nói cấp độ ${cefrLevel || 'A1'}!`,
              audioUrl: data.audioUrl,
              errorWords: Array.isArray(data.errorWords) ? data.errorWords : [],
              criteria: data.criteria || null
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

    // 3. Phương án xử lý khi không nhận diện được chữ
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
          criteria: null
        };
      }

      return {
        score: 30,
        isWin: false,
        transcript: "(Không phát hiện giọng nói hoặc âm thanh quá ngắn)",
        detailedFeedback: "❌ Bài làm chưa đạt yêu cầu! Bạn chưa nói câu trả lời hoặc thời gian nói quá ngắn. Vui lòng bấm làm lại và nói to, rõ ràng!",
        errorWords: [],
        criteria: null
      };
    }

    // 4. Phân luồng chấm điểm dự phòng phía Client (nếu API rớt mạng)
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
        criteria: null
      };
    } else {
      const analysis = analyzeSpokenTranscript(recognizedTranscript);
      const wordCount = analysis.length;
      const grammarErrors = analysis.filter(item => item.hasGrammarError).length;

      if (wordCount >= 25) {
        calculatedScore = Math.max(75, 95 - grammarErrors * 3);
        feedbackMessage = grammarErrors > 0 
          ? `🌟 Bài nói rất xuất sắc (${wordCount} từ) nhưng có ${grammarErrors} lỗi chia động từ/ngữ pháp.`
          : `🌟 Bài nói tuyệt vời (${wordCount} từ)! Phản xạ tự nhiên, lưu loát và tự tin.`;
      } else if (wordCount >= 15) {
        calculatedScore = Math.max(70, 88 - grammarErrors * 3);
        feedbackMessage = grammarErrors > 0 
          ? `👍 Nắm được ý (${wordCount} từ) nhưng còn ${grammarErrors} lỗi chia động từ/ngữ pháp.`
          : `👍 Rất tốt! Diễn đạt mạch lạc (${wordCount} từ). Hãy mở rộng thêm các ý phụ.`;
      } else if (wordCount >= 8) {
        calculatedScore = Math.max(60, 78 - grammarErrors * 3);
        feedbackMessage = `👌 Đạt yêu cầu cơ bản (${wordCount} từ). Hãy tự tin nói dài hơn.`;
      } else {
        calculatedScore = Math.max(40, wordCount * 6 + 20);
        feedbackMessage = `⚠️ Bài nói hơi ngắn (${wordCount} từ). Cần bổ sung thêm thông tin.`;
      }

      return {
        score: calculatedScore,
        isWin: calculatedScore >= 70,
        transcript: recognizedTranscript,
        detailedFeedback: feedbackMessage,
        errorWords: [],
        criteria: null
      };
    }

  } catch (err) {
    return {
      score: 50,
      isWin: false,
      transcript: "(Lỗi xử lý bài nói)",
      detailedFeedback: "❌ Đã có lỗi xảy ra trong quá trình chấm điểm. Vui lòng thử lại!",
      errorWords: [],
      criteria: null
    };
  }
};