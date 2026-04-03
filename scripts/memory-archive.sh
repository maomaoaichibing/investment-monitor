#!/bin/bash
# 遗忘归档脚本
# 将超过30天不活跃的记忆自动归档到archive目录

set -e

MEMORY_DIR="/Users/zhangxiaohei/WorkBuddy/smart-investment/.workbuddy/memory"
ARCHIVE_DIR="$MEMORY_DIR/archive"
RETENTION_DAYS=30

echo "🗑️ 遗忘归档系统"
echo "保留期限: $RETENTION_DAYS 天"
echo "---"

# 创建归档目录
mkdir -p "$ARCHIVE_DIR"

# 1. 归档旧的daily日志
echo "1. 检查旧日志..."
OLD_DAILY=$(find "$MEMORY_DIR" -maxdepth 1 -name "????-??-??.md" -mtime +$RETENTION_DAYS 2>/dev/null || true)
OLD_DAILY_COUNT=$(echo "$OLD_DAILY" | wc -l)

if [ "$OLD_DAILY_COUNT" -gt 0 ]; then
    echo "   发现 $OLD_DAILY_COUNT 个旧日志"
    echo "$OLD_DAILY" | while read file; do
        if [ -f "$file" ]; then
            mv "$file" "$ARCHIVE_DIR/"
            echo "   ✅ 归档: $(basename $file)"
        fi
    done
else
    echo "   ✅ 无旧日志需要归档"
fi

# 2. 归档旧的alert分析
echo "2. 检查alert分析..."
OLD_ALERTS=$(find "$MEMORY_DIR" -maxdepth 1 -name "alert-impact-????-??-??.md" -mtime +$RETENTION_DAYS 2>/dev/null || true)
OLD_ALERTS_COUNT=$(echo "$OLD_ALERTS" | wc -l)

if [ "$OLD_ALERTS_COUNT" -gt 0 ]; then
    echo "   发现 $OLD_ALERTS_COUNT 个旧alert分析"
    echo "$OLD_ALERTS" | while read file; do
        if [ -f "$file" ]; then
            mv "$file" "$ARCHIVE_DIR/"
            echo "   ✅ 归档: $(basename $file)"
        fi
    done
else
    echo "   ✅ 无旧alert分析需要归档"
fi

# 3. 归档旧的daily摘要
echo "3. 检查daily摘要..."
OLD_SUMMARIES=$(find "$MEMORY_DIR" -maxdepth 1 -name "daily-summary-????-??-??.md" -mtime +$RETENTION_DAYS 2>/dev/null || true)
OLD_SUMMARIES_COUNT=$(echo "$OLD_SUMMARIES" | wc -l)

if [ "$OLD_SUMMARIES_COUNT" -gt 0 ]; then
    echo "   发现 $OLD_SUMMARIES_COUNT 个旧摘要"
    echo "$OLD_SUMMARIES" | while read file; do
        if [ -f "$file" ]; then
            mv "$file" "$ARCHIVE_DIR/"
            echo "   ✅ 归档: $(basename $file)"
        fi
    done
else
    echo "   ✅ 无旧摘要需要归档"
fi

# 4. 生成归档报告
echo "4. 生成归档报告..."
ARCHIVE_REPORT="$ARCHIVE_DIR/README.md"

cat > "$ARCHIVE_REPORT" << EOF
# 归档目录

> 被遗忘的旧记忆 | 保留期限: $RETENTION_DAYS 天

## 说明

本目录包含被自动归档的旧记忆文件。这些文件因为超过30天未更新而被移动到这里。

如果需要查看历史记录，可以在这里找到。

## 归档统计

- 日期: $(date '+%Y-%m-%d')
- 归档文件数: $(find "$ARCHIVE_DIR" -name "*.md" 2>/dev/null | wc -l)

## 文件列表

$(ls -la "$ARCHIVE_DIR"/*.md 2>/dev/null | awk '{print "- " $NF " (" $6 " " $7 ")"}' | head -20 || echo "无归档文件")

---

*本目录由遗忘归档系统自动管理*
EOF

echo "   ✅ 归档报告已更新"

# 5. 清理归档中超过180天的文件
echo "5. 清理超旧归档（>180天）..."
find "$ARCHIVE_DIR" -name "*.md" -mtime +180 -delete 2>/dev/null || true
echo "   ✅ 清理完成"

# 6. 总结
echo "---"
echo "📊 归档完成"
echo ""
TOTAL_ARCHIVED=$(find "$ARCHIVE_DIR" -name "*.md" 2>/dev/null | wc -l || echo "0")
echo "   - 归档总数: $TOTAL_ARCHIVED"
echo "   - 归档目录: $ARCHIVE_DIR"
