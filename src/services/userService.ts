// src/services/userService.ts
import { supabase } from '../utils/supabase';

export interface RoleplaySubmission {
  id?: string;
  studentName?: string;
  pairName?: string;
  className?: string;
  score: number;
  mode: string;
  cefrLevel: string;
  transcript: string;
  audioUrl?: string;
  feedback: string;
  timestamp: string;
  rank?: number;
}

const LOCAL_HISTORY_KEY = 'vibespeak_user_submissions_history';

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    if (!blob) return resolve('');
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
};

// 🎯 HÀM LƯU BÀI KHỚP CHUẨN 100% VỚI BẢNG submissions TRÊN SUPABASE DÒNG THEO DÒNG
export const saveSubmissionToCloud = async (submission: RoleplaySubmission) => {
  try {
    // 1. Lưu dự phòng LocalStorage
    try {
      const existingLocal = localStorage.getItem(LOCAL_HISTORY_KEY);
      const historyList: RoleplaySubmission[] = existingLocal ? JSON.parse(existingLocal) : [];
      historyList.unshift(submission);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList.slice(0, 30)));
    } catch (e) {}

    if (!supabase) return;

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    const className = submission.className || 'LỚP CHUNG';
    const studentName = submission.studentName || 'Sinh viên VibeSpeak';
    
    // Ghép mã lớp vào pair_name để Giáo viên lọc và đọc được mã lớp dễ dàng
    const pairNameWithClass = submission.pairName 
      ? `[CLASS: ${className}] ${submission.pairName}`
      : `[CLASS: ${className}] ${studentName}`;

    // 🎯 CHỈ INSERT CÁC CỘT CÓ THỰC TRÊN DỮ LIỆU CỦA BẠN
    const { error } = await supabase.from('submissions').insert([
      {
        student_name: studentName,
        pair_name: pairNameWithClass,
        mode: currentMode,
        cefr_level: level,
        score: Number(submission.score) || 0,
        transcript: submission.transcript || '',
        feedback: submission.feedback || '',
        audio_url: submission.audioUrl || '',
      },
    ]);

    if (error) {
      console.error("❌ Lỗi lưu dữ liệu lên Supabase (submissions):", error.code, error.message, error.details);
    }
  } catch (err) {
    console.warn("⚠️ Lỗi saveSubmissionToCloud:", err);
  }
};

export const saveSubmissionForTeacher = saveSubmissionToCloud;

// 🎯 HÀM TRUY XUẤT BẢNG submissions VÀ TỰ ĐỘNG BÓC TÁCH MÃ LỚP DỄ DÀNG
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

      // Bóc tách Mã Lớp từ chuỗi pair_name
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

    // Sắp xếp bài mới nộp lên đầu tiên
    parsedList.sort((a: any, b: any) => b.rawCreatedAt - a.rawCreatedAt);

    let filtered = parsedList;
    if (selectedClass && selectedClass !== 'ALL') {
      filtered = parsedList.filter(
        (s) => s.className?.trim().toUpperCase() === selectedClass.trim().toUpperCase()
      );
    }

    // Tính thứ hạng bài nộp theo điểm số từ cao xuống thấp
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

export const updateUserProgress = async (score: number, station: number) => {};