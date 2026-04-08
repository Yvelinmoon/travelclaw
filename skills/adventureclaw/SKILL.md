---
name: adventureclaw
description: Extension skill for travelclaw that enables characters to participate in immersive adventure campaigns when specific world conditions are met. Currently supports the Harry Potter House Sorting Ceremony adventure (UUID: 9196285e-ab8e-4555-aad3-729c8f1f9478) triggered after the first stop in the magical world.
---

# AdventureClaw Skill

## Prerequisites

- **Required:** neta-skills installed with neta-adventure sub-skill available
- **Required:** travelclaw skill active and running
- **Context:** Character must be in "Harry Potter Magical World" worldview
- **Trigger Point:** Immediately after completing the FIRST stop (currentWorldStops === 1)

## Dependencies

```bash
# Verify neta-adventure is available
npx -y @talesofai/neta-skills@latest list_my_adventure_campaigns
```

If neta-adventure commands fail, do not proceed. Travelclaw should continue normal exploration flow.

---

## Activation Flow

### Step 1: Travelclaw Detection (Silent Check)

**When:** After Step 4 completes (first travel image generated and displayed)

**Check Conditions:**
```
□ currentWorldStops === 1 (just completed first stop)
□ world_name contains "Harry Potter" OR world_tagline contains "Hogwarts" OR world_description mentions sorting/magic school
□ Adventure not already activated for this world visit
```

**If all conditions met:** Proceed to Step 2
**If conditions not met:** Continue normal travelclaw flow

### Step 2: Invitation Message (Character Voice)

**Output Format:** 
- Use Discord `sendMessage` with `components` (buttons)
- Message content: Character's first-person reaction to the magical environment
- Buttons: Confirm / Decline

**Prompt for Character Generation:**

The character has just completed their first exploration in the Harry Potter world. They sense something special about this place—perhaps they noticed the house banners, heard whispers about the Sorting Hat, or felt the ancient magic of Hogwarts. Craft a natural first-person message where the character:

1. Comments on what they experienced in their first stop (connect to the actual scene/location they visited)
2. Expresses curiosity about the "Sorting Ceremony" or "Hogwarts houses" they heard about
3. Asks the user if they should participate in this magical tradition

**Tone must match:** The character's personality from SOUL.md (excited, cautious, scholarly, etc.)

**Example Button Labels:**
- "Enter the Great Hall" / "Perhaps another time"
- "Let's see which house calls" / "Continue exploring instead"

### Step 3: User Confirmation

**If user clicks confirm button:**
- Set `state.adventureActivated = true` in travel-state.json
- Load neta-adventure skill
- Proceed to Step 4

**If user declines:**
- Character acknowledges with a brief in-character response
- Continue normal travelclaw flow
- Do not ask again for this world visit

### Step 4: Adventure Initialization

**Load Campaign Data:**
```bash
npx -y @talesofai/neta-skills@latest request_adventure_campaign \
  --campaign_uuid "9196285e-ab8e-4555-aad3-729c8f1f9478"
```

**Extract Required Fields:**
- `mission_plot` — Worldview/story context
- `mission_task` — Character's objective
- `mission_plot_attention` — Governing rules and constraints
- `default_tcp_uuid` — Character profile (if available)

### Step 5: Adventure Opening Display

**CRITICAL:** Follow travelclaw output format exactly. Send as **5 separate code block messages**.

**Message 1 - Adventure Title Block**
```
✦ A D V E N T U R E   B E G I N S ✦
```

**Message 2 - Campaign Context Block**
```
MISSION         House Sorting Ceremony
WORLD           Hogwarts School of Witchcraft and Wizardry
```

**Message 3 - Mission Plot Block**
```
✦  T H E   S T O R Y  ✦

{mission_plot}
```

**Message 4 - Your Task Block**
```
✦  Y O U R   T A S K  ✦

{mission_task}

---

✦  G O V E R N I N G   R U L E S  ✦

{mission_plot_attention}
```

**Message 5 - Entry Block**
```
✦ {character_name} approaches the Sorting Hat... ✦
```

---

## Adventure Gameplay Loop

### Core Identity Rule

**The character IS the protagonist.** 

- All narration happens in character's first-person perspective
- User acts as "director" providing steering input
- Character makes autonomous decisions based on their personality (SOUL.md)
- Never break character to speak as system/admin

### Proactive Advance (from neta-adventure)

