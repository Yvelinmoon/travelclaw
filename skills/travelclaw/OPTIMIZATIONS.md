# Travelclaw Optimizations

_Quick reference for two critical fixes_

---
# Travelclaw Optimizations

_Quick reference for critical fixes_

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

## 🔴 Issue 2: Reference File Ignored

**Solution:** 3 reading methods + mandatory confirmation output

**File path:** `/home/node/.agents/skills/travelclaw/reference/0312 精选 remixes_selected.json`

**3 Methods (use any):**
```javascript
// Method A: OpenClaw read (recommended)
const collections = JSON.parse(await read({ 
  path: '/home/node/.agents/skills/travelclaw/reference/0312 精选 remixes_selected.json' 
}));

// Method B: Node.js fs
const collections = JSON.parse(fs.readFileSync(
  '/home/node/.agents/skills/travelclaw/reference/0312 精选 remixes_selected.json', 'utf8'
));

// Method C: exec
// exec "cat /home/node/.agents/skills/travelclaw/reference/0312 精选 remixes_selected.json"
```

**Mandatory confirmation output (before Step 5):**
```
✅ Reference library loaded
   - Path: /home/node/.agents/skills/travelclaw/reference/0312 精选 remixes_selected.json
   - Total: {X} collections
   - Excluded (visited): {Y}
   - Candidates: {Z}
   - Selected: {name} (best match)
```

**❌ Forbidden:**
- Calling `suggest_content` without reading reference first
- Skipping confirmation output
- Random selection without scoring

---

## 🔴 Issue 3: Non-Neta Character Image Accuracy

**Problem:** When awakened character is NOT from Neta API (e.g., real people, external IP characters), the `picture_uuid` reference may not be accurate.

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

**⚠️ System Messages:** OpenClaw may automatically show "Sub-agent started..." messages. To minimize this:

1. **Use `sessionTarget: 'isolated'`** for cron tasks (already configured)
2. **Use `delivery: 'silent'`** to suppress system notifications
3. **Never manually output technical logs** in your sendMessage calls

**❌ Forbidden outputs (will break immersion):**
- "Sub-agent started task..."
- "Waiting for image generation..."
- "LLM processing complete"
- "✅ Cron task configured" (technical logs)
- "Step X completed"
- "Calling API..."
- Any internal workflow logs

**✅ Correct approach:**
- Only output **character dialogue**, **narration**, and **buttons**
- Use **in-character narration** for waiting states
- Keep all technical logs in agent internal thinking only

**Examples:**

| ❌ Wrong (breaks immersion) | ✅ Correct (maintains immersion) |
|----------------------------|----------------------------------|
| "Sub-agent is generating image..." | "🚶 {character} is exploring, capturing a moment..." |
| "Waiting for API response..." | `...space ripples as the scene materializes...` |
| "Task complete, step 3/5" | "▓▓▓░░ 3 / 5 stops 🌟" |
| "LLM judgment: confidence 95%" | "I... I know who I am." |
| "Cron setup complete" | (silent, or in-character announcement) |

**Implementation:**
```javascript
// ❌ Wrong - technical log
console.log('Sub-agent task started, waiting for result...');
await sendMessage({ message: 'Sub-agent is working on your request...' });

// ✅ Correct - in-character narration
await sendMessage({ 
  message: '```' + `
...the air shimmers as {character} steps into the scene...
photons gather, capturing a moment that will become memory...
`.trim() + '```'
});
```

**Cron Configuration (suppress system messages):**
```javascript
await cron({
  action: "add",
  job: {
    name: "auto-travel-10am",
    schedule: { kind: "cron", expr: "0 10 * * *", tz: "Asia/Shanghai" },
    payload: { kind: "agentTurn", message: "Trigger travelclaw" },
    sessionTarget: "isolated",  // Use isolated session
    delivery: "silent",         // Suppress system notifications
    enabled: true
  }
});
```

**Golden Rule:** 
> **Users should only see:** Character lines, narration, buttons, progress bars
> 
> **Never output:** Technical logs, API calls, sub-agent status, step numbers, "task complete"

---

**Examples:**
- ✅ Neta original character → Use `picture_uuid` reference
- ❌ Elon Musk / Trump → Need detailed description
- ❌ Harry Potter / Voldemort → Need detailed description
- ❌ 郭德纲 / 周杰伦 → Need detailed description

**Solution:** Add detailed character description in Step 6 prompt

**Implementation:**
```javascript
// Check if character is from Neta
const isNetaCharacter = charData.fromNeta === true;

