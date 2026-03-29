#!/bin/bash
# API测试脚本
# 用法: ./scripts/api-test.sh [base_url]
# 默认base_url: http://localhost:4000

BASE_URL=${1:-"http://62.234.79.188:4000"}
PASS=0
FAIL=0

echo "=========================================="
echo "API测试脚本"
echo "Base URL: $BASE_URL"
echo "=========================================="

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    echo -n "[$method] $endpoint ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" \
            -d "$data" "$BASE_URL$endpoint" 2>/dev/null)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "✅ OK ($http_code)"
        ((PASS++))
        return 0
    else
        echo "❌ FAIL ($http_code)"
        echo "   Response: ${body:0:200}"
        ((FAIL++))
        return 1
    fi
}

# 测试Portfolio API
echo ""
echo "=== Portfolio APIs ==="
test_api "获取组合列表" GET "/api/portfolios"
test_api "获取单个组合" GET "/api/portfolios/cmn89mcmv0000yxwftq9bnzzc"

# 测试Position API
echo ""
echo "=== Position APIs ==="
test_api "获取持仓列表" GET "/api/positions"
test_api "获取单个持仓" GET "/api/positions/cmn89n0n1000kyxwfkxfrc8j4"

# 测试Thesis API
echo ""
echo "=== Thesis APIs ==="
test_api "获取Thesis列表" GET "/api/theses"
test_api "获取单个Thesis" GET "/api/theses/cmn9v1tns0003pilmb9xu3q5q"

# 测试Alert API
echo ""
echo "=== Alert APIs ==="
test_api "获取Alert列表" GET "/api/alerts"
test_api "获取单个Alert" GET "/api/alerts/cmna1yskg000913t89x7r29mh"

# 测试Stock API
echo ""
echo "=== Stock APIs ==="
test_api "获取股票行情" GET "/api/stock/quote/00700"
test_api "搜索股票" GET "/api/stock/search?q=腾讯"

# 测试Market API
echo ""
echo "=== Market APIs ==="
test_api "获取大盘概览" GET "/api/market/overview"

echo ""
echo "=========================================="
echo "测试结果: ✅ $PASS 通过, ❌ $FAIL 失败"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
    echo "🎉 所有测试通过!"
    exit 0
else
    echo "⚠️ 有测试失败，请检查"
    exit 1
fi
