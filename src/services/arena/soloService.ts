// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface SoloTopic {
  title: string;
  promptText: string;
  keywords: string[];
}

// KHO ĐỀ PHÂN HÓA RÕ RỆT CHO 6 CẤP ĐỘ CEFR KHI MẤT MẠNG / KHÔNG GỌI ĐƯỢC API
const DYNAMIC_FALLBACKS: Record<string, SoloTopic[]> = {
  A1: [
    { title: "Solo Pulse [A1]", promptText: "Describe your favorite hobby and why you like it. / Hãy mô tả sở thích yêu thích của bạn.", keywords: ["hobby", "free time"] },
    { title: "Solo Pulse [A1]", promptText: "Talk about your best friend and what they look like. / Hãy kể về người bạn thân nhất của bạn.", keywords: ["friend", "appearance"] }
  ],
  A2: [
    { title: "Solo Pulse [A2]", promptText: "Describe a memorable family holiday or weekend trip. / Kể về một chuyến đi chơi đáng nhớ cùng gia đình.", keywords: ["family", "vacation"] },
    { title: "Solo Pulse [A2]", promptText: "Talk about your typical weekday routine at school or work. / Nói về lịch trình ngày thường của bạn.", keywords: ["daily", "routine"] }
  ],
  B1: [
    { title: "Solo Pulse [B1]", promptText: "Do you prefer living in a big city or the countryside? / Bạn thích sống ở thành phố lớn hay nông thôn hơn?", keywords: ["city", "countryside", "lifestyle"] },
    { title: "Solo Pulse [B1]", promptText: "Discuss the pros and cons of shopping online versus in physical stores. / Thảo luận ưu nhược điểm mua sắm online.", keywords: ["shopping", "convenience"] }
  ],
  B2: [
    { title: "Solo Pulse [B2]", promptText: "Discuss the economic and social impacts of remote work on modern urban development.", keywords: ["remote work", "urbanization", "economy"] },
    { title: "Solo Pulse [B2]", promptText: "Analyze how social media algorithm personalization influences public opinion.", keywords: ["social media", "algorithms", "opinion"] }
  ],
  C1: [
    { title: "Solo Pulse [C1]", promptText: "Critically evaluate the ethical dilemmas surrounding corporate surveillance and data privacy in the digital age.", keywords: ["surveillance", "data privacy", "ethics"] },
    { title: "Solo Pulse [C1]", promptText: "Assess the viability of renewable energy transitions in developing nations facing fiscal constraints.", keywords: ["renewable energy", "sustainability", "fiscal"] }
  ],
  C2: [
    { title: "Solo Pulse [C2]", promptText: "Examine the epistemological implications of artificial intelligence on human cognitive autonomy and existential philosophy.", keywords: ["epistemology", "AI", "existentialism"] },
    { title: "Solo Pulse [C2]", promptText: "Deconstruct the geopolitical tension between space resource commercialization and international maritime law governance.", keywords: ["geopolitics", "space law", "governance"] }
  ]
};

export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  const randomSeed = Math.random().toString(36).substring(7) + "_" + Date.now();

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1') {
    languageRule = `- LANGUAGE: BILINGUAL (English prompt + Vietnamese translation).`;
  } else if (cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: 100% ENGLISH. Professional tone.`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED ACADEMIC / PHILOSOPHICAL ENGLISH. No Vietnamese translation.`;
  }

  const prompt = `Generate a UNIQUE Solo Speaking Topic for CEFR Level ${cefrLevel}.
Unique ID: ${randomSeed}

RULES:
${languageRule}

Return ONLY JSON:
{
  "title": "Solo Topic [${cefrLevel}]",
  "promptText": "Prompt text strictly matching difficulty level ${cefrLevel}",
  "keywords": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95, // Tăng độ sáng tạo để luôn sinh đề ngẫu nhiên
      response_format: { type: 'json_object' },
    });

    const parsed: SoloTopic = JSON.parse(response.choices[0]?.message?.content || '{}');
    const levelList = DYNAMIC_FALLBACKS[cefrLevel] || DYNAMIC_FALLBACKS['A1'];
    const randomFallback = levelList[Math.floor(Math.random() * levelList.length)];

    return {
      title: parsed.title || randomFallback.title,
      promptText: parsed.promptText || randomFallback.promptText,
      keywords: parsed.keywords || randomFallback.keywords
    };
  } catch (error) {
    console.warn(`Groq Solo Error on level ${cefrLevel}, picking dynamic fallback:`, error);
    const levelList = DYNAMIC_FALLBACKS[cefrLevel] || DYNAMIC_FALLBACKS['A1'];
    return levelList[Math.floor(Math.random() * levelList.length)];
  }
}