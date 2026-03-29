#!/bin/bash
# 服务监控脚本
# 用法: ./scripts/monitor.sh

REMOTE_HOST="root@62.234.79.188"
SERVICE_NAME="investment-monitor"
BASE_URL="http://62.234.79.188:4000"
PASS=0
FAIL=0

echo "=========================================="
echo "投资监控系统健康检查"
echo "时间: $(date)"
echo "=========================================="

# 1. PM2状态检查
echo ""
echo "[1/4] PM2 服务状态..."
pm2_status=$(ssh "$REMOTE_HOST" "pm2 list" 2>/dev/null | grep "$SERVICE_NAME")
if echo "$pm2_status" | grep -q "online"; then
    echo "✅ $SERVICE_NAME 在线"
    uptime=$(echo "$pm2_status" | awk '{print $10}')
    echo "   运行时间: $uptime"
    ((PASS++))
else
    echo "❌ $SERVICE_NAME 不在线"
    echo "   状态: $pm2_status"
    ((FAIL++))
fi

# 2. HTTP健康检查
echo ""
echo "[2/4] HTTP健康检查..."
http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null)
if [ "$http_code" = "200" ]; then
    echo "✅ HTTP 200 OK"
    ((PASS++))
else
    echo "❌ HTTP $http_code"
    ((FAIL++))
fi

# 3. API端点检查
echo ""
echo "[3/4] API端点检查..."
endpoints=(
    "/api/portfolios"
    "/api/positions"
    "/api/theses"
    "/api/alerts"
    "/api/market/overview"
)

for endpoint in "${endpoints[@]}"; do
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    if [ "$http_code" = "200" ]; then
        echo "   ✅ $endpoint"
        ((PASS++))
    else
        echo "   ❌ $endpoint ($http_code)"
        ((FAIL++))
    fi
done

# 4. 磁盘空间检查
echo ""
echo "[4/4] 磁盘空间检查..."
disk_usage=$(ssh "$REMOTE_HOST" "df -h /" 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 80 ]; then
    echo "✅ 磁盘使用率: ${disk_usage}%"
    ((PASS++))
else
    echo "⚠️ 磁盘使用率: ${disk_usage}% (警告: >80%)"
    ((FAIL++))
fi

# 内存使用检查
echo ""
echo "[5/4] 内存使用检查..."
mem_usage=$(ssh "$REMOTE_HOST" "free | grep Mem | awk '{printf(\"%.0f\"), \$3/\$2 * 100}'" 2>/dev/null)
if [ -n "$mem_usage" ]; then
    if [ "$mem_usage" -lt 80 ]; then
        echo "✅ 内存使用率: ${mem_usage}%"
        ((PASS++))
    else
        echo "⚠️ 内存使用率: ${mem_usage}% (警告: >80%)"
        ((FAIL++))
    fi
fi

# 总结
echo ""
echo "=========================================="
echo "检查结果: ✅ $PASS 通过, ❌ $FAIL 失败"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
    echo "🎉 所有检查通过! 系统运行正常"
    exit 0
else
    echo "⚠️ 有检查失败，请关注"
    exit 1
fi
