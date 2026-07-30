import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyArchiveUnlocks,
  getArchiveEntries,
  getArchiveUnlocksForNode,
} from '../src/game/archive.ts';
import { createDefaultNovaAvatarState } from '../src/game/avatarState.ts';
import {
  getEpilogueNodes,
  getLocalizedEpilogueNodes,
  type EpilogueKind,
} from '../src/game/epilogues.ts';
import { storyNodeMap, storyNodes, type StoryNode } from '../src/game/story.ts';
import {
  clearAllData,
  clearSave,
  createNewGameStats,
  createSaveData,
  defaultStats,
  loadGame,
  loadPersistentProgress,
  PERSISTENT_PROGRESS_KEY,
  SAVE_KEY,
  saveGame,
} from '../src/game/storage.ts';

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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAIN_ID = /^(?:PRO|CH0[1-4]|CH05[AB]|FIN|END-[TNB])-\d{4}$/;
const MAIN_PREFIXES = [
  'PRO',
  'CH01',
  'CH02',
  'CH03',
  'CH04',
  'CH05A',
  'CH05B',
  'FIN',
  'END-T',
  'END-N',
  'END-B',
] as const;

function readCanonicalEpilogueSource() {
  const sourcePath = path.join(
    root,
    '..',
    '第七次重启_V1.0_可选后记_普通与真结局.txt',
  );
  const lines = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n?/g, '\n').split('\n');
  const parsed: Array<{ id: string; content: string; delay: number; nextId: string }> = [];
  let current: { id: string; content: string[]; delay?: number; nextId?: string } | null = null;

  const finish = () => {
    if (!current) return;
    assert.equal(typeof current.delay, 'number', `${current.id} source delay is missing`);
    assert.equal(typeof current.nextId, 'string', `${current.id} source next target is missing`);
    parsed.push({
      id: current.id,
      content: current.content.join('\n').trim(),
      delay: current.delay,
      nextId: current.nextId!,
    });
    current = null;
  };

  for (const line of lines) {
    const header = line.match(/^\[(EPI-[NT]-\d{4})\]\s+\(/);
    if (header) {
      finish();
      current = { id: header[1], content: [] };
      continue;
    }
    if (!current) continue;
    const delay = line.match(/^\s*meta:\s*延迟=(\d+)ms\s*$/);
    if (delay) {
      current.delay = Number(delay[1]);
      continue;
    }
    const next = line.match(/^\s*next:\s*(\S+)\s*$/);
    if (next) {
      current.nextId = next[1];
      finish();
      continue;
    }
    current.content.push(line);
  }
  finish();
  return parsed;
}

function node(id: string): StoryNode {
  const value = storyNodeMap.get(id);
  assert.ok(value, `Missing story node ${id}`);
  return value;
}

function targets(item: StoryNode): string[] {
  return [
    item.nextId,
    item.timeoutNextId,
    item.conditionElseNextId,
    ...Object.values(item.specialInputNextIds ?? {}),
    ...Object.values(item.interactionNextIds ?? {}),
    ...(item.choices ?? []).map(choice => choice.nextId),
  ].filter((value): value is string => Boolean(value));
}

function unlockEnding(id: 'END-N-0013' | 'END-T-0006' | 'END-B-0041') {
  const endingNode = node(id);
  return applyArchiveUnlocks(defaultStats, getArchiveUnlocksForNode(endingNode));
}

function assertEpilogueChain(kind: EpilogueKind, expectedCount: number): void {
  const nodes = getEpilogueNodes(kind);
  const prefix = kind === 'normal' ? 'EPI-N-' : 'EPI-T-';
  assert.equal(nodes.length, expectedCount);
  nodes.forEach((item, index) => {
    assert.equal(item.id, `${prefix}${String(index + 1).padStart(4, '0')}`);
    const expectedNext = index === nodes.length - 1
      ? 'MENU'
      : `${prefix}${String(index + 2).padStart(4, '0')}`;
    assert.equal(item.nextId, expectedNext, `${item.id} has an invalid archive-reader route`);
  });
}

