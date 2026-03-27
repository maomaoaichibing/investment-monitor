#!/bin/bash

# 投资监控系统 - 更新部署脚本
# 用法: ./deploy-update.sh [--sync-db]
#   --sync-db: 同步本地数据库到服务器（可选）

set -e  # 遇到错误立即退出

echo "========================================"
echo "  投资监控系统 - 更新部署"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在正确目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 解析参数
SYNC_DB=false
for arg in "$@"; do
    case $arg in
        --sync-db)
            SYNC_DB=true
            ;;
    esac
done

# 1. 检查Git状态
echo -e "${YELLOW}[1/7] 检查Git状态...${NC}"
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    if [ "$SYNC_DB" = "false" ]; then
        echo -e "${GREEN}✓ 代码已是最新，无需更新${NC}"
        exit 0
    fi
fi

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "发现新提交，准备更新..."
    echo "  本地: $LOCAL"
    echo "  远程: $REMOTE"
    echo ""
fi

# 2. 拉取最新代码（如果有更新）
if [ "$LOCAL" != "$REMOTE" ]; then
    echo -e "${YELLOW}[2/7] 拉取最新代码...${NC}"
    git reset --hard origin/main
    echo -e "${GREEN}✓ 代码更新成功${NC}"
    echo ""
else
    echo -e "${YELLOW}[2/7] 代码已是最新，跳过拉取${NC}"
fi

# 3. 安装依赖
echo -e "${YELLOW}[3/7] 安装依赖...${NC}"
npm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 4. 构建项目
echo -e "${YELLOW}[4/7] 构建项目...${NC}"
npm run build
echo -e "${GREEN}✓ 构建成功${NC}"
echo ""

# 5. 同步数据库（如果需要）
if [ "$SYNC_DB" = "true" ]; then
    echo -e "${YELLOW}[5/7] 同步数据库...${NC}"
    # 获取本地数据库位置
    LOCAL_DB="prisma/dev.db"
    if [ ! -f "$LOCAL_DB" ]; then
        echo -e "${RED}✗ 本地数据库文件不存在: $LOCAL_DB${NC}"
    else
        # 检查本地数据库内容
        LOCAL_COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM Thesis;" 2>/dev/null || echo "0")
        echo "  本地持仓数量: $(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM Position;" 2>/dev/null || echo "0")"
        echo "  本地Thesis数量: $LOCAL_COUNT"
        
        # 复制到服务器
        scp -o ConnectTimeout=10 "$LOCAL_DB" root@62.234.79.188:/var/www/investment-monitor/prisma/dev.db
        echo -e "${GREEN}✓ 数据库同步成功${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}[5/7] 跳过数据库同步 (使用 --sync-db 启用)${NC}"
fi

# 6. 重启服务
echo -e "${YELLOW}[6/7] 重启PM2服务...${NC}"
pm2 restart investment-monitor
echo -e "${GREEN}✓ 服务重启成功${NC}"
echo ""

# 7. 健康检查
echo -e "${YELLOW}[7/7] 健康检查...${NC}"
sleep 3

# 检查服务是否响应
if curl -s http://localhost:4000 > /dev/null; then
    echo -e "${GREEN}✓ 服务运行正常${NC}"
else
    echo -e "${RED}✗ 服务未响应，请检查日志${NC}"
    echo "查看日志: pm2 logs investment-monitor"
    exit 1
fi

echo ""
echo "========================================"
echo -e "${GREEN}  部署完成！${NC}"
echo "========================================"
echo ""
pm2 list
