// api/evaluate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

// 1. Khai báo Interfaces định dạng dữ liệu cho TypeScript
interface WordAnalysisItem {
  word: string;
  isCorrect: boolean;
  phonemeError?: string;
}

interface EvaluationResult {
  pronunciation: number;
  fluency: number;
  reflexes: number;
  wordAnalysis: WordAnalysisItem[];
  missingRequirements: string[];
  detailedFeedback: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Kiểm tra API Key an toàn
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('LỖI HỆ THỐNG: GROQ_API_KEY chưa được cấu hình trên Vercel!');
    return res.status(500).json({
      success: false,
      error: 'Máy chủ chưa được cấu hình GROQ_API_KEY. Vui lòng kiểm tra Vercel Settings.',
    });
  }

  try {
    const groq = new Groq({ apiKey });
    const { audioFile, userAudioTranscript: inputTranscript, targetPhrase } = req.body || {};

    let finalTranscript = inputTranscript;

    // 3. Xử lý Whisper STT nếu client gửi file audio (Bổ sung model 'whisper-large-v3' tránh lỗi 400)
    if (audioFile && !finalTranscript) {
      try {
        const transcription = await groq.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-large-v3', // <-- THUỘC TÍNH BẮT BUỘC ĐÃ ĐƯỢC BỔ SUNG
          language: 'en',
          response_format: 'json',
        });
        finalTranscript = transcription.text;
      } catch (sttError: any) {
        console.error('❌ Groq Whisper STT Error:', sttError);
        return res.status(400).json({
          success: false,
          error: 'Lỗi nhận diện giọng nói từ Whisper API',
          details: sttError?.message || sttError,
        });
      }
    }

    // 4. Gọi LLM để chấm điểm theo đúng schema của Frontend
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI English Pronunciation Referee for VibeSpeak Cyber Arena.
Evaluate the user's spoken text against the target phrase.
Return ONLY a valid JSON object matching this schema:
{
  "pronunciation": number (0-100),
  "fluency": number (0-100),
  "reflexes": number (0-100),
  "wordAnalysis": [
    {
      "word": "string",
      "isCorrect": boolean,
      "phonemeError": "string"
    }
  ],
  "missingRequirements": ["string"],
  "detailedFeedback": "string"
}`,
        },
        {
          role: 'user',
          content: `Target Phrase: "${targetPhrase || ''}"\nUser Spoke: "${finalTranscript || ''}"`,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    
    // 5. Parse dữ liệu và ép kiểu TypeScript an toàn (Giải quyết lỗi TS2339)
    const evalResult = JSON.parse(rawContent) as Partial<EvaluationResult>;

    const responseData: EvaluationResult = {
      pronunciation: evalResult.pronunciation ?? 0,
      fluency: evalResult.fluency ?? 0,
      reflexes: evalResult.reflexes ?? 0,
      wordAnalysis: evalResult.wordAnalysis ?? [],
      missingRequirements: evalResult.missingRequirements ?? [],
      detailedFeedback: evalResult.detailedFeedback ?? 'Không có phản hồi chi tiết.',
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('Lỗi trong quá trình chấm điểm:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống chấm điểm AI',
      details: error?.message || error,
    });
  }
}