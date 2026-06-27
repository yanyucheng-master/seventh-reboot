import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: npx tsx scripts/import-exported-story.mjs <exported-story.txt>');
  process.exit(1);
}

const storyPath = path.join(root, 'src/game/story.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const originalStory = fs.readFileSync(storyPath, 'utf8');

const EMOTION = new Map([
  ['平常', 'normal'],
  ['微笑', 'smile'],
  ['悲伤', 'sad'],
  ['故障', 'glitch'],
  ['惊讶', 'normal'],
]);

const SPEAKER = new Map([
  ['Nova', 'nova'],
  ['系统', 'system'],
  ['玩家', 'player'],
]);

const TYPE = new Map([
  ['文本', 'text'],
  ['选项', 'choice'],
  ['限时选项', 'choice'],
  ['图片', 'image'],
  ['输入中', 'typing'],
  ['延迟', 'delay'],
  ['状态', 'status'],
  ['时间戳', 'timestamp'],
  ['章节', 'chapter'],
  ['草稿', 'draft'],
  ['故障', 'glitch'],
  ['文件', 'file'],
  ['结局', 'end'],
  ['输入', 'input'],
  ['交互', 'interaction'],
  ['通讯日志', 'comm-log'],
  ['记忆锚点', 'memory-anchor'],
  ['后记', 'epilogue'],
  ['结局操作', 'ending-action'],
  ['断连', 'disconnect'],
  ['重连失败', 'reconnectFailed'],
  ['信号错误', 'signalError'],
]);

const ENDING = new Map([
  ['真结局', 'ending_true'],
  ['普通结局', 'ending_normal'],
  ['坏结局', 'ending_bad'],
]);

const DEFAULT_DELAY = {
  text: 600,
  status: 400,
  glitch: 2000,
  typing: 2000,
  delay: 1000,
  timestamp: 400,
  chapter: 400,
  file: 400,
  draft: 400,
  image: 400,
  epilogue: 2400,
  'ending-action': 1200,
};

const NEXT_ID_ALIASES = new Map([
  ['ch3_dream11-c3', 'ch3_dream11_c3'],
]);

function cleanNextId(value) {
  const cleaned = value.split('//')[0].trim();
  return NEXT_ID_ALIASES.get(cleaned) ?? cleaned;
}

function normChoice(text) {
  return text
    .trim()
    .replace(/^【|】$/g, '')
    .replace(/[【】]/g, '')
    .replace(/\s+/g, '')
    .replace(/[，,。.！!？?；;：:…]/g, '');
}

function esc(value) {
  return JSON.stringify(value);
}

function parsePipeList(value) {
  const items = value.split(',').map(s => s.trim()).filter(Boolean);
  return items.length <= 1 ? items[0] : items;
}

function parseMeta(metaText, node) {
  for (const raw of metaText.split('|')) {
    const part = raw.trim();
    if (!part) continue;
    if (part === '故障效果') {
      node.isGlitch = true;
      continue;
    }
    const [key, value = ''] = part.split('=').map(s => s.trim());
    if (key === '情绪') node.emotion = EMOTION.get(value) ?? value;
    if (key === '图片') node.image = value;
    if (key === '故障等级') node.glitchLevel = Number(value);
    if (key === '记忆锚点') node.memoryAnchor = value;
    if (key === '需要锚点') node.requiresAnchor = value;
    if (key === '联系人阶段') node.contactStage = value;
    if (key === '档案解锁') node.archiveUnlock = parsePipeList(value);
    if (key === '结局') node.endingUnlock = ENDING.get(value) ?? value;
    if (key === '限时') node.choiceTimeoutMs = Number(value.replace(/ms$/i, ''));
    if (key === '超时跳转' || key === '超时') node.timeoutNextId = cleanNextId(value);
  }
}

function parseChoiceMeta(metaText, choice) {
  if (!metaText) return;
  for (const raw of metaText.split('|')) {
    const part = raw.trim();
    if (!part) continue;
    const [key, value = ''] = part.split('=').map(s => s.trim());
    if (key === '状态影响') choice.statEffect = value;
    if (key === '限时演出') choice.timedResponse = value;
    if (key === '限时证明') choice.timedProof = value;
    if (key === '告别语气') choice.finalFarewellTone = value;
  }
}

function parseExport(text) {
  const lines = text.split(/\r?\n/);
  const nodes = [];
  let current = null;
  let mode = 'content';
  let fileTitle = '';
  let draftTitle = '';
  let pendingHeading = '';
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
    mode = 'content';
    fileTitle = '';
    draftTitle = '';
    body = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith('## ')) {
      pendingHeading = line.replace(/^##\s*/, '');
      continue;
    }
    const nodeMatch = line.match(/^\[([^\]]+)\]\s+\(([^/]+)\/([^)]+)\)$/);
    if (nodeMatch) {
      finish();
      const [, id, speakerLabel, typeLabel] = nodeMatch;
      if (id === 'MENU') continue;
      const speaker = SPEAKER.get(speakerLabel) ?? speakerLabel;
      const type = TYPE.get(typeLabel) ?? typeLabel;
      current = { id, speaker, type, content: '' };
      if (type === 'chapter' && pendingHeading) current.content = pendingHeading;
      pendingHeading = '';
      continue;
    }
    if (!current) continue;
    const trimmed = line.trim();
    if (!trimmed) {
      if ((current.type === 'file' || current.type === 'draft') && body.length > 0) {
        body.push('');
      }
      continue;
    }
    if (trimmed.startsWith('##')) continue;
    if (trimmed.startsWith('meta:')) {
      parseMeta(trimmed.replace(/^meta:\s*/, ''), current);
      continue;
    }
    if (trimmed.startsWith('next:')) {
      current.nextId = cleanNextId(trimmed.replace(/^next:\s*/, ''));
      continue;
    }
    if (trimmed.startsWith('※ 限时选项')) continue;

    const choiceMatch = trimmed.match(/^\[([A-Z])\]\s*→\s*(.+?)\s*→\s*(\S+)(?:\s+meta:\s*(.+))?$/);
    if (choiceMatch) {
      const choice = { text: choiceMatch[2].trim(), nextId: cleanNextId(choiceMatch[3]) };
      parseChoiceMeta(choiceMatch[4], choice);
      current.choices = current.choices ?? [];
      current.choices.push(choice);
      continue;
    }

    if (current.type === 'image' && trimmed.startsWith('图片说明:')) {
      body.push(trimmed.replace(/^图片说明:\s*/, ''));
      continue;
    }
    if (current.type === 'file' && trimmed.startsWith('文件标题:')) {
      fileTitle = trimmed.replace(/^文件标题:\s*/, '');
      continue;
    }
    if (current.type === 'draft' && trimmed.startsWith('草稿标题:')) {
      draftTitle = trimmed.replace(/^草稿标题:\s*/, '');
      continue;
    }
    body.push(trimmed);
  }
  finish();
  return nodes;
}

