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

const DYNAMIC_FALLBACKS: Record<string, SoloTopic[]> = {
  A1: [
    { id: 'a1_1', title: "Solo Pulse [A1]", promptEn: "Describe your favorite hobby and why you like it.", promptVi: "Hãy mô tả sở thích yêu thích của bạn và lý do bạn thích nó.", keywords: ["hobby", "free time"] },
    { id: 'a1_2', title: "Solo Pulse [A1]", promptEn: "Talk about your family members and their jobs.", promptVi: "Hãy kể về các thành viên trong gia đình và nghề nghiệp của họ.", keywords: ["family", "jobs"] }
  ],
  A2: [
    { id: 'a2_1', title: "Solo Pulse [A2]", promptEn: "Describe a memorable holiday trip you had with your friends.", promptVi: "Hãy kể về một chuyến đi chơi đáng nhớ cùng bạn bè.", keywords: ["holiday", "trip"] }
  ],
  B1: [
    { id: 'b1_1', title: "Solo Pulse [B1]", promptEn: "Discuss the advantages and disadvantages of living in a big city.", promptVi: "Thảo luận ưu và nhược điểm của việc sống ở thành phố lớn.", keywords: ["city", "lifestyle"] }
  ],
  B2: [
    { id: 'b2_1', title: "Solo Pulse [B2]", promptEn: "Analyze the economic and social impacts of remote work on modern urban development.", keywords: ["remote work", "economy"] }
  ],
  C1: [
    { id: 'c1_1', title: "Solo Pulse [C1]", promptEn: "Critically evaluate the ethical dilemmas surrounding corporate surveillance and data privacy in the digital era.", keywords: ["privacy", "ethics"] }
  ],
  C2: [
    { id: 'c2_1', title: "Solo Pulse [C2]", promptEn: "Examine the epistemological implications of artificial intelligence on human cognitive autonomy.", keywords: ["epistemology", "AI"] }
  ]
};

export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const excludedTopicsList = Array.from(sessionUsedTopicTexts).join(' | ');

  const isLowLevel = cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1';

  const prompt = `Generate ONE UNIQUE Solo Speaking Topic strictly tailored to CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}

EXCLUDED PREVIOUS TOPICS:
[ ${excludedTopicsList || 'None'} ]

CRITICAL RULES FOR LEVEL ${cefrLevel}:
${isLowLevel 
  ? `- You MUST provide BOTH simple English (promptEn) AND clear Vietnamese translation (promptVi).`
  : `- 100% ADVANCED ACADEMIC ENGLISH ONLY for promptEn. Do NOT provide promptVi.`
}

Return ONLY a valid JSON object matching this schema:
{
  "title": "Solo Pulse [${cefrLevel}]",
  "promptEn": "English text matching difficulty ${cefrLevel}",
  ${isLowLevel ? '"promptVi": "Bản dịch tiếng Việt chuẩn nghĩa",' : ''}
  "keywords": ["word1", "word2"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const promptEn = parsed.promptEn || `Practice topic for ${cefrLevel}`;

    sessionUsedTopicTexts.add(promptEn.toLowerCase());

    return {
      id: `solo_${dynamicSeed}`,
      title: parsed.title || `Solo Pulse [${cefrLevel}]`,
      promptEn: promptEn,
      promptVi: parsed.promptVi || undefined,
      keywords: parsed.keywords || ["speaking", "practice"]
    };
  } catch (error) {
    console.warn(`Groq Solo Error, selecting fallback for ${cefrLevel}:`, error);
    const fallbackList = DYNAMIC_FALLBACKS[cefrLevel] || DYNAMIC_FALLBACKS['A1'];
    const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    sessionUsedTopicTexts.add(selected.promptEn.toLowerCase());
    return selected;
  }
}