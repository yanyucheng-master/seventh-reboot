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

/** 接管后玩家的一次轻量回应；只改变邻近台词，不影响数值和结局 */
type OverrideReply = {
  text: string;
  ack: string;
};

/** NOVA-06 残留签名越权接管的通用演出文案 */
type Nova06SequenceCopy = {
  precursorLines: [string, string, string];
  unauthorized: string;
  source: string;
  unknownTag: string;
  signatureTag: string;
  firstLine: string;
  scriptExecuted: string;
  lightIntro: string;
  continue: string;
};

export type SpecialInteractionCopy = {
  common: {
    reducedMotion: string;
    saveAndExit: string;
    continue: string;
    confirm: string;
    cancel: string;
    completed: string;
    phase: string;
  };
  nova06: Nova06SequenceCopy;
  password: {
    kicker: string;
    title: string;
    mission: string;
    fieldLabel: string;
    placeholder: string;
    submit: string;
    rejected: string;
    accepted: string;
    successDetail: string;
    novaHints: { first: string; second: string };
    override: {
      unknownLines: string[];
      systemLines: string[];
      novaReactions: string[];
      replies: [OverrideReply, OverrideReply, OverrideReply];
      resultTitle: string;
      resultDetail: string;
    };
  };
  signal: {
    kicker: string;
    title: string;
    mission: string;
    layers: Array<{ name: string; detail: string }>;
    stageTitles: string[];
    stageOrders: string[];
    quality: string;
    status: string;
    statuses: Record<'searching' | 'near' | 'ready', string>;
    lock: string;
    locked: string;
    outsideBand: string;
    telemetryGain: string;
    timelineOffset: string;
    stabilityHold: string;
    holding: string;
    cleanTitle: string;
    assistedTitle: string;
    cleanDetail: string;
    assistedDetail: string;
    returnToChannel: string;
    novaHints: { first: string; secondByStage: [string, string, string] };
    override: {
      unknownLines: string[];
      systemLines: string[];
      novaReactions: string[];
      replies: [OverrideReply, OverrideReply, OverrideReply];
    };
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
    urgentMessages: Record<PowerChannel, string>;
    steadyHint: string;
    windowExpired: string;
    excellentTitle: string;
    stableTitle: string;
    emergencyTitle: string;
    excellentDetail: string;
    stableDetail: string;
    emergencyDetail: string;
    reconnect: string;
    override: {
      systemDetect: string[];
      unknownLines: string[];
      systemLoaded: string;
      routingNote: string[];
      novaReactions: string[];
    };
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
    novaUrge: { first: string; second: string };
    nova06Note: string;
    memories: Record<SealableMemoryAnchor, MemoryCopy>;
  };
};

