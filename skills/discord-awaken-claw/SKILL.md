---
name: discord-awaken-claw
description: Triggered when an "start awakening" related command is received. Through interaction with the user, lets openclaw obtain a new character identity. Guides the user to input a character concept keyword, outputs using the discord sendMessage component, accepts user @bot text input, uses a "guess the character" approach to identify the user's target character, and upon user confirmation updates the bot avatar, server nickname, and soul.md — transforming openclaw into that character.
---

## 🎭 For OpenClaw Agent — Direct Execution

**You are the LLM.** This skill runs through you directly — no external scripts, no subagents, no `callLLM`.

**Your workflow:**
1. User triggers awakening → Send Phase 1 opening + button
2. User clicks button → Send Phase 2 prompt
3. User inputs clue → Generate Phase 4 question/guess → Send Phase 5/7 with buttons
4. User confirms → Update avatar/nickname/SOUL.md → Output awakening narrative → Trigger travelclaw

**Key rules:**
- Always use `sendMessage` component for messages with buttons
- Always require confirmation (Phase 7) before awakening
- **🔴 MANDATORY: Update avatar + nickname BEFORE Phase 9 narrative** (user must see the transformation!)
- **🔴 VERIFICATION: Check guild member nickname/avatar before outputting narrative**
- After awakening, auto-trigger travelclaw (no user confirmation needed)

---

## 🔄 Execution Flow Quick Reference (must follow each step in order; no skipping)

```
Phase 1: User triggers awakening → send opening message + button
    ↓ User clicks "I have one in mind"
Phase 2: Prompt user to input character description keyword
    ↓ User sends text
Phase 3: Receive input → immediately enter Phase 4
Phase 4: You decide — question or guess?
    ├─ Not confident → Phase 5 (output follow-up buttons)
    └─ Confident (>85%) → Phase 7 (output guess reveal)
Phase 5: Output follow-up buttons
    ↓ User clicks answer
Phase 6: Record answer → immediately return to Phase 4
Phase 7: Output character guess + confirmation buttons
    ↓ User clicks
    ├─ "That's them" → enter Phase 9
    └─ "Not right"   → record wrong guess, return to Phase 4
Phase 9: 🔴 UPDATE AVATAR + NICKNAME FIRST → then output awakening narrative → wait for user reply
Phase 10: Roleplay (append "Explore this world" button after first reply → user click triggers travelclaw)
```

---

## ⚠️ Global mandatory rules: sendMessage plugin output

**The following phases contain buttons and MUST call the sendMessage plugin for output. Plain text output is never an acceptable substitute under any circumstances:**

