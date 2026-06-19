import fs from 'fs';
const path = 'src/game/story.ts';
let s = fs.readFileSync(path, 'utf8');

const markers = {
  start: "  c('ch2_4', [",
  end: "  c('ch2_dream6', [",
};

const i0 = s.indexOf(markers.start);
const i1 = s.indexOf(markers.end);
if (i0 < 0 || i1 < 0) throw new Error('markers not found');

const replacement = `  c('ch2_4', [
    { text: '【你又闯什么祸了？】', nextId: 'ch2_5d' },
    { text: '【飞船炸了？】', nextId: 'ch2_5b' },
    { text: '【你又迟到了？】', nextId: 'ch2_5c' },
  ]),
  n('ch2_5d', '我犯了一个导航员不该犯的错误', 'normal', 600, 'ch2_5d2'),
  n('ch2_5d2', '而且非常低级', 'normal', 600, 'ch2_5d3'),
  n('ch2_5d3', '低级到我不想承认', 'smile', 800, 'ch2_alarm'),
  n('ch2_5b', '……暂时还没有', 'smile', 600, 'ch2_5b3'),
  n('ch2_5b3', '谢谢你一上来就把事故等级拉满', 'normal', 700, 'ch2_5b4'),
  n('ch2_5b4', '不过以我今天的状态', 'normal', 600, 'ch2_5b5'),
  n('ch2_5b5', '也不是完全没可能', 'smile', 800, 'ch2_alarm'),
  n('ch2_5c', '……', 'normal', 800, 'ch2_5c2'),
  n('ch2_5c2', '为什么是\u201c又\u201d', 'normal', 700, 'ch2_5c3'),
  n('ch2_5c3', '你这个字用得很伤人', 'smile', 700, 'ch2_5c4'),
  n('ch2_5c4', '虽然这次你猜对了', 'smile', 800, 'ch2_alarm'),
  n('ch2_alarm', '我把闹钟关了', 'normal', 600, 'ch2_alarm2'),
  n('ch2_alarm2', '然后梦见自己起床了', 'smile', 600, 'ch2_alarm3'),
  n('ch2_alarm3', '甚至梦见自己已经开完会了', 'smile', 800, 'ch2_alarm4'),
  n('ch2_alarm4', '醒来的时候', 'normal', 600, 'ch2_alarm5'),
  n('ch2_alarm5', '舰长正站在我面前', 'smile', 800, 'ch2_merge5'),
  c('ch2_merge5', [
    { text: '【经典】', nextId: 'ch2_classic' },
    { text: '【太真实了】', nextId: 'ch2_real' },
    { text: '【后来现实给了你一拳？】', nextId: 'ch2_punch' },
  ]),
  n('ch2_classic', '不要说得像你很有经验一样', 'smile', 600, 'ch2_classic2'),
  n('ch2_classic2', '虽然我怀疑你确实有', 'smile', 800, 'ch2_merge6'),
  n('ch2_real', '对吧', 'smile', 500, 'ch2_real2'),
  n('ch2_real2', '最可怕的是梦里的我特别清醒', 'normal', 700, 'ch2_real3'),
  n('ch2_real3', '还认真做了会议记录', 'smile', 800, 'ch2_merge6'),
  n('ch2_punch', '很准', 'smile', 500, 'ch2_punch2'),
  n('ch2_punch2', '现实真的给了我一拳', 'normal', 700, 'ch2_punch3'),
  n('ch2_punch3', '舰长的脸就是那一拳', 'smile', 800, 'ch2_merge6'),
  n('ch2_merge6', '人生至暗时刻', 'smile', 600, 'ch2_merge7'),
  n('ch2_merge7', '我现在严重怀疑', 'normal', 600, 'ch2_merge7b'),
  n('ch2_merge7b', '梦境系统和现实系统之间缺少同步机制', 'normal', 900, 'ch2_merge8'),
  c('ch2_merge8', [
    { text: '【哈哈哈哈】', nextId: 'ch2_5' },
  ]),
  n('ch2_5', '你笑得太开心了', 'normal', 600, 'ch2_5a'),
  n('ch2_5a', '记仇', 'normal', 600, 'ch2_5b2'),
  n('ch2_5b2', '不过', 'smile', 800, 'ch2_haha_merge'),
  n('ch2_haha_merge', '今天有件怪事', 'normal', 800, 'ch2_haha_choice'),
  c('ch2_haha_choice', [
    { text: '【今天又发生了什么怪事？】', nextId: 'ch2_today' },
  ]),
  n('ch2_today', '我做梦了', 'smile', 600, 'ch2_today_choice'),
  c('ch2_today_choice', [
    { text: '【这不是很正常吗】', nextId: 'ch2_dream1' },
  ]),
  n('ch2_dream1', '不正常', 'smile', 600, 'ch2_dream2'),
  n('ch2_dream2', '因为梦里有你', 'smile', 800, 'ch2_dream6'),
`;

s = s.slice(0, i0) + replacement + s.slice(i1);
fs.writeFileSync(path, s);
console.log('ch2 open replaced');
