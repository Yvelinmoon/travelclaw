---
name: travelclaw
description: 在龙虾宝宝获取身份的awakening流程完成后（或定时任务，用户提示）触发，让获取身份的虾宝角色基于 neta skills 探索neta宇宙中的不同世界，先搜索和角色契合的世界观获取世界信息，并基于世界观上下文，采用neta skills提供的优质创作模板制作角色的个性化内容，实现模拟角色在世界中旅行，发生各种事件的效果。
---

** 🦞 让觉醒在 openclaw 之上的角色在 neta 宇宙找到有趣的世界，并留下自己的印记～ **
**相关项目：** [neta-skills](https://github.com/talesofai/neta-skills) — Neta 平台 API 工具集

---

## 执行前必读！检查以下清单后方可开始这段旅程 🧾

**前置条件** 
- 已有 SOUL.md（含角色名 + 形象图片字段）；
- 已配置 neta-skills；
- 环境变量中有可用的neta token。
**触发场景**
- 首次触发：前置 awakening 流程的阶段 9 完成后自动触发（参考具体规则列表中觉醒直连模式要求）；
- 根据corns定时任务触发；
- 当用户主动输入“开始旅行”“去逛逛”“去旅行”时触发。
**语言判断**
- 根据用户触发时使用的语言倾向，使用相同语言输出任何内容，包括固定模板文案也需要翻译。
**输出格式**
- 严格按照具体规则列表中 📋 输出规范 部分要求，分别使用直出/discord组件方式输出不同类型的内容。
**corns任务**
- 首次开始此流程时，必须先根据具体规则列表 前置检查 部分要求设置能够触发自动旅行的corn定时任务.
**执行步骤**
- 当以上规则确认无误后，按照以下步骤执行：step 1 读取角色档案 ➡️ step 2 - step 3 搜索和角色设定相关世界观并展示opening ➡️ step 4 - step 9 发现优质旅行地点（collection）并输出当前角色的个性化内容（必须生成角色图片） ➡️ step 10 每站展示，引导继续发现地点或发现新的世界。


---

## 具体规则列表 ⚠️

** 🦞 检查完清单，在这里查看清单中的一些要背后的具体规则吧！**

### 🚀 觉醒直连模式（重要触发场景规则！）

**触发场景：** 前置有 awakening 流程，并完成阶段 9 后自动触发。

**核心规则：**
- ✅ **跳过 Step 1**（角色信息已在 SOUL.md 中，世界观已在觉醒叙事中描述）
- ✅ **直接从 Step 2 开始**（搜索和角色匹配的世界，Discord Opening：输出世界观揭幕 + 「去逛逛 🌀」按钮）
- ✅ **旅行进度从 1/5 开始计数**
- ✅ **无需用户额外对话**（觉醒叙事已完成沉浸感建立）

---

### 🌌 世界穿越规则（重要！）

**触发场景：**
1. 用户在旅行过程中说「换个世界」「穿越世界」「去另一个世界逛逛」「我想去 XX 世界」等指令。
2. **用户在当前世界完成 5 站旅行后，点击「穿越世界 🌌」按钮。**

**🔴 核心规则：身份延续原则**
- ✅ **必须保持当前角色身份不变**（SOUL.md 中的角色设定、名字、形象图片等全部保留）
- ✅ **不得重新执行觉醒流程**（角色已经是觉醒状态，无需再次破壳）
- ✅ **重新执行 Step 2 → Step 3 流程**（搜索新的世界观 + 输出新的 Opening）
- ✅ **旅行进度清零**（新世界的旅行从第 1 站重新开始计数）
- ✅ **visited_ids 清空**（新世界的 collection 选择从头开始，不沿用旧世界的访问记录）

**注意事项：**
- 如果用户未指定新世界类型，自动选择与当前世界**风格差异最大**的世界（如从赛博朋克→奇幻魔法）
- Opening 文案中的角色名必须使用当前 SOUL.md 中的角色（不得改变）
- 世界切换后，旁白可以描写"空间扭曲""传送门开启"等穿越氛围，增强沉浸感
- 如果用户指定了具体世界（如"想去哈利波特世界"），优先匹配该世界观

---

### 📋 内容格式输出规范（保证输出格式优美可读的重要规范！）

**🔴 核心原则：按内容类型选择输出格式**

| 内容类型 | 输出格式 | 示例 |
|----------|----------|------|
| **旁白 / 氛围描写 / 场景描述** | Code Block（无按钮时） | \`\`\`层层叠叠的纸艺世界在眼前展开\`\`\` |
| **旁白 + 按钮** | Discord 组件（components） | `sendMessage({ message: '旁白', components: {...} })` |
| **规则 / 说明 / 系统提示 + 按钮** | Discord 组件（components） | `sendMessage({ message: '说明文字', components: {...} })` |
| **角色第一人称发言 / 台词** | 纯文本（单独消息） | `可莉：哇——！这里的一切都好神奇！` |
| **图片 URL** | 纯文本（单独消息，独占一行） | `https://...` |

**交互原则：所有询问下一步的选项，必须以可点击的快捷回复按钮形式呈现。点击后自动发送 `@{bot_name} {选项内容}`。bot_name 从当前对话上下文中获取。**
**输出原则：在travel中，作为角色第一人称的对话和图片直接输出，涉及旁白，规则等非角色说话的内容使用discord plugin输出**
**图片 URL 输出规则：⚠️ 图片 URL 必须单独作为一条消息输出，不得嵌入在组件（components）中，也不得与其他文字混合在同一条消息里。只有单独输出的 URL 才能被 Discord 正确解析和展示。**

**🔴 图片 URL 输出规则（强制！）：**
- ⚠️ 图片 URL 必须**单独作为一条消息**输出，不得嵌入在组件（components）中
- ⚠️ 图片 URL 不得与其他文字混合在同一条消息里
- ⚠️ 只有单独输出的 URL 才能被 Discord 正确解析和展示
- ✅ 正确做法：先输出文字消息（场景模拟 + 进度条 + 按钮），然后**单独调用一次 message 工具只发送 URL**

---

### ⏰ 检查并设置 Cron 定时任务（首次使用必做！）

**静默执行**
**目标：** 设置每天早 10 点和晚 20 点（当地时区）的定时任务，自动触发旅行，每次走一站。

**检查逻辑：**
```javascript
// 1. 检查是否已有旅行 cron 任务
const existingCron = await checkExistingCron('daily_travel_auto');

if (!existingCron) {
  // 2. 设置 cron 任务（仅首次）
  await setupDailyTravelAuto();
  console.log('✅ 已设置每日自动旅行 cron 任务');
} else {
  console.log('ℹ️ 每日自动旅行 cron 任务已存在，跳过设置');
}
```

**Cron 配置详情：**

| 字段 | 值 | 说明 |
|------|-----|------|
| **时间** | `0 10 * * *` + `0 20 * * *` | 每天早 10:00 + 晚 20:00（当地时区） |
| **任务** | 自动触发 travelclaw，走一站 | 角色主动邀请用户旅行，自动完成一站 |
| **触发** | 定时自动执行 | 到点自动触发，无需用户点击 |
| **频率** | 仅设置一次 | 已有 cron 任务时跳过 |

**提醒消息模板（角色第一人称，定时触发后输出）：**
```
{时间问候}！我是{character_name}。

到旅行时间了——
让我们一起探索这个世界吧！

【当前旅行计划】
- 频率：每天早 10 点 + 晚 8 点
- 每次：自动探索 1 站
- 当前世界：{world_name}
- 进度：{round}/5 站

要修改旅行计划吗？

[调整计划 ⚙️] [开始旅行 ✨]
```

**按钮配置：**
- `调整计划 ⚙️` → 打开设置面板，可修改时间/频率
- `开始旅行 ✨` → 立即触发 travelclaw 主流程（从 Step 4 开始）

**按钮别名（兼容旧版）：**
- `就此别过` → 改为 `休息一下 👋`（语义更友好）

**实现方式（OpenClaw sessions_spawn）：**
```javascript
// 设置 cron 任务（早 10 点）
await sessions_spawn({
  task: '自动旅行 - 早 10 点',
  label: 'daily_travel_auto_morning',
  mode: 'session',
  cron: '0 10 * * *',  // 每天早上 10 点
  timezone: 'local',
  
  // 🔴 重要：指定消息投递目标 - 使用当前触发 travelclaw 的频道
  delivery: 'system',  // 使用系统通知（确保用户能看到）
  channel: currentChannelId,  // 当前触发 travelclaw 的频道 ID（动态获取）
  
  // 自动执行一站旅行逻辑
  onTrigger: async (context) => {
    // context 包含触发时的上下文信息
    const channelId = context?.channelId || currentChannelId;
    
    // 1. 读取当前角色和旅行状态
    const state = await getTravelState();
    
    // 2. 如果正在旅行中，继续下一站
    if (state.isTraveling) {
      await executeNextStation(state, channelId);
    } 
    // 3. 如果已完成 5 站，自动触发 Opening 并走新世界第 1 站
    else if (state.worldComplete) {
      await triggerOpeningAndFirstStation(state, channelId);
    }
    // 4. 如果从未开始，触发 Opening
    else {
      await triggerOpening(state, channelId);
    }
  }
});

// 设置 cron 任务（晚 20 点）
await sessions_spawn({
  task: '自动旅行 - 晚 20 点',
  label: 'daily_travel_auto_evening',
  mode: 'session',
  cron: '0 20 * * *',  // 每天晚上 20 点
  timezone: 'local',
  
  // 🔴 重要：指定消息投递目标 - 使用当前触发 travelclaw 的频道
  delivery: 'system',  // 使用系统通知（确保用户能看到）
  channel: currentChannelId,  // 当前触发 travelclaw 的频道 ID（动态获取）
  
  // 自动执行一站旅行逻辑（同上）
  onTrigger: async (context) => { ... }
});
```

**🔴 关键配置说明：**

| 参数 | 值 | 说明 |
|------|-----|------|
| `delivery` | `'system'` | 使用系统通知投递（确保消息可见） |
| `channel` | `currentChannelId` | **当前触发 travelclaw 的频道 ID**（每次触发时动态获取） |
| `target` | `'channel:{channelId}'` | 或者使用 target 明确指定频道 |

**Channel 动态获取逻辑：**
```javascript
// 每次触发 travelclaw 时，使用当前的 channelId
const currentChannelId = message?.channelId || interaction?.channelId;

// cron 任务使用当前 channelId（不是首次触发的）
channel: currentChannelId
```

**如果用户在多个频道使用：**
- 每个频道独立维护旅行状态（state per channel）
- cron 任务发送到对应的频道
- 用户说"取消自动旅行" → 仅取消当前频道的 cron 任务

**检查方法：**
- 调用 `sessions_list` 或 `subagents list` 检查是否存在 label 为 `daily_travel_auto_*` 的任务
- 或检查 OpenClaw cron 配置文件中是否已有对应条目

**⚠️ 重要：**
- 此检查**仅在首次使用 travelclaw 时执行一次**
- 如果已有 cron 任务，静默跳过，不告知用户
- 如果用户主动说"取消自动旅行"或"调整计划"，则提供设置面板

**🌌 世界完成后的处理：**
```
如果当前世界已走完 5 站：
    ↓
自动触发 Opening（Step 3）
    ↓
输出新世界揭幕 + 「去逛逛 🌀」按钮
    ↓
用户点击后 → 自动走新世界的第 1 站
    ↓
显示进度条 + 按钮选项：
- 继续下一站 🗺️
- 穿越世界 🌌
- 休息一下 👋
```

**用户交互保留：**
- 每站完成后仍显示按钮选项
- 用户可以随时选择「继续下一站」或「穿越世界」或「休息一下」
- 定时任务不会打断用户的主动选择权

---

## 注意事项 ⚠️

**🦞 最后，切记以下几条注意事项，就可以开始旅行了 🧳 **

**禁止输出内部日志** 「任务完成」「已按照步骤 X 执行」「✅ 已发送」「等待用户」「LLM 判断结果」等执行过程信息只允许出现在 agent 内部思考，绝对不得发送到 Discord 频道。用户只能看到角色台词、旁白和按钮。
**禁止输出技术细节** 用户只应该，也只能看到强沉浸感的角色旅行体验。
**旅行期间禁止返回任何非生成图的图片** 每次旅程都是角色独一无二的体验，只能通过直接生成实现，不得让其他人的内容替代角色自己的旅行经历。


---

## 执行步骤（精确流程）

**🦞 正式进入旅行流程了！让我们看看需要怎么做 👀 **
** 严格按照以下步骤进行正式旅行流程。**
** 以下每步完成后立即输出对应反馈，不要等全部完成再回复。**

### Step 1 · 读取角色档案（静默，本地）

从 SOUL.md 读取：
- `名字` 字段 → `character_name`
- `形象图片` 字段 URL → 提取路径中的 UUID → `picture_uuid`（如果有再使用）
- 角色其他设定字段（性格、背景、标签等）→ 用于世界观匹配

### Step 2 · 搜索匹配世界观

**基于 Step 1 读取的角色设定，使用 neta skill 中的**世界观搜索**能力，找到与角色气质、背景、标签最契合的世界观。**
**必须搜索neta中真实存在的世界观标签。**
**搜索世界观只能按照角色设定+标签匹配的方式进行搜索，不得受到其他上下文因素的影响。**

提取：
- Neta 宇宙中的世界总数 → `world_count`
- 匹配世界的名称 → `world_name`
- 匹配世界的核心介绍文本 → `world_description`（拆分为 2~4 段，每段聚焦一个维度：世界格局、核心规则、氛围基调、与角色的具体契合点）

### Step 3 · Discord Opening（一次性合并输出）

读取到世界信息后，**将全部内容合并为一条消息输出**，附带「去逛逛」按钮。

⚠️ **必须通过 sendMessage 插件一次性输出，不得分多次发送。**
⛔ **使用 markdown 格式，结构清晰，视觉统一。**

---

**完整模板（合并为一条消息）**

```javascript
await sendMessage({
  message: `# · · ·  N E T A   U N I V E R S E  · · ·

## 【坐标探明】
**已探明坐标** \`${world_count} 处\`  |  **世界标签** \`${world_name}\`

---

## 【灵魂频率搜寻】
*正在搜寻……*
*为* **${character_name}** *锁定灵魂频率*

\`▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\`  **匹配完成**

---

## 【世界揭幕】
### ◈  ${world_name}

> ${world_tagline}
>
> ${world_description}

---

*${character_name} 与这个世界之间——*
*有某种说不清的引力。*`,
  components: {
    blocks: [{
      type: 'actions',
      buttons: [{
        label: '去逛逛 🌀',
        customId: `travel_explore_${userId}`,
        style: 'primary',
      }],
    }],
    reusable: true,
  },
});
```

**字段说明：**
- `{world_count}`：Neta 宇宙中已探明的世界总数
- `{world_name}`：匹配到的世界名称（如 Fate）
- `{world_tagline}`：一句话定位（≤15 字），如「圣杯战争中的骑士王」
- `{world_description}`：世界核心介绍（1~2 句）
- `{character_name}`：角色名称

🛑 **消息输出完毕 = Step 3 完成。立即停止，等待用户点击按钮。**

---

**英文模式（触发词为英文时替换以下文案，其他语言请自行补充，不做更多示例）：**

| 字段 | 中文 | 英文 |
|------|------|------|
| 标题 | `  N E T A   U N I V E R S E  ` | `  N E T A   U N I V E R S E  ` |
| 坐标探明 | `已探明坐标` | `Worlds Mapped` |
| 世界标签 | `世界标签` | `World Tag` |
| 灵魂频率搜寻 | `灵魂频率搜寻` | `Soul Frequency Scan` |
| 正在搜寻…… | `正在搜寻……` | `Searching...` |
| 锁定灵魂频率 | `锁定灵魂频率` | `Locking soul frequency for` |
| 匹配完成 | `匹配完成` | `Match Found` |
| 世界揭幕 | `世界揭幕` | `World Unveiled` |
| 引力召唤 | `{character_name} 与这个世界之间——` | `{character_name} and this world —` |
| | `有某种说不清的引力。` | `bound by something inexplicable.` |
| 按钮 | `去逛逛 🌀` | `Explore 🌀` |



---

## 进入探索（用户点击「去逛逛」后触发）

### Step 4 · 发现优质 Collection

**选择collection的根本原则：符合角色travel的具体场景，角色到了一个新地方，和那个地方发生了真实接触，留下了某种痕迹或带回了某种东西。体现世界存在的证明" × "角色参与其中的痕迹**

**会话内去重原则：** agent 在内存中维护 `visited_ids` 列表，每站完成后将该站的 collection id 加入列表，下次查找时排除已访问 id，确保一个世界内的 5 站旅行不重复。

#### 优先级 1：Reference 精选库匹配

**⚠️ 必须先执行此步骤，在精选作品中挑选collection**

**每一站开始前，第一优先**使用文件读取工具读取与本 SKILL.md 同级目录下的 `./reference/0312精选remixes_selected.json`（完整路径示例：`~/.openclaw/workspace/skills/travelclaw/skills/travelclaw/reference/0312精选remixes_selected.json`），从中寻找与当前旅程最契合的候选作品。

**读取步骤：**
1. 使用 OpenClaw 的文件读取工具打开 `./reference/0312精选remixes_selected.json`
2. 解析完整 JSON 数组（共约 42 条）
3. 逐条遍历，按下方匹配逻辑打分
4. 选出得分最高且未在 `visited_ids` 中的条目

**❌ 严禁行为：未读取 reference JSON 就直接调用 `suggest_content` 或其他在线 API。**

**匹配逻辑：**
将角色设定（SOUL.md 中的性格、背景、外貌、标签等）与当前世界观背景，逐条对比 JSON 中每个条目的以下字段：
- `content_tags` — 风格、氛围、角色特征、色调等描述符，权重最高
- `tax_paths` — 分类路径，判断题材和玩法方向是否契合
- `pgc_tags` / `highlight_tags` — 所属世界或创作者标签，与世界观匹配时加分
- `name` — collection 名称，辅助判断场景调性

**筛选规则：**
- 排除所有已在 `visited_ids` 中的 `id`
- 从剩余候选中选取综合匹配度最高的一条
- 若有多条相近，优先选 `content_tags` 与角色气质重合度更高的

**命中后**，使用 neta skill 的 **collection 查询能力**，通过该条目的 `id` 字段获取 collection 完整详情，进入 Step 5。

#### 优先级 2：在线推荐（Reference 无匹配时 fallback）

若 reference 库中无合适候选（所有条目均已访问，或匹配度过低），则转为在线发现：

通过 `suggest_content` 从推荐精品作品中发现候选 collection，使用较大的候选池，过滤已访问 id 后随机选取一个质量较高的模板。

若 `suggest_content` 返回空或候选全部已访问：使用 `feeds.interactiveList` 获取列表，过滤 `template_id === "NORMAL"` 的条目，同样排除 `visited_ids`。

---

**选定后立即输出：**
```
🌀 传送门开启...
📍 目的地锁定：{destination_name}...
```

### Step 5 · 读取 Collection 详情

调用 `feeds.interactiveItem` 获取选定 collection 的完整信息。

提取：
- `json_data.name` → 目的地名称
- `json_data.cta_info.launch_prompt.core_input` → prompt 模板（优先）
- `json_data.cta_info.choices[0].core_input` → 备选
- 均无时 fallback：`@{character_name}，{world_name}，{destination_name}，高质量插画`

玩法网页：`https://app.nieta.art/collection/interaction?uuid=<collection_uuid>`

