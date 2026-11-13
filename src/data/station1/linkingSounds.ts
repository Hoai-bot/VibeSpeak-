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
  { id: 'ls_1', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Check it out", contentVi: "Xem thử cái này đi", targetFocus: "Nối /k/ + /ɪ/ và /t/ + /aʊ/ ➔ che-ki-dout", phoneticSpelling: "/tʃek ɪt aʊt/ ➔ /ˈtʃe.kɪ.daʊt/" },
  { id: 'ls_2', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Pick up the phone", contentVi: "Nhấc điện thoại lên", targetFocus: "Nối /k/ + /ʌ/ ➔ pi-kup", phoneticSpelling: "/pɪk ʌp ðə foʊn/ ➔ /ˈpɪ.kʌp ðə foʊn/" },
  { id: 'ls_3', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Turn off the light", contentVi: "Tắt đèn đi", targetFocus: "Nối /n/ + /ɔː/ ➔ tur-noff", phoneticSpelling: "/tɜːrn ɔːf ðə laɪt/ ➔ /ˈtɜːr.nɔːf ðə laɪt/" },
  { id: 'ls_4', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Stand up please", contentVi: "Hãy đứng lên", targetFocus: "Nối /d/ + /ʌ/ ➔ stan-dup", phoneticSpelling: "/stænd ʌp pliːz/ ➔ /ˈstæn.dʌp pliːz/" },
  { id: 'ls_5', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Sit on the chair", contentVi: "Ngồi lên ghế", targetFocus: "Nối /t/ + /ɑː/ ➔ si-ton", phoneticSpelling: "/sɪt ɑːn ðə tʃer/ ➔ /ˈsɪ.tɑːn ðə tʃer/" },
  { id: 'ls_6', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Wake up early", contentVi: "Thức dậy sớm", targetFocus: "Nối /k/ + /ʌ/ và /p/ + /ɜː/ ➔ wa-ku-pearly", phoneticSpelling: "/weɪk ʌp ˈɜːr.li/ ➔ /ˌweɪ.kʌˈpɜːr.li/" },
  { id: 'ls_7', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Clean it again", contentVi: "Lau sạch lại lần nữa", targetFocus: "Nối /n/ + /ɪ/ và /t/ + /ə/ ➔ clea-ni-tagain", phoneticSpelling: "/kliːn ɪt əˈɡen/ ➔ /ˈkliː.nɪ.təˈɡen/" },
  { id: 'ls_8', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Look at me", contentVi: "Nhìn tôi này", targetFocus: "Nối /k/ + /æ/ ➔ loo-kat", phoneticSpelling: "/lʊk æt miː/ ➔ /ˈlʊ.kæt miː/" },
  { id: 'ls_9', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Come in", contentVi: "Mời vào trong", targetFocus: "Nối /m/ + /ɪ/ ➔ co-min", phoneticSpelling: "/kʌm ɪn/ ➔ /ˈkʌ.mɪn/" },
  { id: 'ls_10', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Hold on a second", contentVi: "Giữ máy một chút nhé", targetFocus: "Nối /d/ + /ɑː/ và /n/ + /ə/ ➔ hol-do-na", phoneticSpelling: "/hoʊld ɑːn ə ˈsek.ənd/ ➔ /ˈhoʊl.dɑː.nə ˈsek.ənd/" },
  { id: 'ls_11', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Read a book", contentVi: "Đọc một cuốn sách", targetFocus: "Nối /d/ + /ə/ ➔ ree-da-book", phoneticSpelling: "/riːd ə bʊk/ ➔ /ˈriː.də bʊk/" },
  { id: 'ls_12', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Go away now", contentVi: "Đi ra chỗ khác ngay", targetFocus: "Chèn âm đệm /w/ ➔ go-waway", phoneticSpelling: "/ɡoʊ əˈweɪ naʊ/ ➔ /ˌɡoʊ.wəˈweɪ naʊ/" },
  { id: 'ls_13', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "I agree with you", contentVi: "Tôi đồng ý với bạn", targetFocus: "Chèn âm đệm /j/ ➔ I-yagree", phoneticSpelling: "/aɪ əˈɡriː wɪð juː/ ➔ /ˌaɪ.jəˈɡriː wɪð juː/" },
  { id: 'ls_14', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Ask about it", contentVi: "Hỏi về điều đó", targetFocus: "Nối /k/ + /ə/ và /t/ + /ɪ/ ➔ as-ka-bou-tit", phoneticSpelling: "/æsk əˈbaʊt ɪt/ ➔ /ˈæs.kəˈbaʊ.tɪt/" },
  { id: 'ls_15', title: "Biến âm Flap T (/t/ ➔ /d/ nhẹ)", contentEn: "Water bottle", contentVi: "Chai nước suối", targetFocus: "Biến /t/ kẹp giữa nguyên âm thành /d/ nhẹ ➔ wa-der bo-ddle", phoneticSpelling: "/ˈwɔː.tər ˈbɑː.təl/ ➔ /ˈwɔː.dər ˈbɑː.dəl/" },
  { id: 'ls_16', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Get out of here", contentVi: "Đi ra khỏi đây", targetFocus: "Nối /t/ + /aʊ/ và /t/ + /ə/ ➔ ge-tou-təv-here", phoneticSpelling: "/ɡet aʊt əv hɪr/ ➔ /ˈɡe.daʊ.dəv hɪr/" },
  { id: 'ls_17', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Not at all", contentVi: "Không có gì đâu", targetFocus: "Nối /t/ + /æ/ và /t/ + /ɔː/ ➔ no-ta-tall", phoneticSpelling: "/nɑːt æt ɔːl/ ➔ /ˌnɑː.dəˈdɔːl/" },
  { id: 'ls_18', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "An apple a day", contentVi: "Mỗi ngày một quả táo", targetFocus: "Nối /n/ + /æ/ và /l/ + /ə/ ➔ a-nap-plə-day", phoneticSpelling: "/ən ˈæp.əl ə deɪ/ ➔ /əˈnæ.pə.lə deɪ/" },
  { id: 'ls_19', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "First of all", contentVi: "Trước hết là", targetFocus: "Nối /t/ + /ə/ và /v/ + /ɔː/ ➔ firs-tə-vall", phoneticSpelling: "/fɜːrst əv ɔːl/ ➔ /ˈfɜːr.stə.vɔːl/" },
  { id: 'ls_20', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Clean it up", contentVi: "Dọn dẹp sạch sẽ đi", targetFocus: "Nối /n/ + /ɪ/ và /t/ + /ʌ/ ➔ clea-ni-tup", phoneticSpelling: "/kliːn ɪt ʌp/ ➔ /ˈkliː.nɪ.dʌp/" },
  { id: 'ls_21', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Think about it", contentVi: "Suy nghĩ về điều đó", targetFocus: "Nối /k/ + /ə/ và /t/ + /ɪ/ ➔ thin-ka-bou-tit", phoneticSpelling: "/θɪŋk əˈbaʊt ɪt/ ➔ /ˈθɪŋ.kəˈbaʊ.dɪt/" },
  { id: 'ls_22', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Take a break", contentVi: "Nghỉ giải lao một chút", targetFocus: "Nối /k/ + /ə/ ➔ ta-kə-break", phoneticSpelling: "/teɪk ə breɪk/ ➔ /ˈteɪ.kə breɪk/" },
  { id: 'ls_23', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Give it away", contentVi: "Tặng hoặc cho nó đi", targetFocus: "Nối /v/ + /ɪ/ và /t/ + /ə/ ➔ gi-vi-taway", phoneticSpelling: "/ɡɪv ɪt əˈweɪ/ ➔ /ˈɡɪ.vɪ.dəˈweɪ/" },
  { id: 'ls_24', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Leave it alone", contentVi: "Để nó yên đi", targetFocus: "Nối /v/ + /ɪ/ và /t/ + /ə/ ➔ lea-vi-talone", phoneticSpelling: "/liːv ɪt əˈloʊn/ ➔ /ˈliː.vɪ.dəˈloʊn/" },
  { id: 'ls_25', title: "Nối âm Phụ âm + Nguyên âm", contentEn: "Speak up please", contentVi: "Vui lòng nói to lên", targetFocus: "Nối /k/ + /ʌ/ ➔ spea-kup", phoneticSpelling: "/spiːk ʌp pliːz/ ➔ /ˈspiː.kʌp pliːz/" },
  { id: 'ls_26', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Too often", contentVi: "Quá thường xuyên", targetFocus: "Chèn âm đệm /w/ sau /uː/ ➔ too-woften", phoneticSpelling: "/tuː ˈɔːf.ən/ ➔ /ˌtuːˈwɔː.fən/" },
  { id: 'ls_27', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "See it through", contentVi: "Theo đuổi đến cùng", targetFocus: "Chèn âm đệm /j/ sau /iː/ ➔ see-yit", phoneticSpelling: "/siː ɪt θruː/ ➔ /ˈsiː.jɪt θruː/" },
  { id: 'ls_28', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Blue eyes", contentVi: "Đôi mắt màu xanh", targetFocus: "Chèn âm đệm /w/ sau /uː/ ➔ blue-weyes", phoneticSpelling: "/bluː aɪz/ ➔ /ˈbluː.waɪz/" },
  { id: 'ls_29', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Pay all bills", contentVi: "Thanh toán hết hóa đơn", targetFocus: "Chèn âm đệm /j/ sau /eɪ/ ➔ pay-yall", phoneticSpelling: "/peɪ ɔːl bɪlz/ ➔ /ˈpeɪ.jɔːl bɪlz/" },
  { id: 'ls_30', title: "Nối âm Nguyên âm + Nguyên âm", contentEn: "Say it again", contentVi: "Nói lại lần nữa xem", targetFocus: "Chèn âm đệm /j/ sau /eɪ/ ➔ say-yi-tagain", phoneticSpelling: "/seɪ ɪt əˈɡen/ ➔ /ˈseɪ.jɪ.dəˈɡen/" },
  { id: 'ls_31', title: "Biến âm Flap T (/t/ ➔ /d/ nhẹ)", contentEn: "Better late than never", contentVi: "Thà muộn còn hơn không", targetFocus: "Biến /t/ trong 'better' thành /d/ nhẹ ➔ be-der", phoneticSpelling: "/ˈbet.ər leɪt ðæn ˈnev.ər/ ➔ /ˈbe.dər leɪt ðən ˈne.vər/" },
  { id: 'ls_32', title: "Biến âm Flap T (/t/ ➔ /d/ nhẹ)", contentEn: "City center", contentVi: "Trung tâm thành phố", targetFocus: "Biến /t/ trong 'city' thành /d/ nhẹ ➔ ci-dy", phoneticSpelling: "/ˈsɪt.i ˈsen.tər/ ➔ /ˈsɪ.di ˈsen.tər/" },
  { id: 'ls_33', title: "Biến âm Flap T (/t/ ➔ /d/ nhẹ)", contentEn: "Computer system", contentVi: "Hệ thống máy tính", targetFocus: "Biến /t/ trong 'computer' thành /d/ nhẹ ➔ com-pyu-der", phoneticSpelling: "/kəmˈpjuː.tər ˈsɪs.təm/ ➔ /kəmˈpjuː.dər ˈsɪs.təm/" },
  { id: 'ls_34', title: "Biến âm Flap T (/t/ ➔ /d/ nhẹ)", contentEn: "A lot of water", contentVi: "Rất nhiều nước", targetFocus: "Nối Flap T liên hoàn ➔ ə-lo-dəv-wa-der", phoneticSpelling: "/ə lɑːt əv ˈwɔː.tər/ ➔ /ə ˈlɑː.dəv ˈwɔː.dər/" },
  { id: 'ls_35', title: "Nối âm Phụ âm đồng dạng", contentEn: "Black cat", contentVi: "Con mèo đen", targetFocus: "Gộp 2 âm /k/ thành 1 nhịp giữ hơi ➔ bla-cat", phoneticSpelling: "/blæk kæt/ ➔ /ˈblæ.kæt/" },
  { id: 'ls_36', title: "Nối âm Phụ âm đồng dạng", contentEn: "Big gap", contentVi: "Khoảng cách lớn", targetFocus: "Gộp 2 âm /ɡ/ thành 1 nhịp ➔ bi-gap", phoneticSpelling: "/bɪɡ ɡæp/ ➔ /ˈbɪ.ɡæp/" },
  { id: 'ls_37', title: "Nối âm Phụ âm đồng dạng", contentEn: "Bad day", contentVi: "Một ngày tồi tệ", targetFocus: "Gộp 2 âm /d/ thành 1 nhịp ➔ ba-day", phoneticSpelling: "/bæd deɪ/ ➔ /ˈbæ.deɪ/" },
  { id: 'ls_38', title: "Nối âm Phụ âm đồng dạng", contentEn: "Bus stop", contentVi: "Trạm dừng xe buýt", targetFocus: "Kéo dài âm /s/ nối liền hai từ ➔ bu-stop", phoneticSpelling: "/bʌs stɑːp/ ➔ /ˈbʌ.stɑːp/" },
  { id: 'ls_39', title: "Lược âm yếu giữa cụm phụ âm", contentEn: "Next door", contentVi: "Nhà ngay bên cạnh", targetFocus: "Lược bỏ âm /t/ giữa /s/ và /d/ ➔ nex-door", phoneticSpelling: "/nekst dɔːr/ ➔ /ˌneksˈdɔːr/" },
  { id: 'ls_40', title: "Lược âm yếu giữa cụm phụ âm", contentEn: "Last night", contentVi: "Đêm hôm qua", targetFocus: "Lược bỏ âm /t/ giữa /s/ và /n/ ➔ las-night", phoneticSpelling: "/læst naɪt/ ➔ /ˌlæsˈnaɪt/" },
  { id: 'ls_41', title: "Lược âm yếu giữa cụm phụ âm", contentEn: "Hold tight", contentVi: "Giữ thật chặt nhé", targetFocus: "Lược bỏ âm /d/ giữa /l/ và /t/ ➔ hol-tight", phoneticSpelling: "/hoʊld taɪt/ ➔ /ˌhoʊlˈtaɪt/" },
  { id: 'ls_42', title: "Đồng hóa âm /t/ + /j/ ➔ /tʃ/", contentEn: "Nice to meet you", contentVi: "Rất vui được gặp bạn", targetFocus: "Biến /t/ + /j/ thành /tʃ/ ➔ mee-choo", phoneticSpelling: "/naɪs tuː miːt juː/ ➔ /naɪs tə ˈmiː.tʃuː/" },
  { id: 'ls_43', title: "Đồng hóa âm /d/ + /j/ ➔ /dʒ/", contentEn: "Would you help me?", contentVi: "Bạn giúp tôi một tay được không?", targetFocus: "Biến /d/ + /j/ thành /dʒ/ ➔ woul-joo", phoneticSpelling: "/wʊd juː help miː/ ➔ /ˈwʊ.dʒuː help miː/" },
  { id: 'ls_44', title: "Đồng hóa âm /s/ + /j/ ➔ /ʃ/", contentEn: "Bless you", contentVi: "Chúc sức khỏe (khi ai đó hắt hơi)", targetFocus: "Biến /s/ + /j/ thành /ʃ/ ➔ bles-shoo", phoneticSpelling: "/bles juː/ ➔ /ˈble.ʃuː/" },
  { id: 'ls_45', title: "Đồng hóa âm /z/ + /j/ ➔ /ʒ/", contentEn: "How was your day?", contentVi: "Ngày hôm nay của bạn thế nào?", targetFocus: "Biến /z/ + /j/ thành /ʒ/ ➔ wa-zhoor", phoneticSpelling: "/haʊ wəz jɔːr deɪ/ ➔ /haʊ wəˈʒɔːr deɪ/" },
  { id: 'ls_46', title: "Nối âm Cụm câu giao tiếp", contentEn: "What are you doing?", contentVi: "Bạn đang làm gì thế?", targetFocus: "Lướt nhanh cụm 'what are you' ➔ wha-dər-jə", phoneticSpelling: "/wʌt ɑːr juː ˈduː.ɪŋ/ ➔ /ˈwʌ.dər.jə ˈduː.ɪŋ/" },
  { id: 'ls_47', title: "Nối âm Cụm câu giao tiếp", contentEn: "Don't you know that?", contentVi: "Bạn không biết điều đó sao?", targetFocus: "Đồng hóa /t/ + /j/ ➔ don-choo-know", phoneticSpelling: "/doʊnt juː noʊ ðæt/ ➔ /ˈdoʊn.tʃuː noʊ ðæt/" },
  { id: 'ls_48', title: "Nối âm Cụm câu giao tiếp", contentEn: "Can I have a cup of tea?", contentVi: "Cho tôi gọi một tách trà nhé?", targetFocus: "Nối liên hoàn 4 điểm ➔ cə-naɪ hæ-və cʌ-pəv tea", phoneticSpelling: "/kæn aɪ hæv ə kʌp əv tiː/ ➔ /kə.naɪ ˈhæ.və ˈkʌ.pəv tiː/" },
  { id: 'ls_49', title: "Nối âm Cụm câu giao tiếp", contentEn: "Put it on the table", contentVi: "Đặt nó lên trên bàn", targetFocus: "Nối Flap T liên tiếp ➔ pu-di-dɑːn", phoneticSpelling: "/pʊt ɪt ɑːn ðə ˈteɪ.bəl/ ➔ /ˈpʊ.dɪ.dɑːn ðə ˈteɪ.bəl/" },
  { id: 'ls_50', title: "Nối âm Cụm câu giao tiếp", contentEn: "What time is it?", contentVi: "Bây giờ là mấy giờ rồi?", targetFocus: "Gộp /t/ + /t/ và nối /m/ + /ɪ/ + /z/ ➔ wha-ti-mi-zit", phoneticSpelling: "/wʌt taɪm ɪz ɪt/ ➔ /ˈwʌ.taɪ.mɪ.zɪt/" }
];