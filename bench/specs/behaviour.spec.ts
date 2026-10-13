// Original — Frictionborn Motion behaviour spec
import { test, expect } from "@playwright/test";
import { recordMeasurement } from "../record-measurement.ts";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Behaviour probe verification", () => {
  test(`renders ${item} item and measures idle frame activity and CLS`, async ({ page }) => {
    await page.goto(`/items/${item}`);
    await page.waitForSelector(`[data-frictionborn-item='${item}']`, { state: "attached" });

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

    const cls = stats.perfStats?.cls ?? 0;
    recordMeasurement(item, { cls });
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
    const offscreenFrames = stats?.offscreenFrames ?? 0;
    expect(offscreenFrames).toBe(0);
    recordMeasurement(item, { framesWhenIdle: { offscreen: offscreenFrames } });
  });

  test("suspends animation and emits 0 frames when tab is hidden", async ({ page }) => {
    await page.goto(`/items/${item}`);
    await page.waitForSelector(`[data-frictionborn-item='${item}']`, { state: "attached" });
    await page.waitForTimeout(500);

    // Simulate tab becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, writable: true, configurable: true });
      Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      window.__FB_PROBES__?.frameCounter.reset();
    });

    await page.waitForTimeout(1000);

    const stats = await page.evaluate(() => window.__FB_PROBES__?.frameCounter.getStats());
    const hiddenFrames = stats?.hiddenTabFrames ?? 0;
    expect(hiddenFrames).toBe(0);
    recordMeasurement(item, { framesWhenIdle: { hiddenTab: hiddenFrames } });
  });
});