function preserveNodeRuntime(parsed) {
  const old = storyNodeMap.get(parsed.id);
  const node = { ...parsed };

  if (!node.content && old?.content && node.type === 'chapter') node.content = old.content;
  if (old?.delay !== undefined) node.delay = old.delay;
  else if (DEFAULT_DELAY[node.type] !== undefined && node.type !== 'choice' && node.type !== 'end') node.delay = DEFAULT_DELAY[node.type];

  for (const key of [
    'archiveUnlock',
    'endingUnlock',
    'requiresAnchor',
    'choiceTimeoutMs',
    'timeoutNextId',
    'image',
    'memoryAnchor',
    'contactStage',
    'glitchLevel',
  ]) {
    if (node[key] === undefined && old?.[key] !== undefined) node[key] = old[key];
  }
  if (old?.emotion && node.speaker === 'nova' && node.type === 'text' && node.emotion === undefined) node.emotion = old.emotion;
  if (node.speaker === 'nova' && node.type === 'text' && node.emotion === undefined) node.emotion = 'normal';

  if (node.choices?.length) {
    const oldChoices = old?.choices ?? [];
    node.choices = node.choices.map((choice, index) => {
      const match =
        oldChoices.find(c => c.nextId === choice.nextId) ??
        oldChoices.find(c => normChoice(c.text) === normChoice(choice.text)) ??
        oldChoices[index];
      return match ? { ...match, text: choice.text, nextId: choice.nextId, ...choice } : choice;
    });
  }

  return node;
}

