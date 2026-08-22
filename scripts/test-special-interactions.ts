import assert from 'node:assert/strict';
import { createDefaultNovaAvatarState } from '../src/game/avatarState.ts';
import { createDefaultChatDeliveryRuntime } from '../src/game/delivery/state.ts';
import { determineEnding } from '../src/game/endings.ts';
import {
  applySpecialInteractionCompletion,
  evaluateBulkheadDecision,
  findPowerFailureReason,
  isPowerAllocationStable,
  matchesInteractionCondition,
  matchesInteractionPrerequisite,
  POWER_STAGE_THRESHOLDS,
  rebalancePowerAllocation,
  type PowerAllocation,
  type PowerChannel,
  type PowerStage,
} from '../src/game/interactions/logic.ts';
import { applyPersistentStoryNodeEffects } from '../src/game/state.ts';
import {
  createSaveData,
  defaultStats,
  migrateSaveData,
  normalizeGameStats,
  resolveResumeNodeId,
} from '../src/game/storage.ts';
import { storyNodes } from '../src/game/story.ts';
import type { GameStats, SealableMemoryAnchor } from '../src/game/types.ts';

const scenarios: string[] = [];

function scenario(name: string, test: () => void) {
  test();
  scenarios.push(name);
}

function freshStats(patch: Partial<GameStats> = {}): GameStats {
  return {
    ...defaultStats,
    memoryAnchors: [...defaultStats.memoryAnchors],
    unlockedArchives: [...defaultStats.unlockedArchives],
    endingsUnlocked: [...defaultStats.endingsUnlocked],
    ...patch,
  };
}

const stablePower: Record<PowerStage, PowerAllocation> = {
  transit: { lifeSupport: 55, communications: 25, coreScan: 20 },
  core_read: { lifeSupport: 35, communications: 25, coreScan: 40 },
};
const failedPower: Record<PowerStage, PowerAllocation> = {
  transit: { lifeSupport: 40, communications: 30, coreScan: 30 },
  core_read: { lifeSupport: 35, communications: 25, coreScan: 40 },
};

scenario('01 均压安全解', () => {
  assert.deepEqual(evaluateBulkheadDecision({
    sealTarget: 'observation',
    equalizeTarget: 'hallway',
    transitionPressure: 96,
    elapsedMs: 8_000,
  }), { result: 'safe' });
});

scenario('02 均压迟缓或压力偏低只造成受伤', () => {
  assert.equal(evaluateBulkheadDecision({
    sealTarget: 'observation', equalizeTarget: 'hallway', elapsedMs: 18_000,
  }).result, 'injured');
  assert.equal(evaluateBulkheadDecision({
    sealTarget: 'observation', equalizeTarget: 'hallway', transitionPressure: 91, elapsedMs: 8_000,
  }).result, 'injured');
});

scenario('03 均压错误舱门与错误排放为致死', () => {
  assert.deepEqual(evaluateBulkheadDecision({
    sealTarget: 'hallway', equalizeTarget: 'hallway', elapsedMs: 5_000,
  }), { result: 'fatal', failureReason: 'hallway_sealed' });
  assert.deepEqual(evaluateBulkheadDecision({
    sealTarget: 'observation', equalizeTarget: 'purge', elapsedMs: 5_000,
  }), { result: 'fatal', failureReason: 'transition_purged' });
});

scenario('04 均压超时进入致死回溯', () => {
  const evaluation = evaluateBulkheadDecision({
    sealTarget: 'observation', equalizeTarget: 'hallway', elapsedMs: 30_000, timedOut: true,
  });
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'bulkhead-isolation', routeKey: 'fatal', failureReason: evaluation.failureReason,
  });
  assert.equal(evaluation.failureReason, 'seal_timeout');
  assert.equal(stats.earlyFailureCause, 'bulkhead_failure');
  assert.equal(stats.pendingReboot08, true);
});

