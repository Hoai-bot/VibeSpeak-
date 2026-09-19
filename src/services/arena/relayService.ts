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
  const isBasic = cefrLevel === 'A1' || cefrLevel === 'A2';

  const prompt = `Generate a 2-Player Speaking Relay Challenge for CEFR Level ${cefrLevel}.

RULES FOR CEFR LEVEL ${cefrLevel}:
${
  isBasic
    ? `- GUIDELINES MUST BE BILINGUAL (Vietnamese explanation + short English sentence pattern).
- Keep sentences extremely simple and practical.
- Example topic: Favorite food, Daily routine, Hobbies.`
    : `- Guidelines must be fully in English with intermediate/advanced professional communication goals.`
}

Return ONLY a valid JSON object:
{
  "topic": "Topic Name",
  "context": "${isBasic ? 'Context in Vietnamese / Bối cảnh ngắn bằng tiếng Việt' : 'Short context in English'}",
  "player1Guideline": "${isBasic ? 'Hướng dẫn Bạn 1 bằng tiếng Việt + [Mẫu câu TA ngắn]' : 'Player 1 guideline in English'}",
  "player2Guideline": "${isBasic ? 'Hướng dẫn Bạn 2 bằng tiếng Việt + [Mẫu câu TA ngắn]' : 'Player 2 guideline in English'}",
  "keyVocabulary": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const parsed: RelayChallenge = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      topic: parsed.topic || `Relay Challenge [${cefrLevel}]`,
      context: parsed.context || (isBasic ? "Nói về sở thích ăn uống hàng ngày." : "Discussing workplace remote policies."),
      player1Guideline: parsed.player1Guideline || (isBasic ? "Nêu món ăn bạn thích (Mẫu: My favorite food is...)" : "Introduce problem"),
      player2Guideline: parsed.player2Guideline || (isBasic ? "Nêu lý do vì sao thích (Mẫu: I like it because...)" : "Propose solution"),
      keyVocabulary: parsed.keyVocabulary || ["delicious", "healthy", "favorite"]
    };
  } catch (error) {
    return {
      topic: `Sở thích hàng ngày [${cefrLevel}]`,
      context: "Hai bạn cùng chia sẻ về món ăn yêu thích.",
      player1Guideline: isBasic 
        ? "Nêu tên món ăn bạn thích nhất (Gợi ý: 'I really like eating pizza/pho.')" 
        : "State your main viewpoint.",
      player2Guideline: isBasic 
        ? "Bổ sung lý do hoặc thời điểm ăn món đó (Gợi ý: 'I eat it on weekends because it is delicious.')" 
        : "Support the viewpoint with arguments.",
      keyVocabulary: ["delicious", "favorite", "everyday"]
    };
  }
}