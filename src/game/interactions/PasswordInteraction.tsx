import { useCallback, useEffect, useRef, useState } from 'react';
import type { NovaHintStage, SpecialInteractionCompletion } from '../types';
import type { SpecialInteractionCopy } from './copy';
import { isCriticalLogPassword, normalizeAuthorizationKey } from './logic';
import { markNova06FullFxSeen } from './guidance';
import { useInteractionGuidance } from './useInteractionGuidance';
import { InteractionTitle } from './InteractionTitle';
import { NovaTicker } from './NovaTicker';
import { Nova06OverrideSequence } from './Nova06OverrideSequence';
import { waitForAbortableDelay } from './animateValue';

type PasswordInteractionProps = {
  copy: SpecialInteractionCopy;
  reducedMotion: boolean;
  nova06FxSeen: boolean;
  /** 本周目该互动是否已由 NOVA-06 接管完成过 */
  nova06OverrideUsed: boolean;
  initialGuidanceStage: NovaHintStage;
  onGuidanceStageChange: (stage: NovaHintStage) => void;
  onOverrideStarted: () => void;
  onOverrideScriptApplied: () => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

/**
 * 密码接管故意设得更难触发：至少 6 次真实提交 + 两次 Nova 提示 +
 * 长时间未通过。NOVA-06 不往输入框填 0701，而是直接绕过验证程序。
 */
const PASSWORD_THRESHOLDS = {
  hint1Ms: 32000,
  hint1Invalid: 2,
  hint2Ms: 30000,
  hint2Invalid: 2,
  overrideMs: 100000,
  overrideInvalid: 7,
  overrideMinValid: 6,
  overrideEmergencies: 0,
  overrideRequiresTime: true,
};

type OverrideState = 'none' | 'sequence';

export function PasswordInteraction({
  copy,
  reducedMotion,
  nova06FxSeen,
  nova06OverrideUsed,
  initialGuidanceStage,
  onGuidanceStageChange,
  onOverrideStarted,
  onOverrideScriptApplied,
  onComplete,
}: PasswordInteractionProps) {
  const [value, setValue] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [accepted, setAccepted] = useState(nova06OverrideUsed);
  const [overrideState, setOverrideState] = useState<OverrideState>(
    initialGuidanceStage === 3 && !nova06OverrideUsed ? 'sequence' : 'none',
  );
  const [overrideMode] = useState<'full' | 'light'>(() => nova06FxSeen ? 'light' : 'full');
  const [resumedByNova06] = useState(nova06OverrideUsed);
  const inputRef = useRef<HTMLInputElement>(null);
  const attemptedKeysRef = useRef(new Set<string>());
  const scriptAbortRef = useRef<AbortController | null>(null);

  const handleGuidanceStageChange = useCallback((stage: NovaHintStage) => {
    onGuidanceStageChange(stage);
    if (stage === 3 && !accepted && overrideState === 'none' && !nova06OverrideUsed) {
      if (overrideMode === 'full') markNova06FullFxSeen();
      onOverrideStarted();
      setOverrideState('sequence');
    }
  }, [accepted, nova06OverrideUsed, onGuidanceStageChange, onOverrideStarted, overrideMode, overrideState]);

  const guidance = useInteractionGuidance({
    thresholds: PASSWORD_THRESHOLDS,
    enabled: !accepted && overrideState === 'none' && !nova06OverrideUsed,
    initialStage: initialGuidanceStage,
    onStageChange: handleGuidanceStageChange,
  });

  useEffect(() => {
    inputRef.current?.focus();
    return () => scriptAbortRef.current?.abort();
  }, []);

  function verify() {
    if (overrideState !== 'none') return;
    if (isCriticalLogPassword(value)) {
      setAccepted(true);
      return;
    }
    const normalized = normalizeAuthorizationKey(value);
    if (normalized.length > 0 && !attemptedKeysRef.current.has(normalized)) {
      attemptedKeysRef.current.add(normalized);
      guidance.noteValidAttempt();
      guidance.noteInvalidAttempt();
    }
    setAttempts(current => current + 1);
    setValue('');
    inputRef.current?.focus();
  }

  if (accepted) {
    return (
      <section className="interaction-result" aria-live="polite" data-testid="password-success">
        <div className="interaction-result-mark" aria-hidden>07 / 01</div>
        <p className="interaction-kicker">{resumedByNova06 ? copy.nova06.signatureTag : copy.password.accepted}</p>
        <InteractionTitle state="resolved">
          {resumedByNova06 ? copy.password.override.resultTitle : copy.password.title}
        </InteractionTitle>
        <div className="authorization-output">
          <strong>{resumedByNova06 ? 'AUTHORIZATION CHECK BYPASSED' : 'AUTHORIZATION KEY ACCEPTED'}</strong>
          <strong>NOVA-06 SEALED RECORD UNLOCKED</strong>
        </div>
        <p>{resumedByNova06 ? copy.password.override.resultDetail : copy.password.successDetail}</p>
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete({
            kind: 'critical-log-password',
            routeKey: 'success',
            completedByNova06: resumedByNova06 || undefined,
          })}
        >
          {copy.common.continue}
        </button>
      </section>
    );
  }

  const bypassing = overrideState === 'sequence';
  const hintText = guidance.stage >= 2
    ? copy.password.novaHints.second
    : guidance.stage >= 1
      ? copy.password.novaHints.first
      : null;

  return (
    <section
      className="password-console"
      aria-labelledby="password-interaction-title"
      data-nova06={bypassing || undefined}
    >
      <p className="interaction-kicker">{copy.password.kicker}</p>
      <InteractionTitle id="password-interaction-title">{copy.password.title}</InteractionTitle>
      <p className="interaction-mission">{copy.password.mission}</p>

      <div className="password-index-strip" aria-hidden>
        <span>AUTH / 07</span>
        <span>NOVA-CURRENT + NOVA-06</span>
        <span>SEALED / READ ONLY</span>
      </div>

      <form
        className="password-form"
        onSubmit={event => {
          event.preventDefault();
          verify();
        }}
      >
        <label htmlFor="critical-log-password">{copy.password.fieldLabel}</label>
        <div className="password-entry-row">
          <input
            ref={inputRef}
            id="critical-log-password"
            data-testid="critical-log-password"
            value={value}
            onChange={event => setValue(event.target.value.slice(0, 12))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={copy.password.placeholder}
            disabled={bypassing}
            aria-describedby={attempts > 0 ? 'password-rejection' : undefined}
          />
          <button type="submit" className="interaction-primary-btn" disabled={bypassing}>
            {copy.password.submit}
          </button>
        </div>
      </form>

      {attempts > 0 && !bypassing ? (
        <p id="password-rejection" className="interaction-feedback password-rejection" role="alert">
          {copy.password.rejected}
        </p>
      ) : (
        <div className="password-help-placeholder" aria-hidden />
      )}

      {hintText && !bypassing && (
        <div className="interaction-nova-hint">
          <NovaTicker text={hintText} alert="hint" liveLabel="LIVE" />
        </div>
      )}

      {bypassing && (
        <Nova06OverrideSequence
          mode={overrideMode}
          reducedMotion={reducedMotion}
          copy={copy.nova06}
          unknownLines={copy.password.override.unknownLines}
          scriptLines={copy.password.override.systemLines}
          runScript={() => {
            if (!scriptAbortRef.current || scriptAbortRef.current.signal.aborted) {
              scriptAbortRef.current = new AbortController();
            }
            const duration = overrideMode === 'light' ? 420 : reducedMotion ? 700 : 1100;
            return waitForAbortableDelay(duration, scriptAbortRef.current.signal);
          }}
          onScriptApplied={onOverrideScriptApplied}
          onDone={() => onComplete({
            kind: 'critical-log-password',
            routeKey: 'success',
            completedByNova06: true,
          })}
        />
      )}
    </section>
  );
}
