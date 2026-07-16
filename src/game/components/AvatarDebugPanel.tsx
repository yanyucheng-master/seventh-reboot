import { Bug, Play, RotateCcw, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  NovaAvatarOverlay,
  NovaAvatarPresentation,
  NovaAvatarStoryState,
  NovaAvatarTransition,
  NovaBaseAvatar,
} from '../types';
import { NovaAvatar } from './NovaAvatar';

const BASES: NovaBaseAvatar[] = [
  'unknown_signal',
  'official_navigator',
  'n7_private',
  'white_flower',
];

const OVERLAYS: NovaAvatarOverlay[] = [
  'none',
  'signal_weak',
  'offline_residual',
  'archived',
  'nova06_interference',
  'special_password',
  'special_signal',
  'special_power',
  'special_memory_seal',
];

const TRANSITIONS: NovaAvatarTransition[] = [
  'identity-verification',
  'private-profile',
  'flower-profile',
  'profile-clear',
];

export function AvatarDebugPanel({
  currentPresentation,
  currentState,
}: {
  currentPresentation: NovaAvatarPresentation;
  currentState: NovaAvatarStoryState;
}) {
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState<NovaBaseAvatar>(currentPresentation.base);
  const [overlay, setOverlay] = useState<NovaAvatarOverlay>(currentPresentation.overlay);
  const [transition, setTransition] = useState<NovaAvatarTransition>('identity-verification');
  const [transitionNonce, setTransitionNonce] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const presentation = useMemo(() => ({ base, overlay }), [base, overlay]);

  if (!import.meta.env.DEV) return null;

  const useLiveState = () => {
    setBase(currentPresentation.base);
    setOverlay(currentPresentation.overlay);
  };

  const previewEnding = (kind: 'true' | 'normal' | 'bad') => {
    if (kind === 'bad') {
      setBase('official_navigator');
      setOverlay('offline_residual');
      setTransition('profile-clear');
    } else {
      setBase('n7_private');
      setOverlay(kind === 'true' ? 'archived' : 'offline_residual');
      setTransition('private-profile');
    }
    setTransitionNonce(value => value + 1);
  };

  if (!open) {
    return (
      <button type="button" className="avatar-debug-trigger" onClick={() => setOpen(true)} aria-label="Open avatar debugger">
        <Bug size={16} aria-hidden="true" />
      </button>
    );
  }

  return (
    <aside className="avatar-debug-panel" aria-label="Avatar debugger">
      <header>
        <span>AVATAR STATE / DEV</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close avatar debugger">
          <X size={15} aria-hidden="true" />
        </button>
      </header>

      <div className="avatar-debug-preview">
        <NovaAvatar
          key={`${transition}-${transitionNonce}`}
          presentation={presentation}
          size={88}
          transition={transitionNonce > 0 ? transition : null}
          reducedMotion={reducedMotion}
          simulateAssetFailure={simulateFailure}
        />
        <code>{base}<br />{overlay}</code>
      </div>

      <label>
        BASE
        <select value={base} onChange={event => setBase(event.target.value as NovaBaseAvatar)}>
          {BASES.map(value => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        OVERLAY
        <select value={overlay} onChange={event => setOverlay(event.target.value as NovaAvatarOverlay)}>
          {OVERLAYS.map(value => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        TRANSITION
        <span className="avatar-debug-inline">
          <select value={transition} onChange={event => setTransition(event.target.value as NovaAvatarTransition)}>
            {TRANSITIONS.map(value => <option key={value}>{value}</option>)}
          </select>
          <button type="button" onClick={() => setTransitionNonce(value => value + 1)} aria-label="Play transition">
            <Play size={13} aria-hidden="true" />
          </button>
        </span>
      </label>

      <div className="avatar-debug-endings" role="group" aria-label="Ending previews">
        <button type="button" onClick={() => previewEnding('true')}>TRUE</button>
        <button type="button" onClick={() => previewEnding('normal')}>NORMAL</button>
        <button type="button" onClick={() => previewEnding('bad')}>BAD</button>
      </div>

      <label className="avatar-debug-check">
        <input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)} />
        Reduced motion
      </label>
      <label className="avatar-debug-check">
        <input type="checkbox" checked={simulateFailure} onChange={event => setSimulateFailure(event.target.checked)} />
        Simulate asset failure
      </label>

      <button type="button" className="avatar-debug-live" onClick={useLiveState}>
        <RotateCcw size={13} aria-hidden="true" /> LIVE STATE
      </button>
      <details>
        <summary>EVENT FLAGS</summary>
        <pre>{JSON.stringify(currentState, null, 2)}</pre>
      </details>
    </aside>
  );
}
