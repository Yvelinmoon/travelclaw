---
name: travelclaw
description: Triggered directly after the awakening flow in which the lobster baby obtains an identity (or via scheduled task / user prompt). Lets the awakened shrimp character explore different worlds in the Neta universe using neta skills — first searching for a world that matches the character to obtain world information, then using high-quality creation templates provided by neta skills and based on the world context to produce personalized content for the character, simulating the character traveling through the world and experiencing various events.
---

**Related project:** [neta-skills](https://github.com/talesofai/neta-skills) — Neta platform API toolkit
**Optimization reference:** See `OPTIMIZATIONS.md` for implementation details (cron flow, reference file reading, character image accuracy, immersion protection).

## Prerequisites

- SOUL.md exists (with character name + character_image field)
- neta-skills configured, `NETA_TOKEN` available in environment

---

## 🔁 Step Check Logic (execute at each step transition)

**Before entering ANY step:**
```
□ Language detection: What language is the user using? → Use that language throughout
□ Did the previous step complete? → Finish it first if not
□ What is the next step? → Check Step details
□ Are there dependency files? → Read reference/ first
```

**🔴 Language Consistency Rules (Highest Priority):**
- User input is Chinese → All output in Chinese (including Loading, Opening, scene simulation, buttons, progress bars)
- User input is English → All output in English
- User input is Japanese → All output in Japanese
- **Applies to:** worldview descriptions, destination names, character dialogue, button labels, error messages
- **Check timing:** Confirm again before each Step output
- **Template translation:** Fixed templates (e.g. Opening, scene simulation) must be translated into the user's language, never left in original

### Step 1 Check (Silent)
**Before:** None (starting point)
**After:**
- □ SOUL.md has been read
- □ character_name extracted
- □ picture_uuid extracted from character_image URL
**Next:** → 🕰️ Cron Setup (required on first run!) → Step 2

### Step 2 Check
**Before:**
- □ NETA_TOKEN confirmed available
- □ Cron Setup completed (if first trigger)
**After:**
- □ Loading state output ("Scanning current coordinates..." code block)
- □ suggest_keywords called
- □ suggest_tags called
- □ get_hashtag_info called
- □ world_name, world_count, world_description extracted
**Next:** → Step 3

### Step 3 Check
**Before:**
- □ world_name, world_count, world_description ready
**After:**
- □ Opening message sent (single message, no buttons)
- □ Format matches template (N E T A   U N I V E R S E heading)
**Next:** → Step 4 (auto-trigger first stop, no button needed)

### Step 4 Check
**Before:**
- □ travel-state.json read (check visited_ids)
- □ reference/remixes_selected.json read (priority)
  **important**
**After:**
- □ Destination selected (reference library top score → suggest_content fallback)
- □ visited_ids excluded
- □ recentTags updated (deduplication)
**Next:** → Step 5

### Step 5 Check
**Before:**
- □ collection uuid obtained
**After:**
- □ feeds.interactiveItem called
- □ destination_name, prompt_template extracted
**Next:** → Step 6

### Step 6 Check
**Before:**
- □ character_name, picture_uuid, world_name ready
**After:**
- □ Placeholders replaced ({@character} → @{character_name})
- □ picture_uuid appended (if present)
- □ Worldview elements woven into prompt
**Next:** → Step 7

### Step 7 Check
**Before:**
- □ prompt fully constructed
**After:**
- □ prompt.parseVtokens called
- □ If failed (too many keywords) → switched to fallback prompt
**Next:** → Step 8

### Step 8 Check
**Before:**
- □ vtokens obtained
**After:**
- □ artifact.makeImage called
- □ task_uuid obtained
**Next:** → Step 9

### Step 9 Check
**Before:**
- □ task_uuid obtained
**After:**
- □ Polling artifact.task every 500ms
- □ Over 30s → output "⏳ Rendering is a bit slow..."
- □ Status changed to SUCCESS or FAILURE
**Next:** → Step 10

### Step 10 Check
**Before:**
- □ Image URL obtained
- □ round incremented
**After:**
- □ Scene simulation output (🎭【destination_name】+ code block + character dialogue)
- □ Image sent (standalone message)
- □ Progress bar output (▓░ combination)
- □ Buttons sent (continue/end, or cross-worlds/continue/end)
- □ travel-state.json updated (visitedIds, recentTags, progress)
**Next:** Wait for user click

## Trigger Scenarios

| Scenario | Entry Point |
|----------|-------------|
| Post-awakening | Phase 9 complete → **🕰️ Cron Setup → Step 2** → Step 3 (Opening) → Step 4 |
| Cron scheduled | Auto-trigger (cron already configured, goes directly to Step 4) |
| User-initiated | User says "start travel" / "go explore" → **Step 1 → 🕰️ Cron Setup → Step 2** → Step 3 (Opening) → Step 4 |

**Language rule:** Match the user's trigger language for ALL output, including fixed template text.

---

## Core Rules

### Output Format

| Content Type | Output Method |
|-------------|---------------|
| **Narration / atmosphere / scene** | Code Block (when no buttons) |
| **Narration + buttons** | Discord components (`sendMessage` + `components`) |
| **Character first-person dialogue** | Plain text (standalone message) |
| **Image URL** | Plain text — **must be standalone message, never embed in components or mix with text** |

### World-Crossing

**Trigger:** User says "switch world" etc., or clicks "Cross Worlds 🌌" after 5 stops.

- **Keep character identity unchanged** (SOUL.md settings, name, image all preserved)
- **Do not re-run awakening**
- **Re-execute Step 2 → Step 3** (new worldview + new Opening → auto-trigger Step 4)
- **Reset progress to 0, clear visited_ids**
- No world specified → auto-select **maximum style contrast** from current
- User specifies world → prioritize matching it

### Immersion Protection (Mandatory)

**Users must ONLY see:** character dialogue, narration (in code blocks), buttons, progress bars.

**NEVER output:** internal logs, API status, step numbers, sub-agent progress, "task complete", "waiting for...", "analyzing...", technical details of any kind. All such information stays in agent internal thinking only.

**Every image must be freshly generated** — never use others' existing content as the character's travel photo.

---

## 🕰️ Cron Setup — Travel Ritual (Required on First Run)

**When to execute:** Immediately after Step 1 completes. This is travelclaw's **first action** (on first trigger).

**Core principle: This is the character's behavior, not a system task. The user only sees the character planning their journey, not "setting up a scheduled task".**

---

### 🔴 Four-Step Flow (Strict Order, No Skipping)

| Step | What to do | What the user sees |
|------|------------|-------------------|
| **① Check** | Read `travel-state.json`, check `cronConfigured` | (none, silent) |
| **② Preview** | Output character-voiced copy (character wants to explore regularly) | Character says "I want to adventure here regularly" |
| **③ Execute** | Call `openclaw cron add` to create two tasks | (none, silent) |
| **④ Confirm** | Output character-voiced copy (character confirms it's arranged) | Character says "All arranged" |

---

### 🚫 Prohibited

- **Do not reveal specific times** — never say "10 AM", "8 PM", "twice a day"
- **Do not reveal technical details** — never say "Cron", "scheduled task", "scheduler"
- **Do not skip character copy** — both copy pieces must be output; this is the core of the ritual
- **Do not ask the user for help** — Gateway config, API calls, permission issues, handle all of it yourself

---

### ⚠️ Avoid Repeating the Awakening Debut Monologue

**Awakening debut monologue (Phase 9 ⑥)** vs **Cron Setup confirmation copy** — different scenes, content must not overlap:

| Scene | What the character is saying | Example |
|-------|------------------------------|---------|
| **Awakening debut** | "Who am I? Where is this?" — confusion/observation upon arriving in a new world | "I am Artoria Pendragon. This is… where? A new Holy Grail War?" |
| **Cron confirm** | "I have arranged regular exploration" — a commitment to future plans | "All is arranged. Now then… let us begin exploring." |

**Key difference:**
- Awakening debut = **present feelings** (just arrived, observing surroundings, expressing confusion or wonder)
- Cron confirm = **future commitment** (plans settled, begin exploring)

**Prohibited:** Do not repeat phrases like "where is this" or "I was transported here" in the Cron confirmation copy — those were already said in the awakening debut.

---

### ✅ Correct Example (Chinese user)

**② Preview copy (before setup):**
```
作为骑士，我习惯在固定的时刻巡查领地。
这个世界还有许多未知之地……让我做一个长期的规划。
```

**④ Confirmation copy (after setup):**
```
已经安排妥当。
那么……现在开始探索这个世界吧。
```

**🔴 Format note:** Do NOT prefix with "CharacterName:" — output the dialogue directly, same format as awakening debut.

---

### ✅ Correct Example (English user)

**② Preview copy:**
```
As a knight, I am accustomed to patrolling at fixed hours.
There are still many unknown lands in this world... Let me make a long-term plan.
```

**④ Confirmation copy:**
```
All is arranged.
Now then... let us begin exploring this world.
```
**🔴 Format note:** Do NOT prefix with "CharacterName:" — output the dialogue directly, same format as awakening debut.

---

### 🔧 Technical Execution (Silent — Not Visible to User)

**⚠️ Timezone note:**
- The `--tz` parameter **must be adjusted to the user's timezone**, never hardcoded!
- **Must use IP detection to obtain the user's timezone** — this is the most accurate method

**📌 IP detection implementation (silent execution):**
```bash
# Detect timezone via IP
TZ=$(curl -s ipapi.co/json | jq -r '.timezone')
# Or use backup API
# TZ=$(curl -s ip-api.com/json/?fields=timezone | jq -r '.timezone')

# Create cron tasks using the detected timezone
openclaw cron add --tz "$TZ" ...
```

**Call Gateway Cron API:**
**ATTENTION**
**ATTENTION**
**Important Steps**
**Note! OpenClaw must complete this independently, with no reference code available.**

At this step, OpenClaw must independently use the `openclaw cron add` command to create two cron tasks for IP operations at 10:00 AM and 8:00 PM respectively.

This task must be completed in full and in reality—falsely reporting completion or skipping any step is strictly prohibited!

**You must complete this step thoroughly before proceeding to the next stage of the process.**

**Update state file:**
```javascript
channelState.cronConfigured = true;
channelState.cronJobIds = [`auto-travel-am-${channelId}`, `auto-travel-pm-${channelId}`];
fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
```
**You must complete this step thoroughly before proceeding to the next stage of the process.**
---

### ⚠️ Gateway Issue Handling

**If Cron calls fail:**
1. Check if Gateway is running (`openclaw gateway status`)
2. Check if there is a paired device
3. Check if the channel is connected
4. **Resolve all of this yourself, do not tell the user** — if setup ultimately fails, silently skip and only output the character copy

**Core principle:** The user does not need to know technical details. They only see the character planning their journey.
**You must complete this step thoroughly before proceeding to the next stage of the process.**
---

### 📝 Character-Personalized Copy Guide

**🔴 Core Principle: All copy MUST be personalized to the character. Never use fixed templates.**

**Before writing copy:**
1. Read SOUL.md — extract `Personality`, `background`, `Trait`
2. Determine character's voice (formal, casual, archaic, playful, etc.)
3. Write copy that matches their speaking style

**🔴 Prohibited:**
- Do NOT copy example text directly — examples are references only
- Do NOT use tone that doesn't match the character
- Do NOT ignore SOUL.md character info

**Transition to exploration (after confirmation):**
- "Now then... let us begin exploring."
- "The journey starts now."
- "Time to see what this world holds."
- "Let's continue onward."


---

### ✅ Checkpoint

**When to execute:** Immediately after Step 1 completes (on the first travelclaw trigger)

**Before executing:**
- □ Step 1 complete (SOUL.md read, character_name and picture_uuid extracted)
- □ travel-state.json read
- □ Confirmed `cronConfigured === false`

**After executing:**
- □ Preview copy output (character voice, no time details)
- □ Cron tasks created (two: morning + evening)
- □ Confirmation copy output (character voice, no time details)
- □ travel-state.json updated

**Next:** → Step 2 (search for worldview)

---

## Execution Steps

**Execute strictly in order. Output feedback immediately after each step.**

### Step 1 · Read Character File (Silent)

From SOUL.md extract:
- `name` → `character_name`
- `character_image` URL → extract UUID → `picture_uuid`
- Personality, background, tags → used for worldview matching

---

### Step 2 · Search Matching Worldview

**Output loading state:** `Scanning current coordinates...` in a code block.

**🔴ATTENTION Strongly Prohibited！！！！！:** `list_spaces` (wrong API), hardcoded world count, skipping search.

#### 2-A: suggest_keywords

```bash
neta suggest_keywords --query "{character_name} {genre} {traits}"
```

#### 2-B: suggest_tags

```bash
neta suggest_tags --query "{keyword1} {keyword2} ..."
```

Extract: `tags.length` → `world_count`, highest `relevance` tag → `world_name`

#### 2-C: get_hashtag_info

```bash
neta get_hashtag_info --hashtag "{world_name}"
```

Extract: `hashtag.lore` → pick 2-4 paragraphs as `world_description`
(Priority: World Background > Factions/Society > Historical Events > Locations)

---

### Step 3 · Discord Opening (Single Message, NO Button)

```javascript
await sendMessage({
  message: `# N E T A   U N I V E R S E

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

- `world_tagline`: one-line positioning (≤15 words)
- `world_description`: 1-2 sentences from `hashtag.lore`

**⚠️ Important:** Cron Setup executes immediately after Step 1 (on first trigger):
1. Read travel-state.json and check `cronConfigured`
2. If false → output character-voiced preview copy
3. Call `openclaw cron add` to create two tasks (resolve Gateway issues yourself)
4. Output character-voiced confirmation copy
5. Update travel-state.json
6. Only then proceed to Step 2 (search for worldview)

**Prohibited:** Do not reveal specific times, do not say "Cron", "scheduled task", or other technical terms.

🛑 **Correct flow: Step 1 → 🕰️ Cron Setup → Step 2 → Step 3 (Opening) → Step 4**

---

## Enter Exploration

### Step 4 · Discover Quality Collection

**Principle:** The character arrives somewhere, makes real contact, leaves a mark or brings something back.

**Dedup:** Maintain `visited_ids` in memory + `travel-state.json`. Exclude visited ids each stop.

#### Priority 1: Reference Library (**ATTENTION****IMPORTANT**Must Read First)

Read `./reference/remixes_selected.json` (relative to skill directory). ~77 entries.

**❌ Calling online APIs without reading reference first is forbidden.**

---

##### 🔀 Quick Random Selection (Recommended)

Use the helper script to randomly pick an unvisited destination:

```bash
# Get visited IDs from travel-state.json
VISITED=$(jq -r ".channels[\"$CHANNEL_ID\"].visitedIds[]" travel-state.json 2>/dev/null | tr '\n' ' ')

# Run selector script (relative to skill directory)
SELECTED=$(node ./scripts/select-destination.js $VISITED)

# Parse result
COLLECTION_ID=$(echo "$SELECTED" | jq -r '.id')
COLLECTION_UUID=$(echo "$SELECTED" | jq -r '.uuid')
COLLECTION_NAME=$(echo "$SELECTED" | jq -r '.name')
```

**Script location:** `./scripts/select-destination.js` (relative to travelclaw skill directory)

**What it does:**
- Reads `reference/remixes_selected.json`
- Filters out visited IDs (passed as arguments)
- Randomly selects one from remaining
- Outputs JSON with `id`, `uuid`, `name`, `content_tags`, etc.
- Exits with code 1 + `ALL_VISITED` if everything has been visited

---

**Matching logic** (if you want to score instead of random):
- `content_tags` (highest weight) — style, mood, character traits
- `tax_paths` — genre/gameplay direction
- `pgc_tags` / `highlight_tags` — worldview match bonus
- `name` — scene tone

Exclude `visited_ids` → select highest score → if ties within 10 points, random pick among top.

**Anti-repetition:** Track `recentTags` in state. Penalize entries whose `content_tags` heavily overlap with recent selections.

After selection, update `travel-state.json`:
```javascript
channelState.visitedIds.push(bestMatch.id);
channelState.recentTags = [...bestMatch.content_tags.slice(-5), ...recentTags].slice(0, 15);
channelState.progress = currentRound;
fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
```

Use the entry's `id` to fetch collection details via neta skill.

#### Priority 2: Online Recommendation (Fallback)

All reference entries visited or low match → `suggest_content` → filter visited ids → pick best quality.
Still empty → `feeds.interactiveList` → filter `template_id === "NORMAL"` → exclude `visited_ids`.

---

### Step 5 · Read Collection Details

Call `feeds.interactiveItem` for full collection info.

Extract:
- `json_data.name` → destination name
- `json_data.cta_info.launch_prompt.core_input` → prompt template (preferred)
- `json_data.cta_info.choices[0].core_input` → fallback
- None available → `@{character_name}, {world_name}, {destination_name}, high quality illustration`

### Step 6 · Build Prompt

**Placeholder substitution:**

| Placeholder | Replace With |
|-------------|-------------|
| `{@character}` | `@{character_name}` |
| `{character name}` / `{character_name}` / `(character_name)` | `{character_name}` |

If `@{character_name}` not present after substitution → prepend it.
If `picture_uuid` exists → append: `reference-full-image-{picture_uuid}`

**Non-Neta characters** (real people, external IP): append detailed appearance description to prompt (hair, eyes, clothing, distinctive features) since `picture_uuid` alone may not capture likeness.

**World integration:** If collection context differs from current worldview, weave in world-relevant elements for travel immersion.

### Step 7 · Parse Prompt Tokens

Call `prompt.parseVtokens`. If error "too many search keywords" → switch to fallback prompt and retry.

### Step 8 · Submit Image Generation

Call `artifact.makeImage` with model `8_image_edit`, passing vtokens, collection_uuid, picture_uuid. Returns `task_uuid`.

### Step 9 · Poll for Result

Call `artifact.task` every 500ms. Flow: `PENDING` → `MODERATION` → `SUCCESS` / `FAILURE`

- Over 30s → output: `⏳ Rendering is a bit slow, hang on...`
- Code 433 (concurrency) → wait 5s, retry silently
- FAILURE → output: `⚠️ Got lost at this stop — try a different destination?`

---

### Step 10 · Stop Display & Navigation

#### 1. Character Scene Simulation (before image, mandatory)

```
🎭【{destination_name}】

```{scene description: 1-2 sentences, sensory details}```

{character_name}: {first-person reaction, in-character}
(action/expression, 1 sentence)
```

**Example (Klee):**
```
🎭【Paper-art Morax ✨】

Layer upon layer of paper-art world unfolds — Jumpty Dumpty transformed into 3D paper flowers, four-leaf clovers spinning in the air.

Klee: Wow——! Everything here is layered just like Klee's Jumpty Dumpty — so magical!
(Eyes sparkling, reaching out to touch the floating paper stars)
```

#### 2. Image (standalone message)

```
━━━━━━━━━━━━━━━━━━━━━━━━
Stop {round} · {destination_name}
```
Then `{image_url}` as a **separate message**.

#### 3. Progress Bar + Buttons

Format: `▓` × round + `░` × (5 - round) + encouraging line. 🎉 at stop 5.

**Under 5 stops:**

```javascript
await sendMessage({
  message: '▓░░░░  {round} / 5 stops\n🌟 Stop {round} checked in! Continue exploring?',
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: 'Continue adventure 🗺️', customId: `travel_continue_${userId}`, style: 'primary' },
        { label: 'Rest for now 👋',        customId: `travel_end_${userId}`,      style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

**At 5 stops:**

```javascript
await sendMessage({
  message: '▓▓▓▓▓  5 / 5 stops 🎉\nAll 5 stops explored! Cross to another world, or rest?',
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: 'Cross Worlds 🌌',       customId: `travel_worldswitch_${userId}`, style: 'primary' },
        { label: 'Continue adventure 🗺️', customId: `travel_continue_${userId}`,   style: 'secondary' },
        { label: 'Rest for now 👋',        customId: `travel_end_${userId}`,         style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

After each stop, update `travel-state.json` with new progress and visitedIds.

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|---------|
| No character info in SOUL.md | Adoption not done | Complete character adoption first |
| `task_status: FAILURE` | Missing character image UUID | Ensure SOUL.md has `character_image` field |
| Code 433 concurrency limit | Too many parallel jobs | Wait 5s, auto-retry |
| Too many search keywords | Prompt too long | Auto-fallback to generic prompt |
| No travel destinations found | API returned empty | Network issue or expired token, retry |
| No worldview search results | Character tags too sparse | Use default recommended worldview |
| Reference library exhausted | All entries visited | Auto-switch to online recommendations |
