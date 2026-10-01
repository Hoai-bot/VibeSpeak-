// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface SoloTopic {
  id: string;
  title: string;
  promptText: string;
  keywords: string[];
}

// 🧠 1. GẮN BỘ NHỚ LỊCH SỬ PHIÊN HỌC (USED HISTORY TRACKING)
const sessionUsedTopicTexts: Set<string> = new Set();

/**
 * Xóa lịch sử đã chơi khi đổi level hoặc chọn reset lại phiên
 */
export function clearSoloTopicHistory() {
  sessionUsedTopicTexts.clear();
}

// KHO ĐỀ DYNAMIC FALLBACK THEO TỪNG LEVEL
const DYNAMIC_FALLBACKS: Record<string, SoloTopic[]> = {
  A1: [
    { id: 'a1_1', title: "Solo Pulse [A1]", promptText: "Describe your favorite hobby and why you like it.", keywords: ["hobby", "free time"] },
    { id: 'a1_2', title: "Solo Pulse [A1]", promptText: "Talk about your best friend and what they look like.", keywords: ["friend", "appearance"] },
    { id: 'a1_3', title: "Solo Pulse [A1]", promptText: "Describe your daily morning routine before school or work.", keywords: ["morning", "routine"] }
  ],
  B2: [
    { id: 'b2_1', title: "Solo Pulse [B2]", promptText: "Discuss the economic and social impacts of remote work on modern urban development.", keywords: ["remote work", "urbanization", "economy"] },
    { id: 'b2_2', title: "Solo Pulse [B2]", promptText: "Analyze how social media algorithm personalization influences public opinion.", keywords: ["social media", "algorithms", "opinion"] },
    { id: 'b2_3', title: "Solo Pulse [B2]", promptText: "Evaluate the role of renewable energy adoption in developing nations.", keywords: ["renewable energy", "sustainability"] }
  ],
  C2: [
    { id: 'c2_1', title: "Solo Pulse [C2]", promptText: "Examine the epistemological implications of artificial intelligence on human cognitive autonomy.", keywords: ["epistemology", "AI", "existentialism"] },
    { id: 'c2_2', title: "Solo Pulse [C2]", promptText: "Deconstruct the geopolitical tension between space resource commercialization and international maritime governance.", keywords: ["geopolitics", "space law", "governance"] }
  ]
};

export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  // ⚡ 2. DYNAMIC REQUEST SEED CHỐNG CACHE GROQ / TRÌNH DUYỆT
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const excludedTopicsList = Array.from(sessionUsedTopicTexts).join(' | ');

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1') {
    languageRule = `- LANGUAGE: BILINGUAL (English prompt + Vietnamese translation).`;
  } else if (cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: 100% ENGLISH. Professional tone.`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED ACADEMIC / PHILOSOPHICAL ENGLISH. No Vietnamese translation.`;
  }

  const prompt = `Generate ONE UNIQUE Solo Speaking Topic for CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}

CRITICAL UNIQUNESS RULE:
Do NOT generate or reuse any of the following topics previously presented in this session:
[ ${excludedTopicsList || 'None'} ]

LEVEL RULE FOR ${cefrLevel}:
${languageRule}

Return ONLY a valid JSON object:
{
  "title": "Solo Topic [${cefrLevel}]",
  "promptText": "A completely new prompt text strictly matching ${cefrLevel}",
  "keywords": ["word1", "word2", "word3"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.98, // Tăng độ linh hoạt tối đa để không bao giờ bị rập khuôn
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const promptText = parsed.promptText || `Topic ${dynamicSeed}`;

    // Lưu vào lịch sử phiên làm việc
    sessionUsedTopicTexts.add(promptText.toLowerCase());

    return {
      id: `solo_${dynamicSeed}`,
      title: parsed.title || `Solo Pulse [${cefrLevel}]`,
      promptText: promptText,
      keywords: parsed.keywords || ["speaking", "practice"]
    };
  } catch (error) {
    console.warn(`Groq Solo Error, selecting unique unused fallback:`, error);
    
    const fallbackList = DYNAMIC_FALLBACKS[cefrLevel] || DYNAMIC_FALLBACKS['A1'];
    // Lọc các đề fallback chưa xuất hiện trong phiên
    const unusedFallbacks = fallbackList.filter(item => !sessionUsedTopicTexts.has(item.promptText.toLowerCase()));
    
    const selected = unusedFallbacks.length > 0 
      ? unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)]
      : fallbackList[Math.floor(Math.random() * fallbackList.length)];

    sessionUsedTopicTexts.add(selected.promptText.toLowerCase());
    return selected;
  }
}