// src/services/drills/station4Service.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface GhostTransmissionItem {
  senderCode: string;
  incomingAudioText: string;
  contextMessage: string;
  requiredResponsePrompt: string;
}

export async function generateGhostTransmission(cefrLevel: string = 'B2'): Promise<GhostTransmissionItem> {
  const prompt = `Generate ONE incoming audio transmission challenge for CEFR Level ${cefrLevel}.

Return ONLY JSON:
{
  "senderCode": "GHOST-SIGNAL-09",
  "incomingAudioText": "We are facing an unexpected server outage! How fast can your team deploy the patch?",
  "contextMessage": "Tín hiệu khẩn cấp từ Trạm vũ trụ. Cần câu trả lời đưa ra giải pháp ngay lập tức.",
  "requiredResponsePrompt": "Hãy đưa ra thời gian cụ thể và các bước xử lý sự cố bằng tiếng Anh."
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-20b',
      temperature: 0.85,
      response_format: { type: 'json_object' },
    });
    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    return {
      senderCode: "GHOST-SIGNAL-X",
      incomingAudioText: "Security breach detected in Sector 7! State your authentication protocol now!",
      contextMessage: "Tín hiệu mã hóa yêu cầu xác thực quyền truy cập khẩn cấp.",
      requiredResponsePrompt: "Trả lời xác nhận danh tính và yêu cầu hỗ trợ mã hóa."
    };
  }
}