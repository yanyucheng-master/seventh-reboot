import { novaAvatar } from '../assets';
import type { DisplayMessage } from '../types';
import {
  ChapterBanner,
  FileDisplay,
  GlitchText,
  SystemMessage,
} from './ChatPrimitives';

export function ChatMessage({
  msg,
  isLastNovaMsg,
  typewriterText,
  onImageClick,
}: {
  msg: DisplayMessage;
  isLastNovaMsg: boolean;
  typewriterText: string;
  onImageClick: (img: string, cap: string) => void;
}) {
  if (msg.speaker === 'system') {
    if (msg.type === 'glitch' || msg.isGlitch) {
      return <GlitchText content={msg.content} />;
    }
    if (msg.type === 'file') {
      return (
        <div className="flex justify-start py-1 animate-fade-in">
          <FileDisplay content={msg.content} />
        </div>
      );
    }
    if (msg.type === 'chapter') {
      return <ChapterBanner title={msg.content} />;
    }
    if (msg.type === 'draft') {
      return (
        <div className="flex flex-col items-center py-3 animate-fade-in gap-1">
          <span className="text-[#8B949E] text-xs">收到未发送草稿</span>
          <span className="text-[#94A3B8] text-sm italic opacity-60 whitespace-pre-line">{msg.content}</span>
        </div>
      );
    }
    if (msg.type === 'end') {
      return null;
    }
    return <SystemMessage content={msg.content} />;
  }

  const isPlayer = msg.speaker === 'player';

  if (msg.type === 'image') {
    return (
      <div
        className={`flex items-end gap-2 py-1 ${isPlayer ? 'justify-end' : 'justify-start'} ${msg.isNew ? 'animate-fade-in-up' : ''}`}
      >
        {!isPlayer && (
          <img
            src={novaAvatar[msg.emotion || 'normal']}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-[#4A6C8C]/20 self-end mb-1 shrink-0"
          />
        )}
        <div className="flex flex-col gap-1 max-w-[70%] items-start">
          <div className="cursor-pointer group" onClick={() => onImageClick(msg.image!, msg.content)}>
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={msg.image}
                alt=""
                className="max-w-[260px] max-h-[200px] object-cover rounded-xl group-hover:brightness-110 transition-all"
              />
            </div>
            {msg.content && (
              <p className="text-xs text-[#94A3B8] mt-1 px-1 whitespace-pre-line">{msg.content}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayText = isLastNovaMsg ? typewriterText : msg.content;

  return (
    <div
      className={`flex items-end gap-2 py-1 ${isPlayer ? 'justify-end' : 'justify-start'} ${msg.isNew ? 'animate-fade-in-up' : ''}`}
    >
      {!isPlayer && (
        <img
          src={novaAvatar[msg.emotion || 'normal']}
          alt=""
          className="w-8 h-8 rounded-full object-cover border border-[#4A6C8C]/20 self-end mb-1 shrink-0"
        />
      )}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isPlayer ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 ${isPlayer ? 'bubble-player' : 'bubble-nova'}`}>
          <p className="text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-line">{displayText}</p>
        </div>
      </div>
    </div>
  );
}
