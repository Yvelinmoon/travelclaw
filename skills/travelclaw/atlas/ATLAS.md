# Atlas — Travel Album

> This file is invoked by the travelclaw main flow when the user triggers "generate album". It does not run automatically.

---

## Trigger Condition

When the user says "generate album" / "view album" / "photo album" / "html", jump here from the main flow.

Before running this flow, confirm the following data exists in the session:
- `character_name` — the character's name
- `world_name` — the world visited in this journey
- At least 1 travel stop (`destination_name` + `image_url` + `collection_uuid`)

---

## Ask for Style Preference

After triggering, first ask the user what style they want:
```
What style do you want for the album? (Skip to use the default map style)
Examples: vintage film / starry sky / pixel game / minimal white...
```

If the user skips or doesn't respond, default to the **interactive map style**.

---

## Default Style: Interactive Map

Freely generate an interactive world map page:
- Design the map background based on the tone of `world_name` (hand-drawn parchment, star chart, pixel map, etc.)
- Each travel image becomes a "landmark" on the map, arranged in exploration order
- Click any landmark to pop up the enlarged image + destination name + play link + stop info
- Overall atmosphere matches the character's personality and the world they visited

### Recommended Style Templates

**🎮 Pixel Game Style**
- 8-bit / 16-bit pixel art aesthetic
- Map designed as a retro game world map
- Landmarks as pixel icons (flags, treasure chests, portals)
- Popups styled as game dialog boxes
- Pixel fonts
- Color palette inspired by classic RPGs (Zelda, Final Fantasy, etc.)
- Best for: game characters, anime characters, lighthearted journeys

**🌟 Starry Space Style**
- Deep starfield background with constellation lines
- Landmarks as glowing planets or constellation nodes
- Path lines connecting stops like star trails
- Popups with frosted glass effect
- Colors: deep blue, purple, gold accents
- Best for: sci-fi characters, space themes, epic journeys

**📜 Vintage Journal Style**
- Aged paper texture background
- Hand-drawn map illustration
- Landmarks as stamps or sticker effects
- Popups styled as sticky notes or cards
- Hand-drawn arrows and doodle decorations
- Colors: warm yellow, tan, moss green
- Best for: artistic characters, everyday travel, warm memories

**⚡ Cyberpunk Style**
- Neon grid background, high-tech UI
- Landmarks as glowing nodes / circuit points
- Path lines flowing like data streams
- Popups as holographic projections
- Colors: cyan, magenta, black background
- Best for: sci-fi characters, futuristic worlds, high-tech themes

**🎨 Illustrated Art Style**
- High-quality hand-drawn illustration background
- Landmarks as ornate badges or crests
- Path lines flowing like ribbons
- Popups as card-style with shadows and rounded corners
- Decorative borders and patterns
- Color palette customized to the character's image color
- Best for: elegant characters, fantasy worlds, visual journeys

**🧸 Cute Cartoon Style**
- Bright and lively cartoon aesthetic
- Landmarks as cute icons (stars, hearts, clouds)
- Path lines as colorful rainbows
- Popups as speech bubbles
- Animated effects (bounce, blink)
- Colors: high saturation, multicolor
- Best for: cute characters, casual daily life, cheerful journeys

---

**Style selection tips:**
- Prioritize matching the character's personality (e.g. Musk → cyberpunk/starry, Klee → pixel/cartoon)
- Consider the world's tone (fantasy → vintage journal/illustrated, sci-fi → cyberpunk/starry)
- Users can specify keywords like "more game-like" or "make it pixel style"

---

## User Custom Style

If the user specifies a style, freely design:
- Not limited to map form — can be gallery, card wall, timeline, magazine layout, etc.
- Keep the **click image to pop up enlarged view + more info** interaction
- The more specific the style description, the better the result

---

## Save and Share

Save the HTML to:
```
~/.openclaw/workspace/pages/travel_{character_name}_{date}.html
```

**After generation, ask the user for their username to build the full share link:**
```
📖 {character_name}'s travel album has been sealed!

What is your pages username? (used to generate the share link)
Format: https://claw-{your-username}-pages.talesofai.com
```

After the user provides their username, output the full link (on its own line so Discord unfurls the preview):
```
🔗 https://claw-{username}-pages.talesofai.com/travel_{character_name}_{date}.html
```

> If the user already provided their username earlier in this session, reuse it — no need to ask again.

---

## Iterative Editing

After generation, encourage the user to keep customizing:
```
Want a different style? Give me a keyword and I'll regenerate it ✨
Examples: darker / add animations / switch to horizontal timeline...
```

Each time the user requests a change, regenerate the HTML and overwrite the original file, then output the latest share link again (output directly if username is already known — no need to ask again).