function applyDisplayOverrides(node) {
  const unknown06Ids = new Set(['p11', 'p12a_u06', 'p12b_u06', 'p12e_u06', 'p13_u06', 'p13a_u06']);
  if (unknown06Ids.has(node.id)) {
    node.displayName = 'UNKNOWN-06';
    node.avatarProfile = 'unknown';
  }
  if (node.id.startsWith('fin_timeout') || node.id.startsWith('fin_break')) {
    if (node.speaker === 'nova' && node.isGlitch) {
      node.avatarProfile = 'nova_glitch';
    }
  }
  return node;
}

function applySourceLogicFixes(node) {
  if (node.id === 'ch2_dream7f' && node.nextId === 'ch2_dream10') {
    node.nextId = 'ch2_dream9';
  }
  if (node.id === 'ch5a_obs9' && node.nextId === 'ch5a_obs11') {
    node.nextId = 'ch5a_obs10_choice';
  }
  return node;
}

function prop(key, value, lines) {
  if (value === undefined) return;
  lines.push(`    ${key}: ${esc(value)},`);
}

function propRaw(key, value, lines) {
  if (value === undefined) return;
  lines.push(`    ${key}: ${value},`);
}

function renderChoice(choice) {
  const lines = ['{'];
  prop('text', choice.text, lines);
  prop('nextId', choice.nextId, lines);
  prop('statEffect', choice.statEffect, lines);
  propRaw('trustDelta', choice.trustDelta, lines);
  propRaw('memoryDelta', choice.memoryDelta, lines);
  propRaw('attachmentDelta', choice.attachmentDelta, lines);
  propRaw('acceptFarewell', choice.acceptFarewell, lines);
  prop('finalChoice', choice.finalChoice, lines);
  prop('timedResponse', choice.timedResponse, lines);
  prop('timedProof', choice.timedProof, lines);
  prop('finalFarewellTone', choice.finalFarewellTone, lines);
  lines.push('  }');
  return lines.join('\n  ');
}

function renderNode(node) {
  const lines = ['  {'];
  prop('id', node.id, lines);
  prop('speaker', node.speaker, lines);
  prop('type', node.type, lines);
  prop('content', node.content ?? '', lines);
  prop('emotion', node.emotion, lines);
  if (node.choices?.length) {
    lines.push('    choices: [');
    for (const choice of node.choices) {
      lines.push(`      ${renderChoice(choice).replace(/\n/g, '\n      ')},`);
    }
    lines.push('    ],');
  }
  propRaw('choiceTimeoutMs', node.choiceTimeoutMs, lines);
  prop('timeoutNextId', node.timeoutNextId, lines);
  prop('image', node.image, lines);
  propRaw('delay', node.delay, lines);
  prop('nextId', node.nextId, lines);
  propRaw('isGlitch', node.isGlitch, lines);
  propRaw('glitchLevel', node.glitchLevel, lines);
  prop('memoryAnchor', node.memoryAnchor, lines);
  prop('requiresAnchor', node.requiresAnchor, lines);
  prop('contactStage', node.contactStage, lines);
  if (Array.isArray(node.archiveUnlock)) {
    lines.push(`    archiveUnlock: ${JSON.stringify(node.archiveUnlock)},`);
  } else {
    prop('archiveUnlock', node.archiveUnlock, lines);
  }
  prop('endingUnlock', node.endingUnlock, lines);
  prop('displayName', node.displayName, lines);
  prop('avatarProfile', node.avatarProfile, lines);
  lines.push('  }');
  return lines.join('\n');
}

const parsedNodes = parseExport(source).map(preserveNodeRuntime).map(applySourceLogicFixes).map(applyDisplayOverrides);

const storyJson = JSON.stringify(parsedNodes, null, 2)
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');
const generated = `const rawStoryNodes = JSON.parse(String.raw\`${storyJson}\`) as StoryNode[];`;

let start = originalStory.indexOf('// Helper to create nodes more easily');
if (start === -1) start = originalStory.indexOf('// Story nodes imported from exported V1.0 narrative document.');
const end = originalStory.indexOf('function normalizeStoryNode');
if (start === -1 || end === -1) {
  throw new Error('Could not locate story node region in story.ts');
}

const nextStory =
  originalStory.slice(0, start) +
  `// Story nodes imported from exported V1.0 narrative document.\n` +
  generated +
  '\n\n' +
  originalStory.slice(end);

fs.writeFileSync(storyPath, nextStory, 'utf8');
console.log(`Imported ${parsedNodes.length} nodes into ${storyPath}`);
