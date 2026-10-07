// 1. HÀM BẤM BẮT ĐẦU / DỪNG THU ÂM THEO LƯỢT CHUẨN
  const handleToggleRecord = async () => {
    if (!isRecording) {
      // --- BẮT ĐẦU THU ÂM CHO LƯỢT HIỆN TẠI (LƯỢT 1 HOẶC LƯỢT 2) ---
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          let options = {};
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          // KHI BẤM DỪNG THU ÂM -> TỰ ĐỘNG PHÂN LOẠI LƯỢT 1 HAY LƯỢT 2
          mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            if (recordedBlob.size > 800) {
              if (currentTurn === 1) {
                setRecordedTurn1(recordedBlob);
                setHasRecordedTurn1(true);
              } else {
                setRecordedTurn2(recordedBlob);
                setHasRecordedTurn2(true);
              }
            } else {
              alert("⚠️ Ghi âm quá ngắn hoặc chưa rõ giọng nói! Vui lòng bấm thu âm lại.");
            }

            // DỌN DẸP SẠCH DÒNG MICRO ĐỂ SẴN SÀNG CHO LƯỢT KẾ TIẾP
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start(200);
          setIsRecording(true);
          setIsTimerActive(true);
        }
      } catch (err) {
        setMicPermissionModal(true);
      }
    } else {
      // --- DỪNG THU ÂM LƯỢT HIỆN TẠI ---
      setIsRecording(false);
      setIsTimerActive(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("MediaRecorder stopped");
        }
      }

      // Tự động chuyển sang Lượt 2 nếu vừa hoàn thành Lượt 1
      if (mode !== 'solo' && currentTurn === 1) {
        setTimeout(() => {
          setCurrentTurn(2);
        }, 200);
      }
    }
  };

  // 2. HÀM NỘP BÀI: TỰ ĐỘNG GỘP BẢN THU LƯỢT 1 VÀ LƯỢT 2 ĐỂ NỘP CHO AI CHẤM ĐIỂM
  const handleSubmitBattleAnswer = async () => {
    setIsTimerActive(false);

    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
    }

    // Đợi 200ms để Blob lượt cuối cùng đóng xong
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Lấy bản thu âm của cả 2 lượt (Ưu tiên gộp cả 2 bản thu thành 1 file duy nhất)
    let finalBlobToSubmit: Blob | null = null;

    if (recordedTurn1 && recordedTurn2) {
      // Gộp audio lượt 1 và lượt 2
      finalBlobToSubmit = new Blob([recordedTurn1, recordedTurn2], { type: recordedTurn1.type });
    } else {
      finalBlobToSubmit = recordedTurn1 || recordedTurn2;
    }

    if (!finalBlobToSubmit || finalBlobToSubmit.size <= 800) {
      alert("🔒 Chưa ghi nhận bản thu âm giọng nói! Vui lòng bấm nút Micro nói trước khi nộp.");
      return;
    }

    if (typeof window !== 'undefined' && window.URL) {
      const audioUrl = URL.createObjectURL(finalBlobToSubmit);
      setRecordedAudioUrl(audioUrl);
    }

    setBattleState('analyzing');

    try {
      const targetPrompt = getCurrentPromptText();
      const evalData = await evaluateSpeaking(finalBlobToSubmit, cefrLevel, undefined, targetPrompt);
      
      setResult(evalData);
      setBattleState('ended');
      updateUserProgress(2, evalData.isWin ? 50 : 10, evalData.isWin);
    } catch (err) {
      console.error("Lỗi chấm điểm:", err);
      alert("⚠️ Lỗi kết nối chấm điểm. Vui lòng thử nộp lại!");
      setBattleState('battling');
    }
  };