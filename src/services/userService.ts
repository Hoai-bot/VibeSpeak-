// src/services/userService.ts
import { supabase } from '../utils/supabase';
import { recordStudySession } from './streakService';
import { getCurrentWeekRange } from './leagueService';

export interface RoleplaySubmission {
  id?: string;
  studentName?: string;
  pairName?: string;
  className?: string;
  score: number;
  mode: string;
  cefrLevel: string;
  transcript: string;
  audioUrl?: string; // Chứa URL CDN công khai từ bucket recordings
  feedback: string;
  timestamp: string;
  rank?: number;
}

const LOCAL_HISTORY_KEY = 'vibespeak_user_submissions_history';
const OFFLINE_QUEUE_KEY = 'vibespeak_pending_submissions_queue';

// 🎯 1. LƯU BÀI VÀO HÀNG ĐỢI KHI RỚT MẠNG HOẶC SUPABASE LỖI KẾT NỐI
export const queueOfflineSubmission = (submission: RoleplaySubmission) => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: RoleplaySubmission[] = raw ? JSON.parse(raw) : [];
    queue.push({
      ...submission,
      timestamp: submission.timestamp || new Date().toLocaleTimeString('vi-VN')
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log("📦 Đã xếp bài vào hàng đợi Offline chờ mạng ổn định.");
  } catch (e) {
    console.warn("Không thể lưu hàng đợi offline:", e);
  }
};

// 🎯 2. TỰ ĐỘNG GỬI BÙ KHI THIẾT BỊ CÓ MẠNG TRỞ LẠI
export const processOfflineQueue = async () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  if (!supabase) return;

  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;

    const queue: RoleplaySubmission[] = JSON.parse(raw);
    if (queue.length === 0) return;

    console.log(`🔄 Phát hiện kết nối mạng! Đang gửi bù ${queue.length} bài nộp...`);
    const remainingQueue: RoleplaySubmission[] = [];

    for (const item of queue) {
      try {
        const { error } = await supabase.from('submissions').insert([
          {
            student_name: item.studentName || 'Học viên VibeSpeak',
            pair_name: item.pairName,
            mode: item.mode,
            cefr_level: item.cefrLevel,
            score: Number(item.score) || 0,
            transcript: item.transcript || '',
            feedback: item.feedback || '',
            audio_url: item.audioUrl || '',
          }
        ]);

        if (error) {
          remainingQueue.push(item);
        } else {
          // Gửi bù thành công -> Cập nhật Streak
          recordStudySession();
        }
      } catch (err) {
        remainingQueue.push(item);
      }
    }

    if (remainingQueue.length > 0) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    } else {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      console.log("✅ Đã giải phóng toàn bộ hàng đợi nộp bài offline!");
    }
  } catch (e) {
    console.warn("Lỗi xử lý processOfflineQueue:", e);
  }
};

// 🎯 3. LẮNG NGHE SỰ KIỆN ONLINE VÀ QUÉT ĐỊNH KỲ MỖI 30 GIÂY
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processOfflineQueue();
  });
  setInterval(processOfflineQueue, 30000);
}

// 🎯 4. HÀM UPLOAD THẲNG BLOB LÊN BUCKET recordings TRÊN SUPABASE
export const uploadAudioToSupabaseStorage = async (audioBlob: Blob | null): Promise<string> => {
  if (!audioBlob || !supabase) return '';

  try {
    const fileExt = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('aac') ? 'aac' : 'webm';
    const fileName = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `audio/${fileName}`;

    // Upload Blob trực tiếp lên bucket 'recordings' đã cấp quyền RLS
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filePath, audioBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: audioBlob.type || 'audio/webm',
      });

    if (uploadError) {
      console.warn("⚠️ Upload Supabase Storage thất bại:", uploadError.message);
      return '';
    }

    // Lấy URL công khai CDN
    const { data: publicUrlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || '';
  } catch (err) {
    console.warn("⚠️ Lỗi uploadAudioToSupabaseStorage:", err);
    return '';
  }
};