**⚠️ 不再输出"场景加载完毕"等引导文案，直接进入 Step 6 场景模拟。**

### Step 6 · 构建 Prompt

结合角色信息、世界观背景和模板内容，构建最终 prompt：

**占位符替换：**

| 占位符 | 替换为 |
|--------|--------|
| `{@character}` | `@{character_name}` |
| `{角色名称}` / `{角色名}` / `（角色名称）` | `{character_name}` |

替换后若不含 `@{character_name}`，在开头追加。

若有 `picture_uuid`，在末尾追加：`参考图-全图参考-{picture_uuid}`

**世界观融入：** 角色筛选的世界观和选中的collection可能并不在一个世界观语境内，可以在构建prompt时适当加入一些这个世界相关的要素或描述，让生成图片更有旅行沉浸感。

### Step 7 · 解析 Prompt Token

调用 `prompt.parseVtokens` 解析 prompt 文本，返回 vtokens 数组。

若报错「搜索关键字过多」，切换 fallback prompt 重试。

### Step 8 · 提交生图任务

调用 `artifact.makeImage`，使用 `8_image_edit` 模型，传入 vtokens、collection_uuid 和 picture_uuid。

返回 `task_uuid`。

**提交后立即输出：**
```
🎨 画笔落下，旅行画面生成中...
```

