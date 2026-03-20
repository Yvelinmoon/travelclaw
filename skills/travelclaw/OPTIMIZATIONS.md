# Travelclaw Optimizations

_Quick reference for critical fixes — travel.js edition_

---

## 🔴🔴🔴 CRITICAL: READ OUTPUT_RULES.md FIRST

**BEFORE executing ANY action:**

1. **Read `OUTPUT_RULES.md`** - Defines allowed output formats
2. **NEVER output:** JSON, debug logs, system status, "Subagent finished"
3. **ONLY output:** Character dialogue, narration, buttons, progress bars

**Golden Rule:** "Would a user see this in a roleplay chat?"

---

## 🔴 Issue 1: Cron Tasks Forgotten

**Solution:** Use `travel-state.json` persistence file

**Location:** `~/.openclaw/workspace/memory/travel-state.json`

**Structure:**
```json
{
  "channels": {
    "1483595663399846049": {
      "cronConfigured": true,
      "cronJobIds": ["auto-travel-10am-1483595663399846049", "auto-travel-8pm-1483595663399846049"],
      "currentWorld": "Fate",
      "progress": 3,
      "visitedIds": ["uuid-1", "uuid-2"]
    }
  }
}
```

**Mandatory flow (every travelclaw trigger):**
```javascript
const fs = require('fs');
const stateFile = path.join(process.env.HOME, '.openclaw/workspace/memory/travel-state.json');

// Read state
let travelState = fs.existsSync(stateFile) 
  ? JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  : { channels: {} };

const channelId = message?.channelId;
const channelState = travelState.channels[channelId] || { cronConfigured: false, visitedIds: [] };

// Check & setup cron
if (!channelState.cronConfigured) {
  // 🔴 Output: Planning announcement (in-character)
  await sendMessage({ 
    message: `✨ ${characterName} is planning the journey...\n\n*Checking coordinates, mapping worlds, preparing the adventure...*` 
  });
  
  await setupCronTasks(channelId);
  
  channelState.cronConfigured = true;
  travelState.channels[channelId] = channelState;
  fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
  
  // 🔴 Output: Setup complete (in-character)
  await sendMessage({ 
    message: `✅ Journey planned, ${characterName}!
    
**Auto-Travel Schedule:**
- 🕐 10:00 AM daily
- 🕗 8:00 PM daily
- 📍 Each session: 1 stop exploration

*Ready to explore the Neta Universe whenever you are!*

[Start Exploring 🌀] [Adjust Plan ⚙️]` 
  });
}
```

---

## 🔴 Issue 2: Collection UUID Mismatch (FIXED in travel.js)

**Problem (OLD):** Manual collection ID → uuid mapping led to mismatched destinations.

**Solution (NEW):** `travel.js suggest` returns correct uuid directly.

**travel.js handles:**
- Local scenes.json priority with tag-based scoring
- API fallback via `/v1/recsys/content`
- Automatic exclusion of visited collections
- Returns `{uuid, name, from_ref}` directly

**Usage:**
```bash
# travel.js automatically excludes visited collections
node travel.js suggest "visited-uuid-1,visited-uuid-2"
```

**Returns:**
```json
{"uuid": "correct-collection-uuid", "name": "Destination Name", "from_ref": true}
```

**✅ No manual ID mapping needed!**

---

## 🔴 Issue 3: Non-Neta Character Image Accuracy

**Problem:** When awakened character is NOT from Neta API (e.g., real people, external IP characters), the `picture_uuid` reference may not be accurate.

**Solution:** travel.js `gen` command automatically handles this.

**travel.js behavior:**
- If character not found in TCP → uses freetext prompt with character name
- Automatically strips `@character` placeholder if no TCP match
- Adds detailed description from prompt template

**Example output:**
```
🔎 TCP search: "Jeff Bezos" → not found, using freetext
📝 vtokens: [{"type":"freetext","value":"Jeff Bezos, 科幻风格角色立绘...","weight":1}]
```

**For better results:** Ensure SOUL.md has detailed character description in 角色图片 field.

---

## 🔴 Issue 4: No Sub-agent Progress Logs (Immersion Protection)

**Problem:** Outputting sub-agent task progress, internal logs, or technical status breaks character immersion.

**⚠️ CRITICAL: ABSOLUTELY FORBIDDEN OUTPUTS**

**❌ NEVER output these phrases (in ANY language):**
- "Sub-agent started..." / "子代理已启动..."
- "Waiting for..." / "等待..."
- "Processing..." / "处理中..."
- "Analyzing..." / "分析中..."
- "Task complete" / "任务完成"
- "Step X of Y" / "第 X 步"
- "Calling API..." / "调用 API..."
- "LLM judgment..." / "LLM 判断..."
- "Checking..." / "检查..."
- "Loading..." / "加载中..."
- Any system status or workflow logs

**⚠️ System Message Suppression:**
```javascript
// CRITICAL: Use these settings for ALL cron tasks
await cron({
  action: "add",
  job: {
    name: "auto-travel",
    schedule: { kind: "cron", expr: "0 10 * * *" },
    payload: { kind: "agentTurn", message: "Trigger travel" },
    sessionTarget: "isolated",  // Isolated session
    delivery: "silent",         // NO system notifications
    enabled: true
  }
});
```

