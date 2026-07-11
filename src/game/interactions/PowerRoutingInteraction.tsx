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

type PowerRoutingInteractionProps = {
  copy: SpecialInteractionCopy;
  assistMode: boolean;
  reducedMotion: boolean;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

type PowerPhase = {
  thresholds: PowerThresholds;
  target: PowerAllocation;
};

const PHASE_DURATION_SECONDS = 24;
const HOLD_DURATION_MS = 8000;

const POWER_PHASES: PowerPhase[] = [
  {
    thresholds: { lifeSupport: 25, communications: 20, coreScan: 45 },
    target: { lifeSupport: 30, communications: 22, coreScan: 48 },
  },
  {
    thresholds: { lifeSupport: 50, communications: 25, coreScan: 10 },
    target: { lifeSupport: 55, communications: 28, coreScan: 17 },
  },
  {
    thresholds: { lifeSupport: 20, communications: 30, coreScan: 45 },
    target: { lifeSupport: 22, communications: 31, coreScan: 47 },
  },
];

const CHANNELS: PowerChannel[] = ['lifeSupport', 'communications', 'coreScan'];

export function PowerRoutingInteraction({
  copy,
  assistMode,
  reducedMotion,
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
  const [result, setResult] = useState<PowerRoutingResult | null>(null);
  const [elapsedPhases, setElapsedPhases] = useState<number[]>([]);
  const allocationRef = useRef(allocation);
  const phaseStartedAtRef = useRef(0);
  const heldMsRef = useRef(0);
  const elapsedPhasesRef = useRef<number[]>([]);
  const emergencyAssistRef = useRef(false);
  const transitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const phase = POWER_PHASES[phaseIndex];

  useEffect(() => {
    allocationRef.current = allocation;
  }, [allocation]);

  useEffect(() => {
    phaseStartedAtRef.current = Date.now();
    heldMsRef.current = 0;
  }, [phaseIndex]);

  useEffect(() => {
    if (assistMode) emergencyAssistRef.current = true;
  }, [assistMode]);

  useEffect(() => () => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
  }, []);

  const advancePhase = useCallback((forcedAssist: boolean) => {
    if (transitioningRef.current || result) return;
    transitioningRef.current = true;
    setTransitioning(true);

    if (forcedAssist) {
      emergencyAssistRef.current = true;
      allocationRef.current = phase.target;
      setAllocation(phase.target);
    }

    const elapsed = Math.min(
      PHASE_DURATION_SECONDS,
      Math.max(0.1, (Date.now() - phaseStartedAtRef.current) / 1000),
    );
    const elapsedPhases = [...elapsedPhasesRef.current, elapsed];
    elapsedPhasesRef.current = elapsedPhases;
    setElapsedPhases(elapsedPhases);

    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;
      if (phaseIndex === POWER_PHASES.length - 1) {
        setResult(classifyPowerRoutingResult(emergencyAssistRef.current, elapsedPhases));
      } else {
        heldMsRef.current = 0;
        setHeldMs(0);
        setSecondsLeft(PHASE_DURATION_SECONDS);
        setPhaseIndex(index => index + 1);
      }
      transitioningRef.current = false;
      setTransitioning(false);
    }, reducedMotion ? 0 : 650);
  }, [phase.target, phaseIndex, reducedMotion, result]);

  useEffect(() => {
    if (result || transitioning) return undefined;

    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - phaseStartedAtRef.current;
      const relaxedThresholds = Object.fromEntries(
        CHANNELS.map(channel => [
          channel,
          Math.max(0, (phase.thresholds[channel] ?? 0) - (assistMode ? 5 : 0)),
        ]),
      ) as PowerThresholds;
      const stable = isPowerAllocationStable(allocationRef.current, relaxedThresholds);
      const holdTarget = assistMode ? 4500 : HOLD_DURATION_MS;

      heldMsRef.current = stable
        ? Math.min(holdTarget, heldMsRef.current + 500)
        : Math.max(0, heldMsRef.current - 500);
      setHeldMs(heldMsRef.current);
      setSecondsLeft(Math.max(0, Math.ceil(PHASE_DURATION_SECONDS - elapsedMs / 1000)));

      if (heldMsRef.current >= holdTarget) {
        advancePhase(false);
      } else if (elapsedMs >= PHASE_DURATION_SECONDS * 1000) {
        advancePhase(true);
      }
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [advancePhase, assistMode, phase.thresholds, result, transitioning]);

  function updateChannel(channel: PowerChannel, value: number) {
    if (transitioning) return;
    setAllocation(current => rebalancePowerAllocation(current, channel, value));
  }

  function requestEmergencyBalance() {
    emergencyAssistRef.current = true;
    allocationRef.current = phase.target;
    setAllocation(phase.target);
  }

  if (result) {
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
        <h2>{title}</h2>
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

  const holdTarget = assistMode ? 4500 : HOLD_DURATION_MS;
  const holdPercent = Math.min(100, heldMs / holdTarget * 100);
  const total = CHANNELS.reduce((sum, channel) => sum + allocation[channel], 0);
  const effectiveThresholds = Object.fromEntries(
    CHANNELS.map(channel => [
      channel,
      Math.max(0, (phase.thresholds[channel] ?? 0) - (assistMode ? 5 : 0)),
    ]),
  ) as PowerThresholds;
  const lowChannel = CHANNELS.find(channel => allocation[channel] < (effectiveThresholds[channel] ?? 0));
  const liveMessage = lowChannel === 'lifeSupport'
    ? copy.power.liveMessages.lowLifeSupport
    : lowChannel === 'communications'
      ? copy.power.liveMessages.lowCommunications
      : lowChannel === 'coreScan'
        ? copy.power.liveMessages.lowCoreScan
        : copy.power.liveMessages.stable[phaseIndex];

  return (
    <section className="power-router" aria-labelledby="power-interaction-title" data-alert={lowChannel ?? 'stable'}>
      <p className="interaction-kicker">{copy.power.kicker}</p>
      <h2 id="power-interaction-title">{copy.power.title}</h2>
      <p className="interaction-mission">{copy.power.mission}</p>

      <div className="power-phase-strip" aria-label={`${copy.common.phase} ${phaseIndex + 1}`}>
        {POWER_PHASES.map((_, index) => (
          <span key={index} data-state={index < phaseIndex ? 'complete' : index === phaseIndex ? 'active' : 'pending'}>
            {index < phaseIndex ? 'DONE' : `${index + 1}`}
          </span>
        ))}
      </div>

      <div className="power-nova-feedback" data-alert={lowChannel ?? 'stable'} aria-live="polite">
        <span>NOVA / LIVE</span>
        <p>{liveMessage}</p>
      </div>

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
          const threshold = effectiveThresholds[channel] ?? 0;
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
                disabled={transitioning}
                onChange={event => updateChannel(channel, Number(event.target.value))}
                aria-valuetext={`${allocation[channel]}%, minimum ${threshold}%`}
              />
            </label>
          );
        })}
      </div>

      <button
        type="button"
        className="interaction-secondary-btn power-assist-btn"
        onClick={requestEmergencyBalance}
        disabled={transitioning}
      >
        {copy.power.assistAction}
      </button>
      <p className="power-safety-note">PROXY LIMIT / 100% · NO PROTOCOL CONTROL · NO CORE CONTROL</p>
    </section>
  );
}
