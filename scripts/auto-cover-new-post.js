/**
 * Hexo new 文章钩子
 * 功能：创建新文章后自动从 Unsplash 获取封面图
 */

const { getCoverForPost } = require('./auto-cover');

// 注册 Hexo 钩子
hexo.extend.filter.register('after_post_render', function(data) {
  // 只在新建文章时触发（通过检查 frontmatter 中是否有 img 字段）
  if (!data.img || data.img === '') {
    // 异步获取封面图
    getCoverForPost(data.full_source).catch(err => {
      console.error('自动获取封面图失败:', err.message);
    });
  }
  return data;
});

// 或者使用 after_generate 钩子
hexo.extend.filter.register('after_generate', function() {
  console.log('🎨 如需批量获取封面图，请运行: node scripts/auto-cover.js');
});
