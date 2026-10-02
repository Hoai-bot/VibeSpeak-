// src/data/station1/minimalPairs.ts
export interface MinimalPairItem {
  id: string;
  title: string;
  contentEn: string;
  contentVi?: string;
  targetFocus: string;
  phoneticSpelling?: string;
}

export const MINIMAL_PAIRS_DATA: MinimalPairItem[] = [
  { id: 'mp_1', title: "Phân biệt /ɪ/ và /iː/", contentEn: "ship / sheep", contentVi: "con tàu / con cừu", targetFocus: "/ɪ/ vs /iː/", phoneticSpelling: "/ʃɪp/ - /ʃiːp/" },
  { id: 'mp_2', title: "Phân biệt /p/ và /b/", contentEn: "pen / Ben", contentVi: "cây bút / tên Ben", targetFocus: "/p/ vs /b/", phoneticSpelling: "/pen/ - /ben/" },
  { id: 'mp_3', title: "Phân biệt /f/ và /v/", contentEn: "fan / van", contentVi: "cái quạt / xe tải", targetFocus: "/f/ vs /v/", phoneticSpelling: "/fæn/ - /væn/" },
  { id: 'mp_4', title: "Phân biệt /s/ và /z/", contentEn: "sip / zip", contentVi: "nhấp môi / khóa kéo", targetFocus: "/s/ vs /z/", phoneticSpelling: "/sɪp/ - /zɪp/" },
  { id: 'mp_5', title: "Phân biệt /t/ và /d/", contentEn: "ten / den", contentVi: "số mười / hang thú", targetFocus: "/t/ vs /d/", phoneticSpelling: "/ten/ - /den/" },
  { id: 'mp_6', title: "Phân biệt /k/ và /ɡ/", contentEn: "coat / goat", contentVi: "áo khoác / con dê", targetFocus: "/k/ vs /ɡ/", phoneticSpelling: "/kəʊt/ - /ɡəʊt/" },
  { id: 'mp_7', title: "Phân biệt /l/ và /r/", contentEn: "light / right", contentVi: "ánh sáng / đúng", targetFocus: "/l/ vs /r/", phoneticSpelling: "/laɪt/ - /raɪt/" },
  { id: 'mp_8', title: "Phân biệt /θ/ và /t/", contentEn: "thin / tin", contentVi: "mỏng / cái lon", targetFocus: "/θ/ vs /t/", phoneticSpelling: "/θɪn/ - /tɪn/" },
  { id: 'mp_9', title: "Phân biệt /v/ và /w/", contentEn: "vet / wet", contentVi: "bác sĩ thú y / ướt", targetFocus: "/v/ vs /w/", phoneticSpelling: "/vet/ - /wet/" },
  { id: 'mp_10', title: "Phân biệt /ʃ/ và /s/", contentEn: "shoe / sue", contentVi: "chiếc giày / kiện tụng", targetFocus: "/ʃ/ vs /s/", phoneticSpelling: "/ʃuː/ - /suː/" },
  { id: 'mp_11', title: "Phân biệt /ɪ/ và /iː/", contentEn: "fit / feet", contentVi: "vừa vặn / đôi chân", targetFocus: "/ɪ/ vs /iː/", phoneticSpelling: "/fɪt/ - /fiːt/" },
  { id: 'mp_12', title: "Phân biệt /ɪ/ và /iː/", contentEn: "sit / seat", contentVi: "ngồi / chỗ ngồi", targetFocus: "/ɪ/ vs /iː/", phoneticSpelling: "/sɪt/ - /siːt/" },
  { id: 'mp_13', title: "Phân biệt /e/ và /æ/", contentEn: "bed / bad", contentVi: "cái giường / tồi tệ", targetFocus: "/e/ vs /æ/", phoneticSpelling: "/bed/ - /bæd/" },
  { id: 'mp_14', title: "Phân biệt /e/ và /æ/", contentEn: "pen / pan", contentVi: "cây bút / cái chảo", targetFocus: "/e/ vs /æ/", phoneticSpelling: "/pen/ - /pæn/" },
  { id: 'mp_15', title: "Phân biệt /ʌ/ và /æ/", contentEn: "cup / cap", contentVi: "cái cốc / cái mũ", targetFocus: "/ʌ/ vs /æ/", phoneticSpelling: "/kʌp/ - /kæp/" },
  { id: 'mp_16', title: "Phân biệt /ɒ/ và /ɔː/", contentEn: "cot / caught", contentVi: "giường cối / bắt lấy", targetFocus: "/ɒ/ vs /ɔː/", phoneticSpelling: "/kɒt/ - /kɔːt/" },
  { id: 'mp_17', title: "Phân biệt /ʊ/ và /uː/", contentEn: "full / fool", contentVi: "đầy / kẻ ngốc", targetFocus: "/ʊ/ vs /uː/", phoneticSpelling: "/fʊl/ - /fuːl/" },
  { id: 'mp_18', title: "Phân biệt /p/ và /b/", contentEn: "pat / bat", contentVi: "vỗ nhẹ / gậy bóng chày", targetFocus: "/p/ vs /b/", phoneticSpelling: "/pæt/ - /bæt/" },
  { id: 'mp_19', title: "Phân biệt /t/ và /d/", contentEn: "to / do", contentVi: "đến / làm", targetFocus: "/t/ vs /d/", phoneticSpelling: "/tuː/ - /duː/" },
  { id: 'mp_20', title: "Phân biệt /m/ và /n/", contentEn: "map / nap", contentVi: "bản đồ / giấc ngủ ngắn", targetFocus: "/m/ vs /n/", phoneticSpelling: "/mæp/ - /næp/" }
  // ... (Bổ sung tiếp danh sách 50 cặp)
];