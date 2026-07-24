import { useEffect, useRef, useState } from 'react';
import { Pause, RadioTower, X } from 'lucide-react';
import type { CycleSyncEvent } from '../cycleState';
import { useI18n } from '../../i18n';

type CycleSyncOverlayProps = {
  events: CycleSyncEvent[];
  visibleCount: number;
  onInterrupt: () => void;
};

export function CycleSyncOverlay({ events, visibleCount, onInterrupt }: CycleSyncOverlayProps) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const progress = events.length === 0 ? 0 : Math.min(100, visibleCount / events.length * 100);
  const visibleEvents = events.slice(Math.max(0, visibleCount - 12), visibleCount);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'auto' });
  }, [visibleCount]);

  return (
    <div className="cycle-sync-overlay" role="dialog" aria-modal="true" aria-label={t('cycle.syncTitle')}>
      <div className="cycle-sync-noise" aria-hidden="true" />
      <span className="cycle-sync-reboot-mark" aria-hidden="true">REBOOT 08</span>
      <section className="cycle-sync-console">
        <header>
          <div className="cycle-sync-ident">
            <RadioTower size={17} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <small>OBSERVER-01 / RESIDUAL PROJECTION</small>
              <strong>{t('cycle.syncTitle')}</strong>
            </span>
          </div>
          <span className="cycle-sync-route">LOOP 07 <i /> LOOP 08</span>
        </header>

        <div className="cycle-sync-progress" aria-label={t('cycle.syncProgress', { progress: Math.round(progress) })}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="cycle-sync-log" ref={logRef} aria-live="polite">
          {visibleEvents.map((event, index) => (
            <div
              key={`${event.nodeId}-${Math.max(0, visibleCount - 12) + index}`}
              className={`cycle-sync-event cycle-sync-event-${event.kind}`}
              data-speaker={event.speaker}
            >
              <small>{event.kind.toUpperCase()} / {event.nodeId}</small>
              <p>{event.label}</p>
              {event.kind === 'choice' && <span>{t('cycle.ghostSubmitted')}</span>}
              {event.kind === 'image' && <i className="cycle-sync-image-ghost" aria-hidden="true" />}
            </div>
          ))}
          {visibleEvents.length === 0 && (
            <p className="cycle-sync-probing">{t('cycle.syncProbing')}</p>
          )}
        </div>

        <footer>
          <span>{t('cycle.syncWarningShort')}</span>
          <button type="button" onClick={() => setConfirming(true)}>
            <Pause size={14} strokeWidth={1.6} aria-hidden="true" />
            {t('cycle.interrupt')}
          </button>
        </footer>

        {confirming && (
          <div className="cycle-sync-confirm" role="alertdialog" aria-modal="true">
            <button
              type="button"
              className="cycle-sync-confirm-close"
              onClick={() => setConfirming(false)}
              aria-label={t('menu.close')}
            >
              <X size={16} aria-hidden="true" />
            </button>
            <small>PROJECTION CONTROL / MANUAL OVERRIDE</small>
            <h3>{t('cycle.interruptConfirmTitle')}</h3>
            <p>{t('cycle.interruptConfirmBody')}</p>
            <div>
              <button type="button" onClick={() => setConfirming(false)}>{t('cycle.continueSync')}</button>
              <button type="button" className="cycle-sync-confirm-danger" onClick={onInterrupt}>
                {t('cycle.confirmInterrupt')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