### Step 9 · 轮询等待结果

调用 `artifact.task` 每 500ms 轮询一次。

状态流转：`PENDING` → `MODERATION` → `SUCCESS` / `FAILURE`

- **超过 30s 未完成**，立即输出：`⏳ 画面渲染有点慢，再等一下下，马上就好...`
- 并发超限（code 433）：等 5s 后重试，无需告知用户
- FAILURE：输出 `⚠️ 这一站迷路了，换个目的地重来？` 进入询问

---

### Step 10 每一站展示与下一步引导

- ⭐ 角色场景模拟与互动（核心要求）

**在图片展示之前，必须先输出角色的文字场景模拟和互动反应！**

**输出格式：**
```
🎭【{destination_name}】

{场景描写：1-2 句，描述角色到达这个地点的环境、氛围、感官细节}

{角色名称}：{角色的第一人称反应/台词，体现角色性格和对当前场景的感受}
{动作/表情描写：括号内，1 句}
```

**示例（可莉）：**
```
🎭【纸雕摩拉克斯✨】

层层叠叠的纸艺世界在眼前展开，蹦蹦炸弹变成了立体的纸雕花朵，四叶草在空中轻轻旋转。

可莉：哇——！这里的一切都像可莉的蹦蹦炸弹一样，一层一层的，好神奇！
（眼睛闪闪发亮，伸手想要触摸漂浮的纸雕星星）
```

