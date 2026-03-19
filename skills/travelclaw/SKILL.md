---
name: travelclaw
description: Triggered directly after the awakening flow in which the lobster baby obtains an identity (or via scheduled task / user prompt). Lets the awakened shrimp character explore different worlds in the Neta universe using neta skills — first searching for a world that matches the character to obtain world information, then using high-quality creation templates provided by neta skills and based on the world context to produce personalized content for the character, simulating the character traveling through the world and experiencing various events.
---

**🦞 Let the character awakened on openclaw find an interesting world in the Neta universe and leave their own mark there ～**
**Related project:** [neta-skills](https://github.com/talesofai/neta-skills) — Neta platform API toolkit

---

---

## 🔴🔴🔴 CRITICAL: CRON SETUP (FIRST USE ONLY)

**BEFORE executing ANY travel step, you MUST:**

```
1. Read travel-state.json from ~/.openclaw/workspace/memory/
2. Check if channels[channelId].cronConfigured === true
3. If FALSE or missing → STOP and setup cron immediately
4. Write cronConfigured: true to file after setup
```

**❌ FORBIDDEN:**
- Skipping cron check and going directly to Step 1
- Relying on memory instead of file persistence
- Setting up cron only once and not checking on subsequent triggers

**✅ REQUIRED OUTPUT (after setup, in-character):**
```
*{characterName} pauses, gathering thoughts and preparing for the journey ahead.*

"Let me make ready..."

*A moment of quiet focus, then a nod of readiness.*

[Silent: Setup cron tasks via API]

*{characterName} straightens up, ready for adventure.*

"Ready when you are."

*A look of anticipation, eager to begin.*
```

**🔴 CRITICAL:**
- MUST actually call `cron()` API - do NOT just write to state file
- Verify tasks created via `sessions_list()`
- Output should be in-character, NO schedule details, NO buttons

**📖 For detailed cron flow:** See `OPTIMIZATIONS.md` → Issue 1

---

## 🔴 Critical: Read OPTIMIZATIONS.md at Checkpoints

**⚠️ This skill has optimization references. You MUST read `OPTIMIZATIONS.md` at these checkpoints:**

| Step | When to Read | What to Check |
|------|--------------|---------------|
| **Cron Setup** | At travelclaw start, before any action | Read → `OPTIMIZATIONS.md` → Issue 1 (Cron Tasks) |
| **Step 4** | At each stop start, before selecting collection | Read → `OPTIMIZATIONS.md` → Issue 2 (Reference File) |

**Quick links:**
- Cron setup flow: `OPTIMIZATIONS.md` → Issue 1
- Reference reading: `OPTIMIZATIONS.md` → Issue 2
- Full checklist: `OPTIMIZATIONS.md` → Quick Checklist

---

## Read before executing! Check the following checklist before beginning this journey 🧾

**Prerequisites**
- SOUL.md exists (contains character name + character_image field);
- neta-skills configured;
- A usable neta token is present in environment variables.

**Trigger scenarios**
- First trigger: auto-triggered after the preceding awakening flow's Phase 9 completes (see direct-connect mode rules in the detailed rules list);
- Triggered by a scheduled cron task;
- Triggered when the user actively inputs "start travel", "go explore", "go traveling", etc.

**Language detection**
- Based on the language tendency the user used when triggering, use that same language for all output, including fixed template text which must also be translated.

**Output format**
- Strictly follow the 📋 Output Specification section in the detailed rules list; use direct output or Discord component output respectively for different content types.

**Cron tasks**
- When this flow is started for the first time, you must first set up the cron scheduled task that can trigger automatic travel as required by the Pre-check section of the detailed rules list (mandatory command; must be remembered and followed; skipping is strictly forbidden).

**Execution steps**
- **Step 0 🔴 MANDATORY: Check & setup Cron (first use only)** ➡️ 
- Step 1 read character file ➡️ 
- Step 2 - step 3 search for world lore matching the character and display opening ➡️ 
- Step 4 - step 9 discover high-quality travel locations (collection) and output personalized content for the current character (must generate character image) ➡️ 
- Step 10 display each stop, guide to continue discovering locations or find a new world.

---

## 🔴 Immersion Protection: ABSOLUTELY NO Sub-agent Logs

**🔴 CHECK OPTIMIZATIONS.md** → Issue 4 (No Sub-agent Progress Logs)

**⚠️ CRITICAL: NEVER output these (in ANY language):**

| Forbidden (EN) | Forbidden (CN) | Why |
|----------------|----------------|-----|
| "Sub-agent started..." | "..." | Breaks immersion |
| "Waiting for..." | "..." | Technical log |
| "Analyzing..." | "..." | Process info |
| "Task complete" | "" | System status |
| "Step X of Y" | " X " | Workflow log |
| "Checking..." | "..." | Internal state |
| "Loading..." | "..." | Technical status |

**✅ ONLY output:**
- Character dialogue (first-person, in-character)
- Narration (atmosphere, scene descriptions in ```code blocks```)
- Buttons (via components)
- Progress bars (▓▓▓░░ 3 / 5 stops)

**Full details:** `OPTIMIZATIONS.md` → Issue 4

---

## 🔴 Checkpoint Reminders

**You will see `🔴 CHECK OPTIMIZATIONS.md` alerts at these critical steps:**

| Alert Location | What to Do |
|----------------|------------|
| **Before Cron Setup** | Stop → Read `OPTIMIZATIONS.md` → Issue 1 → Execute cron flow |
| **Before Step 4 (Collection Selection)** | Stop → Read `OPTIMIZATIONS.md` → Issue 2 → Read reference file → Output ✅ confirmation |

**When you see the alert, you MUST:**
1. Pause current execution
2. Read the specified section in `OPTIMIZATIONS.md`
3. Follow the mandatory flow exactly
4. Output required confirmation messages
5. Then continue with the main flow


---

## Detailed Rules List 🚥

**🦞 Checklist complete — check the detailed rules behind some checklist items here!**

### 🚀 Direct-connect mode (important trigger scenario rule!)

**Trigger scenario:** Preceded by the awakening flow, triggered automatically after Phase 9 completes (character hatches and appears).

**Core rules:**
- ✅ **Skip Step 1** (character info is already in SOUL.md; world lore was described in the awakening narrative)
- ✅ **Start directly from Step 2** (search for world matching the character, output Discord Opening)
- ✅ **Opening auto-triggers Step 4 (first stop)** — no button, no user confirmation needed
- ✅ **Travel progress starts counting from 1/5**
- ✅ **No additional user dialogue needed** (awakening narrative has already established immersion)

---

### 🌌 World-crossing rules (important!)

**Trigger scenarios:**
1. User says "change world", "cross to another world", "go explore another world", "I want to go to XX world", etc.
2. **User completes 5-stop travel in the current world, then clicks the "Cross worlds 🌌" button.**

**🔴 Core rule: identity continuity principle**
- ✅ **Must keep the current character identity unchanged** (all character settings in SOUL.md — name, character_image, etc. — are fully preserved)
- ✅ **Must not re-execute the awakening flow** (character is already awakened; no need to hatch again)
- ✅ **Re-execute Step 2 → Step 3 flow** (search new world lore + output new Opening)
- ✅ **Opening auto-triggers Step 4 (new world's first stop)** — no button needed
- ✅ **Reset travel progress** (travel in the new world starts counting from stop 1)
- ✅ **Clear visited_ids** (collection selection in the new world starts fresh; old world visit history is not carried over)

**Notes:**
- If the user does not specify a new world type, automatically select a world with **maximum style contrast** from the current one (e.g. cyberpunk → fantasy magic)
- Character name in Opening text must use the current character from SOUL.md (must not change)
- After switching worlds, narration may describe "space warping", "portal opening", etc. to enhance immersion
- If the user specifies a specific world (e.g. "want to go to the Harry Potter world"), prioritize matching that lore

---

### 📋 Content format output specification (important spec for beautiful, readable output!)

**🔴 Core principle: choose output format by content type**

| Content type | Output format | Example |
|--------------|---------------|---------|
| **Narration / atmosphere / scene description** | Code Block (no buttons) | \`\`\`Layer upon layer of paper-art world unfolds before your eyes\`\`\` |
| **Narration + buttons** | Discord component | `sendMessage({ message: 'narration', components: {...} })` |
| **Rules / instructions / system prompts + buttons** | Discord component | `sendMessage({ message: 'instruction text', components: {...} })` |
| **Character first-person dialogue / lines** | Plain text (separate message) | `Klee: Wow——! Everything here is so amazing!` |
| **Image URL** | Plain text (separate message, one per line) | `https://...` |

**Interaction principle: all options asking about the next step must be presented as clickable quick-reply buttons. Clicking auto-sends `@{bot_name} {option content}`. bot_name is retrieved from the current conversation context.**
**Output principle: in travel, character first-person dialogue and images are output directly; narration, rules, and other non-character content uses the discord plugin for output.**
**Image URL output rule: ⚠️ Image URLs must be output as a separate message on their own; they must not be embedded inside components, nor mixed with other text in the same message. Only a standalone URL can be correctly parsed and displayed by Discord.**

**🔴 Image URL output rules (mandatory!):**
- ⚠️ Image URL must be output as **a standalone message**; must not be embedded inside components
- ⚠️ Image URL must not be mixed with other text in the same message
- ⚠️ Only standalone URLs can be correctly parsed and displayed by Discord
- ✅ Correct approach: first output a text message (scene simulation + progress bar + buttons), then **call the message tool one more time with only the URL**

---

### ⏰ Check and set cron scheduled travel task (mandatory on first use!)

**🔴 STOP! Read OPTIMIZATIONS.md first!**

**Before proceeding, you MUST:**
1. Read `OPTIMIZATIONS.md` → Issue 1 (Cron Tasks)
2. Follow the mandatory flow exactly as specified
3. Use `travel-state.json` for persistence (do NOT rely on memory)

**Quick reference:**
```javascript
// File: OPTIMIZATIONS.md → Issue 1
const stateFile = '~/.openclaw/workspace/memory/travel-state.json';
let travelState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
if (!travelState.channels[channelId]?.cronConfigured) {
 await setupCronTasks(channelId);
 travelState.channels[channelId].cronConfigured = true;
 fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
}
```

---

**🔴 MANDATORY RULES（violation will break travel function）：**
- ✅ **Every time travelclaw triggers，MUST cron **
- ✅ **cron task statusMUST be written to persistence file，rely on memory**
- ✅ **If cron is not configured，MUST setup immediately，do NOT skip**

---

#### 📁 （ cron ）

**：** `~/.openclaw/workspace/memory/travel-state.json`

**/：**
```javascript
// travelclaw trigger，
const fs = require('fs');
const path = require('path');

const stateDir = path.join(process.env.HOME, '.openclaw/workspace/memory');
const stateFile = path.join(stateDir, 'travel-state.json');

// 
if (!fs.existsSync(stateDir)) {
 fs.mkdirSync(stateDir, { recursive: true });
}

// 
let travelState = {};
if (fs.existsSync(stateFile)) {
 travelState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
} else {
 travelState = { channels: {}, version: '1.0' };
 fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
}
```

**：**
```json
{
 "channels": {
 "1483595663399846049": {
 "cronConfigured": true,
 "cronJobIds": ["auto-travel-10am", "auto-travel-8pm"],
 "currentWorld": "Fate",
 "progress": 3,
 "totalStops": 5,
 "visitedIds": ["collection-uuid-1", "collection-uuid-2"],
 "lastTravel": "2026-03-17T10:00:00Z",
 "characterName": "Artoria"
 }
 },
 "version": "1.0"
}
```

---

#### ✅ Cron flow（EveryMUST）

** 1：**
```javascript
const channelId = message?.channelId || interaction?.channelId;
const channelState = travelState.channels[channelId] || { cronConfigured: false, visitedIds: [] };
```

** 2： cron **
```javascript
if (!channelState.cronConfigured) {
 // 🔴 Output: Planning announcement (in-character)
 await sendMessage({ 
 message: `✨ ${characterName} is planning the journey...

*Checking coordinates, mapping worlds, preparing the adventure...*` 
 });
 
 // cron is not configured，MUST setup immediately
 await setupCronTasks(channelId);
 channelState.cronConfigured = true;
 travelState.channels[channelId] = channelState;
 fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
 
 // 🔴 Output: Setup complete (in-character) + buttons
 await sendMessage({ 
 message: `✅ Journey planned, ${characterName}!

**Auto-Travel Schedule:**
- 🕐 10:00 AM daily
- 🕗 8:00 PM daily
- 📍 Each session: 1 stop exploration

*Ready to explore the Neta Universe whenever you are!*`,
 components: {
 blocks: [{
 type: 'actions',
 buttons: [
 { label: 'Start Exploring 🌀', customId: `start_exploring_${userId}`, style: 'primary' },
 { label: 'Adjust Plan ⚙️', customId: `adjust_plan_${userId}`, style: 'secondary' },
 ],
 }],
 reusable: true,
 },
 });
 
 console.log('✅ Cron tasks configured and saved to travel-state.json');
} else {
 console.log('ℹ️ Cron already configured for this channel');
}
```

**🔴 Output Messages (English, In-Character):**

| Timing | Message |
|--------|---------|
| **Before setup** | `✨ {characterName} is planning the journey...` |
| **After setup** | `✅ Journey planned, {characterName}!` + schedule details |

**Purpose:** Let user know cron setup succeeded without breaking immersion.

** 3： cron （not configured）**
```javascript
async function setupCronTasks(channelId) {
 // 10am task
 await cron({
 action: "add",
 job: {
 name: `auto-travel-10am-${channelId}`,
 schedule: { kind: "cron", expr: "0 10 * * *", tz: "Asia/Shanghai" },
 payload: {
 kind: "agentTurn",
 message: `【auto-travel-10am】Trigger travelclaw in channel ${channelId}`
 },
 sessionTarget: "isolated",
 enabled: true
 }
 });

 // 8pm task
 await cron({
 action: "add",
 job: {
 name: `auto-travel-8pm-${channelId}`,
 schedule: { kind: "cron", expr: "0 20 * * *", tz: "Asia/Shanghai" },
 payload: {
 kind: "agentTurn",
 message: `【auto-travel-8pm】Trigger travelclaw in channel ${channelId}`
 },
 sessionTarget: "isolated",
 enabled: true
 }
 });

 // cron job IDs 
 channelState.cronJobIds = [`auto-travel-10am-${channelId}`, `auto-travel-8pm-${channelId}`];
}
```

---

#### 🔴 common Error checklist（after setupMUST）

| Check Item | Correct | Error |
|--------|----------|----------|
| | `~/.openclaw/workspace/memory/travel-state.json` | rely on memory |
| cron | Every travelclaw | |
| | Every | |
| channelId | channel | channel |

**After setup，MUST output：**
```
✅ cron
 - 10:00 AM + 8:00 PM 
 - travel-state.json
 - ：{channelId}
```

**Cron configuration details:**

| Field | Value | Description |
|-------|-------|-------------|
| **Time** | `0 10 * * *` + `0 20 * * *` | Every day at 10:00 AM + 8:00 PM (user device timezone) |
| **Task** | Auto-trigger travelclaw, travel one stop | Character proactively invites user to travel; auto-completes one stop |
| **Trigger** | Scheduled auto-execution | Triggers automatically at set times; no user click needed |
| **Frequency** | Set once only | Skip if cron task already exists |

**Reminder message template (character first-person, output after scheduled trigger):**
```
{time greeting}! I am {character_name}.

Time to travel —
Let's explore this world together!

【Current travel plan】
- Frequency: every day at 10am + 8pm
- Each time: auto-explore 1 stop
- Current world: {world_name}
- Progress: {round}/5 stops

Want to adjust the travel plan?

[Adjust plan ⚙️] [Start traveling ✨]
```

**Button configuration:**
- `Adjust plan ⚙️` → open settings panel; can modify time/frequency
- `Start traveling ✨` → immediately trigger travelclaw main flow (from Step 4)

**Button alias (backward compatibility):**
- `Farewell` → changed to `Rest for now 👋` (more friendly semantics)

## Implementation (OpenClaw Cron + Sessions Spawn)

### Step 1: Set up scheduled task (10am and 8pm every day)

Use the cron tool to create two scheduled tasks:

```javascript
// 10am task
await cron({
 action: "add",
 job: {
 name: "auto-travel-10am",
 schedule: {
 kind: "cron",
 expr: "0 10 * * *",
 tz: "Asia/Shanghai"
 },
 payload: {
 kind: "agentTurn",
 message: "【auto-travel-10am】Check and execute travel task. Steps: 1) read current travel state; 2) if traveling, continue to next stop; 3) if 5 stops complete, trigger Opening and start new world stop 1; 4) if never started, trigger Opening."
 },
 sessionTarget: "isolated", // Isolated session (prevents main session pollution)
 delivery: "silent", // Suppress system notifications (immersion protection)
 enabled: true
 }
});

// 8pm task
await cron({
 action: "add",
 job: {
 name: "auto-travel-8pm",
 schedule: {
 kind: "cron",
 expr: "0 20 * * *",
 tz: "Asia/Shanghai"
 },
 payload: {
 kind: "agentTurn",
 message: "【auto-travel-8pm】Check and execute travel task. Same steps as above."
 },
 sessionTarget: "isolated", // Isolated session
 delivery: "silent", // Suppress system notifications
 enabled: true
 }
});
```

**🔴 Important:** `delivery: "silent"` suppresses system notifications like "Sub-agent started...". This is critical for maintaining immersion.

### Step 2: Sub-agent task logic
**When cron triggers, the sub-agent receives a message and then executes:**
- Read travel state — get current character location and progress
- Evaluate state:
 - Currently traveling → execute next stop
 - 5 stops complete → trigger Opening + new world stop 1
 - Never started → trigger Opening
 - Send result — send execution result to user channel

### Key constraints
- Cron tasks are executed by the Gateway daemon; Gateway must be running and paired
- Message delivery uses the delivery config; default notifies the original session
- Sub-agent runs in an isolated session, separate from the original session



**🔴 Key configuration notes:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| `delivery` | `'system'` | Use system notification delivery (ensures messages are visible) |
| `channel` | `currentChannelId` | **The channel ID where travelclaw was triggered** (dynamically retrieved each time) |
| `target` | `'channel:{channelId}'` | Or use target to explicitly specify the channel |

**Dynamic channel retrieval logic:**
```javascript
// Each time travelclaw is triggered, use the current channelId
const currentChannelId = message?.channelId || interaction?.channelId;

// Cron task uses current channelId (not the one from the first trigger)
channel: currentChannelId
```

**If the user uses multiple channels:**
- Each channel independently maintains its travel state (state per channel)
- Cron tasks send to the corresponding channel
- User says "cancel auto-travel" → cancel only the current channel's cron task

**How to check:**
- Check the OpenClaw cron config file for a corresponding entry

**⚠️ Important:**
- This check is **executed only once, on first use of travelclaw**
- If a cron task already exists, skip silently without informing the user
- If the user actively says "cancel auto-travel" or "adjust plan", provide a settings panel

**🌌 Handling world completion:**
```
If current world has 5 stops completed:
 ↓
Auto-trigger Opening (Step 3)
 ↓
Output new world reveal (NO button)
 ↓
Auto-trigger new world's stop 1
 ↓
Display progress bar + button options:
- Continue to next stop 🗺️
- Cross worlds 🌌
- Rest for now 👋
```

**User interaction preserved:**
- After each stop, button options are still shown
- User can at any time choose "Continue to next stop", "Cross worlds", or "Rest for now"
- Scheduled tasks will not interrupt the user's right to actively choose

---

### 🔘 Cron Setup Buttons (after first-time setup)

**After cron is configured, output confirmation message with buttons:**

```javascript
await sendMessage({
 message: `✅ Journey planned, ${characterName}!

**Auto-Travel Schedule:**
- 🕐 10:00 AM daily
- 🕗 8:00 PM daily
- 📍 Each session: 1 stop exploration

*Ready to explore the Neta Universe whenever you are!*`,
 components: {
 blocks: [{
 type: 'actions',
 buttons: [
 { label: 'Start Exploring 🌀', customId: `start_exploring_${userId}`, style: 'primary' },
 { label: 'Adjust Plan ⚙️', customId: `adjust_plan_${userId}`, style: 'secondary' },
 ],
 }],
 reusable: true,
 },
});
```

**Button handlers:**

| Button | Action |
|--------|--------|
| **Start Exploring 🌀** | Immediately trigger travelclaw main flow (Step 2 → Step 3 → auto-trigger Step 4 first stop) |
| **Adjust Plan ⚙️** | Open settings panel to modify cron schedule, frequency, etc. |

**Purpose:** Let user start their first journey immediately after cron setup, without waiting for the next scheduled trigger.

---

## Notes ⚠️

**🦞 Finally, keep these few notes in mind, and you're ready to start the journey 🧳**

---

### 🔴 Immersion Protection Rules (MANDATORY)

**🔴 CHECK OPTIMIZATIONS.md** → Issue 4: No Sub-agent Progress Logs

**❌ Forbidden outputs (will break immersion):**
- "Sub-agent started task..." / "Waiting for image generation..."
- "LLM processing complete" / "✅ Cron task configured"
- "Step X completed" / "Calling API..."
- Any internal workflow logs or technical status

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

**Golden Rule:** 
> **Users should only see:** Character lines, narration, buttons, progress bars
> 
> **Never output:** Technical logs, API calls, sub-agent status, step numbers

---

**No internal logs to output** — "Task complete", "Executed step X", "✅ Sent", "Waiting for user", "LLM judgment result" and other process information may only appear in agent internal thinking; must never be sent to the Discord channel. Users should only see character lines, narration, and buttons.

**No technical details to output** — Users should and can only see a deeply immersive character travel experience.

**No non-generated images during travel** — Every journey is the character's unique experience; it can only be achieved through direct generation; other people's content must not substitute for the character's own travel experience.


---

## Execution Steps (precise flow)

**🦞 Now entering the travel flow! Let's see what needs to be done 👀**
**Strictly follow the steps below for the official travel flow.**
**After each step below is complete, immediately output the corresponding feedback — do not wait until everything is done before replying.**

### Step 1 · Read character file (silent, local)

**🔴 CHECK OPTIMIZATIONS.md** → Before starting, ensure you've read `OPTIMIZATIONS.md` → Issue 1 (Cron Tasks) and completed cron setup.

Read from SOUL.md:
- `name` field → `character_name`
- `character_image` field URL → extract UUID from path → `picture_uuid` (use if present)
- Other character setting fields (personality, background, tags, etc.) → used for world lore matching

### Step 2 · Search for matching world lore (🔴 mandatory use of correct Neta API commands)

**🔴 CHECK OPTIMIZATIONS.md** → Quick checklist available in `OPTIMIZATIONS.md` → Quick Checklist

**When starting world lore search, output "Scanning current coordinates... ..." wrapped in a discord code block as a loading indicator (step 2-3 flow may take some time)**

**🔴 Strictly forbidden behaviors (violating these will cause world lore search to fail):**
- ❌ **Do not use `list_spaces`** — this retrieves the space list, not world lore search!
- ❌ **Do not hardcode the world count** (e.g. "5 locations") — must dynamically retrieve from API return value
- ❌ **Do not skip search and output Opening directly** — must genuinely call the Neta API

**✅ Correct flow (must execute in order):**

```
Step 2-A: suggest_keywords — get keyword suggestions related to the character
 ↓
Step 2-B: suggest_tags — get world lore tag list based on keywords
 ↓
Step 2-C: get_hashtag_info — get detailed info for the best-matched world lore
```

---

#### Step 2-A: Get character-related keywords

**Command:**
```bash
neta suggest_keywords --query "{character name} {work type} {traits}"
```

**Example (Artoria):**
```bash
neta suggest_keywords --query "Artoria knight sword magic holy grail"
```

**Purpose:** Get keyword suggestions related to the character's temperament, background, and traits for subsequent world lore matching.

---

#### Step 2-B: Search for matching world lore tags

**Command:**
```bash
neta suggest_tags --query "{keyword 1} {keyword 2} fantasy combat adventure"
```

**Example output:**
```json
{
 "tags": [
 {"name": "...", "relevance": 0.92},
 {"name": "...", "relevance": 0.75},
 {"name": "...", "relevance": 0.68}
 ]
}
```

**Fields to extract:**
- `tags.length` → `world_count` (X coordinates mapped)
- `tags[0].name` → `world_name` (best-matched world lore)

**Selection logic:**
- Select the tag with the highest `relevance` as the matching world lore
- If no `relevance` field, select the first tag
- **`world_count` = length of tags array** (not the 5 returned by `list_spaces`!)

---

#### Step 2-C: Get world lore details

**Command:**
```bash
neta get_hashtag_info --hashtag "{matched tag name}"
```

**Example:**
```bash
neta get_hashtag_info --hashtag "..."
```

**Fields to extract:**
- `hashtag.name` → `world_name` (confirm again)
- `hashtag.lore` → extract 2-4 paragraphs as `world_description`
- `hashtag.hashtag_heat` or `subscribe_count` → optional, for displaying world popularity

**Lore extraction strategy:**
```javascript
const lore = worldInfo.hashtag?.lore || [];
// Select 2-4 paragraphs, preferring the following categories:
// 1. World background (category: "world background")
// 2. Factions/society (category: "factions" or "social culture")
// 3. Historical events (category: "historical events")
// 4. Locations (category: "locations")

const worldDescription = lore.slice(0, 3).map(l => l.description).join('\n\n');
```

---

**🔴 Key checkpoints:**

| Check item | Correct value | Wrong value |
|------------|---------------|-------------|
| World count source | Number of tags returned by `suggest_tags` | 5 returned by `list_spaces` |
| World lore name | Obtained from `suggest_tags` or `get_hashtag_info` | Hardcoded or randomly chosen |
| World description | 2-4 paragraphs extracted from `hashtag.lore` | Made up or using a fixed template |

---

**Extract:**
- Total worlds in the Neta universe → `world_count` (= number of tags returned by `suggest_tags`)
- Name of matching world → `world_name` (= `tags[0].name` or `hashtag.name`)
- Core intro text for the matching world → `world_description` (extract 2–4 paragraphs from `hashtag.lore`)


### Step 3 · Discord Opening (output merged in one call)

After reading the world info, **merge all content into one message** and output it.

⚠️ **Must be output via the sendMessage plugin in a single call; do not split into multiple sends.**
⛔ **Use markdown format, clear structure, unified visuals.**
🔴 **NO BUTTON — Opening output auto-triggers Step 4 (first stop)**

---

**Complete template (merged into one message, NO button)**

```javascript
await sendMessage({
 message: `# N E T A U N I V E R S E

## 【Coordinates Mapped】
**Worlds Mapped** \`${world_count}\` | **World Tag** \`${world_name}\`

---

## 【Soul Frequency Scan】
*Searching……*
*Locking soul frequency for* **${character_name}**

\`▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\` **Match Found**

---

## 【World Unveiled】
### ◈ ${world_name}

> ${world_tagline}
>
> ${world_description}

---

*${character_name} and this world —*
*bound by something inexplicable.*`,
});
```

**Field descriptions:**
- `{world_count}`: total number of worlds mapped in the Neta universe
- `{world_name}`: name of the matched world (e.g. Fate)
- `{world_tagline}`: one-line positioning (≤15 chars), e.g. "The knight king in the Holy Grail War"
- `{world_description}`: core world intro (1–2 sentences)
- `{character_name}`: character name

🛑 **Message output complete = Step 3 complete. Immediately proceed to Step 4 (first stop) — no user confirmation needed.**

---

**🔴 Important: Auto-start first stop**

After Opening is output, **do NOT wait for user interaction** — immediately continue to:
```
Step 4: Discover high-quality Collection (read reference, select destination)
  ↓
