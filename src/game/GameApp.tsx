import { useState, useEffect, useRef, useCallback } from 'react';
import { storyNodeMap, type Choice } from './story';
import { novaAvatar, resolveNovaAvatar } from './assets';
import {
  clearSave,
  createSaveData,
  defaultStats,
  getPendingNodeIdAfterNode,
  getSaveTimeString,
  hasSaveFile,
  loadGame,
  resolveResumeNodeId,
  saveGame,
} from './storage';
import type { DisplayMessage, GameScreen, GameStats, MemoryAnchorId, NovaEmotion } from './types';
import { StarBackground } from './components/StarBackground';
import { ImageModal } from './components/ImageModal';
import { ChatMessage } from './components/ChatMessage';
import { ChapterBanner, RemoteTypingRow } from './components/ChatPrimitives';
import { RestartDialog } from './components/RestartDialog';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { getSaveProgressLabel } from './progress';
import { formatChoiceText, shouldShowNovaAvatar, shouldShowTypingAvatar } from './format';
import { resolveEndingStart } from './endings';

const MEMORY_ANCHOR_LABELS: Record<MemoryAnchorId, string> = {
  n7: 'N7',
  milk_candy: '牛奶糖',
  white_flower: '小白花',
  first_message: '第一次通讯',
  goodnight: '晚安',
  observatory: '观测室',
  maintenance_board: '漂浮维修板',
  steak: '合成牛排',
};

