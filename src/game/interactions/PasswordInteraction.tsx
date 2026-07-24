import { useEffect, useRef, useState } from 'react';
import type { SpecialInteractionCompletion } from '../types';
import type { SpecialInteractionCopy } from './copy';
import { isCriticalLogPassword } from './logic';
import { InteractionTitle } from './InteractionTitle';

type PasswordInteractionProps = {
  copy: SpecialInteractionCopy;
  onResultLocked: (result: SpecialInteractionCompletion) => void;
  onComplete: (result: SpecialInteractionCompletion) => void;
};

export function PasswordInteraction({ copy, onResultLocked, onComplete }: PasswordInteractionProps) {
  const [value, setValue] = useState('');
  const [accepted, setAccepted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (accepted) {
    return (
      <section className="interaction-result" aria-live="polite" data-testid="password-success">
        <div className="interaction-result-mark" aria-hidden>07 / 01</div>
        <p className="interaction-kicker">{copy.password.accepted}</p>
        <InteractionTitle state="resolved">{copy.password.title}</InteractionTitle>
        <div className="authorization-output">
          <strong>NOVA-07 / AUTHORIZED</strong>
          <strong>OBSERVER-01 / AUTHORIZED</strong>
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
      <InteractionTitle id="password-interaction-title">{copy.password.title}</InteractionTitle>
      <p className="interaction-mission">{copy.password.mission}</p>

      <div className="authorization-slots" aria-label="Joint authorization status">
        <article data-ready>
          <span>{copy.password.novaSlot}</span>
          <strong>{copy.password.submitted}</strong>
        </article>
        <div className="authorization-link" aria-hidden>+</div>
        <article>
          <span>{copy.password.observerSlot}</span>
          <strong>{copy.password.waiting}</strong>
        </article>
      </div>

      <form
        className="password-form"
        onSubmit={event => {
          event.preventDefault();
          if (isCriticalLogPassword(value)) {
            onResultLocked({ kind: 'critical-log-password', routeKey: 'success' });
            setAccepted(true);
            return;
          }
          onComplete({ kind: 'critical-log-password', routeKey: 'retry' });
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
          />
          <button
            type="submit"
            className="interaction-primary-btn"
            data-testid="password-submit"
            disabled={!value.trim()}
          >
            {copy.password.submit}
          </button>
        </div>
      </form>
    </section>
  );
}
