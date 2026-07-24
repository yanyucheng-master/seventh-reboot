import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/i18n/locales/en-US/interactions.json');
const zhPath = path.join(root, 'src/i18n/locales/zh-CN/interactions.json');
const enStory = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en-US/story.json'), 'utf8'));
const zhNodes = {};
const enNodes = {};

for (const node of storyNodeMap.values()) {
  if (!node.interactionKind) continue;
  const id = node.id;
  const localized = {};
  if (node.content) localized.content = node.content;
  if (node.choices?.length) {
    localized.choices = Object.fromEntries(
      node.choices.map((choice, index) => [`${node.id}__${index}`, choice.text]),
    );
  }
  zhNodes[id] = localized;
  enNodes[id] = enStory.nodes[id] ?? localized;
}

const zh = {
  version: 'V1.0-special-interactions',
  nodes: zhNodes,
};

fs.writeFileSync(zhPath, `${JSON.stringify(zh, null, 2)}\n`, 'utf8');
fs.writeFileSync(enPath, `${JSON.stringify({ version: 'V1.0-special-interactions', nodes: enNodes }, null, 2)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(zhNodes).length} Chinese interaction locale nodes to ${zhPath}`);
