// src/services/arena/sttService.ts

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

export async function transcribeAudioBlob(audioBlob: Blob): Promise<string> {
  if (!audioBlob || audioBlob.size < 5000) {
    return '';
  }

  try {
    const apiKey = GROQ_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ EXPO_PUBLIC_GROQ_API_KEY chưa được cấu hình!');
      return '';
    }

    const formData = new FormData();
    // Tạo file WAV/M4A tương thích tốt nhất trên cả Web & Mobile
    const audioFile = new File([audioBlob], 'input_speech.m4a', { 
      type: audioBlob.type || 'audio/m4a' 
    });

    formData.append('file', audioFile);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errRes = await response.text();
      console.error('Groq Whisper STT Error:', errRes);
      return '';
    }

    const result = await response.json();
    return result.text ? result.text.trim() : '';
  } catch (error) {
    console.error('Lỗi khi gọi Whisper STT:', error);
    return '';
  }
}