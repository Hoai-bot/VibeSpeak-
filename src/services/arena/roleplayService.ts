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

export async function generateRoleplayScenario(cefrLevel: string = 'B2'): Promise<RoleplayScenario> {
  let levelRules = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    levelRules = `
- CEFR LEVEL: BASIC (${cefrLevel})
- Make sure initialAiMessage directly triggers ALL parts mentioned in the goal.
- Example for Cafeteria: "Hello! Welcome to the school campus. What drink would you like to order, and do you need directions to the seating area?"`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    levelRules = `
- CEFR LEVEL: INTERMEDIATE (${cefrLevel})
- Situation: Job interview, reporting a problem to customer service, travel booking.
- AI Initial Message: "Can you tell me about a project you recently completed at work?"`;
  } else {
    levelRules = `
- CEFR LEVEL: ADVANCED (${cefrLevel})
- Situation: Pitching to Venture Capitalists, salary negotiation, crisis management in tech.
- AI Initial Message: "Your startup valuation seems high. Why should our fund invest $1M in your platform?"`;
  }

  const prompt = `Generate ONE Roleplay Scenario tailored STRICTLY to CEFR Level ${cefrLevel}.

${levelRules}

CRITICAL: The "goal" and the "initialAiMessage" MUST match 100%. If goal requires asking directions, initialAiMessage MUST mention or prompt for directions.

Return ONLY JSON:
{
  "scenarioTitle": "Scenario Name",
  "aiRole": "AI Character",
  "userRole": "User Character",
  "initialAiMessage": "AI greeting/question matching the goal",
  "goal": "Vietnamese explanation of user goal"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const parsed: RoleplayScenario = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      scenarioTitle: parsed.scenarioTitle || `Roleplay (${cefrLevel})`,
      aiRole: parsed.aiRole || (cefrLevel.startsWith('A') ? "Cafeteria Staff" : "Tech Interviewer"),
      userRole: parsed.userRole || (cefrLevel.startsWith('A') ? "Student" : "Applicant"),
      initialAiMessage: parsed.initialAiMessage || (cefrLevel.startsWith('A') ? "Hello! What drink would you like, and do you need help finding the table?" : "Tell me about your experience with AI technology."),
      goal: parsed.goal || "Giao tiếp tự nhiên và tự tin hoàn thành tình huống."
    };
  } catch (error) {
    return {
      scenarioTitle: `Ordering at the Cafeteria [${cefrLevel}]`,
      aiRole: "Cafeteria Staff",
      userRole: "Student",
      initialAiMessage: "Hello! What drink would you like to order today, and do you need directions to the dining hall?",
      goal: "User đặt đồ uống và hỏi đường đi tới khu vực ăn uống."
    };
  }
}