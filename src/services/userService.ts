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

export const saveSubmissionToCloud = async (submission: RoleplaySubmission) => {
  try {
    // 1. Lưu dự phòng vào LocalStorage
    try {
      const existingLocal = localStorage.getItem(LOCAL_HISTORY_KEY);
      const historyList: RoleplaySubmission[] = existingLocal ? JSON.parse(existingLocal) : [];
      historyList.unshift(submission);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList.slice(0, 30)));
    } catch (e) {}

    if (!supabase) return;

    // BỌC AN TOÀN TUYỆT ĐỐI KHI LẤY USER ID KHÔNG ĐỂ BỊ BÁO LỖI MODULE TREO APP
    let userId = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id || null;
    } catch (authErr) {
      console.warn("⚠️ Bỏ qua lấy user_id bị lỗi module, lưu bài dưới dạng guest:", authErr);
    }

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    const className = submission.className || 'LỚP CHUNG';
    let displayName = submission.pairName || submission.studentName || 'Sinh viên';

    const formattedFeedback = `[${currentMode} - ${level} | CLASS: ${className} | ${displayName}]: ${submission.feedback || ''}`;

    // 🎯 ĐỒNG BỘ LƯU VÀO BẢNG 'submissions'
    const { error } = await supabase.from('submissions').insert([
      {
        user_id: userId,
        score: Number(submission.score) || 0,
        transcript: submission.transcript || '',
        feedback: formattedFeedback,
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

// 🎯 HÀM TRUY XUẤT ĐỒNG BỘ TỪ BẢNG 'submissions'
export const fetchSubmissionsFromCloud = async (selectedClass?: string): Promise<RoleplaySubmission[]> => {
  try {
    if (!supabase) return [];

    // 🎯 TRUY VẤN CHÍNH XÁC BẢNG 'submissions'
    const { data: results, error } = await supabase
      .from('submissions')
      .select('id, score, transcript, feedback, audio_url, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error("❌ Lỗi truy vấn Supabase (submissions):", error.code, error.message, error.details);
      return [];
    }

    if (!results || results.length === 0) return [];

    const parsedList: RoleplaySubmission[] = results.map((item: any) => {
      let mode = 'SOLO';
      let cefrLevel = 'A1';
      let extractedClass = 'LỚP CHUNG';
      let playerName = 'Học viên';
      let cleanFeedback = item.feedback || '';

      // 🎯 BÓC TÁCH MÃ LỚP CHUẨN TỪ CHUỖI FEEDBACK DÙ CÓ RÁC HAY KÝ TỰ ĐẶC BIỆT
      if (cleanFeedback && cleanFeedback.startsWith('[') && cleanFeedback.includes(']:')) {
        const parts = cleanFeedback.split(']:');
        const headerTag = parts[0].replace('[', '');
        cleanFeedback = parts.slice(1).join(']:').trim();

        const tagParts = headerTag.split('|').map((p) => p.trim());

        if (tagParts[0]) {
          const meta = tagParts[0].split('-');
          mode = String(meta[0] || 'SOLO').trim().toUpperCase();
          cefrLevel = String(meta[1] || 'A1').trim().toUpperCase();
        }

        for (let i = 1; i < tagParts.length; i++) {
          const part = tagParts[i];
          if (part.toUpperCase().startsWith('CLASS:')) {
            extractedClass = part.substring(6).trim().toUpperCase() || 'LỚP CHUNG';
          } else if (part.length > 0) {
            playerName = part;
          }
        }
      }

      if (extractedClass.startsWith('CLASS:')) {
        extractedClass = extractedClass.replace('CLASS:', '').trim();
      }
      if (!extractedClass) extractedClass = 'LỚP CHUNG';

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
        rawCreatedAt: item.created_at ? new Date(item.created_at).getTime() : 0,
      };
    });

    // Sắp xếp bài mới nhất lên đầu
    parsedList.sort((a: any, b: any) => b.rawCreatedAt - a.rawCreatedAt);

    let filtered = parsedList;
    if (selectedClass && selectedClass !== 'ALL') {
      filtered = parsedList.filter(
        (s) => s.className?.trim().toUpperCase() === selectedClass.trim().toUpperCase()
      );
    }

    // Tính thứ hạng bài nộp theo điểm số từ cao đến thấp
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