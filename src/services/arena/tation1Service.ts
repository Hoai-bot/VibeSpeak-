// src/services/arena/station1Service.ts
import { Groq } from 'groq-sdk';
import { MINIMAL_PAIRS_DATA, MinimalPairItem } from '../../data/station1/minimalPairs';
import { LINKING_SOUNDS_DATA, LinkingSoundItem } from '../../data/station1/linkingSounds';
import { TONGUE_TWISTERS_DATA, TongueTwisterItem } from '../../data/station1/tongueTwisters';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface PhoneticExercise {
  id: string;
  level: string;
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

// ⚡ 1. LẤY NGAY 1 BÀI TỪ KHO DATA TƯƠNG ỨNG (0.01s) - ÉP TẠO UNIQUE ID CHỐNG TRÙNG RENDER
export function getInstantStation1Exercise(
  cefrLevel: string = 'A1', 
  category: 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters' = 'minimal_pairs'
): PhoneticExercise {
  const levelKey = (cefrLevel || 'A1').toUpperCase();

  // Chọn nguồn data dựa trên category
  let rawPool: any[] = [];
  if (category === 'linking_sounds') {
    rawPool = LINKING_SOUNDS_DATA;
  } else if (category === 'tongue_twisters') {
    rawPool = TONGUE_TWISTERS_DATA;
  } else {
    rawPool = MINIMAL_PAIRS_DATA;
  }

  // Lọc theo Level
  const levelPool = rawPool.filter(item => item.level === levelKey);
  const activePool = levelPool.length > 0 ? levelPool : rawPool;

  // Lọc bài chưa sử dụng trong phiên
  const filtered = activePool.filter(item => !sessionUsedPhonetics.has(item.contentEn.toLowerCase()));

  // Reset bộ nhớ phiên nếu đã dùng hết toàn bộ bài trong pool
  if (filtered.length === 0) {
    sessionUsedPhonetics.clear();
  }

  const selected = filtered.length > 0 
    ? filtered[Math.floor(Math.random() * filtered.length)] 
    : activePool[Math.floor(Math.random() * activePool.length)];

  sessionUsedPhonetics.add(selected.contentEn.toLowerCase());

  // 💥 LUÔN TẠO OBJECT MỚI CÙNG UNIQUE ID ĐỂ ÉP REACT CẬP NHẬT GIAO DIỆN LẬP TỨC
  return {
    id: `instant_st1_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
    level: levelKey,
    title: selected.title || `Phonetics [${levelKey}]`,
    category: category,
    contentEn: selected.contentEn,
    contentVi: selected.contentVi,
    targetFocus: selected.targetFocus,
    phoneticSpelling: selected.phoneticSpelling
  };
}

// ⚡ 2. GỌI GROQ AI NGẦM ĐỂ CẬP NHẬT BÀI MỚI TỪ SERVER
export async function generateStation1Exercise(
  cefrLevel: string = 'A1',
  category: 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters' = 'minimal_pairs'
): Promise<PhoneticExercise> {
  const uniqueSeed = `st1_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedPhonetics).slice(-15).join(' | ');

  const systemPrompt = `You are a strict Phonetics Coach. Generate ONE exercise STRICTLY for CEFR Level ${levelKey} and Category "${category}".
STRICT RULES:
- Category "minimal_pairs": contentEn MUST be a word pair like "ship / sheep".
- Category "linking_sounds": contentEn MUST be a phrase like "Check it out".
- Category "tongue_twisters": contentEn MUST be a twister phrase like "She sells seashells".
${isLowLevel 
  ? `- Include BOTH "contentEn" and "contentVi" (Vietnamese translation).` 
  : `- 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE "contentVi".`
}
Return ONLY valid JSON matching:
{
  "title": "Phonetics Title [${levelKey}]",
  "category": "${category}",
  "contentEn": "Target English phrase or minimal pair",
  ${isLowLevel ? '"contentVi": "Bản dịch tiếng Việt",' : ''}
  "targetFocus": "Phonetic target description",
  "phoneticSpelling": "/IPA spelling/"
}`;

  try {
    const apiCall = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a BRAND NEW phonetics exercise for CEFR [${levelKey}] category [${category}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList || 'None'}]` }
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
    const contentEn = parsed.contentEn || `Phonetics task for ${levelKey}`;

    sessionUsedPhonetics.add(contentEn.toLowerCase());

    return {
      id: uniqueSeed,
      level: levelKey,
      title: parsed.title || `Phonetics [${levelKey}]`,
      category: category,
      contentEn: contentEn,
      contentVi: isLowLevel ? parsed.contentVi : undefined,
      targetFocus: parsed.targetFocus || "Phonetics practice",
      phoneticSpelling: parsed.phoneticSpelling || ""
    };
  } catch (error) {
    console.warn(`Fallback triggered for Station 1 Level ${levelKey}:`, error);
    return getInstantStation1Exercise(cefrLevel, category);
  }
}