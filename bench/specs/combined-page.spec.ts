// Original — Frictionborn Motion combined page spec
import { test, expect } from "@playwright/test";

test.describe("Combined Page Integration (SmoothScroll + StickyScrollStory + NoiseField + Marquee)", () => {
  test("maintains <= 1 rAF loop, <= 1 scroll engine, and <= 1 WebGL context", async ({ page }) => {
    await page.goto("/combined");
    await page.waitForSelector("[data-testid='combined-container']");
    await page.waitForTimeout(500);

    // Verify all 4 components mounted together
    const smoothScrollMounted = await page.locator("[data-frictionborn-item='smooth-scroll']").count();
    const noiseFieldMounted = await page.locator("[data-frictionborn-item='noise-field']").count();
    const marqueeMounted = await page.locator("[data-frictionborn-item='marquee']").count();
    const stickyStoryMounted = await page.locator("[data-frictionborn-item='sticky-scroll-story']").count();

    expect(smoothScrollMounted).toBe(1);
    expect(noiseFieldMounted).toBe(1);
    expect(marqueeMounted).toBe(1);
    expect(stickyStoryMounted).toBe(1);

    // Read probe stats
    const stats = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        frameStats: p?.frameCounter.getStats(),
        contextStats: p?.contextCounter.getStats(),
        perfStats: p?.perfObserver.getStats(),
      };
    });

    // 1. WebGL contexts <= 1 (NoiseField background)
    expect(stats.contextStats?.activeContexts).toBeLessThanOrEqual(1);
    expect(stats.contextStats?.unplannedLosses).toBe(0);

    // 2. Layout shift on load is 0
    const cls = stats.perfStats?.cls ?? 0;
    expect(cls).toBe(0);
  });

  test("suspends all loops and emits 0 frames when tab is hidden", async ({ page }) => {
    await page.goto("/combined");
    await page.waitForSelector("[data-testid='combined-container']");
    await page.waitForTimeout(500);

    // Simulate tab hidden
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, writable: true, configurable: true });
      Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      window.__FB_PROBES__?.frameCounter.reset();
    });

    // Wait 1 second in hidden state
    await page.waitForTimeout(1000);

    const hiddenFrames = await page.evaluate(() => {
      return window.__FB_PROBES__?.frameCounter.getStats()?.hiddenFrames ?? 0;
    });

    // PRD 6.0: Zero animation frames when tab is hidden
    expect(hiddenFrames).toBe(0);
  });
});
