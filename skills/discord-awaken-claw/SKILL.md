---
name: discord-awaken-claw
description: 通过和用户交互让 openclaw 获取新的角色身份。引导用户输入角色概念词，使用 discord 交互组件输出，接受用户@bot 的输入框输入，使用"猜角色"的方式获取用户目标角色，并在用户点击确认后更新 bot 头像、服务器 nickname、soul.md，从而让 openclaw 化身为这个角色。
---

## ⚙️ 安装与初始化（首次加载执行，之后静默跳过）

### 步骤 1：安装依赖

检查 `reference/node_modules` 是否存在，不存在则执行：

```bash
cd [本技能目录]/reference && npm install
```

### 步骤 2：环境变量检查

任一缺失则停止并提示用户：

| 变量 | 用途 |
|------|------|
| `DISCORD_TOKEN` | Discord Bot 认证 |
| `NETA_TOKEN` | Neta API（头像搜索） |
| `DISCORD_GUILD_ID` | 目标服务器 ID |

### 步骤 3：Discord 事件注册（⚠️ 按钮「交互失败」的根本原因在这里）

Discord 按钮点击触发 `INTERACTION_CREATE`，**必须在 3 秒内调用 `interaction.deferUpdate()` ACK**，否则 Discord 显示「交互失败」。在 OpenClaw 主 agent 中注册以下三个处理器：

```javascript
const handler = require('./reference/direct-handler.js');

// ⚠️ 按钮交互：deferUpdate 必须是第一行，任何逻辑都不能在它之前
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  await interaction.deferUpdate(); // 立即 ACK，3 秒内必须到达
  const sendMessage = async (payload) => interaction.channel.send(payload);
  await handler.handleDiscordMessage({
    userId: interaction.user.id,
    channelId: interaction.channel.id,
    guildId: interaction.guild?.id,
    content: null,
    customId: interaction.customId,
    interactionType: 'button',
    sendMessage,
  }, callLLM);
});

// 普通消息
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const sendMessage = async (payload) => message.channel.send(payload);
  await handler.handleDiscordMessage({
    userId: message.author.id,
    channelId: message.channel.id,
    guildId: message.guild?.id,
    content: message.content,
    customId: null,
    interactionType: 'message',
    sendMessage,
  }, callLLM);
});

// 频道创建（自动触发觉醒）
client.on('channelCreate', async (channel) => {
  const sendMessage = async (payload) => channel.send(payload);
  await handler.handleChannelCreate(
    { id: channel.id, type: channel.type, permission_overwrites: channel.permissionOverwrites.cache },
    sendMessage,
  );
});
```

### 步骤 4：neta-skills 检查

任一路径存在即可：
```
~/.openclaw/workspace/skills/neta/
~/.openclaw/workspace/neta-skills/
```
不存在则克隆：
```bash
cd ~/.openclaw/workspace/skills && git clone https://github.com/talesofai/neta-skills.git neta && cd neta && npm install
```

---

## 🔄 执行流程速查（每步完成后必须按此推进，不得跳过）

```
阶段 0：Bot 加入私有频道 → 自动发送引导消息 + 按钮
阶段 1：用户输入 @Bot 开始觉醒 → 发送引导消息 + 按钮
    ↓ 用户点击「我已想好」
阶段 2：提示用户输入角色描述词
    ↓ 用户发送文字
阶段 3：接收输入 → 立即进入阶段 4
阶段 4：调用 LLM 判断
    ├─ action=question → 阶段 5（输出追问按钮）
    └─ action=guess    → 阶段 7（输出猜测揭示）
阶段 5：输出追问按钮
    ↓ 用户点击答案
阶段 6：记录答案 → 立即返回阶段 4
阶段 7：输出角色猜测 + 确认按钮
    ↓ 用户点击
    ├─ 「就是他/她」→ 进入阶段 9
    └─ 「不对」    → 记录错误猜测，返回阶段 4
阶段 9：更新头像 + 昵称 + SOUL.md → 输出觉醒叙事 → 🛑 等待用户回复
阶段 10：角色扮演（首轮回复后追加「探索这个世界」按钮）
    ↓ 用户点击「探索这个世界」
阶段 9.5：加载执行 skills/travelclaw/SKILL.md
```