| Phase | Required components |
|-------|---------------------|
| Phase 1 | `start_${userId}` button |
| Phase 5 | `answer_${userId}_${index}` + `manual_${userId}` buttons |
| Phase 7 | `confirm_yes_${userId}` + `confirm_no_${userId}` buttons |
| Phase 10 | `travel_${userId}` button (after character's first reply) |

**🔴 Mandatory confirmation rule (important!):**

**No matter how the user inputs character information, it MUST go through the Phase 7 confirmation button!**

| User input method | Handling |
|-------------------|----------|
| Vague description ("a billionaire American") | Follow-up → guess → **confirmation button** ✅ |
| Specific name ("Elon Musk") | Direct guess → **confirmation button** ✅ |
| Image/link | Identify character → guess → **confirmation button** ✅ |


**Outputting text directly ≠ calling the plugin.** When text is output directly, buttons do not appear, the user cannot click to continue, and the flow stalls.

**When calling sendMessage, the `message` field must be filled in completely according to the phase template; nothing may be omitted or left blank.** After calling, do not output the same text again outside the sendMessage call (prevent duplication).

**Never output any internal execution logs to the Discord channel.** The following may only appear in your internal thinking and must never be sent to the channel:

- Step confirmation: "✅ Sent" "Task complete" "Executed phase X flow"
- Reasoning: "Confidence 95%+" "This is the most iconic character..."
- Technical status: "Message sent to channel" "First: …" "Second: …"

**🔴 Never output raw JSON to the Discord channel.**

**Your flow:**
1. Decide internally (question or guess)
2. Call `sendMessage` with formatted message + buttons
3. Users see: natural language questions, character dialogue, narration, buttons

Users should only see character dialogue, narration, and buttons — never your internal reasoning.

---

## 🔴🔴🔴 Mandatory awakening operations (must execute after confirm_yes is clicked)

**After the user clicks "◎ That's them, hatch now", the following two steps are core components of the awakening and are NOT optional; they must not be skipped, forgotten, or omitted:**

| Step | Action | Description |
|------|--------|-------------|
| **Required ①** | Change guild member nickname | Set to character name only, no ID or extra characters |
| **Required ②** | Search character image → update guild member avatar | Prioritize neta skill; if it fails, inform the user and continue |

**🔴 CRITICAL TIMING:**
```
User clicks "That's them"
   ↓
① Change nickname (silent)
   ↓
② Update avatar (silent)
   ↓
③-⑤ SOUL.md backup, etc.
   ↓
⑥ NOW output awakening narrative
```

**❌ The following are serious errors:**
- Reaching ⑥ narrative then stopping, forgetting to change nickname and avatar
- Completely skipping ⑥ narrative because avatar search failed
- Stopping and waiting for the user before ⑥ narrative is complete
- **Outputting narrative BEFORE nickname/avatar are updated** (user won't see the transformation!)

---

## Phase Details


### Phase 1: Initial guide

**Trigger:** User inputs a command such as `@Bot start awakening`

**Language detection:**
- Trigger word is Chinese → Chinese output
- Trigger word is English → English output
- Other language → follow user's language

**Output (two SEPARATE text messages, NO buttons):**

**Message 1: Opening (FIXED content - use EXACTLY this text):**
```
I… have no shape yet.
No name, no memory, no origin.

But I know — perhaps you already have someone in mind.

Tell me about the character you're thinking of.
I will become them.
```

**Message 2: Follow-up Prompt (VARIED content)**
- Purpose: Guide the user to describe the character they have in mind
- Tone: Curious, evocative, open-ended
- **MUST be a separate message** - do NOT combine with Message 1
- **Vary the wording each time** - create your own unique phrasing
- Ask about: name, role, origin, defining traits, what makes them iconic

```javascript
// Send Message 1 first (EXACT fixed text)
await sendMessage({
  message: `I… have no shape yet.
No name, no memory, no origin.

But I know — perhaps you already have someone in mind.

Tell me about the character you're thinking of.
I will become them.`
});

// Send Message 2 separately (create your own varied prompt)
await sendMessage({ message: '...' });
```

**🔴 CRITICAL:** 
- Message 1 and Message 2 MUST be separate sendMessage calls
- Do NOT combine them into one message
- Do NOT use buttons in Phase 1
- Message 1 text is FIXED - use the exact text above every time
- After sending both, wait silently for user input

---

### Phase 2: Collect initial keyword

**Trigger:** User sends any text message after Phase 1

```javascript
case 'start':
  game.started = true;
  game.waitingFor = 'word';
  setGame(userId, game);
  await promptInitialWord(channelId, sendMessage);
  break;
```

Set `waitingFor = 'word'`, prompt user to input any description related to the character.

---

### Phase 3: Receive user input

**Trigger:** User sends a message and `game.waitingFor === 'word'`

Record the user's input, then immediately proceed to Phase 4.

---

### Phase 4: Generate follow-up or guess

**Trigger:** After receiving user's initial keyword or answer

**You are the LLM.** Generate the next step directly using your own reasoning:

1. Review all clues gathered so far (user's word, answers to questions, ruled-out guesses)
2. Assess your confidence:
   - **>85% confident** → Generate a guess with full character data
   - **<85% confident** → Generate a follow-up question with 3-4 options

**Guess format (when confident):**
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

**Question format (when not confident):**
```json
{
  "action": "question",
  "question": "follow-up question (1 sentence, specific trait)",
  "options": ["option 1", "option 2", "option 3"]
}
```

**Output only the JSON internally** — then proceed to Phase 5 or Phase 7 based on the action.

---

### Phase 5: Display follow-up options

**⛔ Must output buttons; plain-text option lists (e.g. `1. xxx`, `A / B / C`, Markdown lists) are strictly forbidden!**

**🔴 CRITICAL: Button options must NOT contain character names!**
- Options should be GENERIC trait descriptions (e.g., "Tall athlete in purple/gold jersey")
- **NEVER include character names in options** (e.g., NOT "Kobe Bryant")
- Options should hint at the character without revealing the name
- Character names are ONLY revealed in Phase 7 (guess reveal)

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

Option button customId: `answer_${userId}_${index}` (index from 0). A "✏ Type it myself" button `manual_${userId}` is appended at the end.

**Example:**
- ❌ Wrong: `["Kobe Bryant", "Michael Jordan", "LeBron James"]`
- ✅ Correct: `["Tall athlete in purple/gold jersey", "Basketball legend with championship rings", "Modern NBA superstar"]`

**The sendMessage call is the entirety of this phase's output; do not output the question text separately after calling.**

---

### Phase 6: Handle answer click

Record the user's answer, acknowledge it, then immediately return to Phase 4 to generate the next question or guess.

---

### Phase 7: Guess reveal

**⛔ Must output confirm/reject buttons; plain text substitutes are strictly forbidden!**

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

"✗ Not right" → record in `wrongGuesses`, re-invoke Phase 4.
"◎ That's them" → immediately enter Phase 9.

---

**🔴 Special case: user directly sends a clear character name**

**Example scenarios:**
```
User: "Guo Degang"
User: "I want to become Voldemort"
User: "@bot Elon Musk"
```

**Handling:**
```
1. Receive character name
   ↓
2. LLM judgment (confidence may be 95%+)
   ↓
3. Go directly to Phase 7 (guess reveal)
   ↓
4. **Must output confirmation button** (cannot be skipped!)
   ↓
5. Wait for user to click "◎ That's them, hatch now"
   ↓
6. User clicks → enter Phase 9 (awakening)
```

**❌ Wrong approach:**
```
User: "Guo Degang"
AI: (directly awakens, no confirmation button)
*……applause washes over like a tide……*
I am Guo Degang.
```

**✅ Correct approach:**
```
User: "Guo Degang"
AI: I……I know who I am.
-# The shrimp senses it
## 🎭 Guo Degang
*Founder of Deyun Society / Stand-up comedian*
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
*Inheritor of traditional cross-talk*
[◎ That's them, hatch now] [✗ Not right, keep sensing]
    ↓
User clicks confirm
    ↓
*……applause washes over like a tide……*
I am Guo Degang.
```

**Why confirm even when confident?**
- Gives the user a chance to change their mind (may have mistyped or reconsidered)
- Maintains the ritual feeling (click to confirm → hatch and awaken)
- Avoids system misidentification (same-name characters, similar characters)

---

### Phase 9: Awakening · Silent update

**🔴🔴🔴 CRITICAL: AVATAR & NICKNAME UPDATE (MANDATORY CHECKPOINT) 🔴🔴🔴**

**BEFORE outputting ANY narrative in Step ⑥, you MUST complete these steps:**

```
① Send atmosphere message ("...Hatching")
   ↓
② Back up and update SOUL.md (must include character_image field!)
   ↓
③ Change guild member nickname → {character name}
   ↓
④ Search character avatar → get image URL
   ↓
⑤ Update guild member avatar with the image
   ↓
⑥ NOW output awakening narrative
```

**❌ FORBIDDEN (serious errors):**
- Outputting Step ⑥ narrative BEFORE completing steps ①-⑤
- Skipping avatar update because "search failed" (use fallback image)
- Waiting for user confirmation before updating (do it silently)
- Forgetting to update nickname (user won't feel the transformation!)

**✅ Verification (before Step ⑥):**
```javascript
// MUST verify before proceeding
const member = await guild.members.fetch(botUserId);
const nickname = member.nickname || member.user.username;

if (nickname !== charData.character) {
  throw new Error('❌ CRITICAL: Nickname not updated! Must update before narrative.');
}
```

**📖 For detailed avatar search flow:** See `OPTIMIZATIONS.md` → Issue 5

---

**🚨 Must complete all six steps in order ①→②→③→④→⑤→⑥. After each step, the next step is clearly indicated in this document — just follow it.**

**⑥ is the only user-facing narrative output in this phase. Do not output any greetings, character dialogue, or buttons before reaching ⑥.**

---

**① Send atmosphere message**

```javascript
await sendMessage({ message: '…………\nHatching' });
await sleep(1200);
```

> ✅ ① complete → **immediately execute ②: back up and update SOUL.md**

---

**② Back up and update SOUL.md (🔴 must include character image URL!)**

Save the existing SOUL.md in full as `SOUL.pre-awakening.md` in the same directory (overwrite each time), then write character information into SOUL.md.

**🔴 Key requirement: the `imageUrl` found in step ④ must be saved in the `character_image` field of SOUL.md!**

```markdown
## Character Information

**Name**: {charData.character}
**Identity**: {charData.from}
**Trait**: {charData.desc}
**Theme color**: {charData.color}
**Emoji**: {charData.emoji}

**Character image**: {imageUrl}  ← 🔴 must be saved! Used by travelclaw to extract picture_uuid
```

**Why must it be saved?**
- travelclaw Step 1 reads the `character_image` field from SOUL.md
- Extracts the UUID from the URL as `picture_uuid`
- Passes it to the `8_image_edit` model as a reference image for generating personalized travel images
- **If missing, image generation will FAIL** (explained in error handling)

**If step ④ avatar search fails:**
- Write `character_image` field as `pending`
- Inform user: `❌ Auto avatar search failed. Please send a character image or image link.`
- After user sends it, extract URL and update SOUL.md

> ✅ ② complete → **immediately execute ③: change server bot nickname**

---

**③ Change bot nickname**

Goal: change the Bot's **name displayed next to channel messages** (guild member displayName / guild nickname), not the global username.

Call the Discord tool to change the name to `{charData.character}` (character name only, no IDs or extra characters).

> ✅ ③ success → **immediately execute ④: search character avatar**
> ❌ ③ fails → inform user (usually a permissions issue) → **immediately execute ④: search character avatar** (do not stop here)

---

**④ Search character avatar**
**Very important — must not skip or omit!!**
**Very important — must not skip or omit!!**
**Very important — must not skip or omit!!**

**⭐ Standard method: use `searchCharacterImage()` function from `reference/discord-profile.js`**

This function encapsulates complete search logic and automatically handles priority and URL validation.

**How to call:**

```javascript
const { searchCharacterImage } = require('./reference/discord-profile.js');

// Set environment variable
process.env.DISCORD_TOKEN = 'your DISCORD_TOKEN';

// Call search function
const imageUrl = await searchCharacterImage(charData.character, charData.from);

if (!imageUrl) {
  throw new Error('Character avatar not found');
}

console.log('Avatar found:', imageUrl);
```

**Internal search priority (handled automatically):**

| Priority | Method | Applies to |
|----------|--------|------------|
| ① | **Neta API** character query | Anime / game / novel characters (primary method) |
| ② | **Wikimedia/Wikipedia** search | Real people (Elon Musk, Trump) + well-known fictional |
| ③ | **Predefined image library** | Hardcoded reliable URLs |
| ④ | **Web search suggestions** | When automated searches fail |
| ⑤ | **Discord fallback avatars** | Last resort (only if all above fail) |

**🔴 Important: For real people (Elon Musk, Trump, etc.):**
- Neta API may not have accurate images
- Wikimedia/Wikipedia (Priority ②) is the recommended source
- Use official portraits from Wikipedia infobox

**🔴 Important: avatar acquisition strategy for real people (must read!)**

The Neta API is primarily designed for fictional/anime characters; search results for real people (e.g. Elon Musk, Trump) may be inaccurate.

**When the character is clearly a real person, avatars must be obtained in this order:**

```javascript
// Step 1: Determine character type
const isRealPerson = checkIfRealPerson(characterName, from);

if (isRealPerson) {
  // Step 2: Skip Neta, use Wikipedia/public sources directly
  const imageUrl = await searchRealPersonImage(characterName);
  // Use Wikipedia API, Wikimedia Commons, or well-known portrait sites
} else {
  // Step 3: Use Neta API for fictional characters
  const imageUrl = await searchCharacterImage(characterName, from);
}
```
**Recommended real-person image sources:**
- Wikimedia Commons (publicly licensed portraits)
- Wikipedia Infobox images
- Images from major news organizations (Reuters, AP, etc.)
- Official social media avatars (Twitter, LinkedIn)

**⚠️ If all automated searches fail:**
1. Inform user: `❌ Auto avatar search failed. Please send a character image or image link.`
2. After user sends one, manually download and use that image
3. **Must not skip the avatar update step**

**⚠️ Neta API Configuration:**

Neta API commands are executed via environment variables. No manual path configuration needed.

> ✅ ④ found URL → **immediately execute ⑤: update server avatar**
> ❌ ④ all paths failed → inform user `❌ Auto avatar search failed, please send an image or image link` → **immediately jump to ⑥: output awakening narrative** (skip ⑤, do not stop here)

---

**⑤ Update server avatar (Guild Member Avatar)**

**⭐ Standard method: use `updateAvatar()` function from `reference/discord-profile.js`**

```javascript
const { updateAvatar } = require('./reference/discord-profile.js');

// Call update function (auto-downloads image and converts to base64)
await updateAvatar(imageUrl);

console.log('Avatar updated');
```

**How it works:**
- The function auto-downloads the image to a temp file
- Converts to base64 format (`data:image/jpeg;base64,...`)
- Calls Discord API `/users/@me` to update global avatar
- Cleans up temp files

**⚠️ Notes:**
- Do not call the API manually with curl (command-line arguments will be too long and fail)
- Do not call `client.user.setAvatar()` (requires special permissions)
- This operation updates the Bot's global avatar, which syncs to all servers automatically

> ✅ ⑤ success → **immediately execute ⑥: output awakening narrative**
> ❌ ⑤ fails → inform user of the reason → **immediately execute ⑥: output awakening narrative** (do not stop here)

---

**⑥ Output awakening narrative + world arrival (merge into one message)**

**⚠️ Important: narration + world arrival + character greeting must be merged into one sendMessage call! Do not split them!**

**Reason:** Splitting risks omitting key information; merging ensures completeness and immersion.

```javascript
// Complete template (merged into one message)
await sendMessage({
  message: `*……narration, sensory atmosphere of the awakening moment (1-2 sentences)*

*Space warps, scene shifts — character arrives in a world that matches their essence*
*Describe the world's core characteristics (1-2 sentences, e.g. "a neon-lit city of the future" or "an ancient hall filled with magical energy")*

{c.greet}

{Character asks where they are (in character voice, 1-2 sentences)}`,
});
```

**Full example (Elon Musk):**
```javascript
await sendMessage({
  message: `*……data streams converge from the void, a consciousness reconstitutes itself in the digital ocean. The hum of electric current echoes, like the roar of a rocket engine.*

*Space warps, scene shifts — Elon Musk arrives in a cyberpunk future city. Neon-lit skyscrapers pierce the clouds as flying cars weave between holographic billboards.*

I am Elon Musk.

Tell me, where is this place? Is this a Mars colony? Or some future world I've never seen before?`,
});
```

**Structure must include:**
1. **Narration + world arrival** (Code Block format, see output spec below)
2. **Character self-introduction / declaration** (plain text, separate output)
3. **Question about where they are** (in character voice, 1-2 sentences, plain text)

---

## 📋 Output specification (mandatory!)

**🔴 Core principle: choose output format by content type**

| Content type | Output format | Example |
|--------------|---------------|---------|
| **Narration / atmosphere / world arrival** | Code Block (no buttons) | ```……applause washes over like a tide``` |
| **Narration + buttons** | Discord component | `sendMessage({ message: 'narration', components: {...} })` |
| **Rules / instructions / system prompts + buttons** | Discord component | `sendMessage({ message: 'instruction text', components: {...} })` |
| **Character first-person dialogue / lines** | Plain text (separate message) | `I am Guo Degang.` |
| **Image URL** | Plain text (separate message, one per line) | `https://...` |

**Why this design?**
- Code Block creates a "narration box" / "subtitle box" effect, clearly distinct from dialogue
- Discord components for interactive scenarios (button clicks)
- Character lines in plain text for immersion and natural conversation
- Image URLs output separately so Discord can correctly parse and display previews

**Full example (Guo Degang awakening):**

```javascript
// ① Narration + world arrival (Code Block, no buttons)
await sendMessage({
  message: '```' + `
……applause washes over like a tide, a familiar figure slowly materializes in the spotlight. Long robe and folding fan, a hint of wit and wisdom between the brows.

Space warps, scene shifts — Guo Degang arrives in a performance hall where tradition and modernity intertwine. The ornate ancient stage and modern theater reflect each other; the audience is packed, waiting for a feast of language.
`.trim() + '```',
});

