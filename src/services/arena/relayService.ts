// src/services/arena/relayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RelayChallenge {
  id: string;
  topic: string;
  context: string;
  player1Guideline: string;
  player2Guideline: string;
  keyVocabulary: string[];
}

// 🧠 1. GẮN BỘ NHỚ LỊCH SỬ PHIÊN HỌC CHO RELAY
const sessionUsedRelayTexts: Set<string> = new Set();

export function clearRelayHistory() {
  sessionUsedRelayTexts.clear();
}

// KHO ĐỀ DYNAMIC FALLBACK PHÂN HÓA THEO CEFR
const DYNAMIC_RELAY_FALLBACKS: Record<string, RelayChallenge[]> = {
  A1: [
    {
      id: 'relay_a1_1',
      topic: "Daily Habits [A1]",
      context: "Chia sẻ về thói quen sinh hoạt hàng ngày của hai bạn.",
      player1Guideline: "Nói về giờ thức dậy và món ăn sáng yêu thích.",
      player2Guideline: "Kể về hoạt động giải trí bạn hay làm vào buổi tối.",
      keyVocabulary: ["morning", "breakfast", "hobby"]
    },
    {
      id: 'relay_a1_2',
      topic: "Favorite Seasons [A1]",
      context: "Thảo luận về thời tiết và mùa yêu thích trong năm.",
      player1Guideline: "Mô tả thời tiết mùa hè và hoạt động bạn thích.",
      player2Guideline: "Nói về mùa đông và trang phục bạn hay mặc.",
      keyVocabulary: ["summer", "winter", "weather"]
    }
  ],
  B2: [
    {
      id: 'relay_b2_1',
      topic: "AI in Corporate Workplaces [B2]",
      context: "Debating the adoption of automated AI tools in business operations.",
      player1Guideline: "Highlight productivity gains and cost efficiency.",
      player2Guideline: "Address data privacy risks and staff training hurdles.",
      keyVocabulary: ["automation", "efficiency", "privacy"]
    },
    {
      id: 'relay_b2_2',
      topic: "Remote Work vs Office Work [B2]",
      context: "Comparing team collaboration in remote vs in-office environments.",
      player1Guideline: "Present arguments favoring remote work flexibility.",
      player2Guideline: "Highlight the value of face-to-face team synergy.",
      keyVocabulary: ["collaboration", "flexibility", "synergy"]
    }
  ],
  C2: [
    {
      id: 'relay_c2_1',
      topic: "Algorithmic Governance [C2]",
      context: "Debating automated legal sentencing and judicial AI systems.",
      player1Guideline: "Advocate for objective, bias-reduced statistical sentencing frameworks.",
      player2Guideline: "Deconstruct the loss of judicial empathy and systemic algorithmic bias.",
      keyVocabulary: ["algorithmic bias", "jurisprudence", "cognitive autonomy"]
    }
  ]
};

export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  // ⚡ 2. DYNAMIC REQUEST SEED CHỐNG CACHE GROQ
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const excludedList = Array.from(sessionUsedRelayTexts).join(' | ');

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for guidelines and context. Simple English patterns in brackets.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL (English text first, followed by Vietnamese explanation).`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED ACADEMIC ENGLISH for high-level debate. No Vietnamese.`;
  }

  const prompt = `Generate ONE UNIQUE 2-Player Speaking Relay Challenge for CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}

CRITICAL UNIQUENESS RULE:
Do NOT generate any of these topics previously used in this session:
[ ${excludedList || 'None'} ]

RULES:
${languageRule}

Return ONLY a valid JSON object:
{
  "topic": "Topic Name [${cefrLevel}]",
  "context": "Context text matching level ${cefrLevel}",
  "player1Guideline": "Player 1 guideline matching language rule",
  "player2Guideline": "Player 2 guideline matching language rule",
  "keyVocabulary": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.98,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const topicText = parsed.topic || `Relay [${cefrLevel}] ${dynamicSeed}`;

    sessionUsedRelayTexts.add(topicText.toLowerCase());

    return {
      id: `relay_${dynamicSeed}`,
      topic: topicText,
      context: parsed.context || "Discussing current social trends.",
      player1Guideline: parsed.player1Guideline || "Express your initial stance.",
      player2Guideline: parsed.player2Guideline || "Elaborate with counterarguments.",
      keyVocabulary: parsed.keyVocabulary || ["discussion", "perspective"]
    };
  } catch (error) {
    console.warn(`Groq Relay Error on level ${cefrLevel}, applying fallback:`, error);
    
    const fallbackList = DYNAMIC_RELAY_FALLBACKS[cefrLevel] || DYNAMIC_RELAY_FALLBACKS['A1'];
    const unusedFallbacks = fallbackList.filter(item => !sessionUsedRelayTexts.has(item.topic.toLowerCase()));
    
    const selected = unusedFallbacks.length > 0
      ? unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)]
      : fallbackList[Math.floor(Math.random() * fallbackList.length)];

    sessionUsedRelayTexts.add(selected.topic.toLowerCase());
    return selected;
  }
}