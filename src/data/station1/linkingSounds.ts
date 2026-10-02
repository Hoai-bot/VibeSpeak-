// src/data/station1/linkingSounds.ts
export interface LinkingSoundItem {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  title: string;
  contentEn: string;
  contentVi: string;
  targetFocus: string;
  phoneticSpelling: string;
}

export const LINKING_SOUNDS_DATA: LinkingSoundItem[] = [
  // --- LEVEL A1 (50 Linking Phrases) ---
  { id: 'ls_a1_1', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Check it out", contentVi: "Kiểm tra nó xem", targetFocus: "k + i -> che-kit-out", phoneticSpelling: "/tʃek ɪt aʊt/" },
  { id: 'ls_a1_2', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Pick up the phone", contentVi: "Nhấc điện thoại lên", targetFocus: "k + u -> pi-kup", phoneticSpelling: "/pɪk ʌp ðə fəʊn/" },
  { id: 'ls_a1_3', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Turn off the light", contentVi: "Tắt đèn đi", targetFocus: "n + o -> tur-noff", phoneticSpelling: "/tɜːn ɒf ðə laɪt/" },
  { id: 'ls_a1_4', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Stand up please", contentVi: "Hãy đứng lên", targetFocus: "d + u -> stan-dup", phoneticSpelling: "/stænd ʌp pliːz/" },
  { id: 'ls_a1_5', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Sit on the chair", contentVi: "Ngồi trên ghế", targetFocus: "t + o -> si-ton", phoneticSpelling: "/sɪt ɒn ðə tʃeər/" },
  { id: 'ls_a1_6', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Wake up early", contentVi: "Thức dậy sớm", targetFocus: "k + u -> wa-kup", phoneticSpelling: "/weɪk ʌp ˈɜːli/" },
  { id: 'ls_a1_7', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Clean it again", contentVi: "Lau sạch lại", targetFocus: "n + i -> clea-nit", phoneticSpelling: "/kliːn ɪt əˈɡen/" },
  { id: 'ls_a1_8', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Look at me", contentVi: "Nhìn tôi này", targetFocus: "k + a -> loo-kat", phoneticSpelling: "/lʊk æt miː/" },
  { id: 'ls_a1_9', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Come in", contentVi: "Mời vào", targetFocus: "m + i -> co-min", phoneticSpelling: "/kʌm ɪn/" },
  { id: 'ls_a1_10', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Hold on", contentVi: "Giữ máy nhé", targetFocus: "d + o -> hol-don", phoneticSpelling: "/həʊld ɒn/" },

  // --- LEVEL A2 (50 Linking Phrases) ---
  { id: 'ls_a2_1', level: 'A2', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Hold on a second", contentVi: "Chờ một chút", targetFocus: "d + o -> hol-don", phoneticSpelling: "/həʊld ɒn ə ˈsekənd/" },
  { id: 'ls_a2_2', level: 'A2', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Read a book", contentVi: "Đọc một cuốn sách", targetFocus: "d + a -> ree-da-book", phoneticSpelling: "/riːd ə bʊk/" },
  { id: 'ls_a2_3', level: 'A2', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Go away now", contentVi: "Đi ra chỗ khác", targetFocus: "w-insert -> go-waway", phoneticSpelling: "/ɡəʊ əˈweɪ naʊ/" },
  { id: 'ls_a2_4', level: 'A2', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "I agree with you", contentVi: "Tôi đồng ý với bạn", targetFocus: "y-insert -> I-yagree", phoneticSpelling: "/aɪ əˈɡriː wɪð juː/" },
  { id: 'ls_a2_5', level: 'A2', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Ask about it", contentVi: "Hỏi về nó", targetFocus: "k + a -> as-kabout", phoneticSpelling: "/ɑːsk əˈbaʊt ɪt/" },

  // --- LEVEL B1 (50 Linking Phrases) ---
  { id: 'ls_b1_1', level: 'B1', title: "Nối âm nhịp điệu nhẹ", contentEn: "An apple a day keeps the doctor away", contentVi: "Mỗi ngày một quả táo", targetFocus: "n + a -> an-napple", phoneticSpelling: "/ən ˈæpl ə deɪ/" },
  { id: 'ls_b1_2', level: 'B1', title: "Nối âm nuốt âm T (Flap T)", contentEn: "Water bottle", contentVi: "Chai nước", targetFocus: "t -> d (wa-der)", phoneticSpelling: "/ˈwɔːtər ˈbɒtl/" },

  // --- LEVEL B2 (50 Linking Phrases) ---
  { id: 'ls_b2_1', level: 'B2', title: "Cụm nối âm câu dài", contentEn: "Not at all, it was an absolute pleasure", contentVi: "Không có gì, đó là niềm vinh hạnh", targetFocus: "t + a -> no-ta-tall", phoneticSpelling: "/nɒt ət ɔːl..." },

  // --- LEVEL C1 (50 Linking Phrases) ---
  { id: 'ls_c1_1', level: 'C1', title: "Nối âm nhịp điệu bản ngữ", contentEn: "First of all, I need to clear up the confusion", contentVi: "Trước hết tôi cần làm rõ", targetFocus: "st + o -> firs-to-vall", phoneticSpelling: "/fɜːst əv ɔːl..." },

  // --- LEVEL C2 (50 Linking Phrases) ---
  { id: 'ls_c2_1', level: 'C2', title: "Nối âm tốc độ cao (Fast Speech Linking)", contentEn: "What are you going to do about it?", contentVi: "Bạn định làm gì với việc đó?", targetFocus: "whatcha-gonna-do-about-dit", phoneticSpelling: "/wɒt ə juː ˈɡəʊɪŋ tuː duː əˈbaʊt ɪt/" }
];