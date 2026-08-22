import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCHIVE_ENTRIES } from '../src/game/archive';
import {
  createCurrentCycleState,
  getStoryNodeForReboot,
  normalizeCurrentCycleState,
  shouldStopReadSkip,
} from '../src/game/cycleState';
import {
  createLegacyMessageState,
  getOrCreateLegacyMessageSnapshot,
  LEGACY_MESSAGES,
} from '../src/game/legacyMessages';
import { storyNodeMap, storyNodes, type StoryNode } from '../src/game/story';

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
const NORMALIZED_MAIN_ID = /^(?:(?:PRO|CH0[1-4]|CH05[AB]|FIN|END-[TNB])-\d{4}|(?:CH03|CH05B)-GRAV-\d{4})$/;

test('01 剧情节点 ID 唯一且符合 V1.0 命名范围', () => {
  check(new Set(storyNodes.map(item => item.id)).size === storyNodes.length, 'duplicate node ids detected');
  check(storyNodes.length === 1494, `unexpected runtime node count ${storyNodes.length}`);
  storyNodes.forEach(item => check(NORMALIZED_MAIN_ID.test(item.id), `non-normalized runtime id: ${item.id}`));
});

test('02 七个章节边界只作为内部结构标记', () => {
  chapterMarkers.forEach(id => check(node(id).type === 'internal-chapter-marker', `${id} is visible chapter`));
});

test('03 当前三类结局入口与终点结构准确', () => {
  check(node('END-T-0001').type === 'status' && node('END-T-0006').type === 'end', 'true ending topology mismatch');
  check(node('END-N-0001').type === 'status' && node('END-N-0007').type === 'end', 'normal ending topology mismatch');
  check(node('END-B-0001').type === 'internal-ending-marker' && node('END-B-0028').type === 'end', 'bad ending topology mismatch');
  check(!storyNodes.some(item => item.type === 'ending-title'), 'obsolete ending-title node remains in runtime');
});

test('04 开头与五秒最终问题形成同一句闭环', () => {
  check(node('PRO-0011').content === '真的有人收到了？', 'first received message changed');
  check(node('FIN-0039').content === '我发给你的第一句话是什么？', 'final question changed');
  const finalChoice = node('FIN-0040');
  check(finalChoice.choiceTimeoutMs === 5000, 'final question is not five seconds');
  check(finalChoice.choices?.[0]?.text === '【真的有人收到了？】', 'correct final answer changed');
  check(finalChoice.choices?.[0]?.firstMessageCorrect === true, 'correct final answer lacks result flag');
});

test('05 Observer 残响语义和路由准确', () => {
  const echo = node('CH02-0242');
  check(echo.speaker === 'observer' && echo.type === 'observer-echo', 'observer echo identity mismatch');
  check(echo.content === '还给对方一颗', 'observer echo copy mismatch');
  check(echo.nextId === 'CH03-0001', 'observer echo route mismatch');
});

test('06 Observer 残响不会进入聊天或稳定检查点', () => {
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  const start = app.indexOf("if (node.type === 'observer-echo')");
  const end = app.indexOf("if (node.type === 'title-state')", start);
  check(start >= 0 && end > start, 'observer echo runtime branch is missing');
  const branch = app.slice(start, end);
  check(branch.includes('setObserverEcho(node.content)'), 'observer echo overlay is not activated');
  check(!branch.includes('addMessage('), 'observer echo was written into chat history');
  check(!branch.includes('captureStableCheckpoint('), 'observer echo was captured as fallback data');
  check(!branch.includes('markCycleNodeCompleted('), 'observer echo was recorded as completed text');
});

test('07 Observer 残响播放状态可迁移且默认关闭', () => {
  check(!createCurrentCycleState(7).observerCandyEchoPlayed, 'new cycle starts with echo played');
  check(normalizeCurrentCycleState({ currentRebootNumber: 8 }).observerCandyEchoPlayed === false, 'legacy default mismatch');
  check(normalizeCurrentCycleState({ currentRebootNumber: 8, observerCandyEchoPlayed: true }).observerCandyEchoPlayed, 'echo receipt was not restored');
});

test('08 已读跳过穿过内部边界但停在残响、选择和互动', () => {
  check(!shouldStopReadSkip(node('CH01-0001'), []), 'internal chapter marker stopped read skip');
  check(!shouldStopReadSkip(node('END-B-0001'), []), 'internal ending marker stopped read skip');
  check(shouldStopReadSkip(node('CH02-0242'), ['CH02-0242']), 'observer echo was skipped');
  check(shouldStopReadSkip(node('PRO-0012'), ['PRO-0012']), 'choice was skipped');
  check(shouldStopReadSkip(node('CH03-0144'), ['CH03-0144']), 'interaction was skipped');
});

