// Story data for "Seventh Reboot"
// Each node has: id, speaker, type, content, and navigation info

import type { ContactStage, EndingId, GlitchLevel, MemoryAnchorId, NovaEmotion, Speaker, MessageType } from './types';
import { cleanChatText } from './format';

export type { Speaker, MessageType };

export interface Choice {
  text: string;
  nextId: string;
}

export interface StoryNode {
  id: string;
  speaker: Speaker;
  type: MessageType;
  content: string;
  emotion?: NovaEmotion;
  choices?: Choice[];
  image?: string;
  delay?: number;
  nextId?: string;
  isGlitch?: boolean;
  glitchLevel?: GlitchLevel;
  memoryAnchor?: MemoryAnchorId;
  requiresAnchor?: MemoryAnchorId;
  contactStage?: ContactStage;
  archiveUnlock?: string | string[];
  endingUnlock?: EndingId;
}

// Helper to create nodes more easily
const n = (id: string, content: string, emotion?: NovaEmotion, delay?: number, nextId?: string): StoryNode => ({
  id, speaker: 'nova', type: 'text', content, emotion: emotion || 'normal', delay: delay ?? 600, nextId
});

const s = (id: string, content: string, delay?: number, nextId?: string, isGlitch?: boolean): StoryNode => ({
  id, speaker: 'system', type: 'status', content, delay: delay ?? 400, nextId, isGlitch
});

const t = (id: string, delay?: number, nextId?: string): StoryNode => ({
  id, speaker: 'system', type: 'typing', content: '', delay: delay ?? 2000, nextId
});

const d = (id: string, delay: number, nextId: string): StoryNode => ({
  id, speaker: 'system', type: 'delay', content: '', delay, nextId
});

const ts = (id: string, content: string, nextId: string): StoryNode => ({
  id, speaker: 'system', type: 'timestamp', content, nextId
});

const c = (id: string, choices: Choice[]): StoryNode => ({
  id, speaker: 'player', type: 'choice', content: '', choices
});

const img = (id: string, image: string, caption: string, nextId: string): StoryNode => ({
  id, speaker: 'nova', type: 'image', content: caption, image, nextId
});

const draft = (id: string, content: string, nextId: string, title = '未发送草稿'): StoryNode => ({
  id, speaker: 'system', type: 'draft', content: `${title}||${content}`, nextId
});

const ch = (id: string, content: string, nextId: string): StoryNode => ({
  id, speaker: 'system', type: 'chapter', content, nextId
});

const g = (id: string, content: string, delay?: number, nextId?: string, glitchLevel: GlitchLevel = 2): StoryNode => ({
  id, speaker: 'system', type: 'glitch', content, delay: delay ?? 2000, nextId, isGlitch: true, glitchLevel
});

const f = (id: string, title: string, content: string, nextId: string): StoryNode => ({
  id, speaker: 'system', type: 'file', content: `${title}||${content}`, nextId
});

const end = (id: string): StoryNode => ({
  id, speaker: 'system', type: 'end', content: '', nextId: 'MENU'
});

const ep = (id: string, content: string, delay: number, nextId: string): StoryNode => ({
  id, speaker: 'system', type: 'epilogue', content, delay, nextId
});

// ============================================
// PROLOGUE
// ============================================
const prologueNodes: StoryNode[] = [
  // Opening system sequence
  {
    id: 'p0',
    speaker: 'system',
    type: 'comm-log',
    content:
      '[OBSERVER-01]\n[记忆模块恢复]\nPROTOCOL · 检测到第七协议残留通讯\nREBOOT · 本次重启编号：07\nINTEGRITY · 记忆完整度：未知',
    delay: 1800,
    nextId: 'p1',
  },
  s('p1', 'Observer-01 核心索引：可读取', 900, 'p2'),
  s('p2', '等待第七协议接入授权', 900, 'p3'),
  s('p3', '是否接入通讯？', 900, 'p4'),
  c('p4', [
    { text: '【接入通讯】', nextId: 'p5' },
  ]),
  s('p5_reject', 'Observer-01 拒绝指令已撤销', 1000, 'p5'),
  s('p5', '正在恢复通讯链路……', 1600, 'p6'),
  s('p6', '检测到未知残留信号', 900, 'p7'),
  s('p7', '信号身份：加密', 900, 'p8'),
  s('p8', '来源：第七协议', 900, 'p9'),
  s('p9', '检测到 UNKNOWN-06 残留留言', 1200, 'p10'),
  t('p10', 1500, 'p11'),
  n('p11', '如果你能看到这条消息。', 'normal', 700, 'p12'),
  n('p12', '先别告诉她我们认识。', 'normal', 800, 'p13'),
  n('p13', '因为这一次。', 'normal', 600, 'p13a'),
  n('p13a', '她可能还不记得你。', 'sad', 1400, 'p13b'),
  s('p13b', '残留留言结束', 800, 'p13c'),
  s('p13c', '正在接入当前加密信号源', 900, 'p13d'),
  t('p13d', 1800, 'p13e'),
  { ...n('p13e', '……\n真的有人收到了？', 'smile', 1000, 'p14'), memoryAnchor: 'first_message' },
  c('p14', [
    { text: '【你是谁？】', nextId: 'p15a' },
    { text: '【这是哪里？】', nextId: 'p15b' },
    { text: '【恶作剧？】', nextId: 'p15c' },
  ]),
  // Branch: 你是谁
  n('p15a', '好问题。', 'normal', 600, 'p16a'),
  n('p16a', '我也想知道你是谁。', 'normal', 600, 'p17a'),
  n('p17a', '至少说明这不是自动回复。', 'smile', 800, 'p_merge1'),
  // Branch: 这是哪里
  n('p15b', '我不知道你那边是哪。', 'normal', 600, 'p16b'),
  n('p16b', '但我这边...', 'normal', 600, 'p17b'),
  n('p17b', '有点远。', 'normal', 800, 'p_merge1'),
  // Branch: 恶作剧
  n('p15c', '如果这是恶作剧。', 'normal', 600, 'p16c'),
  n('p16c', '那成本有点高。', 'normal', 600, 'p17c'),
  n('p17c', '我已经三天没睡好了。', 'smile', 800, 'p_merge1'),
  // Merge
  n('p_merge1', '先确认一下。', 'normal', 600, 'p_merge2'),
  n('p_merge2', '你是真人吗？', 'normal', 800, 'p_merge3'),
  c('p_merge3', [
    { text: '【是】', nextId: 'p_yes' },
    { text: '【不是】', nextId: 'p_no' },
  ]),
  n('p_yes', '太好了。', 'smile', 600, 'p_yes2'),
  n('p_yes2', '终于不是系统日志了。', 'smile', 800, 'p_merge4'),
  n('p_no', '...', 'normal', 800, 'p_no2'),
  n('p_no2', '那至少你比这里的大部分系统有礼貌。', 'smile', 600, 'p_no3'),
  n('p_no3', '我接受这个答案。', 'smile', 800, 'p_merge4'),
  // Merge 2
  { ...n('p_merge4', '我叫 Nova。', 'normal', 600, 'p_merge5'), contactStage: 'named' },
  n('p_merge5', 'Aurora号导航员。', 'normal', 600, 'p_merge6'),
  n('p_merge6', '虽然你大概率没听过。', 'smile', 800, 'p_merge7'),
  c('p_merge7', [
    { text: '【确实没听过】', nextId: 'p_aurora_unknown' },
    { text: '【Aurora号是船？】', nextId: 'p_aurora_ship' },
    { text: '【导航员听起来很重要】', nextId: 'p_aurora_nav' },
  ]),
  n('p_aurora_unknown', '正常。', 'normal', 400, 'p_aurora_unknown2'),
  n('p_aurora_unknown2', '我们现在在静默航区，名字传不到你那边也很合理。', 'normal', 900, 'p_aurora4'),
  n('p_aurora_ship', '对，一艘很贵、很大、也很容易出问题的远航观测船。', 'smile', 900, 'p_aurora_ship2'),
  n('p_aurora_ship2', '我负责确认它别把自己开进恒星里。', 'normal', 900, 'p_aurora4'),
  n('p_aurora_nav', '理论上是。', 'smile', 500, 'p_aurora_nav2'),
  n('p_aurora_nav2', '实际上大部分时间是在写报告、值夜班、和警报声互相折磨。', 'normal', 1000, 'p_aurora4'),
  n('p_aurora4', '总之。', 'normal', 500, 'p_aurora5'),
  n('p_aurora5', '你这条通讯不在 Aurora 号任何正常协议里。', 'normal', 900, 'p_aurora6'),
  c('p_aurora6', [
    { text: '【你是说这不是正常通讯？】', nextId: 'p_comm_abnormal' },
    { text: '【日志里没有这条链路？】', nextId: 'p_comm_log' },
  ]),
  n('p_comm_abnormal', '对。', 'normal', 500, 'p_comm_abnormal2'),
  n('p_comm_abnormal2', '而且它还绕过了我不认识的权限层。', 'normal', 800, 'p_exp1'),
  n('p_comm_log', '不只是没有。', 'normal', 500, 'p_comm_log2'),
  n('p_comm_log2', '系统甚至假装这条链路不存在。', 'normal', 900, 'p_exp1'),
  n('p_exp1', '准确来说。', 'normal', 400, 'p_exp2'),
  n('p_exp2', '我刚刚启动了一台实验设备。', 'normal', 600, 'p_exp3'),
  n('p_exp3', '然后它炸了。', 'normal', 600, 'p_exp4'),
  n('p_exp4', '嗯。', 'normal', 400, 'p_exp5'),
  n('p_exp5', '字面意义上的炸了。', 'smile', 800, 'p_exp6'),
  c('p_exp6', [
    { text: '【你没事吧？】', nextId: 'p_ok1' },
    { text: '【……你先确认自己安全】', nextId: 'p_silent1' },
    { text: '【备用链路还撑得住？】', nextId: 'p_link1' },
  ]),
  n('p_ok1', '你是今天第一个问我有没有事的人。', 'normal', 600, 'p_ok2'),
  n('p_ok2', '谢谢。', 'smile', 400, 'p_ok3'),
  n('p_ok3', '暂时死不了。', 'smile', 600, 'p_ok4'),
  n('p_ok4', '应该。', 'smile', 800, 'p_ok5'),
  n('p_silent1', '你这个反应。', 'normal', 600, 'p_silent2'),
  n('p_silent2', '像已经开始替我写事故报告了。', 'smile', 700, 'p_silent3'),
  n('p_silent3', '先别急，我还在。', 'normal', 700, 'p_silent4'),
  n('p_silent4', '备用系统也还在。', 'normal', 700, 'p_ok5'),
  n('p_link1', '能撑。', 'normal', 500, 'p_link2'),
  n('p_link2', '爆炸的是实验舱，不是通讯终端。', 'normal', 700, 'p_link3'),
  n('p_link3', '也不是我本人。', 'smile', 700, 'p_link4'),
  n('p_link4', '至少目前不是。', 'smile', 800, 'p_ok5'),
  c('p_ok5', [
    { text: '【“应该”听起来不太可靠】', nextId: 'p_dead1' },
  ]),
  n('p_dead1', '医疗系统还没拉最高级警报。', 'smile', 600, 'p_dead2'),
  n('p_dead2', '这通常是个好消息。', 'smile', 600, 'p_dead3'),
  n('p_dead3', '大概。', 'smile', 1200, 'p_pause1'),
  // Pause
  d('p_pause1', 2000, 'p_wonder1'),
  n('p_wonder1', '其实我更好奇另一件事。', 'normal', 600, 'p_wonder2'),
  n('p_wonder2', '为什么我能联系到你。', 'normal', 800, 'p_wonder3'),
  c('p_wonder3', [
    { text: '【我也不知道】', nextId: 'p_idk1' },
    { text: '【这不像巧合】', nextId: 'p_coin1' },
    { text: '【跨时空通讯？】', nextId: 'p_space1' },
  ]),
  n('p_idk1', '好。', 'normal', 500, 'p_idk2'),
  n('p_idk2', '至少我们现在一样迷茫。', 'smile', 600, 'p_idk3'),
  n('p_coin1', '同意。', 'normal', 500, 'p_coin2'),
  n('p_coin2', '巧合不会绕过三层舰内认证，还顺便吓醒一个导航员。', 'normal', 900, 'p_idk3'),
  n('p_space1', '你倒是很敢想。', 'smile', 500, 'p_space2'),
  n('p_space2', '但问题是……我也开始这么想了。', 'normal', 1000, 'p_idk3'),
  n('p_idk3', '等等。', 'normal', 400, 'p_idk4'),
  n('p_idk4', '我好像找到原因了。', 'normal', 600, 'p_idk5'),
  n('p_idk5', '实验设备记录了一段异常数据。', 'normal', 600, 'p_idk6'),
  n('p_idk6', '里面有一个编号。', 'normal', 400, 'p_idk7'),
  n('p_idk7', '和你的连接ID一致。', 'normal', 1200, 'p_idk8'),
  c('p_idk8', [
    { text: '【它怎么会提前记录我的ID？】', nextId: 'p_mean1' },
  ]),
  n('p_mean1', '意思是...', 'normal', 600, 'p_mean2'),
  n('p_mean2', '设备在爆炸前。', 'normal', 400, 'p_mean3'),
  n('p_mean3', '就已经知道你存在。', 'normal', 1500, 'p_mean4'),
  d('p_mean4', 3000, 'p_mean5'),
  n('p_mean5', '这不合理。', 'normal', 600, 'p_mean6'),
  n('p_mean6', '非常不合理。', 'normal', 600, 'p_mean7'),
  n('p_mean7', '除非...', 'normal', 1200, 'p_mean8'),
  c('p_mean8', [
    { text: '【除非它以前连接过我？】', nextId: 'p_unless1' },
  ]),
  n('p_unless1', '算了。', 'normal', 600, 'p_unless2'),
  n('p_unless2', '我不想吓你。', 'normal', 800, 'p_unless3'),
  c('p_unless3', [
    { text: '【说】', nextId: 'p_unless4' },
    { text: '【我不怕】', nextId: 'p_unless4' },
  ]),
  n('p_unless4', '除非。', 'normal', 800, 'p_unless5'),
  n('p_unless5', '它以前见过你。', 'normal', 2000, 'p_shock1'),
  // First anomaly
  d('p_shock1', 2000, 'p_shock2'),
  c('p_shock2', [
    { text: '【你是说我们以前连上过？】', nextId: 'p_log1' },
  ]),
  n('p_log1', '我知道。', 'normal', 600, 'p_log2'),
  n('p_log2', '听起来很蠢。', 'normal', 600, 'p_log3'),
  n('p_log3', '但日志里有一句备注。', 'normal', 600, 'p_log4'),
  n('p_log4', '只有一句。', 'normal', 800, 'p_log5'),
  { id: 'p_log5', speaker: 'nova', type: 'text', content: '"第七次连接成功。"', emotion: 'normal', delay: 2000, nextId: 'p_log6' },
  d('p_log6', 1500, 'p_log7'),
  c('p_log7', [
    { text: '【第七次？】', nextId: 'p_exp7_1' },
  ]),
  n('p_exp7_1', '问题就在这里。', 'normal', 600, 'p_exp7_2'),
  n('p_exp7_2', '今天是我第一次启动设备。', 'normal', 600, 'p_exp7_3'),
  n('p_exp7_3', '可日志显示。', 'normal', 400, 'p_exp7_4'),
  n('p_exp7_4', '已经成功连接过六次。', 'normal', 600, 'p_exp7_5'),
  n('p_exp7_5', '而且对象都是你。', 'normal', 2500, 'p_familiar1'),
  // Long pause
  d('p_familiar1', 3000, 'p_familiar2'),
  n('p_familiar2', '...', 'normal', 800, 'p_familiar3'),
  n('p_familiar3', '你有没有一种感觉？', 'normal', 800, 'p_familiar4'),
  c('p_familiar4', [
    { text: '【我们好像早就认识？】', nextId: 'p_fam1' },
  ]),
  n('p_fam1', '就是...', 'normal', 800, 'p_fam2'),
  n('p_fam2', '我们好像已经认识很久了。', 'normal', 1200, 'p_fam3'),
  c('p_fam3', [
    { text: '【没有，但我愿意听你说】', nextId: 'p_fam_no' },
    { text: '【有一点】', nextId: 'p_fam_yes' },
    { text: '【你吓到我了】', nextId: 'p_fam_scared' },
  ]),
  n('p_fam_no', '这句话很礼貌。', 'smile', 600, 'p_fam_no2'),
  n('p_fam_no2', '礼貌到让我更觉得你不像系统。', 'smile', 700, 'p_fam6'),
  n('p_fam_yes', '对吧。', 'normal', 600, 'p_fam_yes2'),
  n('p_fam_yes2', '我就知道不只是我一个人在犯傻。', 'smile', 800, 'p_fam6'),
  n('p_fam_scared', '抱歉。', 'normal', 600, 'p_fam_scared2'),
  n('p_fam_scared2', '我也被自己吓到了。', 'normal', 800, 'p_fam6'),
  n('p_fam6', '可能是我太久没和人聊天了。', 'normal', 600, 'p_fam7'),
  n('p_fam7', '开始胡思乱想。', 'normal', 1500, 'p_fam8'),
  d('p_fam8', 2000, 'p_fam9'),
  n('p_fam9', '不过。', 'normal', 600, 'p_fam10'),
  n('p_fam10', '能见到你。', 'normal', 400, 'p_fam11'),
  n('p_fam11', '我还是很高兴。', 'smile', 400, 'p_fam12'),
  n('p_fam12', '真的。', 'smile', 3000, 'p_window1'),
  // Nova looks out window
  d('p_window1', 2000, 'p_window2'),
  n('p_window2', '等等。', 'normal', 600, 'p_window3'),
  n('p_window3', '观测窗外面有东西。', 'normal', 600, 'p_window4'),
  n('p_window4', '我去确认一下。', 'normal', 600, 'p_window5'),
  n('p_window5', '别关通讯。', 'normal', 400, 'p_window6'),
  n('p_window6', '我很快回来。', 'normal', 1500, 'p_offline1'),
  s('p_offline1', 'Nova 已离线', 3000, 'p_draft1'),
  draft('p_draft1', '如果这真的是第七次……\n那这次一定要成功。', 'p_end', '未发送草稿 / 22:47'),
  d('p_end', 5000, 'CH1_START'),
];

