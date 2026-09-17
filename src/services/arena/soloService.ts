// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });
const STORAGE_KEY_SOLO = '@vibespeak_history_arena_tier1_solo_v1';

export interface SoloTopic {
  title: string;
  promptText: string;
  keywords: string[];
}

async function getSoloHistory(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_SOLO);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveSoloHistory(title: string): Promise<void> {
  try {
    const history = await getSoloHistory();
    const clean = title.toLowerCase().trim();
    if (!history.includes(clean)) {
      history.push(clean);
      if (history.length > 50) history.shift();
      await AsyncStorage.setItem(STORAGE_KEY_SOLO, JSON.stringify(history));
    }
  } catch (e) { console.error(e); }
}

export async function generateSoloTopic(cefrLevel: string = 'B2'): Promise<SoloTopic> {
  const history = await getSoloHistory();
  const excludeList = history.join(', ');

  const prompt = `You are an AI Business Pitch Coach for Solo Arena (Tier 1).
Generate ONE UNIQUE 30-second Elevator Pitch topic.
- FORBIDDEN TOPICS: [${excludeList}].

Return ONLY JSON:
{
  "title": "AI Cyber Specialist Pitch",
  "promptText": "Explain how your product protects user identity in a decentralized web.",
  "keywords": ["decentralized", "encryption", "privacy"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const parsed: SoloTopic = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (parsed.title) await saveSoloHistory(parsed.title);
    return parsed;
  } catch (error) {
    return {
      title: "AI Education Pitch",
      promptText: "Pitch your ideas on using AI to revolutionize pronunciation learning.",
      keywords: ["gamification", "phonetics", "speech recognition"]
    };
  }
}