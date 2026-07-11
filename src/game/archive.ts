import type { ArchiveCategory, ArchiveEntry, ContactStage, EndingId, GameStats, MemoryAnchorId, MessageType } from './types';

export type ArchiveDefinition = Omit<ArchiveEntry, 'unlocked'>;

type ArchiveNodeLike = {
  id: string;
  type: MessageType;
  image?: string;
  memoryAnchor?: MemoryAnchorId;
  contactStage?: ContactStage;
  archiveUnlock?: string | string[];
  endingUnlock?: EndingId;
};

export const ANCHOR_ARCHIVE_IDS: Record<MemoryAnchorId, string> = {
  first_message: 'anchor_first_message',
  n7: 'anchor_n7',
  goodnight: 'anchor_goodnight',
  observatory: 'anchor_observatory',
  white_flower: 'anchor_white_flower',
  milk_candy: 'anchor_milk_candy',
  maintenance_board: 'anchor_maintenance_board',
  steak: 'anchor_steak',
};

const PHOTO_ARCHIVE_BY_IMAGE: Record<string, string> = {
  '/assets/photo_maintenance_board.jpg': 'photo_maintenance_board',
  '/assets/photo_steak.jpg': 'photo_steak',
  '/assets/photo_candy.jpg': 'photo_candy',
  '/assets/photo_little_flower.jpg': 'photo_little_flower',
  '/assets/nova_n7_photo.png': 'photo_nova_n7',
  '/assets/photo_observatory.jpg': 'photo_observatory',
  '/assets/nova_observatory.png': 'photo_observation_room_back',
  '/assets/nova_id_photo.png': 'photo_nova_id',
};

const ANOMALY_ARCHIVE_BY_NODE_ID: Record<string, string[]> = {
  ch1_draft1: ['anomaly_unsent_n7_draft'],
  ch2_draft1: ['anomaly_unsent_n7_draft'],
  ch3_draft1: ['anomaly_encrypted_observatory_draft'],
  ch4_log1: ['anomaly_hidden_log_nova07'],
  ch5a_msg3: ['anomaly_nova06_warning'],
  ch5b_file10: ['anomaly_observer_file', 'profile_truth'],
  ch5b_fin2: ['anomaly_seventh_reboot_file'],
};

