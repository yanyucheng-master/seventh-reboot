import { useEffect, useRef } from 'react';

export type BulkheadGasMode = 'leak' | 'sealed' | 'pressurize' | 'vent' | 'purge';

type BulkheadGasLayerProps = {
  mode: BulkheadGasMode;
  reducedMotion: boolean;
};

type GasParticle = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  size: number;
  depth: number;
  warmth: number;
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createParticle(mode: BulkheadGasMode, width: number, height: number): GasParticle {
  const depth = randomBetween(0.35, 1);
  const centerY = height * randomBetween(0.31, 0.54);
  const maxLife = randomBetween(420, 980);

  if (mode === 'pressurize') {
    return {
      x: width * randomBetween(0.72, 0.9),
      y: centerY,
      velocityX: -randomBetween(0.12, 0.22) * depth,
      velocityY: randomBetween(-0.018, 0.018),
      life: maxLife,
      maxLife,
      size: randomBetween(8, 24),
      depth,
      warmth: 0,
    };
  }

  if (mode === 'purge') {
    const direction = Math.random() > 0.5 ? 1 : -1;
    return {
      x: width * randomBetween(0.43, 0.57),
      y: centerY,
      velocityX: direction * randomBetween(0.16, 0.34) * depth,
      velocityY: randomBetween(-0.05, 0.05),
      life: maxLife,
      maxLife,
      size: randomBetween(12, 34),
      depth,
      warmth: randomBetween(0.45, 1),
    };
  }

  return {
    x: width * randomBetween(0.4, 0.56),
    y: centerY,
    velocityX: -randomBetween(mode === 'sealed' ? 0.025 : 0.1, mode === 'sealed' ? 0.06 : 0.2) * depth,
    velocityY: randomBetween(-0.025, 0.025),
    life: maxLife,
    maxLife,
    size: randomBetween(mode === 'sealed' ? 5 : 8, mode === 'sealed' ? 13 : 26),
    depth,
    warmth: mode === 'vent' ? randomBetween(0.2, 0.65) : 0,
  };
}

function spawnRate(mode: BulkheadGasMode): number {
  if (mode === 'purge') return 3.8;
  if (mode === 'pressurize' || mode === 'vent') return 1.1;
  if (mode === 'leak') return 0.7;
  return 0.08;
}

export function BulkheadGasLayer({ mode, reducedMotion }: BulkheadGasLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 1;
    let height = 1;
    let animationFrame = 0;
    let lastFrame = performance.now();
    let spawnCarry = 0;
    const particles: GasParticle[] = [];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawParticle = (particle: GasParticle) => {
      const lifeRatio = Math.max(0, particle.life / particle.maxLife);
      const alpha = Math.sin(Math.PI * lifeRatio) * (0.08 + particle.depth * 0.2);
      const cyan = `rgba(${Math.round(122 + particle.warmth * 105)}, ${Math.round(220 - particle.warmth * 90)}, ${Math.round(235 - particle.warmth * 120)}, ${alpha})`;
      const tail = Math.max(8, particle.size * (1.6 + particle.depth));
      const gradient = context.createLinearGradient(
        particle.x,
        particle.y,
        particle.x - Math.sign(particle.velocityX || 1) * tail,
        particle.y,
      );
      gradient.addColorStop(0, cyan);
      gradient.addColorStop(1, 'rgba(80, 190, 205, 0)');
      context.strokeStyle = gradient;
      context.lineWidth = Math.max(0.65, particle.depth * 1.9);
      context.shadowBlur = particle.size * 0.4;
      context.shadowColor = cyan;
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.quadraticCurveTo(
        particle.x - Math.sign(particle.velocityX || 1) * tail * 0.48,
        particle.y + Math.sin(particle.x * 0.08) * particle.size * 0.16,
        particle.x - Math.sign(particle.velocityX || 1) * tail,
        particle.y + particle.velocityY * 70,
      );
      context.stroke();
    };

    const drawFrame = (now: number) => {
      const deltaMs = Math.min(48, Math.max(0, now - lastFrame));
      lastFrame = now;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'screen';

      if (!reducedMotion) {
        spawnCarry += spawnRate(mode) * deltaMs / 16.67;
        while (spawnCarry >= 1) {
          particles.push(createParticle(mode, width, height));
          spawnCarry -= 1;
        }
      } else if (particles.length === 0) {
        const staticCount = mode === 'sealed' ? 3 : mode === 'purge' ? 16 : 9;
        for (let index = 0; index < staticCount; index += 1) {
          const particle = createParticle(mode, width, height);
          particle.x += particle.velocityX * randomBetween(80, 280);
          particles.push(particle);
        }
      }

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        if (!reducedMotion) {
          particle.x += particle.velocityX * deltaMs;
          particle.y += particle.velocityY * deltaMs;
          particle.velocityY += Math.sin((now + index * 47) * 0.004) * 0.00035;
          particle.life -= deltaMs;
        }
        drawParticle(particle);
        if (!reducedMotion && particle.life <= 0) particles.splice(index, 1);
      }

      context.shadowBlur = 0;
      context.globalCompositeOperation = 'source-over';
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(drawFrame);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) drawFrame(performance.now());
    });
    resizeObserver.observe(canvas);
    resize();
    drawFrame(performance.now());

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [mode, reducedMotion]);

  return <canvas ref={canvasRef} className="bulkhead-gas-canvas" aria-hidden />;
}
