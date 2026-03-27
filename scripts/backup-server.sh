#!/bin/bash
# ===========================================
# 数据库备份脚本 - 服务器版本
# 用途: 备份腾讯云服务器上的 SQLite 数据库
# ===========================================

set -e

# 配置
PROJECT_DIR="/var/www/investment-monitor"
DB_FILE="$PROJECT_DIR/prisma/dev.db"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M-%S)
BACKUP_NAME="invest_db_${DATE}_${TIME}.db"
KEEP_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查数据库文件是否存在
if [ ! -f "$DB_FILE" ]; then
    echo "❌ 数据库文件不存在: $DB_FILE"
    exit 1
fi

# 执行备份
cp "$DB_FILE" "$BACKUP_DIR/$BACKUP_NAME"

# 同时创建一个带时间戳的压缩备份
COMPRESSED_NAME="invest_db_${DATE}_${TIME}.db.gz"
gzip -c "$DB_FILE" > "$BACKUP_DIR/$COMPRESSED_NAME"

# 清理旧备份
find "$BACKUP_DIR" -name "invest_db_*.db" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "invest_db_*.db.gz" -mtime +$KEEP_DAYS -delete

# 输出结果
echo "✅ 服务器数据库备份成功"
echo "📁 备份位置: $BACKUP_DIR/$BACKUP_NAME"
echo "📦 压缩备份: $BACKUP_DIR/$COMPRESSED_NAME"
echo "🗑️  清理规则: 保留最近 $KEEP_DAYS 天"

# 记录备份日志
echo "[$(date)] Backup: $BACKUP_NAME" >> "$BACKUP_DIR/backup.log"