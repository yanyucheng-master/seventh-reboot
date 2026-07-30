import assert from 'node:assert/strict';
import { createDefaultNovaAvatarState } from '../src/game/avatarState.ts';
import { createDefaultChatDeliveryRuntime } from '../src/game/delivery/state.ts';
import { determineEnding } from '../src/game/endings.ts';
import {
  applySpecialInteractionCompletion,
  evaluateBulkheadDecision,
  findPowerFailureReason,
  isCriticalLogPassword,
  isPowerAllocationStable,
  matchesInteractionCondition,
  matchesInteractionPrerequisite,
  normalizeAuthorizationKey,
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

scenario('01 均压一次成功', () => {
  assert.deepEqual(evaluateBulkheadDecision({
    sealTarget: 'observation',
    equalizeTarget: 'hallway',
    transitionPressure: 96,
    elapsedMs: 8_000,
  }), { result: 'safe' });
});

scenario('02 均压次优或受伤', () => {
  const evaluation = evaluateBulkheadDecision({
    sealTarget: 'observation',
    equalizeTarget: 'hallway',
    elapsedMs: 18_000,
  });
  assert.equal(evaluation.result, 'injured');
  assert.equal(evaluateBulkheadDecision({
    sealTarget: 'observation',
    equalizeTarget: 'hallway',
    transitionPressure: 91,
    elapsedMs: 8_000,
  }).result, 'injured');
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'bulkhead-isolation',
    routeKey: 'injured',
  });
  assert.equal(stats.bulkheadInjured, true);
});

scenario('03 均压失败', () => {
  const evaluation = evaluateBulkheadDecision({
    sealTarget: 'hallway',
    equalizeTarget: 'hallway',
    elapsedMs: 5_000,
  });
  assert.deepEqual(evaluation, { result: 'fatal', failureReason: 'hallway_sealed' });
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'bulkhead-isolation',
    routeKey: 'fatal',
    failureReason: evaluation.failureReason,
  });
  assert.equal(stats.pendingReboot08, true);
  assert.equal(stats.earlyFailureCause, 'bulkhead_failure');
});

scenario('04 均压超时', () => {
  assert.deepEqual(evaluateBulkheadDecision({
    sealTarget: 'observation',
    equalizeTarget: 'hallway',
    elapsedMs: 30_000,
    timedOut: true,
  }), { result: 'fatal', failureReason: 'seal_timeout' });
});

scenario('05 联合密钥一次成功', () => {
  for (const value of ['0701', '07-01', '07 01', '０７０１', '０７－０１', '07/01']) {
    assert.equal(isCriticalLogPassword(value), true, value);
  }
  assert.equal(normalizeAuthorizationKey(' ０７ - ０１ '), '0701');
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'critical-log-password',
    routeKey: 'success',
  });
  assert.equal(stats.jointAuthorizationCompleted, true);
  assert.equal(stats.nova06PowerOverrideUsed, false);
});

scenario('06 联合密钥错误后重试成功', () => {
  assert.equal(isCriticalLogPassword('0710'), false);
  const before = freshStats();
  const retry = applySpecialInteractionCompletion(before, {
    kind: 'critical-log-password',
    routeKey: 'retry',
  });
  assert.equal(retry, before);
  const success = applySpecialInteractionCompletion(retry, {
    kind: 'critical-log-password',
    routeKey: 'success',
  });
  assert.equal(success.criticalLogUnlocked, true);
  assert.equal(success.nova06PowerOverrideUsed, false);
});

scenario('07 供能第一次成功', () => {
  assert.equal(findPowerFailureReason(stablePower), undefined);
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing',
    routeKey: 'success',
    attempt: 1,
  });
  assert.equal(stats.powerRoutingResult, 'first_success');
  assert.equal(stats.nova06PowerOverrideUsed, false);
  assert.equal(stats.nova06PowerOverrideExpired, true);
});

