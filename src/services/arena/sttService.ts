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
    const audioFile = new File([audioBlob], 'input_speech.m4a', { 
      type: audioBlob.type || 'audio/m4a' 
    });

    formData.append('file', audioFile);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');
    formData.append('response_format', 'json');
    // Ép Whisper ghi âm nguyên văn (verbatim), tuyệt đối không tự thêm -s/-es/-ed hay sửa ngữ pháp
    formData.append(
      'prompt',
      'Transcribe strictly verbatim as spoken. Do NOT auto-correct grammar, missing third-person singular -s/-es (like "he go", "she work"), missing past tense -ed, plural -s, or mispronounced words.'
    );

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