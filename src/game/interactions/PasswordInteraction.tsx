import { useEffect, useRef, useState } from 'react';
import type { SpecialInteractionCompletion } from '../types';
import type { SpecialInteractionCopy } from './copy';
import { isCriticalLogPassword } from './logic';
import { NovaTicker } from './NovaTicker';

type PasswordInteractionProps = {
  copy: SpecialInteractionCopy;
  assistMode: boolean;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

export function PasswordInteraction({ copy, assistMode, onComplete }: PasswordInteractionProps) {
  const [value, setValue] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hintIndex = Math.min(
    copy.password.hints.length - 1,
    Math.max(0, attempts - 1),
  );
  const showNovaHelp = attempts > 0 || assistMode;
  const novaLine = showNovaHelp
    ? copy.password.hints[assistMode ? Math.max(hintIndex, 0) : hintIndex]
    : '';

  function verify() {
    if (isCriticalLogPassword(value)) {
      setAccepted(true);
      return;
    }
    setAttempts(current => current + 1);
    setValue('');
    inputRef.current?.focus();
  }

  if (accepted) {
    return (
      <section className="interaction-result" aria-live="polite" data-testid="password-success">
        <div className="interaction-result-mark" aria-hidden>07 / 01</div>
        <p className="interaction-kicker">{copy.password.accepted}</p>
        <h2>{copy.password.title}</h2>
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

  return (
    <section className="password-console" aria-labelledby="password-interaction-title">
      <p className="interaction-kicker">{copy.password.kicker}</p>
      <h2 id="password-interaction-title">{copy.password.title}</h2>
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
            placeholder={attempts >= 2 ? copy.password.partialPlaceholder : copy.password.placeholder}
            aria-describedby={showNovaHelp ? 'password-nova-help' : undefined}
          />
          <button type="submit" className="interaction-primary-btn">
            {copy.password.submit}
          </button>
        </div>
      </form>

      {showNovaHelp ? (
        <div id="password-nova-help" className="password-nova-help">
          <NovaTicker text={novaLine} alert="hint" liveLabel="HELP" />
        </div>
      ) : (
        <div className="password-help-placeholder" aria-hidden />
      )}
    </section>
  );
}
