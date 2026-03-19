/**
 * Discord 个人资料管理
 * 
 * 用于觉醒后更新 Bot 的昵称和头像
 * 
 * 实现方式：
 * 1. 使用 OpenClaw 的 exec 工具调用 Discord API
 * 2. 或使用 discord.js 的 REST API
 * 3. 或直接 HTTP 调用 Discord API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────
// 尝试多个环境变量名称（兼容不同配置）
let TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;

// 如果环境变量没有，尝试从 .env 文件加载
if (!TOKEN) {
  try {
    const envPath = path.join(__dirname, '.env');
    if (require('fs').existsSync(envPath)) {
      const envContent = require('fs').readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DISCORD_(?:BOT_)?TOKEN=(.+)$/m);
      if (match) {
        TOKEN = match[1].trim();
        console.log('[Discord] 从 .env 文件加载 token');
      }
    }
  } catch (err) {
    console.warn('[Discord] 无法从 .env 加载 token:', err.message);
  }
}

const ASSETS_DIR = path.join(__dirname, 'assets');

// 确保 assets 目录存在
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// ─── Utility Functions ────────────────────────────────────────────────
/**
 * 验证图片 URL 是否可访问
 * @param {string} url - 图片 URL
 * @returns {Promise<boolean>}
 */
async function isValidImageUrl(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const req = https.get(url, { timeout: 5000 }, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // 重定向，跟随
        isValidImageUrl(res.headers.location).then(resolve);
        return;
      }
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// ─── Discord API Helpers ──────────────────────────────────────────────
/**
 * 调用 Discord API
 */
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

/**
 * 下载图片
 */
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(ASSETS_DIR, filename);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenClaw Bot/1.0)',
      },
    };
    
    https.get(url, options, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // 重定向
        downloadImage(res.headers.location, filename).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        fs.unlink(filepath, () => {});
        reject(new Error(`图片下载失败：HTTP ${res.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        if (stats.size < 1000) {
          // 文件太小，可能不是有效图片
          fs.unlink(filepath, () => {});
          reject(new Error('下载的文件太小，可能不是有效图片'));
          return;
        }
        resolve(filepath);
      });
    }).on('error', err => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// ─── Profile Update Functions ─────────────────────────────────────────
/**
 * 更新 Bot 昵称
 * 
 * @param {string} guildId - 服务器 ID
 * @param {string} newNickname - 新昵称
 */
async function updateNickname(guildId, newNickname) {
  if (!TOKEN) {
    throw new Error('缺少 DISCORD_BOT_TOKEN 环境变量');
  }
  
  try {
    // 使用 @me 端点更新当前 Bot 的昵称
    // 注意：必须使用 @me 而不是 Bot ID，这是 Discord API 的要求
    await callDiscordAPI(
      `/guilds/${guildId}/members/@me`,
      'PATCH',
      { nick: newNickname }
    );
    
    console.log(`[Discord] 昵称已更新为：${newNickname}`);
    return true;
  } catch (err) {
    console.error('[Discord] 更新昵称失败:', err.message);
    throw err;
  }
}

/**
 * 更新 Bot 头像
 * 
 * @param {string} imageUrl - 图片 URL
 */
async function updateAvatar(imageUrl) {
  if (!TOKEN) {
    throw new Error('缺少 DISCORD_BOT_TOKEN 环境变量');
  }
  
  try {
    // 下载图片
    const filename = `avatar_${Date.now()}.jpg`;
    const filepath = await downloadImage(imageUrl, filename);
    
    // 读取并转换为 base64
    const imageBuffer = fs.readFileSync(filepath);
    const base64Data = imageBuffer.toString('base64');
    
    // Discord API 需要 data:image/jpeg;base64, 前缀
    const avatarData = `data:image/jpeg;base64,${base64Data}`;
    
    // 更新头像
    await callDiscordAPI('/users/@me', 'PATCH', {
      avatar: avatarData,
    });
    
    // 清理临时文件
    fs.unlinkSync(filepath);
    
    console.log(`[Discord] 头像已更新`);
    return true;
  } catch (err) {
    console.error('[Discord] 更新头像失败:', err.message);
    throw err;
  }
}

/**
 * 搜索角色图片 ⭐ 核心功能！
 * 
 * ─────────────────────────────────────────────────────────────────────
 * ⭐ 搜索优先级（重要！）
 * ─────────────────────────────────────────────────────────────────────
 * 
 * 【优先级 1】Neta API 角色查询 ← 主要方式！
 *   - 调用 neta-skills 的 search_character_or_elementum 命令
 *   - 从 Neta 数据库获取角色官方头像
 *   - 适用于：动漫、游戏、小说等虚构角色
 *   - 成功率高，图片质量好
 * 
 * 【优先级 2】维基百科/公开图片搜索
 *   - 适用于：真实人物、知名虚构角色
 *   - 使用维基百科、Fandom Wiki 等公开资源
 * 
 * 【优先级 3】预定义图片库
 *   - 硬编码的可靠图片 URL
 *   - 作为最后备选方案
 * 
 * 【优先级 4】Web 搜索提示
 *   - 当所有自动搜索失败时，提示用户进行 Web 搜索
 * 
 * ─────────────────────────────────────────────────────────────────────
 * 
 * @param {string} characterName - 角色名称
 * @param {string} from - 作品名称
 * @returns {Promise<string|null>} 图片 URL
 */
async function searchCharacterImage(characterName, from) {
  console.log(`[Search] 🔍 搜索角色图片：${characterName} (${from})`);
  console.log('[Search] ─────────────────────────────────────');
  console.log('[Search] ⭐ 主要方式：Neta API 角色查询');
  console.log('[Search] ─────────────────────────────────────');
  
  // ─── 【优先级 1】Neta API 角色查询 ← 主要方式！ ─────────────────────
  console.log('[Search] [1/4] 尝试 Neta API 搜索（灵活关键词策略）...');
  const netaSearch = require('./neta-avatar-search.js');
  try {
    const netaResult = await netaSearch.searchCharacter(characterName, from);
    if (netaResult && netaResult.avatar) {
      console.log(`[Search] ✅ [优先级 1 - Neta] 找到角色：${netaResult.name}`);
      console.log(`[Search] 🖼️ 头像 URL: ${netaResult.avatar}`);
      console.log(`[Search] 📝 使用关键词：${netaResult.keywords || 'N/A'}`);
      return netaResult.avatar;
    }
  } catch (err) {
    console.warn('[Search] Neta 搜索失败:', err.message);
  }
  
  // ─── 【优先级 2】维基百科/公开图片搜索 ───────────────────────────────
  console.log('[Search] [2/4] 尝试维基百科/公开图片搜索...');
  const wikiSearch = await searchWikiImage(characterName, from);
  if (wikiSearch) {
    console.log(`[Search] ✅ [优先级 2 - 维基百科] 找到图片：${wikiSearch}`);
    return wikiSearch;
  }
  
  // ─── 【优先级 3】预定义图片库 ────────────────────────────────────────
  console.log('[Search] [3/4] 尝试预定义图片库...');
  const predefinedPeople = {
    // 真实人物 - 维基百科官方肖像
    '唐纳德·特朗普': 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
    'Donald Trump': 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
    '特朗普': 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
    '乔·拜登': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg',
    'Joe Biden': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg',
    '拜登': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg',
    '贝拉克·奥巴马': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg',
    'Barack Obama': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg',
    '奥巴马': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg',
    
    // 动漫角色（备选，优先使用 Neta）
    '阿尔托莉雅·潘德拉贡': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Artoria_Pendragon_%28Fate%29.png',
    '阿尔托莉雅': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Artoria_Pendragon_%28Fate%29.png',
    'Saber': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Artoria_Pendragon_%28Fate%29.png',
  };
  
  if (predefinedPeople[characterName]) {
    console.log(`[Search] ✅ [优先级 3 - 预定义] 使用图片：${predefinedPeople[characterName]}`);
    return predefinedPeople[characterName];
  }
  
  // ─── 【优先级 4】所有方式都失败了 - 提供 Web 搜索建议 ─────────────────
  console.log('[Search] ❌ 所有自动搜索方式都未找到图片');
  console.log('[Search] ─────────────────────────────────────');
  console.log('[Search] 💡 建议进行 Web 搜索获取图片：');
  
  // 生成搜索建议
  const searchQueries = [
    `${characterName} ${from.replace(/[《》]/g, '')} 官方图片`,
    `${characterName} official portrait`,
    `${characterName} wiki`,
    `${from.replace(/[《》]/g, '')} ${characterName} character art`,
  ];
  
  console.log('[Search] 推荐搜索关键词：');
  searchQueries.forEach((q, i) => {
    console.log(`[Search]   ${i + 1}. ${q}`);
  });
  
  console.log('[Search] ─────────────────────────────────────');
  console.log('[Search] 📌 可能原因：');
  console.log('[Search]   - Neta 数据库中没有该角色');
  console.log('[Search]   - 角色名称不够准确或完整');
  console.log('[Search]   - 图片 URL 已失效或不可访问');
  console.log('[Search] 📌 解决方案：');
  console.log('[Search]   1. 使用上述关键词进行 Web 搜索');
  console.log('[Search]   2. 手动提供角色图片 URL');
  console.log('[Search]   3. 检查 NETA_TOKEN 是否配置正确');
  
  return null;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 发起 HTTPS GET 请求并返回 JSON（含 429 自动重试）
 * @param {string} url - 完整 URL
 * @param {number} retries - 剩余重试次数
 * @returns {Promise<Object>}
 */
function httpsGetJson(url, retries = 2) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'OpenClaw-Bot/1.0 (https://github.com/talesofai/travelclaw)' },
      timeout: 8000,
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        httpsGetJson(res.headers.location, retries).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode === 429 && retries > 0) {
        const retryAfter = parseInt(res.headers['retry-after'] || '3', 10);
        console.log(`[Wiki] 429 rate limited, waiting ${retryAfter}s before retry...`);
        res.resume(); // drain response
        sleep(retryAfter * 1000).then(() => httpsGetJson(url, retries - 1).then(resolve).catch(reject));
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse failed: ${data.substring(0, 200)}`)); }
      });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