const tests: Array<[string, () => void]> = [];
function test(name: string, run: () => void) {
  tests.push([name, run]);
}

test('01 普通结局只解锁后记，不自动进入后记', () => {
  const stats = unlockEnding('END-N-0013');
  assert.equal(node('END-N-0013').nextId, 'MENU');
  assert.equal(stats.normalEpilogueUnlocked, true);
  assert.equal(stats.trueEpilogueUnlocked, false);
  assert.equal(storyNodes.some(item => item.id.startsWith('EPI-N-')), false);
});

test('02 真结局只解锁后记，不自动进入后记', () => {
  const stats = unlockEnding('END-T-0006');
  assert.equal(node('END-T-0006').nextId, 'MENU');
  assert.equal(stats.trueEpilogueUnlocked, true);
  assert.equal(stats.normalEpilogueUnlocked, false);
  assert.equal(storyNodes.some(item => item.id.startsWith('EPI-T-')), false);
});

test('03 坏结局不新增后记解锁，也不清除永久解锁', () => {
  const freshBad = unlockEnding('END-B-0041');
  assert.equal(freshBad.normalEpilogueUnlocked, false);
  assert.equal(freshBad.trueEpilogueUnlocked, false);

  const previouslyUnlocked = applyArchiveUnlocks(defaultStats, ['ending_normal', 'ending_true']);
  const afterBad = applyArchiveUnlocks(
    previouslyUnlocked,
    getArchiveUnlocksForNode(node('END-B-0041')),
  );
  assert.equal(afterBad.normalEpilogueUnlocked, true);
  assert.equal(afterBad.trueEpilogueUnlocked, true);
});

