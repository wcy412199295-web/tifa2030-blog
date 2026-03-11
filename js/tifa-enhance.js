/**
 * Tifa2030 博客功能增强
 * 1. 阅读进度条
 * 2. 站点统计
 * 3. 平滑滚动
 */

(function() {
    'use strict';

    // ========================================
    // 1. 阅读进度条
    // ========================================
    function initReadingProgress() {
        // 只在文章页面显示
        if (!document.querySelector('.post-content')) return;

        // 创建进度条容器
        const container = document.createElement('div');
        container.className = 'reading-progress-container';
        container.innerHTML = '<div class="reading-progress-bar"></div>';
        document.body.appendChild(container);

        const progressBar = container.querySelector('.reading-progress-bar');

        // 监听滚动
        window.addEventListener('scroll', function() {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        }, { passive: true });
    }

    // ========================================
    // 2. 平滑滚动到锚点
    // ========================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ========================================
    // 3. 图片懒加载优化
    // ========================================
    function initLazyLoad() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    // ========================================
    // 4. 导航栏滚动效果
    // ========================================
    function initNavScroll() {
        const nav = document.querySelector('.nav-wrapper');
        if (!nav) return;

        let lastScroll = 0;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            // 添加/移除滚动样式
            if (currentScroll > 100) {
                nav.classList.add('nav-scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
            }
            
            lastScroll = currentScroll;
        }, { passive: true });
    }

    // ========================================
    // 5. 复制代码提示
    // ========================================
    function initCodeCopy() {
        document.querySelectorAll('pre code').forEach(block => {
            const pre = block.parentElement;
            const button = document.createElement('button');
            button.className = 'code-copy-btn';
            button.innerHTML = '<i class="fas fa-copy"></i>';
            button.title = '复制代码';
            
            button.addEventListener('click', function() {
                const code = block.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    button.style.color = '#42B883';
                    setTimeout(() => {
                        button.innerHTML = '<i class="fas fa-copy"></i>';
                        button.style.color = '';
                    }, 2000);
                });
            });
            
            pre.style.position = 'relative';
            pre.appendChild(button);
        });
    }

    // ========================================
    // 初始化
    // ========================================
    document.addEventListener('DOMContentLoaded', function() {
        initReadingProgress();
        initSmoothScroll();
        initLazyLoad();
        initNavScroll();
        initCodeCopy();
        
        console.log('🎮 Tifa2030 博客功能已加载');
    });
})();
