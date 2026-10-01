// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface SoloTopic {
  id: string;
  title: string;
  promptEn: string;
  promptVi?: string;
  keywords: string[];
}

const sessionUsedTopicTexts: Set<string> = new Set();

export function clearSoloTopicHistory() {
  sessionUsedTopicTexts.clear();
}

const STRICT_SOLO_FALLBACKS: Record<string, SoloTopic[]> = {
  A1: [
    {
      id: 'solo_fb_a1_1',
      title: "Solo Pulse [A1]",
      promptEn: "Describe your favorite daily meal and how you prepare it.",
      promptVi: "Mô tả bữa ăn yêu thích hàng ngày của bạn và cách bạn chuẩn bị nó.",
      keywords: ["food", "meal", "daily"]
    }
  ],
  B2: [
    {
      id: 'solo_fb_b2_1',
      title: "Solo Pulse [B2]",
      promptEn: "Evaluate the social and psychological impacts of social media algorithms on teenagers.",
      keywords: ["social media", "algorithms", "psychology"]
    }
  ],
  C2: [
    {
      id: 'solo_fb_c2_1',
      title: "Solo Pulse [C2]",
      promptEn: "Critically evaluate the epistemological paradigm shift induced by autonomous artificial intelligence in scientific inquiry.",
      keywords: ["epistemology", "artificial intelligence", "philosophy"]
    }
  ]
};

export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  const uniqueSeed = `seed_solo_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const isLowLevel = ['A1', 'A2', 'B1'].includes(cefrLevel);
  const excludedList = Array.from(sessionUsedTopicTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Language Examiner. Generate ONE Solo Speaking Topic for Level ${cefrLevel}.

CRITICAL LEVEL RULES FOR LEVEL ${cefrLevel}:
${isLowLevel 
  ? `- MUST include simple English (promptEn) AND Vietnamese translation (promptVi).` 
  : `- 100% ADVANCED ACADEMIC/PROFESSIONAL ENGLISH ONLY for promptEn.
- DO NOT PROVIDE ANY VIETNAMESE TRANSLATION (STRICTLY NO promptVi FIELD).`
}

Return ONLY JSON:
{
  "title": "Solo Pulse [${cefrLevel}]",
  "promptEn": "English topic statement",
  ${isLowLevel ? '"promptVi": "Bản dịch tiếng Việt",' : ''}
  "keywords": ["word1", "word2"]
}`;

  const userPrompt = `Create a UNIQUE topic for CEFR Level ${cefrLevel}.
REQUEST ID: ${uniqueSeed}
DO NOT REPEAT: [ ${excludedList || 'None'} ]`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.99,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const promptEn = parsed.promptEn || `Practice topic for ${cefrLevel}`;

    sessionUsedTopicTexts.add(promptEn.toLowerCase());

    return {
      id: uniqueSeed,
      title: parsed.title || `Solo Pulse [${cefrLevel}]`,
      promptEn: promptEn,
      promptVi: isLowLevel ? parsed.promptVi : undefined,
      keywords: parsed.keywords || ["speaking", "practice"]
    };
  } catch (error) {
    console.warn(`Groq Solo API Error for ${cefrLevel}, using strict fallback:`, error);
    
    const fallbackList = STRICT_SOLO_FALLBACKS[cefrLevel] || STRICT_SOLO_FALLBACKS['C2'];
    const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    
    sessionUsedTopicTexts.add(selected.promptEn.toLowerCase());
    return {
      ...selected,
      id: uniqueSeed
    };
  }
}