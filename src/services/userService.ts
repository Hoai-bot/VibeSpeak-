// src/services/userService.ts
// 🎯 Import DUY NHẤT một instance supabase duy nhất từ utils
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
    try {
      const existingLocal = localStorage.getItem(LOCAL_HISTORY_KEY);
      const historyList: RoleplaySubmission[] = existingLocal ? JSON.parse(existingLocal) : [];
      historyList.unshift(submission);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList.slice(0, 30)));
    } catch (e) {}

    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    const className = submission.className || 'LỚP CHUNG';
    let displayName = submission.pairName || submission.studentName || 'Sinh viên';

    const formattedFeedback = `[${currentMode} - ${level} | CLASS: ${className} | ${displayName}]: ${submission.feedback || ''}`;

    await supabase.from('assessment_results').insert([
      {
        user_id: userId,
        score: Number(submission.score) || 0,
        transcript: submission.transcript || '',
        feedback: formattedFeedback,
        audio_url: submission.audioUrl || '',
      },
    ]);
  } catch (err) {
    console.warn("Lỗi saveSubmissionToCloud:", err);
  }
};

export const saveSubmissionForTeacher = saveSubmissionToCloud;

// 🎯 HÀM TRUY XUẤT CHO HỒ SƠ CHIẾN BINH & BẢNG ĐIỂM
export const fetchSubmissionsFromCloud = async (selectedClass?: string): Promise<RoleplaySubmission[]> => {
  try {
    if (!supabase) return [];

    const { data: results, error } = await supabase
      .from('assessment_results')
      .select('id, score, transcript, feedback, audio_url, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(150);

    if (error || !results) return [];

    const parsedList: RoleplaySubmission[] = results.map((item: any) => {
      let mode = 'SOLO';
      let cefrLevel = 'A1';
      let extractedClass = 'LỚP CHUNG';
      let playerName = 'Học viên';
      let cleanFeedback = item.feedback || '';

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
          if (part.startsWith('CLASS:')) {
            extractedClass = part.replace('CLASS:', '').trim().toUpperCase() || 'LỚP CHUNG';
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
      };
    });

    let filtered = parsedList;
    if (selectedClass && selectedClass !== 'ALL') {
      filtered = parsedList.filter(
        (s) => s.className?.toUpperCase() === selectedClass.toUpperCase()
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

export const updateUserProgress = async (score: number, station: number) => {};