import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { SpecialInteractionCompletion } from '../types';
import type { SpecialInteractionCopy } from './copy';
import { isSignalAligned } from './logic';
import { markNova06FullFxSeen } from './guidance';
import { useInteractionGuidance } from './useInteractionGuidance';
import { animateValue } from './animateValue';
import { SignalWaveform } from './SignalWaveform';
import { InteractionTitle } from './InteractionTitle';
import { NovaTicker } from './NovaTicker';
import { Nova06OverrideSequence } from './Nova06OverrideSequence';

type SignalSeparationInteractionProps = {
  copy: SpecialInteractionCopy;
  reducedMotion: boolean;
  nova06FxSeen: boolean;
  /** 本周目该互动是否已由 NOVA-06 接管完成过 */
  nova06OverrideUsed: boolean;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

const ROUNDS = [
  { target: 62, tolerance: 14, unit: 'kHz', layer: 0 },
  { target: 34, tolerance: 9, unit: 'deg', layer: 1 },
] as const;

const FINAL_ROUND = {
  gainTarget: 71,
  gainTolerance: 8,
  timelineTarget: 58,
  timelineTolerance: 7,
} as const;

const STANDARD_HOLD_MS = 1200;

const SIGNAL_THRESHOLDS = {
  hint1Ms: 32000,
  hint1Invalid: 3,
  hint2Ms: 30000,
  hint2Invalid: 3,
  overrideMs: 95000,
  overrideInvalid: 8,
  overrideMinValid: 4,
  overrideEmergencies: 0,
};

const testParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
const requestedTestRound = Number(testParams?.get('testInteractionRound') ?? 1);
const DEV_TEST_ROUND = import.meta.env.DEV
  ? Math.max(0, Math.min(2, Number.isFinite(requestedTestRound) ? requestedTestRound - 1 : 0))
  : 0;
const DEV_TEST_ALIGNED = import.meta.env.DEV && testParams?.get('testInteractionAligned') === '1';

function alignmentQuality(value: number, target: number) {
  return Math.max(0, Math.min(100, Math.round(100 - Math.abs(value - target) * 2.4)));
}

type OverrideState = 'none' | 'sequence';

export function SignalSeparationInteraction({
  copy,
  reducedMotion,
  nova06FxSeen,
  nova06OverrideUsed,
  onComplete,
}: SignalSeparationInteractionProps) {
  const [roundIndex, setRoundIndex] = useState(DEV_TEST_ROUND);
  const [carrier, setCarrier] = useState(DEV_TEST_ROUND > 0 ? 62 : 18);
  const [phase, setPhase] = useState(DEV_TEST_ROUND > 1 ? 34 : 82);
  const [gain, setGain] = useState(DEV_TEST_ALIGNED ? FINAL_ROUND.gainTarget : 25);
  const [timeline, setTimeline] = useState(DEV_TEST_ALIGNED ? FINAL_ROUND.timelineTarget : 14);
  const [feedback, setFeedback] = useState('');
  const [holdMs, setHoldMs] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [completedByPlayer, setCompletedByPlayer] = useState(false);
  const [overrideState, setOverrideState] = useState<OverrideState>('none');
  const [scriptLocked, setScriptLocked] = useState(false);
  const transitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const lastSliderRef = useRef<number | null>(null);
  const overrideModeRef = useRef<'full' | 'light'>(nova06FxSeen ? 'light' : 'full');

  const guidance = useInteractionGuidance({
    thresholds: SIGNAL_THRESHOLDS,
    enabled: !completedByPlayer && overrideState === 'none' && !nova06OverrideUsed,
  });

  const values = [carrier, phase, gain];
  const currentRound = ROUNDS[roundIndex] ?? null;
  const currentValue = currentRound ? values[roundIndex] : gain;
  const currentTolerance = currentRound ? currentRound.tolerance : 0;
  const currentAligned = currentRound
    ? isSignalAligned(currentValue, currentRound.target, currentTolerance)
    : false;
  const currentQuality = currentRound
    ? alignmentQuality(currentValue, currentRound.target)
    : 0;

  const gainAligned = isSignalAligned(gain, FINAL_ROUND.gainTarget, FINAL_ROUND.gainTolerance);
  const timelineAligned = isSignalAligned(timeline, FINAL_ROUND.timelineTarget, FINAL_ROUND.timelineTolerance);
  const finalAligned = gainAligned && timelineAligned;
  const gainQuality = alignmentQuality(gain, FINAL_ROUND.gainTarget);
  const timelineQuality = alignmentQuality(timeline, FINAL_ROUND.timelineTarget);
  const finalQuality = Math.round((gainQuality + timelineQuality) / 2);

  const activeQuality = roundIndex === 2 ? finalQuality : currentQuality;
  const activeAligned = roundIndex === 2 ? finalAligned : currentAligned;
  const qualityState = useMemo(() => {
    if (activeAligned) return 'ready';
    if (activeQuality >= 62) return 'near';
    return 'searching';
  }, [activeAligned, activeQuality]);
  const qualityText = copy.signal.statuses[qualityState];

  useEffect(() => {
    if (guidance.stage === 3 && overrideState === 'none' && !nova06OverrideUsed) {
      if (overrideModeRef.current === 'full') markNova06FullFxSeen();
      setScriptLocked(true);
      setOverrideState('sequence');
    }
  }, [guidance.stage, nova06OverrideUsed, overrideState]);

  useEffect(() => {
    if (roundIndex !== 2 || completedByPlayer || !finalAligned || overrideState !== 'none') return;

    const startedAt = Date.now();
    const resetTimer = window.setTimeout(() => setHoldMs(0), 0);
    const timer = window.setInterval(() => {
      setHoldMs(Math.min(STANDARD_HOLD_MS, Date.now() - startedAt));
    }, reducedMotion ? 50 : 80);
    const completionTimer = window.setTimeout(() => {
      setHoldMs(STANDARD_HOLD_MS);
      setCompletedByPlayer(true);
      guidance.noteProgress();
    }, STANDARD_HOLD_MS);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(timer);
      window.clearTimeout(completionTimer);
    };
  }, [completedByPlayer, finalAligned, guidance, overrideState, reducedMotion, roundIndex]);

  useEffect(() => () => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
  }, []);

  function noteSliderAttempt(nextValue: number) {
    if (scriptLocked || overrideState !== 'none') return;
    if (lastSliderRef.current === null || Math.abs(nextValue - lastSliderRef.current) >= 2) {
      guidance.noteValidAttempt();
      lastSliderRef.current = nextValue;
    }
  }

  function updateCurrentValue(nextValue: number) {
    noteSliderAttempt(nextValue);
    if (roundIndex === 0) setCarrier(nextValue);
    if (roundIndex === 1) setPhase(nextValue);
    setFeedback('');
  }

  function finishRound() {
    if (transitioningRef.current || scriptLocked) return;

    if (!currentAligned) {
      guidance.noteInvalidAttempt();
      setFeedback(copy.signal.outsideBand);
      return;
    }

    guidance.noteProgress();
    transitioningRef.current = true;
    setTransitioning(true);
    setFeedback(copy.signal.locked);
    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;
      setRoundIndex(index => index + 1);
      setFeedback('');
      transitioningRef.current = false;
      setTransitioning(false);
      lastSliderRef.current = null;
    }, reducedMotion ? 0 : 420);
  }

  async function runNova06Script() {
    const stepMs = reducedMotion ? 380 : 620;
    await animateValue(carrier, ROUNDS[0].target, stepMs, setCarrier, reducedMotion);
    setRoundIndex(1);
    await animateValue(phase, ROUNDS[1].target, stepMs, setPhase, reducedMotion);
    setRoundIndex(2);
    await animateValue(gain, FINAL_ROUND.gainTarget, stepMs, setGain, reducedMotion);
    await animateValue(timeline, FINAL_ROUND.timelineTarget, stepMs, setTimeline, reducedMotion);
    setHoldMs(STANDARD_HOLD_MS);
  }

  const hintText = guidance.stage >= 2
    ? copy.signal.novaHints.secondByStage[Math.min(roundIndex, 2)]
    : guidance.stage >= 1
      ? copy.signal.novaHints.first
      : null;

  if (completedByPlayer) {
    return (
      <section className="interaction-result" aria-live="polite" data-testid="signal-result">
        <div className="interaction-result-mark" aria-hidden>3 / 3</div>
        <p className="interaction-kicker">{copy.signal.kicker}</p>
        <InteractionTitle state="resolved">{copy.signal.cleanTitle}</InteractionTitle>
        <p>{copy.signal.cleanDetail}</p>
        <div className="signal-result-ledger">
          {copy.signal.layers.map(layer => (
            <span key={layer.name}><b>LOCKED</b>{layer.name}</span>
          ))}
          <span><b>ALIGNED</b>{copy.signal.stageTitles[2]}</span>
        </div>
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete({ kind: 'signal-separation', routeKey: 'clean' })}
        >
          {copy.signal.returnToChannel}
        </button>
      </section>
    );
  }

  const bypassing = overrideState === 'sequence';

  return (
    <section
      className="signal-separator"
      aria-labelledby="signal-interaction-title"
      data-nova06={bypassing || undefined}
    >
      <p className="interaction-kicker">{copy.signal.kicker}</p>
      <InteractionTitle id="signal-interaction-title">{copy.signal.title}</InteractionTitle>
      <p className="interaction-mission">{copy.signal.mission}</p>

      <div className="signal-layer-list">
        {copy.signal.layers.map((layer, index) => {
          const recovered = roundIndex > index || bypassing;
          const active = roundIndex === index && !bypassing;
          const stateText = recovered ? 'LOCKED' : active ? 'ACTIVE' : 'QUEUED';
          const waveformValues = [carrier, phase, gain];
          return (
            <div className="signal-layer-row" key={layer.name} data-state={stateText.toLowerCase()}>
              <div className="signal-layer-meta">
                <div>
                  <strong>{layer.name}</strong>
                  <span>{layer.detail}</span>
                </div>
                <b>{stateText}</b>
              </div>
              <SignalWaveform
                value={waveformValues[index]}
                seed={index + 1}
                active={active}
                recovered={recovered}
                reducedMotion={reducedMotion}
                label={`${layer.name}: ${stateText}`}
              />
            </div>
          );
        })}
      </div>

      <div className="signal-control-deck">
        <div className="interaction-stage-heading">
          <span>{copy.common.phase} {Math.min(roundIndex + 1, 3)} / 3</span>
          <h3>{copy.signal.stageTitles[Math.min(roundIndex, 2)]}</h3>
          <p>{copy.signal.stageOrders[Math.min(roundIndex, 2)]}</p>
        </div>

        <div className="signal-reading-grid" data-state={qualityState}>
          <span>{copy.signal.quality}<b>{activeQuality}%</b></span>
          <span>{copy.signal.status}<b>{qualityText}</b></span>
        </div>
        <div className="signal-quality-meter" data-state={qualityState} aria-hidden>
          <span style={{ '--signal-quality': `${activeQuality}%` } as CSSProperties} />
        </div>

        {currentRound ? (
          <>
            <label className="signal-control-field">
              <span>
                <strong>{copy.signal.stageTitles[roundIndex]}</strong>
                <b>{currentValue} {currentRound.unit}</b>
              </span>
              <input
                data-testid={`signal-slider-${roundIndex}`}
                className="interaction-range signal-range"
                type="range"
                min="0"
                max="100"
                step="1"
                value={currentValue}
                disabled={bypassing}
                onChange={event => updateCurrentValue(Number(event.target.value))}
                aria-label={copy.signal.stageTitles[roundIndex]}
                aria-valuetext={`${currentValue} ${currentRound.unit}`}
              />
            </label>

            <div className="signal-control-actions">
              <button
                type="button"
                className="interaction-primary-btn"
                onClick={finishRound}
                disabled={transitioning || bypassing}
              >
                {copy.signal.lock}
              </button>
            </div>
            <p className="interaction-feedback" aria-live="polite">
              {feedback || '\u00a0'}
            </p>
          </>
        ) : (
          <>
            <div className="signal-final-control-grid">
              <label className="signal-control-field" data-state={gainAligned ? 'ready' : 'searching'}>
                <span>
                  <strong>{copy.signal.telemetryGain}</strong>
                  <b>{gain}%</b>
                </span>
                <input
                  data-testid="signal-slider-gain"
                  className="interaction-range signal-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={gain}
                  disabled={bypassing}
                  onChange={event => {
                    const next = Number(event.target.value);
                    noteSliderAttempt(next);
                    setHoldMs(0);
                    setGain(next);
                  }}
                  aria-label={copy.signal.telemetryGain}
                  aria-valuetext={`${gain}%`}
                />
                <small>{copy.signal.quality}: {gainQuality}%</small>
              </label>
              <label className="signal-control-field" data-state={timelineAligned ? 'ready' : 'searching'}>
                <span>
                  <strong>{copy.signal.timelineOffset}</strong>
                  <b>T+{timeline}</b>
                </span>
                <input
                  data-testid="signal-slider-timeline"
                  className="interaction-range signal-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={timeline}
                  disabled={bypassing}
                  onChange={event => {
                    const next = Number(event.target.value);
                    noteSliderAttempt(next);
                    setHoldMs(0);
                    setTimeline(next);
                  }}
                  aria-label={copy.signal.timelineOffset}
                  aria-valuetext={`T+${timeline}`}
                />
                <small>{copy.signal.quality}: {timelineQuality}%</small>
              </label>
            </div>
            <div className="signal-stability" data-state={finalAligned ? 'holding' : 'idle'}>
              <span>{copy.signal.stabilityHold}</span>
              <div aria-hidden>
                <i style={{ '--signal-hold': `${finalAligned ? Math.min(100, (holdMs / STANDARD_HOLD_MS) * 100) : 0}%` } as CSSProperties} />
              </div>
            </div>
            <p className="interaction-feedback" aria-live="polite">
              {finalAligned ? copy.signal.holding : copy.signal.outsideBand}
            </p>
          </>
        )}
      </div>

      {hintText && !bypassing && (
        <div className="interaction-nova-hint">
          <NovaTicker text={hintText} alert="hint" liveLabel="LIVE" />
        </div>
      )}

      {bypassing && (
        <Nova06OverrideSequence
          mode={overrideModeRef.current}
          reducedMotion={reducedMotion}
          copy={copy.nova06}
          unknownLines={copy.signal.override.unknownLines}
          scriptLines={copy.signal.override.systemLines}
          runScript={runNova06Script}
          onDone={() => onComplete({
            kind: 'signal-separation',
            routeKey: 'clean',
            completedByNova06: true,
          })}
        />
      )}
    </section>
  );
}
