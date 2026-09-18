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
- Situation: Ordering food, asking directions, meeting a new friend at school.
- AI Initial Message: Simple question (e.g., "Hello! What drink would you like to order today?")`;
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

Return ONLY JSON:
{
  "scenarioTitle": "Scenario Name",
  "aiRole": "AI Character",
  "userRole": "User Character",
  "initialAiMessage": "AI greeting/question",
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
    return parsed;
  } catch (error) {
    return {
      scenarioTitle: `Roleplay (${cefrLevel})`,
      aiRole: cefrLevel.startsWith('A') ? "Cafe Staff" : "Tech Interviewer",
      userRole: cefrLevel.startsWith('A') ? "Customer" : "Applicant",
      initialAiMessage: cefrLevel.startsWith('A') ? "Welcome! What can I get for you today?" : "Tell me about your experience with AI technology.",
      goal: "Giao tiếp tự nhiên và tự tin hoàn thành tình huống."
    };
  }
}