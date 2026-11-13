// src/data/station2/roleplay.ts
import { Station2ScenarioItem } from './solo';

export interface RoleplayScenarioItem extends Station2ScenarioItem {
  userRoleVi: string;
  aiRoleVi: string;
}

export const ROLEPLAY_SCENARIOS: RoleplayScenarioItem[] = [
  // =========================================================================
  // LEVEL A1 (10 TÌNH HUỐNG NHẬP VAI)
  // =========================================================================
  {
    id: 'rp_a1_01',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Khách du lịch',
    aiRoleVi: 'Lễ tân khách sạn',
    title: 'Nhận phòng tại quầy lễ tân khách sạn',
    contextVi: 'Bạn đã đặt trước một phòng đơn qua mạng và đang làm thủ tục nhận phòng tại quầy lễ tân.',
    promptEn: 'Receptionist: "Good evening, welcome to Sunrise Hotel! Do you have a reservation with us tonight?"',
    sampleAnswerEn: 'Good evening! Yes, I have a reservation for a single room under the name Tran Hoang. Here is my passport.',
    keywords: ['reservation', 'single room', 'under the name', 'passport']
  },
  {
    id: 'rp_a1_02',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Thực khách',
    aiRoleVi: 'Nhân viên phục vụ nhà hàng',
    title: 'Gọi món ăn tại nhà hàng',
    contextVi: 'Bạn đang cầm thực đơn tại nhà hàng và gọi món chính cùng đồ uống.',
    promptEn: 'Waiter: "Hello! Are you ready to order, or do you need a few more minutes?"',
    sampleAnswerEn: 'Hi! I am ready to order. I would like grilled chicken with rice and a glass of fresh orange juice, please.',
    keywords: ['ready to order', 'grilled chicken', 'orange juice', 'please']
  },
  {
    id: 'rp_a1_03',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Khách mua vé',
    aiRoleVi: 'Nhân viên ga tàu hỏa',
    title: 'Mua vé tàu đi du lịch',
    contextVi: 'Bạn đang ở quầy bán vé ga tàu và muốn mua vé khứ hồi đi Đà Nẵng.',
    promptEn: 'Ticket Clerk: "Good morning! Where are you traveling to today, and do you want a one-way or return ticket?"',
    sampleAnswerEn: 'Good morning! I am traveling to Da Nang. I would like one return ticket for the 9 AM train, please.',
    keywords: ['traveling to', 'return ticket', 'train', 'please']
  },
  {
    id: 'rp_a1_04',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Sinh viên',
    aiRoleVi: 'Thủ thư thư viện',
    title: 'Mượn sách tại thư viện trường',
    contextVi: 'Bạn mang hai cuốn giáo trình ra quầy để làm thủ tục mượn về nhà.',
    promptEn: 'Librarian: "Hi there! Would you like to borrow these two books? May I see your student ID card?"',
    sampleAnswerEn: 'Yes, please! Here is my student ID card. How many days can I keep these books?',
    keywords: ['student ID card', 'borrow', 'how many days', 'books']
  },
  {
    id: 'rp_a1_05',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Khách hàng',
    aiRoleVi: 'Nhân viên cửa hàng quần áo',
    title: 'Hỏi tìm áo phông theo màu và kích cỡ',
    contextVi: 'Bạn đang tìm mua một chiếc áo phông màu xanh cỡ M.',
    promptEn: 'Shop Assistant: "Welcome to our store! Are you looking for anything special today?"',
    sampleAnswerEn: 'Hello! I am looking for a blue T-shirt in size medium. Do you have it in stock?',
    keywords: ['looking for', 'T-shirt', 'size medium', 'in stock']
  },
  {
    id: 'rp_a1_06',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Người đi đường',
    aiRoleVi: 'Người dân địa phương',
    title: 'Hỏi đường đến siêu thị gần nhất',
    contextVi: 'Bạn đang đi bộ trên phố và muốn tìm siêu thị gần nhất.',
    promptEn: 'Local Resident: "Excuse me, you look like you need help. Where are you trying to go?"',
    sampleAnswerEn: 'Hi! Excuse me, is there a supermarket near here? How can I walk there?',
    keywords: ['excuse me', 'supermarket', 'near here', 'walk']
  },
  {
    id: 'rp_a1_07',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Bệnh nhân',
    aiRoleVi: 'Dược sĩ nhà thuốc',
    title: 'Mua thuốc cảm cúm tại hiệu thuốc',
    contextVi: 'Bạn bị đau đầu và sổ mũi nhẹ nên ghé nhà thuốc mua thuốc.',
    promptEn: 'Pharmacist: "Good afternoon! How can I help you today? Are you feeling unwell?"',
    sampleAnswerEn: 'Good afternoon. I have a headache and a runny nose. Can you give me some medicine for a cold?',
    keywords: ['headache', 'runny nose', 'medicine', 'cold']
  },
  {
    id: 'rp_a1_08',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Hành khách',
    aiRoleVi: 'Tài xế taxi',
    title: 'Bắt taxi ra sân bay',
    contextVi: 'Bạn vừa lên xe taxi và báo điểm đến cùng lời nhắc về giờ bay.',
    promptEn: 'Taxi Driver: "Good morning! Where are we heading to today?"',
    sampleAnswerEn: 'Good morning! Please take me to Tan Son Nhat Airport, Domestic Terminal. My flight is at 10 AM.',
    keywords: ['airport', 'terminal', 'flight', 'please']
  },
  {
    id: 'rp_a1_09',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Sinh viên mới',
    aiRoleVi: 'Bạn cùng phòng ký túc xá',
    title: 'Làm quen với bạn cùng phòng mới',
    contextVi: 'Ngày đầu tiên bạn chuyển vào phòng ký túc xá và chào hỏi bạn cùng phòng.',
    promptEn: 'Roommate: "Hey! You must be my new roommate. Welcome! Which bed would you like to take?"',
    sampleAnswerEn: 'Hi! Nice to meet you! My name is Nam. I would like to take the bed near the window, if that is okay with you.',
    keywords: ['nice to meet you', 'roommate', 'near the window', 'okay']
  },
  {
    id: 'rp_a1_10',
    tier: 'ROLEPLAY',
    level: 'A1',
    userRoleVi: 'Khách hàng',
    aiRoleVi: 'Thu ngân siêu thị',
    title: 'Thanh toán tại quầy thu ngân',
    contextVi: 'Bạn đã chọn xong đồ và muốn thanh toán bằng thẻ hoặc mã QR.',
    promptEn: 'Cashier: "That will be 150,000 dong in total. Would you like a plastic bag, and how would you like to pay?"',
    sampleAnswerEn: 'No bag, thank you, I brought my own bag. Can I pay by QR code or credit card?',
    keywords: ['own bag', 'thank you', 'pay by', 'card']
  },

  // =========================================================================
  // LEVEL A2 (10 TÌNH HUỐNG NHẬP VAI)
  // =========================================================================
  {
    id: 'rp_a2_01',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Khách hàng',
    aiRoleVi: 'Nhân viên cửa hàng thời trang',
    title: 'Đổi trả áo bị nhầm kích cỡ tại cửa hàng',
    contextVi: 'Bạn mua chiếc áo khoác hôm qua nhưng mặc hơi chật và muốn đổi sang cỡ lớn hơn.',
    promptEn: 'Shop Assistant: "Hi there! How can I help you with your purchase today?"',
    sampleAnswerEn: 'Hi, I bought this jacket yesterday, but it is a bit too tight. Could I exchange it for a larger size, please? I have the receipt here.',
    keywords: ['bought', 'too tight', 'exchange', 'larger size', 'receipt']
  },
  {
    id: 'rp_a2_02',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Bệnh nhân',
    aiRoleVi: 'Lễ tân phòng khám nha khoa',
    title: 'Đặt lịch hẹn khám răng qua điện thoại',
    contextVi: 'Bạn bị đau răng hàm và muốn đặt lịch khám vào chiều thứ Tư.',
    promptEn: 'Dental Receptionist: "Bright Smile Dental Clinic, how may I help you?"',
    sampleAnswerEn: 'Hello, I have had a toothache since yesterday. Could I make an appointment with the dentist for this Wednesday afternoon?',
    keywords: ['toothache', 'make an appointment', 'dentist', 'Wednesday afternoon']
  },
  {
    id: 'rp_a2_03',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Khách thuê trọ',
    aiRoleVi: 'Chủ nhà trọ',
    title: 'Báo hỏng máy điều hòa trong phòng trọ',
    contextVi: 'Máy điều hòa trong phòng bạn không làm mát từ tối qua và bạn nhờ chủ nhà gọi thợ sửa.',
    promptEn: 'Landlord: "Hi, you texted me earlier about an issue in your room. What seems to be broken?"',
    sampleAnswerEn: 'Hi! The air conditioner in my room stopped cooling last night and is making a strange noise. Could you send someone to fix it today?',
    keywords: ['air conditioner', 'stopped cooling', 'strange noise', 'fix it']
  },
  {
    id: 'rp_a2_04',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Hành khách sân bay',
    aiRoleVi: 'Nhân viên quầy làm thủ tục (Check-in)',
    title: 'Làm thủ tục ký gửi hành lý tại sân bay',
    contextVi: 'Bạn đang làm thủ tục bay và muốn chọn ghế ngồi cạnh cửa sổ.',
    promptEn: 'Check-in Agent: "Good morning! May I see your passport and booking confirmation? Are you checking any bags today?"',
    sampleAnswerEn: 'Good morning! Here are my passport and ticket. I have one suitcase to check in, and could I get a window seat if available?',
    keywords: ['passport', 'suitcase', 'check in', 'window seat']
  },
  {
    id: 'rp_a2_05',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Học viên',
    aiRoleVi: 'Tư vấn viên trung tâm thể hình (Gym)',
    title: 'Hỏi thông tin gói tập Gym cho sinh viên',
    contextVi: 'Bạn muốn đăng ký tập Gym 3 tháng và hỏi xem có ưu đãi cho sinh viên không.',
    promptEn: 'Gym Consultant: "Welcome to FitLife Gym! Are you interested in joining our fitness club?"',
    sampleAnswerEn: 'Hi! Yes, I want to join for three months. How much is the membership fee, and do you offer any student discounts?',
    keywords: ['three months', 'membership fee', 'student discounts', 'offer']
  },
  {
    id: 'rp_a2_06',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Thực khách',
    aiRoleVi: 'Quản lý nhà hàng',
    title: 'Báo nhầm món ăn được mang ra bàn',
    contextVi: 'Nhân viên mang nhầm món mì cay thay vì mì không cay bạn đã gọi.',
    promptEn: 'Restaurant Manager: "Excuse me, is everything alright with your meal?"',
    sampleAnswerEn: 'Excuse me, I ordered the non-spicy noodles, but this dish is very spicy. Could you please replace it with the right order?',
    keywords: ['ordered', 'non-spicy', 'replace', 'right order']
  },
  {
    id: 'rp_a2_07',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Sinh viên',
    aiRoleVi: 'Cố vấn học tập',
    title: 'Xin tư vấn đăng ký môn học tự chọn',
    contextVi: 'Bạn phân vân giữa lớp Kỹ năng Thuyết trình và lớp Tiếng Anh Thương mại.',
    promptEn: 'Academic Advisor: "Come in! Which elective courses are you thinking about registering for next semester?"',
    sampleAnswerEn: 'Hello! I am deciding between Public Speaking and Business English. Which course would be more useful for a marketing student?',
    keywords: ['deciding between', 'elective', 'useful', 'semester']
  },
  {
    id: 'rp_a2_08',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Khách hàng',
    aiRoleVi: 'Nhân viên tiệm sửa điện thoại',
    title: 'Hỏi chi phí thay pin điện thoại',
    contextVi: 'Điện thoại của bạn tụt pin rất nhanh và bạn mang ra tiệm kiểm tra.',
    promptEn: 'Technician: "Hi! What seems to be the problem with your smartphone today?"',
    sampleAnswerEn: 'My phone battery runs out in just two hours. How much does it cost to replace the battery, and how long will it take?',
    keywords: ['battery', 'runs out', 'how much', 'how long']
  },
  {
    id: 'rp_a2_09',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Du khách',
    aiRoleVi: 'Hướng dẫn viên bảo tàng',
    title: 'Hỏi quy định chụp ảnh và giờ đóng cửa bảo tàng',
    contextVi: 'Bạn vừa mua vé vào tham quan bảo tàng lịch sử.',
    promptEn: 'Museum Guide: "Welcome to the National History Museum! Do you have any questions before you start your tour?"',
    sampleAnswerEn: 'Thank you! Are we allowed to take photos inside the exhibition halls, and what time does the museum close today?',
    keywords: ['allowed', 'take photos', 'inside', 'close']
  },
  {
    id: 'rp_a2_10',
    tier: 'ROLEPLAY',
    level: 'A2',
    userRoleVi: 'Bạn cùng nhóm',
    aiRoleVi: 'Trưởng nhóm thuyết trình',
    title: 'Nhận phần việc chuẩn bị slide thuyết trình',
    contextVi: 'Nhóm đang chia việc cho bài thuyết trình thứ Sáu tuần sau.',
    promptEn: 'Group Leader: "We need to finish our slides by Wednesday night. Which part of the presentation would you like to prepare?"',
    sampleAnswerEn: 'I can prepare the introduction and design the slides. If you send me your notes by Tuesday, I will put everything together.',
    keywords: ['prepare', 'design', 'by Tuesday', 'together']
  },

  // =========================================================================
  // LEVEL B1 (10 TÌNH HUỐNG NHẬP VAI)
  // =========================================================================
  {
    id: 'rp_b1_01',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Ứng viên thực tập',
    aiRoleVi: 'Nhà tuyển dụng (HR)',
    title: 'Phỏng vấn xin thực tập vị trí Trợ lý Dự án',
    contextVi: 'Nhà tuyển dụng muốn biết cách bạn xử lý khi nhóm gặp hạn chót gấp gáp.',
    promptEn: 'Interviewer: "We work in fast-paced teams here. Could you tell me about a time you helped your team overcome a tight deadline?"',
    sampleAnswerEn: 'During our final marketing project, one member fell sick, so I reorganized our task list and took over the data slides to ensure we submitted on time.',
    keywords: ['deadline', 'reorganized', 'took over', 'on time']
  },
  {
    id: 'rp_b1_02',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Khách hàng',
    aiRoleVi: 'Nhân viên ngân hàng',
    title: 'Báo khóa thẻ ATM bị mất và yêu cầu cấp lại',
    contextVi: 'Bạn vừa phát hiện ví bị rơi mất kèm thẻ ngân hàng và cần khóa thẻ khẩn cấp.',
    promptEn: 'Bank Officer: "Good afternoon, National Bank Customer Support. How can I assist you today?"',
    sampleAnswerEn: 'Good afternoon! I just lost my wallet containing my debit card. Could you block the card immediately to prevent unauthorized transactions and issue a replacement?',
    keywords: ['lost my wallet', 'block', 'immediately', 'replacement']
  },
  {
    id: 'rp_b1_03',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Trưởng ban tổ chức CLB',
    aiRoleVi: 'Quản lý hội trường trường đại học',
    title: 'Đặt mượn hội trường tổ chức hội thảo sinh viên',
    contextVi: 'Bạn cần mượn hội trường 200 chỗ vào sáng thứ Bảy tuần tới và hỏi về thiết bị âm thanh.',
    promptEn: 'Facility Manager: "Hello! I received your event request form. What setup and equipment will your club require for Saturday’s seminar?"',
    sampleAnswerEn: 'Thank you for reviewing our form. We will need two wireless microphones, a projector, and permission to set up our registration desk outside the hall at 7:30 AM.',
    keywords: ['microphones', 'projector', 'permission', 'registration desk']
  },
  {
    id: 'rp_b1_04',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Khách du lịch',
    aiRoleVi: 'Nhân viên quầy hành lý thất lạc sân bay',
    title: 'Khai báo hành lý ký gửi bị thất lạc',
    contextVi: 'Bạn vừa hạ cánh nhưng không thấy vali của mình trên băng chuyền.',
    promptEn: 'Baggage Claim Agent: "I’m sorry to hear your luggage didn’t arrive on the carousel. Could you describe your bag and provide your flight tag?"',
    sampleAnswerEn: 'Here is my baggage claim tag. It is a medium navy-blue hard-shell suitcase with a yellow ribbon tied to the handle. Will it be delivered to my hotel once found?',
    keywords: ['claim tag', 'suitcase', 'handle', 'delivered']
  },
  {
    id: 'rp_b1_05',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Nhân viên mới',
    aiRoleVi: 'Quản lý trực tiếp',
    title: 'Xin nghỉ phép 2 ngày vì việc gia đình',
    contextVi: 'Bạn cần xin nghỉ phép vào thứ Năm và thứ Sáu tuần sau để dự đám cưới anh trai và cam kết bàn giao việc.',
    promptEn: 'Manager: "Hi! You mentioned wanting to discuss next week’s schedule. What’s on your mind?"',
    sampleAnswerEn: 'Hi! I would like to request two days of leave next Thursday and Friday to attend my brother’s wedding. I will finish all my weekly reports by Wednesday and ask Linh to cover urgent emails.',
    keywords: ['request', 'leave', 'finish', 'cover']
  },
  {
    id: 'rp_b1_06',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Khách thuê căn hộ',
    aiRoleVi: 'Môi giới bất động sản',
    title: 'Thương lượng giá thuê và tiền đặt cọc căn hộ',
    contextVi: 'Bạn vừa xem xong căn hộ gần trường và muốn hỏi giảm nhẹ giá thuê nếu ký hợp đồng 1 năm.',
    promptEn: 'Real Estate Agent: "So, what do you think of the apartment? As you can see, it is fully furnished and only ten minutes from your campus."',
    sampleAnswerEn: 'The apartment is in a great location. If I sign a twelve-month lease today, would the owner consider lowering the monthly rent slightly or including the internet fee?',
    keywords: ['location', 'twelve-month lease', 'consider', 'including']
  },
  {
    id: 'rp_b1_07',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Sinh viên',
    aiRoleVi: 'Giảng viên hướng dẫn',
    title: 'Nhờ giảng viên góp ý đề cương khóa luận tốt nghiệp',
    contextVi: 'Bạn đến gặp giảng viên trong giờ tiếp sinh viên để xin nhận xét về phạm vi đề tài nghiên cứu.',
    promptEn: 'Professor: "I read through your thesis outline yesterday. Your topic is timely, though the scope seems a bit broad. How do you plan to narrow it down?"',
    sampleAnswerEn: 'Thank you for the feedback, Professor. Instead of surveying all universities nationwide, I plan to focus specifically on third-year students in Ho Chi Minh City.',
    keywords: ['feedback', 'instead of', 'focus specifically', 'survey']
  },
  {
    id: 'rp_b1_08',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Khách hàng',
    aiRoleVi: 'Nhân viên hỗ trợ kỹ thuật Internet',
    title: 'Báo sự cố mất kết nối Wi-Fi tại nhà',
    contextVi: 'Mạng Wi-Fi nhà bạn bị mất kết nối từ sáng nay dù đã khởi động lại modem.',
    promptEn: 'Tech Support: "Thank you for calling FiberNet Support. Have you already tried restarting your router?"',
    sampleAnswerEn: 'Yes, I unplugged the router for five minutes and restarted it, but the red internet light is still blinking. Could you check the line or send a technician tomorrow morning?',
    keywords: ['restarted', 'blinking', 'check the line', 'technician']
  },
  {
    id: 'rp_b1_09',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Tình nguyện viên',
    aiRoleVi: 'Điều phối viên chương trình trao đổi sinh viên',
    title: 'Đăng ký làm bạn đồng hành (Buddy) cho sinh viên quốc tế',
    contextVi: 'Bạn phỏng vấn đăng ký hỗ trợ sinh viên quốc tế mới sang Việt Nam học tập.',
    promptEn: 'Coordinator: "Why do you want to become a student buddy for our incoming exchange students this semester?"',
    sampleAnswerEn: 'I want to help international students feel at home in Vietnam, show them local culture, and also improve my cross-cultural communication skills.',
    keywords: ['feel at home', 'local culture', 'cross-cultural', 'improve']
  },
  {
    id: 'rp_b1_10',
    tier: 'ROLEPLAY',
    level: 'B1',
    userRoleVi: 'Khách hàng',
    aiRoleVi: 'Nhân viên lễ tân khách sạn',
    title: 'Yêu cầu đổi phòng do tiếng ồn bên ngoài',
    contextVi: 'Phòng của bạn nằm ngay cạnh công trình đang sửa chữa nên rất ồn và bạn muốn đổi sang phòng yên tĩnh hơn.',
    promptEn: 'Receptionist: "Good morning! How was your first night at our hotel?"',
    sampleAnswerEn: 'Good morning. The room is clean, but there is loud construction noise right outside my window. Would it be possible to move me to a quieter room on a higher floor?',
    keywords: ['construction noise', 'possible', 'quieter room', 'higher floor']
  },

  // =========================================================================
  // LEVEL B2 (10 TÌNH HUỐNG NHẬP VAI)
  // =========================================================================
  {
    id: 'rp_b2_01',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Chuyên viên Chăm sóc Khách hàng',
    aiRoleVi: 'Khách hàng đang bức xúc',
    title: 'Xử lý khiếu nại giao hàng trễ với khách hàng',
    contextVi: 'Đơn hàng giao nhanh của khách bị trễ 2 ngày do thời tiết xấu; hãy xin lỗi chuyên nghiệp và đưa ra phương án bù đắp.',
    promptEn: 'Angry Customer: "I paid extra for express shipping, and my package is still not here! What are you going to do about this?"',
    sampleAnswerEn: 'I completely understand your frustration, and I sincerely apologize for the delay caused by severe weather. I am refunding your express shipping fee immediately and prioritizing delivery for tomorrow morning.',
    keywords: ['frustration', 'sincerely apologize', 'refunding', 'prioritizing']
  },
  {
    id: 'rp_b2_02',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Trưởng nhóm dự án',
    aiRoleVi: 'Khách hàng đối tác',
    title: 'Đề xuất điều chỉnh phạm vi tính năng dự án (Scope Creep)',
    contextVi: 'Khách hàng muốn thêm tính năng mới sát ngày bàn giao; hãy giải thích tác động tiến độ và đề xuất đưa vào giai đoạn 2.',
    promptEn: 'Client: "We really want to add a real-time analytics dashboard before Friday’s launch. Can your team squeeze that in?"',
    sampleAnswerEn: 'While a real-time dashboard would definitely add value, building and testing it properly requires two extra weeks. To avoid delaying Friday’s launch, I recommend releasing the core app on schedule and rolling out analytics in Phase 2.',
    keywords: ['add value', 'delaying', 'on schedule', 'Phase 2']
  },
  {
    id: 'rp_b2_03',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Ứng viên vị trí Chuyên viên Marketing',
    aiRoleVi: 'Giám đốc Tuyển dụng',
    title: 'Đàm phán mức lương khởi điểm sau khi nhận thư mời làm việc',
    contextVi: 'Bạn nhận được offer nhưng mức lương thấp hơn 10% so với kỳ vọng; hãy đàm phán khéo léo dựa trên năng lực.',
    promptEn: 'Hiring Manager: "We are thrilled to offer you the Marketing Specialist position. Have you had a chance to review our compensation package?"',
    sampleAnswerEn: 'Thank you so much, I am genuinely excited about joining the team. Based on my two years of campaign experience and data analytics certification, would there be flexibility to adjust the base salary closer to my target range?',
    keywords: ['genuinely excited', 'based on', 'flexibility', 'base salary']
  },
  {
    id: 'rp_b2_04',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Đại diện sinh viên',
    aiRoleVi: 'Nhà tài trợ doanh nghiệp',
    title: 'Kêu gọi tài trợ cho cuộc thi khởi nghiệp sinh viên',
    contextVi: 'Bạn trình bày quyền lợi truyền thông và tuyển dụng dành cho doanh nghiệp khi tài trợ cuộc thi.',
    promptEn: 'Corporate Sponsor: "We receive dozens of sponsorship requests every month. What tangible return will our company get by sponsoring your student competition?"',
    sampleAnswerEn: 'Beyond prominent brand visibility among over 3,000 business and tech students, your managers will serve as judges and gain direct recruitment access to our top-performing finalists.',
    keywords: ['visibility', 'judges', 'recruitment access', 'finalists']
  },
  {
    id: 'rp_b2_05',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Chuyên viên Nhân sự',
    aiRoleVi: 'Nhân viên thường xuyên đi làm muộn',
    title: 'Trao đổi góp ý về kỷ luật giờ giấc với đồng nghiệp',
    contextVi: 'Một thành viên trong nhóm thường xuyên vào họp trễ; hãy trao đổi mang tính xây dựng và tìm nguyên nhân.',
    promptEn: 'Colleague: "I know I was ten minutes late to the morning stand-up again, but I always stay late to finish my work anyway."',
    sampleAnswerEn: 'I appreciate your dedication in the evenings, and your output is strong. However, arriving on time for morning stand-ups ensures the whole team stays aligned and prevents blocking others’ tasks.',
    keywords: ['appreciate', 'dedication', 'however', 'aligned', 'blocking']
  },
  {
    id: 'rp_b2_06',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Chủ cửa hàng cà phê',
    aiRoleVi: 'Nhà cung cấp hạt cà phê',
    title: 'Phản hồi về chất lượng lô hàng giao không đồng đều',
    contextVi: 'Lô cà phê rang mới giao có độ ẩm cao hơn cam kết; hãy yêu cầu đổi lô mới để giữ uy tín quán.',
    promptEn: 'Supplier: "We have been supplying your cafe for two years without issues. Are you sure the difference in taste isn’t due to your espresso machine?"',
    sampleAnswerEn: 'We calibrated our machines this morning and tested against our previous batch. The new shipment shows noticeably higher moisture, so we need a replacement batch by Thursday to maintain our quality standard.',
    keywords: ['calibrated', 'previous batch', 'noticeably', 'replacement']
  },
  {
    id: 'rp_b2_07',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Điều phối viên sự kiện',
    aiRoleVi: 'Diễn giả khách mời',
    title: 'Xử lý sự cố diễn giả báo kẹt xe sát giờ khai mạc',
    contextVi: 'Diễn giả chính báo sẽ đến trễ 20 phút; hãy linh hoạt điều chỉnh thứ tự chương trình.',
    promptEn: 'Keynote Speaker: "I’m stuck in massive highway traffic and won’t reach the venue until 9:20 AM. Should we cancel my session?"',
    sampleAnswerEn: 'Not at all, please drive safely! We will move the panel discussion to the 9:00 AM slot and place your keynote right at 9:30 AM so you have plenty of time to settle in.',
    keywords: ['drive safely', 'move', 'slot', 'settle in']
  },
  {
    id: 'rp_b2_08',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Chuyên viên tư vấn du học',
    aiRoleVi: 'Phụ huynh học sinh',
    title: 'Giải đáp băn khoăn về chi phí và học bổng du học',
    contextVi: 'Phụ huynh lo lắng chi phí sinh hoạt tại nước ngoài quá cao; hãy tư vấn lộ trình săn học bổng và làm thêm hợp pháp.',
    promptEn: 'Parent: "Tuition and living expenses abroad seem overwhelming for our family budget. Is studying overseas even realistic for us?"',
    sampleAnswerEn: 'It is very achievable with early planning. By targeting universities offering 50% merit scholarships and choosing cities with lower living costs, your family can reduce total expenses by nearly half.',
    keywords: ['achievable', 'merit scholarships', 'living costs', 'reduce']
  },
  {
    id: 'rp_b2_09',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Nhà sáng lập Startup',
    aiRoleVi: 'Nhà đầu tư thiên thần',
    title: 'Trình bày điểm khác biệt của ứng dụng học ngoại ngữ',
    contextVi: 'Nhà đầu tư hỏi sản phẩm của bạn cạnh tranh thế nào với các ứng dụng lớn trên thị trường.',
    promptEn: 'Angel Investor: "There are already hundreds of language apps out there. What makes your platform defensible against giant competitors?"',
    sampleAnswerEn: 'Unlike generic consumer apps, we focus specifically on institutional B2B integration—allowing university lecturers to assign custom speaking exams, verify audio recordings, and export grades in one click.',
    keywords: ['unlike', 'institutional', 'assign', 'verify']
  },
  {
    id: 'rp_b2_10',
    tier: 'ROLEPLAY',
    level: 'B2',
    userRoleVi: 'Biên tập viên tạp chí',
    aiRoleVi: 'Tác giả bài viết',
    title: 'Đề nghị tác giả rút gọn và làm sắc nét bài phân tích',
    contextVi: 'Bài viết của tác giả có dữ liệu tốt nhưng phần mở đầu quá dài; hãy góp ý tinh tế.',
    promptEn: 'Writer: "I spent three weeks researching every historical detail in that introduction. Why do you think we should cut half of it?"',
    sampleAnswerEn: 'Your research is thorough and impressive, which is why we want readers to reach your core findings immediately. Condensing the background into two punchy paragraphs will hook busy readers right away.',
    keywords: ['thorough', 'core findings', 'condensing', 'hook']
  },

  // =========================================================================
  // LEVEL C1 (10 TÌNH HUỐNG NHẬP VAI)
  // =========================================================================
  {
    id: 'rp_c1_01',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Trưởng nhóm Phát triển Sản phẩm',
    aiRoleVi: 'Giám đốc Tài chính (CFO)',
    title: 'Thương lượng ngân sách kiểm thử bảo mật với CFO',
    contextVi: 'Bạn cần thuyết phục CFO duyệt thêm 15% ngân sách cho khâu kiểm thử bảo mật trước khi ra mắt sản phẩm.',
    promptEn: 'CFO: "Every department is under pressure to cut costs this quarter. Why should I approve an extra 15% for your security testing phase?"',
    sampleAnswerEn: 'Investing 15% upfront in rigorous security testing mitigates the far greater financial and reputational risk of a post-launch data breach, ensuring long-term ROI.',
    keywords: ['upfront', 'mitigates', 'reputational risk', 'long-term ROI']
  },
  {
    id: 'rp_c1_02',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Trưởng khoa Đào tạo',
    aiRoleVi: 'Hiệu trưởng trường đối tác quốc tế',
    title: 'Đàm phán chương trình liên kết cấp bằng đôi (Dual Degree)',
    contextVi: 'Hai trường đang thảo luận cơ chế công nhận tín chỉ và học phí cho sinh viên chuyển tiếp năm 3.',
    promptEn: 'Partner Provost: "Our faculty senate is concerned about curriculum alignment for transferring juniors. How can we guarantee equivalent academic rigor?"',
    sampleAnswerEn: 'We propose establishing a joint curriculum committee to co-design core syllabi, conduct annual assessment moderation, and align learning outcomes with international accreditation benchmarks.',
    keywords: ['curriculum', 'syllabi', 'moderation', 'accreditation']
  },
  {
    id: 'rp_c1_03',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Chuyên gia Tư vấn Chuyển đổi số',
    aiRoleVi: 'Giám đốc Điều hành (CEO) doanh nghiệp sản xuất',
    title: 'Thuyết phục ban lãnh đạo vượt qua tâm lý ngại thay đổi phần mềm',
    contextVi: 'CEO lo ngại nhân viên nhà máy sẽ phản ứng khi chuyển từ sổ sách giấy sang hệ thống ERP.',
    promptEn: 'CEO: "Our floor supervisors have used paper logs for twenty years. Won’t forcing a new ERP system trigger massive resistance and slow down production?"',
    sampleAnswerEn: 'Resistance typically stems from top-down mandates without training. By piloting the system on a single line with supervisor champions and demonstrating immediate time savings, adoption becomes organic.',
    keywords: ['mandates', 'piloting', 'champions', 'organic']
  },
  {
    id: 'rp_c1_04',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Đại diện Hiệp hội Doanh nghiệp Xanh',
    aiRoleVi: 'Đại diện Sở Công Thương',
    title: 'Kiến nghị chính sách ưu đãi thuế cho doanh nghiệp tái chế',
    contextVi: 'Bạn trình bày những rào cản chi phí thu gom và đề xuất cơ chế hỗ trợ thiết thực.',
    promptEn: 'Policy Official: "Public budgets are constrained. Why should recycling startups receive targeted tax exemptions over other emerging tech sectors?"',
    sampleAnswerEn: 'Unlike purely commercial ventures, recycling enterprises generate measurable public savings by reducing municipal landfill costs and carbon liabilities—making tax incentives fiscally self-sustaining.',
    keywords: ['measurable', 'landfill', 'liabilities', 'self-sustaining']
  },
  {
    id: 'rp_c1_05',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Trưởng phòng Pháp chế',
    aiRoleVi: 'Giám đốc Kinh doanh',
    title: 'Cảnh báo rủi ro điều khoản phạt hợp đồng độc quyền',
    contextVi: 'Giám đốc Kinh doanh muốn ký nhanh hợp đồng độc quyền 3 năm với đối tác phân phối; hãy phân tích rủi ro pháp lý.',
    promptEn: 'Sales Director: "This distributor guarantees big volume upfront if we grant them three-year exclusivity. Why is Legal holding up the signature?"',
    sampleAnswerEn: 'Unconditional three-year exclusivity locks us out of faster-growing channels if they underperform; we must tie exclusivity to enforceable quarterly minimum purchase quotas.',
    keywords: ['unconditional', 'exclusivity', 'underperform', 'enforceable', 'quotas']
  },
  {
    id: 'rp_c1_06',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Nghiên cứu viên chính',
    aiRoleVi: 'Hội đồng xét duyệt quỹ tài trợ khoa học',
    title: 'Bảo vệ tính ứng dụng thực tiễn của đề tài nghiên cứu',
    contextVi: 'Hội đồng đặt câu hỏi về khả năng thương mại hóa kết quả nghiên cứu sau 2 năm.',
    promptEn: 'Grant Panelist: "Your methodology is sound, but how will this prototype transition from a university lab into scalable field deployment?"',
    sampleAnswerEn: 'We have already secured letters of intent from two regional agricultural cooperatives to co-fund pilot trials in Year 2, ensuring direct technology transfer and validation.',
    keywords: ['methodology', 'cooperatives', 'pilot trials', 'technology transfer']
  },
  {
    id: 'rp_c1_07',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Giám đốc Nhân sự',
    aiRoleVi: 'Ứng viên cấp cao đang cân nhắc lời mời',
    title: 'Thuyết phục nhân tài chọn công ty thay vì tập đoàn lớn',
    contextVi: 'Ứng viên đang phân vân giữa startup tăng trưởng nhanh của bạn và một tập đoàn đa quốc gia.',
    promptEn: 'Senior Candidate: "The multinational corporation offers a slightly higher base salary and an established brand. What compelling reason should draw me to your company?"',
    sampleAnswerEn: 'While a large corporation offers stability within a narrow role, here you will architect our entire regional strategy from the ground up with meaningful equity upside and direct board visibility.',
    keywords: ['stability', 'architect', 'ground up', 'equity']
  },
  {
    id: 'rp_c1_08',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Điều phối viên Dự án Cộng đồng',
    aiRoleVi: 'Đại diện cộng đồng dân cư địa phương',
    title: 'Lắng nghe và giải tỏa lo ngại về dự án cải tạo công viên',
    contextVi: 'Người dân lo ngại việc cải tạo công viên sẽ chặt bỏ cây cổ thụ; hãy trấn an và trình bày thiết kế bảo tồn.',
    promptEn: 'Community Leader: "Residents fear this renovation project will replace our century-old trees with concrete plazas and commercial kiosks."',
    sampleAnswerEn: 'Preserving every mature tree is the cornerstone of our blueprint; in fact, the redesign expands permeable green space by 25% and was drafted alongside local arborists.',
    keywords: ['cornerstone', 'blueprint', 'permeable', 'arborists']
  },
  {
    id: 'rp_c1_09',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Kiến trúc sư Hệ thống',
    aiRoleVi: 'Giám đốc Công nghệ (CTO)',
    title: 'Đề xuất chuyển đổi kiến trúc hệ thống sang Microservices',
    contextVi: 'Hệ thống hiện tại quá tải vào giờ cao điểm; hãy trình bày lộ trình tách dịch vụ từng phần an toàn.',
    promptEn: 'CTO: "A full microservices rewrite could stall feature delivery for six months. How do we modernize without freezing product innovation?"',
    sampleAnswerEn: 'Rather than a risky big-bang rewrite, we will apply the strangler-fig pattern—extracting only the high-load authentication and assessment modules first while keeping core workflows live.',
    keywords: ['rewrite', 'strangler-fig', 'extracting', 'workflows']
  },
  {
    id: 'rp_c1_10',
    tier: 'ROLEPLAY',
    level: 'C1',
    userRoleVi: 'Chuyên gia Phân tích Rủi ro',
    aiRoleVi: 'Thành viên Hội đồng Quản trị',
    title: 'Đánh giá rủi ro mở rộng thị trường sang quốc gia mới',
    contextVi: 'Hội đồng muốn mở rộng nhanh sang thị trường Đông Nam Á mới; hãy trình bày kế hoạch kiểm soát rủi ro pháp lý.',
    promptEn: 'Board Member: "Our competitor just entered that market last month. Why shouldn’t we accelerate our launch immediately?"',
    sampleAnswerEn: 'Rushing in before securing local data-compliance licensing could trigger hefty regulatory fines; completing our 60-day legal audit first ensures sustainable, uninterrupted scaling.',
    keywords: ['compliance', 'regulatory fines', 'audit', 'uninterrupted']
  },

  // =========================================================================
  // LEVEL C2 (10 TÌNH HUỐNG NHẬP VAI)
  // =========================================================================
  {
    id: 'rp_c2_01',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Người phát ngôn doanh nghiệp',
    aiRoleVi: 'Phóng viên công nghệ sắc sảo',
    title: 'Họp báo xử lý khủng hoảng gián đoạn dịch vụ đám mây',
    contextVi: 'Hệ thống vừa gặp sự cố gián đoạn 3 tiếng; hãy trả lời phóng viên minh bạch, nhận trách nhiệm và trấn an dư luận.',
    promptEn: 'Journalist: "Critics argue that today’s three-hour outage exposes fundamental flaws in your cloud infrastructure. How do you restore user trust?"',
    sampleAnswerEn: 'We take full accountability for today’s service disruption. While no user data was compromised, we are publishing a comprehensive root-cause analysis and deploying redundant failover architecture within 48 hours.',
    keywords: ['accountability', 'compromised', 'root-cause analysis', 'failover architecture']
  },
  {
    id: 'rp_c2_02',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Nhà đàm phán thương mại cấp cao',
    aiRoleVi: 'Trưởng đoàn đàm phán đối tác',
    title: 'Hóa giải bế tắc về quyền sở hữu trí tuệ trong liên doanh',
    contextVi: 'Hai bên đang bế tắc về quyền sở hữu bằng sáng chế phát sinh trong quá trình hợp tác R&D.',
    promptEn: 'Lead Negotiator: "Our board insists on exclusive ownership of all jointly developed algorithms. Without that concession, we cannot proceed."',
    sampleAnswerEn: 'Exclusive ownership creates an untenable asymmetry; instead, we propose cross-licensing core intellectual property by geographic vertical, allowing both parties commercial autonomy without impeding joint innovation.',
    keywords: ['asymmetry', 'cross-licensing', 'autonomy', 'impeding']
  },
  {
    id: 'rp_c2_03',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Chuyên gia Đạo đức AI',
    aiRoleVi: 'Thành viên Ủy ban Nghị viện',
    title: 'Điều trần về minh bạch thuật toán trong tuyển dụng tự động',
    contextVi: 'Bạn trình bày trước ủy ban lập pháp về nguy cơ thuật toán sàng lọc hồ sơ loại bỏ nhầm ứng viên tài năng.',
    promptEn: 'Committee Chair: "Employers argue that proprietary hiring algorithms are trade secrets. How can regulators audit fairness without forcing companies to expose source code?"',
    sampleAnswerEn: 'Regulators do not need raw source code to audit outcomes; mandating counterfactual impact testing on standardized synthetic applicant cohorts reliably exposes disparate bias while preserving trade secrecy.',
    keywords: ['proprietary', 'counterfactual', 'synthetic', 'disparate bias']
  },
  {
    id: 'rp_c2_04',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Tổng biên tập Tạp chí Khoa học',
    aiRoleVi: 'Tác giả nghiên cứu gây tranh cãi',
    title: 'Xử lý tranh chấp về diễn giải dữ liệu chưa đủ cơ sở',
    contextVi: 'Tác giả đưa ra kết luận vượt quá phạm vi dữ liệu thực nghiệm; hãy yêu cầu hiệu chỉnh chuẩn mực học thuật.',
    promptEn: 'Lead Author: "Our findings point to a compelling breakthrough. Softening our conclusions at the reviewers’ request would diminish the paper’s impact."',
    sampleAnswerEn: 'Scientific credibility rests on proportional claims; calibrating your conclusion to distinguish observed correlation from unproven causation actually fortifies the paper against post-publication critique.',
    keywords: ['proportional', 'calibrating', 'correlation', 'causation']
  },
  {
    id: 'rp_c2_05',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Giám đốc Chiến lược Bền vững',
    aiRoleVi: 'Nhà đầu tư quỹ phòng hộ ngắn hạn',
    title: 'Bảo vệ chiến lược đầu tư dài hạn trước áp lực lợi nhuận quý',
    contextVi: 'Nhà đầu tư yêu cầu cắt giảm chi phí R&D xanh để tăng cổ tức ngắn hạn; hãy thuyết phục tầm nhìn dài hạn.',
    promptEn: 'Activist Investor: "Your green supply-chain overhaul is compressing quarterly margins. Why shouldn’t we prioritize immediate shareholder returns?"',
    sampleAnswerEn: 'Sacrificing supply-chain resilience for transient quarterly margin optics exposes the firm to imminent carbon tariffs and stranded assets; disciplined capital allocation today secures durable compounding value.',
    keywords: ['transient', 'optics', 'stranded assets', 'compounding']
  },
  {
    id: 'rp_c2_06',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Nhà trung gian hòa giải quốc tế',
    aiRoleVi: 'Đại diện bên tranh chấp nguồn nước xuyên biên giới',
    title: 'Điều phối thỏa thuận chia sẻ dữ liệu thủy văn lưu vực sông',
    contextVi: 'Hai quốc gia hạ lưu và thượng lưu thiếu tin tưởng lẫn nhau; hãy đề xuất bước đi xây dựng lòng tin đầu tiên.',
    promptEn: 'Delegate: "Given decades of hydrological disputes, why should our ministry trust data shared manually by upstream stations?"',
    sampleAnswerEn: 'Trust need not be assumed when it can be automated; installing jointly calibrated telemetry sensors that stream real-time satellite-verified flow metrics eliminates unilateral data manipulation.',
    keywords: ['hydrological', 'calibrated', 'telemetry', 'unilateral']
  },
  {
    id: 'rp_c2_07',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Hiệu trưởng Đại học Đổi mới',
    aiRoleVi: 'Chủ tịch Hội đồng Kiểm định Giáo dục',
    title: 'Bảo vệ mô hình đào tạo liên ngành không chia khoa truyền thống',
    contextVi: 'Hội đồng kiểm định đặt nghi vấn về việc sinh viên tự thiết kế lộ trình học tập liên ngành.',
    promptEn: 'Accreditation Chair: "Without conventional departmental boundaries, how do you ensure graduates acquire sufficient disciplinary depth alongside breadth?"',
    sampleAnswerEn: 'Every student must complete a rigorous methodological spine and defend a peer-reviewed capstone thesis evaluated by external domain specialists, guaranteeing depth without intellectual silos.',
    keywords: ['methodological', 'capstone', 'specialists', 'silos']
  },
  {
    id: 'rp_c2_08',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Giám đốc Y khoa Bệnh viện',
    aiRoleVi: 'Trưởng khoa Chẩn đoán Hình ảnh',
    title: 'Xây dựng quy trình phối hợp giữa Bác sĩ và AI chẩn đoán',
    contextVi: 'Thảo luận về trách nhiệm pháp lý và chống tâm lý ỷ lại vào gợi ý của phần mềm AI.',
    promptEn: 'Department Head: "If our radiologists rely on AI triage tools to clear backlogs, won’t automation complacency dull their diagnostic vigilance?"',
    sampleAnswerEn: 'To counter automation bias, our protocol requires clinicians to record an independent preliminary impression before viewing AI overlays, turning the algorithm into a rigorous second reader.',
    keywords: ['complacency', 'vigilance', 'preliminary', 'overlays']
  },
  {
    id: 'rp_c2_09',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Nhà quy hoạch Di sản Đô thị',
    aiRoleVi: 'Nhà phát triển bất động sản thương mại',
    title: 'Thương lượng bảo tồn mặt tiền kiến trúc cổ trong dự án mới',
    contextVi: 'Chủ đầu tư muốn phá dỡ khu nhà xưởng cổ để xây cao ốc; hãy đề xuất phương án tái sử dụng thích ứng (Adaptive Reuse).',
    promptEn: 'Developer: "Restoring century-old brick facades costs substantially more than clearing the site. How does preservation make commercial sense?"',
    sampleAnswerEn: 'Adaptive reuse transforms architectural heritage into an irreplicable brand anchor that commands premium commercial rents and unlocks municipal density bonuses.',
    keywords: ['adaptive reuse', 'irreplicable', 'commands', 'density bonuses']
  },
  {
    id: 'rp_c2_10',
    tier: 'ROLEPLAY',
    level: 'C2',
    userRoleVi: 'Chuyên gia An ninh Mạng Quốc gia',
    aiRoleVi: 'Giám đốc Điều hành Hạ tầng Điện lực',
    title: 'Đánh giá mức độ sẵn sàng ứng phó tấn công mạng vào lưới điện',
    contextVi: 'Kiểm tra khả năng cô lập hệ thống điều khiển công nghiệp (OT) khỏi mạng văn phòng (IT).',
    promptEn: 'Utility Executive: "Our operational technology network is air-gapped from corporate email. Isn’t that sufficient protection against ransomware?"',
    sampleAnswerEn: 'Air gaps are frequently breached via maintenance laptops and vendor USB updates; true cyber resilience requires unidirectional security gateways, continuous anomaly telemetry, and manual islanding drills.',
    keywords: ['air-gapped', 'resilience', 'unidirectional', 'telemetry', 'islanding']
  }
];