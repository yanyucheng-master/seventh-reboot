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
  | 'special_bulkhead'
  | 'special_password'
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
  | 'final_protocol_choice';

export type LegacyDeliveryEventKey =
  | 'chapter5_explicit_failure'
  | 'finale_last_answer';

export type PersistedDeliveryEventKey = DeliveryEventKey | LegacyDeliveryEventKey;

export type DeliveryEventPhase = 'not_started' | 'in_progress' | 'completed';

export type DeliveryEventReceipts = {
  prologueFirstReply: DeliveryEventPhase;
  chapter3ReconnectReply: DeliveryEventPhase;
  finalProtocolChoice: DeliveryEventPhase;
};

export type ChatDeliveryRuntime = {
  deliveryStateVersion: 2;
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

export type Speaker = 'nova' | 'system' | 'player' | 'observer';

export type GlitchLevel = 1 | 2 | 3;

export type ArchiveCategory =
  | 'anchor'
  | 'photo'
  | 'anomaly'
  | 'profile'
  | 'ending'
  | 'future';

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
  | 'uncertain_but_honest'
  | 'promise'
  | 'relief'
  | 'honest';

export type TimedResponse = 'calm_nova' | 'investigate_log';

export type TimedProof = 'n7_core_anchor';

export type SpecialInteractionKind =
  | 'bulkhead-isolation'
  | 'sealed-record-order'
  | 'power-routing'
  | 'memory-seal'
  | 'course-lock'
  | 'protocol-cut'
  | 'memory-restore';

export type BulkheadResult = 'safe' | 'injured' | 'fatal';

export type BulkheadFailureReason =
  | 'wrong_observation_door'
  | 'hallway_sealed'
  | 'transition_purged'
  | 'seal_timeout';

export type PowerRoutingAttempt = 0 | 1 | 2;

export type PowerFailureReason =
  | 'life_support_below_minimum'
  | 'communications_interrupted'
  | 'core_scan_underpowered'
  | 'return_core_cutoff'
  | 'timeout';

export type PowerRoutingResult = 'first_success' | 'retry_success' | 'fatal';

export type SealableMemoryAnchor = 'maintenance_board' | 'white_flower' | 'goodnight';

export type SpecialInteractionCompletion =
  | {
      kind: 'bulkhead-isolation';
      routeKey: BulkheadResult;
      failureReason?: BulkheadFailureReason;
    }
  | { kind: 'sealed-record-order'; routeKey: 'success' | 'retry' }
  | {
      kind: 'power-routing';
      routeKey: 'success' | 'fail' | 'fatal';
      attempt: 1 | 2;
      failureReason?: PowerFailureReason;
    }
  | { kind: 'memory-seal'; routeKey: SealableMemoryAnchor; anchor: SealableMemoryAnchor }
  | { kind: 'course-lock'; routeKey: 'success' | 'retry' | 'fatal' }
  | { kind: 'protocol-cut'; routeKey: 'success' | 'fatal' }
  | { kind: 'memory-restore'; routeKey: SealableMemoryAnchor | 'none'; anchor?: SealableMemoryAnchor };

export type FatalFailureCause =
  | 'bulkhead_failure'
  | 'power_routing_failure'
  | 'course_lock_failure'
  | 'protocol_cut_failure'
  | 'protocol_refusal'
  | 'protocol_rollback';

export type CycleChoiceRecord = {
  nodeId: string;
  choiceId: string;
  choiceIndex: number;
  nextId: string;
  committedAt: number;
};

export type CycleInteractionRecord = {
  nodeId: string;
  kind: SpecialInteractionKind;
  routeKey: string;
  attempt?: 1 | 2;
  failureReason?: BulkheadFailureReason | PowerFailureReason;
  anchor?: SealableMemoryAnchor;
};

export type CycleTimedResult = {
  nodeId: string;
  outcome: 'choice' | 'timeout';
  choiceId?: string;
  nextId: string;
};

export type CycleFreeInputRecord = {
  nodeId: string;
  value: string;
  nextId: string;
};

export type CurrentCycleState = {
  cycleStateVersion: 2;
  cycleId: string;
  currentRebootNumber: number;
  completedNodeIds: string[];
  maxCompletedNodeId?: string;
  choiceHistory: CycleChoiceRecord[];
  interactionResults: CycleInteractionRecord[];
  timedResults: CycleTimedResult[];
  freeInputs: CycleFreeInputRecord[];
  syncAvailable: boolean;
  syncActive: boolean;
  syncInterrupted: boolean;
  syncBoundaryNodeId?: string;
  syncCursor: number;
  currentCycleDeviationStarted: boolean;
  observerCandyEchoPlayed: boolean;
  previousCycleId?: string;
  damagedSeventh: boolean;
  lastStableCheckpoint?: StableCheckpointSnapshot;
};

export type FailedCycleRecord = {
  cycleId: string;
  rebootNumber: number;
  failedAt: number;
  fatalEndingTriggered: true;
  failedInteractionId: string;
  failureCause: FatalFailureCause;
  previousCycleMaxNodeId?: string;
  completedNodeIds: string[];
  choiceHistory: CycleChoiceRecord[];
  interactionResults: CycleInteractionRecord[];
  timedResults: CycleTimedResult[];
  freeInputs: CycleFreeInputRecord[];
  lastStableCheckpoint?: StableCheckpointSnapshot;
};

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
  epilogueKind?: 'normal' | 'true';
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
  | 'internal-chapter-marker'
  | 'internal-ending-marker'
  | 'observer-echo'
  | 'ending-title'
  | 'title-state'
  | 'route'
  | 'state-write'
  | 'dynamic-jump'
  | 'menu'
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
  relationshipStrain: number;
  firstMessageCorrect: boolean;
  n7ProofSucceeded: boolean;
  bulkheadResult?: BulkheadResult;
  bulkheadInjured: boolean;
  bulkheadFailureReason?: BulkheadFailureReason;
  jointAuthorizationCompleted: boolean;
  criticalLogUnlocked: boolean;
  powerRoutingAttempt: PowerRoutingAttempt;
  powerFirstFailureReason?: PowerFailureReason;
  powerRoutingResult?: PowerRoutingResult;
  nova06RollbackAuthorizationAvailable: boolean;
  nova06RollbackAuthorizationUsed: boolean;
  aiEmergencyRollbackExecuted: boolean;
  nova06RecordingDamaged: boolean;
  damagedSeventh: boolean;
  binaryScarUI: boolean;
  reboot08FallbackUsed: boolean;
  courseLockCompleted: boolean;
  protocolCutCompleted: boolean;
  gravityArrayDegraded: boolean;
  temporaryAnchorSealed?: SealableMemoryAnchor;
  temporaryAnchorRestored: boolean;
  memoryRestoreResult?: SealableMemoryAnchor | 'none';
  earlyFailureCause?: FatalFailureCause;
  fatalSourceNodeId?: string;
  pendingReboot08: boolean;
  fatalEndingTriggered: boolean;
  fatalRebootCount: number;
  reboot08TitleUnlocked: boolean;
  normalEpilogueUnlocked: boolean;
  trueEpilogueUnlocked: boolean;
}

