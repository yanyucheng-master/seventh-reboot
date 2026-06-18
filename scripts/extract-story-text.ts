import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { storyNodes } from '../src/game/story.ts';

const VERSION = 'v1.0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', '第七次重启-剧情文本.txt');

const speakerLabel: Record<string, string> = {
  nova: 'Nova',
  system: '系统',
  player: '玩家',
};

const lines: string[] = [
  `# 第七次重启 · 剧情文本导出`,
  `版本：${VERSION}`,
  `节点数：${storyNodes.length}`,
  `生成时间：${new Date().toISOString()}`,
  '',
  '---',
  '',
];

for (const node of storyNodes) {
  const sp = speakerLabel[node.speaker] ?? node.speaker;
  lines.push(`[${node.id}] (${sp}/${node.type})`);
  if (node.content) lines.push(node.content);
  if (node.choices?.length) {
    for (const ch of node.choices) lines.push(`  → ${ch.text} [${ch.nextId}]`);
  }
  if (node.nextId) lines.push(`  next: ${node.nextId}`);
  lines.push('');
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${storyNodes.length} nodes to ${outPath}`);
