// src/data/station1/linkingSounds.ts
export interface LinkingSoundItem {
  id: string;
  title: string;
  contentEn: string;
  contentVi?: string;
  targetFocus: string;
  phoneticSpelling?: string;
}

export const LINKING_SOUNDS_DATA: LinkingSoundItem[] = [
  { id: 'ls_1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Check it out", contentVi: "Kiểm tra nó xem", targetFocus: "k + i -> che-kit-out", phoneticSpelling: "/tʃek ɪt aʊt/" },
  { id: 'ls_2', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Pick up the phone", contentVi: "Nhấc điện thoại lên", targetFocus: "k + u -> pi-kup", phoneticSpelling: "/pɪk ʌp ðə fəʊn/" },
  { id: 'ls_3', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Turn off the light", contentVi: "Tắt đèn đi", targetFocus: "n + o -> tur-noff", phoneticSpelling: "/tɜːn ɒf ðə laɪt/" },
  { id: 'ls_4', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Stand up please", contentVi: "Hãy đứng lên", targetFocus: "d + u -> stan-dup", phoneticSpelling: "/stænd ʌp pliːz/" },
  { id: 'ls_5', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Sit on the chair", contentVi: "Ngồi trên ghế", targetFocus: "t + o -> si-ton", phoneticSpelling: "/sɪt ɒn ðə tʃeər/" },
  { id: 'ls_6', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Wake up early", contentVi: "Thức dậy sớm", targetFocus: "k + u -> wa-kup", phoneticSpelling: "/weɪk ʌp ˈɜːli/" },
  { id: 'ls_7', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Clean it again", contentVi: "Lau sạch lại", targetFocus: "n + i -> clea-nit", phoneticSpelling: "/kliːn ɪt əˈɡen/" },
  { id: 'ls_8', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Look at me", contentVi: "Nhìn tôi này", targetFocus: "k + a -> loo-kat", phoneticSpelling: "/lʊk æt miː/" },
  { id: 'ls_9', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Come in", contentVi: "Mời vào", targetFocus: "m + i -> co-min", phoneticSpelling: "/kʌm ɪn/" },
  { id: 'ls_10', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Hold on a second", contentVi: "Giữ máy một chút", targetFocus: "d + o -> hol-don", phoneticSpelling: "/həʊld ɒn ə ˈsekənd/" },
  { id: 'ls_11', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Read a book", contentVi: "Đọc một cuốn sách", targetFocus: "d + a -> ree-da-book", phoneticSpelling: "/riːd ə bʊk/" },
  { id: 'ls_12', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Go away now", contentVi: "Đi ra chỗ khác", targetFocus: "w-insert -> go-waway", phoneticSpelling: "/ɡəʊ əˈweɪ naʊ/" },
  { id: 'ls_13', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "I agree with you", contentVi: "Tôi đồng ý với bạn", targetFocus: "y-insert -> I-yagree", phoneticSpelling: "/aɪ əˈɡriː wɪð juː/" },
  { id: 'ls_14', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Ask about it", contentVi: "Hỏi về nó", targetFocus: "k + a -> as-kabout", phoneticSpelling: "/ɑːsk əˈbaʊt ɪt/" },
  { id: 'ls_15', title: "Nối âm Nuốt âm T (Flap T)", contentEn: "Water bottle", contentVi: "Chai nước", targetFocus: "t -> d (wa-der)", phoneticSpelling: "/ˈwɔːtər ˈbɒtl/" },
  { id: 'ls_16', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Get out of here", contentVi: "Đi ra khỏi đây", targetFocus: "t + o -> ge-tout-dav-here", phoneticSpelling: "/ɡet aʊt əv hɪər/" },
  { id: 'ls_17', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Not at all", contentVi: "Không có gì đâu", targetFocus: "t + a -> no-ta-tall", phoneticSpelling: "/nɒt ət ɔːl/" },
  { id: 'ls_18', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "An apple a day", contentVi: "Mỗi ngày một quả táo", targetFocus: "n + a -> an-napple", phoneticSpelling: "/ən ˈæpl ə deɪ/" },
  { id: 'ls_19', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "First of all", contentVi: "Trước hết", targetFocus: "st + o -> firs-to-vall", phoneticSpelling: "/fɜːst əv ɔːl/" },
  { id: 'ls_20', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Clean it up", contentVi: "Dọn dẹp sạch đi", targetFocus: "n + i -> clea-ni-tup", phoneticSpelling: "/kliːn ɪt ʌp/" },
  { id: 'ls_21', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Think about it", contentVi: "Suy nghĩ về điều đó", targetFocus: "k + a -> thin-ka-bou-tit", phoneticSpelling: "/θɪŋk əˈbaʊt ɪt/" },
  { id: 'ls_22', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Take a break", contentVi: "Nghỉ giải lao chút", targetFocus: "k + a -> ta-ka-break", phoneticSpelling: "/teɪk ə breɪk/" },
  { id: 'ls_23', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Give it away", contentVi: "Cho nó đi", targetFocus: "v + i -> gi-vi-ta-way", phoneticSpelling: "/ɡɪv ɪt əˈweɪ/" },
  { id: 'ls_24', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Leave it alone", contentVi: "Để nó yên", targetFocus: "v + i -> lea-vi-ta-lone", phoneticSpelling: "/liːv ɪt əˈləʊn/" },
  { id: 'ls_25', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Speak up please", contentVi: "Nói to lên", targetFocus: "k + u -> spea-kup", phoneticSpelling: "/spiːk ʌp pliːz/" },
  { id: 'ls_26', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Too often", contentVi: "Quá thường xuyên", targetFocus: "w-insert -> too-woften", phoneticSpelling: "/tuː ˈɒfn/" },
  { id: 'ls_27', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "See it through", contentVi: "Làm đến cùng", targetFocus: "y-insert -> see-yit", phoneticSpelling: "/siː ɪt θruː/" },
  { id: 'ls_28', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Blue eyes", contentVi: "Đôi mắt xanh", targetFocus: "w-insert -> blue-weyes", phoneticSpelling: "/bluː aɪz/" },
  { id: 'ls_29', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Pay all bills", contentVi: "Thanh toán hết hóa đơn", targetFocus: "y-insert -> pay-yall", phoneticSpelling: "/peɪ ɔːl bɪlz/" },
  { id: 'ls_30', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Say it again", contentVi: "Nói lại lần nữa", targetFocus: "y-insert -> say-yit", phoneticSpelling: "/seɪ ɪt əˈɡen/" },
  { id: 'ls_31', title: "Nối âm Nuốt âm T (Flap T)", contentEn: "Better late than never", contentVi: "Thà muộn còn hơn không", targetFocus: "t -> d (be-der)", phoneticSpelling: "/ˈbetər leɪt ðæn ˈnevər/" },
  { id: 'ls_32', title: "Nối âm Nuốt âm T (Flap T)", contentEn: "City center", contentVi: "Trung tâm thành phố", targetFocus: "t -> d (ci-dy)", phoneticSpelling: "/ˈsɪti ˈsentər/" },
  { id: 'ls_33', title: "Nối âm Nuốt âm T (Flap T)", contentEn: "Computer system", contentVi: "Hệ thống máy tính", targetFocus: "t -> d (com-pyu-der)", phoneticSpelling: "/kəmˈpjuːtər ˈsɪstəm/" },
  { id: 'ls_34', title: "Nối âm Nuốt âm T (Flap T)", contentEn: "A lot of water", contentVi: "Nhiều nước", targetFocus: "t -> d (lo-dav-wa-der)", phoneticSpelling: "/ə lɒt əv ˈwɔːtər/" },
  { id: 'ls_35', title: "Nối âm Phụ âm đồng dạng", contentEn: "Black cat", contentVi: "Con mèo đen", targetFocus: "k+k -> bla-cat", phoneticSpelling: "/blæk kæt/" },
  { id: 'ls_36', title: "Nối âm Phụ âm đồng dạng", contentEn: "Big gap", contentVi: "Khoảng trống lớn", targetFocus: "g+g -> bi-gap", phoneticSpelling: "/bɪɡ ɡæp/" },
  { id: 'ls_37', title: "Nối âm Phụ âm đồng dạng", contentEn: "Bad day", contentVi: "Ngày tồi tệ", targetFocus: "d+d -> ba-day", phoneticSpelling: "/bæd deɪ/" },
  { id: 'ls_38', title: "Nối âm Phụ âm đồng dạng", contentEn: "Bus stop", contentVi: "Trạm xe buýt", targetFocus: "s+s -> bu-stop", phoneticSpelling: "/bʌs stɒp/" },
  { id: 'ls_39', title: "Nối âm Nuốt phụ âm yếu", contentEn: "Next door", contentVi: "Nhà bên cạnh", targetFocus: "nuốt t -> nex-door", phoneticSpelling: "/nekst dɔːr/" },
  { id: 'ls_40', title: "Nối âm Nuốt phụ âm yếu", contentEn: "Last night", contentVi: "Đêm qua", targetFocus: "nuốt t -> las-night", phoneticSpelling: "/lɑːst naɪt/" },
  { id: 'ls_41', title: "Nối âm Nuốt phụ âm yếu", contentEn: "Hold tight", contentVi: "Giữ chặt", targetFocus: "nuốt d -> hol-tight", phoneticSpelling: "/həʊld taɪt/" },
  { id: 'ls_42', title: "Nối âm Đồng hóa âm /t/ + /j/", contentEn: "Nice to meet you", contentVi: "Rất vui được gặp bạn", targetFocus: "t + y -> mee-choo", phoneticSpelling: "/naɪs tuː miːt juː/" },
  { id: 'ls_43', title: "Nối âm Đồng hóa âm /d/ + /j/", contentEn: "Would you help me?", contentVi: "Bạn giúp tôi được không?", targetFocus: "d + y -> woul-joo", phoneticSpelling: "/wʊd juː help miː/" },
  { id: 'ls_44', title: "Nối âm Đồng hóa âm /s/ + /j/", contentEn: "Bless you", contentVi: "Chúa ban phúc cho bạn", targetFocus: "s + y -> bles-shoo", phoneticSpelling: "/bles juː/" },
  { id: 'ls_45', title: "Nối âm Đồng hóa âm /z/ + /j/", contentEn: "How was your day?", contentVi: "Ngày hôm nay thế nào?", targetFocus: "z + y -> wa-zhoor", phoneticSpelling: "/haʊ wɒz jɔːr deɪ/" },
  { id: 'ls_46', title: "Nối âm Cụm câu giao tiếp", contentEn: "What are you doing?", contentVi: "Bạn đang làm gì thế?", targetFocus: "whatcha-doin", phoneticSpelling: "/wɒt ə juː ˈduːɪŋ/" },
  { id: 'ls_47', title: "Nối âm Cụm câu giao tiếp", contentEn: "Don't you know that?", contentVi: "Bạn không biết điều đó sao?", targetFocus: "don-choo-know", phoneticSpelling: "/dəʊnt juː nəʊ ðæt/" },
  { id: 'ls_48', title: "Nối âm Cụm câu giao tiếp", contentEn: "Can I have a cup of tea?", contentVi: "Cho tôi một tách trà", targetFocus: "ca-ni-ha-va-cu-pov-tea", phoneticSpelling: "/kæn aɪ hæv ə kʌp əv tiː/" },
  { id: 'ls_49', title: "Nối âm Cụm câu giao tiếp", contentEn: "Put it on the table", contentVi: "Đặt nó lên bàn", targetFocus: "pu-ti-ton", phoneticSpelling: "/pʊt ɪt ɒn ðə ˈteɪbl/" },
  { id: 'ls_50', title: "Nối âm Cụm câu giao tiếp", contentEn: "What time is it?", contentVi: "Mấy giờ rồi?", targetFocus: "what-ti-mi-zit", phoneticSpelling: "/wɒt taɪm ɪz ɪt/" }
];