import assert from 'node:assert/strict';
import { storyNodes } from '../src/game/story.ts';
import { defaultStats, normalizeGameStats } from '../src/game/storage.ts';
import type { GameStats } from '../src/game/types.ts';
import { applyStoryLocale } from '../src/i18n/storyResolver.ts';
import { getSpecialInteractionCopy } from '../src/game/interactions/copy.ts';
import {
  applySpecialInteractionCompletion,
  applyNova06OverrideCheckpoint,
  classifyPowerRoutingResult,
  isCriticalLogPassword,
  isSignalAligned,
  interpolatePowerAllocation,
  normalizeAuthorizationKey,
  rebalancePowerAllocation,
  type PowerAllocation,
  type PowerChannel,
} from '../src/game/interactions/logic.ts';
import { resolveGuidanceStage } from '../src/game/interactions/guidance.ts';
import { resolveNova06CommsAftermath } from '../src/game/interactions/nova06CommsAftermath.ts';

const acceptedPasswords = [
  '0701',
  '07-01',
  '07 01',
  '  07\t01  ',
  '０７０１',
  '０７－０１',
  '07/01',
];

for (const password of acceptedPasswords) {
  assert.equal(isCriticalLogPassword(password), true, `Expected password format to pass: ${password}`);
}

for (const password of ['', '701', '0702', '0710', '07/02', 'NOVA0701']) {
  assert.equal(isCriticalLogPassword(password), false, `Expected password format to fail: ${password}`);
}
assert.equal(normalizeAuthorizationKey(' ０７ - ０１ '), '0701');
const zhInteractionCopy = getSpecialInteractionCopy('zh-CN');
const enInteractionCopy = getSpecialInteractionCopy('en-US');
assert.equal('hints' in zhInteractionCopy.password, false);
assert.equal('partialPlaceholder' in zhInteractionCopy.password, false);
assert.equal('calibrate' in zhInteractionCopy.signal, false);
assert.equal('assistAction' in zhInteractionCopy.power, false);
assert.equal('hints' in enInteractionCopy.password, false);
assert.equal('calibrate' in enInteractionCopy.signal, false);
assert.equal('assistAction' in enInteractionCopy.power, false);
assert.equal(zhInteractionCopy.signal.stageTitles.length, 3);
assert.equal(enInteractionCopy.signal.stageTitles.length, 3);
assert.equal(isSignalAligned(62, 62, 14), true);
assert.equal(isSignalAligned(76, 62, 14), true);
assert.equal(isSignalAligned(77, 62, 14), false);
assert.equal(isSignalAligned(43, 34, 9), true);
assert.equal(isSignalAligned(44, 34, 9), false);
assert.equal(zhInteractionCopy.memory.memories.maintenance_board.title.includes('N7'), false);

const channels: PowerChannel[] = ['lifeSupport', 'communications', 'coreScan'];
let allocation: PowerAllocation = { lifeSupport: 34, communications: 33, coreScan: 33 };
for (const channel of channels) {
  for (const value of [-20, 0, 17, 45, 73, 100, 140, Number.NaN]) {
    allocation = rebalancePowerAllocation(allocation, channel, value);
    const total = channels.reduce((sum, key) => sum + allocation[key], 0);
    assert.equal(total, 100, `${channel}=${value} must preserve exactly 100%`);
    for (const key of channels) {
      assert.equal(Number.isInteger(allocation[key]), true, `${key} must remain an integer`);
      assert.equal(allocation[key] >= 0 && allocation[key] <= 100, true, `${key} must remain in range`);
    }
  }
}

const animationStart: PowerAllocation = { lifeSupport: 34, communications: 33, coreScan: 33 };
const animationTarget: PowerAllocation = { lifeSupport: 20, communications: 35, coreScan: 45 };
for (const progress of [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1]) {
  const frame = interpolatePowerAllocation(animationStart, animationTarget, progress);
  assert.equal(channels.reduce((sum, channel) => sum + frame[channel], 0), 100);
  assert.equal(channels.every(channel => Number.isInteger(frame[channel])), true);
}
assert.deepEqual(interpolatePowerAllocation(animationStart, animationTarget, 0), animationStart);
assert.deepEqual(interpolatePowerAllocation(animationStart, animationTarget, 1), animationTarget);

