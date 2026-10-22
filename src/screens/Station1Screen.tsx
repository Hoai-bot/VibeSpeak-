// Trong src/screens/Station1Screen.tsx
// Bổ sung State lưu trữ văn bản bóc tách thực tế từ SpeechRecognition
const [capturedText, setCapturedText] = useState<string>('');
const recognitionRef = useRef<any>(null);

// Cập nhật hàm handleToggleRecord để bật Nhận diện giọng nói cùng lúc với Thu âm
const handleToggleRecord = async () => {
  stopAllAudio();

  if (!isRecording) {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert("🔒 Trình duyệt của bạn không hỗ trợ Micro âm thanh!");
        return;
      }

      // 🎯 Khởi tạo Web Speech Recognition (nếu trình duyệt hỗ trợ Chrome/Edge/Safari)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let transcriptBuffer = '';
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          transcriptBuffer = currentTranscript;
          setCapturedText(currentTranscript);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const finalMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMime });

        if (blob.size > 800) {
          setRecordedAudio(blob);
          setHasRecorded(true);
        } else {
          setRecordedAudio(null);
          setHasRecorded(false);
          alert("⚠️ Bản thu âm quá ngắn! Vui lòng bấm mic và phát âm rõ ràng lại.");
        }

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordedAudio(null);
      setHasRecorded(false);
      setCapturedText('');
    } catch (err) {
      console.error("Lỗi Microphone:", err);
      alert("🔒 Lỗi Micro: Vui lòng cấp quyền Microphone trên trình duyệt!");
    }
  } else {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }
};

// Trong hàm handleSubmitAnswer:
const handleSubmitAnswer = async () => {
  if (!hasRecorded || !recordedAudio || recordedAudio.size <= 800) {
    alert("🔒 Vui lòng bấm micro thu âm phát âm trước khi nộp bài!");
    return;
  }

  setIsAnalyzing(true);

  try {
    const promptTarget = (currentDrill?.contentEn || '').trim();
    
    // 🎯 Truyền capturedText (chữ bóc tách thực tế) vào tham số thứ 6 của evaluateSpeaking
    const evalData = await evaluateSpeaking(
      recordedAudio, 
      undefined, 
      undefined, 
      promptTarget, 
      userId, 
      capturedText // <--- Truyền lời thoại thực tế nghe được tại đây
    );

    setResult(evalData);
    
    const isPass = (evalData.score >= 70) || evalData.isWin;
    if (isPass) {
      updateUserProgress(1, 30, true);
    }
  } catch (err) {
    console.error("Lỗi chấm điểm Trạm 1:", err);
    alert("⚠️ Lỗi kết nối chấm điểm. Vui lòng thử nộp lại!");
  } finally {
    setIsAnalyzing(false);
  }
};git add src/screens/Station1Screen.tsx
git commit -m "feat: add client-side speech recognition to capture actual spoken text for Station 1"
git push origin main