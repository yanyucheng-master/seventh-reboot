import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PowerRoutingResult, SpecialInteractionCompletion } from '../types';
import type { SpecialInteractionCopy } from './copy';
import {
  classifyPowerRoutingResult,
  isPowerAllocationStable,
  rebalancePowerAllocation,
  type PowerAllocation,
  type PowerChannel,
  type PowerThresholds,
} from './logic';
import { markNova06FullFxSeen } from './guidance';
import { useInteractionGuidance } from './useInteractionGuidance';
import { animateValue } from './animateValue';
import { NovaTicker } from './NovaTicker';
import { InteractionTitle } from './InteractionTitle';
import { Nova06OverrideSequence } from './Nova06OverrideSequence';

type PowerRoutingInteractionProps = {
  copy: SpecialInteractionCopy;
  reducedMotion: boolean;
  nova06FxSeen: boolean;
  nova06OverrideUsed: boolean;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

type PowerPhase = {
  thresholds: PowerThresholds;
};

const PHASE_DURATION_SECONDS = 24;
const HOLD_DURATION_MS = 8000;

const POWER_PHASES: PowerPhase[] = [
  { thresholds: { lifeSupport: 25, communications: 20, coreScan: 45 } },
  { thresholds: { lifeSupport: 50, communications: 25, coreScan: 10 } },
  { thresholds: { lifeSupport: 20, communications: 30, coreScan: 45 } },
];

const NOVA06_PRESETS: PowerAllocation[] = [
  { lifeSupport: 25, communications: 20, coreScan: 55 },
  { lifeSupport: 55, communications: 25, coreScan: 20 },
  { lifeSupport: 25, communications: 35, coreScan: 40 },
];

const CHANNELS: PowerChannel[] = ['lifeSupport', 'communications', 'coreScan'];

const POWER_THRESHOLDS = {
  hint1Ms: 28000,
  hint1Invalid: 3,
  hint2Ms: 30000,
  hint2Invalid: 3,
  overrideMs: 100000,
  overrideInvalid: 7,
  overrideMinValid: 5,
  overrideEmergencies: 3,
};

type OverrideState = 'none' | 'sequence';

function findLowChannel(allocation: PowerAllocation, thresholds: PowerThresholds): PowerChannel | null {
  return CHANNELS.find(channel => allocation[channel] < (thresholds[channel] ?? 0)) ?? null;
}

function buildNovaHint(
  stage: number,
  phaseIndex: number,
  allocation: PowerAllocation,
  thresholds: PowerThresholds,
  copy: SpecialInteractionCopy,
): string | null {
  if (stage < 1) return null;
  const low = findLowChannel(allocation, thresholds);
  if (stage >= 2) {
    if (low) return copy.power.urgentMessages[low];
    if (allocation.communications > 45 && allocation.coreScan < thresholds.coreScan!) {
      return copy.power.steadyHint;
    }
    return copy.power.phases[phaseIndex]?.order ?? copy.power.steadyHint;
  }
  if (low === 'lifeSupport') return copy.power.urgentMessages.lifeSupport;
  if (low === 'coreScan') return copy.power.urgentMessages.coreScan;
  if (low === 'communications') return copy.power.urgentMessages.communications;
  return copy.power.liveMessages.stable[phaseIndex] ?? copy.power.steadyHint;
}

export function PowerRoutingInteraction({
  copy,
  reducedMotion,
  nova06FxSeen,
  nova06OverrideUsed,
  onComplete,
}: PowerRoutingInteractionProps) {
  const [allocation, setAllocation] = useState<PowerAllocation>({
    lifeSupport: 34,
    communications: 33,
    coreScan: 33,
  });
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASE_DURATION_SECONDS);
  const [heldMs, setHeldMs] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [windowFeedback, setWindowFeedback] = useState('');
  const [result, setResult] = useState<PowerRoutingResult | null>(null);
  const [elapsedPhases, setElapsedPhases] = useState<number[]>([]);
  const [overrideState, setOverrideState] = useState<OverrideState>('none');
  const [scriptLocked, setScriptLocked] = useState(false);
  const allocationRef = useRef(allocation);
  const phaseStartedAtRef = useRef(0);
  const heldMsRef = useRef(0);
  const elapsedPhasesRef = useRef<number[]>([]);
  const transitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const emergencyActiveRef = useRef(false);
  const lastAllocationRef = useRef(allocation);
  const overrideModeRef = useRef<'full' | 'light'>(nova06FxSeen ? 'light' : 'full');

  const guidance = useInteractionGuidance({
    thresholds: POWER_THRESHOLDS,
    enabled: !result && overrideState === 'none' && !nova06OverrideUsed,
  });

  const phase = POWER_PHASES[phaseIndex];

  useEffect(() => {
    allocationRef.current = allocation;
  }, [allocation]);

  useEffect(() => {
    phaseStartedAtRef.current = Date.now();
    heldMsRef.current = 0;
  }, [phaseIndex]);

  useEffect(() => () => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (guidance.stage === 3 && overrideState === 'none' && !nova06OverrideUsed && !result) {
      if (overrideModeRef.current === 'full') markNova06FullFxSeen();
      setScriptLocked(true);
      setOverrideState('sequence');
    }
  }, [guidance.stage, nova06OverrideUsed, overrideState, result]);

  const advancePhase = useCallback((fromOverride = false) => {
    if (transitioningRef.current || result) return;
    transitioningRef.current = true;
    setTransitioning(true);

    const elapsed = Math.min(
      PHASE_DURATION_SECONDS,
      Math.max(0.1, (Date.now() - phaseStartedAtRef.current) / 1000),
    );
    const nextElapsed = [...elapsedPhasesRef.current, elapsed];
    elapsedPhasesRef.current = nextElapsed;
    setElapsedPhases(nextElapsed);

    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;
      if (phaseIndex === POWER_PHASES.length - 1) {
        setResult(classifyPowerRoutingResult(fromOverride, nextElapsed));
      } else {
        heldMsRef.current = 0;
        setHeldMs(0);
        setSecondsLeft(PHASE_DURATION_SECONDS);
        setWindowFeedback('');
        setPhaseIndex(index => index + 1);
        guidance.noteProgress();
      }
      transitioningRef.current = false;
      setTransitioning(false);
    }, reducedMotion ? 0 : 650);
  }, [guidance, phaseIndex, reducedMotion, result]);

  useEffect(() => {
    if (result || transitioning || overrideState !== 'none') return undefined;

    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - phaseStartedAtRef.current;
      const stable = isPowerAllocationStable(allocationRef.current, phase.thresholds);

      const low = findLowChannel(allocationRef.current, phase.thresholds);
      if (low && !emergencyActiveRef.current) {
        emergencyActiveRef.current = true;
        guidance.noteEmergency();
      } else if (!low) {
        emergencyActiveRef.current = false;
      }

      heldMsRef.current = stable
        ? Math.min(HOLD_DURATION_MS, heldMsRef.current + 500)
        : Math.max(0, heldMsRef.current - 500);
      setHeldMs(heldMsRef.current);
      setSecondsLeft(Math.max(0, Math.ceil(PHASE_DURATION_SECONDS - elapsedMs / 1000)));

      if (heldMsRef.current >= HOLD_DURATION_MS) {
        advancePhase(false);
      } else if (elapsedMs >= PHASE_DURATION_SECONDS * 1000) {
        guidance.noteInvalidAttempt();
        phaseStartedAtRef.current = Date.now();
        heldMsRef.current = 0;
        setHeldMs(0);
        setSecondsLeft(PHASE_DURATION_SECONDS);
        setWindowFeedback(copy.power.windowExpired);
      }
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [
    advancePhase,
    copy.power.windowExpired,
    guidance,
    overrideState,
    overrideState,
    phase.thresholds,
    result,
    transitioning,
  ]);

  function updateChannel(channel: PowerChannel, value: number) {
    if (transitioning || scriptLocked) return;
    const previous = lastAllocationRef.current;
    setWindowFeedback('');
    setAllocation(current => {
      const next = rebalancePowerAllocation(current, channel, value);
      const changed = CHANNELS.some(key => Math.abs(next[key] - previous[key]) >= 2);
      if (changed) {
        guidance.noteValidAttempt();
        lastAllocationRef.current = next;
      }
      return next;
    });
  }

  async function animateAllocation(target: PowerAllocation) {
    const duration = reducedMotion ? 380 : 720;
    for (const channel of CHANNELS) {
      await animateValue(
        allocationRef.current[channel],
        target[channel],
        duration,
        value => {
          setAllocation(current => ({ ...current, [channel]: value }));
        },
        reducedMotion,
      );
    }
    allocationRef.current = target;
    lastAllocationRef.current = target;
  }

  async function runNova06Script() {
    for (let index = phaseIndex; index < POWER_PHASES.length; index += 1) {
      if (index !== phaseIndex) {
        setPhaseIndex(index);
        phaseStartedAtRef.current = Date.now();
        heldMsRef.current = 0;
        setHeldMs(0);
        setSecondsLeft(PHASE_DURATION_SECONDS);
        await new Promise(resolve => window.setTimeout(resolve, reducedMotion ? 120 : 280));
      }
      await animateAllocation(NOVA06_PRESETS[index]!);
      heldMsRef.current = HOLD_DURATION_MS;
      setHeldMs(HOLD_DURATION_MS);
      await new Promise(resolve => window.setTimeout(resolve, reducedMotion ? 260 : 520));
      if (index < POWER_PHASES.length - 1) {
        const elapsed = Math.min(PHASE_DURATION_SECONDS, 6);
        elapsedPhasesRef.current = [...elapsedPhasesRef.current, elapsed];
        setElapsedPhases([...elapsedPhasesRef.current]);
        setPhaseIndex(index + 1);
        phaseStartedAtRef.current = Date.now();
      }
    }
    elapsedPhasesRef.current = [...elapsedPhasesRef.current.slice(0, 2), 6];
    setElapsedPhases([...elapsedPhasesRef.current]);
  }

  if (result && overrideState === 'none') {
    const title = result === 'excellent'
      ? copy.power.excellentTitle
      : result === 'stable'
        ? copy.power.stableTitle
        : copy.power.emergencyTitle;
    const detail = result === 'excellent'
      ? copy.power.excellentDetail
      : result === 'stable'
        ? copy.power.stableDetail
        : copy.power.emergencyDetail;

    return (
      <section className="interaction-result" aria-live="polite" data-testid="power-result">
        <div className="interaction-result-mark" aria-hidden>100%</div>
        <p className="interaction-kicker">{copy.power.kicker}</p>
        <InteractionTitle state="resolved">{title}</InteractionTitle>
        <p>{detail}</p>
        <div className="power-result-ledger">
          {elapsedPhases.map((seconds, index) => (
            <span key={copy.power.phases[index].title}>
              <b>{copy.common.phase} {index + 1}</b>
              {copy.power.phases[index].title} · {seconds.toFixed(1)}s
            </span>
          ))}
        </div>
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete({ kind: 'power-routing', routeKey: result })}
        >
          {copy.power.reconnect}
        </button>
      </section>
    );
  }

  const holdPercent = Math.min(100, heldMs / HOLD_DURATION_MS * 100);
  const total = CHANNELS.reduce((sum, channel) => sum + allocation[channel], 0);
  const lowChannel = findLowChannel(allocation, phase.thresholds);
  const liveMessage = lowChannel === 'lifeSupport'
    ? copy.power.liveMessages.lowLifeSupport
    : lowChannel === 'communications'
      ? copy.power.liveMessages.lowCommunications
      : lowChannel === 'coreScan'
        ? copy.power.liveMessages.lowCoreScan
        : copy.power.liveMessages.stable[phaseIndex];
  const hintText = buildNovaHint(guidance.stage, phaseIndex, allocation, phase.thresholds, copy);
  const bypassing = overrideState === 'sequence';

  return (
    <section
      className="power-router"
      aria-labelledby="power-interaction-title"
      data-alert={lowChannel ?? 'stable'}
      data-nova06={bypassing || undefined}
    >
      <p className="interaction-kicker">{copy.power.kicker}</p>
      <InteractionTitle id="power-interaction-title">{copy.power.title}</InteractionTitle>
      <p className="interaction-mission">{copy.power.mission}</p>

      <div className="power-phase-strip" aria-label={`${copy.common.phase} ${phaseIndex + 1}`}>
        {POWER_PHASES.map((_, index) => (
          <span key={index} data-state={index < phaseIndex ? 'complete' : index === phaseIndex ? 'active' : 'pending'}>
            {index < phaseIndex ? 'DONE' : `${index + 1}`}
          </span>
        ))}
      </div>

      <NovaTicker
        text={liveMessage}
        alert={(lowChannel ?? 'stable') as 'stable' | 'lifeSupport' | 'communications' | 'coreScan'}
      />

      <div className="power-objective">
        <div>
          <span>{copy.common.phase} {phaseIndex + 1} / {POWER_PHASES.length}</span>
          <h3>{copy.power.phases[phaseIndex].title}</h3>
          <p>{copy.power.phases[phaseIndex].order}</p>
        </div>
        <div className="power-countdown" aria-live="polite">
          <b>{secondsLeft}s</b>
          <span>{copy.power.remaining}</span>
        </div>
      </div>

      <div className="power-allocation-summary">
        <span>{copy.power.total}<b>{total}%</b></span>
        <span>{copy.power.sustained}<b>{Math.round(holdPercent)}%</b></span>
      </div>

      <div
        className="power-hold-meter"
        style={{ '--hold-progress': `${holdPercent}%` } as CSSProperties}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(holdPercent)}
        aria-label={copy.power.sustained}
      >
        <span />
      </div>

      <div className="power-channel-list">
        {CHANNELS.map(channel => {
          const threshold = phase.thresholds[channel] ?? 0;
          const stable = allocation[channel] >= threshold;
          return (
            <label className="power-channel" key={channel} data-state={stable ? 'stable' : 'low'}>
              <span>
                <strong>{copy.power.channels[channel]}</strong>
                <b>{allocation[channel]}%</b>
              </span>
              <small>MIN {threshold}% · {stable ? 'STABLE' : 'BELOW WINDOW'}</small>
              <input
                data-testid={`power-slider-${channel}`}
                className="interaction-range"
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocation[channel]}
                disabled={transitioning || bypassing}
                onChange={event => updateChannel(channel, Number(event.target.value))}
                aria-valuetext={`${allocation[channel]}%, minimum ${threshold}%`}
              />
            </label>
          );
        })}
      </div>

      {windowFeedback && (
        <p className="interaction-feedback power-window-feedback" role="status">
          {windowFeedback}
        </p>
      )}

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
          detectLines={copy.power.override.systemDetect}
          unknownLines={copy.power.override.unknownLines}
          scriptLines={[copy.power.override.systemLoaded]}
          noteLines={copy.power.override.routingNote}
          runScript={runNova06Script}
          onDone={() => onComplete({
            kind: 'power-routing',
            routeKey: 'stable',
            completedByNova06: true,
          })}
        />
      )}

      <p className="power-safety-note">PROXY LIMIT / 100% · NO PROTOCOL CONTROL · NO CORE CONTROL</p>
    </section>
  );
}
