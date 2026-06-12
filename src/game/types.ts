export type GameScreen = 'menu' | 'playing';

export type NovaEmotion = 'normal' | 'smile' | 'sad';

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
  speaker: 'nova' | 'system' | 'player';
  type: string;
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
