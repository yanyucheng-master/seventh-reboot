import { useState, useEffect, useRef, useCallback } from 'react';
import { storyNodeMap, type Choice, type StoryNode } from './story';
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
import type { ContactStage, DisplayMessage, FinalFarewellVariant, GameScreen, GameStats, GlitchLevel, MemoryAnchorId, NovaEmotion } from './types';
import { StarBackground } from './components/StarBackground';
import { ImageModal } from './components/ImageModal';
import { ChatMessage } from './components/ChatMessage';
import { ChapterBanner, RemoteTypingRow } from './components/ChatPrimitives';
import { RestartDialog } from './components/RestartDialog';
import { MemoryArchiveOverlay } from './components/MemoryArchive';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { getSaveProgressLabel } from './progress';
import { formatChoiceText, shouldShowNovaAvatar, shouldShowTypingAvatar } from './format';
import { determineEnding, resolveEndingStart } from './endings';
import { ANCHOR_ARCHIVE_IDS, getArchiveUnlocksForNode } from './archive';

const MEMORY_ANCHOR_LABELS: Record<MemoryAnchorId, string> = {
  n7: 'N7',
  milk_candy: '牛奶糖',
  white_flower: '小白花',
  first_message: '第一次通讯',
  goodnight: '晚安',
  observatory: '观测室',
  maintenance_board: '维修板',
  steak: '合成牛排',
};

const CONTACT_META: Record<ContactStage, { name: string; subtitle: string }> = {
  unknown: {
    name: '？？？',
    subtitle: '在线 · 信号微弱 · 未知通讯链路',
  },
  named: {
    name: 'Nova',
    subtitle: '在线 · 信号微弱 · Aurora 通讯链路',
  },
  verified: {
    name: 'Nova',
    subtitle: '在线 · 信号微弱 · Aurora 通讯链路',
  },
};

// INTERNAL TEST ONLY: set to false or remove this block before public release.
const INTERNAL_TEST_SKIP_ENABLED = true;

type WaitPrompt = {
  label: string;
  hint: string;
};

type WaitConfig = WaitPrompt & {
  duration: number;
};

type WaitResult = 'elapsed' | 'skipped' | 'fast-forward';

type SignalGlitchTone = 'error' | 'success' | 'neutral';

type ActiveSignalGlitch = {
  level: GlitchLevel;
  tone: SignalGlitchTone;
  pulse: number;
};

function clampStat(value: number): number {
  return Math.max(0, Math.min(6, value));
}

function getFinalFarewellVariant(choice: Choice): FinalFarewellVariant | undefined {
  if (choice.nextId === 'fin_correct1') return 'remembered_until_end';
  if (/^fin_wrong_/.test(choice.nextId)) return 'remembered_wrong';
  return undefined;
}

