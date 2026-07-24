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
assert.equal(ARCHIVE_ENTRIES.length, 27, 'Archive total must reflect the two removed draft records');

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
const queue = ['p0', 'NORMAL_END_START'];
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
  const nextTargets = node.id === 'bad_action_restart'
    ? []
    : node.id === 'ch5a_auth_input'
      ? targets(node).filter(target => target !== 'ch5a_auth_retry1')
      : targets(node);
  nextTargets.forEach(assertAcyclic);
  visiting.delete(id);
  visited.add(id);
}
assertAcyclic('p0');
assertAcyclic('NORMAL_END_START');

const timedNodes = storyNodes.filter(node => node.choiceTimeoutMs !== undefined);
assert.deepEqual(
  timedNodes.map(node => node.id),
  ['ch1_go1', 'ch3_ref16', 'ch4_27', 'ch5a_firstline_choice', 'ch5b_obs13', 'fin_q6', 'fin_last6'],
);
for (const node of timedNodes) {
  assert.ok(node.timeoutNextId, `${node.id} requires an explicit timeout route`);
  assert.ok(node.choices?.length, `${node.id} requires choices`);
}

const finalMemoryQuestion = storyNodeMap.get('fin_last6')!;
assert.equal(finalMemoryQuestion.choiceTimeoutMs, 5000);
assert.equal(finalMemoryQuestion.choices?.[0]?.id, 'fin_last6__0');
assert.equal(finalMemoryQuestion.choices?.[0]?.text, '【真的有人收到了？】');
assert.equal(finalMemoryQuestion.choices?.[0]?.nextId, 'fin_correct1');
assert.equal(
  getFinalFarewellVariant({ ...finalMemoryQuestion.choices![0], text: 'localized text may change' }),
  'remembered_until_end',
  'Final-memory grading must use stable choice identity, not display text',
);

const timeoutPath = linearPath('fin_timeout1', 'fin_breakdown');
assert.equal(timeoutPath.at(-1), 'fin_breakdown');
assert.equal(timeoutPath.includes('fin_memory_shift'), false);
assert.equal(timeoutPath.includes('fin_wrong_common'), false);
assert.equal(storyNodeMap.get('fin_timeout8')?.nextId, 'fin_breakdown');
for (const wrongStart of ['fin_wrong_iam1', 'fin_wrong_nice1', 'fin_wrong_forever1']) {
  assert.equal(canReach(wrongStart, 'fin_memory_shift'), true, `${wrongStart} must retain the wrong-answer response`);
}
for (const finaleStart of ['fin_q_yes1', 'fin_q_no1', 'fin_q_unknown1', 'fin_q_timeout1']) {
  assert.equal(canReach(finaleStart, 'fin_q_merge2'), true, `${finaleStart} must rejoin the finale`);
}

const chapterFourProof = storyNodeMap.get('ch4_27')!;
for (const choice of chapterFourProof.choices!) {
  const before = { ...defaultStats, trust: 3, memory: 2 };
  const after = applyStoryChoiceEffects(before, choice);
  assert.equal(after.trust, before.trust, `${choice.id} must not change trust during the timed proof`);
  assert.equal(after.memory, before.memory, `${choice.id} must not change memory during the timed proof`);
  assert.equal(canReach(choice.nextId, 'ch4_n7_name'), true, `${choice.id} must still reach the N7 recovery`);
  assert.equal(canReach(choice.nextId, 'ch4_n7_21'), true, `${choice.id} must preserve the N7 reassurance sequence`);
}
assert.equal(canReach(chapterFourProof.timeoutNextId!, 'ch4_n7_name'), true);
assert.equal(canReach(chapterFourProof.timeoutNextId!, 'ch4_n7_21'), true);