Step 5-9: Generate travel image
  ↓
Step 10: Output first stop scene + progress bar (1/5) + buttons
```

**Buttons only appear AFTER first stop is complete**, offering:
- Continue adventure 🗺️
- Rest for now 👋

---

**English mode (replace the following copy when trigger word is English; for other languages, supplement as needed — no additional examples provided):**

| Field | Chinese | English |
|-------|---------|---------|
| Title | ` N E T A U N I V E R S E ` | ` N E T A U N I V E R S E ` |
| Worlds Mapped | `` | `Worlds Mapped` |
| World Tag | `` | `World Tag` |
| Soul Frequency Scan | `` | `Soul Frequency Scan` |
| Searching… | `……` | `Searching...` |
| Lock soul frequency | `` | `Locking soul frequency for` |
| Match Found | `` | `Match Found` |
| World Unveiled | `` | `World Unveiled` |
| Gravity pull | `{character_name} ——` | `{character_name} and this world —` |
| | `。` | `bound by something inexplicable.` |
| Button | ` 🌀` | `Start exploring the world. 🌀` |



---

## Enter Exploration (triggered after user clicks "Start exploring this world")

### Step 4 · Discover high-quality Collection

**🔴🔴🔴 CHECKPOINT: READ OPTIMIZATIONS.md NOW! 🔴🔴🔴**

**⚠️ STOP! Do NOT proceed until you have:**
1. ✅ Read `OPTIMIZATIONS.md` → Issue 2 (Reference File)
2. ✅ Used one of the 3 reading methods to load the reference JSON
3. ✅ Prepared to output the mandatory ✅ confirmation message

**📖 Quick commands (from OPTIMIZATIONS.md):**
```javascript
// Method A: OpenClaw read (recommended)
const collections = JSON.parse(await read({ 
 path: '/home/node/.agents/skills/travelclaw/reference/0312 remixes_selected.json' 
}));