// 🎯 5. HÀM LƯU BÀI NỘP VÀO DATABASE VÀ STORAGE CDN (KÈM BẢO VỆ OFFLINE & TỰ ĐỘNG CẬP NHẬT STREAK)
export const saveSubmissionToCloud = async (submission: RoleplaySubmission, audioBlob?: Blob | null) => {
  // 🔥 TÍNH NĂNG STREAK: Ghi nhận ngay phiên học khi nộp bài
  recordStudySession();

  let finalAudioUrl = submission.audioUrl || '';

  // 1. Lưu dự phòng lịch sử cục bộ
  try {
    const existingLocal = localStorage.getItem(LOCAL_HISTORY_KEY);
    const historyList: RoleplaySubmission[] = existingLocal ? JSON.parse(existingLocal) : [];
    historyList.unshift(submission);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList.slice(0, 30)));
  } catch (e) {}

  const currentMode = String(submission.mode || 'SOLO').toUpperCase();
  const level = String(submission.cefrLevel || 'A1').toUpperCase();
  const className = submission.className || 'LỚP CHUNG';
  const studentName = submission.studentName || 'Sinh viên VibeSpeak';
  
  const pairNameWithClass = submission.pairName 
    ? `[CLASS: ${className}] ${submission.pairName}`
    : `[CLASS: ${className}] ${studentName}`;

  const payload: RoleplaySubmission = {
    ...submission,
    studentName,
    pairName: pairNameWithClass,
    mode: currentMode,
    cefrLevel: level,
    className
  };

  // 2. Nếu rớt mạng ngay từ đầu, đưa thẳng vào hàng đợi offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    queueOfflineSubmission(payload);
    return;
  }

  try {
    if (!supabase) {
      queueOfflineSubmission(payload);
      return;
    }

    // Upload audio blob lên Supabase Storage nếu có
    if (audioBlob) {
      try {
        const cdnUrl = await uploadAudioToSupabaseStorage(audioBlob);
        if (cdnUrl) {
          finalAudioUrl = cdnUrl;
        }
      } catch (audioErr) {
        console.warn("⚠️ Bỏ qua upload audio do lỗi mạng:", audioErr);
      }
    }

    payload.audioUrl = finalAudioUrl;

    // Lưu vào bảng submissions
    const { error } = await supabase.from('submissions').insert([
      {
        student_name: studentName,
        pair_name: pairNameWithClass,
        mode: currentMode,
        cefr_level: level,
        score: Number(submission.score) || 0,
        transcript: submission.transcript || '',
        feedback: submission.feedback || '',
        audio_url: finalAudioUrl,
      },
    ]);

    if (error) {
      console.warn("❌ Lỗi mạng khi ghi nhận Supabase, chuyển vào hàng đợi Offline:", error.message);
      queueOfflineSubmission(payload);
    } else {
      // Gửi bài thành công -> Kiểm tra và đẩy các bài còn tồn đọng trong queue
      processOfflineQueue();
    }
  } catch (err) {
    console.warn("⚠️ Mạng chập chờn khi saveSubmissionToCloud, đưa vào hàng đợi:", err);
    queueOfflineSubmission(payload);
  }
};

export const saveSubmissionForTeacher = saveSubmissionToCloud;

