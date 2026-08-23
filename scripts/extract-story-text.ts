import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { storyNodes } from '../src/game/story.ts';
import type { StoryNode } from '../src/game/story.ts';
import { getEpilogueNodes, type EpilogueKind } from '../src/game/epilogues.ts';
import { getSpecialInteractionCopy } from '../src/game/interactions/copy.ts';
import { encodeStorySource } from './story-source-format.ts';

const VERSION = 'V1.0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', '第七次重启-剧情文本.txt');
const epilogueOutPath = path.join(__dirname, '..', '第七次重启-可选后记.txt');

const speakerLabel: Record<string, string> = {
  nova: 'Nova',
  system: '系统',
  player: '玩家',
  observer: '无来源',
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
  'internal-chapter-marker': '内部章节标记',
  'internal-ending-marker': '内部结局标记',
  'observer-echo': '观察者残响',
  'ending-title': '结局标题',
  'title-state': '标题状态',
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
  'CH03-0180',
  'CH05A-0067',
  'CH05A-0070',
  'CH05B-0080',
  'CH05B-0276',
]);

const internalEndingHeadings: Record<string, string> = {
  'END-N-0001': '普通结局：循环之外',
  'END-B-0001': '坏结局：第八次重启',
};

function parsePipeContent(content: string): { title: string; body: string } {
  const idx = content.indexOf('||');
  if (idx === -1) return { title: '', body: content };
  return { title: content.slice(0, idx), body: content.slice(idx + 2) };
}

