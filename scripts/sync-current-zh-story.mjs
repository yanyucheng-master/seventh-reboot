import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodes } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const localePath = path.join(root, 'src/i18n/locales/zh-CN/story.json');
const previous = JSON.parse(fs.readFileSync(localePath, 'utf8'));
const nodes = {};

for (const node of storyNodes) {
  const localized = {};
  if (node.content.length > 0) localized.content = node.content;
  if (node.choices?.length) {
    localized.choices = Object.fromEntries(
      node.choices.map((choice, index) => [choice.id ?? `${node.id}__${index}`, choice.text]),
    );
  }
  if (Object.keys(localized).length > 0) nodes[node.id] = localized;
}

const output = { ...previous, version: 'V1.0', nodes };
fs.writeFileSync(localePath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Chinese topology synchronized: ${Object.keys(nodes).length} localized nodes.`);