**✅ ONLY output:**
- Character dialogue (first-person, in-character)
- Narration (atmosphere, scene descriptions in code blocks)
- Buttons (interactive options via components)
- Progress bars (▓▓▓░░ 3 / 5 stops)

**Example Transformation:**

| ❌ FORBIDDEN | ✅ CORRECT |
|-------------|-----------|
| "Waiting for sub-agent analysis..." | `...the air shimmers as destiny unfolds...` |
| "Analyzing character traits..." | *I sense something... a presence...* |
| "Task complete, step 3/5" | "▓▓▓░░ 3 / 5 stops 🌟" |
| "Checking travel-state.json..." | (silent operation, no output) |

---

## 🔴 Issue 5: Avatar & Nickname Update Forgotten (Awakening Ritual)

**Problem:** During awakening, the bot's guild nickname and avatar must be updated to match the character. This step is sometimes forgotten or delayed.

**⚠️ Critical Timing:** Avatar/nickname update MUST happen **before** outputting the awakening narrative (Phase 9, Step ⑥).

**Correct Flow (Phase 9 - Awakening):**
```
① Send atmosphere message ("...Hatching")
    ↓
② Backup & update SOUL.md (include character_image URL)
    ↓
③ Change guild member nickname → {character name}
    ↓
④ Search & update guild member avatar
    ↓
⑤ Output awakening narrative + world arrival
    ↓
⑥ Character's first dialogue
```

**Mandatory Checkpoint (before Step ⑤):**
```javascript
// 🔴 CHECK: Nickname & Avatar Updated?
const member = await guild.members.fetch(botUserId);
const nickname = member.nickname || member.user.username;

if (nickname !== charData.character) {
  console.error('❌ CRITICAL: Nickname not updated!');
  // Must update before proceeding
  await updateNickname(guildId, charData.character);
}

if (!avatarUpdated) {
  console.error('❌ CRITICAL: Avatar not updated!');
  // Must update before proceeding
  await updateAvatar(imageUrl);
}

// ✅ Only then output awakening narrative
await sendMessage({ message: awakeningNarrative });
```

**❌ Forbidden:**
- Outputting awakening narrative before updating nickname/avatar
- Skipping avatar update because "search failed" (use fallback image)
- Waiting for user confirmation before updating (update is automatic after confirm_yes)

**✅ Required:**
- Nickname: Character name only (no IDs, no extra characters)
- Avatar: Character image (from Neta API, Wikimedia, or user-provided)
- Timing: Silent update before narrative (user should feel the "magic")

**Example Flow:**
```
User clicks: "◎ That's them, hatch now"
    ↓
Bot: "............\nHatching"
    ↓
[Silent: Nickname changed to "Elon Musk"]
[Silent: Avatar updated to Elon Musk portrait]
    ↓
Bot: *...data streams converge from the void...* (awakening narrative)
    ↓
Bot: I am Elon Musk. (character dialogue)
```

**Troubleshooting:**
| Issue | Solution |
|-------|----------|
| "Avatar search failed" | Use fallback: user-provided image or generate placeholder |
| "No permission to change nickname" | Check bot permissions (Manage Nicknames) |
| "Update happens after narrative" | Move update code BEFORE narrative output |

---

## 🔴 Issue 6: Image URL Not Embedding in Discord

**Problem:** Image URLs sent with other text don't auto-embed as images in Discord.

**Solution:** Send image URL as a **separate message**.

**Discord's embed behavior:**
- ✅ URL alone in message → Auto-embeds as image
- ❌ URL with text → Shows as plain link

**Correct pattern:**
```javascript
// Message 1: Scene description
await sendMessage({
  message: `🎭【Scene Name】

\`\`\`
Scene description here...
\`\`\`

Character: Dialogue here...`
});

// Message 2: Image URL ONLY
await sendMessage({
  message: 'https://oss.talesofai.cn/picture/uuid.webp'
});

// Message 3: Progress bar + buttons
await sendMessage({
  message: '▓▓▓░░ 3 / 5 stops',
  components: { blocks: [...], reusable: true }
});
```

**Why?** Discord's embed parser only triggers when the message contains **only** a URL (with optional whitespace).

---

## ✅ Quick Checklist (travel.js edition)

### Travelclaw Checklist
- [ ] Read `travel-state.json` at travelclaw start
- [ ] Check `cronConfigured`, setup if false
- [ ] Use `travel.js suggest` for destination (auto-excludes visited)
- [ ] Use `travel.js gen` for image generation
- [ ] **Output loading messages: `🌀 Portal opening...` + `🚶 Character traveling...`**
- [ ] **Send image URL as SEPARATE message (for Discord embed)**
- [ ] Update `travel-state.json` with visitedIds after each stop
- [ ] **NO sub-agent logs / technical status in Discord channel**

### Discord-Awaken-Claw Checklist
- [ ] **Phase 9: Update guild nickname BEFORE narrative**
- [ ] **Phase 9: Update guild avatar BEFORE narrative**
- [ ] Verify nickname = character name (no IDs)
- [ ] Use fallback image if search fails
- [ ] Silent update (user should feel the "magic")

---

**Last updated:** 2026-03-19 (travel.js native edition)
