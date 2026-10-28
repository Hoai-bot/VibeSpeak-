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

// 🎯 DÀNH CHO TRẠM 2: Phân tích trực tiếp lời thoại sinh viên đã nói
export interface SpokenWordAnalysis {
  word: string;
  isConfident: boolean;
}

export function analyzeSpokenTranscript(transcript: string): SpokenWordAnalysis[] {
  if (!transcript || transcript.startsWith('(')) return [];

  const words = transcript
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.map((w) => {
    const clean = w.toLowerCase();
    const isHesitation = ['uh', 'um', 'err', 'ah', 'mm'].includes(clean);
    return {
      word: w,
      isConfident: !isHesitation && clean.length > 1,
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

    // 3. Phương án xử lý khi không có API backend hoặc mạng yếu: Dựa trên lời thoại thực tế
    const currentStation = (stationType || 'STATION_1').toUpperCase();
    let calculatedScore = 75;
    let feedbackMessage = "";

    if (!recognizedTranscript) {
      return {
        score: 40,
        isWin: false,
        transcript: "(Không nhận diện được từ ngữ rõ ràng)",
        detailedFeedback: "⚠️ Âm thanh chưa đủ rõ hoặc phát âm chưa chuẩn. Vui lòng nói to và phát âm rõ từng từ!"
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
      // Đánh giá dựa trên độ dài và số lượng từ tiếng Anh thực tế sinh viên nói
      const wordCount = recognizedTranscript.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 25) {
        calculatedScore = 92;
        feedbackMessage = `🌟 Bài nói phong phú (${wordCount} từ)! Diễn đạt mạch lạc và tự tin.`;
      } else if (wordCount >= 15) {
        calculatedScore = 85;
        feedbackMessage = `👍 Tốt! Diễn đạt được ý chính (${wordCount} từ). Hãy mở rộng thêm câu ghép.`;
      } else if (wordCount >= 8) {
        calculatedScore = 75;
        feedbackMessage = `👌 Đạt yêu cầu cơ bản (${wordCount} từ). Cần nói dài hơn để đạt điểm cao.`;
      } else {
        calculatedScore = 60;
        feedbackMessage = `⚠️ Bài nói quá ngắn (${wordCount} từ). Cần bổ sung thêm thông tin.`;
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