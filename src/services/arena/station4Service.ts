// src/services/arena/station4Service.ts

export interface Station4Scenario {
  id: string;
  title: string;
  context: string;
  requirement: string;
}

// Bảng kịch bản độc lập cho Trạm 4 (Speaking Express)
const STATION_4_DATA: Record<string, Station4Scenario[]> = {
  A1: [
    {
      id: 's4_a1_1',
      title: '⚡ TRẢ LỜI LỊCH TRÌNH',
      context: 'A coworker asks: "What time is our team meeting today, and where is it held?"',
      requirement: 'Hãy phản hồi ngắn gọn về thời gian và địa điểm cuộc họp bằng tiếng Anh.'
    }
  ],
  A2: [
    {
      id: 's4_a2_1',
      title: '⚡ ĐỔI LỊCH HẸN',
      context: 'A client calls: "Can we move our appointment to 3 PM tomorrow instead of today?"',
      requirement: 'Hãy xác nhận đồng ý hoặc đưa ra mốc thời gian phù hợp.'
    }
  ],
  B1: [
    {
      id: 's4_b1_1',
      title: '⚡ XỬ LÝ SỰ CỐ DỰ ÁN',
      context: 'Your manager says: "The client reported an issue with the recent update. What is your immediate action plan?"',
      requirement: 'Hãy giải thích ngắn gọn các bước xử lý ban đầu và thời gian hoàn thành.'
    }
  ],
  B2: [
    {
      id: 's4_b2_1',
      title: '⚡ BÁO CÁO DỰ KIẾN KỸ THUẬT',
      context: 'The product manager asks: "We encountered an audio processing delay. What is your estimated timeline and fix steps?"',
      requirement: 'Hãy trình bày thời gian dự kiến (timeline) và các bước khắc phục sự cố bằng tiếng Anh.'
    },
    {
      id: 's4_b2_2',
      title: '⚡ GIẢI TRÌNH BẢO TRÌ HỆ THỐNG',
      context: 'A partner asks: "Why is the application undergoing maintenance, and when will it be fully operational?"',
      requirement: 'Nêu nguyên nhân ngắn gọn và cam kết thời hạn hoàn tất dịch vụ.'
    }
  ],
  C1: [
    {
      id: 's4_c1_1',
      title: '⚡ THƯƠNG LƯỢNG NÂNG CẤP',
      context: 'The CTO asks: "Upgrading to Whisper Large V3 increases server costs. How do you justify this investment?"',
      requirement: 'Lập luận ưu điểm về độ chính xác bóc tách giọng nói để thuyết phục nâng cấp.'
    }
  ],
  C2: [
    {
      id: 's4_c2_1',
      title: '⚡ QUẢN TRỊ KHỦNG HOẢNG',
      context: 'A major stakeholder demands: "The live feature failed during the launch event. What is your emergency strategy?"',
      requirement: 'Đưa ra tuyên bố ứng biến khủng hoảng chuyên nghiệp và lộ trình khắc phục.'
    }
  ]
};

export async function generateStation4Scenario(cefrLevel: string): Promise<Station4Scenario> {
  const list = STATION_4_DATA[cefrLevel] || STATION_4_DATA['B2'];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}