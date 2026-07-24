import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Anchor,
  ArrowLeft,
  History,
  Image as ImageIcon,
  RadioTower,
  ScanLine,
  UserRound,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';
import { ARCHIVE_ENTRIES } from '../archive';
import type {
  ArchiveCategory,
  ArchiveEntry,
  ContactStage,
  FailedCycleRecord,
  GameStats,
  NovaAvatarPresentation,
} from '../types';
import { useI18n } from '../../i18n';
import { NovaAvatar } from './NovaAvatar';
import {
  getArchiveCategoryLabel,
  getLocalizedArchiveEntries,
  getLockedArchiveCopy,
} from '../../i18n/archiveResolver';
import { getResponsiveImageAttributes, isNovaProfileImage } from '../mediaAssets';

type ArchiveTabId = ArchiveCategory | 'history';

const TAB_IDS: ArchiveTabId[] = ['anchor', 'photo', 'anomaly', 'profile', 'ending', 'history'];
const TAB_EN: Record<ArchiveTabId, string> = {
  anchor: 'ANCHOR',
  photo: 'PHOTO',
  anomaly: 'ANOMALY',
  profile: 'PROFILE',
  ending: 'ENDING',
  history: 'HISTORY',
};
const TAB_ICONS: Record<ArchiveTabId, LucideIcon> = {
  anchor: Anchor,
  photo: ImageIcon,
  anomaly: RadioTower,
  profile: UserRound,
  ending: Waypoints,
  history: History,
};

function ArchiveCard({
  entry,
  onSelect,
  lockedLabel,
  categoryLabel,
  lockedCopy,
  index,
}: {
  entry: ArchiveEntry;
  onSelect: (entry: ArchiveEntry) => void;
  lockedLabel: string;
  categoryLabel: string;
  lockedCopy: { title: string; description: string };
  index: number;
}) {
  const locked = !entry.unlocked;
  const title = locked ? lockedCopy.title : entry.title;
  const description = locked ? lockedCopy.description : entry.description;
  const subtitle = locked ? undefined : entry.subtitle;
  const quote = locked ? undefined : entry.quote;
  const responsiveImage = entry.image ? getResponsiveImageAttributes(entry.image) : null;

  return (
    <button
      type="button"
      onClick={() => !locked && onSelect(entry)}
      className={`archive-card ${locked ? 'archive-card-locked' : `archive-card-${entry.category}`}`}
      disabled={locked}
    >
      <span className="archive-card-scan" aria-hidden="true" />
      {entry.category === 'photo' && (
        <div className="archive-thumb">
          {!locked && responsiveImage ? (
            <img
              src={responsiveImage.src}
              srcSet={responsiveImage.srcSet}
              sizes="88px"
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span>NO IMAGE</span>
          )}
        </div>
      )}
      <div className="archive-card-body">
        <div className="archive-card-index" aria-hidden="true">
          <span>{TAB_EN[entry.category]}-{String(index + 1).padStart(2, '0')}</span>
          <small>{locked ? 'SEALED' : 'RESTORED'}</small>
        </div>
        <div className="archive-card-kicker">{locked ? lockedLabel : categoryLabel}</div>
        <h3>{title}</h3>
        {subtitle && <p className="archive-card-subtitle">{subtitle}</p>}
        {quote && <p className="archive-card-quote">“{quote}”</p>}
        {description && <p className="archive-card-description whitespace-pre-line">{description}</p>}
        {!locked && entry.chapter && <p className="archive-card-chapter">{entry.chapter}</p>}
      </div>
      <span className="archive-card-node" aria-hidden="true" />
    </button>
  );
}