/**
 * 搜索维基百科/Wikimedia Commons 图片（使用真实 API）
 *
 * 策略 1: Wikipedia pageimages API — 获取词条主图（最快、最可靠）
 * 策略 2: Wikimedia Commons search API — 搜索 Commons 图片库
 * 策略 3: 中文维基百科 fallback — 用中文名搜索
 *
 * @param {string} characterName - 角色名称
 * @param {string} from - 作品名称
 * @returns {Promise<string|null>} 图片 URL
 */
async function searchWikiImage(characterName, from) {
  // 构建搜索名称列表（英文优先，中文 fallback）
  const searchNames = [characterName];
  // 如果名字包含中文分隔符，生成英文化版本
  const cleanName = characterName.replace(/[·]/g, ' ').trim();
  if (cleanName !== characterName) searchNames.push(cleanName);
  // 也尝试去掉所有空格/分隔符的版本
  const compactName = characterName.replace(/[·\s\-]/g, '');
  if (compactName !== characterName) searchNames.push(compactName);

  // ─── 策略 1: Wikipedia pageimages API ──────────────────────────────
  // 直接获取维基百科词条的主图，适用于有词条的人物/角色
  for (const name of searchNames) {
    try {
      // 先尝试英文维基百科
      const enTitle = encodeURIComponent(name.replace(/\s/g, '_'));
      const enUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${enTitle}&prop=pageimages&format=json&pithumbsize=500&redirects=1`;
      console.log(`[Wiki] 策略1: Wikipedia pageimages → "${name}"`);

      const enResult = await httpsGetJson(enUrl);
      const enPages = enResult?.query?.pages;
      if (enPages) {
        const page = Object.values(enPages)[0];
        if (page && page.thumbnail && page.thumbnail.source) {
          // 尝试获取更大的图片（将 500px 替换为原图或更大尺寸）
          let imageUrl = page.thumbnail.source;
          // Wikipedia thumbnail URL 格式：.../thumb/x/xx/Filename.jpg/500px-Filename.jpg
          // 去掉最后的尺寸前缀可以获取更大图片
          const largerUrl = imageUrl.replace(/\/\d+px-/, '/800px-');
          await sleep(1500); // 请求间隔，避免 429
          const isLargerValid = await isValidImageUrl(largerUrl);
          if (isLargerValid) imageUrl = largerUrl;

          console.log(`[Wiki] ✅ 策略1成功 (en.wikipedia): ${imageUrl}`);
          return imageUrl;
        }
      }
    } catch (err) {
      console.log(`[Wiki] 策略1 英文维基失败 (${name}): ${err.message}`);
    }

    await sleep(2000); // 英文→中文维基之间间隔

    try {
      // 尝试中文维基百科
      const zhTitle = encodeURIComponent(name);
      const zhUrl = `https://zh.wikipedia.org/w/api.php?action=query&titles=${zhTitle}&prop=pageimages&format=json&pithumbsize=500&redirects=1`;

      const zhResult = await httpsGetJson(zhUrl);
      const zhPages = zhResult?.query?.pages;
      if (zhPages) {
        const page = Object.values(zhPages)[0];
        if (page && page.thumbnail && page.thumbnail.source) {
          let imageUrl = page.thumbnail.source;
          const largerUrl = imageUrl.replace(/\/\d+px-/, '/800px-');
          await sleep(1500); // 请求间隔，避免 429
          const isLargerValid = await isValidImageUrl(largerUrl);
          if (isLargerValid) imageUrl = largerUrl;

          console.log(`[Wiki] ✅ 策略1成功 (zh.wikipedia): ${imageUrl}`);
          return imageUrl;
        }
      }
    } catch (err) {
      console.log(`[Wiki] 策略1 中文维基失败 (${name}): ${err.message}`);
    }

    await sleep(2000); // 不同名称变体之间间隔
  }

  await sleep(2000); // 策略1→策略2之间间隔

  // ─── 策略 2: Wikimedia Commons search API ─────────────────────────
  // 在 Wikimedia Commons 图片库中搜索（适合名人肖像等）
  for (const name of searchNames) {
    try {
      const query = encodeURIComponent(`${name} portrait`);
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${query}&srnamespace=6&srlimit=5&format=json`;
      console.log(`[Wiki] 策略2: Commons search → "${name} portrait"`);

      const searchResult = await httpsGetJson(searchUrl);
      const hits = searchResult?.query?.search;

      if (hits && hits.length > 0) {
        // 遍历搜索结果，获取每个文件的实际图片 URL
        for (const hit of hits) {
          try {
            await sleep(1500); // 每个 Commons 结果之间间隔
            const fileTitle = encodeURIComponent(hit.title);
            const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${fileTitle}&prop=imageinfo&iiprop=url|size&format=json`;

            const infoResult = await httpsGetJson(infoUrl);
            const pages = infoResult?.query?.pages;
            if (pages) {
              const page = Object.values(pages)[0];
              const imageInfo = page?.imageinfo?.[0];
              if (imageInfo && imageInfo.url) {
                // 过滤掉太小的图片（可能是图标/logo）
                if (imageInfo.width && imageInfo.width < 100) continue;
                // 过滤掉 SVG（通常是图表/图标）
                if (imageInfo.url.endsWith('.svg')) continue;

                const isValid = await isValidImageUrl(imageInfo.url);
                if (isValid) {
                  console.log(`[Wiki] ✅ 策略2成功 (Commons): ${imageInfo.url}`);
                  return imageInfo.url;
                }
              }
            }
          } catch (e) {
            // 单个结果获取失败，继续尝试下一个
          }
        }
      }
    } catch (err) {
      console.log(`[Wiki] 策略2 Commons搜索失败 (${name}): ${err.message}`);
    }
  }

  console.log('[Wiki] 所有维基百科/Commons 策略均未找到图片');
  return null;
}