scenario('05 密封记录顺序成功后开放一次性静态授权', () => {
  const retryBase = freshStats();
  assert.equal(applySpecialInteractionCompletion(retryBase, {
    kind: 'sealed-record-order', routeKey: 'retry',
  }), retryBase);
  const success = applySpecialInteractionCompletion(retryBase, {
    kind: 'sealed-record-order', routeKey: 'success',
  });
  assert.equal(success.jointAuthorizationCompleted, true);
  assert.equal(success.criticalLogUnlocked, true);
  assert.equal(success.nova06RollbackAuthorizationAvailable, true);
});

scenario('06 受损第七次不能重新获得 NOVA-06 授权', () => {
  const success = applySpecialInteractionCompletion(freshStats({ damagedSeventh: true }), {
    kind: 'sealed-record-order', routeKey: 'success',
  });
  assert.equal(success.jointAuthorizationCompleted, true);
  assert.equal(success.nova06RollbackAuthorizationAvailable, false);
});

scenario('07 供能第一次成功直接注销未使用授权', () => {
  const stats = applySpecialInteractionCompletion(freshStats({
    nova06RollbackAuthorizationAvailable: true,
  }), {
    kind: 'power-routing', routeKey: 'success', attempt: 1,
  });
  assert.equal(stats.powerRoutingResult, 'first_success');
  assert.equal(stats.nova06RollbackAuthorizationAvailable, false);
  assert.equal(stats.nova06RollbackAuthorizationUsed, false);
  assert.equal(stats.aiEmergencyRollbackExecuted, false);
});

scenario('08 第一次错误供能由舰载 AI 消耗静态授权撤回', () => {
  const reason = findPowerFailureReason(failedPower);
  const stats = applySpecialInteractionCompletion(freshStats({
    nova06RollbackAuthorizationAvailable: true,
  }), {
    kind: 'power-routing', routeKey: 'fail', attempt: 1, failureReason: reason,
  });
  assert.equal(reason, 'life_support_below_minimum');
  assert.equal(stats.powerFirstFailureReason, reason);
  assert.equal(stats.nova06RollbackAuthorizationAvailable, false);
  assert.equal(stats.nova06RollbackAuthorizationUsed, true);
  assert.equal(stats.aiEmergencyRollbackExecuted, true);
  assert.equal(stats.pendingReboot08, false);
});

scenario('09 最终供能成功与失败严格分流', () => {
  const recovered = applySpecialInteractionCompletion(freshStats({ powerRoutingAttempt: 1 }), {
    kind: 'power-routing', routeKey: 'success', attempt: 2,
  });
  const fatal = applySpecialInteractionCompletion(freshStats({ powerRoutingAttempt: 1 }), {
    kind: 'power-routing', routeKey: 'fatal', attempt: 2, failureReason: 'timeout',
  });
  assert.equal(recovered.powerRoutingResult, 'retry_success');
  assert.equal(recovered.pendingReboot08, false);
  assert.equal(fatal.powerRoutingResult, 'fatal');
  assert.equal(fatal.earlyFailureCause, 'power_routing_failure');
  assert.equal(fatal.pendingReboot08, true);
});

scenario('10 供能阈值与总功率守恒', () => {
  assert.equal(findPowerFailureReason(stablePower), undefined);
  assert.equal(findPowerFailureReason(stablePower, true), 'timeout');
  const channels: PowerChannel[] = ['lifeSupport', 'communications', 'coreScan'];
  let allocation: PowerAllocation = { lifeSupport: 34, communications: 33, coreScan: 33 };
  for (const channel of channels) {
    for (const value of [0, 17, 45, 73, 100]) {
      allocation = rebalancePowerAllocation(allocation, channel, value);
      assert.equal(channels.reduce((sum, key) => sum + allocation[key], 0), 100);
    }
  }
  assert.equal(isPowerAllocationStable(stablePower.transit, POWER_STAGE_THRESHOLDS.transit), true);
  assert.equal(isPowerAllocationStable(failedPower.transit, POWER_STAGE_THRESHOLDS.transit), false);
});

