# TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ KỊCH BẢN TRIỂN KHAI PHẦN MỀM (SRS/PRD)
## DỰ ÁN: VIBESPEAK - SIÊU ỨNG DỤNG HỌC TIẾNG ANH GIA SƯ 1:1 THỰC CHIẾN

**Slogan:** *VibeSpeak - Bắt nhịp bản xứ, Gỡ lỗi tự nhiên*  
**Phong cách nghệ thuật:** Retro Wave / Cyberpunk (Neon tím, hồng, xanh lá phát sáng, biểu tượng băng Cassette hoài cổ, máy chữ cơ và bản đồ Tàu điện ngầm hiện đại).

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

### 1.1. Triết lý Thiết kế & Định vị Sản phẩm
VibeSpeak là ứng dụng học tiếng Anh giao tiếp toàn diện dựa trên mô hình **Gia sư AI cá nhân hóa 1:1** kết hợp với cơ chế **Game hóa (Gamification) kịch tính**. Ứng dụng tập trung vào tính thực tế: biến các hoạt động thường nhật thành bài học, sửa lỗi tinh tế mà không làm đứt mạch giao tiếp, sử dụng hình phạt "Phong ấn đặc quyền" để duy trì kỷ luật và "Đấu trường Tất Tay" để thúc đẩy cạnh tranh.

### 1.2. Kiến trúc Công nghệ Khuyến nghị (Combo "Tốc Độ Ánh Sáng")
Để đạt hiệu quả tối đa về chi phí vận hành (Zero-Fee ban đầu cho nhà phát triển) và trải nghiệm thời gian thực cực nhanh:
*   **Front-end:** React Native (Expo) - Hỗ trợ đa nền tảng (iOS, Android, Web), tối ưu dựng giao diện bản đồ SVG mượt mà và các hoạt ảnh neon.
*   **Back-end & Database:** Supabase (PostgreSQL) - Đồng bộ dữ liệu thời gian thực (Real-time DB), quản lý xác thực người dùng, lưu trữ lộ trình và xử lý ghép cặp thi đấu.
*   **AI Engine:** Groq API (gọi các LLM mã nguồn mở siêu nhanh) để chấm lỗi thời gian thực, kết hợp với công nghệ nhận diện giọng nói (Speech-to-Text) tích hợp qua thư viện thiết bị (`expo-av`).

---

## 2. KIẾN TRÚC DỮ LIỆU (DATABASE SCHEMA DESIGN)

Dưới đây là cấu trúc các bảng dữ liệu trong PostgreSQL (Supabase) để chuyên gia thiết kế phần mềm cấu trúc hệ thống:

```sql
-- 1. Bảng thông tin người dùng (Users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_level_id INT, -- Liên kết tới trạm hiện tại trên bản đồ
    exp_points INT DEFAULT 0, -- Điểm kinh nghiệm tích lũy
    streak_count INT DEFAULT 0, -- Số ngày học liên tiếp
    last_active_at TIMESTAMP WITH TIME ZONE,
    is_sealed BOOLEAN DEFAULT FALSE, -- Trạng thái bị phong ấn đặc quyền
    seal_activated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Bảng quản lý Giải đấu Kỷ luật (Leagues)
CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50), -- Đồng, Bạc, Vàng, Kim Cương
    min_exp INT,
    max_exp INT
);

-- Bảng phân phòng thi đấu tuần (League_Groups) - Chứa 30 người dùng cùng trình độ
CREATE TABLE league_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id INT REFERENCES leagues(id),
    season_week INT, -- Số tuần của mùa giải
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE league_members (
    group_id UUID REFERENCES league_groups(id),
    user_id UUID REFERENCES users(id),
    weekly_exp_earned INT DEFAULT 0,
    PRIMARY KEY (group_id, user_id)
);

-- 3. Bảng Lộ trình Bản đồ Tàu điện ngầm (Metro_Lines & Stations)
CREATE TABLE metro_lines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100), -- Tuyến Xanh Lá (Đời sống), Tuyến Đỏ (Công sở)
    color_code VARCHAR(7) -- Mã hex neon ví dụ #00FF00
);

CREATE TABLE metro_stations (
    id SERIAL PRIMARY KEY,
    line_id INT REFERENCES metro_lines(id),
    name VARCHAR(100), -- Trạm Quán Cafe, Trạm Sân Bay, Trạm Phỏng Vấn
    station_order INT, -- Thứ tự trạm trên tuyến
    scenario_description TEXT, -- Mô tả bối cảnh giao tiếp
    is_hub BOOLEAN DEFAULT FALSE, -- Trạm trung chuyển (Sự kiện đánh giá định kỳ)
    required_exp INT DEFAULT 0
);

-- 4. Bảng Tiến độ người học tại các Trạm (User_Station_Progress)
CREATE TABLE user_station_progress (
    user_id UUID REFERENCES users(id),
    station_id INT REFERENCES metro_stations(id),
    is_completed BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2), -- Điểm đánh giá cao nhất đạt được tại trạm này
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, station_id)
);

-- 5. Bảng Kho giao diện cuộn băng (Mixtape_Skins)
CREATE TABLE mixtape_skins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100), -- Băng "Kỷ Luật Thép", Băng "Bản Xứ Thực Thụ", v.v.
    skin_type VARCHAR(50), -- neon, bronze, gold, armored
    visual_assets_json JSON, -- Chứa đường dẫn ảnh, màu nền, hiệu ứng lấp lánh
    sfx_assets_json JSON -- Chứa đường dẫn âm thanh (nhạc nền lofi, ding, click)
);

CREATE TABLE user_skins (
    user_id UUID REFERENCES users(id),
    skin_id INT REFERENCES mixtape_skins(id),
    is_equipped BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skin_id)
);

-- 6. Bảng Nhật ký lỗi sai của người học (User_Error_Logs)
CREATE TABLE user_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    original_text TEXT NOT NULL, -- Câu nói bị lỗi của người dùng
    corrected_grammar TEXT, -- Thẻ 1
    corrected_natural TEXT, -- Thẻ 2
    corrected_native TEXT, -- Thẻ 3
    explanation TEXT, -- Lời giải thích ngắn
    error_category VARCHAR(50), -- Ngữ pháp, Từ vựng, Phát âm, Độ tự nhiên
    is_resolved BOOLEAN DEFAULT FALSE, -- Đã khắc phục trong bài tập hàng tuần chưa
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. KỊCH BẢN CHI TIẾT CÁC LUỒNG HOẠT ĐỘNG (DETAILED FEATURE FLOWS)

### Tính năng 1: Khảo thí và Đánh giá đầu vào (Pocket Test Center)
*   **Mục tiêu:** Xác định chính xác trình độ ban đầu của học viên qua 5 kỹ năng: Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu và Giao tiếp để lập lộ trình học mà không tạo áp lực.
*   **Luồng hoạt động của Hệ thống:**
    1.  **Bước khởi đầu:** Hệ thống hiển thị giao diện "Khảo thí đầu vào". Bài kiểm tra ngắn gọn, thích ứng (Adaptive) liên tục thay đổi độ khó dựa trên câu trả lời trước đó của người học [9].
    2.  **Nguyên tắc công bằng:** Tuyệt đối không hiển thị đáp án đúng/sai hoặc kết quả chi tiết cho đến khi người học hoàn thành toàn bộ bài test để đảm bảo tính khách quan [12, 13].
    3.  **Xử lý phía AI:** Sau khi bài kiểm tra kết thúc, dữ liệu câu trả lời được gửi tới Core AI Engine. AI tiến hành phân tích lỗi sai và xác định mức điểm quy đổi cho từng kỹ năng [13].
    4.  **Tạo lộ trình cá nhân hóa (Roadmap):** Dựa trên mục tiêu (ví dụ: giao tiếp công sở, du lịch) và thời gian rảnh mỗi ngày mà người dùng thiết lập, hệ thống tự động sinh ra một lộ trình học ngôn ngữ chia thành từng giai đoạn rõ ràng [13]. Lộ trình này ưu tiên dạy và thực hành các mẫu câu có tần suất sử dụng cao nhất trong giao tiếp thực tế [13].

---

### Tính năng 2: Bản đồ Tàu điện ngầm tương tác (Subway Map UI/UX)
*   **Mục tiêu:** Trực quan hóa lộ trình học dưới dạng mạng lưới tàu điện ngầm hiện đại, tạo cảm giác phiêu lưu và tiến bộ từng chặng [81, 82].
*   **Đặc tả chi tiết:**
    1.  **Giao diện chính (Subway Map Interface):** Bản đồ động gồm nhiều tuyến tàu màu neon khác nhau [81, 82]:
        *   *Tuyến Xanh Lá:* Đời sống thường ngày (Quán Cafe, Sân bay, Siêu thị...) [82, 83].
        *   *Tuyến Đỏ:* Công sở & Kinh doanh (Phỏng vấn, Thuyết trình, Đàm phán...) [82, 83].
    2.  **Trạm Dừng Tình Huống (Scenario Stations):** Mỗi trạm đại diện cho một bối cảnh giao tiếp [83]. Người học chạm vào trạm để kích hoạt buổi học.
    3.  **Cơ chế Vé Tàu Kỷ Luật (Subway Pass):** Hệ thống cửa xoay tại trạm sẽ bị khóa [84, 85]. Học viên chỉ được bấm đi tiếp trạm mới khi hoàn thành trọn vẹn quy trình học của trạm hiện tại theo quy trình chuẩn 1:1 [14, 84, 85]:
        *   *Bước 1: Khởi động (Warm-up)* -> AI tự động tổ chức ôn tập kiến thức cũ [14].
        *   *Bước 2: Tiếp thu (Ingest)* -> Giới thiệu kiến thức mới ngắn gọn kèm ví dụ [14].
        *   *Bước 3: Luyện tập (Practice)* -> Luyện nói/viết và sửa lỗi tức thì [14].
        *   *Bước 4: Kết thúc (Wrap-up)* -> Kiểm tra nhanh cuối buổi và giao bài tập [14].
    4.  **Trạm Trung Chuyển Lớn (Hub Stations) & Hội Nghị Định Vị Tương Lai:**
        *   Nằm tại giao lộ giữa các tuyến tàu [83]. Đây là cột mốc kết thúc một cấp độ (Boss fight) [74, 83].
        *   Khi đến Hub, sự kiện **Hội Nghị Định Vị Tương Lai** kích hoạt [70, 83]. Người học phải tham gia một bài kiểm tra nhập vai tổng hợp độ khó cao [70].
        *   AI phân tích dữ liệu tích lũy từ các trạm đã qua để xuất bản báo cáo mạng nhện trực quan (Visual Skill Map), chỉ rõ kỹ năng đã cải thiện và nguyên nhân của những điểm còn yếu [10, 70].
        *   Nếu vượt qua, màn hình bùng nổ pháo hoa và trao tặng **Cuộn băng Cassette cực hiếm** [71, 72]. Hệ thống tự động căn chỉnh và tái thiết lộ trình tối ưu cho tuyến tàu tiếp theo [71, 73].

---

### Tính năng 3: Chế độ "Gỡ Băng Ghi Âm" hoài cổ và Sửa lỗi 4 Tiêu chí
*   **Mục tiêu:** Tạo trải nghiệm thú vị khi sửa lỗi, xua tan áp lực tâm lý bằng phong cách retro [53, 57].
*   **Quy trình Hoạt động của Chế độ "Gỡ Băng" (Debrief Report) [57]:**
    1.  **Hội thoại không gián đoạn:** Trong quá trình luyện nói 1:1 tại các trạm, AI đóng vai người bản xứ nói chuyện tự nhiên [40, 50, 69]. Để giữ mạch cảm xúc, AI không ngắt lời hay sửa lỗi ngay mà âm thầm ghi lại âm thanh và văn bản của học viên vào "Sổ tay gia sư" [40, 50].
    2.  **Hiệu ứng chuyển cảnh Retro:** Ngay khi cuộc gọi kết thúc, màn hình chuyển sang giao diện máy cassette cổ điển [57, 58]. Âm thanh tiếng cúp máy "Click!" vang lên kết hợp tiếng rít tua băng "Rè rè" [54, 57, 58].
    3.  **Vinh danh bằng đèn phát sáng:** Máy bắt đầu phát lại chính giọng nói của người dùng [58]. Đối với những từ/cụm từ phát âm chuẩn xác, một bóng đèn xanh lá trên máy cassette sẽ nháy sáng kèm tiếng "Ding!" trong trẻo [54, 58].
    4.  **Phân tích lỗi sai bằng máy chữ (Typewriter Effect):** Tại những câu có lỗi sai, băng cassette dừng lại [59]. Tiếng gõ bàn phím lách cách vang lên, màn hình tự động hiển thị hiệu ứng "in" ra 3 phiên bản câu nâng cấp theo thời gian thực (Streaming) [54, 59]:
        *   *Thẻ 1:* **Đúng Ngữ Pháp (Grammatically Correct)** [44, 59].
        *   *Thẻ 2:* **Giao Tiếp Tự Nhiên (Natural Conversation)** [44, 59].
        *   *Thẻ 3:* **Chuẩn Bản Xứ (VibeSpeak Native)** [44, 59].
        *   *Phần Giải Thích:* Một đoạn text ngắn phân tích sắc thái ngữ nghĩa của 3 phiên bản dưới hiệu ứng chữ phát sáng Neon [44, 59, 138].
    5.  **Nút Thực Hành Lại:** Micro nhấp nháy đỏ, người dùng nhấn giữ để thu âm nói lại câu chuẩn cho đến khi thành thạo [59, 60].

---

### Tính năng 4: Cơ chế "Game hóa" & Kỷ luật thép (League & Penalty)
*   **Mục tiêu:** Tạo động lực bền bỉ và nỗi sợ mất mát (FOMO) tích cực để duy trì thói quen học tập hàng ngày [15, 25].
*   **Đặc tả chi tiết:**
    1.  **Giải Đấu Kỷ Luật (Ranked Leagues):**
        *   Học viên được xếp vào các League (Đồng, Bạc, Vàng, Kim Cương), mỗi bảng có 30 đối thủ cùng trình độ [19].
        *   Điểm leo hạng được cộng dồn dựa trên độ kỷ luật hoàn thành lộ trình hàng ngày [19, 23]. Điểm tối đa chỉ được cộng khi hoàn thành trọn vẹn quy trình 4 bước tại trạm học [19, 23].
        *   **Phần thưởng:** Mở khóa các đặc quyền trong ứng dụng như kịch bản hội thoại 1:1 độc quyền, bối cảnh nâng cao hoặc các giao diện cuộn băng cassette cực đẹp (Mixtape Skins) [23, 24, 60, 61].
    2.  **Hình phạt Phong Ấn Đặc Quyền (Privilege Sealing):**
        *   Nếu người học bỏ học từ 2 ngày liên tiếp trở lên, hệ thống tự động kích hoạt trạng thái "Phong ấn" [28, 29].
        *   **Hậu quả hình phạt:** Điểm xếp hạng bị trừ nặng [29]. Toàn bộ các tính năng cao cấp đã cày cuốc mở khóa, đặc biệt là chế độ luyện hội thoại 1:1 với AI sẽ bị khóa lại và hiển thị dưới dạng màu xám xịt [28, 29, 30, 37]. Một biểu tượng đám mây đen hoặc ổ khóa xuất hiện cạnh tên trên bảng xếp hạng [31, 37].
    3.  **Lời Cảnh Báo Khẩn Cấp Từ Gia Sư:**
        *   Trước giờ G khóa tính năng (ví dụ: 12 tiếng, 6 tiếng, 1 tiếng trước khi phong ấn), hệ thống gửi thông báo push mô phỏng giọng điệu gia sư hối thúc [33, 36]:
          > *"Trợ lý Gia sư đây! Tôi đã chuẩn bị bài học hôm nay nhưng chưa thấy bạn. Chỉ còn 1 tiếng nữa là tiến độ của chúng ta gãy đoạn, và tôi buộc phải phong ấn chế độ luyện nói 1:1 đấy! ⏳"* [36]
    4.  **Thử thách "Giải Ấn" Khắc Nghiệt:**
        *   Để khôi phục đặc quyền, học viên không thể học qua loa [30]. Họ buộc phải thực hiện một "Bài kiểm tra phục hồi" (Restore Test) [30].
        *   Gia sư AI sẽ yêu cầu học viên nói lại các câu cốt lõi của phần kiến thức đã bỏ lỡ và chấm điểm cực kỳ khắt khe dựa trên 4 tiêu chí [30]. Chỉ khi đạt điểm yêu cầu, xích phong ấn mới bị phá vỡ, khôi phục lại đặc quyền và thứ hạng cũ [31, 38].

---

### Tính năng 5: Đấu Trường "Tất Tay" (All-In Arena)
*   **Mục tiêu:** Thổi bùng tinh thần cạnh tranh giao tiếp trực diện giữa các học viên cùng trạm dừng chân [89].
*   **Luồng hoạt động thi đấu:**
    1.  **Gặp gỡ:** Tại màn hình một trạm tàu điện ngầm, học viên có thể nhìn thấy hình đại diện của những "hành khách" khác đang online tại đó [85, 86, 90].
    2.  **Lời mời thách đấu:** Người học nhấn vào avatar đối thủ để gửi lời khiêu chiến kèm mức cược điểm EXP ("Giao kèo Tất tay") [90, 95, 96].
    3.  **Vào phòng thi đấu:** Hai người chơi được Supabase Realtime ghép cặp đưa vào một phòng thoại thoại chung có sự dẫn dắt của trọng tài AI [90, 96].
    4.  **Đối đáp 1:1:** AI đưa ra bối cảnh của trạm đó, dẫn chuyện và luân phiên gọi từng người trả lời [90, 96]. Để giữ nhịp độ căng thẳng, AI âm thầm ghi lại lỗi và không ngắt lời trong quá trình đối đáp [91, 97].
    5.  **Chấm điểm gắt gao:** Khi cuộc đối thoại kết thúc, bảng điểm điện tử xuất hiện [91, 97]. Trọng tài AI chấm câu nói của hai bên theo 4 tiêu chí: Ngữ pháp, Từ vựng, Độ tự nhiên và Cách diễn đạt giống người bản xứ [91, 97].
    6.  **Nhận thưởng & Sửa sai:** 
        *   Người thắng: Nhận toàn bộ quỹ điểm EXP đặt cược kèm hiệu ứng pháo hoa [91, 97].
        *   Người thua: Bị trừ điểm EXP (không có bảo hiểm phá sản để tăng độ khốc liệt) [91, 97, 98]. Hệ thống gửi bản báo cáo gỡ băng phân tích lỗi sai và yêu cầu thực hành lại [91, 97].

---

## 4. PHÁC THẢO CODE MẪU CHO NHÀ PHÁT TRIỂN (TECHNICAL IMPLEMENTATION)

### 4.1. Cài đặt prompt hệ thống (System Prompt) cho Groq AI
Đây là cấu trúc prompt cốt lõi giúp AI đóng vai trọng tài và gia sư, quét câu nói của học viên để trả về dữ liệu dạng stream chuẩn xác:

```text
[SYSTEM INSTRUCTIONS]
Bạn là Trợ lý Gia sư Bản xứ VibeSpeak, chuyên gia phân tích ngôn ngữ hàng đầu. 
Nhiệm vụ của bạn là tiếp nhận câu nói tiếng Anh từ người dùng, đánh giá theo 4 tiêu chí: 
1. Ngữ pháp (Grammar)
2. Từ vựng (Vocabulary)
3. Độ tự nhiên (Naturalness)
4. Cách diễn đạt giống người bản xứ (VibeSpeak Native Style)

Hãy phân tích lỗi sai và trả về đúng định dạng sau để hệ thống Client (React Native) có thể parse và hiển thị hiệu ứng máy chữ phát sáng:

---
[ANALYSIS]
- ORIGINAL: [Câu gốc của người dùng]
- SCORE: [Điểm số từ 0 - 100 dựa trên 4 tiêu chí]

[UPGRADES]
- GRAMMAR_OK: [Phiên bản câu sửa chuẩn ngữ pháp]
- NATURAL_OK: [Phiên bản câu diễn đạt tự nhiên, trôi chảy]
- NATIVE_STYLE: [Phiên bản câu sành điệu, giống người bản xứ thường dùng nhất]

[EXPLANATION]
- CHÚ THÍCH: [Giải thích cực kỳ ngắn gọn, dễ hiểu dưới 30 từ về sự khác biệt tinh tế giữa các phiên bản trên để người học nắm bắt]
---

