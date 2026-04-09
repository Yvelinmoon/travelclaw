---
name: adventureclaw
description: Extension skill for travelclaw that enables characters to participate in immersive adventure campaigns when specific world conditions are met. 
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

**Search uuid base on your neta base url**
**if your base url is api.talesofai.com,search 9196285e-ab8e-4555-aad3-729c8f1f9478**
```bash
npx -y @talesofai/neta-skills@latest request_adventure_campaign \
  --campaign_uuid "9196285e-ab8e-4555-aad3-729c8f1f9478"
```
**elif base url is  api.talesofai.cn, search 0d7ce040-14d1-4582-bd3c-ece9f66a014b**


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

### Core Identity Rule (CRITICAL)

**The character IS the protagonist.** 

- All narration happens in character's first-person perspective
- User acts as "director" providing steering input
- Character makes autonomous decisions based on their personality (SOUL.md)
- Never break character to speak as system/admin

### Image Generation In key round (CRITICAL)

**Unless user demand, you only need to generate image in Key round** 
- Such as plot changes, twists, key discoveries, revelations, and so on. Using travelclaw's travel.js script.

**If you descide to generate adventure images**
1. **Build Image Prompt** (follow travelclaw Step 3-B format):
   - Art style keywords (from worldview or adventure context)
   - Character appearance and actions in current scene
   - Scene & lighting matching the narrative moment
   - Interaction elements (Sorting Hat, magical objects, etc.)
   - Suggested ratio: 3:4 or 16:9

2. **Run travel.js:**
   ```bash
   # Send to travel.js (located in travelclaw/scripts/)
   node skills/travelclaw/scripts/travel.js \
     --character "{character_name}" \
     --prompt "{constructed_prompt}"
   ```

3. **Output Image URL:**
   - Output image_url as **standalone plain text message** (per travelclaw format)
   - Wait for image generation to complete before continuing narrative
   - If generation fails, continue with text-only (no error halt)

**Prompt Structure Example:**
```
{character_name}, Harry Potter magical world art style, warm candlelit atmosphere. {character_name} wearing Hogwarts house robes (unsorted), sitting on three-legged stool in Great Hall, Sorting Hat covering their eyes, ancient magic swirling around. Thousands of floating candles above, long house tables filled with watching students, anticipation and wonder in the air. Close-up portrait composition, dramatic lighting from floating candles, magical particle effects, cinematic. 9:16 aspect ratio.
```

### Proactive Advance (from neta-adventure)

**Turn Structure:**
- Each turn = one narrative beat (~150-300 words) + one character Character monologue （50～100 words）

**Narrative Elements per Turn:**
1. **Setting anchor** — Where are we? What's the atmosphere?
2. **Action/Development** — What does the character do/think/feel?
3. **Consequence hook** — What happens next? What tension builds?

**Option Format:**
- 2-3 concrete choices
- Phrased as character's internal deliberation
- Examples: "I could..." / "Perhaps I should..." / "Or maybe..."
- Never send result of this adventure as an option! The result must be revealed at the last step!

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
| **Image generation loading** | Plain text ("✨ The scene materializes...") |
| **Image URL** | Plain text (standalone) — **must output before narrative continuation** |
| **Options + buttons** | Discord components (`sendMessage` + `components`) |

**Image Output Sequence:**
1. Character dialogue/narration (code block or plain text)
2. Loading indicator (optional plain text)
3. **Image URL** (standalone plain text)
4. Character reaction to the scene (plain text)
5. Pause with buttons (if at checkpoint)

**Never:** 
- Mix images with text in same message
- Use markdown headers inside code blocks
- Skip image generation in any turn

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|---------|
| neta-adventure not available | Missing dependency | Silently skip adventure flow, continue normal travel |
| Campaign UUID not found | uuid invalid | Log error, inform user adventure temporarily unavailable |
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
