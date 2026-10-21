// src/services/userService.ts
import { createClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase } from '../utils/supabase';

// URL và Anon Key của dự án Supabase VibeSpeak
const SUPABASE_URL = 'https://hdifryokbfssibhsnpja.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Nhập Anon Key của bạn vào đây

// Tự động tạo fallback client nếu import bị undefined
const getSafeSupabase = () => {
  if (defaultSupabase) return defaultSupabase;
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn("⚠️ Lỗi khởi tạo Supabase fallback:", e);
    return null;
  }
};

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

// 🎯 HÀM CHUYỂN DỔI BLOB SANG BASE64 AN TOÀN
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    if (!blob) return resolve('');
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
};

// 🎯 HÀM LƯU BÀI NỘP LÊN CLOUD SUPABASE
export const saveSubmissionToCloud = async (submission: RoleplaySubmission) => {
  try {
    // 1. Lưu dự phòng ở Local Storage máy học viên
    try {
      const existingLocal = localStorage.getItem(LOCAL_HISTORY_KEY);
      const historyList: RoleplaySubmission[] = existingLocal ? JSON.parse(existingLocal) : [];
      historyList.unshift(submission);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(historyList.slice(0, 30)));
    } catch (e) {}

    const client = getSafeSupabase();
    if (!client) return;

    const { data: userData } = await client.auth.getUser();
    const userId = userData?.user?.id || null;

    const currentMode = String(submission.mode || 'SOLO').toUpperCase();
    const level = String(submission.cefrLevel || 'A1').toUpperCase();
    const className = submission.className || 'LỚP CHUNG';
    let displayName = submission.pairName || submission.studentName || 'Sinh viên';

    const formattedFeedback = `[${currentMode} - ${level} | CLASS: ${className} | ${displayName}]: ${submission.feedback || ''}`;

    // 2. Lưu lên Cloud Supabase
    const { error } = await client.from('assessment_results').insert([
      {
        user_id: userId,
        score: Number(submission.score) || 0,
        transcript: submission.transcript || '',
        feedback: formattedFeedback,
        audio_url: submission.audioUrl || '',
      },
    ]);

    if (error) {
      console.error("❌ Lỗi lưu dữ liệu Supabase:", error);
    }
  } catch (err) {
    console.warn("⚠️ Lỗi saveSubmissionToCloud:", err);
  }
};

// Alias tương thích với các component cũ nếu có gọi saveSubmissionForTeacher
export const saveSubmissionForTeacher = saveSubmissionToCloud;

// 🎯 HÀM TRUY XUẤT SIÊU TỐC - TỐI ƯU DUNG LƯỢNG VÀ TỐC ĐỘ TẢI
export const fetchSubmissionsFromCloud = async (selectedClass?: string): Promise<RoleplaySubmission[]> => {
  try {
    const client = getSafeSupabase();
    if (!client) return [];

    // Chỉ truy vấn các trường cần thiết, giảm dung lượng dữ liệu tải về qua mạng
    const { data: results, error } = await client
      .from('assessment_results')
      .select('id, score, transcript, feedback, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(100);

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
        audioUrl: '', // Bỏ nạp chuỗi base64 nặng
        feedback: cleanFeedback,
        timestamp: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
      };
    });

    if (selectedClass && selectedClass !== 'ALL') {
      return parsedList.filter(
        (s) => s.className?.toUpperCase() === selectedClass.toUpperCase()
      );
    }

    return parsedList;
  } catch (err) {
    console.warn("⚠️ Lỗi fetchSubmissionsFromCloud:", err);
  }
  return [];
};

// 🎯 HÀM TRUY XUẤT DỮ LIỆU BÀI NỘP CHO MÀN HÌNH HỒ SƠ CHIẾN BINH
export const fetchUserSubmissions = async (): Promise<RoleplaySubmission[]> => {
  let localSubmissions: RoleplaySubmission[] = [];

  try {
    const localData = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (localData) {
      localSubmissions = JSON.parse(localData) || [];
    }
  } catch (e) {
    console.warn("Lỗi đọc local history:", e);
  }

  try {
    const cloudSubmissions = await fetchSubmissionsFromCloud('ALL');
    const combinedMap = new Map<string, RoleplaySubmission>();

    [...localSubmissions, ...cloudSubmissions].forEach((item) => {
      const key = `${item.studentName}_${item.score}_${item.timestamp}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, item);
      }
    });

    return Array.from(combinedMap.values());
  } catch (err) {
    return localSubmissions;
  }
};

export const fetchTopLeaderboard = async () => {
  return await fetchSubmissionsFromCloud('ALL');
};

export const updateUserProgress = async (score: number, station: number) => {
  // Logic cập nhật tiến trình cơ bản
};