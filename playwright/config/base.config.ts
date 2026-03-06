import path from "path";
import { defineConfig } from "@playwright/test";

const rootDir = process.cwd();

export const baseConfig = defineConfig({
  globalSetup: path.resolve(rootDir, "playwright/global-setup.ts"),
  testDir: path.resolve(rootDir, "playwright/tests"),
  outputDir: path.resolve(rootDir, "test-results"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/results.xml" }],
    ["list"]
  ],
  use: {
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  timeout: 60000,
  expect: { timeout: 10000 }
});
