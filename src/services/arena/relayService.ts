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
  let languageRule = '';

  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for guidelines and context. Provide simple English sentence patterns in brackets.
- Example player1Guideline: "Trình bày món ăn yêu thích của bạn (Mẫu câu: My favorite food is...)"`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL (English text first, followed by Vietnamese explanation).
- Example player1Guideline: "State your main perspective on remote work. / Nêu quan điểm chính của bạn về làm việc từ xa."`;
  } else {
    languageRule = `- LANGUAGE: 100% ENGLISH. Use advanced professional communication goals and complex guidelines.`;
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
      model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const parsed: RelayChallenge = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      topic: parsed.topic || `Relay Challenge [${cefrLevel}]`,
      context: parsed.context || (cefrLevel.startsWith('A') ? "Bối cảnh: Thảo luận về thói quen hàng ngày." : "Discussing corporate sustainability strategies."),
      player1Guideline: parsed.player1Guideline || "Nêu ý kiến chính của bạn.",
      player2Guideline: parsed.player2Guideline || "Bổ sung lập luận hoặc ví dụ.",
      keyVocabulary: parsed.keyVocabulary || ["topic", "idea", "support"]
    };
  } catch (error) {
    return {
      topic: `Chủ đề Relay [${cefrLevel}]`,
      context: cefrLevel.startsWith('A') ? "Cùng chia sẻ về sở thích cá nhân." : "Discussing workplace communication.",
      player1Guideline: cefrLevel.startsWith('A') ? "Giới thiệu ý kiến của bạn (Mẫu: I think that...)" : "Introduce your main perspective.",
      player2Guideline: cefrLevel.startsWith('A') ? "Đưa ra lý do ủng hộ (Mẫu: Because it helps...)" : "Elaborate with supporting arguments.",
      keyVocabulary: ["communication", "perspective", "solution"]
    };
  }
}