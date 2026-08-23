import { Cable, Check, Power } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Locale } from '../../i18n';
import type { SpecialInteractionCompletion } from '../types';
import { InteractionTitle } from './InteractionTitle';
import { INTERACTION_TIME_LIMIT_MS, remainingUntil } from '../timedRuntime';

type Props = {
  locale: Locale;
  reducedMotion: boolean;
  deadlineAt: number;
  onResultLocked: (result: SpecialInteractionCompletion) => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const WINDOW_MS = INTERACTION_TIME_LIMIT_MS['protocol-cut'];
const HOLD_MS = 1_150;

const COPY = {
  'zh-CN': {
    kicker: 'PHASE-CORE / BUS B',
    title: '第七协议物理隔离',
    mission: '先固定新航线，再解除 BUS B 保护锁。最后按住断开控制，直到同步环闭合。',
    remaining: '同步窗口',
    route: '新航线保持',
    bus: 'BUS B 隔离准备',
    hold: '按住以断开协议总线',
    holding: '保持同步…',
    success: 'PHASE-CORE BUS B 已断开',
    fatal: '同步窗口关闭 / 隔离失败',
    continue: '继续通讯',
  },
  'en-US': {
    kicker: 'PHASE-CORE / BUS B',
    title: 'Physical Seventh Protocol isolation',
    mission: 'Hold the new route, release the BUS B interlock, then hold the cut control until the sync ring closes.',
    remaining: 'SYNC WINDOW',
    route: 'Hold new course',
    bus: 'Arm BUS B isolation',
    hold: 'Hold to cut protocol bus',
    holding: 'Maintaining sync…',
    success: 'PHASE-CORE BUS B disconnected',
    fatal: 'Sync window closed / isolation failed',
    continue: 'Continue transmission',
  },
} as const;

export function ProtocolCutInteraction({ locale, reducedMotion, deadlineAt, onResultLocked, onComplete }: Props) {
  const copy = COPY[locale];
  const [routeHeld, setRouteHeld] = useState(false);
  const [busArmed, setBusArmed] = useState(false);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [remainingMs, setRemainingMs] = useState(() => remainingUntil(deadlineAt));
  const [result, setResult] = useState<Extract<SpecialInteractionCompletion, { kind: 'protocol-cut' }> | null>(null);
  const holdStartedAt = useRef<number | null>(null);
  const finished = useRef(false);
  const holdFrame = useRef<number | null>(null);

  const lockResult = useCallback((routeKey: 'success' | 'fatal') => {
    if (finished.current) return;
    finished.current = true;
    const completion = { kind: 'protocol-cut' as const, routeKey };
    setResult(completion);
    onResultLocked(completion);
  }, [onResultLocked]);

  useEffect(() => {
    if (result) return undefined;
    const tick = () => {
      const next = remainingUntil(deadlineAt);
      setRemainingMs(next);
      if (next === 0) lockResult('fatal');
    };
    tick();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [deadlineAt, lockResult, result]);

  useEffect(() => () => {
    if (holdFrame.current !== null) window.cancelAnimationFrame(holdFrame.current);
  }, []);

  function stopHold() {
    setHolding(false);
    setHoldProgress(0);
    if (holdFrame.current !== null) {
      window.cancelAnimationFrame(holdFrame.current);
      holdFrame.current = null;
    }
  }

  function advanceHold(frameTime: number) {
    if (holdStartedAt.current === null) holdStartedAt.current = frameTime;
    const elapsed = frameTime - holdStartedAt.current;
    const progress = Math.min(1, elapsed / HOLD_MS);
    setHoldProgress(progress);
    if (progress >= 1) {
      holdFrame.current = null;
      setHolding(false);
      lockResult('success');
      return;
    }
    holdFrame.current = window.requestAnimationFrame(advanceHold);
  }

  function startHold() {
    if (!routeHeld || !busArmed || result) return;
    holdStartedAt.current = null;
    setHolding(true);
    holdFrame.current = window.requestAnimationFrame(advanceHold);
  }

  if (result) {
    const success = result.routeKey === 'success';
    return (
      <section className="interaction-result protocol-cut-result" aria-live="assertive">
        <Power className="protocol-cut-result-icon" aria-hidden />
        <p className="interaction-kicker">{copy.kicker}</p>
        <InteractionTitle state={success ? 'resolved' : 'warning'}>
          {success ? copy.success : copy.fatal}
        </InteractionTitle>
        <button type="button" className="interaction-primary-btn" onClick={() => onComplete(result)}>
          {copy.continue}
        </button>
      </section>
    );
  }

  return (
    <section className="protocol-cut" aria-labelledby="protocol-cut-title" data-reduced-motion={reducedMotion || undefined}>
      <p className="interaction-kicker">{copy.kicker}</p>
      <InteractionTitle id="protocol-cut-title">{copy.title}</InteractionTitle>
      <p className="interaction-mission">{copy.mission}</p>
      <div className="protocol-cut-telemetry">
        <span>{copy.remaining}</span>
        <strong>{(remainingMs / 1000).toFixed(1)} s</strong>
        <div><i style={{ width: `${remainingMs / WINDOW_MS * 100}%` }} /></div>
      </div>
      <div className="protocol-cut-steps">
        <button type="button" onClick={() => setRouteHeld(true)} data-complete={routeHeld || undefined}>
          <RouteMark complete={routeHeld} />
          <span>01</span>
          <strong>{copy.route}</strong>
        </button>
        <button type="button" disabled={!routeHeld} onClick={() => setBusArmed(true)} data-complete={busArmed || undefined}>
          <Cable aria-hidden />
          <span>02</span>
          <strong>{copy.bus}</strong>
        </button>
      </div>
      <button
        type="button"
        className="protocol-cut-hold"
        disabled={!routeHeld || !busArmed}
        data-holding={holding || undefined}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && !holding) startHold();
        }}
        onKeyUp={event => {
          if (event.key === 'Enter' || event.key === ' ') stopHold();
        }}
      >
        <span
          className="protocol-cut-hold-ring"
          style={{ '--hold-progress': `${holdProgress * 100}%` } as CSSProperties}
          aria-hidden
        />
        <Power aria-hidden />
        <strong>{holding ? copy.holding : copy.hold}</strong>
      </button>
    </section>
  );
}

function RouteMark({ complete }: { complete: boolean }) {
  return complete ? <Check aria-hidden /> : <span className="protocol-route-mark" aria-hidden>07</span>;
}
