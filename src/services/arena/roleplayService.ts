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
      scenarioTitle: "At the Coffee Shop [A1]",
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
      scenarioTitle: "Project Release Timeline [B2]",
      aiRoleEn: "Project Director",
      userRoleEn: "Lead Engineer",
      initialAiMessage: "We need to push the product launch ahead by two weeks. Can your team accommodate this?",
      goalEn: "Explain technical limitations and negotiate a realistic timeline."
    }
  ],
  C2: [
    {
      id: 'rp_c2_1',
      scenarioTitle: "Cross-Border Acquisition Antitrust Litigation [C2]",
      aiRoleEn: "Regulatory Board Chair",
      userRoleEn: "Chief Corporate Legal Counsel",
      initialAiMessage: "The merger presents severe antitrust liabilities in European markets. What is your mitigation strategy?",
      goalEn: "Articulate a legally sound compliance strategy mitigating antitrust scrutiny."
    }
  ]
};

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const excludedList = Array.from(sessionUsedRoleplayTexts).slice(-10).join(' | ');

  // 💡 NGUYÊN TẮC: Từ B2 trở lên KHÔNG DỊCH
  const isLowLevel = cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1';

  const prompt = `Generate ONE UNIQUE Roleplay Scenario strictly for CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}
EXCLUDED: [ ${excludedList || 'None'} ]

STRICT RULES:
${isLowLevel 
  ? `- MUST include BOTH English (En) AND Vietnamese (Vi) for aiRole, userRole, and goal.`
  : `- 100% ADVANCED EXECUTIVE ENGLISH ONLY for En fields. STRICTLY DO NOT PROVIDE ANY VIETNAMESE (Vi) FIELDS.`
}

Return ONLY JSON:
{
  "scenarioTitle": "Title [${cefrLevel}]",
  "aiRoleEn": "Role 1 English",
  ${isLowLevel ? '"aiRoleVi": "Vai trò 1 tiếng Việt",' : ''}
  "userRoleEn": "Role 2 English",
  ${isLowLevel ? '"userRoleVi": "Vai trò 2 tiếng Việt",' : ''}
  "initialAiMessage": "English opening line",
  "goalEn": "Goal English",
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
      aiRoleEn: parsed.aiRoleEn || "Interlocutor",
      aiRoleVi: isLowLevel ? parsed.aiRoleVi : undefined,
      userRoleEn: parsed.userRoleEn || "Speaker",
      userRoleVi: isLowLevel ? parsed.userRoleVi : undefined,
      initialAiMessage: parsed.initialAiMessage || "Hello! How can I assist you?",
      goalEn: parsed.goalEn || "Achieve goal",
      goalVi: isLowLevel ? parsed.goalVi : undefined
    };
  } catch (error) {
    const fallbackList = DYNAMIC_ROLEPLAY_FALLBACKS[cefrLevel] || DYNAMIC_ROLEPLAY_FALLBACKS['A1'];
    return fallbackList[Math.floor(Math.random() * fallbackList.length)];
  }
}