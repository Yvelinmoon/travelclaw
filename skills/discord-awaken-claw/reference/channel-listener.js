/**
 * Travelclaw - Discord Channel Event Listener
 *
 * Listens for channel creation events.
 * Sends initial guide message via direct-handler.
 * Button interactions and regular messages are handled by the OpenClaw main agent.
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const handler = require('./direct-handler.js');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const TOKEN = process.env.DISCORD_BOT_TOKEN || '' ;
const GUILD_ID = process.env.GUILD_ID;
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || '';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY;
const MODEL = process.env.LLM_MODEL || 'litellm/qwen3.5-plus';

if (!TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Listener started: ${c.user.tag}`);
  console.log(`  Watching guild: ${GUILD_ID || 'all guilds'}`);
  console.log('\n  Listening: channel creation (initial guide message only)');
  console.log('  Messages and button interactions are handled by the OpenClaw main agent');
});

// ─── LLM Call ─────────────────────────────────────────────────────────
async function callLLM(prompt, systemPrompt) {
  if (!LITELLM_API_KEY) {
    throw new Error('Missing LITELLM_API_KEY environment variable');
  }

  const response = await fetch(`${LITELLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LITELLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ─── Message Sender Adapter ───────────────────────────────────────────
function createSendMessage(channel) {
  return async (payload) => {
    try {
      const discordPayload = {
        content: payload.message || '',
      };

      if (payload.components?.blocks) {
        const actionRows = payload.components.blocks.map(block => {
          if (block.type === 'actions' && block.buttons) {
            const buttons = block.buttons.map(btn => {
              return new ButtonBuilder()
                .setLabel(btn.label)
                .setCustomId(btn.customId)
                .setStyle(btn.style === 'primary' ? ButtonStyle.Primary :
                         btn.style === 'success' ? ButtonStyle.Success :
                         btn.style === 'danger' ? ButtonStyle.Danger :
                         ButtonStyle.Secondary);
            });
            return new ActionRowBuilder().addComponents(buttons);
          }
          return null;
        }).filter(r => r !== null);

        if (actionRows.length > 0) {
          discordPayload.components = actionRows;
        }
      }

      const msg = await channel.send(discordPayload);
      console.log('[Send OK]', (payload.message || '[components]').substring(0, 50));
      return msg;
    } catch (error) {
      console.error('[Send Failed]', error.message);
      throw error;
    }
  };
}

// ─── Channel Creation Auto-Trigger ────────────────────────────────────
client.on(Events.ChannelCreate, async (channel) => {
  if (channel.type !== 0 && channel.type !== 5) return;

  const isPrivate = channel.permissionOverwrites.cache.size > 0;
  if (!isPrivate) {
    console.log('[Skip] Public channel:', channel.id);
    return;
  }

  // Prevent duplicate triggers across multiple listener instances
  if (handler.hasSeenChannel(channel.id)) {
    console.log('[Skip] Already processed channel:', channel.id);
    return;
  }

  console.log('[Channel Created]', channel.id, channel.name || 'unnamed');

  await sleep(2000);

  try {
    const botMember = await channel.guild.members.fetch(client.user.id);
    const botPermissions = channel.permissionsFor(botMember);

    if (!botPermissions.has('ViewChannel') || !botPermissions.has('SendMessages')) {
      console.log('[Skip] Bot lacks permissions:', channel.id);
      return;
    }
  } catch (err) {
    console.log('[Permission Check] Failed:', err.message);
    return;
  }

  const sendMessage = createSendMessage(channel);

  // Find the first regular user from permissionOverwrites (non-bot, non-owner, non-admin)
  let targetUserId = null;
  try {
    const adminRoleIds = new Set();
    for (const [, role] of channel.guild.roles.cache) {
      if (role.permissions.has('Administrator')) adminRoleIds.add(role.id);
    }

    for (const [id, overwrite] of channel.permissionOverwrites.cache) {
      // Only check user-type overwrites (type 1), skip role-type (type 0)
      if (overwrite.type !== 1) continue;

      const member = await channel.guild.members.fetch(id).catch(() => null);
      if (!member) continue;
      if (member.user.bot) continue;
      if (member.id === channel.guild.ownerId) continue;
      if (member.roles.cache.some(role => adminRoleIds.has(role.id))) continue;

      targetUserId = member.id;
      console.log('[Target User]', targetUserId, member.user.tag);
      break;
    }
  } catch (err) {
    console.log('[User Lookup] Failed:', err.message);
  }

  await handler.handleChannelCreate({
    id: channel.id,
    type: channel.type,
    permission_overwrites: [...channel.permissionOverwrites.cache.values()],
    targetUserId,
  }, sendMessage);
});

// Button interactions and regular messages are handled by the OpenClaw main agent.
// This listener only handles channel creation auto-trigger.

client.login(TOKEN);
