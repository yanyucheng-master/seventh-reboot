import type { NovaBaseAvatar } from './types';

/**
 * Formal art drops into this map later. A null entry intentionally selects the
 * built-in vector placeholder, so missing art can never show a broken image.
 */
export const novaAvatarAssets: Record<NovaBaseAvatar, string | null> = {
  unknown_signal: null,
  official_navigator: null,
  n7_private: null,
  white_flower: null,
};

export const novaAvatarAssetIds: Record<NovaBaseAvatar, string> = {
  unknown_signal: 'avatar_nova_unknown',
  official_navigator: 'avatar_nova_official_navigator',
  n7_private: 'avatar_nova_n7_private',
  white_flower: 'avatar_nova_white_flower',
};
