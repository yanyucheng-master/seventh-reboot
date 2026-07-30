import type { InteractionCondition, InteractionPrerequisite } from '../story';
import type {
  BulkheadFailureReason,
  BulkheadResult,
  GameStats,
  PowerFailureReason,
  SealableMemoryAnchor,
  SpecialInteractionCompletion,
} from '../types';

export type BulkheadSealTarget = 'observation' | 'hallway';
export type BulkheadEqualizeTarget = 'hallway' | 'observation' | 'purge';

export type BulkheadDecision = {
  sealTarget: BulkheadSealTarget;
  equalizeTarget: BulkheadEqualizeTarget;
  transitionPressure?: number;
  elapsedMs: number;
  timedOut?: boolean;
};

export type BulkheadEvaluation = {
  result: BulkheadResult;
  failureReason?: BulkheadFailureReason;
};

const BULKHEAD_INJURY_AFTER_MS = 15_000;

export function evaluateBulkheadDecision(decision: BulkheadDecision): BulkheadEvaluation {
  if (decision.timedOut) return { result: 'fatal', failureReason: 'seal_timeout' };
  if (decision.sealTarget === 'hallway') {
    return { result: 'fatal', failureReason: 'hallway_sealed' };
  }
  if (decision.equalizeTarget === 'purge') {
    return { result: 'fatal', failureReason: 'transition_purged' };
  }
  if (decision.equalizeTarget === 'observation') {
    return { result: 'fatal', failureReason: 'wrong_observation_door' };
  }
  const pressureLockedBelowSafeBand = decision.transitionPressure !== undefined
    && decision.transitionPressure < 94;
  return {
    result: pressureLockedBelowSafeBand || decision.elapsedMs >= BULKHEAD_INJURY_AFTER_MS
      ? 'injured'
      : 'safe',
  };
}

export type PowerChannel = 'lifeSupport' | 'communications' | 'coreScan';
export type PowerAllocation = Record<PowerChannel, number>;
export type PowerThresholds = Record<PowerChannel, number>;
export type PowerStage = 'transit' | 'core_read';

export const POWER_CHANNELS: PowerChannel[] = ['lifeSupport', 'communications', 'coreScan'];

export const POWER_STAGE_THRESHOLDS: Record<PowerStage, PowerThresholds> = {
  transit: { lifeSupport: 50, communications: 20, coreScan: 10 },
  core_read: { lifeSupport: 30, communications: 25, coreScan: 35 },
};

export function normalizeAuthorizationKey(value: string): string {
  return value
    .replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/[\s\u00a0\-‐‑‒–—﹘﹣－/]/g, '');
}

export function isCriticalLogPassword(value: string): boolean {
  return normalizeAuthorizationKey(value) === '0701';
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function rebalancePowerAllocation(
  current: PowerAllocation,
  changedChannel: PowerChannel,
  requestedValue: number,
): PowerAllocation {
  const changedValue = clampPercentage(requestedValue);
  const remaining = 100 - changedValue;
  const otherChannels = POWER_CHANNELS.filter(channel => channel !== changedChannel);
  const oldTotal = otherChannels.reduce((sum, channel) => sum + clampPercentage(current[channel]), 0);
  const firstShare = oldTotal > 0
    ? Math.round(remaining * clampPercentage(current[otherChannels[0]]) / oldTotal)
    : Math.round(remaining / 2);

  return {
    ...current,
    [changedChannel]: changedValue,
    [otherChannels[0]]: firstShare,
    [otherChannels[1]]: remaining - firstShare,
  };
}

export function isPowerAllocationStable(
  allocation: PowerAllocation,
  thresholds: PowerThresholds,
): boolean {
  return POWER_CHANNELS.every(channel => allocation[channel] >= thresholds[channel]);
}

export function findPowerFailureReason(
  stages: Record<PowerStage, PowerAllocation>,
  timedOut = false,
): PowerFailureReason | undefined {
  if (timedOut) return 'timeout';
  for (const stage of ['transit', 'core_read'] as const) {
    const allocation = stages[stage];
    const thresholds = POWER_STAGE_THRESHOLDS[stage];
    if (allocation.lifeSupport < thresholds.lifeSupport) return 'life_support_below_minimum';
    if (allocation.communications < thresholds.communications) return 'communications_interrupted';
    if (allocation.coreScan === 0) return 'return_core_cutoff';
    if (allocation.coreScan < thresholds.coreScan) return 'core_scan_underpowered';
  }
  return undefined;
}

function interactionResultForStats(current: GameStats, kind: InteractionCondition['kind']): string | undefined {
  switch (kind) {
    case 'bulkhead-isolation':
      return current.bulkheadResult;
    case 'critical-log-password':
      return current.jointAuthorizationCompleted ? 'success' : undefined;
    case 'power-routing':
      return current.powerRoutingResult;
    case 'memory-seal':
      return current.temporaryAnchorSealed;
    case 'memory-restore':
      return current.memoryRestoreResult;
  }
}

export function matchesInteractionCondition(
  current: GameStats,
  condition: InteractionCondition,
): boolean {
  return interactionResultForStats(current, condition.kind) === condition.routeKey;
}

export function matchesInteractionPrerequisite(
  current: GameStats,
  prerequisite: InteractionPrerequisite,
): boolean {
  return (current as unknown as Record<string, unknown>)[prerequisite.key] === prerequisite.value;
}

export function applySpecialInteractionCompletion(
  current: GameStats,
  completion: SpecialInteractionCompletion,
): GameStats {
  switch (completion.kind) {
    case 'bulkhead-isolation':
      return {
        ...current,
        bulkheadResult: completion.routeKey,
        bulkheadInjured: completion.routeKey === 'injured',
        ...(completion.failureReason ? { bulkheadFailureReason: completion.failureReason } : {}),
        ...(completion.routeKey === 'fatal'
          ? {
              earlyFailureCause: 'bulkhead_failure' as const,
              pendingReboot08: true,
            }
          : {}),
      };
    case 'critical-log-password':
      if (completion.routeKey === 'retry') return current;
      return {
        ...current,
        jointAuthorizationCompleted: true,
        criticalLogUnlocked: true,
      };
    case 'power-routing': {
      if (completion.attempt === 1 && completion.routeKey === 'success') {
        return {
          ...current,
          powerRoutingAttempt: 1,
          powerRoutingResult: 'first_success',
          nova06PowerOverrideExpired: true,
        };
      }
      if (completion.attempt === 1) {
        return {
          ...current,
          powerRoutingAttempt: 1,
          ...(completion.failureReason ? { powerFirstFailureReason: completion.failureReason } : {}),
          nova06PowerOverrideUsed: true,
          nova06PowerOverrideExpired: true,
        };
      }
      if (completion.routeKey === 'success') {
        return {
          ...current,
          powerRoutingAttempt: 2,
          powerRoutingResult: 'retry_success',
        };
      }
      return {
        ...current,
        powerRoutingAttempt: 2,
        powerRoutingResult: 'fatal',
        earlyFailureCause: 'power_routing_failure',
        pendingReboot08: true,
      };
    }
    case 'memory-seal':
      return {
        ...current,
        temporaryAnchorSealed: completion.anchor,
        temporaryAnchorRestored: false,
        memoryRestoreResult: undefined,
      };
    case 'memory-restore':
      return {
        ...current,
        temporaryAnchorRestored: completion.routeKey !== 'none',
        memoryRestoreResult: completion.routeKey,
      };
  }
}

export function isSealableMemoryAnchor(value: string): value is SealableMemoryAnchor {
  return value === 'maintenance_board' || value === 'white_flower' || value === 'goodnight';
}
