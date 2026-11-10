// src/screens/Station2Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import * as AntiCheatModule from '../components/AntiCheatSpeakingSession';
import * as DetailedModalModule from '../components/DetailedSpeechFeedbackModal';
import { evaluateSpeechSubmission } from '../utils/speechEvaluator';
import { evaluateSpeaking } from '../services/arena/assessmentService';
import { supabase } from '../utils/supabase';

// 🛡️ TỰ ĐỘNG BÓC TÁCH COMPONENT CHUẨN XÁC CHỐNG LỖI REACT #130
const AntiCheatSpeakingSession: React.ComponentType<any> = 
  (AntiCheatModule as any).default || 
  (AntiCheatModule as any).AntiCheatSpeakingSession || 
  (() => null);

const DetailedSpeechFeedbackModal: React.ComponentType<any> = 
  (DetailedModalModule as any).default || 
  (DetailedModalModule as any).DetailedSpeechFeedbackModal || 
  (() => null);

export type DetailedFeedbackData = any;

interface Props {
  onBack: () => void;
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Station2Tier = 'SOLO' | 'RELAY' | 'ROLEPLAY';
export type PracticeMode = 'READ_SAMPLE' | 'FREE_SPEECH';
export type TopicOrigin = 'SYSTEM' | 'TEACHER_DASHBOARD' | 'STUDENT_CUSTOM';
export type SupportedLang = 'vi' | 'th' | 'ja' | 'ko' | 'id' | 'zh';

export interface MultilingualHint {
  vi: string; // Tiếng Việt
  th: string; // ภาษาไทย
  ja: string; // 日本語
  ko: string; // 한국어
  id: string; // Bahasa Indonesia
  zh: string; // 中文 (Chinese)
}

export interface ChallengeItem {
  id: string;
  tier: Station2Tier;
  level: CefrLevel;
  title: string;
  place: string;
  task: string;
  contextDesc: string;
  prompt: string;
  hint: MultilingualHint;
  isTeacherAssigned?: boolean;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LANG_CONFIG: Record<SupportedLang, { flag: string; label: string; code: string }> = {
  vi: { flag: '🇻🇳', label: 'Tiếng Việt', code: 'VN' },
  th: { flag: '🇹🇭', label: 'ภาษาไทย', code: 'TH' },
  ja: { flag: '🇯🇵', label: '日本語', code: 'JP' },
  ko: { flag: '🇰🇷', label: '한국어', code: 'KR' },
  id: { flag: '🇮🇩', label: 'Bahasa Indonesia', code: 'ID' },
  zh: { flag: '🇨🇳', label: '中文', code: 'CN' }
};

const TIERS: { key: Station2Tier; label: string; icon: string; desc: string }[] = [
  { key: 'SOLO', label: 'TIER 1: SOLO (INDIVIDUAL REFLEX)', icon: '🥊', desc: 'Spontaneous reflex: Handle unexpected real-world inquiries or challenges independently.' },
  { key: 'RELAY', label: 'TIER 2: RELAY (TEAM EXPANSION)', icon: '🏃', desc: 'Two-speaker relay: Seamlessly extend ideas and elaborate logically on the ongoing topic.' },
  { key: 'ROLEPLAY', label: 'TIER 3: ROLEPLAY (DYNAMIC DUO)', icon: '🎭', desc: 'Interactive roleplay: Resolve interpersonal conflicts and negotiate practical scenarios.' }
];

// 🎯 KHO KỊCH BẢN CHUẨN 100% ENGLISH-FIRST + ĐỦ 6 THỨ TIẾNG CHÂU Á
const SCENARIO_LIBRARY: Record<string, Omit<ChallengeItem, 'id' | 'tier' | 'level' | 'isTeacherAssigned'>[]> = {
  'SOLO_A1': [
    {
      title: "Asking for Metro Directions",
      place: "City Street",
      task: "Give walking directions to the nearest subway",
      contextDesc: "A foreign traveler asks you for walking directions to the nearest subway station.",
      prompt: "Go straight ahead for two blocks, then turn left; the station is right next to the bank.",
      hint: {
        vi: "Chỉ đường đi bộ: đi thẳng 2 dãy nhà rồi rẽ trái, ga tàu nằm ngay cạnh ngân hàng.",
        th: "บอกทางเดิน: ตรงไปสองบล็อกแล้วเลี้ยวซ้าย สถานีอยู่ติดกับธนาคาร",
        ja: "道案内：2ブロック直進して左折します。駅は銀行のすぐ隣にあります。",
        ko: "길 안내: 두 블록 직진 후 좌회전하세요. 역은 은행 바로 옆에 있습니다.",
        id: "Memberi petunjuk jalan: lurus dua blok, lalu belok kiri; stasiun ada di sebelah bank.",
        zh: "指路提示：直行两个街区然后左转，地铁站就在银行隔壁。"
      }
    },
    {
      title: "Ordering Takeout Lunch",
      place: "Fast Food Counter",
      task: "Order a chicken rice meal and water",
      contextDesc: "You are at a fast-food counter. Order one chicken rice combo to take away and a bottle of water.",
      prompt: "Hello, can I please have one chicken rice set to take away and a bottle of mineral water?",
      hint: {
        vi: "Gọi đồ ăn mang về: 1 phần cơm gà mang đi và 1 chai nước suối.",
        th: "สั่งอาหารกลับบ้าน: สั่งชุดข้าวไก่ 1 ชุดและน้ำดื่ม 1 ขวด",
        ja: "テイクアウト注文：チキンライスセット1つとミネラルウォーター1本を持ち帰りで注文します。",
        ko: "포장 주문: 치킨 라이스 세트 하나와 생수 한 병을 포장 주문하세요.",
        id: "Pesan bawa pulang: pesan 1 paket nasi ayam bungkus dan 1 botol air mineral.",
        zh: "打包点餐：请给我一份外带的鸡肉饭套餐和一瓶矿泉水。"
      }
    },
    {
      title: "Asking for the Current Time",
      place: "Bus Stop",
      task: "Politely ask a stranger for the time",
      contextDesc: "Your phone battery has died completely. Ask someone standing nearby for the time.",
      prompt: "Excuse me, my phone battery is completely dead. Do you happen to have the time?",
      hint: {
        vi: "Hỏi giờ lịch sự: máy hết pin, hỏi người bên cạnh xem mấy giờ rồi.",
        th: "ถามเวลาอย่างสุภาพ: แบตโทรศัพท์หมด ถามคนข้างๆ ว่าเวลากี่โมงแล้ว",
        ja: "時間を尋ねる：スマホの充電が切れたので、近くの人に時間を丁寧に尋ねます。",
        ko: "시간 묻기: 휴대전화 배터리가 다 닳았으니 근처 사람에게 정중히 시간을 물어보세요.",
        id: "Menanyakan waktu: baterai ponsel habis, tanyakan jam berapa kepada orang di dekat Anda.",
        zh: "礼貌问时间：手机完全没电了，礼貌询问身边的人现在几点了。"
      }
    }
  ],
  'SOLO_A2': [
    {
      title: "Declining a Weekend Party",
      place: "Office Hallway",
      task: "Politely refuse an invitation due to family visit",
      contextDesc: "A colleague invites you for beers on Saturday, but you already promised to visit your grandparents.",
      prompt: "I would really love to join, but I have already promised to visit my grandparents this weekend.",
      hint: {
        vi: "Từ chối lịch sự: rất muốn đi nhưng đã hứa về quê thăm ông bà cuối tuần này.",
        th: "ปฏิเสธคำชวนอย่างสุภาพ: อยากไปมากแต่สัญญาว่าจะไปหาปู่ย่าตายายสุดสัปดาห์นี้แล้ว",
        ja: "丁寧にお誘いを断る：行きたいのは山々ですが、今週末は祖父母を訪ねる約束があります。",
        ko: "정중히 거절하기: 정말 가고 싶지만 이번 주말에 조부모님을 뵙기로 약속했습니다.",
        id: "Menolak ajakan: sangat ingin ikut, tapi sudah berjanji mengunjungi kakek-nenek akhir pekan ini.",
        zh: "礼貌拒绝邀请：非常想去，但本周末已经答应回老家看望祖父母了。"
      }
    },
    {
      title: "Reporting Cold Food",
      place: "Casual Restaurant",
      task: "Politely ask the server to reheat your noodles",
      contextDesc: "Your stir-fried noodles just arrived stone-cold. Politely request the server to have the kitchen reheat them.",
      prompt: "Excuse me, my noodles are quite cold. Could you please ask the kitchen to heat them up for me?",
      hint: {
        vi: "Phản ánh đồ ăn nguội: xin phép nhân viên nhờ bếp hâm nóng lại đĩa mì.",
        th: "แจ้งอาหารเย็นชืด: ขอความกรุณาพนักงานช่วยนำบะหมี่ไปอุ่นให้ร้อนอีกครั้ง",
        ja: "料理の温め直し：麺が冷たいので、キッチンで温め直してもらうよう店員に丁寧に頼みます。",
        ko: "음식 데우기 요청: 면이 너무 식었으니 주방에 다시 데워달라고 정중히 요청하세요.",
        id: "Komplain makanan dingin: minta pelayan dengan sopan agar dapur memanaskan kembali mi Anda.",
        zh: "反馈菜品过凉：炒面端上来完全是凉的，请服务员帮忙拿回厨房重新加热。"
      }
    }
  ],
  'SOLO_B1': [
    {
      title: "Defending Project Setup Costs",
      place: "Conference Room",
      task: "Justify high upfront costs by proving long-term savings",
      contextDesc: "During your presentation, an audience member challenges whether the proposed system is too costly.",
      prompt: "While initial setup requires significant investment, operational savings over six months will completely offset the costs.",
      hint: {
        vi: "Biện hộ chi phí: chi phí ban đầu cao nhưng tiết kiệm vận hành sau 6 tháng sẽ bù đắp hoàn toàn.",
        th: "ชี้แจงงบประมาณ: แม้ต้นทุนเริ่มต้นจะสูง แต่การประหยัดค่าดำเนินการใน 6 เดือนจะคุ้มทุนอย่างแน่นอน",
        ja: "初期費用の正当化：初期投資は必要ですが、6か月間の運用削減により全額回収できます。",
        ko: "프로젝트 비용 정당화: 초기 투자가 필요하지만 6개월간의 운영 절감으로 충분히 상쇄됩니다.",
        id: "Mempertahankan biaya proyek: biaya awal memang tinggi, tapi penghematan 6 bulan akan menutupinya.",
        zh: "论证初期成本：虽然前期投入较大，但6个月内节省的运营开支将完全抵消这笔成本。"
      }
    },
    {
      title: "Negotiating Task Redistribution",
      place: "Team Workspace",
      task: "Propose rebalancing the research workload equally",
      contextDesc: "You notice workload distribution is skewed. Propose to the team lead that tasks be shared fairly.",
      prompt: "I propose we redistribute the technical research workload so that every team member contributes equally.",
      hint: {
        vi: "Đề xuất chia lại việc: phân bổ lại phần việc nghiên cứu kỹ thuật để mọi người đóng góp công bằng.",
        th: "เจรจาแบ่งงาน: เสนอให้จัดสรรงานวิจัยทางเทคนิคใหม่เพื่อให้สมาชิกทุกคนมีส่วนร่วมเท่าๆ กัน",
        ja: "業務分担の再調整：全員が公平に貢献できるよう、技術調査のタスクを再配分することを提案します。",
        ko: "업무 재분배 제안: 모든 팀원이 동등하게 기여할 수 있도록 기술 연구 업무를 재분배하자고 제안하세요.",
        id: "Negosiasi pembagian tugas: usulkan pembagian ulang beban riset teknis agar kontribusi seimbang.",
        zh: "提议重新分工：建议重新分配技术调研工作量，让每位组员都能公平分担。"
      }
    }
  ],
  'SOLO_B2': [
    {
      title: "Resisting Unrealistic Deadlines",
      place: "Client Sync Meeting",
      task: "Explain why rushing delivery creates critical security risks",
      contextDesc: "The client demands delivery one week early. Explain how this severely threatens security audit integrity.",
      prompt: "Accelerating deployment by a full week severely constrains our security audit cycle, risking critical vulnerabilities.",
      hint: {
        vi: "Từ chối ép tiến độ: giao sớm 1 tuần sẽ thu hẹp thời gian kiểm tra bảo mật, gây nguy cơ lỗ hổng nghiêm trọng.",
        th: "ปฏิเสธกำหนดการเร่งด่วน: การเร่งส่งมอบงานเร็วขึ้นหนึ่งสัปดาห์จะทำให้การตรวจสอบความปลอดภัยมีช่องโหว่",
        ja: "納期短縮への反論：リリースを1週間前倒しするとセキュリティ監査が不十分になり、脆弱性のリスクが高まります。",
        ko: "일정 단축 거절: 일주일 일찍 배포하면 보안 감사 일정이 촉박해져 심각한 취약점이 발생할 수 있습니다.",
        id: "Menolak percepatan tenggat: memajukan rilis seminggu membatasi audit keamanan dan memicu celah bahaya.",
        zh: "婉拒赶工期：提前一周上线会严重压缩安全审计周期，恐留下重大漏洞隐患。"
      }
    }
  ],
  'SOLO_C1': [
    {
      title: "Corporate Data Breach Response",
      place: "Press Briefing",
      task: "Deliver calm, authoritative statement on incident containment",
      contextDesc: "As corporate spokesperson, address rumors of a database breach during a live press briefing.",
      prompt: "Our incident response teams have isolated the perimeter, engaged third-party forensic auditors, and will provide transparent hourly updates.",
      hint: {
        vi: "Phát ngôn khủng hoảng: đội ứng phó đã cách ly phạm vi, mời kiểm toán độc lập và sẽ cập nhật minh bạch mỗi giờ.",
        th: "แถลงการณ์รับมือวิกฤต: ทีมงานได้แยกขอบเขตความเสียหาย ว่าจ้างผู้ตรวจสอบภายนอก และจะอัปเดตอย่างโปร่งใสทุกชั่วโมง",
        ja: "緊急記者会見：インシデント対応チームが感染範囲を隔離し、第三者監査機関を介入させ、毎時最新情報を公開します。",
        ko: "데이터 유출 위기 대응: 사고 대응팀이 침해 구역을 격리하고 외부 전문 감사관을 투입해 매시간 투명하게 공지하겠습니다.",
        id: "Pernyataan krisis: tim insiden telah mengisolasi area, melibatkan auditor forensik, dan memberi update transparan.",
        zh: "危机公关发声：应急响应团队已隔离泄露范围，引入第三方取证机构，并将按小时公开进展。"
      }
    }
  ],
  'SOLO_C2': [
    {
      title: "Algorithmic Adjudication Ethics",
      place: "Academic Colloquium",
      task: "Critique AI judgment replacing human judges in judicial rulings",
      contextDesc: "Deliver an extemporaneous critique on algorithms replacing judges in commercial court rulings.",
      prompt: "Algorithmic adjudication merely optimizes for historical empirical precedents, thereby formalizing systemic biases under the guise of neutrality.",
      hint: {
        vi: "Tranh biện đạo đức AI: phán quyết bằng thuật toán chỉ tối ưu theo tiền lệ quá khứ, chính thức hóa định kiến hệ thống.",
        th: "การตัดสินด้วย AI: การตัดสินคดีด้วยอัลกอริทึมเพียงแค่อิงตามบรรทัดฐานในอดีต ซึ่งเป็นการตอกย้ำอคติในระบบภายใต้คำว่ายุติธรรม",
        ja: "AI司法の批判的検討：アルゴリズムによる判決は過去の判例を最適化するに過ぎず、中立の名の下に構造的偏見を固定化します。",
        ko: "AI 판결 윤리 논쟁: 알고리즘 판결은 과거 선례를 최적화할 뿐이며 중립이라는 미명 하에 구조적 편향을 공식화합니다.",
        id: "Debat etika AI peradilan: putusan algoritmik hanya mengoptimalkan preseden masa lalu, melegalkan bias sistemik.",
        zh: "AI司法批判：算法裁决本质上仅优化历史既定判例，反而在客观中立的伪装下固化了系统性偏见。"
      }
    }
  ],
  'RELAY_A1': [
    {
      title: "Relay: Farewell Party Planning",
      place: "Campus Lounge",
      task: "Follow up partner's idea with lanterns and speakers",
      contextDesc: "Partner A: 'We should buy pizza and drinks.' -> Partner B: Propose decoration and background music.",
      prompt: "Great idea! I can bring some speakers and paper lanterns to decorate the patio.",
      hint: {
        vi: "Tiếp sức tiệc chia tay: Bạn A đề xuất pizza & đồ uống -> Bạn B nối ý mang loa và lồng đèn trang trí.",
        th: "ต่อยอดไอเดียงานเลี้ยง: เพื่อน A เสนอพิซซ่าและเครื่องดื่ม -> เพื่อน B สานต่อเรื่องลำโพงและโคมไฟตกแต่ง",
        ja: "リレー会話：Aがピザと飲み物を提案 -> Bがテラスの飾り付け用スピーカーと提灯を持ってくると続けます。",
        ko: "릴레이 대화: 친구 A가 피자와 음료 제안 -> 친구 B가 스피커와 종이등 장식을 가져오겠다고 이어가세요.",
        id: "Estafet pesta perpisahan: Rekan A usul piza & minuman -> Rekan B sambung dengan membawa speaker dan lentera.",
        zh: "接力派对策划：同学A提议买披萨和饮料 -> 同学B接着补充音响和庭院纸灯笼装饰。"
      }
    }
  ],
  'RELAY_B1': [
    {
      title: "Relay: Campus Plastic Reduction",
      place: "Student Council",
      task: "Build upon reusable policy with personal tumbler discounts",
      contextDesc: "Partner A: 'The cafeteria must stop disposable cups.' -> Partner B: Propose 10% tumbler discount.",
      prompt: "To make that policy effective, the administration should offer a ten percent discount for anyone bringing reusable tumblers.",
      hint: {
        vi: "Tiếp sức giảm rác thải: Bạn A muốn cấm ly dùng 1 lần -> Bạn B bổ sung đề xuất giảm 10% khi mang bình cá nhân.",
        th: "ลดขยะพลาสติก: เพื่อน A เสนอเลิกใช้แก้วพลาสติก -> เพื่อน B ต่อยอดด้วยการลดราคา 10% เมื่อนำแก้วส่วนตัวมา",
        ja: "プラスチック削減：Aが使い捨てカップ廃止を提案 -> Bがマイボトル持参者に10%割引を設ける案を補足します。",
        ko: "플라스틱 줄이기 릴레이: A가 일회용 컵 중단 제안 -> B가 텀블러 지참 시 10% 할인 정책을 연계 제안하세요.",
        id: "Estafet kurangi plastik: A usul stop cangkir sekali pakai -> B sambung dengan diskon 10% untuk tumbler pribadi.",
        zh: "环保减塑接力：同学A建议停用一次性杯子 -> 同学B跟进提出自带保温杯立享九折优惠。"
      }
    }
  ],
  'RELAY_B2': [
    {
      title: "Relay: Urban EV Infrastructure",
      place: "Urban Planning Forum",
      task: "Highlight battery-swapping network alongside subsidies",
      contextDesc: "Partner A: 'Subsidizing electric motorbikes curbs emissions.' -> Partner B: Emphasize battery-swapping stations.",
      prompt: "Crucially, municipal planners must simultaneously expand standardized battery-swapping stations across major transit corridors.",
      hint: {
        vi: "Tiếp sức xe điện đô thị: Bạn A nói về trợ giá xe -> Bạn B nối tiếp yêu cầu mở rộng trạm đổi pin chuẩn hóa.",
        th: "โครงสร้างพื้นฐาน EV: เพื่อน A พูดถึงการอุดหนุนมอเตอร์ไซค์ไฟฟ้า -> เพื่อน B เน้นย้ำสถานีสลับแบตเตอรี่ตามแนวรถไฟฟ้า",
        ja: "EV普及リレー：Aが電動バイク補助金を提案 -> Bが主要幹線道路沿いへの規格化されたバッテリー交換ステーション整備を補足します。",
        ko: "친환경 전기차 인프라: A가 전기 오토바이 보조금 주장 -> B가 주요 환승 통로에 표준 배터리 교환소 확충을 덧붙이세요.",
        id: "Estafet motor listrik: A usulkan subsidi -> B tekankan perluasan stasiun penukaran baterai terstandarisasi.",
        zh: "城市电动化接力：嘉宾A主张补贴电摩 -> 嘉宾B紧接着呼吁在主要交通走廊同步布局标准化换电站。"
      }
    }
  ],
  'ROLEPLAY_A1': [
    {
      title: "Roleplay: Counter Order & QR Pay",
      place: "Fast Food Counter",
      task: "Order fried chicken combo and ask to pay by QR",
      contextDesc: "You are the customer ordering a fried chicken combo and confirming mobile QR payment.",
      prompt: "Hello, can I please order a fried chicken combo and pay using a mobile QR transfer?",
      hint: {
        vi: "Nhập vai gọi món: xin gọi combo gà rán và hỏi có thanh toán chuyển khoản mã QR được không.",
        th: "สวมบทบาทสั่งอาหาร: สั่งชุดไก่ทอดและสอบถามว่าสามารถสแกนจ่ายด้วย QR Code ได้หรือไม่",
        ja: "ロールプレイ（注文）：フライドチキンコンボを注文し、モバイルQR決済ができるか尋ねます。",
        ko: "역할극 주문: 치킨 콤보를 주문하고 모바일 QR 코드로 결제 가능한지 물어보세요.",
        id: "Roleplay pesan makanan: pesan paket ayam goreng dan tanyakan apakah bisa bayar pakai QR.",
        zh: "角色扮演点餐：请给我一份炸鸡套餐，并询问能否使用手机扫码支付。"
      }
    }
  ],
  'ROLEPLAY_A2': [
    {
      title: "Roleplay: Clothing Size Exchange",
      place: "Boutique Counter",
      task: "Request an exchange for Large with your receipt",
      contextDesc: "The shirt you bought yesterday feels tight around the shoulders. Present receipt and ask to exchange for size L.",
      prompt: "Good morning, I bought this shirt yesterday but it feels tight around my shoulders. Can I exchange it for a large?",
      hint: {
        vi: "Nhập vai đổi size áo: áo mua hôm qua bị chật vai, mang hóa đơn xin đổi sang size L.",
        th: "เปลี่ยนขนาดเสื้อ: เสื้อที่ซื้อเมื่อวานแน่นช่วงไหล่ นำใบเสร็จมาขอเปลี่ยนเป็นไซส์ L",
        ja: "サイズ交換：昨日買ったシャツの肩周りが窮屈なため、レシートを提示してLサイズへの交換を依頼します。",
        ko: "사이즈 교환: 어제 산 셔츠 어깨가 꽉 끼니 영수증을 보여주고 L 사이즈로 교환을 요청하세요.",
        id: "Tukar ukuran baju: kemeja kemarin kesempitan di bahu, tunjukkan struk untuk tukar ke ukuran L.",
        zh: "角色扮演调换尺码：昨天买的衬衫肩膀偏紧，出示小票礼貌申请更换为L码。"
      }
    }
  ],
  'ROLEPLAY_B1': [
    {
      title: "Roleplay: Urgent Beverage Swap",
      place: "Airport Gate Café",
      task: "Get wrong hot coffee replaced quickly before boarding",
      contextDesc: "You ordered iced peach tea but received hot cappuccino. Your flight boards in 10 minutes; request an instant swap.",
      prompt: "Excuse me, I ordered an iced peach tea, but I received hot cappuccino. Could you replace it quickly as my flight boards soon?",
      hint: {
        vi: "Đổi đồ uống khẩn cấp: gọi trà đào đá nhưng nhận nhầm cappuccino nóng, máy bay sắp bay trong 10 phút.",
        th: "เปลี่ยนเครื่องดื่มด่วน: สั่งชาพีชเย็นแต่ได้คาปูชิโน่ร้อน เครื่องบินจะขึ้นใน 10 นาที ขอให้เปลี่ยนให้อย่างรวดเร็ว",
        ja: "急ぎのドリンク交換：アイスピーチティーを頼んだのにカプチーノが届いた。搭乗まで10分なので至急交換を求めます。",
        ko: "음료 긴급 교환: 아이스 피치티를 주문했는데 따뜻한 카푸치노가 나왔고 10분 뒤 탑승이니 즉시 교환을 요청하세요.",
        id: "Tukar minuman darurat: pesan es teh persik dapat cappuccino panas, pesawat boarding 10 menit lagi.",
        zh: "紧急换饮品：点了冰桃茶却拿到热卡布奇诺，飞机还有10分钟登机，急求立刻调换。"
      }
    }
  ],
  'ROLEPLAY_B2': [
    {
      title: "Roleplay: Project Module Delay",
      place: "Client Conference",
      task: "Acknowledge 3-day report delay and offer core export feature",
      contextDesc: "The client is upset that the reporting module is delayed by 3 days. Negotiate by deploying core data export immediately.",
      prompt: "We acknowledge the module delay; to keep your team operating, we can deploy the core data export feature this afternoon.",
      hint: {
        vi: "Thương lượng tiến độ: thừa nhận trễ tính năng báo cáo 3 ngày, bù lại đề xuất bàn giao phần xuất dữ liệu cốt lõi ngay chiều nay.",
        th: "เจรจาความล่าช้า: ยอมรับว่าโมดูลรายงานล่าช้า 3 วัน เพื่อไม่ให้งานสะดุด เสนอติดตั้งฟังก์ชันส่งออกข้อมูลหลักให้ช่วงบ่ายนี้",
        ja: "進捗遅延の交渉：レポート機能の3日遅延を認め、業務を止めないよう本日の午後に主要データ出力機能を先行納品すると提案します。",
        ko: "프로젝트 지연 협상: 보고서 모듈의 3일 지연을 인정하고, 팀 업무를 위해 핵심 데이터 내보내기 기능을 오늘 오후 즉시 배포하겠다고 제안하세요.",
        id: "Negosiasi modul tertunda: akui modul telat 3 hari, tawarkan rilis fitur ekspor data utama sore ini.",
        zh: "延期协商：承认报表模块耽误了3天，为保障业务运转，承诺今天下午率先部署核心数据导出功能。"
      }
    }
  ],
  'ROLEPLAY_C1': [
    {
      title: "Roleplay: VIP Presidential Suite AC Failure",
      place: "5-Star Hotel Lobby",
      task: "Resolve presidential AC breakdown with penthouse upgrade",
      contextDesc: "As General Manager, resolve a midnight AC failure in the Presidential Suite right before an international summit.",
      prompt: "I sincerely apologize for this disruption. I will personally arrange an immediate transfer to our Presidential Penthouse with all services comped.",
      hint: {
        vi: "Khủng hoảng khách VIP: quản lý đích thân xin lỗi sự cố điều hòa và nâng hạng miễn phí lên Penthouse Tổng thống.",
        th: "รับมือแขก VIP: ผู้จัดการขออภัยเหตุแอร์เสีย และย้ายห้องพักไปยังเพนต์เฮาส์สุดหรูพร้อมบริการฟรีทั้งหมด",
        ja: "VIPクレーム対応：総支配人としてエアコン故障を陳謝し、最上階ペントハウスへの即時移動と全額無償対応を提示します。",
        ko: "VIP 객실 에어컨 고장 대응: 총지배인으로서 심야 에어컨 고장에 사과하고 최고급 펜트하우스로 무료 업그레이드 조치하세요.",
        id: "Penanganan komplain VIP: sebagai GM minta maaf atas AC rusak dan gratiskan upgrade ke Presidential Penthouse.",
        zh: "贵宾投诉处理：作为总经理就深夜总统套房空调故障致歉，并亲自安排即刻升级至顶层阁楼套房且全程免单。"
      }
    }
  ]
};

const CONTEXT_VARIANTS = [
  "Time-sensitive: respond within 3 minutes",
  "The interlocutor appears dissatisfied and impatient",
  "High-stakes virtual board meeting context",
  "Global enterprise headquarters context",
  "Requires crisp, confident delivery without filler sounds",
  "Partner expects an immediate written commitment",
  "End-of-day exhaustion context; keep it succinct",
  "Monitored directly by executive evaluators"
];

const createProceduralScenario = (tier: Station2Tier, level: CefrLevel, index: number): ChallengeItem => {
  const key = `${tier}_${level}`;
  const list = SCENARIO_LIBRARY[key] || SCENARIO_LIBRARY['SOLO_B1'];
  const base = list[index % list.length];
  const variant = CONTEXT_VARIANTS[index % CONTEXT_VARIANTS.length];
  const caseNum = Math.floor(index / list.length) + 1;

  return {
    id: `dynamic_${tier}_${level}_${index}_${Date.now()}`,
    tier,
    level,
    title: caseNum > 1 ? `${base.title} (Case #${caseNum})` : base.title,
    place: base.place,
    task: base.task,
    contextDesc: `${base.contextDesc} [Notice: ${variant}].`,
    prompt: base.prompt,
    hint: base.hint,
    isTeacherAssigned: false
  };
};

const getSupportedAudioMimeType = (): { mimeType: string; extension: string } => {
  if (typeof window === 'undefined' || !(window as any).MediaRecorder) {
    return { mimeType: '', extension: 'webm' };
  }
  const MediaRecorderClass = (window as any).MediaRecorder;
  if (typeof MediaRecorderClass.isTypeSupported === 'function') {
    if (MediaRecorderClass.isTypeSupported('audio/webm;codecs=opus')) return { mimeType: 'audio/webm;codecs=opus', extension: 'webm' };
    if (MediaRecorderClass.isTypeSupported('audio/webm')) return { mimeType: 'audio/webm', extension: 'webm' };
    if (MediaRecorderClass.isTypeSupported('audio/mp4')) return { mimeType: 'audio/mp4', extension: 'mp4' };
    if (MediaRecorderClass.isTypeSupported('audio/aac')) return { mimeType: 'audio/aac', extension: 'aac' };
  }
  return { mimeType: '', extension: 'webm' };
};

export default function Station2Screen({ onBack }: Props) {
  const [selectedTier, setSelectedTier] = useState<Station2Tier>('ROLEPLAY');
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('B1');
  const [teacherAssignments, setTeacherAssignments] = useState<ChallengeItem[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(true);

  // 🌐 CƠ CHẾ GỢI Ý ĐA NGÔN NGỮ CHÂU Á (MẶC ĐỊNH MỞ ĐỂ THẤY NGAY)
  const [selectedLang, setSelectedLang] = useState<SupportedLang>('vi');
  const [showHint, setShowHint] = useState<boolean>(true);

  // 🎯 QUẢN LÝ ĐỀ BÀI VÀ HÀNG ĐỢI NẠP BÙ AI NGẦM
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeItem>(() => {
    return createProceduralScenario('ROLEPLAY', 'B1', 0);
  });
  const [topicIndex, setTopicIndex] = useState<number>(0);
  const [aiQueue, setAiQueue] = useState<ChallengeItem[]>([]);
  const isFetchingAiRef = useRef<boolean>(false);

  // QUẢN LÝ TTS (EDGE NEURAL SERVERLESS STREAM)
  const [isPlayingSample, setIsPlayingSample] = useState<boolean>(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      stopSampleAudio();
    };
  }, []);

