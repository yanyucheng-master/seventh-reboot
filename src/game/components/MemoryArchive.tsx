import { useMemo, useState } from 'react';
import { ARCHIVE_ENTRIES } from '../archive';
import type { ArchiveCategory, ArchiveEntry, ContactStage, GameStats } from '../types';
import { useI18n } from '../../i18n';
import {
  getArchiveCategoryLabel,
  getLocalizedArchiveEntries,
  getLockedArchiveCopy,
} from '../../i18n/archiveResolver';

const TAB_IDS: ArchiveCategory[] = ['anchor', 'photo', 'anomaly', 'profile', 'ending'];
const TAB_EN: Record<ArchiveCategory, string> = {
  anchor: 'ANCHOR',
  photo: 'PHOTO',
  anomaly: 'ANOMALY',
  profile: 'PROFILE',
  ending: 'ENDING',
};

function ArchiveCard({
  entry,
  onSelect,
  lockedLabel,
  categoryLabel,
  lockedCopy,
}: {
  entry: ArchiveEntry;
  onSelect: (entry: ArchiveEntry) => void;
  lockedLabel: string;
  categoryLabel: string;
  lockedCopy: { title: string; description: string };
}) {
  const locked = !entry.unlocked;
  const title = locked ? lockedCopy.title : entry.title;
  const description = locked ? lockedCopy.description : entry.description;
  const subtitle = locked ? undefined : entry.subtitle;
  const quote = locked ? undefined : entry.quote;

  return (
    <button
      type="button"
      onClick={() => !locked && onSelect(entry)}
      className={`archive-card ${locked ? 'archive-card-locked' : `archive-card-${entry.category}`}`}
      disabled={locked}
    >
      {entry.category === 'photo' && (
        <div className="archive-thumb">
          {!locked && entry.image ? (
            <img src={entry.image} alt="" loading="lazy" decoding="async" />
          ) : (
            <span>NO IMAGE</span>
          )}
        </div>
      )}
      <div className="archive-card-body">
        <div className="archive-card-kicker">{locked ? lockedLabel : categoryLabel}</div>
        <h3>{title}</h3>
        {subtitle && <p className="archive-card-subtitle">{subtitle}</p>}
        {quote && <p className="archive-card-quote">“{quote}”</p>}
        {description && <p className="archive-card-description whitespace-pre-line">{description}</p>}
        {!locked && entry.chapter && <p className="archive-card-chapter">{entry.chapter}</p>}
      </div>
    </button>
  );
}

function ArchiveDetail({
  entry,
  onClose,
  backLabel,
  categoryLabel,
}: {
  entry: ArchiveEntry;
  onClose: () => void;
  backLabel: string;
  categoryLabel: string;
}) {
  return (
    <div className="archive-detail-panel">
      <button type="button" className="archive-detail-close" onClick={onClose}>
        {backLabel}
      </button>
      <p className="archive-detail-kicker">{categoryLabel}</p>
      <h3>{entry.title}</h3>
      {entry.subtitle && <p className="archive-detail-subtitle">{entry.subtitle}</p>}
      {entry.image && (
        <img className="archive-detail-image" src={entry.image} alt="" loading="lazy" decoding="async" />
      )}
      {entry.quote && <p className="archive-detail-quote">“{entry.quote}”</p>}
      {entry.description && <p className="archive-detail-description whitespace-pre-line">{entry.description}</p>}
      {entry.chapter && <p className="archive-detail-chapter">{entry.chapter}</p>}
    </div>
  );
}

export function MemoryArchiveOverlay({
  stats,
  contactStage,
  onClose,
  backLabel,
}: {
  stats: GameStats;
  contactStage: ContactStage;
  onClose: () => void;
  backLabel?: string;
}) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<ArchiveCategory>('anchor');
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);
  const entries = useMemo(
    () => getLocalizedArchiveEntries(ARCHIVE_ENTRIES, stats, contactStage, locale),
    [contactStage, locale, stats],
  );
  const selectedLocalized = useMemo(() => {
    if (!selectedEntry) return null;
    return entries.find(entry => entry.id === selectedEntry.id) ?? null;
  }, [entries, selectedEntry]);
  const tabEntries = entries.filter(entry => entry.category === activeTab);
  const unlockedCount = entries.filter(entry => entry.unlocked).length;

  return (
    <div className="archive-overlay" role="dialog" aria-modal="true" aria-label={t('archiveOverlay.title')}>
      <div className="archive-shell">
        <header className="archive-header">
          <div>
            <p className="archive-kicker">Observer-01</p>
            <h2>{t('archiveOverlay.title')}</h2>
            <p>{t('archiveOverlay.subtitle')}</p>
          </div>
          <button type="button" className="archive-close-btn" onClick={onClose}>
            {backLabel ?? t('archiveOverlay.backToChat')}
          </button>
        </header>

        <div className="archive-status-row">
          <span>{t('archiveOverlay.entryCount', { unlocked: unlockedCount, total: entries.length })}</span>
          <span>{t('archiveOverlay.anchorCount', { count: stats.memoryAnchors.length })}</span>
          <span>{t('archiveOverlay.endingCount', { count: stats.endingsUnlocked.length })}</span>
        </div>

        <nav className="archive-tabs" aria-label="Archive sections">
          {TAB_IDS.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                setSelectedEntry(null);
              }}
              className={activeTab === id ? 'archive-tab-active' : ''}
            >
              <span>{t(`archiveOverlay.tabs.${id}`)}</span>
              <small>{TAB_EN[id]}</small>
            </button>
          ))}
        </nav>

        <main className="archive-content">
          {selectedLocalized ? (
            <ArchiveDetail
              entry={selectedLocalized}
              onClose={() => setSelectedEntry(null)}
              backLabel={t('archiveOverlay.backToList')}
              categoryLabel={getArchiveCategoryLabel(selectedLocalized.category, locale)}
            />
          ) : (
            <div className="archive-grid">
              {tabEntries.map(entry => (
                <ArchiveCard
                  key={entry.id}
                  entry={entry}
                  onSelect={setSelectedEntry}
                  lockedLabel={t('archiveOverlay.locked')}
                  categoryLabel={getArchiveCategoryLabel(entry.category, locale)}
                  lockedCopy={getLockedArchiveCopy(entry.category, locale)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