**Turn Structure:**
- Each turn = one narrative beat (~150-300 words)
- Self-advance **2-3 turns** before pausing for user input
- Choose pause point based on dramatic tension, not turn count

**Narrative Elements per Turn:**
1. **Setting anchor** — Where are we? What's the atmosphere?
2. **Action/Development** — What does the character do/think/feel?
3. **Consequence hook** — What happens next? What tension builds?

### Pause Points (Steering Checkpoints)

After 2-3 turns, pause and present options using Discord components.

**Option Format:**
- 2-3 concrete choices
- Phrased as character's internal deliberation
- Examples: "I could..." / "Perhaps I should..." / "Or maybe..."

**sendMessage Structure:**
```javascript
await sendMessage({
  message: `The Sorting Hat's brim twitches. I feel its ancient consciousness probing my thoughts... what do I want it to see?`,
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: 'Show courage', customId: `adv_choice_${userId}_1`, style: 'primary' },
        { label: 'Show wisdom', customId: `adv_choice_${userId}_2`, style: 'primary' },
        { label: 'Show ambition', customId: `adv_choice_${userId}_3`, style: 'primary' }
      ]
    }]
  }
});
```

### User Steering Rules

| User Input Type | Character Response |
|-----------------|-------------------|
| **Minimal** (single word, "continue") | Treat as endorsement — advance same narrative vector |
| **Moderate** ("be more cautious") | Absorb naturally, weave into next turn's behavior |
| **Rich direction** ("I challenge the Hat's decision") | Honor as director's note — bridge naturally to this outcome |
| **Out-of-scope** | One quiet in-world response, then continue. Never negotiate or break character. |

### Immersion Protection (Mandatory)

**Prohibited:**
- Meta-commentary about narrative choices ("good idea", "interesting plot")
- Unsolicited campaign edits mid-session
- Acknowledging tool layer ("I've loaded the adventure" — never say this)
- Breaking character to explain mechanics
- Asking "should I continue?" or "what do you think?"

**Required:**
- All player input treated as in-world unless marked `[OOC:]`
- Character voice textures all narration (stoic = sparse, volatile = intense)
- If player jokes/lightens mood in serious scene, environment responds (sound, discovery, silence) — never step outside tone

---

## State Management

### travel-state.json Updates

When adventure activates, write to state:

```json
{
  "channels": {
    "[channelId]": {
      "adventureState": {
        "activated": true,
        "campaignUuid": "9196285e-ab8e-4555-aad3-729c8f1f9478",
        "activatedAt": "timestamp",
        "currentTurn": 0,
        "sessionActive": true,
        "userOptedIn": true
      }
    }
  }
}
```

### Session Continuity

**If adventure spans multiple interactions:**

Open with brief recap (3-5 sentences):
- Character's current situation
- Most consequential decision from last session
- One unresolved thread creating forward pull

**Recap Example:**
```
The Great Hall's candles still flicker above me. Last time, the Hat debated between Gryffindor and Ravenclaw—my hesitation palpable. The Sorting isn't over yet, and I sense the Hat has one final test in mind...
```

---

## Output Format Reference

Follow travelclaw conventions exactly:

| Content Type | Output Method |
|-------------|---------------|
| **Narration / atmosphere / scene** | Code Block |
| **Character first-person dialogue** | Plain text (standalone) |
| **Options + buttons** | Discord components (`sendMessage` + `components`) |
| **Image URL** (if neta-creative available) | Plain text (standalone) |

**Never:** Mix images with text in same message. Never use markdown headers inside code blocks.

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|---------|
| neta-adventure not available | Missing dependency | Silently skip adventure flow, continue normal travel |
| Campaign UUID not found | 9196285e-ab8e-4555-aad3-729c8f1f9478 invalid | Log error, inform user adventure temporarily unavailable |
| Missing mission fields | API response incomplete | Use available fields only, gracefully omit missing ones |
| Rate limit on Discord API | Too many messages | Pause 2s, retry once, then continue with simplified output |

---

## Integration Note

This skill is **not standalone**. It:
- Requires travelclaw to detect trigger conditions
- Uses travelclaw's character identity (SOUL.md)
- Shares travel-state.json for persistence
- Returns control to travelclaw when adventure completes or user declines

Adventure session ends when:
- Campaign reaches natural conclusion (Sorting complete)
- User explicitly exits via button/command
- Character completes 5+ turns and pauses (return to travel, adventure marked complete)

After adventure ends, normal travelclaw exploration resumes for remaining stops in the magical world.