import { storyNodeMap } from './story';
import type {
  ContactStage,
  DisplayMessage,
  EndingId,
  EndingType,
  FinalChoice,
  FinalFarewellVariant,
  GameStats,
  MemoryAnchorId,
  NovaEmotion,
  SaveData,
} from './types';

export const SAVE_KEY = 'seventh_reboot_save';
/** 剧情分支拓扑版本；变更选项 nextId 后递增，使旧 localStorage 存档失效 */
export const STORY_VERSION = '1.0.1';
export const defaultContactStage: ContactStage = 'unknown';

export const defaultStats: GameStats = {
  trust: 0,
  memory: 0,
  attachment: 0,
  memoryAnchors: [],
  acceptFarewell: false,
  unlockedArchives: [],
  endingsUnlocked: [],
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

const CONTACT_STAGES = new Set<ContactStage>(['unknown', 'named', 'verified']);
const ENDING_IDS = new Set<EndingId>(['ending_true', 'ending_normal', 'ending_bad']);
const FINAL_CHOICES = new Set<FinalChoice>(['accept_farewell', 'refuse_farewell']);
const FINAL_FAREWELL_VARIANTS = new Set<FinalFarewellVariant>([
  'remembered_until_end',
  'remembered_wrong',
  'forgetting_started',
]);
const ENDING_TYPES = new Set<EndingType>(['true', 'normal', 'bad']);

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

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))];
}

function normalizeEndings(value: unknown): EndingId[] {
  return normalizeStringList(value).filter((ending): ending is EndingId => ENDING_IDS.has(ending as EndingId));
}

function normalizeFinalChoice(value: unknown): FinalChoice | undefined {
  return typeof value === 'string' && FINAL_CHOICES.has(value as FinalChoice) ? value as FinalChoice : undefined;
}

function normalizeFinalFarewellVariant(value: unknown): FinalFarewellVariant | undefined {
  return typeof value === 'string' && FINAL_FAREWELL_VARIANTS.has(value as FinalFarewellVariant)
    ? value as FinalFarewellVariant
    : undefined;
}

function normalizeEndingType(value: unknown): EndingType | undefined {
  return typeof value === 'string' && ENDING_TYPES.has(value as EndingType) ? value as EndingType : undefined;
}

export function normalizeGameStats(value: unknown): GameStats {
  const stats = value && typeof value === 'object' ? value as Partial<GameStats> : {};
  const memoryAnchors = normalizeMemoryAnchors(stats.memoryAnchors);
  const normalized: GameStats = {
    trust: clampStat(typeof stats.trust === 'number' ? stats.trust : defaultStats.trust),
    memory: clampStat(typeof stats.memory === 'number' ? stats.memory : defaultStats.memory),
    attachment: clampStat(typeof stats.attachment === 'number' ? stats.attachment : defaultStats.attachment),
    memoryAnchors,
    acceptFarewell: typeof stats.acceptFarewell === 'boolean' ? stats.acceptFarewell : defaultStats.acceptFarewell,
    unlockedArchives: normalizeStringList(stats.unlockedArchives),
    endingsUnlocked: normalizeEndings(stats.endingsUnlocked),
  };

  const finalChoice = normalizeFinalChoice(stats.finalChoice);
  const finalFarewellVariant = normalizeFinalFarewellVariant(stats.finalFarewellVariant);
  const ending = normalizeEndingType(stats.ending);
  if (finalChoice) normalized.finalChoice = finalChoice;
  if (finalFarewellVariant) normalized.finalFarewellVariant = finalFarewellVariant;
  if (ending) normalized.ending = ending;
  return normalized;
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(6, value));
}

export function normalizeContactStage(value: unknown): ContactStage {
  if (typeof value === 'string' && CONTACT_STAGES.has(value as ContactStage)) {
    return value as ContactStage;
  }
  return defaultContactStage;
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
  if (save.contactStage !== undefined && typeof save.contactStage !== 'string') return false;
  const stats = save.stats as Partial<GameStats>;
  if (typeof stats.trust !== 'number') return false;
  if (typeof stats.attachment !== 'number') return false;
  if (stats.memory !== undefined && typeof stats.memory !== 'number') return false;
  if (stats.memoryAnchors !== undefined && !Array.isArray(stats.memoryAnchors)) return false;
  if (stats.acceptFarewell !== undefined && typeof stats.acceptFarewell !== 'boolean') return false;
  if (stats.finalChoice !== undefined && typeof stats.finalChoice !== 'string') return false;
  if (stats.finalFarewellVariant !== undefined && typeof stats.finalFarewellVariant !== 'string') return false;
  if (stats.ending !== undefined && typeof stats.ending !== 'string') return false;
  if (stats.unlockedArchives !== undefined && !Array.isArray(stats.unlockedArchives)) return false;
  if (stats.endingsUnlocked !== undefined && !Array.isArray(stats.endingsUnlocked)) return false;
  if (typeof save.timestamp !== 'number') return false;
  if (save.storyVersion !== STORY_VERSION) return false;
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
      .map(m => ({ ...m, contactStage: normalizeContactStage(m.contactStage), isNew: false }));
    data.contactStage = normalizeContactStage(data.contactStage);
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
  contactStage: ContactStage,
  stats: GameStats,
): SaveData {
  return {
    pendingNodeId,
    messages: messages.map(m => ({ ...m, isNew: false })),
    novaEmotion,
    contactStage,
    stats,
    storyVersion: STORY_VERSION,
    timestamp: Date.now(),
  };
}
