// Trong src/screens/Station1Screen.tsx

const handleToggleRecord = async () => {
  stopAllAudio();

  if (!isRecording) {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        alert("🔒 Trình duyệt chưa cấp quyền Micro!");
        return;
      }

      // 🎯 1. BẮT DỮ LIỆU TỐI ƯU DÀNH RIÊNG CHO CHROME ANDROID
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          let accumulatedText = '';

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; ++i) {
              current += event.results[i][0].transcript;
            }
            if (current.trim()) {
              accumulatedText = current.trim();
              setCapturedText(accumulatedText);
            }
          };

          // Tự động khởi động lại nếu Android tự ngắt tiến trình nhận dạng
          recognition.onerror = (e: any) => {
            console.warn("Android SpeechRec Error:", e);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition Bypass:", e);
        }
      }

      // 2. Thu âm MediaStream hỗ trợ tất cả MIME Type trên thiết bị di động
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let chosenMime = '';
      if (typeof MediaRecorder !== 'undefined') {
        const types = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg'
        ];
        for (const t of types) {
          if (MediaRecorder.isTypeSupported(t)) {
            chosenMime = t;
            break;
          }
        }
      }

      const options = chosenMime ? { mimeType: chosenMime } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mimeUsed = recorder.mimeType || chosenMime || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeUsed });

        setRecordedAudio(blob);
        setHasRecorded(true);

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start(200);
      setIsRecording(true);
      setHasRecorded(false);
      setCapturedText('');
    } catch (err) {
      alert("🔒 Vui lòng kiểm tra biểu tượng 🔒 trên thanh địa chỉ trình duyệt Android và cho phép 'Microphone'!");
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