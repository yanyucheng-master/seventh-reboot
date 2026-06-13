export type GameScreen = 'menu' | 'playing';

export type NovaEmotion = 'normal' | 'smile' | 'sad' | 'glitch';

export type Speaker = 'nova' | 'system' | 'player';

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
  | 'comm-log';

export type MemoryAnchor =
  | 'n7'
  | 'candy'
  | 'flower'
  | 'firstMessage'
  | 'goodnight'
  | 'finalWords';

export interface GameStats {
  trust: number;
  attachment: number;
  memoryAnchors: MemoryAnchor[];
}

export type DisplayMessage = {
  id: string;
  speaker: Speaker;
  type: MessageType;
  content: string;
  emotion?: NovaEmotion;
  image?: string;
  isGlitch?: boolean;
  isNew?: boolean;
};

export interface SaveData {
  pendingNodeId: string;
  messages: DisplayMessage[];
  novaEmotion: NovaEmotion;
  stats: GameStats;
  timestamp: number;
  /** @deprecated 旧版存档字段，仅用于兼容 */
  currentNodeId?: string;
}
