export interface GeneratedDrill {
  text: string;
  meaning: string;
  phonetics: string;
  tip: string;
  bpm: number;
  focus: string;
}

// 🎯 KHO DỰ PHÒNG PHONG PHÚ CHO NEON BEAT PULSE
const FALLBACK_DRILLS: Record<1 | 2 | 3, GeneratedDrill[]> = {
  1: [
    { text: "Fan van", meaning: "Cái quạt & xe tải", phonetics: "/fæn væn/", tip: "/f/ không rung, /v/ rung thanh quản", bpm: 90, focus: "Minimal Pair: /f/ vs /v/" },
    { text: "Ship chip", meaning: "Con tàu & miếng khoai tây", phonetics: "/ʃɪp tʃɪp/", tip: "/ʃ/ chu môi thổi hơi, /tʃ/ bật âm ngắn", bpm: 90, focus: "Minimal Pair: /ʃ/ vs /tʃ/" },
    { text: "Think sink", meaning: "Suy nghĩ & bồn rửa", phonetics: "/θɪŋk sɪŋk/", tip: "/θ/ đặt lưỡi giữa 2 răng, /s/ kéo khóe miệng", bpm: 95, focus: "Minimal Pair: /θ/ vs /s/" },
    { text: "Pen pan", meaning: "Cây bút & cái chảo", phonetics: "/pɛn pæn/", tip: "/ɛ/ mở miệng vừa, /æ/ hạ hàm rộng", bpm: 85, focus: "Vowel Pair: /ɛ/ vs /æ/" }
  ],
  2: [
    { text: "Check it out", meaning: "Kiểm tra nó xem", phonetics: "/tʃɛk ɪ taʊt/", tip: "Nối âm /k/ từ Check sang it thành 'Check-it'", bpm: 100, focus: "Linking Consonant to Vowel" },
    { text: "Pick it up", meaning: "Nhặt nó lên", phonetics: "/pɪ kɪ tʌp/", tip: "Nối âm kép: Pick-it-up", bpm: 105, focus: "Connected Speech" }
  ],
  3: [
    { text: "Red lorry yellow lorry", meaning: "Xe tải đỏ xe tải vàng", phonetics: "/rɛd ˈlɒri ˈjɛləʊ ˈlɒri/", tip: "Luyện phản xạ chuyển đổi nhanh giữa /r/ và /l/", bpm: 120, focus: "Speed Tongue Twister" },
    { text: "She sells seashells on the seashore", meaning: "Cô ấy bán vỏ hải sản", phonetics: "/ʃiː sɛlz ˈsiːʃɛlz ɒn ðə ˈsiːʃɔː/", tip: "Phân biệt tốc độ cao giữa /ʃ/ và /s/", bpm: 130, focus: "Speed Shadowing Challenge" }
  ]
};

const ARENA_TOPICS = [
  "Explain why AI will not replace human creativity in 30 seconds.",
  "Describe your ideal cyberpunk city in the year 2099."
];

export const generateDynamicTopic = async (tier: 1 | 2 | 3): Promise<GeneratedDrill> => {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    const pool = FALLBACK_DRILLS[tier];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  try {
    const randomSeed = Math.random().toString(36).substring(7);
    const systemPrompt = `You are a Cyberpunk Voice Coach. Generate a brand new, unique pronunciation drill for Tier ${tier}.
    - Tier 1: English Minimal Pairs (2 words focusing on difficult phonetic contrasts like /f/ vs /v/, /p/ vs /b/, /θ/ vs /s/, /r/ vs /l/, /æ/ vs /ɛ/).
    - Tier 2: Connected Speech phrases (3-4 words with clear linking sounds like consonant-to-vowel or intrusive /r/).
    - Tier 3: High-speed Tongue Twisters or Shadowing sentences (8-12 words).
    
    CRITICAL: Never repeat previous drills. Random ID: ${randomSeed}.
    Return ONLY a JSON object:
    {
      "text": "drill phrase",
      "meaning": "Vietnamese meaning",
      "phonetics": "/IPA transcription/",
      "tip": "Short Vietnamese pronunciation tip",
      "bpm": number_between_80_and_130,
      "focus": "Phonetic Focus Area"
    }`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.95,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data?.choices?.[0]?.message?.content) {
      return JSON.parse(data.choices[0].message.content) as GeneratedDrill;
    }
    throw new Error("Invalid response structure");
  } catch (error) {
    const pool = FALLBACK_DRILLS[tier];
    return pool[Math.floor(Math.random() * pool.length)];
  }
};

