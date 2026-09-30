// src/services/arena/drillService.ts

export interface MinimalPair {
  id: string;
  word1: string;
  word2: string;
  displayTitle: string;
  ipa: string;
  meaning: string;
  tip: string;
  ttsText1: string; 
  ttsText2: string; 
  ttsAudioText: string; 
}

// BẢNG DỮ LIỆU ĐẦY ĐỦ TẦNG 1 (MINIMAL PAIRS)
export const TIER_1_MINIMAL_PAIRS: MinimalPair[] = [
  {
    id: 'mp_read_reed',
    word1: 'Read (past)',
    word2: 'Reed',
    displayTitle: '"Read / Reed"',
    ipa: '/rɛd/ - /riːd/',
    meaning: 'đã đọc (quá khứ) / cây lau',
    tip: 'Read (quá khứ) dùng âm /ɛ/ ngắn (giống Red), Reed dùng âm /iː/ dài.',
    ttsText1: 'red',
    ttsText2: 'reed',
    ttsAudioText: 'red . . . reed' // Dấu chấm tạo khoảng ngắt giúp máy phát rõ từng âm
  },
  {
    id: 'mp_lead_led',
    word1: 'Lead (verb)',
    word2: 'Led',
    displayTitle: '"Lead / Led"',
    ipa: '/liːd/ - /lɛd/',
    meaning: 'dẫn dắt / đã dẫn dắt',
    tip: 'Lead (động từ) dùng âm /iː/ dài, Led dùng âm /ɛ/ ngắn.',
    ttsText1: 'leed',
    ttsText2: 'led',
    ttsAudioText: 'leed . . . led'
  },
  {
    id: 'mp_ship_sheep',
    word1: 'Ship',
    word2: 'Sheep',
    displayTitle: '"Ship / Sheep"',
    ipa: '/ʃɪp/ - /ʃiːp/',
    meaning: 'con tàu / con cừu',
    tip: 'Ship dùng âm /ɪ/ thả lỏng môi, Sheep kéo dài âm /iː/ như đang mỉm cười.',
    ttsText1: 'ship',
    ttsText2: 'sheep',
    ttsAudioText: 'ship . . . sheep'
  },
  {
    id: 'mp_pen_pan',
    word1: 'Pen',
    word2: 'Pan',
    displayTitle: '"Pen / Pan"',
    ipa: '/pɛn/ - /pæn/',
    meaning: 'cây bút / cái chảo',
    tip: 'Pen dùng âm /ɛ/ mở vừa, Pan dùng âm /æ/ mở rộng miệng.',
    ttsText1: 'pen',
    ttsText2: 'pan',
    ttsAudioText: 'pen . . . pan'
  },
  {
    id: 'mp_bit_beat',
    word1: 'Bit',
    word2: 'Beat',
    displayTitle: '"Bit / Beat"',
    ipa: '/bɪt/ - /biːt/',
    meaning: 'mảnh nhỏ / đánh, nhịp',
    tip: 'Bit dùng âm /ɪ/ ngắn bật nhanh, Beat kéo dài nguyên âm /iː/.',
    ttsText1: 'bit',
    ttsText2: 'beet',
    ttsAudioText: 'bit . . . beet'
  },
  {
    id: 'mp_sit_seat',
    word1: 'Sit',
    word2: 'Seat',
    displayTitle: '"Sit / Seat"',
    ipa: '/sɪt/ - /siːt/',
    meaning: 'ngồi / chỗ ngồi',
    tip: 'Sit dùng âm /ɪ/ dứt khoát, Seat kéo dài âm /iː/.',
    ttsText1: 'sit',
    ttsText2: 'seet',
    ttsAudioText: 'sit . . . seet'
  },
  {
    id: 'mp_bad_bed',
    word1: 'Bad',
    word2: 'Bed',
    displayTitle: '"Bad / Bed"',
    ipa: '/bæd/ - /bɛd/',
    meaning: 'tệ / cái giường',
    tip: 'Bad dùng âm /æ/ hạ hàm sâu, Bed dùng âm /ɛ/ mở miệng tự nhiên.',
    ttsText1: 'bad',
    ttsText2: 'bed',
    ttsAudioText: 'bad . . . bed'
  },
  {
    id: 'mp_cat_cut',
    word1: 'Cat',
    word2: 'Cut',
    displayTitle: '"Cat / Cut"',
    ipa: '/kæt/ - /kʌt/',
    meaning: 'con mèo / cắt',
    tip: 'Cat dùng âm /æ/, Cut dùng âm /ʌ/ bật ngắn từ cổ họng.',
    ttsText1: 'cat',
    ttsText2: 'cut',
    ttsAudioText: 'cat . . . cut'
  }
];

// MẸO TRÁNH LẶP BÀI TẬP: Lưu danh sách các ID đã xuất hiện
let usedPairIds: string[] = [];

/**
 * Lấy bài tập Minimal Pair tiếp theo KHÔNG LẶP LẠI
 */
export function getNextMinimalPair(currentId?: string): MinimalPair {
  // Nếu đã học hết tất cả các cặp, reset lại danh sách trừ bài hiện tại
  if (usedPairIds.length >= TIER_1_MINIMAL_PAIRS.length) {
    usedPairIds = currentId ? [currentId] : [];
  }

  // Lọc ra các bài chưa xuất hiện
  const availablePairs = TIER_1_MINIMAL_PAIRS.filter(
    (pair) => !usedPairIds.includes(pair.id) && pair.id !== currentId
  );

  if (availablePairs.length === 0) {
    return TIER_1_MINIMAL_PAIRS[0];
  }

  const randomIndex = Math.floor(Math.random() * availablePairs.length);
  const selectedPair = availablePairs[randomIndex];

  // Đánh dấu đã dùng
  usedPairIds.push(selectedPair.id);

  return selectedPair;
}