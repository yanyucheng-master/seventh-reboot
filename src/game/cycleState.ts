import type { StoryNode } from './story';
import { applyTimedChoiceTimeoutEffects } from './state';
import type {
  BulkheadFailureReason,
  ChatDeliveryRuntime,
  ContactStage,
  CurrentCycleState,
  CycleChoiceRecord,
  CycleFreeInputRecord,
  CycleInteractionRecord,
  CycleTimedResult,
  FailedCycleRecord,
  FatalFailureCause,
  GameStats,
  DisplayMessage,
  NovaAvatarStoryState,
  PowerFailureReason,
  RebootNumber,
  SealableMemoryAnchor,
  StableCheckpointSnapshot,
  SpecialInteractionCompletion,
  SpecialInteractionKind,
} from './types';
import {
  migrateLegacyChoiceId,
  migrateLegacyMainNodeId,
  STORY_START_NODE_ID,
} from './storyIds';

const BULKHEAD_FAILURE_REASONS = new Set<BulkheadFailureReason>([
  'wrong_observation_door',
  'hallway_sealed',
  'transition_purged',
  'seal_timeout',
]);
const POWER_FAILURE_REASONS = new Set<PowerFailureReason>([
  'life_support_below_minimum',
  'communications_interrupted',
  'core_scan_underpowered',
  'return_core_cutoff',
  'timeout',
]);
const INTERACTION_KINDS = new Set<SpecialInteractionKind>([
  'bulkhead-isolation',
  'sealed-record-order',
  'power-routing',
  'memory-seal',
  'course-lock',
  'protocol-cut',
  'memory-restore',
]);
const SEALABLE_ANCHORS = new Set<SealableMemoryAnchor>([
  'maintenance_board',
  'white_flower',
  'goodnight',
]);

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))];
}

function cycleId(rebootNumber: number, timestamp = Date.now()): string {
  return `cycle-${String(rebootNumber).padStart(2, '0')}-${timestamp}`;
}

export function clampRebootNumber(value: unknown, fallback: RebootNumber = 7): RebootNumber {
  const numeric = numberValue(value);
  if (numeric == null) return fallback;
  return numeric >= 8 ? 8 : 7;
}

export function createCurrentCycleState(
  currentRebootNumber = 7,
  previousCycle?: FailedCycleRecord,
  timestamp = Date.now(),
): CurrentCycleState {
  const normalizedRebootNumber = clampRebootNumber(currentRebootNumber);
  return {
    cycleStateVersion: 3,
    cycleId: cycleId(normalizedRebootNumber, timestamp),
    currentRebootNumber: normalizedRebootNumber,
    completedNodeIds: [],
    choiceHistory: [],
    interactionResults: [],
    timedResults: [],
    freeInputs: [],
    timedDeadlines: {},
    syncAvailable: false,
    syncActive: false,
    syncInterrupted: false,
    syncBoundaryNodeId: undefined,
    syncCursor: 0,
    currentCycleDeviationStarted: false,
    observerCandyEchoPlayed: false,
    previousCycleId: previousCycle?.cycleId,
    damagedSeventh: false,
  };
}

function normalizeStableCheckpoint(value: unknown): StableCheckpointSnapshot | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Partial<StableCheckpointSnapshot>;
  if (
    !stringValue(source.nodeId)
    || !source.stats
    || !Array.isArray(source.messages)
    || !source.avatarState
    || !source.deliveryRuntime
    || (source.contactStage !== 'unknown' && source.contactStage !== 'named' && source.contactStage !== 'verified')
  ) return undefined;
  const normalizedCycle = normalizeCurrentCycleState(
    source.cycleState,
    7,
    numberValue(source.capturedAt) ?? Date.now(),
  );
  const cycleState = { ...normalizedCycle };
  delete cycleState.lastStableCheckpoint;
  return {
    nodeId: migrateLegacyMainNodeId(source.nodeId!),
    capturedAt: numberValue(source.capturedAt) ?? Date.now(),
    stats: source.stats,
    messages: source.messages.map(message => ({ ...message })),
    contactStage: source.contactStage,
    avatarState: { ...source.avatarState },
    deliveryRuntime: { ...source.deliveryRuntime },
    cycleState,
  };
}

