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

  shorten('p0', 1200);
  shorten('p1', 500);
  shorten('p2', 500);
  shorten('p3', 500);
  shorten('p5', 900);
  shorten('p6', 650);
  shorten('p7', 900);
  shorten('p8', 1400);
  shorten('p9', 450);
  shorten('p10', 900);
}
