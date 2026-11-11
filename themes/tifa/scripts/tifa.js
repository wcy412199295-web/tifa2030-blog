/* Tifa2030 theme helpers & generators */
'use strict';

const { stripHTML } = require('hexo-util');

const countCache = new Map();

function plainText(html) {
  return stripHTML(html || '').replace(/\s+/g, ' ').trim();
}

function wordCount(post) {
  const key = post.path || post._id;
  if (countCache.has(key)) return countCache.get(key);
  const text = plainText(post.content).replace(/\s/g, '');
  const n = text.length;
  countCache.set(key, n);
  return n;
}

hexo.extend.helper.register('tifa_words', function (post) {
  return wordCount(post);
});

hexo.extend.helper.register('tifa_read_min', function (post) {
  const speed = (this.theme && this.theme.readSpeed) || 400;
  return Math.max(1, Math.round(wordCount(post) / speed));
});

let siteWordsCache = null;
hexo.extend.helper.register('tifa_site_words', function () {
  if (siteWordsCache === null) {
    let sum = 0;
    this.site.posts.forEach(p => { sum += wordCount(p); });
    siteWordsCache = sum;
  }
  return siteWordsCache;
});

hexo.extend.filter.register('before_generate', () => {
  countCache.clear();
  siteWordsCache = null;
});

hexo.extend.helper.register('tifa_excerpt', function (post, len) {
  len = len || 110;
  if (post.description) return post.description;
  const t = plainText(post.excerpt || post.content);
  return t.length > len ? t.slice(0, len) + '…' : t;
});

hexo.extend.helper.register('tifa_first_line', function (post) {
  const t = plainText(post.content);
  const m = t.match(/^[^。！？!?]{4,48}[。！？!?]/);
  return m ? m[0] : t.slice(0, 36) + '…';
});

hexo.extend.helper.register('tifa_first_cat', function (post) {
  if (!post.categories || !post.categories.length) return null;
  const c = post.categories.toArray ? post.categories.toArray()[0] : post.categories[0];
  return c || null;
});

hexo.extend.helper.register('tifa_related', function (post, n) {
  n = n || 3;
  const cats = post.categories ? post.categories.map(c => c.name) : [];
  const tags = post.tags ? post.tags.map(t => t.name) : [];
  const scored = [];
  this.site.posts.forEach(p => {
    if (p.path === post.path) return;
    let s = 0;
    p.categories.forEach(c => { if (cats.includes(c.name)) s += 2; });
    p.tags.forEach(t => { if (tags.includes(t.name)) s += 1; });
    if (s > 0) scored.push({ p, s, d: p.date.valueOf() });
  });
  scored.sort((a, b) => b.s - a.s || b.d - a.d);
  return scored.slice(0, n).map(x => x.p);
});

/* 全站搜索索引：打开搜索框时才懒加载 */
hexo.extend.generator.register('tifa_search', function (locals) {
  const root = this.config.root || '/';
  const data = locals.posts.sort('-date').map(p => {
    const text = plainText(p.content);
    return {
      t: p.title,
      u: root + p.path,
      d: p.date.format('YYYY-MM-DD'),
      c: p.categories.map(c => c.name),
      g: p.tags.map(t => t.name),
      s: p.description || '',
      x: text.slice(0, 2000)
    };
  });
  return { path: 'search.json', data: JSON.stringify(data) };
});
