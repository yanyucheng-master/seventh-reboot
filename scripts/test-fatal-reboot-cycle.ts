import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap, type StoryNode } from '../src/game/story';
import {
  choiceDeviatesFromRecord,
  createCurrentCycleState,
  createFailedCycleRecord,
  getStoryNodeForReboot,
  getSyncBoundaryNodeId,
  markCycleNodeCompleted,
  recordCycleChoice,
  recordCycleFreeInput,
  recordCycleInteraction,
  recordCycleTimedResult,
  replayFailedCycle,
  shouldStopReadSkip,
} from '../src/game/cycleState';
import {
  archiveFatalCycle,
  clearAllData,
  createNewGameStats,
  createSaveData,
  defaultContactStage,
  defaultStats,
  loadGame,
  loadPersistentProgress,
  saveGame,
} from '../src/game/storage';
import { createDefaultNovaAvatarState } from '../src/game/avatarState';
import { createDefaultChatDeliveryRuntime } from '../src/game/delivery/state';
import { applySpecialInteractionCompletion } from '../src/game/interactions/logic';
import { applyStoryChoiceEffects, clampStat } from '../src/game/state';
import type {
  CurrentCycleState,
  FailedCycleRecord,
  FatalFailureCause,
  GameStats,
} from '../src/game/types';

class TestStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  snapshot() { return new Map(this.data); }
  restore(snapshot: Map<string, string>) { this.data = new Map(snapshot); }
}

const storage = new TestStorage();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function freshStats(): GameStats {
  return {
    ...defaultStats,
    memoryAnchors: [],
    unlockedArchives: [],
    endingsUnlocked: [],
  };
}

function addAnchor(stats: GameStats, node: StoryNode): GameStats {
  if (!node.memoryAnchor || stats.memoryAnchors.includes(node.memoryAnchor)) return stats;
  return {
    ...stats,
    memory: clampStat(stats.memory + 1),
    memoryAnchors: [...stats.memoryAnchors, node.memoryAnchor],
  };
}

