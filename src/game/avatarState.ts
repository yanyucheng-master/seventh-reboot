import type {
  CommunicationLinkState,
  ContactStage,
  DisplayMessage,
  GameStats,
  NovaAvatarOverlay,
  NovaAvatarPresentation,
  NovaAvatarStoryState,
  NovaAvatarTransition,
  NovaBaseAvatar,
  NovaConnectionState,
  NovaEndingAvatarMode,
  SpecialInteractionKind,
} from './types';

const AVATAR_STATE_VERSION = 1 as const;

export function createNovaAvatarEventReceipts(): NovaAvatarStoryState['novaAvatarEventReceipts'] {
  return {
    unknownConnectionNoticeShown: false,
    identityVerificationAnimationSeen: false,
    identityVerificationNoticeShown: false,
    n7ProfileTransitionSeen: false,
    whiteFlowerProfileTransitionSeen: false,
    badEndingProfileClearAnimationSeen: false,
    trueEndingArchiveNoticeShown: false,
    normalEndingArchiveNoticeShown: false,
  };
}

export function createDefaultNovaAvatarState(): NovaAvatarStoryState {
  return {
    novaAvatarStateVersion: AVATAR_STATE_VERSION,
    novaIdentityVerified: false,
    novaOfficialProfileEstablished: false,
    n7StoryIntroduced: false,
    n7PhotoShared: false,
    n7AvatarQueued: false,
    n7AvatarActivated: false,
    whiteFlowerSeen: false,
    whiteFlowerPhotoShared: false,
    whiteFlowerAvatarQueued: false,
    whiteFlowerAvatarActive: false,
    whiteFlowerAvatarExpired: false,
    novaConnectionState: 'weak',
    novaEndingAvatarMode: 'none',
    novaAvatarEventReceipts: createNovaAvatarEventReceipts(),
  };
}

const CONNECTION_STATES = new Set<NovaConnectionState>(['stable', 'weak', 'offline', 'archived']);
const ENDING_MODES = new Set<NovaEndingAvatarMode>(['none', 'private_archive', 'official_identity_restored']);

function asBoolean(value: unknown): boolean {
  return value === true;
}

export function normalizeNovaAvatarState(value: unknown): NovaAvatarStoryState {
  const fallback = createDefaultNovaAvatarState();
  if (!value || typeof value !== 'object') return fallback;
  const state = value as Partial<NovaAvatarStoryState>;
  const receipts: Partial<NovaAvatarStoryState['novaAvatarEventReceipts']> =
    state.novaAvatarEventReceipts && typeof state.novaAvatarEventReceipts === 'object'
      ? state.novaAvatarEventReceipts
      : {};
  const connection = CONNECTION_STATES.has(state.novaConnectionState as NovaConnectionState)
    ? state.novaConnectionState as NovaConnectionState
    : fallback.novaConnectionState;
  const endingMode = ENDING_MODES.has(state.novaEndingAvatarMode as NovaEndingAvatarMode)
    ? state.novaEndingAvatarMode as NovaEndingAvatarMode
    : fallback.novaEndingAvatarMode;

  return {
    novaAvatarStateVersion: AVATAR_STATE_VERSION,
    novaIdentityVerified: asBoolean(state.novaIdentityVerified),
    novaOfficialProfileEstablished: asBoolean(state.novaOfficialProfileEstablished),
    n7StoryIntroduced: asBoolean(state.n7StoryIntroduced),
    n7PhotoShared: asBoolean(state.n7PhotoShared),
    n7AvatarQueued: asBoolean(state.n7AvatarQueued),
    n7AvatarActivated: asBoolean(state.n7AvatarActivated),
    whiteFlowerSeen: asBoolean(state.whiteFlowerSeen),
    whiteFlowerPhotoShared: asBoolean(state.whiteFlowerPhotoShared),
    whiteFlowerAvatarQueued: asBoolean(state.whiteFlowerAvatarQueued),
    whiteFlowerAvatarActive: asBoolean(state.whiteFlowerAvatarActive),
    whiteFlowerAvatarExpired: asBoolean(state.whiteFlowerAvatarExpired),
    novaConnectionState: connection,
    novaEndingAvatarMode: endingMode,
    novaAvatarEventReceipts: {
      unknownConnectionNoticeShown: asBoolean(receipts.unknownConnectionNoticeShown),
      identityVerificationAnimationSeen: asBoolean(receipts.identityVerificationAnimationSeen),
      identityVerificationNoticeShown: asBoolean(receipts.identityVerificationNoticeShown),
      n7ProfileTransitionSeen: asBoolean(receipts.n7ProfileTransitionSeen),
      whiteFlowerProfileTransitionSeen: asBoolean(receipts.whiteFlowerProfileTransitionSeen),
      badEndingProfileClearAnimationSeen: asBoolean(receipts.badEndingProfileClearAnimationSeen),
      trueEndingArchiveNoticeShown: asBoolean(receipts.trueEndingArchiveNoticeShown),
      normalEndingArchiveNoticeShown: asBoolean(receipts.normalEndingArchiveNoticeShown),
    },
    ...(typeof state.novaAvatarProfileUpdatedAt === 'string'
      ? { novaAvatarProfileUpdatedAt: state.novaAvatarProfileUpdatedAt }
      : {}),
  };
}

