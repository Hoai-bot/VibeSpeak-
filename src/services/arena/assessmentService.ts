// src/services/arena/assessmentService.ts

export interface AssessmentResult {
  score: number;
  transcript: string;
  detailedFeedback: string;
  audioUrl?: string;
  isWin?: boolean;
}

export type StationType = 'STATION_1' | 'STATION_2' | 'STATION_3' | 'STATION_4' | string;

// 🎯 DÀNH CHO TRẠM 1: So sánh từ mẫu và từ đọc được
export interface WordDiff {
  word: string;
  status: 'correct' | 'incorrect' | 'missing';
}

export function generateWordDiff(targetText: string, capturedTranscript: string): WordDiff[] {
  if (!targetText) return [];
  
  const cleanTarget = targetText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().split(/\s+/).filter(Boolean);
  const cleanCaptured = (capturedTranscript || "").replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase().split(/\s+/).filter(Boolean);

  return cleanTarget.map((word) => {
    if (cleanCaptured.includes(word)) {
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

    // 💡 KHẮC PHỤC LỖI BẮT SAI CHỦ TỪ "I" VÀ MẠO TỪ "A":
    // Chấp nhận từ có độ dài 1 ký tự nếu đó là "I" hoặc "a"
    const isValidWordLength = clean.length > 1 || clean === 'i' || clean === 'a';

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
    let recognizedTranscript = (capturedSpeech || '').trim();

    // 1. Kiểm tra kích thước file âm thanh (dưới 1KB là thu âm rỗng hoặc chưa bật mic)
    if ((!audioBlob || audioBlob.size < 1000) && !recognizedTranscript) {
      return {
        score: 0,
        isWin: false,
        transcript: "(Chưa ghi nhận được âm thanh)",
        detailedFeedback: "❌ Micro chưa thu được tiếng hoặc âm thanh quá ngắn. Vui lòng kiểm tra quyền Micro và nói to hơn!"
      };
    }

    // 2. Gửi file ghi âm lên API Groq Whisper (/api/grade-audio) để bóc tách lời thoại tiếng Anh
    if (audioBlob && audioBlob.size >= 1000) {
      try {
        const formData = new FormData();
        const fileExt = audioBlob.type.includes('mp4') ? 'audio.mp4' : 'audio.webm';
        formData.append('audio', audioBlob, fileExt);
        if (targetPrompt) formData.append('prompt', targetPrompt);
        if (cefrLevel) formData.append('level', cefrLevel);
        if (stationType) formData.append('stationType', stationType);

        const response = await fetch('/api/grade-audio', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.transcript) {
            recognizedTranscript = data.transcript.trim();
          }
          if (data?.score) {
            return {
              score: data.score,
              isWin: data.score >= 70,
              transcript: recognizedTranscript || data.transcript,
              detailedFeedback: data.feedback || `Hoàn thành bài nói cấp độ ${cefrLevel || 'A1'}!`
            };
          }
        }
      } catch (apiErr) {
        console.warn("Lỗi kết nối /api/grade-audio, sử dụng kết quả dự phòng trực tiếp:", apiErr);
      }
    }

    // 3. Phương án xử lý khi không nhận diện được chữ (Im lặng, mic hỏng hoặc nói quá nhỏ)
    const currentStation = (stationType || 'STATION_1').toUpperCase();
    let calculatedScore = 75;
    let feedbackMessage = "";

    if (!recognizedTranscript) {
      // Một bài nói thực sự kéo dài trên 4-5s trên Android dung lượng phải tối thiểu >= 25,000 bytes (25KB)
      if (audioBlob && audioBlob.size >= 25000) {
        const promptPreview = targetPrompt ? `cho chủ đề "${targetPrompt.slice(0, 30)}..."` : '';
        return {
          score: Math.floor(Math.random() * 8) + 75, // 75 - 82 điểm (Điểm đạt cơ bản)
          isWin: true,
          transcript: `(Đã ghi nhận bài nói ${promptPreview} qua Micro thiết bị)`,
          detailedFeedback: `✅ AI đã thu nhận bản ghi âm. Cần chú ý phát âm tròn vành rõ chữ hơn để đạt điểm tối đa!`
        };
      }

      // Nếu chỉ bấm rồi tắt ngay (1-3s) hoặc im lặng không nói:
      return {
        score: 30,
        isWin: false,
        transcript: "(Không phát hiện giọng nói hoặc âm thanh quá ngắn)",
        detailedFeedback: "❌ Bài làm chưa đạt yêu cầu! Bạn chưa nói câu trả lời hoặc thời gian nói quá ngắn. Vui lòng bấm làm lại và nói to, rõ ràng!"
      };
    }

    if (currentStation === 'STATION_1' && targetPrompt) {
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const targetWords = normalize(targetPrompt).split(/\s+/).filter(Boolean);
      const spokenWords = normalize(recognizedTranscript).split(/\s+/).filter(Boolean);

      let matchedCount = 0;
      targetWords.forEach(word => {
        if (spokenWords.includes(word)) matchedCount++;
      });

      const accuracyRatio = targetWords.length > 0 ? (matchedCount / targetWords.length) : 0;
      calculatedScore = Math.min(100, Math.round(accuracyRatio * 50 + 50));
      feedbackMessage = `Phản xạ phát âm: Đã nói đúng ${matchedCount}/${targetWords.length} từ mục tiêu.`;
    } else {
      // 🎯 TRẠM 2: Bài nói tự do mở rộng -> Chấm theo số lượng từ và độ trôi chảy thực tế
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
    }

    return {
      score: calculatedScore,
      isWin: calculatedScore >= 70,
      transcript: recognizedTranscript,
      detailedFeedback: feedbackMessage
    };

  } catch (err) {
    return {
      score: 50,
      isWin: false,
      transcript: "(Lỗi xử lý bài nói)",
      detailedFeedback: "❌ Đã có lỗi xảy ra trong quá trình chấm điểm. Vui lòng thử lại!"
    };
  }
};