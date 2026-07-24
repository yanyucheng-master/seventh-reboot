export function ObserverEchoLayer({ content }: { content: string | null }) {
  if (!content) return null;

  return (
    <div className="observer-echo-layer" aria-live="polite" aria-atomic="true">
      <span className="observer-echo-text" data-text={content}>
        {Array.from(content).map((glyph, index) => (
          <span
            key={`${glyph}-${index}`}
            className={`observer-echo-glyph ${index % 3 === 1 ? 'observer-echo-glyph-early' : ''}`}
          >
            {glyph === ' ' ? '\u00a0' : glyph}
          </span>
        ))}
      </span>
    </div>
  );
}
