import type { GameStats } from './types';

export const TRUE_ENDING_MIN_TRUST = 12;
export const TRUE_ENDING_MIN_ANCHORS = 4;

export function resolveEndingStart(requestedNextId: string, stats: GameStats): string {
  if (requestedNextId !== 'FINALE_DECISION_END') return requestedNextId;

  const clingsToLoop = stats.attachment >= 2 && !stats.acceptFarewell;
  if (!stats.acceptFarewell || clingsToLoop) return 'BAD_END_START';

  if (stats.trust >= TRUE_ENDING_MIN_TRUST && stats.memoryAnchors.length >= TRUE_ENDING_MIN_ANCHORS) {
    return 'FINALE_START';
  }

  return 'NORMAL_END_START';
}
