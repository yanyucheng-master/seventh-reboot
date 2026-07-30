import { useEffect, useRef, useState } from 'react';
import { LockKeyhole, RotateCcw, ShieldAlert, X } from 'lucide-react';
import type { SpecialInteractionCompletion } from '../types';
import { BulkheadGasLayer, type BulkheadGasMode } from './BulkheadGasLayer';
import type { SpecialInteractionCopy } from './copy';
import {
  evaluateBulkheadDecision,
  type BulkheadEqualizeTarget,
  type BulkheadEvaluation,
  type BulkheadSealTarget,
} from './logic';
import { InteractionTitle } from './InteractionTitle';

type BulkheadIsolationInteractionProps = {
  copy: SpecialInteractionCopy;
  reducedMotion: boolean;
  onResultLocked: (result: SpecialInteractionCompletion) => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const BULKHEAD_WINDOW_MS = 30_000;
const PRESSURE_MIN = 70;
const PRESSURE_MAX = 102;
const PRESSURE_SAFE_MIN = 94;
const PRESSURE_SAFE_MAX = 101;

type BulkheadStep = 'seal' | 'route';
type BulkheadExecutionMode = 'idle' | 'locking' | 'purging';

function completionFromEvaluation(evaluation: BulkheadEvaluation): SpecialInteractionCompletion {
  return {
    kind: 'bulkhead-isolation',
    routeKey: evaluation.result,
    ...(evaluation.failureReason ? { failureReason: evaluation.failureReason } : {}),
  };
}

function clampPressure(value: number): number {
  return Math.max(PRESSURE_MIN, Math.min(PRESSURE_MAX, value));
}

export function BulkheadIsolationInteraction({
  copy,
  reducedMotion,
  onResultLocked,
  onComplete,
}: BulkheadIsolationInteractionProps) {
  const startedAtRef = useRef(0);
  const pressureRef = useRef(84);
  const executionTimerRef = useRef<number | null>(null);
  const checkpointedRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(BULKHEAD_WINDOW_MS);
  const [sealTarget, setSealTarget] = useState<BulkheadSealTarget | null>(null);
  const [equalizeTarget, setEqualizeTarget] = useState<BulkheadEqualizeTarget | null>(null);
  const [activeStep, setActiveStep] = useState<BulkheadStep>('seal');
  const [flowActive, setFlowActive] = useState(false);
  const [transitionPressure, setTransitionPressure] = useState(84);
  const [lockedPressure, setLockedPressure] = useState<number | null>(null);
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [executionMode, setExecutionMode] = useState<BulkheadExecutionMode>('idle');
  const [evaluation, setEvaluation] = useState<BulkheadEvaluation | null>(null);

  useEffect(() => {
    startedAtRef.current = performance.now();
    return () => {
      if (executionTimerRef.current !== null) {
        window.clearTimeout(executionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!evaluation || checkpointedRef.current) return;
    checkpointedRef.current = true;
    onResultLocked(completionFromEvaluation(evaluation));
  }, [evaluation, onResultLocked]);

  useEffect(() => {
    if (evaluation || executionMode !== 'idle') return;
    const timer = window.setInterval(() => {
      const elapsedMs = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, BULKHEAD_WINDOW_MS - elapsedMs);
      setRemainingMs(nextRemaining);
      if (nextRemaining === 0) {
        setEvaluation(evaluateBulkheadDecision({
          sealTarget: sealTarget ?? 'observation',
          equalizeTarget: equalizeTarget ?? 'hallway',
          transitionPressure: pressureRef.current,
          elapsedMs,
          timedOut: true,
        }));
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [equalizeTarget, evaluation, executionMode, sealTarget]);

  useEffect(() => {
    if (evaluation) return;
    let animationFrame = 0;
    let lastFrame = performance.now();
    let lastRender = lastFrame;

    const updatePressure = (now: number) => {
      const deltaMs = Math.min(100, Math.max(0, now - lastFrame));
      lastFrame = now;
      let nextPressure = pressureRef.current;

      if (executionMode === 'purging') {
        nextPressure -= deltaMs * 0.032;
      } else if (executionMode !== 'locking') {
        if (flowActive && equalizeTarget === 'hallway') {
          const response = 1 - Math.exp(-0.00105 * deltaMs);
          nextPressure += (101 - nextPressure) * response;
        } else if (flowActive && equalizeTarget === 'observation') {
          const response = 1 - Math.exp(-0.0009 * deltaMs);
          nextPressure += (71 - nextPressure) * response;
        } else if (sealTarget !== 'observation') {
          nextPressure -= deltaMs * 0.00013;
        } else {
          nextPressure -= deltaMs * 0.000025;
        }
      }

      pressureRef.current = clampPressure(nextPressure);
      if (now - lastRender >= 50) {
        lastRender = now;
        setTransitionPressure(pressureRef.current);
      }
      animationFrame = window.requestAnimationFrame(updatePressure);
    };

    animationFrame = window.requestAnimationFrame(updatePressure);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [equalizeTarget, evaluation, executionMode, flowActive, sealTarget]);

  if (evaluation) {
    const title = evaluation.result === 'safe'
      ? copy.bulkhead.safeTitle
      : evaluation.result === 'injured'
        ? copy.bulkhead.injuredTitle
        : copy.bulkhead.fatalTitle;
    const detail = evaluation.result === 'safe'
      ? copy.bulkhead.safeDetail
      : evaluation.result === 'injured'
        ? copy.bulkhead.injuredDetail
        : copy.bulkhead.failures[evaluation.failureReason ?? 'seal_timeout'];
    const resultPressure = evaluation.result === 'fatal'
      ? '0 kPa'
      : `${(lockedPressure ?? (evaluation.result === 'safe' ? 101 : 84)).toFixed(1)} kPa`;

    return (
      <section
        className="interaction-result bulkhead-result"
        aria-live="assertive"
        data-testid={`bulkhead-result-${evaluation.result}`}
      >
        <div className="interaction-result-mark" aria-hidden>{resultPressure}</div>
        <p className="interaction-kicker">AURORA / PRESSURE ROUTE LOCKED</p>
        <InteractionTitle state={evaluation.result === 'fatal' ? 'warning' : 'resolved'}>
          {title}
        </InteractionTitle>
        <p>{detail}</p>
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete(completionFromEvaluation(evaluation))}
        >
          {copy.common.continue}
        </button>
      </section>
    );
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const remainingPercent = Math.max(0, remainingMs / BULKHEAD_WINDOW_MS * 100);
  const elapsedMs = BULKHEAD_WINDOW_MS - remainingMs;
  const observationPressure = 71 + Math.sin(elapsedMs / 430) * 0.35;
  const hallwayPressure = 101 + Math.sin(elapsedMs / 720) * 0.08;
  const pressurePercent = (transitionPressure - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN) * 100;
  const pressureInSafeBand = transitionPressure >= PRESSURE_SAFE_MIN
    && transitionPressure <= PRESSURE_SAFE_MAX;
  const canSelectRoute = activeStep === 'route' && !flowActive && executionMode === 'idle';
  const selectedSealLabel = sealTarget === 'observation'
    ? copy.bulkhead.observationSeal
    : sealTarget === 'hallway'
      ? copy.bulkhead.hallwaySeal
      : '';
  const selectedRouteLabel = equalizeTarget === 'hallway'
    ? copy.bulkhead.hallwayLabel
    : equalizeTarget === 'observation'
      ? copy.bulkhead.observationLabel
      : '';
  const pressureState = executionMode === 'purging'
    ? 'critical'
    : flowActive && equalizeTarget === 'hallway'
      ? pressureInSafeBand ? 'ready' : 'rising'
      : flowActive && equalizeTarget === 'observation'
        ? 'critical'
        : sealTarget === 'observation'
          ? 'holding'
          : 'falling';
  const pressureStatus = pressureState === 'ready'
    ? copy.bulkhead.pressureReady
    : pressureState === 'rising'
      ? copy.bulkhead.pressureRising
      : pressureState === 'holding'
        ? copy.bulkhead.pressureHolding
        : pressureState === 'critical'
          ? copy.bulkhead.pressureCritical
          : copy.bulkhead.pressureFalling;
  const gasMode: BulkheadGasMode = executionMode === 'purging'
    ? 'purge'
    : flowActive && equalizeTarget === 'hallway'
      ? 'pressurize'
      : flowActive && equalizeTarget === 'observation'
        ? 'vent'
        : sealTarget === 'observation'
          ? 'sealed'
          : 'leak';

  const selectRoute = (target: Exclude<BulkheadEqualizeTarget, 'purge'>) => {
    if (!canSelectRoute) return;
    setPurgeConfirmOpen(false);
    setEqualizeTarget(target);
  };

  const lockDecision = (target: BulkheadEqualizeTarget) => {
    if (!sealTarget || executionMode !== 'idle') return;
    const pressureAtLock = pressureRef.current;
    const nextEvaluation = evaluateBulkheadDecision({
      sealTarget,
      equalizeTarget: target,
      transitionPressure: pressureAtLock,
      elapsedMs: performance.now() - startedAtRef.current,
    });
    const completion = completionFromEvaluation(nextEvaluation);
    checkpointedRef.current = true;
    onResultLocked(completion);
    setLockedPressure(pressureAtLock);
    setPurgeConfirmOpen(false);
    setExecutionMode(target === 'purge' ? 'purging' : 'locking');
    executionTimerRef.current = window.setTimeout(() => {
      setEvaluation(nextEvaluation);
    }, target === 'purge' ? 900 : 620);
  };

  const resetRoute = () => {
    if (flowActive || executionMode !== 'idle') return;
    setSealTarget(null);
    setEqualizeTarget(null);
    setPurgeConfirmOpen(false);
    setActiveStep('seal');
  };

  return (
    <section
      className="bulkhead-console"
      aria-labelledby="bulkhead-interaction-title"
      data-pressure-state={pressureState}
      data-flow-active={flowActive || undefined}
      data-executing={executionMode !== 'idle' || undefined}
    >
      <div className="bulkhead-briefing">
        <div className="bulkhead-heading">
          <p className="interaction-kicker">{copy.bulkhead.kicker}</p>
          <InteractionTitle id="bulkhead-interaction-title">{copy.bulkhead.title}</InteractionTitle>
        </div>

        <div className="bulkhead-integrity" data-critical={remainingSeconds <= 10 || undefined}>
          <div>
            <span>{copy.bulkhead.remaining}</span>
            <strong>{remainingSeconds.toString().padStart(2, '0')} s</strong>
          </div>
          <div className="bulkhead-integrity-track" aria-hidden>
            <span style={{ width: `${remainingPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="bulkhead-map-stage">
        <div
          className="bulkhead-map"
          data-step={activeStep}
          data-flow-active={flowActive || undefined}
          aria-label={`${copy.bulkhead.pressureMapLabel}${selectedSealLabel ? ` · ${selectedSealLabel}` : ''}`}
        >
          <button
            type="button"
            className="bulkhead-chamber"
            data-anomaly
            data-selectable={canSelectRoute || undefined}
            data-selected={equalizeTarget === 'observation' || undefined}
            disabled={!canSelectRoute}
            aria-pressed={equalizeTarget === 'observation'}
            aria-label={`${copy.bulkhead.routeObservation}, ${observationPressure.toFixed(1)} kPa`}
            onClick={() => selectRoute('observation')}
          >
            <span>{copy.bulkhead.observationLabel}</span>
            <strong>{observationPressure.toFixed(1)} kPa</strong>
            <small>{copy.bulkhead.anomalyMarker}</small>
          </button>
          <div
            className="bulkhead-door"
            data-sealed={sealTarget === 'observation' || undefined}
            data-route={equalizeTarget === 'observation' || undefined}
            aria-hidden
          >
            <span />
            <LockKeyhole size={12} />
          </div>
          <article className="bulkhead-chamber" data-live data-pressure-state={pressureState}>
            <span>{copy.bulkhead.transitionLabel}</span>
            <strong>{transitionPressure.toFixed(1)} kPa</strong>
            <small>{copy.bulkhead.liveMarker}</small>
          </article>
          <div
            className="bulkhead-door"
            data-sealed={sealTarget === 'hallway' || undefined}
            data-route={equalizeTarget === 'hallway' || undefined}
            aria-hidden
          >
            <span />
            <LockKeyhole size={12} />
          </div>
          <button
            type="button"
            className="bulkhead-chamber"
            data-safe
            data-selectable={canSelectRoute || undefined}
            data-selected={equalizeTarget === 'hallway' || undefined}
            disabled={!canSelectRoute}
            aria-pressed={equalizeTarget === 'hallway'}
            aria-label={`${copy.bulkhead.routeHallway}, ${hallwayPressure.toFixed(1)} kPa`}
            onClick={() => selectRoute('hallway')}
          >
            <span>{copy.bulkhead.hallwayLabel}</span>
            <strong>{hallwayPressure.toFixed(1)} kPa</strong>
            <small>{copy.bulkhead.safeMarker}</small>
          </button>
        </div>

        <BulkheadGasLayer mode={gasMode} reducedMotion={reducedMotion} />

        <div
          className="bulkhead-pressure-telemetry"
          data-state={pressureState}
          role="meter"
          aria-label={copy.bulkhead.pressureTelemetry}
          aria-valuemin={PRESSURE_MIN}
          aria-valuemax={PRESSURE_MAX}
          aria-valuenow={Number(transitionPressure.toFixed(1))}
        >
          <div className="bulkhead-pressure-readout">
            <span>{copy.bulkhead.pressureTelemetry}</span>
            <strong>{transitionPressure.toFixed(1)}</strong>
            <small>kPa</small>
          </div>
          <div className="bulkhead-pressure-track" aria-hidden>
            <i
              className="bulkhead-pressure-safe-band"
              style={{
                left: `${(PRESSURE_SAFE_MIN - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN) * 100}%`,
                width: `${(PRESSURE_SAFE_MAX - PRESSURE_SAFE_MIN) / (PRESSURE_MAX - PRESSURE_MIN) * 100}%`,
              }}
            />
            <b style={{ left: `${pressurePercent}%` }} />
            <span className="bulkhead-pressure-tick tick-min">70</span>
            <span className="bulkhead-pressure-tick tick-live">84</span>
            <span className="bulkhead-pressure-tick tick-safe">94</span>
            <span className="bulkhead-pressure-tick tick-max">102</span>
          </div>
          <div className="bulkhead-pressure-status">
            <span>{pressureStatus}</span>
            <small>{copy.bulkhead.safeBand}</small>
          </div>
        </div>
      </div>

      <div className="bulkhead-control" data-step={activeStep}>
        <div className="bulkhead-step-heading">
          <div>
            <span>{activeStep === 'seal' ? '01' : '02'}</span>
            <strong>
              {activeStep === 'seal'
                ? copy.bulkhead.sealPrompt
                : flowActive
                  ? copy.bulkhead.lockPrompt
                  : copy.bulkhead.routePrompt}
            </strong>
          </div>
          <div className="bulkhead-step-actions">
            {activeStep === 'route' && !flowActive && (
              <button
                type="button"
                className="bulkhead-revise-button"
                aria-label={copy.bulkhead.reviseSeal}
                title={copy.bulkhead.reviseSeal}
                onClick={resetRoute}
              >
                <RotateCcw size={15} aria-hidden />
              </button>
            )}
            <div className="bulkhead-step-dots" aria-hidden>
              <i
                data-active={activeStep === 'seal' || undefined}
                data-complete={activeStep === 'route' || undefined}
              />
              <i data-active={activeStep === 'route' || undefined} />
            </div>
          </div>
        </div>

        {activeStep === 'seal' ? (
          <fieldset className="bulkhead-decision-group bulkhead-step-panel">
            <legend className="sr-only">{copy.bulkhead.sealPrompt}</legend>
            <div className="bulkhead-option-grid">
              <button
                type="button"
                className="interaction-secondary-btn"
                data-selected={sealTarget === 'observation' || undefined}
                aria-pressed={sealTarget === 'observation'}
                onClick={() => {
                  setSealTarget('observation');
                  setEqualizeTarget(null);
                  setPurgeConfirmOpen(false);
                  setActiveStep('route');
                }}
              >
                {copy.bulkhead.observationSeal}
              </button>
              <button
                type="button"
                className="interaction-secondary-btn"
                data-selected={sealTarget === 'hallway' || undefined}
                aria-pressed={sealTarget === 'hallway'}
                onClick={() => {
                  setSealTarget('hallway');
                  setEqualizeTarget(null);
                  setPurgeConfirmOpen(false);
                  setActiveStep('route');
                }}
              >
                {copy.bulkhead.hallwaySeal}
              </button>
            </div>
          </fieldset>
        ) : null}

        {activeStep === 'route' && (
          <div className="bulkhead-route-actions bulkhead-step-panel">
            <button
              type="button"
              className="interaction-primary-btn bulkhead-execute"
              disabled={!sealTarget || !equalizeTarget || executionMode !== 'idle'}
              data-ready={equalizeTarget || undefined}
              data-flow-active={flowActive || undefined}
              data-testid="bulkhead-submit"
              aria-label={equalizeTarget
                ? `${copy.bulkhead.transitionLabel} → ${selectedRouteLabel} · ${
                  flowActive ? copy.bulkhead.lockPressure : copy.bulkhead.startFlow
                }`
                : copy.bulkhead.selectRoute}
              onClick={() => {
                if (!equalizeTarget || executionMode !== 'idle') return;
                if (!flowActive) {
                  setPurgeConfirmOpen(false);
                  setFlowActive(true);
                  return;
                }
                lockDecision(equalizeTarget);
              }}
            >
              {equalizeTarget ? (
                <>
                  <span>
                    {copy.bulkhead.transitionLabel} → {selectedRouteLabel}
                    {flowActive ? ` · ${transitionPressure.toFixed(1)} kPa` : ''}
                  </span>
                  <strong>
                    {executionMode === 'locking'
                      ? copy.bulkhead.pressureLocking
                      : flowActive
                        ? copy.bulkhead.lockPressure
                        : copy.bulkhead.startFlow}
                  </strong>
                </>
              ) : (
                <strong>{copy.bulkhead.selectRoute}</strong>
              )}
            </button>

            {!flowActive && executionMode === 'idle' && (
              <div className="bulkhead-hazard" data-open={purgeConfirmOpen || undefined}>
                {purgeConfirmOpen ? (
                  <div
                    className="bulkhead-purge-dialog"
                    role="alertdialog"
                    aria-labelledby="bulkhead-purge-title"
                    aria-describedby="bulkhead-purge-warning"
                  >
                    <ShieldAlert size={18} aria-hidden />
                    <div>
                      <strong id="bulkhead-purge-title">{copy.bulkhead.purgeConfirmTitle}</strong>
                      <span id="bulkhead-purge-warning">{copy.bulkhead.purgeWarning}</span>
                    </div>
                    <button
                      type="button"
                      className="bulkhead-purge-cancel"
                      aria-label={copy.common.cancel}
                      title={copy.common.cancel}
                      onClick={() => setPurgeConfirmOpen(false)}
                    >
                      <X size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="interaction-danger-btn bulkhead-purge-confirm"
                      data-testid="bulkhead-purge-confirm"
                      onClick={() => lockDecision('purge')}
                    >
                      {copy.bulkhead.purgeConfirm}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="bulkhead-purge-trigger"
                    data-testid="bulkhead-purge-open"
                    onClick={() => setPurgeConfirmOpen(true)}
                  >
                    <ShieldAlert size={14} aria-hidden />
                    {copy.bulkhead.purgeAccess}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
