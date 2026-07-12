import { storyNodeMap } from './story';
import type {
  ContactStage,
  DisplayMessage,
  EndingId,
  EndingType,
  FinalChoice,
  FinalFarewellTone,
  FinalFarewellVariant,
  GameStats,
  MemoryAnchorId,
  NovaEmotion,
  PowerRoutingResult,
  SaveData,
  SealableMemoryAnchor,
  SignalSeparationResult,
  TimedProof,
  TimedResponse,
} from './types';

export const SAVE_KEY = 'seventh_reboot_save';
/** 剧情分支拓扑版本；变更选项 nextId 后递增，使旧 localStorage 存档失效 */
export const STORY_VERSION = 'V1.0';
export const STORY_CONTENT_VERSION = 'v1.0-special-interactions-20260711';
export const defaultContactStage: ContactStage = 'unknown';

export const defaultStats: GameStats = {
  trust: 0,
  memory: 0,
  attachment: 0,
  memoryAnchors: [],
  acceptFarewell: false,
  unlockedArchives: [],
  endingsUnlocked: [],
  criticalLogUnlocked: false,
  signalCurrentNovaRecovered: false,
  signalNova06Recovered: false,
  signalCoreTelemetryRecovered: false,
  timelineAlignmentCompleted: false,
  temporaryAnchorRestored: false,
  nova06FirstOverrideSeen: false,
  passwordBypassedByNova06: false,
  signalCompletedByNova06: false,
  timelineCompletedByNova06: false,
  powerCompletedByNova06: false,
};

