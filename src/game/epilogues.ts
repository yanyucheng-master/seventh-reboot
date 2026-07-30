import type { Locale } from '../i18n';

export type EpilogueKind = 'normal' | 'true';

export type EpilogueNode = {
  id: string;
  content: string;
  delay: number;
  nextId: string;
};

const EPILOGUE_NODES: EpilogueNode[] = [
  {
    "id": "EPI-N-0001",
    "content": "后记 / Epilogue",
    "delay": 2000,
    "nextId": "EPI-N-0002"
  },
  {
    "id": "EPI-N-0002",
    "content": "12年后 · 后记\n深空航行学院",
    "delay": 3000,
    "nextId": "EPI-N-0003"
  },
  {
    "id": "EPI-N-0003",
    "content": "学生：\"老师，你为什么总看星星？\"",
    "delay": 2600,
    "nextId": "EPI-N-0004"
  },
  {
    "id": "EPI-N-0004",
    "content": "Nova：“不知道，可能只是习惯”",
    "delay": 3200,
    "nextId": "EPI-N-0005"
  },
  {
    "id": "EPI-N-0005",
    "content": "学生：\"你在等什么人吗？\"",
    "delay": 2600,
    "nextId": "EPI-N-0006"
  },
  {
    "id": "EPI-N-0006",
    "content": "Nova沉默了一会",
    "delay": 2400,
    "nextId": "EPI-N-0007"
  },
  {
    "id": "EPI-N-0007",
    "content": "\"也许吧\"",
    "delay": 2600,
    "nextId": "EPI-N-0008"
  },
  {
    "id": "EPI-N-0008",
    "content": "她从口袋里拿出一颗牛奶糖\n糖纸已经泛黄",
    "delay": 3200,
    "nextId": "EPI-N-0009"
  },
  {
    "id": "EPI-N-0009",
    "content": "她不记得为什么一直舍不得吃\n也想不起自己曾经想把它留给谁",
    "delay": 3200,
    "nextId": "EPI-N-0010"
  },
  {
    "id": "EPI-N-0010",
    "content": "只是每次握住它\n她都会觉得\n自己好像曾经被某个人\n很认真地陪过一段路",
    "delay": 3800,
    "nextId": "EPI-N-0011"
  },
  {
    "id": "EPI-N-0011",
    "content": "那个人没有留下名字\n也没有留下清晰的脸",
    "delay": 3200,
    "nextId": "EPI-N-0012"
  },
  {
    "id": "EPI-N-0012",
    "content": "只留下一个空缺\n和一点怎么都散不掉的温暖\n普通结局：《循环之外》",
    "delay": 3200,
    "nextId": "MENU"
  },
  {
    "id": "EPI-T-0001",
    "content": "后记 / Epilogue",
    "delay": 2200,
    "nextId": "EPI-T-0002"
  },
  {
    "id": "EPI-T-0002",
    "content": "12年后 · 后记\n深空航行学院",
    "delay": 3000,
    "nextId": "EPI-T-0003"
  },
  {
    "id": "EPI-T-0003",
    "content": "学生：\"老师，为什么观测室总有一个空座位？\"",
    "delay": 3200,
    "nextId": "EPI-T-0004"
  },
  {
    "id": "EPI-T-0004",
    "content": "Nova站在窗前\n这一次，她没有沉默太久",
    "delay": 3200,
    "nextId": "EPI-T-0005"
  },
  {
    "id": "EPI-T-0005",
    "content": "“因为我一直给一个没有真正坐过这里的人留着它。”",
    "delay": 3800,
    "nextId": "EPI-T-0006"
  },
  {
    "id": "EPI-T-0006",
    "content": "学生：“那个人叫什么名字？”",
    "delay": 3200,
    "nextId": "EPI-T-0007"
  },
  {
    "id": "EPI-T-0007",
    "content": "Nova轻轻笑了一下\n像是终于能把那个位置说出口",
    "delay": 2600,
    "nextId": "EPI-T-0008"
  },
  {
    "id": "EPI-T-0008",
    "content": "“我不知道对方在自己的世界里叫什么。”",
    "delay": 3200,
    "nextId": "EPI-T-0009"
  },
  {
    "id": "EPI-T-0009",
    "content": "“但我记得。”\n“系统叫对方Observer-01，我后来也一直这么叫。”",
    "delay": 3600,
    "nextId": "EPI-T-0010"
  },
  {
    "id": "EPI-T-0010",
    "content": "学生离开后\nNova独自站在窗前\n掌心里有一颗牛奶糖",
    "delay": 3600,
    "nextId": "EPI-T-0011"
  },
  {
    "id": "EPI-T-0011",
    "content": "她记得这颗糖\n也记得那朵小白花\n记得 N7\n记得观测室",
    "delay": 2600,
    "nextId": "EPI-T-0012"
  },
  {
    "id": "EPI-T-0012",
    "content": "她还记得最开始的那句话",
    "delay": 3000,
    "nextId": "EPI-T-0013"
  },
  {
    "id": "EPI-T-0013",
    "content": "真的有人收到了\n真的有人回答过她",
    "delay": 3600,
    "nextId": "MENU"
  }
];

export const EPILOGUE_START_IDS: Record<EpilogueKind, string> = {
  normal: 'EPI-N-0001',
  true: 'EPI-T-0001',
};

