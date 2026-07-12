/** 将数值平滑过渡到目标值，供 NOVA-06 脚本接管时展示可见的参数移动。 */
export function animateValue(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (value: number) => void,
  reducedMotion = false,
): Promise<void> {
  if (from === to) {
    onUpdate(to);
    return Promise.resolve();
  }

  const duration = reducedMotion ? Math.min(durationMs, 420) : durationMs;

  return new Promise(resolve => {
    const startedAt = performance.now();

    function frame(now: number) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 2;
      onUpdate(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        window.requestAnimationFrame(frame);
      } else {
        onUpdate(to);
        resolve();
      }
    }

    window.requestAnimationFrame(frame);
  });
}
