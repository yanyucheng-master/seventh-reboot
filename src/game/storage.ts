import { storyNodeMap } from './story';
import type { DisplayMessage, GameStats, MemoryAnchorId, NovaEmotion, SaveData } from './types';

export const SAVE_KEY = 'seventh_reboot_save';

export const defaultStats: GameStats = {
  trust: 0,
  memory: 0,
  attachment: 0,
  memoryAnchors: [],
  acceptFarewell: false,
};

const MEMORY_ANCHOR_IDS = new Set<MemoryAnchorId>([
  'n7',
  'milk_candy',
  'white_flower',
  'first_message',
  'goodnight',
  'observatory',
  'maintenance_board',
  'steak',
]);

const LEGACY_ANCHORS: Record<string, MemoryAnchorId | undefined> = {
  n7: 'n7',
  candy: 'milk_candy',
  flower: 'white_flower',
  firstMessage: 'first_message',
  goodnight: 'goodnight',
};

function normalizeMemoryAnchors(value: unknown): MemoryAnchorId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map(anchor => {
        if (typeof anchor !== 'string') return undefined;
        if (MEMORY_ANCHOR_IDS.has(anchor as MemoryAnchorId)) return anchor as MemoryAnchorId;
        return LEGACY_ANCHORS[anchor];
      })
      .filter((anchor): anchor is MemoryAnchorId => Boolean(anchor)),
  )];
}

export function normalizeGameStats(value: unknown): GameStats {
  const stats = value && typeof value === 'object' ? value as Partial<GameStats> : {};
  const memoryAnchors = normalizeMemoryAnchors(stats.memoryAnchors);
  return {
    trust: typeof stats.trust === 'number' ? stats.trust : defaultStats.trust,
    memory: typeof stats.memory === 'number' ? stats.memory : defaultStats.memory,
    attachment: typeof stats.attachment === 'number' ? stats.attachment : defaultStats.attachment,
    memoryAnchors,
    acceptFarewell: typeof stats.acceptFarewell === 'boolean' ? stats.acceptFarewell : defaultStats.acceptFarewell,
  };
}

export function saveGame(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* silent */
  }
}

function isValidSaveData(data: unknown): data is SaveData {
  if (!data || typeof data !== 'object') return false;
  const save = data as Partial<SaveData>;
  if (typeof save.pendingNodeId !== 'string') return false;
  if (!Array.isArray(save.messages)) return false;
  if (typeof save.novaEmotion !== 'string') return false;
  if (!save.stats || typeof save.stats !== 'object') return false;
  const stats = save.stats as Partial<GameStats>;
  if (typeof stats.trust !== 'number') return false;
  if (typeof stats.attachment !== 'number') return false;
  if (stats.memory !== undefined && typeof stats.memory !== 'number') return false;
  if (stats.memoryAnchors !== undefined && !Array.isArray(stats.memoryAnchors)) return false;
  if (stats.acceptFarewell !== undefined && typeof stats.acceptFarewell !== 'boolean') return false;
  if (typeof save.timestamp !== 'number') return false;
  return true;
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidSaveData(parsed)) return null;
    const data = parsed;
    const messageIds = new Set<string>();
    data.messages = data.messages
      .filter(message => {
        if (messageIds.has(message.id)) return false;
        messageIds.add(message.id);
        return true;
      })
      .map(m => ({ ...m, isNew: false }));
    data.stats = normalizeGameStats(data.stats);
    return data;
  } catch {
    return null;
  }
}

export function hasSaveFile(): boolean {
  return loadGame() !== null;
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
  stats: GameStats,
): SaveData {
  return {
    pendingNodeId,
    messages: messages.map(m => ({ ...m, isNew: false })),
    novaEmotion,
    stats,
    timestamp: Date.now(),
  };
}
