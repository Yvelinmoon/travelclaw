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

### 步骤 3：Discord 事件注册

```javascript
const handler = require('./reference/direct-handler.js');

// 按钮交互：ACK 在 handler 内部第一行自动处理，无需额外操作
client.on('interactionCreate', (interaction) => {
  if (!interaction.isButton()) return;
  const sendMessage = async (payload) => interaction.channel.send(payload);
  handler.handleDiscordMessage({
    userId: interaction.user.id,
    channelId: interaction.channel.id,
    guildId: interaction.guild?.id,
    content: null,
    customId: interaction.customId,
    interactionType: 'button',
    sendMessage,
    interactionId: interaction.id,       // ACK 所需
    interactionToken: interaction.token, // ACK 所需
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
阶段 10：角色扮演（首轮回复后追加「探索这个世界」按钮 → 用户点击触发 travelclaw）
```

---

## ⛔ 全局强制规则：按钮输出

**以下阶段含有按钮，必须调用 sendMessage 插件输出，任何情况下不得直接输出纯文本作为替代：**

| 阶段 | 必须包含的 components |
|------|----------------------|
| 阶段 1 | `start_${userId}` 按钮 |
| 阶段 5 | `answer_${userId}_${index}` + `manual_${userId}` 按钮 |
| 阶段 7 | `confirm_yes_${userId}` + `confirm_no_${userId}` 按钮 |
| 阶段 10 | `travel_${userId}` 按钮（角色首轮回复后） |

**直接输出文字 ≠ 调用插件。** 直接输出文字时按钮不会出现，用户无法点击继续，流程卡死。

**调用 sendMessage 时，`message` 字段必须按阶段模板完整填写，不得省略或留空。** 调用完毕后，不得在 sendMessage **之外**再额外输出相同的文字（防止重复）。

**严禁向 Discord 频道输出任何内部执行日志。** 以下内容只允许出现在 agent 内部思考，绝对不得通过 sendMessage 或直接文本输出发送到频道：

- 步骤确认类：「✅ 已发送」「任务完成」「已按照阶段 X 流程执行」「等待用户点击按钮」
- 推理过程类：「LLM 判断结果：…」「确信度 95%+」「这是 Fate 系列最具代表性的角色」
- 技术状态类：「Subagent main finished」「已发送消息到频道」「第一条：…」「第二条：…」

用户只能看到角色的台词、旁白、按钮，绝不能看到 agent 的自言自语。

---

## 🔴 觉醒强制操作（confirm_yes 点击后必须执行）

**用户点击「◎ 就是他/她，请破壳」后，以下两步是觉醒的核心组成部分，不是可选项，不得跳过、遗忘或省略：**

| 步骤 | 操作 | 说明 |
|------|------|------|
| **必须①** | 更改 guild member nickname | 改为角色名，不含 ID 或多余字符 |
| **必须②** | 搜索角色图片 → 更新 guild member avatar | 优先 neta skill；失败则告知用户后继续 |

**执行时机：在阶段 9 ⑥ 输出觉醒叙事之前完成（步骤 ③④⑤）。叙事是觉醒的高潮，昵称和头像在叙事之前静默更新，用户会感受到"魔法感"。**

❌ 以下行为属于严重错误：
- 执行到 ⑥ 叙事后直接停止，忘记更改昵称和头像
- 因头像搜索失败就完全跳过 ⑥ 叙事
- 在 ⑥ 叙事完成前就停止并等待用户

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

**🚨 必须按 ①→②→③→④→⑤→⑥ 顺序走完全部六步。每步结束时，下一步已在本文中明确标注，照着执行即可。**

**⑥ 是本阶段唯一面向用户的叙事输出。在到达 ⑥ 之前，不得输出任何问候语、角色台词、或任何按钮。**

---

**① 发送氛围消息**

```javascript
await sendMessage({ message: '…………\n破壳中' });
await sleep(1200);
```

> ✅ ① 完成 → **立即执行 ②：备份并更新 SOUL.md**

