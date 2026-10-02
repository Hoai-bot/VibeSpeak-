// src/services/arena/roleplayService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface RoleplayScenario {
  id: string;
  scenarioTitle: string;
  aiRoleEn: string;
  aiRoleVi?: string;
  userRoleEn: string;
  userRoleVi?: string;
  initialAiMessage: string;
  goalEn: string;
  goalVi?: string;
}

const sessionUsedRoleplayTexts: Set<string> = new Set();

export function clearRoleplayHistory() {
  sessionUsedRoleplayTexts.clear();
}

// 📦 KHO DỮ LIỆU LOCAL 20 KỊCH BẢN ROLEPLAY ĐỘC BẢN CHO MỖI LEVEL (TỔNG 120 KỊCH BẢN)
const LOCAL_ROLEPLAY_POOL: Record<string, RoleplayScenario[]> = {
  A1: [
    { id: 'rp_a1_1', scenarioTitle: "At the Coffee Shop [A1]", aiRoleEn: "Barista", aiRoleVi: "Nhân viên pha chế", userRoleEn: "Customer", userRoleVi: "Khách hàng", initialAiMessage: "Hello! What drink would you like today?", goalEn: "Order a coffee and ask for the price.", goalVi: "Đặt một ly cà phê và hỏi giá tiền." },
    { id: 'rp_a1_2', scenarioTitle: "Meeting a New Neighbor [A1]", aiRoleEn: "Neighbor", aiRoleVi: "Hàng xóm", userRoleEn: "New Resident", userRoleVi: "Cư dân mới", initialAiMessage: "Hi there! Welcome to the building.", goalEn: "Introduce yourself and ask where the supermarket is.", goalVi: "Giới thiệu bản thân và hỏi siêu thị ở đâu." },
    { id: 'rp_a1_3', scenarioTitle: "Buying Fruit at the Market [A1]", aiRoleEn: "Fruit Vendor", aiRoleVi: "Người bán trái cây", userRoleEn: "Shopper", userRoleVi: "Người mua hàng", initialAiMessage: "Fresh apples and bananas today! What can I get you?", goalEn: "Buy 1kg of apples and ask for a discount.", goalVi: "Mua 1kg táo và xin giảm giá." },
    { id: 'rp_a1_4', scenarioTitle: "Asking for the Time [A1]", aiRoleEn: "Passerby", aiRoleVi: "Người đi đường", userRoleEn: "Commuter", userRoleVi: "Người đi làm", initialAiMessage: "Excuse me, do you need help?", goalEn: "Ask for the current time and train station direction.", goalVi: "Hỏi giờ hiện tại và đường đến ga tàu." },
    { id: 'rp_a1_5', scenarioTitle: "Ordering Fast Food [A1]", aiRoleEn: "Cashier", aiRoleVi: "Thu ngân", userRoleEn: "Customer", userRoleVi: "Khách hàng", initialAiMessage: "Welcome to Burger Express! For here or to go?", goalEn: "Order a combo meal and pay cash.", goalVi: "Đặt một suất combo và trả tiền mặt." },
    { id: 'rp_a1_6', scenarioTitle: "At the Library [A1]", aiRoleEn: "Librarian", aiRoleVi: "Thủ thư", userRoleEn: "Student", userRoleVi: "Học sinh", initialAiMessage: "Hello, how can I help you find your books today?", goalEn: "Borrow an English grammar book.", goalVi: "Mượn một cuốn sách ngữ pháp tiếng Anh." },
    { id: 'rp_a1_7', scenarioTitle: "Taxi Ride Booking [A1]", aiRoleEn: "Taxi Driver", aiRoleVi: "Tài xế taxi", userRoleEn: "Passenger", userRoleVi: "Hành khách", initialAiMessage: "Where are we heading to, sir?", goalEn: "State destination address and ask travel time.", goalVi: "Đọc địa chỉ đến và hỏi thời gian đi." },
    { id: 'rp_a1_8', scenarioTitle: "Checking into a Hostel [A1]", aiRoleEn: "Hostel Staff", aiRoleVi: "Lễ tân hostel", userRoleEn: "Traveler", userRoleVi: "Khách du lịch", initialAiMessage: "Welcome! Do you have a booking?", goalEn: "Provide name and ask for WiFi password.", goalVi: "Đọc tên và hỏi mật khẩu WiFi." },
    { id: 'rp_a1_9', scenarioTitle: "At the Pet Shop [A1]", aiRoleEn: "Shop Assistant", aiRoleVi: "Nhân viên cửa hàng", userRoleEn: "Pet Owner", userRoleVi: "Chủ thú cưng", initialAiMessage: "Hi! Are you looking for dog or cat food?", goalEn: "Ask for recommended dog food.", goalVi: "Hỏi loại thức ăn chó khuyên dùng." },
    { id: 'rp_a1_10', scenarioTitle: "Lost Item Return [A1]", aiRoleEn: "Information Desk", aiRoleVi: "Bàn thông tin", userRoleEn: "Visitor", userRoleVi: "Khách tham quan", initialAiMessage: "Did you lose something in the mall?", goalEn: "Describe a lost red umbrella.", goalVi: "Mô tả chiếc ô màu đỏ bị mất." },
    { id: 'rp_a1_11', scenarioTitle: "Asking for Ice Cream [A1]", aiRoleEn: "Ice Cream Seller", aiRoleVi: "Người bán kem", userRoleEn: "Kid", userRoleVi: "Trẻ nhỏ", initialAiMessage: "Chocolate, vanilla, or strawberry today?", goalEn: "Order two scoops of chocolate ice cream.", goalVi: "Đặt 2 viên kem sô-cô-la." },
    { id: 'rp_a1_12', scenarioTitle: "Buying a Bus Ticket [A1]", aiRoleEn: "Bus Conductor", aiRoleVi: "Phụ xe bus", userRoleEn: "Passenger", userRoleVi: "Hành khách", initialAiMessage: "Tickets please! Where are you getting off?", goalEn: "Buy a single ticket to the city center.", goalVi: "Mua một vé đơn đến trung tâm thành phố." },
    { id: 'rp_a1_13', scenarioTitle: "In a Bakery [A1]", aiRoleEn: "Baker", aiRoleVi: "Thợ bánh", userRoleEn: "Customer", userRoleVi: "Khách hàng", initialAiMessage: "Fresh bread just came out of the oven!", goalEn: "Buy two loaves of bread.", goalVi: "Mua hai ổ bánh mì tươi." },
    { id: 'rp_a1_14', scenarioTitle: "At the Park Bench [A1]", aiRoleEn: "Local Jogger", aiRoleVi: "Người tập thể dục", userRoleEn: "Visitor", userRoleVi: "Khách thư giãn", initialAiMessage: "Nice weather for a run today, isn't it?", goalEn: "Agree and ask if the park closes late.", goalVi: "Đồng ý và hỏi công viên có đóng cửa muộn không." },
    { id: 'rp_a1_15', scenarioTitle: "Buying a Notebook [A1]", aiRoleEn: "Stationery Clerk", aiRoleVi: "Bán văn phòng phẩm", userRoleEn: "Student", userRoleVi: "Học sinh", initialAiMessage: "Need pens, pencils, or notebooks?", goalEn: "Buy a blue notebook and a black pen.", goalVi: "Mua cuốn sổ xanh và cây bút đen." },
    { id: 'rp_a1_16', scenarioTitle: "Greeting at Hotel Gym [A1]", aiRoleEn: "Gym Instructor", aiRoleVi: "HLV phòng tập", userRoleEn: "Hotel Guest", userRoleVi: "Khách ở khách sạn", initialAiMessage: "Welcome to the gym! Ready to work out?", goalEn: "Ask where towels and water bottles are.", goalVi: "Hỏi chỗ lấy khăn và chai nước." },
    { id: 'rp_a1_17', scenarioTitle: "Asking for a Table [A1]", aiRoleEn: "Restaurant Host", aiRoleVi: "Lễ tân nhà hàng", userRoleEn: "Diner", userRoleVi: "Khách ăn tối", initialAiMessage: "Good evening! Table for how many?", goalEn: "Ask for a table for two near the window.", goalVi: "Xin bàn hai người gần cửa sổ." },
    { id: 'rp_a1_18', scenarioTitle: "Buying Movie Popcorn [A1]", aiRoleEn: "Cinema Staff", aiRoleVi: "Nhân viên rạp phim", userRoleEn: "Moviegoer", userRoleVi: "Người xem phim", initialAiMessage: "Small, medium, or large popcorn?", goalEn: "Order large salted popcorn and a soda.", goalVi: "Đặt bỏng ngô mặn cỡ lớn và nước ngọt." },
    { id: 'rp_a1_19', scenarioTitle: "Asking for WiFi [A1]", aiRoleEn: "Cafe Owner", aiRoleVi: "Chủ quán cafe", userRoleEn: "Remote Worker", userRoleVi: "Người làm việc", initialAiMessage: "Enjoy your drink! Anything else?", goalEn: "Ask for the WiFi password politely.", goalVi: "Hỏi mật khẩu WiFi một cách lịch sự." },
    { id: 'rp_a1_20', scenarioTitle: "At the Toy Store [A1]", aiRoleEn: "Toy Seller", aiRoleVi: "Người bán đồ chơi", userRoleEn: "Parent", userRoleVi: "Phụ huynh", initialAiMessage: "Looking for a gift for a boy or girl?", goalEn: "Ask for a popular board game for a 7-year-old.", goalVi: "Hỏi mua board game cho trẻ 7 tuổi." }
  ],
  A2: [
    { id: 'rp_a2_1', scenarioTitle: "Asking for Directions [A2]", aiRoleEn: "Local Resident", aiRoleVi: "Người dân địa phương", userRoleEn: "Tourist", userRoleVi: "Khách du lịch", initialAiMessage: "Hi! You look lost. Can I help you?", goalEn: "Ask for directions to the central station.", goalVi: "Hỏi đường đến ga trung tâm." },
    { id: 'rp_a2_2', scenarioTitle: "Clothes Store Exchange [A2]", aiRoleEn: "Store Manager", aiRoleVi: "Quản lý cửa hàng", userRoleEn: "Shopper", userRoleVi: "Người mua hàng", initialAiMessage: "How can I help you with your purchase?", goalEn: "Exchange a shirt for a larger size.", goalVi: "Đổi áo sơ mi lấy size lớn hơn." },
    { id: 'rp_a2_3', scenarioTitle: "Doctor Appointment Booking [A2]", aiRoleEn: "Medical Receptionist", aiRoleVi: "Lễ tân phòng khám", userRoleEn: "Patient", userRoleVi: "Bệnh nhân", initialAiMessage: "Medical desk, how may I direct your call?", goalEn: "Book an appointment for tomorrow afternoon.", goalVi: "Đặt lịch khám vào chiều mai." },
    { id: 'rp_a2_4', scenarioTitle: "Renting a Bike [A2]", aiRoleEn: "Rental Agent", aiRoleVi: "Nơi cho thuê xe", userRoleEn: "Tourist", userRoleVi: "Khách du lịch", initialAiMessage: "Standard or electric bikes available today!", goalEn: "Rent a city bike for 3 hours.", goalVi: "Thuê xe đạp thành phố trong 3 giờ." },
    { id: 'rp_a2_5', scenarioTitle: "Hotel Breakfast Order [A2]", aiRoleEn: "Room Service", aiRoleVi: "Phục vụ phòng", userRoleEn: "Hotel Guest", userRoleVi: "Khách trọ", initialAiMessage: "Good morning! What would you like for breakfast?", goalEn: "Order eggs, toast, and orange juice.", goalVi: "Đặt trứng, bánh mì nướng và nước cam." },
    { id: 'rp_a2_6', scenarioTitle: "Buying Train Tickets [A2]", aiRoleEn: "Ticket Counter Agent", aiRoleVi: "Nhân viên bán vé", userRoleEn: "Traveler", userRoleVi: "Hành khách", initialAiMessage: "Next in line, please!", goalEn: "Buy two round-trip tickets to Oxford.", goalVi: "Mua hai vé khứ hồi đi Oxford." },
    { id: 'rp_a2_7', scenarioTitle: "Pharmacy Inquiry [A2]", aiRoleEn: "Pharmacist", aiRoleVi: "Dược sĩ", userRoleEn: "Customer", userRoleVi: "Khách hàng", initialAiMessage: "How can I assist your health needs today?", goalEn: "Ask for medicine for a sore throat.", goalVi: "Hỏi mua thuốc đau họng." },
    { id: 'rp_a2_8', scenarioTitle: "Joining a Gym [A2]", aiRoleEn: "Gym Consultant", aiRoleVi: "Tư vấn phòng tập", userRoleEn: "New Member", userRoleVi: "Hội viên mới", initialAiMessage: "Welcome to Fitness First! Interested in membership?", goalEn: "Inquire about monthly membership fees.", goalVi: "Hỏi về phí hội viên hàng tháng." },
    { id: 'rp_a2_9', scenarioTitle: "Reporting Lost Luggage [A2]", aiRoleEn: "Airport Baggage Officer", aiRoleVi: "Nhân viên hành lý", userRoleEn: "Passenger", userRoleVi: "Hành khách", initialAiMessage: "Which flight were you on, sir?", goalEn: "Report a missing black suitcase.", goalVi: "Khai báo vali đen bị thất lạc." },
    { id: 'rp_a2_10', scenarioTitle: "Booking Movie Seats [A2]", aiRoleEn: "Cinema Cashier", aiRoleVi: "Thu ngân rạp phim", userRoleEn: "Moviegoer", userRoleVi: "Người xem phim", initialAiMessage: "Which screening would you like seats for?", goalEn: "Book two middle-row seats for the 8 PM show.", goalVi: "Đặt hai ghế hàng giữa suất 8h tối." },
    { id: 'rp_a2_11', scenarioTitle: "Returning a Faulty Item [A2]", aiRoleEn: "Customer Service", aiRoleVi: "Chăm sóc khách hàng", userRoleEn: "Buyer", userRoleVi: "Người mua", initialAiMessage: "What seems to be the problem with this kettle?", goalEn: "Explain it doesn't heat water and show receipt.", goalVi: "Giải thích ấm không đun sôi nước và đưa hóa đơn." },
    { id: 'rp_a2_12', scenarioTitle: "Booking a Haircut [A2]", aiRoleEn: "Hair Stylist", aiRoleVi: "Thợ cắt tóc", userRoleEn: "Client", userRoleVi: "Khách hàng", initialAiMessage: "Welcome! How short are we cutting today?", goalEn: "Ask for a trim and wash service.", goalVi: "Yêu cầu tỉa bớt và gội đầu." },
    { id: 'rp_a2_13', scenarioTitle: "At the Bank Counter [A2]", aiRoleEn: "Bank Teller", aiRoleVi: "Giao dịch viên ngân hàng", userRoleEn: "Account Holder", userRoleVi: "Chủ tài khoản", initialAiMessage: "How can I help with your account today?", goalEn: "Deposit cash into a savings account.", goalVi: "Nộp tiền mặt vào tài khoản tiết kiệm." },
    { id: 'rp_a2_14', scenarioTitle: "Ordering a Birthday Cake [A2]", aiRoleEn: "Cake Designer", aiRoleVi: "Thợ làm bánh", userRoleEn: "Customer", userRoleVi: "Khách đặt bánh", initialAiMessage: "What flavor and writing would you like on the cake?", goalEn: "Order a chocolate cake with 'Happy Birthday' written.", goalVi: "Đặt bánh sô-cô-la có ghi chữ Chúc mừng sinh nhật." },
    { id: 'rp_a2_15', scenarioTitle: "Inquiring about Flat Rent [A2]", aiRoleEn: "Real Estate Agent", aiRoleVi: "Môi giới bất động sản", userRoleEn: "Renter", userRoleVi: "Người thuê", initialAiMessage: "This 1-bedroom flat is available from next week.", goalEn: "Ask about monthly rent and deposit required.", goalVi: "Hỏi tiền thuê hàng tháng và cọc." },
    { id: 'rp_a2_16', scenarioTitle: "Car Rental Inquiry [A2]", aiRoleEn: "Car Rental Clerk", aiRoleVi: "Nhân viên thuê xe", userRoleEn: "Driver", userRoleVi: "Người thuê xe", initialAiMessage: "Need a compact car or an SUV?", goalEn: "Rent a compact car for two days with insurance.", goalVi: "Thuê xe nhỏ trong 2 ngày kèm bảo hiểm." },
    { id: 'rp_a2_17', scenarioTitle: "At the Museum Ticket Office [A2]", aiRoleEn: "Museum Guide", aiRoleVi: "Hướng dẫn viên", userRoleEn: "Visitor", userRoleVi: "Khách tham quan", initialAiMessage: "Adult tickets are $15. Any students with you?", goalEn: "Buy one adult and one student ticket with audio guide.", goalVi: "Mua 1 vé người lớn, 1 vé sinh viên kèm tai nghe hướng dẫn." },
    { id: 'rp_a2_18', scenarioTitle: "Ordering Pizza over Phone [A2]", aiRoleEn: "Pizzeria Staff", aiRoleVi: "Nhân viên tiệm pizza", userRoleEn: "Caller", userRoleVi: "Khách gọi điện", initialAiMessage: "Pizza Hut, delivery or takeaway?", goalEn: "Order a large pepperoni pizza for delivery.", goalVi: "Đặt 1 pizza pepperoni cỡ lớn giao tận nơi." },
    { id: 'rp_a2_19', scenarioTitle: "Asking for Tailor Service [A2]", aiRoleEn: "Tailor", aiRoleVi: "Thợ may", userRoleEn: "Customer", userRoleVi: "Khách sửa đồ", initialAiMessage: "Do these trousers need shortening?", goalEn: "Ask to shorten trouser legs by 3 centimeters.", goalVi: "Yêu cầu cắt ngắn gấu quần 3cm." },
    { id: 'rp_a2_20', scenarioTitle: "Visiting an Art Gallery [A2]", aiRoleEn: "Gallery Curator", aiRoleVi: "Người quản lý triển lãm", userRoleEn: "Art Lover", userRoleVi: "Khách xem triển lãm", initialAiMessage: "This painting exhibition features modern artists.", goalEn: "Ask if taking photos is allowed inside.", goalVi: "Hỏi xem có được phép chụp ảnh bên trong không." }
  ],
  B1: [
    { id: 'rp_b1_1', scenarioTitle: "Hotel Room Complaint [B1]", aiRoleEn: "Hotel Receptionist", aiRoleVi: "Lễ tân khách sạn", userRoleEn: "Guest", userRoleVi: "Khách trọ", initialAiMessage: "Good evening, sir. How can I assist you?", goalEn: "Complain about noise and request a new room.", goalVi: "Phàn nàn về tiếng ồn và yêu cầu đổi phòng." },
    { id: 'rp_b1_2', scenarioTitle: "Job Interview - Junior Level [B1]", aiRoleEn: "HR Manager", aiRoleVi: "Trưởng phòng nhân sự", userRoleEn: "Job Applicant", userRoleVi: "Ứng viên", initialAiMessage: "Tell me about your relevant work experience.", goalEn: "Explain past internship achievements.", goalVi: "Giải thích thành tích thực tập trước đây." },
    { id: 'rp_b1_3', scenarioTitle: "Apartment Rental Negotiation [B1]", aiRoleEn: "Landlord", aiRoleVi: "Chủ nhà", userRoleEn: "Tenant", userRoleVi: "Người thuê nhà", initialAiMessage: "The monthly rent is $800 excluding utilities.", goalEn: "Negotiate a lower rent for a 1-year contract.", goalVi: "Đàm phán giảm giá thuê cho hợp đồng 1 năm." },
    { id: 'rp_b1_4', scenarioTitle: "Flight Delay Compensation [B1]", aiRoleEn: "Airline Representative", userRoleEn: "Passenger", initialAiMessage: "Due to weather, your flight is delayed by 5 hours.", goalEn: "Request a meal voucher and hotel accommodation." },
    { id: 'rp_b1_5', scenarioTitle: "Car Repair Explanation [B1]", aiRoleEn: "Mechanic", userRoleEn: "Car Owner", initialAiMessage: "Your engine noise is caused by a faulty belt.", goalEn: "Ask for cost estimation and repair time." },
    { id: 'rp_b1_6', scenarioTitle: "Bank Account Problem [B1]", aiRoleEn: "Bank Teller", userRoleEn: "Account Holder", initialAiMessage: "I see an unfamiliar transaction on your statement.", goalEn: "Block the card and dispute unauthorized charges." },
    { id: 'rp_b1_7', scenarioTitle: "University Course Change [B1]", aiRoleEn: "Academic Advisor", userRoleEn: "Student", initialAiMessage: "Why do you wish to drop Economics this semester?", goalEn: "Explain scheduling conflict and request credit transfer." },
    { id: 'rp_b1_8', scenarioTitle: "Catering Service Booking [B1]", aiRoleEn: "Catering Event Planner", userRoleEn: "Client", initialAiMessage: "What dietary options do you require for 50 guests?", goalEn: "Arrange vegetarian menus and set delivery time." },
    { id: 'rp_b1_9', scenarioTitle: "Fitness Personal Trainer Plan [B1]", aiRoleEn: "Personal Trainer", userRoleEn: "Client", initialAiMessage: "What are your main fitness goals for the next 3 months?", goalEn: "Request a custom weight loss and cardio program." },
    { id: 'rp_b1_10', scenarioTitle: "Product Return Policy Dispute [B1]", aiRoleEn: "Customer Service Agent", userRoleEn: "Buyer", initialAiMessage: "Our return window expired yesterday.", goalEn: "Explain defective item receipt and request refund." },
    { id: 'rp_b1_11', scenarioTitle: "Insurance Claim Inquiry [B1]", aiRoleEn: "Insurance Claims Officer", userRoleEn: "Policy Holder", initialAiMessage: "Please describe the water damage incident in your kitchen.", goalEn: "File a claim for damaged cabinets and pipes." },
    { id: 'rp_b1_12', scenarioTitle: "Language Exchange Partner [B1]", aiRoleEn: "Native English Speaker", userRoleEn: "Language Learner", initialAiMessage: "Hi! Ready to practice conversation topics today?", goalEn: "Suggest 30 minutes English and 30 minutes Vietnamese." },
    { id: 'rp_b1_13', scenarioTitle: "Reporting Broadband Internet Issue [B1]", aiRoleEn: "ISP Tech Support", userRoleEn: "Subscriber", initialAiMessage: "Tech support desk, what internet issue are you facing?", goalEn: "Report frequent disconnection and demand technician visit." },
    { id: 'rp_b1_14', scenarioTitle: "Organizing a Charity Run [B1]", aiRoleEn: "Community Center Director", userRoleEn: "Event Organizer", initialAiMessage: "We need route permits for the 5k charity marathon.", goalEn: "Negotiate park usage permission and security detail." },
    { id: 'rp_b1_15', scenarioTitle: "Discussing Freelance Design Scope [B1]", aiRoleEn: "Small Business Owner", userRoleEn: "Freelance Designer", initialAiMessage: "I need a website logo created in three days.", goalEn: "Explain design revision steps and set payment milestones." },
    { id: 'rp_b1_16', scenarioTitle: "Negotiating Used Car Sale [B1]", aiRoleEn: "Used Car Dealer", userRoleEn: "Buyer", initialAiMessage: "This 2018 sedan is priced fairly at $12,000.", goalEn: "Point out tire wear and offer $10,500 cash." },
    { id: 'rp_b1_17', scenarioTitle: "Wedding Venue Inquiries [B1]", aiRoleEn: "Banquet Hall Coordinator", userRoleEn: "Engaged Couple", initialAiMessage: "Our hall accommodates up to 150 seated guests.", goalEn: "Inquire about catering restrictions and music curfews." },
    { id: 'rp_b1_18', scenarioTitle: "Resolving Noise Complaint with Neighbor [B1]", aiRoleEn: "Apartment Neighbor", userRoleEn: "Resident", initialAiMessage: "Your music late last night was keeping my kids awake.", goalEn: "Apologize politely and agree on quiet hours after 10 PM." },
    { id: 'rp_b1_19', scenarioTitle: "Planning a Company Team Outing [B1]", aiRoleEn: "HR Assistant", userRoleEn: "Team Lead", initialAiMessage: "Budget allows either outdoor paintball or resort relaxation.", goalEn: "Propose resort outing emphasizing team bonding benefits." },
    { id: 'rp_b1_20', scenarioTitle: "Requesting Flexible Study Schedule [B1]", aiRoleEn: "University Professor", userRoleEn: "Working Student", initialAiMessage: "You missed two morning lectures this week.", goalEn: "Explain work shift conflict and request afternoon seminar transfer." }
  ],
  B2: [
    { id: 'rp_b2_1', scenarioTitle: "Project Timeline Negotiation [B2]", aiRoleEn: "Project Director", userRoleEn: "Lead Engineer", initialAiMessage: "The client demands an acceleration of the release date by two weeks.", goalEn: "Explain technical constraints and negotiate a feasible delivery schedule." },
    { id: 'rp_b2_2', scenarioTitle: "Salary Review Meeting [B2]", aiRoleEn: "Department Head", userRoleEn: "Senior Specialist", initialAiMessage: "Let's review your performance achievements this quarter.", goalEn: "Present key revenue growth metrics and justify a salary raise." },
    { id: 'rp_b2_3', scenarioTitle: "Supplier Contract Conflict [B2]", aiRoleEn: "Supplier Account Exec", userRoleEn: "Procurement Manager", initialAiMessage: "Raw material price increases force us to hike contract rates by 15%.", goalEn: "Reject unilateral rate increases and renegotiate bulk discount tiers." },
    { id: 'rp_b2_4', scenarioTitle: "Client Onboarding Crisis [B2]", aiRoleEn: "Enterprise Client", userRoleEn: "Account Manager", initialAiMessage: "Your platform integration experienced a critical failure during launch.", goalEn: "Apologize professionally, present root-cause analysis, and offer SLA credits." },
    { id: 'rp_b2_5', scenarioTitle: "Marketing Budget Allocation [B2]", aiRoleEn: "Chief Marketing Officer", userRoleEn: "Digital Strategist", initialAiMessage: "We must reallocate $50k from print to performance marketing.", goalEn: "Defend high-ROI ad channels and present conversion metrics." },
    { id: 'rp_b2_6', scenarioTitle: "Software Feature Prioritization [B2]", aiRoleEn: "Product Manager", userRoleEn: "Lead Developer", initialAiMessage: "Stakeholders want 5 new features deployed in Sprint 12.", goalEn: "Highlight technical debt risks and negotiate scope reduction." },
    { id: 'rp_b2_7', scenarioTitle: "Corporate PR Crisis [B2]", aiRoleEn: "Journalist", userRoleEn: "Company Spokesperson", initialAiMessage: "Leaked reports suggest your company experienced a customer data breach.", goalEn: "Deliver controlled crisis statement emphasizing ongoing security containment." },
    { id: 'rp_b2_8', scenarioTitle: "Cross-Functional Team Conflict [B2]", aiRoleEn: "Sales Director", userRoleEn: "Product Designer", initialAiMessage: "Sales reps complain the new UI layout slowed down client demos.", goalEn: "Defend user-experience security compliance decisions with analytics data." },
    { id: 'rp_b2_9', scenarioTitle: "Office Relocation Consultation [B2]", aiRoleEn: "Operations VP", userRoleEn: "Regional Lead", initialAiMessage: "We are considering downsizing physical office space by 40%.", goalEn: "Propose hybrid hot-desking solutions without hurting employee morale." },
    { id: 'rp_b2_10', scenarioTitle: "Investor Due Diligence [B2]", aiRoleEn: "Angel Investor", userRoleEn: "Startup Founder", initialAiMessage: "Your customer churn rate rose by 4% last quarter.", goalEn: "Explain churn causes and outline new retention strategy." },
    { id: 'rp_b2_11', scenarioTitle: "Software Licensing Dispute [B2]", aiRoleEn: "Software Vendor Auditor", userRoleEn: "IT Director", initialAiMessage: "Your user count exceeds active enterprise license seats.", goalEn: "Audit active seats and negotiate retroactive volume licensing rates." },
    { id: 'rp_b2_12', scenarioTitle: "Sponsorship Deal Negotiation [B2]", aiRoleEn: "Sports Event Organizer", userRoleEn: "Brand Marketing Lead", initialAiMessage: "Title sponsorship packages start at $100,000 for primary logo placement.", goalEn: "Negotiate tier 2 sponsorship with exclusive digital banner rights." },
    { id: 'rp_b2_13', scenarioTitle: "Corporate Sustainability Audit [B2]", aiRoleEn: "ESG Inspector", userRoleEn: "Sustainability Manager", initialAiMessage: "Your supply chain carbon emissions report lacks third-party verification.", goalEn: "Present ISO-certified verification timeline and audit milestones." },
    { id: 'rp_b2_14', scenarioTitle: "Overcoming Agency Pitch Objections [B2]", aiRoleEn: "Prospective Client CMO", userRoleEn: "Agency Business Lead", initialAiMessage: "Your retainer quote is 20% higher than competing agency proposals.", goalEn: "Justify value pricing through proprietary AI analytics capabilities." },
    { id: 'rp_b2_15', scenarioTitle: "Executive Headhunter Interview [B2]", aiRoleEn: "Executive Recruiter", userRoleEn: "Director Candidate", initialAiMessage: "Why are you considering leaving your current VP role after only two years?", goalEn: "Articulate desire for scale and strategic alignment opportunities." },
    { id: 'rp_b2_16', scenarioTitle: "Commercial Lease Renewal [B2]", aiRoleEn: "Commercial Property Manager", userRoleEn: "Corporate Real Estate Manager", initialAiMessage: "Market rates dictate a 10% rent bump for the next 3-year term.", goalEn: "Negotiate 5% cap with tenant improvement allowance credits." },
    { id: 'rp_b2_17', scenarioTitle: "Franchise Expansion Terms [B2]", aiRoleEn: "Franchise Director", userRoleEn: "Franchisee Candidate", initialAiMessage: "Franchise fees require 6% gross revenue royalty paid monthly.", goalEn: "Negotiate lower initial franchise fee for multi-unit territory rights." },
    { id: 'rp_b2_18', scenarioTitle: "Handling Employee Underperformance [B2]", aiRoleEn: "Junior Team Member", userRoleEn: "Engineering Manager", initialAiMessage: "I felt overwhelmed by the sudden increase in sprint tasks.", goalEn: "Provide constructive feedback and establish a performance improvement plan." },
    { id: 'rp_b2_19', scenarioTitle: "Outsourcing Vendor Selection [B2]", aiRoleEn: "Outsourcing Agency VP", userRoleEn: "Operations Manager", initialAiMessage: "Our offshore team guarantees 24/7 technical support coverage.", goalEn: "Probe SLA response times and data privacy security protocols." },
    { id: 'rp_b2_20', scenarioTitle: "Key Client Retention Call [B2]", aiRoleEn: "Risk-of-Cancel Client", userRoleEn: "Customer Success Director", initialAiMessage: "We are evaluating cheaper SaaS competitors to reduce overhead.", goalEn: "Demonstrate customized ROI metrics and offer dedicated account management." }
  ],
  C1: [
    { id: 'rp_c1_1', scenarioTitle: "Venture Capital Pitch [C1]", aiRoleEn: "Managing Partner", userRoleEn: "Startup Founder", initialAiMessage: "Your burn rate seems high given market headwinds. How do you justify this valuation?", goalEn: "Defend financial projections and articulate market scalability." },
    { id: 'rp_c1_2', scenarioTitle: "M&A Integration Dispute [C1]", aiRoleEn: "Acquiring CEO", userRoleEn: "Acquired Founder", initialAiMessage: "We plan to subsume your brand under our parent corporate identity.", goalEn: "Preserve subsidiary brand autonomy and protect core engineering culture." },
    { id: 'rp_c1_3', scenarioTitle: "Regulatory Compliance Audit [C1]", aiRoleEn: "Lead Financial Regulator", userRoleEn: "Chief Compliance Officer", initialAiMessage: "Your cross-border transactions display anomalous liquidity routing.", goalEn: "Demonstrate anti-money-laundering protocol compliance." },
    { id: 'rp_c1_4', scenarioTitle: "Executive Boardroom Crisis [C1]", aiRoleEn: "Board Chairman", userRoleEn: "Interim CEO", initialAiMessage: "Stock prices dropped 18% following the product recall announcement.", goalEn: "Present restructuring roadmap and restore board confidence." },
    { id: 'rp_c1_5', scenarioTitle: "Hostile Takeover Defense [C1]", aiRoleEn: "Activist Investor", userRoleEn: "Corporate Secretary", initialAiMessage: "We have acquired a 12% stake and demand board seat reallocation.", goalEn: "Structure poison-pill defense mechanisms while maintaining shareholder dialogue." },
    { id: 'rp_c1_6', scenarioTitle: "International Patent Litigation [C1]", aiRoleEn: "Opposing Counsel", userRoleEn: "IP Litigation Partner", initialAiMessage: "Your client's chipset architecture infringes upon our patent claims.", goalEn: "Demonstrate prior-art evidence and negotiate cross-licensing terms." },
    { id: 'rp_c1_7', scenarioTitle: "Sovereignty Fund Investment [C1]", aiRoleEn: "Sovereign Fund Advisor", userRoleEn: "Infrastructure Lead", initialAiMessage: "We require 51% voting rights in exchange for funding the port expansion.", goalEn: "Protect national strategic asset ownership while securing capital." },
    { id: 'rp_c1_8', scenarioTitle: "Ethical AI Governance Review [C1]", aiRoleEn: "Ethics Board Chair", userRoleEn: "Chief AI Scientist", initialAiMessage: "Your LLM model exhibits persistent demographic bias in credit scoring.", goalEn: "Detail algorithmic auditing protocols and debiasing retraining procedures." },
    { id: 'rp_c1_9', scenarioTitle: "Global Supply Chain Re-shoring [C1]", aiRoleEn: "Chief Supply Chain Officer", userRoleEn: "Geopolitical Risk Analyst", initialAiMessage: "Rising trade tariffs necessitate relocating semiconductor manufacturing.", goalEn: "Present risk-adjusted analysis for near-shoring vs domestic subsidies." },
    { id: 'rp_c1_10', scenarioTitle: "Corporate Restructuring Settlement [C1]", aiRoleEn: "Labor Union Negotiator", userRoleEn: "HR Vice President", initialAiMessage: "Proposed severance packages fail to compensate long-tenured factory staff.", goalEn: "Negotiate retrenchment benefits avoiding industrial strike action." },
    { id: 'rp_c1_11', scenarioTitle: "Supranational Climate Treaty Mandate [C1]", aiRoleEn: "UN Climate Envoy", userRoleEn: "Minister of Energy", initialAiMessage: "Your national emission reduction targets lag behind Paris Agreement benchmarks.", goalEn: "Negotiate transition grace periods based on developing economy burdens." },
    { id: 'rp_c1_12', scenarioTitle: "Fintech Regulatory Sandbox Application [C1]", aiRoleEn: "Central Bank Sandbox Lead", userRoleEn: "Fintech CTO", initialAiMessage: "Your decentralized lending protocol raises systemic liquidity risk concerns.", goalEn: "Detail algorithmic collateralization caps and automated circuit breakers." },
    { id: 'rp_c1_13', scenarioTitle: "Antitrust Data Monopolization Hearings [C1]", aiRoleEn: "Congressional Committee Chair", userRoleEn: "Big Tech General Counsel", initialAiMessage: "Your proprietary data moat effectively prevents competitive entry.", goalEn: "Argue consumer welfare benefits and open API data interoperability initiatives." },
    { id: 'rp_c1_14', scenarioTitle: "Cross-Border Tax Arbitrage Audit [C1]", aiRoleEn: "OECD Tax Inspector", userRoleEn: "Head of Global Tax", initialAiMessage: "Transfer pricing models shift IP royalties to low-tax jurisdictions artificially.", goalEn: "Defend economic substance documentation for global R&D centers." },
    { id: 'rp_c1_15', scenarioTitle: "Pharma Clinical Trial Phase III Debrief [C1]", aiRoleEn: "FDA Review Board Chair", userRoleEn: "VP of Medical Research", initialAiMessage: "Secondary efficacy endpoints failed to achieve statistical significance.", goalEn: "Defend primary endpoint robustness and propose sub-population label narrowing." },
    { id: 'rp_c1_16', scenarioTitle: "Sovereign Bond Restructuring [C1]", aiRoleEn: "Bondholder Committee Lead", userRoleEn: "Deputy Finance Minister", initialAiMessage: "A 30% haircut on principal is unacceptable to commercial lenders.", goalEn: "Negotiate maturity extensions with coupon rate adjustments avoiding default." },
    { id: 'rp_c1_17', scenarioTitle: "Defense Procurement Contract Bid [C1]", aiRoleEn: "Ministry of Defense Acquisition Director", userRoleEn: "Aerospace Sales Director", initialAiMessage: "Competitor bids offer lower unit costs for radar system maintenance.", goalEn: "Emphasize lifecycle reliability metrics and local technology transfer commitments." },
    { id: 'rp_c1_18', scenarioTitle: "Corporate Governance Proxy Contest [C1]", aiRoleEn: "Institutional Shareholder Proxy", userRoleEn: "Lead Independent Director", initialAiMessage: "We intend to vote against re-electing the incumbent Audit Committee Chair.", goalEn: "Present financial oversight reforms and defend committee composition." },
    { id: 'rp_c1_19', scenarioTitle: "Transnational Subsea Telecom License [C1]", aiRoleEn: "Telecommunications Regulator", userRoleEn: "Consortium Legal Lead", initialAiMessage: "National security landing rights require physical traffic monitoring access.", goalEn: "Propose encrypted landing station architecture adhering to sovereignty laws." },
    { id: 'rp_c1_20', scenarioTitle: "Crisis Communication - CEO Resignation [C1]", aiRoleEn: "Senior Financial Journalist", userRoleEn: "Head of Investor Relations", initialAiMessage: "Market rumors claim the sudden CEO exit stems from internal financial audits.", goalEn: "Deliver measured official statement maintaining corporate governance integrity." }
  ],
  C2: [
    { id: 'rp_c2_1', scenarioTitle: "Antitrust Litigation [C2]", aiRoleEn: "Regulator Chair", userRoleEn: "Chief Legal Officer", initialAiMessage: "The proposed merger violates competition laws regarding market dominance.", goalEn: "Structure a compliance package mitigating antitrust concerns." },
    { id: 'rp_c2_2', scenarioTitle: "Extraterritorial Sovereignty Dispute [C2]", aiRoleEn: "UN Tribunal Judge", userRoleEn: "Special Envoy", initialAiMessage: "Your nation's unilateral maritime sanctuary breaches international waters law.", goalEn: "Deconstruct jurisdictional legal precedents and assert environmental treaties." },
    { id: 'rp_c2_3', scenarioTitle: "Quantum Encryption Mandate [C2]", aiRoleEn: "National Security Director", userRoleEn: "Chief Information Security Officer", initialAiMessage: "Immediate post-quantum cryptographic migration is mandatory across infrastructure.", goalEn: "Articulate legacy systems migration risks and secure multi-billion funding." },
    { id: 'rp_c2_4', scenarioTitle: "Central Bank Rate Policy Emergency [C2]", aiRoleEn: "Federal Reserve Governor", userRoleEn: "Chief Economist", initialAiMessage: "Stagflation indicators demand an aggressive 100-basis-point rate hike.", goalEn: "Debate liquidity shock risks against runaway currency devaluation." },
    { id: 'rp_c2_5', scenarioTitle: "Pharmaceutical Royalty Arbitration [C2]", aiRoleEn: "Arbitration Panelist", userRoleEn: "Biotech General Counsel", initialAiMessage: "Claimant alleges sub-licensing breaches regarding gene-therapy patents.", goalEn: "Deconstruct contract drafting ambiguities and defend royalty structures." },
    { id: 'rp_c2_6', scenarioTitle: "Supranational Carbon Credit Dispute [C2]", aiRoleEn: "Climate Treaty Commissioner", userRoleEn: "Minister of Energy", initialAiMessage: "Your national forestry offsets fail rigorous international additionality standards.", goalEn: "Defend remote-sensing satellite verification data and secure credit allocations." },
    { id: 'rp_c2_7', scenarioTitle: "Sovereign Debt Restructuring [C2]", aiRoleEn: "IMF Mission Chief", userRoleEn: "Finance Minister", initialAiMessage: "Debt relief is contingent upon immediate austerity measures and state asset sales.", goalEn: "Resist destabilizing social cutbacks while negotiating extended bond maturities." },
    { id: 'rp_c2_8', scenarioTitle: "Deepfake National Security Crisis [C2]", aiRoleEn: "Head of Intelligence", userRoleEn: "Cyber Warfare Commander", initialAiMessage: "Manipulated audio of military commands threatens state stability.", goalEn: "Deploy emergency cryptographic authentication and counter-disinformation protocol." },
    { id: 'rp_c2_9', scenarioTitle: "Transnational Trade Sanctions Neutrality [C2]", aiRoleEn: "Foreign Trade Minister", userRoleEn: "Corporate Compliance Director", initialAiMessage: "Secondary sanctions penalize transactions through non-aligned financial hubs.", goalEn: "Structure multi-currency clearing mechanisms maintaining compliance integrity." },
    { id: 'rp_c2_10', scenarioTitle: "Post-Humanist Bioethics Treaty [C2]", aiRoleEn: "Global Bioethics Council Chair", userRoleEn: "Genetic Engineering Pioneer", initialAiMessage: "Commercial deployment of germline neural augmentations breaches human dignity conventions.", goalEn: "Deconstruct philosophical bio-essentialism and defend therapeutic enhancement." },
    { id: 'rp_c2_11', scenarioTitle: "WTO Carbon Border Tax Litigation [C2]", aiRoleEn: "WTO Appellate Body Judge", userRoleEn: "Trade Representative", initialAiMessage: "Carbon border tariffs violate non-discrimination principles under GATT Article III.", goalEn: "Defend environmental exception clauses under GATT Article XX." },
    { id: 'rp_c2_12', scenarioTitle: "Algorithmic Market Collusion Hearing [C2]", aiRoleEn: "Federal Trade Commissioner", userRoleEn: "Fintech Chief Algorithmist", initialAiMessage: "Self-learning pricing algorithms established tacit market price fixing without explicit human agreement.", goalEn: "Deconstruct intent requirements under legacy antitrust jurisprudence." },
    { id: 'rp_c2_13', scenarioTitle: "Space Resource Extraction Claims [C2]", aiRoleEn: "International Space Treaty Chair", userRoleEn: "Asteroid Mining Legal Director", initialAiMessage: "Unilateral lunar regolith extraction violates Outer Space Treaty non-appropriation principles.", goalEn: "Argue resource extraction rights under sovereign maritime high-seas mining analogies." },
    { id: 'rp_c2_14', scenarioTitle: "De-territorialized Digital Citizenship [C2]", aiRoleEn: "Constitutional Law Committee Lead", userRoleEn: "Digital Sovereign Ambassador", initialAiMessage: "Issuing blockchain-verified digital citizenship subverts national territorial taxation.", goalEn: "Assert post-national governance models based on voluntary cryptographic consensus." },
    { id: 'rp_c2_15', scenarioTitle: "Thermodynamic Air Capture Scaling Debrief [C2]", aiRoleEn: "National Science Foundation Board", userRoleEn: "Planetary Geoengineering Lead", initialAiMessage: "Direct air capture energy demands breach realistic planetary grid capacity ceilings.", goalEn: "Defend dedicated modular nuclear micro-reactor energy architecture." },
    { id: 'rp_c2_16', scenarioTitle: "Synthetic Biology Bioremediation Jurisdiction [C2]", aiRoleEn: "International Maritime Court Lead", userRoleEn: "Ecological Restoration Counsel", initialAiMessage: "Releasing engineered plastic-eating microbes in international waters breaches bio-containment laws.", goalEn: "Demonstrate self-terminating genetic kill-switches in deployed synthetic strains." },
    { id: 'rp_c2_17', scenarioTitle: "Subsea Fiber Optic Sabotage Arbitration [C2]", aiRoleEn: "International Arbitration President", userRoleEn: "State Telecom Counsel", initialAiMessage: "Evidence points to state-sponsored anchor dragging damaging international data backbones.", goalEn: "Present hydro-acoustic telemetry evidence and demand reparations." },
    { id: 'rp_c2_18', scenarioTitle: "Fiat Credit Creation Limits Debate [C2]", aiRoleEn: "Central Bank Board Member", userRoleEn: "Heterodox Monetary Economist", initialAiMessage: "Continuous sovereign debt monetization threatens systemic reserve currency hyper-inflation.", goalEn: "Propose resource-backed thermodynamic reserve currency metrics." },
    { id: 'rp_c2_19', scenarioTitle: "Autonomous Military Kill-Switch Mandate [C2]", aiRoleEn: "Defense Committee Chairman", userRoleEn: "Autonomous Systems Commander", initialAiMessage: "Decentralized AI swarm drones must maintain continuous human kill-switch telemetry.", goalEn: "Explain electromagnetic warfare jamming vulnerabilities necessitating fully autonomous engagement." },
    { id: 'rp_c2_20', scenarioTitle: "Neurotelemetry Commercial Harvesting Limits [C2]", aiRoleEn: "Cognitive Rights Commissioner", userRoleEn: "Neurotech General Counsel", initialAiMessage: "Harvesting passive subconscious neural responses via BCI headsets violates cognitive liberty.", goalEn: "Propose zero-knowledge proof neural telemetry aggregation standards." }
  ]
};

