import { ArrowLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { getLocalizedEpilogueNodes, type EpilogueKind } from '../epilogues';

const MAX_AUTOPLAY_DELAY_MS = 3200;

export function EpilogueArchiveReader({
  kind,
  onClose,
}: {
  kind: EpilogueKind;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  const nodes = useMemo(() => getLocalizedEpilogueNodes(kind, locale), [kind, locale]);
  const [visibleCount, setVisibleCount] = useState(1);
  const [autoplay, setAutoplay] = useState(true);
  const currentFragmentRef = useRef<HTMLElement>(null);
  const isComplete = visibleCount >= nodes.length;

  useEffect(() => {
    if (!autoplay || isComplete) return undefined;
    const current = nodes[Math.max(0, visibleCount - 1)];
    const timeout = window.setTimeout(
      () => setVisibleCount(count => Math.min(nodes.length, count + 1)),
      Math.min(current?.delay ?? 2200, MAX_AUTOPLAY_DELAY_MS),
    );
    return () => window.clearTimeout(timeout);
  }, [autoplay, isComplete, nodes, visibleCount]);

  useEffect(() => {
    currentFragmentRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [visibleCount]);

  const revealNext = () => {
    if (isComplete) {
      onClose();
      return;
    }
    setVisibleCount(count => Math.min(nodes.length, count + 1));
  };

  return (
    <div
      className={`epilogue-archive-reader epilogue-archive-reader-${kind}`}
      role="dialog"
      aria-modal="true"
      aria-label={t(`archiveOverlay.future.${kind}Title`)}
      data-mode="archive_epilogue"
    >
      <div className="epilogue-archive-atmosphere" aria-hidden="true" />
      <section className="epilogue-archive-shell">
        <header className="epilogue-archive-header">
          <button
            type="button"
            className="epilogue-archive-back"
            onClick={onClose}
            aria-label={t('archiveOverlay.future.back')}
          >
            <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>{t('archiveOverlay.future.back')}</span>
          </button>
          <div>
            <p>OBSERVER-01 / FUTURE RECORD</p>
            <h2>{t(`archiveOverlay.future.${kind}Title`)}</h2>
          </div>
          <span className="epilogue-archive-mode">ARCHIVE_EPILOGUE</span>
        </header>

        <dl className="epilogue-archive-metadata">
          <div>
            <dt>{t('archiveOverlay.future.recordTime')}</dt>
            <dd>{t('archiveOverlay.future.recordTimeValue')}</dd>
          </div>
          <div>
            <dt>{t('archiveOverlay.future.recordSource')}</dt>
            <dd>{t('archiveOverlay.future.recordSourceValue')}</dd>
          </div>
          <div>
            <dt>{t('archiveOverlay.future.continuity')}</dt>
            <dd>{t('archiveOverlay.future.continuityValue')}</dd>
          </div>
        </dl>

        <div className="epilogue-archive-progress" aria-label={t('archiveOverlay.future.progress')}>
          <span style={{ width: `${(visibleCount / Math.max(nodes.length, 1)) * 100}%` }} />
        </div>

        <main className="epilogue-archive-pages" aria-live="polite">
          {nodes.slice(0, visibleCount).map((node, index) => (
            <article
              key={node.id}
              ref={index === visibleCount - 1 ? currentFragmentRef : undefined}
              className={`epilogue-archive-fragment ${
                index === visibleCount - 1 ? 'epilogue-archive-fragment-current' : ''
              }`}
            >
              <span>{node.id}</span>
              <p className="whitespace-pre-line">{node.content}</p>
            </article>
          ))}
        </main>

        <footer className="epilogue-archive-controls">
          <button
            type="button"
            className="epilogue-archive-autoplay"
            onClick={() => setAutoplay(value => !value)}
            aria-pressed={autoplay}
            aria-label={t(autoplay ? 'archiveOverlay.future.pause' : 'archiveOverlay.future.play')}
          >
            {autoplay
              ? <Pause size={14} strokeWidth={1.6} aria-hidden="true" />
              : <Play size={14} strokeWidth={1.6} aria-hidden="true" />}
            <span>{t(autoplay ? 'archiveOverlay.future.pause' : 'archiveOverlay.future.play')}</span>
          </button>
          <span>{String(visibleCount).padStart(2, '0')} / {String(nodes.length).padStart(2, '0')}</span>
          <button type="button" className="epilogue-archive-next" onClick={revealNext}>
            <span>{t(isComplete ? 'archiveOverlay.future.finish' : 'archiveOverlay.future.next')}</span>
            <ChevronRight size={15} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </footer>
      </section>
    </div>
  );
}
