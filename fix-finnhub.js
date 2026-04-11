const { chromium } = require('playwright');

async function main() {
  console.log('🚀 启动 Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  try {
    console.log('📍 打开密码重置页面...');
    await page.goto('https://finnhub.io/forgetpwd', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log('✅ 页面已加载, URL:', page.url());

    // 等一下让 React 渲染
    await page.waitForTimeout(3000);

    // 截图
    await page.screenshot({ path: '/tmp/finnhub-reset2.png' });
    console.log('📸 截图保存');

    // 查找表单
    const forms = await page.$$('form');
    console.log(`找到 ${forms.length} 个表单`);

    // 查找输入框
    const inputs = await page.$$('input');
    console.log(`找到 ${inputs.length} 个输入框`);
    for (const inp of inputs) {
      const type = await inp.getAttribute('type');
      const name = await inp.getAttribute('name');
      const ph = await inp.getAttribute('placeholder');
      console.log(`  input: type=${type}, name=${name}, placeholder=${ph}`);
    }

    // 查找提交按钮
    const buttons = await page.$$('button');
    console.log(`找到 ${buttons.length} 个按钮`);
    for (const btn of buttons) {
      const type = await btn.getAttribute('type');
      const cls = await btn.getAttribute('class') || '';
      const txt = await btn.textContent();
      console.log(`  button: type=${type}, class=${cls.substring(0,50)}, text="${txt?.trim()}"`);
    }

    // 查找提交相关的所有可点击元素
    const submitEls = await page.$$('[type=submit], button[type=submit], input[type=submit]');
    console.log(`提交元素数量: ${submitEls.length}`);

    // 找邮箱输入框并填写
    const emailInput = await page.$('input[type=email]');
    if (emailInput) {
      await emailInput.fill('3416067293@qq.com');
      console.log('✅ 邮箱已填写');
    } else {
      // 尝试其他选择器
      const altInput = await page.$('input[placeholder*="email"], input[name="email"], input[id*="email"]');
      if (altInput) {
        await altInput.fill('3416067293@qq.com');
        console.log('✅ 邮箱已填写 (alt selector)');
      } else {
        console.log('❌ 未找到邮箱输入框');
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/finnhub-reset3.png' });

    // 尝试提交
    // 方法1: 点击任何看起来像提交按钮的东西
    const submitBtn = await page.$('button[type=submit], input[type=submit], button:not([type])');
    if (submitBtn) {
      const txt = await submitBtn.textContent();
      const cls = await submitBtn.getAttribute('class') || '';
      console.log(`准备点击: "${txt?.trim()}", class=${cls.substring(0,60)}`);
      await submitBtn.click();
      console.log('✅ 已点击提交按钮');
    } else {
      // 方法2: 直接触发表单的 submit 事件
      console.log('⚠️ 未找到提交按钮，直接触发表单提交');
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      });
    }

    await page.waitForTimeout(3000);
    console.log('提交后 URL:', page.url());
    await page.screenshot({ path: '/tmp/finnhub-reset4.png' });

    // 检查结果
    const bodyText = await page.textContent('body');
    console.log('页面内容:', bodyText?.substring(0, 400));

  } catch (err) {
    console.error('❌ 错误:', err.message);
    await page.screenshot({ path: '/tmp/finnhub-error.png' });
  } finally {
    await browser.close();
    console.log('✅ 完成');
  }
}

main();
