import fs from 'fs';
const path = 'src/game/story.ts';
let s = fs.readFileSync(path, 'utf8');
s = s.replace(
  /n\('ch4_trust_tease2b', '但你要理解', 'normal', 600, 'ch4_trust_tease2'\),/,
  "n('ch4_trust_tease2b', '但你要理解', 'normal', 600, 'ch4_trust_tease4'),",
);
s = s.replace(
  /n\('ch4_trust_tease2', '虽然突然多出一个.熟人.，正常人都会警惕吧。', 'normal', 1000, 'ch4_trust5'\),/,
  `n('ch4_trust_tease4', '醒来之后突然多出一个"熟人"', 'normal', 800, 'ch4_trust_tease5'),
  n('ch4_trust_tease5', '这事正常人都会警惕吧', 'normal', 900, 'ch4_trust_merge'),`,
);
fs.writeFileSync(path, s);
console.log('fixed');
