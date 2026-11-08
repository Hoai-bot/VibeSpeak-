// src/services/userService.ts
import { supabase } from '../utils/supabase';

export interface UserStats {
  displayName?: string;
  totalXp: number;
  totalScore: number;
  streak: number;
  completedLessons: number;
  level?: string;
  rank?: string;
  station1Completed: number;
  station2Wins: number;
  station2Losses: number;
}

export interface RoleplaySubmission {
  id?: string;
  studentName: string;
  pairName?: string;
  className?: string;
  score: number;
  mode: string; // 'solo' | 'relay' | 'roleplay' | 'SHADOWING' | 'EXPRESS'
  cefrLevel: string;
  transcript: string;
  audioUrl?: string;
  feedback: string;
  timestamp: string;
  rank?: number;
}

// 🎯 LẤY THÔNG SỐ THỐNG KÊ NGƯỜI HỌC CHO PROFILE SCREEN (chấp nhận tham số uid)
export async function getUserStats(uid?: string): Promise<UserStats> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const rawProgress = localStorage.getItem('vibe_user_progress');
      if (rawProgress) {
        const progress = JSON.parse(rawProgress);
        return {
          displayName: 'Học viên VibeSpeak',
          totalXp: progress.totalScore || 150,
          totalScore: progress.totalScore || 100,
          streak: 3,
          completedLessons: (progress.stationsPassed || []).length || 1,
          level: 'B1',
          rank: 'Cyber Challenger',
          station1Completed: 5,
          station2Wins: 3,
          station2Losses: 1
        };
      }
    } catch (e) {}
  }
  return {
    displayName: 'Học viên VibeSpeak',
    totalXp: 150,
    totalScore: 100,
    streak: 1,
    completedLessons: 1,
    level: 'B1',
    rank: 'Cyber Challenger',
    station1Completed: 0,
    station2Wins: 0,
    station2Losses: 0
  };
}

// 🎯 LƯU LỊCH SỬ TRẬN ĐẤU (cho phép gọi dạng 1 tham số hoặc 2 tham số: userId, matchData)
export async function saveMatchHistory(userIdOrData: any, matchData?: any): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const dataToSave = matchData || userIdOrData;
      const raw = localStorage.getItem('vibe_match_history');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ ...dataToSave, timestamp: new Date().toISOString() });
      localStorage.setItem('vibe_match_history', JSON.stringify(list.slice(0, 30)));
    } catch (e) {}
  }
}

// 🎯 LƯU THÔNG TIN NGƯỜI DÙNG (cho phép gọi dạng 1 tham số hoặc 3 tham số: uid, username, xp)
export async function saveUserData(userIdOrData: any, username?: string, xp?: number): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const payload = typeof userIdOrData === 'object' ? userIdOrData : { uid: userIdOrData, username, xp };
      localStorage.setItem('vibe_user_data', JSON.stringify(payload));
    } catch (e) {}
  }
}

// 🎯 LƯU KẾT QUẢ BÀI NỘP LÊN CLOUD SUPABASE
export async function saveSubmissionToCloud(
  submission: Omit<RoleplaySubmission, 'id'>,
  _audioBlob?: Blob // Tham số tương thích ngược
): Promise<RoleplaySubmission | null> {
  try {
    if (!supabase) {
      console.warn("Chưa cấu hình Supabase Client, lưu tạm vào LocalStorage.");
      saveToLocalFallback(submission);
      return { ...submission, id: `local_${Date.now()}` };
    }

    const payload = {
      student_name: submission.studentName,
      pair_name: submission.pairName || submission.studentName,
      class_name: submission.className || 'LỚP CHUNG',
      score: submission.score,
      mode: submission.mode,
      cefr_level: submission.cefrLevel,
      transcript: submission.transcript || '',
      audio_url: submission.audioUrl || '',
      feedback: submission.feedback || '',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('submissions')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Lỗi khi insert vào bảng submissions:", error.message);
      saveToLocalFallback(submission);
      return { ...submission, id: `local_${Date.now()}` };
    }

    return {
      id: data.id,
      studentName: data.student_name,
      pairName: data.pair_name,
      className: data.class_name,
      score: data.score,
      mode: data.mode,
      cefrLevel: data.cefr_level,
      transcript: data.transcript,
      audioUrl: data.audio_url,
      feedback: data.feedback,
      timestamp: submission.timestamp,
    };
  } catch (err) {
    console.warn("Lỗi ngoại lệ trong saveSubmissionToCloud:", err);
    saveToLocalFallback(submission);
    return { ...submission, id: `local_${Date.now()}` };
  }
}

// 🎯 LẤY DANH SÁCH BÀI NỘP VỀ DASHBOARD GIÁO VIÊN
export async function fetchSubmissionsFromCloud(className: string = 'ALL'): Promise<RoleplaySubmission[]> {
  try {
    if (!supabase) {
      return getLocalFallback();
    }

    let query = supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (className !== 'ALL') {
      query = query.ilike('class_name', `%${className.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Lỗi khi tải submissions từ Supabase:", error.message);
      return getLocalFallback();
    }

    if (!data || data.length === 0) return [];

    return data.map((item: any, index: number) => ({
      id: item.id,
      studentName: item.student_name,
      pairName: item.pair_name,
      className: item.class_name,
      score: item.score,
      mode: item.mode,
      cefrLevel: item.cefr_level,
      transcript: item.transcript,
      audioUrl: item.audio_url || '',
      feedback: item.feedback,
      timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString('vi-VN') : '',
      rank: index + 1,
    }));
  } catch (err) {
    console.warn("Lỗi khi lấy dữ liệu bảng điểm:", err);
    return getLocalFallback();
  }
}

// CẬP NHẬT TIẾN ĐỘ NGƯỜI DÙNG (EXPERIENCE & PASS)
export function updateUserProgress(stationIndex: number, pointsEarned: number, isPassed: boolean) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const rawProgress = localStorage.getItem('vibe_user_progress');
    let progress = rawProgress ? JSON.parse(rawProgress) : { totalScore: 0, stationsPassed: [] };
    
    progress.totalScore = (progress.totalScore || 0) + pointsEarned;
    if (isPassed && !progress.stationsPassed.includes(stationIndex)) {
      progress.stationsPassed.push(stationIndex);
    }
    localStorage.setItem('vibe_user_progress', JSON.stringify(progress));
  } catch (e) {}
}

// HÀM DỰ PHÒNG LOCALSTORAGE KHI MẤT MẠNG
function saveToLocalFallback(submission: Omit<RoleplaySubmission, 'id'>) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = localStorage.getItem('vibe_offline_submissions');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ ...submission, id: `offline_${Date.now()}` });
    localStorage.setItem('vibe_offline_submissions', JSON.stringify(list.slice(0, 50)));
  } catch (e) {}
}

function getLocalFallback(): RoleplaySubmission[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem('vibe_offline_submissions');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}