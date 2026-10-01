// src/services/arena/roleplayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RoleplayScenario {
  id: string;
  scenarioTitle: string;
  aiRole: string;
  userRole: string;
  initialAiMessage: string;
  goal: string;
}

const sessionUsedRoleplayTexts: Set<string> = new Set();

export function clearRoleplayHistory() {
  sessionUsedRoleplayTexts.clear();
}

const DYNAMIC_ROLEPLAY_FALLBACKS: Record<string, RoleplayScenario[]> = {
  A1: [
    {
      id: 'rp_a1_1',
      scenarioTitle: "At the Coffee Shop / Tại quán cà phê [A1]",
      aiRole: "Barista / Nhân viên pha chế",
      userRole: "Customer / Khách hàng",
      initialAiMessage: "Hello! What drink would you like today?",
      goal: "Order a coffee and ask for the price. / Đặt một ly cà phê và hỏi giá tiền."
    }
  ],
  B2: [
    {
      id: 'rp_b2_1',
      scenarioTitle: "Project Deadline Negotiation [B2]",
      aiRole: "Project Director",
      userRole: "Lead Developer",
      initialAiMessage: "We have an urgent request from the client to move up the release date by two weeks.",
      goal: "Explain technical constraints and negotiate a feasible delivery timeline."
    }
  ]
};

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const excludedList = Array.from(sessionUsedRoleplayTexts).join(' | ');

  let levelInstruction = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1') {
    levelInstruction = `LEVEL ${cefrLevel} MANDATORY RULE:
- scenarioTitle, aiRole, userRole, and goal MUST BE BILINGUAL (Format: "English / Bản dịch tiếng Việt").
- initialAiMessage MUST BE simple English sentence for CEFR ${cefrLevel}.`;
  } else {
    levelInstruction = `LEVEL ${cefrLevel} MANDATORY RULE:
- 100% ADVANCED BUSINESS / EXECUTIVE ENGLISH. NO VIETNAMESE TRANSLATION.`;
  }

  const prompt = `Generate ONE UNIQUE Roleplay Scenario strictly tailored to CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}

EXCLUDED PREVIOUS SCENARIOS:
[ ${excludedList || 'None'} ]

${levelInstruction}

Return ONLY JSON:
{
  "scenarioTitle": "Title [${cefrLevel}]",
  "aiRole": "Role 1",
  "userRole": "Role 2",
  "initialAiMessage": "Short English opening line",
  "goal": "Goal text matching level rule"
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
      aiRole: parsed.aiRole || "Interlocutor",
      userRole: parsed.userRole || "Speaker",
      initialAiMessage: parsed.initialAiMessage || "Hello! How can I help you?",
      goal: parsed.goal || "Complete conversation goal / Hoàn thành mục tiêu giao tiếp"
    };
  } catch (error) {
    console.warn(`Groq Roleplay Error, applying fallback for ${cefrLevel}:`, error);
    const fallbackList = DYNAMIC_ROLEPLAY_FALLBACKS[cefrLevel] || DYNAMIC_ROLEPLAY_FALLBACKS['A1'];
    const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    sessionUsedRoleplayTexts.add(selected.scenarioTitle.toLowerCase());
    return selected;
  }
}