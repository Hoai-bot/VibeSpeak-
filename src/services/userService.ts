// src/services/userService.ts
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase Client
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

const STORAGE_KEY = 'vibespeak_teacher_submissions';
const PROGRESS_KEY = 'vibespeak_user_progress';

// 1. QUẢN LÝ TIẾN TRÌNH NGƯỜI DÙNG
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
    console.warn('Lỗi cập nhật tiến trình người dùng:', e);
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

// 2. LƯU BÀI NỘP (Vừa lưu Local, vừa đẩy vĩnh viễn lên Supabase Cloud)
export async function saveRoleplaySubmission(submission: Omit<RoleplaySubmission, 'id' | 'timestamp'>) {
  const timestamp = new Date().toLocaleString('vi-VN');
  const newSubmission: RoleplaySubmission = {
    ...submission,
    id: Date.now().toString(),
    timestamp,
  };

  // Lưu tạm vào LocalStorage
  try {
    const existing = getSubmissionsForTeacher();
    existing.unshift(newSubmission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.warn('Lỗi lưu LocalStorage:', e);
  }

  // Đẩy vĩnh viễn lên Supabase Realtime DB
  try {
    const { error } = await supabase.from('submissions').insert([
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
    ]);
    if (error) console.error('Lỗi đẩy dữ liệu lên Supabase:', error.message);
  } catch (err) {
    console.error('Không thể kết nối Supabase Cloud:', err);
  }

  return newSubmission;
}

// 🎯 BỔ SUNG ALIAS ĐỂ KHÔNG BỊ LỖI MÀN HÌNH CHẤM ĐIỂM
export const saveSubmissionForTeacher = saveRoleplaySubmission;

// 3. LẤY TẤT CẢ BÀI NỘP CHO GIÁO VIÊN (Lấy trực tiếp từ Supabase Cloud)
export async function fetchSubmissionsFromCloud(): Promise<RoleplaySubmission[]> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Không thể lấy bài từ Cloud, dùng dữ liệu Local:', error?.message);
      return getSubmissionsForTeacher();
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
    return getSubmissionsForTeacher();
  }
}

// Hàm dự phòng đọc LocalStorage
export function getSubmissionsForTeacher(): RoleplaySubmission[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}