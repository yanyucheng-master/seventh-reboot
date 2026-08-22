import { storyNodes } from '../src/game/story.ts';

const LAUGH_MARKERS = /哈哈|你居然笑|小船沉了/;
const CARE_MARKERS = /怎么还开心|为什么|关心|没事吧|辛苦了|早点休息/;

const issues = [];
const nodeIds = new Set();
const choiceIds = new Set();
const nodeMap = new Map();

for (const node of storyNodes) {
  if (nodeIds.has(node.id)) issues.push({ id: node.id, kind: 'duplicate-node-id' });
  nodeIds.add(node.id);
  nodeMap.set(node.id, node);

  for (const [index, choice] of (node.choices ?? []).entries()) {
    const choiceId = choice.id ?? `${node.id}__${index}`;
    if (choiceIds.has(choiceId)) issues.push({ id: node.id, kind: 'duplicate-choice-id', choiceId });
    choiceIds.add(choiceId);
  }
}

function getTargets(node) {
  return [
    node.nextId,
    node.timeoutNextId,
    node.conditionElseNextId,
    node.directConditionNextId,
    ...Object.values(node.interactionNextIds ?? {}),
    ...Object.values(node.specialInputNextIds ?? {}),
    ...(node.choices ?? []).map(choice => choice.nextId),
  ].filter(Boolean);
}

function checkTarget(sourceId, relation, targetId) {
  if (!targetId || targetId === 'MENU' || /^\{.+\}$/.test(targetId)) return;
  if (!nodeIds.has(targetId)) issues.push({ id: sourceId, kind: 'missing-target', relation, targetId });
}

for (const node of storyNodes) {
  checkTarget(node.id, 'nextId', node.nextId);
  checkTarget(node.id, 'timeoutNextId', node.timeoutNextId);
  checkTarget(node.id, 'conditionElseNextId', node.conditionElseNextId);
  checkTarget(node.id, 'directConditionNextId', node.directConditionNextId);
  for (const choice of node.choices ?? []) checkTarget(node.id, `choice:${choice.id}`, choice.nextId);
  for (const [key, target] of Object.entries(node.interactionNextIds ?? {})) {
    checkTarget(node.id, `interaction:${key}`, target);
  }
  for (const [key, target] of Object.entries(node.specialInputNextIds ?? {})) {
    checkTarget(node.id, `input:${key}`, target);
  }
  if (!['end', 'menu'].includes(node.type) && getTargets(node).length === 0) {
    issues.push({ id: node.id, kind: 'dead-end-without-transition', type: node.type });
  }
}

const runtimeRouteAlternatives = new Map([
  ['FIN-0044', ['END-T-0001']],
  ['END-B-0015', ['END-B-0026']],
]);
const reachable = new Set();
const queue = ['PRO-0001'];
while (queue.length) {
  const id = queue.shift();
  if (id === 'MENU' || reachable.has(id)) continue;
  reachable.add(id);
  const node = nodeMap.get(id);
  if (!node) continue;
  const targets = [
    ...getTargets(node),
    ...(runtimeRouteAlternatives.get(id) ?? []),
  ];
  for (const target of targets) {
    if (!/^\{.+\}$/.test(target)) queue.push(target);
  }
}
for (const node of storyNodes) {
  if (!reachable.has(node.id)) issues.push({ id: node.id, kind: 'unreachable-node' });
}

for (const node of storyNodes) {
  if (!node.choices || node.choices.length < 2) continue;

  const groups = new Map();
  for (const choice of node.choices) {
    const key = choice.nextId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(choice.text);
  }

  if (groups.size === 1) {
    const texts = node.choices.map(c => c.text);
    const hasLaugh = texts.some(t => /哈哈|活该/.test(t));
    const hasCare = texts.some(t => CARE_MARKERS.test(t));
    if (hasLaugh && hasCare) {
      issues.push({
        id: node.id,
        kind: 'merged-laugh-care',
        choices: node.choices,
        target: node.choices[0].nextId,
      });
    }
  }

  for (const choice of node.choices) {
    const target = storyNodes.find(n => n.id === choice.nextId);
    if (!target) continue;
    if (LAUGH_MARKERS.test(choice.text) && target.content && !/笑|小船/.test(target.content) && target.type === 'text') {
      // soft check only
    }
    if (CARE_MARKERS.test(choice.text) && target.content && /你居然笑|小船沉了/.test(target.content)) {
      issues.push({
        id: node.id,
        kind: 'care-to-laugh-reply',
        choice: choice.text,
        target: choice.nextId,
        reply: target.content,
      });
    }
  }
}

console.log(`Checked ${storyNodes.length} nodes`);
if (!issues.length) {
  console.log('No high-risk branch issues detected.');
} else {
  console.log(`Found ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.log(JSON.stringify(issue, null, 2));
  }
  process.exitCode = 1;
}
