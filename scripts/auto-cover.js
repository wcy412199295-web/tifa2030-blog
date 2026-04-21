/**
 * Hexo 自动封面图插件
 * 功能：根据文章标题从 Unsplash 自动获取匹配图片作为封面
 * 用法：
 *   1. hexo new "文章标题" → 自动获取封面
 *   2. node scripts/auto-cover.js → 批量处理已有文章
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Unsplash API 配置
const UNSPLASH_ACCESS_KEY = 'fuc8B_gWYfMUKCwD_q3jRyuXArZ-nbBMHu7PCR7ESeA';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

// 封面图配置
const COVER_DIR = path.join(__dirname, '..', 'source', 'medias', 'covers');
const COVER_WIDTH = 1264;
const COVER_HEIGHT = 848;

// 关键词映射表（用于优化搜索）
// 注意：顺序很重要，更具体的匹配应该放在前面
const KEYWORD_MAP = {
  // 特定文章匹配（最优先）
  '数字迁徙': 'digital technology migration journey',
  '算法沉思': 'algorithm code programming thinking',
  '蚂蚁的民主': 'ant colony nature democracy',
  '周日休息': 'rest relax peaceful weekend',
  '时间炼金术': 'time clock hourglass magic',
  '大脑联觉': 'synesthesia colorful abstract brain',
  '侘寂之美': 'wabi sabi japanese aesthetic',
  '漂流者的心理地理学': 'city urban exploration psychology',
  '候鸟的体内指南针': 'migratory birds nature compass',
  '阴影的艺术与心理': 'shadow light contrast psychology art',
  '周一重启仪式': 'monday restart morning routine',
  
  // 通用主题匹配
  'OASIS': 'metaverse futuristic virtual world',
  'O计划': 'game development metaverse',
  '破茧': 'butterfly transformation growth',
  'AI': 'artificial intelligence technology',
  '蒂法': 'anime character digital assistant',
  'OpenClaw': 'automation workflow technology',
  'Unity': 'game engine 3d development',
  '游戏': 'video game design',
  '博客': 'blog writing creative',
  '教程': 'tutorial education learning',
  '飞书': 'collaboration workspace',
  'NPC': 'game character artificial intelligence',
  '战斗': 'battle combat game',
  '叙事': 'storytelling narrative book',
  '世界观': 'fantasy world building',
  '多智能体': 'multi agent swarm intelligence',
  '自动化': 'automation robot workflow',
  '心理': 'psychology mind brain',
  '时间': 'time clock hourglass',
  '声音': 'sound voice audio',
  '像素': 'pixel art retro game',
  '办公室': 'office workspace desk',
  '迁移': 'migration moving journey',
  '休息': 'rest relax peaceful',
  '算法': 'algorithm code programming',
  '数字': 'digital technology future',
  '蚂蚁': 'ant colony nature',
  '阴影': 'shadow light contrast',
  '侘寂': 'wabi sabi japanese aesthetic',
  '联觉': 'synesthesia colorful abstract',
  '候鸟': 'migratory birds nature',
  '心理地理学': 'city urban exploration',
  '技能': 'skill learning development',
};

/**
 * 从标题提取搜索关键词
 */
function extractKeywords(title) {
  // 先尝试匹配映射表
  for (const [key, value] of Object.entries(KEYWORD_MAP)) {
    if (title.includes(key)) {
      return value;
    }
  }
  
  // 如果没有匹配，提取标题中的中文/英文关键词
  // 移除常见停用词
  const stopWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '从', '让', '给', '把', '被', '比', '当', '而', '及', '与', '或', '但', '如果', '因为', '所以', '虽然', '然而', '因此', '并且', '或者', '还是', '要么', '假如', '假设', '即使', '尽管', '不管', '不论', '无论', '只要', '只有', '除非', '除了', '关于', '对于', '由于', '根据', '按照', '通过', '经过', '随着', '向着', '朝着', '沿着', '顺着', '为了', '为着', '作为', '成为', '变成', '显得', '看起来', '听起来', '闻起来', '尝起来', '感觉起来', '变得', '变得', '保持', '继续', '仍然', '依然', '依旧', '还是', '总是', '经常', '常常', '往往', '通常', '一般', '大概', '也许', '可能', '或许', '恐怕', '似乎', '好像', '仿佛', '如同', '犹如', '像是', '似的', '一样', '一般', '似的', '的话', '来说', '而言', '来说', '来讲', '来说', '来看', '来说', '来说'];
  
  let keywords = title;
  stopWords.forEach(word => {
    keywords = keywords.replace(new RegExp(word, 'g'), ' ');
  });
  
  // 清理多余空格和标点
  keywords = keywords.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 如果清理后太短，返回原始标题的英文翻译（简化版）
  if (keywords.length < 3) {
    return 'technology future creative';
  }
  
  return keywords;
}

