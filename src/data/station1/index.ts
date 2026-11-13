// src/data/station1/index.ts
export * from './minimalPairs';
export * from './linkingSounds';
export * from './tongueTwisters';

import { MINIMAL_PAIRS_DATA, MinimalPairItem } from './minimalPairs';
import { LINKING_SOUNDS_DATA, LinkingSoundItem } from './linkingSounds';
import { TONGUE_TWISTERS_DATA, TongueTwisterItem } from './tongueTwisters';

export type Station1RawItem = MinimalPairItem | LinkingSoundItem | TongueTwisterItem;

export const STATION1_BANKS = {
  minimal_pairs: MINIMAL_PAIRS_DATA,
  linking_sounds: LINKING_SOUNDS_DATA,
  tongue_twisters: TONGUE_TWISTERS_DATA,
};

export const getRandomStation1StartIndex = (type: keyof typeof STATION1_BANKS): number => {
  const bank = STATION1_BANKS[type];
  return bank && bank.length > 0 ? Math.floor(Math.random() * bank.length) : 0;
};