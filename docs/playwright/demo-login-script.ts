import { chromium } from 'playwright';

const DEMO_EMAIL = 'test@example.com';
const DEMO_PASSWORD = 'password!';
const SCREENSHOT_PATH = 'docs/playwright/demo-login-home.png';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173/wine_collector/login', {
    waitUntil: 'networkidle',
  });

  await page.getByLabel('이메일').fill(DEMO_EMAIL);
  await page.getByLabel('비밀번호').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: '로그인' }).click();

  await page.waitForURL('**/wine_collector/');
  await page.getByRole('heading', { name: 'Wine Collector' }).waitFor();
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });

  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
