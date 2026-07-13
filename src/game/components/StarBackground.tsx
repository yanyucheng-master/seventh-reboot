import { useEffect, useRef } from 'react';

type StarBackgroundProps = {
  variant?: 'default' | 'menu';
};

export function StarBackground({ variant = 'default' }: StarBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars = Array.from({ length: 200 }, () => ({
      nx: Math.random(),
      ny: Math.random(),
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.00015 + 0.00004,
      opacity: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      flash: Math.random() < 0.08,
      tone: Math.random(),
    }));

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    function animate() {
      time++;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      const grad = ctx!.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, variant === 'menu' ? '#010813' : '#080A0D');
      grad.addColorStop(0.52, variant === 'menu' ? '#061528' : '#0B1012');
      grad.addColorStop(1, variant === 'menu' ? '#010711' : '#08090C');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

      if (variant === 'menu') {
        const coreGlow = ctx!.createRadialGradient(w * 0.5, h * 0.34, 0, w * 0.5, h * 0.34, Math.max(w, h) * 0.52);
        coreGlow.addColorStop(0, 'rgba(24, 91, 145, 0.18)');
        coreGlow.addColorStop(0.38, 'rgba(8, 43, 79, 0.1)');
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx!.fillStyle = coreGlow;
        ctx!.fillRect(0, 0, w, h);
      }

      for (const s of stars) {
        s.ny += s.speed;
        if (s.ny > 1) {
          s.ny = 0;
          s.nx = Math.random();
        }
        const x = s.nx * w;
        const y = s.ny * h;
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.5 + 0.5;
        const flashBoost = s.flash && twinkle > 0.92 ? 1.4 : 1;
        ctx!.beginPath();
        ctx!.arc(x, y, s.r, 0, Math.PI * 2);
        const rgb = variant === 'menu'
          ? (s.tone > 0.86 ? '138,211,255' : '180,216,238')
          : (s.tone > 0.9 ? '226,190,134' : s.tone > 0.72 ? '166,210,190' : '180,210,224');
        const starStrength = variant === 'menu' ? 0.78 : 0.64;
        ctx!.fillStyle = `rgba(${rgb},${s.opacity * twinkle * starStrength * flashBoost})`;
        ctx!.fill();
      }

      const scanY = (time * 0.35) % h;
      const scanGrad = ctx!.createLinearGradient(0, scanY - 8, 0, scanY + 8);
      scanGrad.addColorStop(0, 'rgba(74, 140, 200, 0)');
      scanGrad.addColorStop(0.5, 'rgba(74, 160, 220, 0.05)');
      scanGrad.addColorStop(1, 'rgba(74, 140, 200, 0)');
      ctx!.fillStyle = scanGrad;
      ctx!.fillRect(0, scanY - 8, w, 16);

      const ripplePhase = (time % 480) / 480;
      if (ripplePhase < 0.75) {
        const radius = ripplePhase * Math.min(w, h) * 0.45;
        ctx!.beginPath();
        ctx!.arc(w * 0.5, h * 0.38, radius, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(90, 170, 220, ${0.1 * (1 - ripplePhase)})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      if (variant !== 'menu') {
        const specY = h - 28;
        const barCount = 48;
        const barW = w / barCount;
        for (let i = 0; i < barCount; i++) {
          const barH = 1.5 + Math.abs(Math.sin(time * 0.04 + i * 0.35)) * 5;
          const spectrumColor = i % 11 === 0 ? '211,158,82' : '74,154,166';
          ctx!.fillStyle = `rgba(${spectrumColor}, ${0.05 + Math.sin(time * 0.03 + i * 0.5) * 0.025})`;
          ctx!.fillRect(i * barW + 1, specY - barH, barW - 2, barH);
        }
      }

      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [variant]);

  return (
    <>
      <canvas ref={canvasRef} className="star-canvas" />
      <div className="comm-overlay pointer-events-none" aria-hidden />
    </>
  );
}
