import type { ReactNode } from 'react';

type NovaTickerAlert = 'stable' | 'lifeSupport' | 'communications' | 'coreScan' | 'hint';

type NovaTickerProps = {
  text: string;
  alert?: NovaTickerAlert;
  badgeLabel?: string;
  liveLabel?: string;
  children?: ReactNode;
};

/** 互动界面中 Nova 实时发言的新闻条样式 */
export function NovaTicker({
  text,
  alert = 'stable',
  badgeLabel = 'NOVA',
  liveLabel = 'LIVE',
}: NovaTickerProps) {
  return (
    <div className="nova-ticker" data-alert={alert} aria-live="polite">
      <div className="nova-ticker-badge">
        <span className="nova-ticker-live" aria-hidden />
        <strong>{badgeLabel}</strong>
        <em>{liveLabel}</em>
      </div>
      <p className="nova-ticker-text">{text}</p>
    </div>
  );
}
