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
  let languageRule = '';

  if (cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1') {
    languageRule = `- LANGUAGE: BILINGUAL (English prompt + Vietnamese translation/explanation).
- Prompt Example: "Talk about your favorite morning routine. / Hãy nói về thói quen buổi sáng yêu thích của bạn."`;
  } else {
    languageRule = `- LANGUAGE: 100% ENGLISH. Use complex professional/academic topics without Vietnamese translation.`;
  }

  const prompt = `Generate ONE Solo Speaking Topic for CEFR Level ${cefrLevel}.

RULES FOR CEFR LEVEL ${cefrLevel}:
${languageRule}

Return ONLY a valid JSON object:
{
  "title": "Topic Title",
  "promptText": "Prompt text matching language rule",
  "keywords": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const parsed: SoloTopic = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      title: parsed.title || `Solo Pulse [${cefrLevel}]`,
      promptText: parsed.promptText || (cefrLevel === 'B2' || cefrLevel === 'C1' 
        ? "Analyze the impact of artificial intelligence on modern communication skills."
        : "Describe your dream vacation destination. / Hãy mô tả điểm đến kỳ nghỉ trong mơ của bạn."),
      keywords: parsed.keywords || ["routine", "favorite", "daily"]
    };
  } catch (error) {
    return {
      title: `Thách đấu Solo [${cefrLevel}]`,
      promptText: cefrLevel === 'B2' || cefrLevel === 'C1'
        ? "Discuss the advantages and disadvantages of remote working in the global economy."
        : "Describe your favorite hobby and why you like it. / Hãy mô tả sở thích yêu thích của bạn và lý do bạn thích nó.",
      keywords: ["hobby", "interest", "lifestyle"]
    };
  }
}