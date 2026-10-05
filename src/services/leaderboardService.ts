// src/services/leaderboardService.ts
import { supabase } from './supabaseClient';

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  totalDamage: number;
  levelBadge: string;
  isCurrentUser?: boolean;
}

// 🛡️ MOCK DATA KHỎI CHUYỂN DỰ PHÒNG KHI MẤT KẾT NỐI
export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: "CyberNinja_99", avatar: "🥷", totalDamage: 14200, levelBadge: "C2" },
  { rank: 2, name: "ShadowSlayer", avatar: "⚔️", totalDamage: 11800, levelBadge: "C1" },
  { rank: 3, name: "VibeMaster_AI", avatar: "🎧", totalDamage: 9600, levelBadge: "B2" },
  { rank: 4, name: "NeonRider", avatar: "🏎️", totalDamage: 7500, levelBadge: "B1" },
  { rank: 5, name: "Alex_A2", avatar: "🛡️", totalDamage: 5200, levelBadge: "A2" },
  { rank: 6, name: "PhoneticHunter", avatar: "🎯", totalDamage: 4300, levelBadge: "A2" },
  { rank: 7, name: "VibeRookie", avatar: "🐥", totalDamage: 2100, levelBadge: "A1" },
];

/**
 * ⚡ LẤY DANH SÁCH BẢNG XẾP HẠNG THỜI GIAN THỰC TỪ SUPABASE CLOUD
 */
export async function fetchCloudLeaderboard(currentUserId: string): Promise<LeaderboardUser[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('total_damage', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) throw error || new Error('No cloud data');

    return data.map((item, index) => ({
      rank: index + 1,
      name: item.name || "Cyber Player",
      avatar: item.avatar || "🥷",
      totalDamage: item.total_damage || 0,
      levelBadge: item.level_badge || "A1",
      isCurrentUser: item.user_id === currentUserId,
    }));
  } catch (err) {
    console.warn("⚠️ Không thể nạp dữ liệu Supabase Cloud, chuyển sang Fallback Mock Data:", err);
    return getLeaderboardData(0);
  }
}

/**
 * 🔄 ĐỒNG BỘ ĐIỂM SÁT THƯƠNG / XP LÊN SUPABASE CLOUD
 */
export async function syncUserDamageToCloud(
  userId: string, 
  name: string, 
  addedDamage: number, 
  cefrLevel: string
) {
  if (!userId) return;

  try {
    const { data } = await supabase
      .from('leaderboard')
      .select('total_damage')
      .eq('user_id', userId)
      .single();

    const currentDamage = data?.total_damage || 0;
    const newTotal = currentDamage + addedDamage;

    await supabase.from('leaderboard').upsert({
      user_id: userId,
      name: name || 'Player_Unknown',
      total_damage: newTotal,
      level_badge: cefrLevel || 'A1',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("⚠️ Lỗi đồng bộ điểm sát thương lên Supabase Cloud:", err);
  }
}

/**
 * 🛡️ FALLBACK SERVICE CỤC BỘ DÙNG KHI NGOẠI TUYẾN
 */
export function getLeaderboardData(userDamageScore: number = 0): LeaderboardUser[] {
  let list = [...MOCK_LEADERBOARD];

  if (userDamageScore > 0) {
    const userEntry: LeaderboardUser = {
      rank: 0,
      name: "Bạn (Player)",
      avatar: "🔥",
      totalDamage: userDamageScore,
      levelBadge: userDamageScore > 10000 ? "C1" : userDamageScore > 5000 ? "B2" : "A2",
      isCurrentUser: true,
    };

    list = list.filter((item) => !item.isCurrentUser);
    list.push(userEntry);
    list.sort((a, b) => b.totalDamage - a.totalDamage);

    list.forEach((item, index) => {
      item.rank = index + 1;
    });
  }

  return list;
}