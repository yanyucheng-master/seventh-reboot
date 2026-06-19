/**
 * Sync chapters 1-5 from source into story.ts (text + choices + insertions).
 * Usage: npx tsx scripts/sync-ch1-5.mjs [--apply]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const storyPath = path.join(root, 'src/game/story.ts');
const sourcePath = path.join(root, '第七次重启_剧情文本_V1_0_定稿逻辑补全版.txt');
const source = fs.readFileSync(sourcePath, 'utf8');

const PROTECTED = new Set(['ch3_ref16', 'ch4_27', 'fin_last6', 'FINALE_DECISION_END', 'FINALE_START', 'NORMAL_END_START', 'BAD_END_START']);

function norm(s) {
  return s.trim().replace(/^【|】$/g, '').replace(/【|】/g, '').replace(/\s+/g, '')
    .replace(/[，,。.！!？?；;：:…""]/g, '');
}
function wrapChoice(s) {
  const t = s.trim().replace(/^【|】$/g, '');
  return `【${t}】`;
}

function isMetaLine(t) {
  return t.startsWith('【记忆档案提示】') || t.startsWith('【系统浮层】') ||
    t.startsWith('【触发条件】') || t.startsWith('【回忆闪回】') ||
    t.startsWith('【记忆偏移分支】') || t.startsWith('【进入：') ||
    t.startsWith('【超时：') || t.startsWith('（条件：');
}

function parseLineBeat(line) {
  const t = line.trim();
  if (!t) return null;
  let m = t.match(/^Nova[：:](.+)$/);
  if (m) return { kind: 'nova', text: m[1].trim() };
  m = t.match(/^\[系统\]\s*(.+)$/);
  if (m) return { kind: 'system', text: m[1].trim() };
  if (t.startsWith('[异常]')) return { kind: 'system', text: t.replace(/^\[异常\]\s*/, '') };
  if (t.startsWith('[图片]')) return { kind: 'image', text: t.replace(/^\[图片\]\s*/, '').trim() };
  if (t.startsWith('[黑屏]') || t.startsWith('[通讯日志]') || t.startsWith('[草稿')) return { kind: 'skip' };
  if (t.startsWith('记录记忆锚点') || t.startsWith('记忆档案完整度') || t.startsWith('未登记') || t.startsWith('该锚点')) return { kind: 'meta' };
  if (t.startsWith('外部本地时间') || t.startsWith('Observer-01 本体') || t.startsWith('通讯端环境')) return { kind: 'meta' };
  if (t.match(/^【\d+:\d+】$/) || t.match(/^【第.+天/)) return { kind: 'timestamp', text: t };
  return null;
}