function buildRecordedCycle(cause: FatalFailureCause): FailedCycleRecord {
  const boundary = getSyncBoundaryNodeId(cause);
  let stats = freshStats();
  let cycle: CurrentCycleState = createCurrentCycleState(7, undefined, 1_700_000_000_000);
  let nodeId = 'PRO-0001';
  let guard = 0;

  while (nodeId !== boundary && guard < 6000) {
    guard += 1;
    const node = storyNodeMap.get(nodeId);
    check(node, `record builder reached missing node ${nodeId}`);

    if (node.interactionCondition) {
      const actual = node.interactionCondition.kind === 'bulkhead-isolation'
        ? stats.bulkheadResult
        : node.interactionCondition.kind === 'critical-log-password'
          ? stats.jointAuthorizationCompleted ? 'success' : undefined
          : node.interactionCondition.kind === 'power-routing'
            ? stats.powerRoutingResult
            : node.interactionCondition.kind === 'memory-seal'
              ? stats.temporaryAnchorSealed
              : stats.memoryRestoreResult;
      if (actual !== node.interactionCondition.routeKey) {
        nodeId = node.conditionElseNextId ?? node.nextId ?? node.id;
        continue;
      }
    }

    if (node.interactionPrerequisite) {
      const actual = (stats as unknown as Record<string, unknown>)[node.interactionPrerequisite.key];
      if (actual !== node.interactionPrerequisite.value) {
        nodeId = node.nextId ?? node.id;
        continue;
      }
    }

    if (node.requiresAnchor && !stats.memoryAnchors.includes(node.requiresAnchor)) {
      nodeId = node.nextId ?? node.id;
      continue;
    }

    if (node.type === 'choice') {
      const choice = node.choices?.[0];
      check(choice, `choice ${node.id} has no option`);
      const choiceId = choice.id ?? `${node.id}__0`;
      stats = applyStoryChoiceEffects(stats, choice);
      cycle = recordCycleChoice(cycle, {
        nodeId: node.id,
        choiceId,
        choiceIndex: 0,
        nextId: choice.nextId,
        committedAt: guard,
      });
      if (node.choiceTimeoutMs) {
        cycle = recordCycleTimedResult(cycle, {
          nodeId: node.id,
          outcome: 'choice',
          choiceId,
          nextId: choice.nextId,
        });
      }
      nodeId = choice.nextId;
      continue;
    }

    if (node.type === 'input') {
      const value = 'Observer-01';
      const nextId = node.specialInputNextIds?.[value] ?? node.nextId ?? node.id;
      cycle = recordCycleFreeInput(cycle, { nodeId: node.id, value, nextId });
      nodeId = nextId;
      continue;
    }

    if (node.type === 'interaction' && node.interactionKind) {
      if (node.interactionKind === 'bulkhead-isolation') {
        const completion = { kind: 'bulkhead-isolation', routeKey: 'safe' } as const;
        stats = applySpecialInteractionCompletion(stats, completion);
        cycle = recordCycleInteraction(cycle, { nodeId: node.id, ...completion });
        nodeId = node.interactionNextIds?.safe ?? node.nextId ?? node.id;
        continue;
      }
      if (node.interactionKind === 'critical-log-password') {
        const completion = { kind: 'critical-log-password', routeKey: 'success' } as const;
        stats = applySpecialInteractionCompletion(stats, completion);
        cycle = recordCycleInteraction(cycle, { nodeId: node.id, ...completion });
        nodeId = node.interactionNextIds?.success ?? node.nextId ?? node.id;
        continue;
      }
      if (node.interactionKind === 'power-routing') {
        const completion = { kind: 'power-routing', routeKey: 'success', attempt: 1 } as const;
        stats = applySpecialInteractionCompletion(stats, completion);
        cycle = recordCycleInteraction(cycle, { nodeId: node.id, ...completion });
        nodeId = node.interactionNextIds?.success ?? node.nextId ?? node.id;
        continue;
      }
      if (node.interactionKind === 'memory-seal') {
        const completion = {
          kind: 'memory-seal',
          routeKey: 'maintenance_board',
          anchor: 'maintenance_board',
        } as const;
        stats = applySpecialInteractionCompletion(stats, completion);
        cycle = recordCycleInteraction(cycle, { nodeId: node.id, ...completion });
        nodeId = node.interactionNextIds?.maintenance_board ?? node.nextId ?? node.id;
        continue;
      }
      throw new Error(`record builder unexpectedly crossed ${node.id}`);
    }

    if (node.type === 'observer-echo') {
      nodeId = node.nextId ?? node.id;
      continue;
    }

    stats = addAnchor(stats, node);
    cycle = markCycleNodeCompleted(cycle, node.id);
    nodeId = node.nextId ?? node.id;
  }

  check(guard < 6000, `record builder did not reach ${boundary}`);
  return createFailedCycleRecord(cycle, cause, 1_700_000_100_000);
}

const tests: Array<[string, () => void]> = [];
function test(name: string, run: () => void) { tests.push([name, run]); }

test('01 第三章均压失败触发致死循环', () => {
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'bulkhead-isolation', routeKey: 'fatal', failureReason: 'wrong_observation_door',
  });
  check(stats.earlyFailureCause === 'bulkhead_failure' && stats.pendingReboot08, 'bulkhead fatal was not armed');
});

test('02 第三章均压超时触发致死循环', () => {
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'bulkhead-isolation', routeKey: 'fatal', failureReason: 'seal_timeout',
  });
  check(stats.bulkheadFailureReason === 'seal_timeout' && stats.pendingReboot08, 'bulkhead timeout was not fatal');
});

test('03 第五章第二次供能失败触发致死循环', () => {
  const first = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing', routeKey: 'fail', attempt: 1, failureReason: 'life_support_below_minimum',
  });
  const second = applySpecialInteractionCompletion(first, {
    kind: 'power-routing', routeKey: 'fatal', attempt: 2, failureReason: 'core_scan_underpowered',
  });
  check(second.earlyFailureCause === 'power_routing_failure' && second.powerRoutingAttempt === 2, 'second power failure was not fatal');
});

test('04 第五章第二次供能超时触发致死循环', () => {
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing', routeKey: 'fatal', attempt: 2, failureReason: 'timeout',
  });
  check(stats.powerRoutingResult === 'fatal' && stats.earlyFailureCause === 'power_routing_failure', 'second power timeout was not fatal');
});

const fatalRecord = buildRecordedCycle('bulkhead_failure');
const powerRecord = buildRecordedCycle('power_routing_failure');
const protocolRecord = buildRecordedCycle('protocol_rollback');
const fatalStats = applySpecialInteractionCompletion(freshStats(), {
  kind: 'bulkhead-isolation', routeKey: 'fatal', failureReason: 'seal_timeout',
});
const fatalCycle = {
  ...createCurrentCycleState(7, undefined, 1_700_000_000_000),
  ...fatalRecord,
  cycleStateVersion: 1 as const,
  currentRebootNumber: 7,
  syncAvailable: false,
  syncActive: false,
  syncInterrupted: false,
  syncCursor: 0,
  currentCycleDeviationStarted: false,
};