assert.equal(classifyPowerRoutingResult(false, [5, 7, 9.9]), 'excellent');
assert.equal(classifyPowerRoutingResult(false, [5, 11, 9]), 'stable');
assert.equal(classifyPowerRoutingResult(true, [5, 5, 5]), 'emergency_assist');

assert.equal(resolveGuidanceStage(0, {
  msSinceMark: 40000,
  msTotal: 40000,
  validAttempts: 0,
  invalidAttempts: 0,
  invalidSinceMark: 0,
  emergencies: 0,
}, {
  hint1Ms: 32000,
  hint1Invalid: 2,
  hint2Ms: 30000,
  hint2Invalid: 2,
  overrideMs: 100000,
  overrideInvalid: 7,
  overrideMinValid: 6,
  overrideEmergencies: 0,
}), 1, 'Long stall may trigger first Nova hint without valid attempts');

assert.equal(resolveGuidanceStage(2, {
  msSinceMark: 5000,
  msTotal: 120000,
  validAttempts: 0,
  invalidAttempts: 9,
  invalidSinceMark: 1,
  emergencies: 0,
}, {
  hint1Ms: 32000,
  hint1Invalid: 2,
  hint2Ms: 30000,
  hint2Invalid: 2,
  overrideMs: 100000,
  overrideInvalid: 7,
  overrideMinValid: 6,
  overrideEmergencies: 0,
}), 2, 'NOVA-06 override must not trigger without real attempts');

assert.equal(resolveGuidanceStage(2, {
  msSinceMark: 5000,
  msTotal: 120000,
  validAttempts: 8,
  invalidAttempts: 9,
  invalidSinceMark: 1,
  emergencies: 0,
}, {
  hint1Ms: 32000,
  hint1Invalid: 2,
  hint2Ms: 30000,
  hint2Invalid: 2,
  overrideMs: 100000,
  overrideInvalid: 7,
  overrideMinValid: 6,
  overrideEmergencies: 0,
}), 3, 'Override requires prior hints plus real attempts and stall/invalid threshold');

const passwordThresholds = {
  hint1Ms: 32000,
  hint1Invalid: 2,
  hint2Ms: 30000,
  hint2Invalid: 2,
  overrideMs: 100000,
  overrideInvalid: 7,
  overrideMinValid: 6,
  overrideEmergencies: 0,
  overrideRequiresTime: true,
};
assert.equal(resolveGuidanceStage(2, {
  msSinceMark: 5000,
  msTotal: 8000,
  validAttempts: 8,
  invalidAttempts: 9,
  invalidSinceMark: 1,
  emergencies: 0,
}, passwordThresholds), 2, 'Rapid password guessing must not trigger the hidden override');
assert.equal(resolveGuidanceStage(2, {
  msSinceMark: 5000,
  msTotal: 100000,
  validAttempts: 8,
  invalidAttempts: 9,
  invalidSinceMark: 1,
  emergencies: 0,
}, passwordThresholds), 3, 'Password override requires both time and real failed submissions');

const originalAnchors = ['n7', 'white_flower'] as const;
let stats: GameStats = { ...defaultStats, memoryAnchors: [...originalAnchors], trust: 4, memory: 3, attachment: 2 };

stats = {
  ...stats,
  novaHintStage: 2,
  novaHintInteractionKind: 'signal-separation',
};
stats = applyNova06OverrideCheckpoint(stats, 'signal-separation');
assert.equal(stats.signalCompletedByNova06, true);
assert.equal(stats.timelineCompletedByNova06, true);
assert.equal(stats.nova06OverrideTriggered, true);
assert.equal(stats.novaHintStage, 2, 'Script checkpoint must not advance the story or clear guidance yet');

stats = applySpecialInteractionCompletion(stats, {
  kind: 'critical-log-password',
  routeKey: 'success',
  completedByNova06: true,
});
assert.equal(stats.passwordBypassedByNova06, true);
assert.equal(stats.nova06FirstOverrideSeen, true);
assert.equal(stats.novaHintStage, 0);
assert.equal(stats.novaHintInteractionKind, undefined);

stats = applySpecialInteractionCompletion(stats, {
  kind: 'signal-separation',
  routeKey: 'clean',
  completedByNova06: true,
});
assert.equal(stats.signalCompletedByNova06, true);
assert.equal(stats.timelineCompletedByNova06, true);

