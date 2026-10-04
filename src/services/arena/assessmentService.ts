// api/evaluate.js
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
Lý do bạn **không nói gì** nhưng vẫn nhận được **69/100 điểm** ở Trạm 1 nằm ở việc **hàm `evaluateSpeaking` ở phía client (`src/services/arena/assessmentService.ts`) vẫn xử lý điểm theo logic cũ** trước khi kiểm tra dữ liệu trả về từ backend API.

Cụ thể:
1. Khi file audio thu được có dung lượng vừa đủ (>1500 bytes) do tiếng ồn nền, client gửi dữ liệu lên Backend `api/evaluate.js`.
2. Backend API phát hiện âm thanh trống/nhiễu và trả về `transcript = ""` cùng điểm các tiêu chí bằng `0`.
3. Tuy nhiên, hàm `evaluateSpeaking` ở phía Client khi nhận dữ liệu về lại có một đoạn **tự tính lại điểm trung bình** hoặc **gán điểm mặc định khi các tiêu chí trả về 0**, dẫn đến tổng điểm vẫn nhảy lên 69 điểm!

---

### 🛠 CÁCH KHẮC PHỤC DỄ DÀNG VÀ TẬN GỐC:

Chúng ta sẽ điều chỉnh file **`src/services/arena/assessmentService.ts`** để:
- Nếu `transcript` rỗng hoặc `wordCount === 0`, **trả về ngay kết quả 0 điểm** mà không thực hiện bất kỳ phép tính trung bình nào nữa.

---

### 📄 Mã nguồn cập nhật cho `src/services/arena/assessmentService.ts`:

Hãy mở file `src/services/arena/assessmentService.ts` và dán đè đoạn xử lý kết quả trả về:

```typescript
// src/services/arena/assessmentService.ts

export interface AssessmentResult {
  score: number;
  isWin: boolean;
  transcript: string;
  wordCount: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  reflexes: number;
  content: number;
  fluency: number;
  detailedFeedback: string;
  audioUrl?: string;
}

export const evaluateSpeaking = async (
  audioBlob: Blob,
  cefrLevel: string = 'B2',
  targetText?: string,
  targetPrompt?: string
): Promise<AssessmentResult> => {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');

    const queryParams = new URLSearchParams({
      cefrLevel,
      ...(targetPrompt && { promptEn: targetPrompt }),
      ...(targetText && { targetText }),
    });

    const response = await fetch(`/api/evaluate?${queryParams.toString()}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API evaluate error: ${response.statusText}`);
    }

    const data = await response.json();

    // 🚨 BẢO VỆ CHẶT CHẼ: Nếu Backend xác định không có chữ (transcript rỗng hoặc wordCount = 0)
    if (!data.transcript || data.transcript.trim() === '' || data.wordCount === 0) {
      return {
        score: 0,
        isWin: false,
        transcript: "(Không nhận diện được giọng phát âm rõ ràng)",
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: "❌ AI không nhận diện được giọng nói. Hãy kiểm tra Micro và đọc to rõ ràng hơn!",
      };
    }

    // Nếu có bài nói hợp lệ thì trả về điểm thật từ Backend
    return {
      score: data.score ?? 0,
      isWin: (data.score ?? 0) >= 65,
      transcript: data.transcript,
      wordCount: data.wordCount ?? 0,
      pronunciation: data.pronunciation ?? 0,
      grammar: data.grammar ?? 0,
      vocabulary: data.vocabulary ?? 0,
      reflexes: data.reflexes ?? 0,
      content: data.content ?? 0,
      fluency: data.fluency ?? 0,
      detailedFeedback: data.detailedFeedback || "Đánh giá hoàn tất.",
    };
  } catch (error) {
    console.error("Lỗi đánh giá bài nói:", error);
    return {
      score: 0,
      isWin: false,
      transcript: "(Lỗi kết nối API)",
      wordCount: 0,
      pronunciation: 0,
      grammar: 0,
      vocabulary: 0,
      reflexes: 0,
      content: 0,
      fluency: 0,
      detailedFeedback: "⚠️ Không thể kết nối đến máy chủ chấm điểm. Vui lòng thử lại!",
    };
  }
};