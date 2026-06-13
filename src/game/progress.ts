import type { DisplayMessage } from './types';

function formatChapterTitle(content: string): string {
  return content.replace(/[：:]/, ' · ');
}

function progressFromNodeId(nodeId: string): string {
  if (/^p\d|^p_/.test(nodeId)) return '序章 · 未知通讯';
  if (nodeId === 'CH1_START' || nodeId.startsWith('ch1_')) return '第一章 · 连接';
  if (nodeId === 'CH2_START' || nodeId.startsWith('ch2_')) return '第二章 · 日常';
  if (nodeId === 'CH3_START' || nodeId.startsWith('ch3_')) return '第三章 · 异常';
  if (nodeId === 'CH4_START' || nodeId.startsWith('ch4_')) return '第四章 · 记忆';
  if (nodeId === 'CH5A_START' || nodeId.startsWith('ch5a_')) return '第五章 · 真相（上）';
  if (nodeId === 'CH5B_START' || nodeId.startsWith('ch5b_')) return '第五章 · 真相（下）';
  if (nodeId === 'FINALE_START' || nodeId.startsWith('fin_')) return '终章 · 第七次重启';
  if (nodeId === 'NORMAL_END_START' || nodeId.startsWith('normal_')) return '普通结局 · 循环之外';
  if (nodeId === 'BAD_END_START' || nodeId.startsWith('bad_')) return '坏结局 · 第八次重启';
  return '序章 · 未知通讯';
}

export function getSaveProgressLabel(pendingNodeId: string, messages: DisplayMessage[] = []): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === 'chapter' && msg.content) {
      return formatChapterTitle(msg.content);
    }
  }
  return progressFromNodeId(pendingNodeId);
}
