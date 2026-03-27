#!/bin/bash
# ===========================================
# 数据库同步脚本
# 用途: 同步本地和服务器的数据库
# 支持: push (本地→服务器) / pull (服务器→本地)
# ===========================================

set -e

# 配置
SERVER="root@62.234.79.188"
SERVER_PROJECT="/var/www/investment-monitor"
LOCAL_PROJECT="/Users/zhangxiaohei/WorkBuddy/smart-investment"
LOCAL_DB="$LOCAL_PROJECT/prisma/dev.db"
SERVER_DB="$SERVER_PROJECT/prisma/dev.db"
MODE=${1:-"push"}  # 默认 push

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "📊 智能投资系统 - 数据库同步工具"
echo "=========================================="
echo ""

# 解析模式
case $MODE in
    push)
        echo "📤 同步方向: 本地 → 服务器"
        echo "📁 本地数据库: $LOCAL_DB"
        echo "📁 服务器数据库: $SERVER_DB"
        echo ""

        # 确认操作
        echo -e "${YELLOW}⚠️  此操作将覆盖服务器数据库！${NC}"
        read -p "确认继续? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "❌ 已取消"
            exit 0
        fi

        # 先备份服务器当前数据库
        echo "📦 备份服务器当前数据库..."
        ssh "$SERVER" "cp $SERVER_DB $SERVER_DB.backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

        # 同步
        echo "📤 正在同步..."
        scp "$LOCAL_DB" "$SERVER:$SERVER_DB"

        # 重启服务器
        echo "🔄 重启服务器服务..."
        ssh "$SERVER" "pm2 restart investment-monitor"

        echo ""
        echo -e "${GREEN}✅ 同步完成！${NC}"
        ;;

    pull)
        echo "📥 同步方向: 服务器 → 本地"
        echo "📁 本地数据库: $LOCAL_DB"
        echo "📁 服务器数据库: $SERVER_DB"
        echo ""

        # 确认操作
        echo -e "${YELLOW}⚠️  此操作将覆盖本地数据库！${NC}"
        read -p "确认继续? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "❌ 已取消"
            exit 0
        fi

        # 先备份本地当前数据库
        echo "📦 备份本地当前数据库..."
        cp "$LOCAL_DB" "$LOCAL_DB.backup_$(date +%Y%m%d_%H%M%S)"

        # 同步
        echo "📥 正在同步..."
        scp "$SERVER:$SERVER_DB" "$LOCAL_DB"

        echo ""
        echo -e "${GREEN}✅ 同步完成！${NC}"
        ;;

    status)
        echo "🔍 检查数据状态..."
        echo ""

        echo "📊 本地数据库:"
        sqlite3 "$LOCAL_DB" "SELECT 'Portfolio', COUNT(*) FROM Portfolio UNION ALL SELECT 'Position', COUNT(*) FROM Position UNION ALL SELECT 'Thesis', COUNT(*) FROM Thesis UNION ALL SELECT 'Alert', COUNT(*) FROM Alert;" 2>/dev/null || echo "  (无法读取)"

        echo ""
        echo "📊 服务器数据库:"
        ssh "$SERVER" "sqlite3 $SERVER_DB 'SELECT \"Portfolio\", COUNT(*) FROM Portfolio UNION ALL SELECT \"Position\", COUNT(*) FROM Position UNION ALL SELECT \"Thesis\", COUNT(*) FROM Thesis UNION ALL SELECT \"Alert\", COUNT(*) FROM Alert;'" 2>/dev/null || echo "  (无法读取)"

        echo ""
        echo "📁 本地最后修改: $(ls -l "$LOCAL_DB" | awk '{print $6, $7, $8}')"
        echo "📁 服务器最后修改: $(ssh "$SERVER" "ls -l $SERVER_DB" 2>/dev/null | awk '{print $6, $7, $8}')"
        ;;

    *)
        echo "用法: $0 [push|pull|status]"
        echo ""
        echo "  push   - 同步本地数据库到服务器 (本地 → 服务器)"
        echo "  pull   - 同步服务器数据库到本地 (服务器 → 本地)"
        echo "  status - 查看两边数据库状态"
        echo ""
        echo "示例:"
        echo "  $0 push    # 本地开发完成后，同步到服务器"
        echo "  $0 pull    # 服务器有新数据，同步到本地"
        echo "  $0 status  # 查看两边数据是否一致"
        exit 1
        ;;
esac

echo ""
echo "=========================================="