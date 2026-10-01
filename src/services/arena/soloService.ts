// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface SoloTopic {
  title: string;
  promptText: string;
  keywords: string[];
}

// 🎯 KHO BÀI TẬP FALLBACK CHUẨN XÁC THEO TỪNG CẤP ĐỘ CEFR
const FALLBACK_TOPICS: Record<string, SoloTopic> = {
  A1: {
    title: "Solo Pulse [A1]",
    promptText: "Describe your favorite hobby and why you like it. / Hãy mô tả sở thích yêu thích của bạn và lý do bạn thích nó.",
    keywords: ["hobby", "like", "free time"]
  },
  A2: {
    title: "Solo Pulse [A2]",
    promptText: "Talk about a memorable trip you took with your family or friends. / Hãy kể về một chuyến đi đáng nhớ với gia đình hoặc bạn bè.",
    keywords: ["trip", "family", "memorable"]
  },
  B1: {
    title: "Solo Pulse [B1]",
    promptText: "Do you think social media has a positive or negative impact on young people? / Bạn nghĩ mạng xã hội có tác động tích cực hay tiêu cực đến giới trẻ?",
    keywords: ["social media", "impact", "youth"]
  },
  B2: {
    title: "Solo Pulse [B2]",
    promptText: "Discuss the advantages and disadvantages of remote working in the modern economy. / Thảo luận về ưu và nhược điểm của việc làm việc từ xa trong nền kinh tế hiện đại.",
    keywords: ["remote work", "economy", "flexibility"]
  },
  C1: {
    title: "Solo Pulse [C1]",
    promptText: "Critically analyze how artificial intelligence might reshape higher education and human intellectual independence.",
    keywords: ["AI", "higher education", "intellectual independence"]
  },
  C2: {
    title: "Solo Pulse [C2]",
    promptText: "Evaluate the geopolitical and philosophical implications of global space colonization versus solving terrestrial climate crises.",
    keywords: ["geopolitics", "space colonization", "climate crisis"]
  }
};

export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  let languageRule = '';

  if (cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1') {
    languageRule = `- LANGUAGE: BILINGUAL (English prompt + Vietnamese translation/explanation).`;
  } else if (cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: 100% ENGLISH. Professional and analytical tone.`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED ENGLISH. Highly academic, philosophical, or geopolitical discourse without any Vietnamese translation.`;
  }

  const prompt = `Generate ONE Solo Speaking Topic strictly tailored to CEFR Level ${cefrLevel}.

RULES FOR CEFR LEVEL ${cefrLevel}:
${languageRule}

Return ONLY a valid JSON object:
{
  "title": "Solo Topic [${cefrLevel}]",
  "promptText": "Prompt text strictly matching the complexity of level ${cefrLevel}",
  "keywords": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const parsed: SoloTopic = JSON.parse(response.choices[0]?.message?.content || '{}');
    const fallback = FALLBACK_TOPICS[cefrLevel] || FALLBACK_TOPICS['A1'];

    return {
      title: parsed.title || fallback.title,
      promptText: parsed.promptText || fallback.promptText,
      keywords: parsed.keywords || fallback.keywords
    };
  } catch (error) {
    console.warn(`Groq Solo Error on level ${cefrLevel}, applying strict fallback:`, error);
    return FALLBACK_TOPICS[cefrLevel] || FALLBACK_TOPICS['A1'];
  }
}