function getWaitConfig(node: StoryNode): WaitConfig | null {
  if (!node.nextId) return null;
  if (/^fin_|^normal_|^bad_/.test(node.id)) return null;

  if (node.type === 'status' && /Nova 已离线/.test(node.content)) {
    return {
      duration: 15000,
      label: 'Nova 离线中 · 等待消息',
      hint: '点击以推进时间',
    };
  }

  if (node.type === 'chapter') {
    return {
      duration: 12000,
      label: '章节信号同步中 · 等待消息',
      hint: '点击以推进时间',
    };
  }

  if (node.type === 'timestamp' && /深夜|凌晨/.test(node.content)) {
    return {
      duration: 10000,
      label: '信道保持中 · 等待夜间信号',
      hint: '点击以推进时间',
    };
  }

  if (node.type === 'delay' && (node.delay ?? 0) >= 5000) {
    return {
      duration: Math.min(node.delay ?? 10000, 15000),
      label: '信道保持中 · 等待消息',
      hint: '点击以推进时间',
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

function getMediaChoiceWaitConfig(): WaitConfig {
  return {
    duration: 5200,
    label: '图像信号稳定中 · 等待回复',
    hint: '点击查看回复',
  };
}

function getSignalGlitchLevel(node: StoryNode): GlitchLevel | null {
  if (node.glitchLevel) return node.glitchLevel;
  if (node.type === 'disconnect' || node.type === 'reconnectFailed' || node.type === 'signalError') return 2;
  if (/信号衰减|连接即将终止|通讯同步断开|文字传输不稳定|通讯丢包|回答超时|第八次重启/.test(node.content)) return 3;
  if (/第七协议关闭请求未完成|第七协议维持|第七协议关闭序列|UNKNOWN-06 信号中断/.test(node.content)) return 3;
  if (/通讯中断|信号中断|尝试重连|重连失败|请求被拒绝|倒计时/.test(node.content)) return 2;
  if (/第七协议/.test(node.content) && (node.type === 'status' || node.type === 'glitch')) return 2;
  if (/重连成功/.test(node.content)) return 1;
  if (node.type === 'glitch' || node.isGlitch) {
    return /^fin_|^bad_/.test(node.id) ? 3 : 1;
  }
  return null;
}

function getSignalGlitchTone(content: string): SignalGlitchTone {
  if (/重连成功|连接恢复|恢复正常/.test(content)) return 'success';
  if (/通讯中断|重连失败|信号衰减|连接即将终止|倒计时|请求被拒绝/.test(content)) return 'error';
  return 'neutral';
}

function getSignalGlitchDuration(level: GlitchLevel, tone: SignalGlitchTone, content: string): number {
  if (tone === 'success') return 980;
  if (/重连失败/.test(content)) return 1650;
  if (level === 3) return 2450;
  if (level === 2) return 1850;
  return 980;
}

function isNovaSilentBeat(content: string): boolean {
  const compact = content.trim().replace(/\s+/g, '');
  return /^(…+|。+|\.{2,}|▇+)$/.test(compact);
}

function isNovaHesitationBeat(content: string): boolean {
  return /……|沉默|不知道|只是|除非|像是|所以|其实|可能|也许|对吗|我自己|记不/.test(content);
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
  const [showSettings, setShowSettings] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [contactStage, setContactStage] = useState<ContactStage>(defaultContactStage);
  const [inputNode, setInputNode] = useState<{ id: string; nextId?: string; placeholder: string } | null>(null);
  const [playerInput, setPlayerInput] = useState('');
  const [waitPrompt, setWaitPrompt] = useState<WaitPrompt | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSkippingToChoice, setIsSkippingToChoice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nodeQueueRef = useRef<string[]>([]);
  const queueRunIdRef = useRef(0);
  const activeQueueRunIdRef = useRef<number | null>(null);
  const waitTimeoutRef = useRef<number | null>(null);
  const waitResolverRef = useRef<((result: WaitResult) => void) | null>(null);
  const delayResolverRef = useRef<(() => void) | null>(null);
  const choiceTimeoutRef = useRef<number | null>(null);
  const signalGlitchTimeoutRef = useRef<number | null>(null);
  const signalGlitchPulseRef = useRef(0);
  const skipToChoiceRef = useRef(false);
  const messagesRef = useRef(messages);
  const emotionRef = useRef(novaEmotion);
  const statsRef = useRef(stats);
  const contactStageRef = useRef(contactStage);

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

  const cancelActiveSequence = useCallback(() => {
    queueRunIdRef.current += 1;
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
    setSaveTime(getSaveTimeString());
    setScreen('menu');
  }, [cancelActiveSequence]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, choices, choiceNodeId, scrollToBottom]);

  useVisualViewport(scrollToBottom);

  const persistState = useCallback((pendingNodeId: string, msgs: DisplayMessage[]) => {
    saveGame(createSaveData(pendingNodeId, msgs, emotionRef.current, contactStageRef.current, statsRef.current));
    setHasSave(true);
    setSaveTime('刚刚');
  }, []);

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
    if (!INTERNAL_TEST_SKIP_ENABLED || choices || inputNode || messagesRef.current.some(message => message.type === 'end')) return;
    skipToChoiceRef.current = true;
    setIsSkippingToChoice(true);
    setWaitPrompt(null);
    setIsTyping(false);
    delayResolverRef.current?.();
    waitResolverRef.current?.('fast-forward');
  }, [choices, inputNode]);

  const triggerSignalGlitch = useCallback((node: StoryNode) => {
    const level = getSignalGlitchLevel(node);
    if (!level) return;

    if (signalGlitchTimeoutRef.current !== null) {
      window.clearTimeout(signalGlitchTimeoutRef.current);
      signalGlitchTimeoutRef.current = null;
    }

    const tone = getSignalGlitchTone(node.content);
    signalGlitchPulseRef.current += 1;
    setSignalGlitch({ level, tone, pulse: signalGlitchPulseRef.current });
    if (tone === 'error' && 'vibrate' in navigator) {
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
        content: `【Observer-01 已记录：${MEMORY_ANCHOR_LABELS[anchor]}】`,
        contactStage: contactStageRef.current,
        isNew: true,
      });
      persistState(pendingNodeId, nextMessages);
    },
    [addMessage, persistState],
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
      });
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'delay') {
        const waitConfig = getWaitConfig(node);
        if (waitConfig) {
          const result = await waitForSignal(waitConfig, runId);
          if (!isCurrentRun()) return false;
          if (result === 'skipped') {
            const currentMsgs = addMessage({
              id: `time_sync_${node.id}_${Date.now()}`,
              speaker: 'system',
              type: 'status',
              content: '【同步至下一条信号】',
              contactStage: contactStageRef.current,
              isNew: true,
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
        setInputNode({ id: node.id, nextId: node.nextId, placeholder: node.content || '输入你想说的话...' });
        setIsTyping(false);
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'choice' && node.choices) {
        if (hasRecentMediaMessage(messagesRef.current)) {
          await waitForSignal(getMediaChoiceWaitConfig(), runId);
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

      const waitConfig = getWaitConfig(node);
      if (waitConfig) {
        const result = await waitForSignal(waitConfig, runId);
        if (!isCurrentRun()) return false;
        if (result === 'skipped') {
          const currentMsgs = addMessage({
            id: `time_sync_${node.id}_${Date.now()}`,
            speaker: 'system',
            type: 'status',
            content: '【同步至下一条信号】',
            contactStage: contactStageRef.current,
            isNew: true,
          });
          persistState(getPendingNodeIdAfterNode(nodeId), currentMsgs);
        }
      }

      if (node.nextId) {
        nodeQueueRef.current.push(node.nextId);
      }
      return true;
    },
    [addMessage, persistState, saveMemoryAnchor, stopFastForwardAtInteraction, triggerSignalGlitch, unlockArchives, waitForPlayback, waitForSignal],
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

      if (mode === 'continue') {
        const save = loadGame();
        if (save) {
          messagesRef.current = save.messages;
          emotionRef.current = save.novaEmotion;
          statsRef.current = save.stats;
          contactStageRef.current = save.contactStage;
          setMessages(save.messages);
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
            setInputNode({
              id: resumeNode.id,
              nextId: resumeNode.nextId,
              placeholder: resumeNode.content || '输入你想说的话...',
            });
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
      setShowArchive(false);
      setScreen('playing');
      startSequence('p0');
    },
    [cancelActiveSequence, scheduleSequence, startSequence],
  );

  const applyChoiceEffects = useCallback((choice: Choice) => {
    const current = statsRef.current;
    const next: GameStats = {
      trust: current.trust,
      memory: current.memory,
      attachment: current.attachment,
      memoryAnchors: [...current.memoryAnchors],
      acceptFarewell: current.acceptFarewell,
      finalChoice: current.finalChoice,
      finalFarewellVariant: current.finalFarewellVariant,
      finalFarewellTone: current.finalFarewellTone,
      timedResponse: current.timedResponse,
      timedProof: current.timedProof,
      ending: current.ending,
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
      setChoices(null);
      setChoiceNodeId(null);
      const nextStats = applyChoiceEffects(choice);
      const nextId = resolveEndingStart(choice.nextId, nextStats);

      const playerMsg: DisplayMessage = {
        id: `player_${Date.now()}`,
        speaker: 'player',
      type: 'text',
      content: formatChoiceText(choice.text),
      contactStage: contactStageRef.current,
      isNew: true,
      };
      const updated = [...messagesRef.current, playerMsg];
      messagesRef.current = updated;
      setMessages(updated);
      persistState(nextId, updated);
      scrollToBottom();
      scheduleSequence(nextId, 550);
    },
    [applyChoiceEffects, persistState, scheduleSequence, scrollToBottom],
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
          content: '【Observer-01 记忆索引正在脱离】\n【回答超时】',
          contactStage: contactStageRef.current,
          isNew: true,
        })
        : messagesRef.current;
      persistState(node.timeoutNextId, updated);
      scrollToBottom();
      scheduleSequence(node.timeoutNextId, 550);
    },
    [addMessage, persistState, scheduleSequence, scrollToBottom],
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
  }, [choiceNodeId, choices, handleChoiceTimeout]);

  const handlePlayerInput = useCallback(() => {
    if (!inputNode) return;
    const text = playerInput.trim() || '......';
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
    persistState(inputNode.nextId ?? inputNode.id, updated);
    if (inputNode.nextId) scheduleSequence(inputNode.nextId, 400);
  }, [inputNode, persistState, playerInput, scheduleSequence]);

  const lastMsg = messages[messages.length - 1];
  const isLastNovaTyping =
    isTypewriterActive && lastMsg && lastMsg.speaker === 'nova' && lastMsg.type === 'text';

  const saveSnapshot = hasSave ? loadGame() : null;
  const saveProgress = saveSnapshot
    ? getSaveProgressLabel(saveSnapshot.pendingNodeId, saveSnapshot.messages)
    : '序章 · Observer-01 恢复';
  const menuNovaEmotion = saveSnapshot?.novaEmotion ?? 'normal';
  const menuContactStage = saveSnapshot?.contactStage ?? defaultContactStage;
  const contactMeta = CONTACT_META[contactStage];
  const contactAvatar = resolveContactAvatar(contactStage, novaEmotion);
  const isEpilogueMode = messages.some(message => message.type === 'epilogue');
  const isFinished = messages.some(message => message.type === 'end');
  const isSignalActive = isSyncing || isTyping || isTypewriterActive;
  const shouldShowMediaSafeSpace = Boolean(choices && hasRecentMediaMessage(messages));

  if (screen === 'menu') {
    return (
      <div className="app-shell game-shell menu-screen relative overflow-hidden">
        <StarBackground />
        <button
          type="button"
          onClick={() => setShowSettings(v => !v)}
          className="menu-settings-btn absolute z-20"
          aria-label="设置"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {showSettings && (
          <div className="menu-settings-panel absolute z-20">
            <p className="text-[#6B7A8F] text-[10px] tracking-widest uppercase mb-2">系统</p>
            {hasSave && (
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  setShowRestartConfirm(true);
                }}
                className="menu-settings-item"
              >
                重新开始
              </button>
            )}
            <button type="button" onClick={() => setShowSettings(false)} className="menu-settings-item">
              关闭
            </button>
          </div>
        )}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 min-h-0 w-full">
          <div className="flex flex-col items-center gap-7 animate-fade-in w-full max-w-xs">
            <div className="flex flex-col items-center gap-2.5 menu-title-block">
              <h1 className="menu-title text-[#E2E8F0]">第七次重启</h1>
              <p className="text-[#7A8FA8] text-xs sm:text-sm tracking-[0.35em] font-light">SEVENTH REBOOT</p>
            </div>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#3D7A9E]/60 to-transparent" />
            <div className="flex flex-col gap-2.5 w-full">
              {hasSave ? (
                <>
                  <button
                    type="button"
                    onClick={() => startGame('continue')}
                    className="menu-btn menu-btn-primary w-full px-6 py-3 rounded-lg text-[#E8F4FF] text-base tracking-widest"
                  >
                    继续接入
                  </button>
                  <div className="flex flex-col items-center gap-0.5 py-1">
                    <span className="text-[#6B7A8F] text-xs">上次连接：{saveTime}</span>
                    <span className="text-[#8B9CB0] text-xs">当前进度：{saveProgress}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRestartConfirm(true)}
                    className="menu-btn menu-btn-secondary w-full px-6 py-2.5 rounded-lg text-sm tracking-wider"
                  >
                    重新开始
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => startGame('new')}
                  className="menu-btn menu-btn-primary w-full px-6 py-3 rounded-lg text-[#E8F4FF] text-base tracking-widest"
                >
                  接入通讯
                </button>
              )}
            </div>
            <div className="flex flex-col items-center gap-2 mt-2">
              {hasSave && (
                <img
                  src={resolveContactAvatar(menuContactStage, menuNovaEmotion)}
                  alt=""
                  className="menu-nova-avatar w-7 h-7 rounded-full object-cover"
                />
              )}
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[#9AABB8] text-xs tracking-wide">Observer-01 记忆模块待命</span>
                <p className="text-[#5E6E82] text-[11px] font-light tracking-wide">
                  第七协议残留通讯 · 重启编号 07
                </p>
              </div>
            </div>
          </div>
        </div>
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
      <StarBackground />
      <div className="chat-atmosphere pointer-events-none" aria-hidden />
      {signalGlitch && (
        <div
          key={signalGlitch.pulse}
          className={`signal-glitch-layer signal-glitch-level-${signalGlitch.level} signal-glitch-${signalGlitch.tone}`}
          aria-hidden
        >
          <div className="signal-glitch-flash" />
          <div className="signal-glitch-vignette" />
          <div className="signal-glitch-noise" />
          <div className="signal-glitch-snow" />
          <div className="signal-glitch-scanlines" />
          <div className="signal-glitch-bands" />
          <div className="signal-glitch-ripple signal-glitch-ripple-a" />
          <div className="signal-glitch-ripple signal-glitch-ripple-b" />
          <div className="signal-glitch-line signal-glitch-line-a" />
          <div className="signal-glitch-line signal-glitch-line-b" />
          <div className="signal-glitch-line signal-glitch-line-c" />
          <div className="signal-glitch-line signal-glitch-line-d" />
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

      <div
        className={`game-layout relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-[1040px] mx-auto bg-[#0B0E14]/82 backdrop-blur-sm ${
          signalGlitch ? `signal-glitch-frame signal-glitch-frame-level-${signalGlitch.level}` : ''
        }`}
      >
          <header className="game-header chat-header flex items-center gap-3 px-3 sm:px-4 py-3 bg-[#151A26]/92 border-b border-[#1A2236]/80 shrink-0">
            {isEpilogueMode ? (
              <>
                <div className="epilogue-header-mark" aria-hidden />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[#E8EEF4] text-[15px] font-medium leading-tight">后记 / Epilogue</span>
                  <span className="text-[#6E8498] text-[11px] leading-snug truncate">Observer-01 已关闭 · 非通讯记录</span>
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
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4ADE80] border-2 border-[#151A26]" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[#E8EEF4] text-[15px] font-medium leading-tight">{contactMeta.name}</span>
                  <span className="text-[#6E8498] text-[11px] leading-snug truncate">{contactMeta.subtitle}</span>
                </div>
              </>
            )}
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {INTERNAL_TEST_SKIP_ENABLED && (
                <button
                  type="button"
                  onClick={skipToNextChoice}
                  className={`internal-skip-btn text-[11px] px-2.5 py-1.5 rounded transition-colors ${isSkippingToChoice ? 'internal-skip-btn-active' : ''}`}
                  disabled={Boolean(choices || inputNode || isFinished)}
                  title="内测限定：快进到下一个选项/交互节点"
                >
                  {isSkippingToChoice ? '快进中' : '跳过'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowArchive(true)}
                className="header-archive-btn text-[11px] px-2.5 py-1.5 rounded transition-colors"
              >
                档案
              </button>
              <button
                type="button"
                onClick={goToMenu}
                className="header-disconnect-btn text-[11px] px-2.5 py-1.5 rounded transition-colors"
              >
                {isEpilogueMode ? '返回' : '断开通讯'}
              </button>
            </div>
          </header>

          <div
            className={`game-chat chat-scroll flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 space-y-0 ${
              signalGlitch ? `signal-glitch-chat signal-glitch-chat-level-${signalGlitch.level}` : ''
            }`}
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
                <p className="comm-risk-hint text-right mt-2 pr-1">接入可能触发记忆偏移</p>
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
                  <span className="text-[#8B949E] text-xs tracking-wider">通讯结束</span>
                  <button type="button" onClick={goToMenu} className="mt-4 text-sm text-[#F0A030] hover:underline">
                    返回主菜单
                  </button>
                </div>
              </div>
            )}

            {shouldShowMediaSafeSpace && <div className="media-choice-safe-space" aria-hidden />}
            <div ref={messagesEndRef} />
          </div>

          <footer className="game-footer shrink-0 px-3 sm:px-4 pt-2 bg-[#151A26]/90 border-t border-[#1A2236]">
            {inputNode ? (
              <div className="flex gap-2">
                <input
                  value={playerInput}
                  onChange={e => setPlayerInput(e.target.value)}
                  onFocus={scrollToBottom}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handlePlayerInput();
                  }}
                  placeholder={inputNode.placeholder}
                  enterKeyHint="send"
                  autoComplete="off"
                  className="mobile-input flex-1 rounded-lg bg-[#0B0E14] border border-[#2A3550] px-4 py-2.5 text-[#E2E8F0] outline-none focus:border-[#F0A030]"
                />
                <button
                  type="button"
                  onClick={handlePlayerInput}
                  className="menu-btn shrink-0 px-4 py-2.5 rounded-lg bg-[#F0A030]/20 border border-[#F0A030]/50 text-[#F0A030] text-sm hover:bg-[#F0A030]/30 transition-colors"
                >
                  发送
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
                  <p className="choice-prompt">你可以回复：</p>
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
                  <span className="chat-idle-text text-xs">等待 Observer-01 接入第七协议……</span>
                </div>
              </div>
            ) : isFinished ? (
              <div className="chat-idle-bar chat-finished-bar flex items-center gap-3 px-3 py-2 rounded-lg">
                <div className="flex-1">
                  <span className="chat-idle-text text-xs">通讯已结束 · 记录已归档</span>
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
                  <span className="chat-idle-text text-xs">通讯同步中，请等待</span>
                  <span className="chat-sync-progress" aria-hidden />
                </div>
              </div>
            ) : (
              <div className="chat-idle-bar flex items-center gap-3 px-3 py-2 rounded-lg">
                <div className="flex-1">
                  <span className="chat-idle-text text-xs">信道已建立 · 等待消息</span>
                </div>
              </div>
            )}
          </footer>
      </div>
    </div>
  );
}
