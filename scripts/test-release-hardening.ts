import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultNovaAvatarState } from '../src/game/avatarState.ts';
import {
  clampRebootNumber,
  clearTimedDeadline,
  createCurrentCycleState,
  ensureTimedDeadline,
  getTimedRemainingMs,
  normalizeCurrentCycleState,
  recordCycleChoice,
} from '../src/game/cycleState.ts';
import { createDefaultChatDeliveryRuntime } from '../src/game/delivery/state.ts';
import { isObserverIdentityEstablished, resolveTitleLinkMeta } from '../src/game/identity.ts';
import { getTimedNodeDurationMs } from '../src/game/timedRuntime.ts';
import {
  createSaveData,
  defaultContactStage,
  defaultStats,
  loadPersistentProgress,
  migrateSaveData,
  PERSISTENT_PROGRESS_KEY,
  SAVE_STATE_VERSION,
} from '../src/game/storage.ts';
import { storyNodeMap, storyNodes } from '../src/game/story.ts';
import type { FatalFailureCause } from '../src/game/types.ts';

class TestStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new TestStorage() });

const tests: Array<[string, () => void]> = [];
function test(name: string, run: () => void) { tests.push([name, run]); }

type UiFixture = {
  game: Record<string, string>;
  archiveOverlay: { failureCauses: Record<string, string> };
  rebootFallback: Record<string, unknown>;
};

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

test('01 Observer 身份只在首次回复 delivered 后建立', () => {
  const runtime = createDefaultChatDeliveryRuntime();
  assert.equal(isObserverIdentityEstablished(runtime), false);
  assert.deepEqual(resolveTitleLinkMeta(7, false), {
    contactCode: 'LINK-07',
    observerCode: 'UNREGISTERED',
  });

  runtime.receipts.prologueFirstReply = 'completed';
  assert.equal(isObserverIdentityEstablished(runtime), true);
  assert.deepEqual(resolveTitleLinkMeta(7, true), {
    contactCode: 'LIVE-07',
    observerCode: 'OBSERVER-01',
  });
  assert.equal(isObserverIdentityEstablished(createDefaultChatDeliveryRuntime(), true), true);

  const zh = readJson<UiFixture>('src/i18n/locales/zh-CN/ui.json');
  const en = readJson<UiFixture>('src/i18n/locales/en-US/ui.json');
  assert.equal(String(zh.game.memoryRecordedPending).includes('Observer-01'), false);
  assert.equal(String(en.game.memoryRecordedPending).includes('Observer-01'), false);
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  assert.match(app, /memoryRecordedPending/);
  assert.match(app, /observerEstablished=\{menuObserverEstablished\}/);
  const startup = fs.readFileSync(path.join(root, 'src/game/components/NativeStartupSequence.tsx'), 'utf8');
  assert.doesNotMatch(startup, /OBSERVER-01/);
  for (const locale of ['zh-CN', 'en-US']) {
    const archive = readJson<{ entries: Record<string, { description: string; chapter: string }> }>(
      `src/i18n/locales/${locale}/archive.json`,
    );
    assert.doesNotMatch(
      `${archive.entries.anchor_first_message.description}\n${archive.entries.anchor_first_message.chapter}`,
      /Observer-01/i,
    );
  }
});

test('02 REBOOT 08 保留 Observer 但只显示空 LIVE-07 链路', () => {
  const meta = resolveTitleLinkMeta(8, true);
  assert.equal(meta.contactCode, 'LIVE-07 / NOT FOUND');
  assert.equal(meta.observerCode, 'OBSERVER-01');
  assert.equal(JSON.stringify(meta).includes('NOVA-08'), false);

  const titleSource = fs.readFileSync(path.join(root, 'src/game/components/GameTitle.tsx'), 'utf8');
  assert.equal(titleSource.includes('NOVA-{'), false);
  assert.equal(titleSource.includes('NOVA-08'), false);
});

