import { test, expect } from '@playwright/test';

test('Color options test', async ({ page }) => {
  const createResponse = await page.request.post('http://localhost:3000/api/session/create');
  const sessionData = await createResponse.json();
  
  await page.goto(`http://localhost:3000/session/${sessionData.code}`);
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'color-ui-test.png', fullPage: true });
  
  // Check for new color categories
  const categories = ['經典', '暖色', '冷色', '柔和', '霓虹', '自訂'];
  for (const cat of categories) {
    const visible = await page.locator(`text=${cat}`).isVisible().catch(() => false);
    console.log(`${cat}: ${visible ? '✓' : '✗'}`);
  }
  
  // Count color buttons
  const colorButtons = await page.locator('button[style*="background-color"]').count();
  console.log(`Total color buttons: ${colorButtons}`);
});
