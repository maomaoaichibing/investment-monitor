import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 打开页面
  await page.goto('http://62.234.79.188:4000/portfolios');
  
  // 等待页面加载
  await page.waitForLoadState('networkidle');
  
  // 获取页面标题
  const title = await page.title();
  console.log('Page title:', title);
  
  // 查找所有按钮
  const buttons = await page.locator('button').all();
  console.log('Total buttons:', buttons.length);
  
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const text = await btn.textContent();
    const isVisible = await btn.isVisible();
    const isEnabled = await btn.isEnabled();
    const box = await btn.boundingBox();
    console.log(`Button ${i}: "${text?.trim()}" | visible: ${isVisible} | enabled: ${isEnabled} | box: ${JSON.stringify(box)}`);
  }
  
  // 尝试点击第一个按钮
  if (buttons.length > 0) {
    const firstBtn = buttons[0];
    const text = await firstBtn.textContent();
    console.log('\n尝试点击:', text?.trim());
    try {
      await firstBtn.click({ timeout: 3000 });
      console.log('✅ 点击成功!');
    } catch (err) {
      console.log('❌ 点击失败:', err.message);
    }
  }
  
  await browser.close();
})();
