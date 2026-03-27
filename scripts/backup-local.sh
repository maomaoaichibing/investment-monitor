#!/bin/bash
# ===========================================
# 数据库备份脚本 - 本地版本
# 用途: 备份智能投资系统的 SQLite 数据库
# ===========================================

set -e

# 配置
PROJECT_DIR="/Users/zhangxiaohei/WorkBuddy/smart-investment"
DB_FILE="$PROJECT_DIR/prisma/dev.db"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M-%S)
BACKUP_NAME="invest_db_${DATE}_${TIME}.db"
KEEP_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
cp "$DB_FILE" "$BACKUP_DIR/$BACKUP_NAME"

# 同时创建一个带时间戳的压缩备份（保留更长）
COMPRESSED_NAME="invest_db_${DATE}_${TIME}.db.gz"
gzip -c "$DB_FILE" > "$BACKUP_DIR/$COMPRESSED_NAME"

# 清理旧备份（保留最近30天）
find "$BACKUP_DIR" -name "invest_db_*.db" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "invest_db_*.db.gz" -mtime +$KEEP_DAYS -delete

# 输出结果
echo "✅ 数据库备份成功"
echo "📁 备份位置: $BACKUP_DIR/$BACKUP_NAME"
echo "📦 压缩备份: $BACKUP_DIR/$COMPRESSED_NAME"
echo "📊 原始大小: $(ls -lh "$DB_FILE" | awk '{print $5}')"
echo "📊 备份大小: $(ls -lh "$BACKUP_DIR/$BACKUP_NAME" | awk '{print $5}')"
echo "🗑️  清理规则: 保留最近 $KEEP_DAYS 天"

# 显示最近5个备份
echo ""
echo "📋 最近5个备份:"
ls -lh "$BACKUP_DIR"/invest_db_*.db.gz 2>/dev/null | tail -5