LƯU Ý: Tuyệt đối không thêm văn bản rườm rà ngoài định dạng trên. Giữ đúng cấu trúc các thẻ đầu mục để hệ thống bóc tách.
```

### 4.2. Mã nguồn React Native bắt luồng dữ liệu (Streaming API) & Giải pháp Đồng bộ Âm thanh độ trễ bằng 0
Để giải quyết triệt để vấn đề độ trễ âm thanh (audio latency) trên thiết bị di động khi gõ chữ theo luồng streaming từ AI, nhà phát triển cần tuân thủ 3 nguyên tắc tối ưu hóa Native:
1. **Pre-loading (Tải trước âm thanh):** Chỉ load file âm thanh (`typewriter_click.mp3`) vào bộ đệm RAM duy nhất một lần khi khởi tạo component (`useEffect`).
2. **Re-play/Seek-to-zero (Tua nhanh về 0):** Khi gõ chữ nhanh (80ms - 120ms/ký tự), thay vì giải phóng và tạo lại đối tượng âm thanh, ta chỉ cần đưa con trỏ phát nhạc về thời điểm đầu tiên (`setPositionAsync(0)`) và phát đè lên lập tức (`playAsync()`).
3. **Space/Newline Skipping (Bỏ qua khoảng trắng):** Khi gặp ký tự khoảng trắng hoặc xuống dòng, hệ thống không phát tiếng click để tạo nhịp gõ chân thực.

#### Hai Phương án Triển khai Âm thanh Đồng bộ:

##### PHƯƠNG ÁN A: Phát kích hoạt theo từng ký tự độc lập (Tối ưu cho câu ngắn, đàm thoại nhanh)
Dưới đây là một component React Native (Expo) hoàn chỉnh, trực quan sử dụng cơ chế tua nhanh và phát đè bằng `expo-av` để đạt độ trễ gần như bằng 0:

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Audio } from 'expo-av';

export default function TypewriterNeonScreen() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const clickSoundRef = useRef(null);
  const dingSoundRef = useRef(null);

  // 1. Tải trước toàn bộ âm thanh vào RAM khi vào màn hình (Pre-loading)
  useEffect(() => {
    async function loadResources() {
      try {
        // Cấu hình audio ở mức hệ thống để giảm thiểu tối đa độ trễ
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldRouteThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });

        const { sound: clickSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/typewriter_click.mp3'),
          { shouldPlay: false, volume: 0.5 }
        );
        clickSoundRef.current = clickSound;

        const { sound: dingSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/ding_complete.mp3'),
          { shouldPlay: false, volume: 0.6 }
        );
        dingSoundRef.current = dingSound;
      } catch (err) {
        console.warn("Lỗi tải tài nguyên âm thanh:", err);
      }
    }
    loadResources();

    // Giải phóng bộ nhớ RAM khi hủy màn hình
    return () => {
      if (clickSoundRef.current) clickSoundRef.current.unloadAsync();
      if (dingSoundRef.current) dingSoundRef.current.unloadAsync();
    };
  }, []);

  // 2. Phát tiếng click tức thì bằng phương pháp tua nhanh về 0 (Seek-to-zero)
  const triggerClickSFX = async () => {
    if (clickSoundRef.current) {
      try {
        await clickSoundRef.current.setPositionAsync(0); // Đưa về 0ms ngay lập tức
        await clickSoundRef.current.playAsync(); // Phát đè lên
      } catch (err) {
        // Bỏ qua lỗi bất đồng bộ khi bấm quá nhanh
      }
    }
  };

  const triggerDingSFX = async () => {
    if (dingSoundRef.current) {
      try {
        await dingSoundRef.current.setPositionAsync(0);
        await dingSoundRef.current.playAsync();
      } catch (err) {}
    }
  };

  // 3. Giả lập luồng dữ liệu Stream từ Groq AI đổ về Client
  const startStreamingSimulation = () => {
    setStreamedText('');
    setIsStreaming(true);
    
    const sampleOutput = "GRAMMAR_OK: I want to book a table for two.\nNATURAL_OK: I'd like to get a table for two, please.\nNATIVE_STYLE: Can we get a table for two?";
    let index = 0;

    const interval = setInterval(async () => {
      if (index < sampleOutput.length) {
        const char = sampleOutput[index];
        setStreamedText((prev) => prev + char);
        
        // Chỉ phát âm thanh gõ phím nếu ký tự KHÔNG phải là khoảng trắng hoặc xuống dòng
        if (char !== ' ' && char !== '\n') {
          await triggerClickSFX();
        }
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        await triggerDingSFX(); // Tiếng "Ding!" vinh danh khi hoàn thành báo cáo gỡ băng
      }
    }, 100); // Tốc độ gõ 100ms/ký tự
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

##### PHƯƠNG ÁN B: Sử dụng Vòng lặp Âm thanh tự động (Tối ưu cho văn bản phân tích dài)
Khi AI trả về những đoạn giải thích ngữ nghĩa dài hàng trăm chữ, việc gọi hàng nghìn sự kiện phát âm độc lập sẽ gây quá tải phần cứng trên thiết bị yếu.

*Giải pháp:* Chuẩn bị một tệp âm thanh `.mp3` tiếng máy gõ chữ liên tục dài 5-10 giây có nhịp nghỉ tự nhiên. Khi AI bắt đầu streaming chữ, ta phát âm thanh này ở chế độ lặp lại (`isLooping: true`). Khi kết thúc dòng chữ cuối cùng từ AI, ta dừng phát nhạc ngay lập tức.

**Đoạn mã cấu trúc vòng lặp lofi gõ máy chữ:**
```javascript
const loopSoundRef = useRef(null);

// Khởi tạo tải âm thanh vòng lặp
const loadLoopingSound = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('./assets/sounds/continuous_typewriter_loop.mp3'),
    { isLooping: true, volume: 0.4 }
  );
  loopSoundRef.current = sound;
};

// Kích hoạt khi bắt đầu đổ dữ liệu streaming từ Groq AI
const onStartStreaming = async () => {
  if (loopSoundRef.current) {
    await loopSoundRef.current.playAsync();
  }
};

// Kích hoạt khi kết thúc hoàn toàn quá trình nhận chữ
const onEndStreaming = async () => {
  if (loopSoundRef.current) {
    await loopSoundRef.current.stopAsync(); // Dừng tiếng gõ máy chữ
    await triggerDingSFX(); // Tiếng "Ding!" trong trẻo báo hiệu hoàn tất
  }
};
```

---

### 4.3. Chỉ dẫn Kỹ thuật Tối ưu hóa dung lượng (SFX Asset Optimization)
Để đảm bảo trải nghiệm đồng bộ hoàn hảo không trễ nhịp và giảm kích thước tệp ứng dụng:
1. **Thông số File nén:** Các tệp `.mp3` hoặc `.wav` cho click SFX nên được nén ở tần số lấy mẫu (sample rate) **22.05 kHz**, độ sâu bit (bit depth) **16-bit Mono** để dung lượng file tối đa **dưới 20KB**, giúp nạp tức thì vào bộ nhớ đệm RAM mà không hao tổn pin của thiết bị.
2. **Giải pháp thay thế nâng cao:** Trên môi trường Android, nếu `expo-av` gặp hiện tượng trễ cục bộ do phần cứng hệ điều hành, lập trình viên nên chuyển sang thư viện `react-native-sound` để gọi trực tiếp các API điều khiển âm thanh cấp thấp của phần cứng, bỏ qua các tầng trung gian ảo hóa.


### 4.4. Mã nguồn React Native tạo Hiệu ứng Cuộn Băng Cassette Xoay Vòng (Spinning Tape Reels Animation)
Để hoàn thiện trải nghiệm thẩm mỹ hoài cổ Cyberpunk của chế độ **"Gỡ Băng Ghi Âm"**, giao diện cần hiển thị hình ảnh cuộn băng cassette vật lý với hai trục xoay (Spinning Reels) vận hành mượt mà theo trạng thái phát lại giọng nói của người học. 

Dưới đây là mã nguồn component React Native (Expo) hoàn chỉnh, sử dụng thư viện `Animated` tích hợp sẵn nhằm tối ưu hiệu năng đồ họa trực tiếp ở tầng phần cứng (Native Driver), không gây giảm khung hình (drop frames) của ứng dụng:

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, TouchableOpacity, Text } from 'react-native';

export function CassetteTapeAnimation({ isPlayingAudio }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Quản lý trạng thái quay của trục băng dựa trên tín hiệu phát âm thanh
  useEffect(() => {
    let animation;
    if (isPlayingAudio) {
      // Thiết lập vòng lặp xoay tròn vô tận mượt mà
      animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000, // 3 giây hoàn thành 1 vòng quay tự nhiên
          easing: Easing.linear,
          useNativeDriver: true, // Sử dụng Native Driver để giải phóng CPU của luồng Javascript
        })
      );
      animation.start();
    } else {
      if (animation) animation.stop();
      spinAnim.setValue(0); // Đưa trục về vị trí tĩnh khi dừng phát
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isPlayingAudio]);

  // Ánh xạ (Interpolate) giá trị từ 0 -> 1 sang góc quay 0deg -> 360deg
  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.cassetteContainer}>
      {/* Vỏ băng cassette phong cách Retro Wave */}
      <View style={styles.tapeBody}>
        {/* Nhãn dán thông tin băng */}
        <View style={styles.labelArea}>
          <Text style={styles.labelText}>VIBESPEAK • DEBRIEF MIXTAPE</Text>
          <View style={styles.labelSubLine} />
        </View>

        {/* Cửa sổ mờ nhìn dải băng bên trong */}
        <View style={styles.windowArea}>
          {/* Trục băng trái (Left Reel) */}
          <Animated.View style={[styles.reel, { transform: [{ rotate: spinRotate }] }]}>
            <View style={styles.hub}>
              <View style={styles.hubTeeth} />
              <View style={[styles.hubTeeth, { transform: [{ rotate: '45deg' }] }]} />
              <View style={[styles.hubTeeth, { transform: [{ rotate: '90deg' }] }]} />
              <View style={[styles.hubTeeth, { transform: [{ rotate: '135deg' }] }]} />
              <View style={styles.centerHole} />
            </View>
          </Animated.View>

          {/* Dải băng từ liên kết (Magnetic Tape Bridge) */}
          <View style={styles.magneticTapeBridge} />

          {/* Trục băng phải (Right Reel) */}
          <Animated.View style={[styles.reel, { transform: [{ rotate: spinRotate }] }]}>
            <View style={styles.hub}>
              <View style={styles.hubTeeth} />
              <View style={[styles.hubTeeth, { transform: [{ rotate: '45deg' }] }]} />
              <View style={[styles.hubTeeth, { transform: [{ rotate: '90deg' }] }]} />
              <View style={[styles.hubTeeth, { transform: [{ rotate: '135deg' }] }]} />
              <View style={styles.centerHole} />
            </View>
          </Animated.View>
        </View>

        {/* Lỗ hở kỹ thuật chân băng cassette */}
        <View style={styles.trapezoidBottom}>
          <View style={styles.trapezoidHole} />
          <View style={styles.trapezoidHole} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cassetteContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  tapeBody: {
    width: 280,
    height: 160,
    backgroundColor: '#120B2C', // Màu tím Cyberpunk sâu thẳm
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FF007F', // Viền Hot Pink phát sáng rực rỡ
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    shadowOpacity: 0.8,
  },
  labelArea: {
    width: '100%',
    height: 35,
    backgroundColor: '#39FF14', // Màu nhãn Acid Green Neon tương phản mạnh
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  labelText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'extrabold',
    fontFamily: 'Courier New',
    letterSpacing: 1,
  },
  labelSubLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#000',
    marginTop: 2,
  },
  windowArea: {
    width: '85%',
    height: 65,
    backgroundColor: '#070314', // Kính mờ của hộc băng
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00FFFF', // Viền lam Cyan neon phát sáng
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 15,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
  },
  reel: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#39FF14', // Vòng răng xích xanh neon phát sáng
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
  },
  hub: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  hubTeeth: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#120B2C', // Răng khía xích gài trục quay
  },
  centerHole: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#070314', // Lỗ tròn đen rỗng ở tâm
    borderWidth: 1,
    borderColor: '#120B2C',
    zIndex: 10,
  },
  magneticTapeBridge: {
    position: 'absolute',
    width: 120,
    height: 6,
    backgroundColor: '#3D2F28', // Cáp dải băng từ chuyển động ngang phía sau
    top: '45%',
    left: '28%',
    zIndex: -1,
  },
  trapezoidBottom: {
    width: 120,
    height: 15,
    backgroundColor: '#1E143B',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  trapezoidHole: {
    width: 12,
    height: 6,
    backgroundColor: '#070314',
    borderRadius: 2,
  }
});
```

