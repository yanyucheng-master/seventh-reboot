import type { Locale } from '../../i18n';
import type { PowerChannel } from './logic';
import type { SealableMemoryAnchor } from '../types';

type MemoryCopy = {
  title: string;
  source: string;
  emotion: string;
  summary: string;
  preview: string;
  warning: string;
  fragments: [string, string, string];
  restored: string;
};

export type SpecialInteractionCopy = {
  common: {
    assist: string;
    reducedMotion: string;
    saveAndExit: string;
    continue: string;
    confirm: string;
    cancel: string;
    completed: string;
    phase: string;
  };
  password: {
    kicker: string;
    title: string;
    mission: string;
    fieldLabel: string;
    placeholder: string;
    partialPlaceholder: string;
    submit: string;
    rejected: string;
    accepted: string;
    hints: string[];
    successDetail: string;
  };
  signal: {
    kicker: string;
    title: string;
    mission: string;
    layers: Array<{ name: string; detail: string }>;
    stageTitles: string[];
    stageOrders: string[];
    targetBand: string;
    currentReading: string;
    lock: string;
    locked: string;
    outsideBand: string;
    calibrate: string;
    cleanTitle: string;
    assistedTitle: string;
    cleanDetail: string;
    assistedDetail: string;
    returnToChannel: string;
  };
  power: {
    kicker: string;
    title: string;
    mission: string;
    total: string;
    remaining: string;
    sustained: string;
    channels: Record<PowerChannel, string>;
    phases: Array<{ title: string; order: string }>;
    liveMessages: {
      lowLifeSupport: string;
      lowCommunications: string;
      lowCoreScan: string;
      stable: string[];
    };
    assistAction: string;
    excellentTitle: string;
    stableTitle: string;
    emergencyTitle: string;
    excellentDetail: string;
    stableDetail: string;
    emergencyDetail: string;
    reconnect: string;
  };
  memory: {
    sealKicker: string;
    sealTitle: string;
    sealMission: string;
    preview: string;
    select: string;
    selected: string;
    confirmTitle: string;
    confirmDetail: string;
    sealAction: string;
    restoreKicker: string;
    restoreTitle: string;
    restoreMission: string;
    fragmentStatus: string;
    restoreAction: string;
    noAnchor: string;
    memories: Record<SealableMemoryAnchor, MemoryCopy>;
  };
};

