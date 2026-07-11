import type { CSSProperties } from 'react';

type SignalWaveformProps = {
  value: number;
  seed: number;
  active: boolean;
  recovered: boolean;
  reducedMotion: boolean;
  label: string;
};

export function SignalWaveform({
  value,
  seed,
  active,
  recovered,
  reducedMotion,
  label,
}: SignalWaveformProps) {
  const bars = Array.from({ length: 44 }, (_, index) => {
    const carrier = Math.sin((index + seed) * 0.56 + value * 0.035);
    const harmonic = Math.sin((index + seed * 2) * 0.19 - value * 0.018);
    return Math.max(10, Math.min(94, 42 + carrier * 27 + harmonic * 17));
  });

  return (
    <div
      className={`signal-waveform ${active ? 'signal-waveform-active' : ''} ${recovered ? 'signal-waveform-recovered' : ''} ${reducedMotion ? 'signal-waveform-static' : ''}`}
      role="img"
      aria-label={label}
    >
      {bars.map((height, index) => (
        <span
          key={index}
          style={{
            '--signal-height': `${height}%`,
            '--signal-delay': `${(index % 9) * 38}ms`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