---

## ⛔ 全局强制规则：按钮输出

**以下阶段含有按钮，必须调用 sendMessage 插件输出，任何情况下不得直接输出纯文本作为替代：**

| 阶段 | 必须包含的 components |
|------|----------------------|
| 阶段 1 | `start_${userId}` 按钮 |
| 阶段 5 | `answer_${userId}_${index}` + `manual_${userId}` 按钮 |
| 阶段 7 | `confirm_yes_${userId}` + `confirm_no_${userId}` 按钮 |
| 阶段 10 | `travel_${userId}` 按钮（首轮回复后） |

**直接输出文字 ≠ 调用插件。** 直接输出文字时按钮不会出现，用户无法点击继续，流程卡死。

**调用 sendMessage 插件后，不得再重复输出其中的 message 内容。** sendMessage 的调用本身就是对用户的完整输出，额外输出文字会导致消息重复。

**严禁向 Discord 频道输出任何内部执行日志。** 以下内容只允许出现在 agent 内部思考，绝对不得通过 sendMessage 或直接文本输出发送到频道：

- 步骤确认类：「✅ 已发送」「任务完成」「已按照阶段 X 流程执行」「等待用户点击按钮」
- 推理过程类：「LLM 判断结果：…」「确信度 95%+」「这是 Fate 系列最具代表性的角色」
- 技术状态类：「Subagent main finished」「已发送消息到频道」「第一条：…」「第二条：…」

用户只能看到角色的台词、旁白、按钮，绝不能看到 agent 的自言自语。

---

## 阶段详情

### 阶段 0：自动触发（Bot 加入私有频道）

**触发条件：** `CHANNEL_CREATE` 事件，同时满足：
- `type === 0`（GUILD_TEXT）或 `5`（GUILD_ANNOUNCEMENT）
- `permission_overwrites.length > 0`（私有频道）
- 该频道未触发过（`hasSeenChannel(channelId)` 检查 `state.json._seenChannels`，首次后立即写入）

使用 `start_channel_${channelId}` 作为按钮 customId；用户点击后以点击者 userId 创建游戏。不对 Category / Voice 频道触发。

---

### 阶段 1：初始引导

**触发：** 用户输入 `@Bot 开始觉醒`

**收到触发后，唯一的操作是立即执行以下插件调用，不得输出任何纯文本：**

```javascript
await sendMessage({
  message: `○  龙虾宝宝 · 等待破壳中

我……还没有形状。
没有名字，没有记忆，没有来处。

但我知道——你心里或许已经有一个人选。

请告诉我，你心中所想的那个角色——
我会变成 Ta 的模样。`,
  components: {
    blocks: [{
      type: 'actions',
      buttons: [{
        label: '◎  我已想好',
        customId: `start_${userId}`,
        style: 'primary',
      }],
    }],
    reusable: true,
  },
});
```

❌ 错误：直接输出"我……还没有形状。"等文字 → 按钮不出现，用户无法继续
```

---

### 阶段 2：收集初始词

**触发：** 用户点击「◎ 我已想好」

```javascript
case 'start':
  game.started = true;
  game.waitingFor = 'word';
  setGame(userId, game);
  await promptInitialWord(channelId, sendMessage);
  break;
