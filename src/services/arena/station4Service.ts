// src/services/arena/station4Service.ts
import { Groq } from 'groq-sdk';
import { SPEAKING_EXPRESS_DATA, ExpressExerciseItem } from '../../data/station4/speakingExpress';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
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

const sessionUsedExpressExercises: Set<string> = new Set();

export function clearStation4History() {
  sessionUsedExpressExercises.clear();
}

// ⚡ 1. LẤY NGAY 1 BÀI PHẢN XẠ TRẠM 4 TỪ KHO LOCAL (0.01 Giây)
export function getInstantStation4Exercise(cefrLevel: string = 'A1'): SpeakingExpressExercise {
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  
  // Lọc bài tập theo level
  const pool = SPEAKING_EXPRESS_DATA.filter(item => item.level === levelKey);
  const activePool = pool.length > 0 ? pool : SPEAKING_EXPRESS_DATA;

  // Lọc bỏ bài đã xuất hiện trong phiên
  const filtered = activePool.filter(item => !sessionUsedExpressExercises.has(item.promptEn.toLowerCase()));
  const selected = filtered.length > 0 
    ? filtered[Math.floor(Math.random() * filtered.length)] 
    : activePool[Math.floor(Math.random() * activePool.length)];

  sessionUsedExpressExercises.add(selected.promptEn.toLowerCase());

  return {
    ...selected,
    id: `instant_st4_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
  };
}

// ⚡ 2. GỌI GROQ AI NGẦM ĐỂ CẬP NHẬT BÀI PHẢN XẠ MỚI TỪ SERVER
export async function generateStation4Exercise(cefrLevel: string = 'A1'): Promise<SpeakingExpressExercise> {
  const uniqueSeed = `st4_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedExpressExercises).slice(-15).join(' | ');

  const systemPrompt = `You are a strict Fast-Speaking Coach. Generate ONE Speaking Express exercise STRICTLY for CEFR Level ${levelKey}.
STRICT RULES:
- Must focus on FAST REFLEXES (10-15s response time).
- Express types allowed: "quick_response", "speed_reading", "situation_flash".
${isLowLevel 
  ? `- Include BOTH "promptEn" and "promptVi" (Vietnamese translation).` 
  : `- 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE "promptVi".`
}
Return ONLY valid JSON matching:
{
  "title": "Exercise Title [${levelKey}]",
  "expressType": "quick_response" | "speed_reading" | "situation_flash",
  "promptEn": "Fast prompt or text to read/respond",
  ${isLowLevel ? '"promptVi": "Bản dịch tiếng Việt",' : ''}
  "timeLimitSeconds": 15,
  "suggestedKeywords": ["word1", "word2"]
}`;

  try {
    const apiCall = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a BRAND NEW Speaking Express exercise for CEFR Level [${levelKey}]. Timestamp: ${Date.now()}. Request ID: ${uniqueSeed}. DO NOT REPEAT: [${excludedList || 'None'}]` }
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
    const promptEn = parsed.promptEn || `Reflex task for ${levelKey}`;

    sessionUsedExpressExercises.add(promptEn.toLowerCase());

    return {
      id: uniqueSeed,
      level: levelKey,
      title: parsed.title || `Speaking Express [${levelKey}]`,
      expressType: parsed.expressType || 'quick_response',
      promptEn: promptEn,
      promptVi: isLowLevel ? parsed.promptVi : undefined,
      timeLimitSeconds: parsed.timeLimitSeconds || 15,
      suggestedKeywords: parsed.suggestedKeywords || ["speaking", "express"]
    };
  } catch (error) {
    console.warn(`Fallback triggered for Station 4 Level ${levelKey}:`, error);
    return getInstantStation4Exercise(cefrLevel);
  }
}