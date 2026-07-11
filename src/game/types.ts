export type GameScreen = 'menu' | 'playing';

export type NovaEmotion = 'normal' | 'smile' | 'sad' | 'glitch';

export type ContactStage = 'unknown' | 'named' | 'verified';

export type AvatarProfile = 'unknown' | 'nova' | 'nova_glitch';

export type Speaker = 'nova' | 'system' | 'player';

export type GlitchLevel = 1 | 2 | 3;

export type ArchiveCategory =
  | 'anchor'
  | 'photo'
  | 'anomaly'
  | 'profile'
  | 'ending';

export type EndingId = 'ending_true' | 'ending_normal' | 'ending_bad';

export type EndingType = 'true' | 'normal' | 'bad';

export type FinalChoice = 'accept_farewell' | 'refuse_farewell';

export type FinalFarewellVariant =
  | 'remembered_until_end'
  | 'remembered_wrong'
  | 'forgetting_started';

export type FinalFarewellTone =
  | 'warm_acceptance'
  | 'painful_truth'
  | 'uncertain_but_honest';

export type TimedResponse = 'calm_nova' | 'investigate_log';

export type TimedProof = 'n7_core_anchor';

export interface ArchiveEntry {
  id: string;
  category: ArchiveCategory;
  title: string;
  subtitle?: string;
  description?: string;
  quote?: string;
  image?: string;
  unlocked: boolean;
  unlockedAt?: string;
  chapter?: string;
  order: number;
}

export type MessageType =
  | 'text'
  | 'choice'
  | 'image'
  | 'typing'
  | 'delay'
  | 'status'
  | 'interaction'
  | 'timestamp'
  | 'chapter'
  | 'draft'
  | 'glitch'
  | 'file'
  | 'end'
  | 'input'
  | 'comm-log'
  | 'memory-anchor'
  | 'epilogue'
  | 'ending-action'
  | 'disconnect'
  | 'reconnectFailed'
  | 'signalError';

export type MemoryAnchorId =
  | 'n7'
  | 'milk_candy'
  | 'white_flower'
  | 'first_message'
  | 'goodnight'
  | 'observatory'
  | 'maintenance_board'
  | 'steak';

export interface GameStats {
  trust: number;
  memory: number;
  attachment: number;
  memoryAnchors: MemoryAnchorId[];
  acceptFarewell: boolean;
  finalChoice?: FinalChoice;
  finalFarewellVariant?: FinalFarewellVariant;
  finalFarewellTone?: FinalFarewellTone;
  timedResponse?: TimedResponse;
  timedProof?: TimedProof;
  ending?: EndingType;
  unlockedArchives: string[];
  endingsUnlocked: EndingId[];
}

/** UI 生成的系统提示（非剧情节点正文），切语言时按 key 重算 */
export type DisplayMessageUiKind = 'memoryRecorded' | 'syncNext' | 'choiceTimeout';

export type DisplayMessage = {
  id: string;
  speaker: Speaker;
  type: MessageType;
  content: string;
  emotion?: NovaEmotion;
  image?: string;
  contactStage?: ContactStage;
  displayName?: string;
  avatarProfile?: AvatarProfile;
  isGlitch?: boolean;
  glitchLevel?: GlitchLevel;
  isNew?: boolean;
  /** 来源剧情节点；切语言 / 读档时用于重本地化 */
  sourceNodeId?: string;
  /** 玩家选项回复对应的选项下标 */
  sourceChoiceIndex?: number;
  /** 非剧情正文的 UI 文案种类 */
  uiKind?: DisplayMessageUiKind;
  /** memoryRecorded 对应的记忆锚点 */
  memoryAnchor?: MemoryAnchorId;
};

export interface SaveData {
  pendingNodeId: string;
  messages: DisplayMessage[];
  novaEmotion: NovaEmotion;
  contactStage: ContactStage;
  stats: GameStats;
  timestamp: number;
  /** 剧情拓扑版本；节点分支变更后递增，旧存档将失效 */
  storyVersion?: string;
  /** 内部剧情内容版本；玩家可见版本仍保持 V1.0 */
  storyContentVersion?: string;
  /** @deprecated 旧版存档字段，仅用于兼容 */
  currentNodeId?: string;
}
