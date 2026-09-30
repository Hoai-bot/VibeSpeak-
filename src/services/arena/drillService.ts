// src/services/arena/drillService.ts

export interface Tier1Pair {
  id: string;
  word1: string;
  word2: string;
  displayTitle: string;
  ipa: string;
  meaning: string;
  tip: string;
  ttsAudioText: string;
}

export interface Tier2Linking {
  id: string;
  phrase: string;
  ipa: string;
  meaning: string;
  linkingTip: string;
  ttsAudioText: string;
}

export interface Tier3Twister {
  id: string;
  sentence: string;
  targetSound: string;
  tip: string;
  ttsAudioText: string;
}

// -------------------------------------------------------------
// KHO DỮ LIỆU TẦNG 1: MINIMAL PAIRS (CẶP ÂM DỄ NHẦM)
// -------------------------------------------------------------
export const TIER_1_DATA: Tier1Pair[] = [
  {
    id: 't1_read_reed',
    word1: 'Read (past)',
    word2: 'Reed',
    displayTitle: '"Read / Reed"',
    ipa: '/rɛd/ - /riːd/',
    meaning: 'đã đọc / cây lau',
    tip: 'Read (quá khứ) dùng âm /ɛ/ ngắn (giống Red), Reed dùng âm /iː/ dài.',
    ttsAudioText: 'red . . . reed'
  },
  {
    id: 't1_lead_led',
    word1: 'Lead (verb)',
    word2: 'Led',
    displayTitle: '"Lead / Led"',
    ipa: '/liːd/ - /lɛd/',
    meaning: 'dẫn dắt / đã dẫn dắt',
    tip: 'Lead (động từ) dùng âm /iː/ dài, Led dùng âm /ɛ/ ngắn.',
    ttsAudioText: 'leed . . . led'
  },
  {
    id: 't1_ship_sheep',
    word1: 'Ship',
    word2: 'Sheep',
    displayTitle: '"Ship / Sheep"',
    ipa: '/ʃɪp/ - /ʃiːp/',
    meaning: 'con tàu / con cừu',
    tip: 'Ship âm /ɪ/ ngắn, Sheep kéo dài âm /iː/ mỉm cười.',
    ttsAudioText: 'ship . . . sheep'
  },
  {
    id: 't1_pen_pan',
    word1: 'Pen',
    word2: 'Pan',
    displayTitle: '"Pen / Pan"',
    ipa: '/pɛn/ - /pæn/',
    meaning: 'cây bút / cái chảo',
    tip: 'Pen dùng âm /ɛ/, Pan dùng âm /æ/ hạ hàm rộng.',
    ttsAudioText: 'pen . . . pan'
  },
  {
    id: 't1_sit_seat',
    word1: 'Sit',
    word2: 'Seat',
    displayTitle: '"Sit / Seat"',
    ipa: '/sɪt/ - /siːt/',
    meaning: 'ngồi / chỗ ngồi',
    tip: 'Sit âm /ɪ/ dứt khoát, Seat kéo dài âm /iː/.',
    ttsAudioText: 'sit . . . seet'
  },
  {
    id: 't1_bad_bed',
    word1: 'Bad',
    word2: 'Bed',
    displayTitle: '"Bad / Bed"',
    ipa: '/bæd/ - /bɛd/',
    meaning: 'tệ / cái giường',
    tip: 'Bad âm /æ/ hạ hàm sâu, Bed âm /ɛ/ thả lỏng.',
    ttsAudioText: 'bad . . . bed'
  }
];

