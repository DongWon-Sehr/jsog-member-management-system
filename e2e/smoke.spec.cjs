const { test, expect } = require('@playwright/test');
const fs = require('fs');

if (fs.existsSync('e2e/.auth.json')) {
  test.use({ storageState: 'e2e/.auth.json' });
}

const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  throw new Error('BASE_URL environment variable is required (e.g., https://script.google.com/macros/s/.../dev)');
}

const GAS_BANNER_HEIGHT = 100;
const MAX_CAPTURE_HEIGHT = 12000;

const VIEWPORTS = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Desktop', width: 1280, height: 800 }
];

// Row clicks open edit modals populated with real data; header buttons open the rest
const VIEWS = [
  { name: 'Dashboard', navItem: '대시보드', modals: [] },
  {
    name: 'Members', navItem: '회원 관리', modals: [
      { name: 'MemberEdit', trigger: f => f.locator('div.cursor-pointer').first() }
    ]
  },
  {
    name: 'Workout', navItem: '운동 기록', modals: [
      { name: 'WeekPlanner', trigger: f => f.locator('button[title="연간 주차 셋업"]') },
      { name: 'WeekPlannerCalendar', trigger: f => f.locator('button[title="연간 주차 셋업"]'), after: f => f.locator('button[title="달력 뷰로 보기"]').click() },
      // Click the name corner: the row center holds a super-pass toggle with @click.stop
      { name: 'WorkoutLog', trigger: f => f.locator('#workout-capture-area div.cursor-pointer').first(), clickPosition: { x: 30, y: 25 } }
    ]
  },
  {
    name: 'Reward', navItem: '리워드 관리', modals: [
      { name: 'Recommendation', trigger: f => f.locator('button:has-text("추천 받기")') },
      { name: 'RewardEdit', trigger: f => f.locator('div.cursor-pointer').first(), fallback: f => f.locator('button:has-text("지급 등록")') }
    ]
  },
  {
    name: 'Log', navItem: '시스템 로그', modals: [
      { name: 'LogDetail', trigger: f => f.locator('div.cursor-pointer').first() }
    ]
  }
];

// The app scrolls inside GAS's nested iframe, so fullPage alone captures a single
// viewport; grow the viewport to the content height (incl. open modal panels) instead
async function captureFullContent(page, appFrame, path, baseViewport) {
  for (let i = 0; i < 3; i++) {
    const contentHeight = await appFrame.evaluate(() => {
      let max = document.documentElement.scrollHeight;
      document.querySelectorAll('.fixed, .fixed *').forEach(el => {
        max = Math.max(max, el.scrollHeight);
      });
      return max;
    });
    const target = Math.min(contentHeight + GAS_BANNER_HEIGHT, MAX_CAPTURE_HEIGHT);
    if (page.viewportSize().height >= target) break;
    await page.setViewportSize({ width: baseViewport.width, height: target });
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path, fullPage: true });
  await page.setViewportSize(baseViewport);
  await page.waitForTimeout(300);
}

async function findAppFrame(page) {
  await page.waitForSelector('iframe', { timeout: 30000 });
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const appElement = await frame.$('#app').catch(() => null);
      if (appElement) return frame;
    }
    await page.waitForTimeout(1000);
  }
  throw new Error('Could not find iframe containing #app within timeout.');
}

VIEWPORTS.forEach(viewport => {
  test.describe(`Viewport: ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('captures all views and modals at full height', async ({ page }) => {
      await page.goto(BASE_URL);

      // Manual login escape hatch: run with PWDEBUG=1 to refresh e2e/.auth.json
      if (process.env.PWDEBUG || process.env.PLAYWRIGHT_DEBUG) {
        await page.pause();
        await page.context().storageState({ path: 'e2e/.auth.json' });
      }

      const appFrame = await findAppFrame(page);
      await expect(appFrame.locator('#app')).toBeVisible({ timeout: 15000 });
      await expect(appFrame.locator('.loading-card')).toHaveCount(0, { timeout: 30000 });

      const baseViewport = { width: viewport.width, height: viewport.height };

      for (const view of VIEWS) {
        // Scope to the viewport's own nav: hidden GAS template markup and the other
        // breakpoint's nav duplicate every button label
        const navScope = viewport.name === 'Mobile' ? '.md\\:hidden' : 'nav.hidden.md\\:flex';
        const navBtn = appFrame.locator(`${navScope} button:has-text("${view.navItem}")`).first();
        await expect(navBtn).toBeVisible({ timeout: 5000 });
        await navBtn.click();
        await page.waitForTimeout(1000);

        await captureFullContent(page, appFrame, `e2e/screenshots/${viewport.name}-${view.name}.png`, baseViewport);

        // Mobile headers ship collapsed; expand to reach the modal trigger buttons
        const expandBtn = appFrame.locator('button[title="메뉴 펼치기"] >> visible=true');
        if (await expandBtn.count()) {
          await expandBtn.click();
          await page.waitForTimeout(400);
          await captureFullContent(page, appFrame, `e2e/screenshots/${viewport.name}-${view.name}-Expanded.png`, baseViewport);
        }

        for (const modal of view.modals) {
          let trigger = modal.trigger(appFrame);
          if (modal.fallback && (await trigger.count()) === 0) trigger = modal.fallback(appFrame);
          if ((await trigger.count()) === 0) {
            console.warn(`[skip] ${viewport.name}-${view.name}-${modal.name}: trigger not found`);
            continue;
          }

          const overlay = appFrame.locator('div.fixed >> visible=true');
          const clickOpts = { timeout: 10000, position: modal.clickPosition };
          for (let attempt = 0; attempt < 3 && !(await overlay.count()); attempt++) {
            await trigger.scrollIntoViewIfNeeded();
            if (attempt === 0) {
              await trigger.click(clickOpts).catch(() => {});
            } else {
              // DOM-level click bypasses hit-testing when sticky headers or overlays cover the point
              await trigger.evaluate(el => el.click()).catch(() => {});
            }
            await page.waitForTimeout(800);
          }
          if (!(await overlay.count())) {
            console.warn(`[skip] ${viewport.name}-${view.name}-${modal.name}: modal did not open`);
            continue;
          }

          if (modal.after) {
            await modal.after(appFrame);
            await page.waitForTimeout(500);
          }

          await captureFullContent(page, appFrame, `e2e/screenshots/${viewport.name}-${view.name}-${modal.name}.png`, baseViewport);

          // Hidden GAS template markup duplicates modal buttons, so match visible ones only
          const closeBtn = appFrame.locator('button:has-text("닫기") >> visible=true').last();
          if (await closeBtn.count()) {
            await closeBtn.click({ timeout: 5000 }).catch(() => {});
          }
          await expect(overlay).toHaveCount(0, { timeout: 5000 }).catch(() => {});
        }
      }
    });
  });
});
