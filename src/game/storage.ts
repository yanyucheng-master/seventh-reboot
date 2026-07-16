import { storyNodeMap } from './story';
import { migrateNovaAvatarState, normalizeNovaAvatarState } from './avatarState';
import {
  createDefaultChatDeliveryRuntime,
  migrateDeliveryState,
  normalizeChatDeliveryRuntime,
} from './delivery/state';
import type {
  ChatDeliveryRuntime,
  ContactStage,
  DisplayMessage,
  EndingId,
  EndingType,
  FinalChoice,
  FinalFarewellTone,
  FinalFarewellVariant,
  GameStats,
  MemoryAnchorId,
  NovaAvatarStoryState,
  NovaHintStage,
  PowerRoutingResult,
  SaveData,
  SealableMemoryAnchor,
  SignalSeparationResult,
  SpecialInteractionKind,
  TimedProof,
  TimedResponse,
} from './types';

export const SAVE_KEY = 'seventh_reboot_save';
export const PERSISTENT_PROGRESS_KEY = 'seventh_reboot_persistent_progress';
/** 剧情分支拓扑版本；变更选项 nextId 后递增，使旧 localStorage 存档失效 */
export const STORY_VERSION = 'V1.0';
export const STORY_CONTENT_VERSION = 'v1.0-delivery-state-v1-20260716';
export const defaultContactStage: ContactStage = 'unknown';

export const defaultStats: GameStats = {
  trust: 0,
  memory: 0,
  attachment: 0,
  memoryAnchors: [],
  acceptFarewell: false,
  unlockedArchives: [],
  endingsUnlocked: [],
  commemorativeArchiveSaved: false,
  criticalLogUnlocked: false,
  signalCurrentNovaRecovered: false,
  signalNova06Recovered: false,
  signalCoreTelemetryRecovered: false,
  timelineAlignmentCompleted: false,
  temporaryAnchorRestored: false,
  nova06FirstOverrideSeen: false,
  novaHintStage: 0,
  nova06OverrideTriggered: false,
  passwordBypassedByNova06: false,
  signalCompletedByNova06: false,
  timelineCompletedByNova06: false,
  powerCompletedByNova06: false,
  memoryNova06NoteSeen: false,
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
const SPECIAL_INTERACTION_KINDS = new Set<SpecialInteractionKind>([
  'critical-log-password',
  'signal-separation',
  'power-routing',
  'memory-seal',
  'memory-restore',
]);
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

function normalizeNovaHintStage(value: unknown): NovaHintStage {
  return value === 1 || value === 2 || value === 3 ? value : 0;
}

function normalizeSpecialInteractionKind(value: unknown): SpecialInteractionKind | undefined {
  return typeof value === 'string' && SPECIAL_INTERACTION_KINDS.has(value as SpecialInteractionKind)
    ? value as SpecialInteractionKind
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
    commemorativeArchiveSaved: stats.commemorativeArchiveSaved === true,
    criticalLogUnlocked: stats.criticalLogUnlocked === true,
    signalCurrentNovaRecovered: stats.signalCurrentNovaRecovered === true,
    signalNova06Recovered: stats.signalNova06Recovered === true,
    signalCoreTelemetryRecovered: stats.signalCoreTelemetryRecovered === true,
    timelineAlignmentCompleted: stats.timelineAlignmentCompleted === true,
    temporaryAnchorRestored: stats.temporaryAnchorRestored === true,
    nova06FirstOverrideSeen: stats.nova06FirstOverrideSeen === true,
    novaHintStage: normalizeNovaHintStage(stats.novaHintStage),
    nova06OverrideTriggered: stats.nova06OverrideTriggered === true,
    passwordBypassedByNova06: stats.passwordBypassedByNova06 === true,
    signalCompletedByNova06: stats.signalCompletedByNova06 === true,
    timelineCompletedByNova06: stats.timelineCompletedByNova06 === true,
    powerCompletedByNova06: stats.powerCompletedByNova06 === true,
    memoryNova06NoteSeen: stats.memoryNova06NoteSeen === true,
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
  const novaHintInteractionKind = normalizeSpecialInteractionKind(stats.novaHintInteractionKind);
  if (finalChoice) normalized.finalChoice = finalChoice;
  if (finalFarewellVariant) normalized.finalFarewellVariant = finalFarewellVariant;
  if (finalFarewellTone) normalized.finalFarewellTone = finalFarewellTone;
  if (timedResponse) normalized.timedResponse = timedResponse;
  if (timedProof) normalized.timedProof = timedProof;
  if (ending) normalized.ending = ending;
  if (signalSeparationResult) normalized.signalSeparationResult = signalSeparationResult;
  if (powerRoutingResult) normalized.powerRoutingResult = powerRoutingResult;
  if (temporaryAnchorSealed) normalized.temporaryAnchorSealed = temporaryAnchorSealed;
  if (novaHintInteractionKind) normalized.novaHintInteractionKind = novaHintInteractionKind;
  return normalized;
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(6, value));
}

