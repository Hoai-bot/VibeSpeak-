// src/services/aiGenerator.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

const groq = new Groq({
  apiKey: ACTIVE_GROQ_KEY,
  dangerouslyAllowBrowser: true,
});

export interface DrillItem {
  target: string;
  phonetics: string;
  meaning: string;
  tip: string;
  spokenText: string;
  cefrLevel?: string;
  isReviewItem?: boolean;
}

const STORAGE_KEY_SRS = '@vibespeak_srs_weak_words';
const STORAGE_KEY_HISTORY = '@vibespeak_global_history_v2';

export async function saveWeakWordToSRS(word: string): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY_SRS);
    const weakList: string[] = existing ? JSON.parse(existing) : [];
    
    if (!weakList.includes(word.toLowerCase())) {
      weakList.push(word.toLowerCase());
      if (weakList.length > 20) weakList.shift();
      await AsyncStorage.setItem(STORAGE_KEY_SRS, JSON.stringify(weakList));
    }
  } catch (error) {
    console.error("❌ Lỗi lưu từ yếu vào SRS:", error);
  }
}

async function getSRSWeakWords(): Promise<string[]> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY_SRS);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    return [];
  }
}

// 🎯 HÀM LƯU VÀ KIỂM TRA LỊCH SỬ CHỐNG LẶP VĨNH VIỄN
async function getGlobalHistory(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveToGlobalHistory(target: string): Promise<void> {
  try {
    const history = await getGlobalHistory();
    const cleanTarget = target.toLowerCase().trim();
    if (!history.includes(cleanTarget)) {
      history.push(cleanTarget);
      // Ghi nhớ tối đa 150 câu/cặp từ gần nhất để tuyệt đối không bị trùng
      if (history.length > 150) history.shift();
      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    }
  } catch (error) {
    console.error("❌ Lỗi lưu history:", error);
  }
}

export async function generateDynamicDrill(
  tier: 1 | 2 | 3,
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' = 'B2',
  topicContext: string = 'Cyberpunk Business & Tech'
): Promise<DrillItem> {
  const globalHistory = await getGlobalHistory();
  const excludeList = globalHistory.join(', ');
  
  const weakWordsList = await getSRSWeakWords();
  const shouldInjectSRS = weakWordsList.length > 0 && Math.random() < 0.2;
  const targetSRSWord = shouldInjectSRS ? weakWordsList[Math.floor(Math.random() * weakWordsList.length)] : null;

  let tierRules = '';
  if (tier === 1) {
    tierRules = `
STRICT FORMAT FOR TIER 1 (Minimal Pairs ONLY):
- "target" MUST be EXACTLY TWO contrasting words separated by slash: "WordA / WordB".
- "phonetics" MUST follow STRICT CAMBRIDGE/OXFORD INTERNATIONAL PHONETICS (IPA).
  * "Sever" MUST BE /ˈsev.ər/, "Server" MUST BE /ˈsɜː.vər/.
  * "Prove" MUST BE /pruːv/, "Probe" MUST BE /prəʊb/.
- DO NOT generate single words, full sentences, or previously used pairs.
- "spokenText" MUST BE ONLY the two target words separated by space: "WordA WordB".
`;
  } else if (tier === 2) {
    tierRules = `
STRICT FORMAT FOR TIER 2 (Consonant-to-Vowel Linking & Meaningful Sentences):
- "target" MUST be a NEW, UNIQUE natural spoken phrase or short sentence of 3-6 words focusing on Consonant-to-Vowel linking (e.g., "Check it out", "Hold on a second", "Clean it up", "Turn off the engine", "Plug in the cable").
- STRICT PHONETIC ACCURACY & SENTENCE SANITY RULES:
  * NEVER generate nonsensical phrases like "Hold on a data date".
  * "date" MUST strictly be /deɪt/. "data" MUST strictly be /ˈdeɪ.tə/.
- In "tip", explicitly explain WHICH consonant links to WHICH vowel in natural Vietnamese.
- "spokenText" MUST be the exact phrase without punctuation.
`;
  } else if (tier === 3) {
    tierRules = `
STRICT FORMAT FOR TIER 3 (Tongue Twisters ONLY):
- "target" MUST be a genuine, challenging, and UNIQUE English Tongue Twister sentence of 6-12 words.
- "phonetics" MUST follow strict Cambridge IPA rules.
- "spokenText" MUST be the full tongue twister sentence without punctuation.
`;
  }

  const prompt = `
You are a Senior Phonetics Expert. Generate ONE 100% UNIQUE practice item for Tier ${tier}.
- CEFR Target: ${cefrLevel}
- Topic Context: ${topicContext}
${targetSRSWord ? `- Review Focus Word: "${targetSRSWord}"` : ''}

${tierRules}

CRITICAL ANTI-REPETITION CONSTRAINT:
DO NOT generate any target that is similar to or contained in this strictly forbidden list: [${excludeList}].
You MUST introduce fresh vocabulary and distinct phonetic combinations!

STRICT ARTICLE & IPA RULES:
- Pronounce "the" as /ðə/ before CONSONANT sounds, and /ði/ ONLY before VOWEL sounds.

Return ONLY a valid JSON object:
{
  "target": "String",
  "phonetics": "String",
  "meaning": "Vietnamese Meaning",
  "tip": "Detailed Vietnamese pronunciation tip",
  "spokenText": "String",
  "cefrLevel": "${cefrLevel}"
}
`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.9, // Tăng độ sáng tạo để luôn sinh ra bài tập mới đa dạng
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed: DrillItem = JSON.parse(content);

    const cleanSpoken = (parsed.spokenText || parsed.target)
      .replace(/\bvs\b/gi, '')
      .replace(/\bversus\b/gi, '')
      .replace(/[\/\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (parsed.target) {
      // Lưu lại vào bộ nhớ thiết bị ngay lập tức
      await saveToGlobalHistory(parsed.target);
    }

    return {
      ...parsed,
      spokenText: cleanSpoken,
      cefrLevel: parsed.cefrLevel || cefrLevel,
      isReviewItem: !!targetSRSWord
    };

  } catch (error) {
    console.error(`❌ Lỗi tạo bài tập Tier ${tier}:`, error);

    const fallbackTier1 = [
      { target: "Light / Night", phonetics: "/laɪt/ - /naɪt/", meaning: "Ánh sáng / Đêm", tip: "Phân biệt âm đầu /l/ và /n/.", spokenText: "Light Night" },
      { target: "Seat / Sheet", phonetics: "/siːt/ - /ʃiːt/", meaning: "Chỗ ngồi / Tấm ga", tip: "Phân biệt âm /s/ và /ʃ/.", spokenText: "Seat Sheet" }
    ];
    const fallbackTier2 = [
      { target: "Turn off the lights", phonetics: "/tɜːn ɒf ðə laɪts/", meaning: "Tắt đèn đi", tip: "Nối âm /n/ trong 'Turn' sang /ɒ/ trong 'off' (Turn-off).", spokenText: "Turn off the lights" },
      { target: "Pick it up right now", phonetics: "/pɪk ɪt ʌp raɪt naʊ/", meaning: "Nhặt nó lên ngay", tip: "Nối /k/ sang /ɪ/ (Pick-it) và /t/ sang /ʌ/ (it-up).", spokenText: "Pick it up right now" }
    ];
    const fallbackTier3 = [
      { target: "Fresh fried fish fish fresh fried", phonetics: "/freʃ fraɪd fɪʃ fɪʃ freʃ fraɪd/", meaning: "Cá rán tươi", tip: "Luyện phát âm liên tục phụ âm /fr/ và /fɪʃ/.", spokenText: "Fresh fried fish fish fresh fried" }
    ];

    const list = tier === 1 ? fallbackTier1 : tier === 2 ? fallbackTier2 : fallbackTier3;
    const selected = list[Math.floor(Math.random() * list.length)];
    return { ...selected, cefrLevel };
  }
}