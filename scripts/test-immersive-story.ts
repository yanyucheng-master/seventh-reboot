import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCHIVE_ENTRIES } from '../src/game/archive';
import {
  createCurrentCycleState,
  createFailedCycleRecord,
  getStoryNodeForReboot,
  getSyncBoundaryNodeId,
  normalizeCurrentCycleState,
  replayFailedCycle,
  shouldStopReadSkip,
} from '../src/game/cycleState';
import { storyNodeMap, storyNodes, type StoryNode } from '../src/game/story';
import { defaultStats } from '../src/game/storage';
import type { FailedCycleRecord } from '../src/game/types';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function node(id: string): StoryNode {
  const value = storyNodeMap.get(id);
  check(value, `missing story node ${id}`);
  return value;
}

const tests: Array<[string, () => void]> = [];
function test(name: string, run: () => void) { tests.push([name, run]); }

const chapterMarkers = [
  'CH1_START',
  'CH2_START',
  'CH3_START',
  'CH4_START',
  'CH5A_START',
  'CH5B_START',
  'FINALE_START',
];
const removedNodeIds = [
  'p_draft1',
  'ch1_draft',
  'ch1_draft1',
  'ch2_draft',
  'ch2_draft1',
  'ch3_draft',
  'ch3_draft1',
  'ch2_candy_anom1',
  'ch2_candy_anom2',
  'ch2_candy_anom3',
  'ch2_candy_anom4',
  'ch2_candy_anom5',
  'ch2_candy_anom6',
  'ch2_candy_anom7',
  'ch2_candy_anom8',
  'ch2_candy_anom8b',
  'ch2_candy_anom_merge',
  'ch2_candy_anom9',
  'ch2_candy_anom10',
  'bad_action_prompt',
  'bad_action_choice',
  'bad_action_restart',
];

test('01 剧情节点 ID 全部唯一', () => {
  check(new Set(storyNodes.map(item => item.id)).size === storyNodes.length, 'duplicate node ids detected');
  check(storyNodes.length === 2086, `unexpected runtime node count ${storyNodes.length}`);
});

test('02 七个章节边界全部隐藏为内部标记', () => {
  chapterMarkers.forEach(id => check(node(id).type === 'internal-chapter-marker', `${id} is visible chapter`));
  check(!chapterMarkers.some(id => node(id).type === 'chapter'), 'chapter marker still uses chapter banner type');
});

test('03 三类结局入口不会复用章节扉页', () => {
  ['EARLY_BAD_END_START', 'NORMAL_END_START', 'BAD_END_START'].forEach(id => {
    check(node(id).type === 'internal-ending-marker', `${id} is not an internal ending marker`);
  });
});

test('04 正式结局标题使用独立类型', () => {
  check(node('fin_credit_title').type === 'ending-title', 'true ending title type mismatch');
  check(node('normal_title').type === 'ending-title', 'normal ending title type mismatch');
});

test('05 Observer 残响语义和路由准确', () => {
  const echo = node('ch2_observer_echo');
  check(echo.speaker === 'observer' && echo.type === 'observer-echo', 'observer echo identity mismatch');
  check(echo.content === '还给对方一颗', 'observer echo copy mismatch');
  check(echo.nextId === 'CH3_START', 'observer echo route mismatch');
  check(node('ch2_offline').nextId === 'ch2_observer_echo', 'chapter two offline does not enter echo');
});

