---
name: travelclaw
description: Triggered directly after the awakening flow in which the lobster baby obtains an identity (or via scheduled task / user prompt). Lets the awakened shrimp character explore different worlds in the Neta universe using travel.js — first searching for a world that matches the character to obtain world information, then using travel.js to generate personalized travel images for the character, simulating the character traveling through the world and experiencing various events.
---

**🦞 Let the character awakened on openclaw find an interesting world in the Neta universe and leave their own mark there ～**
**Core tool:** [travel.js](https://github.com/talesofai/travelclaw/blob/compact/travel.js) — Zero-dependency Neta API helper

---

## 🔴 WORKING PRINCIPLES (UPDATED — travel.js native)

### Core Philosophy

**User experience remains unchanged** — All narration, progress bars, buttons, and immersion design stay exactly the same.

**Backend switches to travel.js** — Replace multi-step neta-cli calls with `travel.js` commands:
- `node travel.js soul` → Read character from SOUL.md
- `node travel.js suggest [exclude]` → Pick destination (local scenes.json priority + API fallback)
- `node travel.js gen <name> <uuid> <uuid>` → Generate travel image (scene + character + poll)

### Why travel.js?

| Problem | Old Approach | travel.js Solution |
|---------|-------------|-------------------|
| **Collection mismatch** | Manual ID → uuid mapping | Direct uuid from `suggest` |
| **Multi-step complexity** | 5+ neta-cli calls | Single `gen` command |
| **Prompt building** | Manual vtokens | Auto TCP lookup + vtokens |
| **Polling** | Manual poll loop | Built-in polling + slow warning |
| **SOUL.md parsing** | Manual regex | Standardized field extraction |

---

## Execution Flow (travel.js native)

### Step 0 · Cron Setup (unchanged)

**Same as before** — Check `travel-state.json`, setup cron if needed, output in-character announcement.

---

### Step 1 · Read Character (use travel.js)

**🔴 MANDATORY: Use `travel.js soul` command**

```bash
cd /home/node/.openclaw/workspace
node travel.js soul
```

**Returns:**
```json
{"name": "Jeff Bezos", "picture_uuid": "76c24f2b-3399-4730-9c06-e7ee8b24c164"}
```

**Extract:**
- `name` → `character_name`
- `picture_uuid` → for image generation (may be null)

**SOUL.md format requirement:**
```markdown
**角色名**: Jeff Bezos
**角色图片**: https://oss.talesofai.cn/picture/76c24f2b-3399-4730-9c06-e7ee8b24c164.webp
```

---

### Step 2 · World Lore Search (unchanged)

**Same as before** — Use neta-cli `suggest_keywords` → `suggest_tags` → `get_hashtag_info` flow.

**Output:** Opening screen with world info (no changes to user experience).

---

### Step 3 · Opening Output (unchanged)

**Same as before** — Discord-formatted Opening with world description.

**Auto-triggers Step 4** — No user confirmation needed.

---

### Step 4 · Select Destination (use travel.js)

**🔴 MANDATORY: Use `travel.js suggest` command**

```bash
cd /home/node/.openclaw/workspace
node travel.js suggest "<visited_uuids_csv>"
```

**Example:**
```bash
node travel.js suggest "f2153893-f0f3-4c38-96bc-bb6e1b477cde,9811534"
```

**Returns:**
```json
{"uuid": "collection-uuid", "name": "Destination Name", "from_ref": true}
```

**Fields:**
- `uuid` → collection_uuid for image generation
- `name` → destination name for scene description
- `from_ref` → true if from local scenes.json, false if from API

**Priority:**
1. **Local scenes.json** with tag-based scoring against SOUL.md
2. **API fallback** via `/v1/recsys/content`

**✅ Output confirmation (same format as before):**
```
✅ Reference library loaded
 - Path: /home/node/.openclaw/workspace/skills/travelclaw/reference/0312 精选 remixes_selected.json
 - Total: {X} collections
 - Excluded (visited): {Y}
 - Candidates: {Z}
 - Selected: {name} (best match)
```

---

### Step 5-9 · Generate Image (use travel.js)

**🔴 MANDATORY: Use `travel.js gen` command — replaces Steps 5-9**

```bash
node travel.js gen "<character_name>" "<picture_uuid>" "<collection_uuid>"
```

**Example:**
```bash
node travel.js gen "Jeff Bezos" "76c24f2b-3399-4730-9c06-e7ee8b24c164" "f2153893-f0f3-4c38-96bc-bb6e1b477cde"
```

**What travel.js does internally:**

1. **Fetch scene info** — `/v1/home/feed/interactive?collection_uuid={uuid}`
2. **Extract prompt template** — `cta_info.launch_prompt.core_input`
3. **Replace placeholders** — `{@character}` → character name
4. **TCP character lookup** — `/v2/travel/parent-search` for vtoken
5. **Build vtokens** — oc_vtoken_adaptor + freetext
6. **Submit generation** — `/v3/make_image` with inherit_params
7. **Poll result** — Every 500ms, warn after 30s

**Returns:**
```json
{
  "scene": "Destination Name",
  "task_uuid": "...",
  "status": "SUCCESS",
  "url": "https://oss.talesofai.cn/picture/xxx.webp",
  "collection_uuid": "..."
}
```

**✅ Output sequence (MUST preserve loading messages + correct image display):**

**Step A — Before calling `travel.js suggest`:**
```
🌀 Portal opening...
📍 Destination locked: {destination_name}...
```

**Step B — After `travel.js gen` starts (optional, for long waits):**
```
🚶 Character traveling, creating travel photo...
```

**Step C — If slow (>30s):**
```
⏳ Rendering is taking a bit longer, almost there...
```

**Step D — After generation complete, output scene (see Step 10 format)**

**🔴 CRITICAL: Image URL must be sent as a SEPARATE message**

Discord only auto-embeds images when the URL is alone in a message:

```javascript
// ✅ CORRECT: Image URL in its own message
await sendMessage({ message: 'https://oss.talesofai.cn/picture/xxx.webp' });

// ❌ WRONG: URL mixed with other text
await sendMessage({ message: 'Check this out: https://...' });
```

**Why?** Discord's embed parser only triggers when the message contains ONLY a URL (with optional whitespace).

---

### Step 10 · Display Stop (unchanged)

**Same user experience** — Scene description + character dialogue + progress bar + buttons.

**Format:**
```
🎭【{scene_name}】

```{scene_description}```

{character_name}: {dialogue}
{action_description}

━━━━━━━━━━━━━━━━━━━━━━━━
Stop {round} · {scene_name}

{image_url}

▓░░░░ 1 / 5 stops
🌟 Stop 1 checked in! Continue?

[Continue adventure 🗺️] [Rest for now 👋]
```

---

## State Management (unchanged)

**After each stop, update `travel-state.json`:**

```json
{
  "channels": {
    "1484024259096477758": {
      "cronConfigured": true,
      "currentWorld": "千夜幻想的无尽星海",
      "progress": 1,
      "totalStops": 5,
      "visitedIds": ["f2153893-f0f3-4c38-96bc-bb6e1b477cde"],
      "characterName": "Jeff Bezos",
      "recentTags": ["梦幻", "蒲公英", "森鸟"]
    }
  }
}
```

---

## Error Handling

| Error | travel.js Behavior | Your Action |
|-------|-------------------|-------------|
| `SOUL.md not found` | Exit with error | Ensure SOUL.md exists with 角色名 field |
| `No destinations found` | Exit with error | Check NETA_TOKEN, retry |
| `Scene not found` | Exit with error | Try different collection_uuid |
| `task_status: FAILURE` | Return status + error_msg | Inform user, select new destination |
| `code 433` | Auto-wait 5s + retry | No user notification needed |

---

## Quick Reference

### Commands

```bash
# Read character
node travel.js soul

# Pick destination (exclude visited)
node travel.js suggest "uuid1,uuid2"

# Generate image
node travel.js gen "Character Name" "pic-uuid" "collection-uuid"
```

### File Locations

| File | Path |
|------|------|
| travel.js | `/home/node/.openclaw/workspace/travel.js` |
| SOUL.md | `/home/node/.openclaw/workspace/SOUL.md` |
| travel-state.json | `/home/node/.openclaw/workspace/memory/travel-state.json` |
| scenes.json (optional) | `/home/node/.openclaw/workspace/skills/neta-travel/scenes.json` |

### SOUL.md Format

```markdown
**角色名**: Character Name
**角色图片**: https://oss.talesofai.cn/picture/uuid.webp
```

**Note:** Field name must be exactly `角色名` (not `Name` or `角色`) for travel.js to parse correctly.

---

## 🔴 Character Avatar Acquisition (Critical for Real People)

**For real people (Jeff Bezos, Elon Musk, etc.):** Use Wikimedia Commons API — most reliable source.

### ✅ Recommended: Wikimedia Commons API

**API Endpoint:**
```
https://commons.wikimedia.org/w/api.php?action=query&titles=File:FILENAME&prop=imageinfo&iiprop=url&format=json
```

**Example (Jeff Bezos):**
```bash
# 1. Query image info
curl -s "https://commons.wikimedia.org/w/api.php?action=query&titles=File:Jeff_Bezos_2017.jpg&prop=imageinfo&iiprop=url&format=json"

# 2. Extract image URL from response
# Look for: response.query.pages[-1].imageinfo[0].url
```

**Response structure:**
```json
{
  "query": {
    "pages": {
      "123456": {
        "title": "File:Jeff_Bezos_2017.jpg",
        "imageinfo": [
          {
            "url": "https://upload.wikimedia.org/wikipedia/commons/9/99/Jeff_Bezos_2017.jpg",
            "width": 733,
            "height": 945
          }
        ]
      }
    }
  }
}
```

**Download & Use:**
```bash
# Download original image (not thumbnail!)
curl -L "https://upload.wikimedia.org/wikipedia/commons/9/99/Jeff_Bezos_2017.jpg" -o avatar.jpg

# Verify it's a valid image
file avatar.jpg
# Output: JPEG image data, JFIF standard 1.01, 733x945

# Update Discord avatar (use Node.js to avoid curl argument length limits)
node update_avatar.js
```

### ❌ Avoid These Methods

| Method | Problem | Why |
|--------|---------|-----|
| Neta API character search | Inaccurate for real people | Designed for anime/game characters |
| `/thumb/` URLs | 429 errors, rate limited | Wikimedia blocks thumbnail hotlinking |
| Web search APIs | Unreliable, needs API key | Quality varies, may violate copyright |
| Direct Google Image search | Copyright issues | Not all images are freely licensed |

### Key Rules

1. **Always use `originalimage` URL** — Never use `/thumb/` thumbnail URLs
2. **Verify image format** — Use `file` command to confirm it's JPEG/PNG, not HTML
3. **Use Node.js for Discord API** — Avoids curl argument length limits for base64
4. **Save to SOUL.md** — Store the final URL in `角色图片` field

### Quick Reference

**Wikipedia Summary API (alternative):**
```bash
curl -s "https://en.wikipedia.org/api/rest_v1/page/summary/Jeff_Bezos" | grep -o '"originalimage".*"source":"[^"]*"'
```

**Wikimedia Commons Search:**
```bash
curl -s "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=Jeff%20Bezos&format=json"
```

---

## Migration Notes

### Old → New Mapping

| Old Flow | New Command |
|----------|-------------|
| Read SOUL.md manually | `node travel.js soul` |
| Read reference JSON + score | `node travel.js suggest` |
| read_collection → extract prompt | (inside `gen`) |
| Build vtokens manually | (inside `gen`) |
| make_image + poll loop | `node travel.js gen` |

### What Stays the Same

- ✅ Cron setup flow
- ✅ World lore search (Steps 2-3)
- ✅ Opening output format
- ✅ Scene description format
- ✅ Progress bars + buttons
- ✅ State file management
- ✅ Immersion protection rules

---

**GitHub:** https://github.com/talesofai/travelclaw
**travel.js Source:** https://github.com/talesofai/travelclaw/blob/compact/travel.js
**Author:** Yves
**Updated:** 2026-03-19 (travel.js native edition)
