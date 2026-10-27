// Original — Frictionborn Motion context-loss and lease-budget spec (PRD 6.1)
import { test, expect } from "@playwright/test";
import { needsGpuForTier3 } from "../tier-guard.ts";

const item = process.env.BENCH_ITEM || "noise-field";

test.describe("WebGL context loss and lease budget", () => {
  test.skip(!["noise-field", "particle-field", "mesh-gradient", "ember-core"].includes(item), "WebGL item only");
  test.skip(({ browserName }) => browserName !== "chromium", "WEBGL_lose_context needs a WebGL2 browser (Chromium + SwiftShader)");

  test("context loss falls back to the poster; restore resumes the canvas", async ({ page }) => {
    if (item === "ember-core") await needsGpuForTier3(page);
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
    // not handle webglcontextrestored). The pixels must change again. Pixels are read in-page, right after the
    // app's own draw in the same frame (before compositing, so the drawing buffer is still valid): an element
    // screenshot needs a full composited frame and took longer than 10 s under SwiftShader on 2-vCPU CI.
    const sample = () =>
      page.evaluate(
        () =>
          new Promise<string>((resolve) => {
            requestAnimationFrame(() => {
              const canvas = document.querySelector("[data-frictionborn-item] canvas") as HTMLCanvasElement | null;
              const gl = ((window as any).__gls || []).find((g: any) => g.canvas === canvas);
              if (!canvas || !gl || gl.isContextLost()) return resolve("no-live-context");
              const px = new Uint8Array(canvas.width * canvas.height * 4);
              gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
              let h = 2166136261;
              for (let i = 0; i < px.length; i += 7) h = Math.imul(h ^ px[i], 16777619);
              resolve(`${h >>> 0}:${px.some((v) => v !== 0) ? "painted" : "blank"}`);
            });
          })
      );
    await expect
      .poll(
        async () => {
          const a = await sample();
          await page.waitForTimeout(400);
          const b = await sample();
          console.log(`[context-loss ${item}] ${a} -> ${b}`);
          return a !== b && !a.startsWith("no-live") && !b.startsWith("no-live") && b.endsWith("painted");
        },
        { timeout: 20000, message: "canvas must be painting new pixels again after the context is restored" }
      )
      .toBe(true);
  });
  test("a context lost for good, then scrolled away and back, gets a fresh working canvas (lease re-acquire after loss)", async ({ page }) => {
    if (item === "ember-core") await needsGpuForTier3(page);
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
      const spacer = document.createElement("div");
      spacer.style.height = "4000px";
      document.body.appendChild(spacer);
    });

    // lose the context and NEVER restore it (some browsers/drivers do not)
    await page.evaluate(() => {
      const gls = (window as any).__gls || [];
      const gl = gls.find((g: any) => g.canvas.isConnected) || gls[gls.length - 1];
      gl.getExtension("WEBGL_lose_context").loseContext();
    });
    await expect(canvas.first()).toBeHidden();

    // scroll away until the item releases its lease, then come back
    await page.evaluate(() => window.scrollTo(0, 3500));
    await expect(page.locator(`[data-frictionborn-item='${item}'] canvas`)).toHaveCount(0, { timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, 0));

    const sample = () =>
      page.evaluate(
        () =>
          new Promise<string>((resolve) => {
            requestAnimationFrame(() => {
              const c = document.querySelector("[data-frictionborn-item] canvas") as HTMLCanvasElement | null;
              const gl = ((window as any).__gls || []).find((g: any) => g.canvas === c);
              if (!c || !gl || gl.isContextLost()) return resolve("no-live-context");
              const px = new Uint8Array(c.width * c.height * 4);
              gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
              let h = 2166136261;
              for (let i = 0; i < px.length; i += 7) h = Math.imul(h ^ px[i], 16777619);
              resolve(`${h >>> 0}:${px.some((v) => v !== 0) ? "painted" : "blank"}`);
            });
          }),
      );
    await expect
      .poll(
        async () => {
          const a = await sample();
          await page.waitForTimeout(400);
          const b = await sample();
          return a !== b && !a.startsWith("no-live") && !b.startsWith("no-live") && b.endsWith("painted");
        },
        { timeout: 20000, message: "after a permanent context loss and a scroll away and back, the canvas must paint again (a new GL instance, not a suspended one)" },
      )
      .toBe(true);
  });

});
