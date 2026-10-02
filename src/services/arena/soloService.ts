// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface SoloTopic {
  id: string;
  title: string;
  promptEn: string;
  promptVi?: string;
  keywords: string[];
}

const sessionUsedTopicTexts: Set<string> = new Set();

export function clearSoloTopicHistory() {
  sessionUsedTopicTexts.clear();
}

// 📦 KHO DỮ LIỆU LOCAL 20 CHỦ ĐỀ ĐỘC BẢN CHO MỖI LEVEL (TỔNG 120 CHỦ ĐỀ)
const LOCAL_SOLO_POOL: Record<string, SoloTopic[]> = {
  A1: [
    { id: 's_a1_1', title: "Solo Pulse [A1]", promptEn: "Describe your daily morning routine and what you eat for breakfast.", promptVi: "Mô tả thói quen buổi sáng hàng ngày và món ăn sáng của bạn.", keywords: ["routine", "breakfast"] },
    { id: 's_a1_2', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite hobby and why you enjoy it.", promptVi: "Nói về sở thích yêu thích của bạn và lý do bạn thích nó.", keywords: ["hobby", "free time"] },
    { id: 's_a1_3', title: "Solo Pulse [A1]", promptEn: "Describe your best friend and how you met each other.", promptVi: "Mô tả người bạn thân nhất của bạn và cách hai bạn gặp nhau.", keywords: ["friend", "relationship"] },
    { id: 's_a1_4', title: "Solo Pulse [A1]", promptEn: "Talk about your hometown and your favorite place in it.", promptVi: "Nói về quê hương bạn và địa điểm bạn yêu thích nhất ở đó.", keywords: ["hometown", "place"] },
    { id: 's_a1_5', title: "Solo Pulse [A1]", promptEn: "Describe your family members and their jobs.", promptVi: "Mô tả các thành viên trong gia đình bạn và công việc của họ.", keywords: ["family", "jobs"] },
    { id: 's_a1_6', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite season of the year and the weather.", promptVi: "Nói về mùa yêu thích nhất trong năm và thời tiết.", keywords: ["season", "weather"] },
    { id: 's_a1_7', title: "Solo Pulse [A1]", promptEn: "Describe your bedroom and your favorite items in it.", promptVi: "Mô tả phòng ngủ của bạn và món đồ bạn thích nhất.", keywords: ["bedroom", "home"] },
    { id: 's_a1_8', title: "Solo Pulse [A1]", promptEn: "Talk about what you usually do on weekends.", promptVi: "Nói về những việc bạn thường làm vào cuối tuần.", keywords: ["weekend", "activities"] },
    { id: 's_a1_9', title: "Solo Pulse [A1]", promptEn: "Describe your favorite animal and why you like it.", promptVi: "Mô tả động vật yêu thích của bạn và lý do bạn thích nó.", keywords: ["animal", "pet"] },
    { id: 's_a1_10', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite food and how often you eat it.", promptVi: "Nói về món ăn yêu thích của bạn và tần suất bạn ăn nó.", keywords: ["food", "meal"] },
    { id: 's_a1_11', title: "Solo Pulse [A1]", promptEn: "Describe your favorite teacher at school.", promptVi: "Mô tả người thầy/cô giáo yêu thích của bạn ở trường.", keywords: ["teacher", "school"] },
    { id: 's_a1_12', title: "Solo Pulse [A1]", promptEn: "Talk about the music you listen to every day.", promptVi: "Nói về dòng nhạc bạn nghe hàng ngày.", keywords: ["music", "daily"] },
    { id: 's_a1_13', title: "Solo Pulse [A1]", promptEn: "Describe your favorite pair of shoes or clothes.", promptVi: "Mô tả đôi giày hoặc bộ quần áo yêu thích của bạn.", keywords: ["clothes", "fashion"] },
    { id: 's_a1_14', title: "Solo Pulse [A1]", promptEn: "Talk about what you do in the evening before sleeping.", promptVi: "Nói về những việc bạn làm vào buổi tối trước khi đi ngủ.", keywords: ["night", "routine"] },
    { id: 's_a1_15', title: "Solo Pulse [A1]", promptEn: "Describe a park near your house and what people do there.", promptVi: "Mô tả một công viên gần nhà bạn và những gì mọi người làm ở đó.", keywords: ["park", "nature"] },
    { id: 's_a1_16', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite drink on a hot summer day.", promptVi: "Nói về thức uống yêu thích của bạn vào ngày hè nóng nực.", keywords: ["drink", "summer"] },
    { id: 's_a1_17', title: "Solo Pulse [A1]", promptEn: "Describe your favorite fruit and how it tastes.", promptVi: "Mô tả loại trái cây yêu thích của bạn và hương vị của nó.", keywords: ["fruit", "food"] },
    { id: 's_a1_18', title: "Solo Pulse [A1]", promptEn: "Talk about a birthday present you received that made you happy.", promptVi: "Nói về một món quà sinh nhật khiến bạn hạnh phúc.", keywords: ["gift", "birthday"] },
    { id: 's_a1_19', title: "Solo Pulse [A1]", promptEn: "Describe your commute to school or work.", promptVi: "Mô tả quãng đường đi học hoặc đi làm của bạn.", keywords: ["commute", "travel"] },
    { id: 's_a1_20', title: "Solo Pulse [A1]", promptEn: "Talk about a game you played with your friends recently.", promptVi: "Nói về một trò chơi bạn đã chơi cùng bạn bè gần đây.", keywords: ["game", "friends"] }
  ],
  A2: [
    { id: 's_a2_1', title: "Solo Pulse [A2]", promptEn: "Describe a memorable vacation or trip you took recently.", promptVi: "Mô tả một kỳ nghỉ hoặc chuyến đi đáng nhớ bạn vừa trải qua.", keywords: ["vacation", "travel"] },
    { id: 's_a2_2', title: "Solo Pulse [A2]", promptEn: "Talk about a movie you watched recently and liked.", promptVi: "Nói về một bộ phim bạn mới xem gần đây và yêu thích.", keywords: ["movie", "entertainment"] },
    { id: 's_a2_3', title: "Solo Pulse [A2]", promptEn: "Describe your dream job and what skills you need for it.", promptVi: "Mô tả công việc mơ ước của bạn và kỹ năng cần có.", keywords: ["career", "skills"] },
    { id: 's_a2_4', title: "Solo Pulse [A2]", promptEn: "Talk about how you use technology in your daily life.", promptVi: "Nói về cách bạn sử dụng công nghệ trong cuộc sống hàng ngày.", keywords: ["technology", "gadgets"] },
    { id: 's_a2_5', title: "Solo Pulse [A2]", promptEn: "Describe a special festival or holiday in your country.", promptVi: "Mô tả một lễ hội hoặc ngày lễ đặc biệt ở quốc gia bạn.", keywords: ["festival", "culture"] },
    { id: 's_a2_6', title: "Solo Pulse [A2]", promptEn: "Talk about a sport or physical exercise you enjoy.", promptVi: "Nói về một môn thể thao hoặc bài tập thể dục bạn thích.", keywords: ["sport", "fitness"] },
    { id: 's_a2_7', title: "Solo Pulse [A2]", promptEn: "Describe your shopping habits and where you buy clothes.", promptVi: "Mô tả thói quen mua sắm và nơi bạn thường mua quần áo.", keywords: ["shopping", "clothes"] },
    { id: 's_a2_8', title: "Solo Pulse [A2]", promptEn: "Talk about a skill you want to learn in the future.", promptVi: "Nói về một kỹ năng bạn muốn học trong tương lai.", keywords: ["skill", "learning"] },
    { id: 's_a2_9', title: "Solo Pulse [A2]", promptEn: "Describe a restaurant you like and the food they serve.", promptVi: "Mô tả một nhà hàng bạn thích và món ăn ở đó.", keywords: ["restaurant", "food"] },
    { id: 's_a2_10', title: "Solo Pulse [A2]", promptEn: "Talk about transport options in your city and how you travel.", promptVi: "Nói về các phương tiện giao thông ở thành phố bạn.", keywords: ["transport", "city"] },
    { id: 's_a2_11', title: "Solo Pulse [A2]", promptEn: "Describe an interesting book you read and why you recommend it.", promptVi: "Mô tả một cuốn sách hay bạn đã đọc và lý do bạn tiến cử nó.", keywords: ["book", "reading"] },
    { id: 's_a2_12', title: "Solo Pulse [A2]", promptEn: "Talk about a challenge you faced at school or work and solved.", promptVi: "Nói về một thử thách bạn đã vượt qua ở trường hoặc công sở.", keywords: ["challenge", "problem"] },
    { id: 's_a2_13', title: "Solo Pulse [A2]", promptEn: "Describe your favorite app on your smartphone and its main features.", promptVi: "Mô tả ứng dụng điện thoại yêu thích của bạn và các tính năng chính.", keywords: ["app", "smartphone"] },
    { id: 's_a2_14', title: "Solo Pulse [A2]", promptEn: "Talk about a celebration you had with your family recently.", promptVi: "Nói về một bữa tiệc kỷ niệm gia đình bạn mới tổ chức gần đây.", keywords: ["celebration", "family"] },
    { id: 's_a2_15', title: "Solo Pulse [A2]", promptEn: "Describe how you prepare for an important exam or meeting.", promptVi: "Mô tả cách bạn chuẩn bị cho một kỳ thi hoặc cuộc họp quan trọng.", keywords: ["exam", "preparation"] },
    { id: 's_a2_16', title: "Solo Pulse [A2]", promptEn: "Talk about a gift you bought for someone else.", promptVi: "Nói về một món quà bạn đã mua tặng người khác.", keywords: ["gift", "shopping"] },
    { id: 's_a2_17', title: "Solo Pulse [A2]", promptEn: "Describe a cafe where you like to study or relax.", promptVi: "Mô tả một quán cafe bạn thích ngồi học tập hoặc thư giãn.", keywords: ["cafe", "relaxation"] },
    { id: 's_a2_18', title: "Solo Pulse [A2]", promptEn: "Talk about your favorite TV show and its main characters.", promptVi: "Nói về chương trình truyền hình yêu thích và các nhân vật chính.", keywords: ["tv show", "media"] },
    { id: 's_a2_19', title: "Solo Pulse [A2]", promptEn: "Describe a place in your country that you want to visit.", promptVi: "Mô tả một địa điểm ở nước bạn mà bạn rất muốn đến tham quan.", keywords: ["travel", "destination"] },
    { id: 's_a2_20', title: "Solo Pulse [A2]", promptEn: "Talk about how you manage your money and savings.", promptVi: "Nói về cách bạn quản lý tiền bạc và khoản tiết kiệm của mình.", keywords: ["money", "savings"] }
  ],
  B1: [
    { id: 's_b1_1', title: "Solo Pulse [B1]", promptEn: "Discuss the advantages and disadvantages of online shopping versus traditional markets.", promptVi: "Thảo luận về ưu nhược điểm của mua sắm trực tuyến so với chợ truyền thống.", keywords: ["e-commerce", "shopping"] },
    { id: 's_b1_2', title: "Solo Pulse [B1]", promptEn: "Analyze the impact of social media on modern personal relationships.", promptVi: "Phân tích tác động của mạng xã hội lên các mối quan hệ cá nhân.", keywords: ["social media", "relationships"] },
    { id: 's_b1_3', title: "Solo Pulse [B1]", promptEn: "Discuss how learning a foreign language influences career opportunities.", promptVi: "Thảo luận việc học ngoại ngữ ảnh hưởng thế nào đến cơ hội nghề nghiệp.", keywords: ["languages", "career"] },
    { id: 's_b1_4', title: "Solo Pulse [B1]", promptEn: "Evaluate the importance of environmental recycling in urban areas.", promptVi: "Đánh giá tầm quan trọng của việc tái chế bảo vệ môi trường.", keywords: ["environment", "recycling"] },
    { id: 's_b1_5', title: "Solo Pulse [B1]", promptEn: "Discuss the balance between work life and personal health for young people.", promptVi: "Thảo luận về sự cân bằng giữa công việc và sức khỏe cá nhân.", keywords: ["work-life balance", "health"] },
    { id: 's_b1_6', title: "Solo Pulse [B1]", promptEn: "Analyze why eco-tourism is becoming popular among global travelers.", promptVi: "Phân tích lý do du lịch sinh thái đang trở nên phổ biến.", keywords: ["tourism", "nature"] },
    { id: 's_b1_7', title: "Solo Pulse [B1]", promptEn: "Discuss how public transport can reduce traffic congestion in big cities.", promptVi: "Thảo luận cách phương tiện công cộng giảm ùn tắc giao thông.", keywords: ["traffic", "transport"] },
    { id: 's_b1_8', title: "Solo Pulse [B1]", promptEn: "Evaluate the effect of fast food consumption on public health.", promptVi: "Đánh giá ảnh hưởng của việc ăn thức ăn nhanh lên sức khỏe.", keywords: ["health", "diet"] },
    { id: 's_b1_9', title: "Solo Pulse [B1]", promptEn: "Discuss the pros and cons of living in a big city compared to a rural area.", promptVi: "Thảo luận ưu nhược điểm của việc sống ở thành phố lớn.", keywords: ["city life", "lifestyle"] },
    { id: 's_b1_10', title: "Solo Pulse [B1]", promptEn: "Analyze the role of traditional music and arts in preserving cultural heritage.", promptVi: "Phân tích vai trò của âm nhạc nghệ thuật truyền thống.", keywords: ["culture", "heritage"] },
    { id: 's_b1_11', title: "Solo Pulse [B1]", promptEn: "Discuss how volunteer work benefits both society and young individuals.", promptVi: "Thảo luận việc làm từ thiện giúp ích gì cho xã hội và giới trẻ.", keywords: ["volunteering", "society"] },
    { id: 's_b1_12', title: "Solo Pulse [B1]", promptEn: "Evaluate the benefits of keeping a personal daily journal or blog.", promptVi: "Đánh giá lợi ích của việc viết nhật ký hoặc blog cá nhân hàng ngày.", keywords: ["writing", "reflection"] },
    { id: 's_b1_13', title: "Solo Pulse [B1]", promptEn: "Discuss how peer pressure affects young adults' career and life decisions.", promptVi: "Thảo luận ảnh hưởng của áp lực đồng lứa lên quyết định của người trẻ.", keywords: ["peer pressure", "youth"] },
    { id: 's_b1_14', title: "Solo Pulse [B1]", promptEn: "Analyze the advantages of working for a small startup versus a large corporation.", promptVi: "Phân tích lợi thế khi làm việc tại startup so với tập đoàn lớn.", keywords: ["startup", "corporation"] },
    { id: 's_b1_15', title: "Solo Pulse [B1]", promptEn: "Discuss the role of sports in fostering teamwork and discipline in children.", promptVi: "Thảo luận vai trò thể thao giúp rèn luyện tính đồng đội cho trẻ em.", keywords: ["sports", "teamwork"] },
    { id: 's_b1_16', title: "Solo Pulse [B1]", promptEn: "Evaluate how streaming platforms have changed movie consumption habits.", promptVi: "Đánh giá nền tảng xem phim trực tuyến thay đổi thói quen giải trí.", keywords: ["streaming", "entertainment"] },
    { id: 's_b1_17', title: "Solo Pulse [B1]", promptEn: "Discuss the impact of climate change on local agricultural food production.", promptVi: "Thảo luận tác động biến đổi khí hậu lên sản xuất nông nghiệp.", keywords: ["climate", "agriculture"] },
    { id: 's_b1_18', title: "Solo Pulse [B1]", promptEn: "Analyze the importance of teaching financial literacy to high school students.", promptVi: "Phân tích tầm quan trọng việc dạy quản lý tài chính cho học sinh.", keywords: ["finance", "education"] },
    { id: 's_b1_19', title: "Solo Pulse [B1]", promptEn: "Discuss the benefits and risks of adopting cashless digital payment systems.", promptVi: "Thảo luận lợi ích và rủi ro của thanh toán không dùng tiền mặt.", keywords: ["cashless", "payment"] },
    { id: 's_b1_20', title: "Solo Pulse [B1]", promptEn: "Evaluate the role of museums and historic sites in modern education.", promptVi: "Đánh giá vai trò của bảo tàng và di tích lịch sử đối với giáo dục.", keywords: ["museum", "history"] }
  ],
  B2: [
    { id: 's_b2_1', title: "Solo Pulse [B2]", promptEn: "Analyze the ethical implications of automated algorithms in targeted commercial advertising.", keywords: ["algorithms", "ethics"] },
    { id: 's_b2_2', title: "Solo Pulse [B2]", promptEn: "Evaluate the environmental impact of global fast-fashion production and supply chains.", keywords: ["fast fashion", "sustainability"] },
    { id: 's_b2_3', title: "Solo Pulse [B2]", promptEn: "Discuss the influence of artificial intelligence on future employment opportunities.", keywords: ["AI", "employment"] },
    { id: 's_b2_4', title: "Solo Pulse [B2]", promptEn: "Examine the role of renewable energy adoption in mitigating climate change risks.", keywords: ["renewable energy", "climate"] },
    { id: 's_b2_5', title: "Solo Pulse [B2]", promptEn: "Critique the psychological impact of constant notification cycles on human attention spans.", keywords: ["psychology", "technology"] },
    { id: 's_b2_6', title: "Solo Pulse [B2]", promptEn: "Analyze how digital currencies could transform traditional banking infrastructures.", keywords: ["fintech", "banking"] },
    { id: 's_b2_7', title: "Solo Pulse [B2]", promptEn: "Discuss the ethical responsibilities of media outlets in curbing misinformation.", keywords: ["journalism", "ethics"] },
    { id: 's_b2_8', title: "Solo Pulse [B2]", promptEn: "Evaluate the effectiveness of remote working models on corporate innovation.", keywords: ["remote work", "innovation"] },
    { id: 's_b2_9', title: "Solo Pulse [B2]", promptEn: "Examine the socio-economic effects of urbanization on developing economies.", keywords: ["urbanization", "economics"] },
    { id: 's_b2_10', title: "Solo Pulse [B2]", promptEn: "Discuss the regulatory challenges posed by autonomous self-driving vehicles.", keywords: ["autonomous vehicles", "regulation"] },
    { id: 's_b2_11', title: "Solo Pulse [B2]", promptEn: "Analyze the implications of genetic testing technologies on personal privacy rights.", keywords: ["biotech", "privacy"] },
    { id: 's_b2_12', title: "Solo Pulse [B2]", promptEn: "Critique the growing reliance on gig-economy platforms for sustainable livelihood.", keywords: ["gig economy", "labor"] },
    { id: 's_b2_13', title: "Solo Pulse [B2]", promptEn: "Evaluate the effectiveness of international carbon credit offset frameworks.", keywords: ["carbon credits", "sustainability"] },
    { id: 's_b2_14', title: "Solo Pulse [B2]", promptEn: "Examine the influence of influencer culture on consumer spending behaviors.", keywords: ["consumerism", "influencers"] },
    { id: 's_b2_15', title: "Solo Pulse [B2]", promptEn: "Discuss the ethics of automated facial recognition deployment in public spaces.", keywords: ["surveillance", "privacy"] },
    { id: 's_b2_16', title: "Solo Pulse [B2]", promptEn: "Analyze the impact of commercial space tourism on atmospheric protection policies.", keywords: ["space tourism", "aerospace"] },
    { id: 's_b2_17', title: "Solo Pulse [B2]", promptEn: "Evaluate how smart city urban design can improve public health resilience.", keywords: ["smart cities", "urban planning"] },
    { id: 's_b2_18', title: "Solo Pulse [B2]", promptEn: "Examine the challenges of managing electronic waste from consumer technology.", keywords: ["e-waste", "sustainability"] },
    { id: 's_b2_19', title: "Solo Pulse [B2]", promptEn: "Discuss the economic risks associated with over-tourism in heritage destinations.", keywords: ["overtourism", "economics"] },
    { id: 's_b2_20', title: "Solo Pulse [B2]", promptEn: "Analyze the role of global multilateral organizations in mitigating trade wars.", keywords: ["trade", "geopolitics"] }
  ],
  C1: [
    { id: 's_c1_1', title: "Solo Pulse [C1]", promptEn: "Evaluate the impact of macroeconomic inflation on global supply chain resilience.", keywords: ["macroeconomics", "supply chain"] },
    { id: 's_c1_2', title: "Solo Pulse [C1]", promptEn: "Deconstruct the geopolitical challenges of regulating international cyberspace conflicts.", keywords: ["geopolitics", "cybersecurity"] },
    { id: 's_c1_3', title: "Solo Pulse [C1]", promptEn: "Analyze the socio-economic repercussions of demographic aging in industrialized nations.", keywords: ["demographics", "economy"] },
    { id: 's_c1_4', title: "Solo Pulse [C1]", promptEn: "Critique the efficacy of carbon tax policies in incentivizing corporate decarbonization.", keywords: ["carbon tax", "decarbonization"] },
    { id: 's_c1_5', title: "Solo Pulse [C1]", promptEn: "Examine the philosophical boundary between human cognitive autonomy and AI augmentation.", keywords: ["cognition", "philosophy"] },
    { id: 's_c1_6', title: "Solo Pulse [C1]", promptEn: "Evaluate the resilience of democratic institutions in an era of algorithmic polarizations.", keywords: ["democracy", "polarization"] },
    { id: 's_c1_7', title: "Solo Pulse [C1]", promptEn: "Deconstruct the legal tensions surrounding patent monopolies in global pharmaceutical research.", keywords: ["intellectual property", "pharma"] },
    { id: 's_c1_8', title: "Solo Pulse [C1]", promptEn: "Analyze the impact of central bank digital currencies on global monetary sovereignty.", keywords: ["CBDC", "monetary policy"] },
    { id: 's_c1_9', title: "Solo Pulse [C1]", promptEn: "Critique the commodification of private data in modern platform capitalism.", keywords: ["surveillance capitalism", "privacy"] },
    { id: 's_c1_10', title: "Solo Pulse [C1]", promptEn: "Examine the ethical considerations of CRISPR gene editing in preventative healthcare.", keywords: ["biotechnology", "gene editing"] },
    { id: 's_c1_11', title: "Solo Pulse [C1]", promptEn: "Evaluate the structural shift toward multipolar trade alignments amidst geopolitical tensions.", keywords: ["multipolarity", "trade"] },
    { id: 's_c1_12', title: "Solo Pulse [C1]", promptEn: "Deconstruct the psychological mechanisms of echo-chamber formation in digital news networks.", keywords: ["echo chambers", "epistemology"] },
    { id: 's_c1_13', title: "Solo Pulse [C1]", promptEn: "Analyze the legal frameworks governing deepfake technology and intellectual property protection.", keywords: ["deepfakes", "jurisprudence"] },
    { id: 's_c1_14', title: "Solo Pulse [C1]", promptEn: "Critique the socio-economic disparities exacerbated by rapid technological automation in agriculture.", keywords: ["agritech", "disparity"] },
    { id: 's_c1_15', title: "Solo Pulse [C1]", promptEn: "Examine the efficacy of geoengineering solar radiation management as a temporary climate intervention.", keywords: ["geoengineering", "climate"] },
    { id: 's_c1_16', title: "Solo Pulse [C1]", promptEn: "Evaluate the impact of algorithmic high-frequency trading on global financial market stability.", keywords: ["algorithmic trading", "finance"] },
    { id: 's_c1_17', title: "Solo Pulse [C1]", promptEn: "Deconstruct the ethics of automated military drone systems operating under decentralized decision trees.", keywords: ["military AI", "ethics"] },
    { id: 's_c1_18', title: "Solo Pulse [C1]", promptEn: "Analyze the erosion of traditional labor rights within decentralized global remote work contracts.", keywords: ["labor law", "globalization"] },
    { id: 's_c1_19', title: "Solo Pulse [C1]", promptEn: "Critique the institutional governance mechanisms mitigating water scarcity disputes in transboundary basins.", keywords: ["water rights", "governance"] },
    { id: 's_c1_20', title: "Solo Pulse [C1]", promptEn: "Examine the legal jurisprudence surrounding neural privacy and brain-computer interface telemetry data.", keywords: ["neurotech", "jurisprudence"] }
  ],
  C2: [
    { id: 's_c2_1', title: "Solo Pulse [C2]", promptEn: "Critically deconstruct the epistemological paradigm shift induced by generative AI in scientific research.", keywords: ["epistemology", "generative AI"] },
    { id: 's_c2_2', title: "Solo Pulse [C2]", promptEn: "Analyze the tension between national sovereignty and supranational climate governance frameworks.", keywords: ["sovereignty", "governance"] },
    { id: 's_c2_3', title: "Solo Pulse [C2]", promptEn: "Evaluate the ontological implications of artificial consciousness on human moral standing.", keywords: ["ontology", "ethics"] },
    { id: 's_c2_4', title: "Solo Pulse [C2]", promptEn: "Deconstruct the structural fragilities of globalized financial derivatives markets during geopolitical crises.", keywords: ["financial markets", "derivatives"] },
    { id: 's_c2_5', title: "Solo Pulse [C2]", promptEn: "Critique the discourse of techno-solutionism in addressing systemic socio-ecological degradation.", keywords: ["techno-solutionism", "ecology"] },
    { id: 's_c2_6', title: "Solo Pulse [C2]", promptEn: "Analyze the jurisprudence surrounding extraterritorial corporate accountability in transnational supply chains.", keywords: ["jurisprudence", "human rights"] },
    { id: 's_c2_7', title: "Solo Pulse [C2]", promptEn: "Deconstruct the socio-linguistic erosion of regional dialects under corporate language homogenization.", keywords: ["linguistics", "homogenization"] },
    { id: 's_c2_8', title: "Solo Pulse [C2]", promptEn: "Evaluate the thermodynamic limits of exponential computational growth in quantum systems.", keywords: ["thermodynamics", "quantum"] },
    { id: 's_c2_9', title: "Solo Pulse [C2]", promptEn: "Critique the institutional inertia preventing radical reform in multilateral international organizations.", keywords: ["multilateralism", "institutionalism"] },
    { id: 's_c2_10', title: "Solo Pulse [C2]", promptEn: "Analyze the existential implications of post-humanist philosophies on bioethical frameworks.", keywords: ["post-humanism", "bioethics"] },
    { id: 's_c2_11', title: "Solo Pulse [C2]", promptEn: "Deconstruct the structural paradoxes of fiat monetary expansion within finite ecological systems.", keywords: ["monetary theory", "ecology"] },
    { id: 's_c2_12', title: "Solo Pulse [C2]", promptEn: "Critically analyze the epistemological validity of synthetic data in training autonomous decision engines.", keywords: ["synthetic data", "epistemology"] },
    { id: 's_c2_13', title: "Solo Pulse [C2]", promptEn: "Evaluate the legal jurisprudence governing corporate liability for automated algorithmic market collusion.", keywords: ["antitrust", "jurisprudence"] },
    { id: 's_c2_14', title: "Solo Pulse [C2]", promptEn: "Deconstruct the socio-political ramifications of de-dollarization in multipolar international financial clearing.", keywords: ["de-dollarization", "geopolitics"] },
    { id: 's_c2_15', title: "Solo Pulse [C2]", promptEn: "Critique the philosophical assumptions underpinning techno-capitalist paradigms of continuous economic growth.", keywords: ["techno-capitalism", "philosophy"] },
    { id: 's_c2_16', title: "Solo Pulse [C2]", promptEn: "Analyze the legal and moral status of synthetic biological organisms engineered for industrial bioremediation.", keywords: ["synthetic biology", "ethics"] },
    { id: 's_c2_17', title: "Solo Pulse [C2]", promptEn: "Evaluate the systemic vulnerabilities of subsea fiber-optic communication backbones in modern hybrid warfare.", keywords: ["infrastructure", "cyberwarfare"] },
    { id: 's_c2_18', title: "Solo Pulse [C2]", promptEn: "Deconstruct the jurisprudence of extraterritorial carbon border adjustments under WTO non-discrimination mandates.", keywords: ["WTO", "jurisprudence"] },
    { id: 's_c2_19', title: "Solo Pulse [C2]", promptEn: "Critically assess the thermodynamic scalability of planetary-scale direct air carbon capture infrastructure.", keywords: ["carbon capture", "thermodynamics"] },
    { id: 's_c2_20', title: "Solo Pulse [C2]", promptEn: "Analyze the ontological reframing of human agency in fully automated algorithmic governance frameworks.", keywords: ["agency", "algorithmic governance"] }
  ]
};

// ⚡ LẤY NGAY 1 ĐỀ LOCAL KHÔNG TRÙNG (0.01s)
export function getInstantSoloTopic(cefrLevel: string = 'A1'): SoloTopic {
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const pool = LOCAL_SOLO_POOL[levelKey] || LOCAL_SOLO_POOL['A1'];
  
  const filtered = pool.filter(item => !sessionUsedTopicTexts.has(item.promptEn.toLowerCase()));
  const selected = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : pool[Math.floor(Math.random() * pool.length)];
  
  sessionUsedTopicTexts.add(selected.promptEn.toLowerCase());
  return { ...selected, id: `instant_solo_${Date.now()}_${Math.random()}` };
}

// ⚡ GỌI GROQ AI NGẦM ĐỂ CẬP NHẬT ĐỀ CHI TIẾT
export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  const uniqueSeed = `solo_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedTopicTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Test Designer. Generate ONE Solo Topic STRICTLY for Level ${levelKey}.
STRICT RULES:
${isLowLevel 
  ? `- Topic must be simple/intermediate. Include BOTH "promptEn" and "promptVi" (Vietnamese translation).` 
  : `- Topic MUST be highly academic, professional, or complex for Level ${levelKey}. 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE "promptVi".`
}
Return ONLY valid JSON matching:
{
  "title": "Solo Pulse [${levelKey}]",
  "promptEn": "Topic text",
  ${isLowLevel ? '"promptVi": "Bản dịch tiếng Việt",' : ''}
  "keywords": ["word1", "word2"]
}`;

  try {
    const apiCall = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a BRAND NEW topic for CEFR [${levelKey}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList || 'None'}]` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 1.0,
      response_format: { type: 'json_object' }
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Groq Timeout')), 3500)
    );

    const response: any = await Promise.race([apiCall, timeout]);
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const promptEn = parsed.promptEn || `Topic for ${levelKey}`;

    sessionUsedTopicTexts.add(promptEn.toLowerCase());

    return {
      id: uniqueSeed,
      title: parsed.title || `Solo Pulse [${levelKey}]`,
      promptEn: promptEn,
      promptVi: isLowLevel ? parsed.promptVi : undefined,
      keywords: parsed.keywords || ["speaking"]
    };
  } catch (error) {
    return getInstantSoloTopic(cefrLevel);
  }
}