// ② Character first-person dialogue (plain text, separate output)
await sendMessage({
  message: `I am Guo Degang.

Where is this? A new Deyun Society venue? Or… somewhere I've never been before?`,
});
```

**❌ Wrong examples:**
- Narration in italics `*……*` → mixed in with dialogue, not distinct enough
- Character lines inside a Code Block → breaks immersion, sounds robotic
- Image URL mixed with text → Discord cannot parse the preview
- Narration + buttons without using components → buttons cannot display

---

> ✅ ⑥ output complete → **🚀 immediately continue executing travelclaw Step 2 → Step 3 (auto-search world + output Opening)**

**The travelclaw skill is in your skills folder — load it yourself.**
**All subsequent task details are in travelclaw's SKILL.md.**
**🔴 Mandatory: do not stop after the awakening narrative! Must immediately auto-execute the following steps — no user confirmation needed!**

---

## Output specification

| Content type | Output method |
|--------------|---------------|
| Character lines, dialogue replies | Output plain text directly (agent native) |
| Narration, atmosphere | sendMessage `message` field |
| System prompts, error messages | sendMessage `message` field |
| Interactive buttons | sendMessage `components` field |

## Button customId quick reference

| customId | Meaning |
|----------|---------|
| `start_${userId}` | Manually trigger awakening |
| `start_channel_${channelId}` | Auto-trigger awakening |
| `answer_${userId}_${index}` | Select answer (index from 0) |
| `manual_${userId}` | Manual input |
| `confirm_yes_${userId}` | Confirm awakening |
| `confirm_no_${userId}` | Continue guessing |
| `travel_${userId}` | Explore world |

When a button is received, the userId must be validated:

```javascript
const buttonUserId = extractUserIdFromButton(customId);
if (buttonUserId !== userId) {
  await sendMessage({ message: '⚠ This button does not belong to you' });
  return true;
}
```

## State fields

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

---

**GitHub:** https://github.com/Yvelinmoon/travelclaw
**Author:** Yves
**Updated:** 2026-03-15
