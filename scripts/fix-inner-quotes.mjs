import fs from 'fs';
const path = 'src/game/story.ts';
let s = fs.readFileSync(path, 'utf8');

const pairs = [
  [`content: '"第七次连接成功"'`, `content: '\u201c第七次连接成功\u201d'`],
  [`ep('normal_8', 'Nova："不知道，可能只是习惯"',`, `ep('normal_8', 'Nova：\u201c不知道，可能只是习惯\u201d',`],
  [`n('ch3_creep_a3', '这不是"有一点"的程度了'`, `n('ch3_creep_a3', '这不是\u201c有一点\u201d的程度了'`],
  [`n('ch3_creep_merge5', '我暂时还不想因为"疑似精神异常"被塞进去'`, `n('ch3_creep_merge5', '我暂时还不想因为\u201c疑似精神异常\u201d被塞进去'`],
  [`n('ch4_trust_tease4', '醒来之后突然多出一个"熟人"'`, `n('ch4_trust_tease4', '醒来之后突然多出一个\u201c熟人\u201d'`],
];

for (const [from, to] of pairs) {
  if (!s.includes(from)) {
    console.warn('missing:', from.slice(0, 40));
  } else {
    s = s.replace(from, to);
  }
}

// ch3 creep merge4 - 虽然"正常"
s = s.replace(
  /虽然"正常"这个词现在也不太可靠/,
  '虽然\u201c正常\u201d这个词现在也不太可靠',
);

fs.writeFileSync(path, s);
console.log('inner quotes fixed');
