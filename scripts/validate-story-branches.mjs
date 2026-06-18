import { storyNodes } from '../src/game/story.ts';

const LAUGH_MARKERS = /哈哈|你居然笑|小船沉了/;
const CARE_MARKERS = /怎么还开心|为什么|关心|没事吧|辛苦了|早点休息/;

const issues = [];

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
