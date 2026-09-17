# TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ KỊCH BẢN TRIỂN KHAI PHẦN MỀM (SRS/PRD)

## DỰ ÁN: VIBESPEAK - SIÊU ỨNG DỤNG HỌC TIẾNG ANH GIA SƯ 1:1 THỰC CHIẾN

**Slogan:** *VibeSpeak - Bắt nhịp bản xứ, Gỡ lỗi tự nhiên*  
**Phong cách nghệ thuật:** Retro Wave / Cyberpunk (Neon tím, hồng, xanh lá phát sáng, biểu tượng băng Cassette hoài cổ, máy chữ cơ và bản đồ Tàu điện ngầm hiện đại).

\---

## 1\. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

### 1.1. Triết lý Thiết kế \& Định vị Sản phẩm

VibeSpeak là ứng dụng học tiếng Anh giao tiếp toàn diện dựa trên mô hình **Gia sư AI cá nhân hóa 1:1** kết hợp với cơ chế **Game hóa (Gamification) kịch tính**. Ứng dụng tập trung vào tính thực tế: biến các hoạt động thường nhật thành bài học, sửa lỗi tinh tế mà không làm đứt mạch giao tiếp, sử dụng hình phạt "Phong ấn đặc quyền" để duy trì kỷ luật và "Đấu trường Tất Tay" để thúc đẩy cạnh tranh.

### 1.2. Kiến trúc Công nghệ Khuyến nghị (Combo "Tốc Độ Ánh Sáng")

Để đạt hiệu quả tối đa về chi phí vận hành (Zero-Fee ban đầu cho nhà phát triển) và trải nghiệm thời gian thực cực nhanh:

* **Front-end:** React Native (Expo) - Hỗ trợ đa nền tảng (iOS, Android, Web), tối ưu dựng giao diện bản đồ SVG mượt mà và các hoạt ảnh neon.
* **Back-end \& Database:** Supabase (PostgreSQL) - Đồng bộ dữ liệu thời gian thực (Real-time DB), quản lý xác thực người dùng, lưu trữ lộ trình và xử lý ghép cặp thi đấu.
* **AI Engine:** Groq API (gọi các LLM mã nguồn mở siêu nhanh) để chấm lỗi thời gian thực, kết hợp với công nghệ nhận diện giọng nói (Speech-to-Text) tích hợp qua thư viện thiết bị (`expo-av`).

\---

## 2\. KIẾN TRÚC DỮ LIỆU (DATABASE SCHEMA DESIGN)

Dưới đây là cấu trúc các bảng dữ liệu trong PostgreSQL (Supabase) để chuyên gia thiết kế phần mềm cấu trúc hệ thống:

```sql
-- 1. Bảng thông tin người dùng (Users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen\\\\\\\_random\\\\\\\_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full\\\\\\\_name VARCHAR(100),
    avatar\\\\\\\_url TEXT,
    created\\\\\\\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\\\\\\\_TIMESTAMP,
    current\\\\\\\_level\\\\\\\_id INT, -- Liên kết tới trạm hiện tại trên bản đồ
    exp\\\\\\\_points INT DEFAULT 0, -- Điểm kinh nghiệm tích lũy
    streak\\\\\\\_count INT DEFAULT 0, -- Số ngày học liên tiếp
    last\\\\\\\_active\\\\\\\_at TIMESTAMP WITH TIME ZONE,
    is\\\\\\\_sealed BOOLEAN DEFAULT FALSE, -- Trạng thái bị phong ấn đặc quyền
    seal\\\\\\\_activated\\\\\\\_at TIMESTAMP WITH TIME ZONE
);

-- 2. Bảng quản lý Giải đấu Kỷ luật (Leagues)
CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50), -- Đồng, Bạc, Vàng, Kim Cương
    min\\\\\\\_exp INT,
    max\\\\\\\_exp INT
);

-- Bảng phân phòng thi đấu tuần (League\\\\\\\_Groups) - Chứa 30 người dùng cùng trình độ
CREATE TABLE league\\\\\\\_groups (
    id UUID PRIMARY KEY DEFAULT gen\\\\\\\_random\\\\\\\_uuid(),
    league\\\\\\\_id INT REFERENCES leagues(id),
    season\\\\\\\_week INT, -- Số tuần của mùa giải
    created\\\\\\\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\\\\\\\_TIMESTAMP
);

CREATE TABLE league\\\\\\\_members (
    group\\\\\\\_id UUID REFERENCES league\\\\\\\_groups(id),
    user\\\\\\\_id UUID REFERENCES users(id),
    weekly\\\\\\\_exp\\\\\\\_earned INT DEFAULT 0,
    PRIMARY KEY (group\\\\\\\_id, user\\\\\\\_id)
);

-- 3. Bảng Lộ trình Bản đồ Tàu điện ngầm (Metro\\\\\\\_Lines \\\\\\\& Stations)
CREATE TABLE metro\\\\\\\_lines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100), -- Tuyến Xanh Lá (Đời sống), Tuyến Đỏ (Công sở)
    color\\\\\\\_code VARCHAR(7) -- Mã hex neon ví dụ #00FF00
);

CREATE TABLE metro\\\\\\\_stations (
    id SERIAL PRIMARY KEY,
    line\\\\\\\_id INT REFERENCES metro\\\\\\\_lines(id),
    name VARCHAR(100), -- Trạm Quán Cafe, Trạm Sân Bay, Trạm Phỏng Vấn
    station\\\\\\\_order INT, -- Thứ tự trạm trên tuyến
    scenario\\\\\\\_description TEXT, -- Mô tả bối cảnh giao tiếp
    is\\\\\\\_hub BOOLEAN DEFAULT FALSE, -- Trạm trung chuyển (Sự kiện đánh giá định kỳ)
    required\\\\\\\_exp INT DEFAULT 0
);

-- 4. Bảng Tiến độ người học tại các Trạm (User\\\\\\\_Station\\\\\\\_Progress)
CREATE TABLE user\\\\\\\_station\\\\\\\_progress (
    user\\\\\\\_id UUID REFERENCES users(id),
    station\\\\\\\_id INT REFERENCES metro\\\\\\\_stations(id),
    is\\\\\\\_completed BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2), -- Điểm đánh giá cao nhất đạt được tại trạm này
    unlocked\\\\\\\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\\\\\\\_TIMESTAMP,
    completed\\\\\\\_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user\\\\\\\_id, station\\\\\\\_id)
);

-- 5. Bảng Kho giao diện cuộn băng (Mixtape\\\\\\\_Skins)
CREATE TABLE mixtape\\\\\\\_skins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100), -- Băng "Kỷ Luật Thép", Băng "Bản Xứ Thực Thụ", v.v.
    skin\\\\\\\_type VARCHAR(50), -- neon, bronze, gold, armored
    visual\\\\\\\_assets\\\\\\\_json JSON, -- Chứa đường dẫn ảnh, màu nền, hiệu ứng lấp lánh
    sfx\\\\\\\_assets\\\\\\\_json JSON -- Chứa đường dẫn âm thanh (nhạc nền lofi, ding, click)
);

CREATE TABLE user\\\\\\\_skins (
    user\\\\\\\_id UUID REFERENCES users(id),
    skin\\\\\\\_id INT REFERENCES mixtape\\\\\\\_skins(id),
    is\\\\\\\_equipped BOOLEAN DEFAULT FALSE,
    unlocked\\\\\\\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\\\\\\\_TIMESTAMP,
    PRIMARY KEY (user\\\\\\\_id, skin\\\\\\\_id)
);

-- 6. Bảng Nhật ký lỗi sai của người học (User\\\\\\\_Error\\\\\\\_Logs)
CREATE TABLE user\\\\\\\_error\\\\\\\_logs (
    id UUID PRIMARY KEY DEFAULT gen\\\\\\\_random\\\\\\\_uuid(),
    user\\\\\\\_id UUID REFERENCES users(id),
    original\\\\\\\_text TEXT NOT NULL, -- Câu nói bị lỗi của người dùng
    corrected\\\\\\\_grammar TEXT, -- Thẻ 1
    corrected\\\\\\\_natural TEXT, -- Thẻ 2
    corrected\\\\\\\_native TEXT, -- Thẻ 3
    explanation TEXT, -- Lời giải thích ngắn
    error\\\\\\\_category VARCHAR(50), -- Ngữ pháp, Từ vựng, Phát âm, Độ tự nhiên
    is\\\\\\\_resolved BOOLEAN DEFAULT FALSE, -- Đã khắc phục trong bài tập hàng tuần chưa
    created\\\\\\\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\\\\\\\_TIMESTAMP
);
```

