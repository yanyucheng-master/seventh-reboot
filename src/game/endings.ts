import type { EndingType, GameStats } from './types';

export const TRUE_ENDING_MIN_TRUST = 4;
export const TRUE_ENDING_MIN_MEMORY = 4;
export const TRUE_ENDING_MIN_ANCHORS = 5;
export const REQUIRED_TRUE_ENDING_ANCHORS = ['first_message', 'n7'] as const;

export function determineEnding(stats: GameStats): EndingType {
  if (!stats.acceptFarewell || stats.finalChoice === 'refuse_farewell') {
    return 'bad';
  }

  const hasCoreAnchors = REQUIRED_TRUE_ENDING_ANCHORS.every(anchor => stats.memoryAnchors.includes(anchor));
  const qualifiesTrueEnding =
    stats.acceptFarewell &&
    stats.trust >= TRUE_ENDING_MIN_TRUST &&
    stats.memory >= TRUE_ENDING_MIN_MEMORY &&
    stats.memoryAnchors.length >= TRUE_ENDING_MIN_ANCHORS &&
    hasCoreAnchors;

  return qualifiesTrueEnding ? 'true' : 'normal';
}

export function resolveEndingStart(requestedNextId: string, stats: GameStats): string {
  if (requestedNextId === 'BAD_END_START') return 'BAD_END_START';
  if (requestedNextId !== 'FINALE_DECISION_END') return requestedNextId;

  const ending = determineEnding(stats);
  if (ending === 'bad') return 'BAD_END_START';
  if (ending === 'true') return 'FINALE_DECISION_END';
  return 'NORMAL_END_START';
}
