import fs from 'fs';
import path from 'path';
const story = fs.readFileSync('src/game/story.ts','utf8');
function norm(t) {
  return t.replace(/[\u2018\u2019']/g,'').replace(/[……]/g,'…').replace(/\s+/g,'').replace(/[，,。.！!？?；;：:]/g,'');
}
const desktop = 'C:/Users/YYC/Desktop';
const srcFile = fs.readdirSync(desktop).find(f => f.includes('V1_0') && f.includes('定稿'));
const src = fs.readFileSync(path.join(desktop, srcFile), 'utf8');
const storyN = norm(story);
const lines = src.split(/\r?\n/);
const texts = [];
for (const line of lines) {
  const t = line.trim();
  let m = t.match(/^Nova[：:](.+)$/);
  if (m) texts.push(m[1].trim());
  if (t.startsWith('- ')) texts.push(t.slice(2).trim());
  if (t.startsWith('【选择：') && t.endsWith('】')) texts.push(t.slice(4,-1).trim());
  m = t.match(/^\[系统\]\s*(.+)$/);
  if (m) texts.push(m[1].trim());
}
const uniq = [...new Set(texts)].filter(x => x.length >= 2 && x.length < 200);
const missing = uniq.filter(x => !storyN.includes(norm(x)));
fs.writeFileSync('scripts/missing-texts.json', JSON.stringify(missing, null, 2));
console.log('missing', missing.length);
