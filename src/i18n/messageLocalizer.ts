import type { StoryNode } from '../game/story';
import { formatChoiceText } from '../game/format';
import type {
  DisplayMessage,
  DisplayMessageUiKind,
  MemoryAnchorId,
} from '../game/types';
import type { StoryLocaleData } from './types';
import storyZh from './locales/zh-CN/story.json';
import storyEn from './locales/en-US/story.json';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const STORY_LOCALES: StoryLocaleData[] = [
  storyZh as StoryLocaleData,
  storyEn as StoryLocaleData,
];

const MEMORY_ANCHOR_IDS: MemoryAnchorId[] = [
  'n7',
  'milk_candy',
  'white_flower',
  'first_message',
  'goodnight',
  'observatory',
  'maintenance_board',
  'steak',
];

function buildContentToNodeIdIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const locale of STORY_LOCALES) {
    for (const [id, node] of Object.entries(locale.nodes)) {
      if (node.content) index.set(node.content, id);
    }
  }
  return index;
}

function buildChoiceTextIndex(): Map<string, { nodeId: string; index: number }> {
  const index = new Map<string, { nodeId: string; index: number }>();
  for (const locale of STORY_LOCALES) {
    for (const [id, node] of Object.entries(locale.nodes)) {
      if (!node.choices) continue;
      const entries = Object.entries(node.choices);
      for (const [choiceKey, text] of entries) {
        const match = choiceKey.match(/__(\d+)$/);
        const choiceIndex = match ? Number(match[1]) : entries.findIndex(([key]) => key === choiceKey);
        if (choiceIndex < 0) continue;
        index.set(formatChoiceText(text), { nodeId: id, index: choiceIndex });
        index.set(text, { nodeId: id, index: choiceIndex });
      }
    }
  }
  return index;
}

const CONTENT_TO_NODE_ID = buildContentToNodeIdIndex();
const CHOICE_TEXT_INDEX = buildChoiceTextIndex();

function parseSourceFromMessageId(
  message: DisplayMessage,
): Pick<DisplayMessage, 'sourceNodeId' | 'sourceChoiceIndex' | 'uiKind' | 'memoryAnchor'> {
  const { id } = message;

  const memoryMatch = id.match(/^memory_anchor_([a-z0-9_]+)_(\d+)$/);
  if (memoryMatch) {
    const anchor = memoryMatch[1] as MemoryAnchorId;
    if (MEMORY_ANCHOR_IDS.includes(anchor)) {
      return { uiKind: 'memoryRecorded', memoryAnchor: anchor };
    }
  }

  const syncMatch = id.match(/^time_sync_(.+)_(\d+)$/);
  if (syncMatch) {
    return { uiKind: 'syncNext', sourceNodeId: syncMatch[1] };
  }

  const timeoutMatch = id.match(/^choice_timeout_(.+)_(\d+)$/);
  if (timeoutMatch) {
    return { uiKind: 'choiceTimeout', sourceNodeId: timeoutMatch[1] };
  }

  if (/^player_\d+$/.test(id)) {
    const hit = CHOICE_TEXT_INDEX.get(message.content);
    if (hit) return { sourceNodeId: hit.nodeId, sourceChoiceIndex: hit.index };
    return {};
  }

  const nodeMatch = id.match(/^(.+)_(\d+)$/);
  if (nodeMatch) {
    return { sourceNodeId: nodeMatch[1] };
  }

  return {};
}

function inferLegacySource(
  message: DisplayMessage,
): Pick<DisplayMessage, 'sourceNodeId' | 'sourceChoiceIndex' | 'uiKind' | 'memoryAnchor'> {
  if (message.uiKind || message.sourceNodeId != null || message.memoryAnchor) {
    return {
      sourceNodeId: message.sourceNodeId,
      sourceChoiceIndex: message.sourceChoiceIndex,
      uiKind: message.uiKind,
      memoryAnchor: message.memoryAnchor,
    };
  }

  if (message.type === 'memory-anchor') {
    const fromId = parseSourceFromMessageId(message);
    if (fromId.memoryAnchor) return fromId;
  }

  if (message.speaker === 'player') {
    const hit = CHOICE_TEXT_INDEX.get(message.content);
    if (hit) return { sourceNodeId: hit.nodeId, sourceChoiceIndex: hit.index };
  }

  if (message.content) {
    const nodeId = CONTENT_TO_NODE_ID.get(message.content);
    if (nodeId) return { sourceNodeId: nodeId };
  }

  return parseSourceFromMessageId(message);
}

function resolveUiContent(
  uiKind: DisplayMessageUiKind,
  memoryAnchor: MemoryAnchorId | undefined,
  t: Translate,
  memoryAnchorLabels: Record<MemoryAnchorId, string>,
): string {
  switch (uiKind) {
    case 'syncNext':
      return t('game.syncNext');
    case 'choiceTimeout':
      return t('game.choiceTimeout');
    case 'memoryRecorded': {
      const label = memoryAnchor ? memoryAnchorLabels[memoryAnchor] : '';
      return t('game.memoryRecorded', { label });
    }
    default:
      return '';
  }
}

export function relocalizeDisplayMessages(
  messages: DisplayMessage[],
  storyNodeMap: Map<string, StoryNode>,
  t: Translate,
  memoryAnchorLabels: Record<MemoryAnchorId, string>,
): DisplayMessage[] {
  return messages.map(message => {
    const inferred = inferLegacySource(message);
    const sourceNodeId = inferred.sourceNodeId ?? message.sourceNodeId;
    const sourceChoiceIndex = inferred.sourceChoiceIndex ?? message.sourceChoiceIndex;
    const uiKind = inferred.uiKind ?? message.uiKind;
    const memoryAnchor = inferred.memoryAnchor ?? message.memoryAnchor;

    let content = message.content;

    if (uiKind) {
      content = resolveUiContent(uiKind, memoryAnchor, t, memoryAnchorLabels);
    } else if (message.speaker === 'player' && sourceNodeId != null && sourceChoiceIndex != null) {
      const choice = storyNodeMap.get(sourceNodeId)?.choices?.[sourceChoiceIndex];
      if (choice?.text) content = formatChoiceText(choice.text);
    } else if (sourceNodeId) {
      const node = storyNodeMap.get(sourceNodeId);
      if (node && message.type !== 'end') {
        content = node.content;
      }
    }

    if (
      content === message.content &&
      sourceNodeId === message.sourceNodeId &&
      sourceChoiceIndex === message.sourceChoiceIndex &&
      uiKind === message.uiKind &&
      memoryAnchor === message.memoryAnchor
    ) {
      return message;
    }

    return {
      ...message,
      content,
      sourceNodeId,
      sourceChoiceIndex,
      uiKind,
      memoryAnchor,
    };
  });
}

export function relocalizeChapterBanner(
  banner: string | null,
  storyNodeMap: Map<string, StoryNode>,
): string | null {
  if (!banner) return null;
  const nodeId = CONTENT_TO_NODE_ID.get(banner);
  if (!nodeId) return banner;
  return storyNodeMap.get(nodeId)?.content ?? banner;
}