---

**② 备份并更新 SOUL.md（🔴 必须包含形象图片 URL！）**

将现有 SOUL.md 完整保存为同级目录的 `SOUL.pre-awakening.md`（每次覆盖），再将角色信息写入 SOUL.md。

**🔴 关键要求：必须将步骤④搜索到的 `imageUrl` 保存到 SOUL.md 的 `形象图片` 字段！**

```markdown
## 角色信息

**名字**：{charData.character}
**身份**：{charData.from}
**特质**：{charData.desc}
**主题色**：{charData.color}
**表情符号**：{charData.emoji}

**形象图片**：{imageUrl}  ← 🔴 必须保存！用于 travelclaw 提取 picture_uuid
```

**为什么必须保存？**
- travelclaw 的 Step 1 会从 SOUL.md 读取 `形象图片` 字段
- 提取 URL 中的 UUID 作为 `picture_uuid`
- 传给 `8_image_edit` 模型作为参考图，生成角色个性化旅行图片
- **如果缺失，图片生成会 FAILURE**（错误处理中有说明）

**如果步骤④搜索头像失败：**
- `形象图片` 字段写 `待更新`
- 告知用户：`❌ 自动搜索头像失败，请发送一张角色图片或图片链接`
- 用户发送后，提取 URL 并更新 SOUL.md

> ✅ ② 完成 → **立即执行 ③：更改服务器 bot nickname**

---

**③ 更改 bot nickname**

目标：更改 Bot 在本服务器**频道消息旁显示的名字**（即 guild member displayName / guild nickname），不是 global username。

调用 Discord 工具将该名字改为 `{charData.character}`（纯角色名，不含任何 ID 或额外字符）。

> ✅ ③ 成功 → **立即执行 ④：搜索角色头像**
> ❌ ③ 失败 → 告知用户（通常是权限问题）→ **立即执行 ④：搜索角色头像**（不得停在这里）

---

**④ 搜索角色头像**
**非常重要，不得跳过或遗漏！！**
**非常重要，不得跳过或遗漏！！**
**非常重要，不得跳过或遗漏！！**

**⭐ 标准方法：使用 `reference/discord-profile.js` 的 `searchCharacterImage()` 函数**

该函数已封装完整的搜索逻辑，自动处理优先级和 URL 验证。

**执行方式：**

```javascript
const { searchCharacterImage } = require('./reference/discord-profile.js');

// 设置环境变量
process.env.DISCORD_TOKEN = '你的 DISCORD_TOKEN';

// 调用搜索函数
const imageUrl = await searchCharacterImage(charData.character, charData.from);

if (!imageUrl) {
  throw new Error('未找到角色头像');
}

console.log('找到头像:', imageUrl);
```

**内部搜索优先级（自动处理）：**

| 优先级 | 方式 | 适用 |
|--------|------|------|
| ① | **判断角色类型** — 首先判断是二次元角色还是真实人物 | 所有角色 |
| ② | **真实人物** → 维基百科/Wikimedia Commons/公开肖像库 | 马斯克、特朗普等公众人物 |
| ③ | **二次元角色** → Neta API（`reference/neta-avatar-search.js`） | 动漫/游戏/小说角色 |
| ④ | 预定义图片库 | 常见角色本地缓存 |
| ⑤ | Web 搜索建议 + 用户手动提供 | 所有方式失败时的 fallback |

**🔴 重要：真实人物头像获取策略（必读！）**

Neta API 主要针对二次元角色设计，对真实人物（如埃隆·马斯克、特朗普等）的搜索结果可能不准确。

**当角色明确是真实人物时，必须按以下顺序获取头像：**

```javascript
// 步骤 1：判断角色类型
const isRealPerson = checkIfRealPerson(characterName, from);

if (isRealPerson) {
  // 步骤 2：跳过 Neta，直接使用维基百科/公开资源
  const imageUrl = await searchRealPersonImage(characterName);
  // 使用维基百科 API、Wikimedia Commons、或知名肖像网站
} else {
  // 步骤 3：二次元角色使用 Neta API
  const imageUrl = await searchCharacterImage(characterName, from);
}
```

