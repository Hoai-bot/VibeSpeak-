// src/services/aiService.ts

// 🎯 TỰ ĐỘNG XÁC ĐỊNH BASE URL (Tự thích ứng cả Localhost, Expo Web & Vercel Production)
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  if (process.env.EXPO_PUBLIC_VERCEL_URL) {
    return `https://${process.env.EXPO_PUBLIC_VERCEL_URL}`;
  }
  return 'https://vibe-speak-jmz06cpaj-ic-dalat.vercel.app'; // URL Fallback
};

export interface BattleData {
  battle_id: string;
  bot_phrase: string;
  keywords: string[];
  sample_response: string;
  time_limit_seconds: number;
}

export interface WordAnalysisItem {
  word: string;
  isCorrect: boolean;
  phonemeError?: string;
}

export interface EvaluationResultData {
  pronunciation: number;
  fluency: number;
  reflexes: number;
  task?: number;
  grammar?: number;
  vocabulary?: number;
  wordAnalysis: WordAnalysisItem[];
  missingRequirements?: string[];
  detailedFeedback?: string;
}

/**
 * ⚡ Gọi Serverless Proxy /api/generate-battle để sinh đề thi đấu AI Cyber Arena
 */
export const fetchCyberBattleTopic = async (
  topic: string, 
  level: string = 'B2',
  mode: string = 'cyber_battle'
): Promise<BattleData | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/generate-battle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level, mode }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Generate Battle API Failed (${response.status}):`, errorText);
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data as BattleData;
    } else {
      console.error('❌ Proxy API Business Error:', result.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('❌ Client Network Error (fetchCyberBattleTopic):', error);
    return null;
  }
};

/**
 * 🎯 Gọi Serverless Proxy /api/evaluate để chấm điểm phát âm & phản xạ AI
 */
export const evaluatePronunciation = async (
  userAudioTranscript: string,
  targetPhrase: string
): Promise<EvaluationResultData | null> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAudioTranscript: userAudioTranscript || '',
        targetPhrase: targetPhrase || '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Evaluate API HTTP Error (${response.status}):`, errorText);
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data as EvaluationResultData;
    } else {
      console.error('❌ Evaluate API Business Error:', result.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('❌ Client Network Error (evaluatePronunciation):', error);
    return null;
  }
};

// Bí danh (Alias) để đảm bảo tương thích ngược nếu ứng dụng gọi hàm với tên evaluateUserSpeech
export const evaluateUserSpeech = evaluatePronunciation;