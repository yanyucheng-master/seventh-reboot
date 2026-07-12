type NovaTickerAlert = 'stable' | 'lifeSupport' | 'communications' | 'coreScan' | 'hint';

type NovaTickerProps = {
  text: string;
  alert?: NovaTickerAlert;
  badgeLabel?: string;
  liveLabel?: string;
};

/**
 * Nova 实时发言条。
 * 设计取向：深空语音信道，而不是资讯新闻栏。
 * 取消左右硬分割的方正双栏，改用不对称软轮廓 + 顶部身份行。
 */
export function NovaTicker({
  text,
  alert = 'stable',
  badgeLabel = 'NOVA',
  liveLabel = 'LIVE',
}: NovaTickerProps) {
  return (
    <aside className="nova-ticker" data-alert={alert} aria-live="polite">
      <span className="nova-ticker-rail" aria-hidden />
      <span className="nova-ticker-orbit" aria-hidden />
      <header className="nova-ticker-meta">
        <span className="nova-ticker-live" aria-hidden />
        <strong>{badgeLabel}</strong>
        <em>{liveLabel}</em>
      </header>
      <p className="nova-ticker-text">{text}</p>
    </aside>
  );
}
