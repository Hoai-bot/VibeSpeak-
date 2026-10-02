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

const STRICT_RELAY_FALLBACKS: Record<string, RelayChallenge[]> = {
  A1: [
    { id: 'r_a1_1', topic: "Daily Habits [A1]", contextEn: "Discuss your daily routine.", contextVi: "Thảo luận về thói quen hàng ngày.", player1En: "Talk about your morning routine.", player1Vi: "Nói về thói quen buổi sáng.", player2En: "Talk about your evening activities.", player2Vi: "Nói về các hoạt động buổi tối.", keyVocabulary: ["routine"] },
    { id: 'r_a1_2', topic: "Favorite Food [A1]", contextEn: "Talking about food preferences.", contextVi: "Nói về sở thích ăn uống.", player1En: "Talk about your favorite breakfast.", player1Vi: "Nói về bữa sáng yêu thích.", player2En: "Talk about what you like for dinner.", player2Vi: "Nói về món ăn tối yêu thích.", keyVocabulary: ["food"] }
  ],
  A2: [
    { id: 'r_a2_1', topic: "Shopping Trip [A2]", contextEn: "Planning a clothes shopping trip.", contextVi: "Lên kế hoạch đi mua sắm quần áo.", player1En: "Suggest stores to visit.", player1Vi: "Gợi ý các cửa hàng.", player2En: "Discuss your budget.", player2Vi: "Thảo luận về ngân sách.", keyVocabulary: ["shopping"] }
  ],
  B1: [
    { id: 'r_b1_1', topic: "Environmental Protection [B1]", contextEn: "Debating plastic waste reduction.", contextVi: "Thảo luận về giảm rác thải nhựa.", player1En: "Propose banning single-use plastics.", player1Vi: "Đề xuất cấm nhựa dùng 1 lần.", player2En: "Discuss alternatives for local businesses.", player2Vi: "Thảo luận các giải pháp thay thế.", keyVocabulary: ["environment"] }
  ],
  B2: [
    { id: 'r_b2_1', topic: "Corporate AI Integration [B2]", contextEn: "Debating automated performance reviews.", player1En: "Argue for objective data-driven metrics.", player2En: "Highlight risks of algorithmic bias and empathy loss.", keyVocabulary: ["automation", "bias"] },
    { id: 'r_b2_2', topic: "Remote Work Policy [B2]", contextEn: "Evaluating corporate flexible work arrangements.", player1En: "Advocate for full remote flexibility.", player2En: "Argue for in-office team cohesion.", keyVocabulary: ["remote work", "policy"] }
  ],
  C1: [
    { id: 'r_c1_1', topic: "Predictive Policing & Rights [C1]", contextEn: "Analyzing state-sponsored predictive crime detection models.", player1En: "Defend automated surveillance for crime reduction.", player2En: "Critique racial biases in training data.", keyVocabulary: ["surveillance", "civil liberties"] }
  ],
  C2: [
    { id: 'r_c2_1', topic: "Supranational Judicial Autonomy [C2]", contextEn: "Deconstructing legal conflicts between international tribunals and state sovereignty.", player1En: "Argue for binding human rights decrees.", player2En: "Assert constitutional sovereignty against overreach.", keyVocabulary: ["jurisprudence", "sovereignty"] }
  ]
};

export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  const uniqueSeed = `relay_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedRelayTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Test Designer. Generate ONE 2-Player Relay Challenge STRICTLY for Level ${levelKey}.
STRICT RULES:
${isLowLevel 
  ? `- Must be simple/intermediate. Include BOTH English AND Vietnamese fields (contextVi, player1Vi, player2Vi).` 
  : `- MUST be highly complex debate/scenario for ${levelKey}. 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE ANY VIETNAMESE (Vi) FIELDS.`
}
Return ONLY valid JSON matching:
{
  "topic": "Topic Title [${levelKey}]",
  "contextEn": "English context",
  ${isLowLevel ? '"contextVi": "Bản dịch bối cảnh tiếng Việt",' : ''}
  "player1En": "P1 English guideline",
  ${isLowLevel ? '"player1Vi": "P1 bản dịch tiếng Việt",' : ''}
  "player2En": "P2 English guideline",
  ${isLowLevel ? '"player2Vi": "P2 bản dịch tiếng Việt",' : ''}
  "keyVocabulary": ["word1", "word2"]
}`;

  const apiCall = groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a BRAND NEW and DIFFERENT topic for CEFR Level [${levelKey}]. Request ID: ${uniqueSeed}. Timestamp: ${Date.now()}. DO NOT REPEAT: [${excludedList || 'None'}]` }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 1.0, // Ép Groq sinh đề mới 100%
    response_format: { type: 'json_object' }
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Groq Timeout')), 4000)
  );

  try {
    const response: any = await Promise.race([apiCall, timeout]);
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const topicText = parsed.topic || `Relay Challenge [${levelKey}]`;

    sessionUsedRelayTexts.add(topicText.toLowerCase());

    return {
      id: uniqueSeed,
      topic: topicText,
      contextEn: parsed.contextEn || `Context for ${levelKey}`,
      contextVi: isLowLevel ? parsed.contextVi : undefined,
      player1En: parsed.player1En || "State your perspective",
      player1Vi: isLowLevel ? parsed.player1Vi : undefined,
      player2En: parsed.player2En || "Rebut or expand",
      player2Vi: isLowLevel ? parsed.player2Vi : undefined,
      keyVocabulary: parsed.keyVocabulary || ["debate"]
    };
  } catch (error) {
    console.warn(`Fallback triggered for Relay ${levelKey}:`, error);
    const list = STRICT_RELAY_FALLBACKS[levelKey] || STRICT_RELAY_FALLBACKS['C2'];
    const filtered = list.filter(item => !sessionUsedRelayTexts.has(item.topic.toLowerCase()));
    const selected = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : list[Math.floor(Math.random() * list.length)];
    
    sessionUsedRelayTexts.add(selected.topic.toLowerCase());
    return { ...selected, id: uniqueSeed };
  }
}