test('09 草稿、旧下划线 ID 与旧密码互动已删除', () => {
  check(!storyNodes.some(item => item.type === 'draft'), 'draft message type remains');
  check(!storyNodes.some(item => item.id.includes('_')), 'legacy underscore node id remains');
  check(!storyNodes.some(item => item.interactionKind === 'critical-log-password' as never), 'old password interaction remains');
  check(!fs.existsSync(path.join(root, 'src/game/interactions/PasswordInteraction.tsx')), 'old password component remains');
});

test('10 章末路由与日常图片不进入异常草稿链', () => {
  check(node('PRO-0174').nextId === 'PRO-0175' && node('PRO-0175').nextId === 'CH01-0001', 'prologue boundary mismatch');
  check(node('CH01-0210').nextId === 'CH02-0001', 'chapter one boundary mismatch');
  check(node('CH02-0156').nextId === 'CH02-0157', 'candy image enters a removed draft chain');
  check(node('CH02-0241').nextId === 'CH02-0242', 'chapter two does not reach observer echo');
  check(node('CH03-0251').nextId === 'CH04-0001', 'chapter three boundary mismatch');
  check(node('CH04-0223').nextId === 'CH05A-0001', 'chapter four boundary mismatch');
  check(node('CH05B-0107').nextId === 'FIN-0001', 'climax does not reach finale');
});

test('11 生活区 0.76g 吐槽自然接在牛排照片后', () => {
  check(node('CH03-0088').nextId === 'CH03-GRAV-0001', 'steak branch does not enter gravity beat');
  check(node('CH03-GRAV-0001').content === '今天生活区重力掉到0.76g了', '0.76g line changed');
  check(node('CH03-GRAV-0002').content === '盘子端起来是轻了点', 'plate line changed');
  check(node('CH03-GRAV-0003').content === '这块东西咬起来没有', 'steak punchline changed');
  check(node('CH03-GRAV-0003').nextId === 'CH03-0089', 'gravity beat did not return to source dialogue');
});

test('12 高潮重力降级是供能危机的可见后果', () => {
  check(node('CH05B-0005').nextId === 'CH05B-GRAV-0001', 'climax does not enter gravity degradation');
  const status = node('CH05B-GRAV-0001');
  check(status.content.includes('生活区：0.78g → 0.46g'), 'habitat degradation missing');
  check(status.content.includes('维护层：0.18g'), 'maintenance gravity missing');
  check(status.content.includes('非必要舱段：已关闭'), 'nonessential shutdown missing');
  check(status.content.includes('舱压 / 空气循环：独立回路保持'), 'independent pressure loop missing');
  check(status.archiveUnlock === 'anomaly_gravity_array', 'gravity archive is not unlocked');
  check(node('CH05B-GRAV-0004').content.includes('扶手和磁吸鞋慢慢挪'), 'low-gravity movement is not reflected in Nova action');
  check(node('CH05B-GRAV-0004').nextId === 'CH05B-0006', 'gravity beat did not return to source climax');
});

test('13 第八次空链路、一次性回读与永久断联完整', () => {
  check(node('END-B-0009').type === 'title-state' && node('END-B-0009').nextId === 'END-B-0010', 'Reboot 08 title transition mismatch');
  check(node('END-B-0010').type === 'menu' && node('END-B-0010').nextId === 'END-B-0011', 'continue-communications menu mismatch');
  check(node('END-B-0015').type === 'route', 'fallback availability route missing');
  check(node('END-B-0020').content === 'REBOOT 07-DAMAGED', 'damaged-seven transition missing');
  check(node('END-B-0021').stateWrites?.reboot08FallbackUsed === true, 'one-use fallback write missing');
  check(node('END-B-0022').dynamicNextKey === 'lastStableCheckpoint', 'stable checkpoint jump missing');
  check(node('END-B-0026').nextId === 'END-B-0027' && node('END-B-0027').nextId === 'END-B-0028', 'permanent empty path mismatch');
});

test('14 第七与第八次接入编号均由状态解析', () => {
  const prologue = node('PRO-0001');
  check(getStoryNodeForReboot(prologue, 7).content.includes('07'), 'Reboot 07 number did not resolve');
  check(getStoryNodeForReboot(prologue, 8).content.includes('08'), 'Reboot 08 number did not resolve');
});

