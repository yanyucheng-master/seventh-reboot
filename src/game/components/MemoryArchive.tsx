import { useMemo, useState } from 'react';
import { getArchiveCategoryLabel, getArchiveEntries } from '../archive';
import type { ArchiveCategory, ArchiveEntry, ContactStage, GameStats } from '../types';

const TABS: Array<{ id: ArchiveCategory; label: string; en: string }> = [
  { id: 'anchor', label: '记忆锚点', en: 'ANCHOR' },
  { id: 'photo', label: '剧情照片', en: 'PHOTO' },
  { id: 'anomaly', label: '异常记录', en: 'ANOMALY' },
  { id: 'profile', label: 'Nova档案', en: 'PROFILE' },
  { id: 'ending', label: '结局记录', en: 'ENDING' },
];

function getLockedTitle(category: ArchiveCategory) {
  if (category === 'photo') return '[图像未恢复]';
  if (category === 'ending') return '[未观测到的结局]';
  if (category === 'anchor') return '[加密记忆]';
  return '[加密记录]';
}

function getLockedDescription(category: ArchiveCategory) {
  if (category === 'photo') return '图像残留尚未进入 Observer-01 记忆模块';
  if (category === 'ending') return '尚未完成对应结局观测';
  return '尚未恢复';
}

function ArchiveCard({
  entry,
  onSelect,
}: {
  entry: ArchiveEntry;
  onSelect: (entry: ArchiveEntry) => void;
}) {
  const locked = !entry.unlocked;
  const title = locked ? getLockedTitle(entry.category) : entry.title;
  const description = locked ? getLockedDescription(entry.category) : entry.description;
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
        <div className="archive-card-kicker">{locked ? 'LOCKED' : getArchiveCategoryLabel(entry.category)}</div>
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
}: {
  entry: ArchiveEntry;
  onClose: () => void;
}) {
  return (
    <div className="archive-detail-panel">
      <button type="button" className="archive-detail-close" onClick={onClose}>
        返回列表
      </button>
      <p className="archive-detail-kicker">{getArchiveCategoryLabel(entry.category)}</p>
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
}: {
  stats: GameStats;
  contactStage: ContactStage;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ArchiveCategory>('anchor');
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);
  const entries = useMemo(() => getArchiveEntries(stats, contactStage), [contactStage, stats]);
  const tabEntries = entries.filter(entry => entry.category === activeTab);
  const unlockedCount = entries.filter(entry => entry.unlocked).length;

  return (
    <div className="archive-overlay" role="dialog" aria-modal="true" aria-label="记忆档案">
      <div className="archive-shell">
        <header className="archive-header">
          <div>
            <p className="archive-kicker">Observer-01 Memory Archive</p>
            <h2>记忆档案</h2>
            <p>已记录的通讯残留、图像与记忆锚点</p>
          </div>
          <button type="button" className="archive-close-btn" onClick={onClose}>
            返回通讯
          </button>
        </header>

        <div className="archive-status-row">
          <span>记录条目：{unlockedCount}/{entries.length}</span>
          <span>锚点：{stats.memoryAnchors.length}</span>
          <span>结局：{stats.endingsUnlocked.length}</span>
        </div>

        <nav className="archive-tabs" aria-label="档案栏目">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedEntry(null);
              }}
              className={activeTab === tab.id ? 'archive-tab-active' : ''}
            >
              <span>{tab.label}</span>
              <small>{tab.en}</small>
            </button>
          ))}
        </nav>

        <main className="archive-content">
          {selectedEntry ? (
            <ArchiveDetail entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
          ) : (
            <div className="archive-grid">
              {tabEntries.map(entry => (
                <ArchiveCard key={entry.id} entry={entry} onSelect={setSelectedEntry} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
