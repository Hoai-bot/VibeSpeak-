// src/constants/phoneticMap.ts

export interface PhoneticDetail {
  word: string;
  targetIpa: string;
  trapMap?: Record<string, { heardIpa: string; tip: string }>;
}

export const PHONETIC_DICTIONARY: Record<string, PhoneticDetail> = {
  // Cặp /iː/ vs /ɪ/
  'leave': {
    word: 'leave',
    targetIpa: '/liːv/',
    trapMap: {
      'live': { heardIpa: '/lɪv/', tip: 'Kéo dài khóe miệng sang hai bên và giữ hơi lâu hơn cho âm /iː/.' },
      'leaf': { heardIpa: '/liːf/', tip: 'Rung dây thanh quản ở âm đuôi /v/, tránh thổi hơi thành /f/.' }
    }
  },
  'live': {
    word: 'live',
    targetIpa: '/lɪv/',
    trapMap: {
      'alive': { heardIpa: '/laɪv/', tip: 'Đây là động từ /lɪv/ (ngắn, dứt khoát), không đọc thành tính từ /laɪv/.' },
      'life': { heardIpa: '/laɪf/', tip: 'Thả lỏng cơ miệng, phát âm /ɪ/ ngắn gọn như tiếng "i" giật nhẹ.' },
      'leave': { heardIpa: '/liːv/', tip: 'Đừng kéo dài âm quá mức; giữ âm /ɪ/ dứt khoát.' }
    }
  },
  'sheep': {
    word: 'sheep',
    targetIpa: '/ʃiːp/',
    trapMap: {
      'ship': { heardIpa: '/ʃɪp/', tip: 'Căng cơ môi cười và kéo dài âm /iː/.' },
      'cheap': { heardIpa: '/tʃiːp/', tip: 'Chu môi nhẹ thổi hơi đều cho âm /ʃ/, không bật tắc thành /tʃ/.' }
    }
  },
  'ship': {
    word: 'ship',
    targetIpa: '/ʃɪp/',
    trapMap: {
      'sheep': { heardIpa: '/ʃiːp/', tip: 'Rút ngắn thời gian phát âm; âm /ɪ/ phải hạ giọng dứt khoát.' }
    }
  },

  // Cặp /aɪ/ vs /ɪ/ & bẫy âm câm
  'vine': {
    word: 'vine',
    targetIpa: '/vaɪn/',
    trapMap: {
      'vin': { heardIpa: '/vɪn/', tip: 'Mở rộng khẩu hình từ /a/ trượt dần lên /ɪ/ cho nguyên âm đôi /aɪ/.' },
      'vina': { heardIpa: '/viːnə/', tip: 'Đuôi -e là âm câm! Khép khẩu hình tại răng-môi và ngắt dứt khoát ở /n/.' },
      'fine': { heardIpa: '/faɪn/', tip: 'Cắn nhẹ môi dưới và rung dây thanh quản để tạo âm /v/.' }
    }
  },
  'fine': {
    word: 'fine',
    targetIpa: '/faɪn/',
    trapMap: {
      'fin': { heardIpa: '/fɪn/', tip: 'Nguyên âm đôi /aɪ/ cần phát âm rõ cả 2 pha: mở miệng /a/ và khép nhẹ lên /ɪ/.' },
      'fina': { heardIpa: '/fiːnə/', tip: 'Đuôi -e là âm câm! Không phát âm thêm âm tiết /nə/.' },
      'vine': { heardIpa: '/vaɪn/', tip: 'Âm /f/ là âm vô thanh (không rung cổ họng), chỉ thổi hơi qua kẽ răng-môi.' }
    }
  },

  // Cặp /e/ vs /æ/
  'bed': {
    word: 'bed',
    targetIpa: '/bed/',
    trapMap: {
      'bad': { heardIpa: '/bæd/', tip: 'Khẩu hình mở vừa phải, không hạ hàm quá sâu.' }
    }
  },
  'bad': {
    word: 'bad',
    targetIpa: '/bæd/',
    trapMap: {
      'bed': { heardIpa: '/bed/', tip: 'Hạ hàm dưới sâu và căng góc miệng để tạo âm bẹt /æ/.' }
    }
  },

  // Cặp /θ/ vs /s/
  'think': {
    word: 'think',
    targetIpa: '/θɪŋk/',
    trapMap: {
      'sink': { heardIpa: '/sɪŋk/', tip: 'Đặt đầu lưỡi giữa hai hàm răng và đẩy luồng hơi ra, không thụt lưỡi vào trong.' },
      'tin': { heardIpa: '/tɪn/', tip: 'Đây là âm ma sát thổi hơi /θ/, không bật tắc thành /t/.' }
    }
  },
  'sink': {
    word: 'sink',
    targetIpa: '/sɪŋk/',
    trapMap: {
      'think': { heardIpa: '/θɪŋk/', tip: 'Khép răng và để lưỡi phía sau chân răng trên khi thổi âm /s/.' }
    }
  }
};

/**
 * 🎯 Phân tích đối chiếu IPA thực tế giữa từ mục tiêu và từ AI nhận diện
 */
export function getPhoneticComparison(targetWord: string, actualTranscript: string) {
  const cleanTarget = targetWord.toLowerCase().replace(/[^a-z]/g, '');
  const transcriptWords = actualTranscript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  
  const dictEntry = PHONETIC_DICTIONARY[cleanTarget];
  if (!dictEntry) {
    return {
      targetWord: cleanTarget,
      targetIpa: `/${cleanTarget}/`,
      heardIpa: null,
      tip: null,
      isExactMatch: transcriptWords.includes(cleanTarget)
    };
  }

  // Nếu người học phát âm trúng từ mục tiêu
  if (transcriptWords.includes(cleanTarget)) {
    return {
      targetWord: cleanTarget,
      targetIpa: dictEntry.targetIpa,
      heardIpa: dictEntry.targetIpa,
      tip: 'Khẩu hình chuẩn xác!',
      isExactMatch: true
    };
  }

  // Tìm xem người học rơi vào bẫy âm nào
  if (dictEntry.trapMap) {
    for (const trapKey of Object.keys(dictEntry.trapMap)) {
      if (transcriptWords.includes(trapKey)) {
        return {
          targetWord: cleanTarget,
          targetIpa: dictEntry.targetIpa,
          heardIpa: dictEntry.trapMap[trapKey].heardIpa,
          tip: dictEntry.trapMap[trapKey].tip,
          isExactMatch: false
        };
      }
    }
  }

  // Trường hợp đọc lệch chưa xác định cụ thể
  return {
    targetWord: cleanTarget,
    targetIpa: dictEntry.targetIpa,
    heardIpa: '/???/',
    tip: 'Âm phát ra chưa rõ nét. Hãy nghe lại âm mẫu và chú ý khẩu hình môi/lưỡi.',
    isExactMatch: false
  };
}