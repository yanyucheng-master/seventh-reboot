import { ANCHOR_ARCHIVE_IDS } from './archive';
import { applyNovaAvatarNodeEffect, createDefaultNovaAvatarState } from './avatarState';
import { resolveEndingStart } from './endings';
import {
  applySpecialInteractionCompletion,
  matchesInteractionCondition,
  matchesInteractionPrerequisite,
} from './interactions/logic';
import type { Choice, StoryNode } from './story';
import { applyStoryChoiceEffects, applyTimedChoiceTimeoutEffects, clampStat } from './state';
import type {
  BulkheadFailureReason,
  ContactStage,
  CurrentCycleState,
  CycleChoiceRecord,
  CycleFreeInputRecord,
  CycleInteractionRecord,
  CycleTimedResult,
  FailedCycleRecord,
  FatalFailureCause,
  GameStats,
  NovaAvatarStoryState,
  PowerFailureReason,
  SealableMemoryAnchor,
  SpecialInteractionCompletion,
  SpecialInteractionKind,
} from './types';

export type CycleSyncEventKind = 'message' | 'image' | 'timestamp' | 'choice' | 'input' | 'interaction';

export type CycleSyncEvent = {
  nodeId: string;
  kind: CycleSyncEventKind;
  speaker: 'nova' | 'system' | 'player' | 'observer';
  label: string;
};

export type CycleReplayResult = {
  events: CycleSyncEvent[];
  stats: GameStats;
  contactStage: ContactStage;
  avatarState: NovaAvatarStoryState;
  cycleState: CurrentCycleState;
  nextNodeId: string;
  reachedBoundary: boolean;
  stoppedBecauseRecordEnded: boolean;
};

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
  'critical-log-password',
  'power-routing',
  'memory-seal',
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

export function createCurrentCycleState(
  currentRebootNumber = 7,
  previousCycle?: FailedCycleRecord,
  timestamp = Date.now(),
): CurrentCycleState {
  return {
    cycleStateVersion: 1,
    cycleId: cycleId(currentRebootNumber, timestamp),
    currentRebootNumber,
    completedNodeIds: [],
    choiceHistory: [],
    interactionResults: [],
    timedResults: [],
    freeInputs: [],
    syncAvailable: Boolean(previousCycle),
    syncActive: false,
    syncInterrupted: false,
    syncBoundaryNodeId: previousCycle ? getSyncBoundaryNodeId(previousCycle.failureCause) : undefined,
    syncCursor: 0,
    currentCycleDeviationStarted: false,
    observerCandyEchoPlayed: false,
    previousCycleId: previousCycle?.cycleId,
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
      nodeId,
      choiceId,
      nextId,
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
      nodeId,
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
      nodeId,
      nextId,
      outcome: record.outcome,
      ...(stringValue(record.choiceId) ? { choiceId: stringValue(record.choiceId) } : {}),
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
    return [{ nodeId, nextId, value: record.value }];
  });
}

export function normalizeCurrentCycleState(
  value: unknown,
  fallbackRebootNumber = 7,
  timestamp = Date.now(),
): CurrentCycleState {
  const source = value && typeof value === 'object'
    ? value as Partial<CurrentCycleState>
    : {};
  const currentRebootNumber = Math.max(7, Math.floor(numberValue(source.currentRebootNumber) ?? fallbackRebootNumber));
  return {
    cycleStateVersion: 1,
    cycleId: stringValue(source.cycleId) ?? cycleId(currentRebootNumber, timestamp),
    currentRebootNumber,
    completedNodeIds: uniqueStrings(source.completedNodeIds),
    maxCompletedNodeId: stringValue(source.maxCompletedNodeId),
    choiceHistory: normalizeChoiceHistory(source.choiceHistory),
    interactionResults: normalizeInteractionResults(source.interactionResults),
    timedResults: normalizeTimedResults(source.timedResults),
    freeInputs: normalizeFreeInputs(source.freeInputs),
    syncAvailable: source.syncAvailable === true,
    syncActive: source.syncActive === true,
    syncInterrupted: source.syncInterrupted === true,
    syncBoundaryNodeId: stringValue(source.syncBoundaryNodeId),
    syncCursor: Math.max(0, Math.floor(numberValue(source.syncCursor) ?? 0)),
    currentCycleDeviationStarted: source.currentCycleDeviationStarted === true,
    observerCandyEchoPlayed: source.observerCandyEchoPlayed === true,
    previousCycleId: stringValue(source.previousCycleId),
  };
}

