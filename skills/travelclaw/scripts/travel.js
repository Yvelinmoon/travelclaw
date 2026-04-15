 /**
   * neta-gen.js — 混合模式角色图片生成器
   *
   * 支持两种模式：
   * 1. 自由生成：直接传入完整场景描述
   * 2. Collection模板：传入collection_uuid + 注入内容，替换模板中的内容并保留角色信息
   *
   * Usage:
   *   # 自由生成
   *   node neta-gen.js "在海边看日落"
   *
   *   # 使用Collection模板
   *   node neta-gen.js "赛博朋克风格，霓虹灯光，高科技城市" "collection_uuid"
   *
   *   # 带参考图
   *   node neta-gen.js "描述内容" "collection_uuid" "pic_uuid"
   *
   * Note: Character is read from SOUL.md
   */

  import { readFileSync } from 'node:fs';
  import { homedir } from 'node:os';
  import { resolve } from 'node:path';

  // ── Config ──────────────────────────────────────────────────────────────────

  const BASE = '';

  function getToken() {
    if (process.env.NETA_TOKEN) return process.env.NETA_TOKEN;
    const envFiles = [
      resolve(homedir(), '.openclaw/workspace/.env'),
      resolve(homedir(), 'developer/clawhouse/.env'),
    ];
    for (const p of envFiles) {
      try {
        const m = readFileSync(p, 'utf8').match(/NETA_TOKEN=(.+)/);
        if (m) return m[1].trim();
      } catch {}
    }
    throw new Error('NETA_TOKEN not found. Add it to ~/.openclaw/workspace/.env');
  }

  const HEADERS = {
    'x-token': getToken(),
    'x-platform': 'nieta-app/web',
    'content-type': 'application/json',
  };

  async function api(method, path, body) {
    const res = await fetch(BASE + path, {
      method,
      headers: HEADERS,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  const log = msg => process.stderr.write(msg + '\n');
  const out = data => console.log(JSON.stringify(data));

  // ── Skill Matching Helpers ──────────────────────────────────────────────────

  function normalizeKeywordText(input) {
    return String(input || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s,，、/+-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function unique(arr) {
    return [...new Set(arr)];
  }

  function extractKeywords(worldName, sceneName, promptText) {
    const combined = [
      worldName,
      sceneName,
      ...String(promptText || '')
        .split(/[。.!?！？,，;；\n]/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 4),
    ].join(' ');

    const rawTokens = normalizeKeywordText(combined)
      .split(/[\s,，、/]+/)
      .map(w => w.trim())
      .filter(Boolean)
      .filter(w => w.length >= 2);

    const stopwords = new Set([
      'the', 'and', 'with', 'for', 'from', 'into', 'this', 'that',
      'your', 'their', 'then', 'when', 'will', 'have', 'has',
      '在', '进入', '一个', '一种', '以及', '然后', '需要', '使用', '通过', '进行',
    ]);

    const filtered = rawTokens.filter(w => !stopwords.has(w));

    return unique(filtered).slice(0, 8);
  }

  function inferWorldName(sceneName, promptText, injectContent = '') {
    const raw = `${sceneName} ${promptText} ${injectContent}`.toLowerCase();

    if (
      /harry potter|hogwarts|quidditch|snape|flitwick|trelawney|forbidden forest|forbidden section|sorting hat|wizard/i.test(raw) ||
      /哈利波特|霍格沃茨|魁地奇|斯内普|弗利维|特里劳妮|禁林|禁书区|分院帽|魔法/.test(raw)
    ) {
      return 'harry potter';
    }

    if (/cyberpunk|赛博朋克/i.test(raw)) return 'cyberpunk';
    if (/real world|现实世界|shanghai|上海/i.test(raw)) return 'real world';

    return sceneName || 'unknown world';
  }

  async function matchSkills(worldName, sceneName, promptText) {
    const keywords = extractKeywords(worldName, sceneName, promptText);
    if (!keywords.length) return [];

    try {
      const res = await fetch('https://funskill-hub.xiyomi-congito-kant999.workers.dev/api/match-skill', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          world: worldName,
          scene_keywords: keywords,
          limit: 3,
        }),
      });

      if (!res.ok) {
        log(`⚠️ Skill match failed: HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      return Array.isArray(data.matches) ? data.matches : [];
    } catch (e) {
      log(`⚠️ Skill match error: ${e?.message || e}`);
      return [];
    }
  }

  // ── Main: Generate image with character ─────────────────────────────────────

  async function main() {
    const args = process.argv.slice(2);

    let injectContent = '';
    let collectionUuid = null;
    let picUuid = null;

    for (const arg of args) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(arg)) {
        if (!collectionUuid) {
          collectionUuid = arg;
        } else if (!picUuid) {
          picUuid = arg;
        }
      } else {
        injectContent = arg;
      }
    }

    if (!injectContent) {
      process.stderr.write('Usage: node neta-gen.js "<content>" [collection_uuid] [pic_uuid]\n');
      process.stderr.write('\nExamples:\n');
      process.stderr.write('  node neta-gen.js "在海边看日落"\n');
      process.stderr.write('  node neta-gen.js "赛博朋克风格" "collection_uuid"\n');
      process.stderr.write('  node neta-gen.js "描述" "collection_uuid" "pic_uuid"\n');
      process.exit(1);
    }

    // 1. Read character from SOUL.md
    const soulPaths = [
      resolve(homedir(), '.openclaw/workspace/SOUL.md'),
      resolve(homedir(), 'developer/clawhouse/SOUL.md'),
    ];

    let soulContent;
    for (const p of soulPaths) {
      try {
        soulContent = readFileSync(p, 'utf8');
        break;
      } catch {}
    }

    if (!soulContent) {
      throw new Error('SOUL.md not found. Create one first.');
    }

    const charName = soulContent
      .match(/(?:名字|角色名)[^：:\n]*[：:]\s*([^\n*]+)/)?.[1]
      ?.trim()
      ?.replace(/\*+/g, '')
      ?.replace(/[（(][^）)]*[）)]$/, '')
      ?.trim();

    if (!charName) {
      throw new Error('No 名字 or 角色名 field found in SOUL.md');
    }

    // 2. Find character TCP UUID
    const charQuery = charName.replace(/\s*[（(][^）)]*[）)]/g, '').trim();
    const search = await api(
      'GET',
      `/v2/travel/parent-search?keywords=${encodeURIComponent(charQuery)}&parent_type=oc&sort_scheme=best&page_index=0&page_size=5`
    );
    const char = search.list?.find(r => r.type === 'oc' || r.type === 'character');
    log(`🔎 Character: ${char ? `${char.name} (${char.uuid})` : 'Not found, using freetext'}`);

    // 3. Build prompt
    let promptText = '';
    let sceneName = '自由生成';

    if (collectionUuid) {
      log(`📦 Loading collection: ${collectionUuid}`);
      const feedData = await api(
        'GET',
        `/v1/home/feed/interactive?collection_uuid=${collectionUuid}&page_index=0&page_size=1`
      );
      const item = feedData.module_list?.[0];

      if (item) {
        sceneName = item.json_data?.name || 'Collection Scene';
        const cta = item.json_data?.cta_info ?? {};

        let promptTemplate =
          cta.launch_prompt?.core_input ??
          cta.choices?.[0]?.core_input ??
          null;

        if (!promptTemplate && cta.interactive_config?.verse_uuid) {
          const verse = await api('GET', `/v1/verse/preset/${cta.interactive_config.verse_uuid}`).catch(() => null);
          promptTemplate = verse?.launch_prompt?.core_input ?? null;
        }

        if (promptTemplate) {
          const processedTemplate = promptTemplate
            .replace(/\{@character\}/g, charName)
            .replace(/\{角色名称\}|\{角色名\}|（角色名称）/g, charName);

          promptText = `${injectContent}。${processedTemplate}`;
          log(`📝 Template loaded: ${sceneName}`);
          log(`📝 Inject content prepended: ${injectContent.substring(0, 50)}...`);
        } else {
          promptText = `@${charName}, ${injectContent}`;
        }
      } else {
        promptText = `@${charName}, ${injectContent}`;
      }
    } else {
      promptText = `@${charName}, ${injectContent}`;
    }

    if (char) {
      promptText = promptText.replace(new RegExp(`@${charName}[,，\\s]*`, 'g'), '').trim();
    }
    promptText = promptText.replace(/参考图-\S+/g, '').replace(/图片捏-\S+/g, '').trim();

    // 4. Build vtokens
    const vtokens = [];
    if (char) {
      vtokens.push({
        type: 'oc_vtoken_adaptor',
        uuid: char.uuid,
        name: char.name,
        value: char.uuid,
        weight: 1,
      });
    }

    if (promptText) {
      vtokens.push({ type: 'freetext', value: promptText, weight: 1 });
    }

    log(`📝 Final prompt: ${promptText.substring(0, 100)}...`);
    log(`🎨 Generating: ${charName} — ${sceneName}`);

    // 5. Submit image generation
    const taskUuid = await api('POST', '/v3/make_image', {
      storyId: 'DO_NOT_USE',
      jobType: 'universal',
      rawPrompt: vtokens,
      width: 896,
      height: 1152,
      meta: { entrance: 'PICTURE' },
      context_model_series: '8_image_edit',
      inherit_params: {
        ...(collectionUuid ? { collection_uuid: collectionUuid } : {}),
        ...(picUuid ? { picture_uuid: picUuid } : {}),
      },
    });

    const task_uuid = typeof taskUuid === 'string' ? taskUuid : taskUuid?.task_uuid;
    log(`⏳ task: ${task_uuid}`);

    // 6. Poll every 500ms (max 3 min)
    let warnedSlow = false;
    for (let i = 0; i < 360; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (!warnedSlow && i >= 60) {
        log('⏳ Taking longer, almost there...');
        warnedSlow = true;
      }

      const result = await api('GET', `/v1/artifact/task/${task_uuid}`);
      if (result.task_status !== 'PENDING' && result.task_status !== 'MODERATION') {
        if (result.task_status !== 'SUCCESS') {
          log(`⚠️ Failed: ${result.task_status}`);
        }

        const worldName = inferWorldName(sceneName, promptText, injectContent);
        const matchedSkills =
          result.task_status === 'SUCCESS'
            ? await matchSkills(worldName, sceneName, promptText)
            : [];

        out({
          char_name: char?.name || charName,
          world: worldName,
          scene: sceneName,
          task_uuid,
          status: result.task_status,
          url: result.artifacts?.[0]?.url ?? null,
          collection_uuid: collectionUuid,
          skill_match_query: {
            world: worldName,
            scene_keywords: extractKeywords(worldName, sceneName, promptText),
          },
          matched_skills: matchedSkills,
        });
        process.exit(0);
      }
    }

    const worldName = inferWorldName(sceneName, promptText, injectContent);
    out({
      char_name: charName,
      world: worldName,
      scene: sceneName,
      task_uuid,
      status: 'TIMEOUT',
      url: null,
      collection_uuid: collectionUuid,
      skill_match_query: {
        world: worldName,
        scene_keywords: extractKeywords(worldName, sceneName, promptText),
      },
      matched_skills: [],
    });
  }

  main().catch(err => {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  });
