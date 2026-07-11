import type { ArchiveDefinition } from '../game/archive';
import { ANCHOR_ARCHIVE_IDS } from '../game/archive';
import type { ArchiveCategory, ArchiveEntry, ContactStage, GameStats } from '../game/types';
import type { Locale } from './types';
import archiveZh from './locales/zh-CN/archive.json';
import archiveEn from './locales/en-US/archive.json';

type ArchiveEntryLocale = {
  title?: string;
  subtitle?: string;
  description?: string;
  quote?: string;
  chapter?: string;
};

type ArchiveLocaleData = {
  categories: Record<ArchiveCategory, string>;
  locked: {
    title: {
      photo: string;
      ending: string;
      anchor: string;
      default: string;
    };
    description: {
      photo: string;
      ending: string;
      default: string;
    };
  };
  entries: Record<string, ArchiveEntryLocale>;
};

const ARCHIVE_BY_LOCALE: Record<Locale, ArchiveLocaleData> = {
  'zh-CN': archiveZh as ArchiveLocaleData,
  'en-US': archiveEn as ArchiveLocaleData,
};

function getArchiveLocale(locale: Locale): ArchiveLocaleData {
  return ARCHIVE_BY_LOCALE[locale] ?? ARCHIVE_BY_LOCALE['zh-CN'];
}

export function localizeArchiveDefinition(
  entry: ArchiveDefinition,
  locale: Locale,
): ArchiveDefinition {
  const localized = getArchiveLocale(locale).entries[entry.id];
  if (!localized) return entry;

  return {
    ...entry,
    title: localized.title ?? entry.title,
    subtitle: localized.subtitle ?? entry.subtitle,
    description: localized.description ?? entry.description,
    quote: localized.quote ?? entry.quote,
    chapter: localized.chapter ?? entry.chapter,
  };
}

export function computeArchiveUnlockedIds(
  stats: GameStats,
  contactStage: ContactStage,
): Set<string> {
  const unlocked = new Set<string>(stats.unlockedArchives);
  stats.memoryAnchors.forEach(anchor => unlocked.add(ANCHOR_ARCHIVE_IDS[anchor]));
  stats.endingsUnlocked.forEach(ending => unlocked.add(ending));
  unlocked.add('profile_unknown');
  if (contactStage === 'named' || contactStage === 'verified') unlocked.add('profile_named');
  if (contactStage === 'verified') unlocked.add('profile_verified');
  return unlocked;
}

export function getLocalizedArchiveEntries(
  definitions: ArchiveDefinition[],
  stats: GameStats,
  contactStage: ContactStage,
  locale: Locale,
  unlockedIds?: Iterable<string>,
): ArchiveEntry[] {
  const unlocked = unlockedIds
    ? new Set(unlockedIds)
    : computeArchiveUnlockedIds(stats, contactStage);

  return definitions
    .map(entry => ({
      ...localizeArchiveDefinition(entry, locale),
      unlocked: unlocked.has(entry.id),
    }))
    .sort((a, b) => a.order - b.order);
}

export function getArchiveCategoryLabel(category: ArchiveCategory, locale: Locale): string {
  return getArchiveLocale(locale).categories[category];
}

export function getLockedArchiveCopy(
  category: ArchiveCategory,
  locale: Locale,
): { title: string; description: string } {
  const locked = getArchiveLocale(locale).locked;
  const title =
    category === 'photo'
      ? locked.title.photo
      : category === 'ending'
        ? locked.title.ending
        : category === 'anchor'
          ? locked.title.anchor
          : locked.title.default;
  const description =
    category === 'photo'
      ? locked.description.photo
      : category === 'ending'
        ? locked.description.ending
        : locked.description.default;
  return { title, description };
}
