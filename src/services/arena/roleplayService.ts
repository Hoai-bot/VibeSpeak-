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
  const randomSeed = Math.random().toString(36).substring(7) + "_" + Date.now();

  let languageRule = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    languageRule = `- LANGUAGE: 100% VIETNAMESE for scenario description and goal. Keep initialAiMessage in simple English.`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    languageRule = `- LANGUAGE: BILINGUAL for goal and scenario description.`;
  } else {
    languageRule = `- LANGUAGE: 100% ADVANCED BUSINESS ENGLISH. Executive level scenario.`;
  }

  const prompt = `Generate a NEW Roleplay Scenario tailored STRICTLY to CEFR Level ${cefrLevel}.
Request ID: ${randomSeed}

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
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const parsed: RoleplayScenario = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      scenarioTitle: parsed.scenarioTitle || `Roleplay [${cefrLevel}]`,
      aiRole: parsed.aiRole || "Interlocutor",
      userRole: parsed.userRole || "Speaker",
      initialAiMessage: parsed.initialAiMessage || "Hello! How can I assist you today?",
      goal: parsed.goal || "Complete the conversational objective."
    };
  } catch (error) {
    return {
      scenarioTitle: `Roleplay Scenario [${cefrLevel}]`,
      aiRole: "Manager",
      userRole: "Employee",
      initialAiMessage: "Good morning! Let's talk about the new project timeline.",
      goal: "Clarify expectations and agree on key milestones."
    };
  }
}