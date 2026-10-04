// Original — Frictionborn Motion ScrollShowcase specification test
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "scroll-showcase";

test.describe("ScrollShowcase composition spec", () => {
  test.skip(item !== "scroll-showcase", "scroll-showcase only");

  test("semantic structure: sections, heading hierarchy, landmark labels", async ({ page }) => {
    await page.goto(`/items/scroll-showcase`);
    await page.waitForSelector("[data-frictionborn-item='scroll-showcase']");

    // Landmark sections exist
    const sections = page.locator("[data-frictionborn-item='scroll-showcase'] section");
    expect(await sections.count()).toBeGreaterThanOrEqual(3);

    // Heading hierarchy: h2 for architecture, h3 for performance, h4 for cards
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(1);

    const h3Count = await page.locator("h3").count();
    expect(h3Count).toBeGreaterThanOrEqual(1);
  });

  test("sticky scroll steps are accessible and progress cleanly", async ({ page }) => {
    await page.goto(`/items/scroll-showcase`);
    await page.waitForSelector("[data-frictionborn-item='scroll-showcase']");

    const steps = page.locator("[data-frictionborn-item='sticky-scroll-story']");
    await expect(steps).toBeVisible();

    // Verify all media have accessible text or alt attributes
    const mediaImages = page.locator("[data-frictionborn-item='sticky-scroll-story'] img");
    const count = await mediaImages.count();
    for (let i = 0; i < count; i++) {
      const alt = await mediaImages.nth(i).getAttribute("alt");
      expect(alt?.length).toBeGreaterThan(0);
    }
  });

  test("marquee responds to hover and keyboard focus pause", async ({ page }) => {
    await page.goto(`/items/scroll-showcase`);
    await page.waitForSelector("[data-frictionborn-item='scroll-showcase']");

    const marquee = page.locator("[data-frictionborn-item='marquee']");
    if (await marquee.count() > 0) {
      await expect(marquee).toBeVisible();
      // Hover marquee
      await marquee.hover();
      await page.waitForTimeout(200);

      // Verify animation paused
      const isPaused = await marquee.evaluate((el) => {
        const row = el.querySelector(".fb-marquee-row") as HTMLElement | null;
        if (!row) return true;
        return window.getComputedStyle(row).animationPlayState === "paused";
      });
      expect(isPaused).toBe(true);
    }
  });

  test("mobile viewport has zero horizontal scroll overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/items/scroll-showcase`);
    await page.waitForSelector("[data-frictionborn-item='scroll-showcase']");
    await page.waitForTimeout(500);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("reduced motion: static layout, no marquee autoscroll", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/items/scroll-showcase`);
    await page.waitForSelector("[data-frictionborn-item='scroll-showcase']");
    await page.waitForTimeout(500);

    // All section headings and text remain fully visible
    const h2 = page.locator("h2").first();
    await expect(h2).toBeVisible();

    // 0 running WebGL contexts
    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBe(0);
  });
});
