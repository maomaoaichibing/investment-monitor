#!/bin/bash
# ============================================
# 自主工作引擎 - Git Hook 自动触发版
# ============================================
# 使用方法：
# 1. 将此脚本放在项目 .git/hooks/pre-commit
# 2. 或在本地创建符号链接: ln -s ../../scripts/autonomous-trigger.sh .git/hooks/post-commit
#
# 功能：
# - pre-commit: 自动运行 lint + type check
# - post-commit: 自动 push + 触发服务器部署
# ============================================

PROJECT_PATH="/Users/zhangxiaohei/WorkBuddy/smart-investment"
SERVER_IP="62.234.79.188"
SERVER_PATH="/var/www/investment-monitor"

cd "$PROJECT_PATH" || exit 1

echo "=========================================="
echo "🤖 自主工作引擎启动"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查是否应该跳过（通过环境变量）
if [[ "$SKIP_AUTONOMOUS" == "1" ]]; then
    log_info "跳过了自主检查 (SKIP_AUTONOMOUS=1)"
    exit 0
fi

# ============================================
# Pre-commit 检查
# ============================================
run_pre_commit_checks() {
    log_info "运行 pre-commit 检查..."

    # 1. TypeScript 类型检查
    log_info "检查 TypeScript 类型..."
    npx tsc --noEmit 2>&1 | head -20
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_info "✅ TypeScript 类型检查通过"
    else
        log_warn "⚠️ TypeScript 类型检查有警告"
    fi

    # 2. ESLint 检查
    log_info "运行 ESLint..."
    npx eslint src --ext .ts,.tsx 2>&1 | head -20
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_info "✅ ESLint 检查通过"
    else
        log_warn "⚠️ ESLint 有警告"
    fi

    # 3. 构建测试
    log_info "测试构建..."
    npm run build 2>&1 | tail -30
    if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
        log_info "✅ 构建成功"
    else
        log_error "❌ 构建失败!"
        echo "继续提交请设置 SKIP_AUTONOMOUS=1"
        exit 1
    fi
}

# ============================================
# Post-commit: 自动部署
# ============================================
run_auto_deploy() {
    log_info "检测到代码已提交，开始自动部署..."

    # 1. Push 到远程
    log_info "推送到远程仓库..."
    git push origin main 2>&1
    if [[ $? -ne 0 ]]; then
        log_error "推送失败"
        exit 1
    fi
    log_info "✅ 推送成功"

    # 2. SSH 到服务器拉取并部署
    log_info "触发服务器部署..."

    ssh root@"$SERVER_IP" << 'ENDSSH'
        cd /var/www/investment-monitor

        # 拉取最新代码
        echo "[部署] 拉取代码..."
        git fetch origin main
        git reset --hard origin/main

        # 安装依赖
        echo "[部署] 安装依赖..."
        npm install

        # 构建
        echo "[部署] 构建项目..."
        npm run build

        # 重启 PM2
        echo "[部署] 重启服务..."
        pm2 restart investment-monitor

        # 健康检查
        sleep 3
        curl -s http://localhost:4000/ > /dev/null && echo "[部署] ✅ 健康检查通过" || echo "[部署] ❌ 健康检查失败"
ENDSSH

    if [[ $? -eq 0 ]]; then
        log_info "✅ 部署完成!"
        log_info "🌐 访问地址: http://$SERVER_IP:4000"
    else
        log_error "❌ 部署失败"
    fi
}

# ============================================
# 主逻辑
# ============================================
HOOK_NAME=$(basename "$0")

case "$HOOK_NAME" in
    pre-commit)
        run_pre_commit_checks
        ;;
    post-commit)
        run_auto_deploy
        ;;
    post-merge)
        log_info "代码已合并，运行 post-merge..."
        # 可选：同步数据库等
        ;;
    *)
        # 直接运行模式
        log_info "直接运行模式 - 执行完整检查"
        run_pre_commit_checks
        ;;
esac

echo ""
log_info "自主工作引擎执行完毕"
echo "=========================================="