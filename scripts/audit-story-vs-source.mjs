/**
 * Sentence-level audit: compare export scripts vs locale story JSON / story.ts base.
 *
 * Usage:
 *   npx tsx scripts/audit-story-vs-source.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { normalizeStorySourceText } from './story-source-format.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Reuse parser by dynamically importing the import script's parse via eval of shared logic.
// Instead: duplicate a minimal content extractor matching import-exported-story.mjs.

const EMOTION = new Map([
  ['平常', 'normal'], ['微笑', 'smile'], ['悲伤', 'sad'], ['故障', 'glitch'], ['惊讶', 'normal'],
  ['neutral', 'normal'], ['smiling', 'smile'], ['smile', 'smile'], ['sad', 'sad'],
  ['glitch', 'glitch'], ['surprised', 'normal'], ['normal', 'normal'],
]);
const SPEAKER = new Map([
  ['Nova', 'nova'], ['系统', 'system'], ['玩家', 'player'], ['System', 'system'], ['Player', 'player'],
]);
const TYPE = new Map([
  ['文本', 'text'], ['选项', 'choice'], ['限时选项', 'choice'], ['图片', 'image'], ['输入中', 'typing'],
  ['延迟', 'delay'], ['状态', 'status'], ['时间戳', 'timestamp'], ['章节', 'chapter'], ['草稿', 'draft'],
  ['故障', 'glitch'], ['文件', 'file'], ['结局', 'end'], ['输入', 'input'], ['限时输入', 'input'],
  ['交互', 'interaction'], ['通讯日志', 'comm-log'], ['记忆锚点', 'memory-anchor'], ['后记', 'epilogue'],
  ['结局操作', 'ending-action'], ['内部章节标记', 'internal-chapter-marker'],
  ['内部结局标记', 'internal-ending-marker'], ['结局标题', 'ending-title'],
  ['断连', 'disconnect'], ['重连失败', 'reconnectFailed'], ['信号错误', 'signalError'],
  ['Text', 'text'], ['Choice', 'choice'], ['Timed Choice', 'choice'], ['Image', 'image'], ['Typing', 'typing'],
  ['Delay', 'delay'], ['Status', 'status'], ['Timestamp', 'timestamp'], ['Chapter', 'chapter'], ['Draft', 'draft'],
  ['Fault', 'glitch'], ['File', 'file'], ['Ending', 'end'], ['Input', 'input'], ['Timed Input', 'input'],
  ['Interaction', 'interaction'], ['Comm Log', 'comm-log'], ['Memory Anchor', 'memory-anchor'],
  ['Epilogue', 'epilogue'], ['Ending Action', 'ending-action'],
  ['Internal Chapter Marker', 'internal-chapter-marker'],
  ['Internal Ending Marker', 'internal-ending-marker'], ['Ending Title', 'ending-title'],
  ['Disconnect', 'disconnect'],
  ['Reconnect Failed', 'reconnectFailed'], ['Signal Error', 'signalError'], ['Menu', 'menu'],
]);

const PROMOTED_DISPLAY_TYPES = new Set([
  'chapter',
  'internal-chapter-marker',
  'internal-ending-marker',
  'ending-title',
]);

function cleanNextId(value) {
  return value.split('//')[0].trim();
}

function parseExport(text) {
  const lines = normalizeStorySourceText(text).text.split('\n');
  const nodes = [];
  let current = null;
  let fileTitle = '';
  let draftTitle = '';
  let body = [];

  function finish() {
    if (!current) return;
    if (current.type === 'file') {
      current.content = fileTitle ? `${fileTitle}||${body.join('\n').trim()}` : body.join('\n').trim();
    } else if (current.type === 'draft') {
      current.content = draftTitle ? `${draftTitle}||${body.join('\n').trim()}` : body.join('\n').trim();
    } else if (current.type === 'image') {
      current.content = body.join('\n').trim();
    } else if (current.type !== 'choice' && current.type !== 'typing' && current.type !== 'delay' && current.type !== 'end') {
      const content = body.join('\n').trim();
      if (content || !current.content) current.content = content;
    }
    if (!current.content) current.content = '';
    nodes.push(current);
    current = null;
    fileTitle = '';
    draftTitle = '';
    body = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const nodeMatch = line.match(/^\[([^\]]+)\]\s+\(([^/]+)\/([^)]+)\)$/)
      ?? line.match(/^\[([^\]]+)\]\s+([^/\n\[]+?)\s*\/\s*(.+)$/);
    if (nodeMatch) {
      finish();
      const [, id, speakerLabel, typeLabel] = nodeMatch;
      const speaker = SPEAKER.get(speakerLabel.trim()) ?? speakerLabel.trim().toLowerCase();
      const type = TYPE.get(typeLabel.trim()) ?? typeLabel.trim();
      if (type === 'menu' || id === 'MENU') {
        current = null;
        continue;
      }
      current = { id, speaker, type, content: '', choices: [] };
      continue;
    }
    if (!current) continue;
    const trimmed = line.trim();
    if (!trimmed) {
      if ((current.type === 'file' || current.type === 'draft') && body.length > 0) body.push('');
      continue;
    }
    if (trimmed.startsWith('meta:') || trimmed.startsWith('### ') || trimmed.startsWith('##')) continue;
    if (trimmed.startsWith('next:')) {
      current.nextId = cleanNextId(trimmed.replace(/^next:\s*/, ''));
      continue;
    }
    const choiceMatch = trimmed.match(/^\[([^\]]+)\]\s*→\s*(.+?)\s*→\s*(\S+)(?:\s+meta:\s*(.+))?$/);
    if (choiceMatch && /^[A-Z]$/.test(choiceMatch[1])) {
      current.choices.push({ text: choiceMatch[2].trim(), nextId: cleanNextId(choiceMatch[3]) });
      continue;
    }
    if (current.type === 'image' && (trimmed.startsWith('图片说明:') || trimmed.startsWith('Image Caption:'))) {
      body.push(trimmed.replace(/^(图片说明|Image Caption):\s*/, ''));
      continue;
    }
    if (current.type === 'file' && (trimmed.startsWith('文件标题:') || trimmed.startsWith('File Title:'))) {
      fileTitle = trimmed.replace(/^(文件标题|File Title):\s*/, '');
      continue;
    }
    if (current.type === 'draft' && (trimmed.startsWith('草稿标题:') || trimmed.startsWith('Draft Title:'))) {
      draftTitle = trimmed.replace(/^(草稿标题|Draft Title):\s*/, '');
      continue;
    }
    body.push(trimmed);
  }
  finish();
  return nodes;
}

