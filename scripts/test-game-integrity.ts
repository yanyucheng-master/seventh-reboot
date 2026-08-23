import assert from 'node:assert/strict';
import { ARCHIVE_ENTRIES, getArchiveEntries, getArchiveUnlocksForNode } from '../src/game/archive.ts';
import { resolveEndingStart, resolveFinalEndingNode } from '../src/game/endings.ts';
import { applySpecialInteractionCompletion } from '../src/game/interactions/logic.ts';
import { getSpecialInteractionCopy } from '../src/game/interactions/copy.ts';
import { storyNodeMap, storyNodes, type StoryNode } from '../src/game/story.ts';
import {
  applyPersistentStoryNodeEffects,
  applyStoryChoiceEffects,
  applyTimedChoiceTimeoutEffects,
} from '../src/game/state.ts';
import {
  clearAllData,
  clearSave,
  createNewGameStats,
  createSaveData,
  defaultStats,
  loadGame,
  PERSISTENT_PROGRESS_KEY,
  SAVE_KEY,
  saveGame,
} from '../src/game/storage.ts';
import type {
  GameStats,
  MemoryAnchorId,
  SpecialInteractionCompletion,
} from '../src/game/types.ts';
import { applyStoryLocale } from '../src/i18n/storyResolver.ts';
import { createDefaultNovaAvatarState } from '../src/game/avatarState.ts';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});

const ALL_ANCHORS: MemoryAnchorId[] = [
  'n7',
  'milk_candy',
  'white_flower',
  'first_message',
  'goodnight',
  'observatory',
  'maintenance_board',
  'steak',
];

function targets(node: StoryNode): string[] {
  return [
    node.nextId,
    node.timeoutNextId,
    node.conditionElseNextId,
    node.directConditionNextId,
    ...Object.values(node.specialInputNextIds ?? {}),
    ...Object.values(node.interactionNextIds ?? {}),
    ...(node.choices ?? []).map(choice => choice.nextId),
  ].filter((value): value is string => Boolean(value));
}

function graphTargets(node: StoryNode): string[] {
  const runtimeAlternatives = node.id === 'FIN-0044'
    ? ['END-T-0001']
    : node.id === 'END-B-0015'
      ? ['END-B-0026']
      : [];
  return [...targets(node), ...runtimeAlternatives]
    .filter(target => target !== 'MENU' && !/^\{.+\}$/.test(target));
}

function canReach(from: string, target: string): boolean {
  const visited = new Set<string>();
  const queue = [from];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === target) return true;
    if (visited.has(id) || id === 'MENU') continue;
    visited.add(id);
    const node = storyNodeMap.get(id);
    if (node) queue.push(...graphTargets(node));
  }
  return false;
}

assert.equal(storyNodeMap.size, storyNodes.length, 'Story node IDs must be unique');
const archiveIds = new Set(ARCHIVE_ENTRIES.map(entry => entry.id));
assert.equal(archiveIds.size, ARCHIVE_ENTRIES.length, 'Archive IDs must be unique');
for (const archiveId of Object.values({
  ...Object.fromEntries(ALL_ANCHORS.map(anchor => [anchor, `anchor_${anchor}`])),
  gravity: 'anomaly_gravity_array',
  normalEpilogue: 'epilogue_normal',
  trueEpilogue: 'epilogue_true',
})) {
  assert.ok(archiveIds.has(archiveId), `Required archive is missing: ${archiveId}`);
}
assert.equal(
  ARCHIVE_ENTRIES.some(entry => entry.image === '/assets/nova_observatory.png'),
  false,
  'The removed second observatory image must not return as an archive entry',
);

