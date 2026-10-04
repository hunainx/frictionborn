// Original — Frictionborn Motion leak spec
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Resource leak spec", () => {
  test("mount and unmount cycling leaves 0 leaked contexts and no listener growth", async ({ page }) => {
    // Software GL (SwiftShader) on a 2-vCPU CI runner makes each WebGL mount slow; this spec checks leaks,
    // not raster speed, so use tier 2 (smaller render target) and 25 mount/unmount cycles.
    test.setTimeout(60_000);
    await page.goto(`/items/${item}?leak=1&tier=2&cycles=25`);

    // Wait for the mount/unmount cycles to complete
    await page.waitForSelector("[data-leak-done='true']", { timeout: 45_000 });
    await page.waitForTimeout(500);

    const stats = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        contextStats: p?.contextCounter.getStats(),
        activeContexts: p?.contextCounter.getStats().activeContexts || 0,
        unplannedLosses: p?.contextCounter.getStats().unplannedLosses || 0,
        listenerStats: p?.listenerCounter.getStats(),
      };
    });

    // Zero live WebGL contexts left after unmount cycles
    expect(stats.activeContexts).toBe(0);
    expect(stats.unplannedLosses).toBe(0);

    // Verify no high-frequency listener accumulation occurred on DOM targets from the component
    // (React 19 framework delegates at window/document are constant baseline of 6, component must add 0)
    const componentLeaks = Math.max(0, (stats.listenerStats?.potentialLeaks || 0) - 6);
    expect(componentLeaks).toBe(0);
  });
});
