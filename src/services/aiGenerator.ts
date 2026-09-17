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
- "target" MUST be EXACTLY TWO contrasting words separated by slash: "WordA / WordB" (e.g., "Ship / Sheep", "Think / Sink", "Probe / Prove", "Server / Sever").
- "phonetics" MUST follow STRICT CAMBRIDGE/OXFORD INTERNATIONAL PHONETICS (IPA).
  CRITICAL IPA RULES:
  * "Sever" MUST BE /ˈsev.ər/ (NEVER /siːvər/).
  * "Server" MUST BE /ˈsɜː.vər/.
  * "Prove" MUST BE /pruːv/ (DO NOT use /prəʊv/).
  * "Probe" MUST BE /prəʊb/ (US: /proʊb/).
  * "Sheep" MUST BE /ʃiːp/, "Ship" MUST BE /ʃɪp/.
- DO NOT generate single words, full sentences, or unnatural phrases.
- "spokenText" MUST BE ONLY the two target words separated by space: "WordA WordB" (e.g., "Probe Prove").
`;
  } else if (tier === 2) {
    tierRules = `
STRICT FORMAT FOR TIER 2 (Consonant-to-Vowel Linking & Meaningful Sentences):
- "target" MUST be a natural, meaningful spoken phrase or short sentence of 3-6 words (e.g., "Check it out", "Hold on a second", "Save the data", "Pick up the phone").
- STRICT PHONETIC ACCURACY & SENTENCE SANITY RULES:
  * NEVER generate nonsensical phrases like "Hold on a data date".
  * "date" MUST strictly be /deɪt/ (NEVER /dæt/).
  * "data" MUST strictly be /ˈdeɪ.tə/ or /ˈdɑː.tə/.
  * IPA must clearly show linking symbols or spacing (e.g., /hoʊld ɒn ə ˈsek.ənd/).
- In "tip", explicitly explain WHICH consonant links to WHICH vowel in natural Vietnamese.
- "spokenText" MUST be the exact phrase without punctuation (e.g., "Hold on a second").
`;
  } else if (tier === 3) {
    tierRules = `
STRICT FORMAT FOR TIER 3 (Tongue Twisters ONLY):
- "target" MUST be a genuine, challenging English Tongue Twister sentence of 6-12 words (e.g., "She sells seashells by the seashore", "Betty Botter bought some butter").
- "phonetics" MUST follow strict Cambridge IPA rules for every word.
- "spokenText" MUST be the full tongue twister sentence without punctuation.
`;
  }

  const prompt = `
You are a Senior Phonetics Expert and ELT Materials Designer. Generate ONE UNIQUE practice item for Tier ${tier}.
- CEFR Target: ${cefrLevel}
- Topic Context: ${topicContext}
${targetSRSWord ? `- Review Focus Word: "${targetSRSWord}"` : ''}

${tierRules}

STRICT ARTICLE & IPA RULES:
- Pronounce "the" as /ðə/ before CONSONANT sounds (e.g., "the device" -> /ðə dɪˈvaɪs/).
- Pronounce "the" as /ði/ ONLY before VOWEL sounds (e.g., "the apple" -> /ði ˈæpl/).
- Ensure 100% dictionary accuracy for all vowel and consonant symbols.

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
      temperature: 0.7, // Giảm bớt temperature để AI không tự ý biến tấu sai ngữ âm
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
      { target: "Server / Sever", phonetics: "/ˈsɜː.vər/ - /ˈsev.ər/", meaning: "Máy chủ / Cắt đứt", tip: "Server dùng âm /ɜː/ dài, Sever dùng âm /e/ ngắn.", spokenText: "Server Sever" },
      { target: "Ship / Sheep", phonetics: "/ʃɪp/ - /ʃiːp/", meaning: "Con tàu / Con cừu", tip: "Âm /ɪ/ ngắn bật nhanh, /iː/ kéo dài.", spokenText: "Ship Sheep" }
    ];
    const fallbackTier2 = [
      { target: "Hold on a second", phonetics: "/həʊld ɒn ə ˈsek.ənd/", meaning: "Chờ một chút nhé", tip: "Nối âm /d/ trong 'Hold' sang /ɒ/ trong 'on' (Hold-on).", spokenText: "Hold on a second" },
      { target: "Plug in the device", phonetics: "/plʌɡ ɪn ðə dɪˈvaɪs/", meaning: "Cắm thiết bị vào", tip: "Nối /ɡ/ sang /ɪ/ (Plug-in). 'The' đọc là /ðə/ trước phụ âm /d/.", spokenText: "Plug in the device" },
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