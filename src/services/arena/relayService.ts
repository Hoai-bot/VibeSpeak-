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

export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  const randomSeed = Math.random().toString(36).substring(7) + "_" + Date.now();

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for guidelines and context.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL (English text first, followed by Vietnamese explanation).`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED ACADEMIC ENGLISH for high-level debate.`;
  }

  const prompt = `Generate a NEW 2-Player Speaking Relay Challenge for CEFR Level ${cefrLevel}.
Request ID: ${randomSeed}

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
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const parsed: RelayChallenge = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      topic: parsed.topic || `Relay Challenge [${cefrLevel}]`,
      context: parsed.context || "Discussing current social trends.",
      player1Guideline: parsed.player1Guideline || "Express your initial stance.",
      player2Guideline: parsed.player2Guideline || "Elaborate with counterarguments.",
      keyVocabulary: parsed.keyVocabulary || ["discussion", "perspective"]
    };
  } catch (error) {
    return {
      topic: `Relay Challenge [${cefrLevel}]`,
      context: "Debating the impact of modern technology on human interaction.",
      player1Guideline: "State your main viewpoint.",
      player2Guideline: "Provide supporting examples.",
      keyVocabulary: ["technology", "society", "impact"]
    };
  }
}