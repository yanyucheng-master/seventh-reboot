import type { StoryNode } from './story';

let patched = false;

function isMobileEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = window.innerWidth <= 768;
  const isCapacitor =
    !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform?.();
  return isCapacitor || (hasCoarsePointer && isSmallScreen);
}

/** Mobile-only pacing tweaks. Story content stays sourced from story.ts. */
export function applyMobileStoryPatches(storyNodeMap: Map<string, StoryNode>) {
  if (patched || !isMobileEnvironment()) return;
  patched = true;

  const shorten = (id: string, delay: number) => {
    const node = storyNodeMap.get(id);
    if (node) storyNodeMap.set(id, { ...node, delay });
  };

  shorten('PRO-0001', 1200);
  shorten('PRO-0002', 450);
  shorten('PRO-0003', 900);
}
