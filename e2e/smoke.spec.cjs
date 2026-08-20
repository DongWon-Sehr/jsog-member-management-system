const { test, expect } = require('@playwright/test');

test.describe('UI Sweep E2E tests', () => {
  const BASE_URL = process.env.BASE_URL;
  if (!BASE_URL) {
    throw new Error('BASE_URL environment variable is required (e.g., https://script.google.com/macros/s/.../dev)');
  }

  const VIEWPORTS = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Desktop', width: 1280, height: 800 }
  ];

  // Navigation items exactly match the text inside LayoutHeader
  const VIEWS = [
    { name: 'Dashboard', navItem: '대시보드' },
    { name: 'Members', navItem: '회원 관리' },
    { name: 'Workout', navItem: '운동 기록' },
    { name: 'Reward', navItem: '리워드 관리' },
    { name: 'Log', navItem: '시스템 로그' }
  ];

  VIEWPORTS.forEach(viewport => {
    test.describe(`Viewport: ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test('takes screenshots of all main views', async ({ page }) => {
        // Log in / Apps script authorization happens manually or before this runs
        // We will navigate to the provided base URL
        await page.goto(BASE_URL);

        // GAS sometimes uses an iframe. Check if we need to interact with an iframe.
        // But assuming the user handles auth, wait for the app container to load.
        // If it's inside an iframe, we need to locate the iframe first.
        // For simplicity, assuming the URL directly loads our built HTML or handles the iframe transparently.

        // Wait for page to load (loading overlay disappears)
        // If this is in a Google Apps Script iframe, Playwright might need `.frameLocator`
        // But since we can't reliably guess the frame structure without seeing it, we wait for the .loading-card to disappear
        // Try waiting for the app to be mounted
        await expect(page.locator('#app')).toBeVisible({ timeout: 60000 });
        await expect(page.locator('.loading-card')).toHaveCount(0, { timeout: 30000 });

        for (const view of VIEWS) {
          if (viewport.name === 'Mobile') {
            // Mobile Navigation uses .md:hidden button container
            const navBtn = page.locator(`.md\\:hidden button:has-text("${view.navItem}")`).first();
            await expect(navBtn).toBeVisible({ timeout: 5000 });
            await navBtn.click();
          } else {
            // Desktop Navigation uses hidden md:flex
            const navBtn = page.locator(`nav.hidden.md\\:flex button:has-text("${view.navItem}")`).first();
            await expect(navBtn).toBeVisible({ timeout: 5000 });
            await navBtn.click();
          }

          // Small wait for transition
          await page.waitForTimeout(1000);

          // Take screenshot
          await page.screenshot({ path: `e2e/screenshots/${viewport.name}-${view.name}.png`, fullPage: true });
        }
      });
    });
  });
});
