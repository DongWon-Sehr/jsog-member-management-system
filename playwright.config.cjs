const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 300000,
  use: {
    // Some Google auth checks flag the default Chromium/Chrome when launched by Playwright
    // We pass additional launch arguments to mask the automation flags.
    channel: 'chrome',
    headless: false,
    launchOptions: {
      args: [
        '--disable-blink-features=AutomationControlled', // This is the crucial flag to bypass Google's automation detection
        '--start-maximized'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    },
    // Don't set a hardcoded userAgent as it can cause mismatch fingerprinting.
    // Just let Chrome use its default.
  },
  projects: [
    {
      name: 'GoogleLoginAllowed',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
