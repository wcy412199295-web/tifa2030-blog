#!/bin/bash
# Tifa2030 博客部署脚本

echo "🚀 Tifa2030 博客部署工具"
echo "=========================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "_config.yml" ]; then
    echo -e "${RED}错误: 请在博客根目录运行此脚本${NC}"
    exit 1
fi

echo "📋 部署步骤:"
echo ""

# Step 1: 生成静态文件
echo "1️⃣  正在生成静态文件..."
hexo clean > /dev/null 2>&1
hexo generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 生成失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 静态文件生成完成${NC}"
echo ""

# Step 2: 检查 GitHub Token
echo "2️⃣  检查 GitHub 配置..."
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  未设置 GITHUB_TOKEN 环境变量${NC}"
    echo ""
    echo "你可以:"
    echo "  方法1: 设置环境变量 export GITHUB_TOKEN=your_token"
    echo "  方法2: 使用 git 凭据管理器缓存 GitHub 凭据"
    echo ""
    echo -e "${YELLOW}将继续尝试使用 git 凭据...${NC}"
fi
echo ""

# Step 3: 部署
echo "3️⃣  正在部署到 GitHub Pages..."
echo "   目标: https://github.com/wcy412199295-web/tifa2030.github.io"
echo ""
hexo deploy
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ 部署失败${NC}"
    echo ""
    echo "可能的解决方案:"
    echo "  1. 确保 GitHub 仓库 wcy412199295-web/tifa2030.github.io 已创建"
    echo "  2. 检查 GitHub 凭据是否正确"
    echo "  3. 运行: git config --global credential.helper osxkeychain"
    echo "  4. 先手动推送一次来获取凭据: cd public && git push"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ 部署成功!${NC}"
echo ""
echo "🌐 网站地址:"
echo "   • GitHub Pages: https://wcy412199295-web.github.io/tifa2030.github.io"
echo "   • 自定义域名: https://tifa2030.me (配置 DNS 后生效)"
echo ""
echo "📌 下一步:"
echo "   1. 在域名服务商添加 CNAME: tifa2030.me → wcy412199295-web.github.io"
echo "   2. 等待 DNS 生效 (通常 5-30 分钟)"
echo "   3. 在 GitHub 仓库设置中启用 HTTPS"
echo ""