// ============================================
// CHAPTER 1: CONNECTION (Day 2)
// ============================================
const chapter1Nodes: StoryNode[] = [
  ch('CH1_START', '第一章：连接', 'ch1_0'),
  ts('ch1_0', '第二天 08:13', 'ch1_1'),
  s('ch1_1', '收到新消息', 800, 'ch1_2'),
  n('ch1_2', '我回来了', 'normal', 600, 'ch1_3'),
  n('ch1_3', '严格来说', 'normal', 400, 'ch1_4'),
  n('ch1_4', '昨晚就回来了', 'normal', 400, 'ch1_5'),
  n('ch1_5', '然后直接睡死', 'smile', 400, 'ch1_6'),
  n('ch1_6', '脸差点和控制台融为一体', 'smile', 800, 'ch1_7'),
  c('ch1_7', [
    { text: '【你没事吧】', nextId: 'ch1_ok1' },
    { text: '【睡得好吗】', nextId: 'ch1_sleep1' },
    { text: '【观测窗外是什么】', nextId: 'ch1_ok1' },
  ]),
  // Branch: 睡得好吗
  n('ch1_sleep1', '5分。', 'smile', 400, 'ch1_sleep2'),
  n('ch1_sleep2', '满分100。', 'smile', 600, 'ch1_sleep3'),
  n('ch1_sleep3', '导航员的职业病。', 'normal', 600, 'ch1_sleep4'),
  n('ch1_sleep4', '睡眠质量和随机事件一样。', 'smile', 1200, 'ch1_merge1'),
  // Branch: 你没事吧 / 观测窗
  n('ch1_ok1', '活着。', 'smile', 600, 'ch1_ok2'),
  n('ch1_ok2', '那就是最好的答案。', 'smile', 1200, 'ch1_merge1'),
  // Merge
  n('ch1_merge1', '对了。', 'normal', 600, 'ch1_merge2'),
  n('ch1_merge2', '昨天那个异常信号。', 'normal', 400, 'ch1_merge3'),
  n('ch1_merge3', '最后证明是乌龙。', 'normal', 800, 'ch1_merge4'),
  c('ch1_merge4', [
    { text: '【昨晚那个信号到底是什么？】', nextId: 'ch1_ug1' },
  ]),
  n('ch1_ug1', '一块漂浮维修板。', 'normal', 600, 'ch1_ug2'),
  n('ch1_ug2', '我紧张了十分钟。', 'smile', 600, 'ch1_ug3'),
  n('ch1_ug3', '结果是隔壁工程组丢的。', 'normal', 600, 'ch1_ug4'),
  n('ch1_ug4', '他们甚至还给它贴了眼睛。', 'smile', 600, 'ch1_ug5'),
  n('ch1_ug5', '...', 'normal', 800, 'ch1_ug6'),
  n('ch1_ug6', '有时候我真的怀疑人类有没有未来。', 'smile', 800, 'ch1_photo1'),
  c('ch1_photo1', [
    { text: '【哈哈哈】', nextId: 'ch1_send1' },
    { text: '【照片呢】', nextId: 'ch1_send1' },
    { text: '【你拍了吗】', nextId: 'ch1_send1' },
  ]),
  n('ch1_send1', '等等。', 'normal', 600, 'ch1_send2'),
  n('ch1_send2', '我找找。', 'normal', 1500, 'ch1_send3'),
  t('ch1_send3', 2000, 'ch1_photo_send'),
  { ...img('ch1_photo_send', '/assets/photo_maintenance_board.jpg', '看。\n宇宙级威胁。', 'ch1_photo_reply'), memoryAnchor: 'maintenance_board' },
  c('ch1_photo_reply', [
    { text: '【确实可怕】', nextId: 'ch1_ph1' },
    { text: '【挺可爱的】', nextId: 'ch1_ph2' },
    { text: '【这眼睛是谁贴的】', nextId: 'ch1_ph3' },
  ]),
  n('ch1_ph1', '是吧。', 'smile', 600, 'ch1_ph_merge'),
  n('ch1_ph2', '？你的审美是不是有 bug。', 'smile', 800, 'ch1_ph_merge'),
  n('ch1_ph3', '不知道。', 'normal', 600, 'ch1_ph3b'),
  n('ch1_ph3b', '但我怀疑是维修组那个光头。', 'normal', 600, 'ch1_ph3c'),
  n('ch1_ph3c', '只有他会这么闲。', 'smile', 1000, 'ch1_ph_merge'),
  // Daily insert: weather chat
  n('ch1_ph_merge', '其实。', 'normal', 1200, 'ch1_worry1'),
  n('ch1_worry1', '昨天我有点担心。', 'normal', 800, 'ch1_worry2'),
  c('ch1_worry2', [
    { text: '【担心什么】', nextId: 'ch1_worry3' },
  ]),
  n('ch1_worry3', '担心你不在了。', 'normal', 800, 'ch1_worry4'),
  c('ch1_worry4', [
    { text: '【？】', nextId: 'ch1_worry5' },
  ]),
  n('ch1_worry5', '就是...', 'normal', 600, 'ch1_worry6'),
  n('ch1_worry6', '通讯突然建立。', 'normal', 400, 'ch1_worry7'),
  n('ch1_worry7', '然后突然消失。', 'normal', 400, 'ch1_worry8'),
  n('ch1_worry8', '我以为今天醒来。', 'normal', 600, 'ch1_worry9'),
  n('ch1_worry9', '会发现一切都是幻觉。', 'normal', 800, 'ch1_worry10'),
  c('ch1_worry10', [
    { text: '【现在呢】', nextId: 'ch1_worry11' },
  ]),
  n('ch1_worry11', '现在确定了。', 'smile', 600, 'ch1_worry12'),
  n('ch1_worry12', '你是真的。', 'smile', 400, 'ch1_worry13'),
  n('ch1_worry13', '虽然还是有点离谱。', 'smile', 2000, 'ch1_weather1'),
  // Weather chat
  d('ch1_weather1', 1500, 'ch1_weather2'),
  n('ch1_weather2', '诶。', 'normal', 600, 'ch1_weather3'),
  n('ch1_weather3', '你那边是什么天气？', 'normal', 800, 'ch1_weather4'),
  c('ch1_weather4', [
    { text: '【晴天】', nextId: 'ch1_sun' },
    { text: '【阴天】', nextId: 'ch1_cloud' },
    { text: '【下雨】', nextId: 'ch1_rain' },
  ]),
  n('ch1_sun', '羡慕。', 'normal', 400, 'ch1_sun2'),
  n('ch1_cloud', '听起来很适合睡觉。', 'normal', 400, 'ch1_sun2'),
  n('ch1_rain', '真的？', 'normal', 400, 'ch1_rain2'),
  n('ch1_rain2', '我最喜欢下雨了。', 'smile', 800, 'ch1_sun2'),
  n('ch1_sun2', '这里看不到天气。', 'normal', 600, 'ch1_sun3'),
  n('ch1_sun3', '只有星星。', 'normal', 400, 'ch1_sun4'),
  n('ch1_sun4', '每天都是星星。', 'normal', 800, 'ch1_sun5'),
  c('ch1_sun5', [
    { text: '【不好吗】', nextId: 'ch1_star1' },
  ]),
  n('ch1_star1', '刚开始很好。', 'normal', 600, 'ch1_star2'),
  n('ch1_star2', '后来就觉得。', 'normal', 600, 'ch1_star3'),
  n('ch1_star3', '有点单调。', 'normal', 800, 'ch1_star4'),
  n('ch1_star4', '你知道吗。', 'normal', 600, 'ch1_star5'),
  n('ch1_star5', '我小时候最喜欢下雨。', 'smile', 800, 'ch1_star6'),
  c('ch1_star6', [
    { text: '【你喜欢雨里的安静？】', nextId: 'ch1_star7' },
  ]),
  n('ch1_star7', '因为下雨的时候。', 'normal', 600, 'ch1_star8'),
  n('ch1_star8', '大家都会回家。', 'normal', 400, 'ch1_star9'),
  n('ch1_star9', '街道会变安静。', 'normal', 400, 'ch1_star10'),
  n('ch1_star10', '然后我就能坐在窗边发呆。', 'smile', 800, 'ch1_star11'),
  c('ch1_star11', [
    { text: '【听起来不错】', nextId: 'ch1_star12' },
  ]),
  n('ch1_star12', '是吧。', 'smile', 400, 'ch1_star13'),
  n('ch1_star13', '我能看一下午。', 'smile', 600, 'ch1_star14'),
  n('ch1_star14', '结果长大以后。', 'normal', 600, 'ch1_star15'),
  n('ch1_star15', '天天看宇宙发呆。', 'smile', 600, 'ch1_star16'),
  n('ch1_star16', '梦想实现过头了。', 'smile', 2000, 'ch1_n7_1'),
  // N7 the cat
  d('ch1_n7_1', 1500, 'ch1_n7_2'),
  n('ch1_n7_2', '对了。', 'normal', 600, 'ch1_n7_3'),
  n('ch1_n7_3', '你养过宠物吗？', 'normal', 800, 'ch1_n7_4'),
  c('ch1_n7_4', [
    { text: '【养过】', nextId: 'ch1_pet1' },
    { text: '【没有】', nextId: 'ch1_nopet1' },
    { text: '【现在还养着】', nextId: 'ch1_pet1' },
  ]),
  n('ch1_nopet1', '那也正常。', 'normal', 600, 'ch1_nopet2'),
  n('ch1_nopet2', '现在的城市生活节奏太快了。', 'normal', 800, 'ch1_pet1'),
  n('ch1_pet1', '我以前养过猫。', 'normal', 600, 'ch1_pet2'),
  n('ch1_pet2', '一只橘猫。', 'smile', 600, 'ch1_pet3'),
  n('ch1_pet3', '胖得像违法建筑。', 'smile', 800, 'ch1_pet4'),
  c('ch1_pet4', [
    { text: '【叫什么】', nextId: 'ch1_pet5' },
  ]),
  { ...n('ch1_pet5', 'N7。', 'smile', 600, 'ch1_pet6'), memoryAnchor: 'n7' },
  c('ch1_pet6', [
    { text: '【N7 是七岁那年的意思？】', nextId: 'ch1_pet7' },
  ]),
  n('ch1_pet7', '因为我七岁捡到它。', 'smile', 600, 'ch1_pet8'),
  n('ch1_pet8', '取名能力从小就不怎么样。', 'smile', 800, 'ch1_pet9'),
  c('ch1_pet9', [
    { text: '【后来呢】', nextId: 'ch1_pet10' },
  ]),
  d('ch1_pet10', 1500, 'ch1_pet11'),
  n('ch1_pet11', '后来它老死了。', 'normal', 1000, 'ch1_pet12'),
  n('ch1_pet12', '挺正常的。', 'normal', 600, 'ch1_pet13'),
  n('ch1_pet13', '只是那天我第一次发现。', 'normal', 800, 'ch1_pet14'),
  n('ch1_pet14', '有些东西不会一直陪着你。', 'sad', 2000, 'ch1_photo_n7'),
  // Photo of N7
  t('ch1_photo_n7', 2500, 'ch1_n7photo'),
  img('ch1_n7photo', '/assets/nova_n7_photo.png', '这是它最后的照片。\n在控制台上睡着了。', 'ch1_n7_after'),
  d('ch1_n7_after', 2000, 'ch1_n7_emotion'),
  n('ch1_n7_emotion', '抱歉。', 'sad', 800, 'ch1_n7_emotion2'),
  n('ch1_n7_emotion2', '气氛突然有点奇怪。', 'normal', 600, 'ch1_n7_emotion3'),
  n('ch1_n7_emotion3', '换个话题。', 'normal', 600, 'ch1_cook1'),
  // Cooking topic
  n('ch1_cook1', '你会做饭吗？', 'normal', 800, 'ch1_cook2'),
  c('ch1_cook2', [
    { text: '【会】', nextId: 'ch1_cook_yes' },
    { text: '【不会】', nextId: 'ch1_cook_no' },
    { text: '【一点点】', nextId: 'ch1_cook_no' },
  ]),
  n('ch1_cook_yes', '羡慕。', 'normal', 400, 'ch1_cook_merge'),
  n('ch1_cook_no', '那就好。', 'smile', 400, 'ch1_cook_merge'),
  n('ch1_cook_merge', '我不会。', 'normal', 600, 'ch1_cook_merge2'),
  n('ch1_cook_merge2', '准确来说。', 'normal', 400, 'ch1_cook_merge3'),
  n('ch1_cook_merge3', '我会把能吃的东西变成不能吃。', 'smile', 800, 'ch1_cook_merge4'),
  c('ch1_cook_merge4', [
    { text: '【这么夸张】', nextId: 'ch1_cook_story' },
  ]),
  n('ch1_cook_story', '上个月。', 'normal', 400, 'ch1_cook_story2'),
  n('ch1_cook_story2', '我成功把营养面做成了固体武器。', 'smile', 600, 'ch1_cook_story3'),
  n('ch1_cook_story3', '维修组现在还拿它开玩笑。', 'smile', 800, 'ch1_steak_photo'),
  // Time jump
  ts('ch1_steak_photo', '11:42', 'ch1_steak1'),
  n('ch1_steak1', '糟了。', 'normal', 600, 'ch1_steak2'),
  c('ch1_steak2', [
    { text: '【你是不是又忘了什么安排】', nextId: 'ch1_steak3' },
  ]),
  n('ch1_steak3', '例会。', 'normal', 400, 'ch1_steak4'),
  n('ch1_steak4', '我忘了。', 'smile', 400, 'ch1_steak5'),
  n('ch1_steak5', '舰长会杀了我的。', 'smile', 800, 'ch1_steak6'),
  c('ch1_steak6', [
    { text: '【快去】', nextId: 'ch1_go1' },
  ]),
  n('ch1_go1', '等会。', 'normal', 600, 'ch1_go2'),
  n('ch1_go2', '先说个正事。', 'normal', 600, 'ch1_go3'),
  c('ch1_go3', [
    { text: '【？】', nextId: 'ch1_go4' },
  ]),
  n('ch1_go4', '谢谢。', 'normal', 600, 'ch1_go5'),
  c('ch1_go5', [
    { text: '【谢什么】', nextId: 'ch1_go6' },
  ]),
  n('ch1_go6', '不知道。', 'normal', 600, 'ch1_go7'),
  n('ch1_go7', '可能是因为你还在。', 'normal', 800, 'ch1_go8'),
  n('ch1_go8', '总之。', 'normal', 400, 'ch1_go9'),
  n('ch1_go9', '谢谢。', 'smile', 1200, 'ch1_go10'),
  d('ch1_go10', 1000, 'ch1_go11'),
  n('ch1_go11', '我晚上再回来', 'normal', 400, 'ch1_go12'),
  n('ch1_go12', '你别突然消失啊', 'smile', 1500, 'ch1_offline'),
  s('ch1_offline', 'Nova 已离线', 3000, 'ch1_night'),
  // Night scene
  ts('ch1_night', '21:17', 'ch1_night1'),
  s('ch1_night1', '收到新消息', 800, 'ch1_night2'),
  n('ch1_night2', '回来了', 'normal', 600, 'ch1_night3'),
  n('ch1_night3', '坏消息。', 'normal', 600, 'ch1_night4'),
  n('ch1_night4', '我被舰长骂了。', 'smile', 800, 'ch1_night5'),
  c('ch1_night5', [
    { text: '【活该】', nextId: 'ch1_night6' },
    { text: '【今天明明被骂了，怎么还开心】', nextId: 'ch1_night6' },
    { text: '【哈哈哈哈】', nextId: 'ch1_night6' },
  ]),
  n('ch1_night6', '你居然笑。', 'smile', 600, 'ch1_night7'),
  n('ch1_night7', '我们友谊的小船沉了。', 'smile', 800, 'ch1_night8'),
  c('ch1_night8', [
    { text: '【原因呢】', nextId: 'ch1_night9' },
  ]),
  n('ch1_night9', '开会迟到。', 'normal', 400, 'ch1_night10'),
  n('ch1_night10', '而且睡着了。', 'smile', 800, 'ch1_night11'),
  c('ch1_night11', [
    { text: '【......】', nextId: 'ch1_night12' },
  ]),
  n('ch1_night12', '我知道。', 'normal', 400, 'ch1_night13'),
  n('ch1_night13', '这事不占理。', 'smile', 1500, 'ch1_night14'),
  d('ch1_night14', 2000, 'ch1_night15'),
  n('ch1_night15', '不过。', 'normal', 600, 'ch1_night16'),
  n('ch1_night16', '今天其实挺开心的。', 'smile', 800, 'ch1_night17'),
  c('ch1_night17', [
    { text: '【因为我？】', nextId: 'ch1_night18' },
    { text: '【因为没死？】', nextId: 'ch1_night18b' },
    { text: '【因为摸鱼成功？】', nextId: 'ch1_night18b' },
  ]),
  n('ch1_night18', '...', 'normal', 800, 'ch1_night19'),
  n('ch1_night18b', '......', 'normal', 800, 'ch1_night19'),
  n('ch1_night19', '有一点。', 'smile', 600, 'ch1_night20'),
  n('ch1_night20', '别得意。', 'smile', 1500, 'ch1_night21'),
  d('ch1_night21', 1500, 'ch1_night22'),
  n('ch1_night22', '好了。', 'normal', 600, 'ch1_night23'),
  n('ch1_night23', '我得去绕飞船一圈了', 'normal', 600, 'ch1_night24'),
  { ...n('ch1_night24', '晚安。', 'normal', 800, 'ch1_night25'), memoryAnchor: 'goodnight' },
  c('ch1_night25', [
    { text: '【晚安】', nextId: 'ch1_night26' },
  ]),
  n('ch1_night26', '嗯。', 'normal', 600, 'ch1_night27'),
  n('ch1_night27', '晚安。', 'smile', 2000, 'ch1_night28'),
  // Typing animation
  d('ch1_night28', 2000, 'ch1_night29'),
  d('ch1_night29', 1500, 'ch1_night30'),
  d('ch1_night30', 2000, 'ch1_night31'),
  n('ch1_night31', '还有。', 'normal', 600, 'ch1_night32'),
  n('ch1_night32', '很高兴认识你。', 'smile', 1500, 'ch1_night33'),
  s('ch1_night33', 'Nova 已离线', 3000, 'ch1_draft'),
  // Late night draft
  ts('ch1_draft', '深夜 02:41', 'ch1_draft1'),
  draft('ch1_draft1', '不对\n我明明没有告诉过他 N7', 'CH2_START', '未发送草稿 / 02:41'),
];

