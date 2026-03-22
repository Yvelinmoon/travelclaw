/**
 * 从 remixes_selected.json 随机选择一个未访问的目的地
 * 
 * 用法：
 *   node select-destination.js [visitedId1] [visitedId2] ...
 * 
 * 示例：
 *   node select-destination.js 9972679 9811534 9687334
 * 
 * 输出：
 *   JSON 格式：{ id, name, url, content_tags, tax_paths }
 */

const fs = require('fs');
const path = require('path');

// 解析已访问 ID（从命令行参数）
const visitedIds = process.argv.slice(2).map(id => String(id));

// 读取参考库（相对路径：reference 目录与 scripts 目录同级）
const referencePath = path.join(__dirname, '..', 'reference', 'remixes_selected.json');
const remixes = JSON.parse(fs.readFileSync(referencePath, 'utf-8'));

// 过滤掉已访问的（使用数字 id 匹配）
const available = remixes.filter(item => !visitedIds.includes(String(item.id)));

if (available.length === 0) {
  console.error('ALL_VISITED');
  process.exit(1);
}

// 随机选择一个
const randomIndex = Math.floor(Math.random() * available.length);
const selected = available[randomIndex];

// 输出选中项（JSON 格式）- 使用 id（数字）
console.log(JSON.stringify({
  id: selected.id,
  name: selected.name,
  url: selected.url,
  content_tags: selected.content_tags || [],
  tax_paths: selected.tax_paths || [],
  highlight_tags: selected.highlight_tags || [],
  pgc_tags: selected.pgc_tags || [],
}, null, 2));