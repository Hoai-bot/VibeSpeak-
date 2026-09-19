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

export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  let languageRule = '';

  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for scenario description, roles, and goal. Keep initialAiMessage in simple conversational English.
- Goal Example: "Khách hàng gọi đồ uống và hỏi đường tới khu vực ngồi ăn."`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL for goal and scenario description (English + Vietnamese translation).`;
  } else {
    languageRule = `- LANGUAGE: 100% ENGLISH for everything (Professional/Business context).`;
  }

  const prompt = `Generate ONE Roleplay Scenario tailored STRICTLY to CEFR Level ${cefrLevel}.

RULES:
${languageRule}

Return ONLY JSON:
{
  "scenarioTitle": "Scenario Title",
  "aiRole": "Role 1 Name",
  "userRole": "Role 2 Name",
  "initialAiMessage": "Short initial line in English to start conversation",
  "goal": "Communication Goal matching the language rule"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const parsed: RoleplayScenario = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      scenarioTitle: parsed.scenarioTitle || `Roleplay [${cefrLevel}]`,
      aiRole: parsed.aiRole || (cefrLevel.startsWith('A') ? "Nhân viên" : "Manager"),
      userRole: parsed.userRole || (cefrLevel.startsWith('A') ? "Khách hàng" : "Client"),
      initialAiMessage: parsed.initialAiMessage || "Hello! How can I help you today?",
      goal: parsed.goal || "Hoàn thành mục tiêu giao tiếp trong tình huống."
    };
  } catch (error) {
    return {
      scenarioTitle: `Nhập vai giao tiếp [${cefrLevel}]`,
      aiRole: cefrLevel.startsWith('A') ? "Nhân viên quán Cafe" : "Project Lead",
      userRole: cefrLevel.startsWith('A') ? "Khách hàng" : "Developer",
      initialAiMessage: "Hello! Welcome to our store. What can I get for you?",
      goal: cefrLevel.startsWith('A') 
        ? "Đặt món đồ uống yêu thích và hỏi vị trí chỗ ngồi."
        : "Discuss project milestones and clarify deadline requirements. / Thảo luận tiến độ dự án và làm rõ thời hạn."
    };
  }
}