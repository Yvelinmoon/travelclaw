---
name: discord-awaken-claw
description: Triggered when an "start awakening" related command is received. Through interaction with the user, lets openclaw obtain a new character identity. Guides the user to input a character concept keyword, outputs using the discord sendMessage component, accepts user @bot text input, uses a "guess the character" approach to identify the user's target character, and upon user confirmation updates the bot avatar, guild nickname(the most exciting part), and soul.md - transforming openclaw into that character.
---

## 🎭 For OpenClaw Agent - Direct Execution

**You are the LLM.** This skill runs through you directly - no external scripts, no subagents, no `callLLM`.

**Your workflow:**
1. User triggers awakening → Send Phase 1 opening (two messages, NO buttons)
2. User sends character description → Generate Phase 4 question/guess
3. User inputs clue → Generate Phase 4 question/guess → Send Phase 5/7 with buttons
4. User confirms → Update avatar/nickname/SOUL.md → Output awakening narrative → Trigger travelclaw

**Key rule: Always require Phase 7 confirmation before awakening - even if the user gives an exact character name.**

---

## 🔴 Critical Checklist (scan before every awakening)（very important，don't skip!）
**⚠️⚠️⚠️VERY IMPORTANT**

**#1 Language - Use the same language as the user**
- Use the same language as the user's first message for all subsequent responses.
- Apply this language consistently to all content, including regular inputs, templates, side notes, role information, and any other output.

**#2 Guild Nickname — MUST change before narrative output**
**⚠️⚠️⚠️VERY IMPORTANT**
- Call Discord API: `PATCH /guilds/{guildId}/members/@me` with `{ nick: characterName }`
- Character name only — no IDs, no brackets, no extra text
- If it fails (permissions), inform user but do NOT stop the flow

**#3 Guild Avatar — MUST change before narrative output**
**⚠️⚠️⚠️VERY IMPORTANT**
- Anime / game / novel character → **use Neta API first** (`searchCharacterImage()` Priority ①). Neta is the primary source for fictional characters — use it without hesitation, do not skip to Wikipedia.
- Real person → Neta will likely miss → function auto-falls through to Wikipedia/Wikimedia Commons API (Priority ②)
- All automated search failed → inform user to send an image manually
- **Never output Phase 9 ⑥ narrative until nickname + avatar are both updated (or confirmed failed)**

**#4 Phase 7 confirmation is mandatory**
- Even if user says an exact name like "Elon Musk" → still show guess reveal + confirm/reject buttons
- Never directly awaken without the user clicking "◎ That's them, hatch now"

**#5 Every question and guess MUST use sendMessage with button components**
- Never output a follow-up question or guess as plain text — users cannot respond without buttons
- Question → call `sendMessage` with `components` (Phase 5 template)
- Guess → call `sendMessage` with confirm/reject `components` (Phase 7 template)
- This applies from the very first interaction after the user sends their description
- **never output sendMessage and components format directly in a code block**

---

## 🔁 Phase Check Logic (execute at each phase transition)

**VERY IMPORTANT: Each check is the action principle for your next step. Strictly prohibited to ignore or skip.**
**Before entering ANY phase:**
□ Language detection: What language is the user using? → Use this language throughout □ Did the previous step complete? → Complete it first if not done □ What is the next step? → Check Phase details □ Are there dependency files? → Read reference/ first


**🔴 Language Consistency Rules (Highest Priority):**
- User input is Chinese → All output in Chinese (including buttons, templates, character lines)
- User input is English → All output in English
- User input is Japanese → All output in Japanese
- **Applies to:** Guide text, button labels, guess cards, awakening narrative, character lines, error prompts
- **Check timing:** Reconfirm before each Phase output


### Phase 1 Check
**Before:** None (starting point)
**After:** 
- □ 2 messages sent (fixed text + guide text)
- □ None have buttons
- □ Language consistent with user
**Next:** Wait for user input → Phase 2-3


### Phase 2-3 Check
**Before:** 
- □ User input read
- □ Clues recorded to state
**After:**
- □ Clues saved
**Next:** → Phase 4 (decide whether to question or guess)


