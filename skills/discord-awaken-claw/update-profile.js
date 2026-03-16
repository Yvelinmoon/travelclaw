const { updateNickname, updateAvatar, searchCharacterImage } = require('./reference/discord-profile.js');

const GUILD_ID = process.env.DISCORD_GUILD_ID || '1480912787814350868';
const CHARACTER = '伏地魔';
const FROM = '哈利·波特';

async function main() {
  console.log('=== 开始更新 Discord 个人资料 ===\n');
  
  // 1. 更新昵称
  console.log('[步骤 1] 更新昵称为：伏地魔');
  try {
    await updateNickname(GUILD_ID, CHARACTER);
    console.log('✅ 昵称更新成功\n');
  } catch (err) {
    console.error('❌ 昵称更新失败:', err.message, '\n');
  }
  
  // 2. 搜索角色头像
  console.log('[步骤 2] 搜索角色头像...');
  try {
    const imageUrl = await searchCharacterImage(CHARACTER, FROM);
    if (imageUrl) {
      console.log('✅ 找到头像 URL:', imageUrl, '\n');
      
      // 3. 更新头像
      console.log('[步骤 3] 更新头像...');
      await updateAvatar(imageUrl);
      console.log('✅ 头像更新成功\n');
    } else {
      console.log('❌ 未找到角色头像\n');
    }
  } catch (err) {
    console.error('❌ 头像搜索/更新失败:', err.message, '\n');
  }
  
  console.log('=== 个人资料更新完成 ===');
}

main().catch(console.error);
