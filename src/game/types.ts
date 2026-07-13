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

export type SpecialInteractionKind =
  | 'critical-log-password'
  | 'signal-separation'
  | 'power-routing'
  | 'memory-seal'
  | 'memory-restore';

export type NovaHintStage = 0 | 1 | 2 | 3;

export type SignalSeparationResult = 'clean' | 'assisted';

export type PowerRoutingResult = 'excellent' | 'stable' | 'emergency_assist';

export type SealableMemoryAnchor = 'maintenance_board' | 'white_flower' | 'goodnight';

export type SpecialInteractionCompletion =
  | { kind: 'critical-log-password'; routeKey: 'success'; completedByNova06?: boolean }
  | { kind: 'signal-separation'; routeKey: SignalSeparationResult; completedByNova06?: boolean }
  | { kind: 'power-routing'; routeKey: PowerRoutingResult; completedByNova06?: boolean }
  | { kind: 'memory-seal'; routeKey: SealableMemoryAnchor; anchor: SealableMemoryAnchor }
  | { kind: 'memory-restore'; routeKey: SealableMemoryAnchor | 'none'; anchor?: SealableMemoryAnchor };

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
  criticalLogUnlocked: boolean;
  signalSeparationResult?: SignalSeparationResult;
  signalCurrentNovaRecovered: boolean;
  signalNova06Recovered: boolean;
  signalCoreTelemetryRecovered: boolean;
  timelineAlignmentCompleted: boolean;
  powerRoutingResult?: PowerRoutingResult;
  temporaryAnchorSealed?: SealableMemoryAnchor;
  temporaryAnchorRestored: boolean;
  /** NOVA-06 残留签名越权接管：完整黑入演出是否已在本周目播放过 */
  nova06FirstOverrideSeen: boolean;
  /** 当前特殊互动已经出现的 Nova 主动提示阶段；与互动类型一起保存 */
  novaHintStage: NovaHintStage;
  novaHintInteractionKind?: SpecialInteractionKind;
  /** 本周目是否曾进入过一次 NOVA-06 条件式越权流程 */
  nova06OverrideTriggered: boolean;
  /** 联合密钥互动由 NOVA-06 后门绕过验证 */
  passwordBypassedByNova06: boolean;
  /** 三层信号分离由 NOVA-06 预留恢复脚本完成 */
  signalCompletedByNova06: boolean;
  /** 联合时间线对齐由 NOVA-06 预留恢复脚本完成（与信号分离同一脚本） */
  timelineCompletedByNova06: boolean;
  /** 供能路由由 NOVA-06 预留配平脚本完成 */
  powerCompletedByNova06: boolean;
  /** 记忆封存中的 NOVA-06 预留留言是否已出现；它永远不代表代选完成 */
  memoryNova06NoteSeen: boolean;
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
