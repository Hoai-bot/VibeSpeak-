// src/constants/phoneticTraps.ts

export interface PhoneticTrapRule {
  id: string;
  pair: [string, string]; // Cặp Minimal Pair mục tiêu
  trapKeywords: string[]; // Các từ/cụm từ Whisper bóc tách khi học viên phát âm sai
  scoreCap: number;       // Mức điểm trần phạt khi dính bẫy (ví dụ: 60 - 65đ)
  feedbackVi: string;     // Hướng dẫn khắc phục khẩu hình chi tiết
}

export const PHONETIC_TRAPS: PhoneticTrapRule[] = [
  // 1. BẪY LEAVE / LIVE (/iː/ vs /ɪ/) - Đọc nhầm thành /laɪv/
  {
    id: 'leave_live_laiv',
    pair: ['leave', 'live'],
    trapKeywords: ['alive', 'life', 'line', 'live stream', 'live music'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Từ "live" trong bài tập này là động từ, phát âm âm ngắn là /lɪv/ (như "lip"), không phát âm là /laɪv/ (như trong "livestream"). Hãy thử lại!',
  },

  // 2. BẪY VINE / FINE (/aɪ/ bị đọc ngắn thành /ɪ/ "vin fin")
  {
    id: 'vine_fine_short_vowel',
    pair: ['vine', 'fine'],
    trapKeywords: ['vin', 'fin', 'thin', 'pin', 'been', 'win'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Cặp từ "vine - fine" có nguyên âm đôi /aɪ/ (đọc là /vaɪn/ và /faɪn/). Bạn vừa phát âm thành âm ngắn /vɪn/ - /fɪn/ ("vin fin"). Hãy mở rộng khẩu hình và kéo dài âm /aɪ/ nhé!',
  },

  // 3. BẪY VINE / FINE (Đọc thừa âm đuôi kiểu Pháp/Latinh "vi-nê / phi-nê")
  {
    id: 'vine_fine_french_suffix',
    pair: ['vine', 'fine'],
    trapKeywords: [
      'vina', 'fina', 'vinay', 'finay', 'vienna', 
      'venice', 'finer', 'vener', 'vi ne', 'phi ne'
    ],
    scoreCap: 60,
    feedbackVi: '⚠️ Chú ý: Đuôi "-e" trong "vine" và "fine" là âm câm! Từ này chỉ có 1 âm tiết, phát âm là /vaɪn/ và /faɪn/ (không đọc tách thành 2 âm tiết "vi-nê / phi-nê"). Hãy ngắt dứt khoát ở âm cuối /n/ nhé!',
  },

  // 4. BẪY SHEEP / SHIP (/iː/ vs /ɪ/)
  {
    id: 'sheep_ship_confusion',
    pair: ['sheep', 'ship'],
    trapKeywords: ['shit', 'cheap', 'chip'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Phân biệt rõ âm /iː/ kéo dài môi dẹt trong "sheep" và âm /ɪ/ ngắn dứt khoát trong "ship".',
  },

  // 5. BẪY BED / BAD (/e/ vs /æ/)
  {
    id: 'bed_bad_confusion',
    pair: ['bed', 'bad'],
    trapKeywords: ['bat', 'bet', 'back'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: "bed" có nguyên âm /e/ mở vừa phải, còn "bad" có nguyên âm bẹt /æ/ hạ cằm sâu.',
  },

  // 6. BẪY THINK / SINK (/θ/ vs /s/)
  {
    id: 'think_sink_dental',
    pair: ['think', 'sink'],
    trapKeywords: ['thing', 'sing', 'tin', 'sin'],
    scoreCap: 65,
    feedbackVi: '⚠️ Chú ý: Âm /θ/ trong "think" cần đặt đầu lưỡi giữa hai hàm răng và thổi hơi, tránh phát âm thành /s/ ("sink") hoặc /t/ ("tin").',
  }
];

/**
 * 🎯 Hàm quét bẫy ngữ âm tự động
 */
export function detectPhoneticTrap(
  wordA: string,
  wordB: string,
  spokenWords: string[],
  rawTranscript: string
): PhoneticTrapRule | null {
  const wA = wordA.toLowerCase().trim();
  const wB = wordB.toLowerCase().trim();
  const lowerTranscript = rawTranscript.toLowerCase();

  for (const trap of PHONETIC_TRAPS) {
    const isTargetMatch =
      (trap.pair[0] === wA && trap.pair[1] === wB) ||
      (trap.pair[0] === wB && trap.pair[1] === wA);

    if (isTargetMatch) {
      const isTrapped = trap.trapKeywords.some((keyword) => {
        if (keyword.includes(' ')) {
          return lowerTranscript.includes(keyword);
        }
        return spokenWords.includes(keyword);
      });

      if (isTrapped) {
        return trap;
      }
    }
  }

  return null;
}