function normalizeChoiceHistory(value: unknown): CycleChoiceRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Partial<CycleChoiceRecord>;
    const nodeId = stringValue(record.nodeId);
    const choiceId = stringValue(record.choiceId);
    const nextId = stringValue(record.nextId);
    const choiceIndex = numberValue(record.choiceIndex);
    if (!nodeId || !choiceId || !nextId || choiceIndex == null || choiceIndex < 0) return [];
    return [{
      nodeId: migrateLegacyMainNodeId(nodeId),
      choiceId: migrateLegacyChoiceId(choiceId),
      nextId: migrateLegacyMainNodeId(nextId),
      choiceIndex: Math.floor(choiceIndex),
      committedAt: numberValue(record.committedAt) ?? 0,
    }];
  });
}

function normalizeInteractionResults(value: unknown): CycleInteractionRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Partial<CycleInteractionRecord>;
    const nodeId = stringValue(record.nodeId);
    const kind = stringValue(record.kind) as SpecialInteractionKind | undefined;
    const routeKey = stringValue(record.routeKey);
    if (!nodeId || !kind || !INTERACTION_KINDS.has(kind) || !routeKey) return [];
    const failureReason = stringValue(record.failureReason);
    const anchor = stringValue(record.anchor);
    return [{
      nodeId: migrateLegacyMainNodeId(nodeId),
      kind,
      routeKey,
      ...(record.attempt === 1 || record.attempt === 2 ? { attempt: record.attempt } : {}),
      ...(failureReason && (BULKHEAD_FAILURE_REASONS.has(failureReason as BulkheadFailureReason)
        || POWER_FAILURE_REASONS.has(failureReason as PowerFailureReason))
        ? { failureReason: failureReason as BulkheadFailureReason | PowerFailureReason }
        : {}),
      ...(anchor && SEALABLE_ANCHORS.has(anchor as SealableMemoryAnchor)
        ? { anchor: anchor as SealableMemoryAnchor }
        : {}),
    }];
  });
}

function normalizeTimedResults(value: unknown): CycleTimedResult[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Partial<CycleTimedResult>;
    const nodeId = stringValue(record.nodeId);
    const nextId = stringValue(record.nextId);
    if (!nodeId || !nextId || (record.outcome !== 'choice' && record.outcome !== 'timeout')) return [];
    return [{
      nodeId: migrateLegacyMainNodeId(nodeId),
      nextId: migrateLegacyMainNodeId(nextId),
      outcome: record.outcome,
      ...(stringValue(record.choiceId)
        ? { choiceId: migrateLegacyChoiceId(stringValue(record.choiceId)!) }
        : {}),
    }];
  });
}

function normalizeFreeInputs(value: unknown): CycleFreeInputRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Partial<CycleFreeInputRecord>;
    const nodeId = stringValue(record.nodeId);
    const nextId = stringValue(record.nextId);
    if (!nodeId || !nextId || typeof record.value !== 'string') return [];
    return [{
      nodeId: migrateLegacyMainNodeId(nodeId),
      nextId: migrateLegacyMainNodeId(nextId),
      value: record.value,
    }];
  });
}

function normalizeTimedDeadlines(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([nodeId, deadlineAt]) => {
    const normalizedDeadline = numberValue(deadlineAt);
    if (!nodeId || normalizedDeadline == null || normalizedDeadline <= 0) return [];
    return [[migrateLegacyMainNodeId(nodeId), Math.floor(normalizedDeadline)]];
  }));
}

