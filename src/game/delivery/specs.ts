import type { StoryNode } from '../story';
import type {
  CommunicationLinkState,
  DeliveryEventKey,
  OutgoingMessageDeliveryState,
} from '../types';

export type DeliveryTimelinePhase = {
  atMs: number;
  state: OutgoingMessageDeliveryState;
  linkState?: CommunicationLinkState;
  retryCount?: number;
  showLabel?: boolean;
};

export type DeliverySpec = {
  key?: DeliveryEventKey;
  phases: DeliveryTimelinePhase[];
  completeAtMs: number;
  compressedTargetMs: number;
  finalLinkState: CommunicationLinkState;
};

export type DeliveryProjection = {
  phaseIndex: number;
  phase: DeliveryTimelinePhase;
  complete: boolean;
  nextAtMs?: number;
};

export type LinkTimelinePhase = {
  atMs: number;
  state: CommunicationLinkState;
};

export type LinkTimelineSpec = {
  phases: LinkTimelinePhase[];
  completeAtMs: number;
  finalState: CommunicationLinkState;
};

export const DELIVERY_EVENT_SPECS: Record<DeliveryEventKey, DeliverySpec> = {
  prologue_first_reply: {
    key: 'prologue_first_reply',
    phases: [
      { atMs: 0, state: 'queued', linkState: 'degraded' },
      { atMs: 60, state: 'sending', linkState: 'degraded' },
      { atMs: 900, state: 'sending', linkState: 'degraded', showLabel: true },
      { atMs: 1500, state: 'delivered', linkState: 'stable' },
    ],
    completeAtMs: 1500,
    compressedTargetMs: 300,
    finalLinkState: 'stable',
  },
  chapter3_reconnect_reply: {
    key: 'chapter3_reconnect_reply',
    phases: [
      { atMs: 0, state: 'queued', linkState: 'restoring' },
      { atMs: 80, state: 'sending', linkState: 'restoring' },
      { atMs: 1200, state: 'delayed', linkState: 'restoring', showLabel: true },
      { atMs: 3800, state: 'delivered', linkState: 'restoring' },
    ],
    completeAtMs: 3800,
    compressedTargetMs: 500,
    finalLinkState: 'restoring',
  },
  chapter5_explicit_failure: {
    key: 'chapter5_explicit_failure',
    phases: [
      { atMs: 0, state: 'queued', linkState: 'unstable' },
      { atMs: 80, state: 'sending', linkState: 'unstable' },
      { atMs: 900, state: 'delayed', linkState: 'unstable', showLabel: true },
      { atMs: 4200, state: 'failed', linkState: 'interrupted', showLabel: true },
      { atMs: 5100, state: 'sending', linkState: 'restoring', retryCount: 1, showLabel: true },
      { atMs: 5900, state: 'delivered', linkState: 'stable', retryCount: 1 },
    ],
    completeAtMs: 5900,
    compressedTargetMs: 1000,
    finalLinkState: 'stable',
  },
  finale_last_answer: {
    key: 'finale_last_answer',
    phases: [
      { atMs: 0, state: 'queued', linkState: 'unstable' },
      { atMs: 80, state: 'sending', linkState: 'unstable' },
      { atMs: 1200, state: 'delayed', linkState: 'unstable', showLabel: true },
      { atMs: 3000, state: 'delayed', linkState: 'interrupted', showLabel: true },
      { atMs: 3400, state: 'sending', linkState: 'restoring', showLabel: true },
      { atMs: 4200, state: 'delivered', linkState: 'unstable' },
    ],
    completeAtMs: 4700,
    compressedTargetMs: 1000,
    finalLinkState: 'unstable',
  },
};

export const RESTORED_FAILURE_RETRY_SPEC: DeliverySpec = {
  key: 'chapter5_explicit_failure',
  phases: [
    { atMs: 0, state: 'failed', linkState: 'interrupted', showLabel: true },
    { atMs: 500, state: 'sending', linkState: 'restoring', retryCount: 1, showLabel: true },
    { atMs: 1300, state: 'delivered', linkState: 'stable', retryCount: 1 },
  ],
  completeAtMs: 1300,
  compressedTargetMs: 800,
  finalLinkState: 'stable',
};

const NODE_LINK_STATE_EFFECTS: Record<string, CommunicationLinkState> = {
  ch3_dc1: 'interrupted',
  ch3_dc2: 'interrupted',
  ch3_dc3: 'interrupted',
  ch3_dc4: 'interrupted',
  ch3_dc5: 'restoring',
  ch3_dc9: 'stable',
  ch5a_offline: 'interrupted',
  fin_disconnect3: 'unstable',
  fin_disconnect4: 'unstable',
  fin_disconnect5: 'unstable',
  fin_correct1: 'unstable',
  fin_wrong_iam1: 'unstable',
  fin_wrong_nice1: 'unstable',
  fin_wrong_forever1: 'unstable',
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createNormalDeliverySpec(
  seed: string,
  currentLinkState: CommunicationLinkState = 'stable',
): DeliverySpec {
  const latency = 180 + (stableHash(seed) % 241);
  return {
    phases: [
      { atMs: 0, state: 'queued' },
      { atMs: 60, state: 'sending' },
      { atMs: latency, state: 'delivered' },
    ],
    completeAtMs: latency + 140,
    compressedTargetMs: 80,
    finalLinkState: currentLinkState,
  };
}

export function compressDeliverySpec(spec: DeliverySpec): DeliverySpec {
  if (spec.completeAtMs <= spec.compressedTargetMs) return spec;
  const ratio = spec.compressedTargetMs / spec.completeAtMs;
  let previousAt = -1;
  const phases = spec.phases.map((phase, index) => {
    const scaled = index === spec.phases.length - 1
      ? Math.min(spec.compressedTargetMs, Math.round(phase.atMs * ratio))
      : Math.round(phase.atMs * ratio);
    const atMs = Math.max(index === 0 ? 0 : previousAt + 20, scaled);
    previousAt = atMs;
    return { ...phase, atMs };
  });
  const completeAtMs = Math.max(spec.compressedTargetMs, phases.at(-1)?.atMs ?? 0);
  return { ...spec, phases, completeAtMs };
}

export function resolveDeliverySpec(
  node: Pick<StoryNode, 'deliveryEvent'>,
  seed: string,
  compressed = false,
  currentLinkState: CommunicationLinkState = 'stable',
): DeliverySpec {
  const base = node.deliveryEvent
    ? DELIVERY_EVENT_SPECS[node.deliveryEvent]
    : createNormalDeliverySpec(seed, currentLinkState);
  return compressed ? compressDeliverySpec(base) : base;
}

export function projectDeliverySpec(spec: DeliverySpec, elapsedMs: number): DeliveryProjection {
  const safeElapsed = Math.max(0, elapsedMs);
  let phaseIndex = 0;
  for (let index = 1; index < spec.phases.length; index += 1) {
    if (spec.phases[index].atMs > safeElapsed) break;
    phaseIndex = index;
  }
  const nextPhase = spec.phases[phaseIndex + 1];
  return {
    phaseIndex,
    phase: spec.phases[phaseIndex],
    complete: safeElapsed >= spec.completeAtMs,
    nextAtMs: nextPhase?.atMs ?? (safeElapsed < spec.completeAtMs ? spec.completeAtMs : undefined),
  };
}

export function getNodeLinkStateEffect(nodeId: string): CommunicationLinkState | undefined {
  return NODE_LINK_STATE_EFFECTS[nodeId];
}

export function isCommittedWithinDeadline(committedAt: number, deadline: number): boolean {
  return committedAt <= deadline;
}
