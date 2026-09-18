// src/services/arena/relayService.ts
import { Groq } from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RelayChallenge {
  topic: string;
  player1Prompt: string;
  player2Prompt: string;
  scoringFocus: string;
}

export async function generateRelayChallenge(cefrLevel: string = 'B2'): Promise<RelayChallenge> {
  let levelRules = '';
  if (cefrLevel === 'A1' || cefrLevel === 'A2') {
    levelRules = `
- CEFR LEVEL: BASIC (${cefrLevel})
- Sentences MUST be simple and short (4-7 words per player).
- Player 1: "I love learning English on my phone."
- Player 2: "Me too, it helps me speak much better."`;
  } else if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    levelRules = `
- CEFR LEVEL: INTERMEDIATE (${cefrLevel})
- Sentences MUST be natural conversation/workplace sentences (8-12 words per player).
- Player 1: "Traditional learning methods are getting outdated for young students."
- Player 2: "That is why we built VibeSpeak to gamify English learning."`;
  } else {
    levelRules = `
- CEFR LEVEL: ADVANCED (${cefrLevel})
- Sentences MUST use business/tech jargon and complex clauses (12-18 words per player).
- Player 1: "Legacy corporate training infrastructure lacks real-time interactive feedback for global teams."
- Player 2: "Deploying our scalable AI voice matrix will immediately optimize employee fluency metrics."`;
  }

  const prompt = `Generate ONE 2-Player Relay Challenge tailored STRICTLY to CEFR level ${cefrLevel}.

${levelRules}

Return ONLY JSON:
{
  "topic": "Challenge Title",
  "player1Prompt": "Player 1 sentence",
  "player2Prompt": "Player 2 sentence",
  "scoringFocus": "Detailed Vietnamese feedback criteria"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.9,
      response_format: { type: 'json_object' },
    });

    const parsed: RelayChallenge = JSON.parse(response.choices[0]?.message?.content || '{}');
    return parsed;
  } catch (error) {
    return {
      topic: `Relay Challenge (${cefrLevel})`,
      player1Prompt: cefrLevel.startsWith('A') ? "Do you like learning English online?" : "Global communication requires strong pronunciation skills.",
      player2Prompt: cefrLevel.startsWith('A') ? "Yes, I practice speaking every single day." : "Our platform provides instant voice feedback to solve that.",
      scoringFocus: "Giữ nhịp độ giao tiếp tự nhiên giữa 2 bạn."
    };
  }
}