export const generateArenaTopic = async (mode: string): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    return ARENA_TOPICS[Math.floor(Math.random() * ARENA_TOPICS.length)];
  }

  try {
    const randomSeed = Math.random().toString(36).substring(7);
    const prompt = `Generate a single short, exciting Cyberpunk English speaking prompt for mode "${mode}". Random Seed: ${randomSeed}. Keep it under 15 words. Return ONLY the string sentence.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.95
      })
    });

    const data = await response.json();
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim().replace(/^"|"$/g, '');
    }
    return ARENA_TOPICS[Math.floor(Math.random() * ARENA_TOPICS.length)];
  } catch (e) {
    return ARENA_TOPICS[Math.floor(Math.random() * ARENA_TOPICS.length)];
  }
};

// 3. CHẤM ĐIỂM GIỌNG NÓI (TỐI ƯU SO KHỚP CHÍNH XÁC KHÔNG LỖI BẤT THƯỜNG)
export const transcribeAndGradeAudio = async (
  audioBlob: Blob,
  targetText: string,
  phonetics?: string,
  tip?: string
): Promise<{ text: string; score: number }> => {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    return { text: "Audio transcribed (Offline Demo)", score: 85 };
  }

  if (!audioBlob || audioBlob.size < 500) {
    return { text: "[ BẠN CHƯA PHÁT ÂM HOẶC NÓI QUÁ NGẮN ]", score: 0 };
  }

  try {
    const mimeType = audioBlob.type || 'audio/webm';
    const extension = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm';
    
    const formData = new FormData();
    if (typeof File !== 'undefined') {
      const audioFile = new File([audioBlob], `speech.${extension}`, { type: mimeType });
      formData.append("file", audioFile);
    } else {
      formData.append("file", audioBlob, `speech.${extension}`);
    }

    formData.append("model", "whisper-large-v3");
    formData.append("language", "en");
    
    formData.append(
      "prompt", 
      `The user is pronouncing a minimal pair of two distinct words: "${targetText}". Make sure to transcribe both words separately.`
    );
    formData.append("temperature", "0.0");

    const sttRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!sttRes.ok) {
      const errText = await sttRes.text();
      console.error("❌ Whisper API Error Response:", errText);
      throw new Error(`Whisper Error HTTP Status: ${sttRes.status}`);
    }

    const sttData = await sttRes.json();
    const rawText = sttData?.text ? sttData.text.trim() : "";
    
    // Loại bỏ toàn bộ dấu chấm/phẩy rỗng
    const cleanText = rawText.replace(/^[.\s,!?]+$/, "");

    if (!cleanText || cleanText.length === 0) {
      return { text: "[ KHÔNG NGHE RÕ GIỌNG NÓI ]", score: 0 };
    }

    const transcribedText = cleanText;

    // 🎯 1. SO KHỚP CHUỖI CHUẨN HÓA CẢ TARGET VÀ USER SPEECH
    const cleanTarget = targetText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const cleanUser = transcribedText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // 🎯 2. EXACT MATCH OVERRIDE: Nếu phát âm khớp 100% với đề bài -> 100 ĐIỂM NGAY!
    if (cleanTarget === cleanUser) {
      return {
        text: transcribedText,
        score: 100
      };
    }

    // 🎯 3. KIỂM TRA ĐỘ ĐẦY ĐỦ VÀ CHẤM ĐIỂM DỰ PHÒNG
    const targetWords = cleanTarget.split(/\s+/);
    const userWords = cleanUser.split(/\s+/);

    const evalPrompt = `You are a strict English Pronunciation Evaluator.
    Target text: "${targetText}"
    User speech transcribed: "${transcribedText}"

    Strict Scoring Rules:
    1. If user speech EXACTLY matches target text, score MUST BE 100.
    2. If user speech is missing words (e.g. target has ${targetWords.length} words, but user only said ${userWords.length} words), score MUST BE BELOW 35.
    3. If user speech has partially correct words, score between 40 and 70.

    Return ONLY a raw JSON object: {"score": number}`;

    const scoreRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: evalPrompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const scoreData = await scoreRes.json();
    const scoreContent = scoreData?.choices?.[0]?.message?.content;

    let scoreVal = 0;
    if (scoreContent) {
      try {
        const parsed = JSON.parse(scoreContent);
        if (typeof parsed.score === 'number') scoreVal = parsed.score;
      } catch (e) {
        console.warn("⚠️ JSON Parse Score Warning:", e);
      }
    }

    // Phạt điểm nếu thiếu từ
    if (userWords.length < targetWords.length) {
      scoreVal = Math.min(scoreVal, 30);
    }

    return {
      text: transcribedText,
      score: scoreVal
    };
  } catch (err) {
    console.error("❌ Chi tiết lỗi Groq STT/Scoring:", err);
    return { text: "Lỗi kết nối mạng hoặc nhận diện âm thanh", score: 0 };
  }
};