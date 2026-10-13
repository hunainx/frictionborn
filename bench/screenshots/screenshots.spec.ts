// Original — Frictionborn Motion screenshot capture spec
import { test, type Page } from "@playwright/test";
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
  "particle-field",
  "mesh-gradient",
  "distortion-image",
  "ambient-hero",
  "scroll-showcase",
  "ash-text",
  "eclipse-switch",
  "ember-badge",
  "firework-rating",
  "flame-switch",
  "flint-button",
  "fuse-toast",
  "hold-to-confirm",
  "lantern-sky",
  "light-leak-tabs",
  "match-progress",
  "temper-slider",
];

async function captureWebp(page: Page, outPath: string): Promise<void> {
  const client = await page.context().newCDPSession(page);
  const { data } = await client.send("Page.captureScreenshot", { format: "webp", quality: 80 });
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
}

test.describe("Capture component screenshots", () => {
  for (const item of items) {
    const outDir = path.resolve(process.cwd(), `docs/screenshots/${item}`);
    fs.mkdirSync(outDir, { recursive: true });

    test(`captures ${item} desktop preview (1440x900)`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/items/${item}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`);
      await page.waitForTimeout(1000);
      await captureWebp(page, path.join(outDir, "desktop.webp"));
    });

    test(`captures ${item} mobile preview (390x844)`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/items/${item}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`);
      await page.waitForTimeout(1000);
      await captureWebp(page, path.join(outDir, "mobile.webp"));
    });

    test(`captures ${item} reduced motion preview (1440x900)`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/items/${item}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`);
      await page.waitForTimeout(1000);
      await captureWebp(page, path.join(outDir, "reduced-motion.webp"));
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
      await captureWebp(page, path.join(outDir, "light.webp"));
    });

    test(`captures ${item} dark mode preview (1440x900)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/items/${item}`);
      await page.waitForSelector(`[data-frictionborn-item='${item}']`);
      await page.evaluate(() => {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      });
      await page.waitForTimeout(1000);
      await captureWebp(page, path.join(outDir, "dark.webp"));
    });
  }

  test("captures fresh Next 16 install preview", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/items/noise-field");
    await page.waitForSelector("[data-frictionborn-item='noise-field']");
    await page.waitForTimeout(1000);
    await captureWebp(page, path.resolve(process.cwd(), "docs/audit/install-next16.webp"));
  });

  test("captures fresh Vite install preview", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/items/text-reveal");
    await page.waitForSelector("[data-frictionborn-item='text-reveal']");
    await page.waitForTimeout(1000);
    await captureWebp(page, path.resolve(process.cwd(), "docs/audit/install-vite.webp"));
  });
});
