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

export const TONGUE_TWISTERS_DATA: Record<string, TongueTwisterItem[]> = {
  A1: [
    { id: 'tt_a1_1', level: 'A1', title: "Luyện phát âm /s/", contentEn: "She sells seashells by the seashore.", contentVi: "Cô ấy bán vỏ sò bên bờ biển.", targetFocus: "Luyện âm /ʃ/ và /s/", phoneticSpelling: "/ʃiː selz ˈsiːʃelz baɪ ðə ˈsiːʃɔːr/" },
    { id: 'tt_a1_2', level: 'A1', title: "Luyện phát âm /p/", contentEn: "Peter Piper picked a peck of pickled peppers.", contentVi: "Peter Piper đã hái một lượng ớt muối.", targetFocus: "Bật hơi âm /p/", phoneticSpelling: "/ˈpiːtər ˈpaɪpər pɪkt..." },
    { id: 'tt_a1_3', level: 'A1', title: "Luyện phát âm /b/", contentEn: "Big black bears bake black bread.", contentVi: "Những con gấu đen lớn nướng bánh mì đen.", targetFocus: "Bật âm /b/", phoneticSpelling: "/bɪɡ blæk beəz beɪk blæk bred/" }
    // ... Thêm đủ 50 câu cho A1
  ],
  A2: [
    { id: 'tt_a2_1', level: 'A2', title: "Luyện phát âm /r/ và /l/", contentEn: "Red lorry, yellow lorry.", contentVi: "Xe tải đỏ, xe tải vàng.", targetFocus: "Phân biệt /r/ và /l/", phoneticSpelling: "/red ˈlɒri ˈjeləʊ ˈlɒri/" }
    // ... Thêm đủ 50 câu cho A2
  ],
  B1: [
    { id: 'tt_b1_1', level: 'B1', title: "Luyện âm /f/ và /θ/", contentEn: "Fred fed Ted bread, and Ted fed Fred bread.", contentVi: "Fred cho Ted ăn bánh mì và ngược lại.", targetFocus: "Nhịp điệu nhanh", phoneticSpelling: "/fred fed ted bred..." }
    // ... Thêm đủ 50 câu cho B1
  ],
  B2: [
    { id: 'tt_b2_1', level: 'B2', title: "Luyện phản xạ lưỡi", contentEn: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", contentVi: "Câu líu lưỡi kinh điển.", targetFocus: "Biến đổi /w/ và /tʃ/", phoneticSpelling: "/haʊ mʌtʃ wʊd..." }
    // ... Thêm đủ 50 câu cho B2
  ],
  C1: [
    { id: 'tt_c1_1', level: 'C1', title: "Luyện phát âm phức tạp", contentEn: "Sixth sick sheik's sixth sheep's sick.", contentVi: "Thử thách phát âm siêu khó.", targetFocus: "Liên tục biến đổi /s/ và /θ/", phoneticSpelling: "/sɪksθ sɪk ʃiːks..." }
    // ... Thêm đủ 50 câu cho C1
  ],
  C2: [
    { id: 'tt_c2_1', level: 'C2', title: "Thử thách tốc độ đỉnh cao C2", contentEn: "The thirty-three thankful thieves thought that they thrilled the throne throughout Thursday.", contentVi: "Ba mươi ba tên trộm...", targetFocus: "Chuyên sâu biến âm /θ/ và /ð/", phoneticSpelling: "/ðə ˈθɜːti θriː..." }
    // ... Thêm đủ 50 câu cho C2
  ]
};