export function normalizeCurrentCycleState(
  value: unknown,
  fallbackRebootNumber = 7,
  timestamp = Date.now(),
): CurrentCycleState {
  const source = value && typeof value === 'object'
    ? value as Partial<CurrentCycleState>
    : {};
  const currentRebootNumber = clampRebootNumber(source.currentRebootNumber, clampRebootNumber(fallbackRebootNumber));
  return {
    cycleStateVersion: 3,
    cycleId: stringValue(source.cycleId) ?? cycleId(currentRebootNumber, timestamp),
    currentRebootNumber,
    completedNodeIds: uniqueStrings(source.completedNodeIds).map(migrateLegacyMainNodeId),
    maxCompletedNodeId: stringValue(source.maxCompletedNodeId)
      ? migrateLegacyMainNodeId(stringValue(source.maxCompletedNodeId)!)
      : undefined,
    choiceHistory: normalizeChoiceHistory(source.choiceHistory),
    interactionResults: normalizeInteractionResults(source.interactionResults),
    timedResults: normalizeTimedResults(source.timedResults),
    freeInputs: normalizeFreeInputs(source.freeInputs),
    timedDeadlines: normalizeTimedDeadlines(source.timedDeadlines),
    syncAvailable: false,
    syncActive: false,
    syncInterrupted: false,
    syncBoundaryNodeId: undefined,
    syncCursor: 0,
    currentCycleDeviationStarted: false,
    observerCandyEchoPlayed: source.observerCandyEchoPlayed === true,
    previousCycleId: stringValue(source.previousCycleId),
    damagedSeventh: source.damagedSeventh === true,
    lastStableCheckpoint: normalizeStableCheckpoint(source.lastStableCheckpoint),
  };
}

export function normalizeFailedCycleRecord(value: unknown): FailedCycleRecord | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Partial<FailedCycleRecord>;
  const failureCause = source.failureCause === 'bulkhead_failure'
    || source.failureCause === 'power_routing_failure'
    || source.failureCause === 'course_lock_failure'
    || source.failureCause === 'protocol_cut_failure'
    || source.failureCause === 'protocol_refusal'
    || source.failureCause === 'protocol_rollback'
    ? source.failureCause
    : undefined;
  const cycleIdValue = stringValue(source.cycleId);
  const failedInteractionId = stringValue(source.failedInteractionId);
  if (!failureCause || !cycleIdValue || !failedInteractionId) return null;
  return {
    cycleId: cycleIdValue,
    rebootNumber: Math.max(7, Math.floor(numberValue(source.rebootNumber) ?? 7)),
    failedAt: numberValue(source.failedAt) ?? Date.now(),
    fatalEndingTriggered: true,
    failedInteractionId: migrateLegacyMainNodeId(failedInteractionId),
    failureCause,
    previousCycleMaxNodeId: stringValue(source.previousCycleMaxNodeId)
      ? migrateLegacyMainNodeId(stringValue(source.previousCycleMaxNodeId)!)
      : undefined,
    completedNodeIds: uniqueStrings(source.completedNodeIds).map(migrateLegacyMainNodeId),
    choiceHistory: normalizeChoiceHistory(source.choiceHistory),
    interactionResults: normalizeInteractionResults(source.interactionResults),
    timedResults: normalizeTimedResults(source.timedResults),
    freeInputs: normalizeFreeInputs(source.freeInputs),
    lastStableCheckpoint: normalizeStableCheckpoint(source.lastStableCheckpoint),
  };
}

function replaceByNodeId<T extends { nodeId: string }>(records: T[], record: T): T[] {
  return [...records.filter(item => item.nodeId !== record.nodeId), record];
}

export function markCycleNodeCompleted(current: CurrentCycleState, nodeId: string): CurrentCycleState {
  return {
    ...current,
    completedNodeIds: current.completedNodeIds.includes(nodeId)
      ? current.completedNodeIds
      : [...current.completedNodeIds, nodeId],
    maxCompletedNodeId: nodeId,
  };
}

export function recordCycleChoice(current: CurrentCycleState, record: CycleChoiceRecord): CurrentCycleState {
  return markCycleNodeCompleted({
    ...current,
    choiceHistory: replaceByNodeId(current.choiceHistory, record),
    timedDeadlines: clearTimedDeadlineMap(current.timedDeadlines, record.nodeId),
  }, record.nodeId);
}