export function resolveNovaBaseAvatar(state: NovaAvatarStoryState): NovaBaseAvatar {
  if (!state.novaIdentityVerified) return 'unknown_signal';
  if (state.novaEndingAvatarMode === 'official_identity_restored') return 'official_navigator';
  if (state.whiteFlowerAvatarActive && !state.whiteFlowerAvatarExpired) return 'white_flower';
  if (state.n7AvatarActivated) return 'n7_private';
  return 'official_navigator';
}

export type NovaAvatarTransientState = {
  nova06AvatarInterferenceActive?: boolean;
  activeSpecialInteraction?: SpecialInteractionKind | null;
  communicationLinkState?: CommunicationLinkState;
};

export function resolveNovaAvatarOverlay(
  state: NovaAvatarStoryState,
  transient: NovaAvatarTransientState = {},
): NovaAvatarOverlay {
  if (transient.nova06AvatarInterferenceActive) return 'nova06_interference';
  if (state.novaConnectionState === 'archived') return 'archived';
  if (state.novaConnectionState === 'offline') return 'offline_residual';
  if (transient.communicationLinkState === 'interrupted') return 'offline_residual';
  if (
    transient.communicationLinkState === 'restoring'
    || transient.communicationLinkState === 'unstable'
    || transient.communicationLinkState === 'degraded'
  ) return 'signal_weak';
  if (state.novaConnectionState === 'weak') return 'signal_weak';

  switch (transient.activeSpecialInteraction) {
    case 'bulkhead-isolation':
      return 'special_bulkhead';
    case 'critical-log-password':
      return 'special_password';
    case 'power-routing':
      return 'special_power';
    case 'memory-seal':
    case 'memory-restore':
      return 'special_memory_seal';
    default:
      return 'none';
  }
}

export function resolveNovaAvatarPresentation(
  state: NovaAvatarStoryState,
  transient: NovaAvatarTransientState = {},
): NovaAvatarPresentation {
  return {
    base: resolveNovaBaseAvatar(state),
    overlay: resolveNovaAvatarOverlay(state, transient),
  };
}

export type NovaAvatarNodeEffect = {
  state: NovaAvatarStoryState;
  transition?: NovaAvatarTransition;
  noticeKeys: Array<'avatar.connection.unregistered' | 'avatar.badEnding.profileReset'>;
};

function patchState(
  state: NovaAvatarStoryState,
  patch: Partial<NovaAvatarStoryState>,
  receiptPatch?: Partial<NovaAvatarStoryState['novaAvatarEventReceipts']>,
): NovaAvatarStoryState {
  return {
    ...state,
    ...patch,
    novaAvatarEventReceipts: receiptPatch
      ? { ...state.novaAvatarEventReceipts, ...receiptPatch }
      : state.novaAvatarEventReceipts,
  };
}

