/**
 * Walk story.ts graph and align nova/system/choice text with source document.
 * Preserves node ids, nextId graph, timed fields, statEffect, ending jumps.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodes, storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath =
  process.argv[2] || 'C:/Users/YYC/Desktop/第七次重启_剧情文本_V1_0_定稿逻辑补全版.txt';
const source = fs.readFileSync(sourcePath, 'utf8');

function normChoice(s) {
  return s
    .trim()
    .replace(/^【/, '')
    .replace(/】$/, '')
    .replace(/[【】]/g, '')
    .replace(/\s+/g, '')
    .replace(/[，,。.！!？?；;：:…]/g, '');
}

function wrapChoice(s) {
  const t = s.trim().replace(/^【|】$/g, '');
  return `【${t}】`;
}

/** @typedef {{ kind: 'choice', options: string[] } | { kind: 'nova', text: string } | { kind: 'system', text: string } | { kind: 'skip' }} Beat */

/** Parse source into linear beats (choices + dialogue), expanding branches inline is handled separately */
function parseSourceBeats(text) {
  /** @type {Beat[]} */
  const beats = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  const skipHeader = true;
  let inGameplay = false;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    i++;

    if (!line) continue;
    if (line.startsWith('《第七次重启》') || line.startsWith('版本：') || line.startsWith('说明：') || line.startsWith('修订时间') || line.startsWith('【V1.0')) continue;
    if (/^\d+\./.test(line)) continue;
    if (line === '================================================' || line.startsWith('====')) {
      inGameplay = true;
      continue;
    }
    if (!inGameplay && line.startsWith('[') && line.includes('PROTOCOL')) {
      inGameplay = true;
    }
    if (!inGameplay) continue;

    if (line === '【选项】') {
      const options = [];
      while (i < lines.length && lines[i].trim().match(/^-\s/)) {
        options.push(lines[i].trim().replace(/^-\s*/, ''));
        i++;
      }
      beats.push({ kind: 'choice', options });
      continue;
    }
    if (line.startsWith('【选择：') || line.startsWith('【汇合】') || line.startsWith('【进入：') || line.startsWith('【记忆档案提示】') || line.startsWith('【系统浮层】') || line.startsWith('【触发条件】') || line.startsWith('【回忆闪回】') || line.startsWith('【记忆偏移分支】') || line.startsWith('【超时：') || line.startsWith('（条件：')) {
      continue;
    }
    if (line.startsWith('【') && line.endsWith('】') && (line.includes('天') || line.includes(':'))) continue;

    let m = line.match(/^Nova[：:](.+)$/);
    if (m) {
      beats.push({ kind: 'nova', text: m[1].trim() });
      continue;
    }
    m = line.match(/^\[系统\]\s*(.+)$/);
    if (m) {
      beats.push({ kind: 'system', text: m[1].trim() });
      continue;
    }
    if (line.startsWith('[异常]')) {
      beats.push({ kind: 'system', text: line.replace(/^\[异常\]\s*/, '') });
      continue;
    }
    if (line.startsWith('[草稿')) {
      // skip title line; body follows
      continue;
    }
    if (line.startsWith('[图片]')) {
      beats.push({ kind: 'skip' });
      continue;
    }
    if (line.startsWith('[黑屏]') || line.startsWith('[通讯日志]')) continue;
    if (line.startsWith('记录记忆锚点') || line.startsWith('记忆档案完整度') || line.startsWith('未登记记忆锚点') || line.startsWith('该锚点已存在于')) continue;
    if (line.startsWith('外部本地时间') || line.startsWith('Observer-01 本体状态') || line.startsWith('通讯端环境反馈')) continue;
  }
  return beats;
}

/** Walk graph from startId, collect reachable linearized path assuming choices follow first matching option from source */
function walkGraph(startId = 'p0', maxSteps = 5000) {
  /** @type {string[]} */
  const order = [];
  const seen = new Set();
  let cur = startId;
  let steps = 0;
  while (cur && steps++ < maxSteps) {
    if (seen.has(cur)) break;
    seen.add(cur);
    order.push(cur);
    const node = storyNodeMap.get(cur);
    if (!node) break;
    if (node.choices?.length) break; // stop at choice; branches handled externally
    cur = node.nextId;
  }
  return order;
}

function getChoiceOptions(nodeId) {
  const node = storyNodeMap.get(nodeId);
  if (!node?.choices) return null;
  return node.choices.map((c) => ({ text: c.text, nextId: c.nextId, norm: normChoice(c.text) }));
}

function findBeatChoiceIndex(beats, fromIndex) {
  for (let i = fromIndex; i < beats.length; i++) {
    if (beats[i].kind === 'choice') return i;
  }
  return -1;
}