scenario('08 供能第一次失败、第二次成功', () => {
  const reason = findPowerFailureReason(failedPower);
  assert.equal(reason, 'life_support_below_minimum');
  let stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing',
    routeKey: 'fail',
    attempt: 1,
    failureReason: reason,
  });
  assert.equal(stats.nova06PowerOverrideUsed, true);
  assert.equal(stats.powerFirstFailureReason, reason);
  assert.equal(matchesInteractionPrerequisite(stats, {
    key: 'nova06PowerOverrideUsed',
    value: true,
  }), true);
  stats = applySpecialInteractionCompletion(stats, {
    kind: 'power-routing',
    routeKey: 'success',
    attempt: 2,
  });
  assert.equal(stats.powerRoutingResult, 'retry_success');
  assert.equal(stats.pendingReboot08, false);
});

scenario('09 供能连续两次失败', () => {
  let stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing',
    routeKey: 'fail',
    attempt: 1,
    failureReason: 'life_support_below_minimum',
  });
  stats = applySpecialInteractionCompletion(stats, {
    kind: 'power-routing',
    routeKey: 'fatal',
    attempt: 2,
    failureReason: 'communications_interrupted',
  });
  assert.equal(stats.powerRoutingResult, 'fatal');
  assert.equal(stats.pendingReboot08, true);
  assert.equal(stats.earlyFailureCause, 'power_routing_failure');
});

scenario('10 供能第一次失败后刷新页面', () => {
  const stats = applySpecialInteractionCompletion(freshStats(), {
    kind: 'power-routing',
    routeKey: 'fail',
    attempt: 1,
    failureReason: 'core_scan_underpowered',
  });
  const save = createSaveData(
    'CH05B-0021',
    [],
    createDefaultNovaAvatarState(),
    'verified',
    stats,
    createDefaultChatDeliveryRuntime(),
  );
  const restored = migrateSaveData(JSON.parse(JSON.stringify(save)));
  assert.ok(restored);
  assert.equal(restored.stats.nova06PowerOverrideUsed, true);
  assert.equal(restored.stats.powerFirstFailureReason, 'core_scan_underpowered');
  assert.equal(resolveResumeNodeId(restored), 'CH05B-0021');
});

scenario('11 供能第一次失败后退出再进入', () => {
  const normalized = normalizeGameStats({
    ...defaultStats,
    powerRoutingAttempt: 1,
    powerFirstFailureReason: 'communications_interrupted',
    nova06PowerOverrideUsed: true,
  });
  assert.equal(normalized.powerRoutingAttempt, 1);
  assert.equal(normalized.nova06PowerOverrideUsed, true);
  assert.equal(normalized.nova06PowerOverrideExpired, true);
});

scenario('12 供能第二次超时', () => {
  assert.equal(findPowerFailureReason(stablePower, true), 'timeout');
  const stats = applySpecialInteractionCompletion(freshStats({
    powerRoutingAttempt: 1,
    nova06PowerOverrideUsed: true,
    nova06PowerOverrideExpired: true,
  }), {
    kind: 'power-routing',
    routeKey: 'fatal',
    attempt: 2,
    failureReason: 'timeout',
  });
  assert.equal(stats.pendingReboot08, true);
});

scenario('13 三种记忆锚点的封存与恢复', () => {
  for (const anchor of ['maintenance_board', 'white_flower', 'goodnight'] as SealableMemoryAnchor[]) {
    const before = freshStats({ memoryAnchors: ['n7', 'white_flower', 'first_message'] });
    const sealed = applySpecialInteractionCompletion(before, {
      kind: 'memory-seal',
      routeKey: anchor,
      anchor,
    });
    assert.equal(sealed.temporaryAnchorSealed, anchor);
    assert.deepEqual(sealed.memoryAnchors, before.memoryAnchors);
    const restored = applySpecialInteractionCompletion(sealed, {
      kind: 'memory-restore',
      routeKey: anchor,
      anchor,
    });
    assert.equal(restored.temporaryAnchorSealed, anchor);
    assert.equal(restored.memoryRestoreResult, anchor);
    assert.equal(restored.temporaryAnchorRestored, true);
  }
});