export function applyNovaAvatarNodeEffect(
  current: NovaAvatarStoryState,
  nodeId: string,
  now = new Date().toISOString(),
): NovaAvatarNodeEffect {
  let state = current;
  let transition: NovaAvatarTransition | undefined;
  const noticeKeys: NovaAvatarNodeEffect['noticeKeys'] = [];

  if (nodeId === 'PRO-0002' && !state.novaAvatarEventReceipts.unknownConnectionNoticeShown) {
    state = patchState(state, {}, { unknownConnectionNoticeShown: true });
    noticeKeys.push('avatar.connection.unregistered');
  }

  if (nodeId === 'CH04-0124' && !state.novaIdentityVerified) {
    const animate = !state.novaAvatarEventReceipts.identityVerificationAnimationSeen;
    state = patchState(
      state,
      {
        novaIdentityVerified: true,
        novaOfficialProfileEstablished: true,
        novaConnectionState: 'stable',
        novaAvatarProfileUpdatedAt: now,
      },
      {
        identityVerificationAnimationSeen: true,
        identityVerificationNoticeShown: true,
      },
    );
    if (animate) transition = 'identity-verification';
  }

  if (nodeId === 'CH01-0128' && !state.n7StoryIntroduced) {
    state = patchState(state, { n7StoryIntroduced: true });
  }

  if (nodeId === 'CH01-0137' && (!state.n7PhotoShared || !state.n7AvatarQueued)) {
    state = patchState(state, { n7PhotoShared: true, n7AvatarQueued: true });
  }

  // Identity is only proven in chapter four. The 18:33 jump is the first calm
  // interval after that proof where the queued private profile can sync.
  if (
    nodeId === 'CH04-0153'
    && state.novaIdentityVerified
    && state.n7StoryIntroduced
    && state.n7PhotoShared
    && state.n7AvatarQueued
    && !state.n7AvatarActivated
  ) {
    const animate = !state.novaAvatarEventReceipts.n7ProfileTransitionSeen;
    state = patchState(
      state,
      {
        n7AvatarQueued: false,
        n7AvatarActivated: true,
        novaAvatarProfileUpdatedAt: now,
      },
      { n7ProfileTransitionSeen: true },
    );
    if (animate) transition = 'private-profile';
  }

  if (nodeId === 'CH03-0006' && (!state.whiteFlowerSeen || !state.whiteFlowerPhotoShared)) {
    state = patchState(state, {
      whiteFlowerSeen: true,
      whiteFlowerPhotoShared: true,
      whiteFlowerAvatarQueued: true,
    });
  }

  if (
    nodeId === 'CH04-0213'
    && state.n7AvatarActivated
    && state.whiteFlowerSeen
    && state.whiteFlowerPhotoShared
    && state.whiteFlowerAvatarQueued
    && !state.whiteFlowerAvatarExpired
  ) {
    const animate = !state.novaAvatarEventReceipts.whiteFlowerProfileTransitionSeen;
    state = patchState(
      state,
      {
        whiteFlowerAvatarQueued: false,
        whiteFlowerAvatarActive: true,
        novaAvatarProfileUpdatedAt: now,
      },
      { whiteFlowerProfileTransitionSeen: true },
    );
    if (animate) transition = 'flower-profile';
  }

  if ((nodeId === 'CH04-0221' || nodeId === 'CH05A-0001') && state.whiteFlowerAvatarActive) {
    state = patchState(state, {
      whiteFlowerAvatarActive: false,
      whiteFlowerAvatarExpired: true,
      novaAvatarProfileUpdatedAt: now,
    });
    transition = 'private-profile';
  }

  if (nodeId === 'CH03-0163' || nodeId === 'CH04-0221') {
    if (state.novaConnectionState !== 'offline') state = patchState(state, { novaConnectionState: 'offline' });
  }
  if (nodeId === 'CH03-0167' || nodeId === 'CH05A-0003') {
    if (state.novaConnectionState !== 'stable') state = patchState(state, { novaConnectionState: 'stable' });
  }
  if (nodeId === 'FIN-0288') {
    if (state.novaConnectionState !== 'weak') state = patchState(state, { novaConnectionState: 'weak' });
  }

  if (nodeId === 'END-T-0003') {
    state = patchState(
      state,
      { novaConnectionState: 'archived', novaEndingAvatarMode: 'private_archive' },
      { trueEndingArchiveNoticeShown: true },
    );
  }

  if (nodeId === 'END-N-0010') {
    state = patchState(
      state,
      { novaConnectionState: 'offline', novaEndingAvatarMode: 'private_archive' },
      { normalEndingArchiveNoticeShown: true },
    );
  }

  if (nodeId === 'END-B-0038' && state.novaEndingAvatarMode !== 'official_identity_restored') {
    const animate = !state.novaAvatarEventReceipts.badEndingProfileClearAnimationSeen;
    state = patchState(
      state,
      {
        n7AvatarQueued: false,
        n7AvatarActivated: false,
        whiteFlowerAvatarQueued: false,
        whiteFlowerAvatarActive: false,
        whiteFlowerAvatarExpired: true,
        novaConnectionState: 'offline',
        novaEndingAvatarMode: 'official_identity_restored',
        novaAvatarProfileUpdatedAt: now,
      },
      { badEndingProfileClearAnimationSeen: true },
    );
    noticeKeys.push('avatar.badEnding.profileReset');
    if (animate) transition = 'profile-clear';
  }

  return { state, transition, noticeKeys };
}

