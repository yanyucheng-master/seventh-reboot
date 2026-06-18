export type GameScreen = 'menu' | 'playing';

export type NovaEmotion = 'normal' | 'smile' | 'sad' | 'glitch';

export type ContactStage = 'unknown' | 'named' | 'verified';

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
  ending?: EndingType;
  unlockedArchives: string[];
  endingsUnlocked: EndingId[];
}

export type DisplayMessage = {
  id: string;
  speaker: Speaker;
  type: MessageType;
  content: string;
  emotion?: NovaEmotion;
  image?: string;
  contactStage?: ContactStage;
  isGlitch?: boolean;
  glitchLevel?: GlitchLevel;
  isNew?: boolean;
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
  /** @deprecated 旧版存档字段，仅用于兼容 */
  currentNodeId?: string;
}
