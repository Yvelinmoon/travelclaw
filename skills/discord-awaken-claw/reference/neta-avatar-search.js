/**
 * Neta API Character Avatar Search - Enhanced
 *
 * Searches characters via Neta API and retrieves official avatars.
 * Supports flexible keyword strategies and image URL validation.
 */

const { exec } = require('child_process');
const https = require('https');

const NETA_CLI_DIR = '/home/node/.openclaw/workspace/neta-skills';

/**
 * Validate whether an image URL is accessible
 * @param {string} url
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

/**
 * Execute a Neta search command
 * @param {string} keywords
 * @returns {Promise<Array>}
 */
function runNetaSearch(keywords) {
  return new Promise((resolve, reject) => {
    const token = process.env.NETA_TOKEN;
    if (!token) {
      reject(new Error('NETA_TOKEN environment variable is not set'));
      return;
    }
    const safeKeywords = keywords.replace(/["`$\\]/g, '\\$&');
    const command = `cd ${NETA_CLI_DIR} && NETA_TOKEN="${token}" node bin/cli.js search_character_or_elementum --keywords "${safeKeywords}" --parent_type "character" 2>/dev/null`;

    exec(command, { encoding: 'utf8', timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Neta API execution failed: ${error.message}`));
        return;
      }

      try {
        // Extract JSON portion (pnpm may output extra logs)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.log(`[Neta] No JSON found in stdout: ${stdout.substring(0, 200)}`);
          resolve([]);
          return;
        }

        const result = JSON.parse(jsonMatch[0]);
        resolve(result.list || []);
      } catch (e) {
        console.log(`[Neta] JSON parse failed: ${e.message}`);
        console.log(`[Neta] stdout: ${stdout.substring(0, 500)}`);
        resolve([]);
      }
    });
  });
}

/**
 * Get character details by UUID
 * @param {string} uuid
 * @returns {Promise<Object|null>}
 */
function getCharacterDetails(uuid) {
  return new Promise((resolve, reject) => {
    const token = process.env.NETA_TOKEN;
    if (!token) {
      reject(new Error('NETA_TOKEN environment variable is not set'));
      return;
    }
    const safeUuid = uuid.replace(/["`$\\]/g, '\\$&');
    const command = `cd ${NETA_CLI_DIR} && NETA_TOKEN="${token}" node bin/cli.js request_character_or_elementum --uuid "${safeUuid}"`;

    exec(command, { encoding: 'utf8', timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Neta API details fetch failed: ${error.message}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

/**
 * Generate a flexible list of keyword variants
 * @param {string} characterName
 * @param {string} from - Source work title
 * @returns {string[]}
 */
function generateKeywordsList(characterName, from) {
  const keywordsList = [];

  // Strategy 1: Original name
  keywordsList.push(characterName);

  // Strategy 2: Remove separators (e.g. "Albus·Dumbledore" → "AlbusDumbledore")
  const noSeparator = characterName.replace(/[·\s\-]/g, '');
  if (noSeparator !== characterName) {
    keywordsList.push(noSeparator);
  }

  // Strategy 3: Last part only (e.g. "Albus·Dumbledore" → "Dumbledore")
  const lastName = characterName.split('·').pop();
  if (lastName && lastName !== characterName) {
    keywordsList.push(lastName);
  }

  // Strategy 4: First part only
  const firstName = characterName.split('·')[0];
  if (firstName && firstName !== characterName) {
    keywordsList.push(firstName);
  }

  // Strategy 5: Work title
  const cleanFrom = from.replace(/[《》]/g, '');
  if (cleanFrom) {
    keywordsList.push(cleanFrom);
  }

  // Strategy 6: Character + work combination
  keywordsList.push(`${characterName} ${cleanFrom}`);

  // Strategy 7: Try last name + work (useful for CJK names with separators)
  if (characterName.includes('·')) {
    keywordsList.push(lastName + ' ' + cleanFrom);
  }

  // Deduplicate
  return [...new Set(keywordsList.filter(k => k && k.trim()))];
}

/**
 * Search for a character avatar - Enhanced
 *
 * Tries multiple keyword strategies until a valid avatar is found.
 *
 * @param {string} characterName
 * @param {string} from - Source work title
 * @returns {Promise<{name: string, avatar: string, source: string, keywords: string}|null>}
 */
async function searchCharacter(characterName, from) {
  const keywordsList = generateKeywordsList(characterName, from);

  console.log(`[Neta] Searching: ${characterName} (${from})`);
  console.log(`[Neta] Keyword strategies: ${keywordsList.join(' | ')}`);

  for (const keywords of keywordsList) {
    try {
      console.log(`[Neta] Trying keywords: "${keywords}"`);
      const results = await runNetaSearch(keywords);

      if (results && results.length > 0) {
        const character = results[0];
        const avatarUrl = character.avatar_img || character.avatar || character.image || character.header_img;

        if (avatarUrl) {
          const isValid = await isValidImageUrl(avatarUrl);
          if (isValid) {
            console.log(`[Neta] Found valid avatar: ${character.name || characterName}`);
            console.log(`[Neta] URL: ${avatarUrl}`);
            return {
              name: character.name || characterName,
              avatar: avatarUrl,
              source: 'Neta API',
              keywords: keywords,
            };
          } else {
            console.log(`[Neta] Invalid URL, continuing: ${avatarUrl}`);
          }
        }

        // If UUID available, try fetching details (may contain more images)
        if (character.uuid) {
          try {
            const details = await getCharacterDetails(character.uuid);
            if (details) {
              const detailAvatar = details.avatar_img || details.avatar || details.image;
              if (detailAvatar) {
                const isValid = await isValidImageUrl(detailAvatar);
                if (isValid) {
                  console.log(`[Neta] Found valid avatar from details: ${character.name || characterName}`);
                  console.log(`[Neta] URL: ${detailAvatar}`);
                  return {
                    name: details.name || character.name || characterName,
                    avatar: detailAvatar,
                    source: 'Neta API (details)',
                    keywords: keywords,
                  };
                }
              }
            }
          } catch (e) {
            console.log(`[Neta] Details fetch failed: ${e.message}`);
          }
        }
      }
    } catch (err) {
      console.log(`[Neta] Search failed (${keywords}): ${err.message}`);
    }
  }

  console.log(`[Neta] All keyword strategies failed to find a valid avatar`);
  return null;
}

module.exports = {
  searchCharacter,
  isValidImageUrl,
  generateKeywordsList,
};
