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
}

const LOCAL_HISTORY_KEY = 'vibespeak_user_submissions_history';

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string || '');
    reader.readAsDataURL(blob);
  });
};

export const saveSubmissionToCloud = async (submission: RoleplaySubmission) => {
  try {
    try {
      const existingLocal = localStorage.getItem(LOCAL_HISTORY_KEY);
      const historyList: RoleplaySubmission[] = existingLocal ? JSON.parse(existingLocal) : [];
      historyList.unshift(submission);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList.slice(0, 20)));
    } catch (e) {}

    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    const className = submission.className || 'LỚP CHUNG';
    let displayName = submission.pairName || submission.studentName || 'Sinh viên';

    const formattedFeedback = `[${currentMode} - ${level} | CLASS: ${className} | ${displayName}]: ${submission.feedback || ''}`;

    const { error } = await supabase.from('assessment_results').insert([
      {
        user_id: userId,
        score: submission.score || 0,
        transcript: submission.transcript || '',
        feedback: formattedFeedback,
        audio_url: submission.audioUrl || '',
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

// 🎯 HÀM LẤY DỮ LIỆU CHUẨN XÁC TÊN SINH VIÊN VÀ MÃ LỚP
export const fetchSubmissionsFromCloud = async (selectedClass?: string): Promise<RoleplaySubmission[]> => {
  try {
    if (!supabase) return [];

    const { data: results, error } = await supabase
      .from('assessment_results')
      .select('id, score, transcript, feedback, audio_url, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !results) return [];

    const parsedList: RoleplaySubmission[] = results.map((item: any) => {
      let mode = 'SOLO';
      let cefrLevel = 'A1';
      let extractedClass = 'LỚP CHUNG';
      let playerName = 'Chiến binh';
      let cleanFeedback = item.feedback || '';

      if (cleanFeedback && cleanFeedback.startsWith('[') && cleanFeedback.includes(']:')) {
        const parts = cleanFeedback.split(']:');
        const headerTag = parts[0].replace('[', '');
        cleanFeedback = parts.slice(1).join(']:').trim();

        // Tách các trường bằng dấu phân cách '|'
        const tagParts = headerTag.split('|').map(p => p.trim());

        // Phần 0: [MODE - LEVEL]
        if (tagParts[0]) {
          const meta = tagParts[0].split('-');
          mode = String(meta[0] || 'SOLO').trim().toUpperCase();
          cefrLevel = String(meta[1] || 'A1').trim().toUpperCase();
        }

        // Duyệt các phần còn lại để phân định rõ Tên Lớp và Tên Sinh Viên
        for (let i = 1; i < tagParts.length; i++) {
          const part = tagParts[i];
          if (part.startsWith('CLASS:')) {
            extractedClass = part.replace('CLASS:', '').trim().toUpperCase() || 'LỚP CHUNG';
          } else if (part.length > 0) {
            playerName = part;
          }
        }
      }

      // Làm sạch tên lớp
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
        timestamp: item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '',
      };
    });

    // Lọc theo Lớp nếu Giáo viên / Sinh viên chọn
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
  return await fetchSubmissionsFromCloud('ALL');
};