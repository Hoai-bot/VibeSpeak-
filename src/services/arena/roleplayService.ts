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

// 🎯 KHO ĐỀ DYNAMIC FALLBACK CHO ROLEPLAY THEO TỪNG LEVEL
const DYNAMIC_ROLEPLAY_FALLBACKS: Record<string, RoleplayScenario[]> = {
  A1: [
    {
      scenarioTitle: "Ordering Drinks [A1]",
      aiRole: "Barista",
      userRole: "Customer",
      initialAiMessage: "Hi there! What can I get started for you today?",
      goal: "Gọi món đồ uống yêu thích và hỏi giá tiền."
    },
    {
      scenarioTitle: "Asking Directions [A1]",
      aiRole: "Local Passerby",
      userRole: "Tourist",
      initialAiMessage: "Hello! You look a bit lost. Need help finding a place?",
      goal: "Hỏi đường đến ga tàu điện ngầm gần nhất."
    }
  ],
  A2: [
    {
      scenarioTitle: "Hotel Check-In [A2]",
      aiRole: "Receptionist",
      userRole: "Guest",
      initialAiMessage: "Good afternoon! Welcome to Grand Hotel. Do you have a reservation?",
      goal: "Xác nhận đặt phòng và hỏi thời gian phục vụ bữa sáng."
    }
  ],
  B1: [
    {
      scenarioTitle: "Product Return at Electronics Store [B1]",
      aiRole: "Store Manager",
      userRole: "Customer",
      initialAiMessage: "Hello, I understand you're unsatisfied with your recent purchase. What seems to be the issue?",
      goal: "Giải thích lỗi sản phẩm và yêu cầu đổi mới hoặc hoàn tiền. / Explain product defect and request a refund."
    }
  ],
  B2: [
    {
      scenarioTitle: "Project Deadline Negotiation [B2]",
      aiRole: "Project Director",
      userRole: "Lead Developer",
      initialAiMessage: "We have an urgent request from the client to move up the product launch by two weeks.",
      goal: "Explain technical constraints and negotiate a realistic release timeline."
    }
  ],
  C1: [
    {
      scenarioTitle: "Crisis Management PR Conference [C1]",
      aiRole: "Investigative Journalist",
      userRole: "Corporate Spokesperson",
      initialAiMessage: "Reports suggest your firm was aware of the data breach days before informing regulators. How do you respond?",
      goal: "Defend corporate compliance integrity while managing reputational liabilities diplomatically."
    }
  ],
  C2: [
    {
      scenarioTitle: "High-Stakes Venture Capital M&A [C2]",
      aiRole: "Managing Director",
      userRole: "Chief Legal Counsel",
      initialAiMessage: "The board is hesitant regarding regulatory antitrust litigation risks in this acquisition. How do we mitigate liability?",
      goal: "Articulate a strategic legal framework navigating antitrust laws while securing optimal shareholder value."
    }
  ]
};

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  const randomSeed = Math.random().toString(36).substring(7) + "_" + Date.now();

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for scenario description, roles, and goal. Keep initialAiMessage in simple conversational English.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL for goal and scenario description (English + Vietnamese translation).`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED EXECUTIVE / BUSINESS ENGLISH. Complex corporate roleplay.`;
  }

  const prompt = `Generate ONE Roleplay Scenario strictly tailored to CEFR Level ${cefrLevel}.
Request Seed: ${randomSeed}

RULES:
${languageRule}

Return ONLY JSON:
{
  "scenarioTitle": "Scenario Title [${cefrLevel}]",
  "aiRole": "Role 1 Name",
  "userRole": "Role 2 Name",
  "initialAiMessage": "Initial opening line in English",
  "goal": "Communication Goal matching the level language rule"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const parsed: RoleplayScenario = JSON.parse(response.choices[0]?.message?.content || '{}');
    const levelList = DYNAMIC_ROLEPLAY_FALLBACKS[cefrLevel] || DYNAMIC_ROLEPLAY_FALLBACKS['A1'];
    const randomFallback = levelList[Math.floor(Math.random() * levelList.length)];

    return {
      scenarioTitle: parsed.scenarioTitle || randomFallback.scenarioTitle,
      aiRole: parsed.aiRole || randomFallback.aiRole,
      userRole: parsed.userRole || randomFallback.userRole,
      initialAiMessage: parsed.initialAiMessage || randomFallback.initialAiMessage,
      goal: parsed.goal || randomFallback.goal
    };
  } catch (error) {
    console.warn(`Groq Roleplay Error on level ${cefrLevel}, applying fallback:`, error);
    const levelList = DYNAMIC_ROLEPLAY_FALLBACKS[cefrLevel] || DYNAMIC_ROLEPLAY_FALLBACKS['A1'];
    return levelList[Math.floor(Math.random() * levelList.length)];
  }
}