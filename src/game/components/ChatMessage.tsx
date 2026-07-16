import { cleanChatText } from '../format';
import type { DisplayMessage, NovaAvatarPresentation, NovaAvatarTransition } from '../types';
import {
  ChapterBanner,
  CommLog,
  CommStatus,
  EpilogueText,
  FileDisplay,
  GlitchText,
  MemoryAnchorNotice,
  AnomalyRecordCard,
  SystemMessage,
} from './ChatPrimitives';
import { NovaAvatar } from './NovaAvatar';
import { MessageDeliveryStatus } from './MessageDeliveryStatus';

function isSignalSystemMessage(msg: DisplayMessage): boolean {
  return /Communications interrupted|Attempting reconnection|Reconnection failed|Reconnected/i.test(msg.content);
}

function getMessageGlitchLevel(msg: DisplayMessage) {
  if (msg.glitchLevel) return msg.glitchLevel;
  if (/Communications interrupted|Attempting reconnection|Reconnection failed/i.test(msg.content)) return 2;
  if (/Reconnected/i.test(msg.content)) return 1;
  return 1;
}

export function ChatMessage({
  msg,
  isLastNovaMsg,
  typewriterText,
  showNovaAvatar = true,
  avatarPresentation,
  avatarTransition,
  isCurrentDelivery = false,
  currentSenderName,
  onImageClick,
}: {
  msg: DisplayMessage;
  isLastNovaMsg: boolean;
  typewriterText: string;
  showNovaAvatar?: boolean;
  avatarPresentation: NovaAvatarPresentation;
  avatarTransition?: NovaAvatarTransition | null;
  isCurrentDelivery?: boolean;
  currentSenderName: string;
  onImageClick: (img: string, cap: string) => void;
}) {
  if (msg.speaker === 'system') {
    if (msg.type === 'glitch' || msg.isGlitch || isSignalSystemMessage(msg)) {
      return <GlitchText content={msg.content} glitchLevel={getMessageGlitchLevel(msg)} />;
    }
    if (msg.type === 'comm-log') {
      return <CommLog content={msg.content} />;
    }
    if (msg.type === 'status') {
      return <CommStatus content={msg.content} />;
    }
    if (msg.type === 'ending-action') {
      return <CommStatus content={msg.content} />;
    }
    if (msg.type === 'memory-anchor') {
      return <MemoryAnchorNotice content={msg.content} />;
    }
    if (msg.type === 'file') {
      return (
        <div className="flex w-full justify-center py-0.5 animate-fade-in">
          <FileDisplay content={msg.content} />
        </div>
      );
    }
    if (msg.type === 'chapter') {
      return <ChapterBanner title={msg.content} />;
    }
    if (msg.type === 'epilogue') {
      return <EpilogueText content={msg.content} />;
    }
    if (msg.type === 'draft') {
      return <AnomalyRecordCard content={msg.content} fallbackTitle="Unsent Draft" tone="amber" />;
    }
    if (msg.type === 'end') {
      return null;
    }
    return <SystemMessage content={msg.content} />;
  }

  const isPlayer = msg.speaker === 'player';
  const isResidual06 = msg.speakerIdentity === 'residual06';
  const senderName = msg.displayName ?? currentSenderName;

  if (msg.type === 'image') {
    return (
      <div
        className={`media-message flex items-end gap-2 py-0.5 ${isPlayer ? 'justify-end' : 'justify-start'} ${showNovaAvatar && !isPlayer ? 'gap-2.5' : ''} ${!showNovaAvatar && !isPlayer ? 'pl-[46px]' : ''} ${msg.isNew ? 'animate-fade-in-up' : ''}`}
      >
        {!isPlayer && showNovaAvatar && (
          <NovaAvatar
            presentation={avatarPresentation}
            transition={avatarTransition}
            residualSignature={isResidual06}
            className="nova-chat-avatar shrink-0"
          />
        )}
        <div className={`media-message-body flex flex-col gap-1 ${isPlayer ? 'items-end' : 'items-start'}`}>
          {!isPlayer && showNovaAvatar && <span className="remote-sender-label">{senderName}</span>}
          <div className="media-message-trigger cursor-pointer group" onClick={() => onImageClick(msg.image!, msg.content)}>
            <div className="media-message-frame relative overflow-hidden rounded-xl">
              <img
                src={msg.image}
                alt={cleanChatText(msg.content) || 'Comm image'}
                loading="lazy"
                decoding="async"
                className="media-message-img w-full object-contain rounded-xl group-hover:brightness-110 transition-all"
              />
            </div>
            {msg.content && (
              <p className="media-message-caption text-xs text-[#8B9CB0] mt-1 px-1 whitespace-pre-line">{cleanChatText(msg.content)}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayText = cleanChatText(isLastNovaMsg ? typewriterText : msg.content);

  return (
    <div
      className={`flex items-end gap-2 py-0.5 ${isPlayer ? 'justify-end' : 'justify-start'} ${showNovaAvatar && !isPlayer ? 'gap-2.5' : ''} ${!showNovaAvatar && !isPlayer ? 'pl-[46px]' : ''} ${msg.isNew ? 'animate-fade-in-up' : ''}`}
    >
      {!isPlayer && showNovaAvatar && (
        <NovaAvatar
          presentation={avatarPresentation}
          transition={avatarTransition}
          residualSignature={isResidual06}
          className="nova-chat-avatar shrink-0"
        />
      )}
      <div className={`flex flex-col gap-1 max-w-[min(82%,320px)] ${isPlayer ? 'items-end' : 'items-start'}`}>
        {!isPlayer && showNovaAvatar && <span className="remote-sender-label">{senderName}</span>}
        <div className={`px-3 py-1.5 ${isPlayer ? 'bubble-player' : 'bubble-nova'}`}>
          <p className={`leading-relaxed whitespace-pre-line ${isPlayer ? 'player-msg-text' : 'nova-msg-text'}`}>
            {displayText}
          </p>
        </div>
        {isPlayer && <MessageDeliveryStatus message={msg} isCurrent={isCurrentDelivery} />}
      </div>
    </div>
  );
}
