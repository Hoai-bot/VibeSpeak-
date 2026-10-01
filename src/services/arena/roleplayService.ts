// src/services/arena/roleplayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RoleplayScenario {
  scenarioTitle: string;
  aiRole: string;
  userRole: string;
  initialAiMessage: string;
  goal: string;
}

const FALLBACK_ROLEPLAY: Record<string, RoleplayScenario> = {
  A1: {
    scenarioTitle: "At the Coffee Shop [A1]",
    aiRole: "Barista",
    userRole: "Customer",
    initialAiMessage: "Hello! Welcome to Vibe Cafe. What would you like to drink today?",
    goal: "Đặt một ly cà phê và hỏi vị trí nhà vệ sinh."
  },
  B2: {
    scenarioTitle: "Quarterly Performance Review [B2]",
    aiRole: "Department Manager",
    userRole: "Senior Specialist",
    initialAiMessage: "Thanks for coming in. Let's discuss your team's deliverables for this quarter.",
    goal: "Báo cáo tiến độ dự án, nêu khó khăn về nhân sự và đề xuất giải pháp."
  },
  C2: {
    scenarioTitle: "High-Stakes M&A Negotiation [C2]",
    aiRole: "Managing Director",
    userRole: "Lead Legal Counsel",
    initialAiMessage: "The board is apprehensive about the regulatory hurdles in this cross-border acquisition. How do you propose we mitigate these antitrust liabilities?",
    goal: "Articulate a strategic legal framework to navigate antitrust regulations while securing maximum shareholder value."
  }
};

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  let languageRule = '';

  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for scenario description, roles, and goal. Keep initialAiMessage in simple English.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL for goal and scenario description (English + Vietnamese translation).`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED BUSINESS/ACADEMIC ENGLISH. Executive level scenario.`;
  }

  const prompt = `Generate ONE Roleplay Scenario tailored STRICTLY to CEFR Level ${cefrLevel}.

RULES:
${languageRule}

Return ONLY JSON:
{
  "scenarioTitle": "Scenario Title",
  "aiRole": "Role 1 Name",
  "userRole": "Role 2 Name",
  "initialAiMessage": "Initial line in English",
  "goal": "Goal matching language rule"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const parsed: RoleplayScenario = JSON.parse(response.choices[0]?.message?.content || '{}');
    const fallback = FALLBACK_ROLEPLAY[cefrLevel] || FALLBACK_ROLEPLAY['A1'];

    return {
      scenarioTitle: parsed.scenarioTitle || fallback.scenarioTitle,
      aiRole: parsed.aiRole || fallback.aiRole,
      userRole: parsed.userRole || fallback.userRole,
      initialAiMessage: parsed.initialAiMessage || fallback.initialAiMessage,
      goal: parsed.goal || fallback.goal
    };
  } catch (error) {
    console.warn("Groq Roleplay Error, using fallback data:", error);
    return FALLBACK_ROLEPLAY[cefrLevel] || FALLBACK_ROLEPLAY['A1'];
  }
}