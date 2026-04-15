const http = require('http');
const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '/Users/zhangxiaohei/WorkBuddy/smart-investment/.workbuddy/memory';
const TODAY = '2026-04-12';
const MEMORY_FILE = path.join(MEMORY_DIR, `${TODAY}.md`);

function appendToMemory(content) {
  const line = `${new Date().toISOString().slice(0,19)} ${content}`;
  fs.appendFileSync(MEMORY_FILE, content + '\n', 'utf8');
  console.log(content);
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error(`JSON parse failed: ${data.slice(0,200)}`)); }
      });
    }).on('error', reject);
  });
}

function post(pathname, body = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost', port: 4000, path: pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve({ raw: body.slice(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  appendToMemory('\n---\n\n## 12:29 Alert 影响分析自动执行');

  appendToMemory('### Step 1: 获取未读 alerts...');

  // Fetch urgent
  let urgentData = { data: [] };
  try {
    urgentData = await fetch('http://localhost:4000/api/alerts?status=unread&level=urgent');
    appendToMemory(`- urgent: ${urgentData.data?.length || 0} 条`);
  } catch(e) {
    appendToMemory(`- urgent 查询失败: ${e.message}`);
  }

  // Fetch important
  let importantData = { data: [] };
  try {
    importantData = await fetch('http://localhost:4000/api/alerts?status=unread&level=important');
    appendToMemory(`- important: ${importantData.data?.length || 0} 条`);
  } catch(e) {
    appendToMemory(`- important 查询失败: ${e.message}`);
  }

  const allAlerts = [
    ...(urgentData?.data || []),
    ...(importantData?.data || [])
  ];

  appendToMemory(`\n共 ${allAlerts.length} 条未读 alerts 待分析`);

  if (allAlerts.length === 0) {
    appendToMemory('✅ 无新增 alerts，跳过分析');
    return;
  }

  appendToMemory('\n### Step 2: 执行影响分析...');

  const results = [];
  for (let i = 0; i < allAlerts.length; i++) {
    const alert = allAlerts[i];
    appendToMemory(`[${i+1}/${allAlerts.length}] 分析 ${alert.symbol} (id=${alert.id})...`);
    try {
      const result = await post(`/api/alerts/${alert.id}/analyze`, {});
      results.push({ id: alert.id, symbol: alert.symbol, result });
      appendToMemory(`  → 完成: ${JSON.stringify(result).slice(0, 200)}`);
    } catch(e) {
      results.push({ id: alert.id, symbol: alert.symbol, error: e.message });
      appendToMemory(`  → 错误: ${e.message}`);
    }
  }

  appendToMemory('\n### Step 3: 分析完成');
  appendToMemory(`分析数量: ${results.length}`);
  for (const r of results) {
    appendToMemory(`- ${r.symbol}: ${r.error || '✅ 已分析'}`);
  }

  console.log('\n=== 执行完成 ===');
  console.log(`写入文件: ${MEMORY_FILE}`);
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