stats = applySpecialInteractionCompletion(stats, {
  kind: 'power-routing',
  routeKey: 'stable',
  completedByNova06: true,
});
assert.equal(stats.powerCompletedByNova06, true);

const normalizedLegacyStats = normalizeGameStats({ trust: 0, memory: 0, attachment: 0 });
assert.equal(normalizedLegacyStats.novaHintStage, 0);
assert.equal(normalizedLegacyStats.nova06OverrideTriggered, false);
assert.equal(normalizedLegacyStats.memoryNova06NoteSeen, false);

// 特殊 Nova 反应台词只在接管完成时注入，正常通关不得触发
{
  const copy = getSpecialInteractionCopy('zh');
  assert.equal(
    resolveNova06CommsAftermath({ kind: 'critical-log-password', routeKey: 'success' }, copy),
    null,
  );
  assert.equal(
    resolveNova06CommsAftermath({ kind: 'signal-separation', routeKey: 'clean' }, copy),
    null,
  );
  assert.equal(
    resolveNova06CommsAftermath({ kind: 'power-routing', routeKey: 'excellent' }, copy),
    null,
  );
  assert.equal(
    resolveNova06CommsAftermath({ kind: 'critical-log-password', routeKey: 'success', completedByNova06: false }, copy),
    null,
  );
  const takeover = resolveNova06CommsAftermath(
    { kind: 'critical-log-password', routeKey: 'success', completedByNova06: true },
    copy,
  );
  assert.ok(takeover);
  assert.equal(takeover.reactions.includes('她甚至没输入密码'), true);
}

stats = { ...defaultStats, memoryAnchors: [...originalAnchors], trust: 4, memory: 3, attachment: 2 };
stats = applySpecialInteractionCompletion(stats, { kind: 'critical-log-password', routeKey: 'success' });
assert.equal(stats.criticalLogUnlocked, true);
stats = applySpecialInteractionCompletion(stats, { kind: 'signal-separation', routeKey: 'clean' });
assert.equal(stats.signalSeparationResult, 'clean');
assert.equal(stats.signalCurrentNovaRecovered, true);
assert.equal(stats.signalNova06Recovered, true);
assert.equal(stats.signalCoreTelemetryRecovered, true);
assert.equal(stats.timelineAlignmentCompleted, true);
stats = applySpecialInteractionCompletion(stats, { kind: 'power-routing', routeKey: 'stable' });
assert.equal(stats.powerRoutingResult, 'stable');
stats = applySpecialInteractionCompletion(stats, {
  kind: 'memory-seal',
  routeKey: 'white_flower',
  anchor: 'white_flower',
});
assert.equal(stats.temporaryAnchorSealed, 'white_flower');
assert.equal(stats.temporaryAnchorRestored, false);
assert.deepEqual(stats.memoryAnchors, originalAnchors, 'Temporary sealing must not remove an ending anchor');
stats = applySpecialInteractionCompletion(stats, {
  kind: 'memory-restore',
  routeKey: 'white_flower',
  anchor: 'white_flower',
});
assert.equal(stats.temporaryAnchorSealed, undefined);
assert.equal(stats.temporaryAnchorRestored, true);
assert.equal(stats.trust, 4);
assert.equal(stats.memory, 3);
assert.equal(stats.attachment, 2);
assert.equal(stats.ending, undefined, 'Special interactions must not determine an ending');
assert.equal('memoryChoiceCompletedByNova06' in stats, false);

const sealableAnchors = ['maintenance_board', 'white_flower', 'goodnight'] as const;
for (const anchor of sealableAnchors) {
  let anchorStats: GameStats = {
    ...defaultStats,
    memoryAnchors: ['n7', 'white_flower', 'first_message'],
  };
  const originalMemoryAnchors = [...anchorStats.memoryAnchors];
  anchorStats = applySpecialInteractionCompletion(anchorStats, {
    kind: 'memory-seal',
    routeKey: anchor,
    anchor,
  });
  assert.equal(anchorStats.temporaryAnchorSealed, anchor);
  assert.equal(anchorStats.temporaryAnchorRestored, false);
  assert.deepEqual(anchorStats.memoryAnchors, originalMemoryAnchors);
  anchorStats = applySpecialInteractionCompletion(anchorStats, {
    kind: 'memory-restore',
    routeKey: anchor,
    anchor,
  });
  assert.equal(anchorStats.temporaryAnchorSealed, undefined);
  assert.equal(anchorStats.temporaryAnchorRestored, true);
  assert.deepEqual(anchorStats.memoryAnchors, originalMemoryAnchors);
}

