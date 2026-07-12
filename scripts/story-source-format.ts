export type RemovedStructuralLine = {
  line: number;
  text: string;
  reason: 'duplicate-heading' | 'epilogue-label' | 'ending-label';
};

export type NormalizedStorySource = {
  text: string;
  removed: RemovedStructuralLine[];
};

const NODE_HEADER = /^\[([^\]]+)\]\s+\(([^/]+)\/([^)]+)\)$/;

/**
 * Remove exporter labels that were accidentally persisted as node content.
 * Narrative lines, choices, metadata, node ids, and links are left untouched.
 */
export function normalizeStorySourceText(input: string): NormalizedStorySource {
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const removedByIndex = new Map<number, RemovedStructuralLine>();
  let currentType = '';

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nodeMatch = line.match(NODE_HEADER);
    if (nodeMatch) {
      currentType = nodeMatch[3].trim();
      continue;
    }

    if (!line.trim().startsWith('next:')) continue;

    let bodyEnd = index - 1;
    while (bodyEnd >= 0 && !lines[bodyEnd].trim()) bodyEnd -= 1;
    const bodyEndText = lines[bodyEnd]?.trim() ?? '';

    if (currentType === '后记' && bodyEndText === '后记') {
      removedByIndex.set(bodyEnd, {
        line: bodyEnd + 1,
        text: lines[bodyEnd],
        reason: 'epilogue-label',
      });
    } else if (currentType !== '结局' && bodyEndText === '结局节点') {
      removedByIndex.set(bodyEnd, {
        line: bodyEnd + 1,
        text: lines[bodyEnd],
        reason: 'ending-label',
      });
    }

    let nextContent = index + 1;
    while (nextContent < lines.length && !lines[nextContent].trim()) nextContent += 1;
    const headingMatch = lines[nextContent]?.match(/^##\s+(.+)$/);
    if (!headingMatch) continue;

    const heading = headingMatch[1].trim();
    let candidate = index - 1;
    while (candidate >= 0 && lines[candidate].trim() === heading) {
      removedByIndex.set(candidate, {
        line: candidate + 1,
        text: lines[candidate],
        reason: 'duplicate-heading',
      });
      candidate -= 1;
    }
  }

  const removed = [...removedByIndex.values()].sort((a, b) => a.line - b.line);
  const retained = lines.filter((_, index) => !removedByIndex.has(index));
  return { text: retained.join('\n'), removed };
}

/** Encode for reliable Chinese display in Windows editors and PowerShell. */
export function encodeStorySource(text: string): Buffer {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const withFinalNewline = normalized.endsWith('\n') ? normalized : `${normalized}\n`;
  return Buffer.from(`\uFEFF${withFinalNewline.replace(/\n/g, '\r\n')}`, 'utf8');
}
