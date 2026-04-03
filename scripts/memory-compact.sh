#!/bin/bash
# MEMORY.md 自动压缩脚本
# 借鉴 Claude Code 第3层和第5层设计

set -e

MEMORY_DIR="/Users/zhangxiaohei/WorkBuddy/smart-investment/.workbuddy/memory"
MEMORY_FILE="$MEMORY_DIR/MEMORY.md"
MAX_LINES=200
CURRENT_LINES=$(wc -l < "$MEMORY_FILE")

echo "📊 MEMORY.md 自动压缩检查"
echo "当前行数: $CURRENT_LINES / $MAX_LINES"

if [ "$CURRENT_LINES" -le "$MAX_LINES" ]; then
    echo "✅ 无需压缩"
    exit 0
fi

echo "⚠️  超过限制，开始压缩..."
BACKUP_FILE="$MEMORY_DIR/MEMORY.md.backup.$(date +%Y%m%d_%H%M%S)"
cp "$MEMORY_FILE" "$BACKUP_FILE"
echo "📦 备份: $BACKUP_FILE"

# 保留核心部分 + 最近会话摘要
head -n 80 "$MEMORY_FILE" > "$MEMORY_DIR/MEMORY.md.tmp"
awk '/## 📅 最近会话摘要/,/## 📚 快速索引/' "$MEMORY_FILE" >> "$MEMORY_DIR/MEMORY.md.tmp"

# 重新添加尾部
awk '/## 📚 快速索引/,EOF' "$MEMORY_FILE" | head -n 50 >> "$MEMORY_DIR/MEMORY.md.tmp"

echo "---" >> "$MEMORY_DIR/MEMORY.md.tmp"
echo "*自动压缩 $(date '+%Y-%m-%d %H:%M')* | 前: ${CURRENT_LINES}行 -> 后: $(wc -l < "$MEMORY_DIR/MEMORY.md.tmp")行" >> "$MEMORY_DIR/MEMORY.md.tmp"

mv "$MEMORY_DIR/MEMORY.md.tmp" "$MEMORY_FILE"
echo "✅ 压缩完成"
