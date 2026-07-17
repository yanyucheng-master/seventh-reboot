import type { NovaBaseAvatar } from './types';

/** A null entry intentionally selects the built-in vector fallback. */
export const novaAvatarAssets: Record<NovaBaseAvatar, string | null> = {
  unknown_signal: null,
  official_navigator: '/assets/nova_avatar_official_navigator.png',
  n7_private: '/assets/nova_avatar_n7_private.png',
  white_flower: null,
};

export const novaAvatarAssetIds: Record<NovaBaseAvatar, string> = {
  unknown_signal: 'avatar_nova_unknown',
  official_navigator: 'avatar_nova_official_navigator',
  n7_private: 'avatar_nova_n7_private',
  white_flower: 'avatar_nova_white_flower',
};
