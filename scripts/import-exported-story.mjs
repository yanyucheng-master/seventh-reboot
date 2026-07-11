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
  ['neutral', 'normal'],
  ['smiling', 'smile'],
  ['smile', 'smile'],
  ['sad', 'sad'],
  ['glitch', 'glitch'],
  ['surprised', 'normal'],
  ['normal', 'normal'],
]);

const SPEAKER = new Map([
  ['Nova', 'nova'],
  ['系统', 'system'],
  ['玩家', 'player'],
  ['System', 'system'],
  ['Player', 'player'],
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
  ['限时输入', 'input'],
  ['交互', 'interaction'],
  ['通讯日志', 'comm-log'],
  ['记忆锚点', 'memory-anchor'],
  ['后记', 'epilogue'],
  ['结局操作', 'ending-action'],
  ['断连', 'disconnect'],
  ['重连失败', 'reconnectFailed'],
  ['信号错误', 'signalError'],
  // English export labels
  ['Text', 'text'],
  ['Choice', 'choice'],
  ['Timed Choice', 'choice'],
  ['Image', 'image'],
  ['Typing', 'typing'],
  ['Delay', 'delay'],
  ['Status', 'status'],
  ['Timestamp', 'timestamp'],
  ['Chapter', 'chapter'],
  ['Draft', 'draft'],
  ['Fault', 'glitch'],
  ['File', 'file'],
  ['Ending', 'end'],
  ['Input', 'input'],
  ['Timed Input', 'input'],
  ['Interaction', 'interaction'],
  ['Comm Log', 'comm-log'],
  ['Memory Anchor', 'memory-anchor'],
  ['Epilogue', 'epilogue'],
  ['Ending Action', 'ending-action'],
  ['Disconnect', 'disconnect'],
  ['Reconnect Failed', 'reconnectFailed'],
  ['Signal Error', 'signalError'],
  ['Menu', 'menu'],
]);

const ENDING = new Map([
  ['真结局', 'ending_true'],
  ['普通结局', 'ending_normal'],
  ['坏结局', 'ending_bad'],
  ['true_ending', 'ending_true'],
  ['normal_ending', 'ending_normal'],
  ['bad_ending', 'ending_bad'],
  ['ending_true', 'ending_true'],
  ['ending_normal', 'ending_normal'],
  ['ending_bad', 'ending_bad'],
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

function parseLengthRange(value, node) {
  const match = value.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) return;
  node.inputMinLength = Number(match[1]);
  node.inputMaxLength = Number(match[2]);
}

function parseInteractionNextIds(value) {
  const entries = value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const separator = part.indexOf(':');
      if (separator === -1) return null;
      const key = part.slice(0, separator).trim();
      const nextId = cleanNextId(part.slice(separator + 1));
      return key && nextId ? [key, nextId] : null;
    })
    .filter(Boolean);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function parseMeta(metaText, node) {
  for (const raw of metaText.split('|')) {
    const part = raw.trim();
    if (!part) continue;
    if (part === '故障效果' || part === 'glitch_effect') {
      node.isGlitch = true;
      continue;
    }
    const [key, value = ''] = part.split('=').map(s => s.trim());
    if (key === '情绪' || key === 'emotion') node.emotion = EMOTION.get(value) ?? value;
    if (key === '图片' || key === 'image') node.image = value;
    if (key === '故障等级' || key === 'glitch_level') node.glitchLevel = Number(value);
    if (key === '记忆锚点' || key === 'memory_anchor') node.memoryAnchor = value;
    if (key === '需要锚点' || key === 'required_anchor' || key === 'requires_anchor') node.requiresAnchor = value;
    if (key === '联系人阶段' || key === 'contact_stage') node.contactStage = value;
    if (key === '档案解锁' || key === 'archive_unlock') node.archiveUnlock = parsePipeList(value);
    if (key === '显示选项' || key === 'display_choice' || key === 'display_option') node.displayOptionContext = value;
    if (key === '归档入口' || key === 'archive_entry') node.archiveEntry = value;
    if (key === '外部入口' || key === 'external_entry') node.externalEntry = value;
    if (key === '结局' || key === 'ending') node.endingUnlock = ENDING.get(value) ?? value;
    if (key === '限时' || key === 'time_limit') node.choiceTimeoutMs = Number(value.replace(/ms$/i, ''));
    if (key === '超时跳转' || key === '超时' || key === 'timeout' || key === 'timeout_target') {
      node.timeoutNextId = cleanNextId(value);
    }
    if (key === '记录变量' || key === 'record_variable') node.recordVariable = value;
    if (key === '输入变量' || key === 'input_variable') node.inputVariable = value;
    if (key === '自动聚焦' || key === 'auto_focus') node.inputAutoFocus = value === 'true';
    if (key === '长度' || key === 'length') parseLengthRange(value, node);
    if (key === '特殊互动' || key === 'interaction_kind') node.interactionKind = value;
    if (key === '结果跳转' || key === 'interaction_next') {
      node.interactionNextIds = parseInteractionNextIds(value);
    }
    if (key.startsWith('特殊值') || key.startsWith('special_value')) {
      const specialValue = key.replace(/^(特殊值|special_value)/, '').trim();
      if (specialValue && value) {
        node.specialInputNextIds = { ...(node.specialInputNextIds ?? {}), [specialValue]: cleanNextId(value) };
      }
    }
  }
}