const zh: SpecialInteractionCopy = {
  common: {
    assist: '互动辅助',
    reducedMotion: '减少动态效果',
    saveAndExit: '保存并返回主菜单',
    continue: '继续通讯',
    confirm: '确认',
    cancel: '返回',
    completed: '处理完成',
    phase: '阶段',
  },
  password: {
    kicker: 'NOVA-06 / 密封记录',
    title: '联合授权密钥验证',
    mission: '外层索引已开放。密封层只接受由“本次接入编号”和“外部索引编号”共同组成的密钥。',
    fieldLabel: '四位授权密钥',
    placeholder: '____',
    partialPlaceholder: '07__',
    submit: '验证密钥',
    rejected: '好像不太对……别急，我帮你想想。',
    accepted: '联合授权成立',
    hints: [
      '好像不太对……我想想。密钥应该是两组编号拼在一起的，两段，各两位。',
      '前面那组……和这次接入有关。我们已经是第七次了吧。',
      '后面那组是你。系统从一开始就叫你 Observer-01。',
      '空格或横线没关系，它只认那四个数字。试一下 07……还有你的编号。',
    ],
    successDetail: '密封记录只开放信号分层接口，不授予第七协议或时相核心控制权限。',
  },
  signal: {
    kicker: 'OBSERVER-01 / 信号分离台',
    title: '三层信号复原',
    mission: '将当前通讯、NOVA-06 条件残留与时相核心遥测从同一载波中分离，再对齐联合时间线。',
    layers: [
      { name: '当前 Nova / 实时信号', detail: '双向链路 · 弱信号' },
      { name: 'NOVA-06 / 第六次残留', detail: '条件触发预设 · 非实时意识' },
      { name: '时相核心 / 遥测', detail: '只读数据 · 无控制通道' },
    ],
    stageTitles: ['锁定实时载频', '剥离残留相位', '抑制遥测噪声', '对齐联合时间线'],
    stageOrders: [
      '调整频率，使当前 Nova 的语音包进入稳定窗。',
      '调整相位偏移，将 NOVA-06 残留从实时信号中分离。',
      '调整增益，使时相核心遥测可读且不淹没通讯。',
      '移动时间线，让三层信号在同一事件刻度上重合。',
    ],
    targetBand: '目标稳定窗',
    currentReading: '当前读数',
    lock: '锁定本层',
    locked: '信号层已复原',
    outsideBand: '读数仍在稳定窗外。目标范围已在刻度上标记。',
    calibrate: '调用辅助校准',
    cleanTitle: '三层信号完整分离',
    assistedTitle: '三层信号已由辅助校准分离',
    cleanDetail: '实时通讯、条件残留与核心遥测均已恢复；联合时间线完成对齐。',
    assistedDetail: '系统扩大了稳定窗并补偿丢包；所有信息层仍完整保留。',
    returnToChannel: '读取分离结果',
  },
  power: {
    kicker: 'AURORA / 一次性供能代理',
    title: '应急供能路由',
    mission: 'Nova 已开放三个临时供能支路。你只能分配这一窗口内的电力，无法控制第七协议或时相核心。',
    total: '总分配',
    remaining: '窗口剩余',
    sustained: '稳定保持',
    channels: {
      lifeSupport: '生命维持',
      communications: '通讯链路',
      coreScan: '核心扫描',
    },
    phases: [
      { title: '扫描隔离门', order: '提高核心扫描，持续解析隔离门结构；通讯和生命维持必须留在安全值以上。' },
      { title: '通过低压区域', order: '空气循环正在下降。优先提高生命维持，扫描可暂时降低，通讯不能归零。' },
      { title: '抓取时相核心数据', order: '数据窗口只开放一次。核心扫描与通讯都要保持高位，生命维持不得中断。' },
    ],
    liveMessages: {
      lowLifeSupport: '生命维持低于安全值，先把空气循环稳住。',
      lowCommunications: '别把通讯关掉，我需要把数据送到你那里。',
      lowCoreScan: '扫描功率不够，数据进度停住了。',
      stable: [
        '门的结构数据出来了，扫描再维持几秒。',
        '空气循环恢复了，我正在通过低压区。',
        '数据窗口已锁定，保持住，我在发送。',
      ],
    },
    assistAction: '请求 Nova 紧急配平',
    excellentTitle: '供能路由：优秀',
    stableTitle: '供能路由：稳定',
    emergencyTitle: '供能路由：紧急辅助完成',
    excellentDetail: '三个阶段均快速进入稳定窗，临时代理未触发自动补偿。',
    stableDetail: '三个阶段均完成，电力波动被控制在安全范围内。',
    emergencyDetail: 'Nova 接管了最后的配平。目标仍全部完成，无人员伤亡或结局惩罚。',
    reconnect: '关闭临时代理并继续',
  },
  memory: {
    sealKicker: 'OBSERVER-01 / 外部记忆索引',
    sealTitle: '临时记忆容量管理',
    sealMission: '索引容量不足。请选择一枚锚点暂时封存；它不会被删除，也不会改变任何结局条件。',
    preview: '读取记忆闪回',
    select: '选择此锚点',
    selected: '已选择',
    confirmTitle: '确认临时封存',
    confirmDetail: '该锚点将在协议结束前暂时不可访问。Observer-01 仍保存索引位置，终章会在全部记忆返还前要求你亲手恢复它。',
    sealAction: '确认封存',
    restoreKicker: 'OBSERVER-01 / 临时封存区',
    restoreTitle: '恢复被封存的锚点',
    restoreMission: '封存内容已重新进入可读范围。逐一接回三个记忆片段，完成后再返还其余锚点。',
    fragmentStatus: '已接回片段',
    restoreAction: '完成锚点恢复',
    noAnchor: '未检测到临时封存锚点。索引将直接进入常规返还流程。',
    memories: {
      maintenance_board: {
        title: '贴着眼睛的漂浮维修板',
        source: '检修通道 / 恶作剧照片',
        emotion: '轻松 / 熟悉',
        summary: 'Nova 给一块漂浮维修板贴上眼睛，再把自己的乌龙拍给你看。',
        preview: '维修板慢慢漂过检修通道，两只眼睛正对着镜头。Nova 把它称作“宇宙级威胁”。',
        warning: '暂时封存后，这张维修板照片会保持熟悉却无法辨认，直到终章手动恢复。',
        fragments: ['漂过通道的维修板', 'Nova 亲手贴上的眼睛', '“宇宙级威胁”'],
        restored: '那双眼睛重新清晰起来。Nova 终于想起，这场乌龙从头到尾都是她自己的恶作剧。',
      },
      white_flower: {
        title: '不该开放的小白花',
        source: '维护舱 / 水培槽',
        emotion: '希望 / 不安',
        summary: '在不适合生长的地方活下来的花，被 Nova 当作一件很小却很重要的证据。',
        preview: '营养液早已浑浊，花瓣却还贴着微弱的灯光。Nova 说，它不该活下来，但它还是开了。',
        warning: '暂时封存后，小白花的情景索引会保持沉默，直到终章手动恢复。',
        fragments: ['浑浊的营养液', '贴着灯光的花瓣', '“它还是开了”'],
        restored: '那一点白色重新浮现。脆弱并没有让它变得不真实。',
      },
      goodnight: {
        title: '被认真接住的晚安',
        source: '加密通讯 / 深夜记录',
        emotion: '陪伴 / 依恋',
        summary: '一条没有任务价值的短讯，却证明她曾在最普通的时刻被人陪伴。',
        preview: '信道已经很安静。她停了很久才说晚安，而另一端没有让这句话落空。',
        warning: '暂时封存后，这句晚安的听觉索引会保持沉默，直到终章手动恢复。',
        fragments: ['深夜信道的底噪', 'Nova 很轻的一次停顿', '没有落空的晚安'],
        restored: '那句晚安回来了。她记得的不是词本身，而是有人还在。',
      },
    },
  },
};

