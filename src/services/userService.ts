// src/services/userService.ts

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

// 🎯 HÀM LƯU BÀI NỘP TRẠM 2 (RELAY, ROLEPLAY, SOLO) LÊN SUPABASE
export const saveSubmissionToCloud = async (submission: RoleplaySubmission) => {
  try {
    const supabaseModule = await import('../lib/supabaseClient').catch(() => null)
                         || await import('../lib/supabase').catch(() => null)
                         || await import('@/lib/supabaseClient').catch(() => null);

    if (supabaseModule) {
      const supabase = supabaseModule.supabase || supabaseModule.default;
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        const currentMode = (submission.mode || 'SOLO').toUpperCase();
        const level = (submission.cefrLevel || 'A1').toUpperCase();
        let displayName = submission.pairName || submission.studentName || 'Sinh viên';

        // Chuẩn hóa định dạng lưu trữ
        const formattedFeedback = `[${currentMode} - ${level} | ${displayName}]: ${submission.feedback || ''}`;

        const { error } = await supabase.from('assessment_results').insert([
          {
            user_id: userId || null,
            score: submission.score || 0,
            transcript: submission.transcript || '',
            feedback: formattedFeedback,
            audio_url: submission.audioUrl || '',
          },
        ]);

        if (error) {
          console.error("❌ Lỗi insert dữ liệu Trạm 2 lên Supabase:", error);
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Lỗi saveSubmissionToCloud:", err);
  }
};

// 🎯 HÀM TẢI DỮ LIỆU VỀ BẢNG GIÁO VIÊN
export const fetchSubmissionsFromCloud = async (): Promise<RoleplaySubmission[]> => {
  try {
    const supabaseModule = await import('../lib/supabaseClient').catch(() => null)
                         || await import('../lib/supabase').catch(() => null)
                         || await import('@/lib/supabaseClient').catch(() => null);

    if (supabaseModule) {
      const supabase = supabaseModule.supabase || supabaseModule.default;
      if (supabase) {
        const { data: results, error } = await supabase
          .from('assessment_results')
          .select('id, score, transcript, feedback, audio_url, created_at, user_id')
          .order('created_at', { ascending: false });

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, student_code');

        const profileMap: Record<string, string> = {};
        if (profiles) {
          profiles.forEach((p: any) => {
            profileMap[p.id] = p.full_name || p.student_code || 'Sinh viên';
          });
        }

        if (!error && results) {
          return results.map((item: any) => {
            let mode = 'SOLO';
            let cefrLevel = 'A1';
            let playerName = profileMap[item.user_id] || 'Sinh viên';
            let cleanFeedback = item.feedback || '';

            // Bóc tách thông tin [MODE - LEVEL | PLAYER_NAME]: Feedback
            if (cleanFeedback.startsWith('[') && cleanFeedback.includes(']:')) {
              const parts = cleanFeedback.split(']:');
              const headerTag = parts[0].replace('[', '');
              cleanFeedback = parts.slice(1).join(']:').trim();

              const tagParts = headerTag.split(' | ');
              const metaParts = tagParts[0].split(' - ');

              mode = (metaParts[0] || 'SOLO').trim().toUpperCase();
              cefrLevel = (metaParts[1] || 'A1').trim();

              if (tagParts.length > 1 && tagParts[1].trim()) {
                playerName = tagParts[1].trim();
              }
            }

            return {
              id: item.id,
              studentName: playerName,
              pairName: playerName,
              score: item.score || 0,
              mode: mode,
              cefrLevel: cefrLevel,
              transcript: item.transcript || '',
              audioUrl: item.audio_url || '',
              feedback: cleanFeedback,
              timestamp: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
            };
          });
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Lỗi fetchSubmissionsFromCloud:", err);
  }
  return [];
};