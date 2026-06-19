import fs from 'fs';
const path = 'src/game/story.ts';
let s = fs.readFileSync(path, 'utf8');

// p_log5 curly quotes
s = s.replace(
  `content: '"第七次连接成功"'`,
  `content: '\u201c第七次连接成功\u201d'`,
);

// normal_8
s = s.replace(
  `ep('normal_8', 'Nova："不知道，可能只是习惯"',`,
  `ep('normal_8', 'Nova：\u201c不知道，可能只是习惯\u201d',`,
);

// ch5b_far18e mixed quotes
s = s.replace(
  `n('ch5b_far18e', '"连我曾经努力过这件事都不记得"',`,
  `n('ch5b_far18e', '\u201c连我曾经努力过这件事都不记得\u201d',`,
);

// Inner quote fixes (straight -> curly)
const innerQuotes = [
  ['正常人不会把"第一次见面"叫成第七次', '正常人不会把\u201c第一次见面\u201d叫成第七次'],
  ['醒来之后突然多出一个"熟人"', '醒来之后突然多出一个\u201c熟人\u201d'],
  ['这不是"有一点"的程度了', '这不是\u201c有一点\u201d的程度了'],
  ['虽然"正常"这个词现在也不太可靠', '虽然\u201c正常\u201d这个词现在也不太可靠'],
  ['我暂时还不想因为"疑似精神异常"被塞进去', '我暂时还不想因为\u201c疑似精神异常\u201d被塞进去'],
  ['"只是忘了"。', '\u201c只是忘了\u201d。'],
];

for (const [from, to] of innerQuotes) {
  s = s.split(from).join(to);
}

// === CH2 obs section ===
const oldObs = `  c('ch2_obs6', [
    { text: '【你不会真喝了吧？】', nextId: 'ch2_obs_pretty' },
    { text: '【每天都能看？】', nextId: 'ch2_obs_daily' },
    { text: '【不会看腻吗】', nextId: 'ch2_obs_tired' },
  ]),
  n('ch2_obs_pretty', '然后我还是喝了', 'smile', 600, 'ch2_obs_pretty2'),
  n('ch2_obs_pretty2', '难喝得像发动机冷却液', 'normal', 700, 'ch2_obs_pretty3'),
  n('ch2_obs_pretty3', '对了', 'smile', 800, 'ch2_obs_merge'),`;

const newObs = `  c('ch2_obs6', [
    { text: '【真漂亮】', nextId: 'ch2_obs_pretty' },
    { text: '【每天都能看？】', nextId: 'ch2_obs_daily' },
    { text: '【不会看腻吗】', nextId: 'ch2_obs_tired' },
  ]),
  n('ch2_obs_pretty', '是吧', 'smile', 600, 'ch2_obs_pretty1'),
  n('ch2_obs_pretty1', '我第一次看到的时候', 'normal', 600, 'ch2_obs_pretty2'),
  n('ch2_obs_pretty2', '差点忘了自己还在值班', 'smile', 800, 'ch2_obs_merge'),`;

if (!s.includes(oldObs)) throw new Error('obs6 block not found');
s = s.replace(oldObs, newObs);

s = s.replace(
  `n('ch2_obs_merge', '我刚在抽屉里找到三颗牛奶糖', 'normal', 600, 'ch2_obs10'),`,
  `n('ch2_obs_merge', '比如现在', 'normal', 600, 'ch2_obs_merge0'),
  n('ch2_obs_merge0', '我总会想', 'normal', 600, 'ch2_obs10'),`,
);

// Remove duplicate 我总会想 chain if exists
s = s.replace(
  `n('ch2_obs10', '我总会想', 'normal', 600, 'ch2_obs11'),
  n('ch2_obs11', '那些星星后面', 'normal', 600, 'ch2_obs12'),`,
  `n('ch2_obs10', '那些星星后面', 'normal', 600, 'ch2_obs12'),`,
);

const oldObs13 = `  c('ch2_obs13', [
    { text: '【早点休息】', nextId: 'ch2_obs_maybe', trustDelta: 1 },
    { text: '【辛苦了】', nextId: 'ch2_obs_watch', trustDelta: 1 },
    { text: '【宇宙太大了】', nextId: 'ch2_obs_big' },
  ]),
  n('ch2_obs_maybe', '我也想', 'normal', 500, 'ch2_obs_maybe2'),
  n('ch2_obs_maybe2', '但先让我把这件事说完', 'normal', 600, 'ch2_obs_maybe3'),
  n('ch2_obs_maybe3', '这里好像就没那么安静了', 'smile', 800, 'ch2_obs_merge2'),
  n('ch2_obs_watch', '嗯', 'smile', 700, 'ch2_obs_watch2'),
  n('ch2_obs_watch2', '今天确实有点累', 'normal', 700, 'ch2_obs_watch3'),
  n('ch2_obs_watch3', '听起来压力很大', 'smile', 800, 'ch2_obs_merge2'),`;

const newObs13 = `  c('ch2_obs13', [
    { text: '【也许有】', nextId: 'ch2_obs_maybe' },
    { text: '【说不定正在看你】', nextId: 'ch2_obs_watch_you' },
    { text: '【宇宙太大了】', nextId: 'ch2_obs_big' },
  ]),
  n('ch2_obs_maybe', '也许吧', 'normal', 600, 'ch2_obs_maybe2'),
  n('ch2_obs_maybe2', '这样想的话', 'normal', 600, 'ch2_obs_maybe3'),
  n('ch2_obs_maybe3', '这里好像就没那么安静了', 'smile', 800, 'ch2_obs_merge2'),
  n('ch2_obs_watch_you', '那希望我现在表情别太傻', 'smile', 600, 'ch2_obs_watch_you2'),
  n('ch2_obs_watch_you2', '被宇宙围观这种事', 'normal', 700, 'ch2_obs_watch_you3'),
  n('ch2_obs_watch_you3', '听起来压力很大', 'smile', 800, 'ch2_obs_merge2'),`;

