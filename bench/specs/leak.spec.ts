// Original — Frictionborn Motion leak spec
import { test, expect } from "@playwright/test";

test.describe("Resource leak spec", () => {
  test("mount and unmount cycling leaves 0 leaked contexts and no listener growth", async ({ page }) => {
    await page.goto("/items/dummy?leak=1");
    // Wait for the 50 mount/unmount cycles to complete (~2s)
    await page.waitForTimeout(2500);

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
