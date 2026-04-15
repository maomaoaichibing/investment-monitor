#!/bin/bash
sleep 2
echo "=== HTTP ==="
curl -s -o /dev/null -w "%{http_code}" http://62.234.79.188:4000/
echo ""
echo "=== HK Quote ==="
curl -s "http://62.234.79.188:4000/api/stock/quote/00700?market=HK"
echo ""
echo "=== Market Overview ==="
curl -s "http://62.234.79.188:4000/api/market/overview"
echo ""
echo "=== PM2 ==="
sshpass -p "boX123456" ssh -o StrictHostKeyChecking=no ubuntu@62.234.79.188 "pm2 status investment-monitor" 2>/dev/null
echo ""
echo "=== DONE ==="