const qualified: GameStats = {
  ...defaultStats,
  trust: 4,
  memory: 4,
  memoryAnchors: [...ALL_ANCHORS],
};
const finaleDecision = storyNodeMap.get('ch5b_fin3')!;
const accepted = applyStoryChoiceEffects(qualified, finaleDecision.choices![0]);
assert.equal(accepted.ending, 'true');
assert.equal(resolveEndingStart('FINALE_DECISION_END', accepted), 'FINALE_DECISION_END');

const underThreshold = applyStoryChoiceEffects({ ...qualified, trust: 3 }, finaleDecision.choices![0]);
assert.equal(underThreshold.ending, 'normal');
assert.equal(resolveEndingStart('FINALE_DECISION_END', underThreshold), 'NORMAL_END_START');

const refused = applyStoryChoiceEffects(qualified, finaleDecision.choices![1]);
assert.equal(refused.ending, 'bad');
assert.equal(resolveEndingStart('BAD_END_START', refused), 'BAD_END_START');

assert.equal(canReach('FINALE_DECISION_END', 'fin_the_end'), true);
assert.equal(canReach('NORMAL_END_START', 'normal_end'), true);
assert.equal(canReach('BAD_END_START', 'bad_end'), true);
assert.equal(storyNodeMap.get('fin_the_end')?.nextId, 'MENU');
assert.equal(storyNodeMap.get('normal_end')?.nextId, 'MENU');
assert.equal(storyNodeMap.get('bad_end')?.nextId, 'MENU');
assert.ok(getArchiveUnlocksForNode(storyNodeMap.get('bad_end')!).includes('ending_bad'));

for (const [index, choice] of finalMemoryQuestion.choices!.entries()) {
  const next = applyStoryChoiceEffects({ ...accepted }, choice);
  assert.equal(next.ending, 'true');
  assert.equal(next.trust, accepted.trust);
  assert.equal(next.memory, accepted.memory);
  assert.deepEqual(next.memoryAnchors, accepted.memoryAnchors);
  assert.equal(next.finalFarewellVariant, index === 0 ? 'remembered_until_end' : 'remembered_wrong');
}
const timedOut = applyTimedChoiceTimeoutEffects(accepted, 'fin_last6');
assert.equal(timedOut.finalFarewellVariant, 'forgetting_started');
assert.equal(timedOut.ending, 'true');
assert.equal(timedOut.trust, accepted.trust);
assert.equal(timedOut.memory, accepted.memory);

for (const choice of storyNodeMap.get('fin_q6')!.choices!) {
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
  unlockedArchives: ARCHIVE_ENTRIES.filter(entry => entry.category !== 'ending').map(entry => entry.id),
  endingsUnlocked: ['ending_true'],
};
const trueRunEntries = getArchiveEntries(trueRunArchiveStats, 'verified');
assert.equal(trueRunEntries.filter(entry => entry.unlocked).length, ARCHIVE_ENTRIES.length - 2);
assert.deepEqual(
  trueRunEntries.filter(entry => !entry.unlocked).map(entry => entry.id),
  ['ending_normal', 'ending_bad'],
  'The only locked records must be the two unobserved ending branches',
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

const firstSave = applyPersistentStoryNodeEffects({ ...trueRunArchiveStats }, 'fin_action_save');
const secondSave = applyPersistentStoryNodeEffects(firstSave, 'fin_action_save');
assert.equal(firstSave.commemorativeArchiveSaved, true);
assert.equal(secondSave, firstSave, 'Commemorative archive save must be idempotent');

clearAllData();
saveGame(createSaveData('fin_the_end', [], createDefaultNovaAvatarState(), 'verified', firstSave));
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
  currentNodeId: 'p13e',
  messages: [{
    id: 'p13e_legacy',
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
  currentNodeId: 'p13e',
  stats: { trust: 2 },
  timestamp: Date.now() - 1000,
}));
const migratedWithoutMessages = loadGame();
assert.equal(migratedWithoutMessages, null, 'Incomplete legacy saves must not enter the new branch topology');

localStorage.setItem(SAVE_KEY, JSON.stringify({
  pendingNodeId: 'p0',
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
