import type { StoryNode } from './story';

export const INTERACTION_TIME_LIMIT_MS = {
  'bulkhead-isolation': 30_000,
  'power-routing': 60_000,
  'course-lock': 35_000,
  'protocol-cut': 28_000,
} as const;

export function getTimedNodeDurationMs(node: StoryNode): number | undefined {
  if (node.choiceTimeoutMs && node.choiceTimeoutMs > 0) return node.choiceTimeoutMs;
  if (!node.interactionKind) return undefined;
  return INTERACTION_TIME_LIMIT_MS[node.interactionKind as keyof typeof INTERACTION_TIME_LIMIT_MS];
}

export function remainingUntil(deadlineAt: number, now = Date.now()): number {
  return Math.max(0, deadlineAt - now);
}