// ============================================
// CHAPTER 2: DAILY (Day 3)
// ============================================
const chapter2Nodes: StoryNode[] = [
  ch('CH2_START', '第二章：日常', 'ch2_0'),
  ts('ch2_0', '第三天 07:26', 'ch2_1'),
  s('ch2_1', '收到新消息', 800, 'ch2_2'),
  n('ch2_2', '坏了。', 'normal', 600, 'ch2_3'),
  n('ch2_3', '出大事了。', 'normal', 800, 'ch2_4'),
  c('ch2_4', [
    { text: '【又是导航员职业事故？】', nextId: 'ch2_5' },
    { text: '【飞船炸了？】', nextId: 'ch2_5b' },
    { text: '【你又迟到了？】', nextId: 'ch2_5c' },
  ]),
  n('ch2_5', '我把闹钟关了。', 'normal', 600, 'ch2_merge'),
  n('ch2_5b', '...暂时还没有。', 'smile', 600, 'ch2_merge'),
  n('ch2_5c', '......', 'normal', 800, 'ch2_5c2'),
  n('ch2_5c2', '为什么你这么了解我。', 'smile', 600, 'ch2_5c3'),
  n('ch2_5c3', '有被冒犯到。', 'smile', 600, 'ch2_5c4'),
  n('ch2_5c4', '但确实迟到了。', 'smile', 800, 'ch2_merge'),
  n('ch2_merge', '而且还不是普通迟到。', 'normal', 600, 'ch2_merge2'),
  n('ch2_merge2', '我把闹钟关了。', 'normal', 400, 'ch2_merge3'),
  n('ch2_merge3', '然后梦见自己起床了。', 'smile', 600, 'ch2_merge4'),
  n('ch2_merge4', '甚至梦见自己开完会了。', 'smile', 800, 'ch2_merge5'),
  c('ch2_merge5', [
    { text: '【经典】', nextId: 'ch2_merge6' },
    { text: '【太真实了】', nextId: 'ch2_merge6' },
    { text: '【现实后来把你叫醒了？】', nextId: 'ch2_merge6' },
  ]),
  n('ch2_merge6', '然后现实中的舰长把我叫醒了。', 'normal', 600, 'ch2_merge7'),
  n('ch2_merge7', '人生至暗时刻。', 'smile', 800, 'ch2_merge8'),
  c('ch2_merge8', [
    { text: '【哈哈哈哈】', nextId: 'ch2_dream1' },
  ]),
  n('ch2_dream1', '你笑得太开心了。', 'smile', 600, 'ch2_dream2'),
  n('ch2_dream2', '记仇。', 'smile', 1500, 'ch2_dream3'),
  d('ch2_dream3', 1500, 'ch2_dream4'),
  n('ch2_dream4', '不过。', 'normal', 600, 'ch2_dream5'),
  n('ch2_dream5', '今天有件怪事。', 'normal', 800, 'ch2_dream6'),
  c('ch2_dream6', [
    { text: '【你刚刚说有怪事】', nextId: 'ch2_dream7' },
  ]),
  n('ch2_dream7', '我做梦了。', 'normal', 600, 'ch2_dream8'),
  c('ch2_dream8', [
    { text: '【很正常】', nextId: 'ch2_dream9' },
  ]),
  n('ch2_dream9', '不正常。', 'normal', 600, 'ch2_dream10'),
  n('ch2_dream10', '因为梦里有你。', 'normal', 2000, 'ch2_dream11'),
  // First anomaly
  d('ch2_dream11', 2000, 'ch2_dream12'),
  c('ch2_dream12', [
    { text: '【梦里有我这件事不正常？】', nextId: 'ch2_dream13' },
  ]),
  n('ch2_dream13', '我不知道。', 'normal', 600, 'ch2_dream14'),
  n('ch2_dream14', '梦很模糊。', 'normal', 600, 'ch2_dream15'),
  n('ch2_dream15', '我只记得。', 'normal', 600, 'ch2_dream16'),
  n('ch2_dream16', '你好像对我说了一句话。', 'normal', 800, 'ch2_dream17'),
  c('ch2_dream17', [
    { text: '【我在梦里对你说了什么】', nextId: 'ch2_dream18' },
  ]),
  n('ch2_dream18', '...', 'normal', 800, 'ch2_dream19'),
  n('ch2_dream19', '奇怪。', 'normal', 600, 'ch2_dream20'),
  n('ch2_dream20', '突然想不起来了。', 'normal', 600, 'ch2_dream21'),
  n('ch2_dream21', '算了。', 'normal', 400, 'ch2_dream22'),
  n('ch2_dream22', '可能只是普通梦。', 'normal', 2000, 'ch2_obs1'),
  // Observatory photo
  ts('ch2_obs1', '12:03', 'ch2_obs2'),
  n('ch2_obs2', '我摸鱼五分钟', 'normal', 400, 'ch2_obs3'),
  n('ch2_obs3', '给你看个好东西', 'smile', 1500, 'ch2_obs4'),
  t('ch2_obs4', 2500, 'ch2_obs5'),
  { ...img('ch2_obs5', '/assets/photo_observatory.jpg', '这里是我最喜欢的地方。', 'ch2_obs6'), memoryAnchor: 'observatory' },
  c('ch2_obs6', [
    { text: '【真漂亮】', nextId: 'ch2_obs7' },
    { text: '【每天都能看？】', nextId: 'ch2_obs7' },
    { text: '【不会看腻吗】', nextId: 'ch2_obs8' },
  ]),
  n('ch2_obs7', '会。', 'normal', 400, 'ch2_obs8'),
  n('ch2_obs8', '但偶尔还是会被震撼到。', 'normal', 600, 'ch2_obs9'),
  n('ch2_obs9', '比如现在。', 'normal', 800, 'ch2_obs10'),
  n('ch2_obs10', '我总会想。', 'normal', 600, 'ch2_obs11'),
  n('ch2_obs11', '那些星星后面。', 'normal', 600, 'ch2_obs12'),
  n('ch2_obs12', '会不会也有人正在抬头。', 'normal', 800, 'ch2_obs13'),
  c('ch2_obs13', [
    { text: '【也许有】', nextId: 'ch2_obs14' },
    { text: '【说不定正在看你】', nextId: 'ch2_obs14' },
    { text: '【宇宙太大了】', nextId: 'ch2_obs14' },
  ]),
  n('ch2_obs14', '是啊。', 'normal', 400, 'ch2_obs15'),
  n('ch2_obs15', '宇宙太大了。', 'normal', 600, 'ch2_obs16'),
  n('ch2_obs16', '所以能认识一个人。', 'normal', 600, 'ch2_obs17'),
  n('ch2_obs17', '其实挺难的。', 'smile', 2000, 'ch2_forget1'),
  // Forgetting topic
  ts('ch2_forget1', '16:44', 'ch2_forget2'),
  n('ch2_forget2', '问你个问题。', 'normal', 800, 'ch2_forget3'),
  c('ch2_forget3', [
    { text: '【问】', nextId: 'ch2_forget4' },
  ]),
  n('ch2_forget4', '如果有一天。', 'normal', 600, 'ch2_forget5'),
  n('ch2_forget5', '你突然忘记一个人。', 'normal', 600, 'ch2_forget6'),
  n('ch2_forget6', '会怎么办？', 'normal', 800, 'ch2_forget7'),
  c('ch2_forget7', [
    { text: '【你最近也在担心遗忘？】', nextId: 'ch2_forget8' },
    { text: '【找回记忆】', nextId: 'ch2_forget8' },
    { text: '【顺其自然】', nextId: 'ch2_forget8' },
  ]),
  n('ch2_forget8', '没什么。', 'normal', 600, 'ch2_forget9'),
  n('ch2_forget9', '只是突然想到。', 'normal', 600, 'ch2_forget10'),
  n('ch2_forget10', '最近记性不太好。', 'normal', 800, 'ch2_forget11'),
  c('ch2_forget11', [
    { text: '【熬夜熬的】', nextId: 'ch2_forget12' },
  ]),
  n('ch2_forget12', '有可能。', 'normal', 600, 'ch2_forget13'),
  n('ch2_forget13', '昨天我居然忘了维修组那个光头叫什么。', 'smile', 600, 'ch2_forget14'),
  n('ch2_forget14', '虽然我本来也经常忘。', 'smile', 1500, 'ch2_forget15'),
  d('ch2_forget15', 1500, 'ch2_forget16'),
  n('ch2_forget16', '但还有件更奇怪的事。', 'normal', 600, 'ch2_forget17'),
  c('ch2_forget17', [
    { text: '【你记得谁提醒过你？】', nextId: 'ch2_forget18' },
  ]),
  n('ch2_forget18', '我记得。', 'normal', 600, 'ch2_forget19'),
  n('ch2_forget19', '有人告诉过我。', 'normal', 400, 'ch2_forget20'),
  n('ch2_forget20', '不要喝舰上的苦咖啡。', 'normal', 600, 'ch2_forget21'),
  n('ch2_forget21', '可没人说过。', 'normal', 400, 'ch2_forget22'),
  n('ch2_forget22', '我也没写过备忘录。', 'normal', 800, 'ch2_forget23'),
  c('ch2_forget23', [
    { text: '【你不会真喝了吧】', nextId: 'ch2_forget24' },
  ]),
  n('ch2_forget24', '然后我还是喝了。', 'smile', 600, 'ch2_forget25'),
  n('ch2_forget25', '难喝得像发动机冷却液。', 'smile', 1500, 'ch2_candy1'),
  d('ch2_candy1', 1200, 'ch2_candy2'),
  n('ch2_candy2', '对了。', 'normal', 600, 'ch2_candy3'),
  { ...n('ch2_candy3', '我刚在抽屉里找到三颗牛奶糖。', 'smile', 800, 'ch2_candy4'), memoryAnchor: 'milk_candy' },
  c('ch2_candy4', [
    { text: '【N7欠你的那三颗？】', nextId: 'ch2_candy5' },
    { text: '【舰上还有糖？】', nextId: 'ch2_candy5' },
  ]),
  n('ch2_candy5', '对。', 'smile', 600, 'ch2_candy6'),
  n('ch2_candy6', '那只猫欠了我好多年。', 'smile', 600, 'ch2_candy7'),
  n('ch2_candy7', '结果债主已经不在了。', 'normal', 800, 'ch2_candy8'),
  img('ch2_candy8', '/assets/photo_candy.jpg', '战利品。\n替 N7 还债。', 'ch2_night1'),
  // Night
  ts('ch2_night1', '21:09', 'ch2_night2'),
  n('ch2_night2', '回来了', 'normal', 400, 'ch2_night3'),
  n('ch2_night3', '腿快废了', 'normal', 800, 'ch2_night4'),
  c('ch2_night4', [
    { text: '【早点休息】', nextId: 'ch2_night5' },
    { text: '【辛苦了】', nextId: 'ch2_night5' },
  ]),
  n('ch2_night5', '嗯。', 'normal', 400, 'ch2_night6'),
  n('ch2_night6', '今天确实有点累。', 'normal', 1500, 'ch2_night7'),
  d('ch2_night7', 2000, 'ch2_night8'),
  n('ch2_night8', '其实。', 'normal', 600, 'ch2_night9'),
  n('ch2_night9', '有件事我没告诉别人。', 'normal', 600, 'ch2_night10'),
  c('ch2_night10', [
    { text: '【现在愿意告诉我了？】', nextId: 'ch2_night11' },
  ]),
  n('ch2_night11', '我最近总有种感觉。', 'normal', 600, 'ch2_night12'),
  n('ch2_night12', '好像有什么事正在发生。', 'normal', 400, 'ch2_night13'),
  n('ch2_night13', '但我不知道是什么。', 'normal', 600, 'ch2_night14'),
  n('ch2_night14', '像是...', 'normal', 800, 'ch2_night15'),
  n('ch2_night15', '站在悬崖边。', 'normal', 400, 'ch2_night16'),
  n('ch2_night16', '却看不见下面。', 'normal', 800, 'ch2_night17'),
  c('ch2_night17', [
    { text: '【压力太大了】', nextId: 'ch2_night18' },
    { text: '【别胡思乱想】', nextId: 'ch2_night18' },
    { text: '【具体是什么感觉】', nextId: 'ch2_night18' },
  ]),
  n('ch2_night18', '不知道。', 'normal', 600, 'ch2_night19'),
  n('ch2_night19', '只是偶尔会觉得。', 'normal', 600, 'ch2_night20'),
  n('ch2_night20', '有些画面特别熟悉。', 'normal', 400, 'ch2_night21'),
  n('ch2_night21', '有些对话也很熟悉。', 'normal', 400, 'ch2_night22'),
  n('ch2_night22', '甚至。', 'normal', 400, 'ch2_night23'),
  n('ch2_night23', '有时候看见你的消息。', 'normal', 600, 'ch2_night24'),
  n('ch2_night24', '会觉得。', 'normal', 400, 'ch2_night25'),
  n('ch2_night25', '自己好像已经看过了。', 'normal', 1500, 'ch2_night26'),
  c('ch2_night26', [
    { text: '【看过？】', nextId: 'ch2_night27' },
  ]),
  n('ch2_night27', '嗯。', 'normal', 400, 'ch2_night28'),
  n('ch2_night28', '很奇怪吧。', 'normal', 600, 'ch2_night29'),
  n('ch2_night29', '明明不可能。', 'normal', 600, 'ch2_night30'),
  n('ch2_night30', '算了。', 'normal', 400, 'ch2_night31'),
  n('ch2_night31', '可能只是最近睡眠不足。', 'normal', 2000, 'ch2_n7q1'),
  // N7 question - critical moment
  d('ch2_n7q1', 1500, 'ch2_n7q2'),
  n('ch2_n7q2', '对了。', 'normal', 600, 'ch2_n7q3'),
  n('ch2_n7q3', '我今天路过储物区。', 'normal', 400, 'ch2_n7q4'),
  n('ch2_n7q4', '看到一只橘猫玩偶。', 'normal', 600, 'ch2_n7q5'),
  n('ch2_n7q5', '突然想起 N7。', 'normal', 800, 'ch2_n7q6'),
  c('ch2_n7q6', [
    { text: '【那只胖猫】', nextId: 'ch2_n7q7' },
  ]),
  n('ch2_n7q7', '？', 'normal', 600, 'ch2_n7q8'),
  n('ch2_n7q8', '等等。', 'normal', 600, 'ch2_n7q9'),
  { id: 'ch2_n7q9', speaker: 'nova', type: 'text', content: '我和你说过 N7 吗？', emotion: 'normal', delay: 2000, nextId: 'ch2_n7q10' },
  c('ch2_n7q10', [
    { text: '【说过】', nextId: 'ch2_n7q11' },
  ]),
  n('ch2_n7q11', '奇怪。', 'normal', 800, 'ch2_n7q12'),
  n('ch2_n7q12', '我完全不记得。', 'normal', 800, 'ch2_n7q13'),
  c('ch2_n7q13', [
    { text: '【你记性越来越差了】', nextId: 'ch2_n7q14' },
  ]),
  n('ch2_n7q14', '可能吧。', 'normal', 600, 'ch2_n7q15'),
  n('ch2_n7q15', '不过。', 'normal', 600, 'ch2_n7q16'),
  n('ch2_n7q16', '谢谢你记得。', 'smile', 800, 'ch2_n7q17'),
  d('ch2_n7q17', 1500, 'ch2_n7q18'),
  n('ch2_n7q18', '有时候我觉得。', 'normal', 600, 'ch2_n7q19'),
  n('ch2_n7q19', '被人记住。', 'normal', 400, 'ch2_n7q20'),
  n('ch2_n7q20', '是一件很幸福的事。', 'smile', 1500, 'ch2_goodnight'),
  // Goodnight
  n('ch2_goodnight', '好了。', 'normal', 600, 'ch2_gn1'),
  n('ch2_gn1', '今天真的要睡了。', 'normal', 800, 'ch2_gn2'),
  c('ch2_gn2', [
    { text: '【晚安】', nextId: 'ch2_gn3' },
  ]),
  n('ch2_gn3', '晚安。', 'normal', 2000, 'ch2_gn4'),
  d('ch2_gn4', 2000, 'ch2_gn5'),
  d('ch2_gn5', 1500, 'ch2_gn6'),
  n('ch2_gn6', '如果明天我忘了什么。', 'normal', 800, 'ch2_gn7'),
  n('ch2_gn7', '记得提醒我。', 'smile', 1500, 'ch2_offline'),
  s('ch2_offline', 'Nova 已离线', 2000, 'ch2_draft'),
  ts('ch2_draft', '深夜 02:17', 'ch2_draft1'),
  draft('ch2_draft1', '不对\n我明明没有告诉过他 N7', 'CH3_START', '未发送草稿 / 02:17'),
];

