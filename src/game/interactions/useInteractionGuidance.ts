import { useCallback, useEffect, useRef, useState } from 'react';
import {
  resolveGuidanceStage,
  scaleThresholdsForDevTest,
  type GuidanceStage,
  type GuidanceThresholds,
} from './guidance';

const DEV_FAST_GUIDANCE = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('testGuidanceFast') === '1';

type UseInteractionGuidanceOptions = {
  thresholds: GuidanceThresholds;
  /** 结果出现或接管开始后置为 false，冻结所有计时与计数 */
  enabled: boolean;
  /** 记忆封存等场景可封顶到 2（或把 3 用作纯留言阶段） */
  maxStage?: GuidanceStage;
};

type InteractionGuidance = {
  stage: GuidanceStage;
  /** 真实尝试：参数确实变化 / 确实提交了输入 */
  noteValidAttempt: () => void;
  /** 无效尝试：提交失败 / 稳定窗外锁定 */
  noteInvalidAttempt: () => void;
  /** 有效推进：重置阶段计时（阶段本身不回退） */
  noteProgress: () => void;
  /** 供能互动：进入一次紧急状态 */
  noteEmergency: () => void;
};

/**
 * 互动尝试追踪器 + 三级提示阶段控制。
 * 只负责判定阶段，不负责渲染；各互动自行决定阶段 1/2/3 的表现。
 */
export function useInteractionGuidance({
  thresholds,
  enabled,
  maxStage = 3,
}: UseInteractionGuidanceOptions): InteractionGuidance {
  const [stage, setStage] = useState<GuidanceStage>(0);
  const stageRef = useRef<GuidanceStage>(0);
  const startedAtRef = useRef(Date.now());
  const markAtRef = useRef(Date.now());
  const validAttemptsRef = useRef(0);
  const invalidAttemptsRef = useRef(0);
  const invalidSinceMarkRef = useRef(0);
  const emergenciesRef = useRef(0);
  const effectiveThresholds = useRef(
    DEV_FAST_GUIDANCE ? scaleThresholdsForDevTest(thresholds) : thresholds,
  );

  const evaluate = useCallback(() => {
    const now = Date.now();
    const next = resolveGuidanceStage(stageRef.current, {
      msSinceMark: now - markAtRef.current,
      msTotal: now - startedAtRef.current,
      validAttempts: validAttemptsRef.current,
      invalidAttempts: invalidAttemptsRef.current,
      invalidSinceMark: invalidSinceMarkRef.current,
      emergencies: emergenciesRef.current,
    }, effectiveThresholds.current);
    const capped = Math.min(next, maxStage) as GuidanceStage;
    if (capped !== stageRef.current) {
      stageRef.current = capped;
      markAtRef.current = now;
      invalidSinceMarkRef.current = 0;
      setStage(capped);
    }
  }, [maxStage]);

  useEffect(() => {
    if (!enabled) return undefined;
    const intervalId = window.setInterval(evaluate, 1000);
    return () => window.clearInterval(intervalId);
  }, [enabled, evaluate]);

  const noteValidAttempt = useCallback(() => {
    validAttemptsRef.current += 1;
  }, []);

  const noteInvalidAttempt = useCallback(() => {
    invalidAttemptsRef.current += 1;
    invalidSinceMarkRef.current += 1;
    evaluate();
  }, [evaluate]);

  const noteProgress = useCallback(() => {
    markAtRef.current = Date.now();
    invalidSinceMarkRef.current = 0;
  }, []);

  const noteEmergency = useCallback(() => {
    emergenciesRef.current += 1;
  }, []);

  return { stage, noteValidAttempt, noteInvalidAttempt, noteProgress, noteEmergency };
}
