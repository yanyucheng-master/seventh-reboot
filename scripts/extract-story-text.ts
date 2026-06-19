import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { storyNodes } from '../src/game/story.ts';
import type { StoryNode } from '../src/game/story.ts';

const VERSION = 'V1.0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', '第七次重启-剧情文本.txt');

const speakerLabel: Record<string, string> = {
  nova: 'Nova',
  system: '系统',
  player: '玩家',
};

const typeLabel: Record<string, string> = {
  text: '文本',
  choice: '选项',
  image: '图片',
  typing: '输入中',
  delay: '延迟',
  status: '状态',
  timestamp: '时间戳',
  chapter: '章节',
  draft: '草稿',
  glitch: '故障',
  file: '文件',
  end: '结局',
  input: '输入',
  'comm-log': '通讯日志',
  'memory-anchor': '记忆锚点',
  epilogue: '后记',
  'ending-action': '结局操作',
  disconnect: '断连',
  reconnectFailed: '重连失败',
  signalError: '信号错误',
};

const emotionLabel: Record<string, string> = {
  normal: '平常',
  smile: '微笑',
  sad: '悲伤',
  glitch: '故障',
};

const endingLabel: Record<string, string> = {
  ending_true: '真结局',
  ending_normal: '普通结局',
  ending_bad: '坏结局',
};

function parsePipeContent(content: string): { title: string; body: string } {
  const idx = content.indexOf('||');
  if (idx === -1) return { title: '', body: content };
  return { title: content.slice(0, idx), body: content.slice(idx + 2) };
}

function formatMeta(node: StoryNode): string[] {
  const meta: string[] = [];
  if (node.emotion) meta.push(`情绪=${emotionLabel[node.emotion] ?? node.emotion}`);
  if (node.image) meta.push(`图片=${node.image}`);
  if (node.isGlitch) meta.push('故障效果');
  if (node.glitchLevel) meta.push(`故障等级=${node.glitchLevel}`);
  if (node.memoryAnchor) meta.push(`记忆锚点=${node.memoryAnchor}`);
  if (node.requiresAnchor) meta.push(`需要锚点=${node.requiresAnchor}`);
  if (node.contactStage) meta.push(`联系人阶段=${node.contactStage}`);
  if (node.archiveUnlock) {
    const archives = Array.isArray(node.archiveUnlock) ? node.archiveUnlock.join(', ') : node.archiveUnlock;
    meta.push(`档案解锁=${archives}`);
  }
  if (node.endingUnlock) meta.push(`结局=${endingLabel[node.endingUnlock] ?? node.endingUnlock}`);
  if (node.choiceTimeoutMs) meta.push(`限时=${node.choiceTimeoutMs}ms`);
  if (node.timeoutNextId) meta.push(`超时跳转=${node.timeoutNextId}`);
  return meta;
}

function formatNode(node: StoryNode): string[] {
  const lines: string[] = [];
  const sp = speakerLabel[node.speaker] ?? node.speaker;
  const tp = typeLabel[node.type] ?? node.type;
  const meta = formatMeta(node);

  if (node.type === 'chapter') {
    lines.push(`## ${node.content}`);
    lines.push(`[${node.id}] (${sp}/${tp})`);
    if (meta.length) lines.push(`  meta: ${meta.join(' | ')}`);
    if (node.nextId) lines.push(`  next: ${node.nextId}`);
    lines.push('');
    return lines;
  }

  if (node.type === 'epilogue') {
    lines.push(`### 后记`);
    lines.push(`[${node.id}] (${sp}/${tp})`);
    if (node.content) lines.push(node.content);
    if (meta.length) lines.push(`  meta: ${meta.join(' | ')}`);
    if (node.nextId) lines.push(`  next: ${node.nextId}`);
    lines.push('');
    return lines;
  }

  if (node.type === 'end') {
    lines.push(`### 结局节点`);
    lines.push(`[${node.id}] (${sp}/${tp})`);
    if (meta.length) lines.push(`  meta: ${meta.join(' | ')}`);
    if (node.nextId) lines.push(`  next: ${node.nextId}`);
    lines.push('');
    return lines;
  }

  lines.push(`[${node.id}] (${sp}/${tp})`);
  if (meta.length) lines.push(`  meta: ${meta.join(' | ')}`);

  if (node.type === 'image' && node.content) {
    lines.push(`  图片说明: ${node.content}`);
  } else if (node.type === 'file' && node.content) {
    const { title, body } = parsePipeContent(node.content);
    if (title) lines.push(`  文件标题: ${title}`);
    if (body) lines.push(body);
  } else if (node.type === 'draft' && node.content) {
    const { title, body } = parsePipeContent(node.content);
    if (title) lines.push(`  草稿标题: ${title}`);
    if (body) lines.push(body);
  } else if (node.content) {
    lines.push(node.content);
  }

  if (node.choices?.length) {
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    node.choices.forEach((ch, i) => {
      const label = labels[i] ?? String(i + 1);
      const choiceMeta = [
        ch.statEffect ? `状态影响=${ch.statEffect}` : '',
        ch.timedResponse ? `限时演出=${ch.timedResponse}` : '',
        ch.timedProof ? `限时证明=${ch.timedProof}` : '',
        ch.finalFarewellTone ? `告别语气=${ch.finalFarewellTone}` : '',
      ].filter(Boolean);
      const metaSuffix = choiceMeta.length ? `  meta: ${choiceMeta.join(' | ')}` : '';
      lines.push(`  [${label}] → ${ch.text}  →  ${ch.nextId}${metaSuffix}`);
    });
    if (node.choiceTimeoutMs || node.timeoutNextId) {
      lines.push(`  ※ 限时选项：${node.choiceTimeoutMs ?? '?'}ms，超时 → ${node.timeoutNextId ?? '?'}`);
    }
  }

  if (node.nextId) lines.push(`  next: ${node.nextId}`);
  lines.push('');
  return lines;
}

const bodyLines: string[] = [];
for (const node of storyNodes) {
  bodyLines.push(...formatNode(node));
}

const output = [
  `# 第七次重启 · 剧情文本导出`,
  `版本：${VERSION}`,
  `节点数：${storyNodes.length}`,
  `生成时间：${new Date().toISOString()}`,
  ``,
  `说明：本文档由 story.ts 自动导出，包含全部节点、选项分支、系统消息、章节、后记、结局、记忆锚点、文件与图片说明。`,
  `分支格式：[选项字母] → 选项文本 → 下一节点ID`,
  ``,
  `---`,
  ``,
  ...bodyLines,
].join('\n');

fs.writeFileSync(outPath, output, 'utf8');

const lineCount = output.split('\n').length;
const choiceCount = storyNodes.filter(n => n.choices?.length).length;
const branchCount = storyNodes.reduce((sum, n) => sum + (n.choices?.length ?? 0), 0);

console.log(`Wrote ${storyNodes.length} nodes (${lineCount} lines, ${choiceCount} choice nodes, ${branchCount} branches) to ${outPath}`);