---


### 4.5. Mã nguồn & Thuật toán mô phỏng "Băng Từ Co Giãn" (Magnetic Tape Thickness Indicator)

Để nâng cấp tối đa mức độ hoàn thiện đồ họa của màn hình phát băng Cassette, hệ thống không chỉ xoay hai trục băng mà còn phải mô phỏng chân thực lượng băng từ chuyển động từ trục này sang trục kia. Khi bắt đầu phát, trục trái đầy băng (băng dày), trục phải trống băng (băng mỏng). Khi phát về cuối, trục trái mỏng đi và trục phải dày lên [58].

#### Giải pháp Kỹ thuật & Công thức Toán học:
Tổng diện tích dải băng trên hai trục luôn không đổi:
$$S_{total} = S_{trái} + S_{phải}$$
Với bán kính phần lõi nhựa trục quay là $r_{hub}$ và bán kính ngoài cùng của cuộn băng là $R_{max}$:
- Bán kính cuộn băng bên trái tại tiến độ $p \in [0, 1]$:
  $$R_{left}(p) = \sqrt{R_{max}^2 - (R_{max}^2 - r_{hub}^2) 	imes p}$$
- Bán kính cuộn băng bên phải tại tiến độ $p \in [0, 1]$:
  $$R_{right}(p) = \sqrt{r_{hub}^2 + (R_{max}^2 - r_{hub}^2) 	imes p}$$

Dưới đây là mã nguồn React Native sử dụng `Animated.interpolate` để tính toán động và hiển thị sự thay đổi độ dày của hai cuộn băng từ bằng cách thay đổi kích thước (`width`, `height`, `borderRadius`) của vòng đệm dải băng màu nâu đậm nằm sau hai trục quay màu trắng:

```javascript
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Easing, Text } from 'react-native';

export function CassetteWithTapeThickness({ isPlaying, progress }) {
  // progress là giá trị từ 0.0 (đầu băng) đến 1.0 (cuối băng) do Audio Player cung cấp
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Đồng bộ giá trị tiến độ âm thanh động
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300, // Cập nhật mượt mà khi tiến độ thay đổi
      useNativeDriver: false, // Phải đặt false vì ta thay đổi width/height/borderRadius (layout properties)
    }).start();
  }, [progress]);

  // Quản lý hoạt ảnh xoay trục băng
  useEffect(() => {
    let rotation;
    if (isPlaying) {
      rotation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true, // Xoay sử dụng Native Driver mượt mà
        })
      );
      rotation.start();
    } else {
      if (rotation) rotation.stop();
    }
    return () => {
      if (rotation) rotation.stop();
    };
  }, [isPlaying]);

  // Định nghĩa các hằng số kích thước
  const HUB_SIZE = 44; // Bán kính r_hub = 22
  const MAX_TAPE_SIZE = 90; // Bán kính R_max = 45

  // Tính toán nội suy bán kính ngoài cuộn băng bên trái (Từ tối đa về tối thiểu)
  const leftTapeSize = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MAX_TAPE_SIZE, HUB_SIZE],
  });

  const leftTapeRadius = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MAX_TAPE_SIZE / 2, HUB_SIZE / 2],
  });

  // Tính toán nội suy bán kính ngoài cuộn băng bên phải (Từ tối thiểu lên tối đa)
  const rightTapeSize = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [HUB_SIZE, MAX_TAPE_SIZE],
  });

  const rightTapeRadius = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [HUB_SIZE / 2, MAX_TAPE_SIZE / 2],
  });

  // Ánh xạ góc xoay trục
  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.cassetteContainer}>
      <View style={styles.tapeBody}>
        <View style={styles.labelArea}>
          <Text style={styles.labelText}>VIBESPEAK • SMART RECOVERY DECK</Text>
        </View>

        {/* Cửa sổ băng mờ tích hợp hiệu ứng dải băng co giãn */}
        <View style={styles.windowArea}>
          
          {/* TRỤC QUAY BÊN TRÁI + CUỘN BĂNG TỪ CO GIÃN */}
          <View style={styles.reelWrapper}>
            {/* Cuộn băng từ màu nâu đậm dầy/mỏng động */}
            <Animated.View 
              style={[
                styles.magneticTapeRoll, 
                { 
                  width: leftTapeSize, 
                  height: leftTapeSize, 
                  borderRadius: leftTapeRadius 
                }
              ]} 
            />
            {/* Trục nhựa trắng xoay tròn */}
            <Animated.View style={[styles.reel, { transform: [{ rotate: spinRotate }] }]}>
              <View style={styles.hub}>
                <View style={styles.hubTeeth} />
                <View style={[styles.hubTeeth, { transform: [{ rotate: '45deg' }] }]} />
                <View style={[styles.hubTeeth, { transform: [{ rotate: '90deg' }] }]} />
                <View style={[styles.hubTeeth, { transform: [{ rotate: '135deg' }] }]} />
                <View style={styles.centerHole} />
              </View>
            </Animated.View>
          </View>

          {/* Dải băng kết nối (Magnetic Tape Bridge) */}
          <View style={styles.magneticTapeBridge} />

          {/* TRỤC QUAY BÊN PHẢI + CUỘN BĂNG TỪ CO GIÃN */}
          <View style={styles.reelWrapper}>
            {/* Cuộn băng từ màu nâu đậm dầy/mỏng động */}
            <Animated.View 
              style={[
                styles.magneticTapeRoll, 
                { 
                  width: rightTapeSize, 
                  height: rightTapeSize, 
                  borderRadius: rightTapeRadius 
                }
              ]} 
            />
            {/* Trục nhựa trắng xoay tròn */}
            <Animated.View style={[styles.reel, { transform: [{ rotate: spinRotate }] }]}>
              <View style={styles.hub}>
                <View style={styles.hubTeeth} />
                <View style={[styles.hubTeeth, { transform: [{ rotate: '45deg' }] }]} />
                <View style={[styles.hubTeeth, { transform: [{ rotate: '90deg' }] }]} />
                <View style={[styles.hubTeeth, { transform: [{ rotate: '135deg' }] }]} />
                <View style={styles.centerHole} />
              </View>
            </Animated.View>
          </View>

        </View>

        <View style={styles.trapezoidBottom}>
          <View style={styles.trapezoidHole} />
          <View style={styles.trapezoidHole} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cassetteContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  tapeBody: {
    width: 290,
    height: 165,
    backgroundColor: '#0F0926',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FF007F',
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelArea: {
    width: '100%',
    height: 32,
    backgroundColor: '#39FF14',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'Courier New',
  },
  windowArea: {
    width: '90%',
    height: 75,
    backgroundColor: '#05020F',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00FFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  reelWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  magneticTapeRoll: {
    position: 'absolute',
    backgroundColor: '#3D2F28', // Màu dải băng từ nâu sẫm
    borderColor: '#261C16',
    borderWidth: 1,
    zIndex: 1,
  },
  reel: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#39FF14',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Đảm bảo trục nhựa trắng nằm đè lên dải băng từ nâu
  },
  hub: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hubTeeth: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#120B2C',
  },
  centerHole: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#05020F',
  },
  magneticTapeBridge: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#3D2F28',
    top: '50%',
    left: 20,
    zIndex: 0,
  },
  trapezoidBottom: {
    width: 120,
    height: 15,
    backgroundColor: '#1E143B',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  trapezoidHole: {
    width: 12,
    height: 6,
    backgroundColor: '#05020F',
    borderRadius: 2,
  }
});
```

---
## 5. CHỈ SỐ ĐÁNH GIÁ CHẤT LƯỢNG TRIỂN KHAI (QUALITY GATE CRITERIA)

Để chuyên gia phần mềm nghiệm thu sản phẩm đạt độ hoàn hảo tối đa, hệ thống cần vượt qua các bài kiểm thử chất lượng sau:
1.  **Độ trễ API Chấm lỗi (Latency):** Thời gian phản hồi từ lúc người dùng thu âm đến khi ký tự đầu tiên gõ lên màn hình (Time-to-First-Byte) qua Groq API phải dưới **500ms**.
2.  **Tính đồng bộ của Âm thanh & Chữ (Audio-Visual Sync):** Tiếng gõ phím phải khớp tuyệt đối với thời điểm xuất hiện của ký tự. Không bị nghẹn tiếng khi tốc độ streaming tăng cao.
3.  **Kiểm tra Rò rỉ Trạng thái Phong ấn (Unsealed Integrity):** Đảm bảo rằng khi trạng thái `is_sealed` của người dùng là `TRUE`, toàn bộ các API gọi thoại 1:1 sẽ trả về mã lỗi `403 Forbidden` và giao diện chuyển sang xám, loại bỏ hoàn toàn khả năng người học vượt rào không qua bài phục hồi.
4.  **Tính đồng bộ cơ sở dữ liệu thời gian thực (Real-time Arena Pairing):** Thời gian tìm phòng và ghép cặp hai người dùng trong cùng một trạm tại "Đấu trường Tất Tay" tối đa là **5 giây**. Nếu quá thời gian, hệ thống tự động chuyển sang chế độ ghép đấu với "Bóng bóng ảo" (Shadow Player) của người chơi khác đã lưu từ trước để bảo vệ trải nghiệm người dùng.

