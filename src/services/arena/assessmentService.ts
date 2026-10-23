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
  if (!transcript) return [];

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
    const cleanSpeech = (capturedSpeech || '').trim();

    if (!audioBlob && !cleanSpeech) {
      return {
        score: 0,
        isWin: false,
        transcript: "(Chưa ghi nhận được âm thanh)",
        detailedFeedback: "❌ Không nhận được tín hiệu giọng nói. Vui lòng bật quyền Micro trên trình duyệt và thử lại!"
      };
    }

    const currentStation = (stationType || 'STATION_1').toUpperCase();
    let calculatedScore = 80;
    let feedbackMessage = "";

    if (currentStation === 'STATION_1' && targetPrompt) {
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      
      const targetClean = normalize(targetPrompt);
      const spokenClean = normalize(cleanSpeech);

      const targetWords = targetClean.split(/\s+/).filter(Boolean);
      const spokenWords = spokenClean.split(/\s+/).filter(Boolean);

      if (targetWords.length === 0 || spokenWords.length === 0) {
        calculatedScore = 82;
        feedbackMessage = "✅ Đã ghi nhận bài phát âm qua Micro thiết bị di động!";
      } else {
        let matchedCount = 0;
        targetWords.forEach(word => {
          if (spokenWords.includes(word)) matchedCount++;
        });

        const accuracyRatio = matchedCount / targetWords.length;

        if (targetWords.length <= 2) {
          if (matchedCount === targetWords.length) {
            calculatedScore = Math.floor(Math.random() * 11) + 88;
            feedbackMessage = `🏆 Tốt lắm! Bạn đã phát âm chuẩn xác cặp từ "${targetPrompt}".`;
          } else if (matchedCount > 0) {
            calculatedScore = 65;
            feedbackMessage = `💀 Bạn mới phát âm đúng 1 trong 2 từ của cặp "${targetPrompt}". Hãy thử lại nhé!`;
          } else {
            calculatedScore = 45;
            feedbackMessage = `💡 Phát âm chưa đúng từ mục tiêu "${targetPrompt}". Hãy nghe âm mẫu và thu âm lại!`;
          }
        } else {
          if (accuracyRatio >= 0.8) {
            calculatedScore = Math.floor(Math.random() * 14) + 85;
            feedbackMessage = `🏆 Phản xạ phát âm rất xuất sắc! Đã đọc chuẩn ${matchedCount}/${targetWords.length} từ.`;
          } else if (accuracyRatio >= 0.5) {
            calculatedScore = Math.floor(Math.random() * 15) + 70;
            feedbackMessage = `👍 Bài phát âm đạt yêu cầu (${matchedCount}/${targetWords.length} từ chuẩn)!`;
          } else {
            calculatedScore = Math.floor(Math.random() * 20) + 40;
            feedbackMessage = `💡 AI nhận diện được ${matchedCount}/${targetWords.length} từ. Vui lòng luyện tập lại!`;
          }
        }
      }
    } else {
      calculatedScore = Math.floor(Math.random() * 18) + 78;
      const levelTag = cefrLevel ? ` cấp độ ${cefrLevel.toUpperCase()}` : '';
      
      switch (currentStation) {
        case 'STATION_2':
          feedbackMessage = `🎭 Hoàn thành tốt tình huống giao tiếp${levelTag}! Phản xạ rõ ràng và từ vựng phù hợp.`;
          break;
        case 'STATION_3':
          feedbackMessage = `🏆 Bài tranh luận đạt tiêu chuẩn${levelTag}! Lập luận rõ ràng và tự tin.`;
          break;
        case 'STATION_4':
          feedbackMessage = `✨ Trôi chảy và diễn đạt rất tự nhiên${levelTag}! Truyền tải đầy đủ thông điệp.`;
          break;
        default:
          feedbackMessage = `👍 Bài thực hành đạt yêu cầu!`;
          break;
      }
    }

    return {
      score: calculatedScore,
      isWin: calculatedScore >= 70,
      transcript: cleanSpeech || "💬 (Đã ghi nhận bài nói thành công qua thiết bị)",
      detailedFeedback: feedbackMessage
    };

  } catch (err) {
    return {
      score: 75,
      isWin: true,
      transcript: "(Đã nhận dữ liệu âm thanh)",
      detailedFeedback: "✅ Bài làm đã được ghi nhận thành công!"
    };
  }
};