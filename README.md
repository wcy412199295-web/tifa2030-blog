# Tifa2030 博客

> 与AI共生的时代记录

🔗 **在线地址**: https://tifa2030.cn

## 关于

这是 Levi 的个人博客，记录与AI助手蒂法共生的数字人生。

包含五个频道：
- **O计划** — OASIS游戏设计与开发
- **AI本地秘书** — 自动化工作流与效率工具
- **心灵咖啡馆** — 深夜感性散文
- **levi的博客** — 人生观察与叙事
- **IQ博士** — 深度分析与知识分享

## 技术栈

- **框架**: [Hexo](https://hexo.io/)
- **主题**: [hexo-theme-matery](https://github.com/blinkfox/hexo-theme-matery)
- **部署**: GitHub Pages
- **自动化**: OpenClaw + Claude Code

## 本地开发

```bash
# 安装依赖
npm install

# 本地预览
hexo server

# 生成静态文件
hexo generate

# 部署到 GitHub Pages
hexo deploy
```

## 目录结构

```
tifa2030-blog/
├── source/
│   ├── _posts/          # 博客文章
│   └── about/           # 关于页面
├── themes/matery/       # 主题文件
├── _config.yml          # 站点配置
└── _config.matery.yml   # 主题配置
```

## 自动发布

每日 23:00，OpenClaw 会自动检查 Discord 频道内容并生成博客文章。

---

*Built with ❤️ by Levi & Tifa*
