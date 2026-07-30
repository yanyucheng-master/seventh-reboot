/**
 * Build bilingual story locale overlays from Chinese + English export scripts,
 * then re-import Chinese as the default story.ts base.
 *
 * Usage:
 *   npx tsx scripts/build-bilingual-stories.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const zhScript = path.join(root, '..', '第七次重启_V1.0_无后记主流程_规范化ID版.txt');
const enScript = process.env.SEVENTH_REBOOT_EN_SOURCE;
const localeDir = path.join(root, 'src', 'i18n', 'locales');

function runImport(scriptPath) {
  const result = spawnSync(
    'npx',
    ['tsx', 'scripts/import-exported-story.mjs', scriptPath],
    { cwd: root, encoding: 'utf8', shell: true },
  );
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`Import failed for ${scriptPath}`);
  }
  console.log(result.stdout.trim());
}

function extractLocaleFromStoryTs() {
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
  const nodes = JSON.parse(JSON.parse(`"${enc}"`));
  const locale = { version: 'V1.0', nodes: {} };
  for (const node of nodes) {
    const entry = {};
    if (node.content) entry.content = node.content;
    if (node.choices?.length) {
      entry.choices = {};
      node.choices.forEach((choice, index) => {
        const id = choice.id ?? `${node.id}__${index}`;
        entry.choices[id] = choice.text ?? '';
      });
    }
    if (entry.content || entry.choices) locale.nodes[node.id] = entry;
  }
  return { nodes, locale };
}

function writeLocale(localeCode, locale) {
  const dir = path.join(localeDir, localeCode);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'story.json');
  fs.writeFileSync(out, `${JSON.stringify(locale, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${Object.keys(locale.nodes).length} nodes → ${out}`);
}

if (!enScript || !fs.existsSync(enScript)) {
  throw new Error('Set SEVENTH_REBOOT_EN_SOURCE to an existing English story export.');
}

// 1) Import the optional English localization source and extract its overlay.
console.log('Importing English localization source...');
runImport(enScript);
const en = extractLocaleFromStoryTs();
writeLocale('en-US', en.locale);

// 2) Import Chinese as default base story
console.log('Importing Chinese story as default base...');
if (!fs.existsSync(zhScript)) {
  throw new Error(`Chinese script not found: ${zhScript}`);
}
runImport(zhScript);

// 3) Extract ZH locale from newly imported story
console.log('Extracting ZH locale...');
const zh = extractLocaleFromStoryTs();
writeLocale('zh-CN', zh.locale);

// 4) Sanity: node id overlap
const enIds = new Set(Object.keys(en.locale.nodes));
const zhIds = new Set(Object.keys(zh.locale.nodes));
const onlyEn = [...enIds].filter(id => !zhIds.has(id));
const onlyZh = [...zhIds].filter(id => !enIds.has(id));
console.log(`Overlap check: onlyEn=${onlyEn.length}, onlyZh=${onlyZh.length}`);
if (onlyEn.length) console.log('onlyEn sample', onlyEn.slice(0, 10));
if (onlyZh.length) console.log('onlyZh sample', onlyZh.slice(0, 10));

console.log('Done. Chinese is now the story.ts default base.');
