import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:4000';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const results = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.message}`);
  });

  async function testPage(name, url, checks = []) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      const response = await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response?.status() || 0;

      if (status >= 400) {
        results.push({ name, status, pass: false, error: `HTTP ${status}` });
        console.log(`  ❌ HTTP ${status}`);
        return false;
      }

      for (const check of checks) {
        try {
          await page.waitForSelector(check.selector, { timeout: 5000 });
          console.log(`  ✅ ${check.label}`);
        } catch (e) {
          console.log(`  ⚠️  ${check.label}: not found`);
        }
      }

      results.push({ name, status, pass: true });
      console.log(`  ✅ ${name} loaded (HTTP ${status})`);
      return true;
    } catch (err) {
      results.push({ name, status: 0, pass: false, error: err.message });
      console.log(`  ❌ ${name}: ${err.message}`);
      return false;
    }
  }

  async function testAPI(name, url, method = 'GET') {
    console.log(`\n🔌 Testing API: ${name}`);
    try {
      const response = await page.request[method.toLowerCase()](`${BASE_URL}${url}`);
      const status = response.status();
      const body = await response.json();

      if (status >= 400) {
        results.push({ name, status, pass: false, error: `HTTP ${status}` });
        console.log(`  ❌ HTTP ${status}`);
        return false;
      }

      console.log(`  ✅ ${name} (HTTP ${status})`);
      console.log(`  📦 Response:`, JSON.stringify(body).substring(0, 200) + '...');
      results.push({ name, status, pass: true });
      return true;
    } catch (err) {
      results.push({ name, status: 0, pass: false, error: err.message });
      console.log(`  ❌ ${name}: ${err.message}`);
      return false;
    }
  }

  // Test pages
  await testPage('Dashboard', '/', [
    { selector: 'header', label: 'Header' },
    { selector: 'nav', label: 'Navigation' },
  ]);

  await testPage('Portfolios', '/portfolios', [
    { selector: 'h1', label: 'Page Title' },
  ]);

  await testPage('Alerts', '/alerts', [
    { selector: 'h1', label: 'Page Title' },
  ]);

  await testPage('Theses', '/theses', [
    { selector: 'h1', label: 'Page Title' },
  ]);

  // Test APIs
  await testAPI('Daily Summary', '/api/daily-summary');
  await testAPI('Portfolios', '/api/portfolios');
  await testAPI('Alerts', '/api/alerts');
  await testAPI('Theses', '/api/thesis');

  // Get a thesis ID and test devil's advocate
  try {
    const response = await page.request.get(`${BASE_URL}/api/thesis`);
    const data = await response.json();
    if (data.success && data.data && data.data.length > 0) {
      const thesisId = data.data[0].id;
      await testAPI('Devil\'s Advocate', `/api/devils-advocate?thesisId=${thesisId}`);
    }
  } catch (e) {
    console.log(`  ⚠️  Could not test Devil's Advocate: ${e.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  results.forEach(r => {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon} ${r.name}: HTTP ${r.status} ${r.error || ''}`);
  });

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);

  if (errors.length > 0) {
    console.log('\n⚠️  Console Errors Detected:');
    errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log('\n✅ No console errors detected');
  }

  await browser.close();

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});