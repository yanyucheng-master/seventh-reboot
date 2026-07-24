import type { Locale } from '../../i18n';
import type {
  BulkheadFailureReason,
  PowerFailureReason,
  SealableMemoryAnchor,
} from '../types';
import type { PowerChannel, PowerStage } from './logic';

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
    reducedMotion: string;
    saveAndExit: string;
    continue: string;
    confirm: string;
    cancel: string;
    phase: string;
  };
  bulkhead: {
    kicker: string;
    title: string;
    mission: string;
    liveMarker: string;
    anomalyMarker: string;
    remaining: string;
    instruction: string;
    sealStep: string;
    routeStep: string;
    observationSeal: string;
    hallwaySeal: string;
    routeHallway: string;
    routeObservation: string;
    purgeTransition: string;
    execute: string;
    safeTitle: string;
    injuredTitle: string;
    fatalTitle: string;
    safeDetail: string;
    injuredDetail: string;
    failures: Record<BulkheadFailureReason, string>;
  };
  password: {
    kicker: string;
    title: string;
    mission: string;
    novaSlot: string;
    observerSlot: string;
    submitted: string;
    waiting: string;
    fieldLabel: string;
    placeholder: string;
    submit: string;
    rejected: string;
    accepted: string;
    successDetail: string;
  };
  power: {
    kicker: string;
    title: string;
    mission: string;
    firstAttempt: string;
    finalAttempt: string;
    total: string;
    remaining: string;
    channels: Record<PowerChannel, string>;
    stages: Record<PowerStage, { title: string; order: string }>;
    minimum: string;
    stable: string;
    below: string;
    submit: string;
    firstSuccessTitle: string;
    retrySuccessTitle: string;
    successDetail: string;
    failureTitle: string;
    fatalTitle: string;
    failureDetail: string;
    fatalDetail: string;
    acknowledgeFailure: string;
    previousFailure: string;
    rollbackConsumed: string;
    failureReasons: Record<PowerFailureReason, string>;
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
    restoreSelect: string;
    restoreMismatch: string;
    restoreAction: string;
    noAnchor: string;
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
    phase: '阶段',
  },
  bulkhead: {
    kicker: 'AURORA / 观测室隔离控制',
    title: '观测室隔离与手动均压',
    mission: 'LIVE-07 位于中间过渡舱。先隔离异常生命信号，再把人员所在舱接向安全出口。',
    liveMarker: 'LIVE-07 / NOVA',
    anomalyMarker: '重复生命信号 / 应隔离',
    remaining: '密封完整度剩余',
    instruction: '我在中间。把我身后的观测室封住，再让我这边接主走廊。',
    sealStep: '第一步 / 选择要封闭的隔离门',
    routeStep: '第二步 / 选择均压方向',
    observationSeal: '封闭观测室侧隔离门',
    hallwaySeal: '封闭主走廊侧隔离门',
    routeHallway: '连接过渡舱与主走廊',
    routeObservation: '连接过渡舱与观测室',
    purgeTransition: '净化过渡舱',
    execute: '确认并执行均压序列',
    safeTitle: '均压完成 / LIVE-07 安全',
    injuredTitle: '均压完成 / LIVE-07 短时缺氧',
    fatalTitle: '均压失败 / LIVE-07 信号丢失',
    safeDetail: '观测室已隔离，过渡舱正在接入主走廊。',
    injuredDetail: '方向正确，但密封延迟使过渡舱压力短时跌破安全线。',
    failures: {
      wrong_observation_door: '低压观测室被接入过渡舱，人员舱压力快速下降。',
      hallway_sealed: '安全出口被封闭，异常观测室仍与人员舱相连。',
      transition_purged: '净化指令作用于 LIVE-07 所在过渡舱。',
      seal_timeout: '密封完整度归零，异常舱室与过渡舱失去隔离。',
    },
  },
  password: {
    kicker: 'NOVA-07 + OBSERVER-01 / 联合授权',
    title: '联合授权密钥',
    mission: 'Nova 已提交本轮身份片段。请按“本次接入编号 / 外部索引编号”的顺序提交另一端片段。',
    novaSlot: 'NOVA-07 权限槽',
    observerSlot: 'OBSERVER-01 权限槽',
    submitted: '07 / 已提交',
    waiting: '等待外部片段',
    fieldLabel: '联合密钥序列',
    placeholder: '07-01',
    submit: '提交外部授权',
    rejected: '联合密钥未通过。请核对 07 与 01 的顺序。该错误不会影响其他权限。',
    accepted: '双端身份已确认',
    successDetail: 'NOVA-07 与 OBSERVER-01 已共同解除密封记录的只读限制。',
  },
  power: {
    kicker: 'AURORA / 一次性供能代理',
    title: '观测室应急供能路由',
    mission: '为穿越低压通道和读取残留核心分别配置固定的 100% 功率。每条支路的安全下限均已显示。',
    firstAttempt: '第一次提交',
    finalAttempt: '最终提交',
    total: '阶段总功率',
    remaining: '提交窗口剩余',
    channels: {
      lifeSupport: '生命维持',
      communications: '通讯链路',
      coreScan: '核心读取',
    },
    stages: {
      transit: {
        title: '阶段 A / 穿过低压通道',
        order: '生命维持必须保持高位，同时保留通讯与最低核心待机。',
      },
      core_read: {
        title: '阶段 B / 读取残留核心',
        order: '核心读取进入工作区，生命维持和通讯仍须高于安全线。',
      },
    },
    minimum: '安全下限',
    stable: '安全',
    below: '低于下限',
    submit: '锁定并提交两阶段供能',
    firstSuccessTitle: '供能稳定 / 未调用残留权限',
    retrySuccessTitle: '最终供能恢复',
    successDetail: '生命维持、通讯与核心读取均保持在安全范围。',
    failureTitle: '错误路由已锁定',
    fatalTitle: '最终供能失败',
    failureDetail: '系统正在执行错误提交。先确认实际后果，随后才会处理剩余权限。',
    fatalDetail: '一次性回退权限已注销，最终错误提交无法再次撤销。',
    acknowledgeFailure: '返回通讯链路',
    previousFailure: '上次提交留下的异常记录',
    rollbackConsumed: 'NOVA-06 紧急回退：已使用 / 不可恢复',
    failureReasons: {
      life_support_below_minimum: '生命维持支路跌破安全线',
      communications_interrupted: '通讯链路失去持续供能',
      core_scan_underpowered: '核心读取未进入工作区',
      return_core_cutoff: '回溯核心待机支路被完全切断',
      timeout: '提交窗口关闭，当前配置被系统锁定',
    },
  },
  memory: {
    sealKicker: 'OBSERVER-01 / 外部记忆索引',
    sealTitle: '临时记忆容量管理',
    sealMission: '索引容量不足，只能暂时封存一枚锚点。三项都没有“正确答案”，选择只决定终章由你带回哪段记忆。',
    preview: '读取记忆闪回',
    select: '选择此锚点',
    selected: '已选择',
    confirmTitle: '确认临时封存',
    confirmDetail: '这段记忆不会被删除。它会暂时失去可读内容，并在终章由你亲手带回。',
    sealAction: '确认封存',
    restoreKicker: 'OBSERVER-01 / 临时封存区',
    restoreTitle: '恢复被封存的锚点',
    restoreMission: '三组碎片发生混叠。找出你此前亲手封存的那一组；正确目标由存档固定，不会因刷新改变。',
    restoreSelect: '尝试恢复此组碎片',
    restoreMismatch: '这组碎片仍在常规索引中，不是此前移入封存区的目标。',
    restoreAction: '完成锚点恢复',
    noAnchor: '未检测到临时封存锚点。索引将直接进入常规返还流程。',
    memories: {
      maintenance_board: {
        title: '贴着眼睛的漂浮维修板',
        source: '检修通道 / 恶作剧照片',
        emotion: '轻松 / 熟悉',
        summary: 'Nova 给一块漂浮维修板贴上眼睛，再把自己的乌龙拍给你看。',
        preview: '维修板慢慢漂过检修通道，两只眼睛正对着镜头。Nova 把它称作“宇宙级威胁”。',
        warning: '暂时封存后，她知道图片让自己想笑，却想不起笑点。',
        fragments: ['漂过通道的维修板', 'Nova 亲手贴上的眼睛', '“宇宙级威胁”'],
        restored: '那双眼睛重新清晰起来。Nova 终于想起，这场乌龙从头到尾都是她自己的恶作剧。',
      },
      white_flower: {
        title: '不该开放的小白花',
        source: '维护舱 / 水培槽',
        emotion: '希望 / 不安',
        summary: 'Nova 没有上报那朵花。她只是每天经过时，多看它一眼。',
        preview: '营养液早已浑浊，花瓣却还贴着微弱的灯光。Nova 说，它不该活下来，但它还是开了。',
        warning: '暂时封存后，她知道花不该出现，却忘了自己为什么高兴。',
        fragments: ['浑浊的营养液', '贴着灯光的花瓣', '“它还是开了”'],
        restored: '那点白色重新清晰起来。她又记起，它不该活下来，却仍然开花。',
      },
      goodnight: {
        title: '被认真接住的晚安',
        source: '加密通讯 / 深夜记录',
        emotion: '陪伴 / 依恋',
        summary: '信道已经安静下来。Nova 说了晚安，另一端仍然有人回应。',
        preview: '信道已经很安静。她停了很久才说晚安，而另一端没有让这句话落空。',
        warning: '暂时封存后，她感觉这个时间本应说些什么，却想不起那句话。',
        fragments: ['深夜信道的底噪', 'Nova 很轻的一次停顿', '没有落空的晚安'],
        restored: '那句晚安回来了。Nova 也想起，每次断线前缺少的正是这句话。',
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
    phase: 'Phase',
  },
  bulkhead: {
    kicker: 'AURORA / OBSERVATION ISOLATION',
    title: 'Observation isolation and manual equalization',
    mission: 'LIVE-07 is in the middle transition chamber. Isolate the anomalous life signal, then connect the occupied chamber to the safe exit.',
    liveMarker: 'LIVE-07 / NOVA',
    anomalyMarker: 'DUPLICATE LIFE SIGNAL / ISOLATE',
    remaining: 'Seal integrity remaining',
    instruction: "I'm in the middle. Seal the observatory behind me, then connect my side to the main corridor.",
    sealStep: 'Step 1 / Select the isolation door to seal',
    routeStep: 'Step 2 / Select the equalization path',
    observationSeal: 'Seal the observation-side door',
    hallwaySeal: 'Seal the main-corridor door',
    routeHallway: 'Connect transition chamber to main corridor',
    routeObservation: 'Connect transition chamber to observatory',
    purgeTransition: 'Purge transition chamber',
    execute: 'Confirm and execute equalization',
    safeTitle: 'Equalization complete / LIVE-07 safe',
    injuredTitle: 'Equalization complete / brief hypoxia',
    fatalTitle: 'Equalization failed / LIVE-07 lost',
    safeDetail: 'The observatory is isolated and the transition chamber is connecting to the main corridor.',
    injuredDetail: 'The direction was correct, but delayed sealing briefly dropped the chamber below its safe pressure.',
    failures: {
      wrong_observation_door: 'The low-pressure observatory was connected to the occupied transition chamber.',
      hallway_sealed: 'The safe exit was sealed while the anomalous observatory remained connected.',
      transition_purged: 'The purge command targeted the transition chamber containing LIVE-07.',
      seal_timeout: 'Seal integrity reached zero and the anomalous chamber lost isolation.',
    },
  },
  password: {
    kicker: 'NOVA-07 + OBSERVER-01 / JOINT AUTHORIZATION',
    title: 'Joint authorization key',
    mission: 'Nova has submitted the current-cycle identity fragment. Submit the other endpoint in current-link / external-index order.',
    novaSlot: 'NOVA-07 AUTH SLOT',
    observerSlot: 'OBSERVER-01 AUTH SLOT',
    submitted: '07 / SUBMITTED',
    waiting: 'WAITING FOR EXTERNAL FRAGMENT',
    fieldLabel: 'Joint key sequence',
    placeholder: '07-01',
    submit: 'Submit external authorization',
    rejected: 'Joint key rejected. Recheck the order of 07 and 01. No other authority was affected.',
    accepted: 'Both endpoint identities confirmed',
    successDetail: 'NOVA-07 and OBSERVER-01 jointly removed the sealed record\'s read-only restriction.',
  },
  power: {
    kicker: 'AURORA / ONE-TIME POWER PROXY',
    title: 'Observation emergency power routing',
    mission: 'Configure a fixed 100% budget for the low-pressure transit and residual-core read. Every safe minimum is visible.',
    firstAttempt: 'First submission',
    finalAttempt: 'Final submission',
    total: 'Stage total',
    remaining: 'Submission window',
    channels: {
      lifeSupport: 'Life support',
      communications: 'Communications',
      coreScan: 'Core read',
    },
    stages: {
      transit: {
        title: 'Stage A / Cross low-pressure passage',
        order: 'Keep life support high while preserving communications and minimum core standby.',
      },
      core_read: {
        title: 'Stage B / Read residual core',
        order: 'Bring the core read into range while life support and communications remain safe.',
      },
    },
    minimum: 'Safe minimum',
    stable: 'SAFE',
    below: 'BELOW LIMIT',
    submit: 'Lock and submit both stages',
    firstSuccessTitle: 'Power stable / residual authority unused',
    retrySuccessTitle: 'Final power route restored',
    successDetail: 'Life support, communications, and core read all remain inside safe ranges.',
    failureTitle: 'Incorrect route locked',
    fatalTitle: 'Final power route failed',
    failureDetail: 'The system is executing the submitted route. Confirm the real consequence before any remaining authority is handled.',
    fatalDetail: 'The one-time rollback authority is gone. This final route cannot be undone.',
    acknowledgeFailure: 'Return to transmission',
    previousFailure: 'Anomaly recorded from previous submission',
    rollbackConsumed: 'NOVA-06 emergency rollback: USED / UNRECOVERABLE',
    failureReasons: {
      life_support_below_minimum: 'Life support fell below its safe line',
      communications_interrupted: 'Communications lost sustained power',
      core_scan_underpowered: 'Core read did not enter its working range',
      return_core_cutoff: 'Return-core standby was cut completely',
      timeout: 'The submission window closed and locked the current route',
    },
  },
  memory: {
    sealKicker: 'OBSERVER-01 / EXTERNAL MEMORY INDEX',
    sealTitle: 'Temporary memory capacity',
    sealMission: 'Capacity is insufficient, so one anchor must be sealed temporarily. None is the correct answer; your choice only decides which memory you return by hand.',
    preview: 'Read memory flash',
    select: 'Select this anchor',
    selected: 'Selected',
    confirmTitle: 'Confirm temporary seal',
    confirmDetail: 'This memory will not be deleted. Its readable content will be set aside until you return it by hand in the finale.',
    sealAction: 'Confirm seal',
    restoreKicker: 'OBSERVER-01 / TEMPORARY SEAL',
    restoreTitle: 'Restore sealed anchor',
    restoreMission: 'Three fragment groups are mixed together. Find the one you sealed earlier; the save fixes the correct target across refreshes.',
    restoreSelect: 'Attempt to restore this fragment group',
    restoreMismatch: 'This group remains in the normal index. It is not the item moved into temporary storage.',
    restoreAction: 'Complete anchor restoration',
    noAnchor: 'No temporary anchor was found. The index will continue to standard return.',
    memories: {
      maintenance_board: {
        title: 'The floating panel with eyes',
        source: 'Maintenance passage / prank photo',
        emotion: 'Lightness / familiarity',
        summary: 'Nova stuck eyes on a drifting maintenance panel, then sent you a photo of her own false alarm.',
        preview: 'The panel drifts through the passage with two eyes facing the camera. Nova calls it a “space-grade threat.”',
        warning: 'She knows the image should make her laugh, but cannot remember why.',
        fragments: ['A panel drifting through the passage', 'The eyes Nova stuck on it', '“Space-grade threat”'],
        restored: 'The eyes become clear again. Nova remembers that the entire false alarm was her own prank.',
      },
      white_flower: {
        title: 'The white flower that should not bloom',
        source: 'Maintenance bay / hydroponic tray',
        emotion: 'Hope / unease',
        summary: 'Nova never reported the flower. She simply looked at it a little longer whenever she passed.',
        preview: 'The nutrient water is cloudy, yet the petals still lean into the weak lamp. It should not have lived, but it bloomed.',
        warning: 'She knows the flower should not be there, but forgets why it made her happy.',
        fragments: ['Clouded nutrient water', 'Petals leaning into the lamp', '“It bloomed anyway”'],
        restored: 'The small white shape returns. She remembers that it should not have lived, yet it bloomed.',
      },
      goodnight: {
        title: 'The goodnight someone caught',
        source: 'Encrypted channel / late-night record',
        emotion: 'Companionship / attachment',
        summary: 'The channel had gone quiet. Nova said goodnight, and someone at the other end still answered.',
        preview: 'The channel is nearly silent. She pauses before saying goodnight, and the person at the other end does not let it fall unanswered.',
        warning: 'She senses that something belongs at this hour, but cannot recall the words.',
        fragments: ['The noise floor of a late channel', "Nova's quiet pause", 'A goodnight that did not fall away'],
        restored: 'The goodnight returns. Nova remembers that this was what every lost connection had been missing.',
      },
    },
  },
};

export function getSpecialInteractionCopy(locale: Locale): SpecialInteractionCopy {
  return locale === 'en-US' ? en : zh;
}
