import { useEffect, useState } from 'react';

const FULL_STARTUP_DURATION_MS = 1950;
const REDUCED_STARTUP_DURATION_MS = 420;

function shouldShowStartupSequence(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  const nativeApp = document.documentElement.classList.contains('native-app');
  const developmentPreview = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('nativeBootPreview') === '1';
  return nativeApp || developmentPreview;
}

export function NativeStartupSequence() {
  const [visible, setVisible] = useState(shouldShowStartupSequence);
  const [reducedMotion] = useState(() => (
    typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  ));

  useEffect(() => {
    if (!visible) return undefined;

    const root = document.documentElement;
    root.classList.add('native-startup-active');
    const timeout = window.setTimeout(
      () => setVisible(false),
      reducedMotion ? REDUCED_STARTUP_DURATION_MS : FULL_STARTUP_DURATION_MS,
    );

    return () => {
      window.clearTimeout(timeout);
      root.classList.remove('native-startup-active');
    };
  }, [reducedMotion, visible]);

  if (!visible) return null;

  return (
    <div
      className="native-startup-curtain"
      data-testid="native-startup-sequence"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      aria-hidden="true"
    >
      <span className="native-startup-scan" />
      <div className="native-startup-core">
        <span className="native-startup-phase">PHASE-LINK / 07</span>
        <div className="native-startup-emblem">
          <img src="/assets/nova_avatar_official_navigator.png" alt="" draggable={false} />
          <span className="native-startup-emblem-ring" />
        </div>
        <strong className="native-startup-brand">AURORA</strong>
        <span className="native-startup-system">NAVIGATION SYSTEM</span>
        <div className="native-startup-link">
          <span className="native-startup-link-fill" />
          <i className="native-startup-node native-startup-node-a" />
          <i className="native-startup-node native-startup-node-b" />
        </div>
        <small className="native-startup-status">OBSERVER-01 · CHANNEL READY</small>
      </div>
    </div>
  );
}
