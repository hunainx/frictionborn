// Original — Frictionborn Motion context-loss and lease-budget spec (PRD 6.1)
import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("WebGL context loss and lease budget", () => {
  test.skip(!["noise-field", "particle-field", "mesh-gradient"].includes(item), "WebGL item only");
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
      const gls = (window as any).__gls || [];
      const gl = gls.find((g: any) => g.canvas.isConnected) || gls[gls.length - 1];
      const ext = gl.getExtension("WEBGL_lose_context");
      (window as any).__ext = ext;
      ext.loseContext();
    });
    // Poster only: the lost canvas is hidden from view
    await expect(canvas.first()).toBeHidden();

    await page.evaluate(() => (window as any).__ext.restoreContext());
    await expect(page.locator(`[data-frictionborn-item='${item}'] canvas`)).toHaveCount(1);
    await expect(page.locator(`[data-frictionborn-item='${item}'] canvas`).first()).toBeVisible({ timeout: 10000 });

    // "Visible" is not "resumed": a restored but never re-initialised canvas is visible and blank (Paper does
    // not handle webglcontextrestored). The pixels must change again.
    const restored = page.locator(`[data-frictionborn-item='${item}'] canvas`).first();
    const hash = (b: Buffer) => createHash("md5").update(b).digest("hex").slice(0, 8);
    await expect
      .poll(
        async () => {
          const f0 = await page.evaluate(() => window.__FB_PROBES__?.frameCounter.getStats().totalFrames ?? -1);
          const a = await restored.screenshot();
          await page.waitForTimeout(400);
          const b = await restored.screenshot();
          const f1 = await page.evaluate(() => window.__FB_PROBES__?.frameCounter.getStats().totalFrames ?? -1);
          // Diagnostics for slow CI runners: frames requested and the screenshot hashes of each attempt
          console.log(`[context-loss ${item}] rAF +${f1 - f0}, shots ${hash(a)} ${hash(b)} (${a.length} B)`);
          return a.equals(b);
        },
        { timeout: 10000, message: "canvas must be animating again after the context is restored" }
      )
      .toBe(false);
  });
});