---
*Tài liệu đặc tả được xây dựng dựa trên định hướng phát triển chi tiết của VibeSpeak, tích hợp toàn bộ các ý tưởng cốt lõi và kiến trúc kỹ thuật chuẩn mực từ dữ liệu thiết kế dự án.* [1, 2, 3, 4, 14, 15, 19, 23, 26, 28, 29, 30, 31, 33, 36, 40, 44, 50, 54, 57, 58, 59, 60, 61, 70, 71, 72, 73, 74, 81, 82, 83, 84, 85, 86, 90, 91, 95, 96, 97, 98, 126, 127, 138]

## 6. SƠ ĐỒ PHÁC THẢO GIAO DIỆN CHI TIẾT (UI/UX WIREFRAME LAYOUTS)

Để hỗ trợ đội ngũ chuyên gia thiết kế phần mềm dễ dàng lập trình và cấu trúc giao diện ứng dụng VibeSpeak đạt mức độ hoàn hảo về độ chính xác và trải nghiệm thẩm mỹ Cyberpunk/Retro-wave, dưới đây là đặc tả chi tiết và sơ đồ phác thảo của 2 màn hình cốt lõi.

---

### 6.1. Màn hình "Gỡ Băng Ghi Âm Retro Cassette" (Cassette Tape Debriefing)

*   **Ý tưởng cốt lõi (Concept & Mood):** Đưa học viên vào không gian hoài cổ thập niên 80 kết hợp viễn tưởng Cyberpunk. Nền tối sâu thẳm đen-tím, các đường viền phát sáng hồng cực đại (Hot Pink) và xanh lá neon rực rỡ (Acid Green). Trọng tâm là hình ảnh cuộn băng cassette vật lý quay trục đồng hành cùng âm thanh chân thực, biến việc xem lỗi sai từ nặng nề thành một trải nghiệm giải trí thú vị [53, 57, 58].

#### Sơ đồ Phác thảo (ASCII UI Wireframe):
```text
+-------------------------------------------------------------------------+
| [<- Quay lại]            VIBESPEAK DEBRIEF CENTRE        [Học viên: DEV] |
| Trạm: Cafe #03 (Tuyến Xanh Lá)                           Streak: 12 ngày |
+-------------------------------------------------------------------------+
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |             CỔNG PHÁT BĂNG CASSETTE CHUẨN RETRO WAVE              |  |
|  |                                                                   |  |
|  |   =================== TAPE PLAYBACK DECK =====================    |  |
|  |  +-------------------------------------------------------------+  |  |
|  |  | [O] [=================================================] [O] |  |  |
|  |  |      / /    (########)                   (##)        \ \      |  |  |
|  |  |  (( ( O ) )) (########) CAFE CONVERSATION (##)   (( ( O ) ))|  |  |
|  |  |      \ \_    (########) Skin: Kỷ Luật Thép(##)     _/ /      |  |  |
|  |  |       [=========================================]           |  |  |
|  |  +-------------------------------------------------------------+  |  |
|  |   [ ĐANG PHÁT ]  ||||||||||||||||||||||||||||------- VU Trái   (G) |  |
|  |   (01:24/02:15)  |||||||||||||||||||---------------- VU Phải   (Y) |  |
|  |   ============================================================    |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +------------------- KHU VỰC GỢI Ý & SỬA LỖI AI --------------------+  |
|  | MÁY CHỮ NEON (Streaming text):                                     |  |
|  |                                                                   |  |
|  |  Câu gốc của bạn: "I want book table for two." (Điểm: 65)          |  |
|  |                                                                   |  |
|  |  [Thẻ 1] GRAMMAR_OK  : "I want to book a table for two."          |  |
|  |  [Thẻ 2] NATURAL_OK  : "I'd like to get a table for two, please." |  |
|  |  [Thẻ 3] NATIVE_STYLE: "Can we get a table for two?"              |  |
|  |                                                                   |  |
|  |  [?] GIẢI THÍCH: Sử dụng cấu trúc trang trọng hơn giúp tăng       |  |
|  |  tính lịch sự. Cụm "Can we get..." cực kỳ sành điệu và được dùng  |  |
|  |  phổ biến bởi người bản xứ khi bước vào quán ăn.                  |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +--------------------------- THANH CÔNG CỤ -------------------------+  |
|  |                                                                   |  |
|  |  [Tua lại - 10s]  [   PHÁT LẠI GIỌNG NÓI   ]  [Luyện nói lại (Mic)]|  |
|  |                                                                   |  |
|  +-------------------------------------------------------------------+  |
|  | [Học tiếp Trạm mới (Yêu cầu hoàn thành luyện nói lại)]              |  |
+-------------------------------------------------------------------------+
```

#### Đặc tả thuộc tính và phần tử Giao diện:
1.  **Vùng đầu trang (Header Area):**
    *   *Nút Quay lại:* Góc trên bên trái, màu xanh lam Cyan (`#00FFFF`), bấm vào để lưu tiến trình và quay về Bản đồ Tàu điện ngầm.
    *   *Thẻ Học viên & Streak:* Góc phải, hiển thị tên học viên và chỉ số Streak phát sáng lấp lánh để nhắc nhở kỷ luật học tập liên tục [19, 23].
2.  **Khung máy phát băng Cassette (Tape Deck Container):**
    *   *Khung bao:* Màu xám đen mô phỏng bề mặt máy cơ, bo góc 12px, viền ngoài đổ bóng hồng neon (`#FF007F`).
    *   *Hai trục băng (Spinning Reels):* Hai trục tròn `( O )` có các khía nhựa đen trắng. Khi đang phát lại giọng nói của người học, hai trục này sẽ xoay tròn bằng hoạt ảnh CSS (`keyframes { transform: rotate(360deg); }`). Tốc độ xoay khớp với nhịp độ âm thanh. Khi tua băng (rewind), trục trái xoay cực nhanh ngược chiều kim đồng hồ, trục phải xoay thuận chiều kim đồng hồ kèm hiệu ứng âm thanh rít băng chân thực [58].
    *   *Hiệu ứng Băng từ co giãn (Magnetic Tape Thickness Indicator):* Phía sau lõi nhựa màu trắng là các vòng đệm màu nâu đậm đại diện cho dải băng từ quấn quanh trục [58]. Độ dày (bán kính vòng tròn nâu đậm này) sẽ co giãn động theo tỷ lệ nghịch với nhau dựa trên tiến độ (`progress` từ `0` đến `1`):
        *   Khi `progress = 0` (Bắt đầu): Cuộn trái đạt độ dày tối đa (bán kính 45px), cuộn phải mỏng nhất (chỉ sát lõi nhựa 22px).
        *   Khi `progress = 1` (Kết thúc): Cuộn trái co lại mỏng nhất (22px), cuộn phải dầy tối đa (45px).
        *   Quá trình biến đổi độ dày được tính toán theo công thức bảo toàn diện tích băng $R = \sqrt{R_{initial}^2 \pm \Delta S 	imes p}$ để chuyển động co giãn trông tự nhiên nhất [58].
    *   *Đèn LED VU Meters (Đồng hồ đo âm lượng):* Gồm 2 dải đèn LED (Trái & Phải). Khi giọng nói phát ra, các vạch đèn nhảy nhót linh hoạt theo cường độ âm thanh thực tế: 70% vạch màu xanh lá (Green - `#39FF14`), 20% màu vàng (Yellow - `#FFD700`), 10% màu đỏ (Red - `#FF003F`).
3.  **Hộp phân tích lỗi của AI (AI Analysis Board):**
    *   *Khung terminal:* Màu đen sâu nhám, viền mỏng neon xanh lá phát sáng.
    *   *Chữ Streaming:* Văn bản được nạp dần dần bằng hiệu ứng máy gõ chữ kết hợp tiếng click lách cách cơ học [54, 59].
    *   *Màu chữ của các Thẻ:*
        *   `ORIGINAL` (Câu gốc): Màu xám mờ hoặc đỏ nhạt (`#FF7373`), thể hiện phần cần cải thiện.
        *   `GRAMMAR_OK` (Chuẩn Ngữ Pháp): Màu xanh lam dịu (`#00FFFF`), thể hiện tính chính xác chuẩn mực cấu trúc [44, 59].
        *   `NATURAL_OK` (Tự Nhiên): Màu vàng cam sáng (`#FF9F00`), thể hiện tính thực tế giao tiếp đời thường [44, 59].
        *   `NATIVE_STYLE` (Vibe bản xứ): Màu hồng neon chớp tắt huyền ảo (`#FF007F`), chỉ ra cách giao tiếp đẳng cấp cao nhất [44, 59].
    *   *Nút Bóng Đèn Vinh Danh (Ding Event):* Cạnh các câu nâng cấp, nếu người dùng học lại và phát âm đúng từ khóa, đèn xanh lá sẽ bật sáng kèm tiếng chuông "Ding!" cực kỳ vui tai [54, 58].
4.  **Thanh công cụ Điều khiển (Controller Toolbar):**
    *   *Nút Luyện nói lại (Mic):* Nằm ở trung tâm dưới cùng, hình tròn lớn viền neon đỏ. Người học nhấn giữ để bắt đầu thu âm lại phiên bản nâng cấp của câu vừa học [59, 60]. Khi nhấn giữ, viền nút sẽ chuyển động lan tỏa sóng âm (Ripple Effect) để kích thích giác quan.

---

### 6.2. Màn hình "Đấu Trường Tất Tay" (All-In Arena)

*   **Ý tưởng cốt lõi (Concept & Mood):** Được thiết kế như phòng chờ của một trận đối kháng trò chơi điện tử (Fighting Game Room). Nền tối, các góc sáng rực rỡ dải màu chuyển hồng và xanh dương sâu. Trực quan hóa căng thẳng của việc đặt cược và đối thoại thực tế thời gian thực trước sự giám sát của trọng tài AI [90, 96].