/** UI 生成的系统提示（非剧情节点正文），切语言时按 key 重算 */
export type AvatarNoticeKey =
  | 'avatar.connection.unregistered'
  | 'avatar.badEnding.profileReset';

export type CycleNoticeKey =
  | 'cycle.reboot08Link'
  | 'cycle.previousRecordDetected'
  | 'cycle.previousRecordSource'
  | 'cycle.previousRecordCycle'
  | 'cycle.memoryProjection'
  | 'cycle.projectionWarning'
  | 'cycle.protocolTakeover'
  | 'cycle.rollbackStarted'
  | 'cycle.syncCompleted'
  | 'cycle.syncInterrupted'
  | 'cycle.deviationDetected'
  | 'cycle.deviationConfirmed';

export type RuntimeNoticeKey = AvatarNoticeKey | CycleNoticeKey;

export type DisplayMessageUiKind =
  | 'memoryRecorded'
  | 'syncNext'
  | 'choiceTimeout'
  | 'avatarNotice'
  | 'cycleNotice';

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
  uiKey?: RuntimeNoticeKey;
  /** Player-choice fact and delivery state. The branch is committed before transport begins. */
  choiceId?: string;
  committedAt?: number;
  deliveredAt?: number;
  committedOrder?: number;
  deliverySequence?: number;
  deliveryState?: OutgoingMessageDeliveryState;
  scriptedDeliveryEvent?: PersistedDeliveryEventKey;
  retryCount?: number;
  autoRetry?: boolean;
  allowFail?: boolean;
  branchCommitted?: boolean;
  branchTargetNodeId?: string;
  deliveryLatencyMs?: number;
  deliveryLabelVisible?: boolean;
  reordered?: boolean;
};

export type StableCheckpointSnapshot = {
  nodeId: string;
  capturedAt: number;
  stats: GameStats;
  messages: DisplayMessage[];
  contactStage: ContactStage;
  avatarState: NovaAvatarStoryState;
  deliveryRuntime: ChatDeliveryRuntime;
  cycleState: Omit<CurrentCycleState, 'lastStableCheckpoint'>;
};

export interface SaveData {
  pendingNodeId: string;
  messages: DisplayMessage[];
  contactStage: ContactStage;
  avatarState: NovaAvatarStoryState;
  deliveryRuntime: ChatDeliveryRuntime;
  stats: GameStats;
  cycleState: CurrentCycleState;
  timestamp: number;
  /** 剧情拓扑版本；节点分支变更后递增，旧存档将失效 */
  storyVersion?: string;
  /** 内部剧情内容版本；玩家可见版本仍保持 V1.0 */
  storyContentVersion?: string;
  /** 内部存档结构版本；与玩家可见版本号无关。 */
  saveStateVersion?: 5;
  deliveryStateVersion?: 2;
  /** @deprecated 旧版存档字段，仅用于兼容 */
  currentNodeId?: string;
}
