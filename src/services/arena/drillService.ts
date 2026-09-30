// src/services/arena/drillService.ts

export interface MinimalPair {
  id: string;
  word1: string;
  word2: string;
  displayTitle: string;
  ipa: string;
  meaning: string;
  tip: string;
  ttsText1: string; // Chuỗi tối ưu âm cho từ 1
  ttsText2: string; // Chuỗi tối ưu âm cho từ 2
  ttsAudioText: string; // Chuỗi kết hợp cho máy đọc phát âm mẫu
}

// BẢNG DỮ LIỆU TẦNG 1 (MINIMAL PAIRS) CỦA TRẠM 1
export const TIER_1_MINIMAL_PAIRS: MinimalPair[] = [
  {
    id: 'mp_read_reed',
    word1: 'Read',
    word2: 'Reed',
    displayTitle: '"Read / Reed"',
    ipa: '/rɛd/ - /riːd/',
    meaning: 'read (past) / reed (plant)',
    tip: 'Read (past tense) uses short /ɛ/, Reed uses long vowel /iː/.',
    ttsText1: 'Red',   // 💡 'Red' ép TTS đọc chuẩn âm /rɛd/ ngắn
    ttsText2: 'Reed',  // 💡 'Reed' ép TTS đọc chuẩn âm /riːd/ dài
    ttsAudioText: 'Red, Reed'
  },
  {
    id: 'mp_lead_led',
    word1: 'Lead',
    word2: 'Led',
    displayTitle: '"Lead / Led"',
    ipa: '/liːd/ - /lɛd/',
    meaning: 'to guide / metal',
    tip: 'Lead (verb) uses long vowel /iː/, Led (noun) uses short /ɛ/.',
    ttsText1: 'Leed',  // 💡 'Leed' ép TTS đọc chuẩn âm /liːd/ dài
    ttsText2: 'Led',   // 💡 'Led' ép TTS đọc chuẩn âm /lɛd/ ngắn
    ttsAudioText: 'Leed, Led'
  },
  {
    id: 'mp_ship_sheep',
    word1: 'Ship',
    word2: 'Sheep',
    displayTitle: '"Ship / Sheep"',
    ipa: '/ʃɪp/ - /ʃiːp/',
    meaning: 'boat / animal',
    tip: 'Ship uses short /ɪ/, Sheep uses long vowel /iː/.',
    ttsText1: 'Ship',
    ttsText2: 'Sheep',
    ttsAudioText: 'Ship, Sheep'
  },
  {
    id: 'mp_pen_pan',
    word1: 'Pen',
    word2: 'Pan',
    displayTitle: '"Pen / Pan"',
    ipa: '/pɛn/ - /pæn/',
    meaning: 'writing tool / cooking pot',
    tip: 'Pen uses short /ɛ/, Pan uses open /æ/.',
    ttsText1: 'Pen',
    ttsText2: 'Pan',
    ttsAudioText: 'Pen, Pan'
  },
  {
    id: 'mp_bit_beat',
    word1: 'Bit',
    word2: 'Beat',
    displayTitle: '"Bit / Beat"',
    ipa: '/bɪt/ - /biːt/',
    meaning: 'small piece / to strike',
    tip: 'Bit uses short /ɪ/, Beat uses long vowel /iː/.',
    ttsText1: 'Bit',
    ttsText2: 'Beat',
    ttsAudioText: 'Bit, Beat'
  }
];

/**
 * Lấy danh sách ngẫu nhiên hoặc bài tập theo chỉ số cho Tier 1
 */
export function getRandomTier1Pair(): MinimalPair {
  const randomIndex = Math.floor(Math.random() * TIER_1_MINIMAL_PAIRS.length);
  return TIER_1_MINIMAL_PAIRS[randomIndex];
}

export function getTier1PairById(id: string): MinimalPair | undefined {
  return TIER_1_MINIMAL_PAIRS.find((item) => item.id === id);
}