#### Sơ đồ Phác thảo (ASCII UI Wireframe):
```text
+-------------------------------------------------------------------------+
| [Thoát Đấu Trường]            ARENA: ĐẤU TRƯỜNG TẤT TAY        [Trận #89] |
| Giải đấu: Kim Cương           Trạm: Phỏng Vấn Công Sở         Vòng: 2 / 3|
+-------------------------------------------------------------------------+
|                                                                         |
|   +---------------------+                     +---------------------+   |
|   |   HỌC VIÊN A (BẠN)  |                     |    HỌC VIÊN B (P2)  |   |
|   |  +---------------+  |      _  _  _        |  +---------------+  |   |
|   |  |   [Avatar]    |  |     / \/ \/ \       |  |   [Avatar]    |  |   |
|   |  |     DEV       |  |     \   VS  /       |  |     ACE       |  |   |
|   |  +---------------+  |      \_/\_/\_/        |  +---------------+  |   |
|   |  Streak: 15 ngày    |  [Đèn VS nhấp nháy] |  Streak: 9 ngày     |   |
|   |  EXP Cược: 250 PTS  |                     |  EXP Cược: 250 PTS  |   |
|   +---------------------+                     +---------------------+   |
|                                                                         |
|               +-----------------------------------------+               |
|               |        QUỸ TIỀN CƯỢC: [ 500 EXP ]       |               |
|               |  (Thắng ăn cả - Thua ngã về không! ⚔️)  |               |
|               +-----------------------------------------+               |
|                                                                         |
|  +----------------------- TRỌNG TÀI AI DẪN CHUYỆN -------------------+  |
|  | AI REFEREE PROMPT (Bối cảnh: Business Interview):                  |  |
|  | > "Describe your biggest professional weakness in a clever way."   |  |
|  |---------------------------------------------------------------------|  |
|  | LƯỢT THI CỦA BẠN (Còn 15 giây):                                     |  |
|  | > "My weakness is that I pay too much attention to details..."      |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +------------------------- CÔNG CỤ TRẬN ĐẤU ------------------------+  |
|  |                                                                   |  |
|  | [ TĂNG MỨC CƯỢC +50 EXP ]   [ NHẤN GIỮ NÓI (TẤN CÔNG) ]   [ĐẦU HÀNG]|  |
|  |                                                                   |  |
|  +-------------------------------------------------------------------+  |
|  | Lưu ý: Đầu hàng lập tức mất 100% điểm cược và bị trừ thêm 50 EXP  |  |
+-------------------------------------------------------------------------+
```

#### Đặc tả thuộc tính và phần tử Giao diện:
1.  **Thẻ Người chơi Đối kháng (Versus Grid):**
    *   *Bố cục:* Chia đôi màn hình 50-50 bằng hệ thống Flexbox. Trái là Học viên A (Bạn), phải là Học viên B (Đối thủ được ghép ngẫu nhiên bằng Supabase Realtime).
    *   *Khối Avatar:* Được lồng trong khung lục giác hoặc hình ngũ giác mang hơi hướng Cyberpunk, viền phát sáng màu Lam (`#00FFFF`) cho Bạn và màu Cam đỏ (`#FF003F`) cho đối thủ để phân biệt rõ vị thế.
    *   *Hiệu ứng trung tâm "VS":* Khối chữ VS được đặt tại điểm giao giữa hai bên, có hiệu ứng chớp tắt liên tục (Blinking effect) với tần số 1Hz mô phỏng bảng hiệu neon đường phố ban đêm.
2.  **Khối Hiển thị Quỹ điểm cược (The Pot Display Container):**
    *   Màu nền: Vàng hoàng kim sang trọng kết hợp màu tím than mờ.
    *   Văn bản: Chữ `[ 500 EXP ]` được phóng to (size 22, bold), viền chữ đổ bóng vàng rực rỡ để kích thích tâm lý kịch tính, tạo cảm giác của một canh bạc thực thụ nơi người chiến thắng sẽ thâu tóm toàn bộ số EXP này [91, 97].
3.  **Hộp Nhập vai & Chữ Stream Hội thoại (Battle Prompt & Log):**
    *   *Bối cảnh:* Được hiển thị bằng kiểu chữ Courier New đậm chất lập trình vi tính cổ điển. Trọng tài AI sẽ lần lượt đưa ra tình huống thách đấu để hai người chơi phải xử lý ứng biến tức thời bằng tiếng Anh.
    *   *Thanh đếm ngược thời gian (Timer bar):* Một thanh ngang màu đỏ chạy rút ngắn dần từ 100% về 0% tương ứng với 30 giây thời gian quy định cho mỗi lượt nói. Khi còn dưới 5 giây, thanh đếm ngược nháy đỏ dồn dập cùng âm thanh tích tắc của kim đồng hồ thúc giục căng thẳng.
4.  **Cụm Nút Hành Động Trận Đấu (Action Buttons):**
    *   *Nút Nhấn Giữ Nói (Tấn Công):* Nút bấm to nhất, nằm giữa, màu cam đỏ (`#FF003F`). Khi đến lượt, học viên nhấn giữ để thu âm câu nói của mình. Dữ liệu thu âm lập tức được mã hóa và truyền lên server để AI chấm điểm [91, 97].
    *   *Nút Tăng mức cược (Raise):* Cho phép người học tăng độ mạo hiểm của cuộc chiến bằng cách gia tăng lượng điểm EXP đặt cược từ ví cá nhân vào Quỹ chung (The Pot), tăng tối đa đến mức "Tất Tay" (All-In) toàn bộ số EXP hiện có để dồn ép đối thủ [95, 96].
    *   *Nút Đầu hàng (Forfeit):* Màu xám tối xỉn. Sử dụng khi học viên mất tự tin hoặc không thể trả lời. Cơ chế trừng phạt được kích hoạt lập tức: Người chơi bị xử thua, đối thủ nhận toàn bộ quỹ cược hiện tại, và tài khoản đầu hàng bị trừ phạt thêm 50 EXP do vi phạm quy tắc nỗ lực của đấu trường nhằm ngăn chặn hành vi thoát trận bừa bãi [91, 97].

---

*Tài liệu đặc tả kịch bản và phác thảo giao diện được bổ sung này đảm bảo đồng bộ hóa trọn vẹn cả kiến trúc dữ liệu back-end lẫn phân rã trải nghiệm tương tác trực quan front-end của siêu ứng dụng VibeSpeak.* [1, 2, 3, 4, 14, 15, 19, 23, 24, 28, 29, 30, 31, 33, 36, 40, 44, 50, 53, 54, 57, 58, 59, 60, 61, 70, 71, 72, 73, 74, 81, 82, 83, 84, 85, 86, 89, 90, 91, 95, 96, 97, 98, 126, 127, 138]


## 7. THIẾT KẾ CƠ SỞ DỮ LIỆU ĐẤU TRƯỜNG (ARENA) & LEAGUE MỞ RỘNG (EXTENDED DATABASE SCHEMA)

Để hỗ trợ đội ngũ phát triển Back-end (đặc biệt là khi sử dụng Supabase/PostgreSQL) triển khai tính năng **Đấu trường "Tất Tay" (All-In Arena)** và **Bảng xếp hạng League tuần (Discipline Tournament)** đạt độ hoàn hảo về cấu trúc dữ liệu và hiệu năng thời gian thực (Real-time syncing), dưới đây là sơ đồ cơ sở dữ liệu mở rộng chi tiết.

---

### 7.1. Sơ đồ các bảng cơ sở dữ liệu (Database Schema DDL)

Học viên có thể đặt cược điểm EXP của mình tại đấu trường [89, 90]. Hệ thống cần lưu trữ chặt chẽ lịch sử trận đấu, điểm số chi tiết từng tiêu chí của mỗi vòng đấu để tránh rò rỉ dữ liệu điểm thưởng và phân tích lỗi chuẩn xác [91, 97].

