import type { Locale } from '../../i18n';
import type { SpecialInteractionCompletion } from '../types';
import { getSpecialInteractionCopy, type SpecialInteractionCopy } from './copy';

export type Nova06CommsAftermath = {
  reactions: string[];
  replies?: Array<{ text: string; ack: string }>;
};

/** 接管结束后回到通讯页时，Nova 要接上的正常发言（及可选轻量回句） */
export function resolveNova06CommsAftermath(
  completion: SpecialInteractionCompletion,
  copy: SpecialInteractionCopy,
): Nova06CommsAftermath | null {
  if (!completion.completedByNova06) return null;

  switch (completion.kind) {
    case 'critical-log-password':
      return {
        reactions: copy.password.override.novaReactions,
        replies: copy.password.override.replies.map(item => ({
          text: item.text,
          ack: item.ack,
        })),
      };
    case 'signal-separation':
      return {
        reactions: copy.signal.override.novaReactions,
        replies: copy.signal.override.replies.map(item => ({
          text: item.text,
          ack: item.ack,
        })),
      };
    case 'power-routing':
      return {
        reactions: copy.power.override.novaReactions,
      };
    default:
      return null;
  }
}

export function getNova06CommsAftermath(
  completion: SpecialInteractionCompletion,
  locale: Locale,
): Nova06CommsAftermath | null {
  return resolveNova06CommsAftermath(completion, getSpecialInteractionCopy(locale));
}

export const NOVA06_BRIDGE_CHOICE_PREFIX = '__nova06_bridge_';
