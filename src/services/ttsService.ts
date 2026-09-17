// src/services/ttsService.ts
import { Audio } from 'expo-av';

const AZURE_KEY = process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY || '';
const AZURE_REGION = process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION || 'eastus';

const audioBufferCache = new Map<string, string>();
let currentSoundInstance: Audio.Sound | null = null;

export interface VoiceStyleOptions {
  voiceName?: string;  // e.g. 'en-US-GuyNeural' (Boss), 'en-US-JennyNeural' (Coach)
  style?: string;      // e.g. 'shouting', 'excited', 'cheerful', 'empathetic'
  rate?: string;       // e.g. '0%', '+10%', '-5%'
}

/**
 * 🚀 AZURE NEURAL TTS API CALL (SSML Audio Stream)
 */
async function fetchAzureNeuralAudio(text: string, options: VoiceStyleOptions): Promise<string> {
  const voice = options.voiceName || 'en-US-GuyNeural';
  const style = options.style || 'excited';
  const rate = options.rate || '0%';

  const cacheKey = `${voice}_${style}_${text}`;
  if (audioBufferCache.has(cacheKey)) {
    return audioBufferCache.get(cacheKey)!;
  }

  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
      <voice name="${voice}">
        <mstts:express-as style="${style}">
          <prosody rate="${rate}">
            ${text}
          </prosody>
        </mstts:express-as>
      </voice>
    </speak>
  `;

  const endpoint = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'VibeSpeakCyberArena',
    },
    body: ssml,
  });

  if (!response.ok) {
    throw new Error(`Azure TTS Error: ${response.statusText}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  audioBufferCache.set(cacheKey, audioUrl);
  if (audioBufferCache.size > 30) {
    const firstKey = audioBufferCache.keys().next().value;
    if (firstKey) audioBufferCache.delete(firstKey);
  }

  return audioUrl;
}

/**
 * 🔊 PHÁT ÂM NEURAL VOICE CHUẨN BẢN XỨ CYBER ARENA
 */
export async function speakNaturalText(
  text: string, 
  options: VoiceStyleOptions | number = { voiceName: 'en-US-GuyNeural', style: 'excited' }
): Promise<void> {
  try {
    // Xử lý tương thích ngược nếu tham số 2 truyền vào là số (rate)
    const voiceOpts: VoiceStyleOptions = typeof options === 'number' 
      ? { voiceName: 'en-US-GuyNeural', style: 'excited' } 
      : options;

    if (currentSoundInstance) {
      await currentSoundInstance.unloadAsync();
      currentSoundInstance = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 1. Ưu tiên phát qua Azure Neural Audio Stream nếu đã cấu hình Key
    if (AZURE_KEY && AZURE_KEY !== 'your_azure_speech_resource_key') {
      const audioUrl = await fetchAzureNeuralAudio(text, voiceOpts);
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, volume: 1.0 }
      );
      currentSoundInstance = sound;
      await sound.playAsync();
      return;
    }

    // 2. Fallback Web Speech API nếu chưa có Azure Key
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = typeof options === 'number' ? options : 0.95;

      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (premiumVoice) utterance.voice = premiumVoice;

      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    console.warn("⚠️ Fallback sang Web Speech API:", error);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }
}