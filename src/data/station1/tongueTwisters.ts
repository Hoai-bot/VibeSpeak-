// src/data/station1/tongueTwisters.ts
export interface TongueTwisterItem {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  title: string;
  contentEn: string;
  contentVi: string;
  targetFocus: string;
  phoneticSpelling: string;
}

export const TONGUE_TWISTERS_DATA: TongueTwisterItem[] = [
  // --- LEVEL A1 (50 Twisters) ---
  { id: 'tt_a1_1', level: 'A1', title: "Luyện phát âm /s/", contentEn: "She sells seashells by the seashore.", contentVi: "Cô ấy bán vỏ sò bên bờ biển.", targetFocus: "Luyện âm /ʃ/ và /s/", phoneticSpelling: "/ʃiː selz ˈsiːʃelz baɪ ðə ˈsiːʃɔːr/" },
  { id: 'tt_a1_2', level: 'A1', title: "Luyện phát âm /p/", contentEn: "Peter Piper picked a peck of pickled peppers.", contentVi: "Peter Piper đã hái một lượng ớt muối.", targetFocus: "Bật hơi âm /p/", phoneticSpelling: "/ˈpiːtər ˈpaɪpər pɪkt..." },
  { id: 'tt_a1_3', level: 'A1', title: "Luyện phát âm /b/", contentEn: "Big black bears bake black bread.", contentVi: "Những con gấu đen lớn nướng bánh mì đen.", targetFocus: "Bật âm /b/", phoneticSpelling: "/bɪɡ blæk beəz beɪk blæk bred/" },
  { id: 'tt_a1_4', level: 'A1', title: "Luyện phát âm /f/", contentEn: "Four fine fresh fish for you.", contentVi: "Bốn con cá tươi ngon cho bạn.", targetFocus: "Phát âm /f/", phoneticSpelling: "/fɔːr faɪn freʃ fɪʃ fɔːr juː/" },
  { id: 'tt_a1_5', level: 'A1', title: "Luyện phát âm /t/", contentEn: "Two tiny tigers take two taxis to town.", contentVi: "Hai con hổ nhỏ đi hai xe taxi vào thị trấn.", targetFocus: "Bật âm /t/", phoneticSpelling: "/tuː ˈtaɪni ˈtaɪɡəz teɪk tuː ˈtæksiz tuː taʊn/" },

  // --- LEVEL A2 (50 Twisters) ---
  { id: 'tt_a2_1', level: 'A2', title: "Luyện phát âm /r/ và /l/", contentEn: "Red lorry, yellow lorry.", contentVi: "Xe tải đỏ, xe tải vàng.", targetFocus: "Phân biệt /r/ và /l/", phoneticSpelling: "/red ˈlɒri ˈjeləʊ ˈlɒri/" },
  { id: 'tt_a2_2', level: 'A2', title: "Luyện phát âm /w/", contentEn: "Which witch wished which wish?", contentVi: "Mụ phù thủy nào đã ước điều ước nào?", targetFocus: "Âm môi /w/", phoneticSpelling: "/wɪtʃ wɪtʃ wɪʃt wɪtʃ wɪʃ/" },

  // --- LEVEL B1 (50 Twisters) ---
  { id: 'tt_b1_1', level: 'B1', title: "Luyện âm /f/ và /θ/", contentEn: "Fred fed Ted bread, and Ted fed Fred bread.", contentVi: "Fred cho Ted ăn bánh mì và ngược lại.", targetFocus: "Nhịp điệu nhanh", phoneticSpelling: "/fred fed ted bred..." },

  // --- LEVEL B2 (50 Twisters) ---
  { id: 'tt_b2_1', level: 'B2', title: "Luyện phản xạ lưỡi", contentEn: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", contentVi: "Câu líu lưỡi kinh điển về con gopher.", targetFocus: "Biến đổi /w/ và /tʃ/", phoneticSpelling: "/haʊ mʌtʃ wʊd..." },

  // --- LEVEL C1 (50 Twisters) ---
  { id: 'tt_c1_1', level: 'C1', title: "Luyện phát âm phức tạp", contentEn: "Sixth sick sheik's sixth sheep's sick.", contentVi: "Thử thách phát âm siêu khó.", targetFocus: "Liên tục biến đổi /s/ và /θ/", phoneticSpelling: "/sɪksθ sɪk ʃiːks..." },

  // --- LEVEL C2 (50 Twisters) ---
  { id: 'tt_c2_1', level: 'C2', title: "Thử thách tốc độ đỉnh cao C2", contentEn: "The thirty-three thankful thieves thought that they thrilled the throne throughout Thursday.", contentVi: "Ba mươi ba tên trộm xúc động nghĩ rằng...", targetFocus: "Chuyên sâu biến âm /θ/ và /ð/", phoneticSpelling: "/ðə ˈθɜːti θriː ˈθæŋkfl..." }
];