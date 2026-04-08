import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 20_000,
    ignoreHTTPSErrors: true,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173",
  },
});