const choiceIds = new Set<string>();
for (const node of storyNodes) {
  for (const target of targets(node)) {
    assert.ok(
      target === 'MENU' || /^\{.+\}$/.test(target) || storyNodeMap.has(target),
      `${node.id} points to missing node ${target}`,
    );
  }
  for (const choice of node.choices ?? []) {
    assert.ok(choice.id, `${node.id} choice is missing a stable runtime ID`);
    assert.equal(choiceIds.has(choice.id!), false, `Duplicate choice ID: ${choice.id}`);
    choiceIds.add(choice.id!);
  }
  for (const archiveId of getArchiveUnlocksForNode(node)) {
    assert.ok(archiveIds.has(archiveId), `${node.id} unlocks unknown archive ${archiveId}`);
  }
}

const reachable = new Set<string>();
const queue = ['PRO-0001'];
while (queue.length) {
  const id = queue.shift()!;
  if (id === 'MENU' || reachable.has(id)) continue;
  reachable.add(id);
  const node = storyNodeMap.get(id);
  assert.ok(node, `Missing reachable node ${id}`);
  queue.push(...graphTargets(node));
}
assert.equal(reachable.size, storyNodes.length, 'Every node must remain reachable');

const visiting = new Set<string>();
const visited = new Set<string>();
function assertAcyclic(id: string): void {
  if (visited.has(id) || id === 'MENU') return;
  assert.equal(visiting.has(id), false, `Unexpected story cycle through ${id}`);
  visiting.add(id);
  const node = storyNodeMap.get(id);
  assert.ok(node);
  const retryTarget = node.interactionNextIds?.retry;
  graphTargets(node).filter(target => target !== retryTarget).forEach(assertAcyclic);
  visiting.delete(id);
  visited.add(id);
}
assertAcyclic('PRO-0001');

const timedNodes = storyNodes.filter(node => node.choiceTimeoutMs !== undefined);
assert.deepEqual(
  timedNodes.map(node => node.id),
  ['CH01-0160', 'CH03-0109', 'CH04-0048', 'CH04-0071', 'CH04-0215', 'CH05A-0076', 'FIN-0040'],
);
for (const node of timedNodes) {
  assert.ok(node.timeoutNextId, `${node.id} requires an explicit timeout route`);
  assert.ok(node.choices?.length, `${node.id} requires choices`);
}

const finalMemoryQuestion = storyNodeMap.get('FIN-0040')!;
assert.equal(finalMemoryQuestion.choiceTimeoutMs, 5000);
assert.equal(finalMemoryQuestion.choices?.[0]?.id, 'FIN-0040__0');
assert.equal(finalMemoryQuestion.choices?.[0]?.text, '【真的有人收到了？】');
assert.equal(finalMemoryQuestion.choices?.[0]?.nextId, 'FIN-0041');
assert.equal(finalMemoryQuestion.choices?.[0]?.firstMessageCorrect, true);
assert.equal(finalMemoryQuestion.choices?.slice(1).every(choice => choice.firstMessageCorrect === false), true);
assert.equal(finalMemoryQuestion.timeoutNextId, 'FIN-0045');

const chapterFourProof = storyNodeMap.get('CH04-0048')!;
for (const choice of chapterFourProof.choices!) {
  const before = { ...defaultStats, trust: 3, memory: 2 };
  const after = applyStoryChoiceEffects(before, choice);
  assert.equal(after.trust, before.trust, `${choice.id} must not change trust during the timed proof`);
  assert.equal(after.memory, before.memory, `${choice.id} must not change memory during the timed proof`);
  assert.equal(canReach(choice.nextId, 'CH04-0049'), true, `${choice.id} must still reach the N7 recovery`);
  assert.equal(canReach(choice.nextId, 'CH04-0096'), true, `${choice.id} must preserve the N7 reassurance sequence`);
}
assert.equal(canReach(chapterFourProof.timeoutNextId!, 'CH04-0049'), true);
assert.equal(canReach(chapterFourProof.timeoutNextId!, 'CH04-0096'), true);

