// src/data/station1/minimalPairs.ts
export interface MinimalPairItem {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  title: string;
  contentEn: string;
  contentVi: string;
  targetFocus: string;
  phoneticSpelling: string;
}

export const MINIMAL_PAIRS_DATA: MinimalPairItem[] = [
  // --- LEVEL A1 (50 Pairs) ---
  { id: 'mp_a1_1', level: 'A1', title: "Phân biệt /ɪ/ và /iː/", contentEn: "ship / sheep", contentVi: "con tàu / con cừu", targetFocus: "/ɪ/ vs /iː/", phoneticSpelling: "/ʃɪp/ - /ʃiːp/" },
  { id: 'mp_a1_2', level: 'A1', title: "Phân biệt /p/ và /b/", contentEn: "pen / Ben", contentVi: "cây bút / tên Ben", targetFocus: "/p/ vs /b/", phoneticSpelling: "/pen/ - /ben/" },
  { id: 'mp_a1_3', level: 'A1', title: "Phân biệt /f/ và /v/", contentEn: "fan / van", contentVi: "cái quạt / xe tải", targetFocus: "/f/ vs /v/", phoneticSpelling: "/fæn/ - /væn/" },
  { id: 'mp_a1_4', level: 'A1', title: "Phân biệt /s/ và /z/", contentEn: "sip / zip", contentVi: "nhấp môi / khóa kéo", targetFocus: "/s/ vs /z/", phoneticSpelling: "/sɪp/ - /zɪp/" },
  { id: 'mp_a1_5', level: 'A1', title: "Phân biệt /t/ và /d/", contentEn: "ten / den", contentVi: "số mười / hang thú", targetFocus: "/t/ vs /d/", phoneticSpelling: "/ten/ - /den/" },
  { id: 'mp_a1_6', level: 'A1', title: "Phân biệt /k/ và /ɡ/", contentEn: "cat / gat", contentVi: "con mèo / tên riêng", targetFocus: "/k/ vs /ɡ/", phoneticSpelling: "/kæt/ - /ɡæt/" },
  { id: 'mp_a1_7', level: 'A1', title: "Phân biệt /m/ và /n/", contentEn: "map / nap", contentVi: "bản đồ / giấc ngủ ngắn", targetFocus: "/m/ vs /n/", phoneticSpelling: "/mæp/ - /næp/" },
  { id: 'mp_a1_8', level: 'A1', title: "Phân biệt /h/ và /f/", contentEn: "hat / fat", contentVi: "cái mũ / béo", targetFocus: "/h/ vs /f/", phoneticSpelling: "/hæt/ - /fæt/" },
  { id: 'mp_a1_9', level: 'A1', title: "Phân biệt /w/ và /r/", contentEn: "win / rin", contentVi: "chiến thắng / rửa sạch", targetFocus: "/w/ vs /r/", phoneticSpelling: "/wɪn/ - /rɪn/" },
  { id: 'mp_a1_10', level: 'A1', title: "Phân biệt /l/ và /r/", contentEn: "light / right", contentVi: "ánh sáng / đúng", targetFocus: "/l/ vs /r/", phoneticSpelling: "/laɪt/ - /raɪt/" },
  { id: 'mp_a1_11', level: 'A1', title: "Phân biệt /ɪ/ và /iː/", contentEn: "fit / feet", contentVi: "vừa vặn / đôi chân", targetFocus: "/ɪ/ vs /iː/", phoneticSpelling: "/fɪt/ - /fiːt/" },
  { id: 'mp_a1_12', level: 'A1', title: "Phân biệt /ɪ/ và /iː/", contentEn: "sit / seat", contentVi: "ngồi / chỗ ngồi", targetFocus: "/ɪ/ vs /iː/", phoneticSpelling: "/sɪt/ - /siːt/" },
  { id: 'mp_a1_13', level: 'A1', title: "Phân biệt /e/ và /æ/", contentEn: "bed / bad", contentVi: "cái giường / tồi tệ", targetFocus: "/e/ vs /æ/", phoneticSpelling: "/bed/ - /bæd/" },
  { id: 'mp_a1_14', level: 'A1', title: "Phân biệt /e/ và /æ/", contentEn: "pen / pan", contentVi: "cây bút / cái chảo", targetFocus: "/e/ vs /æ/", phoneticSpelling: "/pen/ - /pæn/" },
  { id: 'mp_a1_15', level: 'A1', title: "Phân biệt /ʌ/ và /æ/", contentEn: "cup / cap", contentVi: "cái cốc / cái mũ lưỡi trai", targetFocus: "/ʌ/ vs /æ/", phoneticSpelling: "/kʌp/ - /kæp/" },
  { id: 'mp_a1_16', level: 'A1', title: "Phân biệt /ɒ/ và /ɔː/", contentEn: "cot / caught", contentVi: "giường cối / bắt lấy", targetFocus: "/ɒ/ vs /ɔː/", phoneticSpelling: "/kɒt/ - /kɔːt/" },
  { id: 'mp_a1_17', level: 'A1', title: "Phân biệt /ʊ/ và /uː/", contentEn: "full / fool", contentVi: "đầy / kẻ ngốc", targetFocus: "/ʊ/ vs /uː/", phoneticSpelling: "/fʊl/ - /fuːl/" },
  { id: 'mp_a1_18', level: 'A1', title: "Phân biệt /p/ và /b/", contentEn: "pat / bat", contentVi: "vỗ nhẹ / gậy bóng chày", targetFocus: "/p/ vs /b/", phoneticSpelling: "/pæt/ - /bæt/" },
  { id: 'mp_a1_19', level: 'A1', title: "Phân biệt /t/ và /d/", contentEn: "to / do", contentVi: "đến / làm", targetFocus: "/t/ vs /d/", phoneticSpelling: "/tuː/ - /duː/" },
  { id: 'mp_a1_20', level: 'A1', title: "Phân biệt /k/ và /ɡ/", contentEn: "coat / goat", contentVi: "áo khoác / con dê", targetFocus: "/k/ vs /ɡ/", phoneticSpelling: "/kəʊt/ - /ɡəʊt/" },

  // --- LEVEL A2 (50 Pairs) ---
  { id: 'mp_a2_1', level: 'A2', title: "Phân biệt /θ/ và /t/", contentEn: "thin / tin", contentVi: "mỏng / cái lon", targetFocus: "/θ/ vs /t/", phoneticSpelling: "/θɪn/ - /tɪn/" },
  { id: 'mp_a2_2', level: 'A2', title: "Phân biệt /θ/ và /f/", contentEn: "three / free", contentVi: "số ba / tự do", targetFocus: "/θ/ vs /f/", phoneticSpelling: "/θriː/ - /friː/" },
  { id: 'mp_a2_3', level: 'A2', title: "Phân biệt /ð/ và /d/", contentEn: "they / day", contentVi: "họ / ngày", targetFocus: "/ð/ vs /d/", phoneticSpelling: "/ðeɪ/ - /deɪ/" },
  { id: 'mp_a2_4', level: 'A2', title: "Phân biệt /v/ và /w/", contentEn: "vet / wet", contentVi: "bác sĩ thú y / ướt", targetFocus: "/v/ vs /w/", phoneticSpelling: "/vet/ - /wet/" },
  { id: 'mp_a2_5', level: 'A2', title: "Phân biệt /s/ và /θ/", contentEn: "sink / think", contentVi: "bồn rửa / suy nghĩ", targetFocus: "/s/ vs /θ/", phoneticSpelling: "/sɪŋk/ - /θɪŋk/" },
  { id: 'mp_a2_6', level: 'A2', title: "Phân biệt /ʃ/ và /s/", contentEn: "shoe / sue", contentVi: "chiếc giày / kiện tụng", targetFocus: "/ʃ/ vs /s/", phoneticSpelling: "/ʃuː/ - /suː/" },
  { id: 'mp_a2_7', level: 'A2', title: "Phân biệt /tʃ/ và /ʃ/", contentEn: "chair / share", contentVi: "cái ghế / chia sẻ", targetFocus: "/tʃ/ vs /ʃ/", phoneticSpelling: "/tʃeər/ - /ʃeər/" },
  { id: 'mp_a2_8', level: 'A2', title: "Phân biệt /dʒ/ và /ʒ/", contentEn: "jaw / genre", contentVi: "xương hàm / thể loại", targetFocus: "/dʒ/ vs /ʒ/", phoneticSpelling: "/dʒɔː/ - /ˈʒɒnrə/" },
  { id: 'mp_a2_9', level: 'A2', title: "Phân biệt /n/ và /ŋ/", contentEn: "sin / sing", contentVi: "tội lỗi / hát", targetFocus: "/n/ vs /ŋ/", phoneticSpelling: "/sɪn/ - /sɪŋ/" },
  { id: 'mp_a2_10', level: 'A2', title: "Phân biệt /æ/ và /e/", contentEn: "man / men", contentVi: "người đàn ông / các người đàn ông", targetFocus: "/æ/ vs /e/", phoneticSpelling: "/mæn/ - /men/" },

  // --- LEVEL B1 (50 Pairs) ---
  { id: 'mp_b1_1', level: 'B1', title: "Phân biệt /v/ và /w/", contentEn: "vine / wine", contentVi: "cây nho / rượu vang", targetFocus: "/v/ vs /w/", phoneticSpelling: "/vaɪn/ - /waɪn/" },
  { id: 'mp_b1_2', level: 'B1', title: "Phân biệt /s/ và /ʃ/", contentEn: "sea / she", contentVi: "biển / cô ấy", targetFocus: "/s/ vs /ʃ/", phoneticSpelling: "/siː/ - /ʃiː/" },
  { id: 'mp_b1_3', level: 'B1', title: "Phân biệt /θ/ và /s/", contentEn: "path / pass", contentVi: "con đường / đi qua", targetFocus: "/θ/ vs /s/", phoneticSpelling: "/pɑːθ/ - /pɑːs/" },
  { id: 'mp_b1_4', level: 'B1', title: "Phân biệt /ð/ và /z/", contentEn: "clothe / close", contentVi: "mặc quần áo / đóng lại", targetFocus: "/ð/ vs /z/", phoneticSpelling: "/kləʊð/ - /kləʊz/" },
  { id: 'mp_b1_5', level: 'B1', title: "Phân biệt /tʃ/ và /dʒ/", contentEn: "choke / joke", contentVi: "nghẹn / trò đùa", targetFocus: "/tʃ/ vs /dʒ/", phoneticSpelling: "/tʃəʊk/ - /dʒəʊk/" },

  // --- LEVEL B2 (50 Pairs) ---
  { id: 'mp_b2_1', level: 'B2', title: "Phân biệt /ð/ và /d/", contentEn: "there / dare", contentVi: "ở đó / dám", targetFocus: "/ð/ vs /d/", phoneticSpelling: "/ðeər/ - /deər/" },
  { id: 'mp_b2_2', level: 'B2', title: "Phân biệt /ɜː/ và /ɔː/", contentEn: "bird / board", contentVi: "con chim / cái bảng", targetFocus: "/ɜː/ vs /ɔː/", phoneticSpelling: "/bɜːd/ - /bɔːd/" },
  { id: 'mp_b2_3', level: 'B2', title: "Phân biệt /ɑː/ và /ʌ/", contentEn: "heart / hut", contentVi: "trái tim / túp lều", targetFocus: "/ɑː/ vs /ʌ/", phoneticSpelling: "/hɑːt/ - /hʌt/" },

  // --- LEVEL C1 (50 Pairs) ---
  { id: 'mp_c1_1', level: 'C1', title: "Phân biệt /ʃ/ và /ʒ/", contentEn: "confraction / confusion", contentVi: "sự va chạm / sự nhầm lẫn", targetFocus: "/ʃ/ vs /ʒ/", phoneticSpelling: "/kənˈfrækʃn/ - /kənˈfjuːʒn/" },
  { id: 'mp_c1_2', level: 'C1', title: "Phân biệt /aɪ/ và /eɪ/", contentEn: "sigh / say", contentVi: "thở dài / nói", targetFocus: "/aɪ/ vs /eɪ/", phoneticSpelling: "/saɪ/ - /seɪ/" },

  // --- LEVEL C2 (50 Pairs) ---
  { id: 'mp_c2_1', level: 'C2', title: "Phân biệt /θ/ và /ð/ trọng âm", contentEn: "wreath / wreathe", contentVi: "vòng hoa / bao quấn", targetFocus: "/θ/ vs /ð/", phoneticSpelling: "/riːθ/ - /riːð/" },
  { id: 'mp_c2_2', level: 'C2', title: "Phân biệt /s/ và /z/ âm cuối", contentEn: "use (n) / use (v)", contentVi: "sự sử dụng / sử dụng", targetFocus: "/s/ vs /z/", phoneticSpelling: "/juːs/ - /juːz/" }
];