// src/services/arena/relayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RelayChallenge {
  id: string;
  topic: string;
  contextEn: string;
  contextVi?: string;
  player1En: string;
  player1Vi?: string;
  player2En: string;
  player2Vi?: string;
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
      topic: "Daily Routine [A1]",
      contextEn: "Discuss your daily schedule.",
      contextVi: "Thảo luận về lịch trình hàng ngày của bạn.",
      player1En: "Talk about your morning routine.",
      player1Vi: "Nói về thói quen buổi sáng của bạn.",
      player2En: "Talk about your evening activities.",
      player2Vi: "Nói về các hoạt động buổi tối của bạn.",
      keyVocabulary: ["morning", "breakfast", "schedule"]
    }
  ],
  B2: [
    {
      id: 'relay_b2_1',
      topic: "Corporate AI Integration [B2]",
      contextEn: "Debating the adoption of automated AI systems in workplace environments.",
      player1En: "Highlight productivity gains and cost efficiency.",
      player2En: "Address data privacy risks and staff displacement concerns.",
      keyVocabulary: ["automation", "efficiency", "privacy"]
    }
  ]
};

export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const excludedList = Array.from(sessionUsedRelayTexts).join(' | ');
  const isLowLevel = cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1';

  const prompt = `Generate ONE UNIQUE 2-Player Speaking Relay Challenge strictly for CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}

EXCLUDED PREVIOUS TOPICS:
[ ${excludedList || 'None'} ]

CRITICAL RULES FOR LEVEL ${cefrLevel}:
${isLowLevel 
  ? `- You MUST provide BOTH English (En) and Vietnamese translation (Vi) for context, player1, and player2. Keep English simple.`
  : `- 100% ADVANCED ACADEMIC / BUSINESS ENGLISH ONLY for En fields. Do NOT provide Vi fields.`
}

Return ONLY JSON:
{
  "topic": "Topic Title [${cefrLevel}]",
  "contextEn": "English context",
  ${isLowLevel ? '"contextVi": "Bản dịch bối cảnh",' : ''}
  "player1En": "English guideline P1",
  ${isLowLevel ? '"player1Vi": "Bản dịch hướng dẫn P1",' : ''}
  "player2En": "English guideline P2",
  ${isLowLevel ? '"player2Vi": "Bản dịch hướng dẫn P2",' : ''}
  "keyVocabulary": ["word1", "word2"]
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
      contextEn: parsed.contextEn || "Discussing daily activities",
      contextVi: parsed.contextVi || undefined,
      player1En: parsed.player1En || "State your opinion",
      player1Vi: parsed.player1Vi || undefined,
      player2En: parsed.player2En || "Add supporting reasons",
      player2Vi: parsed.player2Vi || undefined,
      keyVocabulary: parsed.keyVocabulary || ["discussion", "idea"]
    };
  } catch (error) {
    console.warn(`Groq Relay Error for ${cefrLevel}:`, error);
    const fallbackList = DYNAMIC_RELAY_FALLBACKS[cefrLevel] || DYNAMIC_RELAY_FALLBACKS['A1'];
    const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    sessionUsedRelayTexts.add(selected.topic.toLowerCase());
    return selected;
  }
}