import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Archive, ArrowLeft, LogOut, SkipForward } from 'lucide-react';
import { type Choice, type StoryNode } from './story';
import { relocalizeChapterBanner, relocalizeDisplayMessages, useI18n } from '../i18n';
import type { Locale } from '../i18n';
import { resolveContactAvatar } from './assets';
import {
  clearSave,
  createSaveData,
  defaultContactStage,
  defaultStats,
  getPendingNodeIdAfterNode,
  getSaveTimeString,
  hasSaveFile,
  loadGame,
  resolveResumeNodeId,
  saveGame,
} from './storage';
import type {
  ContactStage,
  DisplayMessage,
  FinalFarewellVariant,
  GameScreen,
  GameStats,
  GlitchLevel,
  MemoryAnchorId,
  NovaEmotion,
  NovaHintStage,
  SpecialInteractionCompletion,
  SpecialInteractionKind,
} from './types';
import { StarBackground } from './components/StarBackground';
import { ImageModal } from './components/ImageModal';
import { ChatMessage } from './components/ChatMessage';
import { ChapterBanner, RemoteTypingRow } from './components/ChatPrimitives';
import { RestartDialog } from './components/RestartDialog';
import { MemoryArchiveOverlay } from './components/MemoryArchive';
import { GameTitle } from './components/GameTitle';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { getSaveProgressLabel } from './progress';
import { formatChoiceText, shouldShowNovaAvatar, shouldShowTypingAvatar } from './format';
import { determineEnding, resolveEndingStart } from './endings';
import { ANCHOR_ARCHIVE_IDS, getArchiveUnlocksForNode } from './archive';
import { SpecialInteractionOverlay } from './interactions/SpecialInteractionOverlay';
import {
  applyNova06OverrideCheckpoint,
  applySpecialInteractionCompletion,
  isSealableMemoryAnchor,
} from './interactions/logic';
import {
  getNova06CommsAftermath,
  NOVA06_BRIDGE_CHOICE_PREFIX,
} from './interactions/nova06CommsAftermath';

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

const CHAT_NEAR_BOTTOM_PX = 112;

