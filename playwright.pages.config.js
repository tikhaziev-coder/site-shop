import { defineConfig } from '@playwright/test';

const remote = process.env.PAGES_URL;
export default defineConfig({
  testDir: './tests',
  testMatch: '**/pages.spec.js',
  workers: 1,
  reporter: 'list',
  use: { baseURL: remote || 'http://127.0.0.1:4175/site-shop/', channel: 'msedge', headless: true },
  webServer: remote ? undefined : { command: 'node build.mjs && node preview-pages.mjs', url: 'http://127.0.0.1:4175/site-shop/', reuseExistingServer: false },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ]
});
