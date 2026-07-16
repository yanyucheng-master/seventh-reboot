import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { storyNodes } from '../src/game/story.ts';
import type { StoryNode } from '../src/game/story.ts';
import { getSpecialInteractionCopy } from '../src/game/interactions/copy.ts';
import { encodeStorySource } from './story-source-format.ts';

const VERSION = 'V1.0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', '第七次重启-剧情文本.txt');
const projectOutPath = path.join(__dirname, '..', '..', '第七次重启_剧情文本_V1_0_航线因果闭环与自然语言精修版.txt');

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
  if (node.image) meta.push(`图片=${node.image}`);
  if (node.isGlitch) meta.push('故障效果');
  if (node.glitchLevel) meta.push(`故障等级=${node.glitchLevel}`);
  if (node.memoryAnchor) meta.push(`记忆锚点=${node.memoryAnchor}`);
  if (node.requiresAnchor) meta.push(`需要锚点=${node.requiresAnchor}`);
  if (node.contactStage) meta.push(`联系人阶段=${node.contactStage}`);
  if (node.deliveryEvent) meta.push(`投递事件=${node.deliveryEvent}`);
  if (node.displayOptionContext) meta.push(`显示选项=${node.displayOptionContext}`);
  if (node.archiveEntry) meta.push(`归档入口=${node.archiveEntry}`);
  if (node.externalEntry) meta.push(`外部入口=${node.externalEntry}`);
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
  if (node.interactionKind) meta.push(`特殊互动=${node.interactionKind}`);
  if (node.interactionNextIds) {
    const routes = Object.entries(node.interactionNextIds)
      .map(([result, nextId]) => `${result}:${nextId}`)
      .join(',');
    meta.push(`结果跳转=${routes}`);
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

const interactionNodes = storyNodes.filter(
  node => node.type === 'interaction' && Boolean(node.interactionKind),
);
const zhCopy = getSpecialInteractionCopy('zh-CN');

function formatInteractionAppendix(): string[] {
  const lines: string[] = [
    '',
    '---',
    '',
    '# 附录：特殊互动模块（运行时 UI 文案）',
    '',
    '说明：以下文案对应互动界面本身，不改变剧情节点拓扑；完成结果通过 interactionNextIds 回到对应剧情分支。',
    '',
    '## 互动挂点一览',
    '',
  ];

  for (const node of interactionNodes) {
    const routes = node.interactionNextIds
      ? Object.entries(node.interactionNextIds).map(([key, nextId]) => `${key}→${nextId}`).join('；')
      : (node.nextId ? `默认→${node.nextId}` : '无');
    lines.push(`- [${node.id}] ${node.interactionKind ?? 'unknown'} · ${node.content || '(无标题)'} · 结果：${routes}`);
  }

  lines.push('');
  lines.push('## 1. 联合授权密钥验证（critical-log-password）');
  lines.push(`标题：${zhCopy.password.title}`);
  lines.push(`任务：${zhCopy.password.mission}`);
  lines.push(`成功：${zhCopy.password.successDetail}`);
  lines.push(`失败反馈：${zhCopy.password.rejected}`);

  lines.push('');
  lines.push('## 2. 三层信号复原（signal-separation）');
  lines.push(`标题：${zhCopy.signal.title}`);
  lines.push(`任务：${zhCopy.signal.mission}`);
  lines.push('信号层：');
  zhCopy.signal.layers.forEach(layer => lines.push(`- ${layer.name}：${layer.detail}`));
  lines.push('阶段：');
  zhCopy.signal.stageTitles.forEach((title, index) => {
    lines.push(`- ${index + 1}. ${title} — ${zhCopy.signal.stageOrders[index] ?? ''}`);
  });
  lines.push(`结果 clean：${zhCopy.signal.cleanTitle} / ${zhCopy.signal.cleanDetail}`);
  lines.push(`结果 assisted：${zhCopy.signal.assistedTitle} / ${zhCopy.signal.assistedDetail}`);

  lines.push('');
  lines.push('## 3. 应急供能路由（power-routing）');
  lines.push(`标题：${zhCopy.power.title}`);
  lines.push(`任务：${zhCopy.power.mission}`);
  lines.push('通道：');
  (Object.entries(zhCopy.power.channels) as Array<[string, string]>).forEach(([key, label]) => {
    lines.push(`- ${key}：${label}`);
  });
  lines.push('阶段：');
  zhCopy.power.phases.forEach((phase, index) => {
    lines.push(`- ${index + 1}. ${phase.title} — ${phase.order}`);
  });
  lines.push(`结果 excellent：${zhCopy.power.excellentTitle} / ${zhCopy.power.excellentDetail}`);
  lines.push(`结果 stable：${zhCopy.power.stableTitle} / ${zhCopy.power.stableDetail}`);
  lines.push(`结果 emergency_assist：${zhCopy.power.emergencyTitle} / ${zhCopy.power.emergencyDetail}`);

  lines.push('');
  lines.push('## 4. 临时记忆容量管理（memory-seal / memory-restore）');
  lines.push(`封存标题：${zhCopy.memory.sealTitle}`);
  lines.push(`封存说明：${zhCopy.memory.sealMission}`);
  lines.push(`恢复标题：${zhCopy.memory.restoreTitle}`);
  lines.push(`恢复说明：${zhCopy.memory.restoreMission}`);
  lines.push('可选锚点：');
  (Object.entries(zhCopy.memory.memories) as Array<[string, { title: string; summary: string; warning: string; restored: string }]>).forEach(([id, memory]) => {
    lines.push(`- ${id}：${memory.title}`);
    lines.push(`  摘要：${memory.summary}`);
    lines.push(`  封存影响：${memory.warning}`);
    lines.push(`  终章恢复：${memory.restored}`);
  });

  lines.push('');
  return lines;
}

const output = [
  `# 第七次重启 · 剧情文本导出`,
  `版本：${VERSION}`,
  `节点数：${storyNodes.length + 1}`,
  `特殊互动节点：${interactionNodes.length}`,
  `生成时间：${new Date().toISOString().replace(/\.\d{3}Z$/, '')}`,
  ``,
  `说明：本文档由运行时 story.ts 自动导出，包含全部剧情节点、选项分支、系统消息、章节、后记、结局、记忆锚点、文件与图片说明，以及特殊互动模块附录。`,
  `修订说明：本版在格式统一校对版基础上，重点强化第五章真相揭露阶段的玩家参与感，新增多选项与限时选项，压缩部分连续解释段，让系统文件负责证据、Nova负责情绪、玩家负责回应。`,
  `深度审查修订说明：本版依据完整剧情深度审查结果，修复 N7 草稿矛盾、第二章梦境旧稿残留、第三章小白花/雨声/观测窗逻辑串线、第三章梦中警告前后冲突、第四章双重认证解释不完整、第五章 Observer-01 索引说明歧义，并补充关键伦理回应选项。`,
  `逻辑闭环修订说明：本版进一步修复断链、媒介跳跃、玩家遗忘机制、NOVA-06 残影能力、导航连续性签名、外部索引释放权限、终章记忆范围及三类结局交互矛盾。`,
  `时相核心修订说明：本版新增“深空航行稳定核心”的公开伪装、“局部时相锚定核心”的隐藏实体、时相锚及回溯执行链，并完成全篇逐句复审。`,
  `特殊互动修订说明：本版正式加入联合密钥验证、三层信号分离、一次性供能路由、临时记忆封存及终章恢复；所有结果仅改变邻近台词与日志，不改变结局条件。`,
  `分支格式：[选项字母] → 选项文本 → 下一节点ID`,
  ``,
  `---`,
  ``,
  ...bodyLines,
  ...formatInteractionAppendix(),
].join('\n') + '\n';

const encodedOutput = encodeStorySource(output);
fs.writeFileSync(outPath, encodedOutput);
fs.writeFileSync(projectOutPath, encodedOutput);

const lineCount = output.split('\n').length;
const choiceCount = storyNodes.filter(n => n.choices?.length).length;
const branchCount = storyNodes.reduce((sum, n) => sum + (n.choices?.length ?? 0), 0);

console.log(`Wrote ${storyNodes.length} nodes (${lineCount} lines, ${choiceCount} choice nodes, ${branchCount} branches, ${interactionNodes.length} interactions)`);
console.log(`- ${outPath}`);
console.log(`- ${projectOutPath}`);
