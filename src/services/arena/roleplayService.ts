// src/services/arena/roleplayService.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });
const STORAGE_KEY_ROLEPLAY = '@vibespeak_history_arena_tier3_roleplay_v1';

export interface RoleplayScenario {
  scenarioTitle: string;
  aiRole: string;
  userRole: string;
  initialAiMessage: string;
  goal: string;
}

async function getRoleplayHistory(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY_ROLEPLAY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveRoleplayHistory(title: string): Promise<void> {
  try {
    const history = await getRoleplayHistory();
    const clean = title.toLowerCase().trim();
    if (!history.includes(clean)) {
      history.push(clean);
      if (history.length > 50) history.shift();
      await AsyncStorage.setItem(STORAGE_KEY_ROLEPLAY, JSON.stringify(history));
    }
  } catch (e) { console.error(e); }
}

export async function generateRoleplayScenario(cefrLevel: string = 'B2'): Promise<RoleplayScenario> {
  const history = await getRoleplayHistory();
  const excludeList = history.join(', ');

  const prompt = `You are a Professional Roleplay Scenario Designer for Business English (Tier 3 Arena).
Generate ONE UNIQUE roleplay situation between User and AI Bot.
- FORBIDDEN SCENARIOS: [${excludeList}].

Return ONLY JSON:
{
  "scenarioTitle": "Venture Capital Pitch",
  "aiRole": "Tech Investor",
  "userRole": "Startup Founder",
  "initialAiMessage": "Welcome to our investment firm. Why should we invest in your English AI app?",
  "goal": "Thuyết phục nhà đầu tư trong 30 giây về tính khả thi của ứng dụng VibeSpeak."
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.95,
      response_format: { type: 'json_object' },
    });

    const parsed: RoleplayScenario = JSON.parse(response.choices[0]?.message?.content || '{}');
    if (parsed.scenarioTitle) await saveRoleplayHistory(parsed.scenarioTitle);
    return parsed;
  } catch (error) {
    return {
      scenarioTitle: "Tech Job Interview",
      aiRole: "HR Manager AI",
      userRole: "Software Engineer Applicant",
      initialAiMessage: "Can you describe a challenging technical project you recently completed?",
      goal: "Giới thiệu bản thân và kinh nghiệm xử lý công nghệ bằng tiếng Anh tự tin."
    };
  }
}