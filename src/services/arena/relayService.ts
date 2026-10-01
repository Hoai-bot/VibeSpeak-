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

const sessionUsedRelayTexts: Set<string> = new Set();

export function clearRelayHistory() {
  sessionUsedRelayTexts.clear();
}

const DYNAMIC_RELAY_FALLBACKS: Record<string, RelayChallenge[]> = {
  A1: [
    {
      id: 'relay_a1_1',
      topic: "Daily Routine / Thói quen hàng ngày [A1]",
      context: "Discuss your morning and evening activities. / Thảo luận về các hoạt động buổi sáng và buổi tối của bạn.",
      player1Guideline: "Talk about what time you wake up and eat breakfast. / Nói về giờ bạn thức dậy và ăn sáng.",
      player2Guideline: "Talk about what you do in the evening before bed. / Nói về những việc bạn làm vào buổi tối trước khi đi ngủ.",
      keyVocabulary: ["morning", "breakfast", "bedtime"]
    }
  ],
  B2: [
    {
      id: 'relay_b2_1',
      topic: "Corporate AI Integration [B2]",
      context: "Debating the adoption of automated AI systems in workplace environments.",
      player1Guideline: "Highlight productivity gains and cost efficiency.",
      player2Guideline: "Address data privacy risks and staff displacement concerns.",
      keyVocabulary: ["automation", "efficiency", "privacy"]
    }
  ]
};

export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const excludedList = Array.from(sessionUsedRelayTexts).join(' | ');

  let levelInstruction = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1') {
    levelInstruction = `LEVEL ${cefrLevel} MANDATORY RULE:
- EVERY field (topic, context, player1Guideline, player2Guideline) MUST BE BILINGUAL.
- Format: "English text / Bản dịch tiếng Việt"
- Grammar and vocabulary must be extremely simple matching CEFR ${cefrLevel}.`;
  } else {
    levelInstruction = `LEVEL ${cefrLevel} MANDATORY RULE:
- 100% ADVANCED ACADEMIC / BUSINESS ENGLISH ONLY. NO VIETNAMESE.`;
  }

  const prompt = `Generate ONE UNIQUE 2-Player Speaking Relay Challenge for CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}

EXCLUDED PREVIOUS TOPICS:
[ ${excludedList || 'None'} ]

${levelInstruction}

Return ONLY JSON:
{
  "topic": "Topic Title [${cefrLevel}]",
  "context": "Context text matching level rule",
  "player1Guideline": "Player 1 guideline matching level rule",
  "player2Guideline": "Player 2 guideline matching level rule",
  "keyVocabulary": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const topicText = parsed.topic || `Relay [${cefrLevel}] ${dynamicSeed}`;

    sessionUsedRelayTexts.add(topicText.toLowerCase());

    return {
      id: `relay_${dynamicSeed}`,
      topic: topicText,
      context: parsed.context || "Discussing daily activities / Thảo luận hoạt động hàng ngày",
      player1Guideline: parsed.player1Guideline || "Express your main point / Nêu ý chính của bạn",
      player2Guideline: parsed.player2Guideline || "Add supporting details / Bổ sung chi tiết",
      keyVocabulary: parsed.keyVocabulary || ["discussion", "idea"]
    };
  } catch (error) {
    console.warn(`Groq Relay Error, applying fallback for ${cefrLevel}:`, error);
    const fallbackList = DYNAMIC_RELAY_FALLBACKS[cefrLevel] || DYNAMIC_RELAY_FALLBACKS['A1'];
    const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    sessionUsedRelayTexts.add(selected.topic.toLowerCase());
    return selected;
  }
}