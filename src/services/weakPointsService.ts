// src/services/weakPointsService.ts
import { supabase } from './supabaseClient';

export interface WeakPointItem {
  id: string;
  stationId: string;
  promptText: string;
  lastScore: number;
  timestamp: number;
}

const STORAGE_KEY = 'vibespeak_weak_points';

/**
 * ⚡ LƯU CÂU YẾU LÊN SUPABASE CLOUD VÀ LOCALSTORAGE
 */
export async function saveWeakPoint(
  stationId: string, 
  promptText: string, 
  score: number, 
  userId: string = 'guest_user'
) {
  if (score >= 60 || !promptText) return;

  const newItem: WeakPointItem = {
    id: `weak_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    stationId,
    promptText,
    lastScore: score,
    timestamp: Date.now()
  };

  // 1. Lưu dự phòng LocalStorage
  try {
    const existing = getLocalWeakPoints();
    const filtered = existing.filter(item => item.promptText !== promptText);
    filtered.unshift(newItem);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)));
    }
  } catch (localErr) {
    console.warn("⚠️ Lỗi lưu LocalStorage:", localErr);
  }

  // 2. Đồng bộ lên Supabase Cloud Database
  try {
    await supabase.from('weak_points').upsert({
      id: newItem.id,
      user_id: userId,
      station_id: stationId,
      prompt_text: promptText,
      last_score: score,
      timestamp: newItem.timestamp
    });
  } catch (err) {
    console.warn("⚠️ Không thể lưu câu yếu lên Supabase Cloud:", err);
  }
}

/**
 * 📥 NẠP DANH SÁCH CÂU YẾU TỪ SUPABASE CLOUD (FALLBACK SANG LOCALSTORAGE)
 */
export async function fetchWeakPoints(userId: string = 'guest_user'): Promise<WeakPointItem[]> {
  try {
    const { data, error } = await supabase
      .from('weak_points')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) throw error || new Error('No cloud weak points');

    return data.map((item) => ({
      id: item.id,
      stationId: item.station_id,
      promptText: item.prompt_text,
      lastScore: item.last_score,
      timestamp: item.timestamp,
    }));
  } catch (err) {
    console.warn("⚠️ Nạp câu yếu từ Cloud thất bại, chuyển sang LocalStorage:", err);
    return getLocalWeakPoints();
  }
}

/**
 * 🛡️️ LẤY CÂU YẾU CỤC BỘ TỪ LOCALSTORAGE
 */
export function getLocalWeakPoints(): WeakPointItem[] {
  if (typeof localStorage !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

// Bổ sung alias giữ tương thích ngược với mã nguồn cũ
export const getWeakPoints = getLocalWeakPoints;
export const saveWeakPointToCloud = saveWeakPoint;
export const fetchCloudWeakPoints = fetchWeakPoints;