export type PersistentProgress = {
  version: 1;
  unlockedArchives: string[];
  endingsUnlocked: EndingId[];
  commemorativeArchiveSaved: boolean;
};

const EMPTY_PERSISTENT_PROGRESS: PersistentProgress = {
  version: 1,
  unlockedArchives: [],
  endingsUnlocked: [],
  commemorativeArchiveSaved: false,
};

export function loadPersistentProgress(): PersistentProgress {
  try {
    const raw = localStorage.getItem(PERSISTENT_PROGRESS_KEY);
    if (!raw) return { ...EMPTY_PERSISTENT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<PersistentProgress>;
    return {
      version: 1,
      unlockedArchives: normalizeStringList(parsed.unlockedArchives),
      endingsUnlocked: normalizeEndings(parsed.endingsUnlocked),
      commemorativeArchiveSaved: parsed.commemorativeArchiveSaved === true,
    };
  } catch {
    return { ...EMPTY_PERSISTENT_PROGRESS };
  }
}

function savePersistentProgress(progress: PersistentProgress): void {
  try {
    localStorage.setItem(PERSISTENT_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* silent */
  }
}

function mergeStatsWithPersistentProgress(stats: GameStats): GameStats {
  const progress = loadPersistentProgress();
  return {
    ...stats,
    unlockedArchives: [...new Set([
      ...progress.unlockedArchives,
      ...progress.endingsUnlocked,
      ...stats.unlockedArchives,
      ...stats.endingsUnlocked,
    ])],
    endingsUnlocked: [...new Set([...progress.endingsUnlocked, ...stats.endingsUnlocked])],
    commemorativeArchiveSaved:
      progress.commemorativeArchiveSaved || stats.commemorativeArchiveSaved,
  };
}

function persistProgressFromStats(stats: GameStats): void {
  const merged = mergeStatsWithPersistentProgress(stats);
  savePersistentProgress({
    version: 1,
    unlockedArchives: merged.unlockedArchives,
    endingsUnlocked: merged.endingsUnlocked,
    commemorativeArchiveSaved: merged.commemorativeArchiveSaved,
  });
}

/** Starts a clean run while retaining the player's recovered archive collection. */
export function createNewGameStats(): GameStats {
  return mergeStatsWithPersistentProgress({
    ...defaultStats,
    memoryAnchors: [],
    unlockedArchives: [],
    endingsUnlocked: [],
  });
}

export function normalizeContactStage(value: unknown): ContactStage {
  if (typeof value === 'string' && CONTACT_STAGES.has(value as ContactStage)) {
    return value as ContactStage;
  }
  return defaultContactStage;
}

export function saveGame(data: SaveData) {
  try {
    const stats = mergeStatsWithPersistentProgress(normalizeGameStats(data.stats));
    persistProgressFromStats(stats);
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...data,
      avatarState: normalizeNovaAvatarState(data.avatarState),
      deliveryRuntime: normalizeChatDeliveryRuntime(data.deliveryRuntime),
      deliveryStateVersion: 1,
      stats,
    }));
  } catch {
    /* silent */
  }
}

function isDisplayMessageLike(value: unknown): value is DisplayMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<DisplayMessage>;
  return typeof message.id === 'string'
    && typeof message.speaker === 'string'
    && typeof message.type === 'string'
    && typeof message.content === 'string';
}

