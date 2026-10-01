// Original — Frictionborn Motion behaviour spec
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Behaviour probe verification", () => {
  test(`renders ${item} item and measures idle frame activity`, async ({ page }) => {
    await page.goto(`/items/${item}`);
    await page.waitForSelector(`[data-frictionborn-item='${item}']`);

    // Settle for 500ms
    await page.waitForTimeout(500);

    // Read probe metrics
    const stats = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        frameStats: p?.frameCounter.getStats(),
        contextStats: p?.contextCounter.getStats(),
        perfStats: p?.perfObserver.getStats(),
      };
    });

    expect(stats.frameStats).toBeDefined();
    // Context count should match declared (<= 1 context for noise-field)
    expect(stats.contextStats?.activeContexts).toBeLessThanOrEqual(1);
    expect(stats.contextStats?.unplannedLosses).toBe(0);
  });

  test("respects offscreen positioning and does not leak frames", async ({ page }) => {
    await page.goto(`/items/${item}?offscreen=1`);
    await page.waitForTimeout(500);

    // Reset probe after initial page load settle
    await page.evaluate(() => window.__FB_PROBES__?.frameCounter.reset());
    await page.waitForTimeout(1000);

    const stats = await page.evaluate(() => window.__FB_PROBES__?.frameCounter.getStats());
    expect(stats).toBeDefined();
    // No loops or running animations should trigger when off-screen
    expect(stats?.offscreenFrames).toBe(0);
  });
});
