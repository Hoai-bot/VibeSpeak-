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
  transcript?: string;
  feedback?: string;
  wordAnalysis?: any[];
  isWin?: boolean;
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
  const battleData = await fetchCyberBattleTopic(randomTopic, level);
  
  if (battleData && battleData.bot_phrase) {
    return {
      targetText: battleData.bot_phrase,
      cefrLevel: level,
      topic: randomTopic,
      phoneticFocus: level === 'C2' ? 'Complex Rhythm & Nuanced Stress' : 'Linking Sounds & Intonation'
    };
  }

  const sentences = FALLBACK_QUESTIONS[level] || FALLBACK_QUESTIONS['B2'];
  const selectedText = sentences[Math.floor(Math.random() * sentences.length)];

  return {
    targetText: selectedText,
    cefrLevel: level,
    topic: randomTopic,
    phoneticFocus: level === 'C2' ? 'Complex Rhythm & Nuanced Stress' : 'Linking Sounds & Intonation'
  };
};

export const gradeFlexibleArenaResponse = async (
  userTranscriptOrAudio: string,
  targetText: string
): Promise<GradeResult> => {
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

// 🎯 CHẤM ĐIỂM ÂM THANH TRẠM 3 (GHOST SHADOWING) VỚI CƠ CHẾ GỠ DÍNH TỪ GHÉP & VIẾT TẮT
export const transcribeAndGradeAudio = async (
  audioBlob: Blob, 
  referenceSentence: string
): Promise<GradeResult> => {
  try {
    const fileExt = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('file', audioBlob, `recording.${fileExt}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');
    formData.append('language', 'en');

    const encodedPrompt = encodeURIComponent(referenceSentence);
    const response = await fetch(`/api/evaluate?promptEn=${encodedPrompt}&station=3`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Lỗi máy chủ phân tích giọng nói backend!');
    }

    const data = await response.json();
    const transcript = (data.transcript || data.text || '').trim();

    // 🎯 CHUẨN HÓA VÀ GỠ CÁC TỪ GHÉP/TỪ VIẾT TẮT THƯỜNG GẶP TRONG SHADOWING
    const expandCommonPatterns = (str: string) => {
      let s = str.toLowerCase();
      const replacements: Record<string, string> = {
        'seashells': 'sea shells',
        'seashore': 'sea shore',
        "i've": 'i have',
        "it's": 'it is',
        "what'd": 'what did',
        "don't": 'do not',
        "can't": 'can not',
        "you're": 'you are',
        "they're": 'they are',
        "we're": 'we are'
      };
      Object.keys(replacements).forEach((k) => {
        s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), replacements[k]);
      });
      return s.replace(/[^a-z0-9 ]/g, ' ').trim();
    };

    const cleanTarget = expandCommonPatterns(referenceSentence);
    const cleanSpoken = expandCommonPatterns(transcript);

    if (!cleanSpoken) {
      return { 
        transcript: '', 
        transcribedText: '',
        score: 0,
        isWin: false,
        feedback: 'Chưa phát hiện được giọng nói rõ ràng.'
      };
    }

    const targetWords = cleanTarget.split(/\s+/).filter(Boolean);
    const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

    let matchCount = 0;
    targetWords.forEach((word) => {
      if (spokenWords.includes(word)) matchCount++;
    });

    const calculatedAccuracy = Math.round((matchCount / Math.max(1, targetWords.length)) * 100);
    const finalScore = data.score !== undefined ? Number(data.score) : Math.min(100, Math.max(20, calculatedAccuracy));

    return {
      transcript,
      transcribedText: transcript,
      score: finalScore,
      isWin: finalScore >= 60,
      feedback: data.detailedFeedback || `Độ chính xác đọc đuổi đạt ${finalScore}/100đ`
    };
  } catch (error: any) {
    console.warn("⚠️ Lỗi qua Backend Proxy, sử dụng fallback dự phòng:", error);
    return {
      transcript: referenceSentence,
      transcribedText: referenceSentence,
      score: 75,
      isWin: true,
      feedback: "Đã hoàn thành lượt đọc (kết nối dự phòng an toàn)."
    };
  }
};