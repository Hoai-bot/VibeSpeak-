// src/data/station2ScenarioBank.ts

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Station2Tier = 'SOLO' | 'RELAY' | 'ROLEPLAY';

export interface ScenarioTemplate {
  title: string;
  context: string;
  prompt: string;
}

// 🎯 KHO DỮ LIỆU ĐỘC LẬP: CHUẨN XÁC THEO BẢN CHẤT 3 TẦNG PHẢN XẠ TRẠM 2
export const STATION2_PRESET_BANK: Record<string, ScenarioTemplate[]> = {
  // ==================== TẦNG 1: SOLO (CÁ NHÂN PHẢN XẠ) ====================
  'SOLO_A1': [
    { title: "Hỏi thăm địa điểm siêu thị", context: "Một du khách hỏi bạn đường đi bộ đến siêu thị tiện lợi gần nhất.", prompt: "Turn right at the traffic lights and walk two hundred meters; it is next to the pharmacy." },
    { title: "Gọi món ăn trưa mang đi", context: "Bạn vào quán ăn nhanh và gọi 1 phần cơm gà cùng một chai nước suối.", prompt: "Hello, can I please have one chicken rice combo to go and a bottle of mineral water?" },
    { title: "Nhờ người lạ xem giờ", context: "Điện thoại của bạn bị hết pin, bạn nhờ một người bên cạnh xem giúp mấy giờ.", prompt: "Excuse me, my phone battery is completely dead. Do you happen to know what time it is?" },
    { title: "Xin lỗi vì đến lớp trễ", context: "Bạn bước vào lớp trễ 10 phút vì xe hỏng xăm, giải thích ngắn gọn với thầy cô.", prompt: "I sincerely apologize for being late today, teacher; my motorbike had a flat tire on the way." },
    { title: "Hỏi giá chiếc áo khoác", context: "Bạn đang trong cửa hàng quần áo và muốn hỏi giá chiếc áo gió màu xanh.", prompt: "Excuse me, could you tell me how much this blue jacket costs?" },
    { title: "Giới thiệu món Phở Việt Nam", context: "Người bạn nước ngoài hỏi nên thử món ăn truyền thống nào đầu tiên tại Hà Nội.", prompt: "You definitely should try traditional Beef Pho with fresh herbs; it is absolutely delicious." },
    { title: "Hỏi mượn bút chì trong giờ học", context: "Bút bi của bạn bị hết mực giữa giờ kiểm tra, hãy hỏi bạn cùng bàn.", prompt: "Excuse me, my pen ran out of ink. Could I borrow an extra pencil from you?" },
    { title: "Nhờ chụp ảnh kỷ niệm", context: "Bạn đang đứng trước nhà hát thành phố và nhờ người đi đường chụp giúp một tấm ảnh.", prompt: "Hello, would you mind taking a quick photo of me in front of the building?" }
  ],
  'SOLO_A2': [
    { title: "Từ chối lời mời tiệc cuối tuần", context: "Đồng nghiệp rủ bạn đi ăn lẩu tối thứ Bảy nhưng bạn phải về quê thăm ông bà.", prompt: "I would really love to join, but I have already promised to visit my grandparents this weekend." },
    { title: "Phản ánh món ăn bị nguội", context: "Đĩa mì xào vừa mang ra bị nguội ngắt, bạn gọi nhân viên phục vụ hỗ trợ lịch sự.", prompt: "Excuse me, my noodles are quite cold. Could you please ask the kitchen to heat them up for me?" },
    { title: "Hỏi đổi kích cỡ giày", context: "Đôi giày bạn vừa thử bị chật mũi ngón chân, bạn hỏi nhân viên xem có cỡ lớn hơn không.", prompt: "These shoes feel a bit tight around my toes. Do you have this model in a half size larger?" },
    { title: "Hỏi lịch xe buýt chuyến cuối", context: "Bạn hỏi nhân viên phòng vé xem chuyến xe buýt số 150 cuối cùng trong ngày chạy lúc mấy giờ.", prompt: "Good evening, could you tell me when the last bus number one hundred and fifty departs tonight?" },
    { title: "Hỏi về phụ phí dịch vụ", context: "Hóa đơn thanh toán tại quán ăn xuất hiện khoản phụ thu lạ, bạn hỏi nhân viên phục vụ.", prompt: "Excuse me, could you please clarify what this additional service charge on my receipt is for?" },
    { title: "Nhờ đồng nghiệp gửi tài liệu", context: "Bạn cần xem lại slide buổi họp sáng nay, hãy nhắn nhờ đồng nghiệp cùng nhóm.", prompt: "Hi Sarah, could you please email me the slide deck from this morning's presentation?" }
  ],
  'SOLO_B1': [
    { title: "Chất vấn chi phí triển khai dự án", context: "Trong buổi thuyết trình, khán giả hỏi giải pháp của nhóm có quá tốn kém kinh phí ban đầu không.", prompt: "While initial setup requires significant investment, operational savings over six months will completely offset the costs." },
    { title: "Thương lượng chia lại đầu việc nhóm", context: "Bạn nhận thấy khối lượng công việc phân bổ chưa đều, đề xuất trưởng nhóm chia lại công bằng.", prompt: "I propose we redistribute the technical research workload so that every team member contributes equally." },
    { title: "Giải trình nộp bài tập muộn", context: "Máy tính xách tay bị lỗi ổ cứng đột ngột lúc đang nộp luận văn, bạn gửi email giải trình.", prompt: "My computer suffered an unexpected drive failure an hour before the deadline; please find my verified draft attached." },
    { title: "Phỏng vấn: Điểm yếu cần khắc phục", context: "Nhà tuyển dụng hỏi về điểm yếu lớn nhất của bạn trong công việc và cách cải thiện.", prompt: "I sometimes focus excessively on minor details, so I now use time-blocking tools to maintain perspective on core milestones." },
    { title: "Từ chối yêu cầu làm việc ngoài giờ", context: "Quản lý nhờ bạn làm thêm vào tối Chủ Nhật nhưng bạn đã đăng ký lịch thi chứng chỉ ngoại ngữ.", prompt: "I am unable to cover the Sunday shift because I have a mandatory international certification examination scheduled." },
    { title: "Phản ánh tiến độ giao hàng chậm", context: "Gói quà sinh nhật đặt hỏa tốc bị trễ 2 ngày mà không có thông báo từ đơn vị vận chuyển.", prompt: "I specifically paid for priority delivery; could you investigate why my parcel has been delayed for two days without update?" },
    { title: "Thương lượng giá phòng trọ sinh viên", context: "Chủ nhà thông báo tăng tiền điện 20%, bạn đại diện các bạn cùng phòng xin xem xét lại.", prompt: "A twenty percent increase is substantial for our student budget; could we negotiate a more moderate adjustment?" }
  ],
  'SOLO_B2': [
    { title: "Thương thuyết dời hạn giao sản phẩm", context: "Khách hàng muốn bàn giao trước 1 tuần, bạn phải giải thích nguy cơ rủi ro bảo mật hệ thống.", prompt: "Accelerating deployment by a full week severely constrains our security audit cycle, risking critical vulnerabilities." },
    { title: "Tranh biện về làm việc từ xa (Remote Work)", context: "Phản hồi câu hỏi liệu chế độ làm việc từ xa có làm giảm tính gắn kết văn hóa doanh nghiệp.", prompt: "Remote arrangements enhance personal autonomy, yet preserving institutional cohesion requires structured hybrid sync points." },
    { title: "Giải quyết bất đồng chiến lược marketing", context: "Bạn thuyết phục ban giám đốc chuyển 40% ngân sách quảng cáo truyền thống sang các kênh video ngắn.", prompt: "Legacy print advertising no longer yields measurable conversion; reallocating forty percent toward short-form video delivers targeted ROI." },
    { title: "Từ chối tính năng phát sinh (Scope Creep)", context: "Khách hàng yêu cầu bổ sung 3 tính năng mới ngay trước thềm phát hành bản thử nghiệm.", prompt: "Incorporating additional scope at this stage threatens timeline integrity; we recommend scheduling these enhancements for phase two." }
  ],
  'SOLO_C1': [
    { title: "Xử lý khủng hoảng rò rỉ dữ liệu", context: "Là phát ngôn viên doanh nghiệp, phản hồi báo chí về tin đồn cơ sở dữ liệu khách hàng bị tấn công.", prompt: "Our incident response teams have isolated the perimeter, engaged third-party forensic auditors, and will provide transparent hourly updates." },
    { title: "Phản biện chính sách thuế carbon", context: "Tranh luận về việc áp thuế môi trường lên các nhà máy sản xuất linh kiện trong ngắn hạn.", prompt: "Unilateral fiscal penalties risk precipitating industrial offshoring unless coupled with domestic green technology tax credits." }
  ],
  'SOLO_C2': [
    { title: "Tranh biện đạo đức AI trong tư pháp", context: "Bình luận trước hội đồng khoa học về việc thuật toán thay thế thẩm phán đưa ra phán quyết.", prompt: "Algorithmic adjudication merely optimizes for historical empirical precedents, thereby formalizing systemic biases under the guise of neutrality." }
  ],

  // ==================== TẦNG 2: RELAY (TIẾP SỨC ĐỒNG ĐỘI) ====================
  'RELAY_A1': [
    { title: "Tiếp sức: Kế hoạch tiệc chia tay", context: "Bạn A: 'We should buy pizza and drinks.' -> Bạn B tiếp sức nối ý trang trí và âm nhạc.", prompt: "Great idea! I can bring some speakers and paper lanterns to decorate the patio." },
    { title: "Tiếp sức: Hoạt động cuối tuần", context: "Bạn A: 'I plan to ride my bicycle in the morning.' -> Bạn B tiếp sức nối ý hoạt động buổi chiều.", prompt: "Sounds refreshing! Afterward, we can visit the public library to study for next week's quiz." },
    { title: "Tiếp sức: Mua sắm đồ dùng học tập", context: "Bạn A: 'I need to buy two blue notebooks and pens.' -> Bạn B tiếp sức nhắc thêm dụng cụ vẽ.", prompt: "Do not forget to get an eraser and a long ruler for our geometry class tomorrow." }
  ],
  'RELAY_B1': [
    { title: "Tiếp sức: Chiến dịch truyền thông sự kiện", context: "Bạn A: 'Short video clips will grab student attention on Facebook.' -> Bạn B tiếp sức nối ý minigame quà tặng.", prompt: "Building directly upon that, we could host a weekly live giveaway session to drive organic viral engagement." },
    { title: "Tiếp sức: Giảm rác thải nhựa tại căng-tin", context: "Bạn A: 'The cafeteria must stop using disposable plastic cups.' -> Bạn B tiếp sức đề xuất giảm giá cho bình cá nhân.", prompt: "To make that policy effective, the administration should offer a ten percent discount for anyone bringing reusable tumblers." },
    { title: "Tiếp sức: Quản lý thời gian học tập", context: "Bạn A: 'Using digital calendar alerts prevents missing deadlines.' -> Bạn B tiếp sức phương pháp chia nhỏ nhiệm vụ.", prompt: "Additionally, breaking massive assignments into thirty-minute task intervals minimizes procrastination and mental exhaustion." }
  ],
  'RELAY_B2': [
    { title: "Tiếp sức: Triển khai mô hình xe điện đô thị", context: "Bạn A: 'Subsidizing electric motorbikes directly curbs urban emissions.' -> Bạn B tiếp sức hạ tầng trạm sạc & pin.", prompt: "Crucially, municipal planners must simultaneously expand standardized battery-swapping stations across major transit corridors." },
    { title: "Tiếp sức: Tối ưu hóa chuỗi cung ứng linh kiện", context: "Bạn A: 'Relying exclusively on overseas suppliers creates fragile bottlenecks.' -> Bạn B tiếp sức mô hình đối tác vệ tinh nội địa.", prompt: "Consequently, onboarding localized secondary vendors provides an essential operational buffer against geopolitical logistics halts." }
  ],

  // ==================== TẦNG 3: ROLEPLAY (NHẬP VAI 2 BẠN) ====================
  'ROLEPLAY_A1': [
    { title: "Nhập vai: Gọi món tại quán ăn nhanh", context: "Bạn là khách muốn gọi combo gà rán, nước suối và hỏi thanh toán qua mã QR.", prompt: "Hello, can I please order a fried chicken combo and pay using a mobile QR transfer?" },
    { title: "Nhập vai: Mua vé xem phim rạp", context: "Bạn là khách muốn mua 2 vé xem phim ca tối và hỏi chính sách vé ưu đãi cho sinh viên.", prompt: "Good afternoon, could I get two student tickets for the seven PM show with my university card?" }
  ],
  'ROLEPLAY_B1': [
    { title: "Nhập vai: Đổi đồ uống gấp tại sân bay", context: "Gọi trà đào đá nhưng nhận nhầm cà phê nóng, chuyến bay sắp cất cánh trong 10 phút.", prompt: "Excuse me, I ordered an iced peach tea, but I received hot cappuccino. Could you replace it quickly as my flight boards soon?" },
    { title: "Nhập vai: Xin gia hạn nộp bài tập lớn", context: "Máy chủ nhóm bị hỏng ổ cứng, bạn đại diện gặp giảng viên xin dời hạn nộp 24 giờ.", prompt: "Dear Professor, our team experienced an unexpected hardware crash last night. May we respectfully request a twenty-four hour extension?" },
    { title: "Nhập vai: Phàn nàn tiếng ồn khách sạn", context: "Phòng bên cạnh tiệc tùng gây ồn suốt đêm, bạn yêu cầu quản lý bồi hoàn thỏa đáng.", prompt: "The neighboring room held a loud party until four AM without intervention; I believe a concession on our final bill is warranted." }
  ],
  'ROLEPLAY_B2': [
    { title: "Nhập vai: Trưởng dự án & Khách hàng phản ánh tiến độ", context: "Khách hàng bức xúc vì tính năng báo cáo bị chậm 3 ngày, bạn đàm phán bàn giao từng phần.", prompt: "We acknowledge the module delay; to keep your team operating, we can deploy the core data export feature this afternoon." },
    { title: "Nhập vai: Ứng viên & Nhà tuyển dụng thương lượng lương", context: "Công ty đề xuất mức lương thấp hơn kỳ vọng 15%, bạn lập luận kinh nghiệm để thuyết phục.", prompt: "Given my direct experience managing similar cross-platform deployments, a ten percent upward adjustment accurately reflects the immediate value I deliver." }
  ]
};

