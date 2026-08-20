const { test, expect } = require('@playwright/test');

// Keep auth state across tests
const fs = require('fs');
if (fs.existsSync('e2e/.auth.json')) {
  test.use({ storageState: 'e2e/.auth.json' });
}

test.describe('UI Sweep E2E tests', () => {
  const BASE_URL = process.env.BASE_URL;
  if (!BASE_URL) {
    throw new Error('BASE_URL environment variable is required (e.g., https://script.google.com/macros/s/.../dev)');
  }

  const VIEWPORTS = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Desktop', width: 1280, height: 800 }
  ];

  const VIEWS = [
    { name: 'Dashboard', navItem: '대시보드' },
    { name: 'Members', navItem: '회원 관리' },
    { name: 'Workout', navItem: '운동 기록' },
    { name: 'Reward', navItem: '리워드 관리' },
    { name: 'Log', navItem: '시스템 로그' }
  ];

  VIEWPORTS.forEach(viewport => {
    test.describe(`Viewport: ${viewport.name}`, () => {
      // For this block we merge viewport settings with any global ones (like storageState)
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test('takes screenshots of all main views', async ({ page }) => {
        await page.goto(BASE_URL);

        // Wait for user to login manually if they pass PWDEBUG=1 or --debug.
        if (process.env.PWDEBUG || process.env.PLAYWRIGHT_DEBUG) {
          await page.pause();
          await page.context().storageState({ path: 'e2e/.auth.json' });
        }

        // Google Apps Script usually wraps Web Apps in two layers of iframes:
        // 1. The outer iframe (has the Apps Script banner)
        // 2. The inner iframe (id="userHtmlFrame" or sandboxFrame)
        // Playwright needs to drill down through them, or we can just grab the actual app iframe if it's deeply nested.

        // Wait for the main iframe to be attached
        await page.waitForSelector('iframe', { timeout: 30000 });

        // We can access the deepest iframe by filtering for the one that actually contains our app
        // However, standard GAS apps typically have: body > iframe > #userHtmlFrame (another iframe)
        // Let's try locating the iframe that has our #app element inside it.
        const getAppFrame = async () => {
           const allFrames = page.frames();
           // Find the frame that has #app
           for (const frame of allFrames) {
              const appElement = await frame.$('#app').catch(() => null);
              if (appElement) return frame;
           }
           return null;
        };

        // Wait until we find the frame with #app
        let appFrame = null;
        const maxWait = 60000;
        const interval = 1000;
        let elapsed = 0;

        while (!appFrame && elapsed < maxWait) {
          appFrame = await getAppFrame();
          if (!appFrame) {
             await page.waitForTimeout(interval);
             elapsed += interval;
          }
        }

        if (!appFrame) {
          throw new Error('Could not find iframe containing #app within timeout.');
        }

        // Try waiting for the app to be mounted inside the found frame
        await expect(appFrame.locator('#app')).toBeVisible({ timeout: 15000 });
        await expect(appFrame.locator('.loading-card')).toHaveCount(0, { timeout: 30000 });

        for (const view of VIEWS) {
          if (viewport.name === 'Mobile') {
            const navBtn = appFrame.locator(`.md\\:hidden button:has-text("${view.navItem}")`).first();
            await expect(navBtn).toBeVisible({ timeout: 5000 });
            await navBtn.click();
          } else {
            const navBtn = appFrame.locator(`nav.hidden.md\\:flex button:has-text("${view.navItem}")`).first();
            await expect(navBtn).toBeVisible({ timeout: 5000 });
            await navBtn.click();
          }

          await page.waitForTimeout(1000);
          await page.screenshot({ path: `e2e/screenshots/${viewport.name}-${view.name}.png`, fullPage: true });
        }
      });
    });
  });
});
