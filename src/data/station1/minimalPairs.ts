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
  { id: 'mp_1', title: "Phân biệt /iː/ và /ɪ/", contentEn: "sheep / ship", contentVi: "con cừu / con tàu", targetFocus: "/iː/ vs /ɪ/", phoneticSpelling: "/ʃiːp/ - /ʃɪp/" },
  { id: 'mp_2', title: "Phân biệt /iː/ và /ɪ/", contentEn: "leave / live", contentVi: "rời đi / sống", targetFocus: "/iː/ vs /ɪ/", phoneticSpelling: "/liːv/ - /lɪv/" },
  { id: 'mp_3', title: "Phân biệt /iː/ và /ɪ/", contentEn: "eat / it", contentVi: "ăn / nó", targetFocus: "/iː/ vs /ɪ/", phoneticSpelling: "/iːt/ - /ɪt/" },
  { id: 'mp_4', title: "Phân biệt /iː/ và /ɪ/", contentEn: "feet / fit", contentVi: "đôi chân / vừa vặn", targetFocus: "/iː/ vs /ɪ/", phoneticSpelling: "/fiːt/ - /fɪt/" },
  { id: 'mp_5', title: "Phân biệt /uː/ và /ʊ/", contentEn: "fool / full", contentVi: "kẻ ngốc / đầy", targetFocus: "/uː/ vs /ʊ/", phoneticSpelling: "/fuːl/ - /fʊl/" },
  { id: 'mp_6', title: "Phân biệt /uː/ và /ʊ/", contentEn: "pool / pull", contentVi: "hồ bơi / kéo", targetFocus: "/uː/ vs /ʊ/", phoneticSpelling: "/puːl/ - /pʊl/" },
  { id: 'mp_7', title: "Phân biệt /e/ và /æ/", contentEn: "pen / pan", contentVi: "bút / cái chảo", targetFocus: "/e/ vs /æ/", phoneticSpelling: "/pen/ - /pæn/" },
  { id: 'mp_8', title: "Phân biệt /e/ và /æ/", contentEn: "men / man", contentVi: "đàn ông (số nhiều) / một người đàn ông", targetFocus: "/e/ vs /æ/", phoneticSpelling: "/men/ - /mæn/" },
  { id: 'mp_9', title: "Phân biệt /æ/ và /ʌ/", contentEn: "cat / cut", contentVi: "con mèo / cắt", targetFocus: "/æ/ vs /ʌ/", phoneticSpelling: "/kæt/ - /kʌt/" },
  { id: 'mp_10', title: "Phân biệt /æ/ và /ʌ/", contentEn: "hat / hut", contentVi: "cái mũ / túp lều", targetFocus: "/æ/ vs /ʌ/", phoneticSpelling: "/hæt/ - /hʌt/" },
  { id: 'mp_11', title: "Phân biệt /b/ và /p/", contentEn: "bat / pat", contentVi: "gậy bóng chày / vỗ nhẹ", targetFocus: "/b/ vs /p/", phoneticSpelling: "/bæt/ - /pæt/" },
  { id: 'mp_12', title: "Phân biệt /b/ và /p/", contentEn: "big / pig", contentVi: "to lớn / con heo", targetFocus: "/b/ vs /p/", phoneticSpelling: "/bɪɡ/ - /pɪɡ/" },
  { id: 'mp_13', title: "Phân biệt /v/ và /f/", contentEn: "van / fan", contentVi: "xe tải nhỏ / cái quạt", targetFocus: "/v/ vs /f/", phoneticSpelling: "/væn/ - /fæn/" },
  { id: 'mp_14', title: "Phân biệt /v/ và /f/", contentEn: "vine / fine", contentVi: "cây nho / tốt", targetFocus: "/v/ vs /f/", phoneticSpelling: "/vaɪn/ - /faɪn/" },
  { id: 'mp_15', title: "Phân biệt /d/ và /t/", contentEn: "do / to", contentVi: "làm / đến", targetFocus: "/d/ vs /t/", phoneticSpelling: "/duː/ - /tuː/" },
  { id: 'mp_16', title: "Phân biệt /z/ và /s/", contentEn: "zoo / sue", contentVi: "sở thú / kiện", targetFocus: "/z/ vs /s/", phoneticSpelling: "/zuː/ - /suː/" },
  { id: 'mp_17', title: "Phân biệt /ð/ và /θ/", contentEn: "this / think", contentVi: "này / suy nghĩ", targetFocus: "/ð/ vs /θ/", phoneticSpelling: "/ðɪs/ - /θɪŋk/" },
  { id: 'mp_18', title: "Phân biệt /l/ và /r/", contentEn: "light / right", contentVi: "ánh sáng / đúng", targetFocus: "/l/ vs /r/", phoneticSpelling: "/laɪt/ - /raɪt/" },
  { id: 'mp_19', title: "Phân biệt /l/ và /r/", contentEn: "lead / read", contentVi: "dẫn dắt / đọc", targetFocus: "/l/ vs /r/", phoneticSpelling: "/liːd/ - /riːd/" },
  { id: 'mp_20', title: "Phân biệt /w/ và /v/", contentEn: "wet / vet", contentVi: "ướt / bác sĩ thú y", targetFocus: "/w/ vs /v/", phoneticSpelling: "/wet/ - /vet/" },
  { id: 'mp_21', title: "Phân biệt /ʃ/ và /s/", contentEn: "she / see", contentVi: "cô ấy / nhìn", targetFocus: "/ʃ/ vs /s/", phoneticSpelling: "/ʃiː/ - /siː/" },
  { id: 'mp_22', title: "Phân biệt /tʃ/ và /ʃ/", contentEn: "chair / share", contentVi: "cái ghế / chia sẻ", targetFocus: "/tʃ/ vs /ʃ/", phoneticSpelling: "/tʃeər/ - /ʃeər/" },
  { id: 'mp_23', title: "Phân biệt /dʒ/ và /tʃ/", contentEn: "jam / charm", contentVi: "mứt / quyến rũ", targetFocus: "/dʒ/ vs /tʃ/", phoneticSpelling: "/dʒæm/ - /tʃɑːm/" },
  { id: 'mp_24', title: "Phân biệt /k/ và /ɡ/", contentEn: "coat / goat", contentVi: "áo khoác / con dê", targetFocus: "/k/ vs /ɡ/", phoneticSpelling: "/kəʊt/ - /ɡəʊt/" },
  { id: 'mp_25', title: "Phân biệt /m/ và /n/", contentEn: "sum / sun", contentVi: "tổng số / mặt trời", targetFocus: "/m/ vs /n/", phoneticSpelling: "/sʌm/ - /sʌn/" },
  { id: 'mp_26', title: "Phân biệt /aɪ/ và /eɪ/", contentEn: "sigh / say", contentVi: "thở dài / nói", targetFocus: "/aɪ/ vs /eɪ/", phoneticSpelling: "/saɪ/ - /seɪ/" },
  { id: 'mp_27', title: "Phân biệt /ɒ/ và /ʌ/", contentEn: "lock / luck", contentVi: "ổ khóa / may mắn", targetFocus: "/ɒ/ vs /ʌ/", phoneticSpelling: "/lɒk/ - /lʌk/" },
  { id: 'mp_28', title: "Phân biệt /aʊ/ và /əʊ/", contentEn: "now / no", contentVi: "bây giờ / không", targetFocus: "/aʊ/ vs /əʊ/", phoneticSpelling: "/naʊ/ - /nəʊ/" },
  { id: 'mp_29', title: "Phân biệt /ɔː/ và /ɜː/", contentEn: "port / pert", contentVi: "cảng / xấc xược", targetFocus: "/ɔː/ vs /ɜː/", phoneticSpelling: "/pɔːt/ - /pɜːt/" },
  { id: 'mp_30', title: "Phân biệt /ɪə/ và /eə/", contentEn: "ear / air", contentVi: "tai / không khí", targetFocus: "/ɪə/ vs /eə/", phoneticSpelling: "/ɪər/ - /eər/" },
  { id: 'mp_31', title: "Phân biệt /p/ và /f/", contentEn: "pool / fool", contentVi: "hồ bơi / kẻ ngốc", targetFocus: "/p/ vs /f/", phoneticSpelling: "/puːl/ - /fuːl/" },
  { id: 'mp_32', title: "Phân biệt /b/ và /v/", contentEn: "berry / very", contentVi: "quả mọng / rất", targetFocus: "/b/ vs /v/", phoneticSpelling: "/ˈberi/ - /ˈveri/" },
  { id: 'mp_33', title: "Phân biệt /t/ và /θ/", contentEn: "tick / thick", contentVi: "tích tắc / dày", targetFocus: "/t/ vs /θ/", phoneticSpelling: "/tɪk/ - /θɪk/" },
  { id: 'mp_34', title: "Phân biệt /d/ và /ð/", contentEn: "dan / than", contentVi: "tên Dan / hơn", targetFocus: "/d/ vs /ð/", phoneticSpelling: "/dæn/ - /ðæn/" },
  { id: 'mp_35', title: "Phân biệt /k/ và /h/", contentEn: "cat / hat", contentVi: "con mèo / cái mũ", targetFocus: "/k/ vs /h/", phoneticSpelling: "/kæt/ - /hæt/" },
  { id: 'mp_36', title: "Phân biệt /s/ và /ʃ/", contentEn: "sea / she", contentVi: "biển / cô ấy", targetFocus: "/s/ vs /ʃ/", phoneticSpelling: "/siː/ - /ʃiː/" },
  { id: 'mp_37', title: "Phân biệt /z/ và /ʒ/", contentEn: "seizure / caesar", contentVi: "cơn co giật / caesar", targetFocus: "/z/ vs /ʒ/", phoneticSpelling: "/ˈsiːʒər/ - /ˈsiːzər/" },
  { id: 'mp_38', title: "Phân biệt /tʃ/ và /dʒ/", contentEn: "choke / joke", contentVi: "nghẹn / trò đùa", targetFocus: "/tʃ/ vs /dʒ/", phoneticSpelling: "/tʃəʊk/ - /dʒəʊk/" },
  { id: 'mp_39', title: "Phân biệt /m/ và /ŋ/", contentEn: "sum / sung", contentVi: "tổng số / đã hát", targetFocus: "/m/ vs /ŋ/", phoneticSpelling: "/sʌm/ - /sʌŋ/" },
  { id: 'mp_40', title: "Phân biệt /n/ và /l/", contentEn: "night / light", contentVi: "ban đêm / ánh sáng", targetFocus: "/n/ vs /l/", phoneticSpelling: "/naɪt/ - /laɪt/" },
  { id: 'mp_41', title: "Phân biệt /r/ và /w/", contentEn: "red / wed", contentVi: "màu đỏ / kết hôn", targetFocus: "/r/ vs /w/", phoneticSpelling: "/red/ - /wed/" },
  { id: 'mp_42', title: "Phân biệt /j/ và /dʒ/", contentEn: "yet / jet", contentVi: "chưa / máy bay jet", targetFocus: "/j/ vs /dʒ/", phoneticSpelling: "/jet/ - /dʒet/" },
  { id: 'mp_43', title: "Phân biệt /w/ và /j/", contentEn: "wet / yet", contentVi: "ướt / chưa", targetFocus: "/w/ vs /j/", phoneticSpelling: "/wet/ - /jet/" },
  { id: 'mp_44', title: "Phân biệt /θ/ và /s/", contentEn: "path / pass", contentVi: "con đường / đi qua", targetFocus: "/θ/ vs /s/", phoneticSpelling: "/pɑːθ/ - /pɑːs/" },
  { id: 'mp_45', title: "Phân biệt /ð/ và /z/", contentEn: "clothe / close", contentVi: "mặc đồ / đóng cửa", targetFocus: "/ð/ vs /z/", phoneticSpelling: "/kləʊð/ - /kləʊz/" },
  { id: 'mp_46', title: "Phân biệt /ɑː/ và /ʌ/", contentEn: "heart / hut", contentVi: "trái tim / túp lều", targetFocus: "/ɑː/ vs /ʌ/", phoneticSpelling: "/hɑːt/ - /hʌt/" },
  { id: 'mp_47', title: "Phân biệt /ɜː/ và /ɔː/", contentEn: "bird / board", contentVi: "con chim / cái bảng", targetFocus: "/ɜː/ vs /ɔː/", phoneticSpelling: "/bɜːd/ - /bɔːd/" },
  { id: 'mp_48', title: "Phân biệt /ʊ/ và /ɒ/", contentEn: "look / lock", contentVi: "nhìn / ổ khóa", targetFocus: "/ʊ/ vs /ɒ/", phoneticSpelling: "/lʊk/ - /lɒk/" },
  { id: 'mp_49', title: "Phân biệt /uː/ và /əʊ/", contentEn: "boot / boat", contentVi: "đôi bốt / cái thuyền", targetFocus: "/uː/ vs /əʊ/", phoneticSpelling: "/buːt/ - /bəʊt/" },
  { id: 'mp_50', title: "Phân biệt /eɪ/ và /ɛər/", contentEn: "bay / bare", contentVi: "vịnh / trần trụi", targetFocus: "/eɪ/ vs /ɛər/", phoneticSpelling: "/beɪ/ - /beər/" }
];