import { useEffect, useRef } from 'react';

export function StarBackground() {
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
      grad.addColorStop(0, '#0B0E14');
      grad.addColorStop(0.5, '#0D1118');
      grad.addColorStop(1, '#0B0E14');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);

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
        ctx!.fillStyle = `rgba(180,210,255,${s.opacity * twinkle * 0.64 * flashBoost})`;
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

      const specY = h - 28;
      const barCount = 48;
      const barW = w / barCount;
      for (let i = 0; i < barCount; i++) {
        const barH = 1.5 + Math.abs(Math.sin(time * 0.04 + i * 0.35)) * 5;
        ctx!.fillStyle = `rgba(74, 130, 180, ${0.05 + Math.sin(time * 0.03 + i * 0.5) * 0.025})`;
        ctx!.fillRect(i * barW + 1, specY - barH, barW - 2, barH);
      }

      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="star-canvas" />
      <div className="comm-overlay pointer-events-none" aria-hidden />
    </>
  );
}
