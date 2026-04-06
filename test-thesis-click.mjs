import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 打开 thesis 列表
  await page.goto('http://62.234.79.188:4000/theses');
  await page.waitForLoadState('networkidle');
  
  // 查找 thesis 链接
  const thesisLinks = await page.locator('a[href*="/theses/"]').all();
  console.log('Thesis links found:', thesisLinks.length);
  
  if (thesisLinks.length > 0) {
    // 点击第一个 thesis
    const href = await thesisLinks[0].getAttribute('href');
    console.log('Navigating to:', href);
    await page.goto(`http://62.234.79.188:4000${href}`);
    await page.waitForLoadState('networkidle');
    
    // 等待一下让 React 组件加载
    await page.waitForTimeout(2000);
    
    // 查找所有按钮
    const buttons = await page.locator('button').all();
    console.log('\nButtons on thesis page:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const text = await btn.textContent();
      const isVisible = await btn.isVisible();
      const isEnabled = await btn.isEnabled();
      const box = await btn.boundingBox();
      console.log(`Button ${i}: "${text?.trim()}" | visible: ${isVisible} | enabled: ${isEnabled} | box: ${JSON.stringify(box)}`);
    }
    
    // 尝试点击"查看详情"按钮
    const detailBtn = page.locator('button:has-text("查看详情")');
    if (await detailBtn.count() > 0) {
      console.log('\n尝试点击"查看详情"...');
      try {
        await detailBtn.click({ timeout: 3000 });
        console.log('✅ 点击成功!');
      } catch (err) {
        console.log('❌ 点击失败:', err.message);
      }
    }
  }
  
  await browser.close();
})();
