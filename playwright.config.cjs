const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 120000,
  use: {
    // Avoid automated browser signatures so Google doesn't block the login
    channel: 'chrome', // Use actual Chrome installed on the OS
    headless: false,   // Must run headed to pass Google's security checks and allow manual login
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  projects: [
    {
      name: 'GoogleLoginAllowed',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
