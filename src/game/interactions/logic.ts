import type {
  GameStats,
  PowerRoutingResult,
  SealableMemoryAnchor,
  SpecialInteractionCompletion,
} from '../types';

export type PowerChannel = 'lifeSupport' | 'communications' | 'coreScan';

export type PowerAllocation = Record<PowerChannel, number>;

export type PowerThresholds = Partial<Record<PowerChannel, number>>;

const POWER_CHANNELS: PowerChannel[] = ['lifeSupport', 'communications', 'coreScan'];

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
  return POWER_CHANNELS.every(channel => allocation[channel] >= (thresholds[channel] ?? 0));
}

export function classifyPowerRoutingResult(
  usedEmergencyAssist: boolean,
  phaseElapsedSeconds: number[],
): PowerRoutingResult {
  if (usedEmergencyAssist) return 'emergency_assist';
  return phaseElapsedSeconds.length === 3 && phaseElapsedSeconds.every(seconds => seconds <= 10)
    ? 'excellent'
    : 'stable';
}

export function isSignalAligned(value: number, target: number, tolerance: number): boolean {
  return Math.abs(value - target) <= tolerance;
}

export function applySpecialInteractionCompletion(
  current: GameStats,
  completion: SpecialInteractionCompletion,
): GameStats {
  switch (completion.kind) {
    case 'critical-log-password':
      return {
        ...current,
        criticalLogUnlocked: true,
        passwordBypassedByNova06: current.passwordBypassedByNova06 || completion.completedByNova06 === true,
        nova06FirstOverrideSeen: current.nova06FirstOverrideSeen || completion.completedByNova06 === true,
      };
    case 'signal-separation':
      return {
        ...current,
        signalSeparationResult: completion.routeKey,
        signalCurrentNovaRecovered: true,
        signalNova06Recovered: true,
        signalCoreTelemetryRecovered: true,
        timelineAlignmentCompleted: true,
        signalCompletedByNova06: current.signalCompletedByNova06 || completion.completedByNova06 === true,
        timelineCompletedByNova06: current.timelineCompletedByNova06 || completion.completedByNova06 === true,
        nova06FirstOverrideSeen: current.nova06FirstOverrideSeen || completion.completedByNova06 === true,
      };
    case 'power-routing':
      return {
        ...current,
        powerRoutingResult: completion.routeKey,
        powerCompletedByNova06: current.powerCompletedByNova06 || completion.completedByNova06 === true,
        nova06FirstOverrideSeen: current.nova06FirstOverrideSeen || completion.completedByNova06 === true,
      };
    case 'memory-seal':
      return {
        ...current,
        temporaryAnchorSealed: completion.anchor,
        temporaryAnchorRestored: false,
      };
    case 'memory-restore': {
      const next: GameStats = {
        ...current,
        temporaryAnchorRestored: true,
      };
      delete next.temporaryAnchorSealed;
      return next;
    }
  }
}

export function isSealableMemoryAnchor(value: string): value is SealableMemoryAnchor {
  return value === 'maintenance_board' || value === 'white_flower' || value === 'goodnight';
}
