const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export async function transcribeAndGradeAudio(audioBlob: Blob): Promise<{ text: string; score: number }> {
  try {
    if (!GROQ_API_KEY) {
      return { text: 'Chưa nạp GROQ_API_KEY trong file .env', score: 0 };
    }

    if (audioBlob.size === 0) {
      return { text: 'File thu âm rỗng, vui lòng thử lại', score: 0 };
    }

    // 1. Tạo File Object gửi lên Groq Whisper STT
    const audioFile = new File([audioBlob], 'audio.m4a', { type: 'audio/m4a' });
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-large-v3');

    const sttRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (!sttRes.ok) {
      const errDetail = await sttRes.text();
      console.error('❌ Lỗi Whisper STT:', errDetail);
      return { text: 'Whisper AI không thể nhận diện file âm thanh này', score: 0 };
    }

    const sttData = await sttRes.json();
    const transcribedText = sttData.text || '';

    if (!transcribedText.trim()) {
      return { text: '(Không nghe thấy câu trả lời - Hãy nói to hơn)', score: 0 };
    }

    // 2. Chấm điểm văn bản bằng Llama 3
    const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an English teacher scoring spoken English. Return ONLY JSON: {"score": number_between_1_and_100}',
          },
          { role: 'user', content: `Grade this speech text: "${transcribedText}"` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const chatData = await chatRes.json();

    // Bẫy lỗi an toàn kiểm tra choices
    if (!chatData.choices || chatData.choices.length === 0) {
      console.error('❌ Lỗi Llama 3 Response:', chatData);
      // Mặc định tính điểm dựa theo độ dài câu nếu Llama 3 bận
      const wordCount = transcribedText.trim().split(/\s+/).length;
      const fallbackScore = Math.min(95, Math.max(60, wordCount * 10));
      return { text: transcribedText, score: fallbackScore };
    }

    const resultObj = JSON.parse(chatData.choices[0].message.content);

    return {
      text: transcribedText,
      score: resultObj.score ?? 75,
    };
  } catch (error: any) {
    console.error('❌ Lỗi Groq Client:', error);
    return { text: `Lỗi kết nối: ${error?.message || 'Chưa xác định'}`, score: 0 };
  }
}