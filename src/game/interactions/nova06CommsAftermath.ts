import type { Locale } from '../../i18n';
import type { SpecialInteractionCompletion } from '../types';
import { getSpecialInteractionCopy, type SpecialInteractionCopy } from './copy';

export type Nova06CommsAftermath = {
  reactions: string[];
  replies?: Array<{ text: string; ack: string }>;
};

function wasCompletedByNova06(
  completion: SpecialInteractionCompletion,
): completion is SpecialInteractionCompletion & { completedByNova06: true } {
  return 'completedByNova06' in completion && completion.completedByNova06 === true;
}

/** 接管结束后回到通讯页时，Nova 要接上的正常发言（及可选轻量回句） */
export function resolveNova06CommsAftermath(
  completion: SpecialInteractionCompletion,
  copy: SpecialInteractionCopy,
): Nova06CommsAftermath | null {
  // memory-seal / memory-restore 没有 completedByNova06，不能直接读该字段
  if (!wasCompletedByNova06(completion)) return null;

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
