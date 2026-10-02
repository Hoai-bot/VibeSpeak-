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
  A1: [{ id: 's_a1', title: "Solo Pulse [A1]", promptEn: "Describe your daily morning routine and what you eat for breakfast.", promptVi: "Mô tả thói quen buổi sáng hàng ngày và những gì bạn ăn vào bữa sáng.", keywords: ["routine", "breakfast"] }],
  A2: [{ id: 's_a2', title: "Solo Pulse [A2]", promptEn: "Talk about your favorite holiday destination and what activities you enjoy there.", promptVi: "Nói về địa điểm du lịch yêu thích của bạn và các hoạt động bạn thích ở đó.", keywords: ["travel", "holiday"] }],
  B1: [{ id: 's_b1', title: "Solo Pulse [B1]", promptEn: "Discuss the advantages and disadvantages of remote working for young professionals.", promptVi: "Thảo luận về những ưu điểm và nhược điểm của việc làm việc từ xa đối với người trẻ.", keywords: ["remote work", "careers"] }],
  B2: [{ id: 's_b2', title: "Solo Pulse [B2]", promptEn: "Analyze the ethical implications of automated algorithms in commercial targeted advertising.", keywords: ["algorithms", "ethics"] }],
  C1: [{ id: 's_c1', title: "Solo Pulse [C1]", promptEn: "Evaluate the impact of macroeconomic inflation on global supply chain resilience.", keywords: ["macroeconomics", "supply chain"] }],
  C2: [{ id: 's_c2', title: "Solo Pulse [C2]", promptEn: "Critically deconstruct the epistemological paradigm shift induced by generative AI in scientific research.", keywords: ["epistemology", "generative AI"] }]
};

export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  const uniqueSeed = `solo_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedTopicTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Test Designer. Generate ONE Solo Topic STRICTLY for Level ${levelKey}.
STRICT RULES:
${isLowLevel 
  ? `- Topic must be simple/intermediate. Include BOTH "promptEn" and "promptVi" (Vietnamese translation).` 
  : `- Topic MUST be highly academic, professional, or complex for Level ${levelKey}. 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE "promptVi".`
}
Return ONLY valid JSON matching:
{
  "title": "Solo Pulse [${levelKey}]",
  "promptEn": "Topic text",
  ${isLowLevel ? '"promptVi": "Bản dịch tiếng Việt",' : ''}
  "keywords": ["word1", "word2"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a new topic for CEFR [${levelKey}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList}]` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const promptEn = parsed.promptEn || `Topic for ${levelKey}`;

    sessionUsedTopicTexts.add(promptEn.toLowerCase());

    return {
      id: uniqueSeed,
      title: parsed.title || `Solo Pulse [${levelKey}]`,
      promptEn: promptEn,
      promptVi: isLowLevel ? parsed.promptVi : undefined,
      keywords: parsed.keywords || ["speaking"]
    };
  } catch (error) {
    console.warn(`Fallback triggered for Solo ${levelKey}:`, error);
    const list = STRICT_SOLO_FALLBACKS[levelKey] || STRICT_SOLO_FALLBACKS['C2'];
    const item = list[Math.floor(Math.random() * list.length)];
    return { ...item, id: uniqueSeed };
  }
}