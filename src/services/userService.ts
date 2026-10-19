// src/services/userService.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hdifryokbfssibhsnpja.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface RoleplaySubmission {
  id?: string;
  studentName?: string;
  pairName?: string;
  mode: string;
  cefrLevel: string;
  score: number;
  transcript: string;
  feedback: string;
  audioUrl?: string;
  timestamp: string;
}

export interface UserProgress {
  score: number;
  completedStations: string[];
  totalSubmissions: number;
}

const PROGRESS_KEY = 'vibespeak_user_progress';

// 🎯 1. BỔ SUNG HÀM CẬP NHẬT TIẾN TRÌNH NGƯỜI DÙNG (ĐÃ FIX LỖI TYPEERROR)
export function updateUserProgress(newScore: number, stationId?: string | number): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    let progress: UserProgress = raw ? JSON.parse(raw) : { score: 0, completedStations: [], totalSubmissions: 0 };

    progress.score += newScore;
    progress.totalSubmissions += 1;

    if (stationId && !progress.completedStations.includes(String(stationId))) {
      progress.completedStations.push(String(stationId));
    }

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return progress;
  } catch (e) {
    console.warn('Lỗi cập nhật tiến trình:', e);
    return { score: newScore, completedStations: [], totalSubmissions: 1 };
  }
}

export function getUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { score: 0, completedStations: [], totalSubmissions: 0 };
  } catch {
    return { score: 0, completedStations: [], totalSubmissions: 0 };
  }
}

// 🎯 2. LƯU BÀI NỘP TRỰC TIẾP LÊN SUPABASE CLOUD
export async function saveRoleplaySubmission(submission: Omit<RoleplaySubmission, 'id' | 'timestamp'>) {
  try {
    const { data, error } = await supabase.from('submissions').insert([
      {
        student_name: submission.studentName || 'Sinh viên',
        pair_name: submission.pairName || '',
        mode: submission.mode,
        cefr_level: submission.cefrLevel,
        score: submission.score,
        transcript: submission.transcript,
        feedback: submission.feedback,
        audio_url: submission.audioUrl || '',
      },
    ]).select();

    if (error) {
      console.error('Lỗi đẩy dữ liệu lên Supabase:', error.message);
    }
    return data;
  } catch (err) {
    console.error('Không thể kết nối Supabase Cloud:', err);
  }
}

export const saveSubmissionForTeacher = saveRoleplaySubmission;

// 🎯 3. LẤY TRỰC TIẾP BÀI THI MỚI NHẤT TỪ CLOUD CHO GIÁO VIÊN
export async function fetchSubmissionsFromCloud(): Promise<RoleplaySubmission[]> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Lỗi lấy bài từ Supabase:', error?.message);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      studentName: item.student_name,
      pairName: item.pair_name,
      mode: item.mode,
      cefrLevel: item.cefr_level,
      score: item.score,
      transcript: item.transcript,
      feedback: item.feedback,
      audioUrl: item.audio_url,
      timestamp: new Date(item.created_at).toLocaleString('vi-VN'),
    }));
  } catch (e) {
    console.error('Lỗi kết nối Supabase:', e);
    return [];
  }
}

// 🎯 4. LẤY TOP 5 LEADERBOARD BẢNG VÀNG
export async function fetchTopLeaderboard(): Promise<RoleplaySubmission[]> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('score', { ascending: false })
      .limit(5);

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      studentName: item.student_name,
      pairName: item.pair_name,
      mode: item.mode,
      cefrLevel: item.cefr_level,
      score: item.score,
      transcript: item.transcript,
      feedback: item.feedback,
      audioUrl: item.audio_url,
      timestamp: new Date(item.created_at).toLocaleString('vi-VN'),
    }));
  } catch (e) {
    return [];
  }
}