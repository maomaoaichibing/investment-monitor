import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:4000/theses', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const body = await page.locator('body').innerHTML();
console.log('Body content (first 2000 chars):');
console.log(body.substring(0, 2000));

await browser.close();
