/**
 * Rebuild locale story JSON directly from ZH/EN export scripts (text only),
 * without rewriting story.ts structure. Then verify against sources.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const zhScript = path.join(root, '..', '第七次重启_V1.0_主流程_8月4日人工重力整合版.txt');
const enScript = process.env.SEVENTH_REBOOT_EN_SOURCE;

if (!enScript || !fs.existsSync(enScript)) {
  throw new Error('Set SEVENTH_REBOOT_EN_SOURCE to an existing English story export.');
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: true });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
  return result.stdout;
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
        entry.choices[`${node.id}__${index}`] = choice.text ?? '';
      });
    }
    if (entry.content || entry.choices) locale.nodes[node.id] = entry;
  }
  return { nodes, locale };
}

function writeLocale(code, locale) {
  const dir = path.join(root, 'src/i18n/locales', code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'story.json'), `${JSON.stringify(locale, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${Object.keys(locale.nodes).length} → ${code}/story.json`);
}

// Backup current story.ts
const storyPath = path.join(root, 'src/game/story.ts');
const backup = fs.readFileSync(storyPath);

// 1) Import EN → extract en locale
console.log('Import EN source...');
run('npx', ['tsx', 'scripts/import-exported-story.mjs', enScript]);
const en = extractLocaleFromStoryTs();
writeLocale('en-US', en.locale);

// 2) Import ZH → extract zh locale + keep as default base
console.log('Import ZH source as default base...');
run('npx', ['tsx', 'scripts/import-exported-story.mjs', zhScript]);
const zh = extractLocaleFromStoryTs();
writeLocale('zh-CN', zh.locale);

// Ensure base is Chinese (already is after step 2)
console.log('Base story.ts restored to Chinese.');
console.log(`EN nodes ${Object.keys(en.locale.nodes).length}, ZH nodes ${Object.keys(zh.locale.nodes).length}`);

// Spot-check key lines
console.log('ZH PRO-0011:', zh.locale.nodes['PRO-0011']?.content);
console.log('EN PRO-0011:', en.locale.nodes['PRO-0011']?.content);
console.log('ZH CH1:', zh.locale.nodes['CH01-0001']?.content);
console.log('EN CH1:', en.locale.nodes['CH01-0001']?.content);