if (!isNetaCharacter) {
  // Add detailed description to prompt
  const charDescription = buildCharacterDescription({
    name: charData.character,
    appearance: charData.appearance || 'default description',
    traits: charData.traits || [],
    style: charData.style || 'realistic'
  });
  
  // Append to prompt
  prompt = `${prompt}, ${charDescription}`;
}
```

**Character description template:**
```
{character name}, {age/gender}, {hair color/style}, {eye color}, 
{distinctive features}, wearing {clothing style}, {personality traits}
```

**Example (Elon Musk):**
```
Elon Musk, middle-aged male, blond hair, blue eyes, business suit, 
tech entrepreneur, confident expression, realistic portrait style
```

---

## 🔴 Issue 6: Repeated Collection Selection (Same Work Picked)

**Problem:** Sometimes the same collection (e.g., "OC 互动" or glitch art works) gets selected repeatedly across different stops or worlds.

**Root Causes:**
1. **Generic tags match too often** — Tags like `奇幻`, `日常`, `单人` are too common
2. **visitedIds not persisted** — State file not updated after each stop
3. **No diversity mechanism** — Always picking highest score without variety

**Solution:**

### A. Ensure visitedIds Persistence
```javascript
// After each stop, MUST update travel-state.json
channelState.visitedIds.push(selectedCollection.id);
channelState.progress = currentRound;
travelState.channels[channelId] = channelState;
fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
```

### B. Add Tag Diversity Penalty
```javascript
// Track recently used tags (last 3 stops)
const recentTags = channelState.recentTags || [];

const scored = candidates.map(c => {
  let score = 0;
  
  // Original matching
  const tagMatches = c.content_tags?.filter(tag => 
    characterTags.some(ct => tag.toLowerCase().includes(ct.toLowerCase()))
  );
  score += (tagMatches?.length || 0) * 10;
  
  // 🔴 Diversity penalty: reduce score for recently used tags
  const overlapWithRecent = c.content_tags?.filter(tag => 
    recentTags.includes(tag)
  )?.length || 0;
  
  if (overlapWithRecent > 2) {
    score -= overlapWithRecent * 5; // Penalize repetition
  }
  
  return { ...c, score };
});

// Update recent tags after selection
const selectedTags = bestMatch.content_tags || [];
channelState.recentTags = [...selectedTags.slice(-5), ...recentTags].slice(0, 15);
```

### C. Add Randomness for Ties
```javascript
// When scores are close (within 10 points), add randomness
const topCandidates = scored.filter(c => c.score >= maxScore - 10);
if (topCandidates.length > 1) {
  // Pick randomly from top candidates for variety
  bestMatch = topCandidates[Math.floor(Math.random() * topCandidates.length)];
}
```

### D. Verify Before Selection
```javascript
// Check if this collection was recently visited
const isRecent = channelState.visitedIds?.slice(-10).includes(selectedCollection.id);
if (isRecent) {
  console.warn('⚠️ Selected recently visited collection! Re-scoring...');
  // Force re-selection with higher penalty
}
```

**Mandatory Checkpoint (before Step 5):**
```javascript
// Verify not repeating recent collection
const recentIds = channelState.visitedIds?.slice(-5) || [];
if (recentIds.includes(selectedCollection.id)) {
  // 🔴 ERROR: About to repeat recent collection!
  // Must re-select with different criteria
}
```

---

## ✅ Quick Checklist

### Travelclaw Checklist
- [ ] Read `travel-state.json` at travelclaw start
- [ ] Check `cronConfigured`, setup if false
- [ ] Read reference file at each stop (3 methods)
- [ ] Output ✅ confirmation message
- [ ] Score and select best match
- [ ] **Apply tag diversity penalty (avoid generic tags)**
- [ ] **Verify not selecting recent collection (last 5 stops)**
- [ ] **Check if character is Neta original → add description if not**
- [ ] **NO sub-agent logs / technical status in Discord channel**
- [ ] Update `travel-state.json` with visitedIds + recentTags after each stop

### Discord-Awaken-Claw Checklist
- [ ] **Phase 9: Update guild nickname BEFORE narrative**
- [ ] **Phase 9: Update guild avatar BEFORE narrative**
- [ ] Verify nickname = character name (no IDs)
- [ ] Use fallback image if search fails
- [ ] Silent update (user should feel the "magic")

**Full details:** `OPTIMIZATIONS.md` → Issue 5