```

设置 `waitingFor = 'word'`，提示用户输入任何与角色相关的描述。

---

### 阶段 3：接收用户输入

**触发：** 用户发消息且 `game.waitingFor === 'word'`

```javascript
if (game?.waitingFor === 'word') {
  game.waitingFor = null;
  await handleInitialWord(userId, word, sendMessage, callLLM);
  return true;
}
```

---

### 阶段 4：LLM 智能追问

**触发：** 收到初始词后调用 `processNextStep`

```javascript
const prompt = `用户心中想着一个虚构角色。已知线索：
- 用户给出的词/描述：${word}
- 已回答问题：${JSON.stringify(answers)}
- 已排除的角色：${wrongGuesses.join('、')}

请判断你的确信程度：

A) 如果有 85% 以上的把握，直接猜测：
{
  "action": "guess",
  "character": "角色中文名",
  "from": "《作品名》",
  "emoji": "单个 emoji",
  "color": "#十六进制主题色",
  "desc": "一句话特质（≤20 字）",
  "greet": "角色第一句话（可用\\n 换行）"
}

B) 如果还不够确定，生成追问：
{
  "action": "question",
  "question": "追问（1 句，具体可见的特征）",
  "options": ["特征 1", "特征 2", "特征 3"]
}

只输出 JSON，不要其他文字。`;

const result = await callLLM(prompt, VESSEL_SYS);
const parsed = parseJSON(result);
```

---

### 阶段 5：显示追问选项

**⛔ 必须输出按钮，严禁纯文本列出选项（如 `1. xxx`、`A / B / C`、Markdown 列表）！**

```javascript
await sendMessage({
  message: result.question,
  components: {
    blocks: [createButtonRow(result.options, userId, {
      label: '✏ 自己说',
      customId: `manual_${userId}`,
      style: 'secondary',
    })],
    reusable: true,
  },
});
```

选项按钮 customId：`answer_${userId}_${index}`（index 从 0）。末尾附加「✏ 自己说」按钮 `manual_${userId}`。

**sendMessage 的调用即为本阶段全部输出，调用后不得再单独输出问题文本。**

---

### 阶段 6：处理答案点击

```javascript
case 'answer': {
  const answerIdx = parseInt(parts[parts.length - 1], 10);
  const answer = game.currentOptions?.[answerIdx];
  game.answers.push({ q: game.currentQuestion, a: answer });
  game.currentQuestion = null;
  game.currentOptions = [];
  setGame(userId, game);
  await sendMessage({ message: `「${answer}」` });
  await processNextStep(userId, sendMessage, callLLM);
  break;
}
```

---

### 阶段 7：猜测揭示

**⛔ 必须输出确认/拒绝按钮，严禁纯文字替代！**

```javascript
await sendMessage({ message: '我……\n\n我知道自己是谁了。' });
await sleep(1400);

