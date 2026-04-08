#!/bin/bash
# 记忆自动提取脚本
# 从daily日志中自动提取关键知识，更新到MEMORY.md

set -e

MEMORY_DIR="/Users/zhangxiaohei/WorkBuddy/smart-investment/.workbuddy/memory"
MEMORY_FILE="$MEMORY_DIR/MEMORY.md"
PREFERENCES_FILE="$MEMORY_DIR/preferences.md"
TODAY=$(date +%Y-%m-%d)

echo "📚 记忆自动提取系统"
echo "执行时间: $TODAY"
echo "---"

# 1. 检查最近的daily日志
echo "1. 检查每日日志..."
LATEST_LOG="$MEMORY_DIR/$TODAY.md"
if [ ! -f "$LATEST_LOG" ]; then
    echo "今日无日志，跳过提取"
    exit 0
fi

# 2. 提取关键知识模式
echo "2. 分析关键知识..."

# 定义提取模式
PATTERNS=(
    "已完成.*功能"
    "修复.*问题"
    "优化.*性能"
    "新增.*模块"
    "部署.*成功"
    "## .* 总结"
)

EXTRACTED_KNOWLEDGE=""

for pattern in "${PATTERNS[@]}"; do
    MATCHES=$(grep -E "$pattern" "$LATEST_LOG" 2>/dev/null | head -5 || true)
    if [ -n "$MATCHES" ]; then
        EXTRACTED_KNOWLEDGE="$EXTRACTED_KNOWLEDGE\n$MATCHES"
    fi
done

# 3. 提取用户偏好
echo "3. 分析用户偏好..."

# 检查用户满意度信号
POSITIVE=$(grep -Ec "很好|不错|完美|感谢" "$LATEST_LOG" 2>/dev/null || true)
NEGATIVE=$(grep -Ec "不对|不行|有问题|修复" "$LATEST_LOG" 2>/dev/null || true)

[ -n "$POSITIVE" ] || POSITIVE=0
[ -n "$NEGATIVE" ] || NEGATIVE=0

echo "   - 正面反馈: $POSITIVE"
echo "   - 问题反馈: $NEGATIVE"

# 4. 检查遗忘阈值
echo "4. 检查遗忘归档..."
ARCHIVE_DIR="$MEMORY_DIR/archive"
mkdir -p "$ARCHIVE_DIR"

# 归档超过30天的daily日志
find "$MEMORY_DIR" -name "????-??-??.md" -mtime +30 ! -path "$ARCHIVE_DIR/*" -exec mv {} "$ARCHIVE_DIR/" \; 2>/dev/null || true

ARCHIVED_COUNT=$(find "$ARCHIVE_DIR" -name "????-??-??.md" 2>/dev/null | wc -l || echo "0")
echo "   - 已归档: $ARCHIVED_COUNT 个文件"

# 5. 更新记忆索引
echo "5. 更新记忆索引..."
INDEX_FILE="$MEMORY_DIR/INDEX.md"

# 生成标签索引
TAGS=$(grep -rh "^# " "$MEMORY_DIR"/*.md 2>/dev/null | sort | uniq -c | sort -rn | head -10 || true)

cat > "$INDEX_FILE" << EOF
# 记忆索引

> 自动生成的记忆标签索引 | 最后更新: $TODAY

## 🏷️ 高频标签

$(echo "$TAGS")

## 📊 记忆统计

| 类型 | 数量 |
|------|------|
| 核心记忆 | 1 (MEMORY.md) |
| 偏好约定 | 1 (preferences.md) |
| 每日日志 | $(find "$MEMORY_DIR" -name "????-??-??.md" ! -path "$ARCHIVE_DIR/*" 2>/dev/null | wc -l) |
| 归档日志 | $ARCHIVED_COUNT |
| 主题文档 | $(find "$MEMORY_DIR/topics" -name "*.md" 2>/dev/null | wc -l) |

## 🔗 快速导航

- [核心记忆](MEMORY.md)
- [用户偏好](preferences.md)
- [归档](archive/)
- [主题文档](topics/)

---

*本索引由系统自动生成*
EOF

echo "   ✅ 索引已更新"

# 6. 输出提取结果
echo "---"
echo "✅ 记忆提取完成"
echo ""
echo "📊 提取摘要:"
echo "   - 分析日志: $LATEST_LOG"
echo "   - 用户反馈: 正面 $POSITIVE | 问题 $NEGATIVE"
echo "   - 归档文件: $ARCHIVED_COUNT"
echo "   - 索引状态: 已更新"