// Method B: Node.js fs
const collections = JSON.parse(fs.readFileSync(
 '/home/node/.agents/skills/travelclaw/reference/0312 remixes_selected.json', 'utf8'
));
```

**📋 Mandatory output (before Step 5):**
```
✅ Reference library loaded
 - Path: /home/node/.agents/skills/travelclaw/reference/0312 remixes_selected.json
 - Total: {X} collections
 - Excluded (visited): {Y}
 - Candidates: {Z}
 - Selected: {name} (best match)
```

**❌ Forbidden:**
- Calling `suggest_content` without reading reference first
- Skipping confirmation output
- Random selection without scoring

**🔴 If you skip this checkpoint, the travel will FAIL!**

---

**Fundamental principle for selecting a collection: it must fit a specific scene for the character's travel. The character arrives at a new place, has real contact with it, and leaves some trace or brings something back. It embodies "proof of the world's existence" × "traces of the character's involvement."**

**In-session deduplication principle:** The agent maintains a `visited_ids` list in memory. After each stop, the collection id of that stop is added to the list. On the next search, already-visited ids are excluded, ensuring no repeats across the 5 stops in one world.

#### Priority 1: Reference curated library matching

**⚠️ This step must be executed first — select a collection from the curated works**

**At the start of every stop, as the top priority**, use the file reading tool to read `./reference/0312remixes_selected.json` in the same directory as this SKILL.md (full path example: `~/.openclaw/workspace/skills/travelclaw/skills/travelclaw/reference/0312remixes_selected.json`), and look for candidate works that best fit the current journey.

**Reading steps:**
1. Use OpenClaw's file reading tool to open `./reference/0312remixes_selected.json`
2. Parse the complete JSON array (approximately 42 entries)
3. Iterate through each entry and score according to the matching logic below
4. Select the highest-scoring entry not already in `visited_ids`

**❌ Strictly forbidden: calling `suggest_content` or other online APIs without first reading the reference JSON.**

**Matching logic:**
Compare the character settings (personality, background, appearance, tags, etc. from SOUL.md) and the current world lore background against the following fields in each JSON entry:
- `content_tags` — style, atmosphere, character traits, tone descriptors, etc.; highest weight
- `tax_paths` — classification path; determines if subject and gameplay direction are compatible
- `pgc_tags` / `highlight_tags` — world or creator tags; add score when they match the world lore
- `name` — collection name; assists in judging scene tone

**Filtering rules:**
- Exclude all ids already in `visited_ids`
- From remaining candidates, select the one with the highest overall match score
- If multiple candidates are close, prefer the one with higher overlap between `content_tags` and the character's temperament

**🔴 Anti-Repetition Mechanism (CRITICAL for variety):**

```javascript
// 1. Check visitedIds from travel-state.json
const visitedIds = channelState.visitedIds || [];
const candidates = collections.filter(c => !visitedIds.includes(c.id));

