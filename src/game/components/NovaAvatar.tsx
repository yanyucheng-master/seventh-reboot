import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useI18n } from '../../i18n';
import { novaAvatarAssets } from '../assets';
import type {
  NovaAvatarOverlay,
  NovaAvatarPresentation,
  NovaAvatarTransition,
  NovaBaseAvatar,
} from '../types';

const BASE_ALT_KEYS: Record<NovaBaseAvatar, string> = {
  unknown_signal: 'avatar.alt.unknownSignal',
  official_navigator: 'avatar.alt.officialNavigator',
  n7_private: 'avatar.alt.n7Private',
  white_flower: 'avatar.alt.whiteFlower',
};

const OVERLAY_ALT_KEYS: Partial<Record<NovaAvatarOverlay, string>> = {
  signal_weak: 'avatar.status.signalWeak',
  offline_residual: 'avatar.status.offline',
  archived: 'avatar.status.archived',
  nova06_interference: 'avatar.status.nova06Interference',
  special_bulkhead: 'avatar.status.specialBulkhead',
  special_password: 'avatar.status.specialPassword',
  special_power: 'avatar.status.specialPower',
  special_memory_seal: 'avatar.status.specialMemory',
};

function UnknownSignalPlaceholder() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path className="avatar-vector-dim" d="M20 36a34 34 0 0 1 58-11M82 38a34 34 0 0 1-2 29M69 80a34 34 0 0 1-51-16" />
      <path className="avatar-vector-main" d="M28 47a23 23 0 0 1 37-14M72 43a23 23 0 0 1-3 22M58 72a23 23 0 0 1-31-13" />
      <path className="avatar-vector-accent" d="M50 38v7m0 10v7M38 50h7m10 0h7" />
      <circle className="avatar-vector-core" cx="50" cy="50" r="4" />
      <path className="avatar-vector-noise" d="M15 48h8m54 0h9M43 16v7m0 54v8" />
    </svg>
  );
}

function OfficialNavigatorPlaceholder() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle className="avatar-vector-dim" cx="50" cy="50" r="35" />
      <circle className="avatar-vector-main" cx="50" cy="50" r="27" />
      <path className="avatar-vector-dim" d="M50 9v10M50 81v10M9 50h10M81 50h10" />
      <path className="avatar-vector-fill" d="m50 20 7 23 23 7-23 7-7 23-7-23-23-7 23-7Z" />
      <path className="avatar-vector-accent avatar-compass-needle" d="m50 50 25-24-17 32Z" />
      <circle className="avatar-vector-core" cx="50" cy="50" r="6" />
      <circle className="avatar-vector-main" cx="50" cy="50" r="3" />
    </svg>
  );
}

function N7PrivatePlaceholder() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path className="avatar-vector-fill" d="M27 39 24 19l18 12a39 39 0 0 1 16 0l18-12-3 20c6 6 9 14 9 23 0 16-14 25-32 25S18 78 18 62c0-9 3-17 9-23Z" />
      <path className="avatar-vector-main" d="M27 39 24 19l18 12a39 39 0 0 1 16 0l18-12-3 20c6 6 9 14 9 23 0 16-14 25-32 25S18 78 18 62c0-9 3-17 9-23Z" />
      <path className="avatar-vector-accent" d="M35 56h7m16 0h7M46 66l4 3 4-3M50 69v6m0 0-7 3m7-3 7 3" />
      <path className="avatar-vector-dim" d="M18 67 5 63m14 10L7 75m74-8 14-4m-14 10 12 2" />
      <path className="avatar-vector-noise" d="M68 22h8v8" />
    </svg>
  );
}

function WhiteFlowerPlaceholder() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path className="avatar-vector-main" d="M50 82V51m0 17c-8-9-16-9-22-5 3 11 11 14 22 12m0-12c8-9 16-9 22-5-3 11-11 14-22 12" />
      <path className="avatar-vector-fill" d="M50 49c-13 5-22-1-22-11 0-7 5-12 13-12 0-8 4-13 9-13s9 5 9 13c8 0 13 5 13 12 0 10-9 16-22 11Z" />
      <path className="avatar-vector-main" d="M50 49c-13 5-22-1-22-11 0-7 5-12 13-12 0-8 4-13 9-13s9 5 9 13c8 0 13 5 13 12 0 10-9 16-22 11Z" />
      <circle className="avatar-vector-accent" cx="50" cy="39" r="7" />
      <path className="avatar-vector-dim" d="M20 87h60M31 91h38" />
    </svg>
  );
}

function NovaAvatarPlaceholder({ base }: { base: NovaBaseAvatar }) {
  switch (base) {
    case 'official_navigator':
      return <OfficialNavigatorPlaceholder />;
    case 'n7_private':
      return <N7PrivatePlaceholder />;
    case 'white_flower':
      return <WhiteFlowerPlaceholder />;
    default:
      return <UnknownSignalPlaceholder />;
  }
}

export function NovaAvatar({
  presentation,
  size = 40,
  className = '',
  transition,
  reducedMotion = false,
  residualSignature = false,
  simulateAssetFailure = false,
}: {
  presentation: NovaAvatarPresentation;
  size?: number;
  className?: string;
  transition?: NovaAvatarTransition | null;
  reducedMotion?: boolean;
  residualSignature?: boolean;
  simulateAssetFailure?: boolean;
}) {
  const { t } = useI18n();
  const configuredAsset = simulateAssetFailure ? '/assets/__missing_nova_avatar__.png' : novaAvatarAssets[presentation.base];
  const [readyAsset, setReadyAsset] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!configuredAsset) return () => { cancelled = true; };

    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setReadyAsset(configuredAsset);
    };
    probe.onerror = () => {
      if (!cancelled) setReadyAsset(current => current === configuredAsset ? null : current);
    };
    probe.src = configuredAsset;
    return () => {
      cancelled = true;
    };
  }, [configuredAsset]);

  const ariaLabel = useMemo(() => {
    const parts = [t(BASE_ALT_KEYS[presentation.base])];
    const overlayKey = OVERLAY_ALT_KEYS[presentation.overlay];
    if (overlayKey) parts.push(t(overlayKey));
    if (residualSignature) parts.push(t('avatar.status.residual06'));
    return parts.join('，');
  }, [presentation.base, presentation.overlay, residualSignature, t]);

  const style = { '--nova-avatar-size': `${size}px` } as CSSProperties;
  const transitionClass = transition && !reducedMotion ? `nova-avatar-transition-${transition}` : '';

  return (
    <span
      className={`nova-avatar ${className} ${transitionClass}`.trim()}
      style={style}
      role="img"
      aria-label={ariaLabel}
      data-base={presentation.base}
      data-overlay={presentation.overlay}
    >
      <span className="nova-avatar-frame" aria-hidden="true">
        {configuredAsset && readyAsset === configuredAsset ? (
          <img className="nova-avatar-art" src={configuredAsset} alt="" draggable={false} />
        ) : (
          <span className="nova-avatar-placeholder">
            <NovaAvatarPlaceholder base={presentation.base} />
          </span>
        )}
        <span className="nova-avatar-grid" />
        <span className="nova-avatar-scan" />
        <span className="nova-avatar-overlay-glyph" />
        <span className="nova-avatar-particle nova-avatar-particle-a" />
        <span className="nova-avatar-particle nova-avatar-particle-b" />
      </span>
      {residualSignature && <span className="nova-avatar-residual-badge" aria-hidden="true">06</span>}
    </span>
  );
}