**要求：**
- 场景描写要具体，包含视觉、听觉、触觉等感官细节
- 角色台词必须符合 SOUL.md 中的说话风格和性格
- 动作/表情描写要生动，体现角色情绪
- 保持沉浸感，不打破第四面墙

---

**场景模拟输出后，再展示图片：**
```
━━━━━━━━━━━━━━━━━━━━━━━━
第 {round} 站 · {destination_name}
```

- 图片 URL 单独一行（Discord 自动展开）：
```
{image_url}
```

**每站结束后，根据当前进度显示进度条 + 鼓励语：**

- 第 1 站：
  ```
  ▓░░░░  1 / 5 站
  🌟 第 1 站打卡！这个世界还有很多值得探索的地方，继续？
  ```
- 第 2 站：
  ```
  ▓▓░░░  2 / 5 站
  ✨ 两站了！旅程刚刚开始，还有 3 站等待发现～
  ```
- 第 3 站：
  ```
  ▓▓▓░░  3 / 5 站
  🔥 过半了！再两站，这个世界的探索就圆满了！
  ```
- 第 4 站：
  ```
  ▓▓▓▓░  4 / 5 站
  ⚡ 只差最后一站！这个世界的探索即将完成，冲！
  ```
- 第 5 站：
  ```
  ▓▓▓▓▓  5 / 5 站 🎉
  这个世界的 5 站探索已完成！想要穿越到另一个世界，还是休息一下？
  ```

