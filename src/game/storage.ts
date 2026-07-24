import { storyNodeMap } from './story';
import { migrateNovaAvatarState, normalizeNovaAvatarState } from './avatarState';
import {
  createDefaultChatDeliveryRuntime,
  migrateDeliveryState,
  normalizeChatDeliveryRuntime,
} from './delivery/state';
import {
  createCurrentCycleState,
  createFailedCycleRecord,
  normalizeCurrentCycleState,
  normalizeFailedCycleRecord,
  recordCycleChoice,
  recordCycleFreeInput,
  recordCycleInteraction,
  recordCycleTimedResult,
} from './cycleState';
import type {
  BulkheadFailureReason,
  BulkheadResult,
  ChatDeliveryRuntime,
  ContactStage,
  CurrentCycleState,
  CycleInteractionRecord,
  DisplayMessage,
  EndingId,
  EndingType,
  FailedCycleRecord,
  FatalFailureCause,
  FinalChoice,
  FinalFarewellTone,
  FinalFarewellVariant,
  GameStats,
  MemoryAnchorId,
  NovaAvatarStoryState,
  PowerFailureReason,
  PowerRoutingAttempt,
  PowerRoutingResult,
  SaveData,
  SealableMemoryAnchor,
  TimedProof,
  TimedResponse,
} from './types';

