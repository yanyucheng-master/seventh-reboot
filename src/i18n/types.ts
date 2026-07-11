export type Locale = 'zh-CN' | 'en-US';

export const DEFAULT_LOCALE: Locale = 'zh-CN';
export const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en-US'];

export type StoryLocaleChoiceMap = Record<string, string>;

export type StoryLocaleNode = {
  content?: string;
  choices?: StoryLocaleChoiceMap;
};

export type StoryLocaleData = {
  version?: string;
  nodes: Record<string, StoryLocaleNode>;
};

export type UiDictionaryValue = string | { [key: string]: UiDictionaryValue };
export type UiDictionary = { [key: string]: UiDictionaryValue };
