// src/services/drills/tier1Service.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrillItem } from '../aiGenerator';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });
const STORAGE_KEY_TIER1 = '@vibespeak_history_tier1_v1';

async function getTier1History(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_TIER1);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveTier1History(target: string): Promise<void> {
  try {
    const history = await getTier1History();
    const clean = target.toLowerCase().trim();
    if (!history.includes(clean)) {
      history.push(clean);
      if (history.length > 80) history.shift();
      await AsyncStorage.setItem(STORAGE_KEY_TIER1, JSON.stringify(history));
    }
  } catch (e) { console.error(e); }
}

export async function generateTier1Drill(cefrLevel: string, topicContext: string): Promise<DrillItem> {
  const history = await getTier1History();
  const excludeList = history.join(', ');

  const prompt = `You are a Senior Phonetics Expert. Generate ONE UNIQUE Minimal Pair item for Tier 1.
- CEFR Level: ${cefrLevel}
- Context: ${topicContext}

STRICT TIER 1 RULES:
1. "target" MUST be EXACTLY TWO contrasting words separated by slash: "WordA / WordB" (e.g., "Ship / Sheep", "Server / Sever", "Probe / Prove").
2. "phonetics" MUST strictly follow Cambridge/Oxford IPA rules:
   * "Sever" MUST BE /ˈsev.ər/ (vowel /e/, NOT /siːvər/).
   * "Server" MUST BE /ˈsɜː.vər/.
   * "Prove" MUST BE /pruːv/, "Probe" MUST BE /prəʊb/.
3. ABSOLUTELY FORBIDDEN PAIRS (DO NOT REPEAT): [${excludeList}].

Return ONLY JSON:
{
  "target": "Server / Sever",
  "phonetics": "/ˈsɜː.vər/ - /ˈsev.ər/",
  "meaning": "Máy chủ / Cắt đứt",
  "tip": "Server dùng âm /ɜː/ dài, Sever dùng âm /e/ ngắn.",
  "spokenText": "Server Sever",
  "cefrLevel": "${cefrLevel}"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const parsed: DrillItem = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (parsed.target) await saveTier1History(parsed.target);
    return { ...parsed, spokenText: parsed.spokenText || parsed.target };
  } catch (error) {
    const fallbacks = [
      { target: "Ship / Sheep", phonetics: "/ʃɪp/ - /ʃiːp/", meaning: "Con tàu / Con cừu", tip: "Âm /ɪ/ ngắn bật nhanh, /iː/ kéo dài.", spokenText: "Ship Sheep" },
      { target: "Light / Night", phonetics: "/laɪt/ - /naɪt/", meaning: "Ánh sáng / Đêm", tip: "Phân biệt âm đầu /l/ và /n/.", spokenText: "Light Night" }
    ];
    return { ...fallbacks[Math.floor(Math.random() * fallbacks.length)], cefrLevel };
  }
}