const qualified: GameStats = {
  ...defaultStats,
  trust: 4,
  memory: 4,
  memoryAnchors: [...ALL_ANCHORS],
};
const finaleDecision = storyNodeMap.get('CH05B-0091')!;
const acceptedBeforeQuestion = applyStoryChoiceEffects(qualified, finaleDecision.choices![0]);
assert.equal(acceptedBeforeQuestion.acceptFarewell, true);
assert.equal(acceptedBeforeQuestion.finalChoice, 'accept_farewell');
assert.equal(resolveEndingStart('CH05B-0092'), 'CH05B-0092');

const acceptedAnswer = applyStoryChoiceEffects(acceptedBeforeQuestion, finalMemoryQuestion.choices![0]);
assert.equal(acceptedAnswer.firstMessageCorrect, true);
assert.equal(resolveFinalEndingNode(acceptedAnswer), 'END-T-0001');

const underThresholdBeforeQuestion = applyStoryChoiceEffects(
  { ...qualified, trust: 3 },
  finaleDecision.choices![0],
);
const underThreshold = applyStoryChoiceEffects(
  underThresholdBeforeQuestion,
  finalMemoryQuestion.choices![0],
);
assert.equal(resolveFinalEndingNode(underThreshold), 'END-N-0001');

const refusalDecision = storyNodeMap.get('CH05B-0097')!;
const refused = applyStoryChoiceEffects(qualified, refusalDecision.choices![1]);
assert.equal(refused.ending, 'bad');
assert.equal(resolveEndingStart('END-B-0001'), 'END-B-0001');

assert.equal(canReach('CH05B-0092', 'END-T-0006'), true);
assert.equal(canReach('END-N-0001', 'END-N-0007'), true);
assert.equal(canReach('END-B-0001', 'END-B-0028'), true);
assert.equal(storyNodeMap.get('END-T-0006')?.nextId, 'MENU');
assert.equal(storyNodeMap.get('END-N-0007')?.nextId, 'MENU');
assert.equal(storyNodeMap.get('END-B-0028')?.nextId, 'MENU');
assert.ok(getArchiveUnlocksForNode(storyNodeMap.get('END-B-0028')!).includes('ending_bad'));

for (const [index, choice] of finalMemoryQuestion.choices!.entries()) {
  const next = applyStoryChoiceEffects({ ...acceptedBeforeQuestion }, choice);
  assert.equal(next.trust, acceptedBeforeQuestion.trust);
  assert.equal(next.memory, acceptedBeforeQuestion.memory);
  assert.deepEqual(next.memoryAnchors, acceptedBeforeQuestion.memoryAnchors);
  assert.equal(next.firstMessageCorrect, index === 0);
  assert.equal(resolveFinalEndingNode(next), index === 0 ? 'END-T-0001' : 'END-N-0001');
}
const timedOut = applyTimedChoiceTimeoutEffects(acceptedBeforeQuestion, 'FIN-0040');
assert.equal(timedOut.firstMessageCorrect, false);
assert.equal(resolveFinalEndingNode(timedOut), 'END-N-0001');
assert.equal(timedOut.trust, acceptedBeforeQuestion.trust);
assert.equal(timedOut.memory, acceptedBeforeQuestion.memory);

const interactionCompletions: SpecialInteractionCompletion[] = [
  { kind: 'bulkhead-isolation', routeKey: 'safe' },
  { kind: 'sealed-record-order', routeKey: 'success' },
  { kind: 'power-routing', routeKey: 'success', attempt: 1 },
  { kind: 'memory-seal', routeKey: 'goodnight', anchor: 'goodnight' },
  { kind: 'memory-restore', routeKey: 'goodnight', anchor: 'goodnight' },
];
const endingFields = ['trust', 'memory', 'attachment', 'acceptFarewell', 'finalChoice', 'ending'] as const;
for (const completion of interactionCompletions) {
  const next = applySpecialInteractionCompletion(acceptedAnswer, completion);
  for (const field of endingFields) assert.equal(next[field], acceptedAnswer[field]);
  assert.deepEqual(next.memoryAnchors, acceptedAnswer.memoryAnchors);
}

