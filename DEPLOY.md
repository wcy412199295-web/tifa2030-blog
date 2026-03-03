# 🚀 Tifa2030 博客部署指南

## 方案一：GitHub Actions 自动部署（推荐）

### 步骤

1. **在 GitHub 创建两个仓库**
   - `levi1943/tifa2030-blog` - 存放博客源代码
   - `levi1943/tifa2030.github.io` - GitHub Pages 部署仓库

2. **推送源代码**
   ```bash
   cd /Users/levi/.openclaw/workspace/tifa2030-blog
   git remote add origin https://github.com/levi1943/tifa2030-blog.git
   git push -u origin main
   ```

3. **启用 GitHub Pages**
   - 进入 `levi1943/tifa2030.github.io` 仓库
   - Settings → Pages → Source 选择 "Deploy from a branch"
   - Branch 选择 "gh-pages" (由 GitHub Actions 自动创建)

4. **配置自定义域名**
   - 在域名服务商添加 CNAME 记录：
     - 主机记录: `@`
     - 记录值: `levi1943.github.io`
   - 在 GitHub Pages 设置中添加域名 `tifa2030.me`
   - 勾选 "Enforce HTTPS"

### 后续更新

每当你推送代码到 `main` 分支，GitHub Actions 会自动构建并部署！

---

## 方案二：本地手动部署

### 步骤

1. **创建 GitHub Pages 仓库**
   - 在 GitHub 创建 `levi1943/tifa2030.github.io` 仓库

2. **配置 Git 凭据**
   ```bash
   # 配置 git 缓存凭据
   git config --global credential.helper osxkeychain
   ```

3. **运行部署脚本**
   ```bash
   cd /Users/levi/.openclaw/workspace/tifa2030-blog
   ./deploy.sh
   ```
   或手动：
   ```bash
   hexo clean
   hexo generate
   hexo deploy
   ```

4. **输入 GitHub 凭据**
   - 首次部署时需要输入 GitHub 用户名和密码
   - 密码使用 Personal Access Token（不是登录密码）

---

## 生成 GitHub Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成后复制 token（只显示一次）
5. 部署时用这个 token 作为密码

---

## 部署后验证

### 检查网站是否上线

```bash
# 等待 2-3 分钟后检查
curl -I https://levi1943.github.io/tifa2030.github.io
```

### 常见问题

**Q: 网站显示 404？**
- 检查 GitHub Pages 是否已启用
- 确认仓库名正确：`levi1943.github.io`（不是 tifa2030.github.io）

**Q: 样式没有加载？**
- 检查 `_config.yml` 中的 `url` 配置是否正确
- 确保使用 `https://` 而不是 `http://`

**Q: 自定义域名不生效？**
- DNS 传播需要时间（5分钟-48小时）
- 检查 CNAME 记录是否正确
- 确认 GitHub Pages 设置中已添加域名

---

## 域名 DNS 配置示例

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| CNAME | @ | levi1943.github.io |
| CNAME | www | levi1943.github.io |

---

## 每日自动更新计划

后续将配置 OpenClaw 自动：
1. 每日 23:00 汇总 Discord 频道内容
2. 自动生成博客文章
3. 推送到 GitHub
4. 自动部署更新

---

*配置遇到问题？在 Discord @蒂法 获取帮助*