if (!s.includes(oldObs13)) throw new Error('obs13 block not found');
s = s.replace(oldObs13, newObs13);

// === CH2 forget section ===
const oldForget = `  c('ch2_forget7', [
    { text: '【现在愿意告诉我了？】', nextId: 'ch2_forget_why' },
    { text: '【找回记忆不就行了】', nextId: 'ch2_forget_find' },
    { text: '【顺其自然】', nextId: 'ch2_forget_let' },
  ]),
  n('ch2_forget_why', '我最近总有种感觉', 'normal', 600, 'ch2_forget_why2'),
  n('ch2_forget_why2', '好像有什么事正在发生', 'normal', 600, 'ch2_forget_why3'),
  n('ch2_forget_why3', '但我不知道是什么', 'normal', 800, 'ch2_forget_why4'),
  n('ch2_forget_why4', '像是……', 'normal', 800, 'ch2_forget_merge'),`;

const newForget = `  c('ch2_forget7', [
    { text: '【你怎么突然问这个？】', nextId: 'ch2_forget_why' },
    { text: '【找回记忆不就行了】', nextId: 'ch2_forget_find' },
    { text: '【顺其自然】', nextId: 'ch2_forget_let' },
  ]),
  n('ch2_forget_why', '没什么', 'normal', 600, 'ch2_forget_why2'),
  n('ch2_forget_why2', '就是突然想到', 'normal', 600, 'ch2_forget_why3'),
  n('ch2_forget_why3', '最近我总觉得自己忘了点什么', 'normal', 800, 'ch2_forget_why4'),
  n('ch2_forget_why4', '但又说不上来是什么', 'normal', 800, 'ch2_forget_merge'),`;

if (!s.includes(oldForget)) throw new Error('forget block not found');
s = s.replace(oldForget, newForget);

s = s.replace(
  `n('ch2_forget_merge', '站在悬崖边', 'normal', 600, 'ch2_forget_merge2'),
  n('ch2_forget_merge2', '却看不见下面', 'normal', 600, 'ch2_forget_merge3'),
  n('ch2_forget_merge3', '我记性一直不算好', 'normal', 600, 'ch2_forget_merge4'),
  n('ch2_forget_merge4', '但这次感觉不太一样', 'normal', 800, 'ch2_forget11'),`,
  `n('ch2_forget_merge', '算了', 'normal', 600, 'ch2_forget_merge2'),
  n('ch2_forget_merge2', '可能只是最近睡太少', 'normal', 600, 'ch2_forget_merge3'),
  n('ch2_forget_merge3', '我记性一直不算好', 'normal', 600, 'ch2_forget_merge4'),
  n('ch2_forget_merge4', '但这次感觉不太一样', 'normal', 800, 'ch2_forget11'),`,
);

s = s.replace(
  `c('ch2_forget11', [
    { text: '【那是什么感觉？】', nextId: 'ch2_forget12' },
  ]),`,
  `c('ch2_forget11', [
    { text: '【会不会是熬夜熬的？】', nextId: 'ch2_dream18' },
  ]),`,
);

// ch2 candy N7 branch
s = s.replace(
  `n('ch2_candy_n7', '？', 'smile', 600, 'ch2_candy_n7b'),
  n('ch2_candy_n7b', '等等', 'smile', 400, 'ch2_candy_n7c'),
  n('ch2_candy_n7c', '我和你说过 N7 吗？', 'smile', 600, 'ch2_candy_n7d'),
  n('ch2_candy_n7d', '结果债主都不在了', 'normal', 700, 'ch2_candy_n7e'),`,
  `n('ch2_candy_n7', '你居然还记得这个', 'smile', 600, 'ch2_candy_n7b'),
  n('ch2_candy_n7b', '对', 'smile', 400, 'ch2_candy_n7c'),
  n('ch2_candy_n7c', '那只猫欠了我好多年', 'smile', 600, 'ch2_candy_n7d'),
  n('ch2_candy_n7d', '结果债主都不在了', 'normal', 700, 'ch2_candy_n7e'),`,
);

s = s.replace(
  `{ text: '【那只胖得像违法建筑的猫？】', nextId: 'ch2_candy_n7' },`,
  `{ text: '【N7欠你的那三颗？】', nextId: 'ch2_candy_n7' },`,
);

// ch1 rain branch - add 你怎么知道 / 真的在下雨
s = s.replace(
  `n('ch1_rain', '真的？', 'normal', 400, 'ch1_rain2'),
  n('ch1_rain2', '我最喜欢下雨了', 'smile', 800, 'ch1_sun_merge'),`,
  `n('ch1_rain', '真的？', 'normal', 400, 'ch1_rain2'),
  n('ch1_rain2', '你怎么知道', 'normal', 600, 'ch1_rain2b'),
  n('ch1_rain2b', '真的在下雨？', 'normal', 800, 'ch1_rain3'),
  n('ch1_rain3', '我最喜欢下雨了', 'smile', 800, 'ch1_sun_merge'),`,
);

fs.writeFileSync(path, s);
console.log('fix-remaining applied');