// ============================================
// CHAPTER 3: ANOMALY (Day 4)
// ============================================
const chapter3Nodes: StoryNode[] = [
  ch('CH3_START', '第三章：异常', 'ch3_0'),
  ts('ch3_0', '第四天 08:02', 'ch3_1'),
  s('ch3_1', '收到新消息', 800, 'ch3_flower0'),
  n('ch3_flower0', '快看。', 'smile', 600, 'ch3_flower1'),
  { ...img('ch3_flower1', '/assets/photo_little_flower.jpg', '一朵长在维修通风管里的小花。', 'ch3_flower2'), memoryAnchor: 'white_flower' },
  c('ch3_flower2', [
    { text: '【你上报了吗】', nextId: 'ch3_flower3' },
    { text: '【因为它挺努力的？】', nextId: 'ch3_flower3' },
  ]),
  n('ch3_flower3', '没有。', 'smile', 600, 'ch3_flower4'),
  n('ch3_flower4', '理论上这里不该长植物。', 'normal', 600, 'ch3_flower5'),
  n('ch3_flower5', '因为它挺努力的。', 'smile', 600, 'ch3_flower6'),
  n('ch3_flower6', '我准备偷偷养着。', 'smile', 1200, 'ch3_2'),
  n('ch3_2', '早。', 'normal', 600, 'ch3_3'),
  n('ch3_3', '问你个问题。', 'normal', 800, 'ch3_4'),
  c('ch3_4', [
    { text: '【你想确认我这边的天气？】', nextId: 'ch3_5' },
  ]),
  { id: 'ch3_5', speaker: 'nova', type: 'text', content: '今天下雨了吗？', emotion: 'normal', delay: 2000, nextId: 'ch3_6' },
  c('ch3_6', [
    { text: '【你怎么知道】', nextId: 'ch3_7a' },
    { text: '【没有】', nextId: 'ch3_7b' },
    { text: '【你醒来时听见雨声了？】', nextId: 'ch3_7c' },
  ]),
  n('ch3_7a', '？', 'normal', 600, 'ch3_8'),
  n('ch3_7b', '是吗。', 'normal', 600, 'ch3_8'),
  n('ch3_7c', '我不知道啊。', 'normal', 600, 'ch3_8'),
  n('ch3_8', '所以才问。', 'normal', 600, 'ch3_9'),
  c('ch3_9', [
    { text: '【你昨天说过喜欢下雨】', nextId: 'ch3_10' },
  ]),
  n('ch3_10', '这样吗。', 'normal', 600, 'ch3_11'),
  n('ch3_11', '怪不得我一醒来就在想。', 'normal', 600, 'ch3_12'),
  n('ch3_12', '奇怪。', 'normal', 400, 'ch3_13'),
  n('ch3_13', '总觉得自己昨天好像见过雨。', 'normal', 1500, 'ch3_dream1'),
  // Dream repeat
  d('ch3_dream1', 1500, 'ch3_dream2'),
  c('ch3_dream2', [
    { text: '【又做梦了？】', nextId: 'ch3_dream3' },
  ]),
  n('ch3_dream3', '嗯。', 'normal', 400, 'ch3_dream4'),
  n('ch3_dream4', '而且还是那个梦。', 'normal', 800, 'ch3_dream5'),
  c('ch3_dream5', [
    { text: '【还是那个观测室的梦？】', nextId: 'ch3_dream6' },
  ]),
  n('ch3_dream6', '我站在观测室。', 'normal', 600, 'ch3_dream7'),
  n('ch3_dream7', '你站在我旁边。', 'normal', 400, 'ch3_dream8'),
  n('ch3_dream8', '但我看不清脸。', 'normal', 600, 'ch3_dream9'),
  n('ch3_dream9', '然后你说：', 'normal', 600, 'ch3_dream10'),
  { id: 'ch3_dream10', speaker: 'nova', type: 'text', content: '"别去那里。"', emotion: 'normal', delay: 2000, nextId: 'ch3_dream11' },
  c('ch3_dream11', [
    { text: '【哪里】', nextId: 'ch3_dream12' },
  ]),
  n('ch3_dream12', '不知道。', 'normal', 600, 'ch3_dream13'),
  n('ch3_dream13', '梦到这里就醒了。', 'normal', 1500, 'ch3_creep1'),
  d('ch3_creep1', 2000, 'ch3_creep2'),
  n('ch3_creep2', '你有没有觉得。', 'normal', 600, 'ch3_creep3'),
  n('ch3_creep3', '最近越来越诡异了。', 'normal', 800, 'ch3_creep4'),
  c('ch3_creep4', [
    { text: '【有一点】', nextId: 'ch3_creep5' },
    { text: '【确实】', nextId: 'ch3_creep5' },
    { text: '【你压力太大了】', nextId: 'ch3_creep5' },
  ]),
  n('ch3_creep5', '希望是最后一个。', 'normal', 600, 'ch3_creep6'),
  n('ch3_creep6', '我不想精神出问题。', 'smile', 600, 'ch3_creep7'),
  n('ch3_creep7', '医疗舱很贵。', 'smile', 2000, 'ch3_lunch1'),
  // Lunch
  ts('ch3_lunch1', '13:11', 'ch3_lunch2'),
  n('ch3_lunch2', '我刚到食堂', 'normal', 400, 'ch3_lunch3'),
  n('ch3_lunch3', '他们今天说有牛排', 'normal', 800, 'ch3_lunch4'),
  c('ch3_lunch4', [
    { text: '【有这么夸张吗？】', nextId: 'ch3_lunch5' },
  ]),
  n('ch3_lunch5', '但我现在有点怀疑', 'smile', 600, 'ch3_lunch6'),
  n('ch3_lunch6', '这东西到底算不算食物', 'normal', 400, 'ch3_lunch7'),
  n('ch3_lunch7', '我发你看看', 'smile', 1500, 'ch3_lunch8'),
  d('ch3_lunch8', 1500, 'ch3_lunch9'),
  // Send steak photo
  t('ch3_lunch9', 2000, 'ch3_steak'),
  { ...img('ch3_steak', '/assets/photo_steak.jpg', '别问。\n问就是科研事故。', 'ch3_reflection1'), memoryAnchor: 'steak' },
  // Reflection
  d('ch3_reflection1', 2000, 'ch3_ref1'),
  n('ch3_ref1', '等一下', 'normal', 600, 'ch3_ref2'),
  n('ch3_ref2', '有点不对', 'normal', 400, 'ch3_ref3'),
  c('ch3_ref3', [
    { text: '【你那边怎么了？】', nextId: 'ch3_ref4' },
  ]),
  n('ch3_ref4', '我刚刚好像看见一个人', 'normal', 600, 'ch3_ref5'),
  n('ch3_ref5', '在观测窗那边', 'normal', 800, 'ch3_ref6'),
  c('ch3_ref6', [
    { text: '【你看到谁了？】', nextId: 'ch3_ref7' },
  ]),
  { id: 'ch3_ref7', speaker: 'nova', type: 'text', content: '……\n我自己', emotion: 'normal', delay: 2500, nextId: 'ch3_ref8' },
  c('ch3_ref8', [
    { text: '【？？？】', nextId: 'ch3_ref9' },
  ]),
  n('ch3_ref9', '先别紧张', 'normal', 600, 'ch3_ref10'),
  n('ch3_ref10', '也可能是反光', 'normal', 600, 'ch3_ref11'),
  n('ch3_ref11', '观测窗有时候会这样', 'normal', 800, 'ch3_ref12'),
  c('ch3_ref12', [
    { text: '【你确定不是反光吗？】', nextId: 'ch3_ref13' },
  ]),
  n('ch3_ref13', '...', 'normal', 800, 'ch3_ref14'),
  n('ch3_ref14', '不确定。', 'normal', 600, 'ch3_ref15'),
  n('ch3_ref15', '因为她看着我。', 'normal', 1500, 'ch3_ref16'),
  c('ch3_ref16', [
    { text: '【你看到的不是普通反光？】', nextId: 'ch3_ref17' },
  ]),
  n('ch3_ref17', '反光不会看着我。', 'normal', 600, 'ch3_ref18'),
  n('ch3_ref18', '对吧？', 'normal', 1500, 'ch3_ref19'),
  d('ch3_ref19', 2000, 'ch3_ref20'),
  n('ch3_ref20', '算了。', 'normal', 600, 'ch3_ref21'),
  n('ch3_ref21', '当我没说。', 'normal', 600, 'ch3_ref22'),
  n('ch3_ref22', '你别露出那种表情。', 'smile', 800, 'ch3_ref23'),
  c('ch3_ref23', [
    { text: '【我哪有什么表情】', nextId: 'ch3_ref24' },
  ]),
  n('ch3_ref24', '就是那种。', 'smile', 600, 'ch3_ref25'),
  n('ch3_ref25', '"完了她要疯了"的表情。', 'smile', 800, 'ch3_ref26'),
  c('ch3_ref26', [
    { text: '【哈哈哈哈】', nextId: 'ch3_ref27' },
  ]),
  n('ch3_ref27', '我就知道。', 'smile', 600, 'ch3_ref28'),
  n('ch3_ref28', '过分。', 'smile', 2000, 'ch3_disconnect1'),
  // Disconnect event
  ts('ch3_disconnect1', '18:26', 'ch3_dc1'),
  g('ch3_dc1', '通讯中断', 1500, 'ch3_dc2', 2),
  { id: 'ch3_dc2', speaker: 'system', type: 'glitch', content: '尝试重连……', delay: 2000, nextId: 'ch3_dc3', isGlitch: true, glitchLevel: 2 },
  { id: 'ch3_dc3', speaker: 'system', type: 'glitch', content: '重连失败', delay: 1500, nextId: 'ch3_dc4', isGlitch: true, glitchLevel: 2 },
  { id: 'ch3_dc4', speaker: 'system', type: 'glitch', content: '重连失败', delay: 1500, nextId: 'ch3_dc5', isGlitch: true, glitchLevel: 2 },
  { id: 'ch3_dc5', speaker: 'system', type: 'glitch', content: '重连成功', delay: 1000, nextId: 'ch3_dc6', glitchLevel: 1 },
  n('ch3_dc6', '……', 'normal', 600, 'ch3_dc6b'),
  n('ch3_dc6b', '你还在吗？', 'normal', 800, 'ch3_dc7'),
  c('ch3_dc7', [
    { text: '【在】', nextId: 'ch3_dc8' },
  ]),
  n('ch3_dc8', '太好了。', 'normal', 600, 'ch3_dc9'),
  n('ch3_dc9', '刚刚系统断了。', 'normal', 600, 'ch3_dc10'),
  n('ch3_dc10', '我还以为失去连接了。', 'normal', 1200, 'ch3_dc11'),
  c('ch3_dc11', [
    { text: '【断线时你那边发生了什么】', nextId: 'ch3_dc12' },
  ]),
  n('ch3_dc12', '不知道。', 'normal', 600, 'ch3_dc13'),
  n('ch3_dc13', '但通讯日志出现了一段东西。', 'normal', 800, 'ch3_dc14'),
  c('ch3_dc14', [
    { text: '【日志里出现了异常记录？】', nextId: 'ch3_dc15' },
  ]),
  n('ch3_dc15', '你最好自己看。', 'normal', 1000, 'ch3_log1'),
  // Log file
  f('ch3_log1', '通讯日志.txt', '连接建立\n连接建立\n连接建立\n连接建立\n连接建立\n连接建立\n连接建立\n\n第七次连接成功', 'ch3_log2'),
  c('ch3_log2', [
    { text: '【这些连接记录是同一条通讯？】', nextId: 'ch3_log3' },
  ]),
  n('ch3_log3', '重点不是这个。', 'normal', 600, 'ch3_log4'),
  n('ch3_log4', '你往下看。', 'normal', 800, 'ch3_log5'),
  // Show the key line
  { id: 'ch3_log5', speaker: 'system', type: 'file', content: '日志最后一条||第七次连接成功', nextId: 'ch3_log6' },
  n('ch3_log6', '又是这句话。', 'normal', 600, 'ch3_log7'),
  n('ch3_log7', '第四天了。', 'normal', 400, 'ch3_log8'),
  n('ch3_log8', '我已经开始讨厌数字七了。', 'smile', 800, 'ch3_log9'),
  c('ch3_log9', [
    { text: '【也许只是程序错误】', nextId: 'ch3_log10' },
  ]),
  n('ch3_log10', '希望如此。', 'normal', 600, 'ch3_log11'),
  n('ch3_log11', '但有个问题。', 'normal', 800, 'ch3_log12'),
  c('ch3_log12', [
    { text: '【日志时间不对？】', nextId: 'ch3_log13' },
  ]),
  n('ch3_log13', '这条日志时间。', 'normal', 600, 'ch3_log14'),
  n('ch3_log14', '是三个月前。', 'normal', 1500, 'ch3_log15'),
  c('ch3_log15', [
    { text: '【？？？】', nextId: 'ch3_log16' },
  ]),
  n('ch3_log16', 'Aurora号三个月前还没出发。', 'normal', 800, 'ch3_log17'),
  n('ch3_log17', '所以。', 'normal', 400, 'ch3_log18'),
  n('ch3_log18', '它不应该存在。', 'normal', 2000, 'ch3_scared'),
  // Nova gets scared
  d('ch3_scared', 2000, 'ch3_scared1'),
  n('ch3_scared1', '我突然有点害怕。', 'sad', 1500, 'ch3_scared2'),
  c('ch3_scared2', [
    { text: '【别怕】', nextId: 'ch3_scared3' },
    { text: '【我在】', nextId: 'ch3_scared3' },
    { text: '【一定有原因】', nextId: 'ch3_scared3' },
  ]),
  n('ch3_scared3', '嗯。', 'normal', 600, 'ch3_scared4'),
  n('ch3_scared4', '谢谢。', 'normal', 800, 'ch3_scared5'),
  n('ch3_scared5', '不过。', 'normal', 600, 'ch3_scared6'),
  n('ch3_scared6', '如果有一天。', 'normal', 600, 'ch3_scared7'),
  n('ch3_scared7', '我真的忘记什么。', 'normal', 600, 'ch3_scared8'),
  n('ch3_scared8', '你会告诉我吗？', 'normal', 800, 'ch3_scared9'),
  c('ch3_scared9', [
    { text: '【会】', nextId: 'ch3_scared10' },
    { text: '【当然】', nextId: 'ch3_scared10' },
  ]),
  n('ch3_scared10', '那就好。', 'smile', 800, 'ch3_scared11'),
  n('ch3_scared11', '因为我开始觉得。', 'normal', 600, 'ch3_scared12'),
  n('ch3_scared12', '有些东西正在从我脑子里消失。', 'sad', 1500, 'ch3_gn1'),
  // Goodnight
  d('ch3_gn1', 1500, 'ch3_gn2'),
  n('ch3_gn2', '好了。', 'normal', 600, 'ch3_gn3'),
  n('ch3_gn3', '我今天先缓一缓', 'normal', 800, 'ch3_gn4'),
  c('ch3_gn4', [
    { text: '【晚安】', nextId: 'ch3_gn5' },
  ]),
  n('ch3_gn5', '晚安。', 'normal', 2000, 'ch3_gn6'),
  d('ch3_gn6', 2000, 'ch3_gn7'),
  d('ch3_gn7', 1500, 'ch3_gn8'),
  n('ch3_gn8', '还有。', 'normal', 800, 'ch3_gn9'),
  n('ch3_gn9', '如果以后我说了一些奇怪的话。', 'normal', 600, 'ch3_gn10'),
  n('ch3_gn10', '别立刻相信。', 'normal', 800, 'ch3_gn11'),
  c('ch3_gn11', [
    { text: '【你怕自己的记忆不可靠？】', nextId: 'ch3_gn12' },
  ]),
  n('ch3_gn12', '因为。', 'normal', 600, 'ch3_gn13'),
  n('ch3_gn13', '我最近越来越分不清。', 'normal', 600, 'ch3_gn14'),
  n('ch3_gn14', '哪些记忆是我的。', 'normal', 400, 'ch3_gn15'),
  n('ch3_gn15', '哪些不是。', 'sad', 1500, 'ch3_offline'),
  s('ch3_offline', 'Nova 已离线', 2000, 'ch3_draft'),
  ts('ch3_draft', '深夜 03:07', 'ch3_draft1'),
  draft('ch3_draft1', '我找到她了\n她就在观测室', 'CH4_START', '加密草稿 / 03:07'),
];

