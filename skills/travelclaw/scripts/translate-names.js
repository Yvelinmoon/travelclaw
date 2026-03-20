/**
 * 完整翻译 remixes_selected.json 所有 name 字段
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'reference', 'remixes_selected.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// 完整的英文翻译映射（捏捏 = NETA）
const translations = [
  '[NETA Pioneers] Worldview Currency (See Details)',
  '[NETA Pioneers] Let\'s Divinate',
  '[OC Interactive] Make Your OC an In-Game Character!',
  'Click Photo for Surprise / Happy Valentine\'s Day',
  '[NETA Pioneers] Trash Can',
  '[NETA Pioneers] Web Advanced Generation (Desktop)',
  '[NETA Pioneers] Character Monthly Schedule',
  '[NETA Pioneers] How to Have a Worldview Menu',
  '[NETA Pioneers] Generate Your Home Daily Life~',
  '[NETA Pioneers] Workstation',
  '[NETA Pioneers] February Calendar',
  '[NETA Pioneers] Generate Your Exclusive Impression Dress!',
  '[NETA Pioneers] Get Your Worldview Collage Food Map',
  '[NETA Pioneers] My Residence, My Design',
  '[NETA Pioneers] Mix a Character-Exclusive Drink~',
  '[NETA Pioneers] Install Surveillance in Character\'s Home',
  'Kite 🪁',
  '[NETA Pioneers] Generate Waiting-to-Meet Scene',
  '[NETA Pioneers] My Dorm Life',
  '[NETA Pioneers] 🐴New Year Prayer🐴',
  '[NETA Pioneers] Dynamic Street Style',
  '[NETA Pioneers] Career Experience~',
  '[NETA Pioneers] Fairy Tale',
  '[NETA Pioneers] What\'s in the Bento Box~',
  '[NETA Pioneers] When Your OC Posts on Moments',
  '[NETA Pioneers] Transform into Animal for Forest Ball',
  '[NETA Pioneers] Today\'s Character-Exclusive Dessert',
  '[NETA Pioneers] Generate Year of Horse Exclusive Bedroom',
  '[NETA Pioneers] Cross Mountains and Rivers',
  '[NETA Pioneers] Psychological Profile',
  '[NETA Pioneers] Let Your Character Travel',
  '[NETA Pioneers] Dreamcore',
  '[NETA Pioneers] Generate Character-Exclusive Symbol',
  '[NETA Pioneers] Character Concept Journal',
  '[NETA Pioneers] Character Vending Machine!',
  '[NETA Pioneers] Medical Report',
  '[NETA Pioneers] Unlock Character\'s Miniature World',
  '[NETA Pioneers] Character-Exclusive Lantern',
  '[NETA Pioneers] Stumbled Upon Your Own Merch Shop?!',
  '[NETA Pioneers] Character-Exclusive Capsule Pod',
  '[NETA Pioneers] Don\'t Die 😭😭',
  '[NETA Pioneers] Travel with Character Clear Cards!',
  '[NETA Pioneers] OC Exclusive Pilgrimage!',
  '[NETA Pioneers] Theme Ecosystem',
  '[NETA Pioneers] Check OC\'s Phone Browsing History',
  '[NETA Pioneers] Outing Plan',
  '[NETA Pioneers] Character\'s World',
  '[Element Trial][NETA Pioneers] Abstract Graffiti',
  '[NETA Pioneers] Street Corner Candy Burst',
  '[NETA Pioneers] Turn Off Filters',
  '[NETA Pioneers] Bath Time',
  '[NETA Pioneers] My Little Nest',
  '[NETA Pioneers] Customize Your Impression Sword~',
  '[NETA Pioneers] Daily Photo Wall',
  '[NETA Pioneers] I\'ve Drunk This Since Childhood',
  '[NETA Pioneers] Online Class Status',
  '[NETA Pioneers] Generate Your Shopping Daily',
  '[NETA Pioneers] Explore Box Garden Maze',
  '[NETA Pioneers] Generate Your Exclusive Coffee',
  '[NETA Pioneers] Get a Fortune for New Year?',
  '[NETA Pioneers] Perler Beads Not Ironed Yet',
  '[NETA Pioneers] Character Story/Scene Visualization!',
  '[NETA Pioneers] Wine of the Soul',
  '[NETA Pioneers] Narcissus',
  '[NETA Pioneers] Character-Exclusive Eco Jar',
  '[NETA Pioneers] Variety Show Live',
  '[NETA Pioneers] What Pretty Clothes in Character\'s Closet',
  '[NETA Pioneers] Composition Paper (Click for Surprise)',
  '[NETA Pioneers] Character Hexagon Chart',
  'Character-Exclusive Stage Performance Look~',
  '[NETA Pioneers] Character-Exclusive Secret Recipe Manuscript',
  '[NETA Pioneers] Bathroom Scene',
  '[NETA Pioneers] Waking Up',
  '[NETA Pioneers] Catch Character Plushie',
  '[NETA Pioneers] Character\'s Sports Report',
  '[NETA Pioneers] Love You Lao Ji, See You Tomorrow',
  'The Present You Have is the Past Countless People Can\'t Return To',
];

// 应用翻译
data.forEach((item, index) => {
  if (translations[index]) {
    const original = item.name;
    item.name = translations[index];
    console.log(`${index + 1}. ${original.substring(0, 50)}...`);
    console.log(`   → ${item.name}`);
  }
});

// 写回文件
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

console.log(`\n✅ 完成！共翻译 ${data.length} 条目`);
console.log(`文件已保存：${filePath}`);
