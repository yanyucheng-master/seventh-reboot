import { storyNodeMap } from './story';
import type { DisplayMessage, NovaEmotion, SaveData } from './types';

export const SAVE_KEY = 'seventh_reboot_save';

export function saveGame(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* silent */
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    data.messages = data.messages.map(m => ({ ...m, isNew: false }));
    return data;
  } catch {
    return null;
  }
}

export function hasSaveFile(): boolean {
  return !!localStorage.getItem(SAVE_KEY);
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function getSaveTimeString(): string {
  const data = loadGame();
  if (!data) return '';
  const diffMs = Date.now() - data.timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

/** 节点处理完毕后，下次应从哪个节点继续 */
export function getPendingNodeIdAfterNode(nodeId: string): string {
  const node = storyNodeMap.get(nodeId);
  if (!node) return nodeId;
  if (node.type === 'choice' || node.type === 'end') return nodeId;
  return node.nextId ?? nodeId;
}

/** 读档时解析应继续的节点，兼容旧版 currentNodeId 存档 */
export function resolveResumeNodeId(save: SaveData): string {
  if (save.pendingNodeId) return save.pendingNodeId;

  const legacyId = save.currentNodeId;
  if (!legacyId) return 'p0';

  const node = storyNodeMap.get(legacyId);
  if (!node) return legacyId;
  if (node.type === 'choice' || node.type === 'end') return legacyId;

  const lastMsg = save.messages[save.messages.length - 1];
  if (lastMsg?.id.startsWith(`${legacyId}_`)) {
    return node.nextId ?? legacyId;
  }

  return legacyId;
}

export function createSaveData(
  pendingNodeId: string,
  messages: DisplayMessage[],
  novaEmotion: NovaEmotion,
): SaveData {
  return {
    pendingNodeId,
    messages: messages.map(m => ({ ...m, isNew: false })),
    novaEmotion,
    timestamp: Date.now(),
  };
}