type ActiveSignalGlitch = {
  level: GlitchLevel;
  tone: SignalGlitchTone;
  pulse: number;
  /** 短时间内重复触发时进入柔化模式：无雪花噪点，仅保留轻量扫线 */
  soft: boolean;
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

function clampStat(value: number): number {
  return Math.max(0, Math.min(6, value));
}

function getFinalFarewellVariant(choice: Choice): FinalFarewellVariant | undefined {
  if (choice.nextId === 'fin_correct1') return 'remembered_until_end';
  if (/^fin_wrong_/.test(choice.nextId)) return 'remembered_wrong';
  if (choice.nextId === 'fin_timeout1' || /^fin_timeout/.test(choice.nextId)) return 'forgetting_started';
  return undefined;
}

function getWaitConfig(node: StoryNode, t: Translate): WaitConfig | null {
  if (!node.nextId) return null;
  if (/^fin_|^normal_|^bad_/.test(node.id)) return null;

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
    return /^fin_|^bad_/.test(node.id) ? 3 : 1;
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

/** 两次全屏故障特效之间的最小间隔；期间的重复触发会被跳过或柔化 */
const SIGNAL_GLITCH_COOLDOWN_MS = 9000;

function isNovaSilentBeat(content: string): boolean {
  return /\.\.\.|silence|don't know|just |unless|seems|so |actually|maybe|perhaps|right\?|myself|remember/i.test(content);
}

function isNovaHesitationBeat(content: string): boolean {
  return /\.\.\.|silence|don't know|just |unless|seems|so |actually|maybe|perhaps|right\?|myself|remember/i.test(content);
}

function getNovaTypingLeadDelay(node: StoryNode): number {
  const explicitDelay = node.delay ?? 0;
  let delay = 900;

  if (explicitDelay >= 2500) delay = 1250;
  if (isNovaHesitationBeat(node.content)) delay = Math.max(delay, 1180);
  if (isNovaSilentBeat(node.content)) delay = Math.max(delay, 1550);
  if (/^fin_|^normal_|^bad_/.test(node.id)) delay = Math.max(delay, 1150);

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
  if (/^fin_|^normal_|^bad_/.test(node.id) && explicitDelay >= 700) delay = Math.max(delay, explicitDelay);

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
  const [novaEmotion, setNovaEmotion] = useState<NovaEmotion>('normal');
  const [signalGlitch, setSignalGlitch] = useState<ActiveSignalGlitch | null>(null);
  const [showChapterBanner, setShowChapterBanner] = useState<string | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [isTypewriterActive, setIsTypewriterActive] = useState(false);
  const [hasSave, setHasSave] = useState(() => hasSaveFile());
  const [saveTime, setSaveTime] = useState(() => getSaveTimeString());
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [contactStage, setContactStage] = useState<ContactStage>(defaultContactStage);
  const [inputNode, setInputNode] = useState<ActiveInputNode | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<StoryNode | null>(null);
  const [playerInput, setPlayerInput] = useState('');
  const [waitPrompt, setWaitPrompt] = useState<WaitPrompt | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSkippingToChoice, setIsSkippingToChoice] = useState(false);

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
  const signalGlitchTimeoutRef = useRef<number | null>(null);
  const signalGlitchPulseRef = useRef(0);
  const lastSignalGlitchRef = useRef({ at: 0, level: 0 });
  const skipToChoiceRef = useRef(false);
  const messagesRef = useRef(messages);
  const emotionRef = useRef(novaEmotion);
  const statsRef = useRef(stats);
  const contactStageRef = useRef(contactStage);
  const internalTestBootstrappedRef = useRef(false);
  const nova06BridgeRunRef = useRef(0);
  const nova06BridgeRef = useRef<{
    continueId: string;
    replies: Array<{ text: string; ack: string }>;
  } | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    emotionRef.current = novaEmotion;
  }, [novaEmotion]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    contactStageRef.current = contactStage;
  }, [contactStage]);

  useEffect(() => {
    setSaveTime(getSaveTimeString(t));
  }, [locale, t]);

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

  const cancelActiveSequence = useCallback(() => {
    queueRunIdRef.current += 1;
    nova06BridgeRunRef.current += 1;
    nova06BridgeRef.current = null;
    nodeQueueRef.current = [];
    skipToChoiceRef.current = false;
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
    if (signalGlitchTimeoutRef.current !== null) {
      window.clearTimeout(signalGlitchTimeoutRef.current);
      signalGlitchTimeoutRef.current = null;
    }
    setSignalGlitch(null);
    setIsSyncing(false);
    setIsSkippingToChoice(false);
    setActiveInteraction(null);
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
    setScreen('menu');
  }, [cancelActiveSequence, t]);

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
    if (screen !== 'playing') return undefined;
    const frame = window.requestAnimationFrame(() => jumpToBottom(false));
    return () => window.cancelAnimationFrame(frame);
  }, [screen, jumpToBottom]);

  useVisualViewport(() => {
    if (isNearBottomRef.current) jumpToBottom(false);
    else updateNearBottomState();
  });

  const persistState = useCallback((pendingNodeId: string, msgs: DisplayMessage[]) => {
    saveGame(createSaveData(pendingNodeId, msgs, emotionRef.current, contactStageRef.current, statsRef.current));
    setHasSave(true);
    setSaveTime(t('saveTime.justNow'));
  }, [t]);

  const updateInteractionRuntimeStats = useCallback((
    updater: (current: GameStats) => GameStats,
  ) => {
    const current = statsRef.current;
    const next = updater(current);
    if (next === current) return;
    statsRef.current = next;
    setStats(next);
    if (activeInteraction) persistState(activeInteraction.id, messagesRef.current);
  }, [activeInteraction, persistState]);

  const handleInteractionGuidanceStageChange = useCallback((
    kind: SpecialInteractionKind,
    stage: NovaHintStage,
  ) => {
    updateInteractionRuntimeStats(current => {
      if (current.novaHintInteractionKind === kind && current.novaHintStage >= stage) return current;
      return { ...current, novaHintInteractionKind: kind, novaHintStage: stage };
    });
  }, [updateInteractionRuntimeStats]);

  const handleNova06OverrideStarted = useCallback((kind: SpecialInteractionKind) => {
    updateInteractionRuntimeStats(current => ({
      ...current,
      novaHintInteractionKind: kind,
      novaHintStage: 3,
      nova06OverrideTriggered: true,
      nova06FirstOverrideSeen: true,
    }));
  }, [updateInteractionRuntimeStats]);

  const handleNova06ScriptApplied = useCallback((kind: SpecialInteractionKind) => {
    updateInteractionRuntimeStats(current => applyNova06OverrideCheckpoint(current, kind));
  }, [updateInteractionRuntimeStats]);

  const handleMemoryNova06NoteSeen = useCallback(() => {
    updateInteractionRuntimeStats(current => current.memoryNova06NoteSeen
      ? current
      : {
        ...current,
        novaHintInteractionKind: 'memory-seal',
        novaHintStage: 3,
        nova06OverrideTriggered: true,
        memoryNova06NoteSeen: true,
      });
  }, [updateInteractionRuntimeStats]);

  const waitForPlayback = useCallback((duration: number): Promise<void> => {
    if (duration <= 0 || skipToChoiceRef.current) return Promise.resolve();

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
    if (skipToChoiceRef.current) {
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
    if (!INTERNAL_TEST_SKIP_ENABLED || choices || inputNode || activeInteraction || messagesRef.current.some(message => message.type === 'end')) return;
    skipToChoiceRef.current = true;
    setIsSkippingToChoice(true);
    setWaitPrompt(null);
    setIsTyping(false);
    delayResolverRef.current?.();
    waitResolverRef.current?.('fast-forward');
  }, [activeInteraction, choices, inputNode]);

  const triggerSignalGlitch = useCallback((node: StoryNode) => {
    const level = getSignalGlitchLevel(node);
    if (!level) return;

    // 冷却窗口内：同级/更低级的重复故障直接跳过，避免连续花屏刺眼
    const now = Date.now();
    const sinceLast = now - lastSignalGlitchRef.current.at;
    const inCooldown = sinceLast < SIGNAL_GLITCH_COOLDOWN_MS;
    if (inCooldown && level <= lastSignalGlitchRef.current.level) return;
    const soft = inCooldown;
    lastSignalGlitchRef.current = { at: now, level };

    if (signalGlitchTimeoutRef.current !== null) {
      window.clearTimeout(signalGlitchTimeoutRef.current);
      signalGlitchTimeoutRef.current = null;
    }

    const tone = getSignalGlitchTone(node.content);
    signalGlitchPulseRef.current += 1;
    setSignalGlitch({ level, tone, pulse: signalGlitchPulseRef.current, soft });
    if (!soft && tone === 'error' && 'vibrate' in navigator) {
      navigator.vibrate(level === 3 ? [18, 28, 24] : 18);
    }

    signalGlitchTimeoutRef.current = window.setTimeout(() => {
      signalGlitchTimeoutRef.current = null;
      setSignalGlitch(null);
    }, getSignalGlitchDuration(level, tone, node.content));
  }, []);

  const addMessage = useCallback((msg: DisplayMessage) => {
    const next = [...messagesRef.current, msg];
    messagesRef.current = next;
    setMessages(next);
    return next;
  }, []);

  const unlockArchives = useCallback((entryIds: string | string[]) => {
    const ids = Array.isArray(entryIds) ? entryIds : [entryIds];
    const normalized = [...new Set(ids.filter(Boolean))];
    if (normalized.length === 0) return false;

    const current = statsRef.current;
    const existingArchives = new Set(current.unlockedArchives);
    const existingEndings = new Set(current.endingsUnlocked);
    let changed = false;

    normalized.forEach(id => {
      if (!existingArchives.has(id)) {
        existingArchives.add(id);
        changed = true;
      }
      if ((id === 'ending_true' || id === 'ending_normal' || id === 'ending_bad') && !existingEndings.has(id)) {
        existingEndings.add(id);
        changed = true;
      }
    });

    if (!changed) return false;
    const nextStats: GameStats = {
      ...current,
      unlockedArchives: [...existingArchives],
      endingsUnlocked: [...existingEndings],
    };
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
        contactStage: contactStageRef.current,
        isNew: true,
        uiKind: 'memoryRecorded',
        memoryAnchor: anchor,
      });
      persistState(pendingNodeId, nextMessages);
    },
    [addMessage, memoryAnchorLabels, persistState, t],
  );

  const processSingleNode = useCallback(
    async (nodeId: string, runId: number): Promise<boolean> => {
      const isCurrentRun = () => queueRunIdRef.current === runId;
      if (!isCurrentRun()) return false;

      const node = storyNodeMap.get(nodeId);
      if (!node) return false;
      const nodeArchiveUnlocks = getArchiveUnlocksForNode(node);

      if (node.requiresAnchor && !statsRef.current.memoryAnchors.includes(node.requiresAnchor)) {
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
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
        addMessage({
          id: `${node.id}_${Date.now()}`,
          speaker: 'system',
          type: 'end',
          content: '',
          contactStage: contactStageRef.current,
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
              contactStage: contactStageRef.current,
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
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'typing') {
        setIsTyping(true);
        await waitForPlayback(node.delay || 2000);
        if (!isCurrentRun()) return false;
        setIsTyping(false);
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
        emotion: node.emotion,
        image: node.image,
        contactStage: contactStageRef.current,
        displayName: node.displayName,
        avatarProfile: node.avatarProfile,
        isGlitch: node.isGlitch,
        glitchLevel: node.glitchLevel ?? signalGlitchLevel ?? undefined,
        isNew: true,
        sourceNodeId: node.id,
      };

      if (node.speaker === 'nova' && node.emotion) {
        setNovaEmotion(node.emotion);
        emotionRef.current = node.emotion;
      }
      if (node.speaker === 'nova' && node.isGlitch) {
        setNovaEmotion('glitch');
        emotionRef.current = 'glitch';
      }

      if (node.speaker === 'nova' && node.type === 'text' && !node.isGlitch) {
        setIsTyping(true);
        await waitForPlayback(getNovaTypingLeadDelay(node));
        if (!isCurrentRun()) return false;
        setIsTyping(false);

        const currentMsgs = addMessage(displayMsg);
        unlockArchives(nodeArchiveUnlocks);

        setIsTypewriterActive(true);
        const text = node.content;
        setTypewriterText('');
        for (let i = 1; i <= text.length; i++) {
          if (!isCurrentRun()) return false;
          if (skipToChoiceRef.current) {
            setTypewriterText(text);
            break;
          }
          setTypewriterText(text.slice(0, i));
          await waitForPlayback(getNovaCharacterDelay(text, i - 1));
        }
        setIsTypewriterActive(false);
        setTypewriterText('');

        setTimeout(() => {
          setMessages(prev => prev.map(m => (m.id === displayMsg.id ? { ...m, isNew: false } : m)));
        }, 500);

        persistState(getPendingNodeIdAfterNode(nodeId), currentMsgs);
        await waitForPlayback(getNovaPostMessageDelay(node));
        if (!isCurrentRun()) return false;
      } else {
        const currentMsgs = addMessage(displayMsg);
        unlockArchives(nodeArchiveUnlocks);

        setTimeout(() => {
          setMessages(prev => prev.map(m => (m.id === displayMsg.id ? { ...m, isNew: false } : m)));
        }, 500);

        if (
          node.type === 'status' ||
          node.type === 'timestamp' ||
          node.type === 'image' ||
          node.type === 'file' ||
          node.type === 'draft' ||
          node.type === 'epilogue' ||
          node.type === 'ending-action' ||
          nodeArchiveUnlocks.length > 0
        ) {
          persistState(getPendingNodeIdAfterNode(nodeId), currentMsgs);
        }

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
            contactStage: contactStageRef.current,
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
    [addMessage, persistState, saveMemoryAnchor, stopFastForwardAtInteraction, storyNodeMap, t, triggerSignalGlitch, unlockArchives, waitForPlayback, waitForSignal],
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

    messagesRef.current = [];
    statsRef.current = testStats;
    emotionRef.current = 'normal';
    contactStageRef.current = 'verified';
    setMessages([]);
    setStats(testStats);
    setNovaEmotion('normal');
    setContactStage('verified');
    setScreen('playing');
    startSequence(INTERNAL_TEST_NODE_ID);
  }, [cancelActiveSequence, startSequence, storyNodeMap]);

  const startGame = useCallback(
    (mode: 'new' | 'continue') => {
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
      setActiveInteraction(null);

      if (mode === 'continue') {
        const save = loadGame();
        if (save) {
          const localizedMessages = relocalizeDisplayMessages(
            save.messages,
            storyNodeMap,
            t,
            memoryAnchorLabels,
          );
          messagesRef.current = localizedMessages;
          emotionRef.current = save.novaEmotion;
          statsRef.current = save.stats;
          contactStageRef.current = save.contactStage;
          setMessages(localizedMessages);
          setNovaEmotion(save.novaEmotion);
          setStats(save.stats);
          setContactStage(save.contactStage);
          setScreen('playing');

          const lastMsg = save.messages[save.messages.length - 1];
          if (lastMsg?.type === 'end') {
            return;
          }

          const resumeId = resolveResumeNodeId(save);
          const resumeNode = storyNodeMap.get(resumeId);
          if (resumeNode?.type === 'choice') {
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
      messagesRef.current = [];
      emotionRef.current = 'normal';
      contactStageRef.current = defaultContactStage;
      setMessages([]);
      setNovaEmotion('normal');
      setContactStage(defaultContactStage);
      setStats(defaultStats);
      statsRef.current = defaultStats;
      setInputNode(null);
      setPlayerInput('');
      setWaitPrompt(null);
      setActiveInteraction(null);
      setShowArchive(false);
      setScreen('playing');
      startSequence('p0');
    },
    [cancelActiveSequence, memoryAnchorLabels, scheduleSequence, startSequence, storyNodeMap, t],
  );

  const handleSpecialInteractionComplete = useCallback(
    (completion: SpecialInteractionCompletion) => {
      if (!activeInteraction) return;
      const nextStats = applySpecialInteractionCompletion(statsRef.current, completion);
      statsRef.current = nextStats;
      setStats(nextStats);

      const nextId = activeInteraction.interactionNextIds?.[completion.routeKey]
        ?? activeInteraction.nextId
        ?? activeInteraction.id;
      setActiveInteraction(null);

      const aftermath = getNova06CommsAftermath(completion, locale);
      if (!aftermath) {
        persistState(nextId, messagesRef.current);
        scheduleSequence(nextId, 350);
        return;
      }

      const bridgeRunId = ++nova06BridgeRunRef.current;
      persistState(nextId, messagesRef.current);
      jumpToBottom();

      void (async () => {
        setNovaEmotion('normal');
        for (let index = 0; index < aftermath.reactions.length; index += 1) {
          if (nova06BridgeRunRef.current !== bridgeRunId) return;
          setIsTyping(true);
          await waitForPlayback(520);
          if (nova06BridgeRunRef.current !== bridgeRunId) return;
          setIsTyping(false);
          const updated = addMessage({
            id: `nova06_react_${Date.now()}_${index}`,
            speaker: 'nova',
            type: 'text',
            content: aftermath.reactions[index],
            emotion: 'normal',
            contactStage: contactStageRef.current,
            isNew: true,
          });
          persistState(nextId, updated);
          jumpToBottom();
          await waitForPlayback(360);
        }

        if (nova06BridgeRunRef.current !== bridgeRunId) return;

        if (aftermath.replies && aftermath.replies.length > 0) {
          nova06BridgeRef.current = {
            continueId: nextId,
            replies: aftermath.replies,
          };
          setChoiceNodeId(NOVA06_BRIDGE_CHOICE_PREFIX);
          setChoices(aftermath.replies.map((reply, index) => ({
            text: reply.text,
            nextId: `${NOVA06_BRIDGE_CHOICE_PREFIX}${index}`,
            statEffect: 'none' as const,
          })));
          return;
        }

        scheduleSequence(nextId, 350);
      })();
    },
    [activeInteraction, addMessage, jumpToBottom, locale, persistState, scheduleSequence, waitForPlayback],
  );

  const saveInteractionAndExit = useCallback(() => {
    if (activeInteraction) {
      persistState(activeInteraction.id, messagesRef.current);
    }
    goToMenu();
  }, [activeInteraction, goToMenu, persistState]);

  const applyChoiceEffects = useCallback((choice: Choice) => {
    const current = statsRef.current;
    const next: GameStats = {
      ...current,
      memoryAnchors: [...current.memoryAnchors],
      unlockedArchives: [...current.unlockedArchives],
      endingsUnlocked: [...current.endingsUnlocked],
    };

    const shouldApplyStatEffects = choice.statEffect !== 'none';
    if (shouldApplyStatEffects) {
      next.trust = clampStat(next.trust + (choice.trustDelta ?? 0));
      next.memory = clampStat(next.memory + (choice.memoryDelta ?? 0));
      next.attachment = clampStat(next.attachment + (choice.attachmentDelta ?? 0));
    }
    if (choice.acceptFarewell !== undefined) {
      next.acceptFarewell = choice.acceptFarewell;
    } else if (choice.nextId === 'FINALE_DECISION_END') {
      next.acceptFarewell = true;
    }
    if (choice.finalChoice) {
      next.finalChoice = choice.finalChoice;
    } else if (choice.nextId === 'FINALE_DECISION_END') {
      next.finalChoice = 'accept_farewell';
    } else if (choice.nextId === 'BAD_END_START') {
      next.finalChoice = 'refuse_farewell';
    }
    if (next.finalChoice === 'refuse_farewell') {
      next.acceptFarewell = false;
    }
    const finalFarewellVariant = getFinalFarewellVariant(choice);
    if (finalFarewellVariant) {
      next.finalFarewellVariant = finalFarewellVariant;
    }
    if (choice.finalFarewellTone) {
      next.finalFarewellTone = choice.finalFarewellTone;
    }
    if (choice.timedResponse) {
      next.timedResponse = choice.timedResponse;
    }
    if (choice.timedProof) {
      next.timedProof = choice.timedProof;
    }
    const isFinalDecision =
      choice.nextId === 'FINALE_DECISION_END' ||
      choice.nextId === 'BAD_END_START' ||
      choice.acceptFarewell !== undefined ||
      choice.finalChoice !== undefined;
    if (isFinalDecision) {
      next.ending = determineEnding(next);
    }

    statsRef.current = next;
    setStats(next);
    return next;
  }, []);

  const handleChoice = useCallback(
    (choice: Choice) => {
      if (choiceTimeoutRef.current !== null) {
        window.clearTimeout(choiceTimeoutRef.current);
        choiceTimeoutRef.current = null;
      }
      const fromNodeId = choiceNodeId;
      const choiceIndex =
        fromNodeId && choices
          ? choices.findIndex(item => item === choice || (item.text === choice.text && item.nextId === choice.nextId))
          : -1;
      setChoices(null);
      setChoiceNodeId(null);

      const isNova06Bridge = choice.nextId.startsWith(NOVA06_BRIDGE_CHOICE_PREFIX);
      const bridgePending = isNova06Bridge ? nova06BridgeRef.current : null;
      if (isNova06Bridge) {
        nova06BridgeRef.current = null;
      }

      const nextStats = isNova06Bridge ? statsRef.current : applyChoiceEffects(choice);
      const nextId = isNova06Bridge && bridgePending
        ? bridgePending.continueId
        : resolveEndingStart(choice.nextId, nextStats);

      const playerMsg: DisplayMessage = {
        id: `player_${Date.now()}`,
        speaker: 'player',
        type: 'text',
        content: formatChoiceText(choice.text),
        contactStage: contactStageRef.current,
        isNew: true,
        sourceNodeId: fromNodeId ?? undefined,
        sourceChoiceIndex: choiceIndex >= 0 ? choiceIndex : undefined,
      };
      const updated = [...messagesRef.current, playerMsg];
      messagesRef.current = updated;
      setMessages(updated);
      persistState(nextId, updated);
      jumpToBottom();

      if (isNova06Bridge && bridgePending) {
        const replyIndex = Number(choice.nextId.slice(NOVA06_BRIDGE_CHOICE_PREFIX.length));
        const ack = bridgePending.replies[replyIndex]?.ack ?? '';
        const ackLines = ack.split('\n').map(line => line.trim()).filter(Boolean);
        const bridgeRunId = ++nova06BridgeRunRef.current;
        void (async () => {
          for (let index = 0; index < ackLines.length; index += 1) {
            if (nova06BridgeRunRef.current !== bridgeRunId) return;
            setIsTyping(true);
            await waitForPlayback(420);
            if (nova06BridgeRunRef.current !== bridgeRunId) return;
            setIsTyping(false);
            const withAck = addMessage({
              id: `nova06_ack_${Date.now()}_${index}`,
              speaker: 'nova',
              type: 'text',
              content: ackLines[index],
              emotion: 'normal',
              contactStage: contactStageRef.current,
              isNew: true,
            });
            persistState(nextId, withAck);
            jumpToBottom();
            await waitForPlayback(280);
          }
          if (nova06BridgeRunRef.current !== bridgeRunId) return;
          scheduleSequence(nextId, 400);
        })();
        return;
      }

      scheduleSequence(nextId, 550);
    },
    [addMessage, applyChoiceEffects, choiceNodeId, choices, persistState, scheduleSequence, jumpToBottom, waitForPlayback],
  );

  const handleChoiceTimeout = useCallback(
    (node: StoryNode) => {
      if (!node.timeoutNextId) return;
      setChoices(null);
      setChoiceNodeId(null);

      const current = statsRef.current;
      const nextStats: GameStats = {
        ...current,
        memoryAnchors: [...current.memoryAnchors],
        unlockedArchives: [...current.unlockedArchives],
        endingsUnlocked: [...current.endingsUnlocked],
      };
      if (node.id === 'fin_last6') {
        nextStats.finalFarewellVariant = 'forgetting_started';
      }
      statsRef.current = nextStats;
      setStats(nextStats);

      const updated = node.id === 'fin_last6'
        ? addMessage({
          id: `choice_timeout_${node.id}_${Date.now()}`,
          speaker: 'system',
          type: 'status',
          content: t('game.choiceTimeout'),
          contactStage: contactStageRef.current,
          isNew: true,
          uiKind: 'choiceTimeout',
          sourceNodeId: node.id,
        })
        : messagesRef.current;
      persistState(node.timeoutNextId, updated);
      jumpToBottom();
      scheduleSequence(node.timeoutNextId, 550);
    },
    [addMessage, persistState, scheduleSequence, jumpToBottom, t],
  );

  useEffect(() => {
    if (!choices || !choiceNodeId) return undefined;
    const node = storyNodeMap.get(choiceNodeId);
    if (!node?.choiceTimeoutMs || !node.timeoutNextId) return undefined;

    if (choiceTimeoutRef.current !== null) {
      window.clearTimeout(choiceTimeoutRef.current);
    }
    choiceTimeoutRef.current = window.setTimeout(() => {
      choiceTimeoutRef.current = null;
      handleChoiceTimeout(node);
    }, node.choiceTimeoutMs);

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
      persistState(node.timeoutNextId, messagesRef.current);
      jumpToBottom();
      scheduleSequence(node.timeoutNextId, 550);
    },
    [persistState, scheduleSequence, jumpToBottom],
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
      contactStage: contactStageRef.current,
      isNew: true,
    };
    const updated = [...messagesRef.current, playerMsg];
    messagesRef.current = updated;
    setMessages(updated);
    setInputNode(null);
    setPlayerInput('');
    persistState(nextId, updated);
    jumpToBottom(true);
    scheduleSequence(nextId, 400);
  }, [inputNode, jumpToBottom, persistState, playerInput, scheduleSequence]);

  const lastMsg = messages[messages.length - 1];
  const isLastNovaTyping =
    isTypewriterActive && lastMsg && lastMsg.speaker === 'nova' && lastMsg.type === 'text';
  const isInputReady = !inputNode?.inputMinLength || playerInput.trim().length >= inputNode.inputMinLength;

  const saveSnapshot = hasSave ? loadGame() : null;
  const saveProgress = saveSnapshot
    ? getSaveProgressLabel(saveSnapshot.pendingNodeId, saveSnapshot.messages, t)
    : t('progress.prologue');
  const menuContactStage = saveSnapshot?.contactStage ?? defaultContactStage;
  const contactMeta = contactMetaByStage[contactStage];
  const contactAvatar = resolveContactAvatar(contactStage, novaEmotion);
  const isEpilogueMode = messages.some(message => message.type === 'epilogue');
  const isFinished = messages.some(message => message.type === 'end');
  const isSignalActive = isSyncing || isTyping || isTypewriterActive;
  const shouldShowMediaSafeSpace = Boolean(choices && hasRecentMediaMessage(messages));

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
            <small>PHASE-LINK / 07</small>
          </div>
          <span className="menu-topbar-code">OBSERVER-01 / LOCAL INDEX</span>
        </div>
        <main className="menu-stage relative z-10">
          <section className="menu-primary-zone animate-fade-in">
            <GameTitle
              title={t('menu.title')}
              subtitle={t('menu.subtitle')}
              phaseLabel={t('menu.phaseArchive')}
            />
            <div className="menu-language-selector" role="group" aria-label={t('menu.language')}>
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
            </div>
            <nav className="menu-command-list" aria-label={t('menu.commandAria')}>
              {hasSave ? (
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
                <button
                  type="button"
                  onClick={() => startGame('new')}
                  className="menu-command menu-command-primary"
                >
                  <span aria-hidden="true" className="menu-command-corner menu-command-corner-left" />
                  <strong>{t('menu.connect')}</strong>
                  <span aria-hidden="true" className="menu-command-corner menu-command-corner-right" />
                </button>
              )}
            </nav>
          </section>
        </main>
        <footer className="menu-footer relative z-10">
          <div className="menu-footer-status">
            <span className="menu-footer-dot" aria-hidden="true" />
            <div>
              <span>{t('menu.memoryStandby')}</span>
              <small>{t('menu.protocolTagline')}</small>
            </div>
          </div>
        </footer>
        {showArchive && (
          <MemoryArchiveOverlay
            stats={saveSnapshot?.stats ?? stats}
            contactStage={menuContactStage}
            onClose={() => setShowArchive(false)}
            backLabel={t('archiveOverlay.backToMenu')}
          />
        )}
        {showRestartConfirm && (
          <RestartDialog
            onCancel={() => setShowRestartConfirm(false)}
            onConfirm={() => {
              clearSave();
              setHasSave(false);
              setStats(defaultStats);
              setShowRestartConfirm(false);
              startGame('new');
            }}
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
          className={`signal-glitch-layer signal-glitch-level-${signalGlitch.level} signal-glitch-${signalGlitch.tone} ${
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
          onClose={() => setShowArchive(false)}
        />
      )}
      {activeInteraction && (
        <SpecialInteractionOverlay
          node={activeInteraction}
          locale={locale}
          sealedAnchor={stats.temporaryAnchorSealed}
          nova06FirstOverrideSeen={stats.nova06FirstOverrideSeen}
          novaHintStage={stats.novaHintStage}
          novaHintInteractionKind={stats.novaHintInteractionKind}
          passwordBypassedByNova06={stats.passwordBypassedByNova06}
          signalCompletedByNova06={stats.signalCompletedByNova06}
          powerCompletedByNova06={stats.powerCompletedByNova06}
          memoryNova06NoteSeen={stats.memoryNova06NoteSeen}
          onGuidanceStageChange={handleInteractionGuidanceStageChange}
          onNova06OverrideStarted={handleNova06OverrideStarted}
          onNova06ScriptApplied={handleNova06ScriptApplied}
          onMemoryNova06NoteSeen={handleMemoryNova06NoteSeen}
          onComplete={handleSpecialInteractionComplete}
          onSaveAndExit={saveInteractionAndExit}
        />
      )}

      <div
        className={`game-layout relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-[1160px] mx-auto bg-[#080A0D]/84 backdrop-blur-sm ${
          signalGlitch ? `signal-glitch-frame signal-glitch-frame-level-${signalGlitch.level}` : ''
        }`}
      >
          <header className="game-header chat-header flex items-center gap-3 px-3 sm:px-4 py-3 bg-[#151A26]/92 border-b border-[#1A2236]/80 shrink-0">
            {isEpilogueMode ? (
              <>
                <div className="epilogue-header-mark" aria-hidden />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[#E8EEF4] text-[15px] font-medium leading-tight">{t('game.epilogueTitle')}</span>
                  <span className="text-[#6E8498] text-[11px] leading-snug truncate">{t('game.epilogueSubtitle')}</span>
                </div>
              </>
            ) : (
              <>
                <div className="relative shrink-0">
                  <img
                    src={contactAvatar}
                    alt={contactMeta.name}
                    className={`nova-header-avatar ${signalGlitch ? `signal-glitch-avatar signal-glitch-avatar-${signalGlitch.tone}` : ''}`}
                  />
                  <span className="contact-status-dot" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[#E8EEF4] text-[15px] font-medium leading-tight">{contactMeta.name}</span>
                  <span className="text-[#6E8498] text-[11px] leading-snug truncate">{contactMeta.subtitle}</span>
                </div>
              </>
              )}
              <div className="chat-link-readout" aria-hidden="true">
                <span>LINK / 07</span>
                <span className="chat-link-bars"><i /><i /><i /><i /></span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {INTERNAL_TEST_SKIP_ENABLED && !activeInteraction && (
                <button
                  type="button"
                  onClick={skipToNextChoice}
                  className={`header-tool-btn internal-skip-btn text-[11px] px-2.5 py-1.5 rounded transition-colors ${isSkippingToChoice ? 'internal-skip-btn-active' : ''}`}
                  disabled={Boolean(choices || inputNode || activeInteraction || isFinished)}
                  title="Internal test: skip to next choice/input"
                  aria-label={isSkippingToChoice ? t('game.skipping') : t('game.skip')}
                >
                  <SkipForward size={14} strokeWidth={1.7} aria-hidden="true" />
                  <span className="header-btn-label">{isSkippingToChoice ? t('game.skipping') : t('game.skip')}</span>
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
                aria-label={isEpilogueMode ? t('game.back') : t('game.disconnect')}
                title={isEpilogueMode ? t('game.back') : t('game.disconnect')}
              >
                {isEpilogueMode ? (
                  <ArrowLeft size={14} strokeWidth={1.7} aria-hidden="true" />
                ) : (
                  <LogOut size={14} strokeWidth={1.7} aria-hidden="true" />
                )}
                <span className="header-btn-label">{isEpilogueMode ? t('game.back') : t('game.disconnect')}</span>
              </button>
            </div>
          </header>

          <div className="game-chat-shell">
            <div
              ref={chatScrollRef}
              className={`game-chat chat-scroll flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 space-y-0 ${
                signalGlitch ? `signal-glitch-chat signal-glitch-chat-level-${signalGlitch.level}` : ''
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
                currentContactStage={contactStage}
                onImageClick={(img, cap) => setModalImage({ image: img, caption: cap })}
              />
            ))}

            {choiceNodeId === 'p4' && choices && (
              <div className="comm-connect-inline animate-fade-in">
                <div className="flex flex-col items-end gap-2 mt-2">
                  {choices.map((choice, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleChoice(choice)}
                      className={
                        i === 0
                          ? 'comm-connect-inline-btn menu-btn px-5 py-2.5 rounded-lg text-sm tracking-widest'
                          : 'comm-connect-secondary menu-btn px-4 py-2 rounded-lg text-xs tracking-wide'
                      }
                    >
                      {formatChoiceText(choice.text)}
                    </button>
                  ))}
                </div>
                <p className="comm-risk-hint text-right mt-2 pr-1">{t('game.commConnectHint')}</p>
              </div>
            )}

            {isTyping && (
              <RemoteTypingRow
                avatarSrc={resolveContactAvatar(contactStage, novaEmotion)}
                showAvatar={shouldShowTypingAvatar(messages)}
              />
            )}

            {messages.length > 0 && messages[messages.length - 1].type === 'end' && (
              <div className="flex justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-px bg-[#4A6C8C]/40" />
                  <span className="text-[#8B949E] text-xs tracking-wider">{t('game.commEnded')}</span>
                  <button type="button" onClick={goToMenu} className="mt-4 text-sm text-[#F0A030] hover:underline">
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
            ) : choices && choiceNodeId !== 'p4' ? (
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
            ) : choiceNodeId === 'p4' && choices ? (
              <div className="chat-idle-bar flex items-center gap-3 px-3 py-2 rounded-lg">
                <div className="flex-1">
                  <span className="chat-idle-text text-xs">{t('game.waitingProtocol')}</span>
                </div>
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