function formatMeta(node: StoryNode): string[] {
  const meta: string[] = [];
  if (node.type === 'internal-chapter-marker') {
    meta.push('仅内部结构、稳定检查点与测试使用', '正常游玩不显示');
  }
  if (node.type === 'internal-ending-marker') {
    meta.push('正常游玩不显示章节扉页', '直接进入结局演出');
  }
  if (node.type === 'observer-echo') {
    meta.push('仅 Observer-01 显示', '无头像', '无昵称', '无气泡', '无时间戳', '无系统提示', '不入聊天历史', '不被 Nova 与第七协议察觉', '浮现后消散');
  }
  if (node.type === 'title-state') {
    meta.push('持久化标题=第八次重启', '使用正式中英文第八次标题资产', '禁止文字重影与持续频闪', '仅保留标题原生飘散粒子', '禁止继续失败节点', '返回标题界面');
  }
  if (node.image) meta.push(`图片=${node.image}`);
  if (node.delay !== undefined) meta.push(`延迟=${node.delay}ms`);
  if (node.isGlitch) meta.push('故障效果');
  if (node.glitchLevel) meta.push(`故障等级=${node.glitchLevel}`);
  if (node.memoryAnchor) meta.push(`记忆锚点=${node.memoryAnchor}`);
  if (node.requiresAnchor) meta.push(`需要锚点=${node.requiresAnchor}`);
  if (node.contactStage) meta.push(`联系人阶段=${node.contactStage}`);
  if (node.displayName) meta.push(`显示名称=${node.displayName}`);
  if (node.speakerIdentity) meta.push(`说话身份=${node.speakerIdentity}`);
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
  if (node.timeoutNextId) {
    meta.push(`${node.interactionKind ? '超时结果' : '超时跳转'}=${node.timeoutNextId}`);
  }
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
  if (node.interactionStage) meta.push(`阶段=${node.interactionStage}`);
  if (node.interactionNextIds) {
    const routes = Object.entries(node.interactionNextIds)
      .map(([result, nextId]) => `${result}:${nextId}`)
      .join(',');
    meta.push(`结果跳转=${routes}`);
  }
  if (node.interactionAttempt) meta.push(`尝试=${node.interactionAttempt}`);
  if (node.interactionPrerequisite) {
    meta.push(`前置状态=${node.interactionPrerequisite.key}:${String(node.interactionPrerequisite.value)}`);
  }
  if (node.interactionCondition) {
    meta.push(`条件结果=${node.interactionCondition.kind}:${node.interactionCondition.routeKey}`);
  }
  if (node.conditionElseNextId) meta.push(`不满足则跳转=${node.conditionElseNextId}`);
  if (node.directCondition && node.directConditionNextId) {
    meta.push(`若 ${node.directCondition.key}=${String(node.directCondition.value)} 则直接跳转 ${node.directConditionNextId}`);
  }
  if (node.stateWrites) {
    Object.entries(node.stateWrites).forEach(([key, value]) => meta.push(`${key}=${String(value)}`));
  }
  if (node.dynamicNextKey) meta.push(`动态跳转=${node.dynamicNextKey}`);
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

  if (node.type === 'internal-chapter-marker' || node.type === 'ending-title') {
    lines.push(`## ${node.content}`);
    lines.push(`[${node.id}] (${sp}/${tp})`);
    if (meta.length) lines.push(`  meta: ${meta.join(' | ')}`);
    if (node.nextId) lines.push(`  next: ${node.nextId}`);
    lines.push('');
    return lines;
  }

  if (node.type === 'internal-ending-marker') {
    const heading = internalEndingHeadings[node.id];
    if (heading) lines.push(`## ${heading}`);
    lines.push(`[${node.id}] (${sp}/${tp})`);
    if (meta.length) lines.push(`  meta: ${meta.join(' | ')}`);
    if (node.content) lines.push(node.content);
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
        ch.trustDelta !== undefined ? `信任变化=${ch.trustDelta}` : '',
        ch.memoryDelta !== undefined ? `记忆变化=${ch.memoryDelta}` : '',
        ch.attachmentDelta !== undefined ? `依恋变化=${ch.attachmentDelta}` : '',
        ch.acceptFarewell !== undefined ? `接受告别=${ch.acceptFarewell}` : '',
        ch.finalChoice ? `最终选择=${ch.finalChoice}` : '',
        ch.timedResponse ? `限时演出=${ch.timedResponse}` : '',
        ch.timedProof ? `限时证明=${ch.timedProof}` : '',
        ch.finalFarewellTone ? `告别语气=${ch.finalFarewellTone}` : '',
        ch.relationshipStrainDelta ? `关系裂痕+${ch.relationshipStrainDelta}` : '',
        ch.n7ProofSucceeded !== undefined ? `N7证明=${ch.n7ProofSucceeded}` : '',
        ch.firstMessageCorrect !== undefined ? `首句回答正确=${ch.firstMessageCorrect}` : '',
        ch.visibilityCondition ? `可见条件=${ch.visibilityCondition}` : '',
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
const interactionKindCount = new Set(interactionNodes.map(node => node.interactionKind)).size;
const zhCopy = getSpecialInteractionCopy('zh-CN');

function formatInteractionAppendix(): string[] {
  const lines: string[] = [
    '',
    '---',
    '',
    '# 附录：七类正式特殊互动（运行时 UI 文案）',
    '',
    `说明：全篇共 ${interactionKindCount} 类正式特殊互动、${interactionNodes.length} 个运行时挂点。供能路由包含首次、最终与受损第七次三个状态挂点。`,
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
  lines.push('## 1. 观测室隔离与手动均压（bulkhead-isolation）');
  lines.push(`标题：${zhCopy.bulkhead.title}`);
  lines.push(`任务：${zhCopy.bulkhead.mission}`);
  lines.push('现场数据：观测室 71 kPa / 过渡舱 84 kPa（LIVE-07）/ 主走廊 101 kPa');
  lines.push(`Nova 指令：${zhCopy.bulkhead.instruction}`);
  lines.push(`结果 safe：${zhCopy.bulkhead.safeTitle} / ${zhCopy.bulkhead.safeDetail}`);
  lines.push(`结果 injured：${zhCopy.bulkhead.injuredTitle} / ${zhCopy.bulkhead.injuredDetail}`);
  lines.push(`结果 fatal 或 timeout：${zhCopy.bulkhead.fatalTitle} / 进入第八次重启坏结局链`);

  lines.push('');
  lines.push('## 2. 密封记录顺序校验（sealed-record-order）');
  lines.push('任务：按“写入者 → 读取者”的顺序提交 NOVA-06 与 NOVA-07 两枚导航签名。');
  lines.push('正确顺序：NOVA-06 → NOVA-07。');
  lines.push('限制：无致死倒计时；顺序错误只返回记录提示；不消耗 NOVA-06 一次性回退授权。');

  lines.push('');
  lines.push('## 3. 一次性供能路由（power-routing）');
  lines.push(`标题：${zhCopy.power.title}`);
  lines.push(`任务：${zhCopy.power.mission}`);
  lines.push('通道：');
  (Object.entries(zhCopy.power.channels) as Array<[string, string]>).forEach(([key, label]) => {
    lines.push(`- ${key}：${label}`);
  });
  lines.push('两阶段安全下限：');
  (Object.entries(zhCopy.power.stages) as Array<[string, { title: string; order: string }]>).forEach(([id, stage]) => {
    lines.push(`- ${id}：${stage.title} — ${stage.order}`);
  });
  lines.push(`第一次成功：${zhCopy.power.firstSuccessTitle} / NOVA-06 权限未使用并立即失效`);
  lines.push(`第一次失败：${zhCopy.power.failureTitle} / 显示真实后果后执行一次性回退并写入存档`);
  lines.push(`第二次成功：${zhCopy.power.retrySuccessTitle}`);
  lines.push(`第二次失败或超时：${zhCopy.power.fatalTitle} / 不再回退，进入第八次重启坏结局链`);

  lines.push('');
  lines.push('## 4. 临时记忆容量管理（memory-seal）');
  lines.push(`标题：${zhCopy.memory.sealTitle}`);
  lines.push(`说明：${zhCopy.memory.sealMission}`);
  lines.push('可选锚点：');
  (Object.entries(zhCopy.memory.memories) as Array<[string, { title: string; summary: string; warning: string; restored: string }]>).forEach(([id, memory]) => {
    lines.push(`- ${id}：${memory.title}`);
    lines.push(`  摘要：${memory.summary}`);
    lines.push(`  封存影响：${memory.warning}`);
  });

  lines.push('');
  lines.push('## 5. 航线写入锁定（course-lock）');
  lines.push('任务：依据第六次航线包避开 S-7 相位共振区，并完成最终航线写入。');
  lines.push('安全规则：普通错误不提交并进入重试；只有主动确认穿越红色核心区或超时才进入致死分支。');

  lines.push('');
  lines.push('## 6. 第七协议物理隔离（protocol-cut）');
  lines.push('任务：在新航线保持写入的同时，持续按住隔离控制，切断 PHASE-CORE BUS B。');
  lines.push('安全规则：松手会中止本次切断但不会自动判死；倒计时耗尽才进入致死分支。');

  lines.push('');
  lines.push('## 7. 临时封存锚点恢复（memory-restore）');
  lines.push(`标题：${zhCopy.memory.restoreTitle}`);
  lines.push(`说明：${zhCopy.memory.restoreMission}`);
  lines.push(`错误组反馈：${zhCopy.memory.restoreMismatch}`);
  (Object.entries(zhCopy.memory.memories) as Array<[string, { title: string; restored: string }]>).forEach(([id, memory]) => {
    lines.push(`- ${id} / ${memory.title}：${memory.restored}`);
  });

  lines.push('');
  lines.push('## 运行时约束');
  lines.push('- 第一、第二、第四章不含正式特殊互动。');
  lines.push('- 密封记录顺序校验不会修改 NOVA-06 一次性回退状态。');
  lines.push('- 第一次供能失败时先落盘 nova06RollbackAuthorizationUsed=true，再播放后果与一次性回退剧情。');
  lines.push('- 均压 fatal 与最终供能、航线锁定、协议隔离 fatal 均进入 REBOOT 08 坏结局链。');
  lines.push('- 记忆封存不修改 Trust、Memory、Attachment 或结局判定。');
  lines.push('- 人工重力降级只表现能源重分配后果，不替代舱压、空气循环或生命维持判定。');

  lines.push('');
  return lines;
}

const output = [
  `# 第七次重启 · V1.0 主流程运行时导出`,
  `版本：${VERSION}`,
  `主流程节点数：${storyNodes.length}`,
  `正式特殊互动：${interactionKindCount} 类`,
  `特殊互动运行时挂点：${interactionNodes.length}`,
  `生成时间：${new Date().toISOString().replace(/\.\d{3}Z$/, '')}`,
  ``,
  `说明：本文档由运行时 story.ts 自动导出，仅包含正式主流程；可选后记由独立文件维护，不属于一周目自动播放链。`,
  `真源说明：中文剧情唯一维护源为 story-source/main.zh-CN.txt；本文档仅供阅读与审计，不得作为反向生成源。`,
  `沉浸式界面说明：章节与结局入口仅保留为内部结构边界，正常游玩不显示章节扉页；正式结局标题使用独立演出。`,
  `观察者残响说明：第二章离线后仅向 Observer-01 显示一次“还给对方一颗”，不写入聊天历史或已读记录。`,
  `静态草稿说明：未发送草稿、加密草稿与牛奶糖异常草稿链已从运行时及档案中删除。`,
  `特殊互动修订说明：全篇固定为观测室均压、密封记录顺序校验、一次性供能路由、记忆封存、航线锁定、协议隔离与终章记忆恢复七类；旧三层信号分离与密码输入式联合密钥已移除。`,
  `人工重力说明：Aurora 使用分区式人工重力阵列；生活区标称 0.78g、正常波动 0.75—0.80g，低优先级区域通常为 0.15—0.40g。高潮能源重分配后生活区降至 0.46g、维护层降至 0.18g、非必要舱段关闭。重力与舱压、空气循环、生命维持相互独立。`,
  `风险分支说明：第三章均压失败或超时、第五章供能最终失败或超时，以及拒绝关闭第七协议导致的回溯，均会进入“第八次重启”。`,
  `状态说明：均压受伤、密封记录开放、一次性回退、供能尝试与失败原因、封存/恢复锚点、航线锁定、协议隔离、稳定检查点及 REBOOT 08 均写入 V1.0 内部存档状态。`,
  `分支格式：[选项字母] → 选项文本 → 下一节点ID`,
  ``,
  `---`,
  ``,
  ...bodyLines,
  ...formatInteractionAppendix(),
].join('\n') + '\n';

function formatEpilogue(kind: EpilogueKind): string[] {
  const title = kind === 'normal'
    ? '## 普通结局《循环之外》· 可选后记'
    : '## 真结局 · 可选后记';
  const lines = [title];
  for (const node of getEpilogueNodes(kind)) {
    lines.push(`[${node.id}] (系统/后记)`);
    lines.push(node.content);
    lines.push(`meta: 延迟=${node.delay}ms`);
    lines.push(`next: ${node.nextId}`);
  }
  return lines;
}

const epilogueOutput = [
  '# 第七次重启 · 可选后记',
  `版本：${VERSION}`,
  `后记节点数：${getEpilogueNodes('normal').length + getEpilogueNodes('true').length}`,
  '说明：本文件仅供通关后的档案阅读模式使用，不得接回一周目主流程。',
  '',
  ...formatEpilogue('normal'),
  '',
  ...formatEpilogue('true'),
  '',
].join('\n');

const encodedOutput = encodeStorySource(output);
const encodedEpilogueOutput = encodeStorySource(epilogueOutput);
fs.writeFileSync(outPath, encodedOutput);
fs.writeFileSync(epilogueOutPath, encodedEpilogueOutput);

const lineCount = output.split('\n').length;
const choiceCount = storyNodes.filter(n => n.choices?.length).length;
const branchCount = storyNodes.reduce((sum, n) => sum + (n.choices?.length ?? 0), 0);

console.log(`Wrote ${storyNodes.length} nodes (${lineCount} lines, ${choiceCount} choice nodes, ${branchCount} branches, ${interactionNodes.length} interactions)`);
console.log(`- ${outPath}`);
console.log(`Wrote ${getEpilogueNodes('normal').length + getEpilogueNodes('true').length} optional epilogue nodes`);
console.log(`- ${epilogueOutPath}`);
