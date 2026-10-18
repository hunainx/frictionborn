// Original — Frictionborn Motion DPR cap spec (DESIGN A4 / Decision 15: T2 <= 1.5, T3 <= 2)
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("WebGL pixel-ratio caps", () => {
  test.skip(!["noise-field", "particle-field", "mesh-gradient", "ember-core"].includes(item), "WebGL item only");

  for (const [tier, cap] of [
    [2, 1.5],
    [3, 2],
  ] as const) {
    test(`tier ${tier} renders at <= ${cap}x device pixels`, async ({ page }) => {
      await page.goto(`/items/${item}?tier=${tier}`);
      const canvas = page.locator(`[data-frictionborn-item='${item}'] canvas`).first();
      const hasCanvas = await canvas.waitFor({ state: "attached", timeout: 8000 }).then(() => true, () => false);
      // No WebGL2 in this browser (e.g. headless Firefox on CI): the poster path is covered elsewhere
      test.skip(!hasCanvas, "no WebGL canvas in this browser");
      await page.waitForTimeout(1000); // let Paper's ResizeObserver settle
      const { ratio, dpr } = await canvas.evaluate((c: HTMLCanvasElement) => ({
        ratio: c.width / Math.max(1, c.clientWidth),
        dpr: window.devicePixelRatio,
      }));
      expect(ratio, `canvas ratio at DPR ${dpr}`).toBeLessThanOrEqual(cap + 0.02);
    });
  }
});