test('05 致死归档解锁第八次循环状态且非致死状态不会误触发', () => {
  clearAllData();
  const save = createSaveData(
    'CH03-0161', [], createDefaultNovaAvatarState(), defaultContactStage,
    fatalStats, createDefaultChatDeliveryRuntime(), fatalCycle,
  );
  saveGame(save);
  const progress = archiveFatalCycle(save);
  check(progress.reboot08TitleUnlocked && progress.fatalEndingTriggered, 'reboot08 title was not unlocked');
  check(progress.fatalRebootCount === 1 && progress.failedCycles.length === 1, 'fatal history count mismatch');
  const before = progress.fatalRebootCount;
  const nonFatal = createSaveData('END-N-0013', [], createDefaultNovaAvatarState(), defaultContactStage, freshStats());
  check(archiveFatalCycle(nonFatal).fatalRebootCount === before, 'non-fatal ending changed fatal count');
});

test('06 第八次循环使用正式中英文图片且旧文字标题层已撤回', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const component = fs.readFileSync(path.join(root, 'src/game/components/GameTitle.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  check(!component.includes('menu-title-eight-lockup') && !component.includes('menu-title-eight-en'), 'withdrawn Reboot 08 title overlay remains');
  check(!css.includes('.menu-title-eight-lockup') && !css.includes('.menu-title-eight-en'), 'withdrawn Reboot 08 title styles remain');
  check(component.includes('menu-title-official08'), 'official Reboot 08 image state is missing');
  check(css.includes('eighth_reboot_title_wordmark_zh.png') && css.includes('eighth_reboot_title_wordmark_en.png'), 'official bilingual title assets are not wired');
  check(fs.existsSync(path.join(root, 'public/assets/eighth_reboot_title_wordmark_zh.png')), 'official Chinese title asset is missing');
  check(fs.existsSync(path.join(root, 'public/assets/eighth_reboot_title_wordmark_en.png')), 'official English title asset is missing');
  check(app.includes("title={t(isReboot08Menu ? 'menu.title08' : 'menu.title')}"), 'Reboot 08 accessible title is not localized');
});

test('07 刷新后仍保持第八次状态', () => {
  check(loadPersistentProgress().reboot08TitleUnlocked, 'persistent title state disappeared on reload');
});

test('08 关闭并重新进入后仍保持第八次状态', () => {
  const snapshot = storage.snapshot();
  const reopened = new TestStorage();
  reopened.restore(snapshot);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: reopened });
  check(loadPersistentProgress().currentRebootNumber === 8, 'reopened storage did not retain reboot 08');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
});

test('09 死亡前活动存档不可继续', () => {
  check(loadGame() === null, 'fatal active save remained loadable');
});

test('10 重新接入建立 REBOOT 08 序章', () => {
  const pro0001Node = storyNodeMap.get('PRO-0001');
  check(pro0001Node, 'PRO-0001 missing');
  const reboot08 = getStoryNodeForReboot(pro0001Node, 8);
  check(/(?:接入编号：|access number: )08/i.test(reboot08.content), 'PRO-0001 was not rewritten to access 08');
  check(!/(?:接入编号：|access number: )07/i.test(reboot08.content), 'PRO-0001 still exposes access 07');
});

test('11 同步恢复上一轮选择、互动与已完成节点', () => {
  const base = createCurrentCycleState(8, powerRecord, 1_700_001_000_000);
  const replay = replayFailedCycle(powerRecord, storyNodeMap, createNewGameStats(), base);
  check(replay.reachedBoundary, 'sync did not reach the power boundary');
  check(replay.cycleState.choiceHistory.length === powerRecord.choiceHistory.length, 'choice history was not restored');
  check(replay.cycleState.interactionResults.some(result => result.kind === 'bulkhead-isolation'), 'non-fatal interaction was not restored');
});

test('12 同步在对应致死互动之前停止', () => {
  const airlock = replayFailedCycle(fatalRecord, storyNodeMap, createNewGameStats(), createCurrentCycleState(8, fatalRecord));
  const power = replayFailedCycle(powerRecord, storyNodeMap, createNewGameStats(), createCurrentCycleState(8, powerRecord));
  check(airlock.nextNodeId === 'CH03-0144', 'airlock sync crossed fatal boundary');
  check(power.nextNodeId === 'CH05B-0017', 'power sync crossed fatal boundary');
});

