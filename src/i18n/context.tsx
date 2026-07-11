import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { storyNodeMap as baseStoryNodeMap, type StoryNode } from '../game/story';
import { getStoredLocale, setStoredLocale } from './localeStorage';
import { createLocalizedStoryNodeMap } from './storyResolver';
import type { Locale, UiDictionary } from './types';
import uiZh from './locales/zh-CN/ui.json';
import uiEn from './locales/en-US/ui.json';

const UI_BY_LOCALE: Record<Locale, UiDictionary> = {
  'zh-CN': uiZh as UiDictionary,
  'en-US': uiEn as UiDictionary,
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  storyNodeMap: Map<string, StoryNode>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveUiValue(dict: UiDictionary, key: string): string | undefined {
  const parts = key.split('.');
  let current: string | UiDictionary | undefined = dict;
  for (const part of parts) {
    if (!current || typeof current === 'string') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  const setLocale = useCallback((next: Locale) => {
    setStoredLocale(next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const value =
        resolveUiValue(UI_BY_LOCALE[locale], key) ??
        resolveUiValue(UI_BY_LOCALE['zh-CN'], key) ??
        key;
      return interpolate(value, params);
    },
    [locale],
  );

  const storyNodeMap = useMemo(
    () => createLocalizedStoryNodeMap(baseStoryNodeMap, locale),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, storyNodeMap }),
    [locale, setLocale, t, storyNodeMap],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- provider and hook form one public i18n API
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
