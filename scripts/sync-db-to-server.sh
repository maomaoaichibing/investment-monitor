#!/bin/bash
# 数据库同步脚本 - 从本地上传到服务器
# 用法: ./sync-db-to-server.sh

set -e

# 配置
LOCAL_DB_PATH="/Users/zhangxiaohei/WorkBuddy/smart-investment/prisma/dev.db"
SERVER_DB_PATH="/var/www/investment-monitor/prisma/dev.db"
SERVER_USER="root"
SERVER_HOST="62.234.79.188"
BACKUP_DIR="/var/www/investment-monitor/prisma/backups"

echo "📊 投资监控系统 - 数据库上传工具"
echo "=================================="

# 1. 检查本地数据库
echo ""
echo "1️⃣ 检查本地数据库..."
if [ ! -f "$LOCAL_DB_PATH" ]; then
    echo "   ❌ 本地数据库不存在: $LOCAL_DB_PATH"
    exit 1
fi
echo "   ✅ 本地数据库存在"

# 2. 备份服务器现有数据库
echo ""
echo "2️⃣ 备份服务器现有数据库..."
ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $BACKUP_DIR && cp $SERVER_DB_PATH $BACKUP_DIR/dev_backup_\$(date +%Y%m%d_%H%M%S).db 2>/dev/null || true"
echo "   ✅ 服务器数据库已备份"

# 3. 上传本地数据库
echo ""
echo "3️⃣ 上传数据库到服务器..."
scp "$LOCAL_DB_PATH" "$SERVER_USER@$SERVER_HOST:$SERVER_DB_PATH"

echo "   ✅ 数据库已上传"

# 4. 重启服务
echo ""
echo "4️⃣ 重启PM2服务..."
ssh "$SERVER_USER@$SERVER_HOST" "pm2 restart investment-monitor"

echo ""
echo "✅ 数据库上传完成！"
echo "   服务器数据库路径: $SERVER_DB_PATH"