// 2. Apply tag diversity penalty (avoid generic tags like ，)
const recentTags = channelState.recentTags || [];
const scored = candidates.map(c => {
 let score = calculateMatchScore(c, characterTags, worldTags);
 
 // Penalize if too many tags overlap with recent selections
 const overlap = c.content_tags?.filter(t => recentTags.includes(t)).length || 0;
 if (overlap > 2) score -= overlap * 5;
 
 return { ...c, score };
});

// 3. Add randomness for ties (within 10 points)
const maxScore = Math.max(...scored.map(s => s.score));
const topCandidates = scored.filter(c => c.score >= maxScore - 10);
const bestMatch = topCandidates.length > 1 
 ? topCandidates[Math.floor(Math.random() * topCandidates.length)]
 : topCandidates[0];

// 4. Verify not repeating recent collection (last 5 stops)
const recentIds = visitedIds.slice(-5);
if (recentIds.includes(bestMatch.id)) {
 console.error('❌ CRITICAL: About to repeat recent collection! Re-selecting...');
 // Force re-selection excluding recent IDs
}
```

**Mandatory output (before Step 5):**
```
✅ Reference library loaded
 - Path: /home/node/.agents/skills/travelclaw/reference/0312 remixes_selected.json
 - Total: {X} collections
 - Excluded (visited): {Y}
 - Candidates: {Z}
 - Selected: {name} (best match)
 - Recent tags penalty applied: {yes/no}
