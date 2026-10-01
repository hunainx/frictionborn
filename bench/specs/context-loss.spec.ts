// Original — Frictionborn Motion context-loss and lease-budget spec (PRD 6.1)
import { test, expect } from "@playwright/test";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("WebGL context loss and lease budget", () => {
  test.skip(item !== "noise-field", "WebGL item only");
  test.skip(({ browserName }) => browserName !== "chromium", "WEBGL_lose_context needs a WebGL2 browser (Chromium + SwiftShader)");

  test("context loss falls back to the poster; restore resumes the canvas", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      (window as any).__gls = [];
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: any[]) {
        const ctx = (original as any).call(this, type, ...args);
        if (type === "webgl2" && ctx) (window as any).__gls.push(ctx);
        return ctx;
      } as any;
    });
    await page.goto(`/items/${item}?tier=3`);
    const canvas = page.locator(`[data-frictionborn-item='${item}'] canvas`);
    await expect(canvas).toHaveCount(1, { timeout: 10000 });

    await page.evaluate(() => {
      const gl = (window as any).__gls[(window as any).__gls.length - 1];
      (window as any).__ext = gl.getExtension("WEBGL_lose_context");
      (window as any).__ext.loseContext();
    });
    // Poster only: the lost canvas is hidden from view
    await expect(canvas.first()).toBeHidden();

    await page.evaluate(() => (window as any).__ext.restoreContext());
    await expect(page.locator(`[data-frictionborn-item='${item}'] canvas`)).toHaveCount(1);
    await expect(page.locator(`[data-frictionborn-item='${item}'] canvas`).first()).toBeVisible({ timeout: 10000 });
  });
});