test('13 同步自动经过非致死互动', () => {
  const replay = replayFailedCycle(powerRecord, storyNodeMap, createNewGameStats(), createCurrentCycleState(8, powerRecord));
  check(replay.stats.bulkheadResult === 'safe', 'bulkhead result was not replayed');
  check(replay.stats.jointAuthorizationCompleted, 'joint authorization was not replayed');
});

test('14 同步可在记录中途停止', () => {
  const full = replayFailedCycle(powerRecord, storyNodeMap, createNewGameStats(), createCurrentCycleState(8, powerRecord));
  const partial = replayFailedCycle(powerRecord, storyNodeMap, createNewGameStats(), createCurrentCycleState(8, powerRecord), 18);
  check(!partial.reachedBoundary && partial.events.length === 18, 'partial sync did not stop at the requested cursor');
  check(partial.cycleState.completedNodeIds.length < full.cycleState.completedNodeIds.length, 'partial sync restored the full cycle');
});

test('15 中断后重新选择可检测偏离', () => {
  const previous = powerRecord.choiceHistory[0];
  check(previous, 'record has no choices');
  check(choiceDeviatesFromRecord(powerRecord, previous.nodeId, `${previous.choiceId}-changed`), 'changed choice was not detected');
  check(!choiceDeviatesFromRecord(powerRecord, previous.nodeId, previous.choiceId), 'same choice was marked as deviation');
});

test('16 中断后的当前循环从投射前缀重算数值', () => {
  const contaminated = { ...createNewGameStats(), trust: 6, memory: 6, attachment: 6 };
  const partial = replayFailedCycle(powerRecord, storyNodeMap, createNewGameStats(), createCurrentCycleState(8, powerRecord), 18);
  check(partial.stats.trust !== contaminated.trust || partial.stats.attachment !== contaminated.attachment, 'hidden relationship values leaked into recalculation');
  check(partial.cycleState.currentRebootNumber === 8, 'recalculation lost reboot number');
});

test('17 普通跳过允许完整已读文本', () => {
  const pro0001Node = storyNodeMap.get('PRO-0001');
  check(pro0001Node, 'PRO-0001 missing');
  check(!shouldStopReadSkip(pro0001Node, ['PRO-0001']), 'read text incorrectly stopped read-skip');
});

test('18 普通跳过遇到新内容、选项或特殊互动停止', () => {
  const pro0001Node = storyNodeMap.get('PRO-0001');
  const pro0012Node = storyNodeMap.get('PRO-0012');
  const airlock = storyNodeMap.get('CH03-0144');
  check(pro0001Node && pro0012Node && airlock, 'skip boundary fixtures missing');
  check(shouldStopReadSkip(pro0001Node, []), 'new text did not stop read-skip');
  check(shouldStopReadSkip(pro0012Node, ['PRO-0012']), 'choice did not stop read-skip');
  check(shouldStopReadSkip(airlock, ['CH03-0144']), 'interaction did not stop read-skip');
});

test('19 拒绝关闭协议进入回溯且同步停在最终协议选择前', () => {
  check(protocolRecord.failedInteractionId === 'CH05B-0293', 'protocol rollback failure id mismatch');
  const replay = replayFailedCycle(
    protocolRecord,
    storyNodeMap,
    createNewGameStats(),
    createCurrentCycleState(8, protocolRecord),
  );
  check(replay.reachedBoundary && replay.nextNodeId === 'CH05B-0293', 'protocol sync crossed final protocol choice');
});

test('20 上一轮同步不记录或回放 Observer 残响', () => {
  check(!protocolRecord.completedNodeIds.includes('CH02-0242'), 'observer echo leaked into completed nodes');
  const replay = replayFailedCycle(
    protocolRecord,
    storyNodeMap,
    createNewGameStats(),
    createCurrentCycleState(8, protocolRecord),
  );
  check(!replay.events.some(event => event.nodeId === 'CH02-0242'), 'observer echo leaked into sync events');
  check(!replay.cycleState.completedNodeIds.includes('CH02-0242'), 'observer echo leaked into replay state');
});

let passed = 0;
for (const [name, run] of tests) {
  try {
    run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}
console.log(`\nFatal reboot cycle checks: ${passed}/${tests.length} passed.`);
