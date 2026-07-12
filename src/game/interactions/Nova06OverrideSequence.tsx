import { useEffect, useRef, useState } from 'react';
import type { SpecialInteractionCopy } from './copy';

type Nova06Phase = 'precursor' | 'tear' | 'identity' | 'script' | 'note' | 'outro';

type Nova06OverrideSequenceProps = {
  /** full = 一周目首次完整重度演出；light = 后续互动的轻量演出 */
  mode: 'full' | 'light';
  reducedMotion: boolean;
  copy: SpecialInteractionCopy['nova06'];
  /** 演出前兆的系统行；供能互动可换成 ROUTING SCRIPT 检测行 */
  detectLines?: string[];
  /** NOVA-06 预录留言（note 阶段展示） */
  unknownLines: string[];
  /** script 阶段逐行出现的系统执行行 */
  scriptLines: string[];
  /** 可选的预留注释（如 ROUTING NOTE），出现在留言之后 */
  noteLines?: string[];
  /** 进入 script 阶段时调用；返回的 Promise 结束后进入留言阶段 */
  runScript: () => Promise<void>;
  /** 留言停留结束后、电视机关闭特效播完时触发 */
  onDone: () => void;
};

/** 与预览「特效重构版」对齐的时序 */
const FULL_TIMINGS = {
  precursor: 1750,
  tear: 560,
  identity: 1650,
  noteHold: 4200,
  outro: 520,
};
const LIGHT_TIMINGS = {
  precursor: 0,
  tear: 380,
  identity: 1050,
  noteHold: 3300,
  outro: 420,
};
const REDUCED_TIMINGS = {
  precursor: 1200,
  tear: 260,
  identity: 900,
  noteHold: 3000,
  outro: 360,
};

const GLITCH_SLICES: Array<{
  top: string;
  height: string;
  from: string;
  to: string;
  delay: string;
  warm: boolean;
}> = [
  { top: '12%', height: '1.7%', from: '-18px', to: '10px', delay: '0ms', warm: false },
  { top: '24%', height: '2.4%', from: '14px', to: '-9px', delay: '35ms', warm: true },
  { top: '37%', height: '1.3%', from: '-11px', to: '7px', delay: '70ms', warm: false },
  { top: '48%', height: '3.1%', from: '18px', to: '-12px', delay: '95ms', warm: false },
  { top: '61%', height: '1.8%', from: '-15px', to: '9px', delay: '125ms', warm: true },
  { top: '73%', height: '2.6%', from: '12px', to: '-8px', delay: '155ms', warm: false },
  { top: '84%', height: '1.4%', from: '-9px', to: '6px', delay: '185ms', warm: false },
];

type TypedBlock = {
  done: string[];
  current: string;
  complete: boolean;
};

type IdentityMeters = {
  hash: number;
  route: number;
  identity: number;
  hashLabel: string;
  routeLabel: string;
  idLabel: string;
  statusHtml: 'unresolved' | 'route' | 'confirmed';
};

const INITIAL_METERS: IdentityMeters = {
  hash: 17,
  route: 0,
  identity: 0,
  hashLabel: '17%',
  routeLabel: '--',
  idLabel: '0%',
  statusHtml: 'unresolved',
};

/**
 * NOVA-06 残留签名越权接管演出（特效重构版 V3）。
 * 全屏层只挂载一次；逐字只改 text，避免重建闪烁。
 * 流程：冷系统告警 → 细切片撕裂 → 身份锁定 → 线路写入 → 橙色留言 → CRT 收束。
 */
