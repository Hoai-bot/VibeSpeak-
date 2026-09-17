export interface CyberRank {
  title: string;
  minElo: number;
  badge: string;
  color: string;
}

export const CYBER_RANKS: CyberRank[] = [
  { title: "Copper Byte", minElo: 0, badge: "🥉", color: "#CD7F32" },
  { title: "Neon Runner", minElo: 300, badge: "🥈", color: "#C0C0C0" },
  { title: "Cyber Netrunner", minElo: 600, badge: "🥇", color: "#FFD700" },
  { title: "Quantum Cipher", minElo: 1000, badge: "💎", color: "#00FFFF" },
  { title: "Cyber Master", minElo: 1500, badge: "👑", color: "#FF007F" },
];

export const getRankByElo = (elo: number): CyberRank => {
  for (let i = CYBER_RANKS.length - 1; i >= 0; i--) {
    if (elo >= CYBER_RANKS[i].minElo) {
      return CYBER_RANKS[i];
    }
  }
  return CYBER_RANKS[0];
};

export const calculateEloChange = (score: number): number => {
  // Thắng lớn (>80đ) cộng nhiều Elo, điểm thấp giữ nguyên hoặc trừ nhẹ
  if (score >= 85) return +25;
  if (score >= 70) return +15;
  if (score >= 50) return +5;
  return -10;
};