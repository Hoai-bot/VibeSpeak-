// src/services/arena/relayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RelayChallenge {
  id: string;
  topic: string;
  contextEn: string;
  contextVi?: string;
  player1En: string;
  player1Vi?: string;
  player2En: string;
  player2Vi?: string;
  keyVocabulary: string[];
}

const sessionUsedRelayTexts: Set<string> = new Set();

export function clearRelayHistory() {
  sessionUsedRelayTexts.clear();
}

// 📦 KHO DỮ LIỆU LOCAL 20 CHỦ ĐỀ RELAY ĐỘC BẢN CHO MỖI LEVEL (TỔNG 120 CHỦ ĐỀ)
const LOCAL_RELAY_POOL: Record<string, RelayChallenge[]> = {
  A1: [
    { id: 'r_a1_1', topic: "Daily Habits [A1]", contextEn: "Discuss your daily routine.", contextVi: "Thảo luận về thói quen hàng ngày.", player1En: "Talk about your morning routine.", player1Vi: "Nói về thói quen buổi sáng.", player2En: "Talk about your evening activities.", player2Vi: "Nói về các hoạt động buổi tối.", keyVocabulary: ["routine"] },
    { id: 'r_a1_2', topic: "Favorite Food [A1]", contextEn: "Talking about food preferences.", contextVi: "Nói về sở thích ăn uống.", player1En: "Talk about your favorite breakfast.", player1Vi: "Nói về bữa sáng yêu thích.", player2En: "Talk about what you like for dinner.", player2Vi: "Nói về món ăn tối yêu thích.", keyVocabulary: ["food"] },
    { id: 'r_a1_3', topic: "Weekend Activities [A1]", contextEn: "Planning weekend fun.", contextVi: "Lên kế hoạch vui chơi cuối tuần.", player1En: "Suggest Saturday activities.", player1Vi: "Gợi ý các hoạt động thứ 7.", player2En: "Suggest Sunday relaxation.", player2Vi: "Gợi ý thư giãn vào Chủ Nhật.", keyVocabulary: ["weekend"] },
    { id: 'r_a1_4', topic: "My House [A1]", contextEn: "Describing rooms in your home.", contextVi: "Mô tả các phòng trong nhà bạn.", player1En: "Describe your living room.", player1Vi: "Mô tả phòng khách.", player2En: "Describe your bedroom.", player2Vi: "Mô tả phòng ngủ.", keyVocabulary: ["house"] },
    { id: 'r_a1_5', topic: "School Life [A1]", contextEn: "Talking about favorite school subjects.", contextVi: "Nói về các môn học yêu thích.", player1En: "Talk about your favorite teacher.", player1Vi: "Nói về giáo viên bạn thích.", player2En: "Talk about your favorite subject.", player2Vi: "Nói về môn học yêu thích.", keyVocabulary: ["school"] },
    { id: 'r_a1_6', topic: "Weather Today [A1]", contextEn: "Discussing daily weather.", contextVi: "Thảo luận thời tiết hôm nay.", player1En: "Talk about sunny weather activities.", player1Vi: "Nói về hoạt động ngày nắng.", player2En: "Talk about rainy day plans.", player2Vi: "Nói về kế hoạch ngày mưa.", keyVocabulary: ["weather"] },
    { id: 'r_a1_7', topic: "Pets & Animals [A1]", contextEn: "Talking about household pets.", contextVi: "Nói về thú cưng trong nhà.", player1En: "Talk about dogs or cats.", player1Vi: "Nói về chó hoặc mèo.", player2En: "Talk about feeding pets.", player2Vi: "Nói về việc cho thú cưng ăn.", keyVocabulary: ["pet"] },
    { id: 'r_a1_8', topic: "Clothes & Style [A1]", contextEn: "Discussing daily outfit choices.", contextVi: "Thảo luận lựa chọn trang phục.", player1En: "Talk about summer clothes.", player1Vi: "Nói về quần áo mùa hè.", player2En: "Talk about winter coats.", player2Vi: "Nói về áo khoác mùa đông.", keyVocabulary: ["clothes"] },
    { id: 'r_a1_9', topic: "Family Vacation [A1]", contextEn: "Planning a family trip.", contextVi: "Lên kế hoạch du lịch gia đình.", player1En: "Suggest visiting the beach.", player1Vi: "Gợi ý đi biển.", player2En: "Suggest visiting the mountains.", player2Vi: "Gợi ý đi núi.", keyVocabulary: ["vacation"] },
    { id: 'r_a1_10', topic: "Sports & Games [A1]", contextEn: "Talking about outdoor games.", contextVi: "Nói về các trò chơi ngoài trời.", player1En: "Talk about football.", player1Vi: "Nói về bóng đá.", player2En: "Talk about badminton.", player2Vi: "Nói về cầu lông.", keyVocabulary: ["sports"] },
    { id: 'r_a1_11', topic: "At the Supermarket [A1]", contextEn: "Buying groceries for the week.", contextVi: "Mua thực phẩm cho cả tuần.", player1En: "Talk about buying fruits and vegetables.", player1Vi: "Nói về mua trái cây và rau.", player2En: "Talk about buying milk and bread.", player2Vi: "Nói về mua sữa và bánh mì.", keyVocabulary: ["groceries"] },
    { id: 'r_a1_12', topic: "Birthday Present [A1]", contextEn: "Choosing a gift for a friend.", contextVi: "Chọn quà sinh nhật cho bạn.", player1En: "Suggest buying a book.", player1Vi: "Gợi ý mua một cuốn sách.", player2En: "Suggest buying a toy or accessory.", player2Vi: "Gợi ý mua đồ chơi hoặc phụ kiện.", keyVocabulary: ["gift"] },
    { id: 'r_a1_13', topic: "My Favorite Park [A1]", contextEn: "Walking in a city park.", contextVi: "Đi dạo ở công viên thành phố.", player1En: "Talk about walking your dog.", player1Vi: "Nói về dắt chó đi dạo.", player2En: "Talk about sitting on a bench.", player2Vi: "Nói về ngồi nghỉ trên ghế đá.", keyVocabulary: ["park"] },
    { id: 'r_a1_14', topic: "Morning Coffee [A1]", contextEn: "Drinking morning beverages.", contextVi: "Uống đồ uống buổi sáng.", player1En: "Talk about hot coffee.", player1Vi: "Nói về cà phê nóng.", player2En: "Talk about iced green tea.", player2Vi: "Nói về trà xanh đá.", keyVocabulary: ["coffee"] },
    { id: 'r_a1_15', topic: "Hobby Sharing [A1]", contextEn: "Discussing free time fun.", contextVi: "Thảo luận thú vui lúc rảnh.", player1En: "Talk about listening to music.", player1Vi: "Nói về nghe nhạc.", player2En: "Talk about drawing pictures.", player2Vi: "Nói về vẽ tranh.", keyVocabulary: ["hobby"] },
    { id: 'r_a1_16', topic: "Summer Holiday [A1]", contextEn: "Talking about summer break.", contextVi: "Nói về kỳ nghỉ hè.", player1En: "Talk about swimming in the sea.", player1Vi: "Nói về bơi ở biển.", player2En: "Talk about eating ice cream.", player2Vi: "Nói về ăn kem.", keyVocabulary: ["summer"] },
    { id: 'r_a1_17', topic: "Cooking Dinner [A1]", contextEn: "Preparing food at home.", contextVi: "Chuẩn bị đồ ăn tại nhà.", player1En: "Talk about washing vegetables.", player1Vi: "Nói về rửa rau.", player2En: "Talk about setting the dining table.", player2Vi: "Nói về dọn bàn ăn.", keyVocabulary: ["cooking"] },
    { id: 'r_a1_18', topic: "My Favorite Color [A1]", contextEn: "Choosing room paint colors.", contextVi: "Chọn màu sơn cho phòng.", player1En: "Argue for light blue.", player1Vi: "Ủng hộ màu xanh nhạt.", player2En: "Argue for warm yellow.", player2Vi: "Ủng hộ màu vàng ấm.", keyVocabulary: ["color"] },
    { id: 'r_a1_19', topic: "Riding a Bike [A1]", contextEn: "Cycling around the neighborhood.", contextVi: "Đạp xe quanh xóm.", player1En: "Talk about riding in the morning.", player1Vi: "Nói về đạp xe buổi sáng.", player2En: "Talk about wearing a helmet.", player2Vi: "Nói về đội mũ bảo hiểm.", keyVocabulary: ["cycling"] },
    { id: 'r_a1_20', topic: "Watching Cartoons [A1]", contextEn: "Discussing funny animated shows.", contextVi: "Thảo luận phim hoạt hình hài hước.", player1En: "Talk about favorite cartoon characters.", player1Vi: "Nói về nhân vật hoạt hình thích nhất.", player2En: "Talk about watching TV with family.", player2Vi: "Nói về xem TV cùng gia đình.", keyVocabulary: ["cartoons"] }
  ],
  A2: [
    { id: 'r_a2_1', topic: "Shopping Trip [A2]", contextEn: "Planning a clothes shopping trip.", contextVi: "Lên kế hoạch đi mua sắm quần áo.", player1En: "Suggest stores to visit.", player1Vi: "Gợi ý các cửa hàng.", player2En: "Discuss your budget.", player2Vi: "Thảo luận về ngân sách.", keyVocabulary: ["shopping"] },
    { id: 'r_a2_2', topic: "Restaurant Order [A2]", contextEn: "Ordering dinner at a restaurant.", contextVi: "Gọi món ăn tại nhà hàng.", player1En: "Choose appetizers and drinks.", player1Vi: "Chọn khai vị và đồ uống.", player2En: "Choose main dishes and desserts.", player2Vi: "Chọn món chính và tráng miệng.", keyVocabulary: ["restaurant"] },
    { id: 'r_a2_3', topic: "Movie Night [A2]", contextEn: "Deciding which movie to watch.", contextVi: "Quyết định xem phim gì.", player1En: "Propose an action movie.", player1Vi: "Đề xuất phim hành động.", player2En: "Propose a comedy movie.", player2Vi: "Đề xuất phim hài.", keyVocabulary: ["movie"] },
    { id: 'r_a2_4', topic: "Travel Planning [A2]", contextEn: "Booking a weekend train ticket.", contextVi: "Đặt vé tàu cuối tuần.", player1En: "Ask about ticket departure times.", player1Vi: "Hỏi giờ tàu chạy.", player2En: "Confirm ticket prices.", player2Vi: "Xác nhận giá vé.", keyVocabulary: ["travel"] },
    { id: 'r_a2_5', topic: "Health Advice [A2]", contextEn: "Talking about feeling unwell.", contextVi: "Nói về việc cảm thấy không khỏe.", player1En: "Describe cold symptoms.", player1Vi: "Mô tả triệu chứng cảm lạnh.", player2En: "Give health advice.", player2Vi: "Đưa ra lời khuyên sức khỏe.", keyVocabulary: ["health"] },
    { id: 'r_a2_6', topic: "Birthday Party [A2]", contextEn: "Organizing a friend's birthday.", contextVi: "Tổ chức sinh nhật cho bạn.", player1En: "Plan the birthday cake and decorations.", player1Vi: "Lên kế hoạch bánh và trang trí.", player2En: "Plan the guest list and games.", player2Vi: "Lên danh sách khách mời.", keyVocabulary: ["party"] },
    { id: 'r_a2_7', topic: "Hobby Exchange [A2]", contextEn: "Sharing favorite pastimes.", contextVi: "Chia sẻ sở thích lúc rảnh rỗi.", player1En: "Talk about playing video games.", player1Vi: "Nói về chơi game.", player2En: "Talk about playing musical instruments.", player2Vi: "Nói về chơi nhạc cụ.", keyVocabulary: ["hobby"] },
    { id: 'r_a2_8', topic: "City Directions [A2]", contextEn: "Helping a lost tourist in town.", contextVi: "Giúp du lịch bị lạc đường.", player1En: "Ask for the museum location.", player1Vi: "Hỏi vị trí bảo tàng.", player2En: "Give turn-by-turn directions.", player2Vi: "Chỉ đường chi tiết.", keyVocabulary: ["directions"] },
    { id: 'r_a2_9', topic: "Job Interview Practice [A2]", contextEn: "Practicing entry-level job questions.", contextVi: "Luyện phỏng vấn xin việc.", player1En: "Ask about work experience.", player1Vi: "Hỏi về kinh nghiệm.", player2En: "Describe personal strengths.", player2Vi: "Mô tả điểm mạnh.", keyVocabulary: ["interview"] },
    { id: 'r_a2_10', topic: "Tech Gadgets [A2]", contextEn: "Comparing smartphones and laptops.", contextVi: "So sánh điện thoại và laptop.", player1En: "Discuss smartphone features.", player1Vi: "Thảo luận tính năng điện thoại.", player2En: "Discuss laptop battery life.", player2Vi: "Thảo luận pin laptop.", keyVocabulary: ["tech"] },
    { id: 'r_a2_11', topic: "Renting an Apartment [A2]", contextEn: "Visiting a new rental flat.", contextVi: "Đi xem căn hộ cho thuê.", player1En: "Ask about monthly utilities.", player1Vi: "Hỏi về phí điện nước.", player2En: "Check furniture conditions.", player2Vi: "Kiểm tra nội thất.", keyVocabulary: ["rent"] },
    { id: 'r_a2_12', topic: "Visiting the Dentist [A2]", contextEn: "Going for a routine checkup.", contextVi: "Đi khám răng định kỳ.", player1En: "Explain tooth pain location.", player1Vi: "Giải thích chỗ bị đau răng.", player2En: "Suggest cleaning schedule.", player2Vi: "Đề xuất lịch lấy cao răng.", keyVocabulary: ["dentist"] },
    { id: 'r_a2_13', topic: "Planning a Picnic [A2]", contextEn: "Preparing food for a park picnic.", contextVi: "Chuẩn bị đồ ăn dã ngoại.", player1En: "Suggest making sandwiches.", player1Vi: "Gợi ý làm bánh mì sandwich.", player2En: "Suggest packing fruit juice.", player2Vi: "Gợi ý mang theo nước trái cây.", keyVocabulary: ["picnic"] },
    { id: 'r_a2_14', topic: "Gym Membership [A2]", contextEn: "Signing up for a local gym.", contextVi: "Đăng ký tập gym gần nhà.", player1En: "Inquire about opening hours.", player1Vi: "Hỏi về giờ mở cửa.", player2En: "Ask about locker facilities.", player2Vi: "Hỏi về tủ đồ cá nhân.", keyVocabulary: ["gym"] },
    { id: 'r_a2_15', topic: "Fixing a Broken Phone [A2]", contextEn: "Visiting a repair shop.", contextVi: "Đi đến cửa hàng sửa chữa.", player1En: "Explain phone screen crack.", player1Vi: "Giải thích màn hình bị nứt.", player2En: "Ask about repair duration.", player2Vi: "Hỏi thời gian sửa chữa.", keyVocabulary: ["repair"] },
    { id: 'r_a2_16', topic: "Choosing a Gift [A2]", contextEn: "Buying a wedding present.", contextVi: "Mua quà mừng cưới.", player1En: "Suggest kitchen appliances.", player1Vi: "Gợi ý đồ dùng nhà bếp.", player2En: "Suggest gift vouchers.", player2Vi: "Gợi ý phiếu quà tặng.", keyVocabulary: ["wedding"] },
    { id: 'r_a2_17', topic: "Hotel Check-in [A2]", contextEn: "Arriving at a seaside resort.", contextVi: "Nhận phòng tại resort bờ biển.", player1En: "Request a sea-view room.", player1Vi: "Yêu cầu phòng hướng biển.", player2En: "Ask for breakfast times.", player2Vi: "Hỏi giờ ăn sáng.", keyVocabulary: ["hotel"] },
    { id: 'r_a2_18', topic: "Cleaning the House [A2]", contextEn: "Dividing weekend chores.", contextVi: "Phân công việc nhà cuối tuần.", player1En: "Agree to vacuum floors.", player1Vi: "Nhận lau hút bụi sàn nhà.", player2En: "Agree to wash dishes.", player2Vi: "Nhận rửa bát đĩa.", keyVocabulary: ["chores"] },
    { id: 'r_a2_19', topic: "Learning English Online [A2]", contextEn: "Discussing learning apps.", contextVi: "Thảo luận ứng dụng học tập.", player1En: "Praise vocabulary flashcards.", player1Vi: "Khen flashcard từ vựng.", player2En: "Praise pronunciation tests.", player2Vi: "Khen phần kiểm tra phát âm.", keyVocabulary: ["learning"] },
    { id: 'r_a2_20', topic: "Borrowing a Book [A2]", contextEn: "Visiting the local library.", contextVi: "Đến thư viện địa phương.", player1En: "Ask for detective novels.", player1Vi: "Hỏi xin tiểu thuyết trinh thám.", player2En: "Ask about borrowing limits.", player2Vi: "Hỏi số lượng sách tối đa được mượn.", keyVocabulary: ["library"] }
  ],
  B1: [
    { id: 'r_b1_1', topic: "Environmental Protection [B1]", contextEn: "Debating plastic waste reduction.", contextVi: "Thảo luận về giảm rác thải nhựa.", player1En: "Propose banning single-use plastics.", player1Vi: "Đề xuất cấm nhựa dùng 1 lần.", player2En: "Discuss alternatives for local businesses.", player2Vi: "Thảo luận các giải pháp thay thế.", keyVocabulary: ["environment"] },
    { id: 'r_b1_2', topic: "Online Education [B1]", contextEn: "Evaluating virtual university courses.", contextVi: "Đánh giá khóa học đại học trực tuyến.", player1En: "Highlight flexible schedule benefits.", player1Vi: "Nêu lợi ích linh hoạt thời gian.", player2En: "Address lack of campus social interactions.", player2Vi: "Nói về thiếu tương tác trực tiếp.", keyVocabulary: ["education"] },
    { id: 'r_b1_3', topic: "Public Transport Funding [B1]", contextEn: "Debating city bus expansion.", contextVi: "Thảo luận mở rộng xe bus thành phố.", player1En: "Advocate for lowering bus fares.", player1Vi: "Ủng hộ giảm giá vé xe bus.", player2En: "Argue for investing in cleaner electric buses.", player2Vi: "Ủng hộ đầu tư xe bus điện.", keyVocabulary: ["transport"] },
    { id: 'r_b1_4', topic: "Social Media Detox [B1]", contextEn: "Discussing mental health benefits of taking a break from apps.", player1En: "Propose a 30-day social media ban.", player2En: "Suggest balanced daily time limits instead.", keyVocabulary: ["social media"] },
    { id: 'r_b1_5', topic: "Workplace Automation [B1]", contextEn: "Discussing AI tools in office environments.", player1En: "Emphasize increased work efficiency.", player2En: "Express concerns about job security.", keyVocabulary: ["automation"] },
    { id: 'r_b1_6', topic: "Tourism Expansion [B1]", contextEn: "Debating building resorts near protected forests.", player1En: "Argue for local economic boosting.", player2En: "Warn about wildlife habitat destruction.", keyVocabulary: ["tourism"] },
    { id: 'r_b1_7', topic: "Dietary Choices [B1]", contextEn: "Discussing plant-based diets.", player1En: "Promote health benefits of vegetarianism.", player2En: "Discuss balanced nutritional requirements.", keyVocabulary: ["diet"] },
    { id: 'r_b1_8', topic: "Urban Cycling Lanes [B1]", contextEn: "Planning dedicated bicycle paths.", player1En: "Advocate for reducing car space for bike lanes.", player2En: "Raise traffic safety concerns for commuters.", keyVocabulary: ["cycling"] },
    { id: 'r_b1_9', topic: "Cashless Economy [B1]", contextEn: "Transitioning fully to digital payments.", player1En: "Highlight transaction speed and convenience.", player2En: "Address privacy concerns for elderly citizens.", keyVocabulary: ["finance"] },
    { id: 'r_b1_10', topic: "Cultural Preservation [B1]", contextEn: "Funding local heritage museums.", player1En: "Argue for government subsidies.", player2En: "Suggest private corporate sponsorships.", keyVocabulary: ["culture"] },
    { id: 'r_b1_11', topic: "Flexible Working Hours [B1]", contextEn: "Debating mandatory 9-to-5 schedules.", player1En: "Advocate for employee schedule freedom.", player2En: "Emphasize team synchronization benefits.", keyVocabulary: ["work"] },
    { id: 'r_b1_12', topic: "Fast Fashion Ethics [B1]", contextEn: "Discussing affordable trendy clothing.", player1En: "Praise clothing affordability for students.", player2En: "Highlight textile waste environmental damage.", keyVocabulary: ["fashion"] },
    { id: 'r_b1_13', topic: "E-books vs Paper Books [B1]", contextEn: "Choosing reading media.", player1En: "Highlight e-reader portability.", player2En: "Praise paper book tactile reading experience.", keyVocabulary: ["reading"] },
    { id: 'r_b1_14', topic: "Pet Ownership Rules [B1]", contextEn: "Regulating pets in high-rise apartments.", player1En: "Advocate for tenant pet rights.", player2En: "Highlight noise and cleanliness rules.", keyVocabulary: ["housing"] },
    { id: 'r_b1_15', topic: "School Uniform Policies [B1]", contextEn: "Debating compulsory uniforms.", player1En: "Argue uniforms reduce social equality gaps.", player2En: "Argue uniforms stifle student self-expression.", keyVocabulary: ["school"] },
    { id: 'r_b1_16', topic: "Organic Food Prices [B1]", contextEn: "Evaluating organic grocery costs.", player1En: "Defend health benefits of pesticide-free food.", player2En: "Criticize high price barriers for low-income families.", keyVocabulary: ["food"] },
    { id: 'r_b1_17', topic: "Artificial Christmas Trees [B1]", contextEn: "Choosing holiday tree types.", player1En: "Advocate for reusable plastic trees.", player2En: "Support real tree pine fragrance tradition.", keyVocabulary: ["holidays"] },
    { id: 'r_b1_18', topic: "Urban Noise Pollution [B1]", contextEn: "Restricting night construction in residential areas.", player1En: "Demand strict quiet hours for sleep.", player2En: "Support fast infrastructure building timelines.", keyVocabulary: ["urban"] },
    { id: 'r_b1_19', topic: "Digital Streaming Services [B1]", contextEn: "Subscribing to multiple movie channels.", player1En: "Highlight content variety choices.", player2En: "Criticize rising monthly subscription costs.", keyVocabulary: ["media"] },
    { id: 'r_b1_20', topic: "Youth Volunteer Abroad [B1]", contextEn: "Gap year volunteering programs.", player1En: "Praise international cultural exposure.", player2En: "Question actual local community long-term impacts.", keyVocabulary: ["volunteering"] }
  ],
  B2: [
    { id: 'r_b2_1', topic: "Corporate AI Integration [B2]", contextEn: "Debating automated performance reviews.", player1En: "Argue for objective data-driven metrics.", player2En: "Highlight risks of algorithmic bias and empathy loss.", keyVocabulary: ["automation", "bias"] },
    { id: 'r_b2_2', topic: "Remote Work Policy [B2]", contextEn: "Evaluating corporate flexible work arrangements.", player1En: "Advocate for full remote flexibility.", player2En: "Argue for in-office team cohesion.", keyVocabulary: ["remote work", "policy"] },
    { id: 'r_b2_3', topic: "Genetic Engineering [B2]", contextEn: "Debating agricultural gene modification.", player1En: "Highlight crop yield improvements.", player2En: "Raise ecosystem impact concerns.", keyVocabulary: ["biotech"] },
    { id: 'r_b2_4', topic: "Smart City Surveillance [B2]", contextEn: "Deploying facial recognition cameras.", player1En: "Defend public safety enhancement.", player2En: "Critique civil liberty violations.", keyVocabulary: ["surveillance"] },
    { id: 'r_b2_5', topic: "Gig Economy Protections [B2]", contextEn: "Regulating freelance platform workers.", player1En: "Demand full labor benefits for drivers.", player2En: "Warn against destroying flexible working hours.", keyVocabulary: ["gig economy"] },
    { id: 'r_b2_6', topic: "Nuclear Energy Transition [B2]", contextEn: "Re-evaluating nuclear power plants.", player1En: "Argue for zero-emission energy reliability.", player2En: "Highlight radioactive waste storage hazards.", keyVocabulary: ["nuclear"] },
    { id: 'r_b2_7', topic: "Corporate Tax Havens [B2]", contextEn: "Closing international tax loopholes.", player1En: "Demand global minimum tax enforcement.", player2En: "Defend national tax competitiveness.", keyVocabulary: ["taxation"] },
    { id: 'r_b2_8', topic: "Space Exploration Ethics [B2]", contextEn: "Funding Mars colonization missions.", player1En: "Praise scientific technological breakthroughs.", player2En: "Argue for solving Earth poverty first.", keyVocabulary: ["space"] },
    { id: 'r_b2_9', topic: "Artificial Meat Commercialization [B2]", contextEn: "Introducing lab-grown meat to markets.", player1En: "Highlight reduced animal slaughter benefits.", player2En: "Address consumer safety skepticism.", keyVocabulary: ["food tech"] },
    { id: 'r_b2_10', topic: "Universal Basic Income [B2]", contextEn: "Implementing state-funded basic income.", player1En: "Argue for poverty elimination.", player2En: "Warn about inflation and work disincentives.", keyVocabulary: ["economics"] },
    { id: 'r_b2_11', topic: "Copyright in AI Art [B2]", contextEn: "Protecting human artists from generative AI models.", player1En: "Demand compensation royalties for training data.", player2En: "Defend open-source AI creative evolution.", keyVocabulary: ["copyright"] },
    { id: 'r_b2_12', topic: "Congestion Pricing in Metropolises [B2]", contextEn: "Charging fees to drive in city centers.", player1En: "Praise reduced gridlock and emission levels.", player2En: "Criticize unfair financial burden on suburban commuters.", keyVocabulary: ["urban"] },
    { id: 'r_b2_13', topic: "Biometric Data in Airports [B2]", contextEn: "Mandatory iris scans for international travel.", player1En: "Advocate for frictionless boarding speeds.", player2En: "Express deep concern over identity leak risks.", keyVocabulary: ["biometrics"] },
    { id: 'r_b2_14', topic: "Shorter Working Week [B2]", contextEn: "Transitioning to a 4-day workweek.", player1En: "Cite increased productivity and well-being.", player2En: "Warn about operational strain on small businesses.", keyVocabulary: ["labor"] },
    { id: 'r_b2_15', topic: "Influencer Marketing Disclosures [B2]", contextEn: "Enforcing strict sponsorship labeling.", player1En: "Protect consumers from deceptive advertising.", player2En: "Argue against heavy-handed social media regulation.", keyVocabulary: ["marketing"] },
    { id: 'r_b2_16', topic: "Crypto Asset Regulation [B2]", contextEn: "Government oversight of decentralized finance.", player1En: "Protect investors from speculative fraud.", player2En: "Defend decentralized permissionless innovation.", keyVocabulary: ["fintech"] },
    { id: 'r_b2_17', topic: "Deep Sea Mining [B2]", contextEn: "Extracting rare minerals from ocean floors.", player1En: "Highlight green energy battery component needs.", player2En: "Warn about irreversible marine ecosystem collapse.", keyVocabulary: ["mining"] },
    { id: 'r_b2_18', topic: "Right to Disconnect Laws [B2]", contextEn: "Banning off-hours work emails.", player1En: "Protect employee mental health boundaries.", player2En: "Argue against stifling global team agility.", keyVocabulary: ["labor law"] },
    { id: 'r_b2_19', topic: "Microplastic Filters [B2]", contextEn: "Mandating washing machine microfiber traps.", player1En: "Prevent microplastic ocean contamination.", player2En: "Object to increased appliance manufacturing costs.", keyVocabulary: ["environment"] },
    { id: 'r_b2_20', topic: "Autonomous Delivery Drones [B2]", contextEn: "Deploying drone fleets in residential skies.", player1En: "Highlight zero-emission rapid delivery gains.", player2En: "Raise noise pollution and air space privacy fears.", keyVocabulary: ["drones"] }
  ],
  C1: [
    { id: 'r_c1_1', topic: "Predictive Policing & Rights [C1]", contextEn: "Analyzing state-sponsored predictive crime detection models.", player1En: "Defend automated surveillance for crime reduction.", player2En: "Critique racial biases in training data.", keyVocabulary: ["surveillance", "civil liberties"] },
    { id: 'r_c1_2', topic: "Central Bank Digital Currencies [C1]", contextEn: "Replacing physical fiat currency with CBDCs.", player1En: "Highlight monetary policy efficiency.", player2En: "Warn against state financial surveillance.", keyVocabulary: ["CBDC", "finance"] },
    { id: 'r_c1_3', topic: "Deepfake Regulation [C1]", contextEn: "Legislating generative AI media manipulation.", player1En: "Propose strict watermarking mandates.", player2En: "Warn against curbing open-source software.", keyVocabulary: ["AI ethics"] },
    { id: 'r_c1_4', topic: "Pharma Patent Waivers [C1]", contextEn: "Waiving vaccine patents in developing nations.", player1En: "Advocate for global health equity.", player2En: "Protect R&D financial incentives.", keyVocabulary: ["pharmaceuticals"] },
    { id: 'r_c1_5', topic: "Geoengineering Climate Interventions [C1]", contextEn: "Solar radiation management via stratospheric aerosols.", player1En: "Defend emergency temperature cooling.", player2En: "Highlight unpredictable disruption risks.", keyVocabulary: ["geoengineering"] },
    { id: 'r_c1_6', topic: "Autonomous Weapon Systems [C1]", contextEn: "Banning AI lethal autonomous weapons.", player1En: "Demand international outlawing of AI warfare.", player2En: "Argue for deterrence maintenance.", keyVocabulary: ["military AI"] },
    { id: 'r_c1_7', topic: "Algorithmic Monopolies [C1]", contextEn: "Breaking up tech conglomerates.", player1En: "Enforce strict antitrust breakups.", player2En: "Defend market-driven technological scale.", keyVocabulary: ["antitrust"] },
    { id: 'r_c1_8', topic: "Demographic Collapse Mitigation [C1]", contextEn: "Addressing falling fertility rates.", player1En: "Propose massive state parental subsidies.", player2En: "Advocate for expanded skilled immigration.", keyVocabulary: ["demographics"] },
    { id: 'r_c1_9', topic: "Water Commodification [C1]", contextEn: "Trading fresh water futures on exchanges.", player1En: "Argue for efficient resource allocation.", player2En: "Denounce turning fundamental human rights into assets.", keyVocabulary: ["water rights"] },
    { id: 'r_c1_10', topic: "Neurotechnology Regulation [C1]", contextEn: "Brain-computer interface privacy rights.", player1En: "Enact strict cognitive liberty laws.", player2En: "Promote medical neural research.", keyVocabulary: ["neurotech"] },
    { id: 'r_c1_11', topic: "Algorithmic High-Frequency Trading [C1]", contextEn: "Regulating automated flash-crash risks.", player1En: "Mandate algorithmic speed delays.", player2En: "Defend market liquidity provisions.", keyVocabulary: ["algorithmic trading"] },
    { id: 'r_c1_12', topic: "Corporate Carbon Offsetting [C1]", contextEn: "Auditing greenwashing claims in voluntary carbon markets.", player1En: "Demand strict satellite-verified additionality.", player2En: "Defend corporate voluntary sustainability funding.", keyVocabulary: ["carbon tax"] },
    { id: 'r_c1_13', topic: "Digital Media Echo Chambers [C1]", contextEn: "Regulating engagement-driven recommendation engines.", player1En: "Impose algorithmic neutrality mandates.", player2En: "Warn against state censorship over reach.", keyVocabulary: ["epistemology"] },
    { id: 'r_c1_14', topic: "Transboundary River Basin Disputes [C1]", contextEn: "Managing dam building on international rivers.", player1En: "Assert upstream sovereign hydro-power rights.", player2En: "Demand downstream ecological flow protections.", keyVocabulary: ["water rights"] },
    { id: 'r_c1_15', topic: "CRISPR Gene Editing Ethics [C1]", contextEn: "Commercializing germline genetic modifications.", player1En: "Promote elimination of hereditary diseases.", player2En: "Warn against dystopian genetic class stratification.", keyVocabulary: ["gene editing"] },
    { id: 'r_c1_16', topic: "Subsea Cable Cybersecurity [C1]", contextEn: "Protecting global internet backbone infrastructure.", player1En: "Advocate for international naval patrol mandates.", player2En: "Warn against militarizing international waters.", keyVocabulary: ["cybersecurity"] },
    { id: 'r_c1_17', topic: "Corporate AI Liability [C1]", contextEn: "Assigning legal blame for autonomous AI damages.", player1En: "Hold software developers strictly liable.", player2En: "Establish corporate liability insurance caps.", keyVocabulary: ["jurisprudence"] },
    { id: 'r_c1_18', topic: "Multipolar Reserve Currencies [C1]", contextEn: "Diversifying away from US Dollar hegemony.", player1En: "Champion sovereign currency clearing systems.", player2En: "Warn against global trade fragmentation.", keyVocabulary: ["monetary policy"] },
    { id: 'r_c1_19', topic: "Platform Worker Re-classification [C1]", contextEn: "Mandating full employment status for gig workers.", player1En: "Enforce universal labor protection safety nets.", player2En: "Protect flexible decentralized working models.", keyVocabulary: ["labor law"] },
    { id: 'r_c1_20', topic: "Space Debris Removal Treaties [C1]", contextEn: "Clearing orbital space trash.", player1En: "Establish binding international cleanup quotas.", player2En: "Defend private satellite operator autonomy.", keyVocabulary: ["aerospace"] }
  ],
  C2: [
    { id: 'r_c2_1', topic: "Supranational Judicial Autonomy [C2]", contextEn: "Deconstructing legal conflicts between international tribunals and state sovereignty.", player1En: "Argue for binding human rights decrees.", player2En: "Assert constitutional sovereignty against overreach.", keyVocabulary: ["jurisprudence", "sovereignty"] },
    { id: 'r_c2_2', topic: "Ontological Status of Synthetic Life [C2]", contextEn: "Legal personhood for fully synthetic biological entities.", player1En: "Argue for moral consideration.", player2En: "Reject granting human rights to engineered code.", keyVocabulary: ["ontology", "bioethics"] },
    { id: 'r_c2_3', topic: "Thermodynamic Computational Limits [C2]", contextEn: "Energy ceilings of planet-scale AI infrastructure.", player1En: "Advocate for hard energy caps on data centers.", player2En: "Defend technological growth demands.", keyVocabulary: ["thermodynamics"] },
    { id: 'r_c2_4', topic: "Post-Capitalist Resource Distribution [C2]", contextEn: "Deconstructing algorithmic resource allocation models.", player1En: "Champion post-market automated distribution.", player2En: "Expose systemic central planning flaws.", keyVocabulary: ["post-capitalism"] },
    { id: 'r_c2_5', topic: "Epistemic Crisis in Generative Media [C2]", contextEn: "Erosion of objective reality in digital archives.", player1En: "Propose cryptographic verification frameworks.", player2En: "Critique centralized truth authorities.", keyVocabulary: ["epistemology"] },
    { id: 'r_c2_6', topic: "Extraterritorial Environmental Jurisdiction [C2]", contextEn: "Prosecuting ecocide across national boundaries.", player1En: "Demand universal international prosecution.", player2En: "Assert national jurisdictional limits.", keyVocabulary: ["ecocide"] },
    { id: 'r_c2_7', topic: "De-Dollarization & Multipolar Finance [C2]", contextEn: "Shift away from reserve currency dominance.", player1En: "Champion sovereign monetary diversification.", player2En: "Warn about global market fragmentation.", keyVocabulary: ["monetary policy"] },
    { id: 'r_c2_8', topic: "Quantum Encryption Paradigm Shift [C2]", contextEn: "Post-quantum cryptography mandates.", player1En: "Enforce immediate state transition.", player2En: "Highlight economic infrastructure costs.", keyVocabulary: ["quantum"] },
    { id: 'r_c2_9', topic: "Transhumanist Enhancement Equity [C2]", contextEn: "Biomechanical augmentation disparities.", player1En: "Mandate equal access guarantees.", player2En: "Protect private technological investment.", keyVocabulary: ["transhumanism"] },
    { id: 'r_c2_10', topic: "Systemic Multilateral Decay [C2]", contextEn: "Restructuring veto power in global institutions.", player1En: "Abolish unilateral veto mechanisms.", player2En: "Defend sovereign power balance equilibrium.", keyVocabulary: ["multilateralism"] },
    { id: 'r_c2_11', topic: "Thermodynamic Air Capture Limits [C2]", contextEn: "Assessing physical energy scaling of DAC infrastructure.", player1En: "Critique physical thermodynamic viability.", player2En: "Defend urgent technological carbon removal necessity.", keyVocabulary: ["thermodynamics"] },
    { id: 'r_c2_12', topic: "Algorithmic Market Collusion Jurisprudence [C2]", contextEn: "Assigning legal liability to self-learning pricing algorithms.", player1En: "Prosecute algorithmic tacit collusion strictly.", player2En: "Reject liability without explicit human intent.", keyVocabulary: ["jurisprudence"] },
    { id: 'r_c2_13', topic: "Synthetic Biology Bioremediation Personhood [C2]", contextEn: "Legal status of artificial organisms deployed for ocean cleanup.", player1En: "Grant limited environmental stewardship rights.", player2En: "Classify entities strictly as industrial instruments.", keyVocabulary: ["bioethics"] },
    { id: 'r_c2_14', topic: "De-territorialized Sovereign Digital Identity [C2]", contextEn: "Decoupling citizenship from geographic physical borders.", player1En: "Praise global digital residency autonomy.", player2En: "Warn against subverting democratic nation-state foundations.", keyVocabulary: ["sovereignty"] },
    { id: 'r_c2_15', topic: "Techno-Solutionism vs Systemic Ecological Reform [C2]", contextEn: "Evaluating technological climate fixes against consumption degrowth.", player1En: "Expose techno-solutionist moral hazards.", player2En: "Champion technological innovation for ecological survival.", keyVocabulary: ["techno-solutionism"] },
    { id: 'r_c2_16', topic: "Post-Human Agency in Autonomous Warfare [C2]", contextEn: "Ethical frameworks for fully autonomous neural military networks.", player1En: "Demand absolute human-in-the-loop kill-switch mandates.", player2En: "Argue for superior algorithmic precision compliance.", keyVocabulary: ["military AI"] },
    { id: 'r_c2_17', topic: "WTO Carbon Border Adjustment Conflicts [C2]", contextEn: "Litigating unilateral carbon tariffs under free trade rules.", player1En: "Defend extraterritorial climate protection mandates.", player2En: "Denounce protectionist trade discrimination against developing economies.", keyVocabulary: ["WTO"] },
    { id: 'r_c2_18', topic: "Epistemological Validity of Synthetic Training Data [C2]", contextEn: "Relying on AI-generated data for frontier model alignment.", player1En: "Warn against recursive model collapse and bias amplification.", player2En: "Defend synthetic data necessity for superintelligence scaling.", keyVocabulary: ["synthetic data"] },
    { id: 'r_c2_19', topic: "Fiat Credit Expansion within Finite Bio-spheres [C2]", contextEn: "Deconstructing infinite debt creation models against finite planetary boundaries.", player1En: "Expose fundamental thermodynamic contradictions of perpetual growth.", player2En: "Defend credit market adaptability through technological efficiency gains.", keyVocabulary: ["monetary theory"] },
    { id: 'r_c2_20', topic: "Neurotelemetry Data Commercialization Limits [C2]", contextEn: "Commercial harvesting of subconscious brainwave telemetry.", player1En: "Demand absolute neural privacy fundamental rights.", player2En: "Support opt-in commercialization for medical innovation funding.", keyVocabulary: ["neurotech"] }
  ]
};

