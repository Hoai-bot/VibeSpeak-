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

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  const uniqueSeed = `seed_rp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const isLowLevel = ['A1', 'A2', 'B1'].includes(cefrLevel);
  const excludedList = Array.from(sessionUsedRoleplayTexts).slice(-15).join(' | ');

  const systemMessage = `You are an expert English Language Examiner creating a Roleplay Scenario strictly for CEFR Level ${cefrLevel}.
Rules for Level ${cefrLevel}:
${isLowLevel 
  ? `- You MUST provide BOTH simple English (En) AND accurate Vietnamese translation (Vi) for aiRole, userRole, and goal.
- Keep initialAiMessage in simple, conversational English.` 
  : `- You MUST provide 100% ADVANCED EXECUTIVE/BUSINESS ENGLISH ONLY for En fields.
- STRICTLY DO NOT PROVIDE ANY VIETNAMESE (Vi) FIELDS.`
}
Return strictly JSON matching the required schema. Do NOT repeat any scenario from the exclusion list.`;

  const userPrompt = `Generate a brand NEW Roleplay Scenario for CEFR [${cefrLevel}]. 
Request ID: ${uniqueSeed}
EXCLUDED SCENARIOS: [ ${excludedList || 'None'} ]

JSON Schema:
{
  "scenarioTitle": "Scenario Title [${cefrLevel}]",
  "aiRoleEn": "Role 1 in English",
  ${isLowLevel ? '"aiRoleVi": "Vai trò AI tiếng Việt",' : ''}
  "userRoleEn": "Role 2 in English",
  ${isLowLevel ? '"userRoleVi": "Vai trò Người chơi tiếng Việt",' : ''}
  "initialAiMessage": "Short English line to open the chat",
  "goalEn": "Goal in English",
  ${isLowLevel ? '"goalVi": "Mục tiêu giao tiếp tiếng Việt",' : ''}
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.99,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const titleText = parsed.scenarioTitle || `Roleplay [${cefrLevel}] (${uniqueSeed.slice(-4)})`;

    sessionUsedRoleplayTexts.add(titleText.toLowerCase());

    return {
      id: uniqueSeed,
      scenarioTitle: titleText,
      aiRoleEn: parsed.aiRoleEn || "Barista",
      aiRoleVi: isLowLevel ? (parsed.aiRoleVi || "Nhân viên pha chế") : undefined,
      userRoleEn: parsed.userRoleEn || "Customer",
      userRoleVi: isLowLevel ? (parsed.userRoleVi || "Khách hàng") : undefined,
      initialAiMessage: parsed.initialAiMessage || "Hello! What can I get for you today?",
      goalEn: parsed.goalEn || "Order a coffee and ask for the price.",
      goalVi: isLowLevel ? (parsed.goalVi || "Đặt một ly cà phê và hỏi giá tiền.") : undefined
    };
  } catch (error) {
    console.warn(`Error generating roleplay for ${cefrLevel}:`, error);
    return {
      id: uniqueSeed,
      scenarioTitle: `Roleplay Scenario [${cefrLevel}]`,
      aiRoleEn: isLowLevel ? "Store Clerk" : "Corporate Director",
      aiRoleVi: isLowLevel ? "Nhân viên bán hàng" : undefined,
      userRoleEn: isLowLevel ? "Shopper" : "Lead Counsel",
      userRoleVi: isLowLevel ? "Người mua hàng" : undefined,
      initialAiMessage: isLowLevel ? "Hi! How can I help you find what you need?" : "Let's discuss the antitrust litigation strategy.",
      goalEn: isLowLevel ? "Buy a souvenir and ask about discounts." : "Negotiate a compliance settlement framework.",
      goalVi: isLowLevel ? "Mua đồ lưu niệm và hỏi về giảm giá." : undefined
    };
  }
}