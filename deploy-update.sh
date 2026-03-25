#!/bin/bash

# 投资监控系统 - 更新部署脚本
# 用法: ./deploy-update.sh

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

# 1. 检查Git状态
echo -e "${YELLOW}[1/6] 检查Git状态...${NC}"
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✓ 代码已是最新，无需更新${NC}"
    exit 0
fi

echo "发现新提交，准备更新..."
echo "  本地: $LOCAL"
echo "  远程: $REMOTE"
echo ""

# 2. 拉取最新代码
echo -e "${YELLOW}[2/6] 拉取最新代码...${NC}"
git reset --hard origin/main
echo -e "${GREEN}✓ 代码更新成功${NC}"
echo ""

# 3. 安装依赖
echo -e "${YELLOW}[3/6] 安装依赖...${NC}"
npm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 4. 构建项目
echo -e "${YELLOW}[4/6] 构建项目...${NC}"
npm run build
echo -e "${GREEN}✓ 构建成功${NC}"
echo ""

# 5. 重启服务
echo -e "${YELLOW}[5/6] 重启PM2服务...${NC}"
pm2 restart investment-monitor
echo -e "${GREEN}✓ 服务重启成功${NC}"
echo ""

# 6. 健康检查
echo -e "${YELLOW}[6/6] 健康检查...${NC}"
sleep 2

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