const nodeMap = new Map(storyNodes.map(node => [node.id, node]));
assert.equal(nodeMap.size, storyNodes.length, 'Story node IDs must be unique');

const expectedInteractions = new Map([
  ['ch5a_auth_interaction', 'critical-log-password'],
  ['ch5a_signal_separation', 'signal-separation'],
  ['ch5b_power_interaction', 'power-routing'],
  ['ch5b_memory_seal', 'memory-seal'],
  ['fin_memory_restore', 'memory-restore'],
]);
const interactionNodes = storyNodes.filter(node => node.type === 'interaction' && node.interactionKind);
assert.equal(interactionNodes.length, expectedInteractions.size);
for (const node of interactionNodes) {
  assert.equal(node.interactionKind, expectedInteractions.get(node.id), `Unexpected interaction kind for ${node.id}`);
  assert.ok(node.interactionNextIds && Object.keys(node.interactionNextIds).length > 0, `${node.id} needs result routes`);
}

for (const node of storyNodes) {
  const targets = [
    node.nextId,
    node.timeoutNextId,
    ...Object.values(node.interactionNextIds ?? {}),
    ...(node.choices ?? []).map(choice => choice.nextId),
  ].filter((value): value is string => Boolean(value));
  for (const target of targets) {
    assert.ok(target === 'MENU' || nodeMap.has(target), `${node.id} points to missing node ${target}`);
  }
  assert.equal(node.content.includes('回滚'), false, `${node.id} uses forbidden rollback wording`);
}

const reachable = new Set<string>();
// NORMAL_END_START is selected by resolveEndingStart at runtime rather than a literal story edge.
const queue = ['p0', 'NORMAL_END_START'];
while (queue.length) {
  const id = queue.shift()!;
  if (reachable.has(id) || id === 'MENU') continue;
  reachable.add(id);
  const node = nodeMap.get(id);
  assert.ok(node, `Reachability traversal found missing node ${id}`);
  const targets = [
    node.nextId,
    node.timeoutNextId,
    ...Object.values(node.interactionNextIds ?? {}),
    ...(node.choices ?? []).map(choice => choice.nextId),
  ];
  for (const target of targets) {
    if (target && target !== 'MENU' && !reachable.has(target)) queue.push(target);
  }
}
assert.equal(reachable.size, storyNodes.length, 'Every runtime story node must remain reachable from a runtime entry point');

const finalQuestion = nodeMap.get('fin_last6');
assert.equal(finalQuestion?.choiceTimeoutMs, 5000);
assert.equal(finalQuestion?.choices?.[0]?.text, '【真的有人收到了？】');
assert.equal(finalQuestion?.choices?.[0]?.nextId, 'fin_correct1');
assert.equal(nodeMap.get('ch5a_auth4')?.content, '“本次接入编号 / 外部索引编号”');
assert.equal(nodeMap.get('ch5a_auth_ok2')?.content.includes('07 是第七次接入'), true);
assert.equal(nodeMap.get('ch5a_sep_conclusion')?.content.includes('连续性签名在相同条件下被重新触发'), true);
assert.equal(nodeMap.get('ch5b_power_excellent3')?.content.includes('NOVA-06 预设残留'), true);

const englishNodeMap = new Map(applyStoryLocale(storyNodes, 'en-US').map(node => [node.id, node]));
assert.equal(englishNodeMap.get('ch5a_auth1')?.content, 'There is another sealed layer beside the outer index.');
assert.equal(englishNodeMap.get('ch5b_power_intro5')?.content.includes('cannot touch the phase core itself'), true);
assert.equal(englishNodeMap.get('fin_restore_goodnight2')?.content.includes('something was still missing'), true);

console.log(`Special interaction tests passed: ${storyNodes.length} nodes, ${interactionNodes.length} interaction nodes.`);
