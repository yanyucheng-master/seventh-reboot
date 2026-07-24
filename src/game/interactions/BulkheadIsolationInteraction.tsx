import { useEffect, useRef, useState } from 'react';
import type { SpecialInteractionCompletion } from '../types';
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
  onResultLocked: (result: SpecialInteractionCompletion) => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const BULKHEAD_WINDOW_MS = 30_000;

export function BulkheadIsolationInteraction({
  copy,
  onResultLocked,
  onComplete,
}: BulkheadIsolationInteractionProps) {
  const startedAtRef = useRef(0);
  const [remainingMs, setRemainingMs] = useState(BULKHEAD_WINDOW_MS);
  const [sealTarget, setSealTarget] = useState<BulkheadSealTarget | null>(null);
  const [equalizeTarget, setEqualizeTarget] = useState<BulkheadEqualizeTarget | null>(null);
  const [evaluation, setEvaluation] = useState<BulkheadEvaluation | null>(null);
  const checkpointedRef = useRef(false);

  useEffect(() => {
    startedAtRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (!evaluation || checkpointedRef.current) return;
    checkpointedRef.current = true;
    onResultLocked({
      kind: 'bulkhead-isolation',
      routeKey: evaluation.result,
      ...(evaluation.failureReason ? { failureReason: evaluation.failureReason } : {}),
    });
  }, [evaluation, onResultLocked]);

  useEffect(() => {
    if (evaluation) return;
    const timer = window.setInterval(() => {
      const elapsedMs = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, BULKHEAD_WINDOW_MS - elapsedMs);
      setRemainingMs(nextRemaining);
      if (nextRemaining === 0) {
        setEvaluation(evaluateBulkheadDecision({
          sealTarget: sealTarget ?? 'observation',
          equalizeTarget: equalizeTarget ?? 'hallway',
          elapsedMs,
          timedOut: true,
        }));
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [equalizeTarget, evaluation, sealTarget]);

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

    return (
      <section
        className="interaction-result bulkhead-result"
        aria-live="assertive"
        data-testid={`bulkhead-result-${evaluation.result}`}
      >
        <div className="interaction-result-mark" aria-hidden>
          {evaluation.result === 'safe' ? '101 kPa' : evaluation.result === 'injured' ? '84 kPa' : '0 kPa'}
        </div>
        <p className="interaction-kicker">AURORA / PRESSURE ROUTE LOCKED</p>
        <InteractionTitle state={evaluation.result === 'fatal' ? 'warning' : 'resolved'}>
          {title}
        </InteractionTitle>
        <p>{detail}</p>
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete({
            kind: 'bulkhead-isolation',
            routeKey: evaluation.result,
            ...(evaluation.failureReason ? { failureReason: evaluation.failureReason } : {}),
          })}
        >
          {copy.common.continue}
        </button>
      </section>
    );
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const remainingPercent = Math.max(0, remainingMs / BULKHEAD_WINDOW_MS * 100);

  return (
    <section className="bulkhead-console" aria-labelledby="bulkhead-interaction-title">
      <p className="interaction-kicker">{copy.bulkhead.kicker}</p>
      <InteractionTitle id="bulkhead-interaction-title">{copy.bulkhead.title}</InteractionTitle>
      <p className="interaction-mission">{copy.bulkhead.mission}</p>

      <div className="bulkhead-integrity" data-critical={remainingSeconds <= 10 || undefined}>
        <div>
          <span>{copy.bulkhead.remaining}</span>
          <strong>{remainingSeconds.toString().padStart(2, '0')} s</strong>
        </div>
        <div className="bulkhead-integrity-track" aria-hidden>
          <span style={{ width: `${remainingPercent}%` }} />
        </div>
      </div>

      <div className="bulkhead-map" aria-label="Pressure map">
        <article className="bulkhead-chamber" data-anomaly>
          <span>OBSERVATORY</span>
          <strong>71 kPa</strong>
          <small>{copy.bulkhead.anomalyMarker}</small>
        </article>
        <div className="bulkhead-door" aria-hidden>DOOR A</div>
        <article className="bulkhead-chamber" data-live>
          <span>TRANSITION</span>
          <strong>84 kPa</strong>
          <small>{copy.bulkhead.liveMarker}</small>
        </article>
        <div className="bulkhead-door" aria-hidden>DOOR B</div>
        <article className="bulkhead-chamber" data-safe>
          <span>MAIN CORRIDOR</span>
          <strong>101 kPa</strong>
          <small>SAFE EXIT</small>
        </article>
      </div>

      <blockquote className="bulkhead-live-order">
        <span>NOVA-07 / LIVE</span>
        {copy.bulkhead.instruction}
      </blockquote>

      <fieldset className="bulkhead-decision-group">
        <legend>{copy.bulkhead.sealStep}</legend>
        <div className="bulkhead-option-grid">
          <button
            type="button"
            className="interaction-secondary-btn"
            data-selected={sealTarget === 'observation' || undefined}
            aria-pressed={sealTarget === 'observation'}
            onClick={() => setSealTarget('observation')}
          >
            {copy.bulkhead.observationSeal}
          </button>
          <button
            type="button"
            className="interaction-secondary-btn"
            data-selected={sealTarget === 'hallway' || undefined}
            aria-pressed={sealTarget === 'hallway'}
            onClick={() => setSealTarget('hallway')}
          >
            {copy.bulkhead.hallwaySeal}
          </button>
        </div>
      </fieldset>

      <fieldset className="bulkhead-decision-group">
        <legend>{copy.bulkhead.routeStep}</legend>
        <div className="bulkhead-option-grid bulkhead-route-grid">
          <button
            type="button"
            className="interaction-secondary-btn"
            data-selected={equalizeTarget === 'hallway' || undefined}
            aria-pressed={equalizeTarget === 'hallway'}
            onClick={() => setEqualizeTarget('hallway')}
          >
            {copy.bulkhead.routeHallway}
          </button>
          <button
            type="button"
            className="interaction-secondary-btn"
            data-selected={equalizeTarget === 'observation' || undefined}
            aria-pressed={equalizeTarget === 'observation'}
            onClick={() => setEqualizeTarget('observation')}
          >
            {copy.bulkhead.routeObservation}
          </button>
          <button
            type="button"
            className="interaction-secondary-btn interaction-danger-btn"
            data-selected={equalizeTarget === 'purge' || undefined}
            aria-pressed={equalizeTarget === 'purge'}
            onClick={() => setEqualizeTarget('purge')}
          >
            {copy.bulkhead.purgeTransition}
          </button>
        </div>
      </fieldset>

      <button
        type="button"
        className="interaction-primary-btn bulkhead-execute"
        disabled={!sealTarget || !equalizeTarget}
        data-testid="bulkhead-submit"
        onClick={() => {
          if (!sealTarget || !equalizeTarget) return;
          setEvaluation(evaluateBulkheadDecision({
            sealTarget,
            equalizeTarget,
            elapsedMs: performance.now() - startedAtRef.current,
          }));
        }}
      >
        {copy.bulkhead.execute}
      </button>
    </section>
  );
}