function getSourceNodeIds(messages: DisplayMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const message of messages) {
    if (message.sourceNodeId) ids.add(message.sourceNodeId);
    const match = message.id.match(/^(.+)_(\d+)$/);
    if (match) ids.add(match[1]);
  }
  return ids;
}

function findLastMessageIndex(messages: DisplayMessage[], nodeIds: Set<string>): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].sourceNodeId && nodeIds.has(messages[index].sourceNodeId!)) return index;
  }
  return -1;
}

export type NovaAvatarMigrationContext = {
  pendingNodeId: string;
  messages: DisplayMessage[];
  contactStage: ContactStage;
  stats: GameStats;
};

/** Rebuilds identity state from narrative evidence and ignores every legacy image path. */
export function migrateNovaAvatarState(
  value: unknown,
  context: NovaAvatarMigrationContext,
): NovaAvatarStoryState {
  if (
    value
    && typeof value === 'object'
    && (value as Partial<NovaAvatarStoryState>).novaAvatarStateVersion === AVATAR_STATE_VERSION
  ) {
    return normalizeNovaAvatarState(value);
  }

  const ids = getSourceNodeIds(context.messages);
  const state = createDefaultNovaAvatarState();
  const has = (id: string) => ids.has(id);
  const seenPrefix = (pattern: RegExp) => [...ids].some(id => pattern.test(id)) || pattern.test(context.pendingNodeId);
  const seenAtOrAfter = (prefix: string, index: number) => (
    [...ids, context.pendingNodeId].some(id => (
      id.startsWith(prefix)
      && Number(id.slice(-4)) >= index
    ))
  );
  const seenAfterChapterFour = seenPrefix(/^(?:CH05A|CH05B|FIN|END-[TNB])-/);
  const identityVerified = context.contactStage === 'verified' || has('CH04-0124');
  const n7Introduced = has('CH01-0128') || context.stats.memoryAnchors.includes('n7');
  const n7PhotoShared = has('CH01-0137') || context.messages.some(message => message.image === '/assets/nova_n7_photo.png');
  const reachedN7Sync = seenAtOrAfter('CH04-', 153) || seenAfterChapterFour;
  const flowerSeen = has('CH03-0006') || context.stats.memoryAnchors.includes('white_flower');
  const reachedFlowerSync = seenAtOrAfter('CH04-', 213) || seenAfterChapterFour;
  const flowerExpired = seenAtOrAfter('CH04-', 221) || seenAfterChapterFour;
  const badIdentityRestored = seenAtOrAfter('END-B-', 38);

  state.novaIdentityVerified = identityVerified;
  state.novaOfficialProfileEstablished = identityVerified;
  state.n7StoryIntroduced = n7Introduced;
  state.n7PhotoShared = n7PhotoShared;
  state.n7AvatarQueued = n7Introduced && n7PhotoShared && !reachedN7Sync;
  state.n7AvatarActivated = identityVerified && n7Introduced && n7PhotoShared && reachedN7Sync && !badIdentityRestored;
  state.whiteFlowerSeen = flowerSeen;
  state.whiteFlowerPhotoShared = flowerSeen;
  state.whiteFlowerAvatarQueued = flowerSeen && !reachedFlowerSync && !flowerExpired;
  state.whiteFlowerAvatarActive = state.n7AvatarActivated && flowerSeen && reachedFlowerSync && !flowerExpired;
  state.whiteFlowerAvatarExpired = flowerExpired;
  state.novaConnectionState = identityVerified ? 'stable' : 'weak';
  state.novaAvatarEventReceipts = {
    ...state.novaAvatarEventReceipts,
    unknownConnectionNoticeShown: has('PRO-0002') || context.messages.length > 0,
    identityVerificationAnimationSeen: identityVerified,
    identityVerificationNoticeShown: identityVerified,
    n7ProfileTransitionSeen: state.n7AvatarActivated || badIdentityRestored,
    whiteFlowerProfileTransitionSeen: reachedFlowerSync && flowerSeen,
    badEndingProfileClearAnimationSeen: badIdentityRestored,
  };

  const lastDisconnectIndex = findLastMessageIndex(context.messages, new Set(['CH03-0163', 'CH04-0221']));
  const lastReconnectIndex = findLastMessageIndex(context.messages, new Set(['CH03-0167', 'CH05A-0003']));
  if (lastDisconnectIndex > lastReconnectIndex) state.novaConnectionState = 'offline';

  if (has('END-T-0003') || has('END-T-0006')) {
    state.novaEndingAvatarMode = 'private_archive';
    state.novaConnectionState = 'archived';
    state.novaAvatarEventReceipts.trueEndingArchiveNoticeShown = true;
  } else if (has('END-N-0010') || has('END-N-0013')) {
    state.novaEndingAvatarMode = 'private_archive';
    state.novaConnectionState = 'offline';
    state.novaAvatarEventReceipts.normalEndingArchiveNoticeShown = true;
  } else if (badIdentityRestored) {
    state.novaEndingAvatarMode = 'official_identity_restored';
    state.novaConnectionState = 'offline';
    state.n7AvatarActivated = false;
    state.whiteFlowerAvatarActive = false;
  }

  return state;
}