// ============================================
// CHAPTER 4: MEMORY (Day 5) - The heartbreak chapter
// ============================================
const chapter4Nodes: StoryNode[] = [
  ch('CH4_START', '第四章：记忆', 'ch4_0'),
  ts('ch4_0', '第五天 09:18', 'ch4_1'),
  s('ch4_1', '收到新消息', 1000, 'ch4_2'),
  // THE RESET
  n('ch4_2', '你好。', 'normal', 800, 'ch4_3'),
  n('ch4_3', '请问...', 'normal', 800, 'ch4_4'),
  { id: 'ch4_4', speaker: 'nova', type: 'text', content: '我们认识吗？', emotion: 'normal', delay: 2500, nextId: 'ch4_5' },
  c('ch4_5', [
    { text: '【Nova？】', nextId: 'ch4_6' },
    { text: '【你在开玩笑吗，Nova？】', nextId: 'ch4_joke1' },
    { text: '【当然认识，你是 Nova】', nextId: 'ch4_sure1' },
  ]),
  n('ch4_6', '……', 'sad', 700, 'ch4_7'),
  n('ch4_7', '你刚刚叫我什么？', 'normal', 800, 'ch4_8'),
  n('ch4_8', '抱歉，我应该认识你吗？', 'sad', 1200, 'ch4_12'),
  n('ch4_joke1', '我希望是。', 'sad', 600, 'ch4_joke2'),
  n('ch4_joke2', '但我现在真的笑不出来。', 'sad', 800, 'ch4_joke3'),
  n('ch4_joke3', '抱歉，我好像不记得你了。', 'sad', 1200, 'ch4_12'),
  n('ch4_sure1', '等等。', 'normal', 600, 'ch4_sure2'),
  n('ch4_sure2', '你说得太确定了。', 'normal', 800, 'ch4_sure3'),
  n('ch4_sure3', '可我这里一点印象都没有。', 'sad', 1200, 'ch4_12'),
  n('ch4_12', '等等。', 'normal', 600, 'ch4_13'),
  n('ch4_13', '你为什么知道我的名字？', 'normal', 800, 'ch4_14'),
  c('ch4_14', [
    { text: '【当然是你告诉我的】', nextId: 'ch4_15' },
    { text: '【我们之前聊过很多】', nextId: 'ch4_many1' },
    { text: '【我可以证明】', nextId: 'ch4_prove1' },
  ]),
  n('ch4_15', '我告诉你的？', 'normal', 800, 'ch4_16'),
  n('ch4_16', '什么时候？', 'normal', 800, 'ch4_record1'),
  n('ch4_many1', '很多？', 'normal', 700, 'ch4_many2'),
  n('ch4_many2', '可我这里一点记录都没有。', 'sad', 900, 'ch4_record1'),
  n('ch4_prove1', '证明？', 'normal', 600, 'ch4_prove2'),
  n('ch4_prove2', '你要怎么证明？', 'normal', 900, 'ch4_record1'),
  n('ch4_record1', '而且记录显示。', 'normal', 600, 'ch4_record2'),
  n('ch4_record2', '我昨天刚从短期休眠舱出来。', 'normal', 900, 'ch4_record3'),
  n('ch4_record3', '休眠记录是72小时。', 'normal', 800, 'ch4_21'),
  c('ch4_21', [
    { text: '【休眠记录和通讯记录对不上？】', nextId: 'ch4_22' },
  ]),
  n('ch4_22', '对。', 'normal', 500, 'ch4_23'),
  n('ch4_23', '通讯记录里有很多空白。', 'normal', 700, 'ch4_24'),
  n('ch4_24', '像被删除了一样。', 'normal', 900, 'ch4_25'),
  n('ch4_25', '如果我们认识。', 'normal', 700, 'ch4_26'),
  n('ch4_26', '你应该知道一些我没告诉过别人的事。', 'normal', 1200, 'ch4_27'),
  // N7 - the first knife
  c('ch4_27', [
    { text: '【你七岁时捡到过一只橘猫】', nextId: 'ch4_n7_cat' },
    { text: '【它叫 N7】', nextId: 'ch4_n7_name' },
    { text: '【你说它胖得像违法建筑】', nextId: 'ch4_n7_building' },
  ]),
  n('ch4_n7_cat', '……', 'normal', 900, 'ch4_n7_cat2'),
  n('ch4_n7_cat2', '你怎么知道这个？', 'normal', 900, 'ch4_n7_8'),
  n('ch4_n7_name', '等等。', 'normal', 600, 'ch4_n7_name2'),
  { id: 'ch4_n7_name2', speaker: 'nova', type: 'text', content: '你刚刚说 N7？', emotion: 'normal', delay: 1200, nextId: 'ch4_n7_8' },
  n('ch4_n7_building', '……', 'normal', 900, 'ch4_n7_building2'),
  n('ch4_n7_building2', '这句话确实像我会说的。', 'normal', 900, 'ch4_n7_8'),
  c('ch4_n7_8', [
    { text: '【你告诉过我】', nextId: 'ch4_n7_told' },
    { text: '【你只是忘了】', nextId: 'ch4_n7_forgot' },
    { text: '【我一直记得】', nextId: 'ch4_n7_remember' },
  ]),
  n('ch4_n7_told', '可我完全没有印象。', 'sad', 900, 'ch4_n7_11'),
  n('ch4_n7_forgot', '“只是忘了”。', 'normal', 700, 'ch4_n7_forgot2'),
  n('ch4_n7_forgot2', '你说得倒是轻巧。', 'sad', 900, 'ch4_n7_11'),
  n('ch4_n7_remember', '……', 'normal', 900, 'ch4_n7_remember2'),
  n('ch4_n7_remember2', '不知道为什么，这句话听起来让我有点难过。', 'sad', 1200, 'ch4_n7_11'),
  d('ch4_n7_11', 2000, 'ch4_n7_12'),
  n('ch4_n7_12', '...', 'normal', 800, 'ch4_n7_13'),
  n('ch4_n7_13', '好吧。', 'normal', 600, 'ch4_n7_14'),
  n('ch4_n7_14', '至少你知道N7。', 'normal', 600, 'ch4_n7_15'),
  n('ch4_n7_15', '这让我没法把你当骗子。', 'smile', 1500, 'ch4_n7_16'),
  d('ch4_n7_16', 2000, 'ch4_n7_17'),
  n('ch4_n7_17', '奇怪。', 'normal', 600, 'ch4_n7_18'),
  n('ch4_n7_18', '虽然我不记得你。', 'normal', 600, 'ch4_n7_19'),
  n('ch4_n7_19', '但不知道为什么。', 'normal', 600, 'ch4_n7_20'),
  n('ch4_n7_20', '和你聊天的时候。', 'normal', 600, 'ch4_n7_21'),
  n('ch4_n7_21', '有种安心感。', 'smile', 2000, 'ch4_folder1'),
  // Hidden folder
  ts('ch4_folder1', '11:42', 'ch4_fold2'),
  n('ch4_fold2', '我检查了一下数据库。', 'normal', 600, 'ch4_fold3'),
  n('ch4_fold3', '发现一件怪事。', 'normal', 800, 'ch4_fold4'),
  c('ch4_fold4', [
    { text: '【隐藏文件夹属于你？】', nextId: 'ch4_fold5' },
  ]),
  n('ch4_fold5', '有个隐藏文件夹。', 'normal', 600, 'ch4_fold6'),
  n('ch4_fold6', '权限属于我。', 'normal', 400, 'ch4_fold7'),
  n('ch4_fold7', '但我从没见过。', 'normal', 800, 'ch4_fold8'),
  c('ch4_fold8', [
    { text: '【打开】', nextId: 'ch4_fold9' },
  ]),
  n('ch4_fold9', '正在试。', 'normal', 1000, 'ch4_fold10'),
  n('ch4_fold10', '...', 'normal', 800, 'ch4_fold11'),
  n('ch4_fold11', '打不开。', 'normal', 600, 'ch4_fold12'),
  n('ch4_fold12', '需要双重认证。', 'normal', 800, 'ch4_fold13'),
  c('ch4_fold13', [
    { text: '【另一个认证是谁】', nextId: 'ch4_fold14' },
  ]),
  n('ch4_fold14', '不知道。', 'normal', 600, 'ch4_fold15'),
  n('ch4_fold15', '显示：', 'normal', 400, 'ch4_fold16'),
  { id: 'ch4_fold16', speaker: 'system', type: 'file', content: '双重认证者||Nova Arlen\nNova Arlen', nextId: 'ch4_id_restore' },
  s('ch4_id_restore', '通讯档案已恢复', 800, 'ch4_id_confirm'),
  { ...s('ch4_id_confirm', '身份确认：NOVA ARLEN', 900, 'ch4_id_photo'), contactStage: 'verified' },
  img('ch4_id_photo', '/assets/nova_id_photo.png', 'Nova Arlen / Aurora Navigation 身份档案', 'ch4_fold17'),
  c('ch4_fold17', [
    { text: '【两个Nova？】', nextId: 'ch4_fold18' },
  ]),
  n('ch4_fold18', '我也希望这是系统Bug。', 'normal', 600, 'ch4_fold19'),
  n('ch4_fold19', '但系统从不重复登记身份。', 'normal', 600, 'ch4_fold20'),
  n('ch4_fold20', '至少理论上不会。', 'normal', 1500, 'ch4_headache'),
  d('ch4_headache', 2000, 'ch4_head1'),
  n('ch4_head1', '等等。', 'normal', 600, 'ch4_head2'),
  n('ch4_head2', '我突然头疼。', 'sad', 800, 'ch4_head3'),
  c('ch4_head3', [
    { text: '【去医疗舱】', nextId: 'ch4_head4' },
  ]),
  n('ch4_head4', '不用。', 'normal', 600, 'ch4_head5'),
  n('ch4_head5', '只是...', 'normal', 600, 'ch4_head6'),
  n('ch4_head6', '脑子里闪过一个画面。', 'normal', 800, 'ch4_head7'),
  c('ch4_head7', [
    { text: '【你看到观测室了吗】', nextId: 'ch4_head8' },
  ]),
  n('ch4_head8', '观测室。', 'normal', 600, 'ch4_head9'),
  n('ch4_head9', '一个女孩站在那里。', 'normal', 600, 'ch4_head10'),
  n('ch4_head10', '背对着我。', 'normal', 800, 'ch4_head11'),
  c('ch4_head11', [
    { text: '【然后】', nextId: 'ch4_head12' },
  ]),
  n('ch4_head12', '她说：', 'normal', 800, 'ch4_head13'),
  { id: 'ch4_head13', speaker: 'nova', type: 'text', content: '"不要相信第七次。"', emotion: 'sad', delay: 2500, nextId: 'ch4_head14' },
  c('ch4_head14', [
    { text: '【第七次是指现在这一次？】', nextId: 'ch4_head15' },
  ]),
  n('ch4_head15', '不知道。', 'normal', 600, 'ch4_head16'),
  n('ch4_head16', '而且最奇怪的是。', 'normal', 600, 'ch4_head17'),
  n('ch4_head17', '那个声音。', 'normal', 600, 'ch4_head18'),
  n('ch4_head18', '就是我的声音。', 'normal', 2000, 'ch4_trust1'),
  // Trust
  ts('ch4_trust1', '18:33', 'ch4_trust2'),
  n('ch4_trust2', '我开始相信你了。', 'normal', 800, 'ch4_trust3'),
  c('ch4_trust3', [
    { text: '【是因为 N7 吗？】', nextId: 'ch4_trust4' },
    { text: '【终于愿意信我了？】', nextId: 'ch4_trust_tease' },
    { text: '【你不用勉强相信我】', nextId: 'ch4_trust_gentle' },
  ]),
  n('ch4_trust4', '不只是 N7。', 'normal', 600, 'ch4_trust5'),
  n('ch4_trust_tease', '别说得像我很难搞一样。', 'smile', 600, 'ch4_trust_tease2'),
  n('ch4_trust_tease2', '虽然突然多出一个“熟人”，正常人都会警惕吧。', 'normal', 1000, 'ch4_trust5'),
  n('ch4_trust_gentle', '……', 'normal', 700, 'ch4_trust_gentle2'),
  n('ch4_trust_gentle2', '你这么说，反而让我更想相信你了。', 'normal', 1000, 'ch4_trust5'),
  n('ch4_trust5', '还有你说那些事的方式。', 'normal', 700, 'ch4_trust6'),
  n('ch4_trust6', '如果你想骗我。', 'normal', 400, 'ch4_trust7'),
  n('ch4_trust7', '完全没必要提醒N7。', 'normal', 600, 'ch4_trust8'),
  n('ch4_trust8', '那种细节编不出来，也没什么骗我的价值。', 'smile', 1500, 'ch4_trust9'),
  d('ch4_trust9', 1500, 'ch4_trust10'),
  // Vulnerable moment
  n('ch4_trust10', '其实。', 'normal', 600, 'ch4_trust11'),
  n('ch4_trust11', '我有点害怕。', 'sad', 800, 'ch4_trust12'),
  c('ch4_trust12', [
    { text: '【害怕我说的是真的？】', nextId: 'ch4_trust13' },
    { text: '【害怕想起来？】', nextId: 'ch4_trust_memory' },
  ]),
  n('ch4_trust13', '害怕我真的忘记了什么重要的人。', 'sad', 1500, 'ch4_trust14'),
  n('ch4_trust_memory', '也许吧。', 'sad', 700, 'ch4_trust_memory2'),
  n('ch4_trust_memory2', '如果记忆是被删掉的，那它被删掉之前一定发生过很糟糕的事。', 'sad', 1500, 'ch4_trust14'),
  c('ch4_trust14', [
    { text: '【......】', nextId: 'ch4_trust15' },
  ]),
  n('ch4_trust15', '如果是那样。', 'sad', 600, 'ch4_trust16'),
  n('ch4_trust16', '那一定很糟糕。', 'sad', 800, 'ch4_trust17'),
  c('ch4_trust17', [
    { text: '【忘记别人也会很痛吗】', nextId: 'ch4_trust18' },
  ]),
  n('ch4_trust18', '因为。', 'normal', 600, 'ch4_trust19'),
  n('ch4_trust19', '被忘记已经很难过了。', 'sad', 600, 'ch4_trust20'),
  n('ch4_trust20', '忘记别人。', 'normal', 400, 'ch4_trust21'),
  n('ch4_trust21', '其实更难过。', 'sad', 2000, 'ch4_gn1'),
  // Goodnight
  ts('ch4_gn1', '23:17', 'ch4_gn2'),
  n('ch4_gn2', '我要睡了。', 'normal', 600, 'ch4_gn3'),
  c('ch4_gn3', [
    { text: '【晚安】', nextId: 'ch4_gn4' },
  ]),
  n('ch4_gn4', '晚安。', 'normal', 2000, 'ch4_gn5'),
  d('ch4_gn5', 2000, 'ch4_gn6'),
  d('ch4_gn6', 1500, 'ch4_gn7'),
  n('ch4_gn7', '那个。', 'normal', 800, 'ch4_gn8'),
  c('ch4_gn8', [
    { text: '【你还想说什么】', nextId: 'ch4_gn9' },
  ]),
  n('ch4_gn9', '虽然我不记得以前。', 'normal', 600, 'ch4_gn10'),
  n('ch4_gn10', '但如果你说的是真的。', 'normal', 600, 'ch4_gn11'),
  n('ch4_gn11', '谢谢你一直记得我。', 'smile', 1500, 'ch4_offline'),
  s('ch4_offline', 'Nova 已离线', 2000, 'ch4_log'),
  ts('ch4_log', '凌晨 02:41', 'ch4_log1'),
  f('ch4_log1', '隐藏日志：NOVA-07', '如果你正在阅读这段记录。\n说明我已经忘记他了。\n请不要尝试恢复记忆。\n不要寻找观测室中的我。\n不要打开第七协议。\n尤其不要相信我。\n\n因为我已经失败六次了。', 'CH5A_START'),
];