export function recordCycleInteraction(
  current: CurrentCycleState,
  record: CycleInteractionRecord,
): CurrentCycleState {
  return markCycleNodeCompleted({
    ...current,
    interactionResults: replaceByNodeId(current.interactionResults, record),
    timedDeadlines: clearTimedDeadlineMap(current.timedDeadlines, record.nodeId),
  }, record.nodeId);
}

export function recordCycleTimedResult(current: CurrentCycleState, record: CycleTimedResult): CurrentCycleState {
  return {
    ...current,
    timedResults: replaceByNodeId(current.timedResults, record),
    timedDeadlines: clearTimedDeadlineMap(current.timedDeadlines, record.nodeId),
  };
}

export function recordCycleFreeInput(
  current: CurrentCycleState,
  record: CycleFreeInputRecord,
): CurrentCycleState {
  return markCycleNodeCompleted({
    ...current,
    freeInputs: replaceByNodeId(current.freeInputs, record),
    timedDeadlines: clearTimedDeadlineMap(current.timedDeadlines, record.nodeId),
  }, record.nodeId);
}

function clearTimedDeadlineMap(deadlines: Record<string, number>, nodeId: string): Record<string, number> {
  if (!(nodeId in deadlines)) return deadlines;
  const next = { ...deadlines };
  delete next[nodeId];
  return next;
}

export function ensureTimedDeadline(
  current: CurrentCycleState,
  nodeId: string,
  durationMs: number,
  now = Date.now(),
): { state: CurrentCycleState; deadlineAt: number } {
  const existing = current.timedDeadlines[nodeId];
  if (Number.isFinite(existing) && existing > 0) return { state: current, deadlineAt: existing };
  const deadlineAt = Math.floor(now + Math.max(0, durationMs));
  return {
    state: {
      ...current,
      timedDeadlines: { ...current.timedDeadlines, [nodeId]: deadlineAt },
    },
    deadlineAt,
  };
}

export function restartTimedDeadline(
  current: CurrentCycleState,
  nodeId: string,
  durationMs: number,
  now = Date.now(),
): { state: CurrentCycleState; deadlineAt: number } {
  const deadlineAt = Math.floor(now + Math.max(0, durationMs));
  return {
    state: {
      ...current,
      timedDeadlines: { ...current.timedDeadlines, [nodeId]: deadlineAt },
    },
    deadlineAt,
  };
}

export function clearTimedDeadline(current: CurrentCycleState, nodeId: string): CurrentCycleState {
  const timedDeadlines = clearTimedDeadlineMap(current.timedDeadlines, nodeId);
  return timedDeadlines === current.timedDeadlines ? current : { ...current, timedDeadlines };
}

export function getTimedRemainingMs(current: CurrentCycleState, nodeId: string, now = Date.now()): number | undefined {
  const deadlineAt = current.timedDeadlines[nodeId];
  return deadlineAt == null ? undefined : Math.max(0, deadlineAt - now);
}

export function createCycleInteractionRecord(
  nodeId: string,
  completion: SpecialInteractionCompletion,
): CycleInteractionRecord {
  return {
    nodeId,
    kind: completion.kind,
    routeKey: completion.routeKey,
    ...('attempt' in completion ? { attempt: completion.attempt } : {}),
    ...('failureReason' in completion && completion.failureReason
      ? { failureReason: completion.failureReason }
      : {}),
    ...('anchor' in completion && completion.anchor ? { anchor: completion.anchor } : {}),
  };
}

export function getStoryNodeForReboot(node: StoryNode, rebootNumber: number): StoryNode {
  if (node.id !== STORY_START_NODE_ID) return node;
  const paddedRebootNumber = String(rebootNumber).padStart(2, '0');
  return {
    ...node,
    content: node.content
      .replace(/\{currentRebootNumber:02\}/g, paddedRebootNumber)
      .replace(/(本次接入编号[：:]\s*)07/g, (_match, prefix: string) => `${prefix}${paddedRebootNumber}`)
      .replace(/(Current access number:\s*)07/gi, (_match, prefix: string) => `${prefix}${paddedRebootNumber}`),
  };
}

