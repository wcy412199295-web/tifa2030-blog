/* Tifa2030 · 2026-11 改版交互脚本（零依赖） */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var lockCount = 0;
  function lock(on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    d.body.style.overflow = lockCount ? 'hidden' : '';
  }
  function toast(msg) {
    var t = d.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:90;background:var(--ink);color:var(--paper);padding:10px 18px;border-radius:999px;font-size:14px;box-shadow:var(--shadow-2);transition:opacity .3s';
    d.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; }, 1600);
    setTimeout(function () { t.remove(); }, 2000);
  }

  /* ---------- 头部滚动态 + 回顶 + 阅读进度（单个 rAF 循环） ---------- */
  var header = $('#siteHeader'), toTop = $('#toTop'), bar = $('#progress'), prose = $('#prose');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || html.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.classList.toggle('is-show', y > 600);
    if (bar && prose) {
      var start = prose.getBoundingClientRect().top + y - 80;
      var end = start + prose.offsetHeight - window.innerHeight + 160;
      var p = Math.min(1, Math.max(0, (y - start) / Math.max(1, end - start)));
      bar.style.transform = 'scaleX(' + p + ')';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- 深浅色 ---------- */
  var themeBtn = $('#themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    store.set('tifa-theme', next);
    var tk = $('#tcomments');
    if (tk) tk.setAttribute('data-theme', next);
  });

  /* ---------- 移动端菜单 ---------- */
  var drawer = $('#drawer'), menuBtn = $('#menuBtn');
  function drawerToggle(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    lock(open);
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { drawerToggle(true); });
  $$('[data-drawer-close]').forEach(function (el) { el.addEventListener('click', function () { drawerToggle(false); }); });

  /* ---------- 搜索索引（懒加载，一次） ---------- */
  var searchEl = $('#search'), indexP = null;
  function loadIndex() {
    if (!indexP) {
      indexP = fetch(searchEl ? searchEl.getAttribute('data-index') : '/search.json')
        .then(function (r) { return r.json(); })
        .catch(function () { indexP = null; return []; });
    }
    return indexP;
  }

  /* ---------- 随手翻一篇 ---------- */
  var rnd = $('#randomPost');
  if (rnd) rnd.addEventListener('click', function () {
    loadIndex().then(function (list) {
      if (!list.length) return;
      var cur = location.pathname, pick;
      do { pick = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && pick.u === cur);
      location.href = pick.u;
    });
  });

  /* ---------- ⌘K 全站搜索 ---------- */
  if (searchEl) {
    var input = $('#searchInput'), out = $('#searchResults'), active = 0, hits = [];
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var reEsc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
    var openSearch = function () {
      if (searchEl.classList.contains('is-open')) return;
      drawerToggle(false);
      searchEl.classList.add('is-open'); lock(true);
      setTimeout(function () { input.focus(); input.select(); }, 20);
      loadIndex();
    };
    var closeSearch = function () {
      if (!searchEl.classList.contains('is-open')) return;
      searchEl.classList.remove('is-open'); lock(false);
    };
    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', openSearch); });
    $$('[data-search-close]').forEach(function (b) { b.addEventListener('click', closeSearch); });
    d.addEventListener('keydown', function (e) {
      var k = e.key;
      if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K')) { e.preventDefault(); searchEl.classList.contains('is-open') ? closeSearch() : openSearch(); return; }
      if (k === '/' && !/INPUT|TEXTAREA|SELECT/.test((d.activeElement || {}).tagName || '') && !(d.activeElement || {}).isContentEditable) { e.preventDefault(); openSearch(); return; }
      if (k === 'Escape') { closeSearch(); drawerToggle(false); sheetToggle(false); lbClose(); }
    });
    var render = function () {
      var links = $$('a', out);
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
      if (links[active]) links[active].scrollIntoView({ block: 'nearest' });
    };
    var run = function () {
      var q = input.value.trim();
      if (!q) { out.innerHTML = '<div class="search-empty">输入关键词，在全部文章里找找看</div>'; hits = []; return; }
      loadIndex().then(function (list) {
        if (input.value.trim() !== q) return;
        var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        hits = [];
        list.forEach(function (p) {
          var title = p.t.toLowerCase(), meta = (p.c.concat(p.g).join(' ') + ' ' + p.s).toLowerCase(), body = p.x.toLowerCase();
          var score = 0, ok = terms.every(function (t) {
            var s = 0;
            if (title.indexOf(t) > -1) s += 10;
            if (meta.indexOf(t) > -1) s += 4;
            if (body.indexOf(t) > -1) s += 1;
            score += s; return s > 0;
          });
          if (ok) hits.push({ p: p, s: score });
        });
        hits.sort(function (a, b) { return b.s - a.s || (a.p.d < b.p.d ? 1 : -1); });
        hits = hits.slice(0, 30);
        active = 0;
        if (!hits.length) { out.innerHTML = '<div class="search-empty">没有找到「' + esc(q) + '」相关的文章，换个词试试？</div>'; return; }
        var re = new RegExp('(' + terms.map(reEsc).join('|') + ')', 'gi');
        var mark = function (s) { return esc(s).replace(re, '<mark>$1</mark>'); };
        out.innerHTML = hits.map(function (h) {
          var p = h.p, src = p.s || p.x, low = src.toLowerCase(), pos = -1;
          terms.some(function (t) { pos = low.indexOf(t); return pos > -1; });
          if (pos < 0 && p.s) { src = p.x; low = src.toLowerCase(); terms.some(function (t) { pos = low.indexOf(t); return pos > -1; }); }
          var from = Math.max(0, pos - 30), snip = (from > 0 ? '…' : '') + src.slice(from, from + 110);
          return '<a href="' + esc(p.u) + '"><div class="st">' + mark(p.t) + '</div><div class="sm">' + esc(p.d) + (p.c.length ? ' · ' + esc(p.c[0]) : '') + '</div><div class="sx">' + mark(snip) + '</div></a>';
        }).join('');
        render();
      });
    };
    var timer;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 80); });
    input.addEventListener('keydown', function (e) {
      if (!hits.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % hits.length; render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + hits.length) % hits.length; render(); }
      else if (e.key === 'Enter') { e.preventDefault(); location.href = hits[active].p.u; }
    });
  }

  /* ---------- 渐入 ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- 运行天数 ---------- */
  var rd = $('#runDays');
  if (rd) {
    var days = Math.max(1, Math.floor((Date.now() - new Date(rd.getAttribute('data-since') + 'T00:00:00+08:00').getTime()) / 864e5));
    rd.textContent = days;
    $$('.js-days').forEach(function (el) { el.textContent = days; });
  }

  /* ---------- 首页数字滚动 ---------- */
  $$('[data-count]').forEach(function (el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-dec') || 0), t0 = null;
    if (!to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var step = function (ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / 900), v = to * (1 - Math.pow(1 - k, 3));
      el.textContent = v.toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  /* ---------- 文章页：目录 ---------- */
  var tocEl = $('#toc'), tocM = $('#tocMobile'), sheet = $('#tocSheet');
  function sheetToggle(open) {
    if (!sheet) return;
    if (open === sheet.classList.contains('is-open')) return;
    sheet.classList.toggle('is-open', open);
    sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
    lock(open);
  }
  if (prose && tocEl) {
    var heads = $$('h2, h3', prose);
    if (heads.length >= 2) {
      var listHtml = '<div class="toc-title">目录</div><ol>' + heads.map(function (h, i) {
        if (!h.id) h.id = 'h-' + i;
        return '<li class="lv' + h.tagName.charAt(1) + '"><a href="#' + encodeURIComponent(h.id) + '" data-i="' + i + '">' + h.textContent.replace(/[<>&]/g, '') + '</a></li>';
      }).join('') + '</ol>';
      tocEl.innerHTML = listHtml;
      if (tocM) tocM.innerHTML = listHtml;
      var links = $$('a', tocEl).concat(tocM ? $$('a', tocM) : []);
      links.forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var h = heads[+a.getAttribute('data-i')];
          sheetToggle(false);
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + encodeURIComponent(h.id));
        });
      });
      var setActive = function () {
        var y = window.innerHeight * 0.3, cur = 0;
        heads.forEach(function (h, i) { if (h.getBoundingClientRect().top < y) cur = i; });
        if (window.innerHeight + (window.scrollY || html.scrollTop) >= d.documentElement.scrollHeight - 4 - (d.querySelector('.post-foot') ? d.querySelector('.post-foot').offsetHeight : 0)) cur = heads.length - 1;
        links.forEach(function (a) { a.classList.toggle('is-active', +a.getAttribute('data-i') === cur); });
      };
      var tt = false;
      window.addEventListener('scroll', function () { if (!tt) { tt = true; requestAnimationFrame(function () { setActive(); tt = false; }); } }, { passive: true });
      setActive();
    } else {
      tocEl.remove();
      var tb = $('#tocBtn'); if (tb) tb.classList.remove('has-toc');
    }
  }
  var tocBtn = $('#tocBtn');
  if (tocBtn) tocBtn.addEventListener('click', function () { sheetToggle(true); });
  $$('[data-sheet-close]').forEach(function (el) { el.addEventListener('click', function () { sheetToggle(false); }); });

  /* ---------- 字号调节：16 → 17 → 18 → 19 循环 ---------- */
  var fsBtn = $('#fsBtn');
  if (fsBtn) fsBtn.addEventListener('click', function () {
    var sizes = [16, 17, 18, 19];
    var cur = parseInt(getComputedStyle(html).getPropertyValue('--prose-size'), 10) || 17;
    var next = sizes[(sizes.indexOf(cur) + 1) % sizes.length];
    html.style.setProperty('--prose-size', next + 'px');
    store.set('tifa-fs', next);
    toast('正文字号 ' + next + 'px');
  });

  /* ---------- 代码复制 ---------- */
  $$('figure.highlight').forEach(function (fig) {
    var b = d.createElement('button');
    b.className = 'copy-btn'; b.type = 'button'; b.textContent = '复制';
    b.addEventListener('click', function () {
      var code = $('td.code', fig) || $('pre', fig) || fig;
      var text = $$('.line', code).length ? $$('.line', code).map(function (l) { return l.textContent; }).join('\n') : code.innerText;
      copy(text, function () { b.textContent = '已复制'; setTimeout(function () { b.textContent = '复制'; }, 1500); });
    });
    fig.appendChild(b);
  });
  function copy(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = d.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      d.body.appendChild(ta); ta.select();
      try { d.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  }

  /* ---------- 分享 / 赞赏 ---------- */
  var cl = $('#copyLink');
  if (cl) cl.addEventListener('click', function () {
    copy(d.title.split(' | ')[0] + ' ' + location.origin + location.pathname, function () { toast('链接已复制，去分享吧'); });
  });
  var rb = $('#rewardBtn'), rp = $('#rewardPanel');
  if (rb && rp) rb.addEventListener('click', function () {
    var open = !rp.classList.contains('is-open');
    rp.classList.toggle('is-open', open);
    rb.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- 图片灯箱 ---------- */
  var lb = $('#lightbox');
  function lbClose() { if (lb && lb.classList.contains('is-open')) { lb.classList.remove('is-open'); lock(false); } }
  if (lb && prose) {
    $$('img', prose).forEach(function (img) {
      if (img.closest('a')) return;
      img.loading = img.loading || 'lazy';
      img.addEventListener('click', function () {
        $('img', lb).src = img.currentSrc || img.src;
        lb.classList.add('is-open'); lock(true);
      });
    });
    lb.addEventListener('click', lbClose);
  }

  /* ---------- 评论：滚动接近时才加载 twikoo（≈500KB） ---------- */
  var tk = $('#tcomments');
  if (tk) {
    var loaded = false;
    var loadTk = function () {
      if (loaded) return; loaded = true;
      var s = d.createElement('script');
      s.src = tk.getAttribute('data-src');
      s.onload = function () {
        tk.innerHTML = '';
        var opt = { envId: tk.getAttribute('data-env'), el: '#tcomments' };
        if (tk.getAttribute('data-region')) opt.region = tk.getAttribute('data-region');
        window.twikoo.init(opt).catch(function () {
          tk.innerHTML = '<div class="comments-placeholder">评论服务暂时没连上，稍后再来看看吧</div>';
        });
      };
      s.onerror = function () { tk.innerHTML = '<div class="comments-placeholder">评论组件加载失败，刷新试试</div>'; };
      d.body.appendChild(s);
    };
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { loadTk(); tio.disconnect(); } }, { rootMargin: '600px 0px' });
      tio.observe(tk);
    } else loadTk();
    if (location.hash && /comment|twikoo|tk-/i.test(location.hash)) loadTk();
  }

  /* ---------- 悬停预取站内链接，点开更快 ---------- */
  var prefetched = {};
  d.addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.origin !== location.origin || a.pathname === location.pathname || prefetched[a.pathname]) return;
    if (/\.(jpg|png|webp|gif|json|xml|zip)$/i.test(a.pathname)) return;
    prefetched[a.pathname] = 1;
    var l = d.createElement('link'); l.rel = 'prefetch'; l.href = a.href; d.head.appendChild(l);
  }, { passive: true });
})();
