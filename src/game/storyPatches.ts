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

/** Mobile-only prologue pacing and comm-log presentation tweaks. */
export function applyMobileStoryPatches(storyNodeMap: Map<string, StoryNode>) {
  if (patched || !isMobileEnvironment()) return;
  patched = true;

  storyNodeMap.set('p0', {
    id: 'p0',
    speaker: 'system',
    type: 'comm-log',
    content:
      '[UNKNOWN SIGNAL]\n[未知通讯请求]\nSOURCE · 来源：无法识别\nSIGNAL · 信号强度：微弱\nSTATUS · 状态：等待接入',
    delay: 1400,
    nextId: 'p4',
  } as StoryNode);

  storyNodeMap.set('p4', {
    id: 'p4',
    speaker: 'player',
    type: 'choice',
    content: '',
    choices: [
      { text: '接入通讯', nextId: 'p5' },
      { text: '拒绝', nextId: 'p5_reject' },
    ],
  });

  storyNodeMap.set('p5', {
    id: 'p5',
    speaker: 'system',
    type: 'status',
    content: '正在建立连接……',
    delay: 1100,
    nextId: 'p6',
  });

  storyNodeMap.set('p6', {
    id: 'p6',
    speaker: 'system',
    type: 'status',
    content: '连接建立',
    delay: 500,
    nextId: 'p7',
  });

  storyNodeMap.set('p7', {
    id: 'p7',
    speaker: 'system',
    type: 'delay',
    content: '',
    delay: 600,
    nextId: 'p8',
  });

  storyNodeMap.set('p8', {
    id: 'p8',
    speaker: 'system',
    type: 'typing',
    content: '',
    delay: 1800,
    nextId: 'p9',
  });

  storyNodeMap.set('p9', {
    id: 'p9',
    speaker: 'system',
    type: 'status',
    content: '消息发送失败',
    delay: 450,
    nextId: 'p10',
  });

  storyNodeMap.set('p10', {
    id: 'p10',
    speaker: 'system',
    type: 'typing',
    content: '',
    delay: 1200,
    nextId: 'p11',
  });

  storyNodeMap.set('p11', {
    id: 'p11',
    speaker: 'nova',
    type: 'text',
    content: '你好？',
    emotion: 'normal',
    delay: 600,
    nextId: 'p11_t',
  });

  storyNodeMap.set('p11_t', {
    id: 'p11_t',
    speaker: 'system',
    type: 'typing',
    content: '',
    delay: 900,
    nextId: 'p12',
  });

  storyNodeMap.set('p12', {
    id: 'p12',
    speaker: 'nova',
    type: 'text',
    content: '等等。',
    emotion: 'normal',
    delay: 500,
    nextId: 'p12_t',
  });

  storyNodeMap.set('p12_t', {
    id: 'p12_t',
    speaker: 'system',
    type: 'typing',
    content: '',
    delay: 900,
    nextId: 'p13',
  });
}
