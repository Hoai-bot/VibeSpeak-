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

// Bộ nhớ ghi nhớ các câu đã xuất hiện
const usedHistoryMap: Record<string, Set<string>> = {
  minimal_pairs: new Set(),
  linking_sounds: new Set(),
  tongue_twisters: new Set()
};

export function clearStation1History() {
  usedHistoryMap.minimal_pairs.clear();
  usedHistoryMap.linking_sounds.clear();
  usedHistoryMap.tongue_twisters.clear();
}

// ⚡ HÀM BỐC BÀI LOCAL ĐẢM BẢO KHÔNG BAO GIỜ BỊ TRÙNG CÂU CŨ (0.01s)
export function getInstantStation1Exercise(
  category: 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters' = 'minimal_pairs'
): PhoneticExercise {
  let activePool: any[] = MINIMAL_PAIRS_DATA;
  if (category === 'linking_sounds') {
    activePool = LINKING_SOUNDS_DATA;
  } else if (category === 'tongue_twisters') {
    activePool = TONGUE_TWISTERS_DATA;
  }

  const historySet = usedHistoryMap[category] || usedHistoryMap.minimal_pairs;

  // Lọc lấy danh sách các câu CHƯA BỊ TRÙNG
  let available = activePool.filter(item => item && item.contentEn && !historySet.has(item.contentEn.toLowerCase()));

  // Nếu đã học sạch kho 50 bài, reset bộ nhớ của riêng category đó và xáo trộn lại
  if (available.length === 0) {
    historySet.clear();
    available = [...activePool];
  }

  // Bốc ngẫu nhiên 1 câu trong danh sách chưa học
  const randomIndex = Math.floor(Math.random() * available.length);
  const selected = available[randomIndex] || activePool[0];

  if (selected && selected.contentEn) {
    historySet.add(selected.contentEn.toLowerCase());
  }

  // 💥 BẮT BỘC: Tạo object mới kèm Unique ID thời gian thực để ép React đổi UI
  return {
    id: `instant_st1_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
    title: selected?.title || "Phonetics Practice",
    category: category,
    contentEn: selected?.contentEn || "ship / sheep",
    contentVi: selected?.contentVi || "con tàu / con cừu",
    targetFocus: selected?.targetFocus || "Phonetics Focus",
    phoneticSpelling: selected?.phoneticSpelling || ""
  };
}

// ⚡ TẠO BÀI MỚI QUA GROQ AI NGẦM (BẤT ĐỒNG BỘ)
export async function generateStation1Exercise(
  category: 'minimal_pairs' | 'linking_sounds' | 'tongue_twisters' = 'minimal_pairs'
): Promise<PhoneticExercise> {
  const uniqueSeed = `st1_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const historySet = usedHistoryMap[category];
  const excludedList = Array.from(historySet).slice(-25).join(' | ');

  const systemPrompt = `You are a creative English Phonetics Coach. Generate ONE BRAND NEW phonetics item for category "${category}".
STRICT RULES:
- Category "minimal_pairs": contentEn MUST be a new word pair like "fit / feet" or "wet / vet".
- Category "linking_sounds": contentEn MUST be a phrase like "Turn it on" or "Check it out".
- Category "tongue_twisters": contentEn MUST be a phrase like "Fresh fried fish".
- ALWAYS provide "contentVi" in Vietnamese translation.
- DO NOT generate repetitive items.

Return ONLY valid JSON matching:
{
  "title": "Short Title",
  "category": "${category}",
  "contentEn": "Target English text",
  "contentVi": "Bản dịch tiếng Việt",
  "targetFocus": "Phonetic target description",
  "phoneticSpelling": "/IPA/"
}`;

  try {
    const apiCall = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a UNIQUE item for category [${category}]. Request ID: ${uniqueSeed}. Exclude these used items: [${excludedList || 'None'}]` }
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
    const contentEn = parsed.contentEn;

    // Nếu Groq AI trả về câu hợp lệ và chưa có trong lịch sử
    if (contentEn && !historySet.has(contentEn.toLowerCase())) {
      historySet.add(contentEn.toLowerCase());

      return {
        id: uniqueSeed,
        title: parsed.title || "Phonetics Challenge",
        category: category,
        contentEn: contentEn,
        contentVi: parsed.contentVi || "",
        targetFocus: parsed.targetFocus || "Phonetics Practice",
        phoneticSpelling: parsed.phoneticSpelling || ""
      };
    } else {
      // Nếu AI trả câu trùng, bốc ngay 1 câu local mới
      return getInstantStation1Exercise(category);
    }
  } catch (error) {
    // Khi lỗi mạng/API key, bốc ngay 1 câu local mới
    return getInstantStation1Exercise(category);
  }
}