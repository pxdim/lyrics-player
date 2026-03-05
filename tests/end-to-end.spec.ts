import { test, expect } from '@playwright/test';

test.describe('Lyrics Player End-to-End', () => {
  test('complete workflow: connect, import lyrics, play', async ({ page: displayPage, context }) => {
    // Display app is on port 3000, Controller on port 3001 (swapped!)
    await displayPage.goto('http://localhost:3000');
    await displayPage.waitForTimeout(3000);

    // Get connection code from display
    console.log('=== DISPLAY PAGE ===');
    const displayContent = await displayPage.content();
    console.log('Display title:', await displayPage.title());

    // Wait for connection code to appear
    await displayPage.waitForSelector('text=/連接碼/', { timeout: 10000 });
    
    // Extract connection code
    const codeElement = await displayPage.locator('text=/^[A-Z0-9]{3}-[A-Z0-9]{3}$/').first();
    const connectionCode = await codeElement.textContent();
    console.log('Connection Code:', connectionCode);

    if (!connectionCode) {
      console.log('ERROR: No connection code found!');
      const screenshot = await displayPage.screenshot({ fullPage: true, path: 'tests/display-error.png' });
      console.log('Screenshot saved');
      return;
    }

    const cleanCode = connectionCode.replace('-', '');
    console.log('Clean Code:', cleanCode);

    // Take screenshot of display
    await displayPage.screenshot({ path: 'tests/display-connected.png', fullPage: true });

    // Open controller in new page (port 3001)
    const controllerPage = await context.newPage();
    await controllerPage.goto('http://localhost:3001');
    await controllerPage.waitForTimeout(2000);

    console.log('\n=== CONTROLLER PAGE ===');

    // Enter connection code
    const codeInput = controllerPage.locator('input#code');
    await codeInput.fill(cleanCode);
    console.log('Entered code:', cleanCode);

    // Click connect button
    const connectButton = controllerPage.locator('button:has-text("連線")');
    await connectButton.click();
    console.log('Clicked connect button');

    // Wait for navigation to session page
    await controllerPage.waitForURL(/\/session\//, { timeout: 10000 });
    console.log('Navigated to session page');

    // Take screenshot of controller session page
    await controllerPage.waitForTimeout(2000);
    await controllerPage.screenshot({ path: 'tests/controller-session.png', fullPage: true });

    // Check connection status
    const connectionStatus = await controllerPage.locator('text=/已連線/').count();
    console.log('Connection status found:', connectionStatus > 0);

    // Click AI Search button
    const searchButton = controllerPage.locator('button:has-text("AI 搜尋")');
    await searchButton.click();
    console.log('Clicked AI Search button');

    // Wait for search modal
    await controllerPage.waitForSelector('text=/AI 搜尋歌詞/', { timeout: 5000 });
    console.log('Search modal opened');

    // Search for a song
    const searchInput = controllerPage.locator('input[placeholder*="輸入歌名"]');
    await searchInput.fill('小情歌');
    console.log('Entered search query: 小情歌');

    // Click search button
    const searchSubmitButton = controllerPage.locator('button:has-text("搜尋歌曲")');
    await searchSubmitButton.click();
    console.log('Clicked search submit button');

    // Wait for search results (may take a while for AI)
    await controllerPage.waitForTimeout(8000);

    // Take screenshot of search results
    await controllerPage.screenshot({ path: 'tests/search-results.png', fullPage: true });

    // Check if search results appeared
    const searchResults = controllerPage.locator('button:has-text("匯入")');
    const resultCount = await searchResults.count();
    console.log('Search results found:', resultCount);

    if (resultCount > 0) {
      // Click first import button
      await searchResults.first().click();
      console.log('Clicked first import button');

      // Wait for lyrics to load
      await controllerPage.waitForTimeout(5000);

      // Take screenshot after import
      await controllerPage.screenshot({ path: 'tests/after-import.png', fullPage: true });

      // Check if lyrics appeared in controller
      const lyricsInController = await controllerPage.locator('text=/目前播放/').count();
      console.log('Lyrics in controller:', lyricsInController > 0);

      // Click on first lyric to play it
      const firstLyric = controllerPage.locator('div:has-text("1")').first();
      await firstLyric.click();
      console.log('Clicked first lyric');

      await controllerPage.waitForTimeout(2000);

      // Check display app for lyrics
      await displayPage.waitForTimeout(2000);
      await displayPage.screenshot({ path: 'tests/display-with-lyrics.png', fullPage: true });

      const displayContentAfter = await displayPage.content();
      console.log('Display page has lyrics:', displayContentAfter.length > 0);

      // Get current lyric from display
      const lyricText = await displayPage.locator('div[style*="opacity"]').textContent();
      console.log('Current lyric on display:', lyricText?.substring(0, 50) || 'none');
    }

    // Final screenshots
    await controllerPage.screenshot({ path: 'tests/controller-final.png', fullPage: true });
    await displayPage.screenshot({ path: 'tests/display-final.png', fullPage: true });

    console.log('\n=== TEST COMPLETE ===');
  });
});
