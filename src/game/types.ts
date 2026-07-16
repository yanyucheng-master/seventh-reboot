export type GameScreen = 'menu' | 'playing';

export type ContactStage = 'unknown' | 'named' | 'verified';

export type NovaBaseAvatar =
  | 'unknown_signal'
  | 'official_navigator'
  | 'n7_private'
  | 'white_flower';

export type NovaAvatarOverlay =
  | 'none'
  | 'signal_weak'
  | 'offline_residual'
  | 'archived'
  | 'nova06_interference'
  | 'special_password'
  | 'special_signal'
  | 'special_power'
  | 'special_memory_seal';

export type NovaEndingAvatarMode =
  | 'none'
  | 'private_archive'
  | 'official_identity_restored';

export type NovaConnectionState = 'stable' | 'weak' | 'offline' | 'archived';

export type OutgoingMessageDeliveryState =
  | 'queued'
  | 'sending'
  | 'delayed'
  | 'failed'
  | 'delivered';

export type CommunicationLinkState =
  | 'stable'
  | 'degraded'
  | 'unstable'
  | 'interrupted'
  | 'restoring';

export type DeliveryEventKey =
  | 'prologue_first_reply'
  | 'chapter3_reconnect_reply'
  | 'chapter5_explicit_failure'
  | 'finale_last_answer';

export type DeliveryEventPhase = 'not_started' | 'in_progress' | 'completed';

export type DeliveryEventReceipts = {
  prologueFirstReply: DeliveryEventPhase;
  chapter3ReconnectReply: DeliveryEventPhase;
  chapter5ExplicitFailure: DeliveryEventPhase;
  finaleLastAnswer: DeliveryEventPhase;
  powerEmergencyPacketLoss: DeliveryEventPhase;
};

export type ChatDeliveryRuntime = {
  deliveryStateVersion: 1;
  linkState: CommunicationLinkState;
  activeMessageId?: string;
  pendingAutoRetryIds: string[];
  receipts: DeliveryEventReceipts;
};

export type NovaAvatarTransition =
  | 'identity-verification'
  | 'private-profile'
  | 'flower-profile'
  | 'profile-clear';

export type NovaSpeakerIdentity = 'residual06';

export type NovaAvatarEventReceipts = {
  unknownConnectionNoticeShown: boolean;
  identityVerificationAnimationSeen: boolean;
  identityVerificationNoticeShown: boolean;
  n7ProfileTransitionSeen: boolean;
  whiteFlowerProfileTransitionSeen: boolean;
  badEndingProfileClearAnimationSeen: boolean;
  trueEndingArchiveNoticeShown: boolean;
  normalEndingArchiveNoticeShown: boolean;
};

export type NovaAvatarStoryState = {
  novaAvatarStateVersion: 1;
  novaIdentityVerified: boolean;
  novaOfficialProfileEstablished: boolean;
  n7StoryIntroduced: boolean;
  n7PhotoShared: boolean;
  n7AvatarQueued: boolean;
  n7AvatarActivated: boolean;
  whiteFlowerSeen: boolean;
  whiteFlowerPhotoShared: boolean;
  whiteFlowerAvatarQueued: boolean;
  whiteFlowerAvatarActive: boolean;
  whiteFlowerAvatarExpired: boolean;
  novaConnectionState: NovaConnectionState;
  novaEndingAvatarMode: NovaEndingAvatarMode;
  novaAvatarEventReceipts: NovaAvatarEventReceipts;
  novaAvatarProfileUpdatedAt?: string;
};

export type NovaAvatarPresentation = {
  base: NovaBaseAvatar;
  overlay: NovaAvatarOverlay;
};

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
  /** 玩家端纪念归档已确认保存；跨周目保留。 */
  commemorativeArchiveSaved: boolean;
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
export type AvatarNoticeKey =
  | 'avatar.connection.unregistered'
  | 'avatar.badEnding.profileReset';

export type DisplayMessageUiKind = 'memoryRecorded' | 'syncNext' | 'choiceTimeout' | 'avatarNotice';

export type DisplayMessage = {
  id: string;
  speaker: Speaker;
  type: MessageType;
  content: string;
  image?: string;
  displayName?: string;
  speakerIdentity?: NovaSpeakerIdentity;
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
  /** avatarNotice uses a stable i18n key so saved notices follow language changes. */
  uiKey?: AvatarNoticeKey;
  /** Player-choice fact and delivery state. The branch is committed before transport begins. */
  choiceId?: string;
  committedAt?: number;
  deliveredAt?: number;
  committedOrder?: number;
  deliverySequence?: number;
  deliveryState?: OutgoingMessageDeliveryState;
  scriptedDeliveryEvent?: DeliveryEventKey;
  retryCount?: number;
  autoRetry?: boolean;
  allowFail?: boolean;
  branchCommitted?: boolean;
  branchTargetNodeId?: string;
  deliveryLatencyMs?: number;
  deliveryLabelVisible?: boolean;
  reordered?: boolean;
};

export interface SaveData {
  pendingNodeId: string;
  messages: DisplayMessage[];
  contactStage: ContactStage;
  avatarState: NovaAvatarStoryState;
  deliveryRuntime: ChatDeliveryRuntime;
  stats: GameStats;
  timestamp: number;
  /** 剧情拓扑版本；节点分支变更后递增，旧存档将失效 */
  storyVersion?: string;
  /** 内部剧情内容版本；玩家可见版本仍保持 V1.0 */
  storyContentVersion?: string;
  deliveryStateVersion?: 1;
  /** @deprecated 旧版存档字段，仅用于兼容 */
  currentNodeId?: string;
}
