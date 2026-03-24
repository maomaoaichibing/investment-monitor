#!/bin/bash
# 投资监控系统部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "========================================"
echo "  投资监控系统部署脚本"
echo "========================================"
echo ""

# 配置
PROJECT_DIR="/var/www/investment-monitor"
PM2_APP_NAME="investment-monitor"
LOG_DIR="/var/log/pm2"

echo "📋 部署信息:"
echo "   项目目录: $PROJECT_DIR"
echo "   PM2 应用: $PM2_APP_NAME"
echo "   日志目录: $LOG_DIR"
echo ""

# 1. 检查并创建目录
echo "[1/8] 检查项目目录..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "   ❌ 项目目录不存在: $PROJECT_DIR"
    echo "   请先在服务器上创建目录并上传代码"
    exit 1
fi

cd $PROJECT_DIR

# 2. 检查环境变量
echo "[2/8] 检查环境变量..."
if [ -z "$DATABASE_URL" ]; then
    echo "   ⚠️  警告: DATABASE_URL 未设置，使用默认值"
    export DATABASE_URL="file:./dev.db"
fi
echo "   DATABASE_URL: $DATABASE_URL"

# 3. 拉取最新代码
echo "[3/8] 拉取最新代码..."
if [ -d ".git" ]; then
    git pull origin main
    echo "   ✅ 代码更新成功"
else
    echo "   ⚠️  非 Git 仓库，跳过代码更新"
fi

# 4. 安装依赖
echo "[4/8] 安装依赖..."
npm install
if [ $? -eq 0 ]; then
    echo "   ✅ 依赖安装成功"
else
    echo "   ❌ 依赖安装失败"
    exit 1
fi

# 5. 生成 Prisma Client
echo "[5/8] 生成 Prisma Client..."
npm run db:generate
if [ $? -eq 0 ]; then
    echo "   ✅ Prisma Client 生成成功"
else
    echo "   ❌ Prisma Client 生成失败"
    exit 1
fi

# 6. 清除缓存并构建
echo "[6/8] 构建应用..."
rm -rf .next
npm run build
if [ $? -eq 0 ]; then
    echo "   ✅ 构建成功"
else
    echo "   ❌ 构建失败"
    exit 1
fi

# 7. 停止旧进程
echo "[7/8] 停止旧进程..."
pm2 stop $PM2_APP_NAME 2>/dev/null || echo "   ℹ️  无旧进程需要停止"

# 8. 启动应用
echo "[8/8] 启动应用..."
pm2 start ecosystem.config.js --env production
if [ $? -eq 0 ]; then
    echo "   ✅ 应用启动成功"
else
    echo "   ❌ 应用启动失败"
    exit 1
fi

# 保存 PM2 配置
echo ""
echo "💾 保存 PM2 配置..."
pm2 save
pm2 startup 2>/dev/null || echo "   ℹ️  开机自启已配置"

# 验证部署
echo ""
echo "🔍 验证部署..."
sleep 3
if pm2 list | grep -q $PM2_APP_NAME; then
    echo "   ✅ PM2 进程运行正常"
else
    echo "   ❌ PM2 进程未找到"
    exit 1
fi

# 测试访问
echo ""
echo "🌐 测试访问..."
curl -s http://localhost:4000 | head -c 100
if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ 服务响应正常"
else
    echo ""
    echo "   ⚠️  服务可能未完全启动，请稍后手动检查"
fi

# 显示信息
echo ""
echo "========================================"
echo "  ✅ 部署完成！"
echo "========================================"
echo ""
echo "📊 应用信息:"
pm2 list | grep $PM2_APP_NAME
echo ""
echo "📝 日志位置:"
echo "   错误日志: $LOG_DIR/${PM2_APP_NAME}-error.log"
echo "   输出日志: $LOG_DIR/${PM2_APP_NAME}-out.log"
echo ""
echo "🔗 访问地址:"
echo "   本地: http://localhost:4000"
echo "   如果配置了域名: http://your-domain.com"
echo ""
echo "🛠️  常用命令:"
echo "   查看日志: pm2 logs $PM2_APP_NAME"
echo "   重启应用: pm2 restart $PM2_APP_NAME"
echo "   停止应用: pm2 stop $PM2_APP_NAME"
echo "   查看状态: pm2 list"
echo ""
echo "🎉 部署成功！请访问 http://localhost:4000 查看效果"
echo ""

exit 0