export const SAVE_KEY = 'seventh_reboot_save';
export const PERSISTENT_PROGRESS_KEY = 'seventh_reboot_persistent_progress';
/** 剧情分支拓扑版本；变更选项 nextId 后递增，使旧 localStorage 存档失效 */
export const STORY_VERSION = 'V1.0';
export const STORY_CONTENT_VERSION = 'v1.0-immersive-echo-20260722';
export const SAVE_STATE_VERSION = 3 as const;
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
  bulkheadInjured: false,
  jointAuthorizationCompleted: false,
  criticalLogUnlocked: false,
  powerRoutingAttempt: 0,
  nova06PowerOverrideUsed: false,
  nova06PowerOverrideExpired: false,
  temporaryAnchorRestored: false,
  pendingReboot08: false,
  fatalEndingTriggered: false,
  fatalRebootCount: 0,
  reboot08TitleUnlocked: false,
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
const FINAL_FAREWELL_TONES = new Set<FinalFarewellTone>([
  'warm_acceptance',
  'painful_truth',
  'uncertain_but_honest',
]);
const TIMED_RESPONSES = new Set<TimedResponse>(['calm_nova', 'investigate_log']);
const TIMED_PROOFS = new Set<TimedProof>(['n7_core_anchor']);
const ENDING_TYPES = new Set<EndingType>(['true', 'normal', 'bad']);
const BULKHEAD_RESULTS = new Set<BulkheadResult>(['safe', 'injured', 'fatal']);
const BULKHEAD_FAILURE_REASONS = new Set<BulkheadFailureReason>([
  'wrong_observation_door',
  'hallway_sealed',
  'transition_purged',
  'seal_timeout',
]);
const POWER_ROUTING_RESULTS = new Set<PowerRoutingResult>(['first_success', 'retry_success', 'fatal']);
const POWER_FAILURE_REASONS = new Set<PowerFailureReason>([
  'life_support_below_minimum',
  'communications_interrupted',
  'core_scan_underpowered',
  'return_core_cutoff',
  'timeout',
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

function normalizeBulkheadResult(value: unknown): BulkheadResult | undefined {
  return typeof value === 'string' && BULKHEAD_RESULTS.has(value as BulkheadResult)
    ? value as BulkheadResult
    : undefined;
}

function normalizeBulkheadFailureReason(value: unknown): BulkheadFailureReason | undefined {
  return typeof value === 'string' && BULKHEAD_FAILURE_REASONS.has(value as BulkheadFailureReason)
    ? value as BulkheadFailureReason
    : undefined;
}

function normalizePowerRoutingResult(value: unknown): PowerRoutingResult | undefined {
  return typeof value === 'string' && POWER_ROUTING_RESULTS.has(value as PowerRoutingResult)
    ? value as PowerRoutingResult
    : undefined;
}

function normalizePowerFailureReason(value: unknown): PowerFailureReason | undefined {
  return typeof value === 'string' && POWER_FAILURE_REASONS.has(value as PowerFailureReason)
    ? value as PowerFailureReason
    : undefined;
}

function normalizePowerRoutingAttempt(value: unknown): PowerRoutingAttempt {
  return value === 1 || value === 2 ? value : 0;
}

function normalizeSealableMemoryAnchor(value: unknown): SealableMemoryAnchor | undefined {
  return typeof value === 'string' && SEALABLE_MEMORY_ANCHORS.has(value as SealableMemoryAnchor)
    ? value as SealableMemoryAnchor
    : undefined;
}

export function normalizeGameStats(value: unknown): GameStats {
  const stats = value && typeof value === 'object'
    ? value as Partial<GameStats> & Record<string, unknown>
    : {};
  const memoryAnchors = normalizeMemoryAnchors(stats.memoryAnchors);
  const jointAuthorizationCompleted = stats.jointAuthorizationCompleted === true
    || stats.criticalLogUnlocked === true;
  const bulkheadResult = normalizeBulkheadResult(stats.bulkheadResult);
  const earlyFailureCause = stats.earlyFailureCause === 'bulkhead_failure'
    || stats.earlyFailureCause === 'power_routing_failure'
    ? stats.earlyFailureCause
    : undefined;
  const reboot08TitleUnlocked = stats.reboot08TitleUnlocked === true
    || (stats.reboot08Unlocked === true && Boolean(earlyFailureCause));
  const normalized: GameStats = {
    trust: clampStat(typeof stats.trust === 'number' ? stats.trust : defaultStats.trust),
    memory: clampStat(typeof stats.memory === 'number' ? stats.memory : defaultStats.memory),
    attachment: clampStat(typeof stats.attachment === 'number' ? stats.attachment : defaultStats.attachment),
    memoryAnchors,
    acceptFarewell: typeof stats.acceptFarewell === 'boolean' ? stats.acceptFarewell : defaultStats.acceptFarewell,
    unlockedArchives: normalizeStringList(stats.unlockedArchives),
    endingsUnlocked: normalizeEndings(stats.endingsUnlocked),
    commemorativeArchiveSaved: stats.commemorativeArchiveSaved === true,
    bulkheadInjured: stats.bulkheadInjured === true || bulkheadResult === 'injured',
    jointAuthorizationCompleted,
    criticalLogUnlocked: jointAuthorizationCompleted,
    powerRoutingAttempt: normalizePowerRoutingAttempt(stats.powerRoutingAttempt),
    nova06PowerOverrideUsed: stats.nova06PowerOverrideUsed === true,
    nova06PowerOverrideExpired: stats.nova06PowerOverrideExpired === true,
    temporaryAnchorRestored: stats.temporaryAnchorRestored === true,
    pendingReboot08: stats.pendingReboot08 === true,
    fatalEndingTriggered: stats.fatalEndingTriggered === true || reboot08TitleUnlocked,
    fatalRebootCount: typeof stats.fatalRebootCount === 'number' && Number.isFinite(stats.fatalRebootCount)
      ? Math.max(0, Math.floor(stats.fatalRebootCount))
      : 0,
    reboot08TitleUnlocked,
  };

  const finalChoice = normalizeFinalChoice(stats.finalChoice);
  const finalFarewellVariant = normalizeFinalFarewellVariant(stats.finalFarewellVariant);
  const finalFarewellTone = normalizeFinalFarewellTone(stats.finalFarewellTone);
  const timedResponse = normalizeTimedResponse(stats.timedResponse);
  const timedProof = normalizeTimedProof(stats.timedProof);
  const ending = normalizeEndingType(stats.ending);
  const bulkheadFailureReason = normalizeBulkheadFailureReason(stats.bulkheadFailureReason);
  const powerRoutingResult = normalizePowerRoutingResult(stats.powerRoutingResult);
  const powerFirstFailureReason = normalizePowerFailureReason(stats.powerFirstFailureReason);
  const temporaryAnchorSealed = normalizeSealableMemoryAnchor(stats.temporaryAnchorSealed);
  const memoryRestoreResult = stats.memoryRestoreResult === 'none'
    ? 'none'
    : normalizeSealableMemoryAnchor(stats.memoryRestoreResult);
  if (finalChoice) normalized.finalChoice = finalChoice;
  if (finalFarewellVariant) normalized.finalFarewellVariant = finalFarewellVariant;
  if (finalFarewellTone) normalized.finalFarewellTone = finalFarewellTone;
  if (timedResponse) normalized.timedResponse = timedResponse;
  if (timedProof) normalized.timedProof = timedProof;
  if (ending) normalized.ending = ending;
  if (bulkheadResult) normalized.bulkheadResult = bulkheadResult;
  if (bulkheadFailureReason) normalized.bulkheadFailureReason = bulkheadFailureReason;
  if (powerRoutingResult) normalized.powerRoutingResult = powerRoutingResult;
  if (powerFirstFailureReason) normalized.powerFirstFailureReason = powerFirstFailureReason;
  if (temporaryAnchorSealed) normalized.temporaryAnchorSealed = temporaryAnchorSealed;
  if (memoryRestoreResult) normalized.memoryRestoreResult = memoryRestoreResult;
  if (earlyFailureCause) normalized.earlyFailureCause = earlyFailureCause;
  if (normalized.nova06PowerOverrideUsed) {
    normalized.powerRoutingAttempt = Math.max(1, normalized.powerRoutingAttempt) as PowerRoutingAttempt;
    normalized.nova06PowerOverrideExpired = true;
  }
  if (normalized.powerRoutingResult === 'first_success') {
    normalized.powerRoutingAttempt = 1;
    normalized.nova06PowerOverrideExpired = true;
  }
  if (normalized.powerRoutingResult === 'retry_success' || normalized.powerRoutingResult === 'fatal') {
    normalized.powerRoutingAttempt = 2;
  }
  if (normalized.memoryRestoreResult && normalized.memoryRestoreResult !== 'none') {
    normalized.temporaryAnchorRestored = true;
  }
  if (normalized.bulkheadResult === 'fatal' && !normalized.reboot08TitleUnlocked) {
    normalized.earlyFailureCause = 'bulkhead_failure';
    normalized.pendingReboot08 = true;
  }
  if (normalized.powerRoutingResult === 'fatal' && !normalized.reboot08TitleUnlocked) {
    normalized.earlyFailureCause = 'power_routing_failure';
    normalized.pendingReboot08 = true;
  }
  return normalized;
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(6, value));
}

export type PersistentProgress = {
  version: 3;
  unlockedArchives: string[];
  endingsUnlocked: EndingId[];
  commemorativeArchiveSaved: boolean;
  readNodeIds: string[];
  currentRebootNumber: number;
  fatalRebootCount: number;
  fatalEndingTriggered: boolean;
  reboot08TitleUnlocked: boolean;
  failedCycles: FailedCycleRecord[];
};

const EMPTY_PERSISTENT_PROGRESS: PersistentProgress = {
  version: 3,
  unlockedArchives: [],
  endingsUnlocked: [],
  commemorativeArchiveSaved: false,
  readNodeIds: [],
  currentRebootNumber: 7,
  fatalRebootCount: 0,
  fatalEndingTriggered: false,
  reboot08TitleUnlocked: false,
  failedCycles: [],
};

function clonePersistentProgress(progress: PersistentProgress): PersistentProgress {
  return {
    ...progress,
    unlockedArchives: [...progress.unlockedArchives],
    endingsUnlocked: [...progress.endingsUnlocked],
    readNodeIds: [...progress.readNodeIds],
    failedCycles: progress.failedCycles.map(record => ({
      ...record,
      completedNodeIds: [...record.completedNodeIds],
      choiceHistory: record.choiceHistory.map(item => ({ ...item })),
      interactionResults: record.interactionResults.map(item => ({ ...item })),
      timedResults: record.timedResults.map(item => ({ ...item })),
      freeInputs: record.freeInputs.map(item => ({ ...item })),
    })),
  };
}

function legacyProgressCameFromFatalCycle(): boolean {
  try {
    const rawSave = localStorage.getItem(SAVE_KEY);
    if (!rawSave) return false;
    const parsed = JSON.parse(rawSave) as { stats?: Record<string, unknown> };
    return parsed.stats?.earlyFailureCause === 'bulkhead_failure'
      || parsed.stats?.earlyFailureCause === 'power_routing_failure';
  } catch {
    return false;
  }
}

export function loadPersistentProgress(): PersistentProgress {
  try {
    const raw = localStorage.getItem(PERSISTENT_PROGRESS_KEY);
    if (!raw) return clonePersistentProgress(EMPTY_PERSISTENT_PROGRESS);
    const parsed = JSON.parse(raw) as Partial<PersistentProgress> & { reboot08Unlocked?: unknown };
    const failedCycles = Array.isArray(parsed.failedCycles)
      ? parsed.failedCycles.map(normalizeFailedCycleRecord).filter((record): record is FailedCycleRecord => Boolean(record))
      : [];
    const migratedLegacyTitle = parsed.reboot08Unlocked === true && legacyProgressCameFromFatalCycle();
    const reboot08TitleUnlocked = parsed.reboot08TitleUnlocked === true
      || migratedLegacyTitle
      || failedCycles.length > 0;
    const fatalRebootCount = typeof parsed.fatalRebootCount === 'number' && Number.isFinite(parsed.fatalRebootCount)
      ? Math.max(failedCycles.length, Math.floor(parsed.fatalRebootCount))
      : failedCycles.length;
    return {
      version: 3,
      unlockedArchives: normalizeStringList(parsed.unlockedArchives),
      endingsUnlocked: normalizeEndings(parsed.endingsUnlocked),
      commemorativeArchiveSaved: parsed.commemorativeArchiveSaved === true,
      readNodeIds: normalizeStringList(parsed.readNodeIds),
      currentRebootNumber: reboot08TitleUnlocked
        ? Math.max(8, typeof parsed.currentRebootNumber === 'number' ? Math.floor(parsed.currentRebootNumber) : 8)
        : 7,
      fatalRebootCount,
      fatalEndingTriggered: parsed.fatalEndingTriggered === true || failedCycles.length > 0,
      reboot08TitleUnlocked,
      failedCycles,
    };
  } catch {
    return clonePersistentProgress(EMPTY_PERSISTENT_PROGRESS);
  }
}

function savePersistentProgress(progress: PersistentProgress): void {
  try {
    localStorage.setItem(PERSISTENT_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* Persistence is best-effort on restricted webviews. */
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
    fatalEndingTriggered: progress.fatalEndingTriggered || stats.fatalEndingTriggered,
    fatalRebootCount: Math.max(progress.fatalRebootCount, stats.fatalRebootCount),
    reboot08TitleUnlocked: progress.reboot08TitleUnlocked || stats.reboot08TitleUnlocked,
  };
}

function persistProgressFromStats(stats: GameStats, cycleState?: CurrentCycleState): void {
  const progress = loadPersistentProgress();
  const merged = mergeStatsWithPersistentProgress(stats);
  savePersistentProgress({
    ...progress,
    version: 3,
    unlockedArchives: merged.unlockedArchives,
    endingsUnlocked: merged.endingsUnlocked,
    commemorativeArchiveSaved: merged.commemorativeArchiveSaved,
    readNodeIds: [...new Set([...progress.readNodeIds, ...(cycleState?.completedNodeIds ?? [])])],
    currentRebootNumber: Math.max(progress.currentRebootNumber, cycleState?.currentRebootNumber ?? 7),
    fatalRebootCount: merged.fatalRebootCount,
    fatalEndingTriggered: merged.fatalEndingTriggered,
    reboot08TitleUnlocked: merged.reboot08TitleUnlocked,
  });
}

export function getLatestFailedCycle(
  progress: PersistentProgress = loadPersistentProgress(),
): FailedCycleRecord | undefined {
  return progress.failedCycles.at(-1);
}

export function isNodeRead(nodeId: string): boolean {
  return loadPersistentProgress().readNodeIds.includes(nodeId);
}

export function archiveFatalCycle(
  save: SaveData,
  causeOverride?: FatalFailureCause,
): PersistentProgress {
  const cause = causeOverride ?? save.stats.earlyFailureCause;
  if (!cause) return loadPersistentProgress();
  const progress = loadPersistentProgress();
  const failed = createFailedCycleRecord(save.cycleState, cause);
  const alreadyArchived = progress.failedCycles.some(record => record.cycleId === failed.cycleId);
  const failedCycles = alreadyArchived
    ? progress.failedCycles
    : [...progress.failedCycles, failed].slice(-8);
  const next: PersistentProgress = {
    ...progress,
    version: 3,
    unlockedArchives: [...new Set([
      ...progress.unlockedArchives,
      ...save.stats.unlockedArchives,
      ...save.stats.endingsUnlocked,
    ])],
    endingsUnlocked: [...new Set([...progress.endingsUnlocked, ...save.stats.endingsUnlocked])],
    commemorativeArchiveSaved: progress.commemorativeArchiveSaved || save.stats.commemorativeArchiveSaved,
    readNodeIds: [...new Set([...progress.readNodeIds, ...save.cycleState.completedNodeIds])],
    currentRebootNumber: 8,
    fatalRebootCount: alreadyArchived ? progress.fatalRebootCount : progress.fatalRebootCount + 1,
    fatalEndingTriggered: true,
    reboot08TitleUnlocked: true,
    failedCycles,
  };
  savePersistentProgress(next);
  clearSave();
  return clonePersistentProgress(next);
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
    const cycleState = normalizeCurrentCycleState(
      data.cycleState,
      data.cycleState?.currentRebootNumber ?? 7,
      data.timestamp,
    );
    persistProgressFromStats(stats, cycleState);
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...data,
      storyVersion: STORY_VERSION,
      storyContentVersion: STORY_CONTENT_VERSION,
      saveStateVersion: SAVE_STATE_VERSION,
      avatarState: normalizeNovaAvatarState(data.avatarState),
      deliveryRuntime: normalizeChatDeliveryRuntime(data.deliveryRuntime),
      deliveryStateVersion: 1,
      stats,
      cycleState,
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

function legacyInteractionRecords(stats: GameStats): CycleInteractionRecord[] {
  const records: CycleInteractionRecord[] = [];
  if (stats.bulkheadResult) {
    records.push({
      nodeId: 'ch3_airlock_interaction',
      kind: 'bulkhead-isolation',
      routeKey: stats.bulkheadResult,
      ...(stats.bulkheadFailureReason ? { failureReason: stats.bulkheadFailureReason } : {}),
    });
  }
  if (stats.jointAuthorizationCompleted) {
    records.push({
      nodeId: 'ch5a_auth_input',
      kind: 'critical-log-password',
      routeKey: 'success',
    });
  }
  if (stats.powerRoutingAttempt >= 1) {
    const firstRoute = stats.powerRoutingResult === 'first_success' ? 'success' : 'fail';
    records.push({
      nodeId: 'ch5b_power_interaction',
      kind: 'power-routing',
      routeKey: firstRoute,
      attempt: 1,
      ...(stats.powerFirstFailureReason ? { failureReason: stats.powerFirstFailureReason } : {}),
    });
  }
  if (stats.powerRoutingAttempt === 2 && stats.powerRoutingResult) {
    records.push({
      nodeId: 'ch5b_power_retry_interaction',
      kind: 'power-routing',
      routeKey: stats.powerRoutingResult === 'retry_success' ? 'success' : 'fatal',
      attempt: 2,
      ...(stats.powerFirstFailureReason ? { failureReason: stats.powerFirstFailureReason } : {}),
    });
  }
  if (stats.temporaryAnchorSealed) {
    records.push({
      nodeId: 'ch5b_memory_seal',
      kind: 'memory-seal',
      routeKey: stats.temporaryAnchorSealed,
      anchor: stats.temporaryAnchorSealed,
    });
  }
  if (stats.memoryRestoreResult) {
    records.push({
      nodeId: 'fin_memory_restore',
      kind: 'memory-restore',
      routeKey: stats.memoryRestoreResult,
      ...(stats.memoryRestoreResult !== 'none' ? { anchor: stats.memoryRestoreResult } : {}),
    });
  }
  return records;
}

function createLegacyCycleState(
  messages: DisplayMessage[],
  stats: GameStats,
  timestamp: number,
): CurrentCycleState {
  let cycle = createCurrentCycleState(7, undefined, timestamp);
  for (const message of messages) {
    const nodeId = message.sourceNodeId;
    if (!nodeId) continue;
    const node = storyNodeMap.get(nodeId);
    if (!node) continue;
    if (message.speaker === 'player' && node.type === 'choice' && message.choiceId && message.branchTargetNodeId) {
      const choiceIndex = message.sourceChoiceIndex ?? node.choices?.findIndex(choice => choice.id === message.choiceId) ?? -1;
      if (choiceIndex >= 0) {
        cycle = recordCycleChoice(cycle, {
          nodeId,
          choiceId: message.choiceId,
          choiceIndex,
          nextId: message.branchTargetNodeId,
          committedAt: message.committedAt ?? timestamp,
        });
        if (node.choiceTimeoutMs) {
          cycle = recordCycleTimedResult(cycle, {
            nodeId,
            outcome: 'choice',
            choiceId: message.choiceId,
            nextId: message.branchTargetNodeId,
          });
        }
        continue;
      }
    }
    if (message.speaker === 'player' && node.type === 'input') {
      cycle = recordCycleFreeInput(cycle, {
        nodeId,
        value: message.content,
        nextId: node.specialInputNextIds?.[message.content] ?? node.nextId ?? node.id,
      });
      continue;
    }
    if (message.uiKind === 'choiceTimeout' && node.timeoutNextId) {
      cycle = recordCycleTimedResult(cycle, {
        nodeId,
        outcome: 'timeout',
        nextId: node.timeoutNextId,
      });
    }
    cycle = {
      ...cycle,
      completedNodeIds: cycle.completedNodeIds.includes(nodeId)
        ? cycle.completedNodeIds
        : [...cycle.completedNodeIds, nodeId],
      maxCompletedNodeId: nodeId,
    };
  }
  for (const record of legacyInteractionRecords(stats)) {
    cycle = recordCycleInteraction(cycle, record);
  }
  return cycle;
}

export function migrateSaveData(value: unknown): SaveData | null {
  if (!value || typeof value !== 'object') return null;
  const save = value as Partial<SaveData>;
  const rawSaveStateVersion = (save as unknown as { saveStateVersion?: unknown }).saveStateVersion;
  if (save.storyVersion !== undefined && save.storyVersion !== STORY_VERSION) return null;
  if (save.storyContentVersion !== STORY_CONTENT_VERSION) return null;
  if (rawSaveStateVersion !== 2 && rawSaveStateVersion !== SAVE_STATE_VERSION) return null;
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

  const timestamp = typeof save.timestamp === 'number' && Number.isFinite(save.timestamp)
    ? save.timestamp
    : Date.now();
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
    timestamp,
  );
  const avatarState = migrateNovaAvatarState(save.avatarState, {
    pendingNodeId: delivery.pendingNodeId,
    messages: delivery.messages,
    contactStage,
    stats,
  });
  const cycleState = rawSaveStateVersion === SAVE_STATE_VERSION
    ? normalizeCurrentCycleState(save.cycleState, stats.reboot08TitleUnlocked ? 8 : 7, timestamp)
    : createLegacyCycleState(delivery.messages, stats, timestamp);
  if (
    stats.reboot08TitleUnlocked
    && cycleState.currentRebootNumber < 8
    && !stats.pendingReboot08
    && !stats.earlyFailureCause
  ) {
    return null;
  }

  const migrated: SaveData = {
    pendingNodeId: delivery.pendingNodeId,
    currentNodeId,
    messages: delivery.messages,
    contactStage,
    avatarState,
    deliveryRuntime: delivery.runtime,
    stats,
    cycleState,
    timestamp,
    storyVersion: STORY_VERSION,
    storyContentVersion: STORY_CONTENT_VERSION,
    saveStateVersion: SAVE_STATE_VERSION,
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
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const data = migrateSaveData(parsed);
    if (!data) return null;
    const fatalSequenceAlreadyReachedReboot = Boolean(
      data.stats.earlyFailureCause
      && (
        /^bad_(?:1[5-9]|action_|end)/.test(data.pendingNodeId)
        || ((parsed.stats as Record<string, unknown> | undefined)?.reboot08Unlocked === true)
      )
    );
    if (fatalSequenceAlreadyReachedReboot) {
      archiveFatalCycle(data);
      return null;
    }
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
  const fatalResumeStart = save.stats.earlyFailureCause === 'power_routing_failure'
    ? 'bad_power_1'
    : 'bad_airlock_1';
  const candidate = save.pendingNodeId || save.currentNodeId || 'p0';
  const isFatalSequenceNode = candidate === 'EARLY_BAD_END_START'
    || candidate.startsWith('bad_airlock_')
    || candidate.startsWith('bad_power_')
    || candidate.startsWith('early_bad_')
    || /^bad_(?:1[5-9]|action_|end)/.test(candidate);
  if (save.stats.pendingReboot08 && !isFatalSequenceNode) return fatalResumeStart;
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
  cycleState: CurrentCycleState = createCurrentCycleState(stats.reboot08TitleUnlocked ? 8 : 7),
): SaveData {
  const mergedStats = mergeStatsWithPersistentProgress(normalizeGameStats(stats));
  const normalizedCycleState = normalizeCurrentCycleState(
    cycleState,
    mergedStats.reboot08TitleUnlocked ? 8 : 7,
  );
  return {
    pendingNodeId,
    messages: messages.map(m => ({ ...m, isNew: false })),
    avatarState: normalizeNovaAvatarState(avatarState),
    deliveryRuntime: normalizeChatDeliveryRuntime(deliveryRuntime),
    contactStage,
    stats: mergedStats,
    cycleState: normalizedCycleState,
    storyVersion: STORY_VERSION,
    storyContentVersion: STORY_CONTENT_VERSION,
    saveStateVersion: SAVE_STATE_VERSION,
    deliveryStateVersion: 1,
    timestamp: Date.now(),
  };
}