export function migrateSaveData(value: unknown): SaveData | null {
  if (!value || typeof value !== 'object') return null;
  const save = value as Partial<SaveData>;
  if (save.storyVersion !== undefined && save.storyVersion !== STORY_VERSION) return null;
  const rawMessages = Array.isArray(save.messages) ? save.messages : [];

  const pendingNodeId = typeof save.pendingNodeId === 'string' ? save.pendingNodeId : '';
  const currentNodeId = typeof save.currentNodeId === 'string' ? save.currentNodeId : undefined;
  if (!pendingNodeId && !currentNodeId) return null;

  const messageIds = new Set<string>();
  const messages: DisplayMessage[] = rawMessages
    .filter(isDisplayMessageLike)
    .filter(message => {
      if (messageIds.has(message.id)) return false;
      messageIds.add(message.id);
      return true;
    })
    .map(message => {
      const legacy = message as DisplayMessage & Record<string, unknown>;
      const {
        emotion: _emotion,
        avatarProfile: _avatarProfile,
        contactStage: _messageContactStage,
        avatar: _avatar,
        avatarSrc: _avatarSrc,
        avatarUrl: _avatarUrl,
        portrait: _portrait,
        ...cleanMessage
      } = legacy;
      void _emotion;
      void _avatarProfile;
      void _messageContactStage;
      void _avatar;
      void _avatarSrc;
      void _avatarUrl;
      void _portrait;

      const speakerIdentity = cleanMessage.speakerIdentity === 'residual06'
        || cleanMessage.displayName === 'UNKNOWN-06'
        ? 'residual06'
        : undefined;
      return {
        ...cleanMessage,
        ...(speakerIdentity ? { speakerIdentity } : {}),
        isNew: false,
      } as DisplayMessage;
    });

  const contactStage = normalizeContactStage(save.contactStage);
  const stats = mergeStatsWithPersistentProgress(normalizeGameStats(save.stats));
  let resumeCandidate = pendingNodeId;
  if (!resumeCandidate && currentNodeId) {
    const legacyNode = storyNodeMap.get(currentNodeId);
    const lastMessage = messages.at(-1);
    resumeCandidate = legacyNode
      && lastMessage?.id.startsWith(`${currentNodeId}_`)
      && legacyNode.type !== 'choice'
      && legacyNode.type !== 'input'
      && legacyNode.type !== 'interaction'
      && legacyNode.type !== 'end'
      ? legacyNode.nextId ?? currentNodeId
      : currentNodeId;
  }
  const delivery = migrateDeliveryState(
    messages,
    save.deliveryRuntime,
    resumeCandidate || 'p0',
    typeof save.timestamp === 'number' && Number.isFinite(save.timestamp)
      ? save.timestamp
      : Date.now(),
  );
  const avatarState = migrateNovaAvatarState(save.avatarState, {
    pendingNodeId: delivery.pendingNodeId,
    messages: delivery.messages,
    contactStage,
    stats,
  });

  const migrated: SaveData = {
    pendingNodeId: delivery.pendingNodeId,
    currentNodeId,
    messages: delivery.messages,
    contactStage,
    avatarState,
    deliveryRuntime: delivery.runtime,
    stats,
    timestamp: typeof save.timestamp === 'number' && Number.isFinite(save.timestamp)
      ? save.timestamp
      : Date.now(),
    storyVersion: STORY_VERSION,
    storyContentVersion: STORY_CONTENT_VERSION,
    deliveryStateVersion: 1,
  };

  const resolvedNodeId = resolveResumeNodeId(migrated);
  if (resolvedNodeId !== 'MENU' && !storyNodeMap.has(resolvedNodeId)) return null;
  migrated.pendingNodeId = resolvedNodeId;
  return migrated;
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = migrateSaveData(JSON.parse(raw));
    if (!data) return null;
    saveGame(data);
    return data;
  } catch {
    return null;
  }
}

export function hasSaveFile(): boolean {
  return loadGame() !== null;
}

/** Clears only the active run. Recovered archives and endings remain available. */
export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  try {
    localStorage.removeItem(NOVA06_FX_SEEN_KEY);
  } catch {
    /* silent */
  }
}

/** Destructive reset reserved for an explicit future "clear all data" action. */
export function clearAllData() {
  clearSave();
  try {
    localStorage.removeItem(PERSISTENT_PROGRESS_KEY);
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
  avatarState: NovaAvatarStoryState,
  contactStage: ContactStage,
  stats: GameStats,
  deliveryRuntime: ChatDeliveryRuntime = createDefaultChatDeliveryRuntime(),
): SaveData {
  const mergedStats = mergeStatsWithPersistentProgress(normalizeGameStats(stats));
  return {
    pendingNodeId,
    messages: messages.map(m => ({ ...m, isNew: false })),
    avatarState: normalizeNovaAvatarState(avatarState),
    deliveryRuntime: normalizeChatDeliveryRuntime(deliveryRuntime),
    contactStage,
    stats: mergedStats,
    storyVersion: STORY_VERSION,
    storyContentVersion: STORY_CONTENT_VERSION,
    deliveryStateVersion: 1,
    timestamp: Date.now(),
  };
}
