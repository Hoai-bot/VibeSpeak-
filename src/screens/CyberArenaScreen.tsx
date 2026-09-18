// ⏹️ DỪNG GHI ÂM VÀ CHẤM ĐIỂM
const stopAndGrade = async () => {
  stopTimer();
  const mediaRecorder = mediaRecorderRef.current;
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

  setIsRecording(false);
  setIsAnalyzing(true);

  const processAudio = new Promise<{ blob: Blob; url: string }>((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach((t: any) => t.stop());
      }
      resolve({ blob, url });
    };
    mediaRecorder.stop();
  });

  try {
    const { blob, url } = await processAudio;
    setRecordedAudioUri(url);

    // 🎯 KIỂM TRA DUNG LƯỢNG FILE ÂM THANH
    if (blob.size < 3000) {
      setResult({
        score: 0,
        phoneticScore: 0,
        fluencyScore: 0,
        semanticScore: 0,
        transcribedText: "(Không ghi nhận âm thanh)",
        feedback: "Hệ thống không nghe thấy giọng nói của bạn. Vui lòng bật micro và nói rõ ràng!"
      });
      setIsAnalyzing(false);
      return;
    }

    let targetContext = "";
    if (arenaTier === 1) targetContext = soloData?.promptText || "";
    else if (arenaTier === 2) targetContext = `${relayData?.topic}: ${relayData?.context}`;
    else targetContext = `ROLEPLAY [${cefrLevel}]: ${roleplayData?.scenarioTitle}. Roles: P1 (${roleplayData?.aiRole}) & P2 (${roleplayData?.userRole}). Goal: ${roleplayData?.goal}`;

    const res = await gradeFlexibleArenaResponse(blob, targetContext);

    // 🎯 KIỂM TRA BÀI NÓI RỖNG / KHÔNG CÓ TỪ NGỮ (ZERO-SPEECH FILTER)
    const cleanText = res.transcribedText.replace(/[\s\.\,\?\!]/g, '');
    if (!cleanText || res.transcribedText.includes(". . .") || cleanText.length < 5) {
      setResult({
        score: 0,
        phoneticScore: 0,
        fluencyScore: 0,
        semanticScore: 0,
        transcribedText: "(Không nhận diện được từ ngữ)",
        feedback: "Bạn chưa thực hiện phần nói! Vui lòng cất lời để AI có thể phân tích ngữ điệu và từ vựng."
      });
    } else {
      setResult(res);
    }
  } catch (e) {
    console.error(e);
  } finally {
    setIsAnalyzing(false);
  }
};