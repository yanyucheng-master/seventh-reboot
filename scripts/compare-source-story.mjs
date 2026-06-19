import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodes } from '../src/game/story.ts';
import { cleanChatText } from '../src/game/format.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const sourcePath = args[0] || 'C:/Users/YYC/Desktop/第七次重启_剧情文本_V1_0_定稿逻辑补全版.txt';
const source = fs.readFileSync(sourcePath, 'utf8');

function normalizeText(s) {
  return s
    .replace(/\r/g, '')
    .replace(/\.\.\./g, '……')
    .replace(/。([""''）】]*)$/u, '$1')
    .replace(/\.([""''）】]*)$/u, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripChoiceBrackets(s) {
  const t = s.trim();
  const m = t.match(/^【(.+)】$/);
  return m ? m[1] : t.replace(/[【】]/g, '');
}

/** Parse source into ordered content items */
function parseSource(text) {
  const items = [];
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || line.startsWith('《') || line.startsWith('版本') || line.startsWith('说明') || line.startsWith('修订') || line.startsWith('【V1.0') || /^\d+\./.test(line) || line === '================================================' || line.startsWith('====')) {
      i++;
      continue;
    }
    if (line.startsWith('[通讯日志]') || line.startsWith('[黑屏]') || line.startsWith('[异常]') || line.startsWith('[图片]') || line.startsWith('[草稿') || line.startsWith('[OBSERVER') || line.startsWith('PROTOCOL') || line.startsWith('REBOOT') || line.startsWith('INTEGRITY')) {
      items.push({ kind: 'system', raw: line, text: line.replace(/^\[(?:系统|异常|黑屏|图片|草稿[^\]]*|通讯日志)\]\s?/, '').replace(/^\[草稿 ·[^\]]*\]\s?/, '') });
      i++;
      continue;
    }
    if (line.startsWith('[系统]')) {
      items.push({ kind: 'system', raw: line, text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith('Nova：')) {
      items.push({ kind: 'nova', raw: line, text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith('【选项】') || line.startsWith('【汇合】') || line.startsWith('【进入：') || line.startsWith('【记忆档案提示】') || line.startsWith('【系统浮层】') || line.startsWith('【触发条件】') || line.startsWith('【回忆闪回】') || line.startsWith('【记忆偏移分支】') || line.startsWith('【超时：') || line.startsWith('【选择：') || line.startsWith('【第二天') || line.startsWith('【第三天') || line.startsWith('【11:') || line.startsWith('【12:') || line.startsWith('【16:') || line.startsWith('【21:') || line.startsWith('【22:') || line.startsWith('（条件：')) {
      i++;
      continue;
    }
    if (line.match(/^-\s/)) {
      items.push({ kind: 'choice', raw: line, text: line.replace(/^-\s*/, '').trim() });
      i++;
      continue;
    }
    if (line.startsWith('学生：') || line.startsWith('Nova ') || line.startsWith('深空') || line.startsWith('观测') || line.startsWith('有人') || line.startsWith('她') || line.startsWith('某天') || line.startsWith('后来') || line.startsWith('如果') || line.startsWith('《第七次')) {
      items.push({ kind: 'epilogue', raw: line, text: line });
      i++;
      continue;
    }
    // multi-line draft/image caption
    if (items.length && items[items.length - 1].kind === 'draft') {
      items[items.length - 1].text += '\n' + line;
      i++;
      continue;
    }
    i++;
  }
  return items;
}

function extractStoryContent() {
  const items = [];
  for (const node of storyNodes) {
    if (node.choices?.length) {
      for (const ch of node.choices) {
        items.push({ kind: 'choice', id: node.id, text: stripChoiceBrackets(ch.text), nextId: ch.nextId });
      }
    }
    if (node.speaker === 'nova' && node.content && (node.type === 'text' || node.type === 'image' || node.type === 'glitch')) {
      items.push({ kind: 'nova', id: node.id, text: cleanChatText(node.content) });
    }
    if (node.speaker === 'system' && node.content && !['typing', 'delay', 'end'].includes(node.type)) {
      let text = node.content;
      if (node.type === 'file' || node.type === 'draft') {
        const idx = text.indexOf('||');
        text = idx >= 0 ? text.slice(idx + 2) : text;
      }
      items.push({ kind: node.type === 'epilogue' ? 'epilogue' : 'system', id: node.id, text });
    }
  }
  return items;
}

const srcItems = parseSource(source);
const storyItems = extractStoryContent();

const srcNova = srcItems.filter((x) => x.kind === 'nova');
const storyNova = storyItems.filter((x) => x.kind === 'nova');
const srcSys = srcItems.filter((x) => x.kind === 'system');
const storySys = storyItems.filter((x) => x.kind === 'system');
const srcChoice = srcItems.filter((x) => x.kind === 'choice');
const storyChoice = storyItems.filter((x) => x.kind === 'choice');

const diffs = [];

function compareLists(label, a, b) {
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    const sa = a[i];
    const sb = b[i];
    if (!sa || !sb) {
      diffs.push({ label, index: i, type: 'missing', source: sa?.text, story: sb?.text, storyId: sb?.id });
      continue;
    }
    const nt = normalizeText(sa.text);
    const ns = normalizeText(sb.text);
    if (nt !== ns) {
      diffs.push({ label, index: i, type: 'text', source: sa.text, story: sb.text, storyId: sb.id });
    }
  }
}

compareLists('nova', srcNova, storyNova);
compareLists('system', srcSys, storySys);
compareLists('choice', srcChoice, storyChoice);

console.log(JSON.stringify({
  counts: {
    source: { nova: srcNova.length, system: srcSys.length, choice: srcChoice.length, total: srcItems.length },
    story: { nova: storyNova.length, system: storySys.length, choice: storyChoice.length, total: storyItems.length },
    nodes: storyNodes.length,
  },
  diffCount: diffs.length,
  sampleDiffs: diffs.slice(0, 80),
}, null, 2));

if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(root, 'scripts/compare-diff-report.json'), JSON.stringify(diffs, null, 2));
}
