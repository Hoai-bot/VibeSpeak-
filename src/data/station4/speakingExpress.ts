// src/data/station4/speakingExpress.ts

export interface ExpressExerciseItem {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  title: string;
  expressType: 'quick_response' | 'speed_reading' | 'situation_flash';
  promptEn: string;
  promptVi?: string;
  timeLimitSeconds: number; // Thời gian phản xạ siêu ngắn (10-15s)
  suggestedKeywords: string[];
}

export const SPEAKING_EXPRESS_DATA: ExpressExerciseItem[] = [
  // ==================== LEVEL A1 (15-20 Seconds) ====================
  {
    id: 'exp_a1_1',
    level: 'A1',
    title: "Quick Response [A1]",
    expressType: 'quick_response',
    promptEn: "Someone says: 'Good morning! How are you feeling today?' Respond immediately!",
    promptVi: "Ai đó nói: 'Chào buổi sáng! Hôm nay bạn thế nào?' Hãy đáp lại ngay!",
    timeLimitSeconds: 15,
    suggestedKeywords: ["Good morning", "I am feeling", "great", "thank you"]
  },
  {
    id: 'exp_a1_2',
    level: 'A1',
    title: "Situation Flash [A1]",
    expressType: 'situation_flash',
    promptEn: "You are at a coffee shop. Order an iced coffee in under 10 seconds!",
    promptVi: "Bạn đang ở quán cafe. Hãy gọi 1 ly cà phê đá trong dưới 10 giây!",
    timeLimitSeconds: 12,
    suggestedKeywords: ["I would like", "iced coffee", "please", "how much"]
  },
  {
    id: 'exp_a1_3',
    level: 'A1',
    title: "Speed Reading [A1]",
    expressType: 'speed_reading',
    promptEn: "Read aloud fast: 'The sun is shining, the birds are singing, and today is a beautiful day!'",
    promptVi: "Đọc to nhanh: 'Mặt trời đang tỏa nắng, chim đang hót, và hôm nay là một ngày tuyệt vời!'",
    timeLimitSeconds: 10,
    suggestedKeywords: ["sun", "shining", "beautiful day"]
  },

  // ==================== LEVEL A2 ====================
  {
    id: 'exp_a2_1',
    level: 'A2',
    title: "Quick Response [A2]",
    expressType: 'quick_response',
    promptEn: "A tourist asks: 'Excuse me, where is the nearest supermarket?' Guide them quickly!",
    promptVi: "Khách du lịch hỏi đường đến siêu thị gần nhất. Hãy chỉ đường nhanh!",
    timeLimitSeconds: 15,
    suggestedKeywords: ["Go straight", "turn left", "next to", "on your right"]
  },
  {
    id: 'exp_a2_2',
    level: 'A2',
    title: "Speed Reading [A2]",
    expressType: 'speed_reading',
    promptEn: "Read aloud: 'I love traveling to new cities because I can try different foods and meet friendly locals.'",
    promptVi: "Đọc to: 'Tôi thích đi du lịch đến các thành phố mới vì có thể thử đồ ăn và gặp gỡ người dân địa phương.'",
    timeLimitSeconds: 12,
    suggestedKeywords: ["traveling", "different foods", "friendly locals"]
  },

  // ==================== LEVEL B1 ====================
  {
    id: 'exp_b1_1',
    level: 'B1',
    title: "Situation Flash [B1]",
    expressType: 'situation_flash',
    promptEn: "Your flight is delayed by 3 hours. Express your complaint politely to the airline staff!",
    promptVi: "Chuyến bay bị trễ 3 tiếng. Hãy phàn nàn lịch sự với nhân viên hãng bay!",
    timeLimitSeconds: 15,
    suggestedKeywords: ["I would like to complain", "delay", "compensation", "meal voucher"]
  },

  // ==================== LEVEL B2 ====================
  {
    id: 'exp_b2_1',
    level: 'B2',
    title: "Quick Response [B2]",
    expressType: 'quick_response',
    promptEn: "Your manager asks: 'Why should we approve your budget request for this project?' Pitch in 15 seconds!",
    timeLimitSeconds: 15,
    suggestedKeywords: ["return on investment", "efficiency", "market expansion", "cost-effective"]
  },

  // ==================== LEVEL C1 ====================
  {
    id: 'exp_c1_1',
    level: 'C1',
    title: "Situation Flash [C1]",
    expressType: 'situation_flash',
    promptEn: "Rebut this statement in 15s: 'Remote working completely destroys corporate culture and productivity.'",
    timeLimitSeconds: 15,
    suggestedKeywords: ["on the contrary", "autonomy", "retention metrics", "flexible framework"]
  },

  // ==================== LEVEL C2 ====================
  {
    id: 'exp_c2_1',
    level: 'C2',
    title: "Speed Impromptu [C2]",
    expressType: 'quick_response',
    promptEn: "Summarize the core ethical conflict of artificial general intelligence in under 15 seconds!",
    timeLimitSeconds: 15,
    suggestedKeywords: ["existential risk", "alignment problem", "epistemic autonomy", "regulatory frameworks"]
  }
];