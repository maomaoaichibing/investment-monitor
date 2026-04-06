import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 直接打开 thesis 详情页
  const thesisId = 'cmn89xbwp000myxwfe8u2flv3';
  await page.goto(`http://62.234.79.188:4000/theses/${thesisId}`);
  await page.waitForLoadState('networkidle');
  
  // 等待 React 组件加载
  await page.waitForTimeout(3000);
  
  console.log('Page loaded:', page.url());
  
  // 查找所有按钮
  const buttons = await page.locator('button').all();
  console.log('\nAll buttons on thesis page:', buttons.length);
  
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const text = await btn.textContent();
    const isVisible = await btn.isVisible();
    const isEnabled = await btn.isEnabled();
    const box = await btn.boundingBox();
    console.log(`Button ${i}: "${text?.trim()}" | visible: ${isVisible} | enabled: ${isEnabled} | box: ${JSON.stringify(box)}`);
  }
  
  // 查找可疑的按钮
  console.log('\n--- 尝试点击各种按钮 ---');
  
  const targets = [
    '查看详情',
    '展开',
    '收起', 
    '生成监控',
    '刷新',
    '编辑'
  ];
  
  for (const target of targets) {
    const btn = page.locator(`button:has-text("${target}")`);
    if (await btn.count() > 0) {
      console.log(`\n点击 "${target}"...`);
      try {
        await btn.click({ timeout: 2000 });
        console.log(`✅ ${target} 点击成功!`);
        await page.waitForTimeout(500);
      } catch (err) {
        console.log(`❌ ${target} 点击失败: ${err.message}`);
      }
    }
  }
  
  await browser.close();
})();
