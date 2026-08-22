import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap, storyNodes } from '../src/game/story.ts';
import {
  compressDeliverySpec,
  createNormalDeliverySpec,
  DELIVERY_EVENT_SPECS,
  isCommittedWithinDeadline,
  projectDeliverySpec,
} from '../src/game/delivery/specs.ts';
import {
  createDefaultChatDeliveryRuntime,
  migrateDeliveryState,
} from '../src/game/delivery/state.ts';
import type { DeliveryEventKey, DisplayMessage } from '../src/game/types.ts';

const EXPECTED_EVENTS = new Map<string, DeliveryEventKey>([
  ['PRO-0012', 'prologue_first_reply'],
  ['CH03-0170', 'chapter3_reconnect_reply'],
  ['CH05B-0091', 'final_protocol_choice'],
]);

const eventNodes = storyNodes.filter(node => node.deliveryEvent);
assert.equal(eventNodes.length, EXPECTED_EVENTS.size, 'Only the three current choice nodes may declare delivery events');
for (const [nodeId, eventKey] of EXPECTED_EVENTS) {
  const node = storyNodeMap.get(nodeId);
  assert.ok(node, `Missing delivery node ${nodeId}`);
  assert.equal(node.type, 'choice');
  assert.equal(node.deliveryEvent, eventKey);
  assert.ok(node.choices?.length, `${nodeId} must retain its original choices`);
}

assert.deepEqual(
  DELIVERY_EVENT_SPECS.prologue_first_reply.phases.map(phase => [phase.atMs, phase.state]),
  [[0, 'queued'], [60, 'sending'], [900, 'sending'], [1500, 'delivered']],
);
assert.deepEqual(
  DELIVERY_EVENT_SPECS.chapter3_reconnect_reply.phases.map(phase => [phase.atMs, phase.state]),
  [[0, 'queued'], [80, 'sending'], [1200, 'delayed'], [3800, 'delivered']],
);
assert.deepEqual(
  DELIVERY_EVENT_SPECS.final_protocol_choice.phases.map(phase => [phase.atMs, phase.state]),
  [[0, 'queued'], [80, 'sending'], [1200, 'delayed'], [3000, 'delayed'], [3400, 'sending'], [4200, 'delivered']],
);
assert.equal(DELIVERY_EVENT_SPECS.final_protocol_choice.completeAtMs, 4700);

const failureSpecs = Object.values(DELIVERY_EVENT_SPECS).filter(spec =>
  spec.phases.some(phase => phase.state === 'failed'));
assert.deepEqual(failureSpecs.map(spec => spec.key), []);

for (const seed of ['PRO-0012__0', 'PRO-0024__1', 'END-T-0004__0']) {
  const first = createNormalDeliverySpec(seed);
  const second = createNormalDeliverySpec(seed);
  const deliveredAt = first.phases.find(phase => phase.state === 'delivered')?.atMs ?? -1;
  assert.deepEqual(first, second, `Normal delivery must be deterministic for ${seed}`);
  assert.ok(deliveredAt >= 180 && deliveredAt <= 420, `Normal latency out of range for ${seed}`);
}
assert.equal(createNormalDeliverySpec('offline-choice', 'interrupted').finalLinkState, 'interrupted');

const finalProtocolSpec = DELIVERY_EVENT_SPECS.final_protocol_choice;
assert.equal(projectDeliverySpec(finalProtocolSpec, 2999).phase.state, 'delayed');
assert.equal(projectDeliverySpec(finalProtocolSpec, 3000).phase.linkState, 'interrupted');
assert.equal(projectDeliverySpec(finalProtocolSpec, 3400).phase.linkState, 'restoring');
assert.equal(projectDeliverySpec(finalProtocolSpec, 4200).phase.state, 'delivered');
assert.equal(projectDeliverySpec(finalProtocolSpec, 4699).complete, false);
assert.equal(projectDeliverySpec(finalProtocolSpec, 4700).complete, true);