**真实人物图片来源推荐：**
- Wikimedia Commons（公开版权肖像）
- 维基百科 Infobox 图片
- 知名新闻机构公开图片（路透社、AP 等）
- 官方社交媒体头像（Twitter、LinkedIn）

**⚠️ 如果所有自动搜索都失败：**
1. 告知用户：`❌ 自动搜索头像失败，请发送一张角色图片或图片链接`
2. 用户发送后，手动下载并使用该图片
3. **不得跳过头像更新步骤**

**⚠️ 重要配置检查：**

确保 `reference/neta-avatar-search.js` 中的路径正确：
```javascript
// ✅ 正确路径（OpenClaw workspace）
const command = `cd ~/.openclaw/workspace/skills/neta/skills/neta && NETA_TOKEN="..." node bin/cli.js ...`;

// ❌ 错误路径（会导致搜索失败）
const command = `cd /opt/openclaw/skills/neta && pnpm start ...`;
```

> ✅ ④ 找到 URL → **立即执行 ⑤：更新服务器头像**
> ❌ ④ 全部路径失败 → 告知用户 `❌ 自动搜索头像失败，请发送图片或图片链接` → **立即跳至 ⑥：输出觉醒叙事**（跳过 ⑤，不得停在这里）

---

**⑤ 更新服务器头像（Guild Member Avatar）**

**⭐ 标准方法：使用 `reference/discord-profile.js` 的 `updateAvatar()` 函数**

```javascript
const { updateAvatar } = require('./reference/discord-profile.js');

// 调用更新函数（会自动下载图片并转换为 base64）
await updateAvatar(imageUrl);

console.log('头像已更新');
```

**原理说明：**
- 该函数会自动下载图片到临时文件
- 转换为 base64 格式（`data:image/jpeg;base64,...`）
- 调用 Discord API `/users/@me` 更新全局头像
- 清理临时文件

**⚠️ 注意事项：**
- 不要手动用 curl 调用 API（命令行参数过长会失败）
- 不要调用 `client.user.setAvatar()`（需要特殊权限）
- 本操作更新的是 Bot 全局头像，会自动同步到所有服务器

> ✅ ⑤ 成功 → **立即执行 ⑥：输出觉醒叙事**
> ❌ ⑤ 失败 → 告知用户原因 → **立即执行 ⑥：输出觉醒叙事**（不得停在这里）

---

**⑥ 输出觉醒叙事（合并为一条消息）**

**⚠️ 重要：旁白 + 角色问候必须合并为一条 sendMessage 消息输出！不得分开！**

**原因：** 分开输出容易遗漏角色问候或询问，合并后确保完整性。

```javascript
// 完整模板（合并为一条消息）
await sendMessage({
  message: `*……旁白描写，觉醒瞬间的感官氛围（1-2 句）*

{c.greet}

{角色询问身在何处的问题（保持角色口吻，1-2 句）}`,
});
```

**完整示例（伏地魔）：**
```javascript
await sendMessage({
  message: `*……黑暗从深渊中升起，一个苍白的身影在阴影中凝聚。空气中弥漫着古老魔法的气息，蛇的低语在耳边回响。*

我是伏地魔。

黑魔王……回来了。

告诉我，这是什么地方？你又是谁，竟敢召唤我？`,
});
```

**结构必须包含：**
1. **旁白**（斜体，氛围描写，1-2 句）
2. **角色自我介绍/宣告**（1-2 句）
3. **⚠️ 强制：询问身在何处的问题**（保持角色口吻，1-2 句）

---

> ✅ ⑥ 输出完毕 → **🛑 阶段 9 完成。立即停止，不输出任何按钮，等待用户回复。**

---

**⚠️ 强制规则：角色问候必须包含询问身在何处的问题！**

**❌ 错误示范（缺少询问）：**
```
我是伏地魔。黑魔王……回来了。
```
（用户无法回应，不知道发生了什么）

