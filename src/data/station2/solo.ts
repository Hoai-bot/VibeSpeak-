// src/data/station2/solo.ts
export type Station2Tier = 'SOLO' | 'RELAY' | 'ROLEPLAY';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Station2ScenarioItem {
  id: string;
  tier: Station2Tier;
  level: CEFRLevel;
  title: string;
  contextVi: string;
  promptEn: string;
  sampleAnswerEn: string;
  keywords: string[];
}

export const SOLO_SCENARIOS: Station2ScenarioItem[] = [
  // =========================================================================
  // LEVEL A1 (10 CHỦ ĐỀ)
  // =========================================================================
  {
    id: 'solo_a1_01',
    tier: 'SOLO',
    level: 'A1',
    title: 'Giới thiệu bản thân ngày đầu đi học',
    contextVi: 'Bạn vừa bước vào lớp học tiếng Anh mới và giảng viên mời bạn tự giới thiệu ngắn gọn về tên, quê quán và sở thích.',
    promptEn: 'Hello! Welcome to our class. Could you tell us your name, where you are from, and what you like doing in your free time?',
    sampleAnswerEn: 'Hi everyone! My name is Minh, and I am from Da Lat. In my free time, I enjoy listening to music and playing badminton.',
    keywords: ['name', 'from', 'free time', 'enjoy']
  },
  {
    id: 'solo_a1_02',
    tier: 'SOLO',
    level: 'A1',
    title: 'Gọi đồ uống tại quán cà phê',
    contextVi: 'Bạn đang đứng tại quầy gọi nước và nhân viên hỏi bạn muốn dùng gì.',
    promptEn: 'Good morning! What can I get started for you today? Would you like it hot or iced?',
    sampleAnswerEn: 'Good morning! Can I have a medium iced milk coffee, please? And less sugar, thank you.',
    keywords: ['iced', 'coffee', 'please', 'thank you']
  },
  {
    id: 'solo_a1_03',
    tier: 'SOLO',
    level: 'A1',
    title: 'Giới thiệu các thành viên trong gia đình',
    contextVi: 'Người bạn nước ngoài xem ảnh gia đình của bạn và hỏi về các thành viên.',
    promptEn: 'Is this a photo of your family? How many people are there in your family, and what do your parents do?',
    sampleAnswerEn: 'Yes, this is my family. There are four people in my family: my parents, my younger sister, and me. My father is a teacher and my mother is a nurse.',
    keywords: ['family', 'four people', 'parents', 'teacher']
  },
  {
    id: 'solo_a1_04',
    tier: 'SOLO',
    level: 'A1',
    title: 'Kể về lịch trình một ngày đi học',
    contextVi: 'Bạn cùng lớp hỏi bạn thường thức dậy và đi học lúc mấy giờ.',
    promptEn: 'What time do you usually wake up on weekdays, and how do you go to university?',
    sampleAnswerEn: 'I usually wake up at 6:30 AM. After having breakfast, I ride my motorbike to university at 7:15 AM.',
    keywords: ['wake up', 'breakfast', 'motorbike', 'university']
  },
  {
    id: 'solo_a1_05',
    tier: 'SOLO',
    level: 'A1',
    title: 'Hỏi giá tiền và mua trái cây ở chợ',
    contextVi: 'Bạn muốn mua một ít xoài và cam tại cửa hàng trái cây.',
    promptEn: 'Hello! We have fresh mangoes and oranges today. How much would you like to buy?',
    sampleAnswerEn: 'Hello! How much is one kilogram of mangoes? I would like to buy two kilograms of mangoes, please.',
    keywords: ['how much', 'kilogram', 'mangoes', 'buy']
  },
  {
    id: 'solo_a1_06',
    tier: 'SOLO',
    level: 'A1',
    title: 'Nói về món ăn Việt Nam yêu thích',
    contextVi: 'Một du khách nước ngoài nhờ bạn gợi ý món ăn truyền thống ngon nhất của Việt Nam.',
    promptEn: 'I am visiting Vietnam for the first time. What is your favorite Vietnamese dish that I must try?',
    sampleAnswerEn: 'You must try beef pho! It is a traditional noodle soup with delicious broth, fresh herbs, and tender beef.',
    keywords: ['must try', 'traditional', 'noodle soup', 'delicious']
  },
  {
    id: 'solo_a1_07',
    tier: 'SOLO',
    level: 'A1',
    title: 'Mô tả thời tiết hôm nay ở thành phố bạn',
    contextVi: 'Bạn đang gọi video cho một người bạn ở nước ngoài và họ hỏi thời tiết chỗ bạn thế nào.',
    promptEn: 'How is the weather in your city today? Is it hot or cold?',
    sampleAnswerEn: 'Today the weather in Da Lat is cool and sunny. It is around 20 degrees, so it feels very comfortable.',
    keywords: ['weather', 'cool', 'sunny', 'comfortable']
  },
  {
    id: 'solo_a1_08',
    tier: 'SOLO',
    level: 'A1',
    title: 'Hỏi giờ và lịch chiếu phim',
    contextVi: 'Bạn đang đứng ở quầy vé rạp chiếu phim và muốn xem suất chiếu buổi tối.',
    promptEn: 'Welcome to Star Cinema! Which movie do you want to watch tonight, and how many tickets do you need?',
    sampleAnswerEn: 'Hi! What time does the new action movie start tonight? I need two tickets for the 8 PM show, please.',
    keywords: ['what time', 'start', 'two tickets', 'tonight']
  },
  {
    id: 'solo_a1_09',
    tier: 'SOLO',
    level: 'A1',
    title: 'Mô tả căn phòng của bạn',
    contextVi: 'Giảng viên yêu cầu bạn miêu tả ngắn gọn những đồ vật chính trong phòng ngủ hoặc phòng trọ.',
    promptEn: 'Can you describe your bedroom? What furniture do you have in your room?',
    sampleAnswerEn: 'My bedroom is small but clean. There is a big bed, a wooden desk with my laptop, a bookshelf, and a window next to my bed.',
    keywords: ['bedroom', 'clean', 'desk', 'next to']
  },
  {
    id: 'solo_a1_10',
    tier: 'SOLO',
    level: 'A1',
    title: 'Chúc mừng sinh nhật và tặng quà bạn thân',
    contextVi: 'Hôm nay là sinh nhật bạn thân của bạn. Hãy nói lời chúc và giới thiệu món quà nhỏ.',
    promptEn: 'Thank you so much for coming to my birthday party! Is this gift for me?',
    sampleAnswerEn: 'Happy birthday to you! Yes, this is a small gift for you. I hope you like it and have a wonderful year ahead.',
    keywords: ['happy birthday', 'small gift', 'hope you like', 'wonderful']
  },

  // =========================================================================
  // LEVEL A2 (10 CHỦ ĐỀ)
  // =========================================================================
  {
    id: 'solo_a2_01',
    tier: 'SOLO',
    level: 'A2',
    title: 'Hỏi đường đến trạm xe buýt gần nhất',
    contextVi: 'Bạn đang ở khu vực lạ và cần bắt xe buýt về trung tâm thành phố.',
    promptEn: 'Excuse me, you look a bit lost. Are you looking for a specific place around here?',
    sampleAnswerEn: 'Yes, please. Could you tell me how to get to the nearest bus stop? I need to catch a bus to the city center.',
    keywords: ['nearest', 'bus stop', 'catch a bus', 'city center']
  },
  {
    id: 'solo_a2_02',
    tier: 'SOLO',
    level: 'A2',
    title: 'Kể về kế hoạch cuối tuần',
    contextVi: 'Bạn bè hỏi dự định của bạn vào cuối tuần này.',
    promptEn: 'Do you have any special plans for this weekend, or are you just going to stay home and relax?',
    sampleAnswerEn: 'I am planning to visit my grandparents on Saturday morning, and on Sunday I will study for my upcoming English test.',
    keywords: ['planning', 'visit', 'weekend', 'study']
  },
  {
    id: 'solo_a2_03',
    tier: 'SOLO',
    level: 'A2',
    title: 'Kể lại kỳ nghỉ du lịch gần đây nhất',
    contextVi: 'Bạn cùng lớp hỏi về chuyến đi chơi gần nhất của bạn.',
    promptEn: 'Where did you go on your last holiday, and what did you enjoy most about that trip?',
    sampleAnswerEn: 'Last summer, I went to Nha Trang with my friends for three days. We swam in the sea and ate lots of fresh seafood.',
    keywords: ['last summer', 'went to', 'three days', 'seafood']
  },
  {
    id: 'solo_a2_04',
    tier: 'SOLO',
    level: 'A2',
    title: 'Nói về thói quen tập thể dục giữ sức khỏe',
    contextVi: 'Trong giờ học chủ đề Sức khỏe, bạn chia sẻ cách mình rèn luyện thể chất.',
    promptEn: 'What do you usually do to stay healthy and keep fit?',
    sampleAnswerEn: 'I go jogging in the park three times a week and try to drink two liters of water every day instead of sugary drinks.',
    keywords: ['jogging', 'three times a week', 'healthy', 'instead of']
  },
  {
    id: 'solo_a2_05',
    tier: 'SOLO',
    level: 'A2',
    title: 'Đặt bàn ăn tối qua điện thoại',
    contextVi: 'Bạn gọi điện đến nhà hàng để đặt bàn cho nhóm 4 người tối nay.',
    promptEn: 'Good afternoon, Lotus Restaurant speaking. How may I assist you?',
    sampleAnswerEn: 'Hello, I would like to book a table for four people tonight at 7:30 PM. Could we have a quiet table near the window?',
    keywords: ['book a table', 'four people', 'tonight', 'near the window']
  },
  {
    id: 'solo_a2_06',
    tier: 'SOLO',
    level: 'A2',
    title: 'Chia sẻ cách học từ vựng tiếng Anh hiệu quả',
    contextVi: 'Một người bạn mới học tiếng Anh hỏi bí quyết nhớ từ vựng của bạn.',
    promptEn: 'You remember English words really well! How do you usually practice new vocabulary?',
    sampleAnswerEn: 'I usually write new words in a small notebook with example sentences, and I review them for 15 minutes before going to bed.',
    keywords: ['notebook', 'example sentences', 'review', '15 minutes']
  },
  {
    id: 'solo_a2_07',
    tier: 'SOLO',
    level: 'A2',
    title: 'So sánh việc mua sắm trực tuyến và tại cửa hàng',
    contextVi: 'Bạn được hỏi thích mua quần áo trên mạng hay ra tiệm thử trực tiếp hơn.',
    promptEn: 'Do you prefer shopping online or going to physical stores? Why?',
    sampleAnswerEn: 'I prefer going to physical stores for clothes because I can try them on and check the quality before buying.',
    keywords: ['prefer', 'physical stores', 'try them on', 'quality']
  },
  {
    id: 'solo_a2_08',
    tier: 'SOLO',
    level: 'A2',
    title: 'Mô tả một người thầy hoặc người bạn truyền cảm hứng',
    contextVi: 'Giảng viên mời bạn kể về một người có ảnh hưởng tích cực đến việc học của bạn.',
    promptEn: 'Who is someone you admire at your school or university, and why do you admire them?',
    sampleAnswerEn: 'I really admire my high school English teacher because she was always patient, kind, and made every lesson fun and easy to understand.',
    keywords: ['admire', 'patient', 'kind', 'easy to understand']
  },
  {
    id: 'solo_a2_09',
    tier: 'SOLO',
    level: 'A2',
    title: 'Báo mất đồ tại phòng bảo vệ trường học',
    contextVi: 'Bạn để quên chiếc ba lô ở thư viện và đến phòng bảo vệ nhờ hỗ trợ tìm kiếm.',
    promptEn: 'Hello, Lost and Found Office. What did you lose, and what does it look like?',
    sampleAnswerEn: 'I left my black backpack in the library an hour ago. It has a blue keychain on the zipper and my textbooks inside.',
    keywords: ['left', 'backpack', 'library', 'inside']
  },
  {
    id: 'solo_a2_10',
    tier: 'SOLO',
    level: 'A2',
    title: 'Nói về lễ hội truyền thống yêu thích ở Việt Nam',
    contextVi: 'Bạn giới thiệu với bạn quốc tế về dịp Tết Nguyên Đán.',
    promptEn: 'What is the most important traditional holiday in your country, and how do people celebrate it?',
    sampleAnswerEn: 'Tet, or Lunar New Year, is our biggest holiday. Families clean their houses, cook traditional food, and visit relatives to wish them good luck.',
    keywords: ['Lunar New Year', 'holiday', 'visit relatives', 'good luck']
  },

  // =========================================================================
  // LEVEL B1 (10 CHỦ ĐỀ)
  // =========================================================================
  {
    id: 'solo_b1_01',
    tier: 'SOLO',
    level: 'B1',
    title: 'Xin gia hạn nộp bài tập với giảng viên',
    contextVi: 'Máy tính của bạn gặp sự cố kỹ thuật nên bạn cần xin giảng viên thêm 1 ngày để hoàn thiện báo cáo.',
    promptEn: 'I noticed your group report hasn’t been uploaded to the portal yet. What seems to be the problem?',
    sampleAnswerEn: 'I sincerely apologize for the delay, Professor. My laptop crashed last night, so could I possibly submit the final file by tomorrow afternoon?',
    keywords: ['apologize', 'delay', 'crashed', 'submit']
  },
  {
    id: 'solo_b1_02',
    tier: 'SOLO',
    level: 'B1',
    title: 'Chia sẻ thói quen cân bằng học tập và sức khỏe',
    contextVi: 'Trong buổi thảo luận nhóm, bạn được hỏi làm thế nào để giữ năng lượng khi lịch học dày đặc.',
    promptEn: 'How do you usually manage your stress and stay productive during exam season?',
    sampleAnswerEn: 'Whenever I feel overwhelmed, I take a 20-minute walk outside without my phone and divide my study tasks into smaller, manageable goals.',
    keywords: ['overwhelmed', 'manageable', 'productive', 'divide']
  },
  {
    id: 'solo_b1_03',
    tier: 'SOLO',
    level: 'B1',
    title: 'Nói về lợi ích của việc làm thêm khi còn là sinh viên',
    contextVi: 'Bạn tham gia buổi tọa đàm hướng nghiệp và chia sẻ góc nhìn về việc đi làm bán thời gian.',
    promptEn: 'Do you think university students should take part-time jobs while studying? What are the main benefits?',
    sampleAnswerEn: 'Yes, I believe part-time jobs help students gain practical communication skills, manage their finances independently, and build confidence before graduation.',
    keywords: ['part-time jobs', 'practical', 'independently', 'confidence']
  },
  {
    id: 'solo_b1_04',
    tier: 'SOLO',
    level: 'B1',
    title: 'Giải thích lý do chọn chuyên ngành hiện tại',
    contextVi: 'Nhà tuyển dụng thực tập hỏi điều gì khiến bạn quyết định theo đuổi ngành học của mình.',
    promptEn: 'What inspired you to choose your current major, and what career path do you hope to pursue after graduating?',
    sampleAnswerEn: 'I chose Information Technology because I enjoy solving real-world problems with software, and I hope to become a mobile app developer after graduating.',
    keywords: ['inspired', 'major', 'solving', 'career path']
  },
  {
    id: 'solo_b1_05',
    tier: 'SOLO',
    level: 'B1',
    title: 'Bàn về tác động của mạng xã hội đối với giới trẻ',
    contextVi: 'Bạn nêu ý kiến trong lớp học tiếng Anh giao tiếp về việc sử dụng mạng xã hội hàng ngày.',
    promptEn: 'How has social media changed the way young people communicate and spend their free time?',
    sampleAnswerEn: 'Social media makes it super easy to stay connected and learn new skills, but spending too much time scrolling can reduce face-to-face interaction and sleep quality.',
    keywords: ['stay connected', 'scrolling', 'face-to-face', 'reduce']
  },
  {
    id: 'solo_b1_06',
    tier: 'SOLO',
    level: 'B1',
    title: 'Đề xuất cải thiện giao thông công cộng ở thành phố',
    contextVi: 'Bạn trình bày ý tưởng giúp giảm ùn tắc giao thông giờ cao điểm.',
    promptEn: 'Traffic congestion is a major issue in big cities. What can be done to encourage more people to use public transport?',
    sampleAnswerEn: 'If buses were more punctual, cleaner, and connected directly to university campuses with affordable student passes, far more students would use them daily.',
    keywords: ['punctual', 'affordable', 'public transport', 'encourage']
  },
  {
    id: 'solo_b1_07',
    tier: 'SOLO',
    level: 'B1',
    title: 'Kể về một thử thách bạn đã vượt qua thành công',
    contextVi: 'Bạn chia sẻ kỷ niệm lần đầu thuyết trình trước đám đông bằng tiếng Anh.',
    promptEn: 'Tell me about a difficult situation you faced recently and what you learned from overcoming it.',
    sampleAnswerEn: 'Last semester, I had to give a 10-minute presentation in English. I was terrified at first, but practicing in front of a mirror every night helped me succeed.',
    keywords: ['presentation', 'terrified', 'practicing', 'succeed']
  },
  {
    id: 'solo_b1_08',
    tier: 'SOLO',
    level: 'B1',
    title: 'So sánh cuộc sống ở thành phố lớn và vùng quê',
    contextVi: 'Bạn thảo luận về nơi bạn muốn sinh sống và làm việc lâu dài.',
    promptEn: 'Would you rather live in a bustling metropolis or a peaceful countryside town? Explain your choice.',
    sampleAnswerEn: 'I would prefer a medium-sized city like Da Lat because it offers modern conveniences and good internet without the extreme pollution and noise of a huge metropolis.',
    keywords: ['prefer', 'conveniences', 'pollution', 'peaceful']
  },
  {
    id: 'solo_b1_09',
    tier: 'SOLO',
    level: 'B1',
    title: 'Nêu tầm quan trọng của kỹ năng làm việc nhóm',
    contextVi: 'Bạn giải thích cách giải quyết bất đồng quan điểm khi làm đồ án nhóm.',
    promptEn: 'When team members disagree on an idea, what is the best way to reach a fair decision?',
    sampleAnswerEn: 'The best approach is to listen calmly to everyone’s arguments, list the pros and cons of each option, and vote objectively based on our project goals.',
    keywords: ['approach', 'pros and cons', 'objectively', 'goals']
  },
  {
    id: 'solo_b1_10',
    tier: 'SOLO',
    level: 'B1',
    title: 'Giới thiệu một cuốn sách hoặc podcast hữu ích',
    contextVi: 'Bạn gợi ý cho cả lớp một nguồn tài liệu giúp phát triển bản thân.',
    promptEn: 'Could you recommend a book, podcast, or YouTube channel that has taught you something valuable?',
    sampleAnswerEn: 'I highly recommend the book Atomic Habits because it shows how tiny daily improvements can lead to remarkable long-term results.',
    keywords: ['recommend', 'improvements', 'remarkable', 'long-term']
  },

  // =========================================================================
  // LEVEL B2 (10 CHỦ ĐỀ)
  // =========================================================================
  {
    id: 'solo_b2_01',
    tier: 'SOLO',
    level: 'B2',
    title: 'Nêu quan điểm về làm việc từ xa (Remote Work)',
    contextVi: 'Nhà tuyển dụng hỏi góc nhìn của bạn về ưu và nhược điểm của mô hình làm việc kết hợp (Hybrid).',
    promptEn: 'Many companies are debating between full-time office work and hybrid models. What is your perspective on this trend?',
    sampleAnswerEn: 'While remote work offers tremendous flexibility and saves commuting time, a hybrid model strikes the best balance by preserving face-to-face team collaboration.',
    keywords: ['flexibility', 'commuting', 'hybrid model', 'collaboration']
  },
  {
    id: 'solo_b2_02',
    tier: 'SOLO',
    level: 'B2',
    title: 'Đề xuất giải pháp giảm rác thải nhựa trong trường học',
    contextVi: 'Bạn đang trình bày ý tưởng trước hội đồng sinh viên.',
    promptEn: 'If you could implement one immediate environmental initiative on our campus, what would it be and why?',
    sampleAnswerEn: 'I would install free water refill stations across all buildings and offer discounts to students who bring reusable tumblers to the cafeteria.',
    keywords: ['initiative', 'refill stations', 'reusable', 'discounts']
  },
  {
    id: 'solo_b2_03',
    tier: 'SOLO',
    level: 'B2',
    title: 'Phân tích cơ hội và thách thức của du lịch bền vững',
    contextVi: 'Bạn phát biểu trong hội thảo về phát triển du lịch xanh tại địa phương.',
    promptEn: 'How can popular tourist destinations balance economic growth with environmental preservation?',
    sampleAnswerEn: 'Local authorities should enforce visitor caps at fragile ecosystems, promote eco-certified accommodations, and reinvest tourism taxes directly into conservation projects.',
    keywords: ['enforce', 'ecosystems', 'conservation', 'balance']
  },
  {
    id: 'solo_b2_04',
    tier: 'SOLO',
    level: 'B2',
    title: 'Đánh giá vai trò của kỹ năng mềm so với bằng cấp chuyên môn',
    contextVi: 'Bạn tham gia tranh biện về yếu tố quyết định thành công của sinh viên mới ra trường.',
    promptEn: 'In today’s competitive job market, are soft skills like adaptability more valuable than academic grades? Why or why not?',
    sampleAnswerEn: 'Academic credentials get your foot in the door, but adaptability, emotional intelligence, and clear communication ultimately determine how quickly you advance in your career.',
    keywords: ['credentials', 'adaptability', 'emotional intelligence', 'advance']
  },
  {
    id: 'solo_b2_05',
    tier: 'SOLO',
    level: 'B2',
    title: 'Bàn về văn hóa tiêu dùng nhanh (Fast Fashion)',
    contextVi: 'Bạn nêu quan điểm về thói quen mua sắm quần áo giá rẻ theo xu hướng của giới trẻ.',
    promptEn: 'What are the hidden environmental and social costs of fast fashion, and how can consumers make more ethical choices?',
    sampleAnswerEn: 'Fast fashion generates massive textile waste and water pollution; consumers can counter this by buying durable second-hand garments and supporting transparent local brands.',
    keywords: ['textile waste', 'pollution', 'durable', 'transparent']
  },
  {
    id: 'solo_b2_06',
    tier: 'SOLO',
    level: 'B2',
    title: 'Tầm quan trọng của giáo dục tài chính cá nhân cho sinh viên',
    contextVi: 'Bạn đề xuất đưa môn quản lý tài chính vào chương trình kỹ năng cho sinh viên năm nhất.',
    promptEn: 'Why do many young adults struggle with personal debt, and should financial literacy be mandatory in high schools?',
    sampleAnswerEn: 'Without early education on budgeting, compound interest, and credit risks, young adults easily fall into impulsive spending traps, making financial literacy essential.',
    keywords: ['budgeting', 'compound interest', 'impulsive', 'essential']
  },
  {
    id: 'solo_b2_07',
    tier: 'SOLO',
    level: 'B2',
    title: 'Ảnh hưởng của trí tuệ nhân tạo đến ngành sáng tạo nội dung',
    contextVi: 'Bạn thảo luận về việc sử dụng công cụ AI trong thiết kế và viết lách.',
    promptEn: 'Do you view AI tools as a threat to human creativity or as an empowering assistant for artists and writers?',
    sampleAnswerEn: 'AI serves best as a brainstorming partner that accelerates repetitive tasks, whereas authentic human storytelling and emotional nuance remain irreplaceable.',
    keywords: ['brainstorming', 'accelerates', 'authentic', 'irreplaceable']
  },
  {
    id: 'solo_b2_08',
    tier: 'SOLO',
    level: 'B2',
    title: 'Giữ gìn bản sắc văn hóa dân tộc trong thời kỳ toàn cầu hóa',
    contextVi: 'Bạn chia sẻ suy nghĩ về việc thế hệ trẻ tiếp nhận văn hóa quốc tế.',
    promptEn: 'As global pop culture becomes dominant, how can younger generations preserve their indigenous traditions and languages?',
    sampleAnswerEn: 'By integrating traditional music, folk art, and local dialects into modern digital media, young creators can make heritage engaging rather than outdated.',
    keywords: ['integrating', 'heritage', 'engaging', 'global']
  },
  {
    id: 'solo_b2_09',
    tier: 'SOLO',
    level: 'B2',
    title: 'Phân tích nguyên nhân và giải pháp cho tình trạng trì hoãn (Procrastination)',
    contextVi: 'Bạn chia sẻ phương pháp vượt qua thói quen nước đến chân mới nhảy.',
    promptEn: 'Why do people often procrastinate on important tasks even when they know the negative consequences?',
    sampleAnswerEn: 'Procrastination is rarely about laziness; it usually stems from fear of perfectionism or anxiety, which can be overcome by committing to just five minutes of focused action.',
    keywords: ['stems from', 'perfectionism', 'anxiety', 'focused action']
  },
  {
    id: 'solo_b2_10',
    tier: 'SOLO',
    level: 'B2',
    title: 'Tương lai của giao thông đô thị thông minh',
    contextVi: 'Bạn trình bày tầm nhìn về việc ứng dụng công nghệ để giảm tai nạn và kẹt xe.',
    promptEn: 'How might smart city technologies transform urban commuting over the next twenty years?',
    sampleAnswerEn: 'AI-synchronized traffic lights, autonomous electric shuttles, and real-time transit apps will drastically cut commuting times and urban carbon emissions.',
    keywords: ['synchronized', 'autonomous', 'drastically', 'carbon emissions']
  },

  // =========================================================================
  // LEVEL C1 (10 CHỦ ĐỀ)
  // =========================================================================
  {
    id: 'solo_c1_01',
    tier: 'SOLO',
    level: 'C1',
    title: 'Đánh giá tác động của AI tạo sinh đến giáo dục đại học',
    contextVi: 'Bạn tham gia tọa đàm học thuật và trả lời câu hỏi về ranh giới giữa hỗ trợ học tập và gian lận học thuật.',
    promptEn: 'How should universities adapt their assessment methods in an era where generative AI can draft essays in seconds?',
    sampleAnswerEn: 'Institutions must shift from static written exams toward oral defenses, live problem-solving, and process-oriented evaluations that assess critical thinking.',
    keywords: ['assessment', 'oral defenses', 'critical thinking', 'process-oriented']
  },
  {
    id: 'solo_c1_02',
    tier: 'SOLO',
    level: 'C1',
    title: 'Kinh tế tuần hoàn và trách nhiệm mở rộng của nhà sản xuất',
    contextVi: 'Bạn phát biểu tại diễn đàn khởi nghiệp xanh về thiết kế sản phẩm bền vững.',
    promptEn: 'What systemic incentives are required to transition corporations from a linear take-make-dispose model to a circular economy?',
    sampleAnswerEn: 'Governments must combine tax penalties on virgin plastics with subsidies for modular product designs that facilitate effortless refurbishment and material recovery.',
    keywords: ['systemic', 'circular economy', 'modular', 'refurbishment']
  },
  {
    id: 'solo_c1_03',
    tier: 'SOLO',
    level: 'C1',
    title: 'Tác động của thuật toán truyền thông đến sự phân cực xã hội',
    contextVi: 'Bạn phân tích hiện tượng "buồng vang thông tin" (Echo Chambers) trên mạng xã hội.',
    promptEn: 'How do engagement-driven algorithms inadvertently amplify societal polarization, and what regulatory interventions are viable?',
    sampleAnswerEn: 'By prioritizing emotionally charged outrage to maximize screen time, algorithms trap users in ideological echo chambers; algorithmic transparency and chronological feed options are vital remedies.',
    keywords: ['algorithms', 'polarization', 'echo chambers', 'transparency']
  },
  {
    id: 'solo_c1_04',
    tier: 'SOLO',
    level: 'C1',
    title: 'Chuyển đổi số trong y tế và bình đẳng tiếp cận chăm sóc sức khỏe',
    contextVi: 'Bạn đánh giá tiềm năng của khám bệnh từ xa (Telemedicine) tại các vùng nông thôn.',
    promptEn: 'Can telemedicine bridge the healthcare gap between urban centers and rural communities, or does it exacerbate the digital divide?',
    sampleAnswerEn: 'Telemedicine dramatically lowers diagnostic barriers for remote patients, provided it is accompanied by public investment in broadband infrastructure and digital literacy training.',
    keywords: ['telemedicine', 'diagnostic', 'digital divide', 'infrastructure']
  },
  {
    id: 'solo_c1_05',
    tier: 'SOLO',
    level: 'C1',
    title: 'Học tập suốt đời (Lifelong Learning) trong nền kinh tế biến động',
    contextVi: 'Bạn trình bày quan điểm về sự lỗi thời nhanh chóng của kỹ năng chuyên môn.',
    promptEn: 'With the half-life of technical skills shrinking rapidly, how should professionals structure continuous upskilling?',
    sampleAnswerEn: 'Professionals must cultivate meta-learning agility, combining micro-credentials with cross-functional projects rather than relying solely on a single terminal degree.',
    keywords: ['half-life', 'upskilling', 'agility', 'micro-credentials']
  },
  {
    id: 'solo_c1_06',
    tier: 'SOLO',
    level: 'C1',
    title: 'Quy hoạch đô thị vị nhân sinh và sức khỏe tinh thần cộng đồng',
    contextVi: 'Bạn phân tích mối liên hệ giữa không gian xanh đô thị và mức độ căng thẳng của cư dân.',
    promptEn: 'To what extent does urban architecture influence residents’ psychological well-being and social cohesion?',
    sampleAnswerEn: 'High-density concrete environments without walkable parks and communal plazas foster social isolation, whereas biophilic urban design measurably reduces cortisol levels.',
    keywords: ['psychological', 'social cohesion', 'isolation', 'biophilic']
  },
  {
    id: 'solo_c1_07',
    tier: 'SOLO',
    level: 'C1',
    title: 'Thách thức của già hóa dân số đối với hệ thống an sinh xã hội',
    contextVi: 'Bạn thảo luận về giải pháp duy trì năng suất lao động khi tỷ lệ người cao tuổi tăng nhanh.',
    promptEn: 'How can rapidly aging societies sustain pension systems and economic dynamism without overburdening younger generations?',
    sampleAnswerEn: 'Policy responses must integrate flexible phased retirement, lifelong workforce retraining for older adults, and targeted automation in labor-intensive sectors.',
    keywords: ['aging societies', 'phased retirement', 'retraining', 'dynamism']
  },
  {
    id: 'solo_c1_08',
    tier: 'SOLO',
    level: 'C1',
    title: 'Ngoại giao văn hóa và sức mạnh mềm của các quốc gia đang phát triển',
    contextVi: 'Bạn phân tích vai trò của ẩm thực, điện ảnh và công nghệ trong việc nâng tầm vị thế quốc gia.',
    promptEn: 'How can emerging economies leverage cultural diplomacy to strengthen their global soft power?',
    sampleAnswerEn: 'Authentic cultural exports—ranging from culinary heritage to contemporary digital arts—humanize a nation abroad and foster trust that reinforces diplomatic and trade ties.',
    keywords: ['cultural diplomacy', 'soft power', 'culinary heritage', 'reinforces']
  },
  {
    id: 'solo_c1_09',
    tier: 'SOLO',
    level: 'C1',
    title: 'Đạo đức trong nghiên cứu công nghệ sinh học và chỉnh sửa gen',
    contextVi: 'Bạn tranh luận về ranh giới giữa điều trị bệnh di truyền và nâng cấp đặc điểm con người.',
    promptEn: 'Where should international bioethics committees draw the line regarding human gene-editing technologies?',
    sampleAnswerEn: 'While somatic therapies to eradicate debilitating hereditary diseases are ethically compelling, germline enhancements risk entrenching biological inequality and require strict global moratoriums.',
    keywords: ['bioethics', 'hereditary', 'inequality', 'moratoriums']
  },
  {
    id: 'solo_c1_10',
    tier: 'SOLO',
    level: 'C1',
    title: 'Minh bạch chuỗi cung ứng và tiêu chuẩn ESG trong doanh nghiệp',
    contextVi: 'Bạn đánh giá lý do các tập đoàn đa quốc gia siết chặt tiêu chuẩn môi trường và quản trị.',
    promptEn: 'Are corporate ESG commitments driving genuine operational reform, or are they largely vulnerable to greenwashing?',
    sampleAnswerEn: 'Without standardized third-party auditing and binding supply-chain disclosures, ESG pledges risk degenerating into superficial marketing rather than measurable decarbonization.',
    keywords: ['auditing', 'disclosures', 'greenwashing', 'decarbonization']
  },

  // =========================================================================
  // LEVEL C2 (10 CHỦ ĐỀ)
  // =========================================================================
  {
    id: 'solo_c2_01',
    tier: 'SOLO',
    level: 'C2',
    title: 'Biện luận về đạo đức dữ liệu và quyền riêng tư số',
    contextVi: 'Bạn được mời phát biểu ngắn gọn về sự đánh đổi giữa tiện ích cá nhân hóa và quyền bảo mật dữ liệu người dùng.',
    promptEn: 'To what extent should citizens sacrifice personal data privacy for the sake of algorithmic convenience and public security?',
    sampleAnswerEn: 'Convenience should never come at the expense of fundamental autonomy; transparent consent frameworks and strict data minimization must remain non-negotiable.',
    keywords: ['autonomy', 'algorithmic', 'consent', 'data minimization']
  },
  {
    id: 'solo_c2_02',
    tier: 'SOLO',
    level: 'C2',
    title: 'Nghịch lý của sự lựa chọn trong xã hội tiêu dùng hiện đại',
    contextVi: 'Bạn phân tích tác động tâm lý khi con người đứng trước quá nhiều lựa chọn trong sự nghiệp và đời sống.',
    promptEn: 'Does an abundance of choice genuinely enhance human freedom, or does it paradoxically induce decision paralysis and chronic dissatisfaction?',
    sampleAnswerEn: 'Beyond a threshold of basic sufficiency, hyper-abundance shifts the cognitive burden onto the individual, transforming liberation into existential anxiety and perpetual regret.',
    keywords: ['abundance', 'paralysis', 'cognitive burden', 'existential']
  },
  {
    id: 'solo_c2_03',
    tier: 'SOLO',
    level: 'C2',
    title: 'Tính khách quan của báo chí trong kỷ nguyên hậu sự thật (Post-Truth)',
    contextVi: 'Bạn thảo luận về khủng hoảng niềm tin đối với truyền thông chính thống.',
    promptEn: 'How can investigative journalism reclaim epistemic authority in a media ecosystem saturated with synthetic media and partisan narratives?',
    sampleAnswerEn: 'Rebuilding public trust demands radical methodological transparency—exposing primary evidentiary trails and separating rigorous verification from instantaneous commentary.',
    keywords: ['epistemic', 'synthetic media', 'evidentiary', 'verification']
  },
  {
    id: 'solo_c2_04',
    tier: 'SOLO',
    level: 'C2',
    title: 'Triết lý thiết kế công nghệ lấy sự chú ý của con người làm trọng tâm',
    contextVi: 'Bạn phê phán nền kinh tế chú ý (Attention Economy) và đề xuất mô hình công nghệ nhân văn.',
    promptEn: 'What distinguishes humane technology from extractive attention-harvesting platforms, and can market forces alone incentivize the former?',
    sampleAnswerEn: 'Humane design respects cognitive sovereignty by concluding interactions once user intent is fulfilled, whereas ad-driven monopolies structurally profit from fractured attention.',
    keywords: ['cognitive sovereignty', 'extractive', 'structurally', 'fractured']
  },
  {
    id: 'solo_c2_05',
    tier: 'SOLO',
    level: 'C2',
    title: 'Sự giao thoa giữa khoa học dữ liệu và khoa học nhân văn',
    contextVi: 'Bạn bảo vệ vai trò của triết học, lịch sử và văn học trong một thế giới tôn vinh định lượng.',
    promptEn: 'In an era dominated by quantitative metrics and big data, what indispensable insights do the humanities provide?',
    sampleAnswerEn: 'Data quantifies correlations, yet only the humanities interrogate values, historical contingency, and moral purpose—preventing technical efficiency from becoming ethically blind.',
    keywords: ['quantitative', 'correlations', 'contingency', 'ethically blind']
  },
  {
    id: 'solo_c2_06',
    tier: 'SOLO',
    level: 'C2',
    title: 'Quản trị rủi ro hiện sinh từ các công nghệ lưỡng dụng (Dual-Use Tech)',
    contextVi: 'Bạn phân tích bài toán điều phối quốc tế đối với những công nghệ vừa mang lại đột phá vừa tiềm ẩn nguy cơ.',
    promptEn: 'How can global governance frameworks regulate dual-use breakthroughs without stifling open scientific inquiry?',
    sampleAnswerEn: 'Effective governance requires tiered compute and capability thresholds paired with international verification regimes, analogous to nuclear non-proliferation treaties.',
    keywords: ['dual-use', 'stifling', 'thresholds', 'non-proliferation']
  },
  {
    id: 'solo_c2_07',
    tier: 'SOLO',
    level: 'C2',
    title: 'Định nghĩa lại thành công và sự thịnh vượng ngoài chỉ số GDP',
    contextVi: 'Bạn phát biểu tại hội nghị kinh tế phát triển về các thước đo hạnh phúc và bền vững sinh thái.',
    promptEn: 'Why has Gross Domestic Product proven increasingly inadequate as a proxy for societal well-being, and what metrics should supersede it?',
    sampleAnswerEn: 'GDP indiscriminately counts ecological depletion alongside productive output; multidimensional indices incorporating natural capital, median healthspan, and social trust offer truer benchmarks.',
    keywords: ['indiscriminately', 'depletion', 'multidimensional', 'benchmarks']
  },
  {
    id: 'solo_c2_08',
    tier: 'SOLO',
    level: 'C2',
    title: 'Ngôn ngữ học nhận thức và ảnh hưởng của tiếng mẹ đẻ lên tư duy',
    contextVi: 'Bạn thảo luận về giả thuyết Sapir-Whorf và lợi thế nhận thức của người nói đa ngôn ngữ.',
    promptEn: 'To what degree does linguistic structure shape human perception, and how does multilingualism enrich cognitive flexibility?',
    sampleAnswerEn: 'While language does not imprison thought, grammatical categories subtly habitualize attention; navigating multiple languages cultivates metalinguistic awareness and perspective-taking.',
    keywords: ['linguistic', 'habitualize', 'multilingualism', 'metalinguistic']
  },
  {
    id: 'solo_c2_09',
    tier: 'SOLO',
    level: 'C2',
    title: 'Tâm lý học hành vi và thiết kế chính sách công (Nudge Theory)',
    contextVi: 'Bạn đánh giá ranh giới đạo đức khi chính phủ dùng "cú hích" hành vi để định hướng công dân.',
    promptEn: 'When does behavioral nudging in public policy cross the line from benevolent guidance into paternalistic manipulation?',
    sampleAnswerEn: 'Nudges remain ethically defensible only when they preserve effortless opt-outs, align with citizens’ reflective preferences, and withstand public scrutiny.',
    keywords: ['nudging', 'paternalistic', 'opt-outs', 'scrutiny']
  },
  {
    id: 'solo_c2_10',
    tier: 'SOLO',
    level: 'C2',
    title: 'Di sản trí tuệ và trách nhiệm liên thế hệ đối với biến đổi khí hậu',
    contextVi: 'Bạn kết thúc buổi diễn thuyết về công lý khí hậu giữa các thế hệ.',
    promptEn: 'How should legal and economic institutions formalize obligations toward future generations who lack present political representation?',
    sampleAnswerEn: 'Embedding intergenerational trusteeship into constitutional law and lowering social discount rates compel present policymakers to internalize long-horizon ecological costs.',
    keywords: ['intergenerational', 'trusteeship', 'discount rates', 'internalize']
  }
];