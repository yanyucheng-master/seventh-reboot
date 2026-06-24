import type { GlitchLevel } from '../types';

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
  avatarSrc,
  showAvatar = true,
}: {
  avatarSrc: string;
  showAvatar?: boolean;
}) {
  return (
    <div className={`flex items-end gap-2.5 py-1 animate-fade-in ${showAvatar ? '' : 'pl-[46px]'}`}>
      {showAvatar && <img src={avatarSrc} alt="" className="nova-chat-avatar shrink-0" />}
      <div className="flex flex-col gap-0.5 items-start">
        <span className="remote-typing-label">对方正在输入……</span>
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
  if (/重连成功|连接恢复|恢复正常/.test(content)) return 'success';
  if (/通讯中断|重连失败|信号衰减|倒计时|请求被拒绝/.test(content)) return 'danger';
  return 'neutral';
}

export function GlitchText({ content, glitchLevel = 1 }: { content: string; glitchLevel?: GlitchLevel }) {
  const tone = getGlitchTextTone(content);
  return (
    <div className={`comm-glitch-wrap comm-glitch-wrap-${tone} comm-glitch-wrap-level-${glitchLevel} animate-glitch`}>
      <span className={`comm-glitch-text comm-glitch-text-${tone} comm-glitch-text-level-${glitchLevel} font-mono`}>
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

export function AnomalyRecordCard({
  content,
  fallbackTitle = '异常记录',
  tone = 'amber',
}: {
  content: string;
  fallbackTitle?: string;
  tone?: 'amber' | 'blue' | 'red';
}) {
  const { title, body } = splitRecordContent(content, fallbackTitle);
  const toneClass = tone === 'red' ? 'anomaly-card-red' : tone === 'blue' ? 'anomaly-card-blue' : 'anomaly-card-amber';

  return (
    <div className="anomaly-card-wrap animate-fade-in">
      <div className={`anomaly-record-card ${toneClass}`}>
        <div className="anomaly-card-line" />
        <p className="anomaly-card-title">【{title}】</p>
        <div className="anomaly-card-body whitespace-pre-line">{body}</div>
        <div className="anomaly-card-line" />
      </div>
    </div>
  );
}

export function FileDisplay({ content }: { content: string }) {
  const { title, body } = splitRecordContent(content, '系统文件');
  const lines = body.split('\n');

  function renderLine(line: string, index: number) {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="file-record-spacer" aria-hidden />;

    const separatorIndex = trimmed.search(/[：:]/);
    if (separatorIndex > 0) {
      const label = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (label.length <= 18 && value) {
        return (
          <div key={index} className="file-record-row">
            <span className="file-record-label">{label}</span>
            <span className="file-record-value">{value}</span>
          </div>
        );
      }
    }

    return (
      <p key={index} className="file-record-line">
        {line}
      </p>
    );
  }

  return (
    <div className="anomaly-card-wrap file-card-wrap animate-fade-in">
      <div className="file-record-card">
        <div className="file-record-header">
          <svg className="w-4 h-4 text-[#F0A030]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div className="file-record-heading">
            <span className="file-record-kicker">NOVA FILE / DECRYPTED</span>
            <span className="file-record-title">{title}</span>
          </div>
        </div>
        <div className="file-record-body">{lines.map(renderLine)}</div>
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
