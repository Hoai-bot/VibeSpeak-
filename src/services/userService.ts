// src/services/userService.ts
import { supabase } from '../utils/supabase';

export interface UserStats {
  displayName?: string;
  totalXp: number;
  totalScore: number;
  streak: number;
  completedLessons: number;
  level?: string;
  rank?: string;
  station1Completed: number;
  station2Wins: number;
  station2Losses: number;
}

export interface RoleplaySubmission {
  id?: string;
  clientSubmissionId?: string;
  studentName: string;
  studentCode?: string;
  classCode?: string;
  pairName?: string;
  className?: string;
  score: number;
  manualScore?: number | null;
  teacherFeedback?: string | null;
  mode: string;
  cefrLevel: string;
  transcript: string;
  audioUrl?: string;
  feedback: string;
  timestamp: string;
  rank?: number;
}

// Chuẩn hóa mã lớp (xóa dấu cách, viết hoa: "tc cntt" -> "TCCNTT")
export function normalizeClassCode(raw?: string): string {
  const cleaned = (raw || '').toUpperCase().replace(/\s+/g, '').trim();
  return cleaned || 'PUBLIC';
}

// 🛡️ Hàm tự động lọc bỏ cột chưa tồn tại trên Supabase & chống ghi trùng theo client_submission_id
async function safeInsertSubmissionRecord(initialPayload: Record<string, any>) {
  if (!supabase) return { data: null, error: { message: 'Supabase chưa cấu hình' } };

  const payload = { ...initialPayload };
  for (let attempt = 0; attempt < 10; attempt++) {
    const hasClientSubId = typeof payload.client_submission_id === 'string' && payload.client_submission_id.trim().length > 0;

    const res = hasClientSubId
      ? await supabase
          .from('submissions')
          .upsert([payload], { onConflict: 'client_submission_id', ignoreDuplicates: true })
          .select()
          .maybeSingle()
      : await supabase
          .from('submissions')
          .insert([payload])
          .select()
          .single();

    if (!res.error) {
      // Nếu ignoreDuplicates bỏ qua bản ghi trùng lặp, truy vấn lại bản ghi gốc đã lưu
      if (!res.data && hasClientSubId) {
        const existing = await supabase
          .from('submissions')
          .select('*')
          .eq('client_submission_id', payload.client_submission_id)
          .maybeSingle();
        return existing;
      }
      return res;
    }

    const missingColMatch = res.error.message?.match(/Could not find the '([^']+)' column/);
    if (missingColMatch && missingColMatch[1] && missingColMatch[1] in payload) {
      delete payload[missingColMatch[1]];
      continue;
    }

    // Nếu chưa tạo UNIQUE INDEX cho client_submission_id trên DB, hạ cấp về insert thường
    if (res.error.message?.includes('no unique or exclusion constraint') && 'client_submission_id' in payload) {
      delete payload.client_submission_id;
      continue;
    }

    return res;
  }

  return await supabase.from('submissions').insert([payload]).select().single();
}

export async function getUserStats(_uid?: string): Promise<UserStats> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const rawProgress = localStorage.getItem('vibe_user_progress');
      if (rawProgress) {
        const progress = JSON.parse(rawProgress);
        return {
          displayName: 'Học viên VibeSpeak',
          totalXp: progress.totalScore || 150,
          totalScore: progress.totalScore || 100,
          streak: 3,
          completedLessons: (progress.stationsPassed || []).length || 1,
          level: 'B1',
          rank: 'Cyber Challenger',
          station1Completed: 5,
          station2Wins: 3,
          station2Losses: 1
        };
      }
    } catch {}
  }
  return {
    displayName: 'Học viên VibeSpeak',
    totalXp: 150,
    totalScore: 100,
    streak: 1,
    completedLessons: 1,
    level: 'B1',
    rank: 'Cyber Challenger',
    station1Completed: 0,
    station2Wins: 0,
    station2Losses: 0
  };
}

