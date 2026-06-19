import fs from 'fs';
const story = fs.readFileSync('src/game/story.ts', 'utf8');
const norm = (t) =>
  t.replace(/[\u2018\u2019']/g, '')
    .replace(/[……]/g, '…')
    .replace(/\s+/g, '')
    .replace(/[，,。.！!？?；;：:]/g, '');

const srcLine = '“已经第七次了？”';
console.log('source chars', [...srcLine].map((c) => c.charCodeAt(0).toString(16)));

const idx = story.indexOf('已经第七次了');
console.log('story idx', idx);
if (idx >= 0) {
  const snip = story.slice(idx - 3, idx + 12);
  console.log('snippet', JSON.stringify(snip));
  console.log('chars', [...snip].map((c) => c.charCodeAt(0).toString(16)));
}

console.log('norm source', norm(srcLine));
console.log('story includes norm?', story.includes(norm(srcLine)));

// find all content with 已经第七次
const re = /content:\s*'([^']*已经第七次[^']*)'/g;
let m;
while ((m = re.exec(story))) console.log('node content', JSON.stringify(m[1]));
