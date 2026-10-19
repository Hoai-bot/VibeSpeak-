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
  wordAnalysis?: Array<{ word: string; status: 'correct' | 'warning' | 'error' }>;
}

export const evaluateSpeaking = async (
  audioBlob: Blob,
  cefrLevel: string = 'B2',
  userText?: string,
  targetPrompt?: string,
  userId?: string
): Promise<AssessmentResult> => {
  // Tạo Local Blob URL dự phòng cho máy sinh viên nghe lại ngay tức thì
  const localAudioUrl = typeof window !== 'undefined' ? URL.createObjectURL(audioBlob) : '';

  try {
    // 📱 1. Xác định định dạng file âm thanh
    const mimeType = audioBlob.type || 'audio/webm';
    let ext = 'webm';

    if (mimeType.includes('mp4') || mimeType.includes('aac') || mimeType.includes('m4a')) {
      ext = 'mp4';
    } else if (mimeType.includes('wav')) {
      ext = 'wav';
    } else if (mimeType.includes('ogg')) {
      ext = 'ogg';
    }

    const queryParams = new URLSearchParams({
      cefrLevel,
      promptEn: targetPrompt || userText || '',
    });

    // 🎯 2. Gửi request sang API evaluate
    const response = await fetch(`/api/evaluate?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
      },
      body: audioBlob,
    });

    if (!response.ok) {
      throw new Error(`API evaluate error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.transcript || data.transcript.trim() === '' || data.score === 0) {
      return {
        score: 0,
        isWin: false,
        transcript: data.transcript || "(Không nhận diện được giọng phát âm rõ ràng)",
        wordCount: 0,
        pronunciation: 0,
        grammar: 0,
        vocabulary: 0,
        reflexes: 0,
        content: 0,
        fluency: 0,
        detailedFeedback: data.detailedFeedback || "❌ AI không nhận diện được giọng nói. Hãy kiểm tra Micro và đọc to rõ ràng hơn!",
        audioUrl: localAudioUrl,
        wordAnalysis: [],
      };
    }

    // 🔊 3. Dynamic Import Supabase Client an toàn khi Build Web
    let publicAudioUrl = '';
    try {
      const supabaseModule = await import('@/lib/supabaseClient').catch(() => null) 
                           || await import('@/lib/supabase').catch(() => null);

      if (supabaseModule) {
        const supabase = supabaseModule.supabase || supabaseModule.default;
        if (supabase) {
          // A. Upload Storage
          if (supabase.storage) {
            const filePath = `student_audios/${userId || 'guest'}_${Date.now()}.${ext}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('recordings')
              .upload(filePath, audioBlob, {
                contentType: mimeType,
                upsert: true,
              });

            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage
                .from('recordings')
                .getPublicUrl(uploadData.path);

              publicAudioUrl = urlData?.publicUrl || '';
            } else {
              console.warn("Upload Storage error:", uploadError);
            }
          }

          // 💾 B. Luôn luôn lưu kết quả bài làm vào Database (không phụ thuộc vào publicAudioUrl)
          if (userId) {
            const { error: dbError } = await supabase.from('assessment_results').insert([
              {
                user_id: userId,
                score: data.score ?? 0,
                transcript: data.transcript,
                feedback: data.detailedFeedback || "Đánh giá hoàn tất.",
                audio_url: publicAudioUrl || localAudioUrl, // Nếu upload trễ thì dùng URL dự phòng
              },
            ]);

            if (dbError) {
              console.error("Lỗi lưu DB assessment_results:", dbError);
            }
          }
        }
      }
    } catch (storageErr) {
      console.warn("Lỗi upload storage/database:", storageErr);
    }

    // 🎯 4. Trả kết quả về UI (Ưu tiên public URL, nếu rỗng sẽ dùng local Blob URL cho sinh viên nghe lại)
    return {
      score: data.score ?? 0,
      isWin: data.isWin ?? (data.score >= 60),
      transcript: data.transcript,
      wordCount: data.wordCount ?? 0,
      pronunciation: data.pronunciation ?? 0,
      grammar: data.grammar ?? 0,
      vocabulary: data.vocabulary ?? 0,
      reflexes: data.reflexes ?? 0,
      content: data.content ?? 0,
      fluency: data.fluency ?? 0,
      detailedFeedback: data.detailedFeedback || "Đánh giá hoàn tất.",
      audioUrl: publicAudioUrl || localAudioUrl,
      wordAnalysis: data.wordAnalysis || [],
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
      audioUrl: localAudioUrl,
      wordAnalysis: [],
    };
  }
};