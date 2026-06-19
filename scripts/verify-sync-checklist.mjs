import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const storyPath = path.join(root, 'src/game/story.ts');
const txtPath = path.join(root, '第七次重启-剧情文本.txt');
const story = fs.readFileSync(storyPath, 'utf8');
const txt = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf8') : '';

const must = [
  'Aurora 号的主体物理状态',
  '不是上一轮直接留下来的花',
  '最低限度航行数据不会被完全清空',
  '记忆偏移分支',
  '外部记忆索引释放被拒绝',
  '关闭握手失败',
  'Observer-01 不具备协议控制权限',
];
const mustNot = [
  'Observer-01权限覆盖',
  '最终执行权限',
  '未答对分支',
  'Trust +1',
  'Memory +1',
  'V1.1',
  'V1.9',
  'V2.0',
];
const endings = ['FINALE_DECISION_END', 'FINALE_START', 'NORMAL_END_START', 'BAD_END_START'];

const report = {
  must: Object.fromEntries(must.map((k) => [k, (story.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length])),
  mustNotStory: Object.fromEntries(mustNot.map((k) => [k, (story.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length])),
  mustNotTxt: Object.fromEntries(mustNot.map((k) => [k, (txt.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length])),
  endings: Object.fromEntries(endings.map((k) => [k, (story.match(new RegExp(k, 'g')) || []).length])),
  ch3_ref16: /ch3_ref16[\s\S]{0,600}statEffect: 'none'/.test(story),
  ch4_27: /ch4_27[\s\S]{0,600}statEffect: 'none'/.test(story),
  timed6s: (story.match(/choiceTimeoutMs: 6000/g) || []).length,
  storyVersion: (story.match(/STORY_VERSION|VERSION = 'V1\.0'/g) || []).length,
};
console.log(JSON.stringify(report, null, 2));
