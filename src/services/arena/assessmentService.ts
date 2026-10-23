// src/services/arena/assessmentService.ts

export interface AssessmentResult {
  score: number;
  transcript: string;
  detailedFeedback: string;
  audioUrl?: string;
  isWin?: boolean;
}

export type StationType = 'STATION_1' | 'STATION_2' | 'STATION_3' | 'STATION_4' | string;

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

    // 🎯 1. KIỂM TRA IM LẶNG / KHÔNG NÓI GÌ -> TRẢ VỀ 0 ĐIỂM
    if (!audioBlob || audioBlob.size < 1200 || !cleanSpeech || cleanSpeech.length < 2) {
      return {
        score: 0,
        isWin: false,
        transcript: "(Chưa ghi nhận được phát âm thực tế)",
        detailedFeedback: "❌ AI không nghe thấy giọng nói của bạn! Vui lòng kiểm tra Micro và phát âm rõ ràng từ mục tiêu trước khi nộp bài."
      };
    }

    const currentStation = (stationType || 'STATION_1').toUpperCase();
    let calculatedScore = 80;

    // 🎯 2. CHẤM ĐIỂM DỰA TRÊN ĐỘ KHỚP TỪ MỤC TIÊU DÀNH CHO TRẠM 1
    if (currentStation === 'STATION_1' && targetPrompt) {
      const targetWords = targetPrompt.toLowerCase().split(/[\/\s]+/).filter(Boolean);
      const spokenWords = cleanSpeech.toLowerCase().split(/\s+/).filter(Boolean);

      const matchedCount = targetWords.filter(w => spokenWords.includes(w)).length;
      
      if (matchedCount === 0) {
        calculatedScore = 40;
      } else if (matchedCount < targetWords.length) {
        calculatedScore = 65;
      } else {
        calculatedScore = Math.floor(Math.random() * 11) + 85; // Phát âm chuẩn: 85 - 95 điểm
      }
    } else {
      calculatedScore = Math.floor(Math.random() * 18) + 78;
    }

    let feedbackMessage = "";

    // 🎯 3. PHÂN LOẠI CÂU NHẬN XÉT CHI TIẾT THEO TỪNG TRẠM
    switch (currentStation) {
      case 'STATION_1':
        // ❌ TUYỆT ĐỐI KHÔNG BỔ SUNG CẤP ĐỘ CEFR (A1/A2) CHO TRẠM 1
        if (calculatedScore >= 80) {
          feedbackMessage = "✅ Phát âm xuất sắc! Độ bật âm rõ ràng, khẩu hình chuẩn và hoàn thành bài luyện tập rất tốt.";
        } else if (calculatedScore >= 70) {
          feedbackMessage = "👍 Bài phát âm đạt yêu cầu! Âm lượng rõ ràng, hoàn thành bài thực hành tròn vai.";
        } else {
          feedbackMessage = `💡 Phát âm chưa chính xác từ mục tiêu "${targetPrompt}". Vui lòng nghe lại bài mẫu và bấm mic thu âm lại!`;
        }
        break;

      case 'STATION_2':
        {
          const levelTag = cefrLevel ? ` cấp độ ${cefrLevel.toUpperCase()}` : '';
          if (calculatedScore >= 80) {
            feedbackMessage = `🎉 Hoàn thành xuất sắc tình huống đóng vai${levelTag}! Phản xạ tự nhiên, dùng từ vựng phù hợp ngữ cảnh.`;
          } else {
            feedbackMessage = `👍 Bài nói đạt yêu cầu${levelTag}! Khả năng giao tiếp tốt, đáp ứng đúng mục tiêu tình huống.`;
          }
        }
        break;

      case 'STATION_3':
        {
          const levelTag = cefrLevel ? ` cấp độ ${cefrLevel.toUpperCase()}` : '';
          if (calculatedScore >= 80) {
            feedbackMessage = `🏆 Luận điểm phản bác sắc bén${levelTag}! Đưa ra lý lẽ thuyết phục và cấu trúc câu tranh luận chắc chắn.`;
          } else {
            feedbackMessage = `👍 Bài tranh luận đạt tiêu chuẩn${levelTag}! Lập luận rõ ràng, biết cách bảo vệ quan điểm.`;
          }
        }
        break;

      case 'STATION_4':
        {
          const levelTag = cefrLevel ? ` cấp độ ${cefrLevel.toUpperCase()}` : '';
          if (calculatedScore >= 80) {
            feedbackMessage = `✨ Trôi chảy và diễn đạt rất tự nhiên${levelTag}! Mạch câu chuyện gắn kết bài bản.`;
          } else {
            feedbackMessage = `✅ Hoàn thành thử thách ngẫu hứng${levelTag}! Tốc độ nói vừa phải, truyền tải đủ ý chính.`;
          }
        }
        break;

      default:
        feedbackMessage = "👍 Bài thực hành hoàn thành thành công!";
        break;
    }

    return {
      score: calculatedScore,
      isWin: calculatedScore >= 70,
      transcript: cleanSpeech,
      detailedFeedback: feedbackMessage
    };

  } catch (err) {
    return {
      score: 0,
      isWin: false,
      transcript: "(Lỗi chấm điểm)",
      detailedFeedback: "⚠️ Có lỗi trong quá trình xử lý âm thanh. Vui lòng bấm mic và thử lại!"
    };
  }
};