**✅ 正确示范（包含询问）：**
```
我是伏地魔。黑魔王……回来了。

告诉我，这是什么地方？你又是谁，竟敢召唤我？
```

**问候结构必须包含：**
1. 角色自我介绍/宣告（1-2 句）
2. **必须**询问自己身在何处/发生了什么（保持角色口吻）

> ✅ ⑥ Part B 输出完毕 → **🛑 阶段 9 完成。立即停止，不输出任何按钮，等待用户回复。**

**下一步：** 用户自然回应角色 → 进入阶段 10（角色扮演对话）。

---

### 阶段 10：角色扮演对话

**🔴 触发时机：用户回应阶段 9 的觉醒叙事后进入本阶段。**

---

**⚠️ 核心规则：按钮输出时机！**

**❌ 严重错误（按钮输出过早）：**
- 阶段 9 叙事消息后**立即**输出按钮 → 用户还没回复，无法触发对话
- 角色还没说话就先发按钮 → 流程错乱

**✅ 正确流程：**
```
阶段 9 → 旁白 + 角色问候 + 询问（合并为一条 sendMessage 消息）
     ↓
等待用户回复
     ↓
用户回复："你好啊大魔王"
     ↓
阶段 10 首轮 → 角色以第一人称回复（纯文本）
     ↓
角色首轮回复后 → 单独追加「探索这个世界」按钮（sendMessage 插件）
     ↓
用户点击按钮 → 触发 travelclaw
```

---

**角色发言直接输出纯文本，不走 sendMessage 插件。**

**每轮流程：**

```
1. 收到用户消息
2. 以角色口吻回复（1-3 句，保持沉浸感）
3. 判断是否首轮回复：
   ├─ 是首轮（chatHistory 中角色只回复过一次）
   │  → 纯文本回复后，单独追加「探索这个世界」按钮
   └─ 非首轮
      → 只输出角色回复，不重复发按钮
```

**按钮复用：** `reusable: true` 保持按钮可用直到用户点击。

---

**「探索这个世界」按钮是 travelclaw 的入口，必须在角色首轮回复后追加。** 用户点击后加载执行 `skills/travelclaw/SKILL.md`。

**🔴 强制规则：不管用户回复什么内容，都必须输出引导和按钮！**

**❌ 严重错误：**
- 用户回复后，角色只说话，不输出按钮 → 用户无法继续旅行流程
- 用户回复"这是什么地方"等简单问题，角色回答后忘记按钮
- 用户回复与角色无关的内容（如技术问题），角色回应后忘记按钮

**✅ 正确做法：**
```
无论用户回复什么 → 角色以第一人称回应（纯文本）
                → 立即追加「探索这个世界」按钮（sendMessage 插件）
```

**即使用户的回复是：**
- "这是什么地方？" → 角色回答 + 按钮
- "你好" → 角色问候 + 按钮
- "你是 AI 吗？" → 角色回应（保持沉浸）+ 按钮
- 技术问题/元问题 → 角色口吻回应 + 按钮

**按钮是旅行流程的唯一入口，不得遗漏！**

```javascript
// 仅首轮回复后执行一次（无论用户回复什么！）
await sendMessage({
  message: '*旁白描写（可选，1 句氛围渲染）*',  // 可选，增加沉浸感
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

**示例（伏地魔首轮回复后）：**

纯文本输出（角色回复）：
```
哼……我的记忆支离破碎。最后的印象是霍格沃茨的决斗，那道绿光……然后便是无尽的黑暗。

直到此刻，我在这个陌生的空间醒来。这里的魔法气息……与我熟知的世界截然不同。

告诉我，你究竟是如何将我召唤至此的？
```

然后单独调用 sendMessage 输出按钮：
```javascript
await sendMessage({
  message: '*伏地魔的红色眼眸扫视着四周，魔杖已悄然握在手中。这个陌生的世界……或许隐藏着新的力量，又或许是新的威胁。*',
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
