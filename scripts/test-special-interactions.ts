import assert from 'node:assert/strict';
import { storyNodes } from '../src/game/story.ts';
import { defaultStats } from '../src/game/storage.ts';
import type { GameStats } from '../src/game/types.ts';
import { applyStoryLocale } from '../src/i18n/storyResolver.ts';
import { getSpecialInteractionCopy } from '../src/game/interactions/copy.ts';
import {
  applySpecialInteractionCompletion,
  classifyPowerRoutingResult,
  isCriticalLogPassword,
  normalizeAuthorizationKey,
  rebalancePowerAllocation,
  type PowerAllocation,
  type PowerChannel,
} from '../src/game/interactions/logic.ts';

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
assert.equal(zhInteractionCopy.password.hints.some(hint => hint.includes('第一句话') || hint.includes('第一次有人回答')), false);
assert.equal(zhInteractionCopy.password.hints.some(hint => hint.includes('提示 0') || hint.includes('系统建议')), false);
assert.equal(enInteractionCopy.password.hints.some(hint => /Hint\s*0|System format/i.test(hint)), false);
assert.equal(enInteractionCopy.password.hints[0].includes("isn't quite right"), true);
assert.equal(enInteractionCopy.password.hints[1].includes('seventh'), true);
assert.equal(enInteractionCopy.password.hints[2].includes('Observer-01'), true);
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

assert.equal(classifyPowerRoutingResult(false, [5, 7, 9.9]), 'excellent');
assert.equal(classifyPowerRoutingResult(false, [5, 11, 9]), 'stable');
assert.equal(classifyPowerRoutingResult(true, [5, 5, 5]), 'emergency_assist');

const originalAnchors = ['n7', 'white_flower'] as const;
let stats = { ...defaultStats, memoryAnchors: [...originalAnchors], trust: 4, memory: 3, attachment: 2 };
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
