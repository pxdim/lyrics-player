import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`Console [${msg.type()}]: ${msg.text()}`);
  });
  
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Wait for useEffect to run
  await page.waitForTimeout(2000);
  
  const title = await page.title();
  const bodyText = await page.locator('body').textContent();
  
  console.log(`Page title: ${title}`);
  console.log(`Body preview: ${bodyText?.substring(0, 300)}`);
  
  if (bodyText?.includes('載入中')) {
    console.log('❌ Still showing loading state');
  } else {
    console.log('✅ Loading state cleared');
  }
  
  if (bodyText?.includes('Session ID:')) {
    console.log('✅ Session code is displayed');
    const match = bodyText.match(/Session ID: ([A-Z0-9]{6})/);
    if (match) {
      console.log(`   Session code: ${match[1]}`);
    }
  } else {
    console.log('❌ Session code not found');
  }
  
  await page.screenshot({ path: 'display-screenshot.png', fullPage: true });
  console.log('Screenshot saved');
  
  await browser.close();
})();