```sql
-- =========================================================================
-- PHÂN HỆ: ĐẤU TRƯỜNG "TẤT TAY" (ALL-IN ARENA)
-- =========================================================================

-- 1. Bảng Trận đấu Arena (Arena_Matches)
-- Lưu trữ trạng thái tổng quát của một phòng đấu giữa hai học viên tại một trạm dừng chân
CREATE TABLE arena_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id INT NOT NULL REFERENCES metro_stations(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'matching', 
    -- Các trạng thái hợp lệ: 
    -- 'matching'  : Đang chờ hệ thống ghép cặp ngẫu nhiên
    -- 'ongoing'   : Đang đối thoại trực tiếp (vòng đấu đang chạy)
    -- 'completed' : Đã kết thúc và có điểm phân định thắng bại rõ ràng
    -- 'forfeited' : Có người chơi bấm nút "Đầu hàng" giữa trận
    -- 'cancelled' : Hủy trận đấu (do lỗi kết nối hoặc không tìm thấy đối thủ quá 5s)
    total_pot INT DEFAULT 0, -- Tổng quỹ điểm EXP đặt cược chung (ví dụ: 500 EXP)
    current_round INT DEFAULT 1, -- Vòng đấu hiện tại (Vòng 1, 2, 3)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Chỉ mục tối ưu hóa truy vấn các trận đấu đang hoạt động
CREATE INDEX idx_arena_matches_status ON arena_matches(status) WHERE status IN ('matching', 'ongoing');


-- 2. Bảng Chi tiết Đấu thủ tham gia Trận đấu (Arena_Match_Players)
-- Quản lý vị trí, số tiền đặt cược, và trạng thái thắng/thua cụ thể của từng đấu thủ
CREATE TABLE arena_match_players (
    match_id UUID NOT NULL REFERENCES arena_matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'challenger' (người thách đấu), 'defender' (đối thủ ghép cặp)
    bet_amount INT NOT NULL DEFAULT 0 CHECK (bet_amount >= 0), -- Số điểm EXP đặt cược từ tài khoản cá nhân
    is_winner BOOLEAN DEFAULT FALSE, -- TRUE nếu giành chiến thắng chung cuộc
    is_forfeited BOOLEAN DEFAULT FALSE, -- TRUE nếu bấm nút Đầu hàng (Forfeit) giữa trận
    final_exp_delta INT DEFAULT 0, -- Số EXP thực tế thay đổi sau trận đấu (ví dụ: +250 hoặc -250)
    PRIMARY KEY (match_id, user_id)
);


-- 3. Bảng Vòng đấu chi tiết (Arena_Rounds)
-- Mỗi trận đấu gồm tối đa 3 vòng đối đáp. Trọng tài AI sẽ đưa ra thử thách riêng cho mỗi vòng
CREATE TABLE arena_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES arena_matches(id) ON DELETE CASCADE,
    round_number INT NOT NULL CHECK (round_number BETWEEN 1 AND 5), -- Số thứ tự vòng đấu (thường là 1->3)
    referee_prompt TEXT NOT NULL, -- Tình huống nhập vai / Câu hỏi trọng tài AI đưa ra cho 2 người chơi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 4. Bảng Lượt phản hồi và Sửa lỗi của Đấu thủ (Arena_Player_Turns)
-- Lưu trữ chi tiết tệp âm thanh ghi âm, văn bản nhận diện và điểm số 4 tiêu chí của từng lượt đối đáp
CREATE TABLE arena_player_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audio_url TEXT, -- URL tệp âm thanh ghi âm lưu trên Supabase Storage
    transcript TEXT, -- Văn bản nhận diện giọng nói (STT) của học viên
    score_grammar INT CHECK (score_grammar BETWEEN 0 AND 100), -- Điểm Ngữ pháp
    score_vocabulary INT CHECK (score_vocabulary BETWEEN 0 AND 100), -- Điểm Từ vựng
    score_naturalness INT CHECK (score_naturalness BETWEEN 0 AND 100), -- Điểm Độ tự nhiên
    score_native_style INT CHECK (score_native_style BETWEEN 0 AND 100), -- Điểm Chuẩn bản xứ
    overall_score DECIMAL(5,2), -- Điểm trung bình của lượt nói này ((Grammar + Vocab + Natural + Native) / 4)
    corrected_grammar TEXT, -- Gợi ý nâng cấp: Thẻ 1
    corrected_natural TEXT, -- Gợi ý nâng cấp: Thẻ 2
    corrected_native TEXT, -- Gợi ý nâng cấp: Thẻ 3
    referee_feedback TEXT, -- Lời khuyên ngắn gọn trực quan từ Trọng tài AI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_turns_round_user ON arena_player_turns(round_id, user_id);


-- =========================================================================
-- PHÂN HỆ: BẢNG XẾP HẠNG LEAGUE TUẦN VÀ THỐNG KÊ (LEAGUE LEADERBOARDS)
-- =========================================================================

-- 5. Bảng Thống kê Hiệu suất Arena Trọn đời của Học viên (User_Arena_Stats)
-- Phục vụ hiển thị hồ sơ cá nhân và tính toán chuỗi thắng phục vụ thuật toán ghép cặp
CREATE TABLE user_arena_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_battles INT DEFAULT 0 CHECK (total_battles >= 0),
    total_wins INT DEFAULT 0 CHECK (total_wins >= 0),
    total_losses INT DEFAULT 0 CHECK (total_losses >= 0),
    total_exp_won INT DEFAULT 0 CHECK (total_exp_won >= 0),
    total_exp_lost INT DEFAULT 0 CHECK (total_exp_lost >= 0),
    win_streak INT DEFAULT 0 CHECK (win_streak >= 0) -- Chuỗi thắng hiện tại (reset về 0 ngay khi thua)
);


-- 6. Bảng Xếp hạng Tuần Chi tiết (Weekly_League_Leaderboard)
-- Quản lý thời gian thực bảng tổng sắp của nhóm 30 thành viên cùng bảng đấu trong tuần hiện tại [19]
CREATE TABLE weekly_league_leaderboard (
    group_id UUID NOT NULL REFERENCES league_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weekly_exp_earned INT NOT NULL DEFAULT 0 CHECK (weekly_exp_earned >= 0), -- EXP kiếm được từ việc học + đấu Arena trong tuần
    arena_matches_played INT NOT NULL DEFAULT 0, -- Số trận đấu Arena đã tham gia trong tuần
    arena_wins_count INT NOT NULL DEFAULT 0, -- Số trận Arena thắng trong tuần
    rank_position INT DEFAULT 1 CHECK (rank_position BETWEEN 1 AND 30), -- Thứ hạng thực tế trong nhóm (1->30)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_weekly_leaderboard_rank ON weekly_league_leaderboard(group_id, weekly_exp_earned DESC);
```

---

### 7.2. Cơ chế Đồng bộ hóa & Tránh Xung Đột Dữ Liệu Giao Dịch (Transactions)

Do Đấu trường Tất tay liên quan trực tiếp đến việc tăng/trừ điểm EXP có tính cạnh tranh khốc liệt [91, 97], Back-end cần đảm bảo tính toàn vẹn dữ liệu cực kỳ nghiêm ngặt để tránh **lỗi nhân đôi điểm (double-spending)** hoặc **rút điểm âm** khi người dùng tham gia nhiều hành động cùng lúc.

#### Luồng Giao Dịch Đặt Cược (Transaction Flow) - SQL Procedure:
Để xử lý việc trừ điểm cược và dồn điểm vào quỹ Pot an toàn khi bắt đầu trận đấu, Supabase Database cần chạy một Transaction (Function RPC) như sau:

```sql
CREATE OR REPLACE FUNCTION join_arena_match(
    p_match_id UUID,
    p_user_id UUID,
    p_bet_amount INT,
    p_role VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_exp INT;
    v_match_status VARCHAR(30);
BEGIN
    -- 1. Kiểm tra trạng thái trận đấu (để tránh ghép phòng đã đầy)
    SELECT status INTO v_match_status FROM arena_matches WHERE id = p_match_id FOR UPDATE;
    IF v_match_status != 'matching' AND p_role = 'defender' THEN
        RAISE EXCEPTION 'Trận đấu đã đầy hoặc không còn ở trạng thái chờ ghép cặp!';
    END IF;

    -- 2. Khóa dòng thông tin người dùng để tránh xung đột cập nhật đồng thời (FOR UPDATE)
    SELECT exp_points INTO v_user_exp FROM users WHERE id = p_user_id FOR UPDATE;
    
    -- Kiểm tra số dư EXP
    IF v_user_exp < p_bet_amount THEN
        RAISE EXCEPTION 'Học viên không đủ điểm EXP để tham gia thách đấu!';
    END IF;

    -- 3. Trừ điểm EXP của người dùng
    UPDATE users 
    SET exp_points = exp_points - p_bet_amount 
    WHERE id = p_user_id;

    -- 4. Thêm người dùng vào danh sách người chơi của trận đấu
    INSERT INTO arena_match_players (match_id, user_id, role, bet_amount)
    VALUES (p_match_id, p_user_id, p_role, p_bet_amount);

    -- 5. Cập nhật quỹ tổng của Trận đấu
    UPDATE arena_matches 
    SET total_pot = total_pot + p_bet_amount,
        status = CASE WHEN p_role = 'defender' THEN 'ongoing'::VARCHAR ELSE 'matching'::VARCHAR END
    WHERE id = p_match_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- PostgreSQL tự động ROLLBACK toàn bộ thao tác trên nếu phát sinh lỗi bất kỳ
        RAISE EXCEPTION 'Lỗi đồng bộ giao dịch Arena: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

---

### 7.3. Luồng Sự kiện Supabase Realtime kích hoạt Trận đấu (Real-time Pub/Sub WebSockets)

Để thiết lập tính năng đồng bộ hóa tức thì trên ứng dụng di động (React Native), lập trình viên Front-end cần đăng ký (Subscribe) các kênh dữ liệu Supabase Realtime theo vòng đời trận đấu sau:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('SUPABASE_URL', 'SUPABASE_ANON_KEY');

// Đăng ký lắng nghe sự kiện thay đổi trạng thái của trận đấu hiện tại
const subscribeToArenaMatch = (matchId, onStatusChange, onNewRound) => {
  const matchChannel = supabase
    .channel(`arena:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'arena_matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        const { status, current_round } = payload.new;
        onStatusChange(status);
        
        // Khi có vòng đấu mới được tạo bởi Trọng tài AI
        if (payload.old.current_round !== current_round) {
          onNewRound(current_round);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(matchChannel);
  };
};

