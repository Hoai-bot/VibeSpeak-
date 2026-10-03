// src/services/groqClient.ts
import { evaluatePronunciation, fetchCyberBattleTopic } from './aiService';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface GeneratedSentence {
  targetText: string;
  cefrLevel: CEFRLevel;
  topic: string;
  phoneticFocus: string;
}

export interface GradeResult {
  score: number;
  phoneticScore?: number;
  fluencyScore?: number;
  semanticScore?: number;
  transcribedText?: string;
  feedback: string;
  wordAnalysis?: any[];
}

const TOPIC_POOL = [
  'Business & Economy',
  'Arts & Culture',
  'Psychology & Society',
  'Environment & Sustainability',
  'Science & Innovation',
  'Philosophy & Ethics',
  'Global Travel & Culinary',
  'Education & Future Skills'
];

// Mẫu câu dự phòng chuẩn hóa theo CEFR từ A1 đến C2
const FALLBACK_QUESTIONS: Record<CEFRLevel, string[]> = {
  A1: [
    "I usually drink coffee every morning before going to work.",
    "My brother plays soccer with his friends at the park."
  ],
  A2: [
    "We decided to visit the local market because it was raining.",
    "She enjoys reading fantasy novels during her summer vacations."
  ],
  B1: [
    "Public transportation plays a crucial role in reducing urban traffic congestion.",
    "Learning a foreign language opens up various career opportunities abroad."
  ],
  B2: [
    "Sustainable urban development requires balancing environmental conservation with economic growth.",
    "Technological advancement has significantly reshaped modern communication paradigms."
  ],
  C1: [
    "Implementing comprehensive fiscal reforms is essential for maintaining long-term economic stability.",
    "The cognitive development of children is deeply influenced by cultural context."
  ],
  C2: [
    "Had the board anticipated the economic backlash, such stringent fiscal policies would never have been enacted.",
    "Her eloquent critique seamlessly intertwined philosophical nuance with pragmatic sociological observation."
  ]
};

export const generateDynamicQuestion = async (level: CEFRLevel): Promise<GeneratedSentence> => {
  const randomTopic = TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];
  
  // Thử gọi Vercel Serverless API /api/generate-battle trước
  const battleData = await fetchCyberBattleTopic(randomTopic, level);
  
  if (battleData && battleData.bot_phrase) {
    return {
      targetText: battleData.bot_phrase,
      cefrLevel: level,
      topic: randomTopic,
      phoneticFocus: level === 'C2' ? 'Complex Rhythm & Nuanced Stress' : 'Linking Sounds & Intonation'
    };
  }

  // Nếu API lỗi, dùng dữ liệu Fallback an toàn
  const sentences = FALLBACK_QUESTIONS[level] || FALLBACK_QUESTIONS['B2'];
  const selectedText = sentences[Math.floor(Math.random() * sentences.length)];

  return {
    targetText: selectedText,
    cefrLevel: level,
    topic: randomTopic,
    phoneticFocus: level === 'C2' ? 'Complex Rhythm & Nuanced Stress' : 'Linking Sounds & Intonation'
  };
};

/**
 * 🎯 Đã kết nối với Vercel Serverless API /api/evaluate thật qua aiService
 */
export const gradeFlexibleArenaResponse = async (
  userTranscriptOrAudio: string,
  targetText: string
): Promise<GradeResult> => {
  // Gọi API chấm điểm thực tế qua Vercel Proxy
  const evalResult = await evaluatePronunciation(userTranscriptOrAudio, targetText);

  if (evalResult) {
    const avgScore = Math.round((evalResult.pronunciation + evalResult.fluency + evalResult.reflexes) / 3);
    
    return {
      score: avgScore,
      phoneticScore: evalResult.pronunciation,
      fluencyScore: evalResult.fluency,
      semanticScore: evalResult.reflexes,
      transcribedText: userTranscriptOrAudio,
      feedback: evalResult.detailedFeedback || "Phân tích phát âm hoàn tất!",
      wordAnalysis: evalResult.wordAnalysis || []
    };
  }

  // Phân phản hồi khi không gọi được API
  return {
    score: 0,
    phoneticScore: 0,
    fluencyScore: 0,
    semanticScore: 0,
    transcribedText: userTranscriptOrAudio,
    feedback: "Không thể kết nối với máy chủ chấm điểm AI Vercel.",
    wordAnalysis: []
  };
};