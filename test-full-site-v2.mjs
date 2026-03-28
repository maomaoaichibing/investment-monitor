import { chromium } from 'playwright';

const BASE_URL = 'http://62.234.79.188:4000';
const pages = [
  { name: '首页/Dashboard', url: '/' },
  { name: '投资组合列表', url: '/portfolios' },
  { name: '论题列表', url: '/theses' },
  { name: '提醒列表', url: '/alerts' },
];

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  const errors = [];

  // 收集控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[${msg.location().url}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });

  for (const p of pages) {
    console.log(`\n=== 测试: ${p.name} (${p.url}) ===`);
    try {
      const response = await page.goto(BASE_URL + p.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const status = response?.status() || 'unknown';
      console.log(`  状态码: ${status}`);

      // 获取页面标题
      const title = await page.title();
      console.log(`  标题: ${title}`);

      // 查找所有链接
      const links = await page.$$eval('a[href]', els => els.map(el => ({
        href: el.href,
        text: el.textContent?.trim().substring(0, 50)
      })));
      console.log(`  链接数: ${links.length}`);

      // 查找所有按钮
      const buttons = await page.$$eval('button', els => els.map(el => ({
        text: el.textContent?.trim().substring(0, 30),
        disabled: el.disabled
      })));
      console.log(`  按钮数: ${buttons.length}`);

      results.push({ name: p.name, status: 'OK', links: links.length, buttons: buttons.length });

    } catch (err) {
      console.log(`  ❌ 错误: ${err.message}`);
      results.push({ name: p.name, status: 'ERROR', error: err.message });
    }
  }

  // 测试组合详情页
  console.log('\n=== 测试: 组合详情页 ===');
  try {
    await page.goto(BASE_URL + '/portfolios', { waitUntil: 'domcontentloaded' });
    // 找到第一个组合链接
    const firstPortfolioLink = await page.$('a[href^="/portfolios/cmn"]');
    if (firstPortfolioLink) {
      const href = await firstPortfolioLink.getAttribute('href');
      console.log(`  找到组合链接: ${href}`);
      await page.goto(BASE_URL + href, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      console.log(`  详情页标题: ${title}`);

      // 查找持仓链接
      const positionLinks = await page.$$eval('a[href^="/positions/"]', els => els.slice(0, 3).map(el => el.href));
      console.log(`  持仓链接数: ${positionLinks.length}`);
    }
  } catch (err) {
    console.log(`  ❌ 错误: ${err.message}`);
  }

  // 测试持仓详情页
  console.log('\n=== 测试: 持仓详情页 ===');
  try {
    await page.goto(BASE_URL + '/positions', { waitUntil: 'domcontentloaded' });
    const firstPositionLink = await page.$('a[href^="/positions/cmn"]');
    if (firstPositionLink) {
      const href = await firstPositionLink.getAttribute('href');
      console.log(`  找到持仓链接: ${href}`);
      await page.goto(BASE_URL + href, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      console.log(`  详情页标题: ${title}`);
    } else {
      console.log('  未找到持仓链接，尝试直接访问...');
      await page.goto(BASE_URL + '/positions/cmn89n0n1000kyxwfkxfrc8j4', { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      console.log(`  详情页标题: ${title}`);
    }
  } catch (err) {
    console.log(`  ❌ 错误: ${err.message}`);
  }

  // 测试论题详情页
  console.log('\n=== 测试: 论题详情页 ===');
  try {
    await page.goto(BASE_URL + '/theses', { waitUntil: 'domcontentloaded' });
    const firstThesisLink = await page.$('a[href^="/theses/cmn"]');
    if (firstThesisLink) {
      const href = await firstThesisLink.getAttribute('href');
      console.log(`  找到论题链接: ${href}`);
      await page.goto(BASE_URL + href, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      console.log(`  详情页标题: ${title}`);
    }
  } catch (err) {
    console.log(`  ❌ 错误: ${err.message}`);
  }

  // 测试提醒详情页
  console.log('\n=== 测试: 提醒详情页 ===');
  try {
    await page.goto(BASE_URL + '/alerts', { waitUntil: 'domcontentloaded' });
    const firstAlertLink = await page.$('a[href^="/alerts/cmn"]');
    if (firstAlertLink) {
      const href = await firstAlertLink.getAttribute('href');
      console.log(`  找到提醒链接: ${href}`);
      await page.goto(BASE_URL + href, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      console.log(`  详情页标题: ${title}`);
    } else {
      console.log('  未找到提醒详情链接（列表页可能没有详情链接）');
    }
  } catch (err) {
    console.log(`  ❌ 错误: ${err.message}`);
  }

  // 打印控制台错误
  if (errors.length > 0) {
    console.log('\n=== 控制台错误 ===');
    errors.forEach(e => console.log(`  ${e}`));
  } else {
    console.log('\n✅ 无控制台错误');
  }

  await browser.close();

  console.log('\n=== 测试总结 ===');
  results.forEach(r => {
    const icon = r.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.status} (链接:${r.links}, 按钮:${r.buttons})`);
  });
}

test().catch(console.error);