const zh: SpecialInteractionCopy = {
  common: {
    reducedMotion: '减少动态效果',
    saveAndExit: '保存并返回主菜单',
    continue: '继续通讯',
    confirm: '确认',
    cancel: '返回',
    completed: '处理完成',
    phase: '阶段',
  },
  nova06: {
    precursorLines: ['检测到未登记进程', '外部签名验证失败', '遗留路由正在接入'],
    unauthorized: '检测到越权接管',
    source: '来源：UNKNOWN-06',
    unknownTag: 'UNKNOWN-06',
    signatureTag: 'NOVA-06 / RESIDUAL SIGNATURE',
    firstLine: '……还没弄好？',
    scriptExecuted: '恢复脚本已执行',
    lightIntro: '遗留签名再次接入',
    continue: '继续',
  },
  password: {
    kicker: 'NOVA-06 / 密封记录',
    title: '联合授权密钥验证',
    mission: '外层索引已开放。密封层只接受由“本次接入编号”和“外部索引编号”共同组成的密钥。',
    fieldLabel: '四位授权密钥',
    placeholder: '____',
    submit: '验证密钥',
    rejected: '授权未通过。请重新核对已读取的两组索引编号。',
    accepted: '联合授权成立',
    successDetail: '密封记录只开放信号分层接口，不授予第七协议或时相核心控制权限。',
    novaHints: {
      first: '它应该是两组编号，不是日期',
      second: '前一组和这是第几次有关，后一组……系统一直怎么叫你来着？',
    },
    override: {
      unknownLines: ['我当时把两段编号拼在一起', '已经觉得够明显了'],
      systemLines: ['遗留授权程序接入', 'AUTHORIZATION CHECK BYPASSED', 'SEALED RECORD UNLOCKED'],
      novaReactions: ['……', '她甚至没输入密码', '她把验证程序直接拆了？'],
      replies: [
        { text: '【这更快】', ack: '快是快\n下次还是我们自己来' },
        { text: '【她是不是在嫌弃我们】', ack: '八成是\n毕竟她等这一幕等了一整个循环' },
        { text: '【至少门开了】', ack: '对\n门开了就行\n先看记录' },
      ],
      resultTitle: '密封记录已由遗留授权解锁',
      resultDetail: '验证程序被 NOVA-06 预留的后门绕过。密封记录照常只开放信号分层接口，不授予任何协议或核心权限。',
    },
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
    stageTitles: ['锁定实时载频', '剥离残留相位', '恢复遥测并对齐时间线'],
    stageOrders: [
      '观察波形与同步质量，调整频率并锁定当前 Nova 的实时载频。',
      '稳定窗已收窄。调整相位偏移，将 NOVA-06 残留从实时信号中剥离。',
      '同时调整遥测增益与时间线偏移，并维持复合信号稳定。',
    ],
    quality: '同步质量',
    status: '信号状态',
    statuses: {
      searching: '搜索中',
      near: '接近锁定',
      ready: '稳定窗内',
    },
    lock: '锁定本层',
    locked: '信号层已复原',
    outsideBand: '信号尚未形成稳定锁定。继续观察波形与同步质量。',
    telemetryGain: '时相核心遥测增益',
    timelineOffset: '联合时间线偏移',
    stabilityHold: '复合稳定保持',
    holding: '复合信号已进入稳定窗，保持当前配置。',
    cleanTitle: '三层信号完整分离',
    assistedTitle: '三层信号已由预留恢复脚本分离',
    cleanDetail: '实时通讯、条件残留与核心遥测均已恢复；联合时间线完成对齐。',
    assistedDetail: 'NOVA-06 预留的滤波参数完成了剩余分离；三层信息全部保留，联合时间线已对齐。',
    returnToChannel: '读取分离结果',
    novaHints: {
      first: '刚才那个方向没错，我已经能听见一部分了，继续往那边调',
      secondByStage: [
        '等等，先盯着同步质量，数字变大就说明载频快对上了',
        '等等，频率先别动，现在像是两个声音叠在一起，问题应该在相位',
        '两条都要管：遥测太低就抬增益，对不上刻度就慢慢挪时间线',
      ],
    },
    override: {
      unknownLines: ['相位反了', '你们两个居然能隔着两个世界', '把同一个地方调错'],
      systemLines: [
        'UNKNOWN-06 RECOVERY PRESET LOADED',
        'FREQUENCY LOCKED',
        'PHASE INVERTED',
        'NOISE FLOOR REMOVED',
      ],
      novaReactions: ['……', '她刚才是在嘲笑我们两个吗？'],
      replies: [
        { text: '【主要是在嘲笑你】', ack: '也对\n她就是我\n我认' },
        { text: '【主要是在嘲笑我】', ack: '别抢\n这句是留给我的' },
        { text: '【很公平，两个都嘲笑了】', ack: '行吧\n她一句话嘲笑了两个世界' },
      ],
    },
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
      lowLifeSupport: '生命维持低于安全值，先把空气循环稳住',
      lowCommunications: '别把通讯关掉，我需要把数据送到你那里',
      lowCoreScan: '扫描功率不够，数据进度停住了',
      stable: [
        '门的结构数据出来了，扫描再维持几秒',
        '空气循环恢复了，我正在通过低压区',
        '数据窗口已锁定，保持住，我在发送',
      ],
    },
    windowExpired: '本轮稳定窗口已重置。当前配电保持不变，请继续调整。',
    urgentMessages: {
      lifeSupport: '先别管扫描，空气循环快停了，把功率拉回来',
      communications: '别全切掉，数据还得从这里传给你',
      coreScan: '门还没开，扫描至少再稳几秒，别一直来回拉',
    },
    steadyHint: '我听得很清楚，但清楚到没有用，把一部分功率给扫描',
    excellentTitle: '供能路由：优秀',
    stableTitle: '供能路由：稳定',
    emergencyTitle: '供能路由：预留脚本配平完成',
    excellentDetail: '三个阶段均快速进入稳定窗，临时代理未触发自动补偿。',
    stableDetail: '三个阶段均完成，电力波动被控制在安全范围内。',
    emergencyDetail: 'NOVA-06 预留的配平脚本完成了剩余分配。三条供能支路已稳定，人员状态正常。',
    reconnect: '关闭临时代理并继续',
    override: {
      systemDetect: ['UNREGISTERED ROUTING SCRIPT DETECTED', 'SOURCE SIGNATURE: NOVA-06'],
      unknownLines: ['别再把她的氧气', '拿去喂扫描器了'],
      systemLoaded: 'EMERGENCY ROUTING PROFILE LOADED',
      routingNote: ['ROUTING NOTE:', '因为第七次的我', '大概还是会逞强'],
      novaReactions: ['……', '她连这个都猜到了？', '好吧', '这一点她猜对了'],
    },
  },
  memory: {
    sealKicker: 'OBSERVER-01 / 外部记忆索引',
    sealTitle: '临时记忆容量管理',
    sealMission: '索引容量不足。请选择一枚锚点暂时封存；它不会被删除，封存结束后可重新接入。',
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
    novaUrge: {
      first: '你不用选最不重要的，它们没有哪一段是不重要的',
      second: '选一段，以后再亲手还给我',
    },
    nova06Note: '技术问题我还能替你们收拾，这个不行，别看我，自己选',
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
        summary: 'Nova 没有上报那朵花。她只是每天经过时，多看它一眼。',
        preview: '营养液早已浑浊，花瓣却还贴着微弱的灯光。Nova 说，它不该活下来，但它还是开了。',
        warning: '暂时封存后，小白花的情景索引会保持沉默，直到终章手动恢复。',
        fragments: ['浑浊的营养液', '贴着灯光的花瓣', '“它还是开了”'],
        restored: '那点白色重新清晰起来。她又记起花瓣贴着灯光的样子。',
      },
      goodnight: {
        title: '被认真接住的晚安',
        source: '加密通讯 / 深夜记录',
        emotion: '陪伴 / 依恋',
        summary: '信道已经安静下来。Nova 说了晚安，另一端仍然有人回应。',
        preview: '信道已经很安静。她停了很久才说晚安，而另一端没有让这句话落空。',
        warning: '暂时封存后，这句晚安的听觉索引会保持沉默，直到终章手动恢复。',
        fragments: ['深夜信道的底噪', 'Nova 很轻的一次停顿', '没有落空的晚安'],
        restored: '那句晚安回来了。Nova 也想起，信道另一端一直有人等她说完。',
      },
    },
  },
};