test('06 Observer 残响不会进入上一轮同步事件或完成记录', () => {
  const minimalMap = new Map<string, StoryNode>([
    ['p0', { id: 'p0', speaker: 'system', type: 'status', content: 'start', nextId: 'ch2_observer_echo' }],
    ['ch2_observer_echo', { ...node('ch2_observer_echo'), nextId: 'ch3_airlock_interaction' }],
  ]);
  const record: FailedCycleRecord = {
    cycleId: 'cycle-07-observer-test',
    rebootNumber: 7,
    failedAt: 1,
    fatalEndingTriggered: true,
    failedInteractionId: 'ch3_airlock_interaction',
    failureCause: 'bulkhead_failure',
    completedNodeIds: ['p0'],
    choiceHistory: [],
    interactionResults: [],
    timedResults: [],
    freeInputs: [],
  };
  const replay = replayFailedCycle(
    record,
    minimalMap,
    { ...defaultStats, memoryAnchors: [], unlockedArchives: [], endingsUnlocked: [] },
    createCurrentCycleState(8, record),
  );
  check(replay.reachedBoundary, 'minimal replay did not reach fatal boundary');
  check(!replay.events.some(event => event.nodeId === 'ch2_observer_echo'), 'observer echo became sync event');
  check(!replay.cycleState.completedNodeIds.includes('ch2_observer_echo'), 'observer echo became completed node');
});

test('07 Observer 残响当前循环状态可迁移且默认关闭', () => {
  check(!createCurrentCycleState(7).observerCandyEchoPlayed, 'new cycle starts with echo played');
  check(normalizeCurrentCycleState({ currentRebootNumber: 8 }).observerCandyEchoPlayed === false, 'legacy save migration default mismatch');
  check(normalizeCurrentCycleState({ currentRebootNumber: 8, observerCandyEchoPlayed: true }).observerCandyEchoPlayed, 'echo state was not restored');
});

test('08 已读跳过穿过内部边界但停在残响', () => {
  check(!shouldStopReadSkip(node('CH1_START'), []), 'internal chapter marker stopped read skip');
  check(!shouldStopReadSkip(node('NORMAL_END_START'), []), 'internal ending marker stopped read skip');
  check(shouldStopReadSkip(node('ch2_observer_echo'), ['ch2_observer_echo']), 'observer echo was skipped as ordinary read text');
});

test('09 草稿与牛奶糖异常链已从运行时删除', () => {
  removedNodeIds.forEach(id => check(!storyNodeMap.has(id), `removed node still exists: ${id}`));
  check(!storyNodes.some(item => item.type === 'draft'), 'draft message type remains in runtime story');
});

test('10 章末与牛奶糖路线直接进入正常剧情', () => {
  check(node('p_offline1').nextId === 'p_end' && node('p_end').nextId === 'CH1_START', 'prologue boundary mismatch');
  check(node('ch1_night33').nextId === 'CH2_START', 'chapter one boundary mismatch');
  check(node('ch2_candy8').nextId === 'ch2_night1', 'candy image still enters anomaly draft chain');
  check(node('ch3_offline').nextId === 'CH4_START', 'chapter three boundary mismatch');
});

test('11 第五章回收句完整可达且不替代原文', () => {
  check(node('ch5b_file22h').nextId === 'ch5b_echo_record1', 'callback entry route mismatch');
  check(node('ch5b_echo_record1').nextId === 'ch5b_echo_record2', 'callback setup route mismatch');
  check(node('ch5b_echo_record2').content.includes('看不见你记住了什么'), 'callback blind-spot line missing');
  check(node('ch5b_echo_record2').nextId === 'ch5b_split1', 'callback does not return to source flow');
  check(node('ch5b_split10').nextId === 'ch5b_file22i' && node('ch5b_file22j').nextId === 'ch5b_file23', 'original explanation was displaced');
});

test('12 坏结局完整回收后才覆盖标题', () => {
  check(node('bad_15').nextId === 'bad_16', 'reboot sequence skips bad_16');
  check(node('bad_16').nextId === 'bad_title_overwrite', 'reboot log does not reach title state');
  check(node('bad_title_overwrite').type === 'title-state', 'title overwrite type mismatch');
  check(node('bad_title_overwrite').nextId === 'bad_end', 'title state does not lead to bad ending archive');
});

