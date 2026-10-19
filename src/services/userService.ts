// src/services/userService.ts
import { supabase } from '../utils/supabase';

export interface RoleplaySubmission {
  id?: string;
  studentName?: string;
  pairName?: string;
  score: number;
  mode: string;
  cefrLevel: string;
  transcript: string;
  audioUrl?: string;
  feedback: string;
  timestamp: string;
}

export const saveSubmissionToCloud = async (submission: RoleplaySubmission) => {
  try {
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    let displayName = submission.pairName || submission.studentName || 'Sinh viên';

    const formattedFeedback = `[${currentMode} - ${level} | ${displayName}]: ${submission.feedback || ''}`;

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

export const fetchSubmissionsFromCloud = async (): Promise<RoleplaySubmission[]> => {
  try {
    if (!supabase) return [];

    const { data: results, error } = await supabase
      .from('assessment_results')
      .select('id, score, transcript, feedback, audio_url, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !results) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, student_code');

    const profileMap: Record<string, string> = {};
    if (profiles) {
      profiles.forEach((p: any) => {
        profileMap[p.id] = p.full_name || p.student_code || 'Sinh viên';
      });
    }

    return results.map((item: any) => {
      let mode = 'TRẠM 2';
      let cefrLevel = 'A1';
      let playerName = profileMap[item.user_id] || 'Sinh viên';
      let cleanFeedback = item.feedback || '';

      if (cleanFeedback && cleanFeedback.startsWith('[') && cleanFeedback.includes(']:')) {
        const parts = cleanFeedback.split(']:');
        const headerTag = parts[0].replace('[', '');
        cleanFeedback = parts.slice(1).join(']:').trim();

        const tagParts = headerTag.split(' | ');
        const metaParts = tagParts[0].split(' - ');

        mode = String(metaParts[0] || 'TRẠM 2').trim().toUpperCase();
        cefrLevel = String(metaParts[1] || 'A1').trim().toUpperCase();

        if (tagParts.length > 1 && tagParts[1].trim()) {
          playerName = tagParts[1].trim();
        }
      }

      return {
        id: item.id || String(Math.random()),
        studentName: playerName || 'Sinh viên',
        pairName: playerName || 'Sinh viên',
        score: Number(item.score) || 0,
        mode: String(mode || 'TRẠM 2').toUpperCase(),
        cefrLevel: String(cefrLevel || 'A1').toUpperCase(),
        transcript: item.transcript || '',
        audioUrl: item.audio_url || '',
        feedback: cleanFeedback,
        timestamp: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
      };
    });
  } catch (err) {
    console.warn("⚠️ Lỗi fetchSubmissionsFromCloud:", err);
  }
  return [];
};

// 🎯 HÀM LẤY BẢNG XẾP HẠNG AN TOÀN (CHỐNG SẬP MÀN HÌNH)
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