function parseChoiceMeta(metaText, choice) {
  if (!metaText) return;
  for (const raw of metaText.split('|')) {
    const part = raw.trim();
    if (!part) continue;
    const [key, value = ''] = part.split('=').map(s => s.trim());
    if (key === '状态影响' || key === 'state_effect' || key === 'stat_effect') choice.statEffect = value;
    if (key === '限时演出' || key === 'timed_scene' || key === 'timed_response') choice.timedResponse = value;
    if (key === '限时证明' || key === 'timed_proof') choice.timedProof = value;
    if (key === '告别语气' || key === 'farewell_tone' || key === 'final_farewell_tone') {
      choice.finalFarewellTone = value;
    }
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
    const nodeMatch = line.match(/^\[([^\]]+)\]\s+\(([^/]+)\/([^)]+)\)$/)
      ?? line.match(/^\[([^\]]+)\]\s+([^/\n\[]+?)\s*\/\s*(.+)$/);
    if (nodeMatch) {
      finish();
      const [, id, speakerLabel, typeLabel] = nodeMatch;
      if (id === 'MENU') continue;
      const speaker = SPEAKER.get(speakerLabel.trim()) ?? speakerLabel.trim().toLowerCase();
      const type = TYPE.get(typeLabel.trim()) ?? typeLabel.trim();
      if (type === 'menu' || id === 'MENU') {
        current = null;
        continue;
      }
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
    if (
      trimmed.startsWith('※ 限时选项') ||
      trimmed.startsWith('※ 限时输入') ||
      trimmed.startsWith('### ')
    ) {
      continue;
    }

    const choiceMatch = trimmed.match(/^\[([^\]]+)\]\s*→\s*(.+?)\s*→\s*(\S+)(?:\s+meta:\s*(.+))?$/);
    if (choiceMatch && current.type === 'input') {
      current.inputSubmitText = choiceMatch[2].trim();
      current.nextId = cleanNextId(choiceMatch[3]);
      continue;
    }
    if (choiceMatch && /^[A-Z]$/.test(choiceMatch[1])) {
      const choice = { text: choiceMatch[2].trim(), nextId: cleanNextId(choiceMatch[3]) };
      parseChoiceMeta(choiceMatch[4], choice);
      current.choices = current.choices ?? [];
      current.choices.push(choice);
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

function preserveNodeRuntime(parsed) {
  const old = storyNodeMap.get(parsed.id);
  const node = { ...parsed };

  if (!node.content && old?.content && node.type === 'chapter') node.content = old.content;
  if (old?.delay !== undefined) node.delay = old.delay;
  else if (DEFAULT_DELAY[node.type] !== undefined && node.type !== 'choice' && node.type !== 'end') node.delay = DEFAULT_DELAY[node.type];

  if (old?.emotion && node.speaker === 'nova' && node.type === 'text' && node.emotion === undefined) node.emotion = old.emotion;
  if (node.speaker === 'nova' && node.type === 'text' && node.emotion === undefined) node.emotion = 'normal';

  if (node.choices?.length) {
    const oldChoices = old?.choices ?? [];
    node.choices = node.choices.map((choice, index) => {
      const sameTargetChoices = oldChoices.filter(c => c.nextId === choice.nextId);
      const match =
        oldChoices.find(c => normChoice(c.text) === normChoice(choice.text)) ??
        (sameTargetChoices.length === 1 ? sameTargetChoices[0] : undefined) ??
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

function promoteChapterTitles(nodes) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const titleHint = (id, content) => {
    const c = content.toLowerCase();
    if (id === 'CH1_START') return /chapter one|chapter 1/.test(c);
    if (id === 'CH2_START') return /chapter two|chapter 2/.test(c);
    if (id === 'CH3_START') return /chapter three|chapter 3/.test(c);
    if (id === 'CH4_START') return /chapter four|chapter 4/.test(c);
    if (id === 'CH5A_START') return /chapter five.*part i\b|truth \(part i\)/.test(c);
    if (id === 'CH5B_START') return /chapter five.*part ii|truth \(part ii\)/.test(c);
    if (id === 'FINALE_START') return /finale|seventh reboot/.test(c) && !/bad ending|eighth/.test(c);
    if (id === 'NORMAL_END_START' || id === 'normal_title') return /normal ending|beyond the/.test(c);
    if (id === 'BAD_END_START') return /bad ending|eighth reboot/.test(c);
    if (id === 'fin_credit_title') return /true ending|seventh reboot/.test(c);
    return content.length <= 80;
  };

  const fallbackTitlesEn = {
    CH1_START: 'Chapter One: Connection',
    CH2_START: 'Chapter Two: Ordinary Days',
    CH3_START: 'Chapter Three: Anomaly',
    CH4_START: 'Chapter Four: Memory',
    CH5A_START: 'Chapter Five: The Truth (Part I)',
    CH5B_START: 'Chapter Five: The Truth (Part II)',
    FINALE_START: 'Finale: The Seventh Reboot',
    NORMAL_END_START: 'Normal Ending: Beyond the Cycle',
    BAD_END_START: 'Bad Ending: The Eighth Reboot',
    fin_credit_title: 'True Ending: The Seventh Reboot',
    normal_title: 'Normal Ending: Beyond the Cycle',
  };

  const fallbackTitlesZh = {
    CH1_START: '第一章：连接',
    CH2_START: '第二章：日常',
    CH3_START: '第三章：异常',
    CH4_START: '第四章：记忆',
    CH5A_START: '第五章：真相（上）',
    CH5B_START: '第五章：真相（下）',
    FINALE_START: '终章：第七次重启',
    NORMAL_END_START: '普通结局：循环之外',
    BAD_END_START: '坏结局：第八次重启',
    fin_credit_title: '真结局：第七次重启',
    normal_title: '普通结局：循环之外',
  };

  for (const node of nodes) {
    if (!node.nextId) continue;
    const target = byId.get(node.nextId);
    if (!target || target.type !== 'chapter') continue;
    const content = (node.content ?? '').trim();
    if (!content) continue;
    if (!titleHint(target.id, content)) continue;
    if (!target.content?.trim()) {
      target.content = content;
    }
    if (node.type === 'delay') {
      node.content = '';
    }
  }

  const sample = nodes.find(n => n.content && n.type === 'text')?.content ?? '';
  const preferZh = /[\u4e00-\u9fff]/.test(sample);
  const fallbackTitles = preferZh ? fallbackTitlesZh : fallbackTitlesEn;

  for (const node of nodes) {
    if (node.type !== 'chapter') continue;
    const fallback = fallbackTitles[node.id];
    if (!fallback) continue;
    const content = (node.content ?? '').trim();
    if (!content) {
      node.content = fallback;
      continue;
    }
    // Only replace mismatched-script leftovers from the other locale.
    const contentIsZh = /[\u4e00-\u9fff]/.test(content);
    if (preferZh && !contentIsZh) node.content = fallback;
    if (!preferZh && contentIsZh) node.content = fallback;
  }
  return nodes;
}

function applySourceLogicFixes(node) {
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

function propJson(key, value, lines) {
  if (value === undefined) return;
  lines.push(`    ${key}: ${JSON.stringify(value)},`);
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
  prop('displayOptionContext', node.displayOptionContext, lines);
  prop('archiveEntry', node.archiveEntry, lines);
  prop('externalEntry', node.externalEntry, lines);
  prop('recordVariable', node.recordVariable, lines);
  prop('inputVariable', node.inputVariable, lines);
  propRaw('inputMinLength', node.inputMinLength, lines);
  propRaw('inputMaxLength', node.inputMaxLength, lines);
  propRaw('inputAutoFocus', node.inputAutoFocus, lines);
  propJson('specialInputNextIds', node.specialInputNextIds, lines);
  prop('interactionKind', node.interactionKind, lines);
  propJson('interactionNextIds', node.interactionNextIds, lines);
  prop('inputSubmitText', node.inputSubmitText, lines);
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

const parsedNodes = promoteChapterTitles(
  parseExport(source).map(preserveNodeRuntime).map(applySourceLogicFixes).map(applyDisplayOverrides),
);

const storyJson = JSON.stringify(parsedNodes, null, 2);
const generated = `const rawStoryNodes = JSON.parse(${JSON.stringify(storyJson)}) as StoryNode[];`;

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
