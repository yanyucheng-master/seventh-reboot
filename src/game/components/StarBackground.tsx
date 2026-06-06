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
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.2 + 0.05,
      opacity: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
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
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const grad = ctx!.createLinearGradient(0, 0, 0, canvas!.height);
      grad.addColorStop(0, '#0B0E14');
      grad.addColorStop(0.5, '#0D1118');
      grad.addColorStop(1, '#0B0E14');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (const s of stars) {
        s.y += s.speed;
        if (s.y > canvas!.height) {
          s.y = 0;
          s.x = Math.random() * canvas!.width;
        }
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.5 + 0.5;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(200,220,255,${s.opacity * twinkle * 0.8})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="star-canvas" />;
}
