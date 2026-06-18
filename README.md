# 第七次重启

《第七次重启》是一款关于记忆、重启与陪伴的科幻聊天叙事游戏。

你将作为 Observer-01，接入一段不该存在的通讯。

在七次重启之中，Nova Arlen 会一次次忘记你。而你的任务不是拯救她，而是替她记住那些被世界抹去的日子。

当前版本：V1.0

## 核心特色

- Observer-01 记忆载体视角
- 记忆锚点系统
- Nova 遗忘机制
- 第七协议
- 聊天式科幻叙事
- 围绕记忆、陪伴、告别与执念的多结局分支

## 剧情机制

- `Trust`：Nova 是否信任 Observer-01，范围 0-6。
- `Memory`：Observer-01 对循环真相的理解程度，范围 0-6。
- `Attachment`：Observer-01 对 Nova 的依赖与执念程度，范围 0-6。
- `MemoryAnchors`：玩家替 Nova 保存的关键记忆，每个锚点只记录一次。
- `AcceptFarewell`：玩家最终是否愿意结束循环并接受告别。
- `ContactStage`：通讯者身份揭示阶段，按 `unknown -> named -> verified` 推进。

## 结局条件

- 真结局《第七次重启》：`Trust >= 4`、`Memory >= 4`、`MemoryAnchors.length >= 5`，且必须包含 `first_message` 与 `n7` 锚点，`AcceptFarewell === true`。
- 普通结局《循环之外》：接受告别结束循环，但未满足真结局条件。
- 坏结局《第八次重启》：拒绝告别（`AcceptFarewell === false` 或终局选择 `refuse_farewell`）。

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

游戏图片素材位于 `public/assets/`。