test('04 后记只会由档案中的主动点击打开', () => {
  const archiveSource = fs.readFileSync(
    path.join(root, 'src/game/components/MemoryArchive.tsx'),
    'utf8',
  );
  const readerSource = fs.readFileSync(
    path.join(root, 'src/game/components/EpilogueArchiveReader.tsx'),
    'utf8',
  );
  assert.match(archiveSource, /onSelect=\{selected => \{/);
  assert.match(archiveSource, /setActiveEpilogue\(selected\.epilogueKind\)/);
  assert.doesNotMatch(readerSource, /\bsaveGame\b|\bcurrentNodeId\b|\bsetStats\b|\baddMessage\b/);
  const appSource = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  assert.match(appSource, /hasPersistentArchive/);
  assert.match(appSource, /persistentProgress\.normalEpilogueUnlocked/);
  assert.match(appSource, /persistentProgress\.trueEpilogueUnlocked/);
  assert.match(appSource, /const finishRunToMenu = useCallback\(\(\) => \{\s*clearSave\(\);\s*goToMenu\(\);/);
});

test('05 普通后记独立读取并返回档案，不污染主线快照', () => {
  const mainSnapshot = createSaveData(
    'CH04-0001',
    [],
    createDefaultNovaAvatarState(),
    'verified',
    { ...defaultStats, trust: 3, memory: 2 },
  );
  const before = structuredClone(mainSnapshot);
  assertEpilogueChain('normal', 12);
  const normal = getLocalizedEpilogueNodes('normal', 'zh-CN');
  assert.equal(normal.every(item => item.id.startsWith('EPI-N-')), true);
  assert.deepEqual(mainSnapshot, before);
});

test('06 真结局后记与普通后记严格分离，中英文均完整', () => {
  assertEpilogueChain('true', 13);
  const trueZh = getLocalizedEpilogueNodes('true', 'zh-CN');
  const trueEn = getLocalizedEpilogueNodes('true', 'en-US');
  assert.equal(trueZh.every(item => item.id.startsWith('EPI-T-')), true);
  assert.equal(trueEn.every(item => item.id.startsWith('EPI-T-')), true);
  assert.equal(trueEn.some(item => /\p{Script=Han}/u.test(item.content)), false);
  assert.equal(getLocalizedEpilogueNodes('normal', 'en-US').some(
    item => /\p{Script=Han}/u.test(item.content),
  ), false);
});

test('07 新周目与清除活动存档保留后记', () => {
  clearAllData();
  const unlocked = applyArchiveUnlocks(defaultStats, ['ending_normal', 'ending_true']);
  saveGame(createSaveData(
    'PRO-0001',
    [],
    createDefaultNovaAvatarState(),
    'verified',
    unlocked,
  ));
  clearSave();
  const fresh = createNewGameStats();
  assert.equal(fresh.normalEpilogueUnlocked, true);
  assert.equal(fresh.trueEpilogueUnlocked, true);
  assert.equal(fresh.trust, 0);
  assert.equal(fresh.memory, 0);
});

test('08 旧存档按既有结局补发解锁，未通关记录不误解锁', () => {
  clearAllData();
  localStorage.setItem(PERSISTENT_PROGRESS_KEY, JSON.stringify({
    version: 3,
    unlockedArchives: ['ending_true'],
    endingsUnlocked: ['ending_true'],
    readNodeIds: [],
    currentRebootNumber: 7,
    failedCycles: [],
  }));
  const persistent = loadPersistentProgress();
  assert.equal(persistent.trueEpilogueUnlocked, true);
  assert.equal(persistent.normalEpilogueUnlocked, false);

  clearAllData();
  const current = createSaveData(
    'END-N-0009',
    [],
    createDefaultNovaAvatarState(),
    'verified',
    defaultStats,
  ) as unknown as Record<string, unknown>;
  const legacyStats = { ...(current.stats as Record<string, unknown>) };
  delete legacyStats.normalEpilogueUnlocked;
  delete legacyStats.trueEpilogueUnlocked;
  current.pendingNodeId = 'normal_8';
  current.storyContentVersion = 'v1.0-immersive-echo-20260722';
  current.saveStateVersion = 3;
  current.stats = legacyStats;
  localStorage.setItem(SAVE_KEY, JSON.stringify(current));
  const migrated = loadGame();
  assert.ok(migrated);
  assert.equal(migrated.pendingNodeId, 'END-N-0009');
  assert.equal(migrated.stats.normalEpilogueUnlocked, true);
  assert.equal(migrated.stats.trueEpilogueUnlocked, false);

  clearAllData();
  const untouched = createNewGameStats();
  assert.equal(untouched.normalEpilogueUnlocked, false);
  assert.equal(untouched.trueEpilogueUnlocked, false);
});

test('09 主流程和后记 ID、跳转与解锁入口完整', () => {
  assert.equal(storyNodes.length, 2060);
  assert.equal(new Set(storyNodes.map(item => item.id)).size, storyNodes.length);
  storyNodes.forEach(item => {
    assert.match(item.id, MAIN_ID);
    targets(item).forEach(target => {
      assert.equal(target.startsWith('EPI-'), false, `${item.id} auto-routes into ${target}`);
      assert.ok(target === 'MENU' || storyNodeMap.has(target), `${item.id} targets missing ${target}`);
    });
    item.choices?.forEach((choice, index) => {
      assert.equal(choice.id, `${item.id}__${index}`);
    });
  });

  MAIN_PREFIXES.forEach(prefix => {
    const ids = storyNodes.filter(item => item.id.startsWith(`${prefix}-`)).map(item => item.id);
    ids.forEach((id, index) => {
      assert.equal(id, `${prefix}-${String(index + 1).padStart(4, '0')}`);
    });
  });

  const epilogues = [...getEpilogueNodes('normal'), ...getEpilogueNodes('true')];
  assert.deepEqual(epilogues, readCanonicalEpilogueSource());
  const allIds = new Set([...storyNodes.map(item => item.id), ...epilogues.map(item => item.id)]);
  assert.equal(allIds.size, storyNodes.length + epilogues.length);
  assert.equal(epilogues.length, 25);

  const lockedByForgedArchiveList = getArchiveEntries(
    { ...defaultStats, unlockedArchives: ['epilogue_normal', 'epilogue_true'] },
    'verified',
  ).filter(entry => entry.category === 'future');
  assert.equal(lockedByForgedArchiveList.every(entry => !entry.unlocked), true);
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

clearAllData();
console.log(`\nOptional epilogue checks: ${passed}/${tests.length} passed.`);
