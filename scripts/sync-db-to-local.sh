#!/bin/bash
# 数据库同步脚本 - 在服务器上运行
# 用法: ./sync-db-to-local.sh

set -e

# 配置
SERVER_DB_PATH="/var/www/investment-monitor/prisma/dev.db"
LOCAL_DB_PATH="/Users/zhangxiaohei/WorkBuddy/smart-investment/prisma/dev.db"
SERVER_USER="root"
SERVER_HOST="62.234.79.188"
BACKUP_DIR="/tmp/db-backups"

echo "📊 投资监控系统 - 数据库同步工具"
echo "=================================="

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 1. 先备份本地数据库
echo ""
echo "1️⃣ 备份本地数据库..."
BACKUP_FILE="$BACKUP_DIR/dev_backup_$(date +%Y%m%d_%H%M%S).db"
if [ -f "$LOCAL_DB_PATH" ]; then
    cp "$LOCAL_DB_PATH" "$BACKUP_FILE"
    echo "   ✅ 本地数据库已备份到: $BACKUP_FILE"
else
    echo "   ⚠️ 本地数据库不存在，跳过备份"
fi

# 2. 从服务器下载最新数据库
echo ""
echo "2️⃣ 从服务器下载最新数据库..."
scp "$SERVER_USER@$SERVER_HOST:$SERVER_DB_PATH" "$LOCAL_DB_PATH.tmp"

if [ -f "$LOCAL_DB_PATH.tmp" ]; then
    mv "$LOCAL_DB_PATH.tmp" "$LOCAL_DB_PATH"
    echo "   ✅ 服务器数据库已同步到本地"
else
    echo "   ❌ 下载失败"
    exit 1
fi

# 3. 验证数据库
echo ""
echo "3️⃣ 验证数据库..."
TABLE_COUNT=$(sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
echo "   📋 数据库表数量: $TABLE_COUNT"

# 4. 显示数据库统计
echo ""
echo "4️⃣ 数据库统计:"
echo "   - 投资组合: $(sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) FROM Portfolio;" 2>/dev/null || echo 0) 个"
echo "   - 持仓: $(sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) FROM Position;" 2>/dev/null || echo 0) 个"
echo "   - 投资论题: $(sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) FROM Thesis;" 2>/dev/null || echo 0) 个"
echo "   - 提醒: $(sqlite3 "$LOCAL_DB_PATH" "SELECT COUNT(*) FROM Alert;" 2>/dev/null || echo 0) 条"

echo ""
echo "✅ 数据库同步完成！"
echo "   本地数据库路径: $LOCAL_DB_PATH"
