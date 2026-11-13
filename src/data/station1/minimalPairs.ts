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
  { id: 'mp_1', title: "Phân biệt /iː/ và /ɪ/", contentEn: "sheep / ship", contentVi: "con cừu / con tàu thủy", targetFocus: "/iː/ dài, căng khóe miệng vs /ɪ/ ngắn, thả lỏng", phoneticSpelling: "/ʃiːp/ - /ʃɪp/" },
  { id: 'mp_2', title: "Phân biệt /iː/ và /ɪ/", contentEn: "leave / live", contentVi: "rời đi / sinh sống", targetFocus: "/iː/ kéo dài 1.5 nhịp vs /ɪ/ ngắt gọn", phoneticSpelling: "/liːv/ - /lɪv/" },
  { id: 'mp_3', title: "Phân biệt /iː/ và /ɪ/", contentEn: "eat / it", contentVi: "ăn / nó", targetFocus: "/iː/ căng môi ngang vs /ɪ/ hạ nhẹ cằm", phoneticSpelling: "/iːt/ - /ɪt/" },
  { id: 'mp_4', title: "Phân biệt /iː/ và /ɪ/", contentEn: "feet / fit", contentVi: "đôi bàn chân / vừa vặn", targetFocus: "/iː/ dài vs /ɪ/ ngắn dứt khoát", phoneticSpelling: "/fiːt/ - /fɪt/" },
  { id: 'mp_5', title: "Phân biệt /uː/ và /ʊ/", contentEn: "fool / full", contentVi: "kẻ ngốc / đầy đủ, no", targetFocus: "/uː/ chu tròn môi căng vs /ʊ/ thả lỏng môi", phoneticSpelling: "/fuːl/ - /fʊl/" },
  { id: 'mp_6', title: "Phân biệt /uː/ và /ʊ/", contentEn: "pool / pull", contentVi: "hồ bơi / kéo lại", targetFocus: "/uː/ ngân dài vs /ʊ/ ngắn, không chu môi quá mức", phoneticSpelling: "/puːl/ - /pʊl/" },
  { id: 'mp_7', title: "Phân biệt /e/ và /æ/", contentEn: "pen / pan", contentVi: "cây bút / cái chảo", targetFocus: "/e/ mở miệng vừa vs /æ/ hạ thấp cằm, mở rộng ngang", phoneticSpelling: "/pen/ - /pæn/" },
  { id: 'mp_8', title: "Phân biệt /e/ và /æ/", contentEn: "men / man", contentVi: "những người đàn ông / một người đàn ông", targetFocus: "/e/ gọn vs /æ/ âm bẹt mở rộng khẩu hình", phoneticSpelling: "/men/ - /mæn/" },
  { id: 'mp_9', title: "Phân biệt /æ/ và /ʌ/", contentEn: "cat / cut", contentVi: "con mèo / cắt", targetFocus: "/æ/ mở rộng ngang vs /ʌ/ mở tự nhiên ở giữa", phoneticSpelling: "/kæt/ - /kʌt/" },
  { id: 'mp_10', title: "Phân biệt /æ/ và /ʌ/", contentEn: "hat / hut", contentVi: "cái mũ / túp lều", targetFocus: "/æ/ bẹt miệng vs /ʌ/ ngắn, bật gọn", phoneticSpelling: "/hæt/ - /hʌt/" },
  { id: 'mp_11', title: "Phân biệt /b/ và /p/", contentEn: "bat / pat", contentVi: "gậy bóng chày / vỗ nhẹ", targetFocus: "/b/ rung dây thanh vs /p/ bật luồng hơi mạnh", phoneticSpelling: "/bæt/ - /pæt/" },
  { id: 'mp_12', title: "Phân biệt /b/ và /p/", contentEn: "big / pig", contentVi: "to lớn / con heo", targetFocus: "/b/ hữu thanh vs /p/ vô thanh bật hơi", phoneticSpelling: "/bɪɡ/ - /pɪɡ/" },
  { id: 'mp_13', title: "Phân biệt /v/ và /f/", contentEn: "van / fan", contentVi: "xe tải nhỏ / cái quạt", targetFocus: "/v/ răng chạm môi dưới có rung vs /f/ chỉ thổi hơi", phoneticSpelling: "/væn/ - /fæn/" },
  { id: 'mp_14', title: "Phân biệt /v/ và /f/", contentEn: "vine / fine", contentVi: "dây nho / tốt đẹp", targetFocus: "/v/ rung cổ họng vs /f/ luồng hơi nhẹ", phoneticSpelling: "/vaɪn/ - /faɪn/" },
  { id: 'mp_15', title: "Phân biệt /d/ và /t/", contentEn: "do / to", contentVi: "làm / đến, tới", targetFocus: "/d/ hữu thanh vs /t/ bật hơi đầu lưỡi", phoneticSpelling: "/duː/ - /tuː/" },
  { id: 'mp_16', title: "Phân biệt /z/ và /s/", contentEn: "zoo / sue", contentVi: "sở thú / kiện tụng", targetFocus: "/z/ rung cổ họng như tiếng ong vs /s/ xì hơi nhẹ", phoneticSpelling: "/zuː/ - /suː/" },
  { id: 'mp_17', title: "Phân biệt /ð/ và /θ/", contentEn: "this / think", contentVi: "cái này / suy nghĩ", targetFocus: "/ð/ đầu lưỡi giữa 2 răng có rung vs /θ/ chỉ thổi hơi", phoneticSpelling: "/ðɪs/ - /θɪŋk/" },
  { id: 'mp_18', title: "Phân biệt /l/ và /r/", contentEn: "light / right", contentVi: "ánh sáng / bên phải, đúng", targetFocus: "/l/ đầu lưỡi chạm nướu trên vs /r/ cuộn lưỡi vào trong", phoneticSpelling: "/laɪt/ - /raɪt/" },
  { id: 'mp_19', title: "Phân biệt /l/ và /r/", contentEn: "lead / read", contentVi: "dẫn dắt / đọc sách", targetFocus: "/l/ chạm nướu vs /r/ không chạm vòm họng", phoneticSpelling: "/liːd/ - /riːd/" },
  { id: 'mp_20', title: "Phân biệt /w/ và /v/", contentEn: "wet / vet", contentVi: "ẩm ướt / bác sĩ thú y", targetFocus: "/w/ chu tròn môi vs /v/ răng trên chạm môi dưới", phoneticSpelling: "/wet/ - /vet/" },
  { id: 'mp_21', title: "Phân biệt /ʃ/ và /s/", contentEn: "she / see", contentVi: "cô ấy / nhìn thấy", targetFocus: "/ʃ/ chu môi cong lưỡi vs /s/ cười nhẹ", phoneticSpelling: "/ʃiː/ - /siː/" },
  { id: 'mp_22', title: "Phân biệt /tʃ/ và /ʃ/", contentEn: "chair / share", contentVi: "cái ghế / chia sẻ", targetFocus: "/tʃ/ bật tắc xát dứt khoát vs /ʃ/ kéo dài luồng hơi", phoneticSpelling: "/tʃeər/ - /ʃeər/" },
  { id: 'mp_23', title: "Phân biệt /dʒ/ và /tʃ/", contentEn: "jam / charm", contentVi: "mứt trái cây / sự quyến rũ", targetFocus: "/dʒ/ hữu thanh có rung vs /tʃ/ vô thanh bật hơi", phoneticSpelling: "/dʒæm/ - /tʃɑːm/" },
  { id: 'mp_24', title: "Phân biệt /k/ và /ɡ/", contentEn: "coat / goat", contentVi: "áo khoác / con dê", targetFocus: "/k/ bật hơi cuống lưỡi vs /ɡ/ rung cuống họng", phoneticSpelling: "/kəʊt/ - /ɡəʊt/" },
  { id: 'mp_25', title: "Phân biệt /m/ và /n/", contentEn: "sum / sun", contentVi: "tổng số / mặt trời", targetFocus: "/m/ khép hai môi ở cuối vs /n/ đầu lưỡi chạm nướu", phoneticSpelling: "/sʌm/ - /sʌn/" },
  { id: 'mp_26', title: "Phân biệt /aɪ/ và /eɪ/", contentEn: "sigh / say", contentVi: "thở dài / nói", targetFocus: "/aɪ/ mở rộng từ /a/ sang /ɪ/ vs /eɪ/ lướt từ /e/ sang /ɪ/", phoneticSpelling: "/saɪ/ - /seɪ/" },
  { id: 'mp_27', title: "Phân biệt /ɒ/ và /ʌ/", contentEn: "lock / luck", contentVi: "ổ khóa / sự may mắn", targetFocus: "/ɒ/ tròn môi nhẹ vs /ʌ/ thả lỏng tự nhiên", phoneticSpelling: "/lɒk/ - /lʌk/" },
  { id: 'mp_28', title: "Phân biệt /aʊ/ và /əʊ/", contentEn: "now / no", contentVi: "bây giờ / không", targetFocus: "/aʊ/ mở rộng rồi chu môi vs /əʊ/ lướt nhẹ tròn môi", phoneticSpelling: "/naʊ/ - /nəʊ/" },
  { id: 'mp_29', title: "Phân biệt /ɔː/ và /ɜː/", contentEn: "port / pert", contentVi: "bến cảng / lanh lợi, xấc xược", targetFocus: "/ɔː/ tròn môi sâu vs /ɜː/ hơi cong lưỡi giữa miệng", phoneticSpelling: "/pɔːt/ - /pɜːt/" },
  { id: 'mp_30', title: "Phân biệt /ɪə/ và /eə/", contentEn: "ear / air", contentVi: "đôi tai / không khí", targetFocus: "/ɪə/ khởi đầu hẹp từ /ɪ/ vs /eə/ mở rộng hơn từ /e/", phoneticSpelling: "/ɪər/ - /eər/" },
  { id: 'mp_31', title: "Phân biệt /p/ và /f/", contentEn: "pool / fool", contentVi: "hồ bơi / kẻ ngốc", targetFocus: "/p/ mím hai môi bật hơi vs /f/ răng trên chạm môi dưới", phoneticSpelling: "/puːl/ - /fuːl/" },
  { id: 'mp_32', title: "Phân biệt /b/ và /v/", contentEn: "berry / very", contentVi: "quả mọng / rất", targetFocus: "/b/ mím hai môi vs /v/ răng chạm môi dưới", phoneticSpelling: "/ˈberi/ - /ˈveri/" },
  { id: 'mp_33', title: "Phân biệt /t/ và /θ/", contentEn: "tick / thick", contentVi: "tiếng tích tắc / dày dặn", targetFocus: "/t/ lưỡi sau răng trên vs /θ/ lưỡi đặt giữa hai răng", phoneticSpelling: "/tɪk/ - /θɪk/" },
  { id: 'mp_34', title: "Phân biệt /d/ và /ð/", contentEn: "dan / than", contentVi: "tên riêng Dan / so với, hơn", targetFocus: "/d/ lưỡi chạm nướu vs /ð/ lưỡi giữa hai răng có rung", phoneticSpelling: "/dæn/ - /ðæn/" },
  { id: 'mp_35', title: "Phân biệt /k/ và /h/", contentEn: "cat / hat", contentVi: "con mèo / cái mũ", targetFocus: "/k/ bật cuống lưỡi vs /h/ đẩy hơi nhẹ từ họng", phoneticSpelling: "/kæt/ - /hæt/" },
  { id: 'mp_36', title: "Phân biệt /s/ và /ʃ/", contentEn: "sell / shell", contentVi: "bán hàng / vỏ sò", targetFocus: "/s/ âm gió mảnh vs /ʃ/ chu môi âm dày", phoneticSpelling: "/sel/ - /ʃel/" },
  { id: 'mp_37', title: "Phân biệt /ʒ/ và /z/", contentEn: "beige / bays", contentVi: "màu be / các vịnh biển", targetFocus: "/ʒ/ chu môi rung nhẹ vs /z/ cười nhẹ đầu lưỡi sau răng", phoneticSpelling: "/beɪʒ/ - /beɪz/" },
  { id: 'mp_38', title: "Phân biệt /tʃ/ và /dʒ/", contentEn: "choke / joke", contentVi: "nghẹn lời / câu chuyện đùa", targetFocus: "/tʃ/ vô thanh bật mạnh vs /dʒ/ hữu thanh rung cổ họng", phoneticSpelling: "/tʃəʊk/ - /dʒəʊk/" },
  { id: 'mp_39', title: "Phân biệt /m/ và /ŋ/", contentEn: "sum / sung", contentVi: "tổng số / đã hát (phân từ)", targetFocus: "/m/ khép môi vs /ŋ/ nâng cuống lưỡi, mở miệng", phoneticSpelling: "/sʌm/ - /sʌŋ/" },
  { id: 'mp_40', title: "Phân biệt /n/ và /l/", contentEn: "night / light", contentVi: "ban đêm / ánh sáng", targetFocus: "/n/ đẩy hơi qua mũi vs /l/ đẩy hơi qua hai bên lưỡi", phoneticSpelling: "/naɪt/ - /laɪt/" },
  { id: 'mp_41', title: "Phân biệt /r/ và /w/", contentEn: "red / wed", contentVi: "màu đỏ / kết hôn", targetFocus: "/r/ cuộn lưỡi vào trong vs /w/ chu tròn môi", phoneticSpelling: "/red/ - /wed/" },
  { id: 'mp_42', title: "Phân biệt /j/ và /dʒ/", contentEn: "yet / jet", contentVi: "vẫn chưa / máy bay phản lực", targetFocus: "/j/ lướt nhẹ như âm 'd' mềm vs /dʒ/ bật rung mạnh", phoneticSpelling: "/jet/ - /dʒet/" },
  { id: 'mp_43', title: "Phân biệt /w/ và /j/", contentEn: "wet / yet", contentVi: "ẩm ướt / vẫn chưa", targetFocus: "/w/ chu tròn môi vs /j/ khóe miệng kéo nhẹ sang ngang", phoneticSpelling: "/wet/ - /jet/" },
  { id: 'mp_44', title: "Phân biệt /θ/ và /s/", contentEn: "path / pass", contentVi: "con đường mòn / đi ngang qua", targetFocus: "/θ/ đưa lưỡi ra giữa răng ở cuối vs /s/ thu lưỡi sau răng", phoneticSpelling: "/pɑːθ/ - /pɑːs/" },
  { id: 'mp_45', title: "Phân biệt /ð/ và /z/", contentEn: "clothe / close", contentVi: "mặc quần áo / đóng cửa lại", targetFocus: "/ð/ lưỡi giữa răng cuối từ vs /z/ lưỡi sau răng", phoneticSpelling: "/kləʊð/ - /kləʊz/" },
  { id: 'mp_46', title: "Phân biệt /ɑː/ và /ʌ/", contentEn: "heart / hut", contentVi: "trái tim / túp lều", targetFocus: "/ɑː/ mở rộng họng kéo dài vs /ʌ/ ngắn, dứt khoát", phoneticSpelling: "/hɑːt/ - /hʌt/" },
  { id: 'mp_47', title: "Phân biệt /ɜː/ và /ɔː/", contentEn: "bird / board", contentVi: "con chim / tấm bảng", targetFocus: "/ɜː/ môi thả lỏng, cong lưỡi vs /ɔː/ môi chu tròn", phoneticSpelling: "/bɜːd/ - /bɔːd/" },
  { id: 'mp_48', title: "Phân biệt /ʊ/ và /ɒ/", contentEn: "look / lock", contentVi: "nhìn ngắm / ổ khóa", targetFocus: "/ʊ/ hơi chu môi nhẹ vs /ɒ/ hạ thấp hàm dưới", phoneticSpelling: "/lʊk/ - /lɒk/" },
  { id: 'mp_49', title: "Phân biệt /uː/ và /əʊ/", contentEn: "boot / boat", contentVi: "đôi ủng / chiếc thuyền", targetFocus: "/uː/ giữ nguyên khẩu hình tròn vs /əʊ/ chuyển từ /ə/ sang /ʊ/", phoneticSpelling: "/buːt/ - /bəʊt/" },
  { id: 'mp_50', title: "Phân biệt /eɪ/ và /eə/", contentEn: "bay / bare", contentVi: "vịnh biển / trần trụi, trống trải", targetFocus: "/eɪ/ khép dần về /ɪ/ vs /eə/ mở về âm trung tâm /ə/", phoneticSpelling: "/beɪ/ - /beər/" }
];