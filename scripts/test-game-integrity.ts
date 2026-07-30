import assert from 'node:assert/strict';
import { ARCHIVE_ENTRIES, getArchiveEntries, getArchiveUnlocksForNode } from '../src/game/archive.ts';
import { resolveEndingStart } from '../src/game/endings.ts';
import { applySpecialInteractionCompletion } from '../src/game/interactions/logic.ts';
import { getSpecialInteractionCopy } from '../src/game/interactions/copy.ts';
import { storyNodeMap, storyNodes, type StoryNode } from '../src/game/story.ts';
import {
  applyPersistentStoryNodeEffects,
  applyStoryChoiceEffects,
  applyTimedChoiceTimeoutEffects,
  getFinalFarewellVariant,
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
    ...Object.values(node.interactionNextIds ?? {}),
    ...(node.choices ?? []).map(choice => choice.nextId),
  ].filter((value): value is string => Boolean(value));
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
    if (node) queue.push(...targets(node));
  }
  return false;
}

function linearPath(from: string, stopAt: string, max = 80): string[] {
  const ids: string[] = [];
  let current = storyNodeMap.get(from);
  while (current && ids.length < max) {
    ids.push(current.id);
    if (current.id === stopAt) break;
    current = current.nextId ? storyNodeMap.get(current.nextId) : undefined;
  }
  return ids;
}

assert.equal(storyNodeMap.size, storyNodes.length, 'Story node IDs must be unique');
const archiveIds = new Set(ARCHIVE_ENTRIES.map(entry => entry.id));
assert.equal(archiveIds.size, ARCHIVE_ENTRIES.length, 'Archive IDs must be unique');
assert.equal(ARCHIVE_ENTRIES.length, 29, 'Archive total must include both optional future records');