export function Nova06OverrideSequence({
  mode,
  reducedMotion,
  copy,
  detectLines,
  unknownLines,
  scriptLines,
  noteLines,
  runScript,
  onDone,
}: Nova06OverrideSequenceProps) {
  const [phase, setPhase] = useState<Nova06Phase>(mode === 'light' ? 'tear' : 'precursor');
  const [panelEntering, setPanelEntering] = useState(true);
  const [visibleScriptLines, setVisibleScriptLines] = useState(0);
  const [detectTyped, setDetectTyped] = useState<TypedBlock>({ done: [], current: '', complete: false });
  const [noteTyped, setNoteTyped] = useState<TypedBlock>({ done: [], current: '', complete: false });
  const [identityReformed, setIdentityReformed] = useState(false);
  const [meters, setMeters] = useState<IdentityMeters>(INITIAL_METERS);
  const [stability, setStability] = useState('18%');
  const [routeStep, setRouteStep] = useState(0);
  const timersRef = useRef<number[]>([]);
  const scriptStartedRef = useRef(false);
  const noteStartedRef = useRef(false);
  const runScriptRef = useRef(runScript);
  const onDoneRef = useRef(onDone);
  runScriptRef.current = runScript;
  onDoneRef.current = onDone;

  const timings = mode === 'light'
    ? LIGHT_TIMINGS
    : reducedMotion ? REDUCED_TIMINGS : FULL_TIMINGS;

  useEffect(() => {
    const timers = timersRef.current;
    later(340, () => setPanelEntering(false));
    return () => {
      timers.forEach(id => window.clearTimeout(id));
      timers.length = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  function later(delayMs: number, action: () => void) {
    timersRef.current.push(window.setTimeout(action, delayMs));
  }

  /** 逐字逐句打字；返回打完时间点（ms） */
  function scheduleTyping(
    lines: string[],
    onUpdate: (block: TypedBlock) => void,
    opts?: { charMs?: number; lineGap?: number },
  ): number {
    const charMs = reducedMotion ? 12 : (opts?.charMs ?? 32);
    const lineGap = reducedMotion ? 80 : (opts?.lineGap ?? 150);
    let t = 0;
    onUpdate({ done: [], current: '', complete: false });
    lines.forEach((line, lineIndex) => {
      for (let i = 0; i < line.length; i += 1) {
        t += charMs;
        const slice = line.slice(0, i + 1);
        const done = lines.slice(0, lineIndex);
        later(t, () => onUpdate({ done, current: slice, complete: false }));
      }
      t += lineGap;
      later(t, () => onUpdate({
        done: lines.slice(0, lineIndex + 1),
        current: '',
        complete: lineIndex === lines.length - 1,
      }));
    });
    return t;
  }

  useEffect(() => {
    if (phase === 'precursor') {
      const lines = [...(detectLines ?? copy.precursorLines)];
      const typedAt = scheduleTyping(lines, setDetectTyped, { charMs: 28, lineGap: 120 });
      later(Math.max(typedAt + 220, timings.precursor), () => setPhase('tear'));
      return;
    }
    if (phase === 'tear') {
      later(timings.tear, () => setPhase('identity'));
      return;
    }
    if (phase === 'identity') {
      const checkpoints: Array<[number, number]> = [[260, 41], [590, 73], [930, 96]];
      checkpoints.forEach(([at, pct]) => {
        later(at, () => {
          setMeters(prev => ({
            ...prev,
            hash: pct,
            identity: pct,
            hashLabel: `${pct}%`,
            idLabel: `${pct}%`,
          }));
          setStability(`${Math.max(18, Math.round(pct * 0.72))}%`);
        });
      });
      later(520, () => {
        setMeters(prev => ({
          ...prev,
          route: 100,
          routeLabel: 'FOUND',
          statusHtml: 'route',
        }));
      });
      later(1160, () => {
        setIdentityReformed(true);
        setMeters({
          hash: 100,
          route: 100,
          identity: 100,
          hashLabel: '100%',
          routeLabel: 'FOUND',
          idLabel: 'LOCK',
          statusHtml: 'confirmed',
        });
        setStability('96%');
      });
      later(timings.identity, () => setPhase('script'));
      return;
    }
    if (phase === 'script' && !scriptStartedRef.current) {
      scriptStartedRef.current = true;
      const lineDelay = reducedMotion ? 220 : 380;
      let linesDoneAt = 0;
      scriptLines.forEach((_, index) => {
        const at = lineDelay * (index + 1);
        linesDoneAt = at;
        later(at, () => {
          setVisibleScriptLines(index + 1);
          setRouteStep(index + 1);
          setStability(`${Math.min(99, 72 + (index + 1) * 8)}%`);
        });
      });
      const scriptVisualDone = new Promise<void>(resolve => {
        later(linesDoneAt + (reducedMotion ? 420 : 720), () => resolve());
      });
      void Promise.all([runScriptRef.current(), scriptVisualDone]).then(() => {
        later(reducedMotion ? 80 : 160, () => {
          setVisibleScriptLines(scriptLines.length);
          setRouteStep(Math.max(scriptLines.length, 1));
          setStability('100%');
          setPhase('note');
        });
      });
      return;
    }
    if (phase === 'note' && !noteStartedRef.current) {
      noteStartedRef.current = true;
      setStability('100%');
      const typedAt = scheduleTyping(unknownLines, setNoteTyped, {
        charMs: reducedMotion ? 18 : 58,
        lineGap: 220,
      });
      later(Math.max(typedAt + 1500, timings.noteHold), () => setPhase('outro'));
      return;
    }
    if (phase === 'outro') {
      later(timings.outro + 100, () => onDoneRef.current());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- phase machine only reacts to phase changes
  }, [phase]);

  const showPanel = phase !== 'outro';
  const panelClass = [
    'nova06-panel',
    phase === 'precursor' && 'nova06-precursor',
    phase === 'tear' && 'nova06-unauthorized',
    phase === 'identity' && 'nova06-identity',
    (phase === 'script' || phase === 'note') && 'nova06-script',
  ].filter(Boolean).join(' ');

  const identityStatus = meters.statusHtml === 'confirmed'
    ? <>IDENTITY / <strong>CONFIRMED</strong></>
    : meters.statusHtml === 'route'
      ? <>LEGACY ROUTE / <strong>FOUND</strong></>
      : <>SOURCE / <strong>UNRESOLVED</strong></>;

  return (
    <div
      className="nova06-override"
      data-phase={phase}
      data-mode={mode}
      role="alert"
      aria-live="assertive"
    >
      <div className="nova06-stage-wash" aria-hidden />
      <div className="nova06-scanlines" aria-hidden />
      <div className="nova06-flash" aria-hidden />
      <div className="nova06-glitch-slices" aria-hidden>
        {GLITCH_SLICES.map(slice => (
          <span
            key={slice.top}
            className="nova06-glitch-slice"
            data-warm={slice.warm || undefined}
            style={{
              ['--top' as string]: slice.top,
              ['--height' as string]: slice.height,
              ['--from' as string]: slice.from,
              ['--to' as string]: slice.to,
              ['--delay' as string]: slice.delay,
            }}
          />
        ))}
      </div>
      <div className="nova06-route-map" data-step={routeStep} aria-hidden>
        <i className="nova06-route-line r1" />
        <i className="nova06-route-line r2" />
        <i className="nova06-route-line r3" />
        <i className="nova06-route-line r4" />
        <b className="nova06-route-node n1" />
        <b className="nova06-route-node n2" />
        <b className="nova06-route-node n3" />
        <b className="nova06-route-node n4" />
        <b className="nova06-route-node n5" />
        <b className="nova06-route-node n6" />
      </div>
      <div className="nova06-hud" aria-hidden>
        <div className="nova06-hud-corner nova06-hud-tl">
          <b>LEGACY ROUTE 06</b>
          <span>CHANNEL / UNREGISTERED</span>
        </div>
        <div className="nova06-hud-corner nova06-hud-tr">
          <b>CONTROL OVERRIDE</b>
          <span>ACCESS / READ-WRITE</span>
        </div>
        <div className="nova06-hud-corner nova06-hud-bl">
          <b>SOURCE / RESIDUAL</b>
          <span>MEMORY SAFE MODE</span>
        </div>
        <div className="nova06-hud-corner nova06-hud-br">
          <b>CHANNEL STABILITY</b>
          <em className="nova06-stability-text">{stability}</em>
        </div>
      </div>
      <div className="nova06-grain" aria-hidden />
      <div className="nova06-tv-shutdown" aria-hidden />

      {showPanel && (
        <div
          className={panelClass}
          data-entering={panelEntering || undefined}
          data-note={phase === 'note' || undefined}
        >
          {phase === 'precursor' && (
            <>
              <div className="nova06-precursor-label">SYSTEM / ANOMALOUS PROCESS</div>
              <div className="nova06-precursor-lines" aria-label="system alert log">
                <div className="nova06-completed-lines">
                  {detectTyped.done.map(line => (
                    <p key={line} className="nova06-sysline">{line}</p>
                  ))}
                </div>
                {(detectTyped.current || !detectTyped.complete) && (
                  <p className="nova06-sysline nova06-current-line">
                    {detectTyped.current}
                    <span className="nova06-caret" aria-hidden>█</span>
                  </p>
                )}
              </div>
            </>
          )}

          {phase === 'tear' && (
            <>
              <strong>{copy.unauthorized}</strong>
              <span>{copy.source}</span>
              <div className="nova06-identity-status">
                CHANNEL INTEGRITY / <strong>COMPROMISED</strong>
              </div>
            </>
          )}

          {phase === 'identity' && (
            <>
              <div className="nova06-identity-head">
                <span className="nova06-tag" data-reformed={identityReformed || undefined}>
                  <span className="nova06-tag-text">
                    {identityReformed ? copy.signatureTag : copy.unknownTag}
                  </span>
                </span>
              </div>
              <div className="nova06-identity-grid">
                <div className="nova06-identity-row">
                  <span>SIGNATURE HASH</span>
                  <div className="nova06-identity-meter">
                    <i style={{ ['--match' as string]: `${meters.hash}%` }} />
                  </div>
                  <b className="nova06-match">{meters.hashLabel}</b>
                </div>
                <div className="nova06-identity-row">
                  <span>LEGACY ROUTE</span>
                  <div className="nova06-identity-meter">
                    <i style={{ ['--match' as string]: `${meters.route}%` }} />
                  </div>
                  <b className="nova06-route-match">{meters.routeLabel}</b>
                </div>
                <div className="nova06-identity-row">
                  <span>IDENTITY MATCH</span>
                  <div className="nova06-identity-meter">
                    <i style={{ ['--match' as string]: `${meters.identity}%` }} />
                  </div>
                  <b className="nova06-id-match">{meters.idLabel}</b>
                </div>
              </div>
              <p className="nova06-identity-status">{identityStatus}</p>
            </>
          )}

          {phase === 'script' && (
            <>
              <div className="nova06-infect-rail" aria-hidden />
              <div className="nova06-identity-head">
                <span className="nova06-tag" data-reformed>
                  <span className="nova06-tag-text">{copy.signatureTag}</span>
                </span>
              </div>
              <div className="nova06-script-status">
                <span>RECOVERY SCRIPT / EXECUTING</span>
                <b className="nova06-script-count">{visibleScriptLines} / {scriptLines.length}</b>
              </div>
              <div className="nova06-script-lines">
                {scriptLines.slice(0, visibleScriptLines).map(line => (
                  <p key={line} className="nova06-sysline nova06-script-line">{line}</p>
                ))}
              </div>
              {visibleScriptLines < scriptLines.length && (
                <p className="nova06-sysline nova06-current-line" aria-hidden>
                  <span className="nova06-caret">█</span>
                </p>
              )}
            </>
          )}

          {phase === 'note' && (
            <>
              <div className="nova06-note-status">
                <span className="nova06-tag" data-reformed>
                  <span className="nova06-tag-text">{copy.signatureTag}</span>
                </span>
                <span className="nova06-note-status-line">{copy.scriptExecuted}</span>
              </div>
              <div className="nova06-bubble">
                <div className="nova06-completed-lines">
                  {noteTyped.done.map(line => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {(noteTyped.current || !noteTyped.complete) && (
                  <p className="nova06-current-line">
                    {noteTyped.current}
                    <span className="nova06-caret" aria-hidden>█</span>
                  </p>
                )}
              </div>
              {noteLines && noteLines.length > 0 && noteTyped.complete && (
                <div className="nova06-note">
                  {noteLines.map(line => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