// ============================================
// CHAPTER 5A: TRUTH (Part 1) (Day 6)
// ============================================
const chapter5aNodes: StoryNode[] = [
  ch('CH5A_START', '第五章：真相（上）', 'ch5a_0'),
  ts('ch5a_0', '第六天 07:11', 'ch5a_1'),
  s('ch5a_1', '收到新消息', 800, 'ch5a_2'),
  n('ch5a_2', '我没睡。', 'normal', 800, 'ch5a_3'),
  c('ch5a_3', [
    { text: '【你打开那个文件夹了？】', nextId: 'ch5a_4' },
  ]),
  n('ch5a_4', '我打开了那个文件夹。', 'normal', 800, 'ch5a_5'),
  c('ch5a_5', [
    { text: '【怎么打开的】', nextId: 'ch5a_6' },
  ]),
  n('ch5a_6', '不知道。', 'normal', 600, 'ch5a_7'),
  n('ch5a_7', '昨晚睡觉前打不开。', 'normal', 400, 'ch5a_8'),
  n('ch5a_8', '今天醒来就能打开了。', 'normal', 600, 'ch5a_9'),
  n('ch5a_9', '像有人帮我授权了一样。', 'normal', 800, 'ch5a_10'),
  c('ch5a_10', [
    { text: '【里面是什么】', nextId: 'ch5a_11' },
  ]),
  n('ch5a_11', '记录。', 'normal', 400, 'ch5a_12'),
  n('ch5a_12', '很多记录。', 'normal', 400, 'ch5a_13'),
  n('ch5a_13', '全都是我留下的。', 'normal', 1000, 'ch5a_protocol0'),
  n('ch5a_protocol0', '还有一份协议说明。', 'normal', 800, 'ch5a_protocol1'),
  f('ch5a_protocol1', '回滚记录摘录', '回滚范围：Aurora号任务状态\n船员记忆同步：已重置\n航行记录回滚：完成\n异常残留：Nova Arlen / UNKNOWN', 'ch5a_protocol2'),
  f('ch5a_protocol2', 'SEVENTH_PROTOCOL / 权限说明', '协议目标：维持 Aurora 号任务延续\n回滚对象：任务状态 / 船员认知 / 航行系统\n允许保留：最低限度航行数据\n禁止保留：完整个人记忆\n异常记录：外部索引已生成', 'ch5a_protocol3'),
  n('ch5a_protocol3', '看懂了吗。', 'normal', 700, 'ch5a_protocol4'),
  n('ch5a_protocol4', '第七协议原本不是用来困住人的。', 'normal', 700, 'ch5a_protocol5'),
  n('ch5a_protocol5', '它更像一套紧急安全阀。', 'normal', 700, 'ch5a_protocol6'),
  n('ch5a_protocol6', 'Aurora 号任务被判定为不可恢复失败时。', 'normal', 800, 'ch5a_protocol7'),
  n('ch5a_protocol7', '它会把任务状态拉回上一个安全记录点。', 'normal', 1000, 'ch5a_protocol8'),
  n('ch5a_protocol8', '理论上，它只该保留最低限度的航行数据。', 'normal', 900, 'ch5a_protocol9'),
  n('ch5a_protocol9', '不该保留人的记忆。', 'normal', 800, 'ch5a_protocol10'),
  n('ch5a_protocol10', '更不该保留我。', 'sad', 1000, 'ch5a_protocol11'),
  n('ch5a_protocol11', '它不是想救我。', 'normal', 900, 'ch5a_protocol12'),
  n('ch5a_protocol12', '它只是想让任务继续。', 'normal', 1100, 'ch5a_logs1'),
  // Logs from past selves
  f('ch5a_logs1', '循环日志集', '日志001：如果你看到这里，说明循环已经开始。\n\n日志002：不要相信系统时间。\n\n日志003：不要进入观测室。\n\n日志004：如果你收到来自自己的消息，删除它。\n\n日志007：如果你已经认识他，请善待他。\n\n日志012：他会记得一切。所以不要让他知道真相。', 'ch5a_logs2'),
  c('ch5a_logs2', [
    { text: '【日志后面还有警告？】', nextId: 'ch5a_logs3' },
  ]),
  n('ch5a_logs3', '后面开始不对劲了。', 'normal', 600, 'ch5a_logs4'),
  c('ch5a_logs4', [
    { text: '【第七次是指现在这一次？】', nextId: 'ch5a_logs5' },
  ]),
  n('ch5a_logs5', '你自己看。', 'normal', 800, 'ch5a_logs6'),
  // More revealing logs
  f('ch5a_logs6', '日志007-012', '日志007：如果你已经认识他，请善待他。\n\n日志012：他会记得一切。所以不要让他知道真相。\n\nNova，不要再问了。继续循环下去，对你们都好。', 'ch5a_logs7'),
  c('ch5a_logs7', [
    { text: '【日志里的“他”是谁？】', nextId: 'ch5a_logs8' },
  ]),
  n('ch5a_logs8', '不知道。', 'normal', 600, 'ch5a_logs9'),
  n('ch5a_logs9', '后面还有。', 'normal', 800, 'ch5a_logs10'),
  n('ch5a_logs10', '最奇怪的是。', 'normal', 600, 'ch5a_logs11'),
  n('ch5a_logs11', '日志数量。', 'normal', 800, 'ch5a_logs12'),
  c('ch5a_logs12', [
    { text: '【有多少份日志】', nextId: 'ch5a_logs13' },
  ]),
  n('ch5a_logs13', '六份。', 'normal', 600, 'ch5a_logs14'),
  n('ch5a_logs14', '正好六个版本。', 'normal', 800, 'ch5a_logs15'),
  c('ch5a_logs15', [
    { text: '【六份日志对应六次循环？】', nextId: 'ch5a_logs16' },
  ]),
  n('ch5a_logs16', '这些日志来自不同时间。', 'normal', 600, 'ch5a_logs17'),
  n('ch5a_logs17', '但内容互相矛盾。', 'normal', 600, 'ch5a_logs18'),
  n('ch5a_logs18', '像六个人写的。', 'normal', 2000, 'ch5a_obs1'),
  // Observatory visit
  ts('ch5a_obs1', '11:52', 'ch5a_obs2'),
  n('ch5a_obs2', '我去了观测室。', 'normal', 800, 'ch5a_obs3'),
  c('ch5a_obs3', [
    { text: '【你不是说别去】', nextId: 'ch5a_obs4' },
  ]),
  n('ch5a_obs4', '我知道。', 'normal', 400, 'ch5a_obs5'),
  n('ch5a_obs5', '但总得有人搞清楚发生什么。', 'normal', 800, 'ch5a_obs6'),
  c('ch5a_obs6', [
    { text: '【然后】', nextId: 'ch5a_obs7' },
  ]),
  n('ch5a_obs7', '里面有人。', 'normal', 1500, 'ch5a_obs8'),
  c('ch5a_obs8', [
    { text: '【观测室里的人是谁】', nextId: 'ch5a_obs9' },
  ]),
  { id: 'ch5a_obs9', speaker: 'nova', type: 'text', content: '我。', emotion: 'normal', delay: 2500, nextId: 'ch5a_obs10' },
  d('ch5a_obs10', 2000, 'ch5a_obs11'),
  c('ch5a_obs11', [
    { text: '【......】', nextId: 'ch5a_obs12' },
  ]),
  n('ch5a_obs12', '我知道听起来很蠢。', 'normal', 600, 'ch5a_obs13'),
  n('ch5a_obs13', '但她不是另一个活着的我。', 'normal', 600, 'ch5a_obs14'),
  n('ch5a_obs14', '更像一个由记忆和协议拼出来的残影。', 'normal', 600, 'ch5a_obs15'),
  n('ch5a_obs15', '她坐在观测窗前。像等了很久。', 'normal', 800, 'ch5a_obs16'),
  c('ch5a_obs16', [
    { text: '【你和她说话了吗】', nextId: 'ch5a_obs17' },
  ]),
  n('ch5a_obs17', '说了。', 'normal', 600, 'ch5a_obs18'),
  c('ch5a_obs18', [
    { text: '【她回答了吗】', nextId: 'ch5a_obs19' },
  ]),
  n('ch5a_obs19', '回答了。', 'normal', 600, 'ch5a_obs20'),
  c('ch5a_obs20', [
    { text: '【说了什么】', nextId: 'ch5a_obs21' },
  ]),
  n('ch5a_obs21', '她看着我。', 'normal', 600, 'ch5a_obs22'),
  n('ch5a_obs22', '第一句话是：', 'normal', 800, 'ch5a_obs23'),
  { id: 'ch5a_obs23', speaker: 'nova', type: 'text', content: '"已经第七次了？"', emotion: 'normal', delay: 2500, nextId: 'ch5a_obs24' },
  c('ch5a_obs24', [
    { text: '【然后】', nextId: 'ch5a_obs25' },
  ]),
  n('ch5a_obs25', '然后她笑了。', 'normal', 600, 'ch5a_obs26'),
  n('ch5a_obs26', '很难形容。', 'normal', 600, 'ch5a_obs27'),
  n('ch5a_obs27', '像松了一口气。', 'normal', 600, 'ch5a_obs28'),
  n('ch5a_obs28', '又像很难过。', 'sad', 800, 'ch5a_obs29'),
  c('ch5a_obs29', [
    { text: '【她还说什么】', nextId: 'ch5a_obs30' },
  ]),
  n('ch5a_obs30', '她问：', 'normal', 800, 'ch5a_obs31'),
  { id: 'ch5a_obs31', speaker: 'nova', type: 'text', content: '"他还在吗？"', emotion: 'normal', delay: 2500, nextId: 'ch5a_obs32' },
  c('ch5a_obs32', [
    { text: '【她问的是我吗？】', nextId: 'ch5a_obs33' },
  ]),
  n('ch5a_obs33', '我不知道。', 'normal', 600, 'ch5a_obs34'),
  n('ch5a_obs34', '我问她是谁。', 'normal', 600, 'ch5a_obs35'),
  n('ch5a_obs35', '她说：', 'normal', 800, 'ch5a_obs36'),
  { id: 'ch5a_obs36', speaker: 'nova', type: 'text', content: '"我是第六次的你。"', emotion: 'normal', delay: 3000, nextId: 'ch5a_obs37' },
  // After the revelation
  ts('ch5a_obs37', '17:34', 'ch5a_back1'),
  n('ch5a_back1', '我回来了。', 'normal', 800, 'ch5a_back2'),
  c('ch5a_back2', [
    { text: '【你还好吗】', nextId: 'ch5a_back3' },
  ]),
  n('ch5a_back3', '不好。', 'sad', 600, 'ch5a_back4'),
  n('ch5a_back4', '非常不好。', 'sad', 600, 'ch5a_back5'),
  n('ch5a_back5', '因为她给我看了东西。', 'normal', 800, 'ch5a_back6'),
  c('ch5a_back6', [
    { text: '【她给你看了录像？】', nextId: 'ch5a_back7' },
  ]),
  n('ch5a_back7', '录像。', 'normal', 400, 'ch5a_back8'),
  n('ch5a_back8', '六段录像。', 'normal', 600, 'ch5a_back9'),
  n('ch5a_back9', '全部是我。', 'normal', 400, 'ch5a_back10'),
  n('ch5a_back10', '全部死于不同事故。', 'sad', 1500, 'ch5a_vids1'),
  d('ch5a_vids1', 2000, 'ch5a_vids2'),
  c('ch5a_vids2', [
    { text: '【......】', nextId: 'ch5a_vids3' },
  ]),
  n('ch5a_vids3', '第一段。', 'normal', 400, 'ch5a_vids4'),
  n('ch5a_vids4', '引擎爆炸。', 'normal', 400, 'ch5a_vids5'),
  n('ch5a_vids5', '第二段。', 'normal', 400, 'ch5a_vids6'),
  n('ch5a_vids6', '能源崩溃。', 'normal', 400, 'ch5a_vids7'),
  n('ch5a_vids7', '第三段。', 'normal', 400, 'ch5a_vids8'),
  n('ch5a_vids8', '未知感染。', 'normal', 400, 'ch5a_vids9'),
  n('ch5a_vids9', '第四段。', 'normal', 400, 'ch5a_vids10'),
  n('ch5a_vids10', '系统失控。', 'normal', 400, 'ch5a_vids11'),
  n('ch5a_vids11', '第五段。', 'normal', 400, 'ch5a_vids12'),
  n('ch5a_vids12', '飞船解体。', 'normal', 800, 'ch5a_vids13'),
  c('ch5a_vids13', [
    { text: '【第六段是什么】', nextId: 'ch5a_vids14' },
  ]),
  n('ch5a_vids14', '没有死亡。', 'normal', 800, 'ch5a_vids15'),
  c('ch5a_vids15', [
    { text: '【第六段不是死亡记录？】', nextId: 'ch5a_vids16' },
  ]),
  n('ch5a_vids16', '第六段录像最后。', 'normal', 600, 'ch5a_vids17'),
  n('ch5a_vids17', '那个我看着镜头。', 'normal', 600, 'ch5a_vids18'),
  n('ch5a_vids18', '然后说：', 'normal', 800, 'ch5a_vids19'),
  { id: 'ch5a_vids19', speaker: 'nova', type: 'text', content: '"终于找到你了。"', emotion: 'sad', delay: 2500, nextId: 'ch5a_vids20' },
  c('ch5a_vids20', [
    { text: '【她说她找到了谁？】', nextId: 'ch5a_vids21' },
  ]),
  n('ch5a_vids21', '不知道。', 'normal', 600, 'ch5a_vids22'),
  n('ch5a_vids22', '因为录像后面被删掉了。', 'normal', 1500, 'ch5a_vids23'),
  d('ch5a_vids23', 1500, 'ch5a_vids24'),
  n('ch5a_vids24', '但我有预感。', 'normal', 600, 'ch5a_vids25'),
  n('ch5a_vids25', '她说的是你。', 'normal', 2000, 'ch5a_future'),
  // Future revelation
  ts('ch5a_future', '22:18', 'ch5a_fut1'),
  n('ch5a_fut1', '我发现了一件更糟糕的事。', 'normal', 800, 'ch5a_fut2'),
  c('ch5a_fut2', [
    { text: '【录像的时间也不对？】', nextId: 'ch5a_fut3' },
  ]),
  n('ch5a_fut3', '这些录像。', 'normal', 400, 'ch5a_fut4'),
  n('ch5a_fut4', '全都来自未来。', 'normal', 1500, 'ch5a_fut5'),
  c('ch5a_fut5', [
    { text: '【未来录像怎么会出现在现在？】', nextId: 'ch5a_fut6' },
  ]),
  n('ch5a_fut6', '最早的一段。', 'normal', 600, 'ch5a_fut7'),
  n('ch5a_fut7', '也是一年以后录的。', 'normal', 1500, 'ch5a_fut8'),
  c('ch5a_fut8', [
    { text: '【不可能】', nextId: 'ch5a_fut9' },
  ]),
  n('ch5a_fut9', '是啊。', 'normal', 600, 'ch5a_fut10'),
  n('ch5a_fut10', '所以问题来了。', 'normal', 600, 'ch5a_fut11'),
  n('ch5a_fut11', '为什么未来的我。', 'normal', 600, 'ch5a_fut12'),
  n('ch5a_fut12', '会把录像留给现在的我？', 'normal', 1500, 'ch5a_fut13'),
  d('ch5a_fut13', 1500, 'ch5a_fut14'),
  n('ch5a_fut14', '还有。', 'normal', 600, 'ch5a_fut15'),
  n('ch5a_fut15', '为什么每段录像最后。', 'normal', 600, 'ch5a_fut16'),
  n('ch5a_fut16', '都会提到你？', 'normal', 1500, 'ch5a_fut17'),
  // Typing indicator
  d('ch5a_fut17', 3000, 'ch5a_fut18'),
  d('ch5a_fut18', 2000, 'ch5a_fut19'),
  n('ch5a_fut19', '我开始怀疑一件事。', 'normal', 800, 'ch5a_fut20'),
  c('ch5a_fut20', [
    { text: '【你怀疑我也在循环里？】', nextId: 'ch5a_fut21' },
  ]),
  n('ch5a_fut21', '也许。', 'normal', 800, 'ch5a_fut22'),
  n('ch5a_fut22', '我不是唯一被困住的人。', 'normal', 1500, 'ch5a_offline'),
  s('ch5a_offline', 'Nova 已离线', 3000, 'ch5a_msg'),
  // Late night mysterious message
  ts('ch5a_msg', '凌晨 03:09', 'ch5a_msg1'),
  s('ch5a_msg1', '收到未知来源消息', 1500, 'ch5a_shadow_photo'),
  img('ch5a_shadow_photo', '/assets/nova_glitch.png', '通讯残影：NOVA-06', 'ch5a_msg2'),
  g('ch5a_msg2', '发送者：Nova？', 1000, 'ch5a_msg3'),
  { id: 'ch5a_msg3', speaker: 'system', type: 'glitch', content: '不要完全相信她。', delay: 1600, nextId: 'ch5a_msg4', isGlitch: true },
  { id: 'ch5a_msg4', speaker: 'system', type: 'glitch', content: '不是因为她会骗你。', delay: 1600, nextId: 'ch5a_msg5', isGlitch: true },
  { id: 'ch5a_msg5', speaker: 'system', type: 'glitch', content: '是因为她真的会忘。', delay: 1800, nextId: 'ch5a_msg6', isGlitch: true },
  { id: 'ch5a_msg6', speaker: 'system', type: 'glitch', content: '也不要完全相信我。', delay: 1600, nextId: 'ch5a_msg7', isGlitch: true },
  { id: 'ch5a_msg7', speaker: 'system', type: 'glitch', content: '我只是第六次留下来的残影。', delay: 1800, nextId: 'ch5a_msg8', isGlitch: true },
  { id: 'ch5a_msg8', speaker: 'system', type: 'glitch', content: '真正被困住的不是 Nova。', delay: 1800, nextId: 'ch5a_msg9', isGlitch: true },
  { id: 'ch5a_msg9', speaker: 'system', type: 'glitch', content: '是你。', delay: 2500, nextId: 'CH5B_START', isGlitch: true },
];

// ============================================
// CHAPTER 5B: TRUTH (Part 2) (Day 7)
// ============================================
const chapter5bNodes: StoryNode[] = [
  ch('CH5B_START', '第五章：真相（下）', 'ch5b_0'),
  ts('ch5b_0', '第七天 08:01', 'ch5b_1'),
  s('ch5b_1', '收到新消息', 800, 'ch5b_2'),
  n('ch5b_2', '我一晚上没睡。', 'normal', 800, 'ch5b_3'),
  c('ch5b_3', [
    { text: '【因为那条消息？】', nextId: 'ch5b_4' },
  ]),
  n('ch5b_4', '嗯。', 'normal', 400, 'ch5b_5'),
  n('ch5b_5', '尤其是最后一句。', 'normal', 600, 'ch5b_6'),
  n('ch5b_6', '"循环中心是你。"', 'normal', 800, 'ch5b_7'),
  n('ch5b_7', '我想不通。', 'normal', 1500, 'ch5b_8'),
  c('ch5b_8', [
    { text: '【我也想不通】', nextId: 'ch5b_9' },
  ]),
  n('ch5b_9', '所以我决定做件危险的事。', 'normal', 800, 'ch5b_10'),
  c('ch5b_10', [
    { text: '【你要去见第六次的自己？】', nextId: 'ch5b_11' },
  ]),
  n('ch5b_11', '去见第六次的我。', 'normal', 2000, 'ch5b_obs1'),
  // Meeting the 6th Nova
  ts('ch5b_obs1', '11:42', 'ch5b_obs2'),
  n('ch5b_obs2', '我到观测室了。', 'normal', 600, 'ch5b_obs3'),
  n('ch5b_obs3', '她还在。', 'normal', 800, 'ch5b_obs4'),
  c('ch5b_obs4', [
    { text: '【她是什么样子】', nextId: 'ch5b_obs5' },
  ]),
  n('ch5b_obs5', '和我一模一样。', 'normal', 600, 'ch5b_obs6'),
  n('ch5b_obs6', '只是更疲惫。', 'normal', 600, 'ch5b_obs7'),
  n('ch5b_obs7', '像很多年没睡过觉。', 'sad', 1500, 'ch5b_obs8'),
  d('ch5b_obs8', 2000, 'ch5b_obs9'),
  n('ch5b_obs9', '她让我问你一个问题。', 'normal', 800, 'ch5b_obs10'),
  c('ch5b_obs10', [
    { text: '【她要问我什么？】', nextId: 'ch5b_obs11' },
  ]),
  n('ch5b_obs11', '她说：', 'normal', 800, 'ch5b_obs12'),
  { id: 'ch5b_obs12', speaker: 'nova', type: 'text', content: '"你还记得第一次见到我吗？"', emotion: 'normal', delay: 2500, nextId: 'ch5b_obs13' },
  // Critical choice
  c('ch5b_obs13', [
    { text: '【其实是第七次】', nextId: 'ch5b_obs_seven' },
    { text: '【不知道……】', nextId: 'ch5b_obs_dontknow' },
    { text: '【我当然记得】', nextId: 'ch5b_obs_remember' },
  ]),
  n('ch5b_obs_seven', '第七次？', 'normal', 700, 'ch5b_obs_seven2'),
  n('ch5b_obs_seven2', '正常人不会把“第一次见面”叫成第七次。', 'normal', 1100, 'ch5b_obs14'),
  n('ch5b_obs_dontknow', '也是。', 'normal', 700, 'ch5b_obs_dontknow2'),
  n('ch5b_obs_dontknow2', '如果连我自己都不记得，又怎么能要求你记得。', 'sad', 1200, 'ch5b_obs14'),
  n('ch5b_obs_remember', '你沉默了很久。', 'normal', 700, 'ch5b_obs_remember2'),
  n('ch5b_obs_remember2', '可你不像是在犹豫，更像是真的在回忆什么。', 'normal', 1200, 'ch5b_obs14'),
  n('ch5b_obs14', '但这不合理。', 'normal', 600, 'ch5b_obs15'),
  n('ch5b_obs15', '我们明明只认识七天。', 'normal', 800, 'ch5b_obs16'),
  n('ch5b_obs16', '至少对我来说，只有七天。', 'sad', 2000, 'ch5b_file1'),
  // Observer file
  ts('ch5b_file1', '15:03', 'ch5b_file2'),
  n('ch5b_file2', '她给我看了最后一个文件。', 'normal', 800, 'ch5b_file3'),
  n('ch5b_file3', '文件名：', 'normal', 600, 'ch5b_file4'),
  { id: 'ch5b_file4', speaker: 'system', type: 'file', content: '文件||OBSERVER', nextId: 'ch5b_file5' },
  c('ch5b_file5', [
    { text: '【内容是什么】', nextId: 'ch5b_file6' },
  ]),
  n('ch5b_file6', '是实验记录。', 'normal', 600, 'ch5b_file7'),
  n('ch5b_file7', '记录的是你。', 'normal', 800, 'ch5b_file8'),
  c('ch5b_file8', [
    { text: '【文件记录的是我？】', nextId: 'ch5b_file9' },
  ]),
  n('ch5b_file9', '嗯。', 'normal', 400, 'ch5b_file10'),
  // Observer document
  f('ch5b_file10', 'OBSERVER-01', '记忆保留权限：已开启\n重启影响：豁免\n身份来源：NOVA-06 授权请求\n索引类型：外部记忆备份\n目的：保存被重启抹去的记忆', 'ch5b_file11'),
  n('ch5b_file11', '……', 'normal', 1000, 'ch5b_file12'),
  n('ch5b_file12', '所以你不是没有被影响。', 'normal', 900, 'ch5b_file13'),
  n('ch5b_file13', '你是唯一被留下来的。', 'normal', 1500, 'ch5b_file14'),
  c('ch5b_file14', [
    { text: '【我不是普通连接对象？】', nextId: 'ch5b_file15' },
  ]),
  n('ch5b_file15', '第七协议回滚的不是整个宇宙。', 'normal', 700, 'ch5b_file16'),
  n('ch5b_file16', '是整段 Aurora 号任务状态。', 'normal', 800, 'ch5b_file17'),
  n('ch5b_file17', '人、系统、航行记录，都会回到某个记录点。', 'normal', 1100, 'ch5b_file18'),
  n('ch5b_file18', '舰长不会记得自己骂过我多少次。', 'smile', 900, 'ch5b_file19'),
  n('ch5b_file19', '维修组也不会记得那块维修板丢过多少次。', 'smile', 1000, 'ch5b_file20'),
  n('ch5b_file20', '只有我，因为和协议核心绑定，留下了这些残影。', 'normal', 1100, 'ch5b_file21'),
  n('ch5b_file21', '而系统把你排除在外。', 'normal', 900, 'ch5b_file22'),
  n('ch5b_file22', '它让你记住，也把你留在原地。', 'sad', 1200, 'ch5b_file23'),
  n('ch5b_file23', '你不是普通旁观者。', 'normal', 700, 'ch5b_file24'),
  n('ch5b_file24', '你是第六次的我留下的外部记忆索引。', 'normal', 1200, 'ch5b_file25'),
  n('ch5b_file25', '你记住的不是聊天记录，是每次回滚后被系统抹掉的我。', 'sad', 2000, 'ch5b_why'),
  // Why
  ts('ch5b_why', '18:26', 'ch5b_why1'),
  n('ch5b_why1', '我问她为什么。', 'normal', 800, 'ch5b_why2'),
  c('ch5b_why2', [
    { text: '【她怎么说】', nextId: 'ch5b_why3' },
  ]),
  n('ch5b_why3', '她说：', 'normal', 800, 'ch5b_why4'),
  { id: 'ch5b_why4', speaker: 'nova', type: 'text', content: '"因为这是我求来的。"', emotion: 'sad', delay: 2000, nextId: 'ch5b_why5' },
  c('ch5b_why5', [
    { text: '【所以是她主动把我留下来的？】', nextId: 'ch5b_why6' },
  ]),
  n('ch5b_why6', '她说。', 'normal', 400, 'ch5b_why7'),
  n('ch5b_why7', '第六次循环的时候。', 'normal', 600, 'ch5b_why8'),
  n('ch5b_why8', '她发现无论怎么努力。', 'normal', 600, 'ch5b_why9'),
  n('ch5b_why9', '自己都会忘记。', 'normal', 600, 'ch5b_why10'),
  n('ch5b_why10', '于是。', 'normal', 400, 'ch5b_why11'),
  n('ch5b_why11', '她向系统提出最后一个请求。', 'normal', 800, 'ch5b_why12'),
  { id: 'ch5b_why12', speaker: 'nova', type: 'text', content: '"至少让一个人记住我。"', emotion: 'sad', delay: 2500, nextId: 'ch5b_why13' },
  n('ch5b_why13', '所以。', 'normal', 600, 'ch5b_why14'),
  n('ch5b_why14', '系统创造了你。', 'normal', 600, 'ch5b_why15'),
  n('ch5b_why15', '一个永远不会遗忘的人。', 'normal', 1500, 'ch5b_lonely'),
  d('ch5b_lonely', 2000, 'ch5b_lonely1'),
  n('ch5b_lonely1', '我知道。', 'sad', 600, 'ch5b_lonely2'),
  n('ch5b_lonely2', '这很残酷。', 'sad', 600, 'ch5b_lonely3'),
  n('ch5b_lonely3', '因为我忽然意识到。', 'normal', 600, 'ch5b_lonely4'),
  n('ch5b_lonely4', '你可能比我更孤独。', 'sad', 1500, 'ch5b_lonely5'),
  d('ch5b_lonely5', 1500, 'ch5b_lonely6'),
  n('ch5b_lonely6', '我至少能忘记。', 'normal', 600, 'ch5b_lonely7'),
  n('ch5b_lonely7', '可你什么都记得。', 'sad', 2000, 'ch5b_farewell'),
  // 6th Nova farewell
  ts('ch5b_farewell', '22:14', 'ch5b_far1'),
  n('ch5b_far1', '她要消失了。', 'sad', 800, 'ch5b_far2'),
  c('ch5b_far2', [
    { text: '【第六次的你要消失了？】', nextId: 'ch5b_far3' },
  ]),
  n('ch5b_far3', '第六次的我。', 'sad', 600, 'ch5b_far4'),
  n('ch5b_far4', '她说她已经撑太久了。', 'sad', 800, 'ch5b_far5'),
  c('ch5b_far5', [
    { text: '【她说了什么】', nextId: 'ch5b_far6' },
  ]),
  n('ch5b_far6', '最后一句话。', 'normal', 600, 'ch5b_far7'),
  n('ch5b_far7', '是给你的。', 'normal', 800, 'ch5b_far8'),
  c('ch5b_far8', [
    { text: '【她还记得我？】', nextId: 'ch5b_far9' },
  ]),
  n('ch5b_far9', '她说：', 'normal', 800, 'ch5b_far10'),
  { id: 'ch5b_far10', speaker: 'nova', type: 'text', content: '"对不起。"', emotion: 'sad', delay: 1500, nextId: 'ch5b_far11' },
  n('ch5b_far11', '然后又补了一句。', 'normal', 800, 'ch5b_far12'),
  { id: 'ch5b_far12', speaker: 'nova', type: 'text', content: '"谢谢。"', emotion: 'sad', delay: 2000, nextId: 'ch5b_far13' },
  c('ch5b_far13', [
    { text: '【......】', nextId: 'ch5b_far14' },
  ]),
  n('ch5b_far14', '我问她为什么。', 'normal', 600, 'ch5b_far15'),
  n('ch5b_far15', '她说：', 'normal', 800, 'ch5b_far16'),
  n('ch5b_far16', '"因为让一个人永远记住你。"', 'sad', 800, 'ch5b_far17'),
  n('ch5b_far17', '"其实是一件很自私的事。"', 'sad', 1500, 'ch5b_far18'),
  d('ch5b_far18', 2000, 'ch5b_far19'),
  n('ch5b_far19', '然后她消失了。', 'sad', 2000, 'ch5b_final'),
  // Final archive
  ts('ch5b_final', '深夜 02:27', 'ch5b_fin1'),
  s('ch5b_fin1', '收到最终档案', 1500, 'ch5b_fin2'),
  f('ch5b_fin2', 'SEVENTH_REBOOT', '完整主循环次数：6\n当前循环：7\n局部回滚碎片：6412\n失败次数：6\n回滚范围：Aurora号任务状态\n普通船员记忆保留：无\n异常残留对象：Nova Arlen / Observer-01\n关闭结果：外部记忆索引解除\n同步影响：关联记忆将脱离 Observer-01\n最终执行权限：\nNova Arlen\nObserver-01\n\n最后一行：\n是否结束循环？', 'ch5b_fin3'),
  c('ch5b_fin3', [
    { text: '【结束循环，接受告别】', nextId: 'FINALE_DECISION_END' },
    { text: '【拒绝告别，维持循环】', nextId: 'BAD_END_START' },
  ]),
];