export async function saveMatchHistory(userIdOrData: any, matchData?: any): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const dataToSave = matchData || userIdOrData;
      const raw = localStorage.getItem('vibe_match_history');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ ...dataToSave, timestamp: new Date().toISOString() });
      localStorage.setItem('vibe_match_history', JSON.stringify(list.slice(0, 30)));
    } catch {}
  }
}

export async function saveUserData(userIdOrData: any, username?: string, xp?: number): Promise<void> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const payload = typeof userIdOrData === 'object' ? userIdOrData : { uid: userIdOrData, username, xp };
      localStorage.setItem('vibe_user_data', JSON.stringify(payload));
    } catch {}
  }
}

// 🎯 LƯU KẾT QUẢ BÀI NỘP LÊN CLOUD SUPABASE (ĐẢM BẢO ĐỒNG BỘ MÃ LỚP, MSSV & CHỐNG TRÙNG LẶP)
export async function saveSubmissionToCloud(
  submission: Omit<RoleplaySubmission, 'id'> & Record<string, any>,
  _audioBlob?: Blob
): Promise<{ saved: RoleplaySubmission; syncedToCloud: boolean; errorMsg?: string }> {
  const cleanClassCode = normalizeClassCode(submission.classCode);
  const cleanStudentCode = (submission.studentCode || 'GUEST').toUpperCase().trim();
  const cleanStudentName = (submission.studentName || 'Học viên Đấu Trường').trim();
  const cleanClientSubId = (submission.clientSubmissionId || `${cleanStudentCode}_${Date.now()}`).trim();

  // Luôn lưu bản sao vào máy sinh viên để xem lại lịch sử tức thì
  saveToLocalFallback({
    ...submission,
    clientSubmissionId: cleanClientSubId,
    studentName: cleanStudentName,
    studentCode: cleanStudentCode,
    classCode: cleanClassCode,
  });

  try {
    if (!supabase) {
      return {
        saved: { ...submission, id: `local_${Date.now()}`, clientSubmissionId: cleanClientSubId, classCode: cleanClassCode },
        syncedToCloud: false,
        errorMsg: 'Chưa kết nối máy chủ Supabase'
      };
    }

    const payload: Record<string, any> = {
      client_submission_id: cleanClientSubId,
      student_name: cleanStudentName,
      student_code: cleanStudentCode,
      class_code: cleanClassCode,
      class_name: submission.className || `[${cleanClassCode}] ${submission.mode}`,
      score: submission.score,
      manual_score: null,
      mode: submission.mode,
      cefr_level: submission.cefrLevel,
      transcript: submission.transcript || '',
      audio_url: submission.audioUrl || '',
      feedback: submission.feedback || '',
      spontaneity_score: submission.spontaneity_score,
      pitch_variance: submission.pitch_variance,
      is_script_suspected: submission.is_script_suspected,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await safeInsertSubmissionRecord(payload);

    if (error || !data) {
      console.error('Lỗi đồng bộ submissions:', error?.message);
      return {
        saved: { ...submission, id: `local_${Date.now()}`, clientSubmissionId: cleanClientSubId, classCode: cleanClassCode },
        syncedToCloud: false,
        errorMsg: error?.message || 'Không thể lưu lên bảng submissions'
      };
    }

    return {
      syncedToCloud: true,
      saved: {
        id: data.id,
        clientSubmissionId: data.client_submission_id || cleanClientSubId,
        studentName: data.student_name,
        studentCode: data.student_code,
        classCode: data.class_code || cleanClassCode,
        className: data.class_name,
        score: data.score,
        manualScore: data.manual_score ?? null,
        teacherFeedback: data.teacher_feedback ?? null,
        mode: data.mode,
        cefrLevel: data.cefr_level,
        transcript: data.transcript,
        audioUrl: data.audio_url,
        feedback: data.feedback,
        timestamp: data.created_at || submission.timestamp,
      }
    };
  } catch (err: any) {
    return {
      saved: { ...submission, id: `local_${Date.now()}`, clientSubmissionId: cleanClientSubId, classCode: cleanClassCode },
      syncedToCloud: false,
      errorMsg: err?.message || 'Lỗi mạng khi gửi bài'
    };
  }
}

// 📜 LẤY LỊCH SỬ BÀI NÓI CỦA SINH VIÊN THEO MSSV (KẾT HỢP CLOUD + LOCAL)
export async function fetchStudentHistory(studentCode: string): Promise<RoleplaySubmission[]> {
  const cleanCode = (studentCode || '').toUpperCase().trim();
  const localItems = getLocalFallback().filter(
    (item) => !cleanCode || (item.studentCode || '').toUpperCase().trim() === cleanCode
  );

  try {
    if (!supabase || !cleanCode) {
      return localItems;
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .ilike('student_code', cleanCode)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      return localItems;
    }

    const cloudItems: RoleplaySubmission[] = data.map((item: any) => ({
      id: item.id,
      clientSubmissionId: item.client_submission_id,
      studentName: item.student_name,
      studentCode: item.student_code,
      classCode: item.class_code,
      className: item.class_name,
      score: item.score,
      manualScore: item.manual_score ?? null,
      teacherFeedback: item.teacher_feedback ?? null,
      mode: item.mode,
      cefrLevel: item.cefr_level,
      transcript: item.transcript,
      audioUrl: item.audio_url || '',
      feedback: item.feedback,
      timestamp: item.created_at,
    }));

    // Gộp thêm các bản lưu cục bộ chưa lên được cloud (nếu có)
    const merged = [...cloudItems];
    localItems.forEach((loc) => {
      const isDuplicate = merged.some(
        (c) =>
          (loc.clientSubmissionId && c.clientSubmissionId === loc.clientSubmissionId) ||
          (c.transcript === loc.transcript && Math.abs(Number(c.score) - Number(loc.score)) <= 1)
      );
      if (!isDuplicate) {
        merged.push(loc);
      }
    });

    return merged;
  } catch {
    return localItems;
  }
}

export async function fetchSubmissionsFromCloud(className: string = 'ALL'): Promise<RoleplaySubmission[]> {
  try {
    if (!supabase) return getLocalFallback();

    let query = supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (className !== 'ALL') {
      query = query.ilike('class_name', `%${className.trim()}%`);
    }

    const { data, error } = await query;
    if (error || !data) return getLocalFallback();

    return data.map((item: any, index: number) => ({
      id: item.id,
      clientSubmissionId: item.client_submission_id,
      studentName: item.student_name,
      studentCode: item.student_code,
      classCode: item.class_code,
      pairName: item.pair_name,
      className: item.class_name,
      score: item.score,
      manualScore: item.manual_score ?? null,
      teacherFeedback: item.teacher_feedback ?? null,
      mode: item.mode,
      cefrLevel: item.cefr_level,
      transcript: item.transcript,
      audioUrl: item.audio_url || '',
      feedback: item.feedback,
      timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString('vi-VN') : '',
      rank: index + 1,
    }));
  } catch {
    return getLocalFallback();
  }
}

export function updateUserProgress(stationIndex: number, pointsEarned: number, isPassed: boolean) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const rawProgress = localStorage.getItem('vibe_user_progress');
    const progress = rawProgress ? JSON.parse(rawProgress) : { totalScore: 0, stationsPassed: [] };
    progress.totalScore = (progress.totalScore || 0) + pointsEarned;
    if (isPassed && !progress.stationsPassed.includes(stationIndex)) {
      progress.stationsPassed.push(stationIndex);
    }
    localStorage.setItem('vibe_user_progress', JSON.stringify(progress));
  } catch {}
}

function saveToLocalFallback(submission: Omit<RoleplaySubmission, 'id'>) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = localStorage.getItem('vibe_offline_submissions');
    const list: RoleplaySubmission[] = raw ? JSON.parse(raw) : [];
    if (submission.clientSubmissionId && list.some((i) => i.clientSubmissionId === submission.clientSubmissionId)) {
      return;
    }
    list.unshift({ ...submission, id: `offline_${Date.now()}` });
    localStorage.setItem('vibe_offline_submissions', JSON.stringify(list.slice(0, 50)));
  } catch {}
}

function getLocalFallback(): RoleplaySubmission[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem('vibe_offline_submissions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}