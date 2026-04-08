#!/bin/bash
# 记忆管理系统 - 主入口
# 整合压缩、提取、归档功能

set -e

MEMORY_DIR="/Users/zhangxiaohei/WorkBuddy/smart-investment/.workbuddy/memory"
SCRIPTS_DIR="/Users/zhangxiaohei/WorkBuddy/smart-investment/scripts"
ARCHIVE_DIR="$MEMORY_DIR/archive"
TODAY=$(date +%Y-%m-%d)

echo "🧠 记忆管理系统"
echo "执行时间: $TODAY"
echo "======================================="

# 1. 自动压缩检查
echo ""
echo "📦 Step 1: 压缩检查"
bash "$SCRIPTS_DIR/memory-compact.sh"

# 2. 知识提取
echo ""
echo "📚 Step 2: 知识提取"
bash "$SCRIPTS_DIR/memory-extractor.sh"

# 3. 遗忘归档（只在周末或每月1号执行）
DAY_OF_WEEK=$(date +%u)
DAY_OF_MONTH=$(date +%d)

if [ "$DAY_OF_WEEK" = "7" ] || [ "$DAY_OF_MONTH" = "01" ]; then
    echo ""
    echo "🗑️ Step 3: 遗忘归档（定期执行）"
    bash "$SCRIPTS_DIR/memory-archive.sh"
else
    echo ""
    echo "⏭️ Step 3: 跳过归档（不是归档日）"
fi

# 4. 更新INDEX
echo ""
echo "📋 Step 4: 更新索引"
INDEX_FILE="$MEMORY_DIR/INDEX.md"

# 统计信息
CORE_LINES=$(wc -l < "$MEMORY_DIR/MEMORY.md")
PREF_LINES=$(wc -l < "$MEMORY_DIR/preferences.md" 2>/dev/null || echo "0")
DAILY_COUNT=$(find "$MEMORY_DIR" -maxdepth 1 -name "????-??-??.md" ! -path "$ARCHIVE_DIR/*" 2>/dev/null | wc -l || echo "0")
TOPICS_COUNT=$(find "$MEMORY_DIR/topics" -name "*.md" 2>/dev/null | wc -l || echo "0")
ARCHIVE_COUNT=$(find "$MEMORY_DIR/archive" -name "*.md" 2>/dev/null | wc -l || echo "0")

cat > "$INDEX_FILE" << EOF
# 记忆索引

> 自动生成的记忆标签索引 | 最后更新: $TODAY

## 📊 记忆统计

| 类型 | 文件 | 行数 |
|------|------|------|
| 核心记忆 | MEMORY.md | $CORE_LINES |
| 用户偏好 | preferences.md | $PREF_LINES |
| 每日日志 | - | $DAILY_COUNT |
| 主题文档 | topics/ | $TOPICS_COUNT |
| 归档 | archive/ | $ARCHIVE_COUNT |

## 🏷️ 高频标签

$(grep -rh "^# " "$MEMORY_DIR"/*.md 2>/dev/null | sort | uniq -c | sort -rn | head -10 || echo "无数据")

## 🔗 快速导航

- [核心记忆](MEMORY.md) - 项目知识和会话摘要
- [用户偏好](preferences.md) - 沟通风格和技术约定
- [每日日志](./) - 按日期查看
- [归档](archive/) - 被遗忘的旧记忆
- [主题文档](topics/) - 专题知识库

## ⚡ 快捷命令

\`\`\`bash
# 查看记忆
cat /Users/zhangxiaohei/WorkBuddy/smart-investment/.workbuddy/memory/MEMORY.md

# 搜索记忆
grep "关键词" /Users/zhangxiaohei/WorkBuddy/smart-investment/.workbuddy/memory/MEMORY.md

# 运行记忆管理
bash /Users/zhangxiaohei/WorkBuddy/smart-investment/scripts/memory-manager.sh
\`\`\`

---

*本索引由记忆管理系统自动生成*
EOF

echo "   ✅ 索引已更新"

echo ""
echo "======================================="
echo "✅ 记忆管理完成"
echo ""
echo "📊 状态:"
echo "   - 核心记忆: $CORE_LINES 行"
echo "   - 用户偏好: $PREF_LINES 行"
echo "   - 每日日志: $DAILY_COUNT 个"
echo "   - 主题文档: $TOPICS_COUNT 个"
echo "   - 归档: $ARCHIVE_COUNT 个"