const choiceIds = new Set<string>();
for (const node of storyNodes) {
  for (const target of targets(node)) {
    assert.ok(target === 'MENU' || storyNodeMap.has(target), `${node.id} points to missing node ${target}`);
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
const queue = ['PRO-0001', 'END-N-0001'];
while (queue.length) {
  const id = queue.shift()!;
  if (id === 'MENU' || reachable.has(id)) continue;
  reachable.add(id);
  const node = storyNodeMap.get(id);
  assert.ok(node, `Missing reachable node ${id}`);
  queue.push(...targets(node));
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
  const nextTargets = node.id === 'CH05A-0016'
    ? targets(node).filter(target => target !== 'CH05A-0017')
    : targets(node);
  nextTargets.forEach(assertAcyclic);
  visiting.delete(id);
  visited.add(id);
}
assertAcyclic('PRO-0001');
assertAcyclic('END-N-0001');

const timedNodes = storyNodes.filter(node => node.choiceTimeoutMs !== undefined);
assert.deepEqual(
  timedNodes.map(node => node.id),
  ['CH01-0160', 'CH03-0109', 'CH04-0048', 'CH05A-0076', 'CH05B-0049', 'FIN-0081', 'FIN-0231'],
);
for (const node of timedNodes) {
  assert.ok(node.timeoutNextId, `${node.id} requires an explicit timeout route`);
  assert.ok(node.choices?.length, `${node.id} requires choices`);
}

const finalMemoryQuestion = storyNodeMap.get('FIN-0231')!;
assert.equal(finalMemoryQuestion.choiceTimeoutMs, 5000);
assert.equal(finalMemoryQuestion.choices?.[0]?.id, 'FIN-0231__0');
assert.equal(finalMemoryQuestion.choices?.[0]?.text, '【真的有人收到了？】');
assert.equal(finalMemoryQuestion.choices?.[0]?.nextId, 'FIN-0232');
assert.equal(
  getFinalFarewellVariant({ ...finalMemoryQuestion.choices![0], text: 'localized text may change' }),
  'remembered_until_end',
  'Final-memory grading must use stable choice identity, not display text',
);

const timeoutPath = linearPath('FIN-0265', 'FIN-0288');
assert.equal(timeoutPath.at(-1), 'FIN-0288');
assert.equal(timeoutPath.includes('FIN-0274'), false);
assert.equal(timeoutPath.includes('FIN-0275'), false);
assert.equal(storyNodeMap.get('FIN-0273')?.nextId, 'FIN-0288');
for (const wrongStart of ['FIN-0246', 'FIN-0253', 'FIN-0259']) {
  assert.equal(canReach(wrongStart, 'FIN-0274'), true, `${wrongStart} must retain the wrong-answer response`);
}
for (const finaleStart of ['FIN-0086', 'FIN-0093', 'FIN-0105', 'FIN-0082']) {
  assert.equal(canReach(finaleStart, 'FIN-0114'), true, `${finaleStart} must rejoin the finale`);
}

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
const finaleDecision = storyNodeMap.get('CH05B-0293')!;
const accepted = applyStoryChoiceEffects(qualified, finaleDecision.choices![0]);
assert.equal(accepted.ending, 'true');
assert.equal(resolveEndingStart('CH05B-0294', accepted), 'CH05B-0294');

const underThreshold = applyStoryChoiceEffects({ ...qualified, trust: 3 }, finaleDecision.choices![0]);
assert.equal(underThreshold.ending, 'normal');
assert.equal(resolveEndingStart('CH05B-0294', underThreshold), 'END-N-0001');

const refused = applyStoryChoiceEffects(qualified, finaleDecision.choices![1]);
assert.equal(refused.ending, 'bad');
assert.equal(resolveEndingStart('END-B-0001', refused), 'END-B-0001');

assert.equal(canReach('CH05B-0294', 'END-T-0006'), true);
assert.equal(canReach('END-N-0001', 'END-N-0013'), true);
assert.equal(canReach('END-B-0001', 'END-B-0041'), true);
assert.equal(storyNodeMap.get('END-T-0006')?.nextId, 'MENU');
assert.equal(storyNodeMap.get('END-N-0013')?.nextId, 'MENU');
assert.equal(storyNodeMap.get('END-B-0041')?.nextId, 'MENU');
assert.ok(getArchiveUnlocksForNode(storyNodeMap.get('END-B-0041')!).includes('ending_bad'));

for (const [index, choice] of finalMemoryQuestion.choices!.entries()) {
  const next = applyStoryChoiceEffects({ ...accepted }, choice);
  assert.equal(next.ending, 'true');
  assert.equal(next.trust, accepted.trust);
  assert.equal(next.memory, accepted.memory);
  assert.deepEqual(next.memoryAnchors, accepted.memoryAnchors);
  assert.equal(next.finalFarewellVariant, index === 0 ? 'remembered_until_end' : 'remembered_wrong');
}
const timedOut = applyTimedChoiceTimeoutEffects(accepted, 'FIN-0231');
assert.equal(timedOut.finalFarewellVariant, 'forgetting_started');
assert.equal(timedOut.ending, 'true');
assert.equal(timedOut.trust, accepted.trust);
assert.equal(timedOut.memory, accepted.memory);

for (const choice of storyNodeMap.get('FIN-0081')!.choices!) {
  const next = applyStoryChoiceEffects(accepted, choice);
  assert.equal(next.ending, 'true');
  assert.equal(next.trust, accepted.trust);
  assert.equal(next.memory, accepted.memory);
}

const interactionCompletions: SpecialInteractionCompletion[] = [
  { kind: 'bulkhead-isolation', routeKey: 'safe' },
  { kind: 'critical-log-password', routeKey: 'success' },
  { kind: 'power-routing', routeKey: 'success', attempt: 1 },
  { kind: 'memory-seal', routeKey: 'goodnight', anchor: 'goodnight' },
  { kind: 'memory-restore', routeKey: 'goodnight', anchor: 'goodnight' },
];
const endingFields = ['trust', 'memory', 'attachment', 'acceptFarewell', 'finalChoice', 'ending'] as const;
for (const completion of interactionCompletions) {
  const next = applySpecialInteractionCompletion(accepted, completion);
  for (const field of endingFields) assert.equal(next[field], accepted[field]);
  assert.deepEqual(next.memoryAnchors, accepted.memoryAnchors);
}

const trueRunArchiveStats: GameStats = {
  ...accepted,
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