// Đăng ký lắng nghe lượt trả lời của đối thủ
const subscribeToOpponentTurns = (roundId, opponentUserId, onOpponentSubmit) => {
  const turnChannel = supabase
    .channel(`round:${roundId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'arena_player_turns',
        filter: `round_id=eq.${roundId}`,
      },
      (payload) => {
        if (payload.new.user_id === opponentUserId) {
          // Khi đối thủ đã thu âm xong và hệ thống đã chấm điểm xong
          onOpponentSubmit(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(turnChannel);
  };
};
```

---

### 7.4. Phục hồi Dữ liệu & Xử phạt Nghiêm Khắc khi Rớt mạng (Disconnection Grace-Period)

Một vấn đề phổ biến là người học rớt mạng (Disconnection) hoặc cố tình tắt ứng dụng (Force close) khi nhận thấy điểm lượt nói của mình thấp hơn đối thủ để trốn tránh hình phạt trừ EXP. Hệ thống VibeSpeak áp dụng cơ chế xử phạt kỷ luật thép sau:

1.  **Cơ chế Đếm ngược giữ kết nối (Grace Period - 15 giây):** 
    *   Khi một bên bị mất kết nối WebSockets, trạng thái trận đấu tạm thời giữ nguyên. Đối thủ nhận được thông báo: *"Đang chờ đối thủ kết nối lại... (15s)"*.
2.  **Xử phạt Đầu hàng Tự động (Auto-Forfeit Enforcement):**
    *   Nếu quá 15 giây mà đấu thủ không kết nối lại, hệ thống tự động gọi Function kết thúc trận đấu và đánh dấu `is_forfeited = TRUE` cho người mất kết nối.
    *   Toàn bộ số điểm EXP đặt cược của người mất kết nối bị trừ sạch và cộng vào tài khoản của người thắng cuộc [91, 97].
    *   Tài khoản vi phạm bị phạt thêm **50 EXP** trực tiếp vào số dư trọn đời để triệt tiêu hoàn toàn động cơ thoát trận bừa bãi.

---
*Cơ sở dữ liệu mở rộng này được thiết kế đồng bộ với kịch bản vận hành chi tiết của VibeSpeak, đảm bảo tính nhất quán cao nhất từ trải nghiệm Game hóa đến hiệu năng hệ thống.* [19, 23, 89, 90, 91, 95, 96, 97, 98]


## 8. ĐẶC TẢ CHI TIẾT CÁC CỔNG GIAO TIẾP API (API ENDPOINTS SPECIFICATIONS)

Nhằm đảm bảo sự liên kết chặt chẽ và không có khe hở kỹ thuật giữa **Client React Native (Expo)** và **Back-end Supabase & AI Engine (Groq AI)**, dưới đây là đặc tả chi tiết của các cổng kết nối API truyền tải thời gian thực và cấu trúc gói tin qua giao thức HTTP (SSE) và WebSockets [1, 2].

---

### 8.1. Luồng Ghi Âm & Chấm Lỗi Thời Gian Thực (Debrief Audio Streaming)

Khi học viên hoàn thành cuộc hội thoại 1:1 tự nhiên tại một Trạm Tàu Điện Ngầm [14, 40], hệ thống client sẽ gửi dữ liệu âm thanh đến cụm phân tích. Trình phân tích sử dụng **Server-Sent Events (SSE)** để đẩy dữ liệu chữ chạy dạng máy gõ chữ song song với hoạt ảnh cuộn băng cassette vật lý xoay chuyển trên giao diện [54, 57, 59].

#### Cổng kết nối HTTP POST: Phân tích tệp ghi âm giọng nói
*   **Đường dẫn (Endpoint):** `/api/v1/debrief/audio-stream`
*   **Phương thức:** `POST`
*   **Mục tiêu:** Chuyển giọng nói thành chữ (Speech-to-Text), phân tích 4 tiêu chí chất lượng và trả về luồng dữ liệu phân tích từng ký tự (chunked) đồng bộ hiệu ứng âm thanh máy gõ chữ.
*   **Headers:**
    ```json
    {
      "Content-Type": "multipart/form-data",
      "Authorization": "Bearer <user_jwt_token>"
    }
    ```
*   **Dữ liệu yêu cầu (Multipart Payload):**
    *   `audio`: Tệp tin nhị phân âm thanh giọng nói (định dạng khuyên dùng: `.m4a` hoặc `.wav`, tần số lấy mẫu 16kHz hoặc 22.05kHz để tối ưu hóa nén dữ liệu).
    *   `station_id`: `integer` (ID của trạm tàu hiện tại để hệ thống nạp dữ liệu ngữ cảnh bối cảnh tương ứng).
    *   `prompt_context`: `string` (Bối cảnh hội thoại do AI đưa ra trước đó nhằm gia tăng độ chính xác trong phân tích từ vựng/ngữ pháp).

*   **Dấu hiệu nhận biết luồng dữ liệu (Response Headers):**
    ```http
    HTTP/1.1 200 OK
    Content-Type: text/event-stream
    Cache-Control: no-cache
    Connection: keep-alive
    Transfer-Encoding: chunked
    ```

#### Luồng dữ liệu phản hồi (Server-Sent Events payload):
Server sẽ gửi về liên tục các sự kiện chữ cho đến khi quá trình phân tích hoàn tất, giúp Front-end bắt nhịp gõ chữ và phát tiếng sfx click lách cách cơ học đồng bộ hoàn hảo:

1.  **Sự kiện bắt đầu (Event: `stream_start`):** Báo hiệu AI đã xử lý xong STT và bắt đầu trả về kết quả phân tích. Trục băng cassette bắt đầu xoay [58].
    ```text
    event: stream_start
    data: {"status": "processing", "original_text": "I want book table for two."}
    ```

2.  **Các sự kiện nội dung (Event: `chunk`):** Đổ dữ liệu chữ nâng cấp theo từng cụm hoặc ký tự. Mỗi lần nhận được chunk này, client sẽ phát tiếng click máy gõ chữ nếu không phải khoảng trắng [54, 59].
    ```text
    event: chunk
    data: {"field": "GRAMMAR_OK", "delta": "I want to "}
    
    event: chunk
    data: {"field": "GRAMMAR_OK", "delta": "book a table "}
    ```

3.  **Sự kiện hoàn tất chấm lỗi (Event: `stream_end`):** Trả về toàn bộ dữ liệu cấu trúc hoàn chỉnh đã phân tích để lưu cục bộ vào máy học viên và cập nhật database. Đèn LED trên cassette phát tiếng "Ding!" báo hiệu hoàn tất buổi học [54, 58].
    ```text
    event: stream_end
    data: {
      "match_id": "90e181c0-ea01-443b-82a9-7c180da89fe2",
      "score": 65,
      "original_text": "I want book table for two.",
      "upgrades": {
        "grammar_ok": "I want to book a table for two.",
        "natural_ok": "I'd like to get a table for two, please.",
        "native_style": "Can we get a table for two?"
      },
      "explanation": "Sử dụng cấu trúc trang trọng hơn giúp tăng tính lịch sự. Cụm "Can we get..." cực kỳ sành điệu và được dùng phổ biến bởi người bản xứ khi bước vào quán ăn."
    }
    ```

---

### 8.2. Kênh Truyền Thông Thời Gian Thực Cho Đấu Trường (All-In Arena WebSocket Protocol)

Trận đấu đối kháng giao tiếp 1:1 yêu cầu ghép nối và trao đổi trạng thái cực kỳ mượt mà [90, 96]. Để làm được điều này, hệ thống sử dụng kết nối **WebSockets thông qua bộ Realtime Engine của Supabase** (hoặc Socket.io máy chủ trung gian).

*   **Đường dẫn kết nối (WebSocket URL):** `wss://api.vibespeak.com/v1/arena/match`
*   **Tham số bắt tay (Handshake Query Params):**
    `?token=<user_jwt_token>&match_id=<arena_match_uuid>`

#### Cấu trúc các Gói tin sự kiện trao đổi qua WebSocket (Event Payload Specification):

#### 1. Sự kiện `match:init` (Server -> Client)
Được phát đi khi hệ thống tìm phòng thành công và đưa hai học viên có cùng mức cược EXP vào phòng đấu [90, 96]. Giao diện chuyển sang màn hình VS Grid với các ảnh đại diện đặt trong khung neon phát sáng.
```json
{
  "event": "match:init",
  "timestamp": "2026-08-31T07:05:00Z",
  "payload": {
    "match_id": "89f38f51-248a-406c-9ba7-3211f44a80bc",
    "station_id": 12,
    "scenario_name": "Phỏng Vấn Công Sở (Tuyến Đỏ - Trạm 03)",
    "current_round": 1,
    "total_rounds": 3,
    "pot_exp": 500,
    "referee_ai_prompt": "Describe your biggest professional weakness in a clever way.",
    "players": [
      {
        "id": "user-uuid-1",
        "name": "DEV",
        "avatar": "https://cdn.vibespeak.dev/avatars/user1.png",
        "streak": 15
      },
      {
        "id": "user-uuid-2",
        "name": "ACE",
        "avatar": "https://cdn.vibespeak.dev/avatars/user2.png",
        "streak": 9
      }
    ]
  }
}
```

#### 2. Sự kiện `turn:start` (Server -> Client)
Được phát để điều phối xem ai là người được quyền nói trước. Thanh đếm ngược thời gian của đấu thủ đang nói sẽ lập tức chạy giật lùi từ 30 giây về 0 giây kèm tiếng đồng hồ tích tắc [91, 97].
```json
{
  "event": "turn:start",
  "payload": {
    "round_number": 1,
    "active_player_id": "user-uuid-1",
    "time_limit_seconds": 30
  }
}
```

#### 3. Sự kiện `audio:submit` (Client -> Server)
Khi học viên hoàn tất lượt nói bằng cách thả nút "Nhấn Giữ Nói" (Tấn công), tệp ghi âm giọng nói định dạng base64 sẽ được gửi lên máy chủ để trọng tài AI phân tích [91, 97].
```json
{
  "event": "audio:submit",
  "payload": {
    "match_id": "89f38f51-248a-406c-9ba7-3211f44a80bc",
    "round_number": 1,
    "player_id": "user-uuid-1",
    "audio_base64_chunk": "UklGRiSRAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAA...",
    "mime_type": "audio/x-wav",
    "duration_ms": 4820
  }
}
```

#### 4. Sự kiện `turn:complete` (Server -> Client)
Trọng tài AI đã nhận dạng giọng nói thành văn bản, ghi chép lỗi sai vào cơ sở dữ liệu và đánh giá chi tiết theo 4 trục tiêu chí [91, 97]. Kết quả này được phát sóng đồng thời tới cả hai thiết bị để đồng bộ bảng điểm điện tử.
```json
{
  "event": "turn:complete",
  "payload": {
    "round_number": 1,
    "player_id": "user-uuid-1",
    "original_text": "My weakness is that I pay too much attention to details...",
    "score_details": {
      "grammar": 80,
      "vocabulary": 85,
      "naturalness": 75,
      "native_style": 70,
      "average": 78
    }
  }
}
```

#### 5. Sự kiện `match:end` (Server -> Client)
Trận đấu kết thúc sau 3 vòng đấu căng thẳng. Trọng tài AI tính toán tổng điểm tích lũy và công bố người chiến thắng chung cuộc nhận toàn bộ Quỹ cược EXP lấp lánh [91, 97].
```json
{
  "event": "match:end",
  "payload": {
    "winner_id": "user-uuid-1",
    "loser_id": "user-uuid-2",
    "reward_exp": 500,
    "final_total_scores": {
      "user-uuid-1": 245,
      "user-uuid-2": 210
    },
    "effects_trigger": "fireworks_neon_explosion"
  }
}
```

#### 6. Sự kiện `player:forfeit` (Server -> Client)
Kích hoạt lập tức nếu một bên cố tình bấm nút "Đầu hàng" hoặc ngắt kết nối mạng quá 15 giây (Disconnection Grace Period). Người chơi cố tình thoát trận sẽ bị trừ phạt 50 EXP trực tiếp, đối thủ được xử thắng lập tức [91, 97, 98].
```json
{
  "event": "player:forfeit",
  "payload": {
    "forfeiter_id": "user-uuid-2",
    "winner_id": "user-uuid-1",
    "transferred_pot_exp": 500,
    "penalty_exp_deducted": 50
  }
}
```

---

### 8.3. Cam Kết Chất Lượng API & Thử Nghiệm Tải (Load-Testing Thresholds)

Để hệ thống vận hành một cách hoàn hảo đúng theo định vị thương hiệu, đội ngũ phát triển Back-end cần duy trì nghiêm ngặt các chỉ số kiểm thử sau:
1.  **Thông lượng xử lý ghi âm (STT -> AI Payload):** Máy chủ trung gian phải hoàn tất bóc tách tệp ghi âm `.wav` thành văn bản trong vòng tối đa **150ms** trước khi truyền tải gói dữ liệu đến Groq API.
2.  **Tần số phản hồi SSE (Chunk interval):** Các sự kiện `chunk` truyền về màn hình máy gõ chữ phải đạt tần số ổn định từ **10 đến 15 ký tự mỗi giây** (tương đương khoảng 60ms-100ms một lần phát xung nhịp sfx lách cách) để đảm bảo âm thanh chân thực nhất và không gây khó chịu cho tai người nghe.
3.  **Tỷ lệ rớt mạng hợp lệ (WS Heartbeat):** Giao thức kết nối WebSocket giữa Client và Server phải gửi gói tin ping-pong định kỳ **3 giây một lần** (`{"event": "ping"}`). Nếu mất liên lạc liên tiếp 3 nhịp (9 giây), hệ thống sẽ chuyển sang trạng thái cảnh báo khẩn cấp 6 giây đếm ngược trên UI trước khi chính thức kích hoạt gói tin `player:forfeit` [97, 98].

