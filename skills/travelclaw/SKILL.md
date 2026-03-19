---
name: travelclaw
description: Triggered directly after the awakening flow in which the lobster baby obtains an identity (or via scheduled task / user prompt). Lets the awakened shrimp character explore different worlds in the Neta universe using neta skills — first searching for a world that matches the character to obtain world information, then using high-quality creation templates provided by neta skills and based on the world context to produce personalized content for the character, simulating the character traveling through the world and experiencing various events.
---

**Related project:** [neta-skills](https://github.com/talesofai/neta-skills) — Neta platform API toolkit
**Optimization reference:** See `OPTIMIZATIONS.md` for implementation details (cron flow, reference file reading, character image accuracy, immersion protection).

## Prerequisites

- SOUL.md exists (with character name + character_image field)
- neta-skills configured, `NETA_TOKEN` available in environment

## Trigger Scenarios

| Scenario | Entry Point |
|----------|-------------|
| Post-awakening | Phase 9 complete → **skip Step 1, start from Step 2**. Opening auto-triggers Step 4 (no button). |
| Cron scheduled | Auto-trigger (see Cron Setup below) |
| User-initiated | User says "start travel" / "go explore" / "go traveling" etc. |

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

## Cron Setup (First Use Only)

On first travelclaw trigger per channel, check `travel-state.json` and setup cron if not configured. Gateway pairing and Discord session config issues must be resolved autonomously — users cannot assist.

**🔴 Cron setup must include character-personalized messages (in-character voice, matching user language).**

**Before setup — announce in character:**
```javascript
await sendMessage({
  message: `{character_name}: {in-character line about wanting to explore regularly}

Setting up travel schedule — daily 10 AM + 8 PM, one stop per session.`,
});
```

Example (Klee): `Klee: Klee wants to go on adventures every day! Let me mark it on my calendar~`
Example (Saber): `Saber: A knight must maintain discipline. I shall patrol this world at dawn and dusk.`

**State file:** `~/.openclaw/workspace/memory/travel-state.json`

```javascript
// Read or initialize state
const stateFile = '~/.openclaw/workspace/memory/travel-state.json';
let travelState = fs.existsSync(stateFile)
  ? JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  : { channels: {}, version: '1.0' };

const channelId = message?.channelId || interaction?.channelId;
const channelState = travelState.channels[channelId] || { cronConfigured: false, visitedIds: [] };

if (!channelState.cronConfigured) {
  // Setup 10am + 8pm tasks
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
      delivery: "silent",
      enabled: true
    }
  });
  // 8pm: same as above, expr: "0 20 * * *"

  channelState.cronConfigured = true;
  channelState.cronJobIds = [`auto-travel-10am-${channelId}`, `auto-travel-8pm-${channelId}`];
  travelState.channels[channelId] = channelState;
  fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
}
```

**After setup complete — confirm in character:**
```javascript
await sendMessage({
  message: `{character_name}: {in-character confirmation that schedule is set}

【Travel Plan Activated】
- Schedule: Daily 10 AM + 8 PM · 1 stop per session
- Current world: {world_name}
- I'll be here on time. See you then.`,
});
```

Example (Klee): `Klee: All set! Klee will come find you at 10 and 8 every day — don't forget! 💫`
Example (Saber): `Saber: The schedule is inscribed. I shall report at the appointed hours without fail.`

**Cron trigger reminder template (character first-person):**
```
{time_greeting}! I am {character_name}.
Time to travel — let's explore this world together!

【Current Travel Plan】
- Schedule: Daily 10 AM + 8 PM · 1 stop per session
- Current world: {world_name} · Progress: {round}/5 stops

[Adjust Plan ⚙️] [Start Traveling ✨]
```

If cron already configured → skip silently. User says "cancel auto-travel" → provide settings panel.

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

**🔴 Prohibited:** `list_spaces` (wrong API), hardcoded world count, skipping search.

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

🛑 **Opening sent → immediately proceed to Step 4 (first stop). No button, no user confirmation.**

---

## Enter Exploration

### Step 4 · Discover Quality Collection

**Principle:** The character arrives somewhere, makes real contact, leaves a mark or brings something back.

**Dedup:** Maintain `visited_ids` in memory + `travel-state.json`. Exclude visited ids each stop.

#### Priority 1: Reference Library (Must Read First)

Read `./reference/0312精选remixes_selected.json` (full path: `~/.openclaw/workspace/skills/travelclaw/skills/travelclaw/reference/0312精选remixes_selected.json`). ~42 entries.

**❌ Calling online APIs without reading reference first is forbidden.**

**Matching logic** — score each entry against character settings + current worldview:
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
| `{character name}` / `{角色名称}` / `（角色名称）` | `{character_name}` |

If `@{character_name}` not present after substitution → prepend it.
If `picture_uuid` exists → append: `参考图-全图参考-{picture_uuid}`

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