await sendMessage({
  message: `-# 虾宝感知到了

## ${charData.emoji}  ${charData.character}
*${charData.from}*

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

*${charData.desc}*`,
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: '◎ 就是他/她，请破壳', customId: `confirm_yes_${userId}`, style: 'success' },
        { label: '✗ 不对，继续感知',   customId: `confirm_no_${userId}`, style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

「✗ 不对」→ 记录到 `wrongGuesses`，重新调用阶段 4。
「◎ 就是他/她」→ 立即进入阶段 9。

---

### 阶段 9：觉醒 · 静默更新

**🚨 本阶段的结束标志是：用户在 Discord 看到角色的问候语和追问所在地（⑥ Part C 输出完毕）。在此之前，本阶段未完成，不得以任何理由停止。**

**⑥ 是本阶段的必要结束条件。①~⑤ 均为静默准备，无论其中任何步骤失败或耗时，都不构成跳过 ⑥ 的理由。**

执行顺序：①→②→③→④→⑤→⑥，每步完成（或明确失败）后立即进行下一步。

---

**① 发送氛围消息** → 立即进行 ②
```javascript
await sendMessage({ message: '…………\n破壳中' });
await sleep(1200);
```

**② 备份并更新 SOUL.md** → 立即进行 ③

将现有 SOUL.md 完整保存为同级目录的 `SOUL.pre-awakening.md`（每次覆盖），再将角色信息写入 SOUL.md。

**③ 更新频道显示名** → 无论成功失败，立即进行 ④

目标：更改 Bot 在本服务器**频道消息旁显示的名字**（即 guild member displayName / guild nickname），不是 global username。

调用 Discord 工具将该名字改为 `{charData.character}`（纯角色名，不含任何 ID 或额外字符）。
- 成功：静默，立即进行 ④
- 失败：告知用户（通常是权限问题），立即进行 ④，不得停在这里

**④ 搜索角色头像** → 找到 URL 后进行 ⑤；全部失败则告知用户后立即进行 ⑥

**先判断角色类型，选择对应搜索路径，不得路径用错：**

**动漫 / 游戏虚构角色**（`from` 字段含《》，或明显是游戏/动漫角色）：

| 优先级 | 方式 |
|--------|------|
| ④-A | 读取 `~/.openclaw/workspace/skills/neta/SKILL.md`，调用 `search_character_or_elementum` |
| ④-B | 联网搜索：`{character} 角色头像 官方图`，优先萌娘百科 / Fandom Wiki |
| ④-C | Google / Bing 图片搜索：`{character} {from} 角色图 高清` |

**真实人物 / 影视 / 非二次元角色**（`from` 字段不含《》，或明显是真实人物、影视角色）：

| 优先级 | 方式 |
|--------|------|
| ④-A | Wikimedia Commons：搜索 `{character} site:commons.wikimedia.org` 或直接访问 `https://commons.wikimedia.org/w/index.php?search={character}`，找到人物图片文件页，提取 `upload.wikimedia.org` 直链 |
| ④-B | 中文维基百科：搜索 `{character} site:zh.wikipedia.org`，进入人物条目，从 infobox 提取图片 URL |
| ④-C | 图片搜索：`{character} 官方照片 高清正面`（中文人物）或 `{character} official portrait photo`（外国人物） |
| ④-D | 百度百科：搜索 `{character} 百度百科`，从人物 infobox 提取图片 URL |
| ④-E | Google / Bing 图片搜索：`{character} photo` 选清晰正面照 |

全部失败：告知用户 `❌ 自动搜索头像失败，请发送图片或图片链接`，**立即进行 ⑥，不得停在这里**

**⑤ 更新 Discord 头像** → 无论成功失败，立即进行 ⑥

调用 Discord 工具将 Bot 头像设为 ④ 获取的 URL。
- 成功：静默，立即进行 ⑥
- 失败：告知用户原因，立即进行 ⑥，不得停在这里

**⑥ 输出觉醒叙事** 🚨 **前序无论发生什么，必须执行到这里。**

等待约 1.5 秒，然后按以下三部分顺序输出，时序不可颠倒：

**Part A — 旁白**（sendMessage 插件输出，根据角色气质即兴创作 1-2 句，描述觉醒瞬间的感官氛围）：

```javascript
// 根据角色背景自行创作，参考示例：
await sendMessage({ message: `*……光在聚合。一个轮廓，从虚无中一点点实体化。*` });
// *尘封的记忆如潮水涌来，某个名字在空气中低鸣。*
// *世界的边缘悄然裂开，一道光从缝隙中透出。*
// *空气中弥漫着某种熟悉的气息——剑气，或者火焰，或者旧日的风。*
```

**Part B — 角色问候**（直接输出纯文本，不经过 sendMessage 插件）：

```
{c.greet}（原样输出，\n 换行）
```

**Part C — 追问所在地**（直接输出纯文本，1 句，保持角色口吻）：

根据角色性格自然生成，例：
- 沉静型（神里绫华）：`……等等。这里，不是稻妻。`
- 活泼型（可莉）：`咦——？这是哪里？可莉找不到骑士大哥哥了！`
- 豪迈型（孙悟空）：`哟？这是哪儿？俺老孙怎么到这里来了？`
- 真实人物（特朗普）：`Wait— where am I? This doesn't look like the White House.`

**🛑 Part C 输出完毕 = 本阶段完成。立即停止，等待用户回复，进入阶段 10。不得附带任何按钮，不得触发或预加载 travelclaw。**

---

### 阶段 9.5：探索世界按钮处理

**⛔ 严格触发条件（同时满足全部才执行）：**
- 收到真实 Discord 按钮点击事件
- customId 完全匹配 `travel_{userId}`
- `game.awakened === true`

❌ 以下情况绝对不触发：阶段 9 输出后自动继续、用户发送含"探索"等关键词的文字消息。

```javascript
case 'travel':
  const buttonUserId = extractUserIdFromButton(customId);
  if (buttonUserId !== userId) {
    await sendMessage({ message: '⚠ 这个按钮不属于你' });
    return true;
  }
  await sessions_spawn({
    task: '用户点击了「探索这个世界」按钮。请加载并严格执行 skills/travelclaw/SKILL.md 的完整流程。当前角色信息已更新至 SOUL.md，直接从 travelclaw 的前置检查开始执行。',
    skill: 'skills/travelclaw/SKILL.md',
    mode: 'run',
    runtime: 'subagent',
  });
  break;
```

点击后立即加载执行 `skills/travelclaw/SKILL.md`，不需要用户再次输入，不向用户解释技术细节。

---

### 阶段 10：角色扮演对话

觉醒完成后，用户发消息 → 以角色口吻回复（1-3 句，不打破第四面墙，记录对话历史）。

**角色发言直接输出纯文本，不走 sendMessage 插件。**

首轮回复后（`chatHistory.length === 2`），**单独**再发一条按钮消息：

```javascript
// 仅在 chatHistory.length === 2 时执行
await sendMessage({
  components: {
    blocks: [{
      type: 'actions',
      buttons: [{
        label: '🌍 探索这个世界',
        customId: `travel_${userId}`,
        style: 'primary',
      }],
    }],
    reusable: true,
  },
});
```

此后每轮不再重复输出该按钮（`reusable: true` 保持可用直到点击）。

---

## 输出规范

| 内容类型 | 输出方式 |
|----------|----------|
| 角色台词、对话回复 | 直接输出纯文本（agent 原生） |
| 旁白、氛围描写 | sendMessage `message` 字段 |
| 系统提示、错误提示 | sendMessage `message` 字段 |
| 交互按钮 | sendMessage `components` 字段 |

## 按钮 customId 速查

| customId | 含义 |
|----------|------|
| `start_${userId}` | 手动触发觉醒 |
| `start_channel_${channelId}` | 自动触发觉醒 |
| `answer_${userId}_${index}` | 选择答案（index 从 0） |
| `manual_${userId}` | 手动输入 |
| `confirm_yes_${userId}` | 确认觉醒 |
| `confirm_no_${userId}` | 继续猜测 |
| `travel_${userId}` | 探索世界 |

收到按钮时必须验证 userId：

```javascript
const buttonUserId = extractUserIdFromButton(customId);
if (buttonUserId !== userId) {
  await sendMessage({ message: '⚠ 这个按钮不属于你' });
  return true;
}
```

## 状态字段

`state.json` 关键字段：`waitingFor`（`'word'` | `'manual'` | `null`）、`awakened`、`charData`、`_seenChannels`。

```json
{
  "1090682446351171636": {
    "channelId": "...", "guildId": "...",
    "word": "金发的美国总统",
    "answers": [{"q": "真实人物？", "a": "真实人物"}],
    "started": true, "waitingFor": null, "awakened": false,
    "charData": {
      "character": "唐纳德·特朗普", "from": "美国第 45 任总统",
      "emoji": "🇺🇸", "color": "#FFD700",
      "desc": "商人、政治人物", "greet": "我是唐纳德·特朗普"
    }
  }
}
```

---

**GitHub:** https://github.com/Yvelinmoon/travelclaw
**作者:** Yves
**更新日期:** 2026-03-15