export const ARCHIVE_ENTRIES: ArchiveDefinition[] = [
  {
    id: 'anchor_first_message',
    category: 'anchor',
    title: '第一句通讯',
    quote: '真的有人收到了？',
    description: 'Observer-01 保存的第一条有效回应记录。',
    chapter: '序章：Observer-01 接入',
    order: 10,
  },
  {
    id: 'anchor_n7',
    category: 'anchor',
    title: 'N7',
    quote: '胖得像违法建筑',
    description: 'Nova 七岁那年捡到的橘猫。她说自己的取名能力从小就不怎么样。',
    chapter: '第一章：连接',
    order: 20,
  },
  {
    id: 'anchor_goodnight',
    category: 'anchor',
    title: '晚安',
    quote: '很高兴认识你',
    description: '第一次真正的告别——不是通讯的结束，而是连接的开始。',
    chapter: '第一章：连接',
    order: 30,
  },
  {
    id: 'anchor_observatory',
    category: 'anchor',
    title: '观测室',
    quote: '因为宇宙再大，也不会回答你',
    description: 'Nova 待得最久的地方——也是她最孤独的地方。',
    chapter: '第二章：日常',
    order: 40,
  },
  {
    id: 'anchor_white_flower',
    category: 'anchor',
    title: '小白花',
    quote: '明明不该活下来，却还是开了',
    description: '长在维修通风管里的一朵花。Nova 没有上报，因为它“看起来挺努力的”。',
    chapter: '第三章：异常',
    order: 50,
  },
  {
    id: 'anchor_milk_candy',
    category: 'anchor',
    title: '牛奶糖',
    quote: '想到它的时候，还是会觉得温暖',
    description: 'Nova 童年记忆的碎片——后来成为能重新唤起残留情感的锚点。',
    chapter: '第二章：日常',
    order: 60,
  },
  {
    id: 'anchor_maintenance_board',
    category: 'anchor',
    title: '宇宙级威胁',
    quote: '看——宇宙级威胁',
    description: '工程组弄丢的维修板。有人给它贴了两只眼睛。',
    chapter: '第一章：连接',
    order: 70,
  },
  {
    id: 'anchor_steak',
    category: 'anchor',
    title: '科研事故',
    quote: '别问，问就是科研事故',
    description: 'Aurora 食堂的合成牛排。Nova 怀疑它更接近建筑材料。',
    chapter: '第三章：异常',
    order: 80,
  },
  {
    id: 'photo_maintenance_board',
    category: 'photo',
    title: '漂浮维修板',
    subtitle: '看——宇宙级威胁',
    image: '/assets/photo_maintenance_board.jpg',
    chapter: '第一章：连接',
    order: 110,
  },
  {
    id: 'photo_steak',
    category: 'photo',
    title: '合成牛排',
    subtitle: '别问，问就是科研事故',
    image: '/assets/photo_steak.jpg',
    chapter: '第三章：异常',
    order: 120,
  },
  {
    id: 'photo_candy',
    category: 'photo',
    title: '牛奶糖',
    subtitle: '舰上发了糖。突然想起小时候',
    image: '/assets/photo_candy.jpg',
    chapter: '日常事件 / 记忆锚点',
    order: 130,
  },
  {
    id: 'photo_little_flower',
    category: 'photo',
    title: '小白花',
    subtitle: '理论上这里不该有植物',
    image: '/assets/photo_little_flower.jpg',
    chapter: '第三章：异常',
    order: 140,
  },
  {
    id: 'photo_nova_n7',
    category: 'photo',
    title: 'Nova 与 N7',
    subtitle: '和 N7 在一起的每一天',
    image: '/assets/nova_n7_photo.png',
    chapter: 'N7 的记忆',
    order: 150,
  },
  {
    id: 'photo_observatory',
    category: 'photo',
    title: '观测窗',
    subtitle: '这是我最喜欢的地方',
    image: '/assets/photo_observatory.jpg',
    chapter: '第二章：日常',
    order: 160,
  },
  {
    id: 'photo_observation_room_back',
    category: 'photo',
    title: '观测室',
    subtitle: '人孤独的时候，会想看比自己更大的东西',
    image: '/assets/nova_observatory.png',
    chapter: '终章：第七次重启',
    order: 170,
  },
  {
    id: 'photo_nova_id',
    category: 'photo',
    title: 'NOVA ARLEN',
    subtitle: '通讯档案已恢复',
    image: '/assets/nova_id_photo.png',
    chapter: '身份已确认',
    order: 180,
  },
  {
    id: 'anomaly_unsent_n7_draft',
    category: 'anomaly',
    title: '未发送草稿 / 02:17',
    description: '不对\n我明明是第一次和对方说起 N7',
    chapter: '章末异常草稿',
    order: 210,
  },
  {
    id: 'anomaly_encrypted_observatory_draft',
    category: 'anomaly',
    title: '加密草稿 / 03:07',
    description: '我又看见那个影子了\n它还在观测室',
    chapter: '第三章：异常',
    order: 220,
  },
  {
    id: 'anomaly_hidden_log_nova07',
    category: 'anomaly',
    title: '隐藏日志：NOVA-07',
    description: '请不要尝试恢复记忆\n不要寻找观测室中的我\n不要打开第七协议\n尤其不要相信我',
    chapter: '第四章：记忆',
    order: 230,
  },
  {
    id: 'anomaly_nova06_warning',
    category: 'anomaly',
    title: 'UNKNOWN-06 / 残留留言',
    description: '不要完全相信她\n不是因为她会对你说谎\n而是因为她真的会忘记\n真正被困住的不是 Nova\n是你',
    chapter: '第五章：真相（上）',
    order: 240,
  },
  {
    id: 'anomaly_observer_file',
    category: 'anomaly',
    title: 'OBSERVER-01',
    description: '索引类型：外部记忆索引\n本体类型：外部意识\n本体定位：不可访问\n权限：保存 / 读取 / 返还记忆锚点',
    chapter: '第五章：真相（下）',
    order: 250,
  },
  {
    id: 'anomaly_seventh_reboot_file',
    category: 'anomaly',
    title: 'SEVENTH_REBOOT',
    description: '已完成主循环：6\n当前循环：7\n局部回溯碎片：6412\n最终关闭条件：当前导航员授权 + 外部记忆索引释放',
    chapter: '第五章：真相（下）',
    order: 260,
  },
  {
    id: 'profile_unknown',
    category: 'profile',
    title: '身份：未知',
    subtitle: '信号：加密',
    description: '来源：第七协议\n备注：身份确认未完成',
    order: 310,
  },
  {
    id: 'profile_named',
    category: 'profile',
    title: '姓名：Nova',
    subtitle: '所属：Aurora',
    description: '职位：导航员\n身份状态：未验证',
    order: 320,
  },
  {
    id: 'profile_verified',
    category: 'profile',
    title: '姓名：NOVA ARLEN',
    subtitle: '身份状态：已确认',
    description: '年龄：20\n职位：Aurora 导航员\nObserver 链路：已确认\n备注：对象与第七协议关联',
    image: '/assets/nova_id_photo.png',
    order: 330,
  },
  {
    id: 'profile_truth',
    category: 'profile',
    title: 'Observer 链路：深度确认',
    subtitle: '第六循环授权请求：已确认',
    description: 'Observer-01 创建原因：记忆保留\n循环豁免对象：Observer-01',
    order: 340,
  },
  {
    id: 'ending_true',
    category: 'ending',
    title: '《第七次重启》',
    subtitle: '真结局',
    description: '如果记忆终将消散\n那么陪伴本身，就是意义',
    order: 410,
  },
  {
    id: 'ending_normal',
    category: 'ending',
    title: '《循环之外》',
    subtitle: '普通结局',
    description: '她活了下来\n可有些陪伴，从未留下名字',
    order: 420,
  },
  {
    id: 'ending_bad',
    category: 'ending',
    title: '《第八次重启》',
    subtitle: '坏结局',
    description: '如果执念拒绝告别\n重启便永无尽头',
    order: 430,
  },
];