export function normalizeFailedCycleRecord(value: unknown): FailedCycleRecord | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Partial<FailedCycleRecord>;
  const failureCause = source.failureCause === 'bulkhead_failure'
    || source.failureCause === 'power_routing_failure'
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
    failedInteractionId,
    failureCause,
    previousCycleMaxNodeId: stringValue(source.previousCycleMaxNodeId),
    completedNodeIds: uniqueStrings(source.completedNodeIds),
    choiceHistory: normalizeChoiceHistory(source.choiceHistory),
    interactionResults: normalizeInteractionResults(source.interactionResults),
    timedResults: normalizeTimedResults(source.timedResults),
    freeInputs: normalizeFreeInputs(source.freeInputs),
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
  }, record.nodeId);
}

export function recordCycleInteraction(
  current: CurrentCycleState,
  record: CycleInteractionRecord,
): CurrentCycleState {
  return markCycleNodeCompleted({
    ...current,
    interactionResults: replaceByNodeId(current.interactionResults, record),
  }, record.nodeId);
}

export function recordCycleTimedResult(current: CurrentCycleState, record: CycleTimedResult): CurrentCycleState {
  return {
    ...current,
    timedResults: replaceByNodeId(current.timedResults, record),
  };
}

export function recordCycleFreeInput(
  current: CurrentCycleState,
  record: CycleFreeInputRecord,
): CurrentCycleState {
  return markCycleNodeCompleted({
    ...current,
    freeInputs: replaceByNodeId(current.freeInputs, record),
  }, record.nodeId);
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
  if (node.id !== 'p0') return node;
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

export function choiceDeviatesFromRecord(
  record: FailedCycleRecord | null | undefined,
  nodeId: string,
  choiceId: string,
): boolean {
  const previous = record?.choiceHistory.find(item => item.nodeId === nodeId);
  return Boolean(previous && previous.choiceId !== choiceId);
}

export function inputDeviatesFromRecord(
  record: FailedCycleRecord | null | undefined,
  nodeId: string,
  value: string,
): boolean {
  const previous = record?.freeInputs.find(item => item.nodeId === nodeId);
  return Boolean(previous && previous.value !== value);
}

export function interactionDeviatesFromRecord(
  record: FailedCycleRecord | null | undefined,
  result: CycleInteractionRecord,
): boolean {
  const previous = record?.interactionResults.find(item => item.nodeId === result.nodeId);
  return Boolean(previous && (
    previous.routeKey !== result.routeKey
    || previous.attempt !== result.attempt
    || previous.failureReason !== result.failureReason
    || previous.anchor !== result.anchor
  ));
}

export function getFailedInteractionId(cause: FatalFailureCause): string {
  if (cause === 'protocol_rollback') return 'ch5b_fin3';
  return cause === 'power_routing_failure'
    ? 'ch5b_power_retry_interaction'
    : 'ch3_airlock_interaction';
}

export function getSyncBoundaryNodeId(cause: FatalFailureCause): string {
  if (cause === 'protocol_rollback') return 'ch5b_fin3';
  return cause === 'power_routing_failure'
    ? 'ch5b_power_interaction'
    : 'ch3_airlock_interaction';
}

export function createFailedCycleRecord(
  cycle: CurrentCycleState,
  cause: FatalFailureCause,
  failedAt = Date.now(),
): FailedCycleRecord {
  return {
    cycleId: cycle.cycleId,
    rebootNumber: cycle.currentRebootNumber,
    failedAt,
    fatalEndingTriggered: true,
    failedInteractionId: getFailedInteractionId(cause),
    failureCause: cause,
    previousCycleMaxNodeId: cycle.maxCompletedNodeId,
    completedNodeIds: [...cycle.completedNodeIds],
    choiceHistory: cycle.choiceHistory.map(record => ({ ...record })),
    interactionResults: cycle.interactionResults.map(record => ({ ...record })),
    timedResults: cycle.timedResults.map(record => ({ ...record })),
    freeInputs: cycle.freeInputs.map(record => ({ ...record })),
  };
}

function completionFromRecord(record: CycleInteractionRecord): SpecialInteractionCompletion | null {
  switch (record.kind) {
    case 'bulkhead-isolation':
      if (record.routeKey !== 'safe' && record.routeKey !== 'injured' && record.routeKey !== 'fatal') return null;
      return {
        kind: record.kind,
        routeKey: record.routeKey,
        ...(record.failureReason && BULKHEAD_FAILURE_REASONS.has(record.failureReason as BulkheadFailureReason)
          ? { failureReason: record.failureReason as BulkheadFailureReason }
          : {}),
      };
    case 'critical-log-password':
      if (record.routeKey !== 'success' && record.routeKey !== 'retry') return null;
      return { kind: record.kind, routeKey: record.routeKey };
    case 'power-routing':
      if (record.routeKey !== 'success' && record.routeKey !== 'fail' && record.routeKey !== 'fatal') return null;
      return {
        kind: record.kind,
        routeKey: record.routeKey,
        attempt: record.attempt ?? 1,
        ...(record.failureReason && POWER_FAILURE_REASONS.has(record.failureReason as PowerFailureReason)
          ? { failureReason: record.failureReason as PowerFailureReason }
          : {}),
      };
    case 'memory-seal':
      if (!record.anchor) return null;
      return { kind: record.kind, routeKey: record.anchor, anchor: record.anchor };
    case 'memory-restore':
      if (record.routeKey === 'none') return { kind: record.kind, routeKey: 'none' };
      if (!record.anchor) return null;
      return { kind: record.kind, routeKey: record.anchor, anchor: record.anchor };
  }
}

function findRecordedChoice(record: FailedCycleRecord, node: StoryNode): { choice: Choice; history: CycleChoiceRecord } | null {
  const history = record.choiceHistory.find(item => item.nodeId === node.id);
  if (!history || !node.choices) return null;
  const choice = node.choices.find(item => item.id === history.choiceId)
    ?? node.choices[history.choiceIndex];
  return choice ? { choice, history } : null;
}

function eventForNode(node: StoryNode, label?: string): CycleSyncEvent | null {
  if (
    node.type === 'delay'
    || node.type === 'typing'
    || node.type === 'end'
    || node.type === 'internal-chapter-marker'
    || node.type === 'internal-ending-marker'
    || node.type === 'observer-echo'
    || node.type === 'title-state'
  ) return null;
  if (!label && !node.content) return null;
  const kind: CycleSyncEventKind = node.type === 'image'
    ? 'image'
    : node.type === 'timestamp'
      ? 'timestamp'
      : node.type === 'choice'
        ? 'choice'
        : node.type === 'input'
          ? 'input'
          : node.type === 'interaction'
            ? 'interaction'
            : 'message';
  return {
    nodeId: node.id,
    kind,
    speaker: node.type === 'choice' || node.type === 'input' ? 'player' : node.speaker,
    label: label ?? node.content,
  };
}

function applyMemoryAnchor(stats: GameStats, node: StoryNode): GameStats {
  const anchor = node.memoryAnchor;
  if (!anchor || stats.memoryAnchors.includes(anchor)) return stats;
  return {
    ...stats,
    memory: clampStat(stats.memory + 1),
    memoryAnchors: [...stats.memoryAnchors, anchor],
    unlockedArchives: [...new Set([...stats.unlockedArchives, ANCHOR_ARCHIVE_IDS[anchor]])],
  };
}

export function replayFailedCycle(
  record: FailedCycleRecord,
  nodeMap: Map<string, StoryNode>,
  initialStats: GameStats,
  baseCycle: CurrentCycleState,
  eventLimit = Number.POSITIVE_INFINITY,
): CycleReplayResult {
  const boundary = getSyncBoundaryNodeId(record.failureCause);
  let nodeId = 'p0';
  let stats = { ...initialStats, memoryAnchors: [...initialStats.memoryAnchors] };
  let contactStage: ContactStage = 'unknown';
  let avatarState = createDefaultNovaAvatarState();
  let cycleState: CurrentCycleState = {
    ...baseCycle,
    completedNodeIds: [],
    choiceHistory: [],
    interactionResults: [],
    timedResults: [],
    freeInputs: [],
    maxCompletedNodeId: undefined,
  };
  const events: CycleSyncEvent[] = [];
  let guard = 0;

  const result = (
    reachedBoundary: boolean,
    stoppedBecauseRecordEnded: boolean,
  ): CycleReplayResult => ({
    events,
    stats,
    contactStage,
    avatarState,
    cycleState,
    nextNodeId: nodeId,
    reachedBoundary,
    stoppedBecauseRecordEnded,
  });

  while (nodeId && nodeId !== 'MENU' && guard < 5000) {
    guard += 1;
    if (nodeId === boundary) return result(true, false);
    const node = nodeMap.get(nodeId);
    if (!node) return result(false, true);

    if (node.interactionCondition && !matchesInteractionCondition(stats, node.interactionCondition)) {
      nodeId = node.conditionElseNextId ?? node.nextId ?? nodeId;
      continue;
    }
    if (node.interactionPrerequisite && !matchesInteractionPrerequisite(stats, node.interactionPrerequisite)) {
      nodeId = node.nextId ?? nodeId;
      continue;
    }
    if (node.requiresAnchor && !stats.memoryAnchors.includes(node.requiresAnchor)) {
      nodeId = node.nextId ?? nodeId;
      continue;
    }

    let nextId = node.nextId ?? node.id;
    let event: CycleSyncEvent | null = null;

    if (node.type === 'choice') {
      const recorded = findRecordedChoice(record, node);
      const timedOut = record.timedResults.find(item => item.nodeId === node.id && item.outcome === 'timeout');
      if (!recorded && !timedOut) return result(false, true);
      event = eventForNode(node, recorded?.choice.text ?? '[TIMEOUT]');
      if (event && events.length >= eventLimit) return result(false, false);
      if (recorded) {
        stats = applyStoryChoiceEffects(stats, recorded.choice);
        nextId = resolveEndingStart(recorded.history.nextId || recorded.choice.nextId, stats);
        cycleState = recordCycleChoice(cycleState, { ...recorded.history, nextId });
        if (node.choiceTimeoutMs) {
          cycleState = recordCycleTimedResult(cycleState, {
            nodeId: node.id,
            outcome: 'choice',
            choiceId: recorded.history.choiceId,
            nextId,
          });
        }
      } else if (timedOut) {
        stats = applyTimedChoiceTimeoutEffects(stats, node.id);
        nextId = timedOut.nextId;
        cycleState = markCycleNodeCompleted(recordCycleTimedResult(cycleState, timedOut), node.id);
      }
    } else if (node.type === 'input') {
      const input = record.freeInputs.find(item => item.nodeId === node.id);
      const timed = record.timedResults.find(item => item.nodeId === node.id && item.outcome === 'timeout');
      if (!input && !timed) return result(false, true);
      event = eventForNode(node, input?.value ?? '[TIMEOUT]');
      if (event && events.length >= eventLimit) return result(false, false);
      if (timed) {
        nextId = timed.nextId;
        cycleState = markCycleNodeCompleted(recordCycleTimedResult(cycleState, timed), node.id);
      } else if (input) {
        nextId = input.nextId;
        cycleState = recordCycleFreeInput(cycleState, input);
      }
    } else if (node.type === 'interaction' && node.interactionKind) {
      const interaction = record.interactionResults.find(item => item.nodeId === node.id);
      if (!interaction) return result(false, true);
      const completion = completionFromRecord(interaction);
      if (!completion) return result(false, true);
      event = eventForNode(node, `${node.content} / ${interaction.routeKey}`);
      if (event && events.length >= eventLimit) return result(false, false);
      stats = applySpecialInteractionCompletion(stats, completion);
      nextId = node.interactionNextIds?.[interaction.routeKey] ?? node.nextId ?? node.id;
      cycleState = recordCycleInteraction(cycleState, interaction);
    } else if (node.type === 'observer-echo') {
      nodeId = nextId;
      continue;
    } else {
      event = eventForNode(node);
      if (event && events.length >= eventLimit) return result(false, false);
      stats = applyMemoryAnchor(stats, node);
      cycleState = markCycleNodeCompleted(cycleState, node.id);
    }

    const avatarEffect = applyNovaAvatarNodeEffect(avatarState, node.id);
    avatarState = avatarEffect.state;
    if (node.contactStage) contactStage = node.contactStage;
    if (event) events.push(event);
    nodeId = nextId;
  }

  return result(nodeId === boundary, true);
}

export function applyRecordedTimeout(
  stats: GameStats,
  record: CycleTimedResult,
): GameStats {
  return record.outcome === 'timeout'
    ? applyTimedChoiceTimeoutEffects(stats, record.nodeId)
    : stats;
}
