import { useEffect, useRef, useState } from 'react';
import type { SpecialInteractionCompletion } from '../types';
import type { SpecialInteractionCopy } from './copy';
import { isCriticalLogPassword } from './logic';
import { markNova06FullFxSeen } from './guidance';
import { useInteractionGuidance } from './useInteractionGuidance';
import { InteractionTitle } from './InteractionTitle';
import { NovaTicker } from './NovaTicker';
import { Nova06OverrideSequence } from './Nova06OverrideSequence';

type PasswordInteractionProps = {
  copy: SpecialInteractionCopy;
  reducedMotion: boolean;
  nova06FxSeen: boolean;
  /** 本周目该互动是否已由 NOVA-06 接管完成过 */
  nova06OverrideUsed: boolean;
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
};

type OverrideState = 'none' | 'sequence';

export function PasswordInteraction({
  copy,
  reducedMotion,
  nova06FxSeen,
  nova06OverrideUsed,
  onComplete,
}: PasswordInteractionProps) {
  const [value, setValue] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [overrideState, setOverrideState] = useState<OverrideState>('none');
  const inputRef = useRef<HTMLInputElement>(null);
  const overrideModeRef = useRef<'full' | 'light'>(nova06FxSeen ? 'light' : 'full');

  const guidance = useInteractionGuidance({
    thresholds: PASSWORD_THRESHOLDS,
    enabled: !accepted && overrideState === 'none' && !nova06OverrideUsed,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (guidance.stage === 3 && !accepted && overrideState === 'none' && !nova06OverrideUsed) {
      if (overrideModeRef.current === 'full') markNova06FullFxSeen();
      setOverrideState('sequence');
    }
  }, [accepted, guidance.stage, nova06OverrideUsed, overrideState]);

  function verify() {
    if (overrideState !== 'none') return;
    guidance.noteValidAttempt();
    if (isCriticalLogPassword(value)) {
      setAccepted(true);
      return;
    }
    guidance.noteInvalidAttempt();
    setAttempts(current => current + 1);
    setValue('');
    inputRef.current?.focus();
  }

  if (accepted) {
    return (
      <section className="interaction-result" aria-live="polite" data-testid="password-success">
        <div className="interaction-result-mark" aria-hidden>07 / 01</div>
        <p className="interaction-kicker">{copy.password.accepted}</p>
        <InteractionTitle state="resolved">{copy.password.title}</InteractionTitle>
        <div className="authorization-output">
          <strong>AUTHORIZATION KEY ACCEPTED</strong>
          <strong>NOVA-06 SEALED RECORD UNLOCKED</strong>
        </div>
        <p>{copy.password.successDetail}</p>
        <button
          type="button"
          className="interaction-primary-btn"
          onClick={() => onComplete({ kind: 'critical-log-password', routeKey: 'success' })}
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
          mode={overrideModeRef.current}
          reducedMotion={reducedMotion}
          copy={copy.nova06}
          unknownLines={copy.password.override.unknownLines}
          scriptLines={copy.password.override.systemLines}
          runScript={() => new Promise(resolve => {
            window.setTimeout(resolve, reducedMotion ? 700 : 1100);
          })}
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
