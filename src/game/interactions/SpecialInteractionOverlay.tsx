import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../../i18n';
import type { StoryNode } from '../story';
import type {
  SealableMemoryAnchor,
  SpecialInteractionCompletion,
} from '../types';
import { getSpecialInteractionCopy } from './copy';
import { MemoryCapacityInteraction } from './MemoryCapacityInteraction';
import { PasswordInteraction } from './PasswordInteraction';
import { PowerRoutingInteraction } from './PowerRoutingInteraction';
import { SignalSeparationInteraction } from './SignalSeparationInteraction';

type SpecialInteractionOverlayProps = {
  node: StoryNode;
  locale: Locale;
  sealedAnchor?: SealableMemoryAnchor;
  onComplete: (result: SpecialInteractionCompletion) => void;
  onSaveAndExit: () => void;
};

const ASSIST_KEY = 'seventh_reboot_interaction_assist';
const REDUCED_MOTION_KEY = 'seventh_reboot_interaction_reduced_motion';
const FORCE_REDUCED_MOTION_FOR_TEST = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('testReducedMotion') === '1';

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

export function SpecialInteractionOverlay({
  node,
  locale,
  sealedAnchor,
  onComplete,
  onSaveAndExit,
}: SpecialInteractionOverlayProps) {
  const copy = useMemo(() => getSpecialInteractionCopy(locale), [locale]);
  const [assistMode, setAssistMode] = useState(() => readStoredBoolean(ASSIST_KEY, false));
  const [reducedMotion, setReducedMotion] = useState(() => FORCE_REDUCED_MOTION_FOR_TEST || readStoredBoolean(
    REDUCED_MOTION_KEY,
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  ));
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    overlayRef.current?.focus();
  }, [node.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ASSIST_KEY, String(assistMode));
    } catch {
      /* Preference persistence is optional. */
    }
  }, [assistMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(REDUCED_MOTION_KEY, String(reducedMotion));
    } catch {
      /* Preference persistence is optional. */
    }
  }, [reducedMotion]);

  const title = node.interactionKind === 'critical-log-password'
    ? copy.password.title
    : node.interactionKind === 'signal-separation'
      ? copy.signal.title
      : node.interactionKind === 'power-routing'
        ? copy.power.title
        : node.interactionKind === 'memory-restore'
          ? copy.memory.restoreTitle
          : copy.memory.sealTitle;

  return (
    <div
      ref={overlayRef}
      className={`special-interaction-overlay ${reducedMotion ? 'interaction-reduced-motion' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      data-interaction-kind={node.interactionKind}
    >
      <div className="interaction-grid-backdrop" aria-hidden />
      <header className="interaction-header">
        <div className="interaction-header-id">
          <span>OBSERVER-01</span>
          <strong>{node.id}</strong>
        </div>
        <div className="interaction-header-controls">
          <label className="interaction-switch">
            <input
              type="checkbox"
              checked={assistMode}
              onChange={event => setAssistMode(event.target.checked)}
            />
            <span aria-hidden />
            {copy.common.assist}
          </label>
          <label className="interaction-switch">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={event => setReducedMotion(event.target.checked)}
            />
            <span aria-hidden />
            {copy.common.reducedMotion}
          </label>
          <button type="button" className="interaction-exit-btn" onClick={onSaveAndExit}>
            {copy.common.saveAndExit}
          </button>
        </div>
      </header>

      <main className="interaction-main">
        {node.interactionKind === 'critical-log-password' && (
          <PasswordInteraction copy={copy} assistMode={assistMode} onComplete={onComplete} />
        )}
        {node.interactionKind === 'signal-separation' && (
          <SignalSeparationInteraction
            copy={copy}
            assistMode={assistMode}
            reducedMotion={reducedMotion}
            onComplete={onComplete}
          />
        )}
        {node.interactionKind === 'power-routing' && (
          <PowerRoutingInteraction
            copy={copy}
            assistMode={assistMode}
            reducedMotion={reducedMotion}
            onComplete={onComplete}
          />
        )}
        {node.interactionKind === 'memory-seal' && (
          <MemoryCapacityInteraction mode="seal" copy={copy} onComplete={onComplete} />
        )}
        {node.interactionKind === 'memory-restore' && (
          <MemoryCapacityInteraction
            mode="restore"
            copy={copy}
            sealedAnchor={sealedAnchor}
            onComplete={onComplete}
          />
        )}
      </main>
    </div>
  );
}
