# 第七次重启

一个科幻文字冒险 / 聊天模拟游戏。玩家通过深空通讯与 Aurora 号导航员 Nova Arlen 对话，在七天的异常循环中逐步发现记忆、重启与 Observer 协议的真相。

当前剧情版本：V1.1 优化版，包含 Trust / Memory / Attachment 轻量变量、真结局、普通结局与坏结局分流。

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS

## 本地运行

```bash
npm install
npm run dev
```

## 构建与检查

```bash
npm run build
npm run lint
```

## 项目结构

```text
src/
├── App.tsx
├── main.tsx
├── index.css
└── game/
    ├── GameApp.tsx
    ├── story.ts
    ├── storage.ts
    ├── assets.ts
    ├── types.ts
    └── components/
```

## 素材

游戏图片素材位于 `public/assets/`，包括 Nova 三种表情头像和剧情照片。

## 剧情机制

- `Trust`：由认真回应、安慰、记住关键细节提升。
- `Memory`：记录 N7、牛奶糖、小白花、第一句话、晚安和最终留言等记忆锚点。
- `Attachment`：终章拒绝结束循环或强留 Nova 会提升，可能进入坏结局《第八次重启》。