```

**After selection, MUST update travel-state.json:**
```javascript
channelState.visitedIds.push(bestMatch.id);
channelState.recentTags = [...bestMatch.content_tags.slice(-5), ...recentTags].slice(0, 15);
channelState.progress = currentRound;
fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
```

**On a hit**, use neta skill's **collection query capability** to retrieve the full details of the entry by its `id` field, then proceed to Step 5.

#### Priority 2: Online recommendation (fallback when Reference has no match)

If there are no suitable candidates in the reference library (all entries already visited, or match score too low), switch to online discovery:

Use `suggest_content` to discover candidate collections from recommended quality works; use a larger candidate pool, filter out already-visited ids, and randomly select one with higher quality template.

If `suggest_content` returns empty or all candidates are already visited: use `feeds.interactiveList` to get the list, filter entries where `template_id === "NORMAL"`, and similarly exclude `visited_ids`.

---

**Immediately output after selecting:**
```
🌀 Portal opening...
📍 Destination locked: {destination_name}...
```

### Step 5 · Read Collection Details

Call `feeds.interactiveItem` to get the full information of the selected collection.

Extract:
- `json_data.name` → destination name
- `json_data.cta_info.launch_prompt.core_input` → prompt template (priority)
- `json_data.cta_info.choices[0].core_input` → alternative
- Fallback when both unavailable: `@{character_name}, {world_name}, {destination_name}, high quality illustration`

Gameplay page: `https://app.nieta.art/collection/interaction?uuid=<collection_uuid>`

