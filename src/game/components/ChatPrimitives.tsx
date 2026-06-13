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

export function GlitchText({ content }: { content: string }) {
  return (
    <div className="flex justify-center py-1 animate-glitch">
      <span className="comm-glitch-text font-mono text-xs tracking-wider">{content}</span>
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

export function FileDisplay({ content }: { content: string }) {
  const parts = content.split('||');
  const title = parts[0];
  const body = parts.slice(1).join('||');
  return (
    <div className="flex flex-col gap-1.5 max-w-[min(320px,88vw)]">
      <div className="bg-[#1A2236] border border-[#2A3550] rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#F0A030]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs text-[#E2E8F0] font-medium">{title}</span>
        </div>
        <div className="text-xs text-[#94A3B8] font-mono whitespace-pre-wrap leading-relaxed pl-6">{body}</div>
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