export function shouldStopReadSkip(node: StoryNode, readNodeIds: readonly string[]): boolean {
  if (node.type === 'internal-chapter-marker' || node.type === 'internal-ending-marker' || node.type === 'title-state') {
    return false;
  }
  if (node.type === 'observer-echo') return true;
  return node.type === 'choice'
    || node.type === 'input'
    || node.type === 'interaction'
    || node.type === 'end'
    || !readNodeIds.includes(node.id);
}

export function getFailedInteractionId(cause: FatalFailureCause): string {
  if (cause === 'power_routing_failure') return 'CH05B-0028';
  if (cause === 'course_lock_failure') return 'CH05B-0080';
  if (cause === 'protocol_cut_failure') return 'CH05B-0102';
  if (cause === 'protocol_refusal' || cause === 'protocol_rollback') return 'CH05B-0091';
  return 'CH03-0144';
}

export function createFailedCycleRecord(
  cycle: CurrentCycleState,
  cause: FatalFailureCause,
  failedInteractionId = getFailedInteractionId(cause),
  failedAt = Date.now(),
): FailedCycleRecord {
  return {
    cycleId: cycle.cycleId,
    rebootNumber: cycle.currentRebootNumber,
    failedAt,
    fatalEndingTriggered: true,
    failedInteractionId,
    failureCause: cause,
    previousCycleMaxNodeId: cycle.maxCompletedNodeId,
    completedNodeIds: [...cycle.completedNodeIds],
    choiceHistory: cycle.choiceHistory.map(record => ({ ...record })),
    interactionResults: cycle.interactionResults.map(record => ({ ...record })),
    timedResults: cycle.timedResults.map(record => ({ ...record })),
    freeInputs: cycle.freeInputs.map(record => ({ ...record })),
    lastStableCheckpoint: cycle.lastStableCheckpoint
      ? {
          ...cycle.lastStableCheckpoint,
          stats: { ...cycle.lastStableCheckpoint.stats },
          messages: cycle.lastStableCheckpoint.messages.map(message => ({ ...message })),
          avatarState: { ...cycle.lastStableCheckpoint.avatarState },
          deliveryRuntime: { ...cycle.lastStableCheckpoint.deliveryRuntime },
          cycleState: {
            ...cycle.lastStableCheckpoint.cycleState,
            completedNodeIds: [...cycle.lastStableCheckpoint.cycleState.completedNodeIds],
            choiceHistory: cycle.lastStableCheckpoint.cycleState.choiceHistory.map(record => ({ ...record })),
            interactionResults: cycle.lastStableCheckpoint.cycleState.interactionResults.map(record => ({ ...record })),
            timedResults: cycle.lastStableCheckpoint.cycleState.timedResults.map(record => ({ ...record })),
            freeInputs: cycle.lastStableCheckpoint.cycleState.freeInputs.map(record => ({ ...record })),
            timedDeadlines: { ...cycle.lastStableCheckpoint.cycleState.timedDeadlines },
          },
        }
      : undefined,
  };
}

function cloneStatsForCheckpoint(stats: GameStats): GameStats {
  return {
    ...stats,
    memoryAnchors: [...stats.memoryAnchors],
    unlockedArchives: [...stats.unlockedArchives],
    endingsUnlocked: [...stats.endingsUnlocked],
  };
}

function cloneCycleWithoutCheckpoint(
  cycle: CurrentCycleState,
): Omit<CurrentCycleState, 'lastStableCheckpoint'> {
  const { lastStableCheckpoint: _checkpoint, ...snapshot } = cycle;
  void _checkpoint;
  return {
    ...snapshot,
    completedNodeIds: [...snapshot.completedNodeIds],
    choiceHistory: snapshot.choiceHistory.map(record => ({ ...record })),
    interactionResults: snapshot.interactionResults.map(record => ({ ...record })),
    timedResults: snapshot.timedResults.map(record => ({ ...record })),
    freeInputs: snapshot.freeInputs.map(record => ({ ...record })),
    timedDeadlines: { ...snapshot.timedDeadlines },
  };
}

