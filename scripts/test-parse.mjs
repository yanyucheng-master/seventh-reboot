import fs from 'node:fs';

const source = fs.readFileSync('C:/Users/YYC/Desktop/第七次重启_剧情文本_V1_0_定稿逻辑补全版.txt', 'utf8');

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
  if (t.startsWith('记录记忆锚点') || t.startsWith('记忆档案完整度')) return { kind: 'meta' };
  if (t.startsWith('未登记') || t.startsWith('该锚点')) return { kind: 'meta' };
  if (t.startsWith('外部本地时间') || t.startsWith('Observer-01 本体') || t.startsWith('通讯端环境')) return { kind: 'meta' };
  return null;
}

function parseSource(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  let started = false;
  let iterations = 0;

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
      iterations++;
      if (iterations > 500000) throw new Error('readUntilChoiceOrMerge infinite at ' + i);
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
        while (i < lines.length && !lines[i].trim().startsWith('[') && !lines[i].trim().startsWith('【') &&
               lines[i].trim() !== '================================================') {
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
      const branches = {};
      for (const opt of options) {
        const marker = `【选择：${opt}】`;
        while (i < lines.length && lines[i].trim() !== marker) {
          iterations++;
          if (iterations > 500000) throw new Error('branch search infinite at ' + i + ' opt=' + opt);
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
    iterations++;
    if (iterations > 500000) throw new Error('main loop infinite at ' + i);
    const t = lines[i]?.trim();
    if (!t) { i++; continue; }
    if (t.startsWith('《') || t.startsWith('版本') || t.startsWith('说明') || t.startsWith('修订') || t.startsWith('【V1.0') || /^\d+\./.test(t)) { i++; continue; }
    if (t === '================================================' || t.startsWith('====')) {
      started = true;
      i++;
      if (lines[i]?.trim() && !lines[i].trim().startsWith('【')) i++;
      continue;
    }
    if (t.startsWith('【') && t.endsWith('】') && (t.includes('天') || /^【\d/.test(t) || t.includes(':') || t.includes('：') || t.includes('深夜') || t.includes('天后'))) { started = true; i++; continue; }
    if (!started && !t.startsWith('[') && !t.startsWith('Nova')) { i++; continue; }
    started = true;
    const block = parseBlock();
    if (block.type === 'empty') continue;
    if (block.type === 'linear' && !block.beats.length) { i++; continue; }
    if (block.type === 'choice' && !block.options.length) { i++; continue; }
    script.push(block);
  }
  return { script, iterations };
}

const { script, iterations } = parseSource(source);
console.log('blocks', script.length, 'iterations', iterations);
