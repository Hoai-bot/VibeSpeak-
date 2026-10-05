// src/services/leaderboardService.ts

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  totalDamage: number;
  levelBadge: string;
  isCurrentUser?: boolean;
}

export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: "CyberNinja_99", avatar: "🥷", totalDamage: 14200, levelBadge: "C2" },
  { rank: 2, name: "ShadowSlayer", avatar: "⚔️", totalDamage: 11800, levelBadge: "C1" },
  { rank: 3, name: "VibeMaster_AI", avatar: "🎧", totalDamage: 9600, levelBadge: "B2" },
  { rank: 4, name: "NeonRider", avatar: "🏎️", totalDamage: 7500, levelBadge: "B1" },
  { rank: 5, name: "Alex_A2", avatar: "🛡️", totalDamage: 5200, levelBadge: "A2" },
  { rank: 6, name: "PhoneticHunter", avatar: "🎯", totalDamage: 4300, levelBadge: "A2" },
  { rank: 7, name: "VibeRookie", avatar: "🐥", totalDamage: 2100, levelBadge: "A1" },
];

export function getLeaderboardData(userDamageScore: number = 0): LeaderboardUser[] {
  let list = [...MOCK_LEADERBOARD];

  // Nếu người dùng có điểm sát thương, chèn thông tin người dùng vào xếp hạng
  if (userDamageScore > 0) {
    const userEntry: LeaderboardUser = {
      rank: 0,
      name: "Bạn (Player)",
      avatar: "🔥",
      totalDamage: userDamageScore,
      levelBadge: userDamageScore > 10000 ? "C1" : userDamageScore > 5000 ? "B2" : "A2",
      isCurrentUser: true,
    };

    // Loại bỏ entry cũ nếu có và xếp sắp lại danh sách
    list = list.filter((item) => !item.isCurrentUser);
    list.push(userEntry);
    list.sort((a, b) => b.totalDamage - a.totalDamage);

    // Cập nhật lại thứ hạng (rank)
    list.forEach((item, index) => {
      item.rank = index + 1;
    });
  }

  return list;
}