\---

## 3\. KỊCH BẢN CHI TIẾT CÁC LUỒNG HOẠT ĐỘNG (DETAILED FEATURE FLOWS)

### Tính năng 1: Khảo thí và Đánh giá đầu vào (Pocket Test Center)

* **Mục tiêu:** Xác định chính xác trình độ ban đầu của học viên qua 5 kỹ năng: Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu và Giao tiếp để lập lộ trình học mà không tạo áp lực.
* **Luồng hoạt động của Hệ thống:**

  1. **Bước khởi đầu:** Hệ thống hiển thị giao diện "Khảo thí đầu vào". Bài kiểm tra ngắn gọn, thích ứng (Adaptive) liên tục thay đổi độ khó dựa trên câu trả lời trước đó của người học \[9].
  2. **Nguyên tắc công bằng:** Tuyệt đối không hiển thị đáp án đúng/sai hoặc kết quả chi tiết cho đến khi người học hoàn thành toàn bộ bài test để đảm bảo tính khách quan \[12, 13].
  3. **Xử lý phía AI:** Sau khi bài kiểm tra kết thúc, dữ liệu câu trả lời được gửi tới Core AI Engine. AI tiến hành phân tích lỗi sai và xác định mức điểm quy đổi cho từng kỹ năng \[13].
  4. **Tạo lộ trình cá nhân hóa (Roadmap):** Dựa trên mục tiêu (ví dụ: giao tiếp công sở, du lịch) và thời gian rảnh mỗi ngày mà người dùng thiết lập, hệ thống tự động sinh ra một lộ trình học ngôn ngữ chia thành từng giai đoạn rõ ràng \[13]. Lộ trình này ưu tiên dạy và thực hành các mẫu câu có tần suất sử dụng cao nhất trong giao tiếp thực tế \[13].

\---

### Tính năng 2: Bản đồ Tàu điện ngầm tương tác (Subway Map UI/UX)

* **Mục tiêu:** Trực quan hóa lộ trình học dưới dạng mạng lưới tàu điện ngầm hiện đại, tạo cảm giác phiêu lưu và tiến bộ từng chặng \[81, 82].
* **Đặc tả chi tiết:**

  1. **Giao diện chính (Subway Map Interface):** Bản đồ động gồm nhiều tuyến tàu màu neon khác nhau \[81, 82]:

     * *Tuyến Xanh Lá:* Đời sống thường ngày (Quán Cafe, Sân bay, Siêu thị...) \[82, 83].
     * *Tuyến Đỏ:* Công sở \& Kinh doanh (Phỏng vấn, Thuyết trình, Đàm phán...) \[82, 83].
  2. **Trạm Dừng Tình Huống (Scenario Stations):** Mỗi trạm đại diện cho một bối cảnh giao tiếp \[83]. Người học chạm vào trạm để kích hoạt buổi học.
  3. **Cơ chế Vé Tàu Kỷ Luật (Subway Pass):** Hệ thống cửa xoay tại trạm sẽ bị khóa \[84, 85]. Học viên chỉ được bấm đi tiếp trạm mới khi hoàn thành trọn vẹn quy trình học của trạm hiện tại theo quy trình chuẩn 1:1 \[14, 84, 85]:

     * *Bước 1: Khởi động (Warm-up)* -> AI tự động tổ chức ôn tập kiến thức cũ \[14].
     * *Bước 2: Tiếp thu (Ingest)* -> Giới thiệu kiến thức mới ngắn gọn kèm ví dụ \[14].
     * *Bước 3: Luyện tập (Practice)* -> Luyện nói/viết và sửa lỗi tức thì \[14].
     * *Bước 4: Kết thúc (Wrap-up)* -> Kiểm tra nhanh cuối buổi và giao bài tập \[14].
  4. **Trạm Trung Chuyển Lớn (Hub Stations) \& Hội Nghị Định Vị Tương Lai:**

     * Nằm tại giao lộ giữa các tuyến tàu \[83]. Đây là cột mốc kết thúc một cấp độ (Boss fight) \[74, 83].
     * Khi đến Hub, sự kiện **Hội Nghị Định Vị Tương Lai** kích hoạt \[70, 83]. Người học phải tham gia một bài kiểm tra nhập vai tổng hợp độ khó cao \[70].
     * AI phân tích dữ liệu tích lũy từ các trạm đã qua để xuất bản báo cáo mạng nhện trực quan (Visual Skill Map), chỉ rõ kỹ năng đã cải thiện và nguyên nhân của những điểm còn yếu \[10, 70].
     * Nếu vượt qua, màn hình bùng nổ pháo hoa và trao tặng **Cuộn băng Cassette cực hiếm** \[71, 72]. Hệ thống tự động căn chỉnh và tái thiết lộ trình tối ưu cho tuyến tàu tiếp theo \[71, 73].

