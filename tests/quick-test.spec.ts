import { test, expect } from '@playwright/test';

test('UI controls test', async ({ page }) => {
  // Create a session via API first
  const createResponse = await page.request.post('http://localhost:3000/api/session/create');
  const sessionData = await createResponse.json();
  console.log('Created session:', sessionData.code);
  
  // Navigate to the session
  await page.goto(`http://localhost:3000/session/${sessionData.code}`);
  
  // Wait for loading to complete
  await page.waitForTimeout(5000);
  
  console.log('Final URL:', page.url());
  
  await page.screenshot({ path: 'test-ui-result.png', fullPage: true });
  console.log('Screenshot saved');
  
  // Check if loading is done
  const loadingText = await page.locator('text=載入中').isVisible().catch(() => false);
  console.log('Still loading:', loadingText);
  
  // Test sidebar
  const sidebar = page.locator('aside');
  const sidebarVisible = await sidebar.isVisible().catch(() => false);
  console.log('Sidebar visible:', sidebarVisible);
  
  if (sidebarVisible) {
    const controls = ['粗細', '行距', '文字陰影', '文字描邊', '淡入淡出', '重置預設', '自動滾動', '播放', '樣式', '操作'];
    console.log('Checking controls...');
    let found = 0;
    for (const c of controls) {
      const locator = page.locator(`text=${c}`);
      const visible = await locator.isVisible().catch(() => false);
      if (visible) found++;
      console.log(`${c}: ${visible ? '✓' : '✗'}`);
    }
    console.log(`Found ${found}/${controls.length} controls`);
  } else {
    console.log('Sidebar not visible, checking page content...');
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 300));
  }
});