// ⚡ LẤY NGAY 1 ĐỀ LOCAL KHÔNG TRÙNG (0.01s)
export function getInstantRelayChallenge(cefrLevel: string = 'A1'): RelayChallenge {
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const pool = LOCAL_RELAY_POOL[levelKey] || LOCAL_RELAY_POOL['A1'];
  
  const filtered = pool.filter(item => !sessionUsedRelayTexts.has(item.topic.toLowerCase()));
  const selected = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : pool[Math.floor(Math.random() * pool.length)];
  
  sessionUsedRelayTexts.add(selected.topic.toLowerCase());
  return { ...selected, id: `instant_relay_${Date.now()}_${Math.random()}` };
}

// ⚡ GỌI GROQ AI NGẦM ĐỂ CẬP NHẬT ĐỀ CHI TIẾT
export async function generateRelayChallenge(cefrLevel: string = 'A1'): Promise<RelayChallenge> {
  const uniqueSeed = `relay_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedRelayTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Test Designer. Generate ONE 2-Player Relay Challenge STRICTLY for Level ${levelKey}.
STRICT RULES:
${isLowLevel 
  ? `- Must be simple/intermediate. Include BOTH English AND Vietnamese fields (contextVi, player1Vi, player2Vi).` 
  : `- MUST be highly complex debate/scenario for ${levelKey}. 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE ANY VIETNAMESE (Vi) FIELDS.`
}
Return ONLY valid JSON matching:
{
  "topic": "Topic Title [${levelKey}]",
  "contextEn": "English context",
  ${isLowLevel ? '"contextVi": "Bản dịch bối cảnh tiếng Việt",' : ''}
  "player1En": "P1 English guideline",
  ${isLowLevel ? '"player1Vi": "P1 bản dịch tiếng Việt",' : ''}
  "player2En": "P2 English guideline",
  ${isLowLevel ? '"player2Vi": "P2 bản dịch tiếng Việt",' : ''}
  "keyVocabulary": ["word1", "word2"]
}`;

  try {
    const apiCall = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a BRAND NEW Relay Challenge for CEFR [${levelKey}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList || 'None'}]` }
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
    const topicText = parsed.topic || `Relay Challenge [${levelKey}]`;

    sessionUsedRelayTexts.add(topicText.toLowerCase());

    return {
      id: uniqueSeed,
      topic: topicText,
      contextEn: parsed.contextEn || `Context for ${levelKey}`,
      contextVi: isLowLevel ? parsed.contextVi : undefined,
      player1En: parsed.player1En || "State your perspective",
      player1Vi: isLowLevel ? parsed.player1Vi : undefined,
      player2En: parsed.player2En || "Rebut or expand",
      player2Vi: isLowLevel ? parsed.player2Vi : undefined,
      keyVocabulary: parsed.keyVocabulary || ["debate"]
    };
  } catch (error) {
    return getInstantRelayChallenge(cefrLevel);
  }
}