// ⚡ LẤY NGAY 1 ĐỀ LOCAL KHÔNG TRÙNG (0.01s)
export function getInstantRoleplayScenario(cefrLevel: string = 'A1'): RoleplayScenario {
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const pool = LOCAL_ROLEPLAY_POOL[levelKey] || LOCAL_ROLEPLAY_POOL['A1'];
  
  const filtered = pool.filter(item => !sessionUsedRoleplayTexts.has(item.scenarioTitle.toLowerCase()));
  const selected = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : pool[Math.floor(Math.random() * pool.length)];
  
  sessionUsedRoleplayTexts.add(selected.scenarioTitle.toLowerCase());
  return { ...selected, id: `instant_rp_${Date.now()}_${Math.random()}` };
}

// ⚡ GỌI GROQ AI NGẦM ĐỂ CẬP NHẬT ĐỀ CHI TIẾT
export async function generateRoleplayScenario(cefrLevel: string = 'A1'): Promise<RoleplayScenario> {
  const uniqueSeed = `rp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedRoleplayTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Test Designer. Generate ONE Roleplay Scenario STRICTLY for Level ${levelKey}.
STRICT RULES:
${isLowLevel 
  ? `- Must be simple/intermediate. Include BOTH English AND Vietnamese translation fields (aiRoleVi, userRoleVi, goalVi).` 
  : `- MUST be executive/professional for ${levelKey}. 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE ANY VIETNAMESE (Vi) FIELDS.`
}
Return ONLY valid JSON matching:
{
  "scenarioTitle": "Title [${levelKey}]",
  "aiRoleEn": "Role 1 English",
  ${isLowLevel ? '"aiRoleVi": "Role 1 tiếng Việt",' : ''}
  "userRoleEn": "Role 2 English",
  ${isLowLevel ? '"userRoleVi": "Role 2 tiếng Việt",' : ''}
  "initialAiMessage": "English opening line",
  "goalEn": "Goal English",
  ${isLowLevel ? '"goalVi": "Goal tiếng Việt",' : ''}
}`;

  try {
    const apiCall = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a BRAND NEW Roleplay Scenario for CEFR [${levelKey}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList || 'None'}]` }
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
    const titleText = parsed.scenarioTitle || `Roleplay [${levelKey}]`;

    sessionUsedRoleplayTexts.add(titleText.toLowerCase());

    return {
      id: uniqueSeed,
      scenarioTitle: titleText,
      aiRoleEn: parsed.aiRoleEn || "Interlocutor",
      aiRoleVi: isLowLevel ? parsed.aiRoleVi : undefined,
      userRoleEn: parsed.userRoleEn || "Speaker",
      userRoleVi: isLowLevel ? parsed.userRoleVi : undefined,
      initialAiMessage: parsed.initialAiMessage || "Hello!",
      goalEn: parsed.goalEn || "Achieve goal",
      goalVi: isLowLevel ? parsed.goalVi : undefined
    };
  } catch (error) {
    return getInstantRoleplayScenario(cefrLevel);
  }
}