\---

### Tính năng 3: Chế độ "Gỡ Băng Ghi Âm" hoài cổ và Sửa lỗi 4 Tiêu chí

* **Mục tiêu:** Tạo trải nghiệm thú vị khi sửa lỗi, xua tan áp lực tâm lý bằng phong cách retro \[53, 57].
* **Quy trình Hoạt động của Chế độ "Gỡ Băng" (Debrief Report) \[57]:**

  1. **Hội thoại không gián đoạn:** Trong quá trình luyện nói 1:1 tại các trạm, AI đóng vai người bản xứ nói chuyện tự nhiên \[40, 50, 69]. Để giữ mạch cảm xúc, AI không ngắt lời hay sửa lỗi ngay mà âm thầm ghi lại âm thanh và văn bản của học viên vào "Sổ tay gia sư" \[40, 50].
  2. **Hiệu ứng chuyển cảnh Retro:** Ngay khi cuộc gọi kết thúc, màn hình chuyển sang giao diện máy cassette cổ điển \[57, 58]. Âm thanh tiếng cúp máy "Click!" vang lên kết hợp tiếng rít tua băng "Rè rè" \[54, 57, 58].
  3. **Vinh danh bằng đèn phát sáng:** Máy bắt đầu phát lại chính giọng nói của người dùng \[58]. Đối với những từ/cụm từ phát âm chuẩn xác, một bóng đèn xanh lá trên máy cassette sẽ nháy sáng kèm tiếng "Ding!" trong trẻo \[54, 58].
  4. **Phân tích lỗi sai bằng máy chữ (Typewriter Effect):** Tại những câu có lỗi sai, băng cassette dừng lại \[59]. Tiếng gõ bàn phím lách cách vang lên, màn hình tự động hiển thị hiệu ứng "in" ra 3 phiên bản câu nâng cấp theo thời gian thực (Streaming) \[54, 59]:

     * *Thẻ 1:* **Đúng Ngữ Pháp (Grammatically Correct)** \[44, 59].
     * *Thẻ 2:* **Giao Tiếp Tự Nhiên (Natural Conversation)** \[44, 59].
     * *Thẻ 3:* **Chuẩn Bản Xứ (VibeSpeak Native)** \[44, 59].
     * *Phần Giải Thích:* Một đoạn text ngắn phân tích sắc thái ngữ nghĩa của 3 phiên bản dưới hiệu ứng chữ phát sáng Neon \[44, 59, 138].
  5. **Nút Thực Hành Lại:** Micro nhấp nháy đỏ, người dùng nhấn giữ để thu âm nói lại câu chuẩn cho đến khi thành thạo \[59, 60].

\---

### Tính năng 4: Cơ chế "Game hóa" \& Kỷ luật thép (League \& Penalty)

