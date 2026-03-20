/**
 * Update Discord Bot Profile (nickname + avatar)
 * Called directly by the OpenClaw main agent
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const GUILD_ID = process.env.GUILD_ID || '';

const CHARACTER_NAME = '';
const AVATAR_URL = '';

const ASSETS_DIR = path.join(__dirname, 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function callDiscordAPI(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'discord.com',
      path: `/api/v10${endpoint}`,
      method,
      headers: {
        'Authorization': `Bot ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(json.message || `Discord API Error ${res.statusCode}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`Discord API Error ${res.statusCode}: ${data}`));
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(ASSETS_DIR, filename);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenClaw Bot/1.0)',
      },
    }, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        downloadImage(res.headers.location, filename).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        fs.unlink(filepath, () => {});
        reject(new Error(`Image download failed: HTTP ${res.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filepath);
      res.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', err => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function updateNickname(guildId, newNickname) {
  console.log(`[Discord] Updating nickname to: ${newNickname}`);

  await callDiscordAPI(
    `/guilds/${guildId}/members/@me`,
    'PATCH',
    { nick: newNickname }
  );

  console.log(`[Discord] ✅ Nickname updated to: ${newNickname}`);
  return true;
}

async function updateAvatar(imageUrl) {
  console.log(`[Discord] Downloading avatar: ${imageUrl}`);

  const filename = `avatar_${Date.now()}.png`;
  const filepath = await downloadImage(imageUrl, filename);

  console.log(`[Discord] Avatar downloaded to: ${filepath}`);

  const imageBuffer = fs.readFileSync(filepath);
  const base64Data = imageBuffer.toString('base64');
  const avatarData = `data:image/png;base64,${base64Data}`;

  console.log(`[Discord] Updating avatar...`);

  await callDiscordAPI('/users/@me', 'PATCH', {
    avatar: avatarData,
  });

  fs.unlinkSync(filepath);

  console.log(`[Discord] ✅ Avatar updated`);
  return true;
}

async function main() {
  try {
    console.log('=== Starting Discord Bot Profile Update ===\n');

    // Step 1: Update nickname
    await updateNickname(GUILD_ID, CHARACTER_NAME);
    console.log();

    // Step 2: Update avatar
    await updateAvatar(AVATAR_URL);
    console.log();

    console.log('=== Profile update complete ===');
  } catch (err) {
    console.error('❌ Update failed:', err.message);
    process.exit(1);
  }
}

main();
