import { storyNodes, storyNodeMap } from '../src/game/story.ts';

const TRUE_CHOICE_IDS = [
  'ch1_worry4',
  'ch2_night10',
  'ch2_n7q6',
  'ch2_n7q10',
  'ch2_n7q13',
  'ch3_dream11',
  'ch3_log12',
  'ch4_fold13',
  'ch4_head3',
  'ch4_head14',
  'ch4_trust17',
  'ch5a_obs24',
  'ch5b_file14',
  'ch5b_why5',
];

const PSEUDO_INTERACTION_IDS = [
  'p_idk8',
  'p_mean8',
  'p_shock2',
  'p_log7',
  'ch1_merge4',
  'ch1_star6',
  'ch1_pet4',
  'ch1_pet6',
  'ch1_night11',
  'ch2_dream12',
  'ch2_forget11',
  'ch3_dream2',
  'ch3_dream5',
  'ch3_lunch4',
  'ch3_ref12',
  'ch4_fold8',
  'ch5a_10',
  'ch5a_logs4',
  'ch5a_logs7',
  'ch5a_obs11',
  'ch5b_file5',
];

const ALLOWED_EXTERNAL_NEXT = new Set(['MENU']);
const END_TYPES = new Set(['end']);

function textOf(node) {
  const choices = node.choices?.map(choice => `${choice.text} ${choice.nextId}`).join('\n') ?? '';
  return `${node.content ?? ''}\n${choices}`;
}

function assertCheck(condition, label, details = '') {
  return {
    ok: Boolean(condition),
    label,
    details,
  };
}

const ids = new Map();
for (const node of storyNodes) ids.set(node.id, (ids.get(node.id) ?? 0) + 1);
const duplicateIds = [...ids.entries()].filter(([, count]) => count > 1).map(([id]) => id);

const missingNext = [];
const missingChoiceNext = [];
const deadNodes = [];
for (const node of storyNodes) {
  if (node.nextId && !ALLOWED_EXTERNAL_NEXT.has(node.nextId) && !storyNodeMap.has(node.nextId)) {
    missingNext.push(`${node.id} -> ${node.nextId}`);
  }
  for (const choice of node.choices ?? []) {
    if (!ALLOWED_EXTERNAL_NEXT.has(choice.nextId) && !storyNodeMap.has(choice.nextId)) {
      missingChoiceNext.push(`${node.id} choice ${choice.text} -> ${choice.nextId}`);
    }
  }
  if (
    !END_TYPES.has(node.type) &&
    !node.nextId &&
    (!node.choices || node.choices.length === 0)
  ) {
    deadNodes.push(node.id);
  }
}

const allText = storyNodes.map(textOf).join('\n');
const rollbackMatches = allText.match(/回滚/g) ?? [];
const rebootMatches = allText.match(/回溯/g) ?? [];
const firstMessageMatches = allText.match(/真的有人收到了？/g) ?? [];

const unknown06Nodes = storyNodes.filter(node => /UNKNOWN-06/.test(textOf(node)));
const firstCurrentNovaIndex = storyNodes.findIndex(node => node.id === 'p13e');
const openingUnknown06Count = firstCurrentNovaIndex >= 0
  ? storyNodes.slice(0, firstCurrentNovaIndex).filter(node => /UNKNOWN-06|第七次已经开始|别让她太早知道|第一句/.test(textOf(node))).length
  : 999;

const trueChoiceFailures = TRUE_CHOICE_IDS.filter(id => (storyNodeMap.get(id)?.choices?.length ?? 0) < 2);
const pseudoStillChoices = PSEUDO_INTERACTION_IDS.filter(id => {
  const node = storyNodeMap.get(id);
  return node?.choices?.length;
});
const pseudoMissing = PSEUDO_INTERACTION_IDS.filter(id => !storyNodeMap.has(id));

const unknown06DisplayFailures = ['p11', 'p12a_u06', 'p13_u06']
  .filter(id => {
    const node = storyNodeMap.get(id);
    return node?.displayName !== 'UNKNOWN-06' || node?.avatarProfile !== 'unknown';
  });

const checks = [
  assertCheck(duplicateIds.length === 0, '重复节点 ID', `${duplicateIds.length}`),
  assertCheck(missingNext.length === 0, 'next 指向缺失', `${missingNext.length}`),
  assertCheck(missingChoiceNext.length === 0, '选项指向缺失', `${missingChoiceNext.length}`),
  assertCheck(deadNodes.length === 0, '非结局死节点', `${deadNodes.length}`),
  assertCheck(rollbackMatches.length === 0, '“回滚”残留', `${rollbackMatches.length}`),
  assertCheck(rebootMatches.length > 0, '“回溯”存在', `${rebootMatches.length}`),
  assertCheck(unknown06Nodes.length > 0 && openingUnknown06Count <= 8, 'UNKNOWN-06 短版开篇保留', `${openingUnknown06Count} opening hits`),
  assertCheck(firstMessageMatches.length >= 2, '“真的有人收到了？”开篇与终章保留', `${firstMessageMatches.length}`),
  assertCheck(allText.includes('还给他一颗'), '第二章“还给他一颗”异常信号保留'),
  assertCheck(allText.includes('第一句话很重要'), '第五章“第一句话很重要”伏笔保留'),
  assertCheck((storyNodeMap.get('fin_last6')?.choiceTimeoutMs ?? 0) === 5000 && storyNodeMap.get('fin_last6')?.timeoutNextId === 'fin_timeout1', '终章 5000ms 第一句话限时选择保留'),
  assertCheck(['fin_timeout5', 'fin_timeout6', 'fin_timeout8'].some(id => storyNodeMap.get(id)?.isGlitch), '终章超时分支带信号衰减/故障感'),
  assertCheck(allText.includes('第八次重启') && allText.includes('第八次连接成功'), '坏结局第八次循环重启代价演出保留'),
  assertCheck(trueChoiceFailures.length === 0, '14 个真选择均至少 2 个选项', trueChoiceFailures.join(', ')),
  assertCheck(pseudoStillChoices.length === 0, '指定伪交互已非选项形式', pseudoStillChoices.join(', ')),
  assertCheck(unknown06DisplayFailures.length === 0, 'UNKNOWN-06 昵称/头像覆盖', unknown06DisplayFailures.join(', ')),
  assertCheck(storyNodeMap.get('p_merge4')?.contactStage === 'named', 'Nova 报名后联系人昵称切到 Nova'),
  assertCheck(storyNodeMap.get('ch4_id_confirm')?.contactStage === 'verified', '身份确认后头像切到 Nova 正式头像'),
];

let failed = 0;
console.log(`Checked ${storyNodes.length} nodes`);
for (const check of checks) {
  const mark = check.ok ? 'PASS' : 'FAIL';
  console.log(`${mark} - ${check.label}${check.details ? `: ${check.details}` : ''}`);
  if (!check.ok) failed += 1;
}
if (pseudoMissing.length) {
  console.log(`INFO - 指定伪交互节点已被删除/合并: ${pseudoMissing.join(', ')}`);
}
if (missingNext.length) console.log(missingNext.join('\n'));
if (missingChoiceNext.length) console.log(missingChoiceNext.join('\n'));
if (deadNodes.length) console.log(`Dead nodes: ${deadNodes.join(', ')}`);

if (failed) process.exit(1);