const en: SpecialInteractionCopy = {
  common: {
    assist: 'Interaction assist',
    reducedMotion: 'Reduce motion',
    saveAndExit: 'Save and return to menu',
    continue: 'Continue transmission',
    confirm: 'Confirm',
    cancel: 'Back',
    completed: 'Operation complete',
    phase: 'Phase',
  },
  password: {
    kicker: 'NOVA-06 / SEALED RECORD',
    title: 'Joint authorization key',
    mission: 'The outer index is open. The sealed layer accepts only a key formed from the current link number and the external index number.',
    fieldLabel: 'Four-digit authorization key',
    placeholder: '____',
    partialPlaceholder: '07__',
    submit: 'Verify key',
    rejected: "That isn't quite right... Wait. Let me help you remember.",
    accepted: 'Joint authorization confirmed',
    hints: [
      "That isn't quite right... Give me a second. I think the key is two pairs — two digits, then two more.",
      "The first pair is about this link. We're already on the seventh one, right?",
      "The second pair is you. It's called you Observer-01 from the start.",
      "Spaces and dashes don't matter — only those four digits. Try 07... and your number.",
    ],
    successDetail: 'The seal exposes only the signal-layer interface. It grants no control over the Seventh Protocol or the phase core.',
  },
  signal: {
    kicker: 'OBSERVER-01 / SIGNAL SEPARATOR',
    title: 'Three-layer signal recovery',
    mission: 'Separate the live transmission, the conditional NOVA-06 residual, and phase-core telemetry from one carrier, then align their shared timeline.',
    layers: [
      { name: 'Current Nova / live signal', detail: 'Two-way link · weak carrier' },
      { name: 'NOVA-06 / sixth-cycle residual', detail: 'Conditional preset · not a live consciousness' },
      { name: 'Phase core / telemetry', detail: 'Read-only data · no control channel' },
    ],
    stageTitles: ['Lock live carrier', 'Separate residual phase', 'Suppress telemetry noise', 'Align shared timeline'],
    stageOrders: [
      "Adjust frequency until the current Nova's voice packets enter the stable band.",
      'Adjust phase offset to separate the NOVA-06 residual from the live signal.',
      'Adjust gain until phase-core telemetry is readable without drowning the transmission.',
      'Move the timeline until all three layers share the same event marker.',
    ],
    targetBand: 'Target band',
    currentReading: 'Current reading',
    lock: 'Lock layer',
    locked: 'Signal layer recovered',
    outsideBand: 'The reading remains outside the stable band. Its range is marked on the scale.',
    calibrate: 'Run assisted calibration',
    cleanTitle: 'All three layers separated',
    assistedTitle: 'All three layers separated with calibration assist',
    cleanDetail: 'Live transmission, conditional residual, and core telemetry are recovered; shared timeline alignment is complete.',
    assistedDetail: 'The system widened the stable band and compensated for packet loss. Every information layer remains intact.',
    returnToChannel: 'Read separated signal',
  },
  power: {
    kicker: 'AURORA / ONE-TIME POWER PROXY',
    title: 'Emergency power routing',
    mission: 'Nova has opened three temporary power branches. You can allocate only this window; you cannot control the Seventh Protocol or the phase core.',
    total: 'Total allocation',
    remaining: 'Window remaining',
    sustained: 'Stable hold',
    channels: {
      lifeSupport: 'Life support',
      communications: 'Communications',
      coreScan: 'Core scan',
    },
    phases: [
      { title: 'Scan the isolation gate', order: 'Raise core scanning and sustain the structural read; communications and life support must remain safe.' },
      { title: 'Cross the low-pressure section', order: 'Air circulation is falling. Prioritize life support; scanning can dip, but communications cannot reach zero.' },
      { title: 'Capture phase-core data', order: 'The data window opens once. Keep scanning and communications high without dropping life support.' },
    ],
    liveMessages: {
      lowLifeSupport: 'Life support is below the safe line. Stabilize air circulation first.',
      lowCommunications: "Don't shut communications down. I need to send the data to you.",
      lowCoreScan: 'Scan power is too low. Data progress has stopped.',
      stable: [
        'The gate structure is resolving. Hold the scan a few more seconds.',
        "Air circulation is back. I'm crossing the low-pressure section.",
        "Data window locked. Hold it there — I'm transmitting.",
      ],
    },
    assistAction: 'Request Nova emergency balance',
    excellentTitle: 'Power routing: excellent',
    stableTitle: 'Power routing: stable',
    emergencyTitle: 'Power routing: emergency assist complete',
    excellentDetail: 'All three phases entered their stable bands quickly without automatic compensation.',
    stableDetail: 'All three phases completed and power variance remained within safe limits.',
    emergencyDetail: 'Nova completed the final balance. Every objective was met, with no casualty or ending penalty.',
    reconnect: 'Close proxy and continue',
  },
  memory: {
    sealKicker: 'OBSERVER-01 / EXTERNAL MEMORY INDEX',
    sealTitle: 'Temporary memory capacity',
    sealMission: 'Index capacity is insufficient. Temporarily seal one anchor. It will not be deleted and cannot alter an ending condition.',
    preview: 'Read memory flash',
    select: 'Select this anchor',
    selected: 'Selected',
    confirmTitle: 'Confirm temporary seal',
    confirmDetail: 'This anchor will remain temporarily inaccessible until the protocol ends. Observer-01 will retain its location, and you will restore it by hand before the remaining memories return.',
    sealAction: 'Confirm seal',
    restoreKicker: 'OBSERVER-01 / TEMPORARY SEAL',
    restoreTitle: 'Restore sealed anchor',
    restoreMission: 'The sealed memory is readable again. Reconnect all three fragments before the remaining anchors are returned.',
    fragmentStatus: 'Fragments reconnected',
    restoreAction: 'Complete anchor restoration',
    noAnchor: 'No temporary anchor was found. The index will continue to the standard return sequence.',
    memories: {
      maintenance_board: {
        title: 'The floating panel with eyes',
        source: 'Maintenance passage / prank photo',
        emotion: 'Lightness / familiarity',
        summary: 'Nova stuck eyes on a drifting maintenance panel, then sent you a photo of her own false alarm.',
        preview: 'The panel drifts through the passage with two eyes facing the camera. Nova calls it a “space-grade threat.”',
        warning: 'The photo will feel familiar but remain unrecognizable until you restore it in the finale.',
        fragments: ['A panel drifting through the passage', 'The eyes Nova stuck on it', '“Space-grade threat”'],
        restored: 'The eyes become clear again. Nova finally remembers that the entire false alarm was her own prank.',
      },
      white_flower: {
        title: 'The white flower that should not bloom',
        source: 'Maintenance bay / hydroponic tray',
        emotion: 'Hope / unease',
        summary: 'A flower surviving where it should not, kept by Nova as a small but important piece of evidence.',
        preview: 'The nutrient water is cloudy, yet the petals still lean into the weak lamp. Nova says it should not have lived, but it bloomed.',
        warning: "The flower's scene index will remain silent until you restore it in the finale.",
        fragments: ['Clouded nutrient water', 'Petals leaning into the lamp', '“It bloomed anyway”'],
        restored: 'That point of white returns. Fragility never made it less real.',
      },
      goodnight: {
        title: 'The goodnight someone caught',
        source: 'Encrypted channel / late-night record',
        emotion: 'Companionship / attachment',
        summary: 'A message with no mission value that proves she was accompanied in an ordinary moment.',
        preview: 'The channel is nearly silent. She pauses before saying goodnight, and the person at the other end does not let it fall unanswered.',
        warning: "The goodnight's auditory index will remain silent until you restore it in the finale.",
        fragments: ['The noise floor of a late channel', "Nova's quiet pause", 'A goodnight that did not fall away'],
        restored: 'The goodnight returns. What she remembers is not the word, but that someone was still there.',
      },
    },
  },
};

export function getSpecialInteractionCopy(locale: Locale): SpecialInteractionCopy {
  return locale === 'en-US' ? en : zh;
}
