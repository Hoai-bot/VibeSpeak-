// src/services/bossTtsService.ts

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  if (process.env.EXPO_PUBLIC_VERCEL_URL) {
    return `https://${process.env.EXPO_PUBLIC_VERCEL_URL}`;
  }
  return '';
};

/**
 * Phát giọng nói AI Shadow Boss với tông giọng kịch tính (Onyx/Shimmer)
 * Hỗ trợ tự động Fallback Web Speech API nếu Serverless TTS gặp sự cố.
 */
export const playBossVoice = async (text: string, voice: string = 'onyx'): Promise<void> => {
  if (!text || text.trim().length === 0) return;

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      throw new Error(`TTS Network response error status: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Giải phóng bộ nhớ Blob sau khi phát xong hoặc lỗi
    audio.onended = () => URL.revokeObjectURL(audioUrl);
    audio.onerror = () => URL.revokeObjectURL(audioUrl);

    await audio.play();
  } catch (error) {
    console.warn("⚠️ Không thể phát giọng API Boss, chuyển sang Web Speech fallback:", error);

    // Fallback tự động phát bằng Web Speech API nếu Serverless TTS gặp sự cố
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Dừng các câu thoại cũ đang phát

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.pitch = 0.65; // Giảm pitch sâu hơn để giả lập giọng Boss ngầu
      utterance.rate = 0.85;  // Đọc nhịp điệu uy nghiêm

      // Ưu tiên chọn các giọng đọc chất lượng cao có sẵn trên trình duyệt
      const voices = window.speechSynthesis.getVoices();
      const bossVoice = voices.find((v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Google US English') || v.name.includes('Male'))
      ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

      if (bossVoice) {
        utterance.voice = bossVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }
};