function matchOptions(beatOptions, storyOptions) {
  const bNorm = beatOptions.map(normChoice);
  const sNorm = storyOptions.map((o) => o.norm);
  if (bNorm.length !== sNorm.length) return false;
  const sortedB = [...bNorm].sort();
  const sortedS = [...sNorm].sort();
  return sortedB.every((v, i) => v === sortedS[i]);
}

/** DFS sync: align source beats with graph nodes */
function syncFromNode(nodeId, beatIndex, updates, visited = new Set()) {
  const key = `${nodeId}:${beatIndex}`;
  if (visited.has(key)) return beatIndex;
  visited.add(key);

  let bi = beatIndex;
  while (bi < sourceBeats.length) {
    const beat = sourceBeats[bi];
    if (beat.kind === 'choice') {
      const node = storyNodeMap.get(nodeId);
      if (node?.choices?.length) {
        const opts = getChoiceOptions(nodeId);
        if (!opts || !matchOptions(beat.options, opts)) {
          return bi; // desync
        }
        // update choice labels
        for (let j = 0; j < node.choices.length; j++) {
          const srcOpt = beat.options.find((o) => normChoice(o) === opts[j].norm) ?? beat.options[j];
          updates.choices[nodeId] = updates.choices[nodeId] || {};
          updates.choices[nodeId][j] = wrapChoice(srcOpt);
        }
        bi++;
        // recurse each branch - find corresponding 【选择：X】 block in source by walking beats until merge
        for (const opt of opts) {
          const srcOpt = beat.options.find((o) => normChoice(o) === opt.norm) ?? opt.text;
          // skip to after choice beat, consume branch lines until next choice at same level - simplified: recurse from nextId
          bi = syncFromNode(opt.nextId, bi, updates, visited);
        }
        // after all branches, skip 【汇合】 content already consumed; continue from merge node if branches share target
        const mergeTargets = [...new Set(opts.map((o) => o.nextId))];
        if (mergeTargets.length === 1) {
          nodeId = findMergeNode(opts[0].nextId, opts.map((o) => o.nextId));
        } else {
          // find common merge by walking each branch to first common node
          nodeId = findCommonMerge(opts.map((o) => o.nextId));
        }
        if (!nodeId) return bi;
        continue;
      }
      return bi;
    }

    const node = storyNodeMap.get(nodeId);
    if (!node) return bi;

    if (beat.kind === 'nova' && node.speaker === 'nova' && (node.type === 'text' || node.type === 'image' || node.type === 'glitch')) {
      updates.content[nodeId] = beat.text;
      bi++;
      nodeId = node.nextId ?? '';
      if (!nodeId) return bi;
      continue;
    }
    if (beat.kind === 'system' && node.speaker === 'system' && !['typing', 'delay', 'end', 'chapter', 'epilogue', 'ending-action', 'comm-log', 'timestamp'].includes(node.type)) {
      if (node.type === 'file' || node.type === 'draft') {
        const idx = (node.content || '').indexOf('||');
        const title = idx >= 0 ? node.content.slice(0, idx) : '';
        updates.content[nodeId] = title ? `${title}||${beat.text}` : beat.text;
      } else {
        updates.content[nodeId] = beat.text;
      }
      bi++;
      nodeId = node.nextId ?? '';
      if (!nodeId) return bi;
      continue;
    }
    if (beat.kind === 'skip') {
      bi++;
      nodeId = node.nextId ?? '';
      if (!nodeId) return bi;
      continue;
    }
    // beat doesn't match node type - try advance node or beat
    if (node.nextId) {
      nodeId = node.nextId;
      continue;
    }
    return bi;
  }
  return bi;
}

function findCommonMerge(nextIds) {
  const paths = nextIds.map((id) => walkGraph(id, 200));
  if (!paths.length) return nextIds[0];
  // naive: return the last node id of shortest path's tail where paths overlap
  const set0 = new Set(paths[0]);
  for (const p of paths.slice(1)) {
    for (const id of [...set0]) {
      if (!p.includes(id)) set0.delete(id);
    }
  }
  // pick earliest in first path
  for (const id of paths[0]) {
    if (set0.has(id)) return id;
  }
  return nextIds[0];
}

function findMergeNode(startId, branchStarts) {
  return findCommonMerge(branchStarts);
}

const sourceBeats = parseSourceBeats(source);
const updates = { content: {}, choices: {} };

// Start sync - the graph walker above is fragile; use simpler sequential matcher for main spine
let beatIdx = 0;
/** @type {string|null} */
let nodeId = 'p0';

const protectedPatterns = /choiceTimeoutMs|statEffect|timedResponse|timedProof|FINALE_|NORMAL_END|BAD_END|ch3_ref16|ch4_27/;