function parseSourceChapters(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  /** @type {Array<{title:string, blocks:any[]}>} */
  const chapters = [];
  let current = null;
  let started = false;

  function skipMeta() {
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) { i++; continue; }
      if (isMetaLine(t)) {
        i++;
        while (i < lines.length) {
          const b = parseLineBeat(lines[i]);
          if (!b || b.kind === 'meta') { i++; continue; }
          if (lines[i].trim().startsWith('【')) break;
          if (lines[i].trim().match(/^-\s/)) break;
          i++;
        }
        continue;
      }
      break;
    }
  }

  function readUntilChoiceOrMerge() {
    const beats = [];
    skipMeta();
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) { i++; continue; }
      if (t === '【选项】' || t.startsWith('【选择：') || t === '【汇合】') break;
      if (t.startsWith('【') && t.endsWith('】') && (t.includes('章') || t.includes('天') || t.includes(':') || t.includes('：') || /^【\d/.test(t) || t.includes('深夜') || t.includes('天后'))) break;
      if (t === '================================================' || t.startsWith('====')) break;
      if (t.startsWith('【12年后') || t.startsWith('【黑屏】')) break;
      const b = parseLineBeat(lines[i]);
      if (b) { if (!['skip', 'meta'].includes(b.kind)) beats.push(b); i++; continue; }
      if (t.startsWith('[草稿')) {
        i++;
        const body = [];
        while (i < lines.length && !lines[i].trim().startsWith('[') && !lines[i].trim().startsWith('【') && lines[i].trim() !== '================================================') {
          if (lines[i].trim()) body.push(lines[i].trim());
          i++;
        }
        if (body.length) beats.push({ kind: 'draft', text: body.join('\n') });
        continue;
      }
      if (!started && (t.includes('PROTOCOL') || t.startsWith('[OBSERVER'))) { i++; continue; }
      i++;
    }
    return beats;
  }

  function parseBlock() {
    skipMeta();
    let t = lines[i]?.trim();
    while (!t && i < lines.length) { i++; t = lines[i]?.trim(); }
    if (!t) return { type: 'empty' };
    if (t.startsWith('【选择：')) { i++; return { type: 'empty' }; }
    if (t === '【选项】') {
      i++;
      const options = [];
      while (i < lines.length && lines[i].trim().match(/^-\s/)) {
        options.push(lines[i].trim().replace(/^-\s*/, ''));
        i++;
      }
      const branches = {};
      for (const opt of options) {
        const marker = `【选择：${opt}】`;
        while (i < lines.length && lines[i].trim() !== marker) {
          const lt = lines[i]?.trim();
          if (lt === '【汇合】' || lt === '【选项】') break;
          i++;
        }
        if (lines[i]?.trim() === marker) i++;
        branches[opt] = readUntilChoiceOrMerge();
      }
      skipMeta();
      let merge = [];
      if (lines[i]?.trim() === '【汇合】') {
        i++;
        merge = readUntilChoiceOrMerge();
      }
      return { type: 'choice', options, branches, merge };
    }
    return { type: 'linear', beats: readUntilChoiceOrMerge() };
  }

  while (i < lines.length) {
    const t = lines[i]?.trim();
    if (!t) { i++; continue; }
    if (t === '================================================' || (t.startsWith('====') && t.includes('章'))) {
      i++;
      const title = lines[i]?.trim() || '';
      if (title.includes('章')) {
        current = { title, blocks: [] };
        chapters.push(current);
        i++;
      }
      continue;
    }
    if (t.startsWith('【') && t.endsWith('】') && (t.includes('天') || /^【\d/.test(t) || t.includes(':') || t.includes('：') || t.includes('深夜'))) {
      started = true; i++; continue;
    }
    if (!started) { i++; continue; }
    if (!current) { i++; continue; }
    const block = parseBlock();
    if (block.type === 'empty') continue;
    if (block.type === 'linear' && !block.beats?.length) { i++; continue; }
    if (block.type === 'choice' && !block.options?.length) { i++; continue; }
    current.blocks.push(block);
  }
  return chapters;
}

function getChain(startId, stopAtChoice = true) {
  const ids = [];
  let cur = startId;
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const node = storyNodeMap.get(cur);
    if (!node) break;
    ids.push(cur);
    if (stopAtChoice && node.choices?.length) break;
    if (cur === 'FINALE_START') break;
    if (['end', 'chapter'].includes(node.type) && ids.length > 1) break;
    cur = node.nextId;
  }
  return ids;
}

function nodeKind(node) {
  if (!node) return 'other';
  if (node.type === 'choice') return 'choice';
  if (node.speaker === 'nova' && ['text', 'image', 'glitch'].includes(node.type)) return 'nova';
  if (node.speaker === 'system' && ['status', 'text', 'glitch', 'draft', 'file', 'timestamp'].includes(node.type)) {
    return node.type === 'draft' ? 'draft' : node.type === 'timestamp' ? 'timestamp' : 'system';
  }
  return 'other';
}

const patches = [];
const insertions = [];
let insN = 0;

