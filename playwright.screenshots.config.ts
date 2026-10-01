// Original — Frictionborn Motion Playwright config for explicit docs screenshots (pnpm screenshots)
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./bench/screenshots",
  timeout: 45000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100" },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
      },
    },
  ],
  webServer: {
    command: "npx next dev bench/harness -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
