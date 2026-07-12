import { NOVA06_FX_SEEN_KEY } from '../storage';

/**
 * 三级提示结构的阶段：
 * 0 = 玩家正常操作；1 = Nova 第一次方向提示；2 = Nova 第二次明确提示；
 * 3 = NOVA-06 残留签名越权接管（记忆封存互动中仅为一次不可代选的留言）。
 */
export type GuidanceStage = 0 | 1 | 2 | 3;

export type GuidanceSnapshot = {
  /** 距离上一次“有效推进 / 阶段变化”的毫秒数 */
  msSinceMark: number;
  /** 进入互动以来的总毫秒数 */
  msTotal: number;
  /** 真实尝试总数（参数确实变化 / 确实提交过输入） */
  validAttempts: number;
  /** 无效尝试总数（提交失败 / 稳定窗外锁定等） */
  invalidAttempts: number;
  /** 自上一次标记以来的无效尝试数 */
  invalidSinceMark: number;
  /** 供能互动的紧急状态进入次数（其余互动为 0） */
  emergencies: number;
};

export type GuidanceThresholds = {
  hint1Ms: number;
  hint1Invalid: number;
  hint2Ms: number;
  hint2Invalid: number;
  /** 接管所需的总停留时间 */
  overrideMs: number;
  /** 接管所需的累计无效尝试 */
  overrideInvalid: number;
  /** 接管所需的最少真实尝试（防止纯挂机触发） */
  overrideMinValid: number;
  /** 供能互动：接管所需的紧急状态次数（0 表示不适用） */
  overrideEmergencies: number;
};

/**
 * 逐级推进，禁止跳级：
 * - 提示阶段可由“长时间无进展”或“连续无效尝试”触发；
 * - 接管阶段必须同时满足：两次提示都已出现 + 真实尝试达标 + （时间或无效尝试或紧急次数达标）。
 */
export function resolveGuidanceStage(
  current: GuidanceStage,
  snapshot: GuidanceSnapshot,
  thresholds: GuidanceThresholds,
): GuidanceStage {
  if (current >= 3) return current;

  if (current < 1) {
    const reached = snapshot.msSinceMark >= thresholds.hint1Ms
      || snapshot.invalidSinceMark >= thresholds.hint1Invalid;
    return reached ? 1 : current;
  }

  if (current < 2) {
    const reached = snapshot.msSinceMark >= thresholds.hint2Ms
      || snapshot.invalidSinceMark >= thresholds.hint2Invalid;
    return reached ? 2 : current;
  }

  const hasRealAttempts = snapshot.validAttempts >= thresholds.overrideMinValid;
  if (!hasRealAttempts) return current;
  const longStall = snapshot.msTotal >= thresholds.overrideMs;
  const manyInvalid = snapshot.invalidAttempts >= thresholds.overrideInvalid;
  const manyEmergencies = thresholds.overrideEmergencies > 0
    && snapshot.emergencies >= thresholds.overrideEmergencies;
  return longStall || manyInvalid || manyEmergencies ? 3 : current;
}

/** DEV 直连测试时可用 ?testGuidanceFast=1 把所有时间阈值压缩，便于人工验证接管流程 */
export function scaleThresholdsForDevTest(thresholds: GuidanceThresholds): GuidanceThresholds {
  return {
    ...thresholds,
    hint1Ms: Math.max(1500, Math.round(thresholds.hint1Ms / 12)),
    hint2Ms: Math.max(1500, Math.round(thresholds.hint2Ms / 12)),
    overrideMs: Math.max(4000, Math.round(thresholds.overrideMs / 12)),
  };
}

export function hasSeenNova06FullFx(): boolean {
  try {
    return window.localStorage.getItem(NOVA06_FX_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markNova06FullFxSeen(): void {
  try {
    window.localStorage.setItem(NOVA06_FX_SEEN_KEY, 'true');
  } catch {
    /* silent */
  }
}
