// src/data/station3/bossScenarios.ts

export interface BossScenarioItem {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  bossName: string;
  bossTitle: string;
  bossAvatar: string; // Emoji hoặc đường dẫn ảnh đại diện
  maxHp: number;
  timeLimitSeconds: number;
  bossChallengeEn: string; // Lời khiêu chiến / Câu thoại Boss đưa ra
  bossChallengeVi?: string; // Bản dịch tiếng Việt (Cho A1-B1)
  expectedResponsePromptEn: string; // Định hướng câu trả lời của người chơi
  expectedResponsePromptVi?: string;
  keyTargetPhrases: string[]; // Từ khóa / cụm từ trọng tâm để ghi điểm sát thương
}

export const BOSS_SCENARIOS_DATA: BossScenarioItem[] = [
  // ==================== LEVEL A1 (EASY BOSSES) ====================
  {
    id: 'boss_a1_1',
    level: 'A1',
    bossName: 'Gargoyle Golem',
    bossTitle: 'Kẻ Gác Cổng Đá',
    bossAvatar: '🗿',
    maxHp: 100,
    timeLimitSeconds: 20,
    bossChallengeEn: "Halt! Who goes there? State your name and your age to pass!",
    bossChallengeVi: "Dừng lại! Ai đó? Hãy xưng tên và tuổi để được đi qua!",
    expectedResponsePromptEn: "Introduce your name and age clearly.",
    expectedResponsePromptVi: "Giới thiệu rõ ràng tên và tuổi của bạn.",
    keyTargetPhrases: ["My name is", "I am", "years old"]
  },
  {
    id: 'boss_a1_2',
    level: 'A1',
    bossName: 'Goblin Cook',
    bossTitle: 'Vua Đếp Quỷ',
    bossAvatar: '👺',
    maxHp: 100,
    timeLimitSeconds: 20,
    bossChallengeEn: "Welcome to my dungeon! What is your favorite food for dinner?",
    bossChallengeVi: "Chào mừng đến ngục tối! Món ăn yêu thích của bạn cho bữa tối là gì?",
    expectedResponsePromptEn: "Tell the boss about your favorite dish and why.",
    expectedResponsePromptVi: "Kể cho Boss nghe món ăn yêu thích và lý do.",
    keyTargetPhrases: ["My favorite food is", "I like to eat", "delicious"]
  },
  {
    id: 'boss_a1_3',
    level: 'A1',
    bossName: 'Phantom Kitten',
    bossTitle: 'Mèo Linh Hồn',
    bossAvatar: '🐱‍👤',
    maxHp: 100,
    timeLimitSeconds: 20,
    bossChallengeEn: "Meow! Do you have any pets at home? Describe them to me!",
    bossChallengeVi: "Meo! Bạn có thú cưng nào ở nhà không? Hãy mô tả chúng!",
    expectedResponsePromptEn: "Describe a pet you have or want to have.",
    expectedResponsePromptVi: "Mô tả một vật nuôi bạn có hoặc muốn có.",
    keyTargetPhrases: ["I have a", "It is very", "cute", "friendly"]
  },
  {
    id: 'boss_a1_4',
    level: 'A1',
    bossName: 'Clockwork Automaton',
    bossTitle: 'Người Máy Đồng Hồ',
    bossAvatar: '🤖',
    maxHp: 100,
    timeLimitSeconds: 20,
    bossChallengeEn: "Tick-tock! What time do you usually wake up in the morning?",
    bossChallengeVi: "Tích tắc! Bạn thường thức dậy lúc mấy giờ vào buổi sáng?",
    expectedResponsePromptEn: "State your daily morning wake-up time.",
    expectedResponsePromptVi: "Nói về thời gian thức dậy hàng ngày của bạn.",
    keyTargetPhrases: ["I wake up at", "o'clock", "every morning"]
  },
  {
    id: 'boss_a1_5',
    level: 'A1',
    bossName: 'Frost Fairy',
    bossTitle: 'Tiên Băng Giá',
    bossAvatar: '🧚‍♀️',
    maxHp: 100,
    timeLimitSeconds: 20,
    bossChallengeEn: "Brrr! The weather is cold. Which season do you like best?",
    bossChallengeVi: "Lạnh quá! Thời tiết đang lạnh. Bạn thích mùa nào nhất?",
    expectedResponsePromptEn: "Talk about your favorite season and weather.",
    expectedResponsePromptVi: "Nói về mùa và thời tiết bạn yêu thích.",
    keyTargetPhrases: ["I like", "season", "weather is", "sunny", "warm"]
  },

  // ==================== LEVEL A2 (MEDIUM-EASY BOSSES) ====================
  {
    id: 'boss_a2_1',
    level: 'A2',
    bossName: 'Cyber Centaur',
    bossTitle: 'Nhân Mã Công Nghệ',
    bossAvatar: '🦄',
    maxHp: 120,
    timeLimitSeconds: 30,
    bossChallengeEn: "Human traveler! Where did you go on your last holiday trip?",
    bossChallengeVi: "Lữ khách! Bạn đã đi đâu trong chuyến du lịch gần đây nhất?",
    expectedResponsePromptEn: "Describe your recent vacation and what you did there.",
    expectedResponsePromptVi: "Mô tả kỳ nghỉ gần đây và những việc bạn đã làm.",
    keyTargetPhrases: ["I went to", "I visited", "The weather was", "beautiful"]
  },
  {
    id: 'boss_a2_2',
    level: 'A2',
    bossName: 'Shadow Shopkeeper',
    bossTitle: 'Thương Nhân Bóng Đêm',
    bossAvatar: '🥷',
    maxHp: 120,
    timeLimitSeconds: 30,
    bossChallengeEn: "Looking for gear? Tell me what clothes you wear for winter!",
    bossChallengeVi: "Tìm trang bị sao? Nói cho ta biết bạn mặc quần áo gì vào mùa đông!",
    expectedResponsePromptEn: "Describe winter clothing choices and colors.",
    expectedResponsePromptVi: "Mô tả lựa chọn trang phục mùa đông và màu sắc.",
    keyTargetPhrases: ["I wear", "heavy coat", "warm sweater", "boots"]
  },
  {
    id: 'boss_a2_3',
    level: 'A2',
    bossName: 'Iron Minotaur',
    bossTitle: 'Bò Tót Thiết Giáp',
    bossAvatar: '🐂',
    maxHp: 120,
    timeLimitSeconds: 30,
    bossChallengeEn: "Roar! How do you stay healthy and active during the week?",
    bossChallengeVi: "Gầm! Bạn làm thế nào để duy trì sức khỏe và năng động trong tuần?",
    expectedResponsePromptEn: "Explain your sports or healthy lifestyle habits.",
    expectedResponsePromptVi: "Giải thích về môn thể thao hoặc thói quen sống khỏe.",
    keyTargetPhrases: ["I practice", "exercise", "eat fresh food", "stay fit"]
  },

  // ==================== LEVEL B1 (INTERMEDIATE BOSSES) ====================
  {
    id: 'boss_b1_1',
    level: 'B1',
    bossName: 'Neon Necromancer',
    bossTitle: 'Phù Thủy Huỳnh Quang',
    bossAvatar: '🧙‍♂️️',
    maxHp: 150,
    timeLimitSeconds: 40,
    bossChallengeEn: "Is online shopping better than visiting traditional markets? Convince me!",
    bossChallengeVi: "Mua sắm trực tuyến có tốt hơn chợ truyền thống không? Hãy thuyết phục ta!",
    expectedResponsePromptEn: "Argue the pros and cons of online shopping versus local markets.",
    expectedResponsePromptVi: "Tranh luận ưu nhược điểm của mua sắm online so với chợ truyền thống.",
    keyTargetPhrases: ["advantage", "convenient", "delivery", "on the other hand"]
  },
  {
    id: 'boss_b1_2',
    level: 'B1',
    bossName: 'Mecha Griffin',
    bossTitle: 'Điểu Sư Cơ Khí',
    bossAvatar: '🦅',
    maxHp: 150,
    timeLimitSeconds: 40,
    bossChallengeEn: "How does learning a foreign language open up new career paths?",
    bossChallengeVi: "Việc học ngoại ngữ mở ra những đường công danh mới như thế nào?",
    expectedResponsePromptEn: "Explain how language skills improve job opportunities.",
    expectedResponsePromptVi: "Giải thích kỹ năng ngoại ngữ nâng cao cơ hội việc làm ra sao.",
    keyTargetPhrases: ["career opportunity", "global communication", "advantages", "future"]
  },

  // ==================== LEVEL B2 (ADVANCED BOSSES) ====================
  {
    id: 'boss_b2_1',
    level: 'B2',
    bossName: 'Arch Demon Vex',
    bossTitle: 'Đại Quỷ Dữ Liệu',
    bossAvatar: '👿',
    maxHp: 180,
    timeLimitSeconds: 50,
    bossChallengeEn: "Corporate AI automation is replacing human jobs. Is this progress or destruction?",
    expectedResponsePromptEn: "Critique the impact of AI automation on labor markets and ethics.",
    keyTargetPhrases: ["automation", "efficiency", "displacement", "ethical implications"]
  },
  {
    id: 'boss_b2_2',
    level: 'B2',
    bossName: 'Valkyrie Prime',
    bossTitle: 'Nữ Thần Chiến Trận',
    bossAvatar: '⚔️',
    maxHp: 180,
    timeLimitSeconds: 50,
    bossChallengeEn: "Evaluate the environmental consequences of global fast-fashion supply chains!",
    expectedResponsePromptEn: "Examine sustainability issues and textile waste in fast fashion.",
    keyTargetPhrases: ["sustainability", "carbon footprint", "textile waste", "consumerism"]
  },

  // ==================== LEVEL C1 (EXPERT BOSSES) ====================
  {
    id: 'boss_c1_1',
    level: 'C1',
    bossName: 'Void Overlord Nyx',
    bossTitle: 'Chúa Tể Hư Không',
    bossAvatar: '🌌',
    maxHp: 200,
    timeLimitSeconds: 60,
    bossChallengeEn: "Deconstruct the geopolitical risks of controlling rare-earth mineral supply chains!",
    expectedResponsePromptEn: "Analyze monopoly risks, friend-shoring, and green tech supply chains.",
    keyTargetPhrases: ["geopolitical leverage", "monopolization", "supply chain resilience", "technological sovereignty"]
  },

  // ==================== LEVEL C2 (SUPREME BOSSES) ====================
  {
    id: 'boss_c2_1',
    level: 'C2',
    bossName: 'Chronos the Singularity',
    bossTitle: 'Thực Thể Điểm Dị Biệt',
    bossAvatar: '🔮',
    maxHp: 250,
    timeLimitSeconds: 60,
    bossChallengeEn: "Deconstruct the epistemological paradigm shift induced by generative AI in scientific inquiry!",
    expectedResponsePromptEn: "Critically evaluate synthetic research data, peer review erosion, and empirical truth.",
    keyTargetPhrases: ["epistemological paradigm", "empirical validity", "black-box methodologies", "scientific inquiry"]
  }
];