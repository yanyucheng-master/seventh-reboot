import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultNovaAvatarState } from '../src/game/avatarState';
import {
  createCurrentCycleState,
  createStableCheckpointSnapshot,
  getFailedInteractionId,
  getStoryNodeForReboot,
  markCycleNodeCompleted,
  restoreDamagedSeventhCheckpoint,
  shouldStopReadSkip,
} from '../src/game/cycleState';
import { createDefaultChatDeliveryRuntime } from '../src/game/delivery/state';
import { applySpecialInteractionCompletion } from '../src/game/interactions/logic';
import { storyNodeMap } from '../src/game/story';
import {
  archiveFatalCycle,
  clearAllData,
  createSaveData,
  defaultContactStage,
  defaultStats,
  loadGame,
  loadPersistentProgress,
  markReboot08FallbackUsed,
  saveGame,
} from '../src/game/storage';
import type { CurrentCycleState, DisplayMessage, GameStats, SaveData } from '../src/game/types';

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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

function makeFatalSave(): SaveData {
  const stats: GameStats = {
    ...freshStats(),
    trust: 3,
    memory: 2,
    attachment: 2,
    nova06RollbackAuthorizationAvailable: true,
  };
  const messages: DisplayMessage[] = [{
    id: 'fixture-message',
    speaker: 'nova',
    type: 'text',
    content: '我把备用线路接上了',
    sourceNodeId: 'CH05B-0005',
    isNew: true,
  }];
  const avatarState = createDefaultNovaAvatarState();
  const deliveryRuntime = createDefaultChatDeliveryRuntime();
  const completedCycle = markCycleNodeCompleted(
    createCurrentCycleState(7, undefined, 1_700_000_000_000),
    'CH05B-0005',
  );
  const checkpoint = createStableCheckpointSnapshot(
    'CH05B-0028',
    completedCycle,
    stats,
    messages,
    defaultContactStage,
    avatarState,
    deliveryRuntime,
    1_700_000_050_000,
  );
  const cycle: CurrentCycleState = { ...completedCycle, lastStableCheckpoint: checkpoint };
  const fatalStats = {
    ...applySpecialInteractionCompletion(stats, {
      kind: 'power-routing',
      routeKey: 'fatal',
      attempt: 2,
      failureReason: 'timeout',
    }),
    fatalSourceNodeId: 'CH05B-0028',
  };
  return createSaveData(
    'END-B-0001',
    messages,
    avatarState,
    defaultContactStage,
    fatalStats,
    deliveryRuntime,
    cycle,
  );
}

function seedFatalArchive() {
  clearAllData();
  const fatalSave = makeFatalSave();
  return { fatalSave, progress: archiveFatalCycle(fatalSave) };
}

const tests: Array<[string, () => void]> = [];
function test(name: string, run: () => void) { tests.push([name, run]); }

test('01 隔离舱致死失败与超时都会启动回溯', () => {
  const wrongDoor = applySpecialInteractionCompletion(freshStats(), {
    kind: 'bulkhead-isolation', routeKey: 'fatal', failureReason: 'wrong_observation_door',
  });
  const timeout = applySpecialInteractionCompletion(freshStats(), {
    kind: 'bulkhead-isolation', routeKey: 'fatal', failureReason: 'seal_timeout',
  });
  check(wrongDoor.earlyFailureCause === 'bulkhead_failure' && wrongDoor.pendingReboot08, 'wrong-door fatal was not armed');
  check(timeout.bulkheadFailureReason === 'seal_timeout' && timeout.pendingReboot08, 'bulkhead timeout was not armed');
});

test('02 供能第二次失败与超时都会启动回溯', () => {
  const secondFailure = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing', routeKey: 'fatal', attempt: 2, failureReason: 'core_scan_underpowered',
  });
  const timeout = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing', routeKey: 'fatal', attempt: 2, failureReason: 'timeout',
  });
  check(secondFailure.earlyFailureCause === 'power_routing_failure' && secondFailure.pendingReboot08, 'second power failure was not fatal');
  check(timeout.powerRoutingResult === 'fatal' && timeout.pendingReboot08, 'second power timeout was not fatal');
});

