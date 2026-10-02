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

export const LINKING_SOUNDS_DATA: Record<string, LinkingSoundItem[]> = {
  A1: [
    { id: 'ls_a1_1', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Check it out", contentVi: "Kiểm tra nó xem", targetFocus: "k + i -> che-kit-out", phoneticSpelling: "/tʃek ɪt aʊt/" },
    { id: 'ls_a1_2', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Pick up the phone", contentVi: "Nhấc điện thoại lên", targetFocus: "k + u -> pi-kup", phoneticSpelling: "/pɪk ʌp ðə fəʊn/" },
    { id: 'ls_a1_3', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Turn off the light", contentVi: "Tắt đèn đi", targetFocus: "n + o -> tur-noff", phoneticSpelling: "/tɜːn ɒf ðə laɪt/" },
    { id: 'ls_a1_4', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Stand up please", contentVi: "Hãy đứng lên", targetFocus: "d + u -> stan-dup", phoneticSpelling: "/stænd ʌp pliːz/" },
    { id: 'ls_a1_5', level: 'A1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Sit on the chair", contentVi: "Ngồi trên ghế", targetFocus: "t + o -> si-ton", phoneticSpelling: "/sɪt ɒn ðə tʃeər/" }
    // ... Thêm đủ 50 cụm cho A1
  ],
  A2: [
    { id: 'ls_a2_1', level: 'A2', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Hold on a second", contentVi: "Chờ một chút", targetFocus: "d + o -> hol-don", phoneticSpelling: "/həʊld ɒn ə ˈsekənd/" }
    // ... Thêm đủ 50 cụm cho A2
  ],
  B1: [
    { id: 'ls_b1_1', level: 'B1', title: "Nối âm nhịp điệu nhẹ", contentEn: "An apple a day keeps the doctor away", contentVi: "Mỗi ngày một quả táo", targetFocus: "n + a -> an-napple", phoneticSpelling: "/ən ˈæpl ə deɪ/" }
    // ... Thêm đủ 50 cụm cho B1
  ],
  B2: [
    { id: 'ls_b2_1', level: 'B2', title: "Cụm nối âm câu dài", contentEn: "Not at all, it was an absolute pleasure", contentVi: "Không có gì, đó là niềm vinh hạnh", targetFocus: "t + a -> no-ta-tall", phoneticSpelling: "/nɒt ət ɔːl..." }
    // ... Thêm đủ 50 cụm cho B2
  ],
  C1: [
    { id: 'ls_c1_1', level: 'C1', title: "Nối âm nhịp điệu bản ngữ", contentEn: "First of all, I need to clear up the confusion", contentVi: "Trước hết tôi cần làm rõ", targetFocus: "st + o -> firs-to-vall", phoneticSpelling: "/fɜːst əv ɔːl..." }
    // ... Thêm đủ 50 cụm cho C1
  ],
  C2: [
    { id: 'ls_c2_1', level: 'C2', title: "Nối âm tốc độ cao", contentEn: "What are you going to do about it?", contentVi: "Bạn định làm gì với việc đó?", targetFocus: "whatcha-gonna-do-about-dit", phoneticSpelling: "/wɒt ə juː ˈɡəʊɪŋ tuː duː əˈbaʊt ɪt/" }
    // ... Thêm đủ 50 cụm cho C2
  ]
};