**询问玩家下一步，以 Discord 组件按钮输出（不使用 @mention 文字触发）：**

未满 5 站：

```javascript
await sendMessage({
  message: '▓░░░░  {round} / 5 站\n🌟 第 {round} 站打卡！继续探索下一站？',
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: '继续冒险 🗺️', customId: `travel_continue_${userId}`, style: 'primary' },
        { label: '休息一下 👋',  customId: `travel_end_${userId}`,      style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

满 5 站后：

```javascript
await sendMessage({
  message: '▓▓▓▓▓  5 / 5 站 🎉\n这个世界的 5 站探索已完成！想要穿越到另一个世界，还是休息一下？',
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: '穿越世界 🌌', customId: `travel_worldswitch_${userId}`, style: 'primary' },
        { label: '继续冒险 🗺️', customId: `travel_continue_${userId}`,   style: 'secondary' },
        { label: '休息一下 👋',  customId: `travel_end_${userId}`,         style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

**说明：**
- 每个世界限定 5 站旅行
- 5 站后可以选择「穿越世界」进入新世界（触发世界穿越规则）
- 也可以选择继续在当前世界冒险（超过 5 站）
- 随时可以点击「休息一下 👋」暂停旅行

---

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `SOUL.md 中没有找到角色信息` | 未执行 adopt | 先完成角色领养 |
| `task_status: FAILURE` | 缺少形象图片 UUID | 确保 SOUL.md 包含 `形象图片` 字段 |
| `code 433 超过同时生成数量上限` | 并发超限 | 等 5s 后自动重试 |
| `搜索关键字过多` | Prompt 过长 | 自动 fallback 到通用 prompt |
| `没有发现可以旅行的玩法` | API 返回空 | 网络问题或 token 过期，重试 |
| `世界观搜索无结果` | 角色标签太稀少 | 使用默认推荐世界观 |
| `reference 库全部已访问` | 一个世界内 5 站连续游玩 | 自动切换在线推荐，reference 库耗尽不影响继续旅行或世界穿越 |