export function createStableCheckpointSnapshot(
  nodeId: string,
  cycle: CurrentCycleState,
  stats: GameStats,
  messages: DisplayMessage[],
  contactStage: ContactStage,
  avatarState: NovaAvatarStoryState,
  deliveryRuntime: ChatDeliveryRuntime,
  capturedAt = Date.now(),
): StableCheckpointSnapshot {
  return {
    nodeId,
    capturedAt,
    stats: cloneStatsForCheckpoint(stats),
    messages: messages.map(message => ({ ...message, isNew: false })),
    contactStage,
    avatarState: { ...avatarState },
    deliveryRuntime: { ...deliveryRuntime },
    cycleState: cloneCycleWithoutCheckpoint(cycle),
  };
}

export type DamagedSeventhRestore = {
  nodeId: string;
  stats: GameStats;
  messages: DisplayMessage[];
  contactStage: ContactStage;
  avatarState: NovaAvatarStoryState;
  deliveryRuntime: ChatDeliveryRuntime;
  cycleState: CurrentCycleState;
};

export function restoreDamagedSeventhCheckpoint(
  record: FailedCycleRecord | null | undefined,
): DamagedSeventhRestore | null {
  const checkpoint = record?.lastStableCheckpoint;
  if (!checkpoint) return null;

  const {
    earlyFailureCause: _earlyFailureCause,
    fatalSourceNodeId: _fatalSourceNodeId,
    ...checkpointStats
  } = cloneStatsForCheckpoint(checkpoint.stats);
  void _earlyFailureCause;
  void _fatalSourceNodeId;

  const stats: GameStats = {
    ...checkpointStats,
    ending: undefined,
    pendingReboot08: false,
    damagedSeventh: true,
    binaryScarUI: true,
    reboot08FallbackUsed: true,
    reboot08TitleUnlocked: true,
    fatalEndingTriggered: true,
    nova06RecordingDamaged: true,
    nova06RollbackAuthorizationAvailable: false,
    nova06RollbackAuthorizationUsed: checkpointStats.nova06RollbackAuthorizationUsed,
    aiEmergencyRollbackExecuted: checkpointStats.aiEmergencyRollbackExecuted,
  };
  const cycleState: CurrentCycleState = {
    ...checkpoint.cycleState,
    cycleStateVersion: 3,
    currentRebootNumber: 7,
    damagedSeventh: true,
    syncAvailable: false,
    syncActive: false,
    syncInterrupted: false,
    syncBoundaryNodeId: undefined,
    syncCursor: 0,
    currentCycleDeviationStarted: false,
    lastStableCheckpoint: undefined,
    completedNodeIds: [...checkpoint.cycleState.completedNodeIds],
    choiceHistory: checkpoint.cycleState.choiceHistory.map(item => ({ ...item })),
    interactionResults: checkpoint.cycleState.interactionResults.map(item => ({ ...item })),
    timedResults: checkpoint.cycleState.timedResults.map(item => ({ ...item })),
    freeInputs: checkpoint.cycleState.freeInputs.map(item => ({ ...item })),
    timedDeadlines: {},
  };

  return {
    nodeId: checkpoint.nodeId,
    stats,
    messages: checkpoint.messages.map(message => ({ ...message, isNew: false })),
    contactStage: checkpoint.contactStage,
    avatarState: { ...checkpoint.avatarState },
    deliveryRuntime: { ...checkpoint.deliveryRuntime, activeMessageId: undefined, pendingAutoRetryIds: [] },
    cycleState,
  };
}

export function applyRecordedTimeout(
  stats: GameStats,
  record: CycleTimedResult,
): GameStats {
  return record.outcome === 'timeout'
    ? applyTimedChoiceTimeoutEffects(stats, record.nodeId)
    : stats;
}
