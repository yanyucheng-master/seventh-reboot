import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Archive, LogOut, SkipForward } from 'lucide-react';
import { type Choice, type StoryNode } from './story';
import { relocalizeChapterBanner, relocalizeDisplayMessages, useI18n } from '../i18n';
import type { Locale } from '../i18n';
import {
  applyNovaAvatarNodeEffect,
  createDefaultNovaAvatarState,
  createNovaAvatarStateForCheckpoint,
  resolveNovaAvatarPresentation,
} from './avatarState';
import {
  archiveFatalCycle,
  clearSave,
  createNewGameStats,
  createSaveData,
  defaultContactStage,
  defaultStats,
  getLatestFailedCycle,
  getPendingNodeIdAfterNode,
  getSaveTimeString,
  hasSaveFile,
  loadGame,
  loadPersistentProgress,
  resolveResumeNodeId,
  saveGame,
} from './storage';
import {
  choiceDeviatesFromRecord,
  createCycleInteractionRecord,
  createCurrentCycleState,
  getStoryNodeForReboot,
  inputDeviatesFromRecord,
  interactionDeviatesFromRecord,
  markCycleNodeCompleted,
  recordCycleChoice,
  recordCycleFreeInput,
  recordCycleInteraction,
  recordCycleTimedResult,
  replayFailedCycle,
  shouldStopReadSkip,
  type CycleReplayResult,
  type CycleSyncEvent,
} from './cycleState';
import type {
  ChatDeliveryRuntime,
  CommunicationLinkState,
  ContactStage,
  CycleNoticeKey,
  CurrentCycleState,
  DisplayMessage,
  FailedCycleRecord,
  FatalFailureCause,
  GameScreen,
  GameStats,
  GlitchLevel,
  MemoryAnchorId,
  NovaAvatarStoryState,
  NovaAvatarTransition,
  SpecialInteractionCompletion,
} from './types';
import { DeliveryController } from './delivery/controller';
import {
  createDefaultChatDeliveryRuntime,
  setDeliveryReceipt,
} from './delivery/state';
import {
  getNodeLinkStateEffect,
  isCommittedWithinDeadline,
  resolveDeliverySpec,
  RESTORED_FAILURE_RETRY_SPEC,
  type DeliverySpec,
  type DeliveryTimelinePhase,
} from './delivery/specs';
import { StarBackground } from './components/StarBackground';
import { ImageModal } from './components/ImageModal';
import { ChatMessage } from './components/ChatMessage';
import { ChapterBanner, RemoteTypingRow } from './components/ChatPrimitives';
import { RestartDialog } from './components/RestartDialog';
import { MemoryArchiveOverlay } from './components/MemoryArchive';
import { GameTitle } from './components/GameTitle';
import { CycleSyncOverlay } from './components/CycleSyncOverlay';
import { NovaAvatar } from './components/NovaAvatar';
import { AvatarDebugPanel } from './components/AvatarDebugPanel';
import { DeliveryDebugPanel } from './components/DeliveryDebugPanel';
import { ObserverEchoLayer } from './components/ObserverEchoLayer';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { getSaveProgressLabel } from './progress';
import { formatChoiceText, shouldShowNovaAvatar, shouldShowTypingAvatar } from './format';
import { resolveEndingStart } from './endings';
import { ANCHOR_ARCHIVE_IDS, applyArchiveUnlocks, getArchiveUnlocksForNode } from './archive';
import {
  applyPersistentStoryNodeEffects,
  applyStoryChoiceEffects,
  applyTimedChoiceTimeoutEffects,
  clampStat,
} from './state';
import { SpecialInteractionOverlay } from './interactions/SpecialInteractionOverlay';
import {
  applySpecialInteractionCompletion,
  isSealableMemoryAnchor,
  matchesInteractionCondition,
  matchesInteractionPrerequisite,
} from './interactions/logic';

type Translate = (key: string, params?: Record<string, string | number>) => string;

// INTERNAL TEST ONLY: set to false or remove this block before public release.
const INTERNAL_TEST_SKIP_ENABLED = true;
// INTERNAL TEST ONLY: Vite development builds may open a node directly with ?testNode=<id>.
const INTERNAL_TEST_NODE_ID = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('testNode')
  : null;
const INTERNAL_TEST_ANCHOR_ID = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('testAnchor')
  : null;

type WaitPrompt = {
  label: string;
  hint: string;
};

type WaitConfig = WaitPrompt & {
  duration: number;
};

type WaitResult = 'elapsed' | 'skipped' | 'fast-forward';

type SignalGlitchTone = 'error' | 'success' | 'neutral';
type SignalGlitchStyle = 'standard' | 'fragment' | 'disconnect';

const CHAT_NEAR_BOTTOM_PX = 112;

type ActiveSignalGlitch = {
  level: GlitchLevel;
  tone: SignalGlitchTone;
  style: SignalGlitchStyle;
  pulse: number;
  /** 短时间内重复触发时进入柔化模式：无雪花噪点，仅保留轻量扫线 */
  soft: boolean;
};

type SignalGlitchCue = {
  level: GlitchLevel;
  tone: SignalGlitchTone;
  style: SignalGlitchStyle;
  duration: number;
  bypassCooldown: boolean;
  affectsCooldown: boolean;
  haptic: boolean;
};

type ActiveInputNode = {
  id: string;
  nextId?: string;
  placeholder: string;
  timeoutMs?: number;
  timeoutNextId?: string;
  inputVariable?: string;
  inputMinLength?: number;
  inputMaxLength?: number;
  inputAutoFocus?: boolean;
  specialInputNextIds?: Record<string, string>;
};

function createCycleNoticeMessages(keys: CycleNoticeKey[], t: Translate): DisplayMessage[] {
  const timestamp = Date.now();
  return keys.map((uiKey, index) => ({
    id: `cycle_notice_${uiKey.replaceAll('.', '_')}_${timestamp}_${index}`,
    speaker: 'system',
    type: 'status',
    content: t(uiKey),
    isNew: true,
    uiKind: 'cycleNotice',
    uiKey,
  }));
}

function getWaitConfig(node: StoryNode, t: Translate): WaitConfig | null {
  if (!node.nextId) return null;
  if (/^(?:FIN|END-[TNB])-/.test(node.id)) return null;

  if (node.type === 'status' && /Nova is offline|Nova 已离线/i.test(node.content)) {
    return {
      duration: 15000,
      label: t('wait.novaOfflineLabel'),
      hint: t('wait.hint'),
    };
  }

  if (node.type === 'chapter') {
    return {
      duration: 12000,
      label: t('wait.chapterSyncLabel'),
      hint: t('wait.hint'),
    };
  }

  if (node.type === 'timestamp' && /Late night|Early morning|深夜|凌晨/i.test(node.content)) {
    return {
      duration: 10000,
      label: t('wait.nightChannelLabel'),
      hint: t('wait.hint'),
    };
  }

  if (node.type === 'delay' && (node.delay ?? 0) >= 5000) {
    return {
      duration: Math.min(node.delay ?? 10000, 15000),
      label: t('wait.channelHoldLabel'),
      hint: t('wait.hint'),
    };
  }

  return null;
}

function isMediaMessage(msg?: DisplayMessage): boolean {
  return msg?.type === 'image';
}

function hasRecentMediaMessage(messages: DisplayMessage[]): boolean {
  const start = Math.max(0, messages.length - 5);
  for (let index = messages.length - 1; index >= start; index -= 1) {
    const msg = messages[index];
    if (isMediaMessage(msg)) return true;
    if (msg.speaker === 'player') return false;
  }
  return false;
}

function getMediaChoiceWaitConfig(t: Translate): WaitConfig {
  return {
    duration: 5200,
    label: t('wait.mediaLabel'),
    hint: t('wait.mediaHint'),
  };
}

function getInputPlaceholder(node: StoryNode, t: Translate): string {
  if (node.content) return node.content;
  return t('game.inputPlaceholder');
}

function createActiveInputNode(node: StoryNode, t: Translate): ActiveInputNode {
  return {
    id: node.id,
    nextId: node.nextId,
    placeholder: getInputPlaceholder(node, t),
    timeoutMs: node.choiceTimeoutMs,
    timeoutNextId: node.timeoutNextId,
    inputVariable: node.inputVariable,
    inputMinLength: node.inputMinLength,
    inputMaxLength: node.inputMaxLength,
    inputAutoFocus: node.inputAutoFocus,
    specialInputNextIds: node.specialInputNextIds,
  };
}

function getSignalGlitchLevel(node: StoryNode): GlitchLevel | null {
  if (node.glitchLevel) return node.glitchLevel;
  if (node.type === 'disconnect' || node.type === 'reconnectFailed' || node.type === 'signalError') return 2;
  if (/Signal fading|Connection about to terminate|Communications sync disconnected|Text transmission unstable|Packet loss|Response timed out|Eighth Reboot|shutdown request incomplete|Protocol maintained|shutdown sequence|UNKNOWN-06 signal lost|信号衰减|连接即将终止|通讯同步断开|文字传输不稳定|丢包|回答超时|第八次重启|关闭请求未完成|协议维持|关闭序列|UNKNOWN-06 信号/i.test(node.content)) return 3;
  if (/Communications interrupted|Signal interrupted|Attempting reconnection|Reconnection failed|request denied|countdown|通讯中断|信号中断|尝试重连|重连失败|请求被拒|倒计时/i.test(node.content)) return 2;
  if (/(Seventh Protocol|第七协议)/i.test(node.content) && (node.type === 'status' || node.type === 'glitch')) return 2;
  if (/Reconnected|Reconnection successful|重连成功/i.test(node.content)) return 1;
  if (node.type === 'glitch' || node.isGlitch) {
    return /^(?:FIN|END-B)-/.test(node.id) ? 3 : 1;
  }
  return null;
}

function getSignalGlitchTone(content: string): SignalGlitchTone {
  if (/Reconnected|link restored|back to normal|重连成功|链路恢复|恢复正常/i.test(content)) return 'success';
  if (/interrupted|Reconnection failed|Signal fading|about to terminate|countdown|denied|中断|重连失败|信号衰减|即将终止|倒计时|拒绝|被拒/i.test(content)) return 'error';
  return 'neutral';
}

function getSignalGlitchDuration(level: GlitchLevel, tone: SignalGlitchTone, content: string): number {
  if (tone === 'success') return 880;
  if (/Reconnection failed|重连失败/i.test(content)) return 1300;
  if (level === 3) return 1600;
  if (level === 2) return 1250;
  return 880;
}

function getSignalGlitchCue(node: StoryNode): SignalGlitchCue | null {
  const level = getSignalGlitchLevel(node);
  if (!level) return null;

  const tone = getSignalGlitchTone(node.content);

  // The prologue is one escalating incident: 30% local corruption, a text-only
  // dropout, then a 70% disconnect. Full-strength flashes remain for later acts.
  if (node.id === 'PRO-0003') {
    return {
      level,
      tone,
      style: 'fragment',
      duration: 680,
      bypassCooldown: true,
      affectsCooldown: false,
      haptic: false,
    };
  }
  if (node.id === 'PRO-0005') return null;
  if (node.id === 'PRO-0008') {
    return {
      level,
      tone,
      style: 'disconnect',
      duration: 980,
      bypassCooldown: true,
      affectsCooldown: true,
      haptic: false,
    };
  }

  return {
    level,
    tone,
    style: 'standard',
    duration: getSignalGlitchDuration(level, tone, node.content),
    bypassCooldown: false,
    affectsCooldown: true,
    haptic: tone === 'error',
  };
}

/** 两次全屏故障特效之间的最小间隔；期间的重复触发会被跳过或柔化 */
const SIGNAL_GLITCH_COOLDOWN_MS = 9000;

function isNovaSilentBeat(content: string): boolean {
  return /^(?:\.{3,}|…{2,}|silence)$/i.test(content.trim());
}