export const EPILOGUE_NODE_MAP = new Map(EPILOGUE_NODES.map(node => [node.id, node]));

export function getEpilogueNodes(kind: EpilogueKind): EpilogueNode[] {
  const prefix = kind === 'normal' ? 'EPI-N-' : 'EPI-T-';
  return EPILOGUE_NODES.filter(node => node.id.startsWith(prefix));
}

export function getLocalizedEpilogueNodes(kind: EpilogueKind, locale: Locale): EpilogueNode[] {
  const localized = locale === 'en-US' ? EPILOGUE_TEXT_EN : EPILOGUE_TEXT_ZH;
  return getEpilogueNodes(kind).map(node => ({
    ...node,
    content: localized[node.id] ?? node.content,
  }));
}

const EPILOGUE_TEXT_ZH: Record<string, string> = {
  "EPI-N-0001": "后记 / Epilogue",
  "EPI-N-0002": "12年后 · 后记\n深空航行学院",
  "EPI-N-0003": "学生：\"老师，你为什么总看星星？\"",
  "EPI-N-0004": "Nova：“不知道，可能只是习惯”",
  "EPI-N-0005": "学生：\"你在等什么人吗？\"",
  "EPI-N-0006": "Nova沉默了一会",
  "EPI-N-0007": "\"也许吧\"",
  "EPI-N-0008": "她从口袋里拿出一颗牛奶糖\n糖纸已经泛黄",
  "EPI-N-0009": "她不记得为什么一直舍不得吃\n也想不起自己曾经想把它留给谁",
  "EPI-N-0010": "只是每次握住它\n她都会觉得\n自己好像曾经被某个人\n很认真地陪过一段路",
  "EPI-N-0011": "那个人没有留下名字\n也没有留下清晰的脸",
  "EPI-N-0012": "只留下一个空缺\n和一点怎么都散不掉的温暖\n普通结局：《循环之外》",
  "EPI-T-0001": "后记 / Epilogue",
  "EPI-T-0002": "12年后 · 后记\n深空航行学院",
  "EPI-T-0003": "学生：\"老师，为什么观测室总有一个空座位？\"",
  "EPI-T-0004": "Nova站在窗前\n这一次，她没有沉默太久",
  "EPI-T-0005": "“因为我一直给一个没有真正坐过这里的人留着它。”",
  "EPI-T-0006": "学生：“那个人叫什么名字？”",
  "EPI-T-0007": "Nova轻轻笑了一下\n像是终于能把那个位置说出口",
  "EPI-T-0008": "“我不知道对方在自己的世界里叫什么。”",
  "EPI-T-0009": "“但我记得。”\n“系统叫对方Observer-01，我后来也一直这么叫。”",
  "EPI-T-0010": "学生离开后\nNova独自站在窗前\n掌心里有一颗牛奶糖",
  "EPI-T-0011": "她记得这颗糖\n也记得那朵小白花\n记得 N7\n记得观测室",
  "EPI-T-0012": "她还记得最开始的那句话",
  "EPI-T-0013": "真的有人收到了\n真的有人回答过她"
};
const EPILOGUE_TEXT_EN: Record<string, string> = {
  "EPI-N-0001": "Epilogue",
  "EPI-N-0002": "Twelve Years Later\nDeep-Space Navigation Academy",
  "EPI-N-0003": "Student: “Professor, why are you always looking at the stars?”",
  "EPI-N-0004": "Nova: “I don't know. Maybe it is just a habit.”",
  "EPI-N-0005": "Student: “Are you waiting for someone?”",
  "EPI-N-0006": "Nova was silent for a moment.",
  "EPI-N-0007": "“Maybe.”",
  "EPI-N-0008": "She took a piece of milk candy from her pocket.\nThe wrapper had yellowed with age.",
  "EPI-N-0009": "She did not remember why she could never bring herself to eat it,\nor whom she had once wanted to save it for.",
  "EPI-N-0010": "She only knew that whenever she held it,\nshe felt as though someone,\nsomewhere,\nhad once stayed beside her with their whole heart.",
  "EPI-N-0011": "That person left no name,\nand no face she could clearly recall.",
  "EPI-N-0012": "Only an empty place,\nand a little warmth that never quite faded.\nNormal Ending: Beyond the Cycle",
  "EPI-T-0001": "Epilogue",
  "EPI-T-0002": "Twelve Years Later\nDeep-Space Navigation Academy",
  "EPI-T-0003": "Student: “Professor, why is there always an empty seat in the observatory?”",
  "EPI-T-0004": "Nova stood by the window.\nThis time, she did not stay silent for long.",
  "EPI-T-0005": "“Because I have always kept it for someone who never truly got to sit here.”",
  "EPI-T-0006": "Student: “What was their name?”",
  "EPI-T-0007": "Nova smiled softly,\nas if she could finally give that empty place a name.",
  "EPI-T-0008": "“I do not know what they were called in their own world.”",
  "EPI-T-0009": "“But I remember.”\n“The system called them Observer-01. I kept calling them that afterward.”",
  "EPI-T-0010": "After the student left,\nNova stood alone by the window,\na piece of milk candy in her palm.",
  "EPI-T-0011": "She remembered the candy.\nShe remembered the little white flower,\nN7,\nand the observatory.",
  "EPI-T-0012": "She also remembered the very first line.",
  "EPI-T-0013": "Someone really had received it.\nSomeone really had answered her."
};
