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
  A1: [{ id: 'r_a1', topic: "Daily Habits [A1]", contextEn: "Discuss your daily routine.", contextVi: "Thảo luận về thói quen hàng ngày.", player1En: "Talk about your morning routine.", player1Vi: "Nói về thói quen buổi sáng.", player2En: "Talk about your evening activities.", player2Vi: "Nói về các hoạt động buổi tối.", keyVocabulary: ["routine"] }],
  A2: [{ id: 'r_a2', topic: "Shopping Experience [A2]", contextEn: "Planning a shopping trip for clothes.", contextVi: "Lên kế hoạch đi mua sắm quần áo.", player1En: "Talk about stores you like.", player1Vi: "Nói về các cửa hàng bạn thích.", player2En: "Discuss how much you want to spend.", player2Vi: "Thảo luận về số tiền muốn chi tiêu.", keyVocabulary: ["shopping"] }],
  B1: [{ id: 'r_b1', topic: "Environmental Awareness [B1]", contextEn: "Debating plastic waste reduction in cities.", contextVi: "Thảo luận về việc giảm rác thải nhựa ở thành phố.", player1En: "Propose banning single-use plastics.", player1Vi: "Đề xuất cấm nhựa dùng một lần.", player2En: "Discuss practical alternatives for businesses.", player2Vi: "Thảo luận các giải pháp thay thế thực tế.", keyVocabulary: ["environment"] }],
  B2: [{ id: 'r_b2', topic: "Corporate AI Integration [B2]", contextEn: "Debating automated decision-making in workplace performance reviews.", player1En: "Argue for objective data-driven evaluation metrics.", player2En: "Highlight risks of algorithmic bias and lack of empathy.", keyVocabulary: ["automation", "bias"] }],
  C1: [{ id: 'r_c1', topic: "Predictive Policing & Civil Rights [C1]", contextEn: "Analyzing state-sponsored predictive crime detection models in urban hubs.", player1En: "Defend automated surveillance for crime prevention.", player2En: "Critique racial biases embedded in training datasets.", keyVocabulary: ["surveillance", "civil liberties"] }],
  C2: [{ id: 'r_c2', topic: "Supranational Judicial Autonomy [C2]", contextEn: "Deconstructing legal conflicts between international tribunals and state sovereignty.", player1En: "Argue for binding international human rights enforcement.", player2En: "Assert constitutional sovereignty against external overreach.", keyVocabulary: ["jurisprudence", "sovereignty"] }]
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

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a new Relay Challenge for CEFR [${levelKey}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList}]` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95,
      response_format: { type: 'json_object' }
    });

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
    const item = list[Math.floor(Math.random() * list.length)];
    return { ...item, id: uniqueSeed };
  }
}