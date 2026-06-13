import type { DisplayMessage } from './types';

/** Strip decorative brackets from choice / player reply text for display. */
export function formatChoiceText(text: string): string {
  const trimmed = text.trim();
  const wrapped = trimmed.match(/^【(.+)】$/);
  if (wrapped) return wrapped[1];
  return trimmed.replace(/[【】]/g, '');
}

const NOVA_BUBBLE_TYPES = new Set(['text', 'image', 'glitch']);

export function shouldShowNovaAvatar(messages: DisplayMessage[], index: number): boolean {
  const msg = messages[index];
  if (msg.speaker !== 'nova' || !NOVA_BUBBLE_TYPES.has(msg.type)) return false;

  const previous = messages[index - 1];
  return !(previous?.speaker === 'nova' && NOVA_BUBBLE_TYPES.has(previous.type));
}

export function shouldShowTypingAvatar(messages: DisplayMessage[]): boolean {
  const last = messages[messages.length - 1];
  if (!last) return true;
  return !(last.speaker === 'nova' && NOVA_BUBBLE_TYPES.has(last.type));
}
