// Original — Frictionborn Motion reduced motion spec
import { test, expect } from "@playwright/test";

test.describe("Reduced motion spec", () => {
  test.use({ colorScheme: "dark" });

  test("enforces reduced motion mode 'static' without leaked motion frames", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/items/dummy");
    await page.waitForSelector("[data-frictionborn-item='dummy']");

    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      const p = window.__FB_PROBES__;
      return {
        frameStats: p?.frameCounter.getStats(),
        animStats: p?.animationProbe.getStats(),
      };
    });

    // Dummy mode is static: 0 running animations and 0 reducedMotion frames
    expect(metrics.frameStats?.reducedMotionFrames).toBe(0);
    expect(metrics.animStats?.runningCount).toBe(0);
  });
});
