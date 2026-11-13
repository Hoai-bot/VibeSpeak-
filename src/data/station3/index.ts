// src/data/station3/index.ts
export * from './bossScenarios';

import { BOSS_SCENARIOS_DATA, BossScenarioItem } from './bossScenarios';

export const getBossScenariosByLevel = (
  level: BossScenarioItem['level']
): BossScenarioItem[] => {
  const matches = BOSS_SCENARIOS_DATA.filter((item) => item.level === level);
  return matches.length > 0 ? matches : BOSS_SCENARIOS_DATA;
};

export const getRandomBossStartIndex = (
  level: BossScenarioItem['level']
): number => {
  const list = getBossScenariosByLevel(level);
  return Math.floor(Math.random() * list.length);
};