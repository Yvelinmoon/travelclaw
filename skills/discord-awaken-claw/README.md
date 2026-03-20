# 🦞 Lobster Baby Awakening Skill

A complete Discord character awakening skill that guides the Bot through a full flow of Q&A → guessing → confirmation → awakening → roleplay, transforming it into the character the user has in mind.

<img width="2486" height="1584" alt="image" src="https://github.com/user-attachments/assets/fe88badc-4074-44f9-be59-3947c892aa4e" />


---

## ✨ Features

- 🎮 **Complete awakening flow** - Seamless experience from initial keyword to roleplay
- 🤖 **LLM-powered follow-up** - Dynamically generates questions and options; identifies the character in 2–3 rounds
- 🎨 **Auto profile update** - soul.md, Discord nickname, and avatar updated in one step
- 🔄 **Hybrid interaction** - Button selection + @Bot text input, smooth and natural

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
cd /home/node/.openclaw/workspace/skills
git clone https://github.com/Yvelinmoon/discord-awaken-claw-new.git awakening
cd awakening
```

### 2. Configure environment variables

```bash
cd reference
cp .env.example .env
# Edit .env and fill in your DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, and NETA_TOKEN
```

### 3. Install dependencies

```bash
cd reference
pnpm install
# or npm install
```

### 4. Integrate into OpenClaw

Import and use in the OpenClaw main agent:

```javascript
const handler = require('./skills/awakening/reference/direct-handler.js');

const handled = await handler.handleDiscordMessage({
  userId: message.author.id,
  channelId: message.channel.id,
  guildId: message.guild?.id,
  content: message.content,
  customId: message.interaction?.customId,
  interactionType: message.interaction ? 'button' : 'message',
  sendMessage: async (payload) => {
    return await message.channel.send(payload);
  },
}, async (prompt, systemPrompt) => {
  const result = await callLLM(prompt, systemPrompt);
  return result;
});
```

### 5. Test awakening

Type `@Bot start awakening` in Discord

---

## 📖 Documentation

- **[SKILL.md](./SKILL.md)** - Agent skill specification (detailed workflow)
- **[DEPLOY.md](./DEPLOY.md)** - Deployment guide and troubleshooting

---

## 🎮 Usage Example

```
User: /awakening

Bot: ○ Lobster Baby · Waiting to hatch
     [◎ I have one in mind]

User: [click button] → type "blonde American president" → select "real person"

Bot: ## 🇺🇸 Donald Trump
     [◎ That's them, hatch now]

User: [click confirm]

Bot: I am Donald Trump, the 45th President of the United States.
```

---

## 📁 File Structure

```
awakening/
├── SKILL.md                # Skill documentation (required reading for Agent)
├── README.md               # Human quick-start guide
├── DEPLOY.md               # Deployment guide
└── reference/              # Core code and configuration
    ├── direct-handler.js   # Main handler (core logic)
    ├── discord-profile.js  # Discord profile updater
    ├── package.json        # Dependency configuration
    └── state.json          # Runtime state storage (auto-generated)
```

---

## 📄 License

MIT License

**GitHub:** https://github.com/Yvelinmoon/discord-awaken-claw-new
