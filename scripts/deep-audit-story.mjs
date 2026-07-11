import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPE = new Map([
  ['文本', 'text'], ['选项', 'choice'], ['限时选项', 'choice'], ['图片', 'image'], ['输入中', 'typing'],
  ['延迟', 'delay'], ['状态', 'status'], ['时间戳', 'timestamp'], ['章节', 'chapter'], ['草稿', 'draft'],
  ['故障', 'glitch'], ['文件', 'file'], ['结局', 'end'], ['输入', 'input'], ['限时输入', 'input'],
  ['交互', 'interaction'], ['通讯日志', 'comm-log'], ['后记', 'epilogue'], ['结局操作', 'ending-action'],
  ['Text', 'text'], ['Choice', 'choice'], ['Timed Choice', 'choice'], ['Image', 'image'], ['Typing', 'typing'],
  ['Delay', 'delay'], ['Status', 'status'], ['Timestamp', 'timestamp'], ['Chapter', 'chapter'], ['Draft', 'draft'],
  ['Fault', 'glitch'], ['File', 'file'], ['Ending', 'end'], ['Input', 'input'], ['Timed Input', 'input'],
  ['Interaction', 'interaction'], ['Comm Log', 'comm-log'], ['Epilogue', 'epilogue'], ['Ending Action', 'ending-action'],
  ['Menu', 'menu'],
]);

function parseExport(text) {
  const lines = text.split(/\r?\n/);
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
    } else if (!['choice', 'typing', 'delay', 'end'].includes(current.type)) {
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
    const nodeMatch = line.match(/^\[([^\]]+)\]\s+\(([^/]+)\/([^)]+)\)$/);
    if (nodeMatch) {
      finish();
      const [, id, , typeLabel] = nodeMatch;
      const type = TYPE.get(typeLabel) ?? typeLabel;
      if (type === 'menu' || id === 'MENU') {
        current = null;
        continue;
      }
      current = { id, type, content: '', choices: [] };
      continue;
    }
    if (!current) continue;
    const trimmed = line.trim();
    if (!trimmed) {
      if ((current.type === 'file' || current.type === 'draft') && body.length > 0) body.push('');
      continue;
    }
    if (trimmed.startsWith('meta:') || trimmed.startsWith('### ')) continue;
    if (trimmed.startsWith('next:')) {
      current.nextId = trimmed.replace(/^next:\s*/, '').split('//')[0].trim();
      continue;
    }
    const choiceMatch = trimmed.match(/^\[([A-Z])\]\s*→\s*(.+?)\s*→\s*(\S+)/);
    if (choiceMatch) {
      current.choices.push({ text: choiceMatch[2].trim(), nextId: choiceMatch[3].trim() });
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
  return (s ?? '').replace(/\r\n/g, '\n').trim();
}

function compare(srcNodes, locale, label) {
  let contentDiff = 0;
  let choiceDiff = 0;
  let missing = 0;
  const samples = [];
  for (const n of srcNodes) {
    const hasText = Boolean(n.content?.trim()) || Boolean(n.choices?.length);
    if (!hasText) continue;
    const loc = locale.nodes[n.id];
    if (!loc) {
      missing += 1;
      if (samples.length < 10) samples.push({ id: n.id, kind: 'missing' });
      continue;
    }
    const srcContent = norm(n.content);
    const locContent = norm(loc.content);
    // Empty source + filled locale = chapter title promotion (expected)
    if (srcContent && srcContent !== locContent) {
      contentDiff += 1;
      if (samples.length < 15) {
        samples.push({ id: n.id, kind: 'content', src: srcContent.slice(0, 80), loc: locContent.slice(0, 80) });
      }
    }
    (n.choices || []).forEach((choice, index) => {
      const key = `${n.id}__${index}`;
      const locText = loc.choices?.[key];
      if (norm(choice.text) !== norm(locText)) {
        choiceDiff += 1;
        if (samples.length < 20) {
          samples.push({ id: key, kind: 'choice', src: choice.text, loc: locText ?? '(missing)' });
        }
      }
    });
  }
  return { label, contentDiff, choiceDiff, missing, samples };
}

const zhScript = path.join(root, '..', '第七次重启_剧情文本_V1_0_时相核心逻辑整合版.txt');
const enScript = 'C:\\Users\\YYC\\Desktop\\The_Seventh_Reboot_V1.0_Full_English_Script.txt';
const zhLoc = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/zh-CN/story.json'), 'utf8'));
const enLoc = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en-US/story.json'), 'utf8'));
const zhInteractions = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/zh-CN/interactions.json'), 'utf8'));
const enInteractions = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en-US/interactions.json'), 'utf8'));
zhLoc.nodes = { ...zhLoc.nodes, ...zhInteractions.nodes };
enLoc.nodes = { ...enLoc.nodes, ...enInteractions.nodes };
const zhSrc = parseExport(fs.readFileSync(zhScript, 'utf8'));
const enSrc = parseExport(fs.readFileSync(enScript, 'utf8'));

const zhCmp = compare(zhSrc, zhLoc, 'zh');
const enCmp = compare(enSrc, enLoc, 'en');

let nextDiff = 0;
const enMap = Object.fromEntries(enSrc.map(n => [n.id, n]));
for (const n of zhSrc) {
  const e = enMap[n.id];
  if (!e) continue;
  if ((n.nextId || '') !== (e.nextId || '')) nextDiff += 1;
  const a = (n.choices || []).map(c => c.nextId).join('|');
  const b = (e.choices || []).map(c => c.nextId).join('|');
  if (a !== b) nextDiff += 1;
}

const report = {
  counts: {
    zhSrc: zhSrc.length,
    enSrc: enSrc.length,
    zhLoc: Object.keys(zhLoc.nodes).length,
    enLoc: Object.keys(enLoc.nodes).length,
  },
  zhCmp,
  enCmp,
  nextIdStructureDiff: nextDiff,
  keyLines: {
    zh_p13e: zhLoc.nodes.p13e?.content,
    en_p13e: enLoc.nodes.p13e?.content,
    zh_fin_last6: zhLoc.nodes.fin_last6?.choices,
    en_fin_last6: enLoc.nodes.fin_last6?.choices,
  },
};

fs.mkdirSync(path.join(root, 'scripts/data'), { recursive: true });
fs.writeFileSync(path.join(root, 'scripts/data/deep-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

// Runtime localization shares story.ts topology. The external EN manuscript is text input only,
// so its expected insertion-point differences are reported but do not invalidate runtime structure.
const fail = zhCmp.contentDiff + zhCmp.choiceDiff + zhCmp.missing + enCmp.contentDiff + enCmp.choiceDiff + enCmp.missing;
process.exit(fail === 0 ? 0 : 1);