test('15 档案采用当前唯一 Observer 与静态 NOVA-06 设定', () => {
  const byId = new Map(ARCHIVE_ENTRIES.map(entry => [entry.id, entry]));
  check(byId.get('profile_truth')?.description?.includes('外部呼叫 01—06：无回应'), 'Observer archive retains prior-cycle identity');
  check(byId.get('anomaly_nova06_warning')?.description?.includes('实时响应能力：无'), 'NOVA-06 archive implies live awareness');
  check(byId.get('ending_bad')?.description?.includes('只能回读一次'), 'bad-ending archive implies infinite stable reboots');
  check(!byId.has('anomaly_unsent_n7_draft') && !byId.has('anomaly_encrypted_observatory_draft'), 'removed draft archive remains');
});

test('16 工程档案完整记录分区重力能力边界', () => {
  const gravity = ARCHIVE_ENTRIES.find(entry => entry.id === 'anomaly_gravity_array');
  check(gravity, 'gravity engineering archive missing');
  for (const fact of ['0.78g', '0.75—0.80g', '0.15—0.40g', '按区域优先级逐级降载', '舱压 / 空气循环 / 生命维持', '稳定低强度甲板方向']) {
    check(gravity.description?.includes(fact), `gravity archive missing: ${fact}`);
  }
});

test('17 @6 三轮遮蔽稳定、两份全黑且覆盖全部语义', () => {
  let state = createLegacyMessageState('immersive-story-fixed-seed');
  const snapshots = [];
  for (const runId of ['cycle-07-a', 'cycle-07-b', 'cycle-07-c']) {
    const result = getOrCreateLegacyMessageSnapshot(state, runId);
    state = result.state;
    snapshots.push(result.snapshot);
    check(result.snapshot.masks.filter(mask => mask.fullyHidden).length === 2, `${runId} does not hide exactly two files`);
    const repeat = getOrCreateLegacyMessageSnapshot(state, runId);
    check(repeat.created === false && JSON.stringify(repeat.snapshot) === JSON.stringify(result.snapshot), `${runId} rerolled on revisit`);
  }
  for (const id of Object.keys(LEGACY_MESSAGES) as Array<keyof typeof LEGACY_MESSAGES>) {
    for (const line of [0, 1] as const) {
      check(snapshots.some(snapshot => snapshot.masks.find(mask => mask.id === id)?.semanticReadable[line]), `${id}.${line} never became readable`);
    }
  }
  check(snapshots[2].masks.some(mask => mask.lines.some(line => line.includes('█'))), 'third encounter became fully decrypted');
});

test('18 页面只连接稳定检查点回读，不连接旧整轮同步', () => {
  const app = fs.readFileSync(path.join(root, 'src/game/GameApp.tsx'), 'utf8');
  check(app.includes('createStableCheckpointSnapshot'), 'stable checkpoint capture is not connected');
  check(app.includes('restoreDamagedSeventhCheckpoint'), 'damaged fallback restore is not connected');
  check(!app.includes('replayFailedCycle') && !app.includes('CycleSyncOverlay'), 'legacy full-cycle replay remains');
});

test('19 英文拓扑覆盖 8 月 4 日新增节点且无中文兜底', () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en-US/story.json'), 'utf8')) as {
    nodes: Record<string, { content?: string; choices?: Record<string, string> }>;
  };
  for (const id of ['CH03-GRAV-0001', 'CH05B-GRAV-0001', 'CH05B-0102', 'END-B-0022']) {
    check(en.nodes[id], `English story missing ${id}`);
  }
  for (const [id, entry] of Object.entries(en.nodes)) {
    check(!/\p{Script=Han}/u.test(entry.content ?? ''), `English content contains Han text: ${id}`);
    Object.values(entry.choices ?? {}).forEach(value => {
      check(!/\p{Script=Han}/u.test(value), `English choice contains Han text: ${id}`);
    });
  }
});

test('20 玩家可见剧情与档案不含已废弃世界观', () => {
  const visibleText = [
    ...storyNodes.map(item => item.content),
    ...storyNodes.flatMap(item => item.choices?.map(choice => choice.text) ?? []),
    ...ARCHIVE_ENTRIES.flatMap(entry => [entry.title, entry.subtitle ?? '', entry.description ?? '']),
  ].join('\n');
  for (const banned of [
    '前六次连接成功',
    '六个Observer',
    '过去六次的玩家',
    '第六循环授权请求：已确认',
    '真正被困住的不是 Nova',
    '重启便永无尽头',
    'NOVA-06接管',
    'NOVA-06 接管',
    '残留意识',
  ]) {
    check(!visibleText.includes(banned), `deprecated worldbuilding remains: ${banned}`);
  }
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
