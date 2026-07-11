import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/i18n/locales/en-US/interactions.json');
const zhPath = path.join(root, 'src/i18n/locales/zh-CN/interactions.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zhNodes = {};

for (const id of Object.keys(en.nodes)) {
  const node = storyNodeMap.get(id);
  if (!node) throw new Error(`English interaction overlay references missing node: ${id}`);
  const localized = {};
  if (node.content) localized.content = node.content;
  if (node.choices?.length) {
    localized.choices = Object.fromEntries(
      node.choices.map((choice, index) => [`${node.id}__${index}`, choice.text]),
    );
  }
  zhNodes[id] = localized;
}

const zh = {
  version: 'V1.0-special-interactions',
  nodes: zhNodes,
};

fs.writeFileSync(zhPath, `${JSON.stringify(zh, null, 2)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(zhNodes).length} Chinese interaction locale nodes to ${zhPath}`);
