// Original — Frictionborn Motion screenshot capture spec
import { test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const items = ["noise-field", "text-reveal", "scroll-reveal", "magnetic-button", "marquee"];

test.describe("Capture component screenshots", () => {
  for (const item of items) {
    const outDir = path.resolve(process.cwd(), `docs/screenshots/${item}`);
    fs.mkdirSync(outDir, { recursive: true });

    test(`captures ${item} desktop preview (1440x900)`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/items/${item}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, "desktop.png") });
    });

    test(`captures ${item} mobile preview (390x844)`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/items/${item}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, "mobile.png") });
    });

    test(`captures ${item} reduced motion preview (1440x900)`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/items/${item}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, "reduced-motion.png") });
    });
  }
});
