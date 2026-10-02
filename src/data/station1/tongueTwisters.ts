// src/data/station1/tongueTwisters.ts
export interface TongueTwisterItem {
  id: string;
  title: string;
  contentEn: string;
  contentVi?: string;
  targetFocus: string;
  phoneticSpelling?: string;
}

export const TONGUE_TWISTERS_DATA: TongueTwisterItem[] = [
  { id: 'tt_1', title: "Luyện âm /s/ và /ʃ/", contentEn: "She sells seashells by the seashore.", contentVi: "Cô ấy bán vỏ sò bên bờ biển.", targetFocus: "Uốn lưỡi âm /ʃ/ & /s/", phoneticSpelling: "/ʃiː selz ˈsiːʃelz baɪ ðə ˈsiːʃɔːr/" },
  { id: 'tt_2', title: "Bật hơi âm /p/", contentEn: "Peter Piper picked a peck of pickled peppers.", contentVi: "Peter Piper đã hái một lượng ớt muối.", targetFocus: "Bật hơi môi /p/", phoneticSpelling: "/ˈpiːtər ˈpaɪpər pɪkt..." },
  { id: 'tt_3', title: "Bật âm /b/", contentEn: "Big black bears bake black bread.", contentVi: "Những con gấu đen lớn nướng bánh mì đen.", targetFocus: "Rung môi âm /b/", phoneticSpelling: "/bɪɡ blæk beəz beɪk blæk bred/" },
  { id: 'tt_4', title: "Luyện âm /f/", contentEn: "Four fine fresh fish for you.", contentVi: "Bốn con cá tươi ngon cho bạn.", targetFocus: "Răng môi âm /f/", phoneticSpelling: "/fɔːr faɪn freʃ fɪʃ fɔːr juː/" },
  { id: 'tt_5', title: "Bật âm /t/", contentEn: "Two tiny tigers take two taxis to town.", contentVi: "Hai con hổ nhỏ đi hai xe taxi vào thị trấn.", targetFocus: "Đầu lưỡi bật âm /t/", phoneticSpelling: "/tuː ˈtaɪni ˈtaɪɡəz teɪk tuː ˈtæksiz tuː taʊn/" }
  // ... (Bổ sung tiếp danh sách 50 câu)
];