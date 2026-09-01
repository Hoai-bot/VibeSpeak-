const GROQ_API_KEY = "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";

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

async function runTest() {
  console.log("🚀 Đang gửi câu lỗi lên Giám khảo Cyberpunk (Model: Qwen 27B)...");
  const badSentence = "Um... I actually, want book table for two persons.";
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b", // CHỌN CHÍNH XÁC MODEL TỪ TÀI KHOẢN CỦA BẠN
        messages: [
          { role: "system", content: CYBERPUNK_JUDGE_PROMPT },
          { role: "user", content: badSentence }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" } 
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("\n❌ LỖI TỪ MODEL:", data.error.message);
    } else if (data.choices) {
      console.log("\n=== 🎯 CHẤM ĐIỂM THÀNH CÔNG (JSON) ===");
      console.log(data.choices[0].message.content);
    } else {
      console.log("\n⚠️ Kết quả không xác định:", data); 
    }
    
  } catch (error) {
    console.error("❌ LỖI MẠNG:", error);
  }
}

runTest();