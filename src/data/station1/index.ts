// src/data/station1/index.ts
export * from './minimalPairs';
export * from './linkingSounds';
export * from './tongueTwisters';

import { MINIMAL_PAIRS_DATA } from './minimalPairs';
import { LINKING_SOUNDS_DATA } from './linkingSounds';
import { TONGUE_TWISTERS_DATA } from './tongueTwisters';

export const STATION1_BANKS = {
  minimal_pairs: MINIMAL_PAIRS_DATA,
  linking_sounds: LINKING_SOUNDS_DATA,
  tongue_twisters: TONGUE_TWISTERS_DATA,
};