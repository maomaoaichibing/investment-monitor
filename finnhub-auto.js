/**
 * Finnhub 账户注册/密码重置自动化脚本
 * 使用 Playwright 直接操作浏览器
 */
const { chromium } = require('playwright');

async function main() {
  console.log('🚀 启动浏览器...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('✅ 浏览器已启动');
  const page = await browser.newPage();

  // 打开密码重置页面
  console.log('📍 打开 Finnhub 密码重置页面...');
  await page.goto('https://finnhub.io/forgetpwd', { waitUntil: 'load', timeout: 30000 });

  // 截图看看页面状态
  await page.screenshot({ path: '/tmp/finnhub-pw-reset.png' });
  console.log('📸 截图已保存: /tmp/finnhub-pw-reset.png');

  // 等待表单加载
  await page.waitForSelector('form', { timeout: 10000 });

  // 找到所有输入框
  const inputs = await page.$$('input');
  console.log(`找到 ${inputs.length} 个输入框`);
  for (const input of inputs) {
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    console.log(`  输入框: name=${name}, type=${type}, placeholder=${placeholder}`);
  }

  // 找到所有按钮
  const buttons = await page.$$('button');
  console.log(`找到 ${buttons.length} 个按钮`);
  for (const btn of buttons) {
    const text = await btn.textContent();
    const type = await btn.getAttribute('type');
    console.log(`  按钮: text="${text?.trim()}", type=${type}`);
  }

  // 找到提交按钮
  const submitBtn = await page.$('button[type=submit], input[type=submit], button:not([type])');
  console.log(`提交按钮: ${submitBtn ? await submitBtn.textContent() : '未找到'}`);

  // 填入邮箱
  const emailInput = await page.$('input[type=email], input[name=email]');
  if (emailInput) {
    await emailInput.fill('3416067293@qq.com');
    console.log('✅ 邮箱已填入: 3416067293@qq.com');
  } else {
    console.log('❌ 未找到邮箱输入框');
  }

  // 截图看看填入后的状态
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/finnhub-pw-filled.png' });
  console.log('📸 截图已保存: /tmp/finnhub-pw-filled.png');

  // 点击提交按钮
  if (submitBtn) {
    await submitBtn.click();
    console.log('✅ 点击了提交按钮');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/finnhub-pw-after.png' });
    console.log(`📸 提交后截图，URL: ${page.url()}`);
  } else {
    // 尝试按 Enter
    await page.keyboard.press('Enter');
    console.log('✅ 按下了 Enter');
    await page.waitForTimeout(3000);
  }

  const finalUrl = page.url();
  console.log(`最终 URL: ${finalUrl}`);

  await page.screenshot({ path: '/tmp/finnhub-final.png' });

  // 等待看是否有弹窗
  await page.waitForTimeout(2000);

  // 检查页面内容
  const bodyText = await page.textContent('body');
  console.log(`页面内容预览: ${bodyText?.substring(0, 300)}`);

  await browser.close();
  console.log('✅ 完成');
}

main().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
