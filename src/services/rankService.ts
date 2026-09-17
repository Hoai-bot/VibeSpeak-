// src/services/rankService.ts
export interface UserRank {
  rankName: 'Đồng' | 'Bạc' | 'Vàng' | 'Cyber Diamond';
  mmr: number;
  badgeColor: string;
}

export function calculateNewRank(currentMMR: number, lastScore: number): UserRank {
  // Điểm > 80 được cộng MMR, điểm < 60 bị trừ MMR
  const delta = lastScore >= 80 ? Math.round((lastScore - 70) * 0.5) : -15;
  const newMMR = Math.max(0, currentMMR + delta);

  let rankName: UserRank['rankName'] = 'Đồng';
  let badgeColor = '#CD7F32';

  if (newMMR >= 1000) {
    rankName = 'Cyber Diamond';
    badgeColor = '#00FFFF';
  } else if (newMMR >= 500) {
    rankName = 'Vàng';
    badgeColor = '#FFD700';
  } else if (newMMR >= 200) {
    rankName = 'Bạc';
    badgeColor = '#C0C0C0';
  }

  return { rankName, mmr: newMMR, badgeColor };
}