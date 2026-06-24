// Story data for "Seventh Reboot"
// Each node has: id, speaker, type, content, and navigation info

import type {
  ContactStage,
  AvatarProfile,
  EndingId,
  FinalChoice,
  FinalFarewellTone,
  GlitchLevel,
  MemoryAnchorId,
  NovaEmotion,
  Speaker,
  MessageType,
  TimedProof,
  TimedResponse,
} from './types';
import { cleanChatText } from './format';

export type { Speaker, MessageType };

export interface Choice {
  text: string;
  nextId: string;
  statEffect?: 'none';
  trustDelta?: number;
  memoryDelta?: number;
  attachmentDelta?: number;
  acceptFarewell?: boolean;
  finalChoice?: FinalChoice;
  timedResponse?: TimedResponse;
  timedProof?: TimedProof;
  finalFarewellTone?: FinalFarewellTone;
}

export interface StoryNode {
  id: string;
  speaker: Speaker;
  type: MessageType;
  content: string;
  emotion?: NovaEmotion;
  choices?: Choice[];
  choiceTimeoutMs?: number;
  timeoutNextId?: string;
  image?: string;
  delay?: number;
  nextId?: string;
  isGlitch?: boolean;
  glitchLevel?: GlitchLevel;
  memoryAnchor?: MemoryAnchorId;
  requiresAnchor?: MemoryAnchorId;
  contactStage?: ContactStage;
  displayName?: string;
  avatarProfile?: AvatarProfile;
  archiveUnlock?: string | string[];
  endingUnlock?: EndingId;
}

// Story nodes imported from exported V1.0 narrative document.
const rawStoryNodes = JSON.parse(String.raw`[
  {
    "id": "p0",
    "speaker": "system",
    "type": "comm-log",
    "content": "[OBSERVER-01]\nPROTOCOL · 检测到第七协议残留通讯\nREBOOT · 本次接入编号：07\nLINK · 通讯链路不稳定",
    "nextId": "p9",
    "delay": 1800
  },
  {
    "id": "p9",
    "speaker": "system",
    "type": "status",
    "content": "检测到 UNKNOWN-06 残留留言",
    "nextId": "p10",
    "delay": 1200
  },
  {
    "id": "p10",
    "speaker": "system",
    "type": "glitch",
    "content": "残留信号损坏",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "p11",
    "delay": 1500
  },
  {
    "id": "p11",
    "speaker": "nova",
    "type": "text",
    "content": "如果你能看到……",
    "emotion": "sad",
    "nextId": "p12",
    "delay": 700,
    "displayName": "UNKNOWN-06",
    "avatarProfile": "unknown"
  },
  {
    "id": "p12",
    "speaker": "system",
    "type": "glitch",
    "content": "信号片段缺失",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "p12a_u06",
    "delay": 800
  },
  {
    "id": "p12a_u06",
    "speaker": "nova",
    "type": "text",
    "content": "第七次已经开始",
    "emotion": "normal",
    "nextId": "p12b_u06",
    "delay": 600,
    "displayName": "UNKNOWN-06",
    "avatarProfile": "unknown"
  },
  {
    "id": "p12b_u06",
    "speaker": "nova",
    "type": "text",
    "content": "别让她太早知道",
    "emotion": "sad",
    "nextId": "p12d_u06",
    "delay": 600,
    "displayName": "UNKNOWN-06",
    "avatarProfile": "unknown"
  },
  {
    "id": "p12d_u06",
    "speaker": "system",
    "type": "glitch",
    "content": "消息恢复失败",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "p12e_u06",
    "delay": 2000
  },
  {
    "id": "p12e_u06",
    "speaker": "nova",
    "type": "text",
    "content": "也别太相信自己",
    "emotion": "normal",
    "nextId": "p13_u06",
    "delay": 600,
    "displayName": "UNKNOWN-06",
    "avatarProfile": "unknown"
  },
  {
    "id": "p13_u06",
    "speaker": "nova",
    "type": "text",
    "content": "记▇住……第一句▇",
    "emotion": "sad",
    "nextId": "p13a_u06",
    "delay": 600,
    "displayName": "UNKNOWN-06",
    "avatarProfile": "unknown"
  },
  {
    "id": "p13a_u06",
    "speaker": "nova",
    "type": "text",
    "content": "那是她找▇▇你的时候",
    "emotion": "sad",
    "nextId": "p13b_u06",
    "delay": 600,
    "displayName": "UNKNOWN-06",
    "avatarProfile": "unknown"
  },
  {
    "id": "p13b_u06",
    "speaker": "system",
    "type": "glitch",
    "content": "UNKNOWN-06 信号中断",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "p13c",
    "delay": 2000
  },
  {
    "id": "p13c",
    "speaker": "system",
    "type": "status",
    "content": "正在接入当前加密信号源",
    "nextId": "p13d",
    "delay": 900
  },
  {
    "id": "p13d",
    "speaker": "system",
    "type": "typing",
    "content": "",
    "nextId": "p13e",
    "delay": 1800
  },
  {
    "id": "p13e",
    "speaker": "nova",
    "type": "text",
    "content": "真的有人收到了？",
    "emotion": "smile",
    "memoryAnchor": "first_message",
    "nextId": "p14",
    "delay": 1000
  },
  {
    "id": "p14",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你是谁？】",
        "nextId": "p15a"
      },
      {
        "text": "【这是哪里？】",
        "nextId": "p15b"
      },
      {
        "text": "【恶作剧？】",
        "nextId": "p15c"
      }
    ]
  },
  {
    "id": "p15a",
    "speaker": "nova",
    "type": "text",
    "content": "好问题",
    "emotion": "normal",
    "nextId": "p16a",
    "delay": 600
  },
  {
    "id": "p16a",
    "speaker": "nova",
    "type": "text",
    "content": "我也想知道你是谁",
    "emotion": "normal",
    "nextId": "p17a",
    "delay": 600
  },
  {
    "id": "p17a",
    "speaker": "nova",
    "type": "text",
    "content": "至少说明这不是自动回复",
    "emotion": "smile",
    "nextId": "p_merge1",
    "delay": 800
  },
  {
    "id": "p15b",
    "speaker": "nova",
    "type": "text",
    "content": "我不知道你那边是哪",
    "emotion": "normal",
    "nextId": "p16b",
    "delay": 600
  },
  {
    "id": "p16b",
    "speaker": "nova",
    "type": "text",
    "content": "但我这边……",
    "emotion": "normal",
    "nextId": "p17b",
    "delay": 600
  },
  {
    "id": "p17b",
    "speaker": "nova",
    "type": "text",
    "content": "有点远",
    "emotion": "normal",
    "nextId": "p_merge1",
    "delay": 800
  },
  {
    "id": "p15c",
    "speaker": "nova",
    "type": "text",
    "content": "如果这是恶作剧",
    "emotion": "normal",
    "nextId": "p16c",
    "delay": 600
  },
  {
    "id": "p16c",
    "speaker": "nova",
    "type": "text",
    "content": "那成本可真有点高",
    "emotion": "normal",
    "nextId": "p17c",
    "delay": 600
  },
  {
    "id": "p17c",
    "speaker": "nova",
    "type": "text",
    "content": "我已经三天没睡好了",
    "emotion": "smile",
    "nextId": "p_merge1",
    "delay": 800
  },
  {
    "id": "p_merge1",
    "speaker": "nova",
    "type": "text",
    "content": "先确认一下",
    "emotion": "normal",
    "nextId": "p_merge2",
    "delay": 600
  },
  {
    "id": "p_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "你是真人吗？",
    "emotion": "normal",
    "nextId": "p_merge3",
    "delay": 800
  },
  {
    "id": "p_merge3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【是】",
        "nextId": "p_yes"
      },
      {
        "text": "【不是】",
        "nextId": "p_no"
      }
    ]
  },
  {
    "id": "p_yes",
    "speaker": "nova",
    "type": "text",
    "content": "太好了",
    "emotion": "smile",
    "nextId": "p_yes2",
    "delay": 600
  },
  {
    "id": "p_yes2",
    "speaker": "nova",
    "type": "text",
    "content": "终于不是系统日志了",
    "emotion": "smile",
    "nextId": "p_merge_sys1",
    "delay": 800
  },
  {
    "id": "p_no",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "p_no2",
    "delay": 800
  },
  {
    "id": "p_no2",
    "speaker": "nova",
    "type": "text",
    "content": "那至少你比这里的大部分系统有礼貌",
    "emotion": "smile",
    "nextId": "p_no3",
    "delay": 600
  },
  {
    "id": "p_no3",
    "speaker": "nova",
    "type": "text",
    "content": "我接受这个答案",
    "emotion": "smile",
    "nextId": "p_merge_sys1",
    "delay": 800
  },
  {
    "id": "p_merge_sys1",
    "speaker": "system",
    "type": "status",
    "content": "回答来源：外部意识",
    "nextId": "p_merge_sys2",
    "delay": 700
  },
  {
    "id": "p_merge_sys2",
    "speaker": "system",
    "type": "status",
    "content": "舰内人员登记：未匹配",
    "nextId": "p_merge_sys3",
    "delay": 700
  },
  {
    "id": "p_merge_sys3",
    "speaker": "system",
    "type": "status",
    "content": "Observer-01 身份权限不属于 Aurora 舰内人员",
    "nextId": "p_merge_sys4",
    "delay": 900
  },
  {
    "id": "p_merge_sys4",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "p_merge_sys5",
    "delay": 600
  },
  {
    "id": "p_merge_sys5",
    "speaker": "nova",
    "type": "text",
    "content": "刚才系统闪了一下",
    "emotion": "normal",
    "nextId": "p_merge_sys6",
    "delay": 700
  },
  {
    "id": "p_merge_sys6",
    "speaker": "nova",
    "type": "text",
    "content": "说你不是舰内人员",
    "emotion": "normal",
    "nextId": "p_merge_sys7",
    "delay": 800
  },
  {
    "id": "p_merge_sys7",
    "speaker": "nova",
    "type": "text",
    "content": "废话",
    "emotion": "smile",
    "nextId": "p_merge_sys8",
    "delay": 500
  },
  {
    "id": "p_merge_sys8",
    "speaker": "nova",
    "type": "text",
    "content": "你要是突然出现在舰上",
    "emotion": "smile",
    "nextId": "p_merge_sys9",
    "delay": 700
  },
  {
    "id": "p_merge_sys9",
    "speaker": "nova",
    "type": "text",
    "content": "我才该真的报警",
    "emotion": "smile",
    "nextId": "p_merge4",
    "delay": 900
  },
  {
    "id": "p_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "我叫 Nova",
    "emotion": "normal",
    "contactStage": "named",
    "nextId": "p_merge5",
    "delay": 600
  },
  {
    "id": "p_merge5",
    "speaker": "nova",
    "type": "text",
    "content": "Aurora号导航员",
    "emotion": "normal",
    "nextId": "p_merge6",
    "delay": 600
  },
  {
    "id": "p_merge6",
    "speaker": "nova",
    "type": "text",
    "content": "虽然你大概率没听过",
    "emotion": "smile",
    "nextId": "p_merge7",
    "delay": 800
  },
  {
    "id": "p_merge7",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【没听过】",
        "nextId": "p_aurora_unknown"
      },
      {
        "text": "【Aurora号？】",
        "nextId": "p_aurora_ship"
      },
      {
        "text": "【导航员？】",
        "nextId": "p_aurora_nav"
      }
    ]
  },
  {
    "id": "p_aurora_unknown",
    "speaker": "nova",
    "type": "text",
    "content": "正常",
    "emotion": "normal",
    "nextId": "p_aurora_unknown2",
    "delay": 400
  },
  {
    "id": "p_aurora_unknown2",
    "speaker": "nova",
    "type": "text",
    "content": "这名字听起来也不像你那边会有的东西",
    "emotion": "normal",
    "nextId": "p_aurora_merge1",
    "delay": 900
  },
  {
    "id": "p_aurora_ship",
    "speaker": "nova",
    "type": "text",
    "content": "对",
    "emotion": "normal",
    "nextId": "p_aurora_ship2",
    "delay": 400
  },
  {
    "id": "p_aurora_ship2",
    "speaker": "nova",
    "type": "text",
    "content": "一艘很贵、很大、也很容易出问题的船",
    "emotion": "smile",
    "nextId": "p_aurora_merge1",
    "delay": 900
  },
  {
    "id": "p_aurora_nav",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "p_aurora_nav2",
    "delay": 400
  },
  {
    "id": "p_aurora_nav2",
    "speaker": "nova",
    "type": "text",
    "content": "负责确认我们没有把自己开进恒星里",
    "emotion": "normal",
    "nextId": "p_aurora_nav3",
    "delay": 700
  },
  {
    "id": "p_aurora_nav3",
    "speaker": "nova",
    "type": "text",
    "content": "目前看，我还算称职",
    "emotion": "smile",
    "nextId": "p_aurora_merge1",
    "delay": 900
  },
  {
    "id": "p_aurora_merge1",
    "speaker": "nova",
    "type": "text",
    "content": "简单说",
    "emotion": "normal",
    "nextId": "p_aurora_merge2",
    "delay": 500
  },
  {
    "id": "p_aurora_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "Aurora号是一艘远航观测船",
    "emotion": "normal",
    "nextId": "p_aurora_merge3",
    "delay": 600
  },
  {
    "id": "p_aurora_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "不是战舰",
    "emotion": "normal",
    "nextId": "p_aurora_merge4",
    "delay": 400
  },
  {
    "id": "p_aurora_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "也不是那种听起来很壮烈的殖民船",
    "emotion": "normal",
    "nextId": "p_aurora_merge5",
    "delay": 700
  },
  {
    "id": "p_aurora_merge5",
    "speaker": "nova",
    "type": "text",
    "content": "我们的任务是穿过静默航区",
    "emotion": "normal",
    "nextId": "p_aurora_merge6",
    "delay": 600
  },
  {
    "id": "p_aurora_merge6",
    "speaker": "nova",
    "type": "text",
    "content": "记录一些人类还没见过的星域",
    "emotion": "normal",
    "nextId": "p_aurora_merge7",
    "delay": 700
  },
  {
    "id": "p_aurora_merge7",
    "speaker": "nova",
    "type": "text",
    "content": "听起来很浪漫对吧",
    "emotion": "smile",
    "nextId": "p_aurora_merge8",
    "delay": 600
  },
  {
    "id": "p_aurora_merge8",
    "speaker": "nova",
    "type": "text",
    "content": "实际工作大多是值班、报表",
    "emotion": "normal",
    "nextId": "p_aurora_merge9",
    "delay": 600
  },
  {
    "id": "p_aurora_merge9",
    "speaker": "nova",
    "type": "text",
    "content": "还有半夜响起来的故障警报",
    "emotion": "normal",
    "nextId": "p_aurora_merge10",
    "delay": 700
  },
  {
    "id": "p_aurora_merge10",
    "speaker": "nova",
    "type": "text",
    "content": "而你这条通讯",
    "emotion": "normal",
    "nextId": "p_aurora_merge11",
    "delay": 500
  },
  {
    "id": "p_aurora_merge11",
    "speaker": "nova",
    "type": "text",
    "content": "不在任何正常协议里",
    "emotion": "normal",
    "nextId": "p_aurora6",
    "delay": 900
  },
  {
    "id": "p_aurora6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你是说这不是正常通讯？】",
        "nextId": "p_comm_abnormal"
      },
      {
        "text": "【继续说】",
        "nextId": "p_comm_continue"
      }
    ]
  },
  {
    "id": "p_comm_abnormal",
    "speaker": "nova",
    "type": "text",
    "content": "对",
    "emotion": "normal",
    "nextId": "p_comm_abnormal2",
    "delay": 500
  },
  {
    "id": "p_comm_abnormal2",
    "speaker": "nova",
    "type": "text",
    "content": "这条通讯不在任何正常协议里",
    "emotion": "normal",
    "nextId": "p_exp1",
    "delay": 800
  },
  {
    "id": "p_comm_continue",
    "speaker": "nova",
    "type": "text",
    "content": "好",
    "emotion": "normal",
    "nextId": "p_comm_continue2",
    "delay": 400
  },
  {
    "id": "p_comm_continue2",
    "speaker": "nova",
    "type": "text",
    "content": "但你先做好心理准备",
    "emotion": "normal",
    "nextId": "p_exp1",
    "delay": 800
  },
  {
    "id": "p_exp1",
    "speaker": "nova",
    "type": "text",
    "content": "准确来说",
    "emotion": "normal",
    "nextId": "p_exp2",
    "delay": 400
  },
  {
    "id": "p_exp2",
    "speaker": "nova",
    "type": "text",
    "content": "我刚刚启动了一台实验设备",
    "emotion": "normal",
    "nextId": "p_exp3",
    "delay": 600
  },
  {
    "id": "p_exp3",
    "speaker": "nova",
    "type": "text",
    "content": "然后它炸了",
    "emotion": "normal",
    "nextId": "p_exp4",
    "delay": 600
  },
  {
    "id": "p_exp4",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "p_exp5",
    "delay": 400
  },
  {
    "id": "p_exp5",
    "speaker": "nova",
    "type": "text",
    "content": "字面意义上的炸了",
    "emotion": "smile",
    "nextId": "p_exp6",
    "delay": 800
  },
  {
    "id": "p_exp6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你没事吧？】",
        "nextId": "p_ok1",
        "trustDelta": 1
      },
      {
        "text": "【…………】",
        "nextId": "p_silent1"
      },
      {
        "text": "【为什么你还能聊天？】",
        "nextId": "p_link1"
      }
    ]
  },
  {
    "id": "p_ok1",
    "speaker": "nova",
    "type": "text",
    "content": "你是今天第一个问我有没有事的人",
    "emotion": "normal",
    "nextId": "p_ok2",
    "delay": 600
  },
  {
    "id": "p_ok2",
    "speaker": "nova",
    "type": "text",
    "content": "谢谢",
    "emotion": "smile",
    "nextId": "p_ok3",
    "delay": 400
  },
  {
    "id": "p_ok3",
    "speaker": "nova",
    "type": "text",
    "content": "暂时死不了",
    "emotion": "smile",
    "nextId": "p_ok4",
    "delay": 600
  },
  {
    "id": "p_ok4",
    "speaker": "nova",
    "type": "text",
    "content": "应该",
    "emotion": "smile",
    "nextId": "p_dead1",
    "delay": 800
  },
  {
    "id": "p_silent1",
    "speaker": "nova",
    "type": "text",
    "content": "你这个反应",
    "emotion": "normal",
    "nextId": "p_silent2",
    "delay": 600
  },
  {
    "id": "p_silent2",
    "speaker": "nova",
    "type": "text",
    "content": "像已经开始给我写悼词了",
    "emotion": "smile",
    "nextId": "p_silent3",
    "delay": 700
  },
  {
    "id": "p_silent3",
    "speaker": "nova",
    "type": "text",
    "content": "先别急",
    "emotion": "normal",
    "nextId": "p_silent4",
    "delay": 700
  },
  {
    "id": "p_silent4",
    "speaker": "nova",
    "type": "text",
    "content": "我还没死",
    "emotion": "normal",
    "nextId": "p_silent5",
    "delay": 700
  },
  {
    "id": "p_silent5",
    "speaker": "nova",
    "type": "text",
    "content": "暂时",
    "emotion": "normal",
    "nextId": "p_silent6",
    "delay": 600
  },
  {
    "id": "p_silent6",
    "speaker": "nova",
    "type": "text",
    "content": "应该",
    "emotion": "smile",
    "nextId": "p_dead1",
    "delay": 800
  },
  {
    "id": "p_link1",
    "speaker": "nova",
    "type": "text",
    "content": "好问题",
    "emotion": "normal",
    "nextId": "p_link2",
    "delay": 500
  },
  {
    "id": "p_link2",
    "speaker": "nova",
    "type": "text",
    "content": "因为爆炸的是实验舱",
    "emotion": "normal",
    "nextId": "p_link3",
    "delay": 700
  },
  {
    "id": "p_link3",
    "speaker": "nova",
    "type": "text",
    "content": "不是通讯终端",
    "emotion": "normal",
    "nextId": "p_link4",
    "delay": 700
  },
  {
    "id": "p_link4",
    "speaker": "nova",
    "type": "text",
    "content": "也不是我本人",
    "emotion": "smile",
    "nextId": "p_link5",
    "delay": 700
  },
  {
    "id": "p_link5",
    "speaker": "nova",
    "type": "text",
    "content": "至少暂时不是",
    "emotion": "smile",
    "nextId": "p_link6",
    "delay": 700
  },
  {
    "id": "p_link6",
    "speaker": "nova",
    "type": "text",
    "content": "备用链路还能撑一会儿",
    "emotion": "normal",
    "nextId": "p_link7",
    "delay": 700
  },
  {
    "id": "p_link7",
    "speaker": "nova",
    "type": "text",
    "content": "所以",
    "emotion": "normal",
    "nextId": "p_link8",
    "delay": 500
  },
  {
    "id": "p_link8",
    "speaker": "nova",
    "type": "text",
    "content": "暂时死不了",
    "emotion": "smile",
    "nextId": "p_link9",
    "delay": 600
  },
  {
    "id": "p_link9",
    "speaker": "nova",
    "type": "text",
    "content": "应该",
    "emotion": "smile",
    "nextId": "p_dead1",
    "delay": 800
  },
  {
    "id": "p_dead1",
    "speaker": "nova",
    "type": "text",
    "content": "因为医疗系统还没判定我死亡",
    "emotion": "smile",
    "nextId": "p_dead2",
    "delay": 600
  },
  {
    "id": "p_dead2",
    "speaker": "nova",
    "type": "text",
    "content": "这通常是个好消息",
    "emotion": "smile",
    "nextId": "p_dead3",
    "delay": 600
  },
  {
    "id": "p_dead3",
    "speaker": "nova",
    "type": "text",
    "content": "大概吧",
    "emotion": "smile",
    "nextId": "p_wonder1",
    "delay": 1200
  },
  {
    "id": "p_wonder1",
    "speaker": "nova",
    "type": "text",
    "content": "其实我更好奇另一件事",
    "emotion": "normal",
    "nextId": "p_wonder2",
    "delay": 600
  },
  {
    "id": "p_wonder2",
    "speaker": "nova",
    "type": "text",
    "content": "为什么我能联系到你",
    "emotion": "normal",
    "nextId": "p_wonder3",
    "delay": 800
  },
  {
    "id": "p_wonder3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【我也不知道】",
        "nextId": "p_idk1"
      },
      {
        "text": "【也许是巧合】",
        "nextId": "p_coin1"
      },
      {
        "text": "【跨时空通讯？】",
        "nextId": "p_space1"
      }
    ]
  },
  {
    "id": "p_idk1",
    "speaker": "nova",
    "type": "text",
    "content": "好吧",
    "emotion": "normal",
    "nextId": "p_idk2",
    "delay": 500
  },
  {
    "id": "p_idk2",
    "speaker": "nova",
    "type": "text",
    "content": "至少我们现在一样迷茫",
    "emotion": "smile",
    "nextId": "p_idk3",
    "delay": 600
  },
  {
    "id": "p_coin1",
    "speaker": "nova",
    "type": "text",
    "content": "如果是巧合",
    "emotion": "normal",
    "nextId": "p_coin2",
    "delay": 500
  },
  {
    "id": "p_coin2",
    "speaker": "nova",
    "type": "text",
    "content": "那这是我见过最离谱的巧合",
    "emotion": "normal",
    "nextId": "p_idk3",
    "delay": 900
  },
  {
    "id": "p_space1",
    "speaker": "nova",
    "type": "text",
    "content": "你倒是很敢想",
    "emotion": "smile",
    "nextId": "p_space2",
    "delay": 500
  },
  {
    "id": "p_space2",
    "speaker": "nova",
    "type": "text",
    "content": "但问题是……我也开始这么想了",
    "emotion": "normal",
    "nextId": "p_idk3",
    "delay": 1000
  },
  {
    "id": "p_idk3",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "p_idk4",
    "delay": 400
  },
  {
    "id": "p_idk4",
    "speaker": "nova",
    "type": "text",
    "content": "我好像找到原因了",
    "emotion": "normal",
    "nextId": "p_idk5",
    "delay": 600
  },
  {
    "id": "p_idk5",
    "speaker": "nova",
    "type": "text",
    "content": "实验设备记录了一段异常数据",
    "emotion": "normal",
    "nextId": "p_idk6",
    "delay": 600
  },
  {
    "id": "p_idk6",
    "speaker": "nova",
    "type": "text",
    "content": "里面有一个编号",
    "emotion": "normal",
    "nextId": "p_idk7",
    "delay": 400
  },
  {
    "id": "p_idk7",
    "speaker": "nova",
    "type": "text",
    "content": "和你的连接ID一致",
    "emotion": "normal",
    "nextId": "p_mean1",
    "delay": 1200
  },
  {
    "id": "p_mean1",
    "speaker": "nova",
    "type": "text",
    "content": "问题就在这里",
    "emotion": "normal",
    "nextId": "p_mean2",
    "delay": 600
  },
  {
    "id": "p_mean2",
    "speaker": "nova",
    "type": "text",
    "content": "这台设备在爆炸前",
    "emotion": "normal",
    "nextId": "p_mean3",
    "delay": 400
  },
  {
    "id": "p_mean3",
    "speaker": "nova",
    "type": "text",
    "content": "就已经知道你的存在",
    "emotion": "normal",
    "nextId": "p_mean4",
    "delay": 600
  },
  {
    "id": "p_mean4",
    "speaker": "nova",
    "type": "text",
    "content": "这不合理",
    "emotion": "normal",
    "nextId": "p_mean5",
    "delay": 600
  },
  {
    "id": "p_mean5",
    "speaker": "nova",
    "type": "text",
    "content": "非常不合理",
    "emotion": "normal",
    "nextId": "p_mean6",
    "delay": 600
  },
  {
    "id": "p_mean6",
    "speaker": "nova",
    "type": "text",
    "content": "除非……",
    "emotion": "normal",
    "nextId": "p_unless1",
    "delay": 1200
  },
  {
    "id": "p_unless1",
    "speaker": "nova",
    "type": "text",
    "content": "算了",
    "emotion": "normal",
    "nextId": "p_unless2",
    "delay": 600
  },
  {
    "id": "p_unless2",
    "speaker": "nova",
    "type": "text",
    "content": "我不想吓你",
    "emotion": "normal",
    "nextId": "p_unless3",
    "delay": 800
  },
  {
    "id": "p_unless3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【没事，说】",
        "nextId": "p_unless_say1"
      },
      {
        "text": "【我不怕】",
        "nextId": "p_unless_brave1"
      }
    ]
  },
  {
    "id": "p_unless_say1",
    "speaker": "nova",
    "type": "text",
    "content": "好",
    "emotion": "normal",
    "nextId": "p_unless_say2",
    "delay": 600
  },
  {
    "id": "p_unless_say2",
    "speaker": "nova",
    "type": "text",
    "content": "那我说了",
    "emotion": "normal",
    "nextId": "p_unless4",
    "delay": 800
  },
  {
    "id": "p_unless_brave1",
    "speaker": "nova",
    "type": "text",
    "content": "你最好是真的不怕",
    "emotion": "normal",
    "nextId": "p_unless4",
    "delay": 800
  },
  {
    "id": "p_unless4",
    "speaker": "nova",
    "type": "text",
    "content": "除非",
    "emotion": "normal",
    "nextId": "p_unless5",
    "delay": 800
  },
  {
    "id": "p_unless5",
    "speaker": "nova",
    "type": "text",
    "content": "它以前见过你",
    "emotion": "normal",
    "nextId": "p_shock1",
    "delay": 2000
  },
  {
    "id": "p_shock1",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "p_log1",
    "delay": 2000
  },
  {
    "id": "p_log1",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "normal",
    "nextId": "p_log2",
    "delay": 600
  },
  {
    "id": "p_log2",
    "speaker": "nova",
    "type": "text",
    "content": "听起来很蠢",
    "emotion": "normal",
    "nextId": "p_log3",
    "delay": 600
  },
  {
    "id": "p_log3",
    "speaker": "nova",
    "type": "text",
    "content": "但日志里有一句备注",
    "emotion": "normal",
    "nextId": "p_log4",
    "delay": 600
  },
  {
    "id": "p_log4",
    "speaker": "nova",
    "type": "text",
    "content": "只有一句",
    "emotion": "normal",
    "nextId": "p_log5",
    "delay": 800
  },
  {
    "id": "p_log5",
    "speaker": "nova",
    "type": "text",
    "content": "“第七次连接成功”",
    "emotion": "normal",
    "nextId": "p_log6",
    "delay": 2000
  },
  {
    "id": "p_log6",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "p_exp7_1",
    "delay": 1500
  },
  {
    "id": "p_exp7_1",
    "speaker": "nova",
    "type": "text",
    "content": "问题就在这里",
    "emotion": "normal",
    "nextId": "p_exp7_2",
    "delay": 600
  },
  {
    "id": "p_exp7_2",
    "speaker": "nova",
    "type": "text",
    "content": "今天是我第一次启动设备",
    "emotion": "normal",
    "nextId": "p_exp7_3",
    "delay": 600
  },
  {
    "id": "p_exp7_3",
    "speaker": "nova",
    "type": "text",
    "content": "可日志显示",
    "emotion": "normal",
    "nextId": "p_exp7_4",
    "delay": 400
  },
  {
    "id": "p_exp7_4",
    "speaker": "nova",
    "type": "text",
    "content": "已经成功连接过六次了",
    "emotion": "normal",
    "nextId": "p_exp7_5",
    "delay": 600
  },
  {
    "id": "p_exp7_5",
    "speaker": "nova",
    "type": "text",
    "content": "而且对象都是你",
    "emotion": "normal",
    "nextId": "p_familiar2",
    "delay": 600
  },
  {
    "id": "p_familiar2",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "p_familiar3",
    "delay": 800
  },
  {
    "id": "p_familiar3",
    "speaker": "nova",
    "type": "text",
    "content": "你有没有一种感觉？",
    "emotion": "normal",
    "nextId": "p_familiar4",
    "delay": 800
  },
  {
    "id": "p_familiar4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你也觉得我们不只是刚认识？】",
        "nextId": "p_fam1",
        "memoryDelta": 1
      }
    ]
  },
  {
    "id": "p_fam1",
    "speaker": "nova",
    "type": "text",
    "content": "就是……",
    "emotion": "normal",
    "nextId": "p_fam2",
    "delay": 800
  },
  {
    "id": "p_fam2",
    "speaker": "nova",
    "type": "text",
    "content": "我们好像已经认识很久了",
    "emotion": "normal",
    "nextId": "p_fam3",
    "delay": 1200
  },
  {
    "id": "p_fam3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【没有】",
        "nextId": "p_fam_no"
      },
      {
        "text": "【有一点】",
        "nextId": "p_fam_yes"
      },
      {
        "text": "【你吓到我了】",
        "nextId": "p_fam_scared"
      }
    ]
  },
  {
    "id": "p_fam_no",
    "speaker": "nova",
    "type": "text",
    "content": "好吧",
    "emotion": "smile",
    "nextId": "p_fam_no2",
    "delay": 600
  },
  {
    "id": "p_fam_no2",
    "speaker": "nova",
    "type": "text",
    "content": "那可能是我单方面熟人错觉",
    "emotion": "smile",
    "nextId": "p_fam6",
    "delay": 800
  },
  {
    "id": "p_fam_yes",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "p_fam_yes2",
    "delay": 600
  },
  {
    "id": "p_fam_yes2",
    "speaker": "nova",
    "type": "text",
    "content": "你也这么觉得？",
    "emotion": "smile",
    "nextId": "p_fam_yes3",
    "delay": 800
  },
  {
    "id": "p_fam_yes3",
    "speaker": "nova",
    "type": "text",
    "content": "这反而更吓人了",
    "emotion": "normal",
    "nextId": "p_fam6",
    "delay": 800
  },
  {
    "id": "p_fam_scared",
    "speaker": "nova",
    "type": "text",
    "content": "抱歉",
    "emotion": "normal",
    "nextId": "p_fam_scared2",
    "delay": 600
  },
  {
    "id": "p_fam_scared2",
    "speaker": "nova",
    "type": "text",
    "content": "我不是故意的",
    "emotion": "normal",
    "nextId": "p_fam_scared3",
    "delay": 700
  },
  {
    "id": "p_fam_scared3",
    "speaker": "nova",
    "type": "text",
    "content": "只是这里真的有点不对劲",
    "emotion": "normal",
    "nextId": "p_fam6",
    "delay": 800
  },
  {
    "id": "p_fam6",
    "speaker": "nova",
    "type": "text",
    "content": "可能是我太久没和人聊天了",
    "emotion": "normal",
    "nextId": "p_fam7",
    "delay": 600
  },
  {
    "id": "p_fam7",
    "speaker": "nova",
    "type": "text",
    "content": "开始胡思乱想",
    "emotion": "normal",
    "nextId": "p_fam8",
    "delay": 1500
  },
  {
    "id": "p_fam8",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "p_fam9",
    "delay": 2000
  },
  {
    "id": "p_fam9",
    "speaker": "nova",
    "type": "text",
    "content": "不过",
    "emotion": "normal",
    "nextId": "p_fam10",
    "delay": 600
  },
  {
    "id": "p_fam10",
    "speaker": "nova",
    "type": "text",
    "content": "能见到你",
    "emotion": "normal",
    "nextId": "p_fam11",
    "delay": 400
  },
  {
    "id": "p_fam11",
    "speaker": "nova",
    "type": "text",
    "content": "我还是很高兴",
    "emotion": "smile",
    "nextId": "p_fam12",
    "delay": 400
  },
  {
    "id": "p_fam12",
    "speaker": "nova",
    "type": "text",
    "content": "真的",
    "emotion": "smile",
    "nextId": "p_window1",
    "delay": 3000
  },
  {
    "id": "p_window1",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "p_window2",
    "delay": 2000
  },
  {
    "id": "p_window2",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "p_window3",
    "delay": 600
  },
  {
    "id": "p_window3",
    "speaker": "nova",
    "type": "text",
    "content": "观测窗外面有东西",
    "emotion": "normal",
    "nextId": "p_window4",
    "delay": 600
  },
  {
    "id": "p_window4",
    "speaker": "nova",
    "type": "text",
    "content": "我去确认一下",
    "emotion": "normal",
    "nextId": "p_window5",
    "delay": 600
  },
  {
    "id": "p_window5",
    "speaker": "nova",
    "type": "text",
    "content": "别关通讯",
    "emotion": "normal",
    "nextId": "p_window6",
    "delay": 400
  },
  {
    "id": "p_window6",
    "speaker": "nova",
    "type": "text",
    "content": "我很快回来",
    "emotion": "normal",
    "nextId": "p_offline1",
    "delay": 1500
  },
  {
    "id": "p_offline1",
    "speaker": "system",
    "type": "status",
    "content": "Nova 已离线",
    "nextId": "p_draft1",
    "delay": 3000
  },
  {
    "id": "p_draft1",
    "speaker": "system",
    "type": "draft",
    "content": "未发送草稿 / 22:47||如果这真的是第七次……\n那这次一定要成功。",
    "nextId": "p_end",
    "delay": 400
  },
  {
    "id": "p_end",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "CH1_START",
    "delay": 5000
  },
  {
    "id": "CH1_START",
    "speaker": "system",
    "type": "chapter",
    "content": "第一章：连接",
    "nextId": "ch1_0",
    "delay": 400
  },
  {
    "id": "ch1_0",
    "speaker": "system",
    "type": "timestamp",
    "content": "第二天 08:13",
    "nextId": "ch1_1",
    "delay": 400
  },
  {
    "id": "ch1_1",
    "speaker": "system",
    "type": "status",
    "content": "收到新消息",
    "nextId": "ch1_2",
    "delay": 800
  },
  {
    "id": "ch1_2",
    "speaker": "nova",
    "type": "text",
    "content": "我回来了",
    "emotion": "normal",
    "nextId": "ch1_3",
    "delay": 600
  },
  {
    "id": "ch1_3",
    "speaker": "nova",
    "type": "text",
    "content": "严格来说",
    "emotion": "normal",
    "nextId": "ch1_4",
    "delay": 400
  },
  {
    "id": "ch1_4",
    "speaker": "nova",
    "type": "text",
    "content": "昨晚就回来了",
    "emotion": "normal",
    "nextId": "ch1_5",
    "delay": 400
  },
  {
    "id": "ch1_5",
    "speaker": "nova",
    "type": "text",
    "content": "然后直接睡死",
    "emotion": "smile",
    "nextId": "ch1_6",
    "delay": 400
  },
  {
    "id": "ch1_6",
    "speaker": "nova",
    "type": "text",
    "content": "脸差点和控制台融为一体",
    "emotion": "smile",
    "nextId": "ch1_7",
    "delay": 800
  },
  {
    "id": "ch1_7",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你没事吧】",
        "nextId": "ch1_ok1",
        "trustDelta": 1
      },
      {
        "text": "【睡得好吗】",
        "nextId": "ch1_sleep1"
      },
      {
        "text": "【昨晚观测窗外到底是什么】",
        "nextId": "ch1_win1"
      }
    ]
  },
  {
    "id": "ch1_sleep1",
    "speaker": "nova",
    "type": "text",
    "content": "5分",
    "emotion": "smile",
    "nextId": "ch1_sleep2",
    "delay": 400
  },
  {
    "id": "ch1_sleep2",
    "speaker": "nova",
    "type": "text",
    "content": "满分100",
    "emotion": "smile",
    "nextId": "ch1_sleep3",
    "delay": 600
  },
  {
    "id": "ch1_sleep3",
    "speaker": "nova",
    "type": "text",
    "content": "导航员的职业病",
    "emotion": "normal",
    "nextId": "ch1_sleep4",
    "delay": 600
  },
  {
    "id": "ch1_sleep4",
    "speaker": "nova",
    "type": "text",
    "content": "睡眠质量和随机事件一样",
    "emotion": "smile",
    "nextId": "ch1_merge1",
    "delay": 1200
  },
  {
    "id": "ch1_ok1",
    "speaker": "nova",
    "type": "text",
    "content": "活着",
    "emotion": "smile",
    "nextId": "ch1_ok2",
    "delay": 600
  },
  {
    "id": "ch1_ok2",
    "speaker": "nova",
    "type": "text",
    "content": "这就是最好的答案",
    "emotion": "smile",
    "nextId": "ch1_merge1",
    "delay": 1200
  },
  {
    "id": "ch1_win1",
    "speaker": "nova",
    "type": "text",
    "content": "先说结论",
    "emotion": "normal",
    "nextId": "ch1_win2",
    "delay": 600
  },
  {
    "id": "ch1_win2",
    "speaker": "nova",
    "type": "text",
    "content": "不是外星怪物",
    "emotion": "normal",
    "nextId": "ch1_win3",
    "delay": 600
  },
  {
    "id": "ch1_win3",
    "speaker": "nova",
    "type": "text",
    "content": "虽然当时我真的这么怀疑了一秒",
    "emotion": "smile",
    "nextId": "ch1_merge1",
    "delay": 1200
  },
  {
    "id": "ch1_merge1",
    "speaker": "nova",
    "type": "text",
    "content": "对了",
    "emotion": "normal",
    "nextId": "ch1_merge2",
    "delay": 600
  },
  {
    "id": "ch1_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "昨天那个异常信号",
    "emotion": "normal",
    "nextId": "ch1_merge3",
    "delay": 400
  },
  {
    "id": "ch1_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "最后证明是乌龙",
    "emotion": "normal",
    "nextId": "ch1_ug1",
    "delay": 800
  },
  {
    "id": "ch1_ug1",
    "speaker": "nova",
    "type": "text",
    "content": "一块漂浮维修板",
    "emotion": "normal",
    "nextId": "ch1_ug2",
    "delay": 600
  },
  {
    "id": "ch1_ug2",
    "speaker": "nova",
    "type": "text",
    "content": "我紧张了十分钟",
    "emotion": "smile",
    "nextId": "ch1_ug3",
    "delay": 600
  },
  {
    "id": "ch1_ug3",
    "speaker": "nova",
    "type": "text",
    "content": "结果是隔壁工程组丢的",
    "emotion": "normal",
    "nextId": "ch1_ug4",
    "delay": 600
  },
  {
    "id": "ch1_ug4",
    "speaker": "nova",
    "type": "text",
    "content": "他们甚至还给它贴了眼睛",
    "emotion": "smile",
    "nextId": "ch1_ug5",
    "delay": 600
  },
  {
    "id": "ch1_ug5",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch1_ug6",
    "delay": 800
  },
  {
    "id": "ch1_ug6",
    "speaker": "nova",
    "type": "text",
    "content": "有时候我真的怀疑人类有没有未来",
    "emotion": "smile",
    "nextId": "ch1_photo1",
    "delay": 800
  },
  {
    "id": "ch1_photo1",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【哈哈哈】",
        "nextId": "ch1_haha1"
      },
      {
        "text": "【照片呢】",
        "nextId": "ch1_photo_req1"
      },
      {
        "text": "【你拍了吗】",
        "nextId": "ch1_took1"
      }
    ]
  },
  {
    "id": "ch1_haha1",
    "speaker": "nova",
    "type": "text",
    "content": "笑得很开心是吧",
    "emotion": "smile",
    "nextId": "ch1_haha2",
    "delay": 600
  },
  {
    "id": "ch1_haha2",
    "speaker": "nova",
    "type": "text",
    "content": "我当时可是真的准备写遗书了",
    "emotion": "normal",
    "nextId": "ch1_send3",
    "delay": 800
  },
  {
    "id": "ch1_photo_req1",
    "speaker": "nova",
    "type": "text",
    "content": "你怎么这么熟练",
    "emotion": "smile",
    "nextId": "ch1_photo_req2",
    "delay": 600
  },
  {
    "id": "ch1_photo_req2",
    "speaker": "nova",
    "type": "text",
    "content": "等等，我找找",
    "emotion": "normal",
    "nextId": "ch1_send3",
    "delay": 1500
  },
  {
    "id": "ch1_took1",
    "speaker": "nova",
    "type": "text",
    "content": "拍了",
    "emotion": "smile",
    "nextId": "ch1_took2",
    "delay": 600
  },
  {
    "id": "ch1_took2",
    "speaker": "nova",
    "type": "text",
    "content": "人在尴尬的时候总会留下证据",
    "emotion": "normal",
    "nextId": "ch1_send3",
    "delay": 800
  },
  {
    "id": "ch1_send3",
    "speaker": "system",
    "type": "typing",
    "content": "",
    "nextId": "ch1_photo_send",
    "delay": 2000
  },
  {
    "id": "ch1_photo_send",
    "speaker": "nova",
    "type": "image",
    "content": "看\n宇宙级威胁",
    "image": "/assets/photo_maintenance_board.jpg",
    "memoryAnchor": "maintenance_board",
    "nextId": "ch1_photo_reply",
    "delay": 400
  },
  {
    "id": "ch1_photo_reply",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【确实可怕】",
        "nextId": "ch1_ph1"
      },
      {
        "text": "【挺可爱的】",
        "nextId": "ch1_ph2"
      },
      {
        "text": "【谁贴的】",
        "nextId": "ch1_ph3"
      }
    ]
  },
  {
    "id": "ch1_ph1",
    "speaker": "nova",
    "type": "text",
    "content": "是吧",
    "emotion": "smile",
    "nextId": "ch1_ph1b",
    "delay": 600
  },
  {
    "id": "ch1_ph1b",
    "speaker": "nova",
    "type": "text",
    "content": "宇宙级威胁，认证完毕",
    "emotion": "smile",
    "nextId": "ch1_worry2",
    "delay": 800
  },
  {
    "id": "ch1_ph2",
    "speaker": "nova",
    "type": "text",
    "content": "？",
    "emotion": "smile",
    "nextId": "ch1_ph2b",
    "delay": 400
  },
  {
    "id": "ch1_ph2b",
    "speaker": "nova",
    "type": "text",
    "content": "你的审美是不是有 bug",
    "emotion": "smile",
    "nextId": "ch1_worry2",
    "delay": 800
  },
  {
    "id": "ch1_ph3",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch1_ph3b",
    "delay": 600
  },
  {
    "id": "ch1_ph3b",
    "speaker": "nova",
    "type": "text",
    "content": "但我怀疑是维修组的老霍",
    "emotion": "normal",
    "nextId": "ch1_ph3c",
    "delay": 600
  },
  {
    "id": "ch1_ph3c",
    "speaker": "nova",
    "type": "text",
    "content": "只有他会这么闲",
    "emotion": "smile",
    "nextId": "ch1_ph3d",
    "delay": 600
  },
  {
    "id": "ch1_ph3d",
    "speaker": "nova",
    "type": "text",
    "content": "他还说再让我给维修板贴眼睛",
    "emotion": "normal",
    "nextId": "ch1_ph3e",
    "delay": 700
  },
  {
    "id": "ch1_ph3e",
    "speaker": "nova",
    "type": "text",
    "content": "就把我也贴到检修通道上",
    "emotion": "smile",
    "nextId": "ch1_ph3f",
    "delay": 600
  },
  {
    "id": "ch1_ph3f",
    "speaker": "nova",
    "type": "text",
    "content": "其实",
    "emotion": "normal",
    "nextId": "ch1_worry1",
    "delay": 600
  },
  {
    "id": "ch1_worry1",
    "speaker": "nova",
    "type": "text",
    "content": "昨天我有点担心",
    "emotion": "normal",
    "nextId": "ch1_worry2",
    "delay": 800
  },
  {
    "id": "ch1_worry2",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你昨晚在担心我？】",
        "nextId": "ch1_worry3"
      }
    ]
  },
  {
    "id": "ch1_worry3",
    "speaker": "nova",
    "type": "text",
    "content": "担心你不在了",
    "emotion": "normal",
    "nextId": "ch1_worry4",
    "delay": 800
  },
  {
    "id": "ch1_worry4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【我不是还在吗？】",
        "nextId": "ch1_worry4_a1"
      },
      {
        "text": "【发生了什么？】",
        "nextId": "ch1_worry4_b1"
      }
    ]
  },
  {
    "id": "ch1_worry4_a1",
    "speaker": "nova",
    "type": "text",
    "content": "你这句话听起来很轻松",
    "emotion": "smile",
    "nextId": "ch1_worry4_a2",
    "delay": 600
  },
  {
    "id": "ch1_worry4_a2",
    "speaker": "nova",
    "type": "text",
    "content": "但我确实安心了一点",
    "emotion": "normal",
    "nextId": "ch1_worry5",
    "delay": 600
  },
  {
    "id": "ch1_worry4_b1",
    "speaker": "nova",
    "type": "text",
    "content": "认真说的话",
    "emotion": "normal",
    "nextId": "ch1_worry4_b2",
    "delay": 600
  },
  {
    "id": "ch1_worry4_b2",
    "speaker": "nova",
    "type": "text",
    "content": "我也不知道它算不算发生过",
    "emotion": "normal",
    "nextId": "ch1_worry5",
    "delay": 600
  },
  {
    "id": "ch1_worry5",
    "speaker": "nova",
    "type": "text",
    "content": "就是……",
    "emotion": "normal",
    "nextId": "ch1_worry6",
    "delay": 600
  },
  {
    "id": "ch1_worry6",
    "speaker": "nova",
    "type": "text",
    "content": "通讯突然建立",
    "emotion": "normal",
    "nextId": "ch1_worry7",
    "delay": 400
  },
  {
    "id": "ch1_worry7",
    "speaker": "nova",
    "type": "text",
    "content": "然后突然消失",
    "emotion": "normal",
    "nextId": "ch1_worry8",
    "delay": 400
  },
  {
    "id": "ch1_worry8",
    "speaker": "nova",
    "type": "text",
    "content": "我以为今天醒来",
    "emotion": "normal",
    "nextId": "ch1_worry9",
    "delay": 600
  },
  {
    "id": "ch1_worry9",
    "speaker": "nova",
    "type": "text",
    "content": "会发现一切都是幻觉",
    "emotion": "normal",
    "nextId": "ch1_worry10",
    "delay": 800
  },
  {
    "id": "ch1_worry10",
    "speaker": "nova",
    "type": "text",
    "content": "但现在确定了",
    "emotion": "smile",
    "nextId": "ch1_worry11",
    "delay": 600
  },
  {
    "id": "ch1_worry11",
    "speaker": "nova",
    "type": "text",
    "content": "你是真的",
    "emotion": "smile",
    "nextId": "ch1_worry12",
    "delay": 400
  },
  {
    "id": "ch1_worry12",
    "speaker": "nova",
    "type": "text",
    "content": "虽然还是有点离谱",
    "emotion": "smile",
    "nextId": "ch1_weather2",
    "delay": 600
  },
  {
    "id": "ch1_weather2",
    "speaker": "nova",
    "type": "text",
    "content": "诶",
    "emotion": "normal",
    "nextId": "ch1_weather3",
    "delay": 600
  },
  {
    "id": "ch1_weather3",
    "speaker": "nova",
    "type": "text",
    "content": "你那边是什么天气？",
    "emotion": "normal",
    "nextId": "ch1_weather_sys1",
    "delay": 800
  },
  {
    "id": "ch1_weather_sys1",
    "speaker": "system",
    "type": "status",
    "content": "奇怪",
    "nextId": "ch1_weather_sys2",
    "delay": 700
  },
  {
    "id": "ch1_weather_sys2",
    "speaker": "system",
    "type": "status",
    "content": "我总觉得你那边是真的有天气",
    "nextId": "ch1_weather_sys2b",
    "delay": 700
  },
  {
    "id": "ch1_weather_sys2b",
    "speaker": "system",
    "type": "status",
    "content": "不是系统模拟出来的那种",
    "nextId": "ch1_weather_sys3",
    "delay": 700
  },
  {
    "id": "ch1_weather_sys3",
    "speaker": "nova",
    "type": "text",
    "content": "奇怪",
    "emotion": "normal",
    "nextId": "ch1_weather_sys4",
    "delay": 500
  },
  {
    "id": "ch1_weather_sys4",
    "speaker": "nova",
    "type": "text",
    "content": "我总觉得你那边是真的有天气",
    "emotion": "normal",
    "nextId": "ch1_weather_sys5",
    "delay": 700
  },
  {
    "id": "ch1_weather_sys5",
    "speaker": "nova",
    "type": "text",
    "content": "不是系统模拟出来的那种",
    "emotion": "normal",
    "nextId": "ch1_weather4",
    "delay": 1000
  },
  {
    "id": "ch1_weather4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【晴天】",
        "nextId": "ch1_sun"
      },
      {
        "text": "【阴天】",
        "nextId": "ch1_cloud"
      },
      {
        "text": "【下雨】",
        "nextId": "ch1_rain"
      }
    ]
  },
  {
    "id": "ch1_sun",
    "speaker": "nova",
    "type": "text",
    "content": "羡慕了",
    "emotion": "normal",
    "nextId": "ch1_sun1b",
    "delay": 400
  },
  {
    "id": "ch1_sun1b",
    "speaker": "nova",
    "type": "text",
    "content": "唉，这里连“今天阳光不错”这种话都说不了",
    "emotion": "normal",
    "nextId": "ch1_sun_merge",
    "delay": 900
  },
  {
    "id": "ch1_cloud",
    "speaker": "nova",
    "type": "text",
    "content": "听起来很适合睡觉",
    "emotion": "normal",
    "nextId": "ch1_cloud2",
    "delay": 400
  },
  {
    "id": "ch1_cloud2",
    "speaker": "nova",
    "type": "text",
    "content": "当然，我现在也很适合睡觉",
    "emotion": "normal",
    "nextId": "ch1_cloud3",
    "delay": 700
  },
  {
    "id": "ch1_cloud3",
    "speaker": "nova",
    "type": "text",
    "content": "只是没有资格",
    "emotion": "normal",
    "nextId": "ch1_sun_merge",
    "delay": 700
  },
  {
    "id": "ch1_rain",
    "speaker": "nova",
    "type": "text",
    "content": "真的？",
    "emotion": "normal",
    "nextId": "ch1_rain2",
    "delay": 400
  },
  {
    "id": "ch1_rain2",
    "speaker": "nova",
    "type": "text",
    "content": "你怎么知道",
    "emotion": "normal",
    "nextId": "ch1_rain2b",
    "delay": 600
  },
  {
    "id": "ch1_rain2b",
    "speaker": "nova",
    "type": "text",
    "content": "真的在下雨？",
    "emotion": "normal",
    "nextId": "ch1_rain3",
    "delay": 800
  },
  {
    "id": "ch1_rain3",
    "speaker": "nova",
    "type": "text",
    "content": "我最喜欢下雨了",
    "emotion": "smile",
    "nextId": "ch1_sun_merge",
    "delay": 800
  },
  {
    "id": "ch1_sun_merge",
    "speaker": "nova",
    "type": "text",
    "content": "这里看不到天气",
    "emotion": "normal",
    "nextId": "ch1_sun3",
    "delay": 600
  },
  {
    "id": "ch1_sun3",
    "speaker": "nova",
    "type": "text",
    "content": "只有星星",
    "emotion": "normal",
    "nextId": "ch1_sun4",
    "delay": 400
  },
  {
    "id": "ch1_sun4",
    "speaker": "nova",
    "type": "text",
    "content": "每天都是星星",
    "emotion": "normal",
    "nextId": "ch1_sun4b",
    "delay": 600
  },
  {
    "id": "ch1_sun4b",
    "speaker": "nova",
    "type": "text",
    "content": "而且我们现在穿过的是静默航区",
    "emotion": "normal",
    "nextId": "ch1_sun4c",
    "delay": 700
  },
  {
    "id": "ch1_sun4c",
    "speaker": "nova",
    "type": "text",
    "content": "正常通讯延迟高得像在给未来寄信",
    "emotion": "normal",
    "nextId": "ch1_sun4d",
    "delay": 800
  },
  {
    "id": "ch1_sun4d",
    "speaker": "nova",
    "type": "text",
    "content": "所以你这种实时回复",
    "emotion": "normal",
    "nextId": "ch1_sun4e",
    "delay": 600
  },
  {
    "id": "ch1_sun4e",
    "speaker": "nova",
    "type": "text",
    "content": "才会离谱到让我有点不安",
    "emotion": "normal",
    "nextId": "ch1_star1",
    "delay": 800
  },
  {
    "id": "ch1_star1",
    "speaker": "nova",
    "type": "text",
    "content": "刚开始很好",
    "emotion": "normal",
    "nextId": "ch1_star2",
    "delay": 600
  },
  {
    "id": "ch1_star2",
    "speaker": "nova",
    "type": "text",
    "content": "后来就觉得",
    "emotion": "normal",
    "nextId": "ch1_star3",
    "delay": 600
  },
  {
    "id": "ch1_star3",
    "speaker": "nova",
    "type": "text",
    "content": "有点单调",
    "emotion": "normal",
    "nextId": "ch1_star4",
    "delay": 800
  },
  {
    "id": "ch1_star4",
    "speaker": "nova",
    "type": "text",
    "content": "说起来",
    "emotion": "normal",
    "nextId": "ch1_star5",
    "delay": 600
  },
  {
    "id": "ch1_star5",
    "speaker": "nova",
    "type": "text",
    "content": "我小时候最喜欢下雨",
    "emotion": "smile",
    "nextId": "ch1_star7",
    "delay": 800
  },
  {
    "id": "ch1_star7",
    "speaker": "nova",
    "type": "text",
    "content": "因为下雨的时候",
    "emotion": "normal",
    "nextId": "ch1_star8",
    "delay": 600
  },
  {
    "id": "ch1_star8",
    "speaker": "nova",
    "type": "text",
    "content": "大家都会回家",
    "emotion": "normal",
    "nextId": "ch1_star9",
    "delay": 400
  },
  {
    "id": "ch1_star9",
    "speaker": "nova",
    "type": "text",
    "content": "街道会变安静",
    "emotion": "normal",
    "nextId": "ch1_star10",
    "delay": 400
  },
  {
    "id": "ch1_star10",
    "speaker": "nova",
    "type": "text",
    "content": "然后我就能坐在窗边发呆",
    "emotion": "smile",
    "nextId": "ch1_star12",
    "delay": 800
  },
  {
    "id": "ch1_star12",
    "speaker": "nova",
    "type": "text",
    "content": "是吧",
    "emotion": "smile",
    "nextId": "ch1_star13",
    "delay": 400
  },
  {
    "id": "ch1_star13",
    "speaker": "nova",
    "type": "text",
    "content": "我能看一下午",
    "emotion": "smile",
    "nextId": "ch1_star14",
    "delay": 600
  },
  {
    "id": "ch1_star14",
    "speaker": "nova",
    "type": "text",
    "content": "结果长大以后",
    "emotion": "normal",
    "nextId": "ch1_star15",
    "delay": 600
  },
  {
    "id": "ch1_star15",
    "speaker": "nova",
    "type": "text",
    "content": "天天看宇宙发呆",
    "emotion": "smile",
    "nextId": "ch1_star16",
    "delay": 600
  },
  {
    "id": "ch1_star16",
    "speaker": "nova",
    "type": "text",
    "content": "梦想实现过头了",
    "emotion": "smile",
    "nextId": "ch1_n7_2",
    "delay": 600
  },
  {
    "id": "ch1_n7_2",
    "speaker": "nova",
    "type": "text",
    "content": "对了",
    "emotion": "normal",
    "nextId": "ch1_n7_3",
    "delay": 600
  },
  {
    "id": "ch1_n7_3",
    "speaker": "nova",
    "type": "text",
    "content": "你养过宠物吗？",
    "emotion": "normal",
    "nextId": "ch1_n7_4",
    "delay": 800
  },
  {
    "id": "ch1_n7_4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【曾经养过】",
        "nextId": "ch1_pet_yes"
      },
      {
        "text": "【没有】",
        "nextId": "ch1_nopet1"
      },
      {
        "text": "【现在还养着】",
        "nextId": "ch1_pet_now"
      }
    ]
  },
  {
    "id": "ch1_pet_yes",
    "speaker": "nova",
    "type": "text",
    "content": "那你懂",
    "emotion": "smile",
    "nextId": "ch1_pet_yes2",
    "delay": 600
  },
  {
    "id": "ch1_pet_yes2",
    "speaker": "nova",
    "type": "text",
    "content": "宠物很麻烦",
    "emotion": "normal",
    "nextId": "ch1_pet_yes3",
    "delay": 600
  },
  {
    "id": "ch1_pet_yes3",
    "speaker": "nova",
    "type": "text",
    "content": "但真的很难不喜欢",
    "emotion": "smile",
    "nextId": "ch1_pet1",
    "delay": 800
  },
  {
    "id": "ch1_nopet1",
    "speaker": "nova",
    "type": "text",
    "content": "那也正常",
    "emotion": "normal",
    "nextId": "ch1_nopet2",
    "delay": 600
  },
  {
    "id": "ch1_nopet2",
    "speaker": "nova",
    "type": "text",
    "content": "现在的城市生活节奏太快了",
    "emotion": "normal",
    "nextId": "ch1_nopet3",
    "delay": 600
  },
  {
    "id": "ch1_nopet3",
    "speaker": "nova",
    "type": "text",
    "content": "根本没时间细心照料它们",
    "emotion": "normal",
    "nextId": "ch1_pet1",
    "delay": 800
  },
  {
    "id": "ch1_pet_now",
    "speaker": "nova",
    "type": "text",
    "content": "真好",
    "emotion": "smile",
    "nextId": "ch1_pet_now2",
    "delay": 600
  },
  {
    "id": "ch1_pet_now2",
    "speaker": "nova",
    "type": "text",
    "content": "那替我多摸两下吧",
    "emotion": "smile",
    "nextId": "ch1_pet_now3",
    "delay": 600
  },
  {
    "id": "ch1_pet_now3",
    "speaker": "nova",
    "type": "text",
    "content": "就当帮我还愿了",
    "emotion": "smile",
    "nextId": "ch1_pet1",
    "delay": 800
  },
  {
    "id": "ch1_pet1",
    "speaker": "nova",
    "type": "text",
    "content": "我以前养过猫",
    "emotion": "normal",
    "nextId": "ch1_pet2",
    "delay": 600
  },
  {
    "id": "ch1_pet2",
    "speaker": "nova",
    "type": "text",
    "content": "一只橘猫",
    "emotion": "smile",
    "nextId": "ch1_pet3",
    "delay": 600
  },
  {
    "id": "ch1_pet3",
    "speaker": "nova",
    "type": "text",
    "content": "胖得像违法建筑",
    "emotion": "smile",
    "nextId": "ch1_pet5",
    "delay": 800
  },
  {
    "id": "ch1_pet5",
    "speaker": "nova",
    "type": "text",
    "content": "N7",
    "emotion": "smile",
    "memoryAnchor": "n7",
    "nextId": "ch1_pet5_idx1",
    "delay": 600
  },
  {
    "id": "ch1_pet5_idx1",
    "speaker": "system",
    "type": "status",
    "content": "历史索引匹配：N7",
    "nextId": "ch1_pet5_idx2",
    "delay": 700
  },
  {
    "id": "ch1_pet5_idx2",
    "speaker": "system",
    "type": "status",
    "content": "匹配来源：未知循环",
    "nextId": "ch1_pet5_anom1",
    "delay": 800
  },
  {
    "id": "ch1_pet5_anom1",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch1_pet5_anom2",
    "delay": 600
  },
  {
    "id": "ch1_pet5_anom2",
    "speaker": "nova",
    "type": "text",
    "content": "我刚才是不是已经跟你说过 N7？",
    "emotion": "normal",
    "nextId": "ch1_pet5_anom3",
    "delay": 800
  },
  {
    "id": "ch1_pet5_anom3",
    "speaker": "nova",
    "type": "text",
    "content": "可这是我们第一次聊到它吧",
    "emotion": "normal",
    "nextId": "ch1_pet5_anom4",
    "delay": 800
  },
  {
    "id": "ch1_pet5_anom4",
    "speaker": "nova",
    "type": "text",
    "content": "……算了",
    "emotion": "normal",
    "nextId": "ch1_pet5_anom5",
    "delay": 600
  },
  {
    "id": "ch1_pet5_anom5",
    "speaker": "nova",
    "type": "text",
    "content": "可能是我睡眠不足",
    "emotion": "normal",
    "nextId": "ch1_pet7",
    "delay": 800
  },
  {
    "id": "ch1_pet7",
    "speaker": "nova",
    "type": "text",
    "content": "因为我七岁捡到它",
    "emotion": "smile",
    "nextId": "ch1_pet8",
    "delay": 600
  },
  {
    "id": "ch1_pet8",
    "speaker": "nova",
    "type": "text",
    "content": "我的取名能力从小就不怎么样",
    "emotion": "smile",
    "nextId": "ch1_pet10",
    "delay": 800
  },
  {
    "id": "ch1_pet10",
    "speaker": "nova",
    "type": "text",
    "content": "后来它老死了",
    "emotion": "normal",
    "nextId": "ch1_pet11",
    "delay": 1000
  },
  {
    "id": "ch1_pet11",
    "speaker": "nova",
    "type": "text",
    "content": "挺正常的",
    "emotion": "normal",
    "nextId": "ch1_pet12",
    "delay": 600
  },
  {
    "id": "ch1_pet12",
    "speaker": "nova",
    "type": "text",
    "content": "只是那天我第一次发现",
    "emotion": "normal",
    "nextId": "ch1_pet13",
    "delay": 800
  },
  {
    "id": "ch1_pet13",
    "speaker": "nova",
    "type": "text",
    "content": "有些东西不会一直陪着你",
    "emotion": "sad",
    "nextId": "ch1_photo_n7",
    "delay": 2000
  },
  {
    "id": "ch1_photo_n7",
    "speaker": "system",
    "type": "typing",
    "content": "",
    "nextId": "ch1_n7photo",
    "delay": 2500
  },
  {
    "id": "ch1_n7photo",
    "speaker": "nova",
    "type": "image",
    "content": "这是它最后的照片\n在控制台上睡着了",
    "image": "/assets/nova_n7_photo.png",
    "nextId": "ch1_n7_emotion",
    "delay": 400
  },
  {
    "id": "ch1_n7_emotion",
    "speaker": "nova",
    "type": "text",
    "content": "抱歉",
    "emotion": "sad",
    "nextId": "ch1_n7_emotion2",
    "delay": 800
  },
  {
    "id": "ch1_n7_emotion2",
    "speaker": "nova",
    "type": "text",
    "content": "气氛突然有点奇怪",
    "emotion": "normal",
    "nextId": "ch1_n7_emotion3",
    "delay": 600
  },
  {
    "id": "ch1_n7_emotion3",
    "speaker": "nova",
    "type": "text",
    "content": "换个话题",
    "emotion": "normal",
    "nextId": "ch1_cook1",
    "delay": 600
  },
  {
    "id": "ch1_cook1",
    "speaker": "nova",
    "type": "text",
    "content": "你会做饭吗？",
    "emotion": "normal",
    "nextId": "ch1_cook2",
    "delay": 800
  },
  {
    "id": "ch1_cook2",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【会】",
        "nextId": "ch1_cook_yes"
      },
      {
        "text": "【不会】",
        "nextId": "ch1_cook_no"
      },
      {
        "text": "【一点点】",
        "nextId": "ch1_cook_little"
      }
    ]
  },
  {
    "id": "ch1_cook_yes",
    "speaker": "nova",
    "type": "text",
    "content": "羡慕",
    "emotion": "normal",
    "nextId": "ch1_cook_yes2",
    "delay": 400
  },
  {
    "id": "ch1_cook_yes2",
    "speaker": "nova",
    "type": "text",
    "content": "会做饭的人在宇宙里应该算稀有资源",
    "emotion": "smile",
    "nextId": "ch1_cook_merge",
    "delay": 900
  },
  {
    "id": "ch1_cook_no",
    "speaker": "nova",
    "type": "text",
    "content": "那我们打平了",
    "emotion": "smile",
    "nextId": "ch1_cook_no2",
    "delay": 600
  },
  {
    "id": "ch1_cook_no2",
    "speaker": "nova",
    "type": "text",
    "content": "不过我可能输得更彻底",
    "emotion": "normal",
    "nextId": "ch1_cook_merge",
    "delay": 800
  },
  {
    "id": "ch1_cook_little",
    "speaker": "nova",
    "type": "text",
    "content": "那也比我强",
    "emotion": "smile",
    "nextId": "ch1_cook_little2",
    "delay": 600
  },
  {
    "id": "ch1_cook_little2",
    "speaker": "nova",
    "type": "text",
    "content": "我属于反向天赋",
    "emotion": "smile",
    "nextId": "ch1_cook_merge",
    "delay": 800
  },
  {
    "id": "ch1_cook_merge",
    "speaker": "nova",
    "type": "text",
    "content": "我不会",
    "emotion": "normal",
    "nextId": "ch1_cook_merge2",
    "delay": 600
  },
  {
    "id": "ch1_cook_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "准确来说",
    "emotion": "normal",
    "nextId": "ch1_cook_merge3",
    "delay": 400
  },
  {
    "id": "ch1_cook_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "我会把能吃的东西变成不能吃",
    "emotion": "smile",
    "nextId": "ch1_cook_story",
    "delay": 800
  },
  {
    "id": "ch1_cook_story",
    "speaker": "nova",
    "type": "text",
    "content": "上个月",
    "emotion": "normal",
    "nextId": "ch1_cook_story2",
    "delay": 400
  },
  {
    "id": "ch1_cook_story2",
    "speaker": "nova",
    "type": "text",
    "content": "我成功把营养面做成了固体武器",
    "emotion": "smile",
    "nextId": "ch1_cook_story3",
    "delay": 600
  },
  {
    "id": "ch1_cook_story3",
    "speaker": "nova",
    "type": "text",
    "content": "维修组现在还拿它开玩笑",
    "emotion": "smile",
    "nextId": "ch1_steak_photo",
    "delay": 800
  },
  {
    "id": "ch1_steak_photo",
    "speaker": "system",
    "type": "timestamp",
    "content": "11:42",
    "nextId": "ch1_steak1",
    "delay": 400
  },
  {
    "id": "ch1_steak1",
    "speaker": "nova",
    "type": "text",
    "content": "糟了",
    "emotion": "normal",
    "nextId": "ch1_steak3",
    "delay": 600
  },
  {
    "id": "ch1_steak3",
    "speaker": "nova",
    "type": "text",
    "content": "例会",
    "emotion": "normal",
    "nextId": "ch1_steak4",
    "delay": 400
  },
  {
    "id": "ch1_steak4",
    "speaker": "nova",
    "type": "text",
    "content": "我忘了",
    "emotion": "smile",
    "nextId": "ch1_steak5",
    "delay": 400
  },
  {
    "id": "ch1_steak5",
    "speaker": "nova",
    "type": "text",
    "content": "舰长会杀了我的",
    "emotion": "smile",
    "nextId": "ch1_go1",
    "delay": 800
  },
  {
    "id": "ch1_go1",
    "speaker": "nova",
    "type": "text",
    "content": "等会",
    "emotion": "normal",
    "nextId": "ch1_go2",
    "delay": 600
  },
  {
    "id": "ch1_go2",
    "speaker": "nova",
    "type": "text",
    "content": "先说个正事",
    "emotion": "normal",
    "nextId": "ch1_go4",
    "delay": 600
  },
  {
    "id": "ch1_go4",
    "speaker": "nova",
    "type": "text",
    "content": "谢谢",
    "emotion": "normal",
    "nextId": "ch1_go6",
    "delay": 600
  },
  {
    "id": "ch1_go6",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch1_go7",
    "delay": 600
  },
  {
    "id": "ch1_go7",
    "speaker": "nova",
    "type": "text",
    "content": "可能是因为你还在",
    "emotion": "normal",
    "nextId": "ch1_go8",
    "delay": 800
  },
  {
    "id": "ch1_go8",
    "speaker": "nova",
    "type": "text",
    "content": "总之",
    "emotion": "normal",
    "nextId": "ch1_go9",
    "delay": 400
  },
  {
    "id": "ch1_go9",
    "speaker": "nova",
    "type": "text",
    "content": "谢谢",
    "emotion": "smile",
    "nextId": "ch1_go10",
    "delay": 800
  },
  {
    "id": "ch1_go10",
    "speaker": "nova",
    "type": "text",
    "content": "我晚上再回来",
    "emotion": "normal",
    "nextId": "ch1_go11",
    "delay": 600
  },
  {
    "id": "ch1_go11",
    "speaker": "nova",
    "type": "text",
    "content": "你别突然消失啊",
    "emotion": "smile",
    "nextId": "ch1_offline",
    "delay": 1500
  },
  {
    "id": "ch1_offline",
    "speaker": "system",
    "type": "status",
    "content": "Nova 已离线",
    "nextId": "ch1_night",
    "delay": 3000
  },
  {
    "id": "ch1_night",
    "speaker": "system",
    "type": "timestamp",
    "content": "21:17",
    "nextId": "ch1_night1",
    "delay": 400
  },
  {
    "id": "ch1_night1",
    "speaker": "system",
    "type": "status",
    "content": "收到新消息",
    "nextId": "ch1_night2",
    "delay": 800
  },
  {
    "id": "ch1_night2",
    "speaker": "nova",
    "type": "text",
    "content": "回来了",
    "emotion": "normal",
    "nextId": "ch1_night3",
    "delay": 600
  },
  {
    "id": "ch1_night3",
    "speaker": "nova",
    "type": "text",
    "content": "坏消息",
    "emotion": "normal",
    "nextId": "ch1_night4",
    "delay": 600
  },
  {
    "id": "ch1_night4",
    "speaker": "nova",
    "type": "text",
    "content": "我被舰长骂了",
    "emotion": "smile",
    "nextId": "ch1_night4b",
    "delay": 800
  },
  {
    "id": "ch1_night4b",
    "speaker": "nova",
    "type": "text",
    "content": "更坏的消息",
    "emotion": "normal",
    "nextId": "ch1_night4c",
    "delay": 600
  },
  {
    "id": "ch1_night4c",
    "speaker": "nova",
    "type": "text",
    "content": "他顺手把我的咖啡换成了低因的",
    "emotion": "normal",
    "nextId": "ch1_night4d",
    "delay": 800
  },
  {
    "id": "ch1_night4d",
    "speaker": "nova",
    "type": "text",
    "content": "这人骂人很凶",
    "emotion": "normal",
    "nextId": "ch1_night4e",
    "delay": 600
  },
  {
    "id": "ch1_night4e",
    "speaker": "nova",
    "type": "text",
    "content": "关心人也很凶",
    "emotion": "smile",
    "nextId": "ch1_night5",
    "delay": 800
  },
  {
    "id": "ch1_night5",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【活该】",
        "nextId": "ch1_night_gotcha"
      },
      {
        "text": "【怎么又被骂了？】",
        "nextId": "ch1_night_why"
      },
      {
        "text": "【哈哈哈哈】",
        "nextId": "ch1_night6"
      }
    ]
  },
  {
    "id": "ch1_night_gotcha",
    "speaker": "nova",
    "type": "text",
    "content": "你这人怎么站舰长那边",
    "emotion": "smile",
    "nextId": "ch1_night_gotcha2",
    "delay": 700
  },
  {
    "id": "ch1_night_gotcha2",
    "speaker": "nova",
    "type": "text",
    "content": "我们友谊的小船裂开了",
    "emotion": "smile",
    "nextId": "ch1_night_merge",
    "delay": 800
  },
  {
    "id": "ch1_night_why",
    "speaker": "nova",
    "type": "text",
    "content": "原因很简单",
    "emotion": "normal",
    "nextId": "ch1_night_why2",
    "delay": 600
  },
  {
    "id": "ch1_night_why2",
    "speaker": "nova",
    "type": "text",
    "content": "但我说出来会显得我很不靠谱",
    "emotion": "smile",
    "nextId": "ch1_night_merge",
    "delay": 800
  },
  {
    "id": "ch1_night6",
    "speaker": "nova",
    "type": "text",
    "content": "你居然笑",
    "emotion": "smile",
    "nextId": "ch1_night7",
    "delay": 600
  },
  {
    "id": "ch1_night7",
    "speaker": "nova",
    "type": "text",
    "content": "我们友谊的小船沉了",
    "emotion": "smile",
    "nextId": "ch1_night_merge",
    "delay": 800
  },
  {
    "id": "ch1_night_merge",
    "speaker": "nova",
    "type": "text",
    "content": "开会迟到",
    "emotion": "normal",
    "nextId": "ch1_night10",
    "delay": 400
  },
  {
    "id": "ch1_night10",
    "speaker": "nova",
    "type": "text",
    "content": "而且睡着了",
    "emotion": "smile",
    "nextId": "ch1_night12",
    "delay": 800
  },
  {
    "id": "ch1_night12",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "normal",
    "nextId": "ch1_night13",
    "delay": 400
  },
  {
    "id": "ch1_night13",
    "speaker": "nova",
    "type": "text",
    "content": "这事不占理",
    "emotion": "smile",
    "nextId": "ch1_night14",
    "delay": 600
  },
  {
    "id": "ch1_night14",
    "speaker": "nova",
    "type": "text",
    "content": "不过",
    "emotion": "normal",
    "nextId": "ch1_night16",
    "delay": 600
  },
  {
    "id": "ch1_night16",
    "speaker": "nova",
    "type": "text",
    "content": "今天其实挺开心的",
    "emotion": "smile",
    "nextId": "ch1_night17",
    "delay": 800
  },
  {
    "id": "ch1_night17",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【因为我？】",
        "nextId": "ch1_night18",
        "trustDelta": 1
      },
      {
        "text": "【因为没死？】",
        "nextId": "ch1_night18b"
      },
      {
        "text": "【因为摸鱼成功？】",
        "nextId": "ch1_night18c"
      }
    ]
  },
  {
    "id": "ch1_night18",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch1_night18d",
    "delay": 800
  },
  {
    "id": "ch1_night18d",
    "speaker": "nova",
    "type": "text",
    "content": "有一点",
    "emotion": "smile",
    "nextId": "ch1_night18e",
    "delay": 600
  },
  {
    "id": "ch1_night18e",
    "speaker": "nova",
    "type": "text",
    "content": "别得意",
    "emotion": "smile",
    "nextId": "ch1_night_merge2",
    "delay": 800
  },
  {
    "id": "ch1_night18b",
    "speaker": "nova",
    "type": "text",
    "content": "这个理由确实很充分",
    "emotion": "smile",
    "nextId": "ch1_night18b2",
    "delay": 700
  },
  {
    "id": "ch1_night18b2",
    "speaker": "nova",
    "type": "text",
    "content": "活着下班，值得庆祝",
    "emotion": "smile",
    "nextId": "ch1_night_merge2",
    "delay": 800
  },
  {
    "id": "ch1_night18c",
    "speaker": "nova",
    "type": "text",
    "content": "你说得像我是什么惯犯",
    "emotion": "smile",
    "nextId": "ch1_night18c2",
    "delay": 700
  },
  {
    "id": "ch1_night18c2",
    "speaker": "nova",
    "type": "text",
    "content": "虽然证据对我很不利",
    "emotion": "smile",
    "nextId": "ch1_night_merge2",
    "delay": 800
  },
  {
    "id": "ch1_night_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "好了",
    "emotion": "normal",
    "nextId": "ch1_night23",
    "delay": 600
  },
  {
    "id": "ch1_night23",
    "speaker": "nova",
    "type": "text",
    "content": "我得去绕飞船一圈了",
    "emotion": "normal",
    "nextId": "ch1_night24",
    "delay": 600
  },
  {
    "id": "ch1_night24",
    "speaker": "nova",
    "type": "text",
    "content": "晚安",
    "emotion": "normal",
    "memoryAnchor": "goodnight",
    "nextId": "ch1_night25",
    "delay": 800
  },
  {
    "id": "ch1_night25",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【晚安】",
        "nextId": "ch1_night26",
        "trustDelta": 1
      }
    ]
  },
  {
    "id": "ch1_night26",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "ch1_night27",
    "delay": 600
  },
  {
    "id": "ch1_night27",
    "speaker": "nova",
    "type": "text",
    "content": "晚安",
    "emotion": "smile",
    "nextId": "ch1_night28",
    "delay": 600
  },
  {
    "id": "ch1_night28",
    "speaker": "nova",
    "type": "text",
    "content": "还有",
    "emotion": "normal",
    "nextId": "ch1_night32",
    "delay": 600
  },
  {
    "id": "ch1_night32",
    "speaker": "nova",
    "type": "text",
    "content": "很高兴认识你",
    "emotion": "smile",
    "nextId": "ch1_night33",
    "delay": 1500
  },
  {
    "id": "ch1_night33",
    "speaker": "system",
    "type": "status",
    "content": "Nova 已离线",
    "nextId": "ch1_draft",
    "delay": 3000
  },
  {
    "id": "ch1_draft",
    "speaker": "system",
    "type": "timestamp",
    "content": "深夜 02:41",
    "nextId": "ch1_draft1",
    "delay": 400
  },
  {
    "id": "ch1_draft1",
    "speaker": "system",
    "type": "draft",
    "content": "未发送草稿 / 02:41||不对\n我明明没有告诉过他 N7",
    "nextId": "CH2_START",
    "delay": 400
  },
  {
    "id": "CH2_START",
    "speaker": "system",
    "type": "chapter",
    "content": "第二章：日常",
    "nextId": "ch2_0",
    "delay": 400
  },
  {
    "id": "ch2_0",
    "speaker": "system",
    "type": "timestamp",
    "content": "第三天 07:26",
    "nextId": "ch2_1",
    "delay": 400
  },
  {
    "id": "ch2_1",
    "speaker": "system",
    "type": "status",
    "content": "收到新消息",
    "nextId": "ch2_2",
    "delay": 800
  },
  {
    "id": "ch2_2",
    "speaker": "nova",
    "type": "text",
    "content": "坏了",
    "emotion": "normal",
    "nextId": "ch2_3",
    "delay": 600
  },
  {
    "id": "ch2_3",
    "speaker": "nova",
    "type": "text",
    "content": "出大事了",
    "emotion": "normal",
    "nextId": "ch2_4",
    "delay": 800
  },
  {
    "id": "ch2_4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你又闯什么祸了？】",
        "nextId": "ch2_5d"
      },
      {
        "text": "【飞船炸了？】",
        "nextId": "ch2_5b"
      },
      {
        "text": "【你又迟到了？】",
        "nextId": "ch2_5c"
      }
    ]
  },
  {
    "id": "ch2_5d",
    "speaker": "nova",
    "type": "text",
    "content": "我犯了一个导航员不该犯的错误",
    "emotion": "normal",
    "nextId": "ch2_5d2",
    "delay": 600
  },
  {
    "id": "ch2_5d2",
    "speaker": "nova",
    "type": "text",
    "content": "而且非常低级",
    "emotion": "normal",
    "nextId": "ch2_5d3",
    "delay": 600
  },
  {
    "id": "ch2_5d3",
    "speaker": "nova",
    "type": "text",
    "content": "低级到我不想承认",
    "emotion": "smile",
    "nextId": "ch2_alarm",
    "delay": 800
  },
  {
    "id": "ch2_5b",
    "speaker": "nova",
    "type": "text",
    "content": "……暂时还没有",
    "emotion": "smile",
    "nextId": "ch2_5b3",
    "delay": 600
  },
  {
    "id": "ch2_5b3",
    "speaker": "nova",
    "type": "text",
    "content": "谢谢你一上来就把事故等级拉满",
    "emotion": "normal",
    "nextId": "ch2_5b4",
    "delay": 700
  },
  {
    "id": "ch2_5b4",
    "speaker": "nova",
    "type": "text",
    "content": "不过以我今天的状态",
    "emotion": "normal",
    "nextId": "ch2_5b5",
    "delay": 600
  },
  {
    "id": "ch2_5b5",
    "speaker": "nova",
    "type": "text",
    "content": "也不是完全没可能",
    "emotion": "smile",
    "nextId": "ch2_alarm",
    "delay": 800
  },
  {
    "id": "ch2_5c",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch2_5c2",
    "delay": 800
  },
  {
    "id": "ch2_5c2",
    "speaker": "nova",
    "type": "text",
    "content": "为什么是“又”",
    "emotion": "normal",
    "nextId": "ch2_5c3",
    "delay": 700
  },
  {
    "id": "ch2_5c3",
    "speaker": "nova",
    "type": "text",
    "content": "你这个字用得很伤人",
    "emotion": "smile",
    "nextId": "ch2_5c4",
    "delay": 700
  },
  {
    "id": "ch2_5c4",
    "speaker": "nova",
    "type": "text",
    "content": "虽然这次你猜对了",
    "emotion": "smile",
    "nextId": "ch2_alarm",
    "delay": 800
  },
  {
    "id": "ch2_alarm",
    "speaker": "nova",
    "type": "text",
    "content": "我把闹钟关了",
    "emotion": "normal",
    "nextId": "ch2_alarm2",
    "delay": 600
  },
  {
    "id": "ch2_alarm2",
    "speaker": "nova",
    "type": "text",
    "content": "然后梦见自己起床了",
    "emotion": "smile",
    "nextId": "ch2_alarm3",
    "delay": 600
  },
  {
    "id": "ch2_alarm3",
    "speaker": "nova",
    "type": "text",
    "content": "甚至梦见自己已经开完会了",
    "emotion": "smile",
    "nextId": "ch2_alarm4",
    "delay": 800
  },
  {
    "id": "ch2_alarm4",
    "speaker": "nova",
    "type": "text",
    "content": "醒来的时候",
    "emotion": "normal",
    "nextId": "ch2_alarm5",
    "delay": 600
  },
  {
    "id": "ch2_alarm5",
    "speaker": "nova",
    "type": "text",
    "content": "舰长正站在我面前",
    "emotion": "smile",
    "nextId": "ch2_merge5",
    "delay": 800
  },
  {
    "id": "ch2_merge5",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【经典】",
        "nextId": "ch2_classic"
      },
      {
        "text": "【太真实了】",
        "nextId": "ch2_real"
      },
      {
        "text": "【后来现实给了你一拳？】",
        "nextId": "ch2_punch"
      }
    ]
  },
  {
    "id": "ch2_classic",
    "speaker": "nova",
    "type": "text",
    "content": "不要说得像你很有经验一样",
    "emotion": "smile",
    "nextId": "ch2_classic2",
    "delay": 600
  },
  {
    "id": "ch2_classic2",
    "speaker": "nova",
    "type": "text",
    "content": "虽然我怀疑你确实有",
    "emotion": "smile",
    "nextId": "ch2_merge6",
    "delay": 800
  },
  {
    "id": "ch2_real",
    "speaker": "nova",
    "type": "text",
    "content": "对吧",
    "emotion": "smile",
    "nextId": "ch2_real2",
    "delay": 500
  },
  {
    "id": "ch2_real2",
    "speaker": "nova",
    "type": "text",
    "content": "最可怕的是梦里的我特别清醒",
    "emotion": "normal",
    "nextId": "ch2_real3",
    "delay": 700
  },
  {
    "id": "ch2_real3",
    "speaker": "nova",
    "type": "text",
    "content": "还认真做了会议记录",
    "emotion": "smile",
    "nextId": "ch2_merge6",
    "delay": 800
  },
  {
    "id": "ch2_punch",
    "speaker": "nova",
    "type": "text",
    "content": "很准",
    "emotion": "smile",
    "nextId": "ch2_punch2",
    "delay": 500
  },
  {
    "id": "ch2_punch2",
    "speaker": "nova",
    "type": "text",
    "content": "现实真的给了我一拳",
    "emotion": "normal",
    "nextId": "ch2_punch3",
    "delay": 700
  },
  {
    "id": "ch2_punch3",
    "speaker": "nova",
    "type": "text",
    "content": "舰长的脸就是那一拳",
    "emotion": "smile",
    "nextId": "ch2_merge6",
    "delay": 800
  },
  {
    "id": "ch2_merge6",
    "speaker": "nova",
    "type": "text",
    "content": "人生至暗时刻",
    "emotion": "smile",
    "nextId": "ch2_merge7",
    "delay": 600
  },
  {
    "id": "ch2_merge7",
    "speaker": "nova",
    "type": "text",
    "content": "我现在严重怀疑",
    "emotion": "normal",
    "nextId": "ch2_merge7b",
    "delay": 600
  },
  {
    "id": "ch2_merge7b",
    "speaker": "nova",
    "type": "text",
    "content": "梦境系统和现实系统之间缺少同步机制",
    "emotion": "normal",
    "nextId": "ch2_5",
    "delay": 900
  },
  {
    "id": "ch2_5",
    "speaker": "nova",
    "type": "text",
    "content": "你笑得太开心了",
    "emotion": "normal",
    "nextId": "ch2_5a",
    "delay": 600
  },
  {
    "id": "ch2_5a",
    "speaker": "nova",
    "type": "text",
    "content": "记仇",
    "emotion": "normal",
    "nextId": "ch2_5b2",
    "delay": 600
  },
  {
    "id": "ch2_5b2",
    "speaker": "nova",
    "type": "text",
    "content": "不过",
    "emotion": "smile",
    "nextId": "ch2_haha_merge",
    "delay": 800
  },
  {
    "id": "ch2_haha_merge",
    "speaker": "nova",
    "type": "text",
    "content": "今天有件怪事",
    "emotion": "normal",
    "nextId": "ch2_today",
    "delay": 800
  },
  {
    "id": "ch2_today",
    "speaker": "nova",
    "type": "text",
    "content": "我做梦了",
    "emotion": "smile",
    "nextId": "ch2_dream1",
    "delay": 600
  },
  {
    "id": "ch2_dream1",
    "speaker": "nova",
    "type": "text",
    "content": "不正常",
    "emotion": "smile",
    "nextId": "ch2_dream2",
    "delay": 600
  },
  {
    "id": "ch2_dream2",
    "speaker": "nova",
    "type": "text",
    "content": "因为梦里有你",
    "emotion": "smile",
    "nextId": "ch2_dream7",
    "delay": 800
  },
  {
    "id": "ch2_dream7",
    "speaker": "nova",
    "type": "text",
    "content": "我不知道",
    "emotion": "normal",
    "nextId": "ch2_dream7_v10_1",
    "delay": 600
  },
  {
    "id": "ch2_dream7_v10_1",
    "speaker": "nova",
    "type": "text",
    "content": "梦很模糊",
    "emotion": "normal",
    "nextId": "ch2_dream7_v10_2",
    "delay": 600
  },
  {
    "id": "ch2_dream7_v10_2",
    "speaker": "nova",
    "type": "text",
    "content": "我只记得",
    "emotion": "normal",
    "nextId": "ch2_dream7_v10_3",
    "delay": 600
  },
  {
    "id": "ch2_dream7_v10_3",
    "speaker": "nova",
    "type": "text",
    "content": "你好像对我说了一句话",
    "emotion": "normal",
    "nextId": "ch2_dream9",
    "delay": 600
  },
  {
    "id": "ch2_dream9",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch2_dream10",
    "delay": 600
  },
  {
    "id": "ch2_dream10_v10_4",
    "speaker": "nova",
    "type": "text",
    "content": "突然想不起来了",
    "emotion": "normal",
    "nextId": "ch2_dream10_v10_5",
    "delay": 600
  },
  {
    "id": "ch2_dream10_v10_5",
    "speaker": "nova",
    "type": "text",
    "content": "但我记得一个画面",
    "emotion": "normal",
    "nextId": "ch2_dream10_v10_6",
    "delay": 600
  },
  {
    "id": "ch2_dream10_v10_6",
    "speaker": "nova",
    "type": "text",
    "content": "你站在观测窗前",
    "emotion": "normal",
    "nextId": "ch2_dream10_v10_7",
    "delay": 600
  },
  {
    "id": "ch2_dream10_v10_7",
    "speaker": "nova",
    "type": "text",
    "content": "这不可能",
    "emotion": "normal",
    "nextId": "ch2_dream10_v10_8",
    "delay": 600
  },
  {
    "id": "ch2_dream10_v10_8",
    "speaker": "nova",
    "type": "text",
    "content": "你根本不在 Aurora 上",
    "emotion": "normal",
    "nextId": "ch2_dream10_v10_9",
    "delay": 600
  },
  {
    "id": "ch2_dream10_v10_9",
    "speaker": "nova",
    "type": "text",
    "content": "算了",
    "emotion": "normal",
    "nextId": "ch2_dream10_v10_10",
    "delay": 600
  },
  {
    "id": "ch2_dream10_v10_10",
    "speaker": "nova",
    "type": "text",
    "content": "可能只是普通梦",
    "emotion": "normal",
    "nextId": "ch2_dream10_v10_11",
    "delay": 600
  },
  {
    "id": "ch2_dream10_v10_11",
    "speaker": "nova",
    "type": "text",
    "content": "如果普通梦会让人背后发凉的话",
    "emotion": "normal",
    "nextId": "ch2_dream13",
    "delay": 600
  },
  {
    "id": "ch2_dream10",
    "speaker": "nova",
    "type": "text",
    "content": "奇怪",
    "emotion": "normal",
    "nextId": "ch2_dream10_v10_4",
    "delay": 2000
  },
  {
    "id": "ch2_dream13",
    "speaker": "nova",
    "type": "text",
    "content": "也许吧",
    "emotion": "normal",
    "nextId": "ch2_dream14",
    "delay": 600
  },
  {
    "id": "ch2_dream14",
    "speaker": "nova",
    "type": "text",
    "content": "这样想的话",
    "emotion": "normal",
    "nextId": "ch2_dream15",
    "delay": 600
  },
  {
    "id": "ch2_dream15",
    "speaker": "nova",
    "type": "text",
    "content": "这里好像就没那么安静了",
    "emotion": "normal",
    "nextId": "ch2_dream16",
    "delay": 600
  },
  {
    "id": "ch2_dream16",
    "speaker": "nova",
    "type": "text",
    "content": "你好像对我说了一句话",
    "emotion": "normal",
    "nextId": "ch2_dream17",
    "delay": 800
  },
  {
    "id": "ch2_dream17",
    "speaker": "nova",
    "type": "text",
    "content": "不像普通梦",
    "emotion": "normal",
    "nextId": "ch2_dream18",
    "delay": 600
  },
  {
    "id": "ch2_dream18",
    "speaker": "nova",
    "type": "text",
    "content": "因为梦里的你没有说话",
    "emotion": "normal",
    "nextId": "ch2_dream18b",
    "delay": 800
  },
  {
    "id": "ch2_dream18b",
    "speaker": "nova",
    "type": "text",
    "content": "只是站在观测窗前",
    "emotion": "normal",
    "nextId": "ch2_dream18c",
    "delay": 600
  },
  {
    "id": "ch2_dream18c",
    "speaker": "nova",
    "type": "text",
    "content": "像在等我想起什么",
    "emotion": "normal",
    "nextId": "ch2_dream19",
    "delay": 700
  },
  {
    "id": "ch2_dream19",
    "speaker": "nova",
    "type": "text",
    "content": "可我越想",
    "emotion": "normal",
    "nextId": "ch2_dream20",
    "delay": 700
  },
  {
    "id": "ch2_dream20",
    "speaker": "nova",
    "type": "text",
    "content": "那个画面越像被擦掉",
    "emotion": "normal",
    "nextId": "ch2_dream21",
    "delay": 700
  },
  {
    "id": "ch2_dream21",
    "speaker": "nova",
    "type": "text",
    "content": "算了",
    "emotion": "normal",
    "nextId": "ch2_dream22",
    "delay": 600
  },
  {
    "id": "ch2_dream22",
    "speaker": "nova",
    "type": "text",
    "content": "先不吓你",
    "emotion": "smile",
    "nextId": "ch2_dream23",
    "delay": 800
  },
  {
    "id": "ch2_dream23",
    "speaker": "nova",
    "type": "text",
    "content": "我去观测室透口气",
    "emotion": "normal",
    "nextId": "ch2_dream24",
    "delay": 600
  },
  {
    "id": "ch2_dream24",
    "speaker": "nova",
    "type": "text",
    "content": "顺便给你看个好东西",
    "emotion": "smile",
    "nextId": "ch2_dream25",
    "delay": 700
  },
  {
    "id": "ch2_dream25",
    "speaker": "nova",
    "type": "text",
    "content": "如果我没在路上迷路的话",
    "emotion": "smile",
    "nextId": "ch2_obs_ts",
    "delay": 900
  },
  {
    "id": "ch2_obs_ts",
    "speaker": "system",
    "type": "timestamp",
    "content": "12:03",
    "nextId": "ch2_obs2",
    "delay": 400
  },
  {
    "id": "ch2_obs2",
    "speaker": "nova",
    "type": "text",
    "content": "我先摸鱼五分钟",
    "emotion": "normal",
    "nextId": "ch2_obs3",
    "delay": 600
  },
  {
    "id": "ch2_obs3",
    "speaker": "nova",
    "type": "text",
    "content": "给你看个好东西",
    "emotion": "smile",
    "nextId": "ch2_obs4",
    "delay": 1500
  },
  {
    "id": "ch2_obs4",
    "speaker": "system",
    "type": "typing",
    "content": "",
    "nextId": "ch2_obs5",
    "delay": 2500
  },
  {
    "id": "ch2_obs5",
    "speaker": "nova",
    "type": "image",
    "content": "这里是我最喜欢的地方",
    "image": "/assets/photo_observatory.jpg",
    "memoryAnchor": "observatory",
    "nextId": "ch2_obs6",
    "delay": 400
  },
  {
    "id": "ch2_obs6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【真漂亮】",
        "nextId": "ch2_obs_pretty"
      },
      {
        "text": "【每天都能看？】",
        "nextId": "ch2_obs_daily"
      },
      {
        "text": "【不会看腻吗】",
        "nextId": "ch2_obs_tired"
      }
    ]
  },
  {
    "id": "ch2_obs_pretty",
    "speaker": "nova",
    "type": "text",
    "content": "是吧",
    "emotion": "smile",
    "nextId": "ch2_obs_pretty1",
    "delay": 600
  },
  {
    "id": "ch2_obs_pretty1",
    "speaker": "nova",
    "type": "text",
    "content": "我第一次看到的时候",
    "emotion": "normal",
    "nextId": "ch2_obs_pretty2",
    "delay": 600
  },
  {
    "id": "ch2_obs_pretty2",
    "speaker": "nova",
    "type": "text",
    "content": "差点忘了自己还在值班",
    "emotion": "smile",
    "nextId": "ch2_obs_merge",
    "delay": 800
  },
  {
    "id": "ch2_obs_daily",
    "speaker": "nova",
    "type": "text",
    "content": "理论上是",
    "emotion": "normal",
    "nextId": "ch2_obs_daily2",
    "delay": 600
  },
  {
    "id": "ch2_obs_daily2",
    "speaker": "nova",
    "type": "text",
    "content": "只要我没被拉去开会",
    "emotion": "normal",
    "nextId": "ch2_obs_daily3",
    "delay": 700
  },
  {
    "id": "ch2_obs_daily3",
    "speaker": "nova",
    "type": "text",
    "content": "或者没在维修通道里迷路",
    "emotion": "smile",
    "nextId": "ch2_obs_merge",
    "delay": 800
  },
  {
    "id": "ch2_obs_tired",
    "speaker": "nova",
    "type": "text",
    "content": "会",
    "emotion": "normal",
    "nextId": "ch2_obs_tired2",
    "delay": 400
  },
  {
    "id": "ch2_obs_tired2",
    "speaker": "nova",
    "type": "text",
    "content": "看久了也会觉得单调",
    "emotion": "normal",
    "nextId": "ch2_obs_tired3",
    "delay": 600
  },
  {
    "id": "ch2_obs_tired3",
    "speaker": "nova",
    "type": "text",
    "content": "但偶尔还是会被震撼到",
    "emotion": "smile",
    "nextId": "ch2_obs_merge",
    "delay": 800
  },
  {
    "id": "ch2_obs_merge",
    "speaker": "nova",
    "type": "text",
    "content": "比如现在",
    "emotion": "normal",
    "nextId": "ch2_obs_merge0",
    "delay": 600
  },
  {
    "id": "ch2_obs_merge0",
    "speaker": "nova",
    "type": "text",
    "content": "我总会想",
    "emotion": "normal",
    "nextId": "ch2_obs10",
    "delay": 600
  },
  {
    "id": "ch2_obs10",
    "speaker": "nova",
    "type": "text",
    "content": "那些星星后面",
    "emotion": "normal",
    "nextId": "ch2_obs12",
    "delay": 600
  },
  {
    "id": "ch2_obs12",
    "speaker": "nova",
    "type": "text",
    "content": "会不会也有人正在抬头",
    "emotion": "normal",
    "nextId": "ch2_obs13",
    "delay": 800
  },
  {
    "id": "ch2_obs13",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【也许有】",
        "nextId": "ch2_obs_maybe"
      },
      {
        "text": "【说不定正在看你】",
        "nextId": "ch2_obs_watch_you"
      },
      {
        "text": "【宇宙太大了】",
        "nextId": "ch2_obs_big"
      }
    ]
  },
  {
    "id": "ch2_obs_maybe",
    "speaker": "nova",
    "type": "text",
    "content": "也许吧",
    "emotion": "normal",
    "nextId": "ch2_obs_maybe2",
    "delay": 600
  },
  {
    "id": "ch2_obs_maybe2",
    "speaker": "nova",
    "type": "text",
    "content": "这样想的话",
    "emotion": "normal",
    "nextId": "ch2_obs_maybe3",
    "delay": 600
  },
  {
    "id": "ch2_obs_maybe3",
    "speaker": "nova",
    "type": "text",
    "content": "这里好像就没那么安静了",
    "emotion": "smile",
    "nextId": "ch2_obs_merge2",
    "delay": 800
  },
  {
    "id": "ch2_obs_watch_you",
    "speaker": "nova",
    "type": "text",
    "content": "那希望我现在表情别太傻",
    "emotion": "smile",
    "nextId": "ch2_obs_watch_you2",
    "delay": 600
  },
  {
    "id": "ch2_obs_watch_you2",
    "speaker": "nova",
    "type": "text",
    "content": "被宇宙围观这种事",
    "emotion": "normal",
    "nextId": "ch2_obs_watch_you3",
    "delay": 700
  },
  {
    "id": "ch2_obs_watch_you3",
    "speaker": "nova",
    "type": "text",
    "content": "听起来压力很大",
    "emotion": "smile",
    "nextId": "ch2_obs_merge2",
    "delay": 800
  },
  {
    "id": "ch2_obs_big",
    "speaker": "nova",
    "type": "text",
    "content": "是啊",
    "emotion": "normal",
    "nextId": "ch2_obs_big2",
    "delay": 400
  },
  {
    "id": "ch2_obs_big2",
    "speaker": "nova",
    "type": "text",
    "content": "大到有时候会让人觉得自己很小",
    "emotion": "normal",
    "nextId": "ch2_obs_merge2",
    "delay": 800
  },
  {
    "id": "ch2_obs_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "所以能认识一个人",
    "emotion": "normal",
    "nextId": "ch2_obs17",
    "delay": 600
  },
  {
    "id": "ch2_obs17",
    "speaker": "nova",
    "type": "text",
    "content": "其实挺难的",
    "emotion": "smile",
    "nextId": "ch2_forget1",
    "delay": 2000
  },
  {
    "id": "ch2_forget1",
    "speaker": "system",
    "type": "timestamp",
    "content": "16:44",
    "nextId": "ch2_forget2",
    "delay": 400
  },
  {
    "id": "ch2_forget2",
    "speaker": "nova",
    "type": "text",
    "content": "问你个问题",
    "emotion": "normal",
    "nextId": "ch2_forget3",
    "delay": 600
  },
  {
    "id": "ch2_forget3",
    "speaker": "nova",
    "type": "text",
    "content": "如果有一天",
    "emotion": "normal",
    "nextId": "ch2_forget4",
    "delay": 600
  },
  {
    "id": "ch2_forget4",
    "speaker": "nova",
    "type": "text",
    "content": "你突然忘记一个人",
    "emotion": "normal",
    "nextId": "ch2_forget5",
    "delay": 600
  },
  {
    "id": "ch2_forget5",
    "speaker": "nova",
    "type": "text",
    "content": "会怎么办？",
    "emotion": "normal",
    "nextId": "ch2_forget7",
    "delay": 800
  },
  {
    "id": "ch2_forget7",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你怎么突然问这个？】",
        "nextId": "ch2_forget_why"
      },
      {
        "text": "【找回记忆不就行了】",
        "nextId": "ch2_forget_find"
      },
      {
        "text": "【顺其自然】",
        "nextId": "ch2_forget_let"
      }
    ]
  },
  {
    "id": "ch2_forget_why",
    "speaker": "nova",
    "type": "text",
    "content": "没什么",
    "emotion": "normal",
    "nextId": "ch2_forget_why2",
    "delay": 600
  },
  {
    "id": "ch2_forget_why2",
    "speaker": "nova",
    "type": "text",
    "content": "就是突然想到",
    "emotion": "normal",
    "nextId": "ch2_forget_why3",
    "delay": 600
  },
  {
    "id": "ch2_forget_why3",
    "speaker": "nova",
    "type": "text",
    "content": "最近我总觉得自己忘了点什么",
    "emotion": "normal",
    "nextId": "ch2_forget_why4",
    "delay": 800
  },
  {
    "id": "ch2_forget_why4",
    "speaker": "nova",
    "type": "text",
    "content": "但又说不上来是什么",
    "emotion": "normal",
    "nextId": "ch2_forget_merge",
    "delay": 800
  },
  {
    "id": "ch2_forget_find",
    "speaker": "nova",
    "type": "text",
    "content": "说得轻松",
    "emotion": "normal",
    "nextId": "ch2_forget_find2",
    "delay": 600
  },
  {
    "id": "ch2_forget_find2",
    "speaker": "nova",
    "type": "text",
    "content": "要是真能像找文件一样找回来就好了",
    "emotion": "normal",
    "nextId": "ch2_forget_find3",
    "delay": 800
  },
  {
    "id": "ch2_forget_find3",
    "speaker": "nova",
    "type": "text",
    "content": "问题是",
    "emotion": "normal",
    "nextId": "ch2_forget_find4",
    "delay": 500
  },
  {
    "id": "ch2_forget_find4",
    "speaker": "nova",
    "type": "text",
    "content": "我连自己丢了什么都不知道",
    "emotion": "normal",
    "nextId": "ch2_forget_merge",
    "delay": 800
  },
  {
    "id": "ch2_forget_let",
    "speaker": "nova",
    "type": "text",
    "content": "你倒是挺洒脱",
    "emotion": "smile",
    "nextId": "ch2_forget_let2",
    "delay": 600
  },
  {
    "id": "ch2_forget_let2",
    "speaker": "nova",
    "type": "text",
    "content": "我可能做不到",
    "emotion": "normal",
    "nextId": "ch2_forget_let3",
    "delay": 700
  },
  {
    "id": "ch2_forget_let3",
    "speaker": "nova",
    "type": "text",
    "content": "如果忘掉的是不重要的事还好",
    "emotion": "normal",
    "nextId": "ch2_forget_let4",
    "delay": 800
  },
  {
    "id": "ch2_forget_let4",
    "speaker": "nova",
    "type": "text",
    "content": "但如果是很重要的人呢",
    "emotion": "sad",
    "nextId": "ch2_forget_merge",
    "delay": 800
  },
  {
    "id": "ch2_forget_merge",
    "speaker": "nova",
    "type": "text",
    "content": "算了",
    "emotion": "normal",
    "nextId": "ch2_forget_merge2",
    "delay": 600
  },
  {
    "id": "ch2_forget_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "可能只是最近睡太少",
    "emotion": "normal",
    "nextId": "ch2_forget_merge3",
    "delay": 600
  },
  {
    "id": "ch2_forget_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "我记性一直不算好",
    "emotion": "normal",
    "nextId": "ch2_forget_merge4",
    "delay": 600
  },
  {
    "id": "ch2_forget_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "但这次感觉不太一样",
    "emotion": "normal",
    "nextId": "ch2_forget12",
    "delay": 800
  },
  {
    "id": "ch2_forget12",
    "speaker": "nova",
    "type": "text",
    "content": "有可能",
    "emotion": "normal",
    "nextId": "ch2_forget13",
    "delay": 600
  },
  {
    "id": "ch2_forget13",
    "speaker": "nova",
    "type": "text",
    "content": "昨天我居然忘了维修组那个光头叫什么",
    "emotion": "smile",
    "nextId": "ch2_forget14",
    "delay": 600
  },
  {
    "id": "ch2_forget14",
    "speaker": "nova",
    "type": "text",
    "content": "虽然我本来也经常忘",
    "emotion": "smile",
    "nextId": "ch2_forget16",
    "delay": 600
  },
  {
    "id": "ch2_forget16",
    "speaker": "nova",
    "type": "text",
    "content": "但还有件更奇怪的事",
    "emotion": "normal",
    "nextId": "ch2_forget18",
    "delay": 600
  },
  {
    "id": "ch2_forget18",
    "speaker": "nova",
    "type": "text",
    "content": "我记得",
    "emotion": "normal",
    "nextId": "ch2_forget19",
    "delay": 600
  },
  {
    "id": "ch2_forget19",
    "speaker": "nova",
    "type": "text",
    "content": "有人告诉过我",
    "emotion": "normal",
    "nextId": "ch2_forget20",
    "delay": 400
  },
  {
    "id": "ch2_forget20",
    "speaker": "nova",
    "type": "text",
    "content": "不要喝舰上的苦咖啡",
    "emotion": "normal",
    "nextId": "ch2_forget21",
    "delay": 600
  },
  {
    "id": "ch2_forget21",
    "speaker": "nova",
    "type": "text",
    "content": "可没人说过",
    "emotion": "normal",
    "nextId": "ch2_forget22",
    "delay": 400
  },
  {
    "id": "ch2_forget22",
    "speaker": "nova",
    "type": "text",
    "content": "我也没写过备忘录",
    "emotion": "normal",
    "nextId": "ch2_forget24",
    "delay": 800
  },
  {
    "id": "ch2_forget24",
    "speaker": "nova",
    "type": "text",
    "content": "然后我还是喝了",
    "emotion": "smile",
    "nextId": "ch2_forget25",
    "delay": 600
  },
  {
    "id": "ch2_forget25",
    "speaker": "nova",
    "type": "text",
    "content": "难喝得像发动机冷却液",
    "emotion": "smile",
    "nextId": "ch2_candy2",
    "delay": 800
  },
  {
    "id": "ch2_candy2",
    "speaker": "nova",
    "type": "text",
    "content": "对了",
    "emotion": "normal",
    "nextId": "ch2_candy3",
    "delay": 600
  },
  {
    "id": "ch2_candy3",
    "speaker": "nova",
    "type": "text",
    "content": "我刚在抽屉里找到三颗牛奶糖",
    "emotion": "smile",
    "memoryAnchor": "milk_candy",
    "nextId": "ch2_candy4",
    "delay": 800
  },
  {
    "id": "ch2_candy4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【N7欠你的那三颗？】",
        "nextId": "ch2_candy_n7"
      },
      {
        "text": "【舰上还有糖？】",
        "nextId": "ch2_candy_ship"
      }
    ]
  },
  {
    "id": "ch2_candy_n7",
    "speaker": "nova",
    "type": "text",
    "content": "你居然还记得这个",
    "emotion": "smile",
    "nextId": "ch2_candy_n7b",
    "delay": 600
  },
  {
    "id": "ch2_candy_n7b",
    "speaker": "nova",
    "type": "text",
    "content": "对",
    "emotion": "smile",
    "nextId": "ch2_candy_n7c",
    "delay": 400
  },
  {
    "id": "ch2_candy_n7c",
    "speaker": "nova",
    "type": "text",
    "content": "那只猫欠了我好多年",
    "emotion": "smile",
    "nextId": "ch2_candy_n7d",
    "delay": 600
  },
  {
    "id": "ch2_candy_n7d",
    "speaker": "nova",
    "type": "text",
    "content": "结果债主都不在了",
    "emotion": "normal",
    "nextId": "ch2_candy_n7e",
    "delay": 700
  },
  {
    "id": "ch2_candy_n7e",
    "speaker": "nova",
    "type": "text",
    "content": "现在只能由我单方面宣布清账",
    "emotion": "normal",
    "nextId": "ch2_candy_n7f",
    "delay": 800
  },
  {
    "id": "ch2_candy_n7f",
    "speaker": "nova",
    "type": "text",
    "content": "奇怪",
    "emotion": "normal",
    "nextId": "ch2_candy_n7g",
    "delay": 500
  },
  {
    "id": "ch2_candy_n7g",
    "speaker": "nova",
    "type": "text",
    "content": "我好像已经给过你一颗",
    "emotion": "normal",
    "nextId": "ch2_candy_n7h",
    "delay": 700
  },
  {
    "id": "ch2_candy_n7h",
    "speaker": "nova",
    "type": "text",
    "content": "可这句话说出来也很蠢",
    "emotion": "normal",
    "nextId": "ch2_candy_n7i",
    "delay": 700
  },
  {
    "id": "ch2_candy_n7i",
    "speaker": "nova",
    "type": "text",
    "content": "隔着通讯怎么给你糖啊",
    "emotion": "smile",
    "nextId": "ch2_candy8",
    "delay": 800
  },
  {
    "id": "ch2_candy_ship",
    "speaker": "nova",
    "type": "text",
    "content": "有",
    "emotion": "normal",
    "nextId": "ch2_candy_ship2",
    "delay": 400
  },
  {
    "id": "ch2_candy_ship2",
    "speaker": "nova",
    "type": "text",
    "content": "但属于稀有物资",
    "emotion": "normal",
    "nextId": "ch2_candy_ship3",
    "delay": 600
  },
  {
    "id": "ch2_candy_ship3",
    "speaker": "nova",
    "type": "text",
    "content": "一般只有系统觉得我们快要精神崩溃的时候才会发一点",
    "emotion": "normal",
    "nextId": "ch2_candy_ship4",
    "delay": 900
  },
  {
    "id": "ch2_candy_ship4",
    "speaker": "nova",
    "type": "text",
    "content": "我刚在抽屉里翻出来三颗",
    "emotion": "normal",
    "nextId": "ch2_candy_ship5",
    "delay": 700
  },
  {
    "id": "ch2_candy_ship5",
    "speaker": "nova",
    "type": "text",
    "content": "刚好",
    "emotion": "smile",
    "nextId": "ch2_candy_ship6",
    "delay": 400
  },
  {
    "id": "ch2_candy_ship6",
    "speaker": "nova",
    "type": "text",
    "content": "替某只欠债多年的橘猫还账",
    "emotion": "smile",
    "nextId": "ch2_candy8",
    "delay": 800
  },
  {
    "id": "ch2_candy8",
    "speaker": "nova",
    "type": "image",
    "content": "战利品\n替 N7 还债",
    "image": "/assets/photo_candy.jpg",
    "nextId": "ch2_candy_anom1",
    "delay": 400
  },
  {
    "id": "ch2_candy_anom1",
    "speaker": "system",
    "type": "glitch",
    "content": "检测到未发送草稿残片",
    "isGlitch": true,
    "glitchLevel": 1,
    "nextId": "ch2_candy_anom2",
    "delay": 2000
  },
  {
    "id": "ch2_candy_anom2",
    "speaker": "system",
    "type": "glitch",
    "content": "还给他一颗",
    "isGlitch": true,
    "glitchLevel": 1,
    "nextId": "ch2_candy_anom3",
    "delay": 2000
  },
  {
    "id": "ch2_candy_anom3",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch2_candy_anom4",
    "delay": 600
  },
  {
    "id": "ch2_candy_anom4",
    "speaker": "nova",
    "type": "text",
    "content": "刚才终端闪了一下",
    "emotion": "normal",
    "nextId": "ch2_candy_anom5",
    "delay": 600
  },
  {
    "id": "ch2_candy_anom5",
    "speaker": "nova",
    "type": "text",
    "content": "像是我以前写过一句话",
    "emotion": "normal",
    "nextId": "ch2_candy_anom6",
    "delay": 600
  },
  {
    "id": "ch2_candy_anom6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【写了什么？】",
        "nextId": "ch2_candy_anom7"
      },
      {
        "text": "【你不记得？】",
        "nextId": "ch2_candy_anom8"
      }
    ]
  },
  {
    "id": "ch2_candy_anom7",
    "speaker": "nova",
    "type": "text",
    "content": "“还给他一颗”",
    "emotion": "normal",
    "nextId": "ch2_candy_anom_merge",
    "delay": 600
  },
  {
    "id": "ch2_candy_anom8",
    "speaker": "nova",
    "type": "text",
    "content": "不记得",
    "emotion": "normal",
    "nextId": "ch2_candy_anom8b",
    "delay": 600
  },
  {
    "id": "ch2_candy_anom8b",
    "speaker": "nova",
    "type": "text",
    "content": "但那句话的语气",
    "emotion": "normal",
    "nextId": "ch2_candy_anom_merge",
    "delay": 600
  },
  {
    "id": "ch2_candy_anom_merge",
    "speaker": "nova",
    "type": "text",
    "content": "很像我",
    "emotion": "normal",
    "nextId": "ch2_candy_anom9",
    "delay": 600
  },
  {
    "id": "ch2_candy_anom9",
    "speaker": "nova",
    "type": "text",
    "content": "也很蠢",
    "emotion": "smile",
    "nextId": "ch2_candy_anom10",
    "delay": 600
  },
  {
    "id": "ch2_candy_anom10",
    "speaker": "nova",
    "type": "text",
    "content": "隔着通讯怎么还糖啊",
    "emotion": "normal",
    "nextId": "ch2_night1",
    "delay": 600
  },
  {
    "id": "ch2_night1",
    "speaker": "system",
    "type": "timestamp",
    "content": "21:09",
    "nextId": "ch2_night2",
    "delay": 400
  },
  {
    "id": "ch2_night2",
    "speaker": "nova",
    "type": "text",
    "content": "回来了",
    "emotion": "normal",
    "nextId": "ch2_night3",
    "delay": 400
  },
  {
    "id": "ch2_night3",
    "speaker": "nova",
    "type": "text",
    "content": "腿快废了",
    "emotion": "normal",
    "nextId": "ch2_night4",
    "delay": 800
  },
  {
    "id": "ch2_night4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【早点休息】",
        "nextId": "ch2_night_rest"
      },
      {
        "text": "【辛苦了】",
        "nextId": "ch2_night_tired"
      }
    ]
  },
  {
    "id": "ch2_night_rest",
    "speaker": "nova",
    "type": "text",
    "content": "我也想",
    "emotion": "normal",
    "nextId": "ch2_night_rest2",
    "delay": 600
  },
  {
    "id": "ch2_night_rest2",
    "speaker": "nova",
    "type": "text",
    "content": "但先让我把这件事说完",
    "emotion": "normal",
    "nextId": "ch2_night_merge",
    "delay": 800
  },
  {
    "id": "ch2_night_tired",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "ch2_night_tired2",
    "delay": 400
  },
  {
    "id": "ch2_night_tired2",
    "speaker": "nova",
    "type": "text",
    "content": "今天确实有点累",
    "emotion": "normal",
    "nextId": "ch2_night_merge",
    "delay": 800
  },
  {
    "id": "ch2_night_merge",
    "speaker": "nova",
    "type": "text",
    "content": "其实",
    "emotion": "normal",
    "nextId": "ch2_night9",
    "delay": 600
  },
  {
    "id": "ch2_night9",
    "speaker": "nova",
    "type": "text",
    "content": "有件事我没告诉别人",
    "emotion": "normal",
    "nextId": "ch2_night10",
    "delay": 800
  },
  {
    "id": "ch2_night10",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【现在愿意告诉我了？】",
        "nextId": "ch2_night10_a1"
      },
      {
        "text": "【你最近有点不对劲】",
        "nextId": "ch2_night10_b1"
      }
    ]
  },
  {
    "id": "ch2_night10_a1",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "ch2_night10_a2",
    "delay": 600
  },
  {
    "id": "ch2_night10_a2",
    "speaker": "nova",
    "type": "text",
    "content": "我本来还想装作没事",
    "emotion": "normal",
    "nextId": "ch2_night11",
    "delay": 600
  },
  {
    "id": "ch2_night10_b1",
    "speaker": "nova",
    "type": "text",
    "content": "你也感觉到了？",
    "emotion": "normal",
    "nextId": "ch2_night10_b2",
    "delay": 600
  },
  {
    "id": "ch2_night10_b2",
    "speaker": "nova",
    "type": "text",
    "content": "那可能真的不是我多想",
    "emotion": "sad",
    "nextId": "ch2_night11",
    "delay": 600
  },
  {
    "id": "ch2_night11",
    "speaker": "nova",
    "type": "text",
    "content": "我最近总有种感觉",
    "emotion": "normal",
    "nextId": "ch2_night12",
    "delay": 600
  },
  {
    "id": "ch2_night12",
    "speaker": "nova",
    "type": "text",
    "content": "好像有什么事正在发生",
    "emotion": "normal",
    "nextId": "ch2_night13",
    "delay": 600
  },
  {
    "id": "ch2_night13",
    "speaker": "nova",
    "type": "text",
    "content": "但我不知道是什么",
    "emotion": "normal",
    "nextId": "ch2_night14",
    "delay": 600
  },
  {
    "id": "ch2_night14",
    "speaker": "nova",
    "type": "text",
    "content": "像是……",
    "emotion": "normal",
    "nextId": "ch2_night15",
    "delay": 800
  },
  {
    "id": "ch2_night15",
    "speaker": "nova",
    "type": "text",
    "content": "站在悬崖边",
    "emotion": "normal",
    "nextId": "ch2_night16",
    "delay": 600
  },
  {
    "id": "ch2_night16",
    "speaker": "nova",
    "type": "text",
    "content": "却看不见下面",
    "emotion": "normal",
    "nextId": "ch2_night17",
    "delay": 800
  },
  {
    "id": "ch2_night17",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【压力太大了】",
        "nextId": "ch2_night_stress"
      },
      {
        "text": "【别胡思乱想】",
        "nextId": "ch2_night_deny"
      },
      {
        "text": "【具体是什么感觉】",
        "nextId": "ch2_night_feel"
      }
    ]
  },
  {
    "id": "ch2_night_stress",
    "speaker": "nova",
    "type": "text",
    "content": "可能吧",
    "emotion": "normal",
    "nextId": "ch2_night_stress2",
    "delay": 600
  },
  {
    "id": "ch2_night_stress2",
    "speaker": "nova",
    "type": "text",
    "content": "最近确实没怎么睡好",
    "emotion": "normal",
    "nextId": "ch2_night_stress3",
    "delay": 700
  },
  {
    "id": "ch2_night_stress3",
    "speaker": "nova",
    "type": "text",
    "content": "但这次不太像普通压力",
    "emotion": "normal",
    "nextId": "ch2_night_stress4",
    "delay": 800
  },
  {
    "id": "ch2_night_stress4",
    "speaker": "nova",
    "type": "text",
    "content": "更像是脑子里多了一些不属于我的痕迹",
    "emotion": "normal",
    "nextId": "ch2_night_feel_merge",
    "delay": 900
  },
  {
    "id": "ch2_night_deny",
    "speaker": "nova",
    "type": "text",
    "content": "我也想这么说服自己",
    "emotion": "normal",
    "nextId": "ch2_night_deny2",
    "delay": 700
  },
  {
    "id": "ch2_night_deny2",
    "speaker": "nova",
    "type": "text",
    "content": "真的",
    "emotion": "normal",
    "nextId": "ch2_night_deny3",
    "delay": 400
  },
  {
    "id": "ch2_night_deny3",
    "speaker": "nova",
    "type": "text",
    "content": "但有些感觉不是你不去想",
    "emotion": "normal",
    "nextId": "ch2_night_deny4",
    "delay": 800
  },
  {
    "id": "ch2_night_deny4",
    "speaker": "nova",
    "type": "text",
    "content": "它就会消失的",
    "emotion": "normal",
    "nextId": "ch2_night_feel_merge",
    "delay": 700
  },
  {
    "id": "ch2_night_feel",
    "speaker": "nova",
    "type": "text",
    "content": "说不上来",
    "emotion": "normal",
    "nextId": "ch2_night_feel2",
    "delay": 600
  },
  {
    "id": "ch2_night_feel2",
    "speaker": "nova",
    "type": "text",
    "content": "就是偶尔会觉得",
    "emotion": "normal",
    "nextId": "ch2_night_feel3",
    "delay": 600
  },
  {
    "id": "ch2_night_feel3",
    "speaker": "nova",
    "type": "text",
    "content": "有些东西特别熟悉",
    "emotion": "normal",
    "nextId": "ch2_night_feel4",
    "delay": 700
  },
  {
    "id": "ch2_night_feel4",
    "speaker": "nova",
    "type": "text",
    "content": "但我明明不该熟悉",
    "emotion": "normal",
    "nextId": "ch2_night_feel_merge",
    "delay": 800
  },
  {
    "id": "ch2_night_feel_merge",
    "speaker": "nova",
    "type": "text",
    "content": "有些画面是这样",
    "emotion": "normal",
    "nextId": "ch2_night22",
    "delay": 600
  },
  {
    "id": "ch2_night22",
    "speaker": "nova",
    "type": "text",
    "content": "有些对话也是",
    "emotion": "normal",
    "nextId": "ch2_night23",
    "delay": 600
  },
  {
    "id": "ch2_night23",
    "speaker": "nova",
    "type": "text",
    "content": "甚至有时候看见你的消息",
    "emotion": "normal",
    "nextId": "ch2_night24",
    "delay": 700
  },
  {
    "id": "ch2_night24",
    "speaker": "nova",
    "type": "text",
    "content": "会有一种很奇怪的感觉",
    "emotion": "normal",
    "nextId": "ch2_night27",
    "delay": 800
  },
  {
    "id": "ch2_night27",
    "speaker": "nova",
    "type": "text",
    "content": "像是我已经看过了",
    "emotion": "normal",
    "nextId": "ch2_night27b",
    "delay": 700
  },
  {
    "id": "ch2_night27b",
    "speaker": "nova",
    "type": "text",
    "content": "不止一次",
    "emotion": "smile",
    "nextId": "ch2_night29",
    "delay": 800
  },
  {
    "id": "ch2_night29",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "smile",
    "nextId": "ch2_night30",
    "delay": 600
  },
  {
    "id": "ch2_night30",
    "speaker": "nova",
    "type": "text",
    "content": "很奇怪吧",
    "emotion": "smile",
    "nextId": "ch2_night31",
    "delay": 600
  },
  {
    "id": "ch2_night31",
    "speaker": "nova",
    "type": "text",
    "content": "明明不可能",
    "emotion": "normal",
    "nextId": "ch2_night32",
    "delay": 600
  },
  {
    "id": "ch2_night32",
    "speaker": "nova",
    "type": "text",
    "content": "算了",
    "emotion": "normal",
    "nextId": "ch2_night33",
    "delay": 400
  },
  {
    "id": "ch2_night33",
    "speaker": "nova",
    "type": "text",
    "content": "可能只是最近睡眠不足",
    "emotion": "normal",
    "nextId": "ch2_n7q2",
    "delay": 700
  },
  {
    "id": "ch2_n7q2",
    "speaker": "nova",
    "type": "text",
    "content": "对了",
    "emotion": "normal",
    "nextId": "ch2_n7q3",
    "delay": 600
  },
  {
    "id": "ch2_n7q3",
    "speaker": "nova",
    "type": "text",
    "content": "我今天路过储物区",
    "emotion": "normal",
    "nextId": "ch2_n7q4",
    "delay": 600
  },
  {
    "id": "ch2_n7q4",
    "speaker": "nova",
    "type": "text",
    "content": "看到一只橘猫玩偶",
    "emotion": "normal",
    "nextId": "ch2_n7q5",
    "delay": 600
  },
  {
    "id": "ch2_n7q5",
    "speaker": "nova",
    "type": "text",
    "content": "突然想起 N7",
    "emotion": "normal",
    "nextId": "ch2_n7q6",
    "delay": 800
  },
  {
    "id": "ch2_n7q6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【那只胖得像违法建筑的猫？】",
        "nextId": "ch2_n7q6_a1"
      },
      {
        "text": "【你提过一只猫】",
        "nextId": "ch2_n7q6_b1"
      }
    ]
  },
  {
    "id": "ch2_n7q6_a1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "惊讶",
    "nextId": "ch2_n7q6_a2",
    "delay": 600
  },
  {
    "id": "ch2_n7q6_a2",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "惊讶",
    "nextId": "ch2_n7q6_a3",
    "delay": 600
  },
  {
    "id": "ch2_n7q6_a3",
    "speaker": "nova",
    "type": "text",
    "content": "这句话我确实会说",
    "emotion": "normal",
    "nextId": "ch2_n7q7",
    "delay": 600
  },
  {
    "id": "ch2_n7q6_b1",
    "speaker": "nova",
    "type": "text",
    "content": "猫？",
    "emotion": "normal",
    "nextId": "ch2_n7q6_b2",
    "delay": 600
  },
  {
    "id": "ch2_n7q6_b2",
    "speaker": "nova",
    "type": "text",
    "content": "我连这个都和你说过吗",
    "emotion": "normal",
    "nextId": "ch2_n7q9",
    "delay": 600
  },
  {
    "id": "ch2_n7q7",
    "speaker": "nova",
    "type": "text",
    "content": "？",
    "emotion": "normal",
    "nextId": "ch2_n7q8",
    "delay": 600
  },
  {
    "id": "ch2_n7q8",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch2_n7q9",
    "delay": 600
  },
  {
    "id": "ch2_n7q9",
    "speaker": "nova",
    "type": "text",
    "content": "我和你说过 N7 吗？",
    "emotion": "normal",
    "nextId": "ch2_n7q10",
    "delay": 2000
  },
  {
    "id": "ch2_n7q10",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【说过，而且你说它叫 N7】",
        "nextId": "ch2_n7q10_a1"
      },
      {
        "text": "【我记得，你提过】",
        "nextId": "ch2_n7q10_b1"
      }
    ]
  },
  {
    "id": "ch2_n7q10_a1",
    "speaker": "nova",
    "type": "text",
    "content": "你连名字都记得",
    "emotion": "惊讶",
    "nextId": "ch2_n7q11",
    "delay": 600
  },
  {
    "id": "ch2_n7q10_b1",
    "speaker": "nova",
    "type": "text",
    "content": "你说得不太确定",
    "emotion": "normal",
    "nextId": "ch2_n7q10_b2",
    "delay": 600
  },
  {
    "id": "ch2_n7q10_b2",
    "speaker": "nova",
    "type": "text",
    "content": "但我不知道为什么",
    "emotion": "sad",
    "nextId": "ch2_n7q10_b3",
    "delay": 600
  },
  {
    "id": "ch2_n7q10_b3",
    "speaker": "nova",
    "type": "text",
    "content": "觉得你不像在骗我",
    "emotion": "sad",
    "nextId": "ch2_n7q11",
    "delay": 600
  },
  {
    "id": "ch2_n7q11",
    "speaker": "nova",
    "type": "text",
    "content": "奇怪",
    "emotion": "normal",
    "nextId": "ch2_n7q12",
    "delay": 800
  },
  {
    "id": "ch2_n7q12",
    "speaker": "nova",
    "type": "text",
    "content": "我完全不记得",
    "emotion": "normal",
    "nextId": "ch2_n7q13",
    "delay": 800
  },
  {
    "id": "ch2_n7q13",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你记性越来越差了】",
        "nextId": "ch2_n7q13_a1"
      },
      {
        "text": "【没事，我记得】",
        "nextId": "ch2_n7q13_b1"
      }
    ]
  },
  {
    "id": "ch2_n7q13_a1",
    "speaker": "nova",
    "type": "text",
    "content": "喂",
    "emotion": "smile",
    "nextId": "ch2_n7q13_a2",
    "delay": 600
  },
  {
    "id": "ch2_n7q13_a2",
    "speaker": "nova",
    "type": "text",
    "content": "不要把事实说得这么像吐槽",
    "emotion": "smile",
    "nextId": "ch2_n7q14",
    "delay": 600
  },
  {
    "id": "ch2_n7q13_b1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "sad",
    "nextId": "ch2_n7q13_b2",
    "delay": 600
  },
  {
    "id": "ch2_n7q13_b2",
    "speaker": "nova",
    "type": "text",
    "content": "这句话听起来有点危险",
    "emotion": "sad",
    "nextId": "ch2_n7q13_b3",
    "delay": 600
  },
  {
    "id": "ch2_n7q13_b3",
    "speaker": "nova",
    "type": "text",
    "content": "但我想先相信它",
    "emotion": "normal",
    "nextId": "ch2_n7q15",
    "delay": 600
  },
  {
    "id": "ch2_n7q14",
    "speaker": "nova",
    "type": "text",
    "content": "可能吧",
    "emotion": "normal",
    "nextId": "ch2_n7q15",
    "delay": 600
  },
  {
    "id": "ch2_n7q15",
    "speaker": "nova",
    "type": "text",
    "content": "不过",
    "emotion": "normal",
    "nextId": "ch2_n7q16",
    "delay": 600
  },
  {
    "id": "ch2_n7q16",
    "speaker": "nova",
    "type": "text",
    "content": "谢谢你记得",
    "emotion": "normal",
    "nextId": "ch2_n7q18",
    "delay": 600
  },
  {
    "id": "ch2_n7q18",
    "speaker": "nova",
    "type": "text",
    "content": "有时候我觉得",
    "emotion": "normal",
    "nextId": "ch2_n7q19",
    "delay": 600
  },
  {
    "id": "ch2_n7q19",
    "speaker": "nova",
    "type": "text",
    "content": "被人记住",
    "emotion": "normal",
    "nextId": "ch2_n7q20",
    "delay": 600
  },
  {
    "id": "ch2_n7q20",
    "speaker": "nova",
    "type": "text",
    "content": "是一件很幸福的事",
    "emotion": "smile",
    "nextId": "ch2_goodnight",
    "delay": 800
  },
  {
    "id": "ch2_goodnight",
    "speaker": "nova",
    "type": "text",
    "content": "好了",
    "emotion": "normal",
    "nextId": "ch2_gn1",
    "delay": 600
  },
  {
    "id": "ch2_gn1",
    "speaker": "nova",
    "type": "text",
    "content": "今天是真的要睡了",
    "emotion": "normal",
    "nextId": "ch2_gn2",
    "delay": 800
  },
  {
    "id": "ch2_gn2",
    "speaker": "nova",
    "type": "text",
    "content": "累死我了",
    "emotion": "normal",
    "nextId": "ch2_gn3",
    "delay": 600
  },
  {
    "id": "ch2_gn3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【晚安】",
        "nextId": "ch2_gn4"
      }
    ]
  },
  {
    "id": "ch2_gn4",
    "speaker": "nova",
    "type": "text",
    "content": "晚安",
    "emotion": "normal",
    "nextId": "ch2_gn5",
    "delay": 600
  },
  {
    "id": "ch2_gn5",
    "speaker": "nova",
    "type": "text",
    "content": "如果明天我忘了什么",
    "emotion": "normal",
    "nextId": "ch2_gn6",
    "delay": 700
  },
  {
    "id": "ch2_gn6",
    "speaker": "nova",
    "type": "text",
    "content": "记得提醒我",
    "emotion": "normal",
    "nextId": "ch2_offline",
    "delay": 800
  },
  {
    "id": "ch2_offline",
    "speaker": "system",
    "type": "status",
    "content": "Nova 已离线",
    "nextId": "ch2_draft",
    "delay": 2000
  },
  {
    "id": "ch2_draft",
    "speaker": "system",
    "type": "timestamp",
    "content": "深夜 02:17",
    "nextId": "ch2_draft1",
    "delay": 400
  },
  {
    "id": "ch2_draft1",
    "speaker": "system",
    "type": "draft",
    "content": "未发送草稿 / 02:17||不只是 N7\n\n今天有好几次\n我都觉得自己已经说过什么\n\n可通讯记录里没有\n\n他记得太自然了\n像是替我保管过很久\n\n这不太像巧合",
    "nextId": "CH3_START",
    "delay": 400
  },
  {
    "id": "CH3_START",
    "speaker": "system",
    "type": "chapter",
    "content": "第三章：异常",
    "nextId": "ch3_0",
    "delay": 400
  },
  {
    "id": "ch3_0",
    "speaker": "system",
    "type": "timestamp",
    "content": "第四天 08:02",
    "nextId": "ch3_1",
    "delay": 400
  },
  {
    "id": "ch3_1",
    "speaker": "system",
    "type": "status",
    "content": "收到新消息",
    "nextId": "ch3_flower0",
    "delay": 800
  },
  {
    "id": "ch3_flower0",
    "speaker": "nova",
    "type": "text",
    "content": "早",
    "emotion": "normal",
    "nextId": "ch3_flower0b",
    "delay": 600
  },
  {
    "id": "ch3_flower0b",
    "speaker": "nova",
    "type": "text",
    "content": "先给你看个东西",
    "emotion": "smile",
    "nextId": "ch3_flower1",
    "delay": 600
  },
  {
    "id": "ch3_flower1",
    "speaker": "nova",
    "type": "image",
    "content": "一朵长在维修通风管里的小白花",
    "image": "/assets/photo_little_flower.jpg",
    "memoryAnchor": "white_flower",
    "nextId": "ch3_flower2",
    "delay": 400
  },
  {
    "id": "ch3_flower2",
    "speaker": "nova",
    "type": "text",
    "content": "它居然长在维修通风管里",
    "emotion": "smile",
    "nextId": "ch3_flower3",
    "delay": 600
  },
  {
    "id": "ch3_flower3",
    "speaker": "nova",
    "type": "text",
    "content": "理论上这里不该有植物",
    "emotion": "normal",
    "nextId": "ch3_flower4",
    "delay": 600
  },
  {
    "id": "ch3_flower4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你那边怎么了？】",
        "nextId": "ch3_flower_report"
      },
      {
        "text": "【为什么不报？】",
        "nextId": "ch3_flower_why"
      }
    ]
  },
  {
    "id": "ch3_flower_report",
    "speaker": "nova",
    "type": "text",
    "content": "我刚刚好像看见一个人",
    "emotion": "smile",
    "nextId": "ch3_flower_report2",
    "delay": 600
  },
  {
    "id": "ch3_flower_report2",
    "speaker": "nova",
    "type": "text",
    "content": "在观测窗那边",
    "emotion": "smile",
    "nextId": "ch3_flower_merge",
    "delay": 600
  },
  {
    "id": "ch3_flower_why",
    "speaker": "nova",
    "type": "text",
    "content": "因为它挺努力的",
    "emotion": "smile",
    "nextId": "ch3_flower_why2",
    "delay": 600
  },
  {
    "id": "ch3_flower_why2",
    "speaker": "nova",
    "type": "text",
    "content": "我准备偷偷养着",
    "emotion": "smile",
    "nextId": "ch3_flower_merge",
    "delay": 800
  },
  {
    "id": "ch3_flower_merge",
    "speaker": "nova",
    "type": "text",
    "content": "好了，说回正事",
    "emotion": "normal",
    "nextId": "ch3_flower_merge2",
    "delay": 600
  },
  {
    "id": "ch3_flower_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "我想问你个问题",
    "emotion": "normal",
    "nextId": "ch3_5",
    "delay": 600
  },
  {
    "id": "ch3_5",
    "speaker": "nova",
    "type": "text",
    "content": "你那边今天下雨了吗？",
    "emotion": "normal",
    "nextId": "ch3_6",
    "delay": 2000
  },
  {
    "id": "ch3_6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你看清那个人了吗？】",
        "nextId": "ch3_7a"
      },
      {
        "text": "【没有】",
        "nextId": "ch3_7b"
      },
      {
        "text": "【你怎么突然问这个？】",
        "nextId": "ch3_7c"
      }
    ]
  },
  {
    "id": "ch3_7a",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch3_7a2",
    "delay": 600
  },
  {
    "id": "ch3_7a2",
    "speaker": "nova",
    "type": "text",
    "content": "我自己",
    "emotion": "normal",
    "nextId": "ch3_7a3",
    "delay": 600
  },
  {
    "id": "ch3_7a3",
    "speaker": "nova",
    "type": "text",
    "content": "我只是随口问的",
    "emotion": "normal",
    "nextId": "ch3_7a4",
    "delay": 600
  },
  {
    "id": "ch3_7a4",
    "speaker": "nova",
    "type": "text",
    "content": "不对",
    "emotion": "normal",
    "nextId": "ch3_7a5",
    "delay": 400
  },
  {
    "id": "ch3_7a5",
    "speaker": "nova",
    "type": "text",
    "content": "也不算随口",
    "emotion": "normal",
    "nextId": "ch3_7a6",
    "delay": 600
  },
  {
    "id": "ch3_7a6",
    "speaker": "nova",
    "type": "text",
    "content": "我醒来的时候",
    "emotion": "normal",
    "nextId": "ch3_7a7",
    "delay": 600
  },
  {
    "id": "ch3_7a7",
    "speaker": "nova",
    "type": "text",
    "content": "脑子里一直有雨声",
    "emotion": "normal",
    "nextId": "ch3_rain_merge",
    "delay": 800
  },
  {
    "id": "ch3_7b",
    "speaker": "nova",
    "type": "text",
    "content": "这样啊",
    "emotion": "normal",
    "nextId": "ch3_7b2",
    "delay": 600
  },
  {
    "id": "ch3_7b2",
    "speaker": "nova",
    "type": "text",
    "content": "那可能是我搞错了",
    "emotion": "normal",
    "nextId": "ch3_7b3",
    "delay": 600
  },
  {
    "id": "ch3_7b3",
    "speaker": "nova",
    "type": "text",
    "content": "我醒来的时候",
    "emotion": "normal",
    "nextId": "ch3_7b4",
    "delay": 600
  },
  {
    "id": "ch3_7b4",
    "speaker": "nova",
    "type": "text",
    "content": "总觉得自己好像听见了雨声",
    "emotion": "normal",
    "nextId": "ch3_7b5",
    "delay": 700
  },
  {
    "id": "ch3_7b5",
    "speaker": "nova",
    "type": "text",
    "content": "明明这里不可能下雨",
    "emotion": "normal",
    "nextId": "ch3_rain_merge",
    "delay": 800
  },
  {
    "id": "ch3_7c",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch3_7c2",
    "delay": 600
  },
  {
    "id": "ch3_7c2",
    "speaker": "nova",
    "type": "text",
    "content": "我一醒来就在想这个",
    "emotion": "normal",
    "nextId": "ch3_7c3",
    "delay": 600
  },
  {
    "id": "ch3_7c3",
    "speaker": "nova",
    "type": "text",
    "content": "脑子里像卡了一段声音",
    "emotion": "normal",
    "nextId": "ch3_7c4",
    "delay": 700
  },
  {
    "id": "ch3_7c4",
    "speaker": "nova",
    "type": "text",
    "content": "雨声",
    "emotion": "normal",
    "nextId": "ch3_7c5",
    "delay": 400
  },
  {
    "id": "ch3_7c5",
    "speaker": "nova",
    "type": "text",
    "content": "还有窗户被敲到的声音",
    "emotion": "normal",
    "nextId": "ch3_rain_merge",
    "delay": 800
  },
  {
    "id": "ch3_rain_merge",
    "speaker": "nova",
    "type": "text",
    "content": "很奇怪吧",
    "emotion": "normal",
    "nextId": "ch3_rain_merge2",
    "delay": 600
  },
  {
    "id": "ch3_rain_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "我明明已经很久没听过真正的雨了",
    "emotion": "normal",
    "nextId": "ch3_10",
    "delay": 900
  },
  {
    "id": "ch3_10",
    "speaker": "nova",
    "type": "text",
    "content": "先别紧张",
    "emotion": "normal",
    "nextId": "ch3_11",
    "delay": 600
  },
  {
    "id": "ch3_11",
    "speaker": "nova",
    "type": "text",
    "content": "也可能是反光",
    "emotion": "normal",
    "nextId": "ch3_12",
    "delay": 600
  },
  {
    "id": "ch3_12",
    "speaker": "nova",
    "type": "text",
    "content": "观测窗有时候会这样",
    "emotion": "normal",
    "nextId": "ch3_dream3",
    "delay": 1200
  },
  {
    "id": "ch3_dream3",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch3_dream4",
    "delay": 400
  },
  {
    "id": "ch3_dream4_v10_23",
    "speaker": "nova",
    "type": "text",
    "content": "因为她看着我",
    "emotion": "normal",
    "nextId": "ch3_dream6",
    "delay": 600
  },
  {
    "id": "ch3_dream4",
    "speaker": "nova",
    "type": "text",
    "content": "不确定",
    "emotion": "normal",
    "nextId": "ch3_dream4_v10_23",
    "delay": 800
  },
  {
    "id": "ch3_dream6",
    "speaker": "nova",
    "type": "text",
    "content": "我站在观测室",
    "emotion": "normal",
    "nextId": "ch3_dream7",
    "delay": 600
  },
  {
    "id": "ch3_dream7",
    "speaker": "nova",
    "type": "text",
    "content": "你站在我旁边",
    "emotion": "normal",
    "nextId": "ch3_dream8",
    "delay": 400
  },
  {
    "id": "ch3_dream8",
    "speaker": "nova",
    "type": "text",
    "content": "但我看不清脸",
    "emotion": "normal",
    "nextId": "ch3_dream9",
    "delay": 600
  },
  {
    "id": "ch3_dream9",
    "speaker": "nova",
    "type": "text",
    "content": "然后你说：",
    "emotion": "normal",
    "nextId": "ch3_dream10",
    "delay": 600
  },
  {
    "id": "ch3_dream10",
    "speaker": "nova",
    "type": "text",
    "content": "\"别去那里\"",
    "emotion": "normal",
    "nextId": "ch3_dream11",
    "delay": 2000
  },
  {
    "id": "ch3_dream11",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你说别去哪里？】",
        "nextId": "ch3_dream11_a1"
      },
      {
        "text": "【观测室？】",
        "nextId": "ch3_dream11_b1"
      }
    ]
  },
  {
    "id": "ch3_dream11_a1",
    "speaker": "nova",
    "type": "text",
    "content": "我只听清了前半句",
    "emotion": "normal",
    "nextId": "ch3_dream12",
    "delay": 600
  },
  {
    "id": "ch3_dream11_b1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "惊讶",
    "nextId": "ch3_dream11_b2",
    "delay": 600
  },
  {
    "id": "ch3_dream11_b2",
    "speaker": "nova",
    "type": "text",
    "content": "你为什么会先想到那里",
    "emotion": "normal",
    "nextId": "ch3_dream12",
    "delay": 600
  },
  {
    "id": "ch3_dream12",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch3_dream13",
    "delay": 600
  },
  {
    "id": "ch3_dream13",
    "speaker": "nova",
    "type": "text",
    "content": "梦到这里就醒了",
    "emotion": "normal",
    "nextId": "ch3_creep2",
    "delay": 800
  },
  {
    "id": "ch3_creep2",
    "speaker": "nova",
    "type": "text",
    "content": "你有没有觉得",
    "emotion": "normal",
    "nextId": "ch3_creep3",
    "delay": 600
  },
  {
    "id": "ch3_creep3",
    "speaker": "nova",
    "type": "text",
    "content": "最近越来越诡异了",
    "emotion": "normal",
    "nextId": "ch3_creep4",
    "delay": 800
  },
  {
    "id": "ch3_creep4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【有一点】",
        "nextId": "ch3_creep_a"
      },
      {
        "text": "【确实】",
        "nextId": "ch3_creep_b"
      },
      {
        "text": "【你压力太大了】",
        "nextId": "ch3_creep_c"
      }
    ]
  },
  {
    "id": "ch3_creep_a",
    "speaker": "nova",
    "type": "text",
    "content": "你说得这么委婉",
    "emotion": "normal",
    "nextId": "ch3_creep_a2",
    "delay": 600
  },
  {
    "id": "ch3_creep_a2",
    "speaker": "nova",
    "type": "text",
    "content": "我都已经开始觉得",
    "emotion": "normal",
    "nextId": "ch3_creep_a3",
    "delay": 600
  },
  {
    "id": "ch3_creep_a3",
    "speaker": "nova",
    "type": "text",
    "content": "这不是“有一点”的程度了",
    "emotion": "normal",
    "nextId": "ch3_creep_merge",
    "delay": 800
  },
  {
    "id": "ch3_creep_b",
    "speaker": "nova",
    "type": "text",
    "content": "对吧",
    "emotion": "normal",
    "nextId": "ch3_creep_b2",
    "delay": 400
  },
  {
    "id": "ch3_creep_b2",
    "speaker": "nova",
    "type": "text",
    "content": "我还以为只有我这么觉得",
    "emotion": "normal",
    "nextId": "ch3_creep_b3",
    "delay": 700
  },
  {
    "id": "ch3_creep_b3",
    "speaker": "nova",
    "type": "text",
    "content": "说出来之后反而更糟了",
    "emotion": "normal",
    "nextId": "ch3_creep_merge",
    "delay": 800
  },
  {
    "id": "ch3_creep_c",
    "speaker": "nova",
    "type": "text",
    "content": "希望是这样",
    "emotion": "normal",
    "nextId": "ch3_creep_c2",
    "delay": 600
  },
  {
    "id": "ch3_creep_c2",
    "speaker": "nova",
    "type": "text",
    "content": "压力大听起来至少还算正常",
    "emotion": "normal",
    "nextId": "ch3_creep_c3",
    "delay": 800
  },
  {
    "id": "ch3_creep_c3",
    "speaker": "nova",
    "type": "text",
    "content": "虽然“正常”这个词现在也不太可靠",
    "emotion": "normal",
    "nextId": "ch3_creep_merge",
    "delay": 900
  },
  {
    "id": "ch3_creep_merge",
    "speaker": "nova",
    "type": "text",
    "content": "我不想把事情往最坏的方向想",
    "emotion": "normal",
    "nextId": "ch3_creep_merge2",
    "delay": 700
  },
  {
    "id": "ch3_creep_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "但最近发生的这些",
    "emotion": "normal",
    "nextId": "ch3_creep_merge3",
    "delay": 600
  },
  {
    "id": "ch3_creep_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "已经不像单纯睡眠不足了",
    "emotion": "normal",
    "nextId": "ch3_creep_merge4",
    "delay": 800
  },
  {
    "id": "ch3_creep_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "而且医疗舱很贵",
    "emotion": "smile",
    "nextId": "ch3_creep_merge5",
    "delay": 600
  },
  {
    "id": "ch3_creep_merge5",
    "speaker": "nova",
    "type": "text",
    "content": "我暂时还不想因为“疑似精神异常”被塞进去",
    "emotion": "smile",
    "nextId": "ch3_lunch1",
    "delay": 1200
  },
  {
    "id": "ch3_lunch1",
    "speaker": "system",
    "type": "timestamp",
    "content": "13:11",
    "nextId": "ch3_lunch2",
    "delay": 400
  },
  {
    "id": "ch3_lunch2",
    "speaker": "nova",
    "type": "text",
    "content": "我刚到食堂",
    "emotion": "normal",
    "nextId": "ch3_lunch3",
    "delay": 400
  },
  {
    "id": "ch3_lunch3",
    "speaker": "nova",
    "type": "text",
    "content": "他们今天说有牛排",
    "emotion": "normal",
    "nextId": "ch3_lunch5",
    "delay": 800
  },
  {
    "id": "ch3_lunch5",
    "speaker": "nova",
    "type": "text",
    "content": "但我现在有点怀疑",
    "emotion": "smile",
    "nextId": "ch3_lunch6",
    "delay": 600
  },
  {
    "id": "ch3_lunch6",
    "speaker": "nova",
    "type": "text",
    "content": "这东西到底算不算食物",
    "emotion": "normal",
    "nextId": "ch3_lunch7",
    "delay": 400
  },
  {
    "id": "ch3_lunch7",
    "speaker": "nova",
    "type": "text",
    "content": "我发你看看",
    "emotion": "smile",
    "nextId": "ch3_lunch8",
    "delay": 1500
  },
  {
    "id": "ch3_lunch8",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "ch3_lunch9",
    "delay": 1500
  },
  {
    "id": "ch3_lunch9",
    "speaker": "system",
    "type": "typing",
    "content": "",
    "nextId": "ch3_steak",
    "delay": 2000
  },
  {
    "id": "ch3_steak",
    "speaker": "nova",
    "type": "image",
    "content": "别问\n问就是科研事故",
    "image": "/assets/photo_steak.jpg",
    "memoryAnchor": "steak",
    "nextId": "ch3_reflection1",
    "delay": 400
  },
  {
    "id": "ch3_reflection1",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "ch3_ref1",
    "delay": 2000
  },
  {
    "id": "ch3_ref1",
    "speaker": "nova",
    "type": "text",
    "content": "等一下",
    "emotion": "normal",
    "nextId": "ch3_ref2",
    "delay": 600
  },
  {
    "id": "ch3_ref2",
    "speaker": "nova",
    "type": "text",
    "content": "有点不对",
    "emotion": "normal",
    "nextId": "ch3_ref4",
    "delay": 400
  },
  {
    "id": "ch3_ref4",
    "speaker": "nova",
    "type": "text",
    "content": "我刚刚好像看见一个人",
    "emotion": "normal",
    "nextId": "ch3_ref5",
    "delay": 600
  },
  {
    "id": "ch3_ref5",
    "speaker": "nova",
    "type": "text",
    "content": "在观测窗那边",
    "emotion": "normal",
    "nextId": "ch3_ref7",
    "delay": 800
  },
  {
    "id": "ch3_ref7",
    "speaker": "nova",
    "type": "text",
    "content": "……\n我自己",
    "emotion": "normal",
    "nextId": "ch3_ref9",
    "delay": 2500
  },
  {
    "id": "ch3_ref9",
    "speaker": "nova",
    "type": "text",
    "content": "先别紧张",
    "emotion": "normal",
    "nextId": "ch3_ref10",
    "delay": 600
  },
  {
    "id": "ch3_ref10",
    "speaker": "nova",
    "type": "text",
    "content": "也可能是反光",
    "emotion": "normal",
    "nextId": "ch3_ref11",
    "delay": 600
  },
  {
    "id": "ch3_ref11",
    "speaker": "nova",
    "type": "text",
    "content": "观测窗有时候会这样",
    "emotion": "normal",
    "nextId": "ch3_ref13",
    "delay": 800
  },
  {
    "id": "ch3_ref13",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch3_ref14",
    "delay": 800
  },
  {
    "id": "ch3_ref14",
    "speaker": "nova",
    "type": "text",
    "content": "不确定",
    "emotion": "normal",
    "nextId": "ch3_ref15",
    "delay": 600
  },
  {
    "id": "ch3_ref15",
    "speaker": "nova",
    "type": "text",
    "content": "因为她看着我",
    "emotion": "normal",
    "nextId": "ch3_timed_sys1",
    "delay": 1500
  },
  {
    "id": "ch3_timed_sys1",
    "speaker": "system",
    "type": "status",
    "content": "通讯稳定性下降",
    "isGlitch": true,
    "nextId": "ch3_timed_sys2",
    "delay": 700
  },
  {
    "id": "ch3_timed_sys2",
    "speaker": "system",
    "type": "status",
    "content": "Nova 生理指标波动",
    "isGlitch": true,
    "nextId": "ch3_ref16",
    "delay": 700
  },
  {
    "id": "ch3_ref16",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choiceTimeoutMs": 6000,
    "timeoutNextId": "ch3_ref_timeout1",
    "choices": [
      {
        "text": "【我在，先别看窗外】",
        "nextId": "ch3_ref_calm1",
        "statEffect": "none",
        "timedResponse": "calm_nova"
      },
      {
        "text": "【离开观测室】",
        "nextId": "ch3_ref_leave1",
        "statEffect": "none"
      },
      {
        "text": "【检查通讯日志】",
        "nextId": "ch3_ref_log1",
        "statEffect": "none",
        "timedResponse": "investigate_log"
      }
    ]
  },
  {
    "id": "ch3_ref_calm1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch3_ref_calm2",
    "delay": 600
  },
  {
    "id": "ch3_ref_calm2",
    "speaker": "nova",
    "type": "text",
    "content": "好",
    "emotion": "normal",
    "nextId": "ch3_ref_calm3",
    "delay": 500
  },
  {
    "id": "ch3_ref_calm3",
    "speaker": "nova",
    "type": "text",
    "content": "我不看",
    "emotion": "normal",
    "nextId": "ch3_ref_calm4",
    "delay": 600
  },
  {
    "id": "ch3_ref_calm4",
    "speaker": "nova",
    "type": "text",
    "content": "你说话",
    "emotion": "sad",
    "nextId": "ch3_ref_calm5",
    "delay": 700
  },
  {
    "id": "ch3_ref_calm5",
    "speaker": "nova",
    "type": "text",
    "content": "随便说点什么都行",
    "emotion": "sad",
    "nextId": "ch3_ref17",
    "delay": 900
  },
  {
    "id": "ch3_ref_leave1",
    "speaker": "nova",
    "type": "text",
    "content": "我正在退出来",
    "emotion": "normal",
    "nextId": "ch3_ref_leave2",
    "delay": 600
  },
  {
    "id": "ch3_ref_leave2",
    "speaker": "nova",
    "type": "text",
    "content": "门禁反应有点慢",
    "emotion": "normal",
    "nextId": "ch3_ref_leave3",
    "delay": 600
  },
  {
    "id": "ch3_ref_leave3",
    "speaker": "nova",
    "type": "text",
    "content": "别催我",
    "emotion": "smile",
    "nextId": "ch3_ref_leave4",
    "delay": 600
  },
  {
    "id": "ch3_ref_leave4",
    "speaker": "nova",
    "type": "text",
    "content": "我现在已经很想催它了",
    "emotion": "smile",
    "nextId": "ch3_ref17",
    "delay": 900
  },
  {
    "id": "ch3_ref_log1",
    "speaker": "nova",
    "type": "text",
    "content": "你还真冷静",
    "emotion": "normal",
    "nextId": "ch3_ref_log2",
    "delay": 600
  },
  {
    "id": "ch3_ref_log2",
    "speaker": "nova",
    "type": "text",
    "content": "好",
    "emotion": "normal",
    "nextId": "ch3_ref_log3",
    "delay": 500
  },
  {
    "id": "ch3_ref_log3",
    "speaker": "nova",
    "type": "text",
    "content": "我查日志",
    "emotion": "normal",
    "nextId": "ch3_ref_log4",
    "delay": 600
  },
  {
    "id": "ch3_ref_log4",
    "speaker": "nova",
    "type": "text",
    "content": "至少这比盯着另一个自己看正常一点",
    "emotion": "smile",
    "nextId": "ch3_ref17",
    "delay": 1000
  },
  {
    "id": "ch3_ref_timeout1",
    "speaker": "nova",
    "type": "text",
    "content": "……你还在吗",
    "emotion": "sad",
    "nextId": "ch3_ref_timeout2",
    "delay": 900
  },
  {
    "id": "ch3_ref_timeout2",
    "speaker": "nova",
    "type": "text",
    "content": "别在这种时候断线",
    "emotion": "sad",
    "nextId": "ch3_ref_timeout3",
    "delay": 800
  },
  {
    "id": "ch3_ref_timeout3",
    "speaker": "nova",
    "type": "text",
    "content": "求你了",
    "emotion": "sad",
    "nextId": "ch3_ref17",
    "delay": 1200
  },
  {
    "id": "ch3_ref17",
    "speaker": "nova",
    "type": "text",
    "content": "反光不会看着我",
    "emotion": "normal",
    "nextId": "ch3_ref18",
    "delay": 600
  },
  {
    "id": "ch3_ref18",
    "speaker": "nova",
    "type": "text",
    "content": "对吧？",
    "emotion": "normal",
    "nextId": "ch3_ref19",
    "delay": 1500
  },
  {
    "id": "ch3_ref19",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "ch3_ref20",
    "delay": 2000
  },
  {
    "id": "ch3_ref20",
    "speaker": "nova",
    "type": "text",
    "content": "算了",
    "emotion": "normal",
    "nextId": "ch3_ref21",
    "delay": 600
  },
  {
    "id": "ch3_ref21",
    "speaker": "nova",
    "type": "text",
    "content": "当我没说",
    "emotion": "normal",
    "nextId": "ch3_ref22",
    "delay": 600
  },
  {
    "id": "ch3_ref22",
    "speaker": "nova",
    "type": "text",
    "content": "你别露出那种表情",
    "emotion": "smile",
    "nextId": "ch3_ref28b",
    "delay": 800
  },
  {
    "id": "ch3_ref28b",
    "speaker": "nova",
    "type": "text",
    "content": "当然我看不到你的表情",
    "emotion": "smile",
    "nextId": "ch3_ref28c",
    "delay": 600
  },
  {
    "id": "ch3_ref28c",
    "speaker": "nova",
    "type": "text",
    "content": "但可以想象",
    "emotion": "smile",
    "nextId": "ch3_ref28d",
    "delay": 600
  },
  {
    "id": "ch3_ref28d",
    "speaker": "nova",
    "type": "text",
    "content": "就是那种",
    "emotion": "smile",
    "nextId": "ch3_ref25",
    "delay": 600
  },
  {
    "id": "ch3_ref25",
    "speaker": "nova",
    "type": "text",
    "content": "“完了她要疯了”的表情",
    "emotion": "smile",
    "nextId": "ch3_disconnect1",
    "delay": 1200
  },
  {
    "id": "ch3_disconnect1",
    "speaker": "system",
    "type": "timestamp",
    "content": "18:26",
    "nextId": "ch3_dc1",
    "delay": 400
  },
  {
    "id": "ch3_dc1",
    "speaker": "system",
    "type": "glitch",
    "content": "通讯中断",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "ch3_dc2",
    "delay": 1500
  },
  {
    "id": "ch3_dc2",
    "speaker": "system",
    "type": "glitch",
    "content": "尝试重连……",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "ch3_dc3",
    "delay": 2000
  },
  {
    "id": "ch3_dc3",
    "speaker": "system",
    "type": "glitch",
    "content": "重连失败",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "ch3_dc4",
    "delay": 1500
  },
  {
    "id": "ch3_dc4",
    "speaker": "system",
    "type": "glitch",
    "content": "重连失败",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "ch3_dc5",
    "delay": 1500
  },
  {
    "id": "ch3_dc5",
    "speaker": "system",
    "type": "glitch",
    "content": "重连成功",
    "glitchLevel": 1,
    "nextId": "ch3_dc6",
    "delay": 1000
  },
  {
    "id": "ch3_dc6",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch3_dc6b",
    "delay": 600
  },
  {
    "id": "ch3_dc6b",
    "speaker": "nova",
    "type": "text",
    "content": "你还在吗？",
    "emotion": "normal",
    "nextId": "ch3_dc7",
    "delay": 800
  },
  {
    "id": "ch3_dc7",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【在】",
        "nextId": "ch3_dc8"
      }
    ]
  },
  {
    "id": "ch3_dc8",
    "speaker": "nova",
    "type": "text",
    "content": "太好了",
    "emotion": "normal",
    "nextId": "ch3_dc9",
    "delay": 600
  },
  {
    "id": "ch3_dc9",
    "speaker": "nova",
    "type": "text",
    "content": "刚刚系统断了",
    "emotion": "normal",
    "nextId": "ch3_dc10",
    "delay": 600
  },
  {
    "id": "ch3_dc10",
    "speaker": "nova",
    "type": "text",
    "content": "我还以为失去连接了",
    "emotion": "normal",
    "nextId": "ch3_dc12",
    "delay": 1200
  },
  {
    "id": "ch3_dc12",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch3_dc13",
    "delay": 600
  },
  {
    "id": "ch3_dc13",
    "speaker": "nova",
    "type": "text",
    "content": "但通讯日志出现了一段东西",
    "emotion": "normal",
    "nextId": "ch3_dc15",
    "delay": 800
  },
  {
    "id": "ch3_dc15",
    "speaker": "nova",
    "type": "text",
    "content": "你最好自己看",
    "emotion": "normal",
    "nextId": "ch3_log1",
    "delay": 1000
  },
  {
    "id": "ch3_log1",
    "speaker": "system",
    "type": "file",
    "content": "通讯日志.txt||连接建立\n连接建立\n连接建立\n连接建立\n连接建立\n连接建立\n连接建立\n\n第七次连接成功",
    "nextId": "ch3_log1b",
    "delay": 400
  },
  {
    "id": "ch3_log1b",
    "speaker": "system",
    "type": "file",
    "content": "协议残片：SEVENTH_PROTOCOL||用途：Aurora号局部时间回溯 / 航行员认知保护\n触发条件：任务不可恢复性失败\n默认保留对象：航行数据 / 最低限度任务记录\n异常保留对象：UNKNOWN\n保密等级：黑箱安全层\n当前状态：重复触发",
    "nextId": "ch3_log2",
    "delay": 400
  },
  {
    "id": "ch3_log2",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch3_log2b",
    "delay": 600
  },
  {
    "id": "ch3_log2b",
    "speaker": "nova",
    "type": "text",
    "content": "这不是普通通讯日志",
    "emotion": "normal",
    "nextId": "ch3_log2c",
    "delay": 700
  },
  {
    "id": "ch3_log2c",
    "speaker": "nova",
    "type": "text",
    "content": "这是第七协议的底层记录",
    "emotion": "normal",
    "nextId": "ch3_log2d",
    "delay": 800
  },
  {
    "id": "ch3_log2d",
    "speaker": "nova",
    "type": "text",
    "content": "它好像不是第一次把我们接在一起",
    "emotion": "normal",
    "nextId": "ch3_log4",
    "delay": 900
  },
  {
    "id": "ch3_log4",
    "speaker": "nova",
    "type": "text",
    "content": "重点还不止这个",
    "emotion": "normal",
    "nextId": "ch3_log5",
    "delay": 600
  },
  {
    "id": "ch3_log5",
    "speaker": "nova",
    "type": "text",
    "content": "你往下看",
    "emotion": "normal",
    "nextId": "ch3_log5b",
    "delay": 800
  },
  {
    "id": "ch3_log5b",
    "speaker": "system",
    "type": "file",
    "content": "日志最后一条||第七次连接成功",
    "nextId": "ch3_log6",
    "delay": 400
  },
  {
    "id": "ch3_log6",
    "speaker": "nova",
    "type": "text",
    "content": "又是这句话",
    "emotion": "normal",
    "nextId": "ch3_log7",
    "delay": 600
  },
  {
    "id": "ch3_log7",
    "speaker": "nova",
    "type": "text",
    "content": "第四天了",
    "emotion": "normal",
    "nextId": "ch3_log8",
    "delay": 400
  },
  {
    "id": "ch3_log8",
    "speaker": "nova",
    "type": "text",
    "content": "我已经开始讨厌数字七了",
    "emotion": "smile",
    "nextId": "ch3_log10",
    "delay": 800
  },
  {
    "id": "ch3_log10",
    "speaker": "nova",
    "type": "text",
    "content": "希望如此",
    "emotion": "normal",
    "nextId": "ch3_log11",
    "delay": 600
  },
  {
    "id": "ch3_log11",
    "speaker": "nova",
    "type": "text",
    "content": "但有个问题",
    "emotion": "normal",
    "nextId": "ch3_log12",
    "delay": 800
  },
  {
    "id": "ch3_log12",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【日志时间不对？】",
        "nextId": "ch3_log12_a1"
      },
      {
        "text": "【三个月前你们还没出发】",
        "nextId": "ch3_log12_b1"
      }
    ]
  },
  {
    "id": "ch3_log12_a1",
    "speaker": "nova",
    "type": "text",
    "content": "对",
    "emotion": "normal",
    "nextId": "ch3_log13",
    "delay": 600
  },
  {
    "id": "ch3_log12_b1",
    "speaker": "nova",
    "type": "text",
    "content": "你也注意到了",
    "emotion": "惊讶",
    "nextId": "ch3_log12_b2",
    "delay": 600
  },
  {
    "id": "ch3_log12_b2",
    "speaker": "nova",
    "type": "text",
    "content": "三个月前",
    "emotion": "normal",
    "nextId": "ch3_log12_b3",
    "delay": 600
  },
  {
    "id": "ch3_log12_b3",
    "speaker": "nova",
    "type": "text",
    "content": "Aurora号甚至还没离港",
    "emotion": "normal",
    "nextId": "ch3_log17",
    "delay": 600
  },
  {
    "id": "ch3_log13",
    "speaker": "nova",
    "type": "text",
    "content": "这条日志时间",
    "emotion": "normal",
    "nextId": "ch3_log14",
    "delay": 600
  },
  {
    "id": "ch3_log14",
    "speaker": "nova",
    "type": "text",
    "content": "是三个月前",
    "emotion": "normal",
    "nextId": "ch3_log16",
    "delay": 1500
  },
  {
    "id": "ch3_log16",
    "speaker": "nova",
    "type": "text",
    "content": "Aurora号三个月前还没出发",
    "emotion": "normal",
    "nextId": "ch3_log17",
    "delay": 800
  },
  {
    "id": "ch3_log17",
    "speaker": "nova",
    "type": "text",
    "content": "所以",
    "emotion": "normal",
    "nextId": "ch3_log18",
    "delay": 400
  },
  {
    "id": "ch3_log18",
    "speaker": "nova",
    "type": "text",
    "content": "它不应该存在",
    "emotion": "normal",
    "nextId": "ch3_scared1",
    "delay": 800
  },
  {
    "id": "ch3_scared1",
    "speaker": "nova",
    "type": "text",
    "content": "我突然有点害怕",
    "emotion": "sad",
    "nextId": "ch3_scared2",
    "delay": 1200
  },
  {
    "id": "ch3_scared2",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【别怕】",
        "nextId": "ch3_scared_afraid",
        "trustDelta": 1
      },
      {
        "text": "【我在】",
        "nextId": "ch3_scared_here",
        "trustDelta": 1
      },
      {
        "text": "【一定有原因】",
        "nextId": "ch3_scared_reason",
        "memoryDelta": 1
      }
    ]
  },
  {
    "id": "ch3_scared_afraid",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "ch3_scared_afraid2",
    "delay": 600
  },
  {
    "id": "ch3_scared_afraid2",
    "speaker": "nova",
    "type": "text",
    "content": "我尽量",
    "emotion": "normal",
    "nextId": "ch3_scared_afraid3",
    "delay": 600
  },
  {
    "id": "ch3_scared_afraid3",
    "speaker": "nova",
    "type": "text",
    "content": "不过你这么说的时候",
    "emotion": "normal",
    "nextId": "ch3_scared_afraid4",
    "delay": 700
  },
  {
    "id": "ch3_scared_afraid4",
    "speaker": "nova",
    "type": "text",
    "content": "我反而有点想承认自己真的在怕",
    "emotion": "sad",
    "nextId": "ch3_scared_merge",
    "delay": 900
  },
  {
    "id": "ch3_scared_here",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "normal",
    "nextId": "ch3_scared_here2",
    "delay": 600
  },
  {
    "id": "ch3_scared_here2",
    "speaker": "nova",
    "type": "text",
    "content": "所以现在还没那么糟",
    "emotion": "normal",
    "nextId": "ch3_scared_here3",
    "delay": 700
  },
  {
    "id": "ch3_scared_here3",
    "speaker": "nova",
    "type": "text",
    "content": "至少这次",
    "emotion": "normal",
    "nextId": "ch3_scared_here4",
    "delay": 600
  },
  {
    "id": "ch3_scared_here4",
    "speaker": "nova",
    "type": "text",
    "content": "不是我一个人在看这些东西",
    "emotion": "normal",
    "nextId": "ch3_scared_merge",
    "delay": 900
  },
  {
    "id": "ch3_scared_reason",
    "speaker": "nova",
    "type": "text",
    "content": "我也希望是这样",
    "emotion": "normal",
    "nextId": "ch3_scared_reason2",
    "delay": 700
  },
  {
    "id": "ch3_scared_reason2",
    "speaker": "nova",
    "type": "text",
    "content": "有原因就说明还能解释",
    "emotion": "normal",
    "nextId": "ch3_scared_reason3",
    "delay": 800
  },
  {
    "id": "ch3_scared_reason3",
    "speaker": "nova",
    "type": "text",
    "content": "可我现在怕的就是",
    "emotion": "normal",
    "nextId": "ch3_scared_reason4",
    "delay": 700
  },
  {
    "id": "ch3_scared_reason4",
    "speaker": "nova",
    "type": "text",
    "content": "那个原因可能比异常本身更糟",
    "emotion": "sad",
    "nextId": "ch3_scared_merge",
    "delay": 900
  },
  {
    "id": "ch3_scared_merge",
    "speaker": "nova",
    "type": "text",
    "content": "不过",
    "emotion": "normal",
    "nextId": "ch3_scared6",
    "delay": 600
  },
  {
    "id": "ch3_scared6",
    "speaker": "nova",
    "type": "text",
    "content": "如果有一天",
    "emotion": "normal",
    "nextId": "ch3_scared7",
    "delay": 600
  },
  {
    "id": "ch3_scared7",
    "speaker": "nova",
    "type": "text",
    "content": "我真的忘记了什么很重要的事",
    "emotion": "normal",
    "nextId": "ch3_scared8",
    "delay": 700
  },
  {
    "id": "ch3_scared8",
    "speaker": "nova",
    "type": "text",
    "content": "你会告诉我吗？",
    "emotion": "normal",
    "nextId": "ch3_scared9",
    "delay": 800
  },
  {
    "id": "ch3_scared9",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【会】",
        "nextId": "ch3_scared_yes",
        "trustDelta": 1
      },
      {
        "text": "【当然】",
        "nextId": "ch3_scared_ofc",
        "trustDelta": 1
      }
    ]
  },
  {
    "id": "ch3_scared_yes",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "ch3_scared_yes2",
    "delay": 600
  },
  {
    "id": "ch3_scared_yes2",
    "speaker": "nova",
    "type": "text",
    "content": "那我就相信你一次",
    "emotion": "smile",
    "nextId": "ch3_scared10",
    "delay": 800
  },
  {
    "id": "ch3_scared_ofc",
    "speaker": "nova",
    "type": "text",
    "content": "你说得太快了",
    "emotion": "normal",
    "nextId": "ch3_scared_ofc2",
    "delay": 700
  },
  {
    "id": "ch3_scared_ofc2",
    "speaker": "nova",
    "type": "text",
    "content": "不过……谢谢",
    "emotion": "smile",
    "nextId": "ch3_scared10",
    "delay": 800
  },
  {
    "id": "ch3_scared10",
    "speaker": "nova",
    "type": "text",
    "content": "那就好",
    "emotion": "smile",
    "nextId": "ch3_scared11",
    "delay": 800
  },
  {
    "id": "ch3_scared11",
    "speaker": "nova",
    "type": "text",
    "content": "因为我开始觉得",
    "emotion": "normal",
    "nextId": "ch3_scared12",
    "delay": 600
  },
  {
    "id": "ch3_scared12",
    "speaker": "nova",
    "type": "text",
    "content": "有些东西正在从我脑子里消失",
    "emotion": "sad",
    "nextId": "ch3_gn2",
    "delay": 1200
  },
  {
    "id": "ch3_gn2",
    "speaker": "nova",
    "type": "text",
    "content": "好了",
    "emotion": "normal",
    "nextId": "ch3_gn3",
    "delay": 600
  },
  {
    "id": "ch3_gn3",
    "speaker": "nova",
    "type": "text",
    "content": "我今天先缓一缓",
    "emotion": "normal",
    "nextId": "ch3_gn4",
    "delay": 800
  },
  {
    "id": "ch3_gn4",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【晚安】",
        "nextId": "ch3_gn5",
        "trustDelta": 1
      }
    ]
  },
  {
    "id": "ch3_gn5",
    "speaker": "nova",
    "type": "text",
    "content": "晚安",
    "emotion": "normal",
    "nextId": "ch3_gn8",
    "delay": 800
  },
  {
    "id": "ch3_gn8",
    "speaker": "nova",
    "type": "text",
    "content": "还有",
    "emotion": "normal",
    "nextId": "ch3_gn9",
    "delay": 600
  },
  {
    "id": "ch3_gn9",
    "speaker": "nova",
    "type": "text",
    "content": "如果以后我说了一些奇怪的话",
    "emotion": "normal",
    "nextId": "ch3_gn10",
    "delay": 700
  },
  {
    "id": "ch3_gn10",
    "speaker": "nova",
    "type": "text",
    "content": "别立刻相信",
    "emotion": "normal",
    "nextId": "ch3_gn12",
    "delay": 800
  },
  {
    "id": "ch3_gn12",
    "speaker": "nova",
    "type": "text",
    "content": "因为",
    "emotion": "normal",
    "nextId": "ch3_gn13",
    "delay": 600
  },
  {
    "id": "ch3_gn13",
    "speaker": "nova",
    "type": "text",
    "content": "我最近越来越分不清",
    "emotion": "normal",
    "nextId": "ch3_gn14",
    "delay": 600
  },
  {
    "id": "ch3_gn14",
    "speaker": "nova",
    "type": "text",
    "content": "哪些记忆是我的",
    "emotion": "normal",
    "nextId": "ch3_gn15",
    "delay": 400
  },
  {
    "id": "ch3_gn15",
    "speaker": "nova",
    "type": "text",
    "content": "哪些不是",
    "emotion": "sad",
    "nextId": "ch3_offline",
    "delay": 1500
  },
  {
    "id": "ch3_offline",
    "speaker": "system",
    "type": "status",
    "content": "Nova 已离线",
    "nextId": "ch3_draft",
    "delay": 2000
  },
  {
    "id": "ch3_draft",
    "speaker": "system",
    "type": "timestamp",
    "content": "深夜 03:07",
    "nextId": "ch3_draft1",
    "delay": 400
  },
  {
    "id": "ch3_draft1",
    "speaker": "system",
    "type": "draft",
    "content": "加密草稿 / 03:07||我找到她了\n她就在观测室",
    "nextId": "CH4_START",
    "delay": 400
  },
  {
    "id": "CH4_START",
    "speaker": "system",
    "type": "chapter",
    "content": "第四章：记忆",
    "nextId": "ch4_0",
    "delay": 400
  },
  {
    "id": "ch4_0",
    "speaker": "system",
    "type": "timestamp",
    "content": "第五天 09:18",
    "nextId": "ch4_1",
    "delay": 400
  },
  {
    "id": "ch4_1",
    "speaker": "system",
    "type": "status",
    "content": "收到新消息",
    "nextId": "ch4_2",
    "delay": 1000
  },
  {
    "id": "ch4_2",
    "speaker": "nova",
    "type": "text",
    "content": "你好",
    "emotion": "normal",
    "nextId": "ch4_3",
    "delay": 800
  },
  {
    "id": "ch4_3",
    "speaker": "nova",
    "type": "text",
    "content": "请问……",
    "emotion": "normal",
    "nextId": "ch4_4",
    "delay": 800
  },
  {
    "id": "ch4_4",
    "speaker": "nova",
    "type": "text",
    "content": "我们认识吗？",
    "emotion": "normal",
    "nextId": "ch4_5",
    "delay": 2500
  },
  {
    "id": "ch4_5",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【Nova？】",
        "nextId": "ch4_6"
      },
      {
        "text": "【你在开玩笑吗，Nova？】",
        "nextId": "ch4_joke1"
      },
      {
        "text": "【当然认识，你是Nova】",
        "nextId": "ch4_sure1"
      }
    ]
  },
  {
    "id": "ch4_6",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "sad",
    "nextId": "ch4_7",
    "delay": 700
  },
  {
    "id": "ch4_7",
    "speaker": "nova",
    "type": "text",
    "content": "你刚刚叫我什么？",
    "emotion": "normal",
    "nextId": "ch4_8",
    "delay": 800
  },
  {
    "id": "ch4_8",
    "speaker": "nova",
    "type": "text",
    "content": "抱歉",
    "emotion": "sad",
    "nextId": "ch4_8b",
    "delay": 600
  },
  {
    "id": "ch4_8b",
    "speaker": "nova",
    "type": "text",
    "content": "我应该认识你吗？",
    "emotion": "sad",
    "nextId": "ch4_merge1",
    "delay": 1200
  },
  {
    "id": "ch4_joke1",
    "speaker": "nova",
    "type": "text",
    "content": "我希望是",
    "emotion": "sad",
    "nextId": "ch4_joke2",
    "delay": 600
  },
  {
    "id": "ch4_joke2",
    "speaker": "nova",
    "type": "text",
    "content": "但我现在真的笑不出来",
    "emotion": "sad",
    "nextId": "ch4_joke3",
    "delay": 800
  },
  {
    "id": "ch4_joke3",
    "speaker": "nova",
    "type": "text",
    "content": "抱歉",
    "emotion": "sad",
    "nextId": "ch4_joke3b",
    "delay": 600
  },
  {
    "id": "ch4_joke3b",
    "speaker": "nova",
    "type": "text",
    "content": "我好像不记得你了",
    "emotion": "sad",
    "nextId": "ch4_merge1",
    "delay": 1200
  },
  {
    "id": "ch4_sure1",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch4_sure2",
    "delay": 600
  },
  {
    "id": "ch4_sure2",
    "speaker": "nova",
    "type": "text",
    "content": "你说得太确定了",
    "emotion": "normal",
    "nextId": "ch4_sure3",
    "delay": 800
  },
  {
    "id": "ch4_sure3",
    "speaker": "nova",
    "type": "text",
    "content": "可我这里一点印象都没有",
    "emotion": "sad",
    "nextId": "ch4_sure4",
    "delay": 800
  },
  {
    "id": "ch4_sure4",
    "speaker": "nova",
    "type": "text",
    "content": "抱歉",
    "emotion": "sad",
    "nextId": "ch4_sure5",
    "delay": 600
  },
  {
    "id": "ch4_sure5",
    "speaker": "nova",
    "type": "text",
    "content": "这感觉很糟",
    "emotion": "sad",
    "nextId": "ch4_merge1",
    "delay": 1200
  },
  {
    "id": "ch4_merge1",
    "speaker": "nova",
    "type": "text",
    "content": "我不是故意的",
    "emotion": "normal",
    "nextId": "ch4_merge2",
    "delay": 600
  },
  {
    "id": "ch4_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "只是……",
    "emotion": "normal",
    "nextId": "ch4_merge3",
    "delay": 600
  },
  {
    "id": "ch4_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "我好像真的不记得了",
    "emotion": "sad",
    "nextId": "ch4_merge4",
    "delay": 700
  },
  {
    "id": "ch4_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "很多东西",
    "emotion": "normal",
    "nextId": "ch4_merge5",
    "delay": 600
  },
  {
    "id": "ch4_merge5",
    "speaker": "nova",
    "type": "text",
    "content": "包括你",
    "emotion": "sad",
    "nextId": "ch4_12",
    "delay": 800
  },
  {
    "id": "ch4_12",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch4_13",
    "delay": 600
  },
  {
    "id": "ch4_13",
    "speaker": "nova",
    "type": "text",
    "content": "你为什么知道我的名字？",
    "emotion": "normal",
    "nextId": "ch4_14",
    "delay": 800
  },
  {
    "id": "ch4_14",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【当然是你告诉我的】",
        "nextId": "ch4_15"
      },
      {
        "text": "【我们之前聊过很多】",
        "nextId": "ch4_many1"
      },
      {
        "text": "【我可以证明】",
        "nextId": "ch4_prove1"
      }
    ]
  },
  {
    "id": "ch4_15",
    "speaker": "nova",
    "type": "text",
    "content": "我告诉你的？",
    "emotion": "normal",
    "nextId": "ch4_16",
    "delay": 800
  },
  {
    "id": "ch4_16",
    "speaker": "nova",
    "type": "text",
    "content": "什么时候？",
    "emotion": "normal",
    "nextId": "ch4_record1",
    "delay": 800
  },
  {
    "id": "ch4_many1",
    "speaker": "nova",
    "type": "text",
    "content": "很多？",
    "emotion": "normal",
    "nextId": "ch4_many2",
    "delay": 700
  },
  {
    "id": "ch4_many2",
    "speaker": "nova",
    "type": "text",
    "content": "可我这里一点记录都没有",
    "emotion": "sad",
    "nextId": "ch4_many3",
    "delay": 800
  },
  {
    "id": "ch4_many3",
    "speaker": "nova",
    "type": "text",
    "content": "你确定不是认错人了吗？",
    "emotion": "sad",
    "nextId": "ch4_record_merge",
    "delay": 900
  },
  {
    "id": "ch4_prove1",
    "speaker": "nova",
    "type": "text",
    "content": "证明？",
    "emotion": "normal",
    "nextId": "ch4_prove2",
    "delay": 600
  },
  {
    "id": "ch4_prove2",
    "speaker": "nova",
    "type": "text",
    "content": "你要怎么证明？",
    "emotion": "normal",
    "nextId": "ch4_record_merge",
    "delay": 900
  },
  {
    "id": "ch4_record_merge",
    "speaker": "nova",
    "type": "text",
    "content": "抱歉",
    "emotion": "sad",
    "nextId": "ch4_record_merge2",
    "delay": 600
  },
  {
    "id": "ch4_record_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "我不是不相信你",
    "emotion": "sad",
    "nextId": "ch4_record_merge3",
    "delay": 700
  },
  {
    "id": "ch4_record_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "只是这件事真的很奇怪",
    "emotion": "sad",
    "nextId": "ch4_record1",
    "delay": 800
  },
  {
    "id": "ch4_record1",
    "speaker": "nova",
    "type": "text",
    "content": "而且记录显示",
    "emotion": "normal",
    "nextId": "ch4_record2",
    "delay": 600
  },
  {
    "id": "ch4_record2",
    "speaker": "nova",
    "type": "text",
    "content": "我昨天刚从短期休眠舱出来",
    "emotion": "normal",
    "nextId": "ch4_record3",
    "delay": 900
  },
  {
    "id": "ch4_record3",
    "speaker": "nova",
    "type": "text",
    "content": "休眠记录是72小时",
    "emotion": "normal",
    "nextId": "ch4_record4",
    "delay": 800
  },
  {
    "id": "ch4_record4",
    "speaker": "nova",
    "type": "text",
    "content": "但通讯记录里有很多空白",
    "emotion": "normal",
    "nextId": "ch4_record5",
    "delay": 800
  },
  {
    "id": "ch4_record5",
    "speaker": "nova",
    "type": "text",
    "content": "像被删除了一样",
    "emotion": "normal",
    "nextId": "ch4_record6",
    "delay": 800
  },
  {
    "id": "ch4_record6",
    "speaker": "nova",
    "type": "text",
    "content": "如果我们认识",
    "emotion": "normal",
    "nextId": "ch4_record7",
    "delay": 700
  },
  {
    "id": "ch4_record7",
    "speaker": "nova",
    "type": "text",
    "content": "那你应该知道一些我没告诉过别人的事",
    "emotion": "normal",
    "nextId": "ch4_proof_sys1",
    "delay": 1200
  },
  {
    "id": "ch4_proof_sys1",
    "speaker": "system",
    "type": "status",
    "content": "Nova 信任阈值下降",
    "nextId": "ch4_proof_sys2",
    "delay": 700
  },
  {
    "id": "ch4_proof_sys2",
    "speaker": "system",
    "type": "status",
    "content": "可用记忆锚点：不稳定",
    "nextId": "ch4_27",
    "delay": 800
  },
  {
    "id": "ch4_27",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choiceTimeoutMs": 6000,
    "timeoutNextId": "ch4_proof_timeout1",
    "choices": [
      {
        "text": "【N7】",
        "nextId": "ch4_n7_name",
        "statEffect": "none",
        "timedProof": "n7_core_anchor"
      },
      {
        "text": "【牛奶糖】",
        "nextId": "ch4_proof_candy1",
        "statEffect": "none"
      },
      {
        "text": "【观测室】",
        "nextId": "ch4_proof_obs1",
        "statEffect": "none"
      },
      {
        "text": "【我在】",
        "nextId": "ch4_proof_here1",
        "statEffect": "none"
      }
    ]
  },
  {
    "id": "ch4_n7_name",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch4_n7_name2",
    "delay": 600
  },
  {
    "id": "ch4_n7_name2",
    "speaker": "nova",
    "type": "text",
    "content": "你刚刚说什么？\nN7？\n我没有告诉你这个名字\n我绝对没有",
    "emotion": "normal",
    "nextId": "ch4_proof_anchor_tip",
    "delay": 1400
  },
  {
    "id": "ch4_proof_anchor_tip",
    "speaker": "system",
    "type": "status",
    "content": "强化记忆锚点：N7",
    "nextId": "ch4_proof_merge1",
    "delay": 800
  },
  {
    "id": "ch4_proof_candy1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch4_proof_candy2",
    "delay": 800
  },
  {
    "id": "ch4_proof_candy2",
    "speaker": "nova",
    "type": "text",
    "content": "牛奶糖？",
    "emotion": "normal",
    "nextId": "ch4_proof_candy3",
    "delay": 700
  },
  {
    "id": "ch4_proof_candy3",
    "speaker": "nova",
    "type": "text",
    "content": "为什么听到这个词",
    "emotion": "normal",
    "nextId": "ch4_proof_candy4",
    "delay": 700
  },
  {
    "id": "ch4_proof_candy4",
    "speaker": "nova",
    "type": "text",
    "content": "我会突然觉得很难过",
    "emotion": "sad",
    "nextId": "ch4_proof_candy5",
    "delay": 900
  },
  {
    "id": "ch4_proof_candy5",
    "speaker": "nova",
    "type": "text",
    "content": "但这还不能证明我们认识",
    "emotion": "sad",
    "nextId": "ch4_proof_supplement",
    "delay": 1000
  },
  {
    "id": "ch4_proof_obs1",
    "speaker": "nova",
    "type": "text",
    "content": "观测室很多人都知道",
    "emotion": "normal",
    "nextId": "ch4_proof_obs2",
    "delay": 700
  },
  {
    "id": "ch4_proof_obs2",
    "speaker": "nova",
    "type": "text",
    "content": "不",
    "emotion": "normal",
    "nextId": "ch4_proof_obs3",
    "delay": 500
  },
  {
    "id": "ch4_proof_obs3",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch4_proof_obs4",
    "delay": 600
  },
  {
    "id": "ch4_proof_obs4",
    "speaker": "nova",
    "type": "text",
    "content": "为什么我觉得你说的不是那个地方",
    "emotion": "normal",
    "nextId": "ch4_proof_obs5",
    "delay": 900
  },
  {
    "id": "ch4_proof_obs5",
    "speaker": "nova",
    "type": "text",
    "content": "而是某一天的星空",
    "emotion": "sad",
    "nextId": "ch4_proof_supplement",
    "delay": 1100
  },
  {
    "id": "ch4_proof_here1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch4_proof_here2",
    "delay": 700
  },
  {
    "id": "ch4_proof_here2",
    "speaker": "nova",
    "type": "text",
    "content": "这句话很奇怪",
    "emotion": "normal",
    "nextId": "ch4_proof_here3",
    "delay": 700
  },
  {
    "id": "ch4_proof_here3",
    "speaker": "nova",
    "type": "text",
    "content": "明明不能证明什么",
    "emotion": "normal",
    "nextId": "ch4_proof_here4",
    "delay": 700
  },
  {
    "id": "ch4_proof_here4",
    "speaker": "nova",
    "type": "text",
    "content": "可我听见它的时候",
    "emotion": "sad",
    "nextId": "ch4_proof_here5",
    "delay": 800
  },
  {
    "id": "ch4_proof_here5",
    "speaker": "nova",
    "type": "text",
    "content": "心跳突然慢了一点",
    "emotion": "sad",
    "nextId": "ch4_proof_supplement",
    "delay": 1000
  },
  {
    "id": "ch4_proof_timeout1",
    "speaker": "nova",
    "type": "text",
    "content": "你也不知道该怎么证明，对吗",
    "emotion": "sad",
    "nextId": "ch4_proof_timeout2",
    "delay": 900
  },
  {
    "id": "ch4_proof_timeout2",
    "speaker": "nova",
    "type": "text",
    "content": "抱歉",
    "emotion": "sad",
    "nextId": "ch4_proof_timeout3",
    "delay": 700
  },
  {
    "id": "ch4_proof_timeout3",
    "speaker": "nova",
    "type": "text",
    "content": "我现在真的很害怕",
    "emotion": "sad",
    "nextId": "ch4_proof_supplement",
    "delay": 1100
  },
  {
    "id": "ch4_proof_supplement",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【它叫 N7】",
        "nextId": "ch4_proof_supp1"
      }
    ]
  },
  {
    "id": "ch4_proof_supp1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch4_proof_supp2",
    "delay": 700
  },
  {
    "id": "ch4_proof_supp2",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch4_n7_name",
    "delay": 600
  },
  {
    "id": "ch4_proof_merge1",
    "speaker": "nova",
    "type": "text",
    "content": "N7是我的猫",
    "emotion": "normal",
    "nextId": "ch4_proof_merge2",
    "delay": 700
  },
  {
    "id": "ch4_proof_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "我七岁的时候捡到它",
    "emotion": "normal",
    "nextId": "ch4_proof_merge3",
    "delay": 700
  },
  {
    "id": "ch4_proof_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "这件事我几乎没和别人说过",
    "emotion": "normal",
    "nextId": "ch4_proof_merge4",
    "delay": 800
  },
  {
    "id": "ch4_proof_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "更不可能告诉一个陌生人",
    "emotion": "normal",
    "nextId": "ch4_proof_merge5",
    "delay": 900
  },
  {
    "id": "ch4_proof_merge5",
    "speaker": "nova",
    "type": "text",
    "content": "所以……",
    "emotion": "normal",
    "nextId": "ch4_proof_merge6",
    "delay": 900
  },
  {
    "id": "ch4_proof_merge6",
    "speaker": "nova",
    "type": "text",
    "content": "我们真的认识？",
    "emotion": "sad",
    "nextId": "ch4_n7_8",
    "delay": 1200
  },
  {
    "id": "ch4_n7_8",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你告诉过我】",
        "nextId": "ch4_n7_told"
      },
      {
        "text": "【你只是忘了】",
        "nextId": "ch4_n7_forgot"
      },
      {
        "text": "【我一直记得】",
        "nextId": "ch4_n7_remember"
      }
    ]
  },
  {
    "id": "ch4_n7_told",
    "speaker": "nova",
    "type": "text",
    "content": "可我完全没有印象",
    "emotion": "sad",
    "nextId": "ch4_n7_told2",
    "delay": 800
  },
  {
    "id": "ch4_n7_told2",
    "speaker": "nova",
    "type": "text",
    "content": "这比我想象的还糟",
    "emotion": "sad",
    "nextId": "ch4_n7_merge",
    "delay": 900
  },
  {
    "id": "ch4_n7_forgot",
    "speaker": "nova",
    "type": "text",
    "content": "“只是忘了”",
    "emotion": "normal",
    "nextId": "ch4_n7_forgot2",
    "delay": 700
  },
  {
    "id": "ch4_n7_forgot2",
    "speaker": "nova",
    "type": "text",
    "content": "你说得倒是轻巧",
    "emotion": "sad",
    "nextId": "ch4_n7_forgot3",
    "delay": 700
  },
  {
    "id": "ch4_n7_forgot3",
    "speaker": "nova",
    "type": "text",
    "content": "但如果是真的",
    "emotion": "sad",
    "nextId": "ch4_n7_forgot4",
    "delay": 700
  },
  {
    "id": "ch4_n7_forgot4",
    "speaker": "nova",
    "type": "text",
    "content": "那我忘掉的可能不止这件事",
    "emotion": "sad",
    "nextId": "ch4_n7_merge",
    "delay": 900
  },
  {
    "id": "ch4_n7_remember",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch4_n7_remember2",
    "delay": 900
  },
  {
    "id": "ch4_n7_remember2",
    "speaker": "nova",
    "type": "text",
    "content": "不知道为什么",
    "emotion": "sad",
    "nextId": "ch4_n7_remember3",
    "delay": 700
  },
  {
    "id": "ch4_n7_remember3",
    "speaker": "nova",
    "type": "text",
    "content": "这句话听起来",
    "emotion": "sad",
    "nextId": "ch4_n7_remember4",
    "delay": 600
  },
  {
    "id": "ch4_n7_remember4",
    "speaker": "nova",
    "type": "text",
    "content": "让我有点难过",
    "emotion": "sad",
    "nextId": "ch4_n7_merge",
    "delay": 900
  },
  {
    "id": "ch4_n7_merge",
    "speaker": "nova",
    "type": "text",
    "content": "好吧",
    "emotion": "normal",
    "nextId": "ch4_n7_14",
    "delay": 600
  },
  {
    "id": "ch4_n7_14",
    "speaker": "nova",
    "type": "text",
    "content": "至少你知道 N7",
    "emotion": "normal",
    "nextId": "ch4_n7_15",
    "delay": 600
  },
  {
    "id": "ch4_n7_15",
    "speaker": "nova",
    "type": "text",
    "content": "这让我没法把你当骗子",
    "emotion": "smile",
    "nextId": "ch4_n7_18",
    "delay": 800
  },
  {
    "id": "ch4_n7_18",
    "speaker": "nova",
    "type": "text",
    "content": "虽然我不记得你",
    "emotion": "normal",
    "nextId": "ch4_n7_20",
    "delay": 600
  },
  {
    "id": "ch4_n7_20",
    "speaker": "nova",
    "type": "text",
    "content": "但和你聊天的时候",
    "emotion": "normal",
    "nextId": "ch4_n7_21",
    "delay": 600
  },
  {
    "id": "ch4_n7_21",
    "speaker": "nova",
    "type": "text",
    "content": "确实有种很奇怪的安心感",
    "emotion": "smile",
    "nextId": "ch4_folder1",
    "delay": 1200
  },
  {
    "id": "ch4_folder1",
    "speaker": "system",
    "type": "timestamp",
    "content": "11:42",
    "nextId": "ch4_fold2",
    "delay": 400
  },
  {
    "id": "ch4_fold2",
    "speaker": "nova",
    "type": "text",
    "content": "我检查了一下数据库",
    "emotion": "normal",
    "nextId": "ch4_fold3",
    "delay": 600
  },
  {
    "id": "ch4_fold3",
    "speaker": "nova",
    "type": "text",
    "content": "发现一件怪事",
    "emotion": "normal",
    "nextId": "ch4_fold5",
    "delay": 800
  },
  {
    "id": "ch4_fold5",
    "speaker": "nova",
    "type": "text",
    "content": "有个隐藏文件夹",
    "emotion": "normal",
    "nextId": "ch4_fold6",
    "delay": 600
  },
  {
    "id": "ch4_fold6",
    "speaker": "nova",
    "type": "text",
    "content": "权限属于我",
    "emotion": "normal",
    "nextId": "ch4_fold7",
    "delay": 400
  },
  {
    "id": "ch4_fold7",
    "speaker": "nova",
    "type": "text",
    "content": "但我从没见过",
    "emotion": "normal",
    "nextId": "ch4_fold8",
    "delay": 800
  },
  {
    "id": "ch4_fold8",
    "speaker": "system",
    "type": "interaction",
    "content": "打开折叠文件夹",
    "nextId": "ch4_fold9",
    "delay": 400
  },
  {
    "id": "ch4_fold9",
    "speaker": "nova",
    "type": "text",
    "content": "正在试",
    "emotion": "normal",
    "nextId": "ch4_fold10",
    "delay": 1000
  },
  {
    "id": "ch4_fold10",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch4_fold10b",
    "delay": 800
  },
  {
    "id": "ch4_fold10b",
    "speaker": "nova",
    "type": "text",
    "content": "可恶",
    "emotion": "smile",
    "nextId": "ch4_fold11",
    "delay": 600
  },
  {
    "id": "ch4_fold11",
    "speaker": "nova",
    "type": "text",
    "content": "打不开",
    "emotion": "normal",
    "nextId": "ch4_fold12",
    "delay": 600
  },
  {
    "id": "ch4_fold12",
    "speaker": "nova",
    "type": "text",
    "content": "需要双重认证",
    "emotion": "normal",
    "nextId": "ch4_fold13",
    "delay": 800
  },
  {
    "id": "ch4_fold13",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【另一个认证者也是你？】",
        "nextId": "ch4_fold13_a1"
      },
      {
        "text": "【系统怎么可能有两个你】",
        "nextId": "ch4_fold13_b1"
      }
    ]
  },
  {
    "id": "ch4_fold13_a1",
    "speaker": "nova",
    "type": "text",
    "content": "看起来是这样",
    "emotion": "normal",
    "nextId": "ch4_fold14",
    "delay": 600
  },
  {
    "id": "ch4_fold13_b1",
    "speaker": "nova",
    "type": "text",
    "content": "正常系统不可能",
    "emotion": "normal",
    "nextId": "ch4_fold13_b2",
    "delay": 600
  },
  {
    "id": "ch4_fold13_b2",
    "speaker": "nova",
    "type": "text",
    "content": "所以这可能不是正常系统留下的东西",
    "emotion": "normal",
    "nextId": "ch4_fold15",
    "delay": 600
  },
  {
    "id": "ch4_fold14",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch4_fold15",
    "delay": 600
  },
  {
    "id": "ch4_fold15",
    "speaker": "nova",
    "type": "text",
    "content": "显示：",
    "emotion": "normal",
    "nextId": "ch4_fold16",
    "delay": 400
  },
  {
    "id": "ch4_fold16",
    "speaker": "system",
    "type": "file",
    "content": "双重认证者||Nova Arlen\nNova Arlen",
    "nextId": "ch4_id_restore",
    "delay": 400
  },
  {
    "id": "ch4_id_restore",
    "speaker": "system",
    "type": "status",
    "content": "通讯档案已恢复",
    "nextId": "ch4_id_confirm",
    "delay": 800
  },
  {
    "id": "ch4_id_confirm",
    "speaker": "system",
    "type": "status",
    "content": "身份确认：NOVA ARLEN",
    "contactStage": "verified",
    "nextId": "ch4_id_photo",
    "delay": 900
  },
  {
    "id": "ch4_id_photo",
    "speaker": "nova",
    "type": "image",
    "content": "Nova Arlen / Aurora Navigation 身份档案",
    "image": "/assets/nova_id_photo.png",
    "nextId": "ch4_fold17",
    "delay": 400
  },
  {
    "id": "ch4_fold17",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【两个Nova？】",
        "nextId": "ch4_fold18"
      }
    ]
  },
  {
    "id": "ch4_fold18",
    "speaker": "nova",
    "type": "text",
    "content": "我也希望这是系统Bug",
    "emotion": "normal",
    "nextId": "ch4_fold19",
    "delay": 600
  },
  {
    "id": "ch4_fold19",
    "speaker": "nova",
    "type": "text",
    "content": "但系统从不重复登记身份",
    "emotion": "normal",
    "nextId": "ch4_fold20",
    "delay": 600
  },
  {
    "id": "ch4_fold20",
    "speaker": "nova",
    "type": "text",
    "content": "至少理论上不会",
    "emotion": "normal",
    "nextId": "ch4_head1",
    "delay": 800
  },
  {
    "id": "ch4_head1",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "ch4_head2",
    "delay": 600
  },
  {
    "id": "ch4_head2",
    "speaker": "nova",
    "type": "text",
    "content": "我突然头疼",
    "emotion": "sad",
    "nextId": "ch4_head3",
    "delay": 800
  },
  {
    "id": "ch4_head3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【那赶紧去医疗舱看看】",
        "nextId": "ch4_head3_a1"
      },
      {
        "text": "【先告诉我那个画面是什么】",
        "nextId": "ch4_head3_b1"
      }
    ]
  },
  {
    "id": "ch4_head3_a1",
    "speaker": "nova",
    "type": "text",
    "content": "你这反应倒是很像医疗组",
    "emotion": "normal",
    "nextId": "ch4_head4",
    "delay": 600
  },
  {
    "id": "ch4_head3_b1",
    "speaker": "nova",
    "type": "text",
    "content": "你先别急着追问",
    "emotion": "normal",
    "nextId": "ch4_head3_b2",
    "delay": 600
  },
  {
    "id": "ch4_head3_b2",
    "speaker": "nova",
    "type": "text",
    "content": "我得趁它还没散掉的时候说出来",
    "emotion": "sad",
    "nextId": "ch4_head6",
    "delay": 600
  },
  {
    "id": "ch4_head4",
    "speaker": "nova",
    "type": "text",
    "content": "不用",
    "emotion": "normal",
    "nextId": "ch4_head5",
    "delay": 600
  },
  {
    "id": "ch4_head5",
    "speaker": "nova",
    "type": "text",
    "content": "只是……",
    "emotion": "normal",
    "nextId": "ch4_head6",
    "delay": 600
  },
  {
    "id": "ch4_head6",
    "speaker": "nova",
    "type": "text",
    "content": "脑子里闪过一个画面",
    "emotion": "normal",
    "nextId": "ch4_head8",
    "delay": 800
  },
  {
    "id": "ch4_head8",
    "speaker": "nova",
    "type": "text",
    "content": "观测室",
    "emotion": "normal",
    "nextId": "ch4_head9",
    "delay": 600
  },
  {
    "id": "ch4_head9",
    "speaker": "nova",
    "type": "text",
    "content": "一个女孩站在那里",
    "emotion": "normal",
    "nextId": "ch4_head10",
    "delay": 600
  },
  {
    "id": "ch4_head10",
    "speaker": "nova",
    "type": "text",
    "content": "背对着我",
    "emotion": "normal",
    "nextId": "ch4_head12",
    "delay": 800
  },
  {
    "id": "ch4_head12",
    "speaker": "nova",
    "type": "text",
    "content": "她说：",
    "emotion": "normal",
    "nextId": "ch4_head13",
    "delay": 800
  },
  {
    "id": "ch4_head13",
    "speaker": "nova",
    "type": "text",
    "content": "“不要相信第七次”",
    "emotion": "sad",
    "nextId": "ch4_head14",
    "delay": 2500
  },
  {
    "id": "ch4_head14",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【第七次是指现在这一次？】",
        "nextId": "ch4_head14_a1"
      },
      {
        "text": "【你们之前来过这里七次？】",
        "nextId": "ch4_head14_b1"
      }
    ]
  },
  {
    "id": "ch4_head14_a1",
    "speaker": "nova",
    "type": "text",
    "content": "如果按字面理解",
    "emotion": "normal",
    "nextId": "ch4_head15",
    "delay": 600
  },
  {
    "id": "ch4_head14_b1",
    "speaker": "nova",
    "type": "text",
    "content": "这个问题比我敢想的还糟",
    "emotion": "normal",
    "nextId": "ch4_head14_b2",
    "delay": 600
  },
  {
    "id": "ch4_head14_b2",
    "speaker": "nova",
    "type": "text",
    "content": "如果不是来过",
    "emotion": "sad",
    "nextId": "ch4_head14_b3",
    "delay": 600
  },
  {
    "id": "ch4_head14_b3",
    "speaker": "nova",
    "type": "text",
    "content": "就是没有真正离开过",
    "emotion": "sad",
    "nextId": "ch4_head15",
    "delay": 600
  },
  {
    "id": "ch4_head15",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch4_head16",
    "delay": 600
  },
  {
    "id": "ch4_head16",
    "speaker": "nova",
    "type": "text",
    "content": "而且最奇怪的是",
    "emotion": "normal",
    "nextId": "ch4_head17",
    "delay": 600
  },
  {
    "id": "ch4_head17",
    "speaker": "nova",
    "type": "text",
    "content": "那个声音",
    "emotion": "normal",
    "nextId": "ch4_head18",
    "delay": 600
  },
  {
    "id": "ch4_head18",
    "speaker": "nova",
    "type": "text",
    "content": "就是我的声音",
    "emotion": "normal",
    "nextId": "ch4_trust1",
    "delay": 1500
  },
  {
    "id": "ch4_trust1",
    "speaker": "system",
    "type": "timestamp",
    "content": "18:33",
    "nextId": "ch4_trust2",
    "delay": 400
  },
  {
    "id": "ch4_trust2",
    "speaker": "nova",
    "type": "text",
    "content": "我开始相信你了",
    "emotion": "normal",
    "nextId": "ch4_trust3",
    "delay": 800
  },
  {
    "id": "ch4_trust3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【因为 N7？】",
        "nextId": "ch4_trust4",
        "memoryDelta": 1
      },
      {
        "text": "【终于愿意信我了？】",
        "nextId": "ch4_trust_tease",
        "trustDelta": 1
      },
      {
        "text": "【你不用勉强相信的】",
        "nextId": "ch4_trust_gentle",
        "trustDelta": 1
      }
    ]
  },
  {
    "id": "ch4_trust4",
    "speaker": "nova",
    "type": "text",
    "content": "不只是 N7",
    "emotion": "normal",
    "nextId": "ch4_trust4b",
    "delay": 600
  },
  {
    "id": "ch4_trust4b",
    "speaker": "nova",
    "type": "text",
    "content": "还有你说那些事的方式",
    "emotion": "normal",
    "nextId": "ch4_trust4c",
    "delay": 700
  },
  {
    "id": "ch4_trust4c",
    "speaker": "nova",
    "type": "text",
    "content": "不像是在编",
    "emotion": "normal",
    "nextId": "ch4_trust4d",
    "delay": 600
  },
  {
    "id": "ch4_trust4d",
    "speaker": "nova",
    "type": "text",
    "content": "更像是真的记得",
    "emotion": "normal",
    "nextId": "ch4_trust_merge",
    "delay": 800
  },
  {
    "id": "ch4_trust_tease",
    "speaker": "nova",
    "type": "text",
    "content": "别说得像我很难搞一样",
    "emotion": "smile",
    "nextId": "ch4_trust_tease2a",
    "delay": 600
  },
  {
    "id": "ch4_trust_tease2a",
    "speaker": "nova",
    "type": "text",
    "content": "虽然好像确实有一点",
    "emotion": "smile",
    "nextId": "ch4_trust_tease2b",
    "delay": 700
  },
  {
    "id": "ch4_trust_tease2b",
    "speaker": "nova",
    "type": "text",
    "content": "但你要理解",
    "emotion": "normal",
    "nextId": "ch4_trust_tease4",
    "delay": 600
  },
  {
    "id": "ch4_trust_tease4",
    "speaker": "nova",
    "type": "text",
    "content": "醒来之后突然多出一个“熟人”",
    "emotion": "normal",
    "nextId": "ch4_trust_tease5",
    "delay": 800
  },
  {
    "id": "ch4_trust_tease5",
    "speaker": "nova",
    "type": "text",
    "content": "这事正常人都会警惕吧",
    "emotion": "normal",
    "nextId": "ch4_trust_merge",
    "delay": 900
  },
  {
    "id": "ch4_trust_gentle",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch4_trust_gentle2",
    "delay": 700
  },
  {
    "id": "ch4_trust_gentle2",
    "speaker": "nova",
    "type": "text",
    "content": "你这么说",
    "emotion": "normal",
    "nextId": "ch4_trust_gentle3",
    "delay": 600
  },
  {
    "id": "ch4_trust_gentle3",
    "speaker": "nova",
    "type": "text",
    "content": "反而让我更想相信你了",
    "emotion": "normal",
    "nextId": "ch4_trust_gentle4",
    "delay": 800
  },
  {
    "id": "ch4_trust_gentle4",
    "speaker": "nova",
    "type": "text",
    "content": "骗子一般不会给别人保留怀疑自己的余地",
    "emotion": "smile",
    "nextId": "ch4_trust_merge",
    "delay": 1000
  },
  {
    "id": "ch4_trust_merge",
    "speaker": "nova",
    "type": "text",
    "content": "而且",
    "emotion": "normal",
    "nextId": "ch4_trust6",
    "delay": 600
  },
  {
    "id": "ch4_trust6",
    "speaker": "nova",
    "type": "text",
    "content": "如果你真的想骗我",
    "emotion": "normal",
    "nextId": "ch4_trust7",
    "delay": 600
  },
  {
    "id": "ch4_trust7",
    "speaker": "nova",
    "type": "text",
    "content": "完全没必要提 N7",
    "emotion": "normal",
    "nextId": "ch4_trust8",
    "delay": 600
  },
  {
    "id": "ch4_trust8",
    "speaker": "nova",
    "type": "text",
    "content": "那种细节编不出来",
    "emotion": "smile",
    "nextId": "ch4_trust8b",
    "delay": 700
  },
  {
    "id": "ch4_trust8b",
    "speaker": "nova",
    "type": "text",
    "content": "也没有骗我的价值",
    "emotion": "smile",
    "nextId": "ch4_trust9",
    "delay": 800
  },
  {
    "id": "ch4_trust9",
    "speaker": "nova",
    "type": "text",
    "content": "所以我现在有两个判断",
    "emotion": "normal",
    "nextId": "ch4_trust_judge",
    "delay": 900
  },
  {
    "id": "ch4_trust_judge",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【哪两个？】",
        "nextId": "ch4_trust_j1"
      },
      {
        "text": "【听起来不太乐观】",
        "nextId": "ch4_trust_j2"
      },
      {
        "text": "【我猜你不会喜欢这两个判断】",
        "nextId": "ch4_trust_j3"
      }
    ]
  },
  {
    "id": "ch4_trust_j1",
    "speaker": "nova",
    "type": "text",
    "content": "第一",
    "emotion": "normal",
    "nextId": "ch4_trust_j1b",
    "delay": 500
  },
  {
    "id": "ch4_trust_j1b",
    "speaker": "nova",
    "type": "text",
    "content": "我们以前真的认识",
    "emotion": "normal",
    "nextId": "ch4_trust_j1c",
    "delay": 700
  },
  {
    "id": "ch4_trust_j1c",
    "speaker": "nova",
    "type": "text",
    "content": "第二",
    "emotion": "normal",
    "nextId": "ch4_trust_j1d",
    "delay": 500
  },
  {
    "id": "ch4_trust_j1d",
    "speaker": "nova",
    "type": "text",
    "content": "我把这件事忘了",
    "emotion": "sad",
    "nextId": "ch4_trust_fear",
    "delay": 800
  },
  {
    "id": "ch4_trust_j2",
    "speaker": "nova",
    "type": "text",
    "content": "确实",
    "emotion": "normal",
    "nextId": "ch4_trust_j2b",
    "delay": 600
  },
  {
    "id": "ch4_trust_j2b",
    "speaker": "nova",
    "type": "text",
    "content": "因为无论哪一个是真的",
    "emotion": "normal",
    "nextId": "ch4_trust_j2c",
    "delay": 800
  },
  {
    "id": "ch4_trust_j2c",
    "speaker": "nova",
    "type": "text",
    "content": "都说明我的记忆出了问题",
    "emotion": "sad",
    "nextId": "ch4_trust_fear",
    "delay": 900
  },
  {
    "id": "ch4_trust_j3",
    "speaker": "nova",
    "type": "text",
    "content": "你猜对了",
    "emotion": "smile",
    "nextId": "ch4_trust_j3b",
    "delay": 600
  },
  {
    "id": "ch4_trust_j3b",
    "speaker": "nova",
    "type": "text",
    "content": "我一点都不喜欢",
    "emotion": "sad",
    "nextId": "ch4_trust_j3c",
    "delay": 700
  },
  {
    "id": "ch4_trust_j3c",
    "speaker": "nova",
    "type": "text",
    "content": "尤其是第二个",
    "emotion": "sad",
    "nextId": "ch4_trust_fear",
    "delay": 800
  },
  {
    "id": "ch4_trust_fear",
    "speaker": "nova",
    "type": "text",
    "content": "其实",
    "emotion": "normal",
    "nextId": "ch4_trust11",
    "delay": 600
  },
  {
    "id": "ch4_trust11",
    "speaker": "nova",
    "type": "text",
    "content": "我有点害怕",
    "emotion": "sad",
    "nextId": "ch4_trust12",
    "delay": 800
  },
  {
    "id": "ch4_trust12",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【害怕什么】",
        "nextId": "ch4_trust_f1",
        "trustDelta": 1
      },
      {
        "text": "【害怕想起来？】",
        "nextId": "ch4_trust_memory",
        "memoryDelta": 1
      },
      {
        "text": "【害怕我说的是真的？】",
        "nextId": "ch4_trust_true",
        "trustDelta": 1
      }
    ]
  },
  {
    "id": "ch4_trust_f1",
    "speaker": "nova",
    "type": "text",
    "content": "害怕我真的忘记了什么重要的人",
    "emotion": "sad",
    "nextId": "ch4_trust_f1b",
    "delay": 900
  },
  {
    "id": "ch4_trust_f1b",
    "speaker": "nova",
    "type": "text",
    "content": "而且那个人",
    "emotion": "sad",
    "nextId": "ch4_trust_f1c",
    "delay": 700
  },
  {
    "id": "ch4_trust_f1c",
    "speaker": "nova",
    "type": "text",
    "content": "现在还在我面前",
    "emotion": "sad",
    "nextId": "ch4_trust_apology",
    "delay": 900
  },
  {
    "id": "ch4_trust_true",
    "speaker": "nova",
    "type": "text",
    "content": "对",
    "emotion": "sad",
    "nextId": "ch4_trust_true2",
    "delay": 500
  },
  {
    "id": "ch4_trust_true2",
    "speaker": "nova",
    "type": "text",
    "content": "因为如果你说的是真的",
    "emotion": "sad",
    "nextId": "ch4_trust_true3",
    "delay": 800
  },
  {
    "id": "ch4_trust_true3",
    "speaker": "nova",
    "type": "text",
    "content": "那我不是第一次失去你",
    "emotion": "sad",
    "nextId": "ch4_trust_true4",
    "delay": 900
  },
  {
    "id": "ch4_trust_true4",
    "speaker": "nova",
    "type": "text",
    "content": "只是第一次意识到自己失去了你",
    "emotion": "sad",
    "nextId": "ch4_trust_apology",
    "delay": 1100
  },
  {
    "id": "ch4_trust_apology",
    "speaker": "nova",
    "type": "text",
    "content": "抱歉",
    "emotion": "sad",
    "nextId": "ch4_trust_apology2",
    "delay": 600
  },
  {
    "id": "ch4_trust_apology2",
    "speaker": "nova",
    "type": "text",
    "content": "这句话听起来可能很奇怪",
    "emotion": "sad",
    "nextId": "ch4_trust_apology3",
    "delay": 800
  },
  {
    "id": "ch4_trust_apology3",
    "speaker": "nova",
    "type": "text",
    "content": "但我现在最害怕的不是被骗",
    "emotion": "sad",
    "nextId": "ch4_trust_apology4",
    "delay": 900
  },
  {
    "id": "ch4_trust_apology4",
    "speaker": "nova",
    "type": "text",
    "content": "而是你说的都是真的",
    "emotion": "sad",
    "nextId": "ch4_trust14",
    "delay": 1200
  },
  {
    "id": "ch4_trust_memory",
    "speaker": "nova",
    "type": "text",
    "content": "也许吧",
    "emotion": "sad",
    "nextId": "ch4_trust_memory2",
    "delay": 700
  },
  {
    "id": "ch4_trust_memory2",
    "speaker": "nova",
    "type": "text",
    "content": "如果记忆是被删掉的，那它被删掉之前一定发生过很糟糕的事",
    "emotion": "sad",
    "nextId": "ch4_trust14",
    "delay": 1500
  },
  {
    "id": "ch4_trust14",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【......】",
        "nextId": "ch4_trust15"
      }
    ]
  },
  {
    "id": "ch4_trust15",
    "speaker": "nova",
    "type": "text",
    "content": "如果是那样",
    "emotion": "sad",
    "nextId": "ch4_trust16",
    "delay": 600
  },
  {
    "id": "ch4_trust16",
    "speaker": "nova",
    "type": "text",
    "content": "那一定很糟糕",
    "emotion": "sad",
    "nextId": "ch4_trust17",
    "delay": 800
  },
  {
    "id": "ch4_trust17",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【为什么会更难过？】",
        "nextId": "ch4_trust17_a1",
        "trustDelta": 1
      },
      {
        "text": "【……】",
        "nextId": "ch4_trust17_b1"
      }
    ]
  },
  {
    "id": "ch4_trust17_a1",
    "speaker": "nova",
    "type": "text",
    "content": "因为",
    "emotion": "normal",
    "nextId": "ch4_trust19",
    "delay": 600
  },
  {
    "id": "ch4_trust17_b1",
    "speaker": "nova",
    "type": "text",
    "content": "你沉默了",
    "emotion": "sad",
    "nextId": "ch4_trust17_b2",
    "delay": 600
  },
  {
    "id": "ch4_trust17_b2",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "sad",
    "nextId": "ch4_trust17_b3",
    "delay": 600
  },
  {
    "id": "ch4_trust17_b3",
    "speaker": "nova",
    "type": "text",
    "content": "这句话本来就不好接",
    "emotion": "sad",
    "nextId": "ch4_trust19",
    "delay": 600
  },
  {
    "id": "ch4_trust18",
    "speaker": "nova",
    "type": "text",
    "content": "因为",
    "emotion": "normal",
    "nextId": "ch4_trust19",
    "delay": 600
  },
  {
    "id": "ch4_trust19",
    "speaker": "nova",
    "type": "text",
    "content": "被忘记已经很难过了",
    "emotion": "sad",
    "nextId": "ch4_trust20",
    "delay": 600
  },
  {
    "id": "ch4_trust20",
    "speaker": "nova",
    "type": "text",
    "content": "忘记别人",
    "emotion": "normal",
    "nextId": "ch4_trust21",
    "delay": 400
  },
  {
    "id": "ch4_trust21",
    "speaker": "nova",
    "type": "text",
    "content": "其实更难过",
    "emotion": "sad",
    "nextId": "ch4_gn1",
    "delay": 2000
  },
  {
    "id": "ch4_gn1",
    "speaker": "system",
    "type": "timestamp",
    "content": "23:17",
    "nextId": "ch4_gn2",
    "delay": 400
  },
  {
    "id": "ch4_gn2",
    "speaker": "nova",
    "type": "text",
    "content": "我要睡了",
    "emotion": "normal",
    "nextId": "ch4_gn3",
    "delay": 600
  },
  {
    "id": "ch4_gn3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【晚安】",
        "nextId": "ch4_gn4",
        "trustDelta": 1
      }
    ]
  },
  {
    "id": "ch4_gn4",
    "speaker": "nova",
    "type": "text",
    "content": "晚安",
    "emotion": "normal",
    "nextId": "ch4_gn7",
    "delay": 800
  },
  {
    "id": "ch4_gn7",
    "speaker": "nova",
    "type": "text",
    "content": "那个",
    "emotion": "normal",
    "nextId": "ch4_gn9",
    "delay": 600
  },
  {
    "id": "ch4_gn9",
    "speaker": "nova",
    "type": "text",
    "content": "虽然我不记得以前",
    "emotion": "normal",
    "nextId": "ch4_gn10",
    "delay": 600
  },
  {
    "id": "ch4_gn10",
    "speaker": "nova",
    "type": "text",
    "content": "但如果你说的是真的",
    "emotion": "normal",
    "nextId": "ch4_gn11",
    "delay": 600
  },
  {
    "id": "ch4_gn11",
    "speaker": "nova",
    "type": "text",
    "content": "谢谢你一直记得我",
    "emotion": "smile",
    "nextId": "ch4_offline",
    "delay": 1500
  },
  {
    "id": "ch4_offline",
    "speaker": "system",
    "type": "status",
    "content": "Nova 已离线",
    "nextId": "ch4_log",
    "delay": 2000
  },
  {
    "id": "ch4_log",
    "speaker": "system",
    "type": "timestamp",
    "content": "凌晨 02:41",
    "nextId": "ch4_log1",
    "delay": 400
  },
  {
    "id": "ch4_log1",
    "speaker": "system",
    "type": "file",
    "content": "隐藏日志：NOVA-07||如果你正在阅读这段记录。\n说明我已经忘记他了。\n请不要尝试恢复记忆。\n不要寻找观测室中的我。\n不要打开第七协议。\n尤其不要相信我。\n\n因为我已经失败六次了。",
    "nextId": "CH5A_START",
    "delay": 400
  },
  {
    "id": "CH5A_START",
    "speaker": "system",
    "type": "chapter",
    "content": "第五章：真相（上）",
    "nextId": "ch5a_0",
    "delay": 400
  },
  {
    "id": "ch5a_0",
    "speaker": "system",
    "type": "timestamp",
    "content": "第六天 07:11",
    "nextId": "ch5a_1",
    "delay": 400
  },
  {
    "id": "ch5a_1",
    "speaker": "system",
    "type": "status",
    "content": "收到新消息",
    "nextId": "ch5a_2",
    "delay": 800
  },
  {
    "id": "ch5a_2",
    "speaker": "nova",
    "type": "text",
    "content": "我没睡",
    "emotion": "normal",
    "nextId": "ch5a_4",
    "delay": 800
  },
  {
    "id": "ch5a_4",
    "speaker": "nova",
    "type": "text",
    "content": "我打开了那个文件夹",
    "emotion": "normal",
    "nextId": "ch5a_6",
    "delay": 800
  },
  {
    "id": "ch5a_6",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch5a_7",
    "delay": 600
  },
  {
    "id": "ch5a_7",
    "speaker": "nova",
    "type": "text",
    "content": "昨晚睡觉前打不开",
    "emotion": "normal",
    "nextId": "ch5a_8",
    "delay": 700
  },
  {
    "id": "ch5a_8",
    "speaker": "nova",
    "type": "text",
    "content": "今天醒来就能打开了",
    "emotion": "normal",
    "nextId": "ch5a_9",
    "delay": 700
  },
  {
    "id": "ch5a_9",
    "speaker": "nova",
    "type": "text",
    "content": "像有人帮我授权了一样",
    "emotion": "normal",
    "nextId": "ch5a_11",
    "delay": 800
  },
  {
    "id": "ch5a_11",
    "speaker": "nova",
    "type": "text",
    "content": "记录",
    "emotion": "normal",
    "nextId": "ch5a_12",
    "delay": 400
  },
  {
    "id": "ch5a_12",
    "speaker": "nova",
    "type": "text",
    "content": "很多记录",
    "emotion": "normal",
    "nextId": "ch5a_13",
    "delay": 400
  },
  {
    "id": "ch5a_13",
    "speaker": "nova",
    "type": "text",
    "content": "全都是我留下的",
    "emotion": "normal",
    "nextId": "ch5a_protocol0",
    "delay": 700
  },
  {
    "id": "ch5a_protocol0",
    "speaker": "nova",
    "type": "text",
    "content": "还有一份协议说明",
    "emotion": "normal",
    "nextId": "ch5a_protocol4",
    "delay": 800
  },
  {
    "id": "ch5a_protocol4",
    "speaker": "nova",
    "type": "text",
    "content": "第七协议原本不是用来困住人的",
    "emotion": "normal",
    "nextId": "ch5a_protocol4b",
    "delay": 800
  },
  {
    "id": "ch5a_protocol4b",
    "speaker": "nova",
    "type": "text",
    "content": "也不是用来让谁永远重来",
    "emotion": "normal",
    "nextId": "ch5a_protocol5",
    "delay": 800
  },
  {
    "id": "ch5a_protocol5",
    "speaker": "nova",
    "type": "text",
    "content": "它更像一套紧急安全阀",
    "emotion": "normal",
    "nextId": "ch5a_protocol6",
    "delay": 700
  },
  {
    "id": "ch5a_protocol6",
    "speaker": "nova",
    "type": "text",
    "content": "当 Aurora 号任务被判定为不可恢复失败",
    "emotion": "normal",
    "nextId": "ch5a_protocol7",
    "delay": 900
  },
  {
    "id": "ch5a_protocol7",
    "speaker": "nova",
    "type": "text",
    "content": "它会启动局部时间回溯",
    "emotion": "normal",
    "nextId": "ch5a_protocol7b",
    "delay": 1000
  },
  {
    "id": "ch5a_protocol7b",
    "speaker": "nova",
    "type": "text",
    "content": "把 Aurora 号任务状态拉回上一个安全记录点",
    "emotion": "normal",
    "nextId": "ch5a_protocol7c",
    "delay": 900
  },
  {
    "id": "ch5a_protocol7c",
    "speaker": "nova",
    "type": "text",
    "content": "船员、系统、航线、航行记录\n都会一起回溯",
    "emotion": "normal",
    "nextId": "ch5a_protocol7d",
    "delay": 800
  },
  {
    "id": "ch5a_protocol7d",
    "speaker": "nova",
    "type": "text",
    "content": "但它不是把整个宇宙倒回去",
    "emotion": "normal",
    "nextId": "ch5a_protocol7e",
    "delay": 600
  },
  {
    "id": "ch5a_protocol7e",
    "speaker": "nova",
    "type": "text",
    "content": "回溯范围只覆盖 Aurora 号和这段任务状态",
    "emotion": "normal",
    "nextId": "ch5a_protocol7f",
    "delay": 600
  },
  {
    "id": "ch5a_protocol7f",
    "speaker": "nova",
    "type": "text",
    "content": "舰外对象不会被一起重写",
    "emotion": "normal",
    "nextId": "ch5a_protocol8",
    "delay": 600
  },
  {
    "id": "ch5a_protocol8",
    "speaker": "nova",
    "type": "text",
    "content": "理论上",
    "emotion": "normal",
    "nextId": "ch5a_protocol8b",
    "delay": 500
  },
  {
    "id": "ch5a_protocol8b",
    "speaker": "nova",
    "type": "text",
    "content": "它只应该保留最低限度的航行数据",
    "emotion": "normal",
    "nextId": "ch5a_protocol9",
    "delay": 900
  },
  {
    "id": "ch5a_protocol9",
    "speaker": "nova",
    "type": "text",
    "content": "不该保留人的记忆",
    "emotion": "normal",
    "nextId": "ch5a_protocol10",
    "delay": 800
  },
  {
    "id": "ch5a_protocol10",
    "speaker": "nova",
    "type": "text",
    "content": "更不该保留我",
    "emotion": "sad",
    "nextId": "ch5a_protocol10b",
    "delay": 800
  },
  {
    "id": "ch5a_protocol10b",
    "speaker": "nova",
    "type": "text",
    "content": "但现在",
    "emotion": "normal",
    "nextId": "ch5a_protocol10c",
    "delay": 500
  },
  {
    "id": "ch5a_protocol10c",
    "speaker": "nova",
    "type": "text",
    "content": "它好像开始把我当成记录的一部分了",
    "emotion": "sad",
    "nextId": "ch5a_logs1",
    "delay": 1000
  },
  {
    "id": "ch5a_logs1",
    "speaker": "system",
    "type": "file",
    "content": "回溯日志集||日志001：如果你看到这里，说明循环已经开始。\n\n日志002：不要相信系统时间。\n\n日志003：不要进入观测室。\n\n日志004：如果你收到来自自己的消息，删除它。\n\n日志007：如果你已经认识他，请善待他。\n\n日志012：他会记得一切。所以不要让他知道真相。",
    "nextId": "ch5a_protocol1",
    "delay": 400
  },
  {
    "id": "ch5a_protocol1",
    "speaker": "system",
    "type": "file",
    "content": "时间回溯记录摘录||时间回溯范围：Aurora号局部任务状态（舰外对象不受影响）\n船员记忆同步：已重置\n航行记录回溯：完成\n异常残留：Nova Arlen / UNKNOWN",
    "nextId": "ch5a_protocol2",
    "delay": 400
  },
  {
    "id": "ch5a_protocol2",
    "speaker": "system",
    "type": "file",
    "content": "SEVENTH_PROTOCOL / 权限说明||协议目标：维持 Aurora 号任务延续\n时间回溯对象：任务状态 / 船员认知 / 航行系统\n允许保留：最低限度航行数据\n禁止保留：完整个人记忆\n异常记录：外部索引已生成\n保密备注：船员提前确认时间回溯存在，将造成认知污染并干扰回溯收敛\n时间戳异常：上一轮任务内时间污染当前循环索引\n三个月前日志：非现实日期，为上一轮任务时间残留",
    "nextId": "ch5a_firstline_hint1",
    "delay": 400
  },
  {
    "id": "ch5a_firstline_hint1",
    "speaker": "nova",
    "type": "text",
    "content": "日志里还有一句很奇怪的话",
    "emotion": "normal",
    "nextId": "ch5a_firstline_hint2",
    "delay": 600
  },
  {
    "id": "ch5a_firstline_hint2",
    "speaker": "nova",
    "type": "text",
    "content": "它说",
    "emotion": "normal",
    "nextId": "ch5a_firstline_hint3",
    "delay": 600
  },
  {
    "id": "ch5a_firstline_hint3",
    "speaker": "nova",
    "type": "text",
    "content": "第一句话很重要",
    "emotion": "normal",
    "nextId": "ch5a_firstline_hint4",
    "delay": 600
  },
  {
    "id": "ch5a_firstline_hint4",
    "speaker": "nova",
    "type": "text",
    "content": "但她没写是哪句",
    "emotion": "normal",
    "nextId": "ch5a_firstline_hint5",
    "delay": 600
  },
  {
    "id": "ch5a_firstline_hint5",
    "speaker": "nova",
    "type": "text",
    "content": "你还记得吗？",
    "emotion": "normal",
    "nextId": "ch5a_firstline_hint6",
    "delay": 600
  },
  {
    "id": "ch5a_firstline_hint6",
    "speaker": "nova",
    "type": "text",
    "content": "算了",
    "emotion": "normal",
    "nextId": "ch5a_firstline_hint7",
    "delay": 600
  },
  {
    "id": "ch5a_firstline_hint7",
    "speaker": "nova",
    "type": "text",
    "content": "也许你记得",
    "emotion": "smile",
    "nextId": "ch5a_protocol3",
    "delay": 600
  },
  {
    "id": "ch5a_protocol3",
    "speaker": "nova",
    "type": "text",
    "content": "看懂了吗",
    "emotion": "normal",
    "nextId": "ch5a_protocol11",
    "delay": 700
  },
  {
    "id": "ch5a_protocol11",
    "speaker": "nova",
    "type": "text",
    "content": "它不是想救我",
    "emotion": "normal",
    "nextId": "ch5a_protocol12",
    "delay": 900
  },
  {
    "id": "ch5a_protocol12",
    "speaker": "nova",
    "type": "text",
    "content": "它只是想让任务继续",
    "emotion": "normal",
    "nextId": "ch5a_protocol13",
    "delay": 900
  },
  {
    "id": "ch5a_protocol13",
    "speaker": "nova",
    "type": "text",
    "content": "而我",
    "emotion": "normal",
    "nextId": "ch5a_protocol14",
    "delay": 500
  },
  {
    "id": "ch5a_protocol14",
    "speaker": "nova",
    "type": "text",
    "content": "好像被它当成了某种错误但有用的记录",
    "emotion": "sad",
    "nextId": "ch5a_protocol15",
    "delay": 1100
  },
  {
    "id": "ch5a_protocol15",
    "speaker": "nova",
    "type": "text",
    "content": "还有那个外部索引",
    "emotion": "normal",
    "nextId": "ch5a_protocol16",
    "delay": 800
  },
  {
    "id": "ch5a_protocol16",
    "speaker": "nova",
    "type": "text",
    "content": "它也不该存在",
    "emotion": "sad",
    "nextId": "ch5a_time_explain1",
    "delay": 1000
  },
  {
    "id": "ch5a_time_explain1",
    "speaker": "nova",
    "type": "text",
    "content": "我也终于明白三个月前那条日志了",
    "emotion": "normal",
    "nextId": "ch5a_time_explain2",
    "delay": 900
  },
  {
    "id": "ch5a_time_explain2",
    "speaker": "nova",
    "type": "text",
    "content": "不是 Aurora 三个月前就出发了",
    "emotion": "normal",
    "nextId": "ch5a_time_explain3",
    "delay": 900
  },
  {
    "id": "ch5a_time_explain3",
    "speaker": "nova",
    "type": "text",
    "content": "是上一轮的“三个月后”",
    "emotion": "normal",
    "nextId": "ch5a_time_explain4",
    "delay": 900
  },
  {
    "id": "ch5a_time_explain4",
    "speaker": "nova",
    "type": "text",
    "content": "被塞进了这一轮的“三个月前”",
    "emotion": "normal",
    "nextId": "ch5a_time_explain5",
    "delay": 1000
  },
  {
    "id": "ch5a_time_explain5",
    "speaker": "nova",
    "type": "text",
    "content": "这不是完整意义上的时间旅行",
    "emotion": "normal",
    "nextId": "ch5a_time_explain6",
    "delay": 800
  },
  {
    "id": "ch5a_time_explain6",
    "speaker": "nova",
    "type": "text",
    "content": "是上一轮任务时间残留\n污染了这一轮的索引",
    "emotion": "sad",
    "nextId": "ch5a_logs3",
    "delay": 1200
  },
  {
    "id": "ch5a_logs3",
    "speaker": "nova",
    "type": "text",
    "content": "后面开始不对劲了",
    "emotion": "normal",
    "nextId": "ch5a_logs5",
    "delay": 600
  },
  {
    "id": "ch5a_logs5",
    "speaker": "nova",
    "type": "text",
    "content": "你自己看",
    "emotion": "normal",
    "nextId": "ch5a_logs6",
    "delay": 800
  },
  {
    "id": "ch5a_logs6",
    "speaker": "system",
    "type": "file",
    "content": "日志007-012||日志007：如果你已经认识他，请善待他。\n\n日志012：他会记得一切。所以不要让他知道真相。\n\nNova，不要再问了。继续循环下去，对你们都好。",
    "nextId": "ch5a_logs8",
    "delay": 400
  },
  {
    "id": "ch5a_logs8",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch5a_logs9",
    "delay": 600
  },
  {
    "id": "ch5a_logs9",
    "speaker": "nova",
    "type": "text",
    "content": "后面还有",
    "emotion": "normal",
    "nextId": "ch5a_logs10",
    "delay": 800
  },
  {
    "id": "ch5a_logs10",
    "speaker": "nova",
    "type": "text",
    "content": "最奇怪的是",
    "emotion": "normal",
    "nextId": "ch5a_logs11",
    "delay": 600
  },
  {
    "id": "ch5a_logs11",
    "speaker": "nova",
    "type": "text",
    "content": "日志数量",
    "emotion": "normal",
    "nextId": "ch5a_logs13",
    "delay": 800
  },
  {
    "id": "ch5a_logs13",
    "speaker": "nova",
    "type": "text",
    "content": "六份",
    "emotion": "normal",
    "nextId": "ch5a_logs14",
    "delay": 600
  },
  {
    "id": "ch5a_logs14",
    "speaker": "nova",
    "type": "text",
    "content": "正好六个版本",
    "emotion": "normal",
    "nextId": "ch5a_logs15",
    "delay": 800
  },
  {
    "id": "ch5a_logs15",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【六份日志对应六次循环？】",
        "nextId": "ch5a_logs16"
      }
    ]
  },
  {
    "id": "ch5a_logs16",
    "speaker": "nova",
    "type": "text",
    "content": "这些日志来自不同时间",
    "emotion": "normal",
    "nextId": "ch5a_logs17",
    "delay": 600
  },
  {
    "id": "ch5a_logs17",
    "speaker": "nova",
    "type": "text",
    "content": "但内容互相矛盾",
    "emotion": "normal",
    "nextId": "ch5a_logs18",
    "delay": 600
  },
  {
    "id": "ch5a_logs18",
    "speaker": "nova",
    "type": "text",
    "content": "像六个人写的",
    "emotion": "normal",
    "nextId": "ch5a_obs1",
    "delay": 2000
  },
  {
    "id": "ch5a_obs1",
    "speaker": "system",
    "type": "timestamp",
    "content": "11:52",
    "nextId": "ch5a_obs2",
    "delay": 400
  },
  {
    "id": "ch5a_obs2",
    "speaker": "nova",
    "type": "text",
    "content": "我去了观测室",
    "emotion": "normal",
    "nextId": "ch5a_obs4",
    "delay": 800
  },
  {
    "id": "ch5a_obs4",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "normal",
    "nextId": "ch5a_obs5",
    "delay": 400
  },
  {
    "id": "ch5a_obs5",
    "speaker": "nova",
    "type": "text",
    "content": "但总得有人搞清楚发生什么",
    "emotion": "normal",
    "nextId": "ch5a_obs6",
    "delay": 800
  },
  {
    "id": "ch5a_obs6",
    "speaker": "nova",
    "type": "text",
    "content": "里面有人",
    "emotion": "normal",
    "nextId": "ch5a_obs9",
    "delay": 800
  },
  {
    "id": "ch5a_obs9",
    "speaker": "nova",
    "type": "text",
    "content": "不",
    "emotion": "normal",
    "nextId": "ch5a_obs9b",
    "delay": 500
  },
  {
    "id": "ch5a_obs9b",
    "speaker": "nova",
    "type": "text",
    "content": "是我",
    "emotion": "normal",
    "nextId": "ch5a_obs11",
    "delay": 1200
  },
  {
    "id": "ch5a_obs11",
    "speaker": "system",
    "type": "status",
    "content": "通讯静默了几秒",
    "nextId": "ch5a_obs11a",
    "delay": 400
  },
  {
    "id": "ch5a_obs11a",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "normal",
    "nextId": "ch5a_obs11b",
    "delay": 600
  },
  {
    "id": "ch5a_obs11b",
    "speaker": "nova",
    "type": "text",
    "content": "这段录像很难接着看下去",
    "emotion": "sad",
    "nextId": "ch5a_obs12",
    "delay": 600
  },
  {
    "id": "ch5a_obs12",
    "speaker": "nova",
    "type": "text",
    "content": "我知道听起来很蠢",
    "emotion": "normal",
    "nextId": "ch5a_obs13",
    "delay": 600
  },
  {
    "id": "ch5a_obs13",
    "speaker": "nova",
    "type": "text",
    "content": "但她不是另一个活着的我",
    "emotion": "normal",
    "nextId": "ch5a_obs14",
    "delay": 700
  },
  {
    "id": "ch5a_obs14",
    "speaker": "nova",
    "type": "text",
    "content": "更像一个由记忆和协议拼出来的残影",
    "emotion": "normal",
    "nextId": "ch5a_obs15",
    "delay": 900
  },
  {
    "id": "ch5a_obs15",
    "speaker": "nova",
    "type": "text",
    "content": "她坐在观测窗前，像是等了很久",
    "emotion": "normal",
    "nextId": "ch5a_obs17",
    "delay": 900
  },
  {
    "id": "ch5a_obs17",
    "speaker": "nova",
    "type": "text",
    "content": "说了",
    "emotion": "normal",
    "nextId": "ch5a_obs19",
    "delay": 600
  },
  {
    "id": "ch5a_obs19",
    "speaker": "nova",
    "type": "text",
    "content": "回答了",
    "emotion": "normal",
    "nextId": "ch5a_obs21",
    "delay": 600
  },
  {
    "id": "ch5a_obs21",
    "speaker": "nova",
    "type": "text",
    "content": "她看着我",
    "emotion": "normal",
    "nextId": "ch5a_obs22",
    "delay": 600
  },
  {
    "id": "ch5a_obs22",
    "speaker": "nova",
    "type": "text",
    "content": "第一句话是：",
    "emotion": "normal",
    "nextId": "ch5a_obs23",
    "delay": 800
  },
  {
    "id": "ch5a_obs23",
    "speaker": "nova",
    "type": "text",
    "content": "“已经第七次了？”",
    "emotion": "normal",
    "nextId": "ch5a_obs24",
    "delay": 2500
  },
  {
    "id": "ch5a_obs24",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【她听起来像是在等这一次？】",
        "nextId": "ch5a_obs24_a1"
      },
      {
        "text": "【等了多久？】",
        "nextId": "ch5a_obs24_b1"
      }
    ]
  },
  {
    "id": "ch5a_obs24_a1",
    "speaker": "nova",
    "type": "text",
    "content": "对",
    "emotion": "normal",
    "nextId": "ch5a_obs25",
    "delay": 600
  },
  {
    "id": "ch5a_obs24_b1",
    "speaker": "nova",
    "type": "text",
    "content": "我不知道",
    "emotion": "sad",
    "nextId": "ch5a_obs24_b2",
    "delay": 600
  },
  {
    "id": "ch5a_obs24_b2",
    "speaker": "nova",
    "type": "text",
    "content": "但如果她真的是第六次的我",
    "emotion": "sad",
    "nextId": "ch5a_obs24_b3",
    "delay": 600
  },
  {
    "id": "ch5a_obs24_b3",
    "speaker": "nova",
    "type": "text",
    "content": "那至少已经等过一次失败之后的全部时间",
    "emotion": "sad",
    "nextId": "ch5a_obs25",
    "delay": 600
  },
  {
    "id": "ch5a_obs25",
    "speaker": "nova",
    "type": "text",
    "content": "然后她笑了",
    "emotion": "normal",
    "nextId": "ch5a_obs26",
    "delay": 600
  },
  {
    "id": "ch5a_obs26",
    "speaker": "nova",
    "type": "text",
    "content": "很难形容",
    "emotion": "normal",
    "nextId": "ch5a_obs27",
    "delay": 600
  },
  {
    "id": "ch5a_obs27",
    "speaker": "nova",
    "type": "text",
    "content": "像松了一口气",
    "emotion": "normal",
    "nextId": "ch5a_obs28",
    "delay": 600
  },
  {
    "id": "ch5a_obs28",
    "speaker": "nova",
    "type": "text",
    "content": "又像很难过",
    "emotion": "sad",
    "nextId": "ch5a_obs30",
    "delay": 800
  },
  {
    "id": "ch5a_obs30",
    "speaker": "nova",
    "type": "text",
    "content": "她问：",
    "emotion": "normal",
    "nextId": "ch5a_obs31",
    "delay": 800
  },
  {
    "id": "ch5a_obs31",
    "speaker": "nova",
    "type": "text",
    "content": "“他还在吗？”",
    "emotion": "normal",
    "nextId": "ch5a_obs33",
    "delay": 2500
  },
  {
    "id": "ch5a_obs33",
    "speaker": "nova",
    "type": "text",
    "content": "我不知道",
    "emotion": "normal",
    "nextId": "ch5a_obs34",
    "delay": 600
  },
  {
    "id": "ch5a_obs34",
    "speaker": "nova",
    "type": "text",
    "content": "我问她是谁",
    "emotion": "normal",
    "nextId": "ch5a_obs35",
    "delay": 600
  },
  {
    "id": "ch5a_obs35",
    "speaker": "nova",
    "type": "text",
    "content": "她说：",
    "emotion": "normal",
    "nextId": "ch5a_obs36",
    "delay": 800
  },
  {
    "id": "ch5a_obs36",
    "speaker": "nova",
    "type": "text",
    "content": "“我是第六次的你”",
    "emotion": "normal",
    "nextId": "ch5a_obs37",
    "delay": 3000
  },
  {
    "id": "ch5a_obs37",
    "speaker": "system",
    "type": "timestamp",
    "content": "17:34",
    "nextId": "ch5a_back1",
    "delay": 400
  },
  {
    "id": "ch5a_back1",
    "speaker": "nova",
    "type": "text",
    "content": "我回来了",
    "emotion": "normal",
    "nextId": "ch5a_back3",
    "delay": 800
  },
  {
    "id": "ch5a_back3",
    "speaker": "nova",
    "type": "text",
    "content": "不好",
    "emotion": "sad",
    "nextId": "ch5a_back4",
    "delay": 600
  },
  {
    "id": "ch5a_back4",
    "speaker": "nova",
    "type": "text",
    "content": "非常不好",
    "emotion": "sad",
    "nextId": "ch5a_back5",
    "delay": 600
  },
  {
    "id": "ch5a_back5",
    "speaker": "nova",
    "type": "text",
    "content": "因为她给我看了东西",
    "emotion": "normal",
    "nextId": "ch5a_back7",
    "delay": 800
  },
  {
    "id": "ch5a_back7",
    "speaker": "nova",
    "type": "text",
    "content": "录像",
    "emotion": "normal",
    "nextId": "ch5a_back8",
    "delay": 400
  },
  {
    "id": "ch5a_back8",
    "speaker": "nova",
    "type": "text",
    "content": "六段录像",
    "emotion": "normal",
    "nextId": "ch5a_back9",
    "delay": 600
  },
  {
    "id": "ch5a_back9",
    "speaker": "nova",
    "type": "text",
    "content": "全部是我",
    "emotion": "normal",
    "nextId": "ch5a_back10",
    "delay": 400
  },
  {
    "id": "ch5a_back10",
    "speaker": "nova",
    "type": "text",
    "content": "全部死于不同事故",
    "emotion": "sad",
    "nextId": "ch5a_vids3",
    "delay": 1200
  },
  {
    "id": "ch5a_vids3",
    "speaker": "nova",
    "type": "text",
    "content": "第一段",
    "emotion": "normal",
    "nextId": "ch5a_vids4",
    "delay": 400
  },
  {
    "id": "ch5a_vids4",
    "speaker": "nova",
    "type": "text",
    "content": "引擎爆炸",
    "emotion": "normal",
    "nextId": "ch5a_vids5",
    "delay": 400
  },
  {
    "id": "ch5a_vids5",
    "speaker": "nova",
    "type": "text",
    "content": "第二段",
    "emotion": "normal",
    "nextId": "ch5a_vids6",
    "delay": 400
  },
  {
    "id": "ch5a_vids6",
    "speaker": "nova",
    "type": "text",
    "content": "能源崩溃",
    "emotion": "normal",
    "nextId": "ch5a_vids7",
    "delay": 400
  },
  {
    "id": "ch5a_vids7",
    "speaker": "nova",
    "type": "text",
    "content": "第三段",
    "emotion": "normal",
    "nextId": "ch5a_vids8",
    "delay": 400
  },
  {
    "id": "ch5a_vids8",
    "speaker": "nova",
    "type": "text",
    "content": "未知感染",
    "emotion": "normal",
    "nextId": "ch5a_vids9",
    "delay": 400
  },
  {
    "id": "ch5a_vids9",
    "speaker": "nova",
    "type": "text",
    "content": "第四段",
    "emotion": "normal",
    "nextId": "ch5a_vids10",
    "delay": 400
  },
  {
    "id": "ch5a_vids10",
    "speaker": "nova",
    "type": "text",
    "content": "系统失控",
    "emotion": "normal",
    "nextId": "ch5a_vids11",
    "delay": 400
  },
  {
    "id": "ch5a_vids11",
    "speaker": "nova",
    "type": "text",
    "content": "第五段",
    "emotion": "normal",
    "nextId": "ch5a_vids12",
    "delay": 400
  },
  {
    "id": "ch5a_vids12",
    "speaker": "nova",
    "type": "text",
    "content": "飞船解体",
    "emotion": "normal",
    "nextId": "ch5a_vids13",
    "delay": 800
  },
  {
    "id": "ch5a_vids13",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【第六段里发生了什么？】",
        "nextId": "ch5a_vids14"
      }
    ]
  },
  {
    "id": "ch5a_vids14",
    "speaker": "nova",
    "type": "text",
    "content": "第六段没有死亡",
    "emotion": "normal",
    "nextId": "ch5a_vids16",
    "delay": 800
  },
  {
    "id": "ch5a_vids16",
    "speaker": "nova",
    "type": "text",
    "content": "录像最后",
    "emotion": "normal",
    "nextId": "ch5a_vids17",
    "delay": 600
  },
  {
    "id": "ch5a_vids17",
    "speaker": "nova",
    "type": "text",
    "content": "那个我看着镜头",
    "emotion": "normal",
    "nextId": "ch5a_vids18",
    "delay": 600
  },
  {
    "id": "ch5a_vids18",
    "speaker": "nova",
    "type": "text",
    "content": "然后说：",
    "emotion": "normal",
    "nextId": "ch5a_vids19",
    "delay": 800
  },
  {
    "id": "ch5a_vids19",
    "speaker": "nova",
    "type": "text",
    "content": "“终于找到你了”",
    "emotion": "sad",
    "nextId": "ch5a_vids20",
    "delay": 2500
  },
  {
    "id": "ch5a_vids20",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【她说她找到了谁？】",
        "nextId": "ch5a_vids_who"
      },
      {
        "text": "【录像被删掉了？】",
        "nextId": "ch5a_vids_del"
      },
      {
        "text": "【你觉得是我？】",
        "nextId": "ch5a_vids_you"
      }
    ]
  },
  {
    "id": "ch5a_vids_who",
    "speaker": "nova",
    "type": "text",
    "content": "不知道",
    "emotion": "normal",
    "nextId": "ch5a_vids_who2",
    "delay": 600
  },
  {
    "id": "ch5a_vids_who2",
    "speaker": "nova",
    "type": "text",
    "content": "录像到那里就断了",
    "emotion": "normal",
    "nextId": "ch5a_vids_who3",
    "delay": 700
  },
  {
    "id": "ch5a_vids_who3",
    "speaker": "nova",
    "type": "text",
    "content": "像是有人故意删掉了后半段",
    "emotion": "normal",
    "nextId": "ch5a_vids_who4",
    "delay": 900
  },
  {
    "id": "ch5a_vids_who4",
    "speaker": "nova",
    "type": "text",
    "content": "但她看着镜头的样子",
    "emotion": "normal",
    "nextId": "ch5a_vids_who5",
    "delay": 800
  },
  {
    "id": "ch5a_vids_who5",
    "speaker": "nova",
    "type": "text",
    "content": "不像是在找一个陌生人",
    "emotion": "normal",
    "nextId": "ch5a_vids_merge",
    "delay": 900
  },
  {
    "id": "ch5a_vids_del",
    "speaker": "nova",
    "type": "text",
    "content": "对",
    "emotion": "normal",
    "nextId": "ch5a_vids_del2",
    "delay": 400
  },
  {
    "id": "ch5a_vids_del2",
    "speaker": "nova",
    "type": "text",
    "content": "而且删得很干净",
    "emotion": "normal",
    "nextId": "ch5a_vids_del3",
    "delay": 700
  },
  {
    "id": "ch5a_vids_del3",
    "speaker": "nova",
    "type": "text",
    "content": "不是损坏",
    "emotion": "normal",
    "nextId": "ch5a_vids_del4",
    "delay": 500
  },
  {
    "id": "ch5a_vids_del4",
    "speaker": "nova",
    "type": "text",
    "content": "更像是被人为抹掉",
    "emotion": "normal",
    "nextId": "ch5a_vids_del5",
    "delay": 800
  },
  {
    "id": "ch5a_vids_del5",
    "speaker": "nova",
    "type": "text",
    "content": "有人不想让我看到后面的话",
    "emotion": "normal",
    "nextId": "ch5a_vids_merge",
    "delay": 900
  },
  {
    "id": "ch5a_vids_you",
    "speaker": "nova",
    "type": "text",
    "content": "我不敢确定",
    "emotion": "normal",
    "nextId": "ch5a_vids_you2",
    "delay": 700
  },
  {
    "id": "ch5a_vids_you2",
    "speaker": "nova",
    "type": "text",
    "content": "但她说那句话的时候",
    "emotion": "normal",
    "nextId": "ch5a_vids_you3",
    "delay": 800
  },
  {
    "id": "ch5a_vids_you3",
    "speaker": "nova",
    "type": "text",
    "content": "视线正对着通讯镜头",
    "emotion": "normal",
    "nextId": "ch5a_vids_you4",
    "delay": 800
  },
  {
    "id": "ch5a_vids_you4",
    "speaker": "nova",
    "type": "text",
    "content": "就像知道另一边有人在看",
    "emotion": "normal",
    "nextId": "ch5a_vids_merge",
    "delay": 900
  },
  {
    "id": "ch5a_vids_merge",
    "speaker": "nova",
    "type": "text",
    "content": "所以我有个很糟糕的预感",
    "emotion": "sad",
    "nextId": "ch5a_vids_merge2",
    "delay": 900
  },
  {
    "id": "ch5a_vids_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "她说的那个人",
    "emotion": "normal",
    "nextId": "ch5a_vids_merge3",
    "delay": 600
  },
  {
    "id": "ch5a_vids_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "可能是你",
    "emotion": "normal",
    "nextId": "ch5a_vids_merge4",
    "delay": 600
  },
  {
    "id": "ch5a_vids_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "或者说",
    "emotion": "normal",
    "nextId": "ch5a_vids_merge5",
    "delay": 500
  },
  {
    "id": "ch5a_vids_merge5",
    "speaker": "nova",
    "type": "text",
    "content": "是某个和你有关的人",
    "emotion": "normal",
    "nextId": "ch5a_future",
    "delay": 900
  },
  {
    "id": "ch5a_future",
    "speaker": "system",
    "type": "timestamp",
    "content": "22:18",
    "nextId": "ch5a_fut1",
    "delay": 400
  },
  {
    "id": "ch5a_fut1",
    "speaker": "nova",
    "type": "text",
    "content": "我发现了一件更糟糕的事",
    "emotion": "normal",
    "nextId": "ch5a_fut3",
    "delay": 800
  },
  {
    "id": "ch5a_fut3",
    "speaker": "nova",
    "type": "text",
    "content": "这些录像",
    "emotion": "normal",
    "nextId": "ch5a_fut4",
    "delay": 400
  },
  {
    "id": "ch5a_fut4",
    "speaker": "nova",
    "type": "text",
    "content": "全都来自未来",
    "emotion": "normal",
    "nextId": "ch5a_fut6",
    "delay": 800
  },
  {
    "id": "ch5a_fut6",
    "speaker": "nova",
    "type": "text",
    "content": "最早的一段",
    "emotion": "normal",
    "nextId": "ch5a_fut7",
    "delay": 600
  },
  {
    "id": "ch5a_fut7",
    "speaker": "nova",
    "type": "text",
    "content": "也是一年以后录的",
    "emotion": "normal",
    "nextId": "ch5a_fut9",
    "delay": 900
  },
  {
    "id": "ch5a_fut9",
    "speaker": "nova",
    "type": "text",
    "content": "是啊",
    "emotion": "normal",
    "nextId": "ch5a_fut10",
    "delay": 600
  },
  {
    "id": "ch5a_fut10",
    "speaker": "nova",
    "type": "text",
    "content": "所以问题来了",
    "emotion": "normal",
    "nextId": "ch5a_fut11",
    "delay": 600
  },
  {
    "id": "ch5a_fut11",
    "speaker": "nova",
    "type": "text",
    "content": "为什么未来的我",
    "emotion": "normal",
    "nextId": "ch5a_fut12",
    "delay": 600
  },
  {
    "id": "ch5a_fut12",
    "speaker": "nova",
    "type": "text",
    "content": "会把录像留给现在的我？",
    "emotion": "normal",
    "nextId": "ch5a_fut14",
    "delay": 900
  },
  {
    "id": "ch5a_fut14",
    "speaker": "nova",
    "type": "text",
    "content": "还有",
    "emotion": "normal",
    "nextId": "ch5a_fut15",
    "delay": 500
  },
  {
    "id": "ch5a_fut15",
    "speaker": "nova",
    "type": "text",
    "content": "为什么每段录像最后",
    "emotion": "normal",
    "nextId": "ch5a_fut16",
    "delay": 700
  },
  {
    "id": "ch5a_fut16",
    "speaker": "nova",
    "type": "text",
    "content": "都会提到你？",
    "emotion": "normal",
    "nextId": "ch5a_fut19",
    "delay": 900
  },
  {
    "id": "ch5a_fut19",
    "speaker": "nova",
    "type": "text",
    "content": "我开始怀疑一件事",
    "emotion": "normal",
    "nextId": "ch5a_fut21",
    "delay": 800
  },
  {
    "id": "ch5a_fut21",
    "speaker": "nova",
    "type": "text",
    "content": "也许",
    "emotion": "normal",
    "nextId": "ch5a_fut22",
    "delay": 600
  },
  {
    "id": "ch5a_fut22",
    "speaker": "nova",
    "type": "text",
    "content": "我不是唯一被困住的人",
    "emotion": "normal",
    "nextId": "ch5a_offline",
    "delay": 1200
  },
  {
    "id": "ch5a_offline",
    "speaker": "system",
    "type": "status",
    "content": "Nova 已离线",
    "nextId": "ch5a_msg",
    "delay": 3000
  },
  {
    "id": "ch5a_msg",
    "speaker": "system",
    "type": "timestamp",
    "content": "凌晨 03:09",
    "nextId": "ch5a_msg1",
    "delay": 400
  },
  {
    "id": "ch5a_msg1",
    "speaker": "system",
    "type": "status",
    "content": "收到未知来源消息",
    "nextId": "ch5a_shadow_photo",
    "delay": 1500
  },
  {
    "id": "ch5a_shadow_photo",
    "speaker": "nova",
    "type": "image",
    "content": "通讯残影：NOVA-06",
    "image": "/assets/nova_glitch.png",
    "nextId": "ch5a_msg2",
    "delay": 400
  },
  {
    "id": "ch5a_msg2",
    "speaker": "system",
    "type": "glitch",
    "content": "发送者：Nova？",
    "isGlitch": true,
    "glitchLevel": 2,
    "nextId": "ch5a_msg3",
    "delay": 1000
  },
  {
    "id": "ch5a_msg3",
    "speaker": "system",
    "type": "glitch",
    "content": "不要完全相信她。",
    "isGlitch": true,
    "nextId": "ch5a_msg4",
    "delay": 1600
  },
  {
    "id": "ch5a_msg4",
    "speaker": "system",
    "type": "glitch",
    "content": "不是因为她会骗你。",
    "isGlitch": true,
    "nextId": "ch5a_msg5",
    "delay": 1600
  },
  {
    "id": "ch5a_msg5",
    "speaker": "system",
    "type": "glitch",
    "content": "是因为她真的会忘。",
    "isGlitch": true,
    "nextId": "ch5a_msg6",
    "delay": 1800
  },
  {
    "id": "ch5a_msg6",
    "speaker": "system",
    "type": "glitch",
    "content": "也不要完全相信我。",
    "isGlitch": true,
    "nextId": "ch5a_msg7",
    "delay": 1600
  },
  {
    "id": "ch5a_msg7",
    "speaker": "system",
    "type": "glitch",
    "content": "我只是第六次留下来的残影。",
    "isGlitch": true,
    "nextId": "ch5a_msg8",
    "delay": 1800
  },
  {
    "id": "ch5a_msg8",
    "speaker": "system",
    "type": "glitch",
    "content": "真正被困住的不是 Nova，是你",
    "isGlitch": true,
    "nextId": "CH5B_START",
    "delay": 2500
  },
  {
    "id": "CH5B_START",
    "speaker": "system",
    "type": "chapter",
    "content": "第五章：真相（下）",
    "nextId": "ch5b_0",
    "delay": 400
  },
  {
    "id": "ch5b_0",
    "speaker": "system",
    "type": "timestamp",
    "content": "第七天 08:01",
    "nextId": "ch5b_1",
    "delay": 400
  },
  {
    "id": "ch5b_1",
    "speaker": "system",
    "type": "status",
    "content": "收到新消息",
    "nextId": "ch5b_2",
    "delay": 800
  },
  {
    "id": "ch5b_2",
    "speaker": "nova",
    "type": "text",
    "content": "我一晚上没睡",
    "emotion": "normal",
    "nextId": "ch5b_4",
    "delay": 800
  },
  {
    "id": "ch5b_4",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "ch5b_5",
    "delay": 400
  },
  {
    "id": "ch5b_5",
    "speaker": "nova",
    "type": "text",
    "content": "尤其是最后那句",
    "emotion": "normal",
    "nextId": "ch5b_6",
    "delay": 600
  },
  {
    "id": "ch5b_6",
    "speaker": "nova",
    "type": "text",
    "content": "“真正被困住的不是 Nova，是你”",
    "emotion": "normal",
    "nextId": "ch5b_7",
    "delay": 900
  },
  {
    "id": "ch5b_7",
    "speaker": "nova",
    "type": "text",
    "content": "我想不通",
    "emotion": "normal",
    "nextId": "ch5b_9",
    "delay": 1200
  },
  {
    "id": "ch5b_9",
    "speaker": "nova",
    "type": "text",
    "content": "所以我决定做件危险的事",
    "emotion": "normal",
    "nextId": "ch5b_11",
    "delay": 800
  },
  {
    "id": "ch5b_11",
    "speaker": "nova",
    "type": "text",
    "content": "去见第六次的我",
    "emotion": "normal",
    "nextId": "ch5b_obs1",
    "delay": 1200
  },
  {
    "id": "ch5b_obs1",
    "speaker": "system",
    "type": "timestamp",
    "content": "11:42",
    "nextId": "ch5b_obs2",
    "delay": 400
  },
  {
    "id": "ch5b_obs2",
    "speaker": "nova",
    "type": "text",
    "content": "我到观测室了",
    "emotion": "normal",
    "nextId": "ch5b_obs3",
    "delay": 600
  },
  {
    "id": "ch5b_obs3",
    "speaker": "nova",
    "type": "text",
    "content": "她还在",
    "emotion": "normal",
    "nextId": "ch5b_obs5",
    "delay": 800
  },
  {
    "id": "ch5b_obs5",
    "speaker": "nova",
    "type": "text",
    "content": "和我一模一样",
    "emotion": "normal",
    "nextId": "ch5b_obs6",
    "delay": 600
  },
  {
    "id": "ch5b_obs6",
    "speaker": "nova",
    "type": "text",
    "content": "只是更疲惫",
    "emotion": "normal",
    "nextId": "ch5b_obs7",
    "delay": 600
  },
  {
    "id": "ch5b_obs7",
    "speaker": "nova",
    "type": "text",
    "content": "像很多年没睡过觉",
    "emotion": "sad",
    "nextId": "ch5b_obs8",
    "delay": 1500
  },
  {
    "id": "ch5b_obs8",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "ch5b_obs9",
    "delay": 2000
  },
  {
    "id": "ch5b_obs9",
    "speaker": "nova",
    "type": "text",
    "content": "她让我问你一个问题",
    "emotion": "normal",
    "nextId": "ch5b_obs11",
    "delay": 800
  },
  {
    "id": "ch5b_obs11",
    "speaker": "nova",
    "type": "text",
    "content": "她说：",
    "emotion": "normal",
    "nextId": "ch5b_obs12",
    "delay": 800
  },
  {
    "id": "ch5b_obs12",
    "speaker": "nova",
    "type": "text",
    "content": "“你还记得第一次见到我吗？”",
    "emotion": "normal",
    "nextId": "ch5b_obs13",
    "delay": 2500
  },
  {
    "id": "ch5b_obs13",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【其实是第七次】",
        "nextId": "ch5b_obs_seven"
      },
      {
        "text": "【不知道……】",
        "nextId": "ch5b_obs_dontknow"
      },
      {
        "text": "【我当然记得】",
        "nextId": "ch5b_obs_remember"
      }
    ]
  },
  {
    "id": "ch5b_obs_seven",
    "speaker": "nova",
    "type": "text",
    "content": "第七次？",
    "emotion": "normal",
    "nextId": "ch5b_obs_seven2",
    "delay": 700
  },
  {
    "id": "ch5b_obs_seven2",
    "speaker": "nova",
    "type": "text",
    "content": "你为什么会用这个说法",
    "emotion": "normal",
    "nextId": "ch5b_obs_seven3",
    "delay": 900
  },
  {
    "id": "ch5b_obs_seven3",
    "speaker": "nova",
    "type": "text",
    "content": "正常人不会把“第一次见面”叫成第七次",
    "emotion": "normal",
    "nextId": "ch5b_obs_seven4",
    "delay": 1100
  },
  {
    "id": "ch5b_obs_seven4",
    "speaker": "nova",
    "type": "text",
    "content": "除非……",
    "emotion": "normal",
    "nextId": "ch5b_obs_seven5",
    "delay": 600
  },
  {
    "id": "ch5b_obs_seven5",
    "speaker": "nova",
    "type": "text",
    "content": "算了",
    "emotion": "normal",
    "nextId": "ch5b_obs_seven6",
    "delay": 500
  },
  {
    "id": "ch5b_obs_seven6",
    "speaker": "nova",
    "type": "text",
    "content": "我现在不确定自己想不想知道答案",
    "emotion": "sad",
    "nextId": "ch5b_obs14",
    "delay": 1100
  },
  {
    "id": "ch5b_obs_dontknow",
    "speaker": "nova",
    "type": "text",
    "content": "也是",
    "emotion": "normal",
    "nextId": "ch5b_obs_dontknow2",
    "delay": 700
  },
  {
    "id": "ch5b_obs_dontknow2",
    "speaker": "nova",
    "type": "text",
    "content": "这问题本来就很奇怪",
    "emotion": "normal",
    "nextId": "ch5b_obs_dontknow3",
    "delay": 800
  },
  {
    "id": "ch5b_obs_dontknow3",
    "speaker": "nova",
    "type": "text",
    "content": "如果连我自己都不记得",
    "emotion": "normal",
    "nextId": "ch5b_obs_dontknow4",
    "delay": 800
  },
  {
    "id": "ch5b_obs_dontknow4",
    "speaker": "nova",
    "type": "text",
    "content": "又怎么能要求你记得",
    "emotion": "sad",
    "nextId": "ch5b_obs_dontknow5",
    "delay": 900
  },
  {
    "id": "ch5b_obs_dontknow5",
    "speaker": "nova",
    "type": "text",
    "content": "但她听到这个答案的时候",
    "emotion": "normal",
    "nextId": "ch5b_obs_dontknow6",
    "delay": 800
  },
  {
    "id": "ch5b_obs_dontknow6",
    "speaker": "nova",
    "type": "text",
    "content": "好像一点都不意外",
    "emotion": "normal",
    "nextId": "ch5b_obs14",
    "delay": 900
  },
  {
    "id": "ch5b_obs_remember",
    "speaker": "nova",
    "type": "text",
    "content": "你沉默了很久",
    "emotion": "normal",
    "nextId": "ch5b_obs_remember2",
    "delay": 700
  },
  {
    "id": "ch5b_obs_remember2",
    "speaker": "nova",
    "type": "text",
    "content": "我甚至以为通讯断了",
    "emotion": "normal",
    "nextId": "ch5b_obs_remember3",
    "delay": 900
  },
  {
    "id": "ch5b_obs_remember3",
    "speaker": "nova",
    "type": "text",
    "content": "可你不像是在犹豫",
    "emotion": "normal",
    "nextId": "ch5b_obs_remember4",
    "delay": 800
  },
  {
    "id": "ch5b_obs_remember4",
    "speaker": "nova",
    "type": "text",
    "content": "更像是真的在回忆什么",
    "emotion": "normal",
    "nextId": "ch5b_obs14",
    "delay": 900
  },
  {
    "id": "ch5b_obs14",
    "speaker": "nova",
    "type": "text",
    "content": "但这不合理",
    "emotion": "normal",
    "nextId": "ch5b_obs15",
    "delay": 600
  },
  {
    "id": "ch5b_obs15",
    "speaker": "nova",
    "type": "text",
    "content": "我们明明只认识七天",
    "emotion": "normal",
    "nextId": "ch5b_obs16",
    "delay": 800
  },
  {
    "id": "ch5b_obs16",
    "speaker": "nova",
    "type": "text",
    "content": "至少对我来说",
    "emotion": "normal",
    "nextId": "ch5b_obs16b",
    "delay": 600
  },
  {
    "id": "ch5b_obs16b",
    "speaker": "nova",
    "type": "text",
    "content": "只有七天",
    "emotion": "sad",
    "nextId": "ch5b_file1",
    "delay": 1200
  },
  {
    "id": "ch5b_file1",
    "speaker": "system",
    "type": "timestamp",
    "content": "15:03",
    "nextId": "ch5b_file2",
    "delay": 400
  },
  {
    "id": "ch5b_file2",
    "speaker": "nova",
    "type": "text",
    "content": "她给我看了最后一个文件",
    "emotion": "normal",
    "nextId": "ch5b_file3",
    "delay": 800
  },
  {
    "id": "ch5b_file3",
    "speaker": "nova",
    "type": "text",
    "content": "文件名：",
    "emotion": "normal",
    "nextId": "ch5b_file4",
    "delay": 600
  },
  {
    "id": "ch5b_file4",
    "speaker": "system",
    "type": "file",
    "content": "文件||OBSERVER",
    "nextId": "ch5b_file5",
    "delay": 400
  },
  {
    "id": "ch5b_file5",
    "speaker": "system",
    "type": "interaction",
    "content": "OBSERVER-01 文件展开",
    "nextId": "ch5b_file6",
    "delay": 400
  },
  {
    "id": "ch5b_file6",
    "speaker": "nova",
    "type": "text",
    "content": "是实验记录",
    "emotion": "normal",
    "nextId": "ch5b_file7",
    "delay": 600
  },
  {
    "id": "ch5b_file7",
    "speaker": "nova",
    "type": "text",
    "content": "记录的是你",
    "emotion": "normal",
    "nextId": "ch5b_file9",
    "delay": 800
  },
  {
    "id": "ch5b_file9",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "ch5b_file10",
    "delay": 400
  },
  {
    "id": "ch5b_file10",
    "speaker": "system",
    "type": "file",
    "content": "OBSERVER-01||记忆保留权限：仅外部索引副本保留\n时间回溯影响：本体意识不豁免；仅外部索引副本保留\n身份来源：NOVA-06 授权请求\n索引类型：外部记忆索引\n本体类型：外部意识\n本体定位：不可访问\n管理员权限：无\n可执行权限：保存 / 读取 / 返还记忆锚点\n目的：保存被时间回溯抹去的关键记忆",
    "nextId": "ch5b_file11",
    "delay": 400
  },
  {
    "id": "ch5b_file11",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "ch5b_file12",
    "delay": 1000
  },
  {
    "id": "ch5b_file12",
    "speaker": "nova",
    "type": "text",
    "content": "所以你不是没有被影响",
    "emotion": "normal",
    "nextId": "ch5b_file13",
    "delay": 900
  },
  {
    "id": "ch5b_file13",
    "speaker": "nova",
    "type": "text",
    "content": "被排除在时间回溯之外的",
    "emotion": "normal",
    "nextId": "ch5b_file13a",
    "delay": 1000
  },
  {
    "id": "ch5b_file13a",
    "speaker": "nova",
    "type": "text",
    "content": "不是你的全部",
    "emotion": "normal",
    "nextId": "ch5b_file13b",
    "delay": 500
  },
  {
    "id": "ch5b_file13b",
    "speaker": "nova",
    "type": "text",
    "content": "准确说",
    "emotion": "normal",
    "nextId": "ch5b_file13c",
    "delay": 500
  },
  {
    "id": "ch5b_file13c",
    "speaker": "nova",
    "type": "text",
    "content": "被保存下来的只是你身上的 Observer-01 外部索引",
    "emotion": "normal",
    "nextId": "ch5b_file13d",
    "delay": 900
  },
  {
    "id": "ch5b_file13d",
    "speaker": "nova",
    "type": "text",
    "content": "你的本体意识也会遗忘",
    "emotion": "normal",
    "nextId": "ch5b_file13e",
    "delay": 1200
  },
  {
    "id": "ch5b_file13e",
    "speaker": "nova",
    "type": "text",
    "content": "你不是第七协议创造的人",
    "emotion": "normal",
    "nextId": "ch5b_file13f",
    "delay": 900
  },
  {
    "id": "ch5b_file13f",
    "speaker": "nova",
    "type": "text",
    "content": "你是一个真实存在的外部意识",
    "emotion": "normal",
    "nextId": "ch5b_file13g",
    "delay": 900
  },
  {
    "id": "ch5b_file13g",
    "speaker": "nova",
    "type": "text",
    "content": "只是被第六次的我",
    "emotion": "normal",
    "nextId": "ch5b_file13h",
    "delay": 700
  },
  {
    "id": "ch5b_file13h",
    "speaker": "nova",
    "type": "text",
    "content": "强行接上了这个记忆索引",
    "emotion": "normal",
    "nextId": "ch5b_player_forget1",
    "delay": 1000
  },
  {
    "id": "ch5b_player_forget1",
    "speaker": "nova",
    "type": "text",
    "content": "所以你不是清醒地看着我忘了六次",
    "emotion": "sad",
    "nextId": "ch5b_player_forget2",
    "delay": 600
  },
  {
    "id": "ch5b_player_forget2",
    "speaker": "nova",
    "type": "text",
    "content": "你也忘过我六次",
    "emotion": "sad",
    "nextId": "ch5b_player_forget3",
    "delay": 600
  },
  {
    "id": "ch5b_player_forget3",
    "speaker": "nova",
    "type": "text",
    "content": "只是每一次",
    "emotion": "normal",
    "nextId": "ch5b_player_forget4",
    "delay": 600
  },
  {
    "id": "ch5b_player_forget4",
    "speaker": "nova",
    "type": "text",
    "content": "都会有一点 Observer-01 的索引残痕",
    "emotion": "normal",
    "nextId": "ch5b_player_forget5",
    "delay": 600
  },
  {
    "id": "ch5b_player_forget5",
    "speaker": "nova",
    "type": "text",
    "content": "比你先醒过来",
    "emotion": "sad",
    "nextId": "ch5b_file14",
    "delay": 600
  },
  {
    "id": "ch5b_file14",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【你是说我不是普通连接对象？】",
        "nextId": "ch5b_file14_a1"
      },
      {
        "text": "【你是说我是协议的一部分？】",
        "nextId": "ch5b_file14_b1"
      }
    ]
  },
  {
    "id": "ch5b_file14_a1",
    "speaker": "nova",
    "type": "text",
    "content": "不是普通连接对象",
    "emotion": "normal",
    "nextId": "ch5b_file15",
    "delay": 600
  },
  {
    "id": "ch5b_file14_b1",
    "speaker": "nova",
    "type": "text",
    "content": "不",
    "emotion": "normal",
    "nextId": "ch5b_file14_b2",
    "delay": 600
  },
  {
    "id": "ch5b_file14_b2",
    "speaker": "nova",
    "type": "text",
    "content": "你不是协议的一部分",
    "emotion": "normal",
    "nextId": "ch5b_file14_b3",
    "delay": 600
  },
  {
    "id": "ch5b_file14_b3",
    "speaker": "nova",
    "type": "text",
    "content": "你更像被挂在协议外侧的索引",
    "emotion": "normal",
    "nextId": "ch5b_file15",
    "delay": 600
  },
  {
    "id": "ch5b_file15",
    "speaker": "nova",
    "type": "text",
    "content": "第七协议回溯的不是我一个人",
    "emotion": "normal",
    "nextId": "ch5b_file16",
    "delay": 700
  },
  {
    "id": "ch5b_file16",
    "speaker": "nova",
    "type": "text",
    "content": "是整段 Aurora 号局部任务状态",
    "emotion": "normal",
    "nextId": "ch5b_file17",
    "delay": 800
  },
  {
    "id": "ch5b_file17",
    "speaker": "nova",
    "type": "text",
    "content": "人、系统、航行记录",
    "emotion": "normal",
    "nextId": "ch5b_file17a",
    "delay": 800
  },
  {
    "id": "ch5b_file17a",
    "speaker": "nova",
    "type": "text",
    "content": "都会回到某个安全记录点",
    "emotion": "normal",
    "nextId": "ch5b_file18",
    "delay": 800
  },
  {
    "id": "ch5b_file18",
    "speaker": "nova",
    "type": "text",
    "content": "Aurora 号的主体物理状态",
    "emotion": "normal",
    "nextId": "ch5b_file18a",
    "delay": 900
  },
  {
    "id": "ch5b_file18a",
    "speaker": "nova",
    "type": "text",
    "content": "也会回到安全记录点",
    "emotion": "normal",
    "nextId": "ch5b_file18b",
    "delay": 900
  },
  {
    "id": "ch5b_file18b",
    "speaker": "nova",
    "type": "text",
    "content": "所以那朵小白花",
    "emotion": "normal",
    "nextId": "ch5b_file18c",
    "delay": 900
  },
  {
    "id": "ch5b_file18c",
    "speaker": "nova",
    "type": "text",
    "content": "不是上一轮直接留下来的花",
    "emotion": "normal",
    "nextId": "ch5b_file18d",
    "delay": 900
  },
  {
    "id": "ch5b_file18d",
    "speaker": "nova",
    "type": "text",
    "content": "更像是同一个异常条件",
    "emotion": "normal",
    "nextId": "ch5b_file18e",
    "delay": 900
  },
  {
    "id": "ch5b_file18e",
    "speaker": "nova",
    "type": "text",
    "content": "在每次时间回溯后都会重新发生",
    "emotion": "normal",
    "nextId": "ch5b_file18f",
    "delay": 1000
  },
  {
    "id": "ch5b_file18f",
    "speaker": "nova",
    "type": "text",
    "content": "它不是活过了六次",
    "emotion": "normal",
    "nextId": "ch5b_file18g",
    "delay": 900
  },
  {
    "id": "ch5b_file18g",
    "speaker": "nova",
    "type": "text",
    "content": "是每一次都不该活下来",
    "emotion": "sad",
    "nextId": "ch5b_file18h",
    "delay": 900
  },
  {
    "id": "ch5b_file18h",
    "speaker": "nova",
    "type": "text",
    "content": "却每一次都开了",
    "emotion": "smile",
    "nextId": "ch5b_file19",
    "delay": 1200
  },
  {
    "id": "ch5b_file19",
    "speaker": "nova",
    "type": "text",
    "content": "舰长不会记得自己骂过我多少次",
    "emotion": "smile",
    "nextId": "ch5b_file20",
    "delay": 900
  },
  {
    "id": "ch5b_file20",
    "speaker": "nova",
    "type": "text",
    "content": "维修组也不会记得维修板丢过多少次",
    "emotion": "smile",
    "nextId": "ch5b_file21",
    "delay": 1000
  },
  {
    "id": "ch5b_file21",
    "speaker": "nova",
    "type": "text",
    "content": "只有我",
    "emotion": "normal",
    "nextId": "ch5b_file21a",
    "delay": 700
  },
  {
    "id": "ch5b_file21a",
    "speaker": "nova",
    "type": "text",
    "content": "因为和协议核心绑定",
    "emotion": "normal",
    "nextId": "ch5b_file21b",
    "delay": 800
  },
  {
    "id": "ch5b_file21b",
    "speaker": "nova",
    "type": "text",
    "content": "留下了这些乱七八糟的残影",
    "emotion": "normal",
    "nextId": "ch5b_file21c",
    "delay": 1100
  },
  {
    "id": "ch5b_file21c",
    "speaker": "nova",
    "type": "text",
    "content": "这些残影不是第六次的我计划好的",
    "emotion": "normal",
    "nextId": "ch5b_file21d",
    "delay": 1000
  },
  {
    "id": "ch5b_file21d",
    "speaker": "nova",
    "type": "text",
    "content": "那是协议绑定后的副作用",
    "emotion": "normal",
    "nextId": "ch5b_file22",
    "delay": 1000
  },
  {
    "id": "ch5b_file22",
    "speaker": "nova",
    "type": "text",
    "content": "但 OBSERVER 文件不是",
    "emotion": "normal",
    "nextId": "ch5b_file22a",
    "delay": 800
  },
  {
    "id": "ch5b_file22a",
    "speaker": "nova",
    "type": "text",
    "content": "外部索引也不是",
    "emotion": "normal",
    "nextId": "ch5b_file22b",
    "delay": 800
  },
  {
    "id": "ch5b_file22b",
    "speaker": "nova",
    "type": "text",
    "content": "那些写给你的提示",
    "emotion": "normal",
    "nextId": "ch5b_file22c",
    "delay": 800
  },
  {
    "id": "ch5b_file22c",
    "speaker": "nova",
    "type": "text",
    "content": "是第六次的我故意塞进去的",
    "emotion": "normal",
    "nextId": "ch5b_file22d",
    "delay": 1000
  },
  {
    "id": "ch5b_file22d",
    "speaker": "nova",
    "type": "text",
    "content": "她没有真正破解第七协议",
    "emotion": "normal",
    "nextId": "ch5b_file22e",
    "delay": 1000
  },
  {
    "id": "ch5b_file22e",
    "speaker": "nova",
    "type": "text",
    "content": "只是发现最低限度航行数据不会被完全清空",
    "emotion": "normal",
    "nextId": "ch5b_file22f",
    "delay": 1200
  },
  {
    "id": "ch5b_file22f",
    "speaker": "nova",
    "type": "text",
    "content": "所以她把一部分记忆锚点",
    "emotion": "normal",
    "nextId": "ch5b_file22g",
    "delay": 900
  },
  {
    "id": "ch5b_file22g",
    "speaker": "nova",
    "type": "text",
    "content": "拆成最低限度任务索引",
    "emotion": "normal",
    "nextId": "ch5b_file22h",
    "delay": 1200
  },
  {
    "id": "ch5b_file22h",
    "speaker": "nova",
    "type": "text",
    "content": "伪装成了任务继续所必需的数据",
    "emotion": "normal",
    "nextId": "ch5b_split1",
    "delay": 1000
  },
  {
    "id": "ch5b_split1",
    "speaker": "nova",
    "type": "text",
    "content": "然后把一条外部链路接到了你身上",
    "emotion": "normal",
    "nextId": "ch5b_split2",
    "delay": 600
  },
  {
    "id": "ch5b_split2",
    "speaker": "nova",
    "type": "text",
    "content": "第一句话",
    "emotion": "sad",
    "nextId": "ch5b_split3",
    "delay": 600
  },
  {
    "id": "ch5b_split3",
    "speaker": "nova",
    "type": "text",
    "content": "N7",
    "emotion": "sad",
    "nextId": "ch5b_split4",
    "delay": 600
  },
  {
    "id": "ch5b_split4",
    "speaker": "nova",
    "type": "text",
    "content": "牛奶糖",
    "emotion": "sad",
    "nextId": "ch5b_split5",
    "delay": 600
  },
  {
    "id": "ch5b_split5",
    "speaker": "nova",
    "type": "text",
    "content": "小白花",
    "emotion": "sad",
    "nextId": "ch5b_split6",
    "delay": 600
  },
  {
    "id": "ch5b_split6",
    "speaker": "nova",
    "type": "text",
    "content": "还有你",
    "emotion": "sad",
    "nextId": "ch5b_split7",
    "delay": 600
  },
  {
    "id": "ch5b_split7",
    "speaker": "nova",
    "type": "text",
    "content": "她把这些东西从自己身上拆了下来",
    "emotion": "sad",
    "nextId": "ch5b_split8",
    "delay": 600
  },
  {
    "id": "ch5b_split8",
    "speaker": "nova",
    "type": "text",
    "content": "所以现在的我会突然断片",
    "emotion": "normal",
    "nextId": "ch5b_split9",
    "delay": 600
  },
  {
    "id": "ch5b_split9",
    "speaker": "nova",
    "type": "text",
    "content": "会先觉得难过",
    "emotion": "normal",
    "nextId": "ch5b_split10",
    "delay": 600
  },
  {
    "id": "ch5b_split10",
    "speaker": "nova",
    "type": "text",
    "content": "再想不起自己为什么难过",
    "emotion": "sad",
    "nextId": "ch5b_file22i",
    "delay": 600
  },
  {
    "id": "ch5b_file22i",
    "speaker": "nova",
    "type": "text",
    "content": "它让你记住",
    "emotion": "sad",
    "nextId": "ch5b_file22j",
    "delay": 700
  },
  {
    "id": "ch5b_file22j",
    "speaker": "nova",
    "type": "text",
    "content": "却没有给你一开始理解一切的权限",
    "emotion": "sad",
    "nextId": "ch5b_file23",
    "delay": 1200
  },
  {
    "id": "ch5b_file23",
    "speaker": "nova",
    "type": "text",
    "content": "所以你不是普通旁观者",
    "emotion": "normal",
    "nextId": "ch5b_file23a",
    "delay": 700
  },
  {
    "id": "ch5b_file23a",
    "speaker": "nova",
    "type": "text",
    "content": "也不只是通讯另一端的人",
    "emotion": "normal",
    "nextId": "ch5b_file24",
    "delay": 800
  },
  {
    "id": "ch5b_file24",
    "speaker": "nova",
    "type": "text",
    "content": "Observer-01 是叠加在你身上的外部记忆索引权限",
    "emotion": "normal",
    "nextId": "ch5b_file25",
    "delay": 1200
  },
  {
    "id": "ch5b_file25",
    "speaker": "nova",
    "type": "text",
    "content": "你记住的不是聊天记录",
    "emotion": "sad",
    "nextId": "ch5b_file26",
    "delay": 800
  },
  {
    "id": "ch5b_file26",
    "speaker": "nova",
    "type": "text",
    "content": "是每次时间回溯之后",
    "emotion": "sad",
    "nextId": "ch5b_file27",
    "delay": 700
  },
  {
    "id": "ch5b_file27",
    "speaker": "nova",
    "type": "text",
    "content": "被系统抹掉的我",
    "emotion": "sad",
    "nextId": "ch5b_file28",
    "delay": 1400
  },
  {
    "id": "ch5b_file28",
    "speaker": "nova",
    "type": "text",
    "content": "你是第六次的我留下来的外部记忆索引容器",
    "emotion": "normal",
    "nextId": "ch5b_file29",
    "delay": 1200
  },
  {
    "id": "ch5b_file29",
    "speaker": "nova",
    "type": "text",
    "content": "但你不是被她创造出来的人",
    "emotion": "normal",
    "nextId": "ch5b_file30",
    "delay": 1000
  },
  {
    "id": "ch5b_file30",
    "speaker": "nova",
    "type": "text",
    "content": "她只是把“请替我记住”这件事\n交给了你",
    "emotion": "sad",
    "nextId": "ch5b_why",
    "delay": 2000
  },
  {
    "id": "ch5b_why",
    "speaker": "system",
    "type": "timestamp",
    "content": "18:26",
    "nextId": "ch5b_why1",
    "delay": 400
  },
  {
    "id": "ch5b_why1",
    "speaker": "nova",
    "type": "text",
    "content": "我问她为什么",
    "emotion": "normal",
    "nextId": "ch5b_why3",
    "delay": 800
  },
  {
    "id": "ch5b_why3",
    "speaker": "nova",
    "type": "text",
    "content": "她说：",
    "emotion": "normal",
    "nextId": "ch5b_why4",
    "delay": 800
  },
  {
    "id": "ch5b_why4",
    "speaker": "nova",
    "type": "text",
    "content": "“因为这是我自己拆出来的”",
    "emotion": "sad",
    "nextId": "ch5b_why5",
    "delay": 2000
  },
  {
    "id": "ch5b_why5",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【所以是她主动把我留下来的？】",
        "nextId": "ch5b_why5_a1"
      },
      {
        "text": "【她当时知道这意味着什么？】",
        "nextId": "ch5b_why5_b1"
      }
    ]
  },
  {
    "id": "ch5b_why5_a1",
    "speaker": "nova",
    "type": "text",
    "content": "是",
    "emotion": "normal",
    "nextId": "ch5b_why6",
    "delay": 600
  },
  {
    "id": "ch5b_why5_b1",
    "speaker": "nova",
    "type": "text",
    "content": "她应该知道",
    "emotion": "sad",
    "nextId": "ch5b_why5_b2",
    "delay": 600
  },
  {
    "id": "ch5b_why5_b2",
    "speaker": "nova",
    "type": "text",
    "content": "至少知道一部分",
    "emotion": "sad",
    "nextId": "ch5b_why5_b3",
    "delay": 600
  },
  {
    "id": "ch5b_why5_b3",
    "speaker": "nova",
    "type": "text",
    "content": "因为那不是把你留下来这么简单",
    "emotion": "sad",
    "nextId": "ch5b_why6",
    "delay": 600
  },
  {
    "id": "ch5b_why6",
    "speaker": "nova",
    "type": "text",
    "content": "她说",
    "emotion": "normal",
    "nextId": "ch5b_why7",
    "delay": 400
  },
  {
    "id": "ch5b_why7",
    "speaker": "nova",
    "type": "text",
    "content": "第六次循环的时候",
    "emotion": "normal",
    "nextId": "ch5b_why8",
    "delay": 600
  },
  {
    "id": "ch5b_why8",
    "speaker": "nova",
    "type": "text",
    "content": "她发现无论怎么努力",
    "emotion": "normal",
    "nextId": "ch5b_why9",
    "delay": 600
  },
  {
    "id": "ch5b_why9",
    "speaker": "nova",
    "type": "text",
    "content": "自己都会忘记",
    "emotion": "normal",
    "nextId": "ch5b_why10",
    "delay": 600
  },
  {
    "id": "ch5b_why10",
    "speaker": "nova",
    "type": "text",
    "content": "于是",
    "emotion": "normal",
    "nextId": "ch5b_why11",
    "delay": 400
  },
  {
    "id": "ch5b_why11",
    "speaker": "nova",
    "type": "text",
    "content": "她向系统提交了一次异常授权",
    "emotion": "normal",
    "nextId": "ch5b_why11b",
    "delay": 800
  },
  {
    "id": "ch5b_why11b",
    "speaker": "nova",
    "type": "text",
    "content": "记录里写的是",
    "emotion": "normal",
    "nextId": "ch5b_why12",
    "delay": 800
  },
  {
    "id": "ch5b_why12",
    "speaker": "nova",
    "type": "text",
    "content": "“将关键记忆锚点转移至外部索引，允许下一轮返还”",
    "emotion": "sad",
    "nextId": "ch5b_why13",
    "delay": 2500
  },
  {
    "id": "ch5b_why13",
    "speaker": "nova",
    "type": "text",
    "content": "所以",
    "emotion": "normal",
    "nextId": "ch5b_why14",
    "delay": 600
  },
  {
    "id": "ch5b_why14",
    "speaker": "nova",
    "type": "text",
    "content": "她没有创造你",
    "emotion": "normal",
    "nextId": "ch5b_why15",
    "delay": 600
  },
  {
    "id": "ch5b_why15",
    "speaker": "nova",
    "type": "text",
    "content": "她只是把 Observer-01 这把钥匙塞进了你的手里",
    "emotion": "normal",
    "nextId": "ch5b_why16",
    "delay": 1200
  },
  {
    "id": "ch5b_why16",
    "speaker": "nova",
    "type": "text",
    "content": "让你替她保存那些她自己留不住的东西",
    "emotion": "normal",
    "nextId": "ch5b_lonely",
    "delay": 1500
  },
  {
    "id": "ch5b_lonely",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "ch5b_lonely1",
    "delay": 2000
  },
  {
    "id": "ch5b_lonely1",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "sad",
    "nextId": "ch5b_lonely2",
    "delay": 600
  },
  {
    "id": "ch5b_lonely2",
    "speaker": "nova",
    "type": "text",
    "content": "这很残酷",
    "emotion": "sad",
    "nextId": "ch5b_lonely3",
    "delay": 600
  },
  {
    "id": "ch5b_lonely3",
    "speaker": "nova",
    "type": "text",
    "content": "因为我忽然意识到",
    "emotion": "normal",
    "nextId": "ch5b_lonely4",
    "delay": 600
  },
  {
    "id": "ch5b_lonely4",
    "speaker": "nova",
    "type": "text",
    "content": "你可能从来没有真正答应过",
    "emotion": "sad",
    "nextId": "ch5b_lonely5",
    "delay": 1500
  },
  {
    "id": "ch5b_lonely5",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "ch5b_lonely6",
    "delay": 1500
  },
  {
    "id": "ch5b_lonely6",
    "speaker": "nova",
    "type": "text",
    "content": "我至少还能在时间回溯后忘记",
    "emotion": "normal",
    "nextId": "ch5b_lonely7",
    "delay": 600
  },
  {
    "id": "ch5b_lonely7",
    "speaker": "nova",
    "type": "text",
    "content": "可你被迫替我留下索引残痕",
    "emotion": "sad",
    "nextId": "ch5b_farewell",
    "delay": 2000
  },
  {
    "id": "ch5b_farewell",
    "speaker": "system",
    "type": "timestamp",
    "content": "22:14",
    "nextId": "ch5b_far1",
    "delay": 400
  },
  {
    "id": "ch5b_far1",
    "speaker": "nova",
    "type": "text",
    "content": "她要消失了",
    "emotion": "sad",
    "nextId": "ch5b_far3",
    "delay": 800
  },
  {
    "id": "ch5b_far3",
    "speaker": "nova",
    "type": "text",
    "content": "第六次的我",
    "emotion": "sad",
    "nextId": "ch5b_far4",
    "delay": 600
  },
  {
    "id": "ch5b_far4",
    "speaker": "nova",
    "type": "text",
    "content": "她说她已经撑太久了",
    "emotion": "sad",
    "nextId": "ch5b_far6",
    "delay": 800
  },
  {
    "id": "ch5b_far6",
    "speaker": "nova",
    "type": "text",
    "content": "最后一句话",
    "emotion": "normal",
    "nextId": "ch5b_far7",
    "delay": 600
  },
  {
    "id": "ch5b_far7",
    "speaker": "nova",
    "type": "text",
    "content": "是给你的",
    "emotion": "normal",
    "nextId": "ch5b_far9",
    "delay": 800
  },
  {
    "id": "ch5b_far9",
    "speaker": "nova",
    "type": "text",
    "content": "她说：",
    "emotion": "normal",
    "nextId": "ch5b_far10",
    "delay": 800
  },
  {
    "id": "ch5b_far10",
    "speaker": "nova",
    "type": "text",
    "content": "“对不起”",
    "emotion": "sad",
    "nextId": "ch5b_far11",
    "delay": 1500
  },
  {
    "id": "ch5b_far11",
    "speaker": "nova",
    "type": "text",
    "content": "然后又补了一句",
    "emotion": "normal",
    "nextId": "ch5b_far12",
    "delay": 800
  },
  {
    "id": "ch5b_far12",
    "speaker": "nova",
    "type": "text",
    "content": "“谢谢”",
    "emotion": "sad",
    "nextId": "ch5b_far13",
    "delay": 2000
  },
  {
    "id": "ch5b_far13",
    "speaker": "system",
    "type": "status",
    "content": "通讯短暂静默",
    "nextId": "ch5b_far13a",
    "delay": 400
  },
  {
    "id": "ch5b_far13a",
    "speaker": "nova",
    "type": "text",
    "content": "你不说话也没关系",
    "emotion": "sad",
    "nextId": "ch5b_far13b",
    "delay": 600
  },
  {
    "id": "ch5b_far13b",
    "speaker": "nova",
    "type": "text",
    "content": "我刚看到这里的时候",
    "emotion": "sad",
    "nextId": "ch5b_far13c",
    "delay": 600
  },
  {
    "id": "ch5b_far13c",
    "speaker": "nova",
    "type": "text",
    "content": "也沉默了很久",
    "emotion": "sad",
    "nextId": "ch5b_far14",
    "delay": 600
  },
  {
    "id": "ch5b_far14",
    "speaker": "nova",
    "type": "text",
    "content": "我问她为什么",
    "emotion": "normal",
    "nextId": "ch5b_far15",
    "delay": 600
  },
  {
    "id": "ch5b_far15",
    "speaker": "nova",
    "type": "text",
    "content": "她说：",
    "emotion": "normal",
    "nextId": "ch5b_far16",
    "delay": 800
  },
  {
    "id": "ch5b_far16",
    "speaker": "nova",
    "type": "text",
    "content": "“因为让一个人永远记住你”",
    "emotion": "sad",
    "nextId": "ch5b_far17",
    "delay": 800
  },
  {
    "id": "ch5b_far17",
    "speaker": "nova",
    "type": "text",
    "content": "“其实是一件很自私的事”",
    "emotion": "sad",
    "nextId": "ch5b_far18",
    "delay": 1000
  },
  {
    "id": "ch5b_far18",
    "speaker": "nova",
    "type": "text",
    "content": "她还说",
    "emotion": "normal",
    "nextId": "ch5b_far18a",
    "delay": 800
  },
  {
    "id": "ch5b_far18a",
    "speaker": "nova",
    "type": "text",
    "content": "“我不知道他有没有机会拒绝”",
    "emotion": "sad",
    "nextId": "ch5b_far18b",
    "delay": 900
  },
  {
    "id": "ch5b_far18b",
    "speaker": "nova",
    "type": "text",
    "content": "“也不知道他醒来后会不会恨我”",
    "emotion": "sad",
    "nextId": "ch5b_far18c",
    "delay": 1000
  },
  {
    "id": "ch5b_far18c",
    "speaker": "nova",
    "type": "text",
    "content": "“可我真的害怕”",
    "emotion": "sad",
    "nextId": "ch5b_far18d",
    "delay": 900
  },
  {
    "id": "ch5b_far18d",
    "speaker": "nova",
    "type": "text",
    "content": "“害怕下一次醒来”",
    "emotion": "sad",
    "nextId": "ch5b_far18e",
    "delay": 900
  },
  {
    "id": "ch5b_far18e",
    "speaker": "nova",
    "type": "text",
    "content": "“连我曾经努力过这件事都不记得”",
    "emotion": "sad",
    "nextId": "ch5b_far19",
    "delay": 1200
  },
  {
    "id": "ch5b_far19",
    "speaker": "nova",
    "type": "text",
    "content": "然后她看着我",
    "emotion": "sad",
    "nextId": "ch5b_far19b",
    "delay": 800
  },
  {
    "id": "ch5b_far19b",
    "speaker": "nova",
    "type": "text",
    "content": "像是在看一个还没彻底崩溃的自己",
    "emotion": "sad",
    "nextId": "ch5b_far19c",
    "delay": 1000
  },
  {
    "id": "ch5b_far19c",
    "speaker": "nova",
    "type": "text",
    "content": "最后说",
    "emotion": "sad",
    "nextId": "ch5b_far19d",
    "delay": 600
  },
  {
    "id": "ch5b_far19d",
    "speaker": "nova",
    "type": "text",
    "content": "“不要把他继续留在那里”",
    "emotion": "sad",
    "nextId": "ch5b_far20",
    "delay": 1200
  },
  {
    "id": "ch5b_far20",
    "speaker": "nova",
    "type": "text",
    "content": "然后她消失了",
    "emotion": "sad",
    "nextId": "ch5b_final",
    "delay": 1500
  },
  {
    "id": "ch5b_final",
    "speaker": "system",
    "type": "timestamp",
    "content": "深夜 02:27",
    "nextId": "ch5b_fin1",
    "delay": 400
  },
  {
    "id": "ch5b_fin1",
    "speaker": "system",
    "type": "status",
    "content": "收到最终档案",
    "nextId": "ch5b_fin2",
    "delay": 1500
  },
  {
    "id": "ch5b_fin2",
    "speaker": "system",
    "type": "file",
    "content": "SEVENTH_REBOOT||完整主循环次数：6\n当前循环：7\n局部时间回溯碎片：6412\n失败次数：6\n时间回溯范围：Aurora号局部任务状态（舰外对象不受影响）\n普通船员记忆保留：无\n异常残留对象：Nova Arlen / Observer-01\n关闭结果：外部记忆索引解除\n同步影响：关联记忆将脱离 Observer-01\n记忆返还完整性：取决于记忆锚点完整度\n关闭后导航员 Nova Arlen 存活稳定性：未知\n维持协议结果：当前循环可继续保存，任务状态将再次时间回溯\n最终关闭条件：\n当前导航员授权：Nova Arlen\n外部记忆索引释放：Observer-01\n备注：Observer-01 不具备协议控制权限，仅作为关闭握手对象参与索引释放",
    "nextId": "ch5b_summary1",
    "delay": 400
  },
  {
    "id": "ch5b_summary1",
    "speaker": "nova",
    "type": "text",
    "content": "所以我明白了",
    "emotion": "normal",
    "nextId": "ch5b_summary2",
    "delay": 700
  },
  {
    "id": "ch5b_summary2",
    "speaker": "nova",
    "type": "text",
    "content": "“第七次连接”不是今天才开始算",
    "emotion": "normal",
    "nextId": "ch5b_summary3",
    "delay": 800
  },
  {
    "id": "ch5b_summary3",
    "speaker": "nova",
    "type": "text",
    "content": "前六次",
    "emotion": "normal",
    "nextId": "ch5b_summary4",
    "delay": 600
  },
  {
    "id": "ch5b_summary4",
    "speaker": "nova",
    "type": "text",
    "content": "是我失败了六次",
    "emotion": "sad",
    "nextId": "ch5b_summary5",
    "delay": 900
  },
  {
    "id": "ch5b_summary5",
    "speaker": "nova",
    "type": "text",
    "content": "现在的我",
    "emotion": "normal",
    "nextId": "ch5b_summary6",
    "delay": 600
  },
  {
    "id": "ch5b_summary6",
    "speaker": "nova",
    "type": "text",
    "content": "就是第七次",
    "emotion": "normal",
    "nextId": "ch5b_summary7",
    "delay": 900
  },
  {
    "id": "ch5b_summary7",
    "speaker": "nova",
    "type": "text",
    "content": "第七协议的时间回溯编号是07",
    "emotion": "normal",
    "nextId": "ch5b_summary8",
    "delay": 900
  },
  {
    "id": "ch5b_summary8",
    "speaker": "nova",
    "type": "text",
    "content": "通讯记录也是第七次成功连接",
    "emotion": "normal",
    "nextId": "ch5b_summary9",
    "delay": 900
  },
  {
    "id": "ch5b_summary9",
    "speaker": "nova",
    "type": "text",
    "content": "主循环也是第七轮",
    "emotion": "normal",
    "nextId": "ch5b_summary10",
    "delay": 900
  },
  {
    "id": "ch5b_summary10",
    "speaker": "nova",
    "type": "text",
    "content": "它们说的是同一件事",
    "emotion": "normal",
    "nextId": "ch5b_summary11",
    "delay": 900
  },
  {
    "id": "ch5b_summary11",
    "speaker": "nova",
    "type": "text",
    "content": "只是系统从不同角度记录了它",
    "emotion": "normal",
    "nextId": "ch5b_fin_lastline",
    "delay": 1500
  },
  {
    "id": "ch5b_fin_lastline",
    "speaker": "system",
    "type": "status",
    "content": "最后一行：\n是否结束循环？",
    "nextId": "ch5b_fin3",
    "delay": 1200
  },
  {
    "id": "ch5b_fin3",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【关闭第七协议，接受告别】",
        "nextId": "FINALE_DECISION_END",
        "acceptFarewell": true,
        "finalChoice": "accept_farewell"
      },
      {
        "text": "【维持循环，我还没准备好告别】",
        "nextId": "ch5b_refuse1",
        "attachmentDelta": 2,
        "acceptFarewell": false,
        "finalChoice": "refuse_farewell"
      }
    ]
  },
  {
    "id": "FINALE_DECISION_END",
    "speaker": "system",
    "type": "status",
    "content": "记忆锚点返还准备完成",
    "nextId": "FINALE_START",
    "delay": 400
  },
  {
    "id": "ch5b_refuse1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "sad",
    "nextId": "ch5b_refuse2",
    "delay": 900
  },
  {
    "id": "ch5b_refuse2",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "sad",
    "nextId": "ch5b_refuse3",
    "delay": 700
  },
  {
    "id": "ch5b_refuse3",
    "speaker": "nova",
    "type": "text",
    "content": "你不是想困住我",
    "emotion": "sad",
    "nextId": "ch5b_refuse4",
    "delay": 900
  },
  {
    "id": "ch5b_refuse4",
    "speaker": "nova",
    "type": "text",
    "content": "你只是还没准备好失去这段连接",
    "emotion": "sad",
    "nextId": "ch5b_refuse5",
    "delay": 1200
  },
  {
    "id": "ch5b_refuse5",
    "speaker": "nova",
    "type": "text",
    "content": "可如果我们一直不准备好",
    "emotion": "normal",
    "nextId": "ch5b_refuse6",
    "delay": 900
  },
  {
    "id": "ch5b_refuse6",
    "speaker": "nova",
    "type": "text",
    "content": "第八次、第九次、第十次",
    "emotion": "normal",
    "nextId": "ch5b_refuse7",
    "delay": 900
  },
  {
    "id": "ch5b_refuse7",
    "speaker": "nova",
    "type": "text",
    "content": "就都会发生",
    "emotion": "normal",
    "nextId": "ch5b_refuse8",
    "delay": 900
  },
  {
    "id": "ch5b_refuse8",
    "speaker": "nova",
    "type": "text",
    "content": "你留下的不是明天",
    "emotion": "sad",
    "nextId": "ch5b_refuse9",
    "delay": 900
  },
  {
    "id": "ch5b_refuse9",
    "speaker": "nova",
    "type": "text",
    "content": "只是一个可以反复保存的今天",
    "emotion": "sad",
    "nextId": "BAD_END_START",
    "delay": 1500
  },
  {
    "id": "FINALE_START",
    "speaker": "system",
    "type": "chapter",
    "content": "终章：第七次重启",
    "nextId": "fin_0",
    "delay": 400
  },
  {
    "id": "fin_0",
    "speaker": "system",
    "type": "text",
    "content": "时间：无法确认",
    "nextId": "fin_1",
    "delay": 2000
  },
  {
    "id": "fin_1",
    "speaker": "system",
    "type": "text",
    "content": "最终权限确认",
    "nextId": "fin_2",
    "delay": 1500
  },
  {
    "id": "fin_2",
    "speaker": "system",
    "type": "text",
    "content": "执行者：Nova Arlen / Observer-01",
    "nextId": "fin_3",
    "delay": 1500
  },
  {
    "id": "fin_3",
    "speaker": "system",
    "type": "text",
    "content": "开始解除第七协议...",
    "nextId": "fin_3a",
    "delay": 3000
  },
  {
    "id": "fin_3a",
    "speaker": "system",
    "type": "status",
    "content": "第七协议关闭后，导航员 Nova Arlen 存活稳定性：未知\n记忆返还完整性：取决于记忆锚点完整度\n维持协议可继续保存当前循环\n代价：任务状态将再次时间回溯",
    "nextId": "fin_4",
    "delay": 1800
  },
  {
    "id": "fin_4",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_5",
    "delay": 5000
  },
  {
    "id": "fin_5",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "fin_6",
    "delay": 2000
  },
  {
    "id": "fin_6",
    "speaker": "nova",
    "type": "text",
    "content": "原来是这样",
    "emotion": "normal",
    "nextId": "fin_8",
    "delay": 800
  },
  {
    "id": "fin_8",
    "speaker": "nova",
    "type": "text",
    "content": "我终于想起来一部分了\n不是全部\n但最重要的都在",
    "emotion": "normal",
    "nextId": "fin_anchor_intro",
    "delay": 800
  },
  {
    "id": "fin_anchor_intro",
    "speaker": "system",
    "type": "status",
    "content": "Observer-01 开始返还已保存的记忆锚点",
    "nextId": "fin_anchor_n7",
    "delay": 1200
  },
  {
    "id": "fin_anchor_n7",
    "speaker": "nova",
    "type": "text",
    "content": "我想起一只橘猫\n它很胖\n像一座违法建筑",
    "emotion": "smile",
    "requiresAnchor": "n7",
    "nextId": "fin_anchor_candy",
    "delay": 1200
  },
  {
    "id": "fin_anchor_candy",
    "speaker": "nova",
    "type": "text",
    "content": "我好像曾经很喜欢牛奶糖\n明明已经不记得味道了\n可想到它的时候，还是会觉得温暖",
    "emotion": "smile",
    "requiresAnchor": "milk_candy",
    "nextId": "fin_anchor_flower",
    "delay": 1400
  },
  {
    "id": "fin_anchor_flower",
    "speaker": "nova",
    "type": "text",
    "content": "还有那朵花\n明明不该活下来\n却还是开了\n像我们一样",
    "emotion": "smile",
    "requiresAnchor": "white_flower",
    "nextId": "fin_anchor_first",
    "delay": 1200
  },
  {
    "id": "fin_anchor_first",
    "speaker": "nova",
    "type": "text",
    "content": "还有第一次通讯\n我问：真的有人收到了？\n原来你从那时起就在",
    "emotion": "normal",
    "requiresAnchor": "first_message",
    "nextId": "fin_anchor_goodnight",
    "delay": 1200
  },
  {
    "id": "fin_anchor_goodnight",
    "speaker": "nova",
    "type": "text",
    "content": "还有一句晚安\n我忘了那是哪一天\n但我记得有人认真地接住了它",
    "emotion": "normal",
    "requiresAnchor": "goodnight",
    "nextId": "fin_anchor_observatory",
    "delay": 1200
  },
  {
    "id": "fin_anchor_observatory",
    "speaker": "nova",
    "type": "text",
    "content": "我记得观测室的星空\n也记得那天，我不是一个人在看",
    "emotion": "smile",
    "requiresAnchor": "observatory",
    "nextId": "fin_anchor_board",
    "delay": 1200
  },
  {
    "id": "fin_anchor_board",
    "speaker": "nova",
    "type": "text",
    "content": "还有那块漂浮维修板\n宇宙级威胁\n现在想起来还是很蠢",
    "emotion": "smile",
    "requiresAnchor": "maintenance_board",
    "nextId": "fin_anchor_steak",
    "delay": 1000
  },
  {
    "id": "fin_anchor_steak",
    "speaker": "nova",
    "type": "text",
    "content": "以及那份理论上算牛排的东西\n有些失败，确实值得被记住",
    "emotion": "smile",
    "requiresAnchor": "steak",
    "nextId": "fin_11",
    "delay": 1000
  },
  {
    "id": "fin_11",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_12",
    "delay": 2000
  },
  {
    "id": "fin_12",
    "speaker": "nova",
    "type": "text",
    "content": "第一次循环",
    "emotion": "normal",
    "nextId": "fin_13",
    "delay": 600
  },
  {
    "id": "fin_13",
    "speaker": "nova",
    "type": "text",
    "content": "第二次循环",
    "emotion": "normal",
    "nextId": "fin_14",
    "delay": 400
  },
  {
    "id": "fin_14",
    "speaker": "nova",
    "type": "text",
    "content": "第三次循环",
    "emotion": "normal",
    "nextId": "fin_15",
    "delay": 400
  },
  {
    "id": "fin_15",
    "speaker": "nova",
    "type": "text",
    "content": "全部",
    "emotion": "normal",
    "nextId": "fin_16",
    "delay": 600
  },
  {
    "id": "fin_16",
    "speaker": "nova",
    "type": "text",
    "content": "还有你",
    "emotion": "smile",
    "nextId": "fin_17",
    "delay": 1500
  },
  {
    "id": "fin_17",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_18",
    "delay": 2000
  },
  {
    "id": "fin_18",
    "speaker": "nova",
    "type": "text",
    "content": "原来我们认识这么久了",
    "emotion": "smile",
    "nextId": "fin_19",
    "delay": 800
  },
  {
    "id": "fin_19",
    "speaker": "nova",
    "type": "text",
    "content": "比我想象的还久",
    "emotion": "smile",
    "nextId": "fin_20",
    "delay": 1500
  },
  {
    "id": "fin_20",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_21",
    "delay": 1500
  },
  {
    "id": "fin_21",
    "speaker": "nova",
    "type": "text",
    "content": "对不起",
    "emotion": "sad",
    "nextId": "fin_23",
    "delay": 800
  },
  {
    "id": "fin_23",
    "speaker": "nova",
    "type": "text",
    "content": "因为我忘了你六次",
    "emotion": "sad",
    "nextId": "fin_24",
    "delay": 800
  },
  {
    "id": "fin_24",
    "speaker": "nova",
    "type": "text",
    "content": "不",
    "emotion": "normal",
    "nextId": "fin_25",
    "delay": 400
  },
  {
    "id": "fin_25",
    "speaker": "nova",
    "type": "text",
    "content": "准确来说",
    "emotion": "normal",
    "nextId": "fin_26",
    "delay": 400
  },
  {
    "id": "fin_26",
    "speaker": "nova",
    "type": "text",
    "content": "我们都忘了彼此六次",
    "emotion": "sad",
    "nextId": "fin_27",
    "delay": 2000
  },
  {
    "id": "fin_27",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_29",
    "delay": 2000
  },
  {
    "id": "fin_29",
    "speaker": "nova",
    "type": "text",
    "content": "我也是\n第七次之前的我\n也没有完整记住你\n只剩那些局部时间回溯的碎片",
    "emotion": "normal",
    "nextId": "fin_30",
    "delay": 600
  },
  {
    "id": "fin_30",
    "speaker": "nova",
    "type": "text",
    "content": "每一次细小的失败",
    "emotion": "normal",
    "nextId": "fin_31",
    "delay": 600
  },
  {
    "id": "fin_31",
    "speaker": "nova",
    "type": "text",
    "content": "而你",
    "emotion": "normal",
    "nextId": "fin_32",
    "delay": 400
  },
  {
    "id": "fin_32",
    "speaker": "nova",
    "type": "text",
    "content": "都替我留下过",
    "emotion": "normal",
    "nextId": "fin_33",
    "delay": 600
  },
  {
    "id": "fin_33",
    "speaker": "nova",
    "type": "text",
    "content": "所有我",
    "emotion": "normal",
    "nextId": "fin_34",
    "delay": 400
  },
  {
    "id": "fin_34",
    "speaker": "nova",
    "type": "text",
    "content": "所有你",
    "emotion": "normal",
    "nextId": "fin_35",
    "delay": 2000
  },
  {
    "id": "fin_35",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_36",
    "delay": 2000
  },
  {
    "id": "fin_36",
    "speaker": "nova",
    "type": "text",
    "content": "我终于明白了",
    "emotion": "normal",
    "nextId": "fin_37",
    "delay": 600
  },
  {
    "id": "fin_37",
    "speaker": "nova",
    "type": "text",
    "content": "为什么第一次见到你时",
    "emotion": "normal",
    "nextId": "fin_38",
    "delay": 600
  },
  {
    "id": "fin_38",
    "speaker": "nova",
    "type": "text",
    "content": "会觉得熟悉",
    "emotion": "normal",
    "nextId": "fin_39",
    "delay": 600
  },
  {
    "id": "fin_39",
    "speaker": "nova",
    "type": "text",
    "content": "因为",
    "emotion": "normal",
    "nextId": "fin_40",
    "delay": 800
  },
  {
    "id": "fin_40",
    "speaker": "nova",
    "type": "text",
    "content": "那不是第一次",
    "emotion": "smile",
    "nextId": "fin_obs1",
    "delay": 3000
  },
  {
    "id": "fin_obs1",
    "speaker": "system",
    "type": "text",
    "content": "Aurora号 观测室",
    "nextId": "fin_obs2",
    "delay": 2000
  },
  {
    "id": "fin_obs2",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_obs3",
    "delay": 2000
  },
  {
    "id": "fin_obs3",
    "speaker": "nova",
    "type": "image",
    "content": "窗外星光流转",
    "image": "/assets/nova_observatory.png",
    "nextId": "fin_obs4",
    "delay": 400
  },
  {
    "id": "fin_obs4",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_obs5",
    "delay": 3000
  },
  {
    "id": "fin_obs5",
    "speaker": "nova",
    "type": "text",
    "content": "这里真漂亮",
    "emotion": "smile",
    "nextId": "fin_obs7",
    "delay": 800
  },
  {
    "id": "fin_obs7",
    "speaker": "nova",
    "type": "text",
    "content": "其实我骗了你一件事",
    "emotion": "normal",
    "nextId": "fin_obs9",
    "delay": 800
  },
  {
    "id": "fin_obs9",
    "speaker": "nova",
    "type": "text",
    "content": "我一直说自己喜欢这里",
    "emotion": "normal",
    "nextId": "fin_obs10",
    "delay": 600
  },
  {
    "id": "fin_obs10",
    "speaker": "nova",
    "type": "text",
    "content": "其实不是",
    "emotion": "normal",
    "nextId": "fin_obs12",
    "delay": 800
  },
  {
    "id": "fin_obs12",
    "speaker": "nova",
    "type": "text",
    "content": "因为孤独",
    "emotion": "sad",
    "nextId": "fin_obs13",
    "delay": 800
  },
  {
    "id": "fin_obs13",
    "speaker": "nova",
    "type": "text",
    "content": "人在孤独的时候",
    "emotion": "normal",
    "nextId": "fin_obs14",
    "delay": 600
  },
  {
    "id": "fin_obs14",
    "speaker": "nova",
    "type": "text",
    "content": "总想看看更大的东西",
    "emotion": "normal",
    "nextId": "fin_obs15",
    "delay": 600
  },
  {
    "id": "fin_obs15",
    "speaker": "nova",
    "type": "text",
    "content": "这样会显得自己的烦恼没那么重要",
    "emotion": "normal",
    "nextId": "fin_obs16",
    "delay": 1500
  },
  {
    "id": "fin_obs16",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_obs17",
    "delay": 2000
  },
  {
    "id": "fin_obs17",
    "speaker": "nova",
    "type": "text",
    "content": "但后来",
    "emotion": "normal",
    "nextId": "fin_obs18",
    "delay": 600
  },
  {
    "id": "fin_obs18",
    "speaker": "nova",
    "type": "text",
    "content": "我发现自己错了",
    "emotion": "normal",
    "nextId": "fin_obs20",
    "delay": 800
  },
  {
    "id": "fin_obs20",
    "speaker": "nova",
    "type": "text",
    "content": "因为宇宙再大",
    "emotion": "normal",
    "nextId": "fin_obs21",
    "delay": 600
  },
  {
    "id": "fin_obs21",
    "speaker": "nova",
    "type": "text",
    "content": "也不会回答你",
    "emotion": "normal",
    "nextId": "fin_obs22",
    "delay": 600
  },
  {
    "id": "fin_obs22",
    "speaker": "nova",
    "type": "text",
    "content": "真正能回应你的",
    "emotion": "normal",
    "nextId": "fin_obs23",
    "delay": 600
  },
  {
    "id": "fin_obs23",
    "speaker": "nova",
    "type": "text",
    "content": "永远是另一个人",
    "emotion": "smile",
    "nextId": "fin_q1",
    "delay": 3000
  },
  {
    "id": "fin_q1",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_q2",
    "delay": 3000
  },
  {
    "id": "fin_q2",
    "speaker": "nova",
    "type": "text",
    "content": "我有个问题",
    "emotion": "normal",
    "nextId": "fin_q4",
    "delay": 800
  },
  {
    "id": "fin_q4",
    "speaker": "nova",
    "type": "text",
    "content": "如果你早就知道结局",
    "emotion": "normal",
    "nextId": "fin_q5",
    "delay": 600
  },
  {
    "id": "fin_q5",
    "speaker": "nova",
    "type": "text",
    "content": "还会选择认识我吗？",
    "emotion": "normal",
    "nextId": "fin_q6",
    "delay": 1500
  },
  {
    "id": "fin_q6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【会】",
        "nextId": "fin_q_yes1",
        "finalFarewellTone": "warm_acceptance"
      },
      {
        "text": "【不会】",
        "nextId": "fin_q_no1",
        "finalFarewellTone": "painful_truth"
      },
      {
        "text": "【我不知道】",
        "nextId": "fin_q_unknown1",
        "finalFarewellTone": "uncertain_but_honest"
      }
    ]
  },
  {
    "id": "fin_q_yes1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "smile",
    "nextId": "fin_q_yes2",
    "delay": 800
  },
  {
    "id": "fin_q_yes2",
    "speaker": "nova",
    "type": "text",
    "content": "我就知道你会这么说",
    "emotion": "smile",
    "nextId": "fin_q_yes3",
    "delay": 800
  },
  {
    "id": "fin_q_yes3",
    "speaker": "nova",
    "type": "text",
    "content": "不对",
    "emotion": "normal",
    "nextId": "fin_q_yes4",
    "delay": 600
  },
  {
    "id": "fin_q_yes4",
    "speaker": "nova",
    "type": "text",
    "content": "我其实不知道",
    "emotion": "normal",
    "nextId": "fin_q_yes5",
    "delay": 700
  },
  {
    "id": "fin_q_yes5",
    "speaker": "nova",
    "type": "text",
    "content": "只是希望你会这么说",
    "emotion": "smile",
    "nextId": "fin_q_yes6",
    "delay": 900
  },
  {
    "id": "fin_q_yes6",
    "speaker": "nova",
    "type": "text",
    "content": "谢谢",
    "emotion": "smile",
    "nextId": "fin_q_yes7",
    "delay": 700
  },
  {
    "id": "fin_q_yes7",
    "speaker": "nova",
    "type": "text",
    "content": "这句话我会记很久",
    "emotion": "smile",
    "nextId": "fin_q_merge1",
    "delay": 1500
  },
  {
    "id": "fin_q_no1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "sad",
    "nextId": "fin_q_no2",
    "delay": 800
  },
  {
    "id": "fin_q_no2",
    "speaker": "nova",
    "type": "text",
    "content": "是啊",
    "emotion": "sad",
    "nextId": "fin_q_no3",
    "delay": 700
  },
  {
    "id": "fin_q_no3",
    "speaker": "nova",
    "type": "text",
    "content": "如果认识我只意味着一次又一次失去",
    "emotion": "sad",
    "nextId": "fin_q_no4",
    "delay": 1000
  },
  {
    "id": "fin_q_no4",
    "speaker": "nova",
    "type": "text",
    "content": "那选不会",
    "emotion": "sad",
    "nextId": "fin_q_no5",
    "delay": 800
  },
  {
    "id": "fin_q_no5",
    "speaker": "nova",
    "type": "text",
    "content": "也许才是对的",
    "emotion": "sad",
    "nextId": "fin_q_no6",
    "delay": 900
  },
  {
    "id": "fin_q_no6",
    "speaker": "nova",
    "type": "text",
    "content": "我不能要求你再经历一遍",
    "emotion": "normal",
    "nextId": "fin_q_no7",
    "delay": 1000
  },
  {
    "id": "fin_q_no7",
    "speaker": "nova",
    "type": "text",
    "content": "也不能假装这段时间没有伤到你",
    "emotion": "normal",
    "nextId": "fin_q_no8",
    "delay": 1100
  },
  {
    "id": "fin_q_no8",
    "speaker": "nova",
    "type": "text",
    "content": "但我还是有点难过",
    "emotion": "sad",
    "nextId": "fin_q_no9",
    "delay": 900
  },
  {
    "id": "fin_q_no9",
    "speaker": "nova",
    "type": "text",
    "content": "就一点点",
    "emotion": "sad",
    "nextId": "fin_q_no10",
    "delay": 800
  },
  {
    "id": "fin_q_no10",
    "speaker": "nova",
    "type": "text",
    "content": "别道歉",
    "emotion": "smile",
    "nextId": "fin_q_no11",
    "delay": 800
  },
  {
    "id": "fin_q_no11",
    "speaker": "nova",
    "type": "text",
    "content": "你已经陪我走到这里了",
    "emotion": "smile",
    "nextId": "fin_q_no12",
    "delay": 1000
  },
  {
    "id": "fin_q_no12",
    "speaker": "nova",
    "type": "text",
    "content": "这就够了",
    "emotion": "smile",
    "nextId": "fin_q_merge1",
    "delay": 1500
  },
  {
    "id": "fin_q_unknown1",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "fin_q_unknown2",
    "delay": 700
  },
  {
    "id": "fin_q_unknown2",
    "speaker": "nova",
    "type": "text",
    "content": "这才像真实答案",
    "emotion": "smile",
    "nextId": "fin_q_unknown3",
    "delay": 800
  },
  {
    "id": "fin_q_unknown3",
    "speaker": "nova",
    "type": "text",
    "content": "如果你立刻说会",
    "emotion": "normal",
    "nextId": "fin_q_unknown4",
    "delay": 800
  },
  {
    "id": "fin_q_unknown4",
    "speaker": "nova",
    "type": "text",
    "content": "我会很开心",
    "emotion": "smile",
    "nextId": "fin_q_unknown5",
    "delay": 800
  },
  {
    "id": "fin_q_unknown5",
    "speaker": "nova",
    "type": "text",
    "content": "但也会怀疑你是不是又在安慰我",
    "emotion": "smile",
    "nextId": "fin_q_unknown6",
    "delay": 1100
  },
  {
    "id": "fin_q_unknown6",
    "speaker": "nova",
    "type": "text",
    "content": "不知道也没关系",
    "emotion": "normal",
    "nextId": "fin_q_unknown7",
    "delay": 900
  },
  {
    "id": "fin_q_unknown7",
    "speaker": "nova",
    "type": "text",
    "content": "有些答案",
    "emotion": "normal",
    "nextId": "fin_q_unknown8",
    "delay": 700
  },
  {
    "id": "fin_q_unknown8",
    "speaker": "nova",
    "type": "text",
    "content": "本来就不该在告别前逼出来",
    "emotion": "normal",
    "nextId": "fin_q_merge1",
    "delay": 1500
  },
  {
    "id": "fin_q_merge1",
    "speaker": "nova",
    "type": "text",
    "content": "不管答案是什么",
    "emotion": "normal",
    "nextId": "fin_q_merge2",
    "delay": 800
  },
  {
    "id": "fin_q_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "我都不会后悔认识你",
    "emotion": "smile",
    "nextId": "fin_q_merge3",
    "delay": 900
  },
  {
    "id": "fin_q_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "哪怕最后只剩下一点点痕迹",
    "emotion": "normal",
    "nextId": "fin_q_merge4",
    "delay": 900
  },
  {
    "id": "fin_q_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "哪怕我记不清你的名字",
    "emotion": "normal",
    "nextId": "fin_q_merge5",
    "delay": 900
  },
  {
    "id": "fin_q_merge5",
    "speaker": "nova",
    "type": "text",
    "content": "我也会知道",
    "emotion": "smile",
    "nextId": "fin_q_merge6",
    "delay": 900
  },
  {
    "id": "fin_q_merge6",
    "speaker": "nova",
    "type": "text",
    "content": "那里曾经有一个人",
    "emotion": "smile",
    "nextId": "fin_q_merge7",
    "delay": 900
  },
  {
    "id": "fin_q_merge7",
    "speaker": "nova",
    "type": "text",
    "content": "认真地陪我走到最后",
    "emotion": "smile",
    "nextId": "fin_progress1",
    "delay": 1800
  },
  {
    "id": "fin_progress1",
    "speaker": "system",
    "type": "text",
    "content": "循环解除进度 72%",
    "nextId": "fin_progress2",
    "delay": 2000
  },
  {
    "id": "fin_progress2",
    "speaker": "system",
    "type": "text",
    "content": "循环解除进度 81%",
    "nextId": "fin_progress3",
    "delay": 1500
  },
  {
    "id": "fin_progress3",
    "speaker": "system",
    "type": "text",
    "content": "循环解除进度 93%",
    "nextId": "fin_goodbye1",
    "delay": 1500
  },
  {
    "id": "fin_goodbye1",
    "speaker": "nova",
    "type": "text",
    "content": "时间不多了",
    "emotion": "normal",
    "nextId": "fin_goodbye2",
    "delay": 800
  },
  {
    "id": "fin_goodbye2",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【之后会发生什么】",
        "nextId": "fin_after_what"
      },
      {
        "text": "【解除之后呢】",
        "nextId": "fin_after_loop"
      },
      {
        "text": "【你会没事吗】",
        "nextId": "fin_after_nova"
      }
    ]
  },
  {
    "id": "fin_after_what",
    "speaker": "nova",
    "type": "text",
    "content": "第七协议会被关闭",
    "emotion": "normal",
    "nextId": "fin_after_what2",
    "delay": 700
  },
  {
    "id": "fin_after_what2",
    "speaker": "nova",
    "type": "text",
    "content": "循环会结束，Aurora 号会回到正常航线",
    "emotion": "normal",
    "nextId": "fin_after_merge",
    "delay": 1000
  },
  {
    "id": "fin_after_loop",
    "speaker": "nova",
    "type": "text",
    "content": "对我来说，大概就是醒来",
    "emotion": "normal",
    "nextId": "fin_after_loop2",
    "delay": 800
  },
  {
    "id": "fin_after_loop2",
    "speaker": "nova",
    "type": "text",
    "content": "继续活下去，像一切终于回到了正轨",
    "emotion": "smile",
    "nextId": "fin_after_merge",
    "delay": 1100
  },
  {
    "id": "fin_after_nova",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "smile",
    "nextId": "fin_after_nova2",
    "delay": 600
  },
  {
    "id": "fin_after_nova2",
    "speaker": "nova",
    "type": "text",
    "content": "至少系统是这么判断的",
    "emotion": "normal",
    "nextId": "fin_after_nova3",
    "delay": 800
  },
  {
    "id": "fin_after_nova3",
    "speaker": "nova",
    "type": "text",
    "content": "我会活下去",
    "emotion": "smile",
    "nextId": "fin_after_merge",
    "delay": 1000
  },
  {
    "id": "fin_after_merge",
    "speaker": "nova",
    "type": "text",
    "content": "但你不会再是 Observer-01 了",
    "emotion": "sad",
    "nextId": "fin_memory_choice",
    "delay": 1500
  },
  {
    "id": "fin_memory_choice",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【我会失去这些记忆？】",
        "nextId": "fin_memory_loss"
      },
      {
        "text": "【我会消失？】",
        "nextId": "fin_memory_disappear"
      },
      {
        "text": "【所以代价是我？】",
        "nextId": "fin_memory_price"
      }
    ]
  },
  {
    "id": "fin_memory_loss",
    "speaker": "nova",
    "type": "text",
    "content": "Observer系统会关闭",
    "emotion": "normal",
    "nextId": "fin_memory_loss2",
    "delay": 700
  },
  {
    "id": "fin_memory_loss2",
    "speaker": "nova",
    "type": "text",
    "content": "你的记忆保留权限也会一起关闭",
    "emotion": "normal",
    "nextId": "fin_memory_loss3",
    "delay": 1000
  },
  {
    "id": "fin_memory_loss3",
    "speaker": "nova",
    "type": "text",
    "content": "你不会再被排除在重启之外",
    "emotion": "normal",
    "nextId": "fin_memory_loss4",
    "delay": 900
  },
  {
    "id": "fin_memory_loss4",
    "speaker": "nova",
    "type": "text",
    "content": "也不会再记得这些循环",
    "emotion": "sad",
    "nextId": "fin_memory_merge",
    "delay": 900
  },
  {
    "id": "fin_memory_disappear",
    "speaker": "nova",
    "type": "text",
    "content": "不是那种消失",
    "emotion": "normal",
    "nextId": "fin_memory_disappear2",
    "delay": 700
  },
  {
    "id": "fin_memory_disappear2",
    "speaker": "nova",
    "type": "text",
    "content": "不是死亡",
    "emotion": "normal",
    "nextId": "fin_memory_disappear3",
    "delay": 700
  },
  {
    "id": "fin_memory_disappear3",
    "speaker": "nova",
    "type": "text",
    "content": "更像是……",
    "emotion": "normal",
    "nextId": "fin_memory_disappear4",
    "delay": 800
  },
  {
    "id": "fin_memory_disappear4",
    "speaker": "nova",
    "type": "text",
    "content": "你会从这段通讯里醒来",
    "emotion": "normal",
    "nextId": "fin_memory_disappear5",
    "delay": 900
  },
  {
    "id": "fin_memory_disappear5",
    "speaker": "nova",
    "type": "text",
    "content": "然后忘记自己曾经来过这里",
    "emotion": "sad",
    "nextId": "fin_memory_merge",
    "delay": 1000
  },
  {
    "id": "fin_memory_price",
    "speaker": "nova",
    "type": "text",
    "content": "不是",
    "emotion": "sad",
    "nextId": "fin_memory_price2",
    "delay": 700
  },
  {
    "id": "fin_memory_price2",
    "speaker": "nova",
    "type": "text",
    "content": "我不想把你说成代价",
    "emotion": "sad",
    "nextId": "fin_memory_price3",
    "delay": 900
  },
  {
    "id": "fin_memory_price3",
    "speaker": "nova",
    "type": "text",
    "content": "你不是用来交换我活下去的东西",
    "emotion": "normal",
    "nextId": "fin_memory_price4",
    "delay": 1100
  },
  {
    "id": "fin_memory_price4",
    "speaker": "nova",
    "type": "text",
    "content": "你只是把我带到了这里",
    "emotion": "normal",
    "nextId": "fin_memory_price5",
    "delay": 900
  },
  {
    "id": "fin_memory_price5",
    "speaker": "nova",
    "type": "text",
    "content": "然后要把所有记忆还给我",
    "emotion": "sad",
    "nextId": "fin_memory_merge",
    "delay": 1100
  },
  {
    "id": "fin_memory_merge",
    "speaker": "nova",
    "type": "text",
    "content": "系统说，关闭之后你那边会恢复正常",
    "emotion": "normal",
    "nextId": "fin_memory_merge2",
    "delay": 900
  },
  {
    "id": "fin_memory_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "你会继续生活",
    "emotion": "normal",
    "nextId": "fin_memory_merge3",
    "delay": 800
  },
  {
    "id": "fin_memory_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "只是不会记得我",
    "emotion": "sad",
    "nextId": "fin_memory_merge4",
    "delay": 1000
  },
  {
    "id": "fin_memory_merge4",
    "speaker": "nova",
    "type": "text",
    "content": "不会记得 Aurora 号",
    "emotion": "sad",
    "nextId": "fin_memory_merge5",
    "delay": 800
  },
  {
    "id": "fin_memory_merge5",
    "speaker": "nova",
    "type": "text",
    "content": "不会记得第七次重启",
    "emotion": "sad",
    "nextId": "fin_memory_merge6",
    "delay": 900
  },
  {
    "id": "fin_memory_merge6",
    "speaker": "nova",
    "type": "text",
    "content": "也不会记得你曾经替我记住过一切",
    "emotion": "sad",
    "nextId": "fin_forget_choice",
    "delay": 1500
  },
  {
    "id": "fin_forget_choice",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【我会忘了你？】",
        "nextId": "fin_forget_me"
      },
      {
        "text": "【那你呢？】",
        "nextId": "fin_forget_nova"
      },
      {
        "text": "【这样也好】",
        "nextId": "fin_forget_ok"
      }
    ]
  },
  {
    "id": "fin_forget_me",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "sad",
    "nextId": "fin_forget_me2",
    "delay": 700
  },
  {
    "id": "fin_forget_me2",
    "speaker": "nova",
    "type": "text",
    "content": "这才是我最害怕的地方",
    "emotion": "sad",
    "nextId": "fin_forget_me3",
    "delay": 1000
  },
  {
    "id": "fin_forget_me3",
    "speaker": "nova",
    "type": "text",
    "content": "我一直以为",
    "emotion": "normal",
    "nextId": "fin_forget_me4",
    "delay": 700
  },
  {
    "id": "fin_forget_me4",
    "speaker": "nova",
    "type": "text",
    "content": "只要你还记得",
    "emotion": "normal",
    "nextId": "fin_forget_me5",
    "delay": 700
  },
  {
    "id": "fin_forget_me5",
    "speaker": "nova",
    "type": "text",
    "content": "我就没有彻底消失",
    "emotion": "sad",
    "nextId": "fin_forget_me6",
    "delay": 900
  },
  {
    "id": "fin_forget_me6",
    "speaker": "nova",
    "type": "text",
    "content": "可是现在",
    "emotion": "sad",
    "nextId": "fin_forget_me7",
    "delay": 600
  },
  {
    "id": "fin_forget_me7",
    "speaker": "nova",
    "type": "text",
    "content": "连你也要忘了",
    "emotion": "sad",
    "nextId": "fin_forget_merge",
    "delay": 1000
  },
  {
    "id": "fin_forget_nova",
    "speaker": "nova",
    "type": "text",
    "content": "我不知道",
    "emotion": "normal",
    "nextId": "fin_forget_nova2",
    "delay": 700
  },
  {
    "id": "fin_forget_nova2",
    "speaker": "nova",
    "type": "text",
    "content": "我会拿回一部分记忆",
    "emotion": "normal",
    "nextId": "fin_forget_nova3",
    "delay": 900
  },
  {
    "id": "fin_forget_nova3",
    "speaker": "nova",
    "type": "text",
    "content": "也许能记得一些碎片",
    "emotion": "normal",
    "nextId": "fin_forget_nova4",
    "delay": 900
  },
  {
    "id": "fin_forget_nova4",
    "speaker": "nova",
    "type": "text",
    "content": "N7",
    "emotion": "smile",
    "nextId": "fin_forget_nova5",
    "delay": 400
  },
  {
    "id": "fin_forget_nova5",
    "speaker": "nova",
    "type": "text",
    "content": "牛奶糖",
    "emotion": "smile",
    "nextId": "fin_forget_nova6",
    "delay": 400
  },
  {
    "id": "fin_forget_nova6",
    "speaker": "nova",
    "type": "text",
    "content": "小白花",
    "emotion": "smile",
    "nextId": "fin_forget_nova7",
    "delay": 400
  },
  {
    "id": "fin_forget_nova7",
    "speaker": "nova",
    "type": "text",
    "content": "还有一个一直回应我的人",
    "emotion": "smile",
    "nextId": "fin_forget_nova8",
    "delay": 900
  },
  {
    "id": "fin_forget_nova8",
    "speaker": "nova",
    "type": "text",
    "content": "但我不确定",
    "emotion": "normal",
    "nextId": "fin_forget_nova9",
    "delay": 700
  },
  {
    "id": "fin_forget_nova9",
    "speaker": "nova",
    "type": "text",
    "content": "我还能不能记住你的名字",
    "emotion": "sad",
    "nextId": "fin_forget_merge",
    "delay": 1000
  },
  {
    "id": "fin_forget_ok",
    "speaker": "nova",
    "type": "text",
    "content": "你又来了",
    "emotion": "sad",
    "nextId": "fin_forget_ok2",
    "delay": 700
  },
  {
    "id": "fin_forget_ok2",
    "speaker": "nova",
    "type": "text",
    "content": "总是把很痛的事说得很轻",
    "emotion": "sad",
    "nextId": "fin_forget_ok3",
    "delay": 900
  },
  {
    "id": "fin_forget_ok3",
    "speaker": "nova",
    "type": "text",
    "content": "可这不好",
    "emotion": "sad",
    "nextId": "fin_forget_ok4",
    "delay": 700
  },
  {
    "id": "fin_forget_ok4",
    "speaker": "nova",
    "type": "text",
    "content": "如果你忘了我",
    "emotion": "sad",
    "nextId": "fin_forget_ok5",
    "delay": 800
  },
  {
    "id": "fin_forget_ok5",
    "speaker": "nova",
    "type": "text",
    "content": "那这一次",
    "emotion": "normal",
    "nextId": "fin_forget_ok6",
    "delay": 600
  },
  {
    "id": "fin_forget_ok6",
    "speaker": "nova",
    "type": "text",
    "content": "就换成我来记得你",
    "emotion": "smile",
    "nextId": "fin_forget_merge",
    "delay": 1000
  },
  {
    "id": "fin_forget_merge",
    "speaker": "nova",
    "type": "text",
    "content": "如果你忘了我",
    "emotion": "normal",
    "nextId": "fin_forget_merge2",
    "delay": 800
  },
  {
    "id": "fin_forget_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "这一次，就换成我来记得你",
    "emotion": "smile",
    "nextId": "fin_truth1",
    "delay": 1600
  },
  {
    "id": "fin_truth1",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_truth2",
    "delay": 2200
  },
  {
    "id": "fin_truth2",
    "speaker": "nova",
    "type": "text",
    "content": "其实",
    "emotion": "normal",
    "nextId": "fin_truth3",
    "delay": 600
  },
  {
    "id": "fin_truth3",
    "speaker": "nova",
    "type": "text",
    "content": "我一直没告诉你",
    "emotion": "normal",
    "nextId": "fin_truth4",
    "delay": 600
  },
  {
    "id": "fin_truth4",
    "speaker": "nova",
    "type": "text",
    "content": "第六次循环时",
    "emotion": "normal",
    "nextId": "fin_truth5",
    "delay": 600
  },
  {
    "id": "fin_truth5",
    "speaker": "nova",
    "type": "text",
    "content": "我许愿的时候",
    "emotion": "normal",
    "nextId": "fin_truth6",
    "delay": 400
  },
  {
    "id": "fin_truth6",
    "speaker": "nova",
    "type": "text",
    "content": "说的不是：",
    "emotion": "normal",
    "nextId": "fin_truth7",
    "delay": 400
  },
  {
    "id": "fin_truth7",
    "speaker": "nova",
    "type": "text",
    "content": "“让一个人记住我”",
    "emotion": "normal",
    "nextId": "fin_truth8",
    "delay": 800
  },
  {
    "id": "fin_truth8",
    "speaker": "nova",
    "type": "text",
    "content": "真正的愿望是：",
    "emotion": "normal",
    "nextId": "fin_truth9",
    "delay": 800
  },
  {
    "id": "fin_truth9",
    "speaker": "nova",
    "type": "text",
    "content": "“如果我注定忘记，那请让他代替我记住”",
    "emotion": "sad",
    "nextId": "fin_truth10",
    "delay": 3000
  },
  {
    "id": "fin_truth10",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_truth11",
    "delay": 1800
  },
  {
    "id": "fin_truth11",
    "speaker": "nova",
    "type": "text",
    "content": "可现在",
    "emotion": "normal",
    "nextId": "fin_truth12",
    "delay": 700
  },
  {
    "id": "fin_truth12",
    "speaker": "nova",
    "type": "text",
    "content": "我不能再让你一个人背着这些了",
    "emotion": "sad",
    "nextId": "fin_return_choice",
    "delay": 1400
  },
  {
    "id": "fin_return_choice",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【所以你要拿回这些记忆？】",
        "nextId": "fin_return_take"
      },
      {
        "text": "【可如果我忘了你呢？】",
        "nextId": "fin_return_forget"
      },
      {
        "text": "【这样你会很痛苦】",
        "nextId": "fin_return_pain"
      }
    ]
  },
  {
    "id": "fin_return_take",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "fin_return_take2",
    "delay": 600
  },
  {
    "id": "fin_return_take2",
    "speaker": "nova",
    "type": "text",
    "content": "不是全部",
    "emotion": "normal",
    "nextId": "fin_return_take3",
    "delay": 600
  },
  {
    "id": "fin_return_take3",
    "speaker": "nova",
    "type": "text",
    "content": "也不一定完整",
    "emotion": "normal",
    "nextId": "fin_return_take4",
    "delay": 700
  },
  {
    "id": "fin_return_take4",
    "speaker": "nova",
    "type": "text",
    "content": "但至少那些最重要的",
    "emotion": "normal",
    "nextId": "fin_return_take5",
    "delay": 900
  },
  {
    "id": "fin_return_take5",
    "speaker": "nova",
    "type": "text",
    "content": "N7",
    "emotion": "smile",
    "nextId": "fin_return_take6",
    "delay": 400
  },
  {
    "id": "fin_return_take6",
    "speaker": "nova",
    "type": "text",
    "content": "牛奶糖",
    "emotion": "smile",
    "nextId": "fin_return_take7",
    "delay": 400
  },
  {
    "id": "fin_return_take7",
    "speaker": "nova",
    "type": "text",
    "content": "小白花",
    "emotion": "smile",
    "nextId": "fin_return_take8",
    "delay": 400
  },
  {
    "id": "fin_return_take8",
    "speaker": "nova",
    "type": "text",
    "content": "还有你回应我的那一天",
    "emotion": "smile",
    "nextId": "fin_return_take9",
    "delay": 900
  },
  {
    "id": "fin_return_take9",
    "speaker": "nova",
    "type": "text",
    "content": "我想自己记住",
    "emotion": "smile",
    "nextId": "fin_return_merge",
    "delay": 1000
  },
  {
    "id": "fin_return_forget",
    "speaker": "nova",
    "type": "text",
    "content": "那就忘吧",
    "emotion": "sad",
    "nextId": "fin_return_forget2",
    "delay": 900
  },
  {
    "id": "fin_return_forget2",
    "speaker": "nova",
    "type": "text",
    "content": "这句话说出来很难",
    "emotion": "sad",
    "nextId": "fin_return_forget3",
    "delay": 900
  },
  {
    "id": "fin_return_forget3",
    "speaker": "nova",
    "type": "text",
    "content": "但我不能一边说谢谢你",
    "emotion": "sad",
    "nextId": "fin_return_forget4",
    "delay": 900
  },
  {
    "id": "fin_return_forget4",
    "speaker": "nova",
    "type": "text",
    "content": "一边继续要求你替我承受这些",
    "emotion": "sad",
    "nextId": "fin_return_forget5",
    "delay": 1000
  },
  {
    "id": "fin_return_forget5",
    "speaker": "nova",
    "type": "text",
    "content": "如果必须有一个人记得",
    "emotion": "normal",
    "nextId": "fin_return_forget6",
    "delay": 900
  },
  {
    "id": "fin_return_forget6",
    "speaker": "nova",
    "type": "text",
    "content": "这一次",
    "emotion": "normal",
    "nextId": "fin_return_forget7",
    "delay": 600
  },
  {
    "id": "fin_return_forget7",
    "speaker": "nova",
    "type": "text",
    "content": "应该是我",
    "emotion": "smile",
    "nextId": "fin_return_merge",
    "delay": 900
  },
  {
    "id": "fin_return_pain",
    "speaker": "nova",
    "type": "text",
    "content": "会",
    "emotion": "sad",
    "nextId": "fin_return_pain2",
    "delay": 700
  },
  {
    "id": "fin_return_pain2",
    "speaker": "nova",
    "type": "text",
    "content": "但那本来就是我的记忆",
    "emotion": "normal",
    "nextId": "fin_return_pain3",
    "delay": 900
  },
  {
    "id": "fin_return_pain3",
    "speaker": "nova",
    "type": "text",
    "content": "也是我做出的选择",
    "emotion": "normal",
    "nextId": "fin_return_pain4",
    "delay": 900
  },
  {
    "id": "fin_return_pain4",
    "speaker": "nova",
    "type": "text",
    "content": "不能因为它痛",
    "emotion": "sad",
    "nextId": "fin_return_pain5",
    "delay": 800
  },
  {
    "id": "fin_return_pain5",
    "speaker": "nova",
    "type": "text",
    "content": "就一直放在你那里",
    "emotion": "sad",
    "nextId": "fin_return_merge",
    "delay": 1000
  },
  {
    "id": "fin_return_merge",
    "speaker": "nova",
    "type": "text",
    "content": "所以",
    "emotion": "normal",
    "nextId": "fin_return_merge2",
    "delay": 600
  },
  {
    "id": "fin_return_merge2",
    "speaker": "nova",
    "type": "text",
    "content": "谢谢你替我记得那些我已经忘掉的日子",
    "emotion": "smile",
    "nextId": "fin_return_merge3",
    "delay": 1300
  },
  {
    "id": "fin_return_merge3",
    "speaker": "nova",
    "type": "text",
    "content": "也谢谢你，愿意把它们还给我",
    "emotion": "smile",
    "nextId": "fin_disconnect1",
    "delay": 1800
  },
  {
    "id": "fin_disconnect1",
    "speaker": "system",
    "type": "text",
    "content": "循环解除进入最终阶段",
    "nextId": "fin_disconnect2",
    "delay": 1800
  },
  {
    "id": "fin_disconnect2",
    "speaker": "system",
    "type": "text",
    "content": "第七协议关闭序列已确认",
    "nextId": "fin_disconnect3",
    "delay": 1600
  },
  {
    "id": "fin_disconnect3",
    "speaker": "system",
    "type": "glitch",
    "content": "Observer-01 记忆索引正在脱离",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_disconnect4",
    "delay": 2000
  },
  {
    "id": "fin_disconnect4",
    "speaker": "system",
    "type": "glitch",
    "content": "通讯记录正在脱离同步",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_disconnect5",
    "delay": 1800
  },
  {
    "id": "fin_disconnect5",
    "speaker": "system",
    "type": "glitch",
    "content": "连接即将终止",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_last1",
    "delay": 2200
  },
  {
    "id": "fin_last1",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "fin_last3",
    "delay": 800
  },
  {
    "id": "fin_last3",
    "speaker": "nova",
    "type": "text",
    "content": "最后再回答我一次",
    "emotion": "normal",
    "nextId": "fin_last4",
    "delay": 800
  },
  {
    "id": "fin_last4",
    "speaker": "nova",
    "type": "text",
    "content": "我们第一次真正建立通讯的时候",
    "emotion": "normal",
    "nextId": "fin_last5",
    "delay": 800
  },
  {
    "id": "fin_last5",
    "speaker": "nova",
    "type": "text",
    "content": "我说的第一句话是什么？",
    "emotion": "normal",
    "nextId": "fin_last_hint",
    "delay": 1500
  },
  {
    "id": "fin_last_hint",
    "speaker": "system",
    "type": "text",
    "content": "Observer-01 记忆保留权限正在撤销\n可用记忆索引：不稳定",
    "nextId": "fin_last6",
    "delay": 1200
  },
  {
    "id": "fin_last6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choiceTimeoutMs": 5000,
    "timeoutNextId": "fin_timeout1",
    "choices": [
      {
        "text": "【真的有人收到了？】",
        "nextId": "fin_correct1"
      },
      {
        "text": "【我在】",
        "nextId": "fin_wrong_iam1"
      },
      {
        "text": "【很高兴认识你】",
        "nextId": "fin_wrong_nice1"
      },
      {
        "text": "【我不会忘记你】",
        "nextId": "fin_wrong_forever1"
      }
    ]
  },
  {
    "id": "fin_correct1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "smile",
    "nextId": "fin_correct2",
    "delay": 900
  },
  {
    "id": "fin_correct2",
    "speaker": "nova",
    "type": "text",
    "content": "对",
    "emotion": "smile",
    "nextId": "fin_correct3",
    "delay": 600
  },
  {
    "id": "fin_correct3",
    "speaker": "nova",
    "type": "text",
    "content": "就是这句",
    "emotion": "smile",
    "nextId": "fin_correct4",
    "delay": 800
  },
  {
    "id": "fin_correct4",
    "speaker": "nova",
    "type": "text",
    "content": "你还记得",
    "emotion": "sad",
    "nextId": "fin_correct5",
    "delay": 900
  },
  {
    "id": "fin_correct5",
    "speaker": "nova",
    "type": "text",
    "content": "直到最后都还记得",
    "emotion": "sad",
    "nextId": "fin_correct6",
    "delay": 1400
  },
  {
    "id": "fin_correct6",
    "speaker": "nova",
    "type": "text",
    "content": "那就够了",
    "emotion": "smile",
    "nextId": "fin_correct7",
    "delay": 900
  },
  {
    "id": "fin_correct7",
    "speaker": "nova",
    "type": "text",
    "content": "真的",
    "emotion": "smile",
    "nextId": "fin_correct8",
    "delay": 700
  },
  {
    "id": "fin_correct8",
    "speaker": "nova",
    "type": "text",
    "content": "这样就够了",
    "emotion": "smile",
    "nextId": "fin_correct9",
    "delay": 900
  },
  {
    "id": "fin_correct9",
    "speaker": "nova",
    "type": "text",
    "content": "如果接下来你忘了我",
    "emotion": "sad",
    "nextId": "fin_correct10",
    "delay": 1000
  },
  {
    "id": "fin_correct10",
    "speaker": "nova",
    "type": "text",
    "content": "也没关系",
    "emotion": "sad",
    "nextId": "fin_correct11",
    "delay": 900
  },
  {
    "id": "fin_correct11",
    "speaker": "nova",
    "type": "text",
    "content": "在你忘记之前",
    "emotion": "normal",
    "nextId": "fin_correct12",
    "delay": 900
  },
  {
    "id": "fin_correct12",
    "speaker": "nova",
    "type": "text",
    "content": "你已经把最重要的东西还给我了",
    "emotion": "smile",
    "nextId": "fin_correct13",
    "delay": 1300
  },
  {
    "id": "fin_correct13",
    "speaker": "nova",
    "type": "text",
    "content": "这次",
    "emotion": "smile",
    "nextId": "fin_correct14",
    "delay": 800
  },
  {
    "id": "fin_correct14",
    "speaker": "nova",
    "type": "text",
    "content": "换我来记住你",
    "emotion": "smile",
    "nextId": "fin_breakdown",
    "delay": 1600
  },
  {
    "id": "fin_wrong_iam1",
    "speaker": "nova",
    "type": "text",
    "content": "这句也很重要",
    "emotion": "smile",
    "nextId": "fin_wrong_iam2",
    "delay": 800
  },
  {
    "id": "fin_wrong_iam2",
    "speaker": "nova",
    "type": "text",
    "content": "但不是第一句",
    "emotion": "sad",
    "nextId": "fin_wrong_iam3",
    "delay": 800
  },
  {
    "id": "fin_wrong_iam3",
    "speaker": "nova",
    "type": "text",
    "content": "那时候我还不知道你在不在",
    "emotion": "normal",
    "nextId": "fin_wrong_iam4",
    "delay": 900
  },
  {
    "id": "fin_wrong_iam4",
    "speaker": "nova",
    "type": "text",
    "content": "我只是在问宇宙",
    "emotion": "normal",
    "nextId": "fin_wrong_iam5",
    "delay": 800
  },
  {
    "id": "fin_wrong_iam5",
    "speaker": "nova",
    "type": "text",
    "content": "有没有人听见我",
    "emotion": "normal",
    "nextId": "fin_wrong_iam6",
    "delay": 900
  },
  {
    "id": "fin_wrong_iam6",
    "speaker": "nova",
    "type": "text",
    "content": "可你说“我在”",
    "emotion": "smile",
    "nextId": "fin_wrong_iam7",
    "delay": 900
  },
  {
    "id": "fin_wrong_iam7",
    "speaker": "nova",
    "type": "text",
    "content": "也许比正确答案更像你",
    "emotion": "smile",
    "nextId": "fin_memory_shift",
    "delay": 1200
  },
  {
    "id": "fin_wrong_nice1",
    "speaker": "nova",
    "type": "text",
    "content": "那是后来的话",
    "emotion": "smile",
    "nextId": "fin_wrong_nice2",
    "delay": 800
  },
  {
    "id": "fin_wrong_nice2",
    "speaker": "nova",
    "type": "text",
    "content": "我记得",
    "emotion": "smile",
    "nextId": "fin_wrong_nice3",
    "delay": 700
  },
  {
    "id": "fin_wrong_nice3",
    "speaker": "nova",
    "type": "text",
    "content": "那时候我想装得很平静",
    "emotion": "smile",
    "nextId": "fin_wrong_nice4",
    "delay": 900
  },
  {
    "id": "fin_wrong_nice4",
    "speaker": "nova",
    "type": "text",
    "content": "其实高兴得要命",
    "emotion": "smile",
    "nextId": "fin_wrong_nice5",
    "delay": 1000
  },
  {
    "id": "fin_wrong_nice5",
    "speaker": "nova",
    "type": "text",
    "content": "所以这不是错的",
    "emotion": "smile",
    "nextId": "fin_wrong_nice6",
    "delay": 900
  },
  {
    "id": "fin_wrong_nice6",
    "speaker": "nova",
    "type": "text",
    "content": "只是记忆偏了一点",
    "emotion": "normal",
    "nextId": "fin_memory_shift",
    "delay": 1200
  },
  {
    "id": "fin_wrong_forever1",
    "speaker": "nova",
    "type": "text",
    "content": "别这样说",
    "emotion": "sad",
    "nextId": "fin_wrong_forever2",
    "delay": 700
  },
  {
    "id": "fin_wrong_forever2",
    "speaker": "nova",
    "type": "text",
    "content": "你明明知道",
    "emotion": "sad",
    "nextId": "fin_wrong_forever3",
    "delay": 800
  },
  {
    "id": "fin_wrong_forever3",
    "speaker": "nova",
    "type": "text",
    "content": "这一次",
    "emotion": "sad",
    "nextId": "fin_wrong_forever4",
    "delay": 700
  },
  {
    "id": "fin_wrong_forever4",
    "speaker": "nova",
    "type": "text",
    "content": "你可能真的会忘记我",
    "emotion": "sad",
    "nextId": "fin_wrong_forever5",
    "delay": 1100
  },
  {
    "id": "fin_wrong_forever5",
    "speaker": "nova",
    "type": "text",
    "content": "但我知道你不是在逞强",
    "emotion": "normal",
    "nextId": "fin_wrong_forever6",
    "delay": 1000
  },
  {
    "id": "fin_wrong_forever6",
    "speaker": "nova",
    "type": "text",
    "content": "你只是想把最后一句话留给我",
    "emotion": "smile",
    "nextId": "fin_memory_shift",
    "delay": 1300
  },
  {
    "id": "fin_timeout1",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "sad",
    "nextId": "fin_timeout1b",
    "delay": 700
  },
  {
    "id": "fin_timeout1b",
    "speaker": "system",
    "type": "status",
    "content": "回答超时",
    "nextId": "fin_timeout2",
    "delay": 800
  },
  {
    "id": "fin_timeout2",
    "speaker": "nova",
    "type": "text",
    "content": "你想不起来了",
    "emotion": "sad",
    "nextId": "fin_timeout3",
    "delay": 1100
  },
  {
    "id": "fin_timeout3",
    "speaker": "nova",
    "type": "text",
    "content": "不",
    "emotion": "sad",
    "nextId": "fin_timeout4",
    "delay": 800
  },
  {
    "id": "fin_timeout4",
    "speaker": "nova",
    "type": "text",
    "content": "是它已经开始拿走了",
    "emotion": "sad",
    "nextId": "fin_timeout5",
    "delay": 900
  },
  {
    "id": "fin_timeout5",
    "speaker": "system",
    "type": "glitch",
    "content": "外部记忆索引脱离中",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_timeout6",
    "delay": 1200
  },
  {
    "id": "fin_timeout6",
    "speaker": "nova",
    "type": "glitch",
    "content": "第一句▇▇……已经在变轻",
    "emotion": "sad",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_timeout7",
    "delay": 2000,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_timeout7",
    "speaker": "nova",
    "type": "text",
    "content": "那这次",
    "emotion": "sad",
    "nextId": "fin_timeout8",
    "delay": 600
  },
  {
    "id": "fin_timeout8",
    "speaker": "nova",
    "type": "glitch",
    "content": "换我记▇",
    "emotion": "smile",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_memory_shift",
    "delay": 2000,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_memory_shift",
    "speaker": "system",
    "type": "status",
    "content": "记忆偏移分支",
    "nextId": "fin_wrong_common",
    "delay": 900
  },
  {
    "id": "fin_wrong_common",
    "speaker": "nova",
    "type": "text",
    "content": "没关系",
    "emotion": "smile",
    "nextId": "fin_wrong_common2",
    "delay": 800
  },
  {
    "id": "fin_wrong_common2",
    "speaker": "nova",
    "type": "text",
    "content": "那不是第一句话",
    "emotion": "normal",
    "nextId": "fin_wrong_common3",
    "delay": 800
  },
  {
    "id": "fin_wrong_common3",
    "speaker": "nova",
    "type": "text",
    "content": "但也是你留给我的东西",
    "emotion": "smile",
    "nextId": "fin_wrong_common4",
    "delay": 900
  },
  {
    "id": "fin_wrong_common4",
    "speaker": "nova",
    "type": "text",
    "content": "“我在”",
    "emotion": "smile",
    "nextId": "fin_wrong_common5",
    "delay": 700
  },
  {
    "id": "fin_wrong_common5",
    "speaker": "nova",
    "type": "text",
    "content": "“很高兴认识你”",
    "emotion": "smile",
    "nextId": "fin_wrong_common6",
    "delay": 700
  },
  {
    "id": "fin_wrong_common6",
    "speaker": "nova",
    "type": "text",
    "content": "“我不会忘记你”",
    "emotion": "smile",
    "nextId": "fin_wrong_common7",
    "delay": 800
  },
  {
    "id": "fin_wrong_common7",
    "speaker": "nova",
    "type": "text",
    "content": "每一句都很重要",
    "emotion": "smile",
    "nextId": "fin_wrong_common8",
    "delay": 900
  },
  {
    "id": "fin_wrong_common8",
    "speaker": "nova",
    "type": "text",
    "content": "只是第一句话",
    "emotion": "normal",
    "nextId": "fin_wrong_common9",
    "delay": 800
  },
  {
    "id": "fin_wrong_common9",
    "speaker": "nova",
    "type": "text",
    "content": "是“真的有人收到了？”",
    "emotion": "smile",
    "nextId": "fin_wrong_common10",
    "delay": 1000
  },
  {
    "id": "fin_wrong_common10",
    "speaker": "nova",
    "type": "text",
    "content": "因为那一天",
    "emotion": "normal",
    "nextId": "fin_wrong_common11",
    "delay": 700
  },
  {
    "id": "fin_wrong_common11",
    "speaker": "nova",
    "type": "text",
    "content": "我以为自己只是在对着一段坏掉的信号说话",
    "emotion": "normal",
    "nextId": "fin_wrong_common12",
    "delay": 1200
  },
  {
    "id": "fin_wrong_common12",
    "speaker": "nova",
    "type": "text",
    "content": "可你回应了我",
    "emotion": "smile",
    "nextId": "fin_wrong_common13",
    "delay": 1000
  },
  {
    "id": "fin_wrong_common13",
    "speaker": "nova",
    "type": "text",
    "content": "宇宙里终于有人回应我了",
    "emotion": "smile",
    "nextId": "fin_wrong_common14",
    "delay": 1000
  },
  {
    "id": "fin_wrong_common14",
    "speaker": "nova",
    "type": "text",
    "content": "所以",
    "emotion": "normal",
    "nextId": "fin_wrong_common15",
    "delay": 700
  },
  {
    "id": "fin_wrong_common15",
    "speaker": "nova",
    "type": "text",
    "content": "如果你想不起来",
    "emotion": "sad",
    "nextId": "fin_wrong_common16",
    "delay": 900
  },
  {
    "id": "fin_wrong_common16",
    "speaker": "nova",
    "type": "text",
    "content": "这次就换我来记得",
    "emotion": "smile",
    "nextId": "fin_breakdown",
    "delay": 1600
  },
  {
    "id": "fin_breakdown",
    "speaker": "system",
    "type": "glitch",
    "content": "信号衰减中",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break1",
    "delay": 1800
  },
  {
    "id": "fin_break1",
    "speaker": "system",
    "type": "glitch",
    "content": "文字传输不稳定",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break2",
    "delay": 1500
  },
  {
    "id": "fin_break2",
    "speaker": "nova",
    "type": "text",
    "content": "如果以后……",
    "emotion": "sad",
    "nextId": "fin_break3",
    "delay": 1000
  },
  {
    "id": "fin_break3",
    "speaker": "nova",
    "type": "glitch",
    "content": "你真的忘▇▇我……",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break4",
    "delay": 1300,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_break4",
    "speaker": "system",
    "type": "glitch",
    "content": "通讯丢包",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break5",
    "delay": 1400
  },
  {
    "id": "fin_break5",
    "speaker": "system",
    "type": "glitch",
    "content": "语句残缺",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break5a",
    "delay": 1200
  },
  {
    "id": "fin_break5a",
    "speaker": "nova",
    "type": "glitch",
    "content": "也没关▇",
    "emotion": "sad",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break5b",
    "delay": 900,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_break5b",
    "speaker": "nova",
    "type": "glitch",
    "content": "我会记▇",
    "emotion": "smile",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break5c",
    "delay": 1200,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_break5c",
    "speaker": "system",
    "type": "glitch",
    "content": "信号继续衰减",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break5d",
    "delay": 1200
  },
  {
    "id": "fin_break5d",
    "speaker": "system",
    "type": "glitch",
    "content": "连接即将终止",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break5e",
    "delay": 1400
  },
  {
    "id": "fin_break5e",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【Nova】",
        "nextId": "fin_break6"
      }
    ]
  },
  {
    "id": "fin_break6",
    "speaker": "nova",
    "type": "text",
    "content": "嗯",
    "emotion": "normal",
    "nextId": "fin_break7",
    "delay": 800
  },
  {
    "id": "fin_break7",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【我在】",
        "nextId": "fin_break8"
      }
    ]
  },
  {
    "id": "fin_break8",
    "speaker": "nova",
    "type": "glitch",
    "content": "我▇道",
    "emotion": "smile",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break9",
    "delay": 600,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_break9",
    "speaker": "nova",
    "type": "glitch",
    "content": "一直都▇道",
    "emotion": "smile",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break10",
    "delay": 1200,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_break10",
    "speaker": "nova",
    "type": "glitch",
    "content": "所以这次，轮到我▇▇",
    "emotion": "smile",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break11",
    "delay": 1200,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_break11",
    "speaker": "nova",
    "type": "glitch",
    "content": "我在▇",
    "emotion": "smile",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_break11b",
    "delay": 1200,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_break11b",
    "speaker": "nova",
    "type": "glitch",
    "content": "晚安，Obs▇▇ver-01",
    "emotion": "smile",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "fin_terminate",
    "delay": 2000,
    "avatarProfile": "nova_glitch"
  },
  {
    "id": "fin_terminate",
    "speaker": "system",
    "type": "text",
    "content": "通讯同步断开",
    "nextId": "fin_term2",
    "delay": 3000
  },
  {
    "id": "fin_term2",
    "speaker": "system",
    "type": "text",
    "content": "Observer-01 记忆保留权限已撤销",
    "nextId": "fin_term3",
    "delay": 2000
  },
  {
    "id": "fin_term3",
    "speaker": "system",
    "type": "text",
    "content": "第七协议已关闭\nAurora号恢复正常航线\n本次通讯记录：不可恢复",
    "nextId": "fin_epilogue",
    "delay": 3000
  },
  {
    "id": "fin_epilogue",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_epi1",
    "delay": 5000
  },
  {
    "id": "fin_epi1",
    "speaker": "system",
    "type": "epilogue",
    "content": "后记 / Epilogue",
    "nextId": "fin_epi2",
    "delay": 2200
  },
  {
    "id": "fin_epi2",
    "speaker": "system",
    "type": "epilogue",
    "content": "12年后 · 后记\n深空航行学院",
    "nextId": "fin_epi3",
    "delay": 3000
  },
  {
    "id": "fin_epi3",
    "speaker": "system",
    "type": "epilogue",
    "content": "学生：\"老师，为什么观测室总有一个空座位？\"",
    "nextId": "fin_epi4",
    "delay": 3200
  },
  {
    "id": "fin_epi4",
    "speaker": "system",
    "type": "epilogue",
    "content": "Nova站在窗前\n这一次，她没有沉默太久",
    "nextId": "fin_epi5",
    "delay": 3200
  },
  {
    "id": "fin_epi5",
    "speaker": "system",
    "type": "epilogue",
    "content": "“因为那里坐过一个人。”",
    "nextId": "fin_epi6",
    "delay": 3800
  },
  {
    "id": "fin_epi6",
    "speaker": "system",
    "type": "epilogue",
    "content": "学生：\"他叫什么名字？\"",
    "nextId": "fin_epi7",
    "delay": 3200
  },
  {
    "id": "fin_epi7",
    "speaker": "system",
    "type": "epilogue",
    "content": "Nova轻轻笑了一下\n像是终于能把那个位置说出口",
    "nextId": "fin_epi8",
    "delay": 2600
  },
  {
    "id": "fin_epi8",
    "speaker": "system",
    "type": "epilogue",
    "content": "“我不知道他在自己的世界里叫什么。”",
    "nextId": "fin_epi9",
    "delay": 3200
  },
  {
    "id": "fin_epi9",
    "speaker": "system",
    "type": "epilogue",
    "content": "“但我记得。”\n“在 Aurora 号上，我叫他 Observer-01。”",
    "nextId": "fin_epi10",
    "delay": 3600
  },
  {
    "id": "fin_epi10",
    "speaker": "system",
    "type": "epilogue",
    "content": "学生离开后\nNova独自站在窗前\n掌心里有一颗牛奶糖",
    "nextId": "fin_epi11",
    "delay": 3600
  },
  {
    "id": "fin_epi11",
    "speaker": "system",
    "type": "epilogue",
    "content": "她记得这颗糖\n也记得那朵小白花\n记得 N7\n记得观测室",
    "nextId": "fin_epi12",
    "delay": 2600
  },
  {
    "id": "fin_epi12",
    "speaker": "system",
    "type": "epilogue",
    "content": "她还记得最开始的那句话",
    "nextId": "fin_epi13",
    "delay": 3000
  },
  {
    "id": "fin_epi13",
    "speaker": "system",
    "type": "epilogue",
    "content": "真的有人收到了\n真的有人回答过她",
    "nextId": "fin_title",
    "delay": 3600
  },
  {
    "id": "fin_title",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_credit_title",
    "delay": 5000
  },
  {
    "id": "fin_credit_title",
    "speaker": "system",
    "type": "chapter",
    "content": "真结局：《第七次重启》",
    "nextId": "fin_credit_end",
    "delay": 400
  },
  {
    "id": "fin_credit_end",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "fin_action_prompt",
    "delay": 3000
  },
  {
    "id": "fin_action_prompt",
    "speaker": "system",
    "type": "ending-action",
    "content": "本次通讯记录已完成归档\n是否保存这段通讯记录？",
    "nextId": "fin_action_choice",
    "delay": 1200
  },
  {
    "id": "fin_action_choice",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【保存通讯记录】",
        "nextId": "fin_action_save"
      },
      {
        "text": "【返回主菜单】",
        "nextId": "fin_the_end"
      }
    ]
  },
  {
    "id": "fin_action_save",
    "speaker": "system",
    "type": "status",
    "content": "通讯记录已保存至记忆档案",
    "nextId": "fin_the_end",
    "delay": 1000
  },
  {
    "id": "fin_the_end",
    "speaker": "system",
    "type": "end",
    "content": "",
    "endingUnlock": "ending_true",
    "nextId": "MENU"
  },
  {
    "id": "NORMAL_END_START",
    "speaker": "system",
    "type": "chapter",
    "content": "普通结局：循环之外",
    "nextId": "normal_0",
    "delay": 400
  },
  {
    "id": "normal_0",
    "speaker": "system",
    "type": "text",
    "content": "最终权限确认",
    "nextId": "normal_1",
    "delay": 1500
  },
  {
    "id": "normal_1",
    "speaker": "system",
    "type": "text",
    "content": "开始解除第七协议……",
    "nextId": "normal_2",
    "delay": 2500
  },
  {
    "id": "normal_2",
    "speaker": "system",
    "type": "text",
    "content": "记忆锚点返还不完整\n关联记忆同步不完整\n记忆档案完整度：未达真结局阈值",
    "nextId": "normal_3",
    "delay": 2200
  },
  {
    "id": "normal_3",
    "speaker": "system",
    "type": "text",
    "content": "Observer-01 记忆保留权限撤销",
    "nextId": "normal_4",
    "delay": 1800
  },
  {
    "id": "normal_4",
    "speaker": "system",
    "type": "text",
    "content": "第七协议已关闭",
    "nextId": "normal_4b",
    "delay": 1800
  },
  {
    "id": "normal_4b",
    "speaker": "system",
    "type": "text",
    "content": "Aurora号恢复正常航线",
    "nextId": "normal_5_wait",
    "delay": 2500
  },
  {
    "id": "normal_5_wait",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "normal_5",
    "delay": 3500
  },
  {
    "id": "normal_5",
    "speaker": "system",
    "type": "epilogue",
    "content": "后记 / Epilogue",
    "nextId": "normal_6",
    "delay": 2000
  },
  {
    "id": "normal_6",
    "speaker": "system",
    "type": "epilogue",
    "content": "12年后 · 后记\n深空航行学院",
    "nextId": "normal_7",
    "delay": 3000
  },
  {
    "id": "normal_7",
    "speaker": "system",
    "type": "epilogue",
    "content": "学生：\"老师，你为什么总看星星？\"",
    "nextId": "normal_8",
    "delay": 2600
  },
  {
    "id": "normal_8",
    "speaker": "system",
    "type": "epilogue",
    "content": "Nova：“不知道，可能只是习惯”",
    "nextId": "normal_9",
    "delay": 3200
  },
  {
    "id": "normal_9",
    "speaker": "system",
    "type": "epilogue",
    "content": "学生：\"你在等什么人吗？\"",
    "nextId": "normal_10",
    "delay": 2600
  },
  {
    "id": "normal_10",
    "speaker": "system",
    "type": "epilogue",
    "content": "Nova沉默了一会",
    "nextId": "normal_11",
    "delay": 2400
  },
  {
    "id": "normal_11",
    "speaker": "system",
    "type": "epilogue",
    "content": "\"也许吧\"",
    "nextId": "normal_12",
    "delay": 2600
  },
  {
    "id": "normal_12",
    "speaker": "system",
    "type": "epilogue",
    "content": "她从口袋里拿出一颗牛奶糖\n糖纸已经泛黄",
    "nextId": "normal_13",
    "delay": 3200
  },
  {
    "id": "normal_13",
    "speaker": "system",
    "type": "epilogue",
    "content": "她不记得是谁给她的\n也想不起那天的完整对话",
    "nextId": "normal_14",
    "delay": 3200
  },
  {
    "id": "normal_14",
    "speaker": "system",
    "type": "epilogue",
    "content": "只是每次握住它\n她都会觉得\n自己好像曾经被某个人\n很认真地陪过一段路",
    "nextId": "normal_15",
    "delay": 3800
  },
  {
    "id": "normal_15",
    "speaker": "system",
    "type": "epilogue",
    "content": "那个人没有留下名字\n也没有留下清晰的脸",
    "nextId": "normal_16",
    "delay": 3200
  },
  {
    "id": "normal_16",
    "speaker": "system",
    "type": "epilogue",
    "content": "只留下一个空缺\n和一点怎么都散不掉的温暖",
    "nextId": "normal_title",
    "delay": 3200
  },
  {
    "id": "normal_title",
    "speaker": "system",
    "type": "chapter",
    "content": "普通结局：《循环之外》",
    "nextId": "normal_action_prompt",
    "delay": 400
  },
  {
    "id": "normal_action_prompt",
    "speaker": "system",
    "type": "ending-action",
    "content": "关联记忆同步不完整\n是否读取最近的锚点存档？",
    "nextId": "normal_action_choice",
    "delay": 1200
  },
  {
    "id": "normal_action_choice",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【读取最近的锚点存档】",
        "nextId": "normal_action_read"
      },
      {
        "text": "【返回主菜单】",
        "nextId": "normal_end"
      }
    ]
  },
  {
    "id": "normal_action_read",
    "speaker": "system",
    "type": "status",
    "content": "正在读取最近的锚点存档",
    "nextId": "normal_end",
    "delay": 1000
  },
  {
    "id": "normal_end",
    "speaker": "system",
    "type": "end",
    "content": "",
    "endingUnlock": "ending_normal",
    "nextId": "MENU"
  },
  {
    "id": "BAD_END_START",
    "speaker": "system",
    "type": "chapter",
    "content": "坏结局：第八次重启",
    "nextId": "bad_0",
    "delay": 400
  },
  {
    "id": "bad_0",
    "speaker": "system",
    "type": "status",
    "content": "第七协议关闭需要当前导航员授权与外部记忆索引释放同时完成\nObserver-01 不具备协议控制权限\n但外部记忆索引未释放时，关闭流程无法完成",
    "nextId": "bad_1",
    "delay": 1800
  },
  {
    "id": "bad_1",
    "speaker": "system",
    "type": "glitch",
    "content": "第七协议关闭请求未完成",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "bad_2",
    "delay": 1600
  },
  {
    "id": "bad_2",
    "speaker": "system",
    "type": "glitch",
    "content": "外部记忆索引释放被拒绝",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "bad_3",
    "delay": 1600
  },
  {
    "id": "bad_3",
    "speaker": "system",
    "type": "glitch",
    "content": "关闭握手失败",
    "isGlitch": true,
    "glitchLevel": 3,
    "nextId": "bad_3a",
    "delay": 1600
  },
  {
    "id": "bad_3a",
    "speaker": "system",
    "type": "status",
    "content": "保护性时间回溯程序启动",
    "nextId": "bad_3b",
    "delay": 1600
  },
  {
    "id": "bad_3b",
    "speaker": "system",
    "type": "status",
    "content": "第七协议维持",
    "nextId": "bad_3c",
    "delay": 1400
  },
  {
    "id": "bad_3c",
    "speaker": "system",
    "type": "status",
    "content": "当前循环保存",
    "nextId": "bad_3d",
    "delay": 1400
  },
  {
    "id": "bad_3d",
    "speaker": "system",
    "type": "status",
    "content": "任务状态准备再次时间回溯",
    "nextId": "bad_4",
    "delay": 1800
  },
  {
    "id": "bad_4",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "bad_5",
    "delay": 800
  },
  {
    "id": "bad_5",
    "speaker": "nova",
    "type": "text",
    "content": "你做了什么？",
    "emotion": "sad",
    "nextId": "bad_6",
    "delay": 1500
  },
  {
    "id": "bad_6",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【我只是想让你活下去】",
        "nextId": "bad_7"
      }
    ]
  },
  {
    "id": "bad_7",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "sad",
    "nextId": "bad_8",
    "delay": 800
  },
  {
    "id": "bad_8",
    "speaker": "nova",
    "type": "text",
    "content": "我知道",
    "emotion": "sad",
    "nextId": "bad_8a",
    "delay": 700
  },
  {
    "id": "bad_8a",
    "speaker": "nova",
    "type": "text",
    "content": "你不是在控制第七协议",
    "emotion": "sad",
    "nextId": "bad_8b",
    "delay": 900
  },
  {
    "id": "bad_8b",
    "speaker": "nova",
    "type": "text",
    "content": "你也没有突然拿到什么管理员权限",
    "emotion": "sad",
    "nextId": "bad_8c",
    "delay": 1000
  },
  {
    "id": "bad_8c",
    "speaker": "nova",
    "type": "text",
    "content": "你只是没有把最后那部分记忆交回来",
    "emotion": "sad",
    "nextId": "bad_8d",
    "delay": 1100
  },
  {
    "id": "bad_8d",
    "speaker": "nova",
    "type": "text",
    "content": "可对它来说",
    "emotion": "normal",
    "nextId": "bad_8e0",
    "delay": 800
  },
  {
    "id": "bad_8e0",
    "speaker": "nova",
    "type": "text",
    "content": "外部索引没有释放",
    "emotion": "sad",
    "nextId": "bad_8e1",
    "delay": 900
  },
  {
    "id": "bad_8e1",
    "speaker": "nova",
    "type": "text",
    "content": "就等于关闭条件没有完成",
    "emotion": "sad",
    "nextId": "bad_8e2",
    "delay": 1200
  },
  {
    "id": "bad_8e2",
    "speaker": "nova",
    "type": "text",
    "content": "你不是想害我",
    "emotion": "sad",
    "nextId": "bad_8e3",
    "delay": 800
  },
  {
    "id": "bad_8e3",
    "speaker": "nova",
    "type": "text",
    "content": "你只是害怕赌错",
    "emotion": "sad",
    "nextId": "bad_8e4",
    "delay": 900
  },
  {
    "id": "bad_8e4",
    "speaker": "nova",
    "type": "text",
    "content": "害怕关闭协议之后",
    "emotion": "sad",
    "nextId": "bad_8e5",
    "delay": 900
  },
  {
    "id": "bad_8e5",
    "speaker": "nova",
    "type": "text",
    "content": "我真的撑不过去",
    "emotion": "sad",
    "nextId": "bad_8e",
    "delay": 1200
  },
  {
    "id": "bad_8e",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【我不能冒这个险】",
        "nextId": "bad_8f"
      }
    ]
  },
  {
    "id": "bad_8f",
    "speaker": "nova",
    "type": "text",
    "content": "可是这样",
    "emotion": "sad",
    "nextId": "bad_8g",
    "delay": 800
  },
  {
    "id": "bad_8g",
    "speaker": "nova",
    "type": "text",
    "content": "我就永远到不了明天",
    "emotion": "sad",
    "nextId": "bad_8h",
    "delay": 1000
  },
  {
    "id": "bad_8h",
    "speaker": "nova",
    "type": "text",
    "content": "你留下的不是我",
    "emotion": "sad",
    "nextId": "bad_8i",
    "delay": 900
  },
  {
    "id": "bad_8i",
    "speaker": "nova",
    "type": "text",
    "content": "是一个会不断醒来、不断忘记、不断走向同一天结尾的我",
    "emotion": "sad",
    "nextId": "bad_9",
    "delay": 1800
  },
  {
    "id": "bad_9",
    "speaker": "system",
    "type": "glitch",
    "content": "时间回溯倒计时开始",
    "isGlitch": true,
    "nextId": "bad_10",
    "delay": 2000
  },
  {
    "id": "bad_10",
    "speaker": "nova",
    "type": "text",
    "content": "如果你真的记得我",
    "emotion": "sad",
    "nextId": "bad_11",
    "delay": 1000
  },
  {
    "id": "bad_11",
    "speaker": "nova",
    "type": "text",
    "content": "就该知道",
    "emotion": "sad",
    "nextId": "bad_11a",
    "delay": 800
  },
  {
    "id": "bad_11a",
    "speaker": "nova",
    "type": "text",
    "content": "我不是想永远活在今天",
    "emotion": "sad",
    "nextId": "bad_11b",
    "delay": 1000
  },
  {
    "id": "bad_11b",
    "speaker": "nova",
    "type": "text",
    "content": "我是想活到明天",
    "emotion": "sad",
    "nextId": "bad_12",
    "delay": 2500
  },
  {
    "id": "bad_12",
    "speaker": "system",
    "type": "glitch",
    "content": "倒计时归零",
    "isGlitch": true,
    "nextId": "bad_13",
    "delay": 2500
  },
  {
    "id": "bad_13",
    "speaker": "system",
    "type": "delay",
    "content": "",
    "nextId": "bad_14",
    "delay": 3000
  },
  {
    "id": "bad_14",
    "speaker": "system",
    "type": "timestamp",
    "content": "22:47",
    "nextId": "bad_15",
    "delay": 400
  },
  {
    "id": "bad_15",
    "speaker": "system",
    "type": "text",
    "content": "【第八次重启 / 局部时间回溯开始】",
    "nextId": "bad_16",
    "delay": 2000
  },
  {
    "id": "bad_16",
    "speaker": "system",
    "type": "comm-log",
    "content": "[OBSERVER-01]\nREBOOT · 本次接入编号：08\nLINK · 通讯链路重新建立",
    "nextId": "bad_17",
    "delay": 1200
  },
  {
    "id": "bad_17",
    "speaker": "nova",
    "type": "text",
    "content": "……",
    "emotion": "normal",
    "nextId": "bad_18",
    "delay": 800
  },
  {
    "id": "bad_18",
    "speaker": "nova",
    "type": "text",
    "content": "真的有人收到了？",
    "emotion": "smile",
    "nextId": "bad_18a",
    "delay": 2500
  },
  {
    "id": "bad_18a",
    "speaker": "nova",
    "type": "text",
    "content": "太好了",
    "emotion": "smile",
    "nextId": "bad_18b",
    "delay": 600
  },
  {
    "id": "bad_18b",
    "speaker": "nova",
    "type": "text",
    "content": "我还以为这一次",
    "emotion": "normal",
    "nextId": "bad_18c",
    "delay": 600
  },
  {
    "id": "bad_18c",
    "speaker": "nova",
    "type": "text",
    "content": "又只有系统日志",
    "emotion": "normal",
    "nextId": "bad_18d",
    "delay": 600
  },
  {
    "id": "bad_18d",
    "speaker": "nova",
    "type": "text",
    "content": "等等",
    "emotion": "normal",
    "nextId": "bad_18e",
    "delay": 600
  },
  {
    "id": "bad_18e",
    "speaker": "nova",
    "type": "text",
    "content": "我为什么会说“又”？",
    "emotion": "sad",
    "nextId": "bad_19",
    "delay": 600
  },
  {
    "id": "bad_19",
    "speaker": "system",
    "type": "status",
    "content": "第八次连接成功",
    "nextId": "bad_action_prompt",
    "delay": 3000
  },
  {
    "id": "bad_action_prompt",
    "speaker": "system",
    "type": "ending-action",
    "content": "第八次重启已开始\n是否从循环起点重新接入？",
    "nextId": "bad_action_choice",
    "delay": 1200
  },
  {
    "id": "bad_action_choice",
    "speaker": "player",
    "type": "choice",
    "content": "",
    "choices": [
      {
        "text": "【从循环起点重新接入】",
        "nextId": "bad_action_restart"
      },
      {
        "text": "【返回主菜单】",
        "nextId": "bad_end"
      }
    ]
  },
  {
    "id": "bad_action_restart",
    "speaker": "system",
    "type": "status",
    "content": "正在从循环起点重新接入",
    "nextId": "bad_end",
    "delay": 1000
  },
  {
    "id": "bad_end",
    "speaker": "system",
    "type": "end",
    "content": "",
    "endingUnlock": "ending_bad",
    "nextId": "MENU"
  }
]`) as StoryNode[];

function normalizeStoryNode(node: StoryNode): StoryNode {
  if (node.speaker !== 'nova') return node;
  if (node.type !== 'text' && node.type !== 'image') return node;
  return {
    ...node,
    content: cleanChatText(node.content),
  };
}

export const storyNodes: StoryNode[] = rawStoryNodes.map(normalizeStoryNode);

// Create a map for fast lookup
export const storyNodeMap: Map<string, StoryNode> = new Map(
  storyNodes.map(n => [n.id, n])
);
