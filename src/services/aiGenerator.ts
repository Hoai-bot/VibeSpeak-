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

const historyTier1 = new Set<string>();
const historyTier2 = new Set<string>();
const historyTier3 = new Set<string>();

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

export async function generateDynamicDrill(
  tier: 1 | 2 | 3,
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' = 'B2',
  topicContext: string = 'Cyberpunk Business & Tech'
): Promise<DrillItem> {
  const historySet = tier === 1 ? historyTier1 : tier === 2 ? historyTier2 : historyTier3;
  const excludeList = Array.from(historySet).join(', ');
  
  const weakWordsList = await getSRSWeakWords();
  const shouldInjectSRS = weakWordsList.length > 0 && Math.random() < 0.2;
  const targetSRSWord = shouldInjectSRS ? weakWordsList[Math.floor(Math.random() * weakWordsList.length)] : null;

  let tierRules = '';
  if (tier === 1) {
    tierRules = `
STRICT FORMAT FOR TIER 1 (Minimal Pairs ONLY):
- "target" MUST be EXACTLY TWO contrasting words separated by slash: "WordA / WordB" (e.g., "Ship / Sheep", "Think / Sink", "Probe / Prove").
- "phonetics" MUST follow STRICT CAMBRIDGE INTERNATIONAL PHONETICS (IPA).
  CRITICAL IPA RULES:
  * "Prove" MUST be /pruːv/ (DO NOT use /prəʊv/).
  * "Probe" MUST be /prəʊb/ (US: /proʊb/).
  * "Sheep" MUST be /ʃiːp/, "Ship" MUST be /ʃɪp/.
- DO NOT generate single words, full sentences, or phrases.
- "spokenText" MUST BE ONLY the two target words separated by space: "WordA WordB" (e.g., "Probe Prove").
`;
  } else if (tier === 2) {
    tierRules = `
STRICT FORMAT FOR TIER 2 (Consonant-to-Vowel Linking Phrases ONLY):
- "target" MUST be a natural spoken phrase of 3-5 words focusing strictly on Consonant-to-Vowel linking (e.g., "Check it out", "Hold on a second", "Plug in the device").
- In "tip", explicitly explain WHICH consonant links to WHICH vowel in Vietnamese.
- "spokenText" MUST be the exact phrase without punctuation (e.g., "Check it out").
`;
  } else if (tier === 3) {
    tierRules = `
STRICT FORMAT FOR TIER 3 (Tongue Twisters ONLY):
- "target" MUST be a genuine, challenging English Tongue Twister sentence of 6-12 words (e.g., "She sells seashells by the seashore", "Betty Botter bought some butter", "Red leather yellow leather").
- DO NOT generate plain conversational sentences.
- "spokenText" MUST be the full tongue twister sentence without punctuation.
`;
  }

  const prompt = `
You are an AI English Pronunciation Coach. Generate ONE UNIQUE practice item for Tier ${tier}.
- CEFR Target: ${cefrLevel}
- Topic Context: ${topicContext}
${targetSRSWord ? `- Review Focus Word: "${targetSRSWord}"` : ''}

${tierRules}

STRICT ARTICLE PHONETIC RULES:
- Pronounce "the" as /ðə/ before CONSONANT sounds (e.g., "the device" -> /ðə dɪˈvaɪs/, "the car" -> /ðə kɑːr/).
- Pronounce "the" as /ði/ ONLY before VOWEL sounds (e.g., "the apple" -> /ði ˈæpl/, "the end" -> /ði end/).
- DO NOT output /ði/ before consonant words like "device" or "car".

CRITICAL CONSTRAINT:
DO NOT reuse any of these targets: [${excludeList}].

Return ONLY a valid JSON object matching this structure:
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
      temperature: 0.98,
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
      historySet.add(parsed.target.toLowerCase());
      if (historySet.size > 50) historySet.clear();
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
      { target: "Probe / Prove", phonetics: "/prəʊb/ - /pruːv/", meaning: "Điều tra / Chứng minh", tip: "Probe dùng âm /əʊ/, Prove dùng âm /uː/ tròn môi kéo dài.", spokenText: "Probe Prove" },
      { target: "Ship / Sheep", phonetics: "/ʃɪp/ - /ʃiːp/", meaning: "Con tàu / Con cừu", tip: "Âm /ɪ/ ngắn bật nhanh, /iː/ kéo dài.", spokenText: "Ship Sheep" },
      { target: "Think / Sink", phonetics: "/θɪŋk/ - /sɪŋk/", meaning: "Suy nghĩ / Bồn rửa", tip: "Âm /θ/ đặt lưỡi giữa răng thổi hơi.", spokenText: "Think Sink" }
    ];
    const fallbackTier2 = [
      { target: "Plug in the device", phonetics: "/plʌɡ ɪn ðə dɪˈvaɪs/", meaning: "Cắm thiết bị vào", tip: "Nối /ɡ/ sang /ɪ/ (Plug-in). 'The' trước 'device' đọc là /ðə/ vì 'device' bắt đầu bằng phụ âm /d/.", spokenText: "Plug in the device" },
      { target: "Check it out", phonetics: "/tʃek ɪt aʊt/", meaning: "Kiểm tra nó xem", tip: "Nối /k/ sang /ɪ/ (Check-it) và /t/ sang /aʊ/ (it-out).", spokenText: "Check it out" }
    ];
    const fallbackTier3 = [
      { target: "Betty Botter bought some butter", phonetics: "/ˈbeti ˈbɒtə bɔːt sʌm ˈbʌtə/", meaning: "Betty Botter đã mua một ít bơ", tip: "Chú ý âm Flap T chuyển /t/ thành /d/ nhẹ.", spokenText: "Betty Botter bought some butter" },
      { target: "She sells seashells by the seashore", phonetics: "/ʃiː selz ˈsiːʃelz baɪ ðə ˈsiːʃɔː/", meaning: "Cô ấy bán vỏ sò trên bờ biển", tip: "Chuyển đổi liên tục giữa /ʃ/ và /s/.", spokenText: "She sells seashells by the seashore" }
    ];

    const list = tier === 1 ? fallbackTier1 : tier === 2 ? fallbackTier2 : fallbackTier3;
    const selected = list[Math.floor(Math.random() * list.length)];
    return { ...selected, cefrLevel };
  }
}