test('03 非致死失败不会误触发第八次重启', () => {
  const firstFailure = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing', routeKey: 'fail', attempt: 1, failureReason: 'life_support_below_minimum',
  });
  const orderRetry = applySpecialInteractionCompletion(freshStats(), {
    kind: 'sealed-record-order', routeKey: 'retry',
  });
  check(!firstFailure.pendingReboot08 && !firstFailure.earlyFailureCause, 'first power failure became fatal');
  check(!orderRetry.pendingReboot08 && !orderRetry.earlyFailureCause, 'record-order retry became fatal');
});

test('04 致死记录保留最近稳定检查点', () => {
  const save = makeFatalSave();
  const progress = archiveFatalCycle(save);
  const record = progress.failedCycles.at(-1);
  check(record?.lastStableCheckpoint?.nodeId === 'CH05B-0028', 'stable checkpoint was not archived');
  check(record.lastStableCheckpoint.messages[0]?.isNew === false, 'checkpoint retained transient new-message state');
  check(record.lastStableCheckpoint.stats.trust === 3, 'checkpoint relationship state changed during archive');
});

test('05 第八次标题、失败历史与刷新持久化', () => {
  const { progress } = seedFatalArchive();
  check(progress.reboot08TitleUnlocked && progress.currentRebootNumber === 8, 'Reboot 08 title was not unlocked');
  check(progress.fatalRebootCount === 1 && progress.failedCycles.length === 1, 'fatal history count mismatch');
  check(loadGame() === null, 'fatal active save remained loadable');
  const snapshot = storage.snapshot();
  const reopened = new TestStorage();
  reopened.restore(snapshot);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: reopened });
  check(loadPersistentProgress().reboot08TitleUnlocked, 'Reboot 08 state disappeared after reopening');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
});

test('06 一次性回退恢复受损第七次且清除旧授权', () => {
  const { progress } = seedFatalArchive();
  const restored = restoreDamagedSeventhCheckpoint(progress.failedCycles.at(-1));
  check(restored, 'damaged seventh checkpoint could not be restored');
  check(restored.nodeId === 'CH05B-0028' && restored.cycleState.currentRebootNumber === 7, 'fallback target mismatch');
  check(restored.stats.damagedSeventh && restored.stats.binaryScarUI, 'damaged presentation state is missing');
  check(!restored.stats.nova06RollbackAuthorizationAvailable, 'NOVA-06 rollback authorization survived fallback');
  check(restored.stats.nova06RecordingDamaged && restored.stats.reboot08FallbackUsed, 'fallback cost was not applied');
  check(!restored.cycleState.lastStableCheckpoint, 'fallback remained recursively reusable');
});

test('07 回退消费标记全局持久化且受损存档仍可读取', () => {
  const { progress } = seedFatalArchive();
  const restored = restoreDamagedSeventhCheckpoint(progress.failedCycles.at(-1));
  check(restored, 'missing fallback fixture');
  markReboot08FallbackUsed();
  const damagedSave = createSaveData(
    restored.nodeId,
    restored.messages,
    restored.avatarState,
    restored.contactStage,
    restored.stats,
    restored.deliveryRuntime,
    restored.cycleState,
  );
  saveGame(damagedSave);
  const loaded = loadGame();
  check(loadPersistentProgress().reboot08FallbackUsed, 'fallback usage did not persist');
  check(loaded?.cycleState.currentRebootNumber === 7 && loaded.stats.damagedSeventh, 'damaged seventh save was rejected');
});

test('08 受损第七次再次死亡进入永久断联且不会生成第二个回退点', () => {
  const { progress } = seedFatalArchive();
  const restored = restoreDamagedSeventhCheckpoint(progress.failedCycles.at(-1));
  check(restored, 'missing damaged seventh fixture');
  markReboot08FallbackUsed();
  const secondFatalStats = {
    ...applySpecialInteractionCompletion(restored.stats, {
      kind: 'power-routing', routeKey: 'fatal', attempt: 2, failureReason: 'timeout',
    }),
    fatalSourceNodeId: 'CH05B-0028',
  };
  const secondSave = createSaveData(
    'END-B-0001',
    restored.messages,
    restored.avatarState,
    restored.contactStage,
    secondFatalStats,
    restored.deliveryRuntime,
    restored.cycleState,
  );
  const afterSecondDeath = archiveFatalCycle(secondSave);
  check(afterSecondDeath.fatalRebootCount === 2 && afterSecondDeath.failedCycles.length === 2, 'second fatal cycle was not archived');
  check(!afterSecondDeath.failedCycles.at(-1)?.lastStableCheckpoint, 'second death created another fallback checkpoint');
  check(afterSecondDeath.reboot08FallbackUsed, 'permanent disconnect lost fallback consumption state');
});

