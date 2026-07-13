import type {
  GameStats,
  PowerRoutingResult,
  SealableMemoryAnchor,
  SpecialInteractionCompletion,
  SpecialInteractionKind,
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

/** 在线性动画中保持三个通道为整数，且每一帧总和严格等于 100。 */
export function interpolatePowerAllocation(
  from: PowerAllocation,
  to: PowerAllocation,
  progress: number,
): PowerAllocation {
  const ratio = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const raw = POWER_CHANNELS.map(channel => {
    const value = from[channel] + (to[channel] - from[channel]) * ratio;
    return { channel, value, base: Math.floor(value), fraction: value - Math.floor(value) };
  });
  let remainder = 100 - raw.reduce((sum, item) => sum + item.base, 0);
  const ranked = [...raw].sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; index < ranked.length && remainder > 0; index += 1, remainder -= 1) {
    ranked[index].base += 1;
  }
  return Object.fromEntries(raw.map(item => [item.channel, item.base])) as PowerAllocation;
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
        novaHintStage: 0,
        novaHintInteractionKind: undefined,
        passwordBypassedByNova06: current.passwordBypassedByNova06 || completion.completedByNova06 === true,
        nova06FirstOverrideSeen: current.nova06FirstOverrideSeen || completion.completedByNova06 === true,
        nova06OverrideTriggered: current.nova06OverrideTriggered || completion.completedByNova06 === true,
      };
    case 'signal-separation':
      return {
        ...current,
        signalSeparationResult: completion.routeKey,
        signalCurrentNovaRecovered: true,
        signalNova06Recovered: true,
        signalCoreTelemetryRecovered: true,
        timelineAlignmentCompleted: true,
        novaHintStage: 0,
        novaHintInteractionKind: undefined,
        signalCompletedByNova06: current.signalCompletedByNova06 || completion.completedByNova06 === true,
        timelineCompletedByNova06: current.timelineCompletedByNova06 || completion.completedByNova06 === true,
        nova06FirstOverrideSeen: current.nova06FirstOverrideSeen || completion.completedByNova06 === true,
        nova06OverrideTriggered: current.nova06OverrideTriggered || completion.completedByNova06 === true,
      };
    case 'power-routing':
      return {
        ...current,
        powerRoutingResult: completion.routeKey,
        novaHintStage: 0,
        novaHintInteractionKind: undefined,
        powerCompletedByNova06: current.powerCompletedByNova06 || completion.completedByNova06 === true,
        nova06FirstOverrideSeen: current.nova06FirstOverrideSeen || completion.completedByNova06 === true,
        nova06OverrideTriggered: current.nova06OverrideTriggered || completion.completedByNova06 === true,
      };
    case 'memory-seal':
      return {
        ...current,
        temporaryAnchorSealed: completion.anchor,
        temporaryAnchorRestored: false,
        novaHintStage: 0,
        novaHintInteractionKind: undefined,
      };
    case 'memory-restore': {
      const next: GameStats = {
        ...current,
        temporaryAnchorRestored: true,
        novaHintStage: 0,
        novaHintInteractionKind: undefined,
      };
      delete next.temporaryAnchorSealed;
      return next;
    }
  }
}

/** 接管脚本已经真正写入，但演出尚未结束时先落盘，防止刷新后重复执行。 */
export function applyNova06OverrideCheckpoint(
  current: GameStats,
  kind: SpecialInteractionKind,
): GameStats {
  const common = {
    ...current,
    nova06FirstOverrideSeen: true,
    nova06OverrideTriggered: true,
  };
  if (kind === 'critical-log-password') {
    return { ...common, criticalLogUnlocked: true, passwordBypassedByNova06: true };
  }
  if (kind === 'signal-separation') {
    return {
      ...common,
      signalSeparationResult: 'clean',
      signalCurrentNovaRecovered: true,
      signalNova06Recovered: true,
      signalCoreTelemetryRecovered: true,
      timelineAlignmentCompleted: true,
      signalCompletedByNova06: true,
      timelineCompletedByNova06: true,
    };
  }
  if (kind === 'power-routing') {
    return { ...common, powerRoutingResult: 'stable', powerCompletedByNova06: true };
  }
  return common;
}

export function isSealableMemoryAnchor(value: string): value is SealableMemoryAnchor {
  return value === 'maintenance_board' || value === 'white_flower' || value === 'goodnight';
}