  const getBestNaturalVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google US English') || v.name.includes('Siri') || v.name.includes('Natural') || v.name.includes('Samantha')));
    return voice || voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || null;
  };

  const stopSampleAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingSample(false);
  };

  const playNaturalTTS = async (text: string) => {
    if (isPlayingSample) {
      stopSampleAudio();
      return;
    }

    const cleanText = text.replace(/["']/g, '').trim();
    if (!cleanText) return;

    setIsPlayingSample(true);

    try {
      const ttsUrl = `/api/tts?voice=nova&text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(ttsUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setIsPlayingSample(false);
        audioPlayerRef.current = null;
      };

      audio.onerror = () => {
        console.warn("Edge-TTS unavailable, falling back to client synthesis...");
        playLocalSampleFallback(cleanText);
      };

      await audio.play();
      return;
    } catch (e) {
      console.warn("TTS Error:", e);
      playLocalSampleFallback(cleanText);
    }
  };

  const playLocalSampleFallback = (cleanText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingSample(false);
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const bestVoice = getBestNaturalVoice();
    if (bestVoice) utterance.voice = bestVoice;
    utterance.lang = 'en-US';
    utterance.rate = 0.90;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingSample(true);
    utterance.onend = () => setIsPlayingSample(false);
    utterance.onerror = () => setIsPlayingSample(false);

    synth.speak(utterance);
  };

  const [topicOrigin, setTopicOrigin] = useState<TopicOrigin>('SYSTEM');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('READ_SAMPLE');

  const [customTitle, setCustomTitle] = useState<string>('');
  const [customContext, setCustomContext] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [isNormalPracticing, setIsNormalPracticing] = useState<boolean>(false);
  const [isRecordingNormal, setIsRecordingNormal] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluatingStatus, setEvaluatingStatus] = useState<string>('⚡ ANALYZING ACOUSTICS & SCORING SUBMISSION...');
  const [normalTimer, setNormalTimer] = useState<number>(0);
  const normalMediaRecorderRef = useRef<any>(null);
  const normalAudioChunksRef = useRef<any[]>([]);
  const normalPitchHistoryRef = useRef<number[]>([]);
  const normalAnimFrameRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeMimeTypeRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' });

  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const liveTranscriptRef = useRef<string>('');
  const speechRecognitionRef = useRef<any>(null);

  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isTeacherExamining, setIsTeacherExamining] = useState<boolean>(false);
  const [detailedModalVisible, setDetailedModalVisible] = useState<boolean>(false);
  const [feedbackResult, setFeedbackResult] = useState<DetailedFeedbackData | null>(null);

  const fetchTeacherAssignments = async () => {
    setLoadingAssignments(true);
    try {
      if (supabase) {
        const { data: assignments, error } = await supabase
          .from('assignments')
          .select('*')
          .ilike('station_type', '%STATION_2%')
          .order('created_at', { ascending: false });

        if (!error && assignments && assignments.length > 0) {
          const teacherItems: ChallengeItem[] = assignments.map((item: any) => {
            let detectedTier: Station2Tier = 'ROLEPLAY';
            const titleUpper = (item.title || '').toUpperCase();
            if (titleUpper.includes('SOLO')) detectedTier = 'SOLO';
            else if (titleUpper.includes('RELAY')) detectedTier = 'RELAY';

            return {
              id: `teacher_${item.id}`,
              tier: detectedTier,
              level: (item.cefr_level || 'B2').toUpperCase() as CefrLevel,
              title: item.title || 'Instructor Assigned Task',
              place: 'Classroom / Lab',
              task: 'Complete designated speaking challenge',
              contextDesc: item.description || `🏫 Assigned Reflex Context (${detectedTier}):`,
              prompt: item.target_prompt || '',
              hint: {
                vi: item.description || "Bài tập do giảng viên giao trực tiếp.",
                th: item.description || "งานที่ได้รับมอบหมายจากอาจารย์",
                ja: item.description || "講師から直接割り当てられた課題です。",
                ko: item.description || "담당 교수가 직접 부여한 과제입니다.",
                id: item.description || "Tugas yang diberikan langsung oleh pengajar.",
                zh: item.description || "教师布置的专属口语挑战。"
              },
              isTeacherAssigned: true
            };
          });

          setTeacherAssignments(teacherItems);
        }
      }
    } catch (err) {
      console.warn("Error fetching assignments:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchTeacherAssignments();
    return () => stopSampleAudio();
  }, []);

  useEffect(() => {
    if (topicOrigin === 'TEACHER_DASHBOARD') {
      const filtered = teacherAssignments.filter(t => t.tier === selectedTier && t.level === selectedLevel);
      if (filtered.length > 0) {
        setCurrentChallenge(filtered[0]);
        return;
      }
    }
    const fresh = createProceduralScenario(selectedTier, selectedLevel, 0);
    setCurrentChallenge(fresh);
    setTopicIndex(0);
    setAiQueue([]);
  }, [selectedTier, selectedLevel, topicOrigin]);

  const triggerBackgroundAiRefill = async (tier: Station2Tier, level: CefrLevel) => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey || isFetchingAiRef.current) return;

    try {
      isFetchingAiRef.current = true;
      const promptInstruction = `Create 1 UNIQUE situational reflex challenge for Station 2 at CEFR level ${level} in tier ${tier}.
Output ONLY raw JSON:
{
  "title": "Short title in English",
  "place": "Short location",
  "task": "Core speaking task in English",
  "contextDesc": "Context description in English",
  "prompt": "Natural spoken English sentence",
  "hintVi": "Summary hint in Vietnamese",
  "hintTh": "Summary hint in Thai",
  "hintJa": "Summary hint in Japanese",
  "hintKo": "Summary hint in Korean",
  "hintId": "Summary hint in Indonesian",
  "hintZh": "Summary hint in Chinese"
}`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: promptInstruction }],
          temperature: 1.0,
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(data.choices[0].message.content);
        const newAiItem: ChallengeItem = {
          id: `ai_${Date.now()}_${Math.random()}`,
          tier,
          level,
          title: `🤖 [AI] ${content.title}`,
          place: content.place || 'General Context',
          task: content.task || 'Reflex response',
          contextDesc: content.contextDesc,
          prompt: content.prompt,
          hint: {
            vi: content.hintVi || content.contextDesc,
            th: content.hintTh || content.contextDesc,
            ja: content.hintJa || content.contextDesc,
            ko: content.hintKo || content.contextDesc,
            id: content.hintId || content.contextDesc,
            zh: content.hintZh || content.contextDesc
          },
          isTeacherAssigned: false,
        };
        setAiQueue(prev => [...prev, newAiItem]);
      }
    } catch (e) {
      console.warn("Background AI refiller paused:", e);
    } finally {
      isFetchingAiRef.current = false;
    }
  };

  const handleNextTopic = () => {
    stopSampleAudio();
    const nextIdx = topicIndex + 1;
    setTopicIndex(nextIdx);

    if (aiQueue.length > 0) {
      const [aiItem, ...remainingQueue] = aiQueue;
      setAiQueue(remainingQueue);
      setCurrentChallenge(aiItem);
      triggerBackgroundAiRefill(selectedTier, selectedLevel);
      return;
    }

    const freshPreset = createProceduralScenario(selectedTier, selectedLevel, nextIdx);
    setCurrentChallenge(freshPreset);
    triggerBackgroundAiRefill(selectedTier, selectedLevel);
  };

  const handleStartCustomTopic = () => {
    stopSampleAudio();
    if (!customTitle.trim() || !customPrompt.trim()) {
      Alert.alert("Missing Information", "Please enter both Title and English Target Prompt!");
      return;
    }

    const customItem: ChallengeItem = {
      id: `custom_${Date.now()}`,
      tier: selectedTier,
      level: selectedLevel,
      title: customTitle.trim(),
      place: 'Custom User Context',
      task: 'Deliver spontaneous reflex speaking',
      contextDesc: customContext.trim() || `Custom Reflex Challenge (${selectedTier} - ${selectedLevel}):`,
      prompt: customPrompt.trim(),
      hint: {
        vi: customContext.trim() || customTitle.trim(),
        th: customContext.trim() || customTitle.trim(),
        ja: customContext.trim() || customTitle.trim(),
        ko: customContext.trim() || customTitle.trim(),
        id: customContext.trim() || customTitle.trim(),
        zh: customContext.trim() || customTitle.trim()
      },
      isTeacherAssigned: false
    };

    setCurrentChallenge(customItem);
    setIsNormalPracticing(true);
    setIsTeacherExamining(false);
    setNormalTimer(0);
    setIsRecordingNormal(false);
  };

  const handleEnterRoom = (item: ChallengeItem) => {
    stopSampleAudio();
    setCurrentChallenge(item);
    if (item.isTeacherAssigned) {
      setIsTeacherExamining(true);
      setIsNormalPracticing(false);
    } else {
      setIsNormalPracticing(true);
      setIsTeacherExamining(false);
      setNormalTimer(0);
      setIsRecordingNormal(false);
    }
  };

  const startNormalRecording = async () => {
    stopSampleAudio();
    try {
      normalAudioChunksRef.current = [];
      normalPitchHistoryRef.current = [];
      setNormalTimer(0);
      setLiveTranscript('');
      liveTranscriptRef.current = '';

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      
      const detectedFormat = getSupportedAudioMimeType();
      activeMimeTypeRef.current = detectedFormat;

      const options: any = {
        audioBitsPerSecond: 32000,
        ...(detectedFormat.mimeType ? { mimeType: detectedFormat.mimeType } : {})
      };
      const mediaRecorder = new (window as any).MediaRecorder(stream, options);
      normalMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) normalAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecordingNormal(true);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event: any) => {
            let live = '';
            for (let i = 0; i < event.results.length; i++) {
              live += event.results[i][0].transcript + ' ';
            }
            const cleanLive = live.trim();
            liveTranscriptRef.current = cleanLive;
            setLiveTranscript(cleanLive);
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition bypassed:", e);
        }
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);
      const sampleRate = audioCtx.sampleRate;

      const track = () => {
        analyser.getFloatTimeDomainData(buffer);
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
        rms = Math.sqrt(rms / buffer.length);
        if (rms >= 0.015) {
          let r1 = 0, r2 = buffer.length - 1;
          for (let i = 0; i < buffer.length / 2; i++) if (Math.abs(buffer[i]) < 0.2) { r1 = i; break; }
          for (let i = 1; i < buffer.length / 2; i++) if (Math.abs(buffer[buffer.length - i]) < 0.2) { r2 = buffer.length - i; break; }
          const tb = buffer.slice(r1, r2);
          const c = new Array(tb.length).fill(0);
          for (let i = 0; i < tb.length; i++) for (let j = 0; j < tb.length - i; j++) c[i] += tb[j] * tb[j + i];
          let d = 0;
          while (c[d] > c[d + 1]) d++;
          let maxval = -1, maxpos = -1;
          for (let i = d; i < tb.length; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
          const pitch = maxpos > 0 ? sampleRate / maxpos : -1;
          if (pitch >= 60 && pitch <= 450) {
            normalPitchHistoryRef.current.push(pitch);
          }
        }
        drawLiveWaveform(buffer);
        normalAnimFrameRef.current = requestAnimationFrame(track);
      };
      track();
    } catch (err) {
      Alert.alert("Microphone Error", "Unable to access microphone. Please grant permissions in your browser.");
    }
  };

  const drawLiveWaveform = (buffer: Float32Array) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00FFFF';
    ctx.beginPath();
    const sliceWidth = canvas.width / buffer.length;
    let x = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i] * 50;
      const y = (canvas.height / 2) + v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  const stopNormalRecording = () => {
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
      speechRecognitionRef.current = null;
    }

    if (normalAnimFrameRef.current) cancelAnimationFrame(normalAnimFrameRef.current);
    if (normalMediaRecorderRef.current && normalMediaRecorderRef.current.state !== 'inactive') {
      normalMediaRecorderRef.current.stop();
      normalMediaRecorderRef.current.onstop = () => {
        const { mimeType } = activeMimeTypeRef.current;
        const audioBlob = new Blob(normalAudioChunksRef.current, mimeType ? { type: mimeType } : undefined);
        const localUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(localUrl);
        finishSubmissionAndEvaluate(audioBlob, normalPitchHistoryRef.current, localUrl);
      };
    }
    setIsRecordingNormal(false);
  };

  useEffect(() => {
    let timer: any = null;
    if (isRecordingNormal) {
      timer = setInterval(() => setNormalTimer(prev => prev + 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isRecordingNormal]);

  const finishSubmissionAndEvaluate = async (audioBlob: Blob, pitchHistory: number[], localAudioUrl?: string) => {
    setIsEvaluating(true);
    setEvaluatingStatus('⚡ AI ANALYZING ACOUSTICS & TRANSCRIBING TAPESCRIPT...');

    if (localAudioUrl) {
      setRecordedAudioUrl(localAudioUrl);
    } else {
      setRecordedAudioUrl(URL.createObjectURL(audioBlob));
    }

    let actualTranscript = liveTranscriptRef.current.trim();
    let serverEvalData: any = null;

    const targetPrompt = practiceMode === 'READ_SAMPLE' 
      ? (currentChallenge?.prompt || '') 
      : `Reflex challenge: ${currentChallenge?.contextDesc || ''}`;

    const MAX_RETRIES = 2;
    let attempt = 0;
    let success = false;

    while (attempt <= MAX_RETRIES && !success) {
      try {
        if (attempt > 0) {
          setEvaluatingStatus(`🔄 Reconnecting to evaluation server (${attempt}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, 1200));
        }

        serverEvalData = await evaluateSpeaking(audioBlob, selectedLevel, '2', targetPrompt);
        if (serverEvalData) {
          success = true;
          if (serverEvalData.transcript && serverEvalData.transcript.trim()) {
            actualTranscript = serverEvalData.transcript.trim();
            setLiveTranscript(actualTranscript);
            liveTranscriptRef.current = actualTranscript;
          }
        }
      } catch (err) {
        attempt++;
        console.warn(`Evaluation attempt ${attempt} failed:`, err);
      }
    }

    if (!success && (!actualTranscript || actualTranscript.length < 3)) {
      setIsEvaluating(false);
      Alert.alert(
        "Connection Interrupted",
        "Network latency prevented AI scoring. Your audio has been preserved; please check your connection and tap 'Retry Scoring'.",
        [
          { text: "Dismiss", style: "cancel" },
          { text: "🔄 Retry Scoring", onPress: () => finishSubmissionAndEvaluate(audioBlob, pitchHistory, localAudioUrl) }
        ]
      );
      return;
    }

    const WHISPER_HALLUCINATIONS = [
      'thank you', 'thank you.', 'thank you very much', 'thank you for watching',
      'thanks for watching', 'you', 'bye', 'bye.', 'subtitles', 'subscribe', 'the end'
    ];

    const cleanLowerTranscript = actualTranscript.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const isHallucination = WHISPER_HALLUCINATIONS.some(h => cleanLowerTranscript === h);
    const validWords = actualTranscript.replace(/[^a-zA-Z0-9]/g, '').trim();

    let hasMatchingSampleWord = true;
    if (practiceMode === 'READ_SAMPLE' && currentChallenge?.prompt) {
      const promptWords = currentChallenge.prompt.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2);
      const spokenWords = cleanLowerTranscript.split(/\s+/);
      hasMatchingSampleWord = spokenWords.some(w => promptWords.includes(w));
    }

    const isSilence = 
      !validWords || 
      validWords.length < 3 || 
      isHallucination || 
      (pitchHistory && pitchHistory.length < 3) ||
      (!hasMatchingSampleWord && practiceMode === 'READ_SAMPLE');

    if (isSilence) {
      setIsEvaluating(false);
      const zeroEvaluation = {
        totalScore: 0,
        spontaneityScore: 0,
        isScriptSuspected: false,
        rubrics: {
          pronunciation: { score: 0, feedback: "No valid English speech detected." },
          intonation: { score: 0, feedback: "No intonation contour detected." },
          fluency: { score: 0, feedback: "Complete silence period." },
          vocabulary: { score: 0, feedback: "No target vocabulary recognized." },
          grammar: { score: 0, feedback: "No grammatical structure formed." },
          content: { score: 0, feedback: "No relevant reflex content." }
        }
      };

      setFeedbackResult(zeroEvaluation);
      setDetailedModalVisible(true);
      Alert.alert(
        "No Speech Detected",
        "The system detected no valid English speech for this challenge. Result: 0 Points. Please speak clearly into the microphone!"
      );
      return;
    }

    setEvaluatingStatus('📊 Synthesizing multi-dimensional rubrics...');
    const duration = Math.max(normalTimer, 2);
    let evaluated: any;

    if (practiceMode === 'READ_SAMPLE') {
      evaluated = evaluateSpeechSubmission({
        transcript: actualTranscript,
        targetPrompt: currentChallenge?.prompt || '',
        pitchHistory,
        durationSeconds: duration,
        cefrLevel: currentChallenge?.level || selectedLevel
      });
    } else {
      evaluated = evaluateSpeechSubmission({
        transcript: actualTranscript,
        targetPrompt: actualTranscript || currentChallenge?.prompt || '',
        pitchHistory,
        durationSeconds: duration,
        cefrLevel: currentChallenge?.level || selectedLevel
      });

      if (actualTranscript && actualTranscript.split(/\s+/).filter(Boolean).length >= 4) {
        evaluated.spontaneityScore = Math.min(100, Math.max(evaluated.spontaneityScore, 85));
        evaluated.rubrics.content.score = Math.min(100, Math.max(evaluated.rubrics.content.score, 88));
      }
    }

    if (serverEvalData?.criteria?.pronunciation) {
      evaluated.rubrics.pronunciation.score = serverEvalData.criteria.pronunciation;
    }

    const r = evaluated.rubrics;
    const weightedTotal = Math.round(
      (r.pronunciation.score * 0.20) +
      (r.intonation.score * 0.20) +
      (r.fluency.score * 0.15) +
      (r.vocabulary.score * 0.15) +
      (r.grammar.score * 0.15) +
      (r.content.score * 0.15)
    );
    evaluated.totalScore = weightedTotal;

    let audioUrl = '';
    try {
      if (supabase) {
        const ext = activeMimeTypeRef.current.extension || 'webm';
        const contentType = activeMimeTypeRef.current.mimeType || (ext === 'mp4' ? 'audio/mp4' : 'audio/webm');
        const fileName = `station2_${selectedTier.toLowerCase()}_${selectedLevel.toLowerCase()}_${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('submissions')
          .upload(fileName, audioBlob, { contentType });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
          audioUrl = urlData?.publicUrl || '';
        }

        const { data: authUser } = await supabase.auth.getUser();
        await supabase.from('submissions').insert([{
          student_name: authUser?.user?.user_metadata?.full_name || 'Arena Challenger',
          student_code: authUser?.user?.email?.split('@')[0] || 'STU_S2',
          class_name: `Station 2: ${selectedTier} (${selectedLevel}) [${practiceMode === 'READ_SAMPLE' ? 'Read Sample' : 'Spontaneous'}]`,
          mode: `STATION_2_${selectedTier}`,
          cefr_level: currentChallenge?.level || selectedLevel,
          score: evaluated.totalScore,
          manual_score: null,
          spontaneity_score: evaluated.spontaneityScore,
          pitch_variance: evaluated.rubrics.intonation.score,
          is_script_suspected: evaluated.isScriptSuspected,
          audio_url: audioUrl,
          transcript: actualTranscript || '(No audio transcribed)',
          feedback: `[Pronunciation: ${evaluated.rubrics.pronunciation.score} | Intonation: ${evaluated.rubrics.intonation.score} | Fluency: ${evaluated.rubrics.fluency.score}]`
        }]);
      }
    } catch (err) {
      console.warn("Submission sync error:", err);
    }

    setIsEvaluating(false);
    setFeedbackResult(evaluated);
    setIsTeacherExamining(false);
    setDetailedModalVisible(true);
  };

  const currentTierInfo = TIERS.find(t => t.key === selectedTier);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>🔙 MAP</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚔️ STATION 2: ALL-IN ARENA (SITUATIONAL REFLEX)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 35 }}>
        {!isTeacherExamining && !isNormalPracticing && (
          <>
            {/* 1. SEED TOPIC ORIGIN */}
            <Text style={styles.sectionHeaderLabel}>1. SELECT CHALLENGE SOURCE:</Text>
            <View style={styles.originTabsRow}>
              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'SYSTEM' && styles.originTabActiveSystem]}
                onPress={() => setTopicOrigin('SYSTEM')}
              >
                <Text style={styles.originTabIcon}>🤖</Text>
                <Text style={[styles.originTabText, topicOrigin === 'SYSTEM' && styles.originTabTextActive]}>
                  SYSTEM CURATED
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'TEACHER_DASHBOARD' && styles.originTabActiveTeacher]}
                onPress={() => setTopicOrigin('TEACHER_DASHBOARD')}
              >
                <Text style={styles.originTabIcon}>🏫</Text>
                <Text style={[styles.originTabText, topicOrigin === 'TEACHER_DASHBOARD' && styles.originTabTextActive]}>
                  INSTRUCTOR ASSIGNED
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originTab, topicOrigin === 'STUDENT_CUSTOM' && styles.originTabActiveCustom]}
                onPress={() => setTopicOrigin('STUDENT_CUSTOM')}
              >
                <Text style={styles.originTabIcon}>📋</Text>
                <Text style={[styles.originTabText, topicOrigin === 'STUDENT_CUSTOM' && styles.originTabTextActive]}>
                  CUSTOM PROMPT
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. PRACTICE MODE */}
            <Text style={styles.sectionHeaderLabel}>2. SELECT REFLEX MODE:</Text>
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                style={[styles.modeTabBtn, practiceMode === 'READ_SAMPLE' && styles.modeTabBtnActiveSample]}
                onPress={() => setPracticeMode('READ_SAMPLE')}
              >
                <Text style={[styles.modeTabBtnText, practiceMode === 'READ_SAMPLE' && styles.modeTabBtnTextActive]}>
                  📖 1. READ TARGET SAMPLE
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, practiceMode === 'FREE_SPEECH' && styles.modeTabBtnActiveFree]}
                onPress={() => setPracticeMode('FREE_SPEECH')}
              >
                <Text style={[styles.modeTabBtnText, practiceMode === 'FREE_SPEECH' && styles.modeTabBtnTextActive]}>
                  ⚡ 2. SPONTANEOUS REFLEX
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. REFLEX TIER */}
            <Text style={styles.sectionHeaderLabel}>3. BATTLE FORMAT:</Text>
            <View style={styles.tierSelector}>
              {TIERS.map(t => {
                const isActive = selectedTier === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tierTab, isActive && styles.tierTabActive]}
                    onPress={() => setSelectedTier(t.key)}
                  >
                    <Text style={styles.tierTabIcon}>{t.icon}</Text>
                    <Text style={[styles.tierTabText, isActive && styles.tierTabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.tierInfoBox}>
              <Text style={styles.tierInfoText}>🎯 {currentTierInfo?.desc}</Text>
            </View>

            {/* 4. CEFR LEVEL */}
            <Text style={styles.sectionHeaderLabel}>4. CEFR LEVEL:</Text>
            <View style={styles.levelTabs}>
              {CEFR_LEVELS.map((lvl) => {
                const isActive = selectedLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.levelTab, isActive && styles.levelTabActive]}
                    onPress={() => setSelectedLevel(lvl)}
                  >
                    <Text style={[styles.levelTabText, isActive && styles.levelTabTextActive]}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 🎧 AUDIO PLAYBACK REVIEW */}
            {recordedAudioUrl && !isRecordingNormal && (
              <View style={styles.audioReviewBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.audioReviewTitle}>🎧 YOUR PREVIOUS RECORDING:</Text>
                  {feedbackResult && (
                    <TouchableOpacity 
                      style={styles.viewScoreBtn}
                      onPress={() => setDetailedModalVisible(true)}
                    >
                      <Text style={styles.viewScoreBtnText}>📊 VIEW RUBRICS SCORE</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {React.createElement('audio', {
                  controls: true,
                  src: recordedAudioUrl,
                  style: { width: '100%', height: '38px', marginTop: '8px' }
                })}
              </View>
            )}

            {/* 5. GIAO DIỆN TẠO ĐỀ / HIỂN THỊ ĐỀ BÀI */}
            {topicOrigin === 'STUDENT_CUSTOM' ? (
              <View style={styles.customBoxWrapper}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.customBoxTitle}>📋 TẠO / DÁN ĐỀ BÀI RIÊNG CỦA BẠN:</Text>
                  <TouchableOpacity onPress={() => setTopicOrigin('SYSTEM')}>
                    <Text style={{ color: '#00FFFF', fontSize: 10.5, fontWeight: 'bold' }}>✕ HỦY / QUAY LẠI ĐỀ MẪU</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.fieldLabel}>Tên chủ đề / Tình huống (*):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Phỏng vấn xin việc, Đàm phán giá cả..."
                  placeholderTextColor="#666688"
                  value={customTitle}
                  onChangeText={setCustomTitle}
                />

                <Text style={styles.fieldLabel}>Bối cảnh tình huống:</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Bạn là ứng viên giải thích kinh nghiệm quản lý..."
                  placeholderTextColor="#666688"
                  value={customContext}
                  onChangeText={setCustomContext}
                />

                <Text style={styles.fieldLabel}>
                  {practiceMode === 'READ_SAMPLE' ? 'Câu phản xạ mẫu tiếng Anh (*):' : 'Câu hỏi / Thử thách phản xạ tiếng Anh (*):'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Dán câu tiếng Anh mục tiêu vào đây..."
                  placeholderTextColor="#666688"
                  multiline
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                />

                <TouchableOpacity style={styles.startCustomBtn} onPress={handleStartCustomTopic}>
                  <Text style={styles.startCustomBtnText}>🚀 BẮT ĐẦU PHẢN XẠ VỚI ĐỀ NÀY NGAY</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.topicContainer}>
                {/* 🎯 HÀNG NÚT THAO TÁC KÉP: ĐỔI ĐỀ (0MS) VÀ TẠO MỚI CHỦ ĐỀ */}
                <View style={styles.actionButtonRow}>
                  <TouchableOpacity 
                    style={styles.prominentSwitchBtn} 
                    activeOpacity={0.7}
                    onPress={handleNextTopic}
                  >
                    <Text style={styles.prominentSwitchBtnText}>
                      🎲 NEXT SCENARIO (0MS)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.prominentCreateBtn} 
                    activeOpacity={0.7}
                    onPress={() => setTopicOrigin('STUDENT_CUSTOM')}
                  >
                    <Text style={styles.prominentCreateBtnText}>
                      ➕ CREATE / PASTE TOPIC
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* THẺ BÀI TẬP CHÍNH */}
                <View style={[styles.card, currentChallenge.isTeacherAssigned && styles.teacherCard]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.roleText, currentChallenge.isTeacherAssigned && { color: '#00FFFF' }]}>
                      {currentChallenge.title}
                    </Text>
                    <Text style={styles.levelBadge}>
                      {currentChallenge.level}
                    </Text>
                  </View>
                  
                  <Text style={styles.contextText}>📌 {currentChallenge.contextDesc}</Text>

                  {/* 🌐 THANH CHỌN CỜ 6 NƯỚC (ĐÃ BỔ SUNG 🇨🇳 TRUNG QUỐC) */}
                  <View style={styles.hintContainer}>
                    <View style={styles.hintHeaderRow}>
                      <TouchableOpacity 
                        style={[styles.hintToggleBtn, showHint && styles.hintToggleBtnActive]} 
                        onPress={() => setShowHint(prev => !prev)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.hintToggleText, showHint ? { color: '#000000' } : { color: '#FFD700' }]}>
                          {showHint ? '✕ HIDE HINT' : `💡 SHOW HINT (${LANG_CONFIG[selectedLang].code})`}
                        </Text>
                      </TouchableOpacity>

                      {/* DÃY CỜ 6 NƯỚC LUÔN NẰM TRỰC DIỆN ĐỂ BẤM CHỌN */}
                      <View style={styles.flagPickerRow}>
                        {(['vi', 'th', 'ja', 'ko', 'id', 'zh'] as SupportedLang[]).map((lang) => {
                          const isSelected = selectedLang === lang;
                          return (
                            <TouchableOpacity
                              key={lang}
                              style={[styles.flagBtn, isSelected && styles.flagBtnActive]}
                              onPress={() => {
                                setSelectedLang(lang);
                                setShowHint(true);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.flagIcon}>{LANG_CONFIG[lang].flag}</Text>
                              <Text style={[styles.flagCodeText, isSelected ? { color: '#00FFFF' } : { color: '#AAAACC' }]}>
                                {LANG_CONFIG[lang].code}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* HỘP GỢI Ý ĐA NGỮ ĐỔI NỘI DUNG TỨC THÌ THEO CỜ ĐÃ CHỌN */}
                    {showHint && currentChallenge && (
                      <View style={styles.hintContentBox}>
                        <View style={styles.scaffoldingMetaRow}>
                          <Text style={styles.scaffoldingMetaText}>📍 <Text style={{ color: '#00FFFF' }}>Place:</Text> {currentChallenge.place || 'General Location'}</Text>
                          <Text style={styles.scaffoldingMetaText}>🎯 <Text style={{ color: '#FFD700' }}>Goal:</Text> {currentChallenge.task || 'Reflex response'}</Text>
                        </View>
                        <View style={styles.nativeTranslateDivider} />
                        <Text style={styles.hintLanguageTag}>
                          👉 {LANG_CONFIG[selectedLang].flag} {LANG_CONFIG[selectedLang].label}:
                        </Text>
                        <Text style={styles.hintBodyText}>
                          "{currentChallenge.hint?.[selectedLang] || currentChallenge.hint?.vi || currentChallenge.contextDesc}"
                        </Text>
                      </View>
                    )}
                  </View>

                  {practiceMode === 'READ_SAMPLE' ? (
                    <View style={styles.previewPromptBox}>
                      <View style={styles.sampleHeaderRow}>
                        <Text style={styles.previewPromptLabel}>📖 Target Spoken Model:</Text>
                        <TouchableOpacity 
                          style={[styles.ttsMiniBtn, isPlayingSample && styles.ttsMiniBtnActive]} 
                          activeOpacity={0.7}
                          onPress={() => playNaturalTTS(currentChallenge.prompt)}
                        >
                          <Text style={styles.ttsMiniBtnText}>
                            {isPlayingSample ? '⏹ STOP' : '🔊 LISTEN MODEL'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.previewPromptText}>"{currentChallenge.prompt}"</Text>
                    </View>
                  ) : (
                    <View style={styles.freeSpeechHintBox}>
                      <Text style={styles.freeSpeechHintLabel}>⚡ SPONTANEOUS RESPONSE REQUIRED:</Text>
                      <Text style={styles.freeSpeechHintText}>
                        Absorb the context above and deliver your own natural spoken English reflex!
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.startBtn, currentChallenge.isTeacherAssigned && { backgroundColor: '#00FFFF' }]}
                    onPress={() => handleEnterRoom(currentChallenge)}
                  >
                    <Text style={[styles.startBtnText, currentChallenge.isTeacherAssigned && { color: '#000' }]}>
                      🎙️ ENTER REFLEX RECORDING SUITE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* PHÒNG THU LUYỆN TẬP */}
        {isNormalPracticing && currentChallenge && (
          <View style={styles.normalPracticeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.normalPracticeHeader}>
                {practiceMode === 'READ_SAMPLE' ? '🎙️ SUITE: READ SPOKEN MODEL' : '⚡ SUITE: SPONTANEOUS REFLEX'}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {topicOrigin !== 'STUDENT_CUSTOM' && (
                  <TouchableOpacity 
                    style={styles.switchTopicInRoomBtn} 
                    activeOpacity={0.7} 
                    onPress={handleNextTopic}
                  >
                    <Text style={styles.switchTopicInRoomText}>🔄 NEXT SCENARIO</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsNormalPracticing(false)}>
                  <Text style={{ color: '#FF0055', fontWeight: 'bold' }}>✕ EXIT</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.normalPromptTitle}>{currentChallenge.title} ({currentChallenge.level})</Text>
            <Text style={styles.normalPromptDesc}>{currentChallenge.contextDesc}</Text>

            {/* HINT BAR TRONG PHÒNG THU CŨNG ĐỒNG BỘ 6 CỜ */}
            <View style={styles.hintContainer}>
              <View style={styles.hintHeaderRow}>
                <TouchableOpacity 
                  style={[styles.hintToggleBtn, showHint && styles.hintToggleBtnActive]} 
                  onPress={() => setShowHint(prev => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.hintToggleText, showHint ? { color: '#000000' } : { color: '#FFD700' }]}>
                    {showHint ? '✕ HIDE HINT' : `💡 SHOW HINT (${LANG_CONFIG[selectedLang].code})`}
                  </Text>
                </TouchableOpacity>

                <View style={styles.flagPickerRow}>
                  {(['vi', 'th', 'ja', 'ko', 'id', 'zh'] as SupportedLang[]).map((lang) => {
                    const isSelected = selectedLang === lang;
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={[styles.flagBtn, isSelected && styles.flagBtnActive]}
                        onPress={() => {
                          setSelectedLang(lang);
                          setShowHint(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.flagIcon}>{LANG_CONFIG[lang].flag}</Text>
                        <Text style={[styles.flagCodeText, isSelected ? { color: '#00FFFF' } : { color: '#AAAACC' }]}>
                          {LANG_CONFIG[lang].code}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {showHint && currentChallenge && (
                <View style={styles.hintContentBox}>
                  <Text style={styles.hintLanguageTag}>
                    👉 {LANG_CONFIG[selectedLang].flag} {LANG_CONFIG[selectedLang].label}:
                  </Text>
                  <Text style={styles.hintBodyText}>
                    "{currentChallenge.hint?.[selectedLang] || currentChallenge.hint?.vi || currentChallenge.contextDesc}"
                  </Text>
                </View>
              )}
            </View>

            {practiceMode === 'READ_SAMPLE' ? (
              <View style={styles.promptDisplayBox}>
                <View style={styles.sampleHeaderRow}>
                  <Text style={styles.promptModeNotice}>📖 TARGET SPOKEN PHRASE:</Text>
                  <TouchableOpacity 
                    style={[styles.ttsPlayBtn, isPlayingSample && styles.ttsPlayBtnActive]} 
                    activeOpacity={0.7}
                    onPress={() => playNaturalTTS(currentChallenge.prompt)}
                  >
                    <Text style={styles.ttsPlayBtnText}>
                      {isPlayingSample ? '⏹ STOP AUDIO' : '🔊 PLAY NEURAL MODEL'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.promptDisplayText}>{currentChallenge.prompt}</Text>
              </View>
            ) : (
              <View style={[styles.promptDisplayBox, { borderColor: '#39FF14', backgroundColor: '#07180D' }]}>
                <Text style={[styles.promptModeNotice, { color: '#39FF14' }]}>
                  ⚡ SPONTANEOUS RESPONSE ACTIVE:
                </Text>
                <Text style={[styles.promptDisplayText, { fontSize: 13, color: '#88FFBB', fontWeight: 'bold' }]}>
                  Tap record and speak your natural response based on the scenario above!
                </Text>
              </View>
            )}

            <View style={styles.liveWaveformBox}>
              <Text style={styles.liveWaveformLabel}>
                {isRecordingNormal ? `🔴 RECORDING LIVE AUDIO SPECTRUM: ${normalTimer}S` : '⚪ READY TO RECORD'}
              </Text>
              <canvas
                ref={canvasRef}
                width={520}
                height={80}
                style={{ width: '100%', height: 80, backgroundColor: '#070212', borderRadius: 8, display: 'block' }}
              />
            </View>

            {(isRecordingNormal || liveTranscript) && (
              <View style={styles.liveSubtitleBox}>
                <Text style={styles.liveSubtitleLabel}>
                  {isRecordingNormal ? '🎙️ Recognizing your speech:' : '📝 Transcribed Speech:'}
                </Text>
                <Text style={styles.liveSubtitleText}>
                  {liveTranscript || '... (speak in English clearly)'}
                </Text>
              </View>
            )}

            {recordedAudioUrl && !isRecordingNormal && (
              <View style={styles.audioReviewBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.audioReviewTitle}>🎧 PLAYBACK RECORDING:</Text>
                  {feedbackResult && (
                    <TouchableOpacity 
                      style={styles.viewScoreBtn}
                      onPress={() => setDetailedModalVisible(true)}
                    >
                      <Text style={styles.viewScoreBtnText}>📊 DETAILED RUBRICS</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {React.createElement('audio', {
                  controls: true,
                  src: recordedAudioUrl,
                  style: { width: '100%', height: '36px', marginTop: '6px' }
                })}
              </View>
            )}

            {isEvaluating ? (
              <View style={styles.evaluatingBox}>
                <ActivityIndicator size="small" color="#00FFFF" />
                <Text style={styles.evaluatingText}>{evaluatingStatus}</Text>
              </View>
            ) : !isRecordingNormal ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.startRecordBtn, recordedAudioUrl ? { flex: 1 } : { width: '100%' }]} 
                  activeOpacity={0.8} 
                  onPress={startNormalRecording}
                >
                  <Text style={styles.startRecordBtnText}>
                    {recordedAudioUrl ? '🔄 RECORD AGAIN' : '🔴 START RECORDING'}
                  </Text>
                </TouchableOpacity>

                {recordedAudioUrl && feedbackResult && (
                  <TouchableOpacity 
                    style={styles.reopenModalBtn} 
                    activeOpacity={0.8} 
                    onPress={() => setDetailedModalVisible(true)}
                  >
                    <Text style={styles.reopenModalBtnText}>📊 VIEW SCORECARD</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.stopRecordBtn} activeOpacity={0.8} onPress={stopNormalRecording}>
                <Text style={styles.stopRecordBtnText}>⏹ STOP & EVALUATE SPEECH</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PHÒNG THI CHỐNG ĐỌC */}
        {isTeacherExamining && currentChallenge && typeof AntiCheatSpeakingSession === 'function' && (
          <AntiCheatSpeakingSession
            promptText={practiceMode === 'READ_SAMPLE' ? currentChallenge.prompt : ''}
            situationPrompt={currentChallenge.contextDesc}
            prepTimeSeconds={5}
            autoHidePrompt={true}
            onRecordingComplete={(blob: any, pitches: any) => finishSubmissionAndEvaluate(blob, pitches)}
            onCancel={() => setIsTeacherExamining(false)}
          />
        )}
      </ScrollView>

      {typeof DetailedSpeechFeedbackModal === 'function' && (
        <DetailedSpeechFeedbackModal
          visible={detailedModalVisible}
          data={feedbackResult}
          onClose={() => setDetailedModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', padding: 18, paddingTop: 45 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#0D0620', borderRadius: 8, borderWidth: 1, borderColor: '#00FFFF' },
  backBtnText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },
  title: { color: '#FF007F', fontSize: 11.5, fontWeight: '900', flexShrink: 1 },

  sectionHeaderLabel: { color: '#FFD700', fontSize: 9.5, fontWeight: '900', marginTop: 8, marginBottom: 6 },

  originTabsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  originTab: { flex: 1, paddingVertical: 10, backgroundColor: '#0D0620', borderRadius: 10, borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  originTabActiveTeacher: { backgroundColor: '#0B192C', borderColor: '#00FFFF' },
  originTabActiveCustom: { backgroundColor: '#1E0B36', borderColor: '#FF007F' },
  originTabActiveSystem: { backgroundColor: '#092B1E', borderColor: '#39FF14' },
  originTabIcon: { fontSize: 14, marginBottom: 2 },
  originTabText: { color: '#8888AA', fontSize: 8.5, fontWeight: 'bold', textAlign: 'center' },
  originTabTextActive: { color: '#FFF', fontWeight: '900' },

  modeTabsRow: { flexDirection: 'row', gap: 8 },
  modeTabBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#130628', borderRadius: 8, borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  modeTabBtnActiveSample: { backgroundColor: '#1E0B36', borderColor: '#00FFFF' },
  modeTabBtnActiveFree: { backgroundColor: '#092B1E', borderColor: '#39FF14' },
  modeTabBtnText: { color: '#8888AA', fontSize: 9.5, fontWeight: 'bold' },
  modeTabBtnTextActive: { color: '#FFF', fontWeight: '900' },

  tierSelector: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tierTab: { flex: 1, paddingVertical: 9, paddingHorizontal: 4, backgroundColor: '#0D0620', borderRadius: 10, borderWidth: 1.5, borderColor: '#332255', alignItems: 'center', justifyContent: 'center' },
  tierTabActive: { backgroundColor: '#1E0B36', borderColor: '#39FF14' },
  tierTabIcon: { fontSize: 13, marginBottom: 4 },
  tierTabText: { color: '#8888AA', fontSize: 8.5, fontWeight: 'bold', textAlign: 'center' },
  tierTabTextActive: { color: '#39FF14', fontWeight: '900' },
  tierInfoBox: { backgroundColor: '#0F0624', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#221144', marginBottom: 8 },
  tierInfoText: { color: '#FFD700', fontSize: 9, lineHeight: 14, fontStyle: 'italic' },

  levelTabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  levelTab: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: '#0D0620', borderWidth: 1.5, borderColor: '#332255', alignItems: 'center' },
  levelTabActive: { backgroundColor: '#FF007F', borderColor: '#FF007F' },
  levelTabText: { color: '#8888AA', fontSize: 10, fontWeight: 'bold' },
  levelTabTextActive: { color: '#FFF', fontWeight: '900' },

  topicContainer: { width: '100%', marginTop: 4 },

  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    width: '100%'
  },
  prominentSwitchBtn: {
    flex: 1.2,
    backgroundColor: '#1E0B36',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00FFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  prominentSwitchBtnText: {
    color: '#00FFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  prominentCreateBtn: {
    flex: 1,
    backgroundColor: '#0D2619',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#39FF14',
    alignItems: 'center',
    justifyContent: 'center'
  },
  prominentCreateBtnText: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  card: { backgroundColor: '#130628', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#332255', marginBottom: 12 },
  teacherCard: { borderColor: '#00FFFF', backgroundColor: '#0B192C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roleText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', flex: 1, marginRight: 8 },
  levelBadge: { color: '#000', backgroundColor: '#39FF14', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8.5, fontWeight: '900' },
  contextText: { color: '#FFF', fontSize: 11, lineHeight: 16, marginBottom: 8 },

  hintContainer: {
    marginVertical: 8,
    width: '100%',
  },
  hintHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  hintToggleBtn: {
    backgroundColor: '#16082F',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  hintToggleBtnActive: {
    backgroundColor: '#FFD700',
  },
  hintToggleText: {
    fontSize: 9,
    fontWeight: '900',
  },
  flagPickerRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#0D0620',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#332255',
    alignItems: 'center',
  },
  flagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#16082F',
    borderWidth: 1,
    borderColor: '#332255',
  },
  flagBtnActive: {
    backgroundColor: '#2A144E',
    borderColor: '#00FFFF',
  },
  flagIcon: {
    fontSize: 12.5,
  },
  flagCodeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  hintContentBox: {
    backgroundColor: '#07180D',
    borderLeftWidth: 3,
    borderLeftColor: '#39FF14',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  scaffoldingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scaffoldingMetaText: {
    color: '#DDD',
    fontSize: 9,
    fontWeight: 'bold',
  },
  nativeTranslateDivider: {
    height: 1,
    backgroundColor: '#1A3322',
    marginVertical: 4,
  },
  hintLanguageTag: {
    color: '#39FF14',
    fontSize: 9.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  hintBodyText: {
    color: '#88FFBB',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  previewPromptBox: { backgroundColor: '#070212', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#221144' },
  sampleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  previewPromptLabel: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },
  previewPromptText: { color: '#FFFFFF', fontSize: 11.5, fontStyle: 'italic' },
  freeSpeechHintBox: { backgroundColor: '#07180D', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#39FF14' },
  freeSpeechHintLabel: { color: '#39FF14', fontSize: 8.5, fontWeight: 'bold', marginBottom: 2 },
  freeSpeechHintText: { color: '#88FFBB', fontSize: 10, fontStyle: 'italic' },
  startBtn: { backgroundColor: '#FF007F', paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 10.5, fontWeight: '900' },

  ttsPlayBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E0B36', borderWidth: 1.5, borderColor: '#00FFFF', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  ttsPlayBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  ttsPlayBtnText: { color: '#00FFFF', fontSize: 9.5, fontWeight: '900' },
  ttsMiniBtn: { backgroundColor: '#1E0B36', borderWidth: 1, borderColor: '#00FFFF', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 5 },
  ttsMiniBtnActive: { backgroundColor: '#FF0055', borderColor: '#FF0055' },
  ttsMiniBtnText: { color: '#00FFFF', fontSize: 8.5, fontWeight: 'bold' },

  customBoxWrapper: { backgroundColor: '#0D0620', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#FF007F', marginVertical: 8 },
  customBoxTitle: { color: '#FF007F', fontSize: 11, fontWeight: '900' },
  fieldLabel: { color: '#00FFFF', fontSize: 9, fontWeight: 'bold', marginTop: 8, marginBottom: 3 },
  textInput: { backgroundColor: '#070212', borderWidth: 1, borderColor: '#332255', borderRadius: 6, padding: 8, color: '#FFF', fontSize: 11 },
  textArea: { minHeight: 65, textAlignVertical: 'top' },
  startCustomBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  startCustomBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },

  audioReviewBox: { backgroundColor: '#130628', padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#39FF14', marginVertical: 10 },
  audioReviewTitle: { color: '#39FF14', fontSize: 10, fontWeight: '900' },
  viewScoreBtn: { backgroundColor: '#0A2518', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#39FF14' },
  viewScoreBtnText: { color: '#39FF14', fontSize: 9, fontWeight: 'bold' },

  normalPracticeCard: { backgroundColor: '#0A0318', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#00FFFF', marginVertical: 10 },
  normalPracticeHeader: { color: '#00FFFF', fontSize: 10, fontWeight: '900' },
  switchTopicInRoomBtn: { backgroundColor: '#1E0B36', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#00FFFF' },
  switchTopicInRoomText: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },

  normalPromptTitle: { color: '#FFD700', fontSize: 13, fontWeight: '900', marginTop: 8 },
  normalPromptDesc: { color: '#8888AA', fontSize: 10.5, marginBottom: 8 },
  promptDisplayBox: { backgroundColor: '#130628', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#332255', marginBottom: 12 },
  promptModeNotice: { color: '#00FFFF', fontSize: 9.5, fontWeight: 'bold' },
  promptDisplayText: { color: '#FFFFFF', fontSize: 13, lineHeight: 20, fontWeight: 'bold' },
  liveWaveformBox: { marginBottom: 10 },
  liveWaveformLabel: { color: '#39FF14', fontSize: 9.5, fontWeight: 'bold', marginBottom: 6 },

  liveSubtitleBox: { backgroundColor: '#0D0A24', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#5533AA', marginBottom: 12 },
  liveSubtitleLabel: { color: '#FFD700', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  liveSubtitleText: { color: '#00FFFF', fontSize: 12, fontStyle: 'italic', lineHeight: 18 },

  evaluatingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, backgroundColor: '#0D0620', borderRadius: 10, borderWidth: 1, borderColor: '#00FFFF', marginVertical: 6 },
  evaluatingText: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold' },

  startRecordBtn: { backgroundColor: '#FF0055', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  startRecordBtnText: { color: '#FFF', fontSize: 11.5, fontWeight: '900' },
  reopenModalBtn: { flex: 1, backgroundColor: '#0D0620', borderWidth: 1.5, borderColor: '#00FFFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  reopenModalBtnText: { color: '#00FFFF', fontSize: 11, fontWeight: '900' },
  stopRecordBtn: { backgroundColor: '#39FF14', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  stopRecordBtnText: { color: '#000', fontSize: 11.5, fontWeight: '900' }
});