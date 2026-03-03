# Giscus 评论系统配置指南

## 什么是 Giscus？

Giscus 是一个基于 GitHub Discussions 的评论系统，免费、无广告、无需服务器。

## 配置步骤

### 1. 启用仓库 Discussions

访问：https://github.com/wcy412199295-web/tifa2030-blog/settings

- 向下滚动找到 "Features" 部分
- 勾选 **Discussions**
- 点击 Save

### 2. 获取配置参数

访问 Giscus 配置页面：https://giscus.app/zh-CN

填写以下信息：
- **仓库**: wcy412199295-web/tifa2030-blog
- **页面 ↔️ Discussion 映射关系**: 路径
- **Discussion 分类**: Announcements
- **主题**: 浅色主题 (或者根据你的喜好选择)
- **语言**: 简体中文

点击 "生成" 后，你会得到一段代码，里面有：
- `data-repo-id` 
- `data-category-id`

### 3. 更新配置

复制这两个 ID，填入 `_config.matery.yml`：

```yaml
comments:
  enable: true
  type: giscus
  giscus:
    repo: wcy412199295-web/tifa2030-blog
    repoId: 'YOUR_REPO_ID_HERE'
    category: Announcements
    categoryId: 'YOUR_CATEGORY_ID_HERE'
```

### 4. 重新部署

```bash
git add -A
git commit -m "启用 Giscus 评论系统"
git push origin main
```

## 完成！

现在每篇文章底部都会显示评论框。
