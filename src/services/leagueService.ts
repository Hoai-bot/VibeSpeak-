// src/services/leagueService.ts
export type LeagueTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'CYBER_DIAMOND';

export interface LeagueUserEntry {
  rank: number;
  studentName: string;
  totalXp: number;
  submissionsCount: number;
  tier: LeagueTier;
  status: 'promoted' | 'retained' | 'demoted';
}

const TIER_ORDER: LeagueTier[] = ['BRONZE', 'SILVER', 'GOLD', 'CYBER_DIAMOND'];
const USER_LEAGUE_TIER_KEY = 'vibespeak_user_league_tier';

// 🎯 1. TÍNH KHOẢNG THỜI GIAN TUẦN HIỆN TẠI (TỪ THỨ HAI ĐẾN CHỦ NHẬT)
export const getCurrentWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: Chủ Nhật, 1: Thứ Hai, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString(),
    end: sunday.toISOString(),
    daysRemaining: dayOfWeek === 0 ? 0 : 7 - dayOfWeek,
  };
};

// 🎯 2. LẤY HẠNG HIỆN TẠI CỦA NGƯỜI DÙNG
export const getCurrentTier = (): LeagueTier => {
  try {
    const saved = localStorage.getItem(USER_LEAGUE_TIER_KEY);
    return (saved as LeagueTier) || 'BRONZE';
  } catch (e) {
    return 'BRONZE';
  }
};

export const setCurrentTier = (tier: LeagueTier) => {
  try {
    localStorage.setItem(USER_LEAGUE_TIER_KEY, tier);
  } catch (e) {}
};

// 🎯 3. PHÂN VÙNG THĂNG HẠNG (TOP 5) VÀ XUỐNG HẠNG (5 ĐÁY) CHO NHÓM ĐẤU
export const calculateLeagueStandings = (
  submissions: any[],
  currentTier: LeagueTier = 'BRONZE'
): LeagueUserEntry[] => {
  const userMap: Record<string, { totalXp: number; count: number }> = {};

  submissions.forEach((sub) => {
    const name = sub.studentName || sub.student_name || 'Học viên VibeSpeak';
    const score = Number(sub.score) || 0;

    if (!userMap[name]) {
      userMap[name] = { totalXp: 0, count: 0 };
    }
    // Điểm XP tích lũy bằng tổng điểm các bài nộp trong tuần
    userMap[name].totalXp += score;
    userMap[name].count += 1;
  });

  const sortedList = Object.entries(userMap)
    .map(([studentName, data]) => ({
      studentName,
      totalXp: data.totalXp,
      submissionsCount: data.count,
      tier: currentTier,
    }))
    .sort((a, b) => b.totalXp - a.totalXp);

  const totalUsers = sortedList.length;

  return sortedList.map((entry, index) => {
    const rank = index + 1;
    let status: 'promoted' | 'retained' | 'demoted' = 'retained';

    // Top 5 thăng hạng
    if (rank <= 5) {
      status = 'promoted';
    } 
    // Top 5 dưới cùng xuống hạng (chỉ áp dụng nếu bảng có trên 10 người)
    else if (totalUsers >= 10 && rank > totalUsers - 5) {
      status = 'demoted';
    }

    return {
      rank,
      ...entry,
      status,
    };
  });
};