* **Mục tiêu:** Tạo động lực bền bỉ và nỗi sợ mất mát (FOMO) tích cực để duy trì thói quen học tập hàng ngày \[15, 25].
* **Đặc tả chi tiết:**

  1. **Giải Đấu Kỷ Luật (Ranked Leagues):**

     * Học viên được xếp vào các League (Đồng, Bạc, Vàng, Kim Cương), mỗi bảng có 30 đối thủ cùng trình độ \[19].
     * Điểm leo hạng được cộng dồn dựa trên độ kỷ luật hoàn thành lộ trình hàng ngày \[19, 23]. Điểm tối đa chỉ được cộng khi hoàn thành trọn vẹn quy trình 4 bước tại trạm học \[19, 23].
     * **Phần thưởng:** Mở khóa các đặc quyền trong ứng dụng như kịch bản hội thoại 1:1 độc quyền, bối cảnh nâng cao hoặc các giao diện cuộn băng cassette cực đẹp (Mixtape Skins) \[23, 24, 60, 61].
  2. **Hình phạt Phong Ấn Đặc Quyền (Privilege Sealing):**

     * Nếu người học bỏ học từ 2 ngày liên tiếp trở lên, hệ thống tự động kích hoạt trạng thái "Phong ấn" \[28, 29].
     * **Hậu quả hình phạt:** Điểm xếp hạng bị trừ nặng \[29]. Toàn bộ các tính năng cao cấp đã cày cuốc mở khóa, đặc biệt là chế độ luyện hội thoại 1:1 với AI sẽ bị khóa lại và hiển thị dưới dạng màu xám xịt \[28, 29, 30, 37]. Một biểu tượng đám mây đen hoặc ổ khóa xuất hiện cạnh tên trên bảng xếp hạng \[31, 37].
  3. **Lời Cảnh Báo Khẩn Cấp Từ Gia Sư:**

     * Trước giờ G khóa tính năng (ví dụ: 12 tiếng, 6 tiếng, 1 tiếng trước khi phong ấn), hệ thống gửi thông báo push mô phỏng giọng điệu gia sư hối thúc \[33, 36]:

> \\\\\\\*"Trợ lý Gia sư đây! Tôi đã chuẩn bị bài học hôm nay nhưng chưa thấy bạn. Chỉ còn 1 tiếng nữa là tiến độ của chúng ta gãy đoạn, và tôi buộc phải phong ấn chế độ luyện nói 1:1 đấy! ⏳"\\\\\\\* \\\\\\\[36]

4. **Thử thách "Giải Ấn" Khắc Nghiệt:**

   * Để khôi phục đặc quyền, học viên không thể học qua loa \[30]. Họ buộc phải thực hiện một "Bài kiểm tra phục hồi" (Restore Test) \[30].
   * Gia sư AI sẽ yêu cầu học viên nói lại các câu cốt lõi của phần kiến thức đã bỏ lỡ và chấm điểm cực kỳ khắt khe dựa trên 4 tiêu chí \[30]. Chỉ khi đạt điểm yêu cầu, xích phong ấn mới bị phá vỡ, khôi phục lại đặc quyền và thứ hạng cũ \[31, 38].

\---

### Tính năng 5: Đấu Trường "Tất Tay" (All-In Arena)

* **Mục tiêu:** Thổi bùng tinh thần cạnh tranh giao tiếp trực diện giữa các học viên cùng trạm dừng chân \[89].
* **Luồng hoạt động thi đấu:**

  1. **Gặp gỡ:** Tại màn hình một trạm tàu điện ngầm, học viên có thể nhìn thấy hình đại diện của những "hành khách" khác đang online tại đó \[85, 86, 90].
  2. **Lời mời thách đấu:** Người học nhấn vào avatar đối thủ để gửi lời khiêu chiến kèm mức cược điểm EXP ("Giao kèo Tất tay") \[90, 95, 96].
  3. **Vào phòng thi đấu:** Hai người chơi được Supabase Realtime ghép cặp đưa vào một phòng thoại thoại chung có sự dẫn dắt của trọng tài AI \[90, 96].
  4. **Đối đáp 1:1:** AI đưa ra bối cảnh của trạm đó, dẫn chuyện và luân phiên gọi từng người trả lời \[90, 96]. Để giữ nhịp độ căng thẳng, AI âm thầm ghi lại lỗi và không ngắt lời trong quá trình đối đáp \[91, 97].
  5. **Chấm điểm gắt gao:** Khi cuộc đối thoại kết thúc, bảng điểm điện tử xuất hiện \[91, 97]. Trọng tài AI chấm câu nói của hai bên theo 4 tiêu chí: Ngữ pháp, Từ vựng, Độ tự nhiên và Cách diễn đạt giống người bản xứ \[91, 97].
  6. **Nhận thưởng \& Sửa sai:**

     * Người thắng: Nhận toàn bộ quỹ điểm EXP đặt cược kèm hiệu ứng pháo hoa \[91, 97].
     * Người thua: Bị trừ điểm EXP (không có bảo hiểm phá sản để tăng độ khốc liệt) \[91, 97, 98]. Hệ thống gửi bản báo cáo gỡ băng phân tích lỗi sai và yêu cầu thực hành lại \[91, 97].