function alignBeats(beats, chainIds) {
  const contentIds = chainIds.filter((id) => ['nova', 'system', 'draft', 'timestamp'].includes(nodeKind(storyNodeMap.get(id))));
  const contentBeats = beats.filter((b) => ['nova', 'system', 'draft', 'image'].includes(b.kind));

  for (let k = 0; k < Math.min(contentIds.length, contentBeats.length); k++) {
    const id = contentIds[k];
    if (PROTECTED.has(id)) continue;
    const node = storyNodeMap.get(id);
    const beat = contentBeats[k];
    let value = beat.text;
    if (node.type === 'draft' || node.type === 'file') {
      const idx = (node.content || '').indexOf('||');
      const title = idx >= 0 ? node.content.slice(0, idx) : '未发送草稿';
      value = `${title}||${beat.text}`;
    }
    if (node.type === 'image' && beat.kind === 'image') {
      const parts = beat.text.split('\n');
      value = parts.length > 1 ? `${parts[0]}\n${parts.slice(1).join('\n')}` : beat.text;
    }
    if ((node.content || '') !== value) patches.push({ id, field: 'content', value });
  }

  if (contentBeats.length > contentIds.length && contentIds.length) {
    const afterId = contentIds[contentIds.length - 1];
    const tail = storyNodeMap.get(afterId);
    const extra = contentBeats.slice(contentIds.length);
    insN += 1;
    const newNodes = extra.map((beat, e) => {
      const id = `${afterId}_s${insN}_${e + 1}`;
      const speaker = beat.kind === 'nova' ? 'nova' : 'system';
      const type = beat.kind === 'nova' ? 'text' : beat.kind === 'image' ? 'image' : 'status';
      return { id, speaker, type, content: beat.text, emotion: 'normal', delay: 600, nextId: '' };
    });
    for (let e = 0; e < newNodes.length - 1; e++) newNodes[e].nextId = newNodes[e + 1].id;
    newNodes[newNodes.length - 1].nextId = tail.nextId;
    insertions.push({ afterId, oldNextId: tail.nextId, newNodes });
    tail.nextId = newNodes[0].id;
    for (const nn of newNodes) storyNodeMap.set(nn.id, nn);
  }
}

function matchOpt(storyText, srcOptions) {
  const sn = norm(storyText);
  return srcOptions.find((o) => norm(o) === sn) ?? srcOptions.find((o) => sn.includes(norm(o)) || norm(o).includes(sn));
}

function processChoice(block, choiceId) {
  const node = storyNodeMap.get(choiceId);
  if (!node?.choices) return null;

  for (let j = 0; j < node.choices.length; j++) {
    const src = matchOpt(node.choices[j].text, block.options) ?? block.options[j];
    if (!src) continue;
    const w = wrapChoice(src);
    if (node.choices[j].text !== w) patches.push({ id: choiceId, field: 'choice', index: j, value: w });
  }

  for (const ch of node.choices) {
    const srcKey = matchOpt(ch.text, block.options);
    if (srcKey) alignBeats(block.branches[srcKey] || [], getChain(ch.nextId));
  }

  if (block.merge?.length) {
    const ends = node.choices.map((o) => {
      const c = getChain(o.nextId, false);
      return c[c.length - 1];
    });
    const nextIds = ends.map((id) => storyNodeMap.get(id)?.nextId);
    const conv = nextIds.length && new Set(nextIds).size === 1 ? nextIds[0] : storyNodeMap.get(ends[0])?.nextId;
    if (conv) alignBeats(block.merge, getChain(conv));
  }

  const ends = node.choices.map((o) => {
    const c = getChain(o.nextId, false);
    return c[c.length - 1];
  });
  return storyNodeMap.get(ends[0])?.nextId;
}

// Walk story from CH1_START, consume chapter blocks
const chapters = parseSourceChapters(source);
const ch1to5 = chapters.filter((c) => /第[一二三四五]章/.test(c.title));

let cursor = 'CH1_START';
let chIdx = 0;
let blockIdx = 0;
const visited = new Set();

for (let step = 0; step < 8000 && cursor && cursor !== 'FINALE_START' && chIdx < ch1to5.length; step++) {
  const key = `${cursor}:${chIdx}:${blockIdx}`;
  if (visited.has(key)) break;
  visited.add(key);

  let node = storyNodeMap.get(cursor);
  if (!node) break;

  // skip chapter/timestamp/typing/delay nodes in story
  while (node && ['typing', 'delay'].includes(node.type) && node.nextId) {
    cursor = node.nextId;
    node = storyNodeMap.get(cursor);
  }
  if (!node || cursor === 'FINALE_START') break;

  const blocks = ch1to5[chIdx]?.blocks || [];
  if (blockIdx >= blocks.length) {
    // advance to next chapter marker in story
    if (node.type === 'chapter' && node.nextId) {
      chIdx++;
      blockIdx = 0;
      cursor = node.nextId;
      continue;
    }
    if (node.nextId) { cursor = node.nextId; continue; }
    break;
  }

  const block = blocks[blockIdx];

  if (node.choices?.length) {
    if (block.type !== 'choice') {
      // story has choice but source has linear - skip source block or advance story
      if (node.nextId) { cursor = node.nextId; continue; }
      break;
    }
    const next = processChoice(block, cursor);
    blockIdx++;
    if (next) cursor = next;
    else break;
    continue;
  }

  if (block.type === 'linear') {
    alignBeats(block.beats, getChain(cursor));
    const chain = getChain(cursor);
    cursor = storyNodeMap.get(chain[chain.length - 1])?.nextId;
    blockIdx++;
    continue;
  }

  if (block.type === 'choice') {
    // story linear, source choice - advance story
    if (node.nextId) { cursor = node.nextId; continue; }
    break;
  }

  blockIdx++;
}

