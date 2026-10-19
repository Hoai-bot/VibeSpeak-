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

// 🎯 HÀM LƯU BÀI NỘP LÊN SUPABASE (BÓC TÁCH CHI TIẾT PHÂN VAI RELAY & ROLEPLAY)
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
        let displayName = submission.pairName || submission.studentName || 'Sinh viên';

        // Tự động gán nhãn chuẩn theo phân vai nếu chưa nhận được chuỗi tên
        if (currentMode === 'RELAY' && (displayName === 'Sinh viên' || displayName.toLowerCase().includes('bot'))) {
          displayName = 'Vinh (Person 1) & An (Person 2)';
        } else if (currentMode === 'ROLEPLAY' && (displayName === 'Sinh viên' || displayName.toLowerCase().includes('bot'))) {
          displayName = 'Sinh viên (Vai 1) & AI Partner (Vai 2)';
        }

        // Đóng gói Header thông tin: [MODE - LEVEL | PHÂN VAI DISPLAY]: Nội dung nhận xét
        const formattedFeedback = `[${currentMode} - ${submission.cefrLevel || 'A1'} | ${displayName}]: ${submission.feedback || ''}`;

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
          console.error("Lỗi lưu bài nộp Supabase:", error);
        }
      }
    }
  } catch (err) {
    console.warn("Lỗi saveSubmissionToCloud:", err);
  }
};

// 🎯 HÀM TẢI DỮ LIỆU BẢNG GIÁO VIÊN (HIỂN THỊ ĐÚNG CHUẨN PHÂN VAI VÀ CHẾ ĐỘ)
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

            // Bóc tách thông tin từ Header [MODE - LEVEL | PHÂN VAI]:
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

            // Định dạng hiển thị mặc định theo phân vai nếu tên người dùng mặc định
            if (mode === 'RELAY' && (playerName === 'Sinh viên' || playerName.toLowerCase().includes('bot'))) {
              playerName = 'Vinh (Person 1) & An (Person 2)';
            } else if (mode === 'ROLEPLAY' && (playerName === 'Sinh viên' || playerName.toLowerCase().includes('bot'))) {
              playerName = 'Sinh viên (Vai 1) & AI Partner (Vai 2)';
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
    console.warn("Lỗi fetchSubmissionsFromCloud:", err);
  }
  return [];
};