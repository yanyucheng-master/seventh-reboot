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
  interaction: '交互',
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

const unindentedFileTitleNodeIds = new Set([
  'ch3_log1b',
  'ch5a_protocol1',
  'ch5a_protocol2',
  'ch5b_file10',
  'ch5b_fin2',
]);

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
  if (node.recordVariable) meta.push(`记录变量=${node.recordVariable}`);
  if (node.inputAutoFocus) meta.push('自动聚焦=true');
  if (node.inputVariable) meta.push(`输入变量=${node.inputVariable}`);
  if (node.inputMinLength !== undefined || node.inputMaxLength !== undefined) {
    meta.push(`长度=${node.inputMinLength ?? 0}-${node.inputMaxLength ?? '?'}`);
  }
  if (node.specialInputNextIds) {
    Object.entries(node.specialInputNextIds).forEach(([value, nextId]) => {
      meta.push(`特殊值${value}=${nextId}`);
    });
  }
  return meta;
}

function formatNode(node: StoryNode): string[] {
  const lines: string[] = [];
  const sp = speakerLabel[node.speaker] ?? node.speaker;
  const tp = node.type === 'input' && node.choiceTimeoutMs ? '限时输入' : typeLabel[node.type] ?? node.type;
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
    if (title) {
      const prefix = unindentedFileTitleNodeIds.has(node.id) ? '' : '  ';
      lines.push(`${prefix}文件标题: ${title}`);
    }
    if (body) lines.push(body);
  } else if (node.type === 'draft' && node.content) {
    const { title, body } = parsePipeContent(node.content);
    if (title) lines.push(`  草稿标题: ${title}`);
    if (body) lines.push(body);
  } else if (node.type === 'input') {
    if (node.content) lines.push(node.content);
    if (node.nextId) {
      lines.push(`  [提交] → ${node.inputSubmitText ?? '【输入内容】'}  →  ${node.nextId}`);
    }
    if (node.choiceTimeoutMs || node.timeoutNextId) {
      lines.push(`  ※ 限时输入：${node.choiceTimeoutMs ?? '?'}ms，超时 → ${node.timeoutNextId ?? '?'}`);
    }
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

  if (node.nextId && node.type !== 'input') lines.push(`  next: ${node.nextId}`);
  lines.push('');
  return lines;
}

const bodyLines: string[] = [];
for (const node of storyNodes) {
  bodyLines.push(...formatNode(node));
}
bodyLines.push('[MENU] (系统/菜单)');
bodyLines.push('返回主菜单');

const output = [
  `# 第七次重启 · 剧情文本导出`,
  `版本：${VERSION}`,
  `节点数：${storyNodes.length + 1}`,
  `生成时间：${new Date().toISOString().replace(/\.\d{3}Z$/, '')}`,
  ``,
  `说明：本文档由 story.ts 自动导出格式整理，包含全部节点、选项分支、系统消息、章节、后记、结局、记忆锚点、文件与图片说明。`,
  `修订说明：本版完成主题级结构重写。情感层保留“被记住的幸福”，价值层调整为“记忆必须经过双方同意”；前置外部通讯覆盖规则，强化Nova-06对选项与锚点的主动操控，并将终章改为记忆授权、索引释放与限时姓名输入。`,
  `核心规则：玩家以现实身份接入疑似平行世界。第七协议仅回溯Aurora号；每次循环会覆盖同一外部时间窗口中的旧通讯历史。Observer-01位于通讯夹层，只保存被覆盖的记录残片，不能修改玩家意识。协议关闭后玩家不会被强制失忆，但失去一切外部证据，只能依靠普通人的记忆与双方自愿留下的检索钥匙。`,
  `分支格式：[选项字母] → 选项文本 → 下一节点ID`,
  ``,
  `---`,
  ``,
  ...bodyLines,
].join('\n') + '\n';

fs.writeFileSync(outPath, output, 'utf8');

const lineCount = output.split('\n').length;
const choiceCount = storyNodes.filter(n => n.choices?.length).length;
const branchCount = storyNodes.reduce((sum, n) => sum + (n.choices?.length ?? 0), 0);

console.log(`Wrote ${storyNodes.length} nodes (${lineCount} lines, ${choiceCount} choice nodes, ${branchCount} branches) to ${outPath}`);
