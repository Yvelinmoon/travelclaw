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

  // Find the target user using multi-layer strategy
  // Priority: 1) permissionOverwrites user 2) channel topic owner hint 3) role-based access
  let targetUserId = null;
  try {
    const adminRoleIds = new Set();
    for (const [, role] of channel.guild.roles.cache) {
      if (role.permissions.has('Administrator')) adminRoleIds.add(role.id);
    }

    // Helper function to validate if a member is a valid target (non-bot, non-owner, non-admin)
    const isValidTarget = (member) => {
      if (!member) return false;
      if (member.user.bot || member.user.system) return false;
      if (member.id === channel.guild.ownerId) return false;
      if (member.roles.cache.some(role => adminRoleIds.has(role.id))) return false;
      return true;
    };

    // STEP 1: Check user-type permission overwrites (original logic)
    console.log('[User Search] Step 1: Checking permission overwrites...');
    for (const [id, overwrite] of channel.permissionOverwrites.cache) {
      if (overwrite.type !== 1) continue; // Skip role-type (type 0)

      const member = await channel.guild.members.fetch(id).catch(() => null);
      if (isValidTarget(member)) {
        targetUserId = member.id;
        console.log('[Target User] Found in permission overwrites:', targetUserId, member.user.tag);
        break;
      }
    }

    // STEP 2: Parse channel topic for owner:userId hint
    if (!targetUserId && channel.topic) {
      console.log('[User Search] Step 2: Checking channel topic for owner hint...');
      const ownerMatch = channel.topic.match(/owner[:\s]*(\d+)/i);
      if (ownerMatch) {
        const hintedUserId = ownerMatch[1];
        console.log('[User Search] Found owner hint in topic:', hintedUserId);
        const member = await channel.guild.members.fetch(hintedUserId).catch(() => null);
        if (isValidTarget(member)) {
          // Verify this user can actually access the channel
          const permissions = channel.permissionsFor(member);
          if (permissions && permissions.has('ViewChannel')) {
            targetUserId = member.id;
            console.log('[Target User] Found via topic hint:', targetUserId, member.user.tag);
          } else {
            console.log('[User Search] Hinted user cannot access channel, skipping');
          }
        }
      }
    }

    // STEP 3: Find users via role-based permissions
    if (!targetUserId) {
      console.log('[User Search] Step 3: Checking role-based permissions...');
      const roleOverwrites = [];
      
      // Collect role overwrites that allow channel access
      for (const [roleId, overwrite] of channel.permissionOverwrites.cache) {
        if (overwrite.type !== 0) continue; // Only role-type
        
        // Check if this role allows ViewChannel
        const allow = BigInt(overwrite.allow?.bitfield || overwrite.allow || 0);
        const deny = BigInt(overwrite.deny?.bitfield || overwrite.deny || 0);
        const VIEW_CHANNEL = BigInt(1024);
        
        // Role allows access if: allow has VIEW_CHANNEL OR (not denied AND @everyone allows)
        const roleAllows = (allow & VIEW_CHANNEL) !== BigInt(0);
        const roleDenies = (deny & VIEW_CHANNEL) !== BigInt(0);
        
        if (roleAllows && !roleDenies) {
          const role = channel.guild.roles.cache.get(roleId);
          if (role && !adminRoleIds.has(roleId)) {
            roleOverwrites.push({ role, roleId });
          }
        }
      }
      
      // Prioritize specific channel roles over general roles
      roleOverwrites.sort((a, b) => {
        const aIsSpecific = a.role.name.toLowerCase().includes('claw') || 
                           a.role.name.toLowerCase().includes(channel.name.toLowerCase());
        const bIsSpecific = b.role.name.toLowerCase().includes('claw') || 
                           b.role.name.toLowerCase().includes(channel.name.toLowerCase());
        return bIsSpecific - aIsSpecific; // Specific roles first
      });
      
      console.log(`[User Search] Found ${roleOverwrites.length} eligible roles`);
      
      // Search for valid users in these roles
      for (const { role, roleId } of roleOverwrites) {
        console.log(`[User Search] Checking role: ${role.name} (${role.members.size} members)`);
        
        for (const [, member] of role.members) {
          if (isValidTarget(member)) {
            // Verify the user actually has ViewChannel permission in this channel
            const permissions = channel.permissionsFor(member);
            if (permissions && permissions.has('ViewChannel')) {
              targetUserId = member.id;
              console.log('[Target User] Found via role:', targetUserId, member.user.tag, 'Role:', role.name);
              break;
            }
          }
        }
        
        if (targetUserId) break;
      }
    }

    if (!targetUserId) {
      console.log('[User Search] No valid target user found');
    }
  } catch (err) {
    console.error('[User Lookup] Error:', err.message);
  }

  await handler.handleChannelCreate({
    id: channel.id,
    type: channel.type,
    permission_overwrites: [...channel.permissionOverwrites.cache.values()],
    targetUserId,
  }, sendMessage, channel, client.user.id);
});

// Button interactions and regular messages are handled by the OpenClaw main agent.
// This listener only handles channel creation auto-trigger.

client.login(TOKEN);
