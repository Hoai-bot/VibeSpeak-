// src/data/station2/index.ts
export * from './solo';
export * from './relay';
export * from './roleplay';

import { SOLO_SCENARIOS, Station2ScenarioItem, Station2Tier, CEFRLevel } from './solo';
import { RELAY_SCENARIOS } from './relay';
import { ROLEPLAY_SCENARIOS } from './roleplay';

export const STATION2_ALL_SCENARIOS: Station2ScenarioItem[] = [
  ...SOLO_SCENARIOS,
  ...RELAY_SCENARIOS,
  ...ROLEPLAY_SCENARIOS,
];

export const getStation2ScenariosByTierAndLevel = (
  tier: Station2Tier,
  level: CEFRLevel
): Station2ScenarioItem[] => {
  const exactMatches = STATION2_ALL_SCENARIOS.filter(
    (item) => item.tier === tier && item.level === level
  );
  if (exactMatches.length > 0) return exactMatches;

  return STATION2_ALL_SCENARIOS.filter((item) => item.tier === tier);
};