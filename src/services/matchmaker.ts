// src/services/matchmaker.ts

export interface PlayerProfile {
  id: string;
  name: string;
  exp: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  avatar: string;
}

export async function findBalancedOpponent(userExp: number): Promise<PlayerProfile> {
  // Giả lập hệ thống queue tìm đối thủ thực tế trong khoảng ±150 EXP
  await new Promise(resolve => setTimeout(resolve, 1500)); // Delay tìm trận 1.5s

  const botNames = ['Cyber_Nova', 'Echo_Viber', 'Neon_Blade', 'Pixel_Speaker', 'Vibe_Master_X'];
  const avatars = ['🤖', '⚡', '🐉', '🦊', '👾'];

  const matchedExp = Math.max(100, userExp + Math.floor(Math.random() * 100 - 50));
  const matchedTier = matchedExp > 800 ? 'GOLD' : matchedExp > 400 ? 'SILVER' : 'BRONZE';

  return {
    id: `MATCH_${Math.floor(Math.random() * 8999 + 1000)}`,
    name: botNames[Math.floor(Math.random() * botNames.length)],
    exp: matchedExp,
    tier: matchedTier,
    avatar: avatars[Math.floor(Math.random() * avatars.length)]
  };
}