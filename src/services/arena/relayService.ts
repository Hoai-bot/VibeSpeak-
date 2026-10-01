// src/services/arena/relayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RelayChallenge {
  topic: string;
  context: string;
  player1Guideline: string;
  player2Guideline: string;
  keyVocabulary: string[];
}

// 🎯 KHO ĐỀ DYNAMIC FALLBACK CHO RELAY THEO TỪNG LEVEL
const DYNAMIC_RELAY_FALLBACKS: Record<string, RelayChallenge[]> = {
  A1: [
    {
      topic: "Daily Habits [A1]",
      context: "Chia sẻ về thói quen sinh hoạt hàng ngày của hai bạn.",
      player1Guideline: "Nói về giờ thức dậy và món ăn sáng yêu thích.",
      player2Guideline: "Kể về hoạt động giải trí bạn hay làm vào buổi tối.",
      keyVocabulary: ["morning", "breakfast", "hobby"]
    },
    {
      topic: "Favorite Seasons [A1]",
      context: "Thảo luận về thời tiết và mùa yêu thích trong năm.",
      player1Guideline: "Mô tả thời tiết mùa hè và hoạt động bạn thích.",
      player2Guideline: "Nói về mùa đông và trang phục bạn hay mặc.",
      keyVocabulary: ["summer", "winter", "weather"]
    }
  ],
  A2: [
    {
      topic: "Weekend Shopping [A2]",
      context: "Kế hoạch đi mua sắm quần áo và đồ dùng vào cuối tuần.",
      player1Guideline: "Đề xuất trung tâm thương mại và mặt hàng cần mua.",
      player2Guideline: "Đưa ra ý kiến về ngân sách và thời gian đi.",
      keyVocabulary: ["shopping", "budget", "mall"]
    }
  ],
  B1: [
    {
      topic: "Travel Experiences [B1]",
      context: "Comparing backpacking trips versus luxury resort vacations.",
      player1Guideline: "Present arguments for backpacking and freedom. / Nêu ưu điểm du lịch phượt.",
      player2Guideline: "Highlight benefits of relaxation in resort stays. / Nêu điểm tốt khi nghỉ dưỡng.",
      keyVocabulary: ["backpacking", "resort", "itinerary"]
    }
  ],
  B2: [
    {
      topic: "AI in Corporate Workplaces [B2]",
      context: "Debating the adoption of automated AI tools in business operations.",
      player1Guideline: "Highlight productivity gains and cost efficiency.",
      player2Guideline: "Address data privacy risks and staff training hurdles.",
      keyVocabulary: ["automation", "efficiency", "privacy"]
    }
  ],
  C1: [
    {
      topic: "Urban Gentrification Ethics [C1]",
      context: "Evaluating urban renewal projects in historic city centers.",
      player1Guideline: "Argue for economic revitalization and infrastructure upgrades.",
      player2Guideline: "Critique the displacement of long-term lower-income residents.",
      keyVocabulary: ["gentrification", "infrastructure", "displacement"]
    }
  ],
  C2: [
    {
      topic: "Algorithmic Governance [C2]",
      context: "Debating automated legal sentencing and judicial AI systems.",
      player1Guideline: "Advocate for objective, bias-reduced statistical sentencing frameworks.",
      player2Guideline: "Deconstruct the loss of judicial empathy and systemic algorithmic bias.",
      keyVocabulary: ["algorithmic bias", "jurisprudence", "cognitive autonomy"]
    }
  ]
};

export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  const randomSeed = Math.random().toString(36).substring(7) + "_" + Date.now();

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for guidelines and context. Provide simple English sentence patterns in brackets.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL (English text first, followed by Vietnamese explanation).`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED ACADEMIC / PHILOSOPHICAL ENGLISH. High-level debate.`;
  }

  const prompt = `Generate a UNIQUE 2-Player Speaking Relay Challenge for CEFR Level ${cefrLevel}.
Request Seed: ${randomSeed}

RULES:
${languageRule}

Return ONLY a valid JSON object:
{
  "topic": "Topic Name [${cefrLevel}]",
  "context": "Context text matching language rule and level difficulty",
  "player1Guideline": "Player 1 guideline matching language rule",
  "player2Guideline": "Player 2 guideline matching language rule",
  "keyVocabulary": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const parsed: RelayChallenge = JSON.parse(response.choices[0]?.message?.content || '{}');
    const levelList = DYNAMIC_RELAY_FALLBACKS[cefrLevel] || DYNAMIC_RELAY_FALLBACKS['A1'];
    const randomFallback = levelList[Math.floor(Math.random() * levelList.length)];

    return {
      topic: parsed.topic || randomFallback.topic,
      context: parsed.context || randomFallback.context,
      player1Guideline: parsed.player1Guideline || randomFallback.player1Guideline,
      player2Guideline: parsed.player2Guideline || randomFallback.player2Guideline,
      keyVocabulary: parsed.keyVocabulary || randomFallback.keyVocabulary
    };
  } catch (error) {
    console.warn(`Groq Relay Error on level ${cefrLevel}, applying fallback:`, error);
    const levelList = DYNAMIC_RELAY_FALLBACKS[cefrLevel] || DYNAMIC_RELAY_FALLBACKS['A1'];
    return levelList[Math.floor(Math.random() * levelList.length)];
  }
}