function applyUpdatesToFile() {
  let src = fs.readFileSync(path.join(root, 'src/game/story.ts'), 'utf8');
  let changeCount = 0;

  for (const [id, text] of Object.entries(updates.content)) {
    if (protectedPatterns.test(id)) continue;
    const re = new RegExp(`(id:\\s*'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?content:\\s*)('(?:[^'\\\\]|\\\\.)*'|\`(?:[^\\\\\`]|\\\\.)*\`)`, 'm');
    const m = src.match(re);
    if (!m) continue;
    const escaped = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const replacement = `$1'${escaped}'`;
    const next = src.replace(re, replacement);
    if (next !== src) {
      src = next;
      changeCount++;
    }
  }

  fs.writeFileSync(path.join(root, 'src/game/story.ts'), src);
  return changeCount;
}

// Simple pass: for each story node in order, try to match next source nova/system line
/** @type {Map<string, StoryNode>} */
const nodeOrder = storyNodes.map((n) => n.id);
let si = 0;
for (let ni = 0; ni < storyNodes.length && si < sourceBeats.length; ni++) {
  const node = storyNodes[ni];
  // advance source to next non-skip beat
  while (si < sourceBeats.length && sourceBeats[si].kind === 'skip') si++;

  if (node.type === 'choice' && node.choices?.length) {
    while (si < sourceBeats.length && sourceBeats[si].kind !== 'choice') si++;
    if (si < sourceBeats.length && sourceBeats[si].kind === 'choice') {
      const beat = sourceBeats[si];
      for (let j = 0; j < node.choices.length; j++) {
        const cn = normChoice(node.choices[j].text);
        const match = beat.options.find((o) => normChoice(o) === cn) ?? beat.options[j];
        if (match) {
          updates.choices[node.id] = updates.choices[node.id] || {};
          updates.choices[node.id][j] = wrapChoice(match);
        }
      }
      si++;
    }
    continue;
  }

  if (node.speaker === 'nova' && node.content && ['text', 'image', 'glitch'].includes(node.type)) {
    while (si < sourceBeats.length && sourceBeats[si].kind !== 'nova') si++;
    if (si < sourceBeats.length) {
      updates.content[node.id] = sourceBeats[si].text;
      si++;
    }
    continue;
  }

  if (node.speaker === 'system' && node.content && ['status', 'text', 'glitch', 'file', 'draft'].includes(node.type)) {
    while (si < sourceBeats.length && sourceBeats[si].kind !== 'system') si++;
    if (si < sourceBeats.length) {
      if (node.type === 'file' || node.type === 'draft') {
        const idx = node.content.indexOf('||');
        const title = idx >= 0 ? node.content.slice(0, idx) : '';
        updates.content[node.id] = title ? `${title}||${sourceBeats[si].text}` : sourceBeats[si].text;
      } else {
        updates.content[node.id] = sourceBeats[si].text;
      }
      si++;
    }
  }
}

// Apply choice updates
let storySrc = fs.readFileSync(path.join(root, 'src/game/story.ts'), 'utf8');
let choiceChanges = 0;
let contentChanges = 0;

for (const [nodeId, idxMap] of Object.entries(updates.choices)) {
  for (const [idx, newText] of Object.entries(idxMap)) {
    const node = storyNodeMap.get(nodeId);
    if (!node?.choices?.[Number(idx)]) continue;
    const oldText = node.choices[Number(idx)].text;
    if (oldText === newText) continue;
    const escOld = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(id:\\s*'${nodeId}'[\\s\\S]*?choices:\\s*\\[[\\s\\S]*?)text:\\s*'${escOld}'`, 'm');
    if (re.test(storySrc)) {
      storySrc = storySrc.replace(re, `$1text: '${newText.replace(/'/g, "\\'")}'`);
      choiceChanges++;
    }
  }
}

for (const [id, text] of Object.entries(updates.content)) {
  const node = storyNodeMap.get(id);
  if (!node) continue;
  const old = node.content;
  if (old === text) continue;
  const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // match n('id', 'content' or content: '...'
  const patterns = [
    new RegExp(`(\\bn\\('${escId}',\\s*)'(?:[^'\\\\]|\\\\.)*'`, 'm'),
    new RegExp(`(\\bs\\('${escId}',\\s*)'(?:[^'\\\\]|\\\\.)*'`, 'm'),
    new RegExp(`(\\bg\\('${escId}',\\s*)'(?:[^'\\\\]|\\\\.)*'`, 'm'),
    new RegExp(`(id:\\s*'${escId}'[\\s\\S]*?content:\\s*)'(?:[^'\\\\]|\\\\.)*'`, 'm'),
  ];
  const escaped = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  for (const re of patterns) {
    if (re.test(storySrc)) {
      storySrc = storySrc.replace(re, `$1'${escaped}'`);
      contentChanges++;
      break;
    }
  }
}

fs.writeFileSync(path.join(root, 'src/game/story.ts'), storySrc);

console.log(JSON.stringify({
  sourceBeats: sourceBeats.length,
  contentUpdates: Object.keys(updates.content).length,
  choiceUpdates: Object.keys(updates.choices).length,
  appliedContent: contentChanges,
  appliedChoices: choiceChanges,
}, null, 2));
