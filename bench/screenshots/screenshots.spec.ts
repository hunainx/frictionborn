// Original — Frictionborn Motion screenshot capture spec
import { test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

test.describe("Capture component screenshots", () => {
  const outDir = path.resolve(process.cwd(), "docs/screenshots/noise-field");
  fs.mkdirSync(outDir, { recursive: true });

  test("captures desktop preview (light mode) (1440x900)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/items/noise-field");
    await page.waitForSelector("[data-frictionborn-item='noise-field']");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "desktop-light.png") });
    await page.screenshot({ path: path.join(outDir, "desktop.png") });
  });

  test("captures desktop preview (dark mode) (1440x900)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/items/noise-field");
    await page.waitForSelector("[data-frictionborn-item='noise-field']");
    const themeBtn = page.locator("button:has-text('Theme:')");
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(outDir, "desktop-dark.png") });
    await page.screenshot({ path: path.join(outDir, "dark.png") });
  });

  test("captures mobile preview (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/items/noise-field");
    await page.waitForSelector("[data-frictionborn-item='noise-field']");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "mobile.png") });
  });

  test("captures reduced motion preview (1440x900)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/items/noise-field");
    await page.waitForSelector("[data-frictionborn-item='noise-field']");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "reduced-motion.png") });
  });
});