function norm(s) {
  return (s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function loadLocale(code) {
  return JSON.parse(fs.readFileSync(path.join(root, `src/i18n/locales/${code}/story.json`), 'utf8'));
}

function extractStoryTsNodes() {
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

function compareLocale(label, sourceNodes, localeNodes, { compareChoices = true } = {}) {
  const mismatches = [];
  const missingInLocale = [];
  const extraInLocale = [];
  const sourceIds = new Set(sourceNodes.map(n => n.id));
  const localeIds = new Set(Object.keys(localeNodes));

  for (const id of sourceIds) {
    if (!localeIds.has(id)) {
      // nodes with no content/choices may be omitted from locale
      const src = sourceNodes.find(n => n.id === id);
      if ((src.content && src.content.trim()) || src.choices?.length) missingInLocale.push(id);
      continue;
    }
    const src = sourceNodes.find(n => n.id === id);
    const loc = localeNodes[id];
    const srcContent = norm(src.content);
    const locContent = norm(loc.content);
    // Skip empty structural nodes
    if (!srcContent && !locContent && !(src.choices?.length)) continue;

    const isExpectedDisplayPromotion =
      !srcContent &&
      Boolean(locContent) &&
      PROMOTED_DISPLAY_TYPES.has(src.type);

    if (srcContent !== locContent && !isExpectedDisplayPromotion) {
      mismatches.push({
        id,
        kind: 'content',
        source: srcContent.slice(0, 120),
        locale: (locContent || '').slice(0, 120),
      });
    }

    if (compareChoices && src.choices?.length) {
      src.choices.forEach((choice, index) => {
        const choiceId = `${id}__${index}`;
        const locText = loc.choices?.[choiceId] ?? loc.choices?.[choice.id];
        if (norm(choice.text) !== norm(locText)) {
          mismatches.push({
            id: choiceId,
            kind: 'choice',
            source: choice.text,
            locale: locText ?? '(missing)',
          });
        }
      });
    }
  }

  for (const id of localeIds) {
    if (!sourceIds.has(id)) extraInLocale.push(id);
  }

  return { label, mismatches, missingInLocale, extraInLocale, sourceCount: sourceNodes.length, localeCount: localeIds.size };
}

function checkLocaleCoverage(label, sourceNodes, localeNodes) {
  const missingContent = [];
  const missingChoices = [];
  const cjkLeaks = [];

  for (const src of sourceNodes) {
    const loc = localeNodes[src.id];
    if (src.content?.trim() && !loc?.content?.trim()) missingContent.push(src.id);
    (src.choices ?? []).forEach((_, index) => {
      const key = `${src.id}__${index}`;
      if (!loc?.choices?.[key]?.trim()) missingChoices.push(key);
    });
  }

  for (const [id, entry] of Object.entries(localeNodes)) {
    if (/[\u3400-\u9fff]/.test(entry.content ?? '')) cjkLeaks.push(`${id}.content`);
    for (const [key, value] of Object.entries(entry.choices ?? {})) {
      if (/[\u3400-\u9fff]/.test(value)) cjkLeaks.push(`${id}.choices.${key}`);
    }
  }
  return { label, missingContent, missingChoices, cjkLeaks };
}

const zhScript = path.join(root, '..', '第七次重启_V1.0_无后记主流程_规范化ID版.txt');
const enScript = process.env.SEVENTH_REBOOT_EN_SOURCE;

if (!fs.existsSync(zhScript)) throw new Error(`Missing ZH script: ${zhScript}`);
if (enScript && !fs.existsSync(enScript)) throw new Error(`Missing EN script: ${enScript}`);

const zhSource = parseExport(fs.readFileSync(zhScript, 'utf8'));
const enSource = enScript ? parseExport(fs.readFileSync(enScript, 'utf8')) : null;
const zhLocale = loadLocale('zh-CN');
const enLocale = loadLocale('en-US');
const zhInteractions = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/zh-CN/interactions.json'), 'utf8'));
const enInteractions = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en-US/interactions.json'), 'utf8'));
zhLocale.nodes = { ...zhLocale.nodes, ...zhInteractions.nodes };
enLocale.nodes = { ...enLocale.nodes, ...enInteractions.nodes };
const baseNodes = extractStoryTsNodes();

const zhReport = compareLocale('zh-CN locale vs ZH script', zhSource, zhLocale.nodes);
const enReport = enSource
  ? compareLocale('en-US locale vs external EN script', enSource, enLocale.nodes)
  : null;
const enCoverage = checkLocaleCoverage('en-US runtime coverage vs ZH topology', zhSource, enLocale.nodes);
const baseVsZh = compareLocale('story.ts base vs ZH script', zhSource, Object.fromEntries(
  baseNodes.map(n => {
    const entry = {};
    if (n.content) entry.content = n.content;
    if (n.choices?.length) {
      entry.choices = {};
      n.choices.forEach((c, i) => {
        entry.choices[`${n.id}__${i}`] = c.text ?? '';
      });
    }
    return [n.id, entry];
  }),
));

// Structure parity: same node ids between ZH and EN sources
const zhIds = new Set(zhSource.map(n => n.id));
const enIds = new Set((enSource ?? []).map(n => n.id));
const onlyZh = enSource ? [...zhIds].filter(id => !enIds.has(id)) : [];
const onlyEn = enSource ? [...enIds].filter(id => !zhIds.has(id)) : [];

function printReport(r, limit = 30) {
  console.log(`\n=== ${r.label} ===`);
  console.log(`source=${r.sourceCount} locale=${r.localeCount}`);
  console.log(`mismatches=${r.mismatches.length} missingInLocale=${r.missingInLocale.length} extraInLocale=${r.extraInLocale.length}`);
  for (const m of r.mismatches.slice(0, limit)) {
    console.log(`- [${m.kind}] ${m.id}`);
    console.log(`  SRC: ${JSON.stringify(m.source)}`);
    console.log(`  LOC: ${JSON.stringify(m.locale)}`);
  }
  if (r.mismatches.length > limit) console.log(`  ... +${r.mismatches.length - limit} more`);
  if (r.missingInLocale.length) console.log('missing sample', r.missingInLocale.slice(0, 15));
}

printReport(zhReport);
if (enReport) printReport(enReport);
printReport(baseVsZh);
console.log(`\n=== ${enCoverage.label} ===`);
console.log(`missingContent=${enCoverage.missingContent.length} missingChoices=${enCoverage.missingChoices.length} cjkLeaks=${enCoverage.cjkLeaks.length}`);
if (enSource) {
  console.log(`\n=== Structure ZH vs external EN ===`);
  console.log(`onlyZh=${onlyZh.length}`, onlyZh.slice(0, 20));
  console.log(`onlyEn=${onlyEn.length}`, onlyEn.slice(0, 20));
}

const out = {
  zhReport: { ...zhReport, mismatches: zhReport.mismatches.slice(0, 200) },
  enReport: enReport ? { ...enReport, mismatches: enReport.mismatches.slice(0, 200) } : null,
  enCoverage,
  baseVsZh: { ...baseVsZh, mismatches: baseVsZh.mismatches.slice(0, 200) },
  structure: { onlyZh, onlyEn },
};
fs.writeFileSync(path.join(root, 'scripts/data/story-audit-report.json'), JSON.stringify(out, null, 2));
console.log('\nWrote scripts/data/story-audit-report.json');

const fail =
  zhReport.mismatches.length +
  (enReport?.mismatches.length ?? 0) +
  baseVsZh.mismatches.length +
  zhReport.missingInLocale.length +
  (enReport?.missingInLocale.length ?? 0) +
  enCoverage.missingContent.length +
  enCoverage.missingChoices.length +
  enCoverage.cjkLeaks.length;
process.exit(fail > 0 ? 1 : 0);