/** Development-only checkpoint seed; it never enters a player save. */
export function createNovaAvatarStateForCheckpoint(nodeId: string): NovaAvatarStoryState {
  const state = createDefaultNovaAvatarState();
  const receipts = {
    ...createNovaAvatarEventReceipts(),
    unknownConnectionNoticeShown: true,
    identityVerificationAnimationSeen: true,
    identityVerificationNoticeShown: true,
  };
  const chapterFourIndex = nodeId.startsWith('CH04-') ? Number(nodeId.slice(-4)) : -1;
  const isChapterFour = chapterFourIndex >= 1;
  const isAfterChapterFour = /^(?:CH05A|CH05B|FIN|END-[TNB])-/.test(nodeId);
  const isAfterIdentityProof = chapterFourIndex >= 124 || isAfterChapterFour;
  const isAfterN7Sync = chapterFourIndex >= 153 || isAfterChapterFour;
  const isAfterFlowerSync = chapterFourIndex >= 213 || isAfterChapterFour;

  if (isChapterFour || isAfterChapterFour) {
    state.n7StoryIntroduced = true;
    state.n7PhotoShared = true;
    state.n7AvatarQueued = true;
    state.whiteFlowerSeen = true;
    state.whiteFlowerPhotoShared = true;
    state.whiteFlowerAvatarQueued = true;
  }
  if (isAfterIdentityProof) {
    state.novaIdentityVerified = true;
    state.novaOfficialProfileEstablished = true;
    state.novaConnectionState = 'stable';
  }
  if (isAfterN7Sync) {
    state.n7AvatarQueued = false;
    state.n7AvatarActivated = true;
    receipts.n7ProfileTransitionSeen = true;
  }
  if (isAfterFlowerSync) {
    state.whiteFlowerAvatarQueued = false;
    state.whiteFlowerAvatarActive = true;
    receipts.whiteFlowerProfileTransitionSeen = true;
  }
  if (isAfterChapterFour) {
    state.whiteFlowerAvatarActive = false;
    state.whiteFlowerAvatarExpired = true;
  }
  if (nodeId.startsWith('END-N-')) {
    state.novaEndingAvatarMode = 'private_archive';
    state.novaConnectionState = 'offline';
  }
  if (nodeId.startsWith('END-B-') && Number(nodeId.slice(-4)) >= 38) {
    state.novaEndingAvatarMode = 'official_identity_restored';
    state.novaConnectionState = 'offline';
    state.n7AvatarActivated = false;
    receipts.badEndingProfileClearAnimationSeen = true;
  }
  state.novaAvatarEventReceipts = receipts;
  return state;
}