// ⚡ BỘ SINH MỞ RỘNG TỰ ĐỘNG LÊN ĐẾN 50 TÌNH HUỐNG CHO MỖI CẤP ĐỘ (ZERO DELAY)
const CONTEXT_MODIFIERS = [
  "Yêu cầu phản xạ dứt khoát trong vòng 3 phút",
  "Đối phương đang tỏ thái độ sốt ruột và hoài nghi",
  "Tình huống diễn ra trong buổi họp trực tuyến quốc tế",
  "Bối cảnh diễn ra tại văn phòng đối tác đa quốc gia",
  "Bạn cần giữ phong thái hòa nhã nhưng lập luận kiên quyết",
  "Đối tác muốn có cam kết cụ thể bằng văn bản ngay lập tức",
  "Thời điểm diễn ra vào cuối giờ làm việc khi mọi người đều mệt mỏi",
  "Có sự hiện diện của giám đốc cấp cao đang theo dõi cuộc trao đổi"
];

export function getScenarioFromBank(tier: Station2Tier, level: CefrLevel, index: number) {
  const key = `${tier}_${level}`;
  const list = STATION2_PRESET_BANK[key] || STATION2_PRESET_BANK['SOLO_B1'];
  const base = list[index % list.length];
  const modifier = CONTEXT_MODIFIERS[index % CONTEXT_MODIFIERS.length];
  const variantNum = Math.floor(index / list.length) + 1;

  return {
    id: `preset_${tier}_${level}_${index}`,
    tier,
    level,
    title: variantNum > 1 ? `${base.title} (Trường hợp #${variantNum})` : base.title,
    contextDesc: `${base.context} [Bối cảnh phụ: ${modifier}].`,
    prompt: base.prompt,
    isTeacherAssigned: false
  };
}