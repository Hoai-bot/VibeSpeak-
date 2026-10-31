// Trong evaluateSpeaking (assessmentService.ts):
    if (currentStation === 'STATION_1' && targetPrompt) {
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const targetWords = normalize(targetPrompt).split(/\s+/).filter(Boolean);
      const spokenWords = normalize(recognizedTranscript).split(/\s+/).filter(Boolean);

      let totalWordScore = 0;

      targetWords.forEach(target => {
        if (spokenWords.includes(target)) {
          totalWordScore += 1.0;
        } else {
          // Tính độ tương đồng âm/chữ cái cho Minimal Pairs (ví dụ: ship vs sheep, pen vs pan)
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

          // Nếu phát âm gần đúng (đạt 60% ký tự tương đồng trở lên), cho điểm thành phần
          if (bestSim >= 0.6) {
            totalWordScore += bestSim * 0.75;
          }
        }
      });

      const accuracyRatio = targetWords.length > 0 ? (totalWordScore / targetWords.length) : 0;
      calculatedScore = Math.min(100, Math.max(40, Math.round(accuracyRatio * 60 + 40)));
      
      const matchedCount = targetWords.filter(w => spokenWords.includes(w)).length;
      feedbackMessage = `Phản xạ phát âm: Đã khớp chuẩn xác ${matchedCount}/${targetWords.length} từ mục tiêu.`;
    }