/**
 * 从 Unsplash 搜索图片
 */
async function searchUnsplash(query) {
  return new Promise((resolve, reject) => {
    const searchParams = new URLSearchParams({
      query: query,
      per_page: '5',
      orientation: 'landscape',
      client_id: UNSPLASH_ACCESS_KEY
    });
    
    const url = `${UNSPLASH_API_URL}?${searchParams.toString()}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            // 随机选择一张图片（增加多样性）
            const randomIndex = Math.floor(Math.random() * Math.min(3, json.results.length));
            resolve(json.results[randomIndex]);
          } else {
            reject(new Error('No images found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 下载图片
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // 跟随重定向
        https.get(res.headers.location, (res2) => {
          const file = fs.createWriteStream(filepath);
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filepath);
          });
        }).on('error', reject);
      } else {
        const file = fs.createWriteStream(filepath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filepath);
        });
      }
    }).on('error', reject);
  });
}

/**
 * 转换图片为 webp
 */
function convertToWebp(inputPath, outputPath) {
  try {
    execSync(`cwebp -q 85 "${inputPath}" -o "${outputPath}"`, { stdio: 'ignore' });
    fs.unlinkSync(inputPath);
    return true;
  } catch (e) {
    console.error('webp conversion failed:', e.message);
    // 如果转换失败，保留原图
    fs.renameSync(inputPath, outputPath.replace('.webp', '.jpg'));
    return false;
  }
}

/**
 * 为单篇文章获取封面图
 */
async function getCoverForPost(postPath) {
  const content = fs.readFileSync(postPath, 'utf8');
  
  // 检查是否已有 img 字段
  if (content.match(/^img:\s*\S+/m)) {
    console.log(`  ⏭️ 已有封面图: ${path.basename(postPath)}`);
    return null;
  }
  
  // 提取标题
  const titleMatch = content.match(/^title:\s*(.+)$/m);
  if (!titleMatch) {
    console.log(`  ⚠️ 无标题: ${path.basename(postPath)}`);
    return null;
  }
  
  const title = titleMatch[1].replace(/["']/g, '').trim();
  console.log(`  📷 处理: ${title}`);
  
  // 提取关键词
  const keywords = extractKeywords(title);
  console.log(`     关键词: ${keywords}`);
  
  try {
    // 搜索 Unsplash
    const photo = await searchUnsplash(keywords);
    const imageUrl = photo.urls.regular;
    
    // 生成文件名
    const basename = path.basename(postPath, '.md');
    const tempPath = path.join(COVER_DIR, `${basename}.jpg`);
    const webpPath = path.join(COVER_DIR, `${basename}.webp`);
    
    // 确保目录存在
    if (!fs.existsSync(COVER_DIR)) {
      fs.mkdirSync(COVER_DIR, { recursive: true });
    }
    
    // 下载图片
    await downloadImage(imageUrl, tempPath);
    console.log(`     ✅ 下载成功`);
    
    // 转换为 webp
    convertToWebp(tempPath, webpPath);
    console.log(`     ✅ 转换完成`);
    
    // 更新文章 frontmatter
    const newContent = content.replace(
      /^(title:.+)$/m,
      `$1\nimg: /medias/covers/${basename}.webp`
    );
    fs.writeFileSync(postPath, newContent);
    console.log(`     ✅ 已更新文章`);
    
    return webpPath;
  } catch (e) {
    console.error(`     ❌ 失败: ${e.message}`);
    return null;
  }
}

/**
 * 批量处理所有文章
 */
async function processAllPosts() {
  const postsDir = path.join(__dirname, '..', 'source', '_posts');
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  
  console.log(`\n🎨 开始批量获取封面图，共 ${files.length} 篇文章...\n`);
  
  let success = 0;
  let skip = 0;
  let fail = 0;
  
  for (const file of files) {
    const postPath = path.join(postsDir, file);
    const result = await getCoverForPost(postPath);
    
    if (result) {
      success++;
    } else if (result === null) {
      const content = fs.readFileSync(postPath, 'utf8');
      if (content.match(/^img:\s*\S+/m)) {
        skip++;
      } else {
        fail++;
      }
    }
    
    // 避免触发 API 频率限制（每秒 1 次）
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n📊 完成！成功: ${success}, 跳过: ${skip}, 失败: ${fail}`);
}

/**
 * 处理单篇文章（用于 hexo new 钩子）
 */
async function processSinglePost(postPath) {
  console.log(`\n🎨 自动获取封面图...`);
  await getCoverForPost(postPath);
}

// 导出函数供 Hexo 使用
module.exports = {
  processAllPosts,
  processSinglePost,
  getCoverForPost
};

// 如果直接运行此脚本，执行批量处理
if (require.main === module) {
  processAllPosts().catch(console.error);
}
