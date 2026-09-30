// src/services/drills/station3Service.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface ShadowBossItem {
  bossName: string;
  bossHp: number;
  phrase: string;
  phonetics: string;
  rhythmTip: string;
}

export async function generateShadowBoss(cefrLevel: string = 'B2'): Promise<ShadowBossItem> {
  const prompt = `You are an ELT Phonetics Expert designing a Shadowing Boss Challenge for CEFR Level ${cefrLevel}.
Generate ONE rhythmic English sentence (8-14 words) suited for spoken shadowing practice.

Return ONLY JSON:
{
  "bossName": "Cyber Phantasm [${cefrLevel}]",
  "bossHp": 100,
  "phrase": "The ultimate rhythm requires absolute focus and clear articulation.",
  "phonetics": "/ði ˈʌltɪmət ˈrɪðəm rɪˈkwaɪəz ˈæbsəluːt ˈfəʊkəs ænd klɪər ɑːˌtɪkjʊˈleɪʃn/",
  "rhythmTip": "Nhấn mạnh vào các từ 'ultimate', 'rhythm', 'focus', 'articulation'."
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });
    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    return {
      bossName: `Shadow Warlord [${cefrLevel}]`,
      bossHp: 100,
      phrase: "Speed and precision dictate the outcome of every cyber confrontation.",
      phonetics: "/spiːd ænd prɪˈsɪʒn dɪkˈteɪt ði ˈaʊtkʌm ɒv ˈevri ˈsaɪbər kɒnfrʌnˈteɪʃn/",
      rhythmTip: "Duy trì tốc độ nói ổn định và bật rõ âm tiết /prɪˈsɪʒn/."
    };
  }
}