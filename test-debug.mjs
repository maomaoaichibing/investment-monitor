import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('CONSOLE ERROR:', msg.text());
    console.log('  Location:', msg.location());
  }
});

page.on('pageerror', err => {
  console.log('PAGE ERROR:', err.message);
  console.log('Stack:', err.stack?.split('\n')[1]);
});

await page.goto('http://localhost:4000/theses', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const title = await page.locator('h1').textContent().catch(() => 'NOT FOUND');
console.log('\nPage H1:', title);

const cards = await page.locator('.grid > div').count();
console.log('Thesis cards:', cards);

await browser.close();