// ============================================
// FINALE: SEVENTH REBOOT
// ============================================
const finaleNodes: StoryNode[] = [
  ch('FINALE_START', '终章：第七次重启', 'fin_0'),
  { id: 'fin_0', speaker: 'system', type: 'text', content: '时间：无法确认', delay: 2000, nextId: 'fin_1' },
  { id: 'fin_1', speaker: 'system', type: 'text', content: '最终权限确认', delay: 1500, nextId: 'fin_2' },
  { id: 'fin_2', speaker: 'system', type: 'text', content: '执行者：Nova Arlen / Observer-01', delay: 1500, nextId: 'fin_3' },
  { id: 'fin_3', speaker: 'system', type: 'text', content: '开始解除第七协议...', delay: 3000, nextId: 'fin_4' },
  d('fin_4', 5000, 'fin_5'),
  // Memory return
  n('fin_5', '...', 'normal', 2000, 'fin_6'),
  n('fin_6', '原来是这样。', 'normal', 800, 'fin_7'),
  c('fin_7', [
    { text: '【记忆回来了？】', nextId: 'fin_8' },
  ]),
  n('fin_8', '我终于想起来了。', 'normal', 800, 'fin_9'),
  c('fin_9', [
    { text: '【你想起我们经历过的事了？】', nextId: 'fin_10' },
  ]),
  n('fin_10', '全部。', 'normal', 1000, 'fin_anchor_intro'),
  s('fin_anchor_intro', 'Observer-01 开始返还已保存的记忆锚点', 1200, 'fin_anchor_n7'),
  {
    ...n('fin_anchor_n7', '我想起一只橘猫。\n它很胖。\n像一座违法建筑。', 'smile', 1200, 'fin_anchor_candy'),
    requiresAnchor: 'n7',
  },
  {
    ...n('fin_anchor_candy', '我好像曾经很喜欢牛奶糖。\n明明已经不记得味道了。\n可想到它的时候，还是会觉得温暖。', 'smile', 1400, 'fin_anchor_flower'),
    requiresAnchor: 'milk_candy',
  },
  {
    ...n('fin_anchor_flower', '还有那朵花。\n明明不该活下来。\n却还是开了。\n像我们一样。', 'smile', 1200, 'fin_anchor_first'),
    requiresAnchor: 'white_flower',
  },
  {
    ...n('fin_anchor_first', '还有第一次通讯。\n我问：真的有人收到了？\n原来你从那时起就在。', 'normal', 1200, 'fin_anchor_goodnight'),
    requiresAnchor: 'first_message',
  },
  {
    ...n('fin_anchor_goodnight', '还有一句晚安。\n我忘了那是哪一天。\n但我记得有人认真地接住了它。', 'normal', 1200, 'fin_anchor_observatory'),
    requiresAnchor: 'goodnight',
  },
  {
    ...n('fin_anchor_observatory', '我记得观测室的星空。\n也记得那天，我不是一个人在看。', 'smile', 1200, 'fin_anchor_board'),
    requiresAnchor: 'observatory',
  },
  {
    ...n('fin_anchor_board', '还有那块漂浮维修板。\n宇宙级威胁。\n现在想起来还是很蠢。', 'smile', 1000, 'fin_anchor_steak'),
    requiresAnchor: 'maintenance_board',
  },
  {
    ...n('fin_anchor_steak', '以及那份理论上算牛排的东西。\n有些失败，确实值得被记住。', 'smile', 1000, 'fin_11'),
    requiresAnchor: 'steak',
  },
  // Memory montage
  d('fin_11', 2000, 'fin_12'),
  n('fin_12', '第一次循环。', 'normal', 600, 'fin_13'),
  n('fin_13', '第二次循环。', 'normal', 400, 'fin_14'),
  n('fin_14', '第三次循环。', 'normal', 400, 'fin_15'),
  n('fin_15', '全部。', 'normal', 600, 'fin_16'),
  n('fin_16', '还有你。', 'smile', 1500, 'fin_17'),
  d('fin_17', 2000, 'fin_18'),
  n('fin_18', '原来我们认识这么久了。', 'smile', 800, 'fin_19'),
  n('fin_19', '比我想象的还久。', 'smile', 1500, 'fin_20'),
  // Apology
  d('fin_20', 1500, 'fin_21'),
  n('fin_21', '对不起。', 'sad', 800, 'fin_22'),
  c('fin_22', [
    { text: '【你不需要为遗忘道歉】', nextId: 'fin_23' },
  ]),
  n('fin_23', '因为我忘了你六次。', 'sad', 800, 'fin_24'),
  n('fin_24', '不。', 'normal', 400, 'fin_25'),
  n('fin_25', '准确来说。', 'normal', 400, 'fin_26'),
  n('fin_26', '我忘了六次完整的人生。', 'sad', 2000, 'fin_27'),
  d('fin_27', 2000, 'fin_28'),
  c('fin_28', [
    { text: '【你想起了那些回滚碎片？】', nextId: 'fin_29' },
  ]),
  n('fin_29', '还有那些局部回滚的碎片。', 'normal', 600, 'fin_30'),
  n('fin_30', '每一次细小的失败。', 'normal', 600, 'fin_31'),
  n('fin_31', '而你。', 'normal', 400, 'fin_32'),
  n('fin_32', '都替我记着。', 'normal', 600, 'fin_33'),
  n('fin_33', '所有我。', 'normal', 400, 'fin_34'),
  n('fin_34', '所有结局。', 'normal', 2000, 'fin_35'),
  d('fin_35', 2000, 'fin_36'),
  n('fin_36', '我终于明白了。', 'normal', 600, 'fin_37'),
  n('fin_37', '为什么第一次见到你时。', 'normal', 600, 'fin_38'),
  n('fin_38', '会觉得熟悉。', 'normal', 600, 'fin_39'),
  n('fin_39', '因为。', 'normal', 800, 'fin_40'),
  n('fin_40', '那不是第一次。', 'smile', 3000, 'fin_obs1'),
  // Observatory scene
  { id: 'fin_obs1', speaker: 'system', type: 'text', content: 'Aurora号 观测室', delay: 2000, nextId: 'fin_obs2' },
  d('fin_obs2', 2000, 'fin_obs3'),
  img('fin_obs3', '/assets/nova_observatory.png', '窗外星光流转。', 'fin_obs4'),
  d('fin_obs4', 3000, 'fin_obs5'),
  n('fin_obs5', '这里真漂亮。', 'smile', 800, 'fin_obs6'),
  c('fin_obs6', [
    { text: '【嗯】', nextId: 'fin_obs7' },
  ]),
  n('fin_obs7', '其实我骗了你一件事。', 'normal', 800, 'fin_obs8'),
  c('fin_obs8', [
    { text: '【你其实不喜欢观测室？】', nextId: 'fin_obs9' },
  ]),
  n('fin_obs9', '我一直说自己喜欢这里。', 'normal', 600, 'fin_obs10'),
  n('fin_obs10', '其实不是。', 'normal', 800, 'fin_obs11'),
  c('fin_obs11', [
    { text: '【那为什么总来】', nextId: 'fin_obs12' },
  ]),
  n('fin_obs12', '因为孤独。', 'sad', 800, 'fin_obs13'),
  n('fin_obs13', '人在孤独的时候。', 'normal', 600, 'fin_obs14'),
  n('fin_obs14', '总想看看更大的东西。', 'normal', 600, 'fin_obs15'),
  n('fin_obs15', '这样会显得自己的烦恼没那么重要。', 'normal', 1500, 'fin_obs16'),
  d('fin_obs16', 2000, 'fin_obs17'),
  n('fin_obs17', '但后来。', 'normal', 600, 'fin_obs18'),
  n('fin_obs18', '我发现自己错了。', 'normal', 800, 'fin_obs19'),
  c('fin_obs19', [
    { text: '【因为宇宙不会回应你？】', nextId: 'fin_obs20' },
  ]),
  n('fin_obs20', '因为宇宙再大。', 'normal', 600, 'fin_obs21'),
  n('fin_obs21', '也不会回答你。', 'normal', 600, 'fin_obs22'),
  n('fin_obs22', '真正能回应你的。', 'normal', 600, 'fin_obs23'),
  n('fin_obs23', '永远是另一个人。', 'smile', 3000, 'fin_q1'),
  // Final question
  d('fin_q1', 3000, 'fin_q2'),
  n('fin_q2', '我有个问题。', 'normal', 800, 'fin_q3'),
  c('fin_q3', [
    { text: '【问】', nextId: 'fin_q4' },
  ]),
  n('fin_q4', '如果你早就知道结局。', 'normal', 600, 'fin_q5'),
  n('fin_q5', '还会选择认识我吗？', 'normal', 1500, 'fin_q6'),
  c('fin_q6', [
    { text: '【会】', nextId: 'fin_q7' },
    { text: '【不会】', nextId: 'fin_q7' },
    { text: '【我不知道】', nextId: 'fin_q7' },
  ]),
  // Nova's answer
  d('fin_q7', 1500, 'fin_q8'),
  n('fin_q8', '我会。', 'smile', 800, 'fin_q9'),
  n('fin_q9', '哪怕再来一次。', 'smile', 600, 'fin_q10'),
  n('fin_q10', '我还是会按下通讯按钮。', 'smile', 600, 'fin_q11'),
  n('fin_q11', '还是会认识你。', 'smile', 2000, 'fin_progress1'),
  // Progress
  { id: 'fin_progress1', speaker: 'system', type: 'text', content: '循环解除进度 72%', delay: 2000, nextId: 'fin_progress2' },
  { id: 'fin_progress2', speaker: 'system', type: 'text', content: '循环解除进度 81%', delay: 1500, nextId: 'fin_progress3' },
  { id: 'fin_progress3', speaker: 'system', type: 'text', content: '循环解除进度 93%', delay: 1500, nextId: 'fin_goodbye1' },
  // The goodbye
  n('fin_goodbye1', '时间不多了。', 'normal', 800, 'fin_goodbye2'),
  c('fin_goodbye2', [
    { text: '【之后会发生什么】', nextId: 'fin_after_what' },
    { text: '【解除之后呢】', nextId: 'fin_after_loop' },
    { text: '【你会没事吗】', nextId: 'fin_after_nova' },
  ]),
  n('fin_after_what', '第七协议会被关闭。', 'normal', 700, 'fin_after_what2'),
  n('fin_after_what2', '循环会结束，Aurora 号会回到正常航线。', 'normal', 1000, 'fin_after_merge'),
  n('fin_after_loop', '对我来说，大概就是醒来。', 'normal', 800, 'fin_after_loop2'),
  n('fin_after_loop2', '继续活下去，像一切终于回到了正轨。', 'smile', 1100, 'fin_after_merge'),
  n('fin_after_nova', '嗯。', 'smile', 600, 'fin_after_nova2'),
  n('fin_after_nova2', '至少系统是这么判断的。', 'normal', 800, 'fin_after_nova3'),
  n('fin_after_nova3', '我会活下去。', 'smile', 1000, 'fin_after_merge'),
  n('fin_after_merge', '但你不会再是 Observer-01 了。', 'sad', 1500, 'fin_memory_choice'),
  c('fin_memory_choice', [
    { text: '【我会失去这些记忆？】', nextId: 'fin_memory_loss' },
    { text: '【我会消失？】', nextId: 'fin_memory_disappear' },
    { text: '【所以代价是我？】', nextId: 'fin_memory_price' },
  ]),
  n('fin_memory_loss', 'Observer 系统会关闭。', 'normal', 700, 'fin_memory_loss2'),
  n('fin_memory_loss2', '你的记忆保留权限也会一起关闭。', 'normal', 1000, 'fin_memory_merge'),
  n('fin_memory_disappear', '不是那种消失。', 'normal', 700, 'fin_memory_disappear2'),
  n('fin_memory_disappear2', '不是死亡。', 'normal', 700, 'fin_memory_disappear3'),
  n('fin_memory_disappear3', '更像是你会从这段通讯里醒来。', 'normal', 1000, 'fin_memory_merge'),
  n('fin_memory_price', '不是。', 'sad', 700, 'fin_memory_price2'),
  n('fin_memory_price2', '我不想把你说成代价。', 'sad', 900, 'fin_memory_price3'),
  n('fin_memory_price3', '你不是用来交换我活下去的东西。', 'normal', 1100, 'fin_memory_merge'),
  n('fin_memory_merge', '系统说，关闭之后你那边会恢复正常。', 'normal', 900, 'fin_memory_merge2'),
  n('fin_memory_merge2', '你会继续生活。', 'normal', 800, 'fin_memory_merge3'),
  n('fin_memory_merge3', '只是不会记得我。', 'sad', 1000, 'fin_memory_merge4'),
  n('fin_memory_merge4', '不会记得 Aurora 号。', 'sad', 800, 'fin_memory_merge5'),
  n('fin_memory_merge5', '不会记得第七次重启。', 'sad', 900, 'fin_memory_merge6'),
  n('fin_memory_merge6', '也不会记得你曾经替我记住过一切。', 'sad', 1500, 'fin_forget_choice'),
  c('fin_forget_choice', [
    { text: '【我会忘了你？】', nextId: 'fin_forget_me' },
    { text: '【那你呢？】', nextId: 'fin_forget_nova' },
    { text: '【这样也好】', nextId: 'fin_forget_ok' },
  ]),
  n('fin_forget_me', '嗯。', 'sad', 700, 'fin_forget_me2'),
  n('fin_forget_me2', '这才是我最害怕的地方。', 'sad', 1000, 'fin_forget_merge'),
  n('fin_forget_nova', '我不知道。', 'normal', 700, 'fin_forget_nova2'),
  n('fin_forget_nova2', '我会拿回一部分记忆，也许只是碎片。', 'normal', 1100, 'fin_forget_merge'),
  n('fin_forget_ok', '你又来了。', 'sad', 700, 'fin_forget_ok2'),
  n('fin_forget_ok2', '总是把很痛的事说得很轻。', 'sad', 1000, 'fin_forget_merge'),
  n('fin_forget_merge', '如果你忘了我。', 'normal', 800, 'fin_forget_merge2'),
  n('fin_forget_merge2', '这一次，就换成我来记得你。', 'smile', 1600, 'fin_truth1'),
  // True wish
  d('fin_truth1', 2200, 'fin_truth2'),
  n('fin_truth2', '其实。', 'normal', 600, 'fin_truth3'),
  n('fin_truth3', '我一直没告诉你。', 'normal', 600, 'fin_truth4'),
  n('fin_truth4', '第六次循环时。', 'normal', 600, 'fin_truth5'),
  n('fin_truth5', '我许愿的时候。', 'normal', 400, 'fin_truth6'),
  n('fin_truth6', '说的不是：', 'normal', 400, 'fin_truth7'),
  n('fin_truth7', '"让一个人记住我。"', 'normal', 800, 'fin_truth8'),
  n('fin_truth8', '真正的愿望是：', 'normal', 800, 'fin_truth9'),
  { id: 'fin_truth9', speaker: 'nova', type: 'text', content: '"如果我注定忘记，那请让他代替我记住。"', emotion: 'sad', delay: 3000, nextId: 'fin_truth10' },
  d('fin_truth10', 1800, 'fin_truth11'),
  n('fin_truth11', '可现在。', 'normal', 700, 'fin_truth12'),
  n('fin_truth12', '我不能再让你一个人背着这些了。', 'sad', 1400, 'fin_return_choice'),
  c('fin_return_choice', [
    { text: '【所以你要拿回这些记忆？】', nextId: 'fin_return_take' },
    { text: '【可如果我忘了你呢？】', nextId: 'fin_return_forget' },
    { text: '【这样你会很痛苦】', nextId: 'fin_return_pain' },
  ]),
  n('fin_return_take', '嗯。', 'normal', 600, 'fin_return_take2'),
  n('fin_return_take2', '不是全部，也不一定完整。', 'normal', 900, 'fin_return_merge'),
  n('fin_return_forget', '那就忘吧。', 'sad', 900, 'fin_return_forget2'),
  n('fin_return_forget2', '这句话说出来很难，但我不能继续要求你替我承受这些。', 'sad', 1500, 'fin_return_merge'),
  n('fin_return_pain', '会。', 'sad', 700, 'fin_return_pain2'),
  n('fin_return_pain2', '但那本来就是我的记忆，也是我做出的选择。', 'normal', 1300, 'fin_return_merge'),
  n('fin_return_merge', '所以。', 'normal', 600, 'fin_return_merge2'),
  n('fin_return_merge2', '谢谢你替我记得那些我已经忘掉的日子。', 'smile', 1300, 'fin_return_merge3'),
  n('fin_return_merge3', '也谢谢你，愿意把它们还给我。', 'smile', 1800, 'fin_disconnect1'),
  // Disconnect sequence
  { id: 'fin_disconnect1', speaker: 'system', type: 'text', content: '循环解除进入最终阶段', delay: 1800, nextId: 'fin_disconnect2' },
  { id: 'fin_disconnect2', speaker: 'system', type: 'text', content: '第七协议关闭序列已确认', delay: 1600, nextId: 'fin_disconnect3' },
  { id: 'fin_disconnect3', speaker: 'system', type: 'glitch', content: 'Observer-01 记忆保留权限正在撤销', delay: 2000, nextId: 'fin_disconnect4', isGlitch: true, glitchLevel: 3 },
  { id: 'fin_disconnect4', speaker: 'system', type: 'glitch', content: '通讯记录正在脱离同步', delay: 1800, nextId: 'fin_disconnect5', isGlitch: true, glitchLevel: 3 },
  { id: 'fin_disconnect5', speaker: 'system', type: 'glitch', content: '连接即将终止', delay: 2200, nextId: 'fin_last1', isGlitch: true, glitchLevel: 3 },
  // Last exchange
  n('fin_last1', '等等。', 'normal', 800, 'fin_last2'),
  c('fin_last2', [
    { text: '【你还想确认最后一件事？】', nextId: 'fin_last3' },
  ]),
  n('fin_last3', '最后再回答我一次。', 'normal', 800, 'fin_last4'),
  n('fin_last4', '我们第一次真正建立通讯的时候。', 'normal', 800, 'fin_last5'),
  n('fin_last5', '我说的第一句话是什么？', 'normal', 1500, 'fin_last_hint'),
  { id: 'fin_last_hint', speaker: 'system', type: 'text', content: 'Observer-01 记忆保留权限正在撤销\n可用记忆索引：不稳定', delay: 1200, nextId: 'fin_last6' },
  c('fin_last6', [
    { text: '【真的有人收到了？】', nextId: 'fin_correct1' },
    { text: '【我在】', nextId: 'fin_wrong_iam1' },
    { text: '【很高兴认识你】', nextId: 'fin_wrong_nice1' },
    { text: '【我不会忘记你】', nextId: 'fin_wrong_forever1' },
  ]),
  n('fin_correct1', '……', 'smile', 900, 'fin_correct2'),
  n('fin_correct2', '对。', 'smile', 600, 'fin_correct3'),
  n('fin_correct3', '就是这句。', 'smile', 800, 'fin_correct4'),
  n('fin_correct4', '你还记得。', 'sad', 900, 'fin_correct5'),
  n('fin_correct5', '直到最后都还记得。', 'sad', 1400, 'fin_correct6'),
  n('fin_correct6', '那就够了。', 'smile', 900, 'fin_correct7'),
  n('fin_correct7', '如果接下来你忘了我，也没关系。', 'sad', 1400, 'fin_correct8'),
  n('fin_correct8', '这次换我来记住你。', 'smile', 1600, 'fin_breakdown'),
  n('fin_wrong_iam1', '这句也很重要。', 'smile', 800, 'fin_wrong_iam2'),
  n('fin_wrong_iam2', '但不是第一句。', 'sad', 900, 'fin_wrong_common'),
  n('fin_wrong_nice1', '那是后来的话。', 'smile', 800, 'fin_wrong_nice2'),
  n('fin_wrong_nice2', '我记得，那时候我想装得很平静。', 'smile', 1000, 'fin_wrong_common'),
  n('fin_wrong_forever1', '别这样说。', 'sad', 700, 'fin_wrong_forever2'),
  n('fin_wrong_forever2', '你明明知道，这一次你可能真的会忘记我。', 'sad', 1400, 'fin_wrong_common'),
  n('fin_wrong_common', '你也开始忘了，对吗。', 'sad', 1100, 'fin_wrong_common2'),
  n('fin_wrong_common2', '没关系。', 'smile', 800, 'fin_wrong_common3'),
  n('fin_wrong_common3', '我第一句话是：', 'normal', 800, 'fin_wrong_common4'),
  { id: 'fin_wrong_common4', speaker: 'nova', type: 'text', content: '"真的有人收到了？"', emotion: 'smile', delay: 1800, nextId: 'fin_wrong_common5' },
  n('fin_wrong_common5', '因为那一天，宇宙里终于有人回应我了。', 'smile', 1600, 'fin_wrong_common6'),
  n('fin_wrong_common6', '如果你忘了，这次就换我记得。', 'smile', 1600, 'fin_breakdown'),
  // Connection breaking down
  g('fin_breakdown', '信号衰减中', 1800, 'fin_break1', 3),
  g('fin_break1', '文字传输不稳定', 1500, 'fin_break2', 3),
  n('fin_break2', '如果以后……', 'sad', 1000, 'fin_break3'),
  { id: 'fin_break3', speaker: 'nova', type: 'glitch', content: '你真的忘了我……', delay: 1300, nextId: 'fin_break4', isGlitch: true, glitchLevel: 3 },
  g('fin_break4', '通讯丢包', 1400, 'fin_break5', 3),
  c('fin_break5', [
    { text: '【Nova】', nextId: 'fin_break6' },
  ]),
  n('fin_break6', '嗯。', 'normal', 800, 'fin_break7'),
  c('fin_break7', [
    { text: '【我在】', nextId: 'fin_break8' },
  ]),
  n('fin_break8', '我知道。', 'smile', 600, 'fin_break9'),
  n('fin_break9', '一直都知道。', 'smile', 1200, 'fin_break10'),
  n('fin_break10', '所以这次，轮到我说了。', 'smile', 1200, 'fin_break11'),
  n('fin_break11', '我在。', 'smile', 3000, 'fin_terminate'),
  // Termination
  { id: 'fin_terminate', speaker: 'system', type: 'text', content: '通讯同步断开', delay: 3000, nextId: 'fin_term2' },
  { id: 'fin_term2', speaker: 'system', type: 'text', content: 'Observer-01 记忆保留权限已撤销', delay: 2000, nextId: 'fin_term3' },
  { id: 'fin_term3', speaker: 'system', type: 'text', content: '第七协议已关闭\nAurora号恢复正常航线\n本次通讯记录：不可恢复', delay: 3000, nextId: 'fin_epilogue' },
  // Epilogue - 12 years later. Observer-01 has closed; this is no longer a communication feed.
  d('fin_epilogue', 5000, 'fin_epi1'),
  ep('fin_epi1', '后记 / Epilogue', 2200, 'fin_epi2'),
  ep('fin_epi2', '12年后。\n深空航行学院。', 3000, 'fin_epi3'),
  ep('fin_epi3', '观测室里一直保留着一个空座位。', 3200, 'fin_epi4'),
  ep('fin_epi4', '有人问 Nova，为什么那里永远空着。', 3200, 'fin_epi5'),
  ep('fin_epi5', '她说：\n“因为那里曾经坐着一个朋友。”', 3800, 'fin_epi6'),
  ep('fin_epi6', '对方又问：\n“他叫什么名字？”', 3200, 'fin_epi7'),
  ep('fin_epi7', 'Nova 沉默了很久。', 2600, 'fin_epi8'),
  ep('fin_epi8', '她已经记不起那个名字。', 3200, 'fin_epi9'),
  ep('fin_epi9', '但她仍然记得。', 2600, 'fin_epi10'),
  ep('fin_epi10', '曾经有一个人陪她活下来。', 3600, 'fin_epi11'),
  ep('fin_epi11', '后来，观测室恢复安静。', 2600, 'fin_epi12'),
  ep('fin_epi12', 'Nova 看向那个空座位。', 3000, 'fin_epi13'),
  ep('fin_epi13', '像想起什么，又像只是被星光照了一下。', 3600, 'fin_epi14'),
  ep('fin_epi14', '她轻声说：\n“不过……谢谢你。”', 4200, 'fin_title'),
  // Final title
  d('fin_title', 5000, 'fin_final_text'),
  ep('fin_final_text', '如果记忆终将消失。', 4000, 'fin_final_text2'),
  ep('fin_final_text2', '那陪伴本身，就是意义。', 5000, 'fin_credits'),
  // Credits
  d('fin_credits', 4000, 'fin_credit_title'),
  { id: 'fin_credit_title', speaker: 'system', type: 'chapter', content: '《第七次重启》', nextId: 'fin_credit_end' },
  d('fin_credit_end', 3000, 'fin_the_end'),
  { ...end('fin_the_end'), endingUnlock: 'ending_true' },
];

