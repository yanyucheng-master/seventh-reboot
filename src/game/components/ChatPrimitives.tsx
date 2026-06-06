export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bubble-nova w-fit">
      {[0, 200, 400].map(d => (
        <span
          key={d}
          className="w-2 h-2 rounded-full bg-[#8B949E] animate-typing-bounce"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

export function ChapterBanner({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 animate-fade-in">
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#F0A030] to-transparent" />
      <h2 className="text-lg font-medium text-[#F0A030] tracking-widest">{title}</h2>
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#F0A030] to-transparent" />
    </div>
  );
}

export function GlitchText({ content }: { content: string }) {
  return (
    <div className="text-center py-3 animate-glitch">
      <span className="text-red-400 font-mono text-sm tracking-wider font-medium">{content}</span>
    </div>
  );
}

export function FileDisplay({ content }: { content: string }) {
  const parts = content.split('||');
  const title = parts[0];
  const body = parts.slice(1).join('||');
  return (
    <div className="flex flex-col gap-1.5 max-w-[320px]">
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
    <div className="flex justify-center py-2 animate-fade-in">
      <span className="text-[#8B949E] text-xs font-light tracking-wide">{content}</span>
    </div>
  );
}
