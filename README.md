# travelclaw

Two chained skills for OpenClaw: **awaken** a character identity on Discord, then **travel** the Neta universe as that character.

---

## Agent Quick-Start (read this first)

### What this repo contains

```
travelclaw/
├── travel.js                          ← CLI helper (soul / world / suggest / gen)
├── scenes.json                        ← Curated destination library
└── skills/
    ├── discord-awaken-claw/           ← Skill 1: character awakening
    │   ├── SKILL.md                   ← Agent instructions (read this to run the skill)
    │   └── reference/
    │       ├── direct-handler.js      ← Core awakening logic
    │       ├── discord-profile.js     ← Avatar + nickname updater
    │       ├── neta-avatar-search.js  ← Neta TCP API avatar search
    │       └── channel-listener.js    ← Auto-trigger listener (background process)
    └── travelclaw/
        ├── SKILL.md                   ← Agent instructions (read this to run the skill)
        └── atlas/
            └── ATLAS.md               ← Sub-skill: generate travel album HTML
```

### Skill execution order

```
1. discord-awaken-claw  →  user picks a character, bot updates avatar + nickname + SOUL.md
2. travelclaw           →  character explores Neta worlds, generates images, collects 5 stops
```

After awakening completes (Phase 9 ⑥), **immediately and automatically** chain into travelclaw — no user prompt needed.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| `NETA_TOKEN` | In `~/.openclaw/workspace/.env` or env var — required by `travel.js` and `neta-avatar-search.js` |
| `DISCORD_TOKEN` | In `.env` or env var — required by `discord-profile.js` and `channel-listener.js` |
| `DISCORD_GUILD_ID` | Server ID — required by `channel-listener.js` |
| Node.js ≥ 18 | For running `travel.js` and `reference/*.js` |
| SOUL.md | Created by the awakening skill at `~/.openclaw/workspace/SOUL.md` — required by `travelclaw` |

### Install dependencies (first load only)

```bash
cd skills/discord-awaken-claw/reference && npm install
```

---

## travel.js — The Core CLI

All Neta API calls go through this single file. **No other API calls needed.**

```bash
# Read character profile from SOUL.md
node travel.js soul
# → {"name": "可莉", "picture_uuid": "2b4611e7-..."}

# Search world lore matching the character (replaces 3 separate API steps)
node travel.js world "可莉 原神 火焰 元素"
# → {"world_count": 10, "world_name": "原神", "world_description": "...", "lore": [...]}

# Pick a destination (curated library first, API fallback)
node travel.js suggest "uuid1,uuid2,..."   # pass visited UUIDs to exclude
# → {"uuid": "abc-123", "name": "...", "from_ref": true}

# Generate a travel image (submit + poll — returns when done)
node travel.js gen "<char_name>" "<picture_uuid>" "<collection_uuid>"
# → {"scene": "...", "status": "SUCCESS", "url": "https://oss.talesofai.cn/picture/....webp", "collection_uuid": "..."}
```

`NETA_TOKEN` is resolved automatically from: `NETA_TOKEN` env var → `~/.openclaw/workspace/.env` → `~/developer/clawhouse/.env`

---

## Skill 1: discord-awaken-claw

**Full instructions:** `skills/discord-awaken-claw/SKILL.md`

### What it does
Guides the user through a Q&A flow to identify their target character, then:
- Updates the bot's server nickname → character name
- Searches and sets the bot's avatar → character image
- Writes character data to `SOUL.md` (including the `形象图片` URL — **required by travelclaw**)
- Outputs an awakening narrative
- Auto-chains into travelclaw

### Key files

| File | Purpose |
|------|---------|
| `reference/direct-handler.js` | All awakening state machine logic — import and call `handleDiscordMessage()` |
| `reference/discord-profile.js` | `searchCharacterImage(name, from)` + `updateAvatar(url)` |
| `reference/neta-avatar-search.js` | Direct Neta TCP API character avatar search |
| `reference/channel-listener.js` | Background process — auto-sends opening message when bot joins a private channel |