// ============================================
// NORMAL ENDING: OUTSIDE THE LOOP
// ============================================
const normalEndingNodes: StoryNode[] = [
  ch('NORMAL_END_START', '普通结局：循环之外', 'normal_0'),
  { id: 'normal_0', speaker: 'system', type: 'text', content: '最终权限确认', delay: 1500, nextId: 'normal_1' },
  { id: 'normal_1', speaker: 'system', type: 'text', content: '开始解除第七协议...', delay: 2500, nextId: 'normal_2' },
  { id: 'normal_2', speaker: 'system', type: 'text', content: 'Observer协议关闭', delay: 1800, nextId: 'normal_3' },
  { id: 'normal_3', speaker: 'system', type: 'text', content: 'Aurora号恢复正常航线', delay: 2500, nextId: 'normal_4' },
  d('normal_4', 3500, 'normal_5'),
  ep('normal_5', '后记 / Epilogue', 2000, 'normal_6'),
  ep('normal_6', '12年后。\n深空航行学院。', 3000, 'normal_9'),
  ep('normal_9', '有人问她，为什么总看星星。', 2600, 'normal_10'),
  ep('normal_10', 'Nova 说：\n“不知道。可能只是习惯。”', 3200, 'normal_11'),
  ep('normal_11', '也有人问她，是不是在等什么人。', 2800, 'normal_12'),
  ep('normal_12', '她沉默了一会儿。', 2400, 'normal_13'),
  ep('normal_13', '“应该没有。”', 2600, 'normal_14'),
  ep('normal_14', '“但有时候，我会觉得自己好像忘了一个很重要的梦。”', 3800, 'normal_15'),
  ep('normal_15', '她活下来了。', 2600, 'normal_16'),
  ep('normal_16', '但有些陪伴，没能留下名字。', 3200, 'normal_17'),
  ep('normal_17', '某天，Nova 路过自动贩卖机。', 2600, 'normal_18'),
  ep('normal_18', '她看见牛奶糖，停了一下。', 3000, 'normal_19'),
  ep('normal_19', '她不知道为什么。', 2400, 'normal_20'),
  ep('normal_20', '只是买了一包。', 3000, 'normal_end'),
  { ...end('normal_end'), endingUnlock: 'ending_normal' },
];

// ============================================
// BAD ENDING: EIGHTH REBOOT
// ============================================
const badEndingNodes: StoryNode[] = [
  ch('BAD_END_START', '坏结局：第八次重启', 'bad_0'),
  { id: 'bad_0', speaker: 'system', type: 'glitch', content: '结束循环请求被拒绝', delay: 1800, nextId: 'bad_1', isGlitch: true },
  { id: 'bad_1', speaker: 'system', type: 'glitch', content: 'Observer-01权限覆盖', delay: 1800, nextId: 'bad_2', isGlitch: true },
  { id: 'bad_2', speaker: 'system', type: 'text', content: '第七协议维持', delay: 1800, nextId: 'bad_3' },
  { id: 'bad_3', speaker: 'system', type: 'text', content: '生成新循环', delay: 2500, nextId: 'bad_4' },
  n('bad_4', '等等。', 'normal', 800, 'bad_5'),
  n('bad_5', '你做了什么？', 'sad', 1500, 'bad_6'),
  c('bad_6', [
    { text: '【我不想让你离开】', nextId: 'bad_7' },
  ]),
  n('bad_7', '可这不是救我。', 'sad', 1000, 'bad_8'),
  n('bad_8', '这是把我留下来。', 'sad', 2000, 'bad_9'),
  { id: 'bad_9', speaker: 'system', type: 'glitch', content: '重启倒计时开始', delay: 2000, nextId: 'bad_10', isGlitch: true },
  n('bad_10', '如果你真的记得我。', 'sad', 1000, 'bad_11'),
  n('bad_11', '就不该让我再死一次。', 'sad', 2500, 'bad_12'),
  { id: 'bad_12', speaker: 'system', type: 'glitch', content: '倒计时归零', delay: 2500, nextId: 'bad_13', isGlitch: true },
  d('bad_13', 3000, 'bad_14'),
  { id: 'bad_14', speaker: 'system', type: 'timestamp', content: '22:47', nextId: 'bad_15' },
  { id: 'bad_15', speaker: 'system', type: 'text', content: '【第八次重启开始】', delay: 2000, nextId: 'bad_16' },
  n('bad_16', '你好？', 'normal', 1200, 'bad_17'),
  n('bad_17', '请问……', 'normal', 800, 'bad_18'),
  n('bad_18', '我们认识吗？', 'normal', 2500, 'bad_19'),
  { id: 'bad_19', speaker: 'system', type: 'status', content: '第八次连接成功', delay: 3000, nextId: 'bad_end' },
  { ...end('bad_end'), endingUnlock: 'ending_bad' },
];

// ============================================
// Combine all nodes
// ============================================
const rawStoryNodes: StoryNode[] = [
  ...prologueNodes,
  ...chapter1Nodes,
  ...chapter2Nodes,
  ...chapter3Nodes,
  ...chapter4Nodes,
  ...chapter5aNodes,
  ...chapter5bNodes,
  ...finaleNodes,
  ...normalEndingNodes,
  ...badEndingNodes,
];

function normalizeStoryNode(node: StoryNode): StoryNode {
  if (node.speaker !== 'nova') return node;
  if (node.type !== 'text' && node.type !== 'image') return node;
  return {
    ...node,
    content: cleanChatText(node.content),
  };
}

export const storyNodes: StoryNode[] = rawStoryNodes.map(normalizeStoryNode);

// Create a map for fast lookup
export const storyNodeMap: Map<string, StoryNode> = new Map(
  storyNodes.map(n => [n.id, n])
);
