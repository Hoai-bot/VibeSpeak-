// src/services/arena/roleplayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RoleplayScenario {
  id: string;
  scenarioTitle: string;
  aiRoleEn: string;
  aiRoleVi?: string;
  userRoleEn: string;
  userRoleVi?: string;
  initialAiMessage: string;
  goalEn: string;
  goalVi?: string;
}

const sessionUsedRoleplayTexts: Set<string> = new Set();

export function clearRoleplayHistory() {
  sessionUsedRoleplayTexts.clear();
}

const STRICT_ROLEPLAY_FALLBACKS: Record<string, RoleplayScenario[]> = {
  A1: [{ id: 'rp_a1', scenarioTitle: "At the Coffee Shop [A1]", aiRoleEn: "Barista", aiRoleVi: "Nhân viên pha chế", userRoleEn: "Customer", userRoleVi: "Khách hàng", initialAiMessage: "Hello! What drink would you like today?", goalEn: "Order a coffee and ask for the price.", goalVi: "Đặt một ly cà phê và hỏi giá tiền." }],
  A2: [{ id: 'rp_a2', scenarioTitle: "Asking for Directions [A2]", aiRoleEn: "Local Resident", aiRoleVi: "Người dân địa phương", userRoleEn: "Tourist", userRoleVi: "Khách du lịch", initialAiMessage: "Hi there! You look a bit lost. Need help?", goalEn: "Ask for directions to the train station.", goalVi: "Hỏi đường đến ga tàu hỏa." }],
  B1: [{ id: 'rp_b1', scenarioTitle: "Hotel Room Complaint [B1]", aiRoleEn: "Hotel Receptionist", aiRoleVi: "Lễ tân khách sạn", userRoleEn: "Guest", userRoleVi: "Khách trọ", initialAiMessage: "Good evening, sir. How can I assist you?", goalEn: "Complain about the noise and request a room change.", goalVi: "Phàn nàn về tiếng ồn và yêu cầu đổi phòng." }],
  B2: [{ id: 'rp_b2', scenarioTitle: "Project Timeline Negotiation [B2]", aiRoleEn: "Project Director", userRoleEn: "Lead Engineer", initialAiMessage: "The client demands an acceleration of the release date by two weeks.", goalEn: "Explain technical constraints and negotiate a feasible delivery schedule." }],
  C1: [{ id: 'rp_c1', scenarioTitle: "Venture Capital Pitch [C1]", aiRoleEn: "Managing Partner", userRoleEn: "Startup Founder", initialAiMessage: "Your burn rate seems high given current market headwinds. How do you justify this valuation?", goalEn: "Defend your financial projections and articulate market scalability." }],
  C2: [{ id: 'rp_c2', scenarioTitle: "Cross-Border Antitrust Litigation [C2]", aiRoleEn: "Regulator Committee Chair", userRoleEn: "Chief Legal Officer", initialAiMessage: "The proposed merger violates competition laws regarding market dominance in cloud infrastructure.", goalEn: "Structure a legally sound compliance package mitigating antitrust concerns." }]
};

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  const uniqueSeed = `rp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedRoleplayTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Test Designer. Generate ONE Roleplay Scenario STRICTLY for Level ${levelKey}.
STRICT RULES:
${isLowLevel 
  ? `- Must be simple/intermediate. Include BOTH English AND Vietnamese translation fields (aiRoleVi, userRoleVi, goalVi).` 
  : `- MUST be executive/professional for ${levelKey}. 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE ANY VIETNAMESE (Vi) FIELDS.`
}
Return ONLY valid JSON matching:
{
  "scenarioTitle": "Title [${levelKey}]",
  "aiRoleEn": "Role 1 English",
  ${isLowLevel ? '"aiRoleVi": "Role 1 tiếng Việt",' : ''}
  "userRoleEn": "Role 2 English",
  ${isLowLevel ? '"userRoleVi": "Role 2 tiếng Việt",' : ''}
  "initialAiMessage": "English opening line",
  "goalEn": "Goal English",
  ${isLowLevel ? '"goalVi": "Goal tiếng Việt",' : ''}
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a new Roleplay Scenario for CEFR [${levelKey}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList}]` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const titleText = parsed.scenarioTitle || `Roleplay [${levelKey}]`;

    sessionUsedRoleplayTexts.add(titleText.toLowerCase());

    return {
      id: uniqueSeed,
      scenarioTitle: titleText,
      aiRoleEn: parsed.aiRoleEn || "Interlocutor",
      aiRoleVi: isLowLevel ? parsed.aiRoleVi : undefined,
      userRoleEn: parsed.userRoleEn || "Speaker",
      userRoleVi: isLowLevel ? parsed.userRoleVi : undefined,
      initialAiMessage: parsed.initialAiMessage || "Hello!",
      goalEn: parsed.goalEn || "Achieve goal",
      goalVi: isLowLevel ? parsed.goalVi : undefined
    };
  } catch (error) {
    console.warn(`Fallback triggered for Roleplay ${levelKey}:`, error);
    const list = STRICT_ROLEPLAY_FALLBACKS[levelKey] || STRICT_ROLEPLAY_FALLBACKS['C2'];
    const item = list[Math.floor(Math.random() * list.length)];
    return { ...item, id: uniqueSeed };
  }
}