test('13 协议回滚拥有独立同步边界', () => {
  check(getSyncBoundaryNodeId('protocol_rollback') === 'ch5b_fin3', 'protocol rollback boundary mismatch');
  const failed = createFailedCycleRecord(createCurrentCycleState(7), 'protocol_rollback', 1);
  check(failed.failedInteractionId === 'ch5b_fin3', 'protocol rollback failure id mismatch');
});

test('14 第七与第八次序章编号均由状态解析', () => {
  const p0 = node('p0');
  check(getStoryNodeForReboot(p0, 7).content.includes('接入编号：07'), 'reboot 07 placeholder did not resolve');
  check(getStoryNodeForReboot(p0, 8).content.includes('接入编号：08'), 'reboot 08 placeholder did not resolve');
});

test('15 静态草稿档案已删除', () => {
  const ids = new Set(ARCHIVE_ENTRIES.map(entry => entry.id));
  check(!ids.has('anomaly_unsent_n7_draft'), 'unsent draft archive remains');
  check(!ids.has('anomaly_encrypted_observatory_draft'), 'encrypted draft archive remains');
});

test('16 英文拓扑无中文兜底且包含新增节点', () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en-US/story.json'), 'utf8')) as {
    nodes: Record<string, { content?: string; choices?: Record<string, string> }>;
  };
  ['ch2_observer_echo', 'ch5b_echo_record1', 'ch5b_echo_record2', 'bad_title_overwrite'].forEach(id => {
    check(en.nodes[id], `english story missing ${id}`);
  });
  for (const [id, entry] of Object.entries(en.nodes)) {
    check(!/\p{Script=Han}/u.test(entry.content ?? ''), `english content contains Han text: ${id}`);
    Object.values(entry.choices ?? {}).forEach(value => {
      check(!/\p{Script=Han}/u.test(value), `english choice contains Han text: ${id}`);
    });
  }
});

test('17 页面流程不会把 Observer 残响写入消息流', () => {
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  const branch = app.slice(app.indexOf("if (node.type === 'observer-echo')"), app.indexOf("if (node.type === 'title-state')"));
  check(branch.includes('observerCandyEchoPlayed: true'), 'echo playback receipt is not persisted');
  check(branch.includes('setObserverEcho(node.content)'), 'echo overlay is not activated');
  check(!branch.includes('addMessage('), 'echo branch writes into chat messages');
});

test('18 标题状态强制归档并返回 REBOOT 08 菜单', () => {
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  check(app.includes("statsRef.current.earlyFailureCause ?? 'protocol_rollback'"), 'title state lacks protocol rollback fallback');
  check(app.includes('archiveCurrentFatalCycle(messagesRef.current'), 'title state does not archive fatal cycle');
  check(!storyNodeMap.has('bad_action_restart'), 'direct bad-ending retry remains available');
});

test('19 导出器保持 V1.0 与最新文件名', () => {
  const exporter = fs.readFileSync(path.join(root, 'scripts/extract-story-text.ts'), 'utf8');
  check(exporter.includes("const VERSION = 'V1.0'"), 'exporter changed visible version');
  check(exporter.includes('第七次重启_剧情文本_V1_0_沉浸式章节与观察者残响最终版.txt'), 'export filename is stale');
  check(!/V1\.1|V2\.0/.test(exporter), 'exporter introduces a non-V1.0 version');
});

test('20 Observer 动效保持克制且不使用故障红闪', () => {
  const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
  const block = css.slice(css.indexOf('.observer-echo-layer'), css.indexOf('.ending-title-wrap'));
  check(block.includes('pointer-events: none'), 'observer echo is interactive');
  check(block.includes('filter: blur'), 'observer echo lacks blur-to-clear motion');
  check(!/#(?:f00|ff0000)|rgba\(255,\s*0,\s*0/.test(block), 'observer echo contains saturated red');
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

console.log(`\nImmersive story checks: ${passed}/${tests.length} passed.`);
