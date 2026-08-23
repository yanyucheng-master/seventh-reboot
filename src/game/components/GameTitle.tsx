import type { Locale } from '../../i18n';
import { resolveTitleLinkMeta } from '../identity';
import type { RebootNumber } from '../types';

type GameTitleProps = {
  title: string;
  subtitle: string;
  phaseLabel: string;
  locale: Locale;
  rebootNumber?: RebootNumber;
  observerEstablished: boolean;
};

export function GameTitle({
  title,
  subtitle,
  phaseLabel,
  locale,
  rebootNumber = 7,
  observerEstablished,
}: GameTitleProps) {
  const englishWordmark = locale === 'en-US';
  const officialReboot08 = rebootNumber >= 8;
  const linkMeta = resolveTitleLinkMeta(rebootNumber, observerEstablished);

  return (
    <div className="menu-wordmark">
      <div className="menu-wordmark-orbit" aria-hidden="true">
        <span className="menu-wordmark-orbit-outer" />
        <span className="menu-wordmark-orbit-inner" />
        <span className="menu-wordmark-flare" />
      </div>
      <div className="menu-wordmark-meta" aria-hidden="true">
        <span>{linkMeta.contactCode}</span>
        <i />
        <span>{phaseLabel}</span>
        <i />
        <span>{linkMeta.observerCode}</span>
      </div>
      <h1
        className={`menu-title ${englishWordmark ? 'menu-title-en' : ''} ${officialReboot08 ? 'menu-title-official08' : ''}`}
        aria-label={title}
      >
        <span className="menu-title-art" aria-hidden="true" />
        <span className="menu-title-native-particles menu-title-native-particles-left-a" aria-hidden="true" />
        <span className="menu-title-native-particles menu-title-native-particles-left-b" aria-hidden="true" />
        <span className="menu-title-native-particles menu-title-native-particles-right-a" aria-hidden="true" />
        <span className="menu-title-native-particles menu-title-native-particles-right-b" aria-hidden="true" />
        <span className="sr-only">{title}</span>
      </h1>
      {!officialReboot08 && (
        <div className="menu-wordmark-subline">
          <span aria-hidden="true" />
          <strong>{subtitle}</strong>
          <span aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
