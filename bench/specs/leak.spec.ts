// Original — Frictionborn Motion leak spec
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

// Items whose demo creates a context on mount, so the cycles below create real contexts. DistortionImage only creates
// one on hover/focus: its leak cycles live in distortion-image.spec.ts, where every cycle acquires leases first.
const CONTEXT_ON_MOUNT_ITEMS = ["noise-field", "particle-field", "mesh-gradient"];

test.describe("Resource leak spec", () => {
  test("mount and unmount cycling leaves 0 leaked contexts and no listener growth", async ({ page }, testInfo) => {
    // TESTING.md §3 requires 50 mount/unmount cycles for exact leak proof.
    // Run full 50 cycles on primary desktop projects (chromium-desktop + webkit-desktop);
    // run 25 cycles on mobile and fallback projects to prevent CI timeout pressure on 2-vCPU runners (Decision 23).
    const isFullSpec = ["chromium-desktop", "webkit-desktop"].includes(testInfo.project.name);
    const cycles = isFullSpec ? 50 : 25;
    test.setTimeout(120_000);
    await page.goto(`/items/${item}?leak=1&tier=2&cycles=${cycles}`);

    // Wait for the mount/unmount cycles to complete
    await page.waitForSelector("[data-leak-done='true']", { timeout: 110_000 });
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

    // A leak spec that never creates anything passes trivially. Require that contexts were clearly created
    // (Chromium has WebGL on every project; how many of the 16 ms cycles get as far as a context depends on the
    // runner, 21 to 49 of 50 observed, so this asks for 'clearly non-zero', not a ratio).
    if (testInfo.project.name.startsWith("chromium") && CONTEXT_ON_MOUNT_ITEMS.includes(item)) {
      expect(stats.contextStats?.totalCreated ?? 0).toBeGreaterThanOrEqual(5);
    }

    // Zero live WebGL contexts left after unmount cycles
    expect(stats.activeContexts).toBe(0);
    expect(stats.unplannedLosses).toBe(0);

    // Verify no high-frequency listener accumulation occurred on DOM targets from the component
    // (React 19 framework delegates at window/document are constant baseline of 6, component must add 0)
    const componentLeaks = Math.max(0, (stats.listenerStats?.potentialLeaks || 0) - 6);
    expect(componentLeaks).toBe(0);
  });
});
