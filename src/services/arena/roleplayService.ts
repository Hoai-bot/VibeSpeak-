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
  A1: [
    {
      id: 'rp_fb_a1_1',
      scenarioTitle: "At the Coffee Shop [A1]",
      aiRoleEn: "Barista",
      aiRoleVi: "Nhân viên pha chế",
      userRoleEn: "Customer",
      userRoleVi: "Khách hàng",
      initialAiMessage: "Hello! What drink would you like today?",
      goalEn: "Order a drink and ask for the price.",
      goalVi: "Đặt một ly nước và hỏi giá tiền."
    }
  ],
  B2: [
    {
      id: 'rp_fb_b2_1',
      scenarioTitle: "Project Deadline Negotiation [B2]",
      aiRoleEn: "Project Director",
      userRoleEn: "Lead Engineer",
      initialAiMessage: "The client demands an acceleration of the release timeline by two weeks.",
      goalEn: "Explain technical constraints and negotiate a feasible delivery schedule."
    }
  ],
  C1: [
    {
      id: 'rp_fb_c1_1',
      scenarioTitle: "Venture Capital Due Diligence [C1]",
      aiRoleEn: "Managing Partner",
      userRoleEn: "Startup Founder",
      initialAiMessage: "Your burn rate is unsustainable given current macroeconomic headwinds. How do you justify this valuation?",
      goalEn: "Defend your financial projections and articulate market scalability."
    }
  ],
  C2: [
    {
      id: 'rp_fb_c2_1',
      scenarioTitle: "Cross-Border Antitrust Litigation [C2]",
      aiRoleEn: "Regulator Committee Chair",
      userRoleEn: "Chief Legal Officer",
      initialAiMessage: "The proposed merger violates European competition laws regarding market dominance in cloud infrastructure.",
      goalEn: "Structure a legally sound remedies package mitigating antitrust concerns while protecting strategic shareholder value."
    }
  ]
};

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  const uniqueSeed = `seed_rp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const isLowLevel = ['A1', 'A2', 'B1'].includes(cefrLevel);
  const excludedList = Array.from(sessionUsedRoleplayTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Language Examiner. Generate ONE Roleplay Scenario for Level ${cefrLevel}.

CRITICAL LEVEL RULES FOR LEVEL ${cefrLevel}:
${isLowLevel 
  ? `- MUST include simple English (aiRoleEn, userRoleEn, goalEn) AND Vietnamese translation (aiRoleVi, userRoleVi, goalVi).` 
  : `- 100% ADVANCED BUSINESS/EXECUTIVE ENGLISH ONLY for En fields.
- DO NOT PROVIDE ANY VIETNAMESE TRANSLATION (STRICTLY NO Vi FIELDS).`
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

  const userPrompt = `Create a UNIQUE scenario for CEFR Level ${cefrLevel}.
REQUEST ID: ${uniqueSeed}
DO NOT REPEAT: [ ${excludedList || 'None'} ]`;

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
    const titleText = parsed.scenarioTitle || `Roleplay [${cefrLevel}]`;

    sessionUsedRoleplayTexts.add(titleText.toLowerCase());

    return {
      id: uniqueSeed,
      scenarioTitle: titleText,
      aiRoleEn: parsed.aiRoleEn || "Interlocutor",
      aiRoleVi: isLowLevel ? parsed.aiRoleVi : undefined,
      userRoleEn: parsed.userRoleEn || "Speaker",
      userRoleVi: isLowLevel ? parsed.userRoleVi : undefined,
      initialAiMessage: parsed.initialAiMessage || "Hello! How can I assist you today?",
      goalEn: parsed.goalEn || "Achieve communication objective",
      goalVi: isLowLevel ? parsed.goalVi : undefined
    };
  } catch (error) {
    console.warn(`Groq Roleplay API Error for ${cefrLevel}, using strict fallback:`, error);
    
    const fallbackList = STRICT_ROLEPLAY_FALLBACKS[cefrLevel] || STRICT_ROLEPLAY_FALLBACKS['C2'];
    const selected = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    
    sessionUsedRoleplayTexts.add(selected.scenarioTitle.toLowerCase());
    return {
      ...selected,
      id: uniqueSeed
    };
  }
}