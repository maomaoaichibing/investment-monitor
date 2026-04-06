import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const thesisId = 'cmn89xbwp000myxwfe8u2flv3';
  await page.goto(`http://62.234.79.188:4000/theses/${thesisId}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('Testing button clicks...\n');
  
  // 测试第一个展开按钮
  const expandBtn = page.locator('button:has-text("展开")').first();
  if (await expandBtn.count() > 0) {
    const box = await expandBtn.boundingBox();
    console.log('展开按钮位置:', JSON.stringify(box));
    
    try {
      await expandBtn.click({ timeout: 3000, force: true });
      console.log('✅ 展开按钮点击成功!');
      
      // 检查内容是否展开
      await page.waitForTimeout(500);
      const text = await page.locator('body').textContent();
      if (text.includes('收起')) {
        console.log('✅ 内容已展开（显示"收起"）');
      }
    } catch (err) {
      console.log('❌ 展开按钮点击失败:', err.message);
    }
  }
  
  // 测试生成监控计划按钮
  console.log('\n--- 测试生成监控计划按钮 ---');
  const monitorBtn = page.locator('button:has-text("生成监控计划")').first();
  if (await monitorBtn.count() > 0) {
    const box = await monitorBtn.boundingBox();
    console.log('生成监控计划按钮位置:', JSON.stringify(box));
    
    try {
      await monitorBtn.click({ timeout: 3000, force: true });
      console.log('✅ 生成监控计划按钮点击成功!');
      await page.waitForTimeout(1000);
      
      // 检查是否出现对话框或加载
      const bodyText = await page.locator('body').textContent();
      if (bodyText.includes('监控计划') || bodyText.includes('正在生成') || bodyText.includes('生成中')) {
        console.log('✅ 监控计划界面已打开');
      }
    } catch (err) {
      console.log('❌ 生成监控计划按钮点击失败:', err.message);
    }
  }
  
  await browser.close();
})();
