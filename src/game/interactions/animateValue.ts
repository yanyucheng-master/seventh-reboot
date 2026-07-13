/** 将数值平滑过渡到目标值，供 NOVA-06 脚本接管时展示可见的参数移动。 */
export function animateValue(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (value: number) => void,
  reducedMotion = false,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  if (from === to) {
    onUpdate(to);
    return Promise.resolve();
  }

  const duration = reducedMotion ? Math.min(durationMs, 420) : durationMs;

  return new Promise(resolve => {
    const startedAt = performance.now();
    let frameId = 0;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    };

    const handleAbort = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      finish();
    };

    function frame(now: number) {
      if (signal?.aborted) {
        finish();
        return;
      }
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 2;
      onUpdate(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(frame);
      } else {
        onUpdate(to);
        finish();
      }
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
    frameId = window.requestAnimationFrame(frame);
  });
}

export function waitForAbortableDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted || delayMs <= 0) return Promise.resolve();
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, delayMs);
    signal?.addEventListener('abort', finish, { once: true });
  });
}
