/**
 * Finnhub API 测试脚本
 * 直接用 HTTP 请求测试 Finnhub API 是否可访问
 */
const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  // 测试 Finnhub API 是否可访问（无需 Key 的端点）
  console.log('🧪 测试 Finnhub API 可访问性...\n');

  // 1. 测试 Market News（无需 API Key）
  try {
    const url1 = 'https://finnhub.io/api/v1/news?category=general';
    const res1 = await httpGet(url1);
    const news = JSON.parse(res1.data);
    console.log(`📰 Market News: HTTP ${res1.status}, ${Array.isArray(news) ? news.length + ' 条' : '格式异常'}`);
    if (Array.isArray(news) && news.length > 0) {
      console.log(`   最新: ${news[0].headline?.substring(0, 60)}...`);
    }
  } catch(e) {
    console.log(`❌ Market News 失败: ${e.message}`);
  }

  // 2. 测试 AAPL quote（需要 API Key）
  try {
    const url2 = 'https://finnhub.io/api/v1/quote?symbol=AAPL&token=demo';
    const res2 = await httpGet(url2);
    const quote = JSON.parse(res2.data);
    console.log(`\n📈 AAPL Quote (demo key): HTTP ${res2.status}, ${JSON.stringify(quote)}`);
  } catch(e) {
    console.log(`❌ AAPL Quote 失败: ${e.message}`);
  }

  // 3. 测试 Finnhub 主站是否可达
  try {
    const url3 = 'https://finnhub.io';
    const res3 = await httpGet(url3);
    console.log(`\n🌐 Finnhub 主站: HTTP ${res3.status}`);
  } catch(e) {
    console.log(`❌ Finnhub 主站: ${e.message}`);
  }

  // 4. 测试腾讯云服务器访问 finnhub.io
  console.log('\n🚀 如需在腾讯云服务器上测试，运行:');
  console.log('curl -s "https://finnhub.io/api/v1/quote?symbol=AAPL&token=demo"');
}

main().catch(console.error);
