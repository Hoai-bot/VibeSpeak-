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

// 🎯 HÀM UPLOAD THẲNG BLOB LÊN BUCKET recordings TRÊN SUPABASE
export const uploadAudioToSupabaseStorage = async (audioBlob: Blob | null): Promise<string> => {
  if (!audioBlob || !supabase) return '';

  try {
    const fileExt = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('aac') ? 'aac' : 'webm';
    const fileName = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `audio/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filePath, audioBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: audioBlob.type || 'audio/webm',
      });

    if (uploadError) {
      console.warn("⚠️ Upload Supabase Storage thất bại:", uploadError.message);
      return '';
    }

    const { data: publicUrlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || '';
  } catch (err) {
    console.warn("⚠️ Lỗi uploadAudioToSupabaseStorage:", err);
    return '';
  }
};

// 🎯 HÀM LƯU BÀI NỘP: TỰ ĐỘNG UPLOAD NẾU CÓ TRUYỀN BLOB
export const saveSubmissionToCloud = async (submission: RoleplaySubmission, audioBlob?: Blob | null) => {
  try {
    // Lưu dự phòng LocalStorage
    try {
      const existingLocal = localStorage.getItem(LOCAL_HISTORY_KEY);
      const historyList: RoleplaySubmission[] = existingLocal ? JSON.parse(existingLocal) : [];
      historyList.unshift(submission);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList.slice(0, 30)));
    } catch (e) {}

    if (!supabase) return;

    let finalAudioUrl = submission.audioUrl || '';

    // Nếu truyền audioBlob, upload trực tiếp lên Storage bucket 'recordings'
    if (audioBlob) {
      const cdnUrl = await uploadAudioToSupabaseStorage(audioBlob);
      if (cdnUrl) {
        finalAudioUrl = cdnUrl;
      }
    }

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    const className = submission.className || 'LỚP CHUNG';
    const studentName = submission.studentName || 'Sinh viên VibeSpeak';
    
    const pairNameWithClass = submission.pairName 
      ? `[CLASS: ${className}] ${submission.pairName}`
      : `[CLASS: ${className}] ${studentName}`;

    // Lưu vào bảng submissions
    const { error } = await supabase.from('submissions').insert([
      {
        student_name: studentName,
        pair_name: pairNameWithClass,
        mode: currentMode,
        cefr_level: level,
        score: Number(submission.score) || 0,
        transcript: submission.transcript || '',
        feedback: submission.feedback || '',
        audio_url: finalAudioUrl,
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

// 🎯 HÀM TRUY VẤN BẢNG submissions DÀNH CHO GIÁO VIÊN
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

    parsedList.sort((a: any, b: any) => b.rawCreatedAt - a.rawCreatedAt);

    let filtered = parsedList;
    if (selectedClass && selectedClass !== 'ALL') {
      filtered = parsedList.filter(
        (s) => s.className?.trim().toUpperCase() === selectedClass.trim().toUpperCase()
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