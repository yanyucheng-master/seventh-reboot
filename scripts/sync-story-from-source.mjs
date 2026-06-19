/**
 * Sync story.ts dialogue from V1.0 source document.
 * Matches choice branches, updates text, inserts nodes when source has extra lines.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodes, storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const storyPath = path.join(root, 'src/game/story.ts');
const sourcePath =
  process.argv.find((a) => a.endsWith('.txt') && !a.startsWith('--')) ||
  path.join(root, '\u7b2c\u4e03\u6b21\u91cd\u542f_\u5267\u60c5\u6587\u672c_V1_0_\u5b9a\u7a3f\u903b\u8f91\u8865\u5168\u7248.txt');

const PROTECTED_IDS = new Set([
  'ch3_ref16', 'ch4_27', 'fin_last6', 'fin_decision', 'fin_decision_choice',
  'FINALE_DECISION_END', 'FINALE_START', 'NORMAL_END_START', 'BAD_END_START',
]);

const source = fs.readFileSync(sourcePath, 'utf8');
console.error('parsing source...');

function norm(s) {
  return s.trim().replace(/^【|】$/g, '').replace(/[【】]/g, '').replace(/\s+/g, '')
    .replace(/[，,。.！!？?；;：:…]/g, '');
}
function wrapChoice(s) {
  const t = s.trim().replace(/^【|】$/g, '');
  return `【${t}】`;
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

/** @returns {object} */
function parseSource(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  let started = false;

  function skipMeta() {
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) { i++; continue; }
      if (t.startsWith('【记忆档案提示】') || t.startsWith('【系统浮层】') || t.startsWith('【触发条件】') || t.startsWith('【回忆闪回】') || t.startsWith('【记忆偏移分支】') || t.startsWith('【进入：') || t.startsWith('【超时：') || t.startsWith('（条件：')) {
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
    /** @type {Array<{kind:string,text?:string}>} */
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
    if (!t) return { type: 'empty', beats: [] };
    if (t.startsWith('【选择：')) { i++; return { type: 'empty', beats: [] }; }

    if (t === '【选项】') {
      i++;
      const options = [];
      while (i < lines.length && lines[i].trim().match(/^-\s/)) {
        options.push(lines[i].trim().replace(/^-\s*/, ''));
        i++;
      }
      /** @type {Record<string, Array>} */
      const branches = {};
      for (const opt of options) {
        while (i < lines.length && !lines[i].trim().startsWith(`【选择：${opt}】`)) {
          if (lines[i].trim() === '【汇合】' || lines[i].trim() === '【选项】') break;
          i++;
        }
        if (lines[i]?.trim().startsWith(`【选择：${opt}】`)) i++;
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

    const beats = readUntilChoiceOrMerge();
    return { type: 'linear', beats };
  }

  /** @type {Array<any>} */
  const script = [];
  while (i < lines.length) {
    const t = lines[i]?.trim();
    if (!t) { i++; continue; }
    if (t.startsWith('《') || t.startsWith('版本') || t.startsWith('说明') || t.startsWith('修订') || t.startsWith('【V1.0') || /^\d+\./.test(t)) { i++; continue; }
    if (t === '================================================' || t.startsWith('====')) {
      started = true;
      i++;
      const title = lines[i]?.trim();
      if (title && !title.startsWith('【')) { i++; }
      continue;
    }
    if (t.startsWith('【') && t.endsWith('】') && (t.includes('天') || /^【\d/.test(t) || t.includes(':') || t.includes('：') || t.includes('深夜') || t.includes('天后'))) {
      started = true;
      i++;
      continue;
    }
    if (!started && !t.startsWith('[') && !t.startsWith('Nova')) { i++; continue; }
    started = true;
    const block = parseBlock();
    if (block.type === 'empty') continue;
    if (block.type === 'linear' && !block.beats.length) { i++; continue; }
    if (block.type === 'choice' && !block.options.length) { i++; continue; }
    script.push(block);
  }
  return script;
}

function getLinearChain(startId, stopAtChoice = true) {
  /** @type {string[]} */
  const ids = [];
  let cur = startId;
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const node = storyNodeMap.get(cur);
    if (!node) break;
    ids.push(cur);
    if (stopAtChoice && node.choices?.length) break;
    if (['end', 'chapter'].includes(node.type) && node.id !== startId) break;
    cur = node.nextId;
  }
  return ids;
}

function nodeBeat(node) {
  if (node.type === 'choice') return { kind: 'choice' };
  if (node.speaker === 'nova' && ['text', 'image', 'glitch'].includes(node.type)) return { kind: 'nova' };
  if (node.speaker === 'system' && ['status', 'text', 'glitch', 'file', 'draft'].includes(node.type)) return { kind: node.type === 'draft' ? 'draft' : 'system' };
  return { kind: 'other' };
}

/** @type {Array<{id:string, field:'content'|'choice', index?:number, value:string}>} */
const patches = [];
let insertCounter = 0;
function makeNewId(afterId) {
  insertCounter += 1;
  return `${afterId}_v10_${insertCounter}`;
}

/** @type {Array<{afterId:string, newNodes:object[], oldNextId:string}>} */
const insertions = [];

function alignBeatsToChain(beats, chainIds) {
  const contentNodes = chainIds.filter((id) => {
    const b = nodeBeat(storyNodeMap.get(id));
    return ['nova', 'system', 'draft'].includes(b.kind);
  });
  const contentBeats = beats.filter((b) => ['nova', 'system', 'draft'].includes(b.kind));

  for (let k = 0; k < Math.min(contentNodes.length, contentBeats.length); k++) {
    const id = contentNodes[k];
    if (PROTECTED_IDS.has(id)) continue;
    const node = storyNodeMap.get(id);
    const beat = contentBeats[k];
    let value = beat.text;
    if (node.type === 'draft' || node.type === 'file') {
      const idx = (node.content || '').indexOf('||');
      const title = idx >= 0 ? node.content.slice(0, idx) : (node.type === 'draft' ? '未发送草稿' : '');
      value = title ? `${title}||${beat.text}` : beat.text;
    }
    if ((node.content || '') !== value) patches.push({ id, field: 'content', value });
  }

  if (contentBeats.length > contentNodes.length && contentNodes.length) {
    const afterId = contentNodes[contentNodes.length - 1];
    const tailNode = storyNodeMap.get(afterId);
    const extra = contentBeats.slice(contentNodes.length);
    /** @type {object[]} */
    const newNodes = [];
    for (let e = 0; e < extra.length; e++) {
      const beat = extra[e];
      const newId = makeNewId(afterId);
      newNodes.push({
        id: newId,
        speaker: beat.kind === 'nova' ? 'nova' : 'system',
        type: beat.kind === 'nova' ? 'text' : 'status',
        content: beat.text,
        emotion: 'normal',
        delay: beat.kind === 'nova' ? 600 : 700,
        nextId: tailNode.nextId,
      });
    }
    for (let e = 0; e < newNodes.length - 1; e++) {
      newNodes[e].nextId = newNodes[e + 1].id;
    }
    if (newNodes.length) {
      insertions.push({ afterId, newNodes, oldNextId: tailNode.nextId });
      storyNodeMap.get(afterId).nextId = newNodes[0].id;
      for (const nn of newNodes) storyNodeMap.set(nn.id, nn);
    }
  }
}

function alignChoiceBlock(sourceBlock, storyChoiceId) {
  const node = storyNodeMap.get(storyChoiceId);
  if (!node?.choices) return null;

  const storyOpts = node.choices.map((c) => ({ ...c, norm: norm(c.text) }));
  const srcOpts = sourceBlock.options;

  if (storyOpts.length !== srcOpts.length) return null;

  for (let j = 0; j < storyOpts.length; j++) {
    const src = srcOpts.find((o) => norm(o) === storyOpts[j].norm) ?? srcOpts[j];
    const wrapped = wrapChoice(src);
    if (storyOpts[j].text !== wrapped) patches.push({ id: storyChoiceId, field: 'choice', index: j, value: wrapped });
  }

  for (let j = 0; j < storyOpts.length; j++) {
    const src = srcOpts.find((o) => norm(o) === storyOpts[j].norm) ?? srcOpts[j];
    const branchBeats = sourceBlock.branches[src] || [];
    const chain = getLinearChain(storyOpts[j].nextId);
    alignBeatsToChain(branchBeats, chain);
  }

  if (sourceBlock.merge?.length) {
    const branchEnds = storyOpts.map((o) => {
      const chain = getLinearChain(o.nextId, false);
      return chain[chain.length - 1];
    });
    const nextIds = branchEnds.map((id) => storyNodeMap.get(id)?.nextId).filter(Boolean);
    const convergeId = nextIds.length && new Set(nextIds).size === 1 ? nextIds[0] : null;
    if (convergeId) {
      alignBeatsToChain(sourceBlock.merge, getLinearChain(convergeId));
    } else {
      const chain = getLinearChain(storyOpts[0].nextId, false);
      const tail = chain[chain.length - 1];
      const after = storyNodeMap.get(tail)?.nextId;
      if (after) alignBeatsToChain(sourceBlock.merge, getLinearChain(after));
    }
  }
}

// Build script index -> story choice mapping by walking story from p0
const sourceScript = parseSource(source);
console.error('source blocks:', sourceScript.length, 'aligning...');
let storyCursor = 'p0';
let scriptIdx = 0;
const visited = new Set();
const maxSteps = sourceScript.length * 4 + storyNodes.length * 2;

for (let step = 0; storyCursor && scriptIdx < sourceScript.length && step < maxSteps; step++) {
  if (visited.has(storyCursor + ':' + scriptIdx)) break;
  visited.add(storyCursor + ':' + scriptIdx);
  const block = sourceScript[scriptIdx];
  let node = storyNodeMap.get(storyCursor);

  if (block.type === 'linear') {
    const chain = getLinearChain(storyCursor);
    alignBeatsToChain(block.beats, chain);
    const last = chain[chain.length - 1];
    const lastNode = storyNodeMap.get(last);
    storyCursor = lastNode?.nextId;
    if (lastNode?.choices?.length) {
      // next block should be choice
      scriptIdx++;
      continue;
    }
    scriptIdx++;
    continue;
  }

  if (block.type === 'choice') {
    while (node && !node.choices?.length && node.nextId) {
      storyCursor = node.nextId;
      node = storyNodeMap.get(storyCursor);
    }
    if (!node?.choices?.length) break;
    alignChoiceBlock(block, storyCursor);
    const opts = node.choices;
    const ends = opts.map((o) => {
      const c = getLinearChain(o.nextId, false);
      return c[c.length - 1];
    });
    const nextIds = ends.map((id) => storyNodeMap.get(id)?.nextId);
    storyCursor = nextIds.find(Boolean) ?? storyNodeMap.get(ends[0])?.nextId;
    scriptIdx++;
    continue;
  }
  scriptIdx++;
}

console.error('aligned, patches:', patches.length);
console.log(JSON.stringify({
  sourceBlocks: sourceScript.length,
  scriptIdx,
  patches: patches.length,
  insertions: insertions.length,
  patchSample: patches.slice(0, 15),
  insertionSample: insertions.slice(0, 5),
}, null, 2));

// Apply patches to story.ts source text
let ts = fs.readFileSync(storyPath, 'utf8');
let applied = 0;

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const ins of insertions) {
  const { afterId, newNodes, oldNextId } = ins;
  const escAfter = escRe(afterId);
  const escOld = escRe(oldNextId);
  const nextPatterns = [
    new RegExp(`(\\bn\\('${escAfter}',[^)]+,\\s*)'${escOld}'`),
    new RegExp(`(\\bs\\('${escAfter}',[^)]+,\\s*)'${escOld}'`),
    new RegExp(`(id:\\s*'${escAfter}'[\\s\\S]{0,500}?nextId:\\s*)'${escOld}'`),
  ];
  for (const re of nextPatterns) {
    if (re.test(ts)) {
      ts = ts.replace(re, `$1'${newNodes[0].id}'`);
      break;
    }
  }
  const nodeLines = newNodes.map((nn) => {
    if (nn.speaker === 'nova') {
      return `  n('${nn.id}', '${nn.content.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', '${nn.emotion || 'normal'}', ${nn.delay ?? 600}, '${nn.nextId}'),`;
    }
    return `  s('${nn.id}', '${nn.content.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', ${nn.delay ?? 700}, '${nn.nextId}'),`;
  }).join('\n');
  const insertRe = new RegExp(`^(\\s*(?:n|s|g|draft|c|d|t|ts|ch|f|img|ep|ea|\\{)[^\\n]*'${escAfter}'[^\\n]*\\n)`, 'm');
  if (insertRe.test(ts)) {
    ts = ts.replace(insertRe, `$1${nodeLines}\n`);
    applied += newNodes.length;
  }
}