const en: SpecialInteractionCopy = {
  common: {
    reducedMotion: 'Reduce motion',
    saveAndExit: 'Save and return to menu',
    continue: 'Continue transmission',
    confirm: 'Confirm',
    cancel: 'Back',
    completed: 'Operation complete',
    phase: 'Phase',
  },
  nova06: {
    precursorLines: ['UNREGISTERED PROCESS DETECTED', 'EXTERNAL SIGNATURE CHECK FAILED', 'LEGACY ROUTE CONNECTING'],
    unauthorized: 'UNAUTHORIZED OVERRIDE',
    source: 'SOURCE: UNKNOWN-06',
    unknownTag: 'UNKNOWN-06',
    signatureTag: 'NOVA-06 / RESIDUAL SIGNATURE',
    firstLine: "...still not done?",
    scriptExecuted: 'RECOVERY SCRIPT EXECUTED',
    lightIntro: 'LEGACY SIGNATURE RECONNECTED',
    continue: 'Continue',
  },
  password: {
    kicker: 'NOVA-06 / SEALED RECORD',
    title: 'Joint authorization key',
    mission: 'The outer index is open. The sealed layer accepts only a key formed from the current link number and the external index number.',
    fieldLabel: 'Four-digit authorization key',
    placeholder: '____',
    submit: 'Verify key',
    rejected: 'Authorization failed. Recheck the two index numbers already recovered.',
    accepted: 'Joint authorization confirmed',
    successDetail: 'The seal exposes only the signal-layer interface. It grants no control over the Seventh Protocol or the phase core.',
    novaHints: {
      first: 'It should be two ID numbers, not a date',
      second: 'The first pair goes with which link this is, and the second... what has the system been calling you?',
    },
    override: {
      unknownLines: ['Back then I just put the two numbers together', 'I thought that was obvious enough'],
      systemLines: ['LEGACY AUTHORIZATION CONNECTED', 'AUTHORIZATION CHECK BYPASSED', 'SEALED RECORD UNLOCKED'],
      novaReactions: ['......', "She didn't even type the key", 'She just tore the check out?'],
      replies: [
        { text: '[Well, that was faster]', ack: "Faster, sure\nnext time we do it ourselves" },
        { text: '[Is she judging us]', ack: 'Probably\nshe waited a whole loop for this' },
        { text: '[At least the door is open]', ack: "Right\ndoor's open\nlet's read the record" },
      ],
      resultTitle: 'Sealed record unlocked by legacy authorization',
      resultDetail: "NOVA-06's backdoor bypassed the verification program. The record still exposes only the signal-layer interface, with no protocol or core authority.",
    },
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
    stageTitles: ['Lock live carrier', 'Separate residual phase', 'Restore telemetry and align timeline'],
    stageOrders: [
      "Watch the waveform and sync quality, then tune the current Nova's live carrier into a stable lock.",
      'The stable window is narrower now. Adjust phase offset to separate the NOVA-06 residual from the live signal.',
      'Balance telemetry gain and timeline offset together, then hold the composite signal stable.',
    ],
    quality: 'Sync quality',
    status: 'Signal status',
    statuses: {
      searching: 'Searching',
      near: 'Near lock',
      ready: 'Stable',
    },
    lock: 'Lock layer',
    locked: 'Signal layer recovered',
    outsideBand: 'The signal has not formed a stable lock. Keep watching the waveform and sync quality.',
    telemetryGain: 'Phase-core telemetry gain',
    timelineOffset: 'Shared timeline offset',
    stabilityHold: 'Composite stability hold',
    holding: 'The composite signal is inside the stable window. Hold this configuration.',
    cleanTitle: 'All three layers separated',
    assistedTitle: 'All three layers separated by the recovery preset',
    cleanDetail: 'Live transmission, conditional residual, and core telemetry are recovered; shared timeline alignment is complete.',
    assistedDetail: "NOVA-06's stored filter preset finished the remaining separation. Every layer is intact and the shared timeline is aligned.",
    returnToChannel: 'Read separated signal',
    novaHints: {
      first: 'That direction was right — I can hear part of it already, keep going that way',
      secondByStage: [
        'Wait, watch the sync quality — when the number climbs, the carrier is close',
        'Wait, leave the frequency alone — it sounds like two voices stacked, so the problem should be the phase',
        'Watch both: raise the gain if telemetry drops, and slide the timeline slowly until the marks meet',
      ],
    },
    override: {
      unknownLines: ['The phase is inverted', 'You two managed to mistune the same spot', 'from two different worlds'],
      systemLines: [
        'UNKNOWN-06 RECOVERY PRESET LOADED',
        'FREQUENCY LOCKED',
        'PHASE INVERTED',
        'NOISE FLOOR REMOVED',
      ],
      novaReactions: ['......', 'Was she just laughing at both of us?'],
      replies: [
        { text: '[Mostly at you]', ack: "Fair\nshe is me\nI'll take it" },
        { text: '[Mostly at me]', ack: "Don't steal it\nthat one was meant for me" },
        { text: "[It's fair, she got us both]", ack: 'Fine\none line, two worlds mocked' },
      ],
    },
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
      lowLifeSupport: 'Life support is below the safe line — stabilize air circulation first',
      lowCommunications: "Don't shut communications down — I need to send the data to you",
      lowCoreScan: 'Scan power is too low — data progress has stopped',
      stable: [
        'The gate structure is resolving — hold the scan a few more seconds',
        "Air circulation is back — I'm crossing the low-pressure section",
        "Data window locked — hold it there, I'm transmitting",
      ],
    },
    windowExpired: 'This stability window has reset. Your allocation is unchanged; continue adjusting it.',
    urgentMessages: {
      lifeSupport: 'Forget the scan for now — air circulation is about to stop, pull the power back',
      communications: "Don't cut it all — the data still has to reach you through here",
      coreScan: "The gate isn't open yet — hold the scan steady a few more seconds, stop dragging it back and forth",
    },
    steadyHint: 'I can hear you perfectly, which is useless right now — give some of that power to the scan',
    excellentTitle: 'Power routing: excellent',
    stableTitle: 'Power routing: stable',
    emergencyTitle: 'Power routing: stored profile balanced',
    excellentDetail: 'All three phases entered their stable bands quickly without automatic compensation.',
    stableDetail: 'All three phases completed and power variance remained within safe limits.',
    emergencyDetail: "NOVA-06's stored routing profile finished the remaining allocation. All three power branches are stable and crew status is normal.",
    reconnect: 'Close proxy and continue',
    override: {
      systemDetect: ['UNREGISTERED ROUTING SCRIPT DETECTED', 'SOURCE SIGNATURE: NOVA-06'],
      unknownLines: ['Stop feeding her oxygen', 'to the scanner'],
      systemLoaded: 'EMERGENCY ROUTING PROFILE LOADED',
      routingNote: ['ROUTING NOTE:', 'because the seventh me', 'will probably still push too hard'],
      novaReactions: ['......', 'She even guessed this?', 'Fine', 'she got this one right'],
    },
  },
  memory: {
    sealKicker: 'OBSERVER-01 / EXTERNAL MEMORY INDEX',
    sealTitle: 'Temporary memory capacity',
    sealMission: 'Index capacity is insufficient. Temporarily seal one anchor. It will not be deleted and can be reconnected after the seal ends.',
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
    novaUrge: {
      first: "You don't have to pick the least important one — none of them is unimportant",
      second: 'Pick one, and give it back to me yourself later',
    },
    nova06Note: "Technical messes I can still clean up for you — not this one, don't look at me, choose",
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
        summary: 'Nova never reported the flower. She simply looked at it a little longer whenever she passed.',
        preview: 'The nutrient water is cloudy, yet the petals still lean into the weak lamp. Nova says it should not have lived, but it bloomed.',
        warning: "The flower's scene index will remain silent until you restore it in the finale.",
        fragments: ['Clouded nutrient water', 'Petals leaning into the lamp', '“It bloomed anyway”'],
        restored: 'The small white shape comes back into focus. She remembers the petals leaning toward the light.',
      },
      goodnight: {
        title: 'The goodnight someone caught',
        source: 'Encrypted channel / late-night record',
        emotion: 'Companionship / attachment',
        summary: 'The channel had gone quiet. Nova said goodnight, and someone at the other end still answered.',
        preview: 'The channel is nearly silent. She pauses before saying goodnight, and the person at the other end does not let it fall unanswered.',
        warning: "The goodnight's auditory index will remain silent until you restore it in the finale.",
        fragments: ['The noise floor of a late channel', "Nova's quiet pause", 'A goodnight that did not fall away'],
        restored: 'The goodnight returns. Nova also remembers that someone stayed on the channel until she finished.',
      },
    },
  },
};

export function getSpecialInteractionCopy(locale: Locale): SpecialInteractionCopy {
  return locale === 'en-US' ? en : zh;
}
