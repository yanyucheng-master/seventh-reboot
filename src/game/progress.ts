import type { DisplayMessage } from './types';

function formatChapterTitle(content: string): string {
  return content.replace(/[：:]/, ' · ');
}

type Translate = (key: string) => string;

function progressFromNodeId(nodeId: string, t?: Translate): string {
  const key = (() => {
    if (/^p\d|^p_/.test(nodeId)) return 'progress.prologue';
    if (nodeId === 'CH1_START' || nodeId.startsWith('ch1_')) return 'progress.chapter1';
    if (nodeId === 'CH2_START' || nodeId.startsWith('ch2_')) return 'progress.chapter2';
    if (nodeId === 'CH3_START' || nodeId.startsWith('ch3_')) return 'progress.chapter3';
    if (nodeId === 'CH4_START' || nodeId.startsWith('ch4_')) return 'progress.chapter4';
    if (nodeId === 'CH5A_START' || nodeId.startsWith('ch5a_')) return 'progress.chapter5a';
    if (nodeId === 'CH5B_START' || nodeId.startsWith('ch5b_')) return 'progress.chapter5b';
    if (nodeId === 'FINALE_START' || nodeId.startsWith('fin_')) return 'progress.finale';
    if (nodeId === 'NORMAL_END_START' || nodeId.startsWith('normal_')) return 'progress.normalEnd';
    if (nodeId === 'BAD_END_START' || nodeId.startsWith('bad_')) return 'progress.badEnd';
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
