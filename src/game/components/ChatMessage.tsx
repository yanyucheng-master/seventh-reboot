import { resolveContactAvatar } from '../assets';
import type { ContactStage, DisplayMessage } from '../types';
import {
  ChapterBanner,
  CommLog,
  CommStatus,
  FileDisplay,
  GlitchText,
  MemoryAnchorNotice,
  SystemMessage,
} from './ChatPrimitives';

export function ChatMessage({
  msg,
  isLastNovaMsg,
  typewriterText,
  showNovaAvatar = true,
  currentContactStage,
  onImageClick,
}: {
  msg: DisplayMessage;
  isLastNovaMsg: boolean;
  typewriterText: string;
  showNovaAvatar?: boolean;
  currentContactStage: ContactStage;
  onImageClick: (img: string, cap: string) => void;
}) {
  if (msg.speaker === 'system') {
    if (msg.type === 'glitch' || msg.isGlitch) {
      return <GlitchText content={msg.content} />;
    }
    if (msg.type === 'comm-log') {
      return <CommLog content={msg.content} />;
    }
    if (msg.type === 'status') {
      return <CommStatus content={msg.content} />;
    }
    if (msg.type === 'memory-anchor') {
      return <MemoryAnchorNotice content={msg.content} />;
    }
    if (msg.type === 'file') {
      return (
        <div className="flex justify-start py-0.5 animate-fade-in">
          <FileDisplay content={msg.content} />
        </div>
      );
    }
    if (msg.type === 'chapter') {
      return <ChapterBanner title={msg.content} />;
    }
    if (msg.type === 'draft') {
      return (
        <div className="flex flex-col items-center py-2 animate-fade-in gap-1">
          <span className="system-msg-text">收到未发送草稿</span>
          <span className="text-[#7A8494] text-xs italic opacity-70 whitespace-pre-line">{msg.content}</span>
        </div>
      );
    }
    if (msg.type === 'end') {
      return null;
    }
    return <SystemMessage content={msg.content} />;
  }

  const isPlayer = msg.speaker === 'player';
  const messageContactStage = msg.contactStage ?? currentContactStage;
  const avatarSrc = resolveContactAvatar(messageContactStage, msg.emotion, msg.isGlitch);
  const senderName = messageContactStage === 'unknown' ? '？？？' : 'Nova';

  if (msg.type === 'image') {
    return (
      <div
        className={`flex items-end gap-2 py-0.5 ${isPlayer ? 'justify-end' : 'justify-start'} ${showNovaAvatar && !isPlayer ? 'gap-2.5' : ''} ${!showNovaAvatar && !isPlayer ? 'pl-[46px]' : ''} ${msg.isNew ? 'animate-fade-in-up' : ''}`}
      >
        {!isPlayer && showNovaAvatar && <img src={avatarSrc} alt="" className="nova-chat-avatar shrink-0" />}
        <div className={`flex flex-col gap-1 max-w-[min(82%,320px)] ${isPlayer ? 'items-end' : 'items-start'}`}>
          {!isPlayer && showNovaAvatar && <span className="remote-sender-label">{senderName}</span>}
          <div className="cursor-pointer group" onClick={() => onImageClick(msg.image!, msg.content)}>
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={msg.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full max-w-[min(260px,85vw)] max-h-[220px] object-cover rounded-xl group-hover:brightness-110 transition-all"
              />
            </div>
            {msg.content && (
              <p className="text-xs text-[#8B9CB0] mt-1 px-1 whitespace-pre-line">{msg.content}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayText = isLastNovaMsg ? typewriterText : msg.content;

  return (
    <div
      className={`flex items-end gap-2 py-0.5 ${isPlayer ? 'justify-end' : 'justify-start'} ${showNovaAvatar && !isPlayer ? 'gap-2.5' : ''} ${!showNovaAvatar && !isPlayer ? 'pl-[46px]' : ''} ${msg.isNew ? 'animate-fade-in-up' : ''}`}
    >
      {!isPlayer && showNovaAvatar && <img src={avatarSrc} alt="" className="nova-chat-avatar shrink-0" />}
      <div className={`flex flex-col gap-1 max-w-[min(82%,320px)] ${isPlayer ? 'items-end' : 'items-start'}`}>
        {!isPlayer && showNovaAvatar && <span className="remote-sender-label">{senderName}</span>}
        <div className={`px-3 py-1.5 ${isPlayer ? 'bubble-player' : 'bubble-nova'}`}>
          <p className={`leading-relaxed whitespace-pre-line ${isPlayer ? 'player-msg-text' : 'nova-msg-text'}`}>
            {displayText}
          </p>
        </div>
      </div>
    </div>
  );
}