\---

## 4\. PHÁC THẢO CODE MẪU CHO NHÀ PHÁT TRIỂN (TECHNICAL IMPLEMENTATION)

### 4.1. Cài đặt prompt hệ thống (System Prompt) cho Groq AI

Đây là cấu trúc prompt cốt lõi giúp AI đóng vai trọng tài và gia sư, quét câu nói của học viên để trả về dữ liệu dạng stream chuẩn xác:

```text
\\\\\\\[SYSTEM INSTRUCTIONS]
Bạn là Trợ lý Gia sư Bản xứ VibeSpeak, chuyên gia phân tích ngôn ngữ hàng đầu. 
Nhiệm vụ của bạn là tiếp nhận câu nói tiếng Anh từ người dùng, đánh giá theo 4 tiêu chí: 
1. Ngữ pháp (Grammar)
2. Từ vựng (Vocabulary)
3. Độ tự nhiên (Naturalness)
4. Cách diễn đạt giống người bản xứ (VibeSpeak Native Style)

Hãy phân tích lỗi sai và trả về đúng định dạng sau để hệ thống Client (React Native) có thể parse và hiển thị hiệu ứng máy chữ phát sáng:

---
\\\\\\\[ANALYSIS]
- ORIGINAL: \\\\\\\[Câu gốc của người dùng]
- SCORE: \\\\\\\[Điểm số từ 0 - 100 dựa trên 4 tiêu chí]

\\\\\\\[UPGRADES]
- GRAMMAR\\\\\\\_OK: \\\\\\\[Phiên bản câu sửa chuẩn ngữ pháp]
- NATURAL\\\\\\\_OK: \\\\\\\[Phiên bản câu diễn đạt tự nhiên, trôi chảy]
- NATIVE\\\\\\\_STYLE: \\\\\\\[Phiên bản câu sành điệu, giống người bản xứ thường dùng nhất]

\\\\\\\[EXPLANATION]
- CHÚ THÍCH: \\\\\\\[Giải thích cực kỳ ngắn gọn, dễ hiểu dưới 30 từ về sự khác biệt tinh tế giữa các phiên bản trên để người học nắm bắt]
---

LƯU Ý: Tuyệt đối không thêm văn bản rườm rà ngoài định dạng trên. Giữ đúng cấu trúc các thẻ đầu mục để hệ thống bóc tách.
```

### 4.2. Mã nguồn React Native bắt luồng dữ liệu (Streaming API) \& Hiệu ứng Chữ Neon

Dưới đây là một component mẫu viết bằng React Native kết hợp với Expo Audio để minh họa cho tính năng **Máy Chữ Neon Đồng Bộ Âm Thanh**:

```javascript
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Audio } from 'expo-av';

export default function TypewriterNeonScreen() {
  const \\\\\\\[streamedText, setStreamedText] = useState('');
  const \\\\\\\[isStreaming, setIsStreaming] = useState(false);
  const \\\\\\\[sound, setSound] = useState(null);

  // Load âm thanh gõ máy chữ sẵn vào bộ nhớ để phát mượt mà không bị trễ
  useEffect(() => {
    return sound
      ? () => { sound.unloadAsync(); }
      : undefined;
  }, \\\\\\\[sound]);

  const playClickSound = async () => {
    const { sound: charSound } = await Audio.Sound.createAsync(
       require('./assets/sounds/typewriter\\\\\\\_click.mp3')
    );
    setSound(charSound);
    await charSound.playAsync();
  };

  const playDingSound = async () => {
    const { sound: dingSound } = await Audio.Sound.createAsync(
       require('./assets/sounds/ding\\\\\\\_complete.mp3')
    );
    setSound(dingSound);
    await dingSound.playAsync();
  };

  // Giả lập luồng dữ liệu Stream từ Groq API đổ về Client
  const startStreamingSimulation = () => {
    setStreamedText('');
    setIsStreaming(true);
    
    const sampleOutput = "GRAMMAR\\\\\\\_OK: I want to book a table for two.\\\\\\\\nNATURAL\\\\\\\_OK: I'd like to get a table for two, please.\\\\\\\\nNATIVE\\\\\\\_STYLE: Can we get a table for two?";
    let index = 0;

    const interval = setInterval(async () => {
      if (index < sampleOutput.length) {
        const char = sampleOutput\\\\\\\[index];
        setStreamedText((prev) => prev + char);
        
        // Phát âm thanh lách cách đồng bộ với từng ký tự xuất hiện
        if (char !== ' ' \\\\\\\&\\\\\\\& char !== '\\\\\\\\n') {
          await playClickSound();
        }
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        // Phát tiếng "Ding!" khi hoàn thành phân tích
        await playDingSound();
      }
    }, 120); // Khoảng thời gian gõ chữ
  };

  return (
    <View style={styles.container}>
      <Text style={styles.neonTitle}>VibeSpeak Neon Typewriter</Text>
      
      <ScrollView style={styles.terminal}>
        <Text style={styles.neonText}>{streamedText}</Text>
      </ScrollView>

      <TouchableOpacity 
        style={styles.button} 
        onPress={startStreamingSimulation}
        disabled={isStreaming}
      >
        <Text style={styles.buttonText}>START DEBRIEF REPORT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A051B', // Màu tối Cyberpunk sâu thẳm
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  neonTitle: {
    fontSize: 24,
    color: '#39FF14', // Xanh Neon lá
    fontWeight: 'bold',
    textShadowColor: '#39FF14',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginBottom: 30,
  },
  terminal: {
    width: '100%',
    height: 300,
    backgroundColor: '#120B2C',
    borderRadius: 10,
    borderColor: '#FF007F', // Hồng Neon
    borderWidth: 2,
    padding: 15,
    marginBottom: 40,
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
  },
  neonText: {
    fontFamily: 'Courier New',
    fontSize: 16,
    color: '#FF007F',
    lineHeight: 24,
    textShadowColor: '#FF007F',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  button: {
    backgroundColor: '#00FFFF', // Tím lam Neon
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
```

\---

## 5\. CHỈ SỐ ĐÁNH GIÁ CHẤT LƯỢNG TRIỂN KHAI (QUALITY GATE CRITERIA)

Để chuyên gia phần mềm nghiệm thu sản phẩm đạt độ hoàn hảo tối đa, hệ thống cần vượt qua các bài kiểm thử chất lượng sau:

1. **Độ trễ API Chấm lỗi (Latency):** Thời gian phản hồi từ lúc người dùng thu âm đến khi ký tự đầu tiên gõ lên màn hình (Time-to-First-Byte) qua Groq API phải dưới **500ms**.
2. **Tính đồng bộ của Âm thanh \& Chữ (Audio-Visual Sync):** Tiếng gõ phím phải khớp tuyệt đối với thời điểm xuất hiện của ký tự. Không bị nghẹn tiếng khi tốc độ streaming tăng cao.
3. **Kiểm tra Rò rỉ Trạng thái Phong ấn (Unsealed Integrity):** Đảm bảo rằng khi trạng thái `is\\\\\\\_sealed` của người dùng là `TRUE`, toàn bộ các API gọi thoại 1:1 sẽ trả về mã lỗi `403 Forbidden` và giao diện chuyển sang xám, loại bỏ hoàn toàn khả năng người học vượt rào không qua bài phục hồi.
4. **Tính đồng bộ cơ sở dữ liệu thời gian thực (Real-time Arena Pairing):** Thời gian tìm phòng và ghép cặp hai người dùng trong cùng một trạm tại "Đấu trường Tất Tay" tối đa là **5 giây**. Nếu quá thời gian, hệ thống tự động chuyển sang chế độ ghép đấu với "Bóng bóng ảo" (Shadow Player) của người chơi khác đã lưu từ trước để bảo vệ trải nghiệm người dùng.

\---

*Tài liệu đặc tả được xây dựng dựa trên định hướng phát triển chi tiết của VibeSpeak, tích hợp toàn bộ các ý tưởng cốt lõi và kiến trúc kỹ thuật chuẩn mực từ dữ liệu thiết kế dự án.* \[1, 2, 3, 4, 14, 15, 19, 23, 26, 28, 29, 30, 31, 33, 36, 40, 44, 50, 54, 57, 58, 59, 60, 61, 70, 71, 72, 73, 74, 81, 82, 83, 84, 85, 86, 90, 91, 95, 96, 97, 98, 126, 127, 138]

