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
  if (requestedNextId === 'END-B-0001') return 'END-B-0001';
  if (requestedNextId !== 'CH05B-0294') return requestedNextId;

  const ending = determineEnding(stats);
  if (ending === 'bad') return 'END-B-0001';
  if (ending === 'true') return 'CH05B-0294';
  return 'END-N-0001';
}
