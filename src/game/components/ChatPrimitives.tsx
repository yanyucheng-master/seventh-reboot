import { useMemo, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import type { GlitchLevel, NovaAvatarPresentation, NovaAvatarTransition } from '../types';
import { useI18n } from '../../i18n';
import { NovaAvatar } from './NovaAvatar';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bubble-nova w-fit">
      {[0, 200, 400].map(d => (
        <span
          key={d}
          className="w-1.5 h-1.5 rounded-full bg-[#7A8FA8] animate-typing-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

export function RemoteTypingRow({
  avatarPresentation,
  avatarTransition,
  showAvatar = true,
}: {
  avatarPresentation: NovaAvatarPresentation;
  avatarTransition?: NovaAvatarTransition | null;
  showAvatar?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className={`flex items-end gap-2.5 py-1 animate-fade-in ${showAvatar ? '' : 'pl-[46px]'}`}>
      {showAvatar && (
        <NovaAvatar
          presentation={avatarPresentation}
          transition={avatarTransition}
          className="nova-chat-avatar shrink-0"
        />
      )}
      <div className="flex flex-col gap-0.5 items-start">
        <span className="remote-typing-label">{t('chat.typing')}</span>
        <TypingIndicator />
      </div>
    </div>
  );
}

export function ChapterBanner({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-5 sm:py-8 animate-fade-in">
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#F0A030] to-transparent" />
      <h2 className="text-base sm:text-lg font-medium text-[#F0A030] tracking-widest">{title}</h2>
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#F0A030] to-transparent" />
    </div>
  );
}

export function EndingTitleBanner({ title }: { title: string }) {
  return (
    <div className="ending-title-wrap animate-fade-in" role="status">
      <span className="ending-title-code">AURORA / FINAL RECORD</span>
      <div className="ending-title-rule" aria-hidden="true" />
      <h2 className="ending-title-text">{title}</h2>
      <div className="ending-title-rule ending-title-rule-lower" aria-hidden="true" />
    </div>
  );
}

export function EpilogueText({ content }: { content: string }) {
  return (
    <div className="epilogue-line-wrap animate-fade-in">
      <div className="epilogue-line-card">
        <p className="epilogue-line-text whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
}

function getGlitchTextTone(content: string) {
  if (/Reconnected|Connection restored|restored to normal|Communications restored|重连成功|链路恢复|恢复正常|通讯恢复/i.test(content)) return 'success';
  if (/Communications interrupted|Reconnection failed|Signal fading|Signal continues to decay|Countdown|refused|Request denied|Connection about to terminate|通讯中断|重连失败|信号衰减|信号继续衰减|倒计时|拒绝|请求被拒|连接即将终止/i.test(content)) return 'danger';
  return 'neutral';
}

export function GlitchText({
  content,
  glitchLevel = 1,
  presentation = 'standard',
}: {
  content: string;
  glitchLevel?: GlitchLevel;
  presentation?: 'standard' | 'dropout';
}) {
  const tone = getGlitchTextTone(content);
  return (
    <div
      className={`comm-glitch-wrap comm-glitch-wrap-${tone} comm-glitch-wrap-level-${glitchLevel} ${
        presentation === 'dropout' ? 'comm-glitch-wrap-dropout' : 'animate-glitch'
      }`}
    >
      <span
        className={`comm-glitch-text comm-glitch-text-${tone} comm-glitch-text-level-${glitchLevel} ${
          presentation === 'dropout' ? 'comm-glitch-text-dropout' : ''
        } font-mono`}
        data-text={presentation === 'dropout' ? content : undefined}
      >
        {content}
      </span>
    </div>
  );
}

function parseCommLogLine(line: string, index: number) {
  if (index === 0) {
    return { kind: 'en-tag' as const, text: line.replace(/^\[|\]$/g, '') };
  }
  if (index === 1) {
    return { kind: 'zh-title' as const, text: line.replace(/^\[|\]$/g, '') };
  }
  const parts = line.split('·').map(s => s.trim());
  if (parts.length >= 2) {
    return { kind: 'row' as const, en: parts[0], zh: parts.slice(1).join(' · ') };
  }
  return { kind: 'plain' as const, text: line };
}

export function CommLog({ content }: { content: string }) {
  const lines = content.split('\n').filter(Boolean);
  return (
    <div className="comm-log-block animate-fade-in">
      {lines.map((line, i) => {
        const parsed = parseCommLogLine(line, i);
        if (parsed.kind === 'en-tag') {
          return (
            <p key={i} className="comm-log-en-tag">
              [{parsed.text}]
            </p>
          );
        }
        if (parsed.kind === 'zh-title') {
          return (
            <p key={i} className="comm-log-title">
              {parsed.text}
            </p>
          );
        }
        if (parsed.kind === 'row') {
          return (
            <div key={i} className="comm-log-row">
              <span className="comm-log-en-label">{parsed.en}</span>
              <span className="comm-log-zh-value">{parsed.zh}</span>
            </div>
          );
        }
        return (
          <p key={i} className="comm-log-line">
            {parsed.text}
          </p>
        );
      })}
    </div>
  );
}

export function CommStatus({ content }: { content: string }) {
  return (
    <div className="flex justify-center py-0.5 animate-fade-in">
      <span className="comm-status-text">{content}</span>
    </div>
  );
}

export function MemoryAnchorNotice({ content }: { content: string }) {
  return (
    <div className="flex justify-center py-1 animate-fade-in">
      <span className="memory-anchor-text font-mono">{content}</span>
    </div>
  );
}

function splitRecordContent(content: string, fallbackTitle: string) {
  const parts = content.split('||');
  if (parts.length >= 2) {
    return {
      title: parts[0] || fallbackTitle,
      body: parts.slice(1).join('||'),
    };
  }
  return { title: fallbackTitle, body: content };
}

type FileLineEntry =
  | { kind: 'row'; label: string; value: string; raw: string }
  | { kind: 'line'; text: string }
  | { kind: 'spacer' };

function normalizeFileLines(title: string, body: string): string[] {
  const rawLines = body.split('\n');
  const meaningfulLines = rawLines.map(line => line.trim()).filter(Boolean);
  const isDualAuth = /^(Dual Authenticators|双重认证者)$/i.test(title.trim());

  if (isDualAuth && meaningfulLines.length >= 2 && meaningfulLines.every(line => line === 'Nova Arlen')) {
    return [
      'Current authenticator: Nova Arlen / current cycle',
      'Residual authenticator: Nova Arlen / sixth-cycle residual',
      'Authentication status: current signal coexists with residual signal',
    ];
  }

  return rawLines;
}

function parseFileLine(line: string): FileLineEntry {
  const trimmed = line.trim();
  if (!trimmed) return { kind: 'spacer' };

  const separatorIndex = trimmed.search(/[：:]/);
  if (separatorIndex > 0) {
    const label = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (label.length <= 18 && value) {
      return { kind: 'row', label, value, raw: trimmed };
    }
  }

  return { kind: 'line', text: line };
}

function getFileType(title: string): string {
  if (/SEVENTH|PROTOCOL|协议|核心|供能|路由/i.test(title)) return 'PROTOCOL RECORD';
  if (/LOG|NOVA-07|Hidden Log|日志|记录/i.test(title)) return 'MEMORY LOG';
  if (/Auth|Identity|Dual Authenticator|认证|OBSERVER/i.test(title)) return 'IDENTITY FILE';
  return 'DECRYPTED RECORD';
}

function getFileSummary(title: string, entries: FileLineEntry[]): string[] {
  if (/^(Dual Authenticators|双重认证者)$/i.test(title.trim())) {
    return ['Current Nova and sixth-cycle residual coexist'];
  }

  const lines = entries
    .filter(entry => entry.kind !== 'spacer')
    .map(entry => (entry.kind === 'row' ? `${entry.label}: ${entry.value}` : entry.text.trim()))
    .filter(Boolean);

  if (lines.length <= 2) return lines;

  const first = lines[0];
  const last = lines.at(-1);
  return last && last !== first ? [first, last] : [first];
}

function getFileRecordCode(title: string): string {
  let hash = 0x811c9dc5;
  for (const character of title) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return `N7-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(-6)}`;
}

function getFileRecordTone(fileType: string): 'signal' | 'protocol' | 'identity' {
  if (fileType === 'PROTOCOL RECORD') return 'protocol';
  if (fileType === 'IDENTITY FILE') return 'identity';
  return 'signal';
}

export function FileDisplay({ content }: { content: string }) {
  const { t } = useI18n();
  const { title, body } = splitRecordContent(content, t('chat.systemFile'));
  const lines = useMemo(() => normalizeFileLines(title, body), [body, title]);
  const entries = useMemo(() => lines.map(parseFileLine), [lines]);
  const summary = useMemo(() => getFileSummary(title, entries), [entries, title]);
  const meaningfulEntries = useMemo(
    () => entries.filter(entry => entry.kind !== 'spacer'),
    [entries],
  );
  const hasExpandableDetails = meaningfulEntries.length > 3 || body.length > 180;
  const [isExpanded, setIsExpanded] = useState(false);
  const fileType = getFileType(title);
  const recordCode = getFileRecordCode(title);
  const recordTone = getFileRecordTone(fileType);
  const showSummary = hasExpandableDetails && !isExpanded;
  const showBody = !hasExpandableDetails || isExpanded;

  function renderEntry(entry: FileLineEntry, index: number) {
    if (entry.kind === 'spacer') return <div key={index} className="file-record-spacer" aria-hidden />;

    if (entry.kind === 'row') {
      return (
        <div key={index} className="file-record-row">
          <span className="file-record-label">{entry.label}</span>
          <span className="file-record-value">{entry.value}</span>
        </div>
      );
    }

    return (
      <p key={index} className="file-record-line">
        {entry.text}
      </p>
    );
  }

  return (
    <div className="anomaly-card-wrap file-card-wrap animate-fade-in">
      <div
        className="file-record-card"
        data-record-tone={recordTone}
        data-record-state={isExpanded ? 'expanded' : 'sealed'}
        aria-label={`${title} ${lines.join(' ')}`}
      >
        <span className="file-record-scan" aria-hidden="true" />
        <div className="file-record-header">
          <div className="file-record-core" aria-hidden="true">
            <FileText size={19} strokeWidth={1.6} />
            <span className="file-record-core-orbit" />
          </div>
          <div className="file-record-heading">
            <span className="file-record-kicker">
              <span>AURORA / RECOVERED FILE</span>
              <span className="file-record-code">{recordCode}</span>
            </span>
            <span className="file-record-title">{title}</span>
            <span className="file-record-meta">
              <span className="file-record-type">{fileType}</span>
              <span className="file-record-status">
                <span className="file-record-status-dot" aria-hidden="true" />
                DECRYPTED
              </span>
            </span>
          </div>
        </div>
        <div className="file-record-content">
          {showSummary && (
            <div className="file-record-summary">
              <span className="file-record-signal-mark" aria-hidden="true" />
              <div>
                {summary.length > 0 ? (
                  summary.map((line, index) => (
                    <p key={index} className="file-record-summary-line">
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="file-record-summary-line">{t('chat.summaryUnavailable')}</p>
                )}
              </div>
            </div>
          )}
          {showBody && (
            <div className={`file-record-body ${hasExpandableDetails ? 'file-record-body-expanded' : 'file-record-body-static'}`}>
              {entries.map(renderEntry)}
            </div>
          )}
        </div>
        {hasExpandableDetails ? (
          <button
            type="button"
            className="file-record-toggle"
            onClick={() => setIsExpanded(value => !value)}
            aria-expanded={isExpanded}
          >
            <span className="file-record-toggle-copy">
              <span className="file-record-toggle-kicker">CONTENT STREAM</span>
              <span>{isExpanded ? t('chat.collapseDetails') : t('chat.expandDetails')}</span>
            </span>
            <ChevronDown
              size={18}
              strokeWidth={1.6}
              className={`file-record-toggle-icon ${isExpanded ? 'is-expanded' : ''}`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <div className="file-record-complete" aria-hidden="true">
            <span>RECORD COMPLETE</span>
            <span className="file-record-signal-bars">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center py-0.5 animate-fade-in">
      <span className="system-msg-text text-center px-2 leading-relaxed">{content}</span>
    </div>
  );
}