for (const p of patches) {
  if (p.field === 'choice') {
    const node = storyNodeMap.get(p.id);
    const old = node?.choices?.[p.index]?.text;
    if (!old || old === p.value) continue;
    const escOld = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escId = p.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(id:\\s*'${escId}'[\\s\\S]{0,800}?choices:\\s*\\[[\\s\\S]*?)text:\\s*'${escOld}'`);
    const re2 = new RegExp(`(\\bc\\('${escId}',\\s*\\[[\\s\\S]*?)text:\\s*'${escOld}'`);
    if (re.test(ts)) {
      ts = ts.replace(re, `$1text: '${p.value.replace(/'/g, "\\'")}'`);
      applied++;
    } else if (re2.test(ts)) {
      ts = ts.replace(re2, `$1text: '${p.value.replace(/'/g, "\\'")}'`);
      applied++;
    }
  } else {
    const node = storyNodeMap.get(p.id);
    if (!node || PROTECTED_IDS.has(p.id)) continue;
    const escId = p.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escVal = p.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const helpers = [
      new RegExp(`\\bn\\('${escId}',\\s*'(?:[^'\\\\]|\\\\.)*'`),
      new RegExp(`\\bs\\('${escId}',\\s*'(?:[^'\\\\]|\\\\.)*'`),
      new RegExp(`\\bg\\('${escId}',\\s*'(?:[^'\\\\]|\\\\.)*'`),
      new RegExp(`\\bdraft\\('${escId}',\\s*'(?:[^'\\\\]|\\\\.)*'`),
      new RegExp(`(id:\\s*'${escId}'[\\s\\S]{0,400}?content:\\s*)'(?:[^'\\\\]|\\\\.)*'`),
    ];
    for (const re of helpers) {
      if (re.test(ts)) {
        ts = ts.replace(re, (m) => {
          if (m.startsWith('n(')) return `n('${p.id}', '${escVal}'`;
          if (m.startsWith('s(')) return `s('${p.id}', '${escVal}'`;
          if (m.startsWith('g(')) return `g('${p.id}', '${escVal}'`;
          if (m.startsWith('draft(')) return `draft('${p.id}', '${escVal}'`;
          return `${m.split("'")[0]}'${escVal}'`;
        });
        applied++;
        break;
      }
    }
  }
}

if (process.argv.includes('--apply')) {
  fs.writeFileSync(storyPath, ts);
  console.log('Applied patches:', applied);
}
