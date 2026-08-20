const { test, expect } = require('@playwright/test');

test.describe('UI Sweep E2E tests', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
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
        await page.goto(BASE_URL);

        // Wait for page to load (loading overlay disappears)
        await expect(page.locator('.loading-card')).toHaveCount(0, { timeout: 15000 });

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
