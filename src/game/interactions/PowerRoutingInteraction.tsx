import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  PowerFailureReason,
  SpecialInteractionCompletion,
} from '../types';
import type { SpecialInteractionCopy } from './copy';
import {
  findPowerFailureReason,
  isPowerAllocationStable,
  POWER_CHANNELS,
  POWER_STAGE_THRESHOLDS,
  rebalancePowerAllocation,
  type PowerAllocation,
  type PowerChannel,
  type PowerStage,
} from './logic';
import { InteractionTitle } from './InteractionTitle';
import { remainingUntil } from '../timedRuntime';

type PowerRoutingInteractionProps = {
  copy: SpecialInteractionCopy;
  attempt: 1 | 2;
  damaged?: boolean;
  lowGravity?: boolean;
  previousFailure?: PowerFailureReason;
  deadlineAt: number;
  onRestartDeadline: () => void;
  onResultLocked: (result: SpecialInteractionCompletion) => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

type PowerRoutingCompletion = Extract<SpecialInteractionCompletion, { kind: 'power-routing' }>;

const INITIAL_ALLOCATION: PowerAllocation = {
  lifeSupport: 34,
  communications: 33,
  coreScan: 33,
};

function createInitialStages(): Record<PowerStage, PowerAllocation> {
  return {
    transit: { ...INITIAL_ALLOCATION },
    core_read: { ...INITIAL_ALLOCATION },
  };
}

export function PowerRoutingInteraction({
  copy,
  attempt,
  damaged = false,
  lowGravity = false,
  previousFailure,
  deadlineAt,
  onRestartDeadline,
  onResultLocked,
  onComplete,
}: PowerRoutingInteractionProps) {
  const [stages, setStages] = useState(createInitialStages);
  const stagesRef = useRef(stages);
  const finishedRef = useRef(false);
  const expiredDeadlineRef = useRef<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(() => remainingUntil(deadlineAt));
  const [result, setResult] = useState<PowerRoutingCompletion | null>(null);
  const [validationReason, setValidationReason] = useState<PowerFailureReason | null>(null);

  useEffect(() => {
    stagesRef.current = stages;
  }, [stages]);

  const lockResult = useCallback((failureReason?: PowerFailureReason) => {
    if (finishedRef.current) return;
    if (attempt === 1 && failureReason && failureReason !== 'life_support_below_minimum') {
      setValidationReason(failureReason);
      return;
    }
    finishedRef.current = true;
    const completion: PowerRoutingCompletion = failureReason
      ? {
          kind: 'power-routing',
          routeKey: attempt === 1 ? 'fail' : 'fatal',
          attempt,
          failureReason,
        }
      : { kind: 'power-routing', routeKey: 'success', attempt };
    onResultLocked(completion);
    setResult(completion);
  }, [attempt, onResultLocked]);

  useEffect(() => {
    if (result) return;
    const tick = () => {
      const nextRemaining = remainingUntil(deadlineAt);
      setRemainingMs(nextRemaining);
      if (nextRemaining !== 0) return;
      if (attempt === 1) {
        if (expiredDeadlineRef.current === deadlineAt) return;
        expiredDeadlineRef.current = deadlineAt;
        setValidationReason('timeout');
        onRestartDeadline();
        return;
      }
      lockResult('timeout');
    };
    tick();
    const timer = window.setInterval(tick, 150);
    return () => window.clearInterval(timer);
  }, [attempt, deadlineAt, lockResult, onRestartDeadline, result]);

  if (result) {
    const succeeded = result.routeKey === 'success';
    const title = succeeded
      ? attempt === 1 ? copy.power.firstSuccessTitle : copy.power.retrySuccessTitle
      : attempt === 1 ? copy.power.failureTitle : copy.power.fatalTitle;
    const detail = succeeded
      ? copy.power.successDetail
      : attempt === 1 ? copy.power.failureDetail : copy.power.fatalDetail;

    return (
      <section
        className="interaction-result power-routing-result"
        aria-live="assertive"
        data-testid={`power-result-${result.routeKey}`}
      >
        <div className="interaction-result-mark" aria-hidden>
          {succeeded ? '100%' : 'FAULT'}
        </div>
        <p className="interaction-kicker">POWER ROUTE / ATTEMPT 0{attempt}</p>
        <InteractionTitle state={succeeded ? 'resolved' : 'warning'}>{title}</InteractionTitle>
        <p>{detail}</p>
        {result.failureReason && (
          <div className="power-failure-readout" role="status">
            <span>FAULT ORIGIN</span>
            <strong>{copy.power.failureReasons[result.failureReason]}</strong>
          </div>
        )}
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete(result)}
        >
          {succeeded ? copy.common.continue : copy.power.acknowledgeFailure}
        </button>
      </section>
    );
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  function updateAllocation(stage: PowerStage, channel: PowerChannel, value: number) {
    setValidationReason(null);
    setStages(current => ({
      ...current,
      [stage]: rebalancePowerAllocation(current[stage], channel, value),
    }));
  }

  return (
    <section className="power-routing" aria-labelledby="power-routing-title" data-low-gravity={lowGravity || undefined}>
      {lowGravity && (
        <div className="power-low-gravity-field" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
      )}
      <p className="interaction-kicker">{copy.power.kicker}</p>
      <InteractionTitle id="power-routing-title">{copy.power.title}</InteractionTitle>
      <p className="interaction-mission">{copy.power.mission}</p>

      {lowGravity && (
        <div className="power-gravity-readout" role="status">
          <span>MAINTENANCE DECK / GRAVITY ARRAY</span>
          <strong>0.18g</strong>
          <small>MAG-BOOT ANCHOR / ACTIVE</small>
        </div>
      )}

      <div className="power-attempt-strip" data-final={attempt === 2 || undefined}>
        <span>{attempt === 1 ? copy.power.firstAttempt : copy.power.finalAttempt}</span>
        <strong>{copy.power.remaining} / {remainingSeconds.toString().padStart(2, '0')} s</strong>
      </div>

      {validationReason && attempt === 1 && (
        <div className="power-failure-readout" role="status" data-validation="preflight">
          <span>{copy.power.preflightRejected}</span>
          <strong>{copy.power.failureReasons[validationReason]}</strong>
          <small>{copy.power.adjustAndResubmit}</small>
        </div>
      )}

      {attempt === 2 && (
        <div className="power-previous-failure" role="note">
          <span>{damaged ? 'REBOOT 07-DAMAGED' : copy.power.previousFailure}</span>
          <strong>{previousFailure ? copy.power.failureReasons[previousFailure] : 'ROUTE FAULT / UNKNOWN'}</strong>
          <small>{damaged
            ? 'NOVA-06 ROLLBACK AUTHORIZATION / UNAVAILABLE'
            : copy.power.rollbackConsumed}</small>
        </div>
      )}

      <div className="power-stage-list">
        {(['transit', 'core_read'] as const).map(stage => {
          const allocation = stages[stage];
          const thresholds = POWER_STAGE_THRESHOLDS[stage];
          const stable = isPowerAllocationStable(allocation, thresholds);
          return (
            <article className="power-stage-card" key={stage} data-stable={stable || undefined}>
              <header>
                <div>
                  <span>{copy.power.stages[stage].title}</span>
                  <p>{copy.power.stages[stage].order}</p>
                </div>
                <strong>{copy.power.total} / 100%</strong>
              </header>
              <div className="power-channel-list">
                {POWER_CHANNELS.map(channel => {
                  const safe = allocation[channel] >= thresholds[channel];
                  return (
                    <label className="power-channel-control" key={channel}>
                      <span>
                        <b>{copy.power.channels[channel]}</b>
                        <small>{copy.power.minimum} {thresholds[channel]}%</small>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={allocation[channel]}
                        data-testid={`power-${stage}-${channel}`}
                        onChange={event => updateAllocation(stage, channel, Number(event.target.value))}
                      />
                      <output data-safe={safe || undefined}>
                        {allocation[channel]}%
                        <small>{safe ? copy.power.stable : copy.power.below}</small>
                      </output>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="interaction-primary-btn power-submit"
        data-testid="power-submit"
        onClick={() => lockResult(findPowerFailureReason(stagesRef.current))}
      >
        {copy.power.submit}
      </button>
    </section>
  );
}
