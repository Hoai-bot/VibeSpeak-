// src/services/arena/station1Service.ts
import { Groq } from 'groq-sdk';
import { MINIMAL_PAIRS_DATA } from '../../data/station1/minimalPairs';
import { LINKING_SOUNDS_DATA } from '../../data/station1/linkingSounds';
import { TONGUE_TWISTERS_DATA } from '../../data/station1/tongueTwisters';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface PhoneticExercise {
  id: string;
  title: string;
  category: 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters';
  contentEn: string;
  contentVi?: string;
  targetFocus: string;
  phoneticSpelling?: string;
}

const sessionUsedPhonetics: Set<string> = new Set();

export function clearStation1History() {
  sessionUsedPhonetics.clear();
}

// ⚡ 1. LẤY NGAY 1 CÂU PHẲNG TỪ LOCAL POOL (0.01s) - CÓ DÙNG MÃ RANDOM THỜI GIAN ÉP RE-RENDER
export function getInstantStation1Exercise(
  category: 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters' = 'minimal_pairs'
): PhoneticExercise {
  let activePool: any[] = MINIMAL_PAIRS_DATA;
  if (category === 'linking_sounds') {
    activePool = LINKING_SOUNDS_DATA;
  } else if (category === 'tongue_twisters') {
    activePool = TONGUE_TWISTERS_DATA;
  }

  // Lọc loại bỏ bài đã xuất hiện trong phiên
  const filtered = activePool.filter(item => !sessionUsedPhonetics.has(item.contentEn.toLowerCase()));

  // Reset nếu đã dùng hết toàn bộ pool
  if (filtered.length === 0) {
    sessionUsedPhonetics.clear();
  }

  const selected = filtered.length > 0 
    ? filtered[Math.floor(Math.random() * filtered.length)] 
    : activePool[Math.floor(Math.random() * activePool.length)];

  if (selected && selected.contentEn) {
    sessionUsedPhonetics.add(selected.contentEn.toLowerCase());
  }

  return {
    id: `instant_st1_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
    title: selected?.title || "Phonetics Practice",
    category: category,
    contentEn: selected?.contentEn || "ship / sheep",
    contentVi: selected?.contentVi,
    targetFocus: selected?.targetFocus || "Phonetics Focus",
    phoneticSpelling: selected?.phoneticSpelling
  };
}

// ⚡ 2. GỌI GROQ AI NGẦM ĐỂ TẠO TỰ NHIÊN BẤT ĐỒNG BỘ
export async function generateStation1Exercise(
  category: 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters' = 'minimal_pairs'
): Promise<PhoneticExercise> {
  const uniqueSeed = `st1_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const excludedList = Array.from(sessionUsedPhonetics).slice(-15).join(' | ');

  const systemPrompt = `You are an expert Phonetics Coach. Generate ONE English phonetics exercise for category "${category}".
STRICT RULES:
- If category is "minimal_pairs", contentEn MUST be a word pair like "fit / feet". Include "contentVi" in Vietnamese.
- If category is "linking_sounds", contentEn MUST be a phrase like "Check it out". Include "contentVi" in Vietnamese.
- If category is "tongue_twisters", contentEn MUST be a twister like "Fresh fried fish". Include "contentVi" in Vietnamese.

Return ONLY valid JSON matching:
{
  "title": "Short Descriptive Title",
  "category": "${category}",
  "contentEn": "Target English text",
  "contentVi": "Bản dịch tiếng Việt",
  "targetFocus": "Phonetic element description",
  "phoneticSpelling": "/IPA/"
}`;

  try {
    const apiCall = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a BRAND NEW item for category [${category}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList || 'None'}]` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 1.0,
      response_format: { type: 'json_object' }
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Groq Timeout')), 3500)
    );

    const response: any = await Promise.race([apiCall, timeout]);
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const contentEn = parsed.contentEn || "ship / sheep";

    sessionUsedPhonetics.add(contentEn.toLowerCase());

    return {
      id: uniqueSeed,
      title: parsed.title || "Phonetics Challenge",
      category: category,
      contentEn: contentEn,
      contentVi: parsed.contentVi,
      targetFocus: parsed.targetFocus || "Phonetics practice",
      phoneticSpelling: parsed.phoneticSpelling || ""
    };
  } catch (error) {
    return getInstantStation1Exercise(category);
  }
}