test('09 REBOOT 08 空链路与一次性 07-DAMAGED 路由完整', () => {
  check(storyNodeMap.get('END-B-0015')?.type === 'route', 'empty-link route node is missing');
  check(storyNodeMap.get('END-B-0020')?.type === 'title-state', 'binary fallback transition is missing');
  check(storyNodeMap.get('END-B-0021')?.stateWrites?.reboot08FallbackUsed === true, 'fallback state write is missing');
  check(storyNodeMap.get('END-B-0022')?.dynamicNextKey === 'lastStableCheckpoint', 'checkpoint jump is missing');
  check(storyNodeMap.get('END-B-0028')?.type === 'end', 'permanent empty ending is missing');
});

test('10 第八次标题使用正式双语图片且没有旧叠字方案', () => {
  const component = fs.readFileSync(path.join(root, 'src/game/components/GameTitle.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
  check(component.includes('menu-title-official08'), 'official Reboot 08 title state is missing');
  check(!component.includes('menu-title-eight-lockup') && !component.includes('menu-title-eight-en'), 'withdrawn title overlay remains');
  check(css.includes('eighth_reboot_title_wordmark_zh.png') && css.includes('eighth_reboot_title_wordmark_en.png'), 'official title assets are not wired');
  check(fs.existsSync(path.join(root, 'public/assets/eighth_reboot_title_wordmark_zh.png')), 'Chinese Reboot 08 asset is missing');
  check(fs.existsSync(path.join(root, 'public/assets/eighth_reboot_title_wordmark_en.png')), 'English Reboot 08 asset is missing');
});

test('11 新回退流程不再调用旧整轮同步界面', () => {
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  check(!app.includes('CycleSyncOverlay') && !app.includes('replayFailedCycle'), 'legacy full-cycle replay remains in runtime');
  check(app.includes('restoreDamagedSeventhCheckpoint') && app.includes('RebootFallbackOverlay'), 'damaged fallback runtime is not connected');
  check(!fs.existsSync(path.join(root, 'src/game/components/CycleSyncOverlay.tsx')), 'legacy sync overlay file still exists');
});

test('12 序章编号与致死边界映射准确', () => {
  const prologue = storyNodeMap.get('PRO-0001');
  check(prologue, 'PRO-0001 missing');
  check(getStoryNodeForReboot(prologue, 7).content.includes('07'), 'Reboot 07 access number was not resolved');
  check(getStoryNodeForReboot(prologue, 8).content.includes('08'), 'Reboot 08 access number was not resolved');
  check(getFailedInteractionId('bulkhead_failure') === 'CH03-0144', 'bulkhead checkpoint mapping mismatch');
  check(getFailedInteractionId('power_routing_failure') === 'CH05B-0028', 'power checkpoint mapping mismatch');
  check(getFailedInteractionId('course_lock_failure') === 'CH05B-0080', 'course checkpoint mapping mismatch');
  check(getFailedInteractionId('protocol_rollback') === 'CH05B-0091', 'protocol rollback checkpoint mapping mismatch');
  check(getFailedInteractionId('protocol_cut_failure') === 'CH05B-0102', 'protocol cut checkpoint mapping mismatch');
});

test('13 普通已读跳过遇到新内容、选择与互动都会停止', () => {
  const text = storyNodeMap.get('PRO-0001');
  const choice = storyNodeMap.get('PRO-0012');
  const interaction = storyNodeMap.get('CH03-0144');
  check(text && choice && interaction, 'read-skip fixtures are missing');
  check(!shouldStopReadSkip(text, ['PRO-0001']), 'read text incorrectly stopped read-skip');
  check(shouldStopReadSkip(text, []), 'new text did not stop read-skip');
  check(shouldStopReadSkip(choice, ['PRO-0012']), 'choice did not stop read-skip');
  check(shouldStopReadSkip(interaction, ['CH03-0144']), 'interaction did not stop read-skip');
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
