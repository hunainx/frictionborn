// Original — Frictionborn Motion reduced motion spec
import { test, expect } from "@playwright/test";
import { recordMeasurement } from "../record-measurement.ts";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("Reduced motion spec", () => {
  test.use({ colorScheme: "dark" });

  test("enforces reduced motion mode without leaked motion frames", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/items/${item}`);
    await page.waitForSelector(`[data-frictionborn-item='${item}']`, { state: "attached" });

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
    const rmFrames = metrics.frameStats?.reducedMotionFrames ?? 0;
    expect(rmFrames).toBe(0);
    expect(metrics.animStats?.runningCount).toBe(0);

    // Decision D-A: WebGL items must render poster only (0 canvases, static mode)
    if (["noise-field", "particle-field", "mesh-gradient", "distortion-image", "ambient-hero"].includes(item)) {
      const canvasCount = await page.locator("canvas").count();
      expect(canvasCount).toBe(0);
      await expect(page.locator("[data-frictionborn-poster]").first()).toBeVisible();
    }

    recordMeasurement(item, { framesWhenIdle: { reducedMotion: rmFrames } });
  });
});