scenario('11 三种记忆锚点可封存并在终章恢复', () => {
  for (const anchor of ['maintenance_board', 'white_flower', 'goodnight'] as SealableMemoryAnchor[]) {
    const before = freshStats({ memoryAnchors: ['n7', 'white_flower', 'first_message'] });
    const sealed = applySpecialInteractionCompletion(before, {
      kind: 'memory-seal', routeKey: anchor, anchor,
    });
    const restored = applySpecialInteractionCompletion(sealed, {
      kind: 'memory-restore', routeKey: anchor, anchor,
    });
    assert.equal(sealed.temporaryAnchorSealed, anchor);
    assert.deepEqual(sealed.memoryAnchors, before.memoryAnchors);
    assert.equal(restored.memoryRestoreResult, anchor);
    assert.equal(restored.temporaryAnchorRestored, true);
  }
});

scenario('12 航线锁定的重试、安全与致死结果互斥', () => {
  const base = freshStats();
  assert.equal(applySpecialInteractionCompletion(base, {
    kind: 'course-lock', routeKey: 'retry',
  }), base);
  assert.equal(applySpecialInteractionCompletion(base, {
    kind: 'course-lock', routeKey: 'success',
  }).courseLockCompleted, true);
  const fatal = applySpecialInteractionCompletion(base, {
    kind: 'course-lock', routeKey: 'fatal',
  });
  assert.equal(fatal.earlyFailureCause, 'course_lock_failure');
  assert.equal(fatal.pendingReboot08, true);
});

scenario('13 第七协议物理隔离成功与失败互斥', () => {
  assert.equal(applySpecialInteractionCompletion(freshStats(), {
    kind: 'protocol-cut', routeKey: 'success',
  }).protocolCutCompleted, true);
  const fatal = applySpecialInteractionCompletion(freshStats(), {
    kind: 'protocol-cut', routeKey: 'fatal',
  });
  assert.equal(fatal.earlyFailureCause, 'protocol_cut_failure');
  assert.equal(fatal.pendingReboot08, true);
});

scenario('14 互动条件与直接状态条件读取当前循环字段', () => {
  const stats = freshStats({
    bulkheadResult: 'injured',
    bulkheadInjured: true,
    jointAuthorizationCompleted: true,
    courseLockCompleted: true,
  });
  assert.equal(matchesInteractionCondition(stats, {
    kind: 'bulkhead-isolation', routeKey: 'injured',
  }), true);
  assert.equal(matchesInteractionCondition(stats, {
    kind: 'sealed-record-order', routeKey: 'success',
  }), true);
  assert.equal(matchesInteractionCondition(stats, {
    kind: 'course-lock', routeKey: 'success',
  }), true);
  assert.equal(matchesInteractionPrerequisite(stats, {
    key: 'bulkheadInjured', value: true,
  }), true);
});

scenario('15 供能错误后的状态可以存档并恢复', () => {
  const stats = applySpecialInteractionCompletion(freshStats({
    nova06RollbackAuthorizationAvailable: true,
    gravityArrayDegraded: true,
  }), {
    kind: 'power-routing', routeKey: 'fail', attempt: 1, failureReason: 'core_scan_underpowered',
  });
  const save = createSaveData(
    'CH05B-0020',
    [],
    createDefaultNovaAvatarState(),
    'verified',
    stats,
    createDefaultChatDeliveryRuntime(),
  );
  const restored = migrateSaveData(JSON.parse(JSON.stringify(save)));
  assert.ok(restored);
  assert.equal(restored.stats.nova06RollbackAuthorizationUsed, true);
  assert.equal(restored.stats.aiEmergencyRollbackExecuted, true);
  assert.equal(restored.stats.powerFirstFailureReason, 'core_scan_underpowered');
  assert.equal(restored.stats.gravityArrayDegraded, true);
  assert.equal(resolveResumeNodeId(restored), 'CH05B-0020');
});

