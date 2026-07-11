import type { StoryNode } from '../game/story';
import type { Locale, StoryLocaleData, StoryLocaleNode } from './types';
import storyZh from './locales/zh-CN/story.json';
import storyEn from './locales/en-US/story.json';

const STORY_BY_LOCALE: Record<Locale, StoryLocaleData> = {
  'zh-CN': storyZh as StoryLocaleData,
  'en-US': storyEn as StoryLocaleData,
};

function resolveNodeText(node: StoryNode, primary?: StoryLocaleNode): string {
  if (primary?.content) return primary.content;
  return node.content;
}

function resolveChoiceText(
  choiceId: string,
  defaultText: string,
  primary?: StoryLocaleNode,
): string {
  const fromPrimary = primary?.choices?.[choiceId];
  if (fromPrimary) return fromPrimary;
  return defaultText;
}

export function applyStoryLocale(baseNodes: StoryNode[], locale: Locale): StoryNode[] {
  const primary = STORY_BY_LOCALE[locale];

  return baseNodes.map(node => {
    const primaryNode = primary.nodes[node.id];
    const content = resolveNodeText(node, primaryNode);

    if (!node.choices?.length) {
      return content === node.content ? node : { ...node, content };
    }

    return {
      ...node,
      content,
      choices: node.choices.map((choice, index) => ({
        ...choice,
        text: resolveChoiceText(
          `${node.id}__${index}`,
          choice.text ?? '',
          primaryNode,
        ),
      })),
    };
  });
}

export function createLocalizedStoryNodeMap(
  baseMap: Map<string, StoryNode>,
  locale: Locale,
): Map<string, StoryNode> {
  const nodes = applyStoryLocale([...baseMap.values()], locale);
  return new Map(nodes.map(node => [node.id, node]));
}
