import type { GameStats } from './types';

export const TRUE_ENDING_MIN_TRUST = 4;
export const TRUE_ENDING_MIN_MEMORY = 4;
export const TRUE_ENDING_MIN_ANCHORS = 4;
export const BAD_ENDING_ATTACHMENT = 5;

export function resolveEndingStart(requestedNextId: string, stats: GameStats): string {
  if (requestedNextId !== 'FINALE_DECISION_END') return requestedNextId;

  if (stats.attachment >= BAD_ENDING_ATTACHMENT && !stats.acceptFarewell) return 'BAD_END_START';

  if (
    stats.acceptFarewell &&
    stats.trust >= TRUE_ENDING_MIN_TRUST &&
    stats.memory >= TRUE_ENDING_MIN_MEMORY &&
    stats.memoryAnchors.length >= TRUE_ENDING_MIN_ANCHORS
  ) {
    return 'FINALE_START';
  }

  return 'NORMAL_END_START';
}
