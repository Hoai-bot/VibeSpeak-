// src/services/arena/relayService.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });
const STORAGE_KEY_RELAY = '@vibespeak_history_arena_tier2_relay_v1';

export interface RelayChallenge {
  topic: string;
  player1Prompt: string;
  player2Prompt: string;
  scoringFocus: string;
}

async function getRelayHistory(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_RELAY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveRelayHistory(topic: string): Promise<void> {
  try {
    const history = await getRelayHistory();
    const clean = topic.toLowerCase().trim();
    if (!history.includes(clean)) {
      history.push(clean);
      if (history.length > 50) history.shift();
      await AsyncStorage.setItem(STORAGE_KEY_RELAY, JSON.stringify(history));
    }
  } catch (e) { console.error(e); }
}

export async function generateRelayChallenge(cefrLevel: string = 'B2'): Promise<RelayChallenge> {
  const history = await getRelayHistory();
  const excludeList = history.join(', ');

  const prompt = `You are a 2-Player Real-Human PvP Relay Challenge Generator for Tier 2.
Generate ONE UNIQUE 2-part conversation/pitch challenge for Player 1 and Player 2.

RULES:
1. Player 1 presents the problem/challenge sentence.
2. Player 2 counters with the solution/pitch sentence immediately.
3. FORBIDDEN TOPICS: [${excludeList}].

Return ONLY JSON:
{
  "topic": "EdTech Pitch Relay",
  "player1Prompt": "Traditional learning methods are getting outdated and slow for students.",
  "player2Prompt": "That is why we built VibeSpeak to gamify English learning experience.",
  "scoringFocus": "Nối nhịp giao tiếp mượt mà, phản xạ tự nhiên giữa 2 người chơi."
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const parsed: RelayChallenge = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (parsed.topic) await saveRelayHistory(parsed.topic);
    return parsed;
  } catch (error) {
    return {
      topic: "Startup Idea Relay",
      player1Prompt: "High-level English skills are in high demand for international tech jobs.",
      player2Prompt: "Our platform provides real-time AI voice feedback to bridge that gap.",
      scoringFocus: "Phối hợp ăn ý và giữ độ mượt mà khi đổi lượt nói."
    };
  }
}