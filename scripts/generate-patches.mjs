/**
 * Generate content/choice patches by matching source branches to story graph.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, '第七次重启_剧情文本_V1_0_定稿逻辑补全版.txt');
const source = fs.readFileSync(sourcePath, 'utf8');

function norm(s) {
  return s.trim().replace(/^【|】$/g, '').replace(/【|】/g, '').replace(/\s+/g, '')
    .replace(/[，,。.！!？?；;：:…]/g, '');
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
  if (t.startsWith('[图片]') || t.startsWith('[黑屏]') || t.startsWith('[通讯日志]')) return { kind: 'skip' };
  if (t.startsWith('记录记忆锚点') || t.startsWith('记忆档案完整度') || t.startsWith('未登记') || t.startsWith('该锚点')) return { kind: 'meta' };
  if (t.startsWith('外部本地时间') || t.startsWith('Observer-01 本体') || t.startsWith('通讯端环境')) return { kind: 'meta' };
  return null;
}

function parseSource(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
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
      if (b) { if (b.kind !== 'skip' && b.kind !== 'meta') beats.push(b); i++; continue; }
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

  const script = [];
  while (i < lines.length) {
    const t = lines[i]?.trim();
    if (!t) { i++; continue; }
    if (t.startsWith('《') || t.startsWith('版本') || t.startsWith('说明') || t.startsWith('修订') || t.startsWith('【V1.0') || /^\d+\./.test(t)) { i++; continue; }
    if (t === '================================================' || t.startsWith('====')) {
      started = true; i++;
      if (lines[i]?.trim() && !lines[i].trim().startsWith('【')) i++;
      continue;
    }
    if (t.startsWith('【') && t.endsWith('】') && (t.includes('天') || /^【\d/.test(t) || t.includes(':') || t.includes('：') || t.includes('深夜') || t.includes('天后'))) {
      started = true; i++; continue;
    }
    if (!started && !t.startsWith('[') && !t.startsWith('Nova')) { i++; continue; }
    started = true;
    const block = parseBlock();
    if (block.type === 'empty') continue;
    if (block.type === 'linear' && !block.beats?.length) { i++; continue; }
    if (block.type === 'choice' && !block.options?.length) { i++; continue; }
    script.push(block);
  }
  return script;
}

const PROTECTED = new Set(['ch3_ref16', 'ch4_27', 'fin_last6']);

function nodeKind(node) {
  if (!node) return 'other';
  if (node.type === 'choice') return 'choice';
  if (node.speaker === 'nova' && ['text', 'image', 'glitch'].includes(node.type)) return 'nova';
  if (node.speaker === 'system' && ['status', 'text', 'glitch', 'draft', 'file'].includes(node.type)) return node.type === 'draft' ? 'draft' : 'system';
  return 'other';
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
    if (['end', 'chapter'].includes(node.type) && cur !== startId) break;
    cur = node.nextId;
  }
  return ids;
}

function alignBeats(beats, chainIds, patches, insertions) {
  const contentIds = chainIds.filter((id) => ['nova', 'system', 'draft'].includes(nodeKind(storyNodeMap.get(id))));
  const contentBeats = beats.filter((b) => ['nova', 'system', 'draft'].includes(b.kind));
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
    if ((node.content || '') !== value) patches.push({ id, field: 'content', value });
  }
  if (contentBeats.length > contentIds.length && contentIds.length) {
    const afterId = contentIds[contentIds.length - 1];
    const tail = storyNodeMap.get(afterId);
    const extra = contentBeats.slice(contentIds.length);
    const newNodes = extra.map((beat, e) => ({
      id: `${afterId}_ins${insertions.length + 1}_${e + 1}`,
      speaker: beat.kind === 'nova' ? 'nova' : 'system',
      type: beat.kind === 'nova' ? 'text' : 'status',
      content: beat.text,
      emotion: 'normal',
      delay: beat.kind === 'nova' ? 600 : 700,
    }));
    for (let e = 0; e < newNodes.length; e++) {
      newNodes[e].nextId = e < newNodes.length - 1 ? newNodes[e + 1].id : tail.nextId;
    }
    insertions.push({ afterId, oldNextId: tail.nextId, newNodes });
    tail.nextId = newNodes[0].id;
    for (const nn of newNodes) storyNodeMap.set(nn.id, nn);
  }
}

function processChoiceBlock(block, choiceId, patches, insertions) {
  const node = storyNodeMap.get(choiceId);
  if (!node?.choices) return null;
  const storyOpts = node.choices.map((c) => ({ ...c, norm: norm(c.text) }));
  const srcNorms = block.options.map(norm);
  const storyNorms = storyOpts.map((o) => o.norm);
  const matchCount = srcNorms.filter((s) => storyNorms.includes(s)).length;

  if (matchCount === 0 && srcNorms.length !== storyNorms.length) return 'mismatch';

  for (let j = 0; j < storyOpts.length; j++) {
    const src = block.options.find((o) => norm(o) === storyOpts[j].norm) ?? block.options[j];
    if (!src) continue;
    const wrapped = wrapChoice(src);
    if (storyOpts[j].text !== wrapped) patches.push({ id: choiceId, field: 'choice', index: j, value: wrapped });
  }

  for (const opt of storyOpts) {
    const src = block.options.find((o) => norm(o) === opt.norm) ?? block.options.find((o) => norm(o) === opt.norm);
    const key = block.options.find((o) => norm(o) === opt.norm);
    if (key) alignBeats(block.branches[key] || [], getChain(opt.nextId), patches, insertions);
  }

  if (block.merge?.length) {
    const ends = storyOpts.map((o) => {
      const c = getChain(o.nextId, false);
      return c[c.length - 1];
    });
    const nextIds = ends.map((id) => storyNodeMap.get(id)?.nextId);
    const converge = nextIds.length && new Set(nextIds).size === 1 ? nextIds[0] : storyNodeMap.get(ends[0])?.nextId;
    if (converge) alignBeats(block.merge, getChain(converge), patches, insertions);
  }
  return storyOpts[0]?.nextId;
}

const script = parseSource(source);
const patches = [];
const insertions = [];
let scriptIdx = 0;
let cursor = 'p4'; // start at first player choice after comm-log intro

// Skip source blocks until first choice (接入通讯 already in story before p4)
while (scriptIdx < script.length && script[scriptIdx].type !== 'choice') scriptIdx++;

function advancePastSystem(nodeId) {
  let cur = nodeId;
  while (cur) {
    const n = storyNodeMap.get(cur);
    if (!n) return cur;
    if (n.choices?.length) return cur;
    if (nodeKind(n) === 'nova' || nodeKind(n) === 'system' || nodeKind(n) === 'draft') return cur;
    cur = n.nextId;
  }
  return cur;
}

const maxSteps = 500;
for (let step = 0; step < maxSteps && scriptIdx < script.length; step++) {
  const block = script[scriptIdx];
  cursor = advancePastSystem(cursor);
  const node = storyNodeMap.get(cursor);
  if (!node) break;

  if (block.type === 'choice') {
    while (node && !node.choices?.length && node.nextId) {
      cursor = node.nextId;
      node = storyNodeMap.get(cursor);
    }
    if (!node?.choices?.length) break;
    const result = processChoiceBlock(block, cursor, patches, insertions);
    if (result === 'mismatch') {
      console.error('Choice mismatch at', cursor, block.options, node.choices.map((c) => c.text));
      scriptIdx++;
      continue;
    }
    const ends = node.choices.map((o) => {
      const c = getChain(o.nextId, false);
      return c[c.length - 1];
    });
    cursor = storyNodeMap.get(ends[0])?.nextId;
    scriptIdx++;
    continue;
  }

  if (block.type === 'linear') {
    alignBeats(block.beats, getChain(cursor), patches, insertions);
    const chain = getChain(cursor);
    cursor = storyNodeMap.get(chain[chain.length - 1])?.nextId;
    scriptIdx++;
  }
}

fs.writeFileSync(path.join(root, 'scripts/sync-patches.json'), JSON.stringify({ patches, insertions }, null, 2));
console.log(JSON.stringify({ patches: patches.length, insertions: insertions.length, scriptIdx, totalBlocks: script.length }, null, 2));
