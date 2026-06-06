import { useState, useEffect, useRef, useCallback } from 'react';
import { storyNodeMap, type Choice } from './story';
import { novaAvatar } from './assets';
import {
  clearSave,
  createSaveData,
  getPendingNodeIdAfterNode,
  getSaveTimeString,
  hasSaveFile,
  loadGame,
  resolveResumeNodeId,
  saveGame,
} from './storage';
import type { DisplayMessage, GameScreen, NovaEmotion } from './types';
import { StarBackground } from './components/StarBackground';
import { ImageModal } from './components/ImageModal';
import { ChatMessage } from './components/ChatMessage';
import { ChapterBanner, TypingIndicator } from './components/ChatPrimitives';
import { RestartDialog } from './components/RestartDialog';

export default function GameApp() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [choices, setChoices] = useState<Choice[] | null>(null);
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nodeQueueRef = useRef<string[]>([]);
  const isQueueRunningRef = useRef(false);
  const shouldStopQueueRef = useRef(false);
  const messagesRef = useRef(messages);
  const emotionRef = useRef(novaEmotion);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    emotionRef.current = novaEmotion;
  }, [novaEmotion]);

  const goToMenu = useCallback(() => {
    shouldStopQueueRef.current = true;
    setIsTyping(false);
    setIsTypewriterActive(false);
    setTypewriterText('');
    setChoices(null);
    setHasSave(hasSaveFile());
    setSaveTime(getSaveTimeString());
    setScreen('menu');
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const persistState = useCallback((pendingNodeId: string, msgs: DisplayMessage[]) => {
    saveGame(createSaveData(pendingNodeId, msgs, emotionRef.current));
    setHasSave(true);
    setSaveTime('刚刚');
  }, []);

  const addMessage = useCallback((msg: DisplayMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const processSingleNode = useCallback(
    async (nodeId: string): Promise<boolean> => {
      if (shouldStopQueueRef.current) return false;

      const node = storyNodeMap.get(nodeId);
      if (!node) return false;

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
        if (shouldStopQueueRef.current) return false;
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'typing') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, node.delay || 2000));
        if (shouldStopQueueRef.current) {
          setIsTyping(false);
          return false;
        }
        setIsTyping(false);
        if (node.nextId) nodeQueueRef.current.push(node.nextId);
        return true;
      }

      if (node.type === 'choice' && node.choices) {
        setChoices(node.choices);
        setIsTyping(false);
        persistState(nodeId, messagesRef.current);
        return false;
      }

      if (node.type === 'glitch' || node.isGlitch) {
        setIsGlitching(true);
        await new Promise(r => setTimeout(r, node.delay || 1500));
        if (shouldStopQueueRef.current) {
          setIsGlitching(false);
          return false;
        }
        setIsGlitching(false);
      }

      if (node.type === 'chapter') {
        setShowChapterBanner(node.content);
        await new Promise(r => setTimeout(r, 2500));
        if (shouldStopQueueRef.current) {
          setShowChapterBanner(null);
          return false;
        }
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
      }

      if (node.speaker === 'nova' && node.type === 'text' && !node.isGlitch) {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 500));
        if (shouldStopQueueRef.current) {
          setIsTyping(false);
          return false;
        }
        setIsTyping(false);

        addMessage(displayMsg);
        const currentMsgs = [...messagesRef.current, displayMsg];

        setIsTypewriterActive(true);
        const text = node.content;
        for (let i = 0; i <= text.length; i++) {
          if (shouldStopQueueRef.current) {
            setIsTypewriterActive(false);
            setTypewriterText('');
            return false;
          }
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
        addMessage(displayMsg);

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
          persistState(getPendingNodeIdAfterNode(nodeId), [...messagesRef.current, displayMsg]);
        }

        await new Promise(r => setTimeout(r, node.delay || 200));
        if (shouldStopQueueRef.current) return false;
      }

      if (node.nextId) {
        nodeQueueRef.current.push(node.nextId);
      }
      return true;
    },
    [addMessage, persistState],
  );

  const processQueue = useCallback(async () => {
    if (isQueueRunningRef.current) return;
    isQueueRunningRef.current = true;

    while (nodeQueueRef.current.length > 0 && !shouldStopQueueRef.current) {
      const nextId = nodeQueueRef.current.shift()!;
      const shouldContinue = await processSingleNode(nextId);
      if (!shouldContinue || shouldStopQueueRef.current) break;
    }

    isQueueRunningRef.current = false;
    shouldStopQueueRef.current = false;
  }, [processSingleNode]);

  const startSequence = useCallback(
    (nodeId: string) => {
      shouldStopQueueRef.current = true;
      nodeQueueRef.current = [nodeId];
      isQueueRunningRef.current = false;
      setTimeout(() => {
        shouldStopQueueRef.current = false;
        processQueue();
      }, 50);
    },
    [processQueue],
  );

  const startGame = useCallback(
    (mode: 'new' | 'continue') => {
      setChoices(null);
      setIsTyping(false);
      setIsTypewriterActive(false);
      setTypewriterText('');
      setShowRestartConfirm(false);
      isQueueRunningRef.current = false;
      nodeQueueRef.current = [];

      if (mode === 'continue') {
        const save = loadGame();
        if (save) {
          setMessages(save.messages);
          setNovaEmotion(save.novaEmotion);
          setScreen('playing');

          const lastMsg = save.messages[save.messages.length - 1];
          if (lastMsg?.type === 'end') {
            return;
          }

          const resumeId = resolveResumeNodeId(save);
          const resumeNode = storyNodeMap.get(resumeId);
          if (resumeNode?.type === 'choice') {
            setChoices(resumeNode.choices ?? null);
            return;
          }

          setTimeout(() => startSequence(resumeId), 500);
          return;
        }
      }

      clearSave();
      setMessages([]);
      setNovaEmotion('normal');
      setScreen('playing');
      startSequence('p0');
    },
    [startSequence],
  );

  const handleChoice = useCallback(
    (choice: Choice) => {
      setChoices(null);

      const playerMsg: DisplayMessage = {
        id: `player_${Date.now()}`,
        speaker: 'player',
        type: 'text',
        content: choice.text,
        isNew: true,
      };
      const updated = [...messagesRef.current, playerMsg];
      setMessages(updated);
      persistState(choice.nextId, updated);

      setTimeout(() => {
        startSequence(choice.nextId);
      }, 400);
    },
    [startSequence, persistState],
  );

  const lastMsg = messages[messages.length - 1];
  const isLastNovaTyping =
    isTypewriterActive && lastMsg && lastMsg.speaker === 'nova' && lastMsg.type === 'text';

  if (screen === 'menu') {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <StarBackground />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8 animate-fade-in">
            <div className="flex flex-col items-center gap-3">
              <h1 className="menu-title text-[#E2E8F0]">第七次重启</h1>
              <p className="text-[#94A3B8] text-sm tracking-[0.3em] font-light">SEVENTH REBOOT</p>
            </div>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#4A6C8C] to-transparent my-2" />
            <div className="flex flex-col gap-3 w-56">
              {hasSave ? (
                <>
                  <button
                    onClick={() => startGame('continue')}
                    className="px-6 py-3 rounded-lg bg-[#151A26] border border-[#4A6C8C]/50 text-[#E2E8F0] text-base tracking-wider hover:border-[#F0A030] hover:text-[#F0A030] transition-all duration-300 animate-pulse-glow"
                  >
                    继续通讯
                  </button>
                  <span className="text-center text-[#8B949E] text-xs">上次存档：{saveTime}</span>
                  <button
                    onClick={() => setShowRestartConfirm(true)}
                    className="px-6 py-3 rounded-lg bg-transparent border border-[#2A3550] text-[#8B949E] text-sm tracking-wider hover:border-[#4A6C8C] hover:text-[#E2E8F0] transition-all duration-300"
                  >
                    重新开始
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startGame('new')}
                  className="px-6 py-3 rounded-lg bg-[#151A26] border border-[#4A6C8C]/50 text-[#E2E8F0] text-base tracking-wider hover:border-[#F0A030] hover:text-[#F0A030] transition-all duration-300 animate-pulse-glow"
                >
                  接入通讯
                </button>
              )}
            </div>
            <div className="flex flex-col items-center gap-2 mt-4">
              {hasSave && (
                <div className="flex items-center gap-2 text-[#8B949E] text-xs">
                  <img
                    src={novaAvatar[novaEmotion]}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover opacity-60"
                  />
                  <span>Nova 还在等你</span>
                </div>
              )}
              <p className="text-[#8B949E] text-xs font-light tracking-wide">来自深空的消息 · 等待接收</p>
            </div>
          </div>
        </div>
        {showRestartConfirm && (
          <RestartDialog
            onCancel={() => setShowRestartConfirm(false)}
            onConfirm={() => {
              clearSave();
              setHasSave(false);
              setShowRestartConfirm(false);
              startGame('new');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <StarBackground />
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

      <div className="absolute inset-0 z-10 flex flex-col items-center">
        <div className="w-full max-w-[750px] h-full flex flex-col bg-[#0B0E14]/85 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#151A26]/90 border-b border-[#1A2236] shrink-0">
            <div className="relative">
              <img
                src={novaAvatar[novaEmotion]}
                alt="Nova"
                className="w-10 h-10 rounded-full object-cover border border-[#4A6C8C]/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4ADE80] border-2 border-[#151A26]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#E2E8F0] text-sm font-medium">Nova Arlen</span>
              <span className="text-[#4ADE80] text-xs">在线</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[#4A6C8C] text-xs hidden sm:inline">自动存档已开启</span>
              <button
                onClick={goToMenu}
                className="text-[#8B949E] hover:text-[#E2E8F0] text-xs px-3 py-1.5 rounded hover:bg-[#1A2236] transition-colors"
              >
                退出
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                isLastNovaMsg={isLastNovaTyping && index === messages.length - 1}
                typewriterText={typewriterText}
                onImageClick={(img, cap) => setModalImage({ image: img, caption: cap })}
              />
            ))}

            {isTyping && (
              <div className="flex items-end gap-2 py-1">
                <img
                  src={novaAvatar[novaEmotion]}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-[#4A6C8C]/20 self-end mb-1 shrink-0"
                />
                <TypingIndicator />
              </div>
            )}

            {messages.length > 0 && messages[messages.length - 1].type === 'end' && (
              <div className="flex justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-px bg-[#4A6C8C]/40" />
                  <span className="text-[#8B949E] text-xs tracking-wider">通讯结束</span>
                  <button onClick={goToMenu} className="mt-4 text-sm text-[#F0A030] hover:underline">
                    返回主菜单
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 px-4 py-3 bg-[#151A26]/90 border-t border-[#1A2236]">
            {choices ? (
              <div className="flex flex-col gap-2">
                {choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => handleChoice(choice)}
                    className="choice-btn w-full text-left px-4 py-3 rounded-lg bg-[#151A26] text-[#E2E8F0] text-sm leading-relaxed"
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1A2236]">
                <div className="flex-1">
                  {isTyping ? (
                    <span className="text-[#8B949E] text-sm">Nova 正在输入...</span>
                  ) : (
                    <span className="text-[#4A5568] text-sm">等待 Nova 的消息...</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
