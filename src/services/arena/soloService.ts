// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });
const STORAGE_KEY_SOLO = '@vibespeak_history_arena_tier1_solo_v1';

export interface SoloTopic {
  title: string;
  promptText: string;
  keywords: string[];
}

export async function generateSoloTopic(cefrLevel: string = 'B2'): Promise<SoloTopic> {
  // 🎯 BỘ QUY TẮC PHÂN CẤP ĐỘ CEFR RÕ RỆT
  let levelRules = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    levelRules = `
- CEFR LEVEL: EASY (${cefrLevel})
- Vocabulary: Super basic, daily life, simple words (e.g., family, food, daily routine, favorite things).
- Question length: Short (6-10 words).
- Example: "Talk about your favorite food and why you like it."`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    levelRules = `
- CEFR LEVEL: INTERMEDIATE (${cefrLevel})
- Vocabulary: Workplace, technology, social issues, university life.
- Question length: Medium (10-15 words).
- Example: "Explain how online learning can help students manage their time better."`;
  } else {
    levelRules = `
- CEFR LEVEL: ADVANCED (${cefrLevel}/C2)
- Vocabulary: Professional, business pitch, AI ethics, global economics, startup investment.
- Question length: Advanced (15+ words).
- Example: "Pitch an AI-driven solution to solve identity verification challenges in fintech."`;
  }

  const prompt = `You are an AI Pitch Coach. Generate ONE 100% UNIQUE Solo Pitch topic for CEFR level ${cefrLevel}.

${levelRules}

Return ONLY JSON:
{
  "title": "Topic Title",
  "promptText": "Clear topic instruction tailored to ${cefrLevel}",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const parsed: SoloTopic = JSON.parse(response.choices[0]?.message?.content || '{}');
    return parsed;
  } catch (error) {
    return {
      title: `Practice Topic (${cefrLevel})`,
      promptText: cefrLevel.startsWith('A') 
        ? "Tell us about your favorite hobby in 30 seconds."
        : "Pitch your idea on how AI will change education in the next 5 years.",
      keywords: ["practice", "speaking", "english"]
    };
  }
}