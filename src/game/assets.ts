import type { NovaEmotion } from './types';

export const novaAvatar: Record<NovaEmotion, string> = {
  normal: '/assets/nova_normal.png',
  smile: '/assets/nova_smile.png',
  sad: '/assets/nova_sad.png',
  glitch: '/assets/nova_glitch.png',
};

export function resolveNovaAvatar(emotion?: NovaEmotion, isGlitch?: boolean): string {
  if (isGlitch) return novaAvatar.glitch;
  return novaAvatar[emotion ?? 'normal'] ?? novaAvatar.normal;
}
