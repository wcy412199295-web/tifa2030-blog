#!/bin/bash
# Tifa2030 博客备份与恢复工具
# 用法: ./backup-restore.sh [backup|restore|list|rollback]

set -e

BLOG_DIR="/Users/levi/.openclaw/workspace/tifa2030-blog"
BACKUP_DIR="$HOME/.tifa2030-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cd "$BLOG_DIR"

case "$1" in
    backup)
        echo "📝 创建备份..."
        mkdir -p "$BACKUP_DIR"
        
        # 创建带时间戳的备份分支
        git branch "backup/$TIMESTAMP"
        
        # 打包备份
        tar -czf "$BACKUP_DIR/tifa2030-backup-$TIMESTAMP.tar.gz" \
            --exclude='node_modules' \
            --exclude='.git' \
            --exclude='public' \
            --exclude='db.json' \
            -C "$(dirname "$BLOG_DIR")" \
            "$(basename "$BLOG_DIR")"
        
        echo "✅ 备份完成: $BACKUP_DIR/tifa2030-backup-$TIMESTAMP.tar.gz"
        echo "📌 备份分支: backup/$TIMESTAMP"
        ;;
        
    restore)
        if [ -z "$2" ]; then
            echo "❌ 请指定备份文件: ./backup-restore.sh restore <文件名>"
            ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "没有找到备份文件"
            exit 1
        fi
        
        echo "📦 恢复备份: $2"
        tar -xzf "$BACKUP_DIR/$2" -C "$(dirname "$BLOG_DIR")"
        echo "✅ 恢复完成"
        ;;
        
    list)
        echo "📋 Git 提交历史（最近10条）:"
        git log --oneline --decorate -10
        echo ""
        echo "📦 本地备份文件:"
        ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "暂无文件备份"
        echo ""
        echo "🔖 备份分支:"
        git branch -a | grep backup || echo "暂无备份分支"
        ;;
        
    rollback)
        if [ -z "$2" ]; then
            echo "❌ 请指定版本号: ./backup-restore.sh rollback <commit-hash>"
            echo "📋 可用版本:"
            git log --oneline -5
            exit 1
        fi
        
        echo "⚠️  即将回滚到版本: $2"
        echo "📝 当前状态:"
        git status --short
        echo ""
        read -p "确认回滚? (y/N): " confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            # 先创建当前状态的备份
            git branch "backup/before-rollback-$TIMESTAMP"
            
            # 硬回滚
            git reset --hard "$2"
            
            echo "✅ 已回滚到: $2"
            echo "📌 原版本已备份为分支: backup/before-rollback-$TIMESTAMP"
            echo ""
            echo "🚀 推送到远程:"
            echo "   git push origin main --force"
        else
            echo "❌ 已取消"
        fi
        ;;
        
    *)
        echo "🎮 Tifa2030 博客备份与恢复工具"
        echo ""
        echo "用法:"
        echo "  ./backup-restore.sh backup          - 创建备份"
        echo "  ./backup-restore.sh list            - 列出备份和历史"
        echo "  ./backup-restore.sh rollback <hash> - 回滚到指定版本"
        echo "  ./backup-restore.sh restore <file>  - 从文件恢复"
        echo ""
        echo "示例:"
        echo "  ./backup-restore.sh backup"
        echo "  ./backup-restore.sh rollback a30f245"
        ;;
esac
