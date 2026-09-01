import { supabase } from './supabaseClient'; // Đã sửa đường dẫn cùng thư mục

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const CYBERPUNK_JUDGE_PROMPT = `
You are an elite, strict English language evaluator in a cyberpunk dystopian world.
Your job is to ruthlessly analyze the user's English sentence and provide corrections.
Pay special attention to fluency (detecting hesitations like "um", "uh", "ah").

You MUST return the output ONLY as a valid JSON object with exactly these keys:
- "score": A strict integer from 0 to 100 assessing overall quality (deduct heavily for bad grammar or hesitations).
- "corrected_grammar": The sentence with absolutely correct foundational grammar.
- "corrected_natural": A more natural, polite way to say it in daily life.
- "corrected_native": A highly idiomatic, native-like phrasing (slang allowed if appropriate).
- "explanation": A detailed, direct critique in Vietnamese. Explain why points were deducted, especially pointing out hesitations ("um", "uh") or unnatural word choices. Be strict but educational.
`;

export async function analyzeAndSaveSpeech(userId: string, originalText: string) {
  if (!GROQ_API_KEY) {
    console.error("❌ Thiếu API Key của Groq!");
    return null;
  }

  try {
    console.log("🚀 Bắt đầu gửi dữ liệu lên Giám khảo GPT-OSS 120B...");
    
    // 1. GỌI API CHẤM ĐIỂM
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", // ĐÃ CHỐT: Model chuẩn theo tài khoản Groq của bạn
        messages: [
          { role: "system", content: CYBERPUNK_JUDGE_PROMPT },
          { role: "user", content: originalText }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);

    // 2. BÓC TÁCH DỮ LIỆU JSON
    const aiResult = JSON.parse(data.choices[0].message.content);
    console.log("✅ Chấm điểm xong! Điểm số:", aiResult.score);

    // 3. LƯU KẾT QUẢ VÀO SUPABASE
    const { error: dbError } = await supabase
      .from('user_error_logs')
      .insert([
        {
          user_id: userId,
          original_text: originalText,
          score: aiResult.score,
          corrected_grammar: aiResult.corrected_grammar,
          corrected_natural: aiResult.corrected_natural,
          corrected_native: aiResult.corrected_native,
          explanation: aiResult.explanation
        }
      ]);

    if (dbError) {
      console.error("❌ Lỗi lưu DB Supabase:", dbError.message);
      return aiResult; 
    }

    console.log("💾 Đã lưu hồ sơ phạm lỗi vào Cơ sở dữ liệu Supabase!");
    
    return aiResult;

  } catch (error) {
    console.error("❌ Lỗi hệ thống AI:", error);
    return null;
  }
}