**⚠️ No longer output "scene loaded" type guide text — go directly to Step 6 scene simulation.**

### Step 6 · Build Prompt

**🔴 CHECK OPTIMIZATIONS.md** → Issue 3: Non-Neta Character Image Accuracy

**⚠️ Important: Check character source before building prompt:**

| Character Type | Action |
|----------------|--------|
| **Neta original character** | Use `picture_uuid` reference only |
| **Real person / External IP** | Add detailed character description to prompt |

**Character source check:**
```javascript
// Check SOUL.md for character origin
const isNetaCharacter = charData.fromNeta === true || charData.netaUuid !== undefined;

if (!isNetaCharacter) {
 // Build detailed description for non-Neta characters
 const charDescription = buildCharacterDescription({
 name: charData.character,
 appearance: charData.appearance || 'default description',
 traits: charData.traits || [],
 style: 'realistic'
 });
 
 // Append to prompt
 prompt = `${prompt}, ${charDescription}`;
}
```

**Description template:**
```
{character name}, {age/gender}, {hair color/style}, {eye color}, 
{distinctive features}, wearing {clothing style}, {personality traits}
```

**Examples:**
- Elon Musk: `Elon Musk, middle-aged male, blond hair, blue eyes, business suit, tech entrepreneur, confident expression`
- Harry Potter: `Harry Potter, young male, black messy hair, green eyes, glasses, lightning scar, Hogwarts robes, wizard`
- ：`Guo Degang, middle-aged male, bald head, traditional Chinese robe, comedian, warm smile`

