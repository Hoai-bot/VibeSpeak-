// 🛑 CHẶN BÀI NÓI IM LẶNG / KHÔNG PHÁT ÂM (TRÁNH CHO KHỐNG 53 ĐIỂM)
    const validWords = actualTranscript.replace(/[^a-zA-Z0-9]/g, '').trim();
    if (!validWords || validWords.length < 2) {
      setIsEvaluating(false);
      const zeroEvaluation = {
        totalScore: 0,
        spontaneityScore: 0,
        isScriptSuspected: false,
        rubrics: {
          pronunciation: { score: 0, feedback: "Chưa ghi nhận phát âm tiếng Anh." },
          intonation: { score: 0, feedback: "Không phát hiện ngữ điệu lời nói." },
          fluency: { score: 0, feedback: "Thời gian im lặng hoàn toàn." },
          vocabulary: { score: 0, feedback: "Không sử dụng từ vựng." },
          grammar: { score: 0, feedback: "Chưa có cấu trúc câu." },
          content: { score: 0, feedback: "Không có nội dung phản xạ." }
        }
      };

      setFeedbackResult(zeroEvaluation);
      setDetailedModalVisible(true);
      Alert.alert(
        "Không ghi nhận giọng nói",
        "Micro không thu được phát âm tiếng Anh nào của bạn. Kết quả bài thi đạt 0 điểm. Vui lòng nói to và rõ hơn!"
      );
      return;
    }