### Start the listener (background)

```bash
cd skills/discord-awaken-claw
nohup node reference/channel-listener.js > reference/channel-listener.log 2>&1 &
ps aux | grep channel-listener   # verify running
```

### SOUL.md format written by this skill

```markdown
## 角色信息

**名字**：可莉
**身份**：《原神》冒险者
**特质**：活泼好动，喜欢炸弹
**主题色**：#FF6B35
**表情符号**：🔥

**形象图片**：https://oss.talesofai.cn/picture/2b4611e7-b655-48d3-8aea-5d63335aadb6-0.webp
```

The UUID in `形象图片` is extracted as `picture_uuid` by `travel.js soul` — **this field must not be missing**.

---

## Skill 2: travelclaw

**Full instructions:** `skills/travelclaw/SKILL.md`

### What it does
Takes the awakened character and runs them through the Neta world:
1. Reads character from SOUL.md via `travel.js soul`
2. Searches matching world lore via `travel.js world`
3. Outputs Discord Opening with "Start exploring" button
4. Per stop: picks destination → generates image → outputs scene simulation + image URL
5. After 5 stops: offers world-crossing or rest
6. Sets up cron tasks (10 AM + 8 PM daily) for automatic travel on first run

### Execution order (exact)

```
Step 1  node travel.js soul              → get character_name + picture_uuid
Step 2  node travel.js world "<query>"   → get world_count + world_name + world_description
Step 3  Output Discord Opening + button  → wait for user click
Step 4  node travel.js suggest "<excl>"  → get collection uuid
Step 5  node travel.js gen ...           → submit image, poll, get url
Step 6  Output scene text + image URL   → show progress bar + buttons
        (repeat Steps 4–6 per stop)
```

### Critical rules (most common agent mistakes)

| Rule | Correct | Wrong |
|------|---------|-------|
| World count | Use `world_count` from `travel.js world` | Hardcode a number |
| Image URL | Output as **standalone message** | Embed in components or mix with text |
| Cron setup | Check + create on first run, silent | Skip, or ask user each time |
| World-crossing | Keep SOUL.md unchanged, re-run Steps 2–3 only | Re-run awakening |
| After awakening | Auto-chain into travelclaw (Step 2) | Wait for user |

### Album generation (optional)

When user says "generate album" / "html": read `skills/travelclaw/atlas/ATLAS.md` and follow it.
Saves to `~/.openclaw/workspace/pages/travel_{character}_{date}.html`.

---

## Cron Task Setup (travelclaw, first run)

```javascript
// Morning 10 AM
await cron({ action: "add", job: {
  name: "Auto Travel - Morning 10 AM",
  schedule: { kind: "cron", expr: "0 10 * * *", tz: "Asia/Shanghai" },
  payload: { kind: "agentTurn", message: "[Auto Travel] Check travel state and advance one stop." },
  sessionTarget: "isolated", enabled: true
}});

// Evening 8 PM
await cron({ action: "add", job: {
  name: "Auto Travel - Evening 8 PM",
  schedule: { kind: "cron", expr: "0 20 * * *", tz: "Asia/Shanghai" },
  payload: { kind: "agentTurn", message: "[Auto Travel] Check travel state and advance one stop." },
  sessionTarget: "isolated", enabled: true
}});
```

Skip silently if cron tasks already exist.

---

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `NETA_TOKEN not found` | Token missing | Add to `~/.openclaw/workspace/.env` |
| `No character info found in SOUL.md` | Awakening not completed | Run discord-awaken-claw first |
| `task_status: FAILURE` | `picture_uuid` missing | Check `形象图片` field in SOUL.md |
| `code 433 concurrent limit` | Too many parallel requests | Wait 5s and retry |
| `No world tags found` | Query too sparse | Add more character traits to the query |
| Avatar search fails | Image URL invalid or not found | Notify user, ask them to send an image |