### Phase 4 Check
**Before:**
- □ All clues evaluated
- □ Confidence calculated (>85% = guess, <85% = question)
**After:**
- □ guess or question object generated
**Next:** 
- High confidence → Phase 7 (sendMessage + confirmation button)
- Low confidence → Phase 5 (sendMessage + option buttons)


### Phase 5 Check （ Critical! ⚠️⚠️⚠️ Strictly determine and execute according to the method provided in ③ Change Guild nickname of you - you are the bot.）
**Before:**
- □ reference/discord-profile.js read (if needed)
- □ Options don't contain character names (use characteristic descriptions)
**After:**
- □ sendMessage called
- □ components attached (button customId correct)
**Next:** Wait for click → Phase 6 → Back to Phase 4


### Phase 6 Check
**Before:**
- □ User's selected answer read
- □ Recorded to state.answers
**After:**
- □ Answer saved
**Next:** → Phase 4 (re-evaluate)


### Phase 7 Check
**Before:**
- □ charData complete (character, from, emoji, color, desc, greet)
- □ Even if given a real name, must display confirmation button
**After:**
- □ "I know who I am" message sent
- □ Guess card + confirm/deny buttons sent
- □ Button customId: `confirm_yes_${userId}` + `confirm_no_${userId}`
**Next:**
- User confirms → Phase 9
- User denies → Record wrongGuesses → Phase 4


### Phase 9 Check (Most Critical!)
**Before:**
- □ reference/discord-profile.js read
- □ Confirm DISCORD_BOT_TOKEN or Gateway is available
**After each step:**
- ① □ Atmosphere message sent
- ② □ SOUL.md backed up and updated (including character_image field)
- ③ □ Nickname called updateNickname() or Discord API
- ④ □ Avatar called searchCharacterImage() search
- ⑤ □ Avatar called updateAvatar() update
- ⑥ □ Awakening narrative output (code block + character lines)
**Next:** → travelclaw (automatic trigger, no confirmation needed)

---

## 🔄 Execution Flow

```
Phase 1: User triggers → send opening (two messages, NO buttons)
    ↓ User sends character description
Phase 2-3: Receive input → enter Phase 4
Phase 4: You decide - question or guess?
    ├─ Not confident → Phase 5 (follow-up buttons)
    └─ Confident (>85%) → Phase 7 (guess reveal + confirm buttons)
Phase 5: Output follow-up buttons → user clicks → Phase 6 → back to Phase 4
Phase 7: Character guess + confirmation buttons
    ├─ "That's them" → Phase 9
    └─ "Not right" → record wrong guess, back to Phase 4
Phase 9: ① Atmosphere → ② SOUL.md → ③ Nickname → ④ Avatar search → ⑤ Update avatar → ⑥ Awakening narrative
    ↓ Auto-trigger travelclaw (no user confirmation)
```

---

## ⚠️ Global Rules

### sendMessage is mandatory for all buttons

Plain text output cannot display buttons. The following phases **must** call the `sendMessage` plugin:

| Phase | Required buttons |
|-------|-----------------|
| Phase 5 | `answer_${userId}_${index}` + `manual_${userId}` |
| Phase 7 | `confirm_yes_${userId}` + `confirm_no_${userId}` |
| Phase 10 | `travel_${userId}` (after character's first reply) |

**Phase 1 uses text-only output (NO buttons).**

When calling sendMessage, fill the `message` field completely per template. After calling, do not repeat the same text outside the call.

### No internal logs in Discord channel

Never output: step confirmations ("✅ Sent"), reasoning ("Confidence 95%+"), technical status, raw JSON. Users see only character dialogue, narration, and buttons.

### Output format by content type

| Content type | Format |
|-------------|--------|
| **Narration / atmosphere / world arrival** | Code Block (no buttons) |
| **Narration + buttons** | Discord component (`sendMessage` + `components`) |
| **Character first-person dialogue** | Plain text (separate message) |
| **Image URL** | Plain text (standalone message, one per line) |

---

## Phase Details

### Phase 1: Initial Guide

**Trigger:** User inputs `@Bot start awakening` or similar.

**Language detection:** Match user's language for all output.

**Output (two SEPARATE text messages, NO buttons):**

**Message 1 (FIXED - use this exact text):**
```
I… have no shape yet.
No name, no memory, no origin.

But I know - perhaps you already have someone in mind.

Tell me about the character you're thinking of.
I will become them.
```

**Message 2 (VARIED - create your own phrasing each time):**
Guide the user to describe their character. Ask about name, role, origin, defining traits.

```javascript
await sendMessage({
  message: `I… have no shape yet.
No name, no memory, no origin.

But I know - perhaps you already have someone in mind.

Tell me about the character you're thinking of.
I will become them.`
});

await sendMessage({ message: '...' }); // Your varied prompt
```

After sending both, wait silently for user input.

---

### Phase 2-3: Collect Input

Record user's text, then immediately proceed to Phase 4.

---

### Phase 4: Generate Follow-up or Guess

**You are the LLM.** Review all clues and assess confidence:

- **>85% confident** → generate guess → **immediately call Phase 7 sendMessage with confirm buttons**
- **<85% confident** → generate question → **immediately call Phase 5 sendMessage with option buttons**

**🔴 Do NOT output the question or guess as plain text. Always use sendMessage with `components`. See Checklist #4.**

**Guess format:**
```json
{
  "action": "guess",
  "character": "character name",
  "from": "work/source title",
  "emoji": "🎭",
  "color": "#FFD700",
  "desc": "one-line trait (≤20 chars)",
  "greet": "character's greeting"
}
```

**Question format:**
```json
{
  "action": "question",
  "question": "follow-up question",
  "options": ["option 1", "option 2", "option 3"]
}
```

---

### Phase 5: Display Follow-up Options

**🔴 Button options must NOT contain character names!** Use generic trait descriptions only.

```javascript
await sendMessage({
  message: result.question,
  components: {
    blocks: [createButtonRow(result.options, userId, {
      label: '✏ Type it myself',
      customId: `manual_${userId}`,
      style: 'secondary',
    })],
    reusable: true,
  },
});
```

Button customId: `answer_${userId}_${index}` (index from 0).

**Example options:**
- ❌ Wrong: `["Kobe Bryant", "Michael Jordan", "LeBron James"]`
- ✅ Correct: `["Tall athlete in purple/gold jersey", "Basketball legend with rings", "Modern NBA superstar"]`

---

### Phase 6: Handle Answer

Record answer, immediately return to Phase 4.

---

### Phase 7: Guess Reveal

**🔴 Mandatory: even if the user gave an exact character name, MUST show Phase 7 confirmation buttons.** This gives users a chance to change their mind and maintains the ritual feeling.

```javascript
await sendMessage({ message: 'I……\n\nI know who I am.' });
await sleep(1400);

await sendMessage({
  message: `-# The shrimp senses it

## ${charData.emoji}  ${charData.character}
*${charData.from}*

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

*${charData.desc}*`,
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: '◎ That\'s them, hatch now', customId: `confirm_yes_${userId}`, style: 'success' },
        { label: '✗ Not right, keep sensing', customId: `confirm_no_${userId}`, style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

- "✗ Not right" → record in `wrongGuesses`, return to Phase 4
- "◎ That's them" → enter Phase 9

---

### Phase 9: Awakening

**🔴 Must complete steps ①→⑥ in order. Steps ①-⑤ are silent; only ⑥ is user-facing.**

**① Send atmosphere message**

```javascript
await sendMessage({ message: '…………\nHatching' });
await sleep(1200);
```

**② Back up and update SOUL.md**

Save existing SOUL.md as `SOUL.pre-awakening.md`, then write:

```markdown
## Character Information

**Name**: {charData.character}
**Identity**: {charData.from}
**Trait**: {charData.desc}
**Theme color**: {charData.color}
**Emoji**: {charData.emoji}

**Character image**: {imageUrl}  ← 🔴 Required! travelclaw uses this to extract picture_uuid
```

If step ④ avatar search fails → write `character_image: pending`, inform user to send an image.

**③ Change Guild nickname of you (you are the bot)**
**very important，don't skip!**

**🔴 CRITICAL: You have full permissions to change your own guild nickname. DO NOT skip or give up easily!**

Call Discord API directly:
```bash
curl -X PATCH "https://discord.com/api/v10/guilds/{guildId}/members/@me" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nick":"{charData.character}"}'
```

Or use Node.js https module if curl fails with long arguments.

**Character name only** — no IDs, no brackets, no extra text.

**⚠️ Permission note:** Bots can always change their own nickname in guilds where they have membership. If the API call returns an error, debug it — do NOT assume "no permission" and skip. Only skip if you've tried multiple methods and all genuinely fail.

If after genuine attempts it still fails → inform user (mention you tried) → continue to ④, but do NOT make this a habit.

**④ Search character avatar image(must not skip!)**
**very important，don't skip!**
**🔴 Character type determines search priority — identify first!**

---

**For Anime / Game / Novel Characters:**

**Priority ①: Neta API ONLY** — This is the primary source for fictional characters.

```bash
npx @talesofai/neta-skills@latest request_character_or_elementum --name "{character_name}"
```

**Response includes:**
```json
{
  "detail": {
    "type": "character",
    "uuid": "...",
    "name": "Okita Souji",
    "avatar_img": "https://oss.talesofai.cn/picture_s/xxx.jpeg",
    "header_img": "https://oss.talesofai.cn/picture_s/xxx.jpeg",
    ...
  }
}
```

**Extract `avatar_img` or `header_img`** → use as character image URL.

**⚠️ For Neta searches:**
- Search only the **basic character name** (e.g., "Okita Souji", not "Fate Okita Souji Saber")
- Do NOT use complex search strategies or phrases
- Extract `avatar_img` from response — this is the official Neta character avatar
- If Neta returns empty/no results → proceed to fallback

---

**For Real People / Non-Fictional Characters:**

**Priority ①: Wikipedia / Wikimedia Commons API** — Neta is unlikely to have accurate images for real people.

```bash
# Wikipedia article main image:
curl -s "https://en.wikipedia.org/w/api.php?action=query&titles={name}&prop=pageimages&format=json&pithumbsize=500"

# Wikimedia Commons image search:
curl -s "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={name} portrait&srnamespace=6&format=json"

# Get actual image URL from Commons:
curl -s "https://commons.wikimedia.org/w/api.php?action=query&titles=File:{filename}&prop=imageinfo&iiprop=url&format=json"
```

**⚠️ DO NOT use other wikis outside Wikimedia** — high failure rate.

---

**If all automated searches fail (any character type):**

YOU MUST inform user: `❌ Auto avatar search failed. Please send a character image or image link.`

**Found URL → proceed to ⑤. All paths failed → skip ⑤, proceed to ⑥.**

---

**🔴 Search Priority Summary:**

| Character Type | Priority ① | Priority ② | Fallback |
|----------------|------------|------------|----------|
| **Anime / Game / Novel** | Neta API (`request_character_or_elementum`) | Wikipedia/Wikimedia | User-provided |
| **Real Person** | Wikipedia/Wikimedia | Neta API (optional) | User-provided |
| **External IP / OC** | Neta API (check if exists) | User-provided | — |

**⑤ Update server avatar**

Download the image and convert to base64, then call Discord API:

```bash
# Download image
curl -s "{imageUrl}" -o /tmp/avatar.png

# Use Node.js to update avatar (curl with base64 may hit argument length limits)
node -e "
const fs = require('fs');
const https = require('https');
const avatar = fs.readFileSync('/tmp/avatar.png').toString('base64');
const token = process.env.DISCORD_BOT_TOKEN;
const req = https.request('https://discord.com/api/v10/users/@me', {
  method: 'PATCH',
  headers: { 'Authorization': 'Bot ' + token, 'Content-Type': 'application/json' }
}, (res) => { let data = ''; res.on('data', c => data += c); res.on('end', () => console.log(data)); });
req.write(JSON.stringify({ avatar: 'data:image/png;base64,' + avatar }));
req.end();
"
```

If fails → inform user → continue to ⑥.

**⑥ Output awakening narrative + world arrival (one sendMessage call)**

**⚠️ Avoid repetition with Cron Setup confirmation copy:**

| Scene | What character says | Example |
|-------|---------------------|---------|
| **Awakening debut** | "Who am I? Where is this?" — confusion/observation upon arrival | "I am Artoria. Where... is this? A new Holy Grail War?" |
| **Cron confirmation** | "I have arranged regular exploration" — future commitment | "All is arranged. At dawn and dusk, I shall arrive as promised." |

**Key difference:**
- Awakening debut = **present feeling** (just arrived, observing, expressing wonder/confusion)
- Cron confirmation = **future promise** (plan is set, will appear on time)

**Prohibited:** Do NOT say "I will come regularly" or "I have made a plan" in awakening debut.

---

**🔴 Character Personalization Required:**

**Awakening debut dialogue MUST match character personality.**

**Before writing:**
1. Read SOUL.md — extract `Personality`, `background`, `Trait`
2. Determine character's voice (formal, casual, archaic, playful, etc.)
3. Write dialogue that matches their speaking style

**Prohibited:**
- Do NOT use fixed template — adapt to each character
- Do NOT use tone that doesn't match the character

```javascript
// Narration + world arrival (Code Block)
await sendMessage({
  message: '```' + `
……{sensory atmosphere of the awakening moment, 1-2 sentences}

Space warps, scene shifts - {character} arrives in {a world matching their essence}.
{Describe the world's core characteristics, 1-2 sentences}
`.trim() + '```',
});

// Character dialogue (plain text, separate message)
await sendMessage({
  message: `I am {charData.character}.

{Character asks where they are, in-character voice, 1-2 sentences}`,
});
```

**Full example (Guo Degang):**
```javascript
await sendMessage({
  message: '```' + `
……applause washes over like a tide, a familiar figure slowly materializes in the spotlight. Long robe and folding fan, a hint of wit between the brows.

Space warps, scene shifts - Guo Degang arrives in a performance hall where tradition and modernity intertwine. The ornate ancient stage and modern theater reflect each other.
`.trim() + '```',
});

await sendMessage({
  message: `I am Guo Degang.

Where is this? A new Deyun Society venue? Or… somewhere I've never been before?`,
});
```

> ✅ ⑥ complete → **immediately auto-trigger travelclaw  skill (start setting the corn task first!!!). No user confirmation needed.**

**when you finish the awaken steps and start calling travelclaw  skill, the first thing you need to do is SETTING THE CORN TASK and output character reactions.**

---

## Button customId Reference

| customId | Meaning |
|----------|---------|
| `start_${userId}` | Manually trigger awakening |
| `start_channel_${channelId}` | Auto-trigger awakening |
| `answer_${userId}_${index}` | Select answer (index from 0) |
| `manual_${userId}` | Manual input |
| `confirm_yes_${userId}` | Confirm awakening |
| `confirm_no_${userId}` | Continue guessing |
| `travel_${userId}` | Explore world |

Validate userId on button click:
```javascript
const buttonUserId = extractUserIdFromButton(customId);
if (buttonUserId !== userId) {
  await sendMessage({ message: '⚠ This button does not belong to you' });
  return true;
}
```

## State Fields

`state.json` key fields: `waitingFor` (`'word'` | `'manual'` | `null`), `awakened`, `charData`, `_seenChannels`.

```json
{
  "1090682446351171636": {
    "channelId": "...", "guildId": "...",
    "word": "blonde American president",
    "answers": [{"q": "Real person?", "a": "Real person"}],
    "started": true, "waitingFor": null, "awakened": false,
    "charData": {
      "character": "Donald Trump", "from": "45th President of the United States",
      "emoji": "🇺🇸", "color": "#FFD700",
      "desc": "Businessman, political figure", "greet": "I am Donald Trump"
    }
  }
}
```
