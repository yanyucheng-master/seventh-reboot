import assert from 'node:assert/strict';
import { encodeStorySource, normalizeStorySourceText } from './story-source-format.ts';

const sample = [
  '# 剧情导出',
  '[draft] (系统/草稿)',
  '保留的正文',
  '第二章：日常',
  '第二章：日常',
  '  next: CH2_START',
  '',
  '## 第二章：日常',
  '[CH2_START] (系统/章节)',
  '  next: epi',
  '',
  '### 后记',
  '[epi] (系统/后记)',
  '仍然保留的后记正文',
  '后记',
  '  next: save',
  '',
  '[save] (系统/状态)',
  '归档已保存',
  '结局节点',
  '  next: end',
  '',
  '### 结局节点',
  '[end] (系统/结局)',
  '',
].join('\n');

const normalized = normalizeStorySourceText(sample);
assert.equal(normalized.removed.length, 4);
assert.match(normalized.text, /保留的正文/);
assert.match(normalized.text, /仍然保留的后记正文/);
assert.doesNotMatch(normalized.text, /第二章：日常\n第二章：日常/);
assert.doesNotMatch(normalized.text, /归档已保存\n结局节点/);

const encoded = encodeStorySource(normalized.text);
assert.deepEqual([...encoded.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
assert.match(encoded.toString('utf8'), /\r\n/);

console.log('Story source normalization tests passed.');
