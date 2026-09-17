// src/services/drills/tier3Service.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrillItem } from '../aiGenerator';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });
const STORAGE_KEY_TIER3 = '@vibespeak_history_tier3_v1';

async function getTier3History(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_TIER3);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveTier3History(target: string): Promise<void> {
  try {
    const history = await getTier3History();
    const clean = target.toLowerCase().trim();
    if (!history.includes(clean)) {
      history.push(clean);
      if (history.length > 50) history.shift();
      await AsyncStorage.setItem(STORAGE_KEY_TIER3, JSON.stringify(history));
    }
  } catch (e) { console.error(e); }
}

export async function generateTier3Drill(cefrLevel: string, topicContext: string): Promise<DrillItem> {
  const history = await getTier3History();
  const excludeList = history.join(', ');

  const prompt = `You are a Phonetics Expert. Generate ONE UNIQUE, HIGHLY CHALLENGING English Tongue Twister for Tier 3.
- CEFR Level: ${cefrLevel}
- Context: ${topicContext}

STRICT TIER 3 RULES:
1. "target" MUST be a genuine, fun English Tongue Twister (6-12 words).
2. "phonetics" MUST strictly follow Cambridge/Oxford IPA rules for every single word.
3. ABSOLUTELY FORBIDDEN TARGETS (DO NOT REPEAT): [${excludeList}].

Return ONLY JSON:
{
  "target": "She sells seashells by the seashore",
  "phonetics": "/ʃiː selz ˈsiːʃelz baɪ ðə ˈsiːʃɔː/",
  "meaning": "Cô ấy bán vỏ sò trên bờ biển",
  "tip": "Chú ý chuyển đổi liên tục giữa âm /ʃ/ (uốn lưỡi) và /s/ (răng kẹp).",
  "spokenText": "She sells seashells by the seashore",
  "cefrLevel": "${cefrLevel}"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const parsed: DrillItem = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (parsed.target) await saveTier3History(parsed.target);
    return { ...parsed, spokenText: parsed.spokenText || parsed.target };
  } catch (error) {
    const fallbacks = [
      { target: "Six slippery snails slid slowly seaward", phonetics: "/sɪks ˈslɪpəri sneɪlz slɪd ˈsləʊli ˈsiːwəd/", meaning: "Sáu con ốc sên trơn trượt bò chậm rãi ra biển", tip: "Tập trung vào chuỗi phụ âm /sl/ và /s/.", spokenText: "Six slippery snails slid slowly seaward" },
      { target: "Fresh fried fish fish fresh fried", phonetics: "/freʃ fraɪd fɪʃ fɪʃ freʃ fraɪd/", meaning: "Cá rán tươi", tip: "Luyện bật hơi phụ âm /fr/ liên tục.", spokenText: "Fresh fried fish fish fresh fried" }
    ];
    return { ...fallbacks[Math.floor(Math.random() * fallbacks.length)], cefrLevel };
  }
}