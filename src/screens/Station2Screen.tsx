// 🛑 3 LỚP BẢO VỆ CHẶN BÀI NÓI IM LẶNG / ẢO GIÁC WHISPER (KHÓA VỀ 0 ĐIỂM)
    const WHISPER_HALLUCINATIONS = [
      'thank you', 'thank you.', 'thank you very much', 'thank you for watching',
      'thanks for watching', 'you', 'bye', 'bye.', 'subtitles', 'subscribe', 'the end'
    ];

    const cleanLowerTranscript = actualTranscript.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const isHallucination = WHISPER_HALLUCINATIONS.some(h => cleanLowerTranscript === h);
    const validWords = actualTranscript.replace(/[^a-zA-Z0-9]/g, '').trim();

    // Kiểm tra số từ khóa trùng khớp nếu ở chế độ đọc theo mẫu
    let hasMatchingSampleWord = true;
    if (practiceMode === 'READ_SAMPLE' && currentChallenge?.prompt) {
      const promptWords = currentChallenge.prompt.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2);
      const spokenWords = cleanLowerTranscript.split(/\s+/);
      hasMatchingSampleWord = spokenWords.some(w => promptWords.includes(w));
    }

    const isSilence = 
      !validWords || 
      validWords.length < 3 || 
      isHallucination || 
      (pitchHistory && pitchHistory.length < 3) ||
      (!hasMatchingSampleWord && practiceMode === 'READ_SAMPLE');

    if (isSilence) {
      setIsEvaluating(false);
      const zeroEvaluation = {
        totalScore: 0,
        spontaneityScore: 0,
        isScriptSuspected: false,
        rubrics: {
          pronunciation: { score: 0, feedback: "Chưa ghi nhận phát âm tiếng Anh hợp lệ." },
          intonation: { score: 0, feedback: "Không phát hiện ngữ điệu bài nói." },
          fluency: { score: 0, feedback: "Thời gian im lặng hoàn toàn." },
          vocabulary: { score: 0, feedback: "Không có từ vựng của bài tập." },
          grammar: { score: 0, feedback: "Chưa có cấu trúc câu." },
          content: { score: 0, feedback: "Không có nội dung phản xạ." }
        }
      };

      setFeedbackResult(zeroEvaluation);
      setDetailedModalVisible(true);
      Alert.alert(
        "Không ghi nhận bài nói",
        "Hệ thống không phát hiện thấy phát âm tiếng Anh hợp lệ của bài tập. Kết quả: 0 điểm. Vui lòng nói to và rõ ràng vào micro!"
      );
      return;
    }