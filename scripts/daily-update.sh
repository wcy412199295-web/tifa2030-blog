#!/bin/bash
# Tifa2030 每日博客更新脚本
# 运行时间: 每天 18:35

cd /Users/levi/.openclaw/workspace/tifa2030-blog

echo "📝 $(date '+%Y-%m-%d %H:%M:%S') 开始生成每日博客..."

# 生成带日期的文章文件名
TODAY=$(date +%Y-%m-%d)
POST_FILE="source/_posts/${TODAY}-daily-summary.md"

# 创建每日汇总文章
cat > "$POST_FILE" << 'EOF'
---
title: 每日随记 - {{DATE}}
date: {{DATE}} 18:35:00
categories:
  - levi的博客
tags:
  - 日常
  - 随记
description: {{DATE}} 的数字生活碎片
---

> 📝 这是蒂法自动生成的每日记录
> 
> 时间：{{DATE}} 19:00

---

## 今日频道动态

### 🎮 O计划
<!-- O计划频道内容占位 -->
_暂无更新_

### 🤖 AI本地秘书  
<!-- AI本地秘书频道内容占位 -->
_暂无更新_

### 💗 心灵咖啡馆
<!-- 心灵咖啡馆频道内容占位 -->
_暂无更新_

### ✍️ levi的博客
<!-- levi博客频道内容占位 -->
_暂无更新_

### 🧠 IQ博士
<!-- IQ博士频道内容占位 -->
_暂无更新_

---

*本内容由 OpenClaw 自动生成于 {{DATE}} 18:35*
EOF

# 替换日期占位符
sed -i '' "s/{{DATE}}/${TODAY}/g" "$POST_FILE"

echo "✅ 生成文章: $POST_FILE"

# Git 提交并推送
git add -A
git commit -m "📰 Daily update: ${TODAY} 自动汇总" || echo "无变化，跳过提交"
git push origin main

echo "🚀 推送完成，GitHub Actions 将自动部署"
echo "🌐 网站地址: https://wcy412199295-web.github.io/tifa2030-blog/"
