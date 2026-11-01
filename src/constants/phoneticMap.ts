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

  // Cặp /e/ vs /æ/ (Bed / Bad)
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

  // Cặp /e/ vs /æ/ (Men / Man)
  'men': {
    word: 'men',
    targetIpa: '/men/',
    trapMap: {
      'man': { 
        heardIpa: '/mæn/', 
        tip: 'Khẩu hình mở quá rộng thành âm bẹt /æ/ ("man")! Để phát âm /e/ ("men"), hãy khép hàm hẹp lại, chỉ mở hé miệng và căng khóe môi sang hai bên.' 
      },
      'main': { 
        heardIpa: '/meɪn/', 
        tip: 'Tránh kéo dài thành nguyên âm đôi /eɪ/ ("main"). Âm /e/ trong "men" là nguyên âm ngắn, dứt khoát.' 
      },
      'min': { 
        heardIpa: '/mɪn/', 
        tip: 'Đừng nâng lưỡi quá cao thành âm /ɪ/.' 
      }
    }
  },
  'man': {
    word: 'man',
    targetIpa: '/mæn/',
    trapMap: {
      'men': { 
        heardIpa: '/men/', 
        tip: 'Hàm dưới chưa hạ đủ sâu! Để phát âm /æ/ ("man"), hãy hạ hàm dưới xuống thật sâu, mở rộng miệng và đẩy lưỡi thấp xuống.' 
      },
      'mun': { 
        heardIpa: '/mʌn/', 
        tip: 'Căng cơ môi sang hai bên khi mở miệng để tránh biến thành âm /ʌ/.' 
      }
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
  },

  // Cặp /m/ vs /ŋ/ (Âm mũi kết thúc & từ dính chùm Samsung)
  'sum': {
    word: 'sum',
    targetIpa: '/sʌm/',
    trapMap: {
      'sung': { heardIpa: '/sʌŋ/', tip: 'Khép chặt 2 môi ở âm cuối /m/ để luồng hơi thoát ra qua mũi.' },
      'some': { heardIpa: '/sʌm/', tip: 'Đồng âm chính xác!' },
      'sun': { heardIpa: '/sʌn/', tip: 'Khép môi tạo âm /m/, tránh chạm đầu lưỡi lên vòm họng thành /n/.' }
    }
  },
  'sung': {
    word: 'sung',
    targetIpa: '/sʌŋ/',
    trapMap: {
      'sum': { heardIpa: '/sʌm/', tip: 'Nâng cuống lưỡi chạm vòm miệng mềm để tạo âm ngạc mềm /ŋ/, không khép 2 môi.' },
      'sun': { heardIpa: '/sʌn/', tip: 'Âm đuôi là /ŋ/ (như "ng" tiếng Việt), giữ cuống lưỡi nâng cao.' }
    }
  },

  // Cặp /l/ vs /r/ & /iː/ vs /e/, /ɪ/ (Lead / Read)
  'lead': {
    word: 'lead',
    targetIpa: '/liːd/',
    trapMap: {
      'led': { heardIpa: '/led/', tip: 'Kéo dài khóe miệng sang hai bên để tạo âm /iː/ dài, tránh đọc thành âm /e/ ("led").' },
      'read': { heardIpa: '/riːd/', tip: 'Đầu lưỡi chạm nướu răng cửa trên để bật âm /l/, tránh thụt lưỡi tạo âm /r/.' },
      'lid': { heardIpa: '/lɪd/', tip: 'Kéo dài nguyên âm /iː/, không đọc giật ngắn thành âm /ɪ/.' }
    }
  },
  'read': {
    word: 'read',
    targetIpa: '/riːd/',
    trapMap: {
      'rid': { heardIpa: '/rɪd/', tip: 'Kéo dài âm /iː/ dài, tránh đọc rút ngắn thành âm /ɪ/ ("rid").' },
      'red': { heardIpa: '/red/', tip: '"read" ở thì hiện tại phát âm là /riːd/, không đọc thành quá khứ /red/.' },
      'lead': { heardIpa: '/liːd/', tip: 'Uốn cong đầu lưỡi về phía sau và chu nhẹ môi để tạo âm /r/, không để đầu lưỡi chạm nướu răng.' },
      'lid': { heardIpa: '/lɪd/', tip: 'Âm đầu là /r/ và nguyên âm là /iː/ dài (/riːd/).' }
    }
  }
};

// Danh sách từ dính chùm thường gặp khi Whisper nhận diện
const COMPOUND_EXPANSIONS: Record<string, string> = {
  'samsung': 'sum sung',
  'sunsung': 'sun sung',
  'some sung': 'sum sung',
  'barefoot': 'bare foot',
  'bedroom': 'bed room',
  'sunflower': 'sun flower',
  'seashore': 'sea shore',
  'seashells': 'sea shells',
};

/**
 * 🎯 Phân tích đối chiếu IPA thực tế giữa từ mục tiêu và từ AI nhận diện
 */
export function getPhoneticComparison(targetWord: string, actualTranscript: string) {
  const cleanTarget = targetWord.toLowerCase().replace(/[^a-z]/g, '');
  let expandedTranscript = actualTranscript.toLowerCase();

  // Giải mã từ ghép dính chùm trước khi đối chiếu
  Object.keys(COMPOUND_EXPANSIONS).forEach((comp) => {
    if (expandedTranscript.includes(comp)) {
      expandedTranscript = expandedTranscript.replace(new RegExp(`\\b${comp}\\b`, 'g'), COMPOUND_EXPANSIONS[comp]);
    }
  });

  const transcriptWords = expandedTranscript.replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  
  const dictEntry = PHONETIC_DICTIONARY[cleanTarget];
  const targetIpa = dictEntry ? dictEntry.targetIpa : `/${cleanTarget}/`;

  // 1. Nếu người học phát âm trúng từ mục tiêu
  if (transcriptWords.includes(cleanTarget)) {
    return {
      targetWord: cleanTarget,
      targetIpa: targetIpa,
      heardIpa: targetIpa,
      tip: 'Khẩu hình chuẩn xác!',
      isExactMatch: true
    };
  }

  // 2. Tìm xem người học rơi vào bẫy âm nào
  if (dictEntry && dictEntry.trapMap) {
    for (const trapKey of Object.keys(dictEntry.trapMap)) {
      if (transcriptWords.includes(trapKey)) {
        return {
          targetWord: cleanTarget,
          targetIpa: targetIpa,
          heardIpa: dictEntry.trapMap[trapKey].heardIpa,
          tip: dictEntry.trapMap[trapKey].tip,
          isExactMatch: false
        };
      }
    }
  }

  // 3. Trường hợp đọc lệch chưa xác định cụ thể
  return {
    targetWord: cleanTarget,
    targetIpa: targetIpa,
    heardIpa: transcriptWords.length > 0 ? `/${transcriptWords.join(' ')}/` : '/???/',
    tip: 'Âm phát ra chưa rõ nét hoặc lệch âm. Hãy nghe lại âm mẫu và chú ý khẩu hình môi/lưỡi.',
    isExactMatch: false
  };
}