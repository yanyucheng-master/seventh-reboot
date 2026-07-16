import type { DisplayMessage } from './types';

function cleanChatLine(line: string): string {
  const trailingSpace = line.match(/\s*$/)?.[0] ?? '';
  let body = line.slice(0, line.length - trailingSpace.length);
  body = body.replace(/\.\.\./g, '……');
  body = body.replace(/。([”"』）】]*)$/u, '$1');
  body = body.replace(/\.([”"』）】]*)$/u, '$1');
  return `${body}${trailingSpace}`;
}

/** Make chat bubbles feel like actual messages, while leaving system/file text untouched. */
export function cleanChatText(text: string): string {
  return text.split('\n').map(cleanChatLine).join('\n');
}

/** Strip decorative brackets from choice / player reply text for display. */
export function formatChoiceText(text: string): string {
  const trimmed = text.trim();
  const wrapped = trimmed.match(/^【(.+)】$/);
  const content = wrapped ? wrapped[1] : trimmed.replace(/[【】]/g, '');
  return cleanChatText(content);
}

const NOVA_BUBBLE_TYPES = new Set(['text', 'image', 'glitch']);

export function shouldShowNovaAvatar(messages: DisplayMessage[], index: number): boolean {
  const msg = messages[index];
  if (msg.speaker !== 'nova' || !NOVA_BUBBLE_TYPES.has(msg.type)) return false;

  const previous = messages[index - 1];
  if (!(previous?.speaker === 'nova' && NOVA_BUBBLE_TYPES.has(previous.type))) return true;
  return previous.displayName !== msg.displayName || previous.speakerIdentity !== msg.speakerIdentity;
}

export function shouldShowTypingAvatar(messages: DisplayMessage[]): boolean {
  const last = messages[messages.length - 1];
  if (!last) return true;
  return !(last.speaker === 'nova' && NOVA_BUBBLE_TYPES.has(last.type));
}
