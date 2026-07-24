/**
 * Extract zh-CN/story.json from current story.ts (Chinese base).
 * Also patches en-US with any missing node IDs (falls back to ZH content temporarily).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function extractNodesFromStoryTs() {
  const raw = fs.readFileSync(path.join(root, 'src/game/story.ts'), 'utf8');
  const marker = 'JSON.parse("';
  const start = raw.indexOf(marker) + marker.length;
  let enc = '';
  let i = start;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '\\') {
      enc += ch + raw[i + 1];
      i += 2;
      continue;
    }
    if (ch === '"') break;
    enc += ch;
    i += 1;
  }
  return JSON.parse(JSON.parse(`"${enc}"`));
}

function toLocale(nodes) {
  const locale = { version: 'V1.0', nodes: {} };
  for (const node of nodes) {
    const entry = {};
    if (node.content) entry.content = node.content;
    if (node.choices?.length) {
      entry.choices = {};
      node.choices.forEach((choice, index) => {
        entry.choices[`${node.id}__${index}`] = choice.text ?? '';
      });
    }
    if (entry.content || entry.choices) locale.nodes[node.id] = entry;
  }
  return locale;
}

const nodes = extractNodesFromStoryTs();
const zhLocale = toLocale(nodes);
const zhPath = path.join(root, 'src/i18n/locales/zh-CN/story.json');
fs.writeFileSync(zhPath, `${JSON.stringify(zhLocale, null, 2)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(zhLocale.nodes).length} → zh-CN/story.json`);

const enPath = path.join(root, 'src/i18n/locales/en-US/story.json');
const enLocale = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const previousEnglishNodes = enLocale.nodes ?? {};
const nextEnglishNodes = {};
let added = 0;
for (const [id, entry] of Object.entries(zhLocale.nodes)) {
  if (!previousEnglishNodes[id]) {
    nextEnglishNodes[id] = entry;
    added += 1;
  } else {
    nextEnglishNodes[id] = previousEnglishNodes[id];
  }
}
const removed = Object.keys(previousEnglishNodes).filter(id => !zhLocale.nodes[id]).length;
fs.writeFileSync(enPath, `${JSON.stringify({ version: 'V1.0', nodes: nextEnglishNodes }, null, 2)}\n`, 'utf8');
console.log(`Synced en-US topology: ${added} ZH fallbacks added, ${removed} stale nodes removed`);
