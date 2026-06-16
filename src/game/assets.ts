import type { ContactStage, NovaEmotion } from './types';

export const anonymousAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <radialGradient id="g" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#243449"/>
      <stop offset="100%" stop-color="#0B0E14"/>
    </radialGradient>
  </defs>
  <rect width="96" height="96" rx="48" fill="url(#g)"/>
  <circle cx="48" cy="48" r="35" fill="none" stroke="#3F5F7A" stroke-width="2" stroke-dasharray="5 6" opacity=".65"/>
  <path d="M39 39c1.5-7 7-10 13-10 7.5 0 13 5 13 12 0 6-3.5 9-8 12-3.5 2.3-5 4.5-5 8" fill="none" stroke="#8EA7BC" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="50" cy="72" r="3.8" fill="#8EA7BC"/>
  <path d="M18 30h8M70 30h8M18 66h8M70 66h8" stroke="#55728A" stroke-width="2" stroke-linecap="round" opacity=".65"/>
</svg>
`)}`;

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

export function resolveContactAvatar(
  contactStage: ContactStage,
  emotion?: NovaEmotion,
  isGlitch?: boolean,
): string {
  if (contactStage !== 'verified') return anonymousAvatar;
  return resolveNovaAvatar(emotion, isGlitch);
}
