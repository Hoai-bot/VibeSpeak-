// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface SoloTopic {
  title: string;
  promptText: string;
  keywords: string[];
}

export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  // 💡 TẠO BIẾN THẺ NGẪU NHIÊN ĐỂ ÉP GROQ SINH ĐỀ MỚI 100%
  const randomSeed = Math.random().toString(36).substring(7) + "_" + Date.now();

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1') {
    languageRule = `- LANGUAGE: BILINGUAL (English prompt + Vietnamese translation/explanation).`;
  } else if (cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: 100% ENGLISH. Professional and analytical tone.`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED ENGLISH. Highly academic or philosophical.`;
  }

  const prompt = `Generate a UNIQUE Solo Speaking Topic strictly for CEFR Level ${cefrLevel}.
Request ID: ${randomSeed}

RULES FOR CEFR LEVEL ${cefrLevel}:
${languageRule}

Return ONLY a valid JSON object:
{
  "title": "Solo Topic [${cefrLevel}]",
  "promptText": "Prompt text matching level ${cefrLevel}",
  "keywords": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.9, // Tăng temperature để sinh đề ngẫu nhiên đa dạng hơn
      response_format: { type: 'json_object' },
    });

    const parsed: SoloTopic = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      title: parsed.title || `Solo Pulse [${cefrLevel}]`,
      promptText: parsed.promptText || `Topic for level ${cefrLevel} (${randomSeed})`,
      keywords: parsed.keywords || ["speaking", "practice"]
    };
  } catch (error) {
    console.warn("Groq Solo Error, generating dynamic fallback:", error);
    return {
      title: `Solo Pulse [${cefrLevel}]`,
      promptText: `Dynamic Topic [${cefrLevel}]: Discuss a recent challenge you faced and how you resolved it.`,
      keywords: ["challenge", "resolution", "experience"]
    };
  }
}