scenario('14 正常结局', () => {
  assert.equal(determineEnding(freshStats({ acceptFarewell: true, finalChoice: 'accept_farewell' })), 'normal');
});

scenario('15 真结局', () => {
  assert.equal(determineEnding(freshStats({
    trust: 4,
    memory: 4,
    acceptFarewell: true,
    finalChoice: 'accept_farewell',
    memoryAnchors: ['first_message', 'n7', 'white_flower', 'goodnight', 'observatory'],
  })), 'true');
});

scenario('16 原有拒绝告别坏结局', () => {
  assert.equal(determineEnding(freshStats({
    trust: 6,
    memory: 6,
    acceptFarewell: false,
    finalChoice: 'refuse_farewell',
  })), 'bad');
});

scenario('17 新增第八次重启坏结局', () => {
  const fatal = applySpecialInteractionCompletion(freshStats(), {
    kind: 'bulkhead-isolation',
    routeKey: 'fatal',
    failureReason: 'seal_timeout',
  });
  const reachedReboot = applyPersistentStoryNodeEffects(fatal, 'END-B-0039');
  assert.equal(reachedReboot.pendingReboot08, true);
  assert.equal(reachedReboot.reboot08TitleUnlocked, false);
});

scenario('18 旧存档正确失效', () => {
  assert.equal(migrateSaveData({
    pendingNodeId: 'PRO-0001',
    messages: [],
    stats: defaultStats,
    storyVersion: 'V1.0',
    storyContentVersion: 'old-content',
    saveStateVersion: 1,
  }), null);
});

scenario('19 手机端与桌面端基本操作的纯逻辑边界', () => {
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

scenario('20 所有章节正常到达且无死链', () => {
  const nodeMap = new Map(storyNodes.map(node => [node.id, node]));
  assert.equal(nodeMap.size, storyNodes.length, 'Story node IDs must be unique');
  const queue = ['PRO-0001', 'END-N-0001'];
  const reachable = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || id === 'MENU' || reachable.has(id)) continue;
    reachable.add(id);
    const node = nodeMap.get(id);
    assert.ok(node, `Missing reachable node ${id}`);
    const targets = [
      node.nextId,
      node.timeoutNextId,
      node.conditionElseNextId,
      ...Object.values(node.interactionNextIds ?? {}),
      ...(node.choices ?? []).map(choice => choice.nextId),
    ];
    for (const target of targets) {
      if (target && target !== 'MENU' && !reachable.has(target)) queue.push(target);
    }
  }
  assert.equal(reachable.size, storyNodes.length);
  assert.equal(matchesInteractionCondition(
    freshStats({ bulkheadResult: 'injured', bulkheadInjured: true }),
    { kind: 'bulkhead-isolation', routeKey: 'injured' },
  ), true);
});

const interactionNodes = storyNodes.filter(node => node.type === 'interaction' && node.interactionKind);
const interactionKinds = new Set(interactionNodes.map(node => node.interactionKind));
assert.equal(interactionNodes.length, 6, 'Five formal interactions use six runtime hooks');
assert.deepEqual([...interactionKinds].sort(), [
  'bulkhead-isolation',
  'critical-log-password',
  'memory-restore',
  'memory-seal',
  'power-routing',
]);
assert.equal(storyNodes.some(node => String(node.interactionKind).includes('signal')), false);
assert.equal(storyNodes.filter(node => /^ch[124]_/.test(node.id) && node.interactionKind).length, 0);

console.log(`Special interaction scenarios passed: ${scenarios.length}/20`);
for (const name of scenarios) console.log(`  PASS ${name}`);