console.log(JSON.stringify({
  chapters: ch1to5.map((c) => ({ title: c.title, blocks: c.blocks.length })),
  patches: patches.length,
  insertions: insertions.length,
  newNodes: insertions.reduce((s, x) => s + x.newNodes.length, 0),
  chIdx, blockIdx, cursor,
}, null, 2));

if (!process.argv.includes('--apply')) {
  console.log('Dry run. Use --apply to write.');
  process.exit(0);
}

let ts = fs.readFileSync(storyPath, 'utf8');
let applied = 0;

function escSingle(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const ins of insertions) {
  const { afterId, newNodes, oldNextId } = ins;
  const escAfter = escRe(afterId);
  const escOld = escRe(oldNextId);
  for (const re of [
    new RegExp(`(\\bn\\('${escAfter}',[^)]+,\\s*)'${escOld}'`),
    new RegExp(`(\\bs\\('${escAfter}',[^)]+,\\s*)'${escOld}'`),
    new RegExp(`(id:\\s*'${escAfter}'[\\s\\S]{0,500}?nextId:\\s*)'${escOld}'`),
  ]) {
    if (re.test(ts)) { ts = ts.replace(re, `$1'${newNodes[0].id}'`); break; }
  }
  const lines = newNodes.map((nn) => {
    if (nn.speaker === 'nova') return `  n('${nn.id}', '${escSingle(nn.content)}', '${nn.emotion || 'normal'}', ${nn.delay ?? 600}, '${nn.nextId}'),`;
    return `  s('${nn.id}', '${escSingle(nn.content)}', ${nn.delay ?? 700}, '${nn.nextId}'),`;
  }).join('\n');
  const insertRe = new RegExp(`^(\\s*(?:n|s|g|draft|c|d|t|ts|ch|f|img|ep|ea|\\{)[^\\n]*'${escAfter}'[^\\n]*\\n)`, 'm');
  if (insertRe.test(ts)) { ts = ts.replace(insertRe, `$1${lines}\n`); applied += newNodes.length; }
}

for (const p of patches) {
  if (PROTECTED.has(p.id)) continue;
  if (p.field === 'choice') {
    const node = storyNodeMap.get(p.id);
    const old = node?.choices?.[p.index]?.text;
    if (!old || old === p.value) continue;
    const escOld = escRe(old);
    const escId = escRe(p.id);
    for (const re of [
      new RegExp(`(\\bc\\('${escId}',\\s*\\[[\\s\\S]*?)text:\\s*'${escOld}'`),
      new RegExp(`(id:\\s*'${escId}'[\\s\\S]{0,1200}?choices:\\s*\\[[\\s\\S]*?)text:\\s*'${escOld}'`),
    ]) {
      if (re.test(ts)) { ts = ts.replace(re, `$1text: '${escSingle(p.value)}'`); applied++; break; }
    }
  } else {
    const escId = escRe(p.id);
    const escVal = escSingle(p.value);
    for (const re of [
      new RegExp(`(\\bn\\('${escId}',\\s*)'(?:[^'\\\\]|\\\\.)*'`),
      new RegExp(`(\\bs\\('${escId}',\\s*)'(?:[^'\\\\]|\\\\.)*'`),
      new RegExp(`(\\bg\\('${escId}',\\s*)'(?:[^'\\\\]|\\\\.)*'`),
      new RegExp(`(\\bdraft\\('${escId}',\\s*)'(?:[^'\\\\]|\\\\.)*'`),
      new RegExp(`(id:\\s*'${escId}'[\\s\\S]{0,400}?content:\\s*)'(?:[^'\\\\]|\\\\.)*'`),
    ]) {
      if (re.test(ts)) { ts = ts.replace(re, `$1'${escVal}'`); applied++; break; }
    }
  }
}

fs.writeFileSync(storyPath, ts);
console.log('Applied:', applied);
