import { useEffect } from 'react';

/** Scroll callback invoked when the mobile keyboard opens/closes. */
export function useVisualViewport(onResize: () => void) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateOffset = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height);
      document.documentElement.style.setProperty('--keyboard-offset', `${offset}px`);
      onResize();
    };

    viewport.addEventListener('resize', updateOffset);
    viewport.addEventListener('scroll', updateOffset);
    updateOffset();

    return () => {
      viewport.removeEventListener('resize', updateOffset);
      viewport.removeEventListener('scroll', updateOffset);
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
    };
  }, [onResize]);
}