function ArchiveDetail({
  entry,
  archiveCode,
  onClose,
  backLabel,
  categoryLabel,
}: {
  entry: ArchiveEntry;
  archiveCode: string;
  onClose: () => void;
  backLabel: string;
  categoryLabel: string;
}) {
  const responsiveImage = entry.image ? getResponsiveImageAttributes(entry.image) : null;
  const isSquareProfile = isNovaProfileImage(entry.image);

  return (
    <div className="archive-detail-panel">
      <button type="button" className="archive-detail-close" onClick={onClose}>
        <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
        <span>{backLabel}</span>
      </button>
      <p className="archive-detail-kicker">{categoryLabel} / {archiveCode}</p>
      <h3>{entry.title}</h3>
      {entry.subtitle && <p className="archive-detail-subtitle">{entry.subtitle}</p>}
      {responsiveImage && (
        <img
          className={`archive-detail-image ${isSquareProfile ? 'archive-detail-image-square' : ''}`}
          src={responsiveImage.src}
          srcSet={responsiveImage.srcSet}
          sizes="(max-width: 760px) calc(100vw - 48px), 900px"
          alt={entry.title}
          loading="lazy"
          decoding="async"
        />
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
  avatarPresentation,
  onClose,
  backLabel,
  failedCycles = [],
  currentRebootNumber = 7,
}: {
  stats: GameStats;
  contactStage: ContactStage;
  avatarPresentation: NovaAvatarPresentation;
  onClose: () => void;
  backLabel?: string;
  failedCycles?: FailedCycleRecord[];
  currentRebootNumber?: number;
}) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<ArchiveTabId>('anchor');
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const entries = useMemo(
    () => getLocalizedArchiveEntries(ARCHIVE_ENTRIES, stats, contactStage, locale),
    [contactStage, locale, stats],
  );
  const selectedLocalized = useMemo(() => {
    if (!selectedEntry) return null;
    return entries.find(entry => entry.id === selectedEntry.id) ?? null;
  }, [entries, selectedEntry]);
  const tabEntries = activeTab === 'history'
    ? []
    : entries.filter(entry => entry.category === activeTab);
  const unlockedCount = entries.filter(entry => entry.unlocked).length;
  const unobservedEndingCount = entries.filter(entry => entry.category === 'ending' && !entry.unlocked).length;
  const showBranchArchiveNote = stats.endingsUnlocked.length > 0 && unobservedEndingCount > 0;

  useEffect(() => {
    triggerElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();
    return () => {
      triggerElementRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="archive-overlay" role="dialog" aria-modal="true" aria-label={t('archiveOverlay.title')}>
      <div className="archive-atmosphere" aria-hidden="true">
        <span className="archive-horizon archive-horizon-a" />
        <span className="archive-horizon archive-horizon-b" />
        <span className="archive-atmosphere-particle archive-atmosphere-particle-1" />
        <span className="archive-atmosphere-particle archive-atmosphere-particle-2" />
        <span className="archive-atmosphere-particle archive-atmosphere-particle-3" />
        <span className="archive-atmosphere-particle archive-atmosphere-particle-4" />
      </div>
      <div className="archive-shell">
        <span className="archive-shell-corner archive-shell-corner-tl" aria-hidden="true" />
        <span className="archive-shell-corner archive-shell-corner-tr" aria-hidden="true" />
        <span className="archive-shell-corner archive-shell-corner-bl" aria-hidden="true" />
        <span className="archive-shell-corner archive-shell-corner-br" aria-hidden="true" />
        <header className="archive-header">
          <div className="archive-header-index" aria-hidden="true">
            <strong>{String(currentRebootNumber).padStart(2, '0')}</strong>
            <span>PHASE<br />VAULT</span>
          </div>
          <div className="archive-heading-block">
            <p className="archive-kicker">Observer-01</p>
            <div className="archive-title-lockup">
              <h2 aria-label={t('archiveOverlay.title')}>
                <span className="archive-title-fragment archive-title-fragment-a" aria-hidden="true">{t('archiveOverlay.title')}</span>
                <span className="archive-title-core">{t('archiveOverlay.title')}</span>
                <span className="archive-title-fragment archive-title-fragment-b" aria-hidden="true">{t('archiveOverlay.title')}</span>
              </h2>
              <div className="archive-title-particles" aria-hidden="true">
                {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
              </div>
            </div>
            <p>{t('archiveOverlay.subtitle')}</p>
          </div>
          <div className="archive-contact-identity">
            <NovaAvatar presentation={avatarPresentation} size={48} />
            <span>
              <small>CONTACT TRACE</small>
              <strong>{contactStage === 'unknown' ? t('contact.unknownName') : 'NOVA'}</strong>
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="archive-close-btn"
            onClick={onClose}
            aria-label={backLabel ?? t('archiveOverlay.backToChat')}
            title={backLabel ?? t('archiveOverlay.backToChat')}
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{backLabel ?? t('archiveOverlay.backToChat')}</span>
          </button>
        </header>

        <div className="archive-status-row" aria-label={t('archiveOverlay.statusLabel')}>
          <span><i>01</i><strong>{t('archiveOverlay.entryCount', { unlocked: unlockedCount, total: entries.length })}</strong><small>RECOVERY INDEX</small></span>
          <span><i>02</i><strong>{t('archiveOverlay.anchorCount', { count: stats.memoryAnchors.length })}</strong><small>ANCHOR ARRAY</small></span>
          <span><i>03</i><strong>{t('archiveOverlay.endingCount', { count: stats.endingsUnlocked.length })}</strong><small>ENDING TRACE</small></span>
          <div className={`archive-array-state ${stats.commemorativeArchiveSaved ? 'archive-array-state-saved' : ''}`}>
            <ScanLine size={15} strokeWidth={1.4} />
            <span>
              {stats.commemorativeArchiveSaved
                ? t('archiveOverlay.memorialSaved')
                : t('archiveOverlay.arrayOnline')}
            </span>
          </div>
        </div>

        {showBranchArchiveNote && (
          <p className="archive-branch-note">
            <Waypoints size={14} strokeWidth={1.4} aria-hidden="true" />
            <span>{t('archiveOverlay.branchArchiveNote', { count: unobservedEndingCount })}</span>
          </p>
        )}

        <nav className="archive-tabs" aria-label={t('archiveOverlay.sectionsLabel')}>
          {TAB_IDS.map((id, index) => {
            const Icon = TAB_ICONS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id);
                  setSelectedEntry(null);
                }}
                className={activeTab === id ? 'archive-tab-active' : ''}
              >
                <span className="archive-tab-icon"><Icon size={17} strokeWidth={1.35} aria-hidden="true" /></span>
                <span className="archive-tab-copy">
                  <strong>{t(`archiveOverlay.tabs.${id}`)}</strong>
                  <small>{String(index + 1).padStart(2, '0')} / {TAB_EN[id]}</small>
                </span>
                <i aria-hidden="true" />
              </button>
            );
          })}
        </nav>

        <main className="archive-content">
          {activeTab === 'history' ? (
            <div className="archive-history-list">
              {failedCycles.length === 0 ? (
                <div className="archive-history-empty">
                  <History size={22} strokeWidth={1.2} aria-hidden="true" />
                  <strong>{t('archiveOverlay.historyEmpty')}</strong>
                  <p>{t('archiveOverlay.historyEmptyBody')}</p>
                </div>
              ) : [...failedCycles].reverse().map((record, index) => (
                <article className="archive-history-entry" key={record.cycleId}>
                  <header>
                    <span>FAILED LOOP / {String(record.rebootNumber).padStart(2, '0')}</span>
                    <small>{new Intl.DateTimeFormat(locale, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(record.failedAt)}</small>
                  </header>
                  <div className="archive-history-code">{String(failedCycles.length - index).padStart(2, '0')}</div>
                  <h3>{t(`archiveOverlay.failureCauses.${record.failureCause}`)}</h3>
                  <p>{t('archiveOverlay.failedCycleSummary', {
                    nodes: record.completedNodeIds.length,
                    choices: record.choiceHistory.length,
                    interactions: record.interactionResults.length,
                  })}</p>
                  <dl>
                    <div><dt>{t('archiveOverlay.failedInteraction')}</dt><dd>{record.failedInteractionId}</dd></div>
                    <div><dt>{t('archiveOverlay.lastNode')}</dt><dd>{record.previousCycleMaxNodeId ?? 'UNKNOWN'}</dd></div>
                    <div><dt>{t('archiveOverlay.recordMode')}</dt><dd>{t('archiveOverlay.readOnly')}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          ) : selectedLocalized ? (
            <ArchiveDetail
              entry={selectedLocalized}
              archiveCode={`${TAB_EN[selectedLocalized.category]}-${String(
                entries
                  .filter(entry => entry.category === selectedLocalized.category)
                  .findIndex(entry => entry.id === selectedLocalized.id) + 1,
              ).padStart(2, '0')}`}
              onClose={() => setSelectedEntry(null)}
              backLabel={t('archiveOverlay.backToList')}
              categoryLabel={getArchiveCategoryLabel(selectedLocalized.category, locale)}
            />
          ) : (
            <div className="archive-grid">
              {tabEntries.map((entry, index) => (
                <ArchiveCard
                  key={entry.id}
                  entry={entry}
                  onSelect={setSelectedEntry}
                  lockedLabel={t('archiveOverlay.locked')}
                  categoryLabel={getArchiveCategoryLabel(entry.category, locale)}
                  lockedCopy={getLockedArchiveCopy(entry.category, locale)}
                  index={index}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
