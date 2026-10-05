// src/services/arena/station4Service.ts
import { Groq } from 'groq-sdk';
import { SPEAKING_EXPRESS_DATA, ExpressExerciseItem } from '../../data/station4/speakingExpress';

const ACTIVE_GROQ_KEY =
  process.env.GROQ_API_KEY_NEW ||
  process.env.GROQ_API_KEY ||
  process.env.GROQ_API ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY ||
  '';

const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface SpeakingExpressExercise {
  id: string;
  level: string;
  title: string;
  expressType: 'quick_response' | 'speed_reading' | 'situation_flash';
  promptEn: string;
  promptVi?: string;
  timeLimitSeconds: number;
  suggestedKeywords: string[];
}

// Bộ nhớ đệm lưu vết ID đề đã xuất hiện để chống lặp
let usedTopicIds: string[] = [];

/**
 * ⚡ LẤY THỬ THÁCH TỨC THÌ TỪ FLASH DATA LOCAL (Chống lặp 100%)
 */
export function getInstantStation4Exercise(level: string = 'B2'): SpeakingExpressExercise {
  const levelExercises = SPEAKING_EXPRESS_DATA.filter((e) => e.level === level);
  const targetList = levelExercises.length > 0 ? levelExercises : SPEAKING_EXPRESS_DATA;

  let available = targetList.filter((e) => !usedTopicIds.includes(e.id));

  // Nếu đã duyệt hết kho đề của Level này -> Reset danh sách level đó
  if (available.length === 0) {
    usedTopicIds = usedTopicIds.filter((id) => !targetList.some((e) => e.id === id));
    available = [...targetList];
  }

  const selected = available[Math.floor(Math.random() * available.length)];
  usedTopicIds.push(selected.id);

  return selected;
}

/**
 * 🤖 TẠO NGẦM THỬ THÁCH MỚI BẰNG GROQ AI (Dynamic Generation)
 */
export async function generateStation4Exercise(level: string = 'B2'): Promise<SpeakingExpressExercise> {
  const prompt = `You are an AI ELT Coach designing a Speaking Express (Quick Reflex) prompt for CEFR level ${level}.
Create ONE real-life speaking scenario or question requiring a 15-second response.

Return ONLY JSON matching schema:
{
  "id": "ai_exp_${Date.now()}",
  "level": "${level}",
  "title": "Express Challenge [${level}]",
  "expressType": "quick_response",
  "promptEn": "One engaging English prompt or situation asking for candidate's quick response",
  "promptVi": "Vietnamese translation of the prompt",
  "timeLimitSeconds": 15,
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"]
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const aiData = JSON.parse(completion.choices[0]?.message?.content || '{}') as SpeakingExpressExercise;

    if (aiData && aiData.promptEn) {
      usedTopicIds.push(aiData.id);
      return aiData;
    }
  } catch (error) {
    console.warn('⚠️ Groq AI Trạm 4 gặp sự cố, dùng Flash Data Local:', error);
  }

  return getInstantStation4Exercise(level);
}

/**
 * 🔄 XÓA LỊCH SỬ ĐỀ KHI ĐỔI LEVEL
 */
export function clearStation4History() {
  usedTopicIds = [];
}