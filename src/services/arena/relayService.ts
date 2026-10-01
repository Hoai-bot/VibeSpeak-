// src/services/arena/relayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RelayChallenge {
  id: string;
  topic: string;
  contextEn: string;
  contextVi?: string;
  player1En: string;
  player1Vi?: string;
  player2En: string;
  player2Vi?: string;
  keyVocabulary: string[];
}

const sessionUsedRelayTexts: Set<string> = new Set();

export function clearRelayHistory() {
  sessionUsedRelayTexts.clear();
}

// KHO ĐỀ DỰ PHÒNG CHUẨN CỨNG THEO LEVEL (TRIỆT TIÊU LỖI TRÔI ĐỀ A1 SANG C2)
const STRICT_RELAY_FALLBACKS: Record<string, RelayChallenge[]> = {
  A1: [
    {
      id: 'fb_a1_1',
      topic: "Daily Habits [A1]",
      contextEn: "Discuss your morning and evening routines.",
      contextVi: "Thảo luận về thói quen buổi sáng và buổi tối của bạn.",
      player1En: "Talk about what time you wake up and eat breakfast.",
      player1Vi: "Nói về giờ thức dậy và bữa sáng của bạn.",
      player2En: "Talk about your leisure activities before going to sleep.",
      player2Vi: "Nói về các hoạt động giải trí trước khi đi ngủ.",
      keyVocabulary: ["morning", "breakfast", "routine"]
    }
  ],
  A2: [
    {
      id: 'fb_a2_1',
      topic: "Weekend Trip Planning [A2]",
      contextEn: "Plan a short weekend getaway with your friend.",
      contextVi: "Lên kế hoạch cho một chuyến đi chơi ngắn cuối tuần.",
      player1En: "Suggest a destination and transportation method.",
      player1Vi: "Gợi ý địa điểm và phương tiện di chuyển.",
      player2En: "Propose budget-friendly activities and food options.",
      player2Vi: "Đề xuất các hoạt động ăn uống phù hợp ngân sách.",
      keyVocabulary: ["destination", "travel", "budget"]
    }
  ],
  B1: [
    {
      id: 'fb_b1_1',
      topic: "Urban Mobility & Public Transport [B1]",
      contextEn: "Debating the effectiveness of public buses vs personal motorbikes.",
      contextVi: "Thảo luận về tính hiệu quả của xe buýt so với xe máy cá nhân.",
      player1En: "Highlight environmental benefits and cost savings of public buses.",
      player1Vi: "Nêu bật lợi ích môi trường và tiết kiệm chi phí của xe buýt.",
      player2En: "Discuss flexibility and time efficiency of personal transport.",
      player2Vi: "Thảo luận về sự linh hoạt và tiết kiệm thời gian của xe cá nhân.",
      keyVocabulary: ["public transport", "flexibility", "traffic"]
    }
  ],
  B2: [
    {
      id: 'fb_b2_1',
      topic: "Corporate AI Integration [B2]",
      contextEn: "Debating the ethical adoption of generative AI tools in enterprise workflows.",
      player1En: "Argue for drastic productivity gains and process automation.",
      player2En: "Highlight risks of data privacy violations and workforce displacement.",
      keyVocabulary: ["automation", "productivity", "data privacy"]
    }
  ],
  C1: [
    {
      id: 'fb_c1_1',
      topic: "Algorithmic Governance & Civil Liberties [C1]",
      contextEn: "Analyzing state-sponsored predictive policing systems in urban hubs.",
      player1En: "Defend automated surveillance for crime reduction and national security.",
      player2En: "Critique racial biases embedded in training datasets and privacy loss.",
      keyVocabulary: ["predictive policing", "surveillance", "civil liberties"]
    }
  ],
  C2: [
    {
      id: 'fb_c2_1',
      topic: "Supranational Judicial Autonomy [C2]",
      contextEn: "Deconstructing legal jurisdiction clashes between international tribunals and sovereign states.",
      player1En: "Argue for universal human rights enforcement through binding international decrees.",
      player2En: "Assert constitutional sovereignty rights against external judicial overreach.",
      keyVocabulary: ["jurisprudence", "supranational", "sovereignty"]
    }
  ]
};

export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  const uniqueSeed = `seed_relay_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const isLowLevel = ['A1', 'A2', 'B1'].includes(cefrLevel);
  const excludedList = Array.from(sessionUsedRelayTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Language Examiner. Generate ONE 2-Player Relay Challenge for Level ${cefrLevel}.

CRITICAL LEVEL RULES FOR LEVEL ${cefrLevel}:
${isLowLevel 
  ? `- MUST include simple English (contextEn, player1En, player2En) AND Vietnamese translation (contextVi, player1Vi, player2Vi).` 
  : `- 100% ADVANCED ACADEMIC/PROFESSIONAL ENGLISH ONLY for En fields.
- DO NOT PROVIDE ANY VIETNAMESE TRANSLATION (STRICTLY NO Vi FIELDS).
- Topic must involve high-level legal, macroeconomic, technological, or philosophical debate for ${cefrLevel}.`
}

Return ONLY JSON:
{
  "topic": "Topic Title [${cefrLevel}]",
  "contextEn": "Context statement",
  ${isLowLevel ? '"contextVi": "Bản dịch tiếng Việt",' : ''}
  "player1En": "Guideline for Player 1",
  ${isLowLevel ? '"player1Vi": "Bản dịch P1 tiếng Việt",' : ''}
  "player2En": "Guideline for Player 2",
  ${isLowLevel ? '"player2Vi": "Bản dịch P2 tiếng Việt",' : ''}
  "keyVocabulary": ["word1", "word2"]
}`;

  const userPrompt = `Create a UNIQUE topic for CEFR Level ${cefrLevel}.
REQUEST ID: ${uniqueSeed}
DO NOT USE OR REPEAT: [ ${excludedList || 'None'} ]`;

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
    const topicText = parsed.topic || `Relay Challenge [${cefrLevel}]`;

    sessionUsedRelayTexts.add(topicText.toLowerCase());

    return {
      id: uniqueSeed,
      topic: topicText,
      contextEn: parsed.contextEn || `Discussion on ${cefrLevel} topics`,
      contextVi: isLowLevel ? parsed.contextVi : undefined,
      player1En: parsed.player1En || "State your argument",
      player1Vi: isLowLevel ? parsed.player1Vi : undefined,
      player2En: parsed.player2En || "Rebut or expand",
      player2Vi: isLowLevel ? parsed.player2Vi : undefined,
      keyVocabulary: parsed.keyVocabulary || ["discussion"]
    };
  } catch (error) {
    console.warn(`Groq Relay API Error for ${cefrLevel}, using strict level fallback:`, error);
    
    const fallbackList = STRICT_RELAY_FALLBACKS[cefrLevel] || STRICT_RELAY_FALLBACKS['C2'];
    const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    
    sessionUsedRelayTexts.add(selected.topic.toLowerCase());
    return {
      ...selected,
      id: uniqueSeed
    };
  }
}