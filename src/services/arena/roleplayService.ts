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

const DYNAMIC_ROLEPLAY_FALLBACKS: Record<string, RoleplayScenario[]> = {
  A1: [
    {
      id: 'rp_a1_1',
      scenarioTitle: "Ordering Drinks [A1]",
      aiRoleEn: "Barista",
      aiRoleVi: "Nhân viên pha chế",
      userRoleEn: "Customer",
      userRoleVi: "Khách hàng",
      initialAiMessage: "Hello! What drink would you like today?",
      goalEn: "Order a coffee and ask for the price.",
      goalVi: "Đặt một ly cà phê và hỏi giá tiền."
    }
  ],
  B2: [
    {
      id: 'rp_b2_1',
      scenarioTitle: "Project Deadline Negotiation [B2]",
      aiRoleEn: "Project Director",
      userRoleEn: "Lead Developer",
      initialAiMessage: "We have an urgent request from the client to move up the release date by two weeks.",
      goalEn: "Explain technical constraints and negotiate a feasible delivery timeline."
    }
  ]
};

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const excludedList = Array.from(sessionUsedRoleplayTexts).join(' | ');
  const isLowLevel = cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1';

  const prompt = `Generate ONE UNIQUE Roleplay Scenario strictly tailored to CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}

EXCLUDED PREVIOUS SCENARIOS:
[ ${excludedList || 'None'} ]

CRITICAL RULES FOR LEVEL ${cefrLevel}:
${isLowLevel 
  ? `- You MUST provide BOTH English (En) and Vietnamese translation (Vi) for aiRole, userRole, and goal. Keep initialAiMessage simple English.`
  : `- 100% ADVANCED BUSINESS / EXECUTIVE ENGLISH ONLY for En fields. Do NOT provide Vi fields.`
}

Return ONLY JSON:
{
  "scenarioTitle": "Scenario Title [${cefrLevel}]",
  "aiRoleEn": "Role 1 in English",
  ${isLowLevel ? '"aiRoleVi": "Vai trò 1 tiếng Việt",' : ''}
  "userRoleEn": "Role 2 in English",
  ${isLowLevel ? '"userRoleVi": "Vai trò 2 tiếng Việt",' : ''}
  "initialAiMessage": "Short English line to open conversation",
  "goalEn": "Goal in English",
  ${isLowLevel ? '"goalVi": "Mục tiêu tiếng Việt",' : ''}
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const titleText = parsed.scenarioTitle || `Roleplay [${cefrLevel}] ${dynamicSeed}`;

    sessionUsedRoleplayTexts.add(titleText.toLowerCase());

    return {
      id: `rp_${dynamicSeed}`,
      scenarioTitle: titleText,
      aiRoleEn: parsed.aiRoleEn || "Staff",
      aiRoleVi: parsed.aiRoleVi || undefined,
      userRoleEn: parsed.userRoleEn || "Customer",
      userRoleVi: parsed.userRoleVi || undefined,
      initialAiMessage: parsed.initialAiMessage || "Hello! How can I help you?",
      goalEn: parsed.goalEn || "Complete conversational objective",
      goalVi: parsed.goalVi || undefined
    };
  } catch (error) {
    console.warn(`Groq Roleplay Error for ${cefrLevel}:`, error);
    const fallbackList = DYNAMIC_ROLEPLAY_FALLBACKS[cefrLevel] || DYNAMIC_ROLEPLAY_FALLBACKS['A1'];
    const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    sessionUsedRoleplayTexts.add(selected.scenarioTitle.toLowerCase());
    return selected;
  }
}