for (const spec of Object.values(DELIVERY_EVENT_SPECS)) {
  const compressed = compressDeliverySpec(spec);
  assert.ok(compressed.completeAtMs <= spec.completeAtMs);
  for (let index = 1; index < compressed.phases.length; index += 1) {
    assert.ok(compressed.phases[index].atMs > compressed.phases[index - 1].atMs);
  }
}

assert.equal(isCommittedWithinDeadline(4999, 5000), true);
assert.equal(isCommittedWithinDeadline(5000, 5000), true);
assert.equal(isCommittedWithinDeadline(5001, 5000), false);

const legacyChoice: DisplayMessage = {
  id: 'legacy_choice',
  speaker: 'player',
  type: 'text',
  content: '在',
  sourceNodeId: 'CH03-0170',
  sourceChoiceIndex: 0,
};
const freeInput: DisplayMessage = {
  id: 'legacy_input',
  speaker: 'player',
  type: 'text',
  content: 'N7',
};
const migratedLegacy = migrateDeliveryState(
  [legacyChoice, freeInput],
  undefined,
  'CH03-0171',
  1000,
);
assert.equal(migratedLegacy.messages[0].deliveryState, 'delivered');
assert.equal(migratedLegacy.messages[0].choiceId, 'CH03-0170__0');
assert.equal(migratedLegacy.messages[1].deliveryState, undefined, 'Free input must not become an outgoing choice delivery');

const failedMessage: DisplayMessage = {
  id: 'failed_ch5',
  speaker: 'player',
  type: 'text',
  content: '因为我也在里面？',
  sourceNodeId: 'CH05A-0266',
  sourceChoiceIndex: 0,
  deliveryState: 'failed',
  scriptedDeliveryEvent: 'chapter5_explicit_failure',
  branchTargetNodeId: 'CH05A-0267',
  committedAt: 2000,
  branchCommitted: true,
};
const failedRuntime = {
  ...createDefaultChatDeliveryRuntime(),
  activeMessageId: failedMessage.id,
};
const restoredFailure = migrateDeliveryState(
  [failedMessage],
  failedRuntime,
  'CH05B-0091',
  3000,
);
assert.equal(restoredFailure.messages[0].deliveryState, 'delivered');
assert.equal(restoredFailure.messages[0].allowFail, false);
assert.equal(restoredFailure.runtime.activeMessageId, undefined);
assert.deepEqual(restoredFailure.runtime.pendingAutoRetryIds, []);
assert.equal(restoredFailure.pendingNodeId, 'CH05B-0091');

const interruptedP14: DisplayMessage = {
  id: 'PRO-0012_pending',
  speaker: 'player',
  type: 'text',
  content: '你是谁？',
  sourceNodeId: 'PRO-0012',
  sourceChoiceIndex: 0,
  deliveryState: 'sending',
  scriptedDeliveryEvent: 'prologue_first_reply',
  branchTargetNodeId: 'PRO-0013',
  committedAt: 2000,
  branchCommitted: true,
};
const pro0012Runtime = { ...createDefaultChatDeliveryRuntime(), activeMessageId: interruptedP14.id };
const restoredP14 = migrateDeliveryState([interruptedP14], pro0012Runtime, 'PRO-0013', 3000);
assert.equal(restoredP14.messages[0].deliveryState, 'delivered');
assert.equal(restoredP14.runtime.activeMessageId, undefined);
assert.equal(restoredP14.runtime.receipts.prologueFirstReply, 'completed');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deliveryDir = path.join(__dirname, '..', 'src', 'game', 'delivery');
const deliverySource = fs.readdirSync(deliveryDir)
  .filter(name => name.endsWith('.ts'))
  .map(name => fs.readFileSync(path.join(deliveryDir, name), 'utf8'))
  .join('\n');
for (const forbidden of ['Math.random', 'navigator.onLine', 'fetch(', 'performance.now']) {
  assert.equal(deliverySource.includes(forbidden), false, `Delivery runtime must not use ${forbidden}`);
}
assert.equal(deliverySource.includes('reordered: true'), false, 'Production delivery must never reorder messages');

console.log('Delivery system tests passed: 3 scripted events, deterministic timing, legacy migration, and deadline boundaries verified.');