test('03 内部 Skip 与调试面板只允许 DEV 构建', () => {
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  const avatarDebug = fs.readFileSync(path.join(root, 'src/game/components/AvatarDebugPanel.tsx'), 'utf8');
  assert.match(app, /const INTERNAL_TEST_SKIP_ENABLED = import\.meta\.env\.DEV;/);
  assert.doesNotMatch(app, /INTERNAL_TEST_SKIP_ENABLED\s*=\s*true/);
  assert.match(app, /import\.meta\.env\.DEV\s*&&\s*\(/);
  assert.match(avatarDebug, /if \(!import\.meta\.env\.DEV\) return null;/);
});

test('04 FIN-0040 截止时间跨保存恢复且过期不会重置', () => {
  const node = storyNodeMap.get('FIN-0040');
  assert.ok(node);
  assert.equal(getTimedNodeDurationMs(node), 5_000);

  const armed = ensureTimedDeadline(createCurrentCycleState(7, undefined, 100), node.id, 5_000, 1_000);
  assert.equal(armed.deadlineAt, 6_000);
  const save = createSaveData(
    node.id,
    [],
    createDefaultNovaAvatarState(),
    defaultContactStage,
    { ...defaultStats },
    createDefaultChatDeliveryRuntime(),
    armed.state,
  );
  const restored = migrateSaveData(JSON.parse(JSON.stringify(save)));
  assert.ok(restored);
  assert.equal(restored.saveStateVersion, SAVE_STATE_VERSION);
  assert.equal(restored.cycleState.timedDeadlines[node.id], 6_000);
  assert.equal(getTimedRemainingMs(restored.cycleState, node.id, 5_000), 1_000);
  assert.equal(getTimedRemainingMs(restored.cycleState, node.id, 6_001), 0);
  assert.equal(ensureTimedDeadline(restored.cycleState, node.id, 5_000, 5_000).deadlineAt, 6_000);

  const completed = recordCycleChoice(restored.cycleState, {
    nodeId: node.id,
    choiceId: 'FIN-0040__0',
    choiceIndex: 0,
    nextId: 'FIN-0041',
    committedAt: 5_100,
  });
  assert.equal(getTimedRemainingMs(completed, node.id, 5_100), undefined);
});

test('04B 所有限时剧情选项共用持久化截止时间', () => {
  const timedChoiceNodes = storyNodes.filter((node) => (node.choiceTimeoutMs ?? 0) > 0);
  assert.equal(timedChoiceNodes.length, 7);

  for (const node of timedChoiceNodes) {
    const duration = getTimedNodeDurationMs(node);
    assert.equal(duration, node.choiceTimeoutMs, `${node.id} did not resolve its authored duration`);
    assert.ok(node.timeoutNextId, `${node.id} is missing a timeout branch`);

    const armed = ensureTimedDeadline(createCurrentCycleState(7), node.id, duration!, 1_000);
    const reloaded = normalizeCurrentCycleState(JSON.parse(JSON.stringify(armed.state)));
    const reentered = ensureTimedDeadline(reloaded, node.id, duration!, 2_000);
    assert.equal(reentered.deadlineAt, 1_000 + duration!, `${node.id} reset after reload`);
    assert.equal(getTimedRemainingMs(reentered.state, node.id, 1_001 + duration!), 0);
  }
});

test('05 CourseLock 与 ProtocolCut 退出重进不刷新时间', () => {
  for (const [nodeId, expectedDuration] of [['CH05B-0080', 35_000], ['CH05B-0102', 28_000]] as const) {
    const node = storyNodeMap.get(nodeId);
    assert.ok(node);
    assert.equal(getTimedNodeDurationMs(node), expectedDuration);
    const first = ensureTimedDeadline(createCurrentCycleState(7), nodeId, expectedDuration, 10_000);
    const reloaded = normalizeCurrentCycleState(JSON.parse(JSON.stringify(first.state)));
    const reentered = ensureTimedDeadline(reloaded, nodeId, expectedDuration, 20_000);
    assert.equal(reentered.deadlineAt, 10_000 + expectedDuration, `${nodeId} reset on re-entry`);
    assert.equal(getTimedRemainingMs(reentered.state, nodeId, 10_001 + expectedDuration), 0);
    assert.equal(getTimedRemainingMs(clearTimedDeadline(reentered.state, nodeId), nodeId), undefined);
  }
});

test('06 循环编号正式运行时只能是 7 或 8', () => {
  assert.equal(clampRebootNumber(-5), 7);
  assert.equal(clampRebootNumber(7), 7);
  assert.equal(clampRebootNumber(8), 8);
  assert.equal(clampRebootNumber(99), 8);
  assert.equal(normalizeCurrentCycleState({ currentRebootNumber: 11 }).currentRebootNumber, 8);
  localStorage.setItem(PERSISTENT_PROGRESS_KEY, JSON.stringify({
    version: 5,
    currentRebootNumber: 42,
    reboot08TitleUnlocked: true,
  }));
  assert.equal(loadPersistentProgress().currentRebootNumber, 8);
  localStorage.setItem(PERSISTENT_PROGRESS_KEY, JSON.stringify({
    version: 5,
    currentRebootNumber: 42,
    reboot08TitleUnlocked: false,
  }));
  assert.equal(loadPersistentProgress().currentRebootNumber, 7);
  localStorage.removeItem(PERSISTENT_PROGRESS_KEY);
});

test('07 所有正式致死原因都有完整中英文标签', () => {
  const causes = [
    'bulkhead_failure',
    'power_routing_failure',
    'course_lock_failure',
    'protocol_cut_failure',
    'protocol_refusal',
    'protocol_rollback',
  ] satisfies FatalFailureCause[];
  const zh = readJson<UiFixture>('src/i18n/locales/zh-CN/ui.json').archiveOverlay.failureCauses;
  const en = readJson<UiFixture>('src/i18n/locales/en-US/ui.json').archiveOverlay.failureCauses;
  for (const cause of causes) {
    assert.ok(zh[cause], `missing zh failure label: ${cause}`);
    assert.ok(en[cause], `missing en failure label: ${cause}`);
    assert.doesNotMatch(en[cause], /\p{Script=Han}/u, `English failure label contains Han text: ${cause}`);
  }
});

test('08 回读演出英文、manifest 与发布可访问性无泄漏', () => {
  const en = readJson<UiFixture>('src/i18n/locales/en-US/ui.json');
  assert.doesNotMatch(JSON.stringify(en.rebootFallback), /\p{Script=Han}/u);
  const manifest = readJson<{ description: string }>('public/site.webmanifest');
  assert.equal(String(manifest.description).includes('Observer-01'), false);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
  assert.equal((html.match(/title_wordmark_.*particles/g) ?? []).length, 0);
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  assert.match(app, /prefers-reduced-motion: reduce/);
  assert.match(app, /!reducedMotion && !soft && cue\.haptic/);
});

test('09 剧情真源与观测室资源边界留在仓库内', () => {
  const canonical = path.join(root, 'story-source/main.zh-CN.txt');
  assert.equal(fs.existsSync(canonical), true);
  const toolFiles = [
    'scripts/audit-story-vs-source.mjs',
    'scripts/build-bilingual-stories.mjs',
    'scripts/build-story-docx.py',
    'scripts/deep-audit-story.mjs',
    'scripts/import-exported-story.mjs',
    'scripts/rebuild-locales-from-sources.mjs',
  ];
  for (const file of toolFiles) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /story-source/);
    assert.doesNotMatch(source, /path\.join\(root, '\.\.'\)|parents\[2\]/, `${file} still depends on the repository parent`);
  }
  const canonicalText = fs.readFileSync(canonical, 'utf8');
  assert.match(canonicalText, /中文剧情唯一真源/);
  assert.doesNotMatch(canonicalText, /唯一剧情依据/);
  assert.equal(fs.existsSync(path.join(root, 'public/assets/nova_observatory.png')), false);
  assert.equal(fs.existsSync(path.join(root, 'public/assets/photo_observatory.jpg')), true);
  assert.match(fs.readFileSync(path.join(root, 'src/game/story.ts'), 'utf8'), /photo_observatory\.jpg/);
});

let passed = 0;
for (const [name, run] of tests) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}
console.log(`Release hardening tests passed: ${passed}/${tests.length}`);