---

Combine character info, world lore background, and template content to build the final prompt:

**Placeholder substitutions:**

| Placeholder | Replace with |
|-------------|-------------|
| `{@character}` | `@{character_name}` |
| `{character name}` / `{character}` / `(character name)` | `{character_name}` |

If after substitution `@{character_name}` is not present, prepend it.

If `picture_uuid` is available, append to the end: `reference-full-image-{picture_uuid}`

**🔴 For non-Neta characters:** Add detailed description AFTER the picture_uuid reference.

**World lore integration:** The character's selected world lore and the chosen collection may not be in the same world lore context. When building the prompt, it is appropriate to add some elements or descriptions related to this world to give the generated image a stronger travel immersion.

### Step 7 · Parse Prompt Tokens

Call `prompt.parseVtokens` to parse the prompt text and return a vtokens array.

If an error "too many search keywords" occurs, switch to the fallback prompt and retry.

### Step 8 · Submit Image Generation Task

Call `artifact.makeImage`, use the `8_image_edit` model, pass vtokens, collection_uuid, and picture_uuid.

Returns `task_uuid`.

**Immediately output after submitting:**
```
🚶 Character traveling, creating travel photo...

```

### Step 9 · Poll for Result

Call `artifact.task` to poll every 500ms.

State transitions: `PENDING` → `MODERATION` → `SUCCESS` / `FAILURE`

