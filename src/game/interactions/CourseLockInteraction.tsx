import { RotateCcw, Route } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '../../i18n';
import type { SpecialInteractionCompletion } from '../types';
import { InteractionTitle } from './InteractionTitle';
import { remainingUntil } from '../timedRuntime';

type WaypointId = 'N-17' | 'K-04' | 'V-22' | 'S-7';

type Props = {
  locale: Locale;
  reducedMotion: boolean;
  deadlineAt: number;
  onResultLocked: (result: SpecialInteractionCompletion) => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const SAFE_ORDER: WaypointId[] = ['N-17', 'K-04', 'V-22'];
const WAYPOINTS: Array<{ id: WaypointId; x: number; y: number; danger?: boolean }> = [
  { id: 'N-17', x: 18, y: 66 },
  { id: 'K-04', x: 43, y: 36 },
  { id: 'V-22', x: 78, y: 58 },
  { id: 'S-7', x: 59, y: 55, danger: true },
];

const COPY = {
  'zh-CN': {
    kicker: 'AURORA / NAVIGATION WRITE',
    title: '新航线锁定',
    mission: '按 Nova 标出的顺序锁定三个航路点。红色 S-7 不属于新航线。',
    routeOrder: 'NOVA 已计算航序',
    remaining: '写入窗口',
    reset: '清除航迹',
    submit: '校验并写入',
    dangerTitle: '航迹将穿越 S-7 核心区',
    dangerBody: '这会把 Aurora 送回共振区。危险写入需要再次确认。',
    cancel: '撤销危险航迹',
    fatal: '仍然写入',
    success: '新航线已锁定',
    retry: '航路点顺序不一致 / 未执行写入',
    failed: '危险航线已提交',
    continue: '继续通讯',
    retryAction: '重新校准',
  },
  'en-US': {
    kicker: 'AURORA / NAVIGATION WRITE',
    title: 'Lock new course',
    mission: "Lock the three waypoints in Nova's order. The red S-7 core is not part of the new route.",
    routeOrder: 'NOVA CALCULATED ORDER',
    remaining: 'WRITE WINDOW',
    reset: 'Clear track',
    submit: 'Validate and write',
    dangerTitle: 'Track crosses the S-7 core',
    dangerBody: 'This would send Aurora back into the resonance zone. A dangerous write requires confirmation.',
    cancel: 'Cancel dangerous track',
    fatal: 'Write anyway',
    success: 'New course locked',
    retry: 'Waypoint order mismatch / route not written',
    failed: 'Dangerous course submitted',
    continue: 'Continue transmission',
    retryAction: 'Recalibrate',
  },
} as const;

export function CourseLockInteraction({ locale, reducedMotion, deadlineAt, onResultLocked, onComplete }: Props) {
  const copy = COPY[locale];
  const [selected, setSelected] = useState<WaypointId[]>([]);
  const [remainingMs, setRemainingMs] = useState(() => remainingUntil(deadlineAt));
  const [dangerConfirm, setDangerConfirm] = useState(false);
  const [result, setResult] = useState<Extract<SpecialInteractionCompletion, { kind: 'course-lock' }> | null>(null);
  const finished = useRef(false);

  const lockResult = useCallback((routeKey: 'success' | 'retry' | 'fatal') => {
    if (finished.current) return;
    finished.current = true;
    const completion = { kind: 'course-lock' as const, routeKey };
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
    const timer = window.setInterval(tick, 120);
    return () => window.clearInterval(timer);
  }, [deadlineAt, lockResult, result]);

  function chooseWaypoint(id: WaypointId) {
    if (result) return;
    if (id === 'S-7') {
      setSelected(current => [...current.filter(item => item !== id), id]);
      setDangerConfirm(true);
      return;
    }
    if (selected.includes(id) || selected.length >= 3) return;
    setSelected(current => [...current, id]);
  }

  function submit() {
    if (selected.includes('S-7')) {
      setDangerConfirm(true);
      return;
    }
    const correct = SAFE_ORDER.every((id, index) => selected[index] === id);
    lockResult(correct ? 'success' : 'retry');
  }

  if (result) {
    const success = result.routeKey === 'success';
    const retry = result.routeKey === 'retry';
    return (
      <section className="interaction-result course-lock-result" aria-live="assertive">
        <Route className="course-lock-result-icon" aria-hidden />
        <p className="interaction-kicker">{copy.kicker}</p>
        <InteractionTitle state={success ? 'resolved' : 'warning'}>
          {success ? copy.success : retry ? copy.retry : copy.failed}
        </InteractionTitle>
        <button type="button" className="interaction-primary-btn" onClick={() => onComplete(result)}>
          {retry ? copy.retryAction : copy.continue}
        </button>
      </section>
    );
  }

  return (
    <section className="course-lock" aria-labelledby="course-lock-title" data-reduced-motion={reducedMotion || undefined}>
      <p className="interaction-kicker">{copy.kicker}</p>
      <InteractionTitle id="course-lock-title">{copy.title}</InteractionTitle>
      <p className="interaction-mission">{copy.mission}</p>
      <div className="course-lock-status">
        <span>{copy.routeOrder}: <strong>{SAFE_ORDER.join(' → ')}</strong></span>
        <span>{copy.remaining}: <strong>{Math.ceil(remainingMs / 1000)} s</strong></span>
      </div>
      <div className="course-map" role="group" aria-label={copy.title}>
        <div className="course-orbit course-orbit-a" aria-hidden />
        <div className="course-orbit course-orbit-b" aria-hidden />
        <div className="course-track-line" aria-hidden />
        {WAYPOINTS.map(point => (
          <button
            type="button"
            key={point.id}
            className="course-waypoint"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            data-danger={point.danger || undefined}
            data-selected={selected.includes(point.id) || undefined}
            onClick={() => chooseWaypoint(point.id)}
            aria-label={point.id}
          >
            <span>{selected.indexOf(point.id) + 1 || ''}</span>
            <strong>{point.id}</strong>
          </button>
        ))}
        <span className="course-ship" aria-hidden>07</span>
      </div>
      <div className="interaction-action-row">
        <button type="button" className="interaction-secondary-btn" onClick={() => setSelected([])} disabled={!selected.length}>
          <RotateCcw aria-hidden />
          {copy.reset}
        </button>
        <button type="button" className="interaction-primary-btn" onClick={submit} disabled={selected.length < 3}>
          {copy.submit}
        </button>
      </div>
      {dangerConfirm && (
        <div className="interaction-confirm-layer" role="alertdialog" aria-modal="true" aria-labelledby="course-danger-title">
          <div className="interaction-confirm-panel">
            <InteractionTitle id="course-danger-title" state="warning">{copy.dangerTitle}</InteractionTitle>
            <p>{copy.dangerBody}</p>
            <button type="button" className="interaction-secondary-btn" onClick={() => {
              setDangerConfirm(false);
              setSelected(current => current.filter(item => item !== 'S-7'));
            }}>{copy.cancel}</button>
            <button type="button" className="interaction-danger-btn" onClick={() => lockResult('fatal')}>{copy.fatal}</button>
          </div>
        </div>
      )}
    </section>
  );
}
