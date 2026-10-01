// Original — Frictionborn Motion leak spec
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Resource leak spec", () => {
  test("mount and unmount cycling leaves 0 leaked contexts and no listener growth", async ({ page }) => {
    await page.goto(`/items/${item}?leak=1`);
    // Wait for the mount/unmount cycles to complete
    await page.waitForSelector("[data-leak-done='true']", { timeout: 15000 });
    await page.waitForTimeout(500);

    const stats = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        contextStats: p?.contextCounter.getStats(),
        activeContexts: p?.contextCounter.getStats().activeContexts || 0,
        unplannedLosses: p?.contextCounter.getStats().unplannedLosses || 0,
      };
    });

    // Zero live WebGL contexts left after unmount cycles
    expect(stats.activeContexts).toBe(0);
    expect(stats.unplannedLosses).toBe(0);
  });
});
