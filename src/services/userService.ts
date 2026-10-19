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

// 🎯 HÀM LƯU BÀI NỘP TRẠM 2 CHUẨN XỬ LÝ AUDIO URL
export const saveSubmissionToCloud = async (submission: RoleplaySubmission) => {
  try {
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    let displayName = submission.pairName || submission.studentName || 'Sinh viên';

    const formattedFeedback = `[${currentMode} - ${level} | ${displayName}]: ${submission.feedback || ''}`;

    // Đảm bảo audioUrl không bị null hoặc empty string
    const validAudioUrl = submission.audioUrl && submission.audioUrl.length > 10 
      ? submission.audioUrl 
      : '';

    const { error } = await supabase.from('assessment_results').insert([
      {
        user_id: userId,
        score: submission.score || 0,
        transcript: submission.transcript || '',
        feedback: formattedFeedback,
        audio_url: validAudioUrl,
      },
    ]);

    if (error) {
      console.error("❌ Lỗi insert dữ liệu Trạm 2 lên Supabase:", error);
    } else {
      console.log("✅ Đã lưu bài nộp Trạm 2 kèm file Audio thành công!");
    }
  } catch (err) {
    console.warn("⚠️ Lỗi saveSubmissionToCloud:", err);
  }
};

// 🎯 HÀM TẢI BÀI NỘP VỀ BẢNG GIÁO VIÊN KÈM AUDIO CHUẨN
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
        audioUrl: item.audio_url || '', // 👈 Nạp nguyên vẹn audio_url
        feedback: cleanFeedback,
        timestamp: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
      };
    });
  } catch (err) {
    console.warn("⚠️ Lỗi fetchSubmissionsFromCloud:", err);
  }
  return [];
};