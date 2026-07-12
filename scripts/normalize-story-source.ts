import fs from 'node:fs';
import path from 'node:path';
import { encodeStorySource, normalizeStorySourceText } from './story-source-format.ts';

const [sourceArg, ...copyArgs] = process.argv.slice(2);
if (!sourceArg) {
  console.error('Usage: npx tsx scripts/normalize-story-source.ts <source.txt> [copy.txt ...]');
  process.exit(1);
}

const sourcePath = path.resolve(sourceArg);
const raw = fs.readFileSync(sourcePath, 'utf8');
const normalized = normalizeStorySourceText(raw);
const encoded = encodeStorySource(normalized.text);
const targets = [sourcePath, ...copyArgs.map(item => path.resolve(item))];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, encoded);
  console.log(`Wrote UTF-8 BOM + CRLF: ${target}`);
}

const byReason = normalized.removed.reduce<Record<string, number>>((counts, item) => {
  counts[item.reason] = (counts[item.reason] ?? 0) + 1;
  return counts;
}, {});
console.log(`Removed ${normalized.removed.length} structural label lines: ${JSON.stringify(byReason)}`);