// -------------------------------------------------------------
// KHO DỮ LIỆU TẦNG 2: LINKING SOUNDS (NỐI ÂM TỰ NHIÊN)
// -------------------------------------------------------------
export const TIER_2_DATA: Tier2Linking[] = [
  {
    id: 't2_pick_it_up',
    phrase: 'Pick it up',
    ipa: '/pɪk kɪ tʌp/',
    meaning: 'nhặt nó lên',
    tip: 'Nối phụ âm /k/ sang /ɪ/ và /t/ biến âm nhẹ sang /ʌp/.',
    ttsAudioText: 'pick it up'
  },
  {
    id: 't2_check_it_out',
    phrase: 'Check it out',
    ipa: '/tʃɛ kɪ taʊt/',
    meaning: 'kiểm tra xem sao',
    tip: 'Nối /k/ từ Check sang /ɪt/ và /t/ mượt sang /aʊt/.',
    ttsAudioText: 'check it out'
  },
  {
    id: 't2_turn_it_off',
    phrase: 'Turn it off',
    ipa: '/tɜː nɪ tɒf/',
    meaning: 'tắt nó đi',
    tip: 'Nối phụ âm /n/ từ Turn sang /ɪt/ và /t/ sang /ɒf/.',
    ttsAudioText: 'turn it off'
  },
  {
    id: 't2_hold_on',
    phrase: 'Hold on',
    ipa: '/hoʊl dɒn/',
    meaning: 'chờ một chút',
    tip: 'Nối âm /d/ cuối từ Hold sang nguyên âm /ɒn/.',
    ttsAudioText: 'hold on'
  }
];

// -------------------------------------------------------------
// KHO DỮ LIỆU TẦNG 3: TONGUE TWISTERS (LÍU LỠI TRỰC DIỆN)
// -------------------------------------------------------------
export const TIER_3_DATA: Tier3Twister[] = [
  {
    id: 't3_she_sells',
    sentence: 'She sells seashells by the seashore',
    targetSound: 'Âm /ʃ/ vs /s/',
    tip: 'Chú ý phân biệt âm uốn lưỡi /ʃ/ (She, seashells) và âm răng /s/ (sells, seashore).',
    ttsAudioText: 'She sells seashells by the seashore'
  },
  {
    id: 't3_red_lorry',
    sentence: 'Red lorry, yellow lorry',
    targetSound: 'Âm /r/ vs /l/',
    tip: 'Tập trung phản xạ chuyển đổi nhanh giữa âm cuộn lưỡi /r/ và âm đầu lưỡi /l/.',
    ttsAudioText: 'Red lorry, yellow lorry'
  },
  {
    id: 't3_fresh_fish',
    sentence: 'Fresh fried fish, fish fresh fried',
    targetSound: 'Âm /f/ & /ʃ/',
    tip: 'Bật hơi rõ phụ âm /f/ và kết thúc dứt khoát với âm /ʃ/.',
    ttsAudioText: 'Fresh fried fish, fish fresh fried'
  }
];

// -------------------------------------------------------------
// QUẢN LÝ BỘ NHỚ LỊCH SỬ TRÁNH LẶP TỪ BẢN GHI ĐÃ CHƠI
// -------------------------------------------------------------
let usedTier1Ids: string[] = [];
let usedTier2Ids: string[] = [];
let usedTier3Ids: string[] = [];

export function getNextTier1(currentId?: string): Tier1Pair {
  if (usedTier1Ids.length >= TIER_1_DATA.length) usedTier1Ids = currentId ? [currentId] : [];
  const available = TIER_1_DATA.filter(item => !usedTier1Ids.includes(item.id) && item.id !== currentId);
  const selected = available[Math.floor(Math.random() * available.length)] || TIER_1_DATA[0];
  usedTier1Ids.push(selected.id);
  return selected;
}

export function getNextTier2(currentId?: string): Tier2Linking {
  if (usedTier2Ids.length >= TIER_2_DATA.length) usedTier2Ids = currentId ? [currentId] : [];
  const available = TIER_2_DATA.filter(item => !usedTier2Ids.includes(item.id) && item.id !== currentId);
  const selected = available[Math.floor(Math.random() * available.length)] || TIER_2_DATA[0];
  usedTier2Ids.push(selected.id);
  return selected;
}

export function getNextTier3(currentId?: string): Tier3Twister {
  if (usedTier3Ids.length >= TIER_3_DATA.length) usedTier3Ids = currentId ? [currentId] : [];
  const available = TIER_3_DATA.filter(item => !usedTier3Ids.includes(item.id) && item.id !== currentId);
  const selected = available[Math.floor(Math.random() * available.length)] || TIER_3_DATA[0];
  usedTier3Ids.push(selected.id);
  return selected;
}