export function getArchiveEntries(stats: GameStats, contactStage: ContactStage): ArchiveEntry[] {
  const unlocked = new Set<string>(stats.unlockedArchives);
  stats.memoryAnchors.forEach(anchor => unlocked.add(ANCHOR_ARCHIVE_IDS[anchor]));
  stats.endingsUnlocked.forEach(ending => unlocked.add(ending));
  unlocked.add('profile_unknown');
  if (contactStage === 'named' || contactStage === 'verified') unlocked.add('profile_named');
  if (contactStage === 'verified') unlocked.add('profile_verified');

  return ARCHIVE_ENTRIES
    .map(entry => ({ ...entry, unlocked: unlocked.has(entry.id) }))
    .sort((a, b) => a.order - b.order);
}

export function getArchiveUnlocksForNode(node: ArchiveNodeLike): string[] {
  const ids: string[] = [];
  if (node.archiveUnlock) {
    ids.push(...(Array.isArray(node.archiveUnlock) ? node.archiveUnlock : [node.archiveUnlock]));
  }
  if (node.endingUnlock) ids.push(node.endingUnlock);
  if (node.memoryAnchor) ids.push(ANCHOR_ARCHIVE_IDS[node.memoryAnchor]);
  if (node.image && PHOTO_ARCHIVE_BY_IMAGE[node.image]) ids.push(PHOTO_ARCHIVE_BY_IMAGE[node.image]);
  if (node.contactStage === 'named') ids.push('profile_named');
  if (node.contactStage === 'verified') ids.push('profile_verified');
  ids.push(...(ANOMALY_ARCHIVE_BY_NODE_ID[node.id] ?? []));
  return [...new Set(ids)];
}

export function getArchiveCategoryLabel(category: ArchiveCategory): string {
  switch (category) {
    case 'anchor':
      return '记忆锚点';
    case 'photo':
      return '剧情照片';
    case 'anomaly':
      return '异常记录';
    case 'profile':
      return 'Nova档案';
    case 'ending':
      return '结局记录';
  }
}
