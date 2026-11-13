// src/data/station4/index.ts
export * from './speakingExpress';

import { SPEAKING_EXPRESS_DATA, ExpressExerciseItem } from './speakingExpress';

export const getExpressExercisesByLevel = (
  level: ExpressExerciseItem['level']
): ExpressExerciseItem[] => {
  const matches = SPEAKING_EXPRESS_DATA.filter((item) => item.level === level);
  return matches.length > 0 ? matches : SPEAKING_EXPRESS_DATA;
};

export const getRandomExpressStartIndex = (
  level: ExpressExerciseItem['level']
): number => {
  const list = getExpressExercisesByLevel(level);
  return Math.floor(Math.random() * list.length);
};