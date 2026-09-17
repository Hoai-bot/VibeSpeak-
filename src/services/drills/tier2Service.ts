// src/services/drills/tier2Service.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrillItem } from '../aiGenerator';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });
const STORAGE_KEY_TIER2 = '@vibespeak_history_tier2_v1';

async function getTier2History(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_TIER2);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveTier2History(target: string): Promise<void> {
  try {
    const history = await getTier2History();
    const clean = target.toLowerCase().trim();
    if (!history.includes(clean)) {
      history.push(clean);
      if (history.length > 80) history.shift();
      await AsyncStorage.setItem(STORAGE_KEY_TIER2, JSON.stringify(history));
    }
  } catch (e) { console.error(e); }
}

export async function generateTier2Drill(cefrLevel: string, topicContext: string): Promise<DrillItem> {
  const history = await getTier2History();
  const excludeList = history.join(', ');

  const prompt = `You are an ELT Materials Designer & Phonetician. Generate ONE UNIQUE Consonant-to-Vowel Linking phrase for Tier 2.
- CEFR Level: ${cefrLevel}
- Context: ${topicContext}

STRICT TIER 2 RULES:
1. "target" MUST be a natural, meaningful spoken phrase of 3-5 words (e.g., "Check it out", "Hold on a second", "Clean it up", "Turn off the engine").
2. NEVER generate nonsensical combinations (e.g., "Hold on a data date").
3. "phonetics" MUST follow strict Cambridge IPA rules:
   * "date" MUST BE /deɪt/ (NEVER /dæt/).
   * "data" MUST BE /ˈdeɪ.tə/.
4. ABSOLUTELY FORBIDDEN PHRASES (DO NOT REPEAT): [${excludeList}].

Return ONLY JSON:
{
  "target": "Hold on a second",
  "phonetics": "/həʊld ɒn ə ˈsek.ənd/",
  "meaning": "Chờ một chút nhé",
  "tip": "Nối âm /d/ trong 'Hold' sang nguyên âm /ɒ/ trong 'on' (Hold-on).",
  "spokenText": "Hold on a second",
  "cefrLevel": "${cefrLevel}"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.85,
      response_format: { type: 'json_object' },
    });

    const parsed: DrillItem = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (parsed.target) await saveTier2History(parsed.target);
    return { ...parsed, spokenText: parsed.spokenText || parsed.target };
  } catch (error) {
    const fallbacks = [
      { target: "Check it out", phonetics: "/tʃek ɪt aʊt/", meaning: "Kiểm tra nó xem", tip: "Nối /k/ sang /ɪ/ (Check-it) và /t/ sang /aʊ/ (it-out).", spokenText: "Check it out" },
      { target: "Turn off the lights", phonetics: "/tɜːn ɒf ðə laɪts/", meaning: "Tắt đèn đi", tip: "Nối âm /n/ trong 'Turn' sang /ɒ/ trong 'off' (Turn-off).", spokenText: "Turn off the lights" }
    ];
    return { ...fallbacks[Math.floor(Math.random() * fallbacks.length)], cefrLevel };
  }
}