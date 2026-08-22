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
  '/assets/nova_id_photo.png': 'photo_nova_id',
  '/assets/nova_id_photo_en.png': 'photo_nova_id',
};

const ANOMALY_ARCHIVE_BY_NODE_ID: Record<string, string[]> = {
  'CH04-0223': ['anomaly_hidden_log_nova07'],
  'CH05A-0023': ['anomaly_nova06_warning'],
  'CH05B-0049': ['anomaly_observer_file', 'profile_truth'],
  'CH05A-0204': ['anomaly_seventh_reboot_file'],
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
    id: 'photo_nova_id',
    category: 'photo',
    title: 'NOVA ARLEN',
    subtitle: '通讯档案已恢复',
    image: '/assets/nova_id_photo.png',
    chapter: '身份已确认',
    order: 180,
  },
  {
    id: 'anomaly_hidden_log_nova07',
    category: 'anomaly',
    title: '隐藏日志：UNKNOWN-06 → LIVE-07',
    description: '如果你正在阅读这段记录\n说明第六次还是失败了\n别再走原来的航线\n去观测室\n我把录像和航迹留在那里\n第七协议会阻止你\n别让它再次启动',
    chapter: '第四章：记忆',
    order: 230,
  },
  {
    id: 'anomaly_nova06_warning',
    category: 'anomaly',
    title: 'NOVA-06 / 密封记录',
    description: '记录类型：固定录像 / 新航线数据\n记录对象：下一次醒来的 Nova\n状态：只读\n实时响应能力：无\n附带授权：一次性舰载 AI 安全回退',
    chapter: '第五章：真相（上）',
    order: 240,
  },
  {
    id: 'anomaly_observer_file',
    category: 'anomaly',
    title: 'OBSERVER-01',
    description: '建立时间：外部呼叫 07 首次收到回应\n身份类型：外部意识\n舰内定位：不可访问\n回溯范围：外部\n历史同名身份：0',
    chapter: '第五章：真相（下）',
    order: 250,
  },
  {
    id: 'anomaly_seventh_reboot_file',
    category: 'anomaly',
    title: '六次任务失败 / 航迹交叉比对',
    description: '前五次：故障系统各不相同\n共同位置：静默航区 S-7\n共同前兆：舰钟漂移 / 星图校正跳变 / 航迹偏移\n第六次：绕行模拟通过 / 航线修正已提交\n执行结果：第七协议强制回溯',
    chapter: '第五章：真相（下）',
    order: 260,
  },
  {
    id: 'anomaly_gravity_array',
    category: 'anomaly',
    title: '分区式人工重力阵列',
    subtitle: 'AURORA / GRAVITY GRID',
    description: '系统名称：分区式人工重力阵列\n生活区标准值：0.78g\n正常波动：0.75—0.80g\n优先区域：医疗区、食堂、居住区、主走廊\n低优先级区域：维修管道、储物层、非值守舱段\n低优先级正常值：0.15—0.40g\n故障模式：降级、波动、局部关闭\n能源规则：按区域优先级逐级降载\n独立回路：舱压 / 空气循环 / 生命维持\n能力边界：仅形成稳定低强度甲板方向\n系统复位：生活区自动重新同步',
    chapter: '工程档案 / 第五章：真相（下）',
    order: 270,
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
    description: '年龄：23\n职位：Aurora 领航员\n部门：领航部\n档案编号：NA-0523-19\n权限等级：LEVEL 5',
    image: '/assets/nova_id_photo.png',
    order: 330,
  },
  {
    id: 'profile_truth',
    category: 'profile',
    title: 'Observer 链路：首次确认',
    subtitle: '外部呼叫 07：收到回应',
    description: '外部呼叫 01—06：无回应 / 未建立身份\nObserver-01：本轮序章首次回复后建立\n当前有效身份：1',
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
    description: 'REBOOT 08 无法重建 LIVE-07\n最后一份外部握手缓存只能回读一次',
    order: 430,
  },
  {
    id: 'epilogue_normal',
    category: 'future',
    title: '未来记录：模糊的温度',
    subtitle: '普通结局后续档案',
    description: '记录时间：十二年后\n记录来源：无法验证\n连续性状态：未知',
    epilogueKind: 'normal',
    order: 510,
  },
  {
    id: 'epilogue_true',
    category: 'future',
    title: '未来记录：直到最后都还记得',
    subtitle: '真结局后续档案',
    description: '记录时间：十二年后\n记录来源：无法验证\n连续性状态：未知',
    epilogueKind: 'true',
    order: 520,
  },
];

export function getArchiveEntries(stats: GameStats, contactStage: ContactStage): ArchiveEntry[] {
  const unlocked = new Set<string>(stats.unlockedArchives);
  stats.memoryAnchors.forEach(anchor => unlocked.add(ANCHOR_ARCHIVE_IDS[anchor]));
  stats.endingsUnlocked.forEach(ending => unlocked.add(ending));
  unlocked.delete('epilogue_normal');
  unlocked.delete('epilogue_true');
  if (stats.normalEpilogueUnlocked) unlocked.add('epilogue_normal');
  if (stats.trueEpilogueUnlocked) unlocked.add('epilogue_true');
  unlocked.add('profile_unknown');
  if (contactStage === 'named' || contactStage === 'verified') unlocked.add('profile_named');
  if (contactStage === 'verified') unlocked.add('profile_verified');

  return ARCHIVE_ENTRIES
    .map(entry => ({ ...entry, unlocked: unlocked.has(entry.id) }))
    .sort((a, b) => a.order - b.order);
}

export function applyArchiveUnlocks(
  stats: GameStats,
  entryIds: string | string[],
): GameStats {
  const ids = Array.isArray(entryIds) ? entryIds : [entryIds];
  const normalized = [...new Set(ids.filter(Boolean))];
  if (normalized.length === 0) return stats;

  const unlockedArchives = new Set(stats.unlockedArchives);
  const endingsUnlocked = new Set(stats.endingsUnlocked);

  normalized.forEach(id => {
    unlockedArchives.add(id);
    if (id === 'ending_true' || id === 'ending_normal' || id === 'ending_bad') {
      endingsUnlocked.add(id);
    }
  });

  const normalEpilogueUnlocked =
    stats.normalEpilogueUnlocked || endingsUnlocked.has('ending_normal');
  const trueEpilogueUnlocked =
    stats.trueEpilogueUnlocked || endingsUnlocked.has('ending_true');
  const changed =
    unlockedArchives.size !== stats.unlockedArchives.length
    || endingsUnlocked.size !== stats.endingsUnlocked.length
    || normalEpilogueUnlocked !== stats.normalEpilogueUnlocked
    || trueEpilogueUnlocked !== stats.trueEpilogueUnlocked;

  if (!changed) return stats;
  return {
    ...stats,
    unlockedArchives: [...unlockedArchives],
    endingsUnlocked: [...endingsUnlocked],
    normalEpilogueUnlocked,
    trueEpilogueUnlocked,
  };
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
    case 'future':
      return '未来记录';
  }
}
