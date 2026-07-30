import type { DisplayMessage } from './types';

function formatChapterTitle(content: string): string {
  return content.replace(/[：:]/, ' · ');
}

type Translate = (key: string) => string;

function progressFromNodeId(nodeId: string, t?: Translate): string {
  const key = (() => {
    if (/^p\d|^p_/.test(nodeId)) return 'progress.prologue';
    if (nodeId.startsWith('CH01-')) return 'progress.chapter1';
    if (nodeId.startsWith('CH02-')) return 'progress.chapter2';
    if (nodeId.startsWith('CH03-')) return 'progress.chapter3';
    if (nodeId.startsWith('CH04-')) return 'progress.chapter4';
    if (nodeId.startsWith('CH05A-')) return 'progress.chapter5a';
    if (nodeId.startsWith('CH05B-')) return 'progress.chapter5b';
    if (nodeId.startsWith('FIN-') || nodeId.startsWith('END-T-')) return 'progress.finale';
    if (nodeId.startsWith('END-N-')) return 'progress.normalEnd';
    if (nodeId.startsWith('END-B-')) return 'progress.badEnd';
    return 'progress.prologue';
  })();
  return t ? t(key) : key;
}

export function getSaveProgressLabel(
  pendingNodeId: string,
  messages: DisplayMessage[] = [],
  t?: Translate,
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === 'chapter' && msg.content) {
      return formatChapterTitle(msg.content);
    }
  }
  return progressFromNodeId(pendingNodeId, t);
}
