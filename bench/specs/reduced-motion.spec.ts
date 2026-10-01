// Original — Frictionborn Motion reduced motion spec
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Reduced motion spec", () => {
  test.use({ colorScheme: "dark" });

  test("enforces reduced motion mode without leaked motion frames", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/items/${item}`);
    await page.waitForSelector(`[data-frictionborn-item='${item}']`);

    await page.waitForTimeout(500);
    // Reset probe after initial page load settle
    await page.evaluate(() => window.__FB_PROBES__?.frameCounter.reset());
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        frameStats: p?.frameCounter.getStats(),
        animStats: p?.animationProbe.getStats(),
      };
    });

    // 0 running animations and 0 reducedMotion frames
    expect(metrics.frameStats?.reducedMotionFrames).toBe(0);
    expect(metrics.animStats?.runningCount).toBe(0);
  });
});
