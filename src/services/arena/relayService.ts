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

const FALLBACK_RELAY: Record<string, RelayChallenge> = {
  A1: {
    topic: "Daily Routine [A1]",
    context: "Chia sẻ về thói quen sinh hoạt hàng ngày của bạn.",
    player1Guideline: "Giới thiệu thời gian bạn thức dậy và ăn sáng.",
    player2Guideline: "Kể về các hoạt động bạn thường làm vào buổi tối.",
    keyVocabulary: ["morning", "breakfast", "evening"]
  },
  B2: {
    topic: "Workplace Automation [B2]",
    context: "Discussing the role of automation in corporate productivity.",
    player1Guideline: "Present the benefits of AI automation for daily workflow.",
    player2Guideline: "Address potential risks regarding job displacement.",
    keyVocabulary: ["automation", "productivity", "displacement"]
  },
  C2: {
    topic: "Bioethics & Genetic Editing [C2]",
    context: "Debating the ethical boundaries of CRISPR technology in human enhancement.",
    player1Guideline: "Argue in favor of genetic interventions to eradicate hereditary illnesses.",
    player2Guideline: "Critique the socio-economic disparities and slippery slope of engineered offspring.",
    keyVocabulary: ["bioethics", "CRISPR", "hereditary", "disparities"]
  }
};

export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  let languageRule = '';

  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for guidelines and context. Simple English sentence patterns in brackets.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL (English text first, followed by Vietnamese explanation).`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED ACADEMIC ENGLISH for high-level debate and critical discourse.`;
  }

  const prompt = `Generate a 2-Player Speaking Relay Challenge for CEFR Level ${cefrLevel}.

RULES:
${languageRule}

Return ONLY a valid JSON object:
{
  "topic": "Topic Name",
  "context": "Context text matching language rule",
  "player1Guideline": "Player 1 guideline matching language rule",
  "player2Guideline": "Player 2 guideline matching language rule",
  "keyVocabulary": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const parsed: RelayChallenge = JSON.parse(response.choices[0]?.message?.content || '{}');
    const fallback = FALLBACK_RELAY[cefrLevel] || FALLBACK_RELAY['A1'];

    return {
      topic: parsed.topic || fallback.topic,
      context: parsed.context || fallback.context,
      player1Guideline: parsed.player1Guideline || fallback.player1Guideline,
      player2Guideline: parsed.player2Guideline || fallback.player2Guideline,
      keyVocabulary: parsed.keyVocabulary || fallback.keyVocabulary
    };
  } catch (error) {
    console.warn("Groq Relay Error, using fallback data:", error);
    return FALLBACK_RELAY[cefrLevel] || FALLBACK_RELAY['A1'];
  }
}