#!/bin/bash
# 数据库备份脚本
# 用法: ./scripts/backup-db.sh [remote] [local]
# remote: 备份到远程服务器 (默认开启)
# local: 同时在本地备份

BACKUP_DIR="/tmp/investment-backups"
REMOTE_DIR="/var/www/investment-monitor/backups"
REMOTE_HOST="root@62.234.79.188"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="investment_db_${TIMESTAMP}.backup"
PROJECT_DIR="/Users/zhangxiaohei/WorkBuddy/smart-investment"

echo "=========================================="
echo "数据库备份脚本"
echo "时间: $(date)"
echo "=========================================="

# 创建本地备份目录
mkdir -p "$BACKUP_DIR"

# 备份本地数据库
echo "[1/4] 备份本地数据库..."
if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
    cp "$PROJECT_DIR/prisma/dev.db" "$BACKUP_DIR/$BACKUP_NAME"
    echo "✅ 本地备份完成: $BACKUP_DIR/$BACKUP_NAME"
    ((PASS++))
else
    echo "❌ 本地数据库不存在: $PROJECT_DIR/prisma/dev.db"
fi

# 备份到远程服务器
echo "[2/4] 备份到远程服务器..."
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_DIR" 2>/dev/null
if [ $? -eq 0 ]; then
    # 获取远程数据库路径
    REMOTE_DB_PATH=$(ssh "$REMOTE_HOST" "grep DATABASE_URL /var/www/investment-monitor/.env 2>/dev/null | sed 's/DATABASE_URL=file://'" 2>/dev/null)

    if [ -n "$REMOTE_DB_PATH" ]; then
        # 直接从远程服务器复制数据库
        ssh "$REMOTE_HOST" "cp $REMOTE_DB_PATH $REMOTE_DIR/$BACKUP_NAME" 2>/dev/null
        echo "✅ 远程备份完成: $REMOTE_HOST:$REMOTE_DIR/$BACKUP_NAME"
    else
        echo "⚠️ 无法获取远程数据库路径，跳过远程备份"
    fi
else
    echo "⚠️ SSH连接失败，跳过远程备份"
fi

# 清理旧备份（保留最近7天）
echo "[3/4] 清理旧备份（保留最近7天）..."
find "$BACKUP_DIR" -name "investment_db_*.backup" -mtime +7 -delete 2>/dev/null
echo "✅ 清理完成"

# 显示备份列表
echo "[4/4] 当前备份列表:"
ls -lh "$BACKUP_DIR"/investment_db_*.backup 2>/dev/null | tail -5

echo ""
echo "=========================================="
echo "备份完成!"
echo "=========================================="