/** 完整黑入演出的会话级标记；防止刷新后（存档仍在接管前）重复播放重度演出 */
export const NOVA06_FX_SEEN_KEY = 'seventh_reboot_nova06_fx_seen';

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
const FINAL_FAREWELL_TONES = new Set<FinalFarewellTone>([
  'warm_acceptance',
  'painful_truth',
  'uncertain_but_honest',
]);
const TIMED_RESPONSES = new Set<TimedResponse>(['calm_nova', 'investigate_log']);
const TIMED_PROOFS = new Set<TimedProof>(['n7_core_anchor']);
const ENDING_TYPES = new Set<EndingType>(['true', 'normal', 'bad']);
const SIGNAL_SEPARATION_RESULTS = new Set<SignalSeparationResult>(['clean', 'assisted']);
const POWER_ROUTING_RESULTS = new Set<PowerRoutingResult>(['excellent', 'stable', 'emergency_assist']);
const SEALABLE_MEMORY_ANCHORS = new Set<SealableMemoryAnchor>([
  'maintenance_board',
  'white_flower',
  'goodnight',
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

function normalizeFinalFarewellTone(value: unknown): FinalFarewellTone | undefined {
  return typeof value === 'string' && FINAL_FAREWELL_TONES.has(value as FinalFarewellTone)
    ? value as FinalFarewellTone
    : undefined;
}

function normalizeTimedResponse(value: unknown): TimedResponse | undefined {
  return typeof value === 'string' && TIMED_RESPONSES.has(value as TimedResponse)
    ? value as TimedResponse
    : undefined;
}

function normalizeTimedProof(value: unknown): TimedProof | undefined {
  return typeof value === 'string' && TIMED_PROOFS.has(value as TimedProof)
    ? value as TimedProof
    : undefined;
}

function normalizeEndingType(value: unknown): EndingType | undefined {
  return typeof value === 'string' && ENDING_TYPES.has(value as EndingType) ? value as EndingType : undefined;
}

function normalizeSignalSeparationResult(value: unknown): SignalSeparationResult | undefined {
  return typeof value === 'string' && SIGNAL_SEPARATION_RESULTS.has(value as SignalSeparationResult)
    ? value as SignalSeparationResult
    : undefined;
}

function normalizePowerRoutingResult(value: unknown): PowerRoutingResult | undefined {
  return typeof value === 'string' && POWER_ROUTING_RESULTS.has(value as PowerRoutingResult)
    ? value as PowerRoutingResult
    : undefined;
}

function normalizeSealableMemoryAnchor(value: unknown): SealableMemoryAnchor | undefined {
  return typeof value === 'string' && SEALABLE_MEMORY_ANCHORS.has(value as SealableMemoryAnchor)
    ? value as SealableMemoryAnchor
    : undefined;
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
    criticalLogUnlocked: stats.criticalLogUnlocked === true,
    signalCurrentNovaRecovered: stats.signalCurrentNovaRecovered === true,
    signalNova06Recovered: stats.signalNova06Recovered === true,
    signalCoreTelemetryRecovered: stats.signalCoreTelemetryRecovered === true,
    timelineAlignmentCompleted: stats.timelineAlignmentCompleted === true,
    temporaryAnchorRestored: stats.temporaryAnchorRestored === true,
    nova06FirstOverrideSeen: stats.nova06FirstOverrideSeen === true,
    passwordBypassedByNova06: stats.passwordBypassedByNova06 === true,
    signalCompletedByNova06: stats.signalCompletedByNova06 === true,
    timelineCompletedByNova06: stats.timelineCompletedByNova06 === true,
    powerCompletedByNova06: stats.powerCompletedByNova06 === true,
  };

  const finalChoice = normalizeFinalChoice(stats.finalChoice);
  const finalFarewellVariant = normalizeFinalFarewellVariant(stats.finalFarewellVariant);
  const finalFarewellTone = normalizeFinalFarewellTone(stats.finalFarewellTone);
  const timedResponse = normalizeTimedResponse(stats.timedResponse);
  const timedProof = normalizeTimedProof(stats.timedProof);
  const ending = normalizeEndingType(stats.ending);
  const signalSeparationResult = normalizeSignalSeparationResult(stats.signalSeparationResult);
  const powerRoutingResult = normalizePowerRoutingResult(stats.powerRoutingResult);
  const temporaryAnchorSealed = normalizeSealableMemoryAnchor(stats.temporaryAnchorSealed);
  if (finalChoice) normalized.finalChoice = finalChoice;
  if (finalFarewellVariant) normalized.finalFarewellVariant = finalFarewellVariant;
  if (finalFarewellTone) normalized.finalFarewellTone = finalFarewellTone;
  if (timedResponse) normalized.timedResponse = timedResponse;
  if (timedProof) normalized.timedProof = timedProof;
  if (ending) normalized.ending = ending;
  if (signalSeparationResult) normalized.signalSeparationResult = signalSeparationResult;
  if (powerRoutingResult) normalized.powerRoutingResult = powerRoutingResult;
  if (temporaryAnchorSealed) normalized.temporaryAnchorSealed = temporaryAnchorSealed;
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
  if (stats.finalFarewellTone !== undefined && typeof stats.finalFarewellTone !== 'string') return false;
  if (stats.timedResponse !== undefined && typeof stats.timedResponse !== 'string') return false;
  if (stats.timedProof !== undefined && typeof stats.timedProof !== 'string') return false;
  if (stats.ending !== undefined && typeof stats.ending !== 'string') return false;
  if (stats.unlockedArchives !== undefined && !Array.isArray(stats.unlockedArchives)) return false;
  if (stats.endingsUnlocked !== undefined && !Array.isArray(stats.endingsUnlocked)) return false;
  if (stats.criticalLogUnlocked !== undefined && typeof stats.criticalLogUnlocked !== 'boolean') return false;
  if (stats.signalSeparationResult !== undefined && typeof stats.signalSeparationResult !== 'string') return false;
  if (stats.signalCurrentNovaRecovered !== undefined && typeof stats.signalCurrentNovaRecovered !== 'boolean') return false;
  if (stats.signalNova06Recovered !== undefined && typeof stats.signalNova06Recovered !== 'boolean') return false;
  if (stats.signalCoreTelemetryRecovered !== undefined && typeof stats.signalCoreTelemetryRecovered !== 'boolean') return false;
  if (stats.timelineAlignmentCompleted !== undefined && typeof stats.timelineAlignmentCompleted !== 'boolean') return false;
  if (stats.powerRoutingResult !== undefined && typeof stats.powerRoutingResult !== 'string') return false;
  if (stats.temporaryAnchorSealed !== undefined && typeof stats.temporaryAnchorSealed !== 'string') return false;
  if (stats.temporaryAnchorRestored !== undefined && typeof stats.temporaryAnchorRestored !== 'boolean') return false;
  if (stats.nova06FirstOverrideSeen !== undefined && typeof stats.nova06FirstOverrideSeen !== 'boolean') return false;
  if (stats.passwordBypassedByNova06 !== undefined && typeof stats.passwordBypassedByNova06 !== 'boolean') return false;
  if (stats.signalCompletedByNova06 !== undefined && typeof stats.signalCompletedByNova06 !== 'boolean') return false;
  if (stats.timelineCompletedByNova06 !== undefined && typeof stats.timelineCompletedByNova06 !== 'boolean') return false;
  if (stats.powerCompletedByNova06 !== undefined && typeof stats.powerCompletedByNova06 !== 'boolean') return false;
  if (typeof save.timestamp !== 'number') return false;
  if (save.storyVersion !== STORY_VERSION) return false;
  if (save.storyContentVersion !== STORY_CONTENT_VERSION) return false;
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
  try {
    localStorage.removeItem(NOVA06_FX_SEEN_KEY);
  } catch {
    /* silent */
  }
}

export function getSaveTimeString(
  t?: (key: string, params?: Record<string, string | number>) => string,
): string {
  const data = loadGame();
  if (!data) return '';
  const diffMs = Date.now() - data.timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t ? t('saveTime.justNow') : '刚刚';
  if (mins < 60) {
    return t ? t('saveTime.minutesAgo', { minutes: mins }) : `${mins}分钟前`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return t ? t('saveTime.hoursAgo', { hours }) : `${hours}小时前`;
  }
  const days = Math.floor(hours / 24);
  return t ? t('saveTime.daysAgo', { days }) : `${days}天前`;
}

/** 节点处理完毕后，下次应从哪个节点继续 */
export function getPendingNodeIdAfterNode(nodeId: string): string {
  const node = storyNodeMap.get(nodeId);
  if (!node) return nodeId;
  if (node.type === 'choice' || node.type === 'input' || node.type === 'interaction' || node.type === 'end') return nodeId;
  return node.nextId ?? nodeId;
}

/** 读档时解析应继续的节点，兼容旧版 currentNodeId 存档 */
export function resolveResumeNodeId(save: SaveData): string {
  if (save.pendingNodeId) return save.pendingNodeId;

  const legacyId = save.currentNodeId;
  if (!legacyId) return 'p0';

  const node = storyNodeMap.get(legacyId);
  if (!node) return legacyId;
  if (node.type === 'choice' || node.type === 'input' || node.type === 'interaction' || node.type === 'end') return legacyId;

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
    storyContentVersion: STORY_CONTENT_VERSION,
    timestamp: Date.now(),
  };
}
