import { defineConfig } from "@playwright/test";
import { baseConfig } from "./base.config";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL,
    video: "off"
  },
  webServer: {
    command: "npm run dev:web -- --host",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
