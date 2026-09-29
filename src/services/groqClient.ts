// src/services/groqClient.ts
import { callGroqAI } from './aiService';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

const TOPIC_POOL = [
  'Business & Economy', 'Arts & Culture', 'Psychology & Society', 
  'Environment & Sustainability', 'Science & Innovation', 'Philosophy & Ethics',
  'Global Travel & Culinary', 'Education & Future Skills'
];

export interface GeneratedSentence {
  targetText: string;
  cefrLevel: CEFRLevel;
  topic: string;
  phoneticFocus: string;
}

// 🎯 HÀM TỰ ĐỘNG SINH CÂU HỎI THEO CHUẨN CEFR VÀ DIVERSE TOPIC
export const generateDynamicQuestion = async (level: CEFRLevel): Promise<GeneratedSentence> => {
  // Chọn ngẫu nhiên 1 chủ đề từ Topic Pool
  const randomTopic = TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];
  
  const prompt = `
You are a Cambridge CEFR Examiner creating an English speaking prompt.
Generate 1 sentence strictly adhering to CEFR Level: "${level}" on the topic: "${randomTopic}".

CEFR Level Criteria:
- B1: Clear standard input on familiar matters (work, school, leisure). Simple connected text.
- B2: Complex sentences, abstract topics, expressing advantages/disadvantages with fluency.
- C1: Extended complex structures, academic vocabulary, subtle nuances, inverted sentences.
- C2: Native-like proficiency, idiomatic expressions, sophisticated metaphors, highly nuanced context.

IMPORTANT: Do NOT use "Artificial Intelligence" unless topic is Science.
Return ONLY a valid JSON object matching this schema:
{
  "targetText": "The exact English sentence",
  "cefrLevel": "${level}",
  "topic": "${randomTopic}",
  "phoneticFocus": "Key sound or rhythm focus (e.g. Linking /r/, Stress on 3rd syllable)"
}
`;

  try {
    const raw = await callGroqAI(prompt, '');
    if (raw) {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(raw.substring(start, end + 1));
        return {
          targetText: parsed.targetText,
          cefrLevel: level,
          topic: parsed.topic || randomTopic,
          phoneticFocus: parsed.phoneticFocus || 'General Fluency'
        };
      }
    }
  } catch (e) {
    console.warn('Fallback due to Groq API error:', e);
  }

  // Dự phòng nếu mất kết nối API
  return {
    targetText: level === 'C2' 
      ? "Had the government anticipated the economic backlash, such stringent fiscal policies would never have been enacted."
      : "Sustainable urban development requires balancing environmental conservation with economic growth.",
    cefrLevel: level,
    topic: randomTopic,
    phoneticFocus: "Stress and Intonation"
  };
};