// 🎯 6. HÀM TRUY VẤN BẢNG submissions DÀNH CHO GIÁO VIÊN
export const fetchSubmissionsFromCloud = async (selectedClass?: string): Promise<RoleplaySubmission[]> => {
  try {
    if (!supabase) return [];

    const { data: results, error } = await supabase
      .from('submissions')
      .select('id, student_name, pair_name, mode, cefr_level, score, transcript, feedback, audio_url, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error("❌ Lỗi truy vấn Supabase (submissions):", error.code, error.message, error.details);
      return [];
    }

    if (!results || results.length === 0) return [];

    const parsedList: RoleplaySubmission[] = results.map((item: any) => {
      let extractedClass = 'LỚP CHUNG';
      let rawPair = item.pair_name || '';

      if (rawPair.includes('[CLASS:') && rawPair.includes(']')) {
        const parts = rawPair.split(']');
        extractedClass = parts[0].replace('[CLASS:', '').trim().toUpperCase() || 'LỚP CHUNG';
        rawPair = parts.slice(1).join(']').trim();
      }

      return {
        id: item.id || String(Math.random()),
        studentName: item.student_name || 'Sinh viên VibeSpeak',
        pairName: rawPair || item.student_name || 'Học viên',
        className: extractedClass,
        score: Number(item.score) || 0,
        mode: String(item.mode || 'SOLO').toUpperCase(),
        cefrLevel: String(item.cefr_level || 'A1').toUpperCase(),
        transcript: item.transcript || '',
        audioUrl: item.audio_url || '',
        feedback: item.feedback || '',
        timestamp: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
        rawCreatedAt: item.created_at ? new Date(item.created_at).getTime() : 0,
      };
    });

    parsedList.sort((a: any, b: any) => b.rawCreatedAt - a.rawCreatedAt);

    let filtered = parsedList;
    if (selectedClass && selectedClass !== 'ALL') {
      filtered = parsedList.filter(
        (s) => s.className?.trim().toUpperCase() === selectedClass.trim().toUpperCase()
      );
    }

    const sortedForRank = [...filtered].sort((a, b) => b.score - a.score);
    return filtered.map((item) => {
      const rankIndex = sortedForRank.findIndex((r) => r.id === item.id);
      return {
        ...item,
        rank: rankIndex !== -1 ? rankIndex + 1 : undefined,
      };
    });
  } catch (err) {
    console.warn("⚠️ Lỗi fetchSubmissionsFromCloud:", err);
  }
  return [];
};

export const fetchUserSubmissions = async (): Promise<RoleplaySubmission[]> => {
  return await fetchSubmissionsFromCloud('ALL');
};

export const fetchTopLeaderboard = async () => {
  return await fetchSubmissionsFromCloud('ALL');
};

export const updateUserProgress = async (station: number, xpToAdd: number, isWin: boolean = true) => {
  try {
    const key = `vibespeak_station_${station}_progress`;
    const current = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(current + xpToAdd));
  } catch (e) {}
};

// 🎯 7. TRUY VẤN BẢNG XẾP HẠNG GIẢI ĐẤU TUẦN (WEEKLY LEADERBOARD LEAGUES)
export const fetchWeeklyLeaderboard = async (selectedClass?: string): Promise<RoleplaySubmission[]> => {
  try {
    if (!supabase) return [];

    const { start, end } = getCurrentWeekRange();

    // Chỉ lấy các bài nộp phát sinh trong tuần hiện tại
    const query = supabase
      .from('submissions')
      .select('id, student_name, pair_name, mode, cefr_level, score, transcript, feedback, audio_url, created_at')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .limit(300);

    const { data: results, error } = await query;

    if (error) {
      console.warn("⚠️ Lỗi truy vấn weekly submissions:", error.message);
      return [];
    }

    if (!results || results.length === 0) return [];

    return results.map((item: any) => ({
      id: item.id || String(Math.random()),
      studentName: item.student_name || 'Học viên VibeSpeak',
      pairName: item.pair_name || item.student_name || 'Học viên',
      score: Number(item.score) || 0,
      mode: String(item.mode || 'SOLO').toUpperCase(),
      cefrLevel: String(item.cefr_level || 'A1').toUpperCase(),
      transcript: item.transcript || '',
      audioUrl: item.audio_url || '',
      feedback: item.feedback || '',
      timestamp: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
    }));
  } catch (err) {
    console.warn("Lỗi fetchWeeklyLeaderboard:", err);
    return [];
  }
};