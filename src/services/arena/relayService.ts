// src/services/arena/relayService.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });
const STORAGE_KEY_RELAY = '@vibespeak_history_arena_tier2_relay_v1';

export interface RelayChallenge {
  topic: string;
  context: string;
  player1Guideline: string;
  player2Guideline: string;
  keyVocabulary: string[];
}

export async function generateRelayChallenge(cefrLevel: string = 'B2'): Promise<RelayChallenge> {
  let levelRules = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    levelRules = `- Level EASY (${cefrLevel}): Everyday topics (hobbies, food, daily plans). Simple guidelines.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    levelRules = `- Level INTERMEDIATE (${cefrLevel}): Education, technology, workplace issues. Business-lite guidelines.`;
  } else {
    levelRules = `- Level ADVANCED (${cefrLevel}/C2): Executive pitches, AI startup strategies, global market trends. Complex guidelines.`;
  }

  const prompt = `You are a 2-Player Open Speaking Relay Challenge Generator for CEFR ${cefrLevel}.
Create ONE unified topic where 2 players collaborate to complete a 60-second discussion/pitch (~30s each).

${levelRules}

Return ONLY JSON:
{
  "topic": "Topic Name",
  "context": "Brief context or problem statement",
  "player1Guideline": "What Player 1 should discuss in 30s",
  "player2Guideline": "What Player 2 should discuss in 30s",
  "keyVocabulary": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const parsed: RelayChallenge = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Bọc dữ liệu mặc định tránh undefined gây văng app
    return {
      topic: parsed.topic || `Green Energy Transition [${cefrLevel}]`,
      context: parsed.context || "Discussing how small businesses can adopt sustainable energy solutions.",
      player1Guideline: parsed.player1Guideline || "Player 1 (30s): Explain why traditional energy is getting too expensive.",
      player2Guideline: parsed.player2Guideline || "Player 2 (30s): Propose switching to solar power and highlight benefits.",
      keyVocabulary: parsed.keyVocabulary || ["sustainability", "renewable energy", "cost-effective"]
    };
  } catch (error) {
    return {
      topic: `Green Energy Transition [${cefrLevel}]`,
      context: "Discussing how small businesses can adopt sustainable energy solutions.",
      player1Guideline: "Player 1 (30s): Explain why traditional energy is getting too expensive and harmful.",
      player2Guideline: "Player 2 (30s): Propose switching to solar power and highlight the long-term financial benefits.",
      keyVocabulary: ["sustainability", "renewable energy", "cost-effective"]
    };
  }
}