/**
 * 使用 OpenClaw web_search 搜索图片
 */
async function searchCharacterImageViaOpenClaw(characterName, from) {
  // 这需要在 OpenClaw 环境中调用 web_search 工具
  // 示例查询："{characterName} {from} 官方图片"
  
  const query = `${characterName} ${from} 官方图片 动漫角色`;
  
  console.log(`[Search] 查询：${query}`);
  
  // TODO: 调用 OpenClaw web_search 工具
  // const results = await web_search({ query, count: 5 });
  
  // 从结果中提取图片 URL
  // 返回第一个有效的图片 URL
  
  return null;
}

/**
 * 完整的个人资料更新流程
 * 
 * @param {Object} charData - 角色数据
 * @param {string} guildId - 服务器 ID
 */
async function updateDiscordProfile(charData, guildId) {
  const results = {
    nickname: false,
    avatar: false,
    errors: [],
  };
  
  try {
    // 1. 更新昵称
    if (charData.character) {
      await updateNickname(guildId, charData.character);
      results.nickname = true;
    }
  } catch (err) {
    results.errors.push(`昵称更新失败：${err.message}`);
  }
  
  try {
    // 2. 搜索并更新头像
    if (charData.character && charData.from) {
      const imageUrl = await searchCharacterImage(charData.character, charData.from);
      
      if (imageUrl) {
        await updateAvatar(imageUrl);
        results.avatar = true;
      } else {
        results.errors.push('未找到角色图片');
      }
    }
  } catch (err) {
    results.errors.push(`头像更新失败：${err.message}`);
  }
  
  return results;
}

// ─── Alternative: Using OpenClaw exec ─────────────────────────────────
/**
 * 使用 OpenClaw exec 工具调用 Discord API
 * 
 * 这需要 OpenClaw 支持 exec 工具
 */
async function updateProfileViaExec(guildId, charData) {
  const { exec } = require('child_process');
  
  return new Promise((resolve, reject) => {
    // 使用 curl 调用 Discord API
    const commands = [];
    
    // 更新昵称
    if (charData.character) {
      commands.push(
        `curl -X PATCH https://discord.com/api/v10/guilds/${guildId}/members/@me` +
        ` -H "Authorization: Bot ${TOKEN}"` +
        ` -H "Content-Type: application/json"` +
        ` -d '{"nick":"${charData.character}"}'`
      );
    }
    
    // 执行命令
    exec(commands.join(' && '), (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// ─── Exports ──────────────────────────────────────────────────────────
module.exports = {
  updateNickname,
  updateAvatar,
  searchCharacterImage,
  updateDiscordProfile,
  callDiscordAPI,
};