const trueRunArchiveStats: GameStats = {
  ...acceptedAnswer,
  ending: 'true',
  unlockedArchives: ARCHIVE_ENTRIES
    .filter(entry => entry.category !== 'ending' && entry.category !== 'future')
    .map(entry => entry.id),
  endingsUnlocked: ['ending_true'],
  trueEpilogueUnlocked: true,
};
const trueRunEntries = getArchiveEntries(trueRunArchiveStats, 'verified');
assert.equal(trueRunEntries.filter(entry => entry.unlocked).length, ARCHIVE_ENTRIES.length - 3);
assert.deepEqual(
  trueRunEntries.filter(entry => !entry.unlocked).map(entry => entry.id),
  ['ending_normal', 'ending_bad', 'epilogue_normal'],
  'Unobserved ending branches and their future record must remain locked',
);

const productionText = [
  ...applyStoryLocale(storyNodes, 'zh-CN').map(node => node.content),
  JSON.stringify(getSpecialInteractionCopy('zh-CN')),
].join('\n');
for (const internalPhrase of [
  '记忆偏移分支',
  '未达真结局阈值',
  '结局惩罚',
  '结局条件',
  'Nova 信任阈值下降',
  '辅助校准',
]) {
  assert.equal(productionText.includes(internalPhrase), false, `Player-facing text leaks internal phrase: ${internalPhrase}`);
}

const firstSave = applyPersistentStoryNodeEffects({ ...trueRunArchiveStats }, 'END-T-0005');
const secondSave = applyPersistentStoryNodeEffects(firstSave, 'END-T-0005');
assert.equal(firstSave.commemorativeArchiveSaved, true);
assert.equal(secondSave, firstSave, 'Commemorative archive save must be idempotent');

clearAllData();
saveGame(createSaveData('END-T-0006', [], createDefaultNovaAvatarState(), 'verified', firstSave));
assert.ok(localStorage.getItem(SAVE_KEY));
assert.ok(localStorage.getItem(PERSISTENT_PROGRESS_KEY));
clearSave();
assert.equal(localStorage.getItem(SAVE_KEY), null);
assert.ok(localStorage.getItem(PERSISTENT_PROGRESS_KEY), 'Restart must retain persistent progress');
const freshRun = createNewGameStats();
assert.equal(freshRun.trust, 0);
assert.equal(freshRun.memory, 0);
assert.deepEqual(freshRun.memoryAnchors, []);
assert.equal(freshRun.finalChoice, undefined);
assert.equal(freshRun.commemorativeArchiveSaved, true);
assert.deepEqual(freshRun.endingsUnlocked, ['ending_true']);
assert.equal(freshRun.unlockedArchives.includes('ending_true'), true);

localStorage.setItem(SAVE_KEY, JSON.stringify({
  currentNodeId: 'PRO-0011',
  messages: [{
    id: 'PRO-0011_legacy',
    speaker: 'nova',
    type: 'text',
    content: '真的有人收到了？',
  }],
  stats: { trust: 2, attachment: 1 },
  timestamp: Date.now() - 1000,
}));
const migrated = loadGame();
assert.equal(migrated, null, 'Legacy active saves must fail closed after the interaction state upgrade');

localStorage.setItem(SAVE_KEY, JSON.stringify({
  currentNodeId: 'PRO-0011',
  stats: { trust: 2 },
  timestamp: Date.now() - 1000,
}));
const migratedWithoutMessages = loadGame();
assert.equal(migratedWithoutMessages, null, 'Incomplete legacy saves must not enter the new branch topology');

localStorage.setItem(SAVE_KEY, JSON.stringify({
  pendingNodeId: 'PRO-0001',
  messages: [],
  stats: {},
  storyVersion: 'V2.0',
  timestamp: Date.now(),
}));
assert.equal(loadGame(), null, 'Incompatible topology versions must still be rejected');
clearAllData();

console.log(
  `Game integrity tests passed: ${storyNodes.length} nodes, ${choiceIds.size} choices, ${timedNodes.length} timed nodes, ${ARCHIVE_ENTRIES.length} archives.`,
);