function isNovaHesitationBeat(content: string): boolean {
  const trimmed = content.trim();
  return isNovaSilentBeat(trimmed)
    || /\.{3,}|…{2,}|\b(?:don't know|unless|seems|actually|maybe|perhaps)\b/i.test(trimmed)
    || /^(?:嗯|等等|算了|不对|我不知道|不知道|其实|也许|可能|好像|除非)(?:[，。！？?!]|$)/.test(trimmed);
}

function getNovaTypingLeadDelay(node: StoryNode, previousMessage?: DisplayMessage): number {
  const explicitDelay = node.delay ?? 0;
  const isConsecutiveNova = previousMessage?.speaker === 'nova' && previousMessage.type === 'text';
  let delay = isConsecutiveNova ? 420 : 900;

  if (explicitDelay >= 2500) delay = Math.max(delay, 1250);
  if (isNovaHesitationBeat(node.content)) delay = Math.max(delay, 1180);
  if (isNovaSilentBeat(node.content)) delay = Math.max(delay, 1550);
  if (/^(?:FIN|END-[TNB])-/.test(node.id)) {
    delay = Math.max(delay, isConsecutiveNova ? 720 : 1150);
  }

  return Math.min(delay, 2200);
}

function getNovaCharacterDelay(content: string, index: number): number {
  const char = content[index] ?? '';
  const next = content[index + 1] ?? '';
  const base = isNovaHesitationBeat(content) ? 44 : 30;
  let delay = base + Math.random() * 22;

  if (char === '\n') delay += 260;
  if (/[，、]/.test(char)) delay += 120;
  if (/[。！？?!]/.test(char)) delay += 220;
  if (char === '…') delay += next === '…' ? 150 : 110;
  if (char === '▇') delay += 95;

  return delay;
}

function getNovaPostMessageDelay(node: StoryNode): number {
  const explicitDelay = node.delay ?? 0;
  let delay = explicitDelay >= 1000 ? explicitDelay : 0;

  if (isNovaHesitationBeat(node.content)) delay = Math.max(delay, explicitDelay, 780);
  if (isNovaSilentBeat(node.content)) delay = Math.max(delay, explicitDelay, 1450);
  if (/^(?:FIN|END-[TNB])-/.test(node.id) && explicitDelay >= 700) {
    delay = Math.max(delay, explicitDelay);
  }

  return Math.min(delay, 4200);
}

export default function GameApp() {
  const { locale, setLocale, t, storyNodeMap } = useI18n();
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [choices, setChoices] = useState<Choice[] | null>(null);
  const [choiceNodeId, setChoiceNodeId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [modalImage, setModalImage] = useState<{ image: string; caption: string } | null>(null);
  const [avatarState, setAvatarState] = useState<NovaAvatarStoryState>(() => createDefaultNovaAvatarState());
  const [avatarTransition, setAvatarTransition] = useState<NovaAvatarTransition | null>(null);
  const [signalGlitch, setSignalGlitch] = useState<ActiveSignalGlitch | null>(null);
  const [showChapterBanner, setShowChapterBanner] = useState<string | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [isTypewriterActive, setIsTypewriterActive] = useState(false);
  const [hasSave, setHasSave] = useState(() => hasSaveFile());
  const [saveTime, setSaveTime] = useState(() => getSaveTimeString());
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [persistentProgress, setPersistentProgress] = useState(() => loadPersistentProgress());
  const [cycleState, setCycleState] = useState<CurrentCycleState>(() => {
    const progress = loadPersistentProgress();
    return createCurrentCycleState(progress.currentRebootNumber);
  });
  const [contactStage, setContactStage] = useState<ContactStage>(defaultContactStage);
  const [inputNode, setInputNode] = useState<ActiveInputNode | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<StoryNode | null>(null);
  const [playerInput, setPlayerInput] = useState('');
  const [waitPrompt, setWaitPrompt] = useState<WaitPrompt | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSkippingToChoice, setIsSkippingToChoice] = useState(false);
  const [isSkippingRead, setIsSkippingRead] = useState(false);
  const [syncOfferVisible, setSyncOfferVisible] = useState(false);
  const [activeSyncEvents, setActiveSyncEvents] = useState<CycleSyncEvent[]>([]);
  const [syncVisibleCount, setSyncVisibleCount] = useState(0);
  const [showMenuSettings, setShowMenuSettings] = useState(false);
  const [observerEcho, setObserverEcho] = useState<string | null>(null);
  const [deliveryRuntime, setDeliveryRuntime] = useState<ChatDeliveryRuntime>(
    () => createDefaultChatDeliveryRuntime(),
  );

  const memoryAnchorLabels = useMemo<Record<MemoryAnchorId, string>>(
    () => ({
      n7: t('memoryAnchors.n7'),
      milk_candy: t('memoryAnchors.milk_candy'),
      white_flower: t('memoryAnchors.white_flower'),
      first_message: t('memoryAnchors.first_message'),
      goodnight: t('memoryAnchors.goodnight'),
      observatory: t('memoryAnchors.observatory'),
      maintenance_board: t('memoryAnchors.maintenance_board'),
      steak: t('memoryAnchors.steak'),
    }),
    [t],
  );

  const contactMetaByStage = useMemo<Record<ContactStage, { name: string; subtitle: string }>>(
    () => ({
      unknown: {
        name: t('contact.unknownName'),
        subtitle: t('contact.unknownSubtitle'),
      },
      named: {
        name: 'Nova',
        subtitle: t('contact.novaSubtitle'),
      },
      verified: {
        name: 'Nova',
        subtitle: t('contact.novaSubtitle'),
      },
    }),
    [t],
  );

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showJumpBottom, setShowJumpBottom] = useState(false);
  const nodeQueueRef = useRef<string[]>([]);
  const queueRunIdRef = useRef(0);
  const activeQueueRunIdRef = useRef<number | null>(null);
  const waitTimeoutRef = useRef<number | null>(null);
  const waitResolverRef = useRef<((result: WaitResult) => void) | null>(null);
  const delayResolverRef = useRef<(() => void) | null>(null);
  const choiceTimeoutRef = useRef<number | null>(null);
  const choiceDeadlineRef = useRef<{ nodeId: string; expiresAt: number } | null>(null);
  const activeChoiceRef = useRef<{ nodeId: string; settled: boolean } | null>(null);
  const signalGlitchTimeoutRef = useRef<number | null>(null);
  const signalGlitchPulseRef = useRef(0);
  const lastSignalGlitchRef = useRef({ at: 0, level: 0 });
  const skipToChoiceRef = useRef(false);
  const forceFastForwardBottomRef = useRef(false);
  const messagesRef = useRef(messages);
  const pendingNodeIdRef = useRef('PRO-0001');
  const deliveryRuntimeRef = useRef(deliveryRuntime);
  const deliveryControllerRef = useRef<DeliveryController | null>(null);
  const avatarStateRef = useRef(avatarState);
  const avatarTransitionTimeoutRef = useRef<number | null>(null);
  const statsRef = useRef(stats);
  const cycleStateRef = useRef(cycleState);
  const persistentProgressRef = useRef(persistentProgress);
  const previousCycleRecordRef = useRef<FailedCycleRecord | null>(null);
  const syncPlanRef = useRef<CycleReplayResult | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const skipReadRef = useRef(false);
  const contactStageRef = useRef(contactStage);
  const internalTestBootstrappedRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    deliveryRuntimeRef.current = deliveryRuntime;
  }, [deliveryRuntime]);

  useEffect(() => {
    avatarStateRef.current = avatarState;
  }, [avatarState]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    cycleStateRef.current = cycleState;
  }, [cycleState]);

  useEffect(() => {
    persistentProgressRef.current = persistentProgress;
  }, [persistentProgress]);

  useEffect(() => {
    contactStageRef.current = contactStage;
  }, [contactStage]);

  useEffect(() => {
    setSaveTime(getSaveTimeString(t));
  }, [locale, t]);

  useEffect(() => {
    document.title = t(persistentProgress.reboot08TitleUnlocked ? 'menu.title08' : 'menu.title');
  }, [persistentProgress.reboot08TitleUnlocked, t]);

  const applyLocalizedMessages = useCallback(
    (msgs: DisplayMessage[]) => {
      const localized = relocalizeDisplayMessages(msgs, storyNodeMap, t, memoryAnchorLabels);
      messagesRef.current = localized;
      setMessages(localized);
      return localized;
    },
    [memoryAnchorLabels, storyNodeMap, t],
  );

  useEffect(() => {
    if (screen !== 'playing') return;
    applyLocalizedMessages(messagesRef.current);
    setShowChapterBanner(prev => relocalizeChapterBanner(prev, storyNodeMap));
    if (choiceNodeId) {
      const node = storyNodeMap.get(choiceNodeId);
      if (node?.type === 'choice' && node.choices) {
        setChoices(node.choices);
      }
    }
    if (inputNode) {
      const node = storyNodeMap.get(inputNode.id);
      if (node?.type === 'input') {
        setInputNode(createActiveInputNode(node, t));
      }
    }
    setActiveInteraction(current => {
      if (!current) return current;
      const node = storyNodeMap.get(current.id);
      return node?.type === 'interaction' ? node : current;
    });
    // Re-localize when language changes or when entering the playing screen (e.g. continue).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- choice/input refreshed from current ids
  }, [locale, storyNodeMap, t, applyLocalizedMessages, screen]);

  const activateChoice = useCallback((nodeId: string) => {
    activeChoiceRef.current = { nodeId, settled: false };
    if (choiceDeadlineRef.current?.nodeId !== nodeId) choiceDeadlineRef.current = null;
  }, []);

  const claimChoiceResult = useCallback((nodeId: string): boolean => {
    const active = activeChoiceRef.current;
    if (!active || active.nodeId !== nodeId || active.settled) return false;
    active.settled = true;
    choiceDeadlineRef.current = null;
    return true;
  }, []);

  const cancelActiveSequence = useCallback(() => {
    queueRunIdRef.current += 1;
    nodeQueueRef.current = [];
    skipToChoiceRef.current = false;
    forceFastForwardBottomRef.current = false;
    delayResolverRef.current?.();
    delayResolverRef.current = null;
    if (waitTimeoutRef.current !== null) {
      window.clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
    }
    waitResolverRef.current = null;
    setWaitPrompt(null);
    if (choiceTimeoutRef.current !== null) {
      window.clearTimeout(choiceTimeoutRef.current);
      choiceTimeoutRef.current = null;
    }
    choiceDeadlineRef.current = null;
    activeChoiceRef.current = null;
    if (signalGlitchTimeoutRef.current !== null) {
      window.clearTimeout(signalGlitchTimeoutRef.current);
      signalGlitchTimeoutRef.current = null;
    }
    if (avatarTransitionTimeoutRef.current !== null) {
      window.clearTimeout(avatarTransitionTimeoutRef.current);
      avatarTransitionTimeoutRef.current = null;
    }
    setSignalGlitch(null);
    setObserverEcho(null);
    setAvatarTransition(null);
    setIsSyncing(false);
    setIsSkippingToChoice(false);
    skipReadRef.current = false;
    setIsSkippingRead(false);
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    syncPlanRef.current = null;
    setActiveSyncEvents([]);
    setSyncVisibleCount(0);
    setActiveInteraction(null);
    deliveryControllerRef.current?.cancelDelivery();
    deliveryControllerRef.current?.cancelLinkTimeline();
    return queueRunIdRef.current;
  }, []);

  const goToMenu = useCallback(() => {
    cancelActiveSequence();
    setIsTyping(false);
    setIsTypewriterActive(false);
    setTypewriterText('');
    setShowChapterBanner(null);
    setShowArchive(false);
    setChoices(null);
    setChoiceNodeId(null);
    setInputNode(null);
    setPlayerInput('');
    setWaitPrompt(null);
    setHasSave(hasSaveFile());
    setSaveTime(getSaveTimeString(t));
    const progress = loadPersistentProgress();
    persistentProgressRef.current = progress;
    setPersistentProgress(progress);
    setShowMenuSettings(false);
    setScreen('menu');
  }, [cancelActiveSequence, t]);

  const finishRunToMenu = useCallback(() => {
    clearSave();
    goToMenu();
  }, [goToMenu]);

  const updateNearBottomState = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distance <= CHAT_NEAR_BOTTOM_PX;
    isNearBottomRef.current = near;
    setShowJumpBottom(!near);
  }, []);

  const jumpToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    isNearBottomRef.current = true;
    setShowJumpBottom(false);
    window.requestAnimationFrame(updateNearBottomState);
  }, [updateNearBottomState]);

  /** Follow Nova only while pinned near the bottom; otherwise show the jump affordance. */
  const stickChatToBottom = useCallback(() => {
    if (skipToChoiceRef.current || forceFastForwardBottomRef.current) {
      jumpToBottom(false);
      return;
    }
    if (!isNearBottomRef.current) {
      setShowJumpBottom(true);
      return;
    }
    jumpToBottom(false);
  }, [jumpToBottom]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(stickChatToBottom);
    return () => window.cancelAnimationFrame(frame);
  }, [messages, isTyping, typewriterText, choices, choiceNodeId, stickChatToBottom]);

  useEffect(() => {
    if (!forceFastForwardBottomRef.current || skipToChoiceRef.current) return undefined;
    const reachedStop = Boolean(
      choices
      || inputNode
      || activeInteraction
      || messages.at(-1)?.type === 'end'
    );
    if (!reachedStop) return undefined;

    forceFastForwardBottomRef.current = false;
    isNearBottomRef.current = true;
    setShowJumpBottom(false);

    let settleFrame = 0;
    const renderFrame = window.requestAnimationFrame(() => {
      jumpToBottom(false);
      settleFrame = window.requestAnimationFrame(() => jumpToBottom(false));
    });

    return () => {
      window.cancelAnimationFrame(renderFrame);
      if (settleFrame) window.cancelAnimationFrame(settleFrame);
    };
  }, [activeInteraction, choices, inputNode, jumpToBottom, messages]);

  useEffect(() => {
    if (screen !== 'playing') return undefined;
    const frame = window.requestAnimationFrame(() => jumpToBottom(false));
    return () => window.cancelAnimationFrame(frame);
  }, [screen, jumpToBottom]);

  useVisualViewport(() => {
    if (isNearBottomRef.current) jumpToBottom(false);
    else updateNearBottomState();
  });

  const persistState = useCallback((pendingNodeId: string, msgs: DisplayMessage[]) => {
    pendingNodeIdRef.current = pendingNodeId;
    saveGame(createSaveData(
      pendingNodeId,
      msgs,
      avatarStateRef.current,
      contactStageRef.current,
      statsRef.current,
      deliveryRuntimeRef.current,
      cycleStateRef.current,
    ));
    setHasSave(true);
    setSaveTime(t('saveTime.justNow'));
  }, [t]);

  const updateCurrentCycle = useCallback((
    updater: (current: CurrentCycleState) => CurrentCycleState,
  ) => {
    const next = updater(cycleStateRef.current);
    cycleStateRef.current = next;
    setCycleState(next);
    return next;
  }, []);

  const markCurrentCycleNode = useCallback((nodeId: string) => (
    updateCurrentCycle(current => markCycleNodeCompleted(current, nodeId))
  ), [updateCurrentCycle]);

  const stopReadSkip = useCallback(() => {
    if (!skipReadRef.current) return;
    skipReadRef.current = false;
    setIsSkippingRead(false);
  }, []);

  const updateDeliveryRuntime = useCallback((
    updater: (current: ChatDeliveryRuntime) => ChatDeliveryRuntime,
  ) => {
    const next = updater(deliveryRuntimeRef.current);
    deliveryRuntimeRef.current = next;
    setDeliveryRuntime(next);
    return next;
  }, []);

  const waitForPlayback = useCallback((duration: number): Promise<void> => {
    if (duration <= 0 || skipToChoiceRef.current || skipReadRef.current) return Promise.resolve();

    return new Promise(resolve => {
      let settled = false;
      const timeoutId = window.setTimeout(() => finish(), duration);

      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        if (delayResolverRef.current === finish) {
          delayResolverRef.current = null;
        }
        resolve();
      };

      delayResolverRef.current = finish;
    });
  }, []);

  const waitForSignal = useCallback((config: WaitConfig, runId: number): Promise<WaitResult> => {
    if (skipToChoiceRef.current || skipReadRef.current) {
      setWaitPrompt(null);
      return Promise.resolve('fast-forward');
    }

    if (waitTimeoutRef.current !== null) {
      window.clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
    }
    waitResolverRef.current = null;
    setWaitPrompt({ label: config.label, hint: config.hint });

    return new Promise(resolve => {
      let settled = false;
      const finish = (result: WaitResult) => {
        if (settled) return;
        settled = true;
        if (waitTimeoutRef.current !== null) {
          window.clearTimeout(waitTimeoutRef.current);
          waitTimeoutRef.current = null;
        }
        waitResolverRef.current = null;
        if (queueRunIdRef.current === runId) {
          setWaitPrompt(null);
        }
        resolve(result);
      };

      waitResolverRef.current = result => finish(result);
      waitTimeoutRef.current = window.setTimeout(() => finish('elapsed'), config.duration);
    });
  }, []);

  const skipWaiting = useCallback(() => {
    waitResolverRef.current?.('skipped');
  }, []);

  const stopFastForwardAtInteraction = useCallback(() => {
    if (!skipToChoiceRef.current) return;
    skipToChoiceRef.current = false;
    setIsSkippingToChoice(false);
  }, []);

  const skipToNextChoice = useCallback(() => {
    if (
      !INTERNAL_TEST_SKIP_ENABLED
      || choices
      || inputNode
      || activeInteraction
      || observerEcho
      || deliveryRuntimeRef.current.activeMessageId
      || messagesRef.current.some(message => message.type === 'end')
    ) return;
    skipToChoiceRef.current = true;
    forceFastForwardBottomRef.current = true;
    isNearBottomRef.current = true;
    setIsSkippingToChoice(true);
    setShowJumpBottom(false);
    setWaitPrompt(null);
    setIsTyping(false);
    jumpToBottom(false);
    delayResolverRef.current?.();
    waitResolverRef.current?.('fast-forward');
  }, [activeInteraction, choices, inputNode, jumpToBottom, observerEcho]);

  const skipReadText = useCallback(() => {
    if (
      !cycleStateRef.current.syncInterrupted
      || choices
      || inputNode
      || activeInteraction
      || deliveryRuntimeRef.current.activeMessageId
      || messagesRef.current.some(message => message.type === 'end')
    ) return;
    skipReadRef.current = true;
    forceFastForwardBottomRef.current = true;
    isNearBottomRef.current = true;
    setIsSkippingRead(true);
    setShowJumpBottom(false);
    setWaitPrompt(null);
    setIsTyping(false);
    jumpToBottom(false);
    delayResolverRef.current?.();
    waitResolverRef.current?.('fast-forward');
  }, [activeInteraction, choices, inputNode, jumpToBottom]);

  const triggerSignalGlitch = useCallback((node: StoryNode) => {
    const cue = getSignalGlitchCue(node);
    if (!cue) return;

    // 冷却窗口内：同级/更低级的重复故障直接跳过，避免连续花屏刺眼
    const now = Date.now();
    const sinceLast = now - lastSignalGlitchRef.current.at;
    const inCooldown = sinceLast < SIGNAL_GLITCH_COOLDOWN_MS;
    if (!cue.bypassCooldown && inCooldown && cue.level <= lastSignalGlitchRef.current.level) return;
    const soft = !cue.bypassCooldown && inCooldown;
    if (cue.affectsCooldown) {
      lastSignalGlitchRef.current = { at: now, level: cue.level };
    }

    if (signalGlitchTimeoutRef.current !== null) {
      window.clearTimeout(signalGlitchTimeoutRef.current);
      signalGlitchTimeoutRef.current = null;
    }

    signalGlitchPulseRef.current += 1;
    setSignalGlitch({
      level: cue.level,
      tone: cue.tone,
      style: cue.style,
      pulse: signalGlitchPulseRef.current,
      soft,
    });
    if (!soft && cue.haptic && 'vibrate' in navigator) {
      navigator.vibrate(cue.level === 3 ? [18, 28, 24] : 18);
    }

    signalGlitchTimeoutRef.current = window.setTimeout(() => {
      signalGlitchTimeoutRef.current = null;
      setSignalGlitch(null);
    }, cue.duration);
  }, []);

  const addMessage = useCallback((msg: DisplayMessage) => {
    const next = [...messagesRef.current, msg];
    messagesRef.current = next;
    setMessages(next);
    return next;
  }, []);

  const appendCycleNotices = useCallback((keys: CycleNoticeKey[]) => {
    let current = messagesRef.current;
    createCycleNoticeMessages(keys, t).forEach(message => {
      current = addMessage(message);
    });
    return current;
  }, [addMessage, t]);

  const commitAvatarNodeEffect = useCallback((nodeId: string, currentMessages: DisplayMessage[]) => {
    const currentState = avatarStateRef.current;
    const effect = applyNovaAvatarNodeEffect(currentState, nodeId);
    const changed = effect.state !== currentState;
    let nextMessages = currentMessages;

    if (changed) {
      avatarStateRef.current = effect.state;
      setAvatarState(effect.state);
    }

    if (effect.transition) {
      if (avatarTransitionTimeoutRef.current !== null) {
        window.clearTimeout(avatarTransitionTimeoutRef.current);
      }
      setAvatarTransition(effect.transition);
      avatarTransitionTimeoutRef.current = window.setTimeout(() => {
        avatarTransitionTimeoutRef.current = null;
        setAvatarTransition(null);
      }, 820);
    }

    effect.noticeKeys.forEach((uiKey, index) => {
      nextMessages = addMessage({
        id: `avatar_notice_${nodeId}_${Date.now()}_${index}`,
        speaker: 'system',
        type: 'status',
        content: t(uiKey),
        isNew: true,
        uiKind: 'avatarNotice',
        uiKey,
        sourceNodeId: nodeId,
      });
    });

    return { messages: nextMessages, changed };
  }, [addMessage, t]);

  const unlockArchives = useCallback((entryIds: string | string[]) => {
    const current = statsRef.current;
    const nextStats = applyArchiveUnlocks(current, entryIds);
    if (nextStats === current) return false;
    statsRef.current = nextStats;
    setStats(nextStats);
    return true;
  }, []);

  const markCommemorativeArchiveSaved = useCallback(() => {
    const current = statsRef.current;
    const nextStats = applyPersistentStoryNodeEffects(current, 'END-T-0005');
    if (nextStats === current) return false;
    statsRef.current = nextStats;
    setStats(nextStats);
    return true;
  }, []);

  const saveMemoryAnchor = useCallback(
    (anchor: MemoryAnchorId, pendingNodeId: string) => {
      const current = statsRef.current;
      if (current.memoryAnchors.includes(anchor)) return;

      const nextStats = {
        ...current,
        memory: clampStat(current.memory + 1),
        memoryAnchors: [...current.memoryAnchors, anchor],
        unlockedArchives: [...new Set([...current.unlockedArchives, ANCHOR_ARCHIVE_IDS[anchor]])],
      };
      statsRef.current = nextStats;
      setStats(nextStats);

      const nextMessages = addMessage({
        id: `memory_anchor_${anchor}_${Date.now()}`,
        speaker: 'system',
        type: 'memory-anchor',
        content: t('game.memoryRecorded', { label: memoryAnchorLabels[anchor] }),
        isNew: true,
        uiKind: 'memoryRecorded',
        memoryAnchor: anchor,
      });
      persistState(pendingNodeId, nextMessages);
    },
    [addMessage, memoryAnchorLabels, persistState, t],
  );

  const archiveCurrentFatalCycle = useCallback((
    currentMessages: DisplayMessage[],
    causeOverride?: FatalFailureCause,
  ) => {
    const current = statsRef.current;
    const failureCause = causeOverride ?? current.earlyFailureCause;
    if (!failureCause) return false;

    const fatalStats: GameStats = {
      ...current,
      earlyFailureCause: failureCause,
      ending: 'bad',
      fatalEndingTriggered: true,
      pendingReboot08: true,
      unlockedArchives: [...new Set([...current.unlockedArchives, 'ending_bad'])],
      endingsUnlocked: [...new Set([...current.endingsUnlocked, 'ending_bad' as const])],
    };
    statsRef.current = fatalStats;
    setStats(fatalStats);

    const snapshot = createSaveData(
      'MENU',
      currentMessages,
      avatarStateRef.current,
      contactStageRef.current,
      fatalStats,
      deliveryRuntimeRef.current,
      cycleStateRef.current,
    );
    const progress = archiveFatalCycle(snapshot, failureCause);
    persistentProgressRef.current = progress;
    setPersistentProgress(progress);
    previousCycleRecordRef.current = getLatestFailedCycle(progress) ?? null;

    const freshStats = createNewGameStats();
    statsRef.current = freshStats;
    setStats(freshStats);
    setHasSave(false);
    goToMenu();
    return true;
  }, [goToMenu]);

  const processSingleNode = useCallback(
    async (nodeId: string, runId: number): Promise<boolean> => {
      const isCurrentRun = () => queueRunIdRef.current === runId;
      if (!isCurrentRun()) return false;

      const sourceNode = storyNodeMap.get(nodeId);
      if (!sourceNode) return false;
      const node = getStoryNodeForReboot(sourceNode, cycleStateRef.current.currentRebootNumber);

      if (
        skipReadRef.current
        && shouldStopReadSkip(sourceNode, persistentProgressRef.current.readNodeIds)
      ) {
        stopReadSkip();
      }

      const persistentStats = applyPersistentStoryNodeEffects(statsRef.current, node.id);
      if (persistentStats !== statsRef.current) {
        statsRef.current = persistentStats;
        setStats(persistentStats);
        persistState(node.id, messagesRef.current);
      }

      if (node.interactionCondition && !matchesInteractionCondition(statsRef.current, node.interactionCondition)) {
        const fallbackId = node.conditionElseNextId ?? node.nextId;
        if (fallbackId) {
          persistState(fallbackId, messagesRef.current);
          nodeQueueRef.current.push(fallbackId);
        }
        return true;
      }

      if (node.interactionPrerequisite && !matchesInteractionPrerequisite(statsRef.current, node.interactionPrerequisite)) {
        const fallbackId = node.id === 'CH05B-0029'
          ? 'CH05B-0017'
          : node.nextId;
        if (fallbackId) {
          persistState(fallbackId, messagesRef.current);
          nodeQueueRef.current.push(fallbackId);
        }
        return true;
      }

      const nodeArchiveUnlocks = getArchiveUnlocksForNode(node);
      const nodeLinkState = getNodeLinkStateEffect(node.id);
      if (nodeLinkState) {
        if (deliveryControllerRef.current) {
          deliveryControllerRef.current.setLinkState(nodeLinkState);
        } else {
          updateDeliveryRuntime(current => ({ ...current, linkState: nodeLinkState }));
        }
      }

      if (node.id === 'END-T-0005') markCommemorativeArchiveSaved();

      if (node.requiresAnchor && !statsRef.current.memoryAnchors.includes(node.requiresAnchor)) {
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'internal-chapter-marker') {
        markCurrentCycleNode(node.id);
        persistState(node.nextId ?? node.id, messagesRef.current);
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'internal-ending-marker') {
        let currentMessages = messagesRef.current;
        if (node.content) {
          currentMessages = addMessage({
            id: `${node.id}_${Date.now()}`,
            speaker: 'system',
            type: 'status',
            content: node.content,
            isNew: true,
            sourceNodeId: node.id,
          });
        }
        markCurrentCycleNode(node.id);
        persistState(node.nextId ?? node.id, currentMessages);
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'observer-echo') {
        stopFastForwardAtInteraction();
        stopReadSkip();
        if (cycleStateRef.current.observerCandyEchoPlayed) {
          persistState(node.nextId ?? node.id, messagesRef.current);
          if (node.nextId) nodeQueueRef.current.push(node.nextId);
          return true;
        }

        const nextCycle = {
          ...cycleStateRef.current,
          observerCandyEchoPlayed: true,
        };
        cycleStateRef.current = nextCycle;
        setCycleState(nextCycle);
        persistState(node.nextId ?? node.id, messagesRef.current);

        await waitForPlayback(1500);
        if (!isCurrentRun()) return false;
        setObserverEcho(node.content);
        await waitForPlayback(node.delay ?? 2000);
        if (!isCurrentRun()) return false;
        setObserverEcho(null);

        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'title-state') {
        await waitForPlayback(500);
        if (!isCurrentRun()) return false;
        archiveCurrentFatalCycle(messagesRef.current, statsRef.current.earlyFailureCause ?? 'protocol_rollback');
        return false;
      }

      if (node.type === 'interaction' && node.interactionKind) {
        stopFastForwardAtInteraction();
        setActiveInteraction(node);
        setIsTyping(false);
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'end') {
        stopFastForwardAtInteraction();
        unlockArchives(nodeArchiveUnlocks);
        markCurrentCycleNode(node.id);
        addMessage({
          id: `${node.id}_${Date.now()}`,
          speaker: 'system',
          type: 'end',
          content: '',
          isNew: true,
          sourceNodeId: node.id,
        });
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'delay') {
        const waitConfig = getWaitConfig(node, t);
        if (waitConfig) {
          const result = await waitForSignal(waitConfig, runId);
          if (!isCurrentRun()) return false;
          if (result === 'skipped') {
            const currentMsgs = addMessage({
              id: `time_sync_${node.id}_${Date.now()}`,
              speaker: 'system',
              type: 'status',
              content: t('game.syncNext'),
              isNew: true,
              uiKind: 'syncNext',
              sourceNodeId: node.id,
            });
            persistState(node.nextId ?? nodeId, currentMsgs);
          }
        } else {
          await waitForPlayback(node.delay || 1000);
        }
        if (!isCurrentRun()) return false;
        markCurrentCycleNode(node.id);
        persistState(node.nextId ?? nodeId, messagesRef.current);
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'typing') {
        setIsTyping(true);
        await waitForPlayback(node.delay || 2000);
        if (!isCurrentRun()) return false;
        setIsTyping(false);
        markCurrentCycleNode(node.id);
        persistState(node.nextId ?? nodeId, messagesRef.current);
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'input') {
        stopFastForwardAtInteraction();
        setInputNode(createActiveInputNode(node, t));
        setPlayerInput('');
        setIsTyping(false);
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'choice' && node.choices) {
        if (hasRecentMediaMessage(messagesRef.current)) {
          await waitForSignal(getMediaChoiceWaitConfig(t), runId);
          if (!isCurrentRun()) return false;
        }
        stopFastForwardAtInteraction();
        activateChoice(nodeId);
        setChoices(node.choices);
        setChoiceNodeId(nodeId);
        setIsTyping(false);
        persistState(nodeId, messagesRef.current);
        return false;
      }

      const signalGlitchLevel = getSignalGlitchLevel(node);
      if (signalGlitchLevel) {
        triggerSignalGlitch(node);
      }

      if (node.type === 'chapter') {
        setShowChapterBanner(node.content);
        await waitForPlayback(2500);
        if (!isCurrentRun()) return false;
        setShowChapterBanner(null);
      }

      const displayMsg: DisplayMessage = {
        id: `${node.id}_${Date.now()}`,
        speaker: node.speaker,
        type: node.type,
        content: node.content,
        image: node.image,
        displayName: node.displayName,
        speakerIdentity: node.speakerIdentity,
        isGlitch: node.isGlitch,
        glitchLevel: node.glitchLevel ?? signalGlitchLevel ?? undefined,
        isNew: true,
        sourceNodeId: node.id,
      };

      if (node.speaker === 'nova' && node.type === 'text' && !node.isGlitch) {
        setIsTyping(true);
        await waitForPlayback(getNovaTypingLeadDelay(node, messagesRef.current.at(-1)));
        if (!isCurrentRun()) return false;
        setIsTyping(false);

        const withDisplayMessage = addMessage(displayMsg);
        const avatarEffect = commitAvatarNodeEffect(nodeId, withDisplayMessage);
        const currentMsgs = avatarEffect.messages;
        unlockArchives(nodeArchiveUnlocks);

        setIsTypewriterActive(true);
        const text = node.content;
        setTypewriterText('');
        for (let i = 1; i <= text.length; i++) {
          if (!isCurrentRun()) return false;
          if (skipToChoiceRef.current || skipReadRef.current) {
            setTypewriterText(text);
            break;
          }
          setTypewriterText(text.slice(0, i));
          await waitForPlayback(getNovaCharacterDelay(text, i - 1));
        }
        setIsTypewriterActive(false);
        setTypewriterText('');
        markCurrentCycleNode(node.id);

        setTimeout(() => {
          setMessages(prev => prev.map(m => (m.id === displayMsg.id ? { ...m, isNew: false } : m)));
        }, 500);

        persistState(getPendingNodeIdAfterNode(nodeId), currentMsgs);
        await waitForPlayback(getNovaPostMessageDelay(node));
        if (!isCurrentRun()) return false;
      } else {
        const withDisplayMessage = addMessage(displayMsg);
        const avatarEffect = commitAvatarNodeEffect(nodeId, withDisplayMessage);
        const currentMsgs = avatarEffect.messages;
        unlockArchives(nodeArchiveUnlocks);
        markCurrentCycleNode(node.id);

        setTimeout(() => {
          setMessages(prev => prev.map(m => (m.id === displayMsg.id ? { ...m, isNew: false } : m)));
        }, 500);

        persistState(getPendingNodeIdAfterNode(nodeId), currentMsgs);

        await waitForPlayback(node.delay || 200);
        if (!isCurrentRun()) return false;
      }

      if (node.memoryAnchor) {
        saveMemoryAnchor(node.memoryAnchor, getPendingNodeIdAfterNode(nodeId));
      }

      if (node.contactStage) {
        contactStageRef.current = node.contactStage;
        setContactStage(node.contactStage);
        persistState(getPendingNodeIdAfterNode(nodeId), messagesRef.current);
      }

      const waitConfig = getWaitConfig(node, t);
      if (waitConfig) {
        const result = await waitForSignal(waitConfig, runId);
        if (!isCurrentRun()) return false;
        if (result === 'skipped') {
          const currentMsgs = addMessage({
            id: `time_sync_${node.id}_${Date.now()}`,
            speaker: 'system',
            type: 'status',
            content: t('game.syncNext'),
            isNew: true,
            uiKind: 'syncNext',
            sourceNodeId: node.id,
          });
          persistState(getPendingNodeIdAfterNode(nodeId), currentMsgs);
        }
      }

      if (node.nextId) {
        nodeQueueRef.current.push(node.nextId);
      }
      return true;
    },
    [activateChoice, addMessage, archiveCurrentFatalCycle, commitAvatarNodeEffect, markCommemorativeArchiveSaved, markCurrentCycleNode, persistState, saveMemoryAnchor, stopFastForwardAtInteraction, stopReadSkip, storyNodeMap, t, triggerSignalGlitch, unlockArchives, updateDeliveryRuntime, waitForPlayback, waitForSignal],
  );

  const processQueue = useCallback(async (runId: number) => {
    if (activeQueueRunIdRef.current === runId) return;
    activeQueueRunIdRef.current = runId;
    setIsSyncing(true);

    while (nodeQueueRef.current.length > 0 && queueRunIdRef.current === runId) {
      const nextId = nodeQueueRef.current.shift()!;
      const shouldContinue = await processSingleNode(nextId, runId);
      if (!shouldContinue || queueRunIdRef.current !== runId) break;
    }

    if (activeQueueRunIdRef.current === runId) {
      activeQueueRunIdRef.current = null;
      setIsSyncing(false);
    }
  }, [processSingleNode]);

  const startSequence = useCallback(
    (nodeId: string) => {
      const runId = queueRunIdRef.current + 1;
      queueRunIdRef.current = runId;
      nodeQueueRef.current = [nodeId];
      setTimeout(() => {
        if (queueRunIdRef.current === runId) {
          processQueue(runId);
        }
      }, 50);
    },
    [processQueue],
  );

  const scheduleSequence = useCallback(
    (nodeId: string, delay: number) => {
      const requestRunId = queueRunIdRef.current;
      setTimeout(() => {
        if (queueRunIdRef.current === requestRunId) {
          startSequence(nodeId);
        }
      }, delay);
    },
    [startSequence],
  );

  const handleLinkStateChange = useCallback((linkState: CommunicationLinkState) => {
    if (deliveryRuntimeRef.current.linkState === linkState) return;
    const nextRuntime = updateDeliveryRuntime(current => ({ ...current, linkState }));
    saveGame(createSaveData(
      pendingNodeIdRef.current,
      messagesRef.current,
      avatarStateRef.current,
      contactStageRef.current,
      statsRef.current,
      nextRuntime,
      cycleStateRef.current,
    ));
  }, [updateDeliveryRuntime]);

  const handleDeliveryPhase = useCallback((
    messageId: string,
    phase: DeliveryTimelinePhase,
    elapsedMs: number,
  ) => {
    let targetNodeId = pendingNodeIdRef.current;
    const updated = messagesRef.current.map(message => {
      if (message.id !== messageId) return message;
      targetNodeId = message.branchTargetNodeId ?? targetNodeId;
      return {
        ...message,
        deliveryState: phase.state,
        retryCount: phase.retryCount ?? message.retryCount ?? 0,
        deliveryLatencyMs: Math.round(elapsedMs),
        deliveryLabelVisible: phase.showLabel === true,
        ...(phase.state === 'delivered' ? { deliveredAt: Date.now() } : {}),
      };
    });
    messagesRef.current = updated;
    setMessages(updated);
    updateDeliveryRuntime(current => ({
      ...current,
      activeMessageId: messageId,
      pendingAutoRetryIds: phase.state === 'failed'
        ? [messageId]
        : current.pendingAutoRetryIds,
    }));
    persistState(targetNodeId, updated);
  }, [persistState, updateDeliveryRuntime]);

  const handleDeliveryComplete = useCallback((
    messageId: string,
    spec: DeliverySpec,
    elapsedMs: number,
  ) => {
    let targetNodeId = pendingNodeIdRef.current;
    const updated = messagesRef.current.map(message => {
      if (message.id !== messageId) return message;
      targetNodeId = message.branchTargetNodeId ?? targetNodeId;
      return {
        ...message,
        deliveryState: 'delivered' as const,
        deliveredAt: message.deliveredAt ?? Date.now(),
        deliveryLatencyMs: Math.round(elapsedMs),
        deliveryLabelVisible: false,
      };
    });
    messagesRef.current = updated;
    setMessages(updated);
    updateDeliveryRuntime(current => {
      const completed = spec.key
        ? setDeliveryReceipt(current, spec.key, 'completed')
        : current;
      return {
        ...completed,
        activeMessageId: undefined,
        pendingAutoRetryIds: completed.pendingAutoRetryIds.filter(id => id !== messageId),
      };
    });
    persistState(targetNodeId, updated);
    scheduleSequence(targetNodeId, 120);
  }, [persistState, scheduleSequence, updateDeliveryRuntime]);

  useEffect(() => {
    const callbacks = {
      onDeliveryPhase: handleDeliveryPhase,
      onDeliveryComplete: handleDeliveryComplete,
      onLinkStateChange: handleLinkStateChange,
    };
    if (deliveryControllerRef.current) {
      deliveryControllerRef.current.setCallbacks(callbacks);
    } else {
      deliveryControllerRef.current = new DeliveryController(callbacks);
    }
  }, [handleDeliveryComplete, handleDeliveryPhase, handleLinkStateChange]);

  useEffect(() => () => {
    deliveryControllerRef.current?.dispose();
    deliveryControllerRef.current = null;
  }, []);

  useEffect(() => {
    if (!INTERNAL_TEST_NODE_ID || internalTestBootstrappedRef.current) return;
    if (!storyNodeMap.has(INTERNAL_TEST_NODE_ID)) return;
    internalTestBootstrappedRef.current = true;
    cancelActiveSequence();
    clearSave();

    const testStats: GameStats = {
      ...defaultStats,
      memoryAnchors: [
        'n7',
        'milk_candy',
        'white_flower',
        'first_message',
        'goodnight',
        'observatory',
        'maintenance_board',
        'steak',
      ],
    };
    if (INTERNAL_TEST_ANCHOR_ID && isSealableMemoryAnchor(INTERNAL_TEST_ANCHOR_ID)) {
      testStats.temporaryAnchorSealed = INTERNAL_TEST_ANCHOR_ID;
    }
    const testNode = storyNodeMap.get(INTERNAL_TEST_NODE_ID);
    if (testNode?.interactionKind === 'memory-restore' && !testStats.temporaryAnchorSealed) {
      testStats.temporaryAnchorSealed = 'maintenance_board';
    }
    if (testNode?.interactionKind === 'power-routing' && testNode.interactionAttempt === 2) {
      testStats.powerRoutingAttempt = 1;
      testStats.powerFirstFailureReason = 'life_support_below_minimum';
      testStats.nova06PowerOverrideUsed = true;
      testStats.nova06PowerOverrideExpired = true;
    }

    messagesRef.current = [];
    statsRef.current = testStats;
    const testAvatarState = createNovaAvatarStateForCheckpoint(INTERNAL_TEST_NODE_ID);
    const testPrologueIndex = /^PRO-\d{4}$/.test(INTERNAL_TEST_NODE_ID)
      ? Number(INTERNAL_TEST_NODE_ID.slice(-4))
      : Number.POSITIVE_INFINITY;
    const testContactStage: ContactStage = testAvatarState.novaIdentityVerified
      ? 'verified'
      : testPrologueIndex <= 38
        ? 'unknown'
        : 'named';
    avatarStateRef.current = testAvatarState;
    contactStageRef.current = testContactStage;
    const testDeliveryRuntime = {
      ...createDefaultChatDeliveryRuntime(),
      linkState: getNodeLinkStateEffect(INTERNAL_TEST_NODE_ID) ?? 'stable' as CommunicationLinkState,
    };
    deliveryRuntimeRef.current = testDeliveryRuntime;
    pendingNodeIdRef.current = INTERNAL_TEST_NODE_ID;
    setMessages([]);
    setStats(testStats);
    setAvatarState(testAvatarState);
    setContactStage(testContactStage);
    setDeliveryRuntime(testDeliveryRuntime);
    setScreen('playing');
    startSequence(INTERNAL_TEST_NODE_ID);
  }, [cancelActiveSequence, startSequence, storyNodeMap]);

  const completeCycleSync = useCallback((plan: CycleReplayResult) => {
    const completedCycle: CurrentCycleState = {
      ...plan.cycleState,
      syncAvailable: false,
      syncActive: false,
      syncInterrupted: false,
      syncCursor: plan.events.length,
    };
    statsRef.current = plan.stats;
    avatarStateRef.current = plan.avatarState;
    contactStageRef.current = plan.contactStage;
    cycleStateRef.current = completedCycle;
    pendingNodeIdRef.current = plan.nextNodeId;
    setStats(plan.stats);
    setAvatarState(plan.avatarState);
    setContactStage(plan.contactStage);
    setCycleState(completedCycle);
    setActiveSyncEvents([]);
    setSyncVisibleCount(0);
    syncPlanRef.current = null;
    syncTimerRef.current = null;

    const currentMessages = appendCycleNotices(['cycle.syncCompleted']);
    persistState(plan.nextNodeId, currentMessages);
    scheduleSequence(plan.nextNodeId, 420);
  }, [appendCycleNotices, persistState, scheduleSequence]);

  const beginCycleSync = useCallback((record: FailedCycleRecord, resumeCursor = 0) => {
    previousCycleRecordRef.current = record;
    const baseCycle: CurrentCycleState = {
      ...cycleStateRef.current,
      currentRebootNumber: 8,
      syncAvailable: true,
      syncActive: true,
      syncInterrupted: false,
      syncBoundaryNodeId: cycleStateRef.current.syncBoundaryNodeId,
      syncCursor: Math.max(0, resumeCursor),
      previousCycleId: record.cycleId,
    };
    const plan = replayFailedCycle(record, storyNodeMap, createNewGameStats(), baseCycle);
    syncPlanRef.current = plan;
    const initialCursor = Math.min(Math.max(0, resumeCursor), plan.events.length);
    const activeCycle = { ...baseCycle, syncCursor: initialCursor };
    cycleStateRef.current = activeCycle;
    setCycleState(activeCycle);
    setSyncOfferVisible(false);
    setActiveSyncEvents(plan.events);
    setSyncVisibleCount(initialCursor);

    if (
      initialCursor === 0
      && !messagesRef.current.some(message => message.uiKey === 'cycle.memoryProjection')
    ) {
      const currentMessages = appendCycleNotices([
        'cycle.memoryProjection',
        'cycle.projectionWarning',
      ]);
      persistState('PRO-0001', currentMessages);
    } else {
      persistState('PRO-0001', messagesRef.current);
    }

    if (plan.events.length === 0 || initialCursor >= plan.events.length) {
      completeCycleSync(plan);
      return;
    }

    const step = Math.max(1, Math.ceil(plan.events.length / 88));
    const advance = () => {
      const currentPlan = syncPlanRef.current;
      if (!currentPlan) return;
      const nextCursor = Math.min(
        currentPlan.events.length,
        cycleStateRef.current.syncCursor + step,
      );
      const nextCycle = { ...cycleStateRef.current, syncCursor: nextCursor };
      cycleStateRef.current = nextCycle;
      setCycleState(nextCycle);
      setSyncVisibleCount(nextCursor);

      if (nextCursor >= currentPlan.events.length) {
        completeCycleSync(currentPlan);
        return;
      }

      if (nextCursor % Math.max(step * 8, 1) === 0) {
        persistState('PRO-0001', messagesRef.current);
      }
      syncTimerRef.current = window.setTimeout(advance, 46);
    };
    syncTimerRef.current = window.setTimeout(advance, 180);
  }, [appendCycleNotices, completeCycleSync, persistState, storyNodeMap]);

  const interruptCycleSyncAt = useCallback((eventLimit: number, showNotice: boolean) => {
    const record = previousCycleRecordRef.current;
    if (!record) return;
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    syncPlanRef.current = null;

    const replay = replayFailedCycle(
      record,
      storyNodeMap,
      createNewGameStats(),
      cycleStateRef.current,
      Math.max(0, eventLimit),
    );
    const interruptedCycle: CurrentCycleState = {
      ...replay.cycleState,
      syncAvailable: false,
      syncActive: false,
      syncInterrupted: true,
      syncCursor: Math.max(0, eventLimit),
      currentCycleDeviationStarted: false,
      previousCycleId: record.cycleId,
    };
    statsRef.current = replay.stats;
    avatarStateRef.current = replay.avatarState;
    contactStageRef.current = replay.contactStage;
    cycleStateRef.current = interruptedCycle;
    pendingNodeIdRef.current = replay.nextNodeId;
    setStats(replay.stats);
    setAvatarState(replay.avatarState);
    setContactStage(replay.contactStage);
    setCycleState(interruptedCycle);
    setSyncOfferVisible(false);
    setActiveSyncEvents([]);
    setSyncVisibleCount(0);

    const currentMessages = showNotice
      ? appendCycleNotices(['cycle.syncInterrupted'])
      : messagesRef.current;
    persistState(replay.nextNodeId, currentMessages);
    scheduleSequence(replay.nextNodeId, 360);
  }, [appendCycleNotices, persistState, scheduleSequence, storyNodeMap]);

  const interruptCycleSync = useCallback(() => {
    interruptCycleSyncAt(syncVisibleCount, true);
  }, [interruptCycleSyncAt, syncVisibleCount]);

  const declineCycleSync = useCallback(() => {
    interruptCycleSyncAt(0, false);
  }, [interruptCycleSyncAt]);

  const startGame = useCallback(
    (mode: 'new' | 'continue' | 'reconnect08') => {
      cancelActiveSequence();
      setChoices(null);
      setChoiceNodeId(null);
      setIsTyping(false);
      setIsTypewriterActive(false);
      setTypewriterText('');
      setSignalGlitch(null);
      setIsSyncing(false);
      setShowChapterBanner(null);
      setShowArchive(false);
      setShowRestartConfirm(false);
      setShowMenuSettings(false);
      setSyncOfferVisible(false);
      setActiveSyncEvents([]);
      setSyncVisibleCount(0);
      setActiveInteraction(null);

      if (mode === 'continue') {
        const save = loadGame();
        if (save) {
          const progress = loadPersistentProgress();
          const previousCycle = progress.failedCycles.find(
            record => record.cycleId === save.cycleState.previousCycleId,
          ) ?? getLatestFailedCycle(progress) ?? null;
          const localizedMessages = relocalizeDisplayMessages(
            save.messages,
            storyNodeMap,
            t,
            memoryAnchorLabels,
          );
          messagesRef.current = localizedMessages;
          avatarStateRef.current = save.avatarState;
          statsRef.current = save.stats;
          cycleStateRef.current = save.cycleState;
          persistentProgressRef.current = progress;
          previousCycleRecordRef.current = previousCycle;
          contactStageRef.current = save.contactStage;
          deliveryRuntimeRef.current = save.deliveryRuntime;
          pendingNodeIdRef.current = save.pendingNodeId;
          setMessages(localizedMessages);
          setAvatarState(save.avatarState);
          setStats(save.stats);
          setCycleState(save.cycleState);
          setPersistentProgress(progress);
          setContactStage(save.contactStage);
          setDeliveryRuntime(save.deliveryRuntime);
          setScreen('playing');

          const lastMsg = save.messages[save.messages.length - 1];
          if (lastMsg?.type === 'end') {
            return;
          }

          if (previousCycle && save.cycleState.syncActive) {
            beginCycleSync(previousCycle, save.cycleState.syncCursor);
            return;
          }
          if (previousCycle && save.cycleState.syncAvailable) {
            setSyncOfferVisible(true);
            return;
          }

          const resumeId = resolveResumeNodeId(save);
          const activeDeliveryMessage = save.deliveryRuntime.activeMessageId
            ? localizedMessages.find(message => message.id === save.deliveryRuntime.activeMessageId)
            : undefined;
          if (
            activeDeliveryMessage?.scriptedDeliveryEvent === 'chapter5_explicit_failure'
            && activeDeliveryMessage.branchTargetNodeId
          ) {
            deliveryControllerRef.current?.start(
              activeDeliveryMessage.id,
              RESTORED_FAILURE_RETRY_SPEC,
            );
            return;
          }
          const resumeNode = storyNodeMap.get(resumeId);
          if (resumeNode?.type === 'choice') {
            activateChoice(resumeNode.id);
            setChoices(resumeNode.choices ?? null);
            setChoiceNodeId(resumeNode.id);
            return;
          }

          if (resumeNode?.type === 'input') {
            setInputNode(createActiveInputNode(resumeNode, t));
            setPlayerInput('');
            return;
          }

          if (resumeNode?.type === 'interaction' && resumeNode.interactionKind) {
            setActiveInteraction(resumeNode);
            return;
          }

          scheduleSequence(resumeId, 500);
          return;
        }
      }

      clearSave();
      const progress = loadPersistentProgress();
      const rebootNumber = mode === 'reconnect08' || progress.reboot08TitleUnlocked ? 8 : 7;
      const previousCycle = rebootNumber >= 8 ? getLatestFailedCycle(progress) ?? null : null;
      const freshStats = createNewGameStats();
      const freshAvatarState = createDefaultNovaAvatarState();
      const freshDeliveryRuntime = createDefaultChatDeliveryRuntime();
      const freshCycle = createCurrentCycleState(rebootNumber, previousCycle ?? undefined);
      const initialMessages = previousCycle
        ? createCycleNoticeMessages([
            'cycle.reboot08Link',
            'cycle.previousRecordDetected',
            'cycle.previousRecordSource',
            'cycle.previousRecordCycle',
          ], t)
        : [];
      messagesRef.current = initialMessages;
      avatarStateRef.current = freshAvatarState;
      contactStageRef.current = defaultContactStage;
      deliveryRuntimeRef.current = freshDeliveryRuntime;
      cycleStateRef.current = freshCycle;
      persistentProgressRef.current = progress;
      previousCycleRecordRef.current = previousCycle;
      pendingNodeIdRef.current = 'PRO-0001';
      setMessages(initialMessages);
      setAvatarState(freshAvatarState);
      setContactStage(defaultContactStage);
      setStats(freshStats);
      setCycleState(freshCycle);
      setPersistentProgress(progress);
      setDeliveryRuntime(freshDeliveryRuntime);
      statsRef.current = freshStats;
      setInputNode(null);
      setPlayerInput('');
      setWaitPrompt(null);
      setActiveInteraction(null);
      setShowArchive(false);
      setScreen('playing');
      saveGame(createSaveData(
        'PRO-0001',
        initialMessages,
        freshAvatarState,
        defaultContactStage,
        freshStats,
        freshDeliveryRuntime,
        freshCycle,
      ));
      setHasSave(true);
      setSaveTime(t('saveTime.justNow'));
      if (previousCycle) {
        setSyncOfferVisible(true);
      } else {
        startSequence('PRO-0001');
      }
    },
    [activateChoice, beginCycleSync, cancelActiveSequence, memoryAnchorLabels, scheduleSequence, startSequence, storyNodeMap, t],
  );

  const appendDeviationNoticeIfNeeded = useCallback((deviated: boolean) => {
    const current = cycleStateRef.current;
    if (!deviated || !current.syncInterrupted || current.currentCycleDeviationStarted) {
      return messagesRef.current;
    }
    updateCurrentCycle(cycle => ({ ...cycle, currentCycleDeviationStarted: true }));
    return appendCycleNotices([
      'cycle.deviationDetected',
      'cycle.deviationConfirmed',
    ]);
  }, [appendCycleNotices, updateCurrentCycle]);

  const handleSpecialInteractionResultLocked = useCallback(
    (completion: SpecialInteractionCompletion) => {
      if (!activeInteraction) return;
      const interactionRecord = createCycleInteractionRecord(activeInteraction.id, completion);
      updateCurrentCycle(current => recordCycleInteraction(current, interactionRecord));
      const currentMessages = appendDeviationNoticeIfNeeded(
        interactionDeviatesFromRecord(previousCycleRecordRef.current, interactionRecord),
      );
      const nextStats = applySpecialInteractionCompletion(statsRef.current, completion);
      statsRef.current = nextStats;
      setStats(nextStats);
      const nextId = activeInteraction.interactionNextIds?.[completion.routeKey]
        ?? activeInteraction.nextId
        ?? activeInteraction.id;
      if (completion.kind === 'power-routing' && completion.routeKey === 'success') {
        deliveryControllerRef.current?.setLinkState('stable');
      }
      persistState(nextId, currentMessages);
    },
    [activeInteraction, appendDeviationNoticeIfNeeded, persistState, updateCurrentCycle],
  );

  const handleSpecialInteractionComplete = useCallback(
    (completion: SpecialInteractionCompletion) => {
      if (!activeInteraction) return;
      const interactionRecord = createCycleInteractionRecord(activeInteraction.id, completion);
      updateCurrentCycle(current => recordCycleInteraction(current, interactionRecord));
      const currentMessages = appendDeviationNoticeIfNeeded(
        interactionDeviatesFromRecord(previousCycleRecordRef.current, interactionRecord),
      );
      const nextStats = applySpecialInteractionCompletion(statsRef.current, completion);
      statsRef.current = nextStats;
      setStats(nextStats);
      const nextId = activeInteraction.interactionNextIds?.[completion.routeKey]
        ?? activeInteraction.nextId
        ?? activeInteraction.id;
      setActiveInteraction(null);
      if (completion.kind === 'power-routing' && completion.routeKey === 'success') {
        deliveryControllerRef.current?.setLinkState('stable');
      }
      persistState(nextId, currentMessages);
      scheduleSequence(nextId, 350);
    },
    [activeInteraction, appendDeviationNoticeIfNeeded, persistState, scheduleSequence, updateCurrentCycle],
  );

  const saveInteractionAndExit = useCallback(() => {
    if (activeInteraction) {
      persistState(pendingNodeIdRef.current || activeInteraction.id, messagesRef.current);
    }
    goToMenu();
  }, [activeInteraction, goToMenu, persistState]);

  const applyChoiceEffects = useCallback((choice: Choice) => {
    const next = applyStoryChoiceEffects(statsRef.current, choice);
    statsRef.current = next;
    setStats(next);
    return next;
  }, []);

  const handleChoiceTimeout = useCallback(
    (node: StoryNode) => {
      if (!node.timeoutNextId || !claimChoiceResult(node.id)) return;
      setChoices(null);
      setChoiceNodeId(null);

      const nextStats = applyTimedChoiceTimeoutEffects(statsRef.current, node.id);
      statsRef.current = nextStats;
      setStats(nextStats);
      updateCurrentCycle(current => markCycleNodeCompleted(recordCycleTimedResult(current, {
        nodeId: node.id,
        outcome: 'timeout',
        nextId: node.timeoutNextId!,
      }), node.id));

      const updated = node.id === 'FIN-0231'
        ? addMessage({
          id: `choice_timeout_${node.id}_${Date.now()}`,
          speaker: 'system',
          type: 'status',
          content: t('game.choiceTimeout'),
          isNew: true,
          uiKind: 'choiceTimeout',
          sourceNodeId: node.id,
        })
        : messagesRef.current;
      persistState(node.timeoutNextId, updated);
      jumpToBottom();
      scheduleSequence(node.timeoutNextId, 550);
    },
    [addMessage, claimChoiceResult, persistState, scheduleSequence, jumpToBottom, t, updateCurrentCycle],
  );

  const handleChoice = useCallback(
    (choice: Choice) => {
      const fromNodeId = choiceNodeId;
      if (!fromNodeId) return;
      const committedAt = Date.now();
      const sourceNode = storyNodeMap.get(fromNodeId);
      const deadline = choiceDeadlineRef.current?.nodeId === fromNodeId
        ? choiceDeadlineRef.current.expiresAt
        : undefined;
      if (
        sourceNode?.choiceTimeoutMs
        && deadline != null
        && !isCommittedWithinDeadline(committedAt, deadline)
      ) {
        handleChoiceTimeout(sourceNode);
        return;
      }
      if (!claimChoiceResult(fromNodeId)) return;
      if (choiceTimeoutRef.current !== null) {
        window.clearTimeout(choiceTimeoutRef.current);
        choiceTimeoutRef.current = null;
      }
      const choiceIndex = choices
        ? choices.findIndex(item =>
            item === choice
            || (item.id && choice.id
              ? item.id === choice.id
              : item.text === choice.text && item.nextId === choice.nextId))
        : -1;
      setChoices(null);
      setChoiceNodeId(null);

      const nextStats = applyChoiceEffects(choice);
      const nextId = resolveEndingStart(choice.nextId, nextStats);
      const deliverySequence = messagesRef.current.reduce(
        (max, message) => Math.max(max, message.deliverySequence ?? 0),
        0,
      ) + 1;
      const choiceId = choice.id ?? `${fromNodeId}__${Math.max(0, choiceIndex)}`;
      const messageId = `player_${committedAt}_${deliverySequence}`;

      const spec = resolveDeliverySpec(
        sourceNode ?? {},
        choiceId,
        false,
        deliveryRuntimeRef.current.linkState,
      );
      const allowFail = sourceNode?.deliveryEvent === 'chapter5_explicit_failure';
      const playerMsg: DisplayMessage = {
        id: messageId,
        speaker: 'player',
        type: 'text',
        content: formatChoiceText(choice.text),
        isNew: true,
        sourceNodeId: fromNodeId,
        sourceChoiceIndex: choiceIndex >= 0 ? choiceIndex : undefined,
        choiceId,
        committedAt,
        committedOrder: deliverySequence,
        deliverySequence,
        deliveryState: 'queued',
        ...(sourceNode?.deliveryEvent ? { scriptedDeliveryEvent: sourceNode.deliveryEvent } : {}),
        retryCount: 0,
        autoRetry: allowFail,
        allowFail,
        branchCommitted: true,
        branchTargetNodeId: nextId,
        deliveryLatencyMs: 0,
        deliveryLabelVisible: false,
      };
      const updated = [...messagesRef.current, playerMsg];
      messagesRef.current = updated;
      setMessages(updated);
      updateCurrentCycle(current => {
        let nextCycle = recordCycleChoice(current, {
          nodeId: fromNodeId,
          choiceId,
          choiceIndex: Math.max(0, choiceIndex),
          nextId,
          committedAt,
        });
        if (sourceNode?.choiceTimeoutMs) {
          nextCycle = recordCycleTimedResult(nextCycle, {
            nodeId: fromNodeId,
            outcome: 'choice',
            choiceId,
            nextId,
          });
        }
        return nextCycle;
      });
      const persistedMessages = appendDeviationNoticeIfNeeded(
        choiceDeviatesFromRecord(previousCycleRecordRef.current, fromNodeId, choiceId),
      );
      updateDeliveryRuntime(current => {
        const withReceipt = sourceNode?.deliveryEvent
          ? setDeliveryReceipt(current, sourceNode.deliveryEvent, 'in_progress')
          : current;
        return {
          ...withReceipt,
          linkState: spec.phases[0].linkState ?? withReceipt.linkState,
          activeMessageId: messageId,
          pendingAutoRetryIds: [],
        };
      });
      persistState(nextId, persistedMessages);
      jumpToBottom();

      if (deliveryControllerRef.current) {
        deliveryControllerRef.current.start(messageId, spec, committedAt);
      } else {
        handleDeliveryComplete(messageId, spec, spec.completeAtMs);
      }
    },
    [
      applyChoiceEffects,
      choiceNodeId,
      choices,
      claimChoiceResult,
      handleChoiceTimeout,
      handleDeliveryComplete,
      jumpToBottom,
      persistState,
      storyNodeMap,
      updateDeliveryRuntime,
      updateCurrentCycle,
      appendDeviationNoticeIfNeeded,
    ],
  );

  useEffect(() => {
    if (!choices || !choiceNodeId) return undefined;
    const node = storyNodeMap.get(choiceNodeId);
    if (!node?.choiceTimeoutMs || !node.timeoutNextId) return undefined;

    if (choiceTimeoutRef.current !== null) window.clearTimeout(choiceTimeoutRef.current);
    const now = Date.now();
    const deadline = choiceDeadlineRef.current?.nodeId === node.id
      ? choiceDeadlineRef.current
      : { nodeId: node.id, expiresAt: now + node.choiceTimeoutMs };
    choiceDeadlineRef.current = deadline;
    const remainingMs = Math.max(0, deadline.expiresAt - now);
    choiceTimeoutRef.current = window.setTimeout(() => {
      choiceTimeoutRef.current = null;
      handleChoiceTimeout(node);
    }, remainingMs);

    return () => {
      if (choiceTimeoutRef.current !== null) {
        window.clearTimeout(choiceTimeoutRef.current);
        choiceTimeoutRef.current = null;
      }
    };
  }, [choiceNodeId, choices, handleChoiceTimeout, storyNodeMap]);

  const handleInputTimeout = useCallback(
    (node: ActiveInputNode) => {
      if (!node.timeoutNextId) return;
      setInputNode(null);
      setPlayerInput('');
      updateCurrentCycle(current => markCycleNodeCompleted(recordCycleTimedResult(current, {
        nodeId: node.id,
        outcome: 'timeout',
        nextId: node.timeoutNextId!,
      }), node.id));
      persistState(node.timeoutNextId, messagesRef.current);
      jumpToBottom();
      scheduleSequence(node.timeoutNextId, 550);
    },
    [persistState, scheduleSequence, jumpToBottom, updateCurrentCycle],
  );

  useEffect(() => {
    if (!inputNode?.timeoutMs || !inputNode.timeoutNextId) return undefined;

    if (choiceTimeoutRef.current !== null) {
      window.clearTimeout(choiceTimeoutRef.current);
    }
    choiceTimeoutRef.current = window.setTimeout(() => {
      choiceTimeoutRef.current = null;
      handleInputTimeout(inputNode);
    }, inputNode.timeoutMs);

    return () => {
      if (choiceTimeoutRef.current !== null) {
        window.clearTimeout(choiceTimeoutRef.current);
        choiceTimeoutRef.current = null;
      }
    };
  }, [handleInputTimeout, inputNode]);

  const handlePlayerInput = useCallback(() => {
    if (!inputNode) return;
    const trimmed = playerInput.trim();
    if (inputNode.inputMinLength && trimmed.length < inputNode.inputMinLength) return;
    const text = inputNode.inputMaxLength ? trimmed.slice(0, inputNode.inputMaxLength) : trimmed || '......';
    if (choiceTimeoutRef.current !== null) {
      window.clearTimeout(choiceTimeoutRef.current);
      choiceTimeoutRef.current = null;
    }
    const nextId = inputNode.specialInputNextIds?.[text] ?? inputNode.nextId ?? inputNode.id;
    const playerMsg: DisplayMessage = {
      id: `player_${Date.now()}`,
      speaker: 'player',
      type: 'text',
      content: text,
      isNew: true,
      sourceNodeId: inputNode.id,
    };
    const updated = [...messagesRef.current, playerMsg];
    messagesRef.current = updated;
    setMessages(updated);
    updateCurrentCycle(current => recordCycleFreeInput(current, {
      nodeId: inputNode.id,
      value: text,
      nextId,
    }));
    const persistedMessages = appendDeviationNoticeIfNeeded(
      inputDeviatesFromRecord(previousCycleRecordRef.current, inputNode.id, text),
    );
    setInputNode(null);
    setPlayerInput('');
    persistState(nextId, persistedMessages);
    jumpToBottom(true);
    scheduleSequence(nextId, 400);
  }, [appendDeviationNoticeIfNeeded, inputNode, jumpToBottom, persistState, playerInput, scheduleSequence, updateCurrentCycle]);

  const lastMsg = messages[messages.length - 1];
  const isLastNovaTyping =
    isTypewriterActive && lastMsg && lastMsg.speaker === 'nova' && lastMsg.type === 'text';
  const isInputReady = !inputNode?.inputMinLength || playerInput.trim().length >= inputNode.inputMinLength;

  const saveSnapshot = screen === 'menu' && hasSave ? loadGame() : null;
  const saveProgress = saveSnapshot
    ? getSaveProgressLabel(saveSnapshot.pendingNodeId, saveSnapshot.messages, t)
    : t('progress.prologue');
  const menuContactStage = saveSnapshot?.contactStage ?? defaultContactStage;
  const contactMeta = contactMetaByStage[contactStage];
  const avatarPresentation = resolveNovaAvatarPresentation(avatarState, {
    activeSpecialInteraction: activeInteraction?.interactionKind,
    communicationLinkState: deliveryRuntime.linkState,
  });
  const menuAvatarPresentation = resolveNovaAvatarPresentation(
    saveSnapshot?.avatarState ?? createDefaultNovaAvatarState(),
  );
  const menuArchiveStats: GameStats = saveSnapshot?.stats ?? {
    ...stats,
    unlockedArchives: [...new Set([
      ...stats.unlockedArchives,
      ...persistentProgress.unlockedArchives,
    ])],
    endingsUnlocked: [...new Set([
      ...stats.endingsUnlocked,
      ...persistentProgress.endingsUnlocked,
    ])],
    commemorativeArchiveSaved:
      stats.commemorativeArchiveSaved || persistentProgress.commemorativeArchiveSaved,
    normalEpilogueUnlocked:
      stats.normalEpilogueUnlocked || persistentProgress.normalEpilogueUnlocked,
    trueEpilogueUnlocked:
      stats.trueEpilogueUnlocked || persistentProgress.trueEpilogueUnlocked,
  };
  const contactSubtitle = contactStage === 'unknown'
    ? t('contact.unknownSubtitle')
    : avatarState.novaConnectionState === 'archived'
      ? t('contact.archivedSubtitle')
      : avatarState.novaConnectionState === 'offline'
        ? t('contact.offlineSubtitle')
        : deliveryRuntime.linkState !== 'stable'
          ? t(`link.${deliveryRuntime.linkState}`)
        : avatarState.novaConnectionState === 'weak'
          ? t('contact.weakSubtitle')
          : t('contact.stableSubtitle');
  const isFinished = messages.some(message => message.type === 'end');
  const isSignalActive = isSyncing || isTyping || isTypewriterActive || Boolean(deliveryRuntime.activeMessageId);
  const shouldShowMediaSafeSpace = Boolean(choices && hasRecentMediaMessage(messages));
  const isReboot08Menu = persistentProgress.reboot08TitleUnlocked;
  const hasPersistentArchive =
    persistentProgress.unlockedArchives.length > 0
    || persistentProgress.endingsUnlocked.length > 0
    || persistentProgress.normalEpilogueUnlocked
    || persistentProgress.trueEpilogueUnlocked
    || persistentProgress.failedCycles.length > 0;
  const menuRebootNumber = isReboot08Menu ? 8 : 7;

  if (screen === 'menu') {
    return (
      <div className="app-shell game-shell menu-screen relative overflow-hidden">
        <StarBackground variant="menu" />
        <div className="menu-signal-field" aria-hidden="true">
          <span className="menu-route-line menu-route-line-a" />
          <span className="menu-route-line menu-route-line-b" />
          <span className="menu-route-node menu-route-node-a" />
          <span className="menu-route-node menu-route-node-b" />
        </div>
        <div className="menu-topbar">
          <div className="menu-system-ident">
            <span className="menu-system-dot" aria-hidden="true" />
            <span>{t('menu.terminal')}</span>
            <small>PHASE-LINK / {String(menuRebootNumber).padStart(2, '0')}</small>
          </div>
          <span className="menu-topbar-code">OBSERVER-01 / LOCAL INDEX</span>
        </div>
        <main className="menu-stage relative z-10">
          <section className="menu-primary-zone animate-fade-in">
            <GameTitle
              title={t(isReboot08Menu ? 'menu.title08' : 'menu.title')}
              subtitle={t('menu.subtitle')}
              phaseLabel={t('menu.phaseArchive')}
              locale={locale}
              rebootNumber={menuRebootNumber}
            />
            {!isReboot08Menu && <div className="menu-language-selector" role="group" aria-label={t('menu.language')}>
              {(['zh-CN', 'en-US'] as Locale[]).map(code => (
                <button
                  type="button"
                  key={code}
                  onClick={() => setLocale(code)}
                  className={locale === code ? 'menu-language-active' : ''}
                  aria-pressed={locale === code}
                >
                  {code === 'zh-CN' ? t('menu.languageZh') : t('menu.languageEn')}
                </button>
              ))}
            </div>}
            <nav className="menu-command-list" aria-label={t('menu.commandAria')}>
              {isReboot08Menu ? (
                <>
                  <button
                    type="button"
                    onClick={() => startGame(
                      saveSnapshot?.cycleState.currentRebootNumber === 8 ? 'continue' : 'reconnect08'
                    )}
                    className="menu-command menu-command-primary menu-command-reconnect08"
                  >
                    <span aria-hidden="true" className="menu-command-corner menu-command-corner-left" />
                    <strong>{t('menu.reconnect08')}</strong>
                    <span aria-hidden="true" className="menu-command-corner menu-command-corner-right" />
                  </button>
                  {saveSnapshot?.cycleState.currentRebootNumber === 8 && (
                    <div className="menu-save-meta">
                      <span>{t('menu.lastConnection', { time: saveTime })}</span>
                      <span>{t('menu.currentProgress', { progress: saveProgress })}</span>
                    </div>
                  )}
                  <div className="menu-secondary-actions menu-reboot08-actions">
                    <button type="button" onClick={() => setShowArchive(true)}>{t('menu.records')}</button>
                    <button type="button" onClick={() => setShowMenuSettings(true)}>{t('menu.settings')}</button>
                  </div>
                </>
              ) : hasSave ? (
                <>
                  <button
                    type="button"
                    onClick={() => startGame('continue')}
                    className="menu-command menu-command-primary"
                  >
                    <span aria-hidden="true" className="menu-command-corner menu-command-corner-left" />
                    <strong>{t('menu.continue')}</strong>
                    <span aria-hidden="true" className="menu-command-corner menu-command-corner-right" />
                  </button>
                  <div className="menu-save-meta">
                    <span>{t('menu.lastConnection', { time: saveTime })}</span>
                    <span>{t('menu.currentProgress', { progress: saveProgress })}</span>
                  </div>
                  <div className="menu-secondary-actions">
                    <button type="button" onClick={() => setShowArchive(true)}>
                      {t('menu.archive')}
                    </button>
                    <button type="button" onClick={() => setShowRestartConfirm(true)}>
                      {t('menu.restart')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startGame('new')}
                    className="menu-command menu-command-primary"
                  >
                    <span aria-hidden="true" className="menu-command-corner menu-command-corner-left" />
                    <strong>{t('menu.connect')}</strong>
                    <span aria-hidden="true" className="menu-command-corner menu-command-corner-right" />
                  </button>
                  {hasPersistentArchive && (
                    <div className="menu-secondary-actions">
                      <button type="button" onClick={() => setShowArchive(true)}>
                        {t('menu.archive')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </nav>
          </section>
        </main>
        <footer className="menu-footer relative z-10">
          <div className="menu-footer-status">
            <span className="menu-footer-dot" aria-hidden="true" />
            <div>
              <span>{t(isReboot08Menu ? 'menu.memoryStandby08' : 'menu.memoryStandby')}</span>
              <small>{t(isReboot08Menu ? 'menu.protocolTagline08' : 'menu.protocolTagline')}</small>
            </div>
          </div>
        </footer>
        {showArchive && (
          <MemoryArchiveOverlay
            stats={menuArchiveStats}
            contactStage={menuContactStage}
            avatarPresentation={menuAvatarPresentation}
            onClose={() => setShowArchive(false)}
            backLabel={t('archiveOverlay.backToMenu')}
            failedCycles={persistentProgress.failedCycles}
            currentRebootNumber={menuRebootNumber}
          />
        )}
        {showMenuSettings && (
          <div className="menu-settings-overlay" role="dialog" aria-modal="true" aria-label={t('menu.settings')}>
            <section className="menu-settings-panel">
              <span>OBSERVER-01 / LOCAL SETTINGS</span>
              <h2>{t('menu.settings')}</h2>
              <label>{t('menu.language')}</label>
              <div className="menu-settings-languages" role="group" aria-label={t('menu.language')}>
                {(['zh-CN', 'en-US'] as Locale[]).map(code => (
                  <button
                    type="button"
                    key={code}
                    onClick={() => setLocale(code)}
                    aria-pressed={locale === code}
                    className={locale === code ? 'menu-settings-language-active' : ''}
                  >
                    {code === 'zh-CN' ? t('menu.languageZh') : t('menu.languageEn')}
                  </button>
                ))}
              </div>
              <button type="button" className="menu-settings-close" onClick={() => setShowMenuSettings(false)}>
                {t('menu.close')}
              </button>
            </section>
          </div>
        )}
        {showRestartConfirm && (
          <RestartDialog
            onCancel={() => setShowRestartConfirm(false)}
            onConfirm={() => {
              setHasSave(false);
              setShowRestartConfirm(false);
              startGame('new');
            }}
          />
        )}
        {import.meta.env.DEV && (
          <AvatarDebugPanel
            currentPresentation={menuAvatarPresentation}
            currentState={saveSnapshot?.avatarState ?? createDefaultNovaAvatarState()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-shell game-shell chat-screen relative overflow-hidden">
      {!activeInteraction && <StarBackground />}
      {!activeInteraction && <div className="chat-atmosphere pointer-events-none" aria-hidden />}
      {signalGlitch && (
        <div
          key={signalGlitch.pulse}
          className={`signal-glitch-layer signal-glitch-level-${signalGlitch.level} signal-glitch-${signalGlitch.tone} signal-glitch-style-${signalGlitch.style} ${
            signalGlitch.soft ? 'signal-glitch-soft' : ''
          }`}
          aria-hidden
        >
          <div className="signal-glitch-flash" />
          <div className="signal-glitch-vignette" />
          <div className="signal-glitch-noise" />
          <div className="signal-glitch-snow" />
          <div className="signal-glitch-scanlines" />
          <div className="signal-glitch-ripple signal-glitch-ripple-a" />
          <div className="signal-glitch-line signal-glitch-line-b" />
          <div className="signal-glitch-line signal-glitch-line-c" />
        </div>
      )}
      {showChapterBanner && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
          <ChapterBanner title={showChapterBanner} />
        </div>
      )}
      <ObserverEchoLayer content={observerEcho} />
      {modalImage && (
        <ImageModal
          image={modalImage.image}
          caption={modalImage.caption}
          onClose={() => setModalImage(null)}
        />
      )}
      {showArchive && (
        <MemoryArchiveOverlay
          stats={stats}
          contactStage={contactStage}
          avatarPresentation={avatarPresentation}
          onClose={() => setShowArchive(false)}
          failedCycles={persistentProgress.failedCycles}
          currentRebootNumber={cycleState.currentRebootNumber}
        />
      )}
      {syncOfferVisible && (
        <div className="cycle-sync-offer" role="dialog" aria-modal="true" aria-label={t('cycle.offerTitle')}>
          <span className="cycle-sync-offer-code">OBSERVER-01 / PREVIOUS LINK 07</span>
          <h2>{t('cycle.offerTitle')}</h2>
          <p>{t('cycle.offerBody')}</p>
          <div className="cycle-sync-offer-warning">{t('cycle.offerWarning')}</div>
          <div className="cycle-sync-offer-actions">
            <button
              type="button"
              className="cycle-sync-offer-primary"
              onClick={() => {
                const record = previousCycleRecordRef.current;
                if (record) beginCycleSync(record);
              }}
            >
              {t('cycle.beginSync')}
            </button>
            <button type="button" onClick={declineCycleSync}>{t('cycle.enterManually')}</button>
          </div>
        </div>
      )}
      {activeSyncEvents.length > 0 && (
        <CycleSyncOverlay
          events={activeSyncEvents}
          visibleCount={syncVisibleCount}
          onInterrupt={interruptCycleSync}
        />
      )}
      {activeInteraction && (
        <SpecialInteractionOverlay
          node={activeInteraction}
          locale={locale}
          sealedAnchor={stats.temporaryAnchorSealed}
          powerFirstFailureReason={stats.powerFirstFailureReason}
          avatarPresentation={avatarPresentation}
          onResultLocked={handleSpecialInteractionResultLocked}
          onComplete={handleSpecialInteractionComplete}
          onSaveAndExit={saveInteractionAndExit}
        />
      )}
      {import.meta.env.DEV && !activeInteraction && (
        <>
          <AvatarDebugPanel currentPresentation={avatarPresentation} currentState={avatarState} />
          <DeliveryDebugPanel
            runtime={deliveryRuntime}
            messages={messages}
            onSetLinkState={state => deliveryControllerRef.current?.setLinkState(state)}
          />
        </>
      )}

      <div
        data-link-state={deliveryRuntime.linkState}
        className={`game-layout relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-[1160px] mx-auto bg-[#080A0D]/84 backdrop-blur-sm ${
          signalGlitch ? `signal-glitch-frame signal-glitch-frame-level-${signalGlitch.level} signal-glitch-frame-style-${signalGlitch.style}` : ''
        }`}
      >
          <header className="game-header chat-header flex items-center gap-3 px-3 sm:px-4 py-3 bg-[#151A26]/92 border-b border-[#1A2236]/80 shrink-0">
            <div className="relative shrink-0">
              <NovaAvatar
                presentation={avatarPresentation}
                transition={avatarTransition}
                className={`nova-header-avatar ${signalGlitch ? `signal-glitch-avatar signal-glitch-avatar-${signalGlitch.tone} signal-glitch-avatar-style-${signalGlitch.style}` : ''}`}
              />
              <span
                className="contact-status-dot"
                data-connection={avatarState.novaConnectionState}
                data-link-state={deliveryRuntime.linkState}
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[#E8EEF4] text-[15px] font-medium leading-tight">{contactMeta.name}</span>
              <span className="text-[#6E8498] text-[11px] leading-snug truncate">{contactSubtitle}</span>
            </div>
              <div
                className="chat-link-readout"
                data-link-state={deliveryRuntime.linkState}
                role="status"
                aria-live="polite"
              >
                <span>{t(`link.${deliveryRuntime.linkState}`)}</span>
                <span className="chat-link-bars"><i /><i /><i /><i /></span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {INTERNAL_TEST_SKIP_ENABLED && !activeInteraction && !observerEcho && (
                <button
                  type="button"
                  onClick={skipToNextChoice}
                  className={`header-tool-btn internal-skip-btn text-[11px] px-2.5 py-1.5 rounded transition-colors ${isSkippingToChoice ? 'internal-skip-btn-active' : ''}`}
                  disabled={Boolean(
                    choices
                    || inputNode
                    || activeInteraction
                    || isFinished
                    || deliveryRuntime.activeMessageId
                  )}
                  title="Internal test: skip to next choice/input"
                  aria-label={isSkippingToChoice ? t('game.skipping') : t('game.skip')}
                >
                  <SkipForward size={14} strokeWidth={1.7} aria-hidden="true" />
                  <span className="header-btn-label">{isSkippingToChoice ? t('game.skipping') : t('game.skip')}</span>
                </button>
              )}
              {cycleState.syncInterrupted && !activeInteraction && !syncOfferVisible && !observerEcho && (
                <button
                  type="button"
                  onClick={skipReadText}
                  className={`header-tool-btn read-skip-btn text-[11px] px-2.5 py-1.5 rounded transition-colors ${isSkippingRead ? 'read-skip-btn-active' : ''}`}
                  disabled={Boolean(
                    choices
                    || inputNode
                    || isFinished
                    || deliveryRuntime.activeMessageId
                    || isSkippingRead
                  )}
                  title={t('game.skipReadHint')}
                  aria-label={isSkippingRead ? t('game.skippingRead') : t('game.skipRead')}
                >
                  <SkipForward size={14} strokeWidth={1.7} aria-hidden="true" />
                  <span className="header-btn-label">{isSkippingRead ? t('game.skippingRead') : t('game.skipRead')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowArchive(true)}
                className="header-tool-btn header-archive-btn text-[11px] px-2.5 py-1.5 rounded transition-colors"
                aria-label={t('game.archive')}
                title={t('game.archive')}
              >
                <Archive size={14} strokeWidth={1.7} aria-hidden="true" />
                <span className="header-btn-label">{t('game.archive')}</span>
              </button>
              <button
                type="button"
                onClick={goToMenu}
                className="header-tool-btn header-disconnect-btn text-[11px] px-2.5 py-1.5 rounded transition-colors"
                aria-label={t('game.disconnect')}
                title={t('game.disconnect')}
              >
                <LogOut size={14} strokeWidth={1.7} aria-hidden="true" />
                <span className="header-btn-label">{t('game.disconnect')}</span>
              </button>
            </div>
          </header>

          <div className="game-chat-shell">
            <div
              ref={chatScrollRef}
              className={`game-chat chat-scroll flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 space-y-0 ${
                signalGlitch ? `signal-glitch-chat signal-glitch-chat-level-${signalGlitch.level} signal-glitch-chat-style-${signalGlitch.style}` : ''
              }`}
              onScroll={updateNearBottomState}
            >
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                isLastNovaMsg={isLastNovaTyping && index === messages.length - 1}
                typewriterText={typewriterText}
                showNovaAvatar={shouldShowNovaAvatar(messages, index)}
                avatarPresentation={avatarPresentation}
                avatarTransition={index === messages.length - 1 ? avatarTransition : null}
                isCurrentDelivery={deliveryRuntime.activeMessageId === msg.id}
                currentSenderName={contactMeta.name}
                onImageClick={(img, cap) => setModalImage({ image: img, caption: cap })}
              />
            ))}

            {isTyping && (
              <RemoteTypingRow
                avatarPresentation={avatarPresentation}
                avatarTransition={avatarTransition}
                showAvatar={shouldShowTypingAvatar(messages)}
              />
            )}

            {messages.length > 0 && messages[messages.length - 1].type === 'end' && (
              <div className="flex justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-px bg-[#4A6C8C]/40" />
                  <span className="text-[#8B949E] text-xs tracking-wider">{t('game.commEnded')}</span>
                  <button type="button" onClick={finishRunToMenu} className="mt-4 text-sm text-[#F0A030] hover:underline">
                    {t('game.backToMenu')}
                  </button>
                </div>
              </div>
            )}

            {shouldShowMediaSafeSpace && <div className="media-choice-safe-space" aria-hidden />}
            <div ref={messagesEndRef} />
            </div>

            {showJumpBottom && (
              <button
                type="button"
                className="chat-jump-bottom"
                onClick={() => jumpToBottom(true)}
                aria-label={t('game.jumpToLatest')}
              >
                <span className="chat-jump-bottom-icon" aria-hidden />
              </button>
            )}
          </div>

          <footer className="game-footer shrink-0 px-3 sm:px-4 pt-2 border-t">
            {inputNode ? (
              <div className="flex gap-2">
                <input
                  value={playerInput}
                  onChange={e => {
                    const value = inputNode.inputMaxLength
                      ? e.target.value.slice(0, inputNode.inputMaxLength)
                      : e.target.value;
                    setPlayerInput(value);
                  }}
                  onFocus={() => jumpToBottom(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && isInputReady) handlePlayerInput();
                  }}
                  placeholder={inputNode.placeholder}
                  enterKeyHint="send"
                  autoComplete="off"
                  maxLength={inputNode.inputMaxLength}
                  autoFocus={inputNode.inputAutoFocus}
                  className="mobile-input flex-1 rounded-lg bg-[#0B0E14] border border-[#2A3550] px-4 py-2.5 text-[#E2E8F0] outline-none focus:border-[#F0A030]"
                />
                <button
                  type="button"
                  onClick={handlePlayerInput}
                  disabled={!isInputReady}
                  className={`menu-btn shrink-0 px-4 py-2.5 rounded-lg bg-[#F0A030]/20 border border-[#F0A030]/50 text-[#F0A030] text-sm transition-colors ${isInputReady ? 'hover:bg-[#F0A030]/30' : 'opacity-50 cursor-not-allowed'}`}
                >
                  {t('game.send')}
                </button>
              </div>
            ) : waitPrompt ? (
              <button
                type="button"
                onClick={skipWaiting}
                className="chat-idle-bar chat-wait-bar w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left"
              >
                <span className="sync-signal-icon" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="chat-idle-text text-xs">{waitPrompt.label}</span>
                  <span className="chat-wait-hint">{waitPrompt.hint}</span>
                  <span className="chat-wait-progress" aria-hidden />
                </div>
              </button>
            ) : choices ? (
                <div className="choice-panel flex flex-col gap-1.5">
                  <p className="choice-prompt">{t('game.choicePrompt')}</p>
                  {choices.map((choice, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleChoice(choice)}
                      className="choice-reply-btn w-full text-left px-3 py-1.5 rounded-lg text-sm leading-snug"
                    >
                      {formatChoiceText(choice.text)}
                    </button>
                  ))}
                </div>
            ) : isFinished ? (
              <div className="chat-idle-bar chat-finished-bar flex items-center gap-3 px-3 py-2 rounded-lg">
                <div className="flex-1">
                  <span className="chat-idle-text text-xs">{t('game.finishedArchived')}</span>
                </div>
              </div>
            ) : isSignalActive ? (
              <div className="chat-idle-bar chat-sync-bar flex items-center gap-3 px-3 py-2 rounded-lg">
                <span className="sync-signal-icon" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <div className="flex-1">
                  <span className="chat-idle-text text-xs">{t('game.syncWaiting')}</span>
                  <span className="chat-sync-progress" aria-hidden />
                </div>
              </div>
            ) : (
              <div className="chat-idle-bar flex items-center gap-3 px-3 py-2 rounded-lg">
                <div className="flex-1">
                  <span className="chat-idle-text text-xs">{t('game.channelReady')}</span>
                </div>
              </div>
            )}
          </footer>
      </div>
    </div>
  );
}
