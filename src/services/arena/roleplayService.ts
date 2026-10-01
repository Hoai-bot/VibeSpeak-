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

// 🧠 1. GẮN BỘ NHỚ LỊCH SỬ PHIÊN HỌC CHO ROLEPLAY
const sessionUsedRoleplayTexts: Set<string> = new Set();

export function clearRoleplayHistory() {
  sessionUsedRoleplayTexts.clear();
}

// KHO ĐỀ DYNAMIC FALLBACK PHÂN HÓA THEO CEFR
const DYNAMIC_ROLEPLAY_FALLBACKS: Record<string, RoleplayScenario[]> = {
  A1: [
    {
      id: 'rp_a1_1',
      scenarioTitle: "Ordering Drinks [A1]",
      aiRole: "Barista",
      userRole: "Customer",
      initialAiMessage: "Hi there! What can I get started for you today?",
      goal: "Gọi món đồ uống yêu thích và hỏi giá tiền."
    },
    {
      id: 'rp_a1_2',
      scenarioTitle: "Asking Directions [A1]",
      aiRole: "Local Passerby",
      userRole: "Tourist",
      initialAiMessage: "Hello! You look a bit lost. Need help finding a place?",
      goal: "Hỏi đường đến ga tàu điện ngầm gần nhất."
    }
  ],
  B2: [
    {
      id: 'rp_b2_1',
      scenarioTitle: "Project Deadline Negotiation [B2]",
      aiRole: "Project Director",
      userRole: "Lead Developer",
      initialAiMessage: "We have an urgent request from the client to move up the product launch by two weeks.",
      goal: "Explain technical constraints and negotiate a realistic release timeline."
    },
    {
      id: 'rp_b2_2',
      scenarioTitle: "Performance Evaluation Review [B2]",
      aiRole: "HR Manager",
      userRole: "Employee",
      initialAiMessage: "Thanks for joining. Let's review your team performance targets for this quarter.",
      goal: "Highlight your key achievements and negotiate salary adjustment."
    }
  ],
  C2: [
    {
      id: 'rp_c2_1',
      scenarioTitle: "High-Stakes Venture Capital M&A [C2]",
      aiRole: "Managing Director",
      userRole: "Chief Legal Counsel",
      initialAiMessage: "The board is hesitant regarding regulatory antitrust litigation risks in this acquisition. How do we mitigate liability?",
      goal: "Articulate a strategic legal framework navigating antitrust laws while securing optimal shareholder value."
    }
  ]
};

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  // ⚡ 2. DYNAMIC REQUEST SEED CHỐNG CACHE GROQ
  const dynamicSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const excludedList = Array.from(sessionUsedRoleplayTexts).join(' | ');

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for scenario description and goal. Keep initialAiMessage in simple English.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL for goal and scenario description (English + Vietnamese translation).`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED EXECUTIVE / BUSINESS ENGLISH. Complex corporate roleplay.`;
  }

  const prompt = `Generate ONE UNIQUE Roleplay Scenario strictly tailored to CEFR Level ${cefrLevel}.
REQUEST SEED: ${dynamicSeed}

CRITICAL UNIQUENESS RULE:
Do NOT generate any of these scenarios previously used in this session:
[ ${excludedList || 'None'} ]

RULES:
${languageRule}

Return ONLY JSON:
{
  "scenarioTitle": "Scenario Title [${cefrLevel}]",
  "aiRole": "Role 1 Name",
  "userRole": "Role 2 Name",
  "initialAiMessage": "Initial opening line in English",
  "goal": "Communication Goal matching level ${cefrLevel}"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.98,
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
      initialAiMessage: parsed.initialAiMessage || "Hello! How can I assist you today?",
      goal: parsed.goal || "Complete the conversational objective."
    };
  } catch (error) {
    console.warn(`Groq Roleplay Error on level ${cefrLevel}, applying fallback:`, error);
    
    const fallbackList = DYNAMIC_ROLEPLAY_FALLBACKS[cefrLevel] || DYNAMIC_ROLEPLAY_FALLBACKS['A1'];
    const unusedFallbacks = fallbackList.filter(item => !sessionUsedRoleplayTexts.has(item.scenarioTitle.toLowerCase()));
    
    const selected = unusedFallbacks.length > 0
      ? unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)]
      : fallbackList[Math.floor(Math.random() * fallbackList.length)];

    sessionUsedRoleplayTexts.add(selected.scenarioTitle.toLowerCase());
    return selected;
  }
}