scenario('16 旧供能字段只用于迁移且不会恢复旧接管概念', () => {
  const normalized = normalizeGameStats({
    ...defaultStats,
    nova06PowerOverrideAvailable: true,
    nova06PowerOverrideUsed: true,
  } as GameStats & Record<string, unknown>);
  assert.equal(normalized.nova06RollbackAuthorizationAvailable, false);
  assert.equal(normalized.nova06RollbackAuthorizationUsed, true);
  assert.equal(normalized.aiEmergencyRollbackExecuted, true);
});

scenario('17 重力阵列降级与终章复位不改写舱压判定', () => {
  const base = freshStats({ bulkheadResult: 'safe' });
  const degraded = applyPersistentStoryNodeEffects(base, 'CH05B-GRAV-0001');
  const reset = applyPersistentStoryNodeEffects(degraded, 'FIN-0001');
  assert.equal(degraded.gravityArrayDegraded, true);
  assert.equal(degraded.bulkheadResult, 'safe');
  assert.equal(reset.gravityArrayDegraded, false);
  assert.equal(reset.bulkheadResult, 'safe');
});

scenario('18 普通、真、坏结局的当前条件可区分', () => {
  assert.equal(determineEnding(freshStats({
    acceptFarewell: true,
    finalChoice: 'accept_farewell',
    firstMessageCorrect: false,
  })), 'normal');
  assert.equal(determineEnding(freshStats({
    trust: 4,
    memory: 4,
    acceptFarewell: true,
    finalChoice: 'accept_farewell',
    firstMessageCorrect: true,
    memoryAnchors: ['first_message', 'n7', 'white_flower', 'goodnight', 'observatory'],
  })), 'true');
  assert.equal(determineEnding(freshStats({
    acceptFarewell: false,
    finalChoice: 'refuse_farewell',
  })), 'bad');
});

scenario('19 所有剧情跳转目标存在', () => {
  const nodeMap = new Map(storyNodes.map(node => [node.id, node]));
  assert.equal(nodeMap.size, storyNodes.length, 'Story node IDs must be unique');
  for (const node of storyNodes) {
    const targets = [
      node.nextId,
      node.timeoutNextId,
      node.conditionElseNextId,
      node.directConditionNextId,
      ...Object.values(node.interactionNextIds ?? {}),
      ...(node.choices ?? []).map(choice => choice.nextId),
    ];
    for (const target of targets) {
      if (!target || target === 'MENU' || target.startsWith('{')) continue;
      assert.ok(nodeMap.has(target), `${node.id} points to missing node ${target}`);
    }
  }
});

scenario('20 正式高潮互动节点与类型齐全', () => {
  const interactionNodes = storyNodes.filter(node => node.type === 'interaction' && node.interactionKind);
  const interactionKinds = new Set(interactionNodes.map(node => node.interactionKind));
  assert.equal(interactionNodes.length, 9);
  assert.deepEqual([...interactionKinds].sort(), [
    'bulkhead-isolation',
    'course-lock',
    'memory-restore',
    'memory-seal',
    'power-routing',
    'protocol-cut',
    'sealed-record-order',
  ]);
  for (const id of ['CH03-0144', 'CH05A-0016', 'CH05B-0016', 'CH05B-0028', 'CH05B-0032', 'CH05B-0069', 'CH05B-0080', 'CH05B-0102', 'FIN-0010']) {
    assert.ok(storyNodes.some(node => node.id === id && node.interactionKind), `Missing formal interaction ${id}`);
  }
});

console.log(`Special interaction scenarios passed: ${scenarios.length}/20`);
for (const name of scenarios) console.log(`  PASS ${name}`);
