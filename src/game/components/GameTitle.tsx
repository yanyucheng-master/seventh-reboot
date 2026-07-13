type GameTitleProps = {
  title: string;
  subtitle: string;
  phaseLabel: string;
};

export function GameTitle({ title, subtitle, phaseLabel }: GameTitleProps) {
  const compactTitle = title.length > 8;

  return (
    <div className="menu-wordmark">
      <div className="menu-wordmark-orbit" aria-hidden="true">
        <span className="menu-wordmark-orbit-outer" />
        <span className="menu-wordmark-orbit-inner" />
        <span className="menu-wordmark-flare" />
      </div>
      <div className="menu-wordmark-meta" aria-hidden="true">
        <span>NOVA-07</span>
        <i />
        <span>{phaseLabel}</span>
        <i />
        <span>OBS-01</span>
      </div>
      <h1 className={`menu-title ${compactTitle ? 'menu-title-compact' : ''}`} aria-label={title}>
        <span className="menu-title-phase menu-title-phase-cyan" aria-hidden="true">
          {title}
        </span>
        <span className="menu-title-core">{title}</span>
        <span className="menu-title-phase menu-title-phase-amber" aria-hidden="true">
          {title}
        </span>
      </h1>
      <div className="menu-wordmark-subline">
        <span aria-hidden="true" />
        <strong>{subtitle}</strong>
        <span aria-hidden="true" />
      </div>
    </div>
  );
}
