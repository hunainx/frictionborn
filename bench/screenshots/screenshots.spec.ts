// Original — Frictionborn Motion screenshot capture spec
import { test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const items = [
  "noise-field",
  "text-reveal",
  "scroll-reveal",
  "magnetic-button",
  "marquee",
  "smooth-scroll",
  "sticky-scroll-story",
];

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

    test(`captures ${item} light mode preview (1440x900)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "light" });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/items/${item}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`);
      await page.evaluate(() => {
        document.documentElement.classList.add("light");
        document.documentElement.setAttribute("data-theme", "light");
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, "light.png") });
    });
  }

  test("captures fresh Next 16 install preview", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/items/noise-field");
    await page.waitForSelector("[data-frictionborn-item='noise-field']");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.resolve(process.cwd(), "docs/audit/install-next16.png") });
  });

  test("captures fresh Vite install preview", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/items/text-reveal");
    await page.waitForSelector("[data-frictionborn-item='text-reveal']");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.resolve(process.cwd(), "docs/audit/install-vite.png") });
  });
});