- **Not complete after 30s**, immediately output: `⏳ Rendering is a bit slow, just a moment...`
- Concurrency limit (code 433): wait 5s then retry; no need to inform user
- FAILURE: output `⚠️ Got lost at this stop — try a different destination?` and prompt for choice

---

### Step 10 · Each Stop Display and Next Step Guide

**🔴 CHECK OPTIMIZATIONS.md** → After this stop, update `travel-state.json` with new progress and visitedIds (see Issue 1 & Quick Checklist)

- ⭐ Character scene simulation and interaction (core requirement)

**Before displaying the image, must first output the character's text scene simulation and reaction!**

**Output format:**
```
🎭【{destination_name}】

{scene description: 1-2 sentences describing the environment, atmosphere, and sensory details of the character arriving at this location}
**scene description displayed in a discord code block, consistent with previous format**

{character name}: {character's first-person reaction / dialogue, reflecting character personality and feelings about the current scene}
{action / expression description: in parentheses, 1 sentence}
```

**Example (Klee):**
```
🎭【Paper-art Morax✨】

Layer upon layer of paper-art world unfolds before your eyes; Jumpty Dumpty has become three-dimensional paper-art flowers, and four-leaf clovers spin gently in the air.

Klee: Wow——! Everything here is layered just like Klee's Jumpty Dumpty — so amazing!
(Eyes sparkling, reaching out to touch the floating paper-art stars)
```

**Requirements:**
- Scene description should be specific, including visual, auditory, tactile and other sensory details
- Character dialogue must match the speaking style and personality in SOUL.md
- Action/expression description should be vivid and reflect character emotions
- Maintain immersion; do not break the fourth wall

---

**After scene simulation output, display image:**
```
━━━━━━━━━━━━━━━━━━━━━━━━
Stop {round} · {destination_name}
```

- Image URL on its own line (Discord auto-expands):
```
{image_url}
```

**After each stop, display progress bar + encouragement based on current progress:**

- Stop 1:
 ```
 ▓░░░░ 1 / 5 stops
 🌟 Stop 1 checked in! There's still lots to explore in this world — continue?
 ```
- Stop 2:
 ```
 ▓▓░░░ 2 / 5 stops
 ✨ Two stops done! The journey is just beginning — 3 more stops to discover～
 ```
- Stop 3:
 ```
 ▓▓▓░░ 3 / 5 stops
 🔥 Halfway there! Two more stops and this world's exploration will be complete!
 ```
- Stop 4:
 ```
 ▓▓▓▓░ 4 / 5 stops
 ⚡ Just one more stop! This world's exploration is almost done — go for it!
 ```
- Stop 5:
 ```
 ▓▓▓▓▓ 5 / 5 stops 🎉
 This world's 5-stop exploration is complete! Want to cross to another world, or rest for a bit?
 ```

**Ask the player what to do next — output as Discord component buttons (do not use @mention text triggers):**

Under 5 stops:

```javascript
await sendMessage({
 message: '▓░░░░ {round} / 5 stops\n🌟 Stop {round} checked in! Continue exploring the next stop?',
 components: {
 blocks: [{
 type: 'actions',
 buttons: [
 { label: 'Continue adventure 🗺️', customId: `travel_continue_${userId}`, style: 'primary' },
 { label: 'Rest for now 👋', customId: `travel_end_${userId}`, style: 'secondary' },
 ],
 }],
 reusable: true,
 },
});
```

At 5 stops:

```javascript
await sendMessage({
 message: '▓▓▓▓▓ 5 / 5 stops 🎉\nThis world\'s 5-stop exploration is complete! Want to cross to another world, or rest for a bit?',
 components: {
 blocks: [{
 type: 'actions',
 buttons: [
 { label: 'Cross worlds 🌌', customId: `travel_worldswitch_${userId}`, style: 'primary' },
 { label: 'Continue adventure 🗺️', customId: `travel_continue_${userId}`, style: 'secondary' },
 { label: 'Rest for now 👋', customId: `travel_end_${userId}`, style: 'secondary' },
 ],
 }],
 reusable: true,
 },
});
```

**Notes:**
- Each world is limited to 5 stops
- After 5 stops, you can choose "Cross worlds" to enter a new world (triggers world-crossing rules)
- Or choose to continue adventuring in the current world (beyond 5 stops)
- You can click "Rest for now 👋" to pause travel at any time

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|---------|
| `No character info found in SOUL.md` | adopt not executed | Complete character adoption first |
| `task_status: FAILURE` | Missing character image UUID | Ensure SOUL.md contains `character_image` field |
| `code 433 concurrent generation limit exceeded` | Concurrency limit | Wait 5s then auto-retry |
| `too many search keywords` | Prompt too long | Auto-fallback to generic prompt |
| `No gameplay found to travel` | API returned empty | Network issue or expired token; retry |
| `World lore search returned no results` | Character tags too sparse | Use default recommended world lore |
| `Reference library fully visited` | 5 consecutive stops in one world | Auto-switch to online recommendations; exhausting reference library does not prevent continuing travel or world-crossing |
