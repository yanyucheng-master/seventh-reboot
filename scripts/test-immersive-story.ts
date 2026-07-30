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
  'CH01-0001',
  'CH02-0001',
  'CH03-0001',
  'CH04-0001',
  'CH05A-0001',
  'CH05B-0001',
  'FIN-0001',
];
const NORMALIZED_MAIN_ID = /^(?:PRO|CH0[1-4]|CH05[AB]|FIN|END-[TNB])-\d{4}$/;

test('01 剧情节点 ID 全部唯一', () => {
  check(new Set(storyNodes.map(item => item.id)).size === storyNodes.length, 'duplicate node ids detected');
  check(storyNodes.length === 2060, `unexpected runtime node count ${storyNodes.length}`);
  storyNodes.forEach(item => check(NORMALIZED_MAIN_ID.test(item.id), `non-normalized runtime id: ${item.id}`));
});

test('02 七个章节边界全部隐藏为内部标记', () => {
  chapterMarkers.forEach(id => check(node(id).type === 'internal-chapter-marker', `${id} is visible chapter`));
  check(!chapterMarkers.some(id => node(id).type === 'chapter'), 'chapter marker still uses chapter banner type');
});

test('03 三类结局入口不会复用章节扉页', () => {
  ['CH03-0157', 'END-N-0001', 'END-B-0001'].forEach(id => {
    check(node(id).type === 'internal-ending-marker', `${id} is not an internal ending marker`);
  });
});

test('04 正式结局标题使用独立类型', () => {
  check(node('END-T-0001').type === 'ending-title', 'true ending title type mismatch');
  check(node('END-N-0009').type === 'ending-title', 'normal ending title type mismatch');
});

test('05 Observer 残响语义和路由准确', () => {
  const echo = node('CH02-0242');
  check(echo.speaker === 'observer' && echo.type === 'observer-echo', 'observer echo identity mismatch');
  check(echo.content === '还给对方一颗', 'observer echo copy mismatch');
  check(echo.nextId === 'CH03-0001', 'observer echo route mismatch');
  check(node('CH02-0241').nextId === 'CH02-0242', 'chapter two offline does not enter echo');
});

test('06 Observer 残响不会进入上一轮同步事件或完成记录', () => {
  const minimalMap = new Map<string, StoryNode>([
    ['PRO-0001', { id: 'PRO-0001', speaker: 'system', type: 'status', content: 'start', nextId: 'CH02-0242' }],
    ['CH02-0242', { ...node('CH02-0242'), nextId: 'CH03-0144' }],
  ]);
  const record: FailedCycleRecord = {
    cycleId: 'cycle-07-observer-test',
    rebootNumber: 7,
    failedAt: 1,
    fatalEndingTriggered: true,
    failedInteractionId: 'CH03-0144',
    failureCause: 'bulkhead_failure',
    completedNodeIds: ['PRO-0001'],
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
  check(!replay.events.some(event => event.nodeId === 'CH02-0242'), 'observer echo became sync event');
  check(!replay.cycleState.completedNodeIds.includes('CH02-0242'), 'observer echo became completed node');
});

test('07 Observer 残响当前循环状态可迁移且默认关闭', () => {
  check(!createCurrentCycleState(7).observerCandyEchoPlayed, 'new cycle starts with echo played');
  check(normalizeCurrentCycleState({ currentRebootNumber: 8 }).observerCandyEchoPlayed === false, 'legacy save migration default mismatch');
  check(normalizeCurrentCycleState({ currentRebootNumber: 8, observerCandyEchoPlayed: true }).observerCandyEchoPlayed, 'echo state was not restored');
});

test('08 已读跳过穿过内部边界但停在残响', () => {
  check(!shouldStopReadSkip(node('CH01-0001'), []), 'internal chapter marker stopped read skip');
  check(!shouldStopReadSkip(node('END-N-0001'), []), 'internal ending marker stopped read skip');
  check(shouldStopReadSkip(node('CH02-0242'), ['CH02-0242']), 'observer echo was skipped as ordinary read text');
});

test('09 草稿与旧式节点命名已从运行时删除', () => {
  check(!storyNodes.some(item => item.type === 'draft'), 'draft message type remains in runtime story');
  check(!storyNodes.some(item => item.id.includes('_')), 'legacy underscore node id remains in runtime story');
});

test('10 章末与牛奶糖路线直接进入正常剧情', () => {
  check(node('PRO-0174').nextId === 'PRO-0175' && node('PRO-0175').nextId === 'CH01-0001', 'prologue boundary mismatch');
  check(node('CH01-0210').nextId === 'CH02-0001', 'chapter one boundary mismatch');
  check(node('CH02-0156').nextId === 'CH02-0157', 'candy image still enters anomaly draft chain');
  check(node('CH03-0251').nextId === 'CH04-0001', 'chapter three boundary mismatch');
});

test('11 第五章回收句完整可达且不替代原文', () => {
  check(node('CH05B-0152').nextId === 'CH05B-0153', 'callback entry route mismatch');
  check(node('CH05B-0153').nextId === 'CH05B-0154', 'callback setup route mismatch');
  check(node('CH05B-0154').content.includes('看不见你记住了什么'), 'callback blind-spot line missing');
  check(node('CH05B-0154').nextId === 'CH05B-0155', 'callback does not return to source flow');
  check(node('CH05B-0171').nextId === 'CH05B-0172' && node('CH05B-0173').nextId === 'CH05B-0174', 'original explanation was displaced');
});

test('12 坏结局完整回收后才覆盖标题', () => {
  check(node('END-B-0038').nextId === 'END-B-0039', 'reboot sequence skips END-B-0039');
  check(node('END-B-0039').nextId === 'END-B-0040', 'reboot log does not reach title state');
  check(node('END-B-0040').type === 'title-state', 'title overwrite type mismatch');
  check(node('END-B-0040').nextId === 'END-B-0041', 'title state does not lead to bad ending archive');
});

test('13 协议回滚拥有独立同步边界', () => {
  check(getSyncBoundaryNodeId('protocol_rollback') === 'CH05B-0293', 'protocol rollback boundary mismatch');
  const failed = createFailedCycleRecord(createCurrentCycleState(7), 'protocol_rollback', 1);
  check(failed.failedInteractionId === 'CH05B-0293', 'protocol rollback failure id mismatch');
});

test('14 第七与第八次序章编号均由状态解析', () => {
  const pro0001Node = node('PRO-0001');
  check(getStoryNodeForReboot(pro0001Node, 7).content.includes('接入编号：07'), 'reboot 07 placeholder did not resolve');
  check(getStoryNodeForReboot(pro0001Node, 8).content.includes('接入编号：08'), 'reboot 08 placeholder did not resolve');
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
  ['CH02-0242', 'CH05B-0153', 'CH05B-0154', 'END-B-0040'].forEach(id => {
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
  check(node('END-B-0041').nextId === 'MENU', 'bad ending archive does not return to menu');
});

test('19 导出器保持 V1.0 与最新文件名', () => {
  const exporter = fs.readFileSync(path.join(root, 'scripts/extract-story-text.ts'), 'utf8');
  check(exporter.includes("const VERSION = 'V1.0'"), 'exporter changed visible version');
  check(exporter.includes('第七次重启_V1.0_无后记主流程_规范化ID版.txt'), 'main export filename is stale');
  check(exporter.includes('第七次重启_V1.0_可选后记_普通与真结局.txt'), 'epilogue export filename is stale');
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
