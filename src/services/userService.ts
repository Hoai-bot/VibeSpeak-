// src/services/userService.ts
import { supabase } from '../utils/supabase';

export interface RoleplaySubmission {
  id?: string;
  studentName?: string;
  pairName?: string;
  className?: string; // 🎯 Bổ sung Tên lớp / Mã lớp
  score: number;
  mode: string;
  cefrLevel: string;
  transcript: string;
  audioUrl?: string;
  feedback: string;
  timestamp: string;
}

const LOCAL_HISTORY_KEY = 'vibespeak_user_submissions_history';

// Chuyển Audio Blob sang Base64 nhỏ gọn để Giáo viên phát được trực tiếp
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string || '');
    reader.readAsDataURL(blob);
  });
};

export const saveSubmissionToCloud = async (submission: RoleplaySubmission) => {
  try {
    // 1. Lưu Local cho Sinh viên
    try {
      const existingLocal = localStorage.getItem(LOCAL_HISTORY_KEY);
      const historyList: RoleplaySubmission[] = existingLocal ? JSON.parse(existingLocal) : [];
      historyList.unshift(submission);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList.slice(0, 20)));
    } catch (e) {}

    // 2. Gửi lên Supabase Cloud cho Bảng Giáo viên
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    const className = submission.className || 'LỚP CHUNG';
    let displayName = submission.pairName || submission.studentName || 'Sinh viên';

    // Đóng gói thông tin Lớp vào Header nhận diện
    const formattedFeedback = `[${currentMode} - ${level} | CLASS: ${className} | ${displayName}]: ${submission.feedback || ''}`;

    const { error } = await supabase.from('assessment_results').insert([
      {
        user_id: userId,
        score: submission.score || 0,
        transcript: submission.transcript || '',
        feedback: formattedFeedback,
        audio_url: submission.audioUrl || '', // Base64 Audio DataURL
      },
    ]);

    if (error) {
      console.error("❌ Lỗi insert dữ liệu lên Supabase:", error);
    }
  } catch (err) {
    console.warn("⚠️ Lỗi saveSubmissionToCloud:", err);
  }
};

export const fetchUserSubmissions = async (): Promise<RoleplaySubmission[]> => {
  try {
    const localData = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (localData) {
      const parsed: RoleplaySubmission[] = JSON.parse(localData);
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return await fetchSubmissionsFromCloud();
};

// 🎯 HÀM LẤY DỮ LIỆU BẢNG GIÁO VIÊN LỌC THEO LỚP & NGÀY
export const fetchSubmissionsFromCloud = async (selectedClass?: string): Promise<RoleplaySubmission[]> => {
  try {
    if (!supabase) return [];

    const { data: results, error } = await supabase
      .from('assessment_results')
      .select('id, score, transcript, feedback, audio_url, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !results) return [];

    const parsedList: RoleplaySubmission[] = results.map((item: any) => {
      let mode = 'TRẠM 2';
      let cefrLevel = 'A1';
      let extractedClass = 'LỚP CHUNG';
      let playerName = 'Sinh viên';
      let cleanFeedback = item.feedback || '';

      if (cleanFeedback && cleanFeedback.startsWith('[') && cleanFeedback.includes(']:')) {
        const parts = cleanFeedback.split(']:');
        const headerTag = parts[0].replace('[', '');
        cleanFeedback = parts.slice(1).join(']:').trim();

        const tagParts = headerTag.split(' | ');
        const metaParts = tagParts[0].split(' - ');

        mode = String(metaParts[0] || 'TRẠM 2').trim().toUpperCase();
        cefrLevel = String(metaParts[1] || 'A1').trim().toUpperCase();

        tagParts.forEach((tag) => {
          if (tag.startsWith('CLASS:')) {
            extractedClass = tag.replace('CLASS:', '').trim();
          } else if (!tag.includes('-') && tag.trim()) {
            playerName = tag.trim();
          }
        });
      }

      return {
        id: item.id || String(Math.random()),
        studentName: playerName,
        pairName: playerName,
        className: extractedClass,
        score: Number(item.score) || 0,
        mode: String(mode).toUpperCase(),
        cefrLevel: String(cefrLevel).toUpperCase(),
        transcript: item.transcript || '',
        audioUrl: item.audio_url || '',
        feedback: cleanFeedback,
        timestamp: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
      };
    });

    // Lọc theo Lớp nếu Giáo viên chọn lọc
    if (selectedClass && selectedClass !== 'ALL') {
      return parsedList.filter(s => s.className?.toUpperCase() === selectedClass.toUpperCase());
    }

    return parsedList;
  } catch (err) {
    console.warn("⚠️ Lỗi fetchSubmissionsFromCloud:", err);
  }
  return [];
};

export const fetchTopLeaderboard = async () => {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('assessment_results')
      .select('score, created_at, user_id, feedback')
      .order('score', { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return data.map((item: any, idx: number) => {
      let name = 'Chiến binh';
      let cleanFeedback = item.feedback || '';

      if (cleanFeedback && cleanFeedback.includes('|') && cleanFeedback.includes(']:')) {
        const parts = cleanFeedback.split(']:')[0].split('|');
        if (parts.length > 1 && parts[1].trim()) {
          name = parts[1].trim();
        }
      }

      return {
        rank: idx + 1,
        name: String(name || 'Chiến binh'),
        score: Number(item.score) || 0,
        date: item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''
      };
    });
  } catch (e) {
    console.warn("⚠️ Lỗi fetchTopLeaderboard:", e);
    return [];
  }
};