export default function GameApp() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [choices, setChoices] = useState<Choice[] | null>(null);
  const [choiceNodeId, setChoiceNodeId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [modalImage, setModalImage] = useState<{ image: string; caption: string } | null>(null);
  const [novaEmotion, setNovaEmotion] = useState<NovaEmotion>('normal');
  const [isGlitching, setIsGlitching] = useState(false);
  const [showChapterBanner, setShowChapterBanner] = useState<string | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const [isTypewriterActive, setIsTypewriterActive] = useState(false);
  const [hasSave, setHasSave] = useState(() => hasSaveFile());
  const [saveTime, setSaveTime] = useState(() => getSaveTimeString());
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [inputNode, setInputNode] = useState<{ id: string; nextId?: string; placeholder: string } | null>(null);
  const [playerInput, setPlayerInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nodeQueueRef = useRef<string[]>([]);
  const queueRunIdRef = useRef(0);
  const activeQueueRunIdRef = useRef<number | null>(null);
  const messagesRef = useRef(messages);
  const emotionRef = useRef(novaEmotion);
  const statsRef = useRef(stats);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    emotionRef.current = novaEmotion;
  }, [novaEmotion]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const cancelActiveSequence = useCallback(() => {
    queueRunIdRef.current += 1;
    nodeQueueRef.current = [];
    return queueRunIdRef.current;
  }, []);

  const goToMenu = useCallback(() => {
    cancelActiveSequence();
    setIsTyping(false);
    setIsTypewriterActive(false);
    setTypewriterText('');
    setIsGlitching(false);
    setShowChapterBanner(null);
    setChoices(null);
    setChoiceNodeId(null);
    setInputNode(null);
    setPlayerInput('');
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
    saveGame(createSaveData(pendingNodeId, msgs, emotionRef.current, statsRef.current));
    setHasSave(true);
    setSaveTime('刚刚');
  }, []);

  const addMessage = useCallback((msg: DisplayMessage) => {
    const next = [...messagesRef.current, msg];
    messagesRef.current = next;
    setMessages(next);
    return next;
  }, []);

  const saveMemoryAnchor = useCallback(
    (anchor: MemoryAnchorId, pendingNodeId: string) => {
      const current = statsRef.current;
      if (current.memoryAnchors.includes(anchor)) return;

      const nextStats = { ...current, memoryAnchors: [...current.memoryAnchors, anchor] };
      statsRef.current = nextStats;
      setStats(nextStats);

      const nextMessages = addMessage({
        id: `memory_anchor_${anchor}_${Date.now()}`,
        speaker: 'system',
        type: 'memory-anchor',
        content: `【Observer-01 已记录：${MEMORY_ANCHOR_LABELS[anchor]}】`,
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

      if (node.requiresAnchor && !statsRef.current.memoryAnchors.includes(node.requiresAnchor)) {
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'end') {
        addMessage({
          id: `${node.id}_${Date.now()}`,
          speaker: 'system',
          type: 'end',
          content: '',
          isNew: true,
        });
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'delay') {
        await new Promise(r => setTimeout(r, node.delay || 1000));
        if (!isCurrentRun()) return false;
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'typing') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, node.delay || 2000));
        if (!isCurrentRun()) return false;
        setIsTyping(false);
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'input') {
        setInputNode({ id: node.id, nextId: node.nextId, placeholder: node.content || '输入你想说的话...' });
        setIsTyping(false);
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'choice' && node.choices) {
        setChoices(node.choices);
        setChoiceNodeId(nodeId);
        setIsTyping(false);
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'glitch' || node.isGlitch) {
        setIsGlitching(true);
        await new Promise(r => setTimeout(r, node.delay || 1500));
        if (!isCurrentRun()) return false;
        setIsGlitching(false);
      }

      if (node.type === 'chapter') {
        setShowChapterBanner(node.content);
        await new Promise(r => setTimeout(r, 2500));
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
        isGlitch: node.isGlitch,
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
        await new Promise(r => setTimeout(r, 900));
        if (!isCurrentRun()) return false;
        setIsTyping(false);

        const currentMsgs = addMessage(displayMsg);

        setIsTypewriterActive(true);
        const text = node.content;
        for (let i = 0; i <= text.length; i++) {
          if (!isCurrentRun()) return false;
          setTypewriterText(text.slice(0, i));
          await new Promise(r => setTimeout(r, 30 + Math.random() * 20));
        }
        setIsTypewriterActive(false);
        setTypewriterText('');

        setTimeout(() => {
          setMessages(prev => prev.map(m => (m.id === displayMsg.id ? { ...m, isNew: false } : m)));
        }, 500);

        persistState(getPendingNodeIdAfterNode(nodeId), currentMsgs);
      } else {
        const currentMsgs = addMessage(displayMsg);

        setTimeout(() => {
          setMessages(prev => prev.map(m => (m.id === displayMsg.id ? { ...m, isNew: false } : m)));
        }, 500);

        if (
          node.type === 'status' ||
          node.type === 'timestamp' ||
          node.type === 'image' ||
          node.type === 'file' ||
          node.type === 'draft'
        ) {
          persistState(getPendingNodeIdAfterNode(nodeId), currentMsgs);
        }

        await new Promise(r => setTimeout(r, node.delay || 200));
        if (!isCurrentRun()) return false;
      }

      if (node.memoryAnchor) {
        saveMemoryAnchor(node.memoryAnchor, getPendingNodeIdAfterNode(nodeId));
      }

      if (node.nextId) {
        nodeQueueRef.current.push(node.nextId);
      }
      return true;
    },
    [addMessage, persistState, saveMemoryAnchor],
  );

  const processQueue = useCallback(async (runId: number) => {
    if (activeQueueRunIdRef.current === runId) return;
    activeQueueRunIdRef.current = runId;

    while (nodeQueueRef.current.length > 0 && queueRunIdRef.current === runId) {
      const nextId = nodeQueueRef.current.shift()!;
      const shouldContinue = await processSingleNode(nextId, runId);
      if (!shouldContinue || queueRunIdRef.current !== runId) break;
    }

    if (activeQueueRunIdRef.current === runId) {
      activeQueueRunIdRef.current = null;
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
      setIsGlitching(false);
      setShowChapterBanner(null);
      setShowRestartConfirm(false);

      if (mode === 'continue') {
        const save = loadGame();
        if (save) {
          messagesRef.current = save.messages;
          emotionRef.current = save.novaEmotion;
          statsRef.current = save.stats;
          setMessages(save.messages);
          setNovaEmotion(save.novaEmotion);
          setStats(save.stats);
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
      setMessages([]);
      setNovaEmotion('normal');
      setStats(defaultStats);
      statsRef.current = defaultStats;
      setInputNode(null);
      setPlayerInput('');
      setScreen('playing');
      startSequence('p0');
    },
    [cancelActiveSequence, scheduleSequence, startSequence],
  );

  const applyChoiceEffects = useCallback((choice: Choice) => {
    const text = choice.text;
    const current = statsRef.current;
    const next: GameStats = {
      trust: current.trust,
      memory: current.memory,
      attachment: current.attachment,
      memoryAnchors: [...current.memoryAnchors],
      acceptFarewell: current.acceptFarewell,
    };

    if (/没事|我在|别怕|辛苦|晚安|当然|会|记得|真漂亮|听起来不错/.test(text)) {
      next.trust += 1;
    }
    if (/第七次|循环|日志|Observer|真相|记录者|记忆载体/.test(text)) {
      next.memory += 1;
    }
    if (choice.nextId === 'FINALE_DECISION_END' || /结束循环|接受告别/.test(text)) {
      next.acceptFarewell = true;
    }
    if (choice.nextId === 'BAD_END_START' || /拒绝告别|维持循环|不想让你离开|不要离开/.test(text)) {
      next.attachment += 2;
      next.acceptFarewell = false;
    }

    statsRef.current = next;
    setStats(next);
    return next;
  }, []);

  const handleChoice = useCallback(
    (choice: Choice) => {
      setChoices(null);
      setChoiceNodeId(null);
      const nextStats = applyChoiceEffects(choice);
      const nextId = resolveEndingStart(choice.nextId, nextStats);

      const playerMsg: DisplayMessage = {
        id: `player_${Date.now()}`,
        speaker: 'player',
        type: 'text',
        content: formatChoiceText(choice.text),
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

  const handlePlayerInput = useCallback(() => {
    if (!inputNode) return;
    const text = playerInput.trim() || '......';
    const playerMsg: DisplayMessage = {
      id: `player_${Date.now()}`,
      speaker: 'player',
      type: 'text',
      content: text,
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
                  src={novaAvatar[menuNovaEmotion]}
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
      {isGlitching && <div className="fixed inset-0 z-40 pointer-events-none animate-glitch bg-[#F0A030]/5" />}
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

      <div className="game-layout relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-[750px] mx-auto bg-[#0B0E14]/82 backdrop-blur-sm">
          <header className="game-header chat-header flex items-center gap-3 px-3 sm:px-4 py-3 bg-[#151A26]/92 border-b border-[#1A2236]/80 shrink-0">
            <div className="relative shrink-0">
              <img
                src={resolveNovaAvatar(novaEmotion)}
                alt="Nova"
                className="nova-header-avatar"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4ADE80] border-2 border-[#151A26]" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[#E8EEF4] text-[15px] font-medium leading-tight">Nova</span>
              <span className="text-[#6E8498] text-[11px] leading-snug truncate">
                在线 · 信号微弱 · Aurora 通讯链路
              </span>
            </div>
            <div className="ml-auto flex items-center shrink-0">
              <button
                type="button"
                onClick={goToMenu}
                className="header-disconnect-btn text-[11px] px-2.5 py-1.5 rounded transition-colors"
              >
                断开通讯
              </button>
            </div>
          </header>

          <div className="game-chat chat-scroll flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 space-y-0">
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                isLastNovaMsg={isLastNovaTyping && index === messages.length - 1}
                typewriterText={typewriterText}
                showNovaAvatar={shouldShowNovaAvatar(messages, index)